const fs = require('fs');
const path = require('path');

function searchInDir(dir, term) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      searchInDir(fullPath, term);
    } else if (file.name.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes(term.toLowerCase())) {
        console.log('Found in: ' + fullPath);
        // Print lines containing the term
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (line.toLowerCase().includes(term.toLowerCase())) {
            console.log(`${i+1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchInDir('src/app', 'moodcheck');
