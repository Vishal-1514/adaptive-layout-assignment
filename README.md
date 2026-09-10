# Adaptive Layout Engine for Multi-Surface Ads

A constraint-driven layout engine that takes a single declarative ad specification and dynamically adapts it across fundamentally different aspect ratios and device profiles (mobile portrait, mobile landscape, broadcast lower-third, retail kiosk, and arbitrary custom dimensions) **without hardcoded per-surface layout branches or CSS media queries**.





## 🧠 Layout Algorithm: Step-by-Step

The resolution flow is strictly decoupled:

$$\text{Ad Spec} + \text{Surface Profile} \longrightarrow \mathbf{Constraint\ Resolver} \longrightarrow \text{Resolved Layout} \longrightarrow \text{Renderer (DOM / Canvas)}$$

### Step 1: Geometric Bounding Box & Inset Resolution
The engine insets the raw canvas dimensions by the surface's `safeArea`:
$$\text{usableWidth} = \text{width} - (\text{safeArea.left} + \text{safeArea.right})$$
$$\text{usableHeight} = \text{height} - (\text{safeArea.top} + \text{safeArea.bottom})$$

### Step 2: Continuous Aspect Ratio Strategy Selection
Rather than checking arbitrary surface names (`if (surface.id === 'mobile')`), the engine classifies the layout intent using physical aspect ratio geometry:
$$\text{Aspect Ratio } (AR) = \frac{\text{usableWidth}}{\text{usableHeight}}$$

* **$AR \ge 2.2$ (`horizontal-strip`):** Optimized for wide broadcast overlays and horizontal banners. Elements flow left-to-right (Branding/Hero $\rightarrow$ Text Stack $\rightarrow$ Action CTA).
* **$AR \le 0.85$ (`vertical-stack`):** Optimized for tall mobile portraits and vertical banners. Elements flow top-to-bottom (Logo $\rightarrow$ Hero Image $\rightarrow$ Headline $\rightarrow$ Secondary Price $\rightarrow$ Bottom Anchored CTA).
* **$0.85 < AR < 2.2$ (`split-panel`):** Optimized for square kiosks and desktop viewports. Allocates a dual-column layout: Left column contains the Hero product imagery; Right column houses typography and action controls.

### Step 3: Hard Ergonomic Constraint Enforcement
- **Touch Target Sizing:** For touch surfaces, buttons enforce $\text{height} \ge \max(\text{preferredHeight}, \text{surface.minTapTarget})$.
- **Legibility for Far Viewing:** Surfaces with `viewingDistance === 'far'` apply a $1.6\times$ scale multiplier and clamp all text elements to $\text{fontSize} \ge \text{surface.minTextSize}$ (e.g. $32\text{px}$).

### Step 4: Deterministic Priority & Degradation Pass
When available width or height cannot fit all elements at their preferred sizes:
1. **Priority 3 Degradation (Branding):** If vertical or horizontal clearance is below the threshold required for all items, Priority 3 elements (e.g., brand logo) are hidden (`visible: false`), preserving space for actionable content.
2. **Priority 2 Degradation (Secondary / Pricing):** In severely constrained spaces, secondary metadata (e.g., price text) drops or switches to compact `shortContent`, and CTA buttons collapse to `shortLabel`.
3. **Priority 1 Protection (Hero & Headline):** Priority 1 items are never dropped. They scale down to their strict `minSize` bounds without clipping.

### Step 5: Exact Coordinate Assignment
The engine calculates exact non-overlapping pixel coordinates $(x, y, w, h, \text{fontSize}, \text{zIndex})$ for every element. No layout computation is delegated to CSS or browser flow.

---

## 🛡️ TypeScript Design: Preventing Invalid Combinations

1. **Role & Type Discrimination:**
   - Ad elements are typed as discriminated unions (`TextElement | ImageElement | ButtonElement`).
   - Defined roles (`'primary' | 'hero' | 'action' | 'secondary' | 'branding'`) and priorities (`1 | 2 | 3`) are strictly checked at compile time.
2. **Surface Ergonomics:**
   - Optional constraint types (`minTapTarget?: number`, `minTextSize?: number`, `viewingDistance?: 'near' | 'medium' | 'far'`) guarantee that incompatible surface definitions cannot be constructed.
3. **Exact Resolved Output Schema:**
   - `ResolvedLayout` outputs fully typed bounding boxes (`ResolvedElementBounds`), giving renderers complete layout certainty without guessing or dynamic DOM measurement.

---

## ⚠️ Known Limitations

1. **Fixed Element Schema:** The current engine specializes in standard e-commerce ad components (Hero, Logo, Headline, Secondary Text, CTA). Arbitrary nested component trees are not supported.
2. **Font Metrics Estimation:** Text heights are calculated using typographic line-height ratios rather than Canvas `measureText()` or DOM `getBoundingClientRect()`.
3. **Transitions:** Switching surfaces triggers immediate re-layout; animated element transitions are simulated via CSS transitions on absolute bounds.

---


    },
  },
])

```
