export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'family_member';
}

export interface FamilyMember {
  _id: string;
  id: number;
  name: string;
  birthDate: string;
  deathDate: string | null;
  gender: 'male' | 'female' | 'other';
  parentId: number | null;
  spouseId: number | null;
  generation: number;
  avatar: string;
  occupation: string;
  location: string;
  bio: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FamilyMemberWithRelations extends FamilyMember {
  parents: FamilyMember[];
  spouse: FamilyMember | null;
  children: FamilyMember[];
}

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  category: 'birthday' | 'anniversary' | 'event' | 'news' | 'other';
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryImage {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  cloudinaryId: string;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
  };
  familyMemberId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  type: 'birthday' | 'anniversary';
  date: string;
  title: string;
  memberId?: number;
  memberName?: string;
  member1Id?: number;
  member2Id?: number;
  member1Name?: string;
  member2Name?: string;
  avatar?: string;
}

export interface DashboardStats {
  totalMembers: number;
  totalGenerations: number;
  upcomingBirthdays: Array<FamilyMember & { nextBirthday: string; daysUntil: number }>;
  upcomingAnniversaries: Array<{
    member1: string;
    member2: string;
    anniversaryDate: string;
    daysUntil: number;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

