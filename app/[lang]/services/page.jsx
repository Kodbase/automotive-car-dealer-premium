import ServicesClient from './ServicesClient'
import { createSupabaseServer } from '@/lib/server/supabase-server'

export async function generateMetadata({ params }) {
  const { lang } = await params
  const isTr = lang === 'tr'
  return {
    title: isTr
      ? 'Oto Yıkama Paketleri & Fiyatlar | Revive Auto Lab Bursa'
      : 'Car Wash Packages & Prices | Revive Auto Lab Bursa',
    description: isTr
      ? 'Revive Auto Lab\'ın tüm oto yıkama ve araç bakım paketleri. Basic\'ten Premium\'a kadar ihtiyacınıza uygun seçenekler.'
      : 'All car wash and detailing packages at Revive Auto Lab. Options from Basic to Premium to suit your needs.',
    keywords: isTr
      ? ['oto yıkama paketleri', 'araç bakım fiyatları', 'detaylı temizlik bursa', 'premium araç yıkama']
      : ['car wash packages', 'detailing prices', 'car cleaning bursa', 'premium car wash'],
    openGraph: {
      title: isTr
        ? 'Oto Yıkama Paketleri & Fiyatlar | Revive Auto Lab Bursa'
        : 'Car Wash Packages & Prices | Revive Auto Lab Bursa',
      description: isTr
        ? 'Bursa\'da oto yıkama ve araç bakım paketleri.'
        : 'Car wash and detailing packages in Bursa.',
      locale: isTr ? 'tr_TR' : 'en_US',
      type: 'website',
    },
  }
}

async function getServicesSchema() {
  try {
    const supabase = await createSupabaseServer()
    const { data: packages } = await supabase
      .from('packages')
      .select('name, description, price')
      .eq('is_active', true)
      .order('price', { ascending: true })

    if (!packages?.length) return null

    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Revive Auto Lab Hizmet Paketleri',
      itemListElement: packages.map((pkg, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        item: {
          '@type': 'Service',
          name: pkg.name,
          description: pkg.description,
          offers: {
            '@type': 'Offer',
            price: pkg.price,
            priceCurrency: 'TRY',
          },
          provider: { '@type': 'AutoWash', name: 'Revive Auto Lab' },
          areaServed: { '@type': 'City', name: 'Bursa' },
        },
      })),
    }
  } catch {
    return null
  }
}

export default async function ServicesPage() {
  const schema = await getServicesSchema()

  return (
    <>
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      <ServicesClient />
    </>
  )
}