import { a as n } from "./chunk-RQ2OISH5.js";
import { a as c } from "./chunk-44HOFY3R.js";
import { a as f } from "./chunk-CTQLZ4AL.js";
import { a as E } from "./chunk-JDZ7GIHA.js";
import "./chunk-HV3SPSHE.js";
import { a as s } from "./chunk-BQCZFAYZ.js";
import { a as m } from "./chunk-PN2FQ2K5.js";
import { a as i } from "./chunk-2NFNCZZA.js";
import { c as o, d as t, g as l } from "./chunk-WWJ6UWS7.js";
var r = class extends n {
  static retrieve(e) {
    return n.retrieve([
      e[0] ? e[0] : "",
      "Streets",
      "",
      "",
      `name-${e[1].replace(/^/, "\xB0")}`,
      e.length >= 4 ? `locality-${e[3].replace(/^/, "\xB0")}` : `postalCode-${e[2].replace(/^/, "\xB0")}`,
      "",
      "",
      e[4] ? e[4] : "",
    ]);
  }
};
o(
  [
    l.ParamvalueProvider,
    t(0, s.PRE(2, !0, !1, "length", "Hasn't at least the Street and City RegEx been specified?")),
    t(0, i.PRE(new m("string"), 0, 4)),
    t(0, i.PRE(new f([new c(""), new E(/(de|en|at|li|ch)/i)]), 0)),
  ],
  r,
  "retrieve",
  1,
);
window.codbi.registerEP("OpenPLZ.Streets", r.retrieve.bind(r));
export { r as OpenPLZ_Streets };
