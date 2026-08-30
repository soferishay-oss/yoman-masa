const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

const replacements = [
  {
    target: /ownerUser\s+User\s+@relation\(fields:\s*\[ownerUserId\],\s*references:\s*\[id\]\)/g,
    replace: 'ownerUser        User     @relation(fields: [ownerUserId], references: [id], onDelete: Cascade)'
  },
  {
    target: /creatorUser\s+User\s+@relation\(fields:\s*\[creatorUserId\],\s*references:\s*\[id\]\)/g,
    replace: 'creatorUser      User     @relation(fields: [creatorUserId], references: [id], onDelete: Cascade)'
  },
  {
    target: /user\s+User\s+@relation\(fields:\s*\[userId\],\s*references:\s*\[id\]\)/g,
    replace: 'user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)'
  },
  {
    target: /creator\s+User\s+@relation\(fields:\s*\[creatorId\],\s*references:\s*\[id\]\)/g,
    replace: 'creator          User        @relation(fields: [creatorId], references: [id], onDelete: Cascade)'
  },
  {
    target: /author\s+User\s+@relation\("AuthoredLetters",\s*fields:\s*\[authorId\],\s*references:\s*\[id\]\)/g,
    replace: 'author           User     @relation("AuthoredLetters", fields: [authorId], references: [id], onDelete: Cascade)'
  },
  {
    target: /recipient\s+User\s+@relation\("ReceivedLetters",\s*fields:\s*\[recipientId\],\s*references:\s*\[id\]\)/g,
    replace: 'recipient        User     @relation("ReceivedLetters", fields: [recipientId], references: [id], onDelete: Cascade)'
  }
];

replacements.forEach(({target, replace}) => {
  content = content.replace(target, replace);
});

fs.writeFileSync('prisma/schema.prisma', content);
