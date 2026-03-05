import { a as e } from "./chunk-7ZUEWSHL.js";
import { a as E } from "./chunk-KEJSWGMR.js";
import { a as n } from "./chunk-SEUS6MHP.js";
import { a as s } from "./chunk-CDLTIEKC.js";
import { g as o, h as t, p as a } from "./chunk-UTJJRBTX.js";
var i = class {
  static functionality(r, p) {
    let m = r.path ? r.path.split(".").reduce((u, l) => u[l], p) : p;
    m[r.property] = r.toset;
  }
};
o(
  [
    a.ParamvalueProvider,
    t(0, e.PRE("path")),
    t(0, e.PRE("property")),
    t(0, e.PRE("toset")),
    t(0, n.PRE(n.stdExp.keyPath, "path")),
    t(0, s.PRE("string", "property")),
    t(0, n.PRE(n.stdExp.property, "property")),
    t(1, E.PRE(HTMLElement, void 0, "Is it not an HTML-Element that is tagged with this functionality?")),
  ],
  i,
  "functionality",
  1,
);
window.codbi.registerFunctionality("JSON.SET", i.functionality.bind(i));
export { i as JSON_SET };
