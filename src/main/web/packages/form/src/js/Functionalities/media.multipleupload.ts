// #region Imports
// #region XDBC
import { IF } from "xdbc/src/DBC/IF";
import { EQ } from "xdbc/src/DBC/EQ";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { DEFINED } from "xdbc/src/DBC/DEFINED";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
// #endregion XDBC
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #endregion Imports
/**
 * Provides the {@link HTML_Select_Injection.functionality }.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
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
  public static functionality(
    @TYPE.PRE("string", "prefixtoomany :: postfixtoomany")
    @TYPE.PRE("string | number", "maximum")
    @IF.PRE(new TYPE("string"), new REGEX(/\d+/), "maximum")
    toLoad: { [key: string]: string },

    @INSTANCE.PRE(HTMLInputElement, "Is it not an <input> that is tagged with this functionality?")
    @EQ.PRE("type", false, 'Is it not an <input type = "file"> that is tagged with this functionality?', "type")
    toProcess: Element,
  ): void {
    const maximum = toLoad.maximum ? Number.parseInt(toLoad.maximum) : 2;
    const labelText = DEFINED.tsCheck<HTMLSpanElement>(
      toProcess.parentElement.querySelector("label span"),
      'Isn\'t there a <label> with a <span> for the tagged <input type="file">?',
    ).innerHTML;

    // Prevent formcycle's combined filename length check from triggering false positives
    // when multiple files are selected. The individual check below replaces it.
    const maxLength = (toProcess as HTMLInputElement).getAttribute("maxlength");
    if (maxLength) {
      (toProcess as HTMLInputElement).removeAttribute("maxlength");
    }

    toProcess.addEventListener("change", (event) => {
      if ((toProcess as HTMLInputElement).files.length > maximum) {
        getJQuery()(toProcess).error(
          toLoad.prefixtoomany && toLoad.postfixtoomany
            ? toLoad.prefixtoomany + toLoad.maximum + toLoad.postfixtoomany
            : `Too many files selected. The maximum number of files is ${toLoad.maximum ? toLoad.maximum : 2}.`,
        );
      } else if (maxLength) {
        const limit = Number.parseInt(maxLength);
        const tooLong = Array.from((toProcess as HTMLInputElement).files).find((f) => f.name.length > limit);
        if (tooLong) {
          getJQuery()(toProcess).error(`Filename "${tooLong.name}" exceeds the maximum length of ${limit} characters.`);
        } else {
          getJQuery()(toProcess).error("");
          toProcess.parentElement.querySelector("label span").innerHTML = labelText;

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
      } else {
        getJQuery()(toProcess).error("");
        toProcess.parentElement.querySelector("label span").innerHTML = labelText;

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
}

window.codbi.registerFunctionality(
  "Media.MultipleUpload",
  Media_MultipleUpload.functionality.bind(Media_MultipleUpload),
); // Initialization
