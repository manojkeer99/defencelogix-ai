import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  authError: string | null;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
  hasPermission: (allowedRoles: UserRole[]) => boolean;
  handleAuthError: (errorMsg?: string) => void;
  requestDemoToken: (role?: UserRole) => Promise<boolean>;
  clearAuthError: () => void;
}

const DEMO_USERS: Record<UserRole, { email: string; name: string; serviceNumber: string; clearanceLevel: string; department: string }> = {
  admin: {
    email: 'admin@demologix.local',
    name: 'Brig. Rajesh Varma (Retd.)',
    serviceNumber: 'IC-48291X',
    clearanceLevel: 'LEVEL 5 - TOP SECRET (DEMO)',
    department: 'Directorate General of Operational Logistics'
  },
  logistics_officer: {
    email: 'officer@demologix.local',
    name: 'Col. Amitav Sengupta',
    serviceNumber: 'IC-51203M',
    clearanceLevel: 'LEVEL 4 - SECRET (DEMO)',
    department: 'Forward Supply Corps Command'
  },
  inventory_manager: {
    email: 'inventory@demologix.local',
    name: 'Lt. Col. Priya Menon',
    serviceNumber: 'IC-54910K',
    clearanceLevel: 'LEVEL 3 - CONFIDENTIAL (DEMO)',
    department: 'Central Ordnance Depot Management'
  },
  transport_manager: {
    email: 'transport@demologix.local',
    name: 'Maj. Vikramaditya Rathore',
    serviceNumber: 'IC-59821P',
    clearanceLevel: 'LEVEL 3 - CONFIDENTIAL (DEMO)',
    department: 'Army Service Corps (Mechanical Transport)'
  },
  analyst: {
    email: 'analyst@demologix.local',
    name: 'Dr. Sunita Kulkarni',
    serviceNumber: 'CIV-DS-8842',
    clearanceLevel: 'LEVEL 3 - CONFIDENTIAL (DEMO)',
    department: 'Defence Data Science & Operational Research Lab'
  },
  viewer: {
    email: 'viewer@demologix.local',
    name: 'Capt. Rohan Deshmukh',
    serviceNumber: 'IC-64112A',
    clearanceLevel: 'LEVEL 2 - RESTRICTED (DEMO)',
    department: 'Staff College Logistics Observer Division'
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('defencelogix_user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore corrupted data
        }
      }
    }
    return {
      id: 'USR-002',
      email: DEMO_USERS.logistics_officer.email,
      name: DEMO_USERS.logistics_officer.name,
      role: 'logistics_officer',
      serviceNumber: DEMO_USERS.logistics_officer.serviceNumber,
      clearanceLevel: DEMO_USERS.logistics_officer.clearanceLevel,
      department: DEMO_USERS.logistics_officer.department,
      createdAt: '2026-01-12T09:30:00.000Z'
    };
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('defencelogix_jwt_token');
    }
    return null;
  });

  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const handleAuthError = useCallback((errorMsg: string = 'Authentication required or session expired. Please re-authenticate.') => {
    console.warn('[DefenceLogix Auth] Unauthorized 401 intercepted:', errorMsg);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('defencelogix_jwt_token');
      sessionStorage.removeItem('defencelogix_user');
    }
    setToken(null);
    setAuthError(errorMsg);
  }, []);

  // Request a genuine, cryptographically signed demo token from the backend
  const requestDemoToken = useCallback(async (role: UserRole = 'logistics_officer'): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });

      if (!res.ok) {
        // Fallback to /api/auth/login using demo user email
        const targetEmail = DEMO_USERS[role]?.email || 'officer@demologix.local';
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail, password: 'demo' })
        });

        if (loginRes.ok) {
          const data = await loginRes.json();
          setUser(data.user);
          setToken(data.token);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('defencelogix_jwt_token', data.token);
            sessionStorage.setItem('defencelogix_user', JSON.stringify(data.user));
          }
          setAuthError(null);
          return true;
        }

        const errData = await res.json().catch(() => ({}));
        handleAuthError(errData.error || 'Failed to issue demo authentication token');
        return false;
      }

      const data = await res.json();
      setUser(data.user);
      setToken(data.token);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('defencelogix_jwt_token', data.token);
        sessionStorage.setItem('defencelogix_user', JSON.stringify(data.user));
      }
      setAuthError(null);
      return true;
    } catch (err) {
      console.error('[DefenceLogix Auth] Request demo token error:', err);
      handleAuthError('Network error connecting to authentication service');
      return false;
    }
  }, [handleAuthError]);

  // Standard login flow
  const login = async (email: string, password?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password || 'demo' })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setAuthError(errData.error || 'Invalid credentials');
        return false;
      }

      const data = await res.json();
      setUser(data.user);
      setToken(data.token);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('defencelogix_jwt_token', data.token);
        sessionStorage.setItem('defencelogix_user', JSON.stringify(data.user));
      }
      setAuthError(null);
      return true;
    } catch (err) {
      console.error('[DefenceLogix Auth] Login error:', err);
      setAuthError('Network error during login');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('defencelogix_jwt_token');
      sessionStorage.removeItem('defencelogix_user');
    }
    setAuthError('Logged out. Please authenticate to access command mutators.');
  };

  const switchRole = async (newRole: UserRole) => {
    await requestDemoToken(newRole);
  };

  const hasPermission = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return allowedRoles.includes(user.role);
  };

  // On initial mount: ensure a genuine, valid JWT is loaded or issued
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const existingToken = typeof window !== 'undefined' ? sessionStorage.getItem('defencelogix_jwt_token') : null;

      if (existingToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${existingToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (isMounted) {
              setUser(data.user);
              setToken(existingToken);
              setAuthError(null);
            }
            return;
          }
        } catch {
          // Token validation failed, proceed to acquire fresh demo token
        }
      }

      // No valid stored token: acquire a fresh demo token for current role
      if (isMounted) {
        const defaultRole = user?.role || 'logistics_officer';
        await requestDemoToken(defaultRole);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAuthenticated: !!user && !!token, 
      authError,
      login, 
      logout, 
      switchRole, 
      hasPermission,
      handleAuthError,
      requestDemoToken,
      clearAuthError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

