import "./chunk-BGFHKOW7.js";
import { a as f } from "./chunk-K6ISRTTP.js";
import { a as l } from "./chunk-JL2EL352.js";
import { a as A } from "./chunk-W23DHSE2.js";
import { a as h } from "./chunk-MUWAMKOD.js";
import { f as w, g as T, h as b } from "./chunk-RS4WWU7K.js";
var p = w(A(), 1);
var u = class u {
  static functionality(e, t) {
    typeof e.target == "string"
      ? (e.target = t.parentElement.parentElement.querySelector(e.target))
      : (e.target = e.target[0]),
      typeof e.candidate == "string" && (e.candidate = t.parentElement.parentElement.querySelector(e.candidate));
    let g = () => {
      let r = !1,
        a = e.dateformat ? v(e.dateformat, e.candidate.value) : new Date(e.candidate.value);
      if (a === "Invalid Date")
        throw new f(
          `The tagged element's value (${t.value}) could not be converted to the requested "format (${e.formatDate})".`,
        );
      switch ((Array.isArray(e.reference) && (e.reference = e.reference[0]), e.mode.toLowerCase())) {
        case "gteq":
          r = a.getTime() >= e.reference.getTime();
          break;
        case "gt":
          r = a.getTime() > e.reference.getTime();
          break;
        case "lteq":
          r = a.getTime() <= e.reference.getTime();
          break;
        case "lt":
          r = a.getTime() < e.reference.getTime();
          break;
        case "eq":
          r = a.getTime() === e.reference.getTime();
          break;
        case "neq":
          r = a.getTime() !== e.reference.getTime();
          break;
        default:
          throw new f(`Specified mode "${e.mode}" not available.`);
      }
      for (let c of t.attributes) {
        let n = c.name.toLowerCase();
        if (n.substring(0, 8) === "data-cb-" && n[8] === "_")
          switch (n.substring(9, 11)) {
            case "t_": {
              if (r) {
                let s = n.replace("_t_", "");
                e.target.removeAttribute(s), e.target.setAttribute(s, c.value);
              }
              break;
            }
            case "f_": {
              if (!r) {
                let s = n.replace("_f_", "");
                e.target.removeAttribute(s), e.target.setAttribute(s, c.value);
              }
              break;
            }
            default:
          }
      }
      e.target.hasAttribute("data-cb-checked") &&
        e.target.setAttribute(
          "data-cb-checked",
          e.target.getAttribute("data-cb-checked").replace("html.setattribute", ""),
        ),
        window.codbi.checkAttributes();
    };
    (0, p.getJQuery)()(t).on("change", g);
  }
};
(u.registered = window.codbi.registerFunctionality("OnChange.Conditional", u.functionality)),
  T(
    [
      h.ParamvalueProvider,
      b(0, l.PRE(/^(GTEQ|GT|LTEQ|LT|EQ|NEQ)$/i, "mode")),
      b(0, l.PRE(l.stdExp.dateFormat, "dateFormat")),
    ],
    u,
    "functionality",
    1,
  );
var d = u;
function v(E, e) {
  let t = {},
    g = /([DMYHMSdms]{1,4})/g,
    r = E.match(g),
    a = e.split(/\D/).filter((i) => i.length > 0);
  if (!r || r.length !== a.length)
    return console.error("Error: The format string and date string do not have a matching number of components."), null;
  for (let i = 0; i < r.length; i++) {
    let y = r[i],
      m = Number.parseInt(a[i], 10);
    switch (y.charAt(0).toLowerCase()) {
      case "d":
        t.d = m;
        break;
      case "y":
        t.y = m;
        break;
      case "h":
        t.h = m;
        break;
      case "s":
        t.s = m;
        break;
      case "m":
        !t.m && i < 2 ? (t.m = m) : (t.min = m);
        break;
      default:
        break;
    }
  }
  let c = t.y || 0,
    n = (t.m || 1) - 1,
    s = t.d || 1,
    o = t.h || 0,
    k = t.min || 0,
    D = t.s || 0;
  return new Date(c, n, s, o, k, D);
}
export { d as OnChange_Conditional };
