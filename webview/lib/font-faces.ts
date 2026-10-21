import type { FontId } from "../../src/shared/spec";

export const FONT_NAMES: Record<FontId, string> = {
    bungee: "Bungee",
    pacifico: "Pacifico",
    righteous: "Righteous",
    anton: "Anton",
    "rubik-mono-one": "Rubik Mono One",
};

export const FONT_FAMILIES: Record<FontId, string> = {
    bungee: "Word Art Bungee",
    pacifico: "Word Art Pacifico",
    righteous: "Word Art Righteous",
    anton: "Word Art Anton",
    "rubik-mono-one": "Word Art Rubik Mono One",
};

const FONTSOURCE = "https://cdn.jsdelivr.net/npm/@fontsource/";
const VERSION = "5.3.0";

// Fontsource's own subsets: the browser fetches a file only once text needs it.
const RANGES = {
    latin: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
    "latin-ext":
        "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
    vietnamese:
        "U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB",
    cyrillic: "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116",
    "cyrillic-ext":
        "U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F",
};

const SUBSETS: Record<FontId, (keyof typeof RANGES)[]> = {
    bungee: ["latin", "latin-ext", "vietnamese"],
    pacifico: ["latin", "latin-ext", "vietnamese", "cyrillic", "cyrillic-ext"],
    righteous: ["latin", "latin-ext"],
    anton: ["latin", "latin-ext", "vietnamese"],
    "rubik-mono-one": ["latin", "latin-ext", "cyrillic"],
};

export function fontFaceCss(): string {
    return (Object.keys(FONT_FAMILIES) as FontId[])
        .flatMap((font) =>
            SUBSETS[font].map(
                (subset) =>
                    `@font-face{font-family:"${FONT_FAMILIES[font]}";font-style:normal;font-weight:400;font-display:swap;src:url("${FONTSOURCE}${font}@${VERSION}/files/${font}-${subset}-400-normal.woff2") format("woff2");unicode-range:${RANGES[subset]};}`
            )
        )
        .join("\n");
}

export const FONT_STACKS = Object.fromEntries(
    (Object.keys(FONT_FAMILIES) as FontId[]).map((font) => [
        font,
        `"${FONT_FAMILIES[font]}", sans-serif`,
    ])
) as Record<FontId, string>;
