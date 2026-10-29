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
import { formatCurrency } from '../utils/format';

const categories = ['seeds', 'fertilizer', 'pesticide', 'tool', 'other'];

export default function Resources() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [resources, setResources] = useState([]);
  const [filters, setFilters] = useState({ q: '', category: '' });
  const [applied, setApplied] = useState({ q: '', category: '' });
  const [address, setAddress] = useState(user.location || '');
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = { limit: 100 };
      if (applied.q) params.q = applied.q;
      if (applied.category) params.category = applied.category;
      const { data } = await api.get('/resources', { params });
      setResources(data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFilter = (event) => {
    event.preventDefault();
    setApplied(filters);
  };

  const placeOrder = async (resource) => {
    setError('');
    setSuccess(false);
    if (!address.trim()) {
      setError(t('resources.addressHint'));
      return;
    }
    setSavingId(resource._id);
    try {
      const quantity = Number(quantities[resource._id] || 1);
      await api.post('/orders', {
        items: [{ resource: resource._id, quantity }],
        deliveryAddress: address.trim()
      });
      setQuantities((current) => ({ ...current, [resource._id]: 1 }));
      setSuccess(true);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingId('');
    }
  };

  return (
    <div className="container">
      <PageHeader title={t('resources.title')} subtitle={t('resources.subtitle')} />

      <ErrorAlert message={error} onClose={() => setError('')} />
      <AlertMessage variant="success" onClose={() => setSuccess(false)}>
        {success && (
          <>
            {t('resources.orderSuccess')}{' '}
            <Link to="/orders" className="alert-link">
              {t('nav.orders')}
            </Link>
          </>
        )}
      </AlertMessage>

      {user.role === 'farmer' && (
        <div className="card mb-4">
          <div className="card-body">
            <label className="form-label fw-semibold" htmlFor="delivery-address">
              📍 {t('resources.addressLabel')}
            </label>
            <input
              id="delivery-address"
              className="form-control form-control-lg"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder={t('resources.addressHint')}
              maxLength={300}
            />
            <div className="form-text">{t('resources.addressHint')}</div>
          </div>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <form onSubmit={handleFilter} className="row g-3 align-items-end">
            <div className="col-md-8">
              <label className="form-label" htmlFor="resource-search">
                {t('common.search')}
              </label>
              <input
                id="resource-search"
                className="form-control"
                value={filters.q}
                onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
                placeholder={t('resources.searchPlaceholder')}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="resource-category">
                {t('forum.category')}
              </label>
              <div className="input-group">
                <select
                  id="resource-category"
                  className="form-select"
                  value={filters.category}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, category: event.target.value }))
                  }
                >
                  <option value="">{t('resources.categories.all')}</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {t(`resources.categories.${category}`)}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn btn-agri">
                  {t('common.filter')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : resources.length === 0 ? (
        <EmptyState message={t('resources.noResources')} icon="🛒" />
      ) : (
        <div className="row g-4">
          {resources.map((resource) => {
            const outOfStock = resource.stock <= 0;
            return (
              <div className="col-md-6 col-xl-4" key={resource._id}>
                <div className="card h-100">
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <h2 className="h5 mb-1">{resource.name}</h2>
                      <span className="badge badge-soft">
                        {t(`resources.categories.${resource.category}`)}
                      </span>
                    </div>
                    <p className="text-muted small mt-2 break-word">{resource.description}</p>

                    {user.role === 'admin' && !resource.isApproved && (
                      <div className="alert alert-warning py-1 px-2 small">
                        {t('admin.pending')}
                      </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center mt-auto pt-3">
                      <div>
                        <div className="h5 mb-0">{formatCurrency(resource.price)}</div>
                        <small className="text-muted">
                          / {resource.unit} · {t('common.stock')}: {resource.stock}
                        </small>
                      </div>
                      {outOfStock ? (
                        <span className="badge bg-danger-subtle text-danger-emphasis">
                          {t('resources.outOfStock')}
                        </span>
                      ) : (
                        <span className="badge bg-success-subtle text-success-emphasis">
                          {resource.stock}
                        </span>
                      )}
                    </div>

                    {user.role === 'farmer' && (
                      <div className="mt-3">
                        <label className="form-label small" htmlFor={`qty-${resource._id}`}>
                          {t('common.quantity')}
                        </label>
                        <div className="input-group">
                          <input
                            id={`qty-${resource._id}`}
                            className="form-control"
                            type="number"
                            min="1"
                            max={resource.stock}
                            step="1"
                            value={quantities[resource._id] ?? 1}
                            onChange={(event) =>
                              setQuantities((current) => ({
                                ...current,
                                [resource._id]: event.target.value
                              }))
                            }
                            disabled={outOfStock}
                          />
                          <button
                            type="button"
                            className="btn btn-agri"
                            onClick={() => placeOrder(resource)}
                            disabled={outOfStock || savingId === resource._id}
                          >
                            {savingId === resource._id ? t('common.loading') : t('resources.order')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
