/**
 * Registers standard configurations specific to finances.
 *
 * CSS-Classes:
 * - **CodBi_Currency**
 *  The {@link HTMLInputElement }s tagged with this class will be formatted for Currencies using Cleave.
 * - **CodBi_TRANS_NTW**
 *  Turns each typed digit into its GERMAN word ("Null", "Eins", ... — see HTML.Input.Trans.NTW).
 *  This class is a GERMAN-only shortcut: its word list is hard-coded here. For ANY other language the
 *  functionality has to be applied directly with that language's own words, e.g.
 *  `data-cb-func="HTML.Input.Trans.NTW"` +
 *  `data-cb-NumberWords="Cero,Uno,Dos,Tres,Cuatro,Cinco,Seis,Siete,Ocho,Nueve"` (Spanish). */
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
      // HTML.Input.Trans.NTW — NOT HTML.Input.Cleave: Cleave has no NumberWords parameter, and a
      // Cleave without a Config/Date falls back to a DATE mask, so binding this class to Cleave
      // turned the field into a date input instead of writing the digits out as words.
      FUNC: "HTML.Input.Trans.NTW",
      NumberWords: ["Null", "Eins", "Zwei", "Drei", "Vier", "Fünf", "Sechs", "Sieben", "Acht", "Neun"],
    },
  ]);
}

loadConfig();
