import { a as p } from "./chunk-SEUS6MHP.js";
import { a as i } from "./chunk-CDLTIEKC.js";
import { g as a, h as f, p as y } from "./chunk-UTJJRBTX.js";
var r = class r {
  static functionality(e, u) {
    var l, m, g;
    Array.isArray(e.css) ? (e.css = i.tsCheck(e.css[0], "string")) : (e.css = i.tsCheck(e.css, "string"));
    let n = document.createElement("style");
    if (e.darkmode) {
      typeof e.darkmode == "string" && (e.darkmode = [e.darkmode]);
      for (let c of e.darkmode) {
        let s = p.tsCheck(c, r.rexpReplacements).split("|");
        s.length >= 2 &&
          (e.css = e.css.replace(new RegExp(`${((l = s[0])) == null ? void 0 : l.trim()}_DM`, "g"), s[1].trim()));
      }
    }
    if (e.replacements) {
      typeof e.replacements == "string" && (e.replacements = [e.replacements]);
      for (let c of e.replacements) {
        let s = p.tsCheck(c, r.rexpReplacements).split("|");
        s.length >= 2 &&
          (e.css = e.css.replace(new RegExp(`${((m = s[0])) == null ? void 0 : m.trim()}`, "g"), s[1].trim()));
      }
    }
    (n.innerHTML = e.css.replace(/</g, "{").replace(/>/g, "}").replace(/§/g, ",")),
      u.setAttribute("cbCSS", ""),
      e.destination
        ? (g = document.querySelector(e.destination)) == null || g.appendChild(n)
        : document.head.appendChild(n);
  }
};
(r.rexpReplacements = /^.+\s*\|\s*.+$/),
  a([y.ParamvalueProvider, f(0, i.PRE("string", "destination"))], r, "functionality", 1);
var t = r;
window.codbi.registerFunctionality("HTML.CSS", t.functionality.bind(t));
export { t as HTML_CSS };
