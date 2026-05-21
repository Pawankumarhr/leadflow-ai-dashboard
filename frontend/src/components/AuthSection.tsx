import type { FormEvent } from 'react';
import type { AuthMode, AuthForm, AuthErrors, FormFieldEvent } from '../types';

interface Props {
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  authForm: AuthForm;
  authErrors: AuthErrors;
  loading: boolean;
  onChange: (e: FormFieldEvent) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export default function AuthSection({
  authMode,
  setAuthMode,
  authForm,
  authErrors,
  loading,
  onChange,
  onSubmit,
}: Props) {
  return (
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
      <form onSubmit={onSubmit} className="form-grid">
        {authMode === 'register' && (
          <>
            <input
              name="firstName"
              placeholder="First name"
              value={authForm.firstName}
              onChange={onChange}
              className={authErrors.firstName ? 'input-error' : ''}
              required
            />
            {authErrors.firstName && <span className="field-error">{authErrors.firstName}</span>}
            <input
              name="lastName"
              placeholder="Last name"
              value={authForm.lastName}
              onChange={onChange}
              className={authErrors.lastName ? 'input-error' : ''}
              required
            />
            {authErrors.lastName && <span className="field-error">{authErrors.lastName}</span>}
            <select
              name="role"
              value={authForm.role}
              onChange={onChange}
              className={authErrors.role ? 'input-error' : ''}
              aria-label="Account role"
              required
            >
              <option value="admin">Admin</option>
              <option value="sales">Sales</option>
            </select>
            {authErrors.role && <span className="field-error">{authErrors.role}</span>}
          </>
        )}
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={authForm.email}
          onChange={onChange}
          className={authErrors.email ? 'input-error' : ''}
          required
        />
        {authErrors.email && <span className="field-error">{authErrors.email}</span>}
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={authForm.password}
          onChange={onChange}
          className={authErrors.password ? 'input-error' : ''}
          required
        />
        {authErrors.password && <span className="field-error">{authErrors.password}</span>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create account'}
        </button>
      </form>
    </section>
  );
}