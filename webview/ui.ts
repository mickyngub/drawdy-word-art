const FOCUS =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const LABEL = "text-label text-fg-muted";
const SLIDER =
    "h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[linear-gradient(to_right,var(--color-accent)_var(--fill),var(--color-control)_var(--fill))] [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-accent [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-[0_1px_2px_rgb(0_0_0/0.3)]";
const OPTION =
    "col-span-2 h-7 min-w-0 cursor-pointer truncate rounded-md px-2 text-label text-fg-subtle transition-colors nth-[n+4]:col-span-3 hover:text-fg aria-pressed:bg-control aria-pressed:text-fg";
const SWATCH = `size-6 flex-none cursor-pointer appearance-none rounded-full border-0 bg-transparent p-0 ring-1 ring-line-strong [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0 ${FOCUS}`;
const TILE =
    "flex min-w-0 cursor-pointer flex-col items-stretch gap-0.5 rounded-lg bg-subtle p-1 text-caption text-fg-muted transition-colors hover:bg-hover hover:text-fg active:bg-pressed aria-pressed:text-fg aria-pressed:ring-2 aria-pressed:ring-accent";

export function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    className?: string,
    parent?: HTMLElement
): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (parent) parent.appendChild(node);
    return node;
}

export function button(
    parent: HTMLElement,
    className: string,
    text: string,
    onClick: () => void,
    label?: string
): HTMLButtonElement {
    const node = el("button", `${className} ${FOCUS}`, parent);
    node.type = "button";
    node.textContent = text;
    if (label) {
        node.setAttribute("aria-label", label);
        node.title = label;
    }
    node.addEventListener("click", onClick);
    return node;
}

function field(
    parent: HTMLElement,
    label: string,
    forId?: string,
    className = "flex min-w-0 flex-col gap-2"
) {
    const wrap = el("div", className, parent);
    const head = el("div", "flex items-center justify-between gap-2", wrap);
    const text = el(forId ? "label" : "span", LABEL, head);
    text.textContent = label;
    if (forId) (text as HTMLLabelElement).htmlFor = forId;
    return { wrap, head, text };
}

export type Control<T> = { set(value: T): void };

export type SliderSpec = {
    label: string;
    min: number;
    max: number;
    step: number;
    unit: string;
};

export function makeSlider(
    parent: HTMLElement,
    spec: SliderSpec,
    initial: number,
    onInput: (value: number) => void
): Control<number> & { wrap: HTMLElement } {
    const { wrap, head } = field(parent, spec.label);
    const value = el("span", `${LABEL} text-fg-subtle tabular-nums`, head);
    const input = el("input", `${SLIDER} ${FOCUS}`, wrap);
    input.type = "range";
    input.min = String(spec.min);
    input.max = String(spec.max);
    input.step = String(spec.step);
    input.setAttribute("aria-label", spec.label);
    const show = (v: number) => {
        value.textContent = spec.unit ? `${v} ${spec.unit}` : String(v);
        input.style.setProperty(
            "--fill",
            `${((v - spec.min) / (spec.max - spec.min)) * 100}%`
        );
    };
    input.value = String(initial);
    show(initial);
    input.addEventListener("input", () => {
        const v = Number(input.value);
        show(v);
        onInput(v);
    });
    return {
        wrap,
        set(v) {
            input.value = String(v);
            show(v);
        },
    };
}

export function makeOptionGrid(
    parent: HTMLElement,
    label: string,
    options: [string, string][],
    initial: string,
    onPick: (value: string) => void
): Control<string> {
    const { wrap } = field(parent, label);
    const grid = el(
        "div",
        "grid grid-cols-6 gap-0.5 rounded-lg bg-control-subtle p-0.5",
        wrap
    );
    grid.setAttribute("role", "group");
    grid.setAttribute("aria-label", label);
    const buttons = options.map(([value, caption]) => {
        const node = button(grid, OPTION, caption, () => {
            paint(value);
            onPick(value);
        });
        return { value, node };
    });
    const paint = (current: string) => {
        for (const entry of buttons) {
            entry.node.setAttribute(
                "aria-pressed",
                String(entry.value === current)
            );
        }
    };
    paint(initial);
    return { set: paint };
}

export function makeColorInput(
    parent: HTMLElement,
    label: string,
    initial: string,
    onInput: (value: string) => void
): Control<string> & { wrap: HTMLElement; setLabel(text: string): void } {
    const wrap = el(
        "label",
        `flex h-8 min-w-0 flex-1 cursor-pointer items-center gap-2 ${LABEL}`,
        parent
    );
    const input = el("input", SWATCH, wrap);
    const text = el("span", "min-w-0 truncate", wrap);
    text.textContent = label;
    input.type = "color";
    input.value = initial;
    input.addEventListener("input", () => onInput(input.value.toLowerCase()));
    return {
        wrap,
        setLabel(next) {
            text.textContent = next;
        },
        set(value) {
            input.value = value;
        },
    };
}

export function makeChip(
    parent: HTMLElement,
    caption: string,
    onClick: () => void
): { node: HTMLButtonElement; canvas: HTMLCanvasElement } {
    const node = button(parent, TILE, "", onClick, caption);
    const canvas = el("canvas", "h-8 w-full", node);
    canvas.setAttribute("aria-hidden", "true");
    el("span", "truncate text-center", node).textContent = caption;
    return { node, canvas };
}
