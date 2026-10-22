import type { PresetId } from "../../src/shared/spec";

/** The label for each colour a preset paints with, or null when it ignores that colour. */
export type PresetControls = {
    colorA: string | null;
    colorB: string | null;
    arc: boolean;
};

const CONTROLS: Record<PresetId, PresetControls> = {
    retro3d: { colorA: "Face colour", colorB: "Depth colour", arc: true },
    neon: { colorA: "Glow colour", colorB: null, arc: true },
    chrome: { colorA: null, colorB: null, arc: true },
    outline: { colorA: "Fill colour", colorB: "Outline colour", arc: true },
    bubble: { colorA: "Fill colour", colorB: "Outline colour", arc: true },
    wave: { colorA: null, colorB: null, arc: false },
};

export function presetControls(preset: PresetId): PresetControls {
    return { ...CONTROLS[preset] };
}
