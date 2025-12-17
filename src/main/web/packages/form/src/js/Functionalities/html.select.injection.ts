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
   *  - Titles:         The optional "title"-attributes that shall be set on the {@link HTMLOptionElement }s.
   *  - TitleProperty:  The optional property to retrieve from the {@link Array } passed to the **Values** to use it as
   *                    the actual title.
   *  - Values:         The {@link HTMLElement.innerHTML }s the generated {@link HTMLOptionElement } shall have.
   *  - ValueProperty:  The optional property to retrieve from the {@link Array } passed to the **Values** to use it as
   *                    the actual value.
   *  - TextProperty    The optional property to retrieve from the {@link Array } passed to the **Values** to use it as
   *                    the actual seen text in the selection (if not specified but **ValueProperty** is, the
   *                    **ValueProperty** will be used for the text).
   *  - ReClean:        An optional {@link boolean } specifying whether to clean the {@link HTMLSelectElement } prior to
   *                    populate it.
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
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      // biome-ignore lint/style/useSingleVarDeclarator: <explanation>
      let title: string | any, value: string | any, text: string | any;

      value = text = (toLoad.values as [])[i];

      title = toLoad.titles ? (toLoad.titles as [])[i] : value;

      if (typeof value !== "string") {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        value = (title as any)[toLoad.valueproperty as string];
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        text = (title as any)[toLoad.textproperty as string];
      }

      if (typeof title !== "string") {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        title = (title as any)[toLoad.titleproperty as string];
      }

      toProcess.innerHTML += `<option title = "${title} value = "${value}">${text}</option>`;
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
