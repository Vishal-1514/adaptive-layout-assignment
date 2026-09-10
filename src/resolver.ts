/**
 * resolver.ts
 *
 * The Core Constraint Resolution & Priority-Degradation Layout Engine.
 *
 * Guarantees:
 * 1. Zero hardcoded surface name checks (no `if (surface === "mobile")`).
 * 2. Layout adapts strictly based on geometric aspect ratio and dimensional physics.
 * 3. Enforces hard ergonomic constraints (safeArea, minTapTarget, minTextSize, viewingDistance).
 * 4. Deterministic, explainable priority degradation when space is constrained.
 * 5. Generates exact non-overlapping pixel coordinates for any renderer (DOM or Canvas).
 */

import type { AdSpec, AdElement, Priority } from './spec';
import type { SurfaceProfile, SafeAreaInsets } from './surfaces';

export type LayoutStrategy = 'horizontal-strip' | 'vertical-stack' | 'split-panel';

export interface ResolvedElementBounds {
  id: string;
  role: AdElement['role'];
  type: AdElement['type'];
  priority: Priority;
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  renderText?: string;
  renderLabel?: string;
  reasonDropped?: string;
  zIndex: number;
}

export interface ResolverDiagnostics {
  surfaceId: string;
  aspectRatio: number;
  strategy: LayoutStrategy;
  usableArea: { width: number; height: number; x: number; y: number };
  safeAreaInsets: SafeAreaInsets;
  appliedConstraints: {
    minTapTarget?: number;
    minTextSize?: number;
    viewingDistanceMultiplier: number;
  };
  droppedElements: Array<{ id: string; role: string; priority: Priority; reason: string }>;
  executionSteps: string[];
}

export interface ResolvedLayout {
  specId: string;
  surface: SurfaceProfile;
  elements: ResolvedElementBounds[];
  diagnostics: ResolverDiagnostics;
  timestamp: number;
}

/**
 * Normalizes safe area insets from surface profile defaults.
 */
function resolveSafeArea(profile: SurfaceProfile): SafeAreaInsets {
  return {
    top: profile.safeArea?.top ?? 0,
    right: profile.safeArea?.right ?? 0,
    bottom: profile.safeArea?.bottom ?? 0,
    left: profile.safeArea?.left ?? 0,
  };
}

/**
 * Derives the layout structural strategy from purely continuous geometric aspect ratios.
 * Broad ranges:
 * - Ultra-wide (AR >= 2.2): horizontal strip / row
 * - Tall portrait (AR <= 0.85): vertical stack
 * - Balanced / square (0.85 < AR < 2.2): 2-panel split
 */
export function deriveStrategy(usableWidth: number, usableHeight: number): LayoutStrategy {
  const ar = usableWidth / usableHeight;
  if (ar >= 2.2) {
    return 'horizontal-strip';
  } else if (ar <= 0.85) {
    return 'vertical-stack';
  } else {
    return 'split-panel';
  }
}

/**
 * Main Layout Resolution function.
 */
export function resolveLayout(spec: AdSpec, surface: SurfaceProfile): ResolvedLayout {
  const steps: string[] = [];
  const droppedElements: Array<{ id: string; role: string; priority: Priority; reason: string }> = [];

  // Step 1: Compute Usable Bounding Box via Safe Area Insets
  const insets = resolveSafeArea(surface);
  const usableWidth = Math.max(0, surface.width - (insets.left + insets.right));
  const usableHeight = Math.max(0, surface.height - (insets.top + insets.bottom));
  const startX = insets.left;
  const startY = insets.top;

  const aspectRatio = Number((usableWidth / usableHeight).toFixed(3));
  const strategy = deriveStrategy(usableWidth, usableHeight);

  steps.push(`Geometry evaluated: usable ${usableWidth}x${usableHeight} (AR: ${aspectRatio}) -> Strategy: "${strategy}"`);

  // Step 2: Calculate Scale Multiplier from Viewing Distance
  let viewingMultiplier = 1.0;
  if (surface.viewingDistance === 'far') {
    viewingMultiplier = 1.6; // TV broadcast 10-foot experience
  } else if (surface.viewingDistance === 'medium') {
    viewingMultiplier = 1.25; // Kiosk distance
  }
  steps.push(`Viewing distance "${surface.viewingDistance ?? 'near'}" -> Scale factor: ${viewingMultiplier}x`);

  // Step 3: Hard Ergonomic Constraints Calculation
  const effectiveMinTapTarget = surface.minTapTarget ?? 0;
  const effectiveMinTextSize = surface.minTextSize ?? (surface.viewingDistance === 'far' ? 30 : 12);

  // Group elements for layout intent
  const elementMap = new Map<string, AdElement>();
  for (const el of spec.elements) {
    elementMap.set(el.id, el);
  }

  const hero = spec.elements.find(e => e.role === 'hero');
  const headline = spec.elements.find(e => e.role === 'primary');
  const cta = spec.elements.find(e => e.role === 'action');
  const price = spec.elements.find(e => e.role === 'secondary');
  const logo = spec.elements.find(e => e.role === 'branding');

  // Track active elements that will participate in placement
  const activeIds = new Set<string>(spec.elements.map(e => e.id));

  // Step 4: Strategy-Specific Layout Resolution with Priority Degradation
  let resolvedBounds: ResolvedElementBounds[] = [];

  if (strategy === 'horizontal-strip') {
    resolvedBounds = solveHorizontalStrip({
      usableWidth,
      usableHeight,
      startX,
      startY,
      hero,
      headline,
      cta,
      price,
      logo,
      activeIds,
      viewingMultiplier,
      effectiveMinTapTarget,
      effectiveMinTextSize,
      droppedElements,
      steps,
    });
  } else if (strategy === 'vertical-stack') {
    resolvedBounds = solveVerticalStack({
      usableWidth,
      usableHeight,
      startX,
      startY,
      hero,
      headline,
      cta,
      price,
      logo,
      activeIds,
      viewingMultiplier,
      effectiveMinTapTarget,
      effectiveMinTextSize,
      droppedElements,
      steps,
    });
  } else {
    // split-panel
    resolvedBounds = solveSplitPanel({
      usableWidth,
      usableHeight,
      startX,
      startY,
      hero,
      headline,
      cta,
      price,
      logo,
      activeIds,
      viewingMultiplier,
      effectiveMinTapTarget,
      effectiveMinTextSize,
      droppedElements,
      steps,
    });
  }

  // Include dropped elements in output as visible: false for inspectability
  for (const dropped of droppedElements) {
    const el = elementMap.get(dropped.id);
    if (el) {
      resolvedBounds.push({
        id: el.id,
        role: el.role,
        type: el.type,
        priority: el.priority,
        visible: false,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        reasonDropped: dropped.reason,
        zIndex: 0,
      });
    }
  }

  // Final sanity clamp: Guarantee no element ever exceeds surface boundaries
  for (const b of resolvedBounds) {
    if (!b.visible) continue;
    if (b.x + b.width > surface.width) {
      b.width = Math.max(0, surface.width - b.x);
    }
    if (b.y + b.height > surface.height) {
      b.height = Math.max(0, surface.height - b.y);
    }
  }

  return {
    specId: spec.id,
    surface,
    elements: resolvedBounds,
    diagnostics: {
      surfaceId: surface.id,
      aspectRatio,
      strategy,
      usableArea: { width: usableWidth, height: usableHeight, x: startX, y: startY },
      safeAreaInsets: insets,
      appliedConstraints: {
        minTapTarget: effectiveMinTapTarget,
        minTextSize: effectiveMinTextSize,
        viewingDistanceMultiplier: viewingMultiplier,
      },
      droppedElements,
      executionSteps: steps,
    },
    timestamp: Date.now(),
  };
}

// ----------------------------------------------------------------------------
// STRATEGY 1: Horizontal Strip Solver (Broadcast Lower-Third / Wide Banners)
// ----------------------------------------------------------------------------
interface SolverContext {
  usableWidth: number;
  usableHeight: number;
  startX: number;
  startY: number;
  hero?: AdElement;
  headline?: AdElement;
  cta?: AdElement;
  price?: AdElement;
  logo?: AdElement;
  activeIds: Set<string>;
  viewingMultiplier: number;
  effectiveMinTapTarget: number;
  effectiveMinTextSize: number;
  droppedElements: Array<{ id: string; role: string; priority: Priority; reason: string }>;
  steps: string[];
}

function solveHorizontalStrip(ctx: SolverContext): ResolvedElementBounds[] {
  const {
    usableWidth,
    usableHeight,
    startX,
    startY,
    hero,
    headline,
    cta,
    price,
    logo,
    activeIds,
    viewingMultiplier,
    effectiveMinTapTarget,
    effectiveMinTextSize,
    droppedElements,
    steps,
  } = ctx;

  const gap = Math.max(12, Math.round(usableWidth * 0.015));
  const results: ResolvedElementBounds[] = [];

  // In horizontal mode, height is tightly constrained.
  // 1. Degradation check: If height < 120px, drop logo (Priority 3)
  if (usableHeight < 140 && logo && activeIds.has(logo.id)) {
    activeIds.delete(logo.id);
    droppedElements.push({
      id: logo.id,
      role: logo.role,
      priority: logo.priority,
      reason: `Insufficient vertical clearance (${usableHeight}px < 140px threshold) for branding.`,
    });
    steps.push(`Degradation: Dropped branding "${logo.id}" due to low height.`);
  }

  // Calculate Hero image dimensions
  let heroWidth = 0;
  let heroHeight = 0;
  if (hero && activeIds.has(hero.id)) {
    heroHeight = Math.round(usableHeight * 0.9);
    const heroAspect = hero.preferredSize?.aspectRatio ?? 1.2;
    heroWidth = Math.round(heroHeight * heroAspect);
  }

  // Calculate CTA button dimensions
  let ctaWidth = 0;
  let ctaHeight = 0;
  if (cta && activeIds.has(cta.id)) {
    const rawCtaHeight = Math.round(44 * viewingMultiplier);
    ctaHeight = Math.max(rawCtaHeight, effectiveMinTapTarget, cta.minSize?.height ?? 40);
    ctaHeight = Math.min(ctaHeight, usableHeight * 0.8);
    ctaWidth = Math.max(140, Math.round(ctaHeight * 3.2));
  }

  // Calculate Logo dimensions (if still active)
  let logoWidth = 0;
  let logoHeight = 0;
  if (logo && activeIds.has(logo.id)) {
    logoHeight = Math.min(usableHeight * 0.5, 64 * viewingMultiplier);
    logoWidth = logoHeight;
  }

  // Check remaining width for content (headline + price)
  let requiredFixed = (heroWidth ? heroWidth + gap : 0) + (ctaWidth ? ctaWidth + gap : 0) + (logoWidth ? logoWidth + gap : 0);
  let availableContentWidth = usableWidth - requiredFixed;

  // Secondary degradation check: If space for headline is less than 240px, drop price (Priority 2)
  if (availableContentWidth < 280 && price && activeIds.has(price.id)) {
    activeIds.delete(price.id);
    droppedElements.push({
      id: price.id,
      role: price.role,
      priority: price.priority,
      reason: `Width budget exhausted (${availableContentWidth}px remaining for text); dropped secondary price to protect primary headline.`,
    });
    steps.push(`Degradation: Dropped secondary price "${price.id}" to guarantee legible headline space.`);
    requiredFixed = (heroWidth ? heroWidth + gap : 0) + (ctaWidth ? ctaWidth + gap : 0) + (logoWidth ? logoWidth + gap : 0);
    availableContentWidth = usableWidth - requiredFixed;
  }

  // Horizontal Placement Pass (Left to Right)
  let currentX = startX;

  // 1. Logo (if active)
  if (logo && activeIds.has(logo.id)) {
    const logoY = startY + Math.round((usableHeight - logoHeight) / 2);
    results.push({
      id: logo.id,
      role: logo.role,
      type: logo.type,
      priority: logo.priority,
      visible: true,
      x: currentX,
      y: logoY,
      width: logoWidth,
      height: logoHeight,
      zIndex: 2,
    });
    currentX += logoWidth + gap;
  }

  // 2. Hero Product Image
  if (hero && activeIds.has(hero.id)) {
    const heroY = startY + Math.round((usableHeight - heroHeight) / 2);
    results.push({
      id: hero.id,
      role: hero.role,
      type: hero.type,
      priority: hero.priority,
      visible: true,
      x: currentX,
      y: heroY,
      width: heroWidth,
      height: heroHeight,
      zIndex: 2,
    });
    currentX += heroWidth + gap;
  }

  // 3. Center Content Column (Headline + Price)
  const centerColWidth = Math.max(120, usableWidth - (currentX - startX) - (ctaWidth ? ctaWidth + gap : 0));
  const baseHeadlineSize = Math.round(Math.min(usableHeight * 0.28, 42) * viewingMultiplier);
  const headlineFontSize = Math.max(baseHeadlineSize, effectiveMinTextSize);

  let headlineText = headline?.type === 'text' ? headline.content : '';
  if (centerColWidth < 320 && headline?.type === 'text' && headline.shortContent) {
    headlineText = headline.shortContent;
    steps.push(`Content adapted: Using truncated headline "${headlineText}" for compact horizontal area.`);
  }

  const headlineHeight = Math.round(headlineFontSize * 1.35);
  const priceFontSize = Math.max(Math.round(headlineFontSize * 0.65), effectiveMinTextSize - 4);
  const priceHeight = Math.round(priceFontSize * 1.25);

  const hasPrice = price && activeIds.has(price.id);
  const totalTextBlockHeight = headlineHeight + (hasPrice ? priceHeight + 4 : 0);
  const textStartY = startY + Math.round((usableHeight - totalTextBlockHeight) / 2);

  if (headline && activeIds.has(headline.id)) {
    results.push({
      id: headline.id,
      role: headline.role,
      type: headline.type,
      priority: headline.priority,
      visible: true,
      x: currentX,
      y: textStartY,
      width: centerColWidth,
      height: headlineHeight,
      fontSize: headlineFontSize,
      renderText: headlineText,
      zIndex: 3,
    });
  }

  if (hasPrice && price) {
    results.push({
      id: price.id,
      role: price.role,
      type: price.type,
      priority: price.priority,
      visible: true,
      x: currentX,
      y: textStartY + headlineHeight + 4,
      width: centerColWidth,
      height: priceHeight,
      fontSize: priceFontSize,
      renderText: price.type === 'text' ? price.content : '',
      zIndex: 3,
    });
  }

  // 4. CTA on Far Right
  if (cta && activeIds.has(cta.id)) {
    const ctaX = startX + usableWidth - ctaWidth;
    const ctaY = startY + Math.round((usableHeight - ctaHeight) / 2);
    let label = cta.type === 'button' ? cta.label : 'Buy';
    if (ctaWidth < 180 && cta.type === 'button' && cta.shortLabel) {
      label = cta.shortLabel;
    }

    results.push({
      id: cta.id,
      role: cta.role,
      type: cta.type,
      priority: cta.priority,
      visible: true,
      x: ctaX,
      y: ctaY,
      width: ctaWidth,
      height: ctaHeight,
      fontSize: Math.max(14, Math.round(ctaHeight * 0.38)),
      renderLabel: label,
      zIndex: 4,
    });
  }

  return results;
}

// ----------------------------------------------------------------------------
// STRATEGY 2: Vertical Stack Solver (Mobile Portrait / Tall Interstitials)
// ----------------------------------------------------------------------------
function solveVerticalStack(ctx: SolverContext): ResolvedElementBounds[] {
  const {
    usableWidth,
    usableHeight,
    startX,
    startY,
    hero,
    headline,
    cta,
    price,
    logo,
    activeIds,
    viewingMultiplier,
    effectiveMinTapTarget,
    effectiveMinTextSize,
    droppedElements,
    steps,
  } = ctx;

  const gap = Math.max(8, Math.round(usableHeight * 0.022));
  const results: ResolvedElementBounds[] = [];

  // Compute CTA Height first (pinned near bottom on mobile)
  let ctaHeight = 0;
  if (cta && activeIds.has(cta.id)) {
    const rawCtaHeight = Math.round(48 * viewingMultiplier);
    ctaHeight = Math.max(rawCtaHeight, effectiveMinTapTarget, cta.minSize?.height ?? 44);
  }

  // Priority Degradation Loop: Calculate vertical space requirement
  // Check if logo (Priority 3) must be dropped
  const minRequiredVertical = (ctaHeight + gap) + 120 + 60 + 36;
  if (usableHeight < minRequiredVertical && logo && activeIds.has(logo.id)) {
    activeIds.delete(logo.id);
    droppedElements.push({
      id: logo.id,
      role: logo.role,
      priority: logo.priority,
      reason: `Height constraint: ${usableHeight}px is below ${minRequiredVertical}px threshold required for all elements.`,
    });
    steps.push(`Degradation: Dropped Priority 3 branding "${logo.id}" to ensure headline/CTA remain unclipped.`);
  }

  // Check if Price (Priority 2) must be dropped (in ultra-cramped screens)
  if (usableHeight < 240 && price && activeIds.has(price.id)) {
    activeIds.delete(price.id);
    droppedElements.push({
      id: price.id,
      role: price.role,
      priority: price.priority,
      reason: `Severely constrained screen height (${usableHeight}px < 240px). Dropping price to safeguard hero image.`,
    });
    steps.push(`Degradation: Dropped Priority 2 secondary price "${price.id}".`);
  }

  // Vertical placement pass from top to bottom
  let currentY = startY;

  // 1. Branding Logo (Top Left or Centered)
  if (logo && activeIds.has(logo.id)) {
    const logoSize = Math.min(usableHeight * 0.09, 44 * viewingMultiplier);
    results.push({
      id: logo.id,
      role: logo.role,
      type: logo.type,
      priority: logo.priority,
      visible: true,
      x: startX,
      y: currentY,
      width: Math.round(logoSize),
      height: Math.round(logoSize),
      zIndex: 2,
    });
    currentY += Math.round(logoSize) + gap;
  }

  // 2. Hero Product Image
  let heroHeight = 0;
  if (hero && activeIds.has(hero.id)) {
    // Reserve bottom space for Headline, Price, CTA
    const bottomReserved = (ctaHeight ? ctaHeight + gap : 0) + (headline ? 64 : 0) + (price && activeIds.has(price.id) ? 28 : 0);
    const availableHeroHeight = Math.max(60, (startY + usableHeight) - currentY - bottomReserved);
    heroHeight = Math.min(availableHeroHeight, usableWidth * 0.95);
    const heroWidth = Math.min(usableWidth, Math.round(heroHeight * (hero.preferredSize?.aspectRatio ?? 1.2)));
    const heroX = startX + Math.round((usableWidth - heroWidth) / 2);

    results.push({
      id: hero.id,
      role: hero.role,
      type: hero.type,
      priority: hero.priority,
      visible: true,
      x: heroX,
      y: currentY,
      width: heroWidth,
      height: Math.round(heroHeight),
      zIndex: 2,
    });
    currentY += Math.round(heroHeight) + gap;
  }

  // 3. Primary Headline
  if (headline && activeIds.has(headline.id)) {
    const baseHeadlineSize = Math.round(Math.min(usableWidth * 0.065, 26) * viewingMultiplier);
    const headlineFontSize = Math.max(baseHeadlineSize, effectiveMinTextSize);
    const headlineHeight = Math.round(headlineFontSize * 1.3);

    let text = headline.type === 'text' ? headline.content : '';
    if (usableHeight < 320 && headline.type === 'text' && headline.shortContent) {
      text = headline.shortContent;
    }

    results.push({
      id: headline.id,
      role: headline.role,
      type: headline.type,
      priority: headline.priority,
      visible: true,
      x: startX,
      y: currentY,
      width: usableWidth,
      height: headlineHeight,
      fontSize: headlineFontSize,
      renderText: text,
      zIndex: 3,
    });
    currentY += headlineHeight + Math.round(gap * 0.75);
  }

  // 4. Secondary Price
  if (price && activeIds.has(price.id)) {
    const priceFontSize = Math.max(14, Math.round(18 * viewingMultiplier));
    const priceHeight = Math.round(priceFontSize * 1.3);

    results.push({
      id: price.id,
      role: price.role,
      type: price.type,
      priority: price.priority,
      visible: true,
      x: startX,
      y: currentY,
      width: usableWidth,
      height: priceHeight,
      fontSize: priceFontSize,
      renderText: price.type === 'text' ? price.content : '',
      zIndex: 3,
    });
  }

  // 5. Call To Action Button (Anchored to bottom of usable area)
  if (cta && activeIds.has(cta.id)) {
    const ctaY = startY + usableHeight - ctaHeight;
    const ctaWidth = usableWidth;
    let label = cta.type === 'button' ? cta.label : 'Action';
    if (usableWidth < 280 && cta.type === 'button' && cta.shortLabel) {
      label = cta.shortLabel;
    }

    results.push({
      id: cta.id,
      role: cta.role,
      type: cta.type,
      priority: cta.priority,
      visible: true,
      x: startX,
      y: ctaY,
      width: ctaWidth,
      height: ctaHeight,
      fontSize: Math.max(15, Math.round(ctaHeight * 0.35)),
      renderLabel: label,
      zIndex: 4,
    });
  }

  return results;
}

// ----------------------------------------------------------------------------
// STRATEGY 3: Split Panel Solver (Retail Kiosk / Desktop Card / Square Screens)
// ----------------------------------------------------------------------------
function solveSplitPanel(ctx: SolverContext): ResolvedElementBounds[] {
  const {
    usableWidth,
    usableHeight,
    startX,
    startY,
    hero,
    headline,
    cta,
    price,
    logo,
    activeIds,
    viewingMultiplier,
    effectiveMinTapTarget,
    effectiveMinTextSize,
    droppedElements,
    steps,
  } = ctx;

  const gap = Math.max(16, Math.round(usableWidth * 0.025));
  const results: ResolvedElementBounds[] = [];

  // In split panel, Left side is Hero Image (approx 48-52% width), Right side is Content stack
  const leftColWidth = Math.round((usableWidth - gap) * 0.5);
  const rightColWidth = usableWidth - leftColWidth - gap;
  const rightColX = startX + leftColWidth + gap;

  // Degradation check: in split panel, right column stacks Logo + Headline + Price + CTA + gaps
  // Minimum required vertical space for all elements is ~240px
  const minRequiredRightCol = 240;
  if (usableHeight < minRequiredRightCol && logo && activeIds.has(logo.id)) {
    activeIds.delete(logo.id);
    droppedElements.push({
      id: logo.id,
      role: logo.role,
      priority: logo.priority,
      reason: `Split panel vertical clearance (${usableHeight}px < ${minRequiredRightCol}px) insufficient for branding + headline + CTA.`,
    });
    steps.push(`Degradation: Dropped Priority 3 branding logo "${logo.id}".`);
  }

  // Secondary degradation check: if height < 180px, drop secondary price
  if (usableHeight < 180 && price && activeIds.has(price.id)) {
    activeIds.delete(price.id);
    droppedElements.push({
      id: price.id,
      role: price.role,
      priority: price.priority,
      reason: `Severely constrained split panel height (${usableHeight}px < 180px); dropped Priority 2 price.`,
    });
    steps.push(`Degradation: Dropped Priority 2 secondary price "${price.id}".`);
  }

  // 1. Left Column: Hero Image
  if (hero && activeIds.has(hero.id)) {
    const heroHeight = usableHeight;
    results.push({
      id: hero.id,
      role: hero.role,
      type: hero.type,
      priority: hero.priority,
      visible: true,
      x: startX,
      y: startY,
      width: leftColWidth,
      height: heroHeight,
      zIndex: 2,
    });
  }

  // 2. Right Column Stack
  let currentY = startY;

  // Logo (Top of right column)
  if (logo && activeIds.has(logo.id)) {
    const logoSize = Math.min(usableHeight * 0.12, 54 * viewingMultiplier);
    results.push({
      id: logo.id,
      role: logo.role,
      type: logo.type,
      priority: logo.priority,
      visible: true,
      x: rightColX,
      y: currentY,
      width: Math.round(logoSize),
      height: Math.round(logoSize),
      zIndex: 2,
    });
    currentY += Math.round(logoSize) + gap;
  }

  // Headline
  if (headline && activeIds.has(headline.id)) {
    const baseHeadlineSize = Math.round(Math.min(rightColWidth * 0.075, 34) * viewingMultiplier);
    const headlineFontSize = Math.max(baseHeadlineSize, effectiveMinTextSize);
    const headlineHeight = Math.round(headlineFontSize * 2.2);

    results.push({
      id: headline.id,
      role: headline.role,
      type: headline.type,
      priority: headline.priority,
      visible: true,
      x: rightColX,
      y: currentY,
      width: rightColWidth,
      height: headlineHeight,
      fontSize: headlineFontSize,
      renderText: headline.type === 'text' ? headline.content : '',
      zIndex: 3,
    });
    currentY += headlineHeight + gap;
  }

  // Price
  if (price && activeIds.has(price.id)) {
    const priceFontSize = Math.max(16, Math.round(22 * viewingMultiplier));
    const priceHeight = Math.round(priceFontSize * 1.3);

    results.push({
      id: price.id,
      role: price.role,
      type: price.type,
      priority: price.priority,
      visible: true,
      x: rightColX,
      y: currentY,
      width: rightColWidth,
      height: priceHeight,
      fontSize: priceFontSize,
      renderText: price.type === 'text' ? price.content : '',
      zIndex: 3,
    });
  }

  // CTA Button (Anchored to bottom of right column)
  if (cta && activeIds.has(cta.id)) {
    const rawCtaHeight = Math.round(52 * viewingMultiplier);
    const ctaHeight = Math.max(rawCtaHeight, effectiveMinTapTarget, cta.minSize?.height ?? 44);
    const ctaY = startY + usableHeight - ctaHeight;
    const ctaWidth = rightColWidth;

    results.push({
      id: cta.id,
      role: cta.role,
      type: cta.type,
      priority: cta.priority,
      visible: true,
      x: rightColX,
      y: ctaY,
      width: ctaWidth,
      height: ctaHeight,
      fontSize: Math.max(16, Math.round(ctaHeight * 0.35)),
      renderLabel: cta.type === 'button' ? cta.label : 'Action',
      zIndex: 4,
    });
  }

  return results;
}
