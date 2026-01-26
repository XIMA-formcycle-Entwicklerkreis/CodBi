import { a as t } from "./chunk-JL2EL352.js";
import { a as r } from "./chunk-W23DHSE2.js";
import { a as n } from "./chunk-MUWAMKOD.js";
import { f as c, g as o, h as a } from "./chunk-RS4WWU7K.js";
var i = c(r(), 1);
var _Security_Captcha_Google = class _Security_Captcha_Google {
  static functionality(toLoad, toProcess) {
    let script = document.createElement("script");
    (script.onload = () => {
      let captchaContainer = (0, i.getJQuery)()(".g-recaptcha")[0];
      captchaContainer &&
        toLoad.sitekey &&
        typeof toLoad.sitekey == "string" &&
        (captchaContainer.setAttribute("data-sitekey", toLoad.sitekey),
        toLoad.datacallback &&
          typeof toLoad.datacallback == "string" &&
          typeof window[toLoad.datacallback] == "function" &&
          window[toLoad.datacallback].length === 0 &&
          captchaContainer.setAttribute("data-callback", toLoad.datacallback),
        toLoad.datacallbackcode && typeof toLoad.datacallbackcode == "string" && eval(toLoad.datacallbackcode));
    }),
      (script.src = toLoad.script),
      document.head.appendChild(script);
  }
};
(_Security_Captcha_Google.registered = window.codbi.registerFunctionality(
  "Security.Captcha.Google",
  _Security_Captcha_Google.functionality,
)),
  o(
    [n.ParamvalueProvider, a(0, t.PRE(/^[0-9A-Za-z_-]{40}$/, "sitekey")), a(0, t.PRE(t.stdExp.url, "script"))],
    _Security_Captcha_Google,
    "functionality",
    1,
  );
var e = _Security_Captcha_Google;
export { e as Security_Captcha_Google };
