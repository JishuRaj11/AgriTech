import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function NotFound() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="container py-5 text-center">
      <div style={{ fontSize: '3rem' }} aria-hidden="true">
        🌾
      </div>
      <h1 className="h3 mt-3">404</h1>
      <p className="text-muted">This page could not be found.</p>
      <Link className="btn btn-agri" to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login'}>
        {t('common.back')}
      </Link>
    </div>
  );
}
