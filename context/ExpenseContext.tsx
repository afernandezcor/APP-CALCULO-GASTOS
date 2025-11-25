
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Expense, ExpenseStatus } from '../types';
import { MOCK_EXPENSES } from '../mockData';

interface ExpenseContextType {
  expenses: Expense[];
  addExpense: (expense: Expense) => void;
  updateStatus: (id: string, status: ExpenseStatus, notes?: string) => void;
  getExpensesByUser: (userId: string) => Expense[];
  deleteExpense: (id: string) => void;
  editExpense: (id: string, updatedExpense: Partial<Expense>) => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from LocalStorage if available, otherwise use Mock Data
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const savedExpenses = localStorage.getItem('track_expense_data');
    if (savedExpenses) {
      try {
        return JSON.parse(savedExpenses);
      } catch (e) {
        console.error("Failed to parse expenses", e);
        return MOCK_EXPENSES;
      }
    }
    return MOCK_EXPENSES;
  });

  // Save to LocalStorage whenever expenses change
  useEffect(() => {
    try {
        localStorage.setItem('track_expense_data', JSON.stringify(expenses));
    } catch (error) {
        console.error("Failed to save expenses to LocalStorage. Storage might be full.", error);
        // Note: In a production app, we would likely trigger a global toast notification here
    }
  }, [expenses]);

  const addExpense = (expense: Expense) => {
    setExpenses(prev => [expense, ...prev]);
  };

  const updateStatus = (id: string, status: ExpenseStatus, notes?: string) => {
    setExpenses(prev => prev.map(exp => {
      if (exp.id === id) {
        return { ...exp, status, notes: notes ? notes : exp.notes };
      }
      return exp;
    }));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  const editExpense = (id: string, updatedExpense: Partial<Expense>) => {
    setExpenses(prev => prev.map(exp => {
      if (exp.id === id) {
        return { ...exp, ...updatedExpense };
      }
      return exp;
    }));
  };

  const getExpensesByUser = (userId: string) => {
    return expenses.filter(e => e.userId === userId);
  };

  return (
    <ExpenseContext.Provider value={{ expenses, addExpense, updateStatus, getExpensesByUser, deleteExpense, editExpense }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};
