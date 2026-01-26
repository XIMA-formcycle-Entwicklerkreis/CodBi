import { a as d } from "./chunk-EEU2ZRMO.js";
import { a as e } from "./chunk-CVDXS2Z7.js";
import { a as n } from "./chunk-PR6DYHSM.js";
import { a as i } from "./chunk-TNKBSIBG.js";
import { b as c, c as t, d as o } from "./chunk-REJDLPRJ.js";
var m = c(d(), 1);
var r = class r {
  static retrieve(a) {
    return new Promise((u) => {
      (0, m.getJQuery)()
        .get(a[0])
        .done((p) => {
          u([p]);
        });
    });
  }
};
(r.registered = window.codbi.registerEP("Net.URL", r.retrieve)),
  t([i.ParamvalueProvider, o(0, n.PRE(new e(e.stdExp.url)))], r, "retrieve", 1);
var s = r;
export { s as NET_URL };
