import React, { useCallback, useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  Save,
  X,
  CalendarDays,
  ClipboardCheck,
  Users,
  CheckCircle,
  XCircle,
  Filter
} from "lucide-react";
import api from "../services/api";
import "./Attendance.css";

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    class_id: "",
    subject_id: "",
    teacher_id: "",
    start_date: "",
    end_date: "",
    status: ""
  });

  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState("present");
  const [saving, setSaving] = useState(false);

  const getArray = (data, keys) => {
    if (Array.isArray(data)) return data;

    for (const key of keys) {
      if (Array.isArray(data?.[key])) return data[key];
    }

    return [];
  };

  const loadFilters = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        api.get("/classes"),
        api.get("/subjects"),
        api.get("/teachers")
      ]);

      if (results[0].status === "fulfilled") {
        setClasses(getArray(results[0].value.data, ["classes", "data"]));
      }

      if (results[1].status === "fulfilled") {
        setSubjects(getArray(results[1].value.data, ["subjects", "data"]));
      }

      if (results[2].status === "fulfilled") {
        setTeachers(getArray(results[2].value.data, ["teachers", "data"]));
      }
    } catch (err) {
      console.error("Attendance filter loading error:", err);
    }
  }, []);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });

      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await api.get("/attendance/admin/records", {
        params
      });

      setRecords(response.data.records || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load attendance records."
      );
    } finally {
      setLoading(false);
    }
  }, [filters, search]);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRecords();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadRecords]);

  const updateFilter = (key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setSearch("");
    setFilters({
      class_id: "",
      subject_id: "",
      teacher_id: "",
      start_date: "",
      end_date: "",
      status: ""
    });
  };

  const startEditing = (record) => {
    setEditingId(record.record_id);
    setEditStatus(record.status);
    setError("");
    setSuccess("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditStatus("present");
  };

  const saveAttendance = async (recordId) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.patch(`/attendance/admin/records/${recordId}`, {
        status: editStatus
      });

      setSuccess("Attendance updated successfully.");
      setEditingId(null);
      await loadRecords();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to update attendance."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (record) => {
    const confirmed = window.confirm(
      `Delete attendance for ${record.student_name} (${record.uid})? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(
        `/attendance/admin/records/${record.record_id}`
      );

      setSuccess("Attendance record deleted successfully.");
      await loadRecords();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to delete attendance record."
      );
    }
  };

  const deleteSession = async (record) => {
    const confirmed = window.confirm(
      `WARNING: Delete the COMPLETE attendance session?\n\nClass: ${record.class_name} - ${record.section}\nSubject: ${record.subject_name}\nDate: ${formatDate(record.session_date)}\nPeriod: ${record.period_label}\n\nAll student attendance records in this session will be deleted permanently.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(
        `/attendance/admin/sessions/${record.session_id}`
      );

      setSuccess("Complete attendance session deleted successfully.");
      await loadRecords();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to delete attendance session."
      );
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) return "-";

    return value.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC"
    });
  };

  const presentCount = records.filter(
    (record) => record.status === "present"
  ).length;

  const absentCount = records.filter(
    (record) => record.status === "absent"
  ).length;

  const sessionIds = [...new Set(
    records.map((record) => record.session_id)
  )];

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  return (
    <div className="admin-attendance-page">

      <header className="attendance-page-header">
        <div>
          <span className="attendance-eyebrow">
            ADMINISTRATION
          </span>

          <h1>
            <ClipboardCheck size={29} />
            Attendance Management
          </h1>

          <p>
            Monitor, edit and manage all student attendance records.
          </p>
        </div>

        <button
          className="attendance-refresh-button"
          onClick={() => {
            resetMessages();
            loadRecords();
          }}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={loading ? "attendance-spinning" : ""}
          />
          Refresh
        </button>
      </header>

      {error && (
        <div className="attendance-alert attendance-error">
          <XCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="attendance-alert attendance-success">
          <CheckCircle size={18} />
          {success}
          <button onClick={() => setSuccess("")}>
            <X size={16} />
          </button>
        </div>
      )}

      <section className="attendance-stats-grid">

        <div className="attendance-stat-card">
          <div className="attendance-stat-icon blue">
            <Users size={23} />
          </div>
          <div>
            <span>Total Records</span>
            <h2>{loading ? "..." : records.length}</h2>
          </div>
        </div>

        <div className="attendance-stat-card">
          <div className="attendance-stat-icon green">
            <CheckCircle size={23} />
          </div>
          <div>
            <span>Present</span>
            <h2>{loading ? "..." : presentCount}</h2>
          </div>
        </div>

        <div className="attendance-stat-card">
          <div className="attendance-stat-icon red">
            <XCircle size={23} />
          </div>
          <div>
            <span>Absent</span>
            <h2>{loading ? "..." : absentCount}</h2>
          </div>
        </div>

        <div className="attendance-stat-card">
          <div className="attendance-stat-icon purple">
            <CalendarDays size={23} />
          </div>
          <div>
            <span>Sessions</span>
            <h2>{loading ? "..." : sessionIds.length}</h2>
          </div>
        </div>

      </section>

      <section className="attendance-management-card">

        <div className="attendance-card-heading">
          <div>
            <h2>All Attendance Records</h2>
            <p>
              Search, filter, edit or delete attendance records.
            </p>
          </div>
        </div>

        <div className="attendance-search-row">
          <div className="attendance-search-box">
            <Search size={19} />
            <input
              type="text"
              placeholder="Search student name, UID or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            className="attendance-clear-button"
            onClick={clearFilters}
          >
            <X size={16} />
            Clear Filters
          </button>
        </div>

        <div className="attendance-filters">

          <div className="attendance-filter-field">
            <label>Class</label>
            <select
              value={filters.class_id}
              onChange={(e) =>
                updateFilter("class_id", e.target.value)
              }
            >
              <option value="">All Classes</option>
              {classes.map((item) => (
                <option key={item.class_id} value={item.class_id}>
                  {item.class_name} {item.section ? `- ${item.section}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="attendance-filter-field">
            <label>Subject</label>
            <select
              value={filters.subject_id}
              onChange={(e) =>
                updateFilter("subject_id", e.target.value)
              }
            >
              <option value="">All Subjects</option>
              {subjects.map((item) => (
                <option key={item.subject_id} value={item.subject_id}>
                  {item.subject_name}
                </option>
              ))}
            </select>
          </div>

          <div className="attendance-filter-field">
            <label>Teacher</label>
            <select
              value={filters.teacher_id}
              onChange={(e) =>
                updateFilter("teacher_id", e.target.value)
              }
            >
              <option value="">All Teachers</option>
              {teachers.map((item) => (
                <option key={item.teacher_id} value={item.teacher_id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="attendance-filter-field">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) =>
                updateFilter("status", e.target.value)
              }
            >
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </div>

          <div className="attendance-filter-field">
            <label>From Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) =>
                updateFilter("start_date", e.target.value)
              }
            />
          </div>

          <div className="attendance-filter-field">
            <label>To Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) =>
                updateFilter("end_date", e.target.value)
              }
            />
          </div>

        </div>

        <div className="attendance-results-heading">
          <span>
            <Filter size={16} />
            {records.length} records found
          </span>
          <span>All times and dates are shown from saved records.</span>
        </div>

        <div className="attendance-table-wrapper">

          <table className="admin-attendance-table">

            <thead>
              <tr>
                <th>STUDENT</th>
                <th>CLASS</th>
                <th>SUBJECT</th>
                <th>TEACHER</th>
                <th>DATE / PERIOD</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td colSpan="7" className="attendance-empty">
                    Loading attendance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="7" className="attendance-empty">
                    <ClipboardCheck size={38} />
                    <strong>No attendance records found</strong>
                    <span>Try changing your search or filters.</span>
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.record_id}>

                    <td>
                      <div className="attendance-student-cell">
                        <div className="attendance-avatar">
                          {record.student_name?.charAt(0)?.toUpperCase() || "S"}
                        </div>

                        <div>
                          <strong>{record.student_name}</strong>
                          <span>UID: {record.uid}</span>
                          <small>{record.student_email}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <strong>{record.class_name}</strong>
                      <span className="attendance-subtext">
                        Section {record.section}
                      </span>
                    </td>

                    <td>
                      <strong>{record.subject_name}</strong>
                      <span className="attendance-subtext">
                        {record.subject_code}
                      </span>
                    </td>

                    <td>{record.teacher_name}</td>

                    <td>
                      <strong>{formatDate(record.session_date)}</strong>
                      <span className="attendance-subtext">
                        Period {record.period_label}
                      </span>
                    </td>

                    <td>
                      {editingId === record.record_id ? (
                        <select
                          className="attendance-edit-select"
                          value={editStatus}
                          onChange={(e) =>
                            setEditStatus(e.target.value)
                          }
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                        </select>
                      ) : (
                        <span
                          className={`attendance-status-badge ${
                            record.status === "present"
                              ? "present"
                              : "absent"
                          }`}
                        >
                          {record.status === "present"
                            ? "Present"
                            : "Absent"}
                        </span>
                      )}
                    </td>

                    <td>
                      <div className="attendance-action-buttons">

                        {editingId === record.record_id ? (
                          <>
                            <button
                              className="attendance-action save"
                              title="Save changes"
                              onClick={() =>
                                saveAttendance(record.record_id)
                              }
                              disabled={saving}
                            >
                              <Save size={17} />
                            </button>

                            <button
                              className="attendance-action cancel"
                              title="Cancel"
                              onClick={cancelEditing}
                              disabled={saving}
                            >
                              <X size={17} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="attendance-action edit"
                              title="Edit attendance"
                              onClick={() => startEditing(record)}
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              className="attendance-action delete"
                              title="Delete attendance record"
                              onClick={() => deleteRecord(record)}
                            >
                              <Trash2 size={17} />
                            </button>
                          </>
                        )}

                        {record.record_id === Math.min(
                          ...records
                            .filter((item) =>
                              item.session_id === record.session_id
                            )
                            .map((item) => item.record_id)
                        ) && (
                          <button
                            className="attendance-action delete-session"
                            title="Delete complete attendance session"
                            onClick={() => deleteSession(record)}
                          >
                            <CalendarDays size={17} />
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

        <div className="attendance-table-footer">
          <span>
            Showing {records.length} attendance records
          </span>
          <span>
            {sessionIds.length} unique sessions
          </span>
        </div>

      </section>

    </div>
  );
}