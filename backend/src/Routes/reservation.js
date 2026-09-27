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
  if (!canPerform(req.user.role, 'RESERVE_OWN_QUARTER', level)) {
    return res.status(403).json({ code: 'PERMISSION_DENIED', message: 'Reservation not permitted at this level.' });
  }
  if (!req.user.quarterId) {
    return res.status(400).json({ code: 'INVALID_INPUT', message: 'Only QC accounts can reserve.' });
  }

  const { resourceTypeId, quantity } = req.body;

  const stock = await prisma.quarterStock.findUnique({
    where: { quarterId_resourceTypeId: { quarterId: req.user.quarterId, resourceTypeId } },
  });

  if (!stock) return res.status(404).json({ code: 'NOT_FOUND', message: 'No matching stock record.' });
  if (wouldViolateRetention(stock.currentQuantity, stock.retentionMin, quantity)) {
    await prisma.rejectionLog.create({
      data: {
        userId: req.user.userId,
        ruleViolated: 'RETENTION_VIOLATION',
        httpStatusCode: 409,
        message: 'Reservation would breach retention minimum.',
        attemptedPayload: req.body,
      },
    });
    return res.status(409).json({ code: 'RETENTION_VIOLATION', message: 'Reservation would breach retention minimum.' });
  }

  const updated = await prisma.quarterStock.update({
    where: { quarterId_resourceTypeId: { quarterId: req.user.quarterId, resourceTypeId } },
    data: { currentQuantity: { decrement: quantity } },
  });

  const io = req.app.get('io');
  io.to(`quarter:${req.user.quarterId}`).emit('resource:updated', { resourceTypeId });
  res.status(201).json(updated);
});

module.exports = router;