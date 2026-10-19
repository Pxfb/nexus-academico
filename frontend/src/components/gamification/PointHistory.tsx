import {
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ListChecks,
  Sparkles,
  Video,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router';

import {
  ApiError,
  getPointEventHistory,
  type PointEventPage,
} from '../../lib/api';
import { Badge } from '../ui/Badge';

type PointHistoryProps = {
  fullHistory?: boolean;
};

const EVENT_TYPES: Record<string, { label: string; icon: LucideIcon }> = {
  demo: { label: 'Demonstração', icon: Sparkles },
  task_completed: { label: 'Tarefa', icon: CheckCircle2 },
  meeting_attended: { label: 'Reunião', icon: Video },
  scrum_completed: { label: 'Scrum', icon: ListChecks },
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'demo', label: 'Demonstração' },
  { value: 'task_completed', label: 'Tarefas' },
  { value: 'meeting_attended', label: 'Reuniões' },
  { value: 'scrum_completed', label: 'Scrum' },
];

function getEventType(eventType: string) {
  return (
    EVENT_TYPES[eventType] ?? {
      label: 'Outros',
      icon: ArrowUp,
    }
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function PointHistory({
  fullHistory = false,
}: PointHistoryProps) {
  const pageSize = fullHistory ? 10 : 5;
  const filterId = useId();

  const [data, setData] = useState<PointEventPage | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      try {
        setLoading(true);
        setError(null);

        const result = await getPointEventHistory(
          page,
          pageSize,
          filter === 'all' ? undefined : filter,
        );

        if (active) {
          setData(result);
        }
      } catch (requestError) {
        if (!active) {
          return;
        }

        if (requestError instanceof ApiError) {
          setError(requestError.message);
        } else {
          setError('Não foi possível carregar o histórico.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      active = false;
    };
  }, [page, pageSize, filter, attempt]);

  const hasItems = !loading && !error && data && data.items.length > 0;

  const isEmpty = !loading && !error && data && data.items.length === 0;

  return (
    <section className="history-section">
      <div className="section-heading history-heading">
        <div>
          <h2>{fullHistory ? 'Histórico de pontos' : 'Atividade recente'}</h2>

          <p>Acompanhe como seus pontos foram conquistados.</p>
        </div>

        {!fullHistory && (
          <Link className="history-view-all" to="/historico-pontos">
            Ver histórico completo
          </Link>
        )}
      </div>

      {fullHistory && (
        <div className="history-filters">
          <label htmlFor={filterId}>Filtrar atividade</label>

          <select
            id={filterId}
            value={filter}
            onChange={(event) => {
              setPage(1);
              setFilter(event.target.value);
            }}
          >
            {FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading && (
        <div
          className="history-skeleton-list"
          aria-busy="true"
          aria-label="Carregando histórico"
        >
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="history-skeleton-item" key={index}>
              <span className="history-skeleton-icon" />
              <span className="history-skeleton-content" />
              <span className="history-skeleton-points" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="history-state history-error" role="alert">
          <CircleHelp size={24} />

          <div>
            <strong>Não foi possível carregar o histórico</strong>

            <p>{error}</p>

            <button
              type="button"
              className="button button-secondary"
              onClick={() => setAttempt((current) => current + 1)}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {isEmpty && (
        <div className="history-state history-empty">
          <CheckCircle2 size={28} />

          <strong>
            {filter === 'all'
              ? 'Nenhuma atividade ainda'
              : 'Nenhuma atividade deste tipo'}
          </strong>

          <p>
            {filter === 'all'
              ? 'Quando você conquistar pontos, eles aparecerão aqui.'
              : 'Escolha outro filtro para ver as demais atividades.'}
          </p>
        </div>
      )}

      {hasItems && data && (
        <ul className="history-list">
          {data.items.map((event) => {
            const type = getEventType(event.eventType);
            const Icon = type.icon;

            return (
              <li className="history-item" key={event.id}>
                <div className="history-item-icon">
                  <Icon size={20} />
                </div>

                <div className="history-item-content">
                  <strong>{event.description}</strong>

                  <div className="history-item-meta">
                    <Badge>{type.label}</Badge>

                    <span>
                      {formatDate(event.createdAt)} às{' '}
                      {formatTime(event.createdAt)}
                    </span>
                  </div>
                </div>

                <strong className="history-item-points">
                  +{event.points} pts
                </strong>
              </li>
            );
          })}
        </ul>
      )}

      {fullHistory && data && data.totalPages > 1 && !error && (
        <nav
          className="history-pagination"
          aria-label="Paginação do histórico de pontos"
        >
          <button
            type="button"
            className="button button-secondary"
            aria-label="Ir para a página anterior"
            disabled={loading || page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            <ChevronLeft size={18} />
            Anterior
          </button>

          <span>
            Página {data.page} de {data.totalPages} · {data.total} atividades
          </span>

          <button
            type="button"
            className="button button-secondary"
            aria-label="Ir para a próxima página"
            disabled={loading || page >= data.totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Próxima
            <ChevronRight size={18} />
          </button>
        </nav>
      )}
    </section>
  );
}
