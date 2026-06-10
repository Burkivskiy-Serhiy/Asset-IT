const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const assets = await prisma.asset.findMany();
  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    const now = new Date();
    const isSoon = Math.random() < 0.3;
    let warrantyExpires = new Date();
    if (isSoon) {
      warrantyExpires.setDate(warrantyExpires.getDate() + Math.floor(Math.random() * 30) + 5);
    } else {
      const yearOffset = Math.floor(Math.random() * 4) - 1; 
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
