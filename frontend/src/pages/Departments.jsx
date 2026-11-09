
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, RefreshCw, X, Building2 } from "lucide-react";
import api from "../services/api";
import "./Management.css";

const emptyForm = { department_name: "", department_code: "" };

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadDepartments = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/departments");
      setDepartments(response.data.departments || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load departments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (department) => {
    setEditingId(department.department_id);
    setForm({
      department_name: department.department_name,
      department_code: department.department_code
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
        department_name: form.department_name.trim(),
        department_code: form.department_code.trim().toUpperCase()
      };

      if (editingId) {
        await api.put(`/departments/${editingId}`, payload);
        setNotice("Department updated successfully.");
      } else {
        await api.post("/departments", payload);
        setNotice("Department created successfully.");
      }

      closeModal();
      await loadDepartments();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save department.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (department) => {
    if (!window.confirm(
      `Delete ${department.department_name}? This is only allowed when no classes are assigned.`
    )) return;

    setError("");
    setNotice("");

    try {
      await api.delete(`/departments/${department.department_id}`);
      setNotice("Department deleted successfully.");
      await loadDepartments();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete department.");
    }
  };

  return (
    <main className="management-page">
      <header className="management-header">
        <div>
          <span className="management-eyebrow">ADMINISTRATION</span>
          <h1>Department Management</h1>
          <p>Create and manage academic departments.</p>
        </div>
        <button className="management-primary" onClick={openAdd}>
          <Plus size={18} /> Add Department
        </button>
      </header>

      {notice && <div className="management-notice success">{notice}</div>}
      {error && !modalOpen && <div className="management-notice error">{error}</div>}

      <section className="management-summary">
        <div className="management-summary-icon"><Building2 size={23} /></div>
        <div>
          <span>Total Departments</span>
          <strong>{departments.length}</strong>
        </div>
      </section>

      <section className="management-panel">
        <div className="management-panel-heading">
          <div>
            <h2>All Departments</h2>
            <p>Department names, codes and assigned classes.</p>
          </div>
          <button className="management-secondary" onClick={loadDepartments} disabled={loading}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="management-empty">Loading departments...</div>
        ) : departments.length === 0 ? (
          <div className="management-empty">No departments found. Add your first department.</div>
        ) : (
          <div className="management-table-wrap">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Department Code</th>
                  <th>Total Classes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((department) => (
                  <tr key={department.department_id}>
                    <td>
                      <strong>{department.department_name}</strong>
                      <small>ID: {department.department_id}</small>
                    </td>
                    <td><span className="management-code">{department.department_code}</span></td>
                    <td>{department.total_classes ?? 0}</td>
                    <td>
                      <div className="management-actions">
                        <button className="edit" title="Edit" onClick={() => openEdit(department)}>
                          <Pencil size={16} />
                        </button>
                        <button className="delete" title="Delete" onClick={() => handleDelete(department)}>
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
                <h2>{editingId ? "Edit Department" : "Add Department"}</h2>
              </div>
              <button className="management-close" onClick={closeModal} disabled={saving}>
                <X size={20} />
              </button>
            </div>

            {error && <div className="management-notice error">{error}</div>}

            <form onSubmit={handleSubmit} className="management-form">
              <label>
                Department Name
                <input
                  value={form.department_name}
                  onChange={(event) => setForm({ ...form, department_name: event.target.value })}
                  placeholder="e.g. Computer Science and Engineering"
                  maxLength={100}
                  required
                />
              </label>
              <label>
                Department Code
                <input
                  value={form.department_code}
                  onChange={(event) => setForm({ ...form, department_code: event.target.value.toUpperCase() })}
                  placeholder="e.g. CSE"
                  maxLength={20}
                  required
                />
              </label>
              <div className="management-modal-actions">
                <button type="button" className="management-secondary" onClick={closeModal} disabled={saving}>Cancel</button>
                <button type="submit" className="management-primary" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Create Department"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
