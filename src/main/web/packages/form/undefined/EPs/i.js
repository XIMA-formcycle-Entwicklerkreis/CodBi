import { a as u } from "./chunk-HK3DXGDG.js";
import { a as p } from "./chunk-CTQLZ4AL.js";
import { a as n } from "./chunk-JDZ7GIHA.js";
import { a as E } from "./chunk-SBHCT576.js";
import "./chunk-ZAZUS2LA.js";
import "./chunk-HV3SPSHE.js";
import { a as f } from "./chunk-BQCZFAYZ.js";
import { a as i } from "./chunk-PN2FQ2K5.js";
import { a as o } from "./chunk-2NFNCZZA.js";
import { c as m, d as t, g as s } from "./chunk-WWJ6UWS7.js";
var e = class {
  static retrieve(r) {
    if (!Array.isArray(r[1])) {
      if (Number.parseInt(r[0].trim()) !== 0)
        throw new E(`The second parameter of I must be an array but is of type ${typeof r[1]}.`);
      return r[1];
    }
    return r[1][Number.parseInt(r[0].trim())];
  }
};
m(
  [
    s.ParamvalueProvider,
    t(0, f.PRE(1, !0, !1, "length", "Hasn't the index to receive has been specified?")),
    t(0, o.PRE(new p([new i("string"), new i("number")]), 0)),
    t(0, o.PRE(new u(new i("string"), new n(n.stdExp.cssSelector)), 0)),
  ],
  e,
  "retrieve",
  1,
);
window.codbi.registerEP("I", e.retrieve.bind(e));
export { e as I };
