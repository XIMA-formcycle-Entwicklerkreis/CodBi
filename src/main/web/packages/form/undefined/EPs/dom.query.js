import { a as d } from "./chunk-PR6DYHSM.js";
import { a as n } from "./chunk-TNKBSIBG.js";
import { c as l } from "./chunk-REJDLPRJ.js";
var s = class i extends n {
  constructor(e, t = !1) {
    super();
    this.equivalent = e;
    this.invert = t;
  }
  static checkAlgorithm(e, t, r) {
    return !r && t !== e
      ? `Value has to to be equal to "${t}"`
      : r && t === e
        ? `Value must not to be equal to "${t}"`
        : !0;
  }
  static PRE(e, t = !1, r = void 0, o = "WaXCode.DBC") {
    return n.decPrecondition((a, m, b, g) => i.checkAlgorithm(a, e, t), o, r);
  }
  static POST(e, t = !1, r = void 0, o = "WaXCode.DBC") {
    return n.decPostcondition((a, m, b) => i.checkAlgorithm(a, e, t), o, r);
  }
  static INVARIANT(e, t = !1, r = void 0, o = "WaXCode.DBC") {
    return n.decInvariant([new i(e, t)], r, o);
  }
  check(e) {
    return i.checkAlgorithm(e, this.equivalent, this.invert);
  }
  static tsCheck(e, t) {
    let r = i.checkAlgorithm(e, t, !1);
    if (r) return e;
    throw new n.Infringement(r);
  }
};
var c = class c {
  static retrieve(u) {
    return [document.querySelector(u[0])];
  }
};
(c.registered = window.codbi.registerEP("DOM.Query", c.retrieve)), l([d.POST(new s(null, !0), 0)], c, "retrieve", 1);
var p = c;
export { p as DOM_Query };
