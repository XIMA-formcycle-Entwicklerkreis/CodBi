// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region Matomo
import MatomoTracker from "@jonkoops/matomo-tracker";
// #endregion Matomo
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { IF } from "xdbc/src/DBC/IF";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { DEFINED } from "xdbc/src/DBC/DEFINED";
// #endregion XDBC
import { CodBi, CodBiError } from "../global-scope";
import { OR } from "xdbc/src/DBC/OR";
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
   * or in this functionality's parameter (**URL**) while the functionality parameter takes precedence, and initiates
   * tracking to a specified **Site-ID**. The **Site-ID** is either specified o n the PLugin-Config (**Matomo_SiteID**)
   * or in the functionality's parameter (**SiteID**) while the functionality parameter takes precedence.
   *
   * Config Parameter:
   *  - URL:    The URL of the Matomo-Server that shall track the tagged form.
   *  - SiteID: The ID of the Matomo-Project-Site that shall be used for tracking. */
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE("string", "url")
    @TYPE.PRE("string", "siteid")
    @IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "siteid")
    @IF.PRE(new DEFINED(), new REGEX(REGEX.stdExp.url), "url")
    toLoad: { [key: string]: string },

    @INSTANCE.PRE(HTMLElement)
    toProcess: Element,
  ): void {
    let siteID: number | undefined;
    let url: string | undefined;

    if (toLoad.siteID === undefined || toLoad.siteID === "") {
      siteID = Number.parseInt(
        OR.tsCheck<string>(
          window.codbiSettings.Matomo.SiteID,
          [new DEFINED(), new REGEX(/^\d+$/)],
          "SiteID was not specified in the functionality parameter and is also not specified in the Plugin-Config.",
        ),
      );
    } else {
      siteID = Number.parseInt(toLoad.siteid);
    }

    if (toLoad.url === undefined || toLoad.url === "") {
      url = OR.tsCheck<string>(
        window.codbiSettings.Matomo.URL,
        [new DEFINED(), new REGEX(REGEX.stdExp.url)],
        "URL was not specified in the functionality parameter and is also not specified in the Plugin-Config.",
      );
    } else {
      url = toLoad.url;
    }

    try {
      new MatomoTracker({ siteId: siteID, urlBase: url }).trackPageView();
    } catch (X) {
      window.codbi.log("WARNING", `Matomo Tracking failed due to: ${(X as Error).message}`);
    }
  }
}

window.codbi.registerFunctionality("Matomo.Tracking", Matomo_Tracking.functionality.bind(Matomo_Tracking)); // Register Functionality
