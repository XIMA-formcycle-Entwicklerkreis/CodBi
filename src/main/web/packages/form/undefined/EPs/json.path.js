import { a as r } from "./chunk-JDZ7GIHA.js";
import { a as l } from "./chunk-SBHCT576.js";
import { a as b } from "./chunk-ZAZUS2LA.js";
import "./chunk-HV3SPSHE.js";
import { a as c } from "./chunk-BQCZFAYZ.js";
import { a as m } from "./chunk-PN2FQ2K5.js";
import { a as i } from "./chunk-2NFNCZZA.js";
import { c as u, d as e, g as E } from "./chunk-WWJ6UWS7.js";
var t = class t {
  static retrieve(n) {
    return P(n[1], n[0]);
  }
};
(t.registered = window.codbi.registerEP("JSON.Path", t.retrieve)),
  u(
    [
      E.ParamvalueProvider,
      e(0, c.PRE(1, !0, !1, "length", "Haven't the object to retrieve from and the path been specified?")),
      e(0, i.PRE(new b(), 0)),
      e(0, i.PRE(new m("string"), 1)),
      e(0, i.PRE(new r(r.stdExp.keyPath), 1)),
    ],
    t,
    "retrieve",
    1,
  );
var w = t;
function P(s, n) {
  new r(r.stdExp.keyPath).check(s);
  let p = s.split(".");
  return p.reduce((d, o, f) => {
    let a = o.indexOf("()") === -1 ? d[o] : d[o.substring(0, o.indexOf("()"))]();
    if (a == null && f < p.length - 1) throw new l(`Path "${s}" is interrupted by an undefined or null object at ${f}`);
    return a;
  }, n);
}
export { w as JSON_Path, P as resolvePath };
