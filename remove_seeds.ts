import fs from 'fs';
let code = fs.readFileSync('src/services/dataService.ts', 'utf8');

const regexes = [
  /if \(\s*list\.length === 0(?: && [^)]+)?\s*\)\s*\{\s*console\.log\("[^"]+"\);\s*for \([^{]+\)\s*\{\s*await setDoc[^\}]+\}\s*return [A-Z_]+;\s*\}/g
];

code = code.replace(regexes[0], '');

fs.writeFileSync('src/services/dataService.ts', code);
console.log('Done replacement');
