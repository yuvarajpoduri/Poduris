import axios from "axios";
import type {
  User,
  FamilyMember,
  FamilyMemberWithRelations,
  Announcement,
  GalleryImage,
  CalendarEvent,
  DashboardStats,
  ApiResponse,
  ChatMessage,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email: string, password: string): Promise<{ user: User }> => {
    const response = await api.post<{ success: boolean; user: User }>(
      "/auth/login",
      { email, password }
    );
    return { user: response.data.user };
  },
  register: async (email: string, password: string, familyMemberId: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>(
      "/auth/register",
      { email, password, familyMemberId }
    );
    return response.data;
  },
  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
    localStorage.removeItem("user");
  },
  getMe: async (): Promise<User> => {
    const response = await api.get<{ success: boolean; user: User }>(
      "/auth/me"
    );
    return response.data.user;
  },
};

export const familyMembersAPI = {
  getAll: async (search?: string): Promise<FamilyMember[]> => {
    const params = search ? new URLSearchParams({ search }) : "";
    const response = await api.get<ApiResponse<FamilyMember[]>>(
      `/family-members${params ? `?${params}` : ""}`
    );
    return response.data.data || [];
  },
  getById: async (id: string | number): Promise<FamilyMemberWithRelations> => {
    const response = await api.get<ApiResponse<FamilyMemberWithRelations>>(
      `/family-members/${id}`
    );
    return response.data.data!;
  },
  getByGeneration: async (generation: number): Promise<FamilyMember[]> => {
    const response = await api.get<ApiResponse<FamilyMember[]>>(
      `/family-members/generation/${generation}`
    );
    return response.data.data || [];
  },
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get<ApiResponse<DashboardStats>>(
      "/family-members/stats/dashboard"
    );
    return response.data.data!;
  },
  create: async (member: Partial<FamilyMember>): Promise<FamilyMember> => {
    const response = await api.post<ApiResponse<FamilyMember>>(
      "/family-members",
      member
    );
    return response.data.data!;
  },
  update: async (
    id: string | number,
    member: Partial<FamilyMember>
  ): Promise<FamilyMember> => {
    const response = await api.put<ApiResponse<FamilyMember>>(
      `/family-members/${id}`,
      member
    );
    return response.data.data!;
  },
  delete: async (id: string | number): Promise<void> => {
    await api.delete(`/family-members/${id}`);
  },
};

export const announcementsAPI = {
  getAll: async (): Promise<Announcement[]> => {
    const response = await api.get<ApiResponse<Announcement[]>>(
      "/announcements"
    );
    return response.data.data || [];
  },
  getById: async (id: string): Promise<Announcement> => {
    const response = await api.get<ApiResponse<Announcement>>(
      `/announcements/${id}`
    );
    return response.data.data!;
  },
  create: async (
    announcement: Partial<Announcement>
  ): Promise<Announcement> => {
    const response = await api.post<ApiResponse<Announcement>>(
      "/announcements",
      announcement
    );
    return response.data.data!;
  },
  update: async (
    id: string,
    announcement: Partial<Announcement>
  ): Promise<Announcement> => {
    const response = await api.put<ApiResponse<Announcement>>(
      `/announcements/${id}`,
      announcement
    );
    return response.data.data!;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/announcements/${id}`);
  },
};

export const galleryAPI = {
  getAll: async (): Promise<GalleryImage[]> => {
    const response = await api.get<ApiResponse<GalleryImage[]>>("/gallery");
    return response.data.data || [];
  },
  getById: async (id: string): Promise<GalleryImage> => {
    const response = await api.get<ApiResponse<GalleryImage>>(`/gallery/${id}`);
    return response.data.data!;
  },
  upload: async (image: Partial<GalleryImage>): Promise<GalleryImage> => {
    const response = await api.post<ApiResponse<GalleryImage>>(
      "/gallery",
      image
    );
    return response.data.data!;
  },
  update: async (
    id: string,
    image: Partial<GalleryImage>
  ): Promise<GalleryImage> => {
    const response = await api.put<ApiResponse<GalleryImage>>(
      `/gallery/${id}`,
      image
    );
    return response.data.data!;
  },
  approve: async (id: string): Promise<GalleryImage> => {
    const response = await api.put<ApiResponse<GalleryImage>>(
      `/gallery/${id}/approve`,
      {}
    );
    return response.data.data!;
  },
  reject: async (id: string): Promise<GalleryImage> => {
    const response = await api.put<ApiResponse<GalleryImage>>(
      `/gallery/${id}/reject`,
      {}
    );
    return response.data.data!;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/gallery/${id}`);
  },
};

export const calendarAPI = {
  getEvents: async (
    month?: number,
    year?: number,
    includeBirthdays?: boolean,
    includeAnniversaries?: boolean
  ): Promise<CalendarEvent[]> => {
    const params = new URLSearchParams();
    if (month) params.append("month", month.toString());
    if (year) params.append("year", year.toString());
    if (includeBirthdays !== undefined)
      params.append("includeBirthdays", includeBirthdays.toString());
    if (includeAnniversaries !== undefined)
      params.append("includeAnniversaries", includeAnniversaries.toString());
    const response = await api.get<ApiResponse<CalendarEvent[]>>(
      `/calendar/events?${params.toString()}`
    );
    return response.data.data || [];
  },
};

export const uploadAPI = {
  uploadImage: async (
    file: File
  ): Promise<{ imageUrl: string; cloudinaryId: string }> => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await api.post
      ApiResponse<{ imageUrl: string; cloudinaryId: string }>
    >("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data!;
  },
};

export const usersAPI = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get<ApiResponse<User[]>>("/users");
    return response.data.data || [];
  },
  getById: async (id: string): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data!;
  },
  approve: async (
    id: string,
    role?: string,
    linkedFamilyMemberId?: number
  ): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}/approve`, {
      role,
      linkedFamilyMemberId,
    });
    return response.data.data!;
  },
  reject: async (id: string): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(
      `/users/${id}/reject`,
      {}
    );
    return response.data.data!;
  },
  update: async (id: string, user: Partial<User>): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, user);
    return response.data.data!;
  },
  updateMyProfile: async (profile: Partial<FamilyMember>): Promise<FamilyMember> => {
    const response = await api.put<ApiResponse<FamilyMember>>("/users/me/profile", profile);
    return response.data.data!;
  },
};

export const chatAPI = {
  getMessages: async (): Promise<ChatMessage[]> => {
    const response = await api.get<ApiResponse<ChatMessage[]>>("/chat");
    return response.data.data || [];
  },
  sendMessage: async (
    message: string,
    replyToId?: string
  ): Promise<ChatMessage> => {
    const response = await api.post<ApiResponse<ChatMessage>>("/chat", {
      message,
      replyToId,
    });
    return response.data.data!;
  },
  deleteMessage: async (id: string): Promise<void> => {
    await api.delete(`/chat/${id}`);
  },
};

export default api;
