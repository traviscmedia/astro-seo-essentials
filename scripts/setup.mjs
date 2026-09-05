#!/usr/bin/env node
// astro-seo-essentials installer.
// Copies the template files into an Astro project and patches astro.config.
// Deterministic: same input, same output. It never edits your layout or pages —
// that step is shown at the end because every project's layout is different.
//
// Usage (run from your Astro project root):
//   node path/to/astro-seo-essentials/scripts/setup.mjs --site https://example.com
//
// Flags:
//   --site <url>        Production URL. Written to astro.config as `site`. (recommended)
//   --name <text>       Site name          → SITE.name / titleTemplate
//   --description <t>   Default description → SITE.description
//   --author <text>     Author or org name → SITE.author
//   --force             Overwrite files that already exist
//   --no-install        Don't run the package manager for @astrojs/sitemap
//   --dry-run           Show what would happen, change nothing
//   --help

import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ASSETS = resolve(__dirname, '../assets')
const ROOT = process.cwd()

// ---------------------------------------------------------------- args
const args = process.argv.slice(2)
const flag = (n) => args.includes(`--${n}`)
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined }

if (flag('help')) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 18).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'))
  process.exit(0)
}

const SITE_URL = opt('site')
const FORCE = flag('force')
const DRY = flag('dry-run')
const NO_INSTALL = flag('no-install')

const log = (m) => console.log(m)
const done = []
const skipped = []
const warnings = []
const manual = []

// ---------------------------------------------------------------- sanity
const configFile = ['astro.config.mjs', 'astro.config.ts', 'astro.config.js', 'astro.config.cjs']
  .map((f) => join(ROOT, f))
  .find(existsSync)

if (!configFile) {
  console.error('No astro.config.* found. Run this from the root of an Astro project.')
  process.exit(1)
}
if (!existsSync(join(ROOT, 'src'))) {
  console.error('No src/ directory. Is this an Astro project?')
  process.exit(1)
}

if (SITE_URL) {
  try {
    const u = new URL(SITE_URL)
    if (u.protocol !== 'https:') warnings.push(`--site is not https: ${SITE_URL}`)
    if (u.pathname !== '/' || SITE_URL.endsWith('/')) warnings.push('--site should be the bare origin with no path or trailing slash')
  } catch {
    console.error(`--site is not a valid URL: ${SITE_URL}`)
    process.exit(1)
  }
}

// ---------------------------------------------------------------- package manager
function detectPM() {
  if (existsSync(join(ROOT, 'pnpm-lock.yaml'))) return 'pnpm'
  if (existsSync(join(ROOT, 'yarn.lock'))) return 'yarn'
  if (existsSync(join(ROOT, 'bun.lockb')) || existsSync(join(ROOT, 'bun.lock'))) return 'bun'
  return 'npm'
}
const pm = detectPM()
const addCmd = { npm: 'npm install', pnpm: 'pnpm add', yarn: 'yarn add', bun: 'bun add' }[pm]

// ---------------------------------------------------------------- copy templates
const files = [
  ['site.ts', 'src/config/site.ts'],
  ['seo.ts', 'src/lib/seo.ts'],
  ['SEO.astro', 'src/components/SEO.astro'],
  ['StructuredData.astro', 'src/components/StructuredData.astro'],
  ['robots.txt.ts', 'src/pages/robots.txt.ts'],
]

for (const [src, dest] of files) {
  const from = join(ASSETS, src)
  const to = join(ROOT, dest)
  if (existsSync(to) && !FORCE) {
    skipped.push(`${dest} (exists — use --force to overwrite)`)
    continue
  }
  if (!DRY) {
    mkdirSync(dirname(to), { recursive: true })
    copyFileSync(from, to)
  }
  done.push(dest)
}

// Fill site.ts from flags
const siteTs = join(ROOT, 'src/config/site.ts')
if (!DRY && existsSync(siteTs) && (done.includes('src/config/site.ts') || FORCE)) {
  let s = readFileSync(siteTs, 'utf8')
  const name = opt('name')
  const desc = opt('description')
  const author = opt('author')
  if (name) {
    const n = name.replace(/'/g, "\\'")
    s = s.replace(/'EDIT Site Name'/g, `'${n}'`)
    s = s.replace(/'%s \| EDIT Site Name'/, `'%s | ${n}'`)
    s = s.replace(/homeTitle: 'EDIT Best Widgets of \{year\} \| Site Name'/, `homeTitle: 'EDIT Best Widgets of {year} | ${n}'`)
  }
  if (desc) s = s.replace(/'EDIT One sentence describing what this site is for.'/, `'${desc.replace(/'/g, "\\'")}'`)
  if (author) s = s.replace(/'EDIT Author or Org Name'/, `'${author.replace(/'/g, "\\'")}'`)
  writeFileSync(siteTs, s)
}

// ---------------------------------------------------------------- conflicts
if (existsSync(join(ROOT, 'public/robots.txt'))) {
  warnings.push('public/robots.txt exists and will shadow src/pages/robots.txt.ts — delete it.')
}
const pagesDir = join(ROOT, 'src/pages')
if (existsSync(pagesDir)) {
  const custom = readdirSync(pagesDir).filter((f) => /^sitemap.*\.(ts|js)$/.test(f))
  if (custom.length) warnings.push(`Custom sitemap route(s) found: ${custom.join(', ')} — remove them; @astrojs/sitemap generates sitemap-index.xml.`)
}

// ---------------------------------------------------------------- patch astro.config
let config = readFileSync(configFile, 'utf8')
const original = config
const rel = configFile.replace(ROOT + '/', '')

// site:
if (SITE_URL) {
  if (/\bsite\s*:/.test(config)) {
    const current = config.match(/\bsite\s*:\s*['"`]([^'"`]+)['"`]/)?.[1]
    if (current && current !== SITE_URL) warnings.push(`${rel} already has site: '${current}' — left unchanged. Update it manually if wrong.`)
  } else if (/defineConfig\(\s*\{/.test(config)) {
    config = config.replace(/defineConfig\(\s*\{/, `defineConfig({\n  site: '${SITE_URL}',`)
  } else {
    manual.push(`Add  site: '${SITE_URL}'  to ${rel}`)
  }
} else {
  manual.push(`Add  site: 'https://your-domain.com'  to ${rel} (or re-run with --site)`)
}

// sitemap integration:
const hasImport = /from\s+['"]@astrojs\/sitemap['"]/.test(config)
const hasIntegration = /integrations\s*:\s*\[[^\]]*\bsitemap\(/.test(config)
if (!hasImport) {
  const lastImport = [...config.matchAll(/^import .*$/gm)].pop()
  if (lastImport) {
    const idx = lastImport.index + lastImport[0].length
    config = config.slice(0, idx) + `\nimport sitemap from '@astrojs/sitemap';` + config.slice(idx)
  } else {
    config = `import sitemap from '@astrojs/sitemap';\n` + config
  }
}
if (!hasIntegration) {
  if (/integrations\s*:\s*\[/.test(config)) {
    config = config.replace(/integrations\s*:\s*\[/, 'integrations: [sitemap(), ')
  } else if (/defineConfig\(\s*\{/.test(config)) {
    config = config.replace(/defineConfig\(\s*\{/, `defineConfig({\n  integrations: [sitemap()],`)
  } else {
    manual.push(`Add  integrations: [sitemap()]  to ${rel}`)
  }
}

if (config !== original) {
  config = config.replace(/,\s*\}\)/g, ',\n})') // tidy `,});` left by patching an empty config
  if (!DRY) writeFileSync(configFile, config)
  done.push(`${rel} (patched)`)
}

// ---------------------------------------------------------------- install
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
const hasDep = pkg.dependencies?.['@astrojs/sitemap'] || pkg.devDependencies?.['@astrojs/sitemap']
if (!hasDep) {
  if (NO_INSTALL || DRY) {
    manual.push(`Install the sitemap integration:  ${addCmd} @astrojs/sitemap`)
  } else {
    log(`Installing @astrojs/sitemap with ${pm}…`)
    try {
      execSync(`${addCmd} @astrojs/sitemap`, { stdio: 'inherit', cwd: ROOT })
      done.push('@astrojs/sitemap installed')
    } catch {
      manual.push(`Install failed. Run:  ${addCmd} @astrojs/sitemap`)
    }
  }
}

// ---------------------------------------------------------------- report
log('')
log(DRY ? 'DRY RUN — nothing was changed.\n' : 'astro-seo-essentials installed.\n')
if (done.length) { log('Done:'); done.forEach((d) => log('  ✓ ' + d)) }
if (skipped.length) { log('\nSkipped:'); skipped.forEach((d) => log('  - ' + d)) }
if (warnings.length) { log('\nWarnings:'); warnings.forEach((d) => log('  ! ' + d)) }
if (manual.length) { log('\nDo manually:'); manual.forEach((d) => log('  → ' + d)) }

log(`
Next steps:
  1. Open src/config/site.ts and replace every value marked EDIT.
  2. Put a 1200×630 image at public/og-default.jpg (or change SITE.ogImage).
  3. In your base layout, render <SEO {...Astro.props} /> inside <head> and
     remove any existing <title> / meta tags. Example:

       ---
       import SEO from '../components/SEO.astro'
       import type { Props as SEOProps } from '../components/SEO.astro'
       type Props = SEOProps
       ---
       <html lang="en">
         <head>
           <meta charset="utf-8" />
           <meta name="viewport" content="width=device-width, initial-scale=1" />
           <SEO {...Astro.props} />
           <slot name="head" />
         </head>
         <body><slot /></body>
       </html>

  4. Any page that still has its own <html> / <head> (the starter template's
     index.astro does) must be changed to use the layout, or you get two <title>s.

  5. Check your source BEFORE building — it finds leftover EDITs, missing images,
     and pages that skipped the layout, and names the file:
       node "${resolve(__dirname, 'doctor.mjs')}"

  6. Build, then check the output:
       ${pm === 'npm' ? 'npm run build' : pm + ' run build'}
       node "${resolve(__dirname, 'check-seo.mjs')}" dist
`)
