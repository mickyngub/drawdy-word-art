import type { DriverToWebview, WebviewToDriver } from "../src/shared/messages";
import {
    ARC,
    DEFAULT_STYLE,
    FONT_IDS,
    MAX_TEXT_LENGTH,
    PRESET_IDS,
    SIZE,
    normaliseStyle,
    normaliseText,
    styleOf,
    type FontId,
    type PresetId,
    type WordArtSpec,
    type WordArtStyle,
} from "../src/shared/spec";
import { encodeImage } from "./export";
import { fontFailed, loadFont } from "./fonts";
import { FONT_NAMES, FONT_STACKS } from "./lib/font-faces";
import { isField, keyAction } from "./lib/keys";
import { presetControls } from "./lib/preset-controls";
import {
    canvasMeasure,
    layoutWordArt,
    renderWordArt,
    type WordArtLayout,
} from "./render";
import {
    el,
    makeChip,
    makeColorInput,
    makeOptionGrid,
    makeSlider,
    type Control,
} from "./ui";

type DrawdyWebviewApi = {
    postMessage(message: unknown, transfer?: Transferable[]): void;
    onMessage(listener: (message: unknown) => void): () => void;
};

declare function acquireDrawdyApi(): DrawdyWebviewApi;

const SETTINGS_DEBOUNCE_MS = 400;
const TYPING_DELAY_MS = 150;
const REPLY_TIMEOUT_MS = 20000;
const PREVIEW_INSET = 16;
const CHIP_SAMPLE = "Wow";
const CHIP_GLYPHS = 10;

const PRESET_NAMES: Record<PresetId, string> = {
    retro3d: "Retro 3D",
    neon: "Neon",
    chrome: "Chrome",
    outline: "Outline",
    bubble: "Bubble",
    wave: "Rainbow wave",
};

const api = acquireDrawdyApi();
const byId = <T extends HTMLElement>(id: string) =>
    document.getElementById(id) as T;

const banner = byId<HTMLDivElement>("edit-banner");
const stopEditButton = byId<HTMLButtonElement>("stop-edit");
const previewBox = byId<HTMLDivElement>("preview-box");
const previewCanvas = byId<HTMLCanvasElement>("preview");
const previewEmpty = byId<HTMLParagraphElement>("preview-empty");
const controlsRoot = byId<HTMLElement>("controls");
const textBox = byId<HTMLTextAreaElement>("text");
const textCount = byId<HTMLSpanElement>("text-count");
const presetsRow = byId<HTMLDivElement>("presets");
const statusLine = byId<HTMLDivElement>("status");
const actions = byId<HTMLDivElement>("actions");
const editSelectedButton = byId<HTMLButtonElement>("edit-selected");
const placeButton = byId<HTMLButtonElement>("place");
const updateButton = byId<HTMLButtonElement>("update");

let style: WordArtStyle = { ...DEFAULT_STYLE };
let hasText = false;
let editing = false;
let busy = false;
let busyTimer = 0;
let settingsTimer = 0;
let renderTimer = 0;
let renderToken = 0;
let fontNote: string | null = null;
const scratch = document.createElement("canvas").getContext("2d");

const chips = new Map<
    PresetId,
    { node: HTMLButtonElement; canvas: HTMLCanvasElement }
>();
const controls: {
    font?: Control<string>;
    colours?: HTMLElement;
    colorA?: ReturnType<typeof makeColorInput>;
    colorB?: ReturnType<typeof makeColorInput>;
    arc?: ReturnType<typeof makeSlider>;
    size?: Control<number>;
} = {};

function send(message: WebviewToDriver): void {
    api.postMessage(message);
}

function setStatus(text: string, tone: "" | "good" | "bad" = ""): void {
    statusLine.textContent = text;
    statusLine.dataset.tone = tone;
}

function currentSpec(): WordArtSpec | null {
    const text = normaliseText(textBox.value);
    return text === "" ? null : { text, ...style };
}

function measure(spec: WordArtSpec): WordArtLayout {
    if (!scratch) throw new Error("no canvas");
    return layoutWordArt(spec, canvasMeasure(scratch, spec, FONT_STACKS));
}

function paint(
    canvas: HTMLCanvasElement,
    spec: WordArtSpec,
    layout: WordArtLayout,
    roomW: number,
    roomH: number
): boolean {
    if (roomW <= 0 || roomH <= 0) return false;
    const fit = Math.min(roomW / layout.width, roomH / layout.height, 1);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(layout.width * fit * dpr));
    canvas.height = Math.max(1, Math.round(layout.height * fit * dpr));
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(fit * dpr, 0, 0, fit * dpr, 0, 0);
    renderWordArt(ctx, spec, FONT_STACKS);
    return true;
}

function paintPreview(spec: WordArtSpec): void {
    const layout = measure(spec);
    const roomW = previewBox.clientWidth - PREVIEW_INSET;
    const roomH = previewBox.clientHeight - PREVIEW_INSET;
    if (!paint(previewCanvas, spec, layout, roomW, roomH)) return;
    const fit = Math.min(roomW / layout.width, roomH / layout.height, 1);
    previewCanvas.style.setProperty(
        "--w",
        `${Math.round(layout.width * fit)}px`
    );
    previewCanvas.style.setProperty(
        "--h",
        `${Math.round(layout.height * fit)}px`
    );
    previewCanvas.hidden = false;
    previewEmpty.hidden = true;
}

function showEmpty(): void {
    previewCanvas.hidden = true;
    previewEmpty.hidden = false;
}

function chipText(): string {
    const first = normaliseText(textBox.value).split("\n")[0];
    const glyphs = Array.from(first);
    if (glyphs.length === 0) return CHIP_SAMPLE;
    return glyphs.length > CHIP_GLYPHS
        ? `${glyphs.slice(0, CHIP_GLYPHS - 1).join("")}…`
        : first;
}

function paintChips(): void {
    const text = chipText();
    for (const [preset, chip] of chips) {
        const { canvas } = chip;
        const dpr = window.devicePixelRatio || 1;
        const roomW = canvas.clientWidth;
        const roomH = canvas.clientHeight;
        if (roomW <= 0 || roomH <= 0) continue;
        const spec: WordArtSpec = { ...style, text, preset, arc: 0, size: 96 };
        const layout = measure(spec);
        const fit = Math.min(roomW / layout.width, roomH / layout.height);
        canvas.width = Math.round(roomW * dpr);
        canvas.height = Math.round(roomH * dpr);
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const k = fit * dpr;
        ctx.setTransform(
            k,
            0,
            0,
            k,
            ((roomW - layout.width * fit) / 2) * dpr,
            ((roomH - layout.height * fit) / 2) * dpr
        );
        renderWordArt(ctx, spec, FONT_STACKS);
    }
}

function updateChrome(): void {
    placeButton.disabled = !hasText || busy;
    updateButton.disabled = !hasText || busy;
    actions.dataset.editing = String(editing);
    editSelectedButton.textContent = editing ? "Edit" : "Edit selected";
    placeButton.textContent = editing ? "Place new" : "Place on board";
    placeButton.dataset.primary = String(!editing);
    updateButton.hidden = !editing;
    banner.hidden = !editing;
}

function noteFont(): void {
    const note = fontFailed(style.font)
        ? `${FONT_NAMES[style.font]} didn't load, so the browser's sans-serif font stands in.`
        : null;
    if (note === fontNote) return;
    if (fontNote && statusLine.textContent === fontNote) setStatus("");
    fontNote = note;
    if (note) setStatus(note, "bad");
}

function scheduleRender(delay = 0): void {
    if (renderTimer) clearTimeout(renderTimer);
    renderTimer = setTimeout(() => {
        renderTimer = 0;
        void render();
    }, delay) as unknown as number;
}

async function render(): Promise<void> {
    const token = ++renderToken;
    const spec = currentSpec();
    hasText = spec !== null;
    textCount.textContent = `${textBox.value.length} / ${MAX_TEXT_LENGTH}`;
    updateChrome();
    await loadFont(style.font, spec?.text ?? CHIP_SAMPLE);
    if (token !== renderToken) return;
    noteFont();
    if (spec) paintPreview(spec);
    else showEmpty();
    paintChips();
}

// Word art loaded for editing brings its own style, which must not become the remembered one.
function queueSettings(): void {
    if (settingsTimer) clearTimeout(settingsTimer);
    settingsTimer = 0;
    if (editing) return;
    settingsTimer = setTimeout(
        flushSettings,
        SETTINGS_DEBOUNCE_MS
    ) as unknown as number;
}

function flushSettings(): void {
    if (settingsTimer) clearTimeout(settingsTimer);
    settingsTimer = 0;
    if (editing) return;
    send({ type: "settings", settings: { style } });
}

function syncDependents(): void {
    // Hiding a control leaves its value in the style, so switching back restores it.
    const shown = presetControls(style.preset);
    for (const [control, label] of [
        [controls.colorA, shown.colorA],
        [controls.colorB, shown.colorB],
    ] as const) {
        if (!control) continue;
        control.wrap.hidden = label === null;
        if (label !== null) control.setLabel(label);
    }
    if (controls.colours) {
        controls.colours.hidden =
            shown.colorA === null && shown.colorB === null;
    }
    if (controls.arc) controls.arc.wrap.hidden = !shown.arc;
    for (const [preset, chip] of chips) {
        chip.node.setAttribute("aria-pressed", String(preset === style.preset));
    }
}

function commit(next: Partial<WordArtStyle>): void {
    style = { ...style, ...next };
    syncDependents();
    scheduleRender();
    queueSettings();
}

function pushControls(): void {
    controls.font?.set(style.font);
    controls.colorA?.set(style.colorA);
    controls.colorB?.set(style.colorB);
    controls.arc?.set(style.arc);
    controls.size?.set(style.size);
    syncDependents();
}

function buildControls(): void {
    for (const preset of PRESET_IDS) {
        chips.set(
            preset,
            makeChip(presetsRow, PRESET_NAMES[preset], () => commit({ preset }))
        );
    }
    controls.font = makeOptionGrid(
        controlsRoot,
        "Font",
        FONT_IDS.map((id) => [id, FONT_NAMES[id]]),
        style.font,
        (font) => commit({ font: font as FontId })
    );
    const colours = el("div", "flex gap-2", controlsRoot);
    controls.colours = colours;
    controls.colorA = makeColorInput(colours, "", style.colorA, (colorA) =>
        commit({ colorA })
    );
    controls.colorB = makeColorInput(colours, "", style.colorB, (colorB) =>
        commit({ colorB })
    );
    controls.arc = makeSlider(
        controlsRoot,
        { label: "Arc", ...ARC, step: 1, unit: "" },
        style.arc,
        (arc) => commit({ arc })
    );
    controls.size = makeSlider(
        controlsRoot,
        { label: "Size", ...SIZE, step: 1, unit: "px" },
        style.size,
        (size) => commit({ size })
    );
}

function setBusy(next: boolean): void {
    busy = next;
    if (busyTimer) clearTimeout(busyTimer);
    busyTimer = 0;
    updateChrome();
}

// The reply clock starts once the image is sent, so a slow font load can't re-enable the button mid-send.
function awaitReply(): void {
    if (busyTimer) clearTimeout(busyTimer);
    busyTimer = setTimeout(() => {
        busyTimer = 0;
        setBusy(false);
        setStatus("Drawdy didn't answer. Try again.", "bad");
    }, REPLY_TIMEOUT_MS) as unknown as number;
}

async function sendArt(mode: "place" | "update"): Promise<void> {
    const spec = currentSpec();
    if (busy || !spec) return;
    setBusy(true);
    setStatus(mode === "update" ? "Updating…" : "Placing…");
    try {
        await loadFont(spec.font, spec.text);
        const layout = measure(spec);
        const encoded = encodeImage(
            layout.width,
            layout.height,
            true,
            (canvas, scale) => {
                const ctx = canvas.getContext("2d");
                if (!ctx) throw new Error("no canvas");
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.setTransform(scale, 0, 0, scale, 0, 0);
                renderWordArt(ctx, spec, FONT_STACKS);
            }
        );
        send({
            type: mode,
            ...encoded,
            width: layout.width,
            height: layout.height,
            spec,
        });
        awaitReply();
    } catch {
        setBusy(false);
        setStatus("The word art could not be drawn. Try again.", "bad");
    }
}

function setEditing(next: boolean): void {
    editing = next;
    updateChrome();
}

function wire(): void {
    textBox.addEventListener("input", () => scheduleRender(TYPING_DELAY_MS));
    placeButton.addEventListener("click", () => void sendArt("place"));
    updateButton.addEventListener("click", () => void sendArt("update"));
    editSelectedButton.addEventListener("click", () => {
        setStatus("Reading the selected word art…");
        send({ type: "edit-selected" });
    });
    stopEditButton.addEventListener("click", () => {
        setEditing(false);
        send({ type: "stop-edit" });
        setStatus("Stopped editing. Place on board adds a new word art image.");
    });
    document.addEventListener("keydown", (event) => {
        const action = keyAction(event, isField(event.target));
        if (!action) return;
        event.preventDefault();
        if (action === "blur") (event.target as HTMLElement).blur();
        else send({ type: action });
    });
    window.addEventListener("resize", () => scheduleRender());
}

function placedText(
    message: Extract<DriverToWebview, { type: "placed" }>
): string {
    if (message.mode === "new") {
        return "Placed the word art. Press ⌘Z or Ctrl+Z to undo.";
    }
    const times =
        message.undoSteps === 2 ? "twice" : `${message.undoSteps} times`;
    return `Updated the word art${
        message.rotationReset ? " (rotation reset)" : ""
    }. Press ⌘Z or Ctrl+Z ${times} to get the old version back.`;
}

function handle(message: DriverToWebview): void {
    switch (message.type) {
        case "init": {
            const raw = message.settings?.style;
            if (raw) style = normaliseStyle(raw);
            pushControls();
            scheduleRender();
            return;
        }
        case "theme": {
            const node = document.getElementById("drawdy-styling");
            if (node) node.textContent = `:root{${message.cssVars}}`;
            return;
        }
        case "selection": {
            editSelectedButton.hidden = !message.editable;
            return;
        }
        case "load": {
            flushSettings();
            textBox.value = message.spec.text;
            style = styleOf(message.spec);
            pushControls();
            setEditing(true);
            scheduleRender();
            setStatus(
                "Loaded the selected word art. Change it, then click Update."
            );
            return;
        }
        case "edit-ended": {
            setEditing(false);
            return;
        }
        case "placed": {
            setBusy(false);
            const fallback = fontFailed(style.font)
                ? ` ${FONT_NAMES[style.font]} didn't load, so it used the browser's sans-serif font.`
                : "";
            setStatus(placedText(message) + fallback, fallback ? "" : "good");
            return;
        }
        case "error": {
            setBusy(false);
            setStatus(message.message, "bad");
            return;
        }
    }
}

buildControls();
pushControls();
wire();
scheduleRender();

api.onMessage((raw) => {
    if (!raw || typeof raw !== "object") return;
    handle(raw as DriverToWebview);
});

send({ type: "ready" });
