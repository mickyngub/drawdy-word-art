export type GlyphPosition = { x: number; y: number; angle: number };

const WAVE_AMPLITUDE = 0.15;
const WAVE_GLYPHS = 6;

function straight(widths: number[]): number[] {
    const total = widths.reduce((sum, width) => sum + width, 0);
    let left = -total / 2;
    return widths.map((width) => {
        const centre = left + width / 2;
        left += width;
        return centre;
    });
}

/**
 * Glyph centres relative to the middle of the line. Arc 100 bends the line into a half circle,
 * upward for a positive arc and downward for a negative one.
 */
export function glyphPositions(
    widths: number[],
    arc: number,
    size: number
): GlyphPosition[] {
    const centres = straight(widths);
    const total = widths.reduce((sum, width) => sum + width, 0);
    const sweep = (Math.PI * Math.abs(arc)) / 100;
    if (sweep === 0 || total === 0) {
        return centres.map((x) => ({ x, y: 0, angle: 0 }));
    }
    // The floor keeps one or two letters from piling up on a circle smaller than they are.
    const radius = Math.max(total / sweep, size / 2);
    const up = arc > 0 ? 1 : -1;
    return centres.map((along) => {
        const turn = along / radius;
        return {
            x: radius * Math.sin(turn),
            y: up * radius * (1 - Math.cos(turn)),
            angle: up * turn,
        };
    });
}

export function wavePositions(widths: number[], size: number): GlyphPosition[] {
    return straight(widths).map((x, i) => ({
        x,
        y: size * WAVE_AMPLITUDE * Math.sin((2 * Math.PI * i) / WAVE_GLYPHS),
        angle: 0,
    }));
}
