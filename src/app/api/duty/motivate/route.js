import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const userId = auth?.userId;
    const isDutyStudent = auth?.isDutyStudent;

    if (!userId || !isDutyStudent) {
      return NextResponse.json({ error: 'Unauthorized or not a duty student' }, { status: 401 });
    }

    const { targetUserIds, message } = await request.json();

    if (!targetUserIds || !targetUserIds.length || !message) {
      return NextResponse.json({ error: 'Missing target users or message' }, { status: 400 });
    }

    // In a real app, this would integrate with a push notification service (Firebase, OneSignal) 
    // or insert records into a Notifications table.
    // For MVP, we simulate a successful send.
    console.log(`Sending motivation message to ${targetUserIds.length} students: "${message}"`);

    return NextResponse.json({ success: true, count: targetUserIds.length });
  } catch (error) {
    console.error('Duty motivate API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
