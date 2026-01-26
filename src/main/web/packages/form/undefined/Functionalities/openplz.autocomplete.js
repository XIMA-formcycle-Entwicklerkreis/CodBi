import { b as s } from "./chunk-R62JZVA3.js";
import "./chunk-K6S6E7GX.js";
import { a as H } from "./chunk-BGFHKOW7.js";
import "./chunk-K6ISRTTP.js";
import "./chunk-K3A632J4.js";
import { a as b } from "./chunk-W23DHSE2.js";
import { a as M } from "./chunk-MUWAMKOD.js";
import { f as k, g as T, o } from "./chunk-RS4WWU7K.js";
var A = k(b(), 1);
var $ = k(b(), 1);
var q = k(b(), 1),
  v = class v {
    static retrieve(e) {
      return new Promise((n, g) => {
        (0, q.getJQuery)()
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
          .done((E) => {
            n(JSON.parse(E));
          });
      });
    }
  };
v.registered = window.codbi.registerEP("OpenPLZ", v.retrieve);
var m = v;
var f = class f extends m {
  static retrieve(e) {
    return m.retrieve([
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
f.registered = window.codbi.registerEP("OpenPLZ.Streets", f.retrieve);
var y = f;
var w = class w extends m {
  static retrieve(e) {
    return m.retrieve([
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
w.registered = window.codbi.registerEP("OpenPLZ.Localities", w.retrieve);
var u = w;
var p = class p {
  static functionality(e, n) {
    let g =
      e.targetdata.toLowerCase() === "localities" || e.targetdata.toLowerCase() === "streets" ? "name" : "postalCode";
    n.addEventListener("blur", (t) =>
      o(this, null, function* () {
        let a = (0, A.getJQuery)(),
          i;
        switch (e.targetdata.toLowerCase()) {
          case "localities":
            i = yield u.retrieve([e.country ? e.country : "", `\xB0${n.value}`, "", 1]);
            break;
          case "postalcodes":
            i = yield u.retrieve([e.country ? e.country : "", ".*", `\xB0${n.value}`, 1]);
            break;
          case "streets":
            i = s(
              yield y.retrieve([
                e.country ? e.country : "",
                `\xB0${n.value}`,
                e.dependentplz === void 0 ||
                (e.dependentlocality &&
                  n.parentElement.parentElement.parentElement.querySelector(e.dependentlocality) &&
                  n.parentElement.parentElement.parentElement.querySelector(e.dependentlocality).value !== "") ||
                (n.parentElement.parentElement.parentElement.querySelector(e.dependentplz) &&
                  n.parentElement.parentElement.parentElement.querySelector(e.dependentplz).value === "")
                  ? ""
                  : n.parentElement.parentElement.parentElement.querySelector(e.dependentplz)
                    ? `\xB0${n.parentElement.parentElement.parentElement.querySelector(e.dependentplz).value}`
                    : "",
                e.dependentlocality &&
                n.parentElement.parentElement.parentElement.querySelector(e.dependentlocality) &&
                n.parentElement.parentElement.parentElement.querySelector(e.dependentlocality).value !== ""
                  ? `\xB0${n.parentElement.parentElement.parentElement.querySelector(e.dependentlocality).value}`
                  : "",
                1,
              ]),
              "name",
            );
            break;
        }
        i.length === 0
          ? a(n).error(e.msgnotknown ? e.msgnotknown : `Only known ${e.targetdata} are permitted.`)
          : (document.activeElement !== l && l.remove(), a(n).error(""));
      }),
    );
    let E = !1,
      l = document.createElement("select");
    l.addEventListener("blur", (t) => {
      document.activeElement !== n && l.remove();
    }),
      l.classList.add("---CodBi", "--OpenPLZ_Autocomplete", `--${e.targetdata}`, "-Proposals"),
      l.setAttribute(
        "style",
        e.cssproposals
          ? e.cssproposals
          : "margin-top: .5em ; max-width: 100% ; border-color: darkorange ; border-radius: .5em ; box-shadow: 0 0 .5em darkorange ; color: green ; font-weight: bolder ; cursor: pointer;",
      );
    let S = () =>
      o(this, null, function* () {
        n.value = l.value;
        let t;
        switch (e.targetdata.toLowerCase()) {
          case "localities":
            t = s(yield u.retrieve([e.country ? e.country : "", `\xB0${n.value}`, "", 1]), "name");
            break;
          case "postalcodes":
            t = yield u.retrieve([e.country ? e.country : "", ".*", `\xB0${n.value}`, 1]);
            break;
          case "streets":
            t = s(
              yield y.retrieve([
                e.country ? e.country : "",
                `\xB0${n.value}`,
                e.dependentplz === void 0 ||
                (e.dependentlocality &&
                  n.parentElement.parentElement.parentElement.querySelector(e.dependentlocality) &&
                  n.parentElement.parentElement.parentElement.querySelector(e.dependentlocality).value !== "") ||
                (n.parentElement.parentElement.parentElement.querySelector(e.dependentplz) &&
                  n.parentElement.parentElement.parentElement.querySelector(e.dependentplz).value === "")
                  ? ""
                  : n.parentElement.parentElement.parentElement.querySelector(e.dependentplz)
                    ? `\xB0${n.parentElement.parentElement.parentElement.querySelector(e.dependentplz).value}`
                    : "",
                e.dependentlocality &&
                n.parentElement.parentElement.parentElement.querySelector(e.dependentlocality) &&
                n.parentElement.parentElement.parentElement.querySelector(e.dependentlocality).value !== ""
                  ? `\xB0${n.parentElement.parentElement.parentElement.querySelector(e.dependentlocality).value}`
                  : "",
                1,
              ]),
              "name",
            );
            break;
        }
        if (t.length === 0) return;
        if (n.codbiOpenPLZSetMatchListeners) for (let c of n.codbiOpenPLZSetMatchListeners) c(t, n);
        let a = e.targetdata.toLowerCase(),
          i = n.parentElement.parentElement.parentElement.querySelector(e.dependent);
        a !== "streets" && i && (i.value = a === "localities" ? t[0].postalCode : t[0].name);
        let r = n.parentElement.parentElement.parentElement.querySelector(e.focusonautocomplete);
        r &&
          e.focusonautocomplete &&
          ((r.CodBi_OpenPLZ_Autocomplete_BlockedByDependent = !0),
          l.remove(),
          r.focus(),
          r.animate(p.kfFocusOnAutocomplete, p.tmgFocusOnAutocomplete).play());
      });
    l.addEventListener("change", (t) =>
      o(this, null, function* () {
        S();
      }),
    ),
      n.addEventListener("keydown", (t) => {
        (E || n.CodBi_OpenPLZ_Autocomplete_BlockedByDependent) &&
          (t.stopPropagation(), t.preventDefault(), t.stopImmediatePropagation());
      }),
      n.addEventListener("keyup", (t) =>
        o(this, null, function* () {
          if (E || n.CodBi_OpenPLZ_Autocomplete_BlockedByDependent) {
            t.stopPropagation(), t.preventDefault(), t.stopImmediatePropagation();
            return;
          }
          let a = H.tsCheck(t, KeyboardEvent).key,
            i = n.parentElement.parentElement.parentElement.querySelector(e.dependent);
          if (a.length !== 1 && a !== "Backspace" && a !== "Delete") return;
          (a === "Enter" || a === "Space") && S();
          let r;
          switch (e.targetdata.toLowerCase()) {
            case "localities":
              r = s(yield u.retrieve([e.country ? e.country : "", `\xB0${n.value}`, "", 1]), "name");
              break;
            case "postalcodes":
              r = yield u.retrieve([e.country ? e.country : "", ".*", `\xB0${n.value}`, 1]);
              break;
            case "streets":
              r = s(
                yield y.retrieve([
                  e.country ? e.country : "",
                  `\xB0${n.value}`,
                  e.dependentplz === void 0 ||
                  (e.dependentlocality &&
                    n.parentElement.parentElement.parentElement.querySelector(e.dependentlocality) &&
                    n.parentElement.parentElement.parentElement.querySelector(e.dependentlocality).value !== "") ||
                  (n.parentElement.parentElement.parentElement.querySelector(e.dependentplz) &&
                    n.parentElement.parentElement.parentElement.querySelector(e.dependentplz).value === "")
                    ? ""
                    : n.parentElement.parentElement.parentElement.querySelector(e.dependentplz)
                      ? `\xB0${n.parentElement.parentElement.parentElement.querySelector(e.dependentplz).value}`
                      : "",
                  e.dependentlocality &&
                  n.parentElement.parentElement.parentElement.querySelector(e.dependentlocality) &&
                  n.parentElement.parentElement.parentElement.querySelector(e.dependentlocality).value !== ""
                    ? `\xB0${n.parentElement.parentElement.parentElement.querySelector(e.dependentlocality).value}`
                    : "",
                  1,
                ]),
                "name",
              );
              break;
          }
          if (!(r.length === 0 || r[0].result)) {
            if (r.length === 1) {
              if (r[0].error) return;
              n.value = r[0][g];
              let c = e.targetdata.toLowerCase();
              c !== "streets" && i && (i.value = c === "localities" ? r[0].postalCode : r[0].name),
                (E = !0),
                l.remove();
              let d = n.parentElement.parentElement.parentElement.querySelector(e.focusonautocomplete);
              setTimeout(() => {
                (E = !1), e.focusonautocomplete && (d.CodBi_OpenPLZ_Autocomplete_BlockedByDependent = !1);
              }, 1e3),
                d &&
                  e.focusonautocomplete &&
                  ((d.CodBi_OpenPLZ_Autocomplete_BlockedByDependent = !0),
                  l.remove(),
                  d.focus(),
                  d.animate(p.kfFocusOnAutocomplete, p.tmgFocusOnAutocomplete).play());
            }
            if (r.length > 1) {
              l.innerHTML = "";
              for (let c of r) l.options.add(new Option(c[g], c[g]));
              n.parentElement.appendChild(l);
            }
          }
        }),
      );
  }
};
(p.kfFocusOnAutocomplete = [
  { transform: "scale(1)" },
  { transform: "scale(1.5)", boxShadow: "0 0 10em darkorange", borderColor: "darkorange" },
  { transform: "scale(1)", boxShadow: "0 0 0em darkorange", borderColor: "unset" },
]),
  (p.tmgFocusOnAutocomplete = { duration: 500, iterations: 1, easing: "ease-out", fill: "forwards" }),
  (p.registered = window.codbi.registerFunctionality("OpenPLZ.Autocomplete", p.functionality)),
  T([M.ParamvalueProvider], p, "functionality", 1);
var I = p;
export { I as OpenPLZ_Autocomplete };
