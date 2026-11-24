import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch, getAuthToken, setAuthToken, removeAuthToken } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getAuthToken());
  const [loading, setLoading] = useState(true);
  const [demoUsers, setDemoUsers] = useState([]);

  const fetchCurrentUser = async () => {
    try {
      if (!getAuthToken()) {
        setUser(null);
        setLoading(false);
        return;
      }
      const data = await apiFetch('/auth/me');
      setUser(data);
    } catch (err) {
      console.warn('Failed to fetch user:', err.message);
      setUser(null);
      removeAuthToken();
    } finally {
      setLoading(false);
    }
  };

  const fetchDemoUsers = async () => {
    try {
      const users = await apiFetch('/auth/demo-users');
      setDemoUsers(users);
    } catch (err) {
      console.warn('Failed to load demo users:', err.message);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchDemoUsers();

    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  const login = async (email, password) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const register = async (userData) => {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    setAuthToken(res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const switchDemoUser = async (userId) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/auth/demo-switch/${userId}`, {
        method: 'POST',
      });
      setAuthToken(res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeAuthToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        demoUsers,
        login,
        register,
        switchDemoUser,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
