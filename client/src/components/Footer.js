import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="footer py-4 mt-auto">
      <div className="container d-flex flex-column flex-md-row justify-content-between gap-2 small">
        <div>
          <strong>🌱 {t('appName')}</strong> — {t('tagline')}
        </div>
        <div>© {new Date().getFullYear()} AgriTech</div>
      </div>
    </footer>
  );
}
