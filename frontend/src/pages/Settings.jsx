import React, { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  Building2,
  CalendarDays,
  GraduationCap,
  Percent,
  Bell,
  Mail,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import api from "../services/api";
import "./Settings.css";

const defaultSettings = {
  institution_name: "SmartAttend",
  academic_year: "2026-2027",
  current_semester: 5,
  attendance_threshold: 75,
  low_attendance_alerts: true,
  email_notifications: false
};

export default function Settings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSettings = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.get("/settings");
      const data = response.data.settings;

      setSettings({
        institution_name: data.institution_name || "SmartAttend",
        academic_year: data.academic_year || "2026-2027",
        current_semester: Number(data.current_semester ?? 5),
        attendance_threshold: Number(data.attendance_threshold ?? 75),
        low_attendance_alerts:
          Boolean(Number(data.low_attendance_alerts)),
        email_notifications:
          Boolean(Number(data.email_notifications))
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load system settings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateField = (key, value) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value
    }));
    setSuccess("");
    setError("");
  };

  const saveSettings = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.put("/settings", {
        ...settings,
        current_semester: Number(settings.current_semester),
        attendance_threshold: Number(settings.attendance_threshold)
      });

      setSuccess("System settings saved successfully.");
      await loadSettingsAfterSave();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to save system settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const loadSettingsAfterSave = async () => {
    try {
      const response = await api.get("/settings");
      const data = response.data.settings;

      setSettings({
        institution_name: data.institution_name,
        academic_year: data.academic_year,
        current_semester: Number(data.current_semester),
        attendance_threshold: Number(data.attendance_threshold),
        low_attendance_alerts:
          Boolean(Number(data.low_attendance_alerts)),
        email_notifications:
          Boolean(Number(data.email_notifications))
      });
    } catch (err) {
      console.error("Settings refresh error:", err);
    }
  };

  const resetSettings = () => {
    const confirmed = window.confirm(
      "Reset the form to the original database defaults? Unsaved changes will be lost."
    );

    if (!confirmed) return;

    loadSettings();
  };

  if (loading) {
    return (
      <div className="system-settings-page">
        <div className="settings-loading">
          <RefreshCw className="settings-spin" size={25} />
          <p>Loading system settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="system-settings-page">

      <header className="settings-header">
        <div>
          <span className="settings-eyebrow">ADMINISTRATION</span>

          <h1>
            <SettingsIcon size={28} />
            System Settings
          </h1>

          <p>
            Configure your institution and attendance preferences.
          </p>
        </div>

        <button
          type="button"
          className="settings-refresh-button"
          onClick={loadSettings}
          disabled={saving}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </header>

      {error && (
        <div className="settings-message settings-error">
          <AlertCircle size={19} />
          {error}
        </div>
      )}

      {success && (
        <div className="settings-message settings-success">
          <CheckCircle size={19} />
          {success}
        </div>
      )}

      <form onSubmit={saveSettings}>

        <section className="settings-card">

          <div className="settings-card-heading">
            <div className="settings-heading-icon blue">
              <Building2 size={22} />
            </div>

            <div>
              <h2>Institution Details</h2>
              <p>Manage your institution information.</p>
            </div>
          </div>

          <div className="settings-form-grid">

            <div className="settings-field full-width">
              <label>Institution Name</label>
              <input
                type="text"
                value={settings.institution_name}
                maxLength={150}
                onChange={(e) =>
                  updateField("institution_name", e.target.value)
                }
                placeholder="Enter institution name"
                required
              />
            </div>

          </div>
        </section>

        <section className="settings-card">

          <div className="settings-card-heading">
            <div className="settings-heading-icon purple">
              <GraduationCap size={22} />
            </div>

            <div>
              <h2>Academic Configuration</h2>
              <p>Set the current academic session and semester.</p>
            </div>
          </div>

          <div className="settings-form-grid">

            <div className="settings-field">
              <label>Academic Year</label>
              <div className="settings-input-icon">
                <CalendarDays size={18} />
                <input
                  type="text"
                  value={settings.academic_year}
                  onChange={(e) =>
                    updateField("academic_year", e.target.value)
                  }
                  placeholder="2026-2027"
                  pattern="[0-9]{4}-[0-9]{4}"
                  title="Use format YYYY-YYYY"
                  required
                />
              </div>
              <small>Format: YYYY-YYYY</small>
            </div>

            <div className="settings-field">
              <label>Current Semester</label>
              <select
                value={settings.current_semester}
                onChange={(e) =>
                  updateField("current_semester", Number(e.target.value))
                }
              >
                {Array.from({ length: 12 }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    Semester {index + 1}
                  </option>
                ))}
              </select>
            </div>

          </div>
        </section>

        <section className="settings-card">

          <div className="settings-card-heading">
            <div className="settings-heading-icon green">
              <Percent size={22} />
            </div>

            <div>
              <h2>Attendance Configuration</h2>
              <p>Set the minimum attendance requirement.</p>
            </div>
          </div>

          <div className="settings-form-grid">

            <div className="settings-field">
              <label>Minimum Attendance Threshold (%)</label>
              <div className="settings-input-icon">
                <Percent size={18} />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={settings.attendance_threshold}
                  onChange={(e) =>
                    updateField("attendance_threshold", e.target.value)
                  }
                  required
                />
              </div>
              <small>
                Students below this percentage can be flagged.
              </small>
            </div>

          </div>

          <div className="settings-threshold-preview">
            <div>
              <strong>Current Threshold</strong>
              <span>
                {settings.attendance_threshold || 0}% minimum attendance
              </span>
            </div>

            <div className="settings-threshold-value">
              {settings.attendance_threshold || 0}%
            </div>
          </div>

        </section>

        <section className="settings-card">

          <div className="settings-card-heading">
            <div className="settings-heading-icon orange">
              <Bell size={22} />
            </div>

            <div>
              <h2>Notifications & Alerts</h2>
              <p>Control system notification preferences.</p>
            </div>
          </div>

          <div className="settings-toggle-list">

            <div className="settings-toggle-row">
              <div className="settings-toggle-description">
                <div className="settings-toggle-icon">
                  <Bell size={19} />
                </div>

                <div>
                  <strong>Low Attendance Alerts</strong>
                  <span>
                    Enable alerts for students below the attendance threshold.
                  </span>
                </div>
              </div>

              <label className="settings-switch">
                <input
                  type="checkbox"
                  checked={settings.low_attendance_alerts}
                  onChange={(e) =>
                    updateField("low_attendance_alerts", e.target.checked)
                  }
                />
                <span className="settings-switch-slider"></span>
              </label>
            </div>

            <div className="settings-toggle-row">
              <div className="settings-toggle-description">
                <div className="settings-toggle-icon">
                  <Mail size={19} />
                </div>

                <div>
                  <strong>Email Notifications</strong>
                  <span>
                    Enable email notification preference.
                  </span>
                </div>
              </div>

              <label className="settings-switch">
                <input
                  type="checkbox"
                  checked={settings.email_notifications}
                  onChange={(e) =>
                    updateField("email_notifications", e.target.checked)
                  }
                />
                <span className="settings-switch-slider"></span>
              </label>
            </div>

          </div>
        </section>

        <div className="settings-actions">
          <button
            type="button"
            className="settings-reset-button"
            onClick={resetSettings}
            disabled={saving}
          >
            Reset
          </button>

          <button
            type="submit"
            className="settings-save-button"
            disabled={saving}
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>

      </form>

      <footer className="settings-footer">
        SmartAttend System Administration
      </footer>

    </div>
  );
}