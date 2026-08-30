import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    
    if (!auth || !['admin', 'staff', 'owner'].includes(auth.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Fetch the journey with its stations and responses
    const journey = await prisma.journey.findUnique({
      where: { id, tenantId: auth.tenantId },
      include: {
        stations: {
          include: {
            responses: {
              include: { user: { select: { fullName: true } } }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!journey) {
      return NextResponse.json({ error: 'Journey not found' }, { status: 404 });
    }

    // Build the data payload for the AI
    let journeyContext = `שם המסע: ${journey.title}\nתיאור: ${journey.description || 'ללא תיאור'}\n\n`;
    
    journey.stations.forEach(station => {
      journeyContext += `--- תחנה: ${station.title} ---\n`;
      station.responses.forEach(response => {
        journeyContext += `תלמיד: אנונימי\n`;
        Object.entries(response.answers || {}).forEach(([key, val]) => {
          const q = (station.questions || []).find(q => q.id === key);
          const label = q ? q.label : key;
          journeyContext += `- שאלה: ${label} | תשובה: ${val}\n`;
        });
        journeyContext += '\n';
      });
      journeyContext += '\n';
    });

    const prompt = `
מוצגים לפניך נתונים אנונימיים של תלמידים שענו על משוב (רפלקציה) במהלך מסע חינוכי.
עליך להפיק סיכום קצר, פשוט ותכליתי של התשובות עבור הצוות החינוכי.

הנחיות קריטיות:
1. התבסס *אך ורק* על הנתונים המסופקים. אל תמציא מידע, ואל תסיק מסקנות מרחיקות לכת.
2. אם יש מעט מאוד נתונים (למשל רק משתתף אחד או שניים), אל תכתוב "מגמות" ואל תעשה ניתוח פסיכולוגי. פשוט ציין בקצרה מה אותו משתתף כתב.
3. כתוב בצורה עניינית וישירה. בלי הקדמות ארוכות, בלי "בלה בלה", ובלי מילים מפוצצות.
4. בשום פנים ואופן אל תחתום בסוף הדוח עם תואר כלשהו (כמו "היועץ הפדגוגי" או כל דבר דומה).
5. החזר את התשובה בפורמט Markdown פשוט.

הנתונים מהמסע:
${journeyContext}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const insights = response.text.trim();

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}
