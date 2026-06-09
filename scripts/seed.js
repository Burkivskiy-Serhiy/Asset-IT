import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding realistic data...');

  // Clean old test data if needed (optional, we use upsert for assets)
  await prisma.license.deleteMany();
  await prisma.ticket.deleteMany();

  // 1. Assets
  const assetsData = [
    { name: 'MacBook Pro 16" M3 Max', category: 'Ноутбук', status: 'active', serialNumber: 'C02F314', inventoryId: 'INV-1001', price: 150000, location: '{"room":"Офіс 1"}', user: 'Ірина М.', brand: 'Apple', model: 'MacBook Pro' },
    { name: 'Dell XPS 15 9530', category: 'Ноутбук', status: 'active', serialNumber: 'DLX953', inventoryId: 'INV-1002', price: 85000, location: '{"room":"Офіс 2"}', user: 'Олександр П.', brand: 'Dell', model: 'XPS 15' },
    { name: 'ThinkPad T14 Gen 4', category: 'Ноутбук', status: 'maintenance', serialNumber: 'TPT14G', inventoryId: 'INV-1003', price: 65000, location: '{"room":"Склад"}', user: 'ІТ Відділ', brand: 'Lenovo', model: 'T14' },
    { name: 'Dell UltraSharp 27"', category: 'Монітор', status: 'active', serialNumber: 'US2723', inventoryId: 'INV-1004', price: 25000, location: '{"room":"Офіс 1"}', user: 'Ірина М.', brand: 'Dell', model: 'U2723QE' },
    { name: 'Cisco Catalyst 9300', category: 'Мережа', status: 'active', serialNumber: 'CS9300', inventoryId: 'INV-1005', price: 120000, location: '{"room":"Серверна"}', user: 'Мережевий адмін', brand: 'Cisco', model: 'Catalyst' },
    { name: 'HP Color LaserJet Pro', category: 'Принтер', status: 'retired', serialNumber: 'HPLJCP', inventoryId: 'INV-1006', price: 15000, location: '{"room":"Склад"}', user: '-', brand: 'HP', model: 'M454dw' },
    { name: 'PowerEdge R750', category: 'Сервер', status: 'active', serialNumber: 'PER750', inventoryId: 'INV-1007', price: 350000, location: '{"room":"Серверна"}', user: 'Системний адмін', brand: 'Dell', model: 'PowerEdge' },
    { name: 'MacBook Air M2', category: 'Ноутбук', status: 'active', serialNumber: 'C02G41', inventoryId: 'INV-1008', price: 55000, location: '{"room":"Відділ продажів"}', user: 'Віталій К.', brand: 'Apple', model: 'MacBook Air' },
    { name: 'Samsung Odyssey G7', category: 'Монітор', status: 'active', serialNumber: 'SOG732', inventoryId: 'INV-1009', price: 30000, location: '{"room":"Відділ дизайну"}', user: 'Анна С.', brand: 'Samsung', model: 'Odyssey G7' },
  ];

  for (const asset of assetsData) {
    await prisma.asset.upsert({
      where: { serialNumber: asset.serialNumber },
      update: asset,
      create: asset,
    });
  }

  // 2. Licenses
  const licensesData = [
    { name: 'Microsoft 365 E3', softwareType: 'Офісне ПЗ', licenseKey: 'M365-XXXX', totalSeats: 50, usedSeats: 45, expirationDate: new Date('2027-12-31') },
    { name: 'Adobe Creative Cloud', softwareType: 'Дизайн', licenseKey: 'ADOBE-XXXX', totalSeats: 10, usedSeats: 10, expirationDate: new Date('2026-06-15') }, // Expires soon
    { name: 'JetBrains All Products', softwareType: 'Розробка', licenseKey: 'JB-XXXX', totalSeats: 20, usedSeats: 18, expirationDate: new Date('2026-11-15') },
    { name: 'Zoom Pro', softwareType: 'Комунікації', licenseKey: 'ZOOM-XXXX', totalSeats: 30, usedSeats: 12, expirationDate: new Date('2028-01-01') },
  ];

  for (const lic of licensesData) {
    await prisma.license.create({ data: lic });
  }

  // 3. Tickets
  const ticketsData = [
    { title: 'Заміна батареї MacBook', description: 'Батарея тримає менше 2 годин', status: 'Відкрито', priority: 'Високий', user: 'Олександр П.' },
    { title: 'Доступ до бази даних', description: 'Потрібен доступ для генерації звітів', status: 'В роботі', priority: 'Середній', user: 'Анна С.' },
    { title: 'Не працює принтер на 3 поверсі', description: 'Застряг папір', status: 'Вирішено', priority: 'Низький', user: 'Ірина М.' },
    { title: '[ПРОСТРОЧЕНО] Оновлення SSL сертифікату', description: 'Термін дії закінчується завтра', status: 'Відкрито', priority: 'Критичний', user: 'Сисадмін' },
  ];

  for (const t of ticketsData) {
    await prisma.ticket.create({ data: t });
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
