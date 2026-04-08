import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = 'Revive Auto Lab <noreply@reviveautolab.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL

// XSS'e karşı HTML escape helper
function escapeHtml(str) {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function sendBookingConfirmation({
  to,
  name,
  plate,
  packageName,
  locationName,
  slotTime,
  bookingId
}) {
  const safeName         = escapeHtml(name)
  const safePlate        = escapeHtml(plate)
  const safePackageName  = escapeHtml(packageName)
  const safeLocationName = escapeHtml(locationName)
  const safeBookingId    = escapeHtml(bookingId)

  const formattedDate = new Date(slotTime).toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const formattedTime = new Date(slotTime).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const { data, error } = await resend.emails.send({
    from: 'Revive Auto Lab <onboarding@resend.dev>',
    to,
    subject: 'Randevunuz Onaylandı — Revive Auto Lab',
    html: `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">

                <tr>
                  <td style="background:#1a1a1a;padding:32px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">
                      Revive Auto Lab
                    </h1>
                    <p style="color:#9ca3af;margin:8px 0 0;font-size:14px;">Premium Araç Bakım</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:40px 32px;">
                    <h2 style="color:#1a1a1a;margin:0 0 8px;font-size:20px;">
                      Randevunuz Onaylandı ✓
                    </h2>
                    <p style="color:#6b7280;margin:0 0 32px;font-size:15px;">
                      Merhaba ${safeName}, randevunuz başarıyla oluşturuldu.
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background:#f9fafb;border-radius:8px;padding:24px;margin-bottom:32px;">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                          <table width="100%"><tr>
                            <td style="color:#6b7280;font-size:14px;">Plaka</td>
                            <td style="color:#1a1a1a;font-size:14px;font-weight:600;text-align:right;">
                              ${safePlate}
                            </td>
                          </tr></table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                          <table width="100%"><tr>
                            <td style="color:#6b7280;font-size:14px;">Hizmet</td>
                            <td style="color:#1a1a1a;font-size:14px;font-weight:600;text-align:right;">
                              ${safePackageName}
                            </td>
                          </tr></table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                          <table width="100%"><tr>
                            <td style="color:#6b7280;font-size:14px;">Lokasyon</td>
                            <td style="color:#1a1a1a;font-size:14px;font-weight:600;text-align:right;">
                              ${safeLocationName}
                            </td>
                          </tr></table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                          <table width="100%"><tr>
                            <td style="color:#6b7280;font-size:14px;">Tarih</td>
                            <td style="color:#1a1a1a;font-size:14px;font-weight:600;text-align:right;">
                              ${formattedDate}
                            </td>
                          </tr></table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <table width="100%"><tr>
                            <td style="color:#6b7280;font-size:14px;">Saat</td>
                            <td style="color:#1a1a1a;font-size:14px;font-weight:600;text-align:right;">
                              ${formattedTime}
                            </td>
                          </tr></table>
                        </td>
                      </tr>
                    </table>

                    <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0 0 32px;">
                      Rezervasyon No: <span style="font-family:monospace;">${safeBookingId}</span>
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${APP_URL}/tr/tracking"
                            style="display:inline-block;background:#1a1a1a;color:#ffffff;
                            text-decoration:none;padding:14px 32px;border-radius:8px;
                            font-size:15px;font-weight:600;">
                            Rezervasyonumu Görüntüle
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="background:#f9fafb;padding:24px 32px;text-align:center;
                    border-top:1px solid #e5e7eb;">
                    <p style="color:#9ca3af;font-size:12px;margin:0;">
                      Bu emaili siz talep ettiniz. Sorun varsa bize ulaşın.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  })

  if (error) {
    console.error('Booking email gönderilemedi:', error)
  }

  return { data, error }
}

export async function sendCancellationEmail({
  to,
  name,
  plate,
  slotTime,
  reason
}) {
  const safeName   = escapeHtml(name)
  const safePlate  = escapeHtml(plate)
  const safeReason = escapeHtml(reason)

  const formattedDate = new Date(slotTime).toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const formattedTime = new Date(slotTime).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const { data, error } = await resend.emails.send({
    from: 'Revive Auto Lab <onboarding@resend.dev>',
    to,
    subject: 'Randevunuz İptal Edildi — Revive Auto Lab',
    html: `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0"
                style="background:#ffffff;border-radius:12px;overflow:hidden;">

                <tr>
                  <td style="background:#1a1a1a;padding:32px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">
                      Revive Auto Lab
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td style="padding:40px 32px;">
                    <h2 style="color:#dc2626;margin:0 0 8px;font-size:20px;">
                      Randevunuz İptal Edildi
                    </h2>
                    <p style="color:#6b7280;margin:0 0 32px;font-size:15px;">
                      Merhaba ${safeName}, aşağıdaki randevunuz iptal edilmiştir.
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background:#fef2f2;border-radius:8px;padding:24px;margin-bottom:24px;">
                      <tr>
                        <td style="padding:6px 0;">
                          <span style="color:#6b7280;font-size:14px;">Plaka: </span>
                          <strong style="color:#1a1a1a;font-size:14px;">${safePlate}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;">
                          <span style="color:#6b7280;font-size:14px;">Tarih: </span>
                          <strong style="color:#1a1a1a;font-size:14px;">${formattedDate} ${formattedTime}</strong>
                        </td>
                      </tr>
                      ${safeReason ? `
                      <tr>
                        <td style="padding:6px 0;">
                          <span style="color:#6b7280;font-size:14px;">Sebep: </span>
                          <strong style="color:#1a1a1a;font-size:14px;">${safeReason}</strong>
                        </td>
                      </tr>` : ''}
                    </table>

                    <p style="color:#6b7280;font-size:14px;margin:0 0 32px;">
                      Yeni bir randevu almak için aşağıdaki butona tıklayabilirsiniz.
                      Plaka bloğu 2 gün süreyle aktif kalacaktır.
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${APP_URL}/tr/booking"
                            style="display:inline-block;background:#1a1a1a;color:#ffffff;
                            text-decoration:none;padding:14px 32px;border-radius:8px;
                            font-size:15px;font-weight:600;">
                            Yeni Randevu Al
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="background:#f9fafb;padding:24px 32px;text-align:center;
                    border-top:1px solid #e5e7eb;">
                    <p style="color:#9ca3af;font-size:12px;margin:0;">
                      Revive Auto Lab — Premium Araç Bakım
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  })

  if (error) {
    console.error('İptal email gönderilemedi:', error)
  }

  return { data, error }
}

export async function sendStatusUpdateEmail({
  to,
  name,
  plate,
  newStatus,
  slotTime
}) {
  const safeName  = escapeHtml(name)
  const safePlate = escapeHtml(plate)

  const statusMessages = {
    ACCEPTED:    { text: 'Randevunuz onaylandı', color: '#16a34a', emoji: '✓' },
    IN_PROGRESS: { text: 'Aracınız işlemde',     color: '#d97706', emoji: '🔧' },
    DONE:        { text: 'İşlem tamamlandı',      color: '#2563eb', emoji: '✓' }
  }

  const statusInfo = statusMessages[newStatus]
  if (!statusInfo) return

  const { data, error } = await resend.emails.send({
    from: 'Revive Auto Lab <onboarding@resend.dev>',
    to,
    subject: `${statusInfo.text} — Revive Auto Lab`,
    html: `
      <!DOCTYPE html>
      <html lang="tr">
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0"
                style="background:#ffffff;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="background:#1a1a1a;padding:32px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:24px;">Revive Auto Lab</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px 32px;text-align:center;">
                    <div style="font-size:48px;margin-bottom:16px;">${statusInfo.emoji}</div>
                    <h2 style="color:${statusInfo.color};margin:0 0 8px;font-size:22px;">
                      ${statusInfo.text}
                    </h2>
                    <p style="color:#6b7280;margin:0 0 24px;font-size:15px;">
                      Merhaba ${safeName}, <strong>${safePlate}</strong> plakalı aracınızın durumu güncellendi.
                    </p>
                    <a href="${APP_URL}/tr/tracking"
                      style="display:inline-block;background:#1a1a1a;color:#ffffff;
                      text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;">
                      Detayları Görüntüle
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f9fafb;padding:20px;text-align:center;
                    border-top:1px solid #e5e7eb;">
                    <p style="color:#9ca3af;font-size:12px;margin:0;">Revive Auto Lab</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  })

  if (error) {
    console.error('Status email gönderilemedi:', error)
  }

  return { data, error }
}

export async function sendOtpEmail({ to, code, expiresInMinutes = 10 }) {
  const safeCode = escapeHtml(String(code))

  const { data, error } = await resend.emails.send({
    from: 'Revive Auto Lab <onboarding@resend.dev>',
    to,
    subject: 'Doğrulama Kodunuz — Revive Auto Lab',
    html: `
      <!DOCTYPE html>
      <html lang="tr">
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0"
                style="background:#ffffff;border-radius:12px;overflow:hidden;">

                <tr>
                  <td style="background:#1a1a1a;padding:32px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">
                      Revive Auto Lab
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td style="padding:40px 32px;text-align:center;">
                    <p style="color:#6b7280;font-size:15px;margin:0 0 24px;">
                      Doğrulama kodunuz aşağıda. Bu kod
                      <strong>${expiresInMinutes} dakika</strong> geçerlidir.
                    </p>

                    <div style="
                      display:inline-block;
                      background:#f9fafb;
                      border:2px dashed #e5e7eb;
                      border-radius:12px;
                      padding:24px 48px;
                      margin:0 0 24px;
                    ">
                      <span style="
                        font-size:2.5rem;
                        font-weight:900;
                        letter-spacing:0.25em;
                        color:#111827;
                        font-family:monospace;
                      ">${safeCode}</span>
                    </div>

                    <p style="color:#9ca3af;font-size:13px;margin:0;">
                      Bu kodu kimseyle paylaşmayın.
                      Eğer bu işlemi siz yapmadıysanız bu emaili görmezden gelin.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="background:#f9fafb;padding:20px 32px;text-align:center;
                    border-top:1px solid #e5e7eb;">
                    <p style="color:#9ca3af;font-size:12px;margin:0;">
                      Revive Auto Lab — Premium Araç Bakım
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  })

  if (error) {
    console.error('OTP email gönderilemedi:', error)
  }

  return { data, error }
}

export async function sendContactEmail({ name, email, message }) {
  const BUSINESS_EMAIL = process.env.CONTACT_RECEIVER_EMAIL

  const safeName    = escapeHtml(name)
  const safeEmail   = escapeHtml(email)
  const safeMessage = escapeHtml(message)

  const notifyPromise = resend.emails.send({
    from: 'Revive Auto Lab <onboarding@resend.dev>',
    to: BUSINESS_EMAIL,
    replyTo: email,
    subject: `Yeni İletişim Mesajı — ${safeName}`,
    html: `
      <!DOCTYPE html>
      <html lang="tr">
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0"
                style="background:#ffffff;border-radius:12px;overflow:hidden;">

                <tr>
                  <td style="background:#1a1a1a;padding:28px 32px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">
                      Revive Auto Lab
                    </h1>
                    <p style="color:#9ca3af;margin:6px 0 0;font-size:13px;">
                      Yeni İletişim Formu Mesajı
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:36px 32px;">
                    <table width="100%" cellpadding="0" cellspacing="0"
                      style="background:#f9fafb;border-radius:8px;padding:24px;margin-bottom:28px;">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                          <table width="100%"><tr>
                            <td style="color:#6b7280;font-size:14px;width:30%;">Ad Soyad</td>
                            <td style="color:#1a1a1a;font-size:14px;font-weight:600;text-align:right;">
                              ${safeName}
                            </td>
                          </tr></table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <table width="100%"><tr>
                            <td style="color:#6b7280;font-size:14px;width:30%;">E-posta</td>
                            <td style="text-align:right;">
                              <a href="mailto:${safeEmail}"
                                style="color:#1a1a1a;font-size:14px;font-weight:600;">
                                ${safeEmail}
                              </a>
                            </td>
                          </tr></table>
                        </td>
                      </tr>
                    </table>

                    <p style="color:#374151;font-size:14px;font-weight:600;margin:0 0 10px;">
                      Mesaj
                    </p>
                    <div style="background:#f9fafb;border-left:3px solid #1a1a1a;
                      border-radius:4px;padding:16px 20px;">
                      <p style="color:#374151;font-size:15px;margin:0;line-height:1.7;
                        white-space:pre-wrap;">${safeMessage}</p>
                    </div>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                      <tr>
                        <td align="center">
                          <a href="mailto:${safeEmail}"
                            style="display:inline-block;background:#1a1a1a;color:#ffffff;
                            text-decoration:none;padding:12px 28px;border-radius:8px;
                            font-size:14px;font-weight:600;">
                            Yanıtla
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="background:#f9fafb;padding:20px 32px;text-align:center;
                    border-top:1px solid #e5e7eb;">
                    <p style="color:#9ca3af;font-size:12px;margin:0;">
                      reviveautolab.com — İletişim Formu
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  })

  const autoReplyPromise = resend.emails.send({
    from: 'Revive Auto Lab <onboarding@resend.dev>',
    to: email,
    subject: 'Mesajınızı Aldık — Revive Auto Lab',
    html: `
      <!DOCTYPE html>
      <html lang="tr">
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0"
                style="background:#ffffff;border-radius:12px;overflow:hidden;">

                <tr>
                  <td style="background:#1a1a1a;padding:28px 32px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">
                      Revive Auto Lab
                    </h1>
                    <p style="color:#9ca3af;margin:6px 0 0;font-size:13px;">Premium Araç Bakım</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:40px 32px;text-align:center;">
                    <div style="font-size:40px;margin-bottom:16px;">✉️</div>
                    <h2 style="color:#1a1a1a;margin:0 0 12px;font-size:20px;">
                      Mesajınızı Aldık!
                    </h2>
                    <p style="color:#6b7280;font-size:15px;margin:0 0 28px;line-height:1.6;">
                      Merhaba <strong>${safeName}</strong>, mesajınız bize ulaştı.<br>
                      En kısa sürede size geri döneceğiz.
                    </p>

                    <div style="background:#f9fafb;border-radius:8px;padding:20px 24px;
                      text-align:left;margin-bottom:28px;">
                      <p style="color:#9ca3af;font-size:12px;margin:0 0 8px;
                        text-transform:uppercase;letter-spacing:0.05em;">
                        Gönderdiğiniz mesaj
                      </p>
                      <p style="color:#374151;font-size:14px;margin:0;line-height:1.7;
                        white-space:pre-wrap;">${safeMessage}</p>
                    </div>

                    <a href="${APP_URL}/tr/booking"
                      style="display:inline-block;background:#1a1a1a;color:#ffffff;
                      text-decoration:none;padding:13px 28px;border-radius:8px;
                      font-size:14px;font-weight:600;">
                      Randevu Al
                    </a>
                  </td>
                </tr>

                <tr>
                  <td style="background:#f9fafb;padding:20px 32px;text-align:center;
                    border-top:1px solid #e5e7eb;">
                    <p style="color:#9ca3af;font-size:12px;margin:0;">
                      Revive Auto Lab — Premium Araç Bakım
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  })

  const [notify, autoReply] = await Promise.allSettled([notifyPromise, autoReplyPromise])

  const error = notify.status === 'rejected' ? notify.reason : null
  if (error) console.error('Contact email (notify) gönderilemedi:', error)

  return { ok: !error }
}
