import type { ExerciseProgression, UserSkillProgress, NodeStatus } from '@/lib/api/schemas';

export const BRANCH_ORDER = ['push', 'pull', 'core', 'legs', 'skill'] as const;
export type Branch = (typeof BRANCH_ORDER)[number];

export interface TreeNode {
  exercise_id: string;
  level: number;
  tier: ExerciseProgression['tier'];
  status: NodeStatus;
}

export interface BranchSection {
  path: Branch;
  nodes: TreeNode[];
}

/** Group progressions into branch sections (canonical order, sorted by level), applying per-user status. */
export function buildBranchSections(
  progressions: ExerciseProgression[],
  skillProgress: UserSkillProgress[],
): BranchSection[] {
  const statusById = new Map(skillProgress.map((s) => [s.exercise_id, s.status]));
  return BRANCH_ORDER.map((path) => ({
    path,
    nodes: progressions
      .filter((p) => p.path === path)
      .sort((a, b) => a.level - b.level)
      .map((p) => ({
        exercise_id: p.exercise_id,
        level: p.level,
        tier: p.tier,
        status: statusById.get(p.exercise_id) ?? ('locked' as NodeStatus),
      })),
  })).filter((s) => s.nodes.length > 0);
}

/** mastered-node count per branch (the per-branch "level"). */
export function branchMasteredCounts(
  progressions: ExerciseProgression[],
  skillProgress: UserSkillProgress[],
): Record<Branch, number> {
  const mastered = new Set(
    skillProgress.filter((s) => s.status === 'mastered').map((s) => s.exercise_id),
  );
  const counts = Object.fromEntries(BRANCH_ORDER.map((b) => [b, 0])) as Record<Branch, number>;
  for (const p of progressions) {
    if (mastered.has(p.exercise_id) && (BRANCH_ORDER as readonly string[]).includes(p.path)) {
      counts[p.path as Branch] += 1;
    }
  }
  return counts;
}

/** Total mastered nodes (feeds the avatar stage). */
export function globalMasteredCount(skillProgress: UserSkillProgress[]): number {
  return skillProgress.filter((s) => s.status === 'mastered').length;
}
