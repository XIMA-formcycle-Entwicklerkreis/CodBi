import { a as m } from "./chunk-IZMXAPWV.js";
import { a as f } from "./chunk-CVDXS2Z7.js";
import { a as p } from "./chunk-PR6DYHSM.js";
import { a as l } from "./chunk-TNKBSIBG.js";
import { c as n, d as o } from "./chunk-REJDLPRJ.js";
var a = class a {
  static retrieve(t) {
    var i;
    let e = new Date();
    return ((i = t[0]) == null ? void 0 : i.toLocaleUpperCase()) === "NOW" || t.length === 0 ? [new Date()] : [c(e, t)];
  }
};
(a.registered = window.codbi.registerEP("Date.Today", a.retrieve)),
  n([l.ParamvalueProvider, o(0, p.PRE([new m("string"), new f(/^(?i:(NOW)|([+-]\d+[dmy]))$/i)]))], a, "retrieve", 1);
var u = a;
function c(r, t) {
  for (let e of t)
    e.replace("+", ""),
      e.toLocaleLowerCase().indexOf("d") !== -1 && r.setDate(r.getDate() + Number.parseInt(e.replace("d", ""))),
      e.toLocaleLowerCase().indexOf("m") !== -1 && r.setMonth(r.getMonth() + Number.parseInt(e.replace("m", ""))),
      e.toLocaleLowerCase().indexOf("y") !== -1 && r.setFullYear(r.getFullYear() + Number.parseInt(e.replace("y", "")));
  return r;
}
export { u as a, c as b };
