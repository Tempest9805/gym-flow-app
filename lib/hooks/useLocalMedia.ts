/**
 * useLocalMedia — resolves the best available local image for an exercise.
 *
 * Quality tiers (highest → lowest):
 *   1. hires   WebP  (assets/exercises/hires/<slug>.webp)       → detail/zoom
 *   2. normalized WebP (assets/exercises/normalized/<slug>.webp) → lists/cards
 *   3. original PNG  (assets/Excercices/<Name>.png)              → last resort
 *   4. demonstration_url (remote Supabase CDN)                   → remote fallback
 *   5. null                                                       → placeholder
 *
 * The hook returns:
 *   listSource   — optimized WebP for card/list display
 *   detailSource — highest-quality for detail view
 *   zoomSource   — highest-quality for fullscreen zoom (same as detail by default)
 *
 * NOTE: Local WebP files are referenced via require() — they are bundled by Metro
 * and load instantly with zero network requests.
 *
 * Because Metro cannot resolve truly dynamic require() paths, this hook keeps a
 * static map of all normalized assets.  Run `node scripts/generate-media-index.js`
 * after adding new WebP files to regenerate the map.
 */

import { useMemo } from 'react';
import { THUMB_MAP, NORMALIZED_MAP, HIRES_MAP } from '@/lib/utils/mediaMap';

export interface MediaSources {
  /** Smallest WebP for list/card (very fast) */
  thumbSource: { uri: string } | number | null;
  /** Normalized WebP for detail hero */
  detailSource: { uri: string } | number | null;
  /** Highest-quality for fullscreen zoom */
  zoomSource: { uri: string } | number | null;
  /** Which tier is being used: 'local-webp' | 'remote' | 'none' */
  tier: 'local-webp' | 'remote' | 'none';
}

export function useLocalMedia(
  slug: string | null | undefined,
  demonstrationUrl: string | null | undefined,
): MediaSources {
  return useMemo(() => {
    const empty: MediaSources = {
      thumbSource: null,
      detailSource: null,
      zoomSource: null,
      tier: 'none',
    };

    if (!slug) {
      // No slug → fall back to remote or nothing
      if (demonstrationUrl) {
        const remote = { uri: demonstrationUrl };
        return { thumbSource: remote, detailSource: remote, zoomSource: remote, tier: 'remote' };
      }
      return empty;
    }

    const normAsset = NORMALIZED_MAP[slug];
    if (normAsset) {
      // If normalized exists, try to get thumb and hires, otherwise fallback to normalized
      return {
        thumbSource:  THUMB_MAP[slug] ?? normAsset,
        detailSource: normAsset,
        zoomSource:   HIRES_MAP[slug] ?? normAsset,
        tier: 'local-webp',
      };
    }

    // No local asset → remote CDN
    if (demonstrationUrl) {
      const remote = { uri: demonstrationUrl };
      return { thumbSource: remote, detailSource: remote, zoomSource: remote, tier: 'remote' };
    }

    return empty;
  }, [slug, demonstrationUrl]);
}
