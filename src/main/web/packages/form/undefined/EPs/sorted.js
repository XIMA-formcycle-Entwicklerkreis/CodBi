import { a as f } from "./chunk-X7STRZ54.js";
import { a as o } from "./chunk-JDZ7GIHA.js";
import { a as u } from "./chunk-BQCZFAYZ.js";
import { a as p } from "./chunk-PN2FQ2K5.js";
import { a as n } from "./chunk-2NFNCZZA.js";
import { c as a, d as t, g as E } from "./chunk-WWJ6UWS7.js";
var e = class {
  static retrieve(r) {
    return r.length > 1
      ? (r[0].sort((m, g) => {
          let i = m[r[1]].toUpperCase(),
            s = g[r[1]].toUpperCase();
          return i < s ? -1 : i > s ? 1 : 0;
        }),
        r[0])
      : r.sort();
  }
};
a(
  [
    E.ParamvalueProvider,
    t(0, u.PRE(1, !0, !1, "length", "Hasn't at least the the Array to sort been provided?")),
    t(0, n.PRE(new f(Array), 0)),
    t(0, n.PRE(new p("string"), 1)),
    t(0, n.PRE(new o(o.stdExp.property), 1)),
  ],
  e,
  "retrieve",
  1,
);
window.codbi.registerEP("Sorted", e.retrieve.bind(e));
export { e as Sorted };
