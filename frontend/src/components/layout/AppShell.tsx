import { GraduationCap, Bell } from 'lucide-react';

import { Link, NavLink, Outlet } from 'react-router';

import { navigation } from '../../data/navigation';

export default function AppShell() {
  const mobileNavigation = navigation.slice(0, 5);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <GraduationCap size={22} />
          </div>

          <div>
            <div className="brand-name">Nexus Acadêmico</div>

            <div className="brand-subtitle">Ambiente acadêmico</div>
          </div>
        </div>

        <p className="nav-section-title">Navegação</p>

        <nav className="navigation" aria-label="Navegação principal">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                <Icon className="nav-icon" size={18} />

                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-summary">
            <div className="avatar">E</div>

            <div>
              <div className="user-name">Estudante</div>

              <div className="user-role">Perfil acadêmico</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div>
            <span className="topbar-kicker">Ambiente acadêmico</span>

            <span className="topbar-title">Meu espaço</span>
          </div>

          <div className="topbar-actions">
            <Link
              to="/notificacoes"
              className="icon-button"
              aria-label="Abrir notificações"
              title="Notificações"
            >
              <Bell size={18} />
            </Link>
          </div>
        </header>

        <main id="main-content">
          <Outlet />
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Navegação mobile">
        {mobileNavigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `mobile-nav-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
