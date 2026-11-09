
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, History } from "lucide-react";
import api from "../services/api";
import "./Teacher.css";

export default function AttendanceHistory() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await api.get("/attendance/history");
      setSessions(response.data.sessions || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load history");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="teacher-main attendance-main">
      <button
        className="back-button"
        onClick={() => navigate("/teacher/dashboard")}
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <header className="teacher-header">
        <div>
          <h1>Attendance History</h1>
          <p>Review your previously recorded attendance sessions.</p>
        </div>
      </header>

      <section className="attendance-panel">
        <h2><History size={20} /> Previous Sessions</h2>

        {loading && <p className="teacher-message">Loading history...</p>}
        {error && <p className="teacher-error">{error}</p>}

        {!loading && !error && sessions.length === 0 && (
          <div className="teacher-empty">No attendance history available.</div>
        )}

        {!loading && sessions.length > 0 && (
          <div className="attendance-table-wrap">
            <table className="teacher-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Period</th>
                  <th>Total</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {sessions.map((session) => (
                  <tr key={session.session_id}>
                    <td>
                      {new Date(session.session_date).toLocaleDateString("en-IN")}
                    </td>
                    <td>{session.class_name} - {session.section}</td>
                    <td>
                      {session.subject_name}
                      <small className="table-subtitle">{session.subject_code}</small>
                    </td>
                    <td>{session.period_label}</td>
                    <td>{session.total_students}</td>
                    <td className="present-text">{session.present_count || 0}</td>
                    <td className="absent-text">{session.absent_count || 0}</td>
                    <td>
                      <button
                        className="small-action"
                        onClick={() =>
                          navigate(
                            `/teacher/attendance/mark/${session.class_id}/${session.subject_id}`
                          )
                        }
                      >
                        Open / Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
