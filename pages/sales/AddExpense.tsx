
import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useExpenses } from '../../context/ExpenseContext';
import { useLanguage } from '../../context/LanguageContext';
import { analyzeReceiptImage } from '../../services/geminiService';
import { ExpenseStatus, ExpenseCategory } from '../../types';
import { Button } from '../../components/Button';
import { Camera, Upload, ArrowLeft, Save, Wand2 } from 'lucide-react';

// Simple UUID generator
const simpleId = () => Math.random().toString(36).substring(2, 15);

// Legacy fallback for browsers that don't support createImageBitmap or if it fails
const compressImageLegacy = (file: File, maxWidth: number, quality: number): Promise<string> => {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = objectUrl;

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'medium'; 
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
          resolve(""); 
      }
    };

    img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        console.warn("Legacy image load failed");
        resolve(""); 
    };
  });
};

// Memory Optimized Compression using createImageBitmap with Hardware Resizing
const compressImageFile = async (file: File, maxWidth = 600, quality = 0.5): Promise<string> => {
  if (typeof createImageBitmap === 'function') {
      try {
          // CRITICAL FIX: Pass resize options DIRECTLY to the decoder.
          // This tells the GPU to downscale the 50MP image BEFORE it hits the JS memory.
          // This prevents the "Aw Snap" memory crash.
          const bitmap = await createImageBitmap(file, { 
            resizeWidth: maxWidth,
            resizeQuality: 'medium'
          });
          
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
              bitmap.close();
              return "";
          }

          ctx.drawImage(bitmap, 0, 0);
          
          // Immediately release bitmap memory
          bitmap.close(); 

          return canvas.toDataURL('image/jpeg', quality);
      } catch (e) {
          console.warn("Hardware scaling failed, trying standard bitmap...", e);
          // If the specific resize options fail, try standard bitmap, then legacy
          try {
             const bitmap = await createImageBitmap(file);
             // ... manual resize logic would go here, but risking crash.
             // simpler to fall back to legacy if hardware resize fails.
             bitmap.close();
             return compressImageLegacy(file, maxWidth, quality);
          } catch (e2) {
             return compressImageLegacy(file, maxWidth, quality);
          }
      }
  }
  return compressImageLegacy(file, maxWidth, quality);
};

export const AddExpense: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { user } = useAuth();
  const { addExpense } = useExpenses();
  const { t } = useLanguage();
  
  const [step, setStep] = useState<'upload' | 'analyzing' | 'edit'>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
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
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Clear previous state to free memory
    setImagePreview(null);
    setIsCompressing(true);

    try {
        // 2. Compress using memory-efficient method
        // Using 600px width is plenty for AI and keeps base64 string small
        const compressedBase64 = await compressImageFile(file, 600, 0.5);
        
        if (!compressedBase64) {
            throw new Error("Compression failed");
        }

        setImagePreview(compressedBase64);
        setStep('analyzing');
        
        // 3. Call Gemini API with the COMPRESSED image
        const result = await analyzeReceiptImage(compressedBase64);
        
        // Ensure date is valid, fallback to Today if Gemini fails to find one
        let validDate = result.date;
        if (!validDate || isNaN(Date.parse(validDate))) {
            validDate = new Date().toISOString().split('T')[0];
        }

        setFormData({
          merchant: result.merchant || '',
          date: validDate,
          subtotal: result.subtotal || 0,
          tax: result.tax || 0,
          total: result.total || 0,
          category: result.category || ExpenseCategory.MISC,
          notes: ''
        });
        
        setStep('edit');
    } catch (error) {
        console.error("Error processing image", error);
        alert("Error processing image. Please try again.");
        setStep('upload');
    } finally {
        setIsCompressing(false);
        // Reset inputs so the same file can be selected again if needed
        if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
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
    } catch (error) {
        alert("Error saving expense. Local storage might be full.");
        console.error(error);
    }
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
          
          <div className="flex flex-col gap-4 w-full max-w-md justify-center">
            {/* Standard File Upload */}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {/* Camera Capture Input (Rear Camera) */}
            <input 
              type="file" 
              accept="image/*"
              capture="environment" 
              className="hidden" 
              ref={cameraInputRef}
              onChange={handleFileChange}
            />
            
            <Button 
                onClick={() => cameraInputRef.current?.click()} 
                size="lg" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                isLoading={isCompressing}
            >
              <Camera className="h-5 w-5 mr-2" />
              {t('add.takePhoto')}
            </Button>

             <Button 
                onClick={() => fileInputRef.current?.click()} 
                size="lg" 
                variant="secondary"
                className="w-full"
                isLoading={isCompressing}
            >
              <Upload className="h-5 w-5 mr-2" />
              {t('add.uploadGallery')}
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
