// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region Matomo
import MatomoTracker from "@jonkoops/matomo-tracker";
// #endregion Matomo
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { REGEX } from "xdbc/src/DBC/REGEX";
// #endregion XDBC
import { CodBiError } from "../global-scope.js";
// #endregion Imports
/**
 * Provides the {@link HTML_Select_Injection.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class Matomo_Tracking {
  /**
   * Registers the "Matomo.Tracking"-Functionality.
   *
   * This functionality connects to a **Matomo-Server**, that is either specified in the Plugin-Config (**Matomo_URL**)
   * or in this functionalitie's parameter (**URL**) while the functionality parameter takes precedence, and initiates
   * tracking to a specified **Site-ID**. The **Site-ID** is either specified o n the PLugin-Config (**Matomo_SiteID**)
   * or in the functionalitie's parameter (**SiteID**) while the functionality parameter takes precedence.
   *
   * Config Parameter:
   *  - URL:    The URL of the Matomo-Server that shall track the tagged form.
   *  - SiteID: The ID of the Matomo-Project-Site that shall be used for tracking. */
  @DBC.ParamvalueProvider
  public static functionality(toLoad: { [key: string]: string }, toProcess: Element): void {
    const siteID = Number.parseInt(toLoad.siteid || window.codbiSettings.Matomo.SiteID);
    const url = toLoad.url || window.codbiSettings.Matomo.URL;

    if (siteID === undefined || url === undefined) {
      throw new CodBiError(
        `Functionality / Matomo.Tracking was activated but ${siteID === undefined ? (url === undefined ? "no SiteID and no Matomo-Server-URL" : "no SiteID") : "no Matomo-Server-URL"} was specified.`,
      );
    }

    new MatomoTracker({ siteId: Number.parseInt(toLoad.siteid), urlBase: toLoad.url }).trackPageView();
  }
  // #region Initialization
  /**
   * States whether this {@link Matomo_Tracking } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("Matomo.Tracking", Matomo_Tracking.functionality);
  })();
  // #endregion Initialization
}
