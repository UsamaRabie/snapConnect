export interface IUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: string;
}

export interface IUserProfile extends IUser {
  isFollowing: boolean;
}

export interface IPost {
  _id: string;
  user: Pick<IUser, "id" | "username" | "fullName" | "avatar">;
  caption?: string;
  image?: string;
  video?: string;
  location?: string;
  tags: string[];
  taggedUsers?: Array<Pick<IUser, "id" | "username" | "fullName" | "avatar">>;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IComment {
  _id: string;
  user: Pick<IUser, "id" | "username" | "fullName" | "avatar">;
  post: string;
  text: string;
  parentComment?: string | null;
  ancestors?: string[];
  depth?: number;
  children?: IComment[];
  createdAt: string;
  updatedAt?: string;
}

export interface IMessage {
  _id: string;
  conversation: string;
  sender: {
    id: string;
    username: string;
    fullName: string;
    avatar?: string;
  };
  text?: string;
  image?: string;
  isRead: boolean;
  createdAt: string;
}

export interface IConversation {
  _id: string;
  otherUser: Pick<IUser, "id" | "username" | "fullName" | "avatar">;
  lastMessage: {
    _id: string;
    text: string;
    sender: string;
    createdAt: string;
  } | null;
  updatedAt: string;
}

export interface IStory {
  _id: string;
  user: Pick<IUser, "id" | "username" | "fullName" | "avatar">;
  media: string;
  type: "image" | "video";
  expiresAt: string;
  viewers: string[];
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  status: "success" | "error";
  message?: string;
  data?: T;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuthResponse {
  user: IUser;
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  bio?: string;
  username?: string;
}

export interface INotification {
  _id: string;
  recipient: string;
  type: "follow" | "like" | "comment" | "reply" | "tag" | "message";
  sender: Pick<IUser, "id" | "username" | "fullName" | "avatar">;
  post?: string;
  comment?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FieldErrors {
  [key: string]: string;
}
