import './globals.css'
import { CONFIG } from '@/constants/config'

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL),
  title: {
    default: 'Revive Auto Lab | Premium Araç Bakım',
    template: '%s | Revive Auto Lab',
  },
  description: 'Bursa\'da profesyonel oto yıkama ve araç bakım hizmeti.',
}
 
const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'AutoWash',
  name: 'Revive Auto Lab',
  description: 'Bursa\'da profesyonel oto yıkama, iç-dış temizlik ve detaylı araç bakım hizmeti.',
  url: 'process.env.NEXT_PUBLIC_APP_URL',
  telephone: CONFIG.phone,   
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Bursa',
    addressCountry: 'TR',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: '40.1826',
    longitude: '29.0665',
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
  ],
  priceRange: '₺₺',
  sameAs: [
    CONFIG.social.instagram,
  ],
}
 


export default function RootLayout({ children }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </head>

      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                  document.body.setAttribute('data-theme', theme);
                } catch(e) {}
              })();
            `
          }}
        />
        {children}
      </body>
    </html>
  )
}