import { a as l } from "./chunk-HI24USOS.js";
import { a as s } from "./chunk-7ZUEWSHL.js";
import { a as n } from "./chunk-KEJSWGMR.js";
import { a as c } from "./chunk-CDLTIEKC.js";
import { g as d, h as t, p as a } from "./chunk-UTJJRBTX.js";
var i = class {
  static functionality(e, f) {
    if (e.accordion === void 0 || XFC_METADATA.requestType === "print") return;
    let o = () => {
      for (let r of f.querySelectorAll(".CodBi.--HTML_Panel:not(.CodBi_HTML_Panel_NoCordion)"))
        r.setAttribute("data-cb-accordion", e.accordion);
    };
    window.addEventListener("load", (r) => {
      o();
    }),
      o();
  }
};
d(
  [
    a.ParamvalueProvider,
    t(0, c.PRE("string", "accordion")),
    t(0, s.PRE("accordion", "Is the data-cb-Accordion not defined?")),
    t(
      1,
      l.PRE(
        [new n(HTMLDivElement), new n(HTMLFieldSetElement)],
        void 0,
        "Is it not a <div> or <fieldset> that is tagged with this functionality?",
      ),
    ),
  ],
  i,
  "functionality",
  1,
);
window.codbi.registerFunctionality("HTML.Panel.Accordion", i.functionality.bind(i));
export { i as HTML_Panel_Accordion };
