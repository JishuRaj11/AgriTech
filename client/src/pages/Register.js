import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ErrorAlert from '../components/ErrorAlert';
import Loader from '../components/Loader';
import { getErrorMessage } from '../api/axios';

export default function Register() {
  const { user, loading, register } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    location: '',
    language
  });
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
    if (form.password.length < 6) {
      setError(t('auth.passwordHint'));
      return;
    }
    setSaving(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        location: form.location.trim(),
        language: form.language
      });
      setLanguage(form.language);
      navigate('/dashboard', { replace: true });
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

          <h1 className="h4 mb-1">{t('auth.registerTitle')}</h1>
          <p className="text-muted">{t('auth.registerSubtitle')}</p>

          <ErrorAlert message={error} onClose={() => setError('')} />

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label" htmlFor="register-name">
                {t('auth.fullName')}
              </label>
              <input
                id="register-name"
                className="form-control form-control-lg"
                name="name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="register-email">
                {t('common.email')}
              </label>
              <input
                id="register-email"
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
              <label className="form-label" htmlFor="register-password">
                {t('common.password')}
              </label>
              <input
                id="register-password"
                className="form-control form-control-lg"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                minLength={6}
                required
              />
              <div className="form-text">{t('auth.passwordHint')}</div>
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="register-location">
                {t('common.location')}
              </label>
              <input
                id="register-location"
                className="form-control"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder={t('auth.locationPlaceholder')}
                autoComplete="address-level2"
              />
            </div>

            <div className="mb-4">
              <label className="form-label" htmlFor="register-language">
                {t('auth.chooseLanguage')}
              </label>
              <select
                id="register-language"
                className="form-select"
                name="language"
                value={form.language}
                onChange={handleChange}
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="ta">தமிழ்</option>
              </select>
            </div>

            <button type="submit" className="btn btn-agri btn-lg w-100" disabled={saving}>
              {saving ? t('common.loading') : t('auth.registerButton')}
            </button>
          </form>

          <div className="text-center mt-3">
            <span className="text-muted">{t('auth.haveAccount')} </span>
            <Link to="/login">{t('nav.login')}</Link>
          </div>

          <LanguageSwitcher id="register-language-switcher" className="mt-4" />
        </div>
      </div>
    </div>
  );
}
