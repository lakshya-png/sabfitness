export interface WaterEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  amountMl: number;
  timestamp: string; // ISO
}

export interface DailyWaterLog {
  date: string;
  totalMl: number;
  goalMl: number;
  entries: WaterEntry[];
}
