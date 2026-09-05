// src/pages/robots.txt.ts
// Served at /robots.txt. The sitemap URL is derived from `site` in astro.config.mjs,
// so there is nothing to keep in sync. Delete any public/robots.txt — it would shadow this.
import type { APIRoute } from 'astro'

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('robots.txt: `site` must be set in astro.config.mjs')
  const sitemap = new URL('sitemap-index.xml', site).href

  const body = `User-agent: *
Allow: /

Sitemap: ${sitemap}
`
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
