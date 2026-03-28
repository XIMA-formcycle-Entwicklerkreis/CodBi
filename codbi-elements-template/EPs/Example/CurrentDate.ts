/**
 * An Elementplaceholder that inserts the current date into the element's
 * `textContent`.
 *
 * Use `data-cb-ep="Example.CurrentDate"` on any element.
 * The **format** parameter accepts `"iso"` (default) or `"locale"`.
 *
 * @codbi-param format — Date format: "iso" or "locale" (default: "iso")
 */
class Example_CurrentDate {
    public static ep(
        element: HTMLElement,
        params: Record<string, string>,
    ): void {
        const fmt = params["format"] || "iso";
        const now = new Date();

        element.textContent =
            fmt === "locale" ? now.toLocaleDateString() : now.toISOString().slice(0, 10);
    }
}

CodBi.registerEP("Example.CurrentDate", Example_CurrentDate.ep);
