#!/usr/bin/env node
// Pre-build check for astro-seo-essentials. Run from the Astro project root
// after the installer and your edits, BEFORE `astro build`. Reads src/ and public/,
// names the exact file for each problem. Exit 1 on failures.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const failures = []
const warnings = []
const rel = (p) => relative(ROOT, p)

function walk(d, out = []) {
  if (!existsSync(d)) return out
  for (const e of readdirSync(d)) {
    const p = join(d, e)
    if (statSync(p).isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

// 1. Files present
const required = ['src/config/site.ts', 'src/lib/seo.ts', 'src/components/SEO.astro', 'src/components/StructuredData.astro', 'src/pages/robots.txt.ts']
for (const f of required) if (!existsSync(join(ROOT, f))) failures.push(`${f} is missing — run setup.mjs`)
if (existsSync(join(ROOT, 'public/robots.txt'))) failures.push('public/robots.txt exists and will shadow src/pages/robots.txt.ts — delete it')

// 2. astro.config
const cfg = ['astro.config.mjs', 'astro.config.ts', 'astro.config.js'].map((f) => join(ROOT, f)).find(existsSync)
if (!cfg) failures.push('No astro.config.* found')
else {
  const c = readFileSync(cfg, 'utf8')
  const site = c.match(/\bsite\s*:\s*['"`]([^'"`]+)['"`]/)?.[1]
  if (!site) failures.push(`${rel(cfg)}: no \`site\` set — canonical and OG URLs need it`)
  else {
    if (!site.startsWith('https://')) warnings.push(`${rel(cfg)}: site is not https (${site})`)
    if (/example\.com|your-domain|localhost/.test(site)) warnings.push(`${rel(cfg)}: site looks like a placeholder (${site})`)
    if (site.endsWith('/')) warnings.push(`${rel(cfg)}: site has a trailing slash — remove it`)
  }
  if (!/integrations\s*:\s*\[[^\]]*sitemap\(/.test(c)) failures.push(`${rel(cfg)}: sitemap() is not in integrations`)
}

// 3. site.ts placeholders + referenced assets
const siteTs = join(ROOT, 'src/config/site.ts')
if (existsSync(siteTs)) {
  const s = readFileSync(siteTs, 'utf8')
  const lines = s.split('\n')
  lines.forEach((l, i) => {
    if (/\bEDIT\b/.test(l) && !l.trim().startsWith('//') && !l.trim().startsWith('/**') && !l.trim().startsWith('*')) {
      failures.push(`src/config/site.ts:${i + 1}: still has an EDIT placeholder → ${l.trim()}`)
    }
  })
  for (const key of ['ogImage', 'favicon', 'appleTouchIcon']) {
    const v = s.match(new RegExp(`${key}\\s*:\\s*['"\`]([^'"\`]+)['"\`]`))?.[1]
    if (v && v.startsWith('/') && !existsSync(join(ROOT, 'public', v))) {
      if (key === 'ogImage') failures.push(`src/config/site.ts: ${key} points to ${v} but public${v} does not exist`)
      else warnings.push(`src/config/site.ts: ${key} points to ${v} but public${v} does not exist — add the file or set ${key}: '' to omit the tag`)
    }
  }
}

// 4. Layout wires SEO
const layouts = walk(join(ROOT, 'src/layouts')).filter((f) => f.endsWith('.astro'))
const layoutsWithSEO = layouts.filter((f) => /<SEO\b/.test(readFileSync(f, 'utf8')))
if (layouts.length === 0) failures.push('No src/layouts/*.astro found — create a layout that renders <SEO {...Astro.props} /> in <head>')
else if (layoutsWithSEO.length === 0) failures.push(`No layout renders <SEO /> (checked: ${layouts.map(rel).join(', ')})`)
for (const f of layoutsWithSEO) {
  const c = readFileSync(f, 'utf8')
  if (/<title>/i.test(c)) failures.push(`${rel(f)}: has its own <title> — SEO.astro already emits one; delete it`)
  if (/<meta\s+name="description"/i.test(c)) failures.push(`${rel(f)}: has its own meta description — delete it`)
  if (!/<meta\s+charset/i.test(c)) warnings.push(`${rel(f)}: no <meta charset> — SEO.astro does not add one`)
  if (!/<meta\s+name="viewport"/i.test(c)) warnings.push(`${rel(f)}: no <meta name="viewport"> — SEO.astro does not add one`)
}

// 5. Pages that bypass the layout
const pages = walk(join(ROOT, 'src/pages')).filter((f) => /\.(astro|md|mdx)$/.test(f))
for (const f of pages) {
  const c = readFileSync(f, 'utf8')
  if (f.endsWith('.astro') && /<html[\s>]/i.test(c)) {
    failures.push(`${rel(f)}: has its own <html> — it is not using the layout, so it gets no SEO tags (and may end up with two <title>s)`)
  }
  if (/\.(md|mdx)$/.test(f) && !/^layout:/m.test(c)) warnings.push(`${rel(f)}: markdown page without a \`layout:\` frontmatter — it will render with no <head>`)
  const custom = /^sitemap.*\.(ts|js)$/.test(f.split(/[\\/]/).pop())
  if (custom) failures.push(`${rel(f)}: custom sitemap route — remove it; @astrojs/sitemap generates sitemap-index.xml`)
}

// 6. @astrojs/sitemap installed
const pkgPath = join(ROOT, 'package.json')
if (existsSync(pkgPath)) {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  if (!pkg.dependencies?.['@astrojs/sitemap'] && !pkg.devDependencies?.['@astrojs/sitemap']) failures.push('@astrojs/sitemap is not in package.json — install it')
}

// Report
if (warnings.length) { console.log('Warnings:'); warnings.forEach((w) => console.log('  ! ' + w)); console.log() }
if (failures.length) {
  console.log('Fix before building:')
  failures.forEach((f) => console.log('  ✗ ' + f))
  process.exit(1)
}
console.log('Pre-build check passed. Now run your build, then check-seo.mjs dist.')
