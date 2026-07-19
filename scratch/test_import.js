const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function testImport() {
  const users = [
    {
      "שם משפחה": "כהן",
      "שם פרטי": "יוסי",
      "תז": "012345678",
      "כיתה": "ט",
      "מקבילה": "1",
      "טלפון נייד": "0501234567"
    },
    {
      "שם משפחה": "לוי",
      "שם פרטי": "משה",
      "תז": "012345679",
      "כיתה": "ט",
      "מקבילה": "2",
      "טלפון נייד": "0501234568"
    }
  ];
  const role = "student";
  const tenantId = "1"; // Assuming tenant 1 exists
  const nameFormat = "last_first";

  const defaultPasswordHash = await bcrypt.hash('1234', 10);
  const classCache = new Map();
  let importedCount = 0;

  for (const rawUser of users) {
    try {
      const rawNationalId = rawUser['תז'] || rawUser['ת.ז.'] || rawUser['nationalId'];
      const rawFirstName = rawUser['שם פרטי'] || rawUser['firstName'];
      const rawLastName = rawUser['שם משפחה'] || rawUser['lastName'];
      const rawFullName = rawUser['שם מלא'] || rawUser['שם מורה'] || rawUser['שם'] || rawUser['fullName'] || rawUser['name'];
      const rawPhone = rawUser['טלפון נייד'] || rawUser['טלפון'] || rawUser['פלאפון'] || rawUser['phoneNumber'] || rawUser['phone'];
      const rawEmail = rawUser['מייל'] || rawUser['אימייל'] || rawUser['דוא"ל'] || rawUser['email'];
      const rawClass = rawUser['כיתה'] || rawUser['class'] || rawUser['שכבה'];
      const rawParallel = rawUser['מקבילה'];

      let finalFirstName = rawFirstName || null;
      let finalLastName = rawLastName || null;
      let finalFullName = rawFullName || null;

      if (rawFirstName && rawLastName) {
        finalFullName = nameFormat === 'first_last' 
          ? `${rawFirstName} ${rawLastName}`
          : `${rawLastName} ${rawFirstName}`;
      } else if (rawFullName) {
        const parts = rawFullName.split(' ');
        if (parts.length > 1) {
          if (nameFormat === 'first_last') {
            finalFirstName = parts[0];
            finalLastName = parts.slice(1).join(' ');
          } else {
            finalLastName = parts[0];
            finalFirstName = parts.slice(1).join(' ');
          }
        } else {
          finalFirstName = rawFullName;
        }
      }

      if (!finalFullName || (!rawPhone && !rawNationalId)) {
        continue;
      }

      let cleanPhone = null;
      if (rawPhone) {
        cleanPhone = rawPhone.toString().replace(/\D/g, '');
        if (cleanPhone.length < 9) cleanPhone = null;
      }
      
      const nationalIdStr = rawNationalId ? String(rawNationalId).trim() : null;

      let classId = null;
      let className = null;
      if (rawClass) className = rawClass.trim();
      if (rawParallel) className = className ? `${className} ${rawParallel.trim()}` : rawParallel.trim();

      if (className && role === 'student') {
        if (classCache.has(className)) {
          classId = classCache.get(className);
        } else {
          let cls = await prisma.group.findFirst({
            where: { tenantId, type: 'class', name: className }
          });
          if (!cls) {
            cls = await prisma.group.create({
              data: {
                tenantId,
                name: className,
                type: 'class'
              }
            });
          }
          classId = cls.id;
          classCache.set(className, classId);
        }
      }

      let existingUser = null;
      if (nationalIdStr) {
        existingUser = await prisma.user.findFirst({ where: { tenantId, nationalId: nationalIdStr } });
      }
      if (!existingUser && cleanPhone) {
        existingUser = await prisma.user.findFirst({ where: { tenantId, phoneNumber: cleanPhone } });
      }

      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            fullName: finalFullName,
            firstName: finalFirstName || existingUser.firstName,
            lastName: finalLastName || existingUser.lastName,
            email: rawEmail || existingUser.email,
            classId: classId || existingUser.classId,
            nationalId: nationalIdStr || existingUser.nationalId,
            phoneNumber: cleanPhone || existingUser.phoneNumber
          }
        });
      } else {
        await prisma.user.create({
          data: {
            tenantId,
            fullName: finalFullName,
            firstName: finalFirstName,
            lastName: finalLastName,
            nationalId: nationalIdStr,
            phoneNumber: cleanPhone,
            email: rawEmail || null,
            passwordHash: defaultPasswordHash,
            role: role || 'student',
            classId
          }
        });
        importedCount++;
      }
    } catch (e) {
      console.error("Error inserting row:", rawUser);
      console.error(e);
    }
  }
  console.log("Imported", importedCount);
}

testImport().finally(() => prisma.$disconnect());
