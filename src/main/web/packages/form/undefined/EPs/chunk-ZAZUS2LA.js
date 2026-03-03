import { g as i } from "./chunk-WWJ6UWS7.js";
var s = class d extends i {
  static checkAlgorithm(e) {
    return e == null ? `Value may not be UNDEFINED or NULL but it is ${e === void 0 ? "UNDEFINED" : "NULL"}` : !0;
  }
  static PRE(e = void 0, n = void 0, t = void 0) {
    return i.decPrecondition((r, u, c, o) => d.checkAlgorithm(r), t, e, n);
  }
  static POST(e, n = void 0, t = void 0, r = void 0) {
    return i.decPostcondition((u, c, o) => d.checkAlgorithm(u), r, n, t);
  }
  static INVARIANT(e, n = void 0, t = void 0, r = void 0) {
    return i.decInvariant([new d()], n, r, t);
  }
  check(e) {
    return d.checkAlgorithm(e);
  }
  static tsCheck(e, n = void 0, t = void 0) {
    let r = d.checkAlgorithm(e);
    if (r === !0) return e;
    throw new i.Infringement(`${t ? `(${t}) ` : ""}${r}${n ? ` \u2728 ${n} \u2728` : ""}`);
  }
  constructor() {
    super();
  }
};
export { s as a };
