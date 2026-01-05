import React, { useState } from "react";
import { Layout } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { usersAPI, uploadAPI } from "../utils/api";

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocation] = useState(user?.location || "");
  const [occupation, setOccupation] = useState(user?.occupation || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return null;
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
      await usersAPI.updateMyProfile({
        name,
        avatar,
        bio,
        location,
        occupation,
      });
      setMessage(t("profile.saved"));
    } catch (err: any) {
      setError(err.response?.data?.message || t("common.error"));
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
              {t("profile.name")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isEditable}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1">
              {t("profile.bio")}
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
                {t("profile.location")}
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
                {t("profile.occupation")}
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


