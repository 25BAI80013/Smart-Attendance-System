
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ClipboardCheck, History, LogOut } from "lucide-react";
import api from "../services/api";
import "./Teacher.css";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const response = await api.get("/attendance/assignments");
      setAssignments(response.data.assignments || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("attendance_token");
    localStorage.removeItem("attendance_user");
    navigate("/login");
  };

  return (
    <div className="teacher-layout">
      <aside className="teacher-sidebar">
        <h2>Smart Attendance</h2>
        <p className="teacher-role">TEACHER PORTAL</p>

        <button className="teacher-nav active">
          <BookOpen size={18} /> Dashboard
        </button>

        <button
          className="teacher-nav"
          onClick={() => navigate("/teacher/attendance/history")}
        >
          <History size={18} /> Attendance History
        </button>

        <button className="teacher-nav logout" onClick={logout}>
          <LogOut size={18} /> Logout
        </button>
      </aside>

      <main className="teacher-main">
        <header className="teacher-header">
          <div>
            <h1>Teacher Dashboard</h1>
            <p>Manage your classes and attendance.</p>
          </div>
          <span className="teacher-badge">Teacher</span>
        </header>

        <section className="teacher-welcome">
          <h2>Welcome to your portal!</h2>
          <p>Select an assigned class and subject to mark attendance.</p>
        </section>

        <div className="teacher-section-heading">
          <div>
            <h2>My Assigned Classes</h2>
            <p>Your assigned subjects and classes are listed below.</p>
          </div>
          <span className="assignment-count">
            {assignments.length} Assignments
          </span>
        </div>

        {loading && <p className="teacher-message">Loading assignments...</p>}
        {error && <p className="teacher-error">{error}</p>}

        {!loading && !error && assignments.length === 0 && (
          <div className="teacher-empty">
            No assignments found. Contact your administrator.
          </div>
        )}

        <div className="assignment-grid">
          {assignments.map((item) => (
            <article className="assignment-card" key={item.assignment_id}>
              <div className="assignment-icon">
                <BookOpen size={23} />
              </div>

              <h3>{item.subject_name}</h3>
              <p className="subject-code">{item.subject_code}</p>

              <div className="assignment-details">
                <p><strong>Class:</strong> {item.class_name}</p>
                <p><strong>Section:</strong> {item.section || "-"}</p>
                <p><strong>Semester:</strong> {item.semester}</p>
                <p><strong>Department:</strong> {item.department_name}</p>
              </div>

              <button
                className="primary-button"
                onClick={() =>
                  navigate(
                    `/teacher/attendance/mark/${item.class_id}/${item.subject_id}`
                  )
                }
              >
                <ClipboardCheck size={17} />
                Mark Attendance
              </button>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
