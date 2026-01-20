import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'te';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
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
    
    // Admin
    'admin.title': 'Admin Panel',
    'admin.familyMembers': 'Family Members',
    'admin.announcements': 'Announcements',
    'admin.gallery': 'Gallery',
    'admin.addMember': 'Add Member',
    'admin.editMember': 'Edit Family Member',
    'admin.deleteConfirm': 'Are you sure you want to delete this?',
    'admin.searchPlaceholder': 'Search by name or email...',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome to your family hub',
    'dashboard.familyMembers': 'Family Members',
    'dashboard.generations': 'Generations',
    'dashboard.upcomingBirthdays': 'Upcoming Birthdays',
    'dashboard.upcomingAnniversaries': 'Upcoming Anniversaries',
    'dashboard.noUpcomingBirthdays': 'No upcoming birthdays',
    'dashboard.noUpcomingAnniversaries': 'No upcoming anniversaries',
    'dashboard.days': 'days',
    'dashboard.todayBirthday': '🎉 Today is {name}\'s Birthday',
    'dashboard.turningAge': 'Turning {age} years old today!',
    'dashboard.birthdayWish': 'Wishing you a joyful year ahead!',
    'dashboard.todayAnniversary': '💛 Today is {name1} & {name2}\'s Anniversary',
    'dashboard.completedYears': '{years} years completed together',
    'dashboard.anniversaryWish': 'Congratulations on your special day!',
    
    // Calendar
    'calendar.title': 'Calendar',
    'calendar.noEvents': 'No events for this month',
    'calendar.birthday': 'Birthday',
    'calendar.anniversary': 'Anniversary',
    
    // Announcements
    'announcements.title': 'Announcements',
    'announcements.noAnnouncements': 'No announcements yet',
    'announcements.create': 'Create Announcement',
    
    // Family
    'family.title': 'Family Tree',
    'family.noMembers': 'No family members found',

    // Chat
    'chat.title': 'Family Group Chat',
    'chat.loading': 'Loading messages...',
    'chat.empty': 'No messages yet. Say hello to the family!',
    'chat.placeholder': 'Type a message...',
    'chat.replyingTo': 'Replying to',
    'chat.deleteConfirm': 'Are you sure you want to delete this message?',
    'chat.viewProfile': 'View profile',
    'chat.profile.generation': 'Generation',
    'chat.profile.location': 'Location',
    'chat.profile.birthday': 'Birthday',
    'chat.profile.anniversary': 'Anniversary',
    'chat.adminCannotSend': 'Admin accounts cannot send messages. Please use a family member account.',

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
    'profile.email': 'Email',
    'profile.password': 'Password (leave blank to keep current)',
    'profile.birthDate': 'Birth Date',
    'profile.anniversaryDate': 'Anniversary Date',
    'profile.gender': 'Gender',
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
    
    // Admin
    'admin.title': 'అడ్మిన్ ప్యానెల్',
    'admin.familyMembers': 'కుటుంబ సభ్యులు',
    'admin.announcements': 'ప్రకటనలు',
    'admin.gallery': 'గ్యాలరీ',
    'admin.addMember': 'సభ్యుడిని జోడించు',
    'admin.editMember': 'కుటుంబ సభ్యుడిని సవరించు',
    'admin.deleteConfirm': 'దీన్ని నిజంగా తొలగించాలనా?',
    'admin.searchPlaceholder': 'పేరు లేదా ఇమెయిల్ ద్వారా శోధించు...',
    
    // Dashboard
    'dashboard.title': 'డాష్బోర్డ్',
    'dashboard.welcome': 'మీ కుటుంబ కేంద్రానికి స్వాగతం',
    'dashboard.familyMembers': 'కుటుంబ సభ్యులు',
    'dashboard.generations': 'తరాలు',
    'dashboard.upcomingBirthdays': 'రాబోయే పుట్టినరోజులు',
    'dashboard.upcomingAnniversaries': 'రాబోయే వైవాహిక వార్షికోత్సవాలు',
    'dashboard.noUpcomingBirthdays': 'రాబోయే పుట్టినరోజులు లేవు',
    'dashboard.noUpcomingAnniversaries': 'రాబోయే వైవాహిక వార్షికోత్సవాలు లేవు',
    'dashboard.days': 'రోజులు',
    'dashboard.todayBirthday': '🎉 ఈరోజు {name} పుట్టినరోజు',
    'dashboard.turningAge': 'ఈరోజు {age} సంవత్సరాలు పూర్తి చేసుకుంటున్నారు!',
    'dashboard.birthdayWish': 'మీకు ఆనందంతో కూడిన సంవత్సరం కోరుతున్నాము!',
    'dashboard.todayAnniversary': '💛 ఈరోజు {name1} & {name2} వైవాహిక వార్షికోత్సవం',
    'dashboard.completedYears': '{years} సంవత్సరాలు కలిసి గడిపారు',
    'dashboard.anniversaryWish': 'మీ ప్రత్యేక రోజుకు అభినందనలు!',
    
    // Calendar
    'calendar.title': 'క్యాలెండర్',
    'calendar.noEvents': 'ఈ నెలకు సంఘటనలు లేవు',
    'calendar.birthday': 'పుట్టినరోజు',
    'calendar.anniversary': 'వైవాహిక వార్షికోత్సవం',
    
    // Announcements
    'announcements.title': 'ప్రకటనలు',
    'announcements.noAnnouncements': 'ఇంకా ప్రకటనలు లేవు',
    'announcements.create': 'ప్రకటన సృష్టించు',
    
    // Family
    'family.title': 'కుటుంబ వృక్షం',
    'family.noMembers': 'కుటుంబ సభ్యులు కనుగొనబడలేదు',

    // Chat
    'chat.title': 'కుటుంబ గ్రూప్ చాట్',
    'chat.loading': 'సందేశాలు లోడ్ అవుతున్నాయి...',
    'chat.empty': 'ఇంకా సందేశాలు లేవు. కుటుంబంతో పలకరించండి!',
    'chat.placeholder': 'సందేశం టైప్ చేయండి...',
    'chat.replyingTo': 'సమాధానం ఇస్తున్నారు',
    'chat.deleteConfirm': 'ఈ సందేశాన్ని నిజంగా తొలగించాలనా?',
    'chat.viewProfile': 'ప్రొఫైల్ చూడండి',
    'chat.profile.generation': 'తరం',
    'chat.profile.location': 'స్థలం',
    'chat.profile.birthday': 'పుట్టినరోజు',
    'chat.profile.anniversary': 'వైవాహిక వార్షికోత్సవం',
    'chat.adminCannotSend': 'అడ్మిన్ ఖాతాలు సందేశాలు పంపలేవు. దయచేసి కుటుంబ సభ్య ఖాతాను ఉపయోగించండి.',

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
    'profile.email': 'ఇమెయిల్',
    'profile.password': 'పాస్వర్డ్ (ప్రస్తుతాన్ని ఉంచడానికి ఖాళీగా వదిలివేయండి)',
    'profile.birthDate': 'పుట్టిన తేదీ',
    'profile.anniversaryDate': 'వైవాహిక వార్షికోత్సవ తేదీ',
    'profile.gender': 'లింగం',
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

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = translations[language][key] || key;
    if (params) {
      Object.keys(params).forEach(param => {
        translation = translation.replace(new RegExp(`\\{${param}\\}`, 'g'), String(params[param]));
      });
    }
    return translation;
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


