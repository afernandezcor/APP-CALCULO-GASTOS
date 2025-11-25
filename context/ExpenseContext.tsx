import React, { createContext, useContext, useState, useEffect } from 'react';
import { Expense, ExpenseStatus } from '../types';
import { MOCK_EXPENSES } from '../mockData';

interface ExpenseContextType {
  expenses: Expense[];
  addExpense: (expense: Expense) => void;
  updateStatus: (id: string, status: ExpenseStatus, notes?: string) => void;
  getExpensesByUser: (userId: string) => Expense[];
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
    localStorage.setItem('track_expense_data', JSON.stringify(expenses));
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

  const getExpensesByUser = (userId: string) => {
    return expenses.filter(e => e.userId === userId);
  };

  return (
    <ExpenseContext.Provider value={{ expenses, addExpense, updateStatus, getExpensesByUser }}>
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