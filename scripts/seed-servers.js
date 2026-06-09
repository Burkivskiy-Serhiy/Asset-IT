const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const servers = [
    { name: 'Nginx Load Balancer 1', ip: '192.168.10.1', type: 'api', status: 'online', cpu: '15', ram: '25', uptime: '02:14:00' },
    { name: 'Nginx Load Balancer 2', ip: '192.168.10.2', type: 'api', status: 'online', cpu: '18', ram: '28', uptime: '02:15:00' },
    { name: 'PostgreSQL Primary', ip: '10.0.1.5', type: 'database', status: 'online', cpu: '45', ram: '80', uptime: '14:20:00' },
    { name: 'PostgreSQL Replica', ip: '10.0.1.6', type: 'database', status: 'online', cpu: '30', ram: '60', uptime: '14:20:00' },
    { name: 'Redis Cache 2', ip: '10.0.2.10', type: 'api', status: 'online', cpu: '8', ram: '12', uptime: '08:00:00' },
    { name: 'Next.js Frontend A', ip: '172.16.0.15', type: 'frontend', status: 'warning', cpu: '85', ram: '40', uptime: '01:05:00' },
    { name: 'Next.js Frontend B', ip: '172.16.0.16', type: 'frontend', status: 'online', cpu: '20', ram: '40', uptime: '01:06:00' },
    { name: 'S3 MinIO Storage', ip: '10.1.5.50', type: 'storage', status: 'online', cpu: '12', ram: '90', uptime: '35:00:00' },
  ];

  console.log('Clearing existing servers...');
  // Optional: await prisma.server.deleteMany(); // We won't delete existing ones, just add.

  console.log('Adding new servers...');
  for (const s of servers) {
    await prisma.server.create({ data: s });
  }
  
  const count = await prisma.server.count();
  console.log(`Successfully added servers. Total servers in DB: ${count}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
