// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { EQ } from "xdbc/src/DBC/EQ";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link HTML_Select_Injection.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class HTML_Select_Injection {
  /**
   * This functionality populates a {@link HTMLSelectElement } by generating {@link HTMLOptionElement } for each
   * entry found in "Titles", if available. If "Titles" isn't available the "Values" will be treated as the "Titles"
   * also. The one with the least entries determines the amount of {@link HTMLOptionElement }s that'll be generated.
   *
   * Config Parameter:
   *  - Titles:   The optional "title"-attributes that shall be set on the {@link HTMLOptionElement }s.
   *  - Values:   The {@link HTMLElement.innerHTML }s the generated {@link HTMLOptionElement } shall have.
   *  - ReClean:  An optional {@link boolean } specifying whether to clean the {@link HTMLSelectElement } prior to
   *              populate it.
   *
   * @param toLoad    Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }.
   * @param toProcess Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }. */
  @DBC.ParamvalueProvider
  public static functionality(
    @INSTANCE.PRE(Array<string>, "values")
    toLoad: { [key: string]: [] | boolean | string | undefined },
    @EQ.PRE("SELECT" as unknown as object, false, "tagName") toProcess: Element,
  ): undefined {
    // #region Delete the "HTMLSelectElement"'s "innerHTML" if "ReClean" is TRUE.
    if (toLoad.reclean) {
      if (
        (typeof toLoad.reclean === "string" && toLoad.reclean.toLocaleLowerCase() === "true") ||
        (typeof toLoad.reclean === "boolean" && toLoad.reclean === true)
      ) {
        toProcess.innerHTML = "";
      }
    }
    // #endregion Delete the "HTMLSelectElement"'s "innerHTML" if "ReClean" is TRUE.
    // #region Populate the "HTMLSelectElement".
    const arrayLength = toLoad.titles ? (toLoad.titles as []).length : (toLoad.values as []).length;

    if (toLoad.titles === undefined) {
      toLoad.titles = toLoad.values;
    }

    for (let i = 0; i < arrayLength; i++) {
      toProcess.innerHTML += `<option title = "${(toLoad.titles as [])[i]}" value = "${(toLoad.values as [])[i]}">${(toLoad.values as [])[i]}</option>`;
    }
    // #endregion Populate the "HTMLSelectElement".
  }
  // #region Initialization
  /**
   * States whether this {@link HTML_Select_Injection } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("HTML.Select.Injection", HTML_Select_Injection.functionality);
  })();
  // #endregion Initialization
}
