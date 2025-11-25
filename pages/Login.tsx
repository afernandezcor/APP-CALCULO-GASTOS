
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/Button';
import { Euro } from 'lucide-react';

interface BgSymbol {
  x: number;
  y: number;
  char: string;
  size: number;
  rot: number;
}

export const Login: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { login, allUsers } = useAuth();
  const { t, setLanguage, language } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Animation states: 'idle' | 'success' | 'error'
  const [loginStatus, setLoginStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [bgSymbols, setBgSymbols] = useState<BgSymbol[]>([]);

  // Generate background symbols on mount
  useEffect(() => {
    const symbols = ['数', '式', '解', '和', '差', '積', '商', '∞', '∑', '∫', 'π', '√', '≠', '＝', '±', '×', '÷', 'α', 'β', 'θ', 'λ', 'Δ', 'Ω', '∂', '∇'];
    const newSymbols = Array.from({ length: 120 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      char: symbols[Math.floor(Math.random() * symbols.length)],
      size: Math.random() * 24 + 10, // 10px to 34px
      rot: Math.random() * 360,
    }));
    setBgSymbols(newSymbols);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoginStatus('idle');

    // Pre-check credentials to trigger animations
    // Note: We manually check against allUsers here just for the visual effect logic
    // The actual login call will be made after the animation if successful
    const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (user) {
        // Success Animation: Light up symbols
        setLoginStatus('success');
        
        // Delay actual login to show animation - FASTER NOW (800ms)
        setTimeout(() => {
            login(email, password); 
        }, 800);
    } else {
        // Error Animation: Blur background
        setLoginStatus('error');
        setError('Invalid email or password.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
      if (loginStatus === 'error') {
          setLoginStatus('idle');
          setError('');
      }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value);
      if (loginStatus === 'error') {
          setLoginStatus('idle');
          setError('');
      }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gray-50">
      
      {/* Animated Background */}
      <div className={`absolute inset-0 z-0 pointer-events-none transition-all duration-1000 bg-gradient-to-br from-gray-50 to-blue-50 ${
          loginStatus === 'error' ? 'blur-md scale-105' : 'blur-0 scale-100'
      }`}>
        {bgSymbols.map((s, i) => (
            <span 
                key={i} 
                className={`absolute font-serif select-none transition-all duration-1000 ease-in-out ${
                    loginStatus === 'success' 
                        ? 'text-blue-500 opacity-80 scale-125' 
                        : 'text-gray-300 opacity-20 scale-100'
                }`}
                style={{
                    left: `${s.x}%`,
                    top: `${s.y}%`,
                    fontSize: `${s.size}px`,
                    transform: `rotate(${s.rot}deg)`,
                    textShadow: loginStatus === 'success' ? '0 0 15px rgba(59, 130, 246, 0.9)' : 'none'
                }}
            >
                {s.char}
            </span>
        ))}
      </div>

      {/* Login Card */}
      <div className={`relative z-10 w-full max-w-md bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ${
          loginStatus === 'success' ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'
      }`}>
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
             <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
                <Euro className="h-8 w-8 text-white" />
             </div>
             <div className="flex gap-1">
                <button onClick={() => setLanguage('en')} className={`text-xs px-2 py-1 rounded transition-colors ${language === 'en' ? 'bg-gray-200 font-bold text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}>EN</button>
                <button onClick={() => setLanguage('es')} className={`text-xs px-2 py-1 rounded transition-colors ${language === 'es' ? 'bg-gray-200 font-bold text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}>ES</button>
                <button onClick={() => setLanguage('fr')} className={`text-xs px-2 py-1 rounded transition-colors ${language === 'fr' ? 'bg-gray-200 font-bold text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}>FR</button>
             </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">{t('login.welcome')}</h2>
          <p className="text-center text-gray-500 mb-8">{t('login.subtitle')}</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg animate-shake border border-red-100">
                    {error}
                </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">{t('login.email')}</label>
              <input
                type="email"
                id="email"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white/80"
                placeholder="name@billboard.com"
                value={email}
                onChange={handleInputChange}
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
                value={password}
                onChange={handlePasswordChange}
              />
            </div>

            <Button 
                type="submit" 
                className={`w-full transition-all duration-300 ${loginStatus === 'success' ? 'bg-green-500 hover:bg-green-600' : ''}`} 
                size="lg"
                isLoading={loginStatus === 'success'}
            >
              {loginStatus === 'success' ? 'Access Granted' : t('login.submit')}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-400 bg-gray-50/80 p-3 rounded-lg border border-gray-100">
             <p className="font-semibold mb-1">{t('login.demo')}:</p>
             <div className="space-y-1">
               <div className="flex justify-between px-4">
                 <span>Sales:</span> <span className="font-mono text-gray-600">alex@billboard.com</span>
               </div>
               <div className="flex justify-between px-4">
                 <span>Manager:</span> <span className="font-mono text-gray-600">jordan@billboard.com</span>
               </div>
               <div className="flex justify-between px-4">
                 <span>Admin:</span> <span className="font-mono text-gray-600">admin@billboard.com</span>
               </div>
                <div className="flex justify-between px-4 border-t border-gray-200 pt-1 mt-1">
                 <span>Password:</span> <span className="font-mono text-gray-600">123456</span>
               </div>
             </div>
          </div>
        </div>
        <div className="bg-gray-50/90 px-8 py-4 text-center text-sm text-gray-600 border-t border-gray-100">
          {t('login.noAccount')}{' '}
          <button onClick={() => navigate('/signup')} className="font-medium text-blue-600 hover:text-blue-500">
            {t('login.createAccount')}
          </button>
        </div>
      </div>
    </div>
  );
};
