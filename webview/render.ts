import type { FontId, PresetId, WordArtSpec } from "../src/shared/spec";
import { glyphPositions, wavePositions } from "./lib/arc";

export type Ink = {
    width: number;
    left: number;
    right: number;
    ascent: number;
    descent: number;
};

export type Measure = (text: string) => Ink;

export type FontStacks = Record<FontId, string>;

type Run = { text: string; x: number; y: number; angle: number; ink: Ink };

export type WordArtLayout = {
    width: number;
    height: number;
    runs: Run[];
    inkLeft: number;
    inkRight: number;
};

type Pad = { left: number; top: number; right: number; bottom: number };

type Ctx = CanvasRenderingContext2D;

const LINE_PITCH = 1.2;
const INK = "#0f172a";
const RETRO_LAYERS = 14;
const RETRO_STEP = 1.5;
const NEON_BLURS = [40, 20, 10, 0];
const CHROME_STOPS: [number, string][] = [
    [0, "#f8fafc"],
    [0.45, "#94a3b8"],
    [0.5, "#0f172a"],
    [0.55, "#e2e8f0"],
    [1, "#64748b"],
];
const RAINBOW_HUES = [0, 60, 120, 180, 240, 300];

const segmenter =
    typeof Intl !== "undefined" && "Segmenter" in Intl
        ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
        : null;

function glyphsOf(line: string): string[] {
    return segmenter
        ? Array.from(segmenter.segment(line), (part) => part.segment)
        : Array.from(line);
}

function padFor(preset: PresetId, size: number): Pad {
    const even = (n: number): Pad => ({ left: n, top: n, right: n, bottom: n });
    switch (preset) {
        case "retro3d": {
            const edge = size / 48 + 2;
            const depth = RETRO_LAYERS * RETRO_STEP;
            return {
                left: edge,
                top: edge,
                right: edge + depth,
                bottom: edge + depth,
            };
        }
        case "neon":
            return even(NEON_BLURS[0] * 1.2 + size / 36);
        case "chrome":
            return even(size / 48 + 2);
        case "outline": {
            const edge = size / 12 + 2;
            const drop = size / 16;
            return {
                left: edge,
                top: edge,
                right: edge + drop,
                bottom: edge + drop,
            };
        }
        case "bubble":
            return even(size / 8 + 2);
        case "wave":
            return even(size / 40 + 2);
    }
}

/** Straight lines are drawn whole to keep kerning and joined script letters; arcs and waves go glyph by glyph. */
export function layoutWordArt(
    spec: WordArtSpec,
    measure: Measure
): WordArtLayout {
    const { size } = spec;
    const perGlyph = spec.preset === "wave" || spec.arc !== 0;
    const runs: Run[] = [];
    spec.text.split("\n").forEach((line, row) => {
        const middle = row * size * LINE_PITCH;
        if (!perGlyph) {
            runs.push({
                text: line,
                x: 0,
                y: middle,
                angle: 0,
                ink: measure(line),
            });
            return;
        }
        const glyphs = glyphsOf(line);
        const inks = glyphs.map(measure);
        const widths = inks.map((ink) => ink.width);
        const positions =
            spec.preset === "wave"
                ? wavePositions(widths, size)
                : glyphPositions(widths, spec.arc, size);
        glyphs.forEach((text, i) => {
            const at = positions[i];
            runs.push({
                text,
                x: at.x,
                y: middle + at.y,
                angle: at.angle,
                ink: inks[i],
            });
        });
    });

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const run of runs) {
        const { left, right, ascent, descent } = run.ink;
        const cos = Math.cos(run.angle);
        const sin = Math.sin(run.angle);
        for (const [cx, cy] of [
            [-left, -ascent],
            [right, -ascent],
            [right, descent],
            [-left, descent],
        ]) {
            const x = run.x + cx * cos - cy * sin;
            const y = run.y + cx * sin + cy * cos;
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }
    }
    if (!Number.isFinite(minX)) {
        minX = minY = maxX = maxY = 0;
    }
    const pad = padFor(spec.preset, size);
    const dx = pad.left - minX;
    const dy = pad.top - minY;
    return {
        width: Math.ceil(maxX - minX + pad.left + pad.right),
        height: Math.ceil(maxY - minY + pad.top + pad.bottom),
        runs: runs.map((run) => ({ ...run, x: run.x + dx, y: run.y + dy })),
        inkLeft: minX + dx,
        inkRight: maxX + dx,
    };
}

/** Mixes towards white for a positive amount and towards black for a negative one. */
export function shade(hex: string, amount: number): string {
    const value = parseInt(hex.slice(1), 16);
    const target = amount < 0 ? 0 : 255;
    const t = Math.min(1, Math.abs(amount));
    const mix = (channel: number) =>
        Math.round(channel + (target - channel) * t);
    const r = mix((value >> 16) & 255);
    const g = mix((value >> 8) & 255);
    const b = mix(value & 255);
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function fontCss(spec: WordArtSpec, fonts: FontStacks): string {
    return `${spec.size}px ${fonts[spec.font]}`;
}

export function canvasMeasure(
    ctx: Ctx,
    spec: WordArtSpec,
    fonts: FontStacks
): Measure {
    ctx.font = fontCss(spec, fonts);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    return (text) => {
        const m = ctx.measureText(text);
        return {
            width: m.width,
            left: m.actualBoundingBoxLeft,
            right: m.actualBoundingBoxRight,
            ascent: m.actualBoundingBoxAscent,
            descent: m.actualBoundingBoxDescent,
        };
    };
}

function eachRun(
    ctx: Ctx,
    layout: WordArtLayout,
    paint: (run: Run) => void,
    dx = 0,
    dy = 0
): void {
    for (const run of layout.runs) {
        if (run.text.trim() === "") continue;
        ctx.save();
        ctx.translate(run.x + dx, run.y + dy);
        if (run.angle !== 0) ctx.rotate(run.angle);
        paint(run);
        ctx.restore();
    }
}

const fill = (ctx: Ctx) => (run: Run) => ctx.fillText(run.text, 0, 0);
const stroke = (ctx: Ctx) => (run: Run) => ctx.strokeText(run.text, 0, 0);

function inkSpan(run: Run): { top: number; bottom: number } {
    const top = -run.ink.ascent;
    return { top, bottom: Math.max(run.ink.descent, top + 1) };
}

function verticalGradient(
    ctx: Ctx,
    run: Run,
    stops: [number, string][]
): CanvasGradient {
    const { top, bottom } = inkSpan(run);
    const gradient = ctx.createLinearGradient(0, top, 0, bottom);
    for (const [at, colour] of stops) gradient.addColorStop(at, colour);
    return gradient;
}

function retro3d(ctx: Ctx, layout: WordArtLayout, spec: WordArtSpec): void {
    ctx.fillStyle = shade(spec.colorB, -0.2);
    for (let layer = RETRO_LAYERS; layer >= 1; layer--) {
        const offset = layer * RETRO_STEP;
        eachRun(ctx, layout, fill(ctx), offset, offset);
    }
    const light = shade(spec.colorA, 0.3);
    eachRun(ctx, layout, (run) => {
        ctx.fillStyle = verticalGradient(ctx, run, [
            [0, spec.colorA],
            [1, light],
        ]);
        ctx.fillText(run.text, 0, 0);
    });
    ctx.strokeStyle = INK;
    ctx.lineWidth = spec.size / 24;
    eachRun(ctx, layout, stroke(ctx));
}

function neon(ctx: Ctx, layout: WordArtLayout, spec: WordArtSpec): void {
    // shadowBlur is in device pixels and ignores the canvas transform.
    const scale = ctx.getTransform().a;
    ctx.strokeStyle = spec.colorA;
    ctx.fillStyle = "#ffffff";
    ctx.lineWidth = spec.size / 18;
    ctx.shadowColor = spec.colorA;
    for (const blur of NEON_BLURS) {
        ctx.shadowBlur = blur * scale;
        eachRun(ctx, layout, stroke(ctx));
        eachRun(ctx, layout, fill(ctx));
    }
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
}

function chrome(ctx: Ctx, layout: WordArtLayout, spec: WordArtSpec): void {
    eachRun(ctx, layout, (run) => {
        ctx.fillStyle = verticalGradient(ctx, run, CHROME_STOPS);
        ctx.fillText(run.text, 0, 0);
    });
    ctx.strokeStyle = INK;
    ctx.lineWidth = spec.size / 24;
    eachRun(ctx, layout, stroke(ctx));
}

function outline(ctx: Ctx, layout: WordArtLayout, spec: WordArtSpec): void {
    const drop = spec.size / 16;
    ctx.lineWidth = spec.size / 6;
    ctx.strokeStyle = INK;
    ctx.fillStyle = INK;
    eachRun(ctx, layout, stroke(ctx), drop, drop);
    eachRun(ctx, layout, fill(ctx), drop, drop);
    ctx.strokeStyle = spec.colorB;
    eachRun(ctx, layout, stroke(ctx));
    ctx.fillStyle = spec.colorA;
    eachRun(ctx, layout, fill(ctx));
}

function bubble(ctx: Ctx, layout: WordArtLayout, spec: WordArtSpec): void {
    ctx.lineWidth = spec.size / 4;
    ctx.strokeStyle = spec.colorB;
    eachRun(ctx, layout, stroke(ctx));
    ctx.fillStyle = spec.colorA;
    eachRun(ctx, layout, fill(ctx));
    ctx.fillStyle = shade(spec.colorA, 0.25);
    eachRun(ctx, layout, (run) => {
        const { top, bottom } = inkSpan(run);
        ctx.beginPath();
        ctx.rect(
            -run.ink.left - 1,
            top - 1,
            run.ink.left + run.ink.right + 2,
            (bottom - top) * 0.35 + 1
        );
        ctx.clip();
        ctx.fillText(run.text, 0, 0);
    });
}

function wave(ctx: Ctx, layout: WordArtLayout, spec: WordArtSpec): void {
    const span = Math.max(1, layout.inkRight - layout.inkLeft);
    eachRun(ctx, layout, (run) => {
        // Each glyph is drawn from its own origin, so the gradient is shifted back to span the whole text.
        const gradient = ctx.createLinearGradient(
            layout.inkLeft - run.x,
            0,
            layout.inkLeft - run.x + span,
            0
        );
        RAINBOW_HUES.forEach((hue, i) =>
            gradient.addColorStop(
                i / (RAINBOW_HUES.length - 1),
                `hsl(${hue} 90% 55%)`
            )
        );
        ctx.fillStyle = gradient;
        ctx.fillText(run.text, 0, 0);
    });
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = spec.size / 20;
    eachRun(ctx, layout, stroke(ctx));
}

const PRESETS: Record<
    PresetId,
    (ctx: Ctx, layout: WordArtLayout, spec: WordArtSpec) => void
> = { retro3d, neon, chrome, outline, bubble, wave };

/** Draws at the origin in layout units; the caller scales the context and sizes the canvas from the same layout. */
export function renderWordArt(
    ctx: Ctx,
    spec: WordArtSpec,
    fonts: FontStacks
): WordArtLayout {
    const layout = layoutWordArt(spec, canvasMeasure(ctx, spec, fonts));
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    PRESETS[spec.preset](ctx, layout, spec);
    ctx.restore();
    return layout;
}
