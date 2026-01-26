import { a as p } from "./chunk-W3SPBNH5.js";
import { a as n } from "./chunk-IZMXAPWV.js";
import { b as m } from "./chunk-XMOSKO55.js";
import "./chunk-EEU2ZRMO.js";
import { a as r } from "./chunk-CVDXS2Z7.js";
import { a as e } from "./chunk-PR6DYHSM.js";
import { a as s } from "./chunk-TNKBSIBG.js";
import { c as a, d as o } from "./chunk-REJDLPRJ.js";
var t = class t {
  static retrieve(i) {
    return [m(i[0], i.length === 2 ? i[1] : "DD.MM.YYYY")];
  }
};
(t.registered = window.codbi.registerEP("Date.FromString", t.retrieve)),
  a(
    [
      s.ParamvalueProvider,
      e.POST(new p(Date)),
      o(0, e.PRE([new n("string"), new r(r.stdExp.date)], 0)),
      o(0, e.PRE([new n("string"), new r(r.stdExp.dateFormat)], 1)),
    ],
    t,
    "retrieve",
    1,
  );
var d = t;
export { d as DATE_FromString };
