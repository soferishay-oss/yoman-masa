import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const tenants = await prisma.tenant.findMany({
      where: {
        institutionCode: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        institutionCode: true,
        logoUrl: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error('Error fetching public tenants:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
