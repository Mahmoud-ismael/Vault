const fs = require('fs');
const path = require('path');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
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

const files = [...walk('app'), ...walk('components')];
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const orig = content;
  
  content = content.replace(/\bfont-serif\b/g, '');
  content = content.replace(/\bfont-mono\b/g, '');
  content = content.replace(/\bfont-sans\b/g, '');
  content = content.replace(/\bitalic\b/g, '');
  content = content.replace(/\btracking-widest\b/g, 'tracking-normal');
  content = content.replace(/\btracking-wider\b/g, 'tracking-normal');
  content = content.replace(/\btracking-tight\b/g, 'tracking-normal');

  content = content.replace(/font-family:\s*['"]?Instrument Serif['"]?,?\s*serif;/g, "font-family: 'Satoshi', sans-serif;");
  content = content.replace(/font-family:\s*['"]?DM Mono['"]?,?\s*monospace;/g, "font-family: 'Satoshi', sans-serif;");
  content = content.replace(/font-family:\s*['"]?Geist['"]?,?\s*sans-serif;/g, "font-family: 'Satoshi', sans-serif;");

  content = content.replace(/font-style:\s*italic;/g, "");
  content = content.replace(/fontStyle:\s*['"]italic['"]/g, "");

  content = content.replace(/className=(["'])(.*?)(["'])/g, (match, p1, p2, p3) => {
    let newClasses = p2.replace(/\s+/g, ' ').trim();
    return `className=${p1}${newClasses}${p3}`;
  });
  
  content = content.replace(/className=\{`(.*?)`\}/g, (match, p1) => {
    let newClasses = p1.replace(/\s+/g, ' ').trim();
    return `className={\`${newClasses}\`}`;
  });

  if (orig !== content) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
  }
});

console.log(`Updated ${changedFiles} files.`);
