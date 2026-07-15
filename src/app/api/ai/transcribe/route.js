import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { GoogleGenAI } from '@google/genai';

export async function POST(request) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo';

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        basicText: "שגיאה: חסר מפתח API של Google Gemini בסביבה.", 
        smartText: "שגיאה: חסר מפתח API של Google Gemini בסביבה.", 
        aiThought: "אנא הגדר את משתנה הסביבה GEMINI_API_KEY במערכת Vercel."
      }, { status: 200 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio');
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio provided' }, { status: 400 });
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString('base64');
    const mimeType = audioFile.type || 'audio/webm';

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `You are a thoughtful AI journaling assistant. 
1. Transcribe the user's audio exactly (basicText).
2. Rewrite the transcription into a beautiful, evocative diary entry in Hebrew (smartText). CRITICAL INSTRUCTION: Improve grammar and style ONLY. Do NOT add new facts, thoughts, or events that the user did not explicitly mention in the audio. Do not invent details.
3. Ask a deep, reflective coaching question based on the entry (aiThought).
Respond ONLY with a valid JSON object containing exactly these three string keys.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: mimeType, data: base64Audio } },
            { text: prompt }
          ]
        }
      ],
      config: { 
        responseMimeType: "application/json" 
      }
    });

    const result = JSON.parse(response.text);

    return NextResponse.json({
      basicText: result.basicText || '',
      smartText: result.smartText || '',
      aiThought: result.aiThought || ''
    }, { status: 200 });

  } catch (error) {
    console.error('AI Transcription error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
