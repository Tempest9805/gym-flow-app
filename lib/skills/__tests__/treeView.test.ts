import {
  BRANCH_ORDER,
  buildBranchSections,
  branchMasteredCounts,
  globalMasteredCount,
} from '@/lib/skills/treeView';
import type { ExerciseProgression, UserSkillProgress } from '@/lib/api/schemas';

const prog = (
  exercise_id: string,
  path: string,
  level: number,
  tier: 'beginner' | 'intermediate' | 'advanced',
): ExerciseProgression =>
  ({
    id: `prog-${exercise_id}`,
    path,
    exercise_id,
    level,
    tier,
    unlock_reps: null,
    unlock_hold_seconds: null,
    prerequisite_exercise_id: null,
    equipment: null,
    created_at: '2026-06-14T00:00:00.000Z',
  }) as ExerciseProgression;

const sp = (exercise_id: string, status: UserSkillProgress['status']): UserSkillProgress =>
  ({
    id: `sp-${exercise_id}`,
    user_id: 'u1',
    exercise_id,
    status,
    best_reps: null,
    best_hold_seconds: null,
    mastered_at: null,
    created_at: '2026-06-14T00:00:00.000Z',
  }) as UserSkillProgress;

describe('buildBranchSections', () => {
  it('groups by branch in canonical order and sorts nodes by level', () => {
    const progressions = [
      prog('a', 'core', 2, 'beginner'),
      prog('b', 'push', 1, 'beginner'),
      prog('c', 'core', 1, 'beginner'),
    ];
    const sections = buildBranchSections(progressions, []);
    expect(sections.map((s) => s.path)).toEqual(['push', 'core']);
    expect(sections[1].nodes.map((n) => n.exercise_id)).toEqual(['c', 'a']);
  });

  it('defaults missing progress to locked and applies known status', () => {
    const sections = buildBranchSections([prog('b', 'push', 1, 'beginner')], [sp('b', 'mastered')]);
    expect(sections[0].nodes[0].status).toBe('mastered');
    const locked = buildBranchSections([prog('x', 'push', 1, 'beginner')], []);
    expect(locked[0].nodes[0].status).toBe('locked');
  });
});

describe('branchMasteredCounts', () => {
  it('counts mastered nodes per branch', () => {
    const progressions = [
      prog('b', 'push', 1, 'beginner'),
      prog('d', 'push', 2, 'beginner'),
      prog('c', 'core', 1, 'beginner'),
    ];
    const counts = branchMasteredCounts(progressions, [sp('b', 'mastered'), sp('c', 'mastered')]);
    expect(counts.push).toBe(1);
    expect(counts.core).toBe(1);
    expect(counts.legs).toBe(0);
  });
});

describe('globalMasteredCount', () => {
  it('counts all mastered rows', () => {
    expect(globalMasteredCount([sp('b', 'mastered'), sp('c', 'available'), sp('d', 'mastered')])).toBe(2);
  });
});
