import './App.css';
import { useEffect, useMemo, useState } from 'react';
import { request, download, API_URL } from './api/client';

function App() {
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [leadForm, setLeadForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    source: 'website',
    status: 'new',
    notes: '',
  });
  const [filters, setFilters] = useState({
    status: '',
    source: '',
    search: '',
    sort: 'desc',
    sortBy: 'createdAt',
    preset: '',
    startDate: '',
    endDate: '',
  });
  const [page, setPage] = useState(1);
  const [leads, setLeads] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('leadflow_token'));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('leadflow_refresh'));
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');
  const [editingLead, setEditingLead] = useState(null);
  const [authErrors, setAuthErrors] = useState({});
  const [leadErrors, setLeadErrors] = useState({});
  const [userErrors, setUserErrors] = useState({});
  const [activityFilter, setActivityFilter] = useState({ type: 'all', search: '' });
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    source: 'website',
    status: 'new',
    notes: '',
  });

  const isAuthed = Boolean(token);
  const isAdmin = user?.role === 'admin';

  const [theme, setTheme] = useState(() => localStorage.getItem('leadflow_theme') || 'light');

  const [users, setUsers] = useState([]);
  const [presets, setPresets] = useState([]);
  const [presetName, setPresetName] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditMeta, setAuditMeta] = useState({ total: 0, pages: 1 });
  const [auditPage, setAuditPage] = useState(1);
  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'sales',
  });

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
    params.set('page', page);
    params.set('limit', 10);
    return params.toString();
  }, [filters, page]);

  useEffect(() => {
    if (!isAuthed) return;

    const loadLeads = async () => {
      try {
        setLoading(true);
        const response = await request(`/api/leads?${queryString}`);
        setLeads(response.data || []);
        setMeta(response.meta || { total: 0, pages: 1 });
      } catch (error) {
        setMessage(error.message);
      } finally {
        setLoading(false);
      }
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
        const response = await request('/api/users');
        setUsers(response.data || []);
      } catch (error) {
        setMessage(error.message);
      }
    };

    loadUsers();
  }, [isAuthed, isAdmin]);

  useEffect(() => {
    if (!isAuthed) return;

    const loadPresets = async () => {
      try {
        const response = await request('/api/users/presets');
        setPresets(response.data || []);
      } catch (error) {
        setMessage(error.message);
      }
    };

    loadPresets();
  }, [isAuthed]);

  useEffect(() => {
    if (!isAuthed || !isAdmin) return;

    const loadAuditLogs = async () => {
      try {
        const response = await request(`/api/audit-logs?page=${auditPage}&limit=10`);
        setAuditLogs(response.data || []);
        setAuditMeta(response.meta || { total: 0, pages: 1 });
      } catch (error) {
        setMessage(error.message);
      }
    };

    loadAuditLogs();
  }, [isAuthed, isAdmin, auditPage]);

  useEffect(() => {
    const handleLogoutEvent = () => {
      setMessage('Session expired. Please log in again.');
      handleLogout();
    };

    window.addEventListener('leadflow:logout', handleLogoutEvent);
    return () => window.removeEventListener('leadflow:logout', handleLogoutEvent);
  }, []);

  const handleAuthChange = (event) => {
    const { name, value } = event.target;
    setAuthForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLeadChange = (event) => {
    const { name, value } = event.target;
    setLeadForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserChange = (event) => {
    const { name, value } = event.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateEmail = (value) => /\S+@\S+\.\S+/.test(value);
  const validatePhone = (value) => !value || /^[0-9+()\-\s]{7,20}$/.test(value);

  const filterActivities = (activities) => {
    return activities.filter((activity) => {
      if (activityFilter.type !== 'all' && activity.type !== activityFilter.type) {
        return false;
      }
      if (activityFilter.search) {
        return activity.message.toLowerCase().includes(activityFilter.search.toLowerCase());
      }
      return true;
    });
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    setMessage('');
    setAuthErrors({});

    const errors = {};
    if (authMode === 'register') {
      if (!authForm.firstName.trim()) errors.firstName = 'First name is required.';
      if (!authForm.lastName.trim()) errors.lastName = 'Last name is required.';
    }
    if (!validateEmail(authForm.email)) errors.email = 'Enter a valid email.';
    if (!authForm.password || authForm.password.length < 6) errors.password = 'Password must be at least 6 characters.';

    if (Object.keys(errors).length > 0) {
      setAuthErrors(errors);
      return;
    }

    try {
      setLoading(true);
      const path = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = await request(path, {
        method: 'POST',
        body: authMode === 'login'
          ? { email: authForm.email, password: authForm.password }
          : authForm,
      });

      localStorage.setItem('leadflow_token', payload.token);
      localStorage.setItem('leadflow_refresh', payload.refreshToken);
      setToken(payload.token);
      setRefreshToken(payload.refreshToken);
      setUser(payload.user);
      setAuthForm({ email: '', password: '', firstName: '', lastName: '' });
      setMessage('');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitLead = async (event) => {
    event.preventDefault();
    setMessage('');
    setLeadErrors({});

    const errors = {};
    if (!leadForm.firstName.trim()) errors.firstName = 'First name is required.';
    if (!leadForm.lastName.trim()) errors.lastName = 'Last name is required.';
    if (!validateEmail(leadForm.email)) errors.email = 'Enter a valid email.';
    if (!validatePhone(leadForm.phone)) errors.phone = 'Enter a valid phone number.';
    if (!leadForm.source) errors.source = 'Source is required.';

    if (Object.keys(errors).length > 0) {
      setLeadErrors(errors);
      return;
    }

    try {
      setLoading(true);
      await request('/api/leads', { method: 'POST', body: leadForm });
      setLeadForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        source: 'website',
        status: 'new',
        notes: '',
      });
      const response = await request(`/api/leads?${queryString}`);
      setLeads(response.data || []);
      setMeta(response.meta || { total: 0, pages: 1 });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (leadId) => {
    if (!window.confirm('Delete this lead?')) return;

    try {
      setLoading(true);
      await request(`/api/leads/${leadId}`, { method: 'DELETE' });
      const response = await request(`/api/leads?${queryString}`);
      setLeads(response.data || []);
      setMeta(response.meta || { total: 0, pages: 1 });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await download(`/api/leads/export?${queryString}`);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'leads.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage('CSV export ready.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setExporting(false);
    }
  };

  const startEdit = (lead) => {
    setEditingLead(lead);
    setActivityFilter({ type: 'all', search: '' });
    setEditForm({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone || '',
      company: lead.company || '',
      source: lead.source,
      status: lead.status,
      notes: lead.notes || '',
    });
  };

  const cancelEdit = () => {
    setEditingLead(null);
  };

  const submitEdit = async (event) => {
    event.preventDefault();
    if (!editingLead) return;

    try {
      setLoading(true);
      await request(`/api/leads/${editingLead._id}`, {
        method: 'PATCH',
        body: editForm,
      });
      const response = await request(`/api/leads?${queryString}`);
      setLeads(response.data || []);
      setMeta(response.meta || { total: 0, pages: 1 });
      setEditingLead(null);
      setMessage('Lead updated.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (leadId, status) => {
    try {
      await request(`/api/leads/${leadId}`, {
        method: 'PATCH',
        body: { status },
      });
      setLeads((prev) => prev.map((lead) => (lead._id === leadId ? { ...lead, status } : lead)));
    } catch (error) {
      setMessage(error.message);
    }
  };

  const savePreset = async () => {
    if (!presetName.trim()) {
      setMessage('Preset name is required.');
      return;
    }

    try {
      await request('/api/users/presets', {
        method: 'POST',
        body: { name: presetName.trim(), filters },
      });
      const response = await request('/api/users/presets');
      setPresets(response.data || []);
      setPresetName('');
      setMessage('Preset saved.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const applyPreset = (preset) => {
    setFilters({
      ...filters,
      ...preset.filters,
    });
    setPage(1);
  };

  const deletePreset = async (name) => {
    try {
      await request(`/api/users/presets/${encodeURIComponent(name)}`, { method: 'DELETE' });
      const response = await request('/api/users/presets');
      setPresets(response.data || []);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const submitUser = async (event) => {
    event.preventDefault();
    setMessage('');
    setUserErrors({});

    const errors = {};
    if (!userForm.firstName.trim()) errors.firstName = 'First name is required.';
    if (!userForm.lastName.trim()) errors.lastName = 'Last name is required.';
    if (!validateEmail(userForm.email)) errors.email = 'Enter a valid email.';
    if (!userForm.password || userForm.password.length < 6) errors.password = 'Password must be at least 6 characters.';

    if (Object.keys(errors).length > 0) {
      setUserErrors(errors);
      return;
    }

    try {
      setLoading(true);
      await request('/api/users', { method: 'POST', body: userForm });
      setUserForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'sales',
      });
      const response = await request('/api/users');
      setUsers(response.data || []);
      setMessage('User created.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = async (userId, isActive) => {
    try {
      await request(`/api/users/${userId}`, {
        method: 'PATCH',
        body: { isActive: !isActive },
      });
      const response = await request('/api/users');
      setUsers(response.data || []);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Delete this user?')) return;

    try {
      await request(`/api/users/${userId}`, { method: 'DELETE' });
      const response = await request('/api/users');
      setUsers(response.data || []);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleLogout = () => {
    if (refreshToken) {
      fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => null);
    }
    localStorage.removeItem('leadflow_token');
    localStorage.removeItem('leadflow_refresh');
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    setLeads([]);
    setUsers([]);
  };

  const canDelete = user?.role === 'admin';
  const hasFilters = Boolean(filters.status || filters.source || filters.search || filters.startDate || filters.endDate);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">Leadflow AI</p>
          <h1>Smart Leads Dashboard</h1>
          <p className="subtle">API: {API_URL}</p>
        </div>
        <div className="header-actions">
          <button
            className="btn ghost"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
        {isAuthed && (
          <div className="user-box">
            <div>
              <p className="user-name">{user?.firstName} {user?.lastName}</p>
              <p className="subtle">{user?.role}</p>
            </div>
            <button className="btn ghost" onClick={handleLogout}>Log out</button>
          </div>
        )}
        </div>
      </header>

      {message && <div className="alert">{message}</div>}

      {!isAuthed ? (
        <section className="card auth">
          <div className="tab-row">
            <button
              className={`tab ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => setAuthMode('login')}
            >
              Login
            </button>
            <button
              className={`tab ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => setAuthMode('register')}
            >
              Register
            </button>
          </div>
          <form onSubmit={submitAuth} className="form-grid">
            {authMode === 'register' && (
              <>
                <input
                  name="firstName"
                  placeholder="First name"
                  value={authForm.firstName}
                  onChange={handleAuthChange}
                  className={authErrors.firstName ? 'input-error' : ''}
                  required
                />
                {authErrors.firstName && <span className="field-error">{authErrors.firstName}</span>}
                <input
                  name="lastName"
                  placeholder="Last name"
                  value={authForm.lastName}
                  onChange={handleAuthChange}
                  className={authErrors.lastName ? 'input-error' : ''}
                  required
                />
                {authErrors.lastName && <span className="field-error">{authErrors.lastName}</span>}
              </>
            )}
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={authForm.email}
              onChange={handleAuthChange}
              className={authErrors.email ? 'input-error' : ''}
              required
            />
            {authErrors.email && <span className="field-error">{authErrors.email}</span>}
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={authForm.password}
              onChange={handleAuthChange}
              className={authErrors.password ? 'input-error' : ''}
              required
            />
            {authErrors.password && <span className="field-error">{authErrors.password}</span>}
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create account'}
            </button>
          </form>
        </section>
      ) : (
        <main className="dashboard">
          <section className="card">
            <h2>Create Lead</h2>
            <form onSubmit={submitLead} className="form-grid">
              <input name="firstName" placeholder="First name" value={leadForm.firstName} onChange={handleLeadChange} className={leadErrors.firstName ? 'input-error' : ''} required />
              {leadErrors.firstName && <span className="field-error">{leadErrors.firstName}</span>}
              <input name="lastName" placeholder="Last name" value={leadForm.lastName} onChange={handleLeadChange} className={leadErrors.lastName ? 'input-error' : ''} required />
              {leadErrors.lastName && <span className="field-error">{leadErrors.lastName}</span>}
              <input name="email" placeholder="Email" value={leadForm.email} onChange={handleLeadChange} className={leadErrors.email ? 'input-error' : ''} required />
              {leadErrors.email && <span className="field-error">{leadErrors.email}</span>}
              <input name="phone" placeholder="Phone" value={leadForm.phone} onChange={handleLeadChange} />
              {leadErrors.phone && <span className="field-error">{leadErrors.phone}</span>}
              <input name="company" placeholder="Company" value={leadForm.company} onChange={handleLeadChange} />
              <select name="source" value={leadForm.source} onChange={handleLeadChange}>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="social">Social</option>
                <option value="cold_call">Cold call</option>
                <option value="event">Event</option>
              </select>
              {leadErrors.source && <span className="field-error">{leadErrors.source}</span>}
              <select name="status" value={leadForm.status} onChange={handleLeadChange}>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
              <textarea name="notes" placeholder="Notes" value={leadForm.notes} onChange={handleLeadChange} rows="3" />
              <button className="btn" type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Add lead'}
              </button>
            </form>
          </section>

          <section className="card">
            <div className="card-header">
              <div>
                <h2>Leads</h2>
                <p className="subtle">{meta.total} total leads</p>
              </div>
              <button className="btn ghost" onClick={handleExport} disabled={exporting}>
                {exporting ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>

            <div className="filters">
              <input
                name="search"
                placeholder="Search name or email"
                value={filters.search}
                onChange={handleFilterChange}
              />
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
              <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
                <option value="createdAt">Sort by date</option>
                <option value="firstName">Sort by first name</option>
                <option value="lastName">Sort by last name</option>
                <option value="email">Sort by email</option>
                <option value="status">Sort by status</option>
                <option value="source">Sort by source</option>
              </select>
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">All statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
              <select name="source" value={filters.source} onChange={handleFilterChange}>
                <option value="">All sources</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="social">Social</option>
                <option value="cold_call">Cold call</option>
                <option value="event">Event</option>
              </select>
              <select name="sort" value={filters.sort} onChange={handleFilterChange}>
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>

            <div className="preset-row">
              <button className="btn ghost tiny" onClick={() => setFilters((prev) => ({ ...prev, preset: 'new', status: '', source: '' }))}>New leads</button>
              <button className="btn ghost tiny" onClick={() => setFilters((prev) => ({ ...prev, preset: 'qualified', status: '', source: '' }))}>Qualified</button>
              <button className="btn ghost tiny" onClick={() => setFilters((prev) => ({ ...prev, preset: 'lost', status: '', source: '' }))}>Lost</button>
              <button className="btn ghost tiny" onClick={() => setFilters((prev) => ({ ...prev, preset: '' }))}>Clear preset</button>
            </div>

            <div className="preset-save">
              <input
                name="presetName"
                placeholder="Save current filters as preset"
                value={presetName}
                onChange={(event) => setPresetName(event.target.value)}
              />
              <button className="btn ghost" onClick={savePreset}>Save preset</button>
            </div>

            {presets.length > 0 && (
              <div className="preset-list">
                {presets.map((preset) => (
                  <div className="preset-chip" key={preset.name}>
                    <button className="btn ghost tiny" onClick={() => applyPreset(preset)}>
                      {preset.name}
                    </button>
                    <button className="btn ghost tiny" onClick={() => deletePreset(preset.name)}>×</button>
                  </div>
                ))}
              </div>
            )}

            {loading ? (
              <p className="subtle">Loading...</p>
            ) : leads.length === 0 ? (
              <div className="empty-state">
                <p className="subtle">No leads yet. Create your first lead to kickstart the pipeline.</p>
                {hasFilters && (
                  <button className="btn ghost" onClick={() => setFilters({ status: '', source: '', search: '', sort: 'desc', sortBy: 'createdAt', preset: '', startDate: '', endDate: '' })}>
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="table">
                <div className="table-row table-head">
                  <span>Name</span>
                  <span>Email</span>
                  <span>Company</span>
                  <span>Status</span>
                  <span>Source</span>
                  <span>Actions</span>
                </div>
                {leads.map((lead) => (
                  <div className="table-row" key={lead._id}>
                    <span>{lead.firstName} {lead.lastName}</span>
                    <span>{lead.email}</span>
                    <span>{lead.company || '-'}</span>
                    <span>
                      <select
                        className="status-select"
                        value={lead.status}
                        onChange={(event) => updateStatus(lead._id, event.target.value)}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="converted">Converted</option>
                        <option value="lost">Lost</option>
                      </select>
                    </span>
                    <span>{lead.source}</span>
                    <span>
                      <button className="btn tiny ghost" onClick={() => startEdit(lead)}>
                        Edit
                      </button>
                      {canDelete ? (
                        <button className="btn tiny danger" onClick={() => handleDelete(lead._id)}>
                          Delete
                        </button>
                      ) : (
                        <span className="subtle">-</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="pagination">
              <button
                className="btn ghost"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                Prev
              </button>
              <span className="subtle">Page {page} of {meta.pages}</span>
              <button
                className="btn ghost"
                onClick={() => setPage((prev) => Math.min(prev + 1, meta.pages))}
                disabled={page >= meta.pages}
              >
                Next
              </button>
            </div>
          </section>

          {editingLead && (
            <section className="card">
              <div className="card-header">
                <div>
                  <h2>Edit Lead</h2>
                  <p className="subtle">Update details for {editingLead.firstName} {editingLead.lastName}</p>
                </div>
                <button className="btn ghost" onClick={cancelEdit}>Cancel</button>
              </div>
              <form onSubmit={submitEdit} className="form-grid">
                <input name="firstName" placeholder="First name" value={editForm.firstName} onChange={handleEditChange} required />
                <input name="lastName" placeholder="Last name" value={editForm.lastName} onChange={handleEditChange} required />
                <input name="email" placeholder="Email" value={editForm.email} onChange={handleEditChange} required />
                <input name="phone" placeholder="Phone" value={editForm.phone} onChange={handleEditChange} />
                <input name="company" placeholder="Company" value={editForm.company} onChange={handleEditChange} />
                <select name="source" value={editForm.source} onChange={handleEditChange}>
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="social">Social</option>
                  <option value="cold_call">Cold call</option>
                  <option value="event">Event</option>
                </select>
                <select name="status" value={editForm.status} onChange={handleEditChange}>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
                <textarea name="notes" placeholder="Notes" value={editForm.notes} onChange={handleEditChange} rows="3" />
                <button className="btn" type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save changes'}
                </button>
              </form>
              {editingLead.activities?.length > 0 && (
                <div className="activity">
                  <h3>Activity</h3>
                  <div className="activity-filters">
                    <select
                      value={activityFilter.type}
                      onChange={(event) => setActivityFilter((prev) => ({ ...prev, type: event.target.value }))}
                    >
                      <option value="all">All types</option>
                      <option value="created">Created</option>
                      <option value="updated">Updated</option>
                      <option value="status_changed">Status changed</option>
                    </select>
                    <input
                      placeholder="Search activity"
                      value={activityFilter.search}
                      onChange={(event) => setActivityFilter((prev) => ({ ...prev, search: event.target.value }))}
                    />
                  </div>
                  <ul>
                    {filterActivities(editingLead.activities).slice().reverse().map((activity, index) => (
                      <li key={`${activity.createdAt}-${index}`}>
                        <span className="activity-type">{activity.type.replace('_', ' ')}</span>
                        <span>{activity.message}</span>
                        <span className="subtle">{new Date(activity.createdAt).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {isAdmin && (
            <section className="card">
              <div className="card-header">
                <div>
                  <h2>Team Users</h2>
                  <p className="subtle">Manage sales reps</p>
                </div>
              </div>
              <form onSubmit={submitUser} className="form-grid">
                <input name="firstName" placeholder="First name" value={userForm.firstName} onChange={handleUserChange} className={userErrors.firstName ? 'input-error' : ''} required />
                {userErrors.firstName && <span className="field-error">{userErrors.firstName}</span>}
                <input name="lastName" placeholder="Last name" value={userForm.lastName} onChange={handleUserChange} className={userErrors.lastName ? 'input-error' : ''} required />
                {userErrors.lastName && <span className="field-error">{userErrors.lastName}</span>}
                <input name="email" placeholder="Email" value={userForm.email} onChange={handleUserChange} className={userErrors.email ? 'input-error' : ''} required />
                {userErrors.email && <span className="field-error">{userErrors.email}</span>}
                <input name="password" placeholder="Temporary password" value={userForm.password} onChange={handleUserChange} className={userErrors.password ? 'input-error' : ''} required />
                {userErrors.password && <span className="field-error">{userErrors.password}</span>}
                <select name="role" value={userForm.role} onChange={handleUserChange}>
                  <option value="sales">Sales</option>
                  <option value="admin">Admin</option>
                </select>
                <button className="btn" type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Create user'}
                </button>
              </form>

              {users.length > 0 && (
                <div className="table user-table">
                  <div className="table-row table-head">
                    <span>Name</span>
                    <span>Email</span>
                    <span>Role</span>
                    <span>Status</span>
                    <span>Actions</span>
                  </div>
                  {users.map((account) => (
                    <div className="table-row" key={account._id}>
                      <span>{account.firstName} {account.lastName}</span>
                      <span>{account.email}</span>
                      <span className="pill">{account.role}</span>
                      <span>{account.isActive ? 'Active' : 'Disabled'}</span>
                      <span>
                        <button className="btn tiny ghost" onClick={() => toggleUser(account._id, account.isActive)}>
                          {account.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button className="btn tiny danger" onClick={() => deleteUser(account._id)}>
                          Delete
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {isAdmin && (
            <section className="card">
              <div className="card-header">
                <div>
                  <h2>Audit Logs</h2>
                  <p className="subtle">Recent admin actions</p>
                </div>
              </div>
              {auditLogs.length === 0 ? (
                <p className="subtle">No audit logs yet.</p>
              ) : (
                <div className="table audit-table">
                  <div className="table-row table-head">
                    <span>Action</span>
                    <span>Target</span>
                    <span>Meta</span>
                    <span>Time</span>
                  </div>
                  {auditLogs.map((log) => (
                    <div className="table-row" key={log._id}>
                      <span>{log.action}</span>
                      <span>{log.targetType}</span>
                      <span>{log.meta?.email || log.meta?.role || '-'}</span>
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="pagination">
                <button
                  className="btn ghost"
                  onClick={() => setAuditPage((prev) => Math.max(prev - 1, 1))}
                  disabled={auditPage === 1}
                >
                  Prev
                </button>
                <span className="subtle">Page {auditPage} of {auditMeta.pages}</span>
                <button
                  className="btn ghost"
                  onClick={() => setAuditPage((prev) => Math.min(prev + 1, auditMeta.pages))}
                  disabled={auditPage >= auditMeta.pages}
                >
                  Next
                </button>
              </div>
            </section>
          )}
        </main>
      )}
    </div>
  );
}

export default App;
