import type { APIRoute } from 'astro'
import { strataFile } from '@/lib/strata'

export const prerender = false

/** Strata's presigned URLs last an hour; cache the redirect for less than that. */
const REDIRECT_MAX_AGE_SECONDS = 50 * 60

/**
 * Stable URL for a Strata file (see `strataFileUrl` in `@/lib/strata/assets`):
 * redirects to a fresh presigned URL. Only files uploaded as public are
 * served — the site's token can read every file, so this must not become a
 * way to fetch private ones.
 */
export const GET: APIRoute = async ({ params }) => {
  const file = params.id ? await strataFile(params.id).catch(() => null) : null
  if (!file?.is_public || !file.url) {
    return new Response(null, { status: 404 })
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: file.url,
      'Cache-Control': `public, max-age=${REDIRECT_MAX_AGE_SECONDS}`,
    },
  })
}
