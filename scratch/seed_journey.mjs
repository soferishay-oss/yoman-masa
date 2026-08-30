import prisma from '../src/lib/prisma.js';

async function seedJourney() {
  const tenant = await prisma.tenant.findFirst();
  
  if (!tenant) {
    console.error("No tenant found!");
    return;
  }

  console.log("Creating journey for tenant:", tenant.name);

  const journey = await prisma.journey.create({
    data: {
      title: 'יומן מסע פתיחה תשפ"ז - מחזור י"ג',
      description: 'בזכות הדברים שתרשום כאן - נוכל לתכנן יחד את הדרך שלך בתקופת המכינה בהצלחה!',
      tenantId: tenant.id,
      stations: {
        create: [
          {
            title: 'חלק א\' - כוחות וסיכום היום',
            order: 1,
            isOpen: true,
            description: `
              <p><strong>איך אתה?</strong> (שתף איך אתה מרגיש עכשיו)</p>
              <p><strong>מה הכוחות שאתה מביא איתך? מה החוזקות שלך?</strong></p>
              <p><strong>מה החולשות שלך? איפה תצטרך חיזוק?</strong></p>
              <p><strong>מה לקחת מהיום הראשון של המסע?</strong></p>
              <p><em>* תוכל גם להקליט את עצמך או לצרף תמונה!</em></p>
            `
          },
          {
            title: 'חלק ב\' - חזון אישי ויעדים',
            order: 2,
            isOpen: false,
            description: `
              <p><strong>איפה אני ביחס לחזון? התייחס לנקודות הבאות מתוך חזון המכינה:</strong></p>
              <ul>
                <li>איש משפחה</li>
                <li>בעל מקצוע</li>
                <li>נאמן למסורת ישראל</li>
                <li>מחובר לעמו ולארצו</li>
                <li>בעל יכולות אישיות גבוהות </li>
                <li>תורם בדרך משמעותית</li>
                <li>מגלה אכפתיות לקהילה ולחברה הסובבת אותו</li>
              </ul>
              <br/>
              <p><strong>יעדים לעצמי:</strong> בוא ושתף מהם 3 היעדים שאתה מציב לעצמך השנה.</p>
            `
          },
          {
            title: 'חלק ג\' - סיכום המסע',
            order: 3,
            isOpen: false,
            description: `
              <p><strong>איך אתה? איך היה המסע?</strong></p>
              <p><strong>מה הדבר המרכזי, החוויה או הזכרון שאתה לוקח איתך מהמסע?</strong></p>
              <p><strong>האם יש עוד משהו שחשוב לך לשתף את הצוות?</strong> (לא חובה)</p>
            `
          }
        ]
      }
    }
  });

  console.log("Journey created with ID:", journey.id);
}

seedJourney()
  .catch(console.error)
  .finally(() => process.exit(0));
