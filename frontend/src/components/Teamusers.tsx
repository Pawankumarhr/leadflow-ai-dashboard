import type { FormEvent } from 'react';
import type { User, UserErrors, UserRole, FormFieldEvent } from '../types';

interface UserForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}

interface Props {
  users: User[];
  userForm: UserForm;
  userErrors: UserErrors;
  loading: boolean;
  onUserChange: (e: FormFieldEvent) => void;
  onSubmitUser: (e: FormEvent<HTMLFormElement>) => void;
  onToggleUser: (id: string, isActive: boolean) => void;
  onDeleteUser: (id: string) => void;
}

export default function TeamUsers({
  users,
  userForm,
  userErrors,
  loading,
  onUserChange,
  onSubmitUser,
  onToggleUser,
  onDeleteUser,
}: Props) {
  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Team Users</h2>
          <p className="subtle">Manage sales reps</p>
        </div>
      </div>

      <form onSubmit={onSubmitUser} className="form-grid">
        <input name="firstName" placeholder="First name" value={userForm.firstName} onChange={onUserChange} className={userErrors.firstName ? 'input-error' : ''} required />
        {userErrors.firstName && <span className="field-error">{userErrors.firstName}</span>}
        <input name="lastName" placeholder="Last name" value={userForm.lastName} onChange={onUserChange} className={userErrors.lastName ? 'input-error' : ''} required />
        {userErrors.lastName && <span className="field-error">{userErrors.lastName}</span>}
        <input name="email" placeholder="Email" value={userForm.email} onChange={onUserChange} className={userErrors.email ? 'input-error' : ''} required />
        {userErrors.email && <span className="field-error">{userErrors.email}</span>}
        <input name="password" placeholder="Temporary password" value={userForm.password} onChange={onUserChange} className={userErrors.password ? 'input-error' : ''} required />
        {userErrors.password && <span className="field-error">{userErrors.password}</span>}
        <select name="role" value={userForm.role} onChange={onUserChange} aria-label="User role">
          <option value="sales">Sales</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
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
                <button className="btn tiny ghost" onClick={() => onToggleUser(account._id, account.isActive)}>
                  {account.isActive ? 'Disable' : 'Enable'}
                </button>
                <button className="btn tiny danger" onClick={() => onDeleteUser(account._id)}>
                  Delete
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}