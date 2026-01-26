import { a as y } from "./chunk-BGFHKOW7.js";
import { a as g } from "./chunk-QM2ZX7FA.js";
import { a as f } from "./chunk-MUWAMKOD.js";
import { g as u, h as l } from "./chunk-RS4WWU7K.js";
var n = class n {
  static functionality(e, a) {
    e.reclean &&
      ((typeof e.reclean == "string" && e.reclean.toLocaleLowerCase() === "true") ||
        (typeof e.reclean == "boolean" && e.reclean === !0)) &&
      (a.innerHTML = "");
    let c = e.titles ? e.titles.length : e.values.length;
    e.titles === void 0 && (e.titles = e.values);
    for (let r = 0; r < c; r++) {
      let t, i, s;
      (i = s = e.values[r]),
        (t = e.titles ? e.titles[r] : i),
        typeof i != "string" && ((i = t[e.valueproperty]), (s = t[e.textproperty])),
        typeof t != "string" && (t = t[e.titleproperty]),
        (a.innerHTML += `<option title = "${t} value = "${i}">${s}</option>`);
    }
  }
};
(n.registered = window.codbi.registerFunctionality("HTML.Select.Injection", n.functionality)),
  u([f.ParamvalueProvider, l(0, y.PRE(Array, "values")), l(1, g.PRE("SELECT", !1, "tagName"))], n, "functionality", 1);
var p = n;
export { p as HTML_Select_Injection };
