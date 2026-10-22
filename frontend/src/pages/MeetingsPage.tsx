import {
  CalendarPlus,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MapPin,
  Pencil,
  Trash2,
  Video,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import MeetingForm from '../components/meetings/MeetingForm';
import {
  ApiError,
  attendMeeting,
  cancelMeeting,
  createMeeting,
  deleteMeeting,
  listMeetings,
  updateMeeting,
  type Meeting,
  type MeetingFilter,
  type MeetingInput,
} from '../lib/api';

const TABS: { value: MeetingFilter; label: string }[] = [
  { value: 'upcoming', label: 'Próximas' },
  { value: 'past', label: 'Passadas' },
  { value: 'all', label: 'Todas' },
];

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getStatus(meeting: Meeting): { label: string; tone: string } {
  if (meeting.status === 'cancelled') {
    return { label: 'Cancelada', tone: 'cancelled' };
  }

  if (meeting.attendedAt) {
    return { label: 'Realizada', tone: 'done' };
  }

  const start = new Date(meeting.scheduledAt).getTime();
  const end = start + meeting.durationMinutes * 60_000;
  const now = Date.now();

  if (now > end) {
    return { label: 'Aguardando confirmação', tone: 'pending' };
  }

  if (now >= start) {
    return { label: 'Em andamento', tone: 'live' };
  }

  return { label: 'Agendada', tone: 'scheduled' };
}

export default function MeetingsPage() {
  const [filter, setFilter] = useState<MeetingFilter>('upcoming');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Meeting | undefined>();
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const items = await listMeetings(filter);

        if (active) {
          setMeetings(items);
        }
      } catch (requestError) {
        if (!active) {
          return;
        }

        setError(
          requestError instanceof ApiError
            ? requestError.message
            : 'Não foi possível carregar as reuniões.',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [filter, attempt]);

  function reload() {
    setAttempt((current) => current + 1);
  }

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
    setNotice(null);
  }

  function openEdit(meeting: Meeting) {
    setEditing(meeting);
    setFormOpen(true);
    setNotice(null);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(undefined);
  }

  async function handleSave(input: MeetingInput) {
    if (editing) {
      await updateMeeting(editing.id, input);
      setNotice('Reunião atualizada.');
    } else {
      await createMeeting(input);
      setNotice('Reunião criada.');
    }

    closeForm();
    reload();
  }

  async function runAction(meeting: Meeting, action: () => Promise<void>) {
    try {
      setBusyId(meeting.id);
      setNotice(null);
      await action();
      reload();
    } catch (requestError) {
      setNotice(
        requestError instanceof ApiError
          ? requestError.message
          : 'Não foi possível concluir a ação.',
      );
    } finally {
      setBusyId(null);
    }
  }

  function handleAttend(meeting: Meeting) {
    return runAction(meeting, async () => {
      const result = await attendMeeting(meeting.id);

      setNotice(
        result.pointsAwarded > 0
          ? `Participação confirmada! +${result.pointsAwarded} pontos.`
          : 'Participação confirmada. Esta reunião foi cadastrada após o início, por isso não gerou pontos.',
      );
    });
  }

  function handleCancel(meeting: Meeting) {
    if (!window.confirm(`Cancelar a reunião "${meeting.title}"?`)) {
      return;
    }

    return runAction(meeting, async () => {
      await cancelMeeting(meeting.id);
      setNotice('Reunião cancelada.');
    });
  }

  function handleDelete(meeting: Meeting) {
    if (
      !window.confirm(
        `Excluir a reunião "${meeting.title}"? Esta ação não pode ser desfeita.`,
      )
    ) {
      return;
    }

    return runAction(meeting, async () => {
      await deleteMeeting(meeting.id);
      setNotice('Reunião excluída.');
    });
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Reuniões</p>

          <h1 className="page-title">Minhas reuniões</h1>

          <p className="page-description">
            Agende suas reuniões e confirme a participação depois que elas
            acontecerem. Participações confirmadas geram pontos.
          </p>
        </div>

        <button
          type="button"
          className="button button-primary"
          onClick={openCreate}
        >
          <CalendarPlus size={18} aria-hidden="true" />
          Nova reunião
        </button>
      </header>

      {notice && (
        <div className="meeting-notice" role="status">
          {notice}
        </div>
      )}

      {formOpen && (
        <MeetingForm
          initial={editing}
          onSubmit={handleSave}
          onCancel={closeForm}
        />
      )}

      <div className="filter-group" role="group" aria-label="Filtrar reuniões">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`filter-chip ${filter === tab.value ? 'active' : ''}`}
            aria-pressed={filter === tab.value}
            onClick={() => setFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="page-loading" aria-busy="true">
          <Video size={24} aria-hidden="true" />
          <span>Carregando reuniões...</span>
        </div>
      )}

      {!loading && error && (
        <div className="page-error" role="alert">
          <XCircle size={24} aria-hidden="true" />

          <div>
            <h2>Não foi possível carregar as reuniões</h2>
            <p>{error}</p>
          </div>

          <button
            type="button"
            className="button button-secondary"
            onClick={reload}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && meetings.length === 0 && (
        <div className="page-empty">
          <Video size={28} aria-hidden="true" />

          <h2>Nenhuma reunião aqui</h2>

          <p>
            {filter === 'upcoming'
              ? 'Você não tem reuniões próximas. Clique em "Nova reunião" para agendar.'
              : 'Nenhuma reunião encontrada neste filtro.'}
          </p>
        </div>
      )}

      {!loading && !error && meetings.length > 0 && (
        <ul className="meeting-list">
          {meetings.map((meeting) => {
            const status = getStatus(meeting);
            const busy = busyId === meeting.id;
            const started =
              new Date(meeting.scheduledAt).getTime() <= Date.now();
            const open = meeting.status === 'scheduled' && !meeting.attendedAt;

            return (
              <li className="meeting-item" key={meeting.id}>
                <div className="meeting-item-main">
                  <div className="meeting-item-heading">
                    <h3>{meeting.title}</h3>

                    <span
                      className={`meeting-status meeting-status-${status.tone}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <p className="meeting-meta">
                    <Clock3 size={14} aria-hidden="true" />
                    {formatDateTime(meeting.scheduledAt)} ·{' '}
                    {meeting.durationMinutes} min
                  </p>

                  {meeting.location && (
                    <p className="meeting-meta">
                      <MapPin size={14} aria-hidden="true" />
                      {meeting.location}
                    </p>
                  )}

                  {meeting.meetingUrl && (
                    <p className="meeting-meta">
                      <ExternalLink size={14} aria-hidden="true" />
                      <a
                        href={meeting.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Abrir link da reunião
                      </a>
                    </p>
                  )}

                  {meeting.description && (
                    <p className="meeting-description">{meeting.description}</p>
                  )}
                </div>

                <div className="meeting-actions">
                  {open && started && (
                    <button
                      type="button"
                      className="button button-primary"
                      disabled={busy}
                      onClick={() => handleAttend(meeting)}
                    >
                      <CheckCircle2 size={16} aria-hidden="true" />
                      Confirmar participação
                    </button>
                  )}

                  {open && (
                    <button
                      type="button"
                      className="button button-secondary"
                      disabled={busy}
                      onClick={() => openEdit(meeting)}
                    >
                      <Pencil size={16} aria-hidden="true" />
                      Editar
                    </button>
                  )}

                  {open && (
                    <button
                      type="button"
                      className="button button-secondary"
                      disabled={busy}
                      onClick={() => handleCancel(meeting)}
                    >
                      <XCircle size={16} aria-hidden="true" />
                      Cancelar
                    </button>
                  )}

                  <button
                    type="button"
                    className="button button-secondary"
                    disabled={busy}
                    onClick={() => handleDelete(meeting)}
                    aria-label={`Excluir reunião ${meeting.title}`}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    Excluir
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
