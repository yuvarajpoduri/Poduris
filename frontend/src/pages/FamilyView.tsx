import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { familyMembersAPI } from '../utils/api';
import type { FamilyMember, FamilyMemberWithRelations } from '../types';
import { format } from 'date-fns';
import { Users, Loader2, FileText, UsersRound, Heart, Baby, Calendar as CalendarIcon, MapPin, Play, Search, Filter, BookOpen, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPoduriName } from '../utils/formatUtils';
import { FamilyStory } from '../components/FamilyStory';

export const FamilyView: React.FC = () => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMemberWithRelations | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState<number | null>(null);
  const [generations, setGenerations] = useState<number[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleMemberClick = async (memberId: number) => {
    try {
      const member = await familyMembersAPI.getById(memberId);
      setSelectedMember(member);
      setIsModalOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load member details');
    }
  };

  const filteredMembers = members
    .filter(m => {
      const matchesGen = selectedGeneration === null || m.generation === selectedGeneration;
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            m.nickname?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesGen && matchesSearch;
    })
    .sort((a, b) => {
      const dateA = new Date(a.birthDate).getTime();
      const dateB = new Date(b.birthDate).getTime();
      return sortOrder === 'desc' ? dateA - dateB : dateB - dateA;
    });

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading family...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-red-500 font-bold">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pb-20 max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8 mt-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">
              The Lineage
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Explore your roots and relationships.
            </p>
          </div>

          <button
            onClick={() => setIsStoryOpen(true)}
            className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" />
            Watch Story
          </button>
        </div>

        {/* Controls - Normal Flow (Not Sticky) */}
        <div className="mb-8 space-y-3 relative">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex gap-2 overflow-x-auto no-scrollbar">
             <button
                onClick={() => setSelectedGeneration(null)}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${
                  selectedGeneration === null 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                }`}
             >
               All
             </button>
             {generations.map(gen => (
               <button
                  key={gen}
                  onClick={() => setSelectedGeneration(gen)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${
                    selectedGeneration === gen 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}
               >
                 Gen {gen}
               </button>
             ))}
          </div>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input 
                 type="text" 
                 placeholder="Search members..." 
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 className="w-full bg-white dark:bg-gray-900 border-none rounded-xl py-3 pl-10 pr-4 font-bold text-sm shadow-sm ring-1 ring-gray-100 dark:ring-white/5 focus:ring-indigo-500 transition-all"
               />
            </div>
             <button
               onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
               className="px-4 bg-white dark:bg-gray-900 rounded-xl font-bold text-sm shadow-sm ring-1 ring-gray-100 dark:ring-white/5 flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300"
             >
               <Filter className="w-4 h-4" />
               {sortOrder === 'desc' ? 'Desc' : 'Asc'}
             </button>
          </div>
        </div>

        {/* Compact Grid */}
        <motion.div 
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredMembers.map((member) => (
              <motion.div
                key={member._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                onClick={() => handleMemberClick(member.id)}
                className="group cursor-pointer flex flex-col gap-2"
              >
                 <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-white/5">
                    {member.avatar ? (
                      <img 
                        src={member.avatar} 
                        className="w-full h-full object-cover transition-transform duration-500 group-active:scale-105"
                        alt={member.name}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                         <span className="text-4xl font-black text-gray-300 dark:text-gray-600">
                           {member.name.charAt(0)}
                         </span>
                      </div>
                    )}
                    
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-md text-[10px] font-black text-white/90 border border-white/10">
                       G{member.generation}
                    </div>
                 </div>

                 <div className="px-1">
                    <h3 className="font-bold text-gray-900 dark:text-white leading-tight text-sm sm:text-base truncate">
                      {formatPoduriName(member.name)}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 mt-0.5">
                       <span>{new Date(member.birthDate).getFullYear()}</span>
                       {member.location && (
                         <>
                           <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                           <span className="truncate">{member.location}</span>
                         </>
                       )}
                    </div>
                 </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-20 text-gray-400">
             No members found.
          </div>
        )}

        {/* Member Detail Modal */}
        <AnimatePresence>
          {isModalOpen && selectedMember && (
            <Modal
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false);
                setSelectedMember(null);
              }}
              title=""
              size="lg"
            >
              <div className="pb-4">
                {/* Header Profile with Cover Effect */}
                <div className="relative mb-6">
                    <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-2xl opacity-10"></div>
                    <div className="px-4 flex items-end gap-5 -mt-12">
                         <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white dark:bg-gray-900 p-1 shadow-xl shrink-0">
                            {selectedMember.avatar ? (
                                <img src={selectedMember.avatar} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl font-black text-gray-300 rounded-xl bg-gray-50 dark:bg-gray-800">
                                {selectedMember.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 pb-1">
                             <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-md text-[10px] font-black uppercase tracking-wider">
                                    Gen {selectedMember.generation}
                                </span>
                                {selectedMember.gender && (
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                        selectedMember.gender === 'male' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 
                                        selectedMember.gender === 'female' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' : 
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                        {selectedMember.gender}
                                    </span>
                                )}
                             </div>
                             <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white leading-tight">
                                {formatPoduriName(selectedMember.name)}
                             </h2>
                             {selectedMember.nickname && (
                                <p className="text-gray-500 font-medium italic">"{selectedMember.nickname}"</p>
                             )}
                        </div>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-8 px-2">
                    {/* Key Details Grid */}
                    <div className="grid grid-cols-2 gap-3">
                         <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Birth Date</p>
                            <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4 text-indigo-500" />
                                {format(new Date(selectedMember.birthDate), 'MMM dd, yyyy')}
                            </p>
                         </div>
                         
                         {selectedMember.deathDate ? (
                             <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Passed Away</p>
                                <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Crown className="w-4 h-4 text-amber-500" />
                                    {format(new Date(selectedMember.deathDate), 'MMM dd, yyyy')}
                                </p>
                             </div>
                         ) : (
                            <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Age</p>
                                <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Crown className="w-4 h-4 text-emerald-500" />
                                    {new Date().getFullYear() - new Date(selectedMember.birthDate).getFullYear()} Years
                                </p>
                            </div>
                         )}

                         {selectedMember.anniversaryDate && (
                             <div className="p-3 bg-pink-50 dark:bg-pink-900/10 rounded-xl border border-pink-100 dark:border-pink-900/20">
                                <p className="text-[10px] font-bold text-pink-400 uppercase tracking-wider mb-1">Anniversary</p>
                                <p className="font-bold text-pink-700 dark:text-pink-300 flex items-center gap-2">
                                    <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                                    {format(new Date(selectedMember.anniversaryDate), 'MMM dd')}
                                </p>
                             </div>
                         )}

                         <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Location</p>
                            <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2 truncate">
                                <MapPin className="w-4 h-4 text-indigo-500" />
                                {selectedMember.location || "N/A"}
                            </p>
                         </div>
                    </div>

                    {/* Bio & Stories */}
                    {(selectedMember.bio || selectedMember.storyEn || selectedMember.storyTe) && (
                        <div className="space-y-4">
                            {selectedMember.bio && (
                                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                                    <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400">
                                        <FileText className="w-4 h-4" />
                                        <span className="text-xs font-black uppercase tracking-widest">Bio / Catchphrase</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed italic">
                                        "{selectedMember.bio}"
                                    </p>
                                </div>
                            )}

                            {selectedMember.storyEn && (
                                <div className="space-y-2">
                                     <div className="flex items-center gap-2 text-gray-500">
                                        <BookOpen className="w-4 h-4" />
                                        <span className="text-xs font-black uppercase tracking-widest">Family Story</span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                                        {selectedMember.storyEn}
                                    </p>
                                </div>
                            )}

                            {selectedMember.storyTe && (
                                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-white/5">
                                     <div className="flex items-center gap-2 text-gray-500">
                                        <BookOpen className="w-4 h-4" />
                                        <span className="text-xs font-black uppercase tracking-widest">కుటుంబ కథ (Telugu)</span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap font-telugu">
                                        {selectedMember.storyTe}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Family Tree Connections */}
                    <div>
                         <div className="flex items-center gap-2 mb-4">
                            <UsersRound className="w-5 h-5 text-indigo-500" />
                            <h3 className="font-bold text-gray-900 dark:text-white">Family Connections</h3>
                         </div>
                         
                         <div className="space-y-3">
                            {/* Parents */}
                            {selectedMember.parents.length > 0 && (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                    <div className="p-2 bg-white dark:bg-white/10 rounded-lg shadow-sm">
                                        <Users className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Parents</p>
                                        <div className="flex flex-wrap gap-2 mt-0.5">
                                            {selectedMember.parents.map(p => (
                                                <span key={p._id} className="font-bold text-sm text-gray-800 dark:text-gray-200">{p.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Spouse */}
                            {selectedMember.spouse && (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-pink-50/50 dark:bg-pink-900/10 border border-pink-100 dark:border-pink-900/20">
                                    <div className="p-2 bg-white dark:bg-white/10 rounded-lg shadow-sm">
                                        <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-pink-400 uppercase">Spouse</p>
                                        <p className="font-bold text-sm text-pink-700 dark:text-pink-300">{selectedMember.spouse.name}</p>
                                    </div>
                                </div>
                            )}

                            {/* Children */}
                            {selectedMember.children.length > 0 && (
                                 <div className="flex items-start gap-3 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20">
                                    <div className="p-2 bg-white dark:bg-white/10 rounded-lg shadow-sm">
                                        <Baby className="w-4 h-4 text-indigo-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Children</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedMember.children.map(c => (
                                                <span key={c._id} className="px-2.5 py-1 bg-white dark:bg-gray-800 rounded-md text-xs font-bold text-indigo-900 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-900/30">
                                                    {c.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                         </div>
                    </div>
                </div>
              </div>
            </Modal>
          )}
        </AnimatePresence>

        <FamilyStory 
          isOpen={isStoryOpen} 
          onClose={() => setIsStoryOpen(false)} 
        />
      </div>
    </Layout>
  );
};
