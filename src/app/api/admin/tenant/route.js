import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const headersList = await request.headers;
    const tenantId = headersList.get('x-tenant-id');
    const role = headersList.get('x-user-role');

    if (!tenantId || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const headersList = await request.headers;
    const tenantId = headersList.get('x-tenant-id');
    const role = headersList.get('x-user-role');

    if (!tenantId || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    // We only allow updating specific fields
    const updateData = {};
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slogan !== undefined) updateData.slogan = data.slogan;
    if (data.dateMode !== undefined) updateData.dominantDateMode = data.dateMode;
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
