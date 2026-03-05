import { a as d } from "./chunk-HK3DXGDG.js";
import { a as m } from "./chunk-RQ2OISH5.js";
import { a as f } from "./chunk-44HOFY3R.js";
import { a as s } from "./chunk-CTQLZ4AL.js";
import { a as i } from "./chunk-JDZ7GIHA.js";
import "./chunk-HV3SPSHE.js";
import { a as w } from "./chunk-BQCZFAYZ.js";
import { a as o } from "./chunk-PN2FQ2K5.js";
import { a as t } from "./chunk-2NFNCZZA.js";
import { c as E, d as r, g as l } from "./chunk-WWJ6UWS7.js";
var n = class extends m {
  static retrieve(e) {
    return m.retrieve([
      e[0],
      "Localities",
      "",
      "",
      `name-${e[1].replace(/^/, "\xB0")}`,
      e.length >= 3 ? `postalCode-${e[2].replace(/^/, "\xB0")}` : "",
      "",
      "",
      "",
      e[3] ? e[3] : "",
      e[3] ? e[3] : "",
    ]);
  }
};
E(
  [
    l.ParamvalueProvider,
    r(0, w.PRE(1, !0, !1, "length", "Hasn't at least the Locality's or the Postalcode RegEx been specified?")),
    r(0, t.PRE(new o("string"), 0, 2)),
    r(0, t.PRE(new s([new f(""), new i(/(de|en|at|li|ch)/i)]), 0)),
    r(0, t.PRE(new o("string | number"), 3)),
    r(0, t.PRE(new d(new o("string"), new i(/^\d+$/)), 3)),
  ],
  n,
  "retrieve",
  1,
);
window.codbi.registerEP("OpenPLZ.Localities", n.retrieve.bind(n));
export { n as OpenPLZ_Localities };
