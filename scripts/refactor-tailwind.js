const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  { regex: /\[#00B0B9\]/g, replacement: 'icsn-teal' },
  { regex: /\[#211551\]/g, replacement: 'icsn-navy' },
  { regex: /\[#CC3366\]/g, replacement: 'icsn-pink' },
  { regex: /\[#00969e\]/g, replacement: 'icsn-teal\/90' },
  { regex: /\[#2d1d6e\]/g, replacement: 'icsn-navy\/90' },
  { regex: /rounded-\[20px\]/g, replacement: 'rounded-2xl' },
  { regex: /rounded-\[14px\]/g, replacement: 'rounded-xl' },
  { regex: /shadow-\[0_2px_10px_rgba\(0,0,0,0\.02\)\]/g, replacement: 'shadow-icsn-card' },
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(srcDir);
let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  replacements.forEach(({ regex, replacement }) => {
    content = content.replace(regex, replacement);
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
    console.log(`Updated ${path.basename(file)}`);
  }
});

console.log(`\nSuccessfully refactored ${modifiedCount} files.`);
