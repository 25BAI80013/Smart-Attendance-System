
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, RefreshCw, X, BookOpen } from "lucide-react";
import api from "../services/api";
import "./Management.css";

const emptyForm = {
  subject_name: "",
  subject_code: "",
  semester: "",
  department_id: ""
};

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
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
      const [subjectResponse, departmentResponse] = await Promise.all([
        api.get("/subjects"),
        api.get("/departments")
      ]);

      setSubjects(
        Array.isArray(subjectResponse.data)
          ? subjectResponse.data
          : subjectResponse.data?.subjects || []
      );

      setDepartments(
        Array.isArray(departmentResponse.data)
          ? departmentResponse.data
          : departmentResponse.data?.departments || []
      );
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load subjects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (subject) => {
    setEditingId(subject.subject_id);
    setForm({
      subject_name: subject.subject_name || "",
      subject_code: subject.subject_code || "",
      semester: String(subject.semester || ""),
      department_id: String(subject.department_id || "")
    });
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      subject_name: form.subject_name.trim(),
      subject_code: form.subject_code.trim().toUpperCase(),
      semester: Number(form.semester),
      department_id: Number(form.department_id)
    };

    try {
      if (editingId) {
        await api.put(`/subjects/${editingId}`, payload);
        setNotice("Subject updated successfully.");
      } else {
        await api.post("/subjects", payload);
        setNotice("Subject created successfully.");
      }

      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save subject.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (subject) => {
    if (!window.confirm(`Delete ${subject.subject_name}?`)) return;

    setError("");
    setNotice("");

    try {
      await api.delete(`/subjects/${subject.subject_id}`);
      setNotice("Subject deleted successfully.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete subject.");
    }
  };

  const filteredSubjects = subjects.filter((subject) => {
    const query = search.toLowerCase();

    return (
      subject.subject_name?.toLowerCase().includes(query) ||
      subject.subject_code?.toLowerCase().includes(query) ||
      subject.department_name?.toLowerCase().includes(query) ||
      String(subject.semester).includes(query)
    );
  });

  return (
    <main className="management-page">
      <header className="management-header">
        <div>
          <span className="management-eyebrow">ACADEMIC SETUP</span>
          <h1>Subject Management</h1>
          <p>Create and manage subjects by department and semester.</p>
        </div>

        <button className="management-primary" onClick={openAdd}>
          <Plus size={18} /> Add Subject
        </button>
      </header>

      {notice && <div className="management-notice success">{notice}</div>}
      {error && !modalOpen && <div className="management-notice error">{error}</div>}

      <section className="management-summary">
        <div className="management-summary-icon"><BookOpen size={23} /></div>
        <div>
          <span>Total Subjects</span>
          <strong>{subjects.length}</strong>
        </div>
      </section>

      <section className="management-panel">
        <div className="management-panel-heading">
          <div>
            <h2>All Subjects</h2>
            <p>Subject codes, departments and semester details.</p>
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
            placeholder="Search subject, code, department or semester..."
          />
        </div>

        {loading ? (
          <div className="management-empty">Loading subjects...</div>
        ) : filteredSubjects.length === 0 ? (
          <div className="management-empty">No subjects found. Add your first subject.</div>
        ) : (
          <div className="management-table-wrap">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Subject Code</th>
                  <th>Semester</th>
                  <th>Department</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.map((subject) => (
                  <tr key={subject.subject_id}>
                    <td>
                      <strong>{subject.subject_name}</strong>
                      <small>ID: {subject.subject_id}</small>
                    </td>
                    <td><span className="management-code">{subject.subject_code}</span></td>
                    <td>{subject.semester}</td>
                    <td>
                      <strong>{subject.department_name}</strong>
                      <small>{subject.department_code}</small>
                    </td>
                    <td>
                      <div className="management-actions">
                        <button className="edit" title="Edit" onClick={() => openEdit(subject)}>
                          <Pencil size={16} />
                        </button>
                        <button className="delete" title="Delete" onClick={() => handleDelete(subject)}>
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
                <h2>{editingId ? "Edit Subject" : "Add Subject"}</h2>
              </div>
              <button className="management-close" onClick={closeModal} disabled={saving} type="button">
                <X size={20} />
              </button>
            </div>

            {error && <div className="management-notice error">{error}</div>}

            <form onSubmit={handleSubmit} className="management-form">
              <label>
                Subject Name
                <input
                  value={form.subject_name}
                  onChange={(event) => setForm({ ...form, subject_name: event.target.value })}
                  placeholder="e.g. Full Stack Development"
                  maxLength={120}
                  required
                />
              </label>

              <label>
                Subject Code
                <input
                  value={form.subject_code}
                  onChange={(event) => setForm({ ...form, subject_code: event.target.value.toUpperCase() })}
                  placeholder="e.g. FSD201"
                  maxLength={30}
                  required
                />
              </label>

              <div className="management-form-grid">
                <label>
                  Semester
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.semester}
                    onChange={(event) => setForm({ ...form, semester: event.target.value })}
                    placeholder="e.g. 5"
                    required
                  />
                </label>

                <label>
                  Department
                  <select
                    value={form.department_id}
                    onChange={(event) => setForm({ ...form, department_id: event.target.value })}
                    required
                  >
                    <option value="">Select department</option>
                    {departments.map((department) => (
                      <option key={department.department_id} value={department.department_id}>
                        {department.department_name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="management-modal-actions">
                <button type="button" className="management-secondary" onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="management-primary" disabled={saving || departments.length === 0}>
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Create Subject"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
