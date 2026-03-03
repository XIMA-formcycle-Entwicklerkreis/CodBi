import { a as T, c as b } from "./chunk-XV6HM7GR.js";
import { a as i } from "./chunk-JH6KRLLF.js";
import { a as v } from "./chunk-HI24USOS.js";
import "./chunk-DCP5OS4S.js";
import { a as O } from "./chunk-7ZUEWSHL.js";
import { a as d } from "./chunk-PSEWTT4Z.js";
import { a as $ } from "./chunk-M2SNI3IN.js";
import { a as q } from "./chunk-4JLAI42Q.js";
import { a as h } from "./chunk-KEJSWGMR.js";
import { a } from "./chunk-SEUS6MHP.js";
import { a as c } from "./chunk-CDLTIEKC.js";
import { f as C, g as f, h as n, o as I, p as g } from "./chunk-UTJJRBTX.js";
var x = C(q(), 1);
var B = C(q(), 1);
var E = class {
  static retrieve(e) {
    return new Promise((t, H) => {
      (0, B.getJQuery)()
        .ajax({
          url: `${window.codbi.baseURL}plugin?name=CodBi_OpenPLZ_Query`,
          type: "GET",
          headers: {
            Accept: "application/json",
            "X-Country": e[0] ? e[0] : "",
            "X-OrgaUnit": e[1] ? e[1] : "",
            "X-OfficialKey": e[2] ? e[2] : "",
            "X-Detail": e[3] ? e[3] : "",
            "X-Param1": e[4] ? e[4].replace("=", "-").replace(/ /, "") : "",
            "X-Param2": e[5] ? e[5].replace("=", "-").replace(/ /, "") : "",
            "X-Param3": e[6] ? e[6].replace("=", "-").replace(/ /, "") : "",
            "X-Param4": e[7] ? e[7].replace("=", "-").replace(/ /, "") : "",
            "X-PagesToLoad": e[8] ? e[8].toString() : void 0,
          },
        })
        .done((k) => {
          t(JSON.parse(k));
        });
    });
  }
};
f(
  [
    g.ParamvalueProvider,
    n(0, T.PRE(1, !0, !1, "length", "Hasn't at least the Orga-Unit been specified?")),
    n(0, i.PRE(new c("string"), 0)),
    n(0, i.PRE(new v([new d(""), new a(/(de|en|at|li|ch)/i)]), 0)),
    n(0, i.PRE(new c("string"), 2)),
    n(0, i.PRE(new v([new d(""), new a(/^\d+$/)]), 2)),
  ],
  E,
  "retrieve",
  1,
);
window.codbi.registerEP("OpenPLZ", E.retrieve.bind(E));
var y = class extends E {
  static retrieve(e) {
    return E.retrieve([
      e[0] ? e[0] : "",
      "Streets",
      "",
      "",
      `name-${e[1].replace(/^/, "\xB0")}`,
      e.length >= 4 ? `locality-${e[3].replace(/^/, "\xB0")}` : `postalCode-${e[2].replace(/^/, "\xB0")}`,
      "",
      "",
      e[4] ? e[4] : "",
    ]);
  }
};
f(
  [
    g.ParamvalueProvider,
    n(0, T.PRE(2, !0, !1, "length", "Hasn't at least the Street and City RegEx been specified?")),
    n(0, i.PRE(new c("string"), 0, 4)),
    n(0, i.PRE(new v([new d(""), new a(/(de|en|at|li|ch)/i)]), 0)),
  ],
  y,
  "retrieve",
  1,
);
window.codbi.registerEP("OpenPLZ.Streets", y.retrieve.bind(y));
var m = class extends E {
  static retrieve(e) {
    return E.retrieve([
      e[0],
      "Localities",
      "",
      "",
      `name-${e[1].replace(/^/, "\xB0")}`,
      e.length >= 3 ? `postalCode-${e[2].replace(/^/, "\xB0")}` : "",
      "",
      "",
      "",
      e[3] ? e[3] : "",
      e[3] ? e[3] : "",
    ]);
  }
};
f(
  [
    g.ParamvalueProvider,
    n(0, T.PRE(1, !0, !1, "length", "Hasn't at least the Locality's or the Postalcode RegEx been specified?")),
    n(0, i.PRE(new c("string"), 0, 2)),
    n(0, i.PRE(new v([new d(""), new a(/(de|en|at|li|ch)/i)]), 0)),
    n(0, i.PRE(new c("string | number"), 3)),
    n(0, i.PRE(new $(new c("string"), new a(/^\d+$/)), 3)),
  ],
  m,
  "retrieve",
  1,
);
window.codbi.registerEP("OpenPLZ.Localities", m.retrieve.bind(m));
var o = class o {
  static functionality(e, t) {
    let H =
      e.targetdata.toLowerCase() === "localities" || e.targetdata.toLowerCase() === "streets" ? "name" : "postalCode";
    t.addEventListener("blur", (r) =>
      I(this, null, function* () {
        let u = (0, x.getJQuery)(),
          s;
        switch (e.targetdata.toLowerCase()) {
          case "localities":
            s = yield m.retrieve([e.country ? e.country : "", `\xB0${t.value}`, "", 1]);
            break;
          case "postalcodes":
            s = yield m.retrieve([e.country ? e.country : "", ".*", `\xB0${t.value}`, 1]);
            break;
          case "streets":
            s = b(
              yield y.retrieve([
                e.country ? e.country : "",
                `\xB0${t.value}`,
                e.dependentplz === void 0 ||
                (e.dependentlocality &&
                  h.tsCheck(
                    t.parentElement.parentElement.parentElement.querySelector(e.dependentlocality),
                    HTMLInputElement,
                    'Is the DependentLocality not pointing to a <input type = "text">?',
                  ) &&
                  t.parentElement.parentElement.parentElement.querySelector(e.dependentlocality).value !== "") ||
                (h.tsCheck(
                  t.parentElement.parentElement.parentElement.querySelector(e.dependentplz),
                  HTMLInputElement,
                  'Is the DependentPLZ not pointing to a <input type = "text">?',
                ) &&
                  t.parentElement.parentElement.parentElement.querySelector(e.dependentplz).value === "")
                  ? ""
                  : t.parentElement.parentElement.parentElement.querySelector(e.dependentplz)
                    ? `\xB0${t.parentElement.parentElement.parentElement.querySelector(e.dependentplz).value}`
                    : "",
                e.dependentlocality &&
                t.parentElement.parentElement.parentElement.querySelector(e.dependentlocality) &&
                t.parentElement.parentElement.parentElement.querySelector(e.dependentlocality).value !== ""
                  ? `\xB0${t.parentElement.parentElement.parentElement.querySelector(e.dependentlocality).value}`
                  : "",
                1,
              ]),
              "name",
            );
            break;
        }
        s.length === 0
          ? u(t).error(e.msgnotknown ? e.msgnotknown : `Only known ${e.targetdata} are permitted.`)
          : (document.activeElement !== p && p.remove(), u(t).error(""));
      }),
    );
    let k = !1,
      p = document.createElement("select");
    p.addEventListener("blur", (r) => {
      document.activeElement !== t && p.remove();
    }),
      p.classList.add("---CodBi", "--OpenPLZ_Autocomplete", `--${e.targetdata}`, "-Proposals"),
      p.setAttribute(
        "style",
        e.cssproposals
          ? e.cssproposals
          : "margin-top: .5em ; max-width: 100% ; border-color: darkorange ; border-radius: .5em ; box-shadow: 0 0 .5em darkorange ; color: green ; font-weight: bolder ; cursor: pointer;",
      );
    let A = () =>
      I(this, null, function* () {
        t.value = p.value;
        let r;
        switch (e.targetdata.toLowerCase()) {
          case "localities":
            r = b(yield m.retrieve([e.country ? e.country : "", `\xB0${t.value}`, "", 1]), "name");
            break;
          case "postalcodes":
            r = yield m.retrieve([e.country ? e.country : "", ".*", `\xB0${t.value}`, 1]);
            break;
          case "streets":
            r = b(
              yield y.retrieve([
                e.country ? e.country : "",
                `\xB0${t.value}`,
                e.dependentplz === void 0 ||
                (e.dependentlocality &&
                  t.parentElement.parentElement.parentElement.querySelector(e.dependentlocality) &&
                  t.parentElement.parentElement.parentElement.querySelector(e.dependentlocality).value !== "") ||
                (t.parentElement.parentElement.parentElement.querySelector(e.dependentplz) &&
                  t.parentElement.parentElement.parentElement.querySelector(e.dependentplz).value === "")
                  ? ""
                  : t.parentElement.parentElement.parentElement.querySelector(e.dependentplz)
                    ? `\xB0${t.parentElement.parentElement.parentElement.querySelector(e.dependentplz).value}`
                    : "",
                e.dependentlocality &&
                t.parentElement.parentElement.parentElement.querySelector(e.dependentlocality) &&
                t.parentElement.parentElement.parentElement.querySelector(e.dependentlocality).value !== ""
                  ? `\xB0${t.parentElement.parentElement.parentElement.querySelector(e.dependentlocality).value}`
                  : "",
                1,
              ]),
              "name",
            );
            break;
        }
        if (r.length === 0) return;
        if (t.codbiOpenPLZSetMatchListeners) for (let w of t.codbiOpenPLZSetMatchListeners) w(r, t);
        let u = e.targetdata.toLowerCase(),
          s = t.parentElement.parentElement.parentElement.querySelector(e.dependent);
        u !== "streets" && s && (s.value = u === "localities" ? r[0].postalCode : r[0].name);
        let l = t.parentElement.parentElement.parentElement.querySelector(e.focusonautocomplete);
        l &&
          e.focusonautocomplete &&
          ((l.CodBi_OpenPLZ_Autocomplete_BlockedByDependent = !0),
          p.remove(),
          l.focus(),
          l.animate(o.kfFocusOnAutocomplete, o.tmgFocusOnAutocomplete).play());
      });
    p.addEventListener("change", (r) =>
      I(this, null, function* () {
        A();
      }),
    ),
      t.addEventListener("keydown", (r) => {
        (k || t.CodBi_OpenPLZ_Autocomplete_BlockedByDependent) &&
          (r.stopPropagation(), r.preventDefault(), r.stopImmediatePropagation());
      }),
      t.addEventListener("keyup", (r) =>
        I(this, null, function* () {
          if (k || t.CodBi_OpenPLZ_Autocomplete_BlockedByDependent) {
            r.stopPropagation(), r.preventDefault(), r.stopImmediatePropagation();
            return;
          }
          let u = h.tsCheck(r, KeyboardEvent).key,
            s = t.parentElement.parentElement.parentElement.querySelector(e.dependent);
          if (u.length !== 1 && u !== "Backspace" && u !== "Delete") return;
          (u === "Enter" || u === "Space") && A();
          let l;
          switch (e.targetdata.toLowerCase()) {
            case "localities":
              l = b(yield m.retrieve([e.country ? e.country : "", `\xB0${t.value}`, "", 1]), "name");
              break;
            case "postalcodes":
              l = yield m.retrieve([e.country ? e.country : "", ".*", `\xB0${t.value}`, 1]);
              break;
            case "streets":
              l = b(
                yield y.retrieve([
                  e.country ? e.country : "",
                  `\xB0${t.value}`,
                  e.dependentplz === void 0 ||
                  (e.dependentlocality &&
                    t.parentElement.parentElement.parentElement.querySelector(e.dependentlocality) &&
                    t.parentElement.parentElement.parentElement.querySelector(e.dependentlocality).value !== "") ||
                  (t.parentElement.parentElement.parentElement.querySelector(e.dependentplz) &&
                    t.parentElement.parentElement.parentElement.querySelector(e.dependentplz).value === "")
                    ? ""
                    : t.parentElement.parentElement.parentElement.querySelector(e.dependentplz)
                      ? `\xB0${t.parentElement.parentElement.parentElement.querySelector(e.dependentplz).value}`
                      : "",
                  e.dependentlocality &&
                  t.parentElement.parentElement.parentElement.querySelector(e.dependentlocality) &&
                  t.parentElement.parentElement.parentElement.querySelector(e.dependentlocality).value !== ""
                    ? `\xB0${t.parentElement.parentElement.parentElement.querySelector(e.dependentlocality).value}`
                    : "",
                  1,
                ]),
                "name",
              );
              break;
          }
          if (!(l.length === 0 || l[0].result)) {
            if (l.length === 1) {
              if (l[0].error) return;
              t.value = l[0][H];
              let w = e.targetdata.toLowerCase();
              w !== "streets" && s && (s.value = w === "localities" ? l[0].postalCode : l[0].name),
                (k = !0),
                p.remove();
              let S = t.parentElement.parentElement.parentElement.querySelector(e.focusonautocomplete);
              setTimeout(() => {
                (k = !1), e.focusonautocomplete && (S.CodBi_OpenPLZ_Autocomplete_BlockedByDependent = !1);
              }, 1e3),
                S &&
                  e.focusonautocomplete &&
                  ((S.CodBi_OpenPLZ_Autocomplete_BlockedByDependent = !0),
                  p.remove(),
                  S.focus(),
                  S.animate(o.kfFocusOnAutocomplete, o.tmgFocusOnAutocomplete).play());
            }
            if (l.length > 1) {
              p.innerHTML = "";
              for (let w of l) p.options.add(new Option(w[H], w[H]));
              t.parentElement.appendChild(p);
            }
          }
        }),
      );
  }
};
(o.kfFocusOnAutocomplete = [
  { transform: "scale(1)" },
  { transform: "scale(1.5)", boxShadow: "0 0 10em darkorange", borderColor: "darkorange" },
  { transform: "scale(1)", boxShadow: "0 0 0em darkorange", borderColor: "unset" },
]),
  (o.tmgFocusOnAutocomplete = { duration: 500, iterations: 1, easing: "ease-out", fill: "forwards" }),
  (o.registered = window.codbi.registerFunctionality("OpenPLZ.Autocomplete", o.functionality)),
  f(
    [
      g.ParamvalueProvider,
      n(0, O.PRE("targetdata :: focusonautocomplete")),
      n(
        0,
        c.PRE(
          "string",
          "targetdata :: country :: cssproposals :: msgnotknown :: dependent :: dependentplz :: dependentlocality :: focusonautocomplete",
        ),
      ),
      n(0, a.PRE(/(de|en|at|li|ch)/i, "country")),
      n(0, a.PRE(/^(localities|postalcode|streets)$/i, "targetdata")),
      n(0, a.PRE(a.stdExp.cssSelector, "dependentplz")),
      n(0, a.PRE(a.stdExp.cssSelector, "dependentlocality")),
      n(0, a.PRE(a.stdExp.cssSelector, "focusonautocomplete")),
      n(1, h.PRE(HTMLInputElement, "Is it not an <input> that is tagged with this functionality?")),
      n(1, d.PRE("text", !1, "type", `Isn't the tagged <input type = "text"/> ?`)),
    ],
    o,
    "functionality",
    1,
  );
var M = o;
window.codbi.registerFunctionality("OpenPLZ.Autocomplete", M.functionality.bind(M));
export { M as OpenPLZ_Autocomplete };
