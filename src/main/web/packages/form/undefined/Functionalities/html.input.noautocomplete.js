import { a as l } from "./chunk-PSEWTT4Z.js";
import { a } from "./chunk-KEJSWGMR.js";
import { g as n, h as e, p as o } from "./chunk-UTJJRBTX.js";
var t = class {
  static functionality(u, i) {
    if (i.tagName === "INPUT") i.setAttribute("autocomplete", "off");
    else for (let r of i.querySelectorAll("input")) r.setAttribute("autocomplete", "off");
  }
};
n(
  [
    o.ParamvalueProvider,
    e(
      1,
      a.PRE(HTMLInputElement, void 0, 'Is it not an <input type = "text"/> that is tagged with this functionality?'),
    ),
    e(1, l.PRE("text", !1, "type")),
  ],
  t,
  "functionality",
  1,
);
window.codbi.registerFunctionality("HTML.Input.NoAutocomplete", t.functionality.bind(t));
export { t as HTML_Input_NoAutocomplete };
