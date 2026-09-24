#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = process.cwd();
const scanTargets = [
  'src/design-system',
  'src/public',
  'src/auth',
  'src/components/legal',
  'src/components/seo',
  'app/blog',
  'app/components/blog',
  'app/auth',
  'app/legal',
  'app/about',
  'app/r',
  'app/[marketingSlug]',
  'app/page.tsx',
  'app/layout.tsx',
  'app/not-found.tsx',
  'app/error.tsx',
  'app/global-error.tsx',
  'app/loading.tsx',
];

const tokenFiles = new Set([
  path.join(root, 'src/design-system/tokens.css'),
  path.join(root, 'src/design-system/meta.ts'),
]);
const primitiveFile = path.join(root, 'src/design-system/components.tsx');
// The temporary maintenance page has an intentionally independent black/white glass treatment.
const maintenanceCss = path.join(root, 'src/public/maintenance/maintenance.module.css');
const violations = [];

function walk(target, results = []) {
  const absolute = path.join(root, target);
  if (!fs.existsSync(absolute)) return results;
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return [...results, absolute];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const child = path.join(absolute, entry.name);
    if (entry.isDirectory()) walk(path.relative(root, child), results);
    else if (/\.(?:ts|tsx|css)$/.test(entry.name)) results.push(child);
  }
  return results;
}

function position(source, index) {
  const before = source.slice(0, index).split('\n');
  return { line: before.length, column: before.at(-1).length + 1 };
}

function report(file, source, index, rule, message) {
  const pos = position(source, index);
  violations.push({ file: path.relative(root, file), ...pos, rule, message });
}

function inspectCss(file, source) {
  if (tokenFiles.has(file) || file === maintenanceCss) return;
  for (const match of source.matchAll(/#[0-9a-fA-F]{3,8}\b|(?:rgb|hsl)a?\s*\(/g)) {
    report(file, source, match.index, 'raw-color', 'Move the color to src/design-system/tokens.css and reference a semantic --ds-* token.');
  }
}

function inspectTs(file, source) {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const isPrimitive = file === primitiveFile;

  function visit(node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const specifier = node.moduleSpecifier.text;
      if (specifier === 'lucide-react') report(file, source, node.getStart(sourceFile), 'icon-library', 'Use the existing @/shared/streamline/icons API.');
      if (/components\/landing\/(?:Button|LandingNav|LandingFooter)/.test(specifier)) report(file, source, node.getStart(sourceFile), 'legacy-public-ui', 'Use @/design-system and @/public/PublicShell.');
      if (/app\/components\/blog\/(?:BlogCard|BlogHeader|FinalCTA|StickyCTA)/.test(specifier)) report(file, source, node.getStart(sourceFile), 'legacy-blog-ui', 'Use @/design-system and @/public/blog components.');
    }

    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(sourceFile);
      if (name === 'style' && !file.includes('/src/shared/streamline/')) report(file, source, node.getStart(sourceFile), 'inline-style', 'Move the value to a semantic class backed by design tokens.');
      if (name === 'className' && node.initializer && ts.isStringLiteral(node.initializer)) {
        if (/(?:bg|text|border|ring|shadow|fill|stroke)-\[[^\]]+\]/.test(node.initializer.text)) report(file, source, node.getStart(sourceFile), 'arbitrary-utility', 'Use a canonical component or semantic class with --ds-* tokens.');
      }
    }

    if (!isPrimitive && ts.isJsxOpeningLikeElement(node)) {
      const tag = node.tagName.getText(sourceFile);
      if (['button', 'input', 'select', 'textarea'].includes(tag)) report(file, source, node.getStart(sourceFile), 'native-control', `Use the ${tag === 'button' ? 'Button/IconButton' : tag[0].toUpperCase() + tag.slice(1)} primitive from @/design-system.`);
    }

    ts.forEachChild(node, visit);
  }
  visit(sourceFile);

  if (!tokenFiles.has(file)) {
    for (const match of source.matchAll(/#[0-9a-fA-F]{3,8}\b|(?:rgb|hsl)a?\s*\(/g)) report(file, source, match.index, 'raw-color', 'Move the color to src/design-system/tokens.css.');
  }
}

const files = [...new Set(scanTargets.flatMap(target => walk(target)))];
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.css')) inspectCss(file, source);
  else inspectTs(file, source);
}

if (violations.length) {
  console.error('\nDesign system gate failed:\n');
  for (const item of violations) console.error(`- [${item.rule}] ${item.file}:${item.line}:${item.column}\n  ${item.message}`);
  console.error(`\nTotal violations: ${violations.length}`);
  process.exit(1);
}

console.log(`Design system gate passed (${files.length} files checked).`);
