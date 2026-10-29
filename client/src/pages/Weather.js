import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
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
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import PageHeader from '../components/PageHeader';
import Loader from '../components/Loader';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import { formatDate, formatDateTime } from '../utils/format';

export default function Weather() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [location, setLocation] = useState(user.location || '');
  const [data, setData] = useState(null);
  const [pests, setPests] = useState([]);
  const [loading, setLoading] = useState(Boolean(user.location));
  const [error, setError] = useState('');

  const loadPests = useCallback(async (place) => {
    try {
      const region = (place || '').split(',').pop().trim();
      if (!region) return;
      const { data: pestData } = await api.get('/pests', { params: { region, limit: 3 } });
      setPests(pestData.data || []);
    } catch (err) {
      setPests([]);
    }
  }, []);

  const load = useCallback(
    async (place, refresh = false) => {
      if (!place || !place.trim()) {
        setError(t('weather.requiredLocation'));
        return;
      }
      try {
        setLoading(true);
        setError('');
        const params = { location: place.trim() };
        if (refresh) params.refresh = 'true';
        const { data: weatherData } = await api.get('/weather', { params });
        setData(weatherData.data);
        loadPests(weatherData.data.resolvedName || place);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [loadPests, t]
  );

  useEffect(() => {
    if (user.location) load(user.location);
  }, [user.location, load]);

  const handleSubmit = (event) => {
    event.preventDefault();
    load(location);
  };

  const current = data?.current;
  const chartData = (data?.forecast || []).map((day) => ({
    date: formatDate(day.date),
    maxTemp: day.maxTemp,
    minTemp: day.minTemp,
    rain: day.precipitation
  }));

  return (
    <div className="container">
      <PageHeader title={t('weather.title')} subtitle={t('weather.subtitle')} />

      <div className="card mb-4">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="row g-3 align-items-end">
            <div className="col-md-8">
              <label className="form-label" htmlFor="weather-location">
                {t('weather.locationLabel')}
              </label>
              <input
                id="weather-location"
                className="form-control form-control-lg"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder={t('weather.searchHint')}
              />
            </div>
            <div className="col-md-4 d-flex gap-2">
              <button type="submit" className="btn btn-agri flex-grow-1" disabled={loading}>
                {loading ? t('common.loading') : t('weather.getWeather')}
              </button>
              {data && (
                <button
                  type="button"
                  className="btn btn-outline-agri"
                  onClick={() => load(location, true)}
                  disabled={loading}
                >
                  {t('common.refresh')}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <ErrorAlert message={error} onClose={() => setError('')} />

      {loading && !data ? (
        <Loader />
      ) : !data ? (
        <EmptyState message={t('weather.subtitle')} icon="⛅" />
      ) : (
        <>
          <div className="row g-4">
            <div className="col-lg-7">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <span>{t('weather.current')}</span>
                  <small className="text-muted">
                    {data.resolvedName || data.location}
                    {data.cached ? ' · cached' : ''}
                  </small>
                </div>
                <div className="card-body">
                  <div className="d-flex align-items-center gap-4 flex-wrap">
                    <div className="weather-icon" aria-hidden="true">
                      {current?.icon}
                    </div>
                    <div>
                      <div className="display-5 fw-bold">{Math.round(current?.temperature)}°C</div>
                      <div className="text-muted">{current?.description}</div>
                      <div className="small text-muted">
                        {t('weather.feelsLike')}: {Math.round(current?.feelsLike)}°C
                      </div>
                    </div>
                  </div>

                  <div className="row g-3 mt-3">
                    <div className="col-6 col-md-3">
                      <div className="border rounded-3 p-2 text-center">
                        <div className="small text-muted">💧 {t('weather.humidity')}</div>
                        <div className="fw-bold">{current?.humidity}%</div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="border rounded-3 p-2 text-center">
                        <div className="small text-muted">💨 {t('weather.wind')}</div>
                        <div className="fw-bold">{current?.windSpeed} km/h</div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="border rounded-3 p-2 text-center">
                        <div className="small text-muted">🌧️ {t('weather.precipitation')}</div>
                        <div className="fw-bold">{current?.precipitation} mm</div>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="border rounded-3 p-2 text-center">
                        <div className="small text-muted">🕒 {t('weather.updated')}</div>
                        <div className="fw-bold small">{formatDateTime(data.fetchedAt)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="card h-100">
                <div className="card-header">{t('weather.alerts')}</div>
                <div className="card-body">
                  {data.alerts?.length ? (
                    <ul className="list-plain">
                      {data.alerts.map((alert) => (
                        <li className="alert alert-danger py-2 mb-2" key={alert} role="alert">
                          ⚠️ {alert}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="alert alert-success mb-0">✅ {t('weather.noAlerts')}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header">{t('weather.tips')}</div>
            <div className="card-body">
              <ul className="mb-0">
                {data.tips?.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header">{t('weather.forecast')}</div>
            <div className="card-body">
              <div className="row g-2">
                {(data.forecast || []).map((day) => (
                  <div className="col-6 col-md-4 col-lg" key={day.date}>
                    <div className="forecast-day">
                      <div className="small fw-semibold">{formatDate(day.date)}</div>
                      <div style={{ fontSize: '1.8rem' }} aria-hidden="true">
                        {day.icon}
                      </div>
                      <div className="small text-muted mb-1">{day.description}</div>
                      <div className="fw-bold">
                        {Math.round(day.maxTemp)}° / {Math.round(day.minTemp)}°
                      </div>
                      <div className="small text-muted">🌧️ {day.precipitation ?? 0} mm</div>
                      <div className="small text-muted">💨 {Math.round(day.windSpeed ?? 0)} km/h</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="row g-4 mt-1">
            <div className="col-lg-7">
              <div className="card h-100">
                <div className="card-header">{t('weather.temperatureChart')}</div>
                <div className="card-body">
                  <div className="chart-box">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e6ece7" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="maxTemp" stroke="#c0392b" strokeWidth={2} name="Max °C" />
                        <Line type="monotone" dataKey="minTemp" stroke="#2f6b3c" strokeWidth={2} name="Min °C" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="card h-100">
                <div className="card-header">{t('weather.rainChart')}</div>
                <div className="card-body">
                  <div className="chart-box">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e6ece7" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="rain" fill="#2f6b3c" name="mm" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header">{t('weather.pestAlerts')}</div>
            <div className="card-body">
              {pests.length === 0 ? (
                <EmptyState message={t('pests.noAlerts')} icon="🐛" />
              ) : (
                <div className="row g-3">
                  {pests.map((pest) => (
                    <div className="col-md-4" key={pest._id}>
                      <div className="border rounded-3 p-3 h-100">
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <div className="fw-semibold">{pest.title}</div>
                          <span className={`badge bg-${pest.severity === 'high' ? 'danger' : pest.severity === 'medium' ? 'warning' : 'success'}-subtle text-${pest.severity === 'high' ? 'danger' : pest.severity === 'medium' ? 'warning' : 'success'}-emphasis`}>
                            {t(`pests.severities.${pest.severity}`)}
                          </span>
                        </div>
                        <div className="small text-muted mt-1">
                          {pest.crop} · {pest.region}
                        </div>
                        <p className="small mb-0 mt-2 break-word">{pest.symptoms}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
