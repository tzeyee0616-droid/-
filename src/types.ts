export interface Settings {
  calorieBudget: number;
  waterGoalMl: number;
  weightKg: number;
  hairWashIntervalDays: number;
}

export interface FoodEntry {
  id: string;
  desc: string;
  cal: number;
  time: string;
  image?: string; // base64 representation of the photo
}

export interface ExerciseEntry {
  id: string;
  desc: string;
  cal: number;
  time: string;
}

export interface WaterLog {
  time: string;
  ml: number;
}

export interface BeverageEntry {
  id: string;
  desc: string;
  ml: number;
  cal: number;
  sugar: string; // sugar description, e.g. "无糖", "微糖", "半糖", "全糖"
  time: string;
}

export interface DayLog {
  food: FoodEntry[];
  exercise: ExerciseEntry[];
  waterMl: number;
  waterLogs: WaterLog[];
  weightKg?: number;
  beverages?: BeverageEntry[];
}

export interface GumPhoto {
  image: string; // base64 representation of the photo
  note: string;
}

export interface PresetExercise {
  key: string;
  label: string;
  met: number | null;
}

export interface PresetFood {
  key: string;
  label: string;
  cal: number | null;
}

export interface TodoItem {
  id: string;
  dateStr: string;
  text: string;
  category: "appointment" | "exam" | "general";
  isCompleted: boolean;
  timeStr?: string;
}
