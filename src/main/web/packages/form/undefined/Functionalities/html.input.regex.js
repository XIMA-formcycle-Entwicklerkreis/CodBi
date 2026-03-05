import { a as x } from "./chunk-PSEWTT4Z.js";
import { a as l } from "./chunk-4JLAI42Q.js";
import { a as f } from "./chunk-KEJSWGMR.js";
import { a as t } from "./chunk-CDLTIEKC.js";
import { f as y, g as a, h as i, p as o } from "./chunk-UTJJRBTX.js";
var g = y(l(), 1);
var n = class {
  static functionality(e, s) {
    (e.expression = e.expression.replace(/°/, "^")),
      (e.exposeexpression = e.exposeexpression
        ? typeof e.exposeexpression == "string"
          ? e.exposeexpression.toLowerCase() === "true"
          : e.exposeexpression
        : !1);
    let p = (0, g.getJQuery)();
    s.addEventListener("keyup", (r) => {
      r.key !== void 0 && r.key.length === 1 && (r.preventDefault(), r.stopImmediatePropagation(), r.stopPropagation());
    }),
      s.addEventListener("keydown", (r) => {
        r.key !== void 0 &&
          e.keyexpression &&
          r.key.length === 1 &&
          (new RegExp(e.keyexpression, e.keyflags ? e.keyflags : "i").test(r.key) ||
            (r.preventDefault(), r.stopImmediatePropagation(), r.stopPropagation()));
      }),
      s.addEventListener("change", (r) => {
        new RegExp(e.expression, e.flags ? e.flags : "g").test(s.value)
          ? p(s).error("")
          : p(s).error(
              `${e.errorprefix ? e.errorprefix : "Text does not comply to "}${e.exposeexpression ? e.expression : "a certain restriction"}${e.errorpostfix ? ` ${e.errorpostfix}` : "."}`,
            );
      });
  }
};
a(
  [
    o.ParamvalueProvider,
    i(0, t.PRE("string", "expression :: flags :: keyexpression :: keyflags :: errorprefix :: errorpostfix")),
    i(0, t.PRE("string | boolean", "exposeexpression")),
    i(
      1,
      f.PRE(HTMLInputElement, void 0, 'Is it not an <input type = "text"/> that is tagged with this functionality?'),
    ),
    i(1, x.PRE("text", !1, "type")),
  ],
  n,
  "functionality",
  1,
);
window.codbi.registerFunctionality("HTML.Input.REGEX", n.functionality.bind(n));
export { n as HTML_Input_REGEX };
