// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { REGEX } from "xdbc/src/DBC/REGEX";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link AI.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class AI_OCR {
  /**
   * This functionality needs a site key that can be obtained at https://developers.google.com/recaptcha and
   * the URL where to load the captcha script from (e.g. https://www.google.com/recaptcha/api.js).
   *
   * It injects Google's ReCaptcha in a div that has to have the class "g-recaptcha" (only the first found
   * div tagged with this CSS class will be used as the container for the captcha).
   *
   * Config Parameter:
   *  - SiteKey:          The sitekey received from https://developers.google.com/recaptcha.
   *  - DataCallback:     The optional global callback method for when the captcha provides a result.
   *  - DataCallbackCode: Optional code to be executed when the captcha provides a result.
   *  - Script:           The Google ReCaptcha script's address.
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
      // Check if maximum überschritten
      const $ = getJQuery();
      const files = (toProcess as HTMLInputElement).files;
      if (!files || files.length === 0) {
        console.warn("No files selected.");
        return;
      }

      // 1. Create a FormData object
      // This automatically handles the multipart/form-data boundary
      const formData = new FormData();

      // Add each file to the request
      $.each(files, (i, file) => {
        formData.append(file.name, file); // Key should match what your servlet expects
      });

      // Optional: Add custom headers if your execute logic depends on them

      // 2. Execute the AJAX POST request
      $.ajax({
        url: `${window.codbi.baseURL}plugin?name=CodBi_Donut_QA`, //url: `${window.codbi.baseURL}plugin?name=CodBi_AI_Tesseract`,
        type: "POST",
        data: formData,
        processData: false, // Tell jQuery NOT to process the data (must be false for FormData)
        contentType: false, // Tell jQuery NOT to set a Content-Type header (browser will set it with boundary)
        cache: false,
        success: (response) => {
          console.log("OCR Success:", response);
          if (response.status === "success") {
            // Update your form fields with the result
            AI_OCR.handleOcrSuccess(response.results);
          }
        },
        error: (xhr, status, error) => {
          console.error("OCR Request failed:", status, error);
          alert("Error during OCR processing. Check the browser console.");
        },
      });
    });
  }
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  static handleOcrSuccess(results: any): void {
    const $ = getJQuery();
    let output = "";
    $.each(results, (fileName, text) => {
      output += `[${fileName.toString()}]:\n${text}\n\n`;
    });
    // Assuming 'tfOcrResult' is the name of your textarea
    console.log("J:", output);
  }
  // #region Initialization
  /**
   * States whether this {@link AI } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("AI.OCR", AI_OCR.functionality);
  })();
  // #endregion Initialization
}
