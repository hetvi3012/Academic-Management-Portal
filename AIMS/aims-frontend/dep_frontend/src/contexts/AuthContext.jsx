import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api.js';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  const sendOtp = async (email) => {
    const response = await authAPI.sendOtp(email);
    return response.data;
  };

  const login = async (email, otp) => {
    const response = await authAPI.login(email, otp);
    const { token, user: userData } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, sendOtp, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
