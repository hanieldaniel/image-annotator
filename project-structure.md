image-annotator/
├── src/
│   ├── index.ts                  ← Public API + all exports
│   ├── types.ts                  ← All TypeScript interfaces
│   ├── core/
│   │   ├── Annotator.ts          ← Main class, modal, toolbar orchestration
│   │   ├── CanvasRenderer.ts     ← Draws all 5 annotation types
│   │   ├── ToolManager.ts        ← Mouse/touch event → annotation objects
│   │   ├── History.ts            ← Undo/redo stack
│   │   ├── Export.ts             ← PNG/JPEG → blob + dataUrl + download()
│   │   └── __tests__/            ← Unit tests (vitest)
│   ├── sources/
│   │   ├── ScreenshotCapture.ts  ← screenshot source via overlay + html2canvas
│   │   ├── DomCapture.ts         ← dom capture helper via html2canvas
│   │   ├── FileUpload.ts         ← fromFile() + openFilePicker()
│   │   └── CameraCapture.ts      ← fromCamera() via getUserMedia
│   └── ui/
│       ├── icons.ts              ← SVG icons for all tools
│       ├── toolbar.ts            ← Toolbar HTML generation + update helpers
│       └── styles/
│           └── styles.ts         ← All styles as a template string (Shadow DOM scoped)
├── demo/                         ← Vite dev demo (points to ../dist)
├── docs/
│   └── adr/                      ← Architecture decision records
├── package.json                  ← ESM + CJS dual build via tsup
├── tsconfig.json
├── tsup.config.ts
└── README.md
