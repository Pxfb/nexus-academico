import { Check, Lock } from 'lucide-react';

import type { Achievement } from '../../lib/api';
import {
  formatDate,
  formatRequirement,
  getAchievementIcon,
} from './achievementUtils';

type AchievementCardProps = {
  achievement: Achievement;
};

export default function AchievementCard({ achievement }: AchievementCardProps) {
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
        {achievement.unlocked ? (
          <Icon size={26} aria-hidden="true" />
        ) : (
          <Lock size={22} aria-hidden="true" />
        )}
      </div>

      <div className="achievement-content">
        <div className="achievement-heading">
          <h3>{achievement.title}</h3>

          {achievement.unlocked && (
            <span className="achievement-status">
              <Check size={14} aria-hidden="true" />
              Desbloqueada
            </span>
          )}
        </div>

        <p>{achievement.description}</p>

        {!achievement.unlocked && (
          <div className="achievement-progress">
            <div
              className="achievement-progress-track"
              role="progressbar"
              aria-label={`Progresso da conquista ${achievement.title}`}
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
              {achievement.currentValue} / {achievement.requirementValue}
            </span>
          </div>
        )}

        <div className="achievement-footer">
          <span className="achievement-points">+{achievement.points} pts</span>

          {achievement.unlocked && achievement.unlockedAt ? (
            <span>Desbloqueada em {formatDate(achievement.unlockedAt)}</span>
          ) : (
            <span>
              Requer{' '}
              {formatRequirement(
                achievement.requirementType,
                achievement.requirementValue,
              )}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
