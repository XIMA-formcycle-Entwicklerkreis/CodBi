import { a as b } from "./chunk-XMOSKO55.js";
import "./chunk-EEU2ZRMO.js";
import { a as o } from "./chunk-CVDXS2Z7.js";
import { a } from "./chunk-TNKBSIBG.js";
import { c } from "./chunk-REJDLPRJ.js";
var n = class n {
  static retrieve(e) {
    return p(e[1], e[0]);
  }
};
(n.registered = window.codbi.registerEP("JSON.Path", n.retrieve)), c([a.ParamvalueProvider], n, "retrieve", 1);
var l = n;
function p(r, e) {
  new o(o.stdExp.keyPath).check(r);
  let s = r.split(".");
  return s.reduce((u, t, d) => {
    let i = t.indexOf("()") === -1 ? u[t] : u[t.substring(0, t.indexOf("()"))]();
    if (i == null && d < s.length - 1) throw new b(`Path "${r}" is interrupted by an undefined or null object at ${d}`);
    return i;
  }, e);
}
export { l as JSON_Path_Array, p as resolvePath };
