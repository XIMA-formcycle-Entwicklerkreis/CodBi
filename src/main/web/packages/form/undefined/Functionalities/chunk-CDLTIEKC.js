import { p as d } from "./chunk-UTJJRBTX.js";
var o = class s extends d {
  constructor(e) {
    super();
    this.type = e;
  }
  static checkAlgorithm(e, r) {
    if (e == null) return !0;
    let t = r.split("|").map((u) => u.trim()),
      n = typeof e;
    return t.some((u) => n === u)
      ? !0
      : t.length === 1
        ? `Value has to to be of type "${r}" but is of type "${n}"`
        : `Value has to to be of type "${t.join(" | ")}" but is of type "${n}"`;
  }
  static PRE(e, r = void 0, t = void 0, n = void 0) {
    return d.decPrecondition((i, u, c, f) => s.checkAlgorithm(i, e), n, r, t);
  }
  static POST(e, r = void 0, t = void 0, n = void 0) {
    return d.decPostcondition((i, u, c) => s.checkAlgorithm(i, e), n, r, t);
  }
  static INVARIANT(e, r = void 0, t = void 0, n = void 0) {
    return d.decInvariant([new s(e)], r, n, t);
  }
  check(e) {
    return s.checkAlgorithm(e, this.type);
  }
  static tsCheck(e, r, t = void 0, n = void 0) {
    let i = s.checkAlgorithm(e, r);
    if (i === !0) return e;
    throw new d.Infringement(`${n ? `(${n}) ` : ""}${i}${t ? ` \u2728 ${t} \u2728` : ""}`);
  }
};
export { o as a };
