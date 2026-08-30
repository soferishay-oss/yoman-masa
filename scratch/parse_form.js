const fs = require('fs');

const content = fs.readFileSync('C:\\Users\\sofer\\.gemini\\antigravity\\brain\\f242c9fe-0519-424a-a51e-72523de94804\\.system_generated\\steps\\11244\\content.md', 'utf-8');

// Find the FB_PUBLIC_LOAD_DATA_ array
const match = content.match(/var FB_PUBLIC_LOAD_DATA_ = (\[.*?\]);\s*<\/script>/s) || content.match(/window\.WIZ_global_data = ({.*?});/s);

if (match) {
    console.log("Found data, parsing...");
    const dataStr = match[1];
    // It's a complex array. Let's just use regex to find all titles
    const titles = [...content.matchAll(/,"([^"]+)",null,\d+,\[\[/g)].map(m => m[1]);
    const descriptions = [...content.matchAll(/,"([^"]+)",null,\d+,null,/g)].map(m => m[1]);
    
    // Instead of complex parsing, let's just extract all Hebrew text strings longer than 10 chars
    const hebStrings = [...new Set([...content.matchAll(/"([א-ת0-9\s"'-?!.,]+)"/g)].map(m => m[1]).filter(s => s.length > 5))];
    console.log("Hebrew strings:");
    hebStrings.forEach((s, i) => console.log(`${i}: ${s}`));
} else {
    console.log("No data found");
}
