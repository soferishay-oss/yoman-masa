import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-dev');

export async function POST(request) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Clean phone number (strip spaces/dashes if any)
    const cleanPhone = phoneNumber.replace(/[\s-]/g, '');

    // Look up the user by phone number
    const user = await prisma.user.findFirst({
      where: { phoneNumber: cleanPhone },
      include: { tenant: true } // Need tenant info too
    });

    if (!user) {
      // For development fallback if no user exists, maybe they meant to use standard admin
      // In production, we'd just return 401. Let's keep it strict.
      // But if it's the very first time and NO users exist in the DB, 
      // let's allow a backdoor for the global admin so they aren't locked out.
      const allUsersCount = await prisma.user.count();
      if (allUsersCount === 0 && cleanPhone === '0500000000') {
        const token = await new SignJWT({
          userId: 'dev-admin',
          tenantId: 'dev-tenant',
          role: 'admin'
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('24h')
          .sign(JWT_SECRET);
          
        const response = NextResponse.json({ 
          message: 'Login successful (Dev Admin)',
          user: { role: 'admin', fullName: 'Dev Admin' }
        });
        
        response.cookies.set('auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 // 24 hours
        });
        return response;
      }

      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
    }

    // Generate real JWT
    const token = await new SignJWT({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      groupId: user.groupId
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    const response = NextResponse.json({ 
      message: 'Login successful',
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        tenantName: user.tenant?.name
      }
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
