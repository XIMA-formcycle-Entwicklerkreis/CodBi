import { a as r } from "./chunk-VGUXA7EO.js";
import "./chunk-4JLAI42Q.js";
import "./chunk-UTJJRBTX.js";
var t = class i extends r {
  static get transformer() {
    return (n, e) => n.toLowerCase().replace(/(^|\s|-)(\S)/g, (a, o, s) => o + s.toUpperCase());
  }
  static functionality(n, e) {
    r.functionality(n, e, i.transformer);
  }
};
window.codbi.registerFunctionality("HTML.Input.Trans.Capital", t.functionality.bind(t));
export { t as HTML_Input_Trans_Capital };
