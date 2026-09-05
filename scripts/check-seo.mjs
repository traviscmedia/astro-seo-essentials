#!/usr/bin/env node
// Verifies the built output of an Astro site has the SEO layer in place.
// Usage: node check-seo.mjs <build-dir>   (default: dist)
// Exit code 1 on any failure. No dependencies.

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'

const dir = process.argv[2] ?? 'dist'
if (!existsSync(dir)) {
  console.error(`Build directory not found: ${dir}. Run the build first.`)
  process.exit(1)
}

const failures = []
const warnings = []

function walk(d, out = []) {
  for (const e of readdirSync(d)) {
    const p = join(d, e)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (e.endsWith('.html')) out.push(p)
  }
  return out
}

const has = (html, re) => re.test(html)
const count = (html, re) => (html.match(re) ?? []).length

const checks = [
  ['<title>', /<title>[^<]+<\/title>/i],
  ['meta description', /<meta\s+name="description"\s+content="[^"]+"/i],
  ['canonical', /<link\s+rel="canonical"\s+href="https?:\/\/[^"]+"/i],
  ['robots meta', /<meta\s+name="robots"/i],
  ['og:title', /property="og:title"/i],
  ['og:description', /property="og:description"/i],
  ['og:image (absolute)', /property="og:image"\s+content="https?:\/\//i],
  ['og:url', /property="og:url"/i],
  ['twitter:card', /name="twitter:card"/i],
]

const pages = walk(dir)
if (pages.length === 0) failures.push(`No HTML files found under ${dir}`)

for (const p of pages) {
  const html = readFileSync(p, 'utf8')
  const name = relative(dir, p)
  for (const [label, re] of checks) {
    if (!has(html, re)) failures.push(`${name}: missing ${label}`)
  }
  if (count(html, /<title>/gi) > 1) failures.push(`${name}: multiple <title> tags`)
  if (count(html, /rel="canonical"/gi) > 1) failures.push(`${name}: multiple canonical links`)
  if (count(html, /<h1[\s>]/gi) === 0) warnings.push(`${name}: no <h1>`)
  if (count(html, /<h1[\s>]/gi) > 1) warnings.push(`${name}: multiple <h1>`)
  if (/\bEDIT\b/.test(html)) failures.push(`${name}: leftover "EDIT" placeholder text`)
  const t = html.match(/<title>([^<]+)<\/title>/i)?.[1]
  if (t && t.length > 65) warnings.push(`${name}: title is ${t.length} chars (>65 may truncate)`)
  const d = html.match(/name="description"\s+content="([^"]+)"/i)?.[1]
  if (d && d.length > 160) warnings.push(`${name}: description is ${d.length} chars (>160 may truncate)`)
  const og = html.match(/property="og:image"\s+content="([^"]+)"/i)?.[1]
  if (og) {
    try {
      const u = new URL(og)
      const canonicalHost = html.match(/rel="canonical"\s+href="https?:\/\/([^/"]+)/i)?.[1]
      if (u.host === canonicalHost && !existsSync(join(dir, u.pathname))) {
        failures.push(`${name}: og:image ${u.pathname} is not in build output (add it to /public)`)
      }
    } catch { failures.push(`${name}: og:image is not a valid URL`) }
  }
  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) ?? []
  for (const block of ld) {
    const json = block.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '')
    try { JSON.parse(json) } catch { failures.push(`${name}: invalid JSON-LD`) }
  }
}

// robots + sitemap
const robotsPath = join(dir, 'robots.txt')
if (!existsSync(robotsPath)) failures.push('robots.txt not in build output')
else {
  const robots = readFileSync(robotsPath, 'utf8')
  const m = robots.match(/^Sitemap:\s*(\S+)/im)
  if (!m) failures.push('robots.txt has no Sitemap: line')
  else {
    const file = m[1].split('/').pop()
    if (!existsSync(join(dir, file))) failures.push(`robots.txt points to ${file} but it is not in build output`)
  }
}
const sitemapCandidates = ['sitemap-index.xml', 'sitemap.xml']
if (!sitemapCandidates.some((f) => existsSync(join(dir, f)))) {
  failures.push('no sitemap found (expected sitemap-index.xml from @astrojs/sitemap)')
}

console.log(`Checked ${pages.length} page(s) in ${dir}\n`)
if (warnings.length) {
  console.log('Warnings:')
  for (const w of warnings) console.log('  - ' + w)
  console.log()
}
if (failures.length) {
  console.log('Failures:')
  for (const f of failures) console.log('  - ' + f)
  process.exit(1)
}
console.log('SEO check passed.')
