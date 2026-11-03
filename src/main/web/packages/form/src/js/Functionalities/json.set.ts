// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { IF } from "xdbc/src/DBC/IF";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { DEFINED } from "xdbc/src/DBC/DEFINED";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { ParameterTypes } from "codbi-common";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link JSON_SET.functionality }.
 *
 * @remarks
 * Maintainer: Salvatore Callari (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class JSON_SET {
  /**
   * This functionality assigns the specified "Property" of a member of {@link Element } "toProcess"
   * which is specified by "Path".
   *
   * Config Parameter:
   *  - Path:     The optional dotted path {@link string } leading to the {@link object}, starting from the
   *              {@link Element } "toProcess", which's "Property" gotta be set. If omitted (empty), the
   *              {@link Element } "toProcess" itself is the target — useful for setting direct element
   *              properties such as "innerHTML".   *
   *  - Property: The name of the property to set.
   *  - ToSet:    The {@link object } to set the "Property" to.
   *
   * @param toLoad    Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }.
   * @param toProcess Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }. */
  @DBC.ParamvalueProvider
  @ParameterTypes({
    Path: {
      type: "string",
      default:
        "The optional dotted path leading to the object, starting from the tagged element, which's Property is to be set. If left empty, the tagged element itself is the target (e.g. to set innerHTML).",
    },
    Property: { type: "string", default: "The name of the property to set." },
    ToSet: { type: "string", default: "The object to set the Property to." },
  })
  public static functionality(
    @DEFINED.PRE("property")
    @DEFINED.PRE("toset")
    @IF.PRE(new DEFINED(), new REGEX(REGEX.stdExp.keyPath), "path")
    @TYPE.PRE("string", "property")
    @REGEX.PRE(REGEX.stdExp.property, "property")
    toLoad: { [key: string]: unknown },

    @INSTANCE.PRE(HTMLElement, undefined, "Is it not an HTML-Element that is tagged with this functionality?")
    toProcess: Element,
  ): undefined {
    const target: unknown = toLoad.path
      ? (toLoad.path as string)
          .split(".")
          .reduce((accumulator, current) => (accumulator as unknown)[current], toProcess)
      : toProcess;

    target[toLoad.property as string] = toLoad.toset;
  }
}

window.codbi.registerFunctionality("JSON.SET", JSON_SET.functionality.bind(JSON_SET)); // Initialization
