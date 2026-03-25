import { CodBiError } from "./chunk-NKLWL4ZS.js";
import "./chunk-JP4GUAZX.js";
import { EQ } from "./chunk-RI3LWO6O.js";
import { IF } from "./chunk-2VQP2CFN.js";
import { REGEX } from "./chunk-F3IDEOQS.js";
import { TYPE } from "./chunk-O5T7YW22.js";
import { INSTANCE } from "./chunk-53TEMTGA.js";
import { DBC } from "./chunk-LFRFVRJV.js";
import { require_dist } from "./chunk-ZTMSSRTV.js";
import { __decorateClass, __decorateParam, __toESM } from "./chunk-AOJQKO6T.js";

// src/js/Functionalities/date.frame.ts
var import_fc_form_renderer = __toESM(require_dist(), 1);
var Date_Frame = class {
  static functionality(toLoad, toProcess) {
    const maximumField = INSTANCE.tsCheck(
      toProcess.parentElement.parentElement.querySelector(toLoad.maxfield),
      HTMLInputElement,
      "Is the CSS-Selector in the MaxField-Parameter not selecting an <input/> element?",
    );
    if (maximumField === null) {
      throw new CodBiError(`The selector "${toLoad.maxfield}" does not select anything.`);
    }
    const $ = (0, import_fc_form_renderer.getJQuery)();
    toLoad.msgmininvalid = toLoad.msgmininvalid ? toLoad.msgmininvalid : "Minimum value is invalid.";
    toLoad.msgmaxinvalid = toLoad.msgmaxinvalid ? toLoad.msgmaxinvalid : "Maximum value is invalid.";
    toLoad.equalitypermitted = toLoad.equalitypermitted
      ? typeof toLoad.equalitypermitted === "boolean"
        ? toLoad.equalitypermitted
        : toLoad.equalitypermitted.toLowerCase() === "true"
      : false;
    const onNewMinimum = (event) => {
      if (toLoad.equalitypermitted) {
        if (
          new Date(
            toProcess.value.split(".").reduce((accumulator, current, index) => {
              return current + (index === 0 ? "" : "/") + accumulator;
            }),
          ) >=
          new Date(
            maximumField.value.split(".").reduce((accumulator, current, index) => {
              return current + (index === 0 ? "" : "/") + accumulator;
            }),
          )
        ) {
          $(toProcess).error(toLoad.msgmininvalid);
        } else {
          $(toProcess).error("");
          $(maximumField).error("");
        }
      } else {
        if (
          new Date(
            toProcess.value.split(".").reduce((accumulator, current, index) => {
              return current + (index === 0 ? "" : "/") + accumulator;
            }),
          ) >
          new Date(
            maximumField.value.split(".").reduce((accumulator, current, index) => {
              return current + (index === 0 ? "" : "/") + accumulator;
            }),
          )
        ) {
          $(toProcess).error(toLoad.msgmininvalid);
        } else {
          $(toProcess).error("");
          $(maximumField).error("");
        }
      }
    };
    const onNewMaximum = (event) => {
      if (toLoad.equalitypermitted) {
        if (
          new Date(
            toProcess.value.split(".").reduce((accumulator, current, index) => {
              return current + (index === 0 ? "" : "/") + accumulator;
            }),
          ) >=
          new Date(
            maximumField.value.split(".").reduce((accumulator, current, index) => {
              return current + (index === 0 ? "" : "/") + accumulator;
            }),
          )
        ) {
          $(maximumField).error(toLoad.msgmaxinvalid);
        } else {
          $(maximumField).error("");
          $(toProcess).error("");
        }
      } else {
        if (
          new Date(
            toProcess.value.split(".").reduce((accumulator, current, index) => {
              return current + (index === 0 ? "" : "/") + accumulator;
            }),
          ) >
          new Date(
            maximumField.value.split(".").reduce((accumulator, current, index) => {
              return current + (index === 0 ? "" : "/") + accumulator;
            }),
          )
        ) {
          $(maximumField).error(toLoad.msgmaxinvalid);
        } else {
          $(maximumField).error("");
          $(toProcess).error("");
        }
      }
    };
    const formerOnMinSelect = $(toProcess).datepicker("option", "change");
    const formerOnMaxSelect = $(maximumField).datepicker("option", "change");
    $(toProcess).on("change", (event) => {
      if (formerOnMinSelect) {
        formerOnMinSelect(event);
      }
      onNewMinimum(event);
    });
    toProcess.addEventListener("input", onNewMinimum);
    $(maximumField).on("change", (event) => {
      if (formerOnMaxSelect) {
        formerOnMaxSelect(event);
      }
      onNewMaximum(event);
    });
    maximumField.addEventListener("input", onNewMaximum);
  }
};
__decorateClass(
  [
    DBC.ParamvalueProvider,
    __decorateParam(0, TYPE.PRE("string", "maxfield :: msgmininvalid :: msgmaxinvalid")),
    __decorateParam(
      0,
      REGEX.PRE(REGEX.stdExp.cssSelector, "maxfield", "Does the MaXField-Parameter not contain a valid CSS-Selector?"),
    ),
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(REGEX.stdExp.boolean), "equalitypermitted")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new TYPE("boolean"), "equalitypermitted", true)),
    __decorateParam(
      1,
      INSTANCE.PRE(
        HTMLInputElement,
        void 0,
        'Is it not an <input type = "text"/> that is tagged with this functionality?',
      ),
    ),
    __decorateParam(1, EQ.PRE("text", false, "type")),
  ],
  Date_Frame,
  "functionality",
  1,
);
window.codbi.registerFunctionality("Date.Frame", Date_Frame.functionality.bind(Date_Frame));
export { Date_Frame };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2pzL0Z1bmN0aW9uYWxpdGllcy9kYXRlLmZyYW1lLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvLyAjcmVnaW9uIEltcG9ydHNcbi8vICNyZWdpb24gWElNQVxuaW1wb3J0IHsgZ2V0SlF1ZXJ5IH0gZnJvbSBcIkBkZS14aW1hL2ZjLWZvcm0tcmVuZGVyZXJcIjtcbi8vICNlbmRyZWdpb24gWElNQVxuLy8gI3JlZ2lvbiBYREJDXG5pbXBvcnQgeyBEQkMgfSBmcm9tIFwieGRiYy9zcmMvREJDXCI7XG5pbXBvcnQgeyBFUSB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvRVEuanNcIjtcbmltcG9ydCB7IElGIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9JRi5qc1wiO1xuaW1wb3J0IHsgVFlQRSB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvVFlQRVwiO1xuaW1wb3J0IHsgUkVHRVggfSBmcm9tIFwieGRiYy9zcmMvREJDL1JFR0VYXCI7XG5pbXBvcnQgeyBJTlNUQU5DRSB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvSU5TVEFOQ0UuanNcIjtcbi8vICNlbmRyZWdpb24gWERCQ1xuaW1wb3J0IHsgQ29kQmlFcnJvciB9IGZyb20gXCIuLi9nbG9iYWwtc2NvcGUuanNcIjtcbi8vICNlbmRyZWdpb24gSW1wb3J0c1xuLyoqXG4gKiBQcm92aWRlcyB0aGUge0BsaW5rIEhUTUxfU2VsZWN0X0luamVjdGlvbi5mdW5jdGlvbmFsaXR5IH0uXG4gKlxuICogQHJlbWFya3NcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoU2FsdmF0b3JlLkNhbGxhcmlAQW5zYmFjaC5kZSkgKi9cbi8vIGJpb21lLWlnbm9yZSBsaW50L2NvbXBsZXhpdHkvbm9TdGF0aWNPbmx5Q2xhc3M6IFByb2FjdGl2ZSBEZXNpZ24uXG5leHBvcnQgY2xhc3MgRGF0ZV9GcmFtZSB7XG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgdGhlIFwiRGF0ZS5GcmFtZVwiLUZ1bmN0aW9uYWxpdHkuXG4gICAqXG4gICAqIFRoaXMgZnVuY3Rpb25hbGl0eSBjb25uZWN0cyB0d28ge0BsaW5rIEhUTUxJbnB1dEVsZW1lbnQgfXMgdG8gbm90IHBlcm1pdCB0aGUgZGVzaWduYXRlZFxuICAgKiBNaW5pbXVtLXtAbGluayBIVE1MSW5wdXRFbGVtZW50IH0gdG8gaGF2ZSBhIGRhdGUgdGhhdCBpcyBhZnRlciB0aGUgbWF4aW11bSBvbmUgKEpRdWVyeSBEYXRlcGlja2VyIHN1cHBvcnRlZCkuXG4gICAqIEluIG9yZGVyIGZvciB0aGlzIGZ1bmN0aW9uYWxpdHkgdG8gd29yayBpbiByZXBldGl0aXZlIGNvbnRhaW5lcnMsIHRoZSB0YWdnZWQge0BsaW5rIEhUTUxJbnB1dEVsZW1lbnQgfSBhbmQgdGhlXG4gICAqIGNvcnJlc3BvbmRpbmcgKipNYXhGaWVsZCoqIG5lZWQgdG8gYmUgd2l0aGluIHRoZSBzYW1lIGNvbnRhaW5lci5cbiAgICpcbiAgICogIyMjIENvbmZpZyBQYXJhbWV0ZXI6XG4gICAqICAtIE1heEZpZWxkOiAgICAgICAgICAgQ1NTLVNlbGVjdG9yIHNlbGVjdGluZyB0aGUge0BsaW5rIEhUTUxJbnB1dEVsZW1lbnQgfSB0aGF0IHRha2VzIHRoZSBtYXhpbXVtIGRhdGUuXG4gICAqICAtIE1zZ01pbkludmFsaWQ6ICAgICAgVGhlIHtAbGluayBzdHJpbmcgfSB0byBzaG93IGFzIHRoZSBlcnJvciBtZXNzYWdlIHdoZW4gdGhlIG1pbmltdW0te0BsaW5rIEhUTUxJbnB1dEVsZW1lbnQgfSdzIHZhbHVlIGlzIGFmdGVyXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgdGhlIG9uZSBpbiB0aGUgbWF4aW11bS17QGxpbmsgSFRNTElucHV0RWxlbWVudCB9LlxuICAgKiAgLSBNc2dNYXhJbnZhbGlkOiAgICAgIFRoZSB7QGxpbmsgc3RyaW5nIH0gdG8gc2hvdyBhcyB0aGUgZXJyb3IgbWVzc2FnZSB3aGVuIHRoZSBtYXhpbXVte0BsaW5rIEhUTUxJbnB1dEVsZW1lbnQgfSdzIHZhbHVlIGlzIGJlZm9yZVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgIHRoZSBvbmUgaW4gdGhlIG1pbmltdW0te0BsaW5rIEhUTUxJbnB1dEVsZW1lbnQgfS5cbiAgICogIC0gRXF1YWxpdHlQZXJtaXR0ZWQ6ICBBIHtAbGluayBib29sZWFuIH0gaW5kaWNhdGluZyB3aGV0aGVyIGVxdWFsaXR5IGJldHdlZW4gbWluaW11bSBhbmQgbWF4aW11bSBkYXRlcyBpcyBhbGxvd2VkLiAqL1xuICBAREJDLlBhcmFtdmFsdWVQcm92aWRlclxuICBwdWJsaWMgc3RhdGljIGZ1bmN0aW9uYWxpdHkoXG4gICAgQFRZUEUuUFJFKFwic3RyaW5nXCIsIFwibWF4ZmllbGQgOjogbXNnbWluaW52YWxpZCA6OiBtc2dtYXhpbnZhbGlkXCIpXG4gICAgQFJFR0VYLlBSRShSRUdFWC5zdGRFeHAuY3NzU2VsZWN0b3IsIFwibWF4ZmllbGRcIiwgXCJEb2VzIHRoZSBNYVhGaWVsZC1QYXJhbWV0ZXIgbm90IGNvbnRhaW4gYSB2YWxpZCBDU1MtU2VsZWN0b3I/XCIpXG4gICAgQElGLlBSRShuZXcgVFlQRShcInN0cmluZ1wiKSwgbmV3IFJFR0VYKFJFR0VYLnN0ZEV4cC5ib29sZWFuKSwgXCJlcXVhbGl0eXBlcm1pdHRlZFwiKVxuICAgIEBJRi5QUkUobmV3IFRZUEUoXCJzdHJpbmdcIiksIG5ldyBUWVBFKFwiYm9vbGVhblwiKSwgXCJlcXVhbGl0eXBlcm1pdHRlZFwiLCB0cnVlKVxuICAgIHRvTG9hZDogeyBba2V5OiBzdHJpbmddOiB1bmtub3duIH0sXG5cbiAgICBASU5TVEFOQ0UuUFJFKFxuICAgICAgSFRNTElucHV0RWxlbWVudCxcbiAgICAgIHVuZGVmaW5lZCxcbiAgICAgICdJcyBpdCBub3QgYW4gPGlucHV0IHR5cGUgPSBcInRleHRcIi8+IHRoYXQgaXMgdGFnZ2VkIHdpdGggdGhpcyBmdW5jdGlvbmFsaXR5PycsXG4gICAgKVxuICAgIEBFUS5QUkUoXCJ0ZXh0XCIsIGZhbHNlLCBcInR5cGVcIilcbiAgICB0b1Byb2Nlc3M6IEVsZW1lbnQsXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IG1heGltdW1GaWVsZCA9IElOU1RBTkNFLnRzQ2hlY2s8SFRNTElucHV0RWxlbWVudD4oXG4gICAgICB0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IodG9Mb2FkLm1heGZpZWxkIGFzIHN0cmluZyksXG4gICAgICBIVE1MSW5wdXRFbGVtZW50LFxuICAgICAgXCJJcyB0aGUgQ1NTLVNlbGVjdG9yIGluIHRoZSBNYXhGaWVsZC1QYXJhbWV0ZXIgbm90IHNlbGVjdGluZyBhbiA8aW5wdXQvPiBlbGVtZW50P1wiLFxuICAgICk7XG5cbiAgICBpZiAobWF4aW11bUZpZWxkID09PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgQ29kQmlFcnJvcihgVGhlIHNlbGVjdG9yIFwiJHt0b0xvYWQubWF4ZmllbGR9XCIgZG9lcyBub3Qgc2VsZWN0IGFueXRoaW5nLmApO1xuICAgIH1cblxuICAgIGNvbnN0ICQgPSBnZXRKUXVlcnkoKTtcbiAgICAvLyAjcmVnaW9uIE5vcm1hbGl6ZSBwYXJhbWV0ZXJzLlxuICAgIHRvTG9hZC5tc2dtaW5pbnZhbGlkID0gdG9Mb2FkLm1zZ21pbmludmFsaWQgPyB0b0xvYWQubXNnbWluaW52YWxpZCA6IFwiTWluaW11bSB2YWx1ZSBpcyBpbnZhbGlkLlwiO1xuICAgIHRvTG9hZC5tc2dtYXhpbnZhbGlkID0gdG9Mb2FkLm1zZ21heGludmFsaWQgPyB0b0xvYWQubXNnbWF4aW52YWxpZCA6IFwiTWF4aW11bSB2YWx1ZSBpcyBpbnZhbGlkLlwiO1xuICAgIHRvTG9hZC5lcXVhbGl0eXBlcm1pdHRlZCA9IHRvTG9hZC5lcXVhbGl0eXBlcm1pdHRlZFxuICAgICAgPyB0eXBlb2YgdG9Mb2FkLmVxdWFsaXR5cGVybWl0dGVkID09PSBcImJvb2xlYW5cIlxuICAgICAgICA/ICh0b0xvYWQuZXF1YWxpdHlwZXJtaXR0ZWQgYXMgYm9vbGVhbilcbiAgICAgICAgOiAodG9Mb2FkLmVxdWFsaXR5cGVybWl0dGVkIGFzIHN0cmluZykudG9Mb3dlckNhc2UoKSA9PT0gXCJ0cnVlXCJcbiAgICAgIDogZmFsc2U7XG4gICAgLy8gI2VuZHJlZ2lvbiBOb3JtYWxpemUgcGFyYW1ldGVycy5cbiAgICAvLyAjcmVnaW9uIERlZmluZSBiZWhhdmlvciBvbiBjaGFuZ2VkIGZpZWxkIHZhbHVlcy5cbiAgICBjb25zdCBvbk5ld01pbmltdW06IChldmVudDogRXZlbnQpID0+IHVuZGVmaW5lZCA9IChldmVudDogRXZlbnQpOiB1bmRlZmluZWQgPT4ge1xuICAgICAgaWYgKHRvTG9hZC5lcXVhbGl0eXBlcm1pdHRlZCkge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgbmV3IERhdGUoXG4gICAgICAgICAgICAodG9Qcm9jZXNzIGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlLnNwbGl0KFwiLlwiKS5yZWR1Y2UoKGFjY3VtdWxhdG9yLCBjdXJyZW50LCBpbmRleCk6IHN0cmluZyA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiBjdXJyZW50ICsgKGluZGV4ID09PSAwID8gXCJcIiA6IFwiL1wiKSArIGFjY3VtdWxhdG9yO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgKSA+PVxuICAgICAgICAgIG5ldyBEYXRlKFxuICAgICAgICAgICAgKG1heGltdW1GaWVsZCBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZS5zcGxpdChcIi5cIikucmVkdWNlKChhY2N1bXVsYXRvciwgY3VycmVudCwgaW5kZXgpOiBzdHJpbmcgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gY3VycmVudCArIChpbmRleCA9PT0gMCA/IFwiXCIgOiBcIi9cIikgKyBhY2N1bXVsYXRvcjtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIClcbiAgICAgICAgKSB7XG4gICAgICAgICAgJCh0b1Byb2Nlc3MpLmVycm9yKHRvTG9hZC5tc2dtaW5pbnZhbGlkIGFzIHN0cmluZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJCh0b1Byb2Nlc3MpLmVycm9yKFwiXCIpO1xuICAgICAgICAgICQobWF4aW11bUZpZWxkKS5lcnJvcihcIlwiKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIG5ldyBEYXRlKFxuICAgICAgICAgICAgKHRvUHJvY2VzcyBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZS5zcGxpdChcIi5cIikucmVkdWNlKChhY2N1bXVsYXRvciwgY3VycmVudCwgaW5kZXgpOiBzdHJpbmcgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gY3VycmVudCArIChpbmRleCA9PT0gMCA/IFwiXCIgOiBcIi9cIikgKyBhY2N1bXVsYXRvcjtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICkgPlxuICAgICAgICAgIG5ldyBEYXRlKFxuICAgICAgICAgICAgKG1heGltdW1GaWVsZCBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZS5zcGxpdChcIi5cIikucmVkdWNlKChhY2N1bXVsYXRvciwgY3VycmVudCwgaW5kZXgpOiBzdHJpbmcgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gY3VycmVudCArIChpbmRleCA9PT0gMCA/IFwiXCIgOiBcIi9cIikgKyBhY2N1bXVsYXRvcjtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIClcbiAgICAgICAgKSB7XG4gICAgICAgICAgJCh0b1Byb2Nlc3MpLmVycm9yKHRvTG9hZC5tc2dtaW5pbnZhbGlkIGFzIHN0cmluZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJCh0b1Byb2Nlc3MpLmVycm9yKFwiXCIpO1xuICAgICAgICAgICQobWF4aW11bUZpZWxkKS5lcnJvcihcIlwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCBvbk5ld01heGltdW06IChldmVudDogRXZlbnQpID0+IHVuZGVmaW5lZCA9IChldmVudDogRXZlbnQpOiB1bmRlZmluZWQgPT4ge1xuICAgICAgaWYgKHRvTG9hZC5lcXVhbGl0eXBlcm1pdHRlZCkge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgbmV3IERhdGUoXG4gICAgICAgICAgICAodG9Qcm9jZXNzIGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlXG4gICAgICAgICAgICAgIC5zcGxpdChcIi5cIilcbiAgICAgICAgICAgICAgLnJlZHVjZSgoYWNjdW11bGF0b3I6IHN0cmluZywgY3VycmVudDogc3RyaW5nLCBpbmRleDogbnVtYmVyKTogc3RyaW5nID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY3VycmVudCArIChpbmRleCA9PT0gMCA/IFwiXCIgOiBcIi9cIikgKyBhY2N1bXVsYXRvcjtcbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgKSA+PVxuICAgICAgICAgIG5ldyBEYXRlKFxuICAgICAgICAgICAgKG1heGltdW1GaWVsZCBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZVxuICAgICAgICAgICAgICAuc3BsaXQoXCIuXCIpXG4gICAgICAgICAgICAgIC5yZWR1Y2UoKGFjY3VtdWxhdG9yOiBzdHJpbmcsIGN1cnJlbnQ6IHN0cmluZywgaW5kZXg6IG51bWJlcik6IHN0cmluZyA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnQgKyAoaW5kZXggPT09IDAgPyBcIlwiIDogXCIvXCIpICsgYWNjdW11bGF0b3I7XG4gICAgICAgICAgICAgIH0pLFxuICAgICAgICAgIClcbiAgICAgICAgKSB7XG4gICAgICAgICAgJChtYXhpbXVtRmllbGQpLmVycm9yKHRvTG9hZC5tc2dtYXhpbnZhbGlkIGFzIHN0cmluZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJChtYXhpbXVtRmllbGQpLmVycm9yKFwiXCIpO1xuICAgICAgICAgICQodG9Qcm9jZXNzKS5lcnJvcihcIlwiKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIG5ldyBEYXRlKFxuICAgICAgICAgICAgKHRvUHJvY2VzcyBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZVxuICAgICAgICAgICAgICAuc3BsaXQoXCIuXCIpXG4gICAgICAgICAgICAgIC5yZWR1Y2UoKGFjY3VtdWxhdG9yOiBzdHJpbmcsIGN1cnJlbnQ6IHN0cmluZywgaW5kZXg6IG51bWJlcik6IHN0cmluZyA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnQgKyAoaW5kZXggPT09IDAgPyBcIlwiIDogXCIvXCIpICsgYWNjdW11bGF0b3I7XG4gICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICkgPlxuICAgICAgICAgIG5ldyBEYXRlKFxuICAgICAgICAgICAgKG1heGltdW1GaWVsZCBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZVxuICAgICAgICAgICAgICAuc3BsaXQoXCIuXCIpXG4gICAgICAgICAgICAgIC5yZWR1Y2UoKGFjY3VtdWxhdG9yOiBzdHJpbmcsIGN1cnJlbnQ6IHN0cmluZywgaW5kZXg6IG51bWJlcik6IHN0cmluZyA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnQgKyAoaW5kZXggPT09IDAgPyBcIlwiIDogXCIvXCIpICsgYWNjdW11bGF0b3I7XG4gICAgICAgICAgICAgIH0pLFxuICAgICAgICAgIClcbiAgICAgICAgKSB7XG4gICAgICAgICAgJChtYXhpbXVtRmllbGQpLmVycm9yKHRvTG9hZC5tc2dtYXhpbnZhbGlkIGFzIHN0cmluZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJChtYXhpbXVtRmllbGQpLmVycm9yKFwiXCIpO1xuICAgICAgICAgICQodG9Qcm9jZXNzKS5lcnJvcihcIlwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gICAgLy8gI2VuZHJlZ2lvbiBEZWZpbmUgYmVoYXZpb3Igb24gY2hhbmdlZCBmaWVsZCB2YWx1ZXMuXG4gICAgLy8gI3JlZ2lvbiBCaW5kIG5lY2Vzc2FyeSBldmVudHMuXG4gICAgY29uc3QgZm9ybWVyT25NaW5TZWxlY3Q6IChldmVudDogRXZlbnQpID0+IHVuZGVmaW5lZCA9ICQodG9Qcm9jZXNzKS5kYXRlcGlja2VyKFwib3B0aW9uXCIsIFwiY2hhbmdlXCIpO1xuICAgIGNvbnN0IGZvcm1lck9uTWF4U2VsZWN0OiAoZXZlbnQ6IEV2ZW50KSA9PiB1bmRlZmluZWQgPSAkKG1heGltdW1GaWVsZCkuZGF0ZXBpY2tlcihcIm9wdGlvblwiLCBcImNoYW5nZVwiKTtcblxuICAgICQodG9Qcm9jZXNzKS5vbihcImNoYW5nZVwiLCAoZXZlbnQ6IEV2ZW50KTogdW5kZWZpbmVkID0+IHtcbiAgICAgIGlmIChmb3JtZXJPbk1pblNlbGVjdCkge1xuICAgICAgICBmb3JtZXJPbk1pblNlbGVjdChldmVudCk7XG4gICAgICB9XG5cbiAgICAgIG9uTmV3TWluaW11bShldmVudCk7XG4gICAgfSk7XG5cbiAgICB0b1Byb2Nlc3MuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIG9uTmV3TWluaW11bSk7XG4gICAgJChtYXhpbXVtRmllbGQpLm9uKFwiY2hhbmdlXCIsIChldmVudDogRXZlbnQpOiB1bmRlZmluZWQgPT4ge1xuICAgICAgaWYgKGZvcm1lck9uTWF4U2VsZWN0KSB7XG4gICAgICAgIGZvcm1lck9uTWF4U2VsZWN0KGV2ZW50KTtcbiAgICAgIH1cblxuICAgICAgb25OZXdNYXhpbXVtKGV2ZW50KTtcbiAgICB9KTtcblxuICAgIG1heGltdW1GaWVsZC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgb25OZXdNYXhpbXVtKTtcbiAgICAvLyAjZW5kcmVnaW9uIEJpbmQgbmVjZXNzYXJ5IGV2ZW50cy5cbiAgfVxufVxuXG53aW5kb3cuY29kYmkucmVnaXN0ZXJGdW5jdGlvbmFsaXR5KFwiRGF0ZS5GcmFtZVwiLCBEYXRlX0ZyYW1lLmZ1bmN0aW9uYWxpdHkuYmluZChEYXRlX0ZyYW1lKSk7IC8vIEluaXRpYWxpemF0aW9uXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVB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
