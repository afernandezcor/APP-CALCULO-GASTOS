
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../mockData';
import { db } from '../services/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';

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
  isCloudConnected: boolean; // New export to show status in UI
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useCloud, setUseCloud] = useState(false);

  // Initialize Data Source (Cloud vs Local)
  useEffect(() => {
    if (db) {
        setUseCloud(true);
        // Real-time listener for Cloud Data
        const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
            const usersData: User[] = [];
            snapshot.forEach((doc) => {
                usersData.push(doc.data() as User);
            });
            
            // If DB is empty (first run), maybe seed it? 
            // For now, we trust the DB. 
            if (usersData.length === 0) {
                 // Optional: Seed mock data to cloud if empty
            }
            setAllUsers(usersData);
            setIsLoading(false);
        }, (error) => {
            console.error("Cloud sync error:", error);
            // Fallback to local if permission denied or other error
            setUseCloud(false);
            loadFromLocal();
        });
        return () => unsubscribe();
    } else {
        setUseCloud(false);
        loadFromLocal();
    }
  }, []);

  const loadFromLocal = () => {
    const savedUsers = localStorage.getItem('track_expense_users');
    if (savedUsers) {
      try {
        setAllUsers(JSON.parse(savedUsers));
      } catch (e) {
        setAllUsers(MOCK_USERS);
      }
    } else {
      setAllUsers(MOCK_USERS);
    }
    setIsLoading(false);
  };

  // Keep local storage updated as a backup/cache
  useEffect(() => {
    if (!useCloud) {
        localStorage.setItem('track_expense_users', JSON.stringify(allUsers));
    }
  }, [allUsers, useCloud]);

  // Session Management
  useEffect(() => {
    const storedUserId = localStorage.getItem('billboard_user_id');
    if (storedUserId && allUsers.length > 0) {
      const foundUser = allUsers.find(u => u.id === storedUserId);
      if (foundUser) setUser(foundUser);
    }
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

  const signup = async (name: string, email: string, password: string) => {
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
      role: UserRole.SALES,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&background=2563eb`
    };

    if (useCloud) {
        try {
            // Use setDoc with specific ID to make updates easier
            await setDoc(doc(db, 'users', newUser.id), newUser);
        } catch (e) {
            console.error("Error saving to cloud", e);
            // Fallback
            setAllUsers(prev => [...prev, newUser]);
        }
    } else {
        setAllUsers(prev => [...prev, newUser]);
    }
    
    setUser(newUser);
    localStorage.setItem('billboard_user_id', newUser.id);
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    if (useCloud) {
        try {
            await updateDoc(doc(db, 'users', userId), { role: newRole });
        } catch (e) { console.error(e); }
    } else {
        setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  const updateUserAvatar = async (userId: string, avatarUrl: string) => {
    if (useCloud) {
        try {
            await updateDoc(doc(db, 'users', userId), { avatar: avatarUrl });
        } catch (e) { console.error(e); }
    } else {
        setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, avatar: avatarUrl } : u));
    }
  };

  const updateUserPassword = async (userId: string, password: string) => {
    if (useCloud) {
        try {
            await updateDoc(doc(db, 'users', userId), { password: password });
        } catch (e) { console.error(e); }
    } else {
        setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, password: password } : u));
    }
  };

  const requestProfileUpdate = async (userId: string, name: string, email: string) => {
    const updateData = {
        pendingUpdates: {
            name,
            email,
            date: new Date().toISOString()
        }
    };
    if (useCloud) {
        await updateDoc(doc(db, 'users', userId), updateData);
    } else {
        setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updateData } : u));
    }
  };

  const resolveProfileUpdate = async (userId: string, approve: boolean) => {
    const userToUpdate = allUsers.find(u => u.id === userId);
    if (!userToUpdate?.pendingUpdates) return;

    let updateData = {};
    if (approve) {
        updateData = {
            name: userToUpdate.pendingUpdates.name,
            email: userToUpdate.pendingUpdates.email,
            pendingUpdates: null 
        };
    } else {
        updateData = { pendingUpdates: null };
    }
    
    if (useCloud) {
         const updatedUser = { ...userToUpdate };
         if (approve) {
             updatedUser.name = userToUpdate.pendingUpdates.name;
             updatedUser.email = userToUpdate.pendingUpdates.email;
         }
         delete updatedUser.pendingUpdates; // Remove property
         await setDoc(doc(db, 'users', userId), updatedUser);
    } else {
        setAllUsers(prev => prev.map(u => {
            if (u.id === userId) {
                 if (approve) {
                     return { ...u, name: u.pendingUpdates!.name, email: u.pendingUpdates!.email, pendingUpdates: undefined };
                 } else {
                     return { ...u, pendingUpdates: undefined };
                 }
            }
            return u;
        }));
    }
  };

  const deleteUser = async (userId: string) => {
    if (useCloud) {
        await deleteDoc(doc(db, 'users', userId));
    } else {
        setAllUsers(prev => prev.filter(u => u.id !== userId));
    }
    if (user && user.id === userId) logout();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('billboard_user_id');
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        allUsers, 
        login, 
        signup, 
        logout, 
        updateUserRole, 
        updateUserAvatar, 
        updateUserPassword, 
        requestProfileUpdate, 
        resolveProfileUpdate, 
        deleteUser, 
        isLoading,
        isCloudConnected: useCloud 
    }}>
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
