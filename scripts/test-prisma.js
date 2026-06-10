const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const transfers = await prisma.assetTransfer.findMany();
    console.log("Transfers found:", transfers.length);
  } catch (error) {
    console.error("Error querying:", error);
  } finally {
    await prisma.$disconnect();
  }
}
main();
