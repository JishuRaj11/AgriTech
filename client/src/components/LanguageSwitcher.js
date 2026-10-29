import { useLanguage } from '../context/LanguageContext';

export default function LanguageSwitcher({ id = 'language-switcher', className = '' }) {
  const { language, setLanguage, languages, t } = useLanguage();

  return (
    <div className={className}>
      <label className="form-label small text-muted" htmlFor={id}>
        {t('common.language')}
      </label>
      <select
        id={id}
        className="form-select"
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}
