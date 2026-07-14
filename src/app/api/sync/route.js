import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

let prismaClientInstance;
function getPrisma() {
  if (!prismaClientInstance) prismaClientInstance = new PrismaClient();
  return prismaClientInstance;
}

export async function POST(request) {
  try {
    const prisma = getPrisma();
    const action = await request.json();
    const userId = request.headers.get('x-user-id');
    const tenantId = request.headers.get('x-tenant-id');

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Process actions based on type
    switch (action.actionType) {
      case 'CREATE_JOURNAL_ENTRY':
        await prisma.contentEntry.create({
          data: {
            tenantId,
            ownerUserId: userId,
            type: 'journal',
            title: action.payload.title,
            bodyText: action.payload.bodyText,
            visibility: action.payload.visibility || 'private',
            status: 'submitted',
            submittedAt: new Date(action.timestamp), // Trust client timestamp initially for MVP offline logs
          }
        });
        break;
      
      case 'SUBMIT_MOOD':
        await prisma.moodCheck.create({
          data: {
            tenantId,
            userId,
            frequency: 'weekly',
            ratingType: action.payload.ratingType || 'numeric',
            ratingValue: action.payload.ratingValue,
            explanation: action.payload.explanation,
            createdAt: new Date(action.timestamp),
          }
        });
        break;

      default:
        console.warn('Unknown sync action type:', action.actionType);
        return NextResponse.json({ error: 'Unknown action type' }, { status: 400 });
    }

    // Success response indicating client can remove from queue
    return NextResponse.json({ success: true, processedActionId: action.id });
  } catch (error) {
    console.error('Sync API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
