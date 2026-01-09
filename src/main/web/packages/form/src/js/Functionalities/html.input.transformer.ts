// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link HTML_Input_Transformer.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class HTML_Input_Transformer {
  /**
   * Gets the algorithm used to transform the tagged {@link HTMLInputElement }'s {@link HTMLInputElement.value }.
   *
   * @return An anonymous function simply returning the {@link string } to transform. */
  protected static get transformer(): (toTransform: string, toLoad: { [key: string]: unknown }) => string {
    console.log("standard transformer");
    return (toTransform: string, toLoad: { [key: string]: unknown }) => {
      return toTransform;
    };
  }
  /**
   * A base functionality for that transform {@link HTMLInputElement }'s {@link HTMLInputElement.value }s
   * further whenever those have changed. A **transformer** of type **(toTransform: string) => string** that
   * performs the actual change has to be provided, otherwise this {@link HTML_Input_Transformer }'s
   * {@link HTML_Input_Transformer.transform } will be used.
   *
   * @param toLoad      As provided by the **CodBi**.
   * @param toProcess   As provided by the **CodBi**.
   * @param transformer The **(toTransform: string) => string** performing the actual change. */
  @DBC.ParamvalueProvider
  public static functionality(
    toLoad: { [key: string]: unknown },
    toProcess: Element,
    transformer: (
      toTransform: string,
      toLoad: { [key: string]: unknown },
    ) => string = HTML_Input_Transformer.transformer,
  ): void {
    const $ = getJQuery();
    // #region Perform transformation
    toProcess.addEventListener("change", (event) => {
      (event.target as HTMLInputElement).value = transformer((event.target as HTMLInputElement).value, toLoad);
    });
    // #endregion Perform transformation
  }
  // #region Initialization
  /**
   * States whether this {@link HTML_Input_Transformer } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("HTML.Input.Transformer", HTML_Input_Transformer.functionality);
  })();
  // #endregion Initialization
}
