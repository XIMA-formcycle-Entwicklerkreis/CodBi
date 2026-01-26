import { a as n } from "./chunk-JL2EL352.js";
import { a as s } from "./chunk-K3A632J4.js";
import { a as p } from "./chunk-MUWAMKOD.js";
import { g as a, h as i } from "./chunk-RS4WWU7K.js";
var t = class t {
  static functionality(r, e) {
    let u = r.path ? r.path.split(".").reduce((c, l) => c[l], e) : e;
    u[r.property] = r.toset;
  }
};
(t.registered = window.codbi.registerFunctionality("JSON.SET", t.functionality)),
  a(
    [p.ParamvalueProvider, i(0, n.PRE(n.stdExp.keyPath, "path")), i(0, s.PRE("string", "property"))],
    t,
    "functionality",
    1,
  );
var o = t;
export { o as JSON_SET };
