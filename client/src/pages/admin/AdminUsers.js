import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import PageHeader from '../../components/PageHeader';
import AdminTabs from '../../components/AdminTabs';
import Loader from '../../components/Loader';
import ErrorAlert from '../../components/ErrorAlert';
import AlertMessage from '../../components/AlertMessage';
import EmptyState from '../../components/EmptyState';
import { formatDate } from '../../utils/format';

const roles = ['farmer', 'admin'];

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ q: '', role: '' });
  const [applied, setApplied] = useState({ q: '', role: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = { limit: 200 };
      if (applied.q) params.q = applied.q;
      if (applied.role) params.role = applied.role;
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    load();
  }, [load]);

  const updateRole = async (id, role) => {
    setError('');
    setSuccess('');
    try {
      await api.patch(`/admin/users/${id}/role`, { role });
      setSuccess(t('admin.roleUpdated'));
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
      await api.delete(`/admin/users/${id}`);
      setSuccess(t('admin.userDeleted'));
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="container">
      <PageHeader title={t('admin.usersTitle')} subtitle={t('admin.usersSubtitle')} />
      <AdminTabs />

      <ErrorAlert message={error} onClose={() => setError('')} />
      <AlertMessage onClose={() => setSuccess('')}>{success}</AlertMessage>

      <div className="card mb-4">
        <div className="card-body">
          <form
            className="row g-3 align-items-end"
            onSubmit={(event) => {
              event.preventDefault();
              setApplied(filters);
            }}
          >
            <div className="col-md-6">
              <label className="form-label" htmlFor="user-search">
                {t('common.search')}
              </label>
              <input
                id="user-search"
                className="form-control"
                value={filters.q}
                onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
                placeholder={t('common.searchPlaceholder')}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="user-role-filter">
                {t('admin.role')}
              </label>
              <select
                id="user-role-filter"
                className="form-select"
                value={filters.role}
                onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}
              >
                <option value="">{t('common.all')}</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-agri w-100">
                {t('common.filter')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : users.length === 0 ? (
        <EmptyState message={t('common.noData')} icon="👥" />
      ) : (
        <div className="card">
          <div className="table-responsive agri-table-wrap">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">{t('common.name')}</th>
                  <th scope="col">{t('common.email')}</th>
                  <th scope="col">{t('common.location')}</th>
                  <th scope="col">{t('common.date')}</th>
                  <th scope="col">{t('admin.role')}</th>
                  <th scope="col" className="text-end">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = user._id === currentUser._id;
                  return (
                    <tr key={user._id}>
                      <td>
                        <span className="fw-semibold">{user.name}</span>
                        {isSelf && <span className="badge badge-soft ms-2">you</span>}
                      </td>
                      <td className="small">{user.email}</td>
                      <td className="small">{user.location || '—'}</td>
                      <td className="small">{formatDate(user.createdAt)}</td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          style={{ minWidth: '110px' }}
                          value={user.role}
                          disabled={isSelf}
                          onChange={(event) => updateRole(user._id, event.target.value)}
                          aria-label={t('admin.changeRole')}
                        >
                          {roles.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => remove(user._id)}
                          disabled={isSelf}
                        >
                          {t('common.delete')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
