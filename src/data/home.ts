import type { IconName } from '@/lib/icons'
import { YOUTUBE_URL } from '@/data/site'

/* ---- Hero ---- */

export type HeroTheme = 'perfect' | 'tools' | 'offers'

export type HeroArt =
  | { kind: 'product'; photo: string; product: string; seal: string }
  | { kind: 'cutout'; photo: string; cutout: string }
  | { kind: 'sale'; photo: string; sale: string }

export interface HeroSlide {
  theme: HeroTheme
  eyebrow: string
  title: string
  accent: string
  text: string
  cta: { label: string; href: string }
  art: HeroArt
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    theme: 'perfect',
    eyebrow: 'Exclusiva de Dog Doggi',
    title: 'Nutrición que se nota.',
    accent: 'Brillo que se siente.',
    text: 'Perfect Groom acompaña cada baño con cuidado profesional, de la raíz hasta las puntas.',
    cta: { label: 'Descubrir Perfect Groom', href: '#perfect-groom' },
    art: {
      kind: 'product',
      photo: '/images/photos/sesion-secado.webp',
      product: '/images/products/perfect-groom-shampoo.jpeg',
      seal: 'Uso profesional',
    },
  },
  {
    theme: 'tools',
    eyebrow: 'Equipo para expertos',
    title: 'Herramientas que',
    accent: 'trabajan contigo.',
    text: 'Precisión, potencia y respaldo para que cada jornada en tu peluquería sea más fluida.',
    cta: { label: 'Ver herramientas', href: '#destacados' },
    art: { kind: 'cutout', photo: '/images/photos/peluquero-corte.webp', cutout: '/images/products/tijera-curva.png' },
  },
  {
    theme: 'offers',
    eyebrow: 'Ofertas de temporada',
    title: 'Renueva tu mesa.',
    accent: 'Cuida tu presupuesto.',
    text: 'Descuentos en productos seleccionados para equipar tu peluquería como merece.',
    cta: { label: 'Ver todas las ofertas', href: '#ofertas' },
    art: { kind: 'sale', photo: '/images/photos/puesto-trabajo.webp', sale: '25%' },
  },
]

/* ---- Categorías ---- */

export interface Category {
  name: string
  note: string
  image: string
  href: string
  /** `photo`: la imagen es una foto y se funde con un degradado en vez de recortarse. */
  photo?: boolean
}

export const CATEGORIES: Category[] = [
  { name: 'Cosmética', note: 'Cuidado del pelaje', image: '/images/products/perfect-groom-shampoo.jpeg', href: '#perfect-groom', photo: true },
  { name: 'Cuchillas', note: 'Cortes precisos', image: '/images/products/herramientas-acabado.png', href: '#destacados', photo: true },
  { name: 'Tijeras', note: 'Rectas y curvas', image: '/images/products/kit-tijeras.png', href: '#destacados', photo: true },
  { name: 'Secadores y sopladores', note: 'Potencia profesional', image: '/images/photos/sesion-secado.webp', href: '#destacados', photo: true },
  { name: 'Mesas y equipamiento', note: 'Tu espacio de trabajo', image: '/images/photos/puesto-trabajo.webp', href: '#destacados', photo: true },
  { name: 'Cepillería', note: 'Desenredo y acabado', image: '/images/products/set-cepilleria.png', href: '#destacados', photo: true },
  { name: 'Repuestos', note: 'Compatibilidad y medidas', image: '/images/products/tijera-curva.png', href: '#destacados', photo: true },
  { name: 'Ofertas', note: 'Oportunidades del mes', image: '/images/photos/peluquero-corte.webp', href: '#ofertas', photo: true },
]

/* ---- Perfect Groom ---- */

export const PERFECT_BENEFITS: { icon: IconName; label: string }[] = [
  { icon: 'bath', label: 'Limpieza' },
  { icon: 'sparkles', label: 'Brillo' },
  { icon: 'star', label: 'Suavidad' },
  { icon: 'badge-check', label: 'Uso profesional' },
]

/* ---- Franja de confianza ---- */

export interface TrustItem {
  icon: IconName
  title: string
  text: string
}

export const TRUST_ITEMS: TrustItem[] = [
  { icon: 'truck', title: 'Envíos a todo el país', text: 'Llevamos tu compra hasta tu puerta' },
  { icon: 'credit-card', title: 'Pago seguro', text: 'Compra con total tranquilidad' },
  { icon: 'wrench', title: 'Garantía y repuestos', text: 'Respaldo para tus herramientas' },
  { icon: 'message-circle', title: 'Asesoría por WhatsApp', text: 'Resolvemos tus dudas de compra' },
]

/* ---- Testimonios ---- */

export interface Testimonial {
  name: string
  city: string
  text: string
  image: string
}

export const TESTIMONIALS: Testimonial[] = [
  { name: 'Laura Gómez', city: 'Bogotá', text: 'Encuentro las referencias que uso todos los días y puedo repetir mis compras sin complicarme.', image: '/images/photos/peluquero-corte.webp' },
  { name: 'Camila Rodríguez', city: 'Medellín', text: 'La línea Perfect Groom se volvió parte de mi rutina de trabajo. Mis clientes preguntan por ella.', image: '/images/photos/puesto-trabajo.webp' },
  { name: 'Andrés Martínez', city: 'Cali', text: 'La asesoría para elegir herramientas y repuestos hace que comprar sea mucho más fácil.', image: '/images/photos/secado-profesional.webp' },
]

/* ---- Videos ---- */

export interface Video {
  title: string
  duration: string
  image: string
  alt: string
  /** TODO: enlazar el video oficial cuando exista el canal. */
  href: string
}

export const FEATURED_VIDEO: Video = {
  title: 'Cuidado profesional, paso a paso',
  duration: '04:32',
  image: '/images/photos/secado-profesional.webp',
  alt: 'Peluquera secando el pelaje de un perro',
  href: YOUTUBE_URL,
}

export const SIDE_VIDEOS: Video[] = [
  { title: 'Prepara tu puesto de trabajo', duration: '03:18', image: '/images/photos/puesto-trabajo.webp', alt: '', href: YOUTUBE_URL },
  { title: 'Secado según el tipo de pelaje', duration: '05:06', image: '/images/photos/sesion-secado.webp', alt: '', href: YOUTUBE_URL },
]
