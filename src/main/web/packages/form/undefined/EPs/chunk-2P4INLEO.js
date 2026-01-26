import { a as l } from "./chunk-TNKBSIBG.js";
var i = class n extends l {
  constructor(e, r = !1, a = !1) {
    super();
    this.equivalent = e;
    this.equalityPermitted = r;
    this.invert = a;
  }
  static checkAlgorithm(e, r, a, t) {
    return a && !t && e < r
      ? `Value has to to be greater than or equal to "${r}"`
      : a && t && e > r
        ? `Value has to be less than or equal to "${r}"`
        : !a && !t && e <= r
          ? `Value has to to be greater than "${r}"`
          : !a && t && e >= r
            ? `Value has to be less than "${r}"`
            : !0;
  }
  static PRE(e, r = !1, a = !1, t = void 0, s = "WaXCode.DBC") {
    return l.decPrecondition((o, c, d, h) => n.checkAlgorithm(o, e, r, a), s, t);
  }
  static POST(e, r = !1, a = !1, t = void 0, s = "WaXCode.DBC") {
    return l.decPostcondition((o, c, d) => n.checkAlgorithm(o, r, e, a), s, t);
  }
  static INVARIANT(e, r = !1, a = !1, t = void 0, s = "WaXCode.DBC") {
    return l.decInvariant([new n(e, r, a)], t, s);
  }
  check(e) {
    return n.checkAlgorithm(e, this.equivalent, this.equalityPermitted, this.invert);
  }
};
var u = class extends i {
  constructor(e) {
    super(e, !1, !1);
    this.equivalent = e;
  }
  static PRE(e, r = !1, a = !1, t = void 0, s = "WaXCode.DBC") {
    return i.PRE(e, !1, !1, t, s);
  }
  static POST(e, r = !1, a = !1, t = void 0, s = "WaXCode.DBC") {
    return i.POST(e, !1, !1, t, s);
  }
  static INVARIANT(e, r = !1, a = !1, t = void 0, s = "WaXCode.DBC") {
    return i.INVARIANT(e, !1, !1, t, s);
  }
};
export { u as a };
