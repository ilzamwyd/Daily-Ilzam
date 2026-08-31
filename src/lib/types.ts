export type ExerciseType = "gym" | "badminton" | "running" | "walking" | "other";
export type StressEatingLevel = "no" | "small" | "significant";
export type SocialType = "friends" | "coworkers" | "sport" | "community" | "family" | "other";
export type RecoveryType =
  | "nothing"
  | "music"
  | "movie"
  | "gaming"
  | "walking"
  | "coffee"
  | "sleep"
  | "socializing"
  | "other";

export interface DailyLog {
  id?: string;
  user_id?: string;
  date: string; // YYYY-MM-DD
  weight: number | null;
  waist: number | null;
  sleep_hours: number | null;
  steps: number | null;

  gym: boolean;
  pt_session: boolean;
  exercise_type: ExerciseType | null;
  exercise_duration: number | null;

  healthygo: boolean;
  other_meals_controlled: boolean;
  stress_eating: StressEatingLevel;
  stress_eating_trigger: string | null;

  prayers_completed: number; // 0-5

  mood: number | null; // 1-10
  stress: number | null; // 1-10
  energy: number | null; // 1-10
  mind_note: string | null;

  family_contact: boolean;
  family_call: boolean;
  social_activity: boolean;
  social_type: SocialType | null;

  english_practice: boolean;
  english_duration: number | null;
  content_worked: boolean;
  content_published: boolean;

  work_finish_time: string | null; // HH:mm
  worked_after_9: boolean;
  main_role_workload: number | null; // 1-10
  data_role_workload: number | null; // 1-10
  work_pressure_note: string | null;

  recovery: boolean;
  recovery_minutes: number | null;
  recovery_type: RecoveryType | null;

  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserTargets {
  user_id?: string;
  starting_weight: number | null;
  step_target: number;
  gym_weekly_target: number;
  sleep_target_min: number;
  sleep_target_max: number;
  english_weekly_target: number;
  content_weekly_target: number;
  social_weekly_target: number;
  family_contact_weekly_target: number;
  preferred_finish_time: string;
  hard_stop_time: string;
  recovery_daily_min_minutes: number;
  recovery_daily_max_minutes: number;
  calorie_min: number | null;
  calorie_max: number | null;
}

export interface WeeklyReview {
  id?: string;
  user_id?: string;
  week_start: string;
  went_well: string | null;
  drained_me: string | null;
  gave_energy: string | null;
  stress_eating_trigger: string | null;
  stop_doing: string | null;
  grateful_for: string | null;
  one_priority: string | null;
  created_at?: string;
}

export interface ContentProgressItem {
  id?: string;
  user_id?: string;
  title: string;
  stage: "idea" | "started" | "editing" | "published";
  account: string | null;
  result_notes: string | null;
  next_action: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EnglishSession {
  id?: string;
  user_id?: string;
  date: string;
  aspect: "Listening" | "Reading" | "Speaking" | "Writing" | "Grammar" | "Vocabulary" | "Evaluation";
  duration_minutes: number | null;
  notes: string | null;
  created_at?: string;
}

export interface EnglishGoal {
  id?: string;
  user_id?: string;
  target_date: string; // YYYY-MM-DD
  level_label: string;
  achieved: boolean;
}

export interface EnglishVocab {
  id?: string;
  user_id?: string;
  word: string;
  note: string | null;
  date?: string;
  created_at?: string;
}

export interface MonthlyPriority {
  id?: string;
  user_id?: string;
  month: string; // YYYY-MM-01
  priority_text: string;
  done: boolean;
}

export interface MonthlyReflection {
  id?: string;
  user_id?: string;
  month: string;
  entry_text: string | null;
  ai_reflection: string | null;
  updated_at?: string;
}

export interface BusinessChecklistItem {
  id?: string;
  user_id?: string;
  item_text: string;
  done: boolean;
}

export interface BusinessSale {
  id?: string;
  user_id?: string;
  date: string;
  revenue: number;
  cost: number;
  note: string | null;
}

export interface CareerReview {
  id?: string;
  user_id?: string;
  week_start: string;
  role: "main" | "expanded";
  workload: number | null;
  enjoyment: number | null;
  learning: number | null;
  impact: number | null;
  stress: number | null;
  created_at?: string;
}

export type TransactionType = "income" | "expense";

export interface Transaction {
  id?: string;
  user_id?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: TransactionType;
  amount: number;
  source: string; // Cash, Mandiri, BRI, BNI, BCA, ...
  code: string; // group: Foodies, Transportation, Accomodation, Shopping, Others, Income
  category: string; // subcategory, or income category when type = income
  note: string | null;
  created_at?: string;
}

export interface MonthlyBudget {
  id?: string;
  user_id?: string;
  month: string; // YYYY-MM-01
  type: TransactionType;
  code: string;
  category: string;
  budgeted_amount: number;
}

export interface Meeting {
  id?: string;
  user_id?: string;
  title: string;
  meeting_date: string; // YYYY-MM-DD
  role_context: "Main Role" | "Expanded Role" | "Other" | null;
  raw_notes: string | null;
  summary: string | null;
  created_at?: string;
}

export type ActionItemStatus = "todo" | "done";

export interface ActionItem {
  id?: string;
  user_id?: string;
  meeting_id?: string | null;
  description: string;
  assignee: string | null;
  deadline: string | null; // YYYY-MM-DD
  category?: string | null;
  status: ActionItemStatus;
  created_at?: string;
}

export interface FoodLibraryItem {
  id?: string;
  user_id?: string;
  name: string;
  calories: number;
  serving_label: string;
  source: "manual" | "ai_estimate";
  created_at?: string;
}

export interface FoodLogEntry {
  id?: string;
  user_id?: string;
  date: string;
  food_name: string;
  calories_per_serving: number;
  servings: number;
  total_calories: number;
  food_library_id?: string | null;
  meal_slot?: "breakfast" | "lunch" | "snack" | "dinner" | null;
  created_at?: string;
}

export interface WorkoutLogEntry {
  id?: string;
  user_id?: string;
  date: string;
  exercise_name: string;
  duration_minutes: number | null;
  created_at?: string;
}

export interface WaterLogEntry {
  id?: string;
  user_id?: string;
  date: string;
  amount_ml: number;
  logged_at?: string;
}

export const DEFAULT_TARGETS: UserTargets = {
  starting_weight: null,
  step_target: 7000,
  gym_weekly_target: 3,
  sleep_target_min: 7,
  sleep_target_max: 8,
  english_weekly_target: 3,
  content_weekly_target: 1,
  social_weekly_target: 1,
  family_contact_weekly_target: 2.5,
  preferred_finish_time: "18:30",
  hard_stop_time: "21:00",
  recovery_daily_min_minutes: 30,
  recovery_daily_max_minutes: 60,
  calorie_min: null,
  calorie_max: null,
};

export function emptyDailyLog(date: string): DailyLog {
  return {
    date,
    weight: null,
    waist: null,
    sleep_hours: null,
    steps: null,
    gym: false,
    pt_session: false,
    exercise_type: null,
    exercise_duration: null,
    healthygo: false,
    other_meals_controlled: false,
    stress_eating: "no",
    stress_eating_trigger: null,
    prayers_completed: 0,
    mood: null,
    stress: null,
    energy: null,
    mind_note: null,
    family_contact: false,
    family_call: false,
    social_activity: false,
    social_type: null,
    english_practice: false,
    english_duration: null,
    content_worked: false,
    content_published: false,
    work_finish_time: null,
    worked_after_9: false,
    main_role_workload: null,
    data_role_workload: null,
    work_pressure_note: null,
    recovery: false,
    recovery_minutes: null,
    recovery_type: null,
    notes: null,
  };
}
