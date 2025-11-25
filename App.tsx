import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ExpenseProvider } from './context/ExpenseContext';
import { LanguageProvider } from './context/LanguageContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { SalesHome } from './pages/sales/SalesHome';
import { AddExpense } from './pages/sales/AddExpense';
import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { ExpenseReport } from './pages/manager/ExpenseReport';
import { UserManagement } from './pages/admin/UserManagement';
import { UserRole } from './types';

// Simple Router Component
const Router = () => {
  const { user, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.hash.replace('#', '') || '/');

  useEffect(() => {
    const handleHashChange = () => {
      const path = window.location.hash.replace('#', '') || '/';
      setCurrentPath(path);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  if (!user) {
    if (currentPath === '/signup') {
      return <Signup navigate={navigate} />;
    }
    // Default to login, but handle explicit login route if needed
    return <Login navigate={navigate} />;
  }

  // Route Guard / Redirection based on Role
  const renderContent = () => {
    // Admin & Manager Shared Routes (Management)
    if (user.role === UserRole.MANAGER || user.role === UserRole.ADMIN) {
      switch (currentPath) {
        case '/dashboard':
        case '/':
          return <ManagerDashboard navigate={navigate} />;
        case '/all-expenses':
           // Reusing ManagerDashboard for demo, ideally a separate list view
          return <ManagerDashboard navigate={navigate} />;
        case '/expense-report':
          return <ExpenseReport />;
        // Personal Expenses for Managers/Admins
        case '/my-expenses':
          return <SalesHome navigate={navigate} />;
        case '/add-expense':
          return <AddExpense navigate={navigate} />;
        // Admin Only
        case '/user-management':
          if (user.role === UserRole.ADMIN) {
             return <UserManagement />;
          }
          return <div>Unauthorized</div>;
        default:
          return <ManagerDashboard navigate={navigate} />;
      }
    }

    // Sales Routes
    if (user.role === UserRole.SALES) {
      switch (currentPath) {
        case '/my-expenses':
        case '/':
          return <SalesHome navigate={navigate} />;
        case '/add-expense':
          return <AddExpense navigate={navigate} />;
        case '/expense-report':
          return <ExpenseReport />;
        default:
          return <SalesHome navigate={navigate} />;
      }
    }
    return <div>Unauthorized</div>;
  };

  return (
    <Layout currentPath={currentPath} navigate={navigate}>
      {renderContent()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ExpenseProvider>
          <Router />
        </ExpenseProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;