import { a as n } from "./chunk-UZQUFYYL.js";
import "./chunk-W23DHSE2.js";
import "./chunk-MUWAMKOD.js";
import "./chunk-RS4WWU7K.js";
var r = class r extends n {
  static get transformer() {
    return (t, e) => t.toLowerCase().replace(/(^|\s|-)(\S)/g, (a, i, s) => i + s.toUpperCase());
  }
  static functionality(t, e) {
    n.functionality(t, e, r.transformer);
  }
};
r.registered = window.codbi.registerFunctionality("HTML.Input.Trans.Capital", r.functionality);
var o = r;
export { o as HTML_Input_Trans_Capital };
