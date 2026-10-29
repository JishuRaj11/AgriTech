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
import api, { getErrorMessage } from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import PageHeader from '../../components/PageHeader';
import AdminTabs from '../../components/AdminTabs';
import StatCard from '../../components/StatCard';
import Loader from '../../components/Loader';
import ErrorAlert from '../../components/ErrorAlert';
import EmptyState from '../../components/EmptyState';
import { formatCurrency } from '../../utils/format';

const CROP_STATUSES = ['planned', 'growing', 'harvested', 'failed'];
const ORDER_STATUSES = ['pending', 'approved', 'delivered', 'rejected', 'cancelled'];
const COLORS = ['#2f6b3c', '#6f9c4f', '#b7791f', '#c0392b', '#6c757d'];

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data } = await api.get('/admin/stats');
        if (active) setStats(data.data);
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const cropChartData = stats
    ? CROP_STATUSES.map((status) => ({
        name: t(`crops.statuses.${status}`),
        count: stats.crops.byStatus[status] || 0
      }))
    : [];

  const orderChartData = stats
    ? ORDER_STATUSES.map((status, index) => ({
        name: t(`orders.statuses.${status}`),
        value: stats.orders.byStatus[status] || 0,
        fill: COLORS[index % COLORS.length]
      })).filter((item) => item.value > 0)
    : [];

  return (
    <div className="container">
      <PageHeader title={t('admin.dashboardTitle')} subtitle={t('admin.dashboardSubtitle')} />
      <AdminTabs />

      <ErrorAlert message={error} />

      {loading ? (
        <Loader />
      ) : !stats ? (
        <EmptyState message={t('common.noData')} />
      ) : (
        <>
          <div className="row g-3 mb-4">
            <div className="col-6 col-lg-3">
              <StatCard
                label={t('admin.users')}
                value={stats.users.total}
                icon="👥"
                color="primary"
                help={`${stats.users.farmers} ${t('admin.farmers')} · ${stats.users.admins} ${t('admin.admins')}`}
              />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard label={t('admin.farms')} value={stats.farms.total} icon="🌾" color="success" />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard label={t('admin.crops')} value={stats.crops.total} icon="🌱" color="info" />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard label={t('admin.orders')} value={stats.orders.total} icon="📦" color="warning" />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard
                label={t('admin.revenue')}
                value={formatCurrency(stats.orders.revenue)}
                icon="💰"
                color="success"
              />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard
                label={t('admin.resources')}
                value={stats.resources.total}
                icon="🛒"
                color="primary"
                help={`${stats.resources.pending} ${t('admin.pendingApprovals')}`}
              />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard
                label={t('admin.pestAlerts')}
                value={stats.pests.total}
                icon="🐛"
                color="danger"
                help={`${stats.pests.active} ${t('admin.active')}`}
              />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard
                label={t('admin.consultations')}
                value={stats.consultations.total}
                icon="💬"
                color="warning"
                help={`${stats.consultations.open} ${t('admin.openQuestions')}`}
              />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard
                label={t('admin.forumPosts')}
                value={stats.forum.total}
                icon="🗣️"
                color="info"
                help={`${stats.forum.hidden} ${t('admin.hiddenPosts')}`}
              />
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-lg-7">
              <div className="card h-100">
                <div className="card-header">{t('admin.cropStatus')}</div>
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
                <div className="card-header">{t('admin.orderStatus')}</div>
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

          <div className="card">
            <div className="card-header">{t('admin.overview')}</div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-6 col-md-4 col-xl-2">
                  <Link to="/admin/users" className="quick-action">
                    <span className="icon" aria-hidden="true">
                      👥
                    </span>
                    <span className="fw-semibold">{t('admin.manageUsers')}</span>
                  </Link>
                </div>
                <div className="col-6 col-md-4 col-xl-2">
                  <Link to="/admin/resources" className="quick-action">
                    <span className="icon" aria-hidden="true">
                      🛒
                    </span>
                    <span className="fw-semibold">{t('admin.manageResources')}</span>
                  </Link>
                </div>
                <div className="col-6 col-md-4 col-xl-2">
                  <Link to="/admin/orders" className="quick-action">
                    <span className="icon" aria-hidden="true">
                      📦
                    </span>
                    <span className="fw-semibold">{t('admin.manageOrders')}</span>
                  </Link>
                </div>
                <div className="col-6 col-md-4 col-xl-2">
                  <Link to="/admin/pests" className="quick-action">
                    <span className="icon" aria-hidden="true">
                      🐛
                    </span>
                    <span className="fw-semibold">{t('admin.managePests')}</span>
                  </Link>
                </div>
                <div className="col-6 col-md-4 col-xl-2">
                  <Link to="/admin/moderation" className="quick-action">
                    <span className="icon" aria-hidden="true">
                      🛡️
                    </span>
                    <span className="fw-semibold">{t('admin.moderation')}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
