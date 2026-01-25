//region Imports
//region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
//endregion XIMA
//region XDBC
import { DBC } from "xdbc/src/DBC";
//endregion XDBC
//endregion Imports
/**
 * Provides the {@link AI_ONNX_DONUT_QA.functionality } for
 * DJL ONNX Document Visual Question Answering.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class AI_ONNX_DONUT_QA {
  /**
   * This functionality processes uploaded images using the DJL ONNX Donut model to
   * answer questions about documents. As soon as the file(s) selected changes the AI
   * is contacted via AJAX and the questions are answered. Nothing happens if no file is
   * selected.
   *
   * Questions are acquired from DOM elements within the parent.parent container of the#
   * {@link HTMLInputElement } toProcess that have the class `AI_ONNX_DONUT_QA_Question`.
   * Each such element should have:
   *  - An **id** attribute (used as the question key)
   *  - A **data-cb-DonutQuestion** attribute (contains the question text)
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(toLoad: { [key: string]: unknown }, toProcess: Element): void {
    (toProcess as HTMLInputElement).addEventListener("change", (event) => {
      const $ = getJQuery();
      const files = (toProcess as HTMLInputElement).files;

      if (!files || files.length === 0) {
        return;
      }

      const formData = new FormData();

      for (const file of Array.from(files)) {
        formData.append(file.name, file);
      }
      // #region Acquire Questions
      const headers: { [key: string]: string } = {};
      const questions: Map<string, [string, string]> = new Map();
      const container = document.querySelector(`div .CXUpload:has(#${toProcess.getAttribute("id")})`).parentElement;
      const questionElements = container.querySelectorAll(".AI_ONNX_DONUT_QA_Question");

      for (const element of questionElements) {
        const id = element.id;
        const question = element.getAttribute("data-cb-DonutQuestion");

        if (id && question) {
          headers[`X-Question-${id}`] = question;
        } else {
          if (!id) {
            window.codbi.log(
              "WARNING",
              `Question element missing id attribute in: ${element.outerHTML}`,
              "AI / ONNX / DONUT",
            );
          }
          if (!question) {
            window.codbi.log(
              "WARNING",
              `Question element with id "${id}" missing data-cb-DonutQuestion attribute in: ${element.outerHTML}`,
              "AI / ONNX / DONUT",
            );
          }
        }
      }

      if (Object.keys(headers).length === 0) {
        window.codbi.log(
          "WARNING",
          `No question elements found with class AI_ONNX_DONUT_QA_Question in container "${container.getAttribute("id")}".`,
          "AI / ONNX / DONUT",
        );
      }
      // #endregion Acquire Questions
      // #region Contact ONNX Donut vQA Plugin via AJAX
      $.ajax({
        url: `${window.codbi.baseURL} `,
        type: "POST",
        data: formData,
        dataType: "json",
        processData: false,
        contentType: false,
        cache: false,
        beforeSend: (xhr) => {
          for (const headerName of Object.keys(headers)) {
            xhr.setRequestHeader(headerName, headers[headerName]);
          }
        },
        success: (response) => {
          // #region AI error handling
          if (response.error) {
            window.codbi.log("ERROR", `ONNX DONUT Error: ${response.error}`, "AI / ONNX / DONUT");
            return;
          }
          // #endregion AI error handling
          for (const key in response) {
            for (const key2 in response[key]) {
              (document.querySelector(`#${key2}`) as HTMLInputElement).value = response[key][key2];
            }
          }

          window.codbi.log(
            "INFO",
            `ONNX DONUT Request successful with response: "${JSON.stringify(response)}".`,
            "AI / ONNX / DONUT",
          );
        },
        error: (xhr, status, error) => {
          window.codbi.log(
            "ERROR",
            `ONNX DONUT Request failed with status "${status}" cause "${error}"`,
            "AI / ONNX / DONUT",
          );
        },
      });
      // #endregion Contact ONNX Donut vQA Plugin via AJAX
    });
  }
  //region Initialization
  /**
   * States whether this {@link AI } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("AI.ONNX.DONUT.QA", AI_ONNX_DONUT_QA.functionality);
  })();
  //endregion Initialization
}
