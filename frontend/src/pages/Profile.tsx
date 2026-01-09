import React, { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { familyMembersAPI, uploadAPI, authAPI } from "../utils/api";

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    avatar: "",
    bio: "",
    location: "",
    occupation: "",
    birthDate: "",
    anniversaryDate: "" as string | null,
    gender: "male" as "male" | "female" | "other"
  });

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        password: "",
        avatar: user.avatar || "",
        bio: user.bio || "",
        location: user.location || "",
        occupation: user.occupation || "",
        birthDate: user.birthDate || "",
        anniversaryDate: user.anniversaryDate || null,
        gender: user.gender || "male",
      });
    }
  }, [user]);

  if (!user) return null;
  
  if (user.role === 'admin') {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200">
          <p className="text-blue-800 dark:text-blue-300 font-medium">
            🛡️ {t("profile.adminNotice") || "Admin accounts are managed via the dashboard settings."}
          </p>
        </div>
      </Layout>
    );
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadAPI.uploadImage(file);
      setFormData(prev => ({ ...prev, avatar: result.imageUrl }));
    } catch (err: any) {
      setStatus({ type: 'error', msg: t("common.error") });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      const updateData: any = { ...formData };
      if (!updateData.password || updateData.password.length < 6) {
        delete updateData.password;
      }

      await familyMembersAPI.update(user.id, updateData);
      setStatus({ type: 'success', msg: t("profile.saved") || "Profile updated!" });
      
      const updatedUser = await authAPI.getMe();
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.response?.data?.message || "Update failed" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold">{t("profile.title")}</h1>
          <p className="text-gray-500">{t("profile.subtitle")}</p>
        </header>

        <form onSubmit={handleSubmit} className="card space-y-6 shadow-sm">
          {status && (
            <div className={`p-4 rounded-xl border-2 ${status.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
              {status.msg}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
            <div className="relative group">
              {formData.avatar ? (
                <img src={formData.avatar} className="w-24 h-24 rounded-full object-cover ring-4 ring-white dark:ring-gray-700 shadow-lg" alt="Profile" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-accent-blue text-white flex items-center justify-center text-3xl font-bold">
                  {user.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold mb-2 uppercase tracking-wider text-gray-500">
                {t("profile.avatar")}
              </label>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-blue/10 file:text-accent-blue hover:file:bg-accent-blue/20 cursor-pointer" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">{t("profile.name")}</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input w-full" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Email</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input w-full" required />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">New Password (Optional)</label>
            <input type="password" placeholder="Min 6 characters" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="input w-full" minLength={6} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Birth Date</label>
              <input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} className="input w-full" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Anniversary Date</label>
              <input type="date" value={formData.anniversaryDate || ""} onChange={e => setFormData({...formData, anniversaryDate: e.target.value || null})} className="input w-full" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Bio</label>
            <textarea rows={3} value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="input w-full" />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="submit" disabled={saving} className="btn-primary px-8 py-3">
              {saving ? t("common.loading") : t("profile.save")}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
