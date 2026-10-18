import {
  Award,
  Check,
  CircleAlert,
  Footprints,
  GraduationCap,
  Lock,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
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

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const Icon = getAchievementIcon(achievement.icon);

  return (
    <article
      className={`gm-achievement ${
        achievement.unlocked
          ? 'gm-achievement-unlocked'
          : 'gm-achievement-locked'
      }`}
    >
      <div className="gm-achievement-icon">
        {achievement.unlocked ? <Icon size={24} /> : <Lock size={22} />}
      </div>

      <div className="gm-achievement-content">
        <div className="gm-achievement-heading">
          <h3>{achievement.title}</h3>

          {achievement.unlocked ? (
            <Badge variant="success">
              <Check size={12} />
              &nbsp;Desbloqueada
            </Badge>
          ) : (
            <Badge>Bloqueada</Badge>
          )}
        </div>

        <p>{achievement.description}</p>

        <div className="gm-achievement-footer">
          <span className="gm-achievement-points">
            +{achievement.points} pts de bônus
          </span>

          {achievement.unlocked && achievement.unlockedAt ? (
            <span>em {formatDate(achievement.unlockedAt)}</span>
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

    async function load() {
      try {
        const result = await getGamification();

        if (active) {
          setData(result);
        }
      } catch (requestError) {
        if (!active) {
          return;
        }

        setError(
          requestError instanceof ApiError
            ? requestError.message
            : 'Não foi possível carregar suas conquistas.',
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
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="gm-state" role="status">
          <Award size={24} />
          <span>Carregando suas conquistas...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page">
        <div className="gm-state" role="alert">
          <CircleAlert size={26} />
          <h2>Não foi possível carregar a gamificação</h2>
          <p>{error ?? 'Tente novamente em instantes.'}</p>
        </div>
      </div>
    );
  }

  const progressPercentage = Math.round(
    (data.pointsInCurrentLevel / data.pointsPerLevel) * 100,
  );

  const unlockedCount = data.achievements.filter(
    (achievement) => achievement.unlocked,
  ).length;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Gamificação</p>

          <h1 className="page-title">Conquistas</h1>

          <p className="page-description">
            Acompanhe sua evolução acadêmica, seus pontos e as conquistas que
            você já desbloqueou.
          </p>
        </div>
      </header>

      <div className="gm-overview">
        <Card className="gm-level-card">
          <div className="gm-level-top">
            <span className="stat-icon">
              <Trophy size={20} />
            </span>

            <div>
              <span className="gm-muted">Nível atual</span>
              <strong className="gm-level-name">Nível {data.level}</strong>
            </div>
          </div>

          <p className="gm-points">
            {data.totalPoints.toLocaleString('pt-BR')}
            <small>pontos</small>
          </p>

          <div
            className="progress"
            role="progressbar"
            aria-label="Progresso para o próximo nível"
            aria-valuemin={0}
            aria-valuemax={data.pointsPerLevel}
            aria-valuenow={data.pointsInCurrentLevel}
          >
            <div
              className="progress-value"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="gm-progress-labels">
            <span>
              {data.pointsInCurrentLevel} / {data.pointsPerLevel}
            </span>

            <span>{data.pointsToNextLevel} pts para o próximo nível</span>
          </div>
        </Card>

        <Card className="gm-summary-card">
          <span className="stat-icon">
            <Award size={20} />
          </span>

          <span className="gm-muted">Conquistas</span>

          <strong className="gm-summary-value">
            {unlockedCount} / {data.achievements.length}
          </strong>

          <span className="gm-muted">desbloqueadas</span>
        </Card>
      </div>

      <section aria-labelledby="achievements-title">
        <div className="gm-section-heading">
          <h2 id="achievements-title">Minhas conquistas</h2>

          <p>
            Continue participando das atividades para desbloquear novas
            conquistas.
          </p>
        </div>

        {data.achievements.length === 0 ? (
          <div className="gm-state">
            <Award size={26} />
            <h2>Nenhuma conquista cadastrada</h2>
            <p>O catálogo de conquistas ainda está vazio.</p>
          </div>
        ) : (
          <div className="gm-achievements-grid">
            {data.achievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
