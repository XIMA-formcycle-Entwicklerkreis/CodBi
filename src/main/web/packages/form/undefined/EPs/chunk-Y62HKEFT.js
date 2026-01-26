import { a as l } from "./chunk-IZMXAPWV.js";
import { a as c } from "./chunk-XMOSKO55.js";
import { a as v } from "./chunk-EEU2ZRMO.js";
import { a as d } from "./chunk-PR6DYHSM.js";
import { a as u } from "./chunk-TNKBSIBG.js";
import { b, c as s, d as a } from "./chunk-REJDLPRJ.js";
var m = b(v(), 1);
var t = class t {
  static retrieve(r) {
    let o,
      w = new Array();
    return new Promise((f, p) => {
      let P = r[0] === "" || r[0].toLowerCase() === "and" ? "%26" : r[0].toLowerCase() === "or" ? "|" : "%26",
        e = r[1].split("|"),
        n = r.length > 3 ? r[3] : window.codbiSettings.LDAP.URL;
      n === "" && p(new c("[[ LDAP.Find ] No LDAP-URL specified neither via parameter nor via CodBi Settings. ]"));
      for (let i = e.length - 1; i < 9; i++) e.push(e[e.length - 1]);
      (e = e.map((i) => i.replace("=", "%3D").trim())),
        o && o.abort(),
        (o = (0, m.getJQuery)()
          .ajax(`${n}&queryParameter=${P},${e.join(",")}`)
          .done((i) => {
            w.indexOf(o) === -1 && f(i);
          }));
    });
  }
};
(t.registered = window.codbi.registerEP("LDAP.Find", t.retrieve)),
  s([u.ParamvalueProvider, a(0, d.PRE(new l("string")))], t, "retrieve", 1);
var g = t;
export { g as a };
