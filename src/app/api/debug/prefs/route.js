import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const users = await prisma.user.findMany({
    where: { role: 'student' },
    select: {
      id: true,
      fullName: true,
      preferences: true,
      moodChecks: { select: { createdAt: true }, take: 1, orderBy: { createdAt: 'desc' } }
    }
  });
  return NextResponse.json(users);
}
