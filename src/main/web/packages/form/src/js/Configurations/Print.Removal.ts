/**
 * Registers standard configurations that remove {@link HTMLElement }s from the DOM.
 *
 * CSS-Classes:
 *  - **CodBi_Print_Remove_Tagged**
 *    {@link HTMLElement.remove }s the tagged element. */
export function loadConfig(): void {
  window.codbi.loadConfigs([
    {
      targets: ".CodBi_Print_Remove_Tagged",
      FUNC: "Print.Remove",
    },
    {
      targets: ".CodBi_Print_Remove_Parent",
      FUNC: "Print.Remove",
      ParentalLevel: 1,
    },
    {
      targets: ".CodBi_Print_Remove_PrintOnly",
      FUNC: "Print.Remove",
      Invert: "TRUE",
    },
  ]);
}

loadConfig();
