// #region Imports
// #endregion Imports
/**
 * Finds the objects within an {@link Array } that have a specific **property** with a specific **value**.
 * If a single object is found, no {@link Array } will be returned, if no object is found an empty {@Array }.
 *
 * Config Parameter:
 * - 1st: The **name** of the property to look for.
 * - 2nd: The **value** the property to look for has to have.
 * - 3rd: The {@link Array } of objects to scan.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class F {
  /**
   * Implements the {@link F } Element-Placeholder.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  public static retrieve(params: Array<unknown>): Array<unknown> | unknown {
    const result = [];

    for (const candidate of params[2] as []) {
      if (candidate[params[0] as string] === params[1]) {
        result.push(candidate);
      }
    }

    return result;
  }
  // #region Initialization
  /**
   * States whether this {@link F } was successfully registered
   * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerEP("F", F.retrieve);
  })();
  // #region Initialization
}
