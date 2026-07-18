const { GoogleGenAI } = require('@google/genai');
const aiResponse = { text: "```json\n{\n  \"isApproved\": false,\n  \"reason\": \"איום מפורש באלימות.\"\n}\n```" };

try {
  let text = aiResponse.text;
  if (text.startsWith('```json')) {
    text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
  }
  const result = JSON.parse(text);
  console.log("Success:", result);
} catch (e) {
  console.error("Failed:", e.message);
}
