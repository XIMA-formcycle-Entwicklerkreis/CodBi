/**
 * Registers a standard configuration that applies Cleave-Formatting onto every {@link HTMLInputElement } that
 * has has a calendar activated.
 *
 * General excluding CSS-Class available (**CodBi_XCL**).
 * Exclusive excluding CSS-Class available (**CodBi_XCL_Cleave_Date**). */
export function loadConfig(): void {
  /** Applies Cleave formatting in all {@link XItem }s that got a datepicker enabled. */
  window.codbi.loadConfig({
    targets: '[data-datepicker="1"]:not(.CodBi_XCL):not(.CodBi_XCL_Cleave_Date)',
    FUNC: "HTML.Input.Cleave",
  });
}

loadConfig();
