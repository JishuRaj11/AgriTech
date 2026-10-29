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
import { formatCurrency, formatDate } from '../../utils/format';

const statuses = ['pending', 'approved', 'delivered', 'rejected', 'cancelled'];

export default function AdminOrders() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = { limit: 200 };
      if (filter) params.status = filter;
      const { data } = await api.get('/orders', { params });
      setOrders(data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (id, status) => {
    setError('');
    setSuccess('');
    try {
      await api.patch(`/orders/${id}/status`, { status });
      setSuccess(t('orders.statusUpdated'));
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="container">
      <PageHeader title={t('admin.ordersTitle')} subtitle={t('admin.ordersSubtitle')} />
      <AdminTabs />

      <ErrorAlert message={error} onClose={() => setError('')} />
      <AlertMessage onClose={() => setSuccess('')}>{success}</AlertMessage>

      <div className="card mb-4">
        <div className="card-body d-flex align-items-center gap-3 flex-wrap">
          <label className="form-label mb-0" htmlFor="admin-order-filter">
            {t('orders.filterStatus')}
          </label>
          <select
            id="admin-order-filter"
            className="form-select"
            style={{ maxWidth: '240px' }}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="">{t('common.all')}</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {t(`orders.statuses.${status}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : orders.length === 0 ? (
        <EmptyState message={t('orders.noOrders')} icon="📦" />
      ) : (
        <div className="row g-4">
          {orders.map((order) => (
            <div className="col-lg-6" key={order._id}>
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center gap-2">
                  <span>
                    {t('orders.orderId')} #{order._id.slice(-6).toUpperCase()}
                  </span>
                  <StatusBadge status={order.status} label={t(`orders.statuses.${order.status}`)} />
                </div>
                <div className="card-body">
                  <div className="d-flex justify-content-between flex-wrap gap-2 mb-2">
                    <small className="text-muted">
                      {t('orders.placed')}: {formatDate(order.createdAt)}
                    </small>
                    <strong>{formatCurrency(order.totalAmount)}</strong>
                  </div>

                  {order.user && (
                    <p className="small text-muted mb-2">
                      👤 {order.user.name} ({order.user.email})
                      {order.user.location ? ` · ${order.user.location}` : ''}
                    </p>
                  )}

                  <ul className="list-plain mb-3">
                    {order.items.map((item, index) => (
                      <li
                        key={`${item.resource}-${index}`}
                        className="d-flex justify-content-between small border-bottom py-1"
                      >
                        <span>
                          {item.name} × {item.quantity}
                        </span>
                        <span>{formatCurrency(item.price * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="small text-muted mb-3">📍 {order.deliveryAddress}</p>

                  <label className="form-label small" htmlFor={`status-${order._id}`}>
                    {t('orders.updateStatus')}
                  </label>
                  <select
                    id={`status-${order._id}`}
                    className="form-select form-select-sm"
                    value={order.status}
                    onChange={(event) => changeStatus(order._id, event.target.value)}
                    disabled={order.status === 'delivered'}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {t(`orders.statuses.${status}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
