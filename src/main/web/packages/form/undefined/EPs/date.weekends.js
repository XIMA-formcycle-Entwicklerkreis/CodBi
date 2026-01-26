import { a as o } from "./chunk-IZMXAPWV.js";
import { a as n } from "./chunk-CVDXS2Z7.js";
import { a as m } from "./chunk-PR6DYHSM.js";
import { a as l } from "./chunk-TNKBSIBG.js";
import { c as s, d as g } from "./chunk-REJDLPRJ.js";
var d = document.createElement("style");
d.textContent = `
  .xm-error-text.label-top.label-none.xm-text ul {
    word-break: break-word ;
  }`;
document.head.appendChild(d);
var a = class a {
  static retrieve(p) {
    let i = new Array(),
      r = p,
      e,
      t;
    for (
      r.length >= 2
        ? ((r[0] = r[0].trim().split(".")),
          (r[1] = r[1].trim().split(".")),
          (e = new Date(Number.parseInt(r[0][2]), Number.parseInt(r[0][1]) - 1, Number.parseInt(r[0][0]))),
          (t = new Date(Number.parseInt(r[1][2]), Number.parseInt(r[1][1]) - 1, Number.parseInt(r[1][0]))))
        : r.length === 1 &&
          (t = new Date(Number.parseInt(r[0][2]), Number.parseInt(r[0][1]) - 1, Number.parseInt(r[0][0]))),
        e === void 0 && (e = new Date()),
        t === void 0 && ((t = new Date()), t.setFullYear(e.getFullYear() + 1));
      e <= t;
    )
      (e.getDay() === 0 || e.getDay() === 6) &&
        i.push(e.toLocaleDateString("de-DE", { year: "numeric", month: "2-digit", day: "2-digit" })),
        e.setDate(e.getDate() + 1);
    return i;
  }
};
(a.registered = window.codbi.registerEP("Date.Weekends", a.retrieve)),
  s([l.ParamvalueProvider, g(0, m.PRE([new o("string"), new n(n.stdExp.date)]))], a, "retrieve", 1);
var u = a;
export { u as Date_Weekends };
