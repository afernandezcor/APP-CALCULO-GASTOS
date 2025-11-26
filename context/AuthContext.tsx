
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../mockData';

interface AuthContextType {
  user: User | null;
  allUsers: User[];
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string, password: string) => void;
  logout: () => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  updateUserAvatar: (userId: string, avatarUrl: string) => void;
  updateUserPassword: (userId: string, password: string) => void;
  requestProfileUpdate: (userId: string, name: string, email: string) => void;
  resolveProfileUpdate: (userId: string, approve: boolean) => void;
  deleteUser: (userId: string) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize users from LocalStorage or use Mock Data
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem('track_expense_users');
    if (savedUsers) {
      try {
        return JSON.parse(savedUsers);
      } catch (e) {
        console.error("Failed to parse users", e);
        return MOCK_USERS;
      }
    }
    return MOCK_USERS;
  });

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Save users to LocalStorage whenever the list changes (e.g. new signup or role change)
  useEffect(() => {
    localStorage.setItem('track_expense_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    // Simulate session check
    const storedUserId = localStorage.getItem('billboard_user_id');
    if (storedUserId) {
      const foundUser = allUsers.find(u => u.id === storedUserId);
      if (foundUser) setUser(foundUser);
    }
    setIsLoading(false);
  }, [allUsers]);

  const login = (email: string, password: string): boolean => {
    const foundUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('billboard_user_id', foundUser.id);
      return true;
    }
    return false;
  };

  const signup = (name: string, email: string, password: string) => {
    // Check if user already exists
    const existing = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
        alert('User already exists with this email. Please login.');
        return;
    }

    const newUser: User = {
      id: `u-${Date.now()}`,
      name,
      email,
      password,
      role: UserRole.SALES, // Default to sales for new signups
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&background=2563eb`
    };

    const updatedUsers = [...allUsers, newUser];
    setAllUsers(updatedUsers);
    setUser(newUser);
    
    // Force immediate save
    localStorage.setItem('track_expense_users', JSON.stringify(updatedUsers));
    localStorage.setItem('billboard_user_id', newUser.id);
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    // If updating self, update current user state
    if (user && user.id === userId) {
      setUser(prev => prev ? { ...prev, role: newRole } : null);
    }
  };

  const updateUserAvatar = (userId: string, avatarUrl: string) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, avatar: avatarUrl } : u));
    if (user && user.id === userId) {
        setUser(prev => prev ? { ...prev, avatar: avatarUrl } : null);
    }
  };

  const updateUserPassword = (userId: string, password: string) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, password: password } : u));
    if (user && user.id === userId) {
        setUser(prev => prev ? { ...prev, password: password } : null);
    }
  };

  const requestProfileUpdate = (userId: string, name: string, email: string) => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          pendingUpdates: {
            name,
            email,
            date: new Date().toISOString()
          }
        };
      }
      return u;
    }));
    
    if (user && user.id === userId) {
      setUser(prev => prev ? {
          ...prev,
          pendingUpdates: {
            name,
            email,
            date: new Date().toISOString()
          }
      } : null);
    }
  };

  const resolveProfileUpdate = (userId: string, approve: boolean) => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId && u.pendingUpdates) {
        if (approve) {
          return {
            ...u,
            name: u.pendingUpdates.name,
            email: u.pendingUpdates.email,
            pendingUpdates: undefined
          };
        } else {
          return {
            ...u,
            pendingUpdates: undefined
          };
        }
      }
      return u;
    }));
  };

  const deleteUser = (userId: string) => {
    setAllUsers(prev => {
        const newUsers = prev.filter(u => u.id !== userId);
        // Force immediate save
        localStorage.setItem('track_expense_users', JSON.stringify(newUsers));
        return newUsers;
    });
    
    // If deleting self (unlikely from admin panel, but possible), logout
    if (user && user.id === userId) {
        logout();
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('billboard_user_id');
  };

  return (
    <AuthContext.Provider value={{ user, allUsers, login, signup, logout, updateUserRole, updateUserAvatar, updateUserPassword, requestProfileUpdate, resolveProfileUpdate, deleteUser, isLoading }}>
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
