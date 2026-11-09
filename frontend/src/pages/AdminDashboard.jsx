
import React, { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  FileBarChart,
  ShieldCheck,
  Settings,
  LogOut,
  Bell,
  Building2,
  ClipboardList,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  UserRound,
  UserCog
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    subjects: 0,
    attendanceRate: 0,
    sessions: 0,
    lowAttendance: 0
  });

  const [lowAttendanceStudents, setLowAttendanceStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const menu = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { name: "Students", icon: Users, path: "/admin/students" },
    { name: "User Management", icon: UserCog, path: "/admin/users" },
    { name: "Departments", icon: Building2, path: "/admin/departments" },
    { name: "Classes", icon: GraduationCap, path: "/admin/classes" },
    { name: "Teachers", icon: GraduationCap, path: "/admin/teachers" },
    { name: "Subjects", icon: BookOpen, path: "/admin/subjects" },
    { name: "Assignments", icon: ClipboardList, path: "/admin/assignments" },
    { name: "Attendance", icon: CalendarCheck, path: "/admin/attendance" },
    { name: "Reports", icon: FileBarChart, path: "/admin/reports" },
    { name: "Audit Logs", icon: ShieldCheck, path: "/admin/audit-logs" },
    { name: "Settings", icon: Settings, path: "/admin/settings" }
  ];

  const getArray = (data, possibleKeys) => {
    if (Array.isArray(data)) return data;

    for (const key of possibleKeys) {
      if (Array.isArray(data?.[key])) return data[key];
    }

    return [];
  };

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        api.get("/students"),
        api.get("/teachers"),
        api.get("/subjects"),
        api.get("/reports/overview")
      ]);

      const [studentsResult, teachersResult, subjectsResult, reportsResult] =
        results;

      const students =
        studentsResult.status === "fulfilled"
          ? getArray(studentsResult.value.data, ["students", "data"])
          : [];

      const teachers =
        teachersResult.status === "fulfilled"
          ? getArray(teachersResult.value.data, ["teachers", "data"])
          : [];

      const subjects =
        subjectsResult.status === "fulfilled"
          ? getArray(subjectsResult.value.data, ["subjects", "data"])
          : [];

      const reports =
        reportsResult.status === "fulfilled"
          ? reportsResult.value.data
          : null;

      const summary = reports?.summary || {};
      const alerts = reports?.lowAttendanceStudents || [];

      setLowAttendanceStudents(alerts);

      setStats({
        students: studentsResult.status === "fulfilled" ? students.length : 0,
        teachers: teachersResult.status === "fulfilled" ? teachers.length : 0,
        subjects: subjectsResult.status === "fulfilled" ? subjects.length : 0,
        attendanceRate: Number(summary.overall_percentage || 0),
        sessions: Number(summary.total_sessions || 0),
        lowAttendance: alerts.length
      });

      if (results.every((result) => result.status === "rejected")) {
        setError("Unable to load dashboard data. Please check your connection.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const formatPercentage = (value) =>
    `${Number(value || 0).toFixed(2).replace(/\.00$/, "")}%`;

  const statCards = [
    {
      title: "Total Students",
      value: stats.students,
      icon: Users,
      color: "blue"
    },
    {
      title: "Total Teachers",
      value: stats.teachers,
      icon: GraduationCap,
      color: "purple"
    },
    {
      title: "Total Subjects",
      value: stats.subjects,
      icon: BookOpen,
      color: "green"
    },
    {
      title: "Attendance Rate",
      value: `${stats.attendanceRate}%`,
      icon: CalendarCheck,
      color: "orange"
    }
  ];

  return (
    <div className="dashboard-layout">
      <style>{`
        .dashboard-layout { min-height: 100vh; background: #111827 !important; color: #e5e7eb; }
        .sidebar { background: #0b1220 !important; border-right: 1px solid #263244 !important; color: #e5e7eb !important; }
        .sidebar-brand { color: #f8fafc !important; }
        .menu-label { color: #8492a6 !important; }
        .sidebar-link { color: #aebbd0 !important; background: transparent !important; }
        .sidebar-link:hover, .sidebar-link.active { background: #1e293b !important; color: #ffffff !important; }
        .sidebar-link.active { border-left: 3px solid #60a5fa !important; }
        .sidebar-link.disabled { color: #64748b !important; }
        .logout-button { color: #fca5a5 !important; background: #271923 !important; }
        .logout-button:hover { background: #3a202b !important; }
        .dashboard-main { background: #111827 !important; color: #e5e7eb !important; }
        .topbar { background: #111827 !important; border-bottom: 1px solid #263244 !important; color: #f8fafc !important; }
        .topbar h2, .welcome-banner h1, .content-card h3 { color: #f8fafc !important; }
        .topbar p, .welcome-banner p { color: #9caec4 !important; }
        .icon-button { color: #cbd5e1 !important; background: #1f2937 !important; border: 1px solid #334155 !important; }
        .icon-button:hover { background: #334155 !important; }
        .profile-avatar { background: #2563eb !important; color: #fff !important; }
        .welcome-banner { background: linear-gradient(120deg, #172554, #1e3a5f) !important; border: 1px solid #29466f !important; color: #f8fafc !important; }
        .welcome-banner svg { color: #93c5fd !important; }
        .stat-card, .content-card { background: #1b2636 !important; border: 1px solid #2d3b4f !important; color: #e5e7eb !important; box-shadow: 0 8px 24px rgba(0,0,0,.18) !important; }
        .stat-card p, .summary-row span, .empty-state p { color: #a7b5c8 !important; }
        .stat-card h2, .summary-row strong { color: #f8fafc !important; }
        .dashboard-card-heading { border-color: #334155 !important; }
        .dashboard-text-button, .dashboard-report-button { background: #2563eb !important; color: #fff !important; border: 1px solid #3b82f6 !important; }
        .dashboard-text-button:hover, .dashboard-report-button:hover { background: #1d4ed8 !important; }
        .summary-row { border-bottom: 1px solid #334155 !important; }
        .dashboard-attendance-summary { color: #e5e7eb !important; }
        .dashboard-attendance-summary h2 { color: #93c5fd !important; }
        .dashboard-attendance-summary p, .dashboard-attendance-summary span { color: #a7b5c8 !important; }
        .dashboard-progress { background: #334155 !important; }
        .empty-state { color: #cbd5e1 !important; }
        .dashboard-error { background: #3b1d27 !important; border: 1px solid #7f1d1d !important; color: #fecaca !important; }
        .dashboard-footer { color: #718096 !important; border-color: #263244 !important; }
        .dashboard-layout section[style] { background: #1b2636 !important; border-color: #334155 !important; color: #e5e7eb !important; }
        .dashboard-layout section[style] p { color: #a7b5c8 !important; }
        .dashboard-layout section[style] article { background: #202d40 !important; border-color: #7f3540 !important; color: #e5e7eb !important; }
        .dashboard-layout section[style] article h3, .dashboard-layout section[style] article h2 { color: #f8fafc !important; }
        .dashboard-layout section[style] article span { color: #fca5a5 !important; }
        .dashboard-layout section[style] > div[style] { color: #e5e7eb !important; }
        @media (max-width: 900px) { .dashboard-main { padding: 18px !important; } }
      `}</style>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <CalendarCheck size={27} />
          <span>SmartAttend</span>
        </div>

        <p className="menu-label">MAIN MENU</p>

        {menu.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              type="button"
              className={`sidebar-link ${isActive ? "active" : ""} ${
                item.disabled ? "disabled" : ""
              }`}
              key={item.name}
              onClick={() => item.path && navigate(item.path)}
              disabled={item.disabled}
              title={item.disabled ? "Coming soon" : item.name}
            >
              <Icon size={19} />
              <span>{item.name}</span>

              {item.disabled && <small className="coming-soon">Soon</small>}
            </button>
          );
        })}

        <button className="logout-button" onClick={handleLogout}>
          <LogOut size={19} />
          Logout
        </button>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div>
            <h2>Dashboard Overview</h2>
            <p>Welcome back, {user?.name || "Admin"}</p>
          </div>

          <div className="topbar-actions">
            <button
              className="icon-button"
              onClick={loadDashboard}
              disabled={loading}
              aria-label="Refresh dashboard"
              title="Refresh dashboard"
            >
              <RefreshCw
                size={20}
                className={loading ? "dashboard-spinning" : ""}
              />
            </button>

            <button
              className="icon-button"
              onClick={() => navigate("/admin/reports")}
              aria-label="View attendance reports"
              title="Attendance reports"
            >
              <Bell size={20} />
            </button>

            <div className="profile-avatar">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
          </div>
        </header>

        <section className="welcome-banner">
          <div>
            <h1>Good to see you, {user?.name || "Admin"}!</h1>
            <p>
              Manage students, teachers, subjects and attendance from one place.
            </p>
          </div>

          <CalendarCheck size={55} />
        </section>

        {error && (
          <div className="dashboard-error">
            <AlertTriangle size={18} />
            {error}
            <button onClick={loadDashboard}>Retry</button>
          </div>
        )}

        <section className="stats-grid">
          {statCards.map((stat) => {
            const Icon = stat.icon;

            return (
              <div className="stat-card" key={stat.title}>
                <div className={`stat-icon ${stat.color}`}>
                  <Icon size={24} />
                </div>

                <p>{stat.title}</p>
                <h2>{loading ? "..." : stat.value}</h2>
              </div>
            );
          })}
        </section>

        <section className="dashboard-content">
          <div className="content-card">
            <div className="dashboard-card-heading">
              <h3>Attendance Overview</h3>

              <button
                className="dashboard-text-button"
                onClick={() => navigate("/admin/reports")}
              >
                View Reports
              </button>
            </div>

            {loading ? (
              <div className="empty-state">
                <p>Loading attendance analytics...</p>
              </div>
            ) : stats.sessions === 0 ? (
              <div className="empty-state">
                <CalendarCheck size={42} />
                <h3>No attendance data yet</h3>
                <p>
                  Start by assigning teachers and marking student attendance.
                </p>
              </div>
            ) : (
              <div className="dashboard-attendance-summary">
                <div className="dashboard-attendance-icon">
                  <TrendingUp size={27} />
                </div>

                <h2>{stats.attendanceRate}%</h2>
                <p>Overall attendance across recorded sessions</p>

                <div className="dashboard-progress">
                  <div
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, stats.attendanceRate)
                      )}%`
                    }}
                  />
                </div>

                <span>{stats.sessions} attendance sessions recorded</span>
              </div>
            )}
          </div>

          <div className="content-card">
            <h3>Quick Summary</h3>

            <div className="summary-row">
              <span>Students registered</span>
              <strong>{loading ? "..." : stats.students}</strong>
            </div>

            <div className="summary-row">
              <span>Teachers registered</span>
              <strong>{loading ? "..." : stats.teachers}</strong>
            </div>

            <div className="summary-row">
              <span>Attendance sessions</span>
              <strong>{loading ? "..." : stats.sessions}</strong>
            </div>

            <div className="summary-row">
              <span>Low attendance alerts</span>
              <strong className="dashboard-alert-count">
                {loading ? "..." : stats.lowAttendance}
              </strong>
            </div>

            <button
              className="dashboard-report-button"
              onClick={() => navigate("/admin/reports")}
            >
              <FileBarChart size={17} />
              Open Detailed Reports
            </button>
          </div>
        </section>

        {/* LOW ATTENDANCE ALERT CENTER */}
        <section
          style={{
            background: "#fff",
            border: "1px solid #e5eaf1",
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
                  fontSize: "20px"
                }}
              >
                <AlertTriangle color="#dc2626" size={22} />
                Low Attendance Alert Center
              </h2>

              <p style={{ color: "#718096", margin: "7px 0 0" }}>
                Students whose subject attendance is below 75%.
              </p>
            </div>

            <span
              style={{
                padding: "8px 13px",
                background: stats.lowAttendance > 0 ? "#fee2e2" : "#dcfce7",
                color: stats.lowAttendance > 0 ? "#b91c1c" : "#15803d",
                borderRadius: "20px",
                fontWeight: 700,
                fontSize: "13px"
              }}
            >
              {loading ? "Loading..." : `${stats.lowAttendance} Alerts`}
            </span>
          </div>

          {loading ? (
            <p style={{ color: "#718096" }}>Loading student alerts...</p>
          ) : lowAttendanceStudents.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 12px",
                background: "#f0fdf4",
                borderRadius: "10px",
                color: "#15803d"
              }}
            >
              <CheckCircle size={35} />
              <h3 style={{ margin: "10px 0 5px" }}>
                No Low Attendance Alerts
              </h3>
              <p style={{ margin: 0, fontSize: "13px" }}>
                All recorded student attendance is meeting the 75% threshold.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "13px" }}>
              {lowAttendanceStudents.map((student) => (
                <article
                  key={`${student.student_id}-${student.subject_id}`}
                  style={{
                    border: "1px solid #fecaca",
                    borderLeft: "4px solid #dc2626",
                    borderRadius: "10px",
                    padding: "16px",
                    background: "#fffafa"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "15px",
                      flexWrap: "wrap"
                    }}
                  >
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <h3
                        style={{
                          margin: "0 0 8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "16px"
                        }}
                      >
                        <UserRound size={18} />
                        {student.student_name}
                      </h3>

                      <p style={{ margin: "4px 0", color: "#64748b" }}>
                        UID: {student.uid}
                      </p>

                      <p style={{ margin: "4px 0", color: "#64748b" }}>
                        Class: {student.class_name} - {student.section}
                      </p>

                      <p style={{ margin: "8px 0 4px", fontWeight: 600 }}>
                        {student.subject_name} ({student.subject_code})
                      </p>

                      <p
                        style={{
                          margin: "5px 0",
                          color: "#64748b",
                          fontSize: "13px"
                        }}
                      >
                        Present: {student.present_classes} /{" "}
                        {student.total_classes} classes
                        {" · "}
                        Absent: {student.absent_classes}
                      </p>
                    </div>

                    <div
                      style={{
                        minWidth: "110px",
                        textAlign: "right",
                        alignSelf: "center"
                      }}
                    >
                      <h2
                        style={{
                          margin: 0,
                          color: "#dc2626",
                          fontSize: "27px"
                        }}
                      >
                        {formatPercentage(student.attendance_percentage)}
                      </h2>

                      <span
                        style={{
                          color: "#b91c1c",
                          fontSize: "12px",
                          fontWeight: 600
                        }}
                      >
                        Below 75%
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <button
            className="dashboard-report-button"
            style={{ marginTop: "18px" }}
            onClick={() => navigate("/admin/reports")}
          >
            <FileBarChart size={17} />
            View Full Attendance Reports
          </button>
        </section>

        <footer className="dashboard-footer">
          SmartAttend © 2026 | Smart Attendance Management System
        </footer>
      </main>
    </div>
  );
}
