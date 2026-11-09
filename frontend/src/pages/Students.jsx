
import { useEffect, useMemo, useState } from "react";
import {
  Search, Plus, Users, GraduationCap, UserCheck,
  Pencil, Trash2, X, RefreshCw, Hash, AlertCircle
} from "lucide-react";
import api from "../services/api";
import "./Students.css";

const emptyForm = {
  name: "",
  email: "",
  uid: "",
  password: "",
  class_id: ""
};

export default function Students() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [studentResponse, classResponse] = await Promise.all([
        api.get("/students"),
        api.get("/classes")
      ]);

      setStudents(studentResponse.data.students || []);
      setClasses(classResponse.data.classes || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load students or classes. Please login again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return students;

    return students.filter((student) =>
      [
        student.name,
        student.email,
        student.uid,
        student.class_name,
        student.department_name,
        student.section
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [students, search]);

  const openAddModal = () => {
    setEditingStudent(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setForm({
      name: student.name || "",
      email: student.email || "",
      uid: student.uid || "",
      password: "",
      class_id: String(student.class_id || "")
    });
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingStudent(null);
    setForm(emptyForm);
    setError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        uid: form.uid.trim(),
        class_id: Number(form.class_id)
      };

      if (editingStudent) {
        await api.put(
          `/students/${editingStudent.student_id}`,
          payload
        );
        setNotice("Student details updated successfully.");
      } else {
        await api.post("/students", {
          ...payload,
          password: form.password
        });
        setNotice("Student added successfully.");
      }

      setModalOpen(false);
      setEditingStudent(null);
      setForm(emptyForm);
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (student) => {
    const confirmed = window.confirm(
      `Deactivate ${student.name}? They will no longer be able to log in.`
    );

    if (!confirmed) return;

    setNotice("");
    setError("");

    try {
      await api.delete(`/students/${student.student_id}`);
      setNotice(`${student.name} has been deactivated.`);
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to deactivate this student."
      );
    }
  };

  return (
    <main className="students-page">
      <header className="students-header">
        <div>
          <span className="students-eyebrow">ADMINISTRATION</span>
          <h1>Student Management</h1>
          <p>Manage student profiles, class details and accounts.</p>
        </div>

        <button className="student-primary-btn" onClick={openAddModal}>
          <Plus size={18} />
          Add Student
        </button>
      </header>

      {notice && (
        <div className="student-alert student-alert-success">
          <UserCheck size={18} />
          {notice}
          <button onClick={() => setNotice("")} aria-label="Close">
            <X size={16} />
          </button>
        </div>
      )}

      {error && !modalOpen && (
        <div className="student-alert student-alert-error">
          <AlertCircle size={18} />
          {error}
          <button onClick={() => setError("")} aria-label="Close">
            <X size={16} />
          </button>
        </div>
      )}

      <section className="student-stats">
        <article className="student-stat-card">
          <div className="student-stat-icon purple">
            <Users size={21} />
          </div>
          <div>
            <span>Total Active Students</span>
            <strong>{students.length}</strong>
          </div>
        </article>

        <article className="student-stat-card">
          <div className="student-stat-icon blue">
            <GraduationCap size={21} />
          </div>
          <div>
            <span>Available Classes</span>
            <strong>{classes.length}</strong>
          </div>
        </article>

        <article className="student-stat-card">
          <div className="student-stat-icon green">
            <UserCheck size={21} />
          </div>
          <div>
            <span>Students Displayed</span>
            <strong>{filteredStudents.length}</strong>
          </div>
        </article>
      </section>

      <section className="students-panel">
        <div className="students-panel-heading">
          <div>
            <h2>All Students</h2>
            <p>Search and manage registered student accounts.</p>
          </div>

          <button
            className="student-refresh-btn"
            onClick={loadData}
            disabled={loading}
            title="Refresh students and classes"
          >
            <RefreshCw size={17} className={loading ? "spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="students-toolbar">
          <div className="student-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by name, email, UID or class..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="Clear search">
                <X size={16} />
              </button>
            )}
          </div>
          <span className="student-result-count">
            {filteredStudents.length} result(s)
          </span>
        </div>

        {loading ? (
          <div className="students-empty">
            <RefreshCw className="spin" size={25} />
            <p>Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="students-empty">
            <Users size={34} />
            <h3>{search ? "No matching students" : "No students found"}</h3>
            <p>
              {search
                ? "Try another search term."
                : "Add your first student to get started."}
            </p>
          </div>
        ) : (
          <div className="students-table-wrap">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>UID</th>
                  <th>Class</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.student_id}>
                    <td>
                      <div className="student-person">
                        <div className="student-avatar">
                          {(student.name || "S").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{student.name}</strong>
                          <span>{student.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="student-uid">
                        <Hash size={14} />
                        {student.uid}
                      </span>
                    </td>

                    <td>
                      <strong>{student.class_name}</strong>
                      <span className="student-subtext">
                        Section {student.section} · Semester {student.semester}
                      </span>
                    </td>

                    <td>{student.department_name}</td>

                    <td>
                      <span className="student-status">
                        <span />
                        Active
                      </span>
                    </td>

                    <td>
                      <div className="student-actions">
                        <button
                          className="student-action-edit"
                          onClick={() => openEditModal(student)}
                          title="Edit student"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="student-action-delete"
                          onClick={() => handleDeactivate(student)}
                          title="Deactivate student"
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
        <div
          className="student-modal-overlay"
          onMouseDown={closeModal}
        >
          <section
            className="student-modal"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-modal-title"
          >
            <div className="student-modal-header">
              <div>
                <span className="students-eyebrow">STUDENT ACCOUNT</span>
                <h2 id="student-modal-title">
                  {editingStudent ? "Edit Student" : "Add New Student"}
                </h2>
              </div>

              <button
                className="student-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="student-alert student-alert-error">
                <AlertCircle size={17} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <label>
                Full Name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter student name"
                  required
                  maxLength={100}
                />
              </label>

              <label>
                Email Address
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="student@example.com"
                  required
                  maxLength={150}
                />
              </label>

              <label>
                Student UID
                <input
                  name="uid"
                  value={form.uid}
                  onChange={handleChange}
                  placeholder="Enter unique student UID"
                  required
                  maxLength={30}
                />
              </label>

              {!editingStudent && (
                <label>
                  Initial Password
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    required
                  />
                </label>
              )}

              <label>
                Select Class
                <select
                  name="class_id"
                  value={form.class_id}
                  onChange={handleChange}
                  required
                  disabled={classes.length === 0}
                >
                  <option value="">Choose a class</option>

                  {classes.map((classItem) => (
                    <option
                      key={classItem.class_id}
                      value={classItem.class_id}
                    >
                      {classItem.class_name} - Section {classItem.section}
                      {" | Semester "}
                      {classItem.semester}
                      {" | "}
                      {classItem.department_name}
                    </option>
                  ))}
                </select>

                {classes.length === 0 && (
                  <small>
                    No classes available. Create a class first.
                  </small>
                )}
              </label>

              <div className="student-modal-actions">
                <button
                  type="button"
                  className="student-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="student-primary-btn"
                  disabled={saving || classes.length === 0}
                >
                  {saving
                    ? "Saving..."
                    : editingStudent
                    ? "Save Changes"
                    : "Create Student"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
