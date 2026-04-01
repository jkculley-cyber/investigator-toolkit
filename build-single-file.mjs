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
  const js = readFileSync(join(assetsDir, jsFile), 'utf-8');
  // Base64-encode the entire JS to avoid ANY HTML parser interference.
  // Template literals containing <style>, </script>, <!DOCTYPE> etc. break
  // when placed inside a <script> tag. Base64 is immune to this.
  const b64 = Buffer.from(js, 'utf-8').toString('base64');
  // atob() returns Latin-1 which corrupts multi-byte UTF-8 (em dashes, unicode icons).
  // Decode base64 → binary string → Uint8Array → TextDecoder for proper UTF-8.
  const loader = `<script>document.addEventListener("DOMContentLoaded",function(){var b=atob("${b64}"),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);eval(new TextDecoder().decode(a))})<\/script>`;
  const scriptPattern = new RegExp(`<script[^>]*${jsFile.replace(/\./g, '\\.')}[^>]*></script>`, 'g');
  if (scriptPattern.test(result)) {
    result = result.replace(scriptPattern, loader);
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
