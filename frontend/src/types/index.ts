export interface User {
  id: string;
  email: string;
  name: string;
  nickname?: string;
  role: 'admin' | 'family_member';
  status: 'active' | 'inactive' | 'pending';
  avatar?: string;
  bio?: string;
  location?: string;
  occupation?: string;
  familyMemberId?: number;
  linkedFamilyMemberId?: number;
  linkedFamilyMember?: FamilyMember;
  birthDate?: string;
  anniversaryDate?: string | null;
  gender?: 'male' | 'female' | 'other';
  generation?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FamilyMember {
  _id: string;
  id: number;
  name: string;
  nickname?: string;
  email?: string;
  birthDate: string;
  anniversaryDate?: string | null;
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



export interface GalleryImage {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  cloudinaryId: string;
  location: string;
  date: string;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  familyMemberId: number | null;
  status: 'pending' | 'approved' | 'rejected';
  batchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  type: 'birthday' | 'anniversary' | 'event' | 'holiday' | 'other';
  date: string;
  title: string;
  _id?: string;
  memberId?: number;
  memberName?: string;
  member1Name?: string;
  member2Name?: string;
  avatar?: string;
  birthDate?: string;
  anniversaryDate?: string;
  email?: string;
  description?: string;
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

export interface ChatMessage {
  _id: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  receiver?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  message: string;
  replyTo?: {
    _id: string;
    message: string;
    sender: {
      _id: string;
      name: string;
      avatar?: string;
    };
  } | null;
  isGroupChat: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  _id: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  eventType: 'event' | 'holiday' | 'other';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wish {
  _id: string;
  sender: {
    _id: string;
    name: string;
    avatar?: string;
  };
  recipient: string;
  recipientFamilyMemberId: number;
  message: string;
  year: number;
  createdAt: string;
}

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  category: 'birthday' | 'anniversary' | 'event' | 'news' | 'other';
  createdBy: {
    _id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
}
