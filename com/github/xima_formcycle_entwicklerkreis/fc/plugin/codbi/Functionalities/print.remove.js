import "./chunk-QGX5JPGQ.js";
import "./chunk-2R3WETV4.js";
import "./chunk-7Z6CEUOW.js";
import "./chunk-KWZW6WYL.js";

// src/js/Functionalities/print.remove.ts
var Print_Remove = class _Print_Remove {
  /**
   * Registers the "Date.Frame"-Functionality.
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
  static {
    // #region Initialization
    /**
     * States whether this {@link Date_Frame } was successfully registered
     * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
    this.registered = (() => {
      return window.codbi.registerFunctionality("Print.Remove", _Print_Remove.functionality);
    })();
  }
  // #endregion Initialization
};
export {
  Print_Remove
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL3BhY2thZ2VzL2Zvcm0vc3JjL2pzL0Z1bmN0aW9uYWxpdGllcy9wcmludC5yZW1vdmUudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vICNyZWdpb24gSW1wb3J0c1xuaW1wb3J0IHsgQ29kQmlFcnJvciB9IGZyb20gXCIuLi9nbG9iYWwtc2NvcGUuanNcIjtcbi8vICNlbmRyZWdpb24gSW1wb3J0c1xuLyoqXG4gKiBQcm92aWRlcyB0aGUge0BsaW5rIEhUTUxfU2VsZWN0X0luamVjdGlvbi5mdW5jdGlvbmFsaXR5IH0uXG4gKlxuICogQHJlbWFya3NcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoU2FsdmF0b3JlLkNhbGxhcmlAQW5zYmFjaC5kZSkgKi9cbi8vIGJpb21lLWlnbm9yZSBsaW50L2NvbXBsZXhpdHkvbm9TdGF0aWNPbmx5Q2xhc3M6IFByb2FjdGl2ZSBEZXNpZ24uXG5leHBvcnQgY2xhc3MgUHJpbnRfUmVtb3ZlIHtcbiAgLyoqXG4gICAqIFJlZ2lzdGVycyB0aGUgXCJEYXRlLkZyYW1lXCItRnVuY3Rpb25hbGl0eS5cbiAgICpcbiAgICogVGhpcyBmdW5jdGlvbmFsaXR5IGNvbm5lY3RzIHR3byB7QGxpbmsgSFRNTElucHV0RWxlbWVudCB9cyB0byBub3QgcGVybWl0IHRoZSBkZXNpZ25hdGVkXG4gICAqIE1pbmltdW0te0BsaW5rIEhUTUxJbnB1dEVsZW1lbnQgfSB0byBoYXZlIGEgZGF0ZSB0aGF0IGlzIGFmdGVyIHRoZSBtYXhpbXVtIG9uZSAoSlF1ZXJ5IERhdGVwaWNrZXIgc3VwcG9ydGVkKS5cbiAgICogSW4gb3JkZXIgZm9yIHRoaXMgZnVuY3Rpb25hbGl0eSB0byB3b3JrIGluIHJlcGV0aXRpdmUgY29udGFpbmVycywgdGhlIHRhZ2dlZCB7QGxpbmsgSFRNTElucHV0RWxlbWVudCB9IGFuZCB0aGVcbiAgICogY29ycmVzcG9uZGluZyAqKk1heEZpZWxkKiogbmVlZCB0byBiZSB3aXRoaW4gdGhlIHNhbWUgY29udGFpbmVyLlxuICAgKlxuICAgKiBDb25maWcgUGFyYW1ldGVyOlxuICAgKiAgLSBEb2N1bWVudFNlbGVjdG9yOiBUaGUgQ1NTLVNlbGVjdG9yIHNwZWNpZnlpbmcgdGhlIHtAbGluayBIVE1MRWxlbWVudCB9IHRvIHtAbGluayBIVE1MRWxlbWVudC5yZW1vdmUgfS5cbiAgICogICAgICAgICAgICAgICAgICAgICAgVGhpcyBwYXJhbWV0ZXIgdGFrZXMgcHJlY2VkZW5jZSBvdmVyICoqUGFyZW50YWxMZXZlbCoqLlxuICAgKiAgLSBQYXJlbnRhbExldmVsOiAgICBUaGUgbnVtYmVyIG9mIGVsZW1lbnRzIHRvIGNsaW1iIHVwIHRoZSB7QGxpbmsgSFRNTEVsZW1lbnQucGFyZW50RWxlbWVudCB9LVRyZWUgdG8gZ2V0IHRvXG4gICAqICAgICAgICAgICAgICAgICAgICAgIHRoZSB7QGxpbmsgSFRNTEVsZW1lbnQgfSB0byB7QGxpbmsgSFRNTEVsZW1lbnQucmVtb3ZlIH0uXG4gICAqICAtIEludmVydDogICAgICAgICAgIFNwZWNpZmllcyB3aGV0aGVyIHRoaXMgZnVuY3Rpb25hbGl0eSBzaGFsbCBiZSBpbnZlcnRlZCwgZS5nLiB0aGUge0BsaW5rIEhUTUxFbGVtZW50IH1cbiAgICogICAgICAgICAgICAgICAgICAgICAgd2lsbCBnZXQge0BsaW5rIEhUTUxFbGVtZW50LnJlbW92ZSB9ZCBpbiB0aGUgZm9ybSBidXQgc2hvd25cbiAgICogICAgICAgICAgICAgICAgICAgICAgd2hlbiBwcmludGVkIChkZWZhdWx0cyB0byAqKk5PVCBTRVQqKikuXG4gICAqICAgICAgICAgICAgICAgICAgICAgIElmIHNldCAqKlBhcmVudGFsTGV2ZWwqKiB3aWxsIGJlIHNldCB0byBcIjFcIiBpZiBpdCBoYXMgbm90IGJlZW4gc2V0LCBzaW5jZSB0aGVcbiAgICogICAgICAgICAgICAgICAgICAgICAgQ29kQmkgZG9lcyBub3QgYWxsb3cgdG8gcmVtb3ZlIHRoZSB7QGxpbmsgSFRNTEVsZW1lbnQgfSAqKnRvUHJvY2VzcyoqLiAqL1xuICBwdWJsaWMgc3RhdGljIGZ1bmN0aW9uYWxpdHkodG9Mb2FkOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9LCB0b1Byb2Nlc3M6IEVsZW1lbnQpOiB2b2lkIHtcbiAgICBsZXQgaW52ZXJ0ID0gZmFsc2U7XG5cbiAgICBpZiAodG9Mb2FkLmludmVydCAmJiAodG9Mb2FkLmludmVydCBhcyBzdHJpbmcpLnRvTG93ZXJDYXNlKCkgPT09IFwidHJ1ZVwiKSB7XG4gICAgICBpbnZlcnQgPSB0cnVlO1xuICAgICAgdG9Mb2FkLnBhcmVudGFsbGV2ZWwgPSB0b0xvYWQucGFyZW50YWxsZXZlbCA/IHRvTG9hZC5wYXJlbnRhbGxldmVsIDogXCIxXCI7XG4gICAgfVxuXG4gICAgaWYgKGludmVydCA/IFhGQ19NRVRBREFUQS5yZXF1ZXN0VHlwZSAhPT0gXCJwcmludFwiIDogWEZDX01FVEFEQVRBLnJlcXVlc3RUeXBlID09PSBcInByaW50XCIpIHtcbiAgICAgIGlmICh0b0xvYWQuZG9jdW1lbnRzZWxlY3Rvcikge1xuICAgICAgICBjb25zdCB0b1JlbW92ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IodG9Mb2FkLmRvY3VtZW50c2VsZWN0b3IpO1xuXG4gICAgICAgIGlmICh0b1JlbW92ZSkge1xuICAgICAgICAgIHRvUmVtb3ZlLnJlbW92ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAodG9Mb2FkLnBhcmVudGFsbGV2ZWwpIHtcbiAgICAgICAgbGV0IHRvUmVtb3ZlID0gdG9Qcm9jZXNzO1xuXG4gICAgICAgIGNvbnN0IHBhcmVudGFsTGV2ZWwgPSBOdW1iZXIucGFyc2VJbnQodG9Mb2FkLnBhcmVudGFsbGV2ZWwpO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFyZW50YWxMZXZlbDsgaSsrKSB7XG4gICAgICAgICAgdG9SZW1vdmUgPSB0b1JlbW92ZS5wYXJlbnRFbGVtZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgdG9SZW1vdmUucmVtb3ZlKCk7XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0b1Byb2Nlc3MucmVtb3ZlKCk7XG4gICAgfVxuICB9XG4gIC8vICNyZWdpb24gSW5pdGlhbGl6YXRpb25cbiAgLyoqXG4gICAqIFN0YXRlcyB3aGV0aGVyIHRoaXMge0BsaW5rIERhdGVfRnJhbWUgfSB3YXMgc3VjY2Vzc2Z1bGx5IHJlZ2lzdGVyZWRcbiAgICogdmlhIHtAbGluayBDb2RiaUdsb2JhbC5yZWdpc3RlckZ1bmN0aW9uYWxpdHkgfSB3aXRoIHRoZSBDb2RCaSBhbmQgcGVyZm9ybXMgdGhlIHJlZ2lzdHJhdGlvbiB1cG9uIGNsYXNzIHVzYWdlLiovXG4gIHB1YmxpYyBzdGF0aWMgcmVnaXN0ZXJlZDogYm9vbGVhbiA9ICgoKSA9PiB7XG4gICAgcmV0dXJuIHdpbmRvdy5jb2RiaS5yZWdpc3RlckZ1bmN0aW9uYWxpdHkoXCJQcmludC5SZW1vdmVcIiwgUHJpbnRfUmVtb3ZlLmZ1bmN0aW9uYWxpdHkpO1xuICB9KSgpO1xuICAvLyAjZW5kcmVnaW9uIEluaXRpYWxpemF0aW9uXG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7QUFTTyxJQUFNLGVBQU4sTUFBTSxjQUFhO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFtQnhCLE9BQWMsY0FBYyxRQUFtQyxXQUEwQjtBQUN2RixRQUFJLFNBQVM7QUFFYixRQUFJLE9BQU8sVUFBVyxPQUFPLE9BQWtCLFlBQVksTUFBTSxRQUFRO0FBQ3ZFLGVBQVM7QUFDVCxhQUFPLGdCQUFnQixPQUFPLGdCQUFnQixPQUFPLGdCQUFnQjtBQUFBLElBQ3ZFO0FBRUEsUUFBSSxTQUFTLGFBQWEsZ0JBQWdCLFVBQVUsYUFBYSxnQkFBZ0IsU0FBUztBQUN4RixVQUFJLE9BQU8sa0JBQWtCO0FBQzNCLGNBQU0sV0FBVyxTQUFTLGNBQWMsT0FBTyxnQkFBZ0I7QUFFL0QsWUFBSSxVQUFVO0FBQ1osbUJBQVMsT0FBTztBQUFBLFFBQ2xCO0FBRUE7QUFBQSxNQUNGO0FBRUEsVUFBSSxPQUFPLGVBQWU7QUFDeEIsWUFBSSxXQUFXO0FBRWYsY0FBTSxnQkFBZ0IsT0FBTyxTQUFTLE9BQU8sYUFBYTtBQUUxRCxpQkFBUyxJQUFJLEdBQUcsSUFBSSxlQUFlLEtBQUs7QUFDdEMscUJBQVcsU0FBUztBQUFBLFFBQ3RCO0FBRUEsaUJBQVMsT0FBTztBQUVoQjtBQUFBLE1BQ0Y7QUFFQSxnQkFBVSxPQUFPO0FBQUEsSUFDbkI7QUFBQSxFQUNGO0FBQUEsRUFLQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsU0FBYyxjQUF1QixNQUFNO0FBQ3pDLGFBQU8sT0FBTyxNQUFNLHNCQUFzQixnQkFBZ0IsY0FBYSxhQUFhO0FBQUEsSUFDdEYsR0FBRztBQUFBO0FBQUE7QUFFTDsiLAogICJuYW1lcyI6IFtdCn0K
