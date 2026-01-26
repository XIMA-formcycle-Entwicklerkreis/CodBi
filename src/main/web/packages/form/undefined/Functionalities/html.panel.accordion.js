import { a as d } from "./chunk-BGFHKOW7.js";
import { a } from "./chunk-MUWAMKOD.js";
import { g as o, h as r } from "./chunk-RS4WWU7K.js";
var e = class e {
  static functionality(t, l) {
    if (t.accordion === void 0 || XFC_METADATA.requestType === "print") return;
    let n = () => {
      for (let i of l.querySelectorAll(".CodBi.--HTML_Panel:not(.CodBi_HTML_Panel_NoCordion)"))
        i.setAttribute("data-cb-accordion", t.accordion);
    };
    window.addEventListener("load", (i) => {
      n();
    }),
      n();
  }
};
(e.registered = window.codbi.registerFunctionality("HTML.Panel.Accordion", e.functionality)),
  o([a.ParamvalueProvider, r(1, d.PRE(HTMLDivElement))], e, "functionality", 1);
var c = e;
export { c as HTML_Panel_Accordion };
