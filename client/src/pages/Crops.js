import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import PageHeader from '../components/PageHeader';
import Loader from '../components/Loader';
import ErrorAlert from '../components/ErrorAlert';
import AlertMessage from '../components/AlertMessage';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { formatDate, toInputDate } from '../utils/format';

const soilTypes = ['clay', 'sandy', 'loamy', 'silt', 'peaty', 'chalky', 'other'];
const seasons = ['Kharif', 'Rabi', 'Zaid', 'All year'];
const statuses = ['planned', 'growing', 'harvested', 'failed'];

const emptyForm = {
  farm: '',
  name: '',
  season: 'Kharif',
  plantingDate: '',
  harvestDate: '',
  status: 'planned',
  ph: '',
  nitrogen: '',
  phosphorus: '',
  potassium: '',
  moisture: '',
  soilType: 'loamy'
};

export default function Crops() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [noteTexts, setNoteTexts] = useState({});
  const [filters, setFilters] = useState({
    farm: searchParams.get('farm') || '',
    status: ''
  });

  const loadFarms = useCallback(async () => {
    try {
      const { data } = await api.get('/farms', { params: { limit: 100 } });
      setFarms(data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  const loadCrops = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = { limit: 100 };
      if (filters.farm) params.farm = filters.farm;
      if (filters.status) params.status = filters.status;
      const { data } = await api.get('/crops', { params });
      setCrops(data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadFarms();
  }, [loadFarms]);

  useEffect(() => {
    loadCrops();
  }, [loadCrops]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(false);
  };

  const handleChange = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const startEdit = (crop) => {
    const soil = crop.soilHealth || {};
    setEditing(crop);
    setForm({
      farm: crop.farm?._id || crop.farm,
      name: crop.name,
      season: crop.season || 'Kharif',
      plantingDate: toInputDate(crop.plantingDate),
      harvestDate: toInputDate(crop.harvestDate),
      status: crop.status || 'planned',
      ph: soil.ph ?? '',
      nitrogen: soil.nitrogen ?? '',
      phosphorus: soil.phosphorus ?? '',
      potassium: soil.potassium ?? '',
      moisture: soil.moisture ?? '',
      soilType: soil.soilType || 'loamy'
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        farm: form.farm,
        name: form.name.trim(),
        season: form.season,
        plantingDate: form.plantingDate,
        status: form.status
      };
      if (form.harvestDate) payload.harvestDate = form.harvestDate;

      const soil = {};
      if (form.ph !== '') soil.ph = Number(form.ph);
      if (form.nitrogen !== '') soil.nitrogen = Number(form.nitrogen);
      if (form.phosphorus !== '') soil.phosphorus = Number(form.phosphorus);
      if (form.potassium !== '') soil.potassium = Number(form.potassium);
      if (form.moisture !== '') soil.moisture = Number(form.moisture);
      if (Object.keys(soil).length > 0) {
        soil.soilType = form.soilType;
        payload.soilHealth = soil;
      }

      if (editing) {
        await api.put(`/crops/${editing._id}`, payload);
        setSuccess(t('crops.updated'));
      } else {
        await api.post('/crops', payload);
        setSuccess(t('crops.created'));
      }
      resetForm();
      await loadCrops();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (crop) => {
    if (!window.confirm(t('common.confirmDelete'))) return;
    try {
      await api.delete(`/crops/${crop._id}`);
      setSuccess(t('crops.deleted'));
      await loadCrops();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const addNote = async (cropId) => {
    const note = (noteTexts[cropId] || '').trim();
    if (!note) return;
    try {
      await api.post(`/crops/${cropId}/notes`, { note });
      setNoteTexts((current) => ({ ...current, [cropId]: '' }));
      setSuccess(t('crops.noteAdded'));
      await loadCrops();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const canAdd = farms.length > 0;

  return (
    <div className="container">
      <PageHeader
        title={t('crops.title')}
        subtitle={t('crops.subtitle')}
        actions={
          <button
            type="button"
            className="btn btn-agri"
            disabled={!canAdd}
            onClick={() => {
              if (showForm) resetForm();
              else {
                setForm({ ...emptyForm, farm: filters.farm || '' });
                setEditing(null);
                setShowForm(true);
              }
            }}
          >
            {showForm ? t('common.cancel') : `+ ${t('crops.addCrop')}`}
          </button>
        }
      />

      <ErrorAlert message={error} onClose={() => setError('')} />
      <AlertMessage onClose={() => setSuccess('')}>{success}</AlertMessage>

      {!canAdd && (
        <div className="alert alert-warning">
          {t('farms.noFarms')}{' '}
          <Link to="/farms" className="alert-link">
            {t('farms.addFarm')}
          </Link>
        </div>
      )}

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">{editing ? t('crops.editCrop') : t('crops.addCrop')}</div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label" htmlFor="crop-farm">
                    {t('crops.farm')} *
                  </label>
                  <select
                    id="crop-farm"
                    className="form-select"
                    name="farm"
                    value={form.farm}
                    onChange={handleChange}
                    required
                  >
                    <option value="">{t('crops.selectFarm')}</option>
                    {farms.map((farm) => (
                      <option key={farm._id} value={farm._id}>
                        {farm.name} — {farm.location}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label" htmlFor="crop-name">
                    {t('crops.cropName')} *
                  </label>
                  <input
                    id="crop-name"
                    className="form-control"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    maxLength={80}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="crop-season">
                    {t('crops.season')}
                  </label>
                  <select
                    id="crop-season"
                    className="form-select"
                    name="season"
                    value={form.season}
                    onChange={handleChange}
                  >
                    {seasons.map((season) => (
                      <option key={season} value={season}>
                        {t(`crops.seasons.${season}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="crop-planting">
                    {t('crops.plantingDate')} *
                  </label>
                  <input
                    id="crop-planting"
                    className="form-control"
                    type="date"
                    name="plantingDate"
                    value={form.plantingDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="crop-harvest">
                    {t('crops.harvestDate')}
                  </label>
                  <input
                    id="crop-harvest"
                    className="form-control"
                    type="date"
                    name="harvestDate"
                    value={form.harvestDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="crop-status">
                    {t('crops.status')}
                  </label>
                  <select
                    id="crop-status"
                    className="form-select"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {t(`crops.statuses.${status}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <hr />
                  <h2 className="h6 text-muted">{t('crops.soilSnapshot')}</h2>
                </div>
                <div className="col-6 col-md-2">
                  <label className="form-label" htmlFor="crop-ph">
                    {t('crops.ph')}
                  </label>
                  <input
                    id="crop-ph"
                    className="form-control"
                    type="number"
                    min="0"
                    max="14"
                    step="0.1"
                    name="ph"
                    value={form.ph}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-6 col-md-2">
                  <label className="form-label" htmlFor="crop-n">
                    {t('crops.nitrogen')}
                  </label>
                  <input
                    id="crop-n"
                    className="form-control"
                    type="number"
                    min="0"
                    step="0.1"
                    name="nitrogen"
                    value={form.nitrogen}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-6 col-md-2">
                  <label className="form-label" htmlFor="crop-p">
                    {t('crops.phosphorus')}
                  </label>
                  <input
                    id="crop-p"
                    className="form-control"
                    type="number"
                    min="0"
                    step="0.1"
                    name="phosphorus"
                    value={form.phosphorus}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-6 col-md-2">
                  <label className="form-label" htmlFor="crop-k">
                    {t('crops.potassium')}
                  </label>
                  <input
                    id="crop-k"
                    className="form-control"
                    type="number"
                    min="0"
                    step="0.1"
                    name="potassium"
                    value={form.potassium}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-6 col-md-2">
                  <label className="form-label" htmlFor="crop-moisture">
                    {t('crops.moisture')}
                  </label>
                  <input
                    id="crop-moisture"
                    className="form-control"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    name="moisture"
                    value={form.moisture}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-6 col-md-2">
                  <label className="form-label" htmlFor="crop-soil">
                    {t('common.soilType')}
                  </label>
                  <select
                    id="crop-soil"
                    className="form-select"
                    name="soilType"
                    value={form.soilType}
                    onChange={handleChange}
                  >
                    {soilTypes.map((type) => (
                      <option key={type} value={type}>
                        {t(`common.soilTypes.${type}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="d-flex gap-2 mt-4">
                <button type="submit" className="btn btn-agri" disabled={saving}>
                  {saving ? t('common.loading') : t('common.save')}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-5">
              <label className="form-label" htmlFor="filter-farm">
                {t('crops.farm')}
              </label>
              <select
                id="filter-farm"
                className="form-select"
                value={filters.farm}
                onChange={(event) => setFilters((current) => ({ ...current, farm: event.target.value }))}
              >
                <option value="">{t('crops.allFarms')}</option>
                {farms.map((farm) => (
                  <option key={farm._id} value={farm._id}>
                    {farm.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-5">
              <label className="form-label" htmlFor="filter-status">
                {t('crops.status')}
              </label>
              <select
                id="filter-status"
                className="form-select"
                value={filters.status}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="">{t('common.all')}</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {t(`crops.statuses.${status}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={() => setFilters({ farm: '', status: '' })}
              >
                {t('common.refresh')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : crops.length === 0 ? (
        <EmptyState message={t('crops.noCrops')} />
      ) : (
        <div className="row g-4">
          {crops.map((crop) => {
            const soil = crop.soilHealth || {};
            return (
              <div className="col-md-6" key={crop._id}>
                <div className="card h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <div>
                        <h2 className="h5 mb-1">{crop.name}</h2>
                        <small className="text-muted">
                          {crop.farm?.name || t('common.farm')} · {t(`crops.seasons.${crop.season}`)}
                        </small>
                      </div>
                      <StatusBadge status={crop.status} label={t(`crops.statuses.${crop.status}`)} />
                    </div>

                    <p className="small text-muted mb-2">
                      🌱 {t('crops.plantingDate')}: {formatDate(crop.plantingDate)}
                      {crop.harvestDate && ` · ${t('crops.harvestDate')}: ${formatDate(crop.harvestDate)}`}
                    </p>

                    {(soil.ph !== undefined || soil.moisture !== undefined) && (
                      <div className="d-flex flex-wrap gap-2 my-2">
                        {soil.ph !== undefined && <span className="badge badge-soft">pH {soil.ph}</span>}
                        {soil.nitrogen !== undefined && <span className="badge badge-soft">N {soil.nitrogen}</span>}
                        {soil.phosphorus !== undefined && <span className="badge badge-soft">P {soil.phosphorus}</span>}
                        {soil.potassium !== undefined && <span className="badge badge-soft">K {soil.potassium}</span>}
                        {soil.moisture !== undefined && (
                          <span className="badge badge-soft">{t('crops.moisture')} {soil.moisture}</span>
                        )}
                      </div>
                    )}

                    <details className="mt-2">
                      <summary className="text-muted small">
                        {t('crops.growthNotes')} ({crop.growthNotes?.length || 0})
                      </summary>
                      <ul className="list-plain mt-2">
                        {(crop.growthNotes || [])
                          .slice()
                          .reverse()
                          .map((note, index) => (
                            <li key={`${note.date}-${index}`} className="small border-bottom py-1">
                              <span className="text-muted me-2">{formatDate(note.date)}</span>
                              {note.note}
                            </li>
                          ))}
                        {(!crop.growthNotes || crop.growthNotes.length === 0) && (
                          <li className="small text-muted">{t('common.noData')}</li>
                        )}
                      </ul>
                      <div className="input-group input-group-sm mt-2">
                        <label className="visually-hidden" htmlFor={`note-${crop._id}`}>
                          {t('crops.notePlaceholder')}
                        </label>
                        <input
                          id={`note-${crop._id}`}
                          className="form-control"
                          value={noteTexts[crop._id] || ''}
                          onChange={(event) =>
                            setNoteTexts((current) => ({ ...current, [crop._id]: event.target.value }))
                          }
                          placeholder={t('crops.notePlaceholder')}
                          maxLength={1000}
                        />
                        <button type="button" className="btn btn-outline-agri" onClick={() => addNote(crop._id)}>
                          {t('crops.addNote')}
                        </button>
                      </div>
                    </details>
                  </div>

                  <div className="card-footer bg-transparent d-flex gap-2">
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => startEdit(crop)}>
                      {t('common.edit')}
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(crop)}>
                      {t('common.delete')}
                    </button>
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
