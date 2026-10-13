import { Bell, GraduationCap, LogOut } from 'lucide-react';

import { NavLink, Outlet, useNavigate } from 'react-router';

import { navigation } from '../../data/navigation';

import { useAuth } from '../../auth/AuthContext';

export default function AppShell() {
  const { user, logout } = useAuth();

  const navigate = useNavigate();

  const mobileNavigation = navigation.slice(0, 5);

  async function handleLogout() {
    try {
      await logout();

      navigate('/login', {
        replace: true,
      });
    } catch {
      navigate('/login', {
        replace: true,
      });
    }
  }

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
            <div className="avatar">
              {user?.fullName.charAt(0).toUpperCase() ?? 'U'}
            </div>

            <div className="user-summary-content">
              <div className="user-name">{user?.fullName ?? 'Usuário'}</div>

              <div className="user-role">{user?.email ?? ''}</div>
            </div>

            <button
              type="button"
              className="icon-button logout-button"
              onClick={handleLogout}
              aria-label="Sair"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
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
            <NavLink
              to="/notificacoes"
              className="icon-button"
              aria-label="Abrir notificações"
              title="Notificações"
            >
              <Bell size={18} />
            </NavLink>
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
