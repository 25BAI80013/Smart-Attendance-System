
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Login = () => {
    const { login, loading } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const user = await login(email, password);

            if (user.role === "admin") {
                navigate("/admin/dashboard");
            } else if (user.role === "teacher") {
                navigate("/teacher/dashboard");
            } else if (user.role === "student") {
                navigate("/student/dashboard");
            } else {
                setError("Invalid user role");
            }

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to login. Please try again."
            );
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">

                <div className="login-brand">
                    <div className="brand-icon">
                        <ShieldCheck size={30} />
                    </div>

                    <h1>SmartAttend</h1>
                    <p>Attendance Management System</p>
                </div>

                <div className="login-heading">
                    <h2>Welcome back!</h2>
                    <p>Sign in to access your account</p>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <label>Email Address</label>

                    <div className="input-group">
                        <Mail size={18} />

                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <label>Password</label>

                    <div className="input-group">
                        <Lock size={18} />

                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label="Toggle password visibility"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>

                </form>

                <div className="login-footer">
                    Secure access for Students, Teachers & Admins
                </div>

            </div>
        </div>
    );
};

export default Login;
