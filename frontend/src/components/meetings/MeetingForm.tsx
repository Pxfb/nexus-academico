import { useState, type FormEvent } from 'react';

import { ApiError, type Meeting, type MeetingInput } from '../../lib/api';

type MeetingFormProps = {
  initial?: Meeting;
  onSubmit: (input: MeetingInput) => Promise<void>;
  onCancel: () => void;
};

function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function MeetingForm({
  initial,
  onSubmit,
  onCancel,
}: MeetingFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [scheduledAt, setScheduledAt] = useState(
    initial ? toLocalInput(initial.scheduledAt) : '',
  );
  const [duration, setDuration] = useState(
    String(initial?.durationMinutes ?? 60),
  );
  const [location, setLocation] = useState(initial?.location ?? '');
  const [meetingUrl, setMeetingUrl] = useState(initial?.meetingUrl ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (title.trim().length < 2) {
      setError('Informe o título da reunião.');
      return;
    }

    if (!scheduledAt) {
      setError('Informe a data e a hora da reunião.');
      return;
    }

    const durationMinutes = Number(duration);

    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 5 ||
      durationMinutes > 480
    ) {
      setError('A duração deve ser de 5 a 480 minutos.');
      return;
    }

    try {
      setSaving(true);

      await onSubmit({
        title,
        description,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes,
        location,
        meetingUrl,
      });
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : 'Não foi possível salvar a reunião.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card meeting-form" onSubmit={handleSubmit}>
      <h2 className="card-title">
        {initial ? 'Editar reunião' : 'Nova reunião'}
      </h2>

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      <div className="field">
        <label htmlFor="meeting-title">Título</label>

        <input
          id="meeting-title"
          type="text"
          value={title}
          maxLength={160}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ex.: Planejamento da Sprint"
          disabled={saving}
        />
      </div>

      <div className="meeting-form-row">
        <div className="field">
          <label htmlFor="meeting-date">Data e hora</label>

          <input
            id="meeting-date"
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            disabled={saving}
          />
        </div>

        <div className="field">
          <label htmlFor="meeting-duration">Duração (minutos)</label>

          <input
            id="meeting-duration"
            type="number"
            min={5}
            max={480}
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            disabled={saving}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="meeting-location">Local (opcional)</label>

        <input
          id="meeting-location"
          type="text"
          value={location}
          maxLength={255}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Ex.: Sala 12 ou Sala virtual"
          disabled={saving}
        />
      </div>

      <div className="field">
        <label htmlFor="meeting-url">Link da reunião (opcional)</label>

        <input
          id="meeting-url"
          type="url"
          value={meetingUrl}
          maxLength={500}
          onChange={(event) => setMeetingUrl(event.target.value)}
          placeholder="https://..."
          disabled={saving}
        />
      </div>

      <div className="field">
        <label htmlFor="meeting-description">Descrição (opcional)</label>

        <textarea
          id="meeting-description"
          rows={3}
          value={description}
          maxLength={2000}
          onChange={(event) => setDescription(event.target.value)}
          disabled={saving}
        />
      </div>

      <div className="meeting-form-actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={onCancel}
          disabled={saving}
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="button button-primary"
          disabled={saving}
        >
          {saving ? 'Salvando...' : 'Salvar reunião'}
        </button>
      </div>
    </form>
  );
}
