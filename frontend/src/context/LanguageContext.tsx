import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'te';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.family': 'Family',
    'nav.calendar': 'Calendar',
    'nav.gallery': 'Gallery',
    'nav.announcements': 'Announcements',
    'nav.admin': 'Admin',
    'nav.logout': 'Logout',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.submit': 'Submit',
    'common.search': 'Search',
    
    // Auth
    'auth.login': 'Sign In',
    'auth.register': 'Create Account',
    'auth.email': 'Email address',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.loginSuccess': 'Login successful',
    'auth.registerSuccess': 'Registration successful! Your account is pending admin approval.',
    'auth.logout': 'Logout',
    
    // Gallery
    'gallery.title': 'Gallery',
    'gallery.upload': 'Upload Image',
    'gallery.pending': 'Pending',
    'gallery.approved': 'Approved',
    'gallery.rejected': 'Rejected',
    'gallery.approve': 'Approve',
    'gallery.reject': 'Reject',
    'gallery.noImages': 'No images in gallery',
    'gallery.loading': 'Loading gallery...',
    'gallery.uploadHint': 'Your image will be reviewed by an admin before being published.',
    
    // Users
    'users.title': 'User Management',
    'users.pending': 'Pending Approval',
    'users.approved': 'Approved Users',
    'users.rejected': 'Rejected Users',
    'users.approve': 'Approve',
    'users.reject': 'Reject',
    'users.role': 'Role',
    'users.familyMember': 'Family Member',
    'users.admin': 'Admin',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome',
    
    // Calendar
    'calendar.title': 'Calendar',
    
    // Announcements
    'announcements.title': 'Announcements',
    
    // Family
    'family.title': 'Family Tree',

    // Chat
    'chat.title': 'Family Group Chat',
    'chat.loading': 'Loading messages...',
    'chat.empty': 'No messages yet. Say hello to the family!',
    'chat.placeholder': 'Type a message...',
    'chat.replyingTo': 'Replying to',
    'chat.deleteConfirm': 'Are you sure you want to delete this message?',

    // Profile
    'profile.title': 'Profile',
    'profile.subtitle': 'Manage your personal details',
    'profile.name': 'Name',
    'profile.avatar': 'Avatar',
    'profile.bio': 'Bio',
    'profile.location': 'Location',
    'profile.occupation': 'Occupation',
    'profile.save': 'Save Profile',
    'profile.onlyApproved': 'Only approved users can edit their profile.',
    'profile.saved': 'Profile updated successfully.',
  },
  te: {
    // Navigation
    'nav.dashboard': 'డాష్బోర్డ్',
    'nav.family': 'కుటుంబం',
    'nav.calendar': 'క్యాలెండర్',
    'nav.gallery': 'గ్యాలరీ',
    'nav.announcements': 'ప్రకటనలు',
    'nav.admin': 'అడ్మిన్',
    'nav.logout': 'లాగ్అవుట్',
    
    // Common
    'common.loading': 'లోడ్ అవుతోంది...',
    'common.error': 'దోషం',
    'common.success': 'విజయం',
    'common.cancel': 'రద్దు చేయి',
    'common.save': 'సేవ్ చేయి',
    'common.delete': 'తొలగించు',
    'common.edit': 'సవరించు',
    'common.close': 'మూసివేయి',
    'common.submit': 'సమర్పించు',
    'common.search': 'శోధించు',
    
    // Auth
    'auth.login': 'సైన్ ఇన్',
    'auth.register': 'ఖాతా సృష్టించు',
    'auth.email': 'ఇమెయిల్ చిరునామా',
    'auth.password': 'పాస్వర్డ్',
    'auth.name': 'పూర్తి పేరు',
    'auth.loginSuccess': 'లాగిన్ విజయవంతమైంది',
    'auth.registerSuccess': 'నమోదు విజయవంతమైంది! మీ ఖాతా అడ్మిన్ ఆమోదం కోసం వేచి ఉంది.',
    'auth.logout': 'లాగ్అవుట్',
    
    // Gallery
    'gallery.title': 'గ్యాలరీ',
    'gallery.upload': 'చిత్రం అప్లోడ్ చేయి',
    'gallery.pending': 'వేచి ఉంది',
    'gallery.approved': 'ఆమోదించబడింది',
    'gallery.rejected': 'తిరస్కరించబడింది',
    'gallery.approve': 'ఆమోదించు',
    'gallery.reject': 'తిరస్కరించు',
    'gallery.noImages': 'గ్యాలరీలో చిత్రాలు లేవు',
    'gallery.loading': 'గ్యాలరీ లోడ్ అవుతోంది...',
    'gallery.uploadHint': 'మీ చిత్రం ప్రచురించబడే ముందు అడ్మిన్ సమీక్షిస్తారు.',
    
    // Users
    'users.title': 'వినియోగదారు నిర్వహణ',
    'users.pending': 'ఆమోదం కోసం వేచి ఉంది',
    'users.approved': 'ఆమోదించబడిన వినియోగదారులు',
    'users.rejected': 'తిరస్కరించబడిన వినియోగదారులు',
    'users.approve': 'ఆమోదించు',
    'users.reject': 'తిరస్కరించు',
    'users.role': 'పాత్ర',
    'users.familyMember': 'కుటుంబ సభ్యుడు',
    'users.admin': 'అడ్మిన్',
    
    // Dashboard
    'dashboard.title': 'డాష్బోర్డ్',
    'dashboard.welcome': 'స్వాగతం',
    
    // Calendar
    'calendar.title': 'క్యాలెండర్',
    
    // Announcements
    'announcements.title': 'ప్రకటనలు',
    
    // Family
    'family.title': 'కుటుంబ వృక్షం',

    // Chat
    'chat.title': 'కుటుంబ గ్రూప్ చాట్',
    'chat.loading': 'సందేశాలు లోడ్ అవుతున్నాయి...',
    'chat.empty': 'ఇంకా సందేశాలు లేవు. కుటుంబంతో పలకరించండి!',
    'chat.placeholder': 'సందేశం టైప్ చేయండి...',
    'chat.replyingTo': 'సమాధానం ఇస్తున్నారు',
    'chat.deleteConfirm': 'ఈ సందేశాన్ని నిజంగా తొలగించాలనా?',

    // Profile
    'profile.title': 'ప్రొఫైల్',
    'profile.subtitle': 'మీ వ్యక్తిగత వివరాలను నిర్వహించండి',
    'profile.name': 'పేరు',
    'profile.avatar': 'ప్రొఫైల్ ఫోటో',
    'profile.bio': 'సంక్షిప్త వివరణ',
    'profile.location': 'చిరునామా / స్థలం',
    'profile.occupation': 'వృత్తి',
    'profile.save': 'ప్రొఫైల్ సేవ్ చేయి',
    'profile.onlyApproved': 'ఆమోదించబడిన వినియోగదారులు మాత్రమే ప్రొఫైల్ సవరించగలరు.',
    'profile.saved': 'ప్రొఫైల్ విజయవంతంగా నవీకరించబడింది.',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'te' : 'en');
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};


