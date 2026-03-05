import { a as m } from "./chunk-BQCZFAYZ.js";
import { a as f } from "./chunk-PN2FQ2K5.js";
import { a as s } from "./chunk-2NFNCZZA.js";
import { c as o, d as i, g as n } from "./chunk-WWJ6UWS7.js";
var r = class {
  static retrieve(p) {
    let e = new Array();
    for (let t of p)
      if (typeof t == "string") for (let c of t.split(",")) e.push(c);
      else e.push(t);
    return e;
  }
};
o(
  [
    n.ParamvalueProvider,
    i(0, m.PRE(1, !0, !1, "length", "Has the CSV-String to convert been specified?")),
    i(0, s.PRE([new f("string | object")])),
  ],
  r,
  "retrieve",
  1,
);
window.codbi.registerEP("Data.CSV", r.retrieve.bind(r));
export { r as Data_CSV };
