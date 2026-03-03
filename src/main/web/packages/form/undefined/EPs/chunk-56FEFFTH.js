import { a as P } from "./chunk-HK3DXGDG.js";
import { a as o } from "./chunk-JDZ7GIHA.js";
import { a as E } from "./chunk-SBHCT576.js";
import { a as l } from "./chunk-ZAZUS2LA.js";
import { a as D } from "./chunk-HV3SPSHE.js";
import { a as u } from "./chunk-BQCZFAYZ.js";
import { a as f } from "./chunk-PN2FQ2K5.js";
import { a as i } from "./chunk-2NFNCZZA.js";
import { b as h, c as w, d as t, g as a } from "./chunk-WWJ6UWS7.js";
var p = h(D(), 1);
var s = class {
  static retrieve(r) {
    let d,
      g = new Array();
    return new Promise((c, R) => {
      let A = r[0] === "" || r[0].toLowerCase() === "and" ? "%26" : r[0].toLowerCase() === "or" ? "|" : "%26",
        e = r[1].split("|"),
        m = r.length > 3 ? r[3] : window.codbiSettings.LDAP.URL;
      m === "" && R(new E("[[ LDAP.Find ] No LDAP-URL specified neither via parameter nor via CodBi Settings. ]"));
      for (let n = e.length - 1; n < 9; n++) e.push(e[e.length - 1]);
      (e = e.map((n) => n.replace("=", "%3D").trim())),
        d && d.abort(),
        (d = (0, p.getJQuery)()
          .ajax(`${m}&queryParameter=${A},${e.join(",")}`)
          .done((n) => {
            g.indexOf(d) === -1 && c(n);
          }));
    });
  }
};
w(
  [
    a.ParamvalueProvider,
    t(0, u.PRE(2, !0, !1, "length", "Haven't at least the mode and the LDAP-Conditions been specified?")),
    t(0, i.PRE(new f("string"))),
    t(0, i.PRE(new o(/(AND|OR)/i), 0)),
    t(0, i.PRE(new o(/^\w+\s*=\s*\w+(?:\s*\|\s*\w+\s*=\s*\w+)*$/), 1)),
    t(0, i.PRE(new P(new l(), new o(o.stdExp.url)), 3)),
  ],
  s,
  "retrieve",
  1,
);
window.codbi.registerEP("LDAP.Find", s.retrieve.bind(s));
export { s as a };
