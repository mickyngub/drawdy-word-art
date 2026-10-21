import assert from "node:assert/strict";
import { test } from "node:test";
import type { DriverManifest } from "@drawdy/driver-protocol";
import * as driver from "../src/index";
import { overlaps } from "../src/lib/free-spot";
import { DEFAULT_STYLE, type WordArtSpec } from "../src/shared/spec";
import { boot, fakeHost } from "./fake-host";

const manifest = {
    driverId: "mickyngub.word-art",
    driverName: "Word Art",
} as DriverManifest;

const spec: WordArtSpec = {
    ...DEFAULT_STYLE,
    text: "Hello\nworld",
    preset: "neon",
    arc: 40,
};

const art = {
    dataUrl: "data:image/png;base64,AAAA",
    pixelWidth: 800,
    pixelHeight: 400,
    width: 400,
    height: 200,
    spec,
};

const own = (meta: unknown) =>
    (meta as Record<string, { v: number; spec: WordArtSpec }>)[
        manifest.driverId
    ];

const webviewDomId = `${manifest.driverId}:webview`;

const clickActionButton = () =>
    driver.onEvent({
        type: "subscription:dom:element-clicked",
        body: { domElementId: `${manifest.driverId}:action-button` },
    } as any);

test("activate touches only the dom permission", async () => {
    const host = fakeHost();
    await boot(driver, host, manifest);
    const types = host.types();
    assert.ok(types.includes("command:dom:create-action-button"));
    for (const type of types) {
        assert.match(type, /^(command|subscription):(dom|webview):/);
    }
});

test("the action button opens the panel, kept alive when closed and styled for the board", async () => {
    const host = fakeHost();
    await boot(driver, host, manifest);
    await clickActionButton();
    const create = host.sent.find((s) => s.type === "command:webview:create");
    assert.ok(create);
    assert.equal(create.req.webviewDomId, webviewDomId);
    assert.equal(create.req.keepStateWhenClosed, true);
    assert.ok(!create.req.htmlContent.includes("/*__DRAWDY_STYLING__*/"));
    assert.ok(create.req.htmlContent.includes("color-scheme: light;"));
});

test("close hides the panel", async () => {
    const host = fakeHost();
    const { message } = await boot(driver, host, manifest);
    await message({ type: "ready" });
    host.clear();
    await message({ type: "close" });
    const hide = host.sent.find((s) => s.type === "command:webview:hide");
    assert.ok(hide);
    assert.equal(hide.req.webviewDomId, webviewDomId);
});

test("the first ready loads settings and subscribes to the selection, once", async () => {
    const host = fakeHost({
        kv: { settings: { style: { preset: "chrome" } } },
    });
    const { message } = await boot(driver, host, manifest);
    await message({ type: "ready" });
    await message({ type: "ready" });
    const types = host.types();
    assert.equal(types.filter((t) => t === "command:kv-storage:get").length, 1);
    assert.equal(
        types.filter((t) => t === "subscription:scene:drawdy-element-selection")
            .length,
        1
    );
    const init = host.posted.find((m) => m.type === "init");
    assert.deepEqual(init.settings, { style: { preset: "chrome" } });
});

test("a theme change reaches the open panel", async () => {
    const host = fakeHost();
    const { message } = await boot(driver, host, manifest);
    await message({ type: "ready" });
    host.clear();
    await driver.onEvent({
        type: "subscription:dom:theme-changed",
        body: { styling: { theme: "dark", primary: "#818cf8" } },
    } as any);
    assert.deepEqual(host.posted, [
        {
            type: "theme",
            cssVars: "color-scheme: dark;--drawdy-primary: #818cf8;",
        },
    ]);
});

test("selection events are ignored while the panel is closed", async () => {
    const host = fakeHost();
    const { message } = await boot(driver, host, manifest);
    await message({ type: "ready" });
    await message({ type: "close" });
    host.clear();
    await driver.onEvent({
        type: "subscription:scene:drawdy-element-selection",
        body: { drawdyElementIds: ["x"] },
    } as any);
    assert.equal(host.sent.length, 0);
});

test("a denied board read on ready ends in the permission message, not a hang", async () => {
    const host = fakeHost({ denied: ["command:scene"] });
    const { message } = await boot(driver, host, manifest);
    await message({ type: "ready" });
    assert.deepEqual(host.posted.at(-1), {
        type: "error",
        message: driver.NEEDS_PERMISSION,
    });
});

test("undo and redo from the panel go to the board history", async () => {
    const host = fakeHost();
    const { message } = await boot(driver, host, manifest);
    await message({ type: "undo" });
    await message({ type: "redo" });
    const types = host.types();
    assert.ok(types.includes("command:history:undo"));
    assert.ok(types.includes("command:history:redo"));
});

test("place stores the spec on the image and a second place lands beside the first", async () => {
    const host = fakeHost();
    const { message } = await boot(driver, host, manifest);
    await message({ type: "ready" });
    await message({ type: "place", ...art });
    await message({ type: "place", ...art });
    const placed = [...host.elements.values()];
    assert.equal(placed.length, 2);
    for (const el of placed) {
        assert.equal(el.type, "image");
        assert.equal(el.url, art.dataUrl);
        assert.equal(el.width, art.width);
        assert.equal(el.height, art.width / 2);
        assert.deepEqual(own(el.meta), { v: 1, spec });
    }
    const [a, b] = placed.map((el) => ({
        x: el.x as number,
        y: el.y as number,
        width: el.width as number,
        height: el.height as number,
    }));
    assert.equal(overlaps(a, b), false);
    const selections = host.sent.filter(
        (s) => s.type === "command:scene:set-selection"
    );
    assert.deepEqual(
        selections.map((s) => s.req.drawdyElementIds),
        placed.map((el) => [el.drawdyElementId])
    );
    assert.equal(host.posted.filter((m) => m.type === "placed").length, 2);
});

test("a spec that does not survive normalising is refused", async () => {
    const host = fakeHost();
    const { message } = await boot(driver, host, manifest);
    await message({ type: "ready" });
    await message({ type: "place", ...art, spec: { ...spec, text: "  " } });
    assert.equal(host.elements.size, 0);
    assert.equal(host.posted.at(-1).type, "error");
});

test("a full board is reported instead of a silent success", async () => {
    const host = fakeHost({ full: true });
    const { message } = await boot(driver, host, manifest);
    await message({ type: "ready" });
    await message({ type: "place", ...art });
    assert.deepEqual(host.posted.at(-1), {
        type: "error",
        message: driver.BOARD_FULL,
    });
});

test("edit selected loads the selected word art into the panel", async () => {
    const host = fakeHost();
    const { message } = await boot(driver, host, manifest);
    await message({ type: "ready" });
    host.put({
        drawdyElementId: "old",
        type: "image",
        x: 0,
        y: 0,
        width: 300,
        height: 150,
        meta: { [manifest.driverId]: { v: 1, spec } },
    });
    host.select(["old"]);
    await message({ type: "edit-selected" });
    assert.deepEqual(host.posted.at(-1), { type: "load", spec });
});

test("edit selected with nothing of ours selected loads nothing", async () => {
    const host = fakeHost();
    const { message } = await boot(driver, host, manifest);
    await message({ type: "ready" });
    host.put({ drawdyElementId: "pic", type: "image", x: 0, y: 0 });
    host.select(["pic"]);
    await message({ type: "edit-selected" });
    assert.ok(!host.posted.some((m) => m.type === "load"));
    assert.equal(host.posted.at(-1).type, "error");
});

test("update replaces the image in place, keeping its spot, layer, group, frame, opacity and lock", async () => {
    const host = fakeHost();
    const { message } = await boot(driver, host, manifest);
    await message({ type: "ready" });
    host.put({
        drawdyElementId: "old",
        type: "image",
        x: 120,
        y: -80,
        width: 300,
        height: 150,
        rotation: 0.3,
        opacity: 0.5,
        layer: 4,
        frameId: "frame-1",
        groupId: "group-1",
        locked: false,
        meta: { [manifest.driverId]: { v: 1, spec } },
    });
    host.select(["old"]);
    await message({ type: "edit-selected" });
    // Moved and locked after Edit selected: the update must use the new values.
    host.put({ ...host.elements.get("old")!, x: 500, locked: true });
    const changed: WordArtSpec = { ...spec, text: "Bye", preset: "wave" };
    await message({ type: "update", ...art, spec: changed });

    assert.equal(host.elements.has("old"), false);
    const [fresh] = [...host.elements.values()];
    assert.equal(fresh.x, 500);
    assert.equal(fresh.y, -80);
    assert.equal(fresh.width, 300);
    assert.equal(fresh.height, 150);
    assert.equal(fresh.layer, 4);
    assert.equal(fresh.frameId, "frame-1");
    assert.equal(fresh.groupId, "group-1");
    assert.equal(fresh.opacity, 0.5);
    assert.equal(fresh.locked, true);
    assert.deepEqual(own(fresh.meta).spec, changed);

    const order = host
        .types()
        .filter((t) => /remove-drawdy|add-drawdy/.test(t));
    assert.deepEqual(order, [
        "command:scene:remove-drawdy-elements",
        "command:scene:add-drawdy-elements",
    ]);
    assert.deepEqual(host.posted.at(-2), {
        type: "placed",
        mode: "update",
        undoSteps: 3,
        rotationReset: true,
    });
});

test("a second update replaces the image the first one made", async () => {
    const host = fakeHost();
    const { message } = await boot(driver, host, manifest);
    await message({ type: "ready" });
    host.put({
        drawdyElementId: "old",
        type: "image",
        x: 0,
        y: 0,
        width: 300,
        height: 150,
        meta: { [manifest.driverId]: { v: 1, spec } },
    });
    host.select(["old"]);
    await message({ type: "edit-selected" });
    await message({ type: "update", ...art });
    await message({ type: "update", ...art });
    assert.equal(host.elements.size, 1);
    assert.equal(host.posted.at(-2).undoSteps, 2);
});

test("update after stop editing places nothing", async () => {
    const host = fakeHost();
    const { message } = await boot(driver, host, manifest);
    await message({ type: "ready" });
    host.put({
        drawdyElementId: "old",
        type: "image",
        x: 0,
        y: 0,
        width: 300,
        height: 150,
        meta: { [manifest.driverId]: { v: 1, spec } },
    });
    host.select(["old"]);
    await message({ type: "edit-selected" });
    await message({ type: "stop-edit" });
    await message({ type: "update", ...art });
    assert.deepEqual([...host.elements.keys()], ["old"]);
    assert.equal(host.posted.at(-1).type, "error");
});

test("an update whose image was deleted ends the edit", async () => {
    const host = fakeHost();
    const { message } = await boot(driver, host, manifest);
    await message({ type: "ready" });
    host.put({
        drawdyElementId: "old",
        type: "image",
        x: 0,
        y: 0,
        width: 300,
        height: 150,
        meta: { [manifest.driverId]: { v: 1, spec } },
    });
    host.select(["old"]);
    await message({ type: "edit-selected" });
    host.elements.delete("old");
    await message({ type: "update", ...art });
    assert.equal(host.elements.size, 0);
    assert.ok(host.posted.some((m) => m.type === "edit-ended"));
});

test("a failed add after the remove is undone, so the old image comes back", async () => {
    const host = fakeHost({ failAdd: true });
    const { message } = await boot(driver, host, manifest);
    await message({ type: "ready" });
    host.put({
        drawdyElementId: "old",
        type: "image",
        x: 0,
        y: 0,
        width: 300,
        height: 150,
        meta: { [manifest.driverId]: { v: 1, spec } },
    });
    host.select(["old"]);
    await message({ type: "edit-selected" });
    await message({ type: "update", ...art });
    assert.ok(host.types().includes("command:history:undo"));
    assert.ok(host.elements.has("old"));
    assert.equal(host.posted.at(-1).type, "error");
});

test("the panel learns whether the selection is editable", async () => {
    const host = fakeHost();
    const { message } = await boot(driver, host, manifest);
    await message({ type: "ready" });
    host.put({
        drawdyElementId: "old",
        type: "image",
        x: 0,
        y: 0,
        width: 300,
        height: 150,
        meta: { [manifest.driverId]: { v: 1, spec } },
    });
    host.put({ drawdyElementId: "pic", type: "image", x: 400, y: 0 });
    await driver.onEvent({
        type: "subscription:scene:drawdy-element-selection",
        body: { drawdyElementIds: ["old"] },
    } as any);
    assert.deepEqual(host.posted.at(-1), { type: "selection", editable: true });
    await driver.onEvent({
        type: "subscription:scene:drawdy-element-selection",
        body: { drawdyElementIds: ["pic"] },
    } as any);
    assert.deepEqual(host.posted.at(-1), {
        type: "selection",
        editable: false,
    });
});

test("a denied board read on edit selected ends in the permission message", async () => {
    const host = fakeHost({ denied: ["command:scene"] });
    const { message } = await boot(driver, host, manifest);
    await message({ type: "ready" });
    host.clear();
    await message({ type: "edit-selected" });
    assert.deepEqual(host.posted.at(-1), {
        type: "error",
        message: driver.NEEDS_PERMISSION,
    });
});
