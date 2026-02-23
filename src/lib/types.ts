export type UUID = string;

export type SetEntry = {
  id: UUID;
  reps: number;
  weightKg: number;
  rpe?: number;        // 1-10
  vbtMs?: number;      // velocity in m/s (optional)
  note?: string;
  completed?: boolean;
};

export type ExerciseEntry = {
  id: UUID;
  name: string;
  category?: string;   // e.g., Lower, Upper, Accessories
  sets: SetEntry[];
  note?: string;
};

export type Session = {
  id: UUID;
  name: string;        // e.g., "Lower A - Strength"
  dateISO: string;     // YYYY-MM-DD
  exercises: ExerciseEntry[];
  tags?: string[];
  note?: string;
  createdAt: number;
  updatedAt: number;
};

export type AppSettings = {
  units: "kg";
};
