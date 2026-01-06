import {
  REGEX
} from "./chunk-ISMU77I6.js";
import {
  require_dist
} from "./chunk-5LC5FOZV.js";
import {
  DBC
} from "./chunk-O7G7SG2W.js";
import {
  __decorateClass,
  __decorateParam,
  __toESM
} from "./chunk-KWZW6WYL.js";

// src/js/Functionalities/ai.ocr.ts
var import_fc_form_renderer = __toESM(require_dist(), 1);
var _AI_OCR = class _AI_OCR {
  static functionality(toLoad, toProcess) {
    toProcess.addEventListener("change", (event) => {
      const $ = (0, import_fc_form_renderer.getJQuery)();
      const files = toProcess.files;
      if (!files || files.length === 0) {
        console.warn("No files selected.");
        return;
      }
      const formData = new FormData();
      $.each(files, (i, file) => {
        formData.append(file.name, file);
      });
      $.ajax({
        url: `${window.codbi.baseURL}plugin?name=CodBi_AI_Donut_QA`,
        //url: `${window.codbi.baseURL}plugin?name=CodBi_AI_Tesseract`,
        type: "POST",
        data: formData,
        processData: false,
        // Tell jQuery NOT to process the data (must be false for FormData)
        contentType: false,
        // Tell jQuery NOT to set a Content-Type header (browser will set it with boundary)
        cache: false,
        success: (response) => {
          console.log("OCR Success:", response);
          if (response.status === "success") {
            _AI_OCR.handleOcrSuccess(response.results);
          }
        },
        error: (xhr, status, error) => {
          console.error("OCR Request failed:", status, error);
          alert("Error during OCR processing. Check the browser console.");
        }
      });
    });
  }
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  static handleOcrSuccess(results) {
    const $ = (0, import_fc_form_renderer.getJQuery)();
    let output = "";
    $.each(results, (fileName, text) => {
      output += `[${fileName.toString()}]:
${text}

`;
    });
    console.log("J:", output);
  }
  static {
    // #region Initialization
    /**
     * States whether this {@link AI } was successfully registered
     * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
    this.registered = (() => {
      return window.codbi.registerFunctionality("AI.OCR", _AI_OCR.functionality);
    })();
  }
  // #endregion Initialization
};
__decorateClass([
  DBC.ParamvalueProvider,
  __decorateParam(0, REGEX.PRE(/^[0-9A-Za-z_-]{40}$/, "sitekey")),
  __decorateParam(0, REGEX.PRE(REGEX.stdExp.url, "script"))
], _AI_OCR, "functionality", 1);
var AI_OCR = _AI_OCR;
export {
  AI_OCR
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL3BhY2thZ2VzL2Zvcm0vc3JjL2pzL0Z1bmN0aW9uYWxpdGllcy9haS5vY3IudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vICNyZWdpb24gSW1wb3J0c1xuLy8gI3JlZ2lvbiBYSU1BXG5pbXBvcnQgeyBnZXRKUXVlcnkgfSBmcm9tIFwiQGRlLXhpbWEvZmMtZm9ybS1yZW5kZXJlclwiO1xuLy8gI2VuZHJlZ2lvbiBYSU1BXG4vLyAjcmVnaW9uIFhEQkNcbmltcG9ydCB7IERCQyB9IGZyb20gXCJ4ZGJjL3NyYy9EQkNcIjtcbmltcG9ydCB7IFJFR0VYIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9SRUdFWFwiO1xuLy8gI2VuZHJlZ2lvbiBYREJDXG4vLyAjZW5kcmVnaW9uIEltcG9ydHNcbi8qKlxuICogUHJvdmlkZXMgdGhlIHtAbGluayBBSS5mdW5jdGlvbmFsaXR5IH0uXG4gKlxuICogQHJlbWFya3NcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoU2FsdmF0b3JlLkNhbGxhcmlAQW5zYmFjaC5kZSkgKi9cbi8vIGJpb21lLWlnbm9yZSBsaW50L2NvbXBsZXhpdHkvbm9TdGF0aWNPbmx5Q2xhc3M6IFByb2FjdGl2ZSBEZXNpZ24uXG5leHBvcnQgY2xhc3MgQUlfT0NSIHtcbiAgLyoqXG4gICAqIFRoaXMgZnVuY3Rpb25hbGl0eSBuZWVkcyBhIHNpdGUga2V5IHRoYXQgY2FuIGJlIG9idGFpbmVkIGF0IGh0dHBzOi8vZGV2ZWxvcGVycy5nb29nbGUuY29tL3JlY2FwdGNoYSBhbmRcbiAgICogdGhlIFVSTCB3aGVyZSB0byBsb2FkIHRoZSBjYXB0Y2hhIHNjcmlwdCBmcm9tIChlLmcuIGh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vcmVjYXB0Y2hhL2FwaS5qcykuXG4gICAqXG4gICAqIEl0IGluamVjdHMgR29vZ2xlJ3MgUmVDYXB0Y2hhIGluIGEgZGl2IHRoYXQgaGFzIHRvIGhhdmUgdGhlIGNsYXNzIFwiZy1yZWNhcHRjaGFcIiAob25seSB0aGUgZmlyc3QgZm91bmRcbiAgICogZGl2IHRhZ2dlZCB3aXRoIHRoaXMgQ1NTIGNsYXNzIHdpbGwgYmUgdXNlZCBhcyB0aGUgY29udGFpbmVyIGZvciB0aGUgY2FwdGNoYSkuXG4gICAqXG4gICAqIENvbmZpZyBQYXJhbWV0ZXI6XG4gICAqICAtIFNpdGVLZXk6ICAgICAgICAgIFRoZSBzaXRla2V5IHJlY2VpdmVkIGZyb20gaHR0cHM6Ly9kZXZlbG9wZXJzLmdvb2dsZS5jb20vcmVjYXB0Y2hhLlxuICAgKiAgLSBEYXRhQ2FsbGJhY2s6ICAgICBUaGUgb3B0aW9uYWwgZ2xvYmFsIGNhbGxiYWNrIG1ldGhvZCBmb3Igd2hlbiB0aGUgY2FwdGNoYSBwcm92aWRlcyBhIHJlc3VsdC5cbiAgICogIC0gRGF0YUNhbGxiYWNrQ29kZTogT3B0aW9uYWwgY29kZSB0byBiZSBleGVjdXRlZCB3aGVuIHRoZSBjYXB0Y2hhIHByb3ZpZGVzIGEgcmVzdWx0LlxuICAgKiAgLSBTY3JpcHQ6ICAgICAgICAgICBUaGUgR29vZ2xlIFJlQ2FwdGNoYSBzY3JpcHQncyBhZGRyZXNzLlxuICAgKlxuICAgKiBAcGFyYW0gdG9Mb2FkICAgIFByb3ZpZGVkIGJ5IHRoZSBDb2RCaS5cbiAgICogQHBhcmFtIHRvUHJvY2VzcyBQcm92aWRlZCBieSB0aGUgQ29kQmkuICovXG4gIEBEQkMuUGFyYW12YWx1ZVByb3ZpZGVyXG4gIHB1YmxpYyBzdGF0aWMgZnVuY3Rpb25hbGl0eShcbiAgICBAUkVHRVguUFJFKC9eWzAtOUEtWmEtel8tXXs0MH0kLywgXCJzaXRla2V5XCIpXG4gICAgQFJFR0VYLlBSRShSRUdFWC5zdGRFeHAudXJsLCBcInNjcmlwdFwiKVxuICAgIHRvTG9hZDogeyBba2V5OiBzdHJpbmddOiB1bmtub3duIH0sXG4gICAgdG9Qcm9jZXNzOiBFbGVtZW50LFxuICApOiB2b2lkIHtcbiAgICAodG9Qcm9jZXNzIGFzIEhUTUxJbnB1dEVsZW1lbnQpLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAvLyBDaGVjayBpZiBtYXhpbXVtIFx1MDBGQ2JlcnNjaHJpdHRlblxuICAgICAgY29uc3QgJCA9IGdldEpRdWVyeSgpO1xuICAgICAgY29uc3QgZmlsZXMgPSAodG9Qcm9jZXNzIGFzIEhUTUxJbnB1dEVsZW1lbnQpLmZpbGVzO1xuICAgICAgaWYgKCFmaWxlcyB8fCBmaWxlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiTm8gZmlsZXMgc2VsZWN0ZWQuXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIDEuIENyZWF0ZSBhIEZvcm1EYXRhIG9iamVjdFxuICAgICAgLy8gVGhpcyBhdXRvbWF0aWNhbGx5IGhhbmRsZXMgdGhlIG11bHRpcGFydC9mb3JtLWRhdGEgYm91bmRhcnlcbiAgICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XG5cbiAgICAgIC8vIEFkZCBlYWNoIGZpbGUgdG8gdGhlIHJlcXVlc3RcbiAgICAgICQuZWFjaChmaWxlcywgKGksIGZpbGUpID0+IHtcbiAgICAgICAgZm9ybURhdGEuYXBwZW5kKGZpbGUubmFtZSwgZmlsZSk7IC8vIEtleSBzaG91bGQgbWF0Y2ggd2hhdCB5b3VyIHNlcnZsZXQgZXhwZWN0c1xuICAgICAgfSk7XG5cbiAgICAgIC8vIE9wdGlvbmFsOiBBZGQgY3VzdG9tIGhlYWRlcnMgaWYgeW91ciBleGVjdXRlIGxvZ2ljIGRlcGVuZHMgb24gdGhlbVxuXG4gICAgICAvLyAyLiBFeGVjdXRlIHRoZSBBSkFYIFBPU1QgcmVxdWVzdFxuICAgICAgJC5hamF4KHtcbiAgICAgICAgdXJsOiBgJHt3aW5kb3cuY29kYmkuYmFzZVVSTH1wbHVnaW4/bmFtZT1Db2RCaV9BSV9Eb251dF9RQWAsIC8vdXJsOiBgJHt3aW5kb3cuY29kYmkuYmFzZVVSTH1wbHVnaW4/bmFtZT1Db2RCaV9BSV9UZXNzZXJhY3RgLFxuICAgICAgICB0eXBlOiBcIlBPU1RcIixcbiAgICAgICAgZGF0YTogZm9ybURhdGEsXG4gICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZSwgLy8gVGVsbCBqUXVlcnkgTk9UIHRvIHByb2Nlc3MgdGhlIGRhdGEgKG11c3QgYmUgZmFsc2UgZm9yIEZvcm1EYXRhKVxuICAgICAgICBjb250ZW50VHlwZTogZmFsc2UsIC8vIFRlbGwgalF1ZXJ5IE5PVCB0byBzZXQgYSBDb250ZW50LVR5cGUgaGVhZGVyIChicm93c2VyIHdpbGwgc2V0IGl0IHdpdGggYm91bmRhcnkpXG4gICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgc3VjY2VzczogKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJPQ1IgU3VjY2VzczpcIiwgcmVzcG9uc2UpO1xuICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IFwic3VjY2Vzc1wiKSB7XG4gICAgICAgICAgICAvLyBVcGRhdGUgeW91ciBmb3JtIGZpZWxkcyB3aXRoIHRoZSByZXN1bHRcbiAgICAgICAgICAgIEFJX09DUi5oYW5kbGVPY3JTdWNjZXNzKHJlc3BvbnNlLnJlc3VsdHMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZXJyb3I6ICh4aHIsIHN0YXR1cywgZXJyb3IpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiT0NSIFJlcXVlc3QgZmFpbGVkOlwiLCBzdGF0dXMsIGVycm9yKTtcbiAgICAgICAgICBhbGVydChcIkVycm9yIGR1cmluZyBPQ1IgcHJvY2Vzc2luZy4gQ2hlY2sgdGhlIGJyb3dzZXIgY29uc29sZS5cIik7XG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cbiAgc3RhdGljIGhhbmRsZU9jclN1Y2Nlc3MocmVzdWx0czogYW55KTogdm9pZCB7XG4gICAgY29uc3QgJCA9IGdldEpRdWVyeSgpO1xuICAgIGxldCBvdXRwdXQgPSBcIlwiO1xuICAgICQuZWFjaChyZXN1bHRzLCAoZmlsZU5hbWUsIHRleHQpID0+IHtcbiAgICAgIG91dHB1dCArPSBgWyR7ZmlsZU5hbWUudG9TdHJpbmcoKX1dOlxcbiR7dGV4dH1cXG5cXG5gO1xuICAgIH0pO1xuICAgIC8vIEFzc3VtaW5nICd0Zk9jclJlc3VsdCcgaXMgdGhlIG5hbWUgb2YgeW91ciB0ZXh0YXJlYVxuICAgIGNvbnNvbGUubG9nKFwiSjpcIiwgb3V0cHV0KTtcbiAgfVxuICAvLyAjcmVnaW9uIEluaXRpYWxpemF0aW9uXG4gIC8qKlxuICAgKiBTdGF0ZXMgd2hldGhlciB0aGlzIHtAbGluayBBSSB9IHdhcyBzdWNjZXNzZnVsbHkgcmVnaXN0ZXJlZFxuICAgKiB2aWEge0BsaW5rIENvZGJpR2xvYmFsLnJlZ2lzdGVyRnVuY3Rpb25hbGl0eSB9IHdpdGggdGhlIENvZEJpIGFuZCBwZXJmb3JtcyB0aGUgcmVnaXN0cmF0aW9uIHVwb24gY2xhc3MgdXNhZ2UuKi9cbiAgcHVibGljIHN0YXRpYyByZWdpc3RlcmVkOiBib29sZWFuID0gKCgpID0+IHtcbiAgICByZXR1cm4gd2luZG93LmNvZGJpLnJlZ2lzdGVyRnVuY3Rpb25hbGl0eShcIkFJLk9DUlwiLCBBSV9PQ1IuZnVuY3Rpb25hbGl0eSk7XG4gIH0pKCk7XG4gIC8vICNlbmRyZWdpb24gSW5pdGlhbGl6YXRpb25cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSw4QkFBMEI7QUFhbkIsSUFBTSxVQUFOLE1BQU0sUUFBTztBQUFBLEVBaUJsQixPQUFjLGNBR1osUUFDQSxXQUNNO0FBQ04sSUFBQyxVQUErQixpQkFBaUIsVUFBVSxDQUFDLFVBQVU7QUFFcEUsWUFBTSxRQUFJLG1DQUFVO0FBQ3BCLFlBQU0sUUFBUyxVQUErQjtBQUM5QyxVQUFJLENBQUMsU0FBUyxNQUFNLFdBQVcsR0FBRztBQUNoQyxnQkFBUSxLQUFLLG9CQUFvQjtBQUNqQztBQUFBLE1BQ0Y7QUFJQSxZQUFNLFdBQVcsSUFBSSxTQUFTO0FBRzlCLFFBQUUsS0FBSyxPQUFPLENBQUMsR0FBRyxTQUFTO0FBQ3pCLGlCQUFTLE9BQU8sS0FBSyxNQUFNLElBQUk7QUFBQSxNQUNqQyxDQUFDO0FBS0QsUUFBRSxLQUFLO0FBQUEsUUFDTCxLQUFLLEdBQUcsT0FBTyxNQUFNLE9BQU87QUFBQTtBQUFBLFFBQzVCLE1BQU07QUFBQSxRQUNOLE1BQU07QUFBQSxRQUNOLGFBQWE7QUFBQTtBQUFBLFFBQ2IsYUFBYTtBQUFBO0FBQUEsUUFDYixPQUFPO0FBQUEsUUFDUCxTQUFTLENBQUMsYUFBYTtBQUNyQixrQkFBUSxJQUFJLGdCQUFnQixRQUFRO0FBQ3BDLGNBQUksU0FBUyxXQUFXLFdBQVc7QUFFakMsb0JBQU8saUJBQWlCLFNBQVMsT0FBTztBQUFBLFVBQzFDO0FBQUEsUUFDRjtBQUFBLFFBQ0EsT0FBTyxDQUFDLEtBQUssUUFBUSxVQUFVO0FBQzdCLGtCQUFRLE1BQU0sdUJBQXVCLFFBQVEsS0FBSztBQUNsRCxnQkFBTSx5REFBeUQ7QUFBQSxRQUNqRTtBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0gsQ0FBQztBQUFBLEVBQ0g7QUFBQTtBQUFBLEVBRUEsT0FBTyxpQkFBaUIsU0FBb0I7QUFDMUMsVUFBTSxRQUFJLG1DQUFVO0FBQ3BCLFFBQUksU0FBUztBQUNiLE1BQUUsS0FBSyxTQUFTLENBQUMsVUFBVSxTQUFTO0FBQ2xDLGdCQUFVLElBQUksU0FBUyxTQUFTLENBQUM7QUFBQSxFQUFPLElBQUk7QUFBQTtBQUFBO0FBQUEsSUFDOUMsQ0FBQztBQUVELFlBQVEsSUFBSSxNQUFNLE1BQU07QUFBQSxFQUMxQjtBQUFBLEVBS0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFNBQWMsY0FBdUIsTUFBTTtBQUN6QyxhQUFPLE9BQU8sTUFBTSxzQkFBc0IsVUFBVSxRQUFPLGFBQWE7QUFBQSxJQUMxRSxHQUFHO0FBQUE7QUFBQTtBQUVMO0FBbEVnQjtBQUFBLEVBRGIsSUFBSTtBQUFBLEVBRUYseUJBQU0sSUFBSSx1QkFBdUIsU0FBUztBQUFBLEVBQzFDLHlCQUFNLElBQUksTUFBTSxPQUFPLEtBQUssUUFBUTtBQUFBLEdBbkI1QixTQWlCRztBQWpCVCxJQUFNLFNBQU47IiwKICAibmFtZXMiOiBbXQp9Cg==
