const BASE_URL = 'process.env.NEXT_PUBLIC_APP_URL'

const LANGS = ['tr', 'en']

const PAGES = [
  { path: '',          priority: 1.0,  changeFrequency: 'weekly'  },
  { path: '/services', priority: 0.9,  changeFrequency: 'weekly'  },
  { path: '/booking',  priority: 0.9,  changeFrequency: 'daily'   },
  { path: '/about',    priority: 0.7,  changeFrequency: 'monthly' },
  { path: '/contact',  priority: 0.7,  changeFrequency: 'monthly' },
  { path: '/faq',      priority: 0.6,  changeFrequency: 'monthly' },
  { path: '/tracking', priority: 0.5,  changeFrequency: 'monthly' },
]

export default function sitemap() {
  const entries = []

  for (const lang of LANGS) {
    for (const page of PAGES) {
      entries.push({
        url: `${BASE_URL}/${lang}${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      })
    }
  }

  return entries
}