import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Loader from '../components/Loader';
import ErrorAlert from '../components/ErrorAlert';
import AlertMessage from '../components/AlertMessage';
import { formatDate, formatDateTime } from '../utils/format';

const categories = ['General', 'Crops', 'Pests', 'Weather', 'Marketing', 'Other'];

export default function ForumPost() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [commentText, setCommentText] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', content: '', category: 'General' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get(`/forum/${id}`);
      setPost(data.data);
      setEditForm({
        title: data.data.title,
        content: data.data.content,
        category: data.data.category
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="container"><Loader /></div>;

  if (!post) {
    return (
      <div className="container">
        <ErrorAlert message={error || t('common.error')} />
        <Link to="/forum" className="btn btn-outline-agri">
          {t('common.back')}
        </Link>
      </div>
    );
  }

  const authorId = post.author?._id || post.author;
  const isAuthor = String(authorId) === String(user._id);
  const isAdmin = user.role === 'admin';
  const canEdit = isAuthor || isAdmin;

  const saveEdit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await api.put(`/forum/${post._id}`, editForm);
      setPost((current) => ({ ...current, ...data.data }));
      setEditing(false);
      setSuccess(t('forum.postUpdated'));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async () => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    try {
      await api.delete(`/forum/${post._id}`);
      navigate('/forum', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const moderate = async () => {
    try {
      await api.patch(`/forum/${post._id}/moderate`, { isHidden: !post.isHidden });
      setSuccess(t('forum.moderated'));
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const addComment = async (event) => {
    event.preventDefault();
    if (!commentText.trim()) return;
    try {
      const { data } = await api.post(`/forum/${post._id}/comments`, { content: commentText.trim() });
      setPost(data.data);
      setCommentText('');
      setSuccess(t('forum.commentAdded'));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    try {
      await api.delete(`/forum/${post._id}/comments/${commentId}`);
      setSuccess(t('forum.commentDeleted'));
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      <Link to="/forum" className="btn btn-sm btn-outline-secondary mb-3">
        ← {t('common.back')}
      </Link>

      <ErrorAlert message={error} onClose={() => setError('')} />
      <AlertMessage onClose={() => setSuccess('')}>{success}</AlertMessage>

      <div className="card mb-4">
        <div className="card-body">
          {editing ? (
            <form onSubmit={saveEdit}>
              <div className="mb-3">
                <label className="form-label" htmlFor="edit-post-title">
                  {t('forum.titleLabel')}
                </label>
                <input
                  id="edit-post-title"
                  className="form-control"
                  value={editForm.title}
                  onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))}
                  required
                  maxLength={150}
                />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="edit-post-category">
                  {t('forum.category')}
                </label>
                <select
                  id="edit-post-category"
                  className="form-select"
                  value={editForm.category}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, category: event.target.value }))
                  }
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {t(`forum.categories.${category}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="edit-post-content">
                  {t('forum.content')}
                </label>
                <textarea
                  id="edit-post-content"
                  className="form-control"
                  rows="6"
                  value={editForm.content}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, content: event.target.value }))
                  }
                  required
                  maxLength={5000}
                />
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-agri" disabled={saving}>
                  {saving ? t('common.loading') : t('common.save')}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setEditing(false)}>
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                <h1 className="h3 mb-1">{post.title}</h1>
                <span className="badge badge-soft">{t(`forum.categories.${post.category}`)}</span>
              </div>
              <div className="text-muted small mb-3">
                {t('forum.author')}: {post.author?.name || '—'} · {formatDateTime(post.createdAt)}
              </div>
              {post.isHidden && (
                <div className="alert alert-warning py-2">{t('forum.hidden')}</div>
              )}
              <p className="break-word" style={{ whiteSpace: 'pre-wrap' }}>
                {post.content}
              </p>

              <div className="d-flex flex-wrap gap-2 mt-3">
                {canEdit && (
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setEditing(true)}>
                    {t('common.edit')}
                  </button>
                )}
                {isAdmin && (
                  <button type="button" className="btn btn-sm btn-outline-warning" onClick={moderate}>
                    {post.isHidden ? t('forum.restore') : t('forum.hide')}
                  </button>
                )}
                {canEdit && (
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={deletePost}>
                    {t('common.delete')}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          {t('common.comments')} ({post.comments?.length || 0})
        </div>
        <div className="card-body">
          {(!post.comments || post.comments.length === 0) && (
            <p className="text-muted small">{t('common.noData')}</p>
          )}

          <ul className="list-plain">
            {(post.comments || []).map((comment) => {
              const commentAuthorId = comment.author?._id || comment.author;
              const canDelete = isAdmin || isAuthor || String(commentAuthorId) === String(user._id);
              return (
                <li key={comment._id} className="border-bottom py-3">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <div className="small fw-semibold">
                        {comment.author?.name || '—'}
                        {comment.author?.role === 'admin' && (
                          <span className="badge badge-soft ms-2">{t('consultations.expert')}</span>
                        )}
                      </div>
                      <div className="small text-muted">{formatDate(comment.createdAt)}</div>
                    </div>
                    {canDelete && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => deleteComment(comment._id)}
                      >
                        {t('forum.deleteComment')}
                      </button>
                    )}
                  </div>
                  <p className="mb-0 mt-2 break-word">{comment.content}</p>
                </li>
              );
            })}
          </ul>

          <form onSubmit={addComment} className="mt-3">
            <label className="form-label" htmlFor="new-comment">
              {t('forum.addComment')}
            </label>
            <textarea
              id="new-comment"
              className="form-control"
              rows="2"
              maxLength={1000}
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder={t('forum.commentPlaceholder')}
            />
            <button type="submit" className="btn btn-agri mt-2" disabled={!commentText.trim()}>
              {t('forum.addComment')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
