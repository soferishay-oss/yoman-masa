import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function update() {
  const stations = await prisma.journeyStation.findMany();
  for (const station of stations) {
    let qs = station.questions;
    if (Array.isArray(qs)) {
      let modified = false;
      qs = qs.map(q => {
        if (q.id === 'mood' || q.id === 'summary_mood') {
          q.options = ['על הפנים', 'רע', 'סביר', 'טוב', 'מצוין'];
          modified = true;
        }
        return q;
      });
      if (modified) {
        await prisma.journeyStation.update({
          where: { id: station.id },
          data: { questions: qs }
        });
        console.log('Updated station:', station.title);
      }
    }
  }
}

update().then(() => {
  console.log('done');
  process.exit(0);
});
