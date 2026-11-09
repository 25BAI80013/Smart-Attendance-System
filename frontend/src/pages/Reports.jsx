
import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import {
  Download,
  RefreshCw,
  Users,
  CalendarCheck,
  TrendingUp,
  AlertTriangle,
  FileBarChart
} from "lucide-react";
import api from "../services/api";
import "./Reports.css";

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    start_date: "",
    end_date: ""
  });

  const loadReports = async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};

      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await api.get("/reports/overview", { params });

      setReport(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load attendance reports."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleFilterSubmit = (event) => {
    event.preventDefault();

    if (
      filters.start_date &&
      filters.end_date &&
      filters.start_date > filters.end_date
    ) {
      setError("Start date cannot be after end date.");
      return;
    }

    loadReports();
  };

  const resetFilters = () => {
    setFilters({ start_date: "", end_date: "" });
    setError("");

    setLoading(true);
    api.get("/reports/overview")
      .then((response) => setReport(response.data))
      .catch((err) =>
        setError(
          err.response?.data?.message || "Unable to load attendance reports."
        )
      )
      .finally(() => setLoading(false));
  };

  const downloadCSV = () => {
    if (!report) return;

    const rows = [
      ["ATTENDANCE REPORT"],
      [],
      ["OVERALL SUMMARY"],
      ["Total Sessions", report.summary?.total_sessions ?? 0],
      ["Total Records", report.summary?.total_records ?? 0],
      ["Present", report.summary?.present_count ?? 0],
      ["Absent", report.summary?.absent_count ?? 0],
      ["Overall Attendance %", report.summary?.overall_percentage ?? 0],
      [],
      ["CLASS REPORT"],
      ["Class", "Section", "Total Records", "Present", "Absent", "Attendance %"],
      ...(report.classReports || []).map((item) => [
        item.class_name,
        item.section || "",
        item.total_records,
        item.present_count,
        item.absent_count,
        item.attendance_percentage ?? 0
      ]),
      [],
      ["SUBJECT REPORT"],
      ["Subject", "Code", "Total Records", "Present", "Absent", "Attendance %"],
      ...(report.subjectReports || []).map((item) => [
        item.subject_name,
        item.subject_code,
        item.total_records,
        item.present_count,
        item.absent_count,
        item.attendance_percentage ?? 0
      ]),
      [],
      ["LOW ATTENDANCE STUDENTS"],
      ["UID", "Student", "Class", "Subject", "Total Classes", "Present", "Absent", "Attendance %"],
      ...(report.lowAttendanceStudents || []).map((item) => [
        item.uid,
        item.student_name,
        `${item.class_name}${item.section ? ` - ${item.section}` : ""}`,
        item.subject_name,
        item.total_classes,
        item.present_classes,
        item.absent_classes,
        item.attendance_percentage ?? 0
      ])
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "attendance-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const summary = report?.summary || {};

  const classChartData = (report?.classReports || []).map((item) => ({
    name: `${item.class_name}${item.section ? `-${item.section}` : ""}`,
    attendance: Number(item.attendance_percentage || 0)
  }));

  const subjectChartData = (report?.subjectReports || []).map((item) => ({
    name: item.subject_code || item.subject_name,
    attendance: Number(item.attendance_percentage || 0)
  }));

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <h1>Attendance Reports</h1>
          <p>Monitor attendance performance across classes and subjects.</p>
        </div>

        <button
          className="report-export-btn"
          onClick={downloadCSV}
          disabled={!report}
        >
          <Download size={17} />
          Export CSV
        </button>
      </div>

      <form className="report-filter-panel" onSubmit={handleFilterSubmit}>
        <div className="report-filter-field">
          <label>Start Date</label>
          <input
            type="date"
            value={filters.start_date}
            onChange={(e) =>
              setFilters({ ...filters, start_date: e.target.value })
            }
          />
        </div>

        <div className="report-filter-field">
          <label>End Date</label>
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) =>
              setFilters({ ...filters, end_date: e.target.value })
            }
          />
        </div>

        <button type="submit" className="report-apply-btn" disabled={loading}>
          Apply Filters
        </button>

        <button
          type="button"
          className="report-reset-btn"
          onClick={resetFilters}
          disabled={loading}
        >
          <RefreshCw size={15} />
          Reset
        </button>
      </form>

      {error && <div className="report-error">{error}</div>}

      {loading && <div className="report-loading">Loading reports...</div>}

      {!loading && report && (
        <>
          <section className="report-stat-grid">
            <article className="report-stat-card">
              <div className="report-stat-icon blue">
                <CalendarCheck />
              </div>
              <p>Total Sessions</p>
              <h2>{summary.total_sessions ?? 0}</h2>
            </article>

            <article className="report-stat-card">
              <div className="report-stat-icon green">
                <Users />
              </div>
              <p>Present Records</p>
              <h2>{summary.present_count ?? 0}</h2>
            </article>

            <article className="report-stat-card">
              <div className="report-stat-icon red">
                <AlertTriangle />
              </div>
              <p>Absent Records</p>
              <h2>{summary.absent_count ?? 0}</h2>
            </article>

            <article className="report-stat-card">
              <div className="report-stat-icon purple">
                <TrendingUp />
              </div>
              <p>Overall Attendance</p>
              <h2>{summary.overall_percentage ?? 0}%</h2>
            </article>
          </section>

          <section className="report-chart-grid">
            <article className="report-panel">
              <h2>Class-wise Attendance</h2>

              {classChartData.length === 0 ? (
                <p className="report-empty">No class attendance data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={classChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="attendance" name="Attendance %" fill="#4968c8" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </article>

            <article className="report-panel">
              <h2>Subject-wise Attendance</h2>

              {subjectChartData.length === 0 ? (
                <p className="report-empty">No subject attendance data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={subjectChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="attendance" name="Attendance %" fill="#28a36a" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </article>
          </section>

          <section className="report-panel report-table-panel">
            <div className="report-table-heading">
              <div>
                <h2>Low Attendance Students</h2>
                <p>Students with subject attendance below 75%.</p>
              </div>
              <span className="low-count">
                {report.lowAttendanceStudents?.length || 0} Records
              </span>
            </div>

            {report.lowAttendanceStudents?.length === 0 ? (
              <p className="report-empty">
                No students below the attendance threshold.
              </p>
            ) : (
              <div className="report-table-wrap">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>UID</th>
                      <th>Student</th>
                      <th>Class</th>
                      <th>Subject</th>
                      <th>Present</th>
                      <th>Total</th>
                      <th>Attendance</th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.lowAttendanceStudents.map((student, index) => (
                      <tr
                        key={`${student.student_id}-${student.subject_id}-${index}`}
                      >
                        <td>{student.uid}</td>
                        <td>{student.student_name}</td>
                        <td>
                          {student.class_name}
                          {student.section ? ` - ${student.section}` : ""}
                        </td>
                        <td>{student.subject_name}</td>
                        <td>{student.present_classes}</td>
                        <td>{student.total_classes}</td>
                        <td>
                          <span className="low-attendance-value">
                            {student.attendance_percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="report-panel report-table-panel">
            <h2>Class Summary</h2>
            <div className="report-table-wrap">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Total Records</th>
                    <th>Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {report.classReports.map((item) => (
                    <tr key={item.class_id}>
                      <td>{item.class_name}</td>
                      <td>{item.section || "-"}</td>
                      <td>{item.present_count}</td>
                      <td>{item.absent_count}</td>
                      <td>{item.total_records}</td>
                      <td>{item.attendance_percentage ?? 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="report-panel report-table-panel">
            <h2>Subject Summary</h2>
            <div className="report-table-wrap">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Code</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Total Records</th>
                    <th>Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {report.subjectReports.map((item) => (
                    <tr key={item.subject_id}>
                      <td>{item.subject_name}</td>
                      <td>{item.subject_code}</td>
                      <td>{item.present_count}</td>
                      <td>{item.absent_count}</td>
                      <td>{item.total_records}</td>
                      <td>{item.attendance_percentage ?? 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {!loading && !report && !error && (
        <div className="report-empty">
          <FileBarChart size={32} />
          <p>No report data available.</p>
        </div>
      )}
    </div>
  );
}
