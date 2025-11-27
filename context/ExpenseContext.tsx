import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Expense, ExpenseStatus } from '../types';
import { MOCK_EXPENSES } from '../mockData';

// 1. IMPORTACIÓN CORREGIDA: Importamos Firestore para tipado y todas las funciones
import { Firestore, collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, writeBatch, query, where, getDocs } from 'firebase/firestore'; 
import { db } from '../services/firebase';

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

    // 2. Definir loadFromLocal usando useCallback para evitar el bucle infinito
    const loadFromLocal = useCallback(() => {
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
    }, []); // Dependencia vacía para que solo se cree una vez

    // Initialize Data Source
    useEffect(() => {
        // 3. CORRECCIÓN: Comprobamos si db existe antes de usarlo
        if (db) { 
            setUseCloud(true);
            
            // Real-time listener for Cloud Data
            // Usamos 'db as Firestore' para afirmar el tipo y evitar TS2769 en collection()
            const unsubscribe = onSnapshot(collection(db as Firestore, 'expenses'), (snapshot) => {
                const expensesData: Expense[] = [];
                // 4. CORRECCIÓN: Usamos ': any' para resolver el error TS7006 implícito
                snapshot.forEach((doc: any) => { 
                    const data = doc.data();
                    // Conversión de fecha si es necesario (Firestore Timestamp a ISO String)
                    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;
                    expensesData.push({ id: doc.id, ...data, createdAt } as Expense);
                });
                
                // Sort by date new to old
                expensesData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setExpenses(expensesData);
            });
            return () => unsubscribe();
        } else {
            loadFromLocal();
        }
    }, [loadFromLocal]); // Añadimos loadFromLocal como dependencia

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
        // 5. CORRECCIÓN: Comprobamos si db existe antes de intentar guardar
        if (useCloud && db) { 
            try {
                // El error TS2769 se resuelve al afirmar que db es de tipo Firestore
                await setDoc(doc(db as Firestore, 'expenses', expense.id), expense);
            } catch (e) {
                console.error("Cloud save failed", e);
                alert("Failed to save to cloud. Check console.");
            }
        } else {
            setExpenses(prev => [expense, ...prev]);
        }
    };

    const updateStatus = async (id: string, status: ExpenseStatus, notes?: string) => {
        // 5. CORRECCIÓN: Comprobamos si db existe antes de intentar guardar
        if (useCloud && db) {
            const updateData: any = { status };
            if (notes) updateData.notes = notes;
            // El error TS2769 se resuelve al afirmar que db es de tipo Firestore
            await updateDoc(doc(db as Firestore, 'expenses', id), updateData);
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
        // 5. CORRECCIÓN: Comprobamos si db existe antes de intentar guardar
        if (useCloud && db) {
            // El error TS2769 se resuelve al afirmar que db es de tipo Firestore
            await deleteDoc(doc(db as Firestore, 'expenses', id));
        } else {
            setExpenses(prev => prev.filter(exp => exp.id !== id));
        }
    };

    const deleteExpensesByUserId = async (userId: string) => {
        // 5. CORRECCIÓN: Comprobamos si db existe antes de intentar guardar
        if (useCloud && db) {
            // Batch delete for efficiency
            // El error TS2769 se resuelve al afirmar que db es de tipo Firestore
            const batch = writeBatch(db as Firestore);
            // El error TS2769 se resuelve al afirmar que db es de tipo Firestore
            const q = query(collection(db as Firestore, 'expenses'), where("userId", "==", userId)); 
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
        // 5. CORRECCIÓN: Comprobamos si db existe antes de intentar guardar
        if (useCloud && db) {
            // El error TS2769 se resuelve al afirmar que db es de tipo Firestore
            await updateDoc(doc(db as Firestore, 'expenses', id), updatedExpense);
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
