import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, loginStudent, registerStudent } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("campusx_token"));
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setAuthLoading(false);
      return;
    }

    getCurrentUser(token)
      .then((result) => setUser(result.data?.user ?? result.user ?? result.data ?? null))
      .catch(() => {
        localStorage.removeItem("campusx_token");
        setToken(null);
        setUser(null);
      })
      .finally(() => setAuthLoading(false));
  }, [token]);
async function login(credentials) {
  const result = await loginStudent(credentials);

  const newToken = result.token;
  const student = result.data;

  if (!newToken) {
    throw new Error("Login response lo token dorakaledu.");
  }

  localStorage.setItem("campusx_token", newToken);
  setToken(newToken);
  setUser(student);

  return result;
}


  async function register(userData) {
    return registerStudent(userData);
  }

  function logout() {
    localStorage.removeItem("campusx_token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, authLoading, isAuthenticated: Boolean(token && user), login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}