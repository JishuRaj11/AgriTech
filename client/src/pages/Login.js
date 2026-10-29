import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ErrorAlert from '../components/ErrorAlert';
import Loader from '../components/Loader';
import { getErrorMessage } from '../api/axios';

export default function Login() {
  const { user, loading, login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <div className="auth-wrapper">
        <Loader />
      </div>
    );
  }

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;

  const handleChange = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const loggedIn = await login(form.email.trim(), form.password);
      const target = location.state?.from?.pathname;
      navigate(target || (loggedIn.role === 'admin' ? '/admin' : '/dashboard'), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="card auth-card shadow-lg">
        <div className="card-body p-4 p-sm-5">
          <div className="text-center mb-4">
            <div className="auth-brand">🌱 {t('appName')}</div>
            <p className="text-muted mb-0">{t('tagline')}</p>
          </div>

          <h1 className="h4 mb-1">{t('auth.loginTitle')}</h1>
          <p className="text-muted">{t('auth.loginSubtitle')}</p>

          <ErrorAlert message={error} onClose={() => setError('')} />

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label" htmlFor="login-email">
                {t('common.email')}
              </label>
              <input
                id="login-email"
                className="form-control form-control-lg"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                placeholder={t('auth.emailPlaceholder')}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="login-password">
                {t('common.password')}
              </label>
              <input
                id="login-password"
                className="form-control form-control-lg"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" className="btn btn-agri btn-lg w-100" disabled={saving}>
              {saving ? t('common.loading') : t('auth.loginButton')}
            </button>
          </form>

          <div className="text-center mt-3">
            <span className="text-muted">{t('auth.noAccount')} </span>
            <Link to="/register">{t('nav.register')}</Link>
          </div>

          <LanguageSwitcher id="login-language" className="mt-4" />

          <div className="alert alert-light border mt-4 mb-0 small">
            <div className="fw-semibold mb-1">{t('auth.demoTitle')}</div>
            <div>{t('auth.demoAdmin')}</div>
            <div>{t('auth.demoFarmer')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
