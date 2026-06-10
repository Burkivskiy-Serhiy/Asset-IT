const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  console.log('Seeding maintenance tasks...');
  const assets = await prisma.asset.findMany();
  if (assets.length === 0) {
    console.log('No assets found. Create some assets first.');
    return;
  }
  const getRandomAsset = () => assets[Math.floor(Math.random() * assets.length)].id;
  const tasks = [
    {
      assetId: getRandomAsset(),
      title: 'Чистка від пилу та заміна термопасти',
      description: 'Повна профілактика системи охолодження через перегрів під навантаженням.',
      scheduledAt: new Date(new Date().setDate(new Date().getDate() + 5)),
      status: 'Заплановано',
      type: 'ТО',
    },
    {
      assetId: getRandomAsset(),
      title: 'Гарантійна заміна батареї',
      description: 'Акумулятор тримає менше 30 хвилин. Відправка до офіційного сервісу.',
      scheduledAt: new Date(new Date().setDate(new Date().getDate() - 2)),
      status: 'Заплановано', 
      type: 'Гарантія',
    },
    {
      assetId: getRandomAsset(),
      title: 'Діагностика жорсткого диска',
      description: 'S.M.A.R.T. видає помилки читання. Перевірка та можливе копіювання даних.',
      scheduledAt: new Date(new Date().setDate(new Date().getDate() - 10)),
      completedAt: new Date(new Date().setDate(new Date().getDate() - 8)),
      status: 'Виконано',
      type: 'ТО',
    },
    {
      assetId: getRandomAsset(),
      title: 'Планове обслуговування принтера/МФУ',
      description: 'Заміна фотобарабана та чистка роликів захоплення паперу.',
      scheduledAt: new Date(new Date().setDate(new Date().getDate() + 14)),
      status: 'Заплановано',
      type: 'ТО',
    },
    {
      assetId: getRandomAsset(),
      title: 'Гарантійний ремонт матриці екрану',
      description: 'З`явилися биті пікселі та смуга збоку. Очікуємо деталь від виробника.',
      scheduledAt: new Date(new Date().setDate(new Date().getDate() + 2)),
      status: 'Заплановано',
      type: 'Гарантія',
    },
    {
      assetId: getRandomAsset(),
      title: 'Апгрейд оперативної пам`яті',
      description: 'Додавання додаткових 16ГБ RAM для потреб розробника.',
      scheduledAt: new Date(new Date().setDate(new Date().getDate() + 1)),
      status: 'Заплановано',
      type: 'ТО',
    }
  ];
  for (const task of tasks) {
    await prisma.maintenanceTask.create({
      data: task
    });
  }
  console.log('Successfully seeded 6 maintenance tasks!');
}
main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
