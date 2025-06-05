/**
 * Registers a standard configuration that applies Cleave-Formatting onto every {@link HTMLInputElement } that
 * is of Formcycle-Type "Telefonnummer".
 *
 * General excluding CSS-Class available (**CodBi_XCL**).
 * Exclusive excluding CSS-Class available (**CodBi_XCL_Cleave_Phone**) */
export function loadConfig(): void {
  window.codbi.loadConfig({
    targets: '[data-vdt="phone"]:not(.CodBi_XCL):not(.CodBi_XCL_Cleave_Phone)',
    FUNC: "HTML.Input.Cleave",
    config: `^${JSON.stringify({
      phone: true,
      phoneRegionCode: "DE",
    })
      .replace("{", "<")
      .replace("}", ">")}`,
  });
}

loadConfig();
