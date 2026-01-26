import { a as i } from "./chunk-K3A632J4.js";
import { a as x } from "./chunk-QM2ZX7FA.js";
import { a as l } from "./chunk-W23DHSE2.js";
import { a as f } from "./chunk-MUWAMKOD.js";
import { f as o, g as a, h as s } from "./chunk-RS4WWU7K.js";
var y = o(l(), 1);
var p = class p {
  static functionality(r, n) {
    Array.isArray(r.expression) && (r.expression = r.expression[0]),
      Array.isArray(r.errorprefix) && (r.errorprefix = r.errorprefix[0]),
      Array.isArray(r.errorpostfix) && (r.errorpostfix = r.errorpostfix[0]),
      Array.isArray(r.exposeexpression) && (r.exposeexpression = r.exposeexpression[0]),
      (r.expression = r.expression.replace(/°/, "^"));
    let t = (0, y.getJQuery)();
    n.addEventListener("keyup", (e) => {
      e.key !== void 0 && e.key.length === 1 && (e.preventDefault(), e.stopImmediatePropagation(), e.stopPropagation());
    }),
      n.addEventListener("keydown", (e) => {
        e.key !== void 0 &&
          r.keyexpression &&
          e.key.length === 1 &&
          (new RegExp(r.keyexpression, r.keyflags ? r.keyflags : "i").test(e.key) ||
            (e.preventDefault(), e.stopImmediatePropagation(), e.stopPropagation()));
      }),
      n.addEventListener("change", (e) => {
        new RegExp(r.expression, r.flags ? r.flags : "g").test(e.target.value)
          ? t(n).error("")
          : t(n).error(
              `${r.errorprefix ? r.errorprefix : "Text does not comply to "}${r.exposeexpression && r.exposeexpression.toLowerCase() === "true" ? r.expression : "a certain restriction"}${r.errorpostfix ? ` ${r.errorpostfix}` : "."}`,
            );
      });
  }
};
(p.registered = window.codbi.registerFunctionality("HTML.Input.REGEX", p.functionality)),
  a(
    [
      f.ParamvalueProvider,
      s(0, i.PRE("string", "expression")),
      s(0, i.PRE("string", "exposeexpression")),
      s(0, i.PRE("string", "flags")),
      s(0, i.PRE("string", "errorprefix")),
      s(0, i.PRE("string", "errorpostfix")),
      s(1, x.PRE("INPUT", !1, "tagName")),
    ],
    p,
    "functionality",
    1,
  );
var g = p;
export { g as HTML_Input_REGEX };
