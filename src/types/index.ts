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

export interface FlogProfile {
  id: string; // Firestore document ID
  userId: string;
  username: string;
  mainPhotoUrl: string;
  description: string;
  lastPhotoUpdate: Timestamp;
  themeColor: 'cyan' | 'magenta' | 'lime';
  likes: number;
  dislikes: number;
}

export interface FlogSignature {
  id: string; // Firestore document ID
  authorId: string;
  authorUsername: string;
  authorAvatar: string;
  text: string;
  createdAt: Timestamp;
}
