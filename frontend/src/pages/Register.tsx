import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { LanguageToggle } from '../components/LanguageToggle';
import { familyMembersAPI } from '../utils/api';
import type { FamilyMember } from '../types';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableMembers, setAvailableMembers] = useState<FamilyMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<FamilyMember[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAvailableMembers = async () => {
      setLoadingMembers(true);
      try {
        const members = await familyMembersAPI.getAvailable();
        setAvailableMembers(members);
        setFilteredMembers(members.slice(0, 10));
      } catch (err: any) {
        setError('Failed to load family members. Please try again.');
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchAvailableMembers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.family-member-dropdown')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setFilteredMembers(availableMembers.slice(0, 10));
      return;
    }
    const filtered = availableMembers
      .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 10);
    setFilteredMembers(filtered);
  }, [searchQuery, availableMembers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!selectedMember) {
      setError('Please select a family member');
      return;
    }
    
    setLoading(true);

    try {
      await register(email, password, selectedMember.id);
      setSuccess(t('auth.registerSuccess') || 'Registration successful. Please wait for admin approval.');
      // Clear form
      setEmail('');
      setPassword('');
      setSelectedMember(null);
      setSearchQuery('');
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 px-4 py-8">
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-black dark:text-white mb-2">Poduris</h1>
          <p className="text-gray-600 dark:text-gray-400">Join your family</p>
        </div>
        
        <div className="card">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-black dark:text-white mb-6">{t('auth.register')}</h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl">
                {success}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-black dark:text-white mb-2">
                  {t('auth.email')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-black dark:text-white mb-2">
                  {t('auth.password')}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="At least 6 characters"
                />
              </div>
              <div>
                <label htmlFor="familyMember" className="block text-sm font-medium text-black dark:text-white mb-2">
                  Select Your Family Member
                </label>
                <div className="relative family-member-dropdown">
                  {selectedMember ? (
                    <div className="input flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {selectedMember.avatar ? (
                          <img
                            src={selectedMember.avatar}
                            alt={selectedMember.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center text-sm font-semibold text-accent-blue">
                            {selectedMember.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-black dark:text-white">{selectedMember.name}</p>
                          <p className="text-xs text-gray-500">Generation {selectedMember.generation} • ID: {selectedMember.id}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMember(null);
                          setSearchQuery('');
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          id="familyMember"
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setIsDropdownOpen(true);
                          }}
                          onFocus={() => setIsDropdownOpen(true)}
                          placeholder="Search for your family member..."
                          className="input pl-10"
                          required
                        />
                      </div>
                      <AnimatePresence>
                        {isDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                          >
                            {loadingMembers ? (
                              <div className="p-4 text-center text-gray-500">Loading...</div>
                            ) : filteredMembers.length > 0 ? (
                              <div className="py-2">
                                {filteredMembers.map((member) => (
                                  <button
                                    key={member._id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedMember(member);
                                      setSearchQuery(member.name);
                                      setIsDropdownOpen(false);
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
                                  >
                                    {member.avatar ? (
                                      <img
                                        src={member.avatar}
                                        alt={member.name}
                                        className="w-10 h-10 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-accent-blue/20 flex items-center justify-center text-sm font-semibold text-accent-blue">
                                        {member.name.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="flex-1">
                                      <p className="font-medium text-black dark:text-white">{member.name}</p>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Generation {member.generation} • ID: {member.id}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            ) : searchQuery.length >= 2 ? (
                              <div className="p-4 text-center text-gray-500">No available members found</div>
                            ) : (
                              <div className="p-4 text-center text-gray-500">Start typing to search...</div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
                {availableMembers.length === 0 && !loadingMembers && (
                  <p className="mt-2 text-sm text-gray-500">No available family members. Please contact an admin.</p>
                )}
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? t('common.loading') : t('auth.register')}
              </button>
            </div>
            <div className="text-center">
              <Link to="/login" className="text-sm text-accent-blue hover:underline font-medium">
                {t('auth.login')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
