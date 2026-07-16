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
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `You are a content moderation AI for a youth educational platform in Hebrew.
Analyze the following message. If it contains violence, severe cursing, sexual harassment, bullying, or highly toxic speech, reject it.
Otherwise, approve it.
Respond ONLY with a valid JSON object containing:
- "isApproved": boolean (true if the message is okay, false if it should be rejected)
- "reason": string (if rejected, explain why briefly in Hebrew. If approved, empty string).

Message to check: "${content}"`;

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: { responseMimeType: "application/json" }
        });

        const result = JSON.parse(aiResponse.text);

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
          
          return NextResponse.json({ 
            error: 'ההודעה נפסלה לשליחה. נסח אותה מחדש ושלח שוב', 
            details: result.reason 
          }, { status: 400 });
        }
      } catch (aiError) {
        console.error('AI Moderation error:', aiError);
        // If AI fails, we might want to either block or allow. Let's allow but log.
      }
    }

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

    return NextResponse.json(newLetter, { status: 201 });
  } catch (error) {
    console.error('Failed to create letter:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
