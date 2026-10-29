// TODO: reemplazar por el número real de Dog Doggi (la plantilla no lo trae).
export const WHATSAPP_NUMBER = '573000000000'

export const waLink = (message?: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}${message ? `?text=${encodeURIComponent(message)}` : ''}`

export const WHATSAPP_URL = waLink('Hola Dog Doggi, necesito asesoría.')
export const OFFERS_WHATSAPP_URL = waLink('Hola Dog Doggi, quiero conocer las ofertas.')

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

export interface MegaMenuGroup {
  title: string
  links: NavItem[]
}

// Mientras no existan las páginas de catálogo, los ítems apuntan a las secciones del home.
export const NAV_BEFORE: NavItem[] = [{ label: 'Perfect Groom', href: '/#perfect-groom', highlight: true }]

export const SHOP_MENU: MegaMenuGroup[] = [
  {
    title: 'Herramientas de corte',
    links: [
      { label: 'Cuchillas', href: '/#destacados' },
      { label: 'Tijeras', href: '/#destacados' },
      { label: 'Cepillería y peinado', href: '/#destacados' },
    ],
  },
  {
    title: 'Equipamiento',
    links: [
      { label: 'Secadores y sopladores', href: '/#destacados' },
      { label: 'Mesas de corte', href: '/#destacados' },
      { label: 'Repuestos y accesorios', href: '/#destacados' },
    ],
  },
]

export const NAV_AFTER: NavItem[] = [
  { label: 'Ofertas', href: '/#ofertas' },
  { label: 'Blog', href: '/blog' },
  { label: 'Nosotros', href: '/#nosotros' },
  { label: 'Contacto', href: '#contacto' },
]

export const FOOTER_COLUMNS: { title: string; links: NavItem[] }[] = [
  {
    title: 'Tienda',
    links: [
      { label: 'Perfect Groom', href: '/#perfect-groom' },
      { label: 'Herramientas', href: '/#destacados' },
      { label: 'Equipamiento', href: '/#destacados' },
      { label: 'Ofertas', href: '/#ofertas' },
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
      { label: 'Nosotros', href: '/#nosotros' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contacto', href: '#contacto' },
      // TODO: página de políticas y privacidad.
      { label: 'Políticas y privacidad', href: waLink('Hola Dog Doggi, quiero conocer sus políticas de privacidad.'), external: true },
    ],
  },
]

export const PAYMENT_MARKS = ['VISA', 'MC', 'PSE']

// Atributos para abrir enlaces externos en otra pestaña de forma segura.
export const externalAttrs = (item: { external?: boolean }) =>
  item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
