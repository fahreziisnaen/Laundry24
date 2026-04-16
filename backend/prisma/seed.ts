import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Roles ────────────────────────────────────────────────────
  const roles = await Promise.all([
    prisma.role.upsert({ where: { name: 'OWNER' },  update: {}, create: { name: 'OWNER',    permissions: ['*'] } }),
    prisma.role.upsert({ where: { name: 'ADMIN' },  update: {}, create: { name: 'ADMIN',    permissions: ['orders.*','customers.*','reports.*','inventory.*'] } }),
    prisma.role.upsert({ where: { name: 'STAFF' },  update: {}, create: { name: 'STAFF',    permissions: ['orders.*','customers.read'] } }),
    prisma.role.upsert({ where: { name: 'DRIVER' }, update: {}, create: { name: 'DRIVER',   permissions: ['delivery.*'] } }),
    prisma.role.upsert({ where: { name: 'CUSTOMER'}, update: {}, create: { name: 'CUSTOMER', permissions: ['orders.own'] } }),
  ]);
  console.log(`✅ Roles: ${roles.map(r => r.name).join(', ')}`);

  // ── Outlet ───────────────────────────────────────────────────
  const outlet = await prisma.outlet.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Laundry24 - Pusat', address: 'Jl. Sudirman No. 1', phone: '02112345678', city: 'Jakarta' },
  });
  console.log(`✅ Outlet: ${outlet.name}`);

  // ── Owner user ───────────────────────────────────────────────
  const ownerRole = roles.find(r => r.name === 'OWNER')!;
  const owner = await prisma.user.upsert({
    where: { email: 'owner@laundry24.com' },
    update: {},
    create: {
      name: 'Admin Owner',
      email: 'owner@laundry24.com',
      phone: '08111111111',
      passwordHash: await bcrypt.hash('owner123', 12),
      roleId: ownerRole.id,
      outletId: outlet.id,
    },
  });
  console.log(`✅ Owner: ${owner.email}`);

  // ── Staff user ───────────────────────────────────────────────
  const staffRole = roles.find(r => r.name === 'STAFF')!;
  const staff = await prisma.user.upsert({
    where: { email: 'staff@laundry24.com' },
    update: {},
    create: {
      name: 'Staff Demo',
      email: 'staff@laundry24.com',
      phone: '08222222222',
      passwordHash: await bcrypt.hash('staff123', 12),
      roleId: staffRole.id,
      outletId: outlet.id,
    },
  });
  console.log(`✅ Staff: ${staff.email}`);

  // ── Employee records ─────────────────────────────────────────
  await prisma.employee.upsert({
    where: { id: 1 },
    update: {},
    create: {
      userId: owner.id,
      outletId: outlet.id,
      employeeCode: 'EMP-1-0001',
      position: 'Owner / Manager',
      hireDate: new Date('2023-01-01'),
      baseSalary: 10000000,
    },
  });

  await prisma.employee.upsert({
    where: { id: 2 },
    update: {},
    create: {
      userId: staff.id,
      outletId: outlet.id,
      employeeCode: 'EMP-1-0002',
      position: 'Operator Laundry',
      hireDate: new Date('2023-03-15'),
      baseSalary: 3500000,
    },
  });
  console.log('✅ Employee records created');

  // ── Service Types ─────────────────────────────────────────────
  await Promise.all([
    prisma.serviceType.upsert({
      where: { id: 1 },
      update: {},
      create: { name: 'Kiloan Reguler', code: 'KILOAN', basePrice: 7000, unit: 'kg', slaHours: 24 },
    }),
    prisma.serviceType.upsert({
      where: { id: 2 },
      update: {},
      create: { name: 'Satuan', code: 'SATUAN', basePrice: 15000, unit: 'pcs', slaHours: 48 },
    }),
    prisma.serviceType.upsert({
      where: { id: 3 },
      update: {},
      create: { name: 'Express (6 Jam)', code: 'EXPRESS', basePrice: 12000, unit: 'kg', slaHours: 6 },
    }),
  ]);
  console.log('✅ Service types created');

  // ── Sample customer ───────────────────────────────────────────
  const customer = await prisma.customer.upsert({
    where: { phone: '08512345678' },
    update: {},
    create: {
      name: 'Budi Santoso',
      phone: '08512345678',
      email: 'budi@example.com',
      outletId: outlet.id,
      walletBalance: 50000,
      loyaltyPoints: 100,
      auth: {
        create: { passwordHash: await bcrypt.hash('customer123', 12) },
      },
    },
  });
  console.log(`✅ Customer: ${customer.name}`);

  // ── Sample inventory ──────────────────────────────────────────
  await Promise.all([
    prisma.inventoryItem.upsert({
      where: { id: 1 }, update: {},
      create: { outletId: outlet.id, name: 'Deterjen Attack 1Kg', category: 'DETERGENT', unit: 'kg', stock: 50, minStock: 10, costPerUnit: 15000 },
    }),
    prisma.inventoryItem.upsert({
      where: { id: 2 }, update: {},
      create: { outletId: outlet.id, name: 'Pewangi Molto', category: 'SOFTENER', unit: 'liter', stock: 20, minStock: 5, costPerUnit: 25000 },
    }),
    prisma.inventoryItem.upsert({
      where: { id: 3 }, update: {},
      create: { outletId: outlet.id, name: 'Plastik Laundry', category: 'PLASTIC', unit: 'pcs', stock: 500, minStock: 100, costPerUnit: 500 },
    }),
  ]);
  console.log('✅ Inventory items created');

  // ── Sample washing machine ────────────────────────────────────
  await prisma.machine.upsert({
    where: { id: 1 }, update: {},
    create: { outletId: outlet.id, name: 'Mesin Cuci 1', type: 'WASHER', capacityKg: 10, nfcUid: 'NFC-001' },
  });
  console.log('✅ Machine created');

  // ── Sample promo ──────────────────────────────────────────────
  await prisma.promotion.upsert({
    where: { code: 'WELCOME10' }, update: {},
    create: {
      code: 'WELCOME10', name: 'Welcome Discount 10%',
      type: 'PERCENT', value: 10, minOrder: 20000,
      validFrom: new Date('2024-01-01'), validUntil: new Date('2025-12-31'),
    },
  });
  console.log('✅ Promo created');

  console.log('\n🎉 Seed complete!');
  console.log('─────────────────────────────────────────');
  console.log('Owner login:    owner@laundry24.com / owner123');
  console.log('Staff login:    staff@laundry24.com / staff123');
  console.log('Customer login: 08512345678 / customer123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
