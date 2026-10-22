-- Tutorial 05: progresso de conquistas por eventos

-- 1) Coluna que indica qual tipo de evento conta para o requisito
--    (usada quando requirement_type = 'events')
ALTER TABLE achievements
  ADD COLUMN IF NOT EXISTS requirement_event_type VARCHAR(60);

-- 2) Novas conquistas
INSERT INTO achievements (
  code,
  title,
  description,
  icon,
  points,
  requirement_type,
  requirement_value,
  requirement_event_type
)
VALUES
  (
    'primeira_tarefa',
    'Primeira tarefa',
    'Conclua sua primeira tarefa.',
    'check-circle',
    100,
    'events',
    1,
    'task_completed'
  ),
  (
    'jogador_de_equipe',
    'Jogador de equipe',
    'Participe de cinco reuniões.',
    'users',
    150,
    'events',
    5,
    'meeting_attended'
  ),
  (
    'explorador',
    'Explorador',
    'Alcance 1.000 pontos de experiência.',
    'compass',
    300,
    'points',
    1000,
    NULL
  )
ON CONFLICT (code) DO NOTHING;

-- 3) Backfill: libera as conquistas que usuários existentes já cumprem
INSERT INTO user_achievements (user_id, achievement_id)
SELECT gp.user_id, a.id
FROM gamification_profiles gp
CROSS JOIN achievements a
WHERE
  (
    a.requirement_type = 'points'
    AND a.requirement_value <= gp.total_points
  )
  OR
  (
    a.requirement_type = 'events'
    AND a.requirement_event_type IS NOT NULL
    AND a.requirement_value <= (
      SELECT COUNT(*)
      FROM point_events pe
      WHERE pe.user_id = gp.user_id
        AND pe.event_type = a.requirement_event_type
    )
  )
ON CONFLICT (user_id, achievement_id) DO NOTHING;