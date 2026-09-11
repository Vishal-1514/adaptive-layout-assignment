
/**
 * render-dom.ts
 *
 * Displays the layout calculated by the resolver.
 * This file is only responsible for showing the ad.
 */

import React from 'react';
import type { ResolvedLayout, ResolvedElementBounds } from './resolver';
import type { AdSpec } from './spec';

export interface RenderDomProps {
  layout: ResolvedLayout;
  spec: AdSpec;
}

export function createAdDOMElement(
  layout: ResolvedLayout,
  spec: AdSpec
): HTMLElement {
  const container = document.createElement('div');

  container.style.position = 'relative';
  container.style.width = `${layout.surface.width}px`;
  container.style.height = `${layout.surface.height}px`;
  container.style.backgroundColor =
    spec.metadata?.bgColor ?? '#222';
  container.style.color = 'white';
  container.style.overflow = 'hidden';
  container.style.fontFamily = 'Arial, sans-serif';

  for (const element of layout.elements) {
    if (!element.visible) {
      continue;
    }

    const node = createElement(element);

    node.style.position = 'absolute';
    node.style.left = `${element.x}px`;
    node.style.top = `${element.y}px`;
    node.style.width = `${element.width}px`;
    node.style.height = `${element.height}px`;
    node.style.zIndex = String(element.zIndex);

    container.appendChild(node);
  }

  return container;
}

function createElement(
  element: ResolvedElementBounds
): HTMLElement {

  // Image
  if (element.type === 'image') {
    const image = document.createElement('img');

    image.src = element.imageSrc ?? '';
    image.alt = element.imageAlt ?? '';

    image.style.width = '100%';
    image.style.height = '100%';
    image.style.objectFit = element.objectFit ?? 'cover';

    return image;
  }

  // Button
  if (element.type === 'button') {
    const button = document.createElement('button');

    button.textContent = element.renderLabel ?? 'Click';

    button.style.width = '100%';
    button.style.height = '100%';
    button.style.backgroundColor = '#4f46e5';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '6px';
    button.style.fontSize = `${element.fontSize ?? 16}px`;
    button.style.cursor = 'pointer';

    button.onclick = () => {
      alert('Ad button clicked!');
    };

    return button;
  }

  // Text
  const text = document.createElement('div');

  text.textContent = element.renderText ?? '';

  text.style.fontSize = `${element.fontSize ?? 16}px`;
  text.style.display = 'flex';
  text.style.alignItems = 'center';
  text.style.overflow = 'hidden';

  if (element.priority === 1) {
    text.style.fontWeight = 'bold';
  }

  return text;
}

/*
 * React component that displays the DOM renderer.
 */
export const AdRendererDOM: React.FC<RenderDomProps> = ({
  layout,
  spec,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    containerRef.current.innerHTML = '';

    const ad = createAdDOMElement(layout, spec);

    containerRef.current.appendChild(ad);
  }, [layout, spec]);

  return (
    <div
      ref={containerRef}
      style={{
        width: `${layout.surface.width}px`,
        height: `${layout.surface.height}px`,
      }}
    />
  );
};

