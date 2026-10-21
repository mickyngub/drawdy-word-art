export const PRESET_IDS = [
    "retro3d",
    "neon",
    "chrome",
    "outline",
    "bubble",
    "wave",
] as const;
export type PresetId = (typeof PRESET_IDS)[number];

export const FONT_IDS = [
    "bungee",
    "pacifico",
    "righteous",
    "anton",
    "rubik-mono-one",
] as const;
export type FontId = (typeof FONT_IDS)[number];

export const ARC = { min: -100, max: 100 };
export const SIZE = { min: 48, max: 200 };
export const MAX_TEXT_LENGTH = 80;
export const MAX_LINES = 3;

export type WordArtStyle = {
    preset: PresetId;
    font: FontId;
    colorA: string;
    colorB: string;
    arc: number;
    size: number;
};

export type WordArtSpec = WordArtStyle & { text: string };

export const DEFAULT_STYLE: WordArtStyle = {
    preset: "retro3d",
    font: "bungee",
    colorA: "#facc15",
    colorB: "#db2777",
    arc: 0,
    size: 96,
};

const HEX = /^#[0-9a-f]{6}$/i;

function oneOf<T>(list: readonly T[], value: unknown, fallback: T): T {
    return list.includes(value as T) ? (value as T) : fallback;
}

function clampInt(
    value: unknown,
    range: { min: number; max: number },
    fallback: number
): number {
    if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
    return Math.min(range.max, Math.max(range.min, Math.round(value)));
}

const hex = (value: unknown, fallback: string): string =>
    typeof value === "string" && HEX.test(value)
        ? value.toLowerCase()
        : fallback;

export function normaliseStyle(raw: unknown): WordArtStyle {
    const got =
        typeof raw === "object" && raw !== null
            ? (raw as Record<string, unknown>)
            : {};
    const d = DEFAULT_STYLE;
    return {
        preset: oneOf(PRESET_IDS, got.preset, d.preset),
        font: oneOf(FONT_IDS, got.font, d.font),
        colorA: hex(got.colorA, d.colorA),
        colorB: hex(got.colorB, d.colorB),
        arc: clampInt(got.arc, ARC, d.arc),
        size: clampInt(got.size, SIZE, d.size),
    };
}

/** Lines past the third are joined onto it, then the text is cut to 80 characters. */
export function normaliseText(raw: string): string {
    const lines = raw
        .replace(/\r\n?/g, "\n")
        .replace(/[\t\f\v]/g, " ")
        .trim()
        .split("\n")
        .map((line) => line.trim());
    const kept = lines.slice(0, MAX_LINES - 1);
    const rest = lines.slice(MAX_LINES - 1).filter((line) => line !== "");
    if (rest.length > 0) kept.push(rest.join(" "));
    return Array.from(kept.join("\n"))
        .slice(0, MAX_TEXT_LENGTH)
        .join("")
        .trim();
}

export function normaliseSpec(raw: unknown): WordArtSpec | null {
    if (typeof raw !== "object" || raw === null) return null;
    const got = raw as Record<string, unknown>;
    if (typeof got.text !== "string") return null;
    const text = normaliseText(got.text);
    if (text === "") return null;
    return { text, ...normaliseStyle(got) };
}

export function styleOf(spec: WordArtSpec): WordArtStyle {
    const { text: _text, ...style } = spec;
    return style;
}
