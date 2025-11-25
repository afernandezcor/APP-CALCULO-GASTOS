import React, { useState, useMemo, useEffect } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ExpenseCategory, UserRole } from '../../types';
import { Button } from '../../components/Button';
import { Download, Plus, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface EditableRow {
  id: string;
  date: string;
  destino: string;
  km: number;
  gasolina: number;
  parking: number;
  comidas: number;
  hoteles: number;
  transporte: number;
  varios: number;
  total: number;
  isManual?: boolean;
}

export const ExpenseReport: React.FC = () => {
  const { expenses } = useExpenses();
  const { user, allUsers } = useAuth();
  const { t, formatCurrency, language } = useLanguage();
  const isManagerOrAdmin = user?.role === UserRole.MANAGER || user?.role === UserRole.ADMIN;

  const [selectedMonth, setSelectedMonth] = useState<number>(3); // April (0-indexed 3)
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [mileageRate, setMileageRate] = useState<number>(0.427);
  const [cardName, setCardName] = useState<string>('CMO Valves');
  
  // If manager, default to a mock user (Aritz) for demo purposes, otherwise default to current user
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(() => {
    if (isManagerOrAdmin) return 'u4'; 
    return user?.id || '';
  });

  const [editableRows, setEditableRows] = useState<EditableRow[]>([]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Simple translation for months
  const getMonthName = (monthIndex: number) => {
    const date = new Date(2023, monthIndex, 1);
    return date.toLocaleString(language === 'en' ? 'en-US' : (language === 'es' ? 'es-ES' : 'fr-FR'), { month: 'long' });
  };

  const years = [2023, 2024, 2025];

  // Initialize Editable Rows when filters change
  useEffect(() => {
    const targetId = isManagerOrAdmin ? selectedEmployeeId : user?.id;
    
    const filtered = expenses.filter(exp => {
      const d = new Date(exp.date);
      return (
        exp.userId === targetId &&
        d.getMonth() === selectedMonth &&
        d.getFullYear() === selectedYear
      );
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const mapped = filtered.map(exp => {
      const category = exp.category;
      const amount = exp.total;

      return {
        id: exp.id,
        date: new Date(exp.date).toLocaleDateString(language === 'en' ? 'en-GB' : (language === 'es' ? 'es-ES' : 'fr-FR')),
        destino: exp.merchant,
        km: category === ExpenseCategory.MILEAGE ? (exp.distance || 0) : 0,
        gasolina: category === ExpenseCategory.FUEL ? amount : 0,
        parking: category === ExpenseCategory.PARKING ? amount : 0,
        comidas: category === ExpenseCategory.RESTAURANT ? amount : 0,
        hoteles: category === ExpenseCategory.HOTEL ? amount : 0,
        transporte: category === ExpenseCategory.TRANSPORT ? amount : 0,
        varios: (category === ExpenseCategory.MISC || category === ExpenseCategory.SUPPLIES) ? amount : 0,
        total: amount,
        isManual: false
      };
    });

    setEditableRows(mapped);
  }, [expenses, selectedMonth, selectedYear, selectedEmployeeId, isManagerOrAdmin, user, language]);

  // Handle Cell Updates
  const handleCellChange = (index: number, field: keyof EditableRow, value: string | number) => {
    const updatedRows = [...editableRows];
    const row = { ...updatedRows[index] };
    
    if (field === 'destino' || field === 'date') {
       // String fields
       (row as any)[field] = value;
    } else {
       // Number fields
       const numValue = parseFloat(value as string) || 0;
       (row as any)[field] = numValue;
    }

    // Recalculate row total (Sum of money fields, excluding KM)
    if (field !== 'destino' && field !== 'date' && field !== 'km') {
       row.total = row.gasolina + row.parking + row.comidas + row.hoteles + row.transporte + row.varios;
    }

    updatedRows[index] = row;
    setEditableRows(updatedRows);
  };

  const handleAddRow = () => {
    // Auto-construct a date string in DD/MM/YYYY format for the current selected month
    const day = '01';
    const month = (selectedMonth + 1).toString().padStart(2, '0');
    const year = selectedYear;
    const defaultDate = `${day}/${month}/${year}`;

    const newRow: EditableRow = {
      id: `manual-${Date.now()}`,
      date: defaultDate,
      destino: '',
      km: 0,
      gasolina: 0,
      parking: 0,
      comidas: 0,
      hoteles: 0,
      transporte: 0,
      varios: 0,
      total: 0,
      isManual: true
    };
    setEditableRows([...editableRows, newRow]);
  };

  const handleDeleteRow = (id: string) => {
    setEditableRows(editableRows.filter(row => row.id !== id));
  };

  // Calculate Totals from Editable Rows
  const totals = useMemo(() => {
    return editableRows.reduce((acc, row) => ({
      km: acc.km + row.km,
      gasolina: acc.gasolina + row.gasolina,
      parking: acc.parking + row.parking,
      comidas: acc.comidas + row.comidas,
      hoteles: acc.hoteles + row.hoteles,
      transporte: acc.transporte + row.transporte,
      varios: acc.varios + row.varios,
      total: acc.total + row.total
    }), { km: 0, gasolina: 0, parking: 0, comidas: 0, hoteles: 0, transporte: 0, varios: 0, total: 0 });
  }, [editableRows]);

  const totalMileageCost = totals.km * mileageRate;
  const grandTotal = totals.total + totalMileageCost;

  // Export Function
  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    
    let selectedEmployeeName = '';
    if (isManagerOrAdmin) {
        selectedEmployeeName = allUsers.find(e => e.id === selectedEmployeeId)?.name || 'Unknown';
    } else {
        selectedEmployeeName = user?.name || 'Unknown';
    }
    
    const monthName = getMonthName(selectedMonth);

    // Build Sheet Data with Localized Headers
    const wsData = [
      [t('excel.expensesBy'), selectedEmployeeName.toUpperCase(), '', '', 'O, SUMINISTRO :', 'CMO VALVES'],
      [t('excel.monthOf'), monthName.toUpperCase(), '', '', t('excel.year'), selectedYear, t('excel.card'), cardName],
      [], // Spacer
      [t('col.day'), t('col.destination'), t('col.km'), t('col.fuel'), t('col.parking'), t('col.meals'), t('col.hotels'), t('col.transport'), t('col.misc'), t('col.total')], // Header
    ];

    // Data Rows
    editableRows.forEach(row => {
      wsData.push([
        row.date,
        row.destino,
        row.km || '',
        row.gasolina || '',
        row.parking || '',
        row.comidas || '',
        row.hoteles || '',
        row.transporte || '',
        row.varios || '',
        row.total
      ]);
    });

    // Totals Row
    wsData.push([
      t('excel.totals'),
      '',
      totals.km || '',
      totals.gasolina || '',
      totals.parking || '',
      totals.comidas,
      totals.hoteles,
      totals.transporte,
      totals.varios,
      totals.total
    ]);

    // Footer Meta
    wsData.push([]);
    wsData.push(['', '', totals.km, `Km. a ${mileageRate} € ==>`, totalMileageCost, '', '', '', '+', totals.total]);
    wsData.push(['', '', '', '', '', '', '', t('excel.totalExpenses'), '', grandTotal]);
    wsData.push(['', '', '', '', '', '', '', t('excel.advance'), '', 0]);
    wsData.push(['', '', '', '', '', '', '', t('excel.balance'), '', grandTotal]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column Widths
    ws['!cols'] = [
        { wch: 12 }, // Date
        { wch: 40 }, // Destino
        { wch: 8 }, // KM
        { wch: 10 }, // Gasolina
        { wch: 10 }, // Parking
        { wch: 10 }, // Comidas
        { wch: 10 }, // Hoteles
        { wch: 12 }, // Transporte
        { wch: 10 }, // Varios
        { wch: 12 }  // Total
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Expense Report');
    XLSX.writeFile(wb, `Expense_Report_${selectedEmployeeName.replace(/\s+/g, '_')}_${monthName}_${selectedYear}.xlsx`);
  };
  
  const displayEmployeeName = isManagerOrAdmin 
      ? (allUsers.find(e => e.id === selectedEmployeeId)?.name || 'Unknown')
      : (user?.name || 'Unknown');

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('report.title')}</h1>
        <div className="flex gap-2">
          <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">
            <Download className="h-4 w-4 mr-2" />
            {t('report.export')}
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 grid md:grid-cols-6 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('report.year')}</label>
          <select 
            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('report.month')}</label>
          <select 
            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {months.map((m, i) => <option key={m} value={i}>{getMonthName(i)}</option>)}
          </select>
        </div>
         <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('report.mileageRate')}</label>
          <input 
            type="number"
            step="0.001"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={mileageRate}
            onChange={(e) => setMileageRate(parseFloat(e.target.value) || 0)}
          />
        </div>
        {isManagerOrAdmin && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('report.employee')}</label>
            <select 
              className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              {allUsers.map(e => (
                 <option key={e.id} value={e.id}>
                   {e.name} {e.role === UserRole.MANAGER || e.role === UserRole.ADMIN ? `(${e.role})` : ''}
                 </option>
              ))}
            </select>
          </div>
        )}
         <div className="flex items-end">
            <Button onClick={handleAddRow} variant="secondary" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                {t('report.addRow')}
            </Button>
         </div>
      </div>

      {/* Excel Preview */}
      <div className="bg-white shadow-lg rounded-lg overflow-x-auto border border-gray-300">
        <div className="min-w-[1000px] p-6 bg-white font-mono text-sm">
            {/* Excel Header */}
            <div className="grid grid-cols-12 border-2 border-black mb-4 bg-gray-50">
                <div className="col-span-2 p-2 font-bold border-r border-gray-400 border-b">{t('excel.expensesBy')}</div>
                <div className="col-span-4 p-2 font-bold border-r border-gray-400 border-b bg-white">{displayEmployeeName.toUpperCase()}</div>
                <div className="col-span-2 p-2 font-bold border-r border-gray-400 border-b text-right">O, SUMINISTRO :</div>
                <div className="col-span-4 p-2 font-bold border-b bg-white">CMO VALVES</div>

                <div className="col-span-2 p-2 font-bold border-r border-gray-400 border-b">{t('excel.monthOf')}</div>
                <div className="col-span-4 p-2 font-bold border-r border-gray-400 border-b bg-white">{getMonthName(selectedMonth).toUpperCase()}</div>
                <div className="col-span-1 p-2 font-bold border-r border-gray-400 border-b text-right">{t('excel.year')}</div>
                <div className="col-span-1 p-2 font-bold border-r border-gray-400 border-b bg-white text-center">{selectedYear}</div>
                <div className="col-span-1 p-2 font-bold border-r border-gray-400 border-b text-right bg-yellow-50 text-blue-900">{t('excel.card')}</div>
                <div className="col-span-3 p-2 font-bold border-b bg-white p-0 relative group">
                    <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full h-full px-2 font-bold bg-transparent focus:outline-none focus:bg-yellow-50 border-b-2 border-transparent focus:border-blue-500 transition-all"
                        placeholder="Enter Card Name..."
                    />
                </div>
            </div>

            {/* Data Table */}
            <table className="w-full border-collapse border border-black text-xs">
                <thead>
                    <tr>
                        <th colSpan={2}></th>
                        <th colSpan={1}></th>
                        <th colSpan={1}></th>
                        <th className="border border-black bg-white font-bold text-center">{t('excel.highway')}</th>
                        <th colSpan={5} className="border border-black bg-gray-100 font-bold text-center">{t('excel.means')}</th>
                        <th className="bg-white border-none"></th>
                    </tr>
                    <tr className="bg-white">
                        <th className="border border-black p-1 w-24">{t('col.day')}</th>
                        <th className="border border-black p-1 text-left">{t('col.destination')}</th>
                        <th className="border border-black p-1 w-16">{t('col.km')}</th>
                        <th className="border border-black p-1 w-20">{t('col.fuel')}</th>
                        <th className="border border-black p-1 w-20">{t('col.parking')}</th>
                        <th className="border border-black p-1 w-20">{t('col.meals')}</th>
                        <th className="border border-black p-1 w-20">{t('col.hotels')}</th>
                        <th className="border border-black p-1 w-24">{t('col.transport')}</th>
                        <th className="border border-black p-1 w-20">{t('col.misc')}</th>
                        <th className="border border-black p-1 w-20">{t('col.total')}</th>
                        <th className="w-8 border-none"></th>
                    </tr>
                </thead>
                <tbody>
                    {editableRows.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-blue-50 h-6 group">
                            <td className="border border-gray-400 p-0">
                              <input 
                                type="text" 
                                value={row.date} 
                                onChange={(e) => handleCellChange(idx, 'date', e.target.value)}
                                className="w-full h-full px-1 py-0.5 text-center bg-transparent focus:bg-white focus:outline-none text-xs"
                              />
                            </td>
                            <td className="border border-gray-400 p-0">
                               <input 
                                type="text" 
                                value={row.destino} 
                                onChange={(e) => handleCellChange(idx, 'destino', e.target.value)}
                                className="w-full h-full px-1 py-0.5 text-left bg-transparent focus:bg-white focus:outline-none text-xs"
                              />
                            </td>
                            <td className="border border-gray-400 p-0">
                               <input 
                                type="number" 
                                value={row.km || ''} 
                                onChange={(e) => handleCellChange(idx, 'km', e.target.value)}
                                className="w-full h-full px-1 py-0.5 text-right bg-transparent focus:bg-white focus:outline-none text-xs"
                              />
                            </td>
                            <td className="border border-gray-400 p-0">
                              <input 
                                type="number" 
                                value={row.gasolina || ''} 
                                onChange={(e) => handleCellChange(idx, 'gasolina', e.target.value)}
                                className="w-full h-full px-1 py-0.5 text-right bg-transparent focus:bg-white focus:outline-none text-xs"
                              />
                            </td>
                            <td className="border border-gray-400 p-0">
                               <input 
                                type="number" 
                                value={row.parking || ''} 
                                onChange={(e) => handleCellChange(idx, 'parking', e.target.value)}
                                className="w-full h-full px-1 py-0.5 text-right bg-transparent focus:bg-white focus:outline-none text-xs"
                              />
                            </td>
                            <td className={`border border-gray-400 p-0 ${row.comidas > 0 ? 'bg-yellow-200' : ''}`}>
                               <input 
                                type="number" 
                                value={row.comidas || ''} 
                                onChange={(e) => handleCellChange(idx, 'comidas', e.target.value)}
                                className="w-full h-full px-1 py-0.5 text-right bg-transparent focus:bg-white focus:outline-none text-xs"
                              />
                            </td>
                            <td className={`border border-gray-400 p-0 ${row.hoteles > 0 ? 'bg-green-100' : ''}`}>
                               <input 
                                type="number" 
                                value={row.hoteles || ''} 
                                onChange={(e) => handleCellChange(idx, 'hoteles', e.target.value)}
                                className="w-full h-full px-1 py-0.5 text-right bg-transparent focus:bg-white focus:outline-none text-xs"
                              />
                            </td>
                            <td className={`border border-gray-400 p-0 ${row.transporte > 0 ? 'bg-green-100' : ''}`}>
                               <input 
                                type="number" 
                                value={row.transporte || ''} 
                                onChange={(e) => handleCellChange(idx, 'transporte', e.target.value)}
                                className="w-full h-full px-1 py-0.5 text-right bg-transparent focus:bg-white focus:outline-none text-xs"
                              />
                            </td>
                            <td className={`border border-gray-400 p-0 ${row.varios > 0 ? 'bg-green-100' : ''}`}>
                               <input 
                                type="number" 
                                value={row.varios || ''} 
                                onChange={(e) => handleCellChange(idx, 'varios', e.target.value)}
                                className="w-full h-full px-1 py-0.5 text-right bg-transparent focus:bg-white focus:outline-none text-xs"
                              />
                            </td>
                            <td className="border border-gray-400 px-1 text-right bg-gray-50 font-medium flex items-center justify-end h-full">
                                {formatCurrency(row.total)}
                            </td>
                             <td className="border-none px-2">
                                {row.isManual && (
                                    <button onClick={() => handleDeleteRow(row.id)} className="text-red-400 hover:text-red-600">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                    
                    {/* Fill empty rows for visuals if list is short */}
                    {Array.from({ length: Math.max(0, 15 - editableRows.length) }).map((_, idx) => (
                         <tr key={`empty-${idx}`} className="h-6">
                            <td className="border border-gray-400 px-1 bg-white">&nbsp;</td>
                            <td className="border border-gray-400 px-1 bg-white"></td>
                            <td className="border border-gray-400 px-1 bg-white"></td>
                            <td className="border border-gray-400 px-1 bg-white"></td>
                            <td className="border border-gray-400 px-1 bg-white"></td>
                            <td className="border border-gray-400 px-1 bg-white"></td>
                            <td className="border border-gray-400 px-1 bg-white"></td>
                            <td className="border border-gray-400 px-1 bg-white"></td>
                            <td className="border border-gray-400 px-1 bg-white"></td>
                            <td className="border border-gray-400 px-1 bg-white"></td>
                        </tr>
                    ))}

                    {/* Totals Row */}
                    <tr className="font-bold border-t-2 border-black">
                        <td className="border border-gray-400 px-1 bg-white">{t('excel.totals')}</td>
                        <td className="border border-gray-400 px-1 bg-white"></td>
                        <td className="border border-gray-400 px-1 text-right bg-white">{totals.km > 0 ? totals.km : '0,00'}</td>
                        <td className="border border-gray-400 px-1 text-right bg-white">{totals.gasolina ? formatCurrency(totals.gasolina) : '0,00'}</td>
                        <td className="border border-gray-400 px-1 text-right bg-white">{totals.parking ? formatCurrency(totals.parking) : '0,00'}</td>
                        <td className="border border-gray-400 px-1 text-right bg-white">{formatCurrency(totals.comidas)}</td>
                        <td className="border border-gray-400 px-1 text-right bg-white">{formatCurrency(totals.hoteles)}</td>
                        <td className="border border-gray-400 px-1 text-right bg-white">{formatCurrency(totals.transporte)}</td>
                        <td className="border border-gray-400 px-1 text-right bg-white">{formatCurrency(totals.varios)}</td>
                        <td className="border border-gray-400 px-1 text-right bg-white">{formatCurrency(totals.total)}</td>
                    </tr>
                </tbody>
            </table>

            {/* Footer Calculation Area */}
            <div className="mt-4 grid grid-cols-12 gap-4 text-xs">
                <div className="col-span-6"></div> {/* Spacer */}
                
                <div className="col-span-6 grid grid-cols-6 gap-0">
                    {/* Mileage Calculation */}
                    <div className="col-span-1 font-bold text-right py-1 px-2">{totals.km}</div>
                    <div className="col-span-3 font-bold text-center py-1">Km. a {mileageRate} € =={'>'}</div>
                    <div className="col-span-2 border border-black text-right px-2 py-1">{formatCurrency(totalMileageCost)}</div>
                    
                    {/* Total Gastos */}
                    <div className="col-span-4"></div>
                    <div className="col-span-1 text-center font-bold py-2">+</div>
                    <div className="col-span-1 border border-black text-right px-2 py-2 font-bold">{formatCurrency(totals.total)}</div>

                    {/* Grand Totals Block */}
                    <div className="col-span-2"></div>
                    <div className="col-span-2 font-bold text-right py-1 border-t border-l border-black mt-2">{t('excel.totalExpenses')}</div>
                    <div className="col-span-2 border border-black text-right px-2 py-1 mt-2 font-bold bg-white">{formatCurrency(grandTotal)}</div>

                    <div className="col-span-2"></div>
                    <div className="col-span-2 font-bold text-right py-1 border-l border-black">{t('excel.advance')}</div>
                    <div className="col-span-2 border border-black text-right px-2 py-1 bg-white">0,00</div>

                    <div className="col-span-2"></div>
                    <div className="col-span-2 font-bold text-right py-1 border-l border-b border-black">{t('excel.balance')}</div>
                    <div className="col-span-2 border border-black text-right px-2 py-1 font-bold bg-white">{formatCurrency(grandTotal)}</div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};