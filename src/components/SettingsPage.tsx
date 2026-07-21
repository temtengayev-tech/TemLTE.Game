import type { Language } from '../lib/language'
import { languageLabels } from '../lib/language'

type Props = {
  language: Language
  onLanguageChange: (language: Language) => void
  onBack: () => void
}

const copy = {
  en: { back: 'Back', eyebrow: 'Game settings', title: 'Settings', language: 'Language', help: 'Choose the language used in the game menu.' },
  ru: { back: 'Назад', eyebrow: 'Настройки игры', title: 'Настройки', language: 'Язык', help: 'Выберите язык меню игры.' },
}

export function SettingsPage({ language, onLanguageChange, onBack }: Props) {
  const text = copy[language]

  return <main className="settings-page">
    <header><b>FIGHTRON <i>FC</i></b><button onClick={onBack}>← {text.back}</button></header>
    <section className="settings-panel">
      <small>{text.eyebrow}</small>
      <h1>{text.title}</h1>
      <div className="language-setting">
        <div><h2>{text.language}</h2><p>{text.help}</p></div>
        <div className="language-options">
          {(['en', 'ru'] as const).map(option => <button
            key={option}
            className={language === option ? 'active' : ''}
            aria-pressed={language === option}
            onClick={() => onLanguageChange(option)}
          >{languageLabels[option]}<span>{language === option ? '✓' : ''}</span></button>)}
        </div>
      </div>
    </section>
  </main>
}
