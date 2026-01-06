import {
  require_dist
} from "./chunk-5LC5FOZV.js";
import {
  __toESM
} from "./chunk-KWZW6WYL.js";

// src/js/Functionalities/media.multipleupload.ts
var import_fc_form_renderer = __toESM(require_dist(), 1);
var Media_MultipleUpload = class _Media_MultipleUpload {
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
    const labelText = toProcess.parentElement.querySelector("label span").innerHTML;
    toProcess.addEventListener("change", (event) => {
      if (toProcess.files.length > maximum) {
        (0, import_fc_form_renderer.getJQuery)()(toProcess).error(
          toLoad.prefixtoomany && toLoad.postfixtoomany ? toLoad.prefixtoomany + toLoad.maximum + toLoad.postfixtoomany : `Too many files selected. The maximum number of files is ${toLoad.maximum ? toLoad.maximum : 2}.`
        );
      } else {
        (0, import_fc_form_renderer.getJQuery)()(toProcess).error("");
        if (toProcess.files.length !== 1) {
          toProcess.parentElement.querySelector("label span").innerHTML = `${labelText} (`;
          for (const file of toProcess.files) {
            toProcess.parentElement.querySelector("label span").innerHTML += `${file.name}, `;
          }
          toProcess.parentElement.querySelector("label span").innerHTML = toProcess.parentElement.querySelector("label span").innerHTML.substring(0, toProcess.parentElement.querySelector("label span").innerHTML.length - 2);
          toProcess.parentElement.querySelector("label span").innerHTML += ")";
        }
      }
    });
    toProcess.setAttribute("multiple", "");
  }
  static {
    // #region Initialization
    /**
     * States whether this {@link Media_MultipleUpload } was successfully registered
     * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
    this.registered = (() => {
      return window.codbi.registerFunctionality("Media.MultipleUpload", _Media_MultipleUpload.functionality);
    })();
  }
  // #endregion Initialization
};
export {
  Media_MultipleUpload
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL3BhY2thZ2VzL2Zvcm0vc3JjL2pzL0Z1bmN0aW9uYWxpdGllcy9tZWRpYS5tdWx0aXBsZXVwbG9hZC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiBQcm92aWRlcyB0aGUge0BsaW5rIEhUTUxfU2VsZWN0X0luamVjdGlvbi5mdW5jdGlvbmFsaXR5IH0uXG4gKlxuICogQHJlbWFya3NcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoU2FsdmF0b3JlLkNhbGxhcmlAQW5zYmFjaC5kZSkgKi9cblxuaW1wb3J0IHsgZ2V0SlF1ZXJ5IH0gZnJvbSBcIkBkZS14aW1hL2ZjLWZvcm0tcmVuZGVyZXJcIjtcblxuLy8gYmlvbWUtaWdub3JlIGxpbnQvY29tcGxleGl0eS9ub1N0YXRpY09ubHlDbGFzczogUHJvYWN0aXZlIERlc2lnbi5cbmV4cG9ydCBjbGFzcyBNZWRpYV9NdWx0aXBsZVVwbG9hZCB7XG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgdGhlIFwiTWVkaWEuTXVsdGlwbGVVcGxvYWRcIi1GdW5jdGlvbmFsaXR5LlxuICAgKlxuICAgKiBUaGlzIGZ1bmN0aW9uYWxpdHkgZW5hYmxlcyBhIGZpbGUgdXBsb2FkIGRpYWxvZ3VlIHRvIHN1cHBvcnQgc2VsZWN0aW5nIG11bHRpcGxlIGZpbGVzIGZvciB1cGxvYWQuXG4gICAqXG4gICAqIFBhcmFtZXRlcjpcbiAgICogIC0gTWF4aW11bTogICAgICAgIFRoZSBudW1iZXIgb2YgZmlsZXMgdGhhdCBtYXkgYmUgdXBsb2FkZWQuXG4gICAqICAtIHByZWZpeFRvb01hbnk6ICBUaGUgbWVzc2FnZSB0aGF0IGlzIGRpc3BsYXllZCBiZWZvcmUgdGhlICoqTWF4aW11bSoqIGlmIHRvbyBtYW55IGZpbGVzIHdlcmUgc2VsZWN0ZWQuXG4gICAqICAtIHBvc3RmaXhUb29NYW55OiBUaGUgbWVzc2FnZSB0aGF0IGlzIGRpc3BsYXllZCBhZnRlciB0aGUgKipNYXhpbXVtKiogaWYgdG9vIG1hbnkgZmlsZXMgd2VyZSBzZWxlY3RlZC4gKi9cbiAgcHVibGljIHN0YXRpYyBmdW5jdGlvbmFsaXR5KHRvTG9hZDogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSwgdG9Qcm9jZXNzOiBFbGVtZW50KTogdm9pZCB7XG4gICAgY29uc3QgbWF4aW11bSA9IHRvTG9hZC5tYXhpbXVtID8gTnVtYmVyLnBhcnNlSW50KHRvTG9hZC5tYXhpbXVtKSA6IDI7XG4gICAgY29uc3QgbGFiZWxUZXh0ID0gdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3RvcihcImxhYmVsIHNwYW5cIikuaW5uZXJIVE1MO1xuXG4gICAgdG9Qcm9jZXNzLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoKHRvUHJvY2VzcyBhcyBIVE1MSW5wdXRFbGVtZW50KS5maWxlcy5sZW5ndGggPiBtYXhpbXVtKSB7XG4gICAgICAgIGdldEpRdWVyeSgpKHRvUHJvY2VzcykuZXJyb3IoXG4gICAgICAgICAgdG9Mb2FkLnByZWZpeHRvb21hbnkgJiYgdG9Mb2FkLnBvc3RmaXh0b29tYW55XG4gICAgICAgICAgICA/IHRvTG9hZC5wcmVmaXh0b29tYW55ICsgdG9Mb2FkLm1heGltdW0gKyB0b0xvYWQucG9zdGZpeHRvb21hbnlcbiAgICAgICAgICAgIDogYFRvbyBtYW55IGZpbGVzIHNlbGVjdGVkLiBUaGUgbWF4aW11bSBudW1iZXIgb2YgZmlsZXMgaXMgJHt0b0xvYWQubWF4aW11bSA/IHRvTG9hZC5tYXhpbXVtIDogMn0uYCxcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGdldEpRdWVyeSgpKHRvUHJvY2VzcykuZXJyb3IoXCJcIik7XG5cbiAgICAgICAgaWYgKCh0b1Byb2Nlc3MgYXMgSFRNTElucHV0RWxlbWVudCkuZmlsZXMubGVuZ3RoICE9PSAxKSB7XG4gICAgICAgICAgdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3RvcihcImxhYmVsIHNwYW5cIikuaW5uZXJIVE1MID0gYCR7bGFiZWxUZXh0fSAoYDtcblxuICAgICAgICAgIGZvciAoY29uc3QgZmlsZSBvZiAodG9Qcm9jZXNzIGFzIEhUTUxJbnB1dEVsZW1lbnQpLmZpbGVzKSB7XG4gICAgICAgICAgICB0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKFwibGFiZWwgc3BhblwiKS5pbm5lckhUTUwgKz0gYCR7ZmlsZS5uYW1lfSwgYDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKFwibGFiZWwgc3BhblwiKS5pbm5lckhUTUwgPSB0b1Byb2Nlc3MucGFyZW50RWxlbWVudFxuICAgICAgICAgICAgLnF1ZXJ5U2VsZWN0b3IoXCJsYWJlbCBzcGFuXCIpXG4gICAgICAgICAgICAuaW5uZXJIVE1MLnN1YnN0cmluZygwLCB0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKFwibGFiZWwgc3BhblwiKS5pbm5lckhUTUwubGVuZ3RoIC0gMik7XG5cbiAgICAgICAgICB0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKFwibGFiZWwgc3BhblwiKS5pbm5lckhUTUwgKz0gXCIpXCI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRvUHJvY2Vzcy5zZXRBdHRyaWJ1dGUoXCJtdWx0aXBsZVwiLCBcIlwiKTtcbiAgfVxuICAvLyAjcmVnaW9uIEluaXRpYWxpemF0aW9uXG4gIC8qKlxuICAgKiBTdGF0ZXMgd2hldGhlciB0aGlzIHtAbGluayBNZWRpYV9NdWx0aXBsZVVwbG9hZCB9IHdhcyBzdWNjZXNzZnVsbHkgcmVnaXN0ZXJlZFxuICAgKiB2aWEge0BsaW5rIENvZGJpR2xvYmFsLnJlZ2lzdGVyRnVuY3Rpb25hbGl0eSB9IHdpdGggdGhlIENvZEJpIGFuZCBwZXJmb3JtcyB0aGUgcmVnaXN0cmF0aW9uIHVwb24gY2xhc3MgdXNhZ2UuKi9cbiAgcHVibGljIHN0YXRpYyByZWdpc3RlcmVkOiBib29sZWFuID0gKCgpID0+IHtcbiAgICByZXR1cm4gd2luZG93LmNvZGJpLnJlZ2lzdGVyRnVuY3Rpb25hbGl0eShcIk1lZGlhLk11bHRpcGxlVXBsb2FkXCIsIE1lZGlhX011bHRpcGxlVXBsb2FkLmZ1bmN0aW9uYWxpdHkpO1xuICB9KSgpO1xuICAvLyAjZW5kcmVnaW9uIEluaXRpYWxpemF0aW9uXG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7OztBQU1BLDhCQUEwQjtBQUduQixJQUFNLHVCQUFOLE1BQU0sc0JBQXFCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFVaEMsT0FBYyxjQUFjLFFBQW1DLFdBQTBCO0FBQ3ZGLFVBQU0sVUFBVSxPQUFPLFVBQVUsT0FBTyxTQUFTLE9BQU8sT0FBTyxJQUFJO0FBQ25FLFVBQU0sWUFBWSxVQUFVLGNBQWMsY0FBYyxZQUFZLEVBQUU7QUFFdEUsY0FBVSxpQkFBaUIsVUFBVSxDQUFDLFVBQVU7QUFDOUMsVUFBSyxVQUErQixNQUFNLFNBQVMsU0FBUztBQUMxRCwrQ0FBVSxFQUFFLFNBQVMsRUFBRTtBQUFBLFVBQ3JCLE9BQU8saUJBQWlCLE9BQU8saUJBQzNCLE9BQU8sZ0JBQWdCLE9BQU8sVUFBVSxPQUFPLGlCQUMvQywyREFBMkQsT0FBTyxVQUFVLE9BQU8sVUFBVSxDQUFDO0FBQUEsUUFDcEc7QUFBQSxNQUNGLE9BQU87QUFDTCwrQ0FBVSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUU7QUFFL0IsWUFBSyxVQUErQixNQUFNLFdBQVcsR0FBRztBQUN0RCxvQkFBVSxjQUFjLGNBQWMsWUFBWSxFQUFFLFlBQVksR0FBRyxTQUFTO0FBRTVFLHFCQUFXLFFBQVMsVUFBK0IsT0FBTztBQUN4RCxzQkFBVSxjQUFjLGNBQWMsWUFBWSxFQUFFLGFBQWEsR0FBRyxLQUFLLElBQUk7QUFBQSxVQUMvRTtBQUVBLG9CQUFVLGNBQWMsY0FBYyxZQUFZLEVBQUUsWUFBWSxVQUFVLGNBQ3ZFLGNBQWMsWUFBWSxFQUMxQixVQUFVLFVBQVUsR0FBRyxVQUFVLGNBQWMsY0FBYyxZQUFZLEVBQUUsVUFBVSxTQUFTLENBQUM7QUFFbEcsb0JBQVUsY0FBYyxjQUFjLFlBQVksRUFBRSxhQUFhO0FBQUEsUUFDbkU7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBRUQsY0FBVSxhQUFhLFlBQVksRUFBRTtBQUFBLEVBQ3ZDO0FBQUEsRUFLQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsU0FBYyxjQUF1QixNQUFNO0FBQ3pDLGFBQU8sT0FBTyxNQUFNLHNCQUFzQix3QkFBd0Isc0JBQXFCLGFBQWE7QUFBQSxJQUN0RyxHQUFHO0FBQUE7QUFBQTtBQUVMOyIsCiAgIm5hbWVzIjogW10KfQo=
