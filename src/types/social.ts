export interface SharingPermissions {
  shareWorkouts: boolean;
  shareConsistency: boolean;
  sharePersonalRecords: boolean;
  shareStrengthProgress: boolean;
  shareWeight: boolean; // default false
  shareMeasurements: boolean; // default false
  shareNutrition: boolean; // default false
  shareProgressPhotos: boolean; // default false
}

export const DEFAULT_SHARING_PERMISSIONS: SharingPermissions = {
  shareWorkouts: true,
  shareConsistency: true,
  sharePersonalRecords: true,
  shareStrengthProgress: false,
  shareWeight: false,
  shareMeasurements: false,
  shareNutrition: false,
  shareProgressPhotos: false,
};

export type FriendshipStatus = "pending" | "accepted" | "declined" | "blocked";

export interface FriendRelationship {
  id: string;
  userId: string;
  friendId: string;
  friendName: string;
  friendAvatar?: string;
  status: FriendshipStatus;
  permissions: SharingPermissions;
  createdAt: string;
  updatedAt: string;
}

export interface SocialActivityItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  activityType: "workout_completed" | "personal_record" | "streak_milestone" | "progress_card_shared";
  title: string;
  description: string;
  stats?: {
    volume?: string;
    exercises?: number;
    prName?: string;
    prValue?: string;
    streakDays?: number;
  };
  reactions: {
    userId: string;
    emoji: "🔥" | "💪" | "👏" | "⚡" | "🎯";
  }[];
  comments: {
    id: string;
    userId: string;
    userName: string;
    text: string;
    createdAt: string;
  }[];
  createdAt: string;
}
