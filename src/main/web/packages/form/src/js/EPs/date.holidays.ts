// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE";
import { TYPE } from "xdbc/src/DBC/TYPE";
// #endregion XDBC
// #endregion Imports
/** The type of requests needed to identify identical requests. */
type ApiRequest = {
  /** The requested years. */
  years: string[];
  /** The requested states. */
  states: string[];
  /** Whether the Augsburger Friedensfest shall be included. */
  augsburg: boolean;
  /** Whether catholic holidays shall be included. */
  catholic: boolean;
};
/**
 * This **E**lement **P**laceholder registers the "Date.Holidays"-EP that makes requests to "API-Feiertage.de" in order to
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
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design
export class Date_Holidays {
  /** Stores the requests already made. */
  protected static buffer: Map<string, Array<string> | Promise<Array<string>>> = new Map<
    string,
    Array<string> | Promise<Array<string>>
  >();
  /**
   * Generates a key-{@link string } that may be used to compare to {@link ApiRequest }s with each other.
   *
   * @param from The {@link ApiRequest } to generate the key from.
   *
   * @returns The requested key. */
  protected static genComparableKey(from: ApiRequest): string {
    const sortedYears = [...from.years].sort().join("-");
    const sortedStates = [...from.states].sort().join("-");

    return `${sortedYears}_${sortedStates}_${from.augsburg ? "T" : "F"}_${from.catholic ? "T" : "F"}`;
  }
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
    // #region Determine parameter.
    const result: Array<string> = new Array<string>();
    const years: Array<string> = new Array<string>();
    const states: Array<string> = new Array<string>();
    const augsburg = params.some((toCheck) => (toCheck as string).toLocaleLowerCase() === "friedensfest");
    const katholic = params.some((toCheck) => (toCheck as string).toLocaleLowerCase() === "katholisch");

    for (const parameter of params) {
      if (Number.isNaN(parameter)) {
        years.push(parameter);
      } else {
        if (parameter.toLowerCase().indexOf("this_year") !== -1) {
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
    // #endregion Determine parameter.
    const promise = new Promise<Array<string>>((resolve) => {
      // #region Resolve from Buffer if available.
      if (
        Date_Holidays.buffer.has(
          Date_Holidays.genComparableKey({
            years: years,
            states: states,
            augsburg: augsburg,
            catholic: katholic,
          } as ApiRequest),
        )
      ) {
        if (
          Array.isArray(
            Date_Holidays.buffer.get(
              Date_Holidays.genComparableKey({
                years: years,
                states: states,
                augsburg: augsburg,
                catholic: katholic,
              } as ApiRequest),
            ),
          )
        ) {
          resolve(
            Date_Holidays.buffer.get(
              Date_Holidays.genComparableKey({
                years: years,
                states: states,
                augsburg: augsburg,
                catholic: katholic,
              } as ApiRequest),
            ) as Array<string>,
          );

          return;
        } else {
          (
            Date_Holidays.buffer.get(
              Date_Holidays.genComparableKey({
                years: years,
                states: states,
                augsburg: augsburg,
                catholic: katholic,
              } as ApiRequest),
            ) as Promise<Array<string>>
          ).then((result: Array<string>) => {
            resolve(result);
          });
        }

        return;
      }
      // #endregion Resolve from Buffer if available.
      const $ = getJQuery();
      // #endregion Parse parameter.
      $.ajax({
        url: `${window.codbi.baseURL}plugin?name=CodBi_Holidays_FeiertageDE`,
        type: "GET",
        headers: {
          years: years.join(","),
          states: states.join(",").replace(/ /g, ""),
          augsburg: augsburg ? "1" : "0",
          catholic: katholic ? "true" : "false",
        },
      }).done((data: string) => {
        const incoming = JSON.parse(data);

        if (incoming.status !== "error") {
          for (const entry of incoming.feiertage as Array<{ date: string }>) {
            result.push(
              new Date(entry.date.replace(/\./g, "/").replace(/-/g, "/")).toLocaleDateString("de-DE", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }),
            );
          }
          // #region Buffer request
          Date_Holidays.buffer.set(
            Date_Holidays.genComparableKey({
              years: years,
              states: states,
              augsburg: augsburg,
              catholic: katholic,
            } as ApiRequest),
            result,
          );
          // #endregion Buffer request
          resolve(result);
        }
      });
    });
    // #region Buffer request promise.
    Date_Holidays.buffer.set(
      Date_Holidays.genComparableKey({
        years: years,
        states: states,
        augsburg: augsburg,
        catholic: katholic,
      } as ApiRequest),
      promise,
    );
    // #endregion Buffer request promise.
    return promise;
  }
  /**
   * States whether this {@link Date_Holidays } was successfully registered
   * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerEP("Date.Holidays", Date_Holidays.retrieve);
  })();
  // #region Initialization
}
