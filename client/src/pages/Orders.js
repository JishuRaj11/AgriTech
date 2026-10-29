import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import PageHeader from '../components/PageHeader';
import Loader from '../components/Loader';
import ErrorAlert from '../components/ErrorAlert';
import AlertMessage from '../components/AlertMessage';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../utils/format';

const statuses = ['pending', 'approved', 'delivered', 'rejected', 'cancelled'];

export default function Orders() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = { limit: 100 };
      if (status) params.status = status;
      const { data } = await api.get('/orders', { params });
      setOrders(data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const cancelOrder = async (order) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    try {
      await api.patch(`/orders/${order._id}/cancel`);
      setSuccess(t('orders.cancelled'));
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="container">
      <PageHeader
        title={user.role === 'admin' ? t('orders.adminTitle') : t('orders.title')}
        subtitle={t('orders.subtitle')}
        actions={
          <Link to="/resources" className="btn btn-agri">
            {t('dashboard.browseResources')}
          </Link>
        }
      />

      <ErrorAlert message={error} onClose={() => setError('')} />
      <AlertMessage onClose={() => setSuccess('')}>{success}</AlertMessage>

      <div className="card mb-4">
        <div className="card-body">
          <label className="form-label" htmlFor="order-status-filter">
            {t('orders.filterStatus')}
          </label>
          <select
            id="order-status-filter"
            className="form-select"
            style={{ maxWidth: '320px' }}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">{t('common.all')}</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {t(`orders.statuses.${item}`)}
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
          {orders.map((order) => {
            const stepIndex = ['pending', 'approved', 'delivered'].indexOf(order.status);
            const failed = ['rejected', 'cancelled'].includes(order.status);
            return (
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

                    {user.role === 'admin' && order.user && (
                      <p className="small text-muted mb-2">
                        👤 {order.user.name} ({order.user.email})
                      </p>
                    )}

                    <ul className="list-plain mb-3">
                      {order.items.map((item, index) => (
                        <li key={`${item.resource}-${index}`} className="d-flex justify-content-between small border-bottom py-1">
                          <span>
                            {item.name} × {item.quantity}
                          </span>
                          <span>{formatCurrency(item.price * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>

                    <p className="small text-muted mb-3">📍 {order.deliveryAddress}</p>

                    {!failed ? (
                      <div className="d-flex justify-content-between gap-2" aria-label={t('orders.tracking')}>
                        {['pending', 'approved', 'delivered'].map((step, index) => (
                          <div className="text-center flex-grow-1" key={step}>
                            <div
                              className={`rounded-circle mx-auto d-flex align-items-center justify-content-center ${
                                index <= stepIndex ? 'bg-success text-white' : 'bg-light text-muted'
                              }`}
                              style={{ width: 32, height: 32 }}
                              aria-hidden="true"
                            >
                              {index <= stepIndex ? '✓' : index + 1}
                            </div>
                            <div className="small mt-1">{t(`orders.statuses.${step}`)}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="alert alert-secondary py-2 small mb-0">
                        {t(`orders.statuses.${order.status}`)}
                      </div>
                    )}
                  </div>

                  {order.status === 'pending' && (
                    <div className="card-footer bg-transparent">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => cancelOrder(order)}
                      >
                        {t('orders.cancelOrder')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
