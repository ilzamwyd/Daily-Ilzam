export const MICROCOPY = {
  tagline: "Sustainable Ambition — Health × Career × Life",
  greeting: "Welcome back. How is life feeling today?",
  consistencyWin: "70–80% consistency is a win.",
  neverRestart: "Never restart. Just continue.",
  roughDay: "One rough day doesn't erase your progress.",
  smallProgress: "Small progress still counts.",
  restIsPlan: "Rest is part of the plan.",
  imperfectWeek: "Your week doesn't need to be perfect to be successful.",
  restIsSystem: "Rest is part of the system.",
  recoveryNotWasted: "Recovery is not wasted time.",
  emptyStory: "Your story starts here. Complete your first check-in.",
  emptyChart: "A few more days of check-ins will help reveal your patterns.",
};

export const NAV_ITEMS = [
  { href: "/overview", label: "Overview", icon: "LayoutDashboard" },
  { href: "/checkin", label: "Daily Check-In", icon: "CheckCircle2" },
  { href: "/health", label: "Health", icon: "HeartPulse" },
  { href: "/mind", label: "Mind", icon: "Brain" },
  { href: "/life", label: "Life", icon: "Users" },
  { href: "/growth", label: "Growth", icon: "Sprout" },
  { href: "/work", label: "Work", icon: "Briefcase" },
  { href: "/business", label: "Business", icon: "Store" },
  { href: "/finance", label: "Finance", icon: "Wallet" },
  { href: "/mom", label: "MoM", icon: "Mic" },
  { href: "/todo", label: "To-Do", icon: "ListChecks" },
  { href: "/monthly-plan", label: "Monthly Plan", icon: "CalendarCheck" },
  { href: "/reflection", label: "Reflection", icon: "NotebookPen" },
  { href: "/settings", label: "Settings", icon: "Settings" },
] as const;

// Bottom nav on mobile shows a curated subset; "More" opens a full drawer with every page.
export const BOTTOM_NAV_ITEMS = [
  { href: "/overview", label: "Home", icon: "LayoutDashboard" },
  { href: "/checkin", label: "Check-In", icon: "CheckCircle2" },
  { href: "/finance", label: "Finance", icon: "Wallet" },
  { href: "/todo", label: "To-Do", icon: "ListChecks" },
  { href: "__more__", label: "More", icon: "Menu" },
] as const;

export const EXERCISE_TYPES = ["gym", "badminton", "running", "walking", "other"] as const;
export const SOCIAL_TYPES = ["friends", "coworkers", "sport", "community", "family", "other"] as const;
export const RECOVERY_TYPES = [
  "nothing",
  "music",
  "movie",
  "gaming",
  "walking",
  "coffee",
  "sleep",
  "socializing",
  "other",
] as const;

export const BALANCE_SCORE_BANDS = [
  { min: 0, max: 59, label: "Needs Attention", color: "#b91c1c" },
  { min: 60, max: 69, label: "Building", color: "#fb923c" },
  { min: 70, max: 80, label: "On Track", color: "#10b981" },
  { min: 81, max: 90, label: "Strong", color: "#3b82f6" },
  { min: 91, max: 100, label: "Excellent", color: "#a855f7" },
] as const;

export function getBalanceBand(score: number) {
  return (
    BALANCE_SCORE_BANDS.find((b) => score >= b.min && score <= b.max) ??
    BALANCE_SCORE_BANDS[0]
  );
}
