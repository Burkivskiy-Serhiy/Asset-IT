import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const asset = await prisma.asset.findFirst();
  console.log('First asset:', asset);
  
  if (asset) {
    const updated = await prisma.asset.update({
      where: { id: asset.id },
      data: {
        location: '{"office":"Test Office","floor":"99","room":"999"}'
      }
    });
    console.log('Updated asset:', updated);
  }
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
