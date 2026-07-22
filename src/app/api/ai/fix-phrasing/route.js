import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req) {
  try {
    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
אתה עוזר ניסוח לנוער. המטרה שלך היא לתקן שגיאות כתיב, לשפר את התחביר והפיסוק, ולסגנן את הטקסט בצורה זורמת וטבעית יותר, מבלי לשנות את משמעות הדברים או לאבד מהאופי האישי של הדובר. 
הנה הטקסט שהקליט הנער:
"${text}"

אנא החזר רק את הטקסט המתוקן, ללא הקדמות או הסברים.
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
