
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, RefreshCw, X, GraduationCap } from "lucide-react";
import api from "../services/api";
import "./Management.css";

const emptyForm = {
  class_name: "",
  section: "",
  semester: "",
  department_id: "",
  academic_year: ""
};

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [classResponse, departmentResponse] = await Promise.all([
        api.get("/classes"),
        api.get("/departments")
      ]);
      setClasses(classResponse.data.classes || []);
      setDepartments(departmentResponse.data.departments || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load classes and departments.");
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

  const openEdit = (item) => {
    setEditingId(item.class_id);
    setForm({
      class_name: item.class_name || "",
      section: item.section || "",
      semester: String(item.semester || ""),
      department_id: String(item.department_id || ""),
      academic_year: item.academic_year || ""
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

    try {
      const payload = {
        class_name: form.class_name.trim(),
        section: form.section.trim(),
        semester: Number(form.semester),
        department_id: Number(form.department_id),
        academic_year: form.academic_year.trim()
      };

      if (editingId) {
        await api.put(`/classes/${editingId}`, payload);
        setNotice("Class updated successfully.");
      } else {
        await api.post("/classes", payload);
        setNotice("Class created successfully.");
      }

      closeModal();
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save class.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(
      `Delete ${item.class_name}, Section ${item.section}, Semester ${item.semester}? Classes with assigned students cannot be deleted.`
    )) return;

    setError("");
    setNotice("");

    try {
      await api.delete(`/classes/${item.class_id}`);
      setNotice("Class deleted successfully.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete class.");
    }
  };

  return (
    <main className="management-page">
      <header className="management-header">
        <div>
          <span className="management-eyebrow">ADMINISTRATION</span>
          <h1>Class Management</h1>
          <p>Organize classes, sections, semesters and academic years.</p>
        </div>
        <button className="management-primary" onClick={openAdd}>
          <Plus size={18} /> Add Class
        </button>
      </header>

      {notice && <div className="management-notice success">{notice}</div>}
      {error && !modalOpen && <div className="management-notice error">{error}</div>}

      <section className="management-summary">
        <div className="management-summary-icon"><GraduationCap size={23} /></div>
        <div>
          <span>Total Classes</span>
          <strong>{classes.length}</strong>
        </div>
      </section>

      <section className="management-panel">
        <div className="management-panel-heading">
          <div>
            <h2>All Classes</h2>
            <p>View and manage your institution's classes.</p>
          </div>
          <button className="management-secondary" onClick={loadData} disabled={loading}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="management-empty">Loading classes...</div>
        ) : classes.length === 0 ? (
          <div className="management-empty">No classes found. Add your first class.</div>
        ) : (
          <div className="management-table-wrap">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Semester</th>
                  <th>Department</th>
                  <th>Academic Year</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((item) => (
                  <tr key={item.class_id}>
                    <td>
                      <strong>{item.class_name}</strong>
                      <small>ID: {item.class_id}</small>
                    </td>
                    <td>{item.section}</td>
                    <td>{item.semester}</td>
                    <td>
                      <strong>{item.department_name}</strong>
                      <small>{item.department_code}</small>
                    </td>
                    <td>{item.academic_year || "—"}</td>
                    <td>
                      <div className="management-actions">
                        <button className="edit" title="Edit" onClick={() => openEdit(item)}>
                          <Pencil size={16} />
                        </button>
                        <button className="delete" title="Delete" onClick={() => handleDelete(item)}>
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
                <h2>{editingId ? "Edit Class" : "Add Class"}</h2>
              </div>
              <button className="management-close" onClick={closeModal} disabled={saving}>
                <X size={20} />
              </button>
            </div>

            {error && <div className="management-notice error">{error}</div>}

            <form onSubmit={handleSubmit} className="management-form">
              <label>
                Class Name
                <input
                  value={form.class_name}
                  onChange={(event) => setForm({ ...form, class_name: event.target.value })}
                  placeholder="e.g. B.E. CSE AIML"
                  maxLength={50}
                  required
                />
              </label>

              <div className="management-form-grid">
                <label>
                  Section
                  <input
                    value={form.section}
                    onChange={(event) => setForm({ ...form, section: event.target.value })}
                    placeholder="e.g. A"
                    maxLength={20}
                    required
                  />
                </label>
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
              </div>

              <label>
                Department
                <select
                  value={form.department_id}
                  onChange={(event) => setForm({ ...form, department_id: event.target.value })}
                  required
                  disabled={departments.length === 0}
                >
                  <option value="">Select department</option>
                  {departments.map((department) => (
                    <option key={department.department_id} value={department.department_id}>
                      {department.department_name} ({department.department_code})
                    </option>
                  ))}
                </select>
                {departments.length === 0 && <small>Create a department before adding a class.</small>}
              </label>

              <label>
                Academic Year
                <input
                  value={form.academic_year}
                  onChange={(event) => setForm({ ...form, academic_year: event.target.value })}
                  placeholder="e.g. 2026-2027"
                  maxLength={20}
                />
              </label>

              <div className="management-modal-actions">
                <button type="button" className="management-secondary" onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="management-primary"
                  disabled={saving || departments.length === 0}
                >
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Create Class"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
