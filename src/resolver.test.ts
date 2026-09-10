/**
 * resolver.test.ts
 *
 * Automated test suite for the Adaptive Layout Engine:
 * - Verifies mathematical constraint resolution
 * - Confirms deterministic priority degradation
 * - Proves boundary containment (no clippings)
 * - Verifies no overlaps between resolved elements
 * - Tests arbitrary 5th surface live adaptability
 */

import { describe, it, expect } from 'vitest';
import { defaultAdSpec } from './spec';
import { standardSurfaces, createCustomSurface } from './surfaces';
import { resolveLayout, deriveStrategy } from './resolver';

describe('Layout Engine Strategy Derivation', () => {
  it('correctly maps ultra-wide aspect ratios (AR >= 2.2) to horizontal-strip', () => {
    expect(deriveStrategy(1920, 250)).toBe('horizontal-strip');
    expect(deriveStrategy(1200, 300)).toBe('horizontal-strip');
  });

  it('correctly maps tall aspect ratios (AR <= 0.85) to vertical-stack', () => {
    expect(deriveStrategy(320, 480)).toBe('vertical-stack');
    expect(deriveStrategy(375, 812)).toBe('vertical-stack');
  });

  it('correctly maps intermediate/square aspect ratios to split-panel', () => {
    expect(deriveStrategy(1080, 1080)).toBe('split-panel');
    expect(deriveStrategy(1024, 768)).toBe('split-panel');
  });
});

describe('Surface Constraint Enforcement', () => {
  it('enforces minTapTarget on touch devices for CTA buttons', () => {
    const mobileLayout = resolveLayout(defaultAdSpec, standardSurfaces.mobileInterstitial);
    const cta = mobileLayout.elements.find(e => e.id === 'cta');
    expect(cta).toBeDefined();
    expect(cta?.height).toBeGreaterThanOrEqual(standardSurfaces.mobileInterstitial.minTapTarget!);

    const kioskLayout = resolveLayout(defaultAdSpec, standardSurfaces.retailKiosk);
    const kioskCta = kioskLayout.elements.find(e => e.id === 'cta');
    expect(kioskCta).toBeDefined();
    expect(kioskCta?.height).toBeGreaterThanOrEqual(standardSurfaces.retailKiosk.minTapTarget!);
  });

  it('enforces minTextSize on broadcast lower-third surfaces', () => {
    const broadcastLayout = resolveLayout(defaultAdSpec, standardSurfaces.broadcastLowerThird);
    const headline = broadcastLayout.elements.find(e => e.id === 'headline');
    expect(headline).toBeDefined();
    expect(headline?.fontSize).toBeGreaterThanOrEqual(standardSurfaces.broadcastLowerThird.minTextSize!);
  });
});

describe('Priority-Based Degradation Logic', () => {
  it('drops lowest-priority branding (priority 3) first in cramped spaces while keeping priority 1 intact', () => {
    const crampedLayout = resolveLayout(defaultAdSpec, standardSurfaces.crampedStressTest);

    const logo = crampedLayout.elements.find(e => e.id === 'logo');
    const headline = crampedLayout.elements.find(e => e.id === 'headline');
    const cta = crampedLayout.elements.find(e => e.id === 'cta');

    // Logo (Priority 3) must be dropped
    expect(logo?.visible).toBe(false);
    expect(crampedLayout.diagnostics.droppedElements.some(d => d.id === 'logo')).toBe(true);

    // Headline (Priority 1) and CTA (Priority 2) must remain visible
    expect(headline?.visible).toBe(true);
    expect(cta?.visible).toBe(true);
  });
});

describe('Boundary Containment & Overlap Prevention', () => {
  const surfacesToTest = Object.values(standardSurfaces);

  for (const surface of surfacesToTest) {
    it(`guarantees all visible elements stay within bounds on ${surface.name}`, () => {
      const layout = resolveLayout(defaultAdSpec, surface);
      const visible = layout.elements.filter(e => e.visible);

      for (const el of visible) {
        expect(el.x).toBeGreaterThanOrEqual(0);
        expect(el.y).toBeGreaterThanOrEqual(0);
        expect(el.x + el.width).toBeLessThanOrEqual(surface.width);
        expect(el.y + el.height).toBeLessThanOrEqual(surface.height);
      }
    });

    it(`guarantees no overlapping bounding boxes on ${surface.name}`, () => {
      const layout = resolveLayout(defaultAdSpec, surface);
      const visible = layout.elements.filter(e => e.visible);

      // Check pairwise overlap
      for (let i = 0; i < visible.length; i++) {
        for (let j = i + 1; j < visible.length; j++) {
          const a = visible[i];
          const b = visible[j];

          const noOverlapX = a.x + a.width <= b.x || b.x + b.width <= a.x;
          const noOverlapY = a.y + a.height <= b.y || b.y + b.height <= a.y;

          expect(
            noOverlapX || noOverlapY,
            `Collision detected between "${a.id}" and "${b.id}" on surface "${surface.name}"`
          ).toBe(true);
        }
      }
    });
  }
});

describe('Arbitrary 5th Surface (Live Interview Proof)', () => {
  it('resolves cleanly without hardcoded lookups on a brand new surface dimension', () => {
    // Arbitrary size never seen before
    const surpriseSurface = createCustomSurface({
      width: 1440,
      height: 400,
      minTapTarget: 50,
      minTextSize: 22,
      viewingDistance: 'medium',
    });

    const layout = resolveLayout(defaultAdSpec, surpriseSurface);

    expect(layout.elements.length).toBeGreaterThan(0);
    const visible = layout.elements.filter(e => e.visible);
    expect(visible.length).toBeGreaterThanOrEqual(3);

    for (const el of visible) {
      expect(el.x + el.width).toBeLessThanOrEqual(surpriseSurface.width);
      expect(el.y + el.height).toBeLessThanOrEqual(surpriseSurface.height);
    }
  });
});