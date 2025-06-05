/**
 * Registers a standard configuration that applies Cleave-Formatting onto every {@link HTMLInputElement } that
 * is a Formcylce - Time one.
 *
 * General excluding CSS-Class available (**CodBi_XCL**).
 * Exclusive excluding CSS-Class available (**CodBi_XCL_Cleave_Time**) */
export function loadConfig(): void {
  window.codbi.loadConfig({
    targets: '[data-vdt="time"]:not(.CodBi_XCL):not(.CodBi_XCL_Cleave_Time)',
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
