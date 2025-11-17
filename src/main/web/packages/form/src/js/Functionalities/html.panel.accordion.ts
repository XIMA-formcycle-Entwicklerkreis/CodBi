// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link HTML_Panel_Accordion.functionality }.
 *
 * @remarks
 * Maintainer: Salvatore Callari (Salvatore.Callari@Ansbach.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class HTML_Panel_Accordion {
  /**
   * This functionality joins every **.CodBi.--HTML_Panel** into an **Accordion-Set** with the specified name.
   * For **.CodBi.--HTML_Panel**s that're nested on a sublevel and thus shall not belong to
   * the **Accordion-Set** the Class **CodBi_HTML_Panel_NoCordion** shall be applied on them or simply apply the
   * {@link HTML_Panel_NoAccordion.functionality } with a different name for the **Accordion-Set** on the sub container
   * they belong to.
   *
   * Config Parameter:
   *  - Accordion The name of the set all **.CodBi.--HTML_Panel** within the tagged {@link HTMLDivElement } shall
   *              belong to. If no name is defined, nothing happens.
   *
   * @param toLoad    Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }.
   * @param toProcess Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }.*/
  @DBC.ParamvalueProvider
  public static functionality(
    toLoad: { [key: string]: unknown },
    @INSTANCE.PRE(HTMLDivElement)
    toProcess: Element,
  ): undefined {
    if (toLoad.accordion === undefined) {
      return;
    }

    const bind = () => {
      for (const panel of toProcess.querySelectorAll(".CodBi.--HTML_Panel:not(.CodBi_HTML_Panel_NoCordion)")) {
        panel.setAttribute("data-cb-accordion", toLoad.accordion as string);
      }
    };

    window.addEventListener("load", (event) => {
      bind();
    });

    bind();
  }
  // #region Initialization
  /**
   * States whether this {@link HTML_Panel_Accordion } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("HTML.Panel.Accordion", HTML_Panel_Accordion.functionality);
  })();
  // #endregion Initialization
}
