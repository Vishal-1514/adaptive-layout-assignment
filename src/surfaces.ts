/**
 * surfaces.ts
 *
 * Surface profile definitions with physical and ergonomic constraints:
 * - Dimensional limits (width, height)
 * - Safe areas (insets for notches, bezels, broadcast overscan)
 * - Ergonomic constraints (minTapTarget for touch, minTextSize for far viewing distance)
 */

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type ViewingDistance = 'near' | 'medium' | 'far';

export interface SurfaceProfile {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  safeArea?: Partial<SafeAreaInsets>;
  /** Minimum target dimension in pixels for touch interactions (e.g. 44px on iOS, 60px on kiosk) */
  minTapTarget?: number;
  /** Minimum legible font size in pixels (e.g. 32px for 10-foot TV viewing) */
  minTextSize?: number;
  /** Viewing context: affects typography scale and spacing density */
  viewingDistance?: ViewingDistance;
  /** When true, layout must prioritize large touch hitboxes and spacious controls */
  touchOnly?: boolean;
}

export const standardSurfaces: Record<string, SurfaceProfile> = {
  mobileInterstitial: {
    id: 'mobile-interstitial',
    name: 'Mobile Interstitial (Portrait)',
    description: 'Tall mobile phone screen (320x480). High touch priority.',
    width: 320,
    height: 480,
    safeArea: { top: 24, right: 16, bottom: 24, left: 16 },
    minTapTarget: 44,
    viewingDistance: 'near',
    touchOnly: true,
  },

  mobileLandscape: {
    id: 'mobile-landscape',
    name: 'Mobile Landscape',
    description: 'Wide handheld orientation (640x360). 16:9 aspect ratio.',
    width: 640,
    height: 360,
    safeArea: { top: 12, right: 32, bottom: 16, left: 32 },
    minTapTarget: 44,
    viewingDistance: 'near',
    touchOnly: true,
  },

  broadcastLowerThird: {
    id: 'broadcast-lower-third',
    name: 'Broadcast Lower-Third',
    description: 'Ultra-wide TV overlay (1920x250). Far viewing distance, requires min 32px font.',
    width: 1920,
    height: 250,
    safeArea: { top: 16, right: 80, bottom: 20, left: 80 },
    minTextSize: 32,
    viewingDistance: 'far',
    touchOnly: false,
  },

  retailKiosk: {
    id: 'retail-kiosk',
    name: 'Retail Kiosk (Square)',
    description: 'Large public touchscreen (1080x1080). Extra-large 60px tap targets.',
    width: 1080,
    height: 1080,
    safeArea: { top: 48, right: 48, bottom: 48, left: 48 },
    minTapTarget: 60,
    viewingDistance: 'medium',
    touchOnly: true,
  },

  crampedStressTest: {
    id: 'cramped-stress-test',
    name: 'Cramped Banner (Stress Test)',
    description: 'Intentionally constrained space (320x180). Demonstrates priority-based degradation.',
    width: 320,
    height: 180,
    safeArea: { top: 8, right: 8, bottom: 8, left: 8 },
    minTapTarget: 40,
    viewingDistance: 'near',
    touchOnly: true,
  },
};

/**
 * Creates and validates a dynamic surface profile.
 * Used for live interactive slider testing and unseen 5th surfaces in interviews.
 */
export function createCustomSurface(params: {
  width: number;
  height: number;
  minTapTarget?: number;
  minTextSize?: number;
  viewingDistance?: ViewingDistance;
  touchOnly?: boolean;
  safeArea?: Partial<SafeAreaInsets>;
}): SurfaceProfile {
  if (params.width <= 0 || params.height <= 0) {
    throw new Error(`Invalid surface dimensions: ${params.width}x${params.height}. Both must be > 0.`);
  }

  return {
    id: `custom-${params.width}x${params.height}`,
    name: `Custom Surface (${params.width}x${params.height})`,
    description: `Dynamic surface created at runtime with aspect ratio ${(params.width / params.height).toFixed(2)}.`,
    width: Math.round(params.width),
    height: Math.round(params.height),
    minTapTarget: params.minTapTarget,
    minTextSize: params.minTextSize,
    viewingDistance: params.viewingDistance ?? 'near',
    touchOnly: params.touchOnly ?? false,
    safeArea: params.safeArea ?? { top: 12, right: 12, bottom: 12, left: 12 },
  };
}