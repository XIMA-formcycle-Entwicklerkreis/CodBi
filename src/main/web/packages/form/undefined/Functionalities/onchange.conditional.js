import { a as E } from "./chunk-DCP5OS4S.js";
import { a as d } from "./chunk-7ZUEWSHL.js";
import { a as A } from "./chunk-4JLAI42Q.js";
import { a as b } from "./chunk-KEJSWGMR.js";
import { a as n } from "./chunk-SEUS6MHP.js";
import { a as p } from "./chunk-CDLTIEKC.js";
import { f as M, g as o, h as m, p as T } from "./chunk-UTJJRBTX.js";
var k = M(A(), 1);
var g = class {
  static functionality(e, t) {
    typeof e.target == "string"
      ? (e.target = d.tsCheck(
          t.parentElement.parentElement.querySelector(e.target),
          "Is the target accessible via the provided CSS-Selector?",
        ))
      : (e.target = b.tsCheck(e.target[0], HTMLElement)),
      typeof e.candidate == "string" &&
        (e.candidate = d.tsCheck(
          t.parentElement.parentElement.querySelector(e.candidate),
          "Is the candidate accessible via the provided CSS-Selector?",
        ));
    let f = () => {
      let r = !1,
        a = e.dateformat ? H(e.dateformat, e.candidate.value) : new Date(e.candidate.value);
      if (a === "Invalid Date")
        throw new E(
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
          throw new E(`Specified mode "${e.mode}" not available.`);
      }
      for (let u of t.attributes) {
        let s = u.name.toLowerCase();
        if (s.substring(0, 8) === "data-cb-" && s[8] === "_")
          switch (s.substring(9, 11)) {
            case "t_": {
              if (r) {
                let i = s.replace("_t_", "");
                e.target.removeAttribute(i), e.target.setAttribute(i, u.value);
              }
              break;
            }
            case "f_": {
              if (!r) {
                let i = s.replace("_f_", "");
                e.target.removeAttribute(i), e.target.setAttribute(i, u.value);
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
    (0, k.getJQuery)()(t).on("change", f);
  }
};
o(
  [
    T.ParamvalueProvider,
    m(0, p.PRE("string", "mode :: target :: dateformat :: candidate")),
    m(0, n.PRE(/^(GTEQ|GT|LTEQ|LT|EQ|NEQ)$/i, "mode")),
    m(0, n.PRE(n.stdExp.cssSelector, "target")),
    m(0, n.PRE(n.stdExp.dateFormat, "dateFormat")),
    m(0, n.PRE(n.stdExp.cssSelector, "candidate")),
    m(1, b.PRE(HTMLElement, "Is it not an HTML-Element that is tagged with this functionality?")),
  ],
  g,
  "functionality",
  1,
);
window.codbi.registerFunctionality("OnChange.Conditional", g.functionality.bind(g));
function H(h, e) {
  let t = {},
    f = /([DMYHMSdms]{1,4})/g,
    r = h.match(f),
    a = e.split(/\D/).filter((c) => c.length > 0);
  if (!r || r.length !== a.length)
    return console.error("Error: The format string and date string do not have a matching number of components."), null;
  for (let c = 0; c < r.length; c++) {
    let v = r[c],
      l = Number.parseInt(a[c], 10);
    switch (v.charAt(0).toLowerCase()) {
      case "d":
        t.d = l;
        break;
      case "y":
        t.y = l;
        break;
      case "h":
        t.h = l;
        break;
      case "s":
        t.s = l;
        break;
      case "m":
        !t.m && c < 2 ? (t.m = l) : (t.min = l);
        break;
      default:
        break;
    }
  }
  let u = t.y || 0,
    s = (t.m || 1) - 1,
    i = t.d || 1,
    D = t.h || 0,
    y = t.min || 0,
    w = t.s || 0;
  return new Date(u, s, i, D, y, w);
}
export { g as OnChange_Conditional };
