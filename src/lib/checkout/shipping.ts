import { LOCATIONS } from '@/data/site'
import { isStrataConfigured, strataItems } from '@/lib/strata'

/*
 * Formas de entrega. Con Strata salen de `ecommerce_shipment_methods` activos
 * (`code`, `name`, `config: { price, pickup, description }`); sin Strata se usan
 * las de abajo: recoger en cada sede o envío nacional con flete contra entrega
 * (como Herbolario cuando la tarifa es 0).
 * TODO: confirmar con Dog Doggi tarifas y transportadora.
 */

export interface ShippingOption {
  code: string
  label: string
  description: string
  /** Lo que se cobra en línea (0 = sin costo o se paga a la transportadora). */
  price: number
  pickup: boolean
}

const slug = (text: string) =>
  text
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')

const DEFAULT_OPTIONS: ShippingOption[] = [
  {
    code: 'envio-nacional',
    label: 'Envío a domicilio',
    description: 'Enviamos a todo el país. El flete se paga contra entrega a la transportadora.',
    price: 0,
    pickup: false,
  },
  ...LOCATIONS.map((location) => ({
    code: `recoger-${slug(location.city)}`,
    label: `Recoger en sede ${location.city}`,
    description: `${location.address}. Te avisamos cuando tu pedido esté listo.`,
    price: 0,
    pickup: true,
  })),
]

interface RawShipmentMethod {
  id: string
  code: string | null
  name: string | null
  active: boolean | null
  sort: number | null
  config: { price?: number | string; pickup?: boolean; description?: string } | null
}

export async function getShippingOptions(): Promise<ShippingOption[]> {
  if (!isStrataConfigured()) return DEFAULT_OPTIONS
  try {
    const { data } = await strataItems<RawShipmentMethod>('ecommerce_shipment_methods', { limit: 50, lang: 'es' })
    const options = data
      .filter((m) => m.code && m.name && m.active !== false)
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
      .map((m) => ({
        code: m.code as string,
        label: m.name as string,
        description: m.config?.description ?? '',
        price: Math.max(0, Math.round(Number(m.config?.price) || 0)),
        pickup: Boolean(m.config?.pickup),
      }))
    return options.length ? options : DEFAULT_OPTIONS
  } catch (error) {
    console.error('[shipping] no se pudieron leer los métodos de envío', error instanceof Error ? error.message : error)
    return DEFAULT_OPTIONS
  }
}
