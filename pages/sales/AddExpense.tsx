
import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useExpenses } from '../../context/ExpenseContext';
import { useLanguage } from '../../context/LanguageContext';
import { analyzeReceiptImage } from '../../services/geminiService';
import { ExpenseStatus, ExpenseCategory } from '../../types';
import { Button } from '../../components/Button';
import { Camera, Upload, ArrowLeft, Save, Wand2 } from 'lucide-react';

// Since I cannot install external libs like uuid, I'll create a simple one.
const simpleId = () => Math.random().toString(36).substring(2, 15);

export const AddExpense: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { user } = useAuth();
  const { addExpense } = useExpenses();
  const { t } = useLanguage();
  
  const [step, setStep] = useState<'upload' | 'analyzing' | 'edit'>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    merchant: '',
    date: new Date().toISOString().split('T')[0],
    subtotal: 0,
    tax: 0,
    total: 0,
    category: ExpenseCategory.MISC as string,
    notes: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);
      setStep('analyzing');
      
      // Call Gemini API
      const result = await analyzeReceiptImage(base64String);
      
      setFormData({
        merchant: result.merchant,
        date: result.date || new Date().toISOString().split('T')[0],
        subtotal: result.subtotal || 0,
        tax: result.tax || 0,
        total: result.total || 0,
        category: result.category || ExpenseCategory.MISC,
        notes: ''
      });
      
      setStep('edit');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    addExpense({
      id: simpleId(),
      userId: user.id,
      userName: user.name,
      merchant: formData.merchant,
      date: formData.date,
      subtotal: formData.subtotal,
      tax: formData.tax,
      total: formData.total,
      category: formData.category,
      imageUrl: imagePreview || '',
      status: ExpenseStatus.SUBMITTED,
      notes: formData.notes,
      createdAt: new Date().toISOString()
    });

    navigate('/my-expenses');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/my-expenses')} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{t('add.title')}</h1>
      </div>

      {step === 'upload' && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-dashed border-gray-300 text-center min-h-[400px] flex flex-col items-center justify-center">
          <div className="bg-blue-50 p-4 rounded-full mb-4">
            <Camera className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('add.capture')}</h3>
          <p className="text-gray-500 mb-6 max-w-xs mx-auto">{t('add.captureDesc')}</p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
             <Button onClick={() => fileInputRef.current?.click()} size="lg" className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              {t('add.upload')}
            </Button>
          </div>
        </div>
      )}

      {step === 'analyzing' && (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-200 text-center min-h-[400px] flex flex-col items-center justify-center">
          <Wand2 className="h-12 w-12 text-purple-600 animate-pulse mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('add.analyzing')}</h3>
          <p className="text-gray-500">{t('add.analyzingDesc')}</p>
        </div>
      )}

      {step === 'edit' && (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Preview */}
          <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg h-48 md:h-fit md:sticky md:top-8 flex items-center justify-center">
             {imagePreview && (
               <img src={imagePreview} alt="Receipt" className="h-full w-auto md:w-full md:h-auto object-contain opacity-90" />
             )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('add.merchant')}</label>
              <input
                type="text"
                required
                value={formData.merchant}
                onChange={(e) => setFormData({...formData, merchant: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('add.date')}</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('add.category')}</label>
                 <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {Object.values(ExpenseCategory).map(cat => (
                    <option key={cat} value={cat}>{t(`cat.${cat}`) || cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('add.subtotal')}</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.subtotal}
                  onChange={(e) => setFormData({...formData, subtotal: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('add.tax')}</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tax}
                  onChange={(e) => setFormData({...formData, tax: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('add.total')}</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.total}
                  onChange={(e) => setFormData({...formData, total: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                />
              </div>
            </div>

             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('add.notes')}</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                rows={3}
              />
            </div>

            <div className="pt-4 border-t">
              <Button type="submit" className="w-full" size="lg">
                <Save className="h-4 w-4 mr-2" />
                {t('add.submit')}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
