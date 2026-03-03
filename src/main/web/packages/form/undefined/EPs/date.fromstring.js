import { a as d } from "./chunk-X7STRZ54.js";
import { a as t } from "./chunk-JDZ7GIHA.js";
import { b as p } from "./chunk-SBHCT576.js";
import "./chunk-ZAZUS2LA.js";
import "./chunk-HV3SPSHE.js";
import { a as m } from "./chunk-BQCZFAYZ.js";
import { a as n } from "./chunk-PN2FQ2K5.js";
import { a as o } from "./chunk-2NFNCZZA.js";
import { c as a, d as e, g as s } from "./chunk-WWJ6UWS7.js";
var r = class {
  static retrieve(i) {
    return [p(i[0], i.length === 2 ? i[1] : "DD.MM.YYYY")];
  }
};
a(
  [
    s.ParamvalueProvider,
    o.POST(new d(Date)),
    e(0, m.PRE(2, !0, !1, "length", "Was the date string to convert and the operation to perform not specified?")),
    e(0, o.PRE([new n("string"), new t(t.stdExp.date)], 0)),
    e(0, o.PRE([new n("string"), new t(t.stdExp.dateFormat)], 1)),
  ],
  r,
  "retrieve",
  1,
);
window.codbi.registerEP("Date.FromString", r.retrieve.bind(r));
export { r as DATE_FromString };
