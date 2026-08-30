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
  created_at?: string;
  updated_at?: string;
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
