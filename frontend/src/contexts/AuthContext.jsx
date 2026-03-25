import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokenExpiry, setTokenExpiry] = useState(null);

  // Enhanced logout with cleanup
  const logout = useCallback(() => {
    // Fire-and-forget server logout to invalidate refresh token
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${storedToken}` },
      }).catch(() => {});
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setTokenExpiry(null);
    // Clear any existing timers
    if (window.tokenExpiryTimer) {
      clearTimeout(window.tokenExpiryTimer);
      window.tokenExpiryTimer = null;
    }
  }, []);

  // Auto-logout setup
  const setupAutoLogout = useCallback((expiryTime) => {
    const timeUntilExpiry = expiryTime - Date.now();
    
    // Clear existing timer
    if (window.tokenExpiryTimer) {
      clearTimeout(window.tokenExpiryTimer);
    }
    
    // Set new timer (with 30 second buffer before actual expiry)
    if (timeUntilExpiry > 30000) {
      window.tokenExpiryTimer = setTimeout(() => {
        console.log('Token expired, logging out...');
        logout();
      }, timeUntilExpiry - 30000);
    }
  }, [logout]);

  // Enhanced login with auto-logout setup
  const login = useCallback((token, refreshToken = null) => {
    try {
      const decoded = jwtDecode(token);
      const expiryTime = decoded.exp * 1000;

      if (expiryTime < Date.now()) {
        console.warn('Token is already expired');
        logout();
        return false;
      }

      localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      setUser(decoded);
      setTokenExpiry(expiryTime);
      setupAutoLogout(expiryTime);

      return true;
    } catch (err) {
      console.error('Invalid token:', err);
      logout();
      return false;
    }
  }, [logout, setupAutoLogout]);

  // Check if token will expire soon (within 5 minutes)
  const isTokenExpiringSoon = useCallback(() => {
    if (!tokenExpiry) return false;
    return tokenExpiry - Date.now() < 5 * 60 * 1000; // 5 minutes
  }, [tokenExpiry]);

  // Get time until token expires
  const getTimeUntilExpiry = useCallback(() => {
    if (!tokenExpiry) return null;
    return Math.max(0, tokenExpiry - Date.now());
  }, [tokenExpiry]);

  // Refresh token function — calls /api/auth/refresh with stored refresh token
  const refreshToken = useCallback(async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) return false;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      if (response.ok) {
        const { token: newToken } = await response.json();
        return login(newToken);
      }

      // Refresh token expired or invalid — log out
      logout();
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }, [login, logout]);

  // Enhanced token validation
  const checkStoredToken = useCallback(() => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const decoded = jwtDecode(token);
      const expiryTime = decoded.exp * 1000;
      
      if (expiryTime < Date.now()) {
        console.log('Stored token expired, removing...');
        logout();
      } else {
        setUser(decoded);
        setTokenExpiry(expiryTime);
        setupAutoLogout(expiryTime);
      }
    } catch (error) {
      console.error('Error checking stored token:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout, setupAutoLogout]);

  // Initialize auth state
  useEffect(() => {
    checkStoredToken();
  }, [checkStoredToken]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.tokenExpiryTimer) {
        clearTimeout(window.tokenExpiryTimer);
        window.tokenExpiryTimer = null;
      }
    };
  }, []);

  // Check for token expiry periodically (every minute)
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token && user) {
        try {
          const decoded = jwtDecode(token);
          if (decoded.exp * 1000 < Date.now()) {
            console.log('Token expired during periodic check');
            logout();
          }
        } catch (error) {
          console.error('Error during periodic token check:', error);
          logout();
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user, logout]);

  const value = {
    user,
    loading,
    login,
    logout,
    refreshToken,
    isTokenExpiringSoon,
    getTimeUntilExpiry,
    tokenExpiry,
    // Helper to check if user is authenticated
    isAuthenticated: !!user,
    // Helper to check if user is admin
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};