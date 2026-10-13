import { useState, type FormEvent } from 'react';

import { Eye, EyeOff, GraduationCap } from 'lucide-react';

import { Link, useLocation, useNavigate } from 'react-router';

import { useAuth } from '../auth/AuthContext';

import { ApiError } from '../lib/api';

export default function LoginPage() {
  const { login } = useAuth();

  const navigate = useNavigate();

  const location = useLocation();

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);

  const from =
    (
      location.state as {
        from?: string;
      } | null
    )?.from ?? '/';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');

    if (!email.trim()) {
      setError('Informe seu e-mail.');

      return;
    }

    if (!password) {
      setError('Informe sua senha.');

      return;
    }

    try {
      setLoading(true);

      await login(email, password);

      navigate(from, {
        replace: true,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Não foi possível entrar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-brand-mark">
          <GraduationCap size={26} />
        </div>

        <h1>Seu ambiente acadêmico em um só lugar.</h1>

        <p>
          Organize tarefas, reuniões, materiais, comunicação e acompanhamento
          acadêmico em uma experiência integrada.
        </p>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <h2>Entrar</h2>

          <p className="auth-card-description">
            Acesse seu ambiente acadêmico.
          </p>

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <form className="form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">E-mail</label>

              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Senha</label>

              <div className="password-field">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="button button-primary"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="auth-footer">
            Ainda não possui uma conta? <Link to="/cadastro">Criar conta</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
