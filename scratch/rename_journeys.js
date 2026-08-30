const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      replaceInDir(fullPath);
    } else if (file.name.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('מסעות מתגלגלים')) {
        content = content.replace(/מסעות מתגלגלים/g, 'משו"ב מסעות');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Replaced in: ' + fullPath);
      }
    }
  }
}

replaceInDir('src/app');
replaceInDir('src/components');
