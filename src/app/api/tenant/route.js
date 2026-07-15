import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const auth = token ? await verifyToken(token) : null;
    
    let tenantId = auth?.tenantId;

    if (!tenantId) {
       const defaultTenant = await prisma.tenant.findFirst();
       if (!defaultTenant) return NextResponse.json({});
       tenantId = defaultTenant.id;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) return NextResponse.json({});

    let primaryColor = '#1a365d';
    if (tenant.themeConfig && typeof tenant.themeConfig === 'object' && tenant.themeConfig.primaryColor) {
      primaryColor = tenant.themeConfig.primaryColor;
    }

    return NextResponse.json({
      schoolName: tenant.schoolName,
      slogan: tenant.slogan,
      logoUrl: tenant.logoUrl,
      primaryColor: primaryColor
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
