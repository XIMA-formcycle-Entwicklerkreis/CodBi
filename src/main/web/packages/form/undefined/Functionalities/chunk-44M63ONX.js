import { a as i } from "./chunk-YVPD7VIJ.js";
var u = class o extends i {
  constructor(t) {
    super();
    this.type = t;
  }
  static checkAlgorithm(t, r) {
    let e = r.split("|").map((c) => c.trim()),
      n = typeof t;
    return e.some((c) => n === c)
      ? !0
      : e.length === 1
        ? `Value has to to be of type "${r}" but is of type "${n}"`
        : `Value has to to be of type "${e.join(" | ")}" but is of type "${n}"`;
  }
  static PRE(t, r = void 0, e = "WaXCode.DBC") {
    return i.decPrecondition((n, s, c, d) => o.checkAlgorithm(n, t), e, r);
  }
  static POST(t, r = void 0, e = "WaXCode.DBC") {
    return i.decPostcondition((n, s, c) => o.checkAlgorithm(n, t), e, r);
  }
  static INVARIANT(t, r = void 0, e = "WaXCode.DBC") {
    return i.decInvariant([new o(t)], r, e);
  }
  check(t) {
    return o.checkAlgorithm(t, this.type);
  }
  static tsCheck(t, r, e = void 0, n = void 0) {
    let s = o.checkAlgorithm(t, r);
    if (s === !0) return t;
    throw new i.Infringement(`${n ? `(${n}) ` : ""}${s}${e ? ` < ${e} >` : ""}`);
  }
};
export { u as a };
