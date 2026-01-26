import { a as i } from "./chunk-TNKBSIBG.js";
var s = class o extends i {
  constructor(e) {
    super();
    this.type = e;
  }
  static checkAlgorithm(e, t) {
    return typeof e !== t ? `Value has to to be of type "${t}" but is of type "${typeof e}"` : !0;
  }
  static PRE(e, t = void 0, r = "WaXCode.DBC") {
    return i.decPrecondition((n, c, u, a) => o.checkAlgorithm(n, e), r, t);
  }
  static POST(e, t = void 0, r = "WaXCode.DBC") {
    return i.decPostcondition((n, c, u) => o.checkAlgorithm(n, e), r, t);
  }
  static INVARIANT(e, t = void 0, r = "WaXCode.DBC") {
    return i.decInvariant([new o(e)], t, r);
  }
  check(e) {
    return o.checkAlgorithm(e, this.type);
  }
  static tsCheck(e, t, r = void 0, n = void 0) {
    let c = o.checkAlgorithm(e, t);
    if (c === !0) return e;
    throw new i.Infringement(`${r ? `(${r}) ` : ""}${c}${n ? ` < ${n} >` : ""}`);
  }
};
export { s as a };
