const FOCUS =
    "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary";
const LABEL = "text-[10px] tracking-[0.02em] text-muted-foreground";
const INPUT =
    "h-6 rounded-sm border border-border bg-background py-0.5 text-[11px] focus:border-primary focus:outline-none disabled:opacity-40";
const CHECKER =
    "bg-[repeating-conic-gradient(var(--color-surface2)_0_25%,var(--color-background)_0_50%)] bg-[length:16px_16px]";
const CHIP = `flex min-w-0 cursor-pointer flex-col items-stretch gap-0.5 rounded-md border border-border bg-background p-1 text-[10px] text-muted-foreground hover:text-foreground aria-pressed:border-primary aria-pressed:text-foreground aria-pressed:outline-1 aria-pressed:outline-primary`;

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
    className = "flex min-w-0 flex-col gap-1"
) {
    const wrap = el("div", className, parent);
    const head = el("div", "flex items-baseline justify-between gap-1.5", wrap);
    const text = el(forId ? "label" : "span", LABEL, head);
    text.textContent = label;
    if (forId) (text as HTMLLabelElement).htmlFor = forId;
    return { wrap, head, text };
}

let uid = 0;
const nextId = (stem: string) => `${stem}-${++uid}`;

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
    const value = el("span", "text-[10px] tabular-nums", head);
    const input = el(
        "input",
        `h-3.5 w-full cursor-pointer accent-primary ${FOCUS}`,
        wrap
    );
    input.type = "range";
    input.min = String(spec.min);
    input.max = String(spec.max);
    input.step = String(spec.step);
    input.setAttribute("aria-label", spec.label);
    const show = (v: number) => {
        value.textContent = spec.unit ? `${v} ${spec.unit}` : String(v);
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

export function makeSelect(
    parent: HTMLElement,
    label: string,
    options: [string, string][],
    initial: string,
    onPick: (value: string) => void
): Control<string> {
    const id = nextId("select");
    const { wrap } = field(parent, label, id);
    const select = el("select", `${INPUT} px-1`, wrap);
    select.id = id;
    for (const [value, caption] of options) {
        const option = el("option", undefined, select);
        option.value = value;
        option.textContent = caption;
    }
    select.value = initial;
    select.addEventListener("change", () => onPick(select.value));
    return {
        set(value) {
            select.value = value;
        },
    };
}

export function makeColorInput(
    parent: HTMLElement,
    label: string,
    initial: string,
    onInput: (value: string) => void
): Control<string> & { wrap: HTMLElement; setLabel(text: string): void } {
    const id = nextId("colour");
    const { wrap, text } = field(
        parent,
        label,
        id,
        "flex min-w-0 flex-1 flex-col gap-1"
    );
    const input = el(
        "input",
        `h-6 w-full cursor-pointer rounded-sm border border-border bg-background p-0.5 ${FOCUS}`,
        wrap
    );
    input.id = id;
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
    const node = button(parent, CHIP, "", onClick, caption);
    const canvas = el("canvas", `h-10 w-full rounded-sm ${CHECKER}`, node);
    canvas.setAttribute("aria-hidden", "true");
    el("span", "truncate text-center", node).textContent = caption;
    return { node, canvas };
}
