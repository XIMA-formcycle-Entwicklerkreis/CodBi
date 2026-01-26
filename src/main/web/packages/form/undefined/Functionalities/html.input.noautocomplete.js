import { a } from "./chunk-MUWAMKOD.js";
import { g as e } from "./chunk-RS4WWU7K.js";
var t = class t {
  static functionality(l, i) {
    if (i.tagName === "INPUT") i.setAttribute("autocomplete", "off");
    else for (let r of i.querySelectorAll("input")) r.setAttribute("autocomplete", "off");
  }
};
(t.registered = window.codbi.registerFunctionality("HTML.Input.NoAutocomplete", t.functionality)),
  e([a.ParamvalueProvider], t, "functionality", 1);
var o = t;
export { o as HTML_Input_NoAutocomplete };
