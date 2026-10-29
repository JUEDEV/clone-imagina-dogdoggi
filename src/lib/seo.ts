export const SITE_NAME = 'Dog Doggi'
export const DEFAULT_TITLE = 'Dog Doggi | Todo para tu peluquería canina'
export const DEFAULT_DESCRIPTION =
  'Dog Doggi: herramientas, equipos y cosmética Perfect Groom para peluqueros caninos profesionales. Envíos a todo el país y asesoría por WhatsApp.'
export const DEFAULT_OG_IMAGE = '/images/photos/sesion-secado.webp'
export const DEFAULT_AUTHOR = 'Imagina Colombia'
export const DEFAULT_THEME_COLOR = '#051C48'

export const buildTitle = (title?: string | null) => {
  const clean = (title || '').trim()

  if (!clean) return DEFAULT_TITLE
  if (clean === SITE_NAME) return SITE_NAME

  return `${clean} | ${SITE_NAME}`
}

export interface Crumb {
  label: string
  href?: string
}

/** JSON-LD BreadcrumbList a partir de la misma ruta que pinta el hero. */
export const breadcrumbJsonLd = (crumbs: Crumb[], site?: URL, currentPath?: string) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((crumb, i) => {
    const path = crumb.href ?? (i === crumbs.length - 1 ? currentPath : undefined)
    return {
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.label,
      ...(path ? { item: site ? new URL(path, site).toString() : path } : {}),
    }
  }),
})
