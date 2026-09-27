const { UserRole, RouteType } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = require('../src/Config/prisma');


const QUARTERS = [
  { code: 'A', name: 'Apex', seaAccess: false },
  { code: 'E', name: 'Echo', seaAccess: true },
  { code: 'W', name: 'Warden', seaAccess: false },
  { code: 'X', name: 'Xeno', seaAccess: true },
  { code: 'Z', name: 'Zion', seaAccess: true },
];

const ADJACENCY_PAIRS = [
  ['A', 'E'],
  ['A', 'W'],
  ['A', 'X'],
  ['E', 'X'],
  ['W', 'X'],
  ['W', 'Z'],
  ['X', 'Z'],
];

const RESOURCE_TYPES = [
  {
    code: 'MEDICAL_PERSONNEL',
    name: 'Medical personnel',
    description: 'Doctors, nurses, and paramedics deployable to treat casualties in a disaster zone.',
  },
  {
    code: 'RESCUE_TEAMS',
    name: 'Rescue teams',
    description: 'Trained crews for search-and-rescue operations in collapsed or damaged structures.',
  },
  {
    code: 'TRANSPORT_VEHICLES',
    name: 'Transport vehicles',
    description: 'Trucks and other ground vehicles used to move personnel, equipment, and supplies between quarters.',
  },
  {
    code: 'EMERGENCY_SHELTERS',
    name: 'Emergency shelters',
    description: 'Temporary housing units for displaced residents following a Kaiju-related disaster.',
  },
  {
    code: 'FOOD_WATER_SUPPLIES',
    name: 'Food & water supplies',
    description: 'Rationed food and potable water stocks for affected populations and response teams.',
  },
  {
    code: 'COMMUNICATION_EQUIPMENT',
    name: 'Communication equipment',
    description: 'Radios and field communication gear used to coordinate response efforts across quarters.',
  },
  {
    code: 'POWER_GENERATORS',
    name: 'Power generators',
    description: 'Portable generators providing emergency electricity to hospitals, shelters, and command posts.',
  },
  {
    code: 'ENGINEERING_CREWS',
    name: 'Engineering crews',
    description: 'Structural and civil engineers assessing and stabilizing damaged infrastructure.',
  },
  {
    code: 'SECURITY_UNITS',
    name: 'Security units',
    description: 'Personnel maintaining order, securing evacuation routes, and protecting critical sites.',
  },
  {
    code: 'HAZMAT_EQUIPMENT',
    name: 'Hazmat equipment',
    description: 'Protective gear and containment tools for handling hazardous materials released during a disaster.',
  },
];

const STOCK = {
  MEDICAL_PERSONNEL: { A: [12, 4], E: [5, 2], W: [8, 3], X: [3, 1], Z: [7, 3] },
  RESCUE_TEAMS: { A: [4, 2], E: [9, 3], W: [3, 1], X: [6, 2], Z: [5, 2] },
  TRANSPORT_VEHICLES: { A: [6, 2], E: [3, 1], W: [10, 3], X: [4, 2], Z: [7, 3] },
  EMERGENCY_SHELTERS: { A: [8, 3], E: [6, 2], W: [4, 2], X: [10, 3], Z: [2, 1] },
  FOOD_WATER_SUPPLIES: { A: [5, 2], E: [8, 3], W: [6, 2], X: [7, 3], Z: [9, 3] },
  COMMUNICATION_EQUIPMENT: { A: [3, 1], E: [7, 3], W: [5, 2], X: [8, 3], Z: [4, 2] },
  POWER_GENERATORS: { A: [7, 3], E: [2, 1], W: [9, 3], X: [5, 2], Z: [6, 2] },
  ENGINEERING_CREWS: { A: [2, 1], E: [6, 2], W: [7, 3], X: [4, 2], Z: [8, 3] },
  SECURITY_UNITS: { A: [9, 3], E: [4, 2], W: [2, 1], X: [6, 2], Z: [3, 1] },
  HAZMAT_EQUIPMENT: { A: [3, 1], E: [5, 2], W: [4, 2], X: [2, 1], Z: [10, 3] },
};

const DEFAULT_PASSWORD = 'ChangeMe123!'; 



async function cleanDatabase() {
  await prisma.rejectionLog.deleteMany();
  await prisma.requestApproval.deleteMany();
  await prisma.disasterLevelLog.deleteMany();
  await prisma.transferRequest.deleteMany();
  await prisma.quarterStock.deleteMany();
  await prisma.adjacencyRoute.deleteMany();
  await prisma.user.deleteMany();
  await prisma.resourceType.deleteMany();
  await prisma.quarter.deleteMany();
}

async function seedQuarters() {
  const idByCode = {};

  for (const q of QUARTERS) {
    const created = await prisma.quarter.create({
      data: {
        code: q.code,
        name: q.name,
        seaAccess: q.seaAccess,
      },
    });
    idByCode[q.code] = created.id;
  }

  return idByCode;
}

async function seedAdjacencyRoutes(quarterIds) {
  const rows = [];

  for (const [a, b] of ADJACENCY_PAIRS) {
    rows.push({ fromQuarterId: quarterIds[a], toQuarterId: quarterIds[b], routeType: RouteType.DIRECT });
    rows.push({ fromQuarterId: quarterIds[b], toQuarterId: quarterIds[a], routeType: RouteType.DIRECT });
  }

  await prisma.adjacencyRoute.createMany({ data: rows });
}

async function seedResourceTypes() {
  const idByCode = {};

  for (const r of RESOURCE_TYPES) {
    const created = await prisma.resourceType.create({
      data: { code: r.code, name: r.name, description: r.description },
    });
    idByCode[r.code] = created.id;
  }

  return idByCode;
}

async function seedQuarterStocks(quarterIds, resourceIds) {
  const rows = [];

  for (const resourceCode of Object.keys(STOCK)) {
    for (const quarterCode of Object.keys(STOCK[resourceCode])) {
      const [initialQuantity, retentionMin] = STOCK[resourceCode][quarterCode];
      rows.push({
        quarterId: quarterIds[quarterCode],
        resourceTypeId: resourceIds[resourceCode],
        initialQuantity,
        currentQuantity: initialQuantity,
        retentionMin,
      });
    }
  }

  await prisma.quarterStock.createMany({ data: rows });
}

async function seedUsers(quarterIds) {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const cityDirector = await prisma.user.create({
    data: {
      email: 'cd@tokyork.gov',
      passwordHash,
      role: UserRole.CD,
      assignedQuarterId: null,
    },
  });

  await prisma.user.create({
    data: {
      email: 'lc@tokyork.gov',
      passwordHash,
      role: UserRole.LC,
      assignedQuarterId: null,
    },
  });

  for (const q of QUARTERS) {
    for (const n of [1, 2]) {
      await prisma.user.create({
        data: {
          email: `qc.${q.name.toLowerCase()}.${n}@tokyork.gov`,
          passwordHash,
          role: UserRole.QC,
          assignedQuarterId: quarterIds[q.code],
        },
      });
    }
  }

  return cityDirector;
}

async function seedDisasterLevel(changedByUserId) {
  await prisma.disasterLevelLog.create({
    data: {
      level: 3,
      changedByUserId,
      reason: 'Kaiju activity confirmed near Xeno — escalating to Emergency (Level 3): adjacent-quarter transfers now authorized under QC approval.',
    },
  });
}

async function main() {
  console.log('Cleaning database...');
  await cleanDatabase();

  console.log('Seeding quarters...');
  const quarterIds = await seedQuarters();

  console.log('Seeding adjacency routes...');
  await seedAdjacencyRoutes(quarterIds);

  console.log('Seeding resource types...');
  const resourceIds = await seedResourceTypes();

  console.log('Seeding quarter stocks (initial quantities + retention thresholds)...');
  await seedQuarterStocks(quarterIds, resourceIds);

  console.log('Seeding users (1 CD, 1 LC, 2 QC per quarter)...');
  const cityDirector = await seedUsers(quarterIds);

  console.log('Seeding disaster level (Level 3 - Emergency)...');
  await seedDisasterLevel(cityDirector.id);

  console.log('Seed completed successfully.');
  console.log(`Default password for all seeded users: ${DEFAULT_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });