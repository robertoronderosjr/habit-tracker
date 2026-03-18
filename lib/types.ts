export type SessionUser = {
  userId: number;
  email: string;
};

export type SessionData = {
  user?: SessionUser;
};

export type Habit = {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  frequency: "daily" | "weekly";
  color: string;
  created_at: string;
};

export type HabitLog = {
  id: number;
  habit_id: number;
  logged_date: string;
  notes: string | null;
  created_at: string;
};
