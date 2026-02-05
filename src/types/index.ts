import type { Timestamp } from "firebase/firestore";

export interface Campaign {
  id: string; // Firestore document ID
  userId: string;
  username: string;
  socialNetwork: 'TikTok' | 'Facebook' | 'Instagram' | 'generic';
  url: string;
  reward: number;
  avatarUrl: string;
  createdAt: Timestamp;
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
  createdAt: Timestamp;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  avatarUrl: string;
  text: string;
  createdAt: Timestamp;
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
  createdAt: Timestamp;
}
