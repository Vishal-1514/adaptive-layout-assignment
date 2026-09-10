export type ElementType = 'text' | 'image' | 'button';

export type ElementRole =
  | 'primary'    // Main headline or core message (priority 1)
  | 'hero'       // Hero product or feature image (priority 1)
  | 'action'     // Call to action button (priority 2)
  | 'secondary'  // Price, subtitle, rating, or supplementary details (priority 2)
  | 'branding';  // Logo, company mark, or partner stamp (priority 3)

export type Priority = 1 | 2 | 3;

export interface BaseElement {
  id: string;
  type: ElementType;
  role: ElementRole;
  priority: Priority;
  /** Optional minimum width/height below which the element cannot legibly render */
  minSize?: {
    width?: number;
    height?: number;
  };
  /** Preferred intrinsic width/height or aspect ratio */
  preferredSize?: {
    width?: number;
    height?: number;
    aspectRatio?: number; // e.g. 1.0 (square), 1.5, 0.75
  };
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  variant?: 'headline' | 'body' | 'caption' | 'badge';
  shortContent?: string; // Fallback truncated version for constrained layouts
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  alt: string;
  aspectRatio?: number; // width / height
  objectFit?: 'contain' | 'cover';
}

export interface ButtonElement extends BaseElement {
  type: 'button';
  label: string;
  shortLabel?: string;
  href?: string;
  variant?: 'primary' | 'secondary';
}

export type AdElement = TextElement | ImageElement | ButtonElement;

export interface AdSpec {
  id: string;
  title: string;
  elements: AdElement[];
  metadata?: {
    category?: string;
    targetAudience?: string;
    brandColor?: string;
    accentColor?: string;
    bgColor?: string;
  };
}

/**
 * Validates and constructs an AdSpec.
 * Ensures no duplicate IDs, valid priority ranges, and recognized roles.
 */
export function defineAd<T extends AdSpec>(spec: T): T {
  if (!spec.id || typeof spec.id !== 'string') {
    throw new Error('AdSpec must have a valid string "id".');
  }

  if (!Array.isArray(spec.elements) || spec.elements.length === 0) {
    throw new Error('AdSpec must define at least one element in "elements".');
  }

  const seenIds = new Set<string>();
  const validRoles: ElementRole[] = ['primary', 'hero', 'action', 'secondary', 'branding'];
  const validTypes: ElementType[] = ['text', 'image', 'button'];

  for (const el of spec.elements) {
    if (seenIds.has(el.id)) {
      throw new Error(`Duplicate element id detected: "${el.id}". Element IDs must be unique.`);
    }
    seenIds.add(el.id);

    if (!validTypes.includes(el.type)) {
      throw new Error(`Invalid element type "${el.type}" for element "${el.id}". Valid types: ${validTypes.join(', ')}`);
    }

    if (!validRoles.includes(el.role)) {
      throw new Error(`Invalid element role "${el.role}" for element "${el.id}". Valid roles: ${validRoles.join(', ')}`);
    }

    if (![1, 2, 3].includes(el.priority)) {
      throw new Error(`Invalid priority "${el.priority}" for element "${el.id}". Must be 1, 2, or 3.`);
    }
  }

  return Object.freeze(spec);
}

/**
 * Realistic default product ad spec defined once according to the specification.
 */
export const defaultAdSpec = defineAd({
  id: 'flam-sneaker-pro-v1',
  title: 'Aura Pulse Pro Running Shoes',
  metadata: {
    category: 'Footwear',
    brandColor: '#4f46e5',
    accentColor: '#10b981',
    bgColor: '#0f172a',
  },
  elements: [
    {
      id: 'headline',
      type: 'text',
      role: 'primary',
      priority: 1,
      content: 'Defy Gravity. Run Faster.',
      shortContent: 'Run Faster.',
      variant: 'headline',
      minSize: { height: 28 },
    },
    {
      id: 'product-image',
      type: 'image',
      role: 'hero',
      priority: 1,
      src: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      alt: 'Aura Pulse Sneaker Red Sport',
      aspectRatio: 1.2,
      preferredSize: { width: 360, height: 300, aspectRatio: 1.2 },
      minSize: { width: 90, height: 75 },
    },
    {
      id: 'cta',
      type: 'button',
      role: 'action',
      priority: 2,
      label: 'Shop Now — 20% Off',
      shortLabel: 'Shop Now',
      variant: 'primary',
      minSize: { height: 44, width: 120 },
    },
    {
      id: 'price',
      type: 'text',
      role: 'secondary',
      priority: 2,
      content: '$149.00  (Orig. $189)',
      shortContent: '$149',
      variant: 'caption',
      minSize: { height: 20 },
    },
    {
      id: 'logo',
      type: 'image',
      role: 'branding',
      priority: 3,
      src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
      alt: 'Flam Optics Emblem',
      aspectRatio: 1.0,
      preferredSize: { width: 64, height: 64, aspectRatio: 1.0 },
      minSize: { width: 36, height: 36 },
    },
  ],
});