import { a as m } from "./chunk-4JLAI42Q.js";
import { f as u, g as o, p as a } from "./chunk-UTJJRBTX.js";
var s = u(m(), 1);
var t = class t {
  static get transformer() {
    return (n, r) => n;
  }
  static functionality(n, r, g = t.transformer) {
    let l = (0, s.getJQuery)();
    r.addEventListener("change", (e) => {
      e.target.value = g(e.target.value, n);
    });
  }
};
o([a.ParamvalueProvider], t, "functionality", 1);
var i = t;
export { i as a };
