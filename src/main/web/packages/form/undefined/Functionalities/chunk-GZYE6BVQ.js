import { a as s } from "./chunk-YVPD7VIJ.js";
var a = class a extends s {
  static checkAlgorithm(t, e) {
    return e.test(t) ? !0 : `Value has to comply to regular expression "${e}"`;
  }
  static PRE(t, e = void 0, r = "WaXCode.DBC") {
    return s.decPrecondition((c, o, n, d) => a.checkAlgorithm(c, t), r, e);
  }
  static POST(t, e = void 0, r = "WaXCode.DBC") {
    return s.decPostcondition((c, o, n) => a.checkAlgorithm(c, t), r, e);
  }
  static INVARIANT(t, e = void 0, r = "WaXCode.DBC") {
    return s.decInvariant([new a(t)], e, r);
  }
  check(t) {
    return a.checkAlgorithm(t, this.expression);
  }
  constructor(t) {
    super(), (this.expression = t);
  }
  static check(t, e) {
    let r = a.checkAlgorithm(t, e);
    if (typeof r == "string") throw new s.Infringement(r);
  }
};
a.stdExp = {
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
};
var i = a;
export { i as a };
