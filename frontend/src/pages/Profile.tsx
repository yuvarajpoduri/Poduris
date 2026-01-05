import React, { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { usersAPI, uploadAPI, familyMembersAPI } from "../utils/api";
import type { FamilyMember } from "../types";

export const Profile: React.FC = () => {
  const { user, login } = useAuth();
  const { t } = useLanguage();
  const [familyMember, setFamilyMember] = useState<FamilyMember | null>(null);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [occupation, setOccupation] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.linkedFamilyMemberId) {
        setLoading(false);
        return;
      }
      
      try {
        const member = await familyMembersAPI.getById(user.linkedFamilyMemberId);
        setFamilyMember(member);
        setName(member.name || "");
        setAvatar(member.avatar || "");
        setBio(member.bio || "");
        setLocation(member.location || "");
        setOccupation(member.occupation || "");
        setBirthDate(member.birthDate || "");
        setGender(member.gender || "male");
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [user]);

  if (!user) {
    return null;
  }
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <div className="animate-pulse-soft text-4xl mb-4">⏳</div>
            <p className="text-gray-600">{t("common.loading")}</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!user.linkedFamilyMemberId) {
    return (
      <Layout>
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700">
            <p className="text-yellow-800 dark:text-yellow-300">
              Your account is not linked to a family member. Please contact an admin.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setMessage(null);
    try {
      const result = await uploadAPI.uploadImage(file);
      setAvatar(result.imageUrl);
    } catch (err: any) {
      setError(err.response?.data?.message || t("common.error"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const updatedMember = await usersAPI.updateMyProfile({
        name,
        avatar,
        bio,
        location,
        occupation,
        birthDate,
        gender,
      });
      setMessage(t("profile.saved") || "Profile saved successfully");
      // Update local state
      setFamilyMember(updatedMember);
      setName(updatedMember.name);
      setAvatar(updatedMember.avatar || "");
      setBio(updatedMember.bio || "");
      setLocation(updatedMember.location || "");
      setOccupation(updatedMember.occupation || "");
      setBirthDate(updatedMember.birthDate || "");
      setGender(updatedMember.gender || "male");
      // Refresh user data from server after a delay
      setTimeout(async () => {
        try {
          const { authAPI } = await import('../utils/api');
          const userData = await authAPI.getMe();
          localStorage.setItem('user', JSON.stringify(userData));
          window.location.reload();
        } catch (err) {
          console.error('Failed to refresh user data:', err);
        }
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || t("common.error") || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const isEditable = user.status === "approved";

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="mb-2">{t("profile.title")}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t("profile.subtitle")}
          </p>
        </div>

        {!isEditable && (
          <div className="card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700">
            <p className="text-yellow-800 dark:text-yellow-300 text-sm">
              {t("profile.onlyApproved")}
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="card space-y-4"
          aria-disabled={!isEditable}
        >
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded">
              {message}
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="relative">
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-accent-blue"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-accent-blue/20 flex items-center justify-center text-2xl font-semibold text-accent-blue">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">
                {t("profile.avatar")}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={!isEditable}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1">
              {t("profile.name") || "Name"}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isEditable}
              className="input"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">
                Birth Date
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                disabled={!isEditable}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as "male" | "female" | "other")}
                disabled={!isEditable}
                className="input"
                required
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1">
              {t("profile.bio") || "Bio"}
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={!isEditable}
              rows={3}
              className="input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">
                {t("profile.location") || "Location"}
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={!isEditable}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black dark:text-white mb-1">
                {t("profile.occupation") || "Occupation"}
              </label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                disabled={!isEditable}
                className="input"
              />
            </div>
          </div>
          
          {familyMember && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Generation:</strong> {familyMember.generation} • <strong>Family ID:</strong> {familyMember.id}
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isEditable || saving}
              className="btn-primary"
            >
              {saving ? t("common.loading") : t("profile.save")}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}


