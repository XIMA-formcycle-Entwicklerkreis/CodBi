import { a } from "./chunk-JL2EL352.js";
import { a as y } from "./chunk-K3A632J4.js";
import { a as u } from "./chunk-QM2ZX7FA.js";
import { a as c } from "./chunk-MUWAMKOD.js";
import { g, h as t } from "./chunk-RS4WWU7K.js";
var i = class i {
  static functionality(n, e) {
    new u(void 0, !0).check(e[n.property]);
    let l = e[n.property];
    if (l !== void 0) {
      (e[n.property] = ""), Array.isArray(n.replacements) || (n.replacements = [n.replacements]);
      for (let r = 0; r < n.replacements.length; r++) {
        if (n.replacements[r] === void 0) continue;
        let s = l;
        for (let p of Object.keys(n.replacements[r]))
          s =
            s == null
              ? void 0
              : s.replace(
                  new RegExp(`\\[\\(${p}\\)\\]`, "g"),
                  n.replacements[r][p] !== void 0 ? n.replacements[r][p] : "",
                );
        r < n.replacements.length - 1, (e[n.property] += s);
      }
      e.setAttribute("style", `${e.getAttribute("style")};${n.css}`);
    }
  }
};
(i.registered = window.codbi.registerFunctionality("HTML.Text.Mapper", i.functionality)),
  g(
    [
      c.ParamvalueProvider,
      t(0, u.PRE(void 0, !0, "replacements")),
      t(0, a.PRE(a.stdExp.property, "property")),
      t(0, y.PRE("string", "css")),
    ],
    i,
    "functionality",
    1,
  );
var f = i;
export { f as HTML_Text_Mapper };
