import { a as i } from "./chunk-MUWAMKOD.js";
import { i as o } from "./chunk-RS4WWU7K.js";
var n = class n extends i {
  constructor(e) {
    super();
    this.expression = e;
  }
  static checkAlgorithm(e, t) {
    return t.test(e) ? !0 : `Value has to comply to regular expression "${t}"`;
  }
  static PRE(e, t = void 0, r = "WaXCode.DBC") {
    return i.decPrecondition((s, a, d, p) => n.checkAlgorithm(s, e), r, t);
  }
  static POST(e, t = void 0, r = "WaXCode.DBC") {
    return i.decPostcondition((s, a, d) => n.checkAlgorithm(s, e), r, t);
  }
  static INVARIANT(e, t = void 0, r = "WaXCode.DBC") {
    return i.decInvariant([new n(e)], t, r);
  }
  check(e) {
    return n.checkAlgorithm(e, this.expression);
  }
  static check(e, t) {
    let r = n.checkAlgorithm(e, t);
    if (typeof r == "string") throw new i.Infringement(r);
  }
};
o(n, "stdExp", {
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
});
var c = n;
export { c as a };
