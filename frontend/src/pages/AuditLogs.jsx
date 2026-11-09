
import React, { useCallback, useEffect, useState } from "react";
import {
  ShieldCheck,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Activity,
  User,
  CalendarDays,
  Globe,
  Monitor
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

import "./AuditLogs.css";

export default function AuditLogs() {
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/audit", {
        params: {
          action: action || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          page,
          limit: 20
        }
      });

      setLogs(response.data.logs || []);
      setTotal(Number(response.data.total || 0));
      setTotalPages(Number(response.data.total_pages || 1));
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load audit logs. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [action, startDate, endDate, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const formatDate = (value) => {
    if (!value) return "—";

    return new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  const getActionClass = (value) => {
    if (value === "LOGIN_SUCCESS") return "audit-success";
    if (value === "LOGIN_FAILED") return "audit-failed";
    if (value === "LOGIN_BLOCKED") return "audit-blocked";
    return "audit-neutral";
  };

  const resetFilters = () => {
    setAction("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <div className="audit-page">
      <button
        className="audit-back-button"
        onClick={() => navigate("/admin/dashboard")}
      >
        <ArrowLeft size={17} />
        Back to Dashboard
      </button>

      <header className="audit-page-header">
        <div>
          <span className="audit-eyebrow">SECURITY MANAGEMENT</span>
          <h1>
            <ShieldCheck size={29} />
            Audit Logs
          </h1>
          <p>Monitor login activity and user actions across your system.</p>
        </div>

        <button
          className="audit-refresh-button"
          onClick={loadLogs}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </header>

      <section className="audit-stat-grid">
        <article className="audit-stat-card">
          <Activity size={22} />
          <div>
            <span>Total Activities</span>
            <strong>{loading ? "..." : total}</strong>
          </div>
        </article>

        <article className="audit-stat-card">
          <ShieldCheck size={22} />
          <div>
            <span>Current Page Records</span>
            <strong>{loading ? "..." : logs.length}</strong>
          </div>
        </article>

        <article className="audit-stat-card">
          <CalendarDays size={22} />
          <div>
            <span>Total Pages</span>
            <strong>{loading ? "..." : totalPages}</strong>
          </div>
        </article>
      </section>

      <section className="audit-panel">
        <div className="audit-panel-heading">
          <div>
            <h2>System Activity History</h2>
            <p>Review and filter recorded user activities.</p>
          </div>
        </div>

        <div className="audit-filters">
          <label>
            Action
            <select
              value={action}
              onChange={(event) =>
                handleFilterChange(setAction, event.target.value)
              }
            >
              <option value="">All Actions</option>
              <option value="LOGIN_SUCCESS">Successful Login</option>
              <option value="LOGIN_FAILED">Failed Login</option>
              <option value="LOGIN_BLOCKED">Blocked Login</option>
              <option value="PROFILE_ACCESS">Profile Access</option>
            </select>
          </label>

          <label>
            Start Date
            <input
              type="date"
              value={startDate}
              onChange={(event) =>
                handleFilterChange(setStartDate, event.target.value)
              }
            />
          </label>

          <label>
            End Date
            <input
              type="date"
              value={endDate}
              onChange={(event) =>
                handleFilterChange(setEndDate, event.target.value)
              }
            />
          </label>

          <button className="audit-reset-button" onClick={resetFilters}>
            <Search size={16} />
            Reset Filters
          </button>
        </div>

        {error && <div className="audit-error">{error}</div>}

        {loading ? (
          <div className="audit-empty">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="audit-empty">
            <ShieldCheck size={38} />
            <h3>No audit records found</h3>
            <p>Try changing your filters or refresh the page.</p>
          </div>
        ) : (
          <>
            <div className="audit-table-wrapper">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>USER</th>
                    <th>ROLE</th>
                    <th>ACTION</th>
                    <th>DETAILS</th>
                    <th>IP ADDRESS</th>
                    <th>DATE & TIME</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map((log) => (
                    <tr key={log.log_id}>
                      <td>
                        <div className="audit-user">
                          <div className="audit-user-icon">
                            <User size={17} />
                          </div>
                          <div>
                            <strong>{log.user_name || "Unknown User"}</strong>
                            <small>{log.email || "Email unavailable"}</small>
                            <small>ID: {log.user_id ?? "Unknown"}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="audit-role">
                          {log.role || "Unknown"}
                        </span>
                      </td>

                      <td>
                        <span className={`audit-action ${getActionClass(log.action)}`}>
                          {log.action}
                        </span>
                      </td>

                      <td className="audit-details">{log.details || "—"}</td>

                      <td>
                        <span className="audit-ip">
                          <Globe size={14} />
                          {log.ip_address || "—"}
                        </span>
                      </td>

                      <td className="audit-date">
                        {formatDate(log.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="audit-pagination">
              <span>
                Showing {logs.length} of {total} records
              </span>

              <div>
                <button
                  onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                  disabled={page <= 1 || loading}
                >
                  <ChevronLeft size={17} />
                  Previous
                </button>

                <strong>
                  Page {page} of {totalPages}
                </strong>

                <button
                  onClick={() =>
                    setPage((previous) => Math.min(totalPages, previous + 1))
                  }
                  disabled={page >= totalPages || loading}
                >
                  Next
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="audit-browser-info">
        <Monitor size={18} />
        <span>
          Browser and device details are stored in the audit database and can
          be inspected through the backend records.
        </span>
      </section>
    </div>
  );
}
