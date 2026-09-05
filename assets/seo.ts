// src/lib/seo.ts — helpers shared by SEO.astro and StructuredData.astro.

/** Resolve a path or URL to an absolute URL against `site`. Returns undefined for empty input. */
export function absUrl(value: string | URL | undefined | null, site: URL): string | undefined {
  if (value == null) return undefined
  const s = String(value).trim()
  if (!s) return undefined
  return new URL(s, site).href
}

/** Guess an image MIME type from its extension. */
export function imageType(url: string): string | undefined {
  const ext = url.split(/[?#]/)[0].split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
    gif: 'image/gif', svg: 'image/svg+xml', avif: 'image/avif',
  }
  return ext ? map[ext] : undefined
}

/**
 * Serialise JSON-LD so it cannot break out of its <script> element.
 * `JSON.stringify` does not escape `<`, so a string containing "</script>" would
 * end the element early. Escaping `<`, `>` and the U+2028/2029 line terminators as
 * JSON unicode escapes fixes that, and `JSON.parse` decodes them back unchanged —
 * consumers see byte-identical data.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

/** Add @context if missing; accepts one node or many. */
export function withContext(node: Record<string, unknown> | Record<string, unknown>[]) {
  const add = (n: Record<string, unknown>) => ({ '@context': 'https://schema.org', ...n })
  return Array.isArray(node) ? node.map(add) : add(node)
}

/** Format a Date or ISO string as ISO 8601. */
export function isoDate(d: string | Date | undefined): string | undefined {
  if (!d) return undefined
  return d instanceof Date ? d.toISOString() : d
}

/** Dev-only warning; stripped from production builds. */
export function devWarn(component: string, msg: string) {
  if (import.meta.env.DEV) console.warn(`[${component}] ${msg}`)
}
