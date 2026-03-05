import { a as u } from "./chunk-7ZUEWSHL.js";
import { a as y } from "./chunk-PSEWTT4Z.js";
import { a as f } from "./chunk-KEJSWGMR.js";
import { a } from "./chunk-SEUS6MHP.js";
import { a as l } from "./chunk-CDLTIEKC.js";
import { g as m, h as t, p as c } from "./chunk-UTJJRBTX.js";
var s = class {
  static functionality(n, e) {
    new y(void 0, !0).check(e[n.property]);
    let g = e[n.property];
    if (g !== void 0) {
      (e[n.property] = ""), Array.isArray(n.replacements) || (n.replacements = [n.replacements]);
      for (let r = 0; r < n.replacements.length; r++) {
        if (n.replacements[r] === void 0) continue;
        let i = g;
        for (let p of Object.keys(n.replacements[r]))
          i =
            i == null
              ? void 0
              : i.replace(
                  new RegExp(`\\[\\(${p}\\)\\]`, "g"),
                  n.replacements[r][p] !== void 0 ? n.replacements[r][p] : "",
                );
        r < n.replacements.length - 1, (e[n.property] += i);
      }
      e.setAttribute("style", `${e.getAttribute("style")};${n.css}`);
    }
  }
};
m(
  [
    c.ParamvalueProvider,
    t(0, u.PRE("replacements")),
    t(0, l.PRE("object | object[]", "replacements")),
    t(0, u.PRE("property")),
    t(0, a.PRE(a.stdExp.property, "property")),
    t(0, l.PRE("string", "css")),
    t(1, f.PRE(HTMLElement, void 0, "Is it not an HTML-Element that is tagged with this functionality?")),
  ],
  s,
  "functionality",
  1,
);
window.codbi.registerFunctionality("HTML.Text.Mapper", s.functionality.bind(s));
export { s as HTML_Text_Mapper };
