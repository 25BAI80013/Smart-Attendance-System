
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Users } from "lucide-react";
import api from "../services/api";
import "./Teacher.css";

const getToday = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10);
};

export default function MarkAttendance() {
  const { classId, subjectId } = useParams();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [date, setDate] = useState(getToday());
  const [period, setPeriod] = useState("");
  const [attendance, setAttendance] = useState({});
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedAssignment = assignments.find(
    (item) =>
      Number(item.class_id) === Number(classId) &&
      Number(item.subject_id) === Number(subjectId)
  );

  useEffect(() => {
    loadPage();
  }, [classId, subjectId]);

  const loadPage = async () => {
    setLoading(true);
    setError("");

    try {
      const [assignmentResponse, studentResponse] = await Promise.all([
        api.get("/attendance/assignments"),
        api.get(
          `/attendance/classes/${classId}/subjects/${subjectId}/students`
        ),
      ]);

      setAssignments(assignmentResponse.data.assignments || []);

      const studentList = studentResponse.data.students || [];
      setStudents(studentList);

      const initialAttendance = {};
      studentList.forEach((student) => {
        initialAttendance[student.student_id] = "present";
      });

      setAttendance(initialAttendance);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load students");
    } finally {
      setLoading(false);
    }
  };

  const loadExistingSession = async () => {
    if (!date || !period.trim()) {
      setError("Select date and enter period first.");
      return;
    }

    setError("");
    setMessage("");

    try {
      const response = await api.get("/attendance/sessions", {
        params: {
          class_id: classId,
          subject_id: subjectId,
          session_date: date,
          period_label: period.trim(),
        },
      });

      if (response.data.exists) {
        const existingRecords = {};
        response.data.records.forEach((record) => {
          existingRecords[record.student_id] = record.status;
        });

        setAttendance(existingRecords);
        setSessionId(response.data.session.session_id);
        setMessage("Existing attendance loaded. You can edit it.");
      } else {
        setSessionId(null);

        const freshAttendance = {};
        students.forEach((student) => {
          freshAttendance[student.student_id] = "present";
        });

        setAttendance(freshAttendance);
        setMessage("No previous session found. New attendance is ready.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to check session");
    }
  };

  const changeStatus = (studentId, status) => {
    setAttendance((previous) => ({
      ...previous,
      [studentId]: status,
    }));
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach((student) => {
      updated[student.student_id] = status;
    });
    setAttendance(updated);
  };

  const saveAttendance = async () => {
    setError("");
    setMessage("");

    if (!date || !period.trim()) {
      setError("Date and period are required.");
      return;
    }

    if (!students.length) {
      setError("No students found for this class and subject.");
      return;
    }

    const records = students.map((student) => ({
      student_id: Number(student.student_id),
      status: attendance[student.student_id] || "present",
    }));

    setSaving(true);

    try {
      const payload = {
        class_id: Number(classId),
        subject_id: Number(subjectId),
        session_date: date,
        period_label: period.trim(),
        records,
      };

      if (sessionId) {
        await api.put(`/attendance/sessions/${sessionId}`, { records });
        setMessage("Attendance updated successfully!");
      } else {
        const response = await api.post("/attendance/sessions", payload);
        setSessionId(response.data.session_id);
        setMessage("Attendance saved successfully!");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const presentCount = students.filter(
    (student) => attendance[student.student_id] === "present"
  ).length;

  const absentCount = students.filter(
    (student) => attendance[student.student_id] === "absent"
  ).length;

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
          <h1>Mark Attendance</h1>
          <p>Record attendance for your assigned students.</p>
        </div>
      </header>

      {selectedAssignment && (
        <section className="attendance-info">
          <h2>{selectedAssignment.subject_name}</h2>
          <p>
            {selectedAssignment.class_name} - Section {selectedAssignment.section}
            {" | "}Semester {selectedAssignment.semester}
          </p>
        </section>
      )}

      <section className="attendance-panel">
        <div className="attendance-filters">
          <label>
            Attendance Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>

          <label>
            Period / Lecture
            <input
              type="text"
              maxLength="30"
              placeholder="Example: Lecture 1"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </label>

          <button className="secondary-button" onClick={loadExistingSession}>
            Load Existing Session
          </button>
        </div>

        {message && <p className="teacher-success">{message}</p>}
        {error && <p className="teacher-error">{error}</p>}

        <div className="attendance-summary">
          <div><strong>{students.length}</strong><span>Total Students</span></div>
          <div><strong>{presentCount}</strong><span>Present</span></div>
          <div><strong>{absentCount}</strong><span>Absent</span></div>
        </div>

        <div className="attendance-list-heading">
          <h2><Users size={20} /> Student List</h2>
          <div className="bulk-actions">
            <button onClick={() => markAll("present")}>All Present</button>
            <button onClick={() => markAll("absent")}>All Absent</button>
          </div>
        </div>

        {loading ? (
          <p className="teacher-message">Loading students...</p>
        ) : students.length === 0 ? (
          <div className="teacher-empty">No enrolled students found.</div>
        ) : (
          <div className="attendance-table-wrap">
            <table className="teacher-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>UID</th>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Attendance</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student, index) => (
                  <tr key={student.student_id}>
                    <td>{index + 1}</td>
                    <td>{student.uid}</td>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>
                      <div className="status-buttons">
                        <button
                          className={attendance[student.student_id] === "present" ? "status-present selected" : "status-present"}
                          onClick={() => changeStatus(student.student_id, "present")}
                        >
                          Present
                        </button>

                        <button
                          className={attendance[student.student_id] === "absent" ? "status-absent selected" : "status-absent"}
                          onClick={() => changeStatus(student.student_id, "absent")}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          className="primary-button save-attendance"
          onClick={saveAttendance}
          disabled={saving || loading || students.length === 0}
        >
          <Save size={18} />
          {saving ? "Saving..." : sessionId ? "Update Attendance" : "Save Attendance"}
        </button>
      </section>
    </div>
  );
}
