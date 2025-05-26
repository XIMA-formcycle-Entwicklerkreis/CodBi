/**
 * Registers a standard configuration that applies Cleave-Formatting onto every {@link HTMLInputElement } that
 * is of Formcycle-Type "Telefonnummer". */
export function loadConfig(): void {
  window.codbi.loadConfig({
    targets: '[data-vdt="phone"]',
    FUNC: "HTML.Input.Cleave",
    config: `^${JSON.stringify({
      phone: true,
      phoneRegionCode: "DE",
    })
      .replace("{", "<")
      .replace("}", ">")}`,
  });
}
