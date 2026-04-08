import tr from './tr'
import en from './en'

const translations = { tr, en }

export function getTranslations(lang) {
  return translations[lang] ?? translations['tr']
}

export { tr, en }
export default translations