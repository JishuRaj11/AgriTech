import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import PageHeader from '../components/PageHeader';
import Loader from '../components/Loader';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import { formatDate, statusColor } from '../utils/format';

const seasons = ['Kharif', 'Rabi', 'Zaid', 'All year'];

export default function Pests() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState([]);
  const [filters, setFilters] = useState({ crop: '', region: '', season: '' });
  const [applied, setApplied] = useState({ crop: '', region: '', season: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = { limit: 100 };
      if (applied.crop) params.crop = applied.crop;
      if (applied.region) params.region = applied.region;
      if (applied.season) params.season = applied.season;
      const { data } = await api.get('/pests', { params });
      setAlerts(data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setApplied(filters);
  };

  const reset = () => {
    const clean = { crop: '', region: '', season: '' };
    setFilters(clean);
    setApplied(clean);
  };

  return (
    <div className="container">
      <PageHeader title={t('pests.title')} subtitle={t('pests.subtitle')} />

      <ErrorAlert message={error} onClose={() => setError('')} />

      <div className="card mb-4">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label" htmlFor="pest-crop">
                {t('pests.cropFilter')}
              </label>
              <input
                id="pest-crop"
                className="form-control"
                value={filters.crop}
                onChange={(event) => setFilters((current) => ({ ...current, crop: event.target.value }))}
                placeholder={t('resources.searchPlaceholder')}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="pest-region">
                {t('pests.regionFilter')}
              </label>
              <input
                id="pest-region"
                className="form-control"
                value={filters.region}
                onChange={(event) => setFilters((current) => ({ ...current, region: event.target.value }))}
                placeholder={t('pests.regionPlaceholder')}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label" htmlFor="pest-season">
                {t('pests.seasonFilter')}
              </label>
              <select
                id="pest-season"
                className="form-select"
                value={filters.season}
                onChange={(event) => setFilters((current) => ({ ...current, season: event.target.value }))}
              >
                <option value="">{t('pests.allSeasons')}</option>
                {seasons.map((season) => (
                  <option key={season} value={season}>
                    {t(`crops.seasons.${season}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3 d-flex gap-2">
              <button type="submit" className="btn btn-agri flex-grow-1">
                {t('common.filter')}
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={reset}>
                {t('common.refresh')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : alerts.length === 0 ? (
        <EmptyState message={t('pests.noAlerts')} icon="🐛" />
      ) : (
        <div className="row g-4">
          {alerts.map((alert) => (
            <div className="col-md-6" key={alert._id}>
              <div
                className={`card h-100 border-start border-4 border-${statusColor(alert.severity)}`}
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <h2 className="h5 mb-1">{alert.title}</h2>
                    <span
                      className={`badge bg-${statusColor(alert.severity)}-subtle text-${statusColor(
                        alert.severity
                      )}-emphasis`}
                    >
                      {t(`pests.severities.${alert.severity}`)}
                    </span>
                  </div>
                  <div className="d-flex flex-wrap gap-2 my-2">
                    <span className="badge badge-soft">🌱 {alert.crop}</span>
                    <span className="badge badge-soft">📅 {t(`crops.seasons.${alert.season}`)}</span>
                    <span className="badge badge-soft">📍 {alert.region}</span>
                  </div>

                  <h3 className="h6 mt-3">{t('pests.symptoms')}</h3>
                  <p className="small break-word">{alert.symptoms}</p>

                  <h3 className="h6">{t('pests.treatment')}</h3>
                  <p className="small mb-0 break-word">{alert.treatment}</p>

                  <div className="text-muted small mt-2">{formatDate(alert.createdAt)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
