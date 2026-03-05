import { a as u } from "./chunk-DCP5OS4S.js";
import { a as y } from "./chunk-7ZUEWSHL.js";
import { a as p } from "./chunk-M2SNI3IN.js";
import "./chunk-4JLAI42Q.js";
import { a } from "./chunk-KEJSWGMR.js";
import { a as s } from "./chunk-SEUS6MHP.js";
import { a as i } from "./chunk-CDLTIEKC.js";
import { g, h as e, p as l } from "./chunk-UTJJRBTX.js";
var t = class {
  static functionality(n, r) {
    if ((n.placeholder === void 0 && (n.placeholder = "[[INJECTOR_REPLACEMENT]]"), typeof r[n.property] != "string"))
      throw new u(`The tagged element's "${n.property}" is a not of type "string"`);
    if (n.placeholder !== void 0 && typeof n.placeholder == "string" && typeof r[n.property] == "string")
      for (; r[n.property].indexOf(n.placeholder) !== -1; )
        r[n.property] = r[n.property].replace(n.placeholder, n.replacement);
    else typeof r[n.property] == "string" && (r[n.property] = r[n.property] + n.replacement);
  }
};
g(
  [
    l.ParamvalueProvider,
    e(0, i.PRE("string", "placeholder")),
    e(0, p.PRE(new i("object"), new a(Array), "replacement")),
    e(0, p.PRE(new i("object"), new i("string"), "replacement", !0)),
    e(0, y.PRE("replacement")),
    e(0, s.PRE(s.stdExp.property, "property")),
    e(1, a.PRE(HTMLElement, void 0, "Is it not an Element that is tagged with this functionality?")),
  ],
  t,
  "functionality",
  1,
);
window.codbi.registerFunctionality("HTML.Text.Injector", t.functionality.bind(t));
export { t as HTML_Text_Injector };
