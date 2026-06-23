export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  about: string | null;
  createdAt: string;
}

export interface UserProfile extends User {
  isOnline?: boolean;
  lastSeen?: string;
  friendCount: number;
  mutualFriendCount: number;
  currentTrack: { title: string; artist: string; cover: string } | null;
  currentMovie: { title: string; identifier: string } | null;
  isFollowing: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
