const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'frontend', 'src');
const ignoredDirs = ['node_modules', '.git'];
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (ignoredDirs.includes(entry.name)) continue;
      walk(path.join(dir, entry.name));
      continue;
    }
    if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
      files.push(path.join(dir, entry.name));
    }
  }
}

function findMatchingBracket(text, startIndex) {
  let depth = 1;
  let i = startIndex + 1;
  while (i < text.length && depth > 0) {
    const char = text[i];
    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      i += 1;
      while (i < text.length && text[i] !== quote) {
        if (text[i] === '\\') i += 2;
        else i += 1;
      }
      i += 1;
      continue;
    }
    if (text[i] === '{') depth += 1;
    else if (text[i] === '}') depth -= 1;
    i += 1;
  }
  return depth === 0 ? i - 1 : -1;
}

function replaceUnusedCatchParams(text) {
  let offset = 0;
  let result = '';
  const regex = /catch\s*\(\s*([A-Za-z_$][A-Za-z_$0-9]*)\s*\)\s*\{/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const param = match[1];
    const matchStart = match.index;
    const braceStart = text.indexOf('{', regex.lastIndex - 1);
    if (braceStart === -1) break;
    const blockEnd = findMatchingBracket(text, braceStart);
    if (blockEnd === -1) break;

    const blockText = text.slice(braceStart + 1, blockEnd);
    const paramUsage = new RegExp('\\b' + param + '\\b').test(blockText);
    if (!paramUsage) {
      const before = text.slice(offset, matchStart);
      result += before + 'catch {';
      offset = braceStart + 1;
    }
  }
  result += text.slice(offset);
  return result;
}

walk(root);
let changedFiles = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const updated = replaceUnusedCatchParams(content);
  if (updated !== content) {
    fs.writeFileSync(file, updated, 'utf8');
    changedFiles.push(file);
  }
}
console.log('Changed', changedFiles.length, 'files');
for (const file of changedFiles) console.log(file);
