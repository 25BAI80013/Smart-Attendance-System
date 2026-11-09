
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CalendarCheck,
  CalendarDays,
  LogOut,
  TrendingUp,
  AlertTriangle,
  History,
  Bell,
  CheckCheck,
  RefreshCw
} from "lucide-react";
import api from "../services/api";
import "./Student.css";

export default function StudentDashboard() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [error, setError] = useState("");
  const [notificationError, setNotificationError] = useState("");

  useEffect(() => {
    loadDashboard();
    loadNotifications();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/student-portal/summary");

      setSummary(response.data.summary || null);
      setSubjects(response.data.subjects || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load student dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = useCallback(async () => {
    try {
      setNotificationLoading(true);
      setNotificationError("");

      const response = await api.get("/notifications");

      setNotifications(response.data.notifications || []);
      setUnreadCount(Number(response.data.unread_count || 0));
    } catch (err) {
      setNotificationError(
        err.response?.data?.message || "Unable to load notifications"
      );
    } finally {
      setNotificationLoading(false);
    }
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.notification_id === notificationId
            ? { ...notification, is_read: 1 }
            : notification
        )
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (err) {
      setNotificationError(
        err.response?.data?.message || "Unable to update notification"
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          is_read: 1
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      setNotificationError(
        err.response?.data?.message || "Unable to update notifications"
      );
    }
  };

  const logout = () => {
    localStorage.removeItem("attendance_token");
    localStorage.removeItem("attendance_user");
    navigate("/login");
  };

  const getStudentName = () => {
    try {
      const user = JSON.parse(localStorage.getItem("attendance_user") || "{}");
      return user.name || "Student";
    } catch {
      return "Student";
    }
  };

  const getAttendanceClass = (percentage) => {
    if (Number(percentage) >= 75) return "attendance-good";
    return "attendance-low";
  };

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  return (
    <div className="student-layout">
      <aside className="student-sidebar">
        <div>
          <h2>Smart Attendance</h2>
          <p className="student-role">STUDENT PORTAL</p>
        </div>

        <button className="student-nav active">
          <BookOpen size={18} />
          Dashboard
        </button>

        <button
          className="student-nav"
          onClick={() => navigate("/student/attendance/history")}
        >
          <History size={18} />
          Attendance History
        </button>

        <button className="student-nav logout" onClick={logout}>
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <main className="student-main">
        <header className="student-header">
          <div>
            <h1>Student Dashboard</h1>
            <p>Welcome back, {getStudentName()}!</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button
              type="button"
              onClick={loadNotifications}
              title="Refresh notifications"
              style={{
                position: "relative",
                border: "1px solid #e2e8f0",
                background: "#fff",
                borderRadius: "12px",
                padding: "10px",
                cursor: "pointer",
                color: "#334155"
              }}
            >
              <Bell size={21} />

              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-7px",
                    right: "-7px",
                    background: "#dc2626",
                    color: "#fff",
                    borderRadius: "50%",
                    minWidth: "19px",
                    height: "19px",
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 3px"
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            <span className="student-badge">Student</span>
          </div>
        </header>

        <section className="student-welcome">
          <h2>Your Attendance Overview</h2>
          <p>
            Track your attendance, monitor subject performance and stay
            updated with your academic attendance.
          </p>
        </section>

        {loading && (
          <div className="student-message">Loading your dashboard...</div>
        )}

        {error && <div className="student-error">{error}</div>}

        {!loading && !error && summary && (
          <>
            <section className="student-stat-grid">
              <article className="student-stat-card">
                <div className="student-stat-icon blue">
                  <TrendingUp size={22} />
                </div>
                <p>Overall Attendance</p>
                <h2>{summary.overall_percentage}%</h2>
              </article>

              <article className="student-stat-card">
                <div className="student-stat-icon purple">
                  <CalendarDays size={22} />
                </div>
                <p>Total Classes</p>
                <h2>{summary.total_classes}</h2>
              </article>

              <article className="student-stat-card">
                <div className="student-stat-icon green">
                  <CalendarCheck size={22} />
                </div>
                <p>Present Classes</p>
                <h2>{summary.present_classes}</h2>
              </article>

              <article className="student-stat-card">
                <div className="student-stat-icon red">
                  <AlertTriangle size={22} />
                </div>
                <p>Absent Classes</p>
                <h2>{summary.absent_classes}</h2>
              </article>
            </section>

            <section className="overall-attendance-panel">
              <div className="overall-heading">
                <div>
                  <h2>Overall Attendance</h2>
                  <p>Required attendance: 75%</p>
                </div>

                <strong
                  className={getAttendanceClass(summary.overall_percentage)}
                >
                  {summary.overall_percentage}%
                </strong>
              </div>

              <div className="progress-track">
                <div
                  className={`progress-fill ${getAttendanceClass(
                    summary.overall_percentage
                  )}`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, Number(summary.overall_percentage))
                    )}%`
                  }}
                />
              </div>

              {Number(summary.overall_percentage) < 75 ? (
                <p className="attendance-warning">
                  Your overall attendance is below 75%. Attend upcoming
                  classes regularly.
                </p>
              ) : (
                <p className="attendance-positive">
                  Your overall attendance is meeting the 75% target.
                </p>
              )}
            </section>

            <section
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "22px",
                marginTop: "24px"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom: "18px"
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "9px",
                      color: "#1e293b"
                    }}
                  >
                    <Bell size={21} />
                    Notifications
                  </h2>
                  <p style={{ color: "#64748b", margin: "6px 0 0" }}>
                    Your saved academic alerts and updates
                  </p>
                </div>

                <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={loadNotifications}
                    disabled={notificationLoading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "9px 12px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      background: "#fff",
                      cursor: "pointer"
                    }}
                  >
                    <RefreshCw size={15} />
                    Refresh
                  </button>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "9px 12px",
                        border: "none",
                        borderRadius: "8px",
                        background: "#2563eb",
                        color: "#fff",
                        cursor: "pointer"
                      }}
                    >
                      <CheckCheck size={15} />
                      Mark All Read
                    </button>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: "14px", color: "#64748b" }}>
                {unreadCount} unread notification(s)
              </div>

              {notificationError && (
                <div className="student-error">{notificationError}</div>
              )}

              {notificationLoading && (
                <div className="student-message">
                  Loading notifications...
                </div>
              )}

              {!notificationLoading && notifications.length === 0 && (
                <div
                  style={{
                    padding: "28px 12px",
                    textAlign: "center",
                    color: "#64748b",
                    background: "#f8fafc",
                    borderRadius: "10px"
                  }}
                >
                  <Bell size={28} />
                  <p>No notifications yet.</p>
                </div>
              )}

              {!notificationLoading &&
                notifications.map((notification) => {
                  const isUnread =
                    notification.is_read === 0 ||
                    notification.is_read === false;

                  return (
                    <article
                      key={notification.notification_id}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderLeft: `4px solid ${
                          notification.notification_type === "low_attendance"
                            ? "#dc2626"
                            : "#2563eb"
                        }`,
                        borderRadius: "9px",
                        padding: "15px",
                        marginBottom: "12px",
                        background: isUnread ? "#eff6ff" : "#fff"
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "12px",
                          alignItems: "flex-start"
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              margin: "0 0 7px",
                              color: "#1e293b",
                              fontSize: "15px"
                            }}
                          >
                            {notification.title}
                            {isUnread && (
                              <span
                                style={{
                                  marginLeft: "9px",
                                  color: "#2563eb",
                                  fontSize: "11px"
                                }}
                              >
                                NEW
                              </span>
                            )}
                          </h3>

                          <p
                            style={{
                              margin: "0 0 9px",
                              color: "#475569",
                              lineHeight: 1.5
                            }}
                          >
                            {notification.message}
                          </p>

                          <small style={{ color: "#94a3b8" }}>
                            {formatDate(notification.created_at)}
                          </small>
                        </div>

                        {isUnread && (
                          <button
                            type="button"
                            onClick={() =>
                              markAsRead(notification.notification_id)
                            }
                            style={{
                              flexShrink: 0,
                              padding: "8px 10px",
                              border: "1px solid #bfdbfe",
                              borderRadius: "7px",
                              background: "#fff",
                              color: "#1d4ed8",
                              cursor: "pointer",
                              fontSize: "12px"
                            }}
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
            </section>

            <section className="student-subject-section">
              <div className="student-section-heading">
                <div>
                  <h2>Subject-wise Attendance</h2>
                  <p>Attendance details for your enrolled subjects.</p>
                </div>

                <span>{subjects.length} Subjects</span>
              </div>

              {subjects.length === 0 ? (
                <div className="student-empty">
                  No enrolled subjects or attendance records found.
                </div>
              ) : (
                <div className="student-subject-grid">
                  {subjects.map((subject) => (
                    <article
                      className="student-subject-card"
                      key={subject.subject_id}
                    >
                      <div className="subject-card-top">
                        <div className="student-subject-icon">
                          <BookOpen size={21} />
                        </div>

                        <span
                          className={`subject-status ${getAttendanceClass(
                            subject.attendance_percentage
                          )}`}
                        >
                          {subject.attendance_percentage >= 75
                            ? "On Track"
                            : "Low Attendance"}
                        </span>
                      </div>

                      <h3>{subject.subject_name}</h3>
                      <p className="student-subject-code">
                        {subject.subject_code}
                      </p>

                      <div className="subject-percentage">
                        <strong>{subject.attendance_percentage}%</strong>
                        <span>Attendance</span>
                      </div>

                      <div className="progress-track">
                        <div
                          className={`progress-fill ${getAttendanceClass(
                            subject.attendance_percentage
                          )}`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                0,
                                Number(subject.attendance_percentage)
                              )
                            )}%`
                          }}
                        />
                      </div>

                      <div className="subject-counts">
                        <span>
                          Present: <strong>{subject.present_classes}</strong>
                        </span>
                        <span>
                          Absent: <strong>{subject.absent_classes}</strong>
                        </span>
                        <span>
                          Total: <strong>{subject.total_classes}</strong>
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <button
              className="student-history-button"
              onClick={() => navigate("/student/attendance/history")}
            >
              <History size={18} />
              View Complete Attendance History
            </button>
          </>
        )}
      </main>
    </div>
  );
}
