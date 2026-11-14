import { randomInt } from 'node:crypto'

// Referencia del pedido = referencia de pago en Wompi: DD-AAAAMMDD-XXXXXXXX.
// Sin 0/O ni 1/I para que se pueda dictar por teléfono sin confusiones.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const PATTERN = /^DD-\d{8}-[A-Z2-9]{8}$/

export function createOrderReference(date = new Date()): string {
  const day = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
  return `DD-${day}-${random}`
}

export const isOrderReference = (value: string) => PATTERN.test(value)
