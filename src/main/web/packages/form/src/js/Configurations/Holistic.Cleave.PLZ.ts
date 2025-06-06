/**
 * Registers a standard configuration that applies Cleave-Formatting onto every {@link HTMLInputElement } that
 * is of Formcycle-Type "Postleitzahl".
 *
 * General excluding CSS-Class available (**CodBi_XCL**).
 * Exclusive excluding CSS-Class available (**CodBi_XCL_Cleave_PLZ**) */
export function loadConfig(): void {
  window.codbi.loadConfig({
    targets: '[data-vdt="plzDE"]:not(.CodBi_XCL):not(.CodBi_XCL_Cleave_PLZ)',
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

loadConfig();
