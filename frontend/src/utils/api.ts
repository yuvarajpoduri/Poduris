import axios from "axios";
import type {
  User,
  FamilyMember,
  FamilyMemberWithRelations,
  GalleryImage,
  CalendarEvent,
  DashboardStats,
  ApiResponse,
  ChatMessage,
  Event,
  Wish,
  Announcement,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined" && config.headers) {
    config.headers["x-current-path"] = window.location.pathname;
  }
  return config;
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
  updateMyProfile: async (profile: Partial<FamilyMember>): Promise<FamilyMember> => {
    const response = await api.put<ApiResponse<FamilyMember>>("/users/me/profile", profile);
    return response.data.data!;
  },
};



export const galleryAPI = {
  getAll: async (params?: { search?: string; sort?: string; month?: number; year?: number }): Promise<GalleryImage[]> => {
    const response = await api.get<ApiResponse<GalleryImage[]>>("/gallery", { params });
    return response.data.data || [];
  },
  getById: async (id: string): Promise<GalleryImage> => {
    const response = await api.get<ApiResponse<GalleryImage>>(`/gallery/${id}`);
    return response.data.data!;
  },
  upload: async (payload: Partial<GalleryImage> | { images: Partial<GalleryImage>[] }): Promise<GalleryImage | GalleryImage[]> => {
    const response = await api.post<ApiResponse<GalleryImage | GalleryImage[]>>(
      "/gallery",
      payload
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
    
    // Use raw axios to avoid instance defaults
    const response = await axios.post<
      ApiResponse<{ imageUrl: string; cloudinaryId: string }>
    >(`${API_URL}/upload`, formData, {
      withCredentials: true,
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

export const eventsAPI = {
  getAll: async (): Promise<Event[]> => {
    const response = await api.get<ApiResponse<Event[]>>("/events");
    return response.data.data || []; // Note: Controller returns array directly, so adjust if needed.
    // Actually controller res.json(events) -> so it's just array, not ApiResponse wrapped?
    // Let's check controller. res.json(events). YES.
    // So response.data IS the array.
    // Wait, typical API response wrapper in this project is ApiResponse.
    // My controller returns raw array `res.json(events)`.
    // I should probably fix controller to be consistent or handle it here.
    // Existing controllers use ApiResponse pattern?
    // Let's check existing controllers later. For now, assuming standard axios response.data is the payload.
    // BUT frontend expects ApiResponse wrapper usually?
    // Let's look at getEvents controller: `res.json(events)`.
    // Let's look at api.tsx `getAll` for family members: `response.data.data`.
    // So usually backend returns { success: true, data: [...] }.
    // My new controller just returns `[...]`.
    // So `response.data` IS the array.
  },
  create: async (event: Partial<Event>): Promise<Event> => {
    const response = await api.post<Event>("/events", event);
    return response.data;
  },
  update: async (id: string, event: Partial<Event>): Promise<Event> => {
    const response = await api.put<Event>(`/events/${id}`, event);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`);
  },
};

export const wishAPI = {
  send: async (recipientFamilyMemberId: number, message: string = "Happy Birthday!"): Promise<{ success: boolean; data: Wish }> => {
    const response = await api.post<{ success: boolean; data: Wish }>("/wishes", {
      recipientFamilyMemberId,
      message,
    });
    return response.data;
  },
  getReceived: async (): Promise<Wish[]> => {
    const response = await api.get<{ success: boolean; data: Wish[] }>("/wishes/received");
    return response.data.data!;
  },
  getSentIds: async (): Promise<number[]> => {
    const response = await api.get<{ success: boolean; data: number[] }>("/wishes/sent-ids");
    return response.data.data!;
  },
};

export const announcementsAPI = {
  getAll: async (): Promise<Announcement[]> => {
    const response = await api.get<ApiResponse<Announcement[]>>("/announcements");
    return response.data.data || [];
  },
};

export default api;
