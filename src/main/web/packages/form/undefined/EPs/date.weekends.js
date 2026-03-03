import { a as i } from "./chunk-JDZ7GIHA.js";
import { a as d } from "./chunk-BQCZFAYZ.js";
import { a as o } from "./chunk-PN2FQ2K5.js";
import { a as l } from "./chunk-2NFNCZZA.js";
import { c as g, d as n, g as m } from "./chunk-WWJ6UWS7.js";
var u = document.createElement("style");
u.textContent = `
  .xm-error-text.label-top.label-none.xm-text ul {
    word-break: break-word ;
  }`;
document.head.appendChild(u);
var a = class {
  static retrieve(p) {
    let s = new Array(),
      e = p,
      r,
      t;
    for (
      e.length >= 2
        ? ((e[0] = e[0].trim().split(".")),
          (e[1] = e[1].trim().split(".")),
          (r = new Date(Number.parseInt(e[0][2]), Number.parseInt(e[0][1]) - 1, Number.parseInt(e[0][0]))),
          (t = new Date(Number.parseInt(e[1][2]), Number.parseInt(e[1][1]) - 1, Number.parseInt(e[1][0]))))
        : e.length === 1 &&
          (t = new Date(Number.parseInt(e[0][2]), Number.parseInt(e[0][1]) - 1, Number.parseInt(e[0][0]))),
        r === void 0 && (r = new Date()),
        t === void 0 && ((t = new Date()), t.setFullYear(r.getFullYear() + 1));
      r <= t;
    )
      (r.getDay() === 0 || r.getDay() === 6) &&
        s.push(r.toLocaleDateString("de-DE", { year: "numeric", month: "2-digit", day: "2-digit" })),
        r.setDate(r.getDate() + 1);
    return s;
  }
};
g(
  [
    m.ParamvalueProvider,
    n(0, d.PRE(1, !0, !1, "length", "Hasn't at least the beginning of the range been specified?")),
    n(0, l.PRE([new o("string"), new i(i.stdExp.date)])),
  ],
  a,
  "retrieve",
  1,
);
window.codbi.registerEP("Date.Weekends", a.retrieve.bind(a));
export { a as Date_Weekends };
