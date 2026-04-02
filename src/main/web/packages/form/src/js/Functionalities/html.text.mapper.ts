// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { EQ } from "xdbc/src/DBC/EQ";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { DEFINED } from "xdbc/src/DBC/DEFINED";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link HTML_Text_Mapper.functionality }.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class HTML_Text_Mapper {
  /**
   * This functionality maps the properties of an {@link object } to the placeholders in a {@link string } replacing
   * their occurrences. The placeholders syntax is: Property-Name surrounded by "[(" and ")]" (e.g. [(propertyName)]).
   *
   * Config Parameter:
   *  - Replacements  The {@link object } containing the properties which's values will be used to replace the
   *                  placeholders.
   *                  If the {@link object } is an {@link Array } the {@link string } containing the placeholders will
   *                  replicated for each one. That way it is possible to use the {@link string } containing the
   *                  placeholders as a template.
   *  - Property      The property of the tagged {@link object } that contains the {@link string } to replace the
   *                  placeholders in.
   *  - CSS           The CSS-Rules to apply onto the {@link Element } "toProcess" when replacement has been completed.
   *                  This is for e.g. to hide the {@link Element } from view as long as the placeholders aren't
   *                  replaced yet.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    /*@DEFINED.PRE("replacements")
    @TYPE.PRE("object", "replacements")
    @DEFINED.PRE("property")
    @REGEX.PRE(REGEX.stdExp.property, "property")
    @TYPE.PRE("string")*/
    toLoad: { [key: string]: unknown },

    //@INSTANCE.PRE(HTMLElement, undefined, "Is it not an HTML-Element that is tagged with this functionality?")
    toProcess: Element,
  ): void {
    console.log("N", toProcess.getAttribute("class"), toLoad);
    /*
    // #region Further Precondition Checks
    new EQ(undefined, true).check(
      (toProcess as unknown as { [key: string]: string | undefined })[toLoad.property as string],
    );
    // #endregion Further Precondition Checks
    */
    // #region Process each context
    const originalContent = (toProcess as unknown as { [key: string]: string })[toLoad.property as string];

    if (originalContent === undefined) {
      return;
    }
    console.log("S", originalContent, toLoad.replacements);
    (toProcess as unknown as { [key: string]: string })[toLoad.property as string] = "";
    // #region Normalize replacements to array
    if (!Array.isArray(toLoad.replacements)) {
      toLoad.replacements = [toLoad.replacements];
    }
    // #endregion Normalize replacements to array
    for (let i = 0; i < (toLoad.replacements as []).length; i++) {
      if ((toLoad.replacements as [])[i] === undefined) {
        continue;
      }

      let replacedContent: string = originalContent;
      // #region Perform replacements
      for (const property of Object.keys((toLoad.replacements as [])[i] as unknown as object)) {
        replacedContent = replacedContent?.replace(
          new RegExp(`\\[\\(${property}\\)\\]`, "g"),
          (toLoad.replacements as unknown)[i][property] !== undefined
            ? (toLoad.replacements as unknown)[i][property]
            : "",
        );
      }
      // #endregion Perform replacements
      // #region Set mapped text
      if (i < (toLoad.replacements as []).length - 1) {
        (toProcess as unknown as { [key: string]: string | undefined })[toLoad.property as string] += replacedContent;
      } else {
        (toProcess as unknown as { [key: string]: string | undefined })[toLoad.property as string] += replacedContent;
      }
      // #endregion Set mapped text
      console.log("R", replacedContent);
      console.log("R1", (toProcess as unknown as { [key: string]: string | undefined })[toLoad.property as string]);
    }
    // #endregion Process each context
    console.log("S2", toLoad.css);
    console.log("FINAL innerHTML BEFORE style", (toProcess as HTMLElement).innerHTML);
    console.log("ELEMENT", toProcess, "ID", (toProcess as HTMLElement).id, "TAG", toProcess.tagName);
    console.log("IS CONNECTED", (toProcess as HTMLElement).isConnected, "PARENT", toProcess.parentElement?.id);
    toProcess.setAttribute("style", `${toProcess.getAttribute("style")};${toLoad.css}`);
  }
}

window.codbi.registerFunctionality("HTML.Text.Mapper", HTML_Text_Mapper.functionality.bind(HTML_Text_Mapper)); // Initialization
