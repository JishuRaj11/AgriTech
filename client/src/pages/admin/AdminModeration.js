import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';
import PageHeader from '../../components/PageHeader';
import AdminTabs from '../../components/AdminTabs';
import Loader from '../../components/Loader';
import ErrorAlert from '../../components/ErrorAlert';
import AlertMessage from '../../components/AlertMessage';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, formatDateTime } from '../../utils/format';

export default function AdminModeration() {
  const { t } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [replies, setReplies] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [postsRes, consultationsRes] = await Promise.all([
        api.get('/forum', { params: { limit: 200 } }),
        api.get('/consultations', { params: { limit: 200 } })
      ]);
      setPosts(postsRes.data.data || []);
      setConsultations(consultationsRes.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const togglePost = async (post) => {
    setError('');
    setSuccess('');
    try {
      await api.patch(`/forum/${post._id}/moderate`, { isHidden: !post.isHidden });
      setSuccess(t('forum.moderated'));
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const deletePost = async (id) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/forum/${id}`);
      setSuccess(t('forum.postDeleted'));
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const reply = async (id) => {
    const text = (replies[id] || '').trim();
    if (!text) return;
    setError('');
    setSuccess('');
    try {
      await api.patch(`/consultations/${id}/reply`, { reply: text });
      setReplies((current) => ({ ...current, [id]: '' }));
      setSuccess(t('consultations.replied'));
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const deleteConsultation = async (id) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/consultations/${id}`);
      setSuccess(t('admin.deleted'));
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="container">
      <PageHeader
        title={t('admin.moderationTitle')}
        subtitle={t('admin.moderationSubtitle')}
      />
      <AdminTabs />

      <ErrorAlert message={error} onClose={() => setError('')} />
      <AlertMessage onClose={() => setSuccess('')}>{success}</AlertMessage>

      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>{t('admin.forumSection')}</span>
              <Link to="/forum" className="btn btn-sm btn-outline-agri">
                {t('common.view')}
              </Link>
            </div>
            <div className="card-body">
              {posts.length === 0 ? (
                <EmptyState message={t('admin.noForumPosts')} icon="💬" />
              ) : (
                <ul className="list-plain">
                  {posts.map((post) => (
                    <li key={post._id} className="border-bottom py-3">
                      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                        <div>
                          <Link to={`/forum/${post._id}`} className="fw-semibold text-decoration-none">
                            {post.title}
                          </Link>
                          <div className="small text-muted">
                            {t('forum.author')}: {post.author?.name || '—'} ·{' '}
                            {formatDateTime(post.createdAt)} ·{' '}
                            {t(`forum.categories.${post.category}`)}
                          </div>
                          {post.isHidden && (
                            <span className="badge bg-warning-subtle text-warning-emphasis mt-1">
                              {t('forum.hidden')}
                            </span>
                          )}
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => togglePost(post)}
                          >
                            {post.isHidden ? t('forum.restore') : t('forum.hide')}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => deletePost(post._id)}
                          >
                            {t('common.delete')}
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>{t('admin.consultationSection')}</span>
              <Link to="/consultations" className="btn btn-sm btn-outline-agri">
                {t('common.view')}
              </Link>
            </div>
            <div className="card-body">
              {consultations.length === 0 ? (
                <EmptyState message={t('admin.noConsultations')} icon="💬" />
              ) : (
                <ul className="list-plain">
                  {consultations.map((item) => (
                    <li key={item._id} className="border-bottom py-3">
                      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                        <div>
                          <div className="small text-muted">
                            {item.farmer?.name || '—'}
                            {item.farmer?.email ? ` (${item.farmer.email})` : ''} ·{' '}
                            {formatDate(item.createdAt)}
                            {item.crop ? ` · 🌱 ${item.crop}` : ''}
                          </div>
                          <div className="fw-semibold break-word">{item.question}</div>
                        </div>
                        <StatusBadge
                          status={item.status}
                          label={t(`consultations.statuses.${item.status}`)}
                        />
                      </div>

                      {item.reply && (
                        <div className="bg-light rounded-3 p-3 mb-2">
                          <div className="small fw-semibold text-success">
                            {t('consultations.answerLabel')}
                            {item.repliedBy?.name ? ` · ${item.repliedBy.name}` : ''}
                          </div>
                          <div className="small break-word">{item.reply}</div>
                        </div>
                      )}

                      <label className="form-label small" htmlFor={`mod-reply-${item._id}`}>
                        {t('consultations.replyPlaceholder')}
                      </label>
                      <textarea
                        id={`mod-reply-${item._id}`}
                        className="form-control"
                        rows="2"
                        maxLength={2000}
                        value={replies[item._id] || ''}
                        onChange={(event) =>
                          setReplies((current) => ({ ...current, [item._id]: event.target.value }))
                        }
                      />
                      <div className="d-flex gap-2 mt-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-agri"
                          onClick={() => reply(item._id)}
                        >
                          {t('consultations.sendReply')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteConsultation(item._id)}
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
