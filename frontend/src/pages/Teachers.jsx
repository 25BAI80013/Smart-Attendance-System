
import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, X, Users } from "lucide-react";
import api from "../services/api";
import "./Teachers.css";

const initialForm = {
  name: "",
  email: "",
  password: "",
  employee_code: "",
  department_id: ""
};

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [teacherRes, departmentRes] = await Promise.all([
        api.get("/teachers"),
        api.get("/departments")
      ]);

      // Handle both array and wrapped API responses
      const teacherData = Array.isArray(teacherRes.data)
        ? teacherRes.data
        : teacherRes.data?.teachers || [];

      const departmentData = Array.isArray(departmentRes.data)
        ? departmentRes.data
        : departmentRes.data?.departments || [];

      setTeachers(teacherData);
      setDepartments(departmentData);
    } catch (err) {
      console.error("Teacher loading error:", err);
      setError(
        err.response?.data?.message || "Unable to load teachers and departments"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(initialForm);
    setError("");
    setShowForm(true);
  };

  const openEditForm = (teacher) => {
    setEditingId(teacher.teacher_id);

    setForm({
      name: teacher.name || "",
      email: teacher.email || "",
      password: "",
      employee_code: teacher.employee_code || "",
      department_id: String(teacher.department_id || "")
    });

    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      department_id: Number(form.department_id)
    };

    if (editingId && !payload.password) {
      delete payload.password;
    }

    try {
      if (editingId) {
        await api.put(`/teachers/${editingId}`, payload);
      } else {
        await api.post("/teachers", payload);
      }

      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);

      await loadData();
    } catch (err) {
      console.error("Teacher save error:", err);
      setError(err.response?.data?.message || "Unable to save teacher");
    } finally {
      setSaving(false);
    }
  };

  const deactivateTeacher = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this teacher?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/teachers/${id}`);
      await loadData();
    } catch (err) {
      console.error("Teacher deactivation error:", err);
      setError(
        err.response?.data?.message || "Unable to deactivate teacher"
      );
    }
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const query = search.toLowerCase();

    return (
      teacher.name?.toLowerCase().includes(query) ||
      teacher.email?.toLowerCase().includes(query) ||
      teacher.employee_code?.toLowerCase().includes(query) ||
      teacher.department_name?.toLowerCase().includes(query)
    );
  });

  const activeCount = teachers.filter(
    (teacher) => Number(teacher.is_active) === 1
  ).length;

  return (
    <div className="management-page teachers-page">

      <div className="management-header">
        <div>
          <h1>Teacher Management</h1>
          <p>Manage faculty members and their accounts.</p>
        </div>

        <button
          className="management-primary-btn"
          onClick={openAddForm}
        >
          <Plus size={18} />
          Add Teacher
        </button>
      </div>

      <div className="management-stats">

        <div className="management-stat-card">
          <div className="management-stat-icon">
            <Users size={22} />
          </div>
          <div>
            <span>Total Teachers</span>
            <h2>{teachers.length}</h2>
          </div>
        </div>

        <div className="management-stat-card">
          <div className="management-stat-icon">
            <Users size={22} />
          </div>
          <div>
            <span>Active Teachers</span>
            <h2>{activeCount}</h2>
          </div>
        </div>

      </div>

      <div className="management-toolbar">
        <div className="management-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search name, email, employee code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="management-error">
          {error}
        </div>
      )}

      <div className="management-table-wrapper">

        {loading ? (
          <p className="management-message">Loading teachers...</p>
        ) : (
          <table className="management-table">

            <thead>
              <tr>
                <th>Teacher</th>
                <th>Employee Code</th>
                <th>Department</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="management-message">
                    No teachers found.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.teacher_id}>

                    <td>
                      <strong>{teacher.name}</strong>
                    </td>

                    <td>{teacher.employee_code}</td>

                    <td>{teacher.department_name}</td>

                    <td>{teacher.email}</td>

                    <td>
                      <span
                        className={
                          Number(teacher.is_active) === 1
                            ? "management-status active"
                            : "management-status inactive"
                        }
                      >
                        {Number(teacher.is_active) === 1
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="management-actions">

                        <button
                          className="management-icon-btn"
                          title="Edit teacher"
                          onClick={() => openEditForm(teacher)}
                        >
                          <Pencil size={16} />
                        </button>

                        {Number(teacher.is_active) === 1 && (
                          <button
                            className="management-icon-btn danger"
                            title="Deactivate teacher"
                            onClick={() =>
                              deactivateTeacher(teacher.teacher_id)
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>

          </table>
        )}

      </div>

      {showForm && (
        <div className="management-modal-backdrop">

          <div className="management-modal">

            <div className="management-modal-header">
              <div>
                <h2>
                  {editingId ? "Edit Teacher" : "Add New Teacher"}
                </h2>
                <p>Enter teacher details below.</p>
              </div>

              <button
                className="management-close-btn"
                onClick={() => setShowForm(false)}
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>

              <div className="management-form-grid">

                <label>
                  Full Name

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter teacher name"
                    required
                  />
                </label>

                <label>
                  Email Address

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="teacher@example.com"
                    required
                  />
                </label>

                <label>
                  Employee Code

                  <input
                    name="employee_code"
                    value={form.employee_code}
                    onChange={handleChange}
                    placeholder="TCH001"
                    required
                  />
                </label>

                <label>
                  Department

                  <select
                    name="department_id"
                    value={form.department_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Department</option>

                    {departments.map((department) => (
                      <option
                        key={department.department_id}
                        value={department.department_id}
                      >
                        {department.department_name}
                      </option>
                    ))}

                  </select>
                </label>

                <label className="full-width">
                  Password
                  {editingId
                    ? " (Leave blank to keep current password)"
                    : ""}

                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder={
                      editingId
                        ? "Optional new password"
                        : "Create password"
                    }
                    required={!editingId}
                    minLength={6}
                  />
                </label>

              </div>

              {error && (
                <div className="management-error">
                  {error}
                </div>
              )}

              <div className="management-form-actions">

                <button
                  type="button"
                  className="management-secondary-btn"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="management-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Teacher"
                      : "Save Teacher"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}
