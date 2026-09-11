/**
 * render-canvas.ts
 *
 * Simple Canvas renderer.
 * It uses the coordinates calculated by resolver.ts.
 */

import React, { useEffect, useRef } from 'react';
import type { ResolvedLayout } from './resolver';
import type { AdSpec } from './spec';

interface RenderCanvasProps {
  layout: ResolvedLayout;
  spec: AdSpec;
}

export const AdRendererCanvas: React.FC<RenderCanvasProps> = ({
  layout,
  spec,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    const { surface, elements } = layout;

    canvas.width = surface.width;
    canvas.height = surface.height;

    // Draw background
    ctx.fillStyle = spec.metadata?.bgColor ?? '#222';
    ctx.fillRect(0, 0, surface.width, surface.height);

    // Only draw visible elements
    const visibleElements = elements.filter(
      (element) => element.visible
    );

    for (const element of visibleElements) {
      // Image
      if (element.type === 'image') {
        const image = new Image();

        image.src = element.imageSrc ?? '';

        image.onload = () => {
          ctx.drawImage(
            image,
            element.x,
            element.y,
            element.width,
            element.height
          );
        };

        continue;
      }

      // Button
      if (element.type === 'button') {
        ctx.fillStyle =
          spec.metadata?.brandColor ?? '#4f46e5';

        ctx.fillRect(
          element.x,
          element.y,
          element.width,
          element.height
        );

        ctx.fillStyle = '#fff';
        ctx.font = `bold ${element.fontSize ?? 16}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText(
          element.renderLabel ?? 'Click',
          element.x + element.width / 2,
          element.y + element.height / 2
        );

        continue;
      }

      // Text
      ctx.fillStyle = '#fff';
      ctx.font = `${element.fontSize ?? 16}px Arial`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      ctx.fillText(
        element.renderText ?? '',
        element.x,
        element.y
      );
    }
  }, [layout, spec]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${layout.surface.width}px`,
        height: `${layout.surface.height}px`,
        display: 'block',
      }}
    />
  );
};