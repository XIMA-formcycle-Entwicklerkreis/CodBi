import { a as l } from "./chunk-IZMXAPWV.js";
import { a as n } from "./chunk-PR6DYHSM.js";
import { a as s } from "./chunk-TNKBSIBG.js";
import { c as i, d as o } from "./chunk-REJDLPRJ.js";
var r = class r {
  static retrieve(c) {
    let e = new Array();
    for (let t of c)
      if (typeof t == "string") for (let f of t.split(",")) e.push(f);
      else e.push(t);
    return e;
  }
};
(r.registered = window.codbi.registerEP("Data.CSV", r.retrieve)),
  i([s.ParamvalueProvider, o(0, n.PRE([new l("string")]))], r, "retrieve", 1);
var p = r;
export { p as Data_CSV };
