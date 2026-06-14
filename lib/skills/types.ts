export type NodeStatus = 'locked' | 'available' | 'in_progress' | 'mastered';

export interface Best {
  reps: number | null;
  seconds: number | null;
}

export interface ProgressionNode {
  exercise_id: string;
  path: string;
  level: number;
  unlock_reps: number | null;
  unlock_hold_seconds: number | null;
  prerequisite_exercise_id: string | null;
}

export interface ReadinessRequirement {
  exercise_id: string;
  target_reps?: number | null;
  target_seconds?: number | null;
}
