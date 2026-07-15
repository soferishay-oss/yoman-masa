import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const user = await prisma.user.updateMany({
      where: { phoneNumber: '0501234567' },
      data: { role: 'admin' }
    });
    return NextResponse.json({ success: true, updated: user.count });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
