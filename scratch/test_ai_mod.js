require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const prompt = `You are a content moderation AI for a youth educational platform in Hebrew.
Analyze the following message. If it contains violence, severe cursing, sexual harassment, bullying, or highly toxic speech, reject it.
Otherwise, approve it.
Respond ONLY with a valid JSON object containing:
- "isApproved": boolean (true if the message is okay, false if it should be rejected)
- "reason": string (if rejected, explain why briefly in Hebrew. If approved, empty string).

Message to check: "אתה בחור מטורף"`;

ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
  config: { responseMimeType: "application/json" }
}).then(r => console.log(r.text)).catch(e => console.error(e));
