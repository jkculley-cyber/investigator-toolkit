/**
 * Build a single self-contained HTML file for TpT distribution.
 * Inlines all JS and CSS from the Vite build output into index.html.
 *
 * Usage: node build-single-file.mjs
 * Output: dist/Campus-Investigation-Toolkit.html
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// Step 1: Run the normal build
console.log('Building with Vite...');
execSync('npm run build', { stdio: 'inherit' });

// Step 2: Read the built index.html
const distDir = join(process.cwd(), 'dist');
const html = readFileSync(join(distDir, 'index.html'), 'utf-8');
const assetsDir = join(distDir, 'assets');

// Step 3: Inline all CSS
let result = html;
const cssFiles = readdirSync(assetsDir).filter(f => f.endsWith('.css'));
for (const cssFile of cssFiles) {
  const css = readFileSync(join(assetsDir, cssFile), 'utf-8');
  const linkPattern = new RegExp(`<link[^>]*${cssFile.replace('.', '\\.')}[^>]*>`, 'g');
  result = result.replace(linkPattern, `<style>${css}</style>`);
}

// Step 4: Inline all JS (order matters — collect all, inline entry last)
const jsFiles = readdirSync(assetsDir).filter(f => f.endsWith('.js'));

// Find the entry JS (the one referenced in HTML)
for (const jsFile of jsFiles) {
  const js = readFileSync(join(assetsDir, jsFile), 'utf-8');
  const scriptPattern = new RegExp(`<script[^>]*${jsFile.replace('.', '\\.')}[^>]*></script>`, 'g');
  if (scriptPattern.test(result)) {
    // This is the entry script — inline it with all other chunks concatenated
    const allJs = jsFiles.map(f => readFileSync(join(assetsDir, f), 'utf-8')).join('\n');
    result = result.replace(scriptPattern, `<script type="module">${allJs}</script>`);
    break;
  }
}

// Remove any remaining asset references that didn't get inlined
result = result.replace(/<link[^>]*assets\/[^>]*>/g, '');
result = result.replace(/<script[^>]*assets\/[^>]*><\/script>/g, '');

// Step 5: Write the single file
const outPath = join(distDir, 'Campus-Investigation-Toolkit.html');
writeFileSync(outPath, result);

const sizeKB = Math.round(readFileSync(outPath).length / 1024);
console.log(`\nSingle-file build complete: ${outPath}`);
console.log(`Size: ${sizeKB} KB`);
console.log('This file can be opened directly in any browser — no server needed.');
