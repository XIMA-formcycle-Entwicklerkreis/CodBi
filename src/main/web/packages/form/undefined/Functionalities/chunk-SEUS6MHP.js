import { i as u, p as s } from "./chunk-UTJJRBTX.js";
var r = class r extends s {
  constructor(e) {
    super();
    this.expression = e;
  }
  static checkAlgorithm(e, n) {
    return e == null || n.test(e) ? !0 : `Value has to comply to regular expression "${n}"`;
  }
  static PRE(e, n = void 0, t = void 0, i = void 0) {
    return s.decPrecondition((d, o, a, p) => r.checkAlgorithm(d, e), i, n, t);
  }
  static POST(e, n = void 0, t = void 0, i = void 0) {
    return s.decPostcondition((d, o, a) => r.checkAlgorithm(d, e), i, n, t);
  }
  static INVARIANT(e, n = void 0, t = void 0, i = void 0) {
    return s.decInvariant([new r(e)], n, i, t);
  }
  check(e) {
    return r.checkAlgorithm(e, this.expression);
  }
  static tsCheck(e, n, t = void 0, i = void 0) {
    let d = r.checkAlgorithm(e, n);
    if (d) return e;
    throw new s.Infringement(`${i ? `(${i}) ` : ""}${d}${t ? ` \u2728 ${t} \u2728` : ""}`);
  }
  static check(e, n) {
    let t = r.checkAlgorithm(e, n);
    if (typeof t == "string") throw new s.Infringement(t);
  }
};
u(r, "stdExp", {
  htmlAttributeName: /^[a-zA-Z_:][a-zA-Z0-9_.:-]*$/,
  eMail: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i,
  property: /^[$_A-Za-z][$_A-Za-z0-9]*$/,
  url: /^(?:(?:http:|https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:localhost|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})(?::\d{2,5})?(?:\/(?:[\w\-\.]*\/)*[\w\-\.]+(?:\?\S*)?(?:#\S*)?)?$/i,
  keyPath: /^([a-zA-Z_$][a-zA-Z0-9_$]*\.)*[a-zA-Z_$][a-zA-Z0-9_$]*$/,
  date: /^\d{1,4}[.\/-]\d{1,2}[.\/-]\d{1,4}$/i,
  dateFormat:
    /^((D{1,2}[./-]M{1,2}[./-]Y{1,4})|(M{1,2}[./-]D{1,2}[./-]Y{1,4})|Y{1,4}[./-]D{1,2}[./-]M{1,2}|(Y{1,4}[./-]M{1,2}[./-]D{1,2}))$/i,
  cssSelector:
    /^(?:\*|#[\w-]+|\.[\w-]+|(?:[\w-]+|\*)(?::(?:[\w-]+(?:\([\w-]+\))?)+)?(?:\[(?:[\w-]+(?:(?:=|~=|\|=|\*=|\$=|\^=)\s*(?:"[^"]*"|'[^']*'|[\w-]+)\s*)?)?\])+|\[\s*[\w-]+\s*=\s*(?:"[^"]*"|'[^']*'|[\w-]+)\s*\])(?:,\s*(?:\*|#[\w-]+|\.[\w-]+|(?:[\w-]+|\*)(?::(?:[\w-]+(?:\([\w-]+\))?)+)?(?:\[(?:[\w-]+(?:(?:=|~=|\|=|\*=|\$=|\^=)\s*(?:"[^"]*"|'[^']*'|[\w-]+)\s*)?)?\])+|\[\s*[\w-]+\s*=\s*(?:"[^"]*"|'[^']*'|[\w-]+)\s*\]))*$/,
  boolean: /^(TRUE|FALSE)$/i,
});
var c = r;
export { c as a };
