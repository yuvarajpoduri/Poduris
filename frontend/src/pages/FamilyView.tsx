import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
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

  const filteredMembers = selectedGeneration !== null
    ? members.filter(m => m.generation === selectedGeneration)
    : members;

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
              <div className="flex flex-wrap gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedGeneration(null)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedGeneration === null
                      ? 'bg-accent-blue text-white shadow-soft'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  All
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
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      selectedGeneration === gen
                        ? 'bg-accent-blue text-white shadow-soft'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Generation {gen}
                  </motion.button>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredMembers.map((member, index) => (
            <motion.div
              key={member._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              whileHover={{ y: -4 }}
            >
              <Card 
                onClick={() => handleMemberClick(member.id)} 
                hover
                className="group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-accent-blue/5 dark:bg-accent-blue/10 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-300"></div>
                <div className="text-center relative">
                  <motion.div 
                    className="flex justify-center mb-4"
                    whileHover={{ scale: 1.05 }}
                  >
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700 shadow-soft group-hover:shadow-medium transition-all duration-300"
                      />
                    ) : (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-accent-blue/10 dark:bg-accent-blue/20 border-4 border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-soft group-hover:shadow-medium transition-all duration-300">
                        <User className="w-12 h-12 sm:w-14 sm:h-14 text-accent-blue" />
                      </div>
                    )}
                  </motion.div>
                  <h3 className="text-lg sm:text-xl font-bold text-black dark:text-white mb-2">{member.name}</h3>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center justify-center space-x-1">
                      <CalendarIcon className="w-4 h-4" />
                      <p>Born: {format(new Date(member.birthDate), 'MMM dd, yyyy')}</p>
                    </div>
                    {member.deathDate && (
                      <p className="text-gray-500 dark:text-gray-500">Died: {format(new Date(member.deathDate), 'MMM dd, yyyy')}</p>
                    )}
                    {member.occupation && (
                      <div className="flex items-center justify-center space-x-1 mt-2">
                        <Briefcase className="w-4 h-4" />
                        <p className="text-gray-700 dark:text-gray-300 font-medium">{member.occupation}</p>
                      </div>
                    )}
                    {member.location && (
                      <div className="flex items-center justify-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <p className="text-gray-500 dark:text-gray-500">{member.location}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="badge badge-gray">Gen {member.generation}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card text-center py-12"
          >
            <Users className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">No family members found</p>
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
