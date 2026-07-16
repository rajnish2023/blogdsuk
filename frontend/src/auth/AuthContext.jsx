import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { loginRequest, logoutRequest, refreshRequest } from "../api/authApi";
import { setAccessToken, clearAccessToken } from "../api/tokenStore";
import { fetchPublicSettings } from "../api/settingApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({ companyName: "Dynamics Square", customLogo: "" });

  const loadSettings = useCallback(async () => {
    try {
      const data = await fetchPublicSettings();
      setSettings(data);
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await loadSettings();
        const data = await refreshRequest();
        setAccessToken(data.accessToken);
        setUser(data.user);
      } catch {
        clearAccessToken();
        setUser(null);
      } finally {
        setInitializing(false);
      }
    })();
  }, [loadSettings]);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const data = await loginRequest(email, password);
      setAccessToken(data.accessToken);
      setUser(data.user);
      return true;
    } catch (err) {
      setError(err?.response?.data?.message || "Sign in failed");
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Clear local state regardless of whether the server call succeeded.
    }
    clearAccessToken();
    setUser(null);
  }, []);

  const updateUserLocal = useCallback((updated) => {
    setUser((prev) => ({ ...prev, ...updated }));
  }, []);

  const permissions = user?.role?.permissions || [];
  const isSuperAdmin = !!user?.role?.isSuperAdmin;
  const can = useCallback((...perms) => isSuperAdmin || perms.every((p) => permissions.includes(p)), [permissions, isSuperAdmin]);

  return (
    <AuthContext.Provider value={{ user, initializing, error, login, logout, can, isSuperAdmin, updateUserLocal, settings, reloadSettings: loadSettings }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export const usePermissions = () => {
  const { can } = useAuth();
  return can;
};
