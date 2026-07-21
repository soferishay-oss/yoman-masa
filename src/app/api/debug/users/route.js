import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  const users = await prisma.user.findMany({
    where: { role: { in: ['staff', 'admin'] } },
    select: {
      id: true,
      fullName: true,
      role: true,
      customRole: { select: { name: true, type: true } },
      phoneNumber: true
    }
  });
  return NextResponse.json(users);
}
