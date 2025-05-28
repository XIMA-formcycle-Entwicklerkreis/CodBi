/**
 * Registers a standard configuration that applies Cleave-Formatting onto every {@link HTMLInputElement } that
 * has has a calendar activated. */
export function loadConfig(): void {
  window.codbi.loadConfig({
    targets: '[data-datepicker="1"]',
    FUNC: "HTML.Input.Cleave",
  });
}

loadConfig();
