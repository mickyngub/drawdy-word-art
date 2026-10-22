import { fontFaceCss } from "../webview/lib/font-faces";
import { ICONS, icon } from "../webview/lib/icons";
import { PANEL_CSS } from "./panel-css";

const FOCUS =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const LINK = `cursor-pointer rounded-sm text-label text-fg-muted underline decoration-line-strong underline-offset-2 transition-colors hover:text-fg ${FOCUS}`;
const BUTTON = `inline-flex h-9 min-w-0 cursor-pointer items-center justify-center rounded-xl border px-3 text-label-md transition-colors disabled:cursor-not-allowed ${FOCUS}`;
const SECONDARY = `${BUTTON} flex-none border-line bg-subtle text-fg-muted enabled:hover:bg-hover enabled:hover:text-fg enabled:active:bg-pressed disabled:text-fg-disabled`;
const PRIMARY = `${BUTTON} flex-1 border-transparent bg-accent text-on-accent enabled:hover:bg-accent-hover enabled:active:bg-accent-pressed disabled:bg-disabled disabled:text-fg-disabled focus-visible:ring-offset-2 focus-visible:ring-offset-panel`;
const PRIMARY_WHEN_FLAGGED =
    "data-[primary=true]:flex-1 data-[primary=true]:border-transparent data-[primary=true]:bg-accent data-[primary=true]:text-on-accent data-[primary=true]:enabled:hover:bg-accent-hover data-[primary=true]:enabled:hover:text-on-accent data-[primary=true]:enabled:active:bg-accent-pressed data-[primary=true]:disabled:bg-disabled data-[primary=true]:disabled:text-fg-disabled data-[primary=true]:focus-visible:ring-offset-2 data-[primary=true]:focus-visible:ring-offset-panel";
const CHECKER =
    "has-[>canvas:not([hidden])]:bg-[repeating-conic-gradient(var(--color-subtle)_0_25%,var(--color-control-subtle)_0_50%)] has-[>canvas:not([hidden])]:bg-size-[12px_12px]";

const BODY = `
<div id="edit-banner" class="flex flex-none items-center justify-between gap-2 border-b border-divider bg-accent-subtle px-4 py-2 text-body text-fg" hidden>
    <span>Editing word art from the board.</span>
    <button type="button" id="stop-edit" class="${LINK}">Stop editing</button>
</div>
<div class="flex-none px-4 pt-3">
    <div id="preview-box" class="flex h-28 items-center justify-center overflow-hidden rounded-xl bg-section ${CHECKER}">
        <canvas id="preview" role="img" aria-label="Preview of the word art" class="h-(--h) w-(--w)" hidden></canvas>
        <p id="preview-empty" class="flex flex-col items-center gap-1 px-6 text-center text-body text-fg-subtle">
            ${icon(ICONS.text, "size-5")}
            <span>Type some text to see your word art here.</span>
        </p>
    </div>
</div>
<main id="controls" class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pt-4 pb-4 [scrollbar-width:thin] [scrollbar-color:var(--color-line-strong)_transparent]">
    <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between text-label text-fg-muted">
            <label for="text">Text</label>
            <span id="text-count" class="text-fg-subtle tabular-nums"></span>
        </div>
        <textarea id="text" rows="2" maxlength="80" spellcheck="false" aria-describedby="text-note" placeholder="Type a word or a short title" class="min-h-20 w-full resize-none rounded-xl border border-line bg-subtle px-3 py-2 text-[13px] leading-5 text-fg placeholder:text-fg-disabled transition-colors hover:bg-hover focus:border-line-strong focus:bg-active focus:outline-none focus:ring-1 focus:ring-ring"></textarea>
        <p id="text-note" class="text-body text-fg-subtle">Up to three lines. Press Esc to leave the box.</p>
    </div>
    <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between text-label text-fg-muted">
            <span id="style-label">Style</span>
        </div>
        <div id="presets" role="group" aria-labelledby="style-label" class="grid grid-cols-3 gap-1"></div>
    </div>
    <div class="sticky -bottom-4 order-last mt-auto -mb-4 flex-none bg-panel pt-2 pb-4 before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-4 before:bg-linear-to-t before:from-panel has-[>:empty]:static has-[>:empty]:-mt-4 has-[>:empty]:mb-0 has-[>:empty]:p-0 has-[>:empty]:before:hidden">
        <div id="status" role="status" aria-live="polite" class="text-body text-fg-subtle data-[tone=bad]:rounded-lg data-[tone=bad]:bg-danger-subtle data-[tone=bad]:px-3 data-[tone=bad]:py-2 data-[tone=bad]:text-fg"></div>
    </div>
</main>
<footer class="flex flex-none items-center gap-2 border-t border-divider px-4 py-3">
    <div id="actions" class="flex min-w-0 flex-1 items-center gap-2" data-editing="false">
        <button type="button" id="edit-selected" class="${SECONDARY}" hidden>Edit selected</button>
        <button type="button" id="place" class="${SECONDARY} ${PRIMARY_WHEN_FLAGGED}" data-primary="true" disabled>Place on board</button>
        <button type="button" id="update" class="${PRIMARY}" hidden>Update</button>
    </div>
</footer>
`;

export function shellHtml(js: string): string {
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource-variable/google-sans-flex@5.3.2/wght.css" />
<style id="drawdy-styling">:root{/*__DRAWDY_STYLING__*/}</style>
<style>${fontFaceCss()}</style>
<style>${PANEL_CSS}</style>
</head>
<body class="flex h-screen flex-col overflow-hidden bg-panel font-sans text-body text-fg antialiased">
${BODY}
<script>${js}</script>
</body>
</html>`;
}
