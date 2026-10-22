import { CalendarDays, CheckCircle2, Clock3, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import { useAuth } from '../auth/AuthContext';
import { ApiStatus } from '../components/ui/ApiStatus';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import {
  getGamification,
  getPointEventHistory,
  type GamificationSummary,
  type PointEventPage,
} from '../lib/api';

const tasks = [
  {
    title: 'Entrega do relatório da disciplina',
    meta: 'Hoje • 18:00',
    status: 'Pendente',
  },
  {
    title: 'Preparar apresentação da equipe',
    meta: 'Amanhã • 14:00',
    status: 'Em andamento',
  },
  {
    title: 'Revisar material da aula',
    meta: 'Sexta-feira',
    status: 'Planejada',
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  const [gamification, setGamification] = useState<GamificationSummary | null>(
    null,
  );

  const [recentPoints, setRecentPoints] = useState<PointEventPage | null>(null);

  useEffect(() => {
    let active = true;

    getGamification()
      .then((result) => {
        if (active) {
          setGamification(result);
        }
      })
      .catch((error) => {
        console.error('Não foi possível carregar a gamificação:', error);
      });

    getPointEventHistory(1, 3)
      .then((result) => {
        if (active) {
          setRecentPoints(result);
        }
      })
      .catch((error) => {
        console.error('Não foi possível carregar os pontos recentes:', error);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Visão geral</p>

          <h1 className="page-title">
            Olá, {user?.fullName ?? 'estudante'} 👋
          </h1>

          <p className="page-description">
            Acompanhe suas atividades acadêmicas, compromissos e progresso em um
            único espaço.
          </p>
        </div>

        <Link to="/tarefas" className="button button-primary">
          Ver tarefas
        </Link>
      </header>

      <div className="stats-grid">
        <StatCard label="Tarefas pendentes" value="6" icon={CheckCircle2} />

        <StatCard label="Próxima reunião" value="14:00" icon={Clock3} />

        <StatCard
          label="Atividades da semana"
          value="78%"
          icon={CalendarDays}
        />

        <StatCard
          label="Pontos"
          value={
            gamification
              ? gamification.totalPoints.toLocaleString('pt-BR')
              : '—'
          }
          icon={Trophy}
        />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-column">
          <Card>
            <div className="card-header">
              <div>
                <h2 className="card-title">Próximas tarefas</h2>

                <p className="card-subtitle">
                  Atividades que precisam da sua atenção
                </p>
              </div>

              <Link to="/tarefas" className="text-link">
                Ver todas
              </Link>
            </div>

            <ul className="task-list">
              {tasks.map((task) => (
                <li className="task-row" key={task.title}>
                  <span className="task-check" />

                  <div className="task-content">
                    <p className="task-title">{task.title}</p>

                    <p className="task-meta">{task.meta}</p>
                  </div>

                  <Badge
                    variant={
                      task.status === 'Em andamento' ? 'warning' : 'default'
                    }
                  >
                    {task.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="card-header">
              <div>
                <h2 className="card-title">Progresso semanal</h2>

                <p className="card-subtitle">Acompanhamento das atividades</p>
              </div>
            </div>

            <div className="card-body">
              <div className="progress-info">
                <span className="progress-label">Atividades concluídas</span>

                <span className="progress-number">78%</span>
              </div>

              <div
                className="progress"
                aria-label="78% das atividades concluídas"
              >
                <div className="progress-value" style={{ width: '78%' }} />
              </div>
            </div>
          </Card>
        </div>

        <div className="dashboard-column">
          {gamification && (
            <Card>
              <div className="card-header">
                <div>
                  <h2 className="card-title">Nível {gamification.level}</h2>

                  <p className="card-subtitle">
                    {gamification.totalPoints} pontos acumulados
                  </p>
                </div>

                <Link to="/conquistas" className="text-link">
                  Ver conquistas
                </Link>
              </div>

              <div className="card-body">
                <div className="progress-info">
                  <span className="progress-label">Progresso do nível</span>

                  <span className="progress-number">
                    {gamification.pointsInCurrentLevel} / 100
                  </span>
                </div>

                <div
                  className="progress"
                  role="progressbar"
                  aria-label="Progresso para o próximo nível"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={gamification.pointsInCurrentLevel}
                >
                  <div
                    className="progress-value"
                    style={{
                      width: `${gamification.pointsInCurrentLevel}%`,
                    }}
                  />
                </div>

                <p className="card-subtitle dashboard-note">
                  Faltam {gamification.pointsToNextLevel} pontos para o próximo
                  nível.
                </p>
                {gamification.nextAchievement && (
                  <p className="card-subtitle dashboard-note">
                    Próxima conquista:{' '}
                    <strong>{gamification.nextAchievement.title}</strong> (
                    {gamification.nextAchievement.progressPercent}%)
                  </p>
                )}
              </div>
            </Card>
          )}

          {recentPoints && recentPoints.items.length > 0 && (
            <Card>
              <div className="card-header">
                <div>
                  <h2 className="card-title">Pontos recentes</h2>

                  <p className="card-subtitle">
                    Últimas atividades que geraram pontos
                  </p>
                </div>

                <Link to="/historico-pontos" className="text-link">
                  Ver histórico
                </Link>
              </div>

              <ul className="dashboard-mini-list">
                {recentPoints.items.map((event) => (
                  <li className="dashboard-mini-item" key={event.id}>
                    <span>{event.description}</span>

                    <strong>+{event.points}</strong>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <div className="card-header">
              <div>
                <h2 className="card-title">Agenda de hoje</h2>

                <p className="card-subtitle">Seus próximos compromissos</p>
              </div>
            </div>

            <div className="card-body">
              <div className="task-row">
                <div className="task-content">
                  <p className="task-title">Reunião da equipe</p>

                  <p className="task-meta">14:00 — Sala virtual</p>
                </div>

                <Badge variant="success">Hoje</Badge>
              </div>
            </div>
          </Card>

          <Card>
            <div className="card-header">
              <div>
                <h2 className="card-title">Sistema</h2>

                <p className="card-subtitle">Estado da infraestrutura</p>
              </div>
            </div>

            <div className="card-body">
              <ApiStatus />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
