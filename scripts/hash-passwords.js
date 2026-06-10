const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main() {
  console.log('Починаємо міграцію паролів (хешування)...');
  const users = await prisma.user.findMany();
  let updatedCount = 0;
  for (const user of users) {
    if (!user.password.startsWith('$2')) {
      const hashedPassword = bcrypt.hashSync(user.password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      console.log(`✅ Захешовано пароль для: ${user.email}`);
      updatedCount++;
    } else {
      console.log(`⏭️ Пропущено (вже захешований): ${user.email}`);
    }
  }
  console.log(`🎉 Міграція завершена. Оновлено користувачів: ${updatedCount}`);
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
