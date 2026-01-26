import { a as i } from "./chunk-TNKBSIBG.js";
var a = class c extends i {
  constructor(e) {
    super();
    this.reference = e;
  }
  static checkAlgorithm(e, t) {
    return e instanceof t ? !0 : `Value has to be an instance of "${t}" but is of type "${typeof e}"`;
  }
  static PRE(e, t = void 0, n = "WaXCode.DBC") {
    return i.decPrecondition((r, o, s, d) => c.checkAlgorithm(r, e), n, t);
  }
  static POST(e, t = void 0, n = "WaXCode.DBC") {
    return i.decPostcondition((r, o, s) => c.checkAlgorithm(r, e), n, t);
  }
  static INVARIANT(e, t = void 0, n = "WaXCode.DBC") {
    return i.decInvariant([new c(e)], t, n);
  }
  check(e) {
    return c.checkAlgorithm(e, this.reference);
  }
  static tsCheck(e, t, n = void 0, r = void 0) {
    let o = c.checkAlgorithm(e, t);
    if (o === !0) return e;
    throw new i.Infringement(`${n ? `(${n}) ` : ""}${o} ${r ? `< ${r} >` : ""}`);
  }
};
export { a };
