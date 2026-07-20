require('dotenv').config(); 
const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function run() { 
  try { 
    const tenant = await prisma.tenant.findFirst(); 
    const currentYear = await prisma.academicYear.findFirst({ where: { tenantId: tenant.id, isCurrent: true } }); 
    console.log('Current Year:', currentYear); 
    const classes = await prisma.group.findMany({ where: { type: 'class', tenantId: tenant.id } }); 
    console.log('Classes count:', classes.length); 
  } catch (e) { 
    console.error(e); 
  } finally { 
    await prisma.$disconnect(); 
  } 
} 
run();
