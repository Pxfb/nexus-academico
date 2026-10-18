-- Tutorial 04: histórico de pontos e segurança no Supabase

-- 1) Índices para o histórico paginado e filtrado
CREATE INDEX IF NOT EXISTS idx_point_events_user_created_at
  ON point_events (user_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_point_events_user_type_created_at
  ON point_events (user_id, event_type, created_at DESC, id DESC);

-- 2) Row Level Security (RLS)
-- O backend usa o papel dono das tabelas (postgres), que ignora o RLS.
-- Sem políticas, a Data API do Supabase (anon/authenticated) não acessa nada.
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.schema_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gamification_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.point_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_achievements ENABLE ROW LEVEL SECURITY;