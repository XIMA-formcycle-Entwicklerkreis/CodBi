/**
 * Registers standard configurations specific to people characteristics.
 *
 * CSS-Classes:
 * - **CodBi_Currency**
 *  The {@link HTMLInputElement }s tagged with this class will be formatted for Currencies using Cleave. */
export function loadConfig(): void {
  window.codbi.loadConfig({
    targets: ".CodBi_Currency",
    FUNC: "HTML.Input.Cleave",
    config: `^${JSON.stringify({
      numeral: true,
      numeralThousandsGroupStyle: "thousand",
      numeralDecimalMark: ",",
      delimiter: "",
    })
      .replace("{", "<")
      .replace("}", ">")}`,
  });
}

loadConfig();
