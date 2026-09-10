/**
 * render-canvas.ts
 *
 * Alternative Canvas Rendering Backend for ResolvedLayout.
 * Demonstrates total decoupling of the Constraint Resolver from the DOM.
 * Renders identical layouts purely via 2D Canvas context operations.
 */

import React, { useEffect, useRef } from 'react';
import type { ResolvedLayout } from './resolver';
import type { AdSpec, AdElement, TextElement, ImageElement, ButtonElement } from './spec';

export interface RenderCanvasProps {
  layout: ResolvedLayout;
  spec: AdSpec;
  showSafeAreaGuide?: boolean;
}

export const AdRendererCanvas: React.FC<RenderCanvasProps> = ({
  layout,
  spec,
  showSafeAreaGuide = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { surface, elements, diagnostics } = layout;
  const specMap = new Map<string, AdElement>(spec.elements.map(e => [e.id, e]));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays for crisp canvas rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = surface.width * dpr;
    canvas.height = surface.height * dpr;
    ctx.scale(dpr, dpr);

    // 1. Draw Background
    ctx.fillStyle = spec.metadata?.bgColor ?? '#0f172a';
    ctx.fillRect(0, 0, surface.width, surface.height);

    // Subtle background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, surface.width, surface.height);
    bgGrad.addColorStop(0, 'rgba(30, 41, 59, 0.6)');
    bgGrad.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, surface.width, surface.height);

    // 2. Optional Safe Area Guide
    if (showSafeAreaGuide) {
      ctx.save();
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(
        diagnostics.usableArea.x,
        diagnostics.usableArea.y,
        diagnostics.usableArea.width,
        diagnostics.usableArea.height
      );
      ctx.fillStyle = 'rgba(244, 63, 94, 0.9)';
      ctx.font = 'bold 11px system-ui';
      ctx.fillText(
        `SAFE AREA (${diagnostics.usableArea.width}x${diagnostics.usableArea.height})`,
        diagnostics.usableArea.x + 8,
        diagnostics.usableArea.y + 16
      );
      ctx.restore();
    }

    // 3. Render Elements sorted by zIndex
    const sorted = [...elements].filter(e => e.visible).sort((a, b) => a.zIndex - b.zIndex);

    for (const bounds of sorted) {
      const original = specMap.get(bounds.id);
      if (!original) continue;

      ctx.save();

      // --- Hero Image ---
      if (original.role === 'hero' && original.type === 'image') {
        const imgEl = original as ImageElement;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imgEl.src;
        img.onload = () => {
          if (!canvasRef.current) return;
          const freshCtx = canvasRef.current.getContext('2d');
          if (freshCtx) {
            freshCtx.save();
            freshCtx.drawImage(img, bounds.x, bounds.y, bounds.width, bounds.height);
            freshCtx.restore();
          }
        };

        // Placeholder background while loading
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(bounds.x, bounds.y, bounds.width, bounds.height, 12);
        ctx.fill();

        if (img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, bounds.x, bounds.y, bounds.width, bounds.height);
        }
      }

      // --- Branding Logo ---
      else if (original.role === 'branding') {
        const imgEl = original as ImageElement;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.roundRect(bounds.x, bounds.y, bounds.width, bounds.height, 8);
        ctx.fill();

        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.src = imgEl.src;
        logoImg.onload = () => {
          if (!canvasRef.current) return;
          const freshCtx = canvasRef.current.getContext('2d');
          if (freshCtx) {
            freshCtx.drawImage(logoImg, bounds.x + 4, bounds.y + 4, bounds.width - 8, bounds.height - 8);
          }
        };

        if (logoImg.complete && logoImg.naturalWidth > 0) {
          ctx.drawImage(logoImg, bounds.x + 4, bounds.y + 4, bounds.width - 8, bounds.height - 8);
        }
      }

      // --- Primary Headline ---
      else if (original.role === 'primary' && original.type === 'text') {
        const textEl = original as TextElement;
        const text = bounds.renderText ?? textEl.content;
        const fontSize = bounds.fontSize ?? 24;

        ctx.fillStyle = '#ffffff';
        ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 8;
        ctx.fillText(text, bounds.x, bounds.y + bounds.height / 2, bounds.width);
      }

      // --- Secondary Price ---
      else if (original.role === 'secondary' && original.type === 'text') {
        const textEl = original as TextElement;
        const text = bounds.renderText ?? textEl.content;
        const fontSize = bounds.fontSize ?? 16;

        ctx.fillStyle = spec.metadata?.accentColor ?? '#34d399';
        ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.fillText(text, bounds.x, bounds.y + bounds.height / 2, bounds.width);
      }

      // --- CTA Button ---
      else if (original.role === 'action' && original.type === 'button') {
        const btnEl = original as ButtonElement;
        const label = bounds.renderLabel ?? btnEl.label;
        const fontSize = bounds.fontSize ?? 16;

        // Button background
        const btnGrad = ctx.createLinearGradient(bounds.x, bounds.y, bounds.x + bounds.width, bounds.y + bounds.height);
        btnGrad.addColorStop(0, spec.metadata?.brandColor ?? '#6366f1');
        btnGrad.addColorStop(1, '#4338ca');
        ctx.fillStyle = btnGrad;
        ctx.beginPath();
        ctx.roundRect(bounds.x, bounds.y, bounds.width, bounds.height, 10);
        ctx.fill();

        // Button text
        ctx.fillStyle = '#ffffff';
        ctx.font = `700 ${fontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      }

      ctx.restore();
    }
  }, [layout, spec, surface, elements, diagnostics, showSafeAreaGuide]);

  return React.createElement('canvas', {
    ref: canvasRef,
    style: {
      width: `${surface.width}px`,
      height: `${surface.height}px`,
      borderRadius: surface.touchOnly && surface.width < 400 ? '24px' : '8px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
      display: 'block',
    },
  });
};
