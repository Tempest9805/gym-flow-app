/**
 * Every exercise opens a video. A pinned link wins; otherwise we hand the
 * user a YouTube search, which always resolves and never rots.
 */
import type { Exercise } from './types';

/** A YouTube search for how to perform the movement. */
export function youtubeSearchUrl(exerciseName: string): string {
  const query = encodeURIComponent(`como hacer ${exerciseName}`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

/** The URL the ▶ button should open for this exercise. */
export function videoUrlFor(exercise: Exercise): string {
  const pinned = exercise.videoUrl?.trim();
  if (pinned) return pinned;
  return youtubeSearchUrl(exercise.nameEs);
}
