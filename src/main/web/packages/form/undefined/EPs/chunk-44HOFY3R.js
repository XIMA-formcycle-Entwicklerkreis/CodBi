import { g as r } from "./chunk-WWJ6UWS7.js";
var c = class i extends r {
  constructor(e, t = !1) {
    super();
    this.equivalent = e;
    this.invert = t;
  }
  static checkAlgorithm(e, t, n) {
    return !n && t !== e
      ? `Value has to to be equal to "${t}"`
      : n && t === e
        ? `Value must not to be equal to "${t}"`
        : !0;
  }
  static PRE(e, t = !1, n = void 0, d = void 0, u = void 0) {
    return r.decPrecondition((s, o, a, l) => i.checkAlgorithm(s, e, t), u, n, d);
  }
  static POST(e, t = !1, n = void 0, d = void 0, u = void 0) {
    return r.decPostcondition((s, o, a) => i.checkAlgorithm(s, e, t), u, n, d);
  }
  static INVARIANT(e, t = !1, n = void 0, d = void 0, u = void 0) {
    return r.decInvariant([new i(e, t)], n, u, d);
  }
  check(e) {
    return i.checkAlgorithm(e, this.equivalent, this.invert);
  }
  static tsCheck(e, t) {
    let n = i.checkAlgorithm(e, t, !1);
    if (n) return e;
    throw new r.Infringement(n);
  }
};
export { c as a };
