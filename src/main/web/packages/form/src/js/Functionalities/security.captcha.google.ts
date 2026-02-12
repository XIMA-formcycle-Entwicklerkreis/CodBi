// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { DEFINED } from "xdbc/src/DBC/DEFINED";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { TYPE } from "xdbc/src/DBC/TYPE";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link Security_Captcha_Google.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class Security_Captcha_Google {
  /**
   * This functionality needs a site key that can be obtained at https://developers.google.com/recaptcha and
   * the URL where to load the captcha script from (e.g. https://www.google.com/recaptcha/api.js).
   *
   * It injects Google's ReCaptcha in a div that has to have the class "g-recaptcha" (only the first found
   * div tagged with this CSS class will be used as the container for the captcha).
   *
   * Config Parameter:
   *  - SiteKey:          The sitekey received from https://developers.google.com/recaptcha.
   *  - DataCallback:     The optional global callback method for when the captcha provides a result.
   *  - DataCallbackCode: Optional code to be executed when the captcha provides a result.
   *  - Script:           The Google ReCaptcha script's address.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    @DEFINED.PRE("sitekey :: script")
    @TYPE.PRE("string", "sitekey :: datacallback :: datacallbackcode :: script")
    @REGEX.PRE(/^[0-9A-Za-z_-]{40}$/, "sitekey")
    @REGEX.PRE(REGEX.stdExp.url, "script")
    @REGEX.PRE(REGEX.stdExp.property, "datacallback")
    toLoad: { [key: string]: unknown },

    toProcess: Element,
  ): void {
    const script: HTMLScriptElement = document.createElement("script");

    script.onload = (): undefined => {
      const captchaContainer: HTMLElement | undefined = getJQuery()(".g-recaptcha")[0];

      if (captchaContainer && toLoad.sitekey && typeof toLoad.sitekey === "string") {
        captchaContainer.setAttribute("data-sitekey", toLoad.sitekey as string);
        // If a callback global method was specified and is of valid type and signature...
        if (
          toLoad.datacallback &&
          typeof toLoad.datacallback === "string" &&
          typeof (window as unknown as { [key: string]: unknown })[toLoad.datacallback as string] === "function" &&
          ((window as unknown as { [key: string]: unknown })[toLoad.datacallback as string] as () => unknown).length ===
            0
        ) {
          captchaContainer.setAttribute("data-callback", toLoad.datacallback);
        }
        // If, for convenience, code to evaluate was specified...
        if (toLoad.datacallbackcode && typeof toLoad.datacallbackcode === "string") {
          const inlineScript = document.createElement("script");
          inlineScript.type = "text/javascript";
          inlineScript.text = toLoad.datacallbackcode as string;

          document.head.appendChild(inlineScript);
          inlineScript.remove();
        }
      }
    };

    script.src = toLoad.script as string;

    document.head.appendChild(script);
  }
}

window.codbi.registerFunctionality(
  "Security.Captcha.Google",
  Security_Captcha_Google.functionality.bind(Security_Captcha_Google),
); // Initialization
