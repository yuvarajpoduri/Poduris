import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Play, 
  Pause, 
  ChevronRight, 
  ChevronLeft, 
  Globe, 
  Calendar,
  MapPin,
  Briefcase,
  Layers,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { familyMembersAPI } from '../utils/api';
import type { FamilyMember } from '../types';
import { formatPoduriName } from '../utils/formatUtils';

interface FamilyStoryProps {
  isOpen: boolean;
  onClose: () => void;
}

type Slide = {
  type: 'member';
  id: string;
  member: FamilyMember;
} | {
  type: 'intro';
  id: string;
  generation: number;
  firstBornMember: FamilyMember;
  nextGenFirstBornYear?: number;
};

export const FamilyStory: React.FC<FamilyStoryProps> = ({ isOpen, onClose }) => {
  const { language, toggleLanguage, t } = useLanguage();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState<number | 'all'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [loading, setLoading] = useState(true);

  // Optimized fetching with cache
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const data = await familyMembersAPI.getAll();
        // Invalidate browser cache by not using sessionStorage for stories
        // to ensure admin updates are reflected immediately.

        // Sort by generation, then birthDate
        const sorted = data.sort((a, b) => {
          if (a.generation !== b.generation) {
            return a.generation - b.generation;
          }
          return new Date(a.birthDate).getTime() - new Date(b.birthDate).getTime();
        });
        setMembers(sorted);
      } catch (err) {
        console.error("Failed to load family members for story", err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchMembers();
      setCurrentIndex(0);
      setIsPlaying(true);
    }
  }, [isOpen]);

  // Construct slides based on selection
  const slides = useMemo(() => {
    if (members.length === 0) return [];

    let filteredMembers = members;
    if (selectedGeneration !== 'all') {
      filteredMembers = members.filter(m => m.generation === selectedGeneration);
    }

    const result: Slide[] = [];
    let currentGen = -1;

    filteredMembers.forEach((member) => {
      // Add intro slide when generation changes
      if (member.generation !== currentGen) {
        currentGen = member.generation;
        
        // Find first born of next generation (if any) to show in intro
        const nextGen = members.find(m => m.generation === currentGen + 1);
        const nextGenFirstYear = nextGen ? new Date(nextGen.birthDate).getFullYear() : undefined;

        result.push({
          type: 'intro',
          id: `intro-${currentGen}`,
          generation: currentGen,
          firstBornMember: member,
          nextGenFirstBornYear: nextGenFirstYear
        });
      }

      result.push({
        type: 'member',
        id: member._id,
        member
      });
    });

    return result;
  }, [members, selectedGeneration]);

  // Unique generations for the filter
  const availableGenerations = useMemo(() => {
    const gens = Array.from(new Set(members.map(m => m.generation))).sort((a, b) => a - b);
    return gens;
  }, [members]);

  useEffect(() => {
    let timer: any;
    if (isPlaying && isOpen && slides.length > 0) {
      timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      }, 7000); // 7 seconds per slide for better reading
    }
    return () => clearInterval(timer);
  }, [isPlaying, isOpen, slides.length]);

  const currentSlide = slides[currentIndex];

  useEffect(() => {
    // Reset index when slides change (filtering)
    setCurrentIndex(0);
  }, [selectedGeneration]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed top-[-5%] left-0 right-0 bottom-0 h-[105vh] z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center text-white overflow-hidden font-sans"
      >
        {/* Top Controls */}
        <div className="absolute top-[1%] left-0 right-0 p-4 sm:p-6 flex items-center justify-between z-10 bg-gradient-to-b from-black/90 via-black/40 to-transparent pt-12">
          <div className="flex items-center gap-4">
             <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-lg font-bold tracking-tight">{t('family.storyTitle')}</h2>
              <p className="text-xs text-white/50">
                {currentSlide?.type === 'member' 
                  ? `${t('family.generation')} ${currentSlide.member.generation}` 
                  : `${t('family.generation')} ${currentSlide?.generation} Intro`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-6">
            {/* Attractive Generation Filter - Scrollable Pills */}
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/10 group">
               <Layers className="w-4 h-4 text-accent-blue flex-shrink-0" />
               <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-[120px] sm:max-w-[300px] lg:max-w-none pb-0.5">
                 <button
                   onClick={() => setSelectedGeneration('all')}
                   className={`shrink-0 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedGeneration === 'all' ? 'bg-accent-blue text-white shadow-lg shadow-accent-blue/20' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                 >
                   All
                 </button>
                 {availableGenerations.map(gen => (
                    <button
                      key={gen}
                      onClick={() => setSelectedGeneration(gen)}
                      className={`shrink-0 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedGeneration === gen ? 'bg-accent-blue text-white shadow-lg shadow-accent-blue/20' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                    >
                      Gen {gen}
                    </button>
                 ))}
               </div>
            </div>

            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-all border border-white/10 flex-shrink-0"
            >
              <Globe className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-wider">{language}</span>
            </button>
            
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-all border border-white/10 flex-shrink-0"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white text-white border-none" /> : <Play className="w-4 h-4 fill-white text-white border-none" />}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="w-full max-w-5xl px-6 flex flex-col items-center justify-center h-full pt-[8%] pb-[20vh] sm:pb-[15vh]">
          {loading ? (
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-white/10 border-t-white rounded-full animate-spin mx-auto mb-6" />
              <p className="text-white/60 font-medium animate-pulse">{t('family.gatheringLineage')}</p>
            </div>
          ) : slides.length === 0 ? (
            <p className="text-white/40 italic">{t('family.noStories')}</p>
          ) : (
            <AnimatePresence mode="wait">
              {currentSlide.type === 'member' ? (
                <motion.div
                  key={currentSlide.id}
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.05, y: -30 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full flex flex-col md:flex-row items-center gap-10 md:gap-16"
                >
                  {/* Avatar Section - Removed Gen Icon next to avatar */}
                  <div className="relative shrink-0">
                    <div className="absolute -inset-6 bg-gradient-to-tr from-accent-blue/30 via-purple-500/20 to-accent-orange/30 rounded-full blur-3xl opacity-40 animate-pulse" />
                    <div className="w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 rounded-full p-2 bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 transition-transform duration-700 hover:scale-105">
                      {currentSlide.member.avatar ? (
                        <img 
                          src={currentSlide.member.avatar} 
                          className="w-full h-full rounded-full object-cover"
                          alt={currentSlide.member.name}
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center text-7xl font-black text-white/20">
                          {currentSlide.member.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="flex-1 text-center md:text-left space-y-8">
                    <div className="space-y-3">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-accent-blue"
                      >
                        <Sparkles className="w-3 h-3" />
                        Generation {currentSlide.member.generation}
                      </motion.div>
                      <motion.h3 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/60"
                      >
                        {formatPoduriName(currentSlide.member.name)}
                      </motion.h3>
                      {currentSlide.member.nickname && (
                        <motion.p 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                          className="text-accent-blue text-xl sm:text-2xl font-bold tracking-tight italic"
                        >
                           "{currentSlide.member.nickname}"
                        </motion.p>
                      )}
                    </div>

                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="relative"
                    >
                      <div className="absolute -left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-blue to-transparent opacity-30 hidden md:block" />
                      <div className="max-h-[30vh] md:max-h-[40vh] overflow-y-auto no-scrollbar pr-4">
                        <p className="text-white/80 text-lg md:text-2xl leading-relaxed max-w-2xl font-medium">
                          {(language === 'te' ? currentSlide.member.storyTe : currentSlide.member.storyEn) 
                            || currentSlide.member.bio 
                            || t('family.defaultBio')}
                        </p>
                      </div>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="flex flex-wrap gap-4 justify-center md:justify-start"
                    >
                      <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                        <Calendar className="w-5 h-5 text-accent-orange" />
                        <span className="text-base font-bold">{new Date(currentSlide.member.birthDate).getFullYear()}</span>
                      </div>
                      {currentSlide.member.location && (
                        <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                          <MapPin className="w-5 h-5 text-accent-blue" />
                          <span className="text-base font-bold">{currentSlide.member.location}</span>
                        </div>
                      )}
                      {currentSlide.member.occupation && (
                        <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                          <Briefcase className="w-5 h-5 text-emerald-400" />
                          <span className="text-base font-bold">{currentSlide.member.occupation}</span>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              ) : (
                /* Generation Intro Slide */
                <motion.div
                  key={currentSlide.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  className="text-center space-y-12"
                >
                  <div className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-accent-blue text-sm font-black uppercase tracking-[0.5em]"
                    >
                      {language === 'te' ? 'వంశం ప్రవేశం' : 'Entering Generation'}
                    </motion.div>
                    <motion.h1
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-8xl sm:text-9xl md:text-[12rem] font-black leading-none tracking-tighter"
                    >
                      {currentSlide.generation}
                    </motion.h1>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-2xl mx-auto w-full">
                    <motion.div
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="p-4 md:p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md"
                    >
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1 md:mb-2">
                        {language === 'te' ? 'మొదటి జననం' : 'First Born Year'}
                      </p>
                      <p className="text-2xl md:text-4xl font-black text-accent-orange">
                        {new Date(currentSlide.firstBornMember.birthDate).getFullYear()}
                      </p>
                      <p className="text-xs md:text-sm text-white/60 mt-1 md:mt-2 font-medium truncate">
                        {formatPoduriName(currentSlide.firstBornMember.name)}
                      </p>
                    </motion.div>

                    {currentSlide.nextGenFirstBornYear && (
                      <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-4 md:p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md"
                      >
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1 md:mb-2">
                          {language === 'te' ? 'తదుపరి వంశం జననం' : 'Next Gen Start'}
                        </p>
                        <p className="text-2xl md:text-4xl font-black text-accent-blue">
                          {currentSlide.nextGenFirstBornYear}
                        </p>
                        <p className="text-xs md:text-sm text-white/60 mt-1 md:mt-2 font-medium">
                          {language === 'te' ? 'తదుపరి వంశం ప్రారంభం' : 'Transition to next generation'}
                        </p>
                      </motion.div>
                    )}
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-white/40 text-sm font-medium animate-bounce"
                  >
                    {language === 'te' ? 'ప్రయాణం కొనసాగుతోంది...' : 'The journey continues...'}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center gap-8 z-10 bg-gradient-to-t from-black/90 to-transparent">
          {/* Enhanced Progress Bar */}
          <div className="w-full max-w-2xl h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-accent-blue via-purple-500 to-accent-orange"
              initial={{ width: "0%" }}
              animate={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="flex items-center gap-10">
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)}
              className="p-5 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 group active:scale-90"
            >
              <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
            </button>
            
            <div className="flex flex-col items-center">
              <div className="text-2xl font-black tracking-widest text-white">
                {String(currentIndex + 1).padStart(2, '0')}
              </div>
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">
                of {String(slides.length).padStart(2, '0')}
              </div>
            </div>

            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % slides.length)}
              className="p-5 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 group active:scale-90"
            >
              <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Animated Background */}
        <div className="absolute inset-0 -z-10 bg-black">
           <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent-blue/10 rounded-full blur-[120px] animate-pulse" />
           <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-20 pointer-events-none" 
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
