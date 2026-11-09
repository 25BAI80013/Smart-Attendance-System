import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Authentication
import Login from "./pages/Login";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import Students from "./pages/Students";
import Departments from "./pages/Departments";
import Classes from "./pages/Classes";
import Teachers from "./pages/Teachers";
import Subjects from "./pages/Subjects";
import Assignments from "./pages/Assignments";
import Reports from "./pages/Reports";
import AuditLogs from "./pages/AuditLogs";
import Users from "./pages/Users";
import Attendance from "./pages/Attendance";
import Settings from "./pages/Settings";

// Teacher Pages
import TeacherDashboard from "./pages/TeacherDashboard";
import MarkAttendance from "./pages/MarkAttendance";
import AttendanceHistory from "./pages/AttendanceHistory";

// Student Pages
import StudentDashboard from "./pages/StudentDashboard";
import StudentAttendanceHistory from "./pages/StudentAttendanceHistory";

// 404 PAGE
function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif"
      }}
    >
      <h1 style={{ fontSize: "70px", margin: 0 }}>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you are looking for does not exist.</p>

      <button
        onClick={() => {
          window.location.href = "/login";
        }}
        style={{
          padding: "11px 22px",
          background: "#5368ed",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer"
        }}
      >
        Back to Login
      </button>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* PUBLIC ROUTE */}
          <Route
            path="/login"
            element={<Login />}
          />

          {/* ADMIN DASHBOARD */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* ADMIN STUDENTS */}
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Students />
              </ProtectedRoute>
            }
          />

          {/* ADMIN USERS */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Users />
              </ProtectedRoute>
            }
          />

          {/* ADMIN DEPARTMENTS */}
          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Departments />
              </ProtectedRoute>
            }
          />

          {/* ADMIN CLASSES */}
          <Route
            path="/admin/classes"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Classes />
              </ProtectedRoute>
            }
          />

          {/* ADMIN TEACHERS */}
          <Route
            path="/admin/teachers"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Teachers />
              </ProtectedRoute>
            }
          />

          {/* ADMIN SUBJECTS */}
          <Route
            path="/admin/subjects"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Subjects />
              </ProtectedRoute>
            }
          />

          {/* ADMIN ASSIGNMENTS */}
          <Route
            path="/admin/assignments"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Assignments />
              </ProtectedRoute>
            }
          />

          {/* ADMIN ATTENDANCE */}
          <Route
            path="/admin/attendance"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Attendance />
              </ProtectedRoute>
            }
          />

          {/* ADMIN SETTINGS */}
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* ADMIN REPORTS */}
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Reports />
              </ProtectedRoute>
            }
          />

          {/* ADMIN AUDIT LOGS */}
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AuditLogs />
              </ProtectedRoute>
            }
          />

          {/* TEACHER DASHBOARD */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          {/* TEACHER MARK ATTENDANCE */}
          <Route
            path="/teacher/attendance/mark/:classId/:subjectId"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <MarkAttendance />
              </ProtectedRoute>
            }
          />

          {/* TEACHER ATTENDANCE HISTORY */}
          <Route
            path="/teacher/attendance/history"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <AttendanceHistory />
              </ProtectedRoute>
            }
          />

          {/* STUDENT DASHBOARD */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* STUDENT ATTENDANCE HISTORY */}
          <Route
            path="/student/attendance/history"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentAttendanceHistory />
              </ProtectedRoute>
            }
          />

          {/* DEFAULT ROUTES */}
          <Route
            path="/"
            element={<Navigate to="/login" replace />}
          />

          <Route
            path="*"
            element={<NotFound />}
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;