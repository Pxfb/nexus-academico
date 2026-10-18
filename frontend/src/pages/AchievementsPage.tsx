import {
  Award,
  Check,
  CircleHelp,
  Footprints,
  GraduationCap,
  Lock,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import PointHistory from '../components/gamification/PointHistory';
import {
  ApiError,
  getGamification,
  type Achievement,
  type GamificationSummary,
} from '../lib/api';

function getAchievementIcon(icon: string) {
  switch (icon) {
    case 'footprints':
      return Footprints;

    case 'sparkles':
      return Sparkles;

    case 'graduation-cap':
      return GraduationCap;

    case 'trophy':
      return Trophy;

    default:
      return Award;
  }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function toTime(value: string | null): number {
  return value ? new Date(value).getTime() : 0;
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const Icon = getAchievementIcon(achievement.icon);

  return (
    <article
      className={`achievement-card ${
        achievement.unlocked
          ? 'achievement-card-unlocked'
          : 'achievement-card-locked'
      }`}
    >
      <div className="achievement-icon">
        {achievement.unlocked ? <Icon size={26} /> : <Lock size={22} />}
      </div>

      <div className="achievement-content">
        <div className="achievement-heading">
          <h3>{achievement.title}</h3>

          {achievement.unlocked && (
            <span className="achievement-status">
              <Check size={14} />
              Desbloqueada
            </span>
          )}
        </div>

        <p>{achievement.description}</p>

        <div className="achievement-footer">
          <span className="achievement-points">+{achievement.points} pts</span>

          {achievement.unlocked && achievement.unlockedAt ? (
            <span>Desbloqueada em {formatDate(achievement.unlockedAt)}</span>
          ) : (
            <span>Requer {achievement.requirementValue} pts</span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function AchievementsPage() {
  const [data, setData] = useState<GamificationSummary | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadGamification() {
      try {
        setLoading(true);
        setError(null);

        const result = await getGamification();

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
          setError('Não foi possível carregar suas conquistas.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadGamification();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="page-loading">
          <Award size={24} />
          <span>Carregando suas conquistas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="page-error">
          <CircleHelp size={24} />

          <div>
            <h2>Não foi possível carregar a gamificação</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page">
        <div className="page-empty">
          <Award size={28} />
          <h2>Nenhum dado de gamificação</h2>
          <p>Ainda não existem informações de gamificação para este usuário.</p>
        </div>
      </div>
    );
  }

  const progressPercentage = data.pointsInCurrentLevel;

  const unlockedCount = data.achievements.filter(
    (achievement) => achievement.unlocked,
  ).length;

  const recentAchievements = data.achievements
    .filter((achievement) => achievement.unlocked && achievement.unlockedAt)
    .sort(
      (a, b) =>
        toTime(b.unlockedAt) - toTime(a.unlockedAt) ||
        b.requirementValue - a.requirementValue,
    )
    .slice(0, 3);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Gamificação</p>

          <h1 className="page-title">Conquistas</h1>

          <p className="page-description">
            Acompanhe sua evolução acadêmica e suas conquistas.
          </p>
        </div>
      </header>

      <div className="gamification-overview">
        <div className="level-card">
          <div className="level-card-top">
            <div className="level-icon">
              <Trophy size={28} />
            </div>

            <div>
              <span className="level-label">Nível atual</span>

              <strong>Nível {data.level}</strong>
            </div>
          </div>

          <div className="level-points">
            <span>{data.totalPoints}</span>
            <small>pontos</small>
          </div>

          <div className="level-progress">
            <div className="level-progress-track">
              <div
                className="level-progress-value"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="level-progress-labels">
              <span>{data.pointsInCurrentLevel} / 100</span>

              <span>{data.pointsToNextLevel} pts para o próximo nível</span>
            </div>
          </div>
        </div>

        <div className="gamification-stat-card">
          <div className="stat-icon">
            <Award size={24} />
          </div>

          <span>Conquistas</span>

          <strong>
            {unlockedCount} / {data.achievements.length}
          </strong>

          <small>desbloqueadas</small>

          <small>{data.totalPointEvents} atividades registradas</small>
        </div>
      </div>

      {recentAchievements.length > 0 && (
        <section className="recent-achievements-section">
          <div className="section-heading">
            <div>
              <h2>Conquistas recentes</h2>

              <p>Suas últimas conquistas desbloqueadas.</p>
            </div>
          </div>

          <div className="recent-achievements-grid">
            {recentAchievements.map((achievement) => {
              const Icon = getAchievementIcon(achievement.icon);

              return (
                <article
                  className="recent-achievement-card"
                  key={achievement.id}
                >
                  <div className="recent-achievement-icon">
                    <Icon size={24} />
                  </div>

                  <div>
                    <strong>{achievement.title}</strong>

                    <span>+{achievement.points} pts</span>

                    {achievement.unlockedAt && (
                      <small>{formatDate(achievement.unlockedAt)}</small>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="achievements-section">
        <div className="section-heading">
          <div>
            <h2>Minhas conquistas</h2>

            <p>
              Continue participando das atividades para desbloquear novas
              conquistas.
            </p>
          </div>
        </div>

        {data.achievements.length === 0 ? (
          <div className="page-empty">
            <Award size={28} />

            <h2>Nenhuma conquista cadastrada</h2>

            <p>O catálogo de conquistas ainda está vazio.</p>
          </div>
        ) : (
          <div className="achievements-grid">
            {data.achievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        )}
      </section>

      <PointHistory />
    </div>
  );
}
