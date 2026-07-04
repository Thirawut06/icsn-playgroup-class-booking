const fs = require('fs');
const path = require('path');

const map = {
  // Slate / Gray (Neutral)
  'bg-slate-50': 'bg-muted/50',
  'bg-slate-100': 'bg-muted',
  'bg-slate-200': 'bg-muted/80',
  'bg-slate-900': 'bg-icsn-navy',
  'border-slate-100': 'border-border/50',
  'border-slate-200': 'border-border',
  'border-slate-300': 'border-border/80',
  'ring-slate-200': 'ring-border',
  'text-slate-400': 'text-muted-foreground/70',
  'text-slate-500': 'text-muted-foreground',
  'text-slate-600': 'text-foreground/80',
  'text-slate-700': 'text-foreground/90',
  'text-slate-800': 'text-foreground',
  'text-slate-900': 'text-foreground',

  'bg-gray-50': 'bg-muted/50',
  'bg-gray-100': 'bg-icsn-bg',
  'bg-gray-200': 'bg-muted',
  'bg-gray-300': 'bg-muted/80',
  'bg-gray-800': 'bg-icsn-navy',
  'border-gray-100': 'border-border/50',
  'border-gray-200': 'border-border',
  'text-gray-400': 'text-muted-foreground/70',
  'text-gray-500': 'text-muted-foreground',
  'text-gray-600': 'text-foreground/80',

  // Red (Error)
  'bg-red-50': 'bg-error/10',
  'bg-red-500': 'bg-error',
  'border-red-200': 'border-error/30',
  'border-red-400': 'border-error/50',
  'text-red-500': 'text-error',
  'text-red-600': 'text-error',

  // Blue / Indigo (Info/Primary)
  'bg-blue-50': 'bg-info/10',
  'border-blue-100': 'border-info/20',
  'border-blue-200': 'border-info/30',
  'border-blue-400': 'border-info/50',
  'text-blue-600': 'text-info',
  'text-blue-700': 'text-info',
  'text-blue-900': 'text-info',
  
  'bg-indigo-100': 'bg-info/20',
  'text-indigo-600': 'text-info',

  // Emerald (Success)
  'text-emerald-600': 'text-success',

  // Purple (Accent)
  'bg-purple-50': 'bg-accent/10',
  'border-purple-400': 'border-accent/50',
  'text-purple-600': 'text-accent'
};

function findFiles(dir, exts) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(file, exts));
    } else {
      if (exts.some(ext => file.endsWith(ext))) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = findFiles('./src/components/admin', ['.tsx']);
const regex = new RegExp('\\b(' + Object.keys(map).join('|') + ')\\b', 'g');

let changedCount = 0;
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const newContent = content.replace(regex, match => map[match]);
  if (content !== newContent) {
    fs.writeFileSync(f, newContent, 'utf8');
    console.log('Updated', f);
    changedCount++;
  }
});

console.log('Total files updated:', changedCount);
