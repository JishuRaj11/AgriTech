import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import PageHeader from '../components/PageHeader';
import Loader from '../components/Loader';
import ErrorAlert from '../components/ErrorAlert';
import AlertMessage from '../components/AlertMessage';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/format';

export default function Consultations() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [consultations, setConsultations] = useState([]);
  const [form, setForm] = useState({ question: '', crop: '' });
  const [replies, setReplies] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isAdmin = user.role === 'admin';

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/consultations', { params: { limit: 100 } });
      setConsultations(data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submitQuestion = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/consultations', {
        question: form.question.trim(),
        crop: form.crop.trim()
      });
      setForm({ question: '', crop: '' });
      setSuccess(t('consultations.submitted'));
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const submitReply = async (id) => {
    const reply = (replies[id] || '').trim();
    if (!reply) return;
    try {
      await api.patch(`/consultations/${id}/reply`, { reply });
      setReplies((current) => ({ ...current, [id]: '' }));
      setSuccess(t('consultations.replied'));
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const remove = async (id) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    try {
      await api.delete(`/consultations/${id}`);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="container">
      <PageHeader title={t('consultations.title')} subtitle={t('consultations.subtitle')} />

      <ErrorAlert message={error} onClose={() => setError('')} />
      <AlertMessage onClose={() => setSuccess('')}>{success}</AlertMessage>

      {!isAdmin && (
        <div className="card mb-4">
          <div className="card-header">{t('consultations.askTitle')}</div>
          <div className="card-body">
            <form onSubmit={submitQuestion}>
              <div className="mb-3">
                <label className="form-label" htmlFor="consultation-question">
                  {t('consultations.questionLabel')} *
                </label>
                <textarea
                  id="consultation-question"
                  className="form-control"
                  rows="3"
                  maxLength={2000}
                  value={form.question}
                  onChange={(event) => setForm((current) => ({ ...current, question: event.target.value }))}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="consultation-crop">
                  {t('consultations.cropLabel')}
                </label>
                <input
                  id="consultation-crop"
                  className="form-control"
                  value={form.crop}
                  onChange={(event) => setForm((current) => ({ ...current, crop: event.target.value }))}
                  maxLength={80}
                />
              </div>
              <button type="submit" className="btn btn-agri" disabled={saving}>
                {saving ? t('common.loading') : t('consultations.submitQuestion')}
              </button>
            </form>
          </div>
        </div>
      )}

      <h2 className="h5 mb-3">{isAdmin ? t('consultations.allQuestions') : t('consultations.myQuestions')}</h2>

      {loading ? (
        <Loader />
      ) : consultations.length === 0 ? (
        <EmptyState message={t('consultations.noQuestions')} icon="💬" />
      ) : (
        <div className="row g-4">
          {consultations.map((item) => (
            <div className="col-lg-6" key={item._id}>
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center gap-2">
                  <span className="small text-muted">{formatDate(item.createdAt)}</span>
                  <StatusBadge status={item.status} label={t(`consultations.statuses.${item.status}`)} />
                </div>
                <div className="card-body">
                  {isAdmin && item.farmer && (
                    <p className="small text-muted mb-1">
                      👤 {item.farmer.name} ({item.farmer.email})
                    </p>
                  )}
                  {item.crop && <span className="badge badge-soft mb-2">🌱 {item.crop}</span>}
                  <p className="fw-semibold break-word">{item.question}</p>

                  {item.reply ? (
                    <div className="bg-light rounded-3 p-3">
                      <div className="small fw-semibold text-success">
                        {t('consultations.answerLabel')}
                        {item.repliedBy?.name ? ` · ${item.repliedBy.name}` : ''}
                      </div>
                      <p className="small mb-0 break-word">{item.reply}</p>
                    </div>
                  ) : (
                    <p className="text-muted small mb-0">{t('consultations.noReply')}</p>
                  )}

                  {isAdmin && (
                    <div className="mt-3">
                      <label className="form-label small" htmlFor={`reply-${item._id}`}>
                        {t('consultations.replyPlaceholder')}
                      </label>
                      <textarea
                        id={`reply-${item._id}`}
                        className="form-control"
                        rows="2"
                        maxLength={2000}
                        value={replies[item._id] || ''}
                        onChange={(event) =>
                          setReplies((current) => ({ ...current, [item._id]: event.target.value }))
                        }
                        placeholder={t('consultations.replyPlaceholder')}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-agri mt-2"
                        onClick={() => submitReply(item._id)}
                      >
                        {t('consultations.sendReply')}
                      </button>
                    </div>
                  )}
                </div>
                <div className="card-footer bg-transparent">
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => remove(item._id)}>
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
