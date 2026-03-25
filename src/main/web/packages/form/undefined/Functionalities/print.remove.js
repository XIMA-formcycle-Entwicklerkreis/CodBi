import { DEFINED } from "./chunk-JP4GUAZX.js";
import { IF } from "./chunk-2VQP2CFN.js";
import { REGEX } from "./chunk-F3IDEOQS.js";
import { TYPE } from "./chunk-O5T7YW22.js";
import { INSTANCE } from "./chunk-53TEMTGA.js";
import "./chunk-LFRFVRJV.js";
import { __decorateClass, __decorateParam } from "./chunk-AOJQKO6T.js";

// src/js/Functionalities/print.remove.ts
var Print_Remove = class {
  /**
   * Registers the "Print.Remove"-Functionality.
   *
   * This functionality connects two {@link HTMLInputElement }s to not permit the designated
   * Minimum-{@link HTMLInputElement } to have a date that is after the maximum one (JQuery Datepicker supported).
   * In order for this functionality to work in repetitive containers, the tagged {@link HTMLInputElement } and the
   * corresponding **MaxField** need to be within the same container.
   *
   * Config Parameter:
   *  - DocumentSelector: The CSS-Selector specifying the {@link HTMLElement } to {@link HTMLElement.remove }.
   *                      This parameter takes precedence over **ParentalLevel**.
   *  - ParentalLevel:    The number of elements to climb up the {@link HTMLElement.parentElement }-Tree to get to
   *                      the {@link HTMLElement } to {@link HTMLElement.remove }.
   *  - Invert:           Specifies whether this functionality shall be inverted, e.g. the {@link HTMLElement }
   *                      will get {@link HTMLElement.remove }d in the form but shown
   *                      when printed (defaults to **NOT SET**).
   *                      If set **ParentalLevel** will be set to "1" if it has not been set, since the
   *                      CodBi does not allow to remove the {@link HTMLElement } **toProcess**. */
  static functionality(toLoad, toProcess) {
    let invert = false;
    if (toLoad.invert && toLoad.invert.toLowerCase() === "true") {
      invert = true;
      toLoad.parentallevel = toLoad.parentallevel ? toLoad.parentallevel : "1";
    }
    if (invert ? XFC_METADATA.requestType !== "print" : XFC_METADATA.requestType === "print") {
      if (toLoad.documentselector) {
        const toRemove = document.querySelector(toLoad.documentselector);
        if (toRemove) {
          toRemove.remove();
        }
        return;
      }
      if (toLoad.parentallevel) {
        let toRemove = toProcess;
        const parentalLevel = Number.parseInt(toLoad.parentallevel);
        for (let i = 0; i < parentalLevel; i++) {
          toRemove = toRemove.parentElement;
        }
        toRemove.remove();
        return;
      }
      toProcess.remove();
    }
  }
};
__decorateClass(
  [
    __decorateParam(0, DEFINED.PRE("documentselector")),
    __decorateParam(0, TYPE.PRE("string", "documentselector")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "parentallevel")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(/^(TRUE|FALSE)$/i), "invert")),
    __decorateParam(1, INSTANCE.PRE(HTMLElement, "Is it not an HTML-Element that is tagged with this functionality?")),
  ],
  Print_Remove,
  "functionality",
  1,
);
window.codbi.registerFunctionality("Print.Remove", Print_Remove.functionality.bind(Print_Remove));
export { Print_Remove };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2pzL0Z1bmN0aW9uYWxpdGllcy9wcmludC5yZW1vdmUudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vICNyZWdpb24gSW1wb3J0c1xuLy8gI3JlZ2lvbiBYREJDXG5pbXBvcnQgeyBERUZJTkVEIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9ERUZJTkVELmpzXCI7XG5pbXBvcnQgeyBUWVBFIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9UWVBFLmpzXCI7XG5pbXBvcnQgeyBSRUdFWCB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvUkVHRVguanNcIjtcbmltcG9ydCB7IElGIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9JRi5qc1wiO1xuaW1wb3J0IHsgSU5TVEFOQ0UgfSBmcm9tIFwieGRiYy9zcmMvREJDL0lOU1RBTkNFLmpzXCI7XG4vLyAjZW5kcmVnaW9uIFhEQkNcbi8vICNyZWdpb24gQ29kQmlcbmltcG9ydCB7IENvZEJpRXJyb3IgfSBmcm9tIFwiLi4vZ2xvYmFsLXNjb3BlLmpzXCI7XG4vLyAjZW5kcmVnaW9uIENvZEJpXG4vLyAjcmVnaW9uIEltcG9ydHNcbi8vICNlbmRyZWdpb24gSW1wb3J0c1xuLyoqXG4gKiBQcm92aWRlcyB0aGUge0BsaW5rIEhUTUxfU2VsZWN0X0luamVjdGlvbi5mdW5jdGlvbmFsaXR5IH0uXG4gKlxuICogQHJlbWFya3NcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoU2FsdmF0b3JlLkNhbGxhcmlAQW5zYmFjaC5kZSkgKi9cbi8vIGJpb21lLWlnbm9yZSBsaW50L2NvbXBsZXhpdHkvbm9TdGF0aWNPbmx5Q2xhc3M6IFByb2FjdGl2ZSBEZXNpZ24uXG5leHBvcnQgY2xhc3MgUHJpbnRfUmVtb3ZlIHtcbiAgLyoqXG4gICAqIFJlZ2lzdGVycyB0aGUgXCJQcmludC5SZW1vdmVcIi1GdW5jdGlvbmFsaXR5LlxuICAgKlxuICAgKiBUaGlzIGZ1bmN0aW9uYWxpdHkgY29ubmVjdHMgdHdvIHtAbGluayBIVE1MSW5wdXRFbGVtZW50IH1zIHRvIG5vdCBwZXJtaXQgdGhlIGRlc2lnbmF0ZWRcbiAgICogTWluaW11bS17QGxpbmsgSFRNTElucHV0RWxlbWVudCB9IHRvIGhhdmUgYSBkYXRlIHRoYXQgaXMgYWZ0ZXIgdGhlIG1heGltdW0gb25lIChKUXVlcnkgRGF0ZXBpY2tlciBzdXBwb3J0ZWQpLlxuICAgKiBJbiBvcmRlciBmb3IgdGhpcyBmdW5jdGlvbmFsaXR5IHRvIHdvcmsgaW4gcmVwZXRpdGl2ZSBjb250YWluZXJzLCB0aGUgdGFnZ2VkIHtAbGluayBIVE1MSW5wdXRFbGVtZW50IH0gYW5kIHRoZVxuICAgKiBjb3JyZXNwb25kaW5nICoqTWF4RmllbGQqKiBuZWVkIHRvIGJlIHdpdGhpbiB0aGUgc2FtZSBjb250YWluZXIuXG4gICAqXG4gICAqIENvbmZpZyBQYXJhbWV0ZXI6XG4gICAqICAtIERvY3VtZW50U2VsZWN0b3I6IFRoZSBDU1MtU2VsZWN0b3Igc3BlY2lmeWluZyB0aGUge0BsaW5rIEhUTUxFbGVtZW50IH0gdG8ge0BsaW5rIEhUTUxFbGVtZW50LnJlbW92ZSB9LlxuICAgKiAgICAgICAgICAgICAgICAgICAgICBUaGlzIHBhcmFtZXRlciB0YWtlcyBwcmVjZWRlbmNlIG92ZXIgKipQYXJlbnRhbExldmVsKiouXG4gICAqICAtIFBhcmVudGFsTGV2ZWw6ICAgIFRoZSBudW1iZXIgb2YgZWxlbWVudHMgdG8gY2xpbWIgdXAgdGhlIHtAbGluayBIVE1MRWxlbWVudC5wYXJlbnRFbGVtZW50IH0tVHJlZSB0byBnZXQgdG9cbiAgICogICAgICAgICAgICAgICAgICAgICAgdGhlIHtAbGluayBIVE1MRWxlbWVudCB9IHRvIHtAbGluayBIVE1MRWxlbWVudC5yZW1vdmUgfS5cbiAgICogIC0gSW52ZXJ0OiAgICAgICAgICAgU3BlY2lmaWVzIHdoZXRoZXIgdGhpcyBmdW5jdGlvbmFsaXR5IHNoYWxsIGJlIGludmVydGVkLCBlLmcuIHRoZSB7QGxpbmsgSFRNTEVsZW1lbnQgfVxuICAgKiAgICAgICAgICAgICAgICAgICAgICB3aWxsIGdldCB7QGxpbmsgSFRNTEVsZW1lbnQucmVtb3ZlIH1kIGluIHRoZSBmb3JtIGJ1dCBzaG93blxuICAgKiAgICAgICAgICAgICAgICAgICAgICB3aGVuIHByaW50ZWQgKGRlZmF1bHRzIHRvICoqTk9UIFNFVCoqKS5cbiAgICogICAgICAgICAgICAgICAgICAgICAgSWYgc2V0ICoqUGFyZW50YWxMZXZlbCoqIHdpbGwgYmUgc2V0IHRvIFwiMVwiIGlmIGl0IGhhcyBub3QgYmVlbiBzZXQsIHNpbmNlIHRoZVxuICAgKiAgICAgICAgICAgICAgICAgICAgICBDb2RCaSBkb2VzIG5vdCBhbGxvdyB0byByZW1vdmUgdGhlIHtAbGluayBIVE1MRWxlbWVudCB9ICoqdG9Qcm9jZXNzKiouICovXG4gIHB1YmxpYyBzdGF0aWMgZnVuY3Rpb25hbGl0eShcbiAgICBAREVGSU5FRC5QUkUoXCJkb2N1bWVudHNlbGVjdG9yXCIpXG4gICAgQFRZUEUuUFJFKFwic3RyaW5nXCIsIFwiZG9jdW1lbnRzZWxlY3RvclwiKVxuICAgIEBJRi5QUkUobmV3IFRZUEUoXCJzdHJpbmdcIiksIG5ldyBSRUdFWCgvXlxcZCskLyksIFwicGFyZW50YWxsZXZlbFwiKVxuICAgIEBJRi5QUkUobmV3IFRZUEUoXCJzdHJpbmdcIiksIG5ldyBSRUdFWCgvXihUUlVFfEZBTFNFKSQvaSksIFwiaW52ZXJ0XCIpXG4gICAgdG9Mb2FkOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9LFxuXG4gICAgQElOU1RBTkNFLlBSRShIVE1MRWxlbWVudCwgXCJJcyBpdCBub3QgYW4gSFRNTC1FbGVtZW50IHRoYXQgaXMgdGFnZ2VkIHdpdGggdGhpcyBmdW5jdGlvbmFsaXR5P1wiKVxuICAgIHRvUHJvY2VzczogRWxlbWVudCxcbiAgKTogdm9pZCB7XG4gICAgbGV0IGludmVydCA9IGZhbHNlO1xuXG4gICAgaWYgKHRvTG9hZC5pbnZlcnQgJiYgKHRvTG9hZC5pbnZlcnQgYXMgc3RyaW5nKS50b0xvd2VyQ2FzZSgpID09PSBcInRydWVcIikge1xuICAgICAgaW52ZXJ0ID0gdHJ1ZTtcbiAgICAgIHRvTG9hZC5wYXJlbnRhbGxldmVsID0gdG9Mb2FkLnBhcmVudGFsbGV2ZWwgPyB0b0xvYWQucGFyZW50YWxsZXZlbCA6IFwiMVwiO1xuICAgIH1cblxuICAgIGlmIChpbnZlcnQgPyBYRkNfTUVUQURBVEEucmVxdWVzdFR5cGUgIT09IFwicHJpbnRcIiA6IFhGQ19NRVRBREFUQS5yZXF1ZXN0VHlwZSA9PT0gXCJwcmludFwiKSB7XG4gICAgICBpZiAodG9Mb2FkLmRvY3VtZW50c2VsZWN0b3IpIHtcbiAgICAgICAgY29uc3QgdG9SZW1vdmUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRvTG9hZC5kb2N1bWVudHNlbGVjdG9yKTtcblxuICAgICAgICBpZiAodG9SZW1vdmUpIHtcbiAgICAgICAgICB0b1JlbW92ZS5yZW1vdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHRvTG9hZC5wYXJlbnRhbGxldmVsKSB7XG4gICAgICAgIGxldCB0b1JlbW92ZSA9IHRvUHJvY2VzcztcblxuICAgICAgICBjb25zdCBwYXJlbnRhbExldmVsID0gTnVtYmVyLnBhcnNlSW50KHRvTG9hZC5wYXJlbnRhbGxldmVsKTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhcmVudGFsTGV2ZWw7IGkrKykge1xuICAgICAgICAgIHRvUmVtb3ZlID0gdG9SZW1vdmUucGFyZW50RWxlbWVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRvUmVtb3ZlLnJlbW92ZSgpO1xuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdG9Qcm9jZXNzLnJlbW92ZSgpO1xuICAgIH1cbiAgfVxufVxuXG53aW5kb3cuY29kYmkucmVnaXN0ZXJGdW5jdGlvbmFsaXR5KFwiUHJpbnQuUmVtb3ZlXCIsIFByaW50X1JlbW92ZS5mdW5jdGlvbmFsaXR5LmJpbmQoUHJpbnRfUmVtb3ZlKSk7IC8vIEluaXRpYWxpemF0aW9uXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJPLElBQU0sZUFBTixNQUFtQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBbUJ4QixPQUFjLGNBS1osUUFHQSxXQUNNO0FBQ04sUUFBSSxTQUFTO0FBRWIsUUFBSSxPQUFPLFVBQVcsT0FBTyxPQUFrQixZQUFZLE1BQU0sUUFBUTtBQUN2RSxlQUFTO0FBQ1QsYUFBTyxnQkFBZ0IsT0FBTyxnQkFBZ0IsT0FBTyxnQkFBZ0I7QUFBQSxJQUN2RTtBQUVBLFFBQUksU0FBUyxhQUFhLGdCQUFnQixVQUFVLGFBQWEsZ0JBQWdCLFNBQVM7QUFDeEYsVUFBSSxPQUFPLGtCQUFrQjtBQUMzQixjQUFNLFdBQVcsU0FBUyxjQUFjLE9BQU8sZ0JBQWdCO0FBRS9ELFlBQUksVUFBVTtBQUNaLG1CQUFTLE9BQU87QUFBQSxRQUNsQjtBQUVBO0FBQUEsTUFDRjtBQUVBLFVBQUksT0FBTyxlQUFlO0FBQ3hCLFlBQUksV0FBVztBQUVmLGNBQU0sZ0JBQWdCLE9BQU8sU0FBUyxPQUFPLGFBQWE7QUFFMUQsaUJBQVMsSUFBSSxHQUFHLElBQUksZUFBZSxLQUFLO0FBQ3RDLHFCQUFXLFNBQVM7QUFBQSxRQUN0QjtBQUVBLGlCQUFTLE9BQU87QUFFaEI7QUFBQSxNQUNGO0FBRUEsZ0JBQVUsT0FBTztBQUFBLElBQ25CO0FBQUEsRUFDRjtBQUNGO0FBN0NnQjtBQUFBLEVBQ1gsMkJBQVEsSUFBSSxrQkFBa0I7QUFBQSxFQUM5Qix3QkFBSyxJQUFJLFVBQVUsa0JBQWtCO0FBQUEsRUFDckMsc0JBQUcsSUFBSSxJQUFJLEtBQUssUUFBUSxHQUFHLElBQUksTUFBTSxPQUFPLEdBQUcsZUFBZTtBQUFBLEVBQzlELHNCQUFHLElBQUksSUFBSSxLQUFLLFFBQVEsR0FBRyxJQUFJLE1BQU0saUJBQWlCLEdBQUcsUUFBUTtBQUFBLEVBR2pFLDRCQUFTLElBQUksYUFBYSxtRUFBbUU7QUFBQSxHQTFCckYsY0FtQkc7QUErQ2hCLE9BQU8sTUFBTSxzQkFBc0IsZ0JBQWdCLGFBQWEsY0FBYyxLQUFLLFlBQVksQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
