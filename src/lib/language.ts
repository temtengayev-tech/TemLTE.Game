export type Language = 'en' | 'ru'

export const languageLabels: Record<Language, string> = {
  en: 'English',
  ru: 'Русский',
}

export function loadLanguage(): Language {
  return localStorage.getItem('fightron-language') === 'ru' ? 'ru' : 'en'
}

export function saveLanguage(language: Language) {
  localStorage.setItem('fightron-language', language)
}
