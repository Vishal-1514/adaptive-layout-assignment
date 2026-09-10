/**
 * render-dom.ts
 *
 * DOM/CSS Rendering backend for ResolvedLayout.
 * Consumes pure coordinates and dimensions from the resolver.
 * Can render directly to a container HTMLElement OR via React.createElement.
 */

import React from 'react';
import { ResolvedLayout } from './resolver';
import { AdSpec, AdElement, TextElement, ImageElement, ButtonElement } from './spec';

export interface RenderDomProps {
  layout: ResolvedLayout;
  spec: AdSpec;
  showSafeAreaGuide?: boolean;
}

/**
 * Pure DOM Element creation function (demonstrating vanilla DOM/CSS mastery).
 */
export function createAdDOMElement(
  layout: ResolvedLayout,
  spec: AdSpec,
  showSafeAreaGuide: boolean = false
): HTMLElement {
  const { surface, elements, diagnostics } = layout;
  const specMap = new Map<string, AdElement>(spec.elements.map(e => [e.id, e]));

  const container = document.createElement('div');
  container.setAttribute('data-surface-id', surface.id);
  container.setAttribute('data-resolved-strategy', diagnostics.strategy);
  Object.assign(container.style, {
    position: 'relative',
    width: `${surface.width}px`,
    height: `${surface.height}px`,
    backgroundColor: spec.metadata?.bgColor ?? '#0f172a',
    color: '#f8fafc',
    overflow: 'hidden',
    boxSizing: 'border-box',
    userSelect: 'none',
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
    borderRadius: surface.touchOnly && surface.width < 400 ? '24px' : '8px',
  });

  if (showSafeAreaGuide) {
    const guide = document.createElement('div');
    Object.assign(guide.style, {
      position: 'absolute',
      top: `${diagnostics.safeAreaInsets.top}px`,
      left: `${diagnostics.safeAreaInsets.left}px`,
      width: `${diagnostics.usableArea.width}px`,
      height: `${diagnostics.usableArea.height}px`,
      border: '2px dashed rgba(244, 63, 94, 0.7)',
      pointerEvents: 'none',
      zIndex: '999',
      boxSizing: 'border-box',
    });

    const label = document.createElement('span');
    label.innerText = `SAFE AREA (${diagnostics.usableArea.width}x${diagnostics.usableArea.height})`;
    Object.assign(label.style, {
      position: 'absolute',
      top: '4px',
      left: '4px',
      fontSize: '10px',
      background: 'rgba(244, 63, 94, 0.85)',
      color: '#fff',
      padding: '2px 6px',
      borderRadius: '4px',
      fontWeight: '700',
      letterSpacing: '0.05em',
    });
    guide.appendChild(label);
    container.appendChild(guide);
  }

  for (const bounds of elements) {
    if (!bounds.visible) continue;
    const original = specMap.get(bounds.id);
    if (!original) continue;

    const elDiv = document.createElement('div');
    Object.assign(elDiv.style, {
      position: 'absolute',
      left: `${bounds.x}px`,
      top: `${bounds.y}px`,
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
      zIndex: String(bounds.zIndex),
      boxSizing: 'border-box',
      transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
    });

    if (original.role === 'hero' && original.type === 'image') {
      const imgEl = original as ImageElement;
      Object.assign(elDiv.style, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      });
      const img = document.createElement('img');
      img.src = imgEl.src;
      img.alt = imgEl.alt;
      Object.assign(img.style, {
        width: '100%',
        height: '100%',
        objectFit: imgEl.objectFit ?? 'cover',
        filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.35))',
      });
      elDiv.appendChild(img);
    } else if (original.role === 'branding') {
      const imgEl = original as ImageElement;
      Object.assign(elDiv.style, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '10px',
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        padding: '4px',
      });
      const img = document.createElement('img');
      img.src = imgEl.src;
      img.alt = imgEl.alt;
      Object.assign(img.style, {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        borderRadius: '8px',
      });
      elDiv.appendChild(img);
    } else if (original.role === 'primary' && original.type === 'text') {
      const textEl = original as TextElement;
      elDiv.innerText = bounds.renderText ?? textEl.content;
      Object.assign(elDiv.style, {
        display: 'flex',
        alignItems: 'center',
        fontSize: `${bounds.fontSize ?? 24}px`,
        fontWeight: '800',
        lineHeight: '1.15',
        letterSpacing: '-0.02em',
        color: '#ffffff',
        textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        whiteSpace: diagnostics.strategy === 'horizontal-strip' ? 'nowrap' : 'normal',
        textOverflow: 'ellipsis',
      });
    } else if (original.role === 'secondary' && original.type === 'text') {
      const textEl = original as TextElement;
      const span = document.createElement('span');
      span.innerText = bounds.renderText ?? textEl.content;
      Object.assign(span.style, {
        background: 'rgba(16, 185, 129, 0.15)',
        padding: '2px 8px',
        borderRadius: '6px',
        border: '1px solid rgba(16, 185, 129, 0.3)',
      });
      Object.assign(elDiv.style, {
        display: 'flex',
        alignItems: 'center',
        fontSize: `${bounds.fontSize ?? 16}px`,
        fontWeight: '600',
        color: spec.metadata?.accentColor ?? '#34d399',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
      });
      elDiv.appendChild(span);
    } else if (original.role === 'action' && original.type === 'button') {
      const btnEl = original as ButtonElement;
      const btn = document.createElement('button');
      btn.innerText = bounds.renderLabel ?? btnEl.label;
      Object.assign(btn.style, {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${spec.metadata?.brandColor ?? '#6366f1'} 0%, #4338ca 100%)`,
        color: '#ffffff',
        border: 'none',
        borderRadius: '10px',
        fontWeight: '700',
        fontSize: `${bounds.fontSize ?? 16}px`,
        cursor: 'pointer',
        boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.5)',
        letterSpacing: '0.01em',
        padding: '0 12px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      });
      btn.onclick = () => alert(`Ad clicked: "${btn.innerText}"`);
      elDiv.appendChild(btn);
    }

    container.appendChild(elDiv);
  }

  return container;
}

/**
 * React Component wrapper using React.createElement (keeps render-dom.ts strictly valid TS).
 */
export const AdRendererDOM: React.FC<RenderDomProps> = ({
  layout,
  spec,
  showSafeAreaGuide = false,
}) => {
  const mountRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    mount.innerHTML = '';
    const domNode = createAdDOMElement(layout, spec, showSafeAreaGuide);
    mount.appendChild(domNode);
  }, [layout, spec, showSafeAreaGuide]);

  return React.createElement('div', {
    ref: mountRef,
    style: {
      width: `${layout.surface.width}px`,
      height: `${layout.surface.height}px`,
    },
  });
};
