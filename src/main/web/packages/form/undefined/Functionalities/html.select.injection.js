import { a as l } from "./chunk-PSEWTT4Z.js";
import { a as p } from "./chunk-KEJSWGMR.js";
import { a as d } from "./chunk-CDLTIEKC.js";
import { g, h as s, p as v } from "./chunk-UTJJRBTX.js";
var u = class extends l {
  constructor(i) {
    super(i, !0);
    this.equivalent = i;
  }
  static PRE(i, f = !1, r = void 0, t = void 0, n = void 0) {
    return l.PRE(i, !0, r, n, t);
  }
  static POST(i, f = !1, r = void 0, t = void 0, n = void 0) {
    return l.POST(i, !0, r, n, t);
  }
  static INVARIANT(i, f = !1, r = void 0, t = void 0, n = void 0) {
    return l.INVARIANT(i, !0, r, n, t);
  }
};
var a = class {
  static functionality(e, i) {
    e.reclean &&
      ((typeof e.reclean == "string" && e.reclean.toLocaleLowerCase() === "true") ||
        (typeof e.reclean == "boolean" && e.reclean === !0)) &&
      (i.innerHTML = "");
    let f = e.titles ? e.titles.length : e.values.length;
    e.titles === void 0 && (e.titles = e.values);
    for (let r = 0; r < f; r++) {
      let t, n, c;
      (n = c = e.values[r]),
        (t = e.titles ? e.titles[r] : n),
        typeof n != "string" && ((n = t[e.valueproperty]), (c = t[e.textproperty])),
        typeof t != "string" && (t = t[e.titleproperty]),
        (i.innerHTML += `<option title = "${t} value = "${n}">${c}</option>`);
    }
  }
};
g(
  [
    v.ParamvalueProvider,
    s(0, d.PRE("string", "textproperty")),
    s(0, d.PRE("string | boolean", "reclean")),
    s(0, u.PRE(0, "titles.length", "Isn't at least one title specified?")),
    s(0, p.PRE(Array, "titles", `Aren't all the "titles" strings?`)),
    s(0, u.PRE(0, "values.length", "Isn't at least one value specified?")),
    s(0, p.PRE(Array, "values", `Aren't all the "values" strings?`)),
    s(1, p.PRE(HTMLSelectElement, void 0, "Is it not a <select/> that is tagged with this functionality?")),
  ],
  a,
  "functionality",
  1,
);
window.codbi.registerFunctionality("HTML.Select.Injection", a.functionality.bind(a));
export { a as HTML_Select_Injection };
