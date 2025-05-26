import { getJQuery } from "@de-xima/fc-form-renderer";
import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE";
import { TYPE } from "xdbc/src/DBC/TYPE";
/**
 * This [E]lement [P]laceholder registers the "Date.Holidays"-EP that makes requests to "API-Feiertage.de" in order to
 * retrieve german holidays of all states.
 *
 * Config Parameter (order doesn't matter, case-insensitive):
 *  - States:         bw,by,be,bb,hb,hh,he,mv,ni,nw,rp,sl,sn,st,sh,th
 *  - "THIS_YEAR":    Represents the current year and supports arithmetical
 *                    operations ( +/- e.g. THIS_YEAR + 1 = next year)
 *  - "Friedensfest": The Augsburg's festival of peace.
 *  - "KATHOLISCH":   Katholic holidays
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class Date_Holidays {
  /**
   * Checks all "params" for specific data (see {@link Date_Holidays }) and return an {@link Array } of
   * Date-{@link strings}.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  @DBC.ParamvalueProvider
  public static retrieve(
    @AE.PRE(new TYPE("string"))
    params: Array<string>,
  ): Promise<Array<string>> {
    return new Promise((resolve) => {
      const $ = getJQuery();
      const result: Array<string> = new Array<string>();
      const years: Array<string> = new Array<string>();
      const states: Array<string> = new Array<string>();
      const augsburg = params.some((toCheck) => (toCheck as string).toLocaleLowerCase() === "friedensfest");
      const katholic = params.some((toCheck) => (toCheck as string).toLocaleLowerCase() === "katholisch");

      for (const parameter of params) {
        if (Number.isNaN(parameter)) {
          years.push(parameter);
        } else {
          if (parameter.indexOf("this_year") !== -1) {
            let idxOperand: number = parameter.indexOf("+");

            if (idxOperand === -1) {
              idxOperand = parameter.indexOf("-");
            }

            if (idxOperand !== -1) {
              years.push(
                (
                  new Date().getFullYear() +
                  Number.parseInt(parameter.substring(idxOperand + 1)) *
                    (parameter.substring(idxOperand, idxOperand + 1) === "+" ? 1 : -1)
                ).toString(),
              );
            } else {
              years.push(new Date().getFullYear().toString());
            }
          } else if (
            parameter.toLocaleLowerCase().indexOf("friedensfest") === -1 &&
            parameter.toLocaleLowerCase().indexOf("katholisch") === -1
          ) {
            states.push(parameter.toLocaleLowerCase());
          }
        }
      }
      // #endregion Parse parameter.
      // #region Request to https://get.api-feiertage.de
      $.get("https://get.api-feiertage.de", {
        years: years.join(","),
        states: states.join(",").replace(/ /g, ""),
        augsburg: augsburg ? "1" : "0",
        katholisch: katholic ? "true" : "false",
      }).done((data: { [key: string]: unknown }) => {
        if (data.status !== "error") {
          for (const entry of data.feiertage as Array<{ date: string }>) {
            result.push(
              new Date(entry.date.replace(/\./g, "/").replace(/-/g, "/")).toLocaleDateString("de-DE", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }),
            );
          }

          resolve(result);
        }
      });
      // #endregion Request to https://get.api-feiertage.de
    });
  }
  /**
   * States whether this {@link Date_Holidays } was successfully registered
   * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerEP("Date.Holidays", Date_Holidays.retrieve);
  })();
  // #region Initialization
}
