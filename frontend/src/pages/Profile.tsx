import React, { useState, useEffect } from "react";
import { Layout } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { familyMembersAPI, uploadAPI } from "../utils/api";
import { Camera, Save, User, Mail, Lock, Calendar, MapPin, Briefcase, Heart, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

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
  const [uploading, setUploading] = useState(false);
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
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : "",
        anniversaryDate: user.anniversaryDate ? new Date(user.anniversaryDate).toISOString().split('T')[0] : null,
        gender: user.gender || "male",
        storyEn: user.storyEn || "",
        storyTe: user.storyTe || ""
      });
    }
  }, [user]);

  if (!user) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatus(null);
    try {
      const result = await uploadAPI.uploadImage(file);
      setFormData(prev => ({ ...prev, avatar: result.imageUrl }));
      setStatus({ type: 'success', msg: "Photo uploaded successfully!" });
      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      setStatus({ type: 'error', msg: "Failed to upload photo. Please try again." });
    } finally {
      setUploading(false);
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

      await familyMembersAPI.updateMyProfile(updateData); 
      
      setStatus({ type: 'success', msg: t("profile.saved") || "Profile updated successfully!" });
      
      if (refetchUser) await refetchUser();
      
      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', msg: err.response?.data?.message || "Update failed." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto pb-20 px-4 sm:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center sm:text-left space-y-2">
            <h1 className="text-4xl sm:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-indigo-800 to-gray-900 dark:from-white dark:via-indigo-200 dark:to-white">
              {t("profile.title")}
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">
              {t("profile.subtitle") || "Personalize your family presence"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="relative space-y-8">
            {/* Status Notification */}
            {status && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`sticky top-4 z-50 p-4 rounded-2xl shadow-xl backdrop-blur-md border ${
                  status.type === 'success' 
                    ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300' 
                    : 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300'
                }`}
              >
                <div className="flex items-center justify-center font-bold">
                  {status.msg}
                </div>
              </motion.div>
            )}

            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl rounded-[40px] shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
              
              {/* Cover Gradient */}
              <div className="h-48 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-90 relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
              </div>

              <div className="px-8 pb-12">
                {/* Avatar Upload */}
                <div className="relative -mt-24 mb-10 flex justify-center sm:justify-start">
                  <div className="relative group">
                    <div className="w-48 h-48 rounded-[40px] p-2 bg-white dark:bg-gray-900 shadow-2xl rotate-3 transition-transform group-hover:rotate-0 duration-300">
                      {formData.avatar ? (
                        <img 
                          src={formData.avatar} 
                          className={`w-full h-full rounded-[32px] object-cover ${uploading ? 'opacity-50' : ''}`} 
                          alt="Profile" 
                        />
                      ) : (
                        <div className="w-full h-full rounded-[32px] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center text-6xl font-black text-gray-300 dark:text-gray-600">
                          {formData.name.charAt(0)}
                        </div>
                      )}
                      
                      {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    
                    <label className="absolute -bottom-4 -right-4 bg-indigo-600 text-white p-4 rounded-2xl shadow-xl shadow-indigo-600/30 cursor-pointer hover:bg-indigo-700 hover:scale-110 transition-all active:scale-95">
                      <Camera className="w-6 h-6" />
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Left Column: Basic Info */}
                  <div className="space-y-8">
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
                        <User className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-lg font-bold uppercase tracking-widest text-gray-400">Identity</h3>
                      </div>
                      
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">{t("profile.name")}</label>
                          <input 
                            type="text" 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                            className="w-full bg-gray-50 dark:bg-black/20 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 font-bold text-lg outline-none transition-all dark:text-white"
                            required 
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Short Bio / Catchphrase</label>
                          <textarea 
                            rows={3} 
                            value={formData.bio} 
                            onChange={e => setFormData({...formData, bio: e.target.value})} 
                            className="w-full bg-gray-50 dark:bg-black/20 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 font-medium outline-none transition-all dark:text-white resize-none"
                            placeholder="Tell the family a bit about yourself..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
                        <Lock className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-lg font-bold uppercase tracking-widest text-gray-400">Security</h3>
                      </div>
                      
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Email</label>
                          <div className="relative">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input 
                              type="email" 
                              value={formData.email} 
                              onChange={e => setFormData({...formData, email: e.target.value})} 
                              className="w-full bg-gray-50 dark:bg-black/20 border-2 border-transparent focus:border-indigo-500 rounded-2xl pl-12 pr-5 py-4 font-medium outline-none transition-all dark:text-white"
                              required 
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Password</label>
                          <div className="relative">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input 
                              type="password" 
                              value={formData.password} 
                              onChange={e => setFormData({...formData, password: e.target.value})} 
                              className="w-full bg-gray-50 dark:bg-black/20 border-2 border-transparent focus:border-indigo-500 rounded-2xl pl-12 pr-5 py-4 font-medium outline-none transition-all dark:text-white"
                              placeholder="Reset password..."
                              minLength={6} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Details */}
                  <div className="space-y-8">
                     <div className="space-y-6">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
                        <Calendar className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-lg font-bold uppercase tracking-widest text-gray-400">Personal Details</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Date of Birth</label>
                           <div className="relative">
                            <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input 
                              type="date" 
                              value={formData.birthDate || ''} 
                              onChange={e => setFormData({...formData, birthDate: e.target.value})} 
                              className="w-full bg-gray-50 dark:bg-black/20 border-2 border-transparent focus:border-indigo-500 rounded-2xl pl-12 pr-5 py-4 font-medium outline-none transition-all dark:text-white"
                            />
                          </div>
                        </div>

                         <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Anniversary</label>
                           <div className="relative">
                            <Heart className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input 
                              type="date" 
                              value={formData.anniversaryDate || ""} 
                              onChange={e => setFormData({...formData, anniversaryDate: e.target.value || null})} 
                              className="w-full bg-gray-50 dark:bg-black/20 border-2 border-transparent focus:border-indigo-500 rounded-2xl pl-12 pr-5 py-4 font-medium outline-none transition-all dark:text-white"
                            />
                          </div>
                        </div>

                         <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Location</label>
                           <div className="relative">
                            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input 
                               placeholder="City, Country"
                              type="text" 
                              value={formData.location} 
                              onChange={e => setFormData({...formData, location: e.target.value})} 
                              className="w-full bg-gray-50 dark:bg-black/20 border-2 border-transparent focus:border-indigo-500 rounded-2xl pl-12 pr-5 py-4 font-medium outline-none transition-all dark:text-white"
                            />
                          </div>
                        </div>

                         <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Occupation</label>
                           <div className="relative">
                            <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input 
                               placeholder="Job Title"
                              type="text" 
                              value={formData.occupation} 
                              onChange={e => setFormData({...formData, occupation: e.target.value})} 
                              className="w-full bg-gray-50 dark:bg-black/20 border-2 border-transparent focus:border-indigo-500 rounded-2xl pl-12 pr-5 py-4 font-medium outline-none transition-all dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/10">
                        <BookOpen className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-lg font-bold uppercase tracking-widest text-gray-400">Detailed Story</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Family Story (English)</label>
                          <textarea 
                            rows={4} 
                            value={formData.storyEn} 
                            onChange={e => setFormData({...formData, storyEn: e.target.value})} 
                            className="w-full bg-gray-50 dark:bg-black/20 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 font-medium outline-none transition-all dark:text-white leading-relaxed"
                            placeholder="Share your detailed journey..."
                          />
                        </div>

                         <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">కుటుంబ కథ (Telugu)</label>
                          <textarea 
                            rows={4} 
                            value={formData.storyTe} 
                            onChange={e => setFormData({...formData, storyTe: e.target.value})} 
                            className="w-full bg-gray-50 dark:bg-black/20 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 font-medium outline-none transition-all dark:text-white leading-relaxed text-lg"
                            placeholder="మీ కథను ఇక్కడ రాయండి..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex justify-end">
                   <button 
                    type="submit" 
                    disabled={saving}
                    className="relative group overflow-hidden px-8 py-4 bg-indigo-600 rounded-2xl text-white font-black text-lg tracking-wide shadow-2xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
                   >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                      <span className="relative flex items-center justify-center gap-2">
                        {saving ? (
                          <>
                             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                             Saving Changes...
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            Save Profile
                          </>
                        )}
                      </span>
                   </button>
                </div>

              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
};
