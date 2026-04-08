import Hero from '@/components/sections/Hero'
import Pricing from '@/components/sections/Pricing'
import FAQ from '@/components/sections/FAQ'
import Contact from '@/components/sections/Contact'

export async function generateMetadata({ params }) {
  const { lang } = await params
  const isTr = lang === 'tr'
  return {
    title: isTr
      ? 'Bursa Oto Yıkama & Detaylı Temizlik | Revive Auto Lab'
      : 'Car Wash & Detailing in Bursa | Revive Auto Lab',
    description: isTr
      ? 'Bursa\'da profesyonel oto yıkama, iç-dış temizlik ve detaylı araç bakım hizmeti. Online randevu ile hızlı ve kolay rezervasyon.'
      : 'Professional car wash, interior-exterior cleaning and detailing service in Bursa. Easy online appointment booking.',
    keywords: isTr
      ? ['oto yıkama bursa', 'araç temizlik', 'detaylı temizlik', 'araç bakım', 'online randevu', 'revive auto lab']
      : ['car wash bursa', 'car detailing', 'auto cleaning', 'vehicle care', 'online booking', 'revive auto lab'],
    openGraph: {
      title: isTr
        ? 'Bursa Oto Yıkama & Detaylı Temizlik | Revive Auto Lab'
        : 'Car Wash & Detailing in Bursa | Revive Auto Lab',
      description: isTr
        ? 'Bursa\'da profesyonel oto yıkama ve araç bakım hizmeti.'
        : 'Professional car wash and detailing service in Bursa.',
      locale: isTr ? 'tr_TR' : 'en_US',
      type: 'website',
    },
  }
}

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Pricing />
      <FAQ />
      <Contact />
    </main>
  )
}