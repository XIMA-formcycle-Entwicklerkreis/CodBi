import { getJQuery } from "@de-xima/fc-form-renderer";
import { CodBiLogo } from "./Logo";
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { DEFINED } from "xdbc/src/DBC/DEFINED";
// #endregion XDBC
/**
 * The global codbi object, available via `window.codbi`. Should only be used
 * when it is absolutely necessary to expose symbols externally. Use ESM imports
 * otherwise. */
export interface CodbiGlobal {
  /** Stores the base URL e.g. "https://localhost/xima-formcycle". */
  baseURL: string;
  /** See {@link CodBi.configTemplate }. */
  configTemplate: ConfigTemplate | undefined;
  /** See {@link CodBi.checkAttributes }. */
  checkAttributes: () => Promise<boolean>;
  /** See {@link CodBi.registerFunctionality }. */
  // biome-ignore lint/suspicious/noExplicitAny: Needed 'cause there is no way to restrict what future **E**lement **P**laceholder may acquire.
  registerFunctionality(id: string, init: (toLoad: any, toProcess: Element) => any): boolean;
  /** See {@link CodBi.extendFunctionality }. */
  // biome-ignore lint/suspicious/noExplicitAny: Needed 'cause there is no way to restrict what future **E**lement **P**laceholder may acquire.
  extendFunctionality(id: string, init: (toLoad: any, toProcess: Element) => any): boolean;
  /** See {@link CodBi.registerEP }. */
  registerEP(
    id: string,
    generator: (params: Array<string>) => Array<unknown> | Promise<Array<unknown>> | unknown | Promise<unknown>,
  ): boolean;
  /** See {@link CodBi.extendEP }. */
  extendEP(id: string, generator: (params: Array<string>) => Array<unknown> | Promise<Array<unknown>>): boolean;
  /** See {@link CodBi.reportError }. */
  reportError(message: string): undefined;
  /** See {@link CodBi.loadConfig }. */
  loadConfig(toLoad: { [key: string]: unknown }): void;
  /** See {@link CodBi.loadConfigs }. */
  loadConfigs(toLoad: Array<{ targets: string; [key: string]: unknown }>): void;
  /** Handles the loading of all **n**on **native** CodBi Standard-**C**onfigurations that're not native ones.*/
  nncHandler(toHandle: string): void;
  /** States whether {@link CodbiGlobal.checkAttributes } shall be invoked automatically or not. */
  autoCheckAttributes: boolean;
}
/**
 * The configuration template for the form, as configured by the user in the
 * form designer. */
export interface ConfigTemplate {
  /** The technical name of this template. */
  readonly name: string;
}
/** Augmenting global space. */
declare global {
  /**
   * Augmenting the global {@link Window } to contain also a reference to an {@link object } implementing
   * the {@link CodbiGlobal }-Interface. */
  interface Window {
    /**
     * The global codbi object, available via `window.codbi`. Should only be
     * used when it is absolutely necessary to expose symbols externally.
     * Use ESM imports otherwise. */
    codbi: CodbiGlobal;
  }
}
/** Implements the management functionality. */
export class CodBi implements CodbiGlobal {
  /** See {@link CodbiGlobal.autoCheckAttributes }. */
  public autoCheckAttributes: boolean = false;
  /**
   * See {@link CodbiGlobal.nncHandler }.
   *
   * @param toHandle The non-native configuration to load. */
  public nncHandler(toHandle: string): void {
    getJQuery().ajax({
      url: `${this.baseURL}plugin?name=CodBi_LocalAPIDoc`,
      type: "GET",
      headers: {
        "X-Action": "Code",
        "X-ActionDetail": "Standard",
        "X-Element": toHandle,
      },
      success: (response) => {
        if (response.result !== "NONE") {
          if (document.readyState === "complete") {
            // biome-ignore lint/security/noGlobalEval: Necessary to evaluate the response from a formcylce plugin response.
            eval(response.result.replaceAll("<|>", '"'));
            this.checkAttributes();
          } else {
            window.addEventListener("load", () => {
              if (response.result !== "NONE") {
                // biome-ignore lint/security/noGlobalEval: Necessary to evaluate the response from a formcylce plugin response.
                eval(response.result.replaceAll("<|>", '"'));
                this.checkAttributes();
              }
            });
          }
        }
      },
    });
  }
  /** Stores the path to the **XIMA**-Server's resources including the **CodBi** code fragments. */
  public readonly resourceBase: string = document
    .querySelector('script[src$="codbi.js"]')
    .getAttribute("src")
    .replace("codbi.js", "");
  /** See {@link CodbiGlobal.baseURL }. */
  public baseURL: string = `${window.location.href.split("/").slice(0, 4).join("/")}/`;
  /** Stores the {@link CodbiGlobal.configTemplate }.*/
  public configTemplate: ConfigTemplate | undefined = undefined;
  /** Stores all **E**lement **P**laceholder that were registered.*/
  protected availableEPs: {
    [k: string]: (params: Array<string>) => Array<unknown> | Promise<Array<unknown>> | unknown | Promise<unknown>;
  } = {};
  /** Stores all active CSS-Classes that're references to CodBi Standard-Configurations. */
  protected configs: Array<string> = new Array<string>();
  // biome-ignore lint/suspicious/noExplicitAny: Needed 'cause there is no way to restrict what future **E**lement **P**laceholder may acquire.
  protected functionalities: Map<string, (toLoad: any, toProcess: Element) => any> = new Map<
    string,
    // biome-ignore lint/suspicious/noExplicitAny: Needed 'cause there is no way to restrict what future **E**lement **P**laceholder may acquire.
    (toLoad: any, toProcess: Element | undefined) => any
  >();
  /** Stores the CodBi's control characters. */
  protected nestingBraces: { opening: string; closing: string; epSeparator: string; paramSeparator: string } = {
    opening: "{",
    closing: "}",
    epSeparator: ">",
    paramSeparator: ";",
  };
  /** Indicates whether the CodBi is currently in the process of checking attributes ({@link checkAttributes }). */
  public checkingAttributes = false;
  /** Stores the current {@link checkAttributes } - {@link Promise }. */
  public currentAttributeCheck: Promise<boolean> | undefined;
  /**
   * Registers an **E**lement **P**laceholder using the specified {@link string} as it's id.
   *
   * @param id        The {@link string } the placeholder should get as it's id.
   * @param generator The actual placeholder's ( params : Array < string >) => Array< unknown >.
   */
  public registerEP(
    id: string,
    generator: (params: Array<string>) => Array<unknown> | Promise<Array<unknown>> | unknown | Promise<unknown>,
  ): boolean {
    // biome-ignore lint/style/noParameterAssign: Reassignment resolves the necessity to define a new constant.
    id = id.toLowerCase();

    if (this.availableEPs[id]) {
      console.info(`[[ CodBi / Discard ] Element placeholder (${id}) is already registered. Replacement discarded. ]`);

      return false;
    }

    this.availableEPs[id] = generator;

    return true;
  }
  /**
   * Extends an given **E**lement **P**laceholder so that both the former one and the new one are invoked whereas the
   * form one itself may also be an extension already.
   * The value retrieved from the former **E**lement **P**laceholder will be passed to the new one which may further
   * transform the resulting values.
   * If an **E**lement **P**laceholder with the given **id** hasn't been registered yet the new one will be registered
   * using {@link CodBi.registerEP }.
   *
   * @param id        See {@link CodBi.registerEP }.
   * @param generator See {@link CodBi.registerEP }.
   *
   * @returns **TRUE** if an extension took place or **FALSE** if a regular registration was performed. */
  public extendEP(
    id: string,
    generator: (params: Array<string>, formerResult: Array<unknown>) => Array<unknown> | Promise<Array<unknown>>,
  ): boolean {
    // biome-ignore lint/style/noParameterAssign: Reassignment resolves the necessity to define a new constant.
    id = id.toLowerCase();

    if (this.availableEPs[id] === undefined) {
      this.reportInfo(`Element-Placeholder to extend (${id}) has not been registered. Extension discarded.`);

      return false;
    }

    const formerEP = this.availableEPs[id];

    this.availableEPs[id] = (params: Array<string>): Array<unknown> | Promise<Array<unknown>> => {
      const resultFormerEP = formerEP(params);

      if (Array.isArray(resultFormerEP)) {
        return generator(params, resultFormerEP as Array<string>);
      }

      return new Promise<Array<unknown>>((resolve) => {
        (resultFormerEP as Promise<Array<unknown>>).then((fromFormer: Array<unknown>) => {
          const newResult = generator(params, fromFormer as Array<string>);

          if (Array.isArray(newResult)) {
            resolve(newResult);
          } else {
            (newResult as Promise<Array<unknown>>).then((fromNew: Array<unknown>) => {
              resolve(fromNew);
            });
          }
        });
      });
    };

    return true;
  }
  /**
   * Retrieves the inner {@link string } from the outermost braces pair specified out of the given {@link string }.
   *
   * @param toGetFrom   The {@link string } where to extract the one surrounded by the specified brackets pair from.
   * @param openBrace   The opening brace.
   * @param closeBrace  The closing brace.
   *
   * @returns The requested {@link string } or NULL if there're no braces.
   *
   * @throws A {@link CodBiError } if the count of the opening & closing {@link CodBi.nestingBraces } doesn't match. */
  public getOutermostEP(toGetFrom: string): { keyPlaceholder: string | null; params: string | null } | null {
    if (toGetFrom.indexOf(this.nestingBraces.opening) === -1) {
      return null;
    }
    // #region Check if nesting braces count matches.
    if (
      toGetFrom.split(this.nestingBraces.opening).length - 1 !==
      toGetFrom.split(this.nestingBraces.closing).length - 1
    ) {
      throw new EPCodBiError(toGetFrom, "Count of opening & closing nesting braces doesn't match");
    }
    // #endregion Check if nesting braces count matches.
    const result = { keyPlaceholder: "", params: "" };
    const parts = new Array<string>();
    const inner = toGetFrom.substring(
      toGetFrom.indexOf(this.nestingBraces.opening) + 1,
      toGetFrom.lastIndexOf(this.nestingBraces.closing),
    );
    const innerParamseparator = inner.indexOf(this.nestingBraces.epSeparator);

    if (innerParamseparator !== -1) {
      parts.push(inner.substring(0, inner.indexOf(this.nestingBraces.epSeparator)).trim());
      parts.push(inner.substring(inner.indexOf(this.nestingBraces.epSeparator) + 1).trim());

      result.keyPlaceholder = DEFINED.tsCheck<string>(parts[0]).trim();
      result.params = DEFINED.tsCheck<string>(parts[1]).trim();
    } else {
      result.keyPlaceholder = inner;
    }

    return result;
  }
  /**
   * Splits all semicolon-separated parts of the {@link string } **toSplit** that're not within enclosing curly braces.
   *
   * @param toSplit The {@link string } to split.
   *
   * @returns The requested parts of the {@link string }. */
  public splitUnbracedParams(toSplit: string): Array<string> {
    if (!toSplit) {
      return [];
    }

    const parts: string[] = [];

    let currentPart = "";
    let braceLevel = 0;

    for (const candidate of toSplit) {
      if (candidate === "{") {
        braceLevel++;
        currentPart += candidate;
      } else if (candidate === "}") {
        braceLevel--;
        currentPart += candidate;
      } else if (candidate === ";" && braceLevel === 0) {
        parts.push(currentPart);
        currentPart = "";
      } else {
        currentPart += candidate;
      }
    }

    parts.push(currentPart); // Add the last part

    return parts.map((part) => part.trim());
  }
  /**
   * Resolves nested **E**lement **P**laceholder within **E**lement **P**laceholder Parameter
   * recursively ({@link CodBi.epSeparator }'s count of initiators determine the level of possible nesting).
   *
   * @param params The **E**lement **P**laceholder Parameter to check for **E**lement **P**laceholder.
   *
   * @returns The resolved incoming **params**. */
  public resolveEPParams(params: Array<string>): Promise<Array<string>> {
    return new Promise((resolve, reject) => {
      let cntPromises = 0;

      const result: Array<string> = new Array<string>();

      for (let i = 0; i < params.length; i++) {
        const candidate = (params[i] as string).trim();
        const outermostEP = this.getOutermostEP(candidate);

        if (outermostEP !== null) {
          outermostEP.keyPlaceholder = outermostEP.keyPlaceholder.toLowerCase();

          if (this.availableEPs[outermostEP.keyPlaceholder]) {
            cntPromises++;
            // The "candidate" is an EP, parameter are provided.
            this.resolveEPParams(this.splitUnbracedParams(outermostEP.params as string))
              .then((real) => {
                const epResult = DEFINED.tsCheck<
                  (params: Array<string>) => Array<unknown> | Promise<Array<unknown>> | unknown | Promise<unknown>
                >(this.availableEPs[outermostEP.keyPlaceholder])(real.flat());
                // If the element placeholder is asynchronous...
                if (epResult instanceof Promise) {
                  epResult
                    .then((real) => {
                      /*if (real[0] !== undefined && typeof real[0] === "string") {
                        real[0] = (real[0] as string).trim();
                      }*/

                      result.splice(i, 0, real as string);

                      if (--cntPromises === 0) {
                        resolve(result);
                      }
                    })
                    .catch((X: unknown) => {
                      reject(X);
                    });
                } else {
                  // In case of a synchronous element placeholder...
                  /*if (epResult[0] !== undefined && typeof epResult[0] === "string") {
                    epResult[0] = (epResult[0] as string).trim();
                  }*/

                  result.splice(i, 0, epResult as string);

                  if (--cntPromises === 0) {
                    resolve(result);
                  }
                }
              })
              .catch((X: unknown) => {
                reject(X);
              });
          } else {
            // #region Fix CSS recognized as an element placeholder bug.
            if (outermostEP.keyPlaceholder.indexOf("{") !== -1 || outermostEP.keyPlaceholder.indexOf("}") !== -1) {
              continue;
            }
            // #endregion Fix CSS recognized as an element placeholder bug.
            // Set counter for asynchronous download of EP code.
            cntPromises++;

            getJQuery().ajax({
              url: `${this.baseURL}plugin?name=CodBi_LocalAPIDoc`,
              type: "GET",
              headers: {
                "X-Action": "Code",
                "X-ActionDetail": "Elementplaceholder",
                "X-Element": outermostEP.keyPlaceholder.trim().toLowerCase(),
              },
              success: (response) => {
                if (response.result === "NONE") {
                  return;
                }
                // biome-ignore lint/security/noGlobalEval: Necessary to evaluate the response from a formcylce plugin response.
                eval(response.result.replaceAll("<|>", '"'));

                this.resolveEPParams(this.splitUnbracedParams(outermostEP.params as string))
                  .then((real) => {
                    const epResult = DEFINED.tsCheck<
                      (params: Array<string>) => Array<unknown> | Promise<Array<unknown>> | unknown | Promise<unknown>
                    >(this.availableEPs[outermostEP.keyPlaceholder])(real);
                    // If the element placeholder is asynchronous...
                    if (epResult instanceof Promise) {
                      epResult
                        .then((real) => {
                          if (real[0] !== undefined && typeof real[0] === "string") {
                            real[0] = (real[0] as string).trim();
                          }

                          result.splice(i, 0, real[0] as string);

                          if (--cntPromises === 0) {
                            resolve(result);
                          }
                        })
                        .catch((X: unknown) => {
                          reject(X);
                        });
                    } else {
                      // In case of a synchronous element placeholder...
                      if (epResult[0] !== undefined && typeof epResult[0] === "string") {
                        epResult[0] = (epResult[0] as string).trim();
                      }

                      result.splice(i, 0, epResult[0] as string);

                      if (--cntPromises === 0) {
                        resolve(result);
                      }
                    }
                  })
                  .catch((X: unknown) => {
                    reject(X);
                  });
              },
            });
          }
        } else {
          result.push(candidate); // The "candidate" is not an EP (no opening curly brace).
        }
      }
      // In case there're no element placeholder at all.
      if (cntPromises === 0) {
        resolve(result);
      }
    });
  }
  /**
   * Resolves all {@link CodBi.availableEPs } in all {@link string }-values
   * and {@link Array <string >}-values that're defined within the given
   * {@params config} recursively.
   *
   * @param config The JSON-Config to resolve each EP in.*/
  public resolveEP(config: { [key: string]: unknown }): Promise<{ [key: string]: unknown }> {
    return new Promise((resolve, reject) => {
      try {
        let cntPromises = 0;

        for (const key in config) {
          // Process keys that've been added to the config only.
          if (!Number.isNaN(key) && Object.prototype.hasOwnProperty.call(config, key)) {
            if (Array.isArray(config[key])) {
              for (let i = 0; i < (config[key] as []).length; i++) {
                if (typeof (config[key] as [])[i] === "string") {
                  const candidate: string | undefined = (config[key] as [])[i];

                  if (candidate !== undefined) {
                    const outermostEP = this.getOutermostEP(candidate);

                    if (outermostEP !== null) {
                      if (this.availableEPs[outermostEP.keyPlaceholder.toLowerCase()]) {
                        cntPromises++;

                        this.resolveEPParams(this.splitUnbracedParams(outermostEP.params))
                          .then((real) => {
                            const epResult = this.availableEPs[outermostEP.keyPlaceholder.toLowerCase()](
                              outermostEP.params === "" ? new Array<string>() : real,
                            );

                            if (epResult instanceof Promise) {
                              epResult
                                .then((real) => {
                                  (config[key] as []).splice(i, 1, ...(real as []));

                                  config[key] = (config[key] as []).filter((item) => item !== candidate);

                                  if (--cntPromises === 0) {
                                    resolve(config);
                                  }
                                })
                                .catch((X: unknown) => {
                                  reject(X);
                                });
                            } else {
                              (config[key] as []).splice(i, 1, ...(epResult as []));

                              config[key] = (config[key] as []).filter((item) => item !== candidate);

                              if (--cntPromises === 0) {
                                resolve(config);
                              }
                            }
                          })
                          .catch((X: unknown) => {
                            reject(X);
                          });
                      } else {
                        // Set counter for asynchronous download of EP code.
                        cntPromises++;

                        getJQuery().ajax({
                          url: `${this.baseURL}plugin?name=CodBi_LocalAPIDoc`,
                          type: "GET",
                          headers: {
                            "X-Action": "Code",
                            "X-ActionDetail": "Elementplaceholder",
                            "X-Element": outermostEP.keyPlaceholder.trim().toLowerCase(),
                          },
                          success: (response) => {
                            if (response.result === "NONE") {
                              return;
                            }
                            // biome-ignore lint/security/noGlobalEval: Necessary to evaluate the response from a formcylce plugin response.
                            eval(response.result.replaceAll("<|>", '"'));
                            // Promises counter for this already set in advance 'cause of asynchronous download of EP code.
                            this.resolveEPParams(this.splitUnbracedParams(outermostEP.params))
                              .then((real) => {
                                const epResult = this.availableEPs[outermostEP.keyPlaceholder.toLowerCase()](
                                  outermostEP.params === "" ? new Array<string>() : real,
                                );

                                if (epResult instanceof Promise) {
                                  epResult
                                    .then((real) => {
                                      (config[key] as []).splice(i, 1, ...(real as []));
                                      config[key] = (config[key] as []).filter((item) => item !== candidate);

                                      if (--cntPromises === 0) {
                                        resolve(config);
                                      }
                                    })
                                    .catch((X: unknown) => {
                                      reject(X);
                                    });
                                } else {
                                  (config[key] as []).splice(i, 1, ...(epResult as []));

                                  config[key] = (config[key] as []).filter((item) => item !== candidate);

                                  if (--cntPromises === 0) {
                                    resolve(config);
                                  }
                                }
                              })
                              .catch((X: unknown) => {
                                reject(X);
                              });
                          },
                        });
                      }
                    }
                  }
                }
              }
            } else {
              if (config[key] === null || config[key] === undefined) {
                continue;
              }

              const outermostEP = this.getOutermostEP(config[key] as string);

              if (outermostEP !== null) {
                if (this.availableEPs[outermostEP.keyPlaceholder.toLowerCase()]) {
                  cntPromises++;

                  this.resolveEPParams(this.splitUnbracedParams(outermostEP.params)).then((real) => {
                    const epResult = this.availableEPs[outermostEP.keyPlaceholder.toLowerCase()](
                      outermostEP.params === "" ? new Array<string>() : real,
                    );
                    // If parameter is a single element placeholder...
                    if (epResult instanceof Promise) {
                      epResult
                        .then((real) => {
                          config[key] = real;

                          if (--cntPromises === 0) {
                            resolve(config);
                          }
                        })
                        .catch((X: unknown) => {
                          reject(X);
                        });
                    } else {
                      // If parameter is not an array and contains no element placeholder...
                      config[key] = epResult;

                      if (--cntPromises === 0) {
                        resolve(config);
                      }
                    }
                  });
                } else {
                  // #region Fix CSS recognized as an element placeholder bug.
                  if (
                    outermostEP.keyPlaceholder.indexOf("{") !== -1 ||
                    outermostEP.keyPlaceholder.indexOf("}") !== -1
                  ) {
                    continue;
                  }
                  // #endregion Fix CSS recognized as an element placeholder bug.
                  // Set counter for asynchronous download of EP code.
                  cntPromises++;

                  getJQuery().ajax({
                    url: `${this.baseURL}plugin?name=CodBi_LocalAPIDoc`,
                    type: "GET",
                    headers: {
                      "X-Action": "Code",
                      "X-ActionDetail": "Elementplaceholder",
                      "X-Element": outermostEP.keyPlaceholder.trim().toLowerCase(),
                    },
                    success: (response) => {
                      if (response.result !== "NONE") {
                        // biome-ignore lint/security/noGlobalEval: Necessary to evaluate the response from a formcylce plugin response.
                        eval(response.result.replaceAll("<|>", '"'));

                        this.resolveEPParams(this.splitUnbracedParams(outermostEP.params)).then((real) => {
                          const epResult = this.availableEPs[outermostEP.keyPlaceholder.toLowerCase()](
                            outermostEP.params === "" ? new Array<string>() : real,
                          );
                          // If parameter is a single element placeholder...
                          if (epResult instanceof Promise) {
                            epResult
                              .then((real) => {
                                config[key] = real;

                                if (--cntPromises === 0) {
                                  resolve(config);
                                }
                              })
                              .catch((X: unknown) => {
                                reject(X);
                              });
                          } else {
                            // If parameter is not an array and contains no element placeholder...
                            config[key] = epResult;

                            if (--cntPromises === 0) {
                              resolve(config);
                            }
                          }
                        });
                      }
                    },
                  });
                }
              }
            }
          }
        }

        if (cntPromises === 0) {
          resolve(config);
        }
      } catch (X: unknown) {
        reject(X);
      }
    });
  }
  /**
   * Invokes {@link CodBi.resolveEP } in order to retrieve the
   * given {@link elementPlaceholder }.
   *
   * @param elementPlaceholder The **e**lement **p**laceholder to resolve (case insensitive).
   *
   * @returns A JSON ({ toResolve : ... }) containing the resolution result in
   *          it's property 'toResolve'.*/
  public retrieveEPValue(elementPlaceholder: string): { toResolve: unknown } {
    // biome-ignore lint/style/noParameterAssign: Reassignment resolves the necessity to define a new constant.
    elementPlaceholder = elementPlaceholder.toLowerCase();

    const result = { toResolve: [elementPlaceholder] };

    this.resolveEP({ toResolve: [elementPlaceholder] });

    return result;
  }
  /**
   * Applies the method {@link toApply } on all {@link Element }s within the
   * document that correspond to the specified {@link targets }.
   * The parameter {@link targets } is a TSV (basically multiple CSS-Selectors )
   * that're separated by a tilde.
   *
   * @param targets The TSV specifying the {@link Element }s to invoke the
   *                method {@link toApply } on.
   * @param toApply The method to apply on each {@link Element } specified by
   *                the {@link targets }.
   */
  public apply(targets: string, toApply: (target: Element) => undefined): undefined {
    for (const selector of targets.split("~")) {
      for (const target of document.querySelectorAll(selector)) {
        toApply(target);
      }
    }
  }
  /**
   * Registered a new functionality with the specified {@params id}.
   *
   * @param id    The {@link string } identifying the new functionality
   *              in {@CodBi.functionalities}.
   * @param init  The method to incorporating the new functionality.
   *
   * @return **TRUE** on successful registration, otherwise **FALSE**. */
  public registerFunctionality(id: string, init: (toLoad: unknown, toProcess: Element) => unknown): boolean {
    // biome-ignore lint/style/noParameterAssign: Reassignment resolves the necessity to define a new constant.
    id = id.toLowerCase();

    if (this.functionalities.has(id)) {
      console.info(`[[ CodBi / Discard ] Functionality (${id}) is already registered. Replacement discarded. ]`);

      return false;
    }

    this.functionalities.set(id, init);

    for (const element of document.querySelectorAll(`[data-cb-checked*="${id.toLowerCase()}"]`)) {
      element.setAttribute("data-cb-checked", element.getAttribute("data-cb-checked").replace(id.toLowerCase(), ""));
    }

    return true;
  }
  /**
   * Extends a given functionality so that both the former one and the new one are invoked whereas the form one
   * itself may also be an extension already.
   * If a functionality with the given **id** hasn't been registered yet the new one will be registered using
   * {@link CodBi.registerFunctionality }.
   *
   * @param id    See {@link CodBi.registerFunctionality }.
   * @param init  See {@link CodBi.registerFunctionality }.
   *
   * @returns **TRUE** if an extension took place or **FALSE** if a regular registration was performed. */
  public extendFunctionality(id: string, init: (toLoad: unknown, toProcess: Element) => unknown): boolean {
    // biome-ignore lint/style/noParameterAssign: Reassignment resolves the necessity to define a new constant.
    id = id.toLowerCase();

    if (!this.functionalities.has(id)) {
      this.registerFunctionality(id, init);

      this.reportInfo(`Functionality to extend (${id}) has not been registered. Registered as a new one instead.`);

      return false;
    }
    const formerFunctionality = this.functionalities.get(id);

    this.functionalities.set(id, (toLoad: unknown, toProcess: Element) => {
      formerFunctionality(toLoad, toProcess);
      init(toLoad, toProcess);
    });

    return true;
  }
  /**
   * Extracts all **E**lement **P**laceholders used within a CodBi-Attribute's value with nesting supported.
   * Those placeholders are of following format { placeholder e.g. HTML.Text.Mapper > Parameter SSV }.
   *
   * @param toExtractFrom The CodBi-Attributes's string to extract the **E**lement **P**laceholders from.
   *
   * @return The listing of **E**lement **P**laceholders that were found in the string **toExtractFrom**. */
  public extractEPs(toExtractFrom: string): string[] {
    const result: string[] = [];
    const segmentStartStack: number[] = []; // Indices of segments

    let currentSegmentStart = 0; // Index of the current segment's start

    for (let i = 0; i < toExtractFrom.length; i++) {
      const char = toExtractFrom[i];

      switch (char) {
        case "{":
          segmentStartStack.push(currentSegmentStart);
          currentSegmentStart = i + 1;
          break;
        case "}":
          if (segmentStartStack.length > 0) {
            currentSegmentStart = segmentStartStack.pop();
          } else {
            // Opening without closing curly brace encountered. Move on.
            currentSegmentStart = i + 1;
          }
          break;
        case ">":
          if (segmentStartStack.length > 0) {
            const leftPart = toExtractFrom.substring(currentSegmentStart, i).trim();

            if (leftPart.length > 0) {
              result.push(leftPart);
            }
            currentSegmentStart = i + 1;
          } else {
            // '>' encountered outside any segment defined by '{'
            currentSegmentStart = i + 1;
          }
          break;
        default:
          // If not in any segment (stack is empty), move the current segment start
          // This effectively skips characters that are not part of an EP definition
          if (segmentStartStack.length === 0) {
            currentSegmentStart = i + 1;
          }

          break;
      }
    }

    return result;
  }
  /**
   * Loads a configuration as a JSON by applying it to the {@link Element }s defined in it's targets attribute
   * (a tilde separated list of CSS-Selectors). All other properties define the tagged {@link Element }'s
   * CodBi-Attributes (e.g. **FUNC** will become **data-cb-FUNC** on the {@link Element }.
   *
   * Prior to applying the new attributes to the {@link Element }s the **FUNC** property of the **toLoad** will be
   * inspected in order to spot any functionalities that're not yet loaded and missing code fragments be loaded from
   * the **Formcycle**-Server. The same process will be used on every other property, except of **targets** to identify
   * **e**lement **p**laceholders and load missing code fragments prior to applying any new attribute on any
   * {@link Element }.
   *
   * @param toLoad The CodBi-Configuration to apply onto the "target"ed {@link Element }s.
   *
   * @returns A {@link Promise < void >} indicating when the operation including loading missing code fragments has
   *          been completed. */
  public async loadConfig(toLoad: { targets: string }): Promise<void> {
    // biome-ignore lint/suspicious/noAsyncPromiseExecutor: Necessary to await download of code in order to apply attributes afterwards.
    return new Promise(async (resolve) => {
      // #region Check dependencies
      for (const key in toLoad) {
        if (key === "FUNC") {
          for (const functionality of toLoad[key].split(",")) {
            if (!this.functionalities.has(functionality.toLowerCase().trim())) {
              // If functionality is missing...
              await new Promise((resolve) => {
                const toLoad = document.createElement("script");

                toLoad.src = `${this.resourceBase}${functionality.trim().toLowerCase()}.js`;
                toLoad.type = "module";
                toLoad.onload = (event) => {
                  resolve(event);
                };
                toLoad.onerror = (event) => {
                  getJQuery().ajax({
                    url: `${this.baseURL}plugin?name=CodBi_LocalAPIDoc`,
                    type: "GET",
                    headers: {
                      "X-Action": "Code",
                      "X-ActionDetail": "Functionality",
                      "X-Element": functionality.trim().toLowerCase(),
                    },
                    success: (response) => {
                      if (response.result === "NONE") {
                        return;
                      }
                      // biome-ignore lint/security/noGlobalEval: Necessary to evaluate the response from a formcylce plugin response.
                      eval(response.result.replaceAll("<|>", '"'));

                      resolve(event);
                    },
                  });
                };

                document.head.appendChild(toLoad);
              });
            }
          }
        } else {
          if (key === "targets") {
            continue;
          }

          for (const ep of this.extractEPs(toLoad[key])) {
            if (!(ep.trim() in this.availableEPs)) {
              await new Promise((resolve) => {
                const toLoad = document.createElement("script");
                toLoad.src = `${this.resourceBase}${ep.trim().toLowerCase()}.js`;
                toLoad.type = "module";
                toLoad.async = true;
                toLoad.onload = (event) => {
                  resolve(event);
                };
                toLoad.onerror = (event) => {
                  getJQuery().ajax({
                    url: `${this.baseURL}plugin?name=CodBi_LocalAPIDoc`,
                    type: "GET",
                    headers: {
                      "X-Action": "Code",
                      "X-ActionDetail": "Elementplaceholder",
                      "X-Element": ep.trim().toLowerCase(),
                    },
                    success: (response) => {
                      resolve(event);
                    },
                  });
                };

                document.head.appendChild(toLoad);
              });
            }
          }
        }
      }
      // #endregion Check dependencies
      // #region Apply attributes
      const globals: { [key: string]: string } = {};

      for (const selTarget of toLoad.targets.split("~")) {
        if (this.configs.indexOf(selTarget) !== -1) {
          console.info(
            `[[ CodBi / Discard ] Standard-Configuration CSS-Class ${selTarget} has already been used for appliance. Discarding application. ]`,
          );

          continue;
        }

        this.configs.push(selTarget);

        for (const target of document.querySelectorAll(selTarget)) {
          if (target) {
            // #region Check for global overrides.
            for (const key in toLoad) {
              if (key.toLowerCase() === "func") {
                for (const functionality of toLoad[key].split(",")) {
                  const specificGlobals = this.extractGlobalParameter(functionality.toLowerCase().trim());

                  if (specificGlobals) {
                    for (const entry in specificGlobals) {
                      globals[entry] = specificGlobals[entry];
                    }
                  }
                }
              }
            }
            // #endregion Check for global overrides.
            for (const key in toLoad) {
              if (key.toLowerCase() === "func" && target.hasAttribute("data-cb-func")) {
                target.setAttribute(
                  "data-cb-func",
                  globals[key.toLowerCase()]
                    ? `${globals[key.toLowerCase()]},${target.getAttribute("data-cb-func")}`
                    : // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                      `${(toLoad as any)[key]},${target.getAttribute("data-cb-func")}`,
                );

                continue;
              }

              if (key !== "targets" && !target.hasAttribute(`data-cb-${key}`)) {
                target.setAttribute(
                  `data-cb-${key}`,
                  globals[key.toLowerCase()] ? globals[key.toLowerCase()] : (toLoad as unknown)[key],
                );
              }
            }
          }
        }
      }
      // #endregion Apply attributes
    });
  }
  /**
   * Performs a call to {@link DBC.loadConfig } for each {targets:string} in **toLoad**.
   *
   * @param toLoad See {@link DBC.loadConfig }. */
  public loadConfigs(toLoad: Array<{ targets: string; [key: string]: unknown }>): void {
    for (const config of toLoad) {
      this.loadConfig(config);
    }
  }
  /**
   * Retrieves the Attributes out of the given {@link Element } **toExtractFrom** that are related
   * to the CodBi (**data-cb-** prefixed).
   * Those attributes may contain **E**lement **P**laceholder that are introduced by an
   * {@link DBC.nestingBraces.opening } brace. The placeholder and it's optional parameter are separated
   *
   * @param toExtractFrom The {@link Element } to extract the CodBi-Attributes from.
   *
   * @returns The {[key: string]: unknown } containing the attribute names and values. */
  protected extractCBAttributes(toExtractFrom: Element): { [key: string]: unknown } {
    const codbiAttributes: { [key: string]: unknown } = {};

    for (const candidate of toExtractFrom.attributes) {
      // Consider only CodBi non system attributes.
      if (
        candidate.name.trim() !== "cbfunc" &&
        candidate.name.trim() !== "cbapply" &&
        candidate.name.trim() !== "data-cb-func" &&
        candidate.name.trim() !== "data-cb-apply" &&
        candidate.name.substring(0, 8) === "data-cb-"
      ) {
        // Turn every attribute that contains a "," into a String-Array.
        codbiAttributes[candidate.name.substring(8)] =
          candidate.value.indexOf(",") !== -1 && candidate.value[0] !== "^"
            ? candidate.value.split(",").map((str) => str.trim())
            : candidate.value.replace(/\^/g, "");
      }
    }

    return codbiAttributes;
  }
  /**
   * Merges **a** with **b** overwriting all properties in **a** that're existent in both. Properties that exist in **b**
   * will be added to **a**.
   *
   * @param a The {[key: string]: unknown } to merge.
   * @param b The {[key: string]: unknown } to merge.
   *
   * @returns **a** merged with **b**. */
  protected mergeParameter(a: { [key: string]: unknown }, b: { [key: string]: unknown }): { [key: string]: unknown } {
    const result: { [key: string]: unknown } = a;

    for (const key in b) {
      if (Object.defineProperty.hasOwnProperty.call(b, key)) {
        result[key] = b[key];
      }
    }

    return result;
  }
  /**
   * Retrieves all parameter that're globally available for the specified "namespace".
   * Those got to be underscore-separated (e.g. Date_Frame_MaxField) when entered in the "Variables" section
   * of the GUI. Transforming dot-separated to underscore-separated an vice versa is handled automatically.
   *
   * @param namespace The {@link string }-prefix a global parameter has to be tagged with to be retrieved.
   *
   * @param return The {[key : string] : string } of the requested global parameters. */
  protected extractGlobalParameter(namespace: string): { [key: string]: string | null } {
    const result: { [key: string]: string } = {};

    for (const parameter of document.querySelectorAll("[ data-name ]")) {
      const completeName = parameter.getAttribute("data-name")?.toLowerCase();
      if (completeName.indexOf(namespace.toLowerCase().replace(/\./g, "_")) !== -1) {
        const parameterName = parameter.getAttribute("data-name");
        result[parameterName.substring(parameterName?.lastIndexOf("_") + 1).toLocaleLowerCase()] =
          parameter.getAttribute("value");
      }
    }

    return result;
  }
  /**
   * Injects the {@link CodBiLogo } and a CSS loading animation after the given {@link destination }.
   *
   * @param destination The {@link Element } that shall precede the {@link CodBiLogo }. */
  protected injectLoadingAnim(destination: Element): void {
    if (destination.parentElement?.querySelector(".CodBi_Logo") !== null) {
      return; // Don't inject the CodBi-Logo if there is already one present.
    }

    const container = document.createElement("div");

    container.setAttribute("cbFOR", (destination as HTMLElement).getAttribute("data-name"));
    container.style.marginLeft = "auto";
    container.style.display = "flex";
    container.style.position = "relative";
    container.style.marginTop = "-5%";

    container.classList.add("cCodBiLoader");

    const loader = document.createElement("div");

    loader.style.width = "10%";
    loader.classList.add("CodBiLoader_Spinner");

    container.appendChild(loader);

    const svg = document.createElement("svg");

    svg.style.margin = "2%";
    svg.innerHTML = CodBiLogo();

    destination.parentElement.appendChild(container);

    const innerSVG: SVGSVGElement | null = svg.querySelector("svg");

    if (innerSVG === null) {
      return;
    }

    innerSVG.style.boxShadow = "0 0 .5em black";
    innerSVG.style.borderRadius = ".5em";
    innerSVG.style.backgroundColor = "white";
    innerSVG.style.width = "25%";
    innerSVG.style.height = "fit-content";
    innerSVG.style.padding = "0";
    innerSVG.style.paddingRight = ".1em";

    innerSVG.classList.add("CodBi_Logo", "CodBiLoader");
  }
  /**
   * Removes all {@link Element }s of CSS-Class-**cCodBiLoader** out of the one **toRemoveFrom**.
   *
   * @param toRemoveFrom The {@link Element } all CSS-Class-**cCodBiLoader** shall be remove from. */
  public removeLoaderAnim(toRemoveFrom: Element): void {
    const loaderAnimation = toRemoveFrom.parentElement?.querySelector(
      `.cCodBiLoader[cbFOR="${toRemoveFrom.getAttribute("data-name")}"]`,
    );

    if (loaderAnimation === null || loaderAnimation === undefined) {
      return;
    }

    loaderAnimation.remove();
  }
  /**
   * Processes all {@link Element }s that're tagged with a certain
   * Attribute (**data-cb-func**) in order to activate CodBi-Functionalities.
   * The Attribute **data-cb-func** is a CSV containing all CodBi-Functionalities to
   * activate.
   *
   * When having found an {@link Element } this methods will look for all
   * attributes named **data-cb-...**. When activating a CodBi-Functionality for an
   * {@link Element } those attributes will be passed as a Key/Value-JSON to the
   * functionality with the **data-cb-** prefix removed from the keys.
   *
   * This method also looks for global variables related to the functionality to be used. Those may be specified
   * in the GUI's "Variables" section and got to be prefixed with the functionality's name (using underscores
   * instead of dots separators however (e.g. time.frame becomes time_frame)) followed by the variable's name without
   * the **data-cb-** prefix (e.g. Time_Frame_MaxField).
   * For being useful to define values that're common to multiple functionalities but still pertain the possibility
   * to overwrite those values when needed, global variables have the least precedence and will be overwritten by
   * the ones the {@link Element } has.
   *
   * The attribute **data-cb-apply** may be used to apply all global variables and all attributes of the
   * {@link Element }s to the ones specified by the CSS-Selector-TSV, which is this attribute's value
   * (take care to use **data-org-name** in CSS-Attribute-Selectors in order for the application to also work in
   * repetitive containers).
   * Global variables and those received from the original {@link Element } may be overwritten simply by re-specifying
   * the variable-attribute on the {@link Element}s **data-cb-apply** refers to where suitable.
   *
   * The **data-cb-Loader** attribute, if set to "none" (case insensitive), does deactivate the loader-animation only,
   * not the disabling if {@link HTMLInputElement }s as long as the tagged {@link Element } hasn't been processed.
   *
   * > **CAUTION: The suspension of processing will also result in delaying the disabling for input of all further
   * elements.**
   *
   * @throws A {@link CodBiError } when the processing of an {@link Element } throws one.
   *
   * @returns A {@link Promise < boolean >} that resolves a soon as all {@link Elements } where initially processed
   *          and the application of functionalities as the retrieval of **E**lement **P**laceholder values has been
   *          triggered. */
  public checkAttributes(): Promise<boolean> {
    // biome-ignore lint/suspicious/noAssignInExpressions: No confusion.
    return (this.currentAttributeCheck = new Promise((resolve) => {
      this.checkingAttributes = true;

      let cntPromises = 0;

      const toCheck = document.querySelectorAll("[data-cb-func]");

      for (const toProcess of document.querySelectorAll("[data-cb-func]")) {
        for (const functionality of toProcess.getAttribute("data-cb-func").split(",")) {
          // #region Process [data-cb-checked] in order to prevent double appliance of functionalities.
          if (toProcess.hasAttribute("data-cb-checked")) {
            if (toProcess.getAttribute("data-cb-checked").indexOf(functionality.toLowerCase()) !== -1) {
              continue;
            }

            toProcess.setAttribute(
              "data-cb-checked",
              `${toProcess.getAttribute("data-cb-checked")} ${functionality.toLowerCase()}`,
            );
          } else {
            toProcess.setAttribute("data-cb-checked", `${functionality.toLowerCase()}`);
          }
          // #region Process [data-cb-checked] in order to prevent double appliance of functionalities.
          // Assign taking global-variables into consideration.
          let codbiAttributes: { [key: string]: unknown } = this.mergeParameter(
            this.extractGlobalParameter(functionality),
            this.extractCBAttributes(toProcess),
          );

          const toInvoke = this.functionalities.get(functionality.toLowerCase().trim());
          // If the functionality is a registered one...
          if (toInvoke) {
            // #region  Show loading animations and disable input as long as CodBi-Code for that element hasn't loaded,
            //          if not deactivated.
            if (
              toProcess.getAttribute("data-cb-LOADER")?.toLocaleLowerCase().trim() !== "none" &&
              toProcess.tagName !== "HEAD"
            ) {
              this.injectLoadingAnim(toProcess);
            }
            // #endregion Show loading animations and disable input as long as CodBi-Code for that element hasn't loaded,
            //            if not deactivated.
            toProcess.classList.add("Processing", "CodBi");

            cntPromises++;

            this.resolveEP(codbiAttributes)
              .then((real) => {
                codbiAttributes = real;

                toInvoke(codbiAttributes, toProcess);
                // #region Disable loading animation and remove logo when CodBi finished processing that element.
                if (
                  toProcess
                    .getAttribute(toProcess.hasAttribute("cbLOADER") ? "cbLOADER" : "data-cb-LOADER")
                    ?.toLocaleLowerCase()
                    .trim() !== "none" &&
                  toProcess.tagName !== "HEAD"
                ) {
                  this.removeLoaderAnim(toProcess);
                }
                // #endregion Disable loading animation and remove logo when CodBi finished processing that element.
                toProcess.classList?.remove("Processing");

                if (--cntPromises === 0) {
                  this.checkingAttributes = false;

                  resolve(true);
                }
              })
              .catch((X: unknown) => {
                this.reportFunctionalityError(toProcess, functionality, codbiAttributes, X, "");

                if (--cntPromises === 0) {
                  this.checkingAttributes = false;
                  resolve(true);
                }
              });
            // #region Check if further application wanted.
            if (toProcess.hasAttribute("data-cb-APPLY")) {
              for (const selector of toProcess.getAttribute("data-cb-APPLY").split("~")) {
                this.apply(selector.trim(), (target) => {
                  let codbiAttributesLocal: { [key: string]: unknown } = {};
                  // Assign taking global-variables into consideration.
                  const replacements: { [key: string]: unknown } = this.mergeParameter(
                    this.extractGlobalParameter(functionality),
                    this.extractCBAttributes(target),
                  );
                  // Copy by value.
                  for (const key in codbiAttributes) {
                    codbiAttributesLocal[key] = codbiAttributes[key];
                  }
                  // Replace parameter (overwrite received attributes whenever local ones are available)
                  for (const replacement in replacements) {
                    codbiAttributesLocal[replacement] = replacements[replacement];
                  }

                  for (const toApplyOn of document.querySelectorAll(selector)) {
                    cntPromises++;

                    this.resolveEP(codbiAttributesLocal)
                      .then((real) => {
                        codbiAttributesLocal = real;

                        toApplyOn.classList.add("CodBi", "Processing");

                        toInvoke(codbiAttributesLocal, toApplyOn);
                        // #region Disable loading animation when CodBi finished processing that element.
                        if (
                          toProcess.getAttribute("data-cb-LOADER")?.toLocaleLowerCase().trim() !== "none" &&
                          toApplyOn.tagName !== "HEAD"
                        ) {
                          this.removeLoaderAnim(toApplyOn);
                        }

                        toApplyOn.classList?.remove("Processing");
                        // #endregion Disable loading animation when CodBi finished processing that element.
                        if (--cntPromises === 0) {
                          this.checkingAttributes = false;

                          resolve(true);
                        }
                      })
                      .catch((X: unknown) => {
                        this.reportFunctionalityError(toApplyOn, functionality, codbiAttributes, X, "");

                        if (--cntPromises === 0) {
                          this.checkingAttributes = false;

                          resolve(true);
                        }
                      });
                  }
                });
              }
            }
            // #endregion Check if further application wanted.
            // #endregion Show loading animations and disable input as long as CodBi-Code for that element hasn't loaded, if not deactivated.
          } else {
            // If no functionality...
            if (functionality === "") {
              continue;
            }
            // If no native functionality is existent...
            getJQuery().ajax({
              url: `${this.baseURL}plugin?name=CodBi_LocalAPIDoc`,
              type: "GET",
              headers: {
                "X-Action": "Code",
                "X-ActionDetail": "Functionality",
                "X-Element": functionality.trim().toLowerCase(),
              },
              success: (response) => {
                if (response.result === "NONE") {
                  return;
                }
                // #region Evaluate the response and replace all placeholders.
                // biome-ignore lint/security/noGlobalEval: Necessary to evaluate the response from a formcylce plugin response.
                eval(response.result.replaceAll("<|>", '"'));
                // #endregion Evaluate the response and replace all placeholders.
                toProcess.classList.add("Processing", "CodBi");

                cntPromises++;

                this.resolveEP(codbiAttributes)
                  .then((real) => {
                    codbiAttributes = real;

                    this.functionalities.get(functionality.toLowerCase().trim())(codbiAttributes, toProcess);
                    // #region Disable loading animation and remove logo when CodBi finished processing that element.
                    if (
                      toProcess
                        .getAttribute(toProcess.hasAttribute("cbLOADER") ? "cbLOADER" : "data-cb-LOADER")
                        ?.toLocaleLowerCase()
                        .trim() !== "none" &&
                      toProcess.tagName !== "HEAD"
                    ) {
                      this.removeLoaderAnim(toProcess);
                    }
                    // #endregion Disable loading animation and remove logo when CodBi finished processing that element.
                    toProcess.classList?.remove("Processing");

                    if (--cntPromises === 0) {
                      this.checkingAttributes = false;

                      resolve(true);
                    }
                  })
                  .catch((X: unknown) => {
                    this.reportFunctionalityError(toProcess, functionality, codbiAttributes, X, "");

                    if (--cntPromises === 0) {
                      this.checkingAttributes = false;

                      resolve(true);
                    }
                  });
              },
            });
          }
        }
      }
    }));
  }
  // #region Info reporting
  /** Stores the settings for information reporting. */
  public settingsInfoReporting: {
    log: boolean; // Whether to use {@link console }'s **info** method to display the error to the console.
  } = { log: true };
  /**
   * Reports the informational {@link message } as defined in {@link CodBi.settingsErrorReporting }.
   *
   * @param message The information to report. */
  public reportInfo(message: string): undefined {
    if (this.settingsInfoReporting.log) {
      console.info(`[[ CodBi / Info ] ${message}]`);
    }
  }
  // #endregion Info reporting
  // #region Error reporting
  /** Stores the settings for error reporting. */
  public settingsErrorReporting: {
    throw: boolean; // Throw a CodBiError.
  } = { throw: true };
  /**
   * Reports an error specifying the given {@link message } as defined in {@link CodBi.settingsErrorReporting }.
   *
   * @param message The message describing the error. */
  public reportError(message: string): undefined {
    if (this.settingsErrorReporting.throw) {
      throw new CodBiError(`[ ${message} ]`);
    }
  }
  /**
   * Reports using {@link CodBi.reportError } using the specified details.
   *
   * @param cause         The currently processed {@link Element } the error occurred in.
   * @param functionality The functionality the error came up in.
   * @param parameter     The parameter that where passed to the "functionality".
   * @param exception     The {@link Error } that occurred.
   * @param message       An optional {@link string } containing further non conform details. */
  public reportFunctionalityError(
    cause: Element,
    functionality: string,
    parameter: { [key: string]: unknown },
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    exception: any,
    message: string,
  ): void {
    this.reportError(
      `Processing "${cause.getAttribute("data-name")}" caused following error in functionality "${functionality}" with parameter (${JSON.stringify(parameter, null)}):\n ${exception}${message ? ` | ${message}` : ""}`,
    );
  }
  // #endregion Error reporting
  /** */
  protected firstTimer: Array<HTMLElement> = new Array<HTMLElement>();
  /**
   * Creates an instance of {@link CodBi} also setting the specified
   * "initiator" & "paramSeparator".
   *
   * @param nestingBraces   The {@link CodBi.nestingBraces } configuration for this instance.
   * @param cssProcessing   The CSS to be applied on {@link Element }s that're currently being processed by the CodBi. */
  public constructor(
    nestingBraces: { opening: string; closing: string; epSeparator: string; paramSeparator: string } = {
      opening: "{",
      closing: "}",
      epSeparator: ">",
      paramSeparator: ";",
    },
    cssProcessing: string = `
      .CodBi.Processing { transition : .5s !important ;
                          pointer-events : none !important ; opacity : .1 ;}

      @keyframes kfSpinner { 100% { transform : rotate( 1turn )}}
      .CodBiLoader_Spinner          { position : relative ; text-align : center ; margin : auto ; aspect-ratio : 1 ;
                                      display : grid ; border : 2px solid #0000 ; border-radius : 50% ;
                                      border-right-color :  #1e79ee ; animation : kfSpinner 1s infinite linear ;}
      .CodBiLoader_Spinner::before,
      .CodBiLoader_Spinner::after   { content : ""; grid-area : 1/1 ; margin : 2px ; border : inherit ;
                                      border-radius : 50% ; animation : kfSpinner 2s infinite ;}
      .CodBiLoader_Spinner::after   { margin : 8px ;
                                      animation-duration : 1.5s ;}

      @keyframes kfFadeIN_CodBi_Loader {
        0%    { filter : blur( 1em ); opacity : 0 ;}
        90%   { scale : 1.1 ;}
        100%  { filter : blur( 0 ); opacity : 1 ; scale : 1 ;}}
      .CodBiLoader { animation : kfFadeIN_CodBi_Loader 1s ease-in forwards ; position : relative ; filter : blur( 1em ); opacity : 0 ; scale : .9 ;}`,
  ) {
    this.nestingBraces = nestingBraces;
    // #region Inject style for elements that're currently being processed.
    const style = document.createElement("style");

    style.innerHTML = cssProcessing;

    document.head.appendChild(style);
    // #endregion Inject style for elements that're currently being processed.
    getJQuery()("FORM.xm-form").on("addRow", (c, data) => {
      // If added Element is not the first one...
      if (data.container["0"].getAttribute("data-dynamic-row") !== "0") {
        this.checkAttributes();
      }
    });
  }
}
// #region Errors
/** An {@link Error } to be thrown whenever the CodBi causes one. */
export class CodBiError extends Error {
  /**
   * Constructs this {@link CodBiError } by tagging the specified message-{@link string } as an CodBi {@link Error }.
   *
   * @param message The {@link string } describing the error. */
  constructor(message?: string | undefined) {
    super(`${message}`);
  }
}
/** A {@link CodBiError } to be thrown whenever an **E**lement **P**laceholder causes an {@link Error }. */
export class EPCodBiError extends CodBiError {
  /**
   * Constructs this {@link EPCodBiError } by tagging this {@link CodBiError } as an {@link Error } caused by
   * an **E**lement **P**laceholder.
   *
   * @param placeholder The **e**lement **p**laceholder causing this {@link CodBiError }.
   * @param message     The {@link string } describing this {@link CodBiError }.
   */
  constructor(placeholder: string, message: string) {
    super(`[ Error in EP "${placeholder}": ${message} ]`);
  }
}
// #endregion Errors
// #region Tools
/**
 * KI Code.
 *
 * Turns the given {@link Date }-{@link String } of the specified format (e.g. DD/MM/YYYY) into the corresponding
 * {@link Date }.
 *
 * @param dateString  The {@link string } to convert.
 * @param formatting  The format of the "dateString" (e.g. DD/MM/YYYY).
 *
 * @returns The {@link Date } corresponding to the given **dateString**. */
export function stringToDate(input: string, format: string = "dd-mm-yyyy"): Date | null {
  const formatting = format.toLowerCase();
  const parts = input.match(/(\d+)/g);
  const fmt: { [key: string]: number } = {};
  let i = 0;
  let year: number | undefined;
  let month: number | undefined;
  let day: number | undefined;

  if (!parts) {
    return null; // Return null if no digits are found in the input
  }

  formatting.replace(/(yyyy|dd|mm)/g, (part: string): string => {
    fmt[part] = i++;
    return "";
  });
  // biome-ignore lint/complexity/useLiteralKeys: Foreign Code
  if (fmt["yyyy"] !== undefined) {
    // biome-ignore lint/complexity/useLiteralKeys: Foreign Code
    year = Number.parseInt(parts[fmt["yyyy"]] as string, 10);
  }
  // biome-ignore lint/complexity/useLiteralKeys: Foreign Code
  if (fmt["mm"] !== undefined) {
    // biome-ignore lint/complexity/useLiteralKeys: Foreign Code
    month = Number.parseInt(parts[fmt["mm"]] as string, 10) - 1; // Month is 0-indexed in JavaScript Date
  } // biome-ignore lint/complexity/useLiteralKeys: Foreign Code
  if (fmt["dd"] !== undefined) {
    // biome-ignore lint/complexity/useLiteralKeys: Foreign Code
    day = Number.parseInt(parts[fmt["dd"]] as string, 10);
  }

  if (year !== undefined && month !== undefined && day !== undefined) {
    return new Date(year, month, day);
  }

  return null; // Return null if the format doesn't contain all necessary parts
}
// #endregion Tools
export function createCodbiGlobal(): CodbiGlobal {
  return new CodBi();
}
