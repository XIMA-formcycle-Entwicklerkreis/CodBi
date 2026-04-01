/**
 * Registers standard configurations specific to finances.
 *
 * CSS-Classes:
 * - **CodBi_Currency**
 *  The {@link HTMLInputElement }s tagged with this class will be formatted for Currencies using Cleave. */
export function loadConfig(): void {
  window.codbi.loadConfigs([
    {
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
    },
    {
      targets: ".CodBi_TRANS_NTW",
      FUNC: "HTML.Input.Cleave",
      NumberWords: ["Null", "Eins", "Zwei", "Drei", "Vier", "Fünf", "Sechs", "Sieben", "Acht", "Neun"],
    },
  ]);
}

loadConfig();
