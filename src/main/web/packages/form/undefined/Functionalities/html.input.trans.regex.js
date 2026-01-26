import { a as e } from "./chunk-UZQUFYYL.js";
import "./chunk-W23DHSE2.js";
import "./chunk-MUWAMKOD.js";
import "./chunk-RS4WWU7K.js";
var r = class r extends e {
  static get transformer() {
    return (n, t) => n.replace(t.extractor, t.replacements);
  }
  static functionality(n, t) {
    e.functionality(n, t, r.transformer);
  }
};
r.registered = window.codbi.registerFunctionality("HTML.Input.Trans.RegEx", r.functionality);
var i = r;
export { i as HTML_Input_Trans_RegEx };
