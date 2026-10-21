import assert from "node:assert/strict";
import { test } from "node:test";
import {
    DEFAULT_STYLE,
    PRESET_IDS,
    type WordArtSpec,
} from "../src/shared/spec";
import { layoutWordArt, shade, type Measure } from "../webview/render";

const SIZE = 100;

const measure: Measure = (text) => {
    const width = Array.from(text).length * SIZE * 0.6;
    return {
        width,
        left: width / 2,
        right: width / 2,
        ascent: SIZE * 0.7,
        descent: SIZE * 0.2,
    };
};

test("every glyph's ink stays inside the image for each preset and arc", () => {
    for (const preset of PRESET_IDS) {
        for (const arc of [-100, -35, 0, 60, 100]) {
            const spec: WordArtSpec = {
                ...DEFAULT_STYLE,
                text: "Hello\nbig wide world\nOK",
                preset,
                arc,
                size: SIZE,
            };
            const layout = layoutWordArt(spec, measure);
            for (const run of layout.runs) {
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
                    assert.ok(x > 0 && x < layout.width, `${preset} ${arc}`);
                    assert.ok(y > 0 && y < layout.height, `${preset} ${arc}`);
                }
            }
        }
    }
});

test("straight lines stay whole, while arcs and the wave split into glyphs", () => {
    const base: WordArtSpec = { ...DEFAULT_STYLE, text: "Hi\nyou", size: SIZE };
    assert.deepEqual(
        layoutWordArt(base, measure).runs.map((run) => run.text),
        ["Hi", "you"]
    );
    for (const spec of [
        { ...base, arc: 20 },
        { ...base, preset: "wave" as const },
    ]) {
        assert.deepEqual(
            layoutWordArt(spec, measure).runs.map((run) => run.text),
            ["H", "i", "y", "o", "u"]
        );
    }
});

test("the wave ignores the arc", () => {
    const wave: WordArtSpec = {
        ...DEFAULT_STYLE,
        text: "Wavy text",
        preset: "wave",
        size: SIZE,
    };
    assert.deepEqual(
        layoutWordArt({ ...wave, arc: 80 }, measure),
        layoutWordArt(wave, measure)
    );
});

test("shade mixes towards white or black", () => {
    assert.equal(shade("#336699", 0), "#336699");
    assert.equal(shade("#000000", 0.3), "#4d4d4d");
    assert.equal(shade("#ffffff", -0.2), "#cccccc");
    assert.equal(shade("#336699", 1), "#ffffff");
});
