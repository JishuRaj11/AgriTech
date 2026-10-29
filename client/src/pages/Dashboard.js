import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import api, { getErrorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Loader from '../components/Loader';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../utils/format';

const CROP_STATUSES = ['planned', 'growing', 'harvested', 'failed'];
const ORDER_STATUSES = ['pending', 'approved', 'delivered', 'rejected', 'cancelled'];
const COLORS = ['#2f6b3c', '#6f9c4f', '#b7791f', '#c0392b', '#6c757d'];

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [state, setState] = useState({ loading: true, error: '' });
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [consultations, setConsultations] = useState([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setState({ loading: true, error: '' });
        const [farmsRes, cropsRes, ordersRes, consultsRes] = await Promise.all([
          api.get('/farms', { params: { limit: 100 } }),
          api.get('/crops', { params: { limit: 100 } }),
          api.get('/orders', { params: { limit: 100 } }),
          api.get('/consultations', { params: { limit: 100 } })
        ]);
        if (!active) return;
        setFarms(farmsRes.data.data || []);
        setCrops(cropsRes.data.data || []);
        setOrders(ordersRes.data.data || []);
        setConsultations(consultsRes.data.data || []);
        setState({ loading: false, error: '' });
      } catch (error) {
        if (active) setState({ loading: false, error: getErrorMessage(error) });
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  if (state.loading) return <Loader />;

  const growing = crops.filter((crop) => crop.status === 'growing').length;
  const pendingOrders = orders.filter((order) => order.status === 'pending').length;
  const openQuestions = consultations.filter((item) => item.status === 'open').length;

  const cropChartData = CROP_STATUSES.map((status) => ({
    name: t(`crops.statuses.${status}`),
    count: crops.filter((crop) => crop.status === status).length
  }));

  const orderChartData = ORDER_STATUSES.map((status, index) => ({
    name: t(`orders.statuses.${status}`),
    value: orders.filter((order) => order.status === status).length,
    fill: COLORS[index % COLORS.length]
  })).filter((item) => item.value > 0);

  const recentCrops = crops.slice(0, 5);
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="container">
      <div className="hero mb-4">
        <h1 className="h3 mb-1">
          {t('common.welcome')}, {user.name} 👋
        </h1>
        <p className="text-muted mb-0">{t('dashboard.subtitle')}</p>
      </div>

      <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />

      <ErrorAlert message={state.error} />

      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard label={t('dashboard.totalFarms')} value={farms.length} icon="🌾" color="success" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label={t('dashboard.growingCrops')} value={growing} icon="🌱" color="info" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label={t('dashboard.pendingOrders')} value={pendingOrders} icon="📦" color="warning" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard label={t('dashboard.openQuestions')} value={openQuestions} icon="💬" color="primary" />
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-7">
          <div className="card h-100">
            <div className="card-header">{t('dashboard.cropStatus')}</div>
            <div className="card-body">
              <div className="chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cropChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e6ece7" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2f6b3c" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="card h-100">
            <div className="card-header">{t('dashboard.orderStatus')}</div>
            <div className="card-body">
              {orderChartData.length === 0 ? (
                <EmptyState message={t('dashboard.noOrders')} icon="📦" />
              ) : (
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={orderChartData} dataKey="value" nameKey="name" outerRadius={90} label>
                        {orderChartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>{t('dashboard.recentCrops')}</span>
              <Link to="/crops" className="btn btn-sm btn-outline-agri">
                {t('common.view')}
              </Link>
            </div>
            <div className="card-body">
              {recentCrops.length === 0 ? (
                <EmptyState message={t('crops.noCrops')} />
              ) : (
                <ul className="list-plain">
                  {recentCrops.map((crop) => (
                    <li
                      key={crop._id}
                      className="d-flex justify-content-between align-items-center gap-2 border-bottom py-2"
                    >
                      <div>
                        <div className="fw-semibold">{crop.name}</div>
                        <small className="text-muted">
                          {crop.farm?.name || t('common.farm')} · {formatDate(crop.plantingDate)}
                        </small>
                      </div>
                      <StatusBadge status={crop.status} label={t(`crops.statuses.${crop.status}`)} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>{t('dashboard.recentOrders')}</span>
              <Link to="/orders" className="btn btn-sm btn-outline-agri">
                {t('common.view')}
              </Link>
            </div>
            <div className="card-body">
              {recentOrders.length === 0 ? (
                <EmptyState message={t('dashboard.noOrders')} icon="📦" />
              ) : (
                <ul className="list-plain">
                  {recentOrders.map((order) => (
                    <li
                      key={order._id}
                      className="d-flex justify-content-between align-items-center gap-2 border-bottom py-2"
                    >
                      <div>
                        <div className="fw-semibold">{formatCurrency(order.totalAmount)}</div>
                        <small className="text-muted">{formatDate(order.createdAt)}</small>
                      </div>
                      <StatusBadge
                        status={order.status}
                        label={t(`orders.statuses.${order.status}`)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">{t('dashboard.quickActions')}</div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-6 col-md-3">
              <Link to="/farms" className="quick-action">
                <span className="icon" aria-hidden="true">
                  🌾
                </span>
                <span className="fw-semibold">{t('dashboard.addFarm')}</span>
              </Link>
            </div>
            <div className="col-6 col-md-3">
              <Link to="/soil" className="quick-action">
                <span className="icon" aria-hidden="true">
                  🧪
                </span>
                <span className="fw-semibold">{t('dashboard.analyzeSoil')}</span>
              </Link>
            </div>
            <div className="col-6 col-md-3">
              <Link to="/weather" className="quick-action">
                <span className="icon" aria-hidden="true">
                  ⛅
                </span>
                <span className="fw-semibold">{t('dashboard.checkWeather')}</span>
              </Link>
            </div>
            <div className="col-6 col-md-3">
              <Link to="/resources" className="quick-action">
                <span className="icon" aria-hidden="true">
                  🛒
                </span>
                <span className="fw-semibold">{t('dashboard.browseResources')}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
