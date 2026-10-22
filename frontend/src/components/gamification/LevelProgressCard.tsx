import { Trophy } from 'lucide-react';

type LevelProgressCardProps = {
  level: number;
  totalPoints: number;
  pointsInCurrentLevel: number;
  pointsToNextLevel: number;
};

export default function LevelProgressCard({
  level,
  totalPoints,
  pointsInCurrentLevel,
  pointsToNextLevel,
}: LevelProgressCardProps) {
  return (
    <div className="level-card">
      <div className="level-card-top">
        <div className="level-icon">
          <Trophy size={28} aria-hidden="true" />
        </div>

        <div>
          <span className="level-label">Nível atual</span>

          <strong>Nível {level}</strong>
        </div>
      </div>

      <div className="level-points">
        <span>{totalPoints}</span>
        <small>pontos</small>
      </div>

      <div className="level-progress">
        <div
          className="level-progress-track"
          role="progressbar"
          aria-label="Progresso para o próximo nível"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pointsInCurrentLevel}
        >
          <div
            className="level-progress-value"
            style={{ width: `${pointsInCurrentLevel}%` }}
          />
        </div>

        <div className="level-progress-labels">
          <span>{pointsInCurrentLevel} / 100</span>

          <span>{pointsToNextLevel} pts para o próximo nível</span>
        </div>
      </div>
    </div>
  );
}
