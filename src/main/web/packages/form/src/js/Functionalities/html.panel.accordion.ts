// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { DEFINED } from "xdbc/src/DBC/DEFINED";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { OR } from "xdbc/src/DBC/OR";
import { TYPE } from "xdbc/src/DBC/TYPE";
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
   * ### Config Parameter:
   *  - **Accordion:**  The name of the set all **.CodBi.--HTML_Panel** within the tagged {@link HTMLDivElement } shall
   *                    belong to. If no name is defined, nothing happens.
   *
   * @param toLoad    Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }.
   * @param toProcess Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }.*/
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE("string", "accordion")
    @DEFINED.PRE("accordion", "Is the data-cb-Accordion not defined?")
    toLoad: { [key: string]: unknown },
    @OR.PRE(
      [new INSTANCE(HTMLDivElement), new INSTANCE(HTMLFieldSetElement)],
      undefined,
      "Is it not a <div> or <fieldset> that is tagged with this functionality?",
    )
    toProcess: Element,
  ): undefined {
    if (toLoad.accordion === undefined || XFC_METADATA.requestType === "print") {
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
}

window.codbi.registerFunctionality(
  "HTML.Panel.Accordion",
  HTML_Panel_Accordion.functionality.bind(HTML_Panel_Accordion),
);
