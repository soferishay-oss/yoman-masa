import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, phoneNumber, password } = body;

    if (!password || (!email && !phoneNumber)) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phoneNumber: phoneNumber || undefined }
        ]
      },
      include: {
        tenant: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create JWT Token including Tenant ID for RBAC isolation
    const tokenPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      subRole: user.subRole,
    };
    
    const token = await signToken(tokenPayload);

    // Set cookie
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant.name
      }
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
