import nodemailer, { type Transporter } from 'nodemailer'
import { serverEnv } from '@/lib/env'

/* Correo saliente por SMTP (credenciales en SMTP_*, leídas al ejecutarse).
   587 + SMTP_SECURE=false → STARTTLS; 465 + SMTP_SECURE=true → SSL. */

export interface MailMessage {
  /** Uno o varios destinatarios */
  to: string | string[]
  /** A quién se responde (ej. el cliente que escribió por el formulario) */
  replyTo?: string
  subject: string
  html: string
  text: string
}

let transporter: Transporter | null = null

/** Remitente: acepta `Nombre <correo>`, `Nombre correo` o solo `correo`, con o sin comillas. */
export function parseFrom(raw: string | undefined): { name: string; address: string } | null {
  const value = (raw ?? '').trim().replace(/^["']|["']$/g, '')
  const address = value.match(/<\s*([^<>\s]+@[^<>\s]+)\s*>/)?.[1] ?? value.match(/[^\s<>"']+@[^\s<>"']+/)?.[0]
  if (!address) return null
  const name = value.replace(address, '').replace(/[<>"']/g, '').trim()
  return { name, address }
}

/** Todas las direcciones válidas de un texto (ej. `a@x.co - b@y.co`), sin repetir. */
export function parseAddresses(raw: string | null | undefined): string[] {
  const found = (raw ?? '').match(/[^\s<>"',;]+@[^\s<>"',;]+\.[^\s<>"',;]+/g) ?? []
  return [...new Set(found.map((a) => a.toLowerCase()))]
}

export const isMailConfigured = () =>
  Boolean(serverEnv('SMTP_HOST') && serverEnv('SMTP_USER') && serverEnv('SMTP_PASSWORD') && parseFrom(serverEnv('SMTP_FROM')))

function getTransporter(): Transporter {
  if (transporter) return transporter
  if (!isMailConfigured()) throw new Error('SMTP no configurado (SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_FROM)')

  transporter = nodemailer.createTransport({
    host: serverEnv('SMTP_HOST'),
    port: Number(serverEnv('SMTP_PORT') ?? 587),
    secure: serverEnv('SMTP_SECURE') === 'true',
    auth: { user: serverEnv('SMTP_USER'), pass: serverEnv('SMTP_PASSWORD') },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  })
  return transporter
}

export async function sendMail(message: MailMessage): Promise<void> {
  const from = parseFrom(serverEnv('SMTP_FROM'))
  await getTransporter().sendMail({ from: from ?? undefined, ...message })
}
