image-annotator/
├── src/
│   ├── index.ts                  ← Public API + all exports
│   ├── types.ts                  ← All TypeScript interfaces
│   ├── core/
│   │   ├── Annotator.ts          ← Main class, modal, toolbar orchestration
│   │   ├── CanvasRenderer.ts     ← Draws all 6 annotation types
│   │   ├── ToolManager.ts        ← Mouse/touch event → annotation objects
│   │   ├── History.ts            ← Undo/redo stack
│   │   └── Export.ts             ← PNG/JPEG → blob + dataUrl + download()
│   ├── sources/
│   │   ├── DomCapture.ts         ← fromDom() via html2canvas
│   │   ├── FileUpload.ts         ← fromFile() + onPaste()
│   │   └── CameraCapture.ts      ← fromCamera() via getUserMedia
│   ├── ui/
│   │   ├── icons.ts              ← SVG icons for all tools
│   │   └── styles/annotator.css  ← All styles (Shadow DOM scoped)
│   └── utils/dom.ts
├── package.json                  ← ESM + CJS dual build via tsup
├── tsconfig.json
├── tsup.config.ts
└── README.md