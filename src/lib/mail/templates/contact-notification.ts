import type { ContactInput } from '@/lib/forms/contact'
import type { MailMessage } from '../smtp'

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/** Aviso a la tienda de un mensaje nuevo del formulario de Contacto (responder = responder al cliente). */
export function contactNotificationEmail({
  to,
  input,
  source,
}: {
  to: string[]
  input: ContactInput
  source: string | null
}): MailMessage {
  const subject = `Nuevo mensaje de contacto · ${input.topic} — ${input.name}`
  const rows: [string, string][] = (
    [
      ['Nombre', input.name],
      ['Correo', input.email],
      ['Teléfono', input.phone],
      ['Ciudad', input.city],
      ['Consulta', input.topic],
      ['Página', source ?? ''],
    ] as [string, string][]
  ).filter((row) => Boolean(row[1]))

  const text = [
    'Llegó un mensaje nuevo desde el formulario de Contacto de Dog Doggi.',
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    'Mensaje:',
    input.message,
    '',
    'Responde este correo para contestarle directamente al cliente.',
  ].join('\n')

  // Colores de la marca: navy #051C48, turquesa #1FCFCC, naranja #D95000.
  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#eef8f8;font-family:Helvetica,Arial,sans-serif;color:#051c48;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef8f8;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #dce5ea;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:0;height:6px;background:#1fcfcc;"></td>
            </tr>
            <tr>
              <td style="padding:32px 32px 8px;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:bold;letter-spacing:0.13em;text-transform:uppercase;color:#087f80;">Dog Doggi · Contacto</p>
                <h1 style="margin:0;font-size:24px;line-height:1.2;">Nuevo mensaje de ${escapeHtml(input.name)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.5;">
                  ${rows
                    .map(
                      ([label, value]) =>
                        `<tr><td style="padding:6px 12px 6px 0;width:90px;color:#43516b;vertical-align:top;">${label}</td><td style="padding:6px 0;color:#051c48;font-weight:bold;">${escapeHtml(value)}</td></tr>`,
                    )
                    .join('\n                  ')}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;">
                <p style="margin:0;padding:18px;border-radius:11px;background:#f2f7f8;font-size:15px;line-height:1.6;white-space:pre-line;">${escapeHtml(input.message)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;font-size:12px;line-height:1.6;color:#43516b;">Responde este correo para contestarle directamente al cliente.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return { to, replyTo: input.email, subject, html, text }
}
