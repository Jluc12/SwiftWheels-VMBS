import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/authAPI.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { data } = await authAPI.me();
      setUser(data.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (payload) => {
    const { data } = await authAPI.login(payload);
    setUser(data.data);
    return data.data;
  };

  const register = async (payload) => {
    const { data } = await authAPI.register(payload);
    setUser(data.data);
    return data.data;
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const value = useMemo(() => ({ user, loading, login, register, logout, refreshUser }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
