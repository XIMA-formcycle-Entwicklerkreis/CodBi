import { g as f } from "./chunk-WWJ6UWS7.js";
var s = class u extends f {
  constructor(e, n = !1, t = !1) {
    super();
    this.equivalent = e;
    this.equalityPermitted = n;
    this.invert = t;
  }
  static checkAlgorithm(e, n, t, r) {
    return t && !r && e < n
      ? `Value has to to be greater than or equal to "${n}"`
      : t && r && e > n
        ? `Value has to be less than or equal to "${n}"`
        : !t && !r && e <= n
          ? `Value has to to be greater than "${n}"`
          : !t && r && e >= n
            ? `Value has to be less than "${n}"`
            : !0;
  }
  static PRE(e, n = !1, t = !1, r = void 0, i = void 0, d = void 0) {
    return f.decPrecondition((a, o, g, h) => u.checkAlgorithm(a, e, n, t), d, r, i);
  }
  static POST(e, n = !1, t = !1, r = void 0, i = void 0, d = void 0) {
    return f.decPostcondition((a, o, g) => u.checkAlgorithm(a, n, e, t), d, r, i);
  }
  static INVARIANT(e, n = !1, t = !1, r = void 0, i = void 0, d = void 0) {
    return f.decInvariant([new u(e, n, t)], d, r, i);
  }
  check(e) {
    return u.checkAlgorithm(e, this.equivalent, this.equalityPermitted, this.invert);
  }
};
var l = class extends s {
  constructor(e) {
    super(e, !1, !1);
    this.equivalent = e;
  }
  static PRE(e, n = !1, t = !1, r = void 0, i = void 0, d = void 0) {
    return s.PRE(e, !1, !1, i, r, d);
  }
  static POST(e, n = !1, t = !1, r = void 0, i = void 0, d = void 0) {
    return s.POST(e, !1, !1, i, r, d);
  }
  static INVARIANT(e, n = !1, t = !1, r = void 0, i = void 0, d = void 0) {
    return s.INVARIANT(e, !1, !1, i, r, d);
  }
};
export { l as a };
