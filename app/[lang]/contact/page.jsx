import ContactClient from './ContactClient'

export async function generateMetadata({ params }) {
  const { lang } = await params
  const isTr = lang === 'tr'
  return {
    title: isTr
      ? 'İletişim | Revive Auto Lab Bursa'
      : 'Contact | Revive Auto Lab Bursa',
    description: isTr
      ? 'Revive Auto Lab ile iletişime geçin. Adres, telefon, e-posta ve online mesaj formu ile bize ulaşın.'
      : 'Get in touch with Revive Auto Lab. Reach us by address, phone, email or our online contact form.',
    keywords: isTr
      ? ['revive auto lab iletişim', 'oto yıkama bursa adres', 'araç bakım telefon', 'online mesaj']
      : ['revive auto lab contact', 'car wash bursa address', 'auto detail phone'],
    openGraph: {
      title: isTr
        ? 'İletişim | Revive Auto Lab Bursa'
        : 'Contact | Revive Auto Lab Bursa',
      description: isTr
        ? 'Bize ulaşın — Revive Auto Lab Bursa.'
        : 'Get in touch — Revive Auto Lab Bursa.',
      locale: isTr ? 'tr_TR' : 'en_US',
      type: 'website',
    },
  }
}

export default function ContactPage() {
  return <ContactClient />
}