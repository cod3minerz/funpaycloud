#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const targetDirs = [
  'src/platform',
  'app/components/blog',
  'app/blog',
  'src/auth/components',
];

const fileExtensions = new Set(['.ts', '.tsx']);

const rules = [
  {
    name: 'inline-style',
    regex: /style\s*=\s*\{\{/g,
    message: 'Inline style detected. Move styling to tokens/classes.',
  },
  {
    name: 'raw-color',
    regex: /#[0-9a-fA-F]{3,8}\b|rgba?\s*\(/g,
    message: 'Raw color literal detected. Use design tokens/CSS variables.',
  },
];

function walk(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, results);
      continue;
    }
    if (entry.isFile() && fileExtensions.has(path.extname(entry.name))) {
      results.push(full);
    }
  }
  return results;
}

function lineAndColumn(source, index) {
  let line = 1;
  let lastLineStart = 0;
  for (let i = 0; i < index; i += 1) {
    if (source.charCodeAt(i) === 10) {
      line += 1;
      lastLineStart = i + 1;
    }
  }
  return { line, column: index - lastLineStart + 1 };
}

const files = targetDirs.flatMap(target => walk(path.join(root, target)));
const violations = [];

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  for (const rule of rules) {
    for (const match of source.matchAll(rule.regex)) {
      if (typeof match.index !== 'number') continue;
      const pos = lineAndColumn(source, match.index);
      const snippet = source
        .slice(match.index, match.index + 80)
        .split('\n')[0]
        .trim();
      violations.push({
        file,
        line: pos.line,
        column: pos.column,
        rule: rule.name,
        message: rule.message,
        snippet,
      });
    }
  }
}

if (violations.length > 0) {
  console.error('\nDesign system check failed:\n');
  for (const v of violations) {
    const rel = path.relative(root, v.file);
    console.error(`- [${v.rule}] ${rel}:${v.line}:${v.column}`);
    console.error(`  ${v.message}`);
    console.error(`  ${v.snippet}`);
  }
  console.error(`\nTotal violations: ${violations.length}`);
  process.exit(1);
}

console.log('Design system check passed: no inline styles or raw colors in scoped UI paths.');
