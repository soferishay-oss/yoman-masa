const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const tenantId = '1';
  let group = await prisma.group.findFirst({ where: { tenantId } });
  if (!group) {
    console.log("No group found");
    return;
  }
  let staff = await prisma.user.findFirst({ where: { tenantId, role: { not: 'student' } } });
  if (!staff) {
    console.log("No staff found");
    return;
  }
  
  console.log("Adding staff", staff.id, "to group", group.id);
  
  // Connect/disconnect managers if provided
  const updateData = {};
  updateData.managers = {
    set: [{ id: staff.id }]
  };

  const updatedGroup = await prisma.group.update({
    where: { id: group.id, tenantId },
    data: updateData,
    include: {
      managers: { select: { id: true, fullName: true } }
    }
  });
  
  console.log("Updated group managers:", updatedGroup.managers);
  
  // Now fetch it
  const fetchedGroup = await prisma.group.findUnique({
    where: { id: group.id, tenantId },
    include: {
      managers: { select: { id: true, fullName: true } }
    }
  });
  console.log("Fetched group managers:", fetchedGroup.managers);
}

test().finally(() => prisma.$disconnect());
