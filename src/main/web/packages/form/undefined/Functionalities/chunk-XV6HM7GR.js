import { a as E } from "./chunk-JH6KRLLF.js";
import { a as T } from "./chunk-DCP5OS4S.js";
import { a as v } from "./chunk-7ZUEWSHL.js";
import { a as k } from "./chunk-PSEWTT4Z.js";
import { a as L } from "./chunk-M2SNI3IN.js";
import { a as I } from "./chunk-4JLAI42Q.js";
import { a as A } from "./chunk-KEJSWGMR.js";
import { a as f } from "./chunk-SEUS6MHP.js";
import { a as b } from "./chunk-CDLTIEKC.js";
import { f as R, g as w, h as d, o as h, p } from "./chunk-UTJJRBTX.js";
var D = R(I(), 1);
var x = R(I(), 1);
var m = class u extends p {
  constructor(e, i = !1, t = !1) {
    super();
    this.equivalent = e;
    this.equalityPermitted = i;
    this.invert = t;
  }
  static checkAlgorithm(e, i, t, a) {
    return t && !a && e < i
      ? `Value has to to be greater than or equal to "${i}"`
      : t && a && e > i
        ? `Value has to be less than or equal to "${i}"`
        : !t && !a && e <= i
          ? `Value has to to be greater than "${i}"`
          : !t && a && e >= i
            ? `Value has to be less than "${i}"`
            : !0;
  }
  static PRE(e, i = !1, t = !1, a = void 0, s = void 0, n = void 0) {
    return p.decPrecondition((l, o, g, N) => u.checkAlgorithm(l, e, i, t), n, a, s);
  }
  static POST(e, i = !1, t = !1, a = void 0, s = void 0, n = void 0) {
    return p.decPostcondition((l, o, g) => u.checkAlgorithm(l, i, e, t), n, a, s);
  }
  static INVARIANT(e, i = !1, t = !1, a = void 0, s = void 0, n = void 0) {
    return p.decInvariant([new u(e, i, t)], n, a, s);
  }
  check(e) {
    return u.checkAlgorithm(e, this.equivalent, this.equalityPermitted, this.invert);
  }
};
var P = class extends m {
  constructor(e) {
    super(e, !1, !1);
    this.equivalent = e;
  }
  static PRE(e, i = !1, t = !1, a = void 0, s = void 0, n = void 0) {
    return m.PRE(e, !1, !1, s, a, n);
  }
  static POST(e, i = !1, t = !1, a = void 0, s = void 0, n = void 0) {
    return m.POST(e, !1, !1, s, a, n);
  }
  static INVARIANT(e, i = !1, t = !1, a = void 0, s = void 0, n = void 0) {
    return m.INVARIANT(e, !1, !1, s, a, n);
  }
};
var c = class {
  static retrieve(r) {
    let e,
      i = new Array();
    return new Promise((t, a) => {
      let s = r[0] === "" || r[0].toLowerCase() === "and" ? "%26" : r[0].toLowerCase() === "or" ? "|" : "%26",
        n = r[1].split("|"),
        l = r.length > 3 ? r[3] : window.codbiSettings.LDAP.URL;
      l === "" && a(new T("[[ LDAP.Find ] No LDAP-URL specified neither via parameter nor via CodBi Settings. ]"));
      for (let o = n.length - 1; o < 9; o++) n.push(n[n.length - 1]);
      (n = n.map((o) => o.replace("=", "%3D").trim())),
        e && e.abort(),
        (e = (0, x.getJQuery)()
          .ajax(`${l}&queryParameter=${s},${n.join(",")}`)
          .done((o) => {
            i.indexOf(e) === -1 && t(o);
          }));
    });
  }
};
w(
  [
    p.ParamvalueProvider,
    d(0, P.PRE(2, !0, !1, "length", "Haven't at least the mode and the LDAP-Conditions been specified?")),
    d(0, E.PRE(new b("string"))),
    d(0, E.PRE(new f(/(AND|OR)/i), 0)),
    d(0, E.PRE(new f(/^\w+\s*=\s*\w+(?:\s*\|\s*\w+\s*=\s*\w+)*$/), 1)),
    d(0, E.PRE(new L(new v(), new f(f.stdExp.url)), 3)),
  ],
  c,
  "retrieve",
  1,
);
window.codbi.registerEP("LDAP.Find", c.retrieve.bind(c));
var y = class {
  static functionality(r, e) {
    e.addEventListener("blur", (s) =>
      h(this, null, function* () {
        let n = ["AND", `${r.property}=${e.value}`];
        r.url && n.push(r.url),
          (yield c.retrieve(n)).length === 0
            ? (0, D.getJQuery)()(e).error(
                r.msgnotinldap ? r.msgnotinldap : "Only values that're present in the Active Directory are permitted.",
              )
            : (document.activeElement !== t && t.remove(), (0, D.getJQuery)()(e).error(""));
      }),
    );
    let i = !1,
      t = document.createElement("select");
    t.classList.add("---CodBi", "--LDAP_Autocomplete", "-Proposals"),
      t.setAttribute(
        "style",
        r.cssproposals
          ? r.cssproposals
          : "margin-top: .5em ; max-width: 100% ; border-color: darkorange ; border-radius: .5em ; box-shadow: 0 0 .5em darkorange ; color: green ; font-weight: bolder ; cursor: pointer;",
      );
    let a = () =>
      h(this, null, function* () {
        if (((e.value = t.value), t.remove(), e.codbiLDAPSetMatchListeners)) {
          let s = ["AND", `${r.property}=${t.value}`];
          r.url && s.push(r.url);
          let n = yield c.retrieve(s);
          for (let l of e.codbiLDAPSetMatchListeners) l(n, e);
        }
      });
    t.addEventListener("change", (s) =>
      h(this, null, function* () {
        a();
      }),
    ),
      t.addEventListener("keydown", (s) =>
        h(this, null, function* () {
          (s.key === "Enter" || s.key === "Space") && a();
        }),
      ),
      e.addEventListener("keydown", (s) =>
        h(this, null, function* () {
          i && (s.stopPropagation(), s.preventDefault(), s.stopImmediatePropagation());
          let n = A.tsCheck(s, KeyboardEvent).key;
          if (n.length !== 1 && n !== "Backspace" && n !== "Delete") return;
          let l = ["AND", `${r.property}=${e.value}${n.length === 1 ? n : ""}`];
          r.url && l.push(r.url);
          let o = M(yield c.retrieve(l), r.property);
          if (o.length === 1) {
            if (((e.value = o[0][r.property]), (i = !0), t.remove(), e.codbiLDAPSetMatchListeners))
              for (let g of e.codbiLDAPSetMatchListeners) g(o, e);
            setTimeout(() => {
              i = !1;
            }, 500);
          }
          if (o.length > 1) {
            t.innerHTML = "";
            for (let g of o) t.options.add(new Option(g[r.property], g[r.property]));
            e.parentElement.appendChild(t);
          }
        }),
      );
  }
};
w(
  [
    p.ParamvalueProvider,
    d(0, v.PRE("property")),
    d(0, b.PRE("string", "property :: cssproposals :: url :: msgnotinldap")),
    d(0, f.PRE(f.stdExp.property, "property")),
    d(0, f.PRE(f.stdExp.url, "url")),
    d(1, A.PRE(HTMLInputElement, void 0, "Is it not an <input> that is tagged with this functionality?")),
    d(1, k.PRE("text", !1, "type", `Isn't the tagged <input type = "text"/> ?`)),
  ],
  y,
  "functionality",
  1,
);
window.codbi.registerFunctionality("LDAP.Autocomplete", y.functionality.bind(y));
function M(u, r = void 0) {
  if (r) {
    let e = new Map();
    for (let i of u) {
      let t = i[r];
      e.has(t) || e.set(t, i);
    }
    return Array.from(e.values());
  } else return [...new Set(u)];
}
export { P as a, y as b, M as c };
