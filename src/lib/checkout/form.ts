import { COLOMBIA_DEPARTMENTS } from '@/data/colombia-locations'
import type { OrderAddress, OrderContact } from '@/lib/orders/types'
import type { ShippingOption } from './shipping'

/*
 * Validación del formulario de checkout. La usan el servidor (fuente de verdad)
 * y la isla del formulario (para mostrar errores sin ir al servidor).
 * Sin imports de Node: corre en el navegador.
 */

export interface CheckoutFormValues {
  first_name: string
  last_name: string
  email: string
  phone: string
  identification_number: string
  delivery: string
  address_1: string
  address_2: string
  province: string
  city: string
  notes: string
  privacy: boolean
}

export type CheckoutErrors = Partial<Record<keyof CheckoutFormValues, string>>

export const EMPTY_CHECKOUT_FORM: CheckoutFormValues = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  identification_number: '',
  delivery: '',
  address_1: '',
  address_2: '',
  province: '',
  city: '',
  notes: '',
  privacy: false,
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const text = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max)
const digits = (value: unknown) => String(value ?? '').replace(/\D/g, '')

export function validateCheckoutForm(
  raw: unknown,
  options: ShippingOption[],
): { ok: true; contact: OrderContact; delivery: ShippingOption; address: OrderAddress | null } | { ok: false; errors: CheckoutErrors } {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  // +57 delante se acepta y se quita.
  const phone = digits(input.phone).replace(/^57(?=\d{10}$)/, '')
  const values = {
    first_name: text(input.first_name, 60),
    last_name: text(input.last_name, 60),
    email: text(input.email, 160).toLowerCase(),
    phone,
    identification_number: digits(input.identification_number),
    delivery: text(input.delivery, 60),
    address_1: text(input.address_1, 160),
    address_2: text(input.address_2, 160),
    province: text(input.province, 80),
    city: text(input.city, 80),
    notes: text(input.notes, 500),
  }

  const errors: CheckoutErrors = {}
  if (values.first_name.length < 2) errors.first_name = 'Escribe tu nombre.'
  if (values.last_name.length < 2) errors.last_name = 'Escribe tu apellido.'
  if (!EMAIL_RE.test(values.email)) errors.email = 'Ingresa un correo válido. Ejemplo: nombre@correo.com'
  if (!/^3\d{9}$/.test(values.phone)) errors.phone = 'Ingresa un celular válido de 10 dígitos.'
  if (!/^\d{6,10}$/.test(values.identification_number)) errors.identification_number = 'Ingresa tu cédula (6 a 10 dígitos).'

  const delivery = options.find((o) => o.code === values.delivery)
  if (!delivery) errors.delivery = 'Elige cómo quieres recibir tu pedido.'

  if (delivery && !delivery.pickup) {
    if (values.address_1.length < 5) errors.address_1 = 'Escribe la dirección de entrega.'
    const department = COLOMBIA_DEPARTMENTS.find((d) => d.department === values.province)
    if (!department) errors.province = 'Selecciona un departamento.'
    else if (!department.cities.includes(values.city)) errors.city = 'Selecciona una ciudad.'
  }
  if (input.privacy !== true) errors.privacy = 'Debes aceptar la política de tratamiento de datos.'

  if (Object.keys(errors).length || !delivery) return { ok: false, errors }

  const { first_name, last_name, email, identification_number } = values
  return {
    ok: true,
    contact: { first_name, last_name, email, phone, identification_number },
    delivery,
    address: delivery.pickup
      ? null
      : {
          address_1: values.address_1,
          address_2: values.address_2 || undefined,
          city: values.city,
          province: values.province,
          notes: values.notes || undefined,
        },
  }
}
