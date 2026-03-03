import { a as i } from "./chunk-VGUXA7EO.js";
import "./chunk-4JLAI42Q.js";
import "./chunk-UTJJRBTX.js";
var r = class e extends i {
  static get transformer() {
    return (t, n) => t.replace(n.extractor, n.replacements);
  }
  static functionality(t, n) {
    i.functionality(t, n, e.transformer);
  }
};
window.codbi.registerFunctionality("HTML.Input.Trans.RegEx", r.functionality.bind(r));
export { r as HTML_Input_Trans_RegEx };
