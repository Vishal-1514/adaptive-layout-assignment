
import { useMemo, useState } from 'react';

import { defaultAdSpec } from './spec';
import {
  standardSurfaces,
  createCustomSurface,
  type SurfaceProfile,
} from './surfaces';
import { resolveLayout } from './resolver';
import { AdRendererDOM } from './render-dom';

import './index.css';

function App() {
  const [selectedSurface, setSelectedSurface] =
    useState<string>('mobileInterstitial');

  // Custom surface values
  const [customWidth, setCustomWidth] = useState(800);
  const [customHeight, setCustomHeight] = useState(350);

  // Get the current surface
  const activeSurface: SurfaceProfile = useMemo(() => {
    if (selectedSurface === 'custom') {
      return createCustomSurface({
        width: customWidth,
        height: customHeight,
        minTapTarget: 44,
        minTextSize: 14,
        viewingDistance: 'near',
        touchOnly: true,
      });
    }

    return standardSurfaces[selectedSurface];
  }, [selectedSurface, customWidth, customHeight]);

  // Resolve the ad layout
  const layout = useMemo(() => {
    return resolveLayout(defaultAdSpec, activeSurface);
  }, [activeSurface]);

  const visibleElements = layout.elements.filter(
    (element) => element.visible
  );

  return (
    <div className="app">
      <header className="header">
        <h1>Adaptive Layout Engine</h1>
        <p>
          A simple layout system for displaying ads on different surfaces.
        </p>
      </header>

      <main className="main">
        {/* Surface Selection */}
        <section className="card">
          <h2>Select Surface</h2>

          <div className="surface-list">
            {Object.entries(standardSurfaces).map(([id, surface]) => (
              <button
                key={id}
                className={
                  selectedSurface === id
                    ? 'surface-button selected'
                    : 'surface-button'
                }
                onClick={() => setSelectedSurface(id)}
              >
                <strong>{surface.name}</strong>
                <span>
                  {surface.width} × {surface.height}
                </span>
              </button>
            ))}

            <button
              className={
                selectedSurface === 'custom'
                  ? 'surface-button selected'
                  : 'surface-button'
              }
              onClick={() => setSelectedSurface('custom')}
            >
              <strong>Custom Surface</strong>
              <span>
                {customWidth} × {customHeight}
              </span>
            </button>
          </div>

          {/* Custom Surface Controls */}
          {selectedSurface === 'custom' && (
            <div className="custom-controls">
              <label>
                Width: {customWidth}px
                <input
                  type="range"
                  min="240"
                  max="2000"
                  value={customWidth}
                  onChange={(e) =>
                    setCustomWidth(Number(e.target.value))
                  }
                />
              </label>

              <label>
                Height: {customHeight}px
                <input
                  type="range"
                  min="140"
                  max="1200"
                  value={customHeight}
                  onChange={(e) =>
                    setCustomHeight(Number(e.target.value))
                  }
                />
              </label>
            </div>
          )}
        </section>

        {/* Surface Information */}
        <section className="card">
          <h2>Surface Information</h2>

          <div className="info-grid">
            <div>
              <span>Surface</span>
              <strong>{activeSurface.name}</strong>
            </div>

            <div>
              <span>Size</span>
              <strong>
                {activeSurface.width} × {activeSurface.height}
              </strong>
            </div>

            <div>
              <span>Strategy</span>
              <strong>{layout.diagnostics.strategy}</strong>
            </div>

            <div>
              <span>Visible Elements</span>
              <strong>{visibleElements.length}</strong>
            </div>

            <div>
              <span>Dropped Elements</span>
              <strong>
                {layout.diagnostics.droppedElements.length}
              </strong>
            </div>

            <div>
              <span>Aspect Ratio</span>
              <strong>{layout.diagnostics.aspectRatio}</strong>
            </div>
          </div>
        </section>

        {/* Ad Preview */}
        <section className="card preview-card">
          <h2>Ad Preview</h2>

          <div className="preview-container">
            <AdRendererDOM
              layout={layout}
              spec={defaultAdSpec}
            />
          </div>
        </section>

        {/* Dropped Elements */}
        <section className="card">
          <h2>Resolver Result</h2>

          {layout.diagnostics.droppedElements.length === 0 ? (
            <p className="success">
              All elements fit on this surface.
            </p>
          ) : (
            <div className="dropped-list">
              {layout.diagnostics.droppedElements.map((element) => (
                <div key={element.id} className="dropped-item">
                  <strong>
                    {element.id} — Priority {element.priority}
                  </strong>

                  <p>{element.reason}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;

