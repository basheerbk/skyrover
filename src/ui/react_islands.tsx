import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

type UiTelemetry = { name?: string; ts?: string; payload?: Record<string, unknown> };

function StatusIsland() {
  const [telemetry, setTelemetry] = useState<UiTelemetry | null>(null);
  useEffect(() => {
    const id = window.setInterval(() => {
      setTelemetry((window as any).BlockIDE_UI_TELEMETRY_LAST || null);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="react-status-island">
      <span className="chip">UI Modern</span>
      <span className="dot-sep">•</span>
      <span>{(window as any).BLOCKIDE_UI_VERSION || 'legacy'}</span>
      {telemetry?.name ? (
        <>
          <span className="dot-sep">•</span>
          <span title={telemetry.ts || ''}>{telemetry.name}</span>
        </>
      ) : null}
    </div>
  );
}

function mountIsland(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const root = createRoot(el);
  root.render(<StatusIsland />);
}

if (typeof window !== 'undefined') {
  const flags = (window as any).BLOCKIDE_UI_FLAGS || {};
  if (flags.enableModernIslands !== false) {
    document.addEventListener('DOMContentLoaded', () => {
      mountIsland('react_status_island');
    });
  }
}

