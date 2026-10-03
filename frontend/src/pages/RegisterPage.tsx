import type { FormEvent } from 'react';

import { GraduationCap } from 'lucide-react';

import { Link } from 'react-router';

export default function RegisterPage() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

          <form className="form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Nome completo</label>

              <input
                id="name"
                name="name"
                type="text"
                placeholder="Seu nome"
                autoComplete="name"
              />
            </div>

            <div className="field">
              <label htmlFor="register-email">E-mail</label>

              <input
                id="register-email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label htmlFor="register-password">Senha</label>

              <input
                id="register-password"
                name="password"
                type="password"
                placeholder="Crie uma senha"
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="button button-primary">
              Criar conta
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
