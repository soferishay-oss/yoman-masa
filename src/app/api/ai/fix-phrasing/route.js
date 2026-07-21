import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req) {
  try {
    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
אתה עוזר ניסוח לנוער. המטרה שלך היא לתקן שגיאות כתיב, לשפר את התחביר והפיסוק, ולסגנן את הטקסט בצורה זורמת וטבעית יותר, מבלי לשנות את משמעות הדברים או לאבד מהאופי האישי של הדובר. 
הנה הטקסט שהקליט הנער:
"${text}"

אנא החזר רק את הטקסט המתוקן, ללא הקדמות או הסברים.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const fixedText = response.text().trim();

    return NextResponse.json({ fixedText });
  } catch (error) {
    console.error('Error fixing phrasing:', error);
    return NextResponse.json({ error: 'Failed to fix phrasing' }, { status: 500 });
  }
}
