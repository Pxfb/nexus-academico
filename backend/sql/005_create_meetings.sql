-- Tutorial 06: reuniões

CREATE TABLE IF NOT EXISTS meetings (
  id BIGSERIAL PRIMARY KEY,

  user_id BIGINT NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,

  title VARCHAR(160) NOT NULL,

  description TEXT,

  scheduled_at TIMESTAMPTZ NOT NULL,

  duration_minutes INTEGER NOT NULL DEFAULT 60
    CHECK (duration_minutes BETWEEN 5 AND 480),

  location VARCHAR(255),

  meeting_url VARCHAR(500),

  status VARCHAR(20) NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'cancelled')),

  attended_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meetings_user_scheduled_at
  ON meetings (user_id, scheduled_at);

-- RLS: o backend usa o papel dono das tabelas (ignora o RLS).
-- Sem políticas, a Data API do Supabase não acessa esta tabela.
ALTER TABLE IF EXISTS public.meetings ENABLE ROW LEVEL SECURITY;