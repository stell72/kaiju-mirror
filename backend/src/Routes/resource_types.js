const express = require('express');
const prisma = require('../Config/prisma');
const requireAuth = require('../Middleware/required_auth');

const router = express.Router();
router.use(requireAuth);


router.get('/', async (req, res) => {
  const resourceTypes = await prisma.resourceType.findMany({
    orderBy: { name: 'asc' },
  });
  res.json(resourceTypes);
});

module.exports = router;