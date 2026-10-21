import type { WordArtSpec } from "./spec";

export type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type RenderedArt = {
    dataUrl: string;
    pixelWidth: number;
    pixelHeight: number;
    /** Board units: the art's layout size, before any downscaling for the 2048 px cap. */
    width: number;
    height: number;
    spec: WordArtSpec;
};

export type WebviewToDriver =
    | { type: "ready" }
    | { type: "settings"; settings: Record<string, unknown> }
    | ({ type: "place" } & RenderedArt)
    | ({ type: "update" } & RenderedArt)
    | { type: "edit-selected" }
    | { type: "stop-edit" }
    | { type: "undo" }
    | { type: "redo" }
    | { type: "close" };

export type DriverToWebview =
    | { type: "init"; settings?: Record<string, unknown> }
    | { type: "theme"; cssVars: string }
    | { type: "selection"; editable: boolean }
    | { type: "load"; spec: WordArtSpec }
    | { type: "edit-ended" }
    | { type: "placed"; mode: "new" }
    | {
          type: "placed";
          mode: "update";
          undoSteps: number;
          rotationReset: boolean;
      }
    | { type: "error"; message: string };
