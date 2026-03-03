import { a as w } from "./chunk-56FEFFTH.js";
import "./chunk-HK3DXGDG.js";
import { a as M } from "./chunk-44HOFY3R.js";
import { a as m } from "./chunk-X7STRZ54.js";
import { a as s } from "./chunk-JDZ7GIHA.js";
import "./chunk-SBHCT576.js";
import { a as k } from "./chunk-ZAZUS2LA.js";
import { a as T } from "./chunk-HV3SPSHE.js";
import { a as R } from "./chunk-BQCZFAYZ.js";
import { a as h } from "./chunk-PN2FQ2K5.js";
import { a as v } from "./chunk-2NFNCZZA.js";
import { b as P, c as y, d as i, f as l, g } from "./chunk-WWJ6UWS7.js";
var b = P(T(), 1);
var d = class {
  static functionality(e, t) {
    t.addEventListener("blur", (n) =>
      l(this, null, function* () {
        let a = ["AND", `${e.property}=${t.value}`];
        e.url && a.push(e.url),
          (yield w.retrieve(a)).length === 0
            ? (0, b.getJQuery)()(t).error(
                e.msgnotinldap ? e.msgnotinldap : "Only values that're present in the Active Directory are permitted.",
              )
            : (document.activeElement !== r && r.remove(), (0, b.getJQuery)()(t).error(""));
      }),
    );
    let p = !1,
      r = document.createElement("select");
    r.classList.add("---CodBi", "--LDAP_Autocomplete", "-Proposals"),
      r.setAttribute(
        "style",
        e.cssproposals
          ? e.cssproposals
          : "margin-top: .5em ; max-width: 100% ; border-color: darkorange ; border-radius: .5em ; box-shadow: 0 0 .5em darkorange ; color: green ; font-weight: bolder ; cursor: pointer;",
      );
    let D = () =>
      l(this, null, function* () {
        if (((t.value = r.value), r.remove(), t.codbiLDAPSetMatchListeners)) {
          let n = ["AND", `${e.property}=${r.value}`];
          e.url && n.push(e.url);
          let a = yield w.retrieve(n);
          for (let o of t.codbiLDAPSetMatchListeners) o(a, t);
        }
      });
    r.addEventListener("change", (n) =>
      l(this, null, function* () {
        D();
      }),
    ),
      r.addEventListener("keydown", (n) =>
        l(this, null, function* () {
          (n.key === "Enter" || n.key === "Space") && D();
        }),
      ),
      t.addEventListener("keydown", (n) =>
        l(this, null, function* () {
          p && (n.stopPropagation(), n.preventDefault(), n.stopImmediatePropagation());
          let a = m.tsCheck(n, KeyboardEvent).key;
          if (a.length !== 1 && a !== "Backspace" && a !== "Delete") return;
          let o = ["AND", `${e.property}=${t.value}${a.length === 1 ? a : ""}`];
          e.url && o.push(e.url);
          let u = A(yield w.retrieve(o), e.property);
          if (u.length === 1) {
            if (((t.value = u[0][e.property]), (p = !0), r.remove(), t.codbiLDAPSetMatchListeners))
              for (let E of t.codbiLDAPSetMatchListeners) E(u, t);
            setTimeout(() => {
              p = !1;
            }, 500);
          }
          if (u.length > 1) {
            r.innerHTML = "";
            for (let E of u) r.options.add(new Option(E[e.property], E[e.property]));
            t.parentElement.appendChild(r);
          }
        }),
      );
  }
};
y(
  [
    g.ParamvalueProvider,
    i(0, k.PRE("property")),
    i(0, h.PRE("string", "property :: cssproposals :: url :: msgnotinldap")),
    i(0, s.PRE(s.stdExp.property, "property")),
    i(0, s.PRE(s.stdExp.url, "url")),
    i(1, m.PRE(HTMLInputElement, void 0, "Is it not an <input> that is tagged with this functionality?")),
    i(1, M.PRE("text", !1, "type", `Isn't the tagged <input type = "text"/> ?`)),
  ],
  d,
  "functionality",
  1,
);
window.codbi.registerFunctionality("LDAP.Autocomplete", d.functionality.bind(d));
function A(c, e = void 0) {
  if (e) {
    let t = new Map();
    for (let p of c) {
      let r = p[e];
      t.has(r) || t.set(r, p);
    }
    return Array.from(t.values());
  } else return [...new Set(c)];
}
var f = class {
  static retrieve(e) {
    return e.length === 1 ? A(e[0]) : A(e[0], e[1]);
  }
};
y(
  [
    g.ParamvalueProvider,
    i(0, R.PRE(1, !0, !1, "length", "Hasn't at least the Array to filter been provided?")),
    i(0, v.PRE(new m(Array), 0)),
    i(0, v.PRE(new h("string"), 1)),
    i(0, v.PRE(new s(s.stdExp.property), 1)),
  ],
  f,
  "retrieve",
  1,
);
window.codbi.registerEP("Unique", f.retrieve.bind(f));
export { f as Unique };
