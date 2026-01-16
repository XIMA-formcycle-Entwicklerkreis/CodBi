//region Imports
//region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
//endregion XIMA
//region XDBC
import { DBC } from "xdbc/src/DBC";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { CodBiError } from "../global-scope";
import { TYPE } from "xdbc/src/DBC/TYPE";
//endregion XDBC
//endregion Imports
/**
 * Provides the {@link AI.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class AI_OCR {
  /**
   * This functionality scans the selected files of a {@link HTMLINputElement }
   * and either prints the scanned text, extracts the substrings from the scanned text or
   * verifies that the scanned text matches the pattern.
   *
   * #### Config Parameter:
   *  - Mode:             Either **Print**, **Extract**, **Verify** or **Extract Fields**.
   *  - Pattern:          The {@link RegEx } to use to either print the scanned text, extract the substrings from the
   *                      scanned text or to verify that the scanned text matches the pattern.
   *                      If **Extract Fields** is selected, this parameter is ignored.
   *  - FieldPattern_...: The {@link RegEx } to use to extract the substrings from the scanned text. After the dash, the name
   *                      of the field to extract the substrings from the scanned text is specified.
   *                      specified. This name is than to identify which of the {@link HTMLInputElement }s tagged with the
   *                      **AI_TESSERACT_Name**-CodBi-CSS-Class to set the value of with the result.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    @REGEX.PRE(/^[0-9A-Za-z_-]{40}$/, "sitekey")
    @REGEX.PRE(REGEX.stdExp.url, "script")
    toLoad: { [key: string]: unknown },
    toProcess: Element,
  ): void {
    (toProcess as HTMLInputElement).addEventListener("change", (event) => {
      // #region Determine the receiptor elements and return doing nothing if no question elements are found
      const container = document.querySelector(`div .CXUpload:has( #${toProcess.getAttribute("id")})`).parentElement;
      const questionElements = container.querySelectorAll(".AI_TESSERACT_Name");

      questionElements.forEach((element) => {
        const id = element.id;
        const question = element.getAttribute("data-cb-Name");
        if (id && question) {
          console.log(id, question);
        }
      });

      if (toLoad.mode === "extract fields" && questionElements.length === 0) {
        return;
      }
      // #endregion Determine the receiptor elements and return doing nothing if no question elements are found
      const tsMode = TYPE.tsCheck<string>(toLoad.mode, "string").toLowerCase();
      const $ = getJQuery();
      const files = (toProcess as HTMLInputElement).files;
      const formData = new FormData();
      const tsProcessingimagetext = toLoad.processingimagetext
        ? TYPE.tsCheck<string>(toLoad.processingimagetext, "string")
        : undefined;
      const tsInvalidimagetext = toLoad.invalidimagetext
        ? TYPE.tsCheck<string>(toLoad.invalidimagetext, "string")
        : "One or more of the images you selected did not contain the expected text.";
      // #region Append files to FormData
      $.each(files, (i, file) => {
        formData.append(file.name, file);
      });
      // endregion Append files to FormData
      // #region Build X-FieldPatterns from Pattern_* fields
      const fieldPatterns: Array<{ [key: string]: string }> = [];

      if (tsMode === "extract fields") {
        const patternKeys = Object.keys(toLoad).filter((key) => key.startsWith("pattern_"));

        patternKeys.forEach((patternKey) => {
          const fieldName = patternKey.substring(8);
          const pattern = toLoad[patternKey] as string;

          if (fieldName && pattern) {
            const fieldObj: { [key: string]: string } = {};
            // URL encode the pattern value (Kotlin will decode it)
            fieldObj[fieldName] = encodeURIComponent((pattern as string).replace(/°/, "^"));
            fieldPatterns.push(fieldObj);
          }
        });
      }

      const fieldPatternsJson = fieldPatterns.length > 0 ? JSON.stringify(fieldPatterns) : "";
      // endregion Build X-FieldPatterns from Pattern_* fields
      // #region Disable input and show loading animation
      let tsToProcess = INSTANCE.tsCheck<HTMLElement>(toProcess, HTMLElement);
      tsToProcess.style.pointerEvents = "none";
      tsToProcess.style.opacity = "0.5";

      window.codbi.injectLoadingAnim(toProcess);

      const label = INSTANCE.tsCheck<HTMLElement>(tsToProcess.parentElement.querySelector("label"), HTMLElement);
      const formerText = label ? label.innerHTML : "";

      label.innerHTML = `${formerText}${tsProcessingimagetext ? tsProcessingimagetext : ""}`;
      // endregion Disable input and show loading animation
      // #region Define how to remove the loading animation and restore the label
      const unanimate = () => {
        window.codbi.removeLoaderAnim(toProcess);
        tsToProcess.style.pointerEvents = "all";
        tsToProcess.style.opacity = "1";
        label.innerHTML = formerText;
      };
      // endregion Define how to remove the loading animation and restore the label
      // #region Send the request to the Tesseract AI OCR API
      $.ajax({
        url: `${window.codbi.baseURL}plugin?name=CodBi_AI_Tesseract`,
        type: "POST",
        data: formData,
        processData: false,
        contentType: false,
        cache: false,
        headers: {
          "X-Mode": toLoad.mode as string,
          "X-Pattern": encodeURIComponent(toLoad.pattern ? (toLoad.pattern as string).replace(/°/, "^") : ""),
          "X-FieldPatterns": fieldPatternsJson.length > 0 ? encodeURIComponent(fieldPatternsJson) : "",
        },
        success: (response) => {
          console.log("OCR Success:", response);
          // #region Validate verify mode results
          if (tsMode === "verify") {
            const verifyResults = response as { [key: string]: boolean };
            const hasFailure = Object.values(verifyResults).some((result) => result === false);
            if (hasFailure) {
              $(toProcess).error(tsInvalidimagetext);
            } else {
              $(toProcess).error("");
            }
          }
          // endregion Validate verify mode results
          unanimate();
        },
        error: (xhr, status, error) => {
          unanimate();
          throw new CodBiError(`❌ Tesseract AI OCR request failed with status (${status}) due to: ${error}`);
        },
      });
      // endregion Send the request to the Tesseract AI OCR API
    });
  }
  //region Initialization
  /**
   * States whether this {@link AI } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("AI.OCR", AI_OCR.functionality);
  })();
  //endregion Initialization
}
