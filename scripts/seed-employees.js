import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  console.log('Seeding employees based on existing assets...');
  const assets = await prisma.asset.findMany({
    select: { user: true },
    where: {
      user: {
        notIn: ['-', '', 'Не призначено']
      }
    }
  });
  const uniqueUsers = [...new Set(assets.map(a => a.user))];
  for (const userName of uniqueUsers) {
    if (!userName) continue;
    const parts = userName.trim().split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    const existing = await prisma.employee.findFirst({
      where: {
        firstName,
        lastName
      }
    });
    if (!existing) {
      await prisma.employee.create({
        data: {
          firstName,
          lastName,
          email: `${firstName.toLowerCase()}.${lastName ? lastName.charAt(0).toLowerCase() : 'user'}@inform-plan.com`,
          position: 'Співробітник',
          department: 'Загальний',
          status: 'Активний'
        }
      });
      console.log(`Created employee: ${firstName} ${lastName}`);
    }
  }
  console.log('Employee seeding complete!');
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
