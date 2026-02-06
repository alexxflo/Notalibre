import type { Timestamp } from "firebase/firestore";

export interface Campaign {
  id: string; // Firestore document ID
  userId: string;
  username: string;
  socialNetwork: 'TikTok' | 'Facebook' | 'Instagram' | 'generic';
  url: string;
  reward: number;
  avatarUrl: string;
  createdAt?: Timestamp;
}

export interface UserProfile {
  id: string; // Firestore document ID
  username: string;
  email: string;
  avatarUrl: string;
  coinBalance: number;
  gatekeeperPassed: boolean;
  isBlocked?: boolean;
  following?: string[];
  followers?: string[];
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string;
  text: string;
  imageUrl?: string;
  likes: string[];
  commentCount: number;
  createdAt?: Timestamp;
  visibility: 'public' | 'private';
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  avatarUrl: string;
  text: string;
  createdAt?: Timestamp;
}

export interface DailyStats {
    count: number;
    date: string; // YYYY-MM-DD
}

export interface ChatMessage {
  id: string; // Firestore document ID
  userId: string;
  username: string;
  avatarUrl: string;
  text: string;
  createdAt?: Timestamp;
}

export interface Notification {
  id: string;
  userId: string; // The user to be notified
  actorId: string; // The user who performed the action
  actorUsername: string;
  actorAvatarUrl: string;
  type: 'new_follower' | 'new_like' | 'new_comment' | 'avatar_change';
  postId?: string; // for likes and comments
  postTextSnippet?: string; // for likes and comments
  read: boolean;
  createdAt?: Timestamp;
}

export interface Chat {
  id: string;
  participantIds: string[];
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: Timestamp;
  };
}

export interface PrivateMessage {
  id: string;
  senderId: string;
  senderUsername: string;
  senderAvatarUrl: string;
  text: string;
  createdAt?: Timestamp;
}
