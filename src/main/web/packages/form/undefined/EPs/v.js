import { a as u } from "./chunk-XMOSKO55.js";
import "./chunk-EEU2ZRMO.js";
import { a as i } from "./chunk-CVDXS2Z7.js";
import { a as s } from "./chunk-TNKBSIBG.js";
import { c as n, d as l } from "./chunk-REJDLPRJ.js";
var r = class r {
  static retrieve(e) {
    var o;
    let t = (o = document.querySelector(`[ data-name = "${e[0].trim()}"]`)) == null ? void 0 : o.getAttribute("value");
    if (t == null) {
      if (e.length === 2 && e[1].toLowerCase() === "report") throw new u(`No global variable "${e[0]}" existent.`);
      return "";
    }
    return t;
  }
};
(r.registered = window.codbi.registerEP("V", r.retrieve)),
  n([s.ParamvalueProvider, l(0, i.PRE(i.stdExp.cssSelector))], r, "retrieve", 1);
var a = r;
export { a as V };
