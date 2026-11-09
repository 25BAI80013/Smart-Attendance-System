
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, History } from "lucide-react";
import api from "../services/api";
import "./Student.css";

export default function StudentAttendanceHistory() {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await api.get("/student-portal/history");
      setRecords(response.data.records || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load attendance history"
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter((record) => {
    if (filter === "all") return true;
    return record.status === filter;
  });

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div className="student-main student-history-main">
      <button
        className="student-back-button"
        onClick={() => navigate("/student/dashboard")}
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>

      <header className="student-header">
        <div>
          <h1>Attendance History</h1>
          <p>View all your recorded attendance sessions.</p>
        </div>
      </header>

      <section className="student-history-panel">
        <div className="student-history-heading">
          <div>
            <h2>
              <History size={20} />
              Attendance Records
            </h2>
            <p>{records.length} total records</p>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="student-filter"
          >
            <option value="all">All Records</option>
            <option value="present">Present Only</option>
            <option value="absent">Absent Only</option>
          </select>
        </div>

        {loading && (
          <p className="student-message">Loading attendance history...</p>
        )}

        {error && <div className="student-error">{error}</div>}

        {!loading && !error && filteredRecords.length === 0 && (
          <div className="student-empty">
            No attendance records found.
          </div>
        )}

        {!loading && filteredRecords.length > 0 && (
          <div className="student-table-wrap">
            <table className="student-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subject</th>
                  <th>Subject Code</th>
                  <th>Class</th>
                  <th>Period</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.record_id}>
                    <td>{formatDate(record.session_date)}</td>
                    <td>{record.subject_name}</td>
                    <td>{record.subject_code}</td>
                    <td>
                      {record.class_name}
                      {record.section ? ` - ${record.section}` : ""}
                    </td>
                    <td>{record.period_label || "-"}</td>
                    <td>
                      <span
                        className={`history-status ${
                          record.status === "present"
                            ? "history-present"
                            : "history-absent"
                        }`}
                      >
                        {record.status}
                      </span>
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
