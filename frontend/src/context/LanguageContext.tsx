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
    'nav.dashboard': 'Hub',
    'nav.family': 'Lineage',
    'nav.calendar': 'Moments',
    'nav.gallery': 'Memories',
    'nav.call': 'Studio',
    'nav.announcements': 'Voices',
    'nav.admin': 'Control',
    'nav.logout': 'Depart',
    
    // Common
    'common.loading': 'Gathering...',
    'common.error': 'Something went sideways',
    'common.success': 'Done',
    'common.cancel': 'Nevermind',
    'common.save': 'Preserve',
    'common.delete': 'Erase',
    'common.edit': 'Refine',
    'common.close': 'Dismiss',
    'common.submit': 'Send forth',
    'common.search': 'Seek...',
    
    // Auth
    'auth.login': 'Enter',
    'auth.register': 'Join Us',
    'auth.email': 'Your Signal (Email)',
    'auth.password': 'Your Key (Password)',
    'auth.name': 'Who are you?',
    'auth.loginSuccess': 'Welcome back.',
    'auth.registerSuccess': 'You have joined the circle. Await approval.',
    'auth.logout': 'Depart',
    
    // Gallery
    'gallery.title': 'Timeless Moments',
    'gallery.upload': 'Share a Memory',
    'gallery.pending': 'In Limbo',
    'gallery.approved': 'Eternalized',
    'gallery.rejected': 'Discarded',
    'gallery.approve': 'Eternalize',
    'gallery.reject': 'Discard',
    'gallery.noImages': 'The void is empty.',
    'gallery.loading': 'Summoning memories...',
    'gallery.uploadHint': 'Your memory will be reviewed before joining the collection.',
    
    // Users
    'users.title': 'The Circle',
    'users.pending': 'Awaiting Entry',
    'users.approved': 'The Circle',
    'users.rejected': 'Turned Away',
    'users.approve': 'Welcome',
    'users.reject': 'Turn Away',
    'users.role': 'Role',
    'users.familyMember': 'Kin',
    'users.admin': 'Overseer',
    
    // Admin
    'admin.title': 'The Oversight',
    'admin.familyMembers': 'The Kin',
    'admin.announcements': 'Proclamations',
    'admin.gallery': 'The Archive',
    'admin.addMember': 'Record New Kin',
    'admin.editMember': 'Update Record',
    'admin.deleteConfirm': 'Are you certain you wish to erase this from existence?',
    'admin.searchPlaceholder': 'Seek by name...',
    
    // Dashboard
    'dashboard.title': 'Home Base',
    'dashboard.welcome': 'Welcome home, to where it all began.',
    'dashboard.familyMembers': 'Our Kind',
    'dashboard.generations': 'Eras',
    'dashboard.upcomingBirthdays': 'Upcoming Celebrations',
    'dashboard.upcomingAnniversaries': 'Union Milestones',
    'dashboard.noUpcomingBirthdays': 'No celebrations on the horizon',
    'dashboard.noUpcomingAnniversaries': 'No unions to celebrate soon',
    'dashboard.days': 'days remaining',
    'dashboard.todayBirthday': '🎉 Today, we celebrate {name}',
    'dashboard.turningAge': 'Completing {age} years of life.',
    'dashboard.birthdayWish': 'May your year be filled with wonder.',
    'dashboard.todayAnniversary': '💛 Celebrating the union of {name1} & {name2}',
    'dashboard.completedYears': '{years} years as one.',
    'dashboard.anniversaryWish': 'Here is to many more.',
    
    // Calendar
    'calendar.title': 'Days of Celebration',
    'calendar.noEvents': 'Silence this month.',
    'calendar.birthday': 'Birth Day',
    'calendar.anniversary': 'Union Day',
    
    // Announcements
    'announcements.title': 'Voices of the Family',
    'announcements.noAnnouncements': 'Silence falls upon us.',
    'announcements.create': 'Speak',
    
    // Family
    'family.title': 'Our Legacy',
    'family.noMembers': 'No kin found.',
    'family.storyTitle': 'Family Story',
    'family.watchStory': 'Watch Family Story',
    'family.generation': 'Generation',
    'family.gatheringLineage': 'Gathering the lineage...',
    'family.noStories': 'No stories found.',
    'family.defaultBio': 'A valued member of our family tree, contributing to our collective legacy.',

    // Chat
    'chat.title': 'The Hearth',
    'chat.loading': 'Whispers loading...',
    'chat.empty': 'The hearth is cold. Speak up!',
    'chat.placeholder': 'Share your thoughts...',
    'chat.replyingTo': 'Responding to',
    'chat.deleteConfirm': 'Take back these words?',
    'chat.viewProfile': 'See who this is',
    'chat.profile.generation': 'Era',
    'chat.profile.location': 'Dwelling',
    'chat.profile.birthday': 'Began Life',
    'chat.profile.anniversary': 'United',
    'chat.adminCannotSend': 'Overseers listen, but do not speak here.',

    // Profile
    'profile.title': 'Your Essence',
    'profile.subtitle': 'Manage how you are known',
    'profile.name': 'Name',
    'profile.avatar': 'Visage',
    'profile.bio': 'Story',
    'profile.location': 'Whereabouts',
    'profile.occupation': 'Calling',
    'profile.save': 'Preserve Changes',
    'profile.onlyApproved': 'Only accepted kin may change their essence.',
    'profile.saved': 'Essence updated.',
    'profile.email': 'Signal',
    'profile.password': 'Key (leave blank to keep)',
    'profile.birthDate': 'Day of Origin',
    'profile.anniversaryDate': 'Day of Union',
    'profile.gender': 'Nature',
  },
  te: {
    // Navigation
    'nav.dashboard': 'హబ్',
    'nav.family': 'వంశవృక్షం',
    'nav.calendar': 'ముఖ్యమైన తేదీలు',
    'nav.gallery': 'జ్ఞాపకాలు',
    'nav.call': 'స్టూడియో',
    'nav.announcements': 'కుటుంబ వార్తలు',
    'nav.admin': 'నిర్వాహణ',
    'nav.logout': 'నిష్క్రమించు',
    
    // Common
    'common.loading': 'లోడ్ అవుతోంది...',
    'common.error': 'ఏదో తప్పు జరిగింది',
    'common.success': 'విజయం',
    'common.cancel': 'రద్దు చేయి',
    'common.save': 'భద్రపరచు',
    'common.delete': 'తొలగించు',
    'common.edit': 'సవరించు',
    'common.close': 'మూసివేయి',
    'common.submit': 'పంపు',
    'common.search': 'వెతకండి...',
    
    // Auth
    'auth.login': 'లాగిన్',
    'auth.register': 'నమోదు చేసుకోండి',
    'auth.email': 'ఇమెయిల్',
    'auth.password': 'పాస్‌వర్డ్',
    'auth.name': 'మీ పేరు',
    'auth.loginSuccess': 'స్వాగతం',
    'auth.registerSuccess': 'మీ అభ్యర్థన పంపబడింది. ఆమోదం కోసం వేచి ఉండండి.',
    'auth.logout': 'నిష్క్రమించు',
    
    // Gallery
    'gallery.title': 'జ్ఞాపకాల సమాహారం',
    'gallery.upload': 'ఫోటోను పంచుకోండి',
    'gallery.pending': 'సమీక్షలో ఉంది',
    'gallery.approved': 'ఆమోదించబడింది',
    'gallery.rejected': 'తిరస్కరించబడింది',
    'gallery.approve': 'ఆమోదించు',
    'gallery.reject': 'తిరస్కరించు',
    'gallery.noImages': 'ఇంకా ఫోటోలు లేవు',
    'gallery.loading': 'జ్ఞాపకాలను తెస్తున్నాము...',
    'gallery.uploadHint': 'మీ ఫోటో సమీక్ష తర్వాత అందరికీ కనిపిస్తుంది.',
    
    // Users
    'users.title': 'కుటుంబ సభ్యుల జాబితా',
    'users.pending': 'కొత్త అభ్యర్థనలు',
    'users.approved': 'సభ్యులు',
    'users.rejected': 'తిరస్కరించబడినవి',
    'users.approve': 'చేర్చుకోండి',
    'users.reject': 'వద్దు అనుకోండి',
    'users.role': 'హోదా',
    'users.familyMember': 'బంధువు',
    'users.admin': 'నిర్వాహకుడు',
    
    // Admin
    'admin.title': 'నిర్వాహణ విభాగం',
    'admin.familyMembers': 'బంధువులు',
    'admin.announcements': 'వార్తలు',
    'admin.gallery': 'ఫోటోలు',
    'admin.addMember': 'కొత్త సభ్యుడిని చేర్చండి',
    'admin.editMember': 'వివరాలు మార్చండి',
    'admin.deleteConfirm': 'దీన్ని నిజంగా తొలగించాలా?',
    'admin.searchPlaceholder': 'పేరుతో వెతకండి...',
    
    // Dashboard
    'dashboard.title': 'డాష్‌బోర్డ్',
    'dashboard.welcome': 'స్వాగతం, మన కుటుంబానికి.',
    'dashboard.familyMembers': 'మొత్తం సభ్యులు',
    'dashboard.generations': 'తరాలు',
    'dashboard.upcomingBirthdays': 'రాబోయే పుట్టినరోజులు',
    'dashboard.upcomingAnniversaries': 'వివాహ వార్షికోత్సవాలు',
    'dashboard.noUpcomingBirthdays': 'త్వరలో పుట్టినరోజులు లేవు',
    'dashboard.noUpcomingAnniversaries': 'త్వరలో వేడుకలు లేవు',
    'dashboard.days': 'రోజులు ఉన్నాయి',
    'dashboard.todayBirthday': '🎉 ఈ రోజు {name} పుట్టినరోజు!',
    'dashboard.turningAge': '{age}వ వసంతంలోకి అడుగుపెడుతున్నారు.',
    'dashboard.birthdayWish': 'నిండు నూరేళ్లు చల్లగా ఉండాలి.',
    'dashboard.todayAnniversary': '💛 {name1} & {name2} గారి పెళ్లి రోజు శుభాకాంక్షలు!',
    'dashboard.completedYears': '{years} సంవత్సరాల దాంపత్యం.',
    'dashboard.anniversaryWish': 'మరెన్నో ఆనందకరమైన ఏళ్లు జరుపుకోవాలి.',
    
    // Calendar
    'calendar.title': 'విశేష దినాలు',
    'calendar.noEvents': 'ఈ నెలలో విశేషాలు లేవు.',
    'calendar.birthday': 'పుట్టినరోజు',
    'calendar.anniversary': 'పెళ్లి రోజు',
    
    // Announcements
    'announcements.title': 'కుటుంబ విశేషాలు',
    'announcements.noAnnouncements': 'తాజా వార్తలు ఏమీ లేవు.',
    'announcements.create': 'వార్తను పంచుకోండి',
    
    // Family
    'family.title': 'మన వంశవృక్షం',
    'family.noMembers': 'సభ్యులు కనపడలేదు.',
    'family.storyTitle': 'కుటుంబ కథ',
    'family.watchStory': 'కుటుంబ కథ చూడండి',
    'family.generation': 'తరం',
    'family.gatheringLineage': 'వంశాన్ని సిద్ధం చేస్తున్నాము...',
    'family.noStories': 'కథలు ఏమీ లేవు.',
    'family.defaultBio': 'మన వంశ వృక్షంలో ఒక ముఖ్యమైన సభ్యుడు, మన వారసత్వానికి దోహదపడుతున్నారు.',

    // Chat
    'chat.title': 'కబుర్లు',
    'chat.loading': 'లోడ్ అవుతోంది...',
    'chat.empty': 'ఇంకా ఎవరూ మాట్లాడలేదు. మీరే మొదలుపెట్టండి!',
    'chat.placeholder': 'ఏమైనా చెప్పండి...',
    'chat.replyingTo': 'సమాధానం',
    'chat.deleteConfirm': 'ఈ సందేశాన్ని చెరిపివేయాలా?',
    'chat.viewProfile': 'ప్రొఫైల్ చూడండి',
    'chat.profile.generation': 'తరం',
    'chat.profile.location': 'నివాసం',
    'chat.profile.birthday': 'పుట్టిన తేదీ',
    'chat.profile.anniversary': 'పెళ్లి తేదీ',
    'chat.adminCannotSend': 'నిర్వాహకులు ఇక్కడ సందేశాలు పంపలేరు.',

    // Profile
    'profile.title': 'నా వివరాలు',
    'profile.subtitle': 'మీ సమాచారాన్ని మార్చుకోండి',
    'profile.name': 'పేరు',
    'profile.avatar': 'ఫోటో',
    'profile.bio': 'మీ గురించి',
    'profile.location': 'ఊరు',
    'profile.occupation': 'వృత్తి',
    'profile.save': 'మార్పులు భద్రపరచు',
    'profile.onlyApproved': 'అనుమతి పొందిన సభ్యులు మాత్రమే వివరాలు మార్చగలరు.',
    'profile.saved': 'వివరాలు నవీకరించబడ్డాయి.',
    'profile.email': 'ఇమెయిల్',
    'profile.password': 'పాస్‌వర్డ్ (మార్చకపోతే ఖాళీగా ఉంచండి)',
    'profile.birthDate': 'పుట్టిన తేదీ',
    'profile.anniversaryDate': 'పెళ్లి రోజు',
    'profile.gender': 'లింగం',
    
    // Nickname Prompt
    'nickname.title': 'మిమ్మల్ని ఏమని పిలవాలి?',
    'nickname.subtitle': 'దయచేసి మీ ముద్దుపేరు (Nickname) ఎంచుకోండి. ఇది చాట్ మరియు ఇతర చోట్ల కనిపిస్తుంది.',
    'nickname.placeholder': 'మీ ముద్దుపేరు (ఉదా. చిన్ని)',
    'nickname.submit': 'ఖరారు చేయి',
    'nickname.skip': 'తర్వాత చేస్తాను',
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


