import assert from "node:assert/strict";
import { test } from "node:test";
import {
    DEFAULT_STYLE,
    normaliseSpec,
    normaliseStyle,
    normaliseText,
    styleOf,
    type WordArtSpec,
} from "../src/shared/spec";

const SPEC: WordArtSpec = {
    text: "Hello\nworld",
    preset: "bubble",
    font: "pacifico",
    colorA: "#123abc",
    colorB: "#fedcba",
    arc: -40,
    size: 150,
};

test("a spec survives the round trip through board meta", () => {
    assert.deepEqual(normaliseSpec(JSON.parse(JSON.stringify(SPEC))), SPEC);
});

test("specs without text are refused", () => {
    assert.equal(normaliseSpec(null), null);
    assert.equal(normaliseSpec("text"), null);
    assert.equal(normaliseSpec({ preset: "neon" }), null);
    assert.equal(normaliseSpec({ text: " \n\t " }), null);
});

test("an unknown preset becomes retro3d and other bad values fall back or clamp", () => {
    assert.deepEqual(
        normaliseSpec({
            text: "Hi",
            preset: "sparkle",
            font: "comic-sans",
            colorA: "red",
            colorB: "#ABCDEF",
            arc: 250.4,
            size: 12,
        }),
        {
            text: "Hi",
            preset: "retro3d",
            font: DEFAULT_STYLE.font,
            colorA: DEFAULT_STYLE.colorA,
            colorB: "#abcdef",
            arc: 100,
            size: 48,
        }
    );
    assert.deepEqual(normaliseStyle({ arc: -999, size: 999.6 }), {
        ...DEFAULT_STYLE,
        arc: -100,
        size: 200,
    });
    assert.deepEqual(normaliseStyle({ arc: "10", size: NaN }), DEFAULT_STYLE);
});

test("more than three lines are joined into the third", () => {
    assert.equal(normaliseText("a\nb\nc\nd\n\ne"), "a\nb\nc d e");
    assert.equal(normaliseText("one\r\ntwo"), "one\ntwo");
});

test("text is trimmed and cut to 80 characters", () => {
    assert.equal(normaliseText("  hi  \n  there\t"), "hi\nthere");
    const long = normaliseText("x".repeat(100));
    assert.equal(long.length, 80);
    assert.equal(Array.from(normaliseText("😀".repeat(90))).length, 80);
});

test("the remembered style leaves the text out", () => {
    assert.deepEqual(styleOf(SPEC), {
        preset: "bubble",
        font: "pacifico",
        colorA: "#123abc",
        colorB: "#fedcba",
        arc: -40,
        size: 150,
    });
});
