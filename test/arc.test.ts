import assert from "node:assert/strict";
import { test } from "node:test";
import { glyphPositions, wavePositions } from "../webview/lib/arc";

const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;

test("arc 0 keeps every glyph on one line, unrotated and centred", () => {
    const positions = glyphPositions([10, 20, 30], 0, 96);
    assert.deepEqual(
        positions.map((p) => [p.y, p.angle]),
        [
            [0, 0],
            [0, 0],
            [0, 0],
        ]
    );
    assert.deepEqual(
        positions.map((p) => p.x),
        [-25, -10, 15]
    );
});

test("arc 50 is symmetric about the centre with the middle glyph highest", () => {
    const positions = glyphPositions([40, 40, 40, 40, 40], 50, 96);
    const middle = positions[2];
    assert.ok(
        close(middle.x, 0) && close(middle.y, 0) && close(middle.angle, 0)
    );
    for (let i = 0; i < 2; i++) {
        const left = positions[i];
        const right = positions[4 - i];
        assert.ok(close(left.x, -right.x));
        assert.ok(close(left.y, right.y));
        assert.ok(close(left.angle, -right.angle));
        assert.ok(left.y > middle.y);
    }
    assert.ok(positions[0].y > positions[1].y);
    assert.ok(positions[4].angle > 0);
});

test("the full arc sweeps half a circle across the text width", () => {
    const widths = [50, 50, 50, 50];
    const positions = glyphPositions(widths, 100, 48);
    const radius = 200 / Math.PI;
    const outer = 75 / radius;
    assert.ok(close(positions[3].angle, outer));
    assert.ok(close(positions[3].x, radius * Math.sin(outer)));
});

test("a negative arc bends the other way", () => {
    const up = glyphPositions([40, 40, 40], 60, 96);
    const down = glyphPositions([40, 40, 40], -60, 96);
    assert.ok(down[0].y < down[1].y);
    for (let i = 0; i < 3; i++) {
        assert.ok(close(down[i].x, up[i].x));
        assert.ok(close(down[i].y, -up[i].y));
        assert.ok(close(down[i].angle, -up[i].angle));
    }
});

test("the wave repeats every six glyphs at 15% of the size", () => {
    const positions = wavePositions(Array(13).fill(10), 100);
    assert.ok(close(positions[0].y, 0));
    assert.ok(close(positions[6].y, 0));
    assert.ok(close(positions[1].y, positions[7].y));
    const peak = Math.max(...positions.map((p) => p.y));
    assert.ok(peak <= 15 + 1e-9 && peak > 12);
    assert.ok(positions.every((p) => p.angle === 0));
});
