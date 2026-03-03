import { g as u } from "./chunk-WWJ6UWS7.js";
var a = class c extends u {
  constructor(t, n = void 0, e = void 0) {
    super();
    this.conditions = t;
    this.index = n;
    this.idxEnd = e;
  }
  static checkAlgorithm(t, n, e, i) {
    if (Array.isArray(n)) {
      if (e !== void 0 && i === void 0) {
        if (e > -1 && e < n.length) {
          let r = t.check(n[e]);
          if (typeof r == "string") return `Violating-Arrayelement at index "${e}" with value "${n[e]}". ${r}`;
        }
        return !0;
      }
      let d = i !== void 0 && i !== -1 ? i + 1 : n.length;
      for (let r = e || 0; r < d; r++) {
        let o = t.check(n[r]);
        if (o !== !0) return `Violating-Arrayelement at index ${r}. ${o}`;
      }
    } else return t.check(n);
    return !0;
  }
  static PRE(t, n = void 0, e = void 0, i = void 0, d = void 0, r = void 0) {
    return u.decPrecondition(
      (o, l, b, f) => {
        if (Array.isArray(t))
          for (let s of t) {
            let h = c.checkAlgorithm(s, o, n, e);
            if (typeof h != "boolean") return h;
          }
        else return c.checkAlgorithm(t, o, n, e);
        return !0;
      },
      r,
      i,
      d,
    );
  }
  static POST(t, n = void 0, e = void 0, i = void 0, d = void 0, r = void 0) {
    return u.decPostcondition(
      (o, l, b) => {
        if (Array.isArray(t))
          for (let f of t) {
            let s = c.checkAlgorithm(f, o, n, e);
            if (typeof s != "boolean") return s;
          }
        else return c.checkAlgorithm(t, o, n, e);
        return !0;
      },
      r,
      i,
      d,
    );
  }
  static INVARIANT(t, n = void 0, e = void 0, i = void 0, d = void 0, r = void 0) {
    return u.decInvariant([new c(t, n, e)], i, r, d);
  }
  check(t) {
    if (Array.isArray(this.conditions))
      for (let n of this.conditions) {
        let e = c.checkAlgorithm(n, t, this.index, this.idxEnd);
        if (typeof e != "boolean") return e;
      }
    else return c.checkAlgorithm(this.conditions, t, this.index, this.idxEnd);
    return !0;
  }
};
export { a };
