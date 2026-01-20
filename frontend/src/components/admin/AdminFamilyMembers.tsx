import React, { useEffect, useState } from 'react';
import { Card } from '../Card';
import { Modal } from '../Modal';
import { MemberSearch } from '../MemberSearch';
import { familyMembersAPI } from '../../utils/api';
import type { FamilyMember } from '../../types';
import { Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const AdminFamilyMembers: React.FC = () => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<Partial<FamilyMember>>({
    id: 0,
    name: '',
    birthDate: '',
    deathDate: null,
    gender: 'male',
    parentId: null,
    spouseId: null,
    generation: 0,
    avatar: '',
    occupation: '',
    location: '',
    bio: '',
    email: '',
    anniversaryDate: null
  });
  const { showToast } = useToast();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async (search?: string) => {
    try {
      const data = await familyMembersAPI.getAll(search);
      setMembers(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load family members');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchMembers(searchQuery);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingMember) {
        await familyMembersAPI.update(editingMember._id, formData);
        showToast('Family member updated successfully', 'success');
      } else {
        await familyMembersAPI.create(formData);
        showToast('Family member created successfully', 'success');
      }
      setIsModalOpen(false);
      setEditingMember(null);
      setFormData({
        id: 0,
        name: '',
        birthDate: '',
        deathDate: null,
        gender: 'male',
        parentId: null,
        spouseId: null,
        generation: 0,
        avatar: '',
        occupation: '',
        location: '',
        bio: '',
        email: '',
        anniversaryDate: null
      });
      fetchMembers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save family member');
      showToast('Failed to save family member', 'error');
    }
  };

  const handleEdit = (member: FamilyMember) => {
    setEditingMember(member);
    setFormData({
      id: member.id,
      name: member.name,
      birthDate: member.birthDate,
      deathDate: member.deathDate,
      gender: member.gender,
      parentId: member.parentId,
      spouseId: member.spouseId,
      generation: member.generation,
      avatar: member.avatar,
      occupation: member.occupation,
      location: member.location,
      bio: member.bio,
      email: (member as any).email || '',
      anniversaryDate: (member as any).anniversaryDate || null
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string | number) => {
    if (!window.confirm('Are you sure you want to delete this family member?')) {
      return;
    }

    try {
      await familyMembersAPI.delete(id);
      showToast('Family member deleted successfully', 'success');
      fetchMembers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete family member');
      showToast('Failed to delete family member', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-accent-blue animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-black dark:text-white">Family Members</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Manage your family tree</p>
        </div>
        <button
          onClick={() => {
            setEditingMember(null);
            setFormData({
              id: 0,
              name: '',
              birthDate: '',
              deathDate: null,
              gender: 'male',
              parentId: null,
              spouseId: null,
              generation: 0,
              avatar: '',
              occupation: '',
              location: '',
              bio: '',
              email: '',
              anniversaryDate: null
            });
            setIsModalOpen(true);
          }}
          className="btn-primary"
        >
          + Add Member
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="input flex-1"
        />
        <button type="submit" className="btn-primary">
          Search
        </button>
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setLoading(true);
              fetchMembers();
            }}
            className="btn-secondary"
          >
            Clear
          </button>
        )}
      </form>

      {error && (
        <div className="card bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <Card key={member._id}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-black dark:text-white mb-2 truncate">{member.name}</h3>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">ID: {member.id}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Generation: {member.generation}</p>
                </div>
              </div>
              <div className="flex flex-col space-y-2 flex-shrink-0">
                <button
                  onClick={() => handleEdit(member)}
                  className="text-sm font-medium text-accent-blue hover:underline tap-target"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(member._id)}
                  className="text-sm font-medium text-accent-orange hover:underline tap-target"
                >
                  Delete
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMember(null);
        }}
        title={editingMember ? 'Edit Family Member' : 'Add Family Member'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">Family ID</label>
              <input
                type="number"
                required
                value={formData.id || ''}
                onChange={(e) => setFormData({ ...formData, id: parseInt(e.target.value) })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">Generation</label>
              <input
                type="number"
                required
                value={formData.generation || ''}
                onChange={(e) => setFormData({ ...formData, generation: parseInt(e.target.value) })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1">Name</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1">Email</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">Birth Date (YYYY-MM-DD)</label>
              <input
                type="date"
                required
                value={formData.birthDate || ''}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">Death Date (YYYY-MM-DD)</label>
              <input
                type="date"
                value={formData.deathDate || ''}
                onChange={(e) => setFormData({ ...formData, deathDate: e.target.value || null })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1">Anniversary Date (YYYY-MM-DD)</label>
            <input
              type="date"
              value={formData.anniversaryDate || ''}
              onChange={(e) => setFormData({ ...formData, anniversaryDate: e.target.value || null })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1">Gender</label>
            <select
              value={formData.gender || 'male'}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'other' })}
              className="w-full px-3 py-2 border border-black dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-md"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">Parent</label>
              {formData.parentId ? (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <span className="text-sm text-black dark:text-white">
                    {members.find(m => m.id === formData.parentId)?.name || `ID: ${formData.parentId}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, parentId: null })}
                    className="text-accent-orange hover:underline text-sm"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <MemberSearch
                  onSelect={(member) => setFormData({ ...formData, parentId: member.id })}
                  excludeIds={formData.id ? [formData.id] : []}
                  placeholder="Search for parent..."
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">Spouse</label>
              {formData.spouseId ? (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <span className="text-sm text-black dark:text-white">
                    {members.find(m => m.id === formData.spouseId)?.name || `ID: ${formData.spouseId}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, spouseId: null })}
                    className="text-accent-orange hover:underline text-sm"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <MemberSearch
                  onSelect={(member) => setFormData({ ...formData, spouseId: member.id })}
                  excludeIds={formData.id ? [formData.id] : []}
                  placeholder="Search for spouse..."
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1">Avatar URL</label>
            <input
              type="url"
              value={formData.avatar || ''}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1">Occupation</label>
            <input
              type="text"
              value={formData.occupation || ''}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1">Location</label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1">Bio</label>
            <textarea
              value={formData.bio || ''}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="input"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingMember(null);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              {editingMember ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
