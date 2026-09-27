const express = require('express');
const prisma = require('../Config/prisma');
const requireAuth = require('../Middleware/required_auth');
const { validateTransfer } = require('../Rules/validate_transfer');
const { canPerform } = require('../Rules/permission');
const { wouldViolateRetention } = require('../Rules/retention');

const router = express.Router();
router.use(requireAuth);

const BASE_DELIVERY_MINUTES = 60;
const TRANSIT_HOP_MINUTES = 30;

async function getCurrentLevel() {
  const latest = await prisma.disasterLevelLog.findFirst({
    orderBy: { changedAt: 'desc' },
  });
  return latest ? latest.level : 1;
}

router.get('/', async (req, res) => {
  const { status, toQuarterId, fromQuarterId } = req.query;
  const where = {};
  if (status) where.status = status;
  if (toQuarterId) where.toQuarterId = Number(toQuarterId);
  if (fromQuarterId) where.fromQuarterId = Number(fromQuarterId);
  const requests = await prisma.transferRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { fromQuarter: true, toQuarter: true, resourceType: true, approvals: true },
  });
  res.json(requests);
});

router.post('/request-transfer', async (req, res) => {
  const { fromQuarterId, toQuarterId, resourceTypeId, quantity, scheduledStartAt } = req.body;

  const stock = await prisma.quarterStock.findUnique({
    where: { quarterId_resourceTypeId: { quarterId: fromQuarterId, resourceTypeId } },
  });

  if (!stock) {
    return res.status(404).json({
      code: 'STOCK_NOT_FOUND',
      message: 'No stock record for that quarter/resource combination.',
    });
  }

  const conflicting = await prisma.transferRequest.findFirst({
    where: {
      fromQuarterId, resourceTypeId, status: 'PENDING',
      NOT: { requestedByUserId: req.user.userId },
    },
  });
  if (conflicting) {
    const io = req.app.get('io');
    io.to(`user:${conflicting.requestedByUserId}`).to(`user:${req.user.userId}`)
      .emit('conflict:detected', { resourceTypeId, quarterId: fromQuarterId });
  }

  const level = await getCurrentLevel();

  const result = await validateTransfer({
    role: req.user.role,
    level,
    fromQuarterId,
    toQuarterId,
    currentQuantity: stock.currentQuantity,
    retentionMin: stock.retentionMin,
    quantity,
  });

  if (!result.ok) {
    await prisma.rejectionLog.create({
      data: {
        userId: req.user.userId,
        ruleViolated: result.code,
        httpStatusCode: result.status,
        message: result.message,
        attemptedPayload: req.body,
      },
    });
    return res.status(result.status).json(result);
  }

  const start = scheduledStartAt ? new Date(scheduledStartAt) : new Date();

  let deliveryMinutes;
  if (result.route.routeType === 'MARITIME') {
    deliveryMinutes = BASE_DELIVERY_MINUTES * result.route.deliveryMultiplier; 
  } else if (result.route.routeType === 'TRANSIT') {
    deliveryMinutes = BASE_DELIVERY_MINUTES + TRANSIT_HOP_MINUTES; 
  } else {
    deliveryMinutes = BASE_DELIVERY_MINUTES; 
  }

  const end = new Date(start.getTime() + deliveryMinutes * 60 * 1000);

  const request = await prisma.transferRequest.create({
    data: {
      requestedByUserId: req.user.userId,
      fromQuarterId,
      toQuarterId,
      transitQuarterId: result.route.transitQuarterId ?? null,
      resourceTypeId,
      quantity,
      routeType: result.route.routeType,
      status: 'PENDING',
      disasterLevelAtCreation: level,
      scheduledStartAt: start,
      scheduledEndAt: end,
    },
  });

  res.status(202).json({ ...request, needsApproval: result.needsApproval });
});

router.patch('/:id/reject-transfer', async (req, res) => {
  const request = await prisma.transferRequest.findUnique({ where: { id: Number(req.params.id) } });
  if (!request) return res.status(404).json({ code: 'NOT_FOUND', message: 'Transfer request not found.' });
  if (request.status !== 'PENDING') {
    return res.status(409).json({ code: 'ALREADY_RESOLVED', message: 'Request is no longer pending.' });
  }
  await prisma.$transaction([
    prisma.requestApproval.create({
      data: {
        requestId: request.id,
        approverUserId: req.user.userId,
        approvalStage: 'QC_REVIEW',
        approved: false,
        comment: req.body.reason || null,
      },
    }),
    prisma.transferRequest.update({ where: { id: request.id }, data: { status: 'REJECTED' } }),
  ]);

  const io = req.app.get('io');
  io.to(`user:${request.requestedByUserId}`).emit('transfer:rejected', { requestId: request.id });

  res.json({ status: 'REJECTED' });
});

router.patch('/:id/approve', async (req, res) => {
  const request = await prisma.transferRequest.findUnique({ where: { id: Number(req.params.id) } });
  if (!request) return res.status(404).json({ code: 'NOT_FOUND', message: 'Transfer request not found.' });

  const validEntryStatus = request.routeType === 'DIRECT' ? 'PENDING' : 'READY_TO_EXECUTE';
  if (request.status !== validEntryStatus) {
    return res.status(409).json({
      code: 'NOT_READY',
      message: `Request must be ${validEntryStatus} to execute; current status is ${request.status}.`,
    });
  }

  const level = await getCurrentLevel();
  if (!canPerform(req.user.role, 'APPROVE_TRANSFER', level)) {
    return res.status(403).json({ code: 'PERMISSION_DENIED', message: 'Role not permitted to approve transfers at this level.' });
  }

  const stock = await prisma.quarterStock.findUnique({
    where: { quarterId_resourceTypeId: { quarterId: request.fromQuarterId, resourceTypeId: request.resourceTypeId } },
  });

  if (!stock || wouldViolateRetention(stock.currentQuantity, stock.retentionMin, request.quantity)) {
    await prisma.rejectionLog.create({
      data: {
        userId: req.user.userId,
        ruleViolated: 'RETENTION_VIOLATION',
        httpStatusCode: 409,
        message: 'Executing this transfer would breach retention minimum given current stock.',
        attemptedPayload: { requestId: request.id },
      },
    });
    return res.status(409).json({
      code: 'RETENTION_VIOLATION',
      message: 'Executing this transfer would breach retention minimum given current stock.',
    });
  }

  await prisma.$transaction([
    prisma.quarterStock.update({
      where: { quarterId_resourceTypeId: { quarterId: request.fromQuarterId, resourceTypeId: request.resourceTypeId } },
      data: { currentQuantity: { decrement: request.quantity } },
    }),
    prisma.quarterStock.update({
      where: { quarterId_resourceTypeId: { quarterId: request.toQuarterId, resourceTypeId: request.resourceTypeId } },
      data: { currentQuantity: { increment: request.quantity } },
    }),
    prisma.transferRequest.update({ where: { id: request.id }, data: { status: 'COMPLETED' } }),
  ]);

  const io = req.app.get('io');
  io.to(`quarter:${request.fromQuarterId}`).to(`quarter:${request.toQuarterId}`)
    .emit('resource:updated', { resourceTypeId: request.resourceTypeId });

  res.json({ status: 'COMPLETED' });
});

router.patch('/:id/approve-transit', async (req, res) => {
  const request = await prisma.transferRequest.findUnique({ where: { id: Number(req.params.id) } });
  if (!request) return res.status(404).json({ code: 'NOT_FOUND', message: 'Transfer request not found.' });

  if (request.status !== 'PENDING') {
    return res.status(409).json({ code: 'ALREADY_RESOLVED', message: 'Request is no longer pending.' });
  }
  if (request.routeType === 'DIRECT') {
    return res.status(409).json({ code: 'NO_HOP_REQUIRED', message: 'Direct routes do not require hop approval.' });
  }
  if (!request.transitQuarterId) {
    return res.status(500).json({ code: 'MISSING_TRANSIT_QUARTER', message: 'Transit request has no recorded intermediate quarter.' });
  }

  const level = await getCurrentLevel();
  if (!canPerform(req.user.role, 'ORGANIZE_TRANSIT', level)) {
    return res.status(403).json({ code: 'PERMISSION_DENIED', message: 'Role not permitted to approve transit at this level.' });
  }

  if (req.user.assignedQuarterId !== request.transitQuarterId) {
    return res.status(403).json({
      code: 'WRONG_QUARTER',
      message: 'Only the LC assigned to the intermediate quarter may approve this hop.',
    });
  }

  const stage = request.routeType === 'MARITIME' ? 'MARITIME_HOP' : 'TRANSIT_HOP';

  const existing = await prisma.requestApproval.findFirst({
    where: { requestId: request.id, approverUserId: req.user.userId, approvalStage: stage },
  });
  if (existing) {
    return res.status(409).json({ code: 'ALREADY_APPROVED', message: 'You have already signed off on this hop.' });
  }

  await prisma.requestApproval.create({
    data: {
      requestId: request.id,
      approverUserId: req.user.userId,
      approvalStage: stage,
      approved: true,
    },
  });

  await prisma.transferRequest.update({
    where: { id: request.id },
    data: { status: 'READY_TO_EXECUTE' },
  });
  return res.json({ status: 'READY_TO_EXECUTE' });
});

module.exports = router;