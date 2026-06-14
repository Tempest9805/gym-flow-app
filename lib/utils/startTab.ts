export type StartTab = 'index' | 'tree';

/**
 * Normalize a persisted/raw start-tab value to a valid tab route.
 * Defaults to 'index' (the Entrenar tab) for anything unrecognized.
 */
export function resolveStartRoute(raw: string | null | undefined): StartTab {
  return raw === 'tree' ? 'tree' : 'index';
}
