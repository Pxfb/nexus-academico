import type { Achievement } from '../../lib/api';
import { formatRequirement, getAchievementIcon } from './achievementUtils';

type NextAchievementCardProps = {
  achievement: Achievement;
};

export default function NextAchievementCard({
  achievement,
}: NextAchievementCardProps) {
  const Icon = getAchievementIcon(achievement.icon);

  const remaining = Math.max(
    achievement.requirementValue - achievement.currentValue,
    0,
  );

  return (
    <article className="next-achievement">
      <div className="next-achievement-icon">
        <Icon size={26} aria-hidden="true" />
      </div>

      <div className="next-achievement-content">
        <span className="next-achievement-label">Próxima conquista</span>

        <h3>{achievement.title}</h3>

        <p>{achievement.description}</p>

        <div
          className="achievement-progress-track"
          role="progressbar"
          aria-label={`Progresso para ${achievement.title}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={achievement.progressPercent}
        >
          <div
            className="achievement-progress-value"
            style={{ width: `${achievement.progressPercent}%` }}
          />
        </div>

        <span className="achievement-progress-label">
          {achievement.currentValue} / {achievement.requirementValue} · faltam{' '}
          {formatRequirement(achievement.requirementType, remaining)}
        </span>
      </div>
    </article>
  );
}
