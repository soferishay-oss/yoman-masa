import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // Check if tenant exists, or create one
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          schoolName: 'בית ספר טסט',
          slogan: 'הכל אפשרי',
        }
      });
    }

    // Check if group exists, or create one
    let group = await prisma.group.findFirst({ where: { tenantId: tenant.id } });
    if (!group) {
      group = await prisma.group.create({
        data: {
          tenantId: tenant.id,
          name: 'קבוצת טסט',
          type: 'class'
        }
      });
    }

    const passwordHash = await bcrypt.hash('123456', 10);

    // 1. Admin
    await prisma.user.upsert({
      where: { phoneNumber: '0501111111' },
      update: { role: 'admin', fullName: 'מנהל ישראלי', tenantId: tenant.id },
      create: {
        tenantId: tenant.id,
        fullName: 'מנהל ישראלי',
        phoneNumber: '0501111111',
        passwordHash,
        role: 'admin',
      }
    });

    // 2. Staff
    await prisma.user.upsert({
      where: { phoneNumber: '0502222222' },
      update: { role: 'staff', fullName: 'מורה ישראלי', tenantId: tenant.id, groupId: group.id },
      create: {
        tenantId: tenant.id,
        fullName: 'מורה ישראלי',
        phoneNumber: '0502222222',
        passwordHash,
        role: 'staff',
        groupId: group.id
      }
    });

    // 3. Student
    await prisma.user.upsert({
      where: { phoneNumber: '0503333333' },
      update: { role: 'student', fullName: 'תלמיד ישראלי', tenantId: tenant.id, groupId: group.id },
      create: {
        tenantId: tenant.id,
        fullName: 'תלמיד ישראלי',
        phoneNumber: '0503333333',
        passwordHash,
        role: 'student',
        groupId: group.id
      }
    });

    return NextResponse.json({ success: true, message: 'המשתמשים נוצרו בהצלחה' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
