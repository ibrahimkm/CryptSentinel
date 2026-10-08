import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!authService.getToken());
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const { user: loggedInUser } = await authService.login(credentials);
      setUser(loggedInUser);
      setIsAuthenticated(true);
      return { success: true, user: loggedInUser };
    } catch (err) {
      return { success: false, error: err.message || 'Authentication failed' };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    try {
      const { user: newUser } = await authService.register(userData);
      setUser(newUser);
      setIsAuthenticated(true);
      return { success: true, user: newUser };
    } catch (err) {
      return { success: false, error: err.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates) => {
    const updated = await authService.updateProfile(updates);
    setUser(updated);
    return updated;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
