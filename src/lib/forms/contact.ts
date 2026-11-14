import { CONTACT_TOPICS, type ContactTopic } from '@/data/contacto'
import { serverEnv } from '@/lib/env'
import { isMailConfigured, parseAddresses, parseFrom, sendMail } from '@/lib/mail/smtp'
import { contactNotificationEmail } from '@/lib/mail/templates/contact-notification'

export interface ContactInput {
  name: string
  email: string
  phone: string
  city: string
  topic: ContactTopic
  message: string
}

export type ContactField = keyof ContactInput | 'privacy'
export type ContactErrors = Partial<Record<ContactField, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Mismos mensajes que el script del formulario: el servidor vuelve a validar
// porque el endpoint se puede llamar sin pasar por la página.
export function validateContact(raw: Record<string, unknown>): { data: ContactInput } | { errors: ContactErrors } {
  const text = (key: string, max: number) => String(raw[key] ?? '').trim().slice(0, max)
  const data = {
    name: text('name', 120),
    email: text('email', 160),
    phone: text('phone', 40),
    city: text('city', 80),
    topic: (CONTACT_TOPICS as readonly string[]).includes(text('topic', 60)) ? (text('topic', 60) as ContactTopic) : 'Otro',
    message: text('message', 4000),
  }

  const errors: ContactErrors = {}
  if (data.name.length < 3) errors.name = 'Escribe tu nombre completo.'
  if (!EMAIL_RE.test(data.email)) errors.email = 'Escribe un correo electrónico válido.'
  if (data.phone.replace(/\D/g, '').length < 7) errors.phone = 'Escribe un teléfono o WhatsApp válido.'
  if (data.message.length < 10) errors.message = 'Cuéntanos un poco más; el mensaje debe tener al menos 10 caracteres.'
  if (raw.privacy !== true && raw.privacy !== 'on') errors.privacy = 'Debes aceptar la política para enviar el mensaje.'

  return Object.keys(errors).length ? { errors } : { data }
}

export class MailNotConfiguredError extends Error {}

/**
 * Envía el mensaje a la tienda. A diferencia de los proyectos con CMS, aquí el
 * correo ES el registro (todavía no hay dónde guardarlo), así que si falla se
 * lanza el error para que el cliente lo sepa y pueda escribir por WhatsApp.
 * Destinatarios: CONTACT_NOTIFY_TO (puede traer varios) o, si no está, la casilla de SMTP_FROM.
 */
export async function submitContact(input: ContactInput, source: string | null): Promise<void> {
  const to = parseAddresses(serverEnv('CONTACT_NOTIFY_TO') ?? parseFrom(serverEnv('SMTP_FROM'))?.address)
  if (!isMailConfigured() || to.length === 0) throw new MailNotConfiguredError('SMTP o destinatario sin configurar')
  await sendMail(contactNotificationEmail({ to, input, source }))
}
