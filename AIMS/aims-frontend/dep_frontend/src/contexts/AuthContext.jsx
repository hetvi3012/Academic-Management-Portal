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

  // 1. Check Session Storage on Load
  useEffect(() => {
    // CHANGE: localStorage -> sessionStorage
    const storedUser = sessionStorage.getItem('user');
    const token = sessionStorage.getItem('token');
    
    if (storedUser && token) {
        try {
            setUser(JSON.parse(storedUser));
        } catch (e) {
            console.error("Failed to parse user data", e);
            sessionStorage.clear();
        }
    }
    setLoading(false);
  }, []);

  const sendOtp = async (email) => {
    const response = await authAPI.sendOtp(email);
    return response.data;
  };

  const login = async (email, otp) => {
    const response = await authAPI.login(email, otp);
    const { token, user: userData } = response.data;
    
    // CHANGE: localStorage -> sessionStorage
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(userData));
    
    setUser(userData);
    return userData;
  };

  const logout = () => {
    // CHANGE: localStorage -> sessionStorage
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, sendOtp, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};