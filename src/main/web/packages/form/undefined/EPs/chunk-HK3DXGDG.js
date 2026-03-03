import { g as i } from "./chunk-WWJ6UWS7.js";
var l = class d extends i {
  constructor(e, n, t = !1) {
    super();
    this.condition = e;
    this.inCase = n;
    this.invert = t;
  }
  static checkAlgorithm(e, n, t, o) {
    return o && !n.check(e) && !t.check(e)
      ? `In case that the value complies to "${n}" it also has to comply to "${t}"`
      : !o && n.check(e) && !t.check(e)
        ? `In case that the value does not comply to "${n}" it has to comply to "${t}"`
        : !0;
  }
  static PRE(e, n, t = void 0, o = !1, c = void 0, r = void 0) {
    return i.decPrecondition((u, s, a, b) => d.checkAlgorithm(u, e, n, o), r, t, c);
  }
  static POST(e, n, t = void 0, o = !1, c = void 0, r = void 0) {
    return i.decPostcondition((u, s, a) => d.checkAlgorithm(u, e, n, o), r, t, c);
  }
  static INVARIANT(e, n, t = void 0, o = !1, c = void 0, r = void 0) {
    return i.decInvariant([new d(e, n, o)], t, r, c);
  }
  check(e) {
    return d.checkAlgorithm(e, this.condition, this.inCase, this.invert);
  }
};
export { l as a };
