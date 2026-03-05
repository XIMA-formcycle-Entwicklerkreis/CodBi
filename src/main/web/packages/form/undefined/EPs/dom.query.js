import { a as s } from "./chunk-X7STRZ54.js";
import { a as o } from "./chunk-JDZ7GIHA.js";
import { a as m } from "./chunk-BQCZFAYZ.js";
import { a as l } from "./chunk-PN2FQ2K5.js";
import { a as t } from "./chunk-2NFNCZZA.js";
import { c as i, d as r, g as n } from "./chunk-WWJ6UWS7.js";
var e = class {
  static retrieve(E) {
    return document.querySelector(E[0]);
  }
};
i(
  [
    n.ParamvalueProvider,
    s.POST(Element),
    r(0, m.PRE(1, !0, !1, "length", "Hasn't the CSS-Selector been specified?")),
    r(0, t.PRE([new l("string")])),
    r(0, t.PRE(new o(o.stdExp.cssSelector), 0)),
  ],
  e,
  "retrieve",
  1,
);
window.codbi.registerEP("DOM.Query", e.retrieve.bind(e));
export { e as DOM_Query };
