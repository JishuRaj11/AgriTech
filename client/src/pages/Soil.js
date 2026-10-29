import { useCallback, useEffect, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import api, { getErrorMessage } from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import PageHeader from '../components/PageHeader';
import Loader from '../components/Loader';
import ErrorAlert from '../components/ErrorAlert';
import AlertMessage from '../components/AlertMessage';
import EmptyState from '../components/EmptyState';
import { formatDate, statusColor } from '../utils/format';

const soilTypes = ['clay', 'sandy', 'loamy', 'silt', 'peaty', 'chalky', 'other'];

const emptyForm = {
  farm: '',
  crop: '',
  ph: '',
  nitrogen: '',
  phosphorus: '',
  potassium: '',
  moisture: '',
  soilType: 'loamy'
};

export default function Soil() {
  const { t } = useLanguage();
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadMeta = useCallback(async () => {
    try {
      const [farmsRes, cropsRes] = await Promise.all([
        api.get('/farms', { params: { limit: 100 } }),
        api.get('/crops', { params: { limit: 100 } })
      ]);
      setFarms(farmsRes.data.data || []);
      setCrops(cropsRes.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/soil/reports', { params: { limit: 100 } });
      setReports(data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMeta();
    loadReports();
  }, [loadMeta, loadReports]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'farm') {
      const farm = farms.find((item) => item._id === value);
      setForm((current) => ({
        ...current,
        farm: value,
        crop: '',
        soilType: farm?.soilType || current.soilType
      }));
      return;
    }
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        farm: form.farm,
        ph: Number(form.ph),
        nitrogen: Number(form.nitrogen),
        phosphorus: Number(form.phosphorus),
        potassium: Number(form.potassium),
        moisture: Number(form.moisture),
        soilType: form.soilType
      };
      if (form.crop) payload.crop = form.crop;
      const { data } = await api.post('/soil/analyze', payload);
      setResult(data.data);
      setSuccess(t('soil.saved'));
      await loadReports();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (report) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    try {
      await api.delete(`/soil/reports/${report._id}`);
      if (result?._id === report._id) setResult(null);
      await loadReports();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const cropOptions = form.farm
    ? crops.filter((crop) => (crop.farm?._id || crop.farm) === form.farm)
    : crops;

  const visibleReports = form.farm
    ? reports.filter((report) => (report.farm?._id || report.farm) === form.farm)
    : reports;

  const chartData = visibleReports
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((report) => ({
      date: formatDate(report.createdAt),
      ph: report.ph,
      moisture: report.moisture
    }));

  const score = result?.healthScore ?? 0;
  const scoreVariant =
    result?.healthLabel === 'poor' ? 'danger' : result?.healthLabel === 'fair' ? 'warning' : 'success';

  return (
    <div className="container">
      <PageHeader title={t('soil.title')} subtitle={t('soil.subtitle')} />

      <ErrorAlert message={error} onClose={() => setError('')} />
      <AlertMessage onClose={() => setSuccess('')}>{success}</AlertMessage>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card">
            <div className="card-header">{t('soil.analyze')}</div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="soil-farm">
                    {t('common.farm')} *
                  </label>
                  <select
                    id="soil-farm"
                    className="form-select"
                    name="farm"
                    value={form.farm}
                    onChange={handleChange}
                    required
                  >
                    <option value="">{t('soil.selectFarm')}</option>
                    {farms.map((farm) => (
                      <option key={farm._id} value={farm._id}>
                        {farm.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="soil-crop">
                    {t('soil.cropOptional')}
                  </label>
                  <select
                    id="soil-crop"
                    className="form-select"
                    name="crop"
                    value={form.crop}
                    onChange={handleChange}
                  >
                    <option value="">{t('soil.noCrop')}</option>
                    {cropOptions.map((crop) => (
                      <option key={crop._id} value={crop._id}>
                        {crop.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="row g-3">
                  <div className="col-6">
                    <label className="form-label" htmlFor="soil-ph">
                      {t('soil.ph')} *
                    </label>
                    <input
                      id="soil-ph"
                      className="form-control"
                      type="number"
                      min="0"
                      max="14"
                      step="0.1"
                      name="ph"
                      value={form.ph}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label" htmlFor="soil-moisture">
                      {t('soil.moisture')} *
                    </label>
                    <input
                      id="soil-moisture"
                      className="form-control"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      name="moisture"
                      value={form.moisture}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-4">
                    <label className="form-label" htmlFor="soil-n">
                      {t('soil.nitrogen')} *
                    </label>
                    <input
                      id="soil-n"
                      className="form-control"
                      type="number"
                      min="0"
                      step="0.1"
                      name="nitrogen"
                      value={form.nitrogen}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-4">
                    <label className="form-label" htmlFor="soil-p">
                      {t('soil.phosphorus')} *
                    </label>
                    <input
                      id="soil-p"
                      className="form-control"
                      type="number"
                      min="0"
                      step="0.1"
                      name="phosphorus"
                      value={form.phosphorus}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-4">
                    <label className="form-label" htmlFor="soil-k">
                      {t('soil.potassium')} *
                    </label>
                    <input
                      id="soil-k"
                      className="form-control"
                      type="number"
                      min="0"
                      step="0.1"
                      name="potassium"
                      value={form.potassium}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label" htmlFor="soil-type">
                      {t('soil.soilType')}
                    </label>
                    <select
                      id="soil-type"
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
                </div>

                <button type="submit" className="btn btn-agri w-100 mt-4" disabled={saving}>
                  {saving ? t('common.loading') : t('soil.analyze')}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          {result ? (
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <span>{t('soil.result')}</span>
                <span
                  className={`badge bg-${statusColor(result.healthLabel)}-subtle text-${statusColor(
                    result.healthLabel
                  )}-emphasis`}
                >
                  {t(`soil.healthLabels.${result.healthLabel}`)}
                </span>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <span className="fw-semibold">{t('soil.healthScore')}</span>
                  <span className="fw-bold">{score}/100</span>
                </div>
                <div
                  className="progress mb-3"
                  role="progressbar"
                  aria-valuenow={score}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  style={{ height: '1.1rem' }}
                >
                  <div className={`progress-bar bg-${scoreVariant}`} style={{ width: `${score}%` }}>
                    {score}%
                  </div>
                </div>

                <h3 className="h6 mt-3">🌾 {t('soil.recommendedCrops')}</h3>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {result.recommendations?.crops?.map((crop) => (
                    <span className="badge badge-soft" key={crop}>
                      {crop}
                    </span>
                  ))}
                </div>

                <h3 className="h6">🧪 {t('soil.recommendedFertilizers')}</h3>
                <ul className="small">
                  {result.recommendations?.fertilizers?.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>

                <h3 className="h6">📝 {t('soil.additionalNotes')}</h3>
                <ul className="small mb-0">
                  {result.recommendations?.notes?.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="card h-100">
              <div className="card-body d-flex align-items-center justify-content-center">
                <EmptyState message={t('soil.result')} icon="🧪" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">{t('soil.trend')}</div>
        <div className="card-body">
          {chartData.length < 2 ? (
            <EmptyState message={t('soil.noReports')} icon="📈" />
          ) : (
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6ece7" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" domain={[0, 14]} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="ph" stroke="#2f6b3c" strokeWidth={2} name="pH" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="moisture"
                    stroke="#b7791f"
                    strokeWidth={2}
                    name={t('soil.moisture')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">{t('soil.history')}</div>
        <div className="card-body">
          {loading ? (
            <Loader />
          ) : visibleReports.length === 0 ? (
            <EmptyState message={t('soil.noReports')} icon="🧪" />
          ) : (
            <div className="agri-table-wrap">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col">{t('common.date')}</th>
                    <th scope="col">{t('common.farm')}</th>
                    <th scope="col">pH</th>
                    <th scope="col">N</th>
                    <th scope="col">P</th>
                    <th scope="col">K</th>
                    <th scope="col">{t('soil.moisture')}</th>
                    <th scope="col">{t('soil.healthScore')}</th>
                    <th scope="col">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleReports.map((report) => (
                    <tr key={report._id}>
                      <td>{formatDate(report.createdAt)}</td>
                      <td>{report.farm?.name || '—'}</td>
                      <td>{report.ph}</td>
                      <td>{report.nitrogen}</td>
                      <td>{report.phosphorus}</td>
                      <td>{report.potassium}</td>
                      <td>{report.moisture}%</td>
                      <td>
                        <span
                          className={`badge bg-${statusColor(report.healthLabel)}-subtle text-${statusColor(
                            report.healthLabel
                          )}-emphasis`}
                        >
                          {report.healthScore} · {t(`soil.healthLabels.${report.healthLabel}`)}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(report)}
                        >
                          {t('common.delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
