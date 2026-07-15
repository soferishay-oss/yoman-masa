import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function GET() {
  try {
    // 1. Find a real student
    const student = await prisma.user.findFirst({ where: { role: 'student' } });
    if (!student) return NextResponse.json({ error: 'No student found' }, { status: 404 });

    // Generate token directly
    const stuToken = await signToken({
      userId: student.id,
      tenantId: student.tenantId,
      role: student.role,
      groupId: student.groupId
    });

    // Test Journal Save using fetch directly to the local dev server
    const journalRes = await fetch('http://localhost:3000/api/journal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${stuToken}`
      },
      body: JSON.stringify({ title: 'Simulated Test', content: 'Simulation works!' })
    });

    const journalStatus = journalRes.status;
    const journalBody = await journalRes.text();

    // 2. Find a real staff
    const staff = await prisma.user.findFirst({ where: { role: 'staff' } });
    let staffStatus = 'Skipped', staffBody = '';
    if (staff) {
      const staffToken = await signToken({
        userId: staff.id,
        tenantId: staff.tenantId,
        role: staff.role,
        groupId: staff.groupId
      });

      const taskRes = await fetch('http://localhost:3000/api/staff/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth_token=${staffToken}`
        },
        body: JSON.stringify({ title: 'Simulated Task', description: 'Testing task creation', dueDate: new Date().toISOString() })
      });
      staffStatus = taskRes.status;
      staffBody = await taskRes.text();
    }

    // 3. Find a real admin
    const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
    let adminStatus = 'Skipped', adminBody = '';
    if (admin) {
      const adminToken = await signToken({
        userId: admin.id,
        tenantId: admin.tenantId,
        role: admin.role,
        groupId: admin.groupId
      });

      const adminRes = await fetch('http://localhost:3000/api/admin/tenant', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth_token=${adminToken}`
        },
        body: JSON.stringify({ primaryColor: '#aabbcc' })
      });
      adminStatus = adminRes.status;
      adminBody = await adminRes.text();
    }

    return NextResponse.json({
      success: true,
      studentTest: { status: journalStatus, response: journalBody },
      staffTest: { status: staffStatus, response: staffBody },
      adminTest: { status: adminStatus, response: adminBody }
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
