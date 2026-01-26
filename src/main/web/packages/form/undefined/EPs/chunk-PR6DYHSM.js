import { a as u } from "./chunk-TNKBSIBG.js";
var a = class i extends u {
  constructor(t, n = void 0, e = void 0) {
    super();
    this.conditions = t;
    this.index = n;
    this.idxEnd = e;
  }
  static checkAlgorithm(t, n, e, o) {
    if (Array.isArray(n)) {
      if (e !== void 0 && o === void 0) {
        if (e > -1 && e < n.length) {
          let r = t.check(n[e]);
          if (typeof r == "string") return `Violating-Arrayelement at index "${e}" with value "${n[e]}". ${r}`;
        }
        return !0;
      }
      let c = o !== void 0 && o !== -1 ? o + 1 : n.length;
      for (let r = e || 0; r < c; r++) {
        let d = t.check(n[r]);
        if (d !== !0) return `Violating-Arrayelement at index ${r}. ${d}`;
      }
    } else return t.check(n);
    return !0;
  }
  static PRE(t, n = void 0, e = void 0, o = void 0, c = "WaXCode.DBC") {
    return u.decPrecondition(
      (r, d, l, f) => {
        if (Array.isArray(t))
          for (let s of t) {
            let h = i.checkAlgorithm(s, r, n, e);
            if (typeof h != "boolean") return h;
          }
        else return i.checkAlgorithm(t, r, n, e);
        return !0;
      },
      c,
      o,
    );
  }
  static POST(t, n = void 0, e = void 0, o = void 0, c = "WaXCode.DBC") {
    return u.decPostcondition(
      (r, d, l) => {
        if (Array.isArray(t))
          for (let f of t) {
            let s = i.checkAlgorithm(f, r, n, e);
            if (typeof s != "boolean") return s;
          }
        else return i.checkAlgorithm(t, r, n, e);
        return !0;
      },
      c,
      o,
    );
  }
  static INVARIANT(t, n = void 0, e = void 0, o = void 0, c = "WaXCode.DBC") {
    return u.decInvariant([new i(t, n, e)], o, c);
  }
  check(t) {
    if (Array.isArray(this.conditions))
      for (let n of this.conditions) {
        let e = i.checkAlgorithm(n, t, this.index, this.idxEnd);
        if (typeof e != "boolean") return e;
      }
    else return i.checkAlgorithm(this.conditions, t, this.index, this.idxEnd);
    return !0;
  }
};
export { a };
