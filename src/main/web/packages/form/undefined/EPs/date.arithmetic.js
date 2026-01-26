import { b as u } from "./chunk-SALGTDA3.js";
import { a as l } from "./chunk-IZMXAPWV.js";
import { b as n } from "./chunk-XMOSKO55.js";
import "./chunk-EEU2ZRMO.js";
import { a as i } from "./chunk-CVDXS2Z7.js";
import { a as f } from "./chunk-PR6DYHSM.js";
import { a as s } from "./chunk-TNKBSIBG.js";
import { c as o, d } from "./chunk-REJDLPRJ.js";
var r = class r {
  static retrieve(e) {
    let t = e[1].indexOf("+") !== -1 || e[1].indexOf("-") !== -1 ? n(e[0]) : n(e[0], e[1]);
    return (
      (t === null || t.toString() === "Invalid Date") &&
        window.codbi.reportError(`"stringToDate" returned NULL. Invoked with: ${e}.`),
      u(t, e.slice(e[1].indexOf("+") !== -1 || e[1].indexOf("-") !== -1 ? 1 : 2))
    );
  }
};
(r.registered = window.codbi.registerEP("Date.Arithmetic", r.retrieve)),
  o([s.ParamvalueProvider, d(0, f.PRE([new l("string"), new i(i.stdExp.date)], 0))], r, "retrieve", 1);
var a = r;
export { a as DATE_Arithmetic };
