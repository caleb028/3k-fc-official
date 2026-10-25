import fs from 'fs';
import path from 'path';

function searchDir(dir: string, regex: RegExp, results: string[] = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        searchDir(fullPath, regex, results);
      }
    } else if (entry.isFile() && /\.(tsx|ts|jsx|js|json)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (regex.test(line)) {
          results.push(`${fullPath}:${idx + 1}: ${line.trim()}`);
        }
      });
    }
  }
  return results;
}

const matches = searchDir('C:/Users/ADMIN/.gemini/antigravity/scratch/3k-fc-official/src', /VERIFIED/i);
console.log(`Found ${matches.length} matches:`);
matches.slice(0, 50).forEach(m => console.log(m));
