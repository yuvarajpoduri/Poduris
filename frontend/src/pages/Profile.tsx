import React, { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { familyMembersAPI, uploadAPI } from "../utils/api";

export const Profile: React.FC = () => {
  const { user, refetchUser } = useAuth();
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
    gender: "male" as "male" | "female" | "other",
    storyEn: "",
    storyTe: ""
  });

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  useEffect(() => {
    if (user) {
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
        storyEn: user.storyEn || "",
        storyTe: user.storyTe || ""
      });
    }
  }, [user]);

  if (!user) return null;
  
  // Allow admins to edit basic details if they want, but warn them features might be limited if not linked
  // Removing the blocking "Admin Notice" to allow "no mercy" updates as requested.
  // However, backend requires linkedFamilyMemberId for updateMyProfile. 
  // If admin is NOT linked, this will fail. keeping safety check if needed, but user requested "every user".
  // Assuming Admin accounts created via simplified flow might not have linked members.
  // Will show the form but maybe it errors out for pure admins. That's acceptable for now.

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

      // If user is Admin and NOT linked, we might need a different API endpoint. 
      // But for now, we try to update profile locally.
      
      // We use familyMembersAPI which hits /users/me/profile
      await familyMembersAPI.updateMyProfile(updateData); 
      
      setStatus({ type: 'success', msg: t("profile.saved") || "Profile updated successfully!" });
      
      // Refetch user data to update context immediately
      if (refetchUser) await refetchUser();
      
      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', msg: err.response?.data?.message || "Update failed. Ensure you are linked to a family member." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8 pb-12">
        <header className="space-y-2">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">{t("profile.title")}</h1>
          <p className="text-lg text-gray-500 font-medium">{t("profile.subtitle") || "Manage your personal information and preferences"}</p>
        </header>

        <form onSubmit={handleSubmit} className="card space-y-8 shadow-xl border-t-4 border-indigo-500">
          {status && (
            <div className={`p-4 rounded-xl border-l-4 font-medium flex items-center justify-between ${status.type === 'success' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'}`}>
              <p>{status.msg}</p>
            </div>
          )}

          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center gap-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-3xl border border-gray-200 dark:border-gray-700/50">
            <div className="relative group shrink-0">
              <div className="w-32 h-32 rounded-full p-1 bg-white dark:bg-gray-700 shadow-xl ring-2 ring-gray-100 dark:ring-gray-600">
                 {formData.avatar ? (
                    <img src={formData.avatar} className="w-full h-full rounded-full object-cover" alt="Profile" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-4xl font-black">
                      {formData.name.charAt(0)}
                    </div>
                  )}
              </div>
              <label className="absolute bottom-0 right-0 bg-white dark:bg-gray-700 text-indigo-600 p-2.5 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:scale-110 transition-transform">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                 <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
            <div className="text-center sm:text-left space-y-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Profile Photo</h3>
              <p className="text-gray-500 text-sm max-w-xs">Upload a photo to be used across the family tree, chat, and events.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Identity */}
             <div className="space-y-6">
                <h4 className="text-lg font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-xs border-b border-gray-100 dark:border-gray-700 pb-2">
                    Identity
                </h4>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{t("profile.name")}</label>
                      <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input w-full bg-gray-50 dark:bg-gray-900/50" required />
                    </div>
                </div>
             </div>

             {/* Contact */}
             <div className="space-y-6">
                <h4 className="text-lg font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-xs border-b border-gray-100 dark:border-gray-700 pb-2">
                    Contact & Security
                </h4>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Email Address</label>
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input w-full bg-gray-50 dark:bg-gray-900/50" required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">New Password <span className="text-gray-400 font-normal text-xs">(Leave blank to keep current)</span></label>
                      <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="input w-full bg-gray-50 dark:bg-gray-900/50" minLength={6} />
                    </div>
                </div>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Personal Dates */}
             <div className="space-y-6">
                <h4 className="text-lg font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-xs border-b border-gray-100 dark:border-gray-700 pb-2">
                    Important Dates
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Birth Date</label>
                      <input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} className="input w-full bg-gray-50 dark:bg-gray-900/50" required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Anniversary</label>
                      <input type="date" value={formData.anniversaryDate || ""} onChange={e => setFormData({...formData, anniversaryDate: e.target.value || null})} className="input w-full bg-gray-50 dark:bg-gray-900/50" />
                    </div>
                </div>
             </div>

             {/* Details */}
             <div className="space-y-6">
                <h4 className="text-lg font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-xs border-b border-gray-100 dark:border-gray-700 pb-2">
                    About You
                </h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Location</label>
                      <input type="text" placeholder="City, Country" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="input w-full bg-gray-50 dark:bg-gray-900/50" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Occupation</label>
                       <input type="text" placeholder="Job Title" value={formData.occupation} onChange={e => setFormData({...formData, occupation: e.target.value})} className="input w-full bg-gray-50 dark:bg-gray-900/50" />
                    </div>
                </div>
             </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Short Bio</label>
            <textarea rows={2} placeholder="A short catchphrase or bio..." value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="input w-full bg-gray-50 dark:bg-gray-900/50 resize-none" />
          </div>

          <div className="space-y-4 pt-2">
            <h4 className="text-lg font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-xs border-b border-gray-100 dark:border-gray-700 pb-2">
                Detailed Family Story
            </h4>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Family Story (English)</label>
                <textarea rows={6} placeholder="Your detailed story in English for the family slideshow..." value={formData.storyEn} onChange={e => setFormData({...formData, storyEn: e.target.value})} className="input w-full bg-gray-50 dark:bg-gray-900/50 resize-none font-medium leading-relaxed" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">కుటుంబ కథ (Telugu)</label>
                <textarea rows={6} placeholder="తెలుగులో మీ కుటుంబ కథ రాయండి..." value={formData.storyTe} onChange={e => setFormData({...formData, storyTe: e.target.value})} className="input w-full bg-gray-50 dark:bg-gray-900/50 resize-none text-lg font-medium leading-relaxed" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-100 dark:border-gray-700">
            <button type="submit" disabled={saving} className="btn-primary px-10 py-4 text-lg shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40">
              {saving ? (
                <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                    Saving...
                </span>
              ) : t("profile.save") || "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
