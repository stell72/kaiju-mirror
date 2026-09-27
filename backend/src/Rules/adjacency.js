const prisma = require('../Config/prisma');

async function findRoute(fromQuarterId, toQuarterId) {
  console.log(fromQuarterId, toQuarterId)
  const direct = await prisma.adjacencyRoute.findUnique({
    where: { fromQuarterId_toQuarterId: { fromQuarterId, toQuarterId } },
  });
  console.log(direct)
  if (direct) {
    return {
      path: [fromQuarterId, toQuarterId],
      routeType: direct.routeType,
      deliveryMultiplier: direct.routeType === 'MARITIME' ? 2 : 1,
    };
  }

  const outward_route = await prisma.adjacencyRoute.findMany({ where: { fromQuarterId } });
  console.log(outward_route)
  for (const towards of outward_route) {
    const second = await prisma.adjacencyRoute.findUnique({
      where: { fromQuarterId_toQuarterId: { fromQuarterId: towards.toQuarterId, toQuarterId } },
    });
    if (second) {
      return {
        path: [fromQuarterId, towards.toQuarterId, toQuarterId],
        routeType: 'TRANSIT',
        deliveryMultiplier: 1,
        transitQuarterId: towards.toQuarterId,
      };
    }
  }
  return null;
}

module.exports = { findRoute };