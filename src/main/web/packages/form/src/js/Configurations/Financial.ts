/**
 * Registers standard configurations specific to people characteristics.
 *
 * CSS-Classes:
 * - **CodBi_People_18plus**
 *  The {@link HTMLInputElement }s tagged with this class will be configured to not allow entering or selecting dates from JQuery's
 *  datepicker that are less than 18 years in the past, which is useful for {@link HTMLInputElement }s taking birthdays.
 * The {@link HTMLInputElement } will be Cleave formatted with leading zeros and dots as separator.
 */
export function loadConfig(): void {
  window.codbi.loadConfig({
    targets: ".CodBi_Currency",
    FUNC: "HTML.Input.Cleave",
    config: `^${JSON.stringify({
      numeral: true,
      numeralThousandsGroupStyle: "thousand",
      numeralDecimalMark: ",",
      delimiter: ".",
    })
      .replace("{", "<")
      .replace("}", ">")}`,
  });
}
