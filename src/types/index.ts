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
