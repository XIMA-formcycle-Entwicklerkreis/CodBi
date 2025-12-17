/**
 * An Elementplaceholder sorts the {@link Array } passed as the **1st** parameter in
 * alphabetical (lexicographical) order.
 *
 * Config Parameter:
 * - 1st: The {@link Array } to sort.
 * - 2nd: The optional name of a property to use to sort elements of the given {@link Array }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class Sorted {
  /**
   * Implements the **Sorted** - Element-Placeholder.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  public static retrieve(params: Array<unknown>): Array<unknown> {
    if (params.length > 1) {
      (params[0] as []).sort((a, b) => {
        const nameA = (a[params[1] as string] as string).toUpperCase();
        const nameB = (b[params[1] as string] as string).toUpperCase();

        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      });

      return params[0] as Array<unknown>;
    }

    return (params as string[]).sort();
  }
  // #region Initialization
  /**
   * States whether this {@link Sorted } was successfully registered
   * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerEP("Sorted", Sorted.retrieve);
  })();
  // #region Initialization
}
