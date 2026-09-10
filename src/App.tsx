import React, { useState, useMemo } from 'react';
import { defaultAdSpec } from './spec';
import  { standardSurfaces, createCustomSurface } from './surfaces';
import type { SurfaceProfile } from './surfaces';
import { resolveLayout } from './resolver';
import { AdRendererDOM } from './render-dom';
import { AdRendererCanvas } from './render-canvas';
import { 
  Smartphone, 
  Tv, 
  Monitor, 
  Sliders, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Maximize2, 
  Cpu, 
  Eye, 
  Sparkles,
  Zap
} from 'lucide-react';

export default function App() {
  const [selectedPreset, setSelectedPreset] = useState<string>('mobileInterstitial');
  const [renderMode, setRenderMode] = useState<'dom' | 'canvas'>('dom');
  const [showSafeArea, setShowSafeArea] = useState<boolean>(true);
  const [scaleToFit, setScaleToFit] = useState<boolean>(true);

  // Custom 5th surface dynamic controls (for the live interview test)
  const [customWidth, setCustomWidth] = useState<number>(800);
  const [customHeight, setCustomHeight] = useState<number>(350);
  const [customTapTarget, setCustomTapTarget] = useState<number>(44);
  const [customMinText, setCustomMinText] = useState<number>(14);
  const [customDistance, setCustomDistance] = useState<'near' | 'medium' | 'far'>('near');

  // Active surface profile
  const activeSurface: SurfaceProfile = useMemo(() => {
    if (selectedPreset === 'custom') {
      return createCustomSurface({
        width: customWidth,
        height: customHeight,
        minTapTarget: customTapTarget,
        minTextSize: customMinText,
        viewingDistance: customDistance,
        touchOnly: customTapTarget > 48,
      });
    }
    return standardSurfaces[selectedPreset] || standardSurfaces.mobileInterstitial;
  }, [selectedPreset, customWidth, customHeight, customTapTarget, customMinText, customDistance]);

  // Execute the layout constraint resolver
  const resolvedLayout = useMemo(() => {
    return resolveLayout(defaultAdSpec, activeSurface);
  }, [activeSurface]);

  // Auto-fit scale factor for comfortable screen viewing
  const previewScale = useMemo(() => {
    if (!scaleToFit) return 1;
    const maxPreviewWidth = 840;
    const maxPreviewHeight = 540;
    const scaleX = maxPreviewWidth / activeSurface.width;
    const scaleY = maxPreviewHeight / activeSurface.height;
    return Math.min(1, scaleX, scaleY);
  }, [scaleToFit, activeSurface.width, activeSurface.height]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0b0f19' }}>
      {/* Top Header */}
      <header
        style={{
          borderBottom: '1px solid #1f2937',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(17, 24, 39, 0.95)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              display: 'flex',
            }}
          >
            <Cpu size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
              Adaptive Layout Engine
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              Multi-Surface Ad Constraint Solver &bull; Zero Media Queries &bull; Full Type Safety
            </p>
          </div>
        </div>

        {/* Global toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              display: 'flex',
              background: '#1f2937',
              padding: '2px',
              borderRadius: '8px',
              border: '1px solid #374151',
            }}
          >
            <button
              onClick={() => setRenderMode('dom')}
              className={`btn ${renderMode === 'dom' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            >
              DOM / CSS
            </button>
            <button
              onClick={() => setRenderMode('canvas')}
              className={`btn ${renderMode === 'canvas' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            >
              HTML5 Canvas (Bonus)
            </button>
          </div>

          <button
            onClick={() => setShowSafeArea(!showSafeArea)}
            className={`btn btn-outline ${showSafeArea ? 'active' : ''}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            title="Toggle Safe Area Visualization"
          >
            <Eye size={14} />
            Safe Area
          </button>

          <button
            onClick={() => setScaleToFit(!scaleToFit)}
            className={`btn btn-outline ${scaleToFit ? 'active' : ''}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            title="Auto Scale to Viewport"
          >
            <Maximize2 size={14} />
            {scaleToFit ? 'Fit Viewport' : '100% Size'}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar: Surface Picker & Inspector */}
        <aside
          style={{
            width: '360px',
            borderRight: '1px solid #1f2937',
            background: '#111827',
            overflowY: 'auto',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {/* Surface Profile Selection */}
          <section>
            <h2
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#9ca3af',
                marginBottom: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Layers size={14} />
              Select Surface Profile
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <SurfaceOption
                title="Mobile Interstitial"
                dims="320 × 480 (Portrait)"
                icon={<Smartphone size={16} />}
                active={selectedPreset === 'mobileInterstitial'}
                onClick={() => setSelectedPreset('mobileInterstitial')}
              />
              <SurfaceOption
                title="Mobile Landscape"
                dims="640 × 360 (16:9)"
                icon={<Smartphone size={16} style={{ transform: 'rotate(90deg)' }} />}
                active={selectedPreset === 'mobileLandscape'}
                onClick={() => setSelectedPreset('mobileLandscape')}
              />
              <SurfaceOption
                title="Broadcast Lower-Third"
                dims="1920 × 250 (TV Overlay)"
                icon={<Tv size={16} />}
                active={selectedPreset === 'broadcastLowerThird'}
                onClick={() => setSelectedPreset('broadcastLowerThird')}
              />
              <SurfaceOption
                title="Retail Kiosk"
                dims="1080 × 1080 (Square Touch)"
                icon={<Monitor size={16} />}
                active={selectedPreset === 'retailKiosk'}
                onClick={() => setSelectedPreset('retailKiosk')}
              />
              <SurfaceOption
                title="Cramped Stress Test"
                dims="320 × 180 (Low Clearance)"
                icon={<AlertTriangle size={16} color="#f59e0b" />}
                active={selectedPreset === 'crampedStressTest'}
                onClick={() => setSelectedPreset('crampedStressTest')}
                badge="Priority Drop"
              />
              <SurfaceOption
                title="Custom Dynamic Surface"
                dims="Arbitrary live testing"
                icon={<Sliders size={16} color="#a855f7" />}
                active={selectedPreset === 'custom'}
                onClick={() => setSelectedPreset('custom')}
                badge="5th Surface Proof"
              />
            </div>
          </section>

          {/* Dynamic Slider Controls for 5th Surface */}
          {selectedPreset === 'custom' && (
            <section
              style={{
                background: '#1f2937',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid #374151',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a855f7', fontWeight: 700, fontSize: '0.8rem' }}>
                <Sparkles size={14} />
                5th Surface Live Simulator
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>
                  <span>Width</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{customWidth}px</span>
                </div>
                <input
                  type="range"
                  min="240"
                  max="2000"
                  step="10"
                  value={customWidth}
                  onChange={e => setCustomWidth(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>
                  <span>Height</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{customHeight}px</span>
                </div>
                <input
                  type="range"
                  min="140"
                  max="1200"
                  step="10"
                  value={customHeight}
                  onChange={e => setCustomHeight(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>
                  <span>Min Tap Target</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{customTapTarget}px</span>
                </div>
                <input
                  type="range"
                  min="32"
                  max="72"
                  step="2"
                  value={customTapTarget}
                  onChange={e => setCustomTapTarget(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>
                  <span>Min Text Size</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{customMinText}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="48"
                  step="2"
                  value={customMinText}
                  onChange={e => setCustomMinText(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>
                  <span>Viewing Distance</span>
                  <span style={{ color: '#fff', fontWeight: 600, textTransform: 'capitalize' }}>{customDistance}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {(['near', 'medium', 'far'] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => setCustomDistance(d)}
                      style={{
                        flex: 1,
                        fontSize: '0.7rem',
                        padding: '4px',
                        borderRadius: '4px',
                        border: '1px solid #374151',
                        background: customDistance === d ? '#6366f1' : '#111827',
                        color: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Engine Resolution Diagnostics */}
          <section>
            <h2
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#9ca3af',
                marginBottom: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Zap size={14} color="#10b981" />
              Solver Diagnostics
            </h2>

            <div
              style={{
                background: '#1f2937',
                borderRadius: '0.75rem',
                padding: '0.85rem',
                border: '1px solid #374151',
                fontSize: '0.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca3af' }}>Resolved Strategy:</span>
                <span style={{ fontWeight: 700, color: '#38bdf8' }}>
                  {resolvedLayout.diagnostics.strategy}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca3af' }}>Aspect Ratio:</span>
                <span style={{ fontWeight: 600, color: '#f3f4f6' }}>
                  {resolvedLayout.diagnostics.aspectRatio}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca3af' }}>Usable Dimensions:</span>
                <span style={{ fontWeight: 600, color: '#f3f4f6' }}>
                  {resolvedLayout.diagnostics.usableArea.width} × {resolvedLayout.diagnostics.usableArea.height}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca3af' }}>Scale Multiplier:</span>
                <span style={{ fontWeight: 600, color: '#f3f4f6' }}>
                  {resolvedLayout.diagnostics.appliedConstraints.viewingDistanceMultiplier}x
                </span>
              </div>
              {resolvedLayout.diagnostics.appliedConstraints.minTapTarget && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Min Tap Target:</span>
                  <span style={{ fontWeight: 600, color: '#10b981' }}>
                    {resolvedLayout.diagnostics.appliedConstraints.minTapTarget}px
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Priority Degradation Trace */}
          <section>
            <h2
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#9ca3af',
                marginBottom: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertTriangle size={14} color="#f59e0b" />
              Degradation Report
            </h2>

            {resolvedLayout.diagnostics.droppedElements.length === 0 ? (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <CheckCircle2 size={16} />
                All 5 elements fit within constraints. Zero dropped.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {resolvedLayout.diagnostics.droppedElements.map(dropped => (
                  <div
                    key={dropped.id}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ color: '#f87171' }}>
                        Dropped: {dropped.id} ({dropped.role})
                      </strong>
                      <span
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          color: '#fca5a5',
                        }}
                      >
                        Priority {dropped.priority}
                      </span>
                    </div>
                    <p style={{ color: '#d1d5db', lineHeight: 1.35 }}>{dropped.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Algorithm Step Trace */}
          <section>
            <h2
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#9ca3af',
                marginBottom: '0.5rem',
                fontWeight: 700,
              }}
            >
              Execution Trace
            </h2>
            <div
              style={{
                background: '#030712',
                borderRadius: '0.5rem',
                padding: '0.65rem',
                fontSize: '0.7rem',
                fontFamily: 'JetBrains Mono, monospace',
                color: '#9ca3af',
                maxHeight: '160px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              {resolvedLayout.diagnostics.executionSteps.map((step, idx) => (
                <div key={idx} style={{ color: step.includes('Degradation') ? '#f59e0b' : '#9ca3af' }}>
                  &gt; {step}
                </div>
              ))}
            </div>
          </section>
        </aside>

        {/* Right Area: Interactive Ad Preview Stage */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: 'radial-gradient(circle at center, #1e293b 0%, #0b0f19 100%)',
            overflow: 'auto',
            position: 'relative',
          }}
        >
          {/* Surface Meta Pill */}
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              background: 'rgba(31, 41, 55, 0.8)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '9999px',
              padding: '0.4rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              fontSize: '0.8rem',
              color: '#9ca3af',
              zIndex: 10,
            }}
          >
            <span>
              <strong style={{ color: '#fff' }}>{activeSurface.name}</strong>
            </span>
            <span>&bull;</span>
            <span>
              Target: <strong style={{ color: '#38bdf8' }}>{activeSurface.width} × {activeSurface.height} px</strong>
            </span>
            <span>&bull;</span>
            <span>
              Renderer: <strong style={{ color: '#10b981', textTransform: 'uppercase' }}>{renderMode}</strong>
            </span>
            {previewScale < 1 && (
              <>
                <span>&bull;</span>
                <span style={{ color: '#f59e0b' }}>
                  Preview Scaled to {Math.round(previewScale * 100)}%
                </span>
              </>
            )}
          </div>

          {/* Scaled Preview Frame */}
          <div
            style={{
              transform: `scale(${previewScale})`,
              transformOrigin: 'center center',
              transition: 'transform 0.25s ease',
            }}
          >
            {renderMode === 'dom' ? (
              <AdRendererDOM
                layout={resolvedLayout}
                spec={defaultAdSpec}
                showSafeAreaGuide={showSafeArea}
              />
            ) : (
              <AdRendererCanvas
                layout={resolvedLayout}
                spec={defaultAdSpec}
                showSafeAreaGuide={showSafeArea}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

interface SurfaceOptionProps {
  title: string;
  dims: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  badge?: string;
}

function SurfaceOption({ title, dims, icon, active, onClick, badge }: SurfaceOptionProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: `1px solid ${active ? '#6366f1' : '#374151'}`,
        background: active ? 'rgba(99, 102, 241, 0.15)' : '#1f2937',
        color: active ? '#fff' : '#d1d5db',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ color: active ? '#818cf8' : '#9ca3af' }}>{icon}</div>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{title}</div>
          <div style={{ fontSize: '0.75rem', color: active ? '#c7d2fe' : '#9ca3af' }}>{dims}</div>
        </div>
      </div>
      {badge && (
        <span
          style={{
            fontSize: '0.65rem',
            padding: '2px 6px',
            borderRadius: '4px',
            background: badge === 'Priority Drop' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(168, 85, 247, 0.2)',
            color: badge === 'Priority Drop' ? '#fbbf24' : '#c084fc',
            border: `1px solid ${badge === 'Priority Drop' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(168, 85, 247, 0.4)'}`,
            fontWeight: 700,
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
