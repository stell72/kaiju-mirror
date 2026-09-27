const express = require('express');
const prisma = require('../Config/prisma');
const requireAuth = require('../Middleware/required_auth');

const router = express.Router();
router.use(requireAuth);


router.get('/', async (req, res) => {
  const quarters = await prisma.quarter.findMany({
    orderBy: { code: 'asc' },
  });
  res.json(quarters);
});


router.get('/:id/stock', async (req, res) => {
  const quarterId = Number(req.params.id);

  const quarter = await prisma.quarter.findUnique({ where: { id: quarterId } });
  if (!quarter) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Quarter not found.' });
  }

  const stock = await prisma.quarterStock.findMany({
    where: { quarterId },
    include: { resourceType: true },
    orderBy: { resourceType: { name: 'asc' } },
  });

  res.json(
    stock.map((s) => ({
      resourceTypeId: s.resourceTypeId,
      resourceName: s.resourceType.name,
      currentQuantity: s.currentQuantity,
      initialQuantity: s.initialQuantity,
      retentionMin: s.retentionMin,
    }))
  );
});

router.get('/:id/adjacent', async (req, res) => {
  const quarterId = Number(req.params.id);
 
  const quarter = await prisma.quarter.findUnique({ where: { id: quarterId } });
  if (!quarter) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Quarter not found.' });
  }
 
  const routes = await prisma.adjacencyRoute.findMany({
    where: { fromQuarterId: quarterId },
    include: { toQuarter: true },
  });
 
  res.json(
    routes.map((r) => ({
      quarterId: r.toQuarterId,
      code: r.toQuarter.code,
      name: r.toQuarter.name,
      routeType: r.routeType,
    }))
  );
});
 


module.exports = router;