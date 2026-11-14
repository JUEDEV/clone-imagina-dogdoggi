// Número de WhatsApp de la plantilla (versión con páginas internas).
export const WHATSAPP_NUMBER = '573138355801'
/** Número legible para mostrar en pantalla. */
export const WHATSAPP_DISPLAY = '313 835 5801'

export const waLink = (message?: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}${message ? `?text=${encodeURIComponent(message)}` : ''}`

export const WHATSAPP_URL = waLink('Hola, quiero información sobre los productos de Dog Doggi')
export const OFFERS_WHATSAPP_URL = waLink('Hola Dog Doggi, quiero conocer las ofertas.')

// TODO: confirmar correo y horario reales (la plantilla los trae "por confirmar").
export const CONTACT_EMAIL = '[correo por confirmar]'
export const CONTACT_SCHEDULE = '[Horario por confirmar]'

export interface Location {
  city: string
  /** Dirección corta, como se pinta en la tarjeta. */
  address: string
  /** Dirección completa para buscarla en Google Maps. */
  mapsQuery: string
}

export const LOCATIONS: Location[] = [
  { city: 'Pereira', address: 'Calle 37 #4B-05', mapsQuery: 'Calle 37 #4B-05, Pereira' },
  { city: 'Ibagué', address: 'Cra. 4C #29-86, Hipódromo', mapsQuery: 'Cra. 4C #29-86, barrio Hipódromo, Ibagué' },
]

export const mapsUrl = (location: Location) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.mapsQuery)}`

// TODO: confirmar las cuentas reales; la plantilla solo enlaza a las portadas de cada red.
export const SOCIAL = [
  { label: 'Instagram', href: 'https://instagram.com', icon: 'instagram' },
  { label: 'Facebook', href: 'https://facebook.com', icon: 'facebook' },
  { label: 'TikTok', href: 'https://tiktok.com', icon: 'music' },
  { label: 'YouTube', href: 'https://youtube.com', icon: 'youtube' },
] as const

export const YOUTUBE_URL = 'https://www.youtube.com/results?search_query=dog+grooming+tips'

export interface NavItem {
  label: string
  href: string
  external?: boolean
  /** Resalta el ítem con el azul de Perfect Groom. */
  highlight?: boolean
}

/** Categoría del menú Tienda; si tiene `children`, se despliegan al lado (escritorio) o en acordeón (móvil). */
export interface ShopMenuItem {
  label: string
  href: string
  children?: NavItem[]
}

// TODO: al conectar Strata, confirmar que los slugs de categoría coincidan con los del CMS.
export const NAV_BEFORE: NavItem[] = [{ label: 'Perfect Groom', href: '/productos?marca=Perfect+Groom', highlight: true }]

// Menú Tienda según la referencia del cliente: lista vertical; las categorías
// con subcategorías las despliegan al lado. Va fijo aquí (no sale del catálogo)
// porque las páginas estáticas se generan sin acceso a Strata.
// TODO: completar las subcategorías de las demás categorías cuando el cliente las envíe.
const cat = (slug: string) => `/categorias/${slug}`
export const SHOP_MENU: ShopMenuItem[] = [
  { label: 'Cosmética', href: cat('cosmetica') },
  { label: 'Complementos', href: cat('complementos') },
  {
    label: 'Tijeras',
    href: cat('tijeras'),
    children: [
      { label: 'Tijeras curvas', href: cat('tijeras-curvas') },
      { label: 'Tijeras microdentadas', href: cat('tijeras-microdentadas') },
      { label: 'Tijeras de esculpir', href: cat('tijeras-de-esculpir') },
      { label: 'Tijeras chunkers', href: cat('tijeras-chunkers') },
      { label: 'Tijeras para zurdos', href: cat('tijeras-para-zurdos') },
      { label: 'Tijeras DNA', href: cat('tijeras-dna') },
      { label: 'Sets de tijeras', href: cat('sets-de-tijeras') },
      { label: 'Complementos tijeras', href: cat('complementos-tijeras') },
    ],
  },
  { label: 'Máquinas', href: cat('maquinas') },
  { label: 'Cuchillas', href: cat('cuchillas') },
  {
    label: 'Equipamiento',
    href: cat('equipamiento'),
    children: [
      { label: 'Secadores y sopladores', href: cat('secadores-y-sopladores') },
      { label: 'Mesas de corte', href: cat('mesas-de-corte') },
      { label: 'Repuestos y accesorios', href: cat('repuestos-y-accesorios') },
    ],
  },
  { label: 'Vestuario profesional', href: cat('vestuario-profesional') },
  { label: 'Formación', href: cat('formacion') },
]

export const NAV_AFTER: NavItem[] = [
  { label: 'Ofertas', href: '/productos?destacado=ofertas' },
  { label: 'Blog', href: '/blog' },
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Contacto', href: '/contacto' },
]

export const FOOTER_COLUMNS: { title: string; links: NavItem[] }[] = [
  {
    title: 'Tienda',
    links: [
      { label: 'Perfect Groom', href: '/productos?marca=Perfect+Groom' },
      { label: 'Tijeras', href: '/categorias/tijeras' },
      { label: 'Equipamiento', href: '/categorias/equipamiento' },
      { label: 'Ofertas', href: '/productos?destacado=ofertas' },
    ],
  },
  {
    title: 'Ayuda',
    links: [
      { label: 'Envíos y devoluciones', href: waLink('Hola Dog Doggi, tengo una pregunta sobre envíos y devoluciones.'), external: true },
      { label: 'Garantías', href: waLink('Hola Dog Doggi, tengo una pregunta sobre garantías y repuestos.'), external: true },
      { label: 'Preguntas frecuentes', href: waLink('Hola Dog Doggi, tengo una pregunta.'), external: true },
      { label: 'Habla con nosotros', href: WHATSAPP_URL, external: true },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Nosotros', href: '/nosotros' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contacto', href: '/contacto' },
      // TODO: página de políticas y privacidad.
      { label: 'Políticas y privacidad', href: waLink('Hola Dog Doggi, quiero conocer sus políticas de privacidad.'), external: true },
    ],
  },
]

export const PAYMENT_MARKS = ['VISA', 'MC', 'PSE']

// Atributos para abrir enlaces externos en otra pestaña de forma segura.
export const externalAttrs = (item: { external?: boolean }) =>
  item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
