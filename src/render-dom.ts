import type { ResolvedLayout, ResolvedElementBounds } from './resolver';

export function renderDomLayout(
  container: HTMLElement,
  layout: ResolvedLayout
): void {
  container.innerHTML = '';

  container.style.position = 'relative';
  container.style.width = `${layout.surface.width}px`;
  container.style.height = `${layout.surface.height}px`;
  container.style.overflow = 'hidden';

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
    node.style.zIndex = `${element.zIndex}`;

    container.appendChild(node);
  }
}

function createElement(element: ResolvedElementBounds): HTMLElement {
  if (element.type === 'button') {
    const button = document.createElement('button');

    button.textContent = element.renderLabel ?? 'Action';

    if (element.fontSize) {
      button.style.fontSize = `${element.fontSize}px`;
    }

    button.style.cursor = 'pointer';

    return button;
  }

  if (element.type === 'image') {
    const image = document.createElement('div');

    image.style.backgroundColor = '#e5e7eb';
    image.style.borderRadius = '12px';

    return image;
  }

  const text = document.createElement('div');

  text.textContent = element.renderText ?? '';

  if (element.fontSize) {
    text.style.fontSize = `${element.fontSize}px`;
  }

  text.style.fontWeight =
    element.priority === 1 ? '700' : '400';

  text.style.display = 'flex';
  text.style.alignItems = 'center';

  return text;
}