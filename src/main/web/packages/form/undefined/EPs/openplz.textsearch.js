import { a as f } from "./chunk-HK3DXGDG.js";
import { a as m } from "./chunk-RQ2OISH5.js";
import { a as l } from "./chunk-44HOFY3R.js";
import { a } from "./chunk-CTQLZ4AL.js";
import { a as o } from "./chunk-JDZ7GIHA.js";
import "./chunk-HV3SPSHE.js";
import { a as E } from "./chunk-BQCZFAYZ.js";
import { a as i } from "./chunk-PN2FQ2K5.js";
import { a as e } from "./chunk-2NFNCZZA.js";
import { c as s, d as r, g as w } from "./chunk-WWJ6UWS7.js";
var t = class extends m {
  static retrieve(n) {
    return m.retrieve([
      n[0],
      "FullTextSearch",
      "",
      "",
      `searchTerm-${n[1].replace(/ /, "+")}`,
      "",
      "",
      "",
      n[2] ? n[2] : "",
    ]);
  }
};
s(
  [
    w.ParamvalueProvider,
    r(0, E.PRE(1, !0, !1, "length", "Hasn't at least the RegEx to search with been specified?")),
    r(0, e.PRE(new i("string"), 0, 1)),
    r(0, e.PRE(new a([new l(""), new o(/(de|en|at|li|ch)/i)]), 0)),
    r(0, e.PRE(new i("string | number"), 2)),
    r(0, e.PRE(new f(new i("string"), new o(/^\d+$/)), 2)),
  ],
  t,
  "retrieve",
  1,
);
window.codbi.registerEP("OpenPLZ.TextSearch", t.retrieve.bind(t));
export { t as OpenPLZ_TextSearch };
