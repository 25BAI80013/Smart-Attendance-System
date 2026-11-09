
import {
    createContext,
    useContext,
    useState
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("attendance_user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [loading, setLoading] = useState(false);

    const login = async (email, password) => {
        setLoading(true);

        try {
            const response = await api.post("/auth/login", {
                email,
                password
            });

            const { token, user } = response.data;

            localStorage.setItem("attendance_token", token);
            localStorage.setItem(
                "attendance_user",
                JSON.stringify(user)
            );

            setUser(user);

            return user;

        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem("attendance_token");
        localStorage.removeItem("attendance_user");
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{ user, loading, login, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
