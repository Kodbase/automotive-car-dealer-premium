import FAQClient from './FAQClient'

export async function generateMetadata({ params }) {
  const { lang } = await params
  const isTr = lang === 'tr'
  return {
    title: isTr
      ? 'Sık Sorulan Sorular | Oto Yıkama Bursa | Revive Auto Lab'
      : 'Frequently Asked Questions | Car Wash Bursa | Revive Auto Lab',
    description: isTr
      ? 'Oto yıkama, randevu sistemi ve araç bakım hizmetlerimiz hakkında sık sorulan sorular ve cevapları.'
      : 'Frequently asked questions about our car wash, appointment system and detailing services.',
    keywords: isTr
      ? ['oto yıkama sss', 'araç bakım soru', 'randevu nasıl alınır']
      : ['car wash faq', 'detailing questions', 'how to book car wash'],
    openGraph: {
      title: isTr ? 'Sık Sorulan Sorular | Revive Auto Lab' : 'FAQ | Revive Auto Lab',
      description: isTr ? 'Hizmetlerimiz hakkında merak ettikleriniz.' : 'Everything you need to know about our services.',
      locale: isTr ? 'tr_TR' : 'en_US',
      type: 'website',
    },
  }
}

const FAQ_SCHEMA_DATA = [
  { q: 'Randevu nasıl alabilirim?',       a: 'Web sitemiz üzerinden "Randevu Al" butonuna tıklayarak paket seçip uygun tarih ve saati belirleyebilirsiniz.' },
  { q: 'Randevumu iptal edebilir miyim?', a: 'Randevunuzu, belirlenen iptal süre sınırına kadar tracking sayfasından iptal edebilirsiniz.' },
  { q: 'Hangi ödeme yöntemlerini kabul ediyorsunuz?', a: 'Nakit ve kredi/banka kartı ile ödeme kabul edilmektedir.' },
  { q: 'İşlem ne kadar sürer?',           a: 'Seçtiğiniz pakete göre ortalama 15–90 dakika arasında değişmektedir.' },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_SCHEMA_DATA.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

export default function FAQPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <FAQClient />
    </>
  )
}