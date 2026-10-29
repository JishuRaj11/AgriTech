import { useLanguage } from '../context/LanguageContext';

export default function Loader({ text }) {
  const { t } = useLanguage();

  return (
    <div className="text-center py-5" role="status" aria-live="polite">
      <div className="spinner-border text-success" aria-hidden="true" />
      <p className="text-muted mt-3 mb-0">{text || t('common.loading')}</p>
    </div>
  );
}
