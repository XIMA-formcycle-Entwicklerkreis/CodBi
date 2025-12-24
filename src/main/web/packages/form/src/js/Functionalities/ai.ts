// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { REGEX } from "xdbc/src/DBC/REGEX";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link AI.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class AI {
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
    @REGEX.PRE(/^[0-9A-Za-z_-]{40}$/, "sitekey")
    @REGEX.PRE(REGEX.stdExp.url, "script")
    toLoad: { [key: string]: unknown },
    toProcess: Element,
  ): void {}
  // #region Initialization
  /**
   * States whether this {@link AI } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("AI", AI.functionality);
  })();
  // #endregion Initialization
}
