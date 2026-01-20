import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { familyMembersAPI } from '../utils/api';
import type { FamilyMember } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface MemberSearchProps {
  onSelect: (member: FamilyMember) => void;
  excludeIds?: number[];
  placeholder?: string;
  className?: string;
}

export const MemberSearch: React.FC<MemberSearchProps> = ({
  onSelect,
  excludeIds = [],
  placeholder = 'Search by name...',
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FamilyMember[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const allMembers = await familyMembersAPI.getAll();
        const filtered = allMembers
          .filter(m => 
            m.name.toLowerCase().includes(query.toLowerCase()) &&
            !excludeIds.includes(m.id)
          )
          .slice(0, 5);
        setResults(filtered);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchMembers, 300);
    return () => clearTimeout(debounce);
  }, [query, excludeIds]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (member: FamilyMember) => {
    onSelect(member);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="input pl-10 pr-10"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (query.length >= 2 || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-large max-h-60 overflow-y-auto"
          >
            {loading ? (
              <div className="p-4 text-center text-gray-500">Searching...</div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((member) => (
                  <button
                    key={member._id}
                    onClick={() => handleSelect(member)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-black dark:text-white">{member.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {member.id} • Gen {member.generation}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : query.length >= 2 ? (
              <div className="p-4 text-center text-gray-500">No members found</div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

