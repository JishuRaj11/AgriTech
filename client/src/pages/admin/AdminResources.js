import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import PageHeader from '../../components/PageHeader';
import AdminTabs from '../../components/AdminTabs';
import Loader from '../../components/Loader';
import ErrorAlert from '../../components/ErrorAlert';
import AlertMessage from '../../components/AlertMessage';
import EmptyState from '../../components/EmptyState';
import { formatCurrency, formatDate } from '../../utils/format';

const categories = ['seeds', 'fertilizer', 'pesticide', 'tool', 'other'];

const emptyForm = {
  name: '',
  category: 'seeds',
  description: '',
  price: '',
  unit: 'unit',
  stock: '0',
  isApproved: false
};

export default function AdminResources() {
  const { t } = useLanguage();
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = { limit: 200 };
      if (filter) params.approved = filter;
      const { data } = await api.get('/resources', { params });
      setResources(data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const startEdit = (resource) => {
    setEditingId(resource._id);
    setForm({
      name: resource.name,
      category: resource.category,
      description: resource.description || '',
      price: String(resource.price),
      unit: resource.unit || 'unit',
      stock: String(resource.stock ?? 0),
      isApproved: Boolean(resource.isApproved)
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
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      price: Number(form.price),
      unit: form.unit.trim() || 'unit',
      stock: Number(form.stock),
      isApproved: form.isApproved
    };
    try {
      if (editingId) await api.put(`/resources/${editingId}`, payload);
      else await api.post('/resources', payload);
      setSuccess(t('admin.saved'));
      cancel();
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleApproval = async (resource) => {
    setError('');
    setSuccess('');
    try {
      await api.patch(`/resources/${resource._id}/approve`, { isApproved: !resource.isApproved });
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
      await api.delete(`/resources/${id}`);
      setSuccess(t('admin.deleted'));
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="container">
      <PageHeader
        title={t('admin.resourcesTitle')}
        subtitle={t('admin.resourcesSubtitle')}
        actions={
          <button type="button" className="btn btn-agri" onClick={startCreate}>
            + {t('admin.addResource')}
          </button>
        }
      />
      <AdminTabs />

      <ErrorAlert message={error} onClose={() => setError('')} />
      <AlertMessage onClose={() => setSuccess('')}>{success}</AlertMessage>

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">{editingId ? t('admin.editResource') : t('admin.addResource')}</div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label" htmlFor="resource-name">
                    {t('common.name')} *
                  </label>
                  <input
                    id="resource-name"
                    className="form-control"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    required
                    maxLength={100}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label" htmlFor="resource-category">
                    {t('forum.category')}
                  </label>
                  <select
                    id="resource-category"
                    className="form-select"
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, category: event.target.value }))
                    }
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {t(`resources.categories.${category}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label" htmlFor="resource-unit">
                    {t('common.unit')}
                  </label>
                  <input
                    id="resource-unit"
                    className="form-control"
                    value={form.unit}
                    onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}
                    maxLength={30}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="resource-price">
                    {t('common.price')} (₹) *
                  </label>
                  <input
                    id="resource-price"
                    className="form-control"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="resource-stock">
                    {t('common.stock')} *
                  </label>
                  <input
                    id="resource-stock"
                    className="form-control"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
                    required
                  />
                </div>
                <div className="col-md-4 d-flex align-items-end">
                  <div className="form-check">
                    <input
                      id="resource-approved"
                      className="form-check-input"
                      type="checkbox"
                      checked={form.isApproved}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, isApproved: event.target.checked }))
                      }
                    />
                    <label className="form-check-label" htmlFor="resource-approved">
                      {t('admin.approved')}
                    </label>
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="resource-description">
                    {t('admin.description')}
                  </label>
                  <textarea
                    id="resource-description"
                    className="form-control"
                    rows="3"
                    maxLength={1000}
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                    }
                  />
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

      <div className="card mb-4">
        <div className="card-body d-flex align-items-center gap-3 flex-wrap">
          <label className="form-label mb-0" htmlFor="resource-approval-filter">
            {t('admin.approved')}
          </label>
          <select
            id="resource-approval-filter"
            className="form-select"
            style={{ maxWidth: '240px' }}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="">{t('common.all')}</option>
            <option value="true">{t('admin.approved')}</option>
            <option value="false">{t('admin.pending')}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : resources.length === 0 ? (
        <EmptyState message={t('resources.noResources')} icon="🛒" />
      ) : (
        <div className="card">
          <div className="table-responsive agri-table-wrap">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">{t('common.name')}</th>
                  <th scope="col">{t('forum.category')}</th>
                  <th scope="col">{t('common.price')}</th>
                  <th scope="col">{t('common.stock')}</th>
                  <th scope="col">{t('common.status')}</th>
                  <th scope="col">{t('common.date')}</th>
                  <th scope="col" className="text-end">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {resources.map((resource) => (
                  <tr key={resource._id}>
                    <td>
                      <div className="fw-semibold">{resource.name}</div>
                      <div className="small text-muted text-truncate" style={{ maxWidth: '260px' }}>
                        {resource.description}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-soft">
                        {t(`resources.categories.${resource.category}`)}
                      </span>
                    </td>
                    <td>{formatCurrency(resource.price)}</td>
                    <td>
                      {resource.stock} {resource.unit}
                    </td>
                    <td>
                      <span
                        className={`badge bg-${resource.isApproved ? 'success' : 'warning'}-subtle text-${
                          resource.isApproved ? 'success' : 'warning'
                        }-emphasis`}
                      >
                        {resource.isApproved ? t('admin.approved') : t('admin.pending')}
                      </span>
                    </td>
                    <td className="small">{formatDate(resource.createdAt)}</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end flex-wrap gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success"
                          onClick={() => toggleApproval(resource)}
                        >
                          {resource.isApproved ? t('admin.unapprove') : t('admin.approve')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => startEdit(resource)}
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => remove(resource._id)}
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
