// #region Imports
// #region XDBC
import { TYPE } from "xdbc/src/DBC/TYPE";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { EQ } from "xdbc/src/DBC/EQ";
// #endregion XDBC
import { HTML_Input_Transformer } from "./html.input.transformer";
// #endregion Imports
/**
 * Provides the {@link HTML_Input_Transformer.functionality } along with the {@link HTML_Input_Trans_Capital.transformer }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
export class HTML_Input_Trans_NTW extends HTML_Input_Transformer {
  /**
   * Turns a number into its word representation, separating each digit with a dash.
   *
   * ### Config Parameter:
   * - NumberWords:     The {@link Array } of {@link string }s representing the word for each digit from 0 to 9.
   *                    The index of the {@link string } in the {@link Array } corresponds to the digit it represents.
   * - PreFix:          The {@link string } that shall be prepended to the result.
   * - PostFix:         The {@link string } that shall be appended to the result.
   *
   * @param toTransform The {@link string } to transform.
   * @param toLoad      As provided by the **CodBi**.
   *
   * @return The {@link string } with the {@link toLoad.extractor } and the {@link toLoad.replacements } replaced. */
  public static override get transformer(): (toTransform: string, toLoad: { [key: string]: unknown }) => string {
    return (toTransform: string, toLoad: { [key: string]: unknown }): string => {
      // biome-ignore lint/style/noParameterAssign: Proactive Design.
      toTransform = toTransform.replace(/\./g, "").toString();

      const mainNumber = toTransform.split(",")[0];

      let result = "";

      for (let i = 0; i < mainNumber.length; i++) {
        if (i > 0) {
          result += "-";
        }

        result += (toLoad.numberwords as Array<string>)[Number.parseInt(mainNumber.charAt(i))];
      }

      return `${(toLoad.prefix ?? "") as string}${result}${(toLoad.postfix ?? "") as string}`;
    };
  }
  /**
   * Invokes {@link HTML_Input_Transformer.functionality } with this {@link HTML_Input_Trans_NTW }'s
   * {@link HTML_Input_Trans_Capital.transformer }.
   *
   * @param toLoad    As provided bny the **CodBi**.
   * @param toProcess As provided bny the **CodBi**. */
  public static override functionality(
    @TYPE.PRE("string", "prefix, postfix")
    @INSTANCE.PRE(Array<string>, "numberwords")
    toLoad: { [key: string]: unknown },

    @INSTANCE.PRE(HTMLInputElement, undefined, "Isn't it an <input> that is tagged by this functionality?")
    @EQ.PRE("text", false, "@type", 'Isn\'t it an <input type = "text"> that is tagged by this functionality?')
    toProcess: Element,
  ): void {
    HTML_Input_Transformer.functionality(toLoad, toProcess, HTML_Input_Trans_NTW.transformer);
  }
}

window.codbi.registerFunctionality(
  "HTML.Input.Trans.NTW",
  HTML_Input_Trans_NTW.functionality.bind(HTML_Input_Trans_NTW),
);
