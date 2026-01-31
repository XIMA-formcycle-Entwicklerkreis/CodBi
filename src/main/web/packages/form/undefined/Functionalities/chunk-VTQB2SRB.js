import { a as l } from "./chunk-W23DHSE2.js";
import { a } from "./chunk-YVPD7VIJ.js";
import { f as u, g as o } from "./chunk-RS4WWU7K.js";
var i = u(l(), 1);
var t = class t {
  static get transformer() {
    return console.log("standard transformer"), (n, r) => n;
  }
  static functionality(n, r, g = t.transformer) {
    let m = (0, i.getJQuery)();
    r.addEventListener("change", (e) => {
      e.target.value = g(e.target.value, n);
    });
  }
};
o([a.ParamvalueProvider], t, "functionality", 1);
var s = t;
export { s as a };
