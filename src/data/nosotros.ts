import type { IconName } from '@/lib/icons'

export interface Milestone {
  year: string
  event: string
}

// TODO: reemplazar por los hitos reales de Dog Doggi (la plantilla los deja como marcadores).
export const MILESTONES: Milestone[] = [
  { year: '[AÑO]', event: '[HITO]' },
  { year: '[AÑO]', event: '[HITO]' },
  { year: '[AÑO]', event: '[HITO]' },
]

export interface Service {
  icon: IconName
  title: string
  text: string
}

export const SERVICES: Service[] = [
  {
    icon: 'scissors',
    title: 'Herramientas profesionales',
    text: 'Cuchillas, tijeras, secadores, mesas y cepillería para acompañar tu trabajo diario.',
  },
  {
    icon: 'sparkles',
    title: 'Cosmética Perfect Groom',
    text: 'Nuestra línea exclusiva para el cuidado del pelaje, con respaldo de Dog Doggi.',
  },
  {
    icon: 'heart-handshake',
    title: 'Asesoría para peluqueros',
    text: 'Te ayudamos a resolver dudas sobre referencias, medidas y compatibilidad antes de comprar.',
  },
  {
    icon: 'shield-check',
    title: 'Repuestos y garantía',
    text: 'Encuentra apoyo para mantener tus herramientas y equipos en tu rutina de trabajo.',
  },
]

/** Texto de cada sede en Nosotros (la dirección sale de `LOCATIONS` en site.ts). */
export const LOCATION_DETAILS: Record<string, string> = {
  Pereira: 'Visítanos y conoce las referencias disponibles para tu peluquería.',
  Ibagué: 'Encuentra herramientas, productos y acompañamiento para tu compra.',
}
