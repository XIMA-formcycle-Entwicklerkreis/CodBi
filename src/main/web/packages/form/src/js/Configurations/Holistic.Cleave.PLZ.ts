/**
 * Registers a standard configuration that applies Cleave-Formatting onto every {@link HTMLInputElement } that
 * is of Formcycle-Type "Postleitzahl". */
export function loadConfig(): void {
  window.codbi.loadConfig({
    targets: '[data-vdt="plzDE"]',
    FUNC: "HTML.Input.Cleave",
    config: `^${JSON.stringify({
      numeral: true,
      numeralIntegerScale: 5,
      delimiter: "",
    })
      .replace("{", "<")
      .replace("}", ">")}`,
  });
}
