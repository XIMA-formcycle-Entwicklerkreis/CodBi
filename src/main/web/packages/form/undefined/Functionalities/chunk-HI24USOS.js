import { p as o } from "./chunk-UTJJRBTX.js";
var u = class d extends o {
  constructor(e) {
    super();
    this.conditions = e;
  }
  static checkAlgorithm(e, r) {
    let t = "";
    for (let n = 0; n < e.length; n++) {
      let i = e[n].check(r);
      if (typeof i == "string") t += `${i}${n === e.length - 1 ? "" : " or "}`;
      else return !0;
    }
    return t;
  }
  static PRE(e, r = void 0, t = void 0, n = void 0) {
    return o.decPrecondition((i, c, s, f) => d.checkAlgorithm(e, i), n, r, t);
  }
  static POST(e, r = void 0, t = void 0, n = void 0) {
    return o.decPostcondition((i, c, s) => d.checkAlgorithm(e, i), n, r, t);
  }
  static INVARIANT(e, r = void 0, t = void 0, n = void 0) {
    return o.decInvariant([new d(e)], r, n, t);
  }
  check(e) {
    return d.checkAlgorithm(this.conditions, e);
  }
  static tsCheck(e, r, t = void 0, n = void 0) {
    let i = d.checkAlgorithm(r, e);
    if (i) return e;
    throw new o.Infringement(`${n ? `(${n}) ` : ""}${i}${t ? ` \u2728 ${t} \u2728` : ""}`);
  }
};
export { u as a };
