import { a as f } from "./chunk-BQCZFAYZ.js";
import { a as u } from "./chunk-PN2FQ2K5.js";
import { a as c } from "./chunk-2NFNCZZA.js";
import { c as i, d as e, g as s } from "./chunk-WWJ6UWS7.js";
var r = class {
  static retrieve(k) {
    let n = {};
    for (let o of k) for (let t in o) n[t] = o[t];
    return [n];
  }
};
i(
  [
    s.ParamvalueProvider,
    e(0, f.PRE(1, !0, !1, "length", "Weren't the objects to join specified?")),
    e(0, c.PRE([new u("object")])),
  ],
  r,
  "retrieve",
  1,
);
window.codbi.registerEP("Data.Join", r.retrieve.bind(r));
export { r as Data_Join };
