require('dotenv').config(); 
const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function run() { 
  try { 
    const tenant = await prisma.tenant.findFirst(); 
    const currentYear = await prisma.academicYear.findFirst({ where: { tenantId: tenant.id, isCurrent: true } }); 
    const classes = await prisma.group.findMany({ where: { type: 'class', tenantId: tenant.id }, include: { managers: true } }); 
    
    const classesUpdate = classes.map(c => ({
      id: c.id,
      originalName: c.name,
      newName: c.name + ' - חדש',
      managers: c.managers.map(m => m.id),
      archive: false
    }));

    const newYearName = 'תשפ״ח - טסט';
    const startDate = new Date().toISOString();
    const endDate = new Date().toISOString();

    await prisma.$transaction(async (tx) => {
      const currentYear = await tx.academicYear.findFirst({ where: { tenantId: tenant.id, isCurrent: true } });
      if (currentYear) {
        await tx.academicYear.update({ where: { id: currentYear.id }, data: { isCurrent: false } });
      }
      const newYear = await tx.academicYear.create({
        data: { tenantId: tenant.id, name: newYearName, startDate: new Date(startDate), endDate: new Date(endDate), isCurrent: true }
      });
      await tx.tenant.update({ where: { id: tenant.id }, data: { currentAcademicYearId: newYear.id } });

      for (const cls of classesUpdate) {
        const { id, originalName, newName, managers, archive } = cls;
        const currentGroup = await tx.group.findUnique({ where: { id }, include: { managers: true } });
        if (currentGroup && currentYear) {
          const managerNamesStr = currentGroup.managers.map(m => m.fullName).join(', ') || 'ללא מחנך';
          await tx.groupYearHistory.upsert({
            where: { groupId_academicYearId: { groupId: id, academicYearId: currentYear.id } },
            create: { groupId: id, academicYearId: currentYear.id, groupName: originalName, managerNames: managerNamesStr },
            update: { groupName: originalName, managerNames: managerNamesStr }
          });
        }
        await tx.group.update({
          where: { id },
          data: { name: newName, type: archive ? 'archived_class' : 'class', managers: { set: managers.map(mgrId => ({ id: mgrId })) } }
        });
      }
    });
    console.log('Transition successful');
  } catch (e) { 
    console.error('ERROR OCCURRED:', e); 
  } finally { 
    await prisma.$disconnect(); 
  } 
} 
run();
