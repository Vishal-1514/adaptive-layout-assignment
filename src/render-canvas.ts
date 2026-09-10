import type { ResolvedLayout, ResolvedElementBounds } from './resolver';

export function renderCanvasLayout(
  canvas: HTMLCanvasElement,
  layout: ResolvedLayout
): void {
  canvas.width = layout.surface.width;
  canvas.height = layout.surface.height;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context is not available.');
  }

  // Clear previous rendering
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw each resolved element
  for (const element of layout.elements) {
    if (!element.visible) {
      continue;
    }

    drawElement(ctx, element);
  }
}

function drawElement(
  ctx: CanvasRenderingContext2D,
  element: ResolvedElementBounds
): void {
  if (element.type === 'image') {
    drawImagePlaceholder(ctx, element);
    return;
  }

  if (element.type === 'button') {
    drawButton(ctx, element);
    return;
  }

  drawText(ctx, element);
}

function drawImagePlaceholder(
  ctx: CanvasRenderingContext2D,
  element: ResolvedElementBounds
): void {
  ctx.fillStyle = '#e5e7eb';

  ctx.fillRect(
    element.x,
    element.y,
    element.width,
    element.height
  );

  ctx.strokeStyle = '#9ca3af';
  ctx.strokeRect(
    element.x,
    element.y,
    element.width,
    element.height
  );
}

function drawButton(
  ctx: CanvasRenderingContext2D,
  element: ResolvedElementBounds
): void {
  ctx.fillStyle = '#4f46e5';

  ctx.fillRect(
    element.x,
    element.y,
    element.width,
    element.height
  );

  ctx.fillStyle = '#ffffff';

  const fontSize = element.fontSize ?? 16;

  ctx.font = `600 ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillText(
    element.renderLabel ?? 'Action',
    element.x + element.width / 2,
    element.y + element.height / 2
  );
}

function drawText(
  ctx: CanvasRenderingContext2D,
  element: ResolvedElementBounds
): void {
  const fontSize = element.fontSize ?? 16;

  ctx.fillStyle = '#111827';

  ctx.font =
    element.priority === 1
      ? `700 ${fontSize}px Arial`
      : `400 ${fontSize}px Arial`;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  ctx.fillText(
    element.renderText ?? '',
    element.x,
    element.y
  );
}