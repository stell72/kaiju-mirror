const express = require('express');
const prisma = require('../Config/prisma');
const requireAuth = require('../Middleware/required_auth');
const { getDisasterLevel, setDisasterLevel } = require('../Rules/change_disaster_level'); 

const router = express.Router();
router.use(requireAuth);

router.get('/current_level', async (req, res) => res.json(await getDisasterLevel()));

router.post('/update_level', async (req, res) => {
  const { level, reason } = req.body;
  const result = await setDisasterLevel(level, req.user.userId, req.user.role, reason);
  if (!result.ok) return res.status(result.status).json(result);

  const io = req.app.get('io');
  io.to('broadcast').emit('disaster:level_changed', { level: result.level });
  res.status(201).json(result);
});

router.get('/history', async (req, res) => {
  const history = await prisma.disasterLevelLog.findMany({
    orderBy: { changedAt: 'desc' },
    include: { changedBy: { select: { id: true, email: true, role: true } } },
});
res.json(history);
});

module.exports = router;