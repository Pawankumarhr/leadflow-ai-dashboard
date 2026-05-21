import type { User } from '../types';

type AppHeaderProps = {
  theme: 'light' | 'dark';
  isAuthed: boolean;
  user: User | null;
  onToggleTheme: () => void;
  onLogout: () => void;
};

function AppHeader({ theme, isAuthed, user, onToggleTheme, onLogout }: AppHeaderProps) {
  const roleLabel = user?.role === 'admin'
    ? 'Admin'
    : user?.role === 'sales'
      ? 'Sales Staff'
      : user?.role === 'manager'
        ? 'Manager'
        : user?.role === 'viewer'
          ? 'Viewer'
          : '';

  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">Leadflow AI</p>
        <h1>Smart Leads Dashboard</h1>
      </div>
      <div className="header-actions">
        <button className="btn ghost" onClick={onToggleTheme}>
          {theme === 'light' ? 'Dark mode' : 'Light mode'}
        </button>
        {isAuthed && (
          <div className="user-box">
            <div>
              <p className="user-name">{user?.firstName} {user?.lastName}</p>
              <p className="subtle">{roleLabel}</p>
            </div>
            <button className="btn ghost" onClick={onLogout}>Log out</button>
          </div>
        )}
      </div>
    </header>
  );
}

export default AppHeader;
