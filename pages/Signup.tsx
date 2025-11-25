
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/Button';
import { UserPlus, ArrowLeft } from 'lucide-react';

interface BgSymbol {
  x: number;
  y: number;
  char: string;
  size: number;
  rot: number;
}

export const Signup: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { signup } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Animation States
  const [shake, setShake] = useState(false);
  const [signupStatus, setSignupStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [bgSymbols, setBgSymbols] = useState<BgSymbol[]>([]);

  // Generate background symbols on mount (Consistent with Login page)
  useEffect(() => {
    const symbols = ['数', '式', '解', '和', '差', '積', '商', '∞', '∑', '∫', 'π', '√', '≠', '＝', '±', '×', '÷', 'α', 'β', 'θ', 'λ', 'Δ', 'Ω', '∂', '∇'];
    const newSymbols = Array.from({ length: 120 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      char: symbols[Math.floor(Math.random() * symbols.length)],
      size: Math.random() * 24 + 10, 
      rot: Math.random() * 360,
    }));
    setBgSymbols(newSymbols);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check Passwords
    if (formData.password !== formData.confirmPassword) {
      setShake(true);
      setSignupStatus('error'); // Blur effect
      setTimeout(() => setShake(false), 500); // Stop shaking after 500ms
      setTimeout(() => setSignupStatus('idle'), 2000); // Reset blur after 2s
      return;
    }

    // Success flow
    setSignupStatus('success');
    
    // Quick Transition (800ms)
    setTimeout(() => {
      signup(formData.name, formData.email, formData.password);
      // Navigate is handled by auth/app state change usually, but just in case context doesn't redirect immediately
    }, 800);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gray-50">
      
      {/* Animated Background */}
      <div className={`absolute inset-0 z-0 pointer-events-none transition-all duration-1000 bg-gradient-to-br from-gray-50 to-blue-50 ${
          signupStatus === 'error' ? 'blur-md scale-105' : 'blur-0 scale-100'
      }`}>
        {bgSymbols.map((s, i) => (
            <span 
                key={i} 
                className={`absolute font-serif select-none transition-all duration-1000 ease-in-out ${
                    signupStatus === 'success' 
                        ? 'text-blue-500 opacity-80 scale-125' 
                        : 'text-gray-300 opacity-20 scale-100'
                }`}
                style={{
                    left: `${s.x}%`,
                    top: `${s.y}%`,
                    fontSize: `${s.size}px`,
                    transform: `rotate(${s.rot}deg)`,
                    textShadow: signupStatus === 'success' ? '0 0 15px rgba(59, 130, 246, 0.9)' : 'none'
                }}
            >
                {s.char}
            </span>
        ))}
      </div>

      {/* Signup Card */}
      <div className={`relative z-10 w-full max-w-md bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ${
          signupStatus === 'success' ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
      } ${shake ? 'animate-shake' : ''}`}>
        
        <div className="p-8">
          <button 
            onClick={() => navigate('/login')} 
            className="mb-6 flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('signup.back')}
          </button>

          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
               <UserPlus className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">{t('signup.title')}</h2>
          <p className="text-center text-gray-500 mb-8">{t('signup.subtitle')}</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">{t('signup.name')}</label>
              <input
                type="text"
                id="name"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/80"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">{t('login.email')}</label>
              <input
                type="email"
                id="email"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/80"
                placeholder="name@billboard.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">{t('login.password')}</label>
              <input
                type="password"
                id="password"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/80"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">{t('signup.confirmPassword')}</label>
              <input
                type="password"
                id="confirmPassword"
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-all bg-white/80 ${
                   shake ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => {
                    setFormData({...formData, confirmPassword: e.target.value});
                    if (shake) setShake(false);
                }}
              />
            </div>
            
            <Button 
                type="submit" 
                className={`w-full transition-all duration-300 ${signupStatus === 'success' ? 'bg-green-500 hover:bg-green-600' : ''}`} 
                size="lg"
                isLoading={signupStatus === 'success'}
            >
              {signupStatus === 'success' ? 'Welcome Aboard!' : t('signup.submit')}
            </Button>
          </form>
        </div>
        <div className="bg-gray-50/90 px-8 py-4 text-center text-sm text-gray-600 border-t border-gray-100">
          {t('signup.haveAccount')}{' '}
          <button onClick={() => navigate('/login')} className="font-medium text-blue-600 hover:text-blue-500">
            {t('signup.signin')}
          </button>
        </div>
      </div>
    </div>
  );
};
