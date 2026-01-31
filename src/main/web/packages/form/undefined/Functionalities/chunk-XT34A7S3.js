import { a as $ } from "./chunk-GMUP5R3V.js";
import { a as k } from "./chunk-ONGW6AHM.js";
import { a as C } from "./chunk-Z4CD6GEQ.js";
import { a as S } from "./chunk-44M63ONX.js";
import { a as E, c as f } from "./chunk-VUZWPKAH.js";
import { a as D } from "./chunk-W23DHSE2.js";
import { a as m } from "./chunk-YVPD7VIJ.js";
import { f as w, g as b, h as A, o as l } from "./chunk-RS4WWU7K.js";
var g = w(D(), 1);
var P = w(D(), 1);
var u = class u {
  static retrieve(e) {
    let r,
      o = new Array();
    return new Promise((t, c) => {
      let i = e[0] === "" || e[0].toLowerCase() === "and" ? "%26" : e[0].toLowerCase() === "or" ? "|" : "%26",
        n = e[1].split("|"),
        s = e.length > 3 ? e[3] : window.codbiSettings.LDAP.URL;
      s === "" && c(new C("[[ LDAP.Find ] No LDAP-URL specified neither via parameter nor via CodBi Settings. ]"));
      for (let a = n.length - 1; a < 9; a++) n.push(n[n.length - 1]);
      (n = n.map((a) => a.replace("=", "%3D").trim())),
        r && r.abort(),
        (r = (0, P.getJQuery)()
          .ajax(`${s}&queryParameter=${i},${n.join(",")}`)
          .done((a) => {
            o.indexOf(r) === -1 && t(a);
          }));
    });
  }
};
(u.registered = window.codbi.registerEP("LDAP.Find", u.retrieve)),
  b([m.ParamvalueProvider, A(0, $.PRE(new S("string")))], u, "retrieve", 1);
var p = u;
var x,
  y = class y {
    static functionality(e, r) {
      r.addEventListener("blur", (i) =>
        l(this, null, function* () {
          let n = ["AND", `${e.property}=${r.value}`];
          e.url && n.push(e.url),
            (yield p.retrieve(n)).length === 0
              ? (0, g.getJQuery)()(r).error(
                  e.msgnotinldap
                    ? e.msgnotinldap
                    : "Only values that're present in the Active Directory are permitted.",
                )
              : (document.activeElement !== t && t.remove(), (0, g.getJQuery)()(r).error(""));
        }),
      );
      let o = !1,
        t = document.createElement("select");
      t.classList.add("---CodBi", "--LDAP_Autocomplete", "-Proposals"),
        t.setAttribute(
          "style",
          e.cssproposals
            ? e.cssproposals
            : "margin-top: .5em ; max-width: 100% ; border-color: darkorange ; border-radius: .5em ; box-shadow: 0 0 .5em darkorange ; color: green ; font-weight: bolder ; cursor: pointer;",
        );
      let c = () =>
        l(this, null, function* () {
          if (((r.value = t.value), t.remove(), r.codbiLDAPSetMatchListeners)) {
            let i = ["AND", `${e.property}=${t.value}`];
            e.url && i.push(e.url);
            let n = yield p.retrieve(i);
            for (let s of r.codbiLDAPSetMatchListeners) s(n, r);
          }
        });
      t.addEventListener("change", (i) =>
        l(this, null, function* () {
          c();
        }),
      ),
        t.addEventListener("keydown", (i) =>
          l(this, null, function* () {
            (i.key === "Enter" || i.key === "Space") && c();
          }),
        ),
        r.addEventListener("keydown", (i) =>
          l(this, null, function* () {
            o && (i.stopPropagation(), i.preventDefault(), i.stopImmediatePropagation());
            let n = k.tsCheck(i, KeyboardEvent).key;
            if (n.length !== 1 && n !== "Backspace" && n !== "Delete") return;
            let s = ["AND", `${e.property}=${r.value}${n.length === 1 ? n : ""}`];
            e.url && s.push(e.url);
            let a = R(yield p.retrieve(s), e.property);
            if (a.length === 1) {
              if (((r.value = a[0][e.property]), (o = !0), t.remove(), r.codbiLDAPSetMatchListeners))
                for (let d of r.codbiLDAPSetMatchListeners) d(a, r);
              setTimeout(() => {
                o = !1;
              }, 500);
            }
            if (a.length > 1) {
              t.innerHTML = "";
              for (let d of a) t.options.add(new Option(d[e.property], d[e.property]));
              r.parentElement.appendChild(t);
            }
          }),
        );
    }
  };
y.registered = window.codbi.registerFunctionality("LDAP.Autocomplete", y.functionality);
var v = y;
E(
  [
    m.ParamvalueProvider,
    f("design:type", Function),
    f("design:paramtypes", [Object, typeof (x = typeof Element != "undefined" && Element) == "function" ? x : Object]),
    f("design:returntype", void 0),
  ],
  v,
  "functionality",
  null,
);
function R(h, e = void 0) {
  if (e) {
    let r = new Map();
    for (let o of h) {
      let t = o[e];
      r.has(t) || r.set(t, o);
    }
    return Array.from(r.values());
  } else return [...new Set(h)];
}
export { v as a, R as b };
