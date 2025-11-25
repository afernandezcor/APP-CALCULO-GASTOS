
import React, { useMemo, useState } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Expense, ExpenseStatus } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CheckCircle, XCircle, FileText, Euro, Filter, Calendar, Plus } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';

export const ManagerDashboard: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { expenses, updateStatus } = useExpenses();
  const { allUsers } = useAuth();
  const { t, formatCurrency, language } = useLanguage();
  
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [employeeFilter, setEmployeeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | 'ALL'>('ALL');
  
  // Date Filters
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-11, or -1 for All

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const getMonthName = (monthIndex: number) => {
    const date = new Date(2023, monthIndex, 1);
    return date.toLocaleString(language === 'en' ? 'en-US' : (language === 'es' ? 'es-ES' : 'fr-FR'), { month: 'long' });
  };

  // Filter by Employee AND Date
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      // Employee Filter
      const employeeMatch = employeeFilter === 'ALL' || e.userId === employeeFilter;
      
      // Date Filter
      const d = new Date(e.date);
      const yearMatch = d.getFullYear() === selectedYear;
      const monthMatch = selectedMonth === -1 || d.getMonth() === selectedMonth;
      
      return employeeMatch && yearMatch && monthMatch;
    });
  }, [expenses, employeeFilter, selectedYear, selectedMonth]);

  // Stats and Charts based on filteredExpenses
  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((acc, e) => acc + e.total, 0);
    const approved = filteredExpenses.filter(e => e.status === ExpenseStatus.APPROVED).length;
    const pending = filteredExpenses.filter(e => e.status === ExpenseStatus.SUBMITTED).length;
    const rejected = filteredExpenses.filter(e => e.status === ExpenseStatus.REJECTED).length;
    
    const byCategory = filteredExpenses.reduce((acc: Record<string, number>, curr) => {
        const translatedCat = t(`cat.${curr.category}`) || curr.category;
        acc[translatedCat] = (acc[translatedCat] || 0) + curr.total;
        return acc;
    }, {});

    const chartData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));
    
    return { total, approved, pending, rejected, chartData };
  }, [filteredExpenses, t]);

  // Filter for the list view based on Status Card selection (applied ON TOP of filteredExpenses)
  const displayedExpenses = useMemo(() => {
    if (statusFilter === 'ALL') return filteredExpenses;
    return filteredExpenses.filter(e => e.status === statusFilter);
  }, [filteredExpenses, statusFilter]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const handleStatusChange = (status: ExpenseStatus) => {
    if (selectedExpense) {
      updateStatus(selectedExpense.id, status);
      setSelectedExpense(null);
    }
  };

  const getStatusColor = (status: ExpenseStatus) => {
    switch (status) {
      case ExpenseStatus.APPROVED: return 'bg-green-100 text-green-800';
      case ExpenseStatus.REJECTED: return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('dash.dashboard')}</h1>
        
        <div className="flex flex-wrap gap-2">
            {/* Year Filter */}
             <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <select 
                    className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                    <option value={2023}>2023</option>
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                </select>
            </div>

            {/* Month Filter */}
            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                <Filter className="h-4 w-4 text-gray-500" />
                <select 
                    className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                >
                    <option value={-1}>{t('dash.allMonths')}</option>
                    {months.map((m, i) => (
                        <option key={i} value={i}>{getMonthName(i)}</option>
                    ))}
                </select>
            </div>

            {/* Employee Filter */}
            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                <span className="text-xs text-gray-400 font-bold px-1 border-r border-gray-200 mr-1">USER</span>
                <select 
                    className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
                    value={employeeFilter}
                    onChange={(e) => setEmployeeFilter(e.target.value)}
                >
                    <option value="ALL">{t('dash.viewAll')}</option>
                    {allUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>
            </div>
        </div>
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      <button
        onClick={() => navigate('/add-expense')}
        className="md:hidden fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700 transition-transform active:scale-95 flex items-center justify-center"
        aria-label={t('nav.addExpense')}
      >
        <Plus className="h-8 w-8" />
      </button>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard 
            icon={<Euro />} 
            label={t('dash.totalSpend')} 
            value={formatCurrency(stats.total)} 
            onClick={() => setStatusFilter('ALL')}
            active={statusFilter === 'ALL'}
        />
        <StatCard 
            icon={<CheckCircle />} 
            label={t('dash.approved')} 
            value={stats.approved} 
            onClick={() => setStatusFilter(ExpenseStatus.APPROVED)}
            active={statusFilter === ExpenseStatus.APPROVED}
        />
        <StatCard 
            icon={<FileText />} 
            label={t('dash.pending')} 
            value={stats.pending} 
            onClick={() => setStatusFilter(ExpenseStatus.SUBMITTED)}
            active={statusFilter === ExpenseStatus.SUBMITTED}
        />
        <StatCard 
            icon={<XCircle />} 
            label={t('dash.rejected')} 
            value={stats.rejected} 
            onClick={() => setStatusFilter(ExpenseStatus.REJECTED)}
            active={statusFilter === ExpenseStatus.REJECTED}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
           <h3 className="text-lg font-bold text-gray-900 mb-6">{t('dash.spendByCategory')}</h3>
           {stats.chartData.length > 0 ? (
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(val) => formatCurrency(val).split(' ')[0]} />
                    <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), t('dash.total')]}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {stats.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            </div>
           ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
                {t('dash.noExpenses')} for selected period
            </div>
           )}
        </div>

        {/* Recent Expenses Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
           <div className="p-6 border-b border-gray-200 flex justify-between items-center">
             <div className="flex flex-col">
                <h3 className="text-lg font-bold text-gray-900">{t('dash.recentExpenses')}</h3>
                <div className="flex gap-2 text-xs mt-1">
                     {statusFilter !== 'ALL' && (
                        <span className="text-blue-600 font-medium">
                            Status: {statusFilter}
                        </span>
                    )}
                </div>
             </div>
           </div>
           <div className="overflow-y-auto flex-1 max-h-[400px]">
             {displayedExpenses.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    {t('dash.noExpenses')}
                </div>
             ) : (
                <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                    <tr>
                    <th className="px-6 py-3">{t('dash.employee')}</th>
                    <th className="px-6 py-3">{t('dash.merchant')}</th>
                    <th className="px-6 py-3">{t('dash.total')}</th>
                    <th className="px-6 py-3">{t('dash.status')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {displayedExpenses.slice(0, 20).map(expense => (
                    <tr 
                        key={expense.id} 
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedExpense(expense)}
                    >
                        <td className="px-6 py-4 font-medium text-gray-900">{expense.userName}</td>
                        <td className="px-6 py-4 text-gray-500">
                            <div>{expense.merchant}</div>
                            <div className="text-xs text-gray-400">{new Date(expense.date).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-bold">{formatCurrency(expense.total)}</td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(expense.status)}`}>
                                {expense.status}
                            </span>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
             )}
           </div>
        </div>
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        title="Review Expense"
      >
        {selectedExpense && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
               {selectedExpense.imageUrl ? (
                   <img src={selectedExpense.imageUrl} alt="receipt" className="max-h-[400px] w-full object-contain" />
               ) : (
                   <div className="p-10 text-gray-400">No Image</div>
               )}
            </div>
            <div className="flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold">{t('dash.employee')}</label>
                  <p className="text-lg font-medium">{selectedExpense.userName}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-bold">Details</label>
                  <p className="text-gray-900 font-medium">{selectedExpense.merchant}</p>
                  <p className="text-gray-600 text-sm">{t(`cat.${selectedExpense.category}`) || selectedExpense.category} • {new Date(selectedExpense.date).toLocaleDateString()}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                   <label className="text-xs text-blue-500 uppercase font-bold">Total Amount</label>
                   <p className="text-2xl font-bold text-blue-900">{formatCurrency(selectedExpense.total)}</p>
                   <div className="text-xs text-blue-600 mt-1 flex justify-between w-32">
                     <span>Sub: {selectedExpense.subtotal}</span>
                     <span>Tax: {selectedExpense.tax}</span>
                   </div>
                </div>
                {selectedExpense.notes && (
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-bold">{t('add.notes')}</label>
                    <p className="text-gray-700 italic text-sm bg-gray-50 p-2 rounded">"{selectedExpense.notes}"</p>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t flex gap-3 mt-4">
                {selectedExpense.status === ExpenseStatus.SUBMITTED ? (
                  <>
                     <Button 
                      variant="primary" 
                      className="flex-1 bg-green-600 hover:bg-green-700 border-transparent"
                      onClick={() => handleStatusChange(ExpenseStatus.APPROVED)}
                    >
                      Approve
                    </Button>
                    <Button 
                      variant="danger" 
                      className="flex-1"
                      onClick={() => handleStatusChange(ExpenseStatus.REJECTED)}
                    >
                      Reject
                    </Button>
                  </>
                ) : (
                  <div className={`w-full text-center py-2 rounded-lg font-medium ${getStatusColor(selectedExpense.status)}`}>
                    Expense is {selectedExpense.status}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    onClick?: () => void;
    active?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, onClick, active }) => (
  <div 
    className={`bg-white p-4 rounded-2xl shadow-sm border transition-all cursor-pointer flex flex-col justify-between h-32 ${active ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}`}
    onClick={onClick}
  >
    <div className="text-gray-900">
      {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "h-6 w-6" })}
    </div>
    <div>
      <p className={`text-xs font-medium mb-1 ${active ? 'text-blue-600' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-xl font-bold ${active ? 'text-blue-900' : 'text-gray-900'} truncate`}>{value}</p>
    </div>
  </div>
);
