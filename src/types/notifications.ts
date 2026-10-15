export type NotificationCategory =
  | "workout"
  | "water"
  | "meal"
  | "supplement"
  | "milestone"
  | "social"
  | "security"
  | "system";

export interface AppNotification {
  id: string;
  userId: string;
  category: NotificationCategory;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationSettings {
  workoutReminders: boolean;
  waterReminders: boolean;
  mealReminders: boolean;
  supplementReminders: boolean;
  friendActivity: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "07:00"
}
