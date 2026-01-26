import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { StaggerContainer } from '../components/Reveal';
import { familyMembersAPI } from '../utils/api';
import type { FamilyMember, FamilyMemberWithRelations } from '../types';
import { format } from 'date-fns';
import { Users, GitBranch, User, Loader2, FileText, UsersRound, Heart, Baby, Calendar as CalendarIcon, MapPin, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const FamilyView: React.FC = () => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMemberWithRelations | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState<number | null>(null);
  const [generations, setGenerations] = useState<number[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await familyMembersAPI.getAll();
        setMembers(data);
        
        const uniqueGenerations = [...new Set(data.map(m => m.generation))].sort((a, b) => a - b);
        setGenerations(uniqueGenerations);
        if (uniqueGenerations.length > 0 && selectedGeneration === null) {
          setSelectedGeneration(uniqueGenerations[0]);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load family members');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  useEffect(() => {
    if (generations.length > 0 && selectedGeneration === null) {
      setSelectedGeneration(generations[0]);
    }
  }, [generations, selectedGeneration]);

  const handleMemberClick = async (memberId: number) => {
    try {
      const member = await familyMembersAPI.getById(memberId);
      setSelectedMember(member);
      setIsModalOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load member details');
    }
  };

  const filteredMembers = (selectedGeneration !== null
    ? members.filter(m => m.generation === selectedGeneration)
    : members).sort((a, b) => {
    const dateA = new Date(a.birthDate).getTime();
    const dateB = new Date(b.birthDate).getTime();
    // Descending Age = Oldest first (Smallest timestamp)
    return sortOrder === 'desc' ? dateA - dateB : dateB - dateA;
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Loader2 className="w-12 h-12 text-accent-blue animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading family members...</p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
        >
          <p className="text-red-700 dark:text-red-400 text-center">{error}</p>
        </motion.div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <div>
          <h1 className="mb-2">Family Tree</h1>
          <p className="text-gray-600 dark:text-gray-400">Explore your family across generations</p>
        </div>

        {generations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <div className="flex items-center space-x-2 mb-4">
                <GitBranch className="w-5 h-5 text-accent-orange" />
                <label className="block text-sm font-medium text-black dark:text-white">Filter by Generation</label>
              </div>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedGeneration(null)}
                      className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                        selectedGeneration === null
                          ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/25'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500'
                      }`}
                    >
                      All Generations
                    </motion.button>
                    {generations.map((gen, index) => (
                      <motion.button
                        key={gen}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + index * 0.05 }}
                        onClick={() => setSelectedGeneration(gen)}
                        className={`px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                          selectedGeneration === gen
                            ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/25'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500'
                        }`}
                      >
                        Gen {gen}
                      </motion.button>
                    ))}
                  </div>

                  {/* Sort Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <CalendarIcon className="w-4 h-4" />
                    <span>{sortOrder === 'desc' ? 'Oldest First' : 'Youngest First'}</span>
                  </motion.button>
                </div>
              </Card>
          </motion.div>
        )}

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
              }
            }
          }}
        >
          {filteredMembers.map((member) => (
            <motion.div
              key={member._id}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } }
              }}
              whileHover={{ y: -5 }}
              className="h-full"
            >
              <Card 
                onClick={() => handleMemberClick(member.id)} 
                className="group h-full border-0 !bg-white dark:!bg-gray-800 shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-300 overflow-hidden cursor-pointer"
                noPadding
              >
                {/* Banner Gradient */}
                <div className="h-24 bg-gradient-to-r from-slate-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 relative">
                    <div className="absolute inset-0 bg-grid-black/[0.03] dark:bg-grid-white/[0.03]" />
                    <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 bg-white/50 dark:bg-white/10 backdrop-blur-md rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 border border-white/20">
                            Gen {member.generation}
                        </span>
                    </div>
                </div>

                <div className="px-6 pb-6 relative">
                    {/* Avatar */}
                    <div className="relative -mt-12 mb-4 inline-block">
                        <div className="h-24 w-24 rounded-2xl bg-white dark:bg-gray-800 p-1 shadow-lg ring-1 ring-black/5 dark:ring-white/10 mx-auto transform group-hover:scale-105 transition-transform duration-300">
                           {member.avatar ? (
                                <img
                                    src={member.avatar}
                                    alt={member.name}
                                    className="h-full w-full object-cover rounded-xl"
                                />
                            ) : (
                                <div className="h-full w-full rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                                    <span className="text-2xl font-black text-indigo-300 dark:text-gray-400">
                                        {member.name.charAt(0)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="text-center space-y-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {member.name}
                        </h3>
                        {/* Nickname Removed */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium line-clamp-1 h-4">
                            {member.occupation || "Family Member"}
                        </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                            <CalendarIcon className="w-3.5 h-3.5 opacity-70" />
                            <span>{new Date(member.birthDate).getFullYear()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                             <MapPin className="w-3.5 h-3.5 opacity-70" />
                             <span className="truncate max-w-[80px]">{member.location || "Unknown"}</span>
                        </div>
                    </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {filteredMembers.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
               <Users className="w-10 h-10 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No family members found</h3>
            <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or adding new members.</p>
          </motion.div>
        )}

        <AnimatePresence>
          {isModalOpen && selectedMember && (
            <Modal
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false);
                setSelectedMember(null);
              }}
              title={selectedMember.name}
              size="lg"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {selectedMember.avatar && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex justify-center"
                  >
                    <img
                      src={selectedMember.avatar}
                      alt={selectedMember.name}
                      className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700 shadow-soft"
                    />
                  </motion.div>
                )}
                
                {selectedMember.bio && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="border-t border-gray-200 dark:border-gray-700 pt-6"
                  >
                    <div className="flex items-center space-x-2 mb-3">
                      <FileText className="w-5 h-5 text-accent-blue" />
                      <h3 className="text-lg font-semibold text-black dark:text-white">Bio</h3>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedMember.bio}</p>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="border-t border-gray-200 dark:border-gray-700 pt-6"
                >
                  <div className="flex items-center space-x-2 mb-4">
                    <CalendarIcon className="w-5 h-5 text-accent-blue" />
                    <h3 className="text-lg font-semibold text-black dark:text-white">Details</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Birth Date</p>
                      <p className="text-base font-medium text-black dark:text-white">{format(new Date(selectedMember.birthDate), 'MMM dd, yyyy')}</p>
                    </div>
                    {selectedMember.deathDate && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Death Date</p>
                        <p className="text-base font-medium text-black dark:text-white">{format(new Date(selectedMember.deathDate), 'MMM dd, yyyy')}</p>
                      </div>
                    )}
                    {selectedMember.occupation && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Occupation</p>
                        <p className="text-base font-medium text-black dark:text-white">{selectedMember.occupation}</p>
                      </div>
                    )}
                    {selectedMember.location && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Location</p>
                        <p className="text-base font-medium text-black dark:text-white">{selectedMember.location}</p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {selectedMember.parents.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="border-t border-gray-200 dark:border-gray-700 pt-6"
                  >
                    <div className="flex items-center space-x-2 mb-3">
                      <UsersRound className="w-5 h-5 text-accent-blue" />
                      <h3 className="text-lg font-semibold text-black dark:text-white">Parents</h3>
                    </div>
                    <div className="space-y-2">
                      {selectedMember.parents.map((parent) => (
                        <div key={parent._id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          <p className="text-base font-medium text-black dark:text-white">{parent.name}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {selectedMember.spouse && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="border-t border-gray-200 dark:border-gray-700 pt-6"
                  >
                    <div className="flex items-center space-x-2 mb-3">
                      <Heart className="w-5 h-5 text-accent-blue" />
                      <h3 className="text-lg font-semibold text-black dark:text-white">Spouse</h3>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <p className="text-base font-medium text-black dark:text-white">{selectedMember.spouse.name}</p>
                    </div>
                  </motion.div>
                )}

                {selectedMember.children.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="border-t border-gray-200 dark:border-gray-700 pt-6"
                  >
                    <div className="flex items-center space-x-2 mb-3">
                      <Baby className="w-5 h-5 text-accent-blue" />
                      <h3 className="text-lg font-semibold text-black dark:text-white">Children</h3>
                    </div>
                    <div className="space-y-2">
                      {selectedMember.children.map((child) => (
                        <div key={child._id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          <p className="text-base font-medium text-black dark:text-white">{child.name}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </Modal>
          )}
        </AnimatePresence>
      </motion.div>
    </Layout>
  );
};
