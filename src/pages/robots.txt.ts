import type { APIRoute } from 'astro'

// Apunta a sitemap-index.xml porque es el archivo real que genera @astrojs/sitemap.
// /api/ no tiene contenido indexable.
export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL('sitemap-index.xml', site)

  return new Response(`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${sitemapUrl.href}\n`, {
    headers: { 'Content-Type': 'text/plain' },
  })
}
