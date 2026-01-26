import { a as c } from "./chunk-Y62HKEFT.js";
import { a as b } from "./chunk-W3SPBNH5.js";
import "./chunk-IZMXAPWV.js";
import "./chunk-XMOSKO55.js";
import { a as D } from "./chunk-EEU2ZRMO.js";
import "./chunk-PR6DYHSM.js";
import { a as h } from "./chunk-TNKBSIBG.js";
import { b as k, c as g, f as s } from "./chunk-REJDLPRJ.js";
var m = k(D(), 1);
var u = class u {
  static functionality(e, n) {
    n.addEventListener("blur", (r) =>
      s(this, null, function* () {
        let i = ["AND", `${e.property}=${n.value}`];
        e.url && i.push(e.url),
          (yield c.retrieve(i)).length === 0
            ? (0, m.getJQuery)()(n).error(
                e.msgnotinldap ? e.msgnotinldap : "Only values that're present in the Active Directory are permitted.",
              )
            : (document.activeElement !== t && t.remove(), (0, m.getJQuery)()(n).error(""));
      }),
    );
    let a = !1,
      t = document.createElement("select");
    t.classList.add("---CodBi", "--LDAP_Autocomplete", "-Proposals"),
      t.setAttribute(
        "style",
        e.cssproposals
          ? e.cssproposals
          : "margin-top: .5em ; max-width: 100% ; border-color: darkorange ; border-radius: .5em ; box-shadow: 0 0 .5em darkorange ; color: green ; font-weight: bolder ; cursor: pointer;",
      );
    let v = () =>
      s(this, null, function* () {
        if (((n.value = t.value), t.remove(), n.codbiLDAPSetMatchListeners)) {
          let r = ["AND", `${e.property}=${t.value}`];
          e.url && r.push(e.url);
          let i = yield c.retrieve(r);
          for (let l of n.codbiLDAPSetMatchListeners) l(i, n);
        }
      });
    t.addEventListener("change", (r) =>
      s(this, null, function* () {
        v();
      }),
    ),
      t.addEventListener("keydown", (r) =>
        s(this, null, function* () {
          (r.key === "Enter" || r.key === "Space") && v();
        }),
      ),
      n.addEventListener("keydown", (r) =>
        s(this, null, function* () {
          a && (r.stopPropagation(), r.preventDefault(), r.stopImmediatePropagation());
          let i = b.tsCheck(r, KeyboardEvent).key;
          if (i.length !== 1 && i !== "Backspace" && i !== "Delete") return;
          let l = ["AND", `${e.property}=${n.value}${i.length === 1 ? i : ""}`];
          e.url && l.push(e.url);
          let p = d(yield c.retrieve(l), e.property);
          if (p.length === 1) {
            if (((n.value = p[0][e.property]), (a = !0), t.remove(), n.codbiLDAPSetMatchListeners))
              for (let o of n.codbiLDAPSetMatchListeners) o(p, n);
            setTimeout(() => {
              a = !1;
            }, 500);
          }
          if (p.length > 1) {
            t.innerHTML = "";
            for (let o of p) t.options.add(new Option(o[e.property], o[e.property]));
            n.parentElement.appendChild(t);
          }
        }),
      );
  }
};
(u.registered = window.codbi.registerFunctionality("LDAP.Autocomplete", u.functionality)),
  g([h.ParamvalueProvider], u, "functionality", 1);
var w = u;
function d(y, e = void 0) {
  if (e) {
    let n = new Map();
    for (let a of y) {
      let t = a[e];
      n.has(t) || n.set(t, a);
    }
    return Array.from(n.values());
  } else return [...new Set(y)];
}
var f = class f {
  static retrieve(e) {
    return e.length === 1 ? d(e[0]) : d(e[0], e[1]);
  }
};
f.registered = window.codbi.registerEP("Unique", f.retrieve);
var E = f;
export { E as Unique };
