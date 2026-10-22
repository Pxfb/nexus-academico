import { Award } from 'lucide-react';
import { useState } from 'react';

import type { Achievement } from '../../lib/api';
import AchievementCard from './AchievementCard';

type AchievementGridProps = {
  achievements: Achievement[];
};

type Filter = 'all' | 'unlocked' | 'locked';

export default function AchievementGrid({
  achievements,
}: AchievementGridProps) {
  const [filter, setFilter] = useState<Filter>('all');

  const unlockedCount = achievements.filter(
    (achievement) => achievement.unlocked,
  ).length;

  const lockedCount = achievements.length - unlockedCount;

  const filters: { value: Filter; label: string; count: number }[] = [
    { value: 'all', label: 'Todas', count: achievements.length },
    { value: 'unlocked', label: 'Desbloqueadas', count: unlockedCount },
    { value: 'locked', label: 'Bloqueadas', count: lockedCount },
  ];

  const visible = achievements.filter((achievement) => {
    if (filter === 'unlocked') {
      return achievement.unlocked;
    }

    if (filter === 'locked') {
      return !achievement.unlocked;
    }

    return true;
  });

  if (achievements.length === 0) {
    return (
      <div className="page-empty">
        <Award size={28} aria-hidden="true" />

        <h2>Nenhuma conquista cadastrada</h2>

        <p>O catálogo de conquistas ainda está vazio.</p>
      </div>
    );
  }

  return (
    <div>
      <div
        className="filter-group"
        role="group"
        aria-label="Filtrar conquistas"
      >
        {filters.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`filter-chip ${filter === option.value ? 'active' : ''}`}
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value)}
          >
            {option.label} ({option.count})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="page-empty">
          <Award size={28} aria-hidden="true" />

          <h2>Nenhuma conquista neste filtro</h2>

          <p>Escolha outro filtro para ver as demais conquistas.</p>
        </div>
      ) : (
        <div className="achievements-grid">
          {visible.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      )}
    </div>
  );
}
