import type { FontId } from "../src/shared/spec";
import { FONT_FAMILIES } from "./lib/font-faces";

const TIMEOUT_MS = 8000;

const failed = new Set<FontId>();

export async function loadFont(font: FontId, text: string): Promise<boolean> {
    if (typeof document === "undefined" || !document.fonts) return false;
    const timeout = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), TIMEOUT_MS)
    );
    try {
        const faces = await Promise.race([
            document.fonts.load(`48px "${FONT_FAMILIES[font]}"`, `A${text}`),
            timeout,
        ]);
        const ok =
            faces !== null && faces.some((face) => face.status === "loaded");
        if (ok) failed.delete(font);
        else failed.add(font);
        return ok;
    } catch {
        failed.add(font);
        return false;
    }
}

export const fontFailed = (font: FontId): boolean => failed.has(font);
