import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import PageHeader from '../components/PageHeader';
import Loader from '../components/Loader';
import ErrorAlert from '../components/ErrorAlert';
import AlertMessage from '../components/AlertMessage';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils/format';

const categories = ['General', 'Crops', 'Pests', 'Weather', 'Marketing', 'Other'];

const emptyForm = { title: '', content: '', category: 'General' };

export default function Forum() {
  const { t } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [filters, setFilters] = useState({ q: '', category: '' });
  const [applied, setApplied] = useState({ q: '', category: '' });
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = { limit: 100 };
      if (applied.q) params.q = applied.q;
      if (applied.category) params.category = applied.category;
      const { data } = await api.get('/forum', { params });
      setPosts(data.data || []);
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/forum', {
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category
      });
      setForm(emptyForm);
      setShowForm(false);
      setSuccess(t('forum.postCreated'));
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container">
      <PageHeader
        title={t('forum.title')}
        subtitle={t('forum.subtitle')}
        actions={
          <button type="button" className="btn btn-agri" onClick={() => setShowForm((value) => !value)}>
            {showForm ? t('common.cancel') : `+ ${t('forum.newPost')}`}
          </button>
        }
      />

      <ErrorAlert message={error} onClose={() => setError('')} />
      <AlertMessage onClose={() => setSuccess('')}>{success}</AlertMessage>

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">{t('forum.newPost')}</div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label" htmlFor="post-title">
                  {t('forum.titleLabel')} *
                </label>
                <input
                  id="post-title"
                  className="form-control"
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  required
                  maxLength={150}
                />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="post-category">
                  {t('forum.category')}
                </label>
                <select
                  id="post-category"
                  className="form-select"
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {t(`forum.categories.${category}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="post-content">
                  {t('forum.content')} *
                </label>
                <textarea
                  id="post-content"
                  className="form-control"
                  rows="4"
                  value={form.content}
                  onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                  required
                  maxLength={5000}
                />
              </div>
              <button type="submit" className="btn btn-agri" disabled={saving}>
                {saving ? t('common.loading') : t('forum.createPost')}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <form onSubmit={handleFilter} className="row g-3 align-items-end">
            <div className="col-md-7">
              <label className="form-label" htmlFor="forum-search">
                {t('common.search')}
              </label>
              <input
                id="forum-search"
                className="form-control"
                value={filters.q}
                onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
                placeholder={t('common.searchPlaceholder')}
              />
            </div>
            <div className="col-md-5">
              <label className="form-label" htmlFor="forum-category-filter">
                {t('forum.category')}
              </label>
              <div className="input-group">
                <select
                  id="forum-category-filter"
                  className="form-select"
                  value={filters.category}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, category: event.target.value }))
                  }
                >
                  <option value="">{t('common.all')}</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {t(`forum.categories.${category}`)}
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
      ) : posts.length === 0 ? (
        <EmptyState message={t('forum.noPosts')} icon="💬" />
      ) : (
        <div className="row g-4">
          {posts.map((post) => (
            <div className="col-md-6" key={post._id}>
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <h2 className="h5 mb-1">
                      <Link to={`/forum/${post._id}`} className="text-decoration-none">
                        {post.title}
                      </Link>
                    </h2>
                    <span className="badge badge-soft">{t(`forum.categories.${post.category}`)}</span>
                  </div>
                  <div className="small text-muted mb-2">
                    {t('forum.author')}: {post.author?.name || '—'} · {formatDate(post.createdAt)}
                  </div>
                  {post.isHidden && (
                    <span className="badge bg-warning-subtle text-warning-emphasis mb-2">
                      {t('forum.hidden')}
                    </span>
                  )}
                  <p className="small text-muted break-word">
                    {post.content.length > 220 ? `${post.content.slice(0, 220)}…` : post.content}
                  </p>
                  <Link to={`/forum/${post._id}`} className="btn btn-sm btn-outline-agri">
                    {t('forum.readMore')}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
