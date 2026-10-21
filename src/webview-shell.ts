import { fontFaceCss } from "../webview/lib/font-faces";
import { PANEL_CSS } from "./panel-css";

const FOCUS =
    "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary";
const BTN = `cursor-pointer rounded-sm border border-border bg-background px-2.5 py-1 text-[11px] hover:border-foreground disabled:cursor-default disabled:opacity-40 disabled:hover:border-border ${FOCUS}`;
const PRIMARY =
    "border-primary bg-primary font-semibold text-primary-foreground hover:border-primary hover:opacity-90";
const CHECKER =
    "bg-[repeating-conic-gradient(var(--color-surface2)_0_25%,var(--color-background)_0_50%)] bg-[length:16px_16px]";

const BODY = `
<header class="flex flex-none items-center justify-between gap-2 border-b border-border px-3 py-2">
    <h1 class="text-[13px] font-semibold">Word Art</h1>
    <button type="button" id="close" class="${BTN}">Close</button>
</header>
<div id="edit-banner" class="flex flex-none items-center justify-between gap-2 border-b border-border bg-surface2 px-3 py-1.5 text-[11px]" hidden>
    <span>Editing word art from the board.</span>
    <button type="button" id="stop-edit" class="cursor-pointer text-[11px] text-primary underline underline-offset-2 ${FOCUS}">Stop editing</button>
</div>
<div class="flex-none px-3 pt-3">
    <div id="preview-box" class="flex h-28 items-center justify-center overflow-hidden rounded-md border border-border ${CHECKER}">
        <canvas id="preview" role="img" aria-label="Preview of the word art" class="h-(--h) w-(--w)" hidden></canvas>
        <p id="preview-empty" class="px-6 text-center text-[11px] text-muted-foreground">Type some text to see your word art here.</p>
    </div>
</div>
<main id="controls" class="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-3 py-3">
    <div class="flex flex-col gap-1">
        <div class="flex items-baseline justify-between gap-1.5">
            <label for="text" class="text-[10px] tracking-[0.02em] text-muted-foreground">Text</label>
            <span id="text-count" class="text-[10px] text-muted-foreground tabular-nums"></span>
        </div>
        <textarea id="text" rows="2" maxlength="80" spellcheck="false" aria-describedby="text-note" placeholder="Type a word or a short title" class="w-full resize-none rounded-sm border border-border bg-background px-1.5 py-1 text-[12px] focus:border-primary focus:outline-none"></textarea>
        <p id="text-note" class="text-[10px] text-muted-foreground">Up to three lines. Press Esc to leave the box.</p>
    </div>
    <div class="flex flex-col gap-1">
        <span id="style-label" class="text-[10px] tracking-[0.02em] text-muted-foreground">Style</span>
        <div id="presets" role="group" aria-labelledby="style-label" class="grid grid-cols-3 gap-1.5"></div>
    </div>
</main>
<footer class="flex flex-none flex-col gap-1.5 border-t border-border px-3 py-2">
    <div id="status" role="status" aria-live="polite" class="min-h-7 text-[10px] text-muted-foreground data-[tone=bad]:text-destructive data-[tone=good]:text-success"></div>
    <div class="flex justify-end gap-1.5">
        <button type="button" id="edit-selected" class="${BTN}" hidden>Edit selected</button>
        <button type="button" id="place" class="${BTN} data-[primary=true]:border-primary data-[primary=true]:bg-primary data-[primary=true]:font-semibold data-[primary=true]:text-primary-foreground data-[primary=true]:hover:opacity-90" data-primary="true" disabled>Place on board</button>
        <button type="button" id="update" class="${BTN} ${PRIMARY}" hidden>Update on board</button>
    </div>
</footer>
`;

export function shellHtml(js: string): string {
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style id="drawdy-styling">:root{/*__DRAWDY_STYLING__*/}</style>
<style>${fontFaceCss()}</style>
<style>${PANEL_CSS}</style>
</head>
<body class="flex h-screen flex-col overflow-hidden bg-background text-xs/[1.4] text-foreground antialiased">
${BODY}
<script>${js}</script>
</body>
</html>`;
}
