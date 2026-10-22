import assert from "node:assert/strict";
import { test } from "node:test";
import { PRESET_IDS } from "../src/shared/spec";
import { presetControls } from "../webview/lib/preset-controls";

test("retro3d shows face and depth colours and the arc", () => {
    assert.deepEqual(presetControls("retro3d"), {
        colorA: "Face colour",
        colorB: "Depth colour",
        arc: true,
    });
});

test("neon shows only the glow colour and the arc", () => {
    assert.deepEqual(presetControls("neon"), {
        colorA: "Glow colour",
        colorB: null,
        arc: true,
    });
});

test("chrome shows no colours, only the arc", () => {
    assert.deepEqual(presetControls("chrome"), {
        colorA: null,
        colorB: null,
        arc: true,
    });
});

test("outline and bubble show fill and outline colours and the arc", () => {
    for (const preset of ["outline", "bubble"] as const) {
        assert.deepEqual(presetControls(preset), {
            colorA: "Fill colour",
            colorB: "Outline colour",
            arc: true,
        });
    }
});

test("wave shows no colours and no arc", () => {
    assert.deepEqual(presetControls("wave"), {
        colorA: null,
        colorB: null,
        arc: false,
    });
});

test("every preset has an entry and callers get their own copy", () => {
    for (const preset of PRESET_IDS) {
        const shown = presetControls(preset);
        shown.arc = !shown.arc;
        assert.notEqual(presetControls(preset).arc, shown.arc);
    }
});
