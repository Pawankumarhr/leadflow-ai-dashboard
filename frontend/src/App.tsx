import './App.css';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { request, API_URL } from './api/client';
import LoginPage from './components/LoginPage';
import ModernDashboard from './components/ModernDashboard';

import type {
  AuthErrors,
  AuthForm,
  AuthMode,
  AuthResponse,
  FormFieldEvent,
  User,
} from './types';

function loadStoredUser() {
  const raw = localStorage.getItem('leadflow_user');
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    localStorage.getItem('leadflow_theme') === 'dark' ? 'dark' : 'light'
  );
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authForm, setAuthForm] = useState<AuthForm>({ email: '', password: '', firstName: '', lastName: '', role: 'sales' });
  const [authErrors, setAuthErrors] = useState<AuthErrors>({});
  const [authMessage, setAuthMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('leadflow_token'));
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem('leadflow_refresh'));
  const [user, setUser] = useState<User | null>(() => loadStoredUser());

  const isAuthed = Boolean(token);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('leadflow_theme', theme);
  }, [theme]);

  const handleAuthChange = (event: FormFieldEvent) => {
    setAuthForm((previous) => ({ ...previous, [event.target.name]: event.target.value } as AuthForm));
  };

  const handleAuthModeChange = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthErrors({});
    setAuthMessage('');
  };

  const validateEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthErrors({});
    setAuthMessage('');

    const nextErrors: AuthErrors = {};
    if (authMode === 'register') {
      if (!authForm.firstName.trim()) nextErrors.firstName = 'First name is required.';
      if (!authForm.lastName.trim()) nextErrors.lastName = 'Last name is required.';
      if (!authForm.role) nextErrors.role = 'Role is required.';
    }
    if (!validateEmail(authForm.email)) nextErrors.email = 'Enter a valid email.';
    if (!authForm.password || authForm.password.length < 6) nextErrors.password = 'Password must be at least 6 characters.';

    if (Object.keys(nextErrors).length) {
      setAuthErrors(nextErrors);
      return;
    }

    try {
      setLoading(true);
      const path = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = await request<AuthResponse>(path, {
        method: 'POST',
        body: authMode === 'login' ? { email: authForm.email, password: authForm.password } : authForm,
      });

      localStorage.setItem('leadflow_token', payload.token);
      localStorage.setItem('leadflow_refresh', payload.refreshToken);
      localStorage.setItem('leadflow_user', JSON.stringify(payload.user));
      setToken(payload.token);
      setRefreshToken(payload.refreshToken);
      setUser(payload.user);
      setAuthForm({ email: '', password: '', firstName: '', lastName: '', role: 'sales' });
      setAuthMessage(authMode === 'login' ? 'Signed in successfully.' : 'Account created successfully.');
    } catch (error) {
      setAuthMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const doLogout = async () => {
    if (refreshToken) {
      fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => null);
    }

    localStorage.removeItem('leadflow_token');
    localStorage.removeItem('leadflow_refresh');
    localStorage.removeItem('leadflow_user');
    sessionStorage.clear();
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    setAuthMessage('');
  };

  const routerUser = useMemo(() => user ?? loadStoredUser(), [user]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={isAuthed ? '/dashboard' : '/login'} replace />} />
        <Route
          path="/login"
          element={isAuthed ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage
              authMode={authMode}
              setAuthMode={handleAuthModeChange}
              authForm={authForm}
              authErrors={authErrors}
              loading={loading}
              onChange={handleAuthChange}
              onSubmit={submitAuth}
            />
          )}
        />
        <Route
          path="/dashboard"
          element={isAuthed ? (
            <ModernDashboard
              theme={theme}
              user={routerUser}
              onToggleTheme={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
              onLogout={doLogout}
              initialView="dashboard"
            />
          ) : (
            <Navigate to="/login" replace />
          )}
        />
        <Route
          path="/leads"
          element={isAuthed ? (
            <ModernDashboard
              theme={theme}
              user={routerUser}
              onToggleTheme={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
              onLogout={doLogout}
              initialView="leads"
            />
          ) : (
            <Navigate to="/login" replace />
          )}
        />
        <Route
          path="/analytics"
          element={isAuthed ? (
            <ModernDashboard
              theme={theme}
              user={routerUser}
              onToggleTheme={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
              onLogout={doLogout}
              initialView="analytics"
            />
          ) : (
            <Navigate to="/login" replace />
          )}
        />
        <Route path="*" element={<Navigate to={isAuthed ? '/dashboard' : '/login'} replace />} />
      </Routes>

      {authMessage && isAuthed && (
        <div className="fixed bottom-5 right-5 z-[100] rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm text-[color:var(--text)] shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur-xl">
          {authMessage}
        </div>
      )}
    </BrowserRouter>
  );
}

export default App;
