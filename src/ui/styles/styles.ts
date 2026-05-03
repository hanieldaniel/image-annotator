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

  .im-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    background: #2a2a2a;
    border-bottom: 1px solid #333;
    flex-shrink: 0;
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
    flex-direction: row;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 4px;
    padding: 8px 12px;
    background: #2a2a2a;
    border-top: 1px solid #333;
    flex-shrink: 0;
  }

  .im-tools-row {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .im-options-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-left: 12px;
    border-left: 1px solid #444;
    flex-wrap: wrap;
  }

  .im-history,
  .im-zoom {
    display: flex;
    gap: 4px;
    align-items: center;
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

  .im-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #aaa;
  }

  .im-label input[type="range"] {
    width: 80px;
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
  }

  .im-label input[type="range"]::-webkit-slider-runnable-track {
    height: 2px;
    background: #555;
    border-radius: 1px;
  }

  .im-label input[type="range"]::-moz-range-track {
    height: 2px;
    background: #555;
    border-radius: 1px;
  }

  .im-label input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #2563eb;
    margin-top: -5px;
    transition: background 0.15s;
  }

  .im-label input[type="range"]::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: none;
    background: #2563eb;
    transition: background 0.15s;
  }

  .im-label input[type="range"]:hover::-webkit-slider-thumb { background: #3b82f6; }
  .im-label input[type="range"]:hover::-moz-range-thumb { background: #3b82f6; }
  .im-label input[type="color"] { width: 28px; height: 28px; border: none; border-radius: 4px; cursor: pointer; padding: 0; }

  .im-actions {
    display: flex;
    justify-content: center;
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
