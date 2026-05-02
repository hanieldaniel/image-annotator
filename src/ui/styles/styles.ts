export const STYLES = `
  :host { all: initial; font-family: system-ui, sans-serif; }

  .im-modal { display: none; }
  .im-modal--open { display: block; }

  .im-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .im-dialog {
    background: #1e1e1e;
    border-radius: 10px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.5);
    display: flex;
    flex-direction: column;
    width: min(95vw, calc(100vw - 32px));
    height: min(95vh, calc(100vh - 32px));
    overflow: hidden;
  }

  .im-canvas-wrap {
    overflow: auto;
    flex: 1;
    min-height: 0;
    position: relative;
    background: #111;
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
  }

  .im-canvas-wrap canvas {
    display: block;
    cursor: crosshair;
    flex-shrink: 0;
    margin: 0 auto;
  }

  .im-canvas-wrap.im-select-mode canvas { cursor: default; }

  .im-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #2a2a2a;
    flex-wrap: wrap;
    border-top: 1px solid #333;
  }

  .im-tools,
  .im-history,
  .im-zoom {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .im-divider {
    width: 1px;
    height: 28px;
    background: #444;
    margin: 0 4px;
  }

  .im-tool-btn {
    width: 34px;
    height: 34px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    color: #ccc;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    transition: background 0.15s, border-color 0.15s;
  }

  .im-tool-btn:hover { background: #3a3a3a; }
  .im-tool-btn.im-active { background: #2563eb; border-color: #3b82f6; color: #fff; }

  .im-tool-btn svg { width: 100%; height: 100%; }

  .im-zoom-level {
    font-size: 11px;
    color: #aaa;
    min-width: 36px;
    text-align: center;
  }

  .im-controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .im-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #aaa;
  }

  .im-label input[type="range"] { width: 72px; accent-color: #2563eb; }
  .im-label input[type="color"] { width: 28px; height: 28px; border: none; border-radius: 4px; cursor: pointer; padding: 0; }

  .im-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 10px 14px;
    background: #2a2a2a;
    border-top: 1px solid #333;
  }

  .im-btn {
    padding: 7px 20px;
    border-radius: 6px;
    border: none;
    font-size: 14px;
    cursor: pointer;
    font-weight: 500;
  }

  .im-btn-cancel { background: #3a3a3a; color: #ccc; }
  .im-btn-cancel:hover { background: #444; }
  .im-btn-save { background: #2563eb; color: #fff; }
  .im-btn-save:hover { background: #1d4ed8; }
`
