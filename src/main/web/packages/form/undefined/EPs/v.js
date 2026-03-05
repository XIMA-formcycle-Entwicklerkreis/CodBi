import { a } from "./chunk-JDZ7GIHA.js";
import { a as u } from "./chunk-SBHCT576.js";
import "./chunk-ZAZUS2LA.js";
import "./chunk-HV3SPSHE.js";
import { a as s } from "./chunk-BQCZFAYZ.js";
import { c as o, d as i, g as l } from "./chunk-WWJ6UWS7.js";
var e = class {
  static retrieve(r) {
    var n;
    let t = (n = document.querySelector(`[ data-name = "${r[0].trim()}"]`)) == null ? void 0 : n.getAttribute("value");
    if (t == null) {
      if (r.length === 2 && r[1].toLowerCase() === "report") throw new u(`No global variable "${r[0]}" existent.`);
      return "";
    }
    return t;
  }
};
o(
  [
    l.ParamvalueProvider,
    i(0, s.PRE(1, !0, !1, "length", "Hasn't at least the the variable's CSS-Selector been specified?")),
    i(0, a.PRE(/\w+/)),
  ],
  e,
  "retrieve",
  1,
);
window.codbi.registerEP("V", e.retrieve.bind(e));
export { e as V };
