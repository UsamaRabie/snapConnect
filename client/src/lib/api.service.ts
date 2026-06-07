import apiClient from "./axios";
import type {
  ApiResponse,
  AuthResponse,
  IUser,
  IUserProfile,
  IPost,
  IComment,
  INotification,
  IMessage,
  IConversation,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from "@/types";

const handleError = (error: unknown): never => {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as {
      response?: { data?: { message?: string } };
    };
    throw new Error(
      axiosError.response?.data?.message || "An unexpected error occurred"
    );
  }
  throw error;
};

export const authApi = {
  register: async (input: RegisterInput): Promise<AuthResponse> => {
    try {
      const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
        "/auth/register",
        input
      );
      return data.data!;
    } catch (error) {
      return handleError(error);
    }
  },
  login: async (input: LoginInput): Promise<AuthResponse> => {
    try {
      const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
        "/auth/login",
        input
      );
      return data.data!;
    } catch (error) {
      return handleError(error);
    }
  },
  logout: async (): Promise<void> => {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      return handleError(error);
    }
  },
  getMe: async (): Promise<IUser> => {
    try {
      const { data } = await apiClient.get<ApiResponse<{ user: IUser }>>(
        "/auth/me"
      );
      return data.data!.user;
    } catch (error) {
      return handleError(error);
    }
  },
};

export const userApi = {
  getProfile: async (id: string): Promise<IUserProfile> => {
    try {
      const { data } = await apiClient.get<ApiResponse<{ user: IUserProfile }>>(
        `/users/${id}`
      );
      return data.data!.user;
    } catch (error) {
      return handleError(error);
    }
  },

  getProfileByUsername: async (username: string): Promise<IUserProfile> => {
    try {
      const { data } = await apiClient.get<ApiResponse<{ user: IUserProfile }>>(
        `/users/username/${username}`
      );
      return data.data!.user;
    } catch (error) {
      return handleError(error);
    }
  },

  checkUsername: async (
    username: string
  ): Promise<{ available: boolean; message: string }> => {
    try {
      const { data } = await apiClient.get<
        ApiResponse<{ available: boolean; message: string }>
      >("/users/check-username", { params: { username } });
      return data.data!;
    } catch (error) {
      return handleError(error);
    }
  },

  updateProfile: async (input: UpdateProfileInput): Promise<IUser> => {
    try {
      const { data } = await apiClient.put<ApiResponse<{ user: IUser }>>(
        "/users/profile",
        input
      );
      return data.data!.user;
    } catch (error) {
      return handleError(error);
    }
  },

  uploadAvatar: async (file: File): Promise<IUser> => {
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const { data } = await apiClient.post<ApiResponse<{ user: IUser }>>(
        "/users/profile/avatar",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data.data!.user;
    } catch (error) {
      return handleError(error);
    }
  },

  uploadCoverImage: async (file: File): Promise<IUser> => {
    try {
      const formData = new FormData();
      formData.append("coverImage", file);
      const { data } = await apiClient.post<ApiResponse<{ user: IUser }>>(
        "/users/profile/cover",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data.data!.user;
    } catch (error) {
      return handleError(error);
    }
  },

  follow: async (id: string): Promise<void> => {
    try {
      await apiClient.post(`/users/${id}/follow`);
    } catch (error) {
      return handleError(error);
    }
  },

  unfollow: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/users/${id}/follow`);
    } catch (error) {
      return handleError(error);
    }
  },

  getFollowers: async (
    userId: string,
    page = 1
  ): Promise<{ users: IUser[]; pagination: any }> => {
    try {
      const { data } = await apiClient.get<ApiResponse<{ users: IUser[] }>>(
        `/users/${userId}/followers`,
        { params: { page } }
      );
      return { users: data.data!.users, pagination: data.pagination! };
    } catch (error) {
      return handleError(error);
    }
  },

  getFollowing: async (
    userId: string,
    page = 1
  ): Promise<{ users: IUser[]; pagination: any }> => {
    try {
      const { data } = await apiClient.get<ApiResponse<{ users: IUser[] }>>(
        `/users/${userId}/following`,
        { params: { page } }
      );
      return { users: data.data!.users, pagination: data.pagination! };
    } catch (error) {
      return handleError(error);
    }
  },

  getSuggestedUsers: async (
    page = 1
  ): Promise<{ users: IUser[]; pagination: any }> => {
    try {
      const { data } = await apiClient.get<ApiResponse<{ users: IUser[] }>>(
        "/users/suggested",
        { params: { page } }
      );
      return { users: data.data!.users, pagination: data.pagination! };
    } catch (error) {
      return handleError(error);
    }
  },

  search: async (
    q: string,
    page = 1
  ): Promise<{ users: IUser[]; pagination: any }> => {
    try {
      const { data } = await apiClient.get<ApiResponse<{ users: IUser[] }>>(
        "/users/search",
        { params: { q, page } }
      );
      return { users: data.data!.users, pagination: data.pagination! };
    } catch (error) {
      return handleError(error);
    }
  },

  searchSuggestions: async (
    q: string
  ): Promise<{ users: IUser[] }> => {
    try {
      const { data } = await apiClient.get<ApiResponse<{ users: IUser[] }>>(
        "/users/search/suggestions",
        { params: { q } }
      );
      return { users: data.data!.users };
    } catch (error) {
      return handleError(error);
    }
  },
};

export const commentApi = {
  getComments: async (
    postId: string,
    page = 1,
    limit?: number
  ): Promise<{ comments: IComment[]; pagination: any }> => {
    try {
      const { data } = await apiClient.get<ApiResponse<{ comments: IComment[] }>>(
        `/posts/${postId}/comments`,
        { params: { page, ...(limit ? { limit } : {}) } }
      );
      return { comments: data.data!.comments, pagination: data.pagination! };
    } catch (error) {
      return handleError(error);
    }
  },

  create: async (
    postId: string,
    text: string,
    parentComment?: string
  ): Promise<IComment> => {
    try {
      const { data } = await apiClient.post<ApiResponse<{ comment: IComment }>>(
        `/posts/${postId}/comments`,
        { text, parentComment }
      );
      return data.data!.comment;
    } catch (error) {
      return handleError(error);
    }
  },

  getReplies: async (
    postId: string,
    commentId: string,
    page = 1
  ): Promise<{ replies: IComment[]; pagination: any }> => {
    try {
      const { data } = await apiClient.get<ApiResponse<{ replies: IComment[] }>>(
        `/posts/${postId}/comments/${commentId}`,
        { params: { page } }
      );
      return { replies: data.data!.replies, pagination: data.pagination! };
    } catch (error) {
      return handleError(error);
    }
  },

  getThread: async (
    postId: string,
    commentId: string,
    page = 1
  ): Promise<{ thread: IComment[]; pagination: any }> => {
    try {
      const { data } = await apiClient.get<ApiResponse<{ thread: IComment[] }>>(
        `/posts/${postId}/comments/${commentId}/thread`,
        { params: { page } }
      );
      return { thread: data.data!.thread, pagination: data.pagination! };
    } catch (error) {
      return handleError(error);
    }
  },

  update: async (
    postId: string,
    commentId: string,
    text: string
  ): Promise<IComment> => {
    try {
      const { data } = await apiClient.put<ApiResponse<{ comment: IComment }>>(
        `/posts/${postId}/comments/${commentId}`,
        { text }
      );
      return data.data!.comment;
    } catch (error) {
      return handleError(error);
    }
  },

  remove: async (postId: string, commentId: string): Promise<void> => {
    try {
      await apiClient.delete(`/posts/${postId}/comments/${commentId}`);
    } catch (error) {
      return handleError(error);
    }
  },
};

export const postApi = {
  create: async (formData: FormData): Promise<IPost> => {
    try {
      const { data } = await apiClient.post<ApiResponse<{ post: IPost }>>(
        "/posts",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data.data!.post;
    } catch (error) {
      return handleError(error);
    }
  },

  getFeed: async (page = 1): Promise<{ posts: IPost[]; pagination: any }> => {
    try {
      const { data } = await apiClient.get<ApiResponse<{ posts: IPost[] }>>(
        "/posts/feed",
        { params: { page } }
      );
      return { posts: data.data!.posts, pagination: data.pagination! };
    } catch (error) {
      return handleError(error);
    }
  },

  getUserPosts: async (
    userId: string,
    page = 1
  ): Promise<{ posts: IPost[]; pagination: any }> => {
    try {
      const { data } = await apiClient.get<ApiResponse<{ posts: IPost[] }>>(
        `/posts/user/${userId}`,
        { params: { page } }
      );
      return { posts: data.data!.posts, pagination: data.pagination! };
    } catch (error) {
      return handleError(error);
    }
  },

  getById: async (id: string): Promise<IPost> => {
    try {
      const { data } = await apiClient.get<ApiResponse<{ post: IPost }>>(
        `/posts/${id}`
      );
      return data.data!.post;
    } catch (error) {
      return handleError(error);
    }
  },

  like: async (id: string): Promise<void> => {
    try {
      await apiClient.post(`/posts/${id}/like`);
    } catch (error) {
      return handleError(error);
    }
  },

  unlike: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/posts/${id}/like`);
    } catch (error) {
      return handleError(error);
    }
  },

  update: async (id: string, formData: FormData): Promise<IPost> => {
    try {
      const { data } = await apiClient.put<ApiResponse<{ post: IPost }>>(
        `/posts/${id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return data.data!.post;
    } catch (error) {
      return handleError(error);
    }
  },

  getLikes: async (
    id: string,
    page = 1
  ): Promise<{ users: IUser[]; pagination: any }> => {
    try {
      const { data } = await apiClient.get<ApiResponse<{ users: IUser[] }>>(
        `/posts/${id}/likes`,
        { params: { page } }
      );
      return { users: data.data!.users, pagination: data.pagination! };
    } catch (error) {
      return handleError(error);
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/posts/${id}`);
    } catch (error) {
      return handleError(error);
    }
  },

  explore: async (
    page = 1
  ): Promise<{ posts: IPost[]; pagination: any }> => {
    try {
      const { data } = await apiClient.get<ApiResponse<{ posts: IPost[] }>>(
        "/posts/explore",
        { params: { page } }
      );
      return { posts: data.data!.posts, pagination: data.pagination! };
    } catch (error) {
      return handleError(error);
    }
  },

  save: async (id: string): Promise<void> => {
    try {
      await apiClient.post(`/posts/${id}/save`);
    } catch (error) {
      return handleError(error);
    }
  },

  unsave: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/posts/${id}/save`);
    } catch (error) {
      return handleError(error);
    }
  },

  getSaved: async (page = 1): Promise<{ posts: IPost[]; pagination: any }> => {
    try {
      const { data } = await apiClient.get<ApiResponse<{ posts: IPost[] }>>(
        "/posts/saved",
        { params: { page } }
      );
      return { posts: data.data!.posts, pagination: data.pagination! };
    } catch (error) {
      return handleError(error);
    }
  },

  getTagged: async (
    userId: string,
    page = 1
  ): Promise<{ posts: IPost[]; pagination: any }> => {
    try {
      const { data } = await apiClient.get<ApiResponse<{ posts: IPost[] }>>(
        `/posts/tagged/${userId}`,
        { params: { page } }
      );
      return { posts: data.data!.posts, pagination: data.pagination! };
    } catch (error) {
      return handleError(error);
    }
  },
};

export const notificationApi = {
  getNotifications: async (
    page = 1
  ): Promise<{ notifications: INotification[]; pagination: any }> => {
    try {
      const { data } = await apiClient.get<
        ApiResponse<{ notifications: INotification[] }>
      >("/notifications", { params: { page } });
      return {
        notifications: data.data!.notifications,
        pagination: data.pagination!,
      };
    } catch (error) {
      return handleError(error);
    }
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      const { data } = await apiClient.get<ApiResponse<{ count: number }>>(
        "/notifications/unread-count"
      );
      return data.data!.count;
    } catch (error) {
      return handleError(error);
    }
  },

  markAsRead: async (id: string): Promise<void> => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
    } catch (error) {
      return handleError(error);
    }
  },

  markAllAsRead: async (): Promise<void> => {
    try {
      await apiClient.put("/notifications/read-all");
    } catch (error) {
      return handleError(error);
    }
  },
};

export const conversationApi = {
  getConversations: async (): Promise<IConversation[]> => {
    try {
      const { data } = await apiClient.get<ApiResponse<{ conversations: IConversation[] }>>(
        "/conversations"
      );
      return data.data!.conversations;
    } catch (error) {
      return handleError(error);
    }
  },

  getOrCreate: async (userId: string): Promise<IConversation> => {
    try {
      const { data } = await apiClient.post<ApiResponse<{ conversation: IConversation }>>(
        `/conversations/${userId}`
      );
      return data.data!.conversation;
    } catch (error) {
      return handleError(error);
    }
  },

  getMessages: async (
    conversationId: string,
    page = 1
  ): Promise<{ messages: IMessage[]; pagination: any }> => {
    try {
      const { data } = await apiClient.get<ApiResponse<{ messages: IMessage[] }>>(
        `/conversations/${conversationId}/messages`,
        { params: { page } }
      );
      return { messages: data.data!.messages, pagination: data.pagination! };
    } catch (error) {
      return handleError(error);
    }
  },

  sendMessage: async (conversationId: string, text: string): Promise<IMessage> => {
    try {
      const { data } = await apiClient.post<ApiResponse<{ message: IMessage }>>(
        `/conversations/${conversationId}/messages`,
        { text }
      );
      return data.data!.message;
    } catch (error) {
      return handleError(error);
    }
  },
};
