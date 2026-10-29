import { useState } from 'react';
import api, { getErrorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import PageHeader from '../components/PageHeader';
import ErrorAlert from '../components/ErrorAlert';
import AlertMessage from '../components/AlertMessage';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { t, language, setLanguage, languages } = useLanguage();

  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email || '',
    location: user.location || '',
    language: user.language || language
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleChange = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.put('/auth/profile', {
        name: form.name.trim(),
        email: form.email.trim(),
        location: form.location.trim(),
        language: form.language
      });
      updateUser(data.user);
      setLanguage(form.language);
      setSuccess(t('profile.updated'));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (event) => {
    event.preventDefault();
    setSavingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');
    try {
      await api.put('/auth/password', passwords);
      setPasswords({ currentPassword: '', newPassword: '' });
      setPasswordSuccess(t('profile.passwordChanged'));
    } catch (err) {
      setPasswordError(getErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '860px' }}>
      <PageHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />

      <div className="card mb-4">
        <div className="card-body d-flex align-items-center gap-3">
          <span className="stat-icon" aria-hidden="true">
            {user.role === 'admin' ? '🛡️' : '👨‍🌾'}
          </span>
          <div>
            <div className="h5 mb-0">{user.name}</div>
            <div className="text-muted small">{user.email}</div>
            <span className="badge badge-soft mt-1">{user.role}</span>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">{t('profile.details')}</div>
        <div className="card-body">
          <ErrorAlert message={error} onClose={() => setError('')} />
          <AlertMessage onClose={() => setSuccess('')}>{success}</AlertMessage>

          <form onSubmit={handleProfile}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="profile-name">
                  {t('common.name')}
                </label>
                <input
                  id="profile-name"
                  className="form-control"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  maxLength={80}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="profile-email">
                  {t('common.email')}
                </label>
                <input
                  id="profile-email"
                  className="form-control"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="profile-location">
                  {t('common.location')}
                </label>
                <input
                  id="profile-location"
                  className="form-control"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  maxLength={150}
                />
                <div className="form-text">{t('profile.locationHint')}</div>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="profile-language">
                  {t('common.language')}
                </label>
                <select
                  id="profile-language"
                  className="form-select"
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                >
                  {languages.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <div className="form-text">{t('profile.languageHint')}</div>
              </div>
            </div>
            <button type="submit" className="btn btn-agri mt-4" disabled={saving}>
              {saving ? t('common.loading') : t('common.save')}
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">{t('profile.changePassword')}</div>
        <div className="card-body">
          <ErrorAlert message={passwordError} onClose={() => setPasswordError('')} />
          <AlertMessage onClose={() => setPasswordSuccess('')}>{passwordSuccess}</AlertMessage>

          <form onSubmit={handlePassword}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="current-password">
                  {t('profile.currentPassword')}
                </label>
                <input
                  id="current-password"
                  className="form-control"
                  type="password"
                  autoComplete="current-password"
                  value={passwords.currentPassword}
                  onChange={(event) =>
                    setPasswords((current) => ({ ...current, currentPassword: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="new-password">
                  {t('profile.newPassword')}
                </label>
                <input
                  id="new-password"
                  className="form-control"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  value={passwords.newPassword}
                  onChange={(event) =>
                    setPasswords((current) => ({ ...current, newPassword: event.target.value }))
                  }
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-outline-agri mt-4" disabled={savingPassword}>
              {savingPassword ? t('common.loading') : t('profile.changePassword')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
