import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("nw_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("nw_user");
    if (token && stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, [token]);

  const login = (tokenVal, userVal) => {
    localStorage.setItem("nw_token", tokenVal);
    localStorage.setItem("nw_user", JSON.stringify(userVal));
    setToken(tokenVal);
    setUser(userVal);
  };

  const logout = () => {
    localStorage.removeItem("nw_token");
    localStorage.removeItem("nw_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
