import { a as D } from "./chunk-K6S6E7GX.js";
import { a as E } from "./chunk-BGFHKOW7.js";
import { a as k } from "./chunk-K6ISRTTP.js";
import { a as A } from "./chunk-K3A632J4.js";
import { a as b } from "./chunk-W23DHSE2.js";
import { a as y } from "./chunk-MUWAMKOD.js";
import { f as w, g as f, h, o as l } from "./chunk-RS4WWU7K.js";
var g = w(b(), 1);
var M = w(b(), 1);
var u = class u {
  static retrieve(e) {
    let r,
      s = new Array();
    return new Promise((n, d) => {
      let i = e[0] === "" || e[0].toLowerCase() === "and" ? "%26" : e[0].toLowerCase() === "or" ? "|" : "%26",
        t = e[1].split("|"),
        o = e.length > 3 ? e[3] : window.codbiSettings.LDAP.URL;
      o === "" && d(new k("[[ LDAP.Find ] No LDAP-URL specified neither via parameter nor via CodBi Settings. ]"));
      for (let a = t.length - 1; a < 9; a++) t.push(t[t.length - 1]);
      (t = t.map((a) => a.replace("=", "%3D").trim())),
        r && r.abort(),
        (r = (0, M.getJQuery)()
          .ajax(`${o}&queryParameter=${i},${t.join(",")}`)
          .done((a) => {
            s.indexOf(r) === -1 && n(a);
          }));
    });
  }
};
(u.registered = window.codbi.registerEP("LDAP.Find", u.retrieve)),
  f([y.ParamvalueProvider, h(0, D.PRE(new A("string")))], u, "retrieve", 1);
var p = u;
var c = class c {
  static functionality(e, r) {
    r.addEventListener("blur", (i) =>
      l(this, null, function* () {
        let t = ["AND", `${e.property}=${r.value}`];
        e.url && t.push(e.url),
          (yield p.retrieve(t)).length === 0
            ? (0, g.getJQuery)()(r).error(
                e.msgnotinldap ? e.msgnotinldap : "Only values that're present in the Active Directory are permitted.",
              )
            : (document.activeElement !== n && n.remove(), (0, g.getJQuery)()(r).error(""));
      }),
    );
    let s = !1,
      n = document.createElement("select");
    n.classList.add("---CodBi", "--LDAP_Autocomplete", "-Proposals"),
      n.setAttribute(
        "style",
        e.cssproposals
          ? e.cssproposals
          : "margin-top: .5em ; max-width: 100% ; border-color: darkorange ; border-radius: .5em ; box-shadow: 0 0 .5em darkorange ; color: green ; font-weight: bolder ; cursor: pointer;",
      );
    let d = () =>
      l(this, null, function* () {
        if (((r.value = n.value), n.remove(), r.codbiLDAPSetMatchListeners)) {
          let i = ["AND", `${e.property}=${n.value}`];
          e.url && i.push(e.url);
          let t = yield p.retrieve(i);
          for (let o of r.codbiLDAPSetMatchListeners) o(t, r);
        }
      });
    n.addEventListener("change", (i) =>
      l(this, null, function* () {
        d();
      }),
    ),
      n.addEventListener("keydown", (i) =>
        l(this, null, function* () {
          (i.key === "Enter" || i.key === "Space") && d();
        }),
      ),
      r.addEventListener("keydown", (i) =>
        l(this, null, function* () {
          s && (i.stopPropagation(), i.preventDefault(), i.stopImmediatePropagation());
          let t = E.tsCheck(i, KeyboardEvent).key;
          if (t.length !== 1 && t !== "Backspace" && t !== "Delete") return;
          let o = ["AND", `${e.property}=${r.value}${t.length === 1 ? t : ""}`];
          e.url && o.push(e.url);
          let a = C(yield p.retrieve(o), e.property);
          if (a.length === 1) {
            if (((r.value = a[0][e.property]), (s = !0), n.remove(), r.codbiLDAPSetMatchListeners))
              for (let m of r.codbiLDAPSetMatchListeners) m(a, r);
            setTimeout(() => {
              s = !1;
            }, 500);
          }
          if (a.length > 1) {
            n.innerHTML = "";
            for (let m of a) n.options.add(new Option(m[e.property], m[e.property]));
            r.parentElement.appendChild(n);
          }
        }),
      );
  }
};
(c.registered = window.codbi.registerFunctionality("LDAP.Autocomplete", c.functionality)),
  f([y.ParamvalueProvider], c, "functionality", 1);
var S = c;
function C(v, e = void 0) {
  if (e) {
    let r = new Map();
    for (let s of v) {
      let n = s[e];
      r.has(n) || r.set(n, s);
    }
    return Array.from(r.values());
  } else return [...new Set(v)];
}
export { S as a, C as b };
