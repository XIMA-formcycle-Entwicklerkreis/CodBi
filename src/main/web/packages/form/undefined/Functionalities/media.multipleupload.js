import { DEFINED } from "./chunk-JP4GUAZX.js";
import { EQ } from "./chunk-RI3LWO6O.js";
import { IF } from "./chunk-2VQP2CFN.js";
import { REGEX } from "./chunk-F3IDEOQS.js";
import { TYPE } from "./chunk-O5T7YW22.js";
import { INSTANCE } from "./chunk-53TEMTGA.js";
import "./chunk-LFRFVRJV.js";
import { require_dist } from "./chunk-ZTMSSRTV.js";
import { __decorateClass, __decorateParam, __toESM } from "./chunk-AOJQKO6T.js";

// src/js/Functionalities/media.multipleupload.ts
var import_fc_form_renderer = __toESM(require_dist(), 1);
var Media_MultipleUpload = class {
  /**
   * Registers the "Media.MultipleUpload"-Functionality.
   *
   * This functionality enables a file upload dialogue to support selecting multiple files for upload.
   *
   * Parameter:
   *  - Maximum:        The number of files that may be uploaded.
   *  - prefixTooMany:  The message that is displayed before the **Maximum** if too many files were selected.
   *  - postfixTooMany: The message that is displayed after the **Maximum** if too many files were selected. */
  static functionality(toLoad, toProcess) {
    const maximum = toLoad.maximum ? Number.parseInt(toLoad.maximum) : 2;
    const labelText = DEFINED.tsCheck(
      toProcess.parentElement.querySelector("label span"),
      `Isn't there a <label> with a <span> for the tagged <input type="file">?`,
    ).innerHTML;
    toProcess.addEventListener("change", (event) => {
      if (toProcess.files.length > maximum) {
        (0, import_fc_form_renderer.getJQuery)()(toProcess).error(
          toLoad.prefixtoomany && toLoad.postfixtoomany
            ? toLoad.prefixtoomany + toLoad.maximum + toLoad.postfixtoomany
            : `Too many files selected. The maximum number of files is ${toLoad.maximum ? toLoad.maximum : 2}.`,
        );
      } else {
        (0, import_fc_form_renderer.getJQuery)()(toProcess).error("");
        if (toProcess.files.length !== 1) {
          toProcess.parentElement.querySelector("label span").innerHTML = `${labelText} (`;
          for (const file of toProcess.files) {
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
};
__decorateClass(
  [
    __decorateParam(0, TYPE.PRE("string", "prefixtoomany :: postfixtoomany")),
    __decorateParam(0, TYPE.PRE("string | number", "maximum")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(/\d+/), "maximum")),
    __decorateParam(1, INSTANCE.PRE(HTMLInputElement, "Is it not an <input> that is tagged with this functionality?")),
    __decorateParam(
      1,
      EQ.PRE("type", false, 'Is it not an <input type = "file"> that is tagged with this functionality?', "type"),
    ),
  ],
  Media_MultipleUpload,
  "functionality",
  1,
);
window.codbi.registerFunctionality(
  "Media.MultipleUpload",
  Media_MultipleUpload.functionality.bind(Media_MultipleUpload),
);
export { Media_MultipleUpload };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2pzL0Z1bmN0aW9uYWxpdGllcy9tZWRpYS5tdWx0aXBsZXVwbG9hZC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gI3JlZ2lvbiBJbXBvcnRzXG4vLyAjcmVnaW9uIFhEQkNcbmltcG9ydCB7IElGIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9JRlwiO1xuaW1wb3J0IHsgRVEgfSBmcm9tIFwieGRiYy9zcmMvREJDL0VRXCI7XG5pbXBvcnQgeyBUWVBFIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9UWVBFXCI7XG5pbXBvcnQgeyBSRUdFWCB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvUkVHRVhcIjtcbmltcG9ydCB7IERFRklORUQgfSBmcm9tIFwieGRiYy9zcmMvREJDL0RFRklORURcIjtcbmltcG9ydCB7IElOU1RBTkNFIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9JTlNUQU5DRVwiO1xuLy8gI2VuZHJlZ2lvbiBYREJDXG4vLyAjcmVnaW9uIFhJTUFcbmltcG9ydCB7IGdldEpRdWVyeSB9IGZyb20gXCJAZGUteGltYS9mYy1mb3JtLXJlbmRlcmVyXCI7XG4vLyAjZW5kcmVnaW9uIFhJTUFcbi8vICNlbmRyZWdpb24gSW1wb3J0c1xuLyoqXG4gKiBQcm92aWRlcyB0aGUge0BsaW5rIEhUTUxfU2VsZWN0X0luamVjdGlvbi5mdW5jdGlvbmFsaXR5IH0uXG4gKlxuICogQHJlbWFya3NcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoU2FsdmF0b3JlLkNhbGxhcmlAQW5zYmFjaC5kZSkgKi9cbi8vIGJpb21lLWlnbm9yZSBsaW50L2NvbXBsZXhpdHkvbm9TdGF0aWNPbmx5Q2xhc3M6IFByb2FjdGl2ZSBEZXNpZ24uXG5leHBvcnQgY2xhc3MgTWVkaWFfTXVsdGlwbGVVcGxvYWQge1xuICAvKipcbiAgICogUmVnaXN0ZXJzIHRoZSBcIk1lZGlhLk11bHRpcGxlVXBsb2FkXCItRnVuY3Rpb25hbGl0eS5cbiAgICpcbiAgICogVGhpcyBmdW5jdGlvbmFsaXR5IGVuYWJsZXMgYSBmaWxlIHVwbG9hZCBkaWFsb2d1ZSB0byBzdXBwb3J0IHNlbGVjdGluZyBtdWx0aXBsZSBmaWxlcyBmb3IgdXBsb2FkLlxuICAgKlxuICAgKiBQYXJhbWV0ZXI6XG4gICAqICAtIE1heGltdW06ICAgICAgICBUaGUgbnVtYmVyIG9mIGZpbGVzIHRoYXQgbWF5IGJlIHVwbG9hZGVkLlxuICAgKiAgLSBwcmVmaXhUb29NYW55OiAgVGhlIG1lc3NhZ2UgdGhhdCBpcyBkaXNwbGF5ZWQgYmVmb3JlIHRoZSAqKk1heGltdW0qKiBpZiB0b28gbWFueSBmaWxlcyB3ZXJlIHNlbGVjdGVkLlxuICAgKiAgLSBwb3N0Zml4VG9vTWFueTogVGhlIG1lc3NhZ2UgdGhhdCBpcyBkaXNwbGF5ZWQgYWZ0ZXIgdGhlICoqTWF4aW11bSoqIGlmIHRvbyBtYW55IGZpbGVzIHdlcmUgc2VsZWN0ZWQuICovXG4gIHB1YmxpYyBzdGF0aWMgZnVuY3Rpb25hbGl0eShcbiAgICBAVFlQRS5QUkUoXCJzdHJpbmdcIiwgXCJwcmVmaXh0b29tYW55IDo6IHBvc3RmaXh0b29tYW55XCIpXG4gICAgQFRZUEUuUFJFKFwic3RyaW5nIHwgbnVtYmVyXCIsIFwibWF4aW11bVwiKVxuICAgIEBJRi5QUkUobmV3IFRZUEUoXCJzdHJpbmdcIiksIG5ldyBSRUdFWCgvXFxkKy8pLCBcIm1heGltdW1cIilcbiAgICB0b0xvYWQ6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0sXG5cbiAgICBASU5TVEFOQ0UuUFJFKEhUTUxJbnB1dEVsZW1lbnQsIFwiSXMgaXQgbm90IGFuIDxpbnB1dD4gdGhhdCBpcyB0YWdnZWQgd2l0aCB0aGlzIGZ1bmN0aW9uYWxpdHk/XCIpXG4gICAgQEVRLlBSRShcInR5cGVcIiwgZmFsc2UsICdJcyBpdCBub3QgYW4gPGlucHV0IHR5cGUgPSBcImZpbGVcIj4gdGhhdCBpcyB0YWdnZWQgd2l0aCB0aGlzIGZ1bmN0aW9uYWxpdHk/JywgXCJ0eXBlXCIpXG4gICAgdG9Qcm9jZXNzOiBFbGVtZW50LFxuICApOiB2b2lkIHtcbiAgICBjb25zdCBtYXhpbXVtID0gdG9Mb2FkLm1heGltdW0gPyBOdW1iZXIucGFyc2VJbnQodG9Mb2FkLm1heGltdW0pIDogMjtcbiAgICBjb25zdCBsYWJlbFRleHQgPSBERUZJTkVELnRzQ2hlY2s8SFRNTFNwYW5FbGVtZW50PihcbiAgICAgIHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCJsYWJlbCBzcGFuXCIpLFxuICAgICAgJ0lzblxcJ3QgdGhlcmUgYSA8bGFiZWw+IHdpdGggYSA8c3Bhbj4gZm9yIHRoZSB0YWdnZWQgPGlucHV0IHR5cGU9XCJmaWxlXCI+PycsXG4gICAgKS5pbm5lckhUTUw7XG5cbiAgICB0b1Byb2Nlc3MuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGlmICgodG9Qcm9jZXNzIGFzIEhUTUxJbnB1dEVsZW1lbnQpLmZpbGVzLmxlbmd0aCA+IG1heGltdW0pIHtcbiAgICAgICAgZ2V0SlF1ZXJ5KCkodG9Qcm9jZXNzKS5lcnJvcihcbiAgICAgICAgICB0b0xvYWQucHJlZml4dG9vbWFueSAmJiB0b0xvYWQucG9zdGZpeHRvb21hbnlcbiAgICAgICAgICAgID8gdG9Mb2FkLnByZWZpeHRvb21hbnkgKyB0b0xvYWQubWF4aW11bSArIHRvTG9hZC5wb3N0Zml4dG9vbWFueVxuICAgICAgICAgICAgOiBgVG9vIG1hbnkgZmlsZXMgc2VsZWN0ZWQuIFRoZSBtYXhpbXVtIG51bWJlciBvZiBmaWxlcyBpcyAke3RvTG9hZC5tYXhpbXVtID8gdG9Mb2FkLm1heGltdW0gOiAyfS5gLFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZ2V0SlF1ZXJ5KCkodG9Qcm9jZXNzKS5lcnJvcihcIlwiKTtcblxuICAgICAgICBpZiAoKHRvUHJvY2VzcyBhcyBIVE1MSW5wdXRFbGVtZW50KS5maWxlcy5sZW5ndGggIT09IDEpIHtcbiAgICAgICAgICB0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKFwibGFiZWwgc3BhblwiKS5pbm5lckhUTUwgPSBgJHtsYWJlbFRleHR9IChgO1xuXG4gICAgICAgICAgZm9yIChjb25zdCBmaWxlIG9mICh0b1Byb2Nlc3MgYXMgSFRNTElucHV0RWxlbWVudCkuZmlsZXMpIHtcbiAgICAgICAgICAgIHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCJsYWJlbCBzcGFuXCIpLmlubmVySFRNTCArPSBgJHtmaWxlLm5hbWV9LCBgO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCJsYWJlbCBzcGFuXCIpLmlubmVySFRNTCA9IHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50XG4gICAgICAgICAgICAucXVlcnlTZWxlY3RvcihcImxhYmVsIHNwYW5cIilcbiAgICAgICAgICAgIC5pbm5lckhUTUwuc3Vic3RyaW5nKDAsIHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCJsYWJlbCBzcGFuXCIpLmlubmVySFRNTC5sZW5ndGggLSAyKTtcblxuICAgICAgICAgIHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCJsYWJlbCBzcGFuXCIpLmlubmVySFRNTCArPSBcIilcIjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdG9Qcm9jZXNzLnNldEF0dHJpYnV0ZShcIm11bHRpcGxlXCIsIFwiXCIpO1xuICB9XG59XG5cbndpbmRvdy5jb2RiaS5yZWdpc3RlckZ1bmN0aW9uYWxpdHkoXG4gIFwiTWVkaWEuTXVsdGlwbGVVcGxvYWRcIixcbiAgTWVkaWFfTXVsdGlwbGVVcGxvYWQuZnVuY3Rpb25hbGl0eS5iaW5kKE1lZGlhX011bHRpcGxlVXBsb2FkKSxcbik7IC8vIEluaXRpYWxpemF0aW9uXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVVBLDhCQUEwQjtBQVNuQixJQUFNLHVCQUFOLE1BQTJCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFVaEMsT0FBYyxjQUlaLFFBSUEsV0FDTTtBQUNOLFVBQU0sVUFBVSxPQUFPLFVBQVUsT0FBTyxTQUFTLE9BQU8sT0FBTyxJQUFJO0FBQ25FLFVBQU0sWUFBWSxRQUFRO0FBQUEsTUFDeEIsVUFBVSxjQUFjLGNBQWMsWUFBWTtBQUFBLE1BQ2xEO0FBQUEsSUFDRixFQUFFO0FBRUYsY0FBVSxpQkFBaUIsVUFBVSxDQUFDLFVBQVU7QUFDOUMsVUFBSyxVQUErQixNQUFNLFNBQVMsU0FBUztBQUMxRCwrQ0FBVSxFQUFFLFNBQVMsRUFBRTtBQUFBLFVBQ3JCLE9BQU8saUJBQWlCLE9BQU8saUJBQzNCLE9BQU8sZ0JBQWdCLE9BQU8sVUFBVSxPQUFPLGlCQUMvQywyREFBMkQsT0FBTyxVQUFVLE9BQU8sVUFBVSxDQUFDO0FBQUEsUUFDcEc7QUFBQSxNQUNGLE9BQU87QUFDTCwrQ0FBVSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUU7QUFFL0IsWUFBSyxVQUErQixNQUFNLFdBQVcsR0FBRztBQUN0RCxvQkFBVSxjQUFjLGNBQWMsWUFBWSxFQUFFLFlBQVksR0FBRyxTQUFTO0FBRTVFLHFCQUFXLFFBQVMsVUFBK0IsT0FBTztBQUN4RCxzQkFBVSxjQUFjLGNBQWMsWUFBWSxFQUFFLGFBQWEsR0FBRyxLQUFLLElBQUk7QUFBQSxVQUMvRTtBQUVBLG9CQUFVLGNBQWMsY0FBYyxZQUFZLEVBQUUsWUFBWSxVQUFVLGNBQ3ZFLGNBQWMsWUFBWSxFQUMxQixVQUFVLFVBQVUsR0FBRyxVQUFVLGNBQWMsY0FBYyxZQUFZLEVBQUUsVUFBVSxTQUFTLENBQUM7QUFFbEcsb0JBQVUsY0FBYyxjQUFjLFlBQVksRUFBRSxhQUFhO0FBQUEsUUFDbkU7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBRUQsY0FBVSxhQUFhLFlBQVksRUFBRTtBQUFBLEVBQ3ZDO0FBQ0Y7QUE1Q2dCO0FBQUEsRUFDWCx3QkFBSyxJQUFJLFVBQVUsaUNBQWlDO0FBQUEsRUFDcEQsd0JBQUssSUFBSSxtQkFBbUIsU0FBUztBQUFBLEVBQ3JDLHNCQUFHLElBQUksSUFBSSxLQUFLLFFBQVEsR0FBRyxJQUFJLE1BQU0sS0FBSyxHQUFHLFNBQVM7QUFBQSxFQUd0RCw0QkFBUyxJQUFJLGtCQUFrQiw4REFBOEQ7QUFBQSxFQUM3RixzQkFBRyxJQUFJLFFBQVEsT0FBTyw4RUFBOEUsTUFBTTtBQUFBLEdBakJsRyxzQkFVRztBQThDaEIsT0FBTyxNQUFNO0FBQUEsRUFDWDtBQUFBLEVBQ0EscUJBQXFCLGNBQWMsS0FBSyxvQkFBb0I7QUFDOUQ7IiwKICAibmFtZXMiOiBbXQp9Cg==
