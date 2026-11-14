/**
 * Strata file URLs. Strata only hands out presigned S3 URLs that expire
 * after an hour (even for `is_public` files), so pages can't embed them.
 * Instead they point at `/api/strata/files/:id`
 * (`src/pages/api/strata/files/[id].ts`), which redirects to a fresh signed
 * URL.
 *
 * Once Strata has a public/CDN base URL configured, this is the only place
 * that needs to change.
 */
export const STRATA_FILES_PATH = '/api/strata/files'

export function strataFileUrl(fileId: string | null | undefined): string | undefined {
  return fileId ? `${STRATA_FILES_PATH}/${fileId}` : undefined
}
