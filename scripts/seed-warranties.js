const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const assets = await prisma.asset.findMany();
  
  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    
    // Create a random warranty date between 1 year ago and 3 years in the future
    const now = new Date();
    // 30% chance the warranty expires in the next 15-45 days to trigger alerts
    const isSoon = Math.random() < 0.3;
    
    let warrantyExpires = new Date();
    if (isSoon) {
      warrantyExpires.setDate(warrantyExpires.getDate() + Math.floor(Math.random() * 30) + 5);
    } else {
      const yearOffset = Math.floor(Math.random() * 4) - 1; // -1, 0, 1, 2
      warrantyExpires.setFullYear(now.getFullYear() + yearOffset);
      warrantyExpires.setMonth(Math.floor(Math.random() * 12));
      warrantyExpires.setDate(Math.floor(Math.random() * 28) + 1);
    }

    await prisma.asset.update({
      where: { id: asset.id },
      data: { warrantyExpires }
    });
    console.log(`Updated ${asset.name} with warranty ${warrantyExpires.toISOString().split('T')[0]}`);
  }
}

main()
  .then(() => console.log('Warranties seeded successfully!'))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
