import prisma from '../src/lib/prisma.js';

async function seedJourney() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) return;

  // Delete previous journeys to avoid duplicates
  await prisma.journey.deleteMany({
    where: { tenantId: tenant.id }
  });

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
            description: 'סיכום היום הראשון של המסע',
            questions: [
              { id: 'mood', type: 'rating', label: 'איך אתה?', options: \[\'על הפנים\', \'רע\', \'סביר\', \'טוב\', \'מצוין\'\] },
              { id: 'strengths', type: 'open', label: 'מה הכוחות שאתה מביא איתך? מה החוזקות שלך?' },
              { id: 'weaknesses', type: 'open', label: 'מה החולשות שלך? איפה תצטרך חיזוק?' },
              { id: 'takeaway', type: 'open', label: 'מה לקחת מהיום?' }
            ]
          },
          {
            title: 'חלק ב\' - חזון אישי',
            order: 2,
            isOpen: false,
            description: 'איפה אני ביחס לחזון המכינה?',
            questions: [
              { id: 'vision_family', type: 'rating', label: 'איש משפחה', options: ['טעון שיפור', 'בסדר', 'טוב', 'מצוין'] },
              { id: 'vision_prof', type: 'rating', label: 'בעל מקצוע', options: ['טעון שיפור', 'בסדר', 'טוב', 'מצוין'] },
              { id: 'vision_tradition', type: 'rating', label: 'נאמן למסורת ישראל', options: ['טעון שיפור', 'בסדר', 'טוב', 'מצוין'] },
              { id: 'vision_nation', type: 'rating', label: 'מחובר לעמו ולארצו', options: ['טעון שיפור', 'בסדר', 'טוב', 'מצוין'] },
              { id: 'vision_skills', type: 'rating', label: 'בעל יכולות אישיות גבוהות', options: ['טעון שיפור', 'בסדר', 'טוב', 'מצוין'] },
              { id: 'vision_contribute', type: 'rating', label: 'תורם בדרך משמעותית', options: ['טעון שיפור', 'בסדר', 'טוב', 'מצוין'] },
              { id: 'vision_community', type: 'rating', label: 'מגלה אכפתיות לקהילה', options: ['טעון שיפור', 'בסדר', 'טוב', 'מצוין'] }
            ]
          },
          {
            title: 'חלק ג\' - יעדים לעצמי',
            order: 3,
            isOpen: false,
            description: 'בוא ושתף מהם היעדים שאתה מציב לעצמך השנה',
            questions: [
              { id: 'goal_1', type: 'open', label: 'יעד ראשון' },
              { id: 'goal_2', type: 'open', label: 'יעד שני' },
              { id: 'goal_3', type: 'open', label: 'יעד שלישי' }
            ]
          },
          {
            title: 'חלק ד\' - סיכום המסע',
            order: 4,
            isOpen: false,
            description: 'סיכום המסע והחוויות',
            questions: [
              { id: 'summary_mood', type: 'rating', label: 'איך אתה? איך היה המסע?', options: ['על הפנים', 'היה סביר', 'מצויין!'] },
              { id: 'summary_memory', type: 'open', label: 'מה הדבר המרכזי, החוויה או הזכרון שאתה לוקח איתך מהמסע?' },
              { id: 'summary_free', type: 'open', label: 'האם יש עוד משהו שחשוב לך לשתף את הצוות? (לא חובה)' }
            ]
          }
        ]
      }
    }
  });
  console.log("Re-seeded journey with 4 parts and structured questions.");
}

seedJourney().catch(console.error).finally(() => process.exit(0));
