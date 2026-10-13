import { useState, type FormEvent } from 'react';

import { Check, Eye, EyeOff, GraduationCap } from 'lucide-react';

import { Link, useNavigate } from 'react-router';

import { useAuth } from '../auth/AuthContext';

import { ApiError } from '../lib/api';

export default function RegisterPage() {
  const { register } = useAuth();

  const navigate = useNavigate();

  const [name, setName] = useState('');

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);

  const passwordHasLength = password.length >= 8;

  const passwordsMatch = password.length > 0 && password === confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');

    if (name.trim().length < 2) {
      setError('Informe seu nome completo.');

      return;
    }

    if (!email.trim()) {
      setError('Informe seu e-mail.');

      return;
    }

    if (!passwordHasLength) {
      setError('A senha precisa ter pelo menos 8 caracteres.');

      return;
    }

    if (!passwordsMatch) {
      setError('As senhas precisam ser iguais.');

      return;
    }

    try {
      setLoading(true);

      await register(name, email, password);

      navigate('/', {
        replace: true,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Não foi possível criar a conta.');
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

        <h1>Crie seu espaço acadêmico.</h1>

        <p>
          Uma base única para acompanhar atividades, equipes, reuniões e
          evolução acadêmica.
        </p>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <h2>Criar conta</h2>

          <p className="auth-card-description">
            Preencha seus dados para começar.
          </p>

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <form className="form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Nome completo</label>

              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Seu nome"
                autoComplete="name"
                disabled={loading}
              />
            </div>

            <div className="field">
              <label htmlFor="register-email">E-mail</label>

              <input
                id="register-email"
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
              <label htmlFor="register-password">Senha</label>

              <div className="password-field">
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Crie uma senha"
                  autoComplete="new-password"
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

              <ul className="password-requirements">
                <li
                  className={`password-requirement ${
                    passwordHasLength ? 'valid' : ''
                  }`}
                >
                  <Check size={14} />
                  Pelo menos 8 caracteres
                </li>
              </ul>
            </div>

            <div className="field">
              <label htmlFor="confirm-password">Confirmar senha</label>

              <div className="password-field">
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Digite a senha novamente"
                  autoComplete="new-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  aria-label={
                    showConfirmPassword
                      ? 'Ocultar confirmação da senha'
                      : 'Mostrar confirmação da senha'
                  }
                  onClick={() => setShowConfirmPassword((current) => !current)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {passwordsMatch && (
                <ul className="password-requirements">
                  <li className="password-requirement valid">
                    <Check size={14} />
                    As senhas conferem
                  </li>
                </ul>
              )}
            </div>

            <button
              type="submit"
              className="button button-primary"
              disabled={loading}
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="auth-footer">
            Já possui uma conta? <Link to="/login">Entrar</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
