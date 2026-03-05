import { p as u } from "./chunk-UTJJRBTX.js";
var c = class i extends u {
  constructor(e) {
    super();
    this.reference = e;
  }
  static checkAlgorithm(e, ...t) {
    if (e == null) return !0;
    for (let n of t) if (e instanceof n) return !0;
    return `Value has to be an instance of "${t.map((n) => n.name || n).join(", ")}" but is of type "${typeof e}"`;
  }
  static PRE(e, t = void 0, n = void 0, r = void 0) {
    return u.decPrecondition((d, s, o, f) => i.checkAlgorithm(d, e), r, t, n);
  }
  static POST(e, t = void 0, n = void 0, r = void 0) {
    return u.decPostcondition((d, s, o) => i.checkAlgorithm(d, e), r, t, n);
  }
  static INVARIANT(e, t = void 0, n = void 0, r = void 0) {
    return u.decInvariant([new i(e)], t, r, n);
  }
  check(e) {
    return i.checkAlgorithm(e, this.reference);
  }
  static tsCheck(e, t, n = void 0, r = void 0) {
    return i.tsCheckMulti(e, [t], n, r);
  }
  static tsCheckMulti(e, t, n = void 0, r = void 0) {
    let d = i.checkAlgorithm(e, ...t);
    if (d === !0) return e;
    throw new u.Infringement(`${r ? `(${r}) ` : ""}${d} ${n ? `\u2728 ${n} \u2728` : ""}`);
  }
};
export { c as a };
