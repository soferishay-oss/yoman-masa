import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const role = request.headers.get('x-user-role');

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
    const tenantId = request.headers.get('x-tenant-id');
    const role = request.headers.get('x-user-role');

    if (!tenantId || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    // We only allow updating specific fields
    const updateData = {};
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.name !== undefined) updateData.name = data.name;

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData
    });

    return NextResponse.json(updatedTenant);
  } catch (error) {
    console.error('Failed to update tenant:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
