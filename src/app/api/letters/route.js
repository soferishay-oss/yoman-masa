import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { GoogleGenAI } from '@google/genai';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const userId = auth?.userId;
    const tenantId = auth?.tenantId;

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const letters = await prisma.letter.findMany({
      where: {
        recipientId: userId,
        tenantId: tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true
          }
        }
      }
    });

    return NextResponse.json(letters);
  } catch (error) {
    console.error('Failed to fetch letters:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Optional POST method if they want to write letters
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const userId = auth?.userId;
    const tenantId = auth?.tenantId;

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, recipientId, mediaUrls, aiTranscription, aiThought } = await request.json();

    if (!content && !(mediaUrls && mediaUrls.length > 0)) {
      return NextResponse.json({ error: 'Missing content or media' }, { status: 400 });
    }

    if (content && process.env.GEMINI_API_KEY) {
      try {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        const modLevel = tenant?.moderationLevel || 3;
        
        let modRules = "";
        switch(modLevel) {
          case 1: modRules = "If it contains extreme violence or explicitly illegal content, reject it. Otherwise, approve it. Slang, cursing, and insults are allowed."; break;
          case 2: modRules = "If it contains severe cursing, direct threats, or severe bullying, reject it. Otherwise, approve it. Routine slang and mild teasing are allowed."; break;
          case 3: modRules = "If it contains violence, severe cursing, sexual harassment, bullying, or highly toxic speech, reject it. Otherwise, approve it. Positive or routine slang (like 'מטורף') is allowed."; break;
          case 4: modRules = "If it contains any bad words, insults, crude language, or offensive slang, reject it. Otherwise, approve it. Slang that could be interpreted negatively should be rejected."; break;
          case 5: modRules = "Zero tolerance. If it contains any negative word, hint of violence, impolite language, or any slang with a negative origin (even used positively like 'מטורף' or 'פצצה'), reject it. Must be completely clean and polite."; break;
          default: modRules = "If it contains violence, severe cursing, sexual harassment, bullying, or highly toxic speech, reject it.";
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `You are a content moderation AI for a youth educational platform in Hebrew.
Analyze the following message. ${modRules}
Respond ONLY with a valid JSON object containing:
- "isApproved": boolean (true if the message is okay, false if it should be rejected)
- "reason": string (if rejected, explain why briefly in Hebrew. If approved, empty string).

Message to check: "${content}"`;

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: { responseMimeType: "application/json" }
        });

        let rawText = aiResponse.text;
        if (rawText.startsWith('```json')) {
          rawText = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        } else if (rawText.startsWith('```')) {
          rawText = rawText.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }

        const result = JSON.parse(rawText);

        if (!result.isApproved) {
          // Find sender and recipient names for the alert
          const sender = await prisma.user.findUnique({ where: { id: userId } });
          const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
          
          await prisma.staffAlert.create({
            data: {
              tenantId,
              type: 'message_rejected',
              content: 'נחסמה הודעה פוגענית',
              metadata: {
                senderName: sender?.fullName || 'לא ידוע',
                recipientName: recipient?.fullName || 'לא ידוע',
                messageContent: content,
                reason: result.reason
              }
            }
          });
          
          const customModMsg = tenant?.themeConfig?.moderationMessage || 'ההודעה נפסלה לשליחה, מפני שאיננה עומדת בכללי האתיקה שלנו';
          
          return NextResponse.json({ 
            error: customModMsg, 
            details: result.reason 
          }, { status: 400 });
        }
      } catch (aiError) {
        console.error('AI Moderation error:', aiError);
        // If AI fails, we might want to either block or allow. Let's allow but log.
      }
    }

    const recipientUser = await prisma.user.findUnique({ where: { id: recipientId } });
    
    const newLetter = await prisma.letter.create({
      data: {
        content: content || '',
        authorId: userId,
        recipientId,
        tenantId,
        mediaUrls: mediaUrls || [],
        aiTranscription: aiTranscription || null,
        aiThought: aiThought || null
      }
    });

    if (recipientUser && ['admin', 'staff', 'teacher', 'owner'].includes(recipientUser.role)) {
      const senderUser = await prisma.user.findUnique({ where: { id: userId } });
      await prisma.staffAlert.create({
        data: {
          tenantId,
          type: 'letter',
          content: `מכתב חדש התקבל מ${senderUser?.fullName}`,
          metadata: {
            letterId: newLetter.id,
            senderName: senderUser?.fullName || 'לא ידוע',
            recipientId: recipientUser.id
          }
        }
      });
    }

    return NextResponse.json(newLetter, { status: 201 });
  } catch (error) {
    console.error('Failed to create letter:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
