import { videoUrlFor, youtubeSearchUrl } from '../video';
import type { Exercise } from '../types';

const exercise = (over: Partial<Exercise> = {}): Exercise => ({
  id: 'peck-deck',
  nameEs: 'Peck deck',
  nameEn: 'Pec Deck',
  muscleGroup: 'pectorals',
  videoUrl: null,
  description: null,
  tips: null,
  commonMistakes: null,
  ...over,
});

describe('youtubeSearchUrl', () => {
  it('builds a search for how to do the exercise, in Spanish', () => {
    expect(youtubeSearchUrl('Peck deck')).toBe(
      'https://www.youtube.com/results?search_query=como%20hacer%20Peck%20deck',
    );
  });

  it('escapes characters that would break the query', () => {
    expect(youtubeSearchUrl('Curl 21s & press')).toContain('Curl%2021s%20%26%20press');
  });
});

describe('videoUrlFor', () => {
  it('prefers the pinned link', () => {
    expect(videoUrlFor(exercise({ videoUrl: 'https://youtu.be/abc123' }))).toBe('https://youtu.be/abc123');
  });

  it('falls back to a YouTube search when nothing is pinned', () => {
    expect(videoUrlFor(exercise())).toBe(youtubeSearchUrl('Peck deck'));
  });

  it('treats a blank pinned link as absent', () => {
    expect(videoUrlFor(exercise({ videoUrl: '   ' }))).toBe(youtubeSearchUrl('Peck deck'));
  });
});
