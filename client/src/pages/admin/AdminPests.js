import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import PageHeader from '../../components/PageHeader';
import AdminTabs from '../../components/AdminTabs';
import Loader from '../../components/Loader';
import ErrorAlert from '../../components/ErrorAlert';
import AlertMessage from '../../components/AlertMessage';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { formatDate } from '../../utils/format';

const seasons = ['Kharif', 'Rabi', 'Zaid', 'All year'];
const severities = ['low', 'medium', 'high'];

const emptyForm = {
  title: '',
  crop: '',
  symptoms: '',
  season: 'All year',
  region: 'All regions',
  treatment: '',
  severity: 'medium',
  isActive: true
};

export default function AdminPests() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/pests', { params: { limit: 200 } });
      setAlerts(data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const startEdit = (alert) => {
    setEditingId(alert._id);
    setForm({
      title: alert.title,
      crop: alert.crop,
      symptoms: alert.symptoms,
      season: alert.season,
      region: alert.region,
      treatment: alert.treatment,
      severity: alert.severity,
      isActive: Boolean(alert.isActive)
    });
    setShowForm(true);
  };

  const cancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    const payload = {
      title: form.title.trim(),
      crop: form.crop.trim(),
      symptoms: form.symptoms.trim(),
      season: form.season,
      region: form.region.trim() || 'All regions',
      treatment: form.treatment.trim(),
      severity: form.severity,
      isActive: form.isActive
    };
    try {
      if (editingId) await api.put(`/pests/${editingId}`, payload);
      else await api.post('/pests', payload);
      setSuccess(t('admin.saved'));
      cancel();
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (alert) => {
    setError('');
    setSuccess('');
    try {
      await api.put(`/pests/${alert._id}`, { isActive: !alert.isActive });
      setSuccess(t('admin.saved'));
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const remove = async (id) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/pests/${id}`);
      setSuccess(t('admin.deleted'));
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="container">
      <PageHeader
        title={t('admin.pestsTitle')}
        subtitle={t('admin.pestsSubtitle')}
        actions={
          <button type="button" className="btn btn-agri" onClick={startCreate}>
            + {t('admin.addPest')}
          </button>
        }
      />
      <AdminTabs />

      <ErrorAlert message={error} onClose={() => setError('')} />
      <AlertMessage onClose={() => setSuccess('')}>{success}</AlertMessage>

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">{editingId ? t('admin.editPest') : t('admin.addPest')}</div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label" htmlFor="pest-title">
                    {t('admin.titleLabel')} *
                  </label>
                  <input
                    id="pest-title"
                    className="form-control"
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    required
                    maxLength={150}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="pest-crop-name">
                    {t('common.crop')} *
                  </label>
                  <input
                    id="pest-crop-name"
                    className="form-control"
                    value={form.crop}
                    onChange={(event) => setForm((current) => ({ ...current, crop: event.target.value }))}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="pest-season-select">
                    {t('common.season')}
                  </label>
                  <select
                    id="pest-season-select"
                    className="form-select"
                    value={form.season}
                    onChange={(event) => setForm((current) => ({ ...current, season: event.target.value }))}
                  >
                    {seasons.map((season) => (
                      <option key={season} value={season}>
                        {t(`crops.seasons.${season}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="pest-region-input">
                    {t('common.region')} *
                  </label>
                  <input
                    id="pest-region-input"
                    className="form-control"
                    value={form.region}
                    onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="pest-severity">
                    {t('pests.severity')}
                  </label>
                  <select
                    id="pest-severity"
                    className="form-select"
                    value={form.severity}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, severity: event.target.value }))
                    }
                  >
                    {severities.map((severity) => (
                      <option key={severity} value={severity}>
                        {t(`pests.severities.${severity}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="pest-symptoms">
                    {t('pests.symptoms')} *
                  </label>
                  <textarea
                    id="pest-symptoms"
                    className="form-control"
                    rows="3"
                    maxLength={1000}
                    value={form.symptoms}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, symptoms: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="pest-treatment">
                    {t('pests.treatment')} *
                  </label>
                  <textarea
                    id="pest-treatment"
                    className="form-control"
                    rows="3"
                    maxLength={1000}
                    value={form.treatment}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, treatment: event.target.value }))
                    }
                    required
                  />
                </div>
                <div className="col-12">
                  <div className="form-check">
                    <input
                      id="pest-active"
                      className="form-check-input"
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, isActive: event.target.checked }))
                      }
                    />
                    <label className="form-check-label" htmlFor="pest-active">
                      {t('admin.active')}
                    </label>
                  </div>
                </div>
              </div>
              <div className="d-flex gap-2 mt-4">
                <button type="submit" className="btn btn-agri" disabled={saving}>
                  {saving ? t('common.loading') : t('common.save')}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={cancel}>
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <Loader />
      ) : alerts.length === 0 ? (
        <EmptyState message={t('pests.noAlerts')} icon="🐛" />
      ) : (
        <div className="row g-4">
          {alerts.map((alert) => (
            <div className="col-lg-6" key={alert._id}>
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center gap-2">
                  <span className="fw-semibold">{alert.title}</span>
                  <div className="d-flex gap-1">
                    <StatusBadge
                      status={alert.severity}
                      label={t(`pests.severities.${alert.severity}`)}
                    />
                    <span
                      className={`badge bg-${alert.isActive ? 'success' : 'secondary'}-subtle text-${
                        alert.isActive ? 'success' : 'secondary'
                      }-emphasis`}
                    >
                      {alert.isActive ? t('admin.active') : t('admin.inactive')}
                    </span>
                  </div>
                </div>
                <div className="card-body">
                  <div className="d-flex flex-wrap gap-2 mb-2">
                    <span className="badge badge-soft">🌱 {alert.crop}</span>
                    <span className="badge badge-soft">📅 {t(`crops.seasons.${alert.season}`)}</span>
                    <span className="badge badge-soft">📍 {alert.region}</span>
                  </div>
                  <p className="small mb-1">
                    <strong>{t('pests.symptoms')}:</strong> {alert.symptoms}
                  </p>
                  <p className="small mb-0">
                    <strong>{t('pests.treatment')}:</strong> {alert.treatment}
                  </p>
                  <div className="small text-muted mt-2">{formatDate(alert.createdAt)}</div>
                </div>
                <div className="card-footer bg-transparent d-flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success"
                    onClick={() => toggleActive(alert)}
                  >
                    {alert.isActive ? t('admin.deactivate') : t('admin.activate')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => startEdit(alert)}
                  >
                    {t('common.edit')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => remove(alert._id)}
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
