
import React, { useCallback, useEffect, useState } from "react";
import {
  Users as UsersIcon,
  Search,
  RefreshCw,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  UserCheck,
  UserX
} from "lucide-react";
import api from "../services/api";
import "./Users.css";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [passwordUser, setPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/users", {
        params: {
          search: search || undefined,
          role: role || undefined
        }
      });

      setUsers(response.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }, [search, role]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const performAction = async (action, successMessage) => {
    try {
      setError("");
      setMessage("");

      await action();
      setMessage(successMessage);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Action failed.");
    }
  };

  const toggleStatus = (user) => {
    const nextStatus = !Boolean(user.is_active);

    if (
      !window.confirm(
        `Are you sure you want to ${nextStatus ? "activate" : "deactivate"} ${user.name}?`
      )
    ) return;

    performAction(
      () => api.patch(`/users/${user.user_id}/status`, {
        is_active: nextStatus
      }),
      `User ${nextStatus ? "activated" : "deactivated"} successfully.`
    );
  };

  const unlockAccount = (user) => {
    if (!window.confirm(`Unlock the account for ${user.name}?`)) return;

    performAction(
      () => api.patch(`/users/${user.user_id}/unlock`),
      "Account unlocked successfully."
    );
  };

  const openPasswordReset = (user) => {
    setPasswordUser(user);
    setNewPassword("");
    setError("");
    setMessage("");
  };

  const resetPassword = async (event) => {
    event.preventDefault();

    if (newPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    try {
      setSavingPassword(true);
      setError("");

      await api.patch(`/users/${passwordUser.user_id}/password`, {
        new_password: newPassword
      });

      setPasswordUser(null);
      setNewPassword("");
      setMessage(`Password reset successfully for ${passwordUser.name}.`);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Password reset failed.");
    } finally {
      setSavingPassword(false);
    }
  };

  const isLocked = (user) => {
    return user.locked_until &&
      new Date(user.locked_until).getTime() > Date.now();
  };

  return (
    <div className="users-page">
      <header className="users-header">
        <div>
          <span className="users-eyebrow">ADMINISTRATION</span>
          <h1><UsersIcon size={28} /> User Management</h1>
          <p>Manage accounts, access permissions and account security.</p>
        </div>

        <button className="users-refresh" onClick={loadUsers} disabled={loading}>
          <RefreshCw size={17} />
          Refresh
        </button>
      </header>

      <section className="users-summary">
        <article>
          <UsersIcon size={22} />
          <div><span>Total Users</span><strong>{users.length}</strong></div>
        </article>
        <article>
          <UserCheck size={22} />
          <div>
            <span>Active Accounts</span>
            <strong>{users.filter(user => Boolean(user.is_active)).length}</strong>
          </div>
        </article>
        <article>
          <UserX size={22} />
          <div>
            <span>Inactive Accounts</span>
            <strong>{users.filter(user => !Boolean(user.is_active)).length}</strong>
          </div>
        </article>
        <article>
          <Lock size={22} />
          <div>
            <span>Locked Accounts</span>
            <strong>{users.filter(isLocked).length}</strong>
          </div>
        </article>
      </section>

      {message && <div className="users-success">{message}</div>}
      {error && <div className="users-error">{error}</div>}

      <section className="users-panel">
        <div className="users-panel-heading">
          <div>
            <h2>All System Users</h2>
            <p>Search users and manage their account access.</p>
          </div>
        </div>

        <div className="users-filters">
          <label className="users-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email..."
            />
          </label>

          <select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
        </div>

        {loading ? (
          <div className="users-empty">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="users-empty">No users found.</div>
        ) : (
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>USER</th>
                  <th>ROLE</th>
                  <th>STATUS</th>
                  <th>SECURITY</th>
                  <th>FAILED ATTEMPTS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td>
                      <div className="users-identity">
                        <div className="users-avatar">
                          {user.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <strong>{user.name}</strong>
                          <small>{user.email}</small>
                          <small>ID: {user.user_id}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`users-role role-${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`users-status ${user.is_active ? "status-active" : "status-inactive"}`}>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      {isLocked(user) ? (
                        <span className="users-lock locked">
                          <Lock size={14} /> Locked
                        </span>
                      ) : (
                        <span className="users-lock unlocked">
                          <Unlock size={14} /> Unlocked
                        </span>
                      )}
                    </td>
                    <td>{user.failed_login_attempts ?? 0}</td>
                    <td>
                      <div className="users-actions">
                        <button
                          className="action-password"
                          title="Reset password"
                          onClick={() => openPasswordReset(user)}
                        >
                          <KeyRound size={16} />
                        </button>

                        <button
                          className="action-unlock"
                          title="Unlock account"
                          disabled={!isLocked(user) && Number(user.failed_login_attempts) === 0}
                          onClick={() => unlockAccount(user)}
                        >
                          <Unlock size={16} />
                        </button>

                        <button
                          className={user.is_active ? "action-deactivate" : "action-activate"}
                          title={user.is_active ? "Deactivate account" : "Activate account"}
                          onClick={() => toggleStatus(user)}
                        >
                          {user.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {passwordUser && (
        <div className="users-modal-backdrop">
          <form className="users-modal" onSubmit={resetPassword}>
            <div className="users-modal-icon"><ShieldCheck size={24} /></div>
            <h2>Reset Password</h2>
            <p>Set a new password for <strong>{passwordUser.name}</strong>.</p>

            <label>
              New Password
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Minimum 8 characters"
                minLength={8}
                required
              />
            </label>

            <div className="users-modal-actions">
              <button
                type="button"
                className="modal-cancel"
                onClick={() => setPasswordUser(null)}
              >
                Cancel
              </button>
              <button type="submit" className="modal-save" disabled={savingPassword}>
                {savingPassword ? "Saving..." : "Reset Password"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
