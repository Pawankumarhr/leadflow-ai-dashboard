import './App.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { request, download, API_URL } from './api/client';

import AuthSection from './components/AuthSection';
import AppHeader from './components/AppHeader';
import DashboardView from './components/DashboardView';

import type {
  AuthMode,
  AuthForm,
  LeadForm,
  Filters,
  Meta,
  Lead,
  LeadStatus,
  User,
  Preset,
  AuditLog,
  AuthErrors,
  LeadErrors,
  UserErrors,
  UserRole,
  ActivityType,
  AuthResponse,
  FormFieldEvent,
} from './types';

function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authForm, setAuthForm] = useState<AuthForm>({ email: '', password: '', firstName: '', lastName: '' });
  const [leadForm, setLeadForm] = useState<LeadForm>({
    firstName: '', lastName: '', email: '', phone: '', company: '', source: 'website', status: 'new', notes: '',
  });
  const [filters, setFilters] = useState<Filters>({
    status: '', source: '', search: '', sort: 'desc', sortBy: 'createdAt', preset: '', startDate: '', endDate: '',
  });
  const [page, setPage] = useState(1);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, pages: 1 });
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('leadflow_token'));
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem('leadflow_refresh'));
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [authErrors, setAuthErrors] = useState<AuthErrors>({});
  const [leadErrors, setLeadErrors] = useState<LeadErrors>({});
  const [userErrors, setUserErrors] = useState<UserErrors>({});
  const [activityFilter, setActivityFilter] = useState({ type: 'all' as ActivityType, search: '' });
  const [noteText, setNoteText] = useState('');
  const [editForm, setEditForm] = useState<LeadForm>({
    firstName: '', lastName: '', email: '', phone: '', company: '', source: 'website', status: 'new', notes: '',
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    localStorage.getItem('leadflow_theme') === 'dark' ? 'dark' : 'light'
  );
  const [users, setUsers] = useState<User[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditMeta, setAuditMeta] = useState<Meta>({ total: 0, pages: 1 });
  const [auditPage, setAuditPage] = useState(1);
  const [userForm, setUserForm] = useState({
    firstName: '', lastName: '', email: '', password: '', role: 'sales' as UserRole,
  });

  const isAuthed = Boolean(token);
  const isAdmin = user?.role === 'admin';
  const canDelete = user?.role === 'admin';
  const hasFilters = Boolean(filters.status || filters.source || filters.search || filters.startDate || filters.endDate);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.source) params.set('source', filters.source);
    if (filters.search) params.set('search', filters.search);
    if (filters.sort) params.set('sort', filters.sort);
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.preset) params.set('preset', filters.preset);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    params.set('page', String(page));
    params.set('limit', '10');
    return params.toString();
  }, [filters, page]);

  const doLogout = useCallback(() => {
    if (refreshToken) {
      fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => null);
    }
    localStorage.removeItem('leadflow_token');
    localStorage.removeItem('leadflow_refresh');
    setToken(null); setRefreshToken(null); setUser(null); setLeads([]); setUsers([]);
  }, [refreshToken]);

  // ─── Data fetching ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthed) return;
    const loadLeads = async () => {
      try {
        setLoading(true);
        const res = await request<{ data: Lead[]; meta: Meta }>(`/api/leads?${queryString}`);
        setLeads(res.data || []);
        setMeta(res.meta || { total: 0, pages: 1 });
      } catch (e) { setMessage((e as Error).message); }
      finally { setLoading(false); }
    };
    loadLeads();
  }, [isAuthed, queryString]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('leadflow_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!isAuthed || !isAdmin) return;
    const loadUsers = async () => {
      try {
        const res = await request<{ data: User[] }>('/api/users');
        setUsers(res.data || []);
      } catch (e) { setMessage((e as Error).message); }
    };
    loadUsers();
  }, [isAuthed, isAdmin]);

  useEffect(() => {
    if (!isAuthed) return;
    const loadPresets = async () => {
      try {
        const res = await request<{ data: Preset[] }>('/api/users/presets');
        setPresets(res.data || []);
      } catch (e) { setMessage((e as Error).message); }
    };
    loadPresets();
  }, [isAuthed]);

  useEffect(() => {
    if (!isAuthed || !isAdmin) return;
    const loadAuditLogs = async () => {
      try {
        const res = await request<{ data: AuditLog[]; meta: Meta }>(`/api/audit-logs?page=${auditPage}&limit=10`);
        setAuditLogs(res.data || []);
        setAuditMeta(res.meta || { total: 0, pages: 1 });
      } catch (e) { setMessage((e as Error).message); }
    };
    loadAuditLogs();
  }, [isAuthed, isAdmin, auditPage]);

  useEffect(() => {
    const handleLogout = () => { setMessage('Session expired. Please log in again.'); doLogout(); };
    window.addEventListener('leadflow:logout', handleLogout);
    return () => window.removeEventListener('leadflow:logout', handleLogout);
  }, [doLogout]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleAuthChange = (e: FormFieldEvent) => setAuthForm((p) => ({ ...p, [e.target.name]: e.target.value } as AuthForm));
  const handleLeadChange = (e: FormFieldEvent) => setLeadForm((p) => ({ ...p, [e.target.name]: e.target.value } as LeadForm));
  const handleEditChange = (e: FormFieldEvent) => setEditForm((p) => ({ ...p, [e.target.name]: e.target.value } as LeadForm));
  const handleUserChange = (e: FormFieldEvent) => setUserForm((p) => ({ ...p, [e.target.name]: e.target.value } as typeof userForm));

  const validateEmail = (v: string) => /\S+@\S+\.\S+/.test(v);
  const validatePhone = (v: string) => !v || /^[0-9+()\-\s]{7,20}$/.test(v);

  const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters((p) => ({ ...p, [e.target.name]: e.target.value } as Filters));
    setPage(1);
  };

  const submitAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(''); setAuthErrors({});
    const errors: AuthErrors = {};
    if (authMode === 'register') {
      if (!authForm.firstName.trim()) errors.firstName = 'First name is required.';
      if (!authForm.lastName.trim()) errors.lastName = 'Last name is required.';
    }
    if (!validateEmail(authForm.email)) errors.email = 'Enter a valid email.';
    if (!authForm.password || authForm.password.length < 6) errors.password = 'Password must be at least 6 characters.';
    if (Object.keys(errors).length) { setAuthErrors(errors); return; }

    try {
      setLoading(true);
      const path = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = await request<AuthResponse>(path, {
        method: 'POST',
        body: authMode === 'login' ? { email: authForm.email, password: authForm.password } : authForm,
      });
      localStorage.setItem('leadflow_token', payload.token);
      localStorage.setItem('leadflow_refresh', payload.refreshToken);
      setToken(payload.token); setRefreshToken(payload.refreshToken); setUser(payload.user);
      setAuthForm({ email: '', password: '', firstName: '', lastName: '' });
      setMessage(authMode === 'login' ? 'Logged in.' : 'Account created.');
    } catch (e) { setMessage((e as Error).message); }
    finally { setLoading(false); }
  };

  const submitLead = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(''); setLeadErrors({});
    const errors: LeadErrors = {};
    if (!leadForm.firstName.trim()) errors.firstName = 'First name is required.';
    if (!leadForm.lastName.trim()) errors.lastName = 'Last name is required.';
    if (!validateEmail(leadForm.email)) errors.email = 'Enter a valid email.';
    if (!validatePhone(leadForm.phone)) errors.phone = 'Enter a valid phone number.';
    if (!leadForm.source) errors.source = 'Source is required.';
    if (Object.keys(errors).length) { setLeadErrors(errors); return; }

    try {
      setLoading(true);
      await request<Lead>('/api/leads', { method: 'POST', body: leadForm });
      setLeadForm({ firstName: '', lastName: '', email: '', phone: '', company: '', source: 'website', status: 'new', notes: '' });
      const res = await request<{ data: Lead[]; meta: Meta }>(`/api/leads?${queryString}`);
      setLeads(res.data || []); setMeta(res.meta || { total: 0, pages: 1 });
      setMessage('Lead created.');
    } catch (e) { setMessage((e as Error).message); }
    finally { setLoading(false); }
  };

  const handleDelete = async (leadId: string) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      setLoading(true);
      await request(`/api/leads/${leadId}`, { method: 'DELETE' });
      const res = await request<{ data: Lead[]; meta: Meta }>(`/api/leads?${queryString}`);
      setLeads(res.data || []); setMeta(res.meta || { total: 0, pages: 1 });
      setMessage('Lead deleted.');
    } catch (e) { setMessage((e as Error).message); }
    finally { setLoading(false); }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await download(`/api/leads/export?${queryString}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'leads.csv';
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      setMessage('CSV export ready.');
    } catch (e) { setMessage((e as Error).message); }
    finally { setExporting(false); }
  };

  const startEdit = (lead: Lead) => {
    setEditingLead(lead);
    setActivityFilter({ type: 'all', search: '' });
    setEditForm({ firstName: lead.firstName, lastName: lead.lastName, email: lead.email, phone: lead.phone || '', company: lead.company || '', source: lead.source, status: lead.status, notes: lead.notes || '' });
  };

  const submitEdit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingLead) return;
    try {
      setLoading(true);
      await request<Lead>(`/api/leads/${editingLead._id}`, { method: 'PATCH', body: editForm });
      const res = await request<{ data: Lead[]; meta: Meta }>(`/api/leads?${queryString}`);
      setLeads(res.data || []); setMeta(res.meta || { total: 0, pages: 1 });
      setEditingLead(null); setMessage('Lead updated.');
    } catch (e) { setMessage((e as Error).message); }
    finally { setLoading(false); }
  };

  const updateStatus = async (leadId: string, status: LeadStatus) => {
    try {
      await request<Lead>(`/api/leads/${leadId}`, { method: 'PATCH', body: { status } });
      setLeads((p) => p.map((l) => (l._id === leadId ? { ...l, status } : l)));
    } catch (e) { setMessage((e as Error).message); }
  };

  const addNote = async (leadId: string, text: string) => {
    try {
      const updated = await request<Lead>(`/api/leads/${leadId}/notes`, { method: 'POST', body: { text } });
      setEditingLead(updated); setMessage('Note added.');
    } catch (e) { setMessage((e as Error).message); }
  };

  const deleteNote = async (leadId: string, noteId: string) => {
    try {
      const updated = await request<Lead>(`/api/leads/${leadId}/notes/${noteId}`, { method: 'DELETE' });
      setEditingLead(updated); setMessage('Note deleted.');
    } catch (e) { setMessage((e as Error).message); }
  };

  const savePreset = async () => {
    if (!presetName.trim()) { setMessage('Preset name is required.'); return; }
    try {
      await request('/api/users/presets', { method: 'POST', body: { name: presetName.trim(), filters } });
      const res = await request<{ data: Preset[] }>('/api/users/presets');
      setPresets(res.data || []); setPresetName(''); setMessage('Preset saved.');
    } catch (e) { setMessage((e as Error).message); }
  };

  const applyPreset = (preset: Preset) => { setFilters((p) => ({ ...p, ...preset.filters })); setPage(1); };

  const deletePreset = async (name: string) => {
    try {
      await request(`/api/users/presets/${encodeURIComponent(name)}`, { method: 'DELETE' });
      const res = await request<{ data: Preset[] }>('/api/users/presets');
      setPresets(res.data || []); setMessage('Preset deleted.');
    } catch (e) { setMessage((e as Error).message); }
  };

  const submitUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(''); setUserErrors({});
    const errors: UserErrors = {};
    if (!userForm.firstName.trim()) errors.firstName = 'First name is required.';
    if (!userForm.lastName.trim()) errors.lastName = 'Last name is required.';
    if (!validateEmail(userForm.email)) errors.email = 'Enter a valid email.';
    if (!userForm.password || userForm.password.length < 6) errors.password = 'Password must be at least 6 characters.';
    if (Object.keys(errors).length) { setUserErrors(errors); return; }
    try {
      setLoading(true);
      await request<User>('/api/users', { method: 'POST', body: userForm });
      setUserForm({ firstName: '', lastName: '', email: '', password: '', role: 'sales' });
      const res = await request<{ data: User[] }>('/api/users');
      setUsers(res.data || []); setMessage('User created.');
    } catch (e) { setMessage((e as Error).message); }
    finally { setLoading(false); }
  };

  const toggleUser = async (userId: string, isActive: boolean) => {
    try {
      await request<User>(`/api/users/${userId}`, { method: 'PATCH', body: { isActive: !isActive } });
      const res = await request<{ data: User[] }>('/api/users');
      setUsers(res.data || []); setMessage(isActive ? 'User disabled.' : 'User enabled.');
    } catch (e) { setMessage((e as Error).message); }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await request(`/api/users/${userId}`, { method: 'DELETE' });
      const res = await request<{ data: User[] }>('/api/users');
      setUsers(res.data || []); setMessage('User deleted.');
    } catch (e) { setMessage((e as Error).message); }
  };

  const clearFilters = () =>
    setFilters({ status: '', source: '', search: '', sort: 'desc', sortBy: 'createdAt', preset: '', startDate: '', endDate: '' });

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <AppHeader
        theme={theme}
        isAuthed={isAuthed}
        user={user}
        onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        onLogout={doLogout}
      />

      {message && <div className="alert">{message}</div>}

      {!isAuthed ? (
        <AuthSection
          authMode={authMode}
          setAuthMode={setAuthMode}
          authForm={authForm}
          authErrors={authErrors}
          loading={loading}
          onChange={handleAuthChange}
          onSubmit={submitAuth}
        />
      ) : (
        <DashboardView
          leadForm={leadForm}
          leadErrors={leadErrors}
          loading={loading}
          onLeadChange={handleLeadChange}
          onSubmitLead={submitLead}
          filters={filters}
          presets={presets}
          presetName={presetName}
          exporting={exporting}
          meta={meta}
          onFilterChange={handleFilterChange}
          onPresetNameChange={setPresetName}
          onSavePreset={savePreset}
          onApplyPreset={applyPreset}
          onDeletePreset={deletePreset}
          onExport={handleExport}
          onQuickPreset={(preset) =>
            setFilters((p) => ({ ...p, preset, status: '', source: '' }))
          }
          leads={leads}
          canDelete={canDelete}
          hasFilters={hasFilters}
          page={page}
          onEdit={startEdit}
          onDelete={handleDelete}
          onStatusChange={updateStatus}
          onPageChange={setPage}
          onClearFilters={clearFilters}
          editingLead={editingLead}
          editForm={editForm}
          noteText={noteText}
          activityFilter={activityFilter}
          onEditChange={handleEditChange}
          onSubmitEdit={submitEdit}
          onCancelEdit={() => setEditingLead(null)}
          onNoteTextChange={setNoteText}
          onAddNote={addNote}
          onDeleteNote={deleteNote}
          onActivityFilterChange={setActivityFilter}
          isAdmin={isAdmin}
          users={users}
          userForm={userForm}
          userErrors={userErrors}
          onUserChange={handleUserChange}
          onSubmitUser={submitUser}
          onToggleUser={toggleUser}
          onDeleteUser={deleteUser}
          auditLogs={auditLogs}
          auditMeta={auditMeta}
          auditPage={auditPage}
          onAuditPageChange={setAuditPage}
        />
      )}
    </div>
  );
}

export default App;