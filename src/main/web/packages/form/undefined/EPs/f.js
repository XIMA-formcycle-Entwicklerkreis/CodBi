import { a as n } from "./chunk-X7STRZ54.js";
import { a as u } from "./chunk-ZAZUS2LA.js";
import { a as f } from "./chunk-BQCZFAYZ.js";
import { a as E } from "./chunk-PN2FQ2K5.js";
import { a as o } from "./chunk-2NFNCZZA.js";
import { c as s, d as r, g as m } from "./chunk-WWJ6UWS7.js";
var e = class {
  static retrieve(t) {
    let i = [];
    for (let a of t[2]) a[t[0]] === t[1] && i.push(a);
    return i;
  }
};
s(
  [
    m.ParamvalueProvider,
    n.POST(Array),
    r(0, f.PRE(3, !0, !1, "length", "Haven't the name, the value and the pool to search been specified?")),
    r(0, o.PRE(new E("string"), 0)),
    r(0, o.PRE(new u(), 1)),
    r(0, o.PRE(new n(Array), 2)),
  ],
  e,
  "retrieve",
  1,
);
window.codbi.registerEP("F", e.retrieve.bind(e));
export { e as F };
