
import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useExpenses } from '../../context/ExpenseContext';
import { useLanguage } from '../../context/LanguageContext';
import { Expense, ExpenseStatus } from '../../types';
import { Plus, Search, Calendar, CheckCircle, FileText, XCircle, Euro, Filter } from 'lucide-react';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const SalesHome: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { user } = useAuth();
  const { getExpensesByUser } = useExpenses();
  const { t, formatCurrency, language } = useLanguage();
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | 'ALL'>('ALL');
  
  // Date Filters
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-11, or -1 for All

  const myExpenses = getExpensesByUser(user?.id || '');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const getMonthName = (monthIndex: number) => {
    const date = new Date(2023, monthIndex, 1);
    return date.toLocaleString(language === 'en' ? 'en-US' : (language === 'es' ? 'es-ES' : 'fr-FR'), { month: 'long' });
  };
  
  // First, filter by Date
  const dateFilteredExpenses = useMemo(() => {
    return myExpenses.filter(e => {
      const d = new Date(e.date);
      const yearMatch = d.getFullYear() === selectedYear;
      const monthMatch = selectedMonth === -1 || d.getMonth() === selectedMonth;
      return yearMatch && monthMatch;
    });
  }, [myExpenses, selectedYear, selectedMonth]);
  
  // Calculate stats based on date filtered expenses
  const stats = useMemo(() => {
    const total = dateFilteredExpenses.reduce((acc, e) => acc + e.total, 0);
    const approved = dateFilteredExpenses.filter(e => e.status === ExpenseStatus.APPROVED).length;
    const pending = dateFilteredExpenses.filter(e => e.status === ExpenseStatus.SUBMITTED).length;
    const rejected = dateFilteredExpenses.filter(e => e.status === ExpenseStatus.REJECTED).length;

    const byCategory = dateFilteredExpenses.reduce((acc: Record<string, number>, curr) => {
        const translatedCat = t(`cat.${curr.category}`) || curr.category;
        acc[translatedCat] = (acc[translatedCat] || 0) + curr.total;
        return acc;
    }, {});

    const chartData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

    return { total, approved, pending, rejected, chartData };
  }, [dateFilteredExpenses, t]);

  // Filter by Status for list view
  const filteredExpenses = useMemo(() => {
    if (statusFilter === 'ALL') return dateFilteredExpenses;
    return dateFilteredExpenses.filter(e => e.status === statusFilter);
  }, [dateFilteredExpenses, statusFilter]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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
        <h1 className="text-2xl font-bold text-gray-900">{t('dash.myDashboard')}</h1>
        
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

            {/* Desktop Add Button */}
            <Button onClick={() => navigate('/add-expense')} className="hidden md:inline-flex ml-2">
              <Plus className="h-4 w-4 mr-2" />
              {t('nav.addExpense')}
            </Button>
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
            label={t('dash.myTotalSpend')} 
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
        {/* Chart Section */}
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

        {/* Expense List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200 flex gap-2 items-center justify-between">
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
             <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <input 
                  type="text" 
                  placeholder={t('dash.search')}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
          </div>
          
          <div className="divide-y divide-gray-100 overflow-y-auto max-h-[400px]">
            {filteredExpenses.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {t('dash.noExpenses')}
              </div>
            ) : (
              filteredExpenses.map(expense => (
                <div 
                  key={expense.id} 
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
                  onClick={() => setSelectedExpense(expense)}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                      {expense.imageUrl ? (
                        <img src={expense.imageUrl} alt="Receipt" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                          <Calendar className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{expense.merchant}</h3>
                      <p className="text-xs text-gray-500">{new Date(expense.date).toLocaleDateString()} • {t(`cat.${expense.category}`) || expense.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-sm">{formatCurrency(expense.total)}</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium mt-1 ${getStatusColor(expense.status)}`}>
                      {expense.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal 
        isOpen={!!selectedExpense} 
        onClose={() => setSelectedExpense(null)}
        title="Expense Details"
      >
        {selectedExpense && (
          <div className="space-y-6">
            <div className="aspect-[3/4] w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
              <img 
                src={selectedExpense.imageUrl} 
                alt="Receipt Full" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-gray-500 text-xs uppercase font-medium">{t('dash.merchant')}</label>
                <p className="text-gray-900 font-medium mt-1">{selectedExpense.merchant}</p>
              </div>
              <div>
                <label className="block text-gray-500 text-xs uppercase font-medium">{t('add.date')}</label>
                <p className="text-gray-900 font-medium mt-1">{selectedExpense.date}</p>
              </div>
              <div>
                <label className="block text-gray-500 text-xs uppercase font-medium">{t('add.category')}</label>
                <p className="text-gray-900 font-medium mt-1">{t(`cat.${selectedExpense.category}`) || selectedExpense.category}</p>
              </div>
              <div>
                <label className="block text-gray-500 text-xs uppercase font-medium">{t('dash.status')}</label>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${getStatusColor(selectedExpense.status)}`}>
                    {selectedExpense.status}
                </span>
              </div>
              <div className="col-span-2 border-t pt-4 mt-2">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">{t('add.subtotal')}</span>
                  <span>{formatCurrency(selectedExpense.subtotal)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">{t('add.tax')}</span>
                  <span>{formatCurrency(selectedExpense.tax)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold text-lg border-t mt-2">
                  <span>{t('add.total')}</span>
                  <span>{formatCurrency(selectedExpense.total)}</span>
                </div>
              </div>
              {selectedExpense.notes && (
                <div className="col-span-2 bg-gray-50 p-3 rounded-lg">
                   <label className="block text-gray-500 text-xs uppercase font-medium mb-1">{t('add.notes')}</label>
                   <p className="text-gray-700">{selectedExpense.notes}</p>
                </div>
              )}
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
