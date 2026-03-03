import { a as t } from "./chunk-JDZ7GIHA.js";
import { a as f } from "./chunk-HV3SPSHE.js";
import { a as m } from "./chunk-BQCZFAYZ.js";
import { a as n } from "./chunk-2NFNCZZA.js";
import { b as d, c as o, d as e, g as i } from "./chunk-WWJ6UWS7.js";
var s = d(f(), 1);
var r = class {
  static retrieve(a) {
    return new Promise((p) => {
      (0, s.getJQuery)()
        .get(a[0])
        .done((u) => {
          p([u]);
        });
    });
  }
};
o(
  [
    i.ParamvalueProvider,
    e(0, m.PRE(1, !0, !1, "length", "Hasn't a URL been specified?")),
    e(0, n.PRE(new t(t.stdExp.url))),
  ],
  r,
  "retrieve",
  1,
);
window.codbi.registerEP("Net.URL", r.retrieve.bind(r));
export { r as NET_URL };
