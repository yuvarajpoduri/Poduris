import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { LanguageToggle } from '../components/LanguageToggle';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      showToast('Login successful', 'success');
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.error') || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50 dark:bg-gray-900 overflow-hidden relative">
       {/* Background Elements */}
       <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
       <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />

       {/* Top controls */}
       <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
          <LanguageToggle />
          <ThemeToggle />
       </div>

       {/* Brand/Visuals Section */}
       <motion.div 
         initial={{ opacity: 0, y: -20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.8, ease: "easeOut" }}
         className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 shrink-0 pt-16 lg:pt-0"
       >
          <div className="relative z-10 text-center space-y-4 lg:space-y-6 max-w-lg">
             <motion.div
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ delay: 0.2, duration: 0.6 }}
               className="w-20 h-20 lg:w-32 lg:h-32 mx-auto bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl lg:rounded-3xl shadow-2xl shadow-indigo-500/30 flex items-center justify-center mb-4 lg:mb-8 rotate-3"
             >
                <span className="text-4xl lg:text-6xl font-black text-white">P</span>
             </motion.div>
             <h1 className="text-4xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
               Connecting <span className="text-indigo-600 dark:text-indigo-400">Generations</span>
             </h1>
             <p className="hidden lg:block text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
               Your family's history, moments, and future all in one beautiful, secure space.
             </p>
          </div>
       </motion.div>

       {/* Form Section */}
       <div className="w-full lg:w-1/2 flex flex-col items-center justify-start lg:justify-center p-4 lg:p-6 relative z-10 pb-12">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 sm:p-10 rounded-[32px] shadow-2xl border border-white/20 dark:border-gray-700/50"
          >
              <div className="text-center mb-8 lg:text-left">
                  <h2 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white mb-2">{t('auth.login') || "Welcome Back"}</h2>
                  <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400 font-medium">Please enter your details to sign in.</p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                  </motion.div>
                )}
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">{t('auth.email')}</label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-base input-ios-fix"
                      placeholder="name@family.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('auth.password')}</label>
                        <a href="#" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Forgot?</a>
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-base input-ios-fix"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4 text-base"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('common.loading')}
                    </span>
                  ) : t('auth.login')}
                </motion.button>
              </form>
          </motion.div>
       </div>
    </div>
  );
};
