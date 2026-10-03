import type { FormEvent } from 'react';

import { GraduationCap } from 'lucide-react';

import { Link } from 'react-router';

export default function LoginPage() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

          <form className="form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">E-mail</label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label htmlFor="password">Senha</label>

              <input
                id="password"
                name="password"
                type="password"
                placeholder="Digite sua senha"
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="button button-primary">
              Entrar
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
