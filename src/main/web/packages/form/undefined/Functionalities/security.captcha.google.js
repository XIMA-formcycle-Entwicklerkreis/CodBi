import { a as d } from "./chunk-7ZUEWSHL.js";
import { a as m } from "./chunk-4JLAI42Q.js";
import { a } from "./chunk-SEUS6MHP.js";
import { a as p } from "./chunk-CDLTIEKC.js";
import { f as o, g as r, h as e, p as l } from "./chunk-UTJJRBTX.js";
var k = o(m(), 1);
var n = class {
  static functionality(t, y) {
    let c = document.createElement("script");
    (c.onload = () => {
      let s = (0, k.getJQuery)()(".g-recaptcha")[0];
      if (
        s &&
        t.sitekey &&
        typeof t.sitekey == "string" &&
        (s.setAttribute("data-sitekey", t.sitekey),
        t.datacallback &&
          typeof t.datacallback == "string" &&
          typeof window[t.datacallback] == "function" &&
          window[t.datacallback].length === 0 &&
          s.setAttribute("data-callback", t.datacallback),
        t.datacallbackcode && typeof t.datacallbackcode == "string")
      ) {
        let i = document.createElement("script");
        (i.type = "text/javascript"), (i.text = t.datacallbackcode), document.head.appendChild(i), i.remove();
      }
    }),
      (c.src = t.script),
      document.head.appendChild(c);
  }
};
r(
  [
    l.ParamvalueProvider,
    e(0, d.PRE("sitekey :: script")),
    e(0, p.PRE("string", "sitekey :: datacallback :: datacallbackcode :: script")),
    e(0, a.PRE(/^[0-9A-Za-z_-]{40}$/, "sitekey")),
    e(0, a.PRE(a.stdExp.url, "script")),
    e(0, a.PRE(a.stdExp.property, "datacallback")),
  ],
  n,
  "functionality",
  1,
);
window.codbi.registerFunctionality("Security.Captcha.Google", n.functionality.bind(n));
export { n as Security_Captcha_Google };
