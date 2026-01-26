import { a as f } from "./chunk-K6S6E7GX.js";
import { a as t } from "./chunk-K3A632J4.js";
import { a as g } from "./chunk-MUWAMKOD.js";
import { g as a, h as n } from "./chunk-RS4WWU7K.js";
var s = class s {
  static functionality(e, y) {
    var l, p, m;
    Array.isArray(e.css) && (e.css = e.css[0]);
    let c = document.createElement("style");
    if (e.darkmode) {
      typeof e.darkmode == "string" && (e.darkmode = [e.darkmode]);
      for (let i of e.darkmode) {
        let r = i.split("|");
        r.length === 2 &&
          (e.css = e.css.replace(new RegExp(`${((l = r[0])) == null ? void 0 : l.trim()}_DM`, "g"), r[1].trim()));
      }
    }
    if (e.replacements) {
      typeof e.replacements == "string" && (e.replacements = [e.replacements]);
      for (let i of e.replacements) {
        let r = i.split("|");
        r.length === 2 &&
          (e.css = e.css.replace(new RegExp(`${((p = r[0])) == null ? void 0 : p.trim()}`, "g"), r[1].trim()));
      }
    }
    (c.innerHTML = e.css.replace(/</g, "{").replace(/>/g, "}").replace(/§/g, ",")),
      y.setAttribute("cbCSS", ""),
      e.destination && ((m = document.querySelector(e.destination)) == null || m.appendChild(c));
  }
};
(s.registered = window.codbi.registerFunctionality("HTML.CSS", s.functionality)),
  a(
    [g.ParamvalueProvider, n(0, f.PRE(new t("string"), void 0, void 0, "replacements")), n(0, t.PRE("string", "css"))],
    s,
    "functionality",
    1,
  );
var u = s;
export { u as HTML_CSS };
