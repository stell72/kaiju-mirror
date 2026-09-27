const express = require('express');
const prisma = require('../Config/prisma');
const requireAuth = require('../Middleware/required_auth');
const { canPerform } = require('../Rules/permission');

const router = express.Router();
router.use(requireAuth);

async function getCurrentLevel() {
  const latest = await prisma.disasterLevelLog.findFirst({
    orderBy: { changedAt: 'desc' },
  });
  return latest ? latest.level : 1;
}

router.patch('/:quarterId/stock/:resourceTypeId/retention', async (req, res) => {
  const level = await getCurrentLevel();
  if (!canPerform(req.user.role, 'LOWER_RETENTION', level)) {
    return res.status(403).json({
      code: 'PERMISSION_DENIED',
      message: 'Only the City Director may lower retention, and only at Level 5.',
    });
  }

  const { percent } = req.body;
  if (typeof percent !== 'number' || Number.isNaN(percent) || percent < 0 || percent > 100) {
    return res.status(400).json({ code: 'INVALID_PERCENT', message: 'percent must be a number between 0 and 100.' });
  }

  const quarterId = Number(req.params.quarterId);
  const resourceTypeId = Number(req.params.resourceTypeId);

  const stock = await prisma.quarterStock.findUnique({
    where: { quarterId_resourceTypeId: { quarterId, resourceTypeId } },
  });
  if (!stock) return res.status(404).json({ code: 'NOT_FOUND', message: 'No matching stock record.' });

  const newRetentionMin = Math.ceil(stock.initialQuantity * (percent / 100));
  if (newRetentionMin > stock.retentionMin) {
    return res.status(409).json({
      code: 'NOT_A_LOWER_RETENTION',
      message: 'This route only lowers retention; the given percent would raise it.',
    });
  }

  const updated = await prisma.quarterStock.update({
    where: { quarterId_resourceTypeId: { quarterId, resourceTypeId } },
    data: { retentionMin: newRetentionMin },
  });

  res.json(updated);
});

module.exports = router;