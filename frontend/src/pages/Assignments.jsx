
import { useEffect, useState } from "react";
import { Plus, Trash2, RefreshCw, X, ClipboardList } from "lucide-react";
import api from "../services/api";
import "./Management.css";

const emptyForm = {
  teacher_id: "",
  class_id: "",
  subject_id: ""
};

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [assignmentResponse, teacherResponse, classResponse, subjectResponse] =
        await Promise.all([
          api.get("/assignments"),
          api.get("/teachers"),
          api.get("/classes"),
          api.get("/subjects")
        ]);

      setAssignments(
        Array.isArray(assignmentResponse.data)
          ? assignmentResponse.data
          : assignmentResponse.data?.assignments || []
      );

      setTeachers(
        Array.isArray(teacherResponse.data)
          ? teacherResponse.data
          : teacherResponse.data?.teachers || []
      );

      setClasses(
        Array.isArray(classResponse.data)
          ? classResponse.data
          : classResponse.data?.classes || []
      );

      setSubjects(
        Array.isArray(subjectResponse.data)
          ? subjectResponse.data
          : subjectResponse.data?.subjects || []
      );
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load assignment data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedTeacher = teachers.find(
    (teacher) => String(teacher.teacher_id) === form.teacher_id
  );

  const selectedClass = classes.find(
    (item) => String(item.class_id) === form.class_id
  );

  const activeTeachers = teachers.filter(
    (teacher) => Number(teacher.is_active) === 1
  );

  const availableTeachers = activeTeachers.filter(
    (teacher) =>
      !selectedClass ||
      Number(teacher.department_id) === Number(selectedClass.department_id)
  );

  const availableClasses = classes.filter(
    (item) =>
      !selectedTeacher ||
      Number(item.department_id) === Number(selectedTeacher.department_id)
  );

  const availableSubjects = subjects.filter(
    (subject) =>
      selectedClass &&
      Number(subject.department_id) === Number(selectedClass.department_id) &&
      Number(subject.semester) === Number(selectedClass.semester)
  );

  const openAdd = () => {
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setForm(emptyForm);
    setError("");
  };

  const handleTeacherChange = (value) => {
    setForm({
      teacher_id: value,
      class_id: "",
      subject_id: ""
    });
  };

  const handleClassChange = (value) => {
    setForm((previous) => ({
      ...previous,
      class_id: value,
      subject_id: ""
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      await api.post("/assignments", {
        teacher_id: Number(form.teacher_id),
        class_id: Number(form.class_id),
        subject_id: Number(form.subject_id)
      });

      setNotice("Teacher assigned successfully.");
      setModalOpen(false);
      setForm(emptyForm);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create assignment.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (assignment) => {
    if (!window.confirm(
      `Remove ${assignment.teacher_name}'s assignment for ${assignment.subject_name}?`
    )) return;

    setError("");
    setNotice("");

    try {
      await api.delete(`/assignments/${assignment.assignment_id}`);
      setNotice("Assignment removed successfully.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to remove assignment.");
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const query = search.toLowerCase();

    return (
      assignment.teacher_name?.toLowerCase().includes(query) ||
      assignment.employee_code?.toLowerCase().includes(query) ||
      assignment.class_name?.toLowerCase().includes(query) ||
      assignment.section?.toLowerCase().includes(query) ||
      assignment.subject_name?.toLowerCase().includes(query) ||
      assignment.subject_code?.toLowerCase().includes(query) ||
      assignment.department_name?.toLowerCase().includes(query)
    );
  });

  return (
    <main className="management-page">
      <header className="management-header">
        <div>
          <span className="management-eyebrow">ACADEMIC SETUP</span>
          <h1>Teacher Assignments</h1>
          <p>Assign teachers to matching classes and subjects.</p>
        </div>

        <button
          className="management-primary"
          onClick={openAdd}
          disabled={!activeTeachers.length || !classes.length || !subjects.length}
        >
          <Plus size={18} /> Assign Teacher
        </button>
      </header>

      {notice && <div className="management-notice success">{notice}</div>}
      {error && !modalOpen && <div className="management-notice error">{error}</div>}

      <section className="management-summary">
        <div className="management-summary-icon"><ClipboardList size={23} /></div>
        <div>
          <span>Total Assignments</span>
          <strong>{assignments.length}</strong>
        </div>
      </section>

      <section className="management-panel">
        <div className="management-panel-heading">
          <div>
            <h2>All Teacher Assignments</h2>
            <p>Teacher, class and subject mapping.</p>
          </div>

          <button className="management-secondary" onClick={loadData} disabled={loading}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        <div className="management-search">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search teacher, class or subject..."
          />
        </div>

        {loading ? (
          <div className="management-empty">Loading assignments...</div>
        ) : filteredAssignments.length === 0 ? (
          <div className="management-empty">No assignments found. Assign a teacher to get started.</div>
        ) : (
          <div className="management-table-wrap">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Class</th>
                  <th>Semester</th>
                  <th>Subject</th>
                  <th>Department</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment.assignment_id}>
                    <td>
                      <strong>{assignment.teacher_name}</strong>
                      <small>{assignment.employee_code || "No employee code"}</small>
                    </td>
                    <td>
                      <strong>{assignment.class_name}</strong>
                      <small>Section {assignment.section}</small>
                    </td>
                    <td>{assignment.semester}</td>
                    <td>
                      <strong>{assignment.subject_name}</strong>
                      <small>{assignment.subject_code}</small>
                    </td>
                    <td>{assignment.department_name}</td>
                    <td>
                      <div className="management-actions">
                        <button
                          className="delete"
                          title="Remove assignment"
                          onClick={() => handleDelete(assignment)}
                        >
                          <Trash2 size={16} />
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

      {modalOpen && (
        <div className="management-overlay" onMouseDown={closeModal}>
          <section className="management-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="management-modal-heading">
              <div>
                <span className="management-eyebrow">ACADEMIC SETUP</span>
                <h2>Assign Teacher</h2>
              </div>

              <button className="management-close" onClick={closeModal} disabled={saving} type="button">
                <X size={20} />
              </button>
            </div>

            {error && <div className="management-notice error">{error}</div>}

            <form onSubmit={handleSubmit} className="management-form">
              <label>
                Teacher
                <select
                  value={form.teacher_id}
                  onChange={(event) => handleTeacherChange(event.target.value)}
                  required
                >
                  <option value="">Select teacher</option>
                  {availableTeachers.map((teacher) => (
                    <option key={teacher.teacher_id} value={teacher.teacher_id}>
                      {teacher.name} — {teacher.employee_code || "No code"}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Class
                <select
                  value={form.class_id}
                  onChange={(event) => handleClassChange(event.target.value)}
                  required
                  disabled={!form.teacher_id}
                >
                  <option value="">Select class</option>
                  {availableClasses.map((item) => (
                    <option key={item.class_id} value={item.class_id}>
                      {item.class_name} — Section {item.section}, Semester {item.semester}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Subject
                <select
                  value={form.subject_id}
                  onChange={(event) =>
                    setForm({ ...form, subject_id: event.target.value })
                  }
                  required
                  disabled={!form.class_id}
                >
                  <option value="">Select subject</option>
                  {availableSubjects.map((subject) => (
                    <option key={subject.subject_id} value={subject.subject_id}>
                      {subject.subject_name} ({subject.subject_code})
                    </option>
                  ))}
                </select>

                {form.class_id && availableSubjects.length === 0 && (
                  <small>No subjects match this class's department and semester. Create the subject first.</small>
                )}
              </label>

              <div className="management-modal-actions">
                <button type="button" className="management-secondary" onClick={closeModal} disabled={saving}>
                  Cancel
                </button>

                <button
                  type="submit"
                  className="management-primary"
                  disabled={saving || !form.teacher_id || !form.class_id || !form.subject_id}
                >
                  {saving ? "Assigning..." : "Create Assignment"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
