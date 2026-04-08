import BookingClient from './BookingClient'

export async function generateMetadata({ params }) {
  const { lang } = await params
  const isTr = lang === 'tr'
  return {
    title: isTr
      ? 'Online Randevu Al | Revive Auto Lab Bursa'
      : 'Book Online Appointment | Revive Auto Lab Bursa',
    description: isTr
      ? 'Revive Auto Lab\'da online randevu alın. Paket seçin, tarih ve saat belirleyin, aracınızı teslim edin.'
      : 'Book your appointment at Revive Auto Lab online. Choose a package, pick a date and time, drop off your car.',
    keywords: isTr
      ? ['oto yıkama randevu', 'online randevu bursa', 'araç bakım rezervasyon', 'revive auto lab randevu']
      : ['car wash appointment', 'online booking bursa', 'auto detail reservation'],
    openGraph: {
      title: isTr
        ? 'Online Randevu Al | Revive Auto Lab Bursa'
        : 'Book Online Appointment | Revive Auto Lab Bursa',
      description: isTr
        ? 'Hızlı ve kolay online randevu sistemi.'
        : 'Fast and easy online booking system.',
      locale: isTr ? 'tr_TR' : 'en_US',
      type: 'website',
    },
  }
}

export default function BookingPage() {
  return <BookingClient />
}