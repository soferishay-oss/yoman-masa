import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const tenantId = auth?.tenantId;
    const role = auth?.role?.toLowerCase();

    if (!tenantId || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized missing headers' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Failed to fetch tenant:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    const tenantId = auth?.tenantId;
    const role = auth?.role?.toLowerCase();

    if (!tenantId || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized missing headers' }, { status: 401 });
    }

    const data = await request.json();
    
    // We only allow updating specific fields
    const updateData = {};
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slogan !== undefined) updateData.slogan = data.slogan;
    if (data.dateMode !== undefined) updateData.dominantDateMode = data.dateMode;
    if (data.institutionType !== undefined) updateData.institutionType = data.institutionType;
    if (data.studyYears !== undefined) updateData.studyYears = parseInt(data.studyYears, 10);
    if (data.moderationLevel !== undefined) updateData.moderationLevel = parseInt(data.moderationLevel, 10);
    if (data.nameFormat !== undefined) updateData.nameFormat = data.nameFormat;
    if (data.primaryColor !== undefined) {
      updateData.themeConfig = { primaryColor: data.primaryColor };
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData
    });

    return NextResponse.json(updatedTenant);
  } catch (error) {
    console.error('Failed to update tenant:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
