
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Expense, ExpenseStatus } from '../types';
import { MOCK_EXPENSES } from '../mockData';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, writeBatch, query, where, getDocs } from 'firebase/firestore';

interface ExpenseContextType {
  expenses: Expense[];
  addExpense: (expense: Expense) => void;
  updateStatus: (id: string, status: ExpenseStatus, notes?: string) => void;
  getExpensesByUser: (userId: string) => Expense[];
  deleteExpense: (id: string) => void;
  deleteExpensesByUserId: (userId: string) => void;
  editExpense: (id: string, updatedExpense: Partial<Expense>) => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [useCloud, setUseCloud] = useState(false);

  // Initialize Data Source
  useEffect(() => {
    if (db) {
        setUseCloud(true);
        // Real-time listener for Cloud Data
        const unsubscribe = onSnapshot(collection(db, 'expenses'), (snapshot) => {
            const expensesData: Expense[] = [];
            snapshot.forEach((doc) => {
                expensesData.push(doc.data() as Expense);
            });
            // Sort by date new to old
            expensesData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setExpenses(expensesData);
        });
        return () => unsubscribe();
    } else {
        loadFromLocal();
    }
  }, []);

  const loadFromLocal = () => {
      const savedExpenses = localStorage.getItem('track_expense_data');
      if (savedExpenses) {
        try {
          const parsed = JSON.parse(savedExpenses);
          setExpenses(Array.isArray(parsed) ? parsed : MOCK_EXPENSES);
        } catch (e) {
          setExpenses(MOCK_EXPENSES);
        }
      } else {
        setExpenses(MOCK_EXPENSES);
      }
  };

  // Sync to local as backup
  useEffect(() => {
    if (!useCloud) {
         try {
            localStorage.setItem('track_expense_data', JSON.stringify(expenses));
        } catch (error) {
            console.error("Local storage full", error);
        }
    }
  }, [expenses, useCloud]);

  const addExpense = async (expense: Expense) => {
    if (useCloud) {
        try {
            await setDoc(doc(db, 'expenses', expense.id), expense);
        } catch (e) {
            console.error("Cloud save failed", e);
            alert("Failed to save to cloud. Check console.");
        }
    } else {
        setExpenses(prev => [expense, ...prev]);
    }
  };

  const updateStatus = async (id: string, status: ExpenseStatus, notes?: string) => {
    if (useCloud) {
        const updateData: any = { status };
        if (notes) updateData.notes = notes;
        await updateDoc(doc(db, 'expenses', id), updateData);
    } else {
        setExpenses(prev => prev.map(exp => {
            if (exp.id === id) {
                return { ...exp, status, notes: notes ? notes : exp.notes };
            }
            return exp;
        }));
    }
  };

  const deleteExpense = async (id: string) => {
    if (useCloud) {
        await deleteDoc(doc(db, 'expenses', id));
    } else {
        setExpenses(prev => prev.filter(exp => exp.id !== id));
    }
  };

  const deleteExpensesByUserId = async (userId: string) => {
    if (useCloud) {
        // Batch delete for efficiency
        const batch = writeBatch(db);
        const q = query(collection(db, 'expenses'), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    } else {
        setExpenses(prev => prev.filter(exp => exp.userId !== userId));
    }
  };

  const editExpense = async (id: string, updatedExpense: Partial<Expense>) => {
    if (useCloud) {
        await updateDoc(doc(db, 'expenses', id), updatedExpense);
    } else {
        setExpenses(prev => prev.map(exp => {
        if (exp.id === id) {
            return { ...exp, ...updatedExpense };
        }
        return exp;
        }));
    }
  };

  const getExpensesByUser = (userId: string) => {
    return expenses.filter(e => e.userId === userId);
  };

  return (
    <ExpenseContext.Provider value={{ expenses, addExpense, updateStatus, getExpensesByUser, deleteExpense, editExpense, deleteExpensesByUserId }}>
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
