import { HTML_Input_Transformer } from "./chunk-2KATTLXM.js";
import { EQ } from "./chunk-RI3LWO6O.js";
import { TYPE } from "./chunk-O5T7YW22.js";
import { INSTANCE } from "./chunk-53TEMTGA.js";
import "./chunk-LFRFVRJV.js";
import "./chunk-ZTMSSRTV.js";
import { __decorateClass, __decorateParam } from "./chunk-AOJQKO6T.js";

// src/js/Functionalities/html.input.trans.ntw.ts
var _HTML_Input_Trans_NTW = class _HTML_Input_Trans_NTW extends HTML_Input_Transformer {
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
  static get transformer() {
    return (toTransform, toLoad) => {
      toTransform = toTransform.replace(/\./g, "").toString();
      const mainNumber = toTransform.split(",")[0];
      let result = "";
      for (let i = 0; i < mainNumber.length; i++) {
        if (i > 0) {
          result += "-";
        }
        result += toLoad.numberwords[Number.parseInt(mainNumber.charAt(i))];
      }
      return `${toLoad.prefix ?? ""}${result}${toLoad.postfix ?? ""}`;
    };
  }
  /**
   * Invokes {@link HTML_Input_Transformer.functionality } with this {@link HTML_Input_Trans_NTW }'s
   * {@link HTML_Input_Trans_Capital.transformer }.
   *
   * @param toLoad    As provided bny the **CodBi**.
   * @param toProcess As provided bny the **CodBi**. */
  static functionality(toLoad, toProcess) {
    HTML_Input_Transformer.functionality(toLoad, toProcess, _HTML_Input_Trans_NTW.transformer);
  }
};
__decorateClass(
  [
    __decorateParam(0, TYPE.PRE("string", "prefix, postfix")),
    __decorateParam(0, INSTANCE.PRE(Array, "numberwords")),
    __decorateParam(
      1,
      INSTANCE.PRE(HTMLInputElement, void 0, "Isn't it an <input> that is tagged by this functionality?"),
    ),
    __decorateParam(
      1,
      EQ.PRE("text", false, "@type", `Isn't it an <input type = "text"> that is tagged by this functionality?`),
    ),
  ],
  _HTML_Input_Trans_NTW,
  "functionality",
  1,
);
var HTML_Input_Trans_NTW = _HTML_Input_Trans_NTW;
window.codbi.registerFunctionality(
  "HTML.Input.Trans.NTW",
  HTML_Input_Trans_NTW.functionality.bind(HTML_Input_Trans_NTW),
);
export { HTML_Input_Trans_NTW };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2pzL0Z1bmN0aW9uYWxpdGllcy9odG1sLmlucHV0LnRyYW5zLm50dy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gI3JlZ2lvbiBJbXBvcnRzXG4vLyAjcmVnaW9uIFhEQkNcbmltcG9ydCB7IFRZUEUgfSBmcm9tIFwieGRiYy9zcmMvREJDL1RZUEVcIjtcbmltcG9ydCB7IElOU1RBTkNFIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9JTlNUQU5DRVwiO1xuaW1wb3J0IHsgRVEgfSBmcm9tIFwieGRiYy9zcmMvREJDL0VRXCI7XG4vLyAjZW5kcmVnaW9uIFhEQkNcbmltcG9ydCB7IEhUTUxfSW5wdXRfVHJhbnNmb3JtZXIgfSBmcm9tIFwiLi9odG1sLmlucHV0LnRyYW5zZm9ybWVyXCI7XG4vLyAjZW5kcmVnaW9uIEltcG9ydHNcbi8qKlxuICogUHJvdmlkZXMgdGhlIHtAbGluayBIVE1MX0lucHV0X1RyYW5zZm9ybWVyLmZ1bmN0aW9uYWxpdHkgfSBhbG9uZyB3aXRoIHRoZSB7QGxpbmsgSFRNTF9JbnB1dF9UcmFuc19DYXBpdGFsLnRyYW5zZm9ybWVyIH0uXG4gKlxuICogQHJlbWFya3NcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoU2FsdmF0b3JlLkNhbGxhcmlAQW5zYmFjaC5kZSkgKi9cbmV4cG9ydCBjbGFzcyBIVE1MX0lucHV0X1RyYW5zX05UVyBleHRlbmRzIEhUTUxfSW5wdXRfVHJhbnNmb3JtZXIge1xuICAvKipcbiAgICogVHVybnMgYSBudW1iZXIgaW50byBpdHMgd29yZCByZXByZXNlbnRhdGlvbiwgc2VwYXJhdGluZyBlYWNoIGRpZ2l0IHdpdGggYSBkYXNoLlxuICAgKlxuICAgKiAjIyMgQ29uZmlnIFBhcmFtZXRlcjpcbiAgICogLSBOdW1iZXJXb3JkczogICAgIFRoZSB7QGxpbmsgQXJyYXkgfSBvZiB7QGxpbmsgc3RyaW5nIH1zIHJlcHJlc2VudGluZyB0aGUgd29yZCBmb3IgZWFjaCBkaWdpdCBmcm9tIDAgdG8gOS5cbiAgICogICAgICAgICAgICAgICAgICAgIFRoZSBpbmRleCBvZiB0aGUge0BsaW5rIHN0cmluZyB9IGluIHRoZSB7QGxpbmsgQXJyYXkgfSBjb3JyZXNwb25kcyB0byB0aGUgZGlnaXQgaXQgcmVwcmVzZW50cy5cbiAgICogLSBQcmVGaXg6ICAgICAgICAgIFRoZSB7QGxpbmsgc3RyaW5nIH0gdGhhdCBzaGFsbCBiZSBwcmVwZW5kZWQgdG8gdGhlIHJlc3VsdC5cbiAgICogLSBQb3N0Rml4OiAgICAgICAgIFRoZSB7QGxpbmsgc3RyaW5nIH0gdGhhdCBzaGFsbCBiZSBhcHBlbmRlZCB0byB0aGUgcmVzdWx0LlxuICAgKlxuICAgKiBAcGFyYW0gdG9UcmFuc2Zvcm0gVGhlIHtAbGluayBzdHJpbmcgfSB0byB0cmFuc2Zvcm0uXG4gICAqIEBwYXJhbSB0b0xvYWQgICAgICBBcyBwcm92aWRlZCBieSB0aGUgKipDb2RCaSoqLlxuICAgKlxuICAgKiBAcmV0dXJuIFRoZSB7QGxpbmsgc3RyaW5nIH0gd2l0aCB0aGUge0BsaW5rIHRvTG9hZC5leHRyYWN0b3IgfSBhbmQgdGhlIHtAbGluayB0b0xvYWQucmVwbGFjZW1lbnRzIH0gcmVwbGFjZWQuICovXG4gIHB1YmxpYyBzdGF0aWMgb3ZlcnJpZGUgZ2V0IHRyYW5zZm9ybWVyKCk6ICh0b1RyYW5zZm9ybTogc3RyaW5nLCB0b0xvYWQ6IHsgW2tleTogc3RyaW5nXTogdW5rbm93biB9KSA9PiBzdHJpbmcge1xuICAgIHJldHVybiAodG9UcmFuc2Zvcm06IHN0cmluZywgdG9Mb2FkOiB7IFtrZXk6IHN0cmluZ106IHVua25vd24gfSk6IHN0cmluZyA9PiB7XG4gICAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdHlsZS9ub1BhcmFtZXRlckFzc2lnbjogUHJvYWN0aXZlIERlc2lnbi5cbiAgICAgIHRvVHJhbnNmb3JtID0gdG9UcmFuc2Zvcm0ucmVwbGFjZSgvXFwuL2csIFwiXCIpLnRvU3RyaW5nKCk7XG5cbiAgICAgIGNvbnN0IG1haW5OdW1iZXIgPSB0b1RyYW5zZm9ybS5zcGxpdChcIixcIilbMF07XG5cbiAgICAgIGxldCByZXN1bHQgPSBcIlwiO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1haW5OdW1iZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGkgPiAwKSB7XG4gICAgICAgICAgcmVzdWx0ICs9IFwiLVwiO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzdWx0ICs9ICh0b0xvYWQubnVtYmVyd29yZHMgYXMgQXJyYXk8c3RyaW5nPilbTnVtYmVyLnBhcnNlSW50KG1haW5OdW1iZXIuY2hhckF0KGkpKV07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBgJHsodG9Mb2FkLnByZWZpeCA/PyBcIlwiKSBhcyBzdHJpbmd9JHtyZXN1bHR9JHsodG9Mb2FkLnBvc3RmaXggPz8gXCJcIikgYXMgc3RyaW5nfWA7XG4gICAgfTtcbiAgfVxuICAvKipcbiAgICogSW52b2tlcyB7QGxpbmsgSFRNTF9JbnB1dF9UcmFuc2Zvcm1lci5mdW5jdGlvbmFsaXR5IH0gd2l0aCB0aGlzIHtAbGluayBIVE1MX0lucHV0X1RyYW5zX05UVyB9J3NcbiAgICoge0BsaW5rIEhUTUxfSW5wdXRfVHJhbnNfQ2FwaXRhbC50cmFuc2Zvcm1lciB9LlxuICAgKlxuICAgKiBAcGFyYW0gdG9Mb2FkICAgIEFzIHByb3ZpZGVkIGJueSB0aGUgKipDb2RCaSoqLlxuICAgKiBAcGFyYW0gdG9Qcm9jZXNzIEFzIHByb3ZpZGVkIGJueSB0aGUgKipDb2RCaSoqLiAqL1xuICBwdWJsaWMgc3RhdGljIG92ZXJyaWRlIGZ1bmN0aW9uYWxpdHkoXG4gICAgQFRZUEUuUFJFKFwic3RyaW5nXCIsIFwicHJlZml4LCBwb3N0Zml4XCIpXG4gICAgQElOU1RBTkNFLlBSRShBcnJheTxzdHJpbmc+LCBcIm51bWJlcndvcmRzXCIpXG4gICAgdG9Mb2FkOiB7IFtrZXk6IHN0cmluZ106IHVua25vd24gfSxcblxuICAgIEBJTlNUQU5DRS5QUkUoSFRNTElucHV0RWxlbWVudCwgdW5kZWZpbmVkLCBcIklzbid0IGl0IGFuIDxpbnB1dD4gdGhhdCBpcyB0YWdnZWQgYnkgdGhpcyBmdW5jdGlvbmFsaXR5P1wiKVxuICAgIEBFUS5QUkUoXCJ0ZXh0XCIsIGZhbHNlLCBcIkB0eXBlXCIsICdJc25cXCd0IGl0IGFuIDxpbnB1dCB0eXBlID0gXCJ0ZXh0XCI+IHRoYXQgaXMgdGFnZ2VkIGJ5IHRoaXMgZnVuY3Rpb25hbGl0eT8nKVxuICAgIHRvUHJvY2VzczogRWxlbWVudCxcbiAgKTogdm9pZCB7XG4gICAgSFRNTF9JbnB1dF9UcmFuc2Zvcm1lci5mdW5jdGlvbmFsaXR5KHRvTG9hZCwgdG9Qcm9jZXNzLCBIVE1MX0lucHV0X1RyYW5zX05UVy50cmFuc2Zvcm1lcik7XG4gIH1cbn1cblxud2luZG93LmNvZGJpLnJlZ2lzdGVyRnVuY3Rpb25hbGl0eShcbiAgXCJIVE1MLklucHV0LlRyYW5zLk5UV1wiLFxuICBIVE1MX0lucHV0X1RyYW5zX05UVy5mdW5jdGlvbmFsaXR5LmJpbmQoSFRNTF9JbnB1dF9UcmFuc19OVFcpLFxuKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBYU8sSUFBTSx3QkFBTixNQUFNLDhCQUE2Qix1QkFBdUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBYy9ELFdBQTJCLGNBQW1GO0FBQzVHLFdBQU8sQ0FBQyxhQUFxQixXQUErQztBQUUxRSxvQkFBYyxZQUFZLFFBQVEsT0FBTyxFQUFFLEVBQUUsU0FBUztBQUV0RCxZQUFNLGFBQWEsWUFBWSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBRTNDLFVBQUksU0FBUztBQUViLGVBQVMsSUFBSSxHQUFHLElBQUksV0FBVyxRQUFRLEtBQUs7QUFDMUMsWUFBSSxJQUFJLEdBQUc7QUFDVCxvQkFBVTtBQUFBLFFBQ1o7QUFFQSxrQkFBVyxPQUFPLFlBQThCLE9BQU8sU0FBUyxXQUFXLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFBQSxNQUN2RjtBQUVBLGFBQU8sR0FBSSxPQUFPLFVBQVUsRUFBYSxHQUFHLE1BQU0sR0FBSSxPQUFPLFdBQVcsRUFBYTtBQUFBLElBQ3ZGO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsT0FBdUIsY0FHckIsUUFJQSxXQUNNO0FBQ04sMkJBQXVCLGNBQWMsUUFBUSxXQUFXLHNCQUFxQixXQUFXO0FBQUEsRUFDMUY7QUFDRjtBQVh5QjtBQUFBLEVBQ3BCLHdCQUFLLElBQUksVUFBVSxpQkFBaUI7QUFBQSxFQUNwQyw0QkFBUyxJQUFJLE9BQWUsYUFBYTtBQUFBLEVBR3pDLDRCQUFTLElBQUksa0JBQWtCLFFBQVcsMkRBQTJEO0FBQUEsRUFDckcsc0JBQUcsSUFBSSxRQUFRLE9BQU8sU0FBUyx5RUFBMEU7QUFBQSxHQTlDakcsdUJBd0NZO0FBeENsQixJQUFNLHVCQUFOO0FBcURQLE9BQU8sTUFBTTtBQUFBLEVBQ1g7QUFBQSxFQUNBLHFCQUFxQixjQUFjLEtBQUssb0JBQW9CO0FBQzlEOyIsCiAgIm5hbWVzIjogW10KfQo=
