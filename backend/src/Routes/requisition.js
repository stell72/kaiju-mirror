const express = require('express');
const prisma = require('../Config/prisma');
const requireAuth = require('../Middleware/required_auth');
const { canPerform } = require('../Rules/permission');
const { wouldViolateRetention } = require('../Rules/retention');

const router = express.Router();
router.use(requireAuth);

async function getCurrentLevel() {
  const latest = await prisma.disasterLevelLog.findFirst({
    orderBy: { changedAt: 'desc' },
  });
  return latest ? latest.level : 1;
}

router.post('/', async (req, res) => {
  const level = await getCurrentLevel();
  if (!canPerform(req.user.role, 'REQUISITION', level)) {
    return res.status(403).json({ code: 'PERMISSION_DENIED', message: 'Requisition requires CD, Level 4+.' });
  }

  const { fromQuarterId, toQuarterId, resourceTypeId, quantity } = req.body;

  const [fromStock, toStock] = await Promise.all([
    prisma.quarterStock.findUnique({
      where: { quarterId_resourceTypeId: { quarterId: fromQuarterId, resourceTypeId } },
    }),
    prisma.quarterStock.findUnique({
      where: { quarterId_resourceTypeId: { quarterId: toQuarterId, resourceTypeId } },
    }),
  ]);

  if (!fromStock) return res.status(404).json({ code: 'NOT_FOUND', message: 'No matching stock record for source quarter.' });
  if (!toStock) return res.status(404).json({ code: 'NOT_FOUND', message: 'No matching stock record for destination quarter.' });

  if (wouldViolateRetention(fromStock.currentQuantity, fromStock.retentionMin, quantity)) {
    await prisma.rejectionLog.create({
      data: {
        userId: req.user.userId,
        ruleViolated: 'RETENTION_VIOLATION',
        httpStatusCode: 409,
        message: 'Requisition would breach retention minimum.',
        attemptedPayload: req.body,
      },
    });
    return res.status(409).json({ code: 'RETENTION_VIOLATION', message: 'Requisition would breach retention minimum.' });
  }

  const now = new Date();
  const [, , request] = await prisma.$transaction([
    prisma.quarterStock.update({
      where: { quarterId_resourceTypeId: { quarterId: fromQuarterId, resourceTypeId } },
      data: { currentQuantity: { decrement: quantity } },
    }),
    prisma.quarterStock.update({
      where: { quarterId_resourceTypeId: { quarterId: toQuarterId, resourceTypeId } },
      data: { currentQuantity: { increment: quantity } },
    }),
    prisma.transferRequest.create({
      data: {
        requestedByUserId: req.user.userId,
        fromQuarterId, toQuarterId, resourceTypeId, quantity,
        routeType: 'DIRECT',
        status: 'COMPLETED',
        disasterLevelAtCreation: level,
        scheduledStartAt: now,
        scheduledEndAt: now,
      },
    }),
  ]);

  const io = req.app.get('io');
  io.to(`quarter:${fromQuarterId}`).to(`quarter:${toQuarterId}`).emit('resource:updated', { resourceTypeId });

  res.status(201).json(request);
});

module.exports = router;