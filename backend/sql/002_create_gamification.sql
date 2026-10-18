-- =========================================================
-- Gamificação (PB01.01)
-- =========================================================

CREATE TABLE IF NOT EXISTS gamification_profiles (
  user_id BIGINT PRIMARY KEY
    REFERENCES users(id)
    ON DELETE CASCADE,

  total_points INTEGER NOT NULL DEFAULT 0
    CHECK (total_points >= 0),

  level INTEGER NOT NULL DEFAULT 1
    CHECK (level >= 1),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS point_events (
  id BIGSERIAL PRIMARY KEY,

  user_id BIGINT NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,

  points INTEGER NOT NULL
    CHECK (points > 0),

  event_type VARCHAR(60) NOT NULL,

  description VARCHAR(255) NOT NULL,

  reference_type VARCHAR(60),
  reference_id VARCHAR(120),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_point_events_user_created
  ON point_events (user_id, created_at DESC);

-- Impede pontuar duas vezes pelo mesmo fato (ex.: a mesma tarefa).
-- Só vale quando o evento informa uma referência.
CREATE UNIQUE INDEX IF NOT EXISTS uq_point_events_reference
  ON point_events (user_id, event_type, reference_type, reference_id)
  WHERE reference_type IS NOT NULL
    AND reference_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS achievements (
  id BIGSERIAL PRIMARY KEY,

  code VARCHAR(60) NOT NULL UNIQUE,
  title VARCHAR(120) NOT NULL,
  description VARCHAR(255) NOT NULL,
  icon VARCHAR(40) NOT NULL,

  -- bônus de pontos recebido ao desbloquear
  points INTEGER NOT NULL
    CHECK (points >= 0),

  requirement_type VARCHAR(40) NOT NULL,

  requirement_value INTEGER NOT NULL
    CHECK (requirement_value >= 0),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  user_id BIGINT NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,

  achievement_id BIGINT NOT NULL
    REFERENCES achievements(id)
    ON DELETE CASCADE,

  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, achievement_id)
);

INSERT INTO achievements (
  code,
  title,
  description,
  icon,
  points,
  requirement_type,
  requirement_value
)
VALUES
  (
    'primeiro_passo',
    'Primeiro passo',
    'Alcance 50 pontos de experiência.',
    'footprints',
    10,
    'points',
    50
  ),
  (
    'empenho_inicial',
    'Empenho inicial',
    'Alcance 100 pontos de experiência.',
    'sparkles',
    20,
    'points',
    100
  ),
  (
    'estudante_dedicado',
    'Estudante dedicado',
    'Alcance 250 pontos de experiência.',
    'graduation-cap',
    30,
    'points',
    250
  ),
  (
    'alto_desempenho',
    'Alto desempenho',
    'Alcance 500 pontos de experiência.',
    'trophy',
    50,
    'points',
    500
  )
ON CONFLICT (code) DO NOTHING;

-- =========================================================
-- Segurança no Supabase
-- =========================================================
-- Tabelas do schema public ficam expostas pela Data API do Supabase.
-- Habilitar RLS SEM criar políticas bloqueia esse acesso externo.
-- A nossa API Express conecta com o usuário "postgres" do pooler,
-- que ignora RLS, então nada muda para o backend.

ALTER TABLE gamification_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements     ENABLE ROW LEVEL SECURITY;