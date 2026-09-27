const prisma = require('../Config/prisma');

async function getDisasterLevel() {
  const latest = await prisma.disasterLevelLog.findFirst({
    orderBy: { changedAt: 'desc' },
    include: { changedBy: { select: { id: true, email: true, role: true } } },
  });
  if (!latest) return { level: 1, changedAt: null, changedBy: null };
  return { level: latest.level, changedAt: latest.changedAt, changedBy: latest.changedBy };
}

async function setDisasterLevel(newLevel, changedByUserId, role, reason) {
if (role !== 'CD') {
  return { ok: false, status: 403, code: 'PERMISSION_DENIED', message: 'Only the City Director can change level.' };
}
if (!Number.isInteger(newLevel) || newLevel < 1 || newLevel > 5) {
  return { ok: false, status: 400, code: 'INVALID_INPUT', message: 'Level must be an integer 1-5.' };
}
const log = await prisma.disasterLevelLog.create({
  data: { level: newLevel, changedByUserId, reason },
});

return { ok: true, level: log.level, changedAt: log.changedAt };
}

module.exports = { getDisasterLevel, setDisasterLevel };