/**
 * Registers a standard configuration that applies Cleave-Formatting onto every {@link HTMLInputElement } that
 * is a Formcylce - Time one. */
export function loadConfig(): void {
  window.codbi.loadConfig({
    targets: '[data-vdt="time"]',
    FUNC: "HTML.Input.Cleave",
    config: `^${JSON.stringify({
      time: true,
      timePattern: ["h", "m"],
    })
      .replace("{", "<")
      .replace("}", ">")}`,
  });
}

loadConfig();
