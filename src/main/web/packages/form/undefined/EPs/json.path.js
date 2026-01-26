import { a as b } from "./chunk-XMOSKO55.js";
import "./chunk-EEU2ZRMO.js";
import { a as o } from "./chunk-CVDXS2Z7.js";
import { a as c } from "./chunk-TNKBSIBG.js";
import { c as d } from "./chunk-REJDLPRJ.js";
var n = class n {
  static retrieve(r) {
    return p(r[1], r[0]);
  }
};
(n.registered = window.codbi.registerEP("JSON.Path", n.retrieve)), d([c.ParamvalueProvider], n, "retrieve", 1);
var l = n;
function p(t, r) {
  new o(o.stdExp.keyPath).check(t);
  let s = t.split(".");
  return s.reduce((u, e, a) => {
    let i = e.indexOf("()") === -1 ? u[e] : u[e.substring(0, e.indexOf("()"))]();
    if (i == null && a < s.length - 1) throw new b(`Path "${t}" is interrupted by an undefined or null object at ${a}`);
    return i;
  }, r);
}
export { l as JSON_Path, p as resolvePath };
