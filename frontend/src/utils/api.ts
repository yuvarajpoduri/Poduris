import axios from "axios";
import type {
  User,
  FamilyMember,
  FamilyMemberWithRelations,
  Announcement,
  GalleryImage,
  CalendarEvent,
  DashboardStats,
  ChatMessage,
  ApiResponse
} from "../types";

const API_URL = import.meta.env.VITE_API_URL || "https://poduris-backend.onrender.com/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

export const authAPI = {
  login: async (email: string, password: string) => {
    const res = await api.post<ApiResponse<User>>("/auth/login", { email, password });
    return res.data.user;
  },
<<<<<<< HEAD
  logout: async (): Promise<void> => {
=======
  register: async (email: string, password: string, linkedFamilyMemberId: number) => {
    const res = await api.post<ApiResponse<User>>("/auth/register", {
      email,
      password,
      linkedFamilyMemberId
    });
    return res.data.user;
  },
  logout: async () => {
>>>>>>> 3c8a2a087cf8d1de97ed55022004c88257f07561
    await api.post("/auth/logout");
  },
  getMe: async () => {
    const res = await api.get<ApiResponse<User>>("/auth/me");
    return res.data.user;
  }
};

export const familyMembersAPI = {
<<<<<<< HEAD
  getAll: async (search?: string): Promise<FamilyMember[]> => {
    const params = search ? new URLSearchParams({ search }) : '';
    const response = await api.get<ApiResponse<FamilyMember[]>>(
      `/family-members${params ? `?${params}` : ''}`
    );
    return response.data.data || [];
=======
  getAll: async () => {
    const res = await api.get<ApiResponse<FamilyMember[]>>("/family-members");
    return res.data.data || [];
  },
  getAvailable: async () => {
    const res = await api.get<ApiResponse<FamilyMember[]>>("/family-members/available");
    return res.data.data || [];
>>>>>>> 3c8a2a087cf8d1de97ed55022004c88257f07561
  },
  getById: async (id: number | string) => {
    const res = await api.get<ApiResponse<FamilyMemberWithRelations>>(`/family-members/${id}`);
    return res.data.data!;
  },
  getDashboardStats: async () => {
    const res = await api.get<ApiResponse<DashboardStats>>("/family-members/stats/dashboard");
    return res.data.data!;
  }
};

export const announcementsAPI = {
  getAll: async () => {
    const res = await api.get<ApiResponse<Announcement[]>>("/announcements");
    return res.data.data || [];
  },
  create: async (data: Partial<Announcement>) => {
    const res = await api.post<ApiResponse<Announcement>>("/announcements", data);
    return res.data.data!;
  }
};

export const galleryAPI = {
  getAll: async () => {
    const res = await api.get<ApiResponse<GalleryImage[]>>("/gallery");
    return res.data.data || [];
  },
  upload: async (data: Partial<GalleryImage>) => {
    const res = await api.post<ApiResponse<GalleryImage>>("/gallery", data);
    return res.data.data!;
  },
  approve: async (id: string) => {
    const res = await api.put<ApiResponse<GalleryImage>>(`/gallery/${id}/approve`);
    return res.data.data!;
  },
  reject: async (id: string) => {
    const res = await api.put<ApiResponse<GalleryImage>>(`/gallery/${id}/reject`);
    return res.data.data!;
  }
};

export const uploadAPI = {
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await api.post<ApiResponse<{ imageUrl: string; cloudinaryId: string }>>(
      "/upload",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data.data!;
  }
};

export const calendarAPI = {
  getEvents: async (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.append("month", String(month));
    if (year) params.append("year", String(year));
    const res = await api.get<ApiResponse<CalendarEvent[]>>(
      `/calendar/events?${params.toString()}`
    );
    return res.data.data || [];
  }
};

export const usersAPI = {
  getAll: async () => {
    const res = await api.get<ApiResponse<User[]>>("/users");
    return res.data.data || [];
  },
  approve: async (id: string, role?: string) => {
    const res = await api.put<ApiResponse<User>>(`/users/${id}/approve`, { role });
    return res.data.data!;
  }
};

export const chatAPI = {
<<<<<<< HEAD
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
=======
  getMessages: async () => {
    const res = await api.get<ApiResponse<ChatMessage[]>>("/chat");
    return res.data.data || [];
>>>>>>> 3c8a2a087cf8d1de97ed55022004c88257f07561
  },
  sendMessage: async (message: string) => {
    const res = await api.post<ApiResponse<ChatMessage>>("/chat", { message });
    return res.data.data!;
  }
};

export default api;
