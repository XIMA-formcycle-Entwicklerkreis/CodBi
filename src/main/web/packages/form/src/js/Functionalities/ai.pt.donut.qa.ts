//region Imports
//region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
//endregion XIMA
//region XDBC
import { DBC } from "xdbc/src/DBC";
//endregion XDBC
//endregion Imports
/**
 * Provides the {@link AI_PT_DONUT_QA.functionality } for
 * DJL PyTorchDonut Document Visual Question Answering.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class AI_PT_DONUT_QA {
  /**
   * This functionality processes uploaded images using the DJL PyTorch Donut model to
   * answer questions about documents. As soon as the file(s) selected changes the AI
   * is contacted via AJAX and the questions are answered. Nothing happens if no file is
   * selected.
   *
   * Questions are acquired from DOM elements within the parent.parent container of the#
   * {@link HTMLInputElement } toProcess that have the class `AI_PT_DONUT_QA_Question`. Each such element should have:
   *  - An `id` attribute (used as the question key)
   *  - A `data-cb-DonutQuestion` attribute (contains the question text)
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(toLoad: { [key: string]: unknown }, toProcess: Element): void {
    (toProcess as HTMLInputElement).addEventListener("change", (event) => {
      const $ = getJQuery();
      const files = (toProcess as HTMLInputElement).files;

      if (!files || files.length === 0) return;

      const formData = new FormData();

      $.each(files, (i, file) => {
        formData.append(file.name, file);
      });

      const headers: { [key: string]: string } = {};
      const questions: Map<string, [string, string]> = new Map();

      const container = document.querySelector(`div .CXUpload:has( #${toProcess.getAttribute("id")})`).parentElement;

      // Find all elemendts with class AI_PT_DONUT_QA_Question
      const questionElements = container.querySelectorAll(".AI_PT_DONUT_QA_Question");
      console.log(questionElements);
      questionElements.forEach((element) => {
        const id = element.id;
        const question = element.getAttribute("data-cb-DonutQuestion");

        if (id && question) {
          // Use X-Question-{key} pattern where key is the element's id
          headers[`X-Question-${id}`] = question;
        } else {
          if (!id) console.warn("Question element missing id attribute:", element);
          if (!question)
            console.warn(`Question element with id "${id}" missing data-cb-DonutQuestion attribute:`, element);
        }
      });

      if (Object.keys(headers).length === 0) {
        console.warn("No question elements found with class AI_PT_DONUT_QA_Question in parent.parent container.");
      }

      // 2. Execute the AJAX POST request
      $.ajax({
        url: `${window.codbi.baseURL}plugin?name=CodBi_AI_Donut_QA`,
        type: "POST",
        data: formData,
        dataType: "json", // Expect JSON response
        processData: false, // Tell jQuery NOT to process the data (must be false for FormData)
        contentType: false, // Tell jQuery NOT to set a Content-Type header (browser will set it with boundary)
        cache: false,
        beforeSend: (xhr) => {
          // Set custom headers
          Object.keys(headers).forEach((headerName) => {
            xhr.setRequestHeader(headerName, headers[headerName]);
          });
        },
        success: (response) => {
          console.log("Donut QA Success:", response);
          // Response should be automatically parsed as JSON by jQuery (dataType: "json")
          // But handle both cases for safety
          for (let key in response)
            for (let key2 in response[key])
              (document.querySelector(`#${key2}`) as HTMLInputElement).value = response[key][key2];
        },
        error: (xhr, status, error) => {
          console.error("Donut QA Request failed:", status, error);
          alert("Error during document Q&A processing. Check the browser console.");
        },
      });
    });
  }
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  static handleOcrSuccess(results: any): void {
    const $ = getJQuery();
    let output = "";
    // Results structure: { "filename": { "key1": "answer1", "key2": "answer2" }, ... }
    $.each(results, (fileName, answers) => {
      output += `[${fileName.toString()}]:\n`;

      if (typeof answers === "object" && answers !== null) {
        $.each(answers as { [key: string]: string }, (key, answer) => {
          output += `  ${key}: ${answer}\n`;
        });
      } else {
        output += `  ${answers}\n`;
      }
      output += "\n";
    });
    console.log("Donut QA Results:", output);
    // You can also update form fields here based on the question keys
    // For example, if you have fields named "total" and "date", you can populate them:
    // $.each(results, (fileName, answers) => {
    //   if(answers.total) {
    //     $('input[name="total"]').val(answers.total);
    //   }
    //   if(answers.date) {
    //     $('input[name="date"]').val(answers.date);
    //   }
    // });
  }
  //region Initialization
  /**
   * States whether this {@link AI } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("AI.PT.DONUT.QA", AI_PT_DONUT_QA.functionality);
  })();
  //endregion Initialization
}
