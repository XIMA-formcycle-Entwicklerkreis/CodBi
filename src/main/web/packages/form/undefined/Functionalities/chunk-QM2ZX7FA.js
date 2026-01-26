import { a as n } from "./chunk-MUWAMKOD.js";
var a = class i extends n {
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
    return n.decPrecondition((c, s, u, l) => i.checkAlgorithm(c, e, t), o, r);
  }
  static POST(e, t = !1, r = void 0, o = "WaXCode.DBC") {
    return n.decPostcondition((c, s, u) => i.checkAlgorithm(c, e, t), o, r);
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
export { a };
