/**
 * Provides the {@link HTML_Select_Injection.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */

import { getJQuery } from "@de-xima/fc-form-renderer";

// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class Media_MultipleUpload {
  /**
   * Registers the "Media.MultipleUpload"-Functionality.
   *
   * This functionality enables a file upload dialogue to support selecting multiple files for upload.
   *
   * Parameter:
   *  - Maximum:        The number of files that may be uploaded.
   *  - prefixTooMany:  The message that is displayed before the **Maximum** if too many files were selected.
   *  - postfixTooMany: The message that is displayed after the **Maximum** if too many files were selected. */
  public static functionality(toLoad: { [key: string]: string }, toProcess: Element): void {
    const maximum = toLoad.maximum ? Number.parseInt(toLoad.maximum) : 2;
    const labelText = toProcess.parentElement.querySelector("label span").innerHTML;

    toProcess.addEventListener("change", (event) => {
      if ((toProcess as HTMLInputElement).files.length > maximum) {
        getJQuery()(toProcess).error(
          toLoad.prefixtoomany && toLoad.postfixtoomany
            ? toLoad.prefixtoomany + toLoad.maximum + toLoad.postfixtoomany
            : `Too many files selected. The maximum number of files is ${toLoad.maximum ? toLoad.maximum : 2}.`,
        );
      } else {
        getJQuery()(toProcess).error("");

        if ((toProcess as HTMLInputElement).files.length !== 1) {
          toProcess.parentElement.querySelector("label span").innerHTML = `${labelText} (`;

          for (const file of (toProcess as HTMLInputElement).files) {
            toProcess.parentElement.querySelector("label span").innerHTML += `${file.name}, `;
          }

          toProcess.parentElement.querySelector("label span").innerHTML = toProcess.parentElement
            .querySelector("label span")
            .innerHTML.substring(0, toProcess.parentElement.querySelector("label span").innerHTML.length - 2);

          toProcess.parentElement.querySelector("label span").innerHTML += ")";
        }
      }
    });

    toProcess.setAttribute("multiple", "");
  }
  // #region Initialization
  /**
   * States whether this {@link Media_MultipleUpload } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("Media.MultipleUpload", Media_MultipleUpload.functionality);
  })();
  // #endregion Initialization
}
