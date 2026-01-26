import { a as p } from "./chunk-K6ISRTTP.js";
import { a } from "./chunk-K3A632J4.js";
import { a as g } from "./chunk-QM2ZX7FA.js";
import "./chunk-W23DHSE2.js";
import { a as t } from "./chunk-MUWAMKOD.js";
import { g as s, h as i } from "./chunk-RS4WWU7K.js";
var e = class e {
  static functionality(n, r) {
    if ((n.placeholder === void 0 && (n.placeholder = "[[INJECTOR_REPLACEMENT]]"), typeof r[n.property] != "string"))
      throw new p(`The tagged element's "${n.property}" is a not of type "string"`);
    if (n.placeholder !== void 0 && typeof n.placeholder == "string" && typeof r[n.property] == "string")
      for (; r[n.property].indexOf(n.placeholder) !== -1; )
        r[n.property] = r[n.property].replace(n.placeholder, n.replacement);
    else typeof r[n.property] == "string" && (r[n.property] = r[n.property] + n.replacement);
  }
};
(e.registered = window.codbi.registerFunctionality("HTML.Text.Injector", e.functionality)),
  s(
    [t.ParamvalueProvider, i(0, g.PRE(null, !0, "replacement")), i(0, a.PRE("string", "property"))],
    e,
    "functionality",
    1,
  );
var l = e;
export { l as HTML_Text_Injector };
