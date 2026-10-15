import Dexie, { type Table } from "dexie";
import type { WorkoutSession } from "@/types/fitness";
import type { LoggedFoodItem } from "@/types/nutrition";
import type { WaterEntry } from "@/types/water";
import type { SupplementLogEntry } from "@/types/supplements";
import type { BodyMeasurement, ProgressPhoto } from "@/types/progress";

export interface SyncQueueItem {
  id: string;
  table: "workouts" | "meals" | "water" | "supplements" | "measurements" | "goals";
  action: "insert" | "update" | "delete";
  payload: any;
  timestamp: number;
  retryCount: number;
}

export class SabFitnessDatabase extends Dexie {
  workouts!: Table<WorkoutSession, string>;
  activeWorkout!: Table<WorkoutSession, string>;
  foodLogs!: Table<LoggedFoodItem, string>;
  waterLogs!: Table<WaterEntry, string>;
  supplementLogs!: Table<SupplementLogEntry, string>;
  measurements!: Table<BodyMeasurement, string>;
  progressPhotos!: Table<ProgressPhoto, string>;
  syncQueue!: Table<SyncQueueItem, string>;

  constructor() {
    super("SabFitnessDB");
    this.version(1).stores({
      workouts: "id, userId, startTime, status",
      activeWorkout: "id, userId",
      foodLogs: "id, mealType, loggedAt",
      waterLogs: "id, userId, date, timestamp",
      supplementLogs: "id, userId, supplementId, date, status",
      measurements: "id, userId, date",
      progressPhotos: "id, userId, date",
      syncQueue: "id, table, timestamp, retryCount",
    });
  }
}

export const db = new SabFitnessDatabase();
