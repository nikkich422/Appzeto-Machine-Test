import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api.js';
import { resetSocket } from '../socket.js';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [organizations, setOrganizations] = useState([]);
  const [currentOrg, setCurrentOrgState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentRole = currentOrg?.userRole || currentOrg?.currentUserRole || null;

  const setCurrentOrg = (org) => {
    setCurrentOrgState(org);
    api.setOrgId(org.id);
  };

  const refreshOrgs = async () => {
    try {
      const orgs = await api.getOrganizations();
      setOrganizations(orgs);

      const savedOrgId = localStorage.getItem('currentOrgId');
      const matched = orgs.find((o) => o.id === savedOrgId) || orgs[0] || null;
      if (matched) {
        setCurrentOrgState(matched);
        api.setOrgId(matched.id);
      }
    } catch (err) {
      console.error('Failed to fetch orgs:', err);
    }
  };

  const initAuth = async () => {
    setIsLoading(true);
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    try {
      api.setToken(savedToken);
      const me = await api.getMe();
      setUser(me);
      resetSocket(savedToken);

      const orgs = await api.getOrganizations();
      setOrganizations(orgs);

      const savedOrgId = localStorage.getItem('currentOrgId');
      const matched = orgs.find((o) => o.id === savedOrgId) || orgs[0] || null;
      if (matched) {
        setCurrentOrgState(matched);
        api.setOrgId(matched.id);
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    setToken(res.token);
    setUser(res.user);
    api.setToken(res.token);
    resetSocket(res.token);

    const orgs = await api.getOrganizations();
    setOrganizations(orgs);
    if (orgs.length > 0) {
      setCurrentOrgState(orgs[0]);
      api.setOrgId(orgs[0].id);
    }
  };

  const register = async (name, email, password) => {
    const res = await api.register(name, email, password);
    setToken(res.token);
    setUser(res.user);
    api.setToken(res.token);
    resetSocket(res.token);
    await refreshOrgs();
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setOrganizations([]);
    setCurrentOrgState(null);
    api.setToken(null);
    api.setOrgId(null);
    resetSocket(null);
  };

  const switchDemoUser = async (email) => {
    setIsLoading(true);
    try {
      await login(email, 'password123');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        organizations,
        currentOrg,
        currentRole,
        isLoading,
        login,
        register,
        logout,
        setCurrentOrg,
        switchDemoUser,
        refreshOrgs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
