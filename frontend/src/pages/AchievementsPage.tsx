import { Award, CircleHelp } from 'lucide-react';
import { useEffect, useState } from 'react';

import AchievementGrid from '../components/gamification/AchievementGrid';
import {
  formatDate,
  getAchievementIcon,
} from '../components/gamification/achievementUtils';
import LevelProgressCard from '../components/gamification/LevelProgressCard';
import NextAchievementCard from '../components/gamification/NextAchievementCard';
import PointHistory from '../components/gamification/PointHistory';
import {
  ApiError,
  getGamification,
  type GamificationSummary,
} from '../lib/api';

function toTime(value: string | null): number {
  return value ? new Date(value).getTime() : 0;
}

export default function AchievementsPage() {
  const [data, setData] = useState<GamificationSummary | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [attempt, setAttempt] = useState(0);

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
  }, [attempt]);

  if (loading) {
    return (
      <div className="page">
        <div className="page-loading" aria-busy="true">
          <Award size={24} aria-hidden="true" />
          <span>Carregando suas conquistas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="page-error" role="alert">
          <CircleHelp size={24} aria-hidden="true" />

          <div>
            <h2>Não foi possível carregar a gamificação</h2>
            <p>{error}</p>
          </div>

          <button
            type="button"
            className="button button-secondary"
            onClick={() => setAttempt((current) => current + 1)}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page">
        <div className="page-empty">
          <Award size={28} aria-hidden="true" />
          <h2>Nenhum dado de gamificação</h2>
          <p>Ainda não existem informações de gamificação para este usuário.</p>
        </div>
      </div>
    );
  }

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
            Acompanhe sua evolução acadêmica, seu progresso em cada conquista e
            a próxima meta a alcançar.
          </p>
        </div>
      </header>

      <div className="gamification-overview">
        <LevelProgressCard
          level={data.level}
          totalPoints={data.totalPoints}
          pointsInCurrentLevel={data.pointsInCurrentLevel}
          pointsToNextLevel={data.pointsToNextLevel}
        />

        <div className="gamification-stat-card">
          <div className="stat-icon">
            <Award size={24} aria-hidden="true" />
          </div>

          <span>Conquistas</span>

          <strong>
            {unlockedCount} / {data.achievements.length}
          </strong>

          <small>desbloqueadas</small>

          <small>{data.totalPointEvents} atividades registradas</small>
        </div>
      </div>

      {data.nextAchievement && (
        <section className="next-achievement-section">
          <NextAchievementCard achievement={data.nextAchievement} />
        </section>
      )}

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
                    <Icon size={24} aria-hidden="true" />
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

        <AchievementGrid achievements={data.achievements} />
      </section>

      <PointHistory />
    </div>
  );
}
