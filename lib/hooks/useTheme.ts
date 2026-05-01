/**
 * useTheme — Convenience hook that returns the active theme tokens.
 * Import this anywhere you need themed colors.
 */
export { useThemeStore } from '@/lib/store/themeStore';
export type { ThemeId, Theme, ThemeTokens } from '@/lib/store/themeStore';

import { useThemeStore } from '@/lib/store/themeStore';
import type { ThemeTokens } from '@/lib/store/themeStore';

export function useTheme(): ThemeTokens {
  return useThemeStore((s) => s.theme.tokens);
}
