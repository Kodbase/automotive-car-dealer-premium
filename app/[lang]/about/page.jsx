import AboutClient from './AboutClient'

export async function generateMetadata({ params }) {
  const { lang } = await params
  const isTr = lang === 'tr'
  return {
    title: isTr
      ? 'Hakkımızda | Revive Auto Lab — Bursa\'nın Premium Oto Yıkama Merkezi'
      : 'About Us | Revive Auto Lab — Bursa\'s Premium Car Wash Center',
    description: isTr
      ? 'Revive Auto Lab olarak Bursa\'da profesyonel araç bakım hizmeti sunuyoruz. Ekibimiz, değerlerimiz ve hikayemiz hakkında bilgi edinin.'
      : 'At Revive Auto Lab, we provide professional car care services in Bursa. Learn about our team, values and story.',
    keywords: isTr
      ? ['revive auto lab hakkında', 'bursa oto yıkama', 'araç bakım ekibi', 'profesyonel oto temizlik']
      : ['about revive auto lab', 'bursa car wash', 'professional auto care team'],
    openGraph: {
      title: isTr
        ? 'Hakkımızda | Revive Auto Lab'
        : 'About Us | Revive Auto Lab',
      description: isTr
        ? 'Bursa\'nın premium oto yıkama ve araç bakım merkezi.'
        : 'Bursa\'s premium car wash and detailing center.',
      locale: isTr ? 'tr_TR' : 'en_US',
      type: 'website',
    },
  }
}

export default function AboutPage() {
  return <AboutClient />
}