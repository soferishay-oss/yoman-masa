import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req) {
  try {
    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const tenantId = auth?.tenantId;

    let aiCorrectionLevel = 'phrasing';
    if (tenantId) {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      if (tenant?.themeConfig?.aiCorrectionLevel) {
        aiCorrectionLevel = tenant.themeConfig.aiCorrectionLevel;
      }
    }

    let instruction = '';
    switch (aiCorrectionLevel) {
      case 'spelling_only':
        instruction = 'המטרה שלך היא לתקן אך ורק שגיאות כתיב והקלדה בטקסט. חובה עליך לא לשנות מילים תקינות, לא להוסיף או לשנות סימני פיסוק, ולא לשנות את התחביר כלל.';
        break;
      case 'spelling_punctuation':
        instruction = 'המטרה שלך היא לתקן שגיאות כתיב ולהוסיף סימני פיסוק חסרים (כגון פסיקים ונקודות) כדי שהטקסט יהיה קריא. אל תשנה את המילים והתחביר מעבר לכך.';
        break;
      case 'phrasing':
      default:
        instruction = 'המטרה שלך היא לתקן שגיאות כתיב, לשפר את התחביר והפיסוק, ולסגנן את הטקסט בצורה זורמת וטבעית יותר, מבלי לשנות את משמעות הדברים או לאבד מהאופי האישי של הדובר.';
        break;
    }

    const prompt = `
אתה עוזר כתיבה מקצועי. 
${instruction}

הנה הטקסט שהקליט/הקליד המשתמש:
"${text}"

אנא החזר אך ורק את הטקסט המתוקן, ללא הקדמות, מרכאות עודפות או הסברים.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const fixedText = response.text.trim();

    return NextResponse.json({ fixedText });
  } catch (error) {
    console.error('Error fixing phrasing:', error);
    return NextResponse.json({ error: 'Failed to fix phrasing' }, { status: 500 });
  }
}
