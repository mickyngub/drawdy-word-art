// Remix Icon 4.9.0 glyphs, the host's icon set.
export const ICONS = {
    text: "M13 6V21H11V6H5V4H19V6H13Z",
} as const;

export function icon(path: string, className = "size-4"): string {
    return `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="${className}"><path d="${path}"/></svg>`;
}
