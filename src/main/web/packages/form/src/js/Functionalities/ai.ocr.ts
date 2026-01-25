//region Imports
//region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
//endregion XIMA
//region XDBC
import { DBC } from "xdbc/src/DBC";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { CodBiError } from "../global-scope";
import { TYPE } from "xdbc/src/DBC/TYPE";
//endregion XDBC
//endregion Imports
/**
 * Provides the {@link AI.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de)
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class AI_OCR {
  /**
   * This functionality scans the selected files of a {@link HTMLINputElement } either prints the scanned text, extracts
   * substrings from the scanned text or verifies that the scanned text matches the pattern using the Tesseract AI-OCR engine.
   *
   * #### Config Parameter:
   *  - **Mode**:                 Either **Print**, **Verify** or **Extract Fields**.
   *  - **Pattern**:              The {@link RegEx } to use to either extract the substrings from the scanned text or to verify that
   *                              the scanned text matches the pattern.
   *                              When the mode is **Extract Fields** all fields within the parent container of the one containing
   *                              the {@link HTMLInputElement } toProcess that have the CodBi-CSS-Class **AI_TESSERACT_Name** are
   *                              used to receive the extracted fields. For each such field, a corresponding parameter
   *                              **Pattern_...** must be defined to specify the {@link RegEx } to use to extract the substrings
   *                              from the scanned text for that field. The name of the field is specified after the dash and are
   *                              matched to the **data-cb-Field** of the field to extract the substrings from the scanned text.
   *  - **Separator**:            If **Mode** is set to **Extract Fields**, this parameter defines the separator for the results of
   *                              multiple files. Default is a comma.
   *  - **RegExFlags**:           Optional regex flags to apply to all patterns (e.g., "i" for case-insensitive, "m" for multiline,
   *                              "s" for dotall). Multiple flags can be combined (e.g., "im"). These flags are transmitted to the
   *                              Tesseract servlet and applied to pattern matching.
   *  - **Preprocess**:           Optional boolean flag to enable image preprocessing before OCR. When set to **true**, applies
   *                              grayscale conversion, adaptive binarization (Otsu's method), and noise reduction to improve
   *                              text recognition accuracy. Default is **false**.
   *  - **InvalidImageText**:     The text to display if one or more of the images do not comply to the specified **Pattern** in
   *                              mode **Verify**.
   *  - **WrongFileMessage**:     The text to display for the manual verification checkbox label in mode **Verify**.
   *  - **ProcessingImageText**:  The text to append to the label of the {@link HTMLInputElement } toProcess while the images
   *
   * ### CSS Classes:
   * - **AI_TESSERACT_Name**: Elements with this class within the parent container of the one holding the
   *                          {@link HTMLInputElement } **toProcess** are used to receive the extracted fields when **Mode** is
   *                          set to **Extract Fields**. Each such element should have **data-cb-Field** set to the name of the
   *                          field to receive the extracted text for (see **Pattern_...** config parameter).   *
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(toLoad: { [key: string]: unknown }, toProcess: Element): void {
    (toProcess as HTMLInputElement).addEventListener("change", (event) => {
      const tsMode = TYPE.tsCheck<string>(toLoad.mode, "string").toLowerCase();
      const container = document.querySelector(`div .CXUpload:has( #${toProcess.getAttribute("id")})`).parentElement;
      // #region Determine questions
      if (tsMode === "extract fields") {
        const questionElements = container.querySelectorAll(".AI_TESSERACT_Name");

        for (const element of questionElements) {
          const id = element.id;
          const question = element.getAttribute("data-cb-Name");
        }

        if (tsMode === "extract fields" && questionElements.length === 0) {
          return;
        }
      }
      // #endregion Determine questions
      const $ = getJQuery();
      const files = INSTANCE.tsCheck<HTMLInputElement>(toProcess, HTMLInputElement).files;
      const formData = new FormData();
      const tsProcessingimagetext = toLoad.processingimagetext
        ? TYPE.tsCheck<string>(toLoad.processingimagetext, "string")
        : undefined;
      const tsInvalidimagetext = toLoad.invalidimagetext
        ? TYPE.tsCheck<string>(toLoad.invalidimagetext, "string")
        : "At least one of the images you selected did not contain the expected content.";
      // #region Append files to FormData
      $.each(files, (i, file) => {
        formData.append(file.name, file);
      });
      // endregion Append files to FormData
      // #region Build X-FieldPatterns from Pattern_* fields
      const fieldPatterns: Array<{ [key: string]: string }> = [];

      if (tsMode === "extract fields") {
        const patternKeys = Object.keys(toLoad).filter((key) => key.startsWith("pattern_"));

        for (const patternKey of patternKeys) {
          const fieldName = patternKey.substring(8);
          const pattern = toLoad[patternKey] as string;

          if (fieldName && pattern) {
            const fieldObj: { [key: string]: string } = {};
            fieldObj[fieldName] = encodeURIComponent((pattern as string).replace(/°/, "^"));

            fieldPatterns.push(fieldObj);
          }
        }
      }

      const fieldPatternsJson = fieldPatterns.length > 0 ? JSON.stringify(fieldPatterns) : "";
      // endregion Build X-FieldPatterns from Pattern_* fields
      // #region Disable input and show loading animation
      const tsToProcess = INSTANCE.tsCheck<HTMLElement>(toProcess, HTMLElement);
      tsToProcess.style.pointerEvents = "none";
      tsToProcess.style.opacity = "0.5";

      window.codbi.injectLoadingAnim(toProcess);

      const label = INSTANCE.tsCheck<HTMLElement>(tsToProcess.parentElement.querySelector("label"), HTMLElement);
      const formerText = label ? label.innerHTML : "";

      if (tsProcessingimagetext) {
        label.innerHTML = `${formerText}
        <style>
          @keyframes highlight {
            0%    { opacity:1; }
            50%   { opacity:0; }
            100%  { opacity:1; }}
                  
          .OCR_Verification { font-weight: bold ; color: darkorange ; animation: highlight 2s ease-in-out infinite ;}</style>

        <span class = "OCR_Verification">${tsProcessingimagetext}</span>`;
      }
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
      const ajaxHeaders: { [key: string]: string } = { "X-Mode": toLoad.mode as string };

      if (tsMode !== "print") {
        ajaxHeaders["X-Pattern"] = encodeURIComponent(
          toLoad.pattern ? (toLoad.pattern as string).replace(/°/, "^") : "",
        );

        ajaxHeaders["X-FieldPatterns"] = fieldPatternsJson.length > 0 ? encodeURIComponent(fieldPatternsJson) : "";
      }

      if (toLoad.regexflags) {
        ajaxHeaders["X-RegexFlags"] = TYPE.tsCheck<string>(toLoad.regexflags, "string");
      }

      if (toLoad.preprocess) {
        const preprocessValue = TYPE.tsCheck<string>(toLoad.preprocess, "string").toLowerCase();
        ajaxHeaders["X-Preprocess"] = preprocessValue === "true" || preprocessValue === "1" ? "true" : "false";
      }

      $.ajax({
        url: `${window.codbi.baseURL}plugin?name=CodBi_AI_Tesseract`,
        type: "POST",
        data: formData,
        processData: false,
        contentType: false,
        cache: false,
        headers: ajaxHeaders,
        success: (response) => {
          window.codbi.log("INFO", "Tesseract AI OCR request returned: ${JSON.stringify(response)}.", "AI / TESSERACT");
          // #region Print mode: Place result(s) in <textarea>
          if (tsMode === "print") {
            const parent2 = toProcess.parentElement?.parentElement?.parentElement || null;

            if (parent2) {
              const receiverElem = parent2.querySelector(".CodBi_AI_Tesseract_Receiver") as HTMLTextAreaElement | null;

              if (receiverElem) {
                let responseText = "";

                if (typeof response === "string") {
                  responseText = response;
                } else if (response && typeof response === "object") {
                  const values = Object.values(response);
                  const textValues = values.map((val) => (typeof val === "string" ? val : JSON.stringify(val)));
                  responseText = textValues.join("\n\n");
                } else {
                  responseText = JSON.stringify(response);
                }
                receiverElem.value = responseText.replace(/\\n/g, "\n");
              } else {
                window.codbi.log(
                  "INFO",
                  `Receiver element with class 'CodBi_AI_Tesseract_Receiver' not found in #${toProcess.parentElement.parentElement.getAttribute("id")}.`,
                  "AI / TESSERACT",
                );
              }
            }
          }
          // #endregion Print mode: Place result(s) in <textarea>
          // #region Extract fields mode: Set values on of CSS-Class "CodBi_AI_OCR_Receiver"
          if (tsMode === "extract fields" && typeof response === "object" && response !== null) {
            const parent3 = toProcess.parentElement?.parentElement?.parentElement || null;
            if (parent3) {
              const receivers = parent3.querySelectorAll(".CodBi_AI_OCR_Receiver");
              for (const elem of receivers) {
                const field = (elem as HTMLElement).getAttribute("data-cb-Field").toLowerCase();
                if (field) {
                  const separator = toLoad.separator ? (toLoad.separator as string) : ",";
                  const collectedValues: string[] = [];

                  // Process all filename properties in response
                  for (const fileKey in response) {
                    if (Object.prototype.hasOwnProperty.call(response, fileKey)) {
                      const fileData = response[fileKey];
                      if (
                        fileData &&
                        typeof fileData === "object" &&
                        Object.prototype.hasOwnProperty.call(fileData, field)
                      ) {
                        const fieldValue = fileData[field];
                        if (Array.isArray(fieldValue)) {
                          collectedValues.push(...fieldValue);
                        } else if (typeof fieldValue === "string") {
                          collectedValues.push(fieldValue);
                        }
                      }
                    }
                  }

                  if (collectedValues.length > 0) {
                    const joinedValue = collectedValues.join(separator);
                    if ("value" in elem) {
                      (elem as HTMLInputElement | HTMLTextAreaElement).value = joinedValue;
                    } else {
                      elem.textContent = joinedValue;
                    }
                  }
                }
              }
            }
          }
          // #endregion Extract fields mode: Set values on of CSS-Class "CodBi_AI_OCR_Receiver"
          // #region Validate verify mode results
          if (tsMode === "verify") {
            if (Object.values(response as { [key: string]: boolean }).some((result) => result === false)) {
              $(toProcess).error(tsInvalidimagetext);
              // #region Add styles for manual verification checkbox
              if (!toProcess.querySelector("#CodBi_AI_OCR_ManualVerify_Styles")) {
                const style = document.createElement("style");

                style.textContent = `
                  .CodBi_AI_OCR_ManualVerify { display: flex ; align-items: center ; margin-top: 8px ; gap: 8px ;
                    flex-wrap: nowrap ;}

                  .CodBi_AI_OCR_ManualVerify_Checkbox { cursor: pointer ; opacity: 1 !important ; position: relative !important ;
                    flex-shrink: 0 ;}

                  .CodBi_AI_OCR_ManualVerify label { margin-bottom: 0 ; position: relative !important ; white-space: nowrap ;}
                  
                  @keyframes highlight {
                    0%    { opacity:1; }
                    50%   { opacity:0; }
                    100%  { opacity:1; }}
                  
                  .CodBi_AI_OCR_ManualVerify label span { font-weight: bold ; color: darkorange ;
                    animation: highlight 2s ease-in-out infinite ;}`;

                toProcess.appendChild(style);
              }
              // #endregion Add styles for manual verification checkbox
              // #region Remove existing manual verify checkbox
              const existingManualVerify =
                toProcess.parentElement.parentElement.querySelectorAll(".CodBi_AI_OCR_ManualVerify");

              for (let i = 0; i < existingManualVerify.length; i++) {
                existingManualVerify[i].remove();
              }
              // #endregion Remove existing manual verify checkbox
              // #region Create checkbox for manual verification
              const checkboxContainer = document.createElement("div");
              checkboxContainer.className = "CodBi_AI_OCR_ManualVerify";
              checkboxContainer.style.display = "flex";
              checkboxContainer.style.alignItems = "center";
              checkboxContainer.style.marginTop = "8px";
              checkboxContainer.style.gap = "8px";

              const checkbox = document.createElement("input");
              checkbox.type = "checkbox";
              checkbox.id = `manual-verify-${toProcess.id}`;
              checkbox.className = "CodBi_AI_OCR_ManualVerify_Checkbox";

              const label = document.createElement("label");
              label.htmlFor = checkbox.id;
              label.textContent = toLoad.wrongfilemessage
                ? (toLoad.wrongfilemessage as string)
                : "The content is not as expected. You may manually verify that it is the correct one by clicking the checkbox.";
              label.style.marginBottom = "0";

              checkboxContainer.appendChild(checkbox);
              checkboxContainer.appendChild(label);
              toProcess.parentElement.insertAdjacentElement("afterend", checkboxContainer);
              // #endregion Create checkbox for manual verification
              // #region Handle checkbox change
              checkbox.addEventListener("change", () => {
                if (checkbox.checked) {
                  $(toProcess).error("");
                } else {
                  $(toProcess).error(tsInvalidimagetext);
                }
              });
              // #endregion Handle checkbox change
            } else {
              $(toProcess).error("");
            }
          }
          // #endregion Validate verify mode results
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
