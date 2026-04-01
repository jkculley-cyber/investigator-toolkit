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

// Strategy: Use Vite's single-chunk build instead of trying to concatenate modules.
// Re-run build with rollup config that forces everything into one chunk.
console.log('Re-building as single chunk...');
import { writeFileSync as wf } from 'fs';

// Create a temporary vite config that outputs a single chunk
const singleChunkConfig = `
import { defineConfig } from 'vite';
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined,
      }
    }
  }
});
`;
const tmpConfig = join(process.cwd(), 'vite.single.config.mjs');
wf(tmpConfig, singleChunkConfig);

execSync('npx vite build --config vite.single.config.mjs', { stdio: 'inherit' });

// Re-read after single-chunk build
const html2 = readFileSync(join(distDir, 'index.html'), 'utf-8');
result = html2;

// Inline CSS again
const cssFiles2 = readdirSync(assetsDir).filter(f => f.endsWith('.css'));
for (const cssFile of cssFiles2) {
  const css = readFileSync(join(assetsDir, cssFile), 'utf-8');
  const linkPattern = new RegExp(`<link[^>]*${cssFile.replace(/\./g, '\\.')}[^>]*>`, 'g');
  result = result.replace(linkPattern, `<style>${css}</style>`);
}

// Now there should be only 1 JS file — inline it
const jsFiles2 = readdirSync(assetsDir).filter(f => f.endsWith('.js'));
if (jsFiles2.length !== 1) {
  console.warn(`Warning: expected 1 JS file, got ${jsFiles2.length}: ${jsFiles2.join(', ')}`);
}
for (const jsFile of jsFiles2) {
  let js = readFileSync(join(assetsDir, jsFile), 'utf-8');
  // Escape </script> inside JS to prevent premature tag closure
  js = js.replace(/<\/script/gi, '<"+"/script');
  // Convert ES module to regular script so it works from file:// URLs
  // Remove top-level import/export (single chunk has none, but just in case)
  js = js.replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, '');
  const scriptPattern = new RegExp(`<script[^>]*${jsFile.replace(/\./g, '\\.')}[^>]*></script>`, 'g');
  if (scriptPattern.test(result)) {
    // Use regular script (not module) so file:// works — wrap in IIFE for scope
    result = result.replace(scriptPattern, `<script>(function(){${js}})()</script>`);
  }
}

// Clean up temp config
import { unlinkSync } from 'fs';
try { unlinkSync(tmpConfig); } catch {}

// Remove any remaining asset references
result = result.replace(/<link[^>]*assets\/[^>]*>/g, '');
result = result.replace(/<script[^>]*assets\/[^>]*><\/script>/g, '');

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
