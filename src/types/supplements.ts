export type SupplementTiming = "morning" | "with_meal" | "pre_workout" | "post_workout" | "evening" | "anytime";

export type SupplementScheduleType = "daily" | "weekdays" | "custom";

export interface SupplementDefinition {
  id: string;
  userId: string;
  name: string;
  dosage?: string; // Optional serving/quantity e.g. "5g" or "2 capsules" or "2000 IU"
  timing: SupplementTiming;
  scheduleType?: SupplementScheduleType;
  scheduleDays: number[]; // 0-6 for Sun-Sat (all 7 for daily)
  reminderTime?: string; // "08:00"
  notes?: string;
  isActive: boolean;
  isPaused?: boolean;
  isArchived?: boolean;
  createdAt: string;
  archivedAt?: string;
}

export interface SupplementLogEntry {
  id: string;
  userId: string;
  supplementId: string;
  supplementName: string;
  dosage?: string;
  actualQuantity?: string; // Optional daily override e.g. "10g"
  date: string; // YYYY-MM-DD
  status: "taken" | "skipped" | "pending";
  loggedAt?: string;
  notes?: string;
}
