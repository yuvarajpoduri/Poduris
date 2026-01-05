import axios from 'axios';
import type { 
  User, 
  FamilyMember, 
  FamilyMemberWithRelations,
  Announcement,
  GalleryImage,
  CalendarEvent,
  DashboardStats,
  ApiResponse
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    const response = await api.post<{ success: boolean; token: string; user: User }>('/auth/login', { email, password });
    return { token: response.data.token, user: response.data.user };
  },
  register: async (email: string, password: string, name: string): Promise<{ token: string; user: User }> => {
    const response = await api.post<{ success: boolean; token: string; user: User }>('/auth/register', { email, password, name });
    return { token: response.data.token, user: response.data.user };
  },
  getMe: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data!;
  }
};

// Family Members API
export const familyMembersAPI = {
  getAll: async (): Promise<FamilyMember[]> => {
    const response = await api.get<ApiResponse<FamilyMember[]>>('/family-members');
    return response.data.data || [];
  },
  getById: async (id: string | number): Promise<FamilyMemberWithRelations> => {
    const response = await api.get<ApiResponse<FamilyMemberWithRelations>>(`/family-members/${id}`);
    return response.data.data!;
  },
  getByGeneration: async (generation: number): Promise<FamilyMember[]> => {
    const response = await api.get<ApiResponse<FamilyMember[]>>(`/family-members/generation/${generation}`);
    return response.data.data || [];
  },
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get<ApiResponse<DashboardStats>>('/family-members/stats/dashboard');
    return response.data.data!;
  },
  create: async (member: Partial<FamilyMember>): Promise<FamilyMember> => {
    const response = await api.post<ApiResponse<FamilyMember>>('/family-members', member);
    return response.data.data!;
  },
  update: async (id: string | number, member: Partial<FamilyMember>): Promise<FamilyMember> => {
    const response = await api.put<ApiResponse<FamilyMember>>(`/family-members/${id}`, member);
    return response.data.data!;
  },
  delete: async (id: string | number): Promise<void> => {
    await api.delete(`/family-members/${id}`);
  }
};

// Announcements API
export const announcementsAPI = {
  getAll: async (): Promise<Announcement[]> => {
    const response = await api.get<ApiResponse<Announcement[]>>('/announcements');
    return response.data.data || [];
  },
  getById: async (id: string): Promise<Announcement> => {
    const response = await api.get<ApiResponse<Announcement>>(`/announcements/${id}`);
    return response.data.data!;
  },
  create: async (announcement: Partial<Announcement>): Promise<Announcement> => {
    const response = await api.post<ApiResponse<Announcement>>('/announcements', announcement);
    return response.data.data!;
  },
  update: async (id: string, announcement: Partial<Announcement>): Promise<Announcement> => {
    const response = await api.put<ApiResponse<Announcement>>(`/announcements/${id}`, announcement);
    return response.data.data!;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/announcements/${id}`);
  }
};

// Gallery API
export const galleryAPI = {
  getAll: async (): Promise<GalleryImage[]> => {
    const response = await api.get<ApiResponse<GalleryImage[]>>('/gallery');
    return response.data.data || [];
  },
  getById: async (id: string): Promise<GalleryImage> => {
    const response = await api.get<ApiResponse<GalleryImage>>(`/gallery/${id}`);
    return response.data.data!;
  },
  upload: async (image: Partial<GalleryImage>): Promise<GalleryImage> => {
    const response = await api.post<ApiResponse<GalleryImage>>('/gallery', image);
    return response.data.data!;
  },
  update: async (id: string, image: Partial<GalleryImage>): Promise<GalleryImage> => {
    const response = await api.put<ApiResponse<GalleryImage>>(`/gallery/${id}`, image);
    return response.data.data!;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/gallery/${id}`);
  }
};

// Calendar API
export const calendarAPI = {
  getEvents: async (month?: number, year?: number, includeBirthdays?: boolean, includeAnniversaries?: boolean): Promise<CalendarEvent[]> => {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    if (includeBirthdays !== undefined) params.append('includeBirthdays', includeBirthdays.toString());
    if (includeAnniversaries !== undefined) params.append('includeAnniversaries', includeAnniversaries.toString());
    
    const response = await api.get<ApiResponse<CalendarEvent[]>>(`/calendar/events?${params.toString()}`);
    return response.data.data || [];
  }
};

// Upload API
export const uploadAPI = {
  uploadImage: async (file: File): Promise<{ imageUrl: string; cloudinaryId: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await api.post<ApiResponse<{ imageUrl: string; cloudinaryId: string }>>(
      '/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data.data!;
  }
};

export default api;

