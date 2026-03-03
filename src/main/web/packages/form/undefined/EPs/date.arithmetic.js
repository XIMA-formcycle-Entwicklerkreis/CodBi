import { b as c } from "./chunk-C72LR5QE.js";
import { a as m } from "./chunk-X7STRZ54.js";
import { a as i } from "./chunk-JDZ7GIHA.js";
import { b as n } from "./chunk-SBHCT576.js";
import "./chunk-ZAZUS2LA.js";
import "./chunk-HV3SPSHE.js";
import { a as l } from "./chunk-BQCZFAYZ.js";
import { a } from "./chunk-PN2FQ2K5.js";
import { a as f } from "./chunk-2NFNCZZA.js";
import { c as d, d as o, g as s } from "./chunk-WWJ6UWS7.js";
var e = class {
  static retrieve(t) {
    let r = t[1].indexOf("+") !== -1 || t[1].indexOf("-") !== -1 ? n(t[0]) : n(t[0], t[1]);
    return (
      (r === null || r.toString() === "Invalid Date") &&
        window.codbi.reportError(`"stringToDate" returned NULL. Invoked with: ${t}.`),
      c(r, t.slice(t[1].indexOf("+") !== -1 || t[1].indexOf("-") !== -1 ? 1 : 2))
    );
  }
};
d(
  [
    s.ParamvalueProvider,
    m.POST(Date),
    o(0, l.PRE(2, !0, !1, "length", "Was the date string to convert and the operation to perform not specified?")),
    o(0, f.PRE([new a("string"), new i(i.stdExp.date)], 0)),
  ],
  e,
  "retrieve",
  1,
);
window.codbi.registerEP("Date.Arithmetic", e.retrieve.bind(e));
export { e as DATE_Arithmetic };
