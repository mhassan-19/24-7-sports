// Builds the Phase 1 prototype from src/: injects the brand logo SVGs and the TEST data snapshot.
// Output: index.html (standalone, open in a browser) and artifact.html (body-only, for publishing).
// Usage: node docs/phase-1/prototype/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = f => readFileSync(join(here, 'src', f), 'utf8');

// Brand SVGs ship with Midnight numerals; currentColor lets the theme pick Midnight (on Bone) or
// Bone (on Midnight), which are exactly the approved `signature` and `signature-reversed` versions.
// The orange slash clip is shared from the page's sprite so hidden copies don't break it.
const logo = file => src(file)
  .replace(/<title>.*?<\/title>/s, '')
  .replace(/ width="\d+" height="\d+"/, ' aria-hidden="true" focusable="false"')
  .replace(/fill="#141416"/g, 'fill="currentColor"')
  .replace(/<clipPath id="s">.*?<\/clipPath>/s, '')
  .replace(/clip-path="url\(#s\)"/g, 'clip-path="url(#logo-slash-clip)"');

const data = JSON.stringify(JSON.parse(src('data.json'))).replace(/<\//g, '<\\/');
const page = src('app.html')
  .replace('"%%DATA%%"', () => data)
  .replace('"%%LOGO_PRIMARY%%"', () => JSON.stringify(logo('247sports-primary-signature.svg')))
  .replace('"%%LOGO_MARK%%"', () => JSON.stringify(logo('247sports-logomark-signature.svg')));

if (page.includes('%%')) throw new Error('Unreplaced placeholder in app.html');

const favicon = 'data:image/svg+xml,' + encodeURIComponent(src('favicon.svg'));
writeFileSync(join(here, 'artifact.html'), page);
writeFileSync(join(here, 'index.html'),
  `<!doctype html>\n<html lang="ar">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<link rel="icon" href="${favicon}">\n</head>\n<body>\n${page}\n</body>\n</html>\n`);
console.log(`Built index.html and artifact.html (${(page.length / 1024).toFixed(0)} KB)`);
