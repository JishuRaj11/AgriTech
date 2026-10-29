import { useLanguage } from '../context/LanguageContext';

export default function ErrorAlert({ message, onClose }) {
  const { t } = useLanguage();
  if (!message) return null;

  return (
    <div className="alert alert-danger d-flex justify-content-between align-items-start" role="alert">
      <span className="break-word">{message || t('common.error')}</span>
      {onClose && (
        <button type="button" className="btn-close" aria-label={t('common.close')} onClick={onClose} />
      )}
    </div>
  );
}
