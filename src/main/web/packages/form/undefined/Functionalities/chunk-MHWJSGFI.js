import { a as l } from "./chunk-W23DHSE2.js";
import { a as i } from "./chunk-YVPD7VIJ.js";
import { f as u, g as o } from "./chunk-RS4WWU7K.js";
var s = u(l(), 1);
var t = class t {
  static get transformer() {
    return console.log("standard transformer"), (n, r) => n;
  }
  static functionality(n, r, g = t.transformer) {
    let c = (0, s.getJQuery)();
    r.addEventListener("change", (e) => {
      e.target.value = g(e.target.value, n);
    });
  }
};
(t.registered = window.codbi.registerFunctionality("HTML.Input.Transformer", t.functionality)),
  o([i.ParamvalueProvider], t, "functionality", 1);
var a = t;
export { a };
