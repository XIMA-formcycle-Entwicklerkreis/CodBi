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
    @EQ.PRE("file", false, 'Is it not an <input type = "file"> that is tagged with this functionality?', "type")
    toProcess: Element,
  ): void {
    const maximum = toLoad.maximum ? Number.parseInt(toLoad.maximum) : 2;

    // Resolve the label text element: prefer a <span> inside the <label>. If no <span> exists,
    // create one and move the label's text nodes into it (so we never risk wiping out the <input>
    // by writing innerHTML on the <label> itself).
    const label = DEFINED.tsCheck<HTMLElement>(
      toProcess.parentElement.querySelector("label"),
      'Isn\'t there a <label> for the tagged <input type="file">?',
    );
    let labelTextEl = label.querySelector("span");
    if (!labelTextEl) {
      labelTextEl = document.createElement("span");
      // Collect text nodes from the label, excluding the <input> and other elements
      const textParts: string[] = [];
      for (const node of label.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          textParts.push(node.textContent ?? "");
        }
      }
      labelTextEl.textContent = textParts.join("").trim();
      label.insertBefore(labelTextEl, label.querySelector("input"));
    }
    const labelText = labelTextEl.innerHTML;

    // Helper to set the label text back (restore or update with filenames).
    const setLabelText = (text: string): void => {
      labelTextEl.innerHTML = text;
    };

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
          setLabelText(labelText);

          if ((toProcess as HTMLInputElement).files.length !== 1) {
            let text = `${labelText} (`;

            for (const file of (toProcess as HTMLInputElement).files) {
              text += `${file.name}, `;
            }

            text = text.substring(0, text.length - 2);
            text += ")";
            setLabelText(text);
          }
        }
      } else {
        getJQuery()(toProcess).error("");
        setLabelText(labelText);

        if ((toProcess as HTMLInputElement).files.length !== 1) {
          let text = `${labelText} (`;

          for (const file of (toProcess as HTMLInputElement).files) {
            text += `${file.name}, `;
          }

          text = text.substring(0, text.length - 2);
          text += ")";
          setLabelText(text);
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
