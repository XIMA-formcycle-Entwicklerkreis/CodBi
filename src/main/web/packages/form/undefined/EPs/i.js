import { a as n } from "./chunk-XMOSKO55.js";
import "./chunk-EEU2ZRMO.js";
import { a as t } from "./chunk-CVDXS2Z7.js";
import { a as s } from "./chunk-TNKBSIBG.js";
import { c as i, d as o } from "./chunk-REJDLPRJ.js";
var e = class e {
  static retrieve(r) {
    if (!Array.isArray(r[1])) {
      if (Number.parseInt(r[0].trim()) !== 0)
        throw new n(`The second parameter of I must be an array but is of type ${typeof r[1]}.`);
      return r[1];
    }
    return r[1][Number.parseInt(r[0].trim())];
  }
};
(e.registered = window.codbi.registerEP("I", e.retrieve)),
  i([s.ParamvalueProvider, o(0, t.PRE(t.stdExp.cssSelector))], e, "retrieve", 1);
var u = e;
export { u as I };
