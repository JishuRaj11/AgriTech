import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import PageHeader from '../components/PageHeader';
import Loader from '../components/Loader';
import ErrorAlert from '../components/ErrorAlert';
import AlertMessage from '../components/AlertMessage';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils/format';

const emptyForm = {
  name: '',
  location: '',
  size: '',
  sizeUnit: 'acre',
  soilType: 'loamy',
  notes: ''
};

const soilTypes = ['clay', 'sandy', 'loamy', 'silt', 'peaty', 'chalky', 'other'];

export default function Farms() {
  const { t } = useLanguage();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [logTexts, setLogTexts] = useState({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/farms', { params: { limit: 100 } });
      setFarms(data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(false);
  };

  const handleChange = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const startEdit = (farm) => {
    setEditing(farm);
    setForm({
      name: farm.name,
      location: farm.location,
      size: farm.size,
      sizeUnit: farm.sizeUnit || 'acre',
      soilType: farm.soilType || 'loamy',
      notes: farm.notes || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = { ...form, size: Number(form.size) };
      if (editing) {
        await api.put(`/farms/${editing._id}`, payload);
        setSuccess(t('farms.updated'));
      } else {
        await api.post('/farms', payload);
        setSuccess(t('farms.created'));
      }
      resetForm();
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (farm) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    try {
      await api.delete(`/farms/${farm._id}`);
      setSuccess(t('farms.deleted'));
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const addLog = async (farmId) => {
    const message = (logTexts[farmId] || '').trim();
    if (!message) return;
    try {
      await api.post(`/farms/${farmId}/logs`, { message });
      setLogTexts((current) => ({ ...current, [farmId]: '' }));
      setSuccess(t('farms.logAdded'));
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="container">
      <PageHeader
        title={t('farms.title')}
        subtitle={t('farms.subtitle')}
        actions={
          <button
            type="button"
            className="btn btn-agri"
            onClick={() => {
              if (showForm) resetForm();
              else {
                setForm(emptyForm);
                setEditing(null);
                setShowForm(true);
              }
            }}
          >
            {showForm ? t('common.cancel') : `+ ${t('farms.addFarm')}`}
          </button>
        }
      />

      <ErrorAlert message={error} onClose={() => setError('')} />
      <AlertMessage onClose={() => setSuccess('')}>{success}</AlertMessage>

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">{editing ? t('farms.editFarm') : t('farms.addFarm')}</div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label" htmlFor="farm-name">
                    {t('farms.farmName')} *
                  </label>
                  <input
                    id="farm-name"
                    className="form-control"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    maxLength={100}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="farm-location">
                    {t('farms.location')} *
                  </label>
                  <input
                    id="farm-location"
                    className="form-control"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    required
                    maxLength={150}
                  />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label" htmlFor="farm-size">
                    {t('farms.size')} *
                  </label>
                  <input
                    id="farm-size"
                    className="form-control"
                    type="number"
                    min="0.01"
                    step="0.01"
                    name="size"
                    value={form.size}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label" htmlFor="farm-size-unit">
                    {t('farms.sizeUnit')}
                  </label>
                  <select
                    id="farm-size-unit"
                    className="form-select"
                    name="sizeUnit"
                    value={form.sizeUnit}
                    onChange={handleChange}
                  >
                    <option value="acre">{t('farms.acre')}</option>
                    <option value="hectare">{t('farms.hectare')}</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="farm-soil">
                    {t('farms.soilType')}
                  </label>
                  <select
                    id="farm-soil"
                    className="form-select"
                    name="soilType"
                    value={form.soilType}
                    onChange={handleChange}
                  >
                    {soilTypes.map((type) => (
                      <option key={type} value={type}>
                        {t(`common.soilTypes.${type}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="farm-notes">
                    {t('farms.notes')}
                  </label>
                  <textarea
                    id="farm-notes"
                    className="form-control"
                    name="notes"
                    rows="3"
                    maxLength={1000}
                    value={form.notes}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="d-flex gap-2 mt-4">
                <button type="submit" className="btn btn-agri" disabled={saving}>
                  {saving ? t('common.loading') : t('common.save')}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <Loader />
      ) : farms.length === 0 ? (
        <EmptyState message={t('farms.noFarms')} />
      ) : (
        <div className="row g-4">
          {farms.map((farm) => (
            <div className="col-md-6" key={farm._id}>
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <h2 className="h5 mb-1">{farm.name}</h2>
                      <p className="text-muted mb-2">📍 {farm.location}</p>
                    </div>
                    <span className="badge badge-soft">{t(`common.soilTypes.${farm.soilType}`)}</span>
                  </div>

                  <div className="row text-center g-2 my-3">
                    <div className="col-6">
                      <div className="border rounded-3 py-2">
                        <div className="fw-bold">
                          {farm.size} {t(`farms.${farm.sizeUnit || 'acre'}`)}
                        </div>
                        <small className="text-muted">{t('farms.size')}</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="border rounded-3 py-2">
                        <div className="fw-bold">{farm.activityLogs?.length || 0}</div>
                        <small className="text-muted">{t('farms.activityLog')}</small>
                      </div>
                    </div>
                  </div>

                  {farm.notes && <p className="text-muted small break-word">{farm.notes}</p>}

                  <details className="mt-2">
                    <summary className="text-muted small">
                      {t('farms.activityLog')} ({farm.activityLogs?.length || 0})
                    </summary>
                    <ul className="list-plain mt-2">
                      {(farm.activityLogs || [])
                        .slice()
                        .reverse()
                        .map((log, index) => (
                          <li key={`${log.date}-${index}`} className="small border-bottom py-1">
                            <span className="text-muted me-2">{formatDate(log.date)}</span>
                            {log.message}
                          </li>
                        ))}
                      {(!farm.activityLogs || farm.activityLogs.length === 0) && (
                        <li className="small text-muted">{t('common.noData')}</li>
                      )}
                    </ul>
                    <div className="input-group input-group-sm mt-2">
                      <label className="visually-hidden" htmlFor={`log-${farm._id}`}>
                        {t('farms.activityPlaceholder')}
                      </label>
                      <input
                        id={`log-${farm._id}`}
                        className="form-control"
                        value={logTexts[farm._id] || ''}
                        onChange={(event) =>
                          setLogTexts((current) => ({ ...current, [farm._id]: event.target.value }))
                        }
                        placeholder={t('farms.activityPlaceholder')}
                        maxLength={500}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-agri"
                        onClick={() => addLog(farm._id)}
                      >
                        {t('farms.addActivity')}
                      </button>
                    </div>
                  </details>
                </div>

                <div className="card-footer bg-transparent d-flex flex-wrap gap-2">
                  <Link to={`/crops?farm=${farm._id}`} className="btn btn-sm btn-outline-agri">
                    {t('farms.viewCrops')}
                  </Link>
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => startEdit(farm)}>
                    {t('common.edit')}
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(farm)}>
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
