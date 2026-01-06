"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __decorateClass = (decorators, target, key, kind) => {
    var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
    for (var i = decorators.length - 1, decorator; i >= 0; i--)
      if (decorator = decorators[i])
        result = (kind ? decorator(target, key, result) : decorator(result)) || result;
    if (kind && result) __defProp(target, key, result);
    return result;
  };
  var __decorateParam = (index, decorator) => (target, key) => decorator(target, key, index);

  // ../../node_modules/@de-xima/fc-form-designer/index.js
  var require_fc_form_designer = __commonJS({
    "../../node_modules/@de-xima/fc-form-designer/index.js"(exports, module) {
      if (typeof Designer !== "object") {
        throw new Error(
          [
            "fc-form-designer is not available",
            "This module only contains type declaration files and no implementation.",
            "The declared types are available only within the form designer of the XIMA FORMCYCLE application.",
            "Specifically, this module delegates to the contents of the global window.Designer.",
            "Only use this package as part of the client side script for a form element widget plugin (IPluginFormElementWidget)."
          ].join("\n")
        );
      }
      Object.assign(module.exports, Designer);
    }
  });

  // src/js/register-customElements.ts
  var import_fc_form_designer4 = __toESM(require_fc_form_designer(), 1);

  // src/js/LocalDocInterface.ts
  var import_fc_form_designer2 = __toESM(require_fc_form_designer(), 1);

  // ../../node_modules/xdbc/src/DBC.ts
  var DBC = class _DBC {
    // #region Parameter-value requests.
    /** Stores all request for parameter values registered by {@link decPrecondition }. */
    static paramValueRequests = /* @__PURE__ */ new Map();
    /**
     * Make a request to get the value of a certain parameter of specific method in a specific {@link object }.
     * That request gets enlisted in {@link paramValueRequests } which is used by {@link ParamvalueProvider} to invoke the
     * given "receptor" with the parameter value stored in there. Thus a parameter decorator using this method will
     * not receive any value of the top method is not tagged with {@link ParamvalueProvider}.
     *
     * @param target		The {@link object } containing the method with the parameter which's value is requested.
     * @param methodName	The name of the method with the parameter which's value is requested.
     * @param index			The index of the parameter which's value is requested.
     * @param receptor		The method the requested parameter-value shall be passed to when it becomes available. */
    static requestParamValue(target, methodName, index, receptor) {
      if (_DBC.paramValueRequests.has(target)) {
        if (_DBC.paramValueRequests.get(target).has(methodName)) {
          if (_DBC.paramValueRequests.get(target).get(methodName).has(index)) {
            _DBC.paramValueRequests.get(target).get(methodName).get(index).push(receptor);
          } else {
            _DBC.paramValueRequests.get(target).get(methodName).set(index, new Array(receptor));
          }
        } else {
          _DBC.paramValueRequests.get(target).set(
            methodName,
            /* @__PURE__ */ new Map([
              [index, new Array(receptor)]
            ])
          );
        }
      } else {
        _DBC.paramValueRequests.set(
          target,
          /* @__PURE__ */ new Map([
            [
              methodName,
              /* @__PURE__ */ new Map([
                [index, new Array(receptor)]
              ])
            ]
          ])
        );
      }
      return void 0;
    }
    /**
     * A method-decorator factory checking the {@link paramValueRequests } for value-requests of the method's parameter thus
     * also usable on setters.
     * When found it will invoke the "receptor" registered there, inter alia by {@link requestParamValue }, with the
     * parameter's value.
     *
     * @param target 		The {@link object } hosting the tagged method as provided by the runtime.
     * @param propertyKey 	The tagged method's name as provided by the runtime.
     * @param descriptor 	The {@link PropertyDescriptor } as provided by the runtime.
     *
     * @returns The {@link PropertyDescriptor } that was passed by the runtime. */
    static ParamvalueProvider(target, propertyKey, descriptor) {
      const originalMethod = descriptor.value;
      descriptor.value = function(...args) {
        if (_DBC.paramValueRequests.has(target) && _DBC.paramValueRequests.get(target).has(propertyKey)) {
          for (const index of _DBC.paramValueRequests.get(target).get(propertyKey).keys()) {
            if (index < args.length) {
              for (const receptor of _DBC.paramValueRequests.get(target).get(propertyKey).get(index)) {
                receptor(args[index]);
              }
            }
          }
        }
        return originalMethod.apply(this, args);
      };
      return descriptor;
    }
    // #endregion Parameter-value requests.
    // #region Class
    /**
     * A property-decorator factory serving as a **D**esign **B**y **C**ontract Invariant.
     * This invariant aims to check the instance of the class not the value to be get or set.
     *
     * @param contracts The {@link DBC }-Contracts the value shall uphold.
     *
     * @throws 	A {@link DBC.Infringement } whenever the property is tried to be get or set without the instance of it's class
     * 			fulfilling the specified **contracts**. */
    static decClassInvariant(contracts, path = void 0, dbc = "WaXCode.DBC") {
      return (target, propertyKey, descriptor) => {
        if (!_DBC.resolveDBCPath(window, dbc).executionSettings.checkInvariants) {
          return;
        }
        const originalSetter = descriptor.set;
        const originalGetter = descriptor.get;
        let value;
        Object.defineProperty(target, propertyKey, {
          get() {
            if (!_DBC.resolveDBCPath(window, dbc).executionSettings.checkInvariants) {
              return;
            }
            const realValue = path ? _DBC.resolve(this, path) : this;
            for (const contract of contracts) {
              const result = contract.check(realValue);
              if (typeof result === "string") {
                _DBC.resolveDBCPath(window, dbc).reportFieldInfringement(
                  result,
                  target,
                  path,
                  propertyKey,
                  realValue
                );
              }
            }
            return originalGetter[propertyKey];
          },
          set(newValue) {
            if (!_DBC.resolveDBCPath(window, dbc).executionSettings.checkInvariants) {
              return;
            }
            const realValue = path ? _DBC.resolve(this, path) : this;
            for (const contract of contracts) {
              const result = contract.check(realValue);
              if (typeof result === "string") {
                _DBC.resolveDBCPath(window, dbc).reportFieldInfringement(
                  result,
                  target,
                  path,
                  propertyKey,
                  realValue
                );
              }
            }
            value = newValue;
          },
          enumerable: true,
          configurable: true
        });
      };
    }
    // #endregion Class
    // #region Invariant
    /**
     * A property-decorator factory serving as a **D**esign **B**y **C**ontract Invariant.
     * Since the value must be initialized or set according to the specified **contracts** the value will only be checked
     * when assigning it.
     *
     * @param contracts The {@link DBC }-Contracts the value shall uphold.
     *
     * @throws 	A {@link DBC.Infringement } whenever the property is tried to be set to a value that does not comply to the
     * 			specified **contracts**, by the returned method.*/
    static decInvariant(contracts, path = void 0, dbc = "WaXCode.DBC") {
      return (target, propertyKey) => {
        if (!_DBC.resolveDBCPath(window, dbc).executionSettings.checkInvariants) {
          return;
        }
        let value;
        Object.defineProperty(target, propertyKey, {
          set(newValue) {
            if (!_DBC.resolveDBCPath(window, dbc).executionSettings.checkInvariants) {
              return;
            }
            const realValue = path ? _DBC.resolve(newValue, path) : newValue;
            for (const contract of contracts) {
              const result = contract.check(realValue);
              if (typeof result === "string") {
                _DBC.resolveDBCPath(window, dbc).reportFieldInfringement(
                  result,
                  target,
                  path,
                  propertyKey,
                  realValue
                );
              }
            }
            value = newValue;
          },
          enumerable: true,
          configurable: true
        });
      };
    }
    // #endregion Invariant
    // #region Postcondition
    /**
     * A method decorator factory checking the result of a method whenever it is invoked thus also usable on getters.
     *
     * @param check	The **(toCheck: any, object, string) => boolean | string** to use for checking.
     * @param dbc	See {@link DBC.resolveDBCPath }.
     * @param path	The dotted path referring to the actual value to check, starting form the specified one.
     *
     * @returns The **( target : object, propertyKey : string, descriptor : PropertyDescriptor ) : PropertyDescriptor**
     * 			invoked by Typescript.
     */
    static decPostcondition(check, dbc, path = void 0) {
      return (target, propertyKey, descriptor) => {
        const originalMethod = descriptor.value;
        descriptor.value = (...args) => {
          if (!_DBC.resolveDBCPath(window, dbc).executionSettings.checkPostconditions) {
            return;
          }
          const result = originalMethod.apply(this, args);
          const realValue = path ? _DBC.resolve(result, path) : result;
          const checkResult = check(realValue, target, propertyKey);
          if (typeof checkResult === "string") {
            _DBC.resolveDBCPath(window, dbc).reportReturnvalueInfringement(
              checkResult,
              target,
              path,
              propertyKey,
              realValue
            );
          }
          return result;
        };
        return descriptor;
      };
    }
    // #endregion Postcondition
    // #region Decorator
    // #region Precondition
    /**
     * A parameter-decorator factory that requests the tagged parameter's value passing it to the provided
     * "check"-method when the value becomes available.
     *
     * @param check	The "( unknown ) => void" to be invoked along with the tagged parameter's value as soon
     * 				as it becomes available.
     * @param dbc  	See {@link DBC.resolveDBCPath }.
     * @param path	The dotted path referring to the actual value to check, starting form the specified one.
     *
     * @returns The **(target: object, methodName: string | symbol, parameterIndex: number ) => void** invoked by Typescript- */
    static decPrecondition(check, dbc, path = void 0) {
      return (target, methodName, parameterIndex) => {
        _DBC.requestParamValue(
          target,
          methodName,
          parameterIndex,
          (value) => {
            if (!_DBC.resolveDBCPath(window, dbc).executionSettings.checkPreconditions) {
              return;
            }
            const realValue = path ? _DBC.resolve(value, path) : value;
            const result = check(realValue, target, methodName, parameterIndex);
            if (typeof result === "string") {
              _DBC.resolveDBCPath(window, dbc).reportParameterInfringement(
                result,
                target,
                path,
                methodName,
                parameterIndex,
                realValue
              );
            }
          }
        );
      };
    }
    // #endregion Precondition
    // #endregion Decorator
    // #region Execution Handling
    /** Stores settings concerning the execution of checks. */
    executionSettings = {
      checkPreconditions: true,
      checkPostconditions: true,
      checkInvariants: true
    };
    // #endregion Execution Handling
    // #region Warning handling.
    /** Stores settings concerning warnings. */
    warningSettings = { logToConsole: true };
    /**
     * Reports a warning.
     *
     * @param message The message containing the warning. */
    reportWarning(message) {
      if (this.warningSettings.logToConsole) {
        console.warn(message);
      }
    }
    // #endregion Warning handling.
    // #region infringement handling.
    /** Stores the settings concerning infringements */
    infringementSettings = { throwException: true, logToConsole: false };
    /**
     * Reports an infringement according to the {@link infringementSettings } also generating a proper {@link string }-wrapper
     * for the given "message" & violator.
     *
     * @param message	The {@link string } describing the infringement and it's provenience.
     * @param violator 	The {@link string } describing or naming the violator. */
    reportInfringement(message, violator, target, path) {
      const finalMessage = `[ From "${violator}"${path ? `'s member "${path}"` : ""}${typeof target === "function" ? ` in "${target.name}"` : typeof target === "object" && target !== null && typeof target.constructor === "function" ? ` in "${target.constructor.name}"` : ""}: ${message}]`;
      if (this.infringementSettings.throwException) {
        throw new _DBC.Infringement(finalMessage);
      }
      if (this.infringementSettings.logToConsole) {
        console.log(finalMessage);
      }
    }
    /**
     * Reports a parameter-infringement via {@link reportInfringement } also generating a proper {@link string }-wrapper
     * for the given "message","method", parameter-"index" & value.
     *
     * @param message	The {@link string } describing the infringement and it's provenience.
     * @param method 	The {@link string } describing or naming the violator.
     * @param index		The index of the parameter within the argument listing.
     * @param value 	The parameter's value. */
    reportParameterInfringement(message, target, path, method, index, value) {
      const properIndex = index + 1;
      this.reportInfringement(
        `[ Parameter-value "${value}" of the ${properIndex}${properIndex === 1 ? "st" : properIndex === 2 ? "nd" : properIndex === 3 ? "rd" : "th"} parameter did not fulfill one of it's contracts: ${message}]`,
        method,
        target,
        path
      );
    }
    /**
     * Reports a field-infringement via {@link reportInfringement } also generating a proper {@link string }-wrapper
     * for the given **message** & **name**.
     *
     * @param message	A {@link string } describing the infringement and it's provenience.
     * @param key 		The property key.
     * @param path		The dotted-path {@link string } that leads to the value not fulfilling the contract starting from
     * 					the tagged one.
     * @param value		The value not fulfilling a contract. */
    reportFieldInfringement(message, target, path, key, value) {
      this.reportInfringement(
        `[ New value for "${key}"${path === void 0 ? "" : `.${path}`} with value "${value}" did not fulfill one of it's contracts: ${message}]`,
        key,
        target,
        path
      );
    }
    /**
     * Reports a returnvalue-infringement according via {@link reportInfringement } also generating a proper {@link string }-wrapper
     * for the given "message","method" & value.
     *
     * @param message	The {@link string } describing the infringement and it's provenience.
     * @param method 	The {@link string } describing or naming the violator.
     * @param value		The parameter's value. */
    reportReturnvalueInfringement(message, target, path, method, value) {
      this.reportInfringement(
        `[ Return-value "${value}" did not fulfill one of it's contracts: ${message}]`,
        method,
        target,
        path
      );
    }
    // #region Classes
    // #region Errors
    /** An {@link Error } to be thrown whenever an infringement is detected. */
    static Infringement = class extends Error {
      /**
       * Constructs this {@link Error } by tagging the specified message-{@link string } as an XDBC-Infringement.
       *
       * @param message The {@link string } describing the infringement. */
      constructor(message) {
        super(`[ XDBC Infringement ${message}]`);
      }
    };
    // #endregion Errors
    // #endregion Classes
    // #endregion infringement handling.
    /**
     * Resolves the specified dotted {@link string }-path to a {@link DBC }.
     *
     * @param obj 	The {@link object } to start resolving from.
     * @param path 	The dotted {@link string }-path leading to the {@link DBC }.
     *
     * @returns The requested {@link DBC }.
     */
    static resolveDBCPath = (obj, path) => path?.split(".").reduce((accumulator, current) => accumulator[current], obj);
    /**
     * Constructs this {@link DBC } by setting the {@link DBC.infringementSettings }, define the **WaXCode** namespace in
     * **window** if not yet available and setting the property **DBC** in there to the instance of this {@link DBC }.
     *
     * @param infringementSettings 	See {@link DBC.infringementSettings }.
     * @param executionSettings		See {@link DBC.executionSettings }. */
    constructor(infringementSettings = { throwException: true, logToConsole: false }, executionSettings = {
      checkPreconditions: true,
      checkPostconditions: true,
      checkInvariants: true
    }) {
      this.infringementSettings = infringementSettings;
      if (window.WaXCode === void 0) window.WaXCode = {};
      window.WaXCode.DBC = this;
    }
    /**
     * Resolves the desired {@link object } out a given one **toResolveFrom** using the specified **path**.
     *
     * @param toResolveFrom The {@link object } starting to resolve from.
     * @param path			The dotted path-{@link string }.
     * 						This string uses ., [...], and () to represent accessing nested properties,
     * 						array elements/object keys, and calling methods, respectively, mimicking JavaScript syntax to navigate
     * 						an object's structure. Code, e.g. something like a.b( 1 as number ).c, will not be executed and
     * 						thus make the retrieval fail.
     *
     * @returns The requested {@link object }, NULL or UNDEFINED. */
    static resolve(toResolveFrom, path) {
      if (!toResolveFrom || typeof path !== "string") {
        return void 0;
      }
      const parts = path.replace(/\[(['"]?)(.*?)\1\]/g, ".$2").split(".");
      let current = toResolveFrom;
      for (const part of parts) {
        if (current === null || typeof current === "undefined") {
          return void 0;
        }
        const methodMatch = part.match(/(\w+)\((.*)\)/);
        if (methodMatch) {
          const methodName = methodMatch[1];
          const argsStr = methodMatch[2];
          const args = argsStr.split(",").map((arg) => arg.trim());
          if (typeof current[methodName] === "function") {
            current = current[methodName].apply(current, args);
          } else {
            return void 0;
          }
        } else {
          current = current[part];
        }
      }
      return current;
    }
  };
  new DBC();

  // ../../node_modules/xdbc/src/DBC/DEFINED.ts
  var DEFINED = class _DEFINED extends DBC {
    /**
     * Checks if the value **toCheck** is null or undefined.
     *
     * @param toCheck	The {@link Object } to check.
     *
     * @returns TRUE if the value **toCheck** is of the specified **type**, otherwise FALSE. */
    // biome-ignore lint/suspicious/noExplicitAny: Necessary for dynamic type checking of also UNDEFINED.
    static checkAlgorithm(toCheck) {
      if (toCheck === void 0 || toCheck === null) {
        return `Value may not be UNDEFINED or NULL but it is ${toCheck === void 0 ? "UNDEFINED" : "NULL"}`;
      }
      return true;
    }
    /**
     * A parameter-decorator factory using the {@link DEFINED.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged parameter.
     *
     * @param type	See {@link DEFINED.checkAlgorithm }.
     * @param path	See {@link DBC.decPrecondition }.
     * @param dbc	See {@link DBC.decPrecondition }.
     *
     * @returns See {@link DBC.decPrecondition }. */
    static PRE(path = void 0, dbc = "WaXCode.DBC") {
      return DBC.decPrecondition(
        (value, target, methodName, parameterIndex) => {
          return _DEFINED.checkAlgorithm(value);
        },
        dbc,
        path
      );
    }
    /**
     * A method-decorator factory using the {@link DEFINED.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged method's returnvalue.
     *
     * @param type	See {@link DEFINED.checkAlgorithm }.
     * @param path	See {@link DBC.Postcondition }.
     * @param dbc	See {@link DBC.decPostcondition }.
     *
     * @returns See {@link DBC.decPostcondition }. */
    static POST(type, path = void 0, dbc = "WaXCode.DBC") {
      return DBC.decPostcondition(
        (value, target, propertyKey) => {
          return _DEFINED.checkAlgorithm(value);
        },
        dbc,
        path
      );
    }
    /**
     * A field-decorator factory using the {@link DEFINED.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged field.
     *
     * @param type	See {@link DEFINED.checkAlgorithm }.
     * @param path	See {@link DBC.decInvariant }.
     * @param dbc	See {@link DBC.decInvariant }.
     *
     * @returns See {@link DBC.decInvariant }. */
    static INVARIANT(type, path = void 0, dbc = "WaXCode.DBC") {
      return DBC.decInvariant([new _DEFINED()], path, dbc);
    }
    // #endregion Condition checking.
    // #region Referenced Condition checking.
    //
    // For usage in dynamic scenarios (like with AE-DBC).
    //
    /**
     * Invokes the {@link DEFINED.checkAlgorithm } passing the value **toCheck** and the {@link DEFINED.type } .
     *
     * @param toCheck See {@link DEFINED.checkAlgorithm }.
     *
     * @returns See {@link DEFINED.checkAlgorithm}. */
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    check(toCheck) {
      return _DEFINED.checkAlgorithm(toCheck);
    }
    /**
     * Invokes the {@link DEFINED.checkAlgorithm } passing the value **toCheck** and the {@link DEFINED.type } .
     *
     * @param toCheck	See {@link DEFINED.checkAlgorithm }.
     * @param id		A {@link string } identifying this {@link INSTANCE } via the {@link DBC.Infringement }-Message.
     * 
     * @returns The **CANDIDATE** **toCheck** doesn't fulfill this {@link DEFINED }.
     * 
     * @throws A {@link DBC.Infringement } if the **CANDIDATE** **toCheck** does not fulfill this {@link DEFINED }.*/
    static tsCheck(toCheck, id = void 0) {
      const result = _DEFINED.checkAlgorithm(toCheck);
      if (result === true) {
        return toCheck;
      } else {
        throw new DBC.Infringement(`${id ? `(${id}) ` : ""}${result}`);
      }
    }
    /** Creates this {@link DEFINED }. */
    constructor() {
      super();
    }
  };

  // ../../node_modules/xdbc/src/DBC/INSTANCE.ts
  var INSTANCE = class _INSTANCE extends DBC {
    /**
     * Creates this {@link INSTANCE } by setting the protected property {@link INSTANCE.reference } used by {@link INSTANCE.check }.
     *
     * @param reference See {@link INSTANCE.check }. */
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    constructor(reference) {
      super();
      this.reference = reference;
    }
    /**
     * Checks if the value **toCheck** is an instance of the specified **reference**.
     *
     * @param toCheck	The value that has to be an instance of the **reference** in order for this {@link DBC }
     * 					to be fulfilled.
     * @param reference	The {@link object } the one **toCheck** has to be an instance of.
     *
     * @returns TRUE if the value **toCheck** is is an instance of the *reference**, otherwise FALSE. */
    // biome-ignore lint/suspicious/noExplicitAny: In order to perform an "instanceof" check.
    static checkAlgorithm(toCheck, reference) {
      if (!(toCheck instanceof reference)) {
        return `Value has to be an instance of "${reference}" but is of type "${typeof toCheck}"`;
      }
      return true;
    }
    /**
     * A parameter-decorator factory using the {@link INSTANCE.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged parameter.
     *
     * @param reference	See {@link INSTANCE.checkAlgorithm }.
     * @param path	See {@link DBC.decPrecondition }.
     * @param dbc	See {@link DBC.decPrecondition }.
     *
     * @returns See {@link DBC.decPrecondition }. */
    static PRE(reference, path = void 0, dbc = "WaXCode.DBC") {
      return DBC.decPrecondition(
        (value, target, methodName, parameterIndex) => {
          return _INSTANCE.checkAlgorithm(value, reference);
        },
        dbc,
        path
      );
    }
    /**
     * A method-decorator factory using the {@link INSTANCE.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged method's returnvalue.
     *
     * @param reference	See {@link INSTANCE.checkAlgorithm }.
     * @param path	See {@link DBC.Postcondition }.
     * @param dbc	See {@link DBC.decPostcondition }.
     *
     * @returns See {@link DBC.decPostcondition }. */
    static POST(reference, path = void 0, dbc = "WaXCode.DBC") {
      return DBC.decPostcondition(
        (value, target, propertyKey) => {
          return _INSTANCE.checkAlgorithm(value, reference);
        },
        dbc,
        path
      );
    }
    /**
     * A field-decorator factory using the {@link INSTANCE.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged method's returnvalue.
     *
     * @param reference	See {@link INSTANCE.checkAlgorithm }.
     * @param path	See {@link DBC.decInvariant }.
     * @param dbc	See {@link DBC.decInvariant }.
     *
     * @returns See {@link DBC.decInvariant }. */
    static INVARIANT(reference, path = void 0, dbc = "WaXCode.DBC") {
      return DBC.decInvariant([new _INSTANCE(reference)], path, dbc);
    }
    // #endregion Condition checking.
    // #region Referenced Condition checking.
    //
    // For usage in dynamic scenarios (like with AE-DBC).
    //
    /**
     * Invokes the {@link INSTANCE.checkAlgorithm } passing the value **toCheck** and the {@link INSTANCE.reference } .
     *
     * @param toCheck See {@link INSTANCE.checkAlgorithm }.
     *
     * @returns See {@link INSTANCE.checkAlgorithm}. */
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    check(toCheck) {
      return _INSTANCE.checkAlgorithm(toCheck, this.reference);
    }
    /**
     * Invokes the {@link INSTANCE.checkAlgorithm } passing the value **toCheck** and the {@link INSTANCE.reference } .
     * 
     * @param toCheck 	See {@link INSTANCE.checkAlgorithm }.
     * @param reference	See {@link INSTANCE.checkAlgorithm }.
     * @param id		A {@link string } identifying this {@link INSTANCE } via the {@link DBC.Infringement }-Message.
     * 
     * @returns The **CANDIDATE** **toCheck** doesn't fulfill this {@link INSTANCE }.
     * 
     * @throws A {@link DBC.Infringement } if the **CANDIDATE** **toCheck** does not fulfill this {@link DEFINED }. */
    static tsCheck(toCheck, reference, id = void 0) {
      const result = _INSTANCE.checkAlgorithm(toCheck, reference);
      if (result === true) {
        return toCheck;
      } else {
        throw new DBC.Infringement(`${id ? `(${id}) ` : ""}${result}`);
      }
    }
  };

  // ../../node_modules/xdbc/src/DBC/OR.ts
  var OR = class _OR extends DBC {
    /**
     * Creates this {@link OR } by setting the protected property {@link OR.conditions } used by {@link OR.check }.
     *
     * @param conditions See {@link OR.check }. */
    constructor(conditions) {
      super();
      this.conditions = conditions;
    }
    // #region Condition checking.
    /**
     * Checks the **value** against the given **conditions**
     *
     * @param conditions	The **{ check: (toCheck: any) => boolean | string }**-{@link object }s to check the **value** against.
     * @param value			Either **value**-{@link Array < any >}, which's elements will be checked, or the value to be
     * 						checked itself.
     * @param index			If specified with "idxEnd" being undefined, this {@link Number } will be seen as the index of
     * 						the value-{@link Array }'s element to check. If value isn't an {@link Array } this parameter
     * 						will not have any effect.
     * 						With "idxEnd" not undefined this parameter indicates the beginning of the span of elements to
     * 						check within the value-{@link Array }.
     * @param idxEnd		Indicates the last element's index (including) of the span of value-{@link Array } elements to check.
     * 						Setting this parameter to -1 specifies that all value-{@link Array }'s elements beginning from the
     * 						specified **index** shall be checked.
     *
     * @returns TRUE if at least one of the provided **conditions** is fulfilled, otherwise a {@link string } containing all **conditions** returned {@link string }s separated by " || ". */
    static checkAlgorithm(conditions, value) {
      let result = "";
      for (let i = 0; i < conditions.length; i++) {
        const conditionResult = conditions[i].check(value);
        if (typeof conditionResult === "string") {
          result += `${conditionResult}${i === conditions.length - 1 ? "" : " or "}`;
        } else {
          return true;
        }
      }
      return result;
    }
    /**
     * A parameter-decorator factory using the {@link OR.checkAlgorithm } with either multiple or a single one
     * of the **realConditions** to check the tagged parameter-value against with.
     * When specifying an **index** and the tagged parameter's **value** is an {@link Array }, the **realConditions** apply to the
     * element at the specified **index**.
     * If the {@link Array } is too short the currently processed { check: (toCheck: any) => boolean | string } of
     * **realConditions** will be verified to TRUE automatically, considering optional parameters.
     * If an **index** is specified but the tagged parameter's value isn't an array, the **index** is treated as being undefined.
     * If **index** is undefined and the tagged parameter's value is an {@link Array } each element of it will be checked
     * against the **realConditions**.
     *
     * @param realConditions	Either one or more **{ check: (toCheck: any) => boolean | string }** to check the tagged parameter-value
     * 							against with.
     * @param path				See {@link DBC.decPrecondition }.
     * @param dbc				See {@link DBC.decPrecondition }.
     *
     * @returns	A {@link string } as soon as one { check: (toCheck: any) => boolean | string } of **realConditions** returns one.
     * 			Otherwise TRUE. */
    static PRE(conditions, path = void 0, dbc = "WaXCode.DBC") {
      return DBC.decPrecondition(
        (value, target, methodName, parameterIndex) => {
          return _OR.checkAlgorithm(conditions, value);
        },
        dbc,
        path
      );
    }
    /**
     * A method-decorator factory using the {@link OR.checkAlgorithm } with either multiple or a single one
     * of the **realConditions** to check the tagged method's return-value against with.
     *
     * @param realConditions	Either one or more { check: (toCheck: any) => boolean | string } to check the tagged parameter-value
     * 							against with.
     * @param path				See {@link DBC.decPrecondition }.
     * @param dbc				See {@link DBC.decPrecondition }.
     *
     * @returns	A {@link string } as soon as one **{ check: (toCheck: any) => boolean | string }** of **realConditions** return one.
     * 			Otherwise TRUE. */
    static POST(conditions, path = void 0, dbc = "WaXCode.DBC") {
      return DBC.decPostcondition(
        (value, target, propertyKey) => {
          return _OR.checkAlgorithm(conditions, value);
        },
        dbc,
        path
      );
    }
    /**
     * A field-decorator factory using the {@link OR.checkAlgorithm } with either multiple or a single one
     * of the **realConditions** to check the tagged field.
     *
     * @param realConditions	Either one or more { check: (toCheck: any) => boolean | string } to check the tagged parameter-value
     * 							against with.
     * @param path				See {@link DBC.decInvariant }.
     * @param dbc				See {@link DBC.decInvariant }.
     *
     * @returns	See {@link DBC.decInvariant }. */
    static INVARIANT(conditions, path = void 0, dbc = "WaXCode.DBC") {
      return DBC.decInvariant([new _OR(conditions)], path, dbc);
    }
    // #endregion Condition checking.
    // #region Referenced Condition checking.
    //
    // For usage in dynamic scenarios (like global functions).
    //
    /**
     * Invokes the {@link OR.checkAlgorithm } passing the value **toCheck** and {@link OR.conditions }.
     *
     * @param toCheck See {@link OR.checkAlgorithm }.
     *
     * @returns See {@link OR.checkAlgorithm}. */
    check(toCheck) {
      return _OR.checkAlgorithm(this.conditions, toCheck);
    }
    /**
     * Invokes the {@link OR.checkAlgorithm } passing the value **toCheck** and the {@link OR.type } .
     *
     * @param toCheck See {@link OR.checkAlgorithm }.
     *
     * @returns The **CANDIDATE** **toCheck** doesn't fulfill this {@link OR }.
     * 
     * @throws A {@link DBC.Infringement } if the **CANDIDATE** **toCheck** does not fulfill this {@link OR }.*/
    static tsCheck(toCheck, conditions) {
      const result = _OR.checkAlgorithm(conditions, toCheck);
      if (result) {
        return toCheck;
      } else {
        throw new DBC.Infringement(result);
      }
    }
    // #endregion Referenced Condition checking.
  };

  // ../../node_modules/xdbc/src/DBC/EQ.ts
  var EQ = class _EQ extends DBC {
    /**
     * Creates this {@link EQ } by setting the protected property {@link EQ.equivalent } used by {@link EQ.check }.
     *
     * @param equivalent See {@link EQ.check }. */
    constructor(equivalent, invert = false) {
      super();
      this.equivalent = equivalent;
      this.invert = invert;
    }
    // #region Condition checking.
    /**
     * Checks if the value **toCheck** is equal to the specified **equivalent**.
     *
     * @param toCheck		The value that has to be equal to it's possible **equivalent** for this {@link DBC } to be fulfilled.
     * @param equivalent	The {@link object } the one **toCheck** has to be equal to in order for this {@link DBC } to be
     * 						fulfilled.
     *
     * @returns TRUE if the value **toCheck** and the **equivalent** are equal to each other, otherwise FALSE. */
    static checkAlgorithm(toCheck, equivalent, invert) {
      if (!invert && equivalent !== toCheck) {
        return `Value has to to be equal to "${equivalent}"`;
      }
      if (invert && equivalent === toCheck) {
        return `Value must not to be equal to "${equivalent}"`;
      }
      return true;
    }
    /**
     * A parameter-decorator factory using the {@link EQ.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged parameter.
     *
     * @param equivalent	See {@link EQ.checkAlgorithm }.
     * @param path			See {@link DBC.decPrecondition }.
     * @param dbc			See {@link DBC.decPrecondition }.
     *
     * @returns See {@link DBC.decPrecondition }. */
    static PRE(equivalent, invert = false, path = void 0, dbc = "WaXCode.DBC") {
      return DBC.decPrecondition(
        (value, target, methodName, parameterIndex) => {
          return _EQ.checkAlgorithm(value, equivalent, invert);
        },
        dbc,
        path
      );
    }
    /**
     * A method-decorator factory using the {@link EQ.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged method's returnvalue.
     *
     * @param equivalent	See {@link EQ.checkAlgorithm }.
     * @param path			See {@link DBC.Postcondition }.
     * @param dbc			See {@link DBC.decPostcondition }.
     *
     * @returns See {@link DBC.decPostcondition }. */
    static POST(equivalent, invert = false, path = void 0, dbc = "WaXCode.DBC") {
      return DBC.decPostcondition(
        (value, target, propertyKey) => {
          return _EQ.checkAlgorithm(value, equivalent, invert);
        },
        dbc,
        path
      );
    }
    /**
     * A field-decorator factory using the {@link EQ.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged field.
     *
     * @param equivalent	See {@link EQ.checkAlgorithm }.
     * @param path			See {@link DBC.decInvariant }.
     * @param dbc			See {@link DBC.decInvariant }.
     *
     * @returns See {@link DBC.decInvariant }. */
    static INVARIANT(equivalent, invert = false, path = void 0, dbc = "WaXCode.DBC") {
      return DBC.decInvariant([new _EQ(equivalent, invert)], path, dbc);
    }
    // #endregion Condition checking.
    // #region Referenced Condition checking.
    //
    // For usage in dynamic scenarios (like with AE-DBC).
    //
    /**
     * Invokes the {@link EQ.checkAlgorithm } passing the value **toCheck**, {@link EQ.equivalent } and {@link EQ.invert }.
     *
     * @param toCheck See {@link EQ.checkAlgorithm }.
     *
     * @returns See {@link EQ.checkAlgorithm}. */
    // biome-ignore lint/suspicious/noExplicitAny: Necessary to check against NULL & UNDEFINED.
    check(toCheck) {
      return _EQ.checkAlgorithm(toCheck, this.equivalent, this.invert);
    }
    /**
     * Invokes the {@link EQ.checkAlgorithm } passing the value **toCheck** and the specified **type** .
     *
     * @param toCheck See {@link EQ.checkAlgorithm }.
     *
     * @returns The **CANDIDATE** **toCheck** doesn't fulfill this {@link EQ }.
     * 
     * @throws A {@link DBC.Infringement } if the **CANDIDATE** **toCheck** does not fulfill this {@link EQ }.*/
    static tsCheck(toCheck, equivalent) {
      const result = _EQ.checkAlgorithm(toCheck, equivalent, false);
      if (result) {
        return toCheck;
      } else {
        throw new DBC.Infringement(result);
      }
    }
    // #endregion Referenced Condition checking.
  };

  // ../../node_modules/xdbc/src/DBC/IF.ts
  var IF = class _IF extends DBC {
    /**
     * Creates this {@link IF } by setting the protected property {@link IF.equivalent } used by {@link IF.check }.
     *
     * @param equivalent See {@link IF.check }. */
    constructor(condition, inCase, invert = false) {
      super();
      this.condition = condition;
      this.inCase = inCase;
      this.invert = invert;
    }
    // #region Condition checking.
    /**
     * Checks if the value **toCheck** complies to the specified **condition** and if so does also comply to the one **inCase**.
     *
     * @param toCheck	The value that has to be equal to it's possible **equivalent** for this {@link DBC } to be fulfilled.
     * @param condition	The contract **toCheck** has to comply to in order to also have to comply to the one **inCase**.
     * @param inCase	The contract **toCheck** has to also comply to if it complies to **condition**.
     *
     * @returns TRUE if the value **toCheck** and the **equivalent** are equal to each other, otherwise FALSE. */
    static checkAlgorithm(toCheck, condition, inCase, invert) {
      if (!invert && condition.check(toCheck) && !inCase.check(toCheck)) {
        return `In case that the value complies to "${condition}" it also has to comply to "${inCase}"`;
      }
      if (!invert && !condition.check(toCheck) && !inCase.check(toCheck)) {
        return `In case that the value does not comply to "${condition}" it has to comply to "${inCase}"`;
      }
      return true;
    }
    /**
     * A parameter-decorator factory using the {@link EQ.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged parameter.
     *
     * @param condition	See {@link IF.checkAlgorithm }.
     * @param inCase	See {@link IF.checkAlgorithm }.
     * @param path		See {@link DBC.decPrecondition }.
     * @param dbc		See {@link DBC.decPrecondition }.
     *
     * @returns See {@link DBC.decPrecondition }. */
    static PRE(condition, inCase, invert = false, path = void 0, dbc = "WaXCode.DBC") {
      return DBC.decPrecondition(
        (value, target, methodName, parameterIndex) => {
          return _IF.checkAlgorithm(value, condition, inCase, invert);
        },
        dbc,
        path
      );
    }
    /**
     * A method-decorator factory using the {@link IF.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged method's returnvalue.
     *
     * @param condition	See {@link IF.checkAlgorithm }.
     * @param inCase	See {@link IF.checkAlgorithm }.
     * @param path		See {@link DBC.Postcondition }.
     * @param dbc		See {@link DBC.decPostcondition }.
     *
     * @returns See {@link DBC.decPostcondition }. */
    static POST(condition, inCase, invert = false, path = void 0, dbc = "WaXCode.DBC") {
      return DBC.decPostcondition(
        (value, target, propertyKey) => {
          return _IF.checkAlgorithm(value, condition, inCase, invert);
        },
        dbc,
        path
      );
    }
    /**
     * A field-decorator factory using the {@link IF.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged field.
     *
     * @param condition	See {@link IF.checkAlgorithm }.
     * @param inCase	See {@link IF.checkAlgorithm }.
     * @param path			See {@link DBC.decInvariant }.
     * @param dbc			See {@link DBC.decInvariant }.
     *
     * @returns See {@link DBC.decInvariant }. */
    static INVARIANT(condition, inCase, invert = false, path = void 0, dbc = "WaXCode.DBC") {
      return DBC.decInvariant([new _IF(condition, inCase, invert)], path, dbc);
    }
    // #endregion Condition checking.
    // #region Referenced Condition checking.
    //
    // For usage in dynamic scenarios (like with AE-DBC).
    //
    /**
     * Invokes the {@link IF.checkAlgorithm } passing the value **toCheck**, {@link IF.equivalent } and {@link IF.invert }.
     *
     * @param toCheck See {@link IF.checkAlgorithm }.
     *
     * @returns See {@link IF.checkAlgorithm}. */
    // biome-ignore lint/suspicious/noExplicitAny: Necessary to check against NULL & UNDEFINED.
    check(toCheck) {
      return _IF.checkAlgorithm(toCheck, this.condition, this.inCase, this.invert);
    }
    // #endregion Referenced Condition checking.
  };

  // ../../node_modules/xdbc/src/DBC/REGEX.ts
  var REGEX = class _REGEX extends DBC {
    /**
     * Creates this {@link REGEX } by setting the protected property {@link REGEX.expression } used by {@link REGEX.check }.
     *
     * @param expression See {@link REGEX.check }. */
    constructor(expression) {
      super();
      this.expression = expression;
    }
    /** Stores often used {@link RegExp }s. */
    static stdExp = {
      htmlAttributeName: /^[a-zA-Z_:][a-zA-Z0-9_.:-]*$/,
      eMail: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i,
      property: /^[$_A-Za-z][$_A-Za-z0-9]*$/,
      url: /^(?:(?:http:|https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:localhost|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})(?::\d{2,5})?(?:\/(?:[\w\-\.]*\/)*[\w\-\.]+(?:\?\S*)?(?:#\S*)?)?$/i,
      keyPath: /^([a-zA-Z_$][a-zA-Z0-9_$]*\.)*[a-zA-Z_$][a-zA-Z0-9_$]*$/,
      date: /^\d{1,4}[.\/-]\d{1,2}[.\/-]\d{1,4}$/i,
      dateFormat: /^((D{1,2}[./-]M{1,2}[./-]Y{1,4})|(M{1,2}[./-]D{1,2}[./-]Y{1,4})|Y{1,4}[./-]D{1,2}[./-]M{1,2}|(Y{1,4}[./-]M{1,2}[./-]D{1,2}))$/i,
      cssSelector: /^(?:\*|#[\w-]+|\.[\w-]+|(?:[\w-]+|\*)(?::(?:[\w-]+(?:\([\w-]+\))?)+)?(?:\[(?:[\w-]+(?:(?:=|~=|\|=|\*=|\$=|\^=)\s*(?:"[^"]*"|'[^']*'|[\w-]+)\s*)?)?\])+|\[\s*[\w-]+\s*=\s*(?:"[^"]*"|'[^']*'|[\w-]+)\s*\])(?:,\s*(?:\*|#[\w-]+|\.[\w-]+|(?:[\w-]+|\*)(?::(?:[\w-]+(?:\([\w-]+\))?)+)?(?:\[(?:[\w-]+(?:(?:=|~=|\|=|\*=|\$=|\^=)\s*(?:"[^"]*"|'[^']*'|[\w-]+)\s*)?)?\])+|\[\s*[\w-]+\s*=\s*(?:"[^"]*"|'[^']*'|[\w-]+)\s*\]))*$/
    };
    // #region Condition checking.
    /**
     * Checks if the value **toCheck** is complies to the {@link RegExp } **expression**.
     *
     * @param toCheck		The value that has comply to the {@link RegExp } **expression** for this {@link DBC } to be fulfilled.
     * @param expression	The {@link RegExp } the one **toCheck** has comply to in order for this {@link DBC } to be
     * 						fulfilled.
     *
     * @returns TRUE if the value **toCheck** complies with the {@link RegExp } **expression**, otherwise FALSE. */
    static checkAlgorithm(toCheck, expression) {
      if (!expression.test(toCheck)) {
        return `Value has to comply to regular expression "${expression}"`;
      }
      return true;
    }
    /**
     * A parameter-decorator factory using the {@link REGEX.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged parameter.
     *
     * @param expression	See {@link REGEX.checkAlgorithm }.
     * @param path			See {@link DBC.decPrecondition }.
     * @param dbc			See {@link DBC.decPrecondition }.
     *
     * @returns See {@link DBC.decPrecondition }. */
    static PRE(expression, path = void 0, dbc = "WaXCode.DBC") {
      return DBC.decPrecondition(
        (value, target, methodName, parameterIndex) => {
          return _REGEX.checkAlgorithm(value, expression);
        },
        dbc,
        path
      );
    }
    /**
     * A method-decorator factory using the {@link REGEX.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged method's returnvalue.
     *
     * @param expression	See {@link REGEX.checkAlgorithm }.
     * @param path			See {@link DBC.Postcondition }.
     * @param dbc			See {@link DBC.decPostcondition }.
     *
     * @returns See {@link DBC.decPostcondition }. */
    static POST(expression, path = void 0, dbc = "WaXCode.DBC") {
      return DBC.decPostcondition(
        (value, target, propertyKey) => {
          return _REGEX.checkAlgorithm(value, expression);
        },
        dbc,
        path
      );
    }
    /**
     * A field-decorator factory using the {@link REGEX.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged field.
     *
     * @param expression	See {@link REGEX.checkAlgorithm }.
     * @param path			See {@link DBC.decInvariant }.
     * @param dbc			See {@link DBC.decInvariant }.
     *
     * @returns See {@link DBC.decInvariant }. */
    static INVARIANT(expression, path = void 0, dbc = "WaXCode.DBC") {
      return DBC.decInvariant([new _REGEX(expression)], path, dbc);
    }
    // #endregion Condition checking.
    // #region Referenced Condition checking.
    //
    // For usage in dynamic scenarios (like with AE-DBC).
    //
    /**
     * Invokes the {@link REGEX.checkAlgorithm } passing the value **toCheck** and {@link REGEX.equivalent }.
     *
     * @param toCheck See {@link REGEX.checkAlgorithm }.
     *
     * @returns See {@link EQ.checkAlgorithm}. */
    check(toCheck) {
      return _REGEX.checkAlgorithm(toCheck, this.expression);
    }
    // #endregion Referenced Condition checking.
    // #region In-Method checking.
    /**
     * Invokes the {@link REGEX.checkAlgorithm } passing the value **toCheck** and {@link REGEX.expression }.
     *
     * @param toCheck		See {@link REGEX.checkAlgorithm}.
     * @param expression	See {@link REGEX.checkAlgorithm}.
     */
    static check(toCheck, expression) {
      const checkResult = _REGEX.checkAlgorithm(toCheck, expression);
      if (typeof checkResult === "string") {
        throw new DBC.Infringement(checkResult);
      }
    }
    // #endregion In-Method checking.
  };

  // ../../node_modules/xdbc/src/DBC/HasAttribute.ts
  var HasAttribute = class _HasAttribute extends DBC {
    /**
     * Creates this {@link DBC } by setting the protected property {@link hasAttribute.equivalent } used by
     * {@link hasAttribute.check }.
     *
     * @param toCheckFor See {@link hasAttribute.check }. */
    constructor(toCheckFor, invert = false) {
      super();
      this.toCheckFor = toCheckFor;
      this.invert = invert;
    }
    // #region Condition checking.
    /**
     * Checks if the {@link HTMLElement } **toCheck** has the attribute **toCheckFor**.
     *
     * @param toCheckFor  name of the attribute to check for whether it is set or not.
     *
     * @returns TRUE if the {@link HTMLElement } **toCheck** has set the attribute **toCheckFor**,
     * 			otherwise a proper errormessage. */
    static checkAlgorithm(toCheck, toCheckFor, invert) {
      if (!(toCheck instanceof HTMLElement)) {
        return `The object to check for whether it has the attribute "${toCheckFor}" is not a HTMLElement. It is of type "${typeof toCheck}".`;
      }
      if (!invert && !toCheck.hasAttribute(toCheckFor)) {
        return `Required Attribute "${toCheckFor}" is not set.`;
      }
      if (invert && toCheck.hasAttribute(toCheckFor)) {
        return `Forbidden Attribute "${toCheckFor}" is set.`;
      }
      return true;
    }
    /**
     * A parameter-decorator factory using the {@link HasAttribute.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
     * by the tagged parameter.
     *
     * @param toCheckFor	See {@link HasAttribute.checkAlgorithm }.
     * @param path			See {@link DBC.decPrecondition }.
     * @param dbc			See {@link DBC.decPrecondition }.
     *
     * @returns See {@link DBC.decPrecondition }. */
    static PRE(toCheckFor, invert = false, path = void 0, dbc = "WaXCode.DBC") {
      return DBC.decPrecondition(
        (value, target, methodName, parameterIndex) => {
          return _HasAttribute.checkAlgorithm(value, toCheckFor, invert);
        },
        dbc,
        path
      );
    }
    /**
     * A method-decorator factory using the {@link HasAttribute.checkAlgorithm } to determine whether this {@link DBC } is
     * fulfilled by the tagged method's returnvalue.
     *
     * @param toCheckFor	See {@link HasAttribute.checkAlgorithm }.
     * @param path			See {@link DBC.Postcondition }.
     * @param dbc			See {@link DBC.decPostcondition }.
     *
     * @returns See {@link DBC.decPostcondition }. */
    static POST(toCheckFor, invert = false, path = void 0, dbc = "WaXCode.DBC") {
      return DBC.decPostcondition(
        (value, target, propertyKey) => {
          return _HasAttribute.checkAlgorithm(value, toCheckFor, invert);
        },
        dbc,
        path
      );
    }
    /**
     * A field-decorator factory using the {@link hasAttribute.checkAlgorithm } to determine whether this {@link DBC } is
     * fulfilled by the tagged field.
     *
     * @param toCheckFor	See {@link hasAttribute.checkAlgorithm }.
     * @param path			See {@link DBC.decInvariant }.
     * @param dbc			See {@link DBC.decInvariant }.
     *
     * @returns See {@link DBC.decInvariant }. */
    static INVARIANT(toCheckFor, invert = false, path = void 0, dbc = "WaXCode.DBC") {
      return DBC.decInvariant([new _HasAttribute(toCheckFor, invert)], path, dbc);
    }
    /**
     * A field-decorator factory using the {@link hasAttribute.checkAlgorithm } to determine whether this {@link DBC } is
     * fulfilled by the tagged field's class instance.
     *
     * @param toCheckFor	See {@link hasAttribute.checkAlgorithm }.
     * @param path			See {@link DBC.decInvariant }.
     * @param dbc			See {@link DBC.decInvariant }.
     *
     * @returns See {@link DBC.decInvariant }. */
    static cINVARIANT(toCheckFor, invert = false, path = void 0, dbc = "WaXCode.DBC") {
      return DBC.decClassInvariant([new _HasAttribute(toCheckFor, invert)], path, dbc);
    }
    // #endregion Condition checking.
    // #region Referenced Condition checking.
    //
    // For usage in dynamic scenarios (like with AE-DBC).
    //
    /**
     * Invokes the {@link hasAttribute.checkAlgorithm } passing the value **toCheck**, {@link hasAttribute.equivalent } and
     * {@link hasAttribute.invert }.
     *
     * @param toCheck See {@link EQ.checkAlgorithm }.
     *
     * @returns See {@link EQ.checkAlgorithm}. */
    // biome-ignore lint/suspicious/noExplicitAny: Necessary to check against NULL & UNDEFINED.
    check(toCheck) {
      return _HasAttribute.checkAlgorithm(toCheck, this.toCheckFor, this.invert);
    }
    // #endregion Referenced Condition checking.
  };

  // ../../node_modules/@de-xima/xima-common-js-lang/dist/mjs/src/type-guard.js
  function isInstance(object, proto) {
    return typeof proto === "function" && object instanceof proto;
  }
  function beingInstance(proto) {
    return (object) => isInstance(object, proto);
  }

  // ../../node_modules/@de-xima/xima-common-js-lang/dist/mjs/src/environment.js
  function getGlobalThis() {
    if (typeof globalThis !== "undefined") {
      return globalThis;
    }
    if (typeof window !== "undefined") {
      return window;
    }
    if (typeof global !== "undefined") {
      return global;
    }
    if (typeof self !== "undefined") {
      return self;
    }
    if (typeof frames !== "undefined") {
      return frames;
    }
    throw new Error("Unable to locate global object");
  }

  // ../../node_modules/@de-xima/xima-common-js-lang/dist/mjs/src/coercion.js
  function parseString(value) {
    if (value === null || value === void 0) {
      return "";
    }
    return String(value);
  }
  function parseBoolean(value) {
    if (typeof value === "boolean") {
      return value;
    }
    if (value === null || value === void 0) {
      return false;
    }
    if (typeof value === "string") {
      return value === "" ? false : value !== "false" && value !== "0";
    }
    if (typeof value === "number") {
      return Number.isNaN(value) ? false : value !== 0;
    }
    return !!value;
  }

  // ../../node_modules/@de-xima/xima-common-js-lang/dist/mjs/src/iterable.js
  function filter(items, filter2) {
    return {
      [Symbol.iterator]: () => {
        const it = items[Symbol.iterator]();
        return {
          next: () => {
            let value;
            do {
              const next = it.next();
              if (next.done === true) {
                return next;
              }
              value = next.value;
            } while (!filter2(value));
            return { done: false, value };
          }
        };
      }
    };
  }
  function firstIndex(items, predicate) {
    let index = 0;
    for (const item of items) {
      const matches = predicate(item, index);
      if (matches) {
        return index;
      }
      index += 1;
    }
    return -1;
  }

  // ../../node_modules/@de-xima/xima-common-js-lang/dist/mjs/src/collection.js
  function randomAccessToIterableGenerator(container, randomAccessor) {
    return {
      [Symbol.iterator]: () => {
        const length = randomAccessor.getLength(container);
        let index = 0;
        return {
          next: () => {
            let value = void 0;
            while (index < length) {
              value = randomAccessor.getItem(container, index);
              index += 1;
              if (value !== void 0) {
                return { done: false, value };
              }
            }
            return { done: true, value: void 0 };
          }
        };
      }
    };
  }
  var ReadonlyMapKeySet = class {
    constructor(map2, str) {
      this[Symbol.toStringTag] = str;
      this._map = map2;
    }
    [(Symbol.toStringTag, Symbol.iterator)]() {
      return this._map.keys();
    }
    get size() {
      return this._map.size;
    }
    entries() {
      const iterator = this._map.keys();
      const iterableIterator = {
        [Symbol.iterator]: () => iterableIterator,
        next: () => {
          const { done, value } = iterator.next();
          if (done === true) {
            return { done: true, value: void 0 };
          } else {
            return { done: false, value: [value, value] };
          }
        }
      };
      return iterableIterator;
    }
    forEach(callbackfn, thisArg) {
      this._map.forEach((_2, key) => callbackfn.call(thisArg, key, key, this));
    }
    has(value) {
      return this._map.has(value);
    }
    keys() {
      return this._map.keys();
    }
    values() {
      return this._map.keys();
    }
  };
  function randomAccessToIterable(container, randomAccessor) {
    if (Array.isArray(container)) {
      return container;
    }
    return randomAccessToIterableGenerator(container, randomAccessor);
  }

  // ../../node_modules/@de-xima/xima-common-js-lang/dist/mjs/src/reducer.js
  var Void = Symbol("Void");

  // ../../node_modules/@de-xima/xima-common-js-lang/dist/mjs/src/function.js
  var _ = Symbol("CurryPlaceholder");
  function identity(item) {
    return item;
  }
  function takeFirstOf2(first2, _second) {
    return first2;
  }
  function takeSecondOf2(_first, second) {
    return second;
  }
  function takeAllArguments(...args) {
    return args;
  }

  // ../../node_modules/@de-xima/xima-common-js-lang/dist/mjs/src/record.js
  function recordKeys(record) {
    return Object.keys(record);
  }
  function recordValues(record) {
    const values = [];
    for (const key of recordKeys(record)) {
      values.push(record[key]);
    }
    return values;
  }

  // ../../node_modules/@de-xima/xima-common-js-lang/dist/mjs/src/weak-collection.js
  var _a;
  var _b;
  function createIterableIteratorSet(refs, mapFn) {
    const it = refs.values();
    const iterableIterator = {
      next: () => {
        for (let res = it.next(); res.done !== true; res = it.next()) {
          const ref = res.value;
          const value = ref.deref();
          if (value !== void 0) {
            return { done: false, value: mapFn(value) };
          }
        }
        return { done: true, value: void 0 };
      },
      [Symbol.iterator]: () => iterableIterator
    };
    return iterableIterator;
  }
  function createIterableIteratorMap(refs, map2, mapFn) {
    const it = refs.values();
    const iterableIterator = {
      next: () => {
        for (let res = it.next(); res.done !== true; res = it.next()) {
          const key = res.value.deref();
          if (key !== void 0) {
            const entry = map2.get(key);
            if (entry !== void 0) {
              const mapped = mapFn(key, entry.value);
              return { done: false, value: mapped };
            }
          }
        }
        return { done: true, value: void 0 };
      },
      [Symbol.iterator]: () => iterableIterator
    };
    return iterableIterator;
  }
  var IterableWeakSet = class {
    constructor() {
      this[_a] = "IterableWeakSet";
      this._id = Number.MIN_SAFE_INTEGER;
      this._map = /* @__PURE__ */ new WeakMap();
      this._refs = /* @__PURE__ */ new Map();
      this._finalizer = new FinalizationRegistry((id) => this._refs.delete(id));
    }
    [(_a = Symbol.toStringTag, Symbol.iterator)]() {
      return createIterableIteratorSet(this._refs, identity);
    }
    get size() {
      return this._refs.size;
    }
    add(value) {
      if (!this._map.has(value)) {
        const id = this._id++;
        this._map.set(value, id);
        this._refs.set(id, new WeakRef(value));
        this._finalizer.register(value, id, value);
      }
      return this;
    }
    clear() {
      for (let it = this._refs.values(), res = it.next(); res.done !== true; res = it.next()) {
        const value = res.value.deref();
        if (value !== void 0) {
          this._map.delete(value);
          this._finalizer.unregister(value);
        }
      }
      this._refs.clear();
    }
    delete(value) {
      const id = this._map.get(value);
      if (id === void 0) {
        return false;
      }
      this._refs.delete(id);
      this._map.delete(value);
      this._finalizer.unregister(value);
      return true;
    }
    entries() {
      return createIterableIteratorSet(this._refs, (value) => [value, value]);
    }
    forEach(callbackfn, thisArg) {
      for (const ref of this._refs.values()) {
        const item = ref.deref();
        if (item !== void 0) {
          callbackfn.call(thisArg, item, item, this);
        }
      }
    }
    has(value) {
      return this._map.has(value);
    }
    keys() {
      return this.values();
    }
    values() {
      return createIterableIteratorSet(this._refs, identity);
    }
  };
  var IterableWeakMap = class {
    constructor() {
      this[_b] = "IterableWeakMap";
      this._id = Number.MIN_SAFE_INTEGER;
      this._map = /* @__PURE__ */ new WeakMap();
      this._refs = /* @__PURE__ */ new Map();
      this._finalizer = new FinalizationRegistry((id) => this._refs.delete(id));
    }
    [(_b = Symbol.toStringTag, Symbol.iterator)]() {
      return createIterableIteratorMap(this._refs, this._map, takeAllArguments);
    }
    get size() {
      return this._refs.size;
    }
    clear() {
      for (let it = this._refs.values(), res = it.next(); res.done !== true; res = it.next()) {
        const key = res.value.deref();
        if (key !== void 0) {
          this._map.delete(key);
          this._finalizer.unregister(key);
        }
      }
      this._refs.clear();
    }
    delete(key) {
      const entry = this._map.get(key);
      if (entry === void 0) {
        return false;
      }
      this._refs.delete(entry.id);
      this._map.delete(key);
      this._finalizer.unregister(key);
      return true;
    }
    entries() {
      return createIterableIteratorMap(this._refs, this._map, takeAllArguments);
    }
    forEach(callbackfn, thisArg) {
      for (const ref of this._refs.values()) {
        const key = ref.deref();
        if (key !== void 0) {
          const entry = this._map.get(key);
          if (entry !== void 0) {
            callbackfn.call(thisArg, entry.value, key, this);
          }
        }
      }
    }
    get(key) {
      var _c;
      return (_c = this._map.get(key)) === null || _c === void 0 ? void 0 : _c.value;
    }
    has(key) {
      return this._map.has(key);
    }
    keys() {
      return createIterableIteratorMap(this._refs, this._map, takeFirstOf2);
    }
    set(key, value) {
      if (this._map.has(key)) {
        const entry = this._map.get(key);
        if (entry !== void 0) {
          entry.value = value;
        }
      } else {
        const id = this._id++;
        this._map.set(key, { id, value });
        this._refs.set(id, new WeakRef(key));
        this._finalizer.register(key, id, key);
      }
      return this;
    }
    values() {
      return createIterableIteratorMap(this._refs, this._map, takeSecondOf2);
    }
  };

  // ../../node_modules/@de-xima/xima-common-js-dom/dist/mjs/src/dom-search.js
  function allByCssAs(cssSelector, targetType, base) {
    const elements = (base !== null && base !== void 0 ? base : getGlobalThis().document).querySelectorAll(cssSelector);
    return [...filter(nodeListToIterable(elements), beingInstance(targetType))];
  }
  function allByCssHtml(cssSelector, base) {
    return allByCssAs(cssSelector, HTMLElement, base);
  }
  function byCssAs(cssSelector, targetType, base) {
    const element = (base !== null && base !== void 0 ? base : getGlobalThis().document).querySelector(cssSelector);
    return isInstance(element, targetType) ? element : void 0;
  }
  function byCssHtml(cssSelector, base) {
    return byCssAs(cssSelector, HTMLElement, base);
  }

  // ../../node_modules/@de-xima/xima-common-js-dom/dist/mjs/src/element.js
  var DomListRandomAccessor = {
    getItem: (list, index) => list.item(index),
    getLength: (list) => list.length
  };
  function domListRandomAccessor() {
    return DomListRandomAccessor;
  }
  function nodeListToIterable(nodeList) {
    return randomAccessToIterable(nodeList, domListRandomAccessor());
  }

  // src/js/OptionInput.ts
  var import_fc_form_designer = __toESM(require_fc_form_designer(), 1);
  var _Optioninput = class _Optioninput extends HTMLDivElement {
    // #endregion Info
    /**
     * Creates this {@link HTMLDivElement } by mapping it's properties to it's attributes and injecting a
     * needed stylesheet. */
    constructor() {
      super();
      // #endregion Info
      // #region Events
      /** Holds all event listener to notify whenever the currently selected option changes. */
      this.onOptionChanged = new Array();
      /** Holds all event listener to notify whenever an autocomplete occurred. */
      this.onAutocomplete = new Array();
      /** Holds all event listener to notify whenever an option was selected. */
      this.onOptionSelected = new Array();
      // #region Options
      /** Holds the {@link string }s that're the actual options. */
      this._options = new Array();
      /** Holds the fade in animation for this {@link Optioninput }. */
      this.cssFadeIN = `
    @keyframes kfFadeIN_Optioninput {
        0%    { scale : 1.1 ; opacity : 0 ;}
        100%  { scale : 1 ; opacity : .9 ;}}
    div.---WaXCode.--Optioninput { animation : kfFadeIN_Optioninput .25s ease-in forwards ;}`;
      // #endregion Targeting input-elements
      // #region Info
      /** Stores whether the {@link Optioninput.target } is focused for the first time. */
      this.newFocusTarget = false;
      this.addEventListener("mousedown", (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
      });
      new HasAttribute("options").check(this);
      this.attachShadow({ mode: "open" });
      this.separator = this.getAttribute("separator") ?? ",";
      this.options = this.getAttribute("options")?.split(this.separator) ?? [];
      this.cssEnabled = this.getAttribute("cssEnabled") ?? "display : block ; background-image : linear-gradient( 130deg,rgba( 42, 123, 155, 1 ) 0%, rgba( 216, 216, 235, 1 ) 50%, rgba( 42, 123, 155, 1 ) 100% )";
      this.cssDisabled = this.getAttribute("cssDisabled") ?? "display : none ;";
      this.enabled = this.getAttribute("enabled")?.toLowerCase() === "true";
      this.classList.add("---WaXCode", "--Optioninput");
      this.variableStyle = document.createElement("style");
      this.variableStyle.innerHTML = `${this.enabled ? this.cssEnabled : this.cssDisabled}}`;
      const style = document.createElement("style");
      style.innerHTML = `
        div.---WaXCode.--Optioninput.--Option             { display : flex ; transition : .25s all ;}
        div.---WaXCode.--Optioninput.--Option p           {
          cursor : pointer ; background-color : transparent ; color : black ; text-shadow : 0 0 .25em white ;}
        div.---WaXCode.--Optioninput.--Option.-Current    {
          border : solid ; border-radius : .5em ; border-color : darkorange ; box-shadow : 0 0 .5em black ;
          background-color : #FF8C00BB ;}
        div.---WaXCode.--Optioninput.--Option.-Current p  { color : black ;}`;
      this.variableStyle = this.appendChild(this.variableStyle);
      DEFINED.tsCheck(this.shadowRoot).appendChild(style);
      this.render();
    }
    // #endregion Events
    /** Holds the web-component definition of observed attributes. */
    static get observedAttributes() {
      return ["options", "separator", "cssEnabled", "cssDisabled", "enabled"];
    }
    /**
     * Gets the {@link Optioninput._options }.
     *
     * @returns The {@link Optioninput._options }. */
    get options() {
      return this._options;
    }
    /**
     * Sets the {@link OptionInput.options }.
     *
     * @param toSet The {@link optioninput.options }. */
    set options(toSet) {
      this._options = toSet;
      if (this._options.length !== 0) {
        this.render();
      }
    }
    /**
     * Sets the {@link Optioninput._transformer }.
     *
     * @param toSet The {@link Optioninput._transformer }. */
    set optionTransformer(toSet) {
      this._optionTransformer = toSet;
      this.render();
    }
    /**
     * Sets the {@link Optioninput._targetOptionTransformer }.
     *
     * @param toSet The {@link Optioninput._targetOptionTransformer }. */
    set targetOptionTransformer(toSet) {
      this._targetOptionTransformer = toSet;
    }
    /**
     *  Sets the URL to an image that shall be used as the CSS-Background-Image for the {@link Optioninput.options } panel.
     */
    set backgroundImage(toSet) {
      this.cssEnabled = `background-color : #FFFFFFDD ; background-size : contain ; background-position : center ; background-repeat : no-repeat ; background-blend-mode : overlay ; display : block ; background-image : url("${toSet}"), linear-gradient( 130deg,rgba( 42, 123, 155, 1 ) 0%, rgba( 216, 216, 235, 1 ) 50%, rgba( 42, 123, 155, 1 ) 100% )`;
    }
    // #endregion Options
    /**
     * Gets the {@link HTMLElement } representing the currently set option.
     *
     * @return The {@link HTMLElement } representing the currently set option. */
    get currentOptionElement() {
      return INSTANCE.tsCheck(
        DEFINED.tsCheck(this.shadowRoot).querySelector(".---WaXCode.--Optioninput.--Option.-Current"),
        HTMLElement
      );
    }
    /**
     * Gets the name of the currently set option.
     *
     * @return The name of the currently set option. */
    get currentOption() {
      return byCssHtml(".---WaXCode.--Optioninput.--Option.-Current", this.shadowRoot ?? void 0)?.dataset.cbOption ?? "";
    }
    get enabled() {
      return this.getAttribute("enabled")?.toLowerCase() === "true";
    }
    /**
     * Sets this {@link Optioninput } 's "enabled"-attribute value
     *
     * @param toSet The value This {@link Optioninput } 's "enabled"-attribute shall be set to. */
    set enabled(toSet) {
      this.setAttribute("enabled", toSet ? "true" : "false");
    }
    /**
     * Gets the {@link Optioninput._target }.
     *
     * @returns The {@link Optioninput._target }. */
    get target() {
      return this._target;
    }
    /**
     * Sets the {@link Optioninput._target }, updates the checkboxes according to the functionalities mentioned in
     * the {@link Optioninput.target } and bind {@link Optioninput.onKeyupTarget } & {@link Optioninput.onKeydownTarget }
     * to the {@link Optioninput.target } **toSet** **keyup** & **keydown** events also removing the handler from the
     * former {@link Optioninput.target }.
     *
     * @param toSet The {@link Optioninput._target }.
     *
     * @throws  A {@link DBC.Infringement } if this {@link Optioninput }'s {@link HTMLDivElement.shadowRoot } is not
     *          defined or a query of **.---WaXCode.--Optioninput.--Option.-Current** or
     *          **.---WaXCode.--Optioninput.--Option**does not return an {@link HTMLDivElement }.*/
    set target(toSet) {
      if (this._target && this._target !== toSet) {
        this._target.removeEventListener("focus", this.onFocusTarget);
        this._target.removeEventListener("keyup", this.onKeyupTarget);
        this._target.removeEventListener("keydown", this.onKeydownTarget);
        this._target.removeEventListener("input", this.onInputTarget);
        this._target.removeEventListener("selectionchange", this.onInputTarget);
      }
      this._target = toSet;
      this._target.addEventListener("focus", this.onFocusTarget.bind(this));
      this._target.addEventListener("keyup", this.onKeyupTarget.bind(this));
      this._target.addEventListener("keydown", this.onKeydownTarget.bind(this));
      this._target.addEventListener("input", this.onInputTarget.bind(this));
      this._target.addEventListener("selectionchange", this.onInputTarget.bind(this));
      if (document.activeElement === this._target) {
        this.onFocusTarget(new Event("focus"));
      }
      const shadow = DEFINED.tsCheck(this.shadowRoot);
      for (const checkbox of shadow.querySelectorAll("input")) {
        checkbox.checked = this._target.value.toLowerCase().indexOf(checkbox.parentElement?.dataset.cbOption?.toLowerCase() ?? "") !== -1;
      }
      for (const option of allByCssHtml(".---WaXCode.--Optioninput.--Option", shadow)) {
        option.style.display = "flex";
      }
      const former = shadow.querySelector(".---WaXCode.--Optioninput.--Option.-Current");
      if (former !== null) {
        const former2 = INSTANCE.tsCheck(
          shadow.querySelector(".---WaXCode.--Optioninput.--Option.-Current"),
          HTMLDivElement
        );
        const optionElements = shadow.querySelectorAll(".---WaXCode.--Optioninput.--Option");
        if (optionElements[0] !== former2) {
          INSTANCE.tsCheck(
            shadow.querySelector(".---WaXCode.--Optioninput.--Option"),
            HTMLDivElement
          ).classList.add("-Current");
          former2.classList.remove("-Current");
        }
      }
    }
    /** Render's all {@link Optioninput.options }. */
    render() {
      const shadow = DEFINED.tsCheck(this.shadowRoot);
      for (const toRemove of shadow.querySelectorAll("div.---WaXCode.--Optioninput.--Option")) {
        toRemove.remove();
      }
      for (const option of this.options) {
        shadow.innerHTML += `
        <div  class           = "---WaXCode --Optioninput --Option ${this.options[0] === option ? "-Current" : ""}"
              part            = "Optioncontainer"
              data-cb-option  = "${option}">
          <p part = "Optiontext">${this._optionTransformer ? this._optionTransformer(option) : option}</p></div>`;
      }
      for (const checkbox of shadow.querySelectorAll('[part="Optioninput"]')) {
        checkbox.addEventListener("click", this.onCheckbox.bind(this));
      }
      for (const option of shadow.querySelectorAll('[part="Optiontext"]')) {
        option.addEventListener("click", this.onOption.bind(this));
      }
    }
    attributeChangedCallback(name, oldValue, newValue) {
      switch (name) {
        case "options":
          this.options = newValue.split(this.separator);
          this.render();
          break;
        case "separator":
          this.separator = newValue;
          this.render();
          break;
        case "enabled":
          this.variableStyle.innerHTML = `${newValue.toLowerCase() === "true" ? this.cssFadeIN : ""} div.---WaXCode.--Optioninput { ${newValue.toLowerCase() === "true" ? this.cssEnabled : this.cssDisabled}}`;
          break;
        case "cssenabled":
          this.cssEnabled = newValue;
          if (this.enabled) {
            this.variableStyle.innerHTML = `${this.cssFadeIN} div.---WaXCode.--Optioninput { ${this.cssEnabled}}`;
          }
          break;
        case "cssdisabled":
          this.cssDisabled = newValue;
          if (!this.enabled) {
            this.variableStyle.innerHTML = `${this.cssFadeIN} div.---WaXCode.--Optioninput { ${this.cssDisabled}}`;
          }
          break;
      }
    }
    static {
      // #region Registration as custom element
      /**
       * States whether this {@link Optioninput } was successfully registered as a custom element and performs
       * the registration upon class usage.
       *
       * @throws See {@link window.customElements }'s **define** method. */
      this.registered = (() => {
        customElements.define("xc-optioninput", _Optioninput, { extends: "div" });
        return true;
      })();
    }
    // #endregion Registration as custom element
    // #region Checkbox handling
    /**
     * If the {@link Optioninput.target } is defined, clicking a checkbox will either result in the corresponding
     * functionality to be removed or added to the {@link Optioninput.target }'s value.
     *
     * @param event The {@link Event }. */
    onCheckbox(event) {
      const target = INSTANCE.tsCheck(this.target, HTMLInputElement);
      const eventTarget = INSTANCE.tsCheck(event.target, HTMLInputElement);
      target.focus();
      const option = eventTarget.parentElement?.getAttribute("data-cb-option")?.toUpperCase() ?? "";
      if (eventTarget.checked) {
        if (target.selectionStart === 0) {
          target.value = `${option.trim()}${target.value.length === 0 ? "" : ","}`;
        } else {
          if (target.selectionStart !== null) {
            let segmentStart = target.selectionStart;
            while (target.value[--segmentStart] !== this.separator && segmentStart !== 0) {
            }
            let segmentEnd = target.selectionStart - 1;
            while (target.value[++segmentEnd] !== this.separator && segmentEnd !== target.value.length) {
            }
            target.value = target.value.replace(
              target.value.trim().substring(segmentStart + (target.value[segmentStart] === this.separator ? 1 : 0), segmentEnd),
              `${option.trim()},`
            );
            target.setSelectionRange(segmentEnd, segmentEnd);
          }
        }
      } else {
        const targetValue = target.value.trim();
        target.value = targetValue.toUpperCase().replace(
          (targetValue.indexOf(`,${option}`) === -1 ? "" : ",") + option + (targetValue.indexOf(`,${option}`) === -1 ? "," : ""),
          ""
        );
      }
    }
    // #endregion Checkbox handling
    // #region Checkbox handling
    /**
     * Selects the clicked option and fires the {@link Optioninput.onOptionChanged } handlers.
     *
     * @param event The {@link Event }. */
    onOption(event) {
      const eventTarget = INSTANCE.tsCheck(event.target, HTMLElement);
      const currentOption = INSTANCE.tsCheck(
        DEFINED.tsCheck(
          DEFINED.tsCheck(this.shadowRoot).querySelector(".---WaXCode.--Optioninput.--Option.-Current")
        ),
        HTMLElement
      );
      currentOption.classList.remove("-Current");
      const newCurrentContainer = eventTarget.parentElement;
      if (newCurrentContainer) {
        newCurrentContainer.classList.add("-Current");
        newCurrentContainer.scrollIntoView({ behavior: "smooth", inline: "center", block: "center" });
      }
      for (const handler of this.onOptionChanged) {
        const newOption = eventTarget.parentElement?.dataset.cbOption;
        if (newOption) {
          handler(newOption);
        }
      }
    }
    // #endregion Checkbox handling
    // #region Keyboard handling
    /**
     * Prevents the {@link this.target } from loosing focus on hitting keys that're used to control
     * this {@link Optioninput }.
     *
     * @param event The {@link KeyboardEvent }. */
    onKeyupTarget(event) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    }
    /**
     * Traverses the options from the current on returning the first one which's **style.display** is not **none**.
     *
     * @returns The first visible option. */
    get previousVisibleOption() {
      const shadow = DEFINED.tsCheck(this.shadowRoot);
      let current = previousElementSibling(shadow.querySelector(".---WaXCode.--Optioninput.--Option.-Current"));
      while (current != null && current.style.display === "none") {
        current = previousElementSibling(current);
      }
      if (current === null || !current.hasAttribute("part")) {
        const options = allByCssHtml(".---WaXCode.--Optioninput.--Option", shadow);
        current = options[options.length - 1] ?? null;
        while (current !== null && current.style.display === "none") {
          current = previousElementSibling(current);
        }
      }
      return current;
    }
    /**
     * Traverses the options from the current on returning the first one which's **style.display** is not **none**.
     *
     * @returns The first visible option. */
    get nextVisibleOption() {
      const shadow = DEFINED.tsCheck(this.shadowRoot);
      let current = nextElementSibling(shadow.querySelector(".---WaXCode.--Optioninput.--Option.-Current"));
      while (current !== null && current.style.display === "none") {
        current = nextElementSibling(current);
      }
      if (current === null) {
        current = shadow.querySelector(".---WaXCode.--Optioninput.--Option");
        while (current !== null && current.style.display === "none") {
          current = nextElementSibling(current);
        }
      }
      return current;
    }
    /**
     * Selects the next option.
     *
     * @param event The {@link KeyboardEvent }.
     *
     * @throws A {@link DBC.Infringement } if a query for **.---WaXCode.--Optioninput.--Option.-Current** from this
     * {@link Optioninput }'s {@link HTMLDivElement.shadowRoot } acquires **null**. */
    onKeydownTarget(event) {
      if (!this.enabled) {
        return;
      }
      this.lastKey = event.key;
      if (event.key === "Delete") {
        this.onInputTarget(event);
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
      const shadow = DEFINED.tsCheck(this.shadowRoot);
      switch (event.key) {
        case "ArrowUp":
        case "ArrowDown":
          {
            const former = DEFINED.tsCheck(
              INSTANCE.tsCheck(
                shadow.querySelector(".---WaXCode.--Optioninput.--Option.-Current"),
                HTMLDivElement
              )
            );
            const targetOption = DEFINED.tsCheck(
              event.key === "ArrowDown" ? this.nextVisibleOption : this.previousVisibleOption
            );
            targetOption.classList.add("-Current");
            former.classList.remove("-Current");
            const cbOption = DEFINED.tsCheck(
              DEFINED.tsCheck(
                INSTANCE.tsCheck(
                  byCssHtml(".---WaXCode.--Optioninput.--Option.-Current", shadow),
                  HTMLDivElement
                )
              ).dataset.cbOption
            );
            targetOption.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "center"
            });
            for (const handler of this.onOptionChanged) {
              handler(cbOption);
            }
          }
          break;
        case " ":
          {
            const currentOption = DEFINED.tsCheck(
              DEFINED.tsCheck(
                INSTANCE.tsCheck(
                  byCssHtml(".---WaXCode.--Optioninput.--Option.-Current", shadow),
                  HTMLDivElement
                )
              ).dataset.cbOption
            );
            DEFINED.tsCheck(this.target).value = this._targetOptionTransformer ? this._targetOptionTransformer(currentOption).trim() : DEFINED.tsCheck(
              DEFINED.tsCheck(
                INSTANCE.tsCheck(
                  byCssHtml(".---WaXCode.--Optioninput.--Option.-Current", shadow),
                  HTMLDivElement
                )
              ).dataset.cbOption?.trim()
            );
            for (const handler of this.onOptionSelected) {
              handler(currentOption);
            }
          }
          break;
      }
    }
    /**
     * Sets {@link Optioninput.newFocusTarget } to **true** in order for other methods to be able to recognize when
     * the {@link Optioninput.target } was focused prior to their invocation.
     *
     * @param event The {@link Event }. */
    onFocusTarget(event) {
      this.newFocusTarget = true;
    }
    /**
     * Handles input on the {@link Optioninput.target } filtering the available {@link Optioninput.options } and
     * completing the option within the {@link Optioninput.target } when one of the {@link Optioninput.options } gets
     * definite.
     *
     * @param event The {@link Event }. */
    onInputTarget(event) {
      if (this.newFocusTarget) {
        this.newFocusTarget = false;
        for (const handler of this.onOptionChanged) {
          handler(this.options[0] ?? "");
        }
        return;
      }
      if (!(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) {
        throw new INSTANCE.Infringement(
          `The event.target has to be either of type HTMLInputElement or HTMLTextAreaElement but isn't. It is of type ${typeof event.target}.`
        );
      }
      const eventTarget = event.target;
      const remainingOptions = this.filter(eventTarget.value.substring(1));
      if (remainingOptions.length === 0) {
        this.enabled = false;
        return;
      }
      if (event.type !== "selectionchange" && this.lastKey !== "Backspace" && this.lastKey !== "Delete" && remainingOptions.length === 1) {
        eventTarget.value = remainingOptions[0].trim() ?? "";
        for (const handler of this.onOptionChanged) {
          handler(remainingOptions[0] ?? "");
        }
        for (const handler of this.onAutocomplete) {
          handler(remainingOptions[0] ?? "");
        }
      }
    }
    // #endregion Keyboard handling
    // #region Filtering
    /**
     * Filters the view of options.
     *
     * @param filter The {@link string } to apply as a filter.
     *
     * @returns The remaining options. */
    filter(filter2) {
      const cleanFilter = filter2.replace("<br>", "");
      const hits = new Array();
      const options = allByCssAs(".---WaXCode.--Optioninput.--Option", HTMLDivElement, this.shadowRoot ?? void 0);
      let firstVisible;
      for (const option of options) {
        const cbOption = option.dataset.cbOption ?? "";
        if (cbOption.toLowerCase().indexOf(cleanFilter.toLowerCase()) === -1) {
          option.style.display = "none";
        } else {
          if (firstVisible === void 0) {
            firstVisible = option;
          }
          hits.push(cbOption);
          option.style.display = "flex";
        }
        const part = byCssAs('[ part = "Optioninput"]', HTMLInputElement, option);
        if (part !== void 0) {
          part.checked = DEFINED.tsCheck(this.target).value.toLowerCase().indexOf(cbOption) !== -1;
        }
      }
      if (hits.length !== 0) {
        firstVisible?.click();
        const shadow = DEFINED.tsCheck(this.shadowRoot);
        shadow.querySelector(".---WaXCode.--Optioninput.--Option.-Current")?.classList.remove("-Current");
        DEFINED.tsCheck(
          INSTANCE.tsCheck(
            shadow.querySelector(`.---WaXCode.--Optioninput.--Option[ data-cb-option = "${hits[0]}"]`),
            HTMLDivElement
          )
        ).classList.add("-Current");
      }
      return hits;
    }
    // #endregion Filtering
  };
  __decorateClass([
    HasAttribute.cINVARIANT("enabled")
  ], _Optioninput.prototype, "enabled", 1);
  __decorateClass([
    DBC.ParamvalueProvider,
    __decorateParam(0, OR.PRE([new EQ("options"), new EQ("separator"), new EQ("enabled"), new EQ("cssenabled"), new EQ("cssdisabled")])),
    __decorateParam(2, IF.PRE(new EQ("cssenabled"), new REGEX(/^\s*(?:[\w-]+\s*:\s*[^;]+;?\s*)+$/))),
    __decorateParam(2, IF.PRE(new EQ("cssdisabled"), new REGEX(/^\s*(?:[\w-]+\s*:\s*[^;]+;?\s*)+$/)))
  ], _Optioninput.prototype, "attributeChangedCallback", 1);
  var Optioninput = _Optioninput;
  function nextElementSibling(element) {
    const sibling = element?.nextElementSibling;
    return sibling instanceof HTMLElement ? sibling : null;
  }
  function previousElementSibling(element) {
    const sibling = element?.previousElementSibling;
    return sibling instanceof HTMLElement ? sibling : null;
  }

  // src/js/SVManager.ts
  var _SVManager = class _SVManager extends HTMLDivElement {
    // #endregion Info
    /**
     * Creates this {@link HTMLDivElement } by mapping it's properties to it's attributes and injecting a
     * needed stylesheet. */
    constructor() {
      super();
      // #region Events
      /** Holds all event listener to notify whenever the currently selected option changes. */
      this.onOptionChanged = new Array();
      /** Holds all event listener to notify whenever an autocomplete occurred. */
      this.onAutocomplete = new Array();
      /** Holds all event listener to notify whenever an option was selected. */
      this.onOptionSelected = new Array();
      /** Holds the fade in animation for this {@link SVManager }. */
      this.cssFadeIN = `
    @keyframes kfFadeIN_SVManager {
        0%    { scale : 1.1 ; opacity : 0 ;}
        100%  { scale : 1 ; opacity : .9 ;}}
    div.---WaXCode.--SVManager { animation : kfFadeIN_SVManager .25s ease-in forwards ;}`;
      // #endregion Targeting input-elements
      // #region Info
      /** Stores whether the cursor is currently within this {@link SVManager }.*/
      this._cursorIn = false;
      /** Stores whether the {@link SVManager.target } is focused for the first time. */
      this.newFocusTarget = false;
      this.addEventListener("mousedown", (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
      });
      new HasAttribute("options").check(this);
      this.separator = this.getAttribute("separator") ?? ",";
      this.options = this.getAttribute("options")?.split(this.separator) ?? [];
      this.cssEnabled = this.getAttribute("cssEnabled") ?? "display : block ; background-image : linear-gradient( 130deg,rgba( 42, 123, 155, 1 ) 0%, rgba( 216, 216, 235, 1 ) 50%, rgba( 42, 123, 155, 1 ) 100% )";
      this.cssDisabled = this.getAttribute("cssDisabled") ?? "display : none ;";
      this.enabled = this.getAttribute("enabled")?.toLowerCase() === "true";
      this.classList.add("---WaXCode", "--SVManager");
      this.variableStyle = document.createElement("style");
      this.variableStyle.innerHTML = `${this.enabled ? this.cssEnabled : this.cssDisabled}}`;
      const style = document.createElement("style");
      style.innerHTML = `
        div.---WaXCode.--SVManager.--Option             { display : flex ; transition : .25s all ;}
        div.---WaXCode.--SVManager.--Option input       { cursor : pointer ;}
        div.---WaXCode.--SVManager.--Option p           {
          cursor : pointer ; background-color : transparent ; color : black ; text-shadow : 0 0 .25em white ;}
        div.---WaXCode.--SVManager.--Option.-Current    {
          border : solid ; border-radius : .5em ; border-color : darkorange ; box-shadow : 0 0 .5em black ;
          background-color : #FF8C00BB ;}
        div.---WaXCode.--SVManager.--Option.-Current p  { color : black ;}`;
      this.attachShadow({ mode: "open" });
      this.variableStyle = this.appendChild(this.variableStyle);
      DEFINED.tsCheck(this.shadowRoot).appendChild(style);
      window.CodbiPluginData.updateSVManager = (options) => {
        this.options = JSON.parse(options).map((e) => e.replace(".js", ""));
        this.render();
      };
      this.render();
    }
    // #endregion Events
    /** Holds the web-component definition of observed attributes. */
    static get observedAttributes() {
      return ["options", "separator", "cssEnabled", "cssDisabled", "enabled"];
    }
    /**
     * Sets the {@link SVManager._transformer }.
     *
     * @param toSet The {@link SVManager._transformer }. */
    set optionTransformer(toSet) {
      this._optionTransformer = toSet;
      this.render();
    }
    /** Sets the URL to an image that shall be used as the CSS-Background-Image for the {@link SVmanager.options } panel. */
    set backgroundImage(toSet) {
      this.cssEnabled = `background-color : #FFFFFFDD ; background-size : contain ; background-position : center ; background-repeat : no-repeat ; background-blend-mode : overlay ; display : block ; background-image : url("${toSet}"), linear-gradient( 130deg,rgba( 42, 123, 155, 1 ) 0%, rgba( 216, 216, 235, 1 ) 50%, rgba( 42, 123, 155, 1 ) 100% )`;
    }
    // #endregion Options
    /**
     * Gets the name of the currently set option.
     *
     * @return The name of the currently set option. */
    get currentOption() {
      return byCssHtml(".---WaXCode.--SVManager.--Option.-Current", this.shadowRoot ?? void 0)?.dataset.cbOption.replace(
        ".js",
        ""
      ) ?? "";
    }
    get enabled() {
      return this.getAttribute("enabled")?.toLowerCase() === "true";
    }
    /**
     * Sets this {@link SVManager } 's "enabled"-attribute value
     *
     * @param toSet The value This {@link SVManager } 's "enabled"-attribute shall be set to. */
    set enabled(toSet) {
      this.setAttribute("enabled", toSet ? "true" : "false");
    }
    /**
     * Gets the {@link SVManager._target }.
     *
     * @returns The {@link SVManager._target }. */
    get target() {
      return this._target;
    }
    /**
     * Sets the {@link SVManager._target }, updates the checkboxes according to the functionalities mentioned in
     * the {@link SVManager.target } and bind {@link SVManager.onKeyupTarget } & {@link SVManager.onKeydownTarget } to
     * the {@link SVManager.target } **toSet** **keyup** & **keydown** events also removing the handler from the
     * former {@link SVManager.target }.
     *
     * @param toSet The {@link SVManager._target }.
     *
     * @throws  A {@link DBC.Infringement } if this {@link SVManager }'s {@link HTMLDivElement.shadowRoot } is not
     *          defined or a query of **.---WaXCode.--SVManager.--Option.-Current** or
     *          **.---WaXCode.--SVManager.--Option** does not return an {@link HTMLDivElement }.*/
    set target(toSet) {
      if (this._target && this._target !== toSet) {
        this._target.removeEventListener("focus", this.onFocusTarget);
        this._target.removeEventListener("keyup", this.onKeyupTarget);
        this._target.removeEventListener("keydown", this.onKeydownTarget);
        this._target.removeEventListener("input", this.onInputTarget);
        this._target.removeEventListener("selectionchange", this.onInputTarget);
      }
      this._target = toSet;
      this._target.addEventListener("focus", this.onFocusTarget.bind(this));
      this._target.addEventListener("keyup", this.onKeyupTarget.bind(this));
      this._target.addEventListener("keydown", this.onKeydownTarget.bind(this));
      this._target.addEventListener("input", this.onInputTarget.bind(this));
      this._target.addEventListener("selectionchange", this.onInputTarget.bind(this));
      if (document.activeElement === this._target) {
        this.onFocusTarget(new Event("focus"));
      }
      const shadow = DEFINED.tsCheck(this.shadowRoot);
      for (const checkbox of shadow.querySelectorAll("input")) {
        checkbox.checked = this._target.value.toLowerCase().indexOf(checkbox.parentElement?.dataset.cbOption?.toLowerCase() ?? "") !== -1;
      }
      for (const option of allByCssHtml(".---WaXCode.--SVManager.--Option", shadow)) {
        option.style.display = "flex";
      }
      const former = DEFINED.tsCheck(
        INSTANCE.tsCheck(
          shadow.querySelector(".---WaXCode.--SVManager.--Option.-Current"),
          HTMLDivElement
        )
      );
      const optionElements = shadow.querySelectorAll(".---WaXCode.--SVManager.--Option");
      if (optionElements[0] !== former) {
        INSTANCE.tsCheck(
          shadow.querySelector(".---WaXCode.--SVManager.--Option"),
          HTMLDivElement
        ).classList.add("-Current");
        former.classList.remove("-Current");
      }
    }
    /**
     * Gets {@link SVManager._cursorIn }.
     *
     * @returns {@link SVManager._cursorIn }. */
    get cursorIn() {
      return this._cursorIn;
    }
    /** Render's all {@link SVManager.options }. */
    render() {
      const shadow = DEFINED.tsCheck(this.shadowRoot);
      for (const toRemove of shadow.querySelectorAll("div.---WaXCode.--SVManager.--Option")) {
        toRemove.remove();
      }
      for (const option of this.options) {
        shadow.innerHTML += `
        <div  class           = "---WaXCode --SVManager --Option ${this.options[0] === option ? "-Current" : ""}"
              part            = "Optioncontainer"
              data-cb-option  = "${option}">
          <input  part  = "Optioninput"
                  type  = "checkbox"></input>

          <p part = "Optiontext">${this._optionTransformer ? this._optionTransformer(option.replace(".js", "")) : option.replace(".js", "")}</p></div>`;
      }
      for (const checkbox of shadow.querySelectorAll('[part="Optioninput"]')) {
        checkbox.addEventListener("click", this.onCheckbox.bind(this));
      }
      for (const option of shadow.querySelectorAll('[part="Optiontext"]')) {
        option.addEventListener("click", this.onOption.bind(this));
      }
    }
    attributeChangedCallback(name, oldValue, newValue) {
      switch (name) {
        case "options":
          this.options = newValue.split(this.separator);
          this.render();
          break;
        case "separator":
          this.separator = newValue;
          this.render();
          break;
        case "enabled":
          this.variableStyle.innerHTML = `${newValue.toLowerCase() === "true" ? this.cssFadeIN : ""} div.---WaXCode.--SVManager { ${newValue.toLowerCase() === "true" ? this.cssEnabled : this.cssDisabled}}`;
          break;
        case "cssenabled":
          this.cssEnabled = newValue;
          if (this.enabled) {
            this.variableStyle.innerHTML = `${this.cssFadeIN} div.---WaXCode.--SVManager { ${this.cssEnabled}}`;
          }
          break;
        case "cssdisabled":
          this.cssDisabled = newValue;
          if (!this.enabled) {
            this.variableStyle.innerHTML = `${this.cssFadeIN} div.---WaXCode.--SVManager { ${this.cssDisabled}}`;
          }
          break;
      }
    }
    static {
      // #region Registration as custom element
      /**
       * States whether this {@link SVManager } was successfully registered as a custom element and performs
       * the registration upon class usage.
       *
       * @throws See {@link window.customElements }'s **define** method. */
      this.registered = (() => {
        customElements.define("xc-svmanager", _SVManager, { extends: "div" });
        return true;
      })();
    }
    // #endregion Registration as custom element
    // #region Checkbox handling
    /**
     * If the {@link SVManager.target } is defined, clicking a checkbox will either result in the corresponding
     * functionality to be removed or added to the {@link SVManager.target }'s value.
     *
     * @param event The {@link Event }. */
    onCheckbox(event) {
      const target = INSTANCE.tsCheck(this.target, HTMLInputElement);
      const eventTarget = INSTANCE.tsCheck(event.target, HTMLInputElement);
      target.focus();
      const option = eventTarget.parentElement?.getAttribute("data-cb-option")?.toUpperCase() ?? "";
      if (eventTarget.checked) {
        if (target.selectionStart === 0) {
          target.value = `${option.toLowerCase()}${target.value.length === 0 ? "" : ","}`;
        } else {
          if (target.selectionStart !== null) {
            let segmentStart = target.selectionStart;
            while (target.value[--segmentStart] !== this.separator && segmentStart !== 0) {
            }
            let segmentEnd = target.selectionStart - 1;
            while (target.value[++segmentEnd] !== this.separator && segmentEnd !== target.value.length) {
            }
            target.value = target.value.replace(
              target.value.substring(segmentStart + (target.value[segmentStart] === this.separator ? 1 : 0), segmentEnd),
              `${option.toLowerCase()},`
            );
            const newPosition = segmentStart + option.length + 2;
            target.setSelectionRange(newPosition, newPosition);
          }
        }
      } else {
        const targetValue = target.value;
        target.value = targetValue.toLowerCase().replace(
          (targetValue.indexOf(`,${option.toLowerCase()}`) === -1 ? "" : ",") + option.toLowerCase() + (targetValue.indexOf(`,${option.toLowerCase()}`) === -1 ? "," : ""),
          ""
        );
      }
    }
    // #endregion Checkbox handling
    // #region Checkbox handling
    /**
     * Selects the clicked option and fires the {@link SVManager.onOptionChanged } handlers.
     *
     * @param event The {@link Event }. */
    onOption(event) {
      const eventTarget = INSTANCE.tsCheck(event.target, HTMLElement);
      const currentOption = INSTANCE.tsCheck(
        DEFINED.tsCheck(
          DEFINED.tsCheck(this.shadowRoot).querySelector(".---WaXCode.--SVManager.--Option.-Current")
        ),
        HTMLElement
      );
      currentOption.classList.remove("-Current");
      const newCurrentContainer = eventTarget.parentElement;
      if (newCurrentContainer) {
        newCurrentContainer.classList.add("-Current");
        newCurrentContainer.scrollIntoView({ behavior: "smooth", inline: "center", block: "center" });
      }
      for (const handler of this.onOptionChanged) {
        const newOption = eventTarget.parentElement?.dataset.cbOption;
        if (newOption) {
          handler(newOption);
        }
      }
    }
    // #endregion Checkbox handling
    // #region Keyboard handling
    /**
     * Prevents the {@link this.target } from loosing focus on hitting keys that're used to control
     * this {@link SVManager }.
     *
     * @param event The {@link KeyboardEvent }. */
    onKeyupTarget(event) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    }
    /**
     * Traverses the options from the current on returning the first one which's **style.display** is not **none**.
     *
     * @returns The first visible option. */
    get previousVisibleOption() {
      const shadow = DEFINED.tsCheck(this.shadowRoot);
      let current = previousElementSibling2(shadow.querySelector(".---WaXCode.--SVManager.--Option.-Current"));
      while (current != null && current.style.display === "none") {
        current = previousElementSibling2(current.previousElementSibling);
      }
      if (current === null || !current.hasAttribute("part")) {
        const options = allByCssHtml(".---WaXCode.--SVManager.--Option", shadow);
        current = options[options.length - 1] ?? null;
        while (current !== null && current.style.display === "none") {
          current = previousElementSibling2(current);
        }
      }
      return current;
    }
    /**
     * Traverses the options from the current on returning the first one which's **style.display** is not **none**.
     *
     * @returns The first visible option. */
    get nextVisibleOption() {
      const shadow = DEFINED.tsCheck(this.shadowRoot);
      let current = nextElementSibling2(shadow.querySelector(".---WaXCode.--SVManager.--Option.-Current"));
      while (current != null && current.style.display === "none") {
        current = nextElementSibling2(current.nextElementSibling);
      }
      if (current === null) {
        current = shadow.querySelector(".---WaXCode.--SVManager.--Option");
        while (current != null && current.style.display === "none") {
          current = nextElementSibling2(current.nextElementSibling);
        }
      }
      return current;
    }
    /**
     * Selects the next option.
     *
     * @param event The {@link KeyboardEvent }. */
    onKeydownTarget(event) {
      this.lastKey = event.key;
      if (event.key === "Delete") {
        this.onInputTarget(event);
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
      switch (event.key) {
        case "ArrowUp":
        case "ArrowDown":
          {
            const shadow = DEFINED.tsCheck(this.shadowRoot);
            const former = DEFINED.tsCheck(
              INSTANCE.tsCheck(
                shadow.querySelector(".---WaXCode.--SVManager.--Option.-Current"),
                HTMLDivElement
              )
            );
            const targetOption = DEFINED.tsCheck(
              event.key === "ArrowDown" ? this.nextVisibleOption : this.previousVisibleOption
            );
            targetOption.scrollIntoView({ behavior: "smooth", inline: "center", block: "center" });
            targetOption.classList.add("-Current");
            former.classList.remove("-Current");
            for (const handler of this.onOptionChanged) {
              const cbOption = byCssHtml(".---WaXCode.--SVManager.--Option.-Current", shadow)?.dataset.cbOption;
              handler(cbOption ?? "");
            }
          }
          break;
        // Select / Unselect
        case " ":
          {
            const shadow = DEFINED.tsCheck(this.shadowRoot);
            byCssHtml('.---WaXCode.--SVManager.--Option.-Current [ part = "Optioninput"]', shadow)?.click();
          }
          for (const handler of this.onOptionSelected) {
            const cbOption = byCssHtml(
              ".---WaXCode.--SVManager.--Option.-Current",
              DEFINED.tsCheck(this.shadowRoot)
            )?.dataset.cbOption;
            handler(cbOption ?? "");
          }
          break;
      }
    }
    /**
     * Sets {@link SVManager.newFocusTarget } to **true** in order for other methods to be able to recognize when
     * the {@link SVManager.target } was focused prior to their invocation.
     *
     * @param event The {@link Event }. */
    onFocusTarget(event) {
      this.newFocusTarget = true;
    }
    /**
     * Handles input on the {@link SVManager.target } filtering the available {@link SVManager.options } and
     * completing the option within the {@link SVManager.target } when one of the {@link SVManager.options } gets
     * definite.
     *
     * @param event The {@link Event }. */
    onInputTarget(event) {
      const eventTarget = INSTANCE.tsCheck(event.target, HTMLInputElement);
      if (this.newFocusTarget) {
        this.newFocusTarget = false;
        for (const handler of this.onOptionChanged) {
          handler(this.options[0] ?? "");
        }
        return;
      }
      let segmentContent;
      if (eventTarget.value.toLowerCase().trim() === "data-cb-func") {
        eventTarget.value = "";
      }
      segmentContent = this.determineSegmentcontent(eventTarget.value, this.separator, eventTarget.selectionStart ?? 0);
      const remainingOptions = this.filter(segmentContent);
      if (remainingOptions.length === 0) {
        this.enabled = false;
        return;
      }
      if (event.type !== "selectionchange" && this.lastKey !== "Backspace" && this.lastKey !== "Delete" && remainingOptions.length === 1) {
        eventTarget.value = eventTarget.value.replace(segmentContent, remainingOptions[0] ?? "");
        for (const handler of this.onAutocomplete) {
          handler(remainingOptions[0] ?? "");
        }
        for (const handler of this.onOptionChanged) {
          handler(remainingOptions[0] ?? "");
        }
      }
      const shadow = DEFINED.tsCheck(this.shadowRoot);
      shadow.querySelector(".---WaXCode.--SVManager.--Option.-Current")?.classList.remove("-Current");
      DEFINED.tsCheck(
        INSTANCE.tsCheck(
          shadow.querySelector(`.---WaXCode.--SVManager.--Option[ data-cb-option = "${remainingOptions[0]}"]`),
          HTMLDivElement
        )
      ).classList.add("-Current");
    }
    // #endregion Keyboard handling
    // #region Filtering
    /**thi
     * Filters the view of options.
     *
     * @param filter  The {@link string } to apply as a filter.
     * @param options The {@link HTMLDivElement }s to filter. If not specified, all children tagged with the CSS-Classes
     *                "---WaXCode --SVManager --Option" will be used.
     *
     * @returns The remaining options. */
    filter(filter2, options = allByCssAs(
      ".---WaXCode.--SVManager.--Option",
      HTMLDivElement,
      this.shadowRoot ?? void 0
    )) {
      const hits = new Array();
      let firstVisible;
      for (const option of options) {
        const cbOption = option.dataset.cbOption ?? "";
        if (cbOption.toLowerCase().indexOf(filter2.toLowerCase()) === -1) {
          option.style.display = "none";
        } else {
          if (firstVisible === void 0) {
            firstVisible = option;
          }
          hits.push(cbOption);
          option.style.display = "flex";
        }
        const part = byCssAs('[ part = "Optioninput"]', HTMLInputElement, option);
        if (part !== void 0) {
          part.checked = false;
          for (const candidate of this.target.value.split(",")) {
            if (candidate === cbOption) {
              part.checked = true;
            }
          }
        }
      }
      firstVisible?.click();
      return hits;
    }
    // #endregion Filtering
    /**
     * Determines the segment-content within a separated values {@link string } out of the specified **position**.
     *
     * @param separatedValues The {@link string } containing the separated values.
     * @param delimiter       The {@link string } delimiting each segment.
     * @param position        The current position within the segment.
     *
     * @returns The segment-content where the **position** is pointing at. */
    determineSegmentcontent(separatedValues, delimiter, position = 0) {
      const caretPos = position;
      if (separatedValues.length === 0 || caretPos < 0 || caretPos > separatedValues.length) {
        return "";
      }
      const lastCommaBeforeCaret = separatedValues.lastIndexOf(delimiter, caretPos - 1);
      const firstCommaAfterCaret = separatedValues.indexOf(delimiter, caretPos);
      if (lastCommaBeforeCaret === -1 && firstCommaAfterCaret !== -1) {
        return separatedValues.split(delimiter)[0]?.trim() ?? "";
      }
      if (lastCommaBeforeCaret !== -1 && firstCommaAfterCaret === -1) {
        return separatedValues.substring(lastCommaBeforeCaret + 1).trim();
      }
      if (lastCommaBeforeCaret === -1 || firstCommaAfterCaret === -1 || lastCommaBeforeCaret >= firstCommaAfterCaret) {
        return separatedValues.trim();
      }
      return separatedValues.substring(lastCommaBeforeCaret + 1, firstCommaAfterCaret).trim();
    }
  };
  __decorateClass([
    HasAttribute.cINVARIANT("enabled")
  ], _SVManager.prototype, "enabled", 1);
  __decorateClass([
    DBC.ParamvalueProvider,
    __decorateParam(0, OR.PRE([new EQ("options"), new EQ("separator"), new EQ("enabled"), new EQ("cssenabled"), new EQ("cssdisabled")])),
    __decorateParam(2, IF.PRE(new EQ("cssenabled"), new REGEX(/^\s*(?:[\w-]+\s*:\s*[^;]+;?\s*)+$/))),
    __decorateParam(2, IF.PRE(new EQ("cssdisabled"), new REGEX(/^\s*(?:[\w-]+\s*:\s*[^;]+;?\s*)+$/)))
  ], _SVManager.prototype, "attributeChangedCallback", 1);
  var SVManager = _SVManager;
  function nextElementSibling2(element) {
    const sibling = element?.nextElementSibling;
    return sibling instanceof HTMLElement ? sibling : null;
  }
  function previousElementSibling2(element) {
    const sibling = element?.previousElementSibling;
    return sibling instanceof HTMLElement ? sibling : null;
  }

  // src/js/EPManager.ts
  var _EPManager = class _EPManager extends SVManager {
    /**
     * Creates this {@link EPManager } by assigning the {@link SVManager.options } to the
     * {@link EPManager._bufferOptions } for later use. */
    constructor() {
      super();
      /** States the current mode this {@link EPManager } is in ("**SV**" is the original **s**eparated **v**alue manager
       * one while "**EP**" is the **e**lement **p**laceholder mode). */
      this._mode = "SV";
      // #region Filtering
      /** Stores the {@link string } the {@link SVManager.options } in **EP**-{@link EPManager.mode } shall be
       *  filtered by. */
      this.currentFilter = "";
      /** Stores the amount of digits and letters entered into the {@link SVManager.target } after
       *  **ALT**+**E** was pressed. */
      this.countStrokes = 0;
      /** States whether the {@link EPManager } is currently into the process of entering an **e**lement **p**laceholder. */
      this.enteringEP = false;
      this._bufferOptions = this.options;
      window.CodbiPluginData.updateEPManager = (options) => {
        this.epOptions = JSON.parse(options).map((e) => e.replace(".ts", ""));
        this.mode = "SV";
        this.mode = "EP";
        this.render();
      };
    }
    /** Holds the web-component definition of observed attributes. */
    static get observedAttributes() {
      return [...SVManager.observedAttributes, "mode", "epoptions"];
    }
    /**
     * Gets the {@link EPManager._epOptions }.
     *
     * @returns The {@link EPManager._epOptions }. */
    get epOptions() {
      return this._epOptions;
    }
    /**
     * Sets the {@link EPManager._epOptions }.
     *
     * @param toSet The {@link EPMan._epOptions }. */
    set epOptions(toSet) {
      this._epOptions = toSet;
    }
    /**
     * Gets the current {@link EPManager._mode }.
     *
     * @returns The current {@link EPManager._mode }. */
    get mode() {
      return this._mode;
    }
    /** Hides the checkboxes after {@link SVManager.render }ing if {@link EPManager.mode } is set to "EP". */
    render() {
      super.render();
      if (this.mode === "EP") {
        for (const checkbox of DEFINED.tsCheck(this.shadowRoot).querySelectorAll('[ part = "Optioninput"]')) {
          const cb = INSTANCE.tsCheck(checkbox, HTMLElement);
          cb.style.display = "none";
          const text = INSTANCE.tsCheck(
            DEFINED.tsCheck(cb.parentElement).querySelector('[ part = "Optiontext"]'),
            HTMLElement
          );
          text.style.marginLeft = "auto";
          text.style.marginRight = "auto";
        }
      }
    }
    /**
     * Sets the current {@link EPManager.mode } switching the {@link SVManager.options } with the
     * {@link EPManager.epOptions} when set to "**EP**" and vice versa. */
    set mode(toSet) {
      if (this._mode === toSet) {
        return;
      }
      this._mode = toSet;
      if (this._mode === "SV" && this._bufferOptions !== void 0) {
        this.options = this._bufferOptions;
        this.render();
        for (const checkbox of DEFINED.tsCheck(this.shadowRoot).querySelectorAll('[ part = "Optioninput"]')) {
          INSTANCE.tsCheck(checkbox, HTMLElement).style.display = "inline-block";
        }
      } else {
        if (this._epOptions !== void 0) {
          this.currentStartCaret = this.target?.selectionStart;
          this.options = this._epOptions;
          this.render();
          for (const checkbox of DEFINED.tsCheck(this.shadowRoot).querySelectorAll(
            '[ part = "Optioninput"]'
          )) {
            const cb = INSTANCE.tsCheck(checkbox, HTMLElement);
            cb.style.display = "none";
            const text = INSTANCE.tsCheck(
              DEFINED.tsCheck(cb.parentElement).querySelector('[ part = "Optiontext"]'),
              HTMLElement
            );
            text.style.marginLeft = "auto";
            text.style.marginRight = "auto";
          }
        }
      }
    }
    static {
      /**
       * States whether this {@link EPManager } was successfully registered as a custom element and performs
       * the registration upon class usage.
       *
       * @throws See {@link window.customElements }'s **define** method. */
      this.registered = (() => {
        customElements.define("xc-epmanager", _EPManager, { extends: "div" });
        return true;
      })();
    }
    attributeChangedCallback(name, oldValue, newValue) {
      if (name !== "epoptions" && name !== "mode") {
        super.attributeChangedCallback(name, oldValue, newValue);
      }
      switch (name) {
        case "epoptions":
          this.epOptions = newValue.split(this.separator);
          break;
        case "mode":
          this.mode = OR.tsCheck(newValue, [new EQ("SV"), new EQ("EP")]);
          break;
      }
    }
    /**
     * When in **EP**-{@link EPManager.mode } this method filters the {@link SVManager.options } by {@link EPManager.currentFilter }.
     * Otherwise {@link SVManager.filter } is invoked.
     *
     * @param event The {@link Event } received. */
    onInputTarget(event) {
      if (this.mode === "EP") {
        const remainingOptions = this.filter(this.currentFilter);
        const shadow = DEFINED.tsCheck(this.shadowRoot);
        shadow.querySelector(".---WaXCode.--SVManager.--Option.-Current")?.classList.remove("-Current");
        DEFINED.tsCheck(
          INSTANCE.tsCheck(
            shadow.querySelector(`.---WaXCode.--SVManager.--Option[ data-cb-option = "${remainingOptions[0]}"]`),
            HTMLDivElement
          )
        ).classList.add("-Current");
        if (this.lastKey !== "Backspace" && this.lastKey !== "Delete" && remainingOptions.length === 1) {
          const eventTarget = INSTANCE.tsCheck(event.target, HTMLInputElement);
          const inputElement = INSTANCE.tsCheck(this.target, HTMLInputElement);
          let selectionStart = DEFINED.tsCheck(eventTarget.selectionStart);
          const remainingOne = inputElement.value.substring(0, selectionStart - this.currentFilter.length);
          const remainingTwo = inputElement.value.substring(selectionStart);
          inputElement.value = remainingOne + remainingTwo;
          selectionStart = selectionStart - this.currentFilter.length;
          const selectedOption = DEFINED.tsCheck(
            INSTANCE.tsCheck(
              DEFINED.tsCheck(this.shadowRoot).querySelector(".---WaXCode.--SVManager.--Option.-Current"),
              HTMLElement
            ).dataset.cbOption
          );
          eventTarget.value = `${eventTarget.value.substring(0, selectionStart - 1)}{ ${selectedOption} >  } ${eventTarget.value.substring(selectionStart)}`;
          eventTarget.setSelectionRange(
            selectionStart + selectedOption.length + 5,
            selectionStart + selectedOption.length + 5
          );
          this.currentStartCaret = void 0;
          this.currentFilter = "";
          this.countStrokes = 0;
          this.enteringEP = false;
          this.enabled = false;
          for (const handler of this.onAutocomplete) {
            handler(remainingOptions[0]);
          }
        }
      } else {
        super.onInputTarget(event);
      }
    }
    /**
     * When in **EP**-{@link EPManager.mode } keeps track if the entered digits and letters to filter
     * the {@link SVManager.options } invoking {@link SVManager.onKeydownTarget } when appropriate or
     * not in **EP**-{@link EPManager.mode }.
     *
     * @param event The {@link KeyboardEvent }. */
    onKeydownTarget(event) {
      if (this.mode === "EP") {
        const eventTarget = INSTANCE.tsCheck(event.target, HTMLInputElement);
        let selectionStart = DEFINED.tsCheck(eventTarget.selectionStart);
        if (event.key !== " " && event.key !== "Enter") {
          super.onKeydownTarget(event);
          if (this.enteringEP && /^[a-zA-Z0-9]$/.test(event.key)) {
            if (this.currentStartCaret === void 0) {
              this.currentStartCaret = eventTarget.selectionStart;
            }
            this.countStrokes++;
            this.currentFilter += event.key;
            this.enabled = true;
          }
        } else {
          if (this.enteringEP) {
            const inputElement = INSTANCE.tsCheck(this.target, HTMLInputElement);
            const remainingOne = inputElement.value.substring(0, selectionStart - this.currentFilter.length);
            const remainingTwo = inputElement.value.substring(selectionStart);
            inputElement.value = remainingOne + remainingTwo;
            selectionStart = selectionStart - this.currentFilter.length;
            const selectedOption = DEFINED.tsCheck(
              INSTANCE.tsCheck(
                DEFINED.tsCheck(this.shadowRoot).querySelector(".---WaXCode.--SVManager.--Option.-Current"),
                HTMLElement
              ).dataset.cbOption
            );
            eventTarget.value = `${eventTarget.value.substring(0, selectionStart - 1)} { ${selectedOption} > } ${eventTarget.value.substring(selectionStart)}`;
            eventTarget.setSelectionRange(
              selectionStart + selectedOption.length + 5,
              selectionStart + selectedOption.length + 5
            );
            this.currentStartCaret = void 0;
            this.currentFilter = "";
            this.countStrokes = 0;
            this.enteringEP = false;
            this.enabled = false;
            for (const handler of this.onOptionSelected) {
              handler(selectedOption ?? "");
            }
          }
        }
        if (this.enteringEP && event.key === "Delete") {
          this.countStrokes--;
          const startCaret = DEFINED.tsCheck(this.currentStartCaret);
          this.currentFilter = this.currentFilter.substring(0, selectionStart - startCaret) + this.currentFilter.substring(selectionStart - startCaret + 1);
        }
        if (this.enteringEP && event.key === "Backspace") {
          this.countStrokes--;
          this.currentFilter = this.currentFilter.substring(0, this.currentFilter.length - 1);
        }
      } else {
        super.onKeydownTarget(event);
      }
    }
    /**
     * Appropriately determines the {@link EPManager.currentFilter } when in **EP**-Mode.
     *
     * @param separatedValues The {@link string } containing the separated values.
     * @param delimiter       The {@link string } delimiting each segment.
     * @param position        The current position within the segment.
     *
     * @returns When in **EP**-mode this method returns the {@link EPManager.currentFilter }
     *          otherwise it the {@link SVManager.determineSegmentcontent }'s result. */
    determineSegmentcontent(separatedValues, delimiter, position = 0) {
      if (this.mode === "EP") {
        const eventTarget = INSTANCE.tsCheck(this.target, HTMLInputElement);
        if (this.currentStartCaret) {
          return eventTarget.value.substring(this.currentStartCaret, this.currentStartCaret + this.countStrokes);
        } else {
          return "";
        }
      } else {
        return super.determineSegmentcontent(separatedValues, delimiter, position);
      }
    }
    // #endregion Filtering
  };
  __decorateClass([
    DBC.ParamvalueProvider,
    __decorateParam(0, OR.PRE([
      new EQ("options"),
      new EQ("separator"),
      new EQ("enabled"),
      new EQ("cssenabled"),
      new EQ("cssdisabled"),
      new EQ("epoptions"),
      new EQ("mode")
    ]))
  ], _EPManager.prototype, "attributeChangedCallback", 1);
  var EPManager = _EPManager;

  // src/js/LocalDocInterface.ts
  function getEmSizeInPixels(element) {
    const computedStyles = window.getComputedStyle(element);
    const fontSizeString = computedStyles.getPropertyValue("font-size");
    const result = Number.parseFloat(fontSizeString);
    return result;
  }
  function insertText(into, toInsert) {
    const start = into.selectionStart;
    const end = into.selectionEnd;
    const value = into.value;
    into.value = value.substring(0, start) + toInsert + value.substring(end);
    into.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function enableLocalDocInterface() {
    let codbiToggle;
    if (window.CodbiPluginData === void 0) {
      return;
    }
    window.addEventListener("load", () => {
      const baseURL = `${window.location.href.split("/").slice(0, 4).join("/")}/`;
      const parentWindows = window.parent;
      let attributePanelForcedToEnlarge = false;
      let currentLanguage = "de";
      if (parentWindows.length > 0) {
        currentLanguage = parentWindows[0]?.XFC_METADATA.currentLanguage || "de";
      }
      if (SVManager.registered && EPManager.registered) {
        const baseDocURL = window.CodbiPluginData.docsAPI[currentLanguage] === void 0 ? window.CodbiPluginData.docsAPI.en : window.CodbiPluginData.docsAPI[currentLanguage];
        let keystrokeBlockingStart = /* @__PURE__ */ new Date();
        document.body.insertAdjacentHTML(
          "beforeend",
          `<style>
                        .CodBi_Print_Remove_PrintOnly:after {
                          content: "x";
                          padding-left: .5em;
                          color: white;
                          border:solid;
                          background-color: black;
                          border-radius: .5em;
                          position: absolute;
                          opacity: 0.6;}
                        </style>
          <div  is          = "xc-epmanager"
                options     = "${JSON.parse(window.CodbiPluginData.fslFunctionalities).map((file) => {
            return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
          }).join(",")}"
                epoptions  = "${JSON.parse(window.CodbiPluginData.fslElementplaceholder).map((file) => {
            return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
          }).join(",")}"></div>
          <div  is = "xc-optioninput"></div>`
        );
        const epManager = INSTANCE.tsCheck(document.querySelector('div[is="xc-epmanager"]'), EPManager);
        const optioninput = INSTANCE.tsCheck(
          document.querySelector('div[is="xc-optioninput"]'),
          Optioninput
        );
        epManager.onAutocomplete.push((completedOption) => {
          keystrokeBlockingStart = /* @__PURE__ */ new Date();
        });
        optioninput.onOptionSelected.push((selectedOption) => {
          if (optioninput.mode === "Code Template") {
            switch (selectedOption) {
              case window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_OnLoaded"):
                insertText(
                  optioninput.target,
                  'window.addEventListener("load", (event) => {});'
                );
                break;
              case window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Functionality"):
                insertText(
                  optioninput.target,
                  `window.codbi.registerFunctionality("${window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Functionality_Placeholder")}",( toLoad, toProcess ) =>  {});`
                );
                break;
              case window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_EP"):
                insertText(
                  optioninput.target,
                  `window.codbi.registerEP("${window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_EP_Placeholder")}",( params ) =>  {});`
                );
                break;
              case window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Standard"):
                insertText(
                  optioninput.target,
                  `window.codbi.loadConfig({ targets: "${window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Standard_Placeholder_Targets")}", FUNC: "${window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Standard_Placeholder_FUNC")}"});`
                );
                break;
              case window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Functionality_Extend"):
                insertText(
                  optioninput.target,
                  `window.codbi.extendFunctionality("${window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Functionality_Extend_Placeholder")}",( toLoad, toProcess ) =>  {});`
                );
                break;
              case window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_EP_Extend"):
                insertText(optioninput.target, "window.codbi.checkAttributes();");
                break;
              case window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Start"):
                insertText(optioninput.target, "window.codbi.checkAttributes();");
                break;
              default:
                insertText(optioninput.target, "!! UNKNOWN SELECTION !!");
            }
            optioninput.enabled = false;
          }
        });
        optioninput.onAutocomplete.push((completedOption) => {
          if (optioninput.mode === "Functionality Parameter") {
            if (completedOption.indexOf("/") !== -1) {
              optioninput.target.value = `data-cb-${completedOption.substring(completedOption.indexOf("/") + 1).trim()}`;
            } else {
              optioninput.target.value = completedOption;
            }
            cDetails.style.display = "none";
            optioninput.enabled = false;
            const valueColumn = INSTANCE.tsCheck(
              optioninput.target.parentElement.parentElement.querySelector(".r2"),
              HTMLElement
            );
            const blocker = (event) => {
              const keyboardEvent = INSTANCE.tsCheck(event, KeyboardEvent);
              keyboardEvent.preventDefault();
              keyboardEvent.stopImmediatePropagation();
              keyboardEvent.stopPropagation();
              setTimeout(() => {
                document.removeEventListener("keydown", blocker);
              }, 250);
            };
            document.addEventListener("keydown", blocker);
            valueColumn.click();
            return;
          }
          if (optioninput.mode === "Global Variable") {
            if (completedOption.indexOf("[") !== -1) {
              optioninput.target.value = completedOption.substring(completedOption.indexOf("]") + 1).trim();
            } else {
              optioninput.target.value = completedOption;
            }
            cDetails.style.display = "none";
            optioninput.enabled = false;
            const valueColumn = INSTANCE.tsCheck(
              optioninput.target.parentElement.parentElement.querySelector(".r4"),
              HTMLElement
            );
            const blocker = (event) => {
              const keyboardEvent = INSTANCE.tsCheck(event, KeyboardEvent);
              keyboardEvent.preventDefault();
              keyboardEvent.stopImmediatePropagation();
              keyboardEvent.stopPropagation();
              setTimeout(() => {
                document.removeEventListener("keydown", blocker);
              }, 250);
            };
            document.addEventListener("keydown", blocker);
            valueColumn.click();
            return;
          }
          const r2 = INSTANCE.tsCheck(
            DEFINED.tsCheck(
              DEFINED.tsCheck(DEFINED.tsCheck(optioninput.target).parentElement).parentElement
            ).querySelector(".r2"),
            HTMLElement
          );
          const cellObserver = new MutationObserver((mutationsList, observer) => {
            for (const mutation of mutationsList) {
              if (mutation.type === "childList") {
                for (const added of mutation.addedNodes) {
                  let bound = false;
                  if (added.nodeName === "INPUT") {
                    added.addEventListener("keydown", (event) => {
                      const keyboardEvent = INSTANCE.tsCheck(event, KeyboardEvent);
                      if (keyboardEvent.altKey && keyboardEvent.key.toLowerCase() === "e") {
                        keyboardEvent.preventDefault();
                        keyboardEvent.stopImmediatePropagation();
                        keyboardEvent.stopPropagation();
                        epManager.mode = "SV";
                        epManager.mode = "EP";
                        INSTANCE.tsCheck(
                          document.querySelector('div[is = "xc-epmanager"]'),
                          HTMLElement
                        ).setAttribute(
                          "epoptions",
                          JSON.parse(window.CodbiPluginData.fslElementplaceholder).map((file) => {
                            return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
                          }).join(",")
                        );
                        DEFINED.tsCheck(cDetails.querySelector("object")).setAttribute(
                          "data",
                          `${window.CodbiPluginData.docsAPI[currentLanguage] === void 0 ? window.CodbiPluginData.docsAPI.en : window.CodbiPluginData.docsAPI[currentLanguage]}${window.CodbiPluginData.detElementplaceholder[epManager.currentOption]?.Description}`
                        );
                        epManager.enabled = true;
                        epManager.enteringEP = true;
                        cDetails.style.display = "block";
                        updateLayoutEPManager(added);
                        updateLayoutCDetails(epManager);
                        if (!bound) {
                          bound = true;
                          epManager.target = INSTANCE.tsCheck(event.target, HTMLInputElement);
                        }
                      }
                    });
                  }
                }
              }
            }
          });
          cellObserver.observe(r2.parentElement.parentElement, {
            childList: true,
            subtree: true
          });
          r2.click();
        });
        optioninput.onOptionChanged.push((newOption) => {
          if (inTag) {
            const description2 = DEFINED.tsCheck(
              window.CodbiPluginData.detStandards[newOption.substring(0, newOption.indexOf("/") - 1).trim()]?.Description
            );
            if (description2[0] === "/") {
              cDetails.innerHTML = `<object data = '${baseDocURL}${description2}' style = 'width : 100% ; height : 100% ; opacity : .8 ;'></object>`;
            } else {
              cDetails.innerHTML = `<div style = "width: 100% ; height: 100% ; overflow : auto ;">${description2}</div>`;
            }
            return;
          }
          const description = DEFINED.tsCheck(
            window.CodbiPluginData.detFunctionalities[newOption.substring(0, newOption.indexOf("/") - 1).toLowerCase().trim()]?.Description ?? (newOption.indexOf("[") !== -1 ? window.CodbiPluginData.detStandards[newOption.substring(1, newOption.indexOf("]") - 1).trim()]?.Description : window.CodbiPluginData.detFunctionalities[newOption.substring(0, newOption.lastIndexOf("_")).replace(/_/g, ".").trim()]?.Description)
          );
          if (description[0] === "/") {
            cDetails.innerHTML = `<object data = '${baseDocURL}${description}' style = 'width : 100% ; height : 100% ; opacity : .8 ;'></object>`;
          } else {
            cDetails.innerHTML = `<div style = "width: 100% ; height: 100% ; overflow : auto ;">${description}</div>`;
          }
        });
        optioninput.onOptionSelected.push((selectedOption) => {
          if (optioninput.mode === "Code Template") {
            return;
          }
          cDetails.style.display = "none";
          INSTANCE.tsCheck(
            DEFINED.tsCheck(
              DEFINED.tsCheck(DEFINED.tsCheck(optioninput.target).parentElement).parentElement
            ).querySelector(".r2"),
            HTMLElement
          ).click();
          if (optioninput.target.parentElement === null) {
            return;
          }
          const parent = INSTANCE.tsCheck(
            DEFINED.tsCheck(
              DEFINED.tsCheck(DEFINED.tsCheck(optioninput.target).parentElement).parentElement
            ).querySelector(".r2"),
            HTMLElement
          );
          const cell = parent.querySelector("input");
          if (cell === null) {
            return;
          }
          let bound = false;
          cell.addEventListener("keydown", (keyboardEvent) => {
            keyboardEvent.preventDefault();
            keyboardEvent.stopImmediatePropagation();
            keyboardEvent.stopPropagation();
            epManager.mode = "EP";
            epManager.setAttribute(
              "epoptions",
              JSON.parse(window.CodbiPluginData.fslElementplaceholder).map((file) => {
                return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
              }).join(",")
            );
            DEFINED.tsCheck(cDetails.querySelector("object")).setAttribute(
              "data",
              `${window.CodbiPluginData.docsAPI[currentLanguage] === void 0 ? window.CodbiPluginData.docsAPI.en : window.CodbiPluginData.docsAPI[currentLanguage]}${window.CodbiPluginData.detElementplaceholder[epManager.currentOption]?.Description}`
            );
            epManager.enabled = true;
            epManager.enteringEP = true;
            cDetails.style.display = "block";
            updateLayoutEPManager(cell);
            updateLayoutCDetails(epManager);
            if (!bound) {
              bound = true;
              epManager.target = INSTANCE.tsCheck(keyboardEvent.target, HTMLInputElement);
            }
          });
        });
        epManager.onOptionSelected.push((selectedOption) => {
          cDetails.style.display = "none";
        });
        optioninput.targetOptionTransformer = (toTransform) => {
          return `data-cb-${toTransform.substring(toTransform.indexOf("/") + 1).trim()}`;
        };
        optioninput.optionTransformer = epManager.optionTransformer = (toTransform) => {
          return toTransform.toUpperCase();
        };
        optioninput.style.position = epManager.style.position = "absolute";
        optioninput.style.border = epManager.style.border = "solid";
        optioninput.style.padding = epManager.style.padding = ".5em";
        optioninput.style.zIndex = epManager.style.zIndex = "100";
        optioninput.style.borderRadius = epManager.style.borderRadius = ".5em";
        optioninput.style.boxShadow = epManager.style.boxShadow = "0 0 .5em black";
        optioninput.style.overflowY = epManager.style.overflowY = "auto";
        optioninput.backgroundImage = epManager.backgroundImage = `${baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg`;
        const updateLayoutEPManager = (cell) => {
          const rectCell = cell.getBoundingClientRect();
          epManager.style.maxHeight = `${window.innerHeight - Math.ceil(rectCell.bottom)}px`;
          epManager.style.top = `${Math.ceil(rectCell.bottom)}px`;
          epManager.style.left = `${Math.ceil(rectCell.right - epManager.getBoundingClientRect().width - window.innerWidth / 100 * 2)}px`;
          epManager.style.maxHeight = `${Math.ceil(window.innerHeight - window.innerHeight / 100 * 2 - rectCell.bottom)}px`;
        };
        const updateLayoutOptioninput = (cell) => {
          const rectCell = cell.getBoundingClientRect();
          optioninput.style.maxHeight = `${window.innerHeight - Math.ceil(rectCell.bottom)}px`;
          optioninput.style.top = `${Math.ceil(rectCell.bottom)}px`;
          optioninput.style.left = `${Math.ceil(rectCell.right - optioninput.getBoundingClientRect().width - window.innerWidth / 100 * 2)}px`;
          optioninput.style.maxHeight = `${Math.ceil(window.innerHeight - window.innerHeight / 100 * 2 - rectCell.bottom)}px`;
        };
        const cDetails = document.createElement("div");
        let flagMouseOverCDetails = false;
        let currentCDetailBlurAction;
        cDetails.addEventListener("mouseenter", (event) => {
          flagMouseOverCDetails = true;
        });
        cDetails.addEventListener("mouseleave", (event) => {
          flagMouseOverCDetails = false;
          if (currentCDetailBlurAction) {
            currentCDetailBlurAction();
          }
        });
        cDetails.style.position = "absolute";
        cDetails.style.display = "none";
        cDetails.style.border = "solid";
        cDetails.style.padding = ".5em";
        cDetails.style.zIndex = "100";
        cDetails.style.borderColor = "darkorange";
        cDetails.style.backgroundImage = `url("${baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg"), linear-gradient( 130deg,rgba( 42, 123, 155, 1 ) 0%, rgba( 216, 216, 235, 1 ) 50%, rgba( 42, 123, 155, 1 ) 100% )`;
        cDetails.style.backgroundSize = "contain";
        cDetails.style.backgroundPosition = "center";
        cDetails.style.backgroundRepeat = "no-repeat";
        cDetails.style.backgroundBlendMode = "overlay";
        cDetails.style.backgroundColor = "#FFFFFFCC";
        cDetails.style.borderRadius = ".5em";
        cDetails.style.boxShadow = "0 0 .5em black";
        cDetails.style.opacity = ".9";
        cDetails.style.display = "none";
        cDetails.style.padding = "0";
        cDetails.classList.add("---CodBi", "--Panel", "--APIDoc");
        cDetails.innerHTML = `
          <div class = "APIDocLoader"></div>

          <object id = "CodBi_APIDocViewer"></object>`;
        const cssDetails = document.createElement("style");
        cssDetails.innerHTML = `
          @keyframes kfSpinner { 100% { transform : rotate( 1turn )}}
          .APIDocLoader          { align-self : anchor-center ; justify-self : anchor-center ; width : 10% ; position : absolute ; text-align : center ; margin : auto ; aspect-ratio : 1 ;
                                   display : grid ; border : 2px solid #0000 ; border-radius : 50% ;
                                   border-right-color :  #1e79ee ; animation : kfSpinner 1s infinite linear ;}
          .APIDocLoader::before,
          .APIDocLoader::after   { content : ""; grid-area : 1/1 ; margin : 2px ; border : inherit ;
                                   border-radius : 50% ; animation : kfSpinner 2s infinite ;}
          .APIDocLoader::after   { margin : 8px ;
                                   animation-duration : 1.5s ;}

          @keyframes kfFadeIN_APIDoc {
            0% { scale : 1.1 ; opacity : 0 ;}
            100% { scale : 1 ; opacity : .9 ;}}
          .---CodBi.--Panel.--APIDoc  { animation : kfFadeIN_APIDoc .25s ease-in forwards ;}
          object#CodBi_APIDocViewer   { opacity : .8 ; width : 100% !important ; height : 100% !important ; border-radius : .5em ;}`;
        cDetails.prepend(cssDetails);
        document.body?.appendChild(cDetails);
        const onFirstDocLoad = (event) => {
          cDetails.querySelector(".APIDocLoader").remove();
          cDetails.querySelector("object").removeEventListener("load", onFirstDocLoad);
        };
        cDetails.querySelector("object").addEventListener("load", onFirstDocLoad);
        const $2 = (0, import_fc_form_designer2.getJQuery)();
        $2.ajax({
          url: `${baseURL}plugin?name=CodBi_LocalAPIDoc`,
          type: "GET",
          headers: {
            "X-Action": "Retrieve"
          },
          success: (response) => {
            for (const functionality in response.detFunctionalities) {
              window.CodbiPluginData.detFunctionalities[functionality] = response.detFunctionalities[functionality];
              (0, import_fc_form_designer2.getJQuery)().ajax({
                url: `${baseURL}plugin?name=CodBi_LocalAPIDoc`,
                type: "GET",
                headers: {
                  "X-Action": "Code",
                  "X-ActionDetail": "Functionality",
                  "X-Element": functionality
                },
                success: (response2) => {
                  if (response2.result !== "NONE") {
                    if (document.readyState === "complete") {
                      window.CodbiPluginData.detFunctionalities[functionality].Code = response2.result.replaceAll(
                        "<|>",
                        '"'
                      );
                    }
                  }
                }
              });
            }
            if (response.fslFunctionalities) {
              window.CodbiPluginData.fslFunctionalities = `${window.CodbiPluginData.fslFunctionalities.substring(0, window.CodbiPluginData.fslFunctionalities.length - 1)},"${response.fslFunctionalities.split(",").join('","')}"]`;
            }
            for (const placeholder in response.detElementplaceholder) {
              window.CodbiPluginData.detElementplaceholder[placeholder] = response.detElementplaceholder[placeholder];
              (0, import_fc_form_designer2.getJQuery)().ajax({
                url: `${baseURL}plugin?name=CodBi_LocalAPIDoc`,
                type: "GET",
                headers: {
                  "X-Action": "Code",
                  "X-ActionDetail": "Elementplaceholder",
                  "X-Element": placeholder
                },
                success: (response2) => {
                  if (response2.result !== "NONE") {
                    if (document.readyState === "complete") {
                      window.CodbiPluginData.detElementplaceholder[placeholder].Code = response2.result.replaceAll("<|>", '"');
                    }
                  }
                }
              });
            }
            if (response.fslElementplaceholder) {
              window.CodbiPluginData.fslElementplaceholder = `${window.CodbiPluginData.fslElementplaceholder.substring(0, window.CodbiPluginData.fslElementplaceholder.length - 1)},"${response.fslElementplaceholder.split(",").join('","')}"]`;
            }
            if (response.detStandards) {
              for (const key in response.detStandards) {
                window.CodbiPluginData.detStandards[key] = response.detStandards[key];
                (0, import_fc_form_designer2.getJQuery)().ajax({
                  url: `${baseURL}plugin?name=CodBi_LocalAPIDoc`,
                  type: "GET",
                  headers: {
                    "X-Action": "Code",
                    "X-ActionDetail": "Standard",
                    "X-Element": key
                  },
                  success: (response2) => {
                    if (response2.result !== "NONE") {
                      if (document.readyState === "complete") {
                        window.CodbiPluginData.detStandards[key].Code = response2.result.replaceAll("<|>", '"');
                      }
                    }
                  }
                });
              }
            }
            if (response.fileListing) {
              window.CodbiPluginData.fileListing = `${window.CodbiPluginData.fileListing.substring(0, window.CodbiPluginData.fileListing.length - 1)},"${response.fileListing.split(",").join('","')}"]`;
            }
            setTimeout(() => {
              window.CodbiPluginData.populateStandards();
            });
            INSTANCE.tsCheck(document.querySelector('div[is = "xc-epmanager"]'), HTMLElement).setAttribute(
              "options",
              JSON.parse(window.CodbiPluginData.fslFunctionalities).map((file) => {
                return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
              }).join(",")
            );
            INSTANCE.tsCheck(document.querySelector('div[is = "xc-epmanager"]'), HTMLElement).setAttribute(
              "epoptions",
              JSON.parse(window.CodbiPluginData.fslElementplaceholder).map((file) => {
                return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
              }).join(",")
            );
            const scriptAPIManager = document.createElement("script");
            scriptAPIManager.src = `${baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/cb-manager.js`;
            document.head.appendChild(scriptAPIManager);
            const cssAPIManager = document.createElement("link");
            cssAPIManager.rel = "stylesheet";
            cssAPIManager.type = "text/css";
            cssAPIManager.href = `${baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/cb-manager.css`;
            document.head.appendChild(cssAPIManager);
            document.body.insertAdjacentHTML(
              "beforeend",
              `
          <style>
            #cCodBi_LocalAPIDoc { z-index: 100 ; position : absolute ; left : -100vw ; top : 20vh ; width : 70vw ; height : 50vh ; pointer-events : none ; opacity : 0 ; transition : 1s all ;}
            #cCodBi_LocalAPIDoc.--opened { left : 0vw ; opacity : .9 ; pointer-events : all !important ;}}
            #cCodBi_LocalAPIDoc cb-manager { display : block ; height : 100% ;}</style>
          <div id = "cCodBi_LocalAPIDoc">
            <cb-manager apidoc      = '${JSON.stringify(response)}'
                        baseURL     = "${baseURL}"
                        language    = "${currentLanguage}"
                        resourceURL = "${baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/tinymce"
                        docPath     = "CodbiPluginData"
                        watermark   = "${baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg"></cb-manager></div>`
            );
            const manager = document.querySelector("#cCodBi_LocalAPIDoc");
            manager.style.pointerEvents = "none";
            document.addEventListener("keyup", (event) => {
              if (event.altKey && event.key.toLowerCase() === "c") {
                codbiToggle = document.querySelector("#form-codbi-prop-enable-input");
                if (codbiToggle && !codbiToggle.checked) {
                  return;
                }
                if (document.getElementById("scriptForm:scriptTabs:xm-editor-js_editor").contains(document.activeElement)) {
                  if (optioninput.enabled) {
                    optioninput.enabled = false;
                  } else {
                    const listener = (event2) => {
                      if (optioninput.enabled && optioninput.mode === "Code Template") {
                        optioninput.enabled = false;
                        document.activeElement.removeEventListener("blur", listener);
                      }
                    };
                    document.activeElement.addEventListener("blur", listener);
                    const clientRect = document.activeElement.getBoundingClientRect();
                    const emPixels = getEmSizeInPixels(document.activeElement) * 22;
                    const top = clientRect.top + clientRect.height;
                    optioninput.style.top = `${(top > 0 ? top : 0) + emPixels / 11}px`;
                    optioninput.style.left = `${clientRect.left + clientRect.width / 2}px`;
                    optioninput.style.maxHeight = `${emPixels}px`;
                    optioninput.mode = "Code Template";
                    optioninput.options = [
                      window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_OnLoaded"),
                      window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Functionality"),
                      window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_EP"),
                      window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Standard"),
                      window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Functionality_Extend"),
                      window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_EP_Extend"),
                      window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Start")
                    ];
                    optioninput.enabled = true;
                    optioninput.target = document.activeElement;
                    optioninput.targetOptionTransformer = (toTransform) => {
                      return "";
                    };
                    if (manager.classList.contains("--opened")) {
                      manager.classList.remove("--opened");
                    }
                  }
                } else {
                  manager.classList.toggle("--opened");
                }
              }
            });
            window.CodbiPluginData.managerClosed = () => {
              console.log("L:", document.activeElement);
              manager.classList.toggle("--opened");
            };
          }
        });
        const updateLayoutCDetails = (alignTo) => {
          const rectToAlignTo = alignTo.getBoundingClientRect();
          const top = rectToAlignTo.top + rectToAlignTo.height / 100 * 4.5;
          cDetails.style.left = `${Math.ceil(rectToAlignTo.left + rectToAlignTo.width > window.innerWidth / 2 ? window.innerWidth / 100 * 1 : rectToAlignTo.left + rectToAlignTo.width + window.innerWidth / 100 * 1)}px`;
          cDetails.style.top = `${top > window.innerHeight / 2 ? window.innerHeight / 2 : top}px`;
          cDetails.style.width = `${Math.ceil(rectToAlignTo.left + rectToAlignTo.width > window.innerWidth / 2 ? rectToAlignTo.left - window.innerWidth / 100 * 2 : window.innerWidth - rectToAlignTo.right - window.innerWidth / 100 * 2)}px`;
          cDetails.style.height = `${(rectToAlignTo.height < window.innerHeight / 2 ? window.innerHeight / 2 : rectToAlignTo.height) - rectToAlignTo.height / 100 * 10}px`;
        };
        const availableClasses = new Array();
        let attributesEditorProcessed = false;
        let inTag = false;
        for (const globalVarsEditor of document.querySelectorAll('a[href="#scriptForm:scriptTabs:varTab"]')) {
          globalVarsEditor.addEventListener("click", (event) => {
            const cellObserver = new MutationObserver((mutationsList, observer) => {
              for (const mutation of mutationsList) {
                if (mutation.type === "childList") {
                  for (const added of mutation.addedNodes) {
                    if (added instanceof HTMLInputElement && DEFINED.tsCheck(added.parentElement).classList.contains("r2")) {
                      codbiToggle = document.querySelector("#form-codbi-prop-enable-input");
                      if (codbiToggle && !codbiToggle.checked) {
                        return;
                      }
                      added.placeholder = "CodBi: ALT + V";
                      added.addEventListener("keydown", (event2) => {
                        codbiToggle = document.querySelector("#form-codbi-prop-enable-input");
                        if (codbiToggle && !codbiToggle.checked) {
                          return;
                        }
                        if (event2.altKey && (event2.key === "v" || event2.key === "V")) {
                          const globalVariables = new Array();
                          for (const standard in window.CodbiPluginData.detStandards) {
                            if (window.CodbiPluginData.detStandards[standard]?.globals) {
                              for (const global2 in window.CodbiPluginData.detStandards[standard].globals) {
                                globalVariables.push(`[ ${standard} ] ${global2}`);
                              }
                            }
                          }
                          for (const functionality in window.CodbiPluginData.detFunctionalities) {
                            for (const parameter in window.CodbiPluginData.detFunctionalities[functionality]?.Parameter) {
                              globalVariables.push(`${functionality.replace(/\./g, "_")}_${parameter}`);
                            }
                          }
                          optioninput.mode = "Global Variable";
                          optioninput.options = globalVariables;
                          optioninput.enabled = true;
                          optioninput.target = added;
                          optioninput.targetOptionTransformer = (toTransform) => {
                            if (toTransform.indexOf("[") !== -1) {
                              return toTransform.substring(toTransform.indexOf("]") + 1).trim();
                            }
                            return toTransform;
                          };
                          optioninput.onOptionChanged.push((newOption) => {
                            if (newOption.indexOf("_")) {
                              return;
                            }
                            DEFINED.tsCheck(cDetails.querySelector("object")).setAttribute(
                              "data",
                              `${window.CodbiPluginData.docsAPI[currentLanguage] === void 0 ? window.CodbiPluginData.docsAPI.en : window.CodbiPluginData.docsAPI[currentLanguage]}${newOption.indexOf("[") !== -1 ? window.CodbiPluginData.detStandards[newOption.substring(newOption.indexOf("[") + 1, newOption.lastIndexOf("]") - 1).trim()]?.Description : window.CodbiPluginData.detFunctionalities[newOption.substring(0, newOption.lastIndexOf("_")).replace(/_/g, ".").trim()]?.Description}`
                            );
                          });
                          optioninput.onOptionSelected.push((newOption) => {
                            if (optioninput.mode === "Code Template") {
                              return;
                            }
                            if (added.value.indexOf("[") !== -1) {
                              added.value = added.value.substring(added.value.indexOf("]") + 2).trim();
                            } else {
                              added.value = added.value.replace("data-cb-", "");
                            }
                            INSTANCE.tsCheck(
                              optioninput.target.parentElement.parentElement.querySelector(".r4"),
                              HTMLElement
                            ).click();
                          });
                          if (added) {
                            const rectAdded = INSTANCE.tsCheck(
                              added.parentElement,
                              HTMLElement
                            ).getBoundingClientRect();
                            optioninput.style.maxHeight = `${window.innerHeight - Math.ceil(rectAdded.bottom)}px`;
                            optioninput.style.top = "5vh";
                            optioninput.style.left = `${Math.ceil(rectAdded.left)}px`;
                            optioninput.style.maxHeight = `${Math.ceil(rectAdded.top - window.innerHeight / 100 * 7)}px`;
                            cDetails.style.display = "block";
                            updateLayoutCDetails(optioninput);
                            const baseDocURL2 = window.CodbiPluginData.docsAPI[currentLanguage] === void 0 ? window.CodbiPluginData.docsAPI.en : window.CodbiPluginData.docsAPI[currentLanguage];
                            const description = DEFINED.tsCheck(
                              window.CodbiPluginData.detFunctionalities[globalVariables[0].substring(0, globalVariables[0].indexOf("/") - 1).toLowerCase().trim()]?.Description ?? (globalVariables[0].indexOf("[") !== -1 ? window.CodbiPluginData.detStandards[globalVariables[0].substring(1, globalVariables[0].indexOf("]") - 1).trim()]?.Description : window.CodbiPluginData.detFunctionalities[globalVariables[0].substring(0, globalVariables[0].lastIndexOf("_")).replace(/_/g, ".").trim()]?.Description)
                            );
                            if (description[0] === "/") {
                              cDetails.innerHTML = `<object data = '${baseDocURL2}${description}' style = 'width : 100% ; height : 100% ; opacity : .8 ;'></object>`;
                            } else {
                              cDetails.innerHTML = `<div style = "width: 100% ; height: 100% ; overflow : auto ;">${description}</div>`;
                            }
                          }
                        }
                      });
                      added.addEventListener("blur", (event2) => {
                        if (!flagMouseOverCDetails) {
                          cDetails.style.display = "none";
                          optioninput.enabled = false;
                        } else {
                          currentCDetailBlurAction = () => {
                            cDetails.style.display = "none";
                            optioninput.enabled = false;
                          };
                        }
                      });
                    }
                  }
                }
              }
            });
            cellObserver.observe(DEFINED.tsCheck(document.querySelector("#varseditor")), {
              childList: true,
              subtree: true
            });
          });
        }
        for (const tabEditor of document.querySelectorAll('a[href="#tabsRight:extendedTab"]')) {
          tabEditor.addEventListener("click", (event) => {
            const paramCellObserver = new MutationObserver((mutationsList, observer2) => {
              for (const mutation of mutationsList) {
                if (mutation.type === "childList") {
                  for (const added of mutation.addedNodes) {
                    const possibleTagify = DEFINED.tsCheck(added.parentElement);
                    if (possibleTagify.classList.contains("tagify__input")) {
                      let input;
                      possibleTagify.addEventListener("blur", (event2) => {
                        if (!flagMouseOverCDetails) {
                          inTag = false;
                          cDetails.style.display = "none";
                          optioninput.enabled = false;
                        } else {
                          currentCDetailBlurAction = () => {
                            inTag = false;
                            cDetails.style.display = "none";
                            optioninput.enabled = false;
                          };
                        }
                      });
                      possibleTagify.addEventListener("keyup", (event2) => {
                        const eventTarget = INSTANCE.tsCheck(event2.target, HTMLElement);
                        if (input === void 0) {
                          if (event2.key === ".") {
                            inTag = true;
                            input = "";
                            availableClasses.length = 0;
                            for (const standard in window.CodbiPluginData.detStandards) {
                              if (window.CodbiPluginData.detStandards[standard]?.Active) {
                                for (const cssClass in window.CodbiPluginData.detStandards[standard].classes) {
                                  availableClasses.push({
                                    standard,
                                    name: cssClass,
                                    description: DEFINED.tsCheck(
                                      window.CodbiPluginData.detStandards[standard].classes[cssClass]
                                    )
                                  });
                                }
                              }
                            }
                            optioninput.mode = "CSS-Class";
                            optioninput.options = availableClasses.map(
                              (cssClass) => `${cssClass.standard} / ${cssClass.name}`
                            );
                            const realName = DEFINED.tsCheck(
                              optioninput.currentOption.substring(0, optioninput.currentOption.indexOf("/") - 1).trim()
                            );
                            const description = DEFINED.tsCheck(
                              window.CodbiPluginData.detStandards[realName]?.Description
                            );
                            if (window.CodbiPluginData.detStandards[realName]?.Description[0] === "/") {
                              cDetails.innerHTML = `<object data = '${baseDocURL}${description}' style = 'width : 100% ; height : 100% ; opacity : .8 ;'></object>`;
                            } else {
                              cDetails.innerHTML = `
                            <div style = "width: 100% ; height: 100% ; overflow : auto ;">
                              ${description}</div>`;
                            }
                            optioninput.enabled = true;
                            optioninput.optionTransformer = void 0;
                            if (added.parentElement !== null && added.parentElement !== void 0) {
                              const rectAdded = INSTANCE.tsCheck(
                                added.parentElement,
                                HTMLElement
                              ).getBoundingClientRect();
                              optioninput.style.maxHeight = `${window.innerHeight - Math.ceil(rectAdded.bottom)}px`;
                              optioninput.style.top = `${Math.ceil(rectAdded.bottom)}px`;
                              optioninput.style.left = `${Math.ceil(rectAdded.right - optioninput.getBoundingClientRect().width - window.innerWidth / 100 * 2)}px`;
                              optioninput.style.maxHeight = `${Math.ceil(window.innerHeight - window.innerHeight / 100 * 2 - rectAdded.bottom)}px`;
                            }
                            cDetails.style.display = "block";
                            updateLayoutCDetails(optioninput);
                          }
                        } else {
                          if (event2.key !== " ") {
                            optioninput.onKeydownTarget(event2);
                            optioninput.currentOptionElement.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                              inline: "center"
                            });
                          }
                          if (inTag) {
                            currentCDetailBlurAction = () => {
                            };
                            if (/^[a-zA-Z0-9_ ]$/.test(event2.key) || event2.key === "Backspace" || event2.key === "Delete") {
                              if (event2.key === " ") {
                                possibleTagify.innerHTML = optioninput.currentOption.substring(
                                  optioninput.currentOption.indexOf("/") + 1
                                );
                                inTag = false;
                                cDetails.style.display = "none";
                                optioninput.enabled = false;
                                event2.target.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
                                return;
                              }
                              if (eventTarget.innerHTML.indexOf(".") === -1) {
                                codbiToggle = document.querySelector("#form-codbi-prop-enable-input");
                                if (codbiToggle && !codbiToggle.checked) {
                                  return;
                                }
                                inTag = false;
                                cDetails.style.display = "none";
                                optioninput.enabled = false;
                                return;
                              }
                              if (optioninput.filter(eventTarget.innerHTML.substring(1)).length === 1) {
                                possibleTagify.innerHTML = optioninput.currentOption.substring(
                                  optioninput.currentOption.indexOf("/") + 1
                                );
                                inTag = false;
                                cDetails.style.display = "none";
                                optioninput.enabled = false;
                                event2.target.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
                                const blocker = (event3) => {
                                  const keyboardEvent = INSTANCE.tsCheck(event3, KeyboardEvent);
                                  keyboardEvent.preventDefault();
                                  keyboardEvent.stopImmediatePropagation();
                                  keyboardEvent.stopPropagation();
                                  setTimeout(() => {
                                    document.removeEventListener("keydown", blocker);
                                  }, 500);
                                };
                                document.addEventListener("keydown", blocker);
                                return;
                              }
                            }
                          } else {
                            currentCDetailBlurAction = () => {
                              inTag = false;
                              cDetails.style.display = "none";
                              optioninput.enabled = false;
                            };
                          }
                          if (inTag) {
                            const realName = DEFINED.tsCheck(
                              optioninput.currentOption.substring(0, optioninput.currentOption.indexOf("/") - 1).trim()
                            );
                            const description = DEFINED.tsCheck(
                              window.CodbiPluginData.detStandards[realName]?.Description
                            );
                            if (window.CodbiPluginData.detStandards[realName]?.Description[0] === "/") {
                              DEFINED.tsCheck(cDetails.querySelector("object")).remove();
                              cDetails.innerHTML = `<object data = '${baseDocURL}${description}' style = 'width : 100% ; height : 100% ; opacity : .8 ;'></object>`;
                            } else {
                              cDetails.innerHTML = `
                            <div style = "width: 100% ; height: 100% ; overflow : auto ;">
                              ${description}</div>`;
                            }
                          }
                        }
                      });
                    }
                    if (added instanceof HTMLInputElement) {
                      if (INSTANCE.tsCheck(
                        DEFINED.tsCheck(
                          DEFINED.tsCheck(added.parentElement).parentElement
                        ).querySelector(".r1"),
                        HTMLElement
                      ).innerHTML.toLowerCase() === "data-cb-func") {
                        window.CodbiPluginData.updateSVManager(window.CodbiPluginData.fslFunctionalities);
                        if (!epManager.enabled) {
                          added.setSelectionRange(added.value.length, added.value.length);
                          INSTANCE.tsCheck(
                            document.querySelector('div[is = "xc-epmanager"]'),
                            HTMLElement
                          ).setAttribute(
                            "options",
                            JSON.parse(window.CodbiPluginData.fslFunctionalities).map((file) => {
                              return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
                            }).join(",")
                          );
                          epManager.mode = "SV";
                          epManager.target = INSTANCE.tsCheck(added, HTMLInputElement);
                          epManager.enabled = true;
                          updateLayoutEPManager(added);
                          added.addEventListener("blur", (event2) => {
                            if (!flagMouseOverCDetails) {
                              epManager.enabled = false;
                              cDetails.style.display = "none";
                            } else {
                              currentCDetailBlurAction = () => {
                                epManager.enabled = false;
                                cDetails.style.display = "none";
                              };
                            }
                          });
                          if (cDetails.querySelector("object")) {
                            DEFINED.tsCheck(cDetails.querySelector("object")).setAttribute(
                              "data",
                              `${window.CodbiPluginData.docsAPI[currentLanguage] === void 0 ? window.CodbiPluginData.docsAPI.en : window.CodbiPluginData.docsAPI[currentLanguage]}${window.CodbiPluginData.detFunctionalities[epManager.currentOption]?.Description}`
                            );
                          }
                        }
                        if (cDetails.style.display !== "block") {
                          cDetails.style.display = "block";
                          updateLayoutCDetails(epManager);
                        }
                      }
                      if (added.parentElement) {
                        const addedParent = added.parentElement;
                        if (added.classList.contains("editor-text") && addedParent.classList.contains("r1")) {
                          let cbFUNCs;
                          if (added.parentElement.parentElement) {
                            for (const possibleCBFunc of DEFINED.tsCheck(
                              DEFINED.tsCheck(addedParent.parentElement).parentElement
                            ).querySelectorAll(".r1")) {
                              if (possibleCBFunc.parentElement && possibleCBFunc.innerHTML.toLowerCase() === "data-cb-func") {
                                cbFUNCs = INSTANCE.tsCheck(
                                  DEFINED.tsCheck(possibleCBFunc.parentElement).querySelector(".r2"),
                                  HTMLElement
                                ).innerHTML;
                                break;
                              }
                            }
                          }
                          if (cbFUNCs) {
                            INSTANCE.tsCheck(added, HTMLInputElement).placeholder = "CodBi: ALT+P";
                            added.addEventListener("keydown", (event2) => {
                              if (event2.altKey && (event2.key === "p" || event2.key === "P")) {
                                const parameterListing = {};
                                for (let functionality of cbFUNCs.trim().split(",")) {
                                  if (!/^\s*$/.test(functionality)) {
                                    functionality = functionality.toLowerCase();
                                    parameterListing[functionality] = new Array();
                                    for (const parameter in window.CodbiPluginData.detFunctionalities[functionality]?.Parameter) {
                                      DEFINED.tsCheck(parameterListing[functionality]).push(parameter);
                                    }
                                  }
                                  const functionalityParameter = new Array();
                                  for (const functionality2 in parameterListing) {
                                    for (const parameter of DEFINED.tsCheck(
                                      parameterListing[functionality2]
                                    )) {
                                      functionalityParameter.push(`${functionality2} / ${parameter}`);
                                    }
                                  }
                                  if (functionalityParameter.length === 0) {
                                    return;
                                  }
                                  optioninput.optionTransformer = (toTransform) => {
                                    return toTransform.toUpperCase();
                                  };
                                  optioninput.mode = "Functionality Parameter";
                                  optioninput.target = added;
                                  optioninput.enabled = true;
                                  optioninput.options = functionalityParameter;
                                  cDetails.style.display = "block";
                                  optioninput.targetOptionTransformer = (toTransform) => {
                                    return `data-cb-${toTransform.substring(toTransform.indexOf("/") + 1).trim()}`;
                                  };
                                  updateLayoutOptioninput(added);
                                  updateLayoutCDetails(optioninput);
                                  if (window.CodbiPluginData.detFunctionalities[optioninput.currentOption.substring(0, optioninput.currentOption.indexOf("/") - 1)]?.Description[0] === "/") {
                                    cDetails.innerHTML = `<object data = '${window.CodbiPluginData.docsAPI[currentLanguage] === void 0 ? window.CodbiPluginData.docsAPI.en : window.CodbiPluginData.docsAPI[currentLanguage]}${window.CodbiPluginData.detFunctionalities[optioninput.currentOption.substring(0, optioninput.currentOption.indexOf("/") - 1)]?.Description}' style = 'width : 100% ; height : 100% ; opacity : .8 ;'></object>`;
                                  } else {
                                    const docLoader = cDetails.querySelector(".APIDocLoader");
                                    if (docLoader) {
                                      docLoader.remove();
                                    }
                                    cDetails.innerHTML = `
                                  <div style = "width: 100% ; height: 100% ; overflow : auto ;">
                                    ${window.CodbiPluginData.docsAPI[currentLanguage]}${window.CodbiPluginData.detFunctionalities[optioninput.currentOption.substring(0, optioninput.currentOption.indexOf("/") - 1)]?.Description}</div>`;
                                  }
                                  cDetails.innerHTML = cDetails.innerHTML.replace("undefined", "");
                                }
                              }
                              if (event2.key === "Escape") {
                                optioninput.enabled = false;
                                cDetails.style.display = "none";
                              }
                            });
                            added.addEventListener("blur", (event2) => {
                              if (!flagMouseOverCDetails) {
                                optioninput.enabled = false;
                                cDetails.style.display = "none";
                              } else {
                                currentCDetailBlurAction = () => {
                                  optioninput.enabled = false;
                                  cDetails.style.display = "none";
                                };
                              }
                            });
                          } else {
                            codbiToggle = document.querySelector("#form-codbi-prop-enable-input");
                            if (codbiToggle && !codbiToggle.checked) {
                              return;
                            }
                            INSTANCE.tsCheck(added, HTMLInputElement).placeholder = "CodBi: ALT+F";
                            added.addEventListener("keydown", (event2) => {
                              if (event2.altKey && event2.key.toLowerCase() === "f") {
                                codbiToggle = document.querySelector("#form-codbi-prop-enable-input");
                                if (codbiToggle && !codbiToggle.checked) {
                                  return;
                                }
                                event2.preventDefault();
                                event2.stopImmediatePropagation();
                                event2.stopPropagation();
                                added.value = "data-cb-func";
                                INSTANCE.tsCheck(
                                  DEFINED.tsCheck(
                                    DEFINED.tsCheck(added.parentElement).parentElement
                                  ).querySelector(".r2"),
                                  HTMLElement
                                ).click();
                              }
                            });
                          }
                        }
                      }
                      if (added.parentElement?.parentElement?.querySelector(".r1")?.innerHTML.toLowerCase() !== "data-cb-apply" && added.parentElement?.parentElement?.querySelector(".r1")?.innerHTML.toLowerCase() !== "data-cb-func" && added.parentElement?.parentElement?.querySelector(".r1")?.innerHTML.indexOf("data-cb-") !== -1) {
                        const cell = INSTANCE.tsCheck(
                          DEFINED.tsCheck(
                            DEFINED.tsCheck(added.parentElement).parentElement
                          ).querySelector(".r2"),
                          HTMLElement
                        );
                        const currentFunctionalityParameterInput = cell.querySelector("input");
                        let bound = false;
                        currentFunctionalityParameterInput?.addEventListener("keydown", (event2) => {
                          const keyboardEvent = INSTANCE.tsCheck(event2, KeyboardEvent);
                          if (keyboardEvent.altKey && (keyboardEvent.key === "x" || keyboardEvent.key === "X")) {
                            const attributePanel = INSTANCE.tsCheck(
                              document.querySelector('[ data-panel-id ="attributes"]'),
                              HTMLElement
                            );
                            attributePanelForcedToEnlarge = attributePanel.style.position !== "fixed";
                            attributePanel.style.position = attributePanel.style.position === "fixed" ? "relative" : "fixed";
                            attributePanel.style.zIndex = attributePanel.style.position === "fixed" ? "1001" : "0";
                            attributePanel.style.left = attributePanel.style.position === "fixed" ? "10vh" : "";
                            attributePanel.style.top = attributePanel.style.position === "fixed" ? "10vw" : "";
                            attributePanel.style.width = attributePanel.style.position === "fixed" ? "80vw" : "";
                            attributePanel.style.height = attributePanel.style.position === "fixed" ? "fit-content" : "";
                            attributePanel.style.boxShadow = attributePanel.style.position === "fixed" ? "0 0 1em darkorange" : "";
                            attributePanel.style.borderRadius = attributePanel.style.position === "fixed" ? ".5em" : "";
                            attributePanel.style.borderColor = attributePanel.style.position === "fixed" ? "black" : "";
                            attributePanel.style.transition = attributePanel.style.position === "fixed" ? "1s all" : "";
                            attributePanel.style.border = attributePanel.style.position === "fixed" ? "solid" : "";
                          }
                          if (keyboardEvent.altKey && keyboardEvent.key.toLowerCase() === "e") {
                            keyboardEvent.preventDefault();
                            keyboardEvent.stopImmediatePropagation();
                            keyboardEvent.stopPropagation();
                            epManager.mode = "SV";
                            epManager.mode = "EP";
                            INSTANCE.tsCheck(
                              document.querySelector('div[is = "xc-epmanager"]'),
                              HTMLElement
                            ).setAttribute(
                              "epoptions",
                              JSON.parse(window.CodbiPluginData.fslElementplaceholder).map((file) => {
                                return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
                              }).join(",")
                            );
                            if (cDetails.querySelector("object") === null) {
                              cDetails.innerHTML = "<object style = 'width : 100% ; height: 100% ;'></object>";
                            }
                            DEFINED.tsCheck(cDetails.querySelector("object")).setAttribute(
                              "data",
                              `${window.CodbiPluginData.docsAPI[currentLanguage] === void 0 ? window.CodbiPluginData.docsAPI.en : window.CodbiPluginData.docsAPI[currentLanguage]}${window.CodbiPluginData.detElementplaceholder[epManager.currentOption]?.Description}`
                            );
                            epManager.enabled = true;
                            epManager.enteringEP = true;
                            cDetails.style.display = "block";
                            updateLayoutEPManager(cell);
                            updateLayoutCDetails(epManager);
                            if (!bound && event2.target !== null) {
                              bound = true;
                              epManager.target = INSTANCE.tsCheck(event2.target, HTMLInputElement);
                            }
                          }
                        });
                        currentFunctionalityParameterInput?.addEventListener("blur", (event2) => {
                          if (attributePanelForcedToEnlarge) {
                            const attributePanel = INSTANCE.tsCheck(
                              document.querySelector('[ data-panel-id ="attributes"]'),
                              HTMLElement
                            );
                            attributePanelForcedToEnlarge = false;
                            attributePanel.style.position = "relative";
                            attributePanel.style.zIndex = "0";
                            attributePanel.style.left = "";
                            attributePanel.style.top = "";
                            attributePanel.style.width = "";
                            attributePanel.style.height = "";
                            attributePanel.style.boxShadow = "";
                            attributePanel.style.borderRadius = "";
                            attributePanel.style.borderColor = "";
                            attributePanel.style.border = "";
                            attributePanel.style.transition = "";
                          }
                          if (!flagMouseOverCDetails) {
                            epManager.enabled = false;
                            cDetails.style.display = "none";
                          } else {
                            currentCDetailBlurAction = () => {
                              epManager.enabled = false;
                              cDetails.style.display = "none";
                            };
                          }
                        });
                      }
                    }
                  }
                }
              }
            });
            paramCellObserver.observe(
              INSTANCE.tsCheck(
                document.querySelector('[id="tabsRight:extendedTab"] .xm-editor-panel'),
                HTMLElement
              ),
              {
                childList: true,
                subtree: true
              }
            );
            if (attributesEditorProcessed) {
              return;
            }
            attributesEditorProcessed = true;
            const registeredCells = new Array();
            const observer = new MutationObserver((mutationsList, observer2) => {
              for (const mutation of mutationsList) {
                if (mutation.type === "childList") {
                  for (const added of mutation.addedNodes) {
                    const addedHTMLElement = INSTANCE.tsCheck(added, HTMLElement);
                    if (addedHTMLElement.classList.contains("slick-row")) {
                      const cell = INSTANCE.tsCheck(addedHTMLElement.querySelector(".r2"), HTMLElement);
                      cell.addEventListener("keydown", (event2) => {
                        if (event2.key !== ",") {
                          if (event2.key !== "Tab" && keystrokeBlockingStart && keystrokeBlockingStart.getTime() + 1e3 >= (/* @__PURE__ */ new Date()).getTime()) {
                            event2.preventDefault();
                            event2.stopImmediatePropagation();
                            event2.stopPropagation();
                          }
                        } else {
                          keystrokeBlockingStart = void 0;
                        }
                      });
                      const cellObserver = new MutationObserver((mutationsList2, observer3) => {
                        for (const mutation2 of mutationsList2) {
                          if (mutation2.type === "childList") {
                            for (const added2 of mutation2.addedNodes) {
                              if (INSTANCE.tsCheck(
                                DEFINED.tsCheck(
                                  DEFINED.tsCheck(added2.parentElement).parentElement
                                ).querySelector(".r1"),
                                HTMLElement
                              ).innerHTML.toLowerCase() === "data-cb-func") {
                                if (addedHTMLElement.classList) {
                                  if (addedHTMLElement.classList.contains("editor-text")) {
                                    if (!epManager.enabled) {
                                      epManager.enabled = true;
                                    }
                                    if (cDetails.style.display !== "block") {
                                      cDetails.style.display = "block";
                                    }
                                  }
                                }
                              }
                              addedHTMLElement.addEventListener("blur", (event2) => {
                                if (!flagMouseOverCDetails) {
                                  epManager.enabled = false;
                                  cDetails.style.display = "none";
                                } else {
                                  currentCDetailBlurAction = () => {
                                    epManager.enabled = false;
                                    cDetails.style.display = "none";
                                  };
                                }
                              });
                            }
                          }
                        }
                      });
                      cellObserver.observe(cell, {
                        childList: true
                      });
                      if (registeredCells.includes(cell)) {
                        continue;
                      }
                      registeredCells.push(cell);
                      if (INSTANCE.tsCheck(
                        DEFINED.tsCheck(cell.parentElement).querySelector(".r1"),
                        HTMLElement
                      ).innerHTML.toLowerCase() === "data-cb-func") {
                        const currentFunctionalityInput = cell.querySelector("input");
                        if (currentFunctionalityInput !== null) {
                          currentFunctionalityInput.addEventListener("blur", () => {
                            if (!flagMouseOverCDetails) {
                              epManager.enabled = false;
                              cDetails.style.display = "none";
                            } else {
                              currentCDetailBlurAction = () => {
                                epManager.enabled = false;
                                cDetails.style.display = "none";
                              };
                            }
                          });
                          currentFunctionalityInput.addEventListener("keydown", (event2) => {
                            if (event2.key === "Escape") {
                              event2.preventDefault();
                              event2.stopPropagation();
                              event2.stopImmediatePropagation();
                              epManager.enabled = false;
                              cDetails.style.display = "none";
                              return;
                            }
                          });
                          INSTANCE.tsCheck(
                            document.querySelector('div[is = "xc-epmanager"]'),
                            HTMLElement
                          ).setAttribute(
                            "options",
                            JSON.parse(window.CodbiPluginData.fslFunctionalities).map((file) => {
                              return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
                            }).join(",")
                          );
                          epManager.mode = "SV";
                          epManager.target = currentFunctionalityInput;
                          epManager.enabled = true;
                          cDetails.style.display = "block";
                          updateLayoutEPManager(cell);
                          updateLayoutCDetails(epManager);
                        }
                      }
                      epManager.onOptionChanged.push((newOption) => {
                        if (newOption === "") {
                          return;
                        }
                        const description = DEFINED.tsCheck(
                          window.CodbiPluginData[epManager.mode === "SV" ? "detFunctionalities" : "detElementplaceholder"][newOption.replace(".js", "").toLowerCase()]?.Description
                        );
                        if (description[0] === "/") {
                          cDetails.innerHTML = `<object data = '${baseDocURL}${description}' style = 'width : 100% ; height : 100% ; opacity : .8 ;'></object>`;
                        } else {
                          cDetails.innerHTML = `
                            <div style = "width: 100% ; height: 100% ; overflow : auto ;">
                              ${description}</div>`;
                        }
                        cDetails.style.display = "block";
                      });
                    }
                  }
                }
              }
            });
            observer.observe(
              INSTANCE.tsCheck(
                document.querySelector('[id="tabsRight:extendedTab"] .grid-canvas'),
                HTMLElement
              ),
              {
                childList: true
              }
            );
          });
        }
      } else {
        console.info(
          "Unable to register <XC-EPManager> & <XC-OptionInput>. Functionalities have to be specified manually."
        );
      }
    });
  }

  // src/js/MultiSelect.ts
  var import_fc_form_designer3 = __toESM(require_fc_form_designer(), 1);
  var MultiSelectType = "com.github.xima_formcycle_entwicklerkreis.fc.plugin:fc-plugin-codbi:MultiSelect";
  var MultiSelect = class extends import_fc_form_designer3.Editors.BaseEditor {
    /**
     * Creates a new {@link MultiSelect } by retrieving the available options from
     * {@link window..CodbiPluginData.fileListing } and generating an appropriate {@link HTMLInputElement } for each
     * entry there. Each {@link HTMLInputElement } will trigger a **set-property** from {@link Callbacks } when
     * clicked.
     *
     * @param config - Configuration for this editor. */
    constructor(config) {
      super(config, "", "text");
      window.CodbiPluginData.populateStandards = this.populateStandards.bind(this);
      this._element = document.createElement("div");
      this._element.setAttribute("id", "CodBi_Standardslisting");
      this.populateStandards();
    }
    /** Populates the listing of standards. */
    populateStandards() {
      const listing = JSON.parse(window.CodbiPluginData.fileListing).map((file) => {
        return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
      });
      const bufValue = this.getValue();
      this._element.innerHTML = "";
      this._element.style.whiteSpace = "nowrap";
      this._element.style.overflowX = "auto";
      for (const configuration of listing) {
        const newElement = document.createElement("input");
        const newLabel = document.createElement("label");
        newElement.setAttribute("id", `CodBi-StandardConfigSelector_${configuration}`);
        newElement.setAttribute("type", "checkbox");
        newElement.setAttribute("value", configuration);
        newElement.addEventListener("click", (event) => {
          import_fc_form_designer3.Callbacks["set-property"].fire(this.config.property, this.getValue(), this);
          DEFINED.tsCheck(window.CodbiPluginData.detStandards[configuration]).Active = INSTANCE.tsCheck(
            event.target,
            HTMLInputElement
          ).checked;
        });
        newLabel.setAttribute("for", `CodBi-StandardConfigSelector_${configuration}`);
        newLabel.innerHTML = `${configuration}</br>`;
        this._element.appendChild(newElement);
        this._element.appendChild(newLabel);
      }
      this.setValue(bufValue);
    }
    /** See {@link Editors.BaseEditor }'s **getElement**. */
    getElement() {
      return (0, import_fc_form_designer3.$)(this._element);
    }
    /**
     * Generates a CSV of all selected standard configurations.
     *
     * @returns A CSV of all selected standard configurations. */
    getValue() {
      const result = [];
      for (const current of this._element.querySelectorAll("input")) {
        if (current.checked) {
          result.push(current.value);
        }
      }
      return result.join();
    }
    /**
     * Clears all selections prior to setting the selected configurations according to the received **data**.
     *
     * @param data See {@link Editors.BaseEditor }'s **setValue**. */
    setValue(data) {
      for (const element of this._element.querySelectorAll("input")) {
        element.checked = false;
      }
      for (const detail in window.CodbiPluginData.detStandards) {
        DEFINED.tsCheck(window.CodbiPluginData.detStandards[detail]).Active = false;
      }
      for (const standard of parseString(data).split(",")) {
        const element = this._element.querySelector(`[value="${standard.trim()}"]`);
        if (element instanceof HTMLInputElement) {
          element.checked = true;
        }
        if (window.CodbiPluginData.detStandards[standard]) {
          DEFINED.tsCheck(window.CodbiPluginData.detStandards[standard]).Active = true;
        }
      }
    }
  };

  // src/js/register-customElements.ts
  function registerCustomElements() {
    (0, import_fc_form_designer4.registerCustomEditor)(MultiSelectType, MultiSelect);
    enableLocalDocInterface();
  }

  // src/js/register-custom-form-categories.ts
  var import_fc_form_designer6 = __toESM(require_fc_form_designer(), 1);

  // ../common/src/js/codbi-config-template.ts
  var CodbiConfigTemplate = {
    "default": "default",
    "xtensible": "xtensible"
  };

  // ../common/src/js/constants.ts
  var Constants = {
    "apiDoc.dialog.input.label.prefix": "codbi-prop-apiDoc-dialog-input-label-prefix",
    "designer.category.codbi_panel": "codbi-cat-main",
    "designer.category.codbi_panel.help": "https://github.com/XIMA-formcycle-Entwicklerkreis/CodBi-Dev",
    "designer.property.config_template": "codbi-prop-config-template",
    "designer.property.config_template.default": "default",
    "designer.property.enable_codbi": "codbi-prop-enable",
    "designer.property.enable_codbi.default": "0",
    "designer.property.standards": "codbi-prop-standards",
    "designer.property.standards.default": "Holistic.CSS.Standard",
    "plugin.form_designer_resource.id": "com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.CodbiFormDesignerResource",
    "plugin.form_properties_extension.id": "com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.CodbiFormPropertiesExtension",
    "plugin.form_render_callback.id": "com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.CodbiFormRenderCallback",
    "plugin.form_resources.id": "com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.CodbiFormResources",
    "plugin.key": "f140090d-d471-4650-8fef-8067e1e1dcdd",
    "resource_path.base": "/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/",
    "resource_path.bundle": "/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/i18n",
    "resource_path.codbi_config_template_script": "/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/config-template-%s.js",
    "resource_path.codbi_css": "/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi.css",
    "resource_path.codbi_script": "/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi.js",
    "resource_path.designer_frame_css": "/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/designer-frame.css",
    "resource_path.designer_script": "/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/designer.js"
  };

  // ../common/src/js/localization.ts
  var Messages = {
    "de": {
      "apiDoc.dialog.input.label.prefix": "Geben Sie den Namen",
      "designer.category.codbi_panel": "CodBi",
      "designer.property.config_template": "Konfig-Template",
      "designer.property.config_template.option.default": "Standard",
      "designer.property.config_template.option.xtensible": "XTensible",
      "designer.property.enable_codbi": "CodBi aktiviert",
      "designer.property.standards": "Standard Konfigurationen",
      "form.test_string": "test-de",
      "plugin.form_designer_resource.desc": "Stellt Oberfl\xE4che zum Bearbeiten der zus\xE4tzliche Eigenschaften f\xFCr die Code-Bibliothek im Formular-Tab des Formular-Designers bereit.",
      "plugin.form_designer_resource.name": "Formular-Designer-Ressource",
      "plugin.form_properties_extension.desc": "Macht neue Formulareigenschaften zur Konfiguration der Code-Bibliothek bekannt.",
      "plugin.form_properties_extension.name": "Formular-Eigenschaften-Erweiterung",
      "plugin.form_render_callback.desc": "Modifiziert das Formular-Rendering, um die Code-Bibliothek zu integrieren.",
      "plugin.form_render_callback.name": "Formular-Render-Callback",
      "plugin.form_resources.desc": "Stellt die Frontend-Ressourcen der Code-Bibliothek bereit.",
      "plugin.form_resources.name": "Formular-Ressourcen"
    },
    "en": {
      "apiDoc.dialog.input.label.prefix": "Geben Sie den Namen",
      "designer.category.codbi_panel": "CodBi",
      "designer.property.config_template": "Config template",
      "designer.property.config_template.option.default": "Default",
      "designer.property.config_template.option.xtensible": "XTensible",
      "designer.property.enable_codbi": "CodBi enabled",
      "designer.property.standards": "Standard Configurations",
      "form.test_string": "test-en",
      "plugin.form_designer_resource.desc": "Provides a UI for editing the additional properties of the code library in the form tab of the form designer.",
      "plugin.form_designer_resource.name": "Form designer resource",
      "plugin.form_properties_extension.desc": "Registers new form properties for configuring the code library.",
      "plugin.form_properties_extension.name": "Form properties extension",
      "plugin.form_render_callback.desc": "Adjusts rendered forms to integrate the code library.",
      "plugin.form_render_callback.name": "Form render callback",
      "plugin.form_resources.desc": "Provides the frontend resources for the code library.",
      "plugin.form_resources.name": "Form resources"
    }
  };

  // ../common/src/js/messages.ts
  function parseLang(lang) {
    return lang in Messages ? lang : "en";
  }
  function pluginMessage(lang, key) {
    const actualLang = parseLang(lang);
    const messages = Messages[actualLang];
    return messages[key] ?? `?${key}?`;
  }

  // src/js/i18n.ts
  var import_fc_form_designer5 = __toESM(require_fc_form_designer(), 1);
  function i18n(key) {
    return pluginMessage((0, import_fc_form_designer5.getLanguage)(), key);
  }

  // src/js/register-custom-form-categories.ts
  function registerCustomFormCategories() {
    (0, import_fc_form_designer6.registerCustomFormCategory)(
      {
        id: Constants["designer.category.codbi_panel"],
        label: i18n("designer.category.codbi_panel"),
        help: { type: "url", url: Constants["designer.category.codbi_panel.help"] }
      },
      (cats) => firstIndex(cats, (cat) => cat.id === "formSeo") ?? 2
    );
  }

  // src/js/register-custom-form-properties.ts
  var import_fc_form_designer7 = __toESM(require_fc_form_designer(), 1);
  var WhenCodBiEnabled = {
    dependencies: [Constants["designer.property.enable_codbi"]],
    test: (params) => parseBoolean(params.values[Constants["designer.property.enable_codbi"]])
  };
  function registerCustomFormProperties() {
    (0, import_fc_form_designer7.registerCustomFormProperty)({
      editor: "CheckboxEditor",
      cat: Constants["designer.category.codbi_panel"],
      property: Constants["designer.property.enable_codbi"],
      label: i18n("designer.property.enable_codbi")
    });
    (0, import_fc_form_designer7.registerCustomFormProperty)({
      editor: "SelectEditor",
      cat: Constants["designer.category.codbi_panel"],
      property: Constants["designer.property.config_template"],
      label: i18n("designer.property.config_template"),
      options: recordValues(CodbiConfigTemplate).map((configTemplateName) => ({
        text: i18n(`designer.property.config_template.option.${configTemplateName}`),
        value: configTemplateName
      })),
      availableIf: WhenCodBiEnabled
    });
    (0, import_fc_form_designer7.registerCustomFormProperty)({
      editor: MultiSelectType,
      cat: Constants["designer.category.codbi_panel"],
      property: Constants["designer.property.standards"],
      label: i18n("designer.property.standards"),
      availableIf: WhenCodBiEnabled
    });
  }

  // src/index.ts
  registerCustomFormCategories();
  registerCustomFormProperties();
  registerCustomElements();
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL25vZGVfbW9kdWxlcy9AZGUteGltYS9mYy1mb3JtLWRlc2lnbmVyL2luZGV4LmpzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3dlYi9wYWNrYWdlcy9kZXNpZ25lci9zcmMvanMvcmVnaXN0ZXItY3VzdG9tRWxlbWVudHMudHMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL3BhY2thZ2VzL2Rlc2lnbmVyL3NyYy9qcy9Mb2NhbERvY0ludGVyZmFjZS50cyIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi93ZWIvbm9kZV9tb2R1bGVzL3hkYmMvc3JjL0RCQy50cyIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi93ZWIvbm9kZV9tb2R1bGVzL3hkYmMvc3JjL0RCQy9ERUZJTkVELnRzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3dlYi9ub2RlX21vZHVsZXMveGRiYy9zcmMvREJDL0lOU1RBTkNFLnRzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3dlYi9ub2RlX21vZHVsZXMveGRiYy9zcmMvREJDL09SLnRzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3dlYi9ub2RlX21vZHVsZXMveGRiYy9zcmMvREJDL0VRLnRzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3dlYi9ub2RlX21vZHVsZXMveGRiYy9zcmMvREJDL0lGLnRzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3dlYi9ub2RlX21vZHVsZXMveGRiYy9zcmMvREJDL1JFR0VYLnRzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3dlYi9ub2RlX21vZHVsZXMveGRiYy9zcmMvREJDL0hhc0F0dHJpYnV0ZS50cyIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi93ZWIvbm9kZV9tb2R1bGVzL0BkZS14aW1hL3hpbWEtY29tbW9uLWpzLWxhbmcvc3JjL3R5cGUtZ3VhcmQudHMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL25vZGVfbW9kdWxlcy9AZGUteGltYS94aW1hLWNvbW1vbi1qcy1sYW5nL3NyYy9lbnZpcm9ubWVudC50cyIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi93ZWIvbm9kZV9tb2R1bGVzL0BkZS14aW1hL3hpbWEtY29tbW9uLWpzLWxhbmcvc3JjL2NvZXJjaW9uLnRzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3dlYi9ub2RlX21vZHVsZXMvQGRlLXhpbWEveGltYS1jb21tb24tanMtbGFuZy9zcmMvaXRlcmFibGUudHMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL25vZGVfbW9kdWxlcy9AZGUteGltYS94aW1hLWNvbW1vbi1qcy1sYW5nL3NyYy9jb2xsZWN0aW9uLnRzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3dlYi9ub2RlX21vZHVsZXMvQGRlLXhpbWEveGltYS1jb21tb24tanMtbGFuZy9zcmMvcmVkdWNlci50cyIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi93ZWIvbm9kZV9tb2R1bGVzL0BkZS14aW1hL3hpbWEtY29tbW9uLWpzLWxhbmcvc3JjL2Z1bmN0aW9uLnRzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3dlYi9ub2RlX21vZHVsZXMvQGRlLXhpbWEveGltYS1jb21tb24tanMtbGFuZy9zcmMvcmVjb3JkLnRzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3dlYi9ub2RlX21vZHVsZXMvQGRlLXhpbWEveGltYS1jb21tb24tanMtbGFuZy9zcmMvd2Vhay1jb2xsZWN0aW9uLnRzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3dlYi9ub2RlX21vZHVsZXMvQGRlLXhpbWEveGltYS1jb21tb24tanMtZG9tL3NyYy9kb20tc2VhcmNoLnRzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3dlYi9ub2RlX21vZHVsZXMvQGRlLXhpbWEveGltYS1jb21tb24tanMtZG9tL3NyYy9lbGVtZW50LnRzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3dlYi9wYWNrYWdlcy9kZXNpZ25lci9zcmMvanMvT3B0aW9uSW5wdXQudHMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL3BhY2thZ2VzL2Rlc2lnbmVyL3NyYy9qcy9TVk1hbmFnZXIudHMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL3BhY2thZ2VzL2Rlc2lnbmVyL3NyYy9qcy9FUE1hbmFnZXIudHMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL3BhY2thZ2VzL2Rlc2lnbmVyL3NyYy9qcy9NdWx0aVNlbGVjdC50cyIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi93ZWIvcGFja2FnZXMvZGVzaWduZXIvc3JjL2pzL3JlZ2lzdGVyLWN1c3RvbS1mb3JtLWNhdGVnb3JpZXMudHMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL3BhY2thZ2VzL2NvbW1vbi9zcmMvanMvY29kYmktY29uZmlnLXRlbXBsYXRlLnRzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3dlYi9wYWNrYWdlcy9jb21tb24vc3JjL2pzL2NvbnN0YW50cy50cyIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi93ZWIvcGFja2FnZXMvY29tbW9uL3NyYy9qcy9sb2NhbGl6YXRpb24udHMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL3BhY2thZ2VzL2NvbW1vbi9zcmMvanMvbWVzc2FnZXMudHMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL3BhY2thZ2VzL2Rlc2lnbmVyL3NyYy9qcy9pMThuLnRzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3dlYi9wYWNrYWdlcy9kZXNpZ25lci9zcmMvanMvcmVnaXN0ZXItY3VzdG9tLWZvcm0tcHJvcGVydGllcy50cyIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi93ZWIvcGFja2FnZXMvZGVzaWduZXIvc3JjL2luZGV4LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpZiAodHlwZW9mIERlc2lnbmVyICE9PSBcIm9iamVjdFwiKSB7XG4gIHRocm93IG5ldyBFcnJvcihcbiAgICBbXG4gICAgICBcImZjLWZvcm0tZGVzaWduZXIgaXMgbm90IGF2YWlsYWJsZVwiLFxuICAgICAgXCJUaGlzIG1vZHVsZSBvbmx5IGNvbnRhaW5zIHR5cGUgZGVjbGFyYXRpb24gZmlsZXMgYW5kIG5vIGltcGxlbWVudGF0aW9uLlwiLFxuICAgICAgXCJUaGUgZGVjbGFyZWQgdHlwZXMgYXJlIGF2YWlsYWJsZSBvbmx5IHdpdGhpbiB0aGUgZm9ybSBkZXNpZ25lciBvZiB0aGUgWElNQSBGT1JNQ1lDTEUgYXBwbGljYXRpb24uXCIsXG4gICAgICBcIlNwZWNpZmljYWxseSwgdGhpcyBtb2R1bGUgZGVsZWdhdGVzIHRvIHRoZSBjb250ZW50cyBvZiB0aGUgZ2xvYmFsIHdpbmRvdy5EZXNpZ25lci5cIixcbiAgICAgIFwiT25seSB1c2UgdGhpcyBwYWNrYWdlIGFzIHBhcnQgb2YgdGhlIGNsaWVudCBzaWRlIHNjcmlwdCBmb3IgYSBmb3JtIGVsZW1lbnQgd2lkZ2V0IHBsdWdpbiAoSVBsdWdpbkZvcm1FbGVtZW50V2lkZ2V0KS5cIixcbiAgICBdLmpvaW4oXCJcXG5cIiksXG4gICk7XG59XG5cbk9iamVjdC5hc3NpZ24obW9kdWxlLmV4cG9ydHMsIERlc2lnbmVyKTtcbiIsICIvLyAjcmVnaW9uIEltcG9ydHNcbi8vICNyZWdpb24gWElNQVxuaW1wb3J0IHsgcmVnaXN0ZXJDdXN0b21FZGl0b3IgfSBmcm9tIFwiQGRlLXhpbWEvZmMtZm9ybS1kZXNpZ25lclwiO1xuLy8gI2VuZHJlZ2lvbiBYSU1BXG5pbXBvcnQgeyBlbmFibGVMb2NhbERvY0ludGVyZmFjZSB9IGZyb20gXCIuL0xvY2FsRG9jSW50ZXJmYWNlLmpzXCI7XG5pbXBvcnQgeyBNdWx0aVNlbGVjdCwgTXVsdGlTZWxlY3RUeXBlIH0gZnJvbSBcIi4vTXVsdGlTZWxlY3RcIjtcbi8vICNlbmRyZWdpb24gSW1wb3J0c1xuLyoqIFJlZ2lzdGVycyB0aGUge0BsaW5rIE11bHRpU2VsZWN0IH0tRWRpdG9yIHZpYSB7QGxpbmsgcmVnaXN0ZXJDdXN0b21FZGl0b3IgfS4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckN1c3RvbUVsZW1lbnRzKCk6IHZvaWQge1xuICByZWdpc3RlckN1c3RvbUVkaXRvcihNdWx0aVNlbGVjdFR5cGUsIE11bHRpU2VsZWN0KTtcbiAgZW5hYmxlTG9jYWxEb2NJbnRlcmZhY2UoKTtcbn1cbiIsICIvLyAjcmVnaW9uIEltcG9ydHNcbi8vICNyZWdpb24gWElNQVxuaW1wb3J0IHsgZ2V0SlF1ZXJ5IH0gZnJvbSBcIkBkZS14aW1hL2ZjLWZvcm0tZGVzaWduZXJcIjtcbi8vICNlbmRyZWdpb24gWElNQVxuLy8gI3JlZ2lvbiBYREJDXG5pbXBvcnQgeyBERUZJTkVEIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9ERUZJTkVEXCI7XG5pbXBvcnQgeyBJTlNUQU5DRSB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvSU5TVEFOQ0VcIjtcbi8vICNlbmRyZWdpb24gWERCQ1xuaW1wb3J0IHsgT3B0aW9uaW5wdXQgfSBmcm9tIFwiLi9PcHRpb25JbnB1dC5qc1wiO1xuaW1wb3J0IHsgU1ZNYW5hZ2VyIH0gZnJvbSBcIi4vU1ZNYW5hZ2VyLmpzXCI7XG5pbXBvcnQgeyBFUE1hbmFnZXIgfSBmcm9tIFwiLi9FUE1hbmFnZXIuanNcIjtcbi8vICNlbmRyZWdpb24gSW1wb3J0c1xuLy8gI3JlZ2lvbiBIZWxwZXJcbi8qKlxuICogRGV0ZXJtaW5lcyB0aGUgc2l6ZSBpbiBwaXhlbHMgb2Ygb25lIEVNIHdpdGhpbiB0aGUgY29udGV4dCBvZiB0aGUgc3BlY2lmaWVkICoqZWxlbWVudCoqLlxuICpcbiAqIEBwYXJhbSBlbGVtZW50IFRoZSB7QGxpbmsgSFRNTEVsZW1lbnQgfSB3aGljaCdzICBjb3JyZXNwb25kaW5nIEVNIHNoYWxsIGJlIGNhbGN1bGF0ZWQuXG4gKlxuICogQHJldHVybnMgVGhlIHJlcXVlc3RlZCBFTSBpbiBwaXhlbHMuICovXG5mdW5jdGlvbiBnZXRFbVNpemVJblBpeGVscyhlbGVtZW50OiBFbGVtZW50KSB7XG4gIGNvbnN0IGNvbXB1dGVkU3R5bGVzID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbWVudCk7XG4gIGNvbnN0IGZvbnRTaXplU3RyaW5nID0gY29tcHV0ZWRTdHlsZXMuZ2V0UHJvcGVydHlWYWx1ZShcImZvbnQtc2l6ZVwiKTtcbiAgY29uc3QgcmVzdWx0ID0gTnVtYmVyLnBhcnNlRmxvYXQoZm9udFNpemVTdHJpbmcpO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG4vKipcbiAqIEluc2VydHMgdGhlIHtAbGluayBzdHJpbmcgfSAqKnRvSW5zZXJ0KiogaW50byB0aGUgc3BlY2lmaWVkIHtAbGluayBIVE1MVGV4dEFyZWFFbGVtZW50IH0uXG4gKlxuICogQHBhcmFtIGludG8gICAgICBUaGUge0BsaW5rIEhUTUxUZXh0QXJlYUVsZW1lbnQgfSB0byBpbnNlcnQgdGhlIHtAbGluayBzdHJpbmcgfSAqKnRvSW5zZXJ0KiogdG8uXG4gKiBAcGFyYW0gdG9JbnNlcnQgIFRoZSB7QGxpbmsgc3RyaW5nIH0gdG8gaW5zZXJ0IGludG8gdGhlIHNwZWNpZmllZCB7QGxpbmsgSFRNTFRleHRBcmVhRWxlbWVudCB9LiAqL1xuZnVuY3Rpb24gaW5zZXJ0VGV4dChpbnRvOiBIVE1MVGV4dEFyZWFFbGVtZW50LCB0b0luc2VydDogc3RyaW5nKSB7XG4gIGNvbnN0IHN0YXJ0ID0gaW50by5zZWxlY3Rpb25TdGFydDtcbiAgY29uc3QgZW5kID0gaW50by5zZWxlY3Rpb25FbmQ7XG4gIGNvbnN0IHZhbHVlID0gaW50by52YWx1ZTtcblxuICBpbnRvLnZhbHVlID0gdmFsdWUuc3Vic3RyaW5nKDAsIHN0YXJ0KSArIHRvSW5zZXJ0ICsgdmFsdWUuc3Vic3RyaW5nKGVuZCk7XG5cbiAgaW50by5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcImlucHV0XCIsIHsgYnViYmxlczogdHJ1ZSB9KSk7XG59XG4vLyAjZW5kcmVnaW9uIEhlbHBlclxuZXhwb3J0IGZ1bmN0aW9uIGVuYWJsZUxvY2FsRG9jSW50ZXJmYWNlKCk6IHZvaWQge1xuICBsZXQgY29kYmlUb2dnbGU6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkO1xuXG4gIGlmICh3aW5kb3cuQ29kYmlQbHVnaW5EYXRhID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgKCkgPT4ge1xuICAgIGNvbnN0IGJhc2VVUkw6IHN0cmluZyA9IGAke3dpbmRvdy5sb2NhdGlvbi5ocmVmLnNwbGl0KFwiL1wiKS5zbGljZSgwLCA0KS5qb2luKFwiL1wiKX0vYDsgLy8gVVJMIHdlJ3JlIGNvbWluZyBmcm9tLlxuICAgIGNvbnN0IHBhcmVudFdpbmRvd3M6IFdpbmRvd1tdID0gd2luZG93LnBhcmVudCBhcyB1bmtub3duIGFzIFdpbmRvd1tdO1xuICAgIC8vIFNwZWNpZmllcyB3aGV0aGVyIHRoZSBhdHRyaWJ1dGUgcGFuZWwgaXMgY3VycmVudGx5IGJlaW5nIGZvcmNlZCB0byBiZSBlbmxhcmdlZCBvciBub3QuXG4gICAgbGV0IGF0dHJpYnV0ZVBhbmVsRm9yY2VkVG9FbmxhcmdlID0gZmFsc2U7XG4gICAgLy8gI3JlZ2lvbiBEZXRlcm1pbmUgY3VycmVudCBsYW5ndWFnZS5cbiAgICBsZXQgY3VycmVudExhbmd1YWdlOiBzdHJpbmcgPSBcImRlXCI7XG5cbiAgICBpZiAocGFyZW50V2luZG93cy5sZW5ndGggPiAwKSB7XG4gICAgICBjdXJyZW50TGFuZ3VhZ2UgPSBwYXJlbnRXaW5kb3dzWzBdPy5YRkNfTUVUQURBVEEuY3VycmVudExhbmd1YWdlIHx8IFwiZGVcIjtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvbiBEZXRlcm1pbmUgY3VycmVudCBsYW5ndWFnZS5cbiAgICAvLyBJbml0aWF0ZSBpZiBldmVyeSBuZWVkZWQgY29tcG9uZW50IGlzIGZpbmUgb25seS4uLlxuICAgIGlmIChTVk1hbmFnZXIucmVnaXN0ZXJlZCAmJiBFUE1hbmFnZXIucmVnaXN0ZXJlZCkge1xuICAgICAgY29uc3QgYmFzZURvY1VSTCA9XG4gICAgICAgIHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZG9jc0FQSVtjdXJyZW50TGFuZ3VhZ2VdID09PSB1bmRlZmluZWRcbiAgICAgICAgICA/IHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZG9jc0FQSS5lblxuICAgICAgICAgIDogd2luZG93LkNvZGJpUGx1Z2luRGF0YS5kb2NzQVBJW2N1cnJlbnRMYW5ndWFnZV07XG4gICAgICAvLyAjcmVnaW9uIERlZmluZSBGbGFnIGZvciBLZXlzdHJva2UgYmxvY2tpbmdcbiAgICAgIGxldCBrZXlzdHJva2VCbG9ja2luZ1N0YXJ0OiBEYXRlIHwgdW5kZWZpbmVkID0gbmV3IERhdGUoKTtcbiAgICAgIC8vICNlbmRyZWdpb24gRGVmaW5lIEZsYWcgZm9yIEtleXN0cm9rZSBibG9ja2luZ1xuICAgICAgLy8gI3JlZ2lvbiBJbmplY3QgPFhDLUVQTWFuYWdlcj4gJiA8WEMtT3B0aW9uSW5wdXQ+LlxuICAgICAgZG9jdW1lbnQuYm9keS5pbnNlcnRBZGphY2VudEhUTUwoXG4gICAgICAgIFwiYmVmb3JlZW5kXCIsXG4gICAgICAgIGA8c3R5bGU+XG4gICAgICAgICAgICAgICAgICAgICAgICAuQ29kQmlfUHJpbnRfUmVtb3ZlX1ByaW50T25seTphZnRlciB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IFwieFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nLWxlZnQ6IC41ZW07XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiB3aGl0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOnNvbGlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiBibGFjaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogLjVlbTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBvcGFjaXR5OiAwLjY7fVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zdHlsZT5cbiAgICAgICAgICA8ZGl2ICBpcyAgICAgICAgICA9IFwieGMtZXBtYW5hZ2VyXCJcbiAgICAgICAgICAgICAgICBvcHRpb25zICAgICA9IFwiJHtKU09OLnBhcnNlKHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZnNsRnVuY3Rpb25hbGl0aWVzKVxuICAgICAgICAgICAgICAgICAgLm1hcCgoZmlsZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWxlLmxhc3RJbmRleE9mKFwiLlwiKSAhPT0gLTEgPyBmaWxlLnN1YnN0cmluZygwLCBmaWxlLmxhc3RJbmRleE9mKFwiLlwiKSkgOiBmaWxlO1xuICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgIC5qb2luKFwiLFwiKX1cIlxuICAgICAgICAgICAgICAgIGVwb3B0aW9ucyAgPSBcIiR7SlNPTi5wYXJzZSh3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmZzbEVsZW1lbnRwbGFjZWhvbGRlcilcbiAgICAgICAgICAgICAgICAgIC5tYXAoKGZpbGU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmlsZS5sYXN0SW5kZXhPZihcIi5cIikgIT09IC0xID8gZmlsZS5zdWJzdHJpbmcoMCwgZmlsZS5sYXN0SW5kZXhPZihcIi5cIikpIDogZmlsZTtcbiAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAuam9pbihcIixcIil9XCI+PC9kaXY+XG4gICAgICAgICAgPGRpdiAgaXMgPSBcInhjLW9wdGlvbmlucHV0XCI+PC9kaXY+YCxcbiAgICAgICk7XG4gICAgICAvLyAjZW5kcmVnaW9uIEluamVjdCA8WEMtRVBNYW5hZ2VyPiAmIDxYQy1PcHRpb25JbnB1dD4uXG4gICAgICAvLyAjcmVnaW9uIEFjcXVpcmUgcmVmZXJlbmNlcyB0byA8WEMtRVBNYW5hZ2VyPiAmIDxYQy1PcHRpb25JbnB1dD4uXG4gICAgICBjb25zdCBlcE1hbmFnZXIgPSBJTlNUQU5DRS50c0NoZWNrPEVQTWFuYWdlcj4oZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZGl2W2lzPVwieGMtZXBtYW5hZ2VyXCJdJyksIEVQTWFuYWdlcik7XG4gICAgICBjb25zdCBvcHRpb25pbnB1dCA9IElOU1RBTkNFLnRzQ2hlY2s8T3B0aW9uaW5wdXQ+KFxuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdkaXZbaXM9XCJ4Yy1vcHRpb25pbnB1dFwiXScpLFxuICAgICAgICBPcHRpb25pbnB1dCxcbiAgICAgICk7XG4gICAgICAvLyAjZW5kcmVnaW9uIEFjcXVpcmUgcmVmZXJlbmNlcyB0byA8WEMtRVBNYW5hZ2VyPiAmIDxYQy1PcHRpb25JbnB1dD4uXG4gICAgICAvLyAjcmVnaW9uIEF0dGFjaCBldmVudCB0byBzZXQga2V5c3Ryb2tlIGJsb2NrZXIuXG4gICAgICBlcE1hbmFnZXIub25BdXRvY29tcGxldGUucHVzaCgoY29tcGxldGVkT3B0aW9uOiBzdHJpbmcpID0+IHtcbiAgICAgICAga2V5c3Ryb2tlQmxvY2tpbmdTdGFydCA9IG5ldyBEYXRlKCk7XG4gICAgICB9KTtcbiAgICAgIC8vICNlbmRyZWdpb24gQXR0YWNoIGV2ZW50IHRvIHNldCBrZXlzdHJva2UgYmxvY2tlci5cbiAgICAgIC8vICNyZWdpb24gUmVnaXN0ZXIgVGVtcGxhdGUtU2VsZWN0ZWQgSGFuZGxlclxuICAgICAgb3B0aW9uaW5wdXQub25PcHRpb25TZWxlY3RlZC5wdXNoKChzZWxlY3RlZE9wdGlvbjogc3RyaW5nKSA9PiB7XG4gICAgICAgIGlmIChvcHRpb25pbnB1dC5tb2RlID09PSBcIkNvZGUgVGVtcGxhdGVcIikge1xuICAgICAgICAgIHN3aXRjaCAoc2VsZWN0ZWRPcHRpb24pIHtcbiAgICAgICAgICAgIGNhc2Ugd2luZG93LkNvZGJpUGx1Z2luRGF0YS5yZXRyaWV2ZU1hbmFnZXJUcmFuc2xhdGVkUmVzb3VyY2UoXCJDb2RlVGVtcGxhdGVfT25Mb2FkZWRcIik6XG4gICAgICAgICAgICAgIGluc2VydFRleHQoXG4gICAgICAgICAgICAgICAgb3B0aW9uaW5wdXQudGFyZ2V0IGFzIHVua25vd24gYXMgSFRNTFRleHRBcmVhRWxlbWVudCxcbiAgICAgICAgICAgICAgICAnd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsIChldmVudCkgPT4ge30pOycsXG4gICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2Ugd2luZG93LkNvZGJpUGx1Z2luRGF0YS5yZXRyaWV2ZU1hbmFnZXJUcmFuc2xhdGVkUmVzb3VyY2UoXCJDb2RlVGVtcGxhdGVfRnVuY3Rpb25hbGl0eVwiKTpcbiAgICAgICAgICAgICAgaW5zZXJ0VGV4dChcbiAgICAgICAgICAgICAgICBvcHRpb25pbnB1dC50YXJnZXQgYXMgdW5rbm93biBhcyBIVE1MVGV4dEFyZWFFbGVtZW50LFxuICAgICAgICAgICAgICAgIGB3aW5kb3cuY29kYmkucmVnaXN0ZXJGdW5jdGlvbmFsaXR5KFwiJHt3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLnJldHJpZXZlTWFuYWdlclRyYW5zbGF0ZWRSZXNvdXJjZShcIkNvZGVUZW1wbGF0ZV9GdW5jdGlvbmFsaXR5X1BsYWNlaG9sZGVyXCIpfVwiLCggdG9Mb2FkLCB0b1Byb2Nlc3MgKSA9PiAge30pO2AsXG4gICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2Ugd2luZG93LkNvZGJpUGx1Z2luRGF0YS5yZXRyaWV2ZU1hbmFnZXJUcmFuc2xhdGVkUmVzb3VyY2UoXCJDb2RlVGVtcGxhdGVfRVBcIik6XG4gICAgICAgICAgICAgIGluc2VydFRleHQoXG4gICAgICAgICAgICAgICAgb3B0aW9uaW5wdXQudGFyZ2V0IGFzIHVua25vd24gYXMgSFRNTFRleHRBcmVhRWxlbWVudCxcbiAgICAgICAgICAgICAgICBgd2luZG93LmNvZGJpLnJlZ2lzdGVyRVAoXCIke3dpbmRvdy5Db2RiaVBsdWdpbkRhdGEucmV0cmlldmVNYW5hZ2VyVHJhbnNsYXRlZFJlc291cmNlKFwiQ29kZVRlbXBsYXRlX0VQX1BsYWNlaG9sZGVyXCIpfVwiLCggcGFyYW1zICkgPT4gIHt9KTtgLFxuICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEucmV0cmlldmVNYW5hZ2VyVHJhbnNsYXRlZFJlc291cmNlKFwiQ29kZVRlbXBsYXRlX1N0YW5kYXJkXCIpOlxuICAgICAgICAgICAgICBpbnNlcnRUZXh0KFxuICAgICAgICAgICAgICAgIG9wdGlvbmlucHV0LnRhcmdldCBhcyB1bmtub3duIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQsXG4gICAgICAgICAgICAgICAgYHdpbmRvdy5jb2RiaS5sb2FkQ29uZmlnKHsgdGFyZ2V0czogXCIke3dpbmRvdy5Db2RiaVBsdWdpbkRhdGEucmV0cmlldmVNYW5hZ2VyVHJhbnNsYXRlZFJlc291cmNlKFwiQ29kZVRlbXBsYXRlX1N0YW5kYXJkX1BsYWNlaG9sZGVyX1RhcmdldHNcIil9XCIsIEZVTkM6IFwiJHt3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLnJldHJpZXZlTWFuYWdlclRyYW5zbGF0ZWRSZXNvdXJjZShcIkNvZGVUZW1wbGF0ZV9TdGFuZGFyZF9QbGFjZWhvbGRlcl9GVU5DXCIpfVwifSk7YCxcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSB3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLnJldHJpZXZlTWFuYWdlclRyYW5zbGF0ZWRSZXNvdXJjZShcIkNvZGVUZW1wbGF0ZV9GdW5jdGlvbmFsaXR5X0V4dGVuZFwiKTpcbiAgICAgICAgICAgICAgaW5zZXJ0VGV4dChcbiAgICAgICAgICAgICAgICBvcHRpb25pbnB1dC50YXJnZXQgYXMgdW5rbm93biBhcyBIVE1MVGV4dEFyZWFFbGVtZW50LFxuICAgICAgICAgICAgICAgIGB3aW5kb3cuY29kYmkuZXh0ZW5kRnVuY3Rpb25hbGl0eShcIiR7d2luZG93LkNvZGJpUGx1Z2luRGF0YS5yZXRyaWV2ZU1hbmFnZXJUcmFuc2xhdGVkUmVzb3VyY2UoXCJDb2RlVGVtcGxhdGVfRnVuY3Rpb25hbGl0eV9FeHRlbmRfUGxhY2Vob2xkZXJcIil9XCIsKCB0b0xvYWQsIHRvUHJvY2VzcyApID0+ICB7fSk7YCxcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSB3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLnJldHJpZXZlTWFuYWdlclRyYW5zbGF0ZWRSZXNvdXJjZShcIkNvZGVUZW1wbGF0ZV9FUF9FeHRlbmRcIik6XG4gICAgICAgICAgICAgIGluc2VydFRleHQob3B0aW9uaW5wdXQudGFyZ2V0IGFzIHVua25vd24gYXMgSFRNTFRleHRBcmVhRWxlbWVudCwgXCJ3aW5kb3cuY29kYmkuY2hlY2tBdHRyaWJ1dGVzKCk7XCIpO1xuXG4gICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlIHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEucmV0cmlldmVNYW5hZ2VyVHJhbnNsYXRlZFJlc291cmNlKFwiQ29kZVRlbXBsYXRlX1N0YXJ0XCIpOlxuICAgICAgICAgICAgICBpbnNlcnRUZXh0KG9wdGlvbmlucHV0LnRhcmdldCBhcyB1bmtub3duIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQsIFwid2luZG93LmNvZGJpLmNoZWNrQXR0cmlidXRlcygpO1wiKTtcblxuICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgaW5zZXJ0VGV4dChvcHRpb25pbnB1dC50YXJnZXQgYXMgdW5rbm93biBhcyBIVE1MVGV4dEFyZWFFbGVtZW50LCBcIiEhIFVOS05PV04gU0VMRUNUSU9OICEhXCIpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG9wdGlvbmlucHV0LmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICAvLyAjZW5kcmVnaW9uIFJlZ2lzdGVyIFRlbXBsYXRlLVNlbGVjdGVkIEhhbmRsZXJcbiAgICAgIC8vICNyZWdpb24gRGVmaW5lIGhhbmRsZXIgZm9yIHRoZSA8WEMtT3B0aW9uSW5wdXQ+J3MgY2hhbmdlcyBpbiBvcHRpb24uXG4gICAgICBvcHRpb25pbnB1dC5vbkF1dG9jb21wbGV0ZS5wdXNoKChjb21wbGV0ZWRPcHRpb246IHN0cmluZykgPT4ge1xuICAgICAgICBpZiAob3B0aW9uaW5wdXQubW9kZSA9PT0gXCJGdW5jdGlvbmFsaXR5IFBhcmFtZXRlclwiKSB7XG4gICAgICAgICAgaWYgKGNvbXBsZXRlZE9wdGlvbi5pbmRleE9mKFwiL1wiKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIG9wdGlvbmlucHV0LnRhcmdldC52YWx1ZSA9IGBkYXRhLWNiLSR7Y29tcGxldGVkT3B0aW9uLnN1YnN0cmluZyhjb21wbGV0ZWRPcHRpb24uaW5kZXhPZihcIi9cIikgKyAxKS50cmltKCl9YDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3B0aW9uaW5wdXQudGFyZ2V0LnZhbHVlID0gY29tcGxldGVkT3B0aW9uO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNEZXRhaWxzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICBvcHRpb25pbnB1dC5lbmFibGVkID0gZmFsc2U7XG5cbiAgICAgICAgICBjb25zdCB2YWx1ZUNvbHVtbiA9IElOU1RBTkNFLnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KFxuICAgICAgICAgICAgb3B0aW9uaW5wdXQudGFyZ2V0LnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKFwiLnIyXCIpLFxuICAgICAgICAgICAgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgKTtcbiAgICAgICAgICAvLyAjcmVnaW9uIFByZXZlbnQga2V5c3Ryb2tlcyBmb3IgMjUwbXMgdG8gYXZvaWQgYWNjaWRlbnRhbGx5IHR5cGluZyBpbnRvIHRoZSBuZXh0IGZpZWxkLlxuICAgICAgICAgIGNvbnN0IGJsb2NrZXIgPSAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGtleWJvYXJkRXZlbnQgPSBJTlNUQU5DRS50c0NoZWNrPEtleWJvYXJkRXZlbnQ+KGV2ZW50LCBLZXlib2FyZEV2ZW50KTtcblxuICAgICAgICAgICAga2V5Ym9hcmRFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAga2V5Ym9hcmRFdmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGtleWJvYXJkRXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBibG9ja2VyKTtcbiAgICAgICAgICAgIH0sIDI1MCk7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGJsb2NrZXIpO1xuICAgICAgICAgIC8vICNlbmRyZWdpb24gUHJldmVudCBrZXlzdHJva2VzIGZvciAyNTBtcyB0byBhdm9pZCBhY2NpZGVudGFsbHkgdHlwaW5nIGludG8gdGhlIG5leHQgZmllbGQuXG4gICAgICAgICAgdmFsdWVDb2x1bW4uY2xpY2soKTtcblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvcHRpb25pbnB1dC5tb2RlID09PSBcIkdsb2JhbCBWYXJpYWJsZVwiKSB7XG4gICAgICAgICAgaWYgKGNvbXBsZXRlZE9wdGlvbi5pbmRleE9mKFwiW1wiKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIG9wdGlvbmlucHV0LnRhcmdldC52YWx1ZSA9IGNvbXBsZXRlZE9wdGlvbi5zdWJzdHJpbmcoY29tcGxldGVkT3B0aW9uLmluZGV4T2YoXCJdXCIpICsgMSkudHJpbSgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvcHRpb25pbnB1dC50YXJnZXQudmFsdWUgPSBjb21wbGV0ZWRPcHRpb247XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY0RldGFpbHMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgIG9wdGlvbmlucHV0LmVuYWJsZWQgPSBmYWxzZTtcblxuICAgICAgICAgIGNvbnN0IHZhbHVlQ29sdW1uID0gSU5TVEFOQ0UudHNDaGVjazxIVE1MRWxlbWVudD4oXG4gICAgICAgICAgICBvcHRpb25pbnB1dC50YXJnZXQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCIucjRcIiksXG4gICAgICAgICAgICBIVE1MRWxlbWVudCxcbiAgICAgICAgICApO1xuICAgICAgICAgIC8vICNyZWdpb24gUHJldmVudCBrZXlzdHJva2VzIGZvciAyNTBtcyB0byBhdm9pZCBhY2NpZGVudGFsbHkgdHlwaW5nIGludG8gdGhlIG5leHQgZmllbGQuXG4gICAgICAgICAgY29uc3QgYmxvY2tlciA9IChldmVudDogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qga2V5Ym9hcmRFdmVudCA9IElOU1RBTkNFLnRzQ2hlY2s8S2V5Ym9hcmRFdmVudD4oZXZlbnQsIEtleWJvYXJkRXZlbnQpO1xuXG4gICAgICAgICAgICBrZXlib2FyZEV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBrZXlib2FyZEV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAga2V5Ym9hcmRFdmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGJsb2NrZXIpO1xuICAgICAgICAgICAgfSwgMjUwKTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgYmxvY2tlcik7XG4gICAgICAgICAgLy8gI2VuZHJlZ2lvbiBQcmV2ZW50IGtleXN0cm9rZXMgZm9yIDI1MG1zIHRvIGF2b2lkIGFjY2lkZW50YWxseSB0eXBpbmcgaW50byB0aGUgbmV4dCBmaWVsZC5cbiAgICAgICAgICB2YWx1ZUNvbHVtbi5jbGljaygpO1xuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcjIgPSBJTlNUQU5DRS50c0NoZWNrPEhUTUxFbGVtZW50PihcbiAgICAgICAgICBERUZJTkVELnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KFxuICAgICAgICAgICAgREVGSU5FRC50c0NoZWNrPEhUTUxFbGVtZW50PihERUZJTkVELnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KG9wdGlvbmlucHV0LnRhcmdldCkucGFyZW50RWxlbWVudCkucGFyZW50RWxlbWVudCxcbiAgICAgICAgICApLnF1ZXJ5U2VsZWN0b3IoXCIucjJcIiksXG4gICAgICAgICAgSFRNTEVsZW1lbnQsXG4gICAgICAgICk7XG4gICAgICAgIC8vICNyZWdpb24gQ3JlYXRlIHNlcGFyYXRlIG9ic2VydmVyIGZvciB0aGUgY2FzZSBvZiBhdXRvY29tcGxldGlvbiBuZWNlc3NhcnkuXG4gICAgICAgIGNvbnN0IGNlbGxPYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKChtdXRhdGlvbnNMaXN0LCBvYnNlcnZlcikgPT4ge1xuICAgICAgICAgIGZvciAoY29uc3QgbXV0YXRpb24gb2YgbXV0YXRpb25zTGlzdCkge1xuICAgICAgICAgICAgaWYgKG11dGF0aW9uLnR5cGUgPT09IFwiY2hpbGRMaXN0XCIpIHtcbiAgICAgICAgICAgICAgZm9yIChjb25zdCBhZGRlZCBvZiBtdXRhdGlvbi5hZGRlZE5vZGVzKSB7XG4gICAgICAgICAgICAgICAgbGV0IGJvdW5kID0gZmFsc2U7IC8vIFN0YXRlcyB3aGV0aGVyIHRoZSBlcE1hbmFnZXIncyB0YXJnZXQgaXMgYWxyZWFkeSBib3VuZCB0byB0aGlzIDxpbnB1dD4uXG5cbiAgICAgICAgICAgICAgICBpZiAoYWRkZWQubm9kZU5hbWUgPT09IFwiSU5QVVRcIikge1xuICAgICAgICAgICAgICAgICAgYWRkZWQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleWJvYXJkRXZlbnQgPSBJTlNUQU5DRS50c0NoZWNrPEtleWJvYXJkRXZlbnQ+KGV2ZW50LCBLZXlib2FyZEV2ZW50KTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5Ym9hcmRFdmVudC5hbHRLZXkgJiYga2V5Ym9hcmRFdmVudC5rZXkudG9Mb3dlckNhc2UoKSA9PT0gXCJlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAvLyAjcmVnaW9uIFByZXZlbnQgZGVmYXVsdCBhY3Rpb25zICYgYnViYmxpbmcuXG4gICAgICAgICAgICAgICAgICAgICAga2V5Ym9hcmRFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgIGtleWJvYXJkRXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAga2V5Ym9hcmRFdmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIFByZXZlbnQgZGVmYXVsdCBhY3Rpb25zICYgYnViYmxpbmcuXG4gICAgICAgICAgICAgICAgICAgICAgZXBNYW5hZ2VyLm1vZGUgPSBcIlNWXCI7XG4gICAgICAgICAgICAgICAgICAgICAgZXBNYW5hZ2VyLm1vZGUgPSBcIkVQXCI7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBSZWJ1aWxkIGxpc3RpbmcuXG4gICAgICAgICAgICAgICAgICAgICAgSU5TVEFOQ0UudHNDaGVjazxIVE1MRWxlbWVudD4oXG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdkaXZbaXMgPSBcInhjLWVwbWFuYWdlclwiXScpLFxuICAgICAgICAgICAgICAgICAgICAgICAgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgKS5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgICAgICAgICAgICBcImVwb3B0aW9uc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgSlNPTi5wYXJzZSh3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmZzbEVsZW1lbnRwbGFjZWhvbGRlcilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgoZmlsZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpbGUubGFzdEluZGV4T2YoXCIuXCIpICE9PSAtMSA/IGZpbGUuc3Vic3RyaW5nKDAsIGZpbGUubGFzdEluZGV4T2YoXCIuXCIpKSA6IGZpbGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC5qb2luKFwiLFwiKSxcbiAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gUmVidWlsZCBsaXN0aW5nLlxuICAgICAgICAgICAgICAgICAgICAgIC8vIEZpcnN0IHRpbWUgbG9hZCBvZiBBUElEb2NcbiAgICAgICAgICAgICAgICAgICAgICBERUZJTkVELnRzQ2hlY2s8SFRNTE9iamVjdEVsZW1lbnQ+KGNEZXRhaWxzLnF1ZXJ5U2VsZWN0b3IoXCJvYmplY3RcIikpLnNldEF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZGF0YVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgYCR7d2luZG93LkNvZGJpUGx1Z2luRGF0YS5kb2NzQVBJW2N1cnJlbnRMYW5ndWFnZV0gPT09IHVuZGVmaW5lZCA/IHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZG9jc0FQSS5lbiA6IHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZG9jc0FQSVtjdXJyZW50TGFuZ3VhZ2VdfSR7d2luZG93LkNvZGJpUGx1Z2luRGF0YS5kZXRFbGVtZW50cGxhY2Vob2xkZXJbZXBNYW5hZ2VyLmN1cnJlbnRPcHRpb25dPy5EZXNjcmlwdGlvbn1gLFxuICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBTaG93IGludGVyZmFjZS5cbiAgICAgICAgICAgICAgICAgICAgICBlcE1hbmFnZXIuZW5hYmxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgZXBNYW5hZ2VyLmVudGVyaW5nRVAgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgIGNEZXRhaWxzLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG5cbiAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVMYXlvdXRFUE1hbmFnZXIoYWRkZWQgYXMgSFRNTElucHV0RWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgdXBkYXRlTGF5b3V0Q0RldGFpbHMoZXBNYW5hZ2VyKTtcbiAgICAgICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIFNob3cgaW50ZXJmYWNlLlxuICAgICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gQmluZCBlcE1hbmFnZXIncyB0YXJnZXQgdG8gdGhpcyA8aW5wdXQ+IGV2YWRpbmcgdW5uZWNlc3NhcnkgbXVsdGlwbGUgYmluZGluZy5cbiAgICAgICAgICAgICAgICAgICAgICBpZiAoIWJvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBib3VuZCA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGVwTWFuYWdlci50YXJnZXQgPSBJTlNUQU5DRS50c0NoZWNrPEhUTUxJbnB1dEVsZW1lbnQ+KGV2ZW50LnRhcmdldCwgSFRNTElucHV0RWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gQmluZCBlcE1hbmFnZXIncyB0YXJnZXQgdG8gdGhpcyA8aW5wdXQ+IGV2YWRpbmcgdW5uZWNlc3NhcnkgbXVsdGlwbGUgYmluZGluZy5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gI3JlZ2lvbiBDcmVhdGUgc2VwYXJhdGUgb2JzZXJ2ZXIgZm9yIHRoZSBjYXNlIG9mIGF1dG9jb21wbGV0aW9uIG5lY2Vzc2FyeS5cbiAgICAgICAgY2VsbE9ic2VydmVyLm9ic2VydmUocjIucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LCB7XG4gICAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICAgIHN1YnRyZWU6IHRydWUsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHIyLmNsaWNrKCk7XG4gICAgICB9KTtcblxuICAgICAgb3B0aW9uaW5wdXQub25PcHRpb25DaGFuZ2VkLnB1c2goKG5ld09wdGlvbjogc3RyaW5nKSA9PiB7XG4gICAgICAgIC8vICNyZWdpb24gRGV0ZXJtaW5pbmcgYW5kIHNldHRpbmcgdGhlIGNvcnJlY3QgZG9jdW1lbnRhdGlvbiBvZiBzdGFuZGFyZCBjb25maWd1cmF0aW9ucy5cbiAgICAgICAgaWYgKGluVGFnKSB7XG4gICAgICAgICAgY29uc3QgZGVzY3JpcHRpb24gPSBERUZJTkVELnRzQ2hlY2s8c3RyaW5nPihcbiAgICAgICAgICAgIHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZGV0U3RhbmRhcmRzW25ld09wdGlvbi5zdWJzdHJpbmcoMCwgbmV3T3B0aW9uLmluZGV4T2YoXCIvXCIpIC0gMSkudHJpbSgpXT8uRGVzY3JpcHRpb24sXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGlmIChkZXNjcmlwdGlvblswXSA9PT0gXCIvXCIpIHtcbiAgICAgICAgICAgIGNEZXRhaWxzLmlubmVySFRNTCA9IGA8b2JqZWN0IGRhdGEgPSAnJHtiYXNlRG9jVVJMfSR7ZGVzY3JpcHRpb259JyBzdHlsZSA9ICd3aWR0aCA6IDEwMCUgOyBoZWlnaHQgOiAxMDAlIDsgb3BhY2l0eSA6IC44IDsnPjwvb2JqZWN0PmA7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNEZXRhaWxzLmlubmVySFRNTCA9IGA8ZGl2IHN0eWxlID0gXCJ3aWR0aDogMTAwJSA7IGhlaWdodDogMTAwJSA7IG92ZXJmbG93IDogYXV0byA7XCI+JHtkZXNjcmlwdGlvbn08L2Rpdj5gO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyAjZW5kcmVnaW9uIERldGVybWluaW5nIGFuZCBzZXR0aW5nIHRoZSBjb3JyZWN0IGRvY3VtZW50YXRpb24gb2Ygc3RhbmRhcmQgY29uZmlndXJhdGlvbnMuXG4gICAgICAgIC8vICNyZWdpb24gUmV0cmlldmUgdGhlIHByb3BlciBkZXNjcmlwdGlvbiBhY2NvcmRpbmcgdG8gdGhlIG5ldyBvcHRpb24ncyBzdHJ1Y3R1cmUgdGhhdCBpZGVudGlmaWVzIHRoZSB0eXBlIG9mIGRpYWxvZ3VlIHdlJ3JlIGFjdHVhbGx5IGluLlxuICAgICAgICBjb25zdCBkZXNjcmlwdGlvbiA9IERFRklORUQudHNDaGVjazxzdHJpbmc+KFxuICAgICAgICAgIHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZGV0RnVuY3Rpb25hbGl0aWVzW1xuICAgICAgICAgICAgbmV3T3B0aW9uXG4gICAgICAgICAgICAgIC5zdWJzdHJpbmcoMCwgbmV3T3B0aW9uLmluZGV4T2YoXCIvXCIpIC0gMSlcbiAgICAgICAgICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgLnRyaW0oKVxuICAgICAgICAgIF0/LkRlc2NyaXB0aW9uID8/XG4gICAgICAgICAgICAobmV3T3B0aW9uLmluZGV4T2YoXCJbXCIpICE9PSAtMVxuICAgICAgICAgICAgICA/IHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZGV0U3RhbmRhcmRzW25ld09wdGlvbi5zdWJzdHJpbmcoMSwgbmV3T3B0aW9uLmluZGV4T2YoXCJdXCIpIC0gMSkudHJpbSgpXVxuICAgICAgICAgICAgICAgICAgPy5EZXNjcmlwdGlvblxuICAgICAgICAgICAgICA6IHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZGV0RnVuY3Rpb25hbGl0aWVzW1xuICAgICAgICAgICAgICAgICAgbmV3T3B0aW9uLnN1YnN0cmluZygwLCBuZXdPcHRpb24ubGFzdEluZGV4T2YoXCJfXCIpKS5yZXBsYWNlKC9fL2csIFwiLlwiKS50cmltKClcbiAgICAgICAgICAgICAgICBdPy5EZXNjcmlwdGlvbiksXG4gICAgICAgICk7XG4gICAgICAgIC8vICNlbmRyZWdpb24gUmV0cmlldmUgdGhlIHByb3BlciBkZXNjcmlwdGlvbiBhY2NvcmRpbmcgdG8gdGhlIG5ldyBvcHRpb24ncyBzdHJ1Y3R1cmUgdGhhdCBpZGVudGlmaWVzIHRoZSB0eXBlIG9mIGRpYWxvZ3VlIHdlJ3JlIGFjdHVhbGx5IGluLlxuICAgICAgICBpZiAoZGVzY3JpcHRpb25bMF0gPT09IFwiL1wiKSB7XG4gICAgICAgICAgY0RldGFpbHMuaW5uZXJIVE1MID0gYDxvYmplY3QgZGF0YSA9ICcke2Jhc2VEb2NVUkx9JHtkZXNjcmlwdGlvbn0nIHN0eWxlID0gJ3dpZHRoIDogMTAwJSA7IGhlaWdodCA6IDEwMCUgOyBvcGFjaXR5IDogLjggOyc+PC9vYmplY3Q+YDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjRGV0YWlscy5pbm5lckhUTUwgPSBgPGRpdiBzdHlsZSA9IFwid2lkdGg6IDEwMCUgOyBoZWlnaHQ6IDEwMCUgOyBvdmVyZmxvdyA6IGF1dG8gO1wiPiR7ZGVzY3JpcHRpb259PC9kaXY+YDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICAvLyAjZW5kcmVnaW9uIERlZmluZSBoYW5kbGVyIGZvciB0aGUgPFhDLU9wdGlvbklucHV0PidzIGNoYW5nZXMgaW4gb3B0aW9uLlxuICAgICAgLy8gI3JlZ2lvbiBEZWZpbmUgaGFuZGxlciBmb3IgdGhlIDxYQy1PcHRpb25JbnB1dD4ncyBzZWxlY3Rpb24uXG4gICAgICBvcHRpb25pbnB1dC5vbk9wdGlvblNlbGVjdGVkLnB1c2goKHNlbGVjdGVkT3B0aW9uOiBzdHJpbmcpID0+IHtcbiAgICAgICAgaWYgKG9wdGlvbmlucHV0Lm1vZGUgPT09IFwiQ29kZSBUZW1wbGF0ZVwiKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY0RldGFpbHMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuXG4gICAgICAgIElOU1RBTkNFLnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KFxuICAgICAgICAgIERFRklORUQudHNDaGVjazxIVE1MRWxlbWVudD4oXG4gICAgICAgICAgICBERUZJTkVELnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KERFRklORUQudHNDaGVjazxIVE1MRWxlbWVudD4ob3B0aW9uaW5wdXQudGFyZ2V0KS5wYXJlbnRFbGVtZW50KS5wYXJlbnRFbGVtZW50LFxuICAgICAgICAgICkucXVlcnlTZWxlY3RvcihcIi5yMlwiKSxcbiAgICAgICAgICBIVE1MRWxlbWVudCxcbiAgICAgICAgKS5jbGljaygpO1xuXG4gICAgICAgIGlmIChvcHRpb25pbnB1dC50YXJnZXQucGFyZW50RWxlbWVudCA9PT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBhcmVudCA9IElOU1RBTkNFLnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KFxuICAgICAgICAgIERFRklORUQudHNDaGVjazxIVE1MRWxlbWVudD4oXG4gICAgICAgICAgICBERUZJTkVELnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KERFRklORUQudHNDaGVjazxIVE1MRWxlbWVudD4ob3B0aW9uaW5wdXQudGFyZ2V0KS5wYXJlbnRFbGVtZW50KS5wYXJlbnRFbGVtZW50LFxuICAgICAgICAgICkucXVlcnlTZWxlY3RvcihcIi5yMlwiKSxcbiAgICAgICAgICBIVE1MRWxlbWVudCxcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBjZWxsID0gcGFyZW50LnF1ZXJ5U2VsZWN0b3IoXCJpbnB1dFwiKTtcblxuICAgICAgICBpZiAoY2VsbCA9PT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBib3VuZCA9IGZhbHNlO1xuXG4gICAgICAgIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGtleWJvYXJkRXZlbnQ6IEtleWJvYXJkRXZlbnQpID0+IHtcbiAgICAgICAgICAvLyAjcmVnaW9uIFByZXZlbnQgZGVmYXVsdCBhY3Rpb25zICYgYnViYmxpbmcuXG4gICAgICAgICAga2V5Ym9hcmRFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIGtleWJvYXJkRXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAga2V5Ym9hcmRFdmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uIFByZXZlbnQgZGVmYXVsdCBhY3Rpb25zICYgYnViYmxpbmcuXG4gICAgICAgICAgZXBNYW5hZ2VyLm1vZGUgPSBcIkVQXCI7XG4gICAgICAgICAgLy8gI3JlZ2lvbiBSZWJ1aWxkIGxpc3RpbmcuXG5cbiAgICAgICAgICBlcE1hbmFnZXIuc2V0QXR0cmlidXRlKFxuICAgICAgICAgICAgXCJlcG9wdGlvbnNcIixcbiAgICAgICAgICAgIEpTT04ucGFyc2Uod2luZG93LkNvZGJpUGx1Z2luRGF0YS5mc2xFbGVtZW50cGxhY2Vob2xkZXIpXG4gICAgICAgICAgICAgIC5tYXAoKGZpbGU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWxlLmxhc3RJbmRleE9mKFwiLlwiKSAhPT0gLTEgPyBmaWxlLnN1YnN0cmluZygwLCBmaWxlLmxhc3RJbmRleE9mKFwiLlwiKSkgOiBmaWxlO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuam9pbihcIixcIiksXG4gICAgICAgICAgKTtcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uIFJlYnVpbGQgbGlzdGluZy5cbiAgICAgICAgICAvLyBGaXJzdCB0aW1lIGxvYWQgb2YgQVBJRG9jXG4gICAgICAgICAgREVGSU5FRC50c0NoZWNrPEhUTUxPYmplY3RFbGVtZW50PihjRGV0YWlscy5xdWVyeVNlbGVjdG9yKFwib2JqZWN0XCIpKS5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICAgICBcImRhdGFcIixcbiAgICAgICAgICAgIGAke3dpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZG9jc0FQSVtjdXJyZW50TGFuZ3VhZ2VdID09PSB1bmRlZmluZWQgPyB3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmRvY3NBUEkuZW4gOiB3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmRvY3NBUElbY3VycmVudExhbmd1YWdlXX0ke3dpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZGV0RWxlbWVudHBsYWNlaG9sZGVyW2VwTWFuYWdlci5jdXJyZW50T3B0aW9uXT8uRGVzY3JpcHRpb259YCxcbiAgICAgICAgICApO1xuICAgICAgICAgIC8vICNyZWdpb24gU2hvdyBpbnRlcmZhY2UuXG4gICAgICAgICAgZXBNYW5hZ2VyLmVuYWJsZWQgPSB0cnVlO1xuICAgICAgICAgIGVwTWFuYWdlci5lbnRlcmluZ0VQID0gdHJ1ZTtcbiAgICAgICAgICBjRGV0YWlscy5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuXG4gICAgICAgICAgdXBkYXRlTGF5b3V0RVBNYW5hZ2VyKGNlbGwpO1xuICAgICAgICAgIHVwZGF0ZUxheW91dENEZXRhaWxzKGVwTWFuYWdlcik7XG4gICAgICAgICAgLy8gI2VuZHJlZ2lvbiBTaG93IGludGVyZmFjZS5cbiAgICAgICAgICAvLyAjcmVnaW9uIEJpbmQgZXBNYW5hZ2VyJ3MgdGFyZ2V0IHRvIHRoaXMgPGlucHV0PiBldmFkaW5nIHVubmVjZXNzYXJ5IG11bHRpcGxlIGJpbmRpbmcuXG4gICAgICAgICAgaWYgKCFib3VuZCkge1xuICAgICAgICAgICAgYm91bmQgPSB0cnVlO1xuXG4gICAgICAgICAgICBlcE1hbmFnZXIudGFyZ2V0ID0gSU5TVEFOQ0UudHNDaGVjazxIVE1MSW5wdXRFbGVtZW50PihrZXlib2FyZEV2ZW50LnRhcmdldCwgSFRNTElucHV0RWxlbWVudCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vICNlbmRyZWdpb24gQmluZCBlcE1hbmFnZXIncyB0YXJnZXQgdG8gdGhpcyA8aW5wdXQ+IGV2YWRpbmcgdW5uZWNlc3NhcnkgbXVsdGlwbGUgYmluZGluZy5cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIC8vICNlbmRyZWdpb24gRGVmaW5lIGhhbmRsZXIgZm9yIHRoZSA8WEMtT3B0aW9uSW5wdXQ+J3Mgc2VsZWN0aW9uLlxuICAgICAgLy8gI3JlZ2lvbiBEZWZpbmUgaGFuZGxlciBmb3IgdGhlIDxYQy1FUE1hbmFnZXI+J3Mgc2VsZWN0aW9uLlxuICAgICAgZXBNYW5hZ2VyLm9uT3B0aW9uU2VsZWN0ZWQucHVzaCgoc2VsZWN0ZWRPcHRpb246IHN0cmluZykgPT4ge1xuICAgICAgICBjRGV0YWlscy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICB9KTtcbiAgICAgIC8vICNlbmRyZWdpb24gRGVmaW5lIGhhbmRsZXIgZm9yIHRoZSA8WEMtRVBNYW5hZ2VyPidzIHNlbGVjdGlvbi5cbiAgICAgIC8vICNyZWdpb24gRGVmaW5lIHRyYW5zZm9ybWVyIGZvciA8WEMtRVBNYW5hZ2VyPiAmIDxYQy1PcHRpb25JbnB1dD4uXG4gICAgICAvKipcbiAgICAgICAqIFByZWZpeGVzICoqXCJkYXRhLWNiLVwiKiogdG8gdGhlIHN0cmluZyAqKnRvVHJhbnNmb3JtKiogYWRkaW5nIGp1c3QgdGhlIHtAbGluayBzdHJpbmcgfSBhZnRlciB0aGUgc2xhc2ggdG9cbiAgICAgICAqIHRoZSBwcmVmaXggdG8gZ2VuZXJhdGUgdGhlIHJlc3VsdGluZyB7QGxpbmsgc3RyaW5nIH0uXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtIHRvVHJhbnNmb3JtIFRoZSB7QGxpbmsgc3RyaW5nIH0gdG8gdHJhbnNmb3JtLlxuICAgICAgICpcbiAgICAgICAqIEByZXR1cm5zIFRoZSB0cmFuc2Zvcm1lZCB7QGxpbmsgc3RyaW5nIH0uICovXG4gICAgICBvcHRpb25pbnB1dC50YXJnZXRPcHRpb25UcmFuc2Zvcm1lciA9ICh0b1RyYW5zZm9ybTogc3RyaW5nKSA9PiB7XG4gICAgICAgIHJldHVybiBgZGF0YS1jYi0ke3RvVHJhbnNmb3JtLnN1YnN0cmluZyh0b1RyYW5zZm9ybS5pbmRleE9mKFwiL1wiKSArIDEpLnRyaW0oKX1gO1xuICAgICAgfTtcbiAgICAgIC8qKlxuICAgICAgICogQ2hhbmdlcyB0aGUge0BsaW5rIHN0cmluZyB9ICoqdG9UcmFuc2Zvcm0qKiBpbnRvIGFuIHVwcGVyY2FzZSBvbmUuXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtIHRvVHJhbnNmb3JtIFRoZSB7QGxpbmsgc3RyaW5nIH0gdG8gdHJhbnNmb3JtLlxuICAgICAgICpcbiAgICAgICAqIEByZXR1cm5zIFRoZSB0cmFuc2Zvcm1lZCB7QHN0cmluZyB9LiAqL1xuICAgICAgb3B0aW9uaW5wdXQub3B0aW9uVHJhbnNmb3JtZXIgPSBlcE1hbmFnZXIub3B0aW9uVHJhbnNmb3JtZXIgPSAodG9UcmFuc2Zvcm06IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gICAgICAgIHJldHVybiB0b1RyYW5zZm9ybS50b1VwcGVyQ2FzZSgpO1xuICAgICAgfTtcbiAgICAgIC8vICNlbmRyZWdpb24gRGVmaW5lIHRyYW5zZm9ybWVyIGZvciA8WEMtRVBNYW5hZ2VyPiAmIDxYQy1PcHRpb25JbnB1dD4uXG4gICAgICAvLyAjcmVnaW9uIFN0eWxlIDxYQy1FUE1hbmFnZXI+ICYgPFhDLU9wdGlvbklucHV0Pi5cbiAgICAgIG9wdGlvbmlucHV0LnN0eWxlLnBvc2l0aW9uID0gZXBNYW5hZ2VyLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgb3B0aW9uaW5wdXQuc3R5bGUuYm9yZGVyID0gZXBNYW5hZ2VyLnN0eWxlLmJvcmRlciA9IFwic29saWRcIjtcbiAgICAgIG9wdGlvbmlucHV0LnN0eWxlLnBhZGRpbmcgPSBlcE1hbmFnZXIuc3R5bGUucGFkZGluZyA9IFwiLjVlbVwiO1xuICAgICAgb3B0aW9uaW5wdXQuc3R5bGUuekluZGV4ID0gZXBNYW5hZ2VyLnN0eWxlLnpJbmRleCA9IFwiMTAwXCI7XG4gICAgICBvcHRpb25pbnB1dC5zdHlsZS5ib3JkZXJSYWRpdXMgPSBlcE1hbmFnZXIuc3R5bGUuYm9yZGVyUmFkaXVzID0gXCIuNWVtXCI7XG4gICAgICBvcHRpb25pbnB1dC5zdHlsZS5ib3hTaGFkb3cgPSBlcE1hbmFnZXIuc3R5bGUuYm94U2hhZG93ID0gXCIwIDAgLjVlbSBibGFja1wiO1xuICAgICAgb3B0aW9uaW5wdXQuc3R5bGUub3ZlcmZsb3dZID0gZXBNYW5hZ2VyLnN0eWxlLm92ZXJmbG93WSA9IFwiYXV0b1wiO1xuICAgICAgb3B0aW9uaW5wdXQuYmFja2dyb3VuZEltYWdlID1cbiAgICAgICAgZXBNYW5hZ2VyLmJhY2tncm91bmRJbWFnZSA9IGAke2Jhc2VVUkx9cGx1Z2luP25hbWU9UmVzb3VyY2UmUGF0aD0vY29tL2dpdGh1Yi94aW1hX2Zvcm1jeWNsZV9lbnR3aWNrbGVya3JlaXMvZmMvcGx1Z2luL2NvZGJpL1N5bWJvbF9Db2RCaS5zdmdgO1xuICAgICAgLy8gI3JlZ2lvbiBEZWZpbmUgbWV0aG9kcyBmb3IgbGF5b3V0IHVwZGF0ZXMgZm9yIDxYQy1FUE1hbmFnZXI+ICYgPFhDLU9wdGlvbklucHV0Pi5cbiAgICAgIC8qKlxuICAgICAgICogVXBkYXRlIHRoZSB7QGxpbmsgZXBNYW5hZ2VyIH0ncyBsYXlvdXQgYWNjb3JkaW5nIHRvIHRoZSBzcGVjaWZpZWQge0BsaW5rIEhUTUxFbGVtZW50IH0uXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtIGNlbGwgVGhlIHtAbGluayBIVE1MRWxlbWVudCB9IHRoZSB7QGxpbmsgZXBNYW5hZ2VyIH0gc2hhbGwgYWxpZ24gdG8uICovXG4gICAgICBjb25zdCB1cGRhdGVMYXlvdXRFUE1hbmFnZXIgPSAoY2VsbDogSFRNTEVsZW1lbnQpID0+IHtcbiAgICAgICAgY29uc3QgcmVjdENlbGwgPSBjZWxsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgICAgIGVwTWFuYWdlci5zdHlsZS5tYXhIZWlnaHQgPSBgJHt3aW5kb3cuaW5uZXJIZWlnaHQgLSBNYXRoLmNlaWwocmVjdENlbGwuYm90dG9tKX1weGA7XG4gICAgICAgIGVwTWFuYWdlci5zdHlsZS50b3AgPSBgJHtNYXRoLmNlaWwocmVjdENlbGwuYm90dG9tKX1weGA7XG4gICAgICAgIGVwTWFuYWdlci5zdHlsZS5sZWZ0ID0gYCR7TWF0aC5jZWlsKHJlY3RDZWxsLnJpZ2h0IC0gZXBNYW5hZ2VyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoIC0gKHdpbmRvdy5pbm5lcldpZHRoIC8gMTAwKSAqIDIpfXB4YDtcbiAgICAgICAgZXBNYW5hZ2VyLnN0eWxlLm1heEhlaWdodCA9IGAke01hdGguY2VpbCh3aW5kb3cuaW5uZXJIZWlnaHQgLSAod2luZG93LmlubmVySGVpZ2h0IC8gMTAwKSAqIDIgLSByZWN0Q2VsbC5ib3R0b20pfXB4YDtcbiAgICAgIH07XG4gICAgICAvKipcbiAgICAgICAqIFVwZGF0ZSB0aGUge0BsaW5rIG9wdGlvbmlucHV0IH0ncyBsYXlvdXQgYWNjb3JkaW5nIHRvIHRoZSBzcGVjaWZpZWQge0BsaW5rIEhUTUxFbGVtZW50IH0uXG4gICAgICAgKlxuICAgICAgICogQHBhcmFtIGNlbGwgVGhlIHtAbGluayBIVE1MRWxlbWVudCB9IHRoZSB7QGxpbmsgb3B0aW9uaW5wdXQgfSBzaGFsbCBhbGlnbiB0by4gKi9cbiAgICAgIGNvbnN0IHVwZGF0ZUxheW91dE9wdGlvbmlucHV0ID0gKGNlbGw6IEhUTUxFbGVtZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IHJlY3RDZWxsID0gY2VsbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgICAgICBvcHRpb25pbnB1dC5zdHlsZS5tYXhIZWlnaHQgPSBgJHt3aW5kb3cuaW5uZXJIZWlnaHQgLSBNYXRoLmNlaWwocmVjdENlbGwuYm90dG9tKX1weGA7XG4gICAgICAgIG9wdGlvbmlucHV0LnN0eWxlLnRvcCA9IGAke01hdGguY2VpbChyZWN0Q2VsbC5ib3R0b20pfXB4YDtcbiAgICAgICAgb3B0aW9uaW5wdXQuc3R5bGUubGVmdCA9IGAke01hdGguY2VpbChyZWN0Q2VsbC5yaWdodCAtIG9wdGlvbmlucHV0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoIC0gKHdpbmRvdy5pbm5lcldpZHRoIC8gMTAwKSAqIDIpfXB4YDtcbiAgICAgICAgb3B0aW9uaW5wdXQuc3R5bGUubWF4SGVpZ2h0ID0gYCR7TWF0aC5jZWlsKHdpbmRvdy5pbm5lckhlaWdodCAtICh3aW5kb3cuaW5uZXJIZWlnaHQgLyAxMDApICogMiAtIHJlY3RDZWxsLmJvdHRvbSl9cHhgO1xuICAgICAgfTtcbiAgICAgIC8vICNyZWdpb24gRGVmaW5lIG1ldGhvZHMgZm9yICBsYXlvdXQgdXBkYXRlcyBmb3IgPFhDLUVQTWFuYWdlcj4gJiA8WEMtT3B0aW9uSW5wdXQ+LlxuICAgICAgLy8gI2VuZHJlZ2lvbiBTdHlsZSA8WEMtRVBNYW5hZ2VyPiAmIDxYQy1PcHRpb25JbnB1dD4uXG4gICAgICAvLyAjcmVnaW9uIERvY3VtZW50YXRpb24gRGV0YWlscyBWaWV3ZXJcbiAgICAgIGNvbnN0IGNEZXRhaWxzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIC8vICNyZWdpb24gU2V0IHVwIEZvY3VzICYgTW91c2VvdmVyLUZsYWdcbiAgICAgIGxldCBmbGFnTW91c2VPdmVyQ0RldGFpbHMgPSBmYWxzZTtcbiAgICAgIGxldCBjdXJyZW50Q0RldGFpbEJsdXJBY3Rpb246ICgoKSA9PiB2b2lkKSB8IHVuZGVmaW5lZDtcblxuICAgICAgY0RldGFpbHMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZW50ZXJcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGZsYWdNb3VzZU92ZXJDRGV0YWlscyA9IHRydWU7XG4gICAgICB9KTtcbiAgICAgIGNEZXRhaWxzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWxlYXZlXCIsIChldmVudCkgPT4ge1xuICAgICAgICBmbGFnTW91c2VPdmVyQ0RldGFpbHMgPSBmYWxzZTtcblxuICAgICAgICBpZiAoY3VycmVudENEZXRhaWxCbHVyQWN0aW9uKSB7XG4gICAgICAgICAgY3VycmVudENEZXRhaWxCbHVyQWN0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgLy8gI2VuZHJlZ2lvbiBTZXQgdXAgRm9jdXMgJiBNb3VzZW92ZXItRmxhZ1xuICAgICAgLy8gI3JlZ2lvbiBTdHlsaW5nXG4gICAgICBjRGV0YWlscy5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgIGNEZXRhaWxzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgIGNEZXRhaWxzLnN0eWxlLmJvcmRlciA9IFwic29saWRcIjtcbiAgICAgIGNEZXRhaWxzLnN0eWxlLnBhZGRpbmcgPSBcIi41ZW1cIjtcbiAgICAgIGNEZXRhaWxzLnN0eWxlLnpJbmRleCA9IFwiMTAwXCI7XG4gICAgICBjRGV0YWlscy5zdHlsZS5ib3JkZXJDb2xvciA9IFwiZGFya29yYW5nZVwiO1xuICAgICAgY0RldGFpbHMuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gYHVybChcIiR7YmFzZVVSTH1wbHVnaW4/bmFtZT1SZXNvdXJjZSZQYXRoPS9jb20vZ2l0aHViL3hpbWFfZm9ybWN5Y2xlX2VudHdpY2tsZXJrcmVpcy9mYy9wbHVnaW4vY29kYmkvU3ltYm9sX0NvZEJpLnN2Z1wiKSwgbGluZWFyLWdyYWRpZW50KCAxMzBkZWcscmdiYSggNDIsIDEyMywgMTU1LCAxICkgMCUsIHJnYmEoIDIxNiwgMjE2LCAyMzUsIDEgKSA1MCUsIHJnYmEoIDQyLCAxMjMsIDE1NSwgMSApIDEwMCUgKWA7XG4gICAgICBjRGV0YWlscy5zdHlsZS5iYWNrZ3JvdW5kU2l6ZSA9IFwiY29udGFpblwiO1xuICAgICAgY0RldGFpbHMuc3R5bGUuYmFja2dyb3VuZFBvc2l0aW9uID0gXCJjZW50ZXJcIjtcbiAgICAgIGNEZXRhaWxzLnN0eWxlLmJhY2tncm91bmRSZXBlYXQgPSBcIm5vLXJlcGVhdFwiO1xuICAgICAgY0RldGFpbHMuc3R5bGUuYmFja2dyb3VuZEJsZW5kTW9kZSA9IFwib3ZlcmxheVwiO1xuICAgICAgY0RldGFpbHMuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCIjRkZGRkZGQ0NcIjtcbiAgICAgIGNEZXRhaWxzLnN0eWxlLmJvcmRlclJhZGl1cyA9IFwiLjVlbVwiO1xuICAgICAgY0RldGFpbHMuc3R5bGUuYm94U2hhZG93ID0gXCIwIDAgLjVlbSBibGFja1wiO1xuICAgICAgY0RldGFpbHMuc3R5bGUub3BhY2l0eSA9IFwiLjlcIjtcbiAgICAgIGNEZXRhaWxzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgIGNEZXRhaWxzLnN0eWxlLnBhZGRpbmcgPSBcIjBcIjtcbiAgICAgIC8vICNlbmRyZWdpb24gU3R5bGluZ1xuICAgICAgY0RldGFpbHMuY2xhc3NMaXN0LmFkZChcIi0tLUNvZEJpXCIsIFwiLS1QYW5lbFwiLCBcIi0tQVBJRG9jXCIpO1xuICAgICAgLy8gI3JlZ2lvbiBJbmplY3Rpb25cbiAgICAgIGNEZXRhaWxzLmlubmVySFRNTCA9IGBcbiAgICAgICAgICA8ZGl2IGNsYXNzID0gXCJBUElEb2NMb2FkZXJcIj48L2Rpdj5cblxuICAgICAgICAgIDxvYmplY3QgaWQgPSBcIkNvZEJpX0FQSURvY1ZpZXdlclwiPjwvb2JqZWN0PmA7XG5cbiAgICAgIGNvbnN0IGNzc0RldGFpbHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG5cbiAgICAgIGNzc0RldGFpbHMuaW5uZXJIVE1MID0gYFxuICAgICAgICAgIEBrZXlmcmFtZXMga2ZTcGlubmVyIHsgMTAwJSB7IHRyYW5zZm9ybSA6IHJvdGF0ZSggMXR1cm4gKX19XG4gICAgICAgICAgLkFQSURvY0xvYWRlciAgICAgICAgICB7IGFsaWduLXNlbGYgOiBhbmNob3ItY2VudGVyIDsganVzdGlmeS1zZWxmIDogYW5jaG9yLWNlbnRlciA7IHdpZHRoIDogMTAlIDsgcG9zaXRpb24gOiBhYnNvbHV0ZSA7IHRleHQtYWxpZ24gOiBjZW50ZXIgOyBtYXJnaW4gOiBhdXRvIDsgYXNwZWN0LXJhdGlvIDogMSA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXkgOiBncmlkIDsgYm9yZGVyIDogMnB4IHNvbGlkICMwMDAwIDsgYm9yZGVyLXJhZGl1cyA6IDUwJSA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlci1yaWdodC1jb2xvciA6ICAjMWU3OWVlIDsgYW5pbWF0aW9uIDoga2ZTcGlubmVyIDFzIGluZmluaXRlIGxpbmVhciA7fVxuICAgICAgICAgIC5BUElEb2NMb2FkZXI6OmJlZm9yZSxcbiAgICAgICAgICAuQVBJRG9jTG9hZGVyOjphZnRlciAgIHsgY29udGVudCA6IFwiXCI7IGdyaWQtYXJlYSA6IDEvMSA7IG1hcmdpbiA6IDJweCA7IGJvcmRlciA6IGluaGVyaXQgO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzIDogNTAlIDsgYW5pbWF0aW9uIDoga2ZTcGlubmVyIDJzIGluZmluaXRlIDt9XG4gICAgICAgICAgLkFQSURvY0xvYWRlcjo6YWZ0ZXIgICB7IG1hcmdpbiA6IDhweCA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbi1kdXJhdGlvbiA6IDEuNXMgO31cblxuICAgICAgICAgIEBrZXlmcmFtZXMga2ZGYWRlSU5fQVBJRG9jIHtcbiAgICAgICAgICAgIDAlIHsgc2NhbGUgOiAxLjEgOyBvcGFjaXR5IDogMCA7fVxuICAgICAgICAgICAgMTAwJSB7IHNjYWxlIDogMSA7IG9wYWNpdHkgOiAuOSA7fX1cbiAgICAgICAgICAuLS0tQ29kQmkuLS1QYW5lbC4tLUFQSURvYyAgeyBhbmltYXRpb24gOiBrZkZhZGVJTl9BUElEb2MgLjI1cyBlYXNlLWluIGZvcndhcmRzIDt9XG4gICAgICAgICAgb2JqZWN0I0NvZEJpX0FQSURvY1ZpZXdlciAgIHsgb3BhY2l0eSA6IC44IDsgd2lkdGggOiAxMDAlICFpbXBvcnRhbnQgOyBoZWlnaHQgOiAxMDAlICFpbXBvcnRhbnQgOyBib3JkZXItcmFkaXVzIDogLjVlbSA7fWA7XG5cbiAgICAgIGNEZXRhaWxzLnByZXBlbmQoY3NzRGV0YWlscyk7XG4gICAgICBkb2N1bWVudC5ib2R5Py5hcHBlbmRDaGlsZChjRGV0YWlscyk7XG4gICAgICAvLyAjZW5kcmVnaW9uIEluamVjdGlvblxuICAgICAgLy8gI3JlZ2lvbiBSZW1vdmUgbG9hZGVyIHdoZW4gaGF2aW5nIGxvYWRlZCBmb3IgdGhlIGZpcnN0IHRpbWUgaW4gc2Vzc2lvblxuICAgICAgLyoqXG4gICAgICAgKiBIYW5kbGVzIHRoZSB7QGxpbmsgY0RldGFpbHMgfSAqKmxvYWQqKiBldmVudC5cbiAgICAgICAqXG4gICAgICAgKiBAcGFyYW0gZXZlbnQgVGhlIHtAbGluayBFdmVudCB9IHJlY2VpdmVkLiAqL1xuICAgICAgY29uc3Qgb25GaXJzdERvY0xvYWQgPSAoZXZlbnQ6IEV2ZW50KSA9PiB7XG4gICAgICAgIChjRGV0YWlscy5xdWVyeVNlbGVjdG9yKFwiLkFQSURvY0xvYWRlclwiKSBhcyBIVE1MRGl2RWxlbWVudCkucmVtb3ZlKCk7XG5cbiAgICAgICAgKGNEZXRhaWxzLnF1ZXJ5U2VsZWN0b3IoXCJvYmplY3RcIikgYXMgSFRNTE9iamVjdEVsZW1lbnQpLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsIG9uRmlyc3REb2NMb2FkKTtcbiAgICAgIH07XG5cbiAgICAgIChjRGV0YWlscy5xdWVyeVNlbGVjdG9yKFwib2JqZWN0XCIpIGFzIEhUTUxPYmplY3RFbGVtZW50KS5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCBvbkZpcnN0RG9jTG9hZCk7XG4gICAgICAvLyAjZW5kcmVnaW9uIFJlbW92ZSBsb2FkZXIgd2hlbiBoYXZpbmcgbG9hZGVkIGZvciB0aGUgZmlyc3QgdGltZSBpbiBzZXNzaW9uXG4gICAgICAvLyAjcmVnaW9uIFJldHJpZXZlIExvY2FsIEFQSSBEb2NcbiAgICAgIGNvbnN0ICQgPSBnZXRKUXVlcnkoKTtcblxuICAgICAgJC5hamF4KHtcbiAgICAgICAgdXJsOiBgJHtiYXNlVVJMfXBsdWdpbj9uYW1lPUNvZEJpX0xvY2FsQVBJRG9jYCxcbiAgICAgICAgdHlwZTogXCJHRVRcIixcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIFwiWC1BY3Rpb25cIjogXCJSZXRyaWV2ZVwiLFxuICAgICAgICB9LFxuICAgICAgICBzdWNjZXNzOiAocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAvLyAjcmVnaW9uIExvYWQgaW50byBnbG9iYWwgc3RydWN0dXJlcyBhbmQgY29tcG9uZW50c1xuICAgICAgICAgIGZvciAoY29uc3QgZnVuY3Rpb25hbGl0eSBpbiByZXNwb25zZS5kZXRGdW5jdGlvbmFsaXRpZXMpIHtcbiAgICAgICAgICAgIHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZGV0RnVuY3Rpb25hbGl0aWVzW2Z1bmN0aW9uYWxpdHldID0gcmVzcG9uc2UuZGV0RnVuY3Rpb25hbGl0aWVzW2Z1bmN0aW9uYWxpdHldO1xuXG4gICAgICAgICAgICBnZXRKUXVlcnkoKS5hamF4KHtcbiAgICAgICAgICAgICAgdXJsOiBgJHtiYXNlVVJMfXBsdWdpbj9uYW1lPUNvZEJpX0xvY2FsQVBJRG9jYCxcbiAgICAgICAgICAgICAgdHlwZTogXCJHRVRcIixcbiAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgIFwiWC1BY3Rpb25cIjogXCJDb2RlXCIsXG4gICAgICAgICAgICAgICAgXCJYLUFjdGlvbkRldGFpbFwiOiBcIkZ1bmN0aW9uYWxpdHlcIixcbiAgICAgICAgICAgICAgICBcIlgtRWxlbWVudFwiOiBmdW5jdGlvbmFsaXR5LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBzdWNjZXNzOiAocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UucmVzdWx0ICE9PSBcIk5PTkVcIikge1xuICAgICAgICAgICAgICAgICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwiY29tcGxldGVcIikge1xuICAgICAgICAgICAgICAgICAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgKHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZGV0RnVuY3Rpb25hbGl0aWVzW2Z1bmN0aW9uYWxpdHldIGFzIGFueSkuQ29kZSA9IHJlc3BvbnNlLnJlc3VsdC5yZXBsYWNlQWxsKFxuICAgICAgICAgICAgICAgICAgICAgIFwiPHw+XCIsXG4gICAgICAgICAgICAgICAgICAgICAgJ1wiJyxcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAocmVzcG9uc2UuZnNsRnVuY3Rpb25hbGl0aWVzKSB7XG4gICAgICAgICAgICB3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmZzbEZ1bmN0aW9uYWxpdGllcyA9IGAke3dpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZnNsRnVuY3Rpb25hbGl0aWVzLnN1YnN0cmluZygwLCB3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmZzbEZ1bmN0aW9uYWxpdGllcy5sZW5ndGggLSAxKX0sXFxcIiR7cmVzcG9uc2UuZnNsRnVuY3Rpb25hbGl0aWVzLnNwbGl0KFwiLFwiKS5qb2luKCdcIixcIicpfVxcXCJdYDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBmb3IgKGNvbnN0IHBsYWNlaG9sZGVyIGluIHJlc3BvbnNlLmRldEVsZW1lbnRwbGFjZWhvbGRlcikge1xuICAgICAgICAgICAgd2luZG93LkNvZGJpUGx1Z2luRGF0YS5kZXRFbGVtZW50cGxhY2Vob2xkZXJbcGxhY2Vob2xkZXJdID0gcmVzcG9uc2UuZGV0RWxlbWVudHBsYWNlaG9sZGVyW3BsYWNlaG9sZGVyXTtcblxuICAgICAgICAgICAgZ2V0SlF1ZXJ5KCkuYWpheCh7XG4gICAgICAgICAgICAgIHVybDogYCR7YmFzZVVSTH1wbHVnaW4/bmFtZT1Db2RCaV9Mb2NhbEFQSURvY2AsXG4gICAgICAgICAgICAgIHR5cGU6IFwiR0VUXCIsXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICBcIlgtQWN0aW9uXCI6IFwiQ29kZVwiLFxuICAgICAgICAgICAgICAgIFwiWC1BY3Rpb25EZXRhaWxcIjogXCJFbGVtZW50cGxhY2Vob2xkZXJcIixcbiAgICAgICAgICAgICAgICBcIlgtRWxlbWVudFwiOiBwbGFjZWhvbGRlcixcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgc3VjY2VzczogKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnJlc3VsdCAhPT0gXCJOT05FXCIpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSBcImNvbXBsZXRlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XG4gICAgICAgICAgICAgICAgICAgICh3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmRldEVsZW1lbnRwbGFjZWhvbGRlcltwbGFjZWhvbGRlcl0gYXMgYW55KS5Db2RlID1cbiAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZS5yZXN1bHQucmVwbGFjZUFsbChcIjx8PlwiLCAnXCInKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAocmVzcG9uc2UuZnNsRWxlbWVudHBsYWNlaG9sZGVyKSB7XG4gICAgICAgICAgICB3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmZzbEVsZW1lbnRwbGFjZWhvbGRlciA9IGAke3dpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZnNsRWxlbWVudHBsYWNlaG9sZGVyLnN1YnN0cmluZygwLCB3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmZzbEVsZW1lbnRwbGFjZWhvbGRlci5sZW5ndGggLSAxKX0sXFxcIiR7cmVzcG9uc2UuZnNsRWxlbWVudHBsYWNlaG9sZGVyLnNwbGl0KFwiLFwiKS5qb2luKCdcIixcIicpfVxcXCJdYDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAocmVzcG9uc2UuZGV0U3RhbmRhcmRzKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiByZXNwb25zZS5kZXRTdGFuZGFyZHMpIHtcbiAgICAgICAgICAgICAgd2luZG93LkNvZGJpUGx1Z2luRGF0YS5kZXRTdGFuZGFyZHNba2V5XSA9IHJlc3BvbnNlLmRldFN0YW5kYXJkc1trZXldO1xuXG4gICAgICAgICAgICAgIGdldEpRdWVyeSgpLmFqYXgoe1xuICAgICAgICAgICAgICAgIHVybDogYCR7YmFzZVVSTH1wbHVnaW4/bmFtZT1Db2RCaV9Mb2NhbEFQSURvY2AsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJHRVRcIixcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgICBcIlgtQWN0aW9uXCI6IFwiQ29kZVwiLFxuICAgICAgICAgICAgICAgICAgXCJYLUFjdGlvbkRldGFpbFwiOiBcIlN0YW5kYXJkXCIsXG4gICAgICAgICAgICAgICAgICBcIlgtRWxlbWVudFwiOiBrZXksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiAocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5yZXN1bHQgIT09IFwiTk9ORVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSBcImNvbXBsZXRlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAod2luZG93LkNvZGJpUGx1Z2luRGF0YS5kZXRTdGFuZGFyZHNba2V5XSBhcyBhbnkpLkNvZGUgPSByZXNwb25zZS5yZXN1bHQucmVwbGFjZUFsbChcIjx8PlwiLCAnXCInKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChyZXNwb25zZS5maWxlTGlzdGluZykge1xuICAgICAgICAgICAgd2luZG93LkNvZGJpUGx1Z2luRGF0YS5maWxlTGlzdGluZyA9IGAke3dpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZmlsZUxpc3Rpbmcuc3Vic3RyaW5nKDAsIHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZmlsZUxpc3RpbmcubGVuZ3RoIC0gMSl9LFxcXCIke3Jlc3BvbnNlLmZpbGVMaXN0aW5nLnNwbGl0KFwiLFwiKS5qb2luKCdcIixcIicpfVxcXCJdYDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEucG9wdWxhdGVTdGFuZGFyZHMoKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIElOU1RBTkNFLnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2RpdltpcyA9IFwieGMtZXBtYW5hZ2VyXCJdJyksIEhUTUxFbGVtZW50KS5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICAgICBcIm9wdGlvbnNcIixcbiAgICAgICAgICAgIEpTT04ucGFyc2Uod2luZG93LkNvZGJpUGx1Z2luRGF0YS5mc2xGdW5jdGlvbmFsaXRpZXMpXG4gICAgICAgICAgICAgIC5tYXAoKGZpbGU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWxlLmxhc3RJbmRleE9mKFwiLlwiKSAhPT0gLTEgPyBmaWxlLnN1YnN0cmluZygwLCBmaWxlLmxhc3RJbmRleE9mKFwiLlwiKSkgOiBmaWxlO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAuam9pbihcIixcIiksXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIElOU1RBTkNFLnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2RpdltpcyA9IFwieGMtZXBtYW5hZ2VyXCJdJyksIEhUTUxFbGVtZW50KS5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICAgICBcImVwb3B0aW9uc1wiLFxuICAgICAgICAgICAgSlNPTi5wYXJzZSh3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmZzbEVsZW1lbnRwbGFjZWhvbGRlcilcbiAgICAgICAgICAgICAgLm1hcCgoZmlsZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbGUubGFzdEluZGV4T2YoXCIuXCIpICE9PSAtMSA/IGZpbGUuc3Vic3RyaW5nKDAsIGZpbGUubGFzdEluZGV4T2YoXCIuXCIpKSA6IGZpbGU7XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5qb2luKFwiLFwiKSxcbiAgICAgICAgICApO1xuICAgICAgICAgIC8vICNlbmRyZWdpb24gTG9hZCBpbnRvIGdsb2JhbCBzdHJ1Y3R1cmVzIGFuZCBjb21wb25lbnRzXG4gICAgICAgICAgLy8gI3JlZ2lvbiBMb2FkIGFuZCBpbmplY3QgQW5ndWxhciBsb2NhbCBBUEktRG9jdW1lbnRhdGlvbi1NYW5hZ2VyIHdlYiBjb21wb25lbnRcbiAgICAgICAgICBjb25zdCBzY3JpcHRBUElNYW5hZ2VyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTtcblxuICAgICAgICAgIHNjcmlwdEFQSU1hbmFnZXIuc3JjID0gYCR7YmFzZVVSTH1wbHVnaW4/bmFtZT1SZXNvdXJjZSZQYXRoPS9jb20vZ2l0aHViL3hpbWFfZm9ybWN5Y2xlX2VudHdpY2tsZXJrcmVpcy9mYy9wbHVnaW4vY29kYmkvY2ItbWFuYWdlci5qc2A7XG5cbiAgICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHNjcmlwdEFQSU1hbmFnZXIpO1xuXG4gICAgICAgICAgY29uc3QgY3NzQVBJTWFuYWdlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaW5rXCIpO1xuICAgICAgICAgIGNzc0FQSU1hbmFnZXIucmVsID0gXCJzdHlsZXNoZWV0XCI7XG4gICAgICAgICAgY3NzQVBJTWFuYWdlci50eXBlID0gXCJ0ZXh0L2Nzc1wiO1xuICAgICAgICAgIGNzc0FQSU1hbmFnZXIuaHJlZiA9IGAke2Jhc2VVUkx9cGx1Z2luP25hbWU9UmVzb3VyY2UmUGF0aD0vY29tL2dpdGh1Yi94aW1hX2Zvcm1jeWNsZV9lbnR3aWNrbGVya3JlaXMvZmMvcGx1Z2luL2NvZGJpL2NiLW1hbmFnZXIuY3NzYDtcblxuICAgICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoY3NzQVBJTWFuYWdlcik7XG4gICAgICAgICAgZG9jdW1lbnQuYm9keS5pbnNlcnRBZGphY2VudEhUTUwoXG4gICAgICAgICAgICBcImJlZm9yZWVuZFwiLFxuICAgICAgICAgICAgYFxuICAgICAgICAgIDxzdHlsZT5cbiAgICAgICAgICAgICNjQ29kQmlfTG9jYWxBUElEb2MgeyB6LWluZGV4OiAxMDAgOyBwb3NpdGlvbiA6IGFic29sdXRlIDsgbGVmdCA6IC0xMDB2dyA7IHRvcCA6IDIwdmggOyB3aWR0aCA6IDcwdncgOyBoZWlnaHQgOiA1MHZoIDsgcG9pbnRlci1ldmVudHMgOiBub25lIDsgb3BhY2l0eSA6IDAgOyB0cmFuc2l0aW9uIDogMXMgYWxsIDt9XG4gICAgICAgICAgICAjY0NvZEJpX0xvY2FsQVBJRG9jLi0tb3BlbmVkIHsgbGVmdCA6IDB2dyA7IG9wYWNpdHkgOiAuOSA7IHBvaW50ZXItZXZlbnRzIDogYWxsICFpbXBvcnRhbnQgO319XG4gICAgICAgICAgICAjY0NvZEJpX0xvY2FsQVBJRG9jIGNiLW1hbmFnZXIgeyBkaXNwbGF5IDogYmxvY2sgOyBoZWlnaHQgOiAxMDAlIDt9PC9zdHlsZT5cbiAgICAgICAgICA8ZGl2IGlkID0gXCJjQ29kQmlfTG9jYWxBUElEb2NcIj5cbiAgICAgICAgICAgIDxjYi1tYW5hZ2VyIGFwaWRvYyAgICAgID0gJyR7SlNPTi5zdHJpbmdpZnkocmVzcG9uc2UpfSdcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhc2VVUkwgICAgID0gXCIke2Jhc2VVUkx9XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhbmd1YWdlICAgID0gXCIke2N1cnJlbnRMYW5ndWFnZX1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VVUkwgPSBcIiR7YmFzZVVSTH1wbHVnaW4/bmFtZT1SZXNvdXJjZSZQYXRoPS9jb20vZ2l0aHViL3hpbWFfZm9ybWN5Y2xlX2VudHdpY2tsZXJrcmVpcy9mYy9wbHVnaW4vY29kYmkvdGlueW1jZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICBkb2NQYXRoICAgICA9IFwiQ29kYmlQbHVnaW5EYXRhXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhdGVybWFyayAgID0gXCIke2Jhc2VVUkx9cGx1Z2luP25hbWU9UmVzb3VyY2UmUGF0aD0vY29tL2dpdGh1Yi94aW1hX2Zvcm1jeWNsZV9lbnR3aWNrbGVya3JlaXMvZmMvcGx1Z2luL2NvZGJpL1N5bWJvbF9Db2RCaS5zdmdcIj48L2NiLW1hbmFnZXI+PC9kaXY+YCxcbiAgICAgICAgICApO1xuICAgICAgICAgIC8vICNyZWdpb24gUmVnaXN0ZXIgSG90a2V5IEFMVCtDIGZvciBkaXNwbGF5aW5nIHRoZSBtYW5hZ2VyIGFuZCBoYW5kbGUgdGhlIG1hbmFnZXIncyBjbG9zZSBidXR0b24uXG4gICAgICAgICAgY29uc3QgbWFuYWdlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjY0NvZEJpX0xvY2FsQVBJRG9jXCIpIGFzIEhUTUxFbGVtZW50O1xuXG4gICAgICAgICAgbWFuYWdlci5zdHlsZS5wb2ludGVyRXZlbnRzID0gXCJub25lXCI7XG5cbiAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAoZXZlbnQuYWx0S2V5ICYmIGV2ZW50LmtleS50b0xvd2VyQ2FzZSgpID09PSBcImNcIikge1xuICAgICAgICAgICAgICAvLyAjcmVnaW9uIERvIG5vdGhpbmcgaWYgQ29kQmktVG9nZ2xlIGlzIG5vdCBjaGVja2VkLlxuICAgICAgICAgICAgICBjb2RiaVRvZ2dsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZm9ybS1jb2RiaS1wcm9wLWVuYWJsZS1pbnB1dFwiKTtcblxuICAgICAgICAgICAgICBpZiAoY29kYmlUb2dnbGUgJiYgIShjb2RiaVRvZ2dsZSBhcyBIVE1MSW5wdXRFbGVtZW50KS5jaGVja2VkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIC8vICNyZWdpb24gRG8gbm90aGluZyBpZiBDb2RCaS1Ub2dnbGUgaXMgbm90IGNoZWNrZWQuXG4gICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNjcmlwdEZvcm06c2NyaXB0VGFiczp4bS1lZGl0b3ItanNfZWRpdG9yXCIpLmNvbnRhaW5zKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpXG4gICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25pbnB1dC5lbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgICBvcHRpb25pbnB1dC5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gSGlkZSBvcHRpb25zIGZvciBjb2RlIHRlbXBsYXRlcyB3aGVuIEpTLUVkaXRvciBnZXRzIGJsdXJyZWQuXG4gICAgICAgICAgICAgICAgICBjb25zdCBsaXN0ZW5lciA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9uaW5wdXQuZW5hYmxlZCAmJiBvcHRpb25pbnB1dC5tb2RlID09PSBcIkNvZGUgVGVtcGxhdGVcIikge1xuICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbmlucHV0LmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5hY3RpdmVFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJibHVyXCIsIGxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCBsaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIEhpZGUgb3B0aW9ucyBmb3IgY29kZSB0ZW1wbGF0ZXMgd2hlbiBKUy1FZGl0b3IgZ2V0cyBibHVycmVkLlxuICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBDYWxjdWxhdGUgTGF5b3V0XG4gICAgICAgICAgICAgICAgICBjb25zdCBjbGllbnRSZWN0ID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGVtUGl4ZWxzID0gZ2V0RW1TaXplSW5QaXhlbHMoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkgKiAyMjtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHRvcCA9IGNsaWVudFJlY3QudG9wICsgY2xpZW50UmVjdC5oZWlnaHQ7XG5cbiAgICAgICAgICAgICAgICAgIG9wdGlvbmlucHV0LnN0eWxlLnRvcCA9IGAkeyh0b3AgPiAwID8gdG9wIDogMCkgKyBlbVBpeGVscyAvIDExfXB4YDtcbiAgICAgICAgICAgICAgICAgIG9wdGlvbmlucHV0LnN0eWxlLmxlZnQgPSBgJHtjbGllbnRSZWN0LmxlZnQgKyBjbGllbnRSZWN0LndpZHRoIC8gMn1weGA7XG4gICAgICAgICAgICAgICAgICBvcHRpb25pbnB1dC5zdHlsZS5tYXhIZWlnaHQgPSBgJHtlbVBpeGVsc31weGA7XG4gICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIENhbGN1bGF0ZSBMYXlvdXRcbiAgICAgICAgICAgICAgICAgIG9wdGlvbmlucHV0Lm1vZGUgPSBcIkNvZGUgVGVtcGxhdGVcIjtcbiAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gRGVmaW5lIENvZGUgVGVtcGxhdGUgT3B0aW9uc1xuICAgICAgICAgICAgICAgICAgb3B0aW9uaW5wdXQub3B0aW9ucyA9IFtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LkNvZGJpUGx1Z2luRGF0YS5yZXRyaWV2ZU1hbmFnZXJUcmFuc2xhdGVkUmVzb3VyY2UoXCJDb2RlVGVtcGxhdGVfT25Mb2FkZWRcIiksXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEucmV0cmlldmVNYW5hZ2VyVHJhbnNsYXRlZFJlc291cmNlKFwiQ29kZVRlbXBsYXRlX0Z1bmN0aW9uYWxpdHlcIiksXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEucmV0cmlldmVNYW5hZ2VyVHJhbnNsYXRlZFJlc291cmNlKFwiQ29kZVRlbXBsYXRlX0VQXCIpLFxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLnJldHJpZXZlTWFuYWdlclRyYW5zbGF0ZWRSZXNvdXJjZShcIkNvZGVUZW1wbGF0ZV9TdGFuZGFyZFwiKSxcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LkNvZGJpUGx1Z2luRGF0YS5yZXRyaWV2ZU1hbmFnZXJUcmFuc2xhdGVkUmVzb3VyY2UoXCJDb2RlVGVtcGxhdGVfRnVuY3Rpb25hbGl0eV9FeHRlbmRcIiksXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEucmV0cmlldmVNYW5hZ2VyVHJhbnNsYXRlZFJlc291cmNlKFwiQ29kZVRlbXBsYXRlX0VQX0V4dGVuZFwiKSxcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LkNvZGJpUGx1Z2luRGF0YS5yZXRyaWV2ZU1hbmFnZXJUcmFuc2xhdGVkUmVzb3VyY2UoXCJDb2RlVGVtcGxhdGVfU3RhcnRcIiksXG4gICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBEZWZpbmUgQ29kZSBUZW1wbGF0ZSBPcHRpb25zXG4gICAgICAgICAgICAgICAgICBvcHRpb25pbnB1dC5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgIG9wdGlvbmlucHV0LnRhcmdldCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICAgICAgICAgICAgICAgIG9wdGlvbmlucHV0LnRhcmdldE9wdGlvblRyYW5zZm9ybWVyID0gKHRvVHJhbnNmb3JtOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAvLyAjcmVnaW9uIENsb3NlIHRoZSBBUEkgRG9jLU1hbmFnZXIgaWYgaXQgaXMgb3BlbmVkLlxuICAgICAgICAgICAgICAgICAgaWYgKG1hbmFnZXIuY2xhc3NMaXN0LmNvbnRhaW5zKFwiLS1vcGVuZWRcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgbWFuYWdlci5jbGFzc0xpc3QucmVtb3ZlKFwiLS1vcGVuZWRcIik7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIENsb3NlIHRoZSBBUEkgRG9jLU1hbmFnZXIgaWYgaXQgaXMgb3BlbmVkLlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtYW5hZ2VyLmNsYXNzTGlzdC50b2dnbGUoXCItLW9wZW5lZFwiKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgd2luZG93LkNvZGJpUGx1Z2luRGF0YS5tYW5hZ2VyQ2xvc2VkID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJMOlwiLCBkb2N1bWVudC5hY3RpdmVFbGVtZW50KTtcbiAgICAgICAgICAgIG1hbmFnZXIuY2xhc3NMaXN0LnRvZ2dsZShcIi0tb3BlbmVkXCIpO1xuICAgICAgICAgIH07XG4gICAgICAgICAgLy8gI2VuZHJlZ2lvbiBSZWdpc3RlciBIb3RrZXkgQUxUK0MgZm9yIGRpc3BsYXlpbmcgdGhlIG1hbmFnZXIgYW5kIGhhbmRsZSB0aGUgbWFuYWdlcidzIGNsb3NlIGJ1dHRvbi5cbiAgICAgICAgICAvLyAjZW5kcmVnaW9uIExvYWQgYW5kIGluamVjdCBBbmd1bGFyIGxvY2FsIEFQSS1Eb2N1bWVudGF0aW9uLU1hbmFnZXIgd2ViIGNvbXBvbmVudFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICAvLyAjZW5kcmVnaW9uIFJldHJpZXZlIExvY2FsIEFQSSBEb2NcbiAgICAgIC8vICNlbmRyZWdpb24gRG9jdW1lbnRhdGlvbiBEZXRhaWxzIFZpZXdlclxuICAgICAgLy8gI3JlZ2lvbiBEZWZpbmUgQVBJLURvYyBsYXlvdXQgdXBkYXRlXG4gICAgICAvKipcbiAgICAgICAqIFVwZGF0ZXMgdGhlIHtAbGluayBjRGV0YWlscyB9IGxheW91dCBhY2NvcmRpbmcgdG8gdGhlIHNwZWNpZmllZCB7QGxpbmsgSFRNTEVsZW1lbnQgfSB0byAqKmFsaWduVG8qKi5cbiAgICAgICAqXG4gICAgICAgKiBAcGFyYW0gYWxpZ25UbyBUaGUge0BsaW5rIEhUTUxFbGVtZW50IH0gdG8gKiphbGlnblRvKiouKi9cbiAgICAgIGNvbnN0IHVwZGF0ZUxheW91dENEZXRhaWxzID0gKGFsaWduVG86IEhUTUxFbGVtZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IHJlY3RUb0FsaWduVG8gPSBhbGlnblRvLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBjb25zdCB0b3AgPSByZWN0VG9BbGlnblRvLnRvcCArIChyZWN0VG9BbGlnblRvLmhlaWdodCAvIDEwMCkgKiA0LjU7XG5cbiAgICAgICAgY0RldGFpbHMuc3R5bGUubGVmdCA9IGAke01hdGguY2VpbChyZWN0VG9BbGlnblRvLmxlZnQgKyByZWN0VG9BbGlnblRvLndpZHRoID4gd2luZG93LmlubmVyV2lkdGggLyAyID8gKHdpbmRvdy5pbm5lcldpZHRoIC8gMTAwKSAqIDEgOiByZWN0VG9BbGlnblRvLmxlZnQgKyByZWN0VG9BbGlnblRvLndpZHRoICsgKHdpbmRvdy5pbm5lcldpZHRoIC8gMTAwKSAqIDEpfXB4YDtcbiAgICAgICAgY0RldGFpbHMuc3R5bGUudG9wID0gYCR7dG9wID4gd2luZG93LmlubmVySGVpZ2h0IC8gMiA/IHdpbmRvdy5pbm5lckhlaWdodCAvIDIgOiB0b3B9cHhgO1xuICAgICAgICBjRGV0YWlscy5zdHlsZS53aWR0aCA9IGAke01hdGguY2VpbChyZWN0VG9BbGlnblRvLmxlZnQgKyByZWN0VG9BbGlnblRvLndpZHRoID4gd2luZG93LmlubmVyV2lkdGggLyAyID8gcmVjdFRvQWxpZ25Uby5sZWZ0IC0gKHdpbmRvdy5pbm5lcldpZHRoIC8gMTAwKSAqIDIgOiB3aW5kb3cuaW5uZXJXaWR0aCAtIHJlY3RUb0FsaWduVG8ucmlnaHQgLSAod2luZG93LmlubmVyV2lkdGggLyAxMDApICogMil9cHhgO1xuICAgICAgICBjRGV0YWlscy5zdHlsZS5oZWlnaHQgPSBgJHsocmVjdFRvQWxpZ25Uby5oZWlnaHQgPCB3aW5kb3cuaW5uZXJIZWlnaHQgLyAyID8gd2luZG93LmlubmVySGVpZ2h0IC8gMiA6IHJlY3RUb0FsaWduVG8uaGVpZ2h0KSAtIChyZWN0VG9BbGlnblRvLmhlaWdodCAvIDEwMCkgKiAxMH1weGA7XG4gICAgICB9O1xuICAgICAgLy8gI2VuZHJlZ2lvbiBEZWZpbmUgQVBJLURvYyBsYXlvdXQgdXBkYXRlXG4gICAgICAvLyAjZW5kcmVnaW9uIEFQSS1Eb2N1bWVudGF0aW9uLVZpZXdlclxuICAgICAgLy8gI2VuZHJlZ2lvbiBTdHlsZSB0aGUgZnVuY3Rpb25hbGl0eSBtYW5hZ2VyXG4gICAgICAvLyAjcmVnaW9uIFNldHVwIEF0dHJpYnV0ZXMtRWRpdG9yIE1vbml0b3JpbmdcbiAgICAgIGNvbnN0IGF2YWlsYWJsZUNsYXNzZXMgPSBuZXcgQXJyYXk8eyBzdGFuZGFyZDogc3RyaW5nOyBuYW1lOiBzdHJpbmc7IGRlc2NyaXB0aW9uOiBzdHJpbmcgfT4oKTtcblxuICAgICAgbGV0IGF0dHJpYnV0ZXNFZGl0b3JQcm9jZXNzZWQgPSBmYWxzZTsgLy8gU2V0IHVwIHByb2Nlc3NpbmcganVzdCBvbmNlLlxuICAgICAgbGV0IGluVGFnID0gZmFsc2U7XG4gICAgICAvLyAjcmVnaW9uIEV4dGVuZCB0aGUgdmFyaWFibGVzIHRhYi5cbiAgICAgIGZvciAoY29uc3QgZ2xvYmFsVmFyc0VkaXRvciBvZiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdhW2hyZWY9XCIjc2NyaXB0Rm9ybTpzY3JpcHRUYWJzOnZhclRhYlwiXScpKSB7XG4gICAgICAgIGdsb2JhbFZhcnNFZGl0b3IuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGNlbGxPYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKChtdXRhdGlvbnNMaXN0LCBvYnNlcnZlcikgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBtdXRhdGlvbiBvZiBtdXRhdGlvbnNMaXN0KSB7XG4gICAgICAgICAgICAgIGlmIChtdXRhdGlvbi50eXBlID09PSBcImNoaWxkTGlzdFwiKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBhZGRlZCBvZiBtdXRhdGlvbi5hZGRlZE5vZGVzKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgIGFkZGVkIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCAmJlxuICAgICAgICAgICAgICAgICAgICBERUZJTkVELnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KGFkZGVkLnBhcmVudEVsZW1lbnQpLmNsYXNzTGlzdC5jb250YWlucyhcInIyXCIpXG4gICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBEbyBub3RoaW5nIGlmIENvZEJpLVRvZ2dsZSBpcyBub3QgY2hlY2tlZC5cbiAgICAgICAgICAgICAgICAgICAgY29kYmlUb2dnbGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI2Zvcm0tY29kYmktcHJvcC1lbmFibGUtaW5wdXRcIik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb2RiaVRvZ2dsZSAmJiAhKGNvZGJpVG9nZ2xlIGFzIEhUTUxJbnB1dEVsZW1lbnQpLmNoZWNrZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBEbyBub3RoaW5nIGlmIENvZEJpLVRvZ2dsZSBpcyBub3QgY2hlY2tlZC5cbiAgICAgICAgICAgICAgICAgICAgYWRkZWQucGxhY2Vob2xkZXIgPSBcIkNvZEJpOiBBTFQgKyBWXCI7XG5cbiAgICAgICAgICAgICAgICAgICAgYWRkZWQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBEbyBub3RoaW5nIGlmIENvZEJpLVRvZ2dsZSBpcyBub3QgY2hlY2tlZC5cbiAgICAgICAgICAgICAgICAgICAgICBjb2RiaVRvZ2dsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZm9ybS1jb2RiaS1wcm9wLWVuYWJsZS1pbnB1dFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoY29kYmlUb2dnbGUgJiYgIShjb2RiaVRvZ2dsZSBhcyBIVE1MSW5wdXRFbGVtZW50KS5jaGVja2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gRG8gbm90aGluZyBpZiBDb2RCaS1Ub2dnbGUgaXMgbm90IGNoZWNrZWQuXG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LmFsdEtleSAmJiAoZXZlbnQua2V5ID09PSBcInZcIiB8fCBldmVudC5rZXkgPT09IFwiVlwiKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBHbG9iYWwgdmFyaWFibGVzIGxpc3RpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGdsb2JhbFZhcmlhYmxlcyA9IG5ldyBBcnJheTxzdHJpbmc+KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgc3RhbmRhcmQgaW4gd2luZG93LkNvZGJpUGx1Z2luRGF0YS5kZXRTdGFuZGFyZHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZGV0U3RhbmRhcmRzW3N0YW5kYXJkXT8uZ2xvYmFscykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZ2xvYmFsIGluIHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZGV0U3RhbmRhcmRzW3N0YW5kYXJkXS5nbG9iYWxzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnbG9iYWxWYXJpYWJsZXMucHVzaChgWyAke3N0YW5kYXJkfSBdICR7Z2xvYmFsfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGZ1bmN0aW9uYWxpdHkgaW4gd2luZG93LkNvZGJpUGx1Z2luRGF0YS5kZXRGdW5jdGlvbmFsaXRpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBwYXJhbWV0ZXIgaW4gd2luZG93LkNvZGJpUGx1Z2luRGF0YS5kZXRGdW5jdGlvbmFsaXRpZXNbZnVuY3Rpb25hbGl0eV0/LlBhcmFtZXRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdsb2JhbFZhcmlhYmxlcy5wdXNoKGAke2Z1bmN0aW9uYWxpdHkucmVwbGFjZSgvXFwuL2csIFwiX1wiKX1fJHtwYXJhbWV0ZXJ9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gR2xvYmFsIHZhcmlhYmxlcyBsaXN0aW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAjcmVnaW9uIENvbmZpZ3VyZSA8WEMtT3B0aW9uSW5wdXQ+IHRvIHNob3cgdGhlIGdsb2JhbGx5IGF2YWlsYWJsZSB2YXJpYWJsZXMuXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25pbnB1dC5tb2RlID0gXCJHbG9iYWwgVmFyaWFibGVcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbmlucHV0Lm9wdGlvbnMgPSBnbG9iYWxWYXJpYWJsZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25pbnB1dC5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbmlucHV0LnRhcmdldCA9IGFkZGVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uaW5wdXQudGFyZ2V0T3B0aW9uVHJhbnNmb3JtZXIgPSAodG9UcmFuc2Zvcm06IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0b1RyYW5zZm9ybS5pbmRleE9mKFwiW1wiKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdG9UcmFuc2Zvcm0uc3Vic3RyaW5nKHRvVHJhbnNmb3JtLmluZGV4T2YoXCJdXCIpICsgMSkudHJpbSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRvVHJhbnNmb3JtO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gQ29uZmlndXJlIDxYQy1PcHRpb25JbnB1dD4gdG8gc2hvdyB0aGUgZ2xvYmFsbHkgYXZhaWxhYmxlIHZhcmlhYmxlcy5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gU2hvdyBjb3JyZXNwb25kaW5nIGRvY3VtZW50YXRpb24gd2hlbiA8WEMtT3B0aW9uSW5wdXQ+J3MgY3VycmVudCBvcHRpb24gY2hhbmdlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbmlucHV0Lm9uT3B0aW9uQ2hhbmdlZC5wdXNoKChuZXdPcHRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5ld09wdGlvbi5pbmRleE9mKFwiX1wiKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIERFRklORUQudHNDaGVjazxIVE1MT2JqZWN0RWxlbWVudD4oY0RldGFpbHMucXVlcnlTZWxlY3RvcihcIm9iamVjdFwiKSkuc2V0QXR0cmlidXRlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZGF0YVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGAke3dpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZG9jc0FQSVtjdXJyZW50TGFuZ3VhZ2VdID09PSB1bmRlZmluZWQgPyB3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmRvY3NBUEkuZW4gOiB3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmRvY3NBUElbY3VycmVudExhbmd1YWdlXX0ke1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3T3B0aW9uLmluZGV4T2YoXCJbXCIpICE9PSAtMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZGV0U3RhbmRhcmRzW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3T3B0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zdWJzdHJpbmcobmV3T3B0aW9uLmluZGV4T2YoXCJbXCIpICsgMSwgbmV3T3B0aW9uLmxhc3RJbmRleE9mKFwiXVwiKSAtIDEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50cmltKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdPy5EZXNjcmlwdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZGV0RnVuY3Rpb25hbGl0aWVzW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3T3B0aW9uLnN1YnN0cmluZygwLCBuZXdPcHRpb24ubGFzdEluZGV4T2YoXCJfXCIpKS5yZXBsYWNlKC9fL2csIFwiLlwiKS50cmltKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdPy5EZXNjcmlwdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1gLFxuICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIFNob3cgY29ycmVzcG9uZGluZyBkb2N1bWVudGF0aW9uIHdoZW4gPFhDLU9wdGlvbklucHV0PidzIGN1cnJlbnQgb3B0aW9uIGNoYW5nZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAjcmVnaW9uIEluc2VydCBwcm9wZXIgZ2xvYmFsIHZhcmlhYmxlIHdoZW4gPFhDLU9wdGlvbklucHV0PidzIGN1cnJlbnQgb3B0aW9uIHdhcyBzZWxlY3RlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbmlucHV0Lm9uT3B0aW9uU2VsZWN0ZWQucHVzaCgobmV3T3B0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25pbnB1dC5tb2RlID09PSBcIkNvZGUgVGVtcGxhdGVcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhZGRlZC52YWx1ZS5pbmRleE9mKFwiW1wiKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRlZC52YWx1ZSA9IGFkZGVkLnZhbHVlLnN1YnN0cmluZyhhZGRlZC52YWx1ZS5pbmRleE9mKFwiXVwiKSArIDIpLnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRlZC52YWx1ZSA9IGFkZGVkLnZhbHVlLnJlcGxhY2UoXCJkYXRhLWNiLVwiLCBcIlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIElOU1RBTkNFLnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbmlucHV0LnRhcmdldC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3RvcihcIi5yNFwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKS5jbGljaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIEluc2VydCBwcm9wZXIgZ2xvYmFsIHZhcmlhYmxlIHdoZW4gPFhDLU9wdGlvbklucHV0PidzIGN1cnJlbnQgb3B0aW9uIHdhcyBzZWxlY3RlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gUHJvcGVybHkgbGF5b3V0IDxYQy1PcHRpb25JbnB1dD4uXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWRkZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVjdEFkZGVkID0gSU5TVEFOQ0UudHNDaGVjazxIVE1MRWxlbWVudD4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkZWQucGFyZW50RWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25pbnB1dC5zdHlsZS5tYXhIZWlnaHQgPSBgJHt3aW5kb3cuaW5uZXJIZWlnaHQgLSBNYXRoLmNlaWwocmVjdEFkZGVkLmJvdHRvbSl9cHhgO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25pbnB1dC5zdHlsZS50b3AgPSBcIjV2aFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25pbnB1dC5zdHlsZS5sZWZ0ID0gYCR7TWF0aC5jZWlsKHJlY3RBZGRlZC5sZWZ0KX1weGA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbmlucHV0LnN0eWxlLm1heEhlaWdodCA9IGAke01hdGguY2VpbChyZWN0QWRkZWQudG9wIC0gKHdpbmRvdy5pbm5lckhlaWdodCAvIDEwMCkgKiA3KX1weGA7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgY0RldGFpbHMuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVMYXlvdXRDRGV0YWlscyhvcHRpb25pbnB1dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gUHJvcGVybHkgbGF5b3V0IDxYQy1PcHRpb25JbnB1dD4uXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gSW5pdGlhbCBBUEkgRG9jIGxvYWRpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYmFzZURvY1VSTCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LkNvZGJpUGx1Z2luRGF0YS5kb2NzQVBJW2N1cnJlbnRMYW5ndWFnZV0gPT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyB3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmRvY3NBUEkuZW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogd2luZG93LkNvZGJpUGx1Z2luRGF0YS5kb2NzQVBJW2N1cnJlbnRMYW5ndWFnZV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gUmV0cmlldmUgdGhlIHByb3BlciBkZXNjcmlwdGlvbiBhY2NvcmRpbmcgdG8gdGhlIG5ldyBvcHRpb24ncyBzdHJ1Y3R1cmUgdGhhdCBpZGVudGlmaWVzIHRoZSB0eXBlIG9mIGRpYWxvZ3VlIHdlJ3JlIGFjdHVhbGx5IGluLlxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkZXNjcmlwdGlvbiA9IERFRklORUQudHNDaGVjazxzdHJpbmc+KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZGV0RnVuY3Rpb25hbGl0aWVzW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2xvYmFsVmFyaWFibGVzWzBdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zdWJzdHJpbmcoMCwgZ2xvYmFsVmFyaWFibGVzWzBdLmluZGV4T2YoXCIvXCIpIC0gMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRyaW0oKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0/LkRlc2NyaXB0aW9uID8/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZ2xvYmFsVmFyaWFibGVzWzBdLmluZGV4T2YoXCJbXCIpICE9PSAtMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZGV0U3RhbmRhcmRzW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2xvYmFsVmFyaWFibGVzWzBdLnN1YnN0cmluZygxLCBnbG9iYWxWYXJpYWJsZXNbMF0uaW5kZXhPZihcIl1cIikgLSAxKS50cmltKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdPy5EZXNjcmlwdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZGV0RnVuY3Rpb25hbGl0aWVzW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2xvYmFsVmFyaWFibGVzWzBdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zdWJzdHJpbmcoMCwgZ2xvYmFsVmFyaWFibGVzWzBdLmxhc3RJbmRleE9mKFwiX1wiKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL18vZywgXCIuXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50cmltKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdPy5EZXNjcmlwdGlvbiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gUmV0cmlldmUgdGhlIHByb3BlciBkZXNjcmlwdGlvbiBhY2NvcmRpbmcgdG8gdGhlIG5ldyBvcHRpb24ncyBzdHJ1Y3R1cmUgdGhhdCBpZGVudGlmaWVzIHRoZSB0eXBlIG9mIGRpYWxvZ3VlIHdlJ3JlIGFjdHVhbGx5IGluLlxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGVzY3JpcHRpb25bMF0gPT09IFwiL1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY0RldGFpbHMuaW5uZXJIVE1MID0gYDxvYmplY3QgZGF0YSA9ICcke2Jhc2VEb2NVUkx9JHtkZXNjcmlwdGlvbn0nIHN0eWxlID0gJ3dpZHRoIDogMTAwJSA7IGhlaWdodCA6IDEwMCUgOyBvcGFjaXR5IDogLjggOyc+PC9vYmplY3Q+YDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjRGV0YWlscy5pbm5lckhUTUwgPSBgPGRpdiBzdHlsZSA9IFwid2lkdGg6IDEwMCUgOyBoZWlnaHQ6IDEwMCUgOyBvdmVyZmxvdyA6IGF1dG8gO1wiPiR7ZGVzY3JpcHRpb259PC9kaXY+YDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIEluaXRpYWwgQVBJIERvYyBsb2FkaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBCbGVuZCBvdXQgQ29kQmktSW50ZXJmYWNlIHdoZW4gbGVhdmluZyBhIGdsb2JhbCB2YXJpYWJsZSBpbnB1dCBmaWVsZC5cbiAgICAgICAgICAgICAgICAgICAgYWRkZWQuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKCFmbGFnTW91c2VPdmVyQ0RldGFpbHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNEZXRhaWxzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbmlucHV0LmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudENEZXRhaWxCbHVyQWN0aW9uID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjRGV0YWlscy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbmlucHV0LmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBCbGVuZCBvdXQgQ29kQmktSW50ZXJmYWNlIHdoZW4gbGVhdmluZyBhIGdsb2JhbCB2YXJpYWJsZSBpbnB1dCBmaWVsZC5cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICAvLyAjcmVnaW9uIE9ic2VydmUgdGhlIGdsb2JhbCB2YXJpYWJsZXMuXG4gICAgICAgICAgY2VsbE9ic2VydmVyLm9ic2VydmUoREVGSU5FRC50c0NoZWNrKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdmFyc2VkaXRvclwiKSksIHtcbiAgICAgICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgICAgIHN1YnRyZWU6IHRydWUsXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgLy8gI2VuZHJlZ2lvbiBPYnNlcnZlIHRoZSBnbG9iYWwgdmFyaWFibGVzLlxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIC8vICNlbmRyZWdpb24gRXh0ZW5kIHRoZSB2YXJpYWJsZXMgdGFiLlxuICAgICAgLy8gI3JlZ2lvbiBFeHRlbmQgdGhlIGV4dGVuZGVkIHRhYi5cbiAgICAgIGZvciAoY29uc3QgdGFiRWRpdG9yIG9mIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2FbaHJlZj1cIiN0YWJzUmlnaHQ6ZXh0ZW5kZWRUYWJcIl0nKSkge1xuICAgICAgICB0YWJFZGl0b3IuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuICAgICAgICAgIC8vICNyZWdpb24gUGFyYW1ldGVyY2VsbHNcbiAgICAgICAgICBjb25zdCBwYXJhbUNlbGxPYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKChtdXRhdGlvbnNMaXN0LCBvYnNlcnZlcikgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBtdXRhdGlvbiBvZiBtdXRhdGlvbnNMaXN0KSB7XG4gICAgICAgICAgICAgIGlmIChtdXRhdGlvbi50eXBlID09PSBcImNoaWxkTGlzdFwiKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBhZGRlZCBvZiBtdXRhdGlvbi5hZGRlZE5vZGVzKSB7XG4gICAgICAgICAgICAgICAgICAvLyAjcmVnaW9uIEhhbmRsZSBDU1MtQ2xhc3MgaW5vdXRcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHBvc3NpYmxlVGFnaWZ5ID0gREVGSU5FRC50c0NoZWNrPEhUTUxFbGVtZW50PihhZGRlZC5wYXJlbnRFbGVtZW50KTtcblxuICAgICAgICAgICAgICAgICAgaWYgKHBvc3NpYmxlVGFnaWZ5LmNsYXNzTGlzdC5jb250YWlucyhcInRhZ2lmeV9faW5wdXRcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGlucHV0OiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gSGlkZSBJbnRlcmZhY2VcbiAgICAgICAgICAgICAgICAgICAgcG9zc2libGVUYWdpZnkuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKCFmbGFnTW91c2VPdmVyQ0RldGFpbHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluVGFnID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBjRGV0YWlscy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25pbnB1dC5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRDRGV0YWlsQmx1ckFjdGlvbiA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaW5UYWcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY0RldGFpbHMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25pbnB1dC5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gSGlkZSBJbnRlcmZhY2VcbiAgICAgICAgICAgICAgICAgICAgcG9zc2libGVUYWdpZnkuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50VGFyZ2V0ID0gSU5TVEFOQ0UudHNDaGVjazxIVE1MRWxlbWVudD4oZXZlbnQudGFyZ2V0LCBIVE1MRWxlbWVudCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LmtleSA9PT0gXCIuXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaW5UYWcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dCA9IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gQnVpbGQgYXZhaWxhYmxlIGNsYXNzZXMgbGlzdFxuICAgICAgICAgICAgICAgICAgICAgICAgICBhdmFpbGFibGVDbGFzc2VzLmxlbmd0aCA9IDA7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBzdGFuZGFyZCBpbiB3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmRldFN0YW5kYXJkcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmRldFN0YW5kYXJkc1tzdGFuZGFyZF0/LkFjdGl2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjc3NDbGFzcyBpbiB3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmRldFN0YW5kYXJkc1tzdGFuZGFyZF0uY2xhc3Nlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdmFpbGFibGVDbGFzc2VzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YW5kYXJkOiBzdGFuZGFyZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBjc3NDbGFzcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogREVGSU5FRC50c0NoZWNrKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LkNvZGJpUGx1Z2luRGF0YS5kZXRTdGFuZGFyZHNbc3RhbmRhcmRdLmNsYXNzZXNbY3NzQ2xhc3NdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbmlucHV0Lm1vZGUgPSBcIkNTUy1DbGFzc1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25pbnB1dC5vcHRpb25zID0gYXZhaWxhYmxlQ2xhc3Nlcy5tYXAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKGNzc0NsYXNzKSA9PiBgJHtjc3NDbGFzcy5zdGFuZGFyZH0gLyAke2Nzc0NsYXNzLm5hbWV9YCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBCdWlsZCBhdmFpbGFibGUgY2xhc3NlcyBsaXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gRmlyc3QgbG9hZCBvZiBkb2N1bWVudGF0aW9uLlxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZWFsTmFtZSA9IERFRklORUQudHNDaGVjazxzdHJpbmc+KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbmlucHV0LmN1cnJlbnRPcHRpb24uc3Vic3RyaW5nKDAsIG9wdGlvbmlucHV0LmN1cnJlbnRPcHRpb24uaW5kZXhPZihcIi9cIikgLSAxKS50cmltKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGVzY3JpcHRpb24gPSBERUZJTkVELnRzQ2hlY2s8c3RyaW5nPihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmRldFN0YW5kYXJkc1tyZWFsTmFtZV0/LkRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmRldFN0YW5kYXJkc1tyZWFsTmFtZV0/LkRlc2NyaXB0aW9uWzBdID09PSBcIi9cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNEZXRhaWxzLmlubmVySFRNTCA9IGA8b2JqZWN0IGRhdGEgPSAnJHtiYXNlRG9jVVJMfSR7ZGVzY3JpcHRpb259JyBzdHlsZSA9ICd3aWR0aCA6IDEwMCUgOyBoZWlnaHQgOiAxMDAlIDsgb3BhY2l0eSA6IC44IDsnPjwvb2JqZWN0PmA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY0RldGFpbHMuaW5uZXJIVE1MID0gYFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgc3R5bGUgPSBcIndpZHRoOiAxMDAlIDsgaGVpZ2h0OiAxMDAlIDsgb3ZlcmZsb3cgOiBhdXRvIDtcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR7ZGVzY3JpcHRpb259PC9kaXY+YDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIEZpcnN0IGxvYWQgb2YgZG9jdW1lbnRhdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uaW5wdXQuZW5hYmxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbmlucHV0Lm9wdGlvblRyYW5zZm9ybWVyID0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhZGRlZC5wYXJlbnRFbGVtZW50ICE9PSBudWxsICYmIGFkZGVkLnBhcmVudEVsZW1lbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlY3RBZGRlZCA9IElOU1RBTkNFLnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkZWQucGFyZW50RWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEhUTUxFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25pbnB1dC5zdHlsZS5tYXhIZWlnaHQgPSBgJHt3aW5kb3cuaW5uZXJIZWlnaHQgLSBNYXRoLmNlaWwocmVjdEFkZGVkLmJvdHRvbSl9cHhgO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbmlucHV0LnN0eWxlLnRvcCA9IGAke01hdGguY2VpbChyZWN0QWRkZWQuYm90dG9tKX1weGA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uaW5wdXQuc3R5bGUubGVmdCA9IGAke01hdGguY2VpbChyZWN0QWRkZWQucmlnaHQgLSBvcHRpb25pbnB1dC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS53aWR0aCAtICh3aW5kb3cuaW5uZXJXaWR0aCAvIDEwMCkgKiAyKX1weGA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uaW5wdXQuc3R5bGUubWF4SGVpZ2h0ID0gYCR7TWF0aC5jZWlsKHdpbmRvdy5pbm5lckhlaWdodCAtICh3aW5kb3cuaW5uZXJIZWlnaHQgLyAxMDApICogMiAtIHJlY3RBZGRlZC5ib3R0b20pfXB4YDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNEZXRhaWxzLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlTGF5b3V0Q0RldGFpbHMob3B0aW9uaW5wdXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQua2V5ICE9PSBcIiBcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25pbnB1dC5vbktleWRvd25UYXJnZXQoZXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25pbnB1dC5jdXJyZW50T3B0aW9uRWxlbWVudC5zY3JvbGxJbnRvVmlldyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmVoYXZpb3I6IFwic21vb3RoXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2s6IFwiY2VudGVyXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5saW5lOiBcImNlbnRlclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluVGFnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRDRGV0YWlsQmx1ckFjdGlvbiA9ICgpID0+IHt9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvXlthLXpBLVowLTlfIF0kLy50ZXN0KGV2ZW50LmtleSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5rZXkgPT09IFwiQmFja3NwYWNlXCIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5rZXkgPT09IFwiRGVsZXRlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LmtleSA9PT0gXCIgXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc3NpYmxlVGFnaWZ5LmlubmVySFRNTCA9IG9wdGlvbmlucHV0LmN1cnJlbnRPcHRpb24uc3Vic3RyaW5nKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25pbnB1dC5jdXJyZW50T3B0aW9uLmluZGV4T2YoXCIvXCIpICsgMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluVGFnID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjRGV0YWlscy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25pbnB1dC5lbmFibGVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnRhcmdldC5kaXNwYXRjaEV2ZW50KG5ldyBLZXlib2FyZEV2ZW50KFwia2V5ZG93blwiLCB7IGtleTogXCJUYWJcIiB9KSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnRUYXJnZXQuaW5uZXJIVE1MLmluZGV4T2YoXCIuXCIpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBEbyBub3RoaW5nIGlmIENvZEJpLVRvZ2dsZSBpcyBub3QgY2hlY2tlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGJpVG9nZ2xlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNmb3JtLWNvZGJpLXByb3AtZW5hYmxlLWlucHV0XCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvZGJpVG9nZ2xlICYmICEoY29kYmlUb2dnbGUgYXMgSFRNTElucHV0RWxlbWVudCkuY2hlY2tlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAjcmVnaW9uIERvIG5vdGhpbmcgaWYgQ29kQmktVG9nZ2xlIGlzIG5vdCBjaGVja2VkLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5UYWcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNEZXRhaWxzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbmlucHV0LmVuYWJsZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAjcmVnaW9uIEZpbHRlciB0aGUgb3B0aW9ucyBhbmQgZW5kIGlucHV0IGlmIG9ubHkgb25lIG9wdGlvbiBpcyBsZWZ0LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25pbnB1dC5maWx0ZXIoZXZlbnRUYXJnZXQuaW5uZXJIVE1MLnN1YnN0cmluZygxKSkubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NzaWJsZVRhZ2lmeS5pbm5lckhUTUwgPSBvcHRpb25pbnB1dC5jdXJyZW50T3B0aW9uLnN1YnN0cmluZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uaW5wdXQuY3VycmVudE9wdGlvbi5pbmRleE9mKFwiL1wiKSArIDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpblRhZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY0RldGFpbHMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uaW5wdXQuZW5hYmxlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC50YXJnZXQuZGlzcGF0Y2hFdmVudChuZXcgS2V5Ym9hcmRFdmVudChcImtleWRvd25cIiwgeyBrZXk6IFwiRW50ZXJcIiB9KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAjcmVnaW9uIFByZXZlbnQga2V5c3Ryb2tlcyBmb3IgMjUwbXMgdG8gYXZvaWQgYWNjaWRlbnRhbGx5IHR5cGluZyBpbnRvIHRoZSBuZXh0IGZpZWxkLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYmxvY2tlciA9IChldmVudDogS2V5Ym9hcmRFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXlib2FyZEV2ZW50ID0gSU5TVEFOQ0UudHNDaGVjazxLZXlib2FyZEV2ZW50PihldmVudCwgS2V5Ym9hcmRFdmVudCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5Ym9hcmRFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXlib2FyZEV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXlib2FyZEV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGJsb2NrZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCA1MDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgYmxvY2tlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIFByZXZlbnQga2V5c3Ryb2tlcyBmb3IgMjUwbXMgdG8gYXZvaWQgYWNjaWRlbnRhbGx5IHR5cGluZyBpbnRvIHRoZSBuZXh0IGZpZWxkLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIEZpbHRlciB0aGUgb3B0aW9ucyBhbmQgZW5kIGlucHV0IGlmIG9ubHkgb25lIG9wdGlvbiBpcyBsZWZ0LlxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50Q0RldGFpbEJsdXJBY3Rpb24gPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5UYWcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjRGV0YWlscy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uaW5wdXQuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5UYWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVhbE5hbWUgPSBERUZJTkVELnRzQ2hlY2s8c3RyaW5nPihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25pbnB1dC5jdXJyZW50T3B0aW9uLnN1YnN0cmluZygwLCBvcHRpb25pbnB1dC5jdXJyZW50T3B0aW9uLmluZGV4T2YoXCIvXCIpIC0gMSkudHJpbSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gREVGSU5FRC50c0NoZWNrPHN0cmluZz4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LkNvZGJpUGx1Z2luRGF0YS5kZXRTdGFuZGFyZHNbcmVhbE5hbWVdPy5EZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAod2luZG93LkNvZGJpUGx1Z2luRGF0YS5kZXRTdGFuZGFyZHNbcmVhbE5hbWVdPy5EZXNjcmlwdGlvblswXSA9PT0gXCIvXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBERUZJTkVELnRzQ2hlY2s8SFRNTE9iamVjdEVsZW1lbnQ+KGNEZXRhaWxzLnF1ZXJ5U2VsZWN0b3IoXCJvYmplY3RcIikpLnJlbW92ZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY0RldGFpbHMuaW5uZXJIVE1MID0gYDxvYmplY3QgZGF0YSA9ICcke2Jhc2VEb2NVUkx9JHtkZXNjcmlwdGlvbn0nIHN0eWxlID0gJ3dpZHRoIDogMTAwJSA7IGhlaWdodCA6IDEwMCUgOyBvcGFjaXR5IDogLjggOyc+PC9vYmplY3Q+YDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjRGV0YWlscy5pbm5lckhUTUwgPSBgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZSA9IFwid2lkdGg6IDEwMCUgOyBoZWlnaHQ6IDEwMCUgOyBvdmVyZmxvdyA6IGF1dG8gO1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHtkZXNjcmlwdGlvbn08L2Rpdj5gO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gSGFuZGxlIENTUy1DbGFzcyBpbm91dFxuICAgICAgICAgICAgICAgICAgaWYgKGFkZGVkIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAvLyAjcmVnaW9uIEhhbmRsZSBzb2xlIGNsaWNrcyBvbiBhIFtkYXRhLWNiLWZ1bmNdIHZhbHVlIGZpZWxkXG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICBJTlNUQU5DRS50c0NoZWNrPEhUTUxFbGVtZW50PihcbiAgICAgICAgICAgICAgICAgICAgICAgIERFRklORUQudHNDaGVjazxIVE1MRWxlbWVudD4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgIERFRklORUQudHNDaGVjazxIVE1MRWxlbWVudD4oYWRkZWQucGFyZW50RWxlbWVudCkucGFyZW50RWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICkucXVlcnlTZWxlY3RvcihcIi5yMVwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIEhUTUxFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICkuaW5uZXJIVE1MLnRvTG93ZXJDYXNlKCkgPT09IFwiZGF0YS1jYi1mdW5jXCJcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgd2luZG93LkNvZGJpUGx1Z2luRGF0YS51cGRhdGVTVk1hbmFnZXIod2luZG93LkNvZGJpUGx1Z2luRGF0YS5mc2xGdW5jdGlvbmFsaXRpZXMpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgaWYgKCFlcE1hbmFnZXIuZW5hYmxlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWRkZWQuc2V0U2VsZWN0aW9uUmFuZ2UoYWRkZWQudmFsdWUubGVuZ3RoLCBhZGRlZC52YWx1ZS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBSZWZyZXNoIGxpc3RpbmcuXG4gICAgICAgICAgICAgICAgICAgICAgICBJTlNUQU5DRS50c0NoZWNrPEhUTUxFbGVtZW50PihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignZGl2W2lzID0gXCJ4Yy1lcG1hbmFnZXJcIl0nKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICApLnNldEF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgXCJvcHRpb25zXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIEpTT04ucGFyc2Uod2luZG93LkNvZGJpUGx1Z2luRGF0YS5mc2xGdW5jdGlvbmFsaXRpZXMpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgoZmlsZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmlsZS5sYXN0SW5kZXhPZihcIi5cIikgIT09IC0xID8gZmlsZS5zdWJzdHJpbmcoMCwgZmlsZS5sYXN0SW5kZXhPZihcIi5cIikpIDogZmlsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5qb2luKFwiLFwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIFJlZnJlc2ggbGlzdGluZy5cbiAgICAgICAgICAgICAgICAgICAgICAgIGVwTWFuYWdlci5tb2RlID0gXCJTVlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgZXBNYW5hZ2VyLnRhcmdldCA9IElOU1RBTkNFLnRzQ2hlY2s8SFRNTElucHV0RWxlbWVudD4oYWRkZWQsIEhUTUxJbnB1dEVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZXBNYW5hZ2VyLmVuYWJsZWQgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVMYXlvdXRFUE1hbmFnZXIoYWRkZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBIaWRlIENvZEJpLUludGVyZmFjZVxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkZWQuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZmxhZ01vdXNlT3ZlckNEZXRhaWxzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXBNYW5hZ2VyLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjRGV0YWlscy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudENEZXRhaWxCbHVyQWN0aW9uID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXBNYW5hZ2VyLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNEZXRhaWxzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gSGlkZSBDb2RCaS1JbnRlcmZhY2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjRGV0YWlscy5xdWVyeVNlbGVjdG9yKFwib2JqZWN0XCIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIERFRklORUQudHNDaGVjazxIVE1MT2JqZWN0RWxlbWVudD4oY0RldGFpbHMucXVlcnlTZWxlY3RvcihcIm9iamVjdFwiKSkuc2V0QXR0cmlidXRlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZGF0YVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGAke3dpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZG9jc0FQSVtjdXJyZW50TGFuZ3VhZ2VdID09PSB1bmRlZmluZWQgPyB3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmRvY3NBUEkuZW4gOiB3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmRvY3NBUElbY3VycmVudExhbmd1YWdlXX0ke3dpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZGV0RnVuY3Rpb25hbGl0aWVzW2VwTWFuYWdlci5jdXJyZW50T3B0aW9uXT8uRGVzY3JpcHRpb259YCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICBpZiAoY0RldGFpbHMuc3R5bGUuZGlzcGxheSAhPT0gXCJibG9ja1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjRGV0YWlscy5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVMYXlvdXRDRGV0YWlscyhlcE1hbmFnZXIpO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIEhhbmRsZSBzb2xlIGNsaWNrcyBvbiBhIFtkYXRhLWNiLWZ1bmNdIHZhbHVlIGZpZWxkXG4gICAgICAgICAgICAgICAgICAgIGlmIChhZGRlZC5wYXJlbnRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWRkZWRQYXJlbnQgPSBhZGRlZC5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChhZGRlZC5jbGFzc0xpc3QuY29udGFpbnMoXCJlZGl0b3ItdGV4dFwiKSAmJiBhZGRlZFBhcmVudC5jbGFzc0xpc3QuY29udGFpbnMoXCJyMVwiKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNiRlVOQ3M6IHN0cmluZyB8IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFkZGVkLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHBvc3NpYmxlQ0JGdW5jIG9mIERFRklORUQudHNDaGVjazxIVE1MRWxlbWVudD4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgREVGSU5FRC50c0NoZWNrPEhUTUxFbGVtZW50PihhZGRlZFBhcmVudC5wYXJlbnRFbGVtZW50KS5wYXJlbnRFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICApLnF1ZXJ5U2VsZWN0b3JBbGwoXCIucjFcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NzaWJsZUNCRnVuYy5wYXJlbnRFbGVtZW50ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NzaWJsZUNCRnVuYy5pbm5lckhUTUwudG9Mb3dlckNhc2UoKSA9PT0gXCJkYXRhLWNiLWZ1bmNcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2JGVU5DcyA9IElOU1RBTkNFLnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBERUZJTkVELnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KHBvc3NpYmxlQ0JGdW5jLnBhcmVudEVsZW1lbnQpLnF1ZXJ5U2VsZWN0b3IoXCIucjJcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEhUTUxFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKS5pbm5lckhUTUw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2JGVU5Dcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAjcmVnaW9uIElmIGEgZGF0YS1jYi1mdW5jIGZpZWxkIGlzIGV4aXN0ZW50Li4uXG4gICAgICAgICAgICAgICAgICAgICAgICAgIElOU1RBTkNFLnRzQ2hlY2s8SFRNTElucHV0RWxlbWVudD4oYWRkZWQsIEhUTUxJbnB1dEVsZW1lbnQpLnBsYWNlaG9sZGVyID0gXCJDb2RCaTogQUxUK1BcIjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRlZC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAjcmVnaW9uIFNob3cgbGlzdGluZyBvZiBhdmFpbGFibGUgZnVuY3Rpb25hbGl0eSBwYXJhbWV0ZXIuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LmFsdEtleSAmJiAoZXZlbnQua2V5ID09PSBcInBcIiB8fCBldmVudC5rZXkgPT09IFwiUFwiKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBCdWlsZCBQYXJhbWV0ZXItbGlzdGluZyBhY2NvcmRpbmcgdG8gc2VsZWN0ZWQgZnVuY3Rpb25hbGl0aWVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJhbWV0ZXJMaXN0aW5nOiB7IFtrZXk6IHN0cmluZ106IEFycmF5PHN0cmluZz4gfSA9IHt9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBmdW5jdGlvbmFsaXR5IG9mIGNiRlVOQ3MudHJpbSgpLnNwbGl0KFwiLFwiKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQcm9jZXNzIGZ1bmN0aW9uYWxpdHkgb25seSBpZiBpdCBpcyBub3QgYW4gZW1wdHkgc3RyaW5nLi4uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghL15cXHMqJC8udGVzdChmdW5jdGlvbmFsaXR5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uYWxpdHkgPSBmdW5jdGlvbmFsaXR5LnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJhbWV0ZXJMaXN0aW5nW2Z1bmN0aW9uYWxpdHldID0gbmV3IEFycmF5PHN0cmluZz4oKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcGFyYW1ldGVyIGluIHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZGV0RnVuY3Rpb25hbGl0aWVzW2Z1bmN0aW9uYWxpdHldXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/LlBhcmFtZXRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgREVGSU5FRC50c0NoZWNrPEFycmF5PHN0cmluZz4+KHBhcmFtZXRlckxpc3RpbmdbZnVuY3Rpb25hbGl0eV0pLnB1c2gocGFyYW1ldGVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmdW5jdGlvbmFsaXR5UGFyYW1ldGVyID0gbmV3IEFycmF5PHN0cmluZz4oKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGZ1bmN0aW9uYWxpdHkgaW4gcGFyYW1ldGVyTGlzdGluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcGFyYW1ldGVyIG9mIERFRklORUQudHNDaGVjazxBcnJheTxzdHJpbmc+PihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtZXRlckxpc3RpbmdbZnVuY3Rpb25hbGl0eV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb25hbGl0eVBhcmFtZXRlci5wdXNoKGAke2Z1bmN0aW9uYWxpdHl9IC8gJHtwYXJhbWV0ZXJ9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIG5vIHBhcmFtZXRlciBmb3IgdGhlIHNlbGVjdGVkIGZ1bmN0aW9uYWxpdGllcywgYWJvcnQgc2hvd2luZyB0aGUgaW50ZXJmYWNlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZnVuY3Rpb25hbGl0eVBhcmFtZXRlci5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBCdWlsZCBQYXJhbWV0ZXItbGlzdGluZyBhY2NvcmRpbmcgdG8gc2VsZWN0ZWQgZnVuY3Rpb25hbGl0aWVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gUmVzZXQgdGhlIDxYQy1PcHRpb25JbnB1dD4ncyBvcHRpb24tdHJhbnNmb3JtZXIuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbmlucHV0Lm9wdGlvblRyYW5zZm9ybWVyID0gKHRvVHJhbnNmb3JtOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0b1RyYW5zZm9ybS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIFJlc2V0IHRoZSA8WEMtT3B0aW9uSW5wdXQ+J3Mgb3B0aW9uLXRyYW5zZm9ybWVyLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAjcmVnaW9uIFNob3cgdGhlIGludGVyZmFjZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uaW5wdXQubW9kZSA9IFwiRnVuY3Rpb25hbGl0eSBQYXJhbWV0ZXJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uaW5wdXQudGFyZ2V0ID0gYWRkZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbmlucHV0LmVuYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25pbnB1dC5vcHRpb25zID0gZnVuY3Rpb25hbGl0eVBhcmFtZXRlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY0RldGFpbHMuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uaW5wdXQudGFyZ2V0T3B0aW9uVHJhbnNmb3JtZXIgPSAodG9UcmFuc2Zvcm06IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGBkYXRhLWNiLSR7dG9UcmFuc2Zvcm0uc3Vic3RyaW5nKHRvVHJhbnNmb3JtLmluZGV4T2YoXCIvXCIpICsgMSkudHJpbSgpfWA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlTGF5b3V0T3B0aW9uaW5wdXQoYWRkZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVMYXlvdXRDRGV0YWlscyhvcHRpb25pbnB1dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gU2hvdyB0aGUgaW50ZXJmYWNlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAjcmVnaW9uIFNldCBpbml0aWFsIGRvY3VtZW50YXRpb24gZGV0YWlscy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZGV0RnVuY3Rpb25hbGl0aWVzW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uaW5wdXQuY3VycmVudE9wdGlvbi5zdWJzdHJpbmcoMCwgb3B0aW9uaW5wdXQuY3VycmVudE9wdGlvbi5pbmRleE9mKFwiL1wiKSAtIDEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXT8uRGVzY3JpcHRpb25bMF0gPT09IFwiL1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNEZXRhaWxzLmlubmVySFRNTCA9IGA8b2JqZWN0IGRhdGEgPSAnJHt3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmRvY3NBUElbY3VycmVudExhbmd1YWdlXSA9PT0gdW5kZWZpbmVkID8gd2luZG93LkNvZGJpUGx1Z2luRGF0YS5kb2NzQVBJLmVuIDogd2luZG93LkNvZGJpUGx1Z2luRGF0YS5kb2NzQVBJW2N1cnJlbnRMYW5ndWFnZV19JHt3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmRldEZ1bmN0aW9uYWxpdGllc1tvcHRpb25pbnB1dC5jdXJyZW50T3B0aW9uLnN1YnN0cmluZygwLCBvcHRpb25pbnB1dC5jdXJyZW50T3B0aW9uLmluZGV4T2YoXCIvXCIpIC0gMSldPy5EZXNjcmlwdGlvbn0nIHN0eWxlID0gJ3dpZHRoIDogMTAwJSA7IGhlaWdodCA6IDEwMCUgOyBvcGFjaXR5IDogLjggOyc+PC9vYmplY3Q+YDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkb2NMb2FkZXIgPSBjRGV0YWlscy5xdWVyeVNlbGVjdG9yKFwiLkFQSURvY0xvYWRlclwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb2NMb2FkZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvY0xvYWRlci5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjRGV0YWlscy5pbm5lckhUTUwgPSBgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZSA9IFwid2lkdGg6IDEwMCUgOyBoZWlnaHQ6IDEwMCUgOyBvdmVyZmxvdyA6IGF1dG8gO1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHt3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmRvY3NBUElbY3VycmVudExhbmd1YWdlXX0ke3dpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZGV0RnVuY3Rpb25hbGl0aWVzW29wdGlvbmlucHV0LmN1cnJlbnRPcHRpb24uc3Vic3RyaW5nKDAsIG9wdGlvbmlucHV0LmN1cnJlbnRPcHRpb24uaW5kZXhPZihcIi9cIikgLSAxKV0/LkRlc2NyaXB0aW9ufTwvZGl2PmA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBTZXQgaW5pdGlhbCBkb2N1bWVudGF0aW9uIGRldGFpbHMuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNEZXRhaWxzLmlubmVySFRNTCA9IGNEZXRhaWxzLmlubmVySFRNTC5yZXBsYWNlKFwidW5kZWZpbmVkXCIsIFwiXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIFNob3cgbGlzdGluZyBvZiBhdmFpbGFibGUgZnVuY3Rpb25hbGl0eSBwYXJhbWV0ZXIuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBIaWRlIEludGVyZmFjZSBvbiBFU0MuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LmtleSA9PT0gXCJFc2NhcGVcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uaW5wdXQuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY0RldGFpbHMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBIaWRlIEludGVyZmFjZSBvbiBFU0MuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBIaWRlIGludGVyZmFjZSBvbiBibHVyLlxuICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRlZC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWZsYWdNb3VzZU92ZXJDRGV0YWlscykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uaW5wdXQuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY0RldGFpbHMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50Q0RldGFpbEJsdXJBY3Rpb24gPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbmlucHV0LmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY0RldGFpbHMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIEhpZGUgaW50ZXJmYWNlIG9uIGJsdXIuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gSWYgYSBkYXRhLWNiLWZ1bmMgZmllbGQgaXMgZXhpc3RlbnQuLi5cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gRG8gbm90aGluZyBpZiBDb2RCaS1Ub2dnbGUgaXMgbm90IGNoZWNrZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGJpVG9nZ2xlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNmb3JtLWNvZGJpLXByb3AtZW5hYmxlLWlucHV0XCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29kYmlUb2dnbGUgJiYgIShjb2RiaVRvZ2dsZSBhcyBIVE1MSW5wdXRFbGVtZW50KS5jaGVja2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gRG8gbm90aGluZyBpZiBDb2RCaS1Ub2dnbGUgaXMgbm90IGNoZWNrZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gSWYgdGhlcmUgaXMgbm8gZGF0YS1jYi1mdW5jIGZpZWxkIGV4aXN0ZW50Li4uXG4gICAgICAgICAgICAgICAgICAgICAgICAgIElOU1RBTkNFLnRzQ2hlY2s8SFRNTElucHV0RWxlbWVudD4oYWRkZWQsIEhUTUxJbnB1dEVsZW1lbnQpLnBsYWNlaG9sZGVyID0gXCJDb2RCaTogQUxUK0ZcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBDcmVhdGUgYSBkYXRhLWNiLWZ1bmMgZmllbGQgb24gQUxUICsgRi5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkZWQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LmFsdEtleSAmJiBldmVudC5rZXkudG9Mb3dlckNhc2UoKSA9PT0gXCJmXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gRG8gbm90aGluZyBpZiBDb2RCaS1Ub2dnbGUgaXMgbm90IGNoZWNrZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RiaVRvZ2dsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjZm9ybS1jb2RiaS1wcm9wLWVuYWJsZS1pbnB1dFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2RiaVRvZ2dsZSAmJiAhKGNvZGJpVG9nZ2xlIGFzIEhUTUxJbnB1dEVsZW1lbnQpLmNoZWNrZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBEbyBub3RoaW5nIGlmIENvZEJpLVRvZ2dsZSBpcyBub3QgY2hlY2tlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRlZC52YWx1ZSA9IFwiZGF0YS1jYi1mdW5jXCI7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIElOU1RBTkNFLnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBERUZJTkVELnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERFRklORUQudHNDaGVjazxIVE1MRWxlbWVudD4oYWRkZWQucGFyZW50RWxlbWVudCkucGFyZW50RWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKS5xdWVyeVNlbGVjdG9yKFwiLnIyXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkuY2xpY2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIENyZWF0ZSBhIGRhdGEtY2ItZnVuYyBmaWVsZCBvbiBBTFQgKyBGLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIElmIHRoZXJlIGlzIG5vIGRhdGEtY2ItZnVuYyBmaWVsZCBleGlzdGVudC4uLlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICBhZGRlZC5wYXJlbnRFbGVtZW50Py5wYXJlbnRFbGVtZW50Py5xdWVyeVNlbGVjdG9yKFwiLnIxXCIpPy5pbm5lckhUTUwudG9Mb3dlckNhc2UoKSAhPT1cbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZGF0YS1jYi1hcHBseVwiICYmXG4gICAgICAgICAgICAgICAgICAgICAgYWRkZWQucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudD8ucXVlcnlTZWxlY3RvcihcIi5yMVwiKT8uaW5uZXJIVE1MLnRvTG93ZXJDYXNlKCkgIT09XG4gICAgICAgICAgICAgICAgICAgICAgICBcImRhdGEtY2ItZnVuY1wiICYmXG4gICAgICAgICAgICAgICAgICAgICAgYWRkZWQucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudD8ucXVlcnlTZWxlY3RvcihcIi5yMVwiKT8uaW5uZXJIVE1MLmluZGV4T2YoXCJkYXRhLWNiLVwiKSAhPT0gLTFcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2VsbCA9IElOU1RBTkNFLnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KFxuICAgICAgICAgICAgICAgICAgICAgICAgREVGSU5FRC50c0NoZWNrPEhUTUxFbGVtZW50PihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgREVGSU5FRC50c0NoZWNrPEhUTUxFbGVtZW50PihhZGRlZC5wYXJlbnRFbGVtZW50KS5wYXJlbnRFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgKS5xdWVyeVNlbGVjdG9yKFwiLnIyXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRGdW5jdGlvbmFsaXR5UGFyYW1ldGVySW5wdXQgPSBjZWxsLnF1ZXJ5U2VsZWN0b3IoXCJpbnB1dFwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgIGxldCBib3VuZCA9IGZhbHNlOyAvLyBTdGF0ZXMgd2hldGhlciB0aGUgZXBNYW5hZ2VyJ3MgdGFyZ2V0IGlzIGFscmVhZHkgYm91bmQgdG8gdGhpcyA8aW5wdXQ+LlxuXG4gICAgICAgICAgICAgICAgICAgICAgY3VycmVudEZ1bmN0aW9uYWxpdHlQYXJhbWV0ZXJJbnB1dD8uYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBrZXlib2FyZEV2ZW50ID0gSU5TVEFOQ0UudHNDaGVjazxLZXlib2FyZEV2ZW50PihldmVudCwgS2V5Ym9hcmRFdmVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAjcmVnaW9uIElmIEFMVCArIFguLi5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrZXlib2FyZEV2ZW50LmFsdEtleSAmJiAoa2V5Ym9hcmRFdmVudC5rZXkgPT09IFwieFwiIHx8IGtleWJvYXJkRXZlbnQua2V5ID09PSBcIlhcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYXR0cmlidXRlUGFuZWwgPSBJTlNUQU5DRS50c0NoZWNrPEhUTUxFbGVtZW50PihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbIGRhdGEtcGFuZWwtaWQgPVwiYXR0cmlidXRlc1wiXScpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEhUTUxFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZVBhbmVsRm9yY2VkVG9FbmxhcmdlID0gYXR0cmlidXRlUGFuZWwuc3R5bGUucG9zaXRpb24gIT09IFwiZml4ZWRcIjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVQYW5lbC5zdHlsZS5wb3NpdGlvbiA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlUGFuZWwuc3R5bGUucG9zaXRpb24gPT09IFwiZml4ZWRcIiA/IFwicmVsYXRpdmVcIiA6IFwiZml4ZWRcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlUGFuZWwuc3R5bGUuekluZGV4ID0gYXR0cmlidXRlUGFuZWwuc3R5bGUucG9zaXRpb24gPT09IFwiZml4ZWRcIiA/IFwiMTAwMVwiIDogXCIwXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZVBhbmVsLnN0eWxlLmxlZnQgPSBhdHRyaWJ1dGVQYW5lbC5zdHlsZS5wb3NpdGlvbiA9PT0gXCJmaXhlZFwiID8gXCIxMHZoXCIgOiBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVQYW5lbC5zdHlsZS50b3AgPSBhdHRyaWJ1dGVQYW5lbC5zdHlsZS5wb3NpdGlvbiA9PT0gXCJmaXhlZFwiID8gXCIxMHZ3XCIgOiBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVQYW5lbC5zdHlsZS53aWR0aCA9IGF0dHJpYnV0ZVBhbmVsLnN0eWxlLnBvc2l0aW9uID09PSBcImZpeGVkXCIgPyBcIjgwdndcIiA6IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZVBhbmVsLnN0eWxlLmhlaWdodCA9IGF0dHJpYnV0ZVBhbmVsLnN0eWxlLnBvc2l0aW9uID09PSBcImZpeGVkXCIgPyBcImZpdC1jb250ZW50XCIgOiBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVQYW5lbC5zdHlsZS5ib3hTaGFkb3cgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZVBhbmVsLnN0eWxlLnBvc2l0aW9uID09PSBcImZpeGVkXCIgPyBcIjAgMCAxZW0gZGFya29yYW5nZVwiIDogXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlUGFuZWwuc3R5bGUuYm9yZGVyUmFkaXVzID0gYXR0cmlidXRlUGFuZWwuc3R5bGUucG9zaXRpb24gPT09IFwiZml4ZWRcIiA/IFwiLjVlbVwiIDogXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlUGFuZWwuc3R5bGUuYm9yZGVyQ29sb3IgPSBhdHRyaWJ1dGVQYW5lbC5zdHlsZS5wb3NpdGlvbiA9PT0gXCJmaXhlZFwiID8gXCJibGFja1wiIDogXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlUGFuZWwuc3R5bGUudHJhbnNpdGlvbiA9IGF0dHJpYnV0ZVBhbmVsLnN0eWxlLnBvc2l0aW9uID09PSBcImZpeGVkXCIgPyBcIjFzIGFsbFwiIDogXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlUGFuZWwuc3R5bGUuYm9yZGVyID0gYXR0cmlidXRlUGFuZWwuc3R5bGUucG9zaXRpb24gPT09IFwiZml4ZWRcIiA/IFwic29saWRcIiA6IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIElmIEFMVCArIFguLi5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gSWYgQUxUICsgRS4uLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleWJvYXJkRXZlbnQuYWx0S2V5ICYmIGtleWJvYXJkRXZlbnQua2V5LnRvTG93ZXJDYXNlKCkgPT09IFwiZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gUHJldmVudCBkZWZhdWx0IGFjdGlvbnMgJiBidWJibGluZy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAga2V5Ym9hcmRFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBrZXlib2FyZEV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBrZXlib2FyZEV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIFByZXZlbnQgZGVmYXVsdCBhY3Rpb25zICYgYnViYmxpbmcuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVwTWFuYWdlci5tb2RlID0gXCJTVlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBlcE1hbmFnZXIubW9kZSA9IFwiRVBcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBSZWJ1aWxkIGxpc3RpbmcuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIElOU1RBTkNFLnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2RpdltpcyA9IFwieGMtZXBtYW5hZ2VyXCJdJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICkuc2V0QXR0cmlidXRlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZXBvcHRpb25zXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgSlNPTi5wYXJzZSh3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmZzbEVsZW1lbnRwbGFjZWhvbGRlcilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoKGZpbGU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmlsZS5sYXN0SW5kZXhPZihcIi5cIikgIT09IC0xID8gZmlsZS5zdWJzdHJpbmcoMCwgZmlsZS5sYXN0SW5kZXhPZihcIi5cIikpIDogZmlsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuam9pbihcIixcIiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gUmVidWlsZCBsaXN0aW5nLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGaXJzdCB0aW1lIGxvYWQgb2YgQVBJRG9jXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjRGV0YWlscy5xdWVyeVNlbGVjdG9yKFwib2JqZWN0XCIpID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY0RldGFpbHMuaW5uZXJIVE1MID0gXCI8b2JqZWN0IHN0eWxlID0gJ3dpZHRoIDogMTAwJSA7IGhlaWdodDogMTAwJSA7Jz48L29iamVjdD5cIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIERFRklORUQudHNDaGVjazxIVE1MT2JqZWN0RWxlbWVudD4oY0RldGFpbHMucXVlcnlTZWxlY3RvcihcIm9iamVjdFwiKSkuc2V0QXR0cmlidXRlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZGF0YVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGAke3dpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZG9jc0FQSVtjdXJyZW50TGFuZ3VhZ2VdID09PSB1bmRlZmluZWQgPyB3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmRvY3NBUEkuZW4gOiB3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmRvY3NBUElbY3VycmVudExhbmd1YWdlXX0ke3dpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZGV0RWxlbWVudHBsYWNlaG9sZGVyW2VwTWFuYWdlci5jdXJyZW50T3B0aW9uXT8uRGVzY3JpcHRpb259YCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAjcmVnaW9uIFNob3cgaW50ZXJmYWNlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICBlcE1hbmFnZXIuZW5hYmxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVwTWFuYWdlci5lbnRlcmluZ0VQID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY0RldGFpbHMuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVMYXlvdXRFUE1hbmFnZXIoY2VsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZUxheW91dENEZXRhaWxzKGVwTWFuYWdlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gU2hvdyBpbnRlcmZhY2UuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gQmluZCBlcE1hbmFnZXIncyB0YXJnZXQgdG8gdGhpcyA8aW5wdXQ+IGV2YWRpbmcgdW5uZWNlc3NhcnkgbXVsdGlwbGUgYmluZGluZy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFib3VuZCAmJiBldmVudC50YXJnZXQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBib3VuZCA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcE1hbmFnZXIudGFyZ2V0ID0gSU5TVEFOQ0UudHNDaGVjazxIVE1MSW5wdXRFbGVtZW50PihldmVudC50YXJnZXQsIEhUTUxJbnB1dEVsZW1lbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gQmluZCBlcE1hbmFnZXIncyB0YXJnZXQgdG8gdGhpcyA8aW5wdXQ+IGV2YWRpbmcgdW5uZWNlc3NhcnkgbXVsdGlwbGUgYmluZGluZy5cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gSWYgQUxUICsgRS4uLlxuICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gSGlkZSBDb2RCaS1JbnRlcmZhY2Ugb24gbGVhdmluZyA8aW5wdXQ+LlxuICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRGdW5jdGlvbmFsaXR5UGFyYW1ldGVySW5wdXQ/LmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBFbmQgZm9yY2VkIGVubGFyZ2VtZW50IG9mIHRoZSBhdHRyaWJ1dGVzIHBhbmVsLCBpZiBuZWNlc3NhcnkuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXR0cmlidXRlUGFuZWxGb3JjZWRUb0VubGFyZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYXR0cmlidXRlUGFuZWwgPSBJTlNUQU5DRS50c0NoZWNrPEhUTUxFbGVtZW50PihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbIGRhdGEtcGFuZWwtaWQgPVwiYXR0cmlidXRlc1wiXScpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEhUTUxFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZVBhbmVsRm9yY2VkVG9FbmxhcmdlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZVBhbmVsLnN0eWxlLnBvc2l0aW9uID0gXCJyZWxhdGl2ZVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVQYW5lbC5zdHlsZS56SW5kZXggPSBcIjBcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlUGFuZWwuc3R5bGUubGVmdCA9IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZVBhbmVsLnN0eWxlLnRvcCA9IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZVBhbmVsLnN0eWxlLndpZHRoID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlUGFuZWwuc3R5bGUuaGVpZ2h0ID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlUGFuZWwuc3R5bGUuYm94U2hhZG93ID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlUGFuZWwuc3R5bGUuYm9yZGVyUmFkaXVzID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlUGFuZWwuc3R5bGUuYm9yZGVyQ29sb3IgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVQYW5lbC5zdHlsZS5ib3JkZXIgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVQYW5lbC5zdHlsZS50cmFuc2l0aW9uID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gRW5kIGZvcmNlZCBlbmxhcmdlbWVudCBvZiB0aGUgYXR0cmlidXRlcyBwYW5lbCwgaWYgbmVjZXNzYXJ5LlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmbGFnTW91c2VPdmVyQ0RldGFpbHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZXBNYW5hZ2VyLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY0RldGFpbHMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudENEZXRhaWxCbHVyQWN0aW9uID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVwTWFuYWdlci5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY0RldGFpbHMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gSGlkZSBDb2RCaS1JbnRlcmZhY2Ugb24gbGVhdmluZyA8aW5wdXQ+LlxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgLy8gI2VuZHJlZ2lvbiBQYXJhbWV0ZXJjZWxsc1xuICAgICAgICAgIHBhcmFtQ2VsbE9ic2VydmVyLm9ic2VydmUoXG4gICAgICAgICAgICBJTlNUQU5DRS50c0NoZWNrPEhUTUxFbGVtZW50PihcbiAgICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2lkPVwidGFic1JpZ2h0OmV4dGVuZGVkVGFiXCJdIC54bS1lZGl0b3ItcGFuZWwnKSxcbiAgICAgICAgICAgICAgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgICAgICAgIHN1YnRyZWU6IHRydWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBpZiAoYXR0cmlidXRlc0VkaXRvclByb2Nlc3NlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGF0dHJpYnV0ZXNFZGl0b3JQcm9jZXNzZWQgPSB0cnVlO1xuXG4gICAgICAgICAgY29uc3QgcmVnaXN0ZXJlZENlbGxzID0gbmV3IEFycmF5PEhUTUxFbGVtZW50PigpO1xuXG4gICAgICAgICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigobXV0YXRpb25zTGlzdCwgb2JzZXJ2ZXIpID0+IHtcbiAgICAgICAgICAgIC8vICNyZWdpb24gUHJvY2VzcyBlYWNoIGVsZW1lbnQgb2YgY2xhc3Mgc2xpY2stcm93XG4gICAgICAgICAgICBmb3IgKGNvbnN0IG11dGF0aW9uIG9mIG11dGF0aW9uc0xpc3QpIHtcbiAgICAgICAgICAgICAgaWYgKG11dGF0aW9uLnR5cGUgPT09IFwiY2hpbGRMaXN0XCIpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGFkZGVkIG9mIG11dGF0aW9uLmFkZGVkTm9kZXMpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGFkZGVkSFRNTEVsZW1lbnQgPSBJTlNUQU5DRS50c0NoZWNrPEhUTUxFbGVtZW50PihhZGRlZCwgSFRNTEVsZW1lbnQpO1xuXG4gICAgICAgICAgICAgICAgICBpZiAoYWRkZWRIVE1MRWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoXCJzbGljay1yb3dcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBSZWdpc3RlciBlYWNoIGNlbGwgb2YgY2xhc3MgLnIyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNlbGwgPSBJTlNUQU5DRS50c0NoZWNrPEhUTUxFbGVtZW50PihhZGRlZEhUTUxFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCIucjJcIiksIEhUTUxFbGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBSZWdpc3RlciBLZXlibG9ja2VyIHRvIGJsb2NrIGtleXN0cm9rZXMgZm9yIGEgY2VydGFpbiBhbW91bnQgb2YgdGltZSBhZnRlciBhIENvZEJpLU9wdGlvbiB3YXMgc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQua2V5ICE9PSBcIixcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5rZXkgIT09IFwiVGFiXCIgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAga2V5c3Ryb2tlQmxvY2tpbmdTdGFydCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICBrZXlzdHJva2VCbG9ja2luZ1N0YXJ0LmdldFRpbWUoKSArIDEwMDAgPj0gbmV3IERhdGUoKS5nZXRUaW1lKClcbiAgICAgICAgICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleXN0cm9rZUJsb2NraW5nU3RhcnQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBSZWdpc3RlciBLZXlibG9ja2VyIHRvIGJsb2NrIGtleXN0cm9rZXMgZm9yIGEgY2VydGFpbiBhbW91bnQgb2YgdGltZSBhZnRlciBhIENvZEJpLU9wdGlvbiB3YXMgc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiAgQmxlbmRzIGluIHRoZSBDb2RCaS1JbnRlcmZhY2UgZXZlbiB3aGVuIG5vdCBjbGlja2VkIG9uIGFub3RoZXIgY2VsbCBiZWZvcmUuXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgIEEgbmV3IDxpbnB1dD4gaXMgdGhlbiBjcmVhdGVkIHdoZW4gdGhlIGN1cnJlbnQgb25lIGxvb3NlcyBmb2N1cyB3aXRob3V0IGFub3RoZXIgY2VsbFxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgICBoYXZpbmcgYmVlbiBjbGlja2VkLlxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjZWxsT2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigobXV0YXRpb25zTGlzdCwgb2JzZXJ2ZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IG11dGF0aW9uIG9mIG11dGF0aW9uc0xpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtdXRhdGlvbi50eXBlID09PSBcImNoaWxkTGlzdFwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgYWRkZWQgb2YgbXV0YXRpb24uYWRkZWROb2Rlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9ubHkgaWYgdGhlIDxpbnB1dD4gaXMgZm9yIGEgW2RhdGEtY2ItZnVuY10tYXR0cmlidXRlZmllbGQuLi5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBJTlNUQU5DRS50c0NoZWNrPEhUTUxFbGVtZW50PihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgREVGSU5FRC50c0NoZWNrPEhUTUxFbGVtZW50PihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBERUZJTkVELnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KGFkZGVkLnBhcmVudEVsZW1lbnQpLnBhcmVudEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkucXVlcnlTZWxlY3RvcihcIi5yMVwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICApLmlubmVySFRNTC50b0xvd2VyQ2FzZSgpID09PSBcImRhdGEtY2ItZnVuY1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWRkZWRIVE1MRWxlbWVudC5jbGFzc0xpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFkZGVkSFRNTEVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiZWRpdG9yLXRleHRcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWVwTWFuYWdlci5lbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcE1hbmFnZXIuZW5hYmxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjRGV0YWlscy5zdHlsZS5kaXNwbGF5ICE9PSBcImJsb2NrXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNEZXRhaWxzLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gRGlzYWJsZSBDb2RCaS1JbnRlcmZhY2Ugd2hlbiB0aGlzIG5ld2x5IGNyZWF0ZWQgPGlucHV0PiBsb29zZXMgZm9jdXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRlZEhUTUxFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmbGFnTW91c2VPdmVyQ0RldGFpbHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXBNYW5hZ2VyLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY0RldGFpbHMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudENEZXRhaWxCbHVyQWN0aW9uID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVwTWFuYWdlci5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY0RldGFpbHMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gRGlzYWJsZSBDb2RCaS1JbnRlcmZhY2Ugd2hlbiB0aGlzIG5ld2x5IGNyZWF0ZWQgPGlucHV0PiBsb29zZXMgZm9jdXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGNlbGxPYnNlcnZlci5vYnNlcnZlKGNlbGwsIHtcbiAgICAgICAgICAgICAgICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIEJsZW5kcyBpbiB0aGUgQ29kQmktSW50ZXJmYWNlIGV2ZW4gd2hlbiBub3QgY2xpY2tlZCBvbiBhbm90aGVyIGNlbGwgYmVmb3JlLlxuICAgICAgICAgICAgICAgICAgICBpZiAocmVnaXN0ZXJlZENlbGxzLmluY2x1ZGVzKGNlbGwpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZWdpc3RlcmVkQ2VsbHMucHVzaChjZWxsKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIGNvcnJlc3BvbmRpbmcgY2VsbCBvZiBjbGFzcyAucjEgaGFzIFwiZGF0YS1jYi1mdW5jXCIgKGNhc2UgaW5zZW5zaXRpdmUpLi4uXG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICBJTlNUQU5DRS50c0NoZWNrPEhUTUxFbGVtZW50PihcbiAgICAgICAgICAgICAgICAgICAgICAgIERFRklORUQudHNDaGVjazxIVE1MRWxlbWVudD4oY2VsbC5wYXJlbnRFbGVtZW50KS5xdWVyeVNlbGVjdG9yKFwiLnIxXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAgICAgKS5pbm5lckhUTUwudG9Mb3dlckNhc2UoKSA9PT0gXCJkYXRhLWNiLWZ1bmNcIlxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50RnVuY3Rpb25hbGl0eUlucHV0ID0gY2VsbC5xdWVyeVNlbGVjdG9yKFwiaW5wdXRcIik7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gSWYgYSBuZXcgPGlucHV0PiB3YXMgZ2VuZXJhdGVkIGJ5IGNsaWNraW5nIGludG8gYSBjZWxsIG9mIGNsYXNzIC5yMlxuICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50RnVuY3Rpb25hbGl0eUlucHV0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAjcmVnaW9uIEhpZGUgU1ZNYW5hZ2VyIGFuZCBBUEktRG9jcyBvbiBibHVyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50RnVuY3Rpb25hbGl0eUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmbGFnTW91c2VPdmVyQ0RldGFpbHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcE1hbmFnZXIuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNEZXRhaWxzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50Q0RldGFpbEJsdXJBY3Rpb24gPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcE1hbmFnZXIuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY0RldGFpbHMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBIaWRlIFNWTWFuYWdlciBhbmQgQVBJLURvY3Mgb24gYmx1clxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudEZ1bmN0aW9uYWxpdHlJbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBIaWRlIFNWTWFuYWdlciBhbmQgQVBJLURvY3Mgb24gRVNDXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChldmVudC5rZXkgPT09IFwiRXNjYXBlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXBNYW5hZ2VyLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjRGV0YWlscy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBIaWRlIFNWTWFuYWdlciBhbmQgQVBJLURvY3Mgb24gRVNDXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICNyZWdpb24gU2hvdyBpbnRlcmZhY2UuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAjcmVnaW9uIFJlZnJlc2ggbGlzdGluZy5cbiAgICAgICAgICAgICAgICAgICAgICAgIElOU1RBTkNFLnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KFxuICAgICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdkaXZbaXMgPSBcInhjLWVwbWFuYWdlclwiXScpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICkuc2V0QXR0cmlidXRlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICBcIm9wdGlvbnNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgSlNPTi5wYXJzZSh3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmZzbEZ1bmN0aW9uYWxpdGllcylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKChmaWxlOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWxlLmxhc3RJbmRleE9mKFwiLlwiKSAhPT0gLTEgPyBmaWxlLnN1YnN0cmluZygwLCBmaWxlLmxhc3RJbmRleE9mKFwiLlwiKSkgOiBmaWxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLmpvaW4oXCIsXCIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gUmVmcmVzaCBsaXN0aW5nLlxuICAgICAgICAgICAgICAgICAgICAgICAgZXBNYW5hZ2VyLm1vZGUgPSBcIlNWXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcE1hbmFnZXIudGFyZ2V0ID0gY3VycmVudEZ1bmN0aW9uYWxpdHlJbnB1dDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVwTWFuYWdlci5lbmFibGVkID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY0RldGFpbHMuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlTGF5b3V0RVBNYW5hZ2VyKGNlbGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlTGF5b3V0Q0RldGFpbHMoZXBNYW5hZ2VyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gU2hvdyBpbnRlcmZhY2UuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIFN0eWxlIFNWTWFuYWdlciBpbmNsdWRpbmcgZGltZW5zaW9ucyBhbmQgdGFyZ2V0IGlucHV0IHNldHRpbmdcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gI3JlZ2lvbiBWaWV3IGNvcnJlc3BvbmRpbmcgQVBJLURvY1xuICAgICAgICAgICAgICAgICAgICBlcE1hbmFnZXIub25PcHRpb25DaGFuZ2VkLnB1c2goKG5ld09wdGlvbjogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYgKG5ld09wdGlvbiA9PT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gREVGSU5FRC50c0NoZWNrPHN0cmluZz4oXG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuQ29kYmlQbHVnaW5EYXRhW1xuICAgICAgICAgICAgICAgICAgICAgICAgICBlcE1hbmFnZXIubW9kZSA9PT0gXCJTVlwiID8gXCJkZXRGdW5jdGlvbmFsaXRpZXNcIiA6IFwiZGV0RWxlbWVudHBsYWNlaG9sZGVyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIF1bbmV3T3B0aW9uLnJlcGxhY2UoXCIuanNcIiwgXCJcIikudG9Mb3dlckNhc2UoKV0/LkRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICAgICAgICBpZiAoZGVzY3JpcHRpb25bMF0gPT09IFwiL1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjRGV0YWlscy5pbm5lckhUTUwgPSBgPG9iamVjdCBkYXRhID0gJyR7YmFzZURvY1VSTH0ke2Rlc2NyaXB0aW9ufScgc3R5bGUgPSAnd2lkdGggOiAxMDAlIDsgaGVpZ2h0IDogMTAwJSA7IG9wYWNpdHkgOiAuOCA7Jz48L29iamVjdD5gO1xuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjRGV0YWlscy5pbm5lckhUTUwgPSBgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZSA9IFwid2lkdGg6IDEwMCUgOyBoZWlnaHQ6IDEwMCUgOyBvdmVyZmxvdyA6IGF1dG8gO1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHtkZXNjcmlwdGlvbn08L2Rpdj5gO1xuICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgIGNEZXRhaWxzLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAvLyAjZW5kcmVnaW9uIFZpZXcgY29ycmVzcG9uZGluZyBBUEktRG9jXG4gICAgICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gUmVnaXN0ZXIgZWFjaCBjZWxsIG9mIGNsYXNzIC5yMlxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gI2VuZHJlZ2lvbiBQcm9jZXNzIGVhY2ggZWxlbWVudCBvZiBjbGFzcyBzbGljay1yb3dcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIG9ic2VydmVyLm9ic2VydmUoXG4gICAgICAgICAgICBJTlNUQU5DRS50c0NoZWNrPEhUTUxFbGVtZW50PihcbiAgICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2lkPVwidGFic1JpZ2h0OmV4dGVuZGVkVGFiXCJdIC5ncmlkLWNhbnZhcycpLFxuICAgICAgICAgICAgICBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAvLyAjZW5kcmVnaW9uIEV4dGVuZCB0aGUgZXh0ZW5kZWQgdGFiLlxuICAgICAgLy8gI2VuZHJlZ2lvbiBTZXR1cCBBdHRyaWJ1dGVzLUVkaXRvciBNb25pdG9yaW5nXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUuaW5mbyhcbiAgICAgICAgXCJVbmFibGUgdG8gcmVnaXN0ZXIgPFhDLUVQTWFuYWdlcj4gJiA8WEMtT3B0aW9uSW5wdXQ+LiBGdW5jdGlvbmFsaXRpZXMgaGF2ZSB0byBiZSBzcGVjaWZpZWQgbWFudWFsbHkuXCIsXG4gICAgICApO1xuICAgIH1cbiAgfSk7XG59XG4iLCAiLyoqXHJcbiAqIFByb3ZpZGVzIGEgKipEKiplc2lnbiAqKkIqKnkgKipDKipvbnRyYWN0IEZyYW1ld29yayB1c2luZyBkZWNvcmF0b3JzLlxyXG4gKlxyXG4gKiBAcmVtYXJrc1xyXG4gKiBNYWludGFpbmVyOiBDYWxsYXJpLCBTYWx2YXRvcmUgKFhEQkNAV2FYQ29kZS5uZXQpICovXHJcbmV4cG9ydCBjbGFzcyBEQkMge1xyXG5cdC8vICNyZWdpb24gUGFyYW1ldGVyLXZhbHVlIHJlcXVlc3RzLlxyXG5cdC8qKiBTdG9yZXMgYWxsIHJlcXVlc3QgZm9yIHBhcmFtZXRlciB2YWx1ZXMgcmVnaXN0ZXJlZCBieSB7QGxpbmsgZGVjUHJlY29uZGl0aW9uIH0uICovXHJcblx0c3RhdGljIHBhcmFtVmFsdWVSZXF1ZXN0czogTWFwPFxyXG5cdFx0b2JqZWN0LFxyXG5cdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBHb3R0YSBiZSBhbnkgc2luY2UgcGFyYW1ldGVyLXZhbHVlcyBtYXkgYmUgdW5kZWZpbmVkLlxyXG5cdFx0TWFwPHN0cmluZyB8IHN5bWJvbCwgTWFwPG51bWJlciwgQXJyYXk8KHZhbHVlOiBhbnkpID0+IHVuZGVmaW5lZD4+PlxyXG5cdD4gPSBuZXcgTWFwPFxyXG5cdFx0b2JqZWN0LFxyXG5cdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBHb3R0YSBiZSBhbnkgc2luY2UgcGFyYW1ldGVyLXZhbHVlcyBtYXkgYmUgdW5kZWZpbmVkLlxyXG5cdFx0TWFwPHN0cmluZyB8IHN5bWJvbCwgTWFwPG51bWJlciwgQXJyYXk8KHZhbHVlOiBhbnkpID0+IHVuZGVmaW5lZD4+PlxyXG5cdD4oKTtcclxuXHQvKipcclxuXHQgKiBNYWtlIGEgcmVxdWVzdCB0byBnZXQgdGhlIHZhbHVlIG9mIGEgY2VydGFpbiBwYXJhbWV0ZXIgb2Ygc3BlY2lmaWMgbWV0aG9kIGluIGEgc3BlY2lmaWMge0BsaW5rIG9iamVjdCB9LlxyXG5cdCAqIFRoYXQgcmVxdWVzdCBnZXRzIGVubGlzdGVkIGluIHtAbGluayBwYXJhbVZhbHVlUmVxdWVzdHMgfSB3aGljaCBpcyB1c2VkIGJ5IHtAbGluayBQYXJhbXZhbHVlUHJvdmlkZXJ9IHRvIGludm9rZSB0aGVcclxuXHQgKiBnaXZlbiBcInJlY2VwdG9yXCIgd2l0aCB0aGUgcGFyYW1ldGVyIHZhbHVlIHN0b3JlZCBpbiB0aGVyZS4gVGh1cyBhIHBhcmFtZXRlciBkZWNvcmF0b3IgdXNpbmcgdGhpcyBtZXRob2Qgd2lsbFxyXG5cdCAqIG5vdCByZWNlaXZlIGFueSB2YWx1ZSBvZiB0aGUgdG9wIG1ldGhvZCBpcyBub3QgdGFnZ2VkIHdpdGgge0BsaW5rIFBhcmFtdmFsdWVQcm92aWRlcn0uXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdGFyZ2V0XHRcdFRoZSB7QGxpbmsgb2JqZWN0IH0gY29udGFpbmluZyB0aGUgbWV0aG9kIHdpdGggdGhlIHBhcmFtZXRlciB3aGljaCdzIHZhbHVlIGlzIHJlcXVlc3RlZC5cclxuXHQgKiBAcGFyYW0gbWV0aG9kTmFtZVx0VGhlIG5hbWUgb2YgdGhlIG1ldGhvZCB3aXRoIHRoZSBwYXJhbWV0ZXIgd2hpY2gncyB2YWx1ZSBpcyByZXF1ZXN0ZWQuXHJcblx0ICogQHBhcmFtIGluZGV4XHRcdFx0VGhlIGluZGV4IG9mIHRoZSBwYXJhbWV0ZXIgd2hpY2gncyB2YWx1ZSBpcyByZXF1ZXN0ZWQuXHJcblx0ICogQHBhcmFtIHJlY2VwdG9yXHRcdFRoZSBtZXRob2QgdGhlIHJlcXVlc3RlZCBwYXJhbWV0ZXItdmFsdWUgc2hhbGwgYmUgcGFzc2VkIHRvIHdoZW4gaXQgYmVjb21lcyBhdmFpbGFibGUuICovXHJcblx0cHJvdGVjdGVkIHN0YXRpYyByZXF1ZXN0UGFyYW1WYWx1ZShcclxuXHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0bWV0aG9kTmFtZTogc3RyaW5nIHwgc3ltYm9sLFxyXG5cdFx0aW5kZXg6IG51bWJlcixcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogR290dGEgYmUgYW55IHNpbmNlIHBhcmFtZXRlci12YWx1ZXMgbWF5IGJlIHVuZGVmaW5lZC5cclxuXHRcdHJlY2VwdG9yOiAodmFsdWU6IGFueSkgPT4gdW5kZWZpbmVkLFxyXG5cdCk6IHVuZGVmaW5lZCB7XHJcblx0XHRpZiAoREJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5oYXModGFyZ2V0KSkge1xyXG5cdFx0XHRpZiAoREJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5nZXQodGFyZ2V0KS5oYXMobWV0aG9kTmFtZSkpIHtcclxuXHRcdFx0XHRpZiAoREJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5nZXQodGFyZ2V0KS5nZXQobWV0aG9kTmFtZSkuaGFzKGluZGV4KSkge1xyXG5cdFx0XHRcdFx0REJDLnBhcmFtVmFsdWVSZXF1ZXN0c1xyXG5cdFx0XHRcdFx0XHQuZ2V0KHRhcmdldClcclxuXHRcdFx0XHRcdFx0LmdldChtZXRob2ROYW1lKVxyXG5cdFx0XHRcdFx0XHQuZ2V0KGluZGV4KVxyXG5cdFx0XHRcdFx0XHQucHVzaChyZWNlcHRvcik7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdERCQy5wYXJhbVZhbHVlUmVxdWVzdHNcclxuXHRcdFx0XHRcdFx0LmdldCh0YXJnZXQpXHJcblx0XHRcdFx0XHRcdC5nZXQobWV0aG9kTmFtZSlcclxuXHRcdFx0XHRcdFx0LnNldChpbmRleCwgbmV3IEFycmF5PCh2YWx1ZTogdW5rbm93bikgPT4gdW5kZWZpbmVkPihyZWNlcHRvcikpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHREQkMucGFyYW1WYWx1ZVJlcXVlc3RzXHJcblx0XHRcdFx0XHQuZ2V0KHRhcmdldClcclxuXHRcdFx0XHRcdC5zZXQoXHJcblx0XHRcdFx0XHRcdG1ldGhvZE5hbWUsXHJcblx0XHRcdFx0XHRcdG5ldyBNYXA8bnVtYmVyLCBBcnJheTwodmFsdWU6IHVua25vd24pID0+IHVuZGVmaW5lZD4+KFtcclxuXHRcdFx0XHRcdFx0XHRbaW5kZXgsIG5ldyBBcnJheTwodmFsdWU6IHVua25vd24pID0+IHVuZGVmaW5lZD4ocmVjZXB0b3IpXSxcclxuXHRcdFx0XHRcdFx0XSksXHJcblx0XHRcdFx0XHQpO1xyXG5cdFx0XHR9XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHREQkMucGFyYW1WYWx1ZVJlcXVlc3RzLnNldChcclxuXHRcdFx0XHR0YXJnZXQsXHJcblx0XHRcdFx0bmV3IE1hcDxcclxuXHRcdFx0XHRcdHN0cmluZyB8IHN5bWJvbCxcclxuXHRcdFx0XHRcdE1hcDxudW1iZXIsIEFycmF5PCh2YWx1ZTogdW5rbm93bikgPT4gdW5kZWZpbmVkPj5cclxuXHRcdFx0XHQ+KFtcclxuXHRcdFx0XHRcdFtcclxuXHRcdFx0XHRcdFx0bWV0aG9kTmFtZSxcclxuXHRcdFx0XHRcdFx0bmV3IE1hcDxudW1iZXIsIEFycmF5PCh2YWx1ZTogdW5rbm93bikgPT4gdW5kZWZpbmVkPj4oW1xyXG5cdFx0XHRcdFx0XHRcdFtpbmRleCwgbmV3IEFycmF5PCh2YWx1ZTogdW5rbm93bikgPT4gdW5kZWZpbmVkPihyZWNlcHRvcildLFxyXG5cdFx0XHRcdFx0XHRdKSxcclxuXHRcdFx0XHRcdF0sXHJcblx0XHRcdFx0XSksXHJcblx0XHRcdCk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHVuZGVmaW5lZDtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogQSBtZXRob2QtZGVjb3JhdG9yIGZhY3RvcnkgY2hlY2tpbmcgdGhlIHtAbGluayBwYXJhbVZhbHVlUmVxdWVzdHMgfSBmb3IgdmFsdWUtcmVxdWVzdHMgb2YgdGhlIG1ldGhvZCdzIHBhcmFtZXRlciB0aHVzXHJcblx0ICogYWxzbyB1c2FibGUgb24gc2V0dGVycy5cclxuXHQgKiBXaGVuIGZvdW5kIGl0IHdpbGwgaW52b2tlIHRoZSBcInJlY2VwdG9yXCIgcmVnaXN0ZXJlZCB0aGVyZSwgaW50ZXIgYWxpYSBieSB7QGxpbmsgcmVxdWVzdFBhcmFtVmFsdWUgfSwgd2l0aCB0aGVcclxuXHQgKiBwYXJhbWV0ZXIncyB2YWx1ZS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0YXJnZXQgXHRcdFRoZSB7QGxpbmsgb2JqZWN0IH0gaG9zdGluZyB0aGUgdGFnZ2VkIG1ldGhvZCBhcyBwcm92aWRlZCBieSB0aGUgcnVudGltZS5cclxuXHQgKiBAcGFyYW0gcHJvcGVydHlLZXkgXHRUaGUgdGFnZ2VkIG1ldGhvZCdzIG5hbWUgYXMgcHJvdmlkZWQgYnkgdGhlIHJ1bnRpbWUuXHJcblx0ICogQHBhcmFtIGRlc2NyaXB0b3IgXHRUaGUge0BsaW5rIFByb3BlcnR5RGVzY3JpcHRvciB9IGFzIHByb3ZpZGVkIGJ5IHRoZSBydW50aW1lLlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgVGhlIHtAbGluayBQcm9wZXJ0eURlc2NyaXB0b3IgfSB0aGF0IHdhcyBwYXNzZWQgYnkgdGhlIHJ1bnRpbWUuICovXHJcblx0cHVibGljIHN0YXRpYyBQYXJhbXZhbHVlUHJvdmlkZXIoXHJcbiAgICB0YXJnZXQ6IG9iamVjdCwgLy8gJ3RhcmdldCcgd2lsbCBiZSB0aGUgcHJvdG90eXBlIG9mIHRoZSBjbGFzcyBmb3IgaW5zdGFuY2UgbWV0aG9kc1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIG9yIHRoZSBjb25zdHJ1Y3RvciBmdW5jdGlvbiBpdHNlbGYgZm9yIHN0YXRpYyBtZXRob2RzXHJcbiAgICBwcm9wZXJ0eUtleTogc3RyaW5nLFxyXG4gICAgZGVzY3JpcHRvcjogUHJvcGVydHlEZXNjcmlwdG9yLFxyXG4pOiBQcm9wZXJ0eURlc2NyaXB0b3Ige1xyXG5cdFx0Y29uc3Qgb3JpZ2luYWxNZXRob2QgPSBkZXNjcmlwdG9yLnZhbHVlO1xyXG5cdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBHb3R0YSBiZSBhbnkgc2luY2UgcGFyYW1ldGVyLXZhbHVlcyBtYXkgYmUgdW5kZWZpbmVkLlxyXG5cdFx0ZGVzY3JpcHRvci52YWx1ZSA9IGZ1bmN0aW9uICguLi5hcmdzOiBhbnlbXSkge1xyXG5cdFx0XHQvLyAjcmVnaW9uICAgQ2hlY2sgaWYgYSB2YWx1ZSBvZiBvbmUgb2YgdGhlIG1ldGhvZCdzIHBhcmFtZXRlciBoYXMgYmVlbiByZXF1ZXN0ZWQgYW5kIHBhc3MgaXQgdG8gdGhlXHJcblx0XHRcdC8vICAgICAgICAgICByZWNlcHRvciwgaWYgc28uXHJcblx0XHRcdGlmIChcclxuXHRcdFx0XHREQkMucGFyYW1WYWx1ZVJlcXVlc3RzLmhhcyh0YXJnZXQpICYmXHJcblx0XHRcdFx0REJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5nZXQodGFyZ2V0KS5oYXMocHJvcGVydHlLZXkpXHJcblx0XHRcdCkge1xyXG5cdFx0XHRcdGZvciAoY29uc3QgaW5kZXggb2YgREJDLnBhcmFtVmFsdWVSZXF1ZXN0c1xyXG5cdFx0XHRcdFx0LmdldCh0YXJnZXQpXHJcblx0XHRcdFx0XHQuZ2V0KHByb3BlcnR5S2V5KVxyXG5cdFx0XHRcdFx0LmtleXMoKSkge1xyXG5cdFx0XHRcdFx0aWYgKGluZGV4IDwgYXJncy5sZW5ndGgpIHtcclxuXHRcdFx0XHRcdFx0Zm9yIChjb25zdCByZWNlcHRvciBvZiBEQkMucGFyYW1WYWx1ZVJlcXVlc3RzXHJcblx0XHRcdFx0XHRcdFx0LmdldCh0YXJnZXQpXHJcblx0XHRcdFx0XHRcdFx0LmdldChwcm9wZXJ0eUtleSlcclxuXHRcdFx0XHRcdFx0XHQuZ2V0KGluZGV4KSkge1xyXG5cdFx0XHRcdFx0XHRcdHJlY2VwdG9yKGFyZ3NbaW5kZXhdKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHQvLyAjZW5kcmVnaW9uXHRDaGVjayBpZiBhIHZhbHVlIG9mIG9uZSBvZiB0aGUgbWV0aG9kJ3MgcGFyYW1ldGVyIGhhcyBiZWVuIHJlcXVlc3RlZCBhbmQgcGFzcyBpdCB0byB0aGVcclxuXHRcdFx0Ly8gICAgICAgICAgICAgIHJlY2VwdG9yLCBpZiBzby5cclxuXHRcdFx0cmV0dXJuIG9yaWdpbmFsTWV0aG9kLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG5cdFx0fTtcclxuXHJcblx0XHRyZXR1cm4gZGVzY3JpcHRvcjtcclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBQYXJhbWV0ZXItdmFsdWUgcmVxdWVzdHMuXHJcblx0Ly8gI3JlZ2lvbiBDbGFzc1xyXG5cdC8qKlxyXG5cdCAqIEEgcHJvcGVydHktZGVjb3JhdG9yIGZhY3Rvcnkgc2VydmluZyBhcyBhICoqRCoqZXNpZ24gKipCKip5ICoqQyoqb250cmFjdCBJbnZhcmlhbnQuXHJcblx0ICogVGhpcyBpbnZhcmlhbnQgYWltcyB0byBjaGVjayB0aGUgaW5zdGFuY2Ugb2YgdGhlIGNsYXNzIG5vdCB0aGUgdmFsdWUgdG8gYmUgZ2V0IG9yIHNldC5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBjb250cmFjdHMgVGhlIHtAbGluayBEQkMgfS1Db250cmFjdHMgdGhlIHZhbHVlIHNoYWxsIHVwaG9sZC5cclxuXHQgKlxyXG5cdCAqIEB0aHJvd3MgXHRBIHtAbGluayBEQkMuSW5mcmluZ2VtZW50IH0gd2hlbmV2ZXIgdGhlIHByb3BlcnR5IGlzIHRyaWVkIHRvIGJlIGdldCBvciBzZXQgd2l0aG91dCB0aGUgaW5zdGFuY2Ugb2YgaXQncyBjbGFzc1xyXG5cdCAqIFx0XHRcdGZ1bGZpbGxpbmcgdGhlIHNwZWNpZmllZCAqKmNvbnRyYWN0cyoqLiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgZGVjQ2xhc3NJbnZhcmlhbnQoXHJcblx0XHRjb250cmFjdHM6IEFycmF5PHtcclxuXHRcdFx0Y2hlY2s6ICh0b0NoZWNrOiB1bmtub3duIHwgbnVsbCB8IHVuZGVmaW5lZCkgPT4gYm9vbGVhbiB8IHN0cmluZztcclxuXHRcdH0+LFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjID0gXCJXYVhDb2RlLkRCQ1wiLFxyXG5cdCkge1xyXG5cdFx0cmV0dXJuICh0YXJnZXQ6IHVua25vd24sIHByb3BlcnR5S2V5OiBzdHJpbmcgfCBzeW1ib2wsIGRlc2NyaXB0b3I6IFByb3BlcnR5RGVzY3JpcHRvcikgPT4ge1xyXG5cdFx0XHRpZiAoIURCQy5yZXNvbHZlREJDUGF0aCh3aW5kb3csIGRiYykuZXhlY3V0aW9uU2V0dGluZ3MuY2hlY2tJbnZhcmlhbnRzKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblx0XHRcdGNvbnN0IG9yaWdpbmFsU2V0dGVyID0gZGVzY3JpcHRvci5zZXQ7XHJcbiAgICBcdFx0Y29uc3Qgb3JpZ2luYWxHZXR0ZXIgPSBkZXNjcmlwdG9yLmdldDtcclxuXHRcdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBOZWNlc3NhcnkgdG8gaW50ZXJjZXB0IFVOREVGSU5FRCBhbmQgTlVMTC5cclxuXHRcdFx0bGV0IHZhbHVlOiBhbnk7XHJcblx0XHRcdC8vICNyZWdpb24gUmVwbGFjZSBvcmlnaW5hbCBwcm9wZXJ0eS5cclxuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgcHJvcGVydHlLZXksIHtcclxuXHRcdFx0XHRnZXQoKSB7XHJcblx0XHRcdFx0XHRpZiAoXHJcblx0XHRcdFx0XHRcdCFEQkMucmVzb2x2ZURCQ1BhdGgod2luZG93LCBkYmMpLmV4ZWN1dGlvblNldHRpbmdzLmNoZWNrSW52YXJpYW50c1xyXG5cdFx0XHRcdFx0KSB7XHJcblx0XHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRjb25zdCByZWFsVmFsdWUgPSBwYXRoID8gREJDLnJlc29sdmUodGhpcywgcGF0aCkgOiB0aGlzO1xyXG5cdFx0XHRcdFx0Ly8gI3JlZ2lvbiBDaGVjayBpZiBhbGwgXCJjb250cmFjdHNcIiBhcmUgZnVsZmlsbGVkLlxyXG5cdFx0XHRcdFx0Zm9yIChjb25zdCBjb250cmFjdCBvZiBjb250cmFjdHMpIHtcclxuXHRcdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gY29udHJhY3QuY2hlY2socmVhbFZhbHVlKTtcclxuXHJcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YgcmVzdWx0ID09PSBcInN0cmluZ1wiKSB7XHJcblx0XHRcdFx0XHRcdFx0REJDLnJlc29sdmVEQkNQYXRoKHdpbmRvdywgZGJjKS5yZXBvcnRGaWVsZEluZnJpbmdlbWVudChcclxuXHRcdFx0XHRcdFx0XHRcdHJlc3VsdCxcclxuXHRcdFx0XHRcdFx0XHRcdHRhcmdldCBhcyBvYmplY3QsXHJcblx0XHRcdFx0XHRcdFx0XHRwYXRoLFxyXG5cdFx0XHRcdFx0XHRcdFx0cHJvcGVydHlLZXkgYXMgc3RyaW5nLFxyXG5cdFx0XHRcdFx0XHRcdFx0cmVhbFZhbHVlLFxyXG5cdFx0XHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vICNlbmRyZWdpb24gQ2hlY2sgaWYgYWxsIFwiY29udHJhY3RzXCIgYXJlIGZ1bGZpbGxlZC5cclxuXHRcdFx0XHRcdHJldHVybiBvcmlnaW5hbEdldHRlclsgcHJvcGVydHlLZXkgXTtcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdHNldChuZXdWYWx1ZSkge1xyXG5cdFx0XHRcdFx0aWYgKFxyXG5cdFx0XHRcdFx0XHQhREJDLnJlc29sdmVEQkNQYXRoKHdpbmRvdywgZGJjKS5leGVjdXRpb25TZXR0aW5ncy5jaGVja0ludmFyaWFudHNcclxuXHRcdFx0XHRcdCkge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0Y29uc3QgcmVhbFZhbHVlID0gcGF0aCA/IERCQy5yZXNvbHZlKHRoaXMsIHBhdGgpIDogdGhpcztcclxuXHRcdFx0XHRcdC8vICNyZWdpb24gQ2hlY2sgaWYgYWxsIFwiY29udHJhY3RzXCIgYXJlIGZ1bGZpbGxlZC5cclxuXHRcdFx0XHRcdGZvciAoY29uc3QgY29udHJhY3Qgb2YgY29udHJhY3RzKSB7XHJcblx0XHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IGNvbnRyYWN0LmNoZWNrKHJlYWxWYWx1ZSk7XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIHJlc3VsdCA9PT0gXCJzdHJpbmdcIikge1xyXG5cdFx0XHRcdFx0XHRcdERCQy5yZXNvbHZlREJDUGF0aCh3aW5kb3csIGRiYykucmVwb3J0RmllbGRJbmZyaW5nZW1lbnQoXHJcblx0XHRcdFx0XHRcdFx0XHRyZXN1bHQsXHJcblx0XHRcdFx0XHRcdFx0XHR0YXJnZXQgYXMgb2JqZWN0LFxyXG5cdFx0XHRcdFx0XHRcdFx0cGF0aCxcclxuXHRcdFx0XHRcdFx0XHRcdHByb3BlcnR5S2V5IGFzIHN0cmluZyxcclxuXHRcdFx0XHRcdFx0XHRcdHJlYWxWYWx1ZSxcclxuXHRcdFx0XHRcdFx0XHQpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQvLyAjZW5kcmVnaW9uIENoZWNrIGlmIGFsbCBcImNvbnRyYWN0c1wiIGFyZSBmdWxmaWxsZWQuXHJcblx0XHRcdFx0XHR2YWx1ZSA9IG5ld1ZhbHVlO1xyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcclxuXHRcdFx0XHRjb25maWd1cmFibGU6IHRydWUsXHJcblx0XHRcdH0pO1xyXG5cdFx0XHQvLyAjZW5kcmVnaW9uIFJlcGxhY2Ugb3JpZ2luYWwgcHJvcGVydHkuXHJcblx0XHR9O1xyXG5cdH1cclxuXHQvLyAjZW5kcmVnaW9uIENsYXNzXHJcblx0Ly8gI3JlZ2lvbiBJbnZhcmlhbnRcclxuXHQvKipcclxuXHQgKiBBIHByb3BlcnR5LWRlY29yYXRvciBmYWN0b3J5IHNlcnZpbmcgYXMgYSAqKkQqKmVzaWduICoqQioqeSAqKkMqKm9udHJhY3QgSW52YXJpYW50LlxyXG5cdCAqIFNpbmNlIHRoZSB2YWx1ZSBtdXN0IGJlIGluaXRpYWxpemVkIG9yIHNldCBhY2NvcmRpbmcgdG8gdGhlIHNwZWNpZmllZCAqKmNvbnRyYWN0cyoqIHRoZSB2YWx1ZSB3aWxsIG9ubHkgYmUgY2hlY2tlZFxyXG5cdCAqIHdoZW4gYXNzaWduaW5nIGl0LlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIGNvbnRyYWN0cyBUaGUge0BsaW5rIERCQyB9LUNvbnRyYWN0cyB0aGUgdmFsdWUgc2hhbGwgdXBob2xkLlxyXG5cdCAqXHJcblx0ICogQHRocm93cyBcdEEge0BsaW5rIERCQy5JbmZyaW5nZW1lbnQgfSB3aGVuZXZlciB0aGUgcHJvcGVydHkgaXMgdHJpZWQgdG8gYmUgc2V0IHRvIGEgdmFsdWUgdGhhdCBkb2VzIG5vdCBjb21wbHkgdG8gdGhlXHJcblx0ICogXHRcdFx0c3BlY2lmaWVkICoqY29udHJhY3RzKiosIGJ5IHRoZSByZXR1cm5lZCBtZXRob2QuKi9cclxuXHRwdWJsaWMgc3RhdGljIGRlY0ludmFyaWFudChcclxuXHRcdGNvbnRyYWN0czogQXJyYXk8e1xyXG5cdFx0XHRjaGVjazogKHRvQ2hlY2s6IHVua25vd24gfCBudWxsIHwgdW5kZWZpbmVkKSA9PiBib29sZWFuIHwgc3RyaW5nO1xyXG5cdFx0fT4sXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXHJcblx0KSB7XHJcblx0XHRyZXR1cm4gKHRhcmdldDogdW5rbm93biwgcHJvcGVydHlLZXk6IHN0cmluZyB8IHN5bWJvbCkgPT4ge1xyXG5cdFx0XHRpZiAoIURCQy5yZXNvbHZlREJDUGF0aCh3aW5kb3csIGRiYykuZXhlY3V0aW9uU2V0dGluZ3MuY2hlY2tJbnZhcmlhbnRzKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogTmVjZXNzYXJ5IHRvIGludGVyY2VwdCBVTkRFRklORUQgYW5kIE5VTEwuXHJcblx0XHRcdGxldCB2YWx1ZTogYW55O1xyXG5cdFx0XHQvLyAjcmVnaW9uIFJlcGxhY2Ugb3JpZ2luYWwgcHJvcGVydHkuXHJcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIHByb3BlcnR5S2V5LCB7XHJcblx0XHRcdFx0c2V0KG5ld1ZhbHVlKSB7XHJcblx0XHRcdFx0XHRpZiAoXHJcblx0XHRcdFx0XHRcdCFEQkMucmVzb2x2ZURCQ1BhdGgod2luZG93LCBkYmMpLmV4ZWN1dGlvblNldHRpbmdzLmNoZWNrSW52YXJpYW50c1xyXG5cdFx0XHRcdFx0KSB7XHJcblx0XHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRjb25zdCByZWFsVmFsdWUgPSBwYXRoID8gREJDLnJlc29sdmUobmV3VmFsdWUsIHBhdGgpIDogbmV3VmFsdWU7XHJcblx0XHRcdFx0XHQvLyAjcmVnaW9uIENoZWNrIGlmIGFsbCBcImNvbnRyYWN0c1wiIGFyZSBmdWxmaWxsZWQuXHJcblx0XHRcdFx0XHRmb3IgKGNvbnN0IGNvbnRyYWN0IG9mIGNvbnRyYWN0cykge1xyXG5cdFx0XHRcdFx0XHRjb25zdCByZXN1bHQgPSBjb250cmFjdC5jaGVjayhyZWFsVmFsdWUpO1xyXG5cclxuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiByZXN1bHQgPT09IFwic3RyaW5nXCIpIHtcclxuXHRcdFx0XHRcdFx0XHREQkMucmVzb2x2ZURCQ1BhdGgod2luZG93LCBkYmMpLnJlcG9ydEZpZWxkSW5mcmluZ2VtZW50KFxyXG5cdFx0XHRcdFx0XHRcdFx0cmVzdWx0LFxyXG5cdFx0XHRcdFx0XHRcdFx0dGFyZ2V0IGFzIG9iamVjdCxcclxuXHRcdFx0XHRcdFx0XHRcdHBhdGgsXHJcblx0XHRcdFx0XHRcdFx0XHRwcm9wZXJ0eUtleSBhcyBzdHJpbmcsXHJcblx0XHRcdFx0XHRcdFx0XHRyZWFsVmFsdWUsXHJcblx0XHRcdFx0XHRcdFx0KTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0Ly8gI2VuZHJlZ2lvbiBDaGVjayBpZiBhbGwgXCJjb250cmFjdHNcIiBhcmUgZnVsZmlsbGVkLlxyXG5cdFx0XHRcdFx0dmFsdWUgPSBuZXdWYWx1ZTtcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdGVudW1lcmFibGU6IHRydWUsXHJcblx0XHRcdFx0Y29uZmlndXJhYmxlOiB0cnVlLFxyXG5cdFx0XHR9KTtcclxuXHRcdFx0Ly8gI2VuZHJlZ2lvbiBSZXBsYWNlIG9yaWdpbmFsIHByb3BlcnR5LlxyXG5cdFx0fTtcclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBJbnZhcmlhbnRcclxuXHQvLyAjcmVnaW9uIFBvc3Rjb25kaXRpb25cclxuXHQvKipcclxuXHQgKiBBIG1ldGhvZCBkZWNvcmF0b3IgZmFjdG9yeSBjaGVja2luZyB0aGUgcmVzdWx0IG9mIGEgbWV0aG9kIHdoZW5ldmVyIGl0IGlzIGludm9rZWQgdGh1cyBhbHNvIHVzYWJsZSBvbiBnZXR0ZXJzLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIGNoZWNrXHRUaGUgKioodG9DaGVjazogYW55LCBvYmplY3QsIHN0cmluZykgPT4gYm9vbGVhbiB8IHN0cmluZyoqIHRvIHVzZSBmb3IgY2hlY2tpbmcuXHJcblx0ICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMucmVzb2x2ZURCQ1BhdGggfS5cclxuXHQgKiBAcGFyYW0gcGF0aFx0VGhlIGRvdHRlZCBwYXRoIHJlZmVycmluZyB0byB0aGUgYWN0dWFsIHZhbHVlIHRvIGNoZWNrLCBzdGFydGluZyBmb3JtIHRoZSBzcGVjaWZpZWQgb25lLlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgVGhlICoqKCB0YXJnZXQgOiBvYmplY3QsIHByb3BlcnR5S2V5IDogc3RyaW5nLCBkZXNjcmlwdG9yIDogUHJvcGVydHlEZXNjcmlwdG9yICkgOiBQcm9wZXJ0eURlc2NyaXB0b3IqKlxyXG5cdCAqIFx0XHRcdGludm9rZWQgYnkgVHlwZXNjcmlwdC5cclxuXHQgKi9cclxuXHRwdWJsaWMgc3RhdGljIGRlY1Bvc3Rjb25kaXRpb24oXHJcblx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IE5lY2Vzc2FyeSB0byBpbnRlcmNlcHQgVU5ERUZJTkVEIGFuZCBOVUxMLlxyXG5cdFx0Y2hlY2s6ICh0b0NoZWNrOiBhbnksIG9iamVjdCwgc3RyaW5nKSA9PiBib29sZWFuIHwgc3RyaW5nLFxyXG5cdFx0ZGJjOiBzdHJpbmcsXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0KSB7XHJcblx0XHRyZXR1cm4gKFxyXG5cdFx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdFx0cHJvcGVydHlLZXk6IHN0cmluZyxcclxuXHRcdFx0ZGVzY3JpcHRvcjogUHJvcGVydHlEZXNjcmlwdG9yLFxyXG5cdFx0KTogUHJvcGVydHlEZXNjcmlwdG9yID0+IHtcclxuXHRcdFx0Y29uc3Qgb3JpZ2luYWxNZXRob2QgPSBkZXNjcmlwdG9yLnZhbHVlO1xyXG5cdFx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IE5lY2Vzc2FyeSB0byBpbnRlcmNlcHQgVU5ERUZJTkVEIGFuZCBOVUxMLlxyXG5cdFx0XHRkZXNjcmlwdG9yLnZhbHVlID0gKC4uLmFyZ3M6IGFueVtdKSA9PiB7XHJcblx0XHRcdFx0aWYgKFxyXG5cdFx0XHRcdFx0IURCQy5yZXNvbHZlREJDUGF0aCh3aW5kb3csIGRiYykuZXhlY3V0aW9uU2V0dGluZ3MuY2hlY2tQb3N0Y29uZGl0aW9uc1xyXG5cdFx0XHRcdCkge1xyXG5cdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9jb21wbGV4aXR5L25vVGhpc0luU3RhdGljOiA8ZXhwbGFuYXRpb24+XHJcblx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gb3JpZ2luYWxNZXRob2QuYXBwbHkodGhpcywgYXJncyk7XHJcblx0XHRcdFx0Y29uc3QgcmVhbFZhbHVlID0gcGF0aCA/IERCQy5yZXNvbHZlKHJlc3VsdCwgcGF0aCkgOiByZXN1bHQ7XHJcblx0XHRcdFx0Y29uc3QgY2hlY2tSZXN1bHQgPSBjaGVjayhyZWFsVmFsdWUsIHRhcmdldCwgcHJvcGVydHlLZXkpO1xyXG5cclxuXHRcdFx0XHRpZiAodHlwZW9mIGNoZWNrUmVzdWx0ID09PSBcInN0cmluZ1wiKSB7XHJcblx0XHRcdFx0XHREQkMucmVzb2x2ZURCQ1BhdGgod2luZG93LCBkYmMpLnJlcG9ydFJldHVybnZhbHVlSW5mcmluZ2VtZW50KFxyXG5cdFx0XHRcdFx0XHRjaGVja1Jlc3VsdCxcclxuXHRcdFx0XHRcdFx0dGFyZ2V0LFxyXG5cdFx0XHRcdFx0XHRwYXRoLFxyXG5cdFx0XHRcdFx0XHRwcm9wZXJ0eUtleSxcclxuXHRcdFx0XHRcdFx0cmVhbFZhbHVlLFxyXG5cdFx0XHRcdFx0KTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdHJldHVybiByZXN1bHQ7XHJcblx0XHRcdH07XHJcblxyXG5cdFx0XHRyZXR1cm4gZGVzY3JpcHRvcjtcclxuXHRcdH07XHJcblx0fVxyXG5cdC8vICNlbmRyZWdpb24gUG9zdGNvbmRpdGlvblxyXG5cdC8vICNyZWdpb24gRGVjb3JhdG9yXHJcblx0Ly8gI3JlZ2lvbiBQcmVjb25kaXRpb25cclxuXHQvKipcclxuXHQgKiBBIHBhcmFtZXRlci1kZWNvcmF0b3IgZmFjdG9yeSB0aGF0IHJlcXVlc3RzIHRoZSB0YWdnZWQgcGFyYW1ldGVyJ3MgdmFsdWUgcGFzc2luZyBpdCB0byB0aGUgcHJvdmlkZWRcclxuXHQgKiBcImNoZWNrXCItbWV0aG9kIHdoZW4gdGhlIHZhbHVlIGJlY29tZXMgYXZhaWxhYmxlLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIGNoZWNrXHRUaGUgXCIoIHVua25vd24gKSA9PiB2b2lkXCIgdG8gYmUgaW52b2tlZCBhbG9uZyB3aXRoIHRoZSB0YWdnZWQgcGFyYW1ldGVyJ3MgdmFsdWUgYXMgc29vblxyXG5cdCAqIFx0XHRcdFx0YXMgaXQgYmVjb21lcyBhdmFpbGFibGUuXHJcblx0ICogQHBhcmFtIGRiYyAgXHRTZWUge0BsaW5rIERCQy5yZXNvbHZlREJDUGF0aCB9LlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRUaGUgZG90dGVkIHBhdGggcmVmZXJyaW5nIHRvIHRoZSBhY3R1YWwgdmFsdWUgdG8gY2hlY2ssIHN0YXJ0aW5nIGZvcm0gdGhlIHNwZWNpZmllZCBvbmUuXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBUaGUgKioodGFyZ2V0OiBvYmplY3QsIG1ldGhvZE5hbWU6IHN0cmluZyB8IHN5bWJvbCwgcGFyYW1ldGVySW5kZXg6IG51bWJlciApID0+IHZvaWQqKiBpbnZva2VkIGJ5IFR5cGVzY3JpcHQtICovXHJcblx0cHJvdGVjdGVkIHN0YXRpYyBkZWNQcmVjb25kaXRpb24oXHJcblx0XHRjaGVjazogKHVua25vd24sIG9iamVjdCwgc3RyaW5nLCBudW1iZXIpID0+IGJvb2xlYW4gfCBzdHJpbmcsXHJcblx0XHRkYmM6IHN0cmluZyxcclxuXHRcdHBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHQpOiAoXHJcblx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdG1ldGhvZE5hbWU6IHN0cmluZyB8IHN5bWJvbCxcclxuXHRcdHBhcmFtZXRlckluZGV4OiBudW1iZXIsXHJcblx0KSA9PiB2b2lkIHtcclxuXHRcdHJldHVybiAoXHJcblx0XHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0XHRtZXRob2ROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXHJcblx0XHRcdHBhcmFtZXRlckluZGV4OiBudW1iZXIsXHJcblx0XHQpOiB2b2lkID0+IHtcclxuXHRcdFx0REJDLnJlcXVlc3RQYXJhbVZhbHVlKFxyXG5cdFx0XHRcdHRhcmdldCxcclxuXHRcdFx0XHRtZXRob2ROYW1lLFxyXG5cdFx0XHRcdHBhcmFtZXRlckluZGV4LFxyXG5cdFx0XHRcdCh2YWx1ZTogdW5rbm93bikgPT4ge1xyXG5cdFx0XHRcdFx0aWYgKFxyXG5cdFx0XHRcdFx0XHQhREJDLnJlc29sdmVEQkNQYXRoKHdpbmRvdywgZGJjKS5leGVjdXRpb25TZXR0aW5nc1xyXG5cdFx0XHRcdFx0XHRcdC5jaGVja1ByZWNvbmRpdGlvbnNcclxuXHRcdFx0XHRcdCkge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0Y29uc3QgcmVhbFZhbHVlID0gcGF0aCA/IERCQy5yZXNvbHZlKHZhbHVlLCBwYXRoKSA6IHZhbHVlO1xyXG5cdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gY2hlY2socmVhbFZhbHVlLCB0YXJnZXQsIG1ldGhvZE5hbWUsIHBhcmFtZXRlckluZGV4KTtcclxuXHJcblx0XHRcdFx0XHRpZiAodHlwZW9mIHJlc3VsdCA9PT0gXCJzdHJpbmdcIikge1xyXG5cdFx0XHRcdFx0XHREQkMucmVzb2x2ZURCQ1BhdGgod2luZG93LCBkYmMpLnJlcG9ydFBhcmFtZXRlckluZnJpbmdlbWVudChcclxuXHRcdFx0XHRcdFx0XHRyZXN1bHQsXHJcblx0XHRcdFx0XHRcdFx0dGFyZ2V0LFxyXG5cdFx0XHRcdFx0XHRcdHBhdGgsXHJcblx0XHRcdFx0XHRcdFx0bWV0aG9kTmFtZSBhcyBzdHJpbmcsXHJcblx0XHRcdFx0XHRcdFx0cGFyYW1ldGVySW5kZXgsXHJcblx0XHRcdFx0XHRcdFx0cmVhbFZhbHVlLFxyXG5cdFx0XHRcdFx0XHQpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdCk7XHJcblx0XHR9O1xyXG5cdH1cclxuXHQvLyAjZW5kcmVnaW9uIFByZWNvbmRpdGlvblxyXG5cdC8vICNlbmRyZWdpb24gRGVjb3JhdG9yXHJcblx0Ly8gI3JlZ2lvbiBFeGVjdXRpb24gSGFuZGxpbmdcclxuXHQvKiogU3RvcmVzIHNldHRpbmdzIGNvbmNlcm5pbmcgdGhlIGV4ZWN1dGlvbiBvZiBjaGVja3MuICovXHJcblx0cHVibGljIGV4ZWN1dGlvblNldHRpbmdzOiB7XHJcblx0XHRjaGVja1ByZWNvbmRpdGlvbnM6IGJvb2xlYW47XHJcblx0XHRjaGVja1Bvc3Rjb25kaXRpb25zOiBib29sZWFuO1xyXG5cdFx0Y2hlY2tJbnZhcmlhbnRzOiBib29sZWFuO1xyXG5cdH0gPSB7XHJcblx0XHRjaGVja1ByZWNvbmRpdGlvbnM6IHRydWUsXHJcblx0XHRjaGVja1Bvc3Rjb25kaXRpb25zOiB0cnVlLFxyXG5cdFx0Y2hlY2tJbnZhcmlhbnRzOiB0cnVlLFxyXG5cdH07XHJcblx0Ly8gI2VuZHJlZ2lvbiBFeGVjdXRpb24gSGFuZGxpbmdcclxuXHQvLyAjcmVnaW9uIFdhcm5pbmcgaGFuZGxpbmcuXHJcblx0LyoqIFN0b3JlcyBzZXR0aW5ncyBjb25jZXJuaW5nIHdhcm5pbmdzLiAqL1xyXG5cdHB1YmxpYyB3YXJuaW5nU2V0dGluZ3M6IHtcclxuXHRcdGxvZ1RvQ29uc29sZTogYm9vbGVhbjtcclxuXHR9ID0geyBsb2dUb0NvbnNvbGU6IHRydWUgfTtcclxuXHQvKipcclxuXHQgKiBSZXBvcnRzIGEgd2FybmluZy5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBtZXNzYWdlIFRoZSBtZXNzYWdlIGNvbnRhaW5pbmcgdGhlIHdhcm5pbmcuICovXHJcblx0cHJvdGVjdGVkIHJlcG9ydFdhcm5pbmcobWVzc2FnZTogc3RyaW5nKTogdW5kZWZpbmVkIHtcclxuXHRcdGlmICh0aGlzLndhcm5pbmdTZXR0aW5ncy5sb2dUb0NvbnNvbGUpIHtcclxuXHRcdFx0Y29uc29sZS53YXJuKG1lc3NhZ2UpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHQvLyAjZW5kcmVnaW9uIFdhcm5pbmcgaGFuZGxpbmcuXHJcblx0Ly8gI3JlZ2lvbiBpbmZyaW5nZW1lbnQgaGFuZGxpbmcuXHJcblx0LyoqIFN0b3JlcyB0aGUgc2V0dGluZ3MgY29uY2VybmluZyBpbmZyaW5nZW1lbnRzICovXHJcblx0cHVibGljIGluZnJpbmdlbWVudFNldHRpbmdzOiB7XHJcblx0XHR0aHJvd0V4Y2VwdGlvbjogYm9vbGVhbjtcclxuXHRcdGxvZ1RvQ29uc29sZTogYm9vbGVhbjtcclxuXHR9ID0geyB0aHJvd0V4Y2VwdGlvbjogdHJ1ZSwgbG9nVG9Db25zb2xlOiBmYWxzZSB9O1xyXG5cdC8qKlxyXG5cdCAqIFJlcG9ydHMgYW4gaW5mcmluZ2VtZW50IGFjY29yZGluZyB0byB0aGUge0BsaW5rIGluZnJpbmdlbWVudFNldHRpbmdzIH0gYWxzbyBnZW5lcmF0aW5nIGEgcHJvcGVyIHtAbGluayBzdHJpbmcgfS13cmFwcGVyXHJcblx0ICogZm9yIHRoZSBnaXZlbiBcIm1lc3NhZ2VcIiAmIHZpb2xhdG9yLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIG1lc3NhZ2VcdFRoZSB7QGxpbmsgc3RyaW5nIH0gZGVzY3JpYmluZyB0aGUgaW5mcmluZ2VtZW50IGFuZCBpdCdzIHByb3ZlbmllbmNlLlxyXG5cdCAqIEBwYXJhbSB2aW9sYXRvciBcdFRoZSB7QGxpbmsgc3RyaW5nIH0gZGVzY3JpYmluZyBvciBuYW1pbmcgdGhlIHZpb2xhdG9yLiAqL1xyXG5cdHByb3RlY3RlZCByZXBvcnRJbmZyaW5nZW1lbnQoXHJcblx0XHRtZXNzYWdlOiBzdHJpbmcsXHJcblx0XHR2aW9sYXRvcjogc3RyaW5nLFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRwYXRoOiBzdHJpbmcsXHJcblx0KTogdW5kZWZpbmVkIHtcclxuXHRcdGNvbnN0IGZpbmFsTWVzc2FnZTogc3RyaW5nID0gYFsgRnJvbSBcIiR7dmlvbGF0b3J9XCIke3BhdGggPyBgJ3MgbWVtYmVyIFwiJHtwYXRofVwiYCA6IFwiXCJ9JHt0eXBlb2YgdGFyZ2V0ID09PSBcImZ1bmN0aW9uXCIgPyBgIGluIFwiJHt0YXJnZXQubmFtZX1cImAgOiB0eXBlb2YgdGFyZ2V0ID09PSBcIm9iamVjdFwiICYmIHRhcmdldCAhPT0gbnVsbCAmJiB0eXBlb2YgdGFyZ2V0LmNvbnN0cnVjdG9yID09PSBcImZ1bmN0aW9uXCIgPyBgIGluIFwiJHt0YXJnZXQuY29uc3RydWN0b3IubmFtZX1cImAgOiBcIlwifTogJHttZXNzYWdlfV1gO1xyXG5cclxuXHRcdGlmICh0aGlzLmluZnJpbmdlbWVudFNldHRpbmdzLnRocm93RXhjZXB0aW9uKSB7XHJcblx0XHRcdHRocm93IG5ldyBEQkMuSW5mcmluZ2VtZW50KGZpbmFsTWVzc2FnZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHRoaXMuaW5mcmluZ2VtZW50U2V0dGluZ3MubG9nVG9Db25zb2xlKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKGZpbmFsTWVzc2FnZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIFJlcG9ydHMgYSBwYXJhbWV0ZXItaW5mcmluZ2VtZW50IHZpYSB7QGxpbmsgcmVwb3J0SW5mcmluZ2VtZW50IH0gYWxzbyBnZW5lcmF0aW5nIGEgcHJvcGVyIHtAbGluayBzdHJpbmcgfS13cmFwcGVyXHJcblx0ICogZm9yIHRoZSBnaXZlbiBcIm1lc3NhZ2VcIixcIm1ldGhvZFwiLCBwYXJhbWV0ZXItXCJpbmRleFwiICYgdmFsdWUuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gbWVzc2FnZVx0VGhlIHtAbGluayBzdHJpbmcgfSBkZXNjcmliaW5nIHRoZSBpbmZyaW5nZW1lbnQgYW5kIGl0J3MgcHJvdmVuaWVuY2UuXHJcblx0ICogQHBhcmFtIG1ldGhvZCBcdFRoZSB7QGxpbmsgc3RyaW5nIH0gZGVzY3JpYmluZyBvciBuYW1pbmcgdGhlIHZpb2xhdG9yLlxyXG5cdCAqIEBwYXJhbSBpbmRleFx0XHRUaGUgaW5kZXggb2YgdGhlIHBhcmFtZXRlciB3aXRoaW4gdGhlIGFyZ3VtZW50IGxpc3RpbmcuXHJcblx0ICogQHBhcmFtIHZhbHVlIFx0VGhlIHBhcmFtZXRlcidzIHZhbHVlLiAqL1xyXG5cdHB1YmxpYyByZXBvcnRQYXJhbWV0ZXJJbmZyaW5nZW1lbnQoXHJcblx0XHRtZXNzYWdlOiBzdHJpbmcsXHJcblx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdHBhdGg6IHN0cmluZyxcclxuXHRcdG1ldGhvZDogc3RyaW5nLFxyXG5cdFx0aW5kZXg6IG51bWJlcixcclxuXHRcdHZhbHVlOiB1bmtub3duLFxyXG5cdCk6IHVuZGVmaW5lZCB7XHJcblx0XHRjb25zdCBwcm9wZXJJbmRleCA9IGluZGV4ICsgMTtcclxuXHJcblx0XHR0aGlzLnJlcG9ydEluZnJpbmdlbWVudChcclxuXHRcdFx0YFsgUGFyYW1ldGVyLXZhbHVlIFwiJHt2YWx1ZX1cIiBvZiB0aGUgJHtwcm9wZXJJbmRleH0ke3Byb3BlckluZGV4ID09PSAxID8gXCJzdFwiIDogcHJvcGVySW5kZXggPT09IDIgPyBcIm5kXCIgOiBwcm9wZXJJbmRleCA9PT0gMyA/IFwicmRcIiA6IFwidGhcIn0gcGFyYW1ldGVyIGRpZCBub3QgZnVsZmlsbCBvbmUgb2YgaXQncyBjb250cmFjdHM6ICR7bWVzc2FnZX1dYCxcclxuXHRcdFx0bWV0aG9kLFxyXG5cdFx0XHR0YXJnZXQsXHJcblx0XHRcdHBhdGgsXHJcblx0XHQpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBSZXBvcnRzIGEgZmllbGQtaW5mcmluZ2VtZW50IHZpYSB7QGxpbmsgcmVwb3J0SW5mcmluZ2VtZW50IH0gYWxzbyBnZW5lcmF0aW5nIGEgcHJvcGVyIHtAbGluayBzdHJpbmcgfS13cmFwcGVyXHJcblx0ICogZm9yIHRoZSBnaXZlbiAqKm1lc3NhZ2UqKiAmICoqbmFtZSoqLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIG1lc3NhZ2VcdEEge0BsaW5rIHN0cmluZyB9IGRlc2NyaWJpbmcgdGhlIGluZnJpbmdlbWVudCBhbmQgaXQncyBwcm92ZW5pZW5jZS5cclxuXHQgKiBAcGFyYW0ga2V5IFx0XHRUaGUgcHJvcGVydHkga2V5LlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRcdFRoZSBkb3R0ZWQtcGF0aCB7QGxpbmsgc3RyaW5nIH0gdGhhdCBsZWFkcyB0byB0aGUgdmFsdWUgbm90IGZ1bGZpbGxpbmcgdGhlIGNvbnRyYWN0IHN0YXJ0aW5nIGZyb21cclxuXHQgKiBcdFx0XHRcdFx0dGhlIHRhZ2dlZCBvbmUuXHJcblx0ICogQHBhcmFtIHZhbHVlXHRcdFRoZSB2YWx1ZSBub3QgZnVsZmlsbGluZyBhIGNvbnRyYWN0LiAqL1xyXG5cdHB1YmxpYyByZXBvcnRGaWVsZEluZnJpbmdlbWVudChcclxuXHRcdG1lc3NhZ2U6IHN0cmluZyxcclxuXHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0cGF0aDogc3RyaW5nLFxyXG5cdFx0a2V5OiBzdHJpbmcsXHJcblx0XHR2YWx1ZTogdW5rbm93bixcclxuXHQpOiB1bmRlZmluZWQge1xyXG5cdFx0dGhpcy5yZXBvcnRJbmZyaW5nZW1lbnQoXHJcblx0XHRcdGBbIE5ldyB2YWx1ZSBmb3IgXCIke2tleX1cIiR7cGF0aCA9PT0gdW5kZWZpbmVkID8gXCJcIiA6IGAuJHtwYXRofWB9IHdpdGggdmFsdWUgXCIke3ZhbHVlfVwiIGRpZCBub3QgZnVsZmlsbCBvbmUgb2YgaXQncyBjb250cmFjdHM6ICR7bWVzc2FnZX1dYCxcclxuXHRcdFx0a2V5LFxyXG5cdFx0XHR0YXJnZXQsXHJcblx0XHRcdHBhdGgsXHJcblx0XHQpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBSZXBvcnRzIGEgcmV0dXJudmFsdWUtaW5mcmluZ2VtZW50IGFjY29yZGluZyB2aWEge0BsaW5rIHJlcG9ydEluZnJpbmdlbWVudCB9IGFsc28gZ2VuZXJhdGluZyBhIHByb3BlciB7QGxpbmsgc3RyaW5nIH0td3JhcHBlclxyXG5cdCAqIGZvciB0aGUgZ2l2ZW4gXCJtZXNzYWdlXCIsXCJtZXRob2RcIiAmIHZhbHVlLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIG1lc3NhZ2VcdFRoZSB7QGxpbmsgc3RyaW5nIH0gZGVzY3JpYmluZyB0aGUgaW5mcmluZ2VtZW50IGFuZCBpdCdzIHByb3ZlbmllbmNlLlxyXG5cdCAqIEBwYXJhbSBtZXRob2QgXHRUaGUge0BsaW5rIHN0cmluZyB9IGRlc2NyaWJpbmcgb3IgbmFtaW5nIHRoZSB2aW9sYXRvci5cclxuXHQgKiBAcGFyYW0gdmFsdWVcdFx0VGhlIHBhcmFtZXRlcidzIHZhbHVlLiAqL1xyXG5cdHB1YmxpYyByZXBvcnRSZXR1cm52YWx1ZUluZnJpbmdlbWVudChcclxuXHRcdG1lc3NhZ2U6IHN0cmluZyxcclxuXHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0cGF0aDogc3RyaW5nLFxyXG5cdFx0bWV0aG9kOiBzdHJpbmcsXHJcblx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cclxuXHRcdHZhbHVlOiBhbnksXHJcblx0KSB7XHJcblx0XHR0aGlzLnJlcG9ydEluZnJpbmdlbWVudChcclxuXHRcdFx0YFsgUmV0dXJuLXZhbHVlIFwiJHt2YWx1ZX1cIiBkaWQgbm90IGZ1bGZpbGwgb25lIG9mIGl0J3MgY29udHJhY3RzOiAke21lc3NhZ2V9XWAsXHJcblx0XHRcdG1ldGhvZCxcclxuXHRcdFx0dGFyZ2V0LFxyXG5cdFx0XHRwYXRoLFxyXG5cdFx0KTtcclxuXHR9XHJcblx0Ly8gI3JlZ2lvbiBDbGFzc2VzXHJcblx0Ly8gI3JlZ2lvbiBFcnJvcnNcclxuXHQvKiogQW4ge0BsaW5rIEVycm9yIH0gdG8gYmUgdGhyb3duIHdoZW5ldmVyIGFuIGluZnJpbmdlbWVudCBpcyBkZXRlY3RlZC4gKi9cclxuXHRwdWJsaWMgc3RhdGljIEluZnJpbmdlbWVudCA9IGNsYXNzIGV4dGVuZHMgRXJyb3Ige1xyXG5cdFx0LyoqXHJcblx0XHQgKiBDb25zdHJ1Y3RzIHRoaXMge0BsaW5rIEVycm9yIH0gYnkgdGFnZ2luZyB0aGUgc3BlY2lmaWVkIG1lc3NhZ2Ute0BsaW5rIHN0cmluZyB9IGFzIGFuIFhEQkMtSW5mcmluZ2VtZW50LlxyXG5cdFx0ICpcclxuXHRcdCAqIEBwYXJhbSBtZXNzYWdlIFRoZSB7QGxpbmsgc3RyaW5nIH0gZGVzY3JpYmluZyB0aGUgaW5mcmluZ2VtZW50LiAqL1xyXG5cdFx0Y29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nKSB7XHJcblx0XHRcdHN1cGVyKGBbIFhEQkMgSW5mcmluZ2VtZW50ICR7bWVzc2FnZX1dYCk7XHJcblx0XHR9XHJcblx0fTtcclxuXHQvLyAjZW5kcmVnaW9uIEVycm9yc1xyXG5cdC8vICNlbmRyZWdpb24gQ2xhc3Nlc1xyXG5cdC8vICNlbmRyZWdpb24gaW5mcmluZ2VtZW50IGhhbmRsaW5nLlxyXG5cdC8qKlxyXG5cdCAqIFJlc29sdmVzIHRoZSBzcGVjaWZpZWQgZG90dGVkIHtAbGluayBzdHJpbmcgfS1wYXRoIHRvIGEge0BsaW5rIERCQyB9LlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIG9iaiBcdFRoZSB7QGxpbmsgb2JqZWN0IH0gdG8gc3RhcnQgcmVzb2x2aW5nIGZyb20uXHJcblx0ICogQHBhcmFtIHBhdGggXHRUaGUgZG90dGVkIHtAbGluayBzdHJpbmcgfS1wYXRoIGxlYWRpbmcgdG8gdGhlIHtAbGluayBEQkMgfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFRoZSByZXF1ZXN0ZWQge0BsaW5rIERCQyB9LlxyXG5cdCAqL1xyXG5cdHN0YXRpYyByZXNvbHZlREJDUGF0aCA9IChvYmosIHBhdGgpOiBEQkMgPT5cclxuXHRcdHBhdGhcclxuXHRcdFx0Py5zcGxpdChcIi5cIilcclxuXHRcdFx0LnJlZHVjZSgoYWNjdW11bGF0b3IsIGN1cnJlbnQpID0+IGFjY3VtdWxhdG9yW2N1cnJlbnRdLCBvYmopO1xyXG5cdC8qKlxyXG5cdCAqIENvbnN0cnVjdHMgdGhpcyB7QGxpbmsgREJDIH0gYnkgc2V0dGluZyB0aGUge0BsaW5rIERCQy5pbmZyaW5nZW1lbnRTZXR0aW5ncyB9LCBkZWZpbmUgdGhlICoqV2FYQ29kZSoqIG5hbWVzcGFjZSBpblxyXG5cdCAqICoqd2luZG93KiogaWYgbm90IHlldCBhdmFpbGFibGUgYW5kIHNldHRpbmcgdGhlIHByb3BlcnR5ICoqREJDKiogaW4gdGhlcmUgdG8gdGhlIGluc3RhbmNlIG9mIHRoaXMge0BsaW5rIERCQyB9LlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIGluZnJpbmdlbWVudFNldHRpbmdzIFx0U2VlIHtAbGluayBEQkMuaW5mcmluZ2VtZW50U2V0dGluZ3MgfS5cclxuXHQgKiBAcGFyYW0gZXhlY3V0aW9uU2V0dGluZ3NcdFx0U2VlIHtAbGluayBEQkMuZXhlY3V0aW9uU2V0dGluZ3MgfS4gKi9cclxuXHRjb25zdHJ1Y3RvcihcclxuXHRcdGluZnJpbmdlbWVudFNldHRpbmdzOiB7XHJcblx0XHRcdHRocm93RXhjZXB0aW9uOiBib29sZWFuO1xyXG5cdFx0XHRsb2dUb0NvbnNvbGU6IGJvb2xlYW47XHJcblx0XHR9ID0geyB0aHJvd0V4Y2VwdGlvbjogdHJ1ZSwgbG9nVG9Db25zb2xlOiBmYWxzZSB9LFxyXG5cdFx0ZXhlY3V0aW9uU2V0dGluZ3M6IHtcclxuXHRcdFx0Y2hlY2tQcmVjb25kaXRpb25zOiBib29sZWFuO1xyXG5cdFx0XHRjaGVja1Bvc3Rjb25kaXRpb25zOiBib29sZWFuO1xyXG5cdFx0XHRjaGVja0ludmFyaWFudHM6IGJvb2xlYW47XHJcblx0XHR9ID0ge1xyXG5cdFx0XHRjaGVja1ByZWNvbmRpdGlvbnM6IHRydWUsXHJcblx0XHRcdGNoZWNrUG9zdGNvbmRpdGlvbnM6IHRydWUsXHJcblx0XHRcdGNoZWNrSW52YXJpYW50czogdHJ1ZSxcclxuXHRcdH0sXHJcblx0KSB7XHJcblx0XHR0aGlzLmluZnJpbmdlbWVudFNldHRpbmdzID0gaW5mcmluZ2VtZW50U2V0dGluZ3M7XHJcblxyXG5cdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XHJcblx0XHRpZiAoKHdpbmRvdyBhcyBhbnkpLldhWENvZGUgPT09IHVuZGVmaW5lZCkgKHdpbmRvdyBhcyBhbnkpLldhWENvZGUgPSB7fTtcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxyXG5cdFx0KHdpbmRvdyBhcyBhbnkpLldhWENvZGUuREJDID0gdGhpcztcclxuXHR9XHJcblx0LyoqXHJcblx0ICogUmVzb2x2ZXMgdGhlIGRlc2lyZWQge0BsaW5rIG9iamVjdCB9IG91dCBhIGdpdmVuIG9uZSAqKnRvUmVzb2x2ZUZyb20qKiB1c2luZyB0aGUgc3BlY2lmaWVkICoqcGF0aCoqLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHRvUmVzb2x2ZUZyb20gVGhlIHtAbGluayBvYmplY3QgfSBzdGFydGluZyB0byByZXNvbHZlIGZyb20uXHJcblx0ICogQHBhcmFtIHBhdGhcdFx0XHRUaGUgZG90dGVkIHBhdGgte0BsaW5rIHN0cmluZyB9LlxyXG5cdCAqIFx0XHRcdFx0XHRcdFRoaXMgc3RyaW5nIHVzZXMgLiwgWy4uLl0sIGFuZCAoKSB0byByZXByZXNlbnQgYWNjZXNzaW5nIG5lc3RlZCBwcm9wZXJ0aWVzLFxyXG5cdCAqIFx0XHRcdFx0XHRcdGFycmF5IGVsZW1lbnRzL29iamVjdCBrZXlzLCBhbmQgY2FsbGluZyBtZXRob2RzLCByZXNwZWN0aXZlbHksIG1pbWlja2luZyBKYXZhU2NyaXB0IHN5bnRheCB0byBuYXZpZ2F0ZVxyXG5cdCAqIFx0XHRcdFx0XHRcdGFuIG9iamVjdCdzIHN0cnVjdHVyZS4gQ29kZSwgZS5nLiBzb21ldGhpbmcgbGlrZSBhLmIoIDEgYXMgbnVtYmVyICkuYywgd2lsbCBub3QgYmUgZXhlY3V0ZWQgYW5kXHJcblx0ICogXHRcdFx0XHRcdFx0dGh1cyBtYWtlIHRoZSByZXRyaWV2YWwgZmFpbC5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFRoZSByZXF1ZXN0ZWQge0BsaW5rIG9iamVjdCB9LCBOVUxMIG9yIFVOREVGSU5FRC4gKi9cclxuXHRwdWJsaWMgc3RhdGljIHJlc29sdmUodG9SZXNvbHZlRnJvbTogdW5rbm93biwgcGF0aDogc3RyaW5nKSB7XHJcblx0XHRpZiAoIXRvUmVzb2x2ZUZyb20gfHwgdHlwZW9mIHBhdGggIT09IFwic3RyaW5nXCIpIHtcclxuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcclxuXHRcdH1cclxuXHJcblx0XHRjb25zdCBwYXJ0cyA9IHBhdGgucmVwbGFjZSgvXFxbKFsnXCJdPykoLio/KVxcMVxcXS9nLCBcIi4kMlwiKS5zcGxpdChcIi5cIik7IC8vIEhhbmRsZSBpbmRleGVyc1xyXG5cclxuXHRcdGxldCBjdXJyZW50ID0gdG9SZXNvbHZlRnJvbTtcclxuXHRcdGZvciAoY29uc3QgcGFydCBvZiBwYXJ0cykge1xyXG5cdFx0XHRpZiAoY3VycmVudCA9PT0gbnVsbCB8fCB0eXBlb2YgY3VycmVudCA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG5cdFx0XHRcdHJldHVybiB1bmRlZmluZWQ7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGNvbnN0IG1ldGhvZE1hdGNoID0gcGFydC5tYXRjaCgvKFxcdyspXFwoKC4qKVxcKS8pO1xyXG5cdFx0XHRpZiAobWV0aG9kTWF0Y2gpIHtcclxuXHRcdFx0XHRjb25zdCBtZXRob2ROYW1lID0gbWV0aG9kTWF0Y2hbMV07XHJcblx0XHRcdFx0Y29uc3QgYXJnc1N0ciA9IG1ldGhvZE1hdGNoWzJdO1xyXG5cdFx0XHRcdGNvbnN0IGFyZ3MgPSBhcmdzU3RyLnNwbGl0KFwiLFwiKS5tYXAoKGFyZykgPT4gYXJnLnRyaW0oKSk7IC8vIFNpbXBsZSBhcmd1bWVudCBwYXJzaW5nXHJcblx0XHRcdFx0aWYgKHR5cGVvZiBjdXJyZW50W21ldGhvZE5hbWVdID09PSBcImZ1bmN0aW9uXCIpIHtcclxuXHRcdFx0XHRcdGN1cnJlbnQgPSBjdXJyZW50W21ldGhvZE5hbWVdLmFwcGx5KGN1cnJlbnQsIGFyZ3MpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gdW5kZWZpbmVkOyAvLyBNZXRob2Qgbm90IGZvdW5kIG9yIG5vdCBhIGZ1bmN0aW9uXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGN1cnJlbnQgPSBjdXJyZW50W3BhcnRdO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGN1cnJlbnQ7XHJcblx0fVxyXG59XHJcbi8vIFNldCB0aGUgbWFpbiBpbnN0YW5jZSB3aXRoIHN0YW5kYXJkICoqREJDLmluZnJpbmdlbWVudFNldHRpbmdzKiouXHJcbm5ldyBEQkMoKTtcclxuIiwgImltcG9ydCB7IERCQyB9IGZyb20gXCIuLi9EQkNcIjtcclxuLyoqXHJcbiAqIEEge0BsaW5rIERCQyB9IGRlZmluaW5nIHRoYXQgYW4ge0BsaW5rIG9iamVjdCB9cyBtdXN0IGJlIGRlZmluZWQgdGh1cyBpdCdzIHZhbHVlIG1heSBub3QgYmUgKipudWxsKiogb3IgKip1bmRlZmluZWQqKi5cclxuICpcclxuICogQHJlbWFya3NcclxuICogTWFpbnRhaW5lcjogU2FsdmF0b3JlIENhbGxhcmkgKFhEQkNAV2FYQ29kZS5uZXQpICovXHJcbmV4cG9ydCBjbGFzcyBERUZJTkVEIGV4dGVuZHMgREJDIHtcclxuXHQvKipcclxuXHQgKiBDaGVja3MgaWYgdGhlIHZhbHVlICoqdG9DaGVjayoqIGlzIG51bGwgb3IgdW5kZWZpbmVkLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHRvQ2hlY2tcdFRoZSB7QGxpbmsgT2JqZWN0IH0gdG8gY2hlY2suXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBUUlVFIGlmIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBpcyBvZiB0aGUgc3BlY2lmaWVkICoqdHlwZSoqLCBvdGhlcndpc2UgRkFMU0UuICovXHJcblx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBOZWNlc3NhcnkgZm9yIGR5bmFtaWMgdHlwZSBjaGVja2luZyBvZiBhbHNvIFVOREVGSU5FRC5cclxuXHRwdWJsaWMgc3RhdGljIGNoZWNrQWxnb3JpdGhtKHRvQ2hlY2s6IGFueSApOiBib29sZWFuIHwgc3RyaW5nIHtcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvdXNlVmFsaWRUeXBlb2Y6IE5lY2Vzc2FyeVxyXG5cdFx0aWYgKCB0b0NoZWNrID09PSB1bmRlZmluZWQgfHwgdG9DaGVjayA9PT0gbnVsbCApIHtcclxuXHRcdFx0cmV0dXJuIGBWYWx1ZSBtYXkgbm90IGJlIFVOREVGSU5FRCBvciBOVUxMIGJ1dCBpdCBpcyAkeyB0b0NoZWNrID09PSB1bmRlZmluZWQgPyBcIlVOREVGSU5FRFwiIDogXCJOVUxMXCJ9YDtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdHJ1ZTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogQSBwYXJhbWV0ZXItZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBERUZJTkVELmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXHJcblx0ICogYnkgdGhlIHRhZ2dlZCBwYXJhbWV0ZXIuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdHlwZVx0U2VlIHtAbGluayBERUZJTkVELmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIHBhdGhcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqIEBwYXJhbSBkYmNcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uICovXHJcblx0cHVibGljIHN0YXRpYyBQUkUoXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXHJcblx0KTogKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRtZXRob2ROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXHJcblx0XHRwYXJhbWV0ZXJJbmRleDogbnVtYmVyLFxyXG5cdCkgPT4gdm9pZCB7XHJcblx0XHRyZXR1cm4gREJDLmRlY1ByZWNvbmRpdGlvbihcclxuXHRcdFx0KFxyXG5cdFx0XHRcdHZhbHVlOiBvYmplY3QsXHJcblx0XHRcdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRcdFx0bWV0aG9kTmFtZTogc3RyaW5nLFxyXG5cdFx0XHRcdHBhcmFtZXRlckluZGV4OiBudW1iZXIsXHJcblx0XHRcdCkgPT4ge1xyXG5cdFx0XHRcdHJldHVybiBERUZJTkVELmNoZWNrQWxnb3JpdGhtKHZhbHVlKTtcclxuXHRcdFx0fSxcclxuXHRcdFx0ZGJjLFxyXG5cdFx0XHRwYXRoLFxyXG5cdFx0KTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogQSBtZXRob2QtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBERUZJTkVELmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXHJcblx0ICogYnkgdGhlIHRhZ2dlZCBtZXRob2QncyByZXR1cm52YWx1ZS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0eXBlXHRTZWUge0BsaW5rIERFRklORUQuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gcGF0aFx0U2VlIHtAbGluayBEQkMuUG9zdGNvbmRpdGlvbiB9LlxyXG5cdCAqIEBwYXJhbSBkYmNcdFNlZSB7QGxpbmsgREJDLmRlY1Bvc3Rjb25kaXRpb24gfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY1Bvc3Rjb25kaXRpb24gfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIFBPU1QoXHJcblx0XHR0eXBlOiBzdHJpbmcsXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXHJcblx0KTogKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRwcm9wZXJ0eUtleTogc3RyaW5nLFxyXG5cdFx0ZGVzY3JpcHRvcjogUHJvcGVydHlEZXNjcmlwdG9yLFxyXG5cdCkgPT4gUHJvcGVydHlEZXNjcmlwdG9yIHtcclxuXHRcdHJldHVybiBEQkMuZGVjUG9zdGNvbmRpdGlvbihcclxuXHRcdFx0KHZhbHVlOiBvYmplY3QsIHRhcmdldDogb2JqZWN0LCBwcm9wZXJ0eUtleTogc3RyaW5nKSA9PiB7XHJcblx0XHRcdFx0cmV0dXJuIERFRklORUQuY2hlY2tBbGdvcml0aG0odmFsdWUpO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRkYmMsXHJcblx0XHRcdHBhdGgsXHJcblx0XHQpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBBIGZpZWxkLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgREVGSU5FRC5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxyXG5cdCAqIGJ5IHRoZSB0YWdnZWQgZmllbGQuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdHlwZVx0U2VlIHtAbGluayBERUZJTkVELmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIHBhdGhcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxyXG5cdCAqIEBwYXJhbSBkYmNcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uICovXHJcblx0cHVibGljIHN0YXRpYyBJTlZBUklBTlQoXHJcblx0XHR0eXBlOiBzdHJpbmcsXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXHJcblx0KSB7XHJcblx0XHRyZXR1cm4gREJDLmRlY0ludmFyaWFudChbbmV3IERFRklORUQoKV0sIHBhdGgsIGRiYyk7XHJcblx0fVxyXG5cdC8vICNlbmRyZWdpb24gQ29uZGl0aW9uIGNoZWNraW5nLlxyXG5cdC8vICNyZWdpb24gUmVmZXJlbmNlZCBDb25kaXRpb24gY2hlY2tpbmcuXHJcblx0Ly9cclxuXHQvLyBGb3IgdXNhZ2UgaW4gZHluYW1pYyBzY2VuYXJpb3MgKGxpa2Ugd2l0aCBBRS1EQkMpLlxyXG5cdC8vXHJcblx0LyoqXHJcblx0ICogSW52b2tlcyB0aGUge0BsaW5rIERFRklORUQuY2hlY2tBbGdvcml0aG0gfSBwYXNzaW5nIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBhbmQgdGhlIHtAbGluayBERUZJTkVELnR5cGUgfSAuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdG9DaGVjayBTZWUge0BsaW5rIERFRklORUQuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREVGSU5FRC5jaGVja0FsZ29yaXRobX0uICovXHJcblx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XHJcblx0cHVibGljIGNoZWNrKHRvQ2hlY2s6IGFueSkge1xyXG5cdFx0cmV0dXJuIERFRklORUQuY2hlY2tBbGdvcml0aG0odG9DaGVjayk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEludm9rZXMgdGhlIHtAbGluayBERUZJTkVELmNoZWNrQWxnb3JpdGhtIH0gcGFzc2luZyB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHRoZSB7QGxpbmsgREVGSU5FRC50eXBlIH0gLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHRvQ2hlY2tcdFNlZSB7QGxpbmsgREVGSU5FRC5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBpZFx0XHRBIHtAbGluayBzdHJpbmcgfSBpZGVudGlmeWluZyB0aGlzIHtAbGluayBJTlNUQU5DRSB9IHZpYSB0aGUge0BsaW5rIERCQy5JbmZyaW5nZW1lbnQgfS1NZXNzYWdlLlxyXG5cdCAqIFxyXG5cdCAqIEByZXR1cm5zIFRoZSAqKkNBTkRJREFURSoqICoqdG9DaGVjayoqIGRvZXNuJ3QgZnVsZmlsbCB0aGlzIHtAbGluayBERUZJTkVEIH0uXHJcblx0ICogXHJcblx0ICogQHRocm93cyBBIHtAbGluayBEQkMuSW5mcmluZ2VtZW50IH0gaWYgdGhlICoqQ0FORElEQVRFKiogKip0b0NoZWNrKiogZG9lcyBub3QgZnVsZmlsbCB0aGlzIHtAbGluayBERUZJTkVEIH0uKi9cclxuXHRwdWJsaWMgc3RhdGljIHRzQ2hlY2s8Q0FORElEQVRFID0gdW5rbm93biA+KCB0b0NoZWNrIDogQ0FORElEQVRFIHwgdW5kZWZpbmVkIHwgbnVsbCwgaWQgOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQgKSA6IENBTkRJREFURSB7XHJcblx0XHRjb25zdCByZXN1bHQgPSBERUZJTkVELmNoZWNrQWxnb3JpdGhtKHRvQ2hlY2spO1xyXG5cclxuXHRcdGlmKCByZXN1bHQgPT09IHRydWUgKSB7XHJcblx0XHRcdHJldHVybiB0b0NoZWNrIGFzIENBTkRJREFURSA7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dGhyb3cgbmV3IERCQy5JbmZyaW5nZW1lbnQoIGAke2lkP2AoJHtpZH0pIGA6XCJcIn0ke3Jlc3VsdCBhcyBzdHJpbmcgfWApO1xyXG5cdFx0fVxyXG5cdH1cclxuXHQvKiogQ3JlYXRlcyB0aGlzIHtAbGluayBERUZJTkVEIH0uICovXHJcblx0cHVibGljIGNvbnN0cnVjdG9yKCkge1xyXG5cdFx0c3VwZXIoKTtcclxuXHR9XHJcbn1cclxuIiwgImltcG9ydCB7IERCQyB9IGZyb20gXCIuLi9EQkNcIjtcclxuLyoqXHJcbiAqIEEge0BsaW5rIERCQyB9IGRlZmluaW5nIHRoYXQgdGhlIGFuIHtAbGluayBvYmplY3QgfXMgZ290dGEgYmUgYW4gaW5zdGFuY2Ugb2YgYSBjZXJ0YWluIHtAbGluayBJTlNUQU5DRS5yZWZlcmVuY2UgfS5cclxuICpcclxuICogQHJlbWFya3NcclxuICogTWFpbnRhaW5lcjogU2FsdmF0b3JlIENhbGxhcmkgKFhEQkNAV2FYQ29kZS5uZXQpICovXHJcbmV4cG9ydCBjbGFzcyBJTlNUQU5DRSBleHRlbmRzIERCQyB7XHJcblx0LyoqXHJcblx0ICogQ2hlY2tzIGlmIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBpcyBhbiBpbnN0YW5jZSBvZiB0aGUgc3BlY2lmaWVkICoqcmVmZXJlbmNlKiouXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdG9DaGVja1x0VGhlIHZhbHVlIHRoYXQgaGFzIHRvIGJlIGFuIGluc3RhbmNlIG9mIHRoZSAqKnJlZmVyZW5jZSoqIGluIG9yZGVyIGZvciB0aGlzIHtAbGluayBEQkMgfVxyXG5cdCAqIFx0XHRcdFx0XHR0byBiZSBmdWxmaWxsZWQuXHJcblx0ICogQHBhcmFtIHJlZmVyZW5jZVx0VGhlIHtAbGluayBvYmplY3QgfSB0aGUgb25lICoqdG9DaGVjayoqIGhhcyB0byBiZSBhbiBpbnN0YW5jZSBvZi5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFRSVUUgaWYgdGhlIHZhbHVlICoqdG9DaGVjayoqIGlzIGlzIGFuIGluc3RhbmNlIG9mIHRoZSAqcmVmZXJlbmNlKiosIG90aGVyd2lzZSBGQUxTRS4gKi9cclxuXHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IEluIG9yZGVyIHRvIHBlcmZvcm0gYW4gXCJpbnN0YW5jZW9mXCIgY2hlY2suXHJcblx0cHVibGljIHN0YXRpYyBjaGVja0FsZ29yaXRobSh0b0NoZWNrOiBhbnksIHJlZmVyZW5jZTogYW55KTogYm9vbGVhbiB8IHN0cmluZyB7XHJcblx0XHRpZiAoISh0b0NoZWNrIGluc3RhbmNlb2YgcmVmZXJlbmNlKSkge1xyXG5cdFx0XHRyZXR1cm4gYFZhbHVlIGhhcyB0byBiZSBhbiBpbnN0YW5jZSBvZiBcIiR7cmVmZXJlbmNlfVwiIGJ1dCBpcyBvZiB0eXBlIFwiJHt0eXBlb2YgdG9DaGVja31cImA7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHRydWU7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgcGFyYW1ldGVyLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcclxuXHQgKiBieSB0aGUgdGFnZ2VkIHBhcmFtZXRlci5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSByZWZlcmVuY2VcdFNlZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gcGF0aFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXHJcblx0ICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIFBSRShcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogSW4gb3JkZXIgdG8gcGVyZm9ybSBhbiBcImluc3RhbmNlb2ZcIiBjaGVjay5cclxuXHRcdHJlZmVyZW5jZTogYW55LFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjID0gXCJXYVhDb2RlLkRCQ1wiLFxyXG5cdCk6IChcclxuXHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0bWV0aG9kTmFtZTogc3RyaW5nIHwgc3ltYm9sLFxyXG5cdFx0cGFyYW1ldGVySW5kZXg6IG51bWJlcixcclxuXHQpID0+IHZvaWQge1xyXG5cdFx0cmV0dXJuIERCQy5kZWNQcmVjb25kaXRpb24oXHJcblx0XHRcdChcclxuXHRcdFx0XHR2YWx1ZTogb2JqZWN0LFxyXG5cdFx0XHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0XHRcdG1ldGhvZE5hbWU6IHN0cmluZyxcclxuXHRcdFx0XHRwYXJhbWV0ZXJJbmRleDogbnVtYmVyLFxyXG5cdFx0XHQpID0+IHtcclxuXHRcdFx0XHRyZXR1cm4gSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0odmFsdWUsIHJlZmVyZW5jZSk7XHJcblx0XHRcdH0sXHJcblx0XHRcdGRiYyxcclxuXHRcdFx0cGF0aCxcclxuXHRcdCk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcclxuXHQgKiBieSB0aGUgdGFnZ2VkIG1ldGhvZCdzIHJldHVybnZhbHVlLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHJlZmVyZW5jZVx0U2VlIHtAbGluayBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRTZWUge0BsaW5rIERCQy5Qb3N0Y29uZGl0aW9uIH0uXHJcblx0ICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgUE9TVChcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogSW4gb3JkZXIgdG8gcGVyZm9ybSBhbiBcImluc3RhbmNlb2ZcIiBjaGVjay5cclxuXHRcdHJlZmVyZW5jZTogYW55LFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjID0gXCJXYVhDb2RlLkRCQ1wiLFxyXG5cdCk6IChcclxuXHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0cHJvcGVydHlLZXk6IHN0cmluZyxcclxuXHRcdGRlc2NyaXB0b3I6IFByb3BlcnR5RGVzY3JpcHRvcixcclxuXHQpID0+IFByb3BlcnR5RGVzY3JpcHRvciB7XHJcblx0XHRyZXR1cm4gREJDLmRlY1Bvc3Rjb25kaXRpb24oXHJcblx0XHRcdCh2YWx1ZTogb2JqZWN0LCB0YXJnZXQ6IG9iamVjdCwgcHJvcGVydHlLZXk6IHN0cmluZykgPT4ge1xyXG5cdFx0XHRcdHJldHVybiBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSh2YWx1ZSwgcmVmZXJlbmNlKTtcclxuXHRcdFx0fSxcclxuXHRcdFx0ZGJjLFxyXG5cdFx0XHRwYXRoLFxyXG5cdFx0KTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogQSBmaWVsZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXHJcblx0ICogYnkgdGhlIHRhZ2dlZCBtZXRob2QncyByZXR1cm52YWx1ZS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSByZWZlcmVuY2VcdFNlZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gcGF0aFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXHJcblx0ICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIElOVkFSSUFOVChcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogSW4gb3JkZXIgdG8gcGVyZm9ybSBhbiBcImluc3RhbmNlb2ZcIiBjaGVjay5cclxuXHRcdHJlZmVyZW5jZTogYW55LFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjID0gXCJXYVhDb2RlLkRCQ1wiLFxyXG5cdCkge1xyXG5cdFx0cmV0dXJuIERCQy5kZWNJbnZhcmlhbnQoW25ldyBJTlNUQU5DRShyZWZlcmVuY2UpXSwgcGF0aCwgZGJjKTtcclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXHJcblx0Ly8gI3JlZ2lvbiBSZWZlcmVuY2VkIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvL1xyXG5cdC8vIEZvciB1c2FnZSBpbiBkeW5hbWljIHNjZW5hcmlvcyAobGlrZSB3aXRoIEFFLURCQykuXHJcblx0Ly9cclxuXHQvKipcclxuXHQgKiBJbnZva2VzIHRoZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfSBwYXNzaW5nIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBhbmQgdGhlIHtAbGluayBJTlNUQU5DRS5yZWZlcmVuY2UgfSAuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdG9DaGVjayBTZWUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtfS4gKi9cclxuXHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cclxuXHRwdWJsaWMgY2hlY2sodG9DaGVjazogYW55KSB7XHJcblx0XHRyZXR1cm4gSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0odG9DaGVjaywgdGhpcy5yZWZlcmVuY2UpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBJbnZva2VzIHRoZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfSBwYXNzaW5nIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBhbmQgdGhlIHtAbGluayBJTlNUQU5DRS5yZWZlcmVuY2UgfSAuXHJcblx0ICogXHJcblx0ICogQHBhcmFtIHRvQ2hlY2sgXHRTZWUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIHJlZmVyZW5jZVx0U2VlIHtAbGluayBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBpZFx0XHRBIHtAbGluayBzdHJpbmcgfSBpZGVudGlmeWluZyB0aGlzIHtAbGluayBJTlNUQU5DRSB9IHZpYSB0aGUge0BsaW5rIERCQy5JbmZyaW5nZW1lbnQgfS1NZXNzYWdlLlxyXG5cdCAqIFxyXG5cdCAqIEByZXR1cm5zIFRoZSAqKkNBTkRJREFURSoqICoqdG9DaGVjayoqIGRvZXNuJ3QgZnVsZmlsbCB0aGlzIHtAbGluayBJTlNUQU5DRSB9LlxyXG5cdCAqIFxyXG5cdCAqIEB0aHJvd3MgQSB7QGxpbmsgREJDLkluZnJpbmdlbWVudCB9IGlmIHRoZSAqKkNBTkRJREFURSoqICoqdG9DaGVjayoqIGRvZXMgbm90IGZ1bGZpbGwgdGhpcyB7QGxpbmsgREVGSU5FRCB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgdHNDaGVjayA8IENBTkRJREFURSA9IHVua25vd24gPiAoIHRvQ2hlY2sgOiBhbnksIHJlZmVyZW5jZSA6IGFueSwgaWQgOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQgKSA6IENBTkRJREFURSB7XHJcblx0XHRjb25zdCByZXN1bHQgPSBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSh0b0NoZWNrLCByZWZlcmVuY2UpO1xyXG5cclxuXHRcdGlmKCByZXN1bHQgPT09IHRydWUgKSB7XHJcblx0XHRcdHJldHVybiB0b0NoZWNrIDtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHR0aHJvdyBuZXcgREJDLkluZnJpbmdlbWVudCggYCR7aWQ/YCgke2lkfSkgYDpcIlwifSR7cmVzdWx0IGFzIHN0cmluZyB9YCk7XHJcblx0XHR9XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIENyZWF0ZXMgdGhpcyB7QGxpbmsgSU5TVEFOQ0UgfSBieSBzZXR0aW5nIHRoZSBwcm90ZWN0ZWQgcHJvcGVydHkge0BsaW5rIElOU1RBTkNFLnJlZmVyZW5jZSB9IHVzZWQgYnkge0BsaW5rIElOU1RBTkNFLmNoZWNrIH0uXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gcmVmZXJlbmNlIFNlZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2sgfS4gKi9cclxuXHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cclxuXHRwdWJsaWMgY29uc3RydWN0b3IocHJvdGVjdGVkIHJlZmVyZW5jZTogYW55KSB7XHJcblx0XHRzdXBlcigpO1xyXG5cdH1cclxufVxyXG4iLCAiaW1wb3J0IHsgREJDIH0gZnJvbSBcIi4uL0RCQ1wiO1xyXG4vKipcclxuICogQSB7QGxpbmsgREJDIH0gZGVmaW5pbmcgdGhhdCBhbGwgZWxlbWVudHMgb2YgYW4ge0BsaW5rIG9iamVjdCB9cyBoYXZlIHRvIGZ1bGZpbGxcclxuICogb25lIG9mIHRoZSBnaXZlbiB7QGxpbmsgb2JqZWN0IH1zIGNoZWNrLW1ldGhvZHMgKCoqKCB0b0NoZWNrIDogYW55ICkgPT4gYm9vbGVhbiB8IHN0cmluZyoqICkuXHJcbiAqXHJcbiAqIEByZW1hcmtzXHJcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoWERCQ0BXYVhDb2RlLm5ldCkgKi9cclxuZXhwb3J0IGNsYXNzIE9SIGV4dGVuZHMgREJDIHtcclxuXHQvLyAjcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvKipcclxuXHQgKiBDaGVja3MgdGhlICoqdmFsdWUqKiBhZ2FpbnN0IHRoZSBnaXZlbiAqKmNvbmRpdGlvbnMqKlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIGNvbmRpdGlvbnNcdFRoZSAqKnsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSoqLXtAbGluayBvYmplY3QgfXMgdG8gY2hlY2sgdGhlICoqdmFsdWUqKiBhZ2FpbnN0LlxyXG5cdCAqIEBwYXJhbSB2YWx1ZVx0XHRcdEVpdGhlciAqKnZhbHVlKiote0BsaW5rIEFycmF5IDwgYW55ID59LCB3aGljaCdzIGVsZW1lbnRzIHdpbGwgYmUgY2hlY2tlZCwgb3IgdGhlIHZhbHVlIHRvIGJlXHJcblx0ICogXHRcdFx0XHRcdFx0Y2hlY2tlZCBpdHNlbGYuXHJcblx0ICogQHBhcmFtIGluZGV4XHRcdFx0SWYgc3BlY2lmaWVkIHdpdGggXCJpZHhFbmRcIiBiZWluZyB1bmRlZmluZWQsIHRoaXMge0BsaW5rIE51bWJlciB9IHdpbGwgYmUgc2VlbiBhcyB0aGUgaW5kZXggb2ZcclxuXHQgKiBcdFx0XHRcdFx0XHR0aGUgdmFsdWUte0BsaW5rIEFycmF5IH0ncyBlbGVtZW50IHRvIGNoZWNrLiBJZiB2YWx1ZSBpc24ndCBhbiB7QGxpbmsgQXJyYXkgfSB0aGlzIHBhcmFtZXRlclxyXG5cdCAqIFx0XHRcdFx0XHRcdHdpbGwgbm90IGhhdmUgYW55IGVmZmVjdC5cclxuXHQgKiBcdFx0XHRcdFx0XHRXaXRoIFwiaWR4RW5kXCIgbm90IHVuZGVmaW5lZCB0aGlzIHBhcmFtZXRlciBpbmRpY2F0ZXMgdGhlIGJlZ2lubmluZyBvZiB0aGUgc3BhbiBvZiBlbGVtZW50cyB0b1xyXG5cdCAqIFx0XHRcdFx0XHRcdGNoZWNrIHdpdGhpbiB0aGUgdmFsdWUte0BsaW5rIEFycmF5IH0uXHJcblx0ICogQHBhcmFtIGlkeEVuZFx0XHRJbmRpY2F0ZXMgdGhlIGxhc3QgZWxlbWVudCdzIGluZGV4IChpbmNsdWRpbmcpIG9mIHRoZSBzcGFuIG9mIHZhbHVlLXtAbGluayBBcnJheSB9IGVsZW1lbnRzIHRvIGNoZWNrLlxyXG5cdCAqIFx0XHRcdFx0XHRcdFNldHRpbmcgdGhpcyBwYXJhbWV0ZXIgdG8gLTEgc3BlY2lmaWVzIHRoYXQgYWxsIHZhbHVlLXtAbGluayBBcnJheSB9J3MgZWxlbWVudHMgYmVnaW5uaW5nIGZyb20gdGhlXHJcblx0ICogXHRcdFx0XHRcdFx0c3BlY2lmaWVkICoqaW5kZXgqKiBzaGFsbCBiZSBjaGVja2VkLlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgVFJVRSBpZiBhdCBsZWFzdCBvbmUgb2YgdGhlIHByb3ZpZGVkICoqY29uZGl0aW9ucyoqIGlzIGZ1bGZpbGxlZCwgb3RoZXJ3aXNlIGEge0BsaW5rIHN0cmluZyB9IGNvbnRhaW5pbmcgYWxsICoqY29uZGl0aW9ucyoqIHJldHVybmVkIHtAbGluayBzdHJpbmcgfXMgc2VwYXJhdGVkIGJ5IFwiIHx8IFwiLiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgY2hlY2tBbGdvcml0aG0oXHJcblx0XHRjb25kaXRpb25zOiBBcnJheTx7XHJcblx0XHRcdGNoZWNrOiAodG9DaGVjazogdW5rbm93biB8IHVuZGVmaW5lZCB8IG51bGwgfCBvYmplY3QpID0+IGJvb2xlYW4gfCBzdHJpbmc7XHJcblx0XHR9PixcclxuXHRcdHZhbHVlOiB1bmtub3duIHwgbnVsbCB8IHVuZGVmaW5lZCxcclxuXHQpOiBib29sZWFuIHwgc3RyaW5nIHtcclxuXHRcdGxldCByZXN1bHQgPSBcIlwiO1xyXG5cclxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgY29uZGl0aW9ucy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRjb25zdCBjb25kaXRpb25SZXN1bHQgPSBjb25kaXRpb25zW2ldLmNoZWNrKHZhbHVlKTtcclxuXHJcblx0XHRcdGlmICh0eXBlb2YgY29uZGl0aW9uUmVzdWx0ID09PSBcInN0cmluZ1wiKSB7XHJcblx0XHRcdFx0cmVzdWx0ICs9IGAke2NvbmRpdGlvblJlc3VsdH0ke2kgPT09IGNvbmRpdGlvbnMubGVuZ3RoIC0gMSA/IFwiXCIgOiBcIiBvciBcIn1gO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHJlc3VsdDtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogQSBwYXJhbWV0ZXItZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBPUi5jaGVja0FsZ29yaXRobSB9IHdpdGggZWl0aGVyIG11bHRpcGxlIG9yIGEgc2luZ2xlIG9uZVxyXG5cdCAqIG9mIHRoZSAqKnJlYWxDb25kaXRpb25zKiogdG8gY2hlY2sgdGhlIHRhZ2dlZCBwYXJhbWV0ZXItdmFsdWUgYWdhaW5zdCB3aXRoLlxyXG5cdCAqIFdoZW4gc3BlY2lmeWluZyBhbiAqKmluZGV4KiogYW5kIHRoZSB0YWdnZWQgcGFyYW1ldGVyJ3MgKip2YWx1ZSoqIGlzIGFuIHtAbGluayBBcnJheSB9LCB0aGUgKipyZWFsQ29uZGl0aW9ucyoqIGFwcGx5IHRvIHRoZVxyXG5cdCAqIGVsZW1lbnQgYXQgdGhlIHNwZWNpZmllZCAqKmluZGV4KiouXHJcblx0ICogSWYgdGhlIHtAbGluayBBcnJheSB9IGlzIHRvbyBzaG9ydCB0aGUgY3VycmVudGx5IHByb2Nlc3NlZCB7IGNoZWNrOiAodG9DaGVjazogYW55KSA9PiBib29sZWFuIHwgc3RyaW5nIH0gb2ZcclxuXHQgKiAqKnJlYWxDb25kaXRpb25zKiogd2lsbCBiZSB2ZXJpZmllZCB0byBUUlVFIGF1dG9tYXRpY2FsbHksIGNvbnNpZGVyaW5nIG9wdGlvbmFsIHBhcmFtZXRlcnMuXHJcblx0ICogSWYgYW4gKippbmRleCoqIGlzIHNwZWNpZmllZCBidXQgdGhlIHRhZ2dlZCBwYXJhbWV0ZXIncyB2YWx1ZSBpc24ndCBhbiBhcnJheSwgdGhlICoqaW5kZXgqKiBpcyB0cmVhdGVkIGFzIGJlaW5nIHVuZGVmaW5lZC5cclxuXHQgKiBJZiAqKmluZGV4KiogaXMgdW5kZWZpbmVkIGFuZCB0aGUgdGFnZ2VkIHBhcmFtZXRlcidzIHZhbHVlIGlzIGFuIHtAbGluayBBcnJheSB9IGVhY2ggZWxlbWVudCBvZiBpdCB3aWxsIGJlIGNoZWNrZWRcclxuXHQgKiBhZ2FpbnN0IHRoZSAqKnJlYWxDb25kaXRpb25zKiouXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gcmVhbENvbmRpdGlvbnNcdEVpdGhlciBvbmUgb3IgbW9yZSAqKnsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSoqIHRvIGNoZWNrIHRoZSB0YWdnZWQgcGFyYW1ldGVyLXZhbHVlXHJcblx0ICogXHRcdFx0XHRcdFx0XHRhZ2FpbnN0IHdpdGguXHJcblx0ICogQHBhcmFtIHBhdGhcdFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqIEBwYXJhbSBkYmNcdFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnNcdEEge0BsaW5rIHN0cmluZyB9IGFzIHNvb24gYXMgb25lIHsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSBvZiAqKnJlYWxDb25kaXRpb25zKiogcmV0dXJucyBvbmUuXHJcblx0ICogXHRcdFx0T3RoZXJ3aXNlIFRSVUUuICovXHJcblx0cHVibGljIHN0YXRpYyBQUkUoXHJcblx0XHRjb25kaXRpb25zOiBBcnJheTx7XHJcblx0XHRcdGNoZWNrOiAodG9DaGVjazogdW5rbm93biB8IHVuZGVmaW5lZCB8IG51bGwgfCBvYmplY3QpID0+IGJvb2xlYW4gfCBzdHJpbmc7XHJcblx0XHR9PixcclxuXHRcdHBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGRiYyA9IFwiV2FYQ29kZS5EQkNcIixcclxuXHQpOiAoXHJcblx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdG1ldGhvZE5hbWU6IHN0cmluZyB8IHN5bWJvbCxcclxuXHRcdHBhcmFtZXRlckluZGV4OiBudW1iZXIsXHJcblx0KSA9PiB2b2lkIHtcclxuXHRcdHJldHVybiBEQkMuZGVjUHJlY29uZGl0aW9uKFxyXG5cdFx0XHQoXHJcblx0XHRcdFx0dmFsdWU6IG9iamVjdCxcclxuXHRcdFx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdFx0XHRtZXRob2ROYW1lOiBzdHJpbmcsXHJcblx0XHRcdFx0cGFyYW1ldGVySW5kZXg6IG51bWJlcixcclxuXHRcdFx0KSA9PiB7XHJcblx0XHRcdFx0cmV0dXJuIE9SLmNoZWNrQWxnb3JpdGhtKGNvbmRpdGlvbnMsIHZhbHVlKTtcclxuXHRcdFx0fSxcclxuXHRcdFx0ZGJjLFxyXG5cdFx0XHRwYXRoLFxyXG5cdFx0KTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogQSBtZXRob2QtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBPUi5jaGVja0FsZ29yaXRobSB9IHdpdGggZWl0aGVyIG11bHRpcGxlIG9yIGEgc2luZ2xlIG9uZVxyXG5cdCAqIG9mIHRoZSAqKnJlYWxDb25kaXRpb25zKiogdG8gY2hlY2sgdGhlIHRhZ2dlZCBtZXRob2QncyByZXR1cm4tdmFsdWUgYWdhaW5zdCB3aXRoLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHJlYWxDb25kaXRpb25zXHRFaXRoZXIgb25lIG9yIG1vcmUgeyBjaGVjazogKHRvQ2hlY2s6IGFueSkgPT4gYm9vbGVhbiB8IHN0cmluZyB9IHRvIGNoZWNrIHRoZSB0YWdnZWQgcGFyYW1ldGVyLXZhbHVlXHJcblx0ICogXHRcdFx0XHRcdFx0XHRhZ2FpbnN0IHdpdGguXHJcblx0ICogQHBhcmFtIHBhdGhcdFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqIEBwYXJhbSBkYmNcdFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnNcdEEge0BsaW5rIHN0cmluZyB9IGFzIHNvb24gYXMgb25lICoqeyBjaGVjazogKHRvQ2hlY2s6IGFueSkgPT4gYm9vbGVhbiB8IHN0cmluZyB9Kiogb2YgKipyZWFsQ29uZGl0aW9ucyoqIHJldHVybiBvbmUuXHJcblx0ICogXHRcdFx0T3RoZXJ3aXNlIFRSVUUuICovXHJcblx0cHVibGljIHN0YXRpYyBQT1NUKFxyXG5cdFx0Y29uZGl0aW9uczogQXJyYXk8e1xyXG5cdFx0XHRjaGVjazogKHRvQ2hlY2s6IHVua25vd24gfCB1bmRlZmluZWQgfCBudWxsIHwgb2JqZWN0KSA9PiBib29sZWFuIHwgc3RyaW5nO1xyXG5cdFx0fT4sXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXHJcblx0KTogKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRwcm9wZXJ0eUtleTogc3RyaW5nLFxyXG5cdFx0ZGVzY3JpcHRvcjogUHJvcGVydHlEZXNjcmlwdG9yLFxyXG5cdCkgPT4gUHJvcGVydHlEZXNjcmlwdG9yIHtcclxuXHRcdHJldHVybiBEQkMuZGVjUG9zdGNvbmRpdGlvbihcclxuXHRcdFx0KHZhbHVlOiBvYmplY3QsIHRhcmdldDogb2JqZWN0LCBwcm9wZXJ0eUtleTogc3RyaW5nKSA9PiB7XHJcblx0XHRcdFx0cmV0dXJuIE9SLmNoZWNrQWxnb3JpdGhtKGNvbmRpdGlvbnMsIHZhbHVlKTtcclxuXHRcdFx0fSxcclxuXHRcdFx0ZGJjLFxyXG5cdFx0XHRwYXRoLFxyXG5cdFx0KTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogQSBmaWVsZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIE9SLmNoZWNrQWxnb3JpdGhtIH0gd2l0aCBlaXRoZXIgbXVsdGlwbGUgb3IgYSBzaW5nbGUgb25lXHJcblx0ICogb2YgdGhlICoqcmVhbENvbmRpdGlvbnMqKiB0byBjaGVjayB0aGUgdGFnZ2VkIGZpZWxkLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHJlYWxDb25kaXRpb25zXHRFaXRoZXIgb25lIG9yIG1vcmUgeyBjaGVjazogKHRvQ2hlY2s6IGFueSkgPT4gYm9vbGVhbiB8IHN0cmluZyB9IHRvIGNoZWNrIHRoZSB0YWdnZWQgcGFyYW1ldGVyLXZhbHVlXHJcblx0ICogXHRcdFx0XHRcdFx0XHRhZ2FpbnN0IHdpdGguXHJcblx0ICogQHBhcmFtIHBhdGhcdFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxyXG5cdCAqIEBwYXJhbSBkYmNcdFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnNcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgSU5WQVJJQU5UKFxyXG5cdFx0Y29uZGl0aW9uczogQXJyYXk8e1xyXG5cdFx0XHRjaGVjazogKHRvQ2hlY2s6IHVua25vd24gfCB1bmRlZmluZWQgfCBudWxsIHwgb2JqZWN0KSA9PiBib29sZWFuIHwgc3RyaW5nO1xyXG5cdFx0fT4sXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXHJcblx0KSB7XHJcblx0XHRyZXR1cm4gREJDLmRlY0ludmFyaWFudChbbmV3IE9SKGNvbmRpdGlvbnMpXSwgcGF0aCwgZGJjKTtcclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXHJcblx0Ly8gI3JlZ2lvbiBSZWZlcmVuY2VkIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvL1xyXG5cdC8vIEZvciB1c2FnZSBpbiBkeW5hbWljIHNjZW5hcmlvcyAobGlrZSBnbG9iYWwgZnVuY3Rpb25zKS5cclxuXHQvL1xyXG5cdC8qKlxyXG5cdCAqIEludm9rZXMgdGhlIHtAbGluayBPUi5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqIGFuZCB7QGxpbmsgT1IuY29uZGl0aW9ucyB9LlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHRvQ2hlY2sgU2VlIHtAbGluayBPUi5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBPUi5jaGVja0FsZ29yaXRobX0uICovXHJcblx0cHVibGljIGNoZWNrKHRvQ2hlY2s6IHVua25vd24gfCBudWxsIHwgdW5kZWZpbmVkKSB7XHJcblx0XHRyZXR1cm4gT1IuY2hlY2tBbGdvcml0aG0odGhpcy5jb25kaXRpb25zLCB0b0NoZWNrKTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogSW52b2tlcyB0aGUge0BsaW5rIE9SLmNoZWNrQWxnb3JpdGhtIH0gcGFzc2luZyB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHRoZSB7QGxpbmsgT1IudHlwZSB9IC5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0b0NoZWNrIFNlZSB7QGxpbmsgT1IuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFRoZSAqKkNBTkRJREFURSoqICoqdG9DaGVjayoqIGRvZXNuJ3QgZnVsZmlsbCB0aGlzIHtAbGluayBPUiB9LlxyXG5cdCAqIFxyXG5cdCAqIEB0aHJvd3MgQSB7QGxpbmsgREJDLkluZnJpbmdlbWVudCB9IGlmIHRoZSAqKkNBTkRJREFURSoqICoqdG9DaGVjayoqIGRvZXMgbm90IGZ1bGZpbGwgdGhpcyB7QGxpbmsgT1IgfS4qL1xyXG5cdHB1YmxpYyBzdGF0aWMgdHNDaGVjazxDQU5ESURBVEU+KCB0b0NoZWNrIDogdW5rbm93biB8IHVuZGVmaW5lZCB8IG51bGwsY29uZGl0aW9uczogQXJyYXk8e1xyXG5cdFx0XHRjaGVjazogKHRvQ2hlY2s6IHVua25vd24gfCB1bmRlZmluZWQgfCBudWxsIHwgb2JqZWN0KSA9PiBib29sZWFuIHwgc3RyaW5nO1xyXG5cdFx0fT4gKSA6IENBTkRJREFURSB7XHJcblx0XHRjb25zdCByZXN1bHQgPSBPUi5jaGVja0FsZ29yaXRobShjb25kaXRpb25zLHRvQ2hlY2sgKTtcclxuXHJcblx0XHRpZiggcmVzdWx0ICkge1xyXG5cdFx0XHRyZXR1cm4gdG9DaGVjayBhcyBDQU5ESURBVEUgO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHRocm93IG5ldyBEQkMuSW5mcmluZ2VtZW50KCByZXN1bHQgYXMgc3RyaW5nICk7XHJcblx0XHR9XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIENyZWF0ZXMgdGhpcyB7QGxpbmsgT1IgfSBieSBzZXR0aW5nIHRoZSBwcm90ZWN0ZWQgcHJvcGVydHkge0BsaW5rIE9SLmNvbmRpdGlvbnMgfSB1c2VkIGJ5IHtAbGluayBPUi5jaGVjayB9LlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIGNvbmRpdGlvbnMgU2VlIHtAbGluayBPUi5jaGVjayB9LiAqL1xyXG5cdHB1YmxpYyBjb25zdHJ1Y3RvcihcclxuXHRcdHByb3RlY3RlZCBjb25kaXRpb25zOiBBcnJheTx7XHJcblx0XHRcdGNoZWNrOiAodG9DaGVjazogdW5rbm93biB8IHVuZGVmaW5lZCB8IG51bGwpID0+IGJvb2xlYW4gfCBzdHJpbmc7XHJcblx0XHR9PixcclxuXHQpIHtcclxuXHRcdHN1cGVyKCk7XHJcblx0fVxyXG5cdC8vICNlbmRyZWdpb24gUmVmZXJlbmNlZCBDb25kaXRpb24gY2hlY2tpbmcuXHJcbn1cclxuIiwgImltcG9ydCB7IERCQyB9IGZyb20gXCIuLi9EQkNcIjtcclxuLyoqXHJcbiAqIEEge0BsaW5rIERCQyB9IGRlZmluaW5nIHRoYXQgdHdvIHtAbGluayBvYmplY3QgfXMgZ290dGEgYmUgZXF1YWwuXHJcbiAqXHJcbiAqIEByZW1hcmtzXHJcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoWERCQ0BXYVhDb2RlLm5ldCkgKi9cclxuZXhwb3J0IGNsYXNzIEVRIGV4dGVuZHMgREJDIHtcclxuXHQvLyAjcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvKipcclxuXHQgKiBDaGVja3MgaWYgdGhlIHZhbHVlICoqdG9DaGVjayoqIGlzIGVxdWFsIHRvIHRoZSBzcGVjaWZpZWQgKiplcXVpdmFsZW50KiouXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdG9DaGVja1x0XHRUaGUgdmFsdWUgdGhhdCBoYXMgdG8gYmUgZXF1YWwgdG8gaXQncyBwb3NzaWJsZSAqKmVxdWl2YWxlbnQqKiBmb3IgdGhpcyB7QGxpbmsgREJDIH0gdG8gYmUgZnVsZmlsbGVkLlxyXG5cdCAqIEBwYXJhbSBlcXVpdmFsZW50XHRUaGUge0BsaW5rIG9iamVjdCB9IHRoZSBvbmUgKip0b0NoZWNrKiogaGFzIHRvIGJlIGVxdWFsIHRvIGluIG9yZGVyIGZvciB0aGlzIHtAbGluayBEQkMgfSB0byBiZVxyXG5cdCAqIFx0XHRcdFx0XHRcdGZ1bGZpbGxlZC5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFRSVUUgaWYgdGhlIHZhbHVlICoqdG9DaGVjayoqIGFuZCB0aGUgKiplcXVpdmFsZW50KiogYXJlIGVxdWFsIHRvIGVhY2ggb3RoZXIsIG90aGVyd2lzZSBGQUxTRS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIGNoZWNrQWxnb3JpdGhtKFxyXG5cdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XHJcblx0XHR0b0NoZWNrOiBhbnksXHJcblx0XHRlcXVpdmFsZW50OiBvYmplY3QsXHJcblx0XHRpbnZlcnQsXHJcblx0KTogYm9vbGVhbiB8IHN0cmluZyB7XHJcblx0XHRpZiAoIWludmVydCAmJiBlcXVpdmFsZW50ICE9PSB0b0NoZWNrKSB7XHJcblx0XHRcdHJldHVybiBgVmFsdWUgaGFzIHRvIHRvIGJlIGVxdWFsIHRvIFwiJHtlcXVpdmFsZW50fVwiYDtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoaW52ZXJ0ICYmIGVxdWl2YWxlbnQgPT09IHRvQ2hlY2spIHtcclxuXHRcdFx0cmV0dXJuIGBWYWx1ZSBtdXN0IG5vdCB0byBiZSBlcXVhbCB0byBcIiR7ZXF1aXZhbGVudH1cImA7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHRydWU7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgcGFyYW1ldGVyLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcclxuXHQgKiBieSB0aGUgdGFnZ2VkIHBhcmFtZXRlci5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBlcXVpdmFsZW50XHRTZWUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIHBhdGhcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cclxuXHQgKiBAcGFyYW0gZGJjXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIFBSRShcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogVG8gY2hlY2sgZm9yIFVOREVGSU5FRCBhbmQgTlVMTC5cclxuXHRcdGVxdWl2YWxlbnQ6IGFueSxcclxuXHRcdGludmVydCA9IGZhbHNlLFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjID0gXCJXYVhDb2RlLkRCQ1wiLFxyXG5cdCk6IChcclxuXHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0bWV0aG9kTmFtZTogc3RyaW5nIHwgc3ltYm9sLFxyXG5cdFx0cGFyYW1ldGVySW5kZXg6IG51bWJlcixcclxuXHQpID0+IHZvaWQge1xyXG5cdFx0cmV0dXJuIERCQy5kZWNQcmVjb25kaXRpb24oXHJcblx0XHRcdChcclxuXHRcdFx0XHR2YWx1ZTogb2JqZWN0LFxyXG5cdFx0XHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0XHRcdG1ldGhvZE5hbWU6IHN0cmluZyxcclxuXHRcdFx0XHRwYXJhbWV0ZXJJbmRleDogbnVtYmVyLFxyXG5cdFx0XHQpID0+IHtcclxuXHRcdFx0XHRyZXR1cm4gRVEuY2hlY2tBbGdvcml0aG0odmFsdWUsIGVxdWl2YWxlbnQsIGludmVydCk7XHJcblx0XHRcdH0sXHJcblx0XHRcdGRiYyxcclxuXHRcdFx0cGF0aCxcclxuXHRcdCk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcclxuXHQgKiBieSB0aGUgdGFnZ2VkIG1ldGhvZCdzIHJldHVybnZhbHVlLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIGVxdWl2YWxlbnRcdFNlZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gcGF0aFx0XHRcdFNlZSB7QGxpbmsgREJDLlBvc3Rjb25kaXRpb24gfS5cclxuXHQgKiBAcGFyYW0gZGJjXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgUE9TVChcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogVG8gY2hlY2sgZm9yIFVOREVGSU5FRCBhbmQgTlVMTC5cclxuXHRcdGVxdWl2YWxlbnQ6IGFueSxcclxuXHRcdGludmVydCA9IGZhbHNlLFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjID0gXCJXYVhDb2RlLkRCQ1wiLFxyXG5cdCk6IChcclxuXHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0cHJvcGVydHlLZXk6IHN0cmluZyxcclxuXHRcdGRlc2NyaXB0b3I6IFByb3BlcnR5RGVzY3JpcHRvcixcclxuXHQpID0+IFByb3BlcnR5RGVzY3JpcHRvciB7XHJcblx0XHRyZXR1cm4gREJDLmRlY1Bvc3Rjb25kaXRpb24oXHJcblx0XHRcdCh2YWx1ZTogb2JqZWN0LCB0YXJnZXQ6IG9iamVjdCwgcHJvcGVydHlLZXk6IHN0cmluZykgPT4ge1xyXG5cdFx0XHRcdHJldHVybiBFUS5jaGVja0FsZ29yaXRobSh2YWx1ZSwgZXF1aXZhbGVudCwgaW52ZXJ0KTtcclxuXHRcdFx0fSxcclxuXHRcdFx0ZGJjLFxyXG5cdFx0XHRwYXRoLFxyXG5cdFx0KTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogQSBmaWVsZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXHJcblx0ICogYnkgdGhlIHRhZ2dlZCBmaWVsZC5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBlcXVpdmFsZW50XHRTZWUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIHBhdGhcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cclxuXHQgKiBAcGFyYW0gZGJjXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIElOVkFSSUFOVChcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogVG8gY2hlY2sgZm9yIFVOREVGSU5FRCBhbmQgTlVMTC5cclxuXHRcdGVxdWl2YWxlbnQ6IGFueSxcclxuXHRcdGludmVydCA9IGZhbHNlLFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjID0gXCJXYVhDb2RlLkRCQ1wiLFxyXG5cdCkge1xyXG5cdFx0cmV0dXJuIERCQy5kZWNJbnZhcmlhbnQoW25ldyBFUShlcXVpdmFsZW50LCBpbnZlcnQpXSwgcGF0aCwgZGJjKTtcclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXHJcblx0Ly8gI3JlZ2lvbiBSZWZlcmVuY2VkIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvL1xyXG5cdC8vIEZvciB1c2FnZSBpbiBkeW5hbWljIHNjZW5hcmlvcyAobGlrZSB3aXRoIEFFLURCQykuXHJcblx0Ly9cclxuXHQvKipcclxuXHQgKiBJbnZva2VzIHRoZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfSBwYXNzaW5nIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiwge0BsaW5rIEVRLmVxdWl2YWxlbnQgfSBhbmQge0BsaW5rIEVRLmludmVydCB9LlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHRvQ2hlY2sgU2VlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobX0uICovXHJcblx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBOZWNlc3NhcnkgdG8gY2hlY2sgYWdhaW5zdCBOVUxMICYgVU5ERUZJTkVELlxyXG5cdHB1YmxpYyBjaGVjayh0b0NoZWNrOiBhbnkpIHtcclxuXHRcdHJldHVybiBFUS5jaGVja0FsZ29yaXRobSh0b0NoZWNrLCB0aGlzLmVxdWl2YWxlbnQsIHRoaXMuaW52ZXJ0KTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogSW52b2tlcyB0aGUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0gcGFzc2luZyB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHRoZSBzcGVjaWZpZWQgKip0eXBlKiogLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHRvQ2hlY2sgU2VlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgVGhlICoqQ0FORElEQVRFKiogKip0b0NoZWNrKiogZG9lc24ndCBmdWxmaWxsIHRoaXMge0BsaW5rIEVRIH0uXHJcblx0ICogXHJcblx0ICogQHRocm93cyBBIHtAbGluayBEQkMuSW5mcmluZ2VtZW50IH0gaWYgdGhlICoqQ0FORElEQVRFKiogKip0b0NoZWNrKiogZG9lcyBub3QgZnVsZmlsbCB0aGlzIHtAbGluayBFUSB9LiovXHJcblx0cHVibGljIHN0YXRpYyB0c0NoZWNrPENBTkRJREFURT4oIHRvQ2hlY2sgOiBDQU5ESURBVEUgfCB1bmRlZmluZWQgfCBudWxsLCBlcXVpdmFsZW50IDogYW55ICkgOiBDQU5ESURBVEUge1xyXG5cdFx0Y29uc3QgcmVzdWx0ID0gRVEuY2hlY2tBbGdvcml0aG0odG9DaGVjaywgZXF1aXZhbGVudCwgZmFsc2UgKTtcclxuXHJcblx0XHRpZiggcmVzdWx0ICkge1xyXG5cdFx0XHRyZXR1cm4gdG9DaGVjayBhcyBDQU5ESURBVEUgO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHRocm93IG5ldyBEQkMuSW5mcmluZ2VtZW50KCByZXN1bHQgYXMgc3RyaW5nICk7XHJcblx0XHR9XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIENyZWF0ZXMgdGhpcyB7QGxpbmsgRVEgfSBieSBzZXR0aW5nIHRoZSBwcm90ZWN0ZWQgcHJvcGVydHkge0BsaW5rIEVRLmVxdWl2YWxlbnQgfSB1c2VkIGJ5IHtAbGluayBFUS5jaGVjayB9LlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIGVxdWl2YWxlbnQgU2VlIHtAbGluayBFUS5jaGVjayB9LiAqL1xyXG5cdHB1YmxpYyBjb25zdHJ1Y3RvcihcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogVG8gYmUgYWJsZSB0byBtYXRjaCBVTkRFRklORUQgYW5kIE5VTEwuXHJcblx0XHRwcm90ZWN0ZWQgZXF1aXZhbGVudDogYW55LFxyXG5cdFx0cHJvdGVjdGVkIGludmVydCA9IGZhbHNlLFxyXG5cdCkge1xyXG5cdFx0c3VwZXIoKTtcclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBSZWZlcmVuY2VkIENvbmRpdGlvbiBjaGVja2luZy5cclxufVxyXG4iLCAiaW1wb3J0IHsgREJDIH0gZnJvbSBcIi4uL0RCQ1wiO1xyXG4vKipcclxuICogQSB7QGxpbmsgREJDIH0gZGVmaW5pbmcgdGhhdCBhbiB7QGxpbmsgb2JqZWN0IH0gaGFzIGFsc28gdG8gY29tcGx5IHRvIGEgY2VydGFpbiB7QGxpbmsgREJDIH0gaWYgaXQgY29tcGxpZXMgdG9cclxuICogYW5vdGhlciBzcGVjaWZpZWQgb25lLlxyXG4gKlxyXG4gKiBAcmVtYXJrc1xyXG4gKiBNYWludGFpbmVyOiBDYWxsYXJpLCBTYWx2YXRvcmUgKFhEQkNAV2FYQ29kZS5uZXQpICovXHJcbmV4cG9ydCBjbGFzcyBJRiBleHRlbmRzIERCQyB7XHJcblx0Ly8gI3JlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXHJcblx0LyoqXHJcblx0ICogQ2hlY2tzIGlmIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBjb21wbGllcyB0byB0aGUgc3BlY2lmaWVkICoqY29uZGl0aW9uKiogYW5kIGlmIHNvIGRvZXMgYWxzbyBjb21wbHkgdG8gdGhlIG9uZSAqKmluQ2FzZSoqLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHRvQ2hlY2tcdFRoZSB2YWx1ZSB0aGF0IGhhcyB0byBiZSBlcXVhbCB0byBpdCdzIHBvc3NpYmxlICoqZXF1aXZhbGVudCoqIGZvciB0aGlzIHtAbGluayBEQkMgfSB0byBiZSBmdWxmaWxsZWQuXHJcblx0ICogQHBhcmFtIGNvbmRpdGlvblx0VGhlIGNvbnRyYWN0ICoqdG9DaGVjayoqIGhhcyB0byBjb21wbHkgdG8gaW4gb3JkZXIgdG8gYWxzbyBoYXZlIHRvIGNvbXBseSB0byB0aGUgb25lICoqaW5DYXNlKiouXHJcblx0ICogQHBhcmFtIGluQ2FzZVx0VGhlIGNvbnRyYWN0ICoqdG9DaGVjayoqIGhhcyB0byBhbHNvIGNvbXBseSB0byBpZiBpdCBjb21wbGllcyB0byAqKmNvbmRpdGlvbioqLlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgVFJVRSBpZiB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHRoZSAqKmVxdWl2YWxlbnQqKiBhcmUgZXF1YWwgdG8gZWFjaCBvdGhlciwgb3RoZXJ3aXNlIEZBTFNFLiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgY2hlY2tBbGdvcml0aG0oXHJcblx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cclxuXHRcdHRvQ2hlY2s6IGFueSxcclxuXHRcdGNvbmRpdGlvbjoge2NoZWNrOiAodG9DaGVjazogdW5rbm93biB8IHVuZGVmaW5lZCB8IG51bGwgfCBvYmplY3QpID0+IGJvb2xlYW4gfCBzdHJpbmc7fSxcclxuXHRcdGluQ2FzZTp7XHJcblx0XHRcdGNoZWNrOiAodG9DaGVjazogdW5rbm93biB8IHVuZGVmaW5lZCB8IG51bGwgfCBvYmplY3QpID0+IGJvb2xlYW4gfCBzdHJpbmc7XHJcblx0XHR9LFxyXG5cdFx0aW52ZXJ0LFxyXG5cdCk6IGJvb2xlYW4gfCBzdHJpbmcge1xyXG5cdFx0aWYgKCFpbnZlcnQgJiYgY29uZGl0aW9uLmNoZWNrKHRvQ2hlY2spJiYhaW5DYXNlLmNoZWNrKHRvQ2hlY2spKSB7XHJcblx0XHRcdHJldHVybiBgSW4gY2FzZSB0aGF0IHRoZSB2YWx1ZSBjb21wbGllcyB0byBcIiR7Y29uZGl0aW9ufVwiIGl0IGFsc28gaGFzIHRvIGNvbXBseSB0byBcIiR7aW5DYXNlfVwiYDtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoIWludmVydCAmJiAhY29uZGl0aW9uLmNoZWNrKHRvQ2hlY2spJiYhaW5DYXNlLmNoZWNrKHRvQ2hlY2spKSB7XHJcblx0XHRcdHJldHVybiBgSW4gY2FzZSB0aGF0IHRoZSB2YWx1ZSBkb2VzIG5vdCBjb21wbHkgdG8gXCIke2NvbmRpdGlvbn1cIiBpdCBoYXMgdG8gY29tcGx5IHRvIFwiJHtpbkNhc2V9XCJgO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0cnVlO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBBIHBhcmFtZXRlci1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXHJcblx0ICogYnkgdGhlIHRhZ2dlZCBwYXJhbWV0ZXIuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gY29uZGl0aW9uXHRTZWUge0BsaW5rIElGLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIGluQ2FzZVx0U2VlIHtAbGluayBJRi5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqIEBwYXJhbSBkYmNcdFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIFBSRShcclxuXHRcdGNvbmRpdGlvbjoge2NoZWNrOiAodG9DaGVjazogdW5rbm93biB8IHVuZGVmaW5lZCB8IG51bGwgfCBvYmplY3QpID0+IGJvb2xlYW4gfCBzdHJpbmc7fSxcclxuXHRcdGluQ2FzZToge2NoZWNrOiAodG9DaGVjazogdW5rbm93biB8IHVuZGVmaW5lZCB8IG51bGwgfCBvYmplY3QpID0+IGJvb2xlYW4gfCBzdHJpbmc7fSxcclxuXHRcdGludmVydCA9IGZhbHNlLFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjID0gXCJXYVhDb2RlLkRCQ1wiLFxyXG5cdCk6IChcclxuXHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0bWV0aG9kTmFtZTogc3RyaW5nIHwgc3ltYm9sLFxyXG5cdFx0cGFyYW1ldGVySW5kZXg6IG51bWJlcixcclxuXHQpID0+IHZvaWQge1xyXG5cdFx0cmV0dXJuIERCQy5kZWNQcmVjb25kaXRpb24oXHJcblx0XHRcdChcclxuXHRcdFx0XHR2YWx1ZTogb2JqZWN0LFxyXG5cdFx0XHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0XHRcdG1ldGhvZE5hbWU6IHN0cmluZyxcclxuXHRcdFx0XHRwYXJhbWV0ZXJJbmRleDogbnVtYmVyLFxyXG5cdFx0XHQpID0+IHtcclxuXHRcdFx0XHRyZXR1cm4gSUYuY2hlY2tBbGdvcml0aG0odmFsdWUsIGNvbmRpdGlvbiwgaW5DYXNlLCBpbnZlcnQpO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRkYmMsXHJcblx0XHRcdHBhdGgsXHJcblx0XHQpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBBIG1ldGhvZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIElGLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXHJcblx0ICogYnkgdGhlIHRhZ2dlZCBtZXRob2QncyByZXR1cm52YWx1ZS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBjb25kaXRpb25cdFNlZSB7QGxpbmsgSUYuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gaW5DYXNlXHRTZWUge0BsaW5rIElGLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIHBhdGhcdFx0U2VlIHtAbGluayBEQkMuUG9zdGNvbmRpdGlvbiB9LlxyXG5cdCAqIEBwYXJhbSBkYmNcdFx0U2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgUE9TVChcclxuXHRcdGNvbmRpdGlvbjoge2NoZWNrOiAodG9DaGVjazogdW5rbm93biB8IHVuZGVmaW5lZCB8IG51bGwgfCBvYmplY3QpID0+IGJvb2xlYW4gfCBzdHJpbmc7fSxcclxuXHRcdGluQ2FzZToge2NoZWNrOiAodG9DaGVjazogdW5rbm93biB8IHVuZGVmaW5lZCB8IG51bGwgfCBvYmplY3QpID0+IGJvb2xlYW4gfCBzdHJpbmc7fSxcclxuXHRcdGludmVydCA9IGZhbHNlLFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjID0gXCJXYVhDb2RlLkRCQ1wiLFxyXG5cdCk6IChcclxuXHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0cHJvcGVydHlLZXk6IHN0cmluZyxcclxuXHRcdGRlc2NyaXB0b3I6IFByb3BlcnR5RGVzY3JpcHRvcixcclxuXHQpID0+IFByb3BlcnR5RGVzY3JpcHRvciB7XHJcblx0XHRyZXR1cm4gREJDLmRlY1Bvc3Rjb25kaXRpb24oXHJcblx0XHRcdCh2YWx1ZTogb2JqZWN0LCB0YXJnZXQ6IG9iamVjdCwgcHJvcGVydHlLZXk6IHN0cmluZykgPT4ge1xyXG5cdFx0XHRcdHJldHVybiBJRi5jaGVja0FsZ29yaXRobSh2YWx1ZSwgY29uZGl0aW9uLCBpbkNhc2UsIGludmVydCk7XHJcblx0XHRcdH0sXHJcblx0XHRcdGRiYyxcclxuXHRcdFx0cGF0aCxcclxuXHRcdCk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgZmllbGQtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBJRi5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxyXG5cdCAqIGJ5IHRoZSB0YWdnZWQgZmllbGQuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gY29uZGl0aW9uXHRTZWUge0BsaW5rIElGLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIGluQ2FzZVx0U2VlIHtAbGluayBJRi5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXHJcblx0ICogQHBhcmFtIGRiY1x0XHRcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uICovXHJcblx0cHVibGljIHN0YXRpYyBJTlZBUklBTlQoXHJcblx0XHRjb25kaXRpb246IHtjaGVjazogKHRvQ2hlY2s6IHVua25vd24gfCB1bmRlZmluZWQgfCBudWxsIHwgb2JqZWN0KSA9PiBib29sZWFuIHwgc3RyaW5nO30sXHJcblx0XHRpbkNhc2U6IHtjaGVjazogKHRvQ2hlY2s6IHVua25vd24gfCB1bmRlZmluZWQgfCBudWxsIHwgb2JqZWN0KSA9PiBib29sZWFuIHwgc3RyaW5nO30sXHJcblx0XHRpbnZlcnQgPSBmYWxzZSxcclxuXHRcdHBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGRiYyA9IFwiV2FYQ29kZS5EQkNcIixcclxuXHQpIHtcclxuXHRcdHJldHVybiBEQkMuZGVjSW52YXJpYW50KFtuZXcgSUYoY29uZGl0aW9uLCBpbkNhc2UsIGludmVydCldLCBwYXRoLCBkYmMpO1xyXG5cdH1cclxuXHQvLyAjZW5kcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvLyAjcmVnaW9uIFJlZmVyZW5jZWQgQ29uZGl0aW9uIGNoZWNraW5nLlxyXG5cdC8vXHJcblx0Ly8gRm9yIHVzYWdlIGluIGR5bmFtaWMgc2NlbmFyaW9zIChsaWtlIHdpdGggQUUtREJDKS5cclxuXHQvL1xyXG5cdC8qKlxyXG5cdCAqIEludm9rZXMgdGhlIHtAbGluayBJRi5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqLCB7QGxpbmsgSUYuZXF1aXZhbGVudCB9IGFuZCB7QGxpbmsgSUYuaW52ZXJ0IH0uXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdG9DaGVjayBTZWUge0BsaW5rIElGLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIElGLmNoZWNrQWxnb3JpdGhtfS4gKi9cclxuXHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IE5lY2Vzc2FyeSB0byBjaGVjayBhZ2FpbnN0IE5VTEwgJiBVTkRFRklORUQuXHJcblx0cHVibGljIGNoZWNrKHRvQ2hlY2s6IGFueSkge1xyXG5cdFx0cmV0dXJuIElGLmNoZWNrQWxnb3JpdGhtKHRvQ2hlY2ssIHRoaXMuY29uZGl0aW9uLCB0aGlzLmluQ2FzZSwgdGhpcy5pbnZlcnQpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBDcmVhdGVzIHRoaXMge0BsaW5rIElGIH0gYnkgc2V0dGluZyB0aGUgcHJvdGVjdGVkIHByb3BlcnR5IHtAbGluayBJRi5lcXVpdmFsZW50IH0gdXNlZCBieSB7QGxpbmsgSUYuY2hlY2sgfS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBlcXVpdmFsZW50IFNlZSB7QGxpbmsgSUYuY2hlY2sgfS4gKi9cclxuXHRwdWJsaWMgY29uc3RydWN0b3IoXHJcblx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IFRvIGJlIGFibGUgdG8gbWF0Y2ggVU5ERUZJTkVEIGFuZCBOVUxMLlxyXG5cdFx0cHJvdGVjdGVkIGNvbmRpdGlvbjoge2NoZWNrOiAodG9DaGVjazogdW5rbm93biB8IHVuZGVmaW5lZCB8IG51bGwgfCBvYmplY3QpID0+IGJvb2xlYW4gfCBzdHJpbmc7fSxcclxuXHRcdHByb3RlY3RlZCBpbkNhc2U6IHtjaGVjazogKHRvQ2hlY2s6IHVua25vd24gfCB1bmRlZmluZWQgfCBudWxsIHwgb2JqZWN0KSA9PiBib29sZWFuIHwgc3RyaW5nO30sXHJcblx0XHRwcm90ZWN0ZWQgaW52ZXJ0ID0gZmFsc2UsXHJcblx0KSB7XHJcblx0XHRzdXBlcigpO1xyXG5cdH1cclxuXHQvLyAjZW5kcmVnaW9uIFJlZmVyZW5jZWQgQ29uZGl0aW9uIGNoZWNraW5nLlxyXG59IiwgImltcG9ydCB7IERCQyB9IGZyb20gXCIuLi9EQkNcIjtcclxuLyoqXHJcbiAqIEEge0BsaW5rIERCQyB9IHByb3ZpZGluZyB7QGxpbmsgUkVHRVggfS1jb250cmFjdHMgYW5kIHN0YW5kYXJkIHtAbGluayBSZWdFeHAgfSBmb3IgY29tbW9uIHVzZSBjYXNlcyBpbiB7QGxpbmsgUkVHRVguc3RkRXhwIH0uXHJcbiAqXHJcbiAqIEByZW1hcmtzXHJcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoWERCQ0BXYVhDb2RlLm5ldCkgKi9cclxuZXhwb3J0IGNsYXNzIFJFR0VYIGV4dGVuZHMgREJDIHtcclxuXHQvKiogU3RvcmVzIG9mdGVuIHVzZWQge0BsaW5rIFJlZ0V4cCB9cy4gKi9cclxuXHRwdWJsaWMgc3RhdGljIHN0ZEV4cCA9IHtcclxuXHRcdGh0bWxBdHRyaWJ1dGVOYW1lOiAvXlthLXpBLVpfOl1bYS16QS1aMC05Xy46LV0qJC8sXHJcblx0XHRlTWFpbDogL15bYS16QS1aMC05Ll8lKy1dK0BbYS16QS1aMC05Li1dK1xcLlthLXpBLVpdezIsfSQvaSxcclxuXHRcdHByb3BlcnR5OiAvXlskX0EtWmEtel1bJF9BLVphLXowLTldKiQvLFxyXG5cdFx0dXJsOiAvXig/Oig/Omh0dHA6fGh0dHBzP3xmdHApOlxcL1xcLyk/KD86XFxTKyg/OjpcXFMqKT9AKT8oPzpsb2NhbGhvc3R8KD86W2EtekEtWjAtOV0oPzpbYS16QS1aMC05LV17MCw2MX1bYS16QS1aMC05XSk/XFwuKStbYS16QS1aXXsyLH0pKD86OlxcZHsyLDV9KT8oPzpcXC8oPzpbXFx3XFwtXFwuXSpcXC8pKltcXHdcXC1cXC5dKyg/OlxcP1xcUyopPyg/OiNcXFMqKT8pPyQvaSxcclxuXHRcdGtleVBhdGg6IC9eKFthLXpBLVpfJF1bYS16QS1aMC05XyRdKlxcLikqW2EtekEtWl8kXVthLXpBLVowLTlfJF0qJC8sXHJcblx0XHRkYXRlOiAvXlxcZHsxLDR9Wy5cXC8tXVxcZHsxLDJ9Wy5cXC8tXVxcZHsxLDR9JC9pLFxyXG5cdFx0ZGF0ZUZvcm1hdDpcclxuXHRcdFx0L14oKER7MSwyfVsuLy1dTXsxLDJ9Wy4vLV1ZezEsNH0pfChNezEsMn1bLi8tXUR7MSwyfVsuLy1dWXsxLDR9KXxZezEsNH1bLi8tXUR7MSwyfVsuLy1dTXsxLDJ9fChZezEsNH1bLi8tXU17MSwyfVsuLy1dRHsxLDJ9KSkkL2ksXHJcblx0XHRjc3NTZWxlY3RvcjpcclxuXHRcdFx0L14oPzpcXCp8I1tcXHctXSt8XFwuW1xcdy1dK3woPzpbXFx3LV0rfFxcKikoPzo6KD86W1xcdy1dKyg/OlxcKFtcXHctXStcXCkpPykrKT8oPzpcXFsoPzpbXFx3LV0rKD86KD86PXx+PXxcXHw9fFxcKj18XFwkPXxcXF49KVxccyooPzpcIlteXCJdKlwifCdbXiddKid8W1xcdy1dKylcXHMqKT8pP1xcXSkrfFxcW1xccypbXFx3LV0rXFxzKj1cXHMqKD86XCJbXlwiXSpcInwnW14nXSonfFtcXHctXSspXFxzKlxcXSkoPzosXFxzKig/OlxcKnwjW1xcdy1dK3xcXC5bXFx3LV0rfCg/OltcXHctXSt8XFwqKSg/OjooPzpbXFx3LV0rKD86XFwoW1xcdy1dK1xcKSk/KSspPyg/OlxcWyg/OltcXHctXSsoPzooPzo9fH49fFxcfD18XFwqPXxcXCQ9fFxcXj0pXFxzKig/OlwiW15cIl0qXCJ8J1teJ10qJ3xbXFx3LV0rKVxccyopPyk/XFxdKSt8XFxbXFxzKltcXHctXStcXHMqPVxccyooPzpcIlteXCJdKlwifCdbXiddKid8W1xcdy1dKylcXHMqXFxdKSkqJC8sXHJcblx0fTtcclxuXHQvLyAjcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvKipcclxuXHQgKiBDaGVja3MgaWYgdGhlIHZhbHVlICoqdG9DaGVjayoqIGlzIGNvbXBsaWVzIHRvIHRoZSB7QGxpbmsgUmVnRXhwIH0gKipleHByZXNzaW9uKiouXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdG9DaGVja1x0XHRUaGUgdmFsdWUgdGhhdCBoYXMgY29tcGx5IHRvIHRoZSB7QGxpbmsgUmVnRXhwIH0gKipleHByZXNzaW9uKiogZm9yIHRoaXMge0BsaW5rIERCQyB9IHRvIGJlIGZ1bGZpbGxlZC5cclxuXHQgKiBAcGFyYW0gZXhwcmVzc2lvblx0VGhlIHtAbGluayBSZWdFeHAgfSB0aGUgb25lICoqdG9DaGVjayoqIGhhcyBjb21wbHkgdG8gaW4gb3JkZXIgZm9yIHRoaXMge0BsaW5rIERCQyB9IHRvIGJlXHJcblx0ICogXHRcdFx0XHRcdFx0ZnVsZmlsbGVkLlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgVFJVRSBpZiB0aGUgdmFsdWUgKip0b0NoZWNrKiogY29tcGxpZXMgd2l0aCB0aGUge0BsaW5rIFJlZ0V4cCB9ICoqZXhwcmVzc2lvbioqLCBvdGhlcndpc2UgRkFMU0UuICovXHJcblx0cHVibGljIHN0YXRpYyBjaGVja0FsZ29yaXRobShcclxuXHRcdHRvQ2hlY2s6IHVua25vd24gfCBudWxsIHwgdW5kZWZpbmVkLFxyXG5cdFx0ZXhwcmVzc2lvbjogUmVnRXhwLFxyXG5cdCk6IGJvb2xlYW4gfCBzdHJpbmcge1xyXG5cdFx0aWYgKCFleHByZXNzaW9uLnRlc3QodG9DaGVjayBhcyBzdHJpbmcpKSB7XHJcblx0XHRcdHJldHVybiBgVmFsdWUgaGFzIHRvIGNvbXBseSB0byByZWd1bGFyIGV4cHJlc3Npb24gXCIke2V4cHJlc3Npb259XCJgO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0cnVlO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBBIHBhcmFtZXRlci1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXHJcblx0ICogYnkgdGhlIHRhZ2dlZCBwYXJhbWV0ZXIuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gZXhwcmVzc2lvblx0U2VlIHtAbGluayBSRUdFWC5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXHJcblx0ICogQHBhcmFtIGRiY1x0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uICovXHJcblx0cHVibGljIHN0YXRpYyBQUkUoXHJcblx0XHRleHByZXNzaW9uOiBSZWdFeHAsXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXHJcblx0KTogKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRtZXRob2ROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXHJcblx0XHRwYXJhbWV0ZXJJbmRleDogbnVtYmVyLFxyXG5cdCkgPT4gdm9pZCB7XHJcblx0XHRyZXR1cm4gREJDLmRlY1ByZWNvbmRpdGlvbihcclxuXHRcdFx0KFxyXG5cdFx0XHRcdHZhbHVlOiBzdHJpbmcsXHJcblx0XHRcdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRcdFx0bWV0aG9kTmFtZTogc3RyaW5nLFxyXG5cdFx0XHRcdHBhcmFtZXRlckluZGV4OiBudW1iZXIsXHJcblx0XHRcdCkgPT4ge1xyXG5cdFx0XHRcdHJldHVybiBSRUdFWC5jaGVja0FsZ29yaXRobSh2YWx1ZSwgZXhwcmVzc2lvbik7XHJcblx0XHRcdH0sXHJcblx0XHRcdGRiYyxcclxuXHRcdFx0cGF0aCxcclxuXHRcdCk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgUkVHRVguY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcclxuXHQgKiBieSB0aGUgdGFnZ2VkIG1ldGhvZCdzIHJldHVybnZhbHVlLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIGV4cHJlc3Npb25cdFNlZSB7QGxpbmsgUkVHRVguY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gcGF0aFx0XHRcdFNlZSB7QGxpbmsgREJDLlBvc3Rjb25kaXRpb24gfS5cclxuXHQgKiBAcGFyYW0gZGJjXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgUE9TVChcclxuXHRcdGV4cHJlc3Npb246IFJlZ0V4cCxcclxuXHRcdHBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGRiYyA9IFwiV2FYQ29kZS5EQkNcIixcclxuXHQpOiAoXHJcblx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdHByb3BlcnR5S2V5OiBzdHJpbmcsXHJcblx0XHRkZXNjcmlwdG9yOiBQcm9wZXJ0eURlc2NyaXB0b3IsXHJcblx0KSA9PiBQcm9wZXJ0eURlc2NyaXB0b3Ige1xyXG5cdFx0cmV0dXJuIERCQy5kZWNQb3N0Y29uZGl0aW9uKFxyXG5cdFx0XHQodmFsdWU6IHN0cmluZywgdGFyZ2V0OiBvYmplY3QsIHByb3BlcnR5S2V5OiBzdHJpbmcpID0+IHtcclxuXHRcdFx0XHRyZXR1cm4gUkVHRVguY2hlY2tBbGdvcml0aG0odmFsdWUsIGV4cHJlc3Npb24pO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRkYmMsXHJcblx0XHRcdHBhdGgsXHJcblx0XHQpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBBIGZpZWxkLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgUkVHRVguY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcclxuXHQgKiBieSB0aGUgdGFnZ2VkIGZpZWxkLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIGV4cHJlc3Npb25cdFNlZSB7QGxpbmsgUkVHRVguY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gcGF0aFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxyXG5cdCAqIEBwYXJhbSBkYmNcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgSU5WQVJJQU5UKFxyXG5cdFx0ZXhwcmVzc2lvbjogUmVnRXhwLFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjID0gXCJXYVhDb2RlLkRCQ1wiLFxyXG5cdCkge1xyXG5cdFx0cmV0dXJuIERCQy5kZWNJbnZhcmlhbnQoW25ldyBSRUdFWChleHByZXNzaW9uKV0sIHBhdGgsIGRiYyk7XHJcblx0fVxyXG5cdC8vICNlbmRyZWdpb24gQ29uZGl0aW9uIGNoZWNraW5nLlxyXG5cdC8vICNyZWdpb24gUmVmZXJlbmNlZCBDb25kaXRpb24gY2hlY2tpbmcuXHJcblx0Ly9cclxuXHQvLyBGb3IgdXNhZ2UgaW4gZHluYW1pYyBzY2VuYXJpb3MgKGxpa2Ugd2l0aCBBRS1EQkMpLlxyXG5cdC8vXHJcblx0LyoqXHJcblx0ICogSW52b2tlcyB0aGUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtIH0gcGFzc2luZyB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHtAbGluayBSRUdFWC5lcXVpdmFsZW50IH0uXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdG9DaGVjayBTZWUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtfS4gKi9cclxuXHRwdWJsaWMgY2hlY2sodG9DaGVjazogdW5rbm93biB8IG51bGwgfCB1bmRlZmluZWQpIHtcclxuXHRcdHJldHVybiBSRUdFWC5jaGVja0FsZ29yaXRobSh0b0NoZWNrLCB0aGlzLmV4cHJlc3Npb24pO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBDcmVhdGVzIHRoaXMge0BsaW5rIFJFR0VYIH0gYnkgc2V0dGluZyB0aGUgcHJvdGVjdGVkIHByb3BlcnR5IHtAbGluayBSRUdFWC5leHByZXNzaW9uIH0gdXNlZCBieSB7QGxpbmsgUkVHRVguY2hlY2sgfS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBleHByZXNzaW9uIFNlZSB7QGxpbmsgUkVHRVguY2hlY2sgfS4gKi9cclxuXHRwdWJsaWMgY29uc3RydWN0b3IocHJvdGVjdGVkIGV4cHJlc3Npb246IFJlZ0V4cCkge1xyXG5cdFx0c3VwZXIoKTtcclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBSZWZlcmVuY2VkIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvLyAjcmVnaW9uIEluLU1ldGhvZCBjaGVja2luZy5cclxuXHQvKipcclxuXHQgKiBJbnZva2VzIHRoZSB7QGxpbmsgUkVHRVguY2hlY2tBbGdvcml0aG0gfSBwYXNzaW5nIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBhbmQge0BsaW5rIFJFR0VYLmV4cHJlc3Npb24gfS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0b0NoZWNrXHRcdFNlZSB7QGxpbmsgUkVHRVguY2hlY2tBbGdvcml0aG19LlxyXG5cdCAqIEBwYXJhbSBleHByZXNzaW9uXHRTZWUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtfS5cclxuXHQgKi9cclxuXHRwdWJsaWMgc3RhdGljIGNoZWNrKHRvQ2hlY2s6IHVua25vd24gfCBudWxsIHwgdW5kZWZpbmVkLCBleHByZXNzaW9uOiBSZWdFeHApIHtcclxuXHRcdGNvbnN0IGNoZWNrUmVzdWx0ID0gUkVHRVguY2hlY2tBbGdvcml0aG0odG9DaGVjaywgZXhwcmVzc2lvbik7XHJcblxyXG5cdFx0aWYgKHR5cGVvZiBjaGVja1Jlc3VsdCA9PT0gXCJzdHJpbmdcIikge1xyXG5cdFx0XHR0aHJvdyBuZXcgREJDLkluZnJpbmdlbWVudChjaGVja1Jlc3VsdCk7XHJcblx0XHR9XHJcblx0fVxyXG5cdC8vICNlbmRyZWdpb24gSW4tTWV0aG9kIGNoZWNraW5nLlxyXG59XHJcbiIsICJpbXBvcnQgeyBEQkMgfSBmcm9tIFwiLi4vREJDXCI7XHJcbi8qKlxyXG4gKiBBIHtAbGluayBEQkMgfSBkZWZpbmluZyB0aGF0IGEge0BsaW5rIEhUTUxFbGVtZW50IH0gZ290dGEgaGF2ZSBhIGNlcnRhaW4gYXR0cmlidXRlIHNldC5cclxuICpcclxuICogQHJlbWFya3NcclxuICogTWFpbnRhaW5lcjogQ2FsbGFyaSwgU2FsdmF0b3JlIChYREJDQFdhWENvZGUubmV0KSAqL1xyXG5leHBvcnQgY2xhc3MgSGFzQXR0cmlidXRlIGV4dGVuZHMgREJDIHtcclxuXHQvLyAjcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvKipcclxuXHQgKiBDaGVja3MgaWYgdGhlIHtAbGluayBIVE1MRWxlbWVudCB9ICoqdG9DaGVjayoqIGhhcyB0aGUgYXR0cmlidXRlICoqdG9DaGVja0ZvcioqLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHRvQ2hlY2tGb3IgIG5hbWUgb2YgdGhlIGF0dHJpYnV0ZSB0byBjaGVjayBmb3Igd2hldGhlciBpdCBpcyBzZXQgb3Igbm90LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgVFJVRSBpZiB0aGUge0BsaW5rIEhUTUxFbGVtZW50IH0gKip0b0NoZWNrKiogaGFzIHNldCB0aGUgYXR0cmlidXRlICoqdG9DaGVja0ZvcioqLFxyXG5cdCAqIFx0XHRcdG90aGVyd2lzZSBhIHByb3BlciBlcnJvcm1lc3NhZ2UuICovXHJcblx0cHVibGljIHN0YXRpYyBjaGVja0FsZ29yaXRobShcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxyXG5cdFx0dG9DaGVjazogYW55LFxyXG5cdFx0dG9DaGVja0Zvcjogc3RyaW5nLFxyXG5cdFx0aW52ZXJ0LFxyXG5cdCk6IGJvb2xlYW4gfCBzdHJpbmcge1xyXG5cdFx0aWYoISggdG9DaGVjayBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ICkpIHtcclxuXHRcdFx0cmV0dXJuIGBUaGUgb2JqZWN0IHRvIGNoZWNrIGZvciB3aGV0aGVyIGl0IGhhcyB0aGUgYXR0cmlidXRlIFwiJHsgdG9DaGVja0ZvciB9XCIgaXMgbm90IGEgSFRNTEVsZW1lbnQuIEl0IGlzIG9mIHR5cGUgXCIkeyB0eXBlb2YgdG9DaGVjayB9XCIuYDtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoIWludmVydCAmJiAhKCB0b0NoZWNrIGFzIEhUTUxFbGVtZW50ICkuaGFzQXR0cmlidXRlKCB0b0NoZWNrRm9yICkpIHtcclxuXHRcdFx0cmV0dXJuIGBSZXF1aXJlZCBBdHRyaWJ1dGUgXCIkeyB0b0NoZWNrRm9yIH1cIiBpcyBub3Qgc2V0LmA7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKGludmVydCAmJiAoIHRvQ2hlY2sgYXMgSFRNTEVsZW1lbnQgKS5oYXNBdHRyaWJ1dGUoIHRvQ2hlY2tGb3IgKSkge1xyXG5cdFx0XHRyZXR1cm4gYEZvcmJpZGRlbiBBdHRyaWJ1dGUgXCIkeyB0b0NoZWNrRm9yIH1cIiBpcyBzZXQuYDtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdHJ1ZTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogQSBwYXJhbWV0ZXItZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBIYXNBdHRyaWJ1dGUuY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcclxuXHQgKiBieSB0aGUgdGFnZ2VkIHBhcmFtZXRlci5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0b0NoZWNrRm9yXHRTZWUge0BsaW5rIEhhc0F0dHJpYnV0ZS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXHJcblx0ICogQHBhcmFtIGRiY1x0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uICovXHJcblx0cHVibGljIHN0YXRpYyBQUkUoXHJcblx0XHR0b0NoZWNrRm9yOiBzdHJpbmcsXHJcblx0XHRpbnZlcnQgPSBmYWxzZSxcclxuXHRcdHBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGRiYyA9IFwiV2FYQ29kZS5EQkNcIixcclxuXHQpOiAoXHJcblx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdG1ldGhvZE5hbWU6IHN0cmluZyB8IHN5bWJvbCxcclxuXHRcdHBhcmFtZXRlckluZGV4OiBudW1iZXIsXHJcblx0KSA9PiB2b2lkIHtcclxuXHRcdHJldHVybiBEQkMuZGVjUHJlY29uZGl0aW9uKFxyXG5cdFx0XHQoXHJcblx0XHRcdFx0dmFsdWU6IG9iamVjdCxcclxuXHRcdFx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdFx0XHRtZXRob2ROYW1lOiBzdHJpbmcsXHJcblx0XHRcdFx0cGFyYW1ldGVySW5kZXg6IG51bWJlcixcclxuXHRcdFx0KSA9PiB7XHJcblx0XHRcdFx0cmV0dXJuIEhhc0F0dHJpYnV0ZS5jaGVja0FsZ29yaXRobSh2YWx1ZSwgdG9DaGVja0ZvciwgaW52ZXJ0KTtcclxuXHRcdFx0fSxcclxuXHRcdFx0ZGJjLFxyXG5cdFx0XHRwYXRoLFxyXG5cdFx0KTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogQSBtZXRob2QtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBIYXNBdHRyaWJ1dGUuY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpc1xyXG5cdCAqIGZ1bGZpbGxlZCBieSB0aGUgdGFnZ2VkIG1ldGhvZCdzIHJldHVybnZhbHVlLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHRvQ2hlY2tGb3JcdFNlZSB7QGxpbmsgSGFzQXR0cmlidXRlLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIHBhdGhcdFx0XHRTZWUge0BsaW5rIERCQy5Qb3N0Y29uZGl0aW9uIH0uXHJcblx0ICogQHBhcmFtIGRiY1x0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1Bvc3Rjb25kaXRpb24gfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY1Bvc3Rjb25kaXRpb24gfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIFBPU1QoXHJcblx0XHR0b0NoZWNrRm9yOiBzdHJpbmcsXHJcblx0XHRpbnZlcnQgPSBmYWxzZSxcclxuXHRcdHBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGRiYyA9IFwiV2FYQ29kZS5EQkNcIixcclxuXHQpOiAoXHJcblx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdHByb3BlcnR5S2V5OiBzdHJpbmcsXHJcblx0XHRkZXNjcmlwdG9yOiBQcm9wZXJ0eURlc2NyaXB0b3IsXHJcblx0KSA9PiBQcm9wZXJ0eURlc2NyaXB0b3Ige1xyXG5cdFx0cmV0dXJuIERCQy5kZWNQb3N0Y29uZGl0aW9uKFxyXG5cdFx0XHQodmFsdWU6IG9iamVjdCwgdGFyZ2V0OiBvYmplY3QsIHByb3BlcnR5S2V5OiBzdHJpbmcpID0+IHtcclxuXHRcdFx0XHRyZXR1cm4gSGFzQXR0cmlidXRlLmNoZWNrQWxnb3JpdGhtKHZhbHVlLCB0b0NoZWNrRm9yLCBpbnZlcnQpO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRkYmMsXHJcblx0XHRcdHBhdGgsXHJcblx0XHQpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBBIGZpZWxkLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgaGFzQXR0cmlidXRlLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXNcclxuXHQgKiBmdWxmaWxsZWQgYnkgdGhlIHRhZ2dlZCBmaWVsZC5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0b0NoZWNrRm9yXHRTZWUge0BsaW5rIGhhc0F0dHJpYnV0ZS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXHJcblx0ICogQHBhcmFtIGRiY1x0XHRcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uICovXHJcblx0cHVibGljIHN0YXRpYyBJTlZBUklBTlQoXHJcblx0XHR0b0NoZWNrRm9yOiBhbnksXHJcblx0XHRpbnZlcnQgPSBmYWxzZSxcclxuXHRcdHBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGRiYyA9IFwiV2FYQ29kZS5EQkNcIixcclxuXHQpIHtcclxuXHRcdHJldHVybiBEQkMuZGVjSW52YXJpYW50KFtuZXcgSGFzQXR0cmlidXRlKHRvQ2hlY2tGb3IsIGludmVydCldLCBwYXRoLCBkYmMpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBBIGZpZWxkLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgaGFzQXR0cmlidXRlLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXNcclxuXHQgKiBmdWxmaWxsZWQgYnkgdGhlIHRhZ2dlZCBmaWVsZCdzIGNsYXNzIGluc3RhbmNlLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHRvQ2hlY2tGb3JcdFNlZSB7QGxpbmsgaGFzQXR0cmlidXRlLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIHBhdGhcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cclxuXHQgKiBAcGFyYW0gZGJjXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIGNJTlZBUklBTlQoXHJcblx0XHR0b0NoZWNrRm9yOiBhbnksXHJcblx0XHRpbnZlcnQgPSBmYWxzZSxcclxuXHRcdHBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGRiYyA9IFwiV2FYQ29kZS5EQkNcIixcclxuXHQpIHtcclxuXHRcdHJldHVybiBEQkMuZGVjQ2xhc3NJbnZhcmlhbnQoW25ldyBIYXNBdHRyaWJ1dGUodG9DaGVja0ZvciwgaW52ZXJ0KV0sIHBhdGgsIGRiYyk7XHJcblx0fVxyXG5cdC8vICNlbmRyZWdpb24gQ29uZGl0aW9uIGNoZWNraW5nLlxyXG5cdC8vICNyZWdpb24gUmVmZXJlbmNlZCBDb25kaXRpb24gY2hlY2tpbmcuXHJcblx0Ly9cclxuXHQvLyBGb3IgdXNhZ2UgaW4gZHluYW1pYyBzY2VuYXJpb3MgKGxpa2Ugd2l0aCBBRS1EQkMpLlxyXG5cdC8vXHJcblx0LyoqXHJcblx0ICogSW52b2tlcyB0aGUge0BsaW5rIGhhc0F0dHJpYnV0ZS5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqLCB7QGxpbmsgaGFzQXR0cmlidXRlLmVxdWl2YWxlbnQgfSBhbmRcclxuXHQgKiB7QGxpbmsgaGFzQXR0cmlidXRlLmludmVydCB9LlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHRvQ2hlY2sgU2VlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobX0uICovXHJcblx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBOZWNlc3NhcnkgdG8gY2hlY2sgYWdhaW5zdCBOVUxMICYgVU5ERUZJTkVELlxyXG5cdHB1YmxpYyBjaGVjayh0b0NoZWNrOiBhbnkpIHtcclxuXHRcdHJldHVybiBIYXNBdHRyaWJ1dGUuY2hlY2tBbGdvcml0aG0odG9DaGVjaywgdGhpcy50b0NoZWNrRm9yLCB0aGlzLmludmVydCk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIENyZWF0ZXMgdGhpcyB7QGxpbmsgREJDIH0gYnkgc2V0dGluZyB0aGUgcHJvdGVjdGVkIHByb3BlcnR5IHtAbGluayBoYXNBdHRyaWJ1dGUuZXF1aXZhbGVudCB9IHVzZWQgYnlcclxuXHQgKiB7QGxpbmsgaGFzQXR0cmlidXRlLmNoZWNrIH0uXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdG9DaGVja0ZvciBTZWUge0BsaW5rIGhhc0F0dHJpYnV0ZS5jaGVjayB9LiAqL1xyXG5cdHB1YmxpYyBjb25zdHJ1Y3RvcihcclxuXHRcdHByb3RlY3RlZCB0b0NoZWNrRm9yOiBzdHJpbmcsXHJcblx0XHRwcm90ZWN0ZWQgaW52ZXJ0ID0gZmFsc2UsXHJcblx0KSB7XHJcblx0XHRzdXBlcigpO1xyXG5cdH1cclxuXHQvLyAjZW5kcmVnaW9uIFJlZmVyZW5jZWQgQ29uZGl0aW9uIGNoZWNraW5nLlxyXG59XHJcbiIsIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwsIG51bGwsICJpbXBvcnQgeyBEQkMgfSBmcm9tIFwieGRiYy9zcmMvREJDXCI7XG5pbXBvcnQgeyBPUiB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvT1JcIjtcbmltcG9ydCB7IEVRIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9FUVwiO1xuaW1wb3J0IHsgSUYgfSBmcm9tIFwieGRiYy9zcmMvREJDL0lGXCI7XG5pbXBvcnQgeyBSRUdFWCB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvUkVHRVhcIjtcbmltcG9ydCB7IElOU1RBTkNFIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9JTlNUQU5DRVwiO1xuaW1wb3J0IHsgREVGSU5FRCB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvREVGSU5FRFwiO1xuaW1wb3J0IHsgSGFzQXR0cmlidXRlIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9IYXNBdHRyaWJ1dGVcIjtcbmltcG9ydCB7IGFsbEJ5Q3NzQXMsIGFsbEJ5Q3NzSHRtbCwgYnlDc3NBcywgYnlDc3NIdG1sIH0gZnJvbSBcIkBkZS14aW1hL3hpbWEtY29tbW9uLWpzLWRvbVwiO1xuaW1wb3J0IHsgaW5zdGFuY2UgfSBmcm9tIFwiQGRlLXhpbWEvZmMtZm9ybS1kZXNpZ25lclwiO1xuLyoqXG4gKiAgQSB7QGxpbmsgSFRNTERpdkVsZW1lbnQgfSB0aGF0IGJvdW5kIHRvIGFuIHtAbGluayBIVE1MSW5wdXRFbGVtZW50IH0gb25seSBhbGxvd3Mgb25lIG9mIGFcbiAqICBjZXJ0YWluIHNldCBvZiB7QGxpbmsgb3B0aW9ucyB9LiAqL1xuZXhwb3J0IGNsYXNzIE9wdGlvbmlucHV0IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQge1xuICAvLyAjcmVnaW9uIEluZm9cbiAgLyoqIEhvbGRzIGEgc3RyaW5nIHRoYXQgY2FuIGJlIHVzZWQgdG8gcHJvdmlkZSBjb250ZXh0dWFsIGluZm9ybWF0aW9uLiAqL1xuICBwdWJsaWMgbW9kZTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAvLyAjZW5kcmVnaW9uIEluZm9cbiAgLy8gI3JlZ2lvbiBFdmVudHNcbiAgLyoqIEhvbGRzIGFsbCBldmVudCBsaXN0ZW5lciB0byBub3RpZnkgd2hlbmV2ZXIgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBvcHRpb24gY2hhbmdlcy4gKi9cbiAgcHVibGljIHJlYWRvbmx5IG9uT3B0aW9uQ2hhbmdlZDogQXJyYXk8KG5ld09wdGlvbjogc3RyaW5nKSA9PiB2b2lkPiA9IG5ldyBBcnJheTwobmV3T3B0aW9uOiBzdHJpbmcpID0+IHZvaWQ+KCk7XG4gIC8qKiBIb2xkcyBhbGwgZXZlbnQgbGlzdGVuZXIgdG8gbm90aWZ5IHdoZW5ldmVyIGFuIGF1dG9jb21wbGV0ZSBvY2N1cnJlZC4gKi9cbiAgcHVibGljIHJlYWRvbmx5IG9uQXV0b2NvbXBsZXRlOiBBcnJheTwobmV3T3B0aW9uOiBzdHJpbmcpID0+IHZvaWQ+ID0gbmV3IEFycmF5PChuZXdPcHRpb246IHN0cmluZykgPT4gdm9pZD4oKTtcbiAgLyoqIEhvbGRzIGFsbCBldmVudCBsaXN0ZW5lciB0byBub3RpZnkgd2hlbmV2ZXIgYW4gb3B0aW9uIHdhcyBzZWxlY3RlZC4gKi9cbiAgcHVibGljIHJlYWRvbmx5IG9uT3B0aW9uU2VsZWN0ZWQ6IEFycmF5PChuZXdPcHRpb246IHN0cmluZykgPT4gdm9pZD4gPSBuZXcgQXJyYXk8KG5ld09wdGlvbjogc3RyaW5nKSA9PiB2b2lkPigpO1xuICAvLyAjZW5kcmVnaW9uIEV2ZW50c1xuICAvKiogSG9sZHMgdGhlIHdlYi1jb21wb25lbnQgZGVmaW5pdGlvbiBvZiBvYnNlcnZlZCBhdHRyaWJ1dGVzLiAqL1xuICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpOiBBcnJheTxzdHJpbmc+IHtcbiAgICByZXR1cm4gW1wib3B0aW9uc1wiLCBcInNlcGFyYXRvclwiLCBcImNzc0VuYWJsZWRcIiwgXCJjc3NEaXNhYmxlZFwiLCBcImVuYWJsZWRcIl07XG4gIH1cbiAgLy8gI3JlZ2lvbiBPcHRpb25zXG4gIC8qKiBIb2xkcyB0aGUge0BsaW5rIHN0cmluZyB9cyB0aGF0J3JlIHRoZSBhY3R1YWwgb3B0aW9ucy4gKi9cbiAgcHJvdGVjdGVkIF9vcHRpb25zOiBBcnJheTxzdHJpbmc+ID0gbmV3IEFycmF5PHN0cmluZz4oKTtcbiAgLyoqXG4gICAqIEdldHMgdGhlIHtAbGluayBPcHRpb25pbnB1dC5fb3B0aW9ucyB9LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUge0BsaW5rIE9wdGlvbmlucHV0Ll9vcHRpb25zIH0uICovXG4gIHB1YmxpYyBnZXQgb3B0aW9ucygpOiBBcnJheTxzdHJpbmc+IHtcbiAgICByZXR1cm4gdGhpcy5fb3B0aW9ucztcbiAgfVxuICAvKipcbiAgICogU2V0cyB0aGUge0BsaW5rIE9wdGlvbklucHV0Lm9wdGlvbnMgfS5cbiAgICpcbiAgICogQHBhcmFtIHRvU2V0IFRoZSB7QGxpbmsgb3B0aW9uaW5wdXQub3B0aW9ucyB9LiAqL1xuICBwdWJsaWMgc2V0IG9wdGlvbnModG9TZXQ6IEFycmF5PHN0cmluZz4pIHtcbiAgICB0aGlzLl9vcHRpb25zID0gdG9TZXQ7XG5cbiAgICBpZiAodGhpcy5fb3B0aW9ucy5sZW5ndGggIT09IDApIHtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfVxuICB9XG4gIC8qKiBIb2xkcyB0aGUge0BsaW5rIHN0cmluZyB9IHRoZSB7QGxpbmsgU1ZNYW5hZ2VyLnRhcmdldCB9ZWQge0BsaW5rIEhUTUxJbnB1dEVsZW1lbnQgfSdzIGNvbnRlbnQgc2hhbGxcbiAgICogYmUgc3BsaXQgaW50by4gKi9cbiAgcHJvdGVjdGVkIHNlcGFyYXRvcjogc3RyaW5nO1xuICAvKiogU3RvcmVzIGEgKCB0b1RyYW5zZm9ybSA6IHN0cmluZyApID0+IHN0cmluZyB0byB1c2UgYmVmb3JlIGRpc3BsYXlpbmdcbiAgICogdGhlIHtAbGluayB0aGlzLm9wdGlvbnMgfS4gKi9cbiAgcHJvdGVjdGVkIF9vcHRpb25UcmFuc2Zvcm1lcjogKCh0b1RyYW5zZm9ybTogc3RyaW5nKSA9PiBzdHJpbmcpIHwgdW5kZWZpbmVkO1xuICAvKipcbiAgICogU2V0cyB0aGUge0BsaW5rIE9wdGlvbmlucHV0Ll90cmFuc2Zvcm1lciB9LlxuICAgKlxuICAgKiBAcGFyYW0gdG9TZXQgVGhlIHtAbGluayBPcHRpb25pbnB1dC5fdHJhbnNmb3JtZXIgfS4gKi9cbiAgcHVibGljIHNldCBvcHRpb25UcmFuc2Zvcm1lcih0b1NldDogKCh0b1RyYW5zZm9ybTogc3RyaW5nKSA9PiBzdHJpbmcpIHwgdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5fb3B0aW9uVHJhbnNmb3JtZXIgPSB0b1NldDtcblxuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cbiAgLyoqIFN0b3JlcyBhICggdG9UcmFuc2Zvcm0gOiBzdHJpbmcgKSA9PiBzdHJpbmcgdG8gdXNlIGJlZm9yZSBzZXR0aW5nIHRoZSB7QGxpbmsgT3B0aW9uaW5wdXQudGFyZ2V0IH0ncyB2YWx1ZS4gKi9cbiAgcHJvdGVjdGVkIF90YXJnZXRPcHRpb25UcmFuc2Zvcm1lcjogKCh0b1RyYW5zZm9ybTogc3RyaW5nKSA9PiBzdHJpbmcpIHwgdW5kZWZpbmVkO1xuICAvKipcbiAgICogU2V0cyB0aGUge0BsaW5rIE9wdGlvbmlucHV0Ll90YXJnZXRPcHRpb25UcmFuc2Zvcm1lciB9LlxuICAgKlxuICAgKiBAcGFyYW0gdG9TZXQgVGhlIHtAbGluayBPcHRpb25pbnB1dC5fdGFyZ2V0T3B0aW9uVHJhbnNmb3JtZXIgfS4gKi9cbiAgcHVibGljIHNldCB0YXJnZXRPcHRpb25UcmFuc2Zvcm1lcih0b1NldDogKCh0b1RyYW5zZm9ybTogc3RyaW5nKSA9PiBzdHJpbmcpIHwgdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5fdGFyZ2V0T3B0aW9uVHJhbnNmb3JtZXIgPSB0b1NldDtcbiAgfVxuICAvKipcbiAgICogIFNldHMgdGhlIFVSTCB0byBhbiBpbWFnZSB0aGF0IHNoYWxsIGJlIHVzZWQgYXMgdGhlIENTUy1CYWNrZ3JvdW5kLUltYWdlIGZvciB0aGUge0BsaW5rIE9wdGlvbmlucHV0Lm9wdGlvbnMgfSBwYW5lbC5cbiAgICovXG4gIHB1YmxpYyBzZXQgYmFja2dyb3VuZEltYWdlKHRvU2V0OiBzdHJpbmcpIHtcbiAgICB0aGlzLmNzc0VuYWJsZWQgPSBgYmFja2dyb3VuZC1jb2xvciA6ICNGRkZGRkZERCA7IGJhY2tncm91bmQtc2l6ZSA6IGNvbnRhaW4gOyBiYWNrZ3JvdW5kLXBvc2l0aW9uIDogY2VudGVyIDsgYmFja2dyb3VuZC1yZXBlYXQgOiBuby1yZXBlYXQgOyBiYWNrZ3JvdW5kLWJsZW5kLW1vZGUgOiBvdmVybGF5IDsgZGlzcGxheSA6IGJsb2NrIDsgYmFja2dyb3VuZC1pbWFnZSA6IHVybChcIiR7dG9TZXR9XCIpLCBsaW5lYXItZ3JhZGllbnQoIDEzMGRlZyxyZ2JhKCA0MiwgMTIzLCAxNTUsIDEgKSAwJSwgcmdiYSggMjE2LCAyMTYsIDIzNSwgMSApIDUwJSwgcmdiYSggNDIsIDEyMywgMTU1LCAxICkgMTAwJSApYDtcbiAgfVxuICAvLyAjZW5kcmVnaW9uIE9wdGlvbnNcbiAgLyoqXG4gICAqIEdldHMgdGhlIHtAbGluayBIVE1MRWxlbWVudCB9IHJlcHJlc2VudGluZyB0aGUgY3VycmVudGx5IHNldCBvcHRpb24uXG4gICAqXG4gICAqIEByZXR1cm4gVGhlIHtAbGluayBIVE1MRWxlbWVudCB9IHJlcHJlc2VudGluZyB0aGUgY3VycmVudGx5IHNldCBvcHRpb24uICovXG4gIHB1YmxpYyBnZXQgY3VycmVudE9wdGlvbkVsZW1lbnQoKTogSFRNTEVsZW1lbnQge1xuICAgIHJldHVybiBJTlNUQU5DRS50c0NoZWNrPEhUTUxFbGVtZW50PihcbiAgICAgIERFRklORUQudHNDaGVjazxTaGFkb3dSb290Pih0aGlzLnNoYWRvd1Jvb3QpLnF1ZXJ5U2VsZWN0b3IoXCIuLS0tV2FYQ29kZS4tLU9wdGlvbmlucHV0Li0tT3B0aW9uLi1DdXJyZW50XCIpLFxuICAgICAgSFRNTEVsZW1lbnQsXG4gICAgKTtcbiAgfVxuICAvKipcbiAgICogR2V0cyB0aGUgbmFtZSBvZiB0aGUgY3VycmVudGx5IHNldCBvcHRpb24uXG4gICAqXG4gICAqIEByZXR1cm4gVGhlIG5hbWUgb2YgdGhlIGN1cnJlbnRseSBzZXQgb3B0aW9uLiAqL1xuICBwdWJsaWMgZ2V0IGN1cnJlbnRPcHRpb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gKFxuICAgICAgYnlDc3NIdG1sKFwiLi0tLVdhWENvZGUuLS1PcHRpb25pbnB1dC4tLU9wdGlvbi4tQ3VycmVudFwiLCB0aGlzLnNoYWRvd1Jvb3QgPz8gdW5kZWZpbmVkKT8uZGF0YXNldC5jYk9wdGlvbiA/PyBcIlwiXG4gICAgKTtcbiAgfVxuICAvKiogU3RvcmVzIHRoZSBsYXN0IHtAbGluayBLZXlib2FyZEV2ZW50IH0ncyAqKmtleSoqIHRoYXQgcGFzc2VkIHRocm91Z2gge0BsaW5rIE9wdGlvbmlucHV0Lm9uS2V5ZG93blRhcmdldCB9LiAqL1xuICBwcm90ZWN0ZWQgbGFzdEtleTogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAvKiogSG9sZHMgdGhlIENTUyB0byBhcHBseSB0byB0aGUge0BsaW5rIE9wdGlvbmlucHV0LmNPcHRpb25zIH0gd2hlbiB0aGlzIHtAbGluayBPcHRpb25pbnB1dCB9IGlzXG4gICAqIHRvIGJlIHtAbGluayBPcHRpb25pbnB1dC5zaG93IH1uLiAqL1xuICBwcm90ZWN0ZWQgY3NzRW5hYmxlZDogc3RyaW5nO1xuICAvKiogSG9sZHMgdGhlIENTUyB0byBhcHBseSB0byB0aGUge0BsaW5rIE9wdGlvbmlucHV0LmNPcHRpb25zIH0gd2hlbiB0aGlzIHtAbGluayBPcHRpb25pbnB1dCB9IGlzXG4gICAqIHNoYWxsIHtAbGluayBPcHRpb25pbnB1dC5oaWRlIH0uICovXG4gIHByb3RlY3RlZCBjc3NEaXNhYmxlZDogc3RyaW5nO1xuICAvKiogR2V0cyBhIHtAbGluayBib29sZWFuIH0gc3RhdGluZyB3aGV0aGVyIHRoZSB7QGxpbmsgT3B0aW9uaW5wdXQuY3NzRW5hYmxlZCB9IG9yIHtAbGluayBPcHRpb25pbnB1dC5jc3NEaXNhYmxlZCB9IGlzIGJlaW5nIGFwcGxpZWQgb24gdGhpc1xuICAgKiB7QGxpbmsgSFRNTERpdkVsZW1lbnQgfS5cbiAgICpcbiAgICogQHJldHVybnMgVGhpcyB7QGxpbmsgT3B0aW9uaW5wdXQgfSAncyBcImVuYWJsZWRcIi1hdHRyaWJ1dGUgdmFsdWUuICovXG4gIEBIYXNBdHRyaWJ1dGUuY0lOVkFSSUFOVChcImVuYWJsZWRcIilcbiAgcHVibGljIGdldCBlbmFibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmdldEF0dHJpYnV0ZShcImVuYWJsZWRcIik/LnRvTG93ZXJDYXNlKCkgPT09IFwidHJ1ZVwiO1xuICB9XG4gIC8qKlxuICAgKiBTZXRzIHRoaXMge0BsaW5rIE9wdGlvbmlucHV0IH0gJ3MgXCJlbmFibGVkXCItYXR0cmlidXRlIHZhbHVlXG4gICAqXG4gICAqIEBwYXJhbSB0b1NldCBUaGUgdmFsdWUgVGhpcyB7QGxpbmsgT3B0aW9uaW5wdXQgfSAncyBcImVuYWJsZWRcIi1hdHRyaWJ1dGUgc2hhbGwgYmUgc2V0IHRvLiAqL1xuICBwdWJsaWMgc2V0IGVuYWJsZWQodG9TZXQ6IGJvb2xlYW4pIHtcbiAgICB0aGlzLnNldEF0dHJpYnV0ZShcImVuYWJsZWRcIiwgdG9TZXQgPyBcInRydWVcIiA6IFwiZmFsc2VcIik7XG4gIH1cbiAgLy8gI3JlZ2lvbiBTdHlsaW5nXG4gIC8qKiBIb2xkcyB0aGUgc3R5bGVzaGVldCB0aGF0IHZhcmllcyBkZXBlbmRpbmcgb24gd2hldGhlciB0aGlzIHtAbGluayBPcHRpb25pbnB1dCB9IGlzIGN1cnJlbnRseVxuICAgKiB7QGxpbmsgT3B0aW9uaW5wdXQuZW5hYmxlZCB9IG9yIHtAbGluayBPcHRpb25pbnB1dC5jc3NFbmFibGVkIH0gb3Ige0BsaW5rIE9wdGlvbmlucHV0LmNzc0Rpc2FibGVkIH0gY2hhbmdlLiAqL1xuICBwcm90ZWN0ZWQgdmFyaWFibGVTdHlsZTogSFRNTFN0eWxlRWxlbWVudDtcbiAgLyoqIEhvbGRzIHRoZSBmYWRlIGluIGFuaW1hdGlvbiBmb3IgdGhpcyB7QGxpbmsgT3B0aW9uaW5wdXQgfS4gKi9cbiAgcHVibGljIGNzc0ZhZGVJTjogc3RyaW5nID0gYFxuICAgIEBrZXlmcmFtZXMga2ZGYWRlSU5fT3B0aW9uaW5wdXQge1xuICAgICAgICAwJSAgICB7IHNjYWxlIDogMS4xIDsgb3BhY2l0eSA6IDAgO31cbiAgICAgICAgMTAwJSAgeyBzY2FsZSA6IDEgOyBvcGFjaXR5IDogLjkgO319XG4gICAgZGl2Li0tLVdhWENvZGUuLS1PcHRpb25pbnB1dCB7IGFuaW1hdGlvbiA6IGtmRmFkZUlOX09wdGlvbmlucHV0IC4yNXMgZWFzZS1pbiBmb3J3YXJkcyA7fWA7XG4gIC8vICNlbmRyZWdpb24gU3R5bGluZ1xuICAvLyAjcmVnaW9uIFRhcmdldGluZyBpbnB1dC1lbGVtZW50c1xuICAvKiogU3RvcmVzIHRoZSB7QGxpbmsgSFRNTElucHV0RWxlbWVudCB9IHRoYXQgaXMgY3VycmVudGx5IHRhcmdldGVkLiovXG4gIHByb3RlY3RlZCBfdGFyZ2V0OiBIVE1MSW5wdXRFbGVtZW50IHwgdW5kZWZpbmVkO1xuICAvKipcbiAgICogR2V0cyB0aGUge0BsaW5rIE9wdGlvbmlucHV0Ll90YXJnZXQgfS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHtAbGluayBPcHRpb25pbnB1dC5fdGFyZ2V0IH0uICovXG4gIHB1YmxpYyBnZXQgdGFyZ2V0KCk6IEhUTUxJbnB1dEVsZW1lbnQgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl90YXJnZXQ7XG4gIH1cbiAgLyoqXG4gICAqIFNldHMgdGhlIHtAbGluayBPcHRpb25pbnB1dC5fdGFyZ2V0IH0sIHVwZGF0ZXMgdGhlIGNoZWNrYm94ZXMgYWNjb3JkaW5nIHRvIHRoZSBmdW5jdGlvbmFsaXRpZXMgbWVudGlvbmVkIGluXG4gICAqIHRoZSB7QGxpbmsgT3B0aW9uaW5wdXQudGFyZ2V0IH0gYW5kIGJpbmQge0BsaW5rIE9wdGlvbmlucHV0Lm9uS2V5dXBUYXJnZXQgfSAmIHtAbGluayBPcHRpb25pbnB1dC5vbktleWRvd25UYXJnZXQgfVxuICAgKiB0byB0aGUge0BsaW5rIE9wdGlvbmlucHV0LnRhcmdldCB9ICoqdG9TZXQqKiAqKmtleXVwKiogJiAqKmtleWRvd24qKiBldmVudHMgYWxzbyByZW1vdmluZyB0aGUgaGFuZGxlciBmcm9tIHRoZVxuICAgKiBmb3JtZXIge0BsaW5rIE9wdGlvbmlucHV0LnRhcmdldCB9LlxuICAgKlxuICAgKiBAcGFyYW0gdG9TZXQgVGhlIHtAbGluayBPcHRpb25pbnB1dC5fdGFyZ2V0IH0uXG4gICAqXG4gICAqIEB0aHJvd3MgIEEge0BsaW5rIERCQy5JbmZyaW5nZW1lbnQgfSBpZiB0aGlzIHtAbGluayBPcHRpb25pbnB1dCB9J3Mge0BsaW5rIEhUTUxEaXZFbGVtZW50LnNoYWRvd1Jvb3QgfSBpcyBub3RcbiAgICogICAgICAgICAgZGVmaW5lZCBvciBhIHF1ZXJ5IG9mICoqLi0tLVdhWENvZGUuLS1PcHRpb25pbnB1dC4tLU9wdGlvbi4tQ3VycmVudCoqIG9yXG4gICAqICAgICAgICAgICoqLi0tLVdhWENvZGUuLS1PcHRpb25pbnB1dC4tLU9wdGlvbioqZG9lcyBub3QgcmV0dXJuIGFuIHtAbGluayBIVE1MRGl2RWxlbWVudCB9LiovXG4gIHB1YmxpYyBzZXQgdGFyZ2V0KHRvU2V0OiBIVE1MSW5wdXRFbGVtZW50KSB7XG4gICAgaWYgKHRoaXMuX3RhcmdldCAmJiB0aGlzLl90YXJnZXQgIT09IHRvU2V0KSB7XG4gICAgICB0aGlzLl90YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImZvY3VzXCIsIHRoaXMub25Gb2N1c1RhcmdldCk7XG4gICAgICB0aGlzLl90YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIHRoaXMub25LZXl1cFRhcmdldCk7XG4gICAgICB0aGlzLl90YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5vbktleWRvd25UYXJnZXQpO1xuICAgICAgdGhpcy5fdGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCB0aGlzLm9uSW5wdXRUYXJnZXQpO1xuICAgICAgdGhpcy5fdGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJzZWxlY3Rpb25jaGFuZ2VcIiwgdGhpcy5vbklucHV0VGFyZ2V0KTtcbiAgICB9XG5cbiAgICB0aGlzLl90YXJnZXQgPSB0b1NldDtcblxuICAgIHRoaXMuX3RhcmdldC5hZGRFdmVudExpc3RlbmVyKFwiZm9jdXNcIiwgdGhpcy5vbkZvY3VzVGFyZ2V0LmJpbmQodGhpcykpO1xuICAgIHRoaXMuX3RhcmdldC5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgdGhpcy5vbktleXVwVGFyZ2V0LmJpbmQodGhpcykpO1xuICAgIHRoaXMuX3RhcmdldC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLm9uS2V5ZG93blRhcmdldC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLl90YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIHRoaXMub25JbnB1dFRhcmdldC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLl90YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcInNlbGVjdGlvbmNoYW5nZVwiLCB0aGlzLm9uSW5wdXRUYXJnZXQuYmluZCh0aGlzKSk7XG5cbiAgICBpZiAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA9PT0gdGhpcy5fdGFyZ2V0KSB7XG4gICAgICB0aGlzLm9uRm9jdXNUYXJnZXQobmV3IEV2ZW50KFwiZm9jdXNcIikpO1xuICAgIH1cblxuICAgIGNvbnN0IHNoYWRvdyA9IERFRklORUQudHNDaGVjazxTaGFkb3dSb290Pih0aGlzLnNoYWRvd1Jvb3QpO1xuICAgIC8vIENoZWNrIGFsbCBvcHRpb25zIHRoYXQncmUgbWVudGlvbmVkIGluIHRoZSBuZXcge0BsaW5rIFNWTWFuYWdlci50YXJnZXQgfS5cbiAgICBmb3IgKGNvbnN0IGNoZWNrYm94IG9mIHNoYWRvdy5xdWVyeVNlbGVjdG9yQWxsKFwiaW5wdXRcIikpIHtcbiAgICAgIGNoZWNrYm94LmNoZWNrZWQgPVxuICAgICAgICB0aGlzLl90YXJnZXQudmFsdWUudG9Mb3dlckNhc2UoKS5pbmRleE9mKGNoZWNrYm94LnBhcmVudEVsZW1lbnQ/LmRhdGFzZXQuY2JPcHRpb24/LnRvTG93ZXJDYXNlKCkgPz8gXCJcIikgIT09IC0xO1xuICAgIH1cbiAgICAvLyBSZWVuYWJsZSBhbGwgZGlzYWJsZWQgb3B0aW9ucy5cbiAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBhbGxCeUNzc0h0bWwoXCIuLS0tV2FYQ29kZS4tLU9wdGlvbmlucHV0Li0tT3B0aW9uXCIsIHNoYWRvdykpIHtcbiAgICAgIG9wdGlvbi5zdHlsZS5kaXNwbGF5ID0gXCJmbGV4XCI7XG4gICAgfVxuICAgIC8vICNyZWdpb24gU2VsZWN0IGZpcnN0IG9wdGlvbiBhcyB0aGUgY3VycmVudCBvbmVcbiAgICBjb25zdCBmb3JtZXIgPSBzaGFkb3cucXVlcnlTZWxlY3RvcihcIi4tLS1XYVhDb2RlLi0tT3B0aW9uaW5wdXQuLS1PcHRpb24uLUN1cnJlbnRcIik7XG5cbiAgICBpZiAoZm9ybWVyICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBmb3JtZXIgPSBJTlNUQU5DRS50c0NoZWNrPEhUTUxEaXZFbGVtZW50PihcbiAgICAgICAgc2hhZG93LnF1ZXJ5U2VsZWN0b3IoXCIuLS0tV2FYQ29kZS4tLU9wdGlvbmlucHV0Li0tT3B0aW9uLi1DdXJyZW50XCIpLFxuICAgICAgICBIVE1MRGl2RWxlbWVudCxcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IG9wdGlvbkVsZW1lbnRzID0gc2hhZG93LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuLS0tV2FYQ29kZS4tLU9wdGlvbmlucHV0Li0tT3B0aW9uXCIpO1xuXG4gICAgICBpZiAob3B0aW9uRWxlbWVudHNbMF0gIT09IGZvcm1lcikge1xuICAgICAgICBJTlNUQU5DRS50c0NoZWNrPEhUTUxEaXZFbGVtZW50PihcbiAgICAgICAgICBzaGFkb3cucXVlcnlTZWxlY3RvcihcIi4tLS1XYVhDb2RlLi0tT3B0aW9uaW5wdXQuLS1PcHRpb25cIiksXG4gICAgICAgICAgSFRNTERpdkVsZW1lbnQsXG4gICAgICAgICkuY2xhc3NMaXN0LmFkZChcIi1DdXJyZW50XCIpO1xuXG4gICAgICAgIGZvcm1lci5jbGFzc0xpc3QucmVtb3ZlKFwiLUN1cnJlbnRcIik7XG4gICAgICB9XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gU2VsZWN0IGZpcnN0IG9wdGlvbiBhcyB0aGUgY3VycmVudCBvbmVcbiAgfVxuICAvLyAjZW5kcmVnaW9uIFRhcmdldGluZyBpbnB1dC1lbGVtZW50c1xuICAvLyAjcmVnaW9uIEluZm9cbiAgLyoqIFN0b3JlcyB3aGV0aGVyIHRoZSB7QGxpbmsgT3B0aW9uaW5wdXQudGFyZ2V0IH0gaXMgZm9jdXNlZCBmb3IgdGhlIGZpcnN0IHRpbWUuICovXG4gIHByb3RlY3RlZCBuZXdGb2N1c1RhcmdldCA9IGZhbHNlO1xuICAvLyAjZW5kcmVnaW9uIEluZm9cbiAgLyoqXG4gICAqIENyZWF0ZXMgdGhpcyB7QGxpbmsgSFRNTERpdkVsZW1lbnQgfSBieSBtYXBwaW5nIGl0J3MgcHJvcGVydGllcyB0byBpdCdzIGF0dHJpYnV0ZXMgYW5kIGluamVjdGluZyBhXG4gICAqIG5lZWRlZCBzdHlsZXNoZWV0LiAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIC8vICNyZWdpb24gUHJldmVudCBhbnl0aGluZyBmcm9tIGxvb3NpbmcgZm9jdXMgd2hlbiB0aGUgU1ZNYW5hZ2VyIGlzIGNsaWNrZWQuXG4gICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSk7XG4gICAgLy8gI2VuZHJlZ2lvbiBQcmV2ZW50IGFueXRoaW5nIGZyb20gbG9vc2luZyBmb2N1cyB3aGVuIHRoZSBTVk1hbmFnZXIgaXMgY2xpY2tlZC5cbiAgICAvLyAjcmVnaW9uIFBSRUNPTkRJVElPTlNcbiAgICBuZXcgSGFzQXR0cmlidXRlKFwib3B0aW9uc1wiKS5jaGVjayh0aGlzKTtcbiAgICAvLyAjZW5kcmVnaW9uIFBSRUNPTkRJVElPTlNcbiAgICAvLyAjcmVnaW9uIFByb3BlcnR5IG1hcHBpbmdcbiAgICB0aGlzLmF0dGFjaFNoYWRvdyh7IG1vZGU6IFwib3BlblwiIH0pO1xuXG4gICAgdGhpcy5zZXBhcmF0b3IgPSB0aGlzLmdldEF0dHJpYnV0ZShcInNlcGFyYXRvclwiKSA/PyBcIixcIjtcbiAgICB0aGlzLm9wdGlvbnMgPSB0aGlzLmdldEF0dHJpYnV0ZShcIm9wdGlvbnNcIik/LnNwbGl0KHRoaXMuc2VwYXJhdG9yKSA/PyBbXTtcbiAgICB0aGlzLmNzc0VuYWJsZWQgPVxuICAgICAgdGhpcy5nZXRBdHRyaWJ1dGUoXCJjc3NFbmFibGVkXCIpID8/XG4gICAgICBcImRpc3BsYXkgOiBibG9jayA7IGJhY2tncm91bmQtaW1hZ2UgOiBsaW5lYXItZ3JhZGllbnQoIDEzMGRlZyxyZ2JhKCA0MiwgMTIzLCAxNTUsIDEgKSAwJSwgcmdiYSggMjE2LCAyMTYsIDIzNSwgMSApIDUwJSwgcmdiYSggNDIsIDEyMywgMTU1LCAxICkgMTAwJSApXCI7XG4gICAgdGhpcy5jc3NEaXNhYmxlZCA9IHRoaXMuZ2V0QXR0cmlidXRlKFwiY3NzRGlzYWJsZWRcIikgPz8gXCJkaXNwbGF5IDogbm9uZSA7XCI7XG4gICAgdGhpcy5lbmFibGVkID0gdGhpcy5nZXRBdHRyaWJ1dGUoXCJlbmFibGVkXCIpPy50b0xvd2VyQ2FzZSgpID09PSBcInRydWVcIjtcbiAgICAvLyAjZW5kcmVnaW9uIFByb3BlcnR5IG1hcHBpbmdcbiAgICAvLyAjcmVnaW9uIERPTSBwcmVwYXJhdGlvbnNcbiAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCItLS1XYVhDb2RlXCIsIFwiLS1PcHRpb25pbnB1dFwiKTtcblxuICAgIHRoaXMudmFyaWFibGVTdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcbiAgICB0aGlzLnZhcmlhYmxlU3R5bGUuaW5uZXJIVE1MID0gYCR7dGhpcy5lbmFibGVkID8gdGhpcy5jc3NFbmFibGVkIDogdGhpcy5jc3NEaXNhYmxlZH19YDtcblxuICAgIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuICAgIHN0eWxlLmlubmVySFRNTCA9IGBcbiAgICAgICAgZGl2Li0tLVdhWENvZGUuLS1PcHRpb25pbnB1dC4tLU9wdGlvbiAgICAgICAgICAgICB7IGRpc3BsYXkgOiBmbGV4IDsgdHJhbnNpdGlvbiA6IC4yNXMgYWxsIDt9XG4gICAgICAgIGRpdi4tLS1XYVhDb2RlLi0tT3B0aW9uaW5wdXQuLS1PcHRpb24gcCAgICAgICAgICAge1xuICAgICAgICAgIGN1cnNvciA6IHBvaW50ZXIgOyBiYWNrZ3JvdW5kLWNvbG9yIDogdHJhbnNwYXJlbnQgOyBjb2xvciA6IGJsYWNrIDsgdGV4dC1zaGFkb3cgOiAwIDAgLjI1ZW0gd2hpdGUgO31cbiAgICAgICAgZGl2Li0tLVdhWENvZGUuLS1PcHRpb25pbnB1dC4tLU9wdGlvbi4tQ3VycmVudCAgICB7XG4gICAgICAgICAgYm9yZGVyIDogc29saWQgOyBib3JkZXItcmFkaXVzIDogLjVlbSA7IGJvcmRlci1jb2xvciA6IGRhcmtvcmFuZ2UgOyBib3gtc2hhZG93IDogMCAwIC41ZW0gYmxhY2sgO1xuICAgICAgICAgIGJhY2tncm91bmQtY29sb3IgOiAjRkY4QzAwQkIgO31cbiAgICAgICAgZGl2Li0tLVdhWENvZGUuLS1PcHRpb25pbnB1dC4tLU9wdGlvbi4tQ3VycmVudCBwICB7IGNvbG9yIDogYmxhY2sgO31gO1xuXG4gICAgdGhpcy52YXJpYWJsZVN0eWxlID0gdGhpcy5hcHBlbmRDaGlsZCh0aGlzLnZhcmlhYmxlU3R5bGUpO1xuXG4gICAgREVGSU5FRC50c0NoZWNrPFNoYWRvd1Jvb3Q+KHRoaXMuc2hhZG93Um9vdCkuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuICAgIC8vICNlbmRyZWdpb24gRE9NIHByZXBhcmF0aW9uc1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cbiAgLyoqIFJlbmRlcidzIGFsbCB7QGxpbmsgT3B0aW9uaW5wdXQub3B0aW9ucyB9LiAqL1xuICBwcm90ZWN0ZWQgcmVuZGVyKCk6IHZvaWQge1xuICAgIGNvbnN0IHNoYWRvdyA9IERFRklORUQudHNDaGVjazxTaGFkb3dSb290Pih0aGlzLnNoYWRvd1Jvb3QpO1xuXG4gICAgZm9yIChjb25zdCB0b1JlbW92ZSBvZiBzaGFkb3cucXVlcnlTZWxlY3RvckFsbChcImRpdi4tLS1XYVhDb2RlLi0tT3B0aW9uaW5wdXQuLS1PcHRpb25cIikpIHtcbiAgICAgIHRvUmVtb3ZlLnJlbW92ZSgpO1xuICAgIH1cbiAgICAvLyAjcmVnaW9uIE9wdGlvbnMgaW5qZWN0aW9uXG4gICAgZm9yIChjb25zdCBvcHRpb24gb2YgdGhpcy5vcHRpb25zKSB7XG4gICAgICBzaGFkb3cuaW5uZXJIVE1MICs9IGBcbiAgICAgICAgPGRpdiAgY2xhc3MgICAgICAgICAgID0gXCItLS1XYVhDb2RlIC0tT3B0aW9uaW5wdXQgLS1PcHRpb24gJHt0aGlzLm9wdGlvbnNbMF0gPT09IG9wdGlvbiA/IFwiLUN1cnJlbnRcIiA6IFwiXCJ9XCJcbiAgICAgICAgICAgICAgcGFydCAgICAgICAgICAgID0gXCJPcHRpb25jb250YWluZXJcIlxuICAgICAgICAgICAgICBkYXRhLWNiLW9wdGlvbiAgPSBcIiR7b3B0aW9ufVwiPlxuICAgICAgICAgIDxwIHBhcnQgPSBcIk9wdGlvbnRleHRcIj4ke3RoaXMuX29wdGlvblRyYW5zZm9ybWVyID8gdGhpcy5fb3B0aW9uVHJhbnNmb3JtZXIob3B0aW9uKSA6IG9wdGlvbn08L3A+PC9kaXY+YDtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvbiBPcHRpb25zIGluamVjdGlvblxuICAgIC8vICNyZWdpb24gQmluZCBldmVudCBoYW5kbGVyXG4gICAgZm9yIChjb25zdCBjaGVja2JveCBvZiBzaGFkb3cucXVlcnlTZWxlY3RvckFsbCgnW3BhcnQ9XCJPcHRpb25pbnB1dFwiXScpKSB7XG4gICAgICBjaGVja2JveC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5vbkNoZWNrYm94LmJpbmQodGhpcykpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBzaGFkb3cucXVlcnlTZWxlY3RvckFsbCgnW3BhcnQ9XCJPcHRpb250ZXh0XCJdJykpIHtcbiAgICAgIG9wdGlvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5vbk9wdGlvbi5iaW5kKHRoaXMpKTtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvbiBCaW5kIGV2ZW50IGhhbmRsZXJcbiAgfVxuICAvKipcbiAgICogUHJvY2Vzc2VzIGNoYW5nZXMgaW4gdGhlIHtAbGluayBPcHRpb25pbnB1dCB9J3Mgc3lzdGVtIGF0dHJpYnV0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lICAgICAgVGhlIGNoYW5nZWQgYXR0cmlidXRlJ3MgbmFtZS5cbiAgICogQHBhcmFtIG9sZFZhbHVlICBUaGUgY2hhbmdlZCBhdHRyaWJ1dGUncyBmb3JtZXIgdmFsdWUuXG4gICAqIEBwYXJhbSBuZXdWYWx1ZSAgVGhlIGNoYW5nZWQgYXR0cmlidXRlJ3MgY3VycmVudCB2YWx1ZS4gKi9cbiAgQERCQy5QYXJhbXZhbHVlUHJvdmlkZXJcbiAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKFxuICAgIEBPUi5QUkUoW25ldyBFUShcIm9wdGlvbnNcIiksIG5ldyBFUShcInNlcGFyYXRvclwiKSwgbmV3IEVRKFwiZW5hYmxlZFwiKSwgbmV3IEVRKFwiY3NzZW5hYmxlZFwiKSwgbmV3IEVRKFwiY3NzZGlzYWJsZWRcIildKVxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBvbGRWYWx1ZTogc3RyaW5nLFxuICAgIEBJRi5QUkUobmV3IEVRKFwiY3NzZW5hYmxlZFwiKSwgbmV3IFJFR0VYKC9eXFxzKig/OltcXHctXStcXHMqOlxccypbXjtdKzs/XFxzKikrJC8pKVxuICAgIEBJRi5QUkUobmV3IEVRKFwiY3NzZGlzYWJsZWRcIiksIG5ldyBSRUdFWCgvXlxccyooPzpbXFx3LV0rXFxzKjpcXHMqW147XSs7P1xccyopKyQvKSlcbiAgICBuZXdWYWx1ZTogc3RyaW5nLFxuICApOiB2b2lkIHtcbiAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgIGNhc2UgXCJvcHRpb25zXCI6XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG5ld1ZhbHVlLnNwbGl0KHRoaXMuc2VwYXJhdG9yKTtcblxuICAgICAgICB0aGlzLnJlbmRlcigpO1xuXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcInNlcGFyYXRvclwiOlxuICAgICAgICB0aGlzLnNlcGFyYXRvciA9IG5ld1ZhbHVlO1xuXG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG5cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiZW5hYmxlZFwiOlxuICAgICAgICB0aGlzLnZhcmlhYmxlU3R5bGUuaW5uZXJIVE1MID0gYCR7bmV3VmFsdWUudG9Mb3dlckNhc2UoKSA9PT0gXCJ0cnVlXCIgPyB0aGlzLmNzc0ZhZGVJTiA6IFwiXCJ9IGRpdi4tLS1XYVhDb2RlLi0tT3B0aW9uaW5wdXQgeyAke1xuICAgICAgICAgIG5ld1ZhbHVlLnRvTG93ZXJDYXNlKCkgPT09IFwidHJ1ZVwiID8gdGhpcy5jc3NFbmFibGVkIDogdGhpcy5jc3NEaXNhYmxlZFxuICAgICAgICB9fWA7XG5cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiY3NzZW5hYmxlZFwiOlxuICAgICAgICB0aGlzLmNzc0VuYWJsZWQgPSBuZXdWYWx1ZTtcblxuICAgICAgICBpZiAodGhpcy5lbmFibGVkKSB7XG4gICAgICAgICAgdGhpcy52YXJpYWJsZVN0eWxlLmlubmVySFRNTCA9IGAke3RoaXMuY3NzRmFkZUlOfSBkaXYuLS0tV2FYQ29kZS4tLU9wdGlvbmlucHV0IHsgJHt0aGlzLmNzc0VuYWJsZWR9fWA7XG4gICAgICAgIH1cblxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJjc3NkaXNhYmxlZFwiOlxuICAgICAgICB0aGlzLmNzc0Rpc2FibGVkID0gbmV3VmFsdWU7XG4gICAgICAgIGlmICghdGhpcy5lbmFibGVkKSB7XG4gICAgICAgICAgdGhpcy52YXJpYWJsZVN0eWxlLmlubmVySFRNTCA9IGAke3RoaXMuY3NzRmFkZUlOfSBkaXYuLS0tV2FYQ29kZS4tLU9wdGlvbmlucHV0IHsgJHt0aGlzLmNzc0Rpc2FibGVkfX1gO1xuICAgICAgICB9XG5cbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIC8vICNyZWdpb24gUmVnaXN0cmF0aW9uIGFzIGN1c3RvbSBlbGVtZW50XG4gIC8qKlxuICAgKiBTdGF0ZXMgd2hldGhlciB0aGlzIHtAbGluayBPcHRpb25pbnB1dCB9IHdhcyBzdWNjZXNzZnVsbHkgcmVnaXN0ZXJlZCBhcyBhIGN1c3RvbSBlbGVtZW50IGFuZCBwZXJmb3Jtc1xuICAgKiB0aGUgcmVnaXN0cmF0aW9uIHVwb24gY2xhc3MgdXNhZ2UuXG4gICAqXG4gICAqIEB0aHJvd3MgU2VlIHtAbGluayB3aW5kb3cuY3VzdG9tRWxlbWVudHMgfSdzICoqZGVmaW5lKiogbWV0aG9kLiAqL1xuICBwdWJsaWMgc3RhdGljIHJlZ2lzdGVyZWQ6IGJvb2xlYW4gPSAoKCkgPT4ge1xuICAgIGN1c3RvbUVsZW1lbnRzLmRlZmluZShcInhjLW9wdGlvbmlucHV0XCIsIE9wdGlvbmlucHV0LCB7IGV4dGVuZHM6IFwiZGl2XCIgfSk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSkoKTtcbiAgLy8gI2VuZHJlZ2lvbiBSZWdpc3RyYXRpb24gYXMgY3VzdG9tIGVsZW1lbnRcbiAgLy8gI3JlZ2lvbiBDaGVja2JveCBoYW5kbGluZ1xuICAvKipcbiAgICogSWYgdGhlIHtAbGluayBPcHRpb25pbnB1dC50YXJnZXQgfSBpcyBkZWZpbmVkLCBjbGlja2luZyBhIGNoZWNrYm94IHdpbGwgZWl0aGVyIHJlc3VsdCBpbiB0aGUgY29ycmVzcG9uZGluZ1xuICAgKiBmdW5jdGlvbmFsaXR5IHRvIGJlIHJlbW92ZWQgb3IgYWRkZWQgdG8gdGhlIHtAbGluayBPcHRpb25pbnB1dC50YXJnZXQgfSdzIHZhbHVlLlxuICAgKlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIHtAbGluayBFdmVudCB9LiAqL1xuICBwcm90ZWN0ZWQgb25DaGVja2JveChldmVudDogRXZlbnQpOiB2b2lkIHtcbiAgICBjb25zdCB0YXJnZXQgPSBJTlNUQU5DRS50c0NoZWNrPEhUTUxJbnB1dEVsZW1lbnQ+KHRoaXMudGFyZ2V0LCBIVE1MSW5wdXRFbGVtZW50KTtcbiAgICBjb25zdCBldmVudFRhcmdldCA9IElOU1RBTkNFLnRzQ2hlY2s8SFRNTElucHV0RWxlbWVudD4oZXZlbnQudGFyZ2V0LCBIVE1MSW5wdXRFbGVtZW50KTtcblxuICAgIHRhcmdldC5mb2N1cygpO1xuXG4gICAgY29uc3Qgb3B0aW9uID0gZXZlbnRUYXJnZXQucGFyZW50RWxlbWVudD8uZ2V0QXR0cmlidXRlKFwiZGF0YS1jYi1vcHRpb25cIik/LnRvVXBwZXJDYXNlKCkgPz8gXCJcIjtcblxuICAgIGlmIChldmVudFRhcmdldC5jaGVja2VkKSB7XG4gICAgICAvLyAjcmVnaW9uIEFkZCBmdW5jdGlvbmFsaXR5XG4gICAgICAvLyBJZiBjYXJldCBpcyBhdCB0aGUgZW5kIG9mIHRoZSA8aW5wdXQ+Li4uXG4gICAgICBpZiAodGFyZ2V0LnNlbGVjdGlvblN0YXJ0ID09PSAwKSB7XG4gICAgICAgIHRhcmdldC52YWx1ZSA9IGAke29wdGlvbi50cmltKCl9JHt0YXJnZXQudmFsdWUubGVuZ3RoID09PSAwID8gXCJcIiA6IFwiLFwifWA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGFyZ2V0LnNlbGVjdGlvblN0YXJ0ICE9PSBudWxsKSB7XG4gICAgICAgICAgLy8gI3JlZ2lvbiBEZXRlcm1pbmUgaW5kaWNlcyBmb3IgcmVwbGFjZW1lbnRcbiAgICAgICAgICBsZXQgc2VnbWVudFN0YXJ0ID0gdGFyZ2V0LnNlbGVjdGlvblN0YXJ0O1xuXG4gICAgICAgICAgd2hpbGUgKHRhcmdldC52YWx1ZVstLXNlZ21lbnRTdGFydF0gIT09IHRoaXMuc2VwYXJhdG9yICYmIHNlZ21lbnRTdGFydCAhPT0gMCkge31cbiAgICAgICAgICBsZXQgc2VnbWVudEVuZCA9IHRhcmdldC5zZWxlY3Rpb25TdGFydCAtIDE7XG5cbiAgICAgICAgICB3aGlsZSAodGFyZ2V0LnZhbHVlWysrc2VnbWVudEVuZF0gIT09IHRoaXMuc2VwYXJhdG9yICYmIHNlZ21lbnRFbmQgIT09IHRhcmdldC52YWx1ZS5sZW5ndGgpIHt9XG4gICAgICAgICAgLy8gI2VuZHJlZ2lvbiBEZXRlcm1pbmUgaW5kaWNlcyBmb3IgcmVwbGFjZW1lbnRcbiAgICAgICAgICAvLyAjcmVnaW9uIFJlcGxhY2UgcHJvcGVybHkgbGVhdmluZyB0aGUgW3NlcGFyYXRvcl0gdW50b3VjaGVkXG4gICAgICAgICAgdGFyZ2V0LnZhbHVlID0gdGFyZ2V0LnZhbHVlLnJlcGxhY2UoXG4gICAgICAgICAgICB0YXJnZXQudmFsdWVcbiAgICAgICAgICAgICAgLnRyaW0oKVxuICAgICAgICAgICAgICAuc3Vic3RyaW5nKHNlZ21lbnRTdGFydCArICh0YXJnZXQudmFsdWVbc2VnbWVudFN0YXJ0XSA9PT0gdGhpcy5zZXBhcmF0b3IgPyArMSA6IDApLCBzZWdtZW50RW5kKSxcbiAgICAgICAgICAgIGAke29wdGlvbi50cmltKCl9LGAsXG4gICAgICAgICAgKTtcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uIFJlcGxhY2UgcHJvcGVybHkgbGVhdmluZyB0aGUgW3NlcGFyYXRvcl0gdW50b3VjaGVkXG4gICAgICAgICAgdGFyZ2V0LnNldFNlbGVjdGlvblJhbmdlKHNlZ21lbnRFbmQsIHNlZ21lbnRFbmQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vICNlbmRyZWdpb24gQWRkIGZ1bmN0aW9uYWxpdHlcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gI3JlZ2lvbiBSZW1vdmUgZnVuY3Rpb25hbGl0eVxuICAgICAgY29uc3QgdGFyZ2V0VmFsdWUgPSB0YXJnZXQudmFsdWUudHJpbSgpO1xuXG4gICAgICB0YXJnZXQudmFsdWUgPSB0YXJnZXRWYWx1ZVxuICAgICAgICAudG9VcHBlckNhc2UoKVxuICAgICAgICAucmVwbGFjZShcbiAgICAgICAgICAodGFyZ2V0VmFsdWUuaW5kZXhPZihgLCR7b3B0aW9ufWApID09PSAtMSA/IFwiXCIgOiBcIixcIikgK1xuICAgICAgICAgICAgb3B0aW9uICtcbiAgICAgICAgICAgICh0YXJnZXRWYWx1ZS5pbmRleE9mKGAsJHtvcHRpb259YCkgPT09IC0xID8gXCIsXCIgOiBcIlwiKSxcbiAgICAgICAgICBcIlwiLFxuICAgICAgICApO1xuICAgICAgLy8gI2VuZHJlZ2lvbiBSZW1vdmUgZnVuY3Rpb25hbGl0eVxuICAgIH1cbiAgfVxuICAvLyAjZW5kcmVnaW9uIENoZWNrYm94IGhhbmRsaW5nXG4gIC8vICNyZWdpb24gQ2hlY2tib3ggaGFuZGxpbmdcbiAgLyoqXG4gICAqIFNlbGVjdHMgdGhlIGNsaWNrZWQgb3B0aW9uIGFuZCBmaXJlcyB0aGUge0BsaW5rIE9wdGlvbmlucHV0Lm9uT3B0aW9uQ2hhbmdlZCB9IGhhbmRsZXJzLlxuICAgKlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIHtAbGluayBFdmVudCB9LiAqL1xuICBwcm90ZWN0ZWQgb25PcHRpb24oZXZlbnQ6IEV2ZW50KTogdm9pZCB7XG4gICAgY29uc3QgZXZlbnRUYXJnZXQgPSBJTlNUQU5DRS50c0NoZWNrPEhUTUxFbGVtZW50PihldmVudC50YXJnZXQsIEhUTUxFbGVtZW50KTtcbiAgICBjb25zdCBjdXJyZW50T3B0aW9uID0gSU5TVEFOQ0UudHNDaGVjazxIVE1MRWxlbWVudD4oXG4gICAgICBERUZJTkVELnRzQ2hlY2s8RWxlbWVudD4oXG4gICAgICAgIERFRklORUQudHNDaGVjazxTaGFkb3dSb290Pih0aGlzLnNoYWRvd1Jvb3QpLnF1ZXJ5U2VsZWN0b3IoXCIuLS0tV2FYQ29kZS4tLU9wdGlvbmlucHV0Li0tT3B0aW9uLi1DdXJyZW50XCIpLFxuICAgICAgKSxcbiAgICAgIEhUTUxFbGVtZW50LFxuICAgICk7XG5cbiAgICBjdXJyZW50T3B0aW9uLmNsYXNzTGlzdC5yZW1vdmUoXCItQ3VycmVudFwiKTtcblxuICAgIGNvbnN0IG5ld0N1cnJlbnRDb250YWluZXIgPSBldmVudFRhcmdldC5wYXJlbnRFbGVtZW50O1xuXG4gICAgaWYgKG5ld0N1cnJlbnRDb250YWluZXIpIHtcbiAgICAgIG5ld0N1cnJlbnRDb250YWluZXIuY2xhc3NMaXN0LmFkZChcIi1DdXJyZW50XCIpO1xuICAgICAgbmV3Q3VycmVudENvbnRhaW5lci5zY3JvbGxJbnRvVmlldyh7IGJlaGF2aW9yOiBcInNtb290aFwiLCBpbmxpbmU6IFwiY2VudGVyXCIsIGJsb2NrOiBcImNlbnRlclwiIH0pO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgaGFuZGxlciBvZiB0aGlzLm9uT3B0aW9uQ2hhbmdlZCkge1xuICAgICAgY29uc3QgbmV3T3B0aW9uID0gZXZlbnRUYXJnZXQucGFyZW50RWxlbWVudD8uZGF0YXNldC5jYk9wdGlvbjtcblxuICAgICAgaWYgKG5ld09wdGlvbikge1xuICAgICAgICBoYW5kbGVyKG5ld09wdGlvbik7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8vICNlbmRyZWdpb24gQ2hlY2tib3ggaGFuZGxpbmdcbiAgLy8gI3JlZ2lvbiBLZXlib2FyZCBoYW5kbGluZ1xuICAvKipcbiAgICogUHJldmVudHMgdGhlIHtAbGluayB0aGlzLnRhcmdldCB9IGZyb20gbG9vc2luZyBmb2N1cyBvbiBoaXR0aW5nIGtleXMgdGhhdCdyZSB1c2VkIHRvIGNvbnRyb2xcbiAgICogdGhpcyB7QGxpbmsgT3B0aW9uaW5wdXQgfS5cbiAgICpcbiAgICogQHBhcmFtIGV2ZW50IFRoZSB7QGxpbmsgS2V5Ym9hcmRFdmVudCB9LiAqL1xuICBwcm90ZWN0ZWQgb25LZXl1cFRhcmdldChldmVudDogS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xuICAgIGlmIChldmVudC5rZXkgPT09IFwiQXJyb3dEb3duXCIgfHwgZXZlbnQua2V5ID09PSBcIkFycm93VXBcIiB8fCBldmVudC5rZXkgPT09IFwiRW50ZXJcIiB8fCBldmVudC5rZXkgPT09IFwiIFwiKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIFRyYXZlcnNlcyB0aGUgb3B0aW9ucyBmcm9tIHRoZSBjdXJyZW50IG9uIHJldHVybmluZyB0aGUgZmlyc3Qgb25lIHdoaWNoJ3MgKipzdHlsZS5kaXNwbGF5KiogaXMgbm90ICoqbm9uZSoqLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZmlyc3QgdmlzaWJsZSBvcHRpb24uICovXG4gIHB1YmxpYyBnZXQgcHJldmlvdXNWaXNpYmxlT3B0aW9uKCk6IEhUTUxFbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3Qgc2hhZG93ID0gREVGSU5FRC50c0NoZWNrPFNoYWRvd1Jvb3Q+KHRoaXMuc2hhZG93Um9vdCk7XG4gICAgbGV0IGN1cnJlbnQgPSBwcmV2aW91c0VsZW1lbnRTaWJsaW5nKHNoYWRvdy5xdWVyeVNlbGVjdG9yKFwiLi0tLVdhWENvZGUuLS1PcHRpb25pbnB1dC4tLU9wdGlvbi4tQ3VycmVudFwiKSk7XG5cbiAgICB3aGlsZSAoY3VycmVudCAhPSBudWxsICYmIGN1cnJlbnQuc3R5bGUuZGlzcGxheSA9PT0gXCJub25lXCIpIHtcbiAgICAgIGN1cnJlbnQgPSBwcmV2aW91c0VsZW1lbnRTaWJsaW5nKGN1cnJlbnQpO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50ID09PSBudWxsIHx8ICFjdXJyZW50Lmhhc0F0dHJpYnV0ZShcInBhcnRcIikpIHtcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSBhbGxCeUNzc0h0bWwoXCIuLS0tV2FYQ29kZS4tLU9wdGlvbmlucHV0Li0tT3B0aW9uXCIsIHNoYWRvdyk7XG5cbiAgICAgIGN1cnJlbnQgPSBvcHRpb25zW29wdGlvbnMubGVuZ3RoIC0gMV0gPz8gbnVsbDtcblxuICAgICAgd2hpbGUgKGN1cnJlbnQgIT09IG51bGwgJiYgY3VycmVudC5zdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIikge1xuICAgICAgICBjdXJyZW50ID0gcHJldmlvdXNFbGVtZW50U2libGluZyhjdXJyZW50KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY3VycmVudDtcbiAgfVxuICAvKipcbiAgICogVHJhdmVyc2VzIHRoZSBvcHRpb25zIGZyb20gdGhlIGN1cnJlbnQgb24gcmV0dXJuaW5nIHRoZSBmaXJzdCBvbmUgd2hpY2gncyAqKnN0eWxlLmRpc3BsYXkqKiBpcyBub3QgKipub25lKiouXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBmaXJzdCB2aXNpYmxlIG9wdGlvbi4gKi9cbiAgcHVibGljIGdldCBuZXh0VmlzaWJsZU9wdGlvbigpOiBIVE1MRWxlbWVudCB8IG51bGwgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IHNoYWRvdyA9IERFRklORUQudHNDaGVjazxTaGFkb3dSb290Pih0aGlzLnNoYWRvd1Jvb3QpO1xuXG4gICAgbGV0IGN1cnJlbnQgPSBuZXh0RWxlbWVudFNpYmxpbmcoc2hhZG93LnF1ZXJ5U2VsZWN0b3IoXCIuLS0tV2FYQ29kZS4tLU9wdGlvbmlucHV0Li0tT3B0aW9uLi1DdXJyZW50XCIpKTtcblxuICAgIHdoaWxlIChjdXJyZW50ICE9PSBudWxsICYmIGN1cnJlbnQuc3R5bGUuZGlzcGxheSA9PT0gXCJub25lXCIpIHtcbiAgICAgIGN1cnJlbnQgPSBuZXh0RWxlbWVudFNpYmxpbmcoY3VycmVudCk7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnQgPT09IG51bGwpIHtcbiAgICAgIGN1cnJlbnQgPSBzaGFkb3cucXVlcnlTZWxlY3RvcihcIi4tLS1XYVhDb2RlLi0tT3B0aW9uaW5wdXQuLS1PcHRpb25cIik7XG5cbiAgICAgIHdoaWxlIChjdXJyZW50ICE9PSBudWxsICYmIGN1cnJlbnQuc3R5bGUuZGlzcGxheSA9PT0gXCJub25lXCIpIHtcbiAgICAgICAgY3VycmVudCA9IG5leHRFbGVtZW50U2libGluZyhjdXJyZW50KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY3VycmVudDtcbiAgfVxuICAvKipcbiAgICogU2VsZWN0cyB0aGUgbmV4dCBvcHRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBldmVudCBUaGUge0BsaW5rIEtleWJvYXJkRXZlbnQgfS5cbiAgICpcbiAgICogQHRocm93cyBBIHtAbGluayBEQkMuSW5mcmluZ2VtZW50IH0gaWYgYSBxdWVyeSBmb3IgKiouLS0tV2FYQ29kZS4tLU9wdGlvbmlucHV0Li0tT3B0aW9uLi1DdXJyZW50KiogZnJvbSB0aGlzXG4gICAqIHtAbGluayBPcHRpb25pbnB1dCB9J3Mge0BsaW5rIEhUTUxEaXZFbGVtZW50LnNoYWRvd1Jvb3QgfSBhY3F1aXJlcyAqKm51bGwqKi4gKi9cbiAgcHVibGljIG9uS2V5ZG93blRhcmdldChldmVudDogS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5lbmFibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5sYXN0S2V5ID0gZXZlbnQua2V5O1xuXG4gICAgaWYgKGV2ZW50LmtleSA9PT0gXCJEZWxldGVcIikge1xuICAgICAgdGhpcy5vbklucHV0VGFyZ2V0KGV2ZW50KTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyAjcmVnaW9uIFByZXZlbnQgdGFyZ2V0IGZyb20gbG9vc2luZyBmb2N1c1xuICAgIGlmIChldmVudC5rZXkgPT09IFwiQXJyb3dEb3duXCIgfHwgZXZlbnQua2V5ID09PSBcIkFycm93VXBcIiB8fCBldmVudC5rZXkgPT09IFwiRW50ZXJcIiB8fCBldmVudC5rZXkgPT09IFwiIFwiKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvbiBQcmV2ZW50IHRhcmdldCBmcm9tIGxvb3NpbmcgZm9jdXNcbiAgICBjb25zdCBzaGFkb3cgPSBERUZJTkVELnRzQ2hlY2s8U2hhZG93Um9vdD4odGhpcy5zaGFkb3dSb290KTtcblxuICAgIHN3aXRjaCAoZXZlbnQua2V5KSB7XG4gICAgICBjYXNlIFwiQXJyb3dVcFwiOlxuICAgICAgY2FzZSBcIkFycm93RG93blwiOlxuICAgICAgICB7XG4gICAgICAgICAgY29uc3QgZm9ybWVyID0gREVGSU5FRC50c0NoZWNrPEhUTUxFbGVtZW50PihcbiAgICAgICAgICAgIElOU1RBTkNFLnRzQ2hlY2s8SFRNTERpdkVsZW1lbnQ+KFxuICAgICAgICAgICAgICBzaGFkb3cucXVlcnlTZWxlY3RvcihcIi4tLS1XYVhDb2RlLi0tT3B0aW9uaW5wdXQuLS1PcHRpb24uLUN1cnJlbnRcIiksXG4gICAgICAgICAgICAgIEhUTUxEaXZFbGVtZW50LFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgY29uc3QgdGFyZ2V0T3B0aW9uID0gREVGSU5FRC50c0NoZWNrPEhUTUxFbGVtZW50PihcbiAgICAgICAgICAgIGV2ZW50LmtleSA9PT0gXCJBcnJvd0Rvd25cIiA/IHRoaXMubmV4dFZpc2libGVPcHRpb24gOiB0aGlzLnByZXZpb3VzVmlzaWJsZU9wdGlvbixcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgdGFyZ2V0T3B0aW9uLmNsYXNzTGlzdC5hZGQoXCItQ3VycmVudFwiKTtcbiAgICAgICAgICBmb3JtZXIuY2xhc3NMaXN0LnJlbW92ZShcIi1DdXJyZW50XCIpO1xuXG4gICAgICAgICAgY29uc3QgY2JPcHRpb24gPSBERUZJTkVELnRzQ2hlY2s8c3RyaW5nPihcbiAgICAgICAgICAgIERFRklORUQudHNDaGVjazxIVE1MRGl2RWxlbWVudD4oXG4gICAgICAgICAgICAgIElOU1RBTkNFLnRzQ2hlY2s8SFRNTERpdkVsZW1lbnQ+KFxuICAgICAgICAgICAgICAgIGJ5Q3NzSHRtbChcIi4tLS1XYVhDb2RlLi0tT3B0aW9uaW5wdXQuLS1PcHRpb24uLUN1cnJlbnRcIiwgc2hhZG93KSxcbiAgICAgICAgICAgICAgICBIVE1MRGl2RWxlbWVudCxcbiAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICkuZGF0YXNldC5jYk9wdGlvbixcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgdGFyZ2V0T3B0aW9uLnNjcm9sbEludG9WaWV3KHtcbiAgICAgICAgICAgIGJlaGF2aW9yOiBcInNtb290aFwiLFxuICAgICAgICAgICAgYmxvY2s6IFwiY2VudGVyXCIsXG4gICAgICAgICAgICBpbmxpbmU6IFwiY2VudGVyXCIsXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBmb3IgKGNvbnN0IGhhbmRsZXIgb2YgdGhpcy5vbk9wdGlvbkNoYW5nZWQpIHtcbiAgICAgICAgICAgIGhhbmRsZXIoY2JPcHRpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIiBcIjpcbiAgICAgICAge1xuICAgICAgICAgIGNvbnN0IGN1cnJlbnRPcHRpb24gPSBERUZJTkVELnRzQ2hlY2s8c3RyaW5nPihcbiAgICAgICAgICAgIERFRklORUQudHNDaGVjazxIVE1MRGl2RWxlbWVudD4oXG4gICAgICAgICAgICAgIElOU1RBTkNFLnRzQ2hlY2s8SFRNTERpdkVsZW1lbnQ+KFxuICAgICAgICAgICAgICAgIGJ5Q3NzSHRtbChcIi4tLS1XYVhDb2RlLi0tT3B0aW9uaW5wdXQuLS1PcHRpb24uLUN1cnJlbnRcIiwgc2hhZG93KSxcbiAgICAgICAgICAgICAgICBIVE1MRGl2RWxlbWVudCxcbiAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICkuZGF0YXNldC5jYk9wdGlvbixcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgREVGSU5FRC50c0NoZWNrPEhUTUxJbnB1dEVsZW1lbnQ+KHRoaXMudGFyZ2V0KS52YWx1ZSA9IHRoaXMuX3RhcmdldE9wdGlvblRyYW5zZm9ybWVyXG4gICAgICAgICAgICA/IHRoaXMuX3RhcmdldE9wdGlvblRyYW5zZm9ybWVyKGN1cnJlbnRPcHRpb24pLnRyaW0oKVxuICAgICAgICAgICAgOiBERUZJTkVELnRzQ2hlY2s8c3RyaW5nPihcbiAgICAgICAgICAgICAgICBERUZJTkVELnRzQ2hlY2s8SFRNTERpdkVsZW1lbnQ+KFxuICAgICAgICAgICAgICAgICAgSU5TVEFOQ0UudHNDaGVjazxIVE1MRGl2RWxlbWVudD4oXG4gICAgICAgICAgICAgICAgICAgIGJ5Q3NzSHRtbChcIi4tLS1XYVhDb2RlLi0tT3B0aW9uaW5wdXQuLS1PcHRpb24uLUN1cnJlbnRcIiwgc2hhZG93KSxcbiAgICAgICAgICAgICAgICAgICAgSFRNTERpdkVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgICkuZGF0YXNldC5jYk9wdGlvbj8udHJpbSgpLFxuICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgZm9yIChjb25zdCBoYW5kbGVyIG9mIHRoaXMub25PcHRpb25TZWxlY3RlZCkge1xuICAgICAgICAgICAgaGFuZGxlcihjdXJyZW50T3B0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIFNldHMge0BsaW5rIE9wdGlvbmlucHV0Lm5ld0ZvY3VzVGFyZ2V0IH0gdG8gKip0cnVlKiogaW4gb3JkZXIgZm9yIG90aGVyIG1ldGhvZHMgdG8gYmUgYWJsZSB0byByZWNvZ25pemUgd2hlblxuICAgKiB0aGUge0BsaW5rIE9wdGlvbmlucHV0LnRhcmdldCB9IHdhcyBmb2N1c2VkIHByaW9yIHRvIHRoZWlyIGludm9jYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBldmVudCBUaGUge0BsaW5rIEV2ZW50IH0uICovXG4gIHByb3RlY3RlZCBvbkZvY3VzVGFyZ2V0KGV2ZW50OiBFdmVudCk6IHZvaWQge1xuICAgIHRoaXMubmV3Rm9jdXNUYXJnZXQgPSB0cnVlO1xuICB9XG4gIC8qKlxuICAgKiBIYW5kbGVzIGlucHV0IG9uIHRoZSB7QGxpbmsgT3B0aW9uaW5wdXQudGFyZ2V0IH0gZmlsdGVyaW5nIHRoZSBhdmFpbGFibGUge0BsaW5rIE9wdGlvbmlucHV0Lm9wdGlvbnMgfSBhbmRcbiAgICogY29tcGxldGluZyB0aGUgb3B0aW9uIHdpdGhpbiB0aGUge0BsaW5rIE9wdGlvbmlucHV0LnRhcmdldCB9IHdoZW4gb25lIG9mIHRoZSB7QGxpbmsgT3B0aW9uaW5wdXQub3B0aW9ucyB9IGdldHNcbiAgICogZGVmaW5pdGUuXG4gICAqXG4gICAqIEBwYXJhbSBldmVudCBUaGUge0BsaW5rIEV2ZW50IH0uICovXG4gIHB1YmxpYyBvbklucHV0VGFyZ2V0KGV2ZW50OiBFdmVudCk6IHZvaWQge1xuICAgIC8vICNyZWdpb24gSWYgdGhlIFt0YXJnZXRdIGp1c3QgcmVjZWl2ZWQgZm9jdXMsIHNob3cgYWxsIGF2YWlsYWJsZSBmdW5jdGlvbmFsaXRpZXNcbiAgICBpZiAodGhpcy5uZXdGb2N1c1RhcmdldCkge1xuICAgICAgdGhpcy5uZXdGb2N1c1RhcmdldCA9IGZhbHNlO1xuXG4gICAgICBmb3IgKGNvbnN0IGhhbmRsZXIgb2YgdGhpcy5vbk9wdGlvbkNoYW5nZWQpIHtcbiAgICAgICAgaGFuZGxlcih0aGlzLm9wdGlvbnNbMF0gPz8gXCJcIik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvbiBJZiB0aGUgW3RhcmdldF0ganVzdCByZWNlaXZlZCBmb2N1cywgc2hvdyBhbGwgYXZhaWxhYmxlIGZ1bmN0aW9uYWxpdGllc1xuICAgIGlmICghKGV2ZW50LnRhcmdldCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpICYmICEoZXZlbnQudGFyZ2V0IGluc3RhbmNlb2YgSFRNTFRleHRBcmVhRWxlbWVudCkpIHtcbiAgICAgIHRocm93IG5ldyBJTlNUQU5DRS5JbmZyaW5nZW1lbnQoXG4gICAgICAgIGBUaGUgZXZlbnQudGFyZ2V0IGhhcyB0byBiZSBlaXRoZXIgb2YgdHlwZSBIVE1MSW5wdXRFbGVtZW50IG9yIEhUTUxUZXh0QXJlYUVsZW1lbnQgYnV0IGlzbid0LiBJdCBpcyBvZiB0eXBlICR7dHlwZW9mIGV2ZW50LnRhcmdldH0uYCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgZXZlbnRUYXJnZXQgPSBldmVudC50YXJnZXQ7XG4gICAgY29uc3QgcmVtYWluaW5nT3B0aW9ucyA9IHRoaXMuZmlsdGVyKGV2ZW50VGFyZ2V0LnZhbHVlLnN1YnN0cmluZygxKSk7XG5cbiAgICBpZiAocmVtYWluaW5nT3B0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMuZW5hYmxlZCA9IGZhbHNlO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgZXZlbnQudHlwZSAhPT0gXCJzZWxlY3Rpb25jaGFuZ2VcIiAmJlxuICAgICAgdGhpcy5sYXN0S2V5ICE9PSBcIkJhY2tzcGFjZVwiICYmXG4gICAgICB0aGlzLmxhc3RLZXkgIT09IFwiRGVsZXRlXCIgJiZcbiAgICAgIHJlbWFpbmluZ09wdGlvbnMubGVuZ3RoID09PSAxXG4gICAgKSB7XG4gICAgICBldmVudFRhcmdldC52YWx1ZSA9IHJlbWFpbmluZ09wdGlvbnNbMF0udHJpbSgpID8/IFwiXCI7XG5cbiAgICAgIGZvciAoY29uc3QgaGFuZGxlciBvZiB0aGlzLm9uT3B0aW9uQ2hhbmdlZCkge1xuICAgICAgICBoYW5kbGVyKHJlbWFpbmluZ09wdGlvbnNbMF0gPz8gXCJcIik7XG4gICAgICB9XG5cbiAgICAgIGZvciAoY29uc3QgaGFuZGxlciBvZiB0aGlzLm9uQXV0b2NvbXBsZXRlKSB7XG4gICAgICAgIGhhbmRsZXIocmVtYWluaW5nT3B0aW9uc1swXSA/PyBcIlwiKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLy8gI2VuZHJlZ2lvbiBLZXlib2FyZCBoYW5kbGluZ1xuICAvLyAjcmVnaW9uIEZpbHRlcmluZ1xuICAvKipcbiAgICogRmlsdGVycyB0aGUgdmlldyBvZiBvcHRpb25zLlxuICAgKlxuICAgKiBAcGFyYW0gZmlsdGVyIFRoZSB7QGxpbmsgc3RyaW5nIH0gdG8gYXBwbHkgYXMgYSBmaWx0ZXIuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSByZW1haW5pbmcgb3B0aW9ucy4gKi9cbiAgcHVibGljIGZpbHRlcihmaWx0ZXI6IHN0cmluZyk6IEFycmF5PHN0cmluZz4ge1xuICAgIGNvbnN0IGNsZWFuRmlsdGVyID0gZmlsdGVyLnJlcGxhY2UoXCI8YnI+XCIsIFwiXCIpO1xuICAgIGNvbnN0IGhpdHMgPSBuZXcgQXJyYXk8c3RyaW5nPigpO1xuICAgIGNvbnN0IG9wdGlvbnMgPSBhbGxCeUNzc0FzKFwiLi0tLVdhWENvZGUuLS1PcHRpb25pbnB1dC4tLU9wdGlvblwiLCBIVE1MRGl2RWxlbWVudCwgdGhpcy5zaGFkb3dSb290ID8/IHVuZGVmaW5lZCk7XG5cbiAgICBsZXQgZmlyc3RWaXNpYmxlOiBIVE1MRGl2RWxlbWVudCB8IHVuZGVmaW5lZDtcblxuICAgIGZvciAoY29uc3Qgb3B0aW9uIG9mIG9wdGlvbnMpIHtcbiAgICAgIGNvbnN0IGNiT3B0aW9uID0gb3B0aW9uLmRhdGFzZXQuY2JPcHRpb24gPz8gXCJcIjtcbiAgICAgIGlmIChjYk9wdGlvbi50b0xvd2VyQ2FzZSgpLmluZGV4T2YoY2xlYW5GaWx0ZXIudG9Mb3dlckNhc2UoKSkgPT09IC0xKSB7XG4gICAgICAgIG9wdGlvbi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZmlyc3RWaXNpYmxlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBmaXJzdFZpc2libGUgPSBvcHRpb247XG4gICAgICAgIH1cbiAgICAgICAgaGl0cy5wdXNoKGNiT3B0aW9uKTtcblxuICAgICAgICBvcHRpb24uc3R5bGUuZGlzcGxheSA9IFwiZmxleFwiO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBwYXJ0ID0gYnlDc3NBcygnWyBwYXJ0ID0gXCJPcHRpb25pbnB1dFwiXScsIEhUTUxJbnB1dEVsZW1lbnQsIG9wdGlvbik7XG5cbiAgICAgIGlmIChwYXJ0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcGFydC5jaGVja2VkID0gREVGSU5FRC50c0NoZWNrPEhUTUxJbnB1dEVsZW1lbnQ+KHRoaXMudGFyZ2V0KS52YWx1ZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoY2JPcHRpb24pICE9PSAtMTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaGl0cy5sZW5ndGggIT09IDApIHtcbiAgICAgIGZpcnN0VmlzaWJsZT8uY2xpY2soKTtcblxuICAgICAgY29uc3Qgc2hhZG93ID0gREVGSU5FRC50c0NoZWNrPFNoYWRvd1Jvb3Q+KHRoaXMuc2hhZG93Um9vdCk7XG4gICAgICBzaGFkb3cucXVlcnlTZWxlY3RvcihcIi4tLS1XYVhDb2RlLi0tT3B0aW9uaW5wdXQuLS1PcHRpb24uLUN1cnJlbnRcIik/LmNsYXNzTGlzdC5yZW1vdmUoXCItQ3VycmVudFwiKTtcbiAgICAgIERFRklORUQudHNDaGVjazxIVE1MRWxlbWVudD4oXG4gICAgICAgIElOU1RBTkNFLnRzQ2hlY2s8SFRNTERpdkVsZW1lbnQ+KFxuICAgICAgICAgIHNoYWRvdy5xdWVyeVNlbGVjdG9yKGAuLS0tV2FYQ29kZS4tLU9wdGlvbmlucHV0Li0tT3B0aW9uWyBkYXRhLWNiLW9wdGlvbiA9IFwiJHtoaXRzWzBdfVwiXWApLFxuICAgICAgICAgIEhUTUxEaXZFbGVtZW50LFxuICAgICAgICApLFxuICAgICAgKS5jbGFzc0xpc3QuYWRkKFwiLUN1cnJlbnRcIik7XG4gICAgfVxuICAgIHJldHVybiBoaXRzO1xuICB9XG4gIC8vICNlbmRyZWdpb24gRmlsdGVyaW5nXG59XG4vLyAjcmVnaW9uIFRvb2xzXG4vKipcbiAqIEdldHMgdGhlIHtAbGluayBIVE1MRWxlbWVudC5uZXh0RWxlbWVudFNpYmxpbmcgbmV4dCBlbGVtZW50IHNpYmxpbmd9IG9mIHRoZSBnaXZlbiBlbGVtZW50IHdoZW4gaXQgaXMgYW4gSFRNTEVsZW1lbnQuXG4gKiBJZiBub3QsIHJldHVybnMgbnVsbC5cbiAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIGdldCB0aGUgbmV4dCBzaWJsaW5nIG9mLlxuICogQHJldHVybnMgVGhlIG5leHQgZWxlbWVudCBzaWJsaW5nIGlmIGl0IGlzIGFuIEhUTUxFbGVtZW50LCBvdGhlcndpc2UgbnVsbC5cbiAqL1xuZnVuY3Rpb24gbmV4dEVsZW1lbnRTaWJsaW5nKGVsZW1lbnQ6IEVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkKTogSFRNTEVsZW1lbnQgfCBudWxsIHtcbiAgY29uc3Qgc2libGluZyA9IGVsZW1lbnQ/Lm5leHRFbGVtZW50U2libGluZztcblxuICByZXR1cm4gc2libGluZyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ID8gc2libGluZyA6IG51bGw7XG59XG5cbi8qKlxuICogR2V0cyB0aGUge0BsaW5rIEhUTUxFbGVtZW50LnByZXZpb3VzRWxlbWVudFNpYmxpbmcgcHJldmlvdXMgZWxlbWVudCBzaWJsaW5nfSBvZiB0aGUgZ2l2ZW4gZWxlbWVudCB3aGVuIGl0IGlzIGFuIEhUTUxFbGVtZW50LlxuICogSWYgbm90LCByZXR1cm5zIG51bGwuXG4gKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBnZXQgdGhlIHByZXZpb3VzIHNpYmxpbmcgb2YuXG4gKiBAcmV0dXJucyBUaGUgcHJldmlvdXMgZWxlbWVudCBzaWJsaW5nIGlmIGl0IGlzIGFuIEhUTUxFbGVtZW50LCBvdGhlcndpc2UgbnVsbC5cbiAqL1xuZnVuY3Rpb24gcHJldmlvdXNFbGVtZW50U2libGluZyhlbGVtZW50OiBFbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZCk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG4gIGNvbnN0IHNpYmxpbmcgPSBlbGVtZW50Py5wcmV2aW91c0VsZW1lbnRTaWJsaW5nO1xuICByZXR1cm4gc2libGluZyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ID8gc2libGluZyA6IG51bGw7XG59XG4vLyAjZW5kcmVnaW9uIFRvb2xzXG4iLCAiLy8gI3JlZ2lvbiBJbXBvcnRzXG4vLyAjcmVnaW9uIFhEQkNcbmltcG9ydCB7IERCQyB9IGZyb20gXCJ4ZGJjL3NyYy9EQkNcIjtcbmltcG9ydCB7IE9SIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9PUlwiO1xuaW1wb3J0IHsgRVEgfSBmcm9tIFwieGRiYy9zcmMvREJDL0VRXCI7XG5pbXBvcnQgeyBJRiB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvSUZcIjtcbmltcG9ydCB7IFJFR0VYIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9SRUdFWFwiO1xuaW1wb3J0IHsgSU5TVEFOQ0UgfSBmcm9tIFwieGRiYy9zcmMvREJDL0lOU1RBTkNFXCI7XG5pbXBvcnQgeyBERUZJTkVEIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9ERUZJTkVEXCI7XG5pbXBvcnQgeyBIYXNBdHRyaWJ1dGUgfSBmcm9tIFwieGRiYy9zcmMvREJDL0hhc0F0dHJpYnV0ZVwiO1xuLy8gI2VuZHJlZ2lvbiBYREJDXG4vLyAjcmVnaW9uIFhJTUFcbmltcG9ydCB7IGFsbEJ5Q3NzQXMsIGFsbEJ5Q3NzSHRtbCwgYnlDc3NBcywgYnlDc3NIdG1sIH0gZnJvbSBcIkBkZS14aW1hL3hpbWEtY29tbW9uLWpzLWRvbVwiO1xuLy8gI2VuZHJlZ2lvbiBYSU1BXG4vLyAjZW5kcmVnaW9uIEltcG9ydHNcbi8qKlxuICogQSB7QGxpbmsgSFRNTERpdkVsZW1lbnQgfSB0aGF0IG1hbmFnZXMgdGhlICoqcyoqZXBhcmF0ZWQgKip2KiphbHVlcyB3aXRoaW4gYW4ge0BsaW5rIEhUTUxJbnB1dEVsZW1lbnQgfVxuICogb2YgdHlwZSAqKnRleHQqKi5cbiAqIEl0IHJlZmxlY3RzIHRoZSBsaXN0IG9mIHZhbHVlcyB3aXRoaW4gdGhlIHtAbGluayBIVE1MSW5wdXRFbGVtZW50IH0ge0BsaW5rIFNWTWFuYWdlci50YXJnZXQgfWVkIHVzaW5nIGEgY29sbGVjdGlvblxuICogb2Yge0BsaW5rIEhUTUxJbnB1dEVsZW1lbnQgfXMgb2YgdHlwZSAqKmNoZWNrYm94KiogYW5kIHtAbGluayBIVE1MUGFyYWdyYXBoRWxlbWVudCB9IGNvbnRhaW5lZCBpblxuICoge0BsaW5rIEhUTUxEaXZFbGVtZW50IH1zLlxuICogQ2hlY2tpbmcgdGhlIGJveGVzIG9yIG5hdmlnYXRpbmcgdGhyb3VnaCB0aGUgY29sbGVjdGlvbiB3aXRoIHRoZSAqKnVwKiogYW5kICoqZG93bioqIGFycm93IGtleXMgYW5kIHVzaW5nIHRoZVxuICogKiplbnRlcioqIG9yICoqZGVsZXRlKioga2V5cywgdGhlIHtAbGluayBTVk1hbmFnZXIudGFyZ2V0IH1lZCdzIGNvbnRlbnQgY2FuIGJlIG1vZGlmaWVkLiAqL1xuZXhwb3J0IGNsYXNzIFNWTWFuYWdlciBleHRlbmRzIEhUTUxEaXZFbGVtZW50IHtcbiAgLy8gI3JlZ2lvbiBFdmVudHNcbiAgLyoqIEhvbGRzIGFsbCBldmVudCBsaXN0ZW5lciB0byBub3RpZnkgd2hlbmV2ZXIgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBvcHRpb24gY2hhbmdlcy4gKi9cbiAgcHVibGljIHJlYWRvbmx5IG9uT3B0aW9uQ2hhbmdlZDogQXJyYXk8KG5ld09wdGlvbjogc3RyaW5nKSA9PiB2b2lkPiA9IG5ldyBBcnJheTwobmV3T3B0aW9uOiBzdHJpbmcpID0+IHZvaWQ+KCk7XG4gIC8qKiBIb2xkcyBhbGwgZXZlbnQgbGlzdGVuZXIgdG8gbm90aWZ5IHdoZW5ldmVyIGFuIGF1dG9jb21wbGV0ZSBvY2N1cnJlZC4gKi9cbiAgcHVibGljIHJlYWRvbmx5IG9uQXV0b2NvbXBsZXRlOiBBcnJheTwobmV3T3B0aW9uOiBzdHJpbmcpID0+IHZvaWQ+ID0gbmV3IEFycmF5PChuZXdPcHRpb246IHN0cmluZykgPT4gdm9pZD4oKTtcbiAgLyoqIEhvbGRzIGFsbCBldmVudCBsaXN0ZW5lciB0byBub3RpZnkgd2hlbmV2ZXIgYW4gb3B0aW9uIHdhcyBzZWxlY3RlZC4gKi9cbiAgcHVibGljIHJlYWRvbmx5IG9uT3B0aW9uU2VsZWN0ZWQ6IEFycmF5PChuZXdPcHRpb246IHN0cmluZykgPT4gdm9pZD4gPSBuZXcgQXJyYXk8KG5ld09wdGlvbjogc3RyaW5nKSA9PiB2b2lkPigpO1xuICAvLyAjZW5kcmVnaW9uIEV2ZW50c1xuICAvKiogSG9sZHMgdGhlIHdlYi1jb21wb25lbnQgZGVmaW5pdGlvbiBvZiBvYnNlcnZlZCBhdHRyaWJ1dGVzLiAqL1xuICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpOiBBcnJheTxzdHJpbmc+IHtcbiAgICByZXR1cm4gW1wib3B0aW9uc1wiLCBcInNlcGFyYXRvclwiLCBcImNzc0VuYWJsZWRcIiwgXCJjc3NEaXNhYmxlZFwiLCBcImVuYWJsZWRcIl07XG4gIH1cbiAgLy8gI3JlZ2lvbiBPcHRpb25zXG4gIC8qKiBIb2xkcyB0aGUge0BsaW5rIHN0cmluZyB9cyB0aGF0J3JlIHRoZSBhY3R1YWwgb3B0aW9ucy4gKi9cbiAgcHVibGljIG9wdGlvbnM6IEFycmF5PHN0cmluZz47XG4gIC8qKiBIb2xkcyB0aGUge0BsaW5rIHN0cmluZyB9IHRoZSB7QGxpbmsgU1ZNYW5hZ2VyLnRhcmdldCB9ZWQge0BsaW5rIEhUTUxJbnB1dEVsZW1lbnQgfSdzIGNvbnRlbnQgc2hhbGxcbiAgICogYmUgc3BsaXQgaW50by4gKi9cbiAgcHJvdGVjdGVkIHNlcGFyYXRvcjogc3RyaW5nO1xuICAvKiogU3RvcmVzIGEgKCB0b1RyYW5zZm9ybSA6IHN0cmluZyApID0+IHN0cmluZyB0byB1c2UgYmVmb3JlIGRpc3BsYXlpbmdcbiAgICogdGhlIHtAbGluayB0aGlzLm9wdGlvbnMgfS4gKi9cbiAgcHJvdGVjdGVkIF9vcHRpb25UcmFuc2Zvcm1lcjogKCh0b1RyYW5zZm9ybTogc3RyaW5nKSA9PiBzdHJpbmcpIHwgdW5kZWZpbmVkO1xuICAvKipcbiAgICogU2V0cyB0aGUge0BsaW5rIFNWTWFuYWdlci5fdHJhbnNmb3JtZXIgfS5cbiAgICpcbiAgICogQHBhcmFtIHRvU2V0IFRoZSB7QGxpbmsgU1ZNYW5hZ2VyLl90cmFuc2Zvcm1lciB9LiAqL1xuICBwdWJsaWMgc2V0IG9wdGlvblRyYW5zZm9ybWVyKHRvU2V0OiAoKHRvVHJhbnNmb3JtOiBzdHJpbmcpID0+IHN0cmluZykgfCB1bmRlZmluZWQpIHtcbiAgICB0aGlzLl9vcHRpb25UcmFuc2Zvcm1lciA9IHRvU2V0O1xuXG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuICAvKiogU2V0cyB0aGUgVVJMIHRvIGFuIGltYWdlIHRoYXQgc2hhbGwgYmUgdXNlZCBhcyB0aGUgQ1NTLUJhY2tncm91bmQtSW1hZ2UgZm9yIHRoZSB7QGxpbmsgU1ZtYW5hZ2VyLm9wdGlvbnMgfSBwYW5lbC4gKi9cbiAgcHVibGljIHNldCBiYWNrZ3JvdW5kSW1hZ2UodG9TZXQ6IHN0cmluZykge1xuICAgIHRoaXMuY3NzRW5hYmxlZCA9IGBiYWNrZ3JvdW5kLWNvbG9yIDogI0ZGRkZGRkREIDsgYmFja2dyb3VuZC1zaXplIDogY29udGFpbiA7IGJhY2tncm91bmQtcG9zaXRpb24gOiBjZW50ZXIgOyBiYWNrZ3JvdW5kLXJlcGVhdCA6IG5vLXJlcGVhdCA7IGJhY2tncm91bmQtYmxlbmQtbW9kZSA6IG92ZXJsYXkgOyBkaXNwbGF5IDogYmxvY2sgOyBiYWNrZ3JvdW5kLWltYWdlIDogdXJsKFwiJHt0b1NldH1cIiksIGxpbmVhci1ncmFkaWVudCggMTMwZGVnLHJnYmEoIDQyLCAxMjMsIDE1NSwgMSApIDAlLCByZ2JhKCAyMTYsIDIxNiwgMjM1LCAxICkgNTAlLCByZ2JhKCA0MiwgMTIzLCAxNTUsIDEgKSAxMDAlIClgO1xuICB9XG4gIC8vICNlbmRyZWdpb24gT3B0aW9uc1xuICAvKipcbiAgICogR2V0cyB0aGUgbmFtZSBvZiB0aGUgY3VycmVudGx5IHNldCBvcHRpb24uXG4gICAqXG4gICAqIEByZXR1cm4gVGhlIG5hbWUgb2YgdGhlIGN1cnJlbnRseSBzZXQgb3B0aW9uLiAqL1xuICBwdWJsaWMgZ2V0IGN1cnJlbnRPcHRpb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gKFxuICAgICAgYnlDc3NIdG1sKFwiLi0tLVdhWENvZGUuLS1TVk1hbmFnZXIuLS1PcHRpb24uLUN1cnJlbnRcIiwgdGhpcy5zaGFkb3dSb290ID8/IHVuZGVmaW5lZCk/LmRhdGFzZXQuY2JPcHRpb24ucmVwbGFjZShcbiAgICAgICAgXCIuanNcIixcbiAgICAgICAgXCJcIixcbiAgICAgICkgPz8gXCJcIlxuICAgICk7XG4gIH1cbiAgLyoqIFN0b3JlcyB0aGUgbGFzdCB7QGxpbmsgS2V5Ym9hcmRFdmVudCB9J3MgKiprZXkqKiB0aGF0IHBhc3NlZCB0aHJvdWdoIHtAbGluayBTVk1hbmFnZXIub25LZXlkb3duVGFyZ2V0IH0uICovXG4gIHByb3RlY3RlZCBsYXN0S2V5OiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIC8qKiBIb2xkcyB0aGUgQ1NTIHRvIGFwcGx5IHRvIHRoZSB7QGxpbmsgU1ZNYW5hZ2VyLmNPcHRpb25zIH0gd2hlbiB0aGlzIHtAbGluayBTVk1hbmFnZXIgfSBpc1xuICAgKiB0byBiZSB7QGxpbmsgU1ZNYW5hZ2VyLnNob3cgfW4uICovXG4gIHByb3RlY3RlZCBjc3NFbmFibGVkOiBzdHJpbmc7XG4gIC8qKiBIb2xkcyB0aGUgQ1NTIHRvIGFwcGx5IHRvIHRoZSB7QGxpbmsgU1ZNYW5hZ2VyLmNPcHRpb25zIH0gd2hlbiB0aGlzIHtAbGluayBTVk1hbmFnZXIgfSBpc1xuICAgKiBzaGFsbCB7QGxpbmsgU1ZNYW5hZ2VyLmhpZGUgfS4gKi9cbiAgcHJvdGVjdGVkIGNzc0Rpc2FibGVkOiBzdHJpbmc7XG4gIC8qKiBHZXRzIGEge0BsaW5rIGJvb2xlYW4gfSBzdGF0aW5nIHdoZXRoZXIgdGhlIHtAbGluayBTVk1hbmFnZXIuY3NzRW5hYmxlZCB9IG9yIHtAbGluayBTVk1hbmFnZXIuY3NzRGlzYWJsZWQgfSBpcyBiZWluZyBhcHBsaWVkIG9uIHRoaXNcbiAgICoge0BsaW5rIEhUTUxEaXZFbGVtZW50IH0uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoaXMge0BsaW5rIFNWTWFuYWdlciB9ICdzIFwiZW5hYmxlZFwiLWF0dHJpYnV0ZSB2YWx1ZS4gKi9cbiAgQEhhc0F0dHJpYnV0ZS5jSU5WQVJJQU5UKFwiZW5hYmxlZFwiKVxuICBwdWJsaWMgZ2V0IGVuYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0QXR0cmlidXRlKFwiZW5hYmxlZFwiKT8udG9Mb3dlckNhc2UoKSA9PT0gXCJ0cnVlXCI7XG4gIH1cbiAgLyoqXG4gICAqIFNldHMgdGhpcyB7QGxpbmsgU1ZNYW5hZ2VyIH0gJ3MgXCJlbmFibGVkXCItYXR0cmlidXRlIHZhbHVlXG4gICAqXG4gICAqIEBwYXJhbSB0b1NldCBUaGUgdmFsdWUgVGhpcyB7QGxpbmsgU1ZNYW5hZ2VyIH0gJ3MgXCJlbmFibGVkXCItYXR0cmlidXRlIHNoYWxsIGJlIHNldCB0by4gKi9cbiAgcHVibGljIHNldCBlbmFibGVkKHRvU2V0OiBib29sZWFuKSB7XG4gICAgdGhpcy5zZXRBdHRyaWJ1dGUoXCJlbmFibGVkXCIsIHRvU2V0ID8gXCJ0cnVlXCIgOiBcImZhbHNlXCIpO1xuICB9XG4gIC8vICNyZWdpb24gU3R5bGluZ1xuICAvKiogSG9sZHMgdGhlIHN0eWxlc2hlZXQgdGhhdCB2YXJpZXMgZGVwZW5kaW5nIG9uIHdoZXRoZXIgdGhpcyB7QGxpbmsgU1ZNYW5hZ2VyIH0gaXMgY3VycmVudGx5XG4gICAqIHtAbGluayBTVk1hbmFnZXIuZW5hYmxlZCB9IG9yIHdoZW4ge0BsaW5rIFNWTWFuYWdlci5jc3NFbmFibGVkIH0gb3Ige0BsaW5rIFNWTWFuYWdlci5jc3NEaXNhYmxlZCB9IGNoYW5nZS4gKi9cbiAgcHJvdGVjdGVkIHZhcmlhYmxlU3R5bGU6IEhUTUxTdHlsZUVsZW1lbnQ7XG4gIC8qKiBIb2xkcyB0aGUgZmFkZSBpbiBhbmltYXRpb24gZm9yIHRoaXMge0BsaW5rIFNWTWFuYWdlciB9LiAqL1xuICBwdWJsaWMgY3NzRmFkZUlOOiBzdHJpbmcgPSBgXG4gICAgQGtleWZyYW1lcyBrZkZhZGVJTl9TVk1hbmFnZXIge1xuICAgICAgICAwJSAgICB7IHNjYWxlIDogMS4xIDsgb3BhY2l0eSA6IDAgO31cbiAgICAgICAgMTAwJSAgeyBzY2FsZSA6IDEgOyBvcGFjaXR5IDogLjkgO319XG4gICAgZGl2Li0tLVdhWENvZGUuLS1TVk1hbmFnZXIgeyBhbmltYXRpb24gOiBrZkZhZGVJTl9TVk1hbmFnZXIgLjI1cyBlYXNlLWluIGZvcndhcmRzIDt9YDtcbiAgLy8gI2VuZHJlZ2lvbiBTdHlsaW5nXG4gIC8vICNyZWdpb24gVGFyZ2V0aW5nIGlucHV0LWVsZW1lbnRzXG4gIC8qKiBTdG9yZXMgdGhlIHtAbGluayBIVE1MSW5wdXRFbGVtZW50IH0gdGhhdCBpcyBjdXJyZW50bHkgdGFyZ2V0ZWQuKi9cbiAgcHJvdGVjdGVkIF90YXJnZXQ6IEhUTUxJbnB1dEVsZW1lbnQgfCB1bmRlZmluZWQ7XG4gIC8qKlxuICAgKiBHZXRzIHRoZSB7QGxpbmsgU1ZNYW5hZ2VyLl90YXJnZXQgfS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHtAbGluayBTVk1hbmFnZXIuX3RhcmdldCB9LiAqL1xuICBwdWJsaWMgZ2V0IHRhcmdldCgpOiBIVE1MSW5wdXRFbGVtZW50IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fdGFyZ2V0O1xuICB9XG4gIC8qKlxuICAgKiBTZXRzIHRoZSB7QGxpbmsgU1ZNYW5hZ2VyLl90YXJnZXQgfSwgdXBkYXRlcyB0aGUgY2hlY2tib3hlcyBhY2NvcmRpbmcgdG8gdGhlIGZ1bmN0aW9uYWxpdGllcyBtZW50aW9uZWQgaW5cbiAgICogdGhlIHtAbGluayBTVk1hbmFnZXIudGFyZ2V0IH0gYW5kIGJpbmQge0BsaW5rIFNWTWFuYWdlci5vbktleXVwVGFyZ2V0IH0gJiB7QGxpbmsgU1ZNYW5hZ2VyLm9uS2V5ZG93blRhcmdldCB9IHRvXG4gICAqIHRoZSB7QGxpbmsgU1ZNYW5hZ2VyLnRhcmdldCB9ICoqdG9TZXQqKiAqKmtleXVwKiogJiAqKmtleWRvd24qKiBldmVudHMgYWxzbyByZW1vdmluZyB0aGUgaGFuZGxlciBmcm9tIHRoZVxuICAgKiBmb3JtZXIge0BsaW5rIFNWTWFuYWdlci50YXJnZXQgfS5cbiAgICpcbiAgICogQHBhcmFtIHRvU2V0IFRoZSB7QGxpbmsgU1ZNYW5hZ2VyLl90YXJnZXQgfS5cbiAgICpcbiAgICogQHRocm93cyAgQSB7QGxpbmsgREJDLkluZnJpbmdlbWVudCB9IGlmIHRoaXMge0BsaW5rIFNWTWFuYWdlciB9J3Mge0BsaW5rIEhUTUxEaXZFbGVtZW50LnNoYWRvd1Jvb3QgfSBpcyBub3RcbiAgICogICAgICAgICAgZGVmaW5lZCBvciBhIHF1ZXJ5IG9mICoqLi0tLVdhWENvZGUuLS1TVk1hbmFnZXIuLS1PcHRpb24uLUN1cnJlbnQqKiBvclxuICAgKiAgICAgICAgICAqKi4tLS1XYVhDb2RlLi0tU1ZNYW5hZ2VyLi0tT3B0aW9uKiogZG9lcyBub3QgcmV0dXJuIGFuIHtAbGluayBIVE1MRGl2RWxlbWVudCB9LiovXG4gIHB1YmxpYyBzZXQgdGFyZ2V0KHRvU2V0OiBIVE1MSW5wdXRFbGVtZW50KSB7XG4gICAgaWYgKHRoaXMuX3RhcmdldCAmJiB0aGlzLl90YXJnZXQgIT09IHRvU2V0KSB7XG4gICAgICB0aGlzLl90YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImZvY3VzXCIsIHRoaXMub25Gb2N1c1RhcmdldCk7XG4gICAgICB0aGlzLl90YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIHRoaXMub25LZXl1cFRhcmdldCk7XG4gICAgICB0aGlzLl90YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5vbktleWRvd25UYXJnZXQpO1xuICAgICAgdGhpcy5fdGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCB0aGlzLm9uSW5wdXRUYXJnZXQpO1xuICAgICAgdGhpcy5fdGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJzZWxlY3Rpb25jaGFuZ2VcIiwgdGhpcy5vbklucHV0VGFyZ2V0KTtcbiAgICB9XG5cbiAgICB0aGlzLl90YXJnZXQgPSB0b1NldDtcblxuICAgIHRoaXMuX3RhcmdldC5hZGRFdmVudExpc3RlbmVyKFwiZm9jdXNcIiwgdGhpcy5vbkZvY3VzVGFyZ2V0LmJpbmQodGhpcykpO1xuICAgIHRoaXMuX3RhcmdldC5hZGRFdmVudExpc3RlbmVyKFwia2V5dXBcIiwgdGhpcy5vbktleXVwVGFyZ2V0LmJpbmQodGhpcykpO1xuICAgIHRoaXMuX3RhcmdldC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLm9uS2V5ZG93blRhcmdldC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLl90YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIHRoaXMub25JbnB1dFRhcmdldC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLl90YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihcInNlbGVjdGlvbmNoYW5nZVwiLCB0aGlzLm9uSW5wdXRUYXJnZXQuYmluZCh0aGlzKSk7XG5cbiAgICBpZiAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA9PT0gdGhpcy5fdGFyZ2V0KSB7XG4gICAgICB0aGlzLm9uRm9jdXNUYXJnZXQobmV3IEV2ZW50KFwiZm9jdXNcIikpO1xuICAgIH1cblxuICAgIGNvbnN0IHNoYWRvdyA9IERFRklORUQudHNDaGVjazxTaGFkb3dSb290Pih0aGlzLnNoYWRvd1Jvb3QpO1xuICAgIC8vIENoZWNrIGFsbCBvcHRpb25zIHRoYXQncmUgbWVudGlvbmVkIGluIHRoZSBuZXcge0BsaW5rIFNWTWFuYWdlci50YXJnZXQgfS5cbiAgICBmb3IgKGNvbnN0IGNoZWNrYm94IG9mIHNoYWRvdy5xdWVyeVNlbGVjdG9yQWxsKFwiaW5wdXRcIikpIHtcbiAgICAgIGNoZWNrYm94LmNoZWNrZWQgPVxuICAgICAgICB0aGlzLl90YXJnZXQudmFsdWUudG9Mb3dlckNhc2UoKS5pbmRleE9mKGNoZWNrYm94LnBhcmVudEVsZW1lbnQ/LmRhdGFzZXQuY2JPcHRpb24/LnRvTG93ZXJDYXNlKCkgPz8gXCJcIikgIT09IC0xO1xuICAgIH1cbiAgICAvLyBSZWVuYWJsZSBhbGwgZGlzYWJsZWQgb3B0aW9ucy5cbiAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBhbGxCeUNzc0h0bWwoXCIuLS0tV2FYQ29kZS4tLVNWTWFuYWdlci4tLU9wdGlvblwiLCBzaGFkb3cpKSB7XG4gICAgICBvcHRpb24uc3R5bGUuZGlzcGxheSA9IFwiZmxleFwiO1xuICAgIH1cbiAgICAvLyAjcmVnaW9uIFNlbGVjdCBmaXJzdCBvcHRpb24gYXMgdGhlIGN1cnJlbnQgb25lXG4gICAgY29uc3QgZm9ybWVyID0gREVGSU5FRC50c0NoZWNrPEhUTUxEaXZFbGVtZW50PihcbiAgICAgIElOU1RBTkNFLnRzQ2hlY2s8SFRNTERpdkVsZW1lbnQ+KFxuICAgICAgICBzaGFkb3cucXVlcnlTZWxlY3RvcihcIi4tLS1XYVhDb2RlLi0tU1ZNYW5hZ2VyLi0tT3B0aW9uLi1DdXJyZW50XCIpLFxuICAgICAgICBIVE1MRGl2RWxlbWVudCxcbiAgICAgICksXG4gICAgKTtcblxuICAgIGNvbnN0IG9wdGlvbkVsZW1lbnRzID0gc2hhZG93LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuLS0tV2FYQ29kZS4tLVNWTWFuYWdlci4tLU9wdGlvblwiKTtcblxuICAgIGlmIChvcHRpb25FbGVtZW50c1swXSAhPT0gZm9ybWVyKSB7XG4gICAgICBJTlNUQU5DRS50c0NoZWNrPEhUTUxEaXZFbGVtZW50PihcbiAgICAgICAgc2hhZG93LnF1ZXJ5U2VsZWN0b3IoXCIuLS0tV2FYQ29kZS4tLVNWTWFuYWdlci4tLU9wdGlvblwiKSxcbiAgICAgICAgSFRNTERpdkVsZW1lbnQsXG4gICAgICApLmNsYXNzTGlzdC5hZGQoXCItQ3VycmVudFwiKTtcblxuICAgICAgZm9ybWVyLmNsYXNzTGlzdC5yZW1vdmUoXCItQ3VycmVudFwiKTtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvbiBTZWxlY3QgZmlyc3Qgb3B0aW9uIGFzIHRoZSBjdXJyZW50IG9uZVxuICB9XG4gIC8vICNlbmRyZWdpb24gVGFyZ2V0aW5nIGlucHV0LWVsZW1lbnRzXG4gIC8vICNyZWdpb24gSW5mb1xuICAvKiogU3RvcmVzIHdoZXRoZXIgdGhlIGN1cnNvciBpcyBjdXJyZW50bHkgd2l0aGluIHRoaXMge0BsaW5rIFNWTWFuYWdlciB9LiovXG4gIHByb3RlY3RlZCBfY3Vyc29ySW46IGJvb2xlYW4gPSBmYWxzZTtcbiAgLyoqIFN0b3JlcyB3aGV0aGVyIHRoZSB7QGxpbmsgU1ZNYW5hZ2VyLnRhcmdldCB9IGlzIGZvY3VzZWQgZm9yIHRoZSBmaXJzdCB0aW1lLiAqL1xuICBwcm90ZWN0ZWQgbmV3Rm9jdXNUYXJnZXQgPSBmYWxzZTtcbiAgLyoqXG4gICAqIEdldHMge0BsaW5rIFNWTWFuYWdlci5fY3Vyc29ySW4gfS5cbiAgICpcbiAgICogQHJldHVybnMge0BsaW5rIFNWTWFuYWdlci5fY3Vyc29ySW4gfS4gKi9cbiAgcHVibGljIGdldCBjdXJzb3JJbigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fY3Vyc29ySW47XG4gIH1cbiAgLy8gI2VuZHJlZ2lvbiBJbmZvXG4gIC8qKlxuICAgKiBDcmVhdGVzIHRoaXMge0BsaW5rIEhUTUxEaXZFbGVtZW50IH0gYnkgbWFwcGluZyBpdCdzIHByb3BlcnRpZXMgdG8gaXQncyBhdHRyaWJ1dGVzIGFuZCBpbmplY3RpbmcgYVxuICAgKiBuZWVkZWQgc3R5bGVzaGVldC4gKi9cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICAvLyAjcmVnaW9uIFByZXZlbnQgYW55dGhpbmcgZnJvbSBsb29zaW5nIGZvY3VzIHdoZW4gdGhlIFNWTWFuYWdlciBpcyBjbGlja2VkLlxuICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0pO1xuICAgIC8vICNlbmRyZWdpb24gUHJldmVudCBhbnl0aGluZyBmcm9tIGxvb3NpbmcgZm9jdXMgd2hlbiB0aGUgU1ZNYW5hZ2VyIGlzIGNsaWNrZWQuXG4gICAgLy8gI3JlZ2lvbiBQUkVDT05ESVRJT05TXG4gICAgbmV3IEhhc0F0dHJpYnV0ZShcIm9wdGlvbnNcIikuY2hlY2sodGhpcyk7XG4gICAgLy8gI2VuZHJlZ2lvbiBQUkVDT05ESVRJT05TXG4gICAgLy8gI3JlZ2lvbiBQcm9wZXJ0eSBtYXBwaW5nXG4gICAgdGhpcy5zZXBhcmF0b3IgPSB0aGlzLmdldEF0dHJpYnV0ZShcInNlcGFyYXRvclwiKSA/PyBcIixcIjtcbiAgICB0aGlzLm9wdGlvbnMgPSB0aGlzLmdldEF0dHJpYnV0ZShcIm9wdGlvbnNcIik/LnNwbGl0KHRoaXMuc2VwYXJhdG9yKSA/PyBbXTtcbiAgICB0aGlzLmNzc0VuYWJsZWQgPVxuICAgICAgdGhpcy5nZXRBdHRyaWJ1dGUoXCJjc3NFbmFibGVkXCIpID8/XG4gICAgICBcImRpc3BsYXkgOiBibG9jayA7IGJhY2tncm91bmQtaW1hZ2UgOiBsaW5lYXItZ3JhZGllbnQoIDEzMGRlZyxyZ2JhKCA0MiwgMTIzLCAxNTUsIDEgKSAwJSwgcmdiYSggMjE2LCAyMTYsIDIzNSwgMSApIDUwJSwgcmdiYSggNDIsIDEyMywgMTU1LCAxICkgMTAwJSApXCI7XG4gICAgdGhpcy5jc3NEaXNhYmxlZCA9IHRoaXMuZ2V0QXR0cmlidXRlKFwiY3NzRGlzYWJsZWRcIikgPz8gXCJkaXNwbGF5IDogbm9uZSA7XCI7XG4gICAgdGhpcy5lbmFibGVkID0gdGhpcy5nZXRBdHRyaWJ1dGUoXCJlbmFibGVkXCIpPy50b0xvd2VyQ2FzZSgpID09PSBcInRydWVcIjtcbiAgICAvLyAjZW5kcmVnaW9uIFByb3BlcnR5IG1hcHBpbmdcbiAgICAvLyAjcmVnaW9uIERPTSBwcmVwYXJhdGlvbnNcbiAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCItLS1XYVhDb2RlXCIsIFwiLS1TVk1hbmFnZXJcIik7XG5cbiAgICB0aGlzLnZhcmlhYmxlU3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG4gICAgdGhpcy52YXJpYWJsZVN0eWxlLmlubmVySFRNTCA9IGAke3RoaXMuZW5hYmxlZCA/IHRoaXMuY3NzRW5hYmxlZCA6IHRoaXMuY3NzRGlzYWJsZWR9fWA7XG5cbiAgICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcbiAgICBzdHlsZS5pbm5lckhUTUwgPSBgXG4gICAgICAgIGRpdi4tLS1XYVhDb2RlLi0tU1ZNYW5hZ2VyLi0tT3B0aW9uICAgICAgICAgICAgIHsgZGlzcGxheSA6IGZsZXggOyB0cmFuc2l0aW9uIDogLjI1cyBhbGwgO31cbiAgICAgICAgZGl2Li0tLVdhWENvZGUuLS1TVk1hbmFnZXIuLS1PcHRpb24gaW5wdXQgICAgICAgeyBjdXJzb3IgOiBwb2ludGVyIDt9XG4gICAgICAgIGRpdi4tLS1XYVhDb2RlLi0tU1ZNYW5hZ2VyLi0tT3B0aW9uIHAgICAgICAgICAgIHtcbiAgICAgICAgICBjdXJzb3IgOiBwb2ludGVyIDsgYmFja2dyb3VuZC1jb2xvciA6IHRyYW5zcGFyZW50IDsgY29sb3IgOiBibGFjayA7IHRleHQtc2hhZG93IDogMCAwIC4yNWVtIHdoaXRlIDt9XG4gICAgICAgIGRpdi4tLS1XYVhDb2RlLi0tU1ZNYW5hZ2VyLi0tT3B0aW9uLi1DdXJyZW50ICAgIHtcbiAgICAgICAgICBib3JkZXIgOiBzb2xpZCA7IGJvcmRlci1yYWRpdXMgOiAuNWVtIDsgYm9yZGVyLWNvbG9yIDogZGFya29yYW5nZSA7IGJveC1zaGFkb3cgOiAwIDAgLjVlbSBibGFjayA7XG4gICAgICAgICAgYmFja2dyb3VuZC1jb2xvciA6ICNGRjhDMDBCQiA7fVxuICAgICAgICBkaXYuLS0tV2FYQ29kZS4tLVNWTWFuYWdlci4tLU9wdGlvbi4tQ3VycmVudCBwICB7IGNvbG9yIDogYmxhY2sgO31gO1xuXG4gICAgdGhpcy5hdHRhY2hTaGFkb3coeyBtb2RlOiBcIm9wZW5cIiB9KTtcblxuICAgIHRoaXMudmFyaWFibGVTdHlsZSA9IHRoaXMuYXBwZW5kQ2hpbGQodGhpcy52YXJpYWJsZVN0eWxlKTtcblxuICAgIERFRklORUQudHNDaGVjazxTaGFkb3dSb290Pih0aGlzLnNoYWRvd1Jvb3QpLmFwcGVuZENoaWxkKHN0eWxlKTtcbiAgICAvLyAjZW5kcmVnaW9uIERPTSBwcmVwYXJhdGlvbnNcbiAgICAvLyAjcmVnaW9uIFByb3ZpZGUgVXBkYXRlIHZpYSBQbHVnaW5EYXRhXG4gICAgd2luZG93LkNvZGJpUGx1Z2luRGF0YS51cGRhdGVTVk1hbmFnZXIgPSAob3B0aW9uczogc3RyaW5nKSA9PiB7XG4gICAgICB0aGlzLm9wdGlvbnMgPSBKU09OLnBhcnNlKG9wdGlvbnMpLm1hcCgoZTogc3RyaW5nKSA9PiBlLnJlcGxhY2UoXCIuanNcIiwgXCJcIikpO1xuXG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH07XG4gICAgLy8gI2VuZHJlZ2lvbiBQcm92aWRlIFVwZGF0ZSB2aWEgUGx1Z2luRGF0YVxuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cbiAgLyoqIFJlbmRlcidzIGFsbCB7QGxpbmsgU1ZNYW5hZ2VyLm9wdGlvbnMgfS4gKi9cbiAgcHJvdGVjdGVkIHJlbmRlcigpOiB2b2lkIHtcbiAgICBjb25zdCBzaGFkb3cgPSBERUZJTkVELnRzQ2hlY2s8U2hhZG93Um9vdD4odGhpcy5zaGFkb3dSb290KTtcblxuICAgIGZvciAoY29uc3QgdG9SZW1vdmUgb2Ygc2hhZG93LnF1ZXJ5U2VsZWN0b3JBbGwoXCJkaXYuLS0tV2FYQ29kZS4tLVNWTWFuYWdlci4tLU9wdGlvblwiKSkge1xuICAgICAgdG9SZW1vdmUucmVtb3ZlKCk7XG4gICAgfVxuICAgIC8vICNyZWdpb24gT3B0aW9ucyBpbmplY3Rpb25cbiAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiB0aGlzLm9wdGlvbnMpIHtcbiAgICAgIHNoYWRvdy5pbm5lckhUTUwgKz0gYFxuICAgICAgICA8ZGl2ICBjbGFzcyAgICAgICAgICAgPSBcIi0tLVdhWENvZGUgLS1TVk1hbmFnZXIgLS1PcHRpb24gJHt0aGlzLm9wdGlvbnNbMF0gPT09IG9wdGlvbiA/IFwiLUN1cnJlbnRcIiA6IFwiXCJ9XCJcbiAgICAgICAgICAgICAgcGFydCAgICAgICAgICAgID0gXCJPcHRpb25jb250YWluZXJcIlxuICAgICAgICAgICAgICBkYXRhLWNiLW9wdGlvbiAgPSBcIiR7b3B0aW9ufVwiPlxuICAgICAgICAgIDxpbnB1dCAgcGFydCAgPSBcIk9wdGlvbmlucHV0XCJcbiAgICAgICAgICAgICAgICAgIHR5cGUgID0gXCJjaGVja2JveFwiPjwvaW5wdXQ+XG5cbiAgICAgICAgICA8cCBwYXJ0ID0gXCJPcHRpb250ZXh0XCI+JHt0aGlzLl9vcHRpb25UcmFuc2Zvcm1lciA/IHRoaXMuX29wdGlvblRyYW5zZm9ybWVyKG9wdGlvbi5yZXBsYWNlKFwiLmpzXCIsIFwiXCIpKSA6IG9wdGlvbi5yZXBsYWNlKFwiLmpzXCIsIFwiXCIpfTwvcD48L2Rpdj5gO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIE9wdGlvbnMgaW5qZWN0aW9uXG4gICAgLy8gI3JlZ2lvbiBCaW5kIGV2ZW50IGhhbmRsZXJcbiAgICBmb3IgKGNvbnN0IGNoZWNrYm94IG9mIHNoYWRvdy5xdWVyeVNlbGVjdG9yQWxsKCdbcGFydD1cIk9wdGlvbmlucHV0XCJdJykpIHtcbiAgICAgIGNoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLm9uQ2hlY2tib3guYmluZCh0aGlzKSk7XG4gICAgfVxuICAgIGZvciAoY29uc3Qgb3B0aW9uIG9mIHNoYWRvdy5xdWVyeVNlbGVjdG9yQWxsKCdbcGFydD1cIk9wdGlvbnRleHRcIl0nKSkge1xuICAgICAgb3B0aW9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLm9uT3B0aW9uLmJpbmQodGhpcykpO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIEJpbmQgZXZlbnQgaGFuZGxlclxuICB9XG4gIC8qKlxuICAgKiBQcm9jZXNzZXMgY2hhbmdlcyBpbiB0aGUge0BsaW5rIFNWTWFuYWdlciB9J3Mgc3lzdGVtIGF0dHJpYnV0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lICAgICAgVGhlIGNoYW5nZWQgYXR0cmlidXRlJ3MgbmFtZS5cbiAgICogQHBhcmFtIG9sZFZhbHVlICBUaGUgY2hhbmdlZCBhdHRyaWJ1dGUncyBmb3JtZXIgdmFsdWUuXG4gICAqIEBwYXJhbSBuZXdWYWx1ZSAgVGhlIGNoYW5nZWQgYXR0cmlidXRlJ3MgY3VycmVudCB2YWx1ZS4gKi9cbiAgQERCQy5QYXJhbXZhbHVlUHJvdmlkZXJcbiAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKFxuICAgIEBPUi5QUkUoW25ldyBFUShcIm9wdGlvbnNcIiksIG5ldyBFUShcInNlcGFyYXRvclwiKSwgbmV3IEVRKFwiZW5hYmxlZFwiKSwgbmV3IEVRKFwiY3NzZW5hYmxlZFwiKSwgbmV3IEVRKFwiY3NzZGlzYWJsZWRcIildKVxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBvbGRWYWx1ZTogc3RyaW5nLFxuICAgIEBJRi5QUkUobmV3IEVRKFwiY3NzZW5hYmxlZFwiKSwgbmV3IFJFR0VYKC9eXFxzKig/OltcXHctXStcXHMqOlxccypbXjtdKzs/XFxzKikrJC8pKVxuICAgIEBJRi5QUkUobmV3IEVRKFwiY3NzZGlzYWJsZWRcIiksIG5ldyBSRUdFWCgvXlxccyooPzpbXFx3LV0rXFxzKjpcXHMqW147XSs7P1xccyopKyQvKSlcbiAgICBuZXdWYWx1ZTogc3RyaW5nLFxuICApOiB2b2lkIHtcbiAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgIGNhc2UgXCJvcHRpb25zXCI6XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG5ld1ZhbHVlLnNwbGl0KHRoaXMuc2VwYXJhdG9yKTtcblxuICAgICAgICB0aGlzLnJlbmRlcigpO1xuXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcInNlcGFyYXRvclwiOlxuICAgICAgICB0aGlzLnNlcGFyYXRvciA9IG5ld1ZhbHVlO1xuXG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG5cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiZW5hYmxlZFwiOlxuICAgICAgICB0aGlzLnZhcmlhYmxlU3R5bGUuaW5uZXJIVE1MID0gYCR7bmV3VmFsdWUudG9Mb3dlckNhc2UoKSA9PT0gXCJ0cnVlXCIgPyB0aGlzLmNzc0ZhZGVJTiA6IFwiXCJ9IGRpdi4tLS1XYVhDb2RlLi0tU1ZNYW5hZ2VyIHsgJHtcbiAgICAgICAgICBuZXdWYWx1ZS50b0xvd2VyQ2FzZSgpID09PSBcInRydWVcIiA/IHRoaXMuY3NzRW5hYmxlZCA6IHRoaXMuY3NzRGlzYWJsZWRcbiAgICAgICAgfX1gO1xuXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImNzc2VuYWJsZWRcIjpcbiAgICAgICAgdGhpcy5jc3NFbmFibGVkID0gbmV3VmFsdWU7XG5cbiAgICAgICAgaWYgKHRoaXMuZW5hYmxlZCkge1xuICAgICAgICAgIHRoaXMudmFyaWFibGVTdHlsZS5pbm5lckhUTUwgPSBgJHt0aGlzLmNzc0ZhZGVJTn0gZGl2Li0tLVdhWENvZGUuLS1TVk1hbmFnZXIgeyAke3RoaXMuY3NzRW5hYmxlZH19YDtcbiAgICAgICAgfVxuXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImNzc2Rpc2FibGVkXCI6XG4gICAgICAgIHRoaXMuY3NzRGlzYWJsZWQgPSBuZXdWYWx1ZTtcbiAgICAgICAgaWYgKCF0aGlzLmVuYWJsZWQpIHtcbiAgICAgICAgICB0aGlzLnZhcmlhYmxlU3R5bGUuaW5uZXJIVE1MID0gYCR7dGhpcy5jc3NGYWRlSU59IGRpdi4tLS1XYVhDb2RlLi0tU1ZNYW5hZ2VyIHsgJHt0aGlzLmNzc0Rpc2FibGVkfX1gO1xuICAgICAgICB9XG5cbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIC8vICNyZWdpb24gUmVnaXN0cmF0aW9uIGFzIGN1c3RvbSBlbGVtZW50XG4gIC8qKlxuICAgKiBTdGF0ZXMgd2hldGhlciB0aGlzIHtAbGluayBTVk1hbmFnZXIgfSB3YXMgc3VjY2Vzc2Z1bGx5IHJlZ2lzdGVyZWQgYXMgYSBjdXN0b20gZWxlbWVudCBhbmQgcGVyZm9ybXNcbiAgICogdGhlIHJlZ2lzdHJhdGlvbiB1cG9uIGNsYXNzIHVzYWdlLlxuICAgKlxuICAgKiBAdGhyb3dzIFNlZSB7QGxpbmsgd2luZG93LmN1c3RvbUVsZW1lbnRzIH0ncyAqKmRlZmluZSoqIG1ldGhvZC4gKi9cbiAgcHVibGljIHN0YXRpYyByZWdpc3RlcmVkOiBib29sZWFuID0gKCgpID0+IHtcbiAgICBjdXN0b21FbGVtZW50cy5kZWZpbmUoXCJ4Yy1zdm1hbmFnZXJcIiwgU1ZNYW5hZ2VyLCB7IGV4dGVuZHM6IFwiZGl2XCIgfSk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSkoKTtcbiAgLy8gI2VuZHJlZ2lvbiBSZWdpc3RyYXRpb24gYXMgY3VzdG9tIGVsZW1lbnRcbiAgLy8gI3JlZ2lvbiBDaGVja2JveCBoYW5kbGluZ1xuICAvKipcbiAgICogSWYgdGhlIHtAbGluayBTVk1hbmFnZXIudGFyZ2V0IH0gaXMgZGVmaW5lZCwgY2xpY2tpbmcgYSBjaGVja2JveCB3aWxsIGVpdGhlciByZXN1bHQgaW4gdGhlIGNvcnJlc3BvbmRpbmdcbiAgICogZnVuY3Rpb25hbGl0eSB0byBiZSByZW1vdmVkIG9yIGFkZGVkIHRvIHRoZSB7QGxpbmsgU1ZNYW5hZ2VyLnRhcmdldCB9J3MgdmFsdWUuXG4gICAqXG4gICAqIEBwYXJhbSBldmVudCBUaGUge0BsaW5rIEV2ZW50IH0uICovXG4gIHByb3RlY3RlZCBvbkNoZWNrYm94KGV2ZW50OiBFdmVudCk6IHZvaWQge1xuICAgIGNvbnN0IHRhcmdldCA9IElOU1RBTkNFLnRzQ2hlY2s8SFRNTElucHV0RWxlbWVudD4odGhpcy50YXJnZXQsIEhUTUxJbnB1dEVsZW1lbnQpO1xuICAgIGNvbnN0IGV2ZW50VGFyZ2V0ID0gSU5TVEFOQ0UudHNDaGVjazxIVE1MSW5wdXRFbGVtZW50PihldmVudC50YXJnZXQsIEhUTUxJbnB1dEVsZW1lbnQpO1xuXG4gICAgdGFyZ2V0LmZvY3VzKCk7XG5cbiAgICBjb25zdCBvcHRpb24gPSBldmVudFRhcmdldC5wYXJlbnRFbGVtZW50Py5nZXRBdHRyaWJ1dGUoXCJkYXRhLWNiLW9wdGlvblwiKT8udG9VcHBlckNhc2UoKSA/PyBcIlwiO1xuXG4gICAgaWYgKGV2ZW50VGFyZ2V0LmNoZWNrZWQpIHtcbiAgICAgIC8vICNyZWdpb24gQWRkIGZ1bmN0aW9uYWxpdHlcbiAgICAgIC8vIElmIGNhcmV0IGlzIGF0IHRoZSBlbmQgb2YgdGhlIDxpbnB1dD4uLi5cbiAgICAgIGlmICh0YXJnZXQuc2VsZWN0aW9uU3RhcnQgPT09IDApIHtcbiAgICAgICAgdGFyZ2V0LnZhbHVlID0gYCR7b3B0aW9uLnRvTG93ZXJDYXNlKCl9JHt0YXJnZXQudmFsdWUubGVuZ3RoID09PSAwID8gXCJcIiA6IFwiLFwifWA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGFyZ2V0LnNlbGVjdGlvblN0YXJ0ICE9PSBudWxsKSB7XG4gICAgICAgICAgLy8gI3JlZ2lvbiBEZXRlcm1pbmUgaW5kaWNlcyBmb3IgcmVwbGFjZW1lbnRcbiAgICAgICAgICBsZXQgc2VnbWVudFN0YXJ0ID0gdGFyZ2V0LnNlbGVjdGlvblN0YXJ0O1xuXG4gICAgICAgICAgd2hpbGUgKHRhcmdldC52YWx1ZVstLXNlZ21lbnRTdGFydF0gIT09IHRoaXMuc2VwYXJhdG9yICYmIHNlZ21lbnRTdGFydCAhPT0gMCkge31cbiAgICAgICAgICBsZXQgc2VnbWVudEVuZCA9IHRhcmdldC5zZWxlY3Rpb25TdGFydCAtIDE7XG5cbiAgICAgICAgICB3aGlsZSAodGFyZ2V0LnZhbHVlWysrc2VnbWVudEVuZF0gIT09IHRoaXMuc2VwYXJhdG9yICYmIHNlZ21lbnRFbmQgIT09IHRhcmdldC52YWx1ZS5sZW5ndGgpIHt9XG4gICAgICAgICAgLy8gI2VuZHJlZ2lvbiBEZXRlcm1pbmUgaW5kaWNlcyBmb3IgcmVwbGFjZW1lbnRcbiAgICAgICAgICAvLyAjcmVnaW9uIFJlcGxhY2UgcHJvcGVybHkgbGVhdmluZyB0aGUgW3NlcGFyYXRvcl0gdW50b3VjaGVkXG4gICAgICAgICAgdGFyZ2V0LnZhbHVlID0gdGFyZ2V0LnZhbHVlLnJlcGxhY2UoXG4gICAgICAgICAgICB0YXJnZXQudmFsdWUuc3Vic3RyaW5nKHNlZ21lbnRTdGFydCArICh0YXJnZXQudmFsdWVbc2VnbWVudFN0YXJ0XSA9PT0gdGhpcy5zZXBhcmF0b3IgPyArMSA6IDApLCBzZWdtZW50RW5kKSxcbiAgICAgICAgICAgIGAke29wdGlvbi50b0xvd2VyQ2FzZSgpfSxgLFxuICAgICAgICAgICk7XG4gICAgICAgICAgLy8gI2VuZHJlZ2lvbiBSZXBsYWNlIHByb3Blcmx5IGxlYXZpbmcgdGhlIFtzZXBhcmF0b3JdIHVudG91Y2hlZFxuICAgICAgICAgIGNvbnN0IG5ld1Bvc2l0aW9uID0gc2VnbWVudFN0YXJ0ICsgb3B0aW9uLmxlbmd0aCArIDI7IC8vIEluY2x1ZGluZyB0aGUgW3NlcGFyYXRvcl0uXG5cbiAgICAgICAgICB0YXJnZXQuc2V0U2VsZWN0aW9uUmFuZ2UobmV3UG9zaXRpb24sIG5ld1Bvc2l0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gI2VuZHJlZ2lvbiBBZGQgZnVuY3Rpb25hbGl0eVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyAjcmVnaW9uIFJlbW92ZSBmdW5jdGlvbmFsaXR5XG4gICAgICBjb25zdCB0YXJnZXRWYWx1ZSA9IHRhcmdldC52YWx1ZTtcblxuICAgICAgdGFyZ2V0LnZhbHVlID0gdGFyZ2V0VmFsdWVcbiAgICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgICAgLnJlcGxhY2UoXG4gICAgICAgICAgKHRhcmdldFZhbHVlLmluZGV4T2YoYCwke29wdGlvbi50b0xvd2VyQ2FzZSgpfWApID09PSAtMSA/IFwiXCIgOiBcIixcIikgK1xuICAgICAgICAgICAgb3B0aW9uLnRvTG93ZXJDYXNlKCkgK1xuICAgICAgICAgICAgKHRhcmdldFZhbHVlLmluZGV4T2YoYCwke29wdGlvbi50b0xvd2VyQ2FzZSgpfWApID09PSAtMSA/IFwiLFwiIDogXCJcIiksXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgKTtcbiAgICAgIC8vICNlbmRyZWdpb24gUmVtb3ZlIGZ1bmN0aW9uYWxpdHlcbiAgICB9XG4gIH1cbiAgLy8gI2VuZHJlZ2lvbiBDaGVja2JveCBoYW5kbGluZ1xuICAvLyAjcmVnaW9uIENoZWNrYm94IGhhbmRsaW5nXG4gIC8qKlxuICAgKiBTZWxlY3RzIHRoZSBjbGlja2VkIG9wdGlvbiBhbmQgZmlyZXMgdGhlIHtAbGluayBTVk1hbmFnZXIub25PcHRpb25DaGFuZ2VkIH0gaGFuZGxlcnMuXG4gICAqXG4gICAqIEBwYXJhbSBldmVudCBUaGUge0BsaW5rIEV2ZW50IH0uICovXG4gIHByb3RlY3RlZCBvbk9wdGlvbihldmVudDogRXZlbnQpOiB2b2lkIHtcbiAgICBjb25zdCBldmVudFRhcmdldCA9IElOU1RBTkNFLnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KGV2ZW50LnRhcmdldCwgSFRNTEVsZW1lbnQpO1xuICAgIGNvbnN0IGN1cnJlbnRPcHRpb24gPSBJTlNUQU5DRS50c0NoZWNrPEhUTUxFbGVtZW50PihcbiAgICAgIERFRklORUQudHNDaGVjazxFbGVtZW50PihcbiAgICAgICAgREVGSU5FRC50c0NoZWNrPFNoYWRvd1Jvb3Q+KHRoaXMuc2hhZG93Um9vdCkucXVlcnlTZWxlY3RvcihcIi4tLS1XYVhDb2RlLi0tU1ZNYW5hZ2VyLi0tT3B0aW9uLi1DdXJyZW50XCIpLFxuICAgICAgKSxcbiAgICAgIEhUTUxFbGVtZW50LFxuICAgICk7XG5cbiAgICBjdXJyZW50T3B0aW9uLmNsYXNzTGlzdC5yZW1vdmUoXCItQ3VycmVudFwiKTtcblxuICAgIGNvbnN0IG5ld0N1cnJlbnRDb250YWluZXIgPSBldmVudFRhcmdldC5wYXJlbnRFbGVtZW50O1xuXG4gICAgaWYgKG5ld0N1cnJlbnRDb250YWluZXIpIHtcbiAgICAgIG5ld0N1cnJlbnRDb250YWluZXIuY2xhc3NMaXN0LmFkZChcIi1DdXJyZW50XCIpO1xuICAgICAgbmV3Q3VycmVudENvbnRhaW5lci5zY3JvbGxJbnRvVmlldyh7IGJlaGF2aW9yOiBcInNtb290aFwiLCBpbmxpbmU6IFwiY2VudGVyXCIsIGJsb2NrOiBcImNlbnRlclwiIH0pO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgaGFuZGxlciBvZiB0aGlzLm9uT3B0aW9uQ2hhbmdlZCkge1xuICAgICAgY29uc3QgbmV3T3B0aW9uID0gZXZlbnRUYXJnZXQucGFyZW50RWxlbWVudD8uZGF0YXNldC5jYk9wdGlvbjtcblxuICAgICAgaWYgKG5ld09wdGlvbikge1xuICAgICAgICBoYW5kbGVyKG5ld09wdGlvbik7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8vICNlbmRyZWdpb24gQ2hlY2tib3ggaGFuZGxpbmdcbiAgLy8gI3JlZ2lvbiBLZXlib2FyZCBoYW5kbGluZ1xuICAvKipcbiAgICogUHJldmVudHMgdGhlIHtAbGluayB0aGlzLnRhcmdldCB9IGZyb20gbG9vc2luZyBmb2N1cyBvbiBoaXR0aW5nIGtleXMgdGhhdCdyZSB1c2VkIHRvIGNvbnRyb2xcbiAgICogdGhpcyB7QGxpbmsgU1ZNYW5hZ2VyIH0uXG4gICAqXG4gICAqIEBwYXJhbSBldmVudCBUaGUge0BsaW5rIEtleWJvYXJkRXZlbnQgfS4gKi9cbiAgcHJvdGVjdGVkIG9uS2V5dXBUYXJnZXQoZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiB2b2lkIHtcbiAgICBpZiAoZXZlbnQua2V5ID09PSBcIkFycm93RG93blwiIHx8IGV2ZW50LmtleSA9PT0gXCJBcnJvd1VwXCIgfHwgZXZlbnQua2V5ID09PSBcIkVudGVyXCIgfHwgZXZlbnQua2V5ID09PSBcIiBcIikge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBUcmF2ZXJzZXMgdGhlIG9wdGlvbnMgZnJvbSB0aGUgY3VycmVudCBvbiByZXR1cm5pbmcgdGhlIGZpcnN0IG9uZSB3aGljaCdzICoqc3R5bGUuZGlzcGxheSoqIGlzIG5vdCAqKm5vbmUqKi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGZpcnN0IHZpc2libGUgb3B0aW9uLiAqL1xuICBwcm90ZWN0ZWQgZ2V0IHByZXZpb3VzVmlzaWJsZU9wdGlvbigpOiBIVE1MRWxlbWVudCB8IG51bGwgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IHNoYWRvdyA9IERFRklORUQudHNDaGVjazxTaGFkb3dSb290Pih0aGlzLnNoYWRvd1Jvb3QpO1xuICAgIGxldCBjdXJyZW50ID0gcHJldmlvdXNFbGVtZW50U2libGluZyhzaGFkb3cucXVlcnlTZWxlY3RvcihcIi4tLS1XYVhDb2RlLi0tU1ZNYW5hZ2VyLi0tT3B0aW9uLi1DdXJyZW50XCIpKTtcblxuICAgIHdoaWxlIChjdXJyZW50ICE9IG51bGwgJiYgY3VycmVudC5zdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIikge1xuICAgICAgY3VycmVudCA9IHByZXZpb3VzRWxlbWVudFNpYmxpbmcoY3VycmVudC5wcmV2aW91c0VsZW1lbnRTaWJsaW5nKTtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudCA9PT0gbnVsbCB8fCAhY3VycmVudC5oYXNBdHRyaWJ1dGUoXCJwYXJ0XCIpKSB7XG4gICAgICBjb25zdCBvcHRpb25zID0gYWxsQnlDc3NIdG1sKFwiLi0tLVdhWENvZGUuLS1TVk1hbmFnZXIuLS1PcHRpb25cIiwgc2hhZG93KTtcblxuICAgICAgY3VycmVudCA9IG9wdGlvbnNbb3B0aW9ucy5sZW5ndGggLSAxXSA/PyBudWxsO1xuXG4gICAgICB3aGlsZSAoY3VycmVudCAhPT0gbnVsbCAmJiBjdXJyZW50LnN0eWxlLmRpc3BsYXkgPT09IFwibm9uZVwiKSB7XG4gICAgICAgIGN1cnJlbnQgPSBwcmV2aW91c0VsZW1lbnRTaWJsaW5nKGN1cnJlbnQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjdXJyZW50O1xuICB9XG4gIC8qKlxuICAgKiBUcmF2ZXJzZXMgdGhlIG9wdGlvbnMgZnJvbSB0aGUgY3VycmVudCBvbiByZXR1cm5pbmcgdGhlIGZpcnN0IG9uZSB3aGljaCdzICoqc3R5bGUuZGlzcGxheSoqIGlzIG5vdCAqKm5vbmUqKi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGZpcnN0IHZpc2libGUgb3B0aW9uLiAqL1xuICBwcm90ZWN0ZWQgZ2V0IG5leHRWaXNpYmxlT3B0aW9uKCk6IEhUTUxFbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3Qgc2hhZG93ID0gREVGSU5FRC50c0NoZWNrPFNoYWRvd1Jvb3Q+KHRoaXMuc2hhZG93Um9vdCk7XG5cbiAgICBsZXQgY3VycmVudCA9IG5leHRFbGVtZW50U2libGluZyhzaGFkb3cucXVlcnlTZWxlY3RvcihcIi4tLS1XYVhDb2RlLi0tU1ZNYW5hZ2VyLi0tT3B0aW9uLi1DdXJyZW50XCIpKTtcblxuICAgIHdoaWxlIChjdXJyZW50ICE9IG51bGwgJiYgY3VycmVudC5zdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIikge1xuICAgICAgY3VycmVudCA9IG5leHRFbGVtZW50U2libGluZyhjdXJyZW50Lm5leHRFbGVtZW50U2libGluZyk7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnQgPT09IG51bGwpIHtcbiAgICAgIGN1cnJlbnQgPSBzaGFkb3cucXVlcnlTZWxlY3RvcihcIi4tLS1XYVhDb2RlLi0tU1ZNYW5hZ2VyLi0tT3B0aW9uXCIpO1xuXG4gICAgICB3aGlsZSAoY3VycmVudCAhPSBudWxsICYmIGN1cnJlbnQuc3R5bGUuZGlzcGxheSA9PT0gXCJub25lXCIpIHtcbiAgICAgICAgY3VycmVudCA9IG5leHRFbGVtZW50U2libGluZyhjdXJyZW50Lm5leHRFbGVtZW50U2libGluZyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGN1cnJlbnQ7XG4gIH1cbiAgLyoqXG4gICAqIFNlbGVjdHMgdGhlIG5leHQgb3B0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gZXZlbnQgVGhlIHtAbGluayBLZXlib2FyZEV2ZW50IH0uICovXG4gIHByb3RlY3RlZCBvbktleWRvd25UYXJnZXQoZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiB2b2lkIHtcbiAgICB0aGlzLmxhc3RLZXkgPSBldmVudC5rZXk7XG5cbiAgICBpZiAoZXZlbnQua2V5ID09PSBcIkRlbGV0ZVwiKSB7XG4gICAgICB0aGlzLm9uSW5wdXRUYXJnZXQoZXZlbnQpO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vICNyZWdpb24gUHJldmVudCB0YXJnZXQgZnJvbSBsb29zaW5nIGZvY3VzXG4gICAgaWYgKGV2ZW50LmtleSA9PT0gXCJBcnJvd0Rvd25cIiB8fCBldmVudC5rZXkgPT09IFwiQXJyb3dVcFwiIHx8IGV2ZW50LmtleSA9PT0gXCJFbnRlclwiIHx8IGV2ZW50LmtleSA9PT0gXCIgXCIpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIFByZXZlbnQgdGFyZ2V0IGZyb20gbG9vc2luZyBmb2N1c1xuICAgIHN3aXRjaCAoZXZlbnQua2V5KSB7XG4gICAgICBjYXNlIFwiQXJyb3dVcFwiOlxuICAgICAgY2FzZSBcIkFycm93RG93blwiOlxuICAgICAgICB7XG4gICAgICAgICAgY29uc3Qgc2hhZG93ID0gREVGSU5FRC50c0NoZWNrPFNoYWRvd1Jvb3Q+KHRoaXMuc2hhZG93Um9vdCk7XG4gICAgICAgICAgY29uc3QgZm9ybWVyID0gREVGSU5FRC50c0NoZWNrPEhUTUxFbGVtZW50PihcbiAgICAgICAgICAgIElOU1RBTkNFLnRzQ2hlY2s8SFRNTERpdkVsZW1lbnQ+KFxuICAgICAgICAgICAgICBzaGFkb3cucXVlcnlTZWxlY3RvcihcIi4tLS1XYVhDb2RlLi0tU1ZNYW5hZ2VyLi0tT3B0aW9uLi1DdXJyZW50XCIpLFxuICAgICAgICAgICAgICBIVE1MRGl2RWxlbWVudCxcbiAgICAgICAgICAgICksXG4gICAgICAgICAgKTtcbiAgICAgICAgICBjb25zdCB0YXJnZXRPcHRpb24gPSBERUZJTkVELnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KFxuICAgICAgICAgICAgZXZlbnQua2V5ID09PSBcIkFycm93RG93blwiID8gdGhpcy5uZXh0VmlzaWJsZU9wdGlvbiA6IHRoaXMucHJldmlvdXNWaXNpYmxlT3B0aW9uLFxuICAgICAgICAgICk7XG5cbiAgICAgICAgICB0YXJnZXRPcHRpb24uc2Nyb2xsSW50b1ZpZXcoeyBiZWhhdmlvcjogXCJzbW9vdGhcIiwgaW5saW5lOiBcImNlbnRlclwiLCBibG9jazogXCJjZW50ZXJcIiB9KTtcbiAgICAgICAgICB0YXJnZXRPcHRpb24uY2xhc3NMaXN0LmFkZChcIi1DdXJyZW50XCIpO1xuICAgICAgICAgIGZvcm1lci5jbGFzc0xpc3QucmVtb3ZlKFwiLUN1cnJlbnRcIik7XG5cbiAgICAgICAgICBmb3IgKGNvbnN0IGhhbmRsZXIgb2YgdGhpcy5vbk9wdGlvbkNoYW5nZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IGNiT3B0aW9uID0gYnlDc3NIdG1sKFwiLi0tLVdhWENvZGUuLS1TVk1hbmFnZXIuLS1PcHRpb24uLUN1cnJlbnRcIiwgc2hhZG93KT8uZGF0YXNldC5jYk9wdGlvbjtcblxuICAgICAgICAgICAgaGFuZGxlcihjYk9wdGlvbiA/PyBcIlwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBicmVhaztcbiAgICAgIC8vIFNlbGVjdCAvIFVuc2VsZWN0XG4gICAgICBjYXNlIFwiIFwiOlxuICAgICAgICB7XG4gICAgICAgICAgY29uc3Qgc2hhZG93ID0gREVGSU5FRC50c0NoZWNrPFNoYWRvd1Jvb3Q+KHRoaXMuc2hhZG93Um9vdCk7XG5cbiAgICAgICAgICBieUNzc0h0bWwoJy4tLS1XYVhDb2RlLi0tU1ZNYW5hZ2VyLi0tT3B0aW9uLi1DdXJyZW50IFsgcGFydCA9IFwiT3B0aW9uaW5wdXRcIl0nLCBzaGFkb3cpPy5jbGljaygpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChjb25zdCBoYW5kbGVyIG9mIHRoaXMub25PcHRpb25TZWxlY3RlZCkge1xuICAgICAgICAgIGNvbnN0IGNiT3B0aW9uID0gYnlDc3NIdG1sKFxuICAgICAgICAgICAgXCIuLS0tV2FYQ29kZS4tLVNWTWFuYWdlci4tLU9wdGlvbi4tQ3VycmVudFwiLFxuICAgICAgICAgICAgREVGSU5FRC50c0NoZWNrPFNoYWRvd1Jvb3Q+KHRoaXMuc2hhZG93Um9vdCksXG4gICAgICAgICAgKT8uZGF0YXNldC5jYk9wdGlvbjtcblxuICAgICAgICAgIGhhbmRsZXIoY2JPcHRpb24gPz8gXCJcIik7XG4gICAgICAgIH1cblxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIFNldHMge0BsaW5rIFNWTWFuYWdlci5uZXdGb2N1c1RhcmdldCB9IHRvICoqdHJ1ZSoqIGluIG9yZGVyIGZvciBvdGhlciBtZXRob2RzIHRvIGJlIGFibGUgdG8gcmVjb2duaXplIHdoZW5cbiAgICogdGhlIHtAbGluayBTVk1hbmFnZXIudGFyZ2V0IH0gd2FzIGZvY3VzZWQgcHJpb3IgdG8gdGhlaXIgaW52b2NhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGV2ZW50IFRoZSB7QGxpbmsgRXZlbnQgfS4gKi9cbiAgcHJvdGVjdGVkIG9uRm9jdXNUYXJnZXQoZXZlbnQ6IEV2ZW50KTogdm9pZCB7XG4gICAgdGhpcy5uZXdGb2N1c1RhcmdldCA9IHRydWU7XG4gIH1cbiAgLyoqXG4gICAqIEhhbmRsZXMgaW5wdXQgb24gdGhlIHtAbGluayBTVk1hbmFnZXIudGFyZ2V0IH0gZmlsdGVyaW5nIHRoZSBhdmFpbGFibGUge0BsaW5rIFNWTWFuYWdlci5vcHRpb25zIH0gYW5kXG4gICAqIGNvbXBsZXRpbmcgdGhlIG9wdGlvbiB3aXRoaW4gdGhlIHtAbGluayBTVk1hbmFnZXIudGFyZ2V0IH0gd2hlbiBvbmUgb2YgdGhlIHtAbGluayBTVk1hbmFnZXIub3B0aW9ucyB9IGdldHNcbiAgICogZGVmaW5pdGUuXG4gICAqXG4gICAqIEBwYXJhbSBldmVudCBUaGUge0BsaW5rIEV2ZW50IH0uICovXG4gIHByb3RlY3RlZCBvbklucHV0VGFyZ2V0KGV2ZW50OiBFdmVudCk6IHZvaWQge1xuICAgIGNvbnN0IGV2ZW50VGFyZ2V0ID0gSU5TVEFOQ0UudHNDaGVjazxIVE1MSW5wdXRFbGVtZW50PihldmVudC50YXJnZXQsIEhUTUxJbnB1dEVsZW1lbnQpO1xuICAgIC8vICNyZWdpb24gSWYgdGhlIFt0YXJnZXRdIGp1c3QgcmVjZWl2ZWQgZm9jdXMsIHNob3cgYWxsIGF2YWlsYWJsZSBmdW5jdGlvbmFsaXRpZXNcbiAgICBpZiAodGhpcy5uZXdGb2N1c1RhcmdldCkge1xuICAgICAgdGhpcy5uZXdGb2N1c1RhcmdldCA9IGZhbHNlO1xuXG4gICAgICBmb3IgKGNvbnN0IGhhbmRsZXIgb2YgdGhpcy5vbk9wdGlvbkNoYW5nZWQpIHtcbiAgICAgICAgaGFuZGxlcih0aGlzLm9wdGlvbnNbMF0gPz8gXCJcIik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvbiBJZiB0aGUgW3RhcmdldF0ganVzdCByZWNlaXZlZCBmb2N1cywgc2hvdyBhbGwgYXZhaWxhYmxlIGZ1bmN0aW9uYWxpdGllc1xuICAgIGxldCBzZWdtZW50Q29udGVudDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuXG4gICAgaWYgKGV2ZW50VGFyZ2V0LnZhbHVlLnRvTG93ZXJDYXNlKCkudHJpbSgpID09PSBcImRhdGEtY2ItZnVuY1wiKSB7XG4gICAgICBldmVudFRhcmdldC52YWx1ZSA9IFwiXCI7XG4gICAgfVxuXG4gICAgc2VnbWVudENvbnRlbnQgPSB0aGlzLmRldGVybWluZVNlZ21lbnRjb250ZW50KGV2ZW50VGFyZ2V0LnZhbHVlLCB0aGlzLnNlcGFyYXRvciwgZXZlbnRUYXJnZXQuc2VsZWN0aW9uU3RhcnQgPz8gMCk7XG5cbiAgICBjb25zdCByZW1haW5pbmdPcHRpb25zID0gdGhpcy5maWx0ZXIoc2VnbWVudENvbnRlbnQpO1xuXG4gICAgaWYgKHJlbWFpbmluZ09wdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgIGV2ZW50LnR5cGUgIT09IFwic2VsZWN0aW9uY2hhbmdlXCIgJiZcbiAgICAgIHRoaXMubGFzdEtleSAhPT0gXCJCYWNrc3BhY2VcIiAmJlxuICAgICAgdGhpcy5sYXN0S2V5ICE9PSBcIkRlbGV0ZVwiICYmXG4gICAgICByZW1haW5pbmdPcHRpb25zLmxlbmd0aCA9PT0gMVxuICAgICkge1xuICAgICAgZXZlbnRUYXJnZXQudmFsdWUgPSBldmVudFRhcmdldC52YWx1ZS5yZXBsYWNlKHNlZ21lbnRDb250ZW50LCByZW1haW5pbmdPcHRpb25zWzBdID8/IFwiXCIpO1xuXG4gICAgICBmb3IgKGNvbnN0IGhhbmRsZXIgb2YgdGhpcy5vbkF1dG9jb21wbGV0ZSkge1xuICAgICAgICBoYW5kbGVyKHJlbWFpbmluZ09wdGlvbnNbMF0gPz8gXCJcIik7XG4gICAgICB9XG5cbiAgICAgIGZvciAoY29uc3QgaGFuZGxlciBvZiB0aGlzLm9uT3B0aW9uQ2hhbmdlZCkge1xuICAgICAgICBoYW5kbGVyKHJlbWFpbmluZ09wdGlvbnNbMF0gPz8gXCJcIik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3Qgc2hhZG93ID0gREVGSU5FRC50c0NoZWNrPFNoYWRvd1Jvb3Q+KHRoaXMuc2hhZG93Um9vdCk7XG5cbiAgICBzaGFkb3cucXVlcnlTZWxlY3RvcihcIi4tLS1XYVhDb2RlLi0tU1ZNYW5hZ2VyLi0tT3B0aW9uLi1DdXJyZW50XCIpPy5jbGFzc0xpc3QucmVtb3ZlKFwiLUN1cnJlbnRcIik7XG4gICAgREVGSU5FRC50c0NoZWNrPEhUTUxFbGVtZW50PihcbiAgICAgIElOU1RBTkNFLnRzQ2hlY2s8SFRNTERpdkVsZW1lbnQ+KFxuICAgICAgICBzaGFkb3cucXVlcnlTZWxlY3RvcihgLi0tLVdhWENvZGUuLS1TVk1hbmFnZXIuLS1PcHRpb25bIGRhdGEtY2Itb3B0aW9uID0gXCIke3JlbWFpbmluZ09wdGlvbnNbMF19XCJdYCksXG4gICAgICAgIEhUTUxEaXZFbGVtZW50LFxuICAgICAgKSxcbiAgICApLmNsYXNzTGlzdC5hZGQoXCItQ3VycmVudFwiKTtcbiAgfVxuICAvLyAjZW5kcmVnaW9uIEtleWJvYXJkIGhhbmRsaW5nXG4gIC8vICNyZWdpb24gRmlsdGVyaW5nXG4gIC8qKnRoaVxuICAgKiBGaWx0ZXJzIHRoZSB2aWV3IG9mIG9wdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSBmaWx0ZXIgIFRoZSB7QGxpbmsgc3RyaW5nIH0gdG8gYXBwbHkgYXMgYSBmaWx0ZXIuXG4gICAqIEBwYXJhbSBvcHRpb25zIFRoZSB7QGxpbmsgSFRNTERpdkVsZW1lbnQgfXMgdG8gZmlsdGVyLiBJZiBub3Qgc3BlY2lmaWVkLCBhbGwgY2hpbGRyZW4gdGFnZ2VkIHdpdGggdGhlIENTUy1DbGFzc2VzXG4gICAqICAgICAgICAgICAgICAgIFwiLS0tV2FYQ29kZSAtLVNWTWFuYWdlciAtLU9wdGlvblwiIHdpbGwgYmUgdXNlZC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHJlbWFpbmluZyBvcHRpb25zLiAqL1xuICBwdWJsaWMgZmlsdGVyKFxuICAgIGZpbHRlcjogc3RyaW5nLFxuICAgIG9wdGlvbnM6IEhUTUxEaXZFbGVtZW50W10gPSBhbGxCeUNzc0FzKFxuICAgICAgXCIuLS0tV2FYQ29kZS4tLVNWTWFuYWdlci4tLU9wdGlvblwiLFxuICAgICAgSFRNTERpdkVsZW1lbnQsXG4gICAgICB0aGlzLnNoYWRvd1Jvb3QgPz8gdW5kZWZpbmVkLFxuICAgICksXG4gICk6IEFycmF5PHN0cmluZz4ge1xuICAgIGNvbnN0IGhpdHMgPSBuZXcgQXJyYXk8c3RyaW5nPigpO1xuXG4gICAgbGV0IGZpcnN0VmlzaWJsZTogSFRNTERpdkVsZW1lbnQgfCB1bmRlZmluZWQ7XG5cbiAgICBmb3IgKGNvbnN0IG9wdGlvbiBvZiBvcHRpb25zKSB7XG4gICAgICBjb25zdCBjYk9wdGlvbiA9IG9wdGlvbi5kYXRhc2V0LmNiT3B0aW9uID8/IFwiXCI7XG4gICAgICBpZiAoY2JPcHRpb24udG9Mb3dlckNhc2UoKS5pbmRleE9mKGZpbHRlci50b0xvd2VyQ2FzZSgpKSA9PT0gLTEpIHtcbiAgICAgICAgb3B0aW9uLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChmaXJzdFZpc2libGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGZpcnN0VmlzaWJsZSA9IG9wdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBoaXRzLnB1c2goY2JPcHRpb24pO1xuXG4gICAgICAgIG9wdGlvbi5zdHlsZS5kaXNwbGF5ID0gXCJmbGV4XCI7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHBhcnQgPSBieUNzc0FzKCdbIHBhcnQgPSBcIk9wdGlvbmlucHV0XCJdJywgSFRNTElucHV0RWxlbWVudCwgb3B0aW9uKTtcblxuICAgICAgaWYgKHBhcnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBwYXJ0LmNoZWNrZWQgPSBmYWxzZTtcblxuICAgICAgICBmb3IgKGNvbnN0IGNhbmRpZGF0ZSBvZiB0aGlzLnRhcmdldC52YWx1ZS5zcGxpdChcIixcIikpIHtcbiAgICAgICAgICBpZiAoY2FuZGlkYXRlID09PSBjYk9wdGlvbikge1xuICAgICAgICAgICAgcGFydC5jaGVja2VkID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmaXJzdFZpc2libGU/LmNsaWNrKCk7XG5cbiAgICByZXR1cm4gaGl0cztcbiAgfVxuICAvLyAjZW5kcmVnaW9uIEZpbHRlcmluZ1xuICAvKipcbiAgICogRGV0ZXJtaW5lcyB0aGUgc2VnbWVudC1jb250ZW50IHdpdGhpbiBhIHNlcGFyYXRlZCB2YWx1ZXMge0BsaW5rIHN0cmluZyB9IG91dCBvZiB0aGUgc3BlY2lmaWVkICoqcG9zaXRpb24qKi5cbiAgICpcbiAgICogQHBhcmFtIHNlcGFyYXRlZFZhbHVlcyBUaGUge0BsaW5rIHN0cmluZyB9IGNvbnRhaW5pbmcgdGhlIHNlcGFyYXRlZCB2YWx1ZXMuXG4gICAqIEBwYXJhbSBkZWxpbWl0ZXIgICAgICAgVGhlIHtAbGluayBzdHJpbmcgfSBkZWxpbWl0aW5nIGVhY2ggc2VnbWVudC5cbiAgICogQHBhcmFtIHBvc2l0aW9uICAgICAgICBUaGUgY3VycmVudCBwb3NpdGlvbiB3aXRoaW4gdGhlIHNlZ21lbnQuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBzZWdtZW50LWNvbnRlbnQgd2hlcmUgdGhlICoqcG9zaXRpb24qKiBpcyBwb2ludGluZyBhdC4gKi9cbiAgcHJvdGVjdGVkIGRldGVybWluZVNlZ21lbnRjb250ZW50KHNlcGFyYXRlZFZhbHVlczogc3RyaW5nLCBkZWxpbWl0ZXI6IHN0cmluZywgcG9zaXRpb246IG51bWJlciA9IDApOiBzdHJpbmcge1xuICAgIGNvbnN0IGNhcmV0UG9zOiBudW1iZXIgPSBwb3NpdGlvbjtcblxuICAgIGlmIChzZXBhcmF0ZWRWYWx1ZXMubGVuZ3RoID09PSAwIHx8IGNhcmV0UG9zIDwgMCB8fCBjYXJldFBvcyA+IHNlcGFyYXRlZFZhbHVlcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cblxuICAgIGNvbnN0IGxhc3RDb21tYUJlZm9yZUNhcmV0OiBudW1iZXIgPSBzZXBhcmF0ZWRWYWx1ZXMubGFzdEluZGV4T2YoZGVsaW1pdGVyLCBjYXJldFBvcyAtIDEpO1xuICAgIGNvbnN0IGZpcnN0Q29tbWFBZnRlckNhcmV0OiBudW1iZXIgPSBzZXBhcmF0ZWRWYWx1ZXMuaW5kZXhPZihkZWxpbWl0ZXIsIGNhcmV0UG9zKTtcblxuICAgIGlmIChsYXN0Q29tbWFCZWZvcmVDYXJldCA9PT0gLTEgJiYgZmlyc3RDb21tYUFmdGVyQ2FyZXQgIT09IC0xKSB7XG4gICAgICByZXR1cm4gc2VwYXJhdGVkVmFsdWVzLnNwbGl0KGRlbGltaXRlcilbMF0/LnRyaW0oKSA/PyBcIlwiO1xuICAgIH1cblxuICAgIGlmIChsYXN0Q29tbWFCZWZvcmVDYXJldCAhPT0gLTEgJiYgZmlyc3RDb21tYUFmdGVyQ2FyZXQgPT09IC0xKSB7XG4gICAgICByZXR1cm4gc2VwYXJhdGVkVmFsdWVzLnN1YnN0cmluZyhsYXN0Q29tbWFCZWZvcmVDYXJldCArIDEpLnRyaW0oKTtcbiAgICB9XG5cbiAgICBpZiAobGFzdENvbW1hQmVmb3JlQ2FyZXQgPT09IC0xIHx8IGZpcnN0Q29tbWFBZnRlckNhcmV0ID09PSAtMSB8fCBsYXN0Q29tbWFCZWZvcmVDYXJldCA+PSBmaXJzdENvbW1hQWZ0ZXJDYXJldCkge1xuICAgICAgcmV0dXJuIHNlcGFyYXRlZFZhbHVlcy50cmltKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlcGFyYXRlZFZhbHVlcy5zdWJzdHJpbmcobGFzdENvbW1hQmVmb3JlQ2FyZXQgKyAxLCBmaXJzdENvbW1hQWZ0ZXJDYXJldCkudHJpbSgpO1xuICB9XG59XG4vLyAjcmVnaW9uIFRvb2xzXG4vKipcbiAqIEdldHMgdGhlIHtAbGluayBIVE1MRWxlbWVudC5uZXh0RWxlbWVudFNpYmxpbmcgbmV4dCBlbGVtZW50IHNpYmxpbmd9IG9mIHRoZSBnaXZlbiBlbGVtZW50IHdoZW4gaXQgaXMgYW4gSFRNTEVsZW1lbnQuXG4gKiBJZiBub3QsIHJldHVybnMgbnVsbC5cbiAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIGdldCB0aGUgbmV4dCBzaWJsaW5nIG9mLlxuICogQHJldHVybnMgVGhlIG5leHQgZWxlbWVudCBzaWJsaW5nIGlmIGl0IGlzIGFuIEhUTUxFbGVtZW50LCBvdGhlcndpc2UgbnVsbC5cbiAqL1xuZnVuY3Rpb24gbmV4dEVsZW1lbnRTaWJsaW5nKGVsZW1lbnQ6IEVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkKTogSFRNTEVsZW1lbnQgfCBudWxsIHtcbiAgY29uc3Qgc2libGluZyA9IGVsZW1lbnQ/Lm5leHRFbGVtZW50U2libGluZztcbiAgcmV0dXJuIHNpYmxpbmcgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCA/IHNpYmxpbmcgOiBudWxsO1xufVxuLyoqXG4gKiBHZXRzIHRoZSB7QGxpbmsgSFRNTEVsZW1lbnQucHJldmlvdXNFbGVtZW50U2libGluZyBwcmV2aW91cyBlbGVtZW50IHNpYmxpbmd9IG9mIHRoZSBnaXZlbiBlbGVtZW50IHdoZW4gaXQgaXMgYW4gSFRNTEVsZW1lbnQuXG4gKiBJZiBub3QsIHJldHVybnMgbnVsbC5cbiAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIGdldCB0aGUgcHJldmlvdXMgc2libGluZyBvZi5cbiAqIEByZXR1cm5zIFRoZSBwcmV2aW91cyBlbGVtZW50IHNpYmxpbmcgaWYgaXQgaXMgYW4gSFRNTEVsZW1lbnQsIG90aGVyd2lzZSBudWxsLlxuICovXG5mdW5jdGlvbiBwcmV2aW91c0VsZW1lbnRTaWJsaW5nKGVsZW1lbnQ6IEVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkKTogSFRNTEVsZW1lbnQgfCBudWxsIHtcbiAgY29uc3Qgc2libGluZyA9IGVsZW1lbnQ/LnByZXZpb3VzRWxlbWVudFNpYmxpbmc7XG4gIHJldHVybiBzaWJsaW5nIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQgPyBzaWJsaW5nIDogbnVsbDtcbn1cbi8vICNlbmRyZWdpb24gVG9vbHNcbiIsICIvLyAjcmVnaW9uIEltcG9ydHNcbi8vICNyZWdpb24gWERCQ1xuaW1wb3J0IHsgREJDIH0gZnJvbSBcInhkYmMvc3JjL0RCQ1wiO1xuaW1wb3J0IHsgT1IgfSBmcm9tIFwieGRiYy9zcmMvREJDL09SXCI7XG5pbXBvcnQgeyBFUSB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvRVFcIjtcbmltcG9ydCB7IElOU1RBTkNFIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9JTlNUQU5DRVwiO1xuaW1wb3J0IHsgREVGSU5FRCB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvREVGSU5FRFwiO1xuLy8gI2VuZHJlZ2lvbiBYREJDXG5pbXBvcnQgeyBTVk1hbmFnZXIgfSBmcm9tIFwiLi9TVk1hbmFnZXIuanNcIjtcbi8vICNlbmRyZWdpb24gSW1wb3J0c1xuLyoqXG4gKiBBIHtAbGluayBIVE1MRGl2RWxlbWVudCB9IHRoYXQgbWFuYWdlcyB0aGUgKiplKipsZW1lbnQgKipwKipsYWNlaG9sZGVyIHdpdGhpbiBhbiB7QGxpbmsgSFRNTElucHV0RWxlbWVudCB9XG4gKiBvZiB0eXBlICoqdGV4dCoqIGJhY2tlZCBieSB0aGUge0BsaW5rIFNWTWFuYWdlciB9J3MgZnVuY3Rpb25hbGl0eS4gKi9cbmV4cG9ydCBjbGFzcyBFUE1hbmFnZXIgZXh0ZW5kcyBTVk1hbmFnZXIge1xuICAvKiogSG9sZHMgdGhlIHdlYi1jb21wb25lbnQgZGVmaW5pdGlvbiBvZiBvYnNlcnZlZCBhdHRyaWJ1dGVzLiAqL1xuICBzdGF0aWMgb3ZlcnJpZGUgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpOiBBcnJheTxzdHJpbmc+IHtcbiAgICByZXR1cm4gWy4uLlNWTWFuYWdlci5vYnNlcnZlZEF0dHJpYnV0ZXMsIFwibW9kZVwiLCBcImVwb3B0aW9uc1wiXTtcbiAgfVxuICAvKiogSG9sZHMgdGhlIHtAbGluayBTVk1hbmFnZXIub3B0aW9ucyB9IHdoZW4gaW4gXCIqKlNWKipcIi17QGxpbmsgbW9kZSB9LiovXG4gIHByb3RlY3RlZCBfYnVmZmVyT3B0aW9uczogQXJyYXk8c3RyaW5nPiB8IHVuZGVmaW5lZDtcbiAgLyoqIEhvbGRzIHRoZSB7QGxpbmsgc3RyaW5nIH1zIHRoYXQgY29uc3RpdHV0ZSB0aGUgYXZhaWxhYmxlICoqZSoqbGVtZW50ICoqcCoqbGFjZWhvbGRlci4gKi9cbiAgcHJvdGVjdGVkIF9lcE9wdGlvbnM6IEFycmF5PHN0cmluZz4gfCB1bmRlZmluZWQ7XG4gIC8qKlxuICAgKiBHZXRzIHRoZSB7QGxpbmsgRVBNYW5hZ2VyLl9lcE9wdGlvbnMgfS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHtAbGluayBFUE1hbmFnZXIuX2VwT3B0aW9ucyB9LiAqL1xuICBwdWJsaWMgZ2V0IGVwT3B0aW9ucygpOiBBcnJheTxzdHJpbmc+IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fZXBPcHRpb25zO1xuICB9XG4gIC8qKlxuICAgKiBTZXRzIHRoZSB7QGxpbmsgRVBNYW5hZ2VyLl9lcE9wdGlvbnMgfS5cbiAgICpcbiAgICogQHBhcmFtIHRvU2V0IFRoZSB7QGxpbmsgRVBNYW4uX2VwT3B0aW9ucyB9LiAqL1xuICBwdWJsaWMgc2V0IGVwT3B0aW9ucyh0b1NldDogQXJyYXk8c3RyaW5nPikge1xuICAgIHRoaXMuX2VwT3B0aW9ucyA9IHRvU2V0O1xuICB9XG4gIC8qKiBTdGF0ZXMgdGhlIGN1cnJlbnQgbW9kZSB0aGlzIHtAbGluayBFUE1hbmFnZXIgfSBpcyBpbiAoXCIqKlNWKipcIiBpcyB0aGUgb3JpZ2luYWwgKipzKiplcGFyYXRlZCAqKnYqKmFsdWUgbWFuYWdlclxuICAgKiBvbmUgd2hpbGUgXCIqKkVQKipcIiBpcyB0aGUgKiplKipsZW1lbnQgKipwKipsYWNlaG9sZGVyIG1vZGUpLiAqL1xuICBwcm90ZWN0ZWQgX21vZGU6IFwiU1ZcIiB8IFwiRVBcIiA9IFwiU1ZcIjtcbiAgLyoqIFN0b3JlIHRoZSBwb3NpdGlvbiBvZiB0aGUge0BsaW5rIFNWTWFuYWdlci50YXJnZXQgfSdzIGNhcmV0IHdoZW4gdGhlIGlucHV0IG9mXG4gICAqIGFuICoqZSoqbGVtZW50ICoqcCoqbGFjZWhvbGRlciBzdGFydGVkLiAqL1xuICBwcm90ZWN0ZWQgY3VycmVudFN0YXJ0Q2FyZXQ6IG51bWJlciB8IHVuZGVmaW5lZCB8IG51bGw7XG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IHtAbGluayBFUE1hbmFnZXIuX21vZGUgfS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGN1cnJlbnQge0BsaW5rIEVQTWFuYWdlci5fbW9kZSB9LiAqL1xuICBwdWJsaWMgZ2V0IG1vZGUoKTogXCJTVlwiIHwgXCJFUFwiIHtcbiAgICByZXR1cm4gdGhpcy5fbW9kZTtcbiAgfVxuICAvKiogSGlkZXMgdGhlIGNoZWNrYm94ZXMgYWZ0ZXIge0BsaW5rIFNWTWFuYWdlci5yZW5kZXIgfWluZyBpZiB7QGxpbmsgRVBNYW5hZ2VyLm1vZGUgfSBpcyBzZXQgdG8gXCJFUFwiLiAqL1xuICBwcm90ZWN0ZWQgb3ZlcnJpZGUgcmVuZGVyKCk6IHZvaWQge1xuICAgIHN1cGVyLnJlbmRlcigpO1xuXG4gICAgaWYgKHRoaXMubW9kZSA9PT0gXCJFUFwiKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoZWNrYm94IG9mIERFRklORUQudHNDaGVjazxTaGFkb3dSb290Pih0aGlzLnNoYWRvd1Jvb3QpLnF1ZXJ5U2VsZWN0b3JBbGwoJ1sgcGFydCA9IFwiT3B0aW9uaW5wdXRcIl0nKSkge1xuICAgICAgICBjb25zdCBjYiA9IElOU1RBTkNFLnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KGNoZWNrYm94LCBIVE1MRWxlbWVudCk7XG5cbiAgICAgICAgY2Iuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuXG4gICAgICAgIGNvbnN0IHRleHQgPSBJTlNUQU5DRS50c0NoZWNrPEhUTUxFbGVtZW50PihcbiAgICAgICAgICBERUZJTkVELnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KGNiLnBhcmVudEVsZW1lbnQpLnF1ZXJ5U2VsZWN0b3IoJ1sgcGFydCA9IFwiT3B0aW9udGV4dFwiXScpLFxuICAgICAgICAgIEhUTUxFbGVtZW50LFxuICAgICAgICApO1xuXG4gICAgICAgIHRleHQuc3R5bGUubWFyZ2luTGVmdCA9IFwiYXV0b1wiO1xuICAgICAgICB0ZXh0LnN0eWxlLm1hcmdpblJpZ2h0ID0gXCJhdXRvXCI7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjdXJyZW50IHtAbGluayBFUE1hbmFnZXIubW9kZSB9IHN3aXRjaGluZyB0aGUge0BsaW5rIFNWTWFuYWdlci5vcHRpb25zIH0gd2l0aCB0aGVcbiAgICoge0BsaW5rIEVQTWFuYWdlci5lcE9wdGlvbnN9IHdoZW4gc2V0IHRvIFwiKipFUCoqXCIgYW5kIHZpY2UgdmVyc2EuICovXG4gIHB1YmxpYyBzZXQgbW9kZSh0b1NldDogXCJTVlwiIHwgXCJFUFwiKSB7XG4gICAgaWYgKHRoaXMuX21vZGUgPT09IHRvU2V0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fbW9kZSA9IHRvU2V0O1xuXG4gICAgaWYgKHRoaXMuX21vZGUgPT09IFwiU1ZcIiAmJiB0aGlzLl9idWZmZXJPcHRpb25zICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMub3B0aW9ucyA9IHRoaXMuX2J1ZmZlck9wdGlvbnM7XG5cbiAgICAgIHRoaXMucmVuZGVyKCk7XG5cbiAgICAgIGZvciAoY29uc3QgY2hlY2tib3ggb2YgREVGSU5FRC50c0NoZWNrPFNoYWRvd1Jvb3Q+KHRoaXMuc2hhZG93Um9vdCkucXVlcnlTZWxlY3RvckFsbCgnWyBwYXJ0ID0gXCJPcHRpb25pbnB1dFwiXScpKSB7XG4gICAgICAgIElOU1RBTkNFLnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KGNoZWNrYm94LCBIVE1MRWxlbWVudCkuc3R5bGUuZGlzcGxheSA9IFwiaW5saW5lLWJsb2NrXCI7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLl9lcE9wdGlvbnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLmN1cnJlbnRTdGFydENhcmV0ID0gdGhpcy50YXJnZXQ/LnNlbGVjdGlvblN0YXJ0O1xuXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IHRoaXMuX2VwT3B0aW9ucztcblxuICAgICAgICB0aGlzLnJlbmRlcigpO1xuXG4gICAgICAgIGZvciAoY29uc3QgY2hlY2tib3ggb2YgREVGSU5FRC50c0NoZWNrPFNoYWRvd1Jvb3Q+KHRoaXMuc2hhZG93Um9vdCkucXVlcnlTZWxlY3RvckFsbChcbiAgICAgICAgICAnWyBwYXJ0ID0gXCJPcHRpb25pbnB1dFwiXScsXG4gICAgICAgICkpIHtcbiAgICAgICAgICBjb25zdCBjYiA9IElOU1RBTkNFLnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KGNoZWNrYm94LCBIVE1MRWxlbWVudCk7XG5cbiAgICAgICAgICBjYi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG5cbiAgICAgICAgICBjb25zdCB0ZXh0ID0gSU5TVEFOQ0UudHNDaGVjazxIVE1MRWxlbWVudD4oXG4gICAgICAgICAgICBERUZJTkVELnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KGNiLnBhcmVudEVsZW1lbnQpLnF1ZXJ5U2VsZWN0b3IoJ1sgcGFydCA9IFwiT3B0aW9udGV4dFwiXScpLFxuICAgICAgICAgICAgSFRNTEVsZW1lbnQsXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHRleHQuc3R5bGUubWFyZ2luTGVmdCA9IFwiYXV0b1wiO1xuICAgICAgICAgIHRleHQuc3R5bGUubWFyZ2luUmlnaHQgPSBcImF1dG9cIjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogQ3JlYXRlcyB0aGlzIHtAbGluayBFUE1hbmFnZXIgfSBieSBhc3NpZ25pbmcgdGhlIHtAbGluayBTVk1hbmFnZXIub3B0aW9ucyB9IHRvIHRoZVxuICAgKiB7QGxpbmsgRVBNYW5hZ2VyLl9idWZmZXJPcHRpb25zIH0gZm9yIGxhdGVyIHVzZS4gKi9cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMuX2J1ZmZlck9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgLy8gI3JlZ2lvbiBQcm92aWRlIFVwZGF0ZSB2aWEgUGx1Z2luRGF0YVxuICAgIHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEudXBkYXRlRVBNYW5hZ2VyID0gKG9wdGlvbnM6IHN0cmluZykgPT4ge1xuICAgICAgdGhpcy5lcE9wdGlvbnMgPSBKU09OLnBhcnNlKG9wdGlvbnMpLm1hcCgoZTogc3RyaW5nKSA9PiBlLnJlcGxhY2UoXCIudHNcIiwgXCJcIikpO1xuICAgICAgLy8gI3JlZ2lvbiBJbnZhbGlkYXRlIG1vZGUgc28gdGhhdCBvbiBzZXR0aW5nIHRvIEVQIGl0IHdpbGwgcmVyZW5kZXIuXG4gICAgICB0aGlzLm1vZGUgPSBcIlNWXCI7XG4gICAgICB0aGlzLm1vZGUgPSBcIkVQXCI7XG4gICAgICAvLyAjZW5kcmVnaW9uIEludmFsaWRhdGUgbW9kZSBzbyB0aGF0IG9uIHNldHRpbmcgdG8gRVAgaXQgd2lsbCByZXJlbmRlci5cbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfTtcbiAgICAvLyAjZW5kcmVnaW9uIFByb3ZpZGUgVXBkYXRlIHZpYSBQbHVnaW5EYXRhXG4gIH1cbiAgLyoqXG4gICAqIFN0YXRlcyB3aGV0aGVyIHRoaXMge0BsaW5rIEVQTWFuYWdlciB9IHdhcyBzdWNjZXNzZnVsbHkgcmVnaXN0ZXJlZCBhcyBhIGN1c3RvbSBlbGVtZW50IGFuZCBwZXJmb3Jtc1xuICAgKiB0aGUgcmVnaXN0cmF0aW9uIHVwb24gY2xhc3MgdXNhZ2UuXG4gICAqXG4gICAqIEB0aHJvd3MgU2VlIHtAbGluayB3aW5kb3cuY3VzdG9tRWxlbWVudHMgfSdzICoqZGVmaW5lKiogbWV0aG9kLiAqL1xuICBwdWJsaWMgc3RhdGljIG92ZXJyaWRlIHJlZ2lzdGVyZWQ6IGJvb2xlYW4gPSAoKCkgPT4ge1xuICAgIGN1c3RvbUVsZW1lbnRzLmRlZmluZShcInhjLWVwbWFuYWdlclwiLCBFUE1hbmFnZXIsIHsgZXh0ZW5kczogXCJkaXZcIiB9KTtcblxuICAgIHJldHVybiB0cnVlO1xuICB9KSgpO1xuICAvKipcbiAgICogUHJvY2Vzc2VzIGNoYW5nZXMgaW4gdGhlIHtAbGluayBFUE1hbmFnZXIgfSdzIHN5c3RlbSBhdHRyaWJ1dGVzLlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSAgICAgIFRoZSBjaGFuZ2VkIGF0dHJpYnV0ZSdzIG5hbWUuXG4gICAqIEBwYXJhbSBvbGRWYWx1ZSAgVGhlIGNoYW5nZWQgYXR0cmlidXRlJ3MgZm9ybWVyIHZhbHVlLlxuICAgKiBAcGFyYW0gbmV3VmFsdWUgIFRoZSBjaGFuZ2VkIGF0dHJpYnV0ZSdzIGN1cnJlbnQgdmFsdWUuICovXG4gIEBEQkMuUGFyYW12YWx1ZVByb3ZpZGVyXG4gIG92ZXJyaWRlIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhcbiAgICBAT1IuUFJFKFtcbiAgICAgIG5ldyBFUShcIm9wdGlvbnNcIiksXG4gICAgICBuZXcgRVEoXCJzZXBhcmF0b3JcIiksXG4gICAgICBuZXcgRVEoXCJlbmFibGVkXCIpLFxuICAgICAgbmV3IEVRKFwiY3NzZW5hYmxlZFwiKSxcbiAgICAgIG5ldyBFUShcImNzc2Rpc2FibGVkXCIpLFxuICAgICAgbmV3IEVRKFwiZXBvcHRpb25zXCIpLFxuICAgICAgbmV3IEVRKFwibW9kZVwiKSxcbiAgICBdKVxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBvbGRWYWx1ZTogc3RyaW5nLFxuICAgIG5ld1ZhbHVlOiBzdHJpbmcsXG4gICk6IHZvaWQge1xuICAgIGlmIChuYW1lICE9PSBcImVwb3B0aW9uc1wiICYmIG5hbWUgIT09IFwibW9kZVwiKSB7XG4gICAgICBzdXBlci5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgIGNhc2UgXCJlcG9wdGlvbnNcIjpcbiAgICAgICAgdGhpcy5lcE9wdGlvbnMgPSBuZXdWYWx1ZS5zcGxpdCh0aGlzLnNlcGFyYXRvcik7XG5cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwibW9kZVwiOlxuICAgICAgICB0aGlzLm1vZGUgPSBPUi50c0NoZWNrPFwiU1ZcIiB8IFwiRVBcIj4obmV3VmFsdWUsIFtuZXcgRVEoXCJTVlwiKSwgbmV3IEVRKFwiRVBcIildKTtcblxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgLy8gI3JlZ2lvbiBGaWx0ZXJpbmdcbiAgLyoqIFN0b3JlcyB0aGUge0BsaW5rIHN0cmluZyB9IHRoZSB7QGxpbmsgU1ZNYW5hZ2VyLm9wdGlvbnMgfSBpbiAqKkVQKiote0BsaW5rIEVQTWFuYWdlci5tb2RlIH0gc2hhbGwgYmVcbiAgICogIGZpbHRlcmVkIGJ5LiAqL1xuICBwcm90ZWN0ZWQgY3VycmVudEZpbHRlciA9IFwiXCI7XG4gIC8qKiBTdG9yZXMgdGhlIGFtb3VudCBvZiBkaWdpdHMgYW5kIGxldHRlcnMgZW50ZXJlZCBpbnRvIHRoZSB7QGxpbmsgU1ZNYW5hZ2VyLnRhcmdldCB9IGFmdGVyXG4gICAqICAqKkFMVCoqKyoqRSoqIHdhcyBwcmVzc2VkLiAqL1xuICBwcm90ZWN0ZWQgY291bnRTdHJva2VzID0gMDtcbiAgLyoqIFN0YXRlcyB3aGV0aGVyIHRoZSB7QGxpbmsgRVBNYW5hZ2VyIH0gaXMgY3VycmVudGx5IGludG8gdGhlIHByb2Nlc3Mgb2YgZW50ZXJpbmcgYW4gKiplKipsZW1lbnQgKipwKipsYWNlaG9sZGVyLiAqL1xuICBwdWJsaWMgZW50ZXJpbmdFUCA9IGZhbHNlO1xuICAvKipcbiAgICogV2hlbiBpbiAqKkVQKiote0BsaW5rIEVQTWFuYWdlci5tb2RlIH0gdGhpcyBtZXRob2QgZmlsdGVycyB0aGUge0BsaW5rIFNWTWFuYWdlci5vcHRpb25zIH0gYnkge0BsaW5rIEVQTWFuYWdlci5jdXJyZW50RmlsdGVyIH0uXG4gICAqIE90aGVyd2lzZSB7QGxpbmsgU1ZNYW5hZ2VyLmZpbHRlciB9IGlzIGludm9rZWQuXG4gICAqXG4gICAqIEBwYXJhbSBldmVudCBUaGUge0BsaW5rIEV2ZW50IH0gcmVjZWl2ZWQuICovXG4gIHByb3RlY3RlZCBvdmVycmlkZSBvbklucHV0VGFyZ2V0KGV2ZW50OiBFdmVudCk6IHZvaWQge1xuICAgIGlmICh0aGlzLm1vZGUgPT09IFwiRVBcIikge1xuICAgICAgY29uc3QgcmVtYWluaW5nT3B0aW9ucyA9IHRoaXMuZmlsdGVyKHRoaXMuY3VycmVudEZpbHRlcik7XG5cbiAgICAgIGNvbnN0IHNoYWRvdyA9IERFRklORUQudHNDaGVjazxTaGFkb3dSb290Pih0aGlzLnNoYWRvd1Jvb3QpO1xuXG4gICAgICBzaGFkb3cucXVlcnlTZWxlY3RvcihcIi4tLS1XYVhDb2RlLi0tU1ZNYW5hZ2VyLi0tT3B0aW9uLi1DdXJyZW50XCIpPy5jbGFzc0xpc3QucmVtb3ZlKFwiLUN1cnJlbnRcIik7XG4gICAgICBERUZJTkVELnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KFxuICAgICAgICBJTlNUQU5DRS50c0NoZWNrPEhUTUxEaXZFbGVtZW50PihcbiAgICAgICAgICBzaGFkb3cucXVlcnlTZWxlY3RvcihgLi0tLVdhWENvZGUuLS1TVk1hbmFnZXIuLS1PcHRpb25bIGRhdGEtY2Itb3B0aW9uID0gXCIke3JlbWFpbmluZ09wdGlvbnNbMF19XCJdYCksXG4gICAgICAgICAgSFRNTERpdkVsZW1lbnQsXG4gICAgICAgICksXG4gICAgICApLmNsYXNzTGlzdC5hZGQoXCItQ3VycmVudFwiKTtcblxuICAgICAgaWYgKHRoaXMubGFzdEtleSAhPT0gXCJCYWNrc3BhY2VcIiAmJiB0aGlzLmxhc3RLZXkgIT09IFwiRGVsZXRlXCIgJiYgcmVtYWluaW5nT3B0aW9ucy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgY29uc3QgZXZlbnRUYXJnZXQgPSBJTlNUQU5DRS50c0NoZWNrPEhUTUxJbnB1dEVsZW1lbnQ+KGV2ZW50LnRhcmdldCwgSFRNTElucHV0RWxlbWVudCk7XG4gICAgICAgIGNvbnN0IGlucHV0RWxlbWVudCA9IElOU1RBTkNFLnRzQ2hlY2s8SFRNTElucHV0RWxlbWVudD4odGhpcy50YXJnZXQsIEhUTUxJbnB1dEVsZW1lbnQpO1xuXG4gICAgICAgIGxldCBzZWxlY3Rpb25TdGFydCA9IERFRklORUQudHNDaGVjazxudW1iZXI+KGV2ZW50VGFyZ2V0LnNlbGVjdGlvblN0YXJ0KTtcblxuICAgICAgICBjb25zdCByZW1haW5pbmdPbmUgPSBpbnB1dEVsZW1lbnQudmFsdWUuc3Vic3RyaW5nKDAsIHNlbGVjdGlvblN0YXJ0IC0gdGhpcy5jdXJyZW50RmlsdGVyLmxlbmd0aCk7XG4gICAgICAgIGNvbnN0IHJlbWFpbmluZ1R3byA9IGlucHV0RWxlbWVudC52YWx1ZS5zdWJzdHJpbmcoc2VsZWN0aW9uU3RhcnQpO1xuXG4gICAgICAgIGlucHV0RWxlbWVudC52YWx1ZSA9IHJlbWFpbmluZ09uZSArIHJlbWFpbmluZ1R3bztcblxuICAgICAgICBzZWxlY3Rpb25TdGFydCA9IHNlbGVjdGlvblN0YXJ0IC0gdGhpcy5jdXJyZW50RmlsdGVyLmxlbmd0aDtcbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBSZW1vdmUgdGhlIGNoYXJhY3RlcnMgdGhhdCB3ZXJlIHR5cGVkIGR1cmluZyBmaWx0ZXJpbmcuXG4gICAgICAgIGNvbnN0IHNlbGVjdGVkT3B0aW9uID0gREVGSU5FRC50c0NoZWNrPHN0cmluZz4oXG4gICAgICAgICAgSU5TVEFOQ0UudHNDaGVjazxIVE1MRWxlbWVudD4oXG4gICAgICAgICAgICBERUZJTkVELnRzQ2hlY2s8U2hhZG93Um9vdD4odGhpcy5zaGFkb3dSb290KS5xdWVyeVNlbGVjdG9yKFwiLi0tLVdhWENvZGUuLS1TVk1hbmFnZXIuLS1PcHRpb24uLUN1cnJlbnRcIiksXG4gICAgICAgICAgICBIVE1MRWxlbWVudCxcbiAgICAgICAgICApLmRhdGFzZXQuY2JPcHRpb24sXG4gICAgICAgICk7XG5cbiAgICAgICAgZXZlbnRUYXJnZXQudmFsdWUgPSBgJHtldmVudFRhcmdldC52YWx1ZS5zdWJzdHJpbmcoMCwgc2VsZWN0aW9uU3RhcnQgLSAxKX17ICR7c2VsZWN0ZWRPcHRpb259ID4gIH0gJHtldmVudFRhcmdldC52YWx1ZS5zdWJzdHJpbmcoc2VsZWN0aW9uU3RhcnQpfWA7XG5cbiAgICAgICAgZXZlbnRUYXJnZXQuc2V0U2VsZWN0aW9uUmFuZ2UoXG4gICAgICAgICAgc2VsZWN0aW9uU3RhcnQgKyBzZWxlY3RlZE9wdGlvbi5sZW5ndGggKyA1LFxuICAgICAgICAgIHNlbGVjdGlvblN0YXJ0ICsgc2VsZWN0ZWRPcHRpb24ubGVuZ3RoICsgNSxcbiAgICAgICAgKTtcblxuICAgICAgICB0aGlzLmN1cnJlbnRTdGFydENhcmV0ID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLmN1cnJlbnRGaWx0ZXIgPSBcIlwiO1xuICAgICAgICB0aGlzLmNvdW50U3Ryb2tlcyA9IDA7XG4gICAgICAgIHRoaXMuZW50ZXJpbmdFUCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcblxuICAgICAgICBmb3IgKGNvbnN0IGhhbmRsZXIgb2YgdGhpcy5vbkF1dG9jb21wbGV0ZSkge1xuICAgICAgICAgIGhhbmRsZXIocmVtYWluaW5nT3B0aW9uc1swXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3VwZXIub25JbnB1dFRhcmdldChldmVudCk7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBXaGVuIGluICoqRVAqKi17QGxpbmsgRVBNYW5hZ2VyLm1vZGUgfSBrZWVwcyB0cmFjayBpZiB0aGUgZW50ZXJlZCBkaWdpdHMgYW5kIGxldHRlcnMgdG8gZmlsdGVyXG4gICAqIHRoZSB7QGxpbmsgU1ZNYW5hZ2VyLm9wdGlvbnMgfSBpbnZva2luZyB7QGxpbmsgU1ZNYW5hZ2VyLm9uS2V5ZG93blRhcmdldCB9IHdoZW4gYXBwcm9wcmlhdGUgb3JcbiAgICogbm90IGluICoqRVAqKi17QGxpbmsgRVBNYW5hZ2VyLm1vZGUgfS5cbiAgICpcbiAgICogQHBhcmFtIGV2ZW50IFRoZSB7QGxpbmsgS2V5Ym9hcmRFdmVudCB9LiAqL1xuICBwcm90ZWN0ZWQgb3ZlcnJpZGUgb25LZXlkb3duVGFyZ2V0KGV2ZW50OiBLZXlib2FyZEV2ZW50KTogdm9pZCB7XG4gICAgaWYgKHRoaXMubW9kZSA9PT0gXCJFUFwiKSB7XG4gICAgICBjb25zdCBldmVudFRhcmdldCA9IElOU1RBTkNFLnRzQ2hlY2s8SFRNTElucHV0RWxlbWVudD4oZXZlbnQudGFyZ2V0LCBIVE1MSW5wdXRFbGVtZW50KTtcblxuICAgICAgbGV0IHNlbGVjdGlvblN0YXJ0ID0gREVGSU5FRC50c0NoZWNrPG51bWJlcj4oZXZlbnRUYXJnZXQuc2VsZWN0aW9uU3RhcnQpO1xuXG4gICAgICBpZiAoZXZlbnQua2V5ICE9PSBcIiBcIiAmJiBldmVudC5rZXkgIT09IFwiRW50ZXJcIikge1xuICAgICAgICBzdXBlci5vbktleWRvd25UYXJnZXQoZXZlbnQpO1xuICAgICAgICAvLyAjcmVnaW9uIEtlZXAgdHJhY2sgb2YgZGlnaXRzIGFuZCBsZXR0ZXIgaW5wdXRcbiAgICAgICAgaWYgKHRoaXMuZW50ZXJpbmdFUCAmJiAvXlthLXpBLVowLTldJC8udGVzdChldmVudC5rZXkpKSB7XG4gICAgICAgICAgaWYgKHRoaXMuY3VycmVudFN0YXJ0Q2FyZXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50U3RhcnRDYXJldCA9IGV2ZW50VGFyZ2V0LnNlbGVjdGlvblN0YXJ0O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuY291bnRTdHJva2VzKys7XG4gICAgICAgICAgdGhpcy5jdXJyZW50RmlsdGVyICs9IGV2ZW50LmtleTtcbiAgICAgICAgICB0aGlzLmVuYWJsZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIC8vICNlbmRyZWdpb24gS2VlcCB0cmFjayBvZiBkaWdpdHMgYW5kIGxldHRlciBpbnB1dFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gI3JlZ2lvbiBJbmplY3Qgc2VsZWN0ZWQgb3B0aW9uIGludG8gdGhlIHtAbGluayBTVk1hbmFnZXIudGFyZ2V0IH0gYW5kIGNsb3NlIFtlbnRlcmluZ0VQXS1tb2RlXG4gICAgICAgIGlmICh0aGlzLmVudGVyaW5nRVApIHtcbiAgICAgICAgICAvLyAjcmVnaW9uIFJlbW92ZSB0aGUgY2hhcmFjdGVycyB0aGF0IHdlcmUgdHlwZWQgZHVyaW5nIGZpbHRlcmluZy5cbiAgICAgICAgICBjb25zdCBpbnB1dEVsZW1lbnQgPSBJTlNUQU5DRS50c0NoZWNrPEhUTUxJbnB1dEVsZW1lbnQ+KHRoaXMudGFyZ2V0LCBIVE1MSW5wdXRFbGVtZW50KTtcblxuICAgICAgICAgIGNvbnN0IHJlbWFpbmluZ09uZSA9IGlucHV0RWxlbWVudC52YWx1ZS5zdWJzdHJpbmcoMCwgc2VsZWN0aW9uU3RhcnQgLSB0aGlzLmN1cnJlbnRGaWx0ZXIubGVuZ3RoKTtcbiAgICAgICAgICBjb25zdCByZW1haW5pbmdUd28gPSBpbnB1dEVsZW1lbnQudmFsdWUuc3Vic3RyaW5nKHNlbGVjdGlvblN0YXJ0KTtcblxuICAgICAgICAgIGlucHV0RWxlbWVudC52YWx1ZSA9IHJlbWFpbmluZ09uZSArIHJlbWFpbmluZ1R3bztcblxuICAgICAgICAgIHNlbGVjdGlvblN0YXJ0ID0gc2VsZWN0aW9uU3RhcnQgLSB0aGlzLmN1cnJlbnRGaWx0ZXIubGVuZ3RoO1xuICAgICAgICAgIC8vICNlbmRyZWdpb24gUmVtb3ZlIHRoZSBjaGFyYWN0ZXJzIHRoYXQgd2VyZSB0eXBlZCBkdXJpbmcgZmlsdGVyaW5nLlxuICAgICAgICAgIGNvbnN0IHNlbGVjdGVkT3B0aW9uID0gREVGSU5FRC50c0NoZWNrPHN0cmluZz4oXG4gICAgICAgICAgICBJTlNUQU5DRS50c0NoZWNrPEhUTUxFbGVtZW50PihcbiAgICAgICAgICAgICAgREVGSU5FRC50c0NoZWNrPFNoYWRvd1Jvb3Q+KHRoaXMuc2hhZG93Um9vdCkucXVlcnlTZWxlY3RvcihcIi4tLS1XYVhDb2RlLi0tU1ZNYW5hZ2VyLi0tT3B0aW9uLi1DdXJyZW50XCIpLFxuICAgICAgICAgICAgICBIVE1MRWxlbWVudCxcbiAgICAgICAgICAgICkuZGF0YXNldC5jYk9wdGlvbixcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgZXZlbnRUYXJnZXQudmFsdWUgPSBgJHtldmVudFRhcmdldC52YWx1ZS5zdWJzdHJpbmcoMCwgc2VsZWN0aW9uU3RhcnQgLSAxKX0geyAke3NlbGVjdGVkT3B0aW9ufSA+IH0gJHtldmVudFRhcmdldC52YWx1ZS5zdWJzdHJpbmcoc2VsZWN0aW9uU3RhcnQpfWA7XG5cbiAgICAgICAgICBldmVudFRhcmdldC5zZXRTZWxlY3Rpb25SYW5nZShcbiAgICAgICAgICAgIHNlbGVjdGlvblN0YXJ0ICsgc2VsZWN0ZWRPcHRpb24ubGVuZ3RoICsgNSxcbiAgICAgICAgICAgIHNlbGVjdGlvblN0YXJ0ICsgc2VsZWN0ZWRPcHRpb24ubGVuZ3RoICsgNSxcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgdGhpcy5jdXJyZW50U3RhcnRDYXJldCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICB0aGlzLmN1cnJlbnRGaWx0ZXIgPSBcIlwiO1xuICAgICAgICAgIHRoaXMuY291bnRTdHJva2VzID0gMDtcbiAgICAgICAgICB0aGlzLmVudGVyaW5nRVAgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcblxuICAgICAgICAgIGZvciAoY29uc3QgaGFuZGxlciBvZiB0aGlzLm9uT3B0aW9uU2VsZWN0ZWQpIHtcbiAgICAgICAgICAgIGhhbmRsZXIoc2VsZWN0ZWRPcHRpb24gPz8gXCJcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vICNlbmRyZWdpb24gSW5qZWN0IHNlbGVjdGVkIG9wdGlvbiBpbnRvIHRoZSB7QGxpbmsgU1ZNYW5hZ2VyLnRhcmdldCB9IGFuZCBjbG9zZSBbZW50ZXJpbmdFUF0tbW9kZVxuICAgICAgfVxuICAgICAgLy8gI3JlZ2lvbiBIYW5kbGUgY2hhcmFjdGVyIGRlbGV0aW9uXG4gICAgICBpZiAodGhpcy5lbnRlcmluZ0VQICYmIGV2ZW50LmtleSA9PT0gXCJEZWxldGVcIikge1xuICAgICAgICB0aGlzLmNvdW50U3Ryb2tlcy0tO1xuICAgICAgICBjb25zdCBzdGFydENhcmV0ID0gREVGSU5FRC50c0NoZWNrPG51bWJlcj4odGhpcy5jdXJyZW50U3RhcnRDYXJldCk7XG5cbiAgICAgICAgdGhpcy5jdXJyZW50RmlsdGVyID1cbiAgICAgICAgICB0aGlzLmN1cnJlbnRGaWx0ZXIuc3Vic3RyaW5nKDAsIHNlbGVjdGlvblN0YXJ0IC0gc3RhcnRDYXJldCkgK1xuICAgICAgICAgIHRoaXMuY3VycmVudEZpbHRlci5zdWJzdHJpbmcoc2VsZWN0aW9uU3RhcnQgLSBzdGFydENhcmV0ICsgMSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLmVudGVyaW5nRVAgJiYgZXZlbnQua2V5ID09PSBcIkJhY2tzcGFjZVwiKSB7XG4gICAgICAgIHRoaXMuY291bnRTdHJva2VzLS07XG4gICAgICAgIHRoaXMuY3VycmVudEZpbHRlciA9IHRoaXMuY3VycmVudEZpbHRlci5zdWJzdHJpbmcoMCwgdGhpcy5jdXJyZW50RmlsdGVyLmxlbmd0aCAtIDEpO1xuICAgICAgfVxuICAgICAgLy8gI2VuZHJlZ2lvbiBIYW5kbGUgY2hhcmFjdGVyIGRlbGV0aW9uXG4gICAgfSBlbHNlIHtcbiAgICAgIHN1cGVyLm9uS2V5ZG93blRhcmdldChldmVudCk7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBBcHByb3ByaWF0ZWx5IGRldGVybWluZXMgdGhlIHtAbGluayBFUE1hbmFnZXIuY3VycmVudEZpbHRlciB9IHdoZW4gaW4gKipFUCoqLU1vZGUuXG4gICAqXG4gICAqIEBwYXJhbSBzZXBhcmF0ZWRWYWx1ZXMgVGhlIHtAbGluayBzdHJpbmcgfSBjb250YWluaW5nIHRoZSBzZXBhcmF0ZWQgdmFsdWVzLlxuICAgKiBAcGFyYW0gZGVsaW1pdGVyICAgICAgIFRoZSB7QGxpbmsgc3RyaW5nIH0gZGVsaW1pdGluZyBlYWNoIHNlZ21lbnQuXG4gICAqIEBwYXJhbSBwb3NpdGlvbiAgICAgICAgVGhlIGN1cnJlbnQgcG9zaXRpb24gd2l0aGluIHRoZSBzZWdtZW50LlxuICAgKlxuICAgKiBAcmV0dXJucyBXaGVuIGluICoqRVAqKi1tb2RlIHRoaXMgbWV0aG9kIHJldHVybnMgdGhlIHtAbGluayBFUE1hbmFnZXIuY3VycmVudEZpbHRlciB9XG4gICAqICAgICAgICAgIG90aGVyd2lzZSBpdCB0aGUge0BsaW5rIFNWTWFuYWdlci5kZXRlcm1pbmVTZWdtZW50Y29udGVudCB9J3MgcmVzdWx0LiAqL1xuICBwcm90ZWN0ZWQgb3ZlcnJpZGUgZGV0ZXJtaW5lU2VnbWVudGNvbnRlbnQoc2VwYXJhdGVkVmFsdWVzOiBzdHJpbmcsIGRlbGltaXRlcjogc3RyaW5nLCBwb3NpdGlvbjogbnVtYmVyID0gMCk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMubW9kZSA9PT0gXCJFUFwiKSB7XG4gICAgICBjb25zdCBldmVudFRhcmdldCA9IElOU1RBTkNFLnRzQ2hlY2s8SFRNTElucHV0RWxlbWVudD4odGhpcy50YXJnZXQsIEhUTUxJbnB1dEVsZW1lbnQpO1xuXG4gICAgICBpZiAodGhpcy5jdXJyZW50U3RhcnRDYXJldCkge1xuICAgICAgICByZXR1cm4gZXZlbnRUYXJnZXQudmFsdWUuc3Vic3RyaW5nKHRoaXMuY3VycmVudFN0YXJ0Q2FyZXQsIHRoaXMuY3VycmVudFN0YXJ0Q2FyZXQgKyB0aGlzLmNvdW50U3Ryb2tlcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHN1cGVyLmRldGVybWluZVNlZ21lbnRjb250ZW50KHNlcGFyYXRlZFZhbHVlcywgZGVsaW1pdGVyLCBwb3NpdGlvbik7XG4gICAgfVxuICB9XG4gIC8vICNlbmRyZWdpb24gRmlsdGVyaW5nXG59XG4iLCAiLy8gI3JlZ2lvbiBJbXBvcnRzXG4vLyAjcmVnaW9uIFhJTUFcbmltcG9ydCB7ICQsIENhbGxiYWNrcywgRWRpdG9ycywgdHlwZSBJUHJvcGVydHlEZXNjcmlwdG9yLCB0eXBlIFRFZGl0b3JDZmcgfSBmcm9tIFwiQGRlLXhpbWEvZmMtZm9ybS1kZXNpZ25lclwiO1xuaW1wb3J0IHsgcGFyc2VTdHJpbmcgfSBmcm9tIFwiQGRlLXhpbWEveGltYS1jb21tb24tanMtbGFuZ1wiO1xuLy8gI2VuZHJlZ2lvbiBYSU1BXG4vLyAjcmVnaW9uIFhEQkNcbmltcG9ydCB7IERFRklORUQgfSBmcm9tIFwieGRiYy9zcmMvREJDL0RFRklORURcIjtcbmltcG9ydCB7IElOU1RBTkNFIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9JTlNUQU5DRVwiO1xuLy8gI2VuZHJlZ2lvbiBYREJDXG4vLyAjZW5kcmVnaW9uIEltcG9ydHNcbi8qKiBEZWZpbmVzIHRoZSB0eXBlIG9mIHtAbGluayBNdWx0aVNlbGVjdCB9LiAqL1xuZXhwb3J0IGNvbnN0IE11bHRpU2VsZWN0VHlwZSA9IFwiY29tLmdpdGh1Yi54aW1hX2Zvcm1jeWNsZV9lbnR3aWNrbGVya3JlaXMuZmMucGx1Z2luOmZjLXBsdWdpbi1jb2RiaTpNdWx0aVNlbGVjdFwiO1xuLyoqIERlc2NyaWJlcyB0aGUge0BsaW5rIE11bHRpU2VsZWN0VHlwZSB9LiAqL1xuZXhwb3J0IGludGVyZmFjZSBJTXVsdGlTZWxlY3REZXNjcmlwdG9yIGV4dGVuZHMgSVByb3BlcnR5RGVzY3JpcHRvcjx0eXBlb2YgTXVsdGlTZWxlY3RUeXBlPiB7fVxuLyoqIEF1Z21lbnRpbmcgKipAZGUteGltYS9mYy1mb3JtLWRlc2lnbmVyKiogaW4gb3JkZXIgdG8gYWRkIHRoZSB7QGxpbmsgTXVsdGlTZWxlY3RUeXBlIH0gdG8ge0BsaW5rIElFZGl0b3JNYXAgfS4qL1xuZGVjbGFyZSBtb2R1bGUgXCJAZGUteGltYS9mYy1mb3JtLWRlc2lnbmVyXCIge1xuICBleHBvcnQgaW50ZXJmYWNlIElFZGl0b3JNYXAge1xuICAgIFtNdWx0aVNlbGVjdFR5cGVdOiB7XG4gICAgICAvKiogU3RvcmVzIHRoZSB7QGxpbmsgSU11bHRpU2VsZWN0RGVzY3JpcHRvciB9LiAqL1xuICAgICAgZGVzY3JpcHRvcjogSU11bHRpU2VsZWN0RGVzY3JpcHRvcjtcblxuICAgICAgLyoqIFN0b3JlcyB0aGUge0BsaW5rIE11bHRpU2VsZWN0IH0tRWRpdG9yIGl0c2VsZi4gKi9cbiAgICAgIGVkaXRvcjogTXVsdGlTZWxlY3Q7XG5cbiAgICAgIC8qKiBTdG9yZXMgdGhlIHNlbGVjdGVkIHN0YW5kYXJkIGNvbmZpZ3VyYXRpb25zIENTVi4gKi9cbiAgICAgIHZhbHVlOiBzdHJpbmc7XG4gICAgfTtcbiAgfVxufVxuLyoqXG4gKiBBIHBsYWluIHtAbGluayBFZGl0b3JzLkJhc2VFZGl0b3IgPHR5cGVvZiBNdWx0aVNlbGVjdFR5cGU+fSByZXRyaWV2aW5nIGl0J3MgIGF2YWlsYWJsZSBvcHRpb25zIHRvIGRpc3BsYXkgb3V0IG9mXG4gKiB7QGxpbmsgd2luZG93Li4gIENvZGJpUGx1Z2luRGF0YS5maWxlTGlzdGluZyB9IHN0b3JpbmcgdGhlIG1hZGUgc2VsZWN0aW9ucy5cbiAqXG4gKiBQcmltYXJpbHkgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3Igc2VsZWN0aW5nIENvZEJpJ3Mgc3RhbmRhcmQgY29uZmlndXJhdGlvbnMgdGhhdCBzaGFsbCBiZSBpbmNsdWRlZCBpbnRvIGEgZm9ybS4gKi9cbmV4cG9ydCBjbGFzcyBNdWx0aVNlbGVjdCBleHRlbmRzIEVkaXRvcnMuQmFzZUVkaXRvcjx0eXBlb2YgTXVsdGlTZWxlY3RUeXBlPiB7XG4gIC8qKiBTdG9yZXMgdGhlIGNvbnRhaW5lciBmb3IgdGhpcyB7QGxpbmsgTXVsdGlTZWxlY3QgfS4gKi9cbiAgcHJpdmF0ZSBfZWxlbWVudDogSFRNTERpdkVsZW1lbnQ7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IHtAbGluayBNdWx0aVNlbGVjdCB9IGJ5IHJldHJpZXZpbmcgdGhlIGF2YWlsYWJsZSBvcHRpb25zIGZyb21cbiAgICoge0BsaW5rIHdpbmRvdy4uQ29kYmlQbHVnaW5EYXRhLmZpbGVMaXN0aW5nIH0gYW5kIGdlbmVyYXRpbmcgYW4gYXBwcm9wcmlhdGUge0BsaW5rIEhUTUxJbnB1dEVsZW1lbnQgfSBmb3IgZWFjaFxuICAgKiBlbnRyeSB0aGVyZS4gRWFjaCB7QGxpbmsgSFRNTElucHV0RWxlbWVudCB9IHdpbGwgdHJpZ2dlciBhICoqc2V0LXByb3BlcnR5KiogZnJvbSB7QGxpbmsgQ2FsbGJhY2tzIH0gd2hlblxuICAgKiBjbGlja2VkLlxuICAgKlxuICAgKiBAcGFyYW0gY29uZmlnIC0gQ29uZmlndXJhdGlvbiBmb3IgdGhpcyBlZGl0b3IuICovXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogVEVkaXRvckNmZzxJTXVsdGlTZWxlY3REZXNjcmlwdG9yPikge1xuICAgIC8vIE5vdGU6IHRoZSBzZWNvbmQgYXJndW1lbnQgaXMgZGVwcmVjYXRlZCwgd2UgcGFzcyB0aGUgZW1wdHkgc3RyaW5nXG4gICAgc3VwZXIoY29uZmlnLCBcIlwiLCBcInRleHRcIik7XG4gICAgd2luZG93LkNvZGJpUGx1Z2luRGF0YS5wb3B1bGF0ZVN0YW5kYXJkcyA9IHRoaXMucG9wdWxhdGVTdGFuZGFyZHMuYmluZCh0aGlzKTtcblxuICAgIHRoaXMuX2VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXG4gICAgdGhpcy5fZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBcIkNvZEJpX1N0YW5kYXJkc2xpc3RpbmdcIik7XG4gICAgdGhpcy5wb3B1bGF0ZVN0YW5kYXJkcygpO1xuICB9XG4gIC8qKiBQb3B1bGF0ZXMgdGhlIGxpc3Rpbmcgb2Ygc3RhbmRhcmRzLiAqL1xuICBwcm90ZWN0ZWQgcG9wdWxhdGVTdGFuZGFyZHMoKTogdm9pZCB7XG4gICAgLy8gI3JlZ2lvbiBSZXRyaWV2ZSBhdmFpbGFibGUgc3RhbmRhcmQgY29uZmlndXJhdGlvbnNcbiAgICBjb25zdCBsaXN0aW5nID0gSlNPTi5wYXJzZSh3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmZpbGVMaXN0aW5nKS5tYXAoKGZpbGU6IHN0cmluZykgPT4ge1xuICAgICAgcmV0dXJuIGZpbGUubGFzdEluZGV4T2YoXCIuXCIpICE9PSAtMSA/IGZpbGUuc3Vic3RyaW5nKDAsIGZpbGUubGFzdEluZGV4T2YoXCIuXCIpKSA6IGZpbGU7XG4gICAgfSk7XG4gICAgLy8gI2VuZHJlZ2lvbiBSZXRyaWV2ZSBhdmFpbGFibGUgc3RhbmRhcmQgY29uZmlndXJhdGlvbnNcbiAgICAvLyAjcmVnaW9uIENsZWFyXG4gICAgY29uc3QgYnVmVmFsdWU6IHN0cmluZyA9IHRoaXMuZ2V0VmFsdWUoKTtcblxuICAgIHRoaXMuX2VsZW1lbnQuaW5uZXJIVE1MID0gXCJcIjtcbiAgICAvLyAjZW5kcmVnaW9uIENsZWFyXG4gICAgLy8gI3JlZ2lvbiBHZW5lcmF0ZSBhbmQgaW5qZWN0IGFwcHJvcHJpYXRlIDxpbnB1dD5zIGFuZCA8bGFiZWxzPiBmb3IgdGhlbS5cbiAgICB0aGlzLl9lbGVtZW50LnN0eWxlLndoaXRlU3BhY2UgPSBcIm5vd3JhcFwiO1xuICAgIHRoaXMuX2VsZW1lbnQuc3R5bGUub3ZlcmZsb3dYID0gXCJhdXRvXCI7XG5cbiAgICBmb3IgKGNvbnN0IGNvbmZpZ3VyYXRpb24gb2YgbGlzdGluZykge1xuICAgICAgY29uc3QgbmV3RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcbiAgICAgIGNvbnN0IG5ld0xhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxhYmVsXCIpO1xuXG4gICAgICBuZXdFbGVtZW50LnNldEF0dHJpYnV0ZShcImlkXCIsIGBDb2RCaS1TdGFuZGFyZENvbmZpZ1NlbGVjdG9yXyR7Y29uZmlndXJhdGlvbn1gKTtcbiAgICAgIG5ld0VsZW1lbnQuc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcImNoZWNrYm94XCIpO1xuICAgICAgbmV3RWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiLCBjb25maWd1cmF0aW9uKTtcbiAgICAgIG5ld0VsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuICAgICAgICAvLyBQcm9wYWdhdGUgdGhlIGNoYW5nZS5cbiAgICAgICAgQ2FsbGJhY2tzW1wic2V0LXByb3BlcnR5XCJdLmZpcmUodGhpcy5jb25maWcucHJvcGVydHksIHRoaXMuZ2V0VmFsdWUoKSwgdGhpcyk7XG4gICAgICAgIC8vICNyZWdpb24gVXBkYXRlIHN0YXR1cyBnbG9iYWxseVxuICAgICAgICBERUZJTkVELnRzQ2hlY2sod2luZG93LkNvZGJpUGx1Z2luRGF0YS5kZXRTdGFuZGFyZHNbY29uZmlndXJhdGlvbl0pLkFjdGl2ZSA9IElOU1RBTkNFLnRzQ2hlY2s8SFRNTElucHV0RWxlbWVudD4oXG4gICAgICAgICAgZXZlbnQudGFyZ2V0LFxuICAgICAgICAgIEhUTUxJbnB1dEVsZW1lbnQsXG4gICAgICAgICkuY2hlY2tlZDtcbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBVcGRhdGUgc3RhdHVzIGdsb2JhbGx5XG4gICAgICB9KTtcblxuICAgICAgbmV3TGFiZWwuc2V0QXR0cmlidXRlKFwiZm9yXCIsIGBDb2RCaS1TdGFuZGFyZENvbmZpZ1NlbGVjdG9yXyR7Y29uZmlndXJhdGlvbn1gKTtcbiAgICAgIG5ld0xhYmVsLmlubmVySFRNTCA9IGAke2NvbmZpZ3VyYXRpb259PC9icj5gO1xuXG4gICAgICB0aGlzLl9lbGVtZW50LmFwcGVuZENoaWxkKG5ld0VsZW1lbnQpO1xuICAgICAgdGhpcy5fZWxlbWVudC5hcHBlbmRDaGlsZChuZXdMYWJlbCk7XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gR2VuZXJhdGUgYXBwcm9wcmlhdGUgPGlucHV0PnMgYW5kIDxsYWJlbHM+IGZvciB0aGVtLlxuICAgIHRoaXMuc2V0VmFsdWUoYnVmVmFsdWUpO1xuICB9XG4gIC8qKiBTZWUge0BsaW5rIEVkaXRvcnMuQmFzZUVkaXRvciB9J3MgKipnZXRFbGVtZW50KiouICovXG4gIG92ZXJyaWRlIGdldEVsZW1lbnQoKTogSlF1ZXJ5IHtcbiAgICByZXR1cm4gJCh0aGlzLl9lbGVtZW50KTtcbiAgfVxuICAvKipcbiAgICogR2VuZXJhdGVzIGEgQ1NWIG9mIGFsbCBzZWxlY3RlZCBzdGFuZGFyZCBjb25maWd1cmF0aW9ucy5cbiAgICpcbiAgICogQHJldHVybnMgQSBDU1Ygb2YgYWxsIHNlbGVjdGVkIHN0YW5kYXJkIGNvbmZpZ3VyYXRpb25zLiAqL1xuICBvdmVycmlkZSBnZXRWYWx1ZSgpOiBzdHJpbmcge1xuICAgIGNvbnN0IHJlc3VsdDogc3RyaW5nW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGN1cnJlbnQgb2YgdGhpcy5fZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiaW5wdXRcIikpIHtcbiAgICAgIGlmIChjdXJyZW50LmNoZWNrZWQpIHtcbiAgICAgICAgcmVzdWx0LnB1c2goY3VycmVudC52YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdC5qb2luKCk7XG4gIH1cbiAgLyoqXG4gICAqIENsZWFycyBhbGwgc2VsZWN0aW9ucyBwcmlvciB0byBzZXR0aW5nIHRoZSBzZWxlY3RlZCBjb25maWd1cmF0aW9ucyBhY2NvcmRpbmcgdG8gdGhlIHJlY2VpdmVkICoqZGF0YSoqLlxuICAgKlxuICAgKiBAcGFyYW0gZGF0YSBTZWUge0BsaW5rIEVkaXRvcnMuQmFzZUVkaXRvciB9J3MgKipzZXRWYWx1ZSoqLiAqL1xuICBvdmVycmlkZSBzZXRWYWx1ZShkYXRhOiB1bmtub3duKTogdm9pZCB7XG4gICAgLy8gI3JlZ2lvbiBDbGVhciBzZWxlY3Rpb24uXG4gICAgZm9yIChjb25zdCBlbGVtZW50IG9mIHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvckFsbChcImlucHV0XCIpKSB7XG4gICAgICBlbGVtZW50LmNoZWNrZWQgPSBmYWxzZTtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvbiBDbGVhciBzZWxlY3Rpb24uXG4gICAgLy8gI3JlZ2lvbiBDbGVhciBtYXJrZWQgc3RhbmRhcmRzIGdsb2JhbGx5XG4gICAgZm9yIChjb25zdCBkZXRhaWwgaW4gd2luZG93LkNvZGJpUGx1Z2luRGF0YS5kZXRTdGFuZGFyZHMpIHtcbiAgICAgIERFRklORUQudHNDaGVjayh3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmRldFN0YW5kYXJkc1tkZXRhaWxdKS5BY3RpdmUgPSBmYWxzZTtcbiAgICB9XG4gICAgLy8gI2VuZHJlZ2lvbiBDbGVhciBtYXJrZWQgc3RhbmRhcmRzIGdsb2JhbGx5XG4gICAgLy8gI3JlZ2lvbiBTZXQgYWNjb3JkaW5nIHRvIFtkYXRhXS5cbiAgICBmb3IgKGNvbnN0IHN0YW5kYXJkIG9mIHBhcnNlU3RyaW5nKGRhdGEpLnNwbGl0KFwiLFwiKSkge1xuICAgICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX2VsZW1lbnQucXVlcnlTZWxlY3RvcihgW3ZhbHVlPVwiJHtzdGFuZGFyZC50cmltKCl9XCJdYCk7XG5cbiAgICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkge1xuICAgICAgICBlbGVtZW50LmNoZWNrZWQgPSB0cnVlO1xuICAgICAgfVxuICAgICAgLy8gI3JlZ2lvbiBNYXJrIGFjdGl2ZSBTdGFuZGFyZHMgZ2xvYmFsbHlcbiAgICAgIGlmICh3aW5kb3cuQ29kYmlQbHVnaW5EYXRhLmRldFN0YW5kYXJkc1tzdGFuZGFyZF0pIHtcbiAgICAgICAgREVGSU5FRC50c0NoZWNrKHdpbmRvdy5Db2RiaVBsdWdpbkRhdGEuZGV0U3RhbmRhcmRzW3N0YW5kYXJkXSkuQWN0aXZlID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIC8vICNlbmRyZWdpb24gTWFyayBhY3RpdmUgU3RhbmRhcmRzIGdsb2JhbGx5XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gU2V0IGFjY29yZGluZyB0byBbZGF0YV0uXG4gIH1cbn1cbiIsICJpbXBvcnQgeyBmaXJzdEluZGV4IH0gZnJvbSBcIkBkZS14aW1hL3hpbWEtY29tbW9uLWpzLWxhbmdcIjtcbmltcG9ydCB7IHJlZ2lzdGVyQ3VzdG9tRm9ybUNhdGVnb3J5IH0gZnJvbSBcIkBkZS14aW1hL2ZjLWZvcm0tZGVzaWduZXJcIjtcbmltcG9ydCB7IENvbnN0YW50cyB9IGZyb20gXCJjb2RiaS1jb21tb25cIjtcbmltcG9ydCB7IGkxOG4gfSBmcm9tIFwiLi9pMThuLmpzXCI7XG4vKipcbiAqIFJlZ2lzdGVycyBhbGwgZm9ybSBwcm9wZXJ0aWVzIGZvciB0aGUgY29kZSBsaWJyYXJ5LlxuICpcbiAqIFRoaXMgcGx1Z2luIGFkZHMgc2V2ZXJhbCBwcm9wZXJ0aWVzIHRvIHRoZSBmb3JtIHRhYiBvZiB0aGUgZGVzaWduZXIgdGhhdCBsZXRzXG4gKiB0aGUgdXNlciBlZGl0IHNldmVyYWwgc2V0dGluZ3MgcmVsYXRlZCB0byB0aGUgY29kZSBsaWJyYXJ5LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQ3VzdG9tRm9ybUNhdGVnb3JpZXMoKTogdm9pZCB7XG4gIHJlZ2lzdGVyQ3VzdG9tRm9ybUNhdGVnb3J5KFxuICAgIHtcbiAgICAgIGlkOiBDb25zdGFudHNbXCJkZXNpZ25lci5jYXRlZ29yeS5jb2RiaV9wYW5lbFwiXSxcbiAgICAgIGxhYmVsOiBpMThuKFwiZGVzaWduZXIuY2F0ZWdvcnkuY29kYmlfcGFuZWxcIiksXG4gICAgICBoZWxwOiB7IHR5cGU6IFwidXJsXCIsIHVybDogQ29uc3RhbnRzW1wiZGVzaWduZXIuY2F0ZWdvcnkuY29kYmlfcGFuZWwuaGVscFwiXSB9LFxuICAgIH0sXG4gICAgKGNhdHMpID0+IGZpcnN0SW5kZXgoY2F0cywgKGNhdCkgPT4gY2F0LmlkID09PSBcImZvcm1TZW9cIikgPz8gMixcbiAgKTtcbn1cbiIsICIvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBUaGlzIGZpbGUgd2FzIGdlbmVyYXRlZCBhdXRvbWF0aWNhbGx5LiBEbyBub3QgZWRpdCB0aGlzIGZpbGUgbWFudWFsbHkhXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5leHBvcnQgY29uc3QgQ29kYmlDb25maWdUZW1wbGF0ZSA9IHtcbiAgXCJkZWZhdWx0XCI6IFwiZGVmYXVsdFwiLFxuICBcInh0ZW5zaWJsZVwiOiBcInh0ZW5zaWJsZVwiLFxufSBhcyBjb25zdDtcbiIsICIvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBUaGlzIGZpbGUgd2FzIGdlbmVyYXRlZCBhdXRvbWF0aWNhbGx5LiBEbyBub3QgZWRpdCB0aGlzIGZpbGUgbWFudWFsbHkhXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5leHBvcnQgY29uc3QgQ29uc3RhbnRzID0ge1xuICBcImFwaURvYy5kaWFsb2cuaW5wdXQubGFiZWwucHJlZml4XCI6IFwiY29kYmlcXC1wcm9wXFwtYXBpRG9jXFwtZGlhbG9nXFwtaW5wdXRcXC1sYWJlbFxcLXByZWZpeFwiLFxuICBcImRlc2lnbmVyLmNhdGVnb3J5LmNvZGJpX3BhbmVsXCI6IFwiY29kYmlcXC1jYXRcXC1tYWluXCIsXG4gIFwiZGVzaWduZXIuY2F0ZWdvcnkuY29kYmlfcGFuZWwuaGVscFwiOiBcImh0dHBzOlxcL1xcL2dpdGh1Yi5jb21cXC9YSU1BXFwtZm9ybWN5Y2xlXFwtRW50d2lja2xlcmtyZWlzXFwvQ29kQmlcXC1EZXZcIixcbiAgXCJkZXNpZ25lci5wcm9wZXJ0eS5jb25maWdfdGVtcGxhdGVcIjogXCJjb2RiaVxcLXByb3BcXC1jb25maWdcXC10ZW1wbGF0ZVwiLFxuICBcImRlc2lnbmVyLnByb3BlcnR5LmNvbmZpZ190ZW1wbGF0ZS5kZWZhdWx0XCI6IFwiZGVmYXVsdFwiLFxuICBcImRlc2lnbmVyLnByb3BlcnR5LmVuYWJsZV9jb2RiaVwiOiBcImNvZGJpXFwtcHJvcFxcLWVuYWJsZVwiLFxuICBcImRlc2lnbmVyLnByb3BlcnR5LmVuYWJsZV9jb2RiaS5kZWZhdWx0XCI6IFwiMFwiLFxuICBcImRlc2lnbmVyLnByb3BlcnR5LnN0YW5kYXJkc1wiOiBcImNvZGJpXFwtcHJvcFxcLXN0YW5kYXJkc1wiLFxuICBcImRlc2lnbmVyLnByb3BlcnR5LnN0YW5kYXJkcy5kZWZhdWx0XCI6IFwiSG9saXN0aWMuQ1NTLlN0YW5kYXJkXCIsXG4gIFwicGx1Z2luLmZvcm1fZGVzaWduZXJfcmVzb3VyY2UuaWRcIjogXCJjb20uZ2l0aHViLnhpbWFfZm9ybWN5Y2xlX2VudHdpY2tsZXJrcmVpcy5mYy5wbHVnaW4uY29kYmkuQ29kYmlGb3JtRGVzaWduZXJSZXNvdXJjZVwiLFxuICBcInBsdWdpbi5mb3JtX3Byb3BlcnRpZXNfZXh0ZW5zaW9uLmlkXCI6IFwiY29tLmdpdGh1Yi54aW1hX2Zvcm1jeWNsZV9lbnR3aWNrbGVya3JlaXMuZmMucGx1Z2luLmNvZGJpLkNvZGJpRm9ybVByb3BlcnRpZXNFeHRlbnNpb25cIixcbiAgXCJwbHVnaW4uZm9ybV9yZW5kZXJfY2FsbGJhY2suaWRcIjogXCJjb20uZ2l0aHViLnhpbWFfZm9ybWN5Y2xlX2VudHdpY2tsZXJrcmVpcy5mYy5wbHVnaW4uY29kYmkuQ29kYmlGb3JtUmVuZGVyQ2FsbGJhY2tcIixcbiAgXCJwbHVnaW4uZm9ybV9yZXNvdXJjZXMuaWRcIjogXCJjb20uZ2l0aHViLnhpbWFfZm9ybWN5Y2xlX2VudHdpY2tsZXJrcmVpcy5mYy5wbHVnaW4uY29kYmkuQ29kYmlGb3JtUmVzb3VyY2VzXCIsXG4gIFwicGx1Z2luLmtleVwiOiBcImYxNDAwOTBkXFwtZDQ3MVxcLTQ2NTBcXC04ZmVmXFwtODA2N2UxZTFkY2RkXCIsXG4gIFwicmVzb3VyY2VfcGF0aC5iYXNlXCI6IFwiXFwvY29tXFwvZ2l0aHViXFwveGltYV9mb3JtY3ljbGVfZW50d2lja2xlcmtyZWlzXFwvZmNcXC9wbHVnaW5cXC9jb2RiaVxcL1wiLFxuICBcInJlc291cmNlX3BhdGguYnVuZGxlXCI6IFwiXFwvY29tXFwvZ2l0aHViXFwveGltYV9mb3JtY3ljbGVfZW50d2lja2xlcmtyZWlzXFwvZmNcXC9wbHVnaW5cXC9jb2RiaVxcL2kxOG5cIixcbiAgXCJyZXNvdXJjZV9wYXRoLmNvZGJpX2NvbmZpZ190ZW1wbGF0ZV9zY3JpcHRcIjogXCJcXC9jb21cXC9naXRodWJcXC94aW1hX2Zvcm1jeWNsZV9lbnR3aWNrbGVya3JlaXNcXC9mY1xcL3BsdWdpblxcL2NvZGJpXFwvY29uZmlnXFwtdGVtcGxhdGVcXC0lcy5qc1wiLFxuICBcInJlc291cmNlX3BhdGguY29kYmlfY3NzXCI6IFwiXFwvY29tXFwvZ2l0aHViXFwveGltYV9mb3JtY3ljbGVfZW50d2lja2xlcmtyZWlzXFwvZmNcXC9wbHVnaW5cXC9jb2RiaVxcL2NvZGJpLmNzc1wiLFxuICBcInJlc291cmNlX3BhdGguY29kYmlfc2NyaXB0XCI6IFwiXFwvY29tXFwvZ2l0aHViXFwveGltYV9mb3JtY3ljbGVfZW50d2lja2xlcmtyZWlzXFwvZmNcXC9wbHVnaW5cXC9jb2RiaVxcL2NvZGJpLmpzXCIsXG4gIFwicmVzb3VyY2VfcGF0aC5kZXNpZ25lcl9mcmFtZV9jc3NcIjogXCJcXC9jb21cXC9naXRodWJcXC94aW1hX2Zvcm1jeWNsZV9lbnR3aWNrbGVya3JlaXNcXC9mY1xcL3BsdWdpblxcL2NvZGJpXFwvZGVzaWduZXJcXC1mcmFtZS5jc3NcIixcbiAgXCJyZXNvdXJjZV9wYXRoLmRlc2lnbmVyX3NjcmlwdFwiOiBcIlxcL2NvbVxcL2dpdGh1YlxcL3hpbWFfZm9ybWN5Y2xlX2VudHdpY2tsZXJrcmVpc1xcL2ZjXFwvcGx1Z2luXFwvY29kYmlcXC9kZXNpZ25lci5qc1wiLFxufSBhcyBjb25zdDtcbiIsICIvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBUaGlzIGZpbGUgd2FzIGdlbmVyYXRlZCBhdXRvbWF0aWNhbGx5LiBEbyBub3QgZWRpdCB0aGlzIGZpbGUgbWFudWFsbHkhXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5leHBvcnQgY29uc3QgTWVzc2FnZXMgPSB7XG4gIFwiZGVcIjoge1xuICAgIFwiYXBpRG9jLmRpYWxvZy5pbnB1dC5sYWJlbC5wcmVmaXhcIjogXCJHZWJlbiBTaWUgZGVuIE5hbWVuXCIsXG4gICAgXCJkZXNpZ25lci5jYXRlZ29yeS5jb2RiaV9wYW5lbFwiOiBcIkNvZEJpXCIsXG4gICAgXCJkZXNpZ25lci5wcm9wZXJ0eS5jb25maWdfdGVtcGxhdGVcIjogXCJLb25maWdcXC1UZW1wbGF0ZVwiLFxuICAgIFwiZGVzaWduZXIucHJvcGVydHkuY29uZmlnX3RlbXBsYXRlLm9wdGlvbi5kZWZhdWx0XCI6IFwiU3RhbmRhcmRcIixcbiAgICBcImRlc2lnbmVyLnByb3BlcnR5LmNvbmZpZ190ZW1wbGF0ZS5vcHRpb24ueHRlbnNpYmxlXCI6IFwiWFRlbnNpYmxlXCIsXG4gICAgXCJkZXNpZ25lci5wcm9wZXJ0eS5lbmFibGVfY29kYmlcIjogXCJDb2RCaSBha3RpdmllcnRcIixcbiAgICBcImRlc2lnbmVyLnByb3BlcnR5LnN0YW5kYXJkc1wiOiBcIlN0YW5kYXJkIEtvbmZpZ3VyYXRpb25lblwiLFxuICAgIFwiZm9ybS50ZXN0X3N0cmluZ1wiOiBcInRlc3RcXC1kZVwiLFxuICAgIFwicGx1Z2luLmZvcm1fZGVzaWduZXJfcmVzb3VyY2UuZGVzY1wiOiBcIlN0ZWxsdCBPYmVyZmxcdTAwRTRjaGUgenVtIEJlYXJiZWl0ZW4gZGVyIHp1c1x1MDBFNHR6bGljaGUgRWlnZW5zY2hhZnRlbiBmXHUwMEZDciBkaWUgQ29kZVxcLUJpYmxpb3RoZWsgaW0gRm9ybXVsYXJcXC1UYWIgZGVzIEZvcm11bGFyXFwtRGVzaWduZXJzIGJlcmVpdC5cIixcbiAgICBcInBsdWdpbi5mb3JtX2Rlc2lnbmVyX3Jlc291cmNlLm5hbWVcIjogXCJGb3JtdWxhclxcLURlc2lnbmVyXFwtUmVzc291cmNlXCIsXG4gICAgXCJwbHVnaW4uZm9ybV9wcm9wZXJ0aWVzX2V4dGVuc2lvbi5kZXNjXCI6IFwiTWFjaHQgbmV1ZSBGb3JtdWxhcmVpZ2Vuc2NoYWZ0ZW4genVyIEtvbmZpZ3VyYXRpb24gZGVyIENvZGVcXC1CaWJsaW90aGVrIGJla2FubnQuXCIsXG4gICAgXCJwbHVnaW4uZm9ybV9wcm9wZXJ0aWVzX2V4dGVuc2lvbi5uYW1lXCI6IFwiRm9ybXVsYXJcXC1FaWdlbnNjaGFmdGVuXFwtRXJ3ZWl0ZXJ1bmdcIixcbiAgICBcInBsdWdpbi5mb3JtX3JlbmRlcl9jYWxsYmFjay5kZXNjXCI6IFwiTW9kaWZpemllcnQgZGFzIEZvcm11bGFyXFwtUmVuZGVyaW5nLCB1bSBkaWUgQ29kZVxcLUJpYmxpb3RoZWsgenUgaW50ZWdyaWVyZW4uXCIsXG4gICAgXCJwbHVnaW4uZm9ybV9yZW5kZXJfY2FsbGJhY2submFtZVwiOiBcIkZvcm11bGFyXFwtUmVuZGVyXFwtQ2FsbGJhY2tcIixcbiAgICBcInBsdWdpbi5mb3JtX3Jlc291cmNlcy5kZXNjXCI6IFwiU3RlbGx0IGRpZSBGcm9udGVuZFxcLVJlc3NvdXJjZW4gZGVyIENvZGVcXC1CaWJsaW90aGVrIGJlcmVpdC5cIixcbiAgICBcInBsdWdpbi5mb3JtX3Jlc291cmNlcy5uYW1lXCI6IFwiRm9ybXVsYXJcXC1SZXNzb3VyY2VuXCIsXG4gIH0sXG4gIFwiZW5cIjoge1xuICAgIFwiYXBpRG9jLmRpYWxvZy5pbnB1dC5sYWJlbC5wcmVmaXhcIjogXCJHZWJlbiBTaWUgZGVuIE5hbWVuXCIsXG4gICAgXCJkZXNpZ25lci5jYXRlZ29yeS5jb2RiaV9wYW5lbFwiOiBcIkNvZEJpXCIsXG4gICAgXCJkZXNpZ25lci5wcm9wZXJ0eS5jb25maWdfdGVtcGxhdGVcIjogXCJDb25maWcgdGVtcGxhdGVcIixcbiAgICBcImRlc2lnbmVyLnByb3BlcnR5LmNvbmZpZ190ZW1wbGF0ZS5vcHRpb24uZGVmYXVsdFwiOiBcIkRlZmF1bHRcIixcbiAgICBcImRlc2lnbmVyLnByb3BlcnR5LmNvbmZpZ190ZW1wbGF0ZS5vcHRpb24ueHRlbnNpYmxlXCI6IFwiWFRlbnNpYmxlXCIsXG4gICAgXCJkZXNpZ25lci5wcm9wZXJ0eS5lbmFibGVfY29kYmlcIjogXCJDb2RCaSBlbmFibGVkXCIsXG4gICAgXCJkZXNpZ25lci5wcm9wZXJ0eS5zdGFuZGFyZHNcIjogXCJTdGFuZGFyZCBDb25maWd1cmF0aW9uc1wiLFxuICAgIFwiZm9ybS50ZXN0X3N0cmluZ1wiOiBcInRlc3RcXC1lblwiLFxuICAgIFwicGx1Z2luLmZvcm1fZGVzaWduZXJfcmVzb3VyY2UuZGVzY1wiOiBcIlByb3ZpZGVzIGEgVUkgZm9yIGVkaXRpbmcgdGhlIGFkZGl0aW9uYWwgcHJvcGVydGllcyBvZiB0aGUgY29kZSBsaWJyYXJ5IGluIHRoZSBmb3JtIHRhYiBvZiB0aGUgZm9ybSBkZXNpZ25lci5cIixcbiAgICBcInBsdWdpbi5mb3JtX2Rlc2lnbmVyX3Jlc291cmNlLm5hbWVcIjogXCJGb3JtIGRlc2lnbmVyIHJlc291cmNlXCIsXG4gICAgXCJwbHVnaW4uZm9ybV9wcm9wZXJ0aWVzX2V4dGVuc2lvbi5kZXNjXCI6IFwiUmVnaXN0ZXJzIG5ldyBmb3JtIHByb3BlcnRpZXMgZm9yIGNvbmZpZ3VyaW5nIHRoZSBjb2RlIGxpYnJhcnkuXCIsXG4gICAgXCJwbHVnaW4uZm9ybV9wcm9wZXJ0aWVzX2V4dGVuc2lvbi5uYW1lXCI6IFwiRm9ybSBwcm9wZXJ0aWVzIGV4dGVuc2lvblwiLFxuICAgIFwicGx1Z2luLmZvcm1fcmVuZGVyX2NhbGxiYWNrLmRlc2NcIjogXCJBZGp1c3RzIHJlbmRlcmVkIGZvcm1zIHRvIGludGVncmF0ZSB0aGUgY29kZSBsaWJyYXJ5LlwiLFxuICAgIFwicGx1Z2luLmZvcm1fcmVuZGVyX2NhbGxiYWNrLm5hbWVcIjogXCJGb3JtIHJlbmRlciBjYWxsYmFja1wiLFxuICAgIFwicGx1Z2luLmZvcm1fcmVzb3VyY2VzLmRlc2NcIjogXCJQcm92aWRlcyB0aGUgZnJvbnRlbmQgcmVzb3VyY2VzIGZvciB0aGUgY29kZSBsaWJyYXJ5LlwiLFxuICAgIFwicGx1Z2luLmZvcm1fcmVzb3VyY2VzLm5hbWVcIjogXCJGb3JtIHJlc291cmNlc1wiLFxuICB9LFxufSBhcyBjb25zdDtcbiIsICIvLyBDb21tb24gSmF2YVNjcmlwdCBsb2dpYyB0aGF0IGNhbiBiZSB1c2VkIGJ5IGJvdGggdGhlIGZvcm0gYW5kIHRoZSBkZXNpZ25lciBwYWNrYWdlXG5cbmltcG9ydCB7IE1lc3NhZ2VzIH0gZnJvbSBcIi4vbG9jYWxpemF0aW9uLmpzXCI7XG5cbmV4cG9ydCB0eXBlIFRNZXNzYWdlcyA9IHR5cGVvZiBNZXNzYWdlcztcblxuZXhwb3J0IHR5cGUgVExhbmd1YWdlID0ga2V5b2YgVE1lc3NhZ2VzO1xuXG5leHBvcnQgdHlwZSBUTWVzc2FnZUtleSA9IGtleW9mIFRNZXNzYWdlc1tUTGFuZ3VhZ2VdO1xuXG5leHBvcnQgdHlwZSBUSTE4TiA9IChrZXk6IFRNZXNzYWdlS2V5KSA9PiBzdHJpbmc7XG5cbmZ1bmN0aW9uIHBhcnNlTGFuZyhsYW5nOiBzdHJpbmcpOiBUTGFuZ3VhZ2Uge1xuICByZXR1cm4gbGFuZyBpbiBNZXNzYWdlcyA/IChsYW5nIGFzIFRMYW5ndWFnZSkgOiBcImVuXCI7XG59XG5cbi8qKlxuICogTWFwcyBpbnRlcm5hbCBwbHVnaW4gbWVzc2FnZSBrZXlzIHRvIEkxOE4gdmFyaWFibGUga2V5cyBjb25maWd1cmVkIGluIHRoZSBmb3JtY3ljbGVcbiAqIGJhY2tlbmQgKGBmaWxlcyAmIHRlbXBsYXRlc2AgLT4gYEkxOE4gdmFyaWFibGVzYCkuIEFsbCBsb2NhbGl6ZWQgbWVzc2FnZXMgdGhhdCBhcmUgdXNlZCBmb3IgZnJvbnRlbmQgZm9ybXMgc2hvdWxkIGJlIGN1c3RvbWl6YWJsZVxuICogYnkgYmFja2VuZCB1c2Vycy5cbiAqL1xuY29uc3QgTWVzc2FnZUtleVRvSTE4blZhcmlhYmxlOiBQYXJ0aWFsPFJlY29yZDxUTWVzc2FnZUtleSwgc3RyaW5nPj4gPSB7XG4gIFwiZm9ybS50ZXN0X3N0cmluZ1wiOiBcInRlc3RTdHJpbmdcIixcbn07XG5cbi8qKlxuICogR2V0cyB0aGUgdHJhbnNsYXRpb24gZm9yIGEgZ2l2ZW4ga2V5LCB0YWtlbiBmcm9tIHRoZSBsb2NhbGl6ZWQgbWVzc2FnZXNcbiAqIGluIHRoZSBwcm9wZXJ0aWVzIGZpbGVzIG9mIHRoZSBwbHVnaW4uIEZhbGxzIGJhY2sgdG8gRW5nbGlzaCB3aGVuIG5vXG4gKiB0cmFuc2xhdGlvbiB3YXMgZm91bmQgZm9yIHRoZSBnaXZlbiBsYW5ndWFnZS5cbiAqXG4gKiBUaGlzIHNob3VsZCBvbmx5IGJlIHVzZWQgZm9yIHRoZSBiYWNrZW5kLCBpLmUuIHRoZSBmb3JtIGRlc2lnbmVyLiBGb3IgdGhlXG4gKiBmcm9udGVuZCwgaS5lLiBmb3JtcywgdXNlIHtAbGluayBmb3JtTWVzc2FnZX0uXG4gKiBAcGFyYW0gbGFuZyBUYXJnZXQgbGFuZ3VhZ2VcbiAqIEBwYXJhbSBrZXkgTWVzc2FnZSBrZXkuXG4gKiBAcmV0dXJucyBMb2NhbGl6ZWQgbWVzc2FnZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBsdWdpbk1lc3NhZ2UobGFuZzogc3RyaW5nLCBrZXk6IFRNZXNzYWdlS2V5KTogc3RyaW5nIHtcbiAgY29uc3QgYWN0dWFsTGFuZyA9IHBhcnNlTGFuZyhsYW5nKTtcbiAgY29uc3QgbWVzc2FnZXMgPSBNZXNzYWdlc1thY3R1YWxMYW5nXTtcbiAgcmV0dXJuIG1lc3NhZ2VzW2tleV0gPz8gYD8ke2tleX0/YDtcbn1cblxuLyoqXG4gKiBTaW1pbGFyIHRvIHtAbGluayBwbHVnaW5NZXNzYWdlfSwgYnV0IGF0dGVtcHRzIHRvIHRha2UgdGhlIGxvY2FsaXplZCBtZXNzYWdlIGZyb21cbiAqIHRoZSBJMThOIHZhcmlhYmxlcyBjb25maWd1cmVkIGluIHRoZSBmb3JtY3ljbGUgYXBwbGljYXRpb24sIGlmIGF2YWlsYWJsZS5cbiAqXG4gKiBUaGlzIGFsbG93cyB1c2VycyB0byBhZGQgY3VzdG9tIHRyYW5zbGF0aW9ucyBmb3Igb3RoZXIgbGFuZ3VhZ2VzIHRoYXRcbiAqIGZyb250ZW5kIGZvcm1zIHNob3VsZCBzdXBwb3J0LlxuICogQHBhcmFtIGxhbmcgVGFyZ2V0IGxhbmd1YWdlXG4gKiBAcGFyYW0ga2V5IE1lc3NhZ2Uga2V5LlxuICogQHBhcmFtIGZvcm1JMThuIE1hcCB3aXRoIHRoZSBJMThOIHZhcmlhYmxlcyBjb25maWd1cmVkIGluIHRoZSBmb3JtY3ljbGUgYXBwbGljYXRpb24uXG4gKiBAcmV0dXJucyBMb2NhbGl6ZWQgbWVzc2FnZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1NZXNzYWdlKGxhbmc6IHN0cmluZywga2V5OiBUTWVzc2FnZUtleSwgZm9ybUkxOG46IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pOiBzdHJpbmcge1xuICByZXR1cm4gZm9ybUkxOG5bTWVzc2FnZUtleVRvSTE4blZhcmlhYmxlW2tleV0gPz8gXCJcIl0gPz8gcGx1Z2luTWVzc2FnZShsYW5nLCBrZXkpO1xufVxuIiwgImltcG9ydCB7IGdldExhbmd1YWdlIH0gZnJvbSBcIkBkZS14aW1hL2ZjLWZvcm0tZGVzaWduZXJcIjtcblxuaW1wb3J0IHsgdHlwZSBUTWVzc2FnZUtleSwgcGx1Z2luTWVzc2FnZSB9IGZyb20gXCJjb2RiaS1jb21tb25cIjtcblxuLyoqXG4gKiBGaW5kcyB0aGUgbG9jYWxpemVkIG1lc3NhZ2UgZm9yIHRoZSBnaXZlbiBrZXkuIFVzZXMgdGhlIGN1cnJlbnQgbG9jYWxlIG9mXG4gKiB0aGUgZm9ybSBkZXNpZ25lci5cbiAqIEBwYXJhbSBrZXkgVGhlIGtleSBvZiB0aGUgbWVzc2FnZSB0byBmaW5kLlxuICogQHJldHVybnMgVGhlIGxvY2FsaXplZCBtZXNzYWdlLCBhIGRlZmF1bHQgc3VjaCBhcyBgP2tleT9gIGlmIG5vIGxvY2FsaXphdGlvblxuICogaXMgZm91bmQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpMThuKGtleTogVE1lc3NhZ2VLZXkpOiBzdHJpbmcge1xuICByZXR1cm4gcGx1Z2luTWVzc2FnZShnZXRMYW5ndWFnZSgpLCBrZXkpO1xufVxuIiwgImltcG9ydCB7XG4gIHJlZ2lzdGVyQ3VzdG9tRm9ybVByb3BlcnR5LFxuICB0eXBlIElFZGl0b3JNYXAsXG4gIHR5cGUgSVByb3BlcnR5RGVwZW5kZW5jeURlc2NyaXB0b3IsXG59IGZyb20gXCJAZGUteGltYS9mYy1mb3JtLWRlc2lnbmVyXCI7XG5pbXBvcnQgeyBwYXJzZUJvb2xlYW4sIHJlY29yZFZhbHVlcyB9IGZyb20gXCJAZGUteGltYS94aW1hLWNvbW1vbi1qcy1sYW5nXCI7XG5pbXBvcnQgeyBDb2RiaUNvbmZpZ1RlbXBsYXRlLCBDb25zdGFudHMgfSBmcm9tIFwiY29kYmktY29tbW9uXCI7XG5pbXBvcnQgeyBNdWx0aVNlbGVjdFR5cGUgfSBmcm9tIFwiLi9NdWx0aVNlbGVjdC5qc1wiO1xuaW1wb3J0IHsgaTE4biB9IGZyb20gXCIuL2kxOG4uanNcIjtcbi8qKiBEZWZpbmVzIHdoZXRoZXIgdGhlIENvZEJpIGlzIGVuYWJsZWQgb3Igbm90IChmb3IgdXNhZ2UgaW4ge0BsaW5rIHJlZ2lzdGVyQ3VzdG9tRm9ybVByb3BlcnRpZXMgfSkuKi9cbmNvbnN0IFdoZW5Db2RCaUVuYWJsZWQ6IElQcm9wZXJ0eURlcGVuZGVuY3lEZXNjcmlwdG9yPFxuICBrZXlvZiBJRWRpdG9yTWFwLFxuICBbKHR5cGVvZiBDb25zdGFudHMpW1wiZGVzaWduZXIucHJvcGVydHkuZW5hYmxlX2NvZGJpXCJdXVxuPiA9IHtcbiAgZGVwZW5kZW5jaWVzOiBbQ29uc3RhbnRzW1wiZGVzaWduZXIucHJvcGVydHkuZW5hYmxlX2NvZGJpXCJdXSxcbiAgdGVzdDogKHBhcmFtcykgPT4gcGFyc2VCb29sZWFuKHBhcmFtcy52YWx1ZXNbQ29uc3RhbnRzW1wiZGVzaWduZXIucHJvcGVydHkuZW5hYmxlX2NvZGJpXCJdXSksXG59O1xuLyoqIFJlZ2lzdGVycyB0aGUgY3VzdG9tIHByb3BlcnRpZXMgZm9yIGNvbmZpZ3VyaW5nIHRoZSBjb2RlIGxpYnJhcnkuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJDdXN0b21Gb3JtUHJvcGVydGllcygpOiB2b2lkIHtcbiAgLy8gV2hldGhlciB0aGUgY29kZSBsaWJyYXJ5IGlzIGVuYWJsZWRcbiAgcmVnaXN0ZXJDdXN0b21Gb3JtUHJvcGVydHkoe1xuICAgIGVkaXRvcjogXCJDaGVja2JveEVkaXRvclwiLFxuICAgIGNhdDogQ29uc3RhbnRzW1wiZGVzaWduZXIuY2F0ZWdvcnkuY29kYmlfcGFuZWxcIl0sXG4gICAgcHJvcGVydHk6IENvbnN0YW50c1tcImRlc2lnbmVyLnByb3BlcnR5LmVuYWJsZV9jb2RiaVwiXSxcbiAgICBsYWJlbDogaTE4bihcImRlc2lnbmVyLnByb3BlcnR5LmVuYWJsZV9jb2RiaVwiKSxcbiAgfSk7XG4gIC8vIENvbmZpZ3VyYXRpb24gdGVtcGxhdGVcbiAgcmVnaXN0ZXJDdXN0b21Gb3JtUHJvcGVydHkoe1xuICAgIGVkaXRvcjogXCJTZWxlY3RFZGl0b3JcIixcbiAgICBjYXQ6IENvbnN0YW50c1tcImRlc2lnbmVyLmNhdGVnb3J5LmNvZGJpX3BhbmVsXCJdLFxuICAgIHByb3BlcnR5OiBDb25zdGFudHNbXCJkZXNpZ25lci5wcm9wZXJ0eS5jb25maWdfdGVtcGxhdGVcIl0sXG4gICAgbGFiZWw6IGkxOG4oXCJkZXNpZ25lci5wcm9wZXJ0eS5jb25maWdfdGVtcGxhdGVcIiksXG4gICAgb3B0aW9uczogcmVjb3JkVmFsdWVzKENvZGJpQ29uZmlnVGVtcGxhdGUpLm1hcCgoY29uZmlnVGVtcGxhdGVOYW1lKSA9PiAoe1xuICAgICAgdGV4dDogaTE4bihgZGVzaWduZXIucHJvcGVydHkuY29uZmlnX3RlbXBsYXRlLm9wdGlvbi4ke2NvbmZpZ1RlbXBsYXRlTmFtZX1gKSxcbiAgICAgIHZhbHVlOiBjb25maWdUZW1wbGF0ZU5hbWUsXG4gICAgfSkpLFxuICAgIGF2YWlsYWJsZUlmOiBXaGVuQ29kQmlFbmFibGVkLFxuICB9KTtcbiAgLy8gU3RhbmRhcmQgQ29uZmlndXJhdGlvbnNcbiAgcmVnaXN0ZXJDdXN0b21Gb3JtUHJvcGVydHkoe1xuICAgIGVkaXRvcjogTXVsdGlTZWxlY3RUeXBlLFxuICAgIGNhdDogQ29uc3RhbnRzW1wiZGVzaWduZXIuY2F0ZWdvcnkuY29kYmlfcGFuZWxcIl0sXG4gICAgcHJvcGVydHk6IENvbnN0YW50c1tcImRlc2lnbmVyLnByb3BlcnR5LnN0YW5kYXJkc1wiXSxcbiAgICBsYWJlbDogaTE4bihcImRlc2lnbmVyLnByb3BlcnR5LnN0YW5kYXJkc1wiKSxcbiAgICBhdmFpbGFibGVJZjogV2hlbkNvZEJpRW5hYmxlZCxcbiAgfSk7XG59XG4iLCAiaW1wb3J0IHsgcmVnaXN0ZXJDdXN0b21FbGVtZW50cyB9IGZyb20gXCIuL2pzL3JlZ2lzdGVyLWN1c3RvbUVsZW1lbnRzLmpzXCI7XG5cbmltcG9ydCB7IHJlZ2lzdGVyQ3VzdG9tRm9ybUNhdGVnb3JpZXMgfSBmcm9tIFwiLi9qcy9yZWdpc3Rlci1jdXN0b20tZm9ybS1jYXRlZ29yaWVzLmpzXCI7XG5pbXBvcnQgeyByZWdpc3RlckN1c3RvbUZvcm1Qcm9wZXJ0aWVzIH0gZnJvbSBcIi4vanMvcmVnaXN0ZXItY3VzdG9tLWZvcm0tcHJvcGVydGllcy5qc1wiO1xuXG5yZWdpc3RlckN1c3RvbUZvcm1DYXRlZ29yaWVzKCk7XG5yZWdpc3RlckN1c3RvbUZvcm1Qcm9wZXJ0aWVzKCk7XG5yZWdpc3RlckN1c3RvbUVsZW1lbnRzKCk7XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQSxVQUFJLE9BQU8sYUFBYSxVQUFVO0FBQ2hDLGNBQU0sSUFBSTtBQUFBLFVBQ1I7QUFBQSxZQUNFO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0YsRUFBRSxLQUFLLElBQUk7QUFBQSxRQUNiO0FBQUEsTUFDRjtBQUVBLGFBQU8sT0FBTyxPQUFPLFNBQVMsUUFBUTtBQUFBO0FBQUE7OztBQ1Z0QyxNQUFBQSwyQkFBcUM7OztBQ0FyQyxNQUFBQywyQkFBMEI7OztBQ0duQixNQUFNLE1BQU4sTUFBTSxLQUFJO0FBQUE7QUFBQTtBQUFBLElBR2hCLE9BQU8scUJBSUgsb0JBQUksSUFJTjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFXRixPQUFpQixrQkFDaEIsUUFDQSxZQUNBLE9BRUEsVUFDWTtBQUNaLFVBQUksS0FBSSxtQkFBbUIsSUFBSSxNQUFNLEdBQUc7QUFDdkMsWUFBSSxLQUFJLG1CQUFtQixJQUFJLE1BQU0sRUFBRSxJQUFJLFVBQVUsR0FBRztBQUN2RCxjQUFJLEtBQUksbUJBQW1CLElBQUksTUFBTSxFQUFFLElBQUksVUFBVSxFQUFFLElBQUksS0FBSyxHQUFHO0FBQ2xFLGlCQUFJLG1CQUNGLElBQUksTUFBTSxFQUNWLElBQUksVUFBVSxFQUNkLElBQUksS0FBSyxFQUNULEtBQUssUUFBUTtBQUFBLFVBQ2hCLE9BQU87QUFDTixpQkFBSSxtQkFDRixJQUFJLE1BQU0sRUFDVixJQUFJLFVBQVUsRUFDZCxJQUFJLE9BQU8sSUFBSSxNQUFxQyxRQUFRLENBQUM7QUFBQSxVQUNoRTtBQUFBLFFBQ0QsT0FBTztBQUNOLGVBQUksbUJBQ0YsSUFBSSxNQUFNLEVBQ1Y7QUFBQSxZQUNBO0FBQUEsWUFDQSxvQkFBSSxJQUFrRDtBQUFBLGNBQ3JELENBQUMsT0FBTyxJQUFJLE1BQXFDLFFBQVEsQ0FBQztBQUFBLFlBQzNELENBQUM7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0QsT0FBTztBQUNOLGFBQUksbUJBQW1CO0FBQUEsVUFDdEI7QUFBQSxVQUNBLG9CQUFJLElBR0Y7QUFBQSxZQUNEO0FBQUEsY0FDQztBQUFBLGNBQ0Esb0JBQUksSUFBa0Q7QUFBQSxnQkFDckQsQ0FBQyxPQUFPLElBQUksTUFBcUMsUUFBUSxDQUFDO0FBQUEsY0FDM0QsQ0FBQztBQUFBLFlBQ0Y7QUFBQSxVQUNELENBQUM7QUFBQSxRQUNGO0FBQUEsTUFDRDtBQUVBLGFBQU87QUFBQSxJQUNSO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBWUEsT0FBYyxtQkFDWCxRQUVBLGFBQ0EsWUFDa0I7QUFDcEIsWUFBTSxpQkFBaUIsV0FBVztBQUVsQyxpQkFBVyxRQUFRLFlBQWEsTUFBYTtBQUc1QyxZQUNDLEtBQUksbUJBQW1CLElBQUksTUFBTSxLQUNqQyxLQUFJLG1CQUFtQixJQUFJLE1BQU0sRUFBRSxJQUFJLFdBQVcsR0FDakQ7QUFDRCxxQkFBVyxTQUFTLEtBQUksbUJBQ3RCLElBQUksTUFBTSxFQUNWLElBQUksV0FBVyxFQUNmLEtBQUssR0FBRztBQUNULGdCQUFJLFFBQVEsS0FBSyxRQUFRO0FBQ3hCLHlCQUFXLFlBQVksS0FBSSxtQkFDekIsSUFBSSxNQUFNLEVBQ1YsSUFBSSxXQUFXLEVBQ2YsSUFBSSxLQUFLLEdBQUc7QUFDYix5QkFBUyxLQUFLLEtBQUssQ0FBQztBQUFBLGNBQ3JCO0FBQUEsWUFDRDtBQUFBLFVBQ0Q7QUFBQSxRQUNEO0FBR0EsZUFBTyxlQUFlLE1BQU0sTUFBTSxJQUFJO0FBQUEsTUFDdkM7QUFFQSxhQUFPO0FBQUEsSUFDUjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFXQSxPQUFjLGtCQUNiLFdBR0EsT0FBMkIsUUFDM0IsTUFBTSxlQUNMO0FBQ0QsYUFBTyxDQUFDLFFBQWlCLGFBQThCLGVBQW1DO0FBQ3pGLFlBQUksQ0FBQyxLQUFJLGVBQWUsUUFBUSxHQUFHLEVBQUUsa0JBQWtCLGlCQUFpQjtBQUN2RTtBQUFBLFFBQ0Q7QUFDQSxjQUFNLGlCQUFpQixXQUFXO0FBQy9CLGNBQU0saUJBQWlCLFdBQVc7QUFFckMsWUFBSTtBQUVKLGVBQU8sZUFBZSxRQUFRLGFBQWE7QUFBQSxVQUMxQyxNQUFNO0FBQ0wsZ0JBQ0MsQ0FBQyxLQUFJLGVBQWUsUUFBUSxHQUFHLEVBQUUsa0JBQWtCLGlCQUNsRDtBQUNEO0FBQUEsWUFDRDtBQUVBLGtCQUFNLFlBQVksT0FBTyxLQUFJLFFBQVEsTUFBTSxJQUFJLElBQUk7QUFFbkQsdUJBQVcsWUFBWSxXQUFXO0FBQ2pDLG9CQUFNLFNBQVMsU0FBUyxNQUFNLFNBQVM7QUFFdkMsa0JBQUksT0FBTyxXQUFXLFVBQVU7QUFDL0IscUJBQUksZUFBZSxRQUFRLEdBQUcsRUFBRTtBQUFBLGtCQUMvQjtBQUFBLGtCQUNBO0FBQUEsa0JBQ0E7QUFBQSxrQkFDQTtBQUFBLGtCQUNBO0FBQUEsZ0JBQ0Q7QUFBQSxjQUNEO0FBQUEsWUFDRDtBQUVBLG1CQUFPLGVBQWdCLFdBQVk7QUFBQSxVQUNwQztBQUFBLFVBQ0EsSUFBSSxVQUFVO0FBQ2IsZ0JBQ0MsQ0FBQyxLQUFJLGVBQWUsUUFBUSxHQUFHLEVBQUUsa0JBQWtCLGlCQUNsRDtBQUNEO0FBQUEsWUFDRDtBQUVBLGtCQUFNLFlBQVksT0FBTyxLQUFJLFFBQVEsTUFBTSxJQUFJLElBQUk7QUFFbkQsdUJBQVcsWUFBWSxXQUFXO0FBQ2pDLG9CQUFNLFNBQVMsU0FBUyxNQUFNLFNBQVM7QUFFdkMsa0JBQUksT0FBTyxXQUFXLFVBQVU7QUFDL0IscUJBQUksZUFBZSxRQUFRLEdBQUcsRUFBRTtBQUFBLGtCQUMvQjtBQUFBLGtCQUNBO0FBQUEsa0JBQ0E7QUFBQSxrQkFDQTtBQUFBLGtCQUNBO0FBQUEsZ0JBQ0Q7QUFBQSxjQUNEO0FBQUEsWUFDRDtBQUVBLG9CQUFRO0FBQUEsVUFDVDtBQUFBLFVBQ0EsWUFBWTtBQUFBLFVBQ1osY0FBYztBQUFBLFFBQ2YsQ0FBQztBQUFBLE1BRUY7QUFBQSxJQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBWUEsT0FBYyxhQUNiLFdBR0EsT0FBMkIsUUFDM0IsTUFBTSxlQUNMO0FBQ0QsYUFBTyxDQUFDLFFBQWlCLGdCQUFpQztBQUN6RCxZQUFJLENBQUMsS0FBSSxlQUFlLFFBQVEsR0FBRyxFQUFFLGtCQUFrQixpQkFBaUI7QUFDdkU7QUFBQSxRQUNEO0FBRUEsWUFBSTtBQUVKLGVBQU8sZUFBZSxRQUFRLGFBQWE7QUFBQSxVQUMxQyxJQUFJLFVBQVU7QUFDYixnQkFDQyxDQUFDLEtBQUksZUFBZSxRQUFRLEdBQUcsRUFBRSxrQkFBa0IsaUJBQ2xEO0FBQ0Q7QUFBQSxZQUNEO0FBRUEsa0JBQU0sWUFBWSxPQUFPLEtBQUksUUFBUSxVQUFVLElBQUksSUFBSTtBQUV2RCx1QkFBVyxZQUFZLFdBQVc7QUFDakMsb0JBQU0sU0FBUyxTQUFTLE1BQU0sU0FBUztBQUV2QyxrQkFBSSxPQUFPLFdBQVcsVUFBVTtBQUMvQixxQkFBSSxlQUFlLFFBQVEsR0FBRyxFQUFFO0FBQUEsa0JBQy9CO0FBQUEsa0JBQ0E7QUFBQSxrQkFDQTtBQUFBLGtCQUNBO0FBQUEsa0JBQ0E7QUFBQSxnQkFDRDtBQUFBLGNBQ0Q7QUFBQSxZQUNEO0FBRUEsb0JBQVE7QUFBQSxVQUNUO0FBQUEsVUFDQSxZQUFZO0FBQUEsVUFDWixjQUFjO0FBQUEsUUFDZixDQUFDO0FBQUEsTUFFRjtBQUFBLElBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQWFBLE9BQWMsaUJBRWIsT0FDQSxLQUNBLE9BQTJCLFFBQzFCO0FBQ0QsYUFBTyxDQUNOLFFBQ0EsYUFDQSxlQUN3QjtBQUN4QixjQUFNLGlCQUFpQixXQUFXO0FBRWxDLG1CQUFXLFFBQVEsSUFBSSxTQUFnQjtBQUN0QyxjQUNDLENBQUMsS0FBSSxlQUFlLFFBQVEsR0FBRyxFQUFFLGtCQUFrQixxQkFDbEQ7QUFDRDtBQUFBLFVBQ0Q7QUFFQSxnQkFBTSxTQUFTLGVBQWUsTUFBTSxNQUFNLElBQUk7QUFDOUMsZ0JBQU0sWUFBWSxPQUFPLEtBQUksUUFBUSxRQUFRLElBQUksSUFBSTtBQUNyRCxnQkFBTSxjQUFjLE1BQU0sV0FBVyxRQUFRLFdBQVc7QUFFeEQsY0FBSSxPQUFPLGdCQUFnQixVQUFVO0FBQ3BDLGlCQUFJLGVBQWUsUUFBUSxHQUFHLEVBQUU7QUFBQSxjQUMvQjtBQUFBLGNBQ0E7QUFBQSxjQUNBO0FBQUEsY0FDQTtBQUFBLGNBQ0E7QUFBQSxZQUNEO0FBQUEsVUFDRDtBQUVBLGlCQUFPO0FBQUEsUUFDUjtBQUVBLGVBQU87QUFBQSxNQUNSO0FBQUEsSUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFjQSxPQUFpQixnQkFDaEIsT0FDQSxLQUNBLE9BQTJCLFFBS2xCO0FBQ1QsYUFBTyxDQUNOLFFBQ0EsWUFDQSxtQkFDVTtBQUNWLGFBQUk7QUFBQSxVQUNIO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBLENBQUMsVUFBbUI7QUFDbkIsZ0JBQ0MsQ0FBQyxLQUFJLGVBQWUsUUFBUSxHQUFHLEVBQUUsa0JBQy9CLG9CQUNEO0FBQ0Q7QUFBQSxZQUNEO0FBRUEsa0JBQU0sWUFBWSxPQUFPLEtBQUksUUFBUSxPQUFPLElBQUksSUFBSTtBQUNwRCxrQkFBTSxTQUFTLE1BQU0sV0FBVyxRQUFRLFlBQVksY0FBYztBQUVsRSxnQkFBSSxPQUFPLFdBQVcsVUFBVTtBQUMvQixtQkFBSSxlQUFlLFFBQVEsR0FBRyxFQUFFO0FBQUEsZ0JBQy9CO0FBQUEsZ0JBQ0E7QUFBQSxnQkFDQTtBQUFBLGdCQUNBO0FBQUEsZ0JBQ0E7QUFBQSxnQkFDQTtBQUFBLGNBQ0Q7QUFBQSxZQUNEO0FBQUEsVUFDRDtBQUFBLFFBQ0Q7QUFBQSxNQUNEO0FBQUEsSUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFLTyxvQkFJSDtBQUFBLE1BQ0gsb0JBQW9CO0FBQUEsTUFDcEIscUJBQXFCO0FBQUEsTUFDckIsaUJBQWlCO0FBQUEsSUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUlPLGtCQUVILEVBQUUsY0FBYyxLQUFLO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUtmLGNBQWMsU0FBNEI7QUFDbkQsVUFBSSxLQUFLLGdCQUFnQixjQUFjO0FBQ3RDLGdCQUFRLEtBQUssT0FBTztBQUFBLE1BQ3JCO0FBQUEsSUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBLElBSU8sdUJBR0gsRUFBRSxnQkFBZ0IsTUFBTSxjQUFjLE1BQU07QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQU90QyxtQkFDVCxTQUNBLFVBQ0EsUUFDQSxNQUNZO0FBQ1osWUFBTSxlQUF1QixXQUFXLFFBQVEsSUFBSSxPQUFPLGNBQWMsSUFBSSxNQUFNLEVBQUUsR0FBRyxPQUFPLFdBQVcsYUFBYSxRQUFRLE9BQU8sSUFBSSxNQUFNLE9BQU8sV0FBVyxZQUFZLFdBQVcsUUFBUSxPQUFPLE9BQU8sZ0JBQWdCLGFBQWEsUUFBUSxPQUFPLFlBQVksSUFBSSxNQUFNLEVBQUUsS0FBSyxPQUFPO0FBRS9SLFVBQUksS0FBSyxxQkFBcUIsZ0JBQWdCO0FBQzdDLGNBQU0sSUFBSSxLQUFJLGFBQWEsWUFBWTtBQUFBLE1BQ3hDO0FBRUEsVUFBSSxLQUFLLHFCQUFxQixjQUFjO0FBQzNDLGdCQUFRLElBQUksWUFBWTtBQUFBLE1BQ3pCO0FBQUEsSUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVNPLDRCQUNOLFNBQ0EsUUFDQSxNQUNBLFFBQ0EsT0FDQSxPQUNZO0FBQ1osWUFBTSxjQUFjLFFBQVE7QUFFNUIsV0FBSztBQUFBLFFBQ0osc0JBQXNCLEtBQUssWUFBWSxXQUFXLEdBQUcsZ0JBQWdCLElBQUksT0FBTyxnQkFBZ0IsSUFBSSxPQUFPLGdCQUFnQixJQUFJLE9BQU8sSUFBSSxxREFBcUQsT0FBTztBQUFBLFFBQ3RNO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNEO0FBQUEsSUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBVU8sd0JBQ04sU0FDQSxRQUNBLE1BQ0EsS0FDQSxPQUNZO0FBQ1osV0FBSztBQUFBLFFBQ0osb0JBQW9CLEdBQUcsSUFBSSxTQUFTLFNBQVksS0FBSyxJQUFJLElBQUksRUFBRSxnQkFBZ0IsS0FBSyw0Q0FBNEMsT0FBTztBQUFBLFFBQ3ZJO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNEO0FBQUEsSUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFRTyw4QkFDTixTQUNBLFFBQ0EsTUFDQSxRQUVBLE9BQ0M7QUFDRCxXQUFLO0FBQUEsUUFDSixtQkFBbUIsS0FBSyw0Q0FBNEMsT0FBTztBQUFBLFFBQzNFO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNEO0FBQUEsSUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBLElBSUEsT0FBYyxlQUFlLGNBQWMsTUFBTTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFLaEQsWUFBWSxTQUFpQjtBQUM1QixjQUFNLHVCQUF1QixPQUFPLEdBQUc7QUFBQSxNQUN4QztBQUFBLElBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFZQSxPQUFPLGlCQUFpQixDQUFDLEtBQUssU0FDN0IsTUFDRyxNQUFNLEdBQUcsRUFDVixPQUFPLENBQUMsYUFBYSxZQUFZLFlBQVksT0FBTyxHQUFHLEdBQUc7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQU83RCxZQUNDLHVCQUdJLEVBQUUsZ0JBQWdCLE1BQU0sY0FBYyxNQUFNLEdBQ2hELG9CQUlJO0FBQUEsTUFDSCxvQkFBb0I7QUFBQSxNQUNwQixxQkFBcUI7QUFBQSxNQUNyQixpQkFBaUI7QUFBQSxJQUNsQixHQUNDO0FBQ0QsV0FBSyx1QkFBdUI7QUFHNUIsVUFBSyxPQUFlLFlBQVksT0FBVyxDQUFDLE9BQWUsVUFBVSxDQUFDO0FBRXRFLE1BQUMsT0FBZSxRQUFRLE1BQU07QUFBQSxJQUMvQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVlBLE9BQWMsUUFBUSxlQUF3QixNQUFjO0FBQzNELFVBQUksQ0FBQyxpQkFBaUIsT0FBTyxTQUFTLFVBQVU7QUFDL0MsZUFBTztBQUFBLE1BQ1I7QUFFQSxZQUFNLFFBQVEsS0FBSyxRQUFRLHVCQUF1QixLQUFLLEVBQUUsTUFBTSxHQUFHO0FBRWxFLFVBQUksVUFBVTtBQUNkLGlCQUFXLFFBQVEsT0FBTztBQUN6QixZQUFJLFlBQVksUUFBUSxPQUFPLFlBQVksYUFBYTtBQUN2RCxpQkFBTztBQUFBLFFBQ1I7QUFFQSxjQUFNLGNBQWMsS0FBSyxNQUFNLGVBQWU7QUFDOUMsWUFBSSxhQUFhO0FBQ2hCLGdCQUFNLGFBQWEsWUFBWSxDQUFDO0FBQ2hDLGdCQUFNLFVBQVUsWUFBWSxDQUFDO0FBQzdCLGdCQUFNLE9BQU8sUUFBUSxNQUFNLEdBQUcsRUFBRSxJQUFJLENBQUMsUUFBUSxJQUFJLEtBQUssQ0FBQztBQUN2RCxjQUFJLE9BQU8sUUFBUSxVQUFVLE1BQU0sWUFBWTtBQUM5QyxzQkFBVSxRQUFRLFVBQVUsRUFBRSxNQUFNLFNBQVMsSUFBSTtBQUFBLFVBQ2xELE9BQU87QUFDTixtQkFBTztBQUFBLFVBQ1I7QUFBQSxRQUNELE9BQU87QUFDTixvQkFBVSxRQUFRLElBQUk7QUFBQSxRQUN2QjtBQUFBLE1BQ0Q7QUFFQSxhQUFPO0FBQUEsSUFDUjtBQUFBLEVBQ0Q7QUFFQSxNQUFJLElBQUk7OztBQy9rQkQsTUFBTSxVQUFOLE1BQU0saUJBQWdCLElBQUk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBUWhDLE9BQWMsZUFBZSxTQUFpQztBQUU3RCxVQUFLLFlBQVksVUFBYSxZQUFZLE1BQU87QUFDaEQsZUFBTyxnREFBaUQsWUFBWSxTQUFZLGNBQWMsTUFBTTtBQUFBLE1BQ3JHO0FBRUEsYUFBTztBQUFBLElBQ1I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVVBLE9BQWMsSUFDYixPQUEyQixRQUMzQixNQUFNLGVBS0c7QUFDVCxhQUFPLElBQUk7QUFBQSxRQUNWLENBQ0MsT0FDQSxRQUNBLFlBQ0EsbUJBQ0k7QUFDSixpQkFBTyxTQUFRLGVBQWUsS0FBSztBQUFBLFFBQ3BDO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNEO0FBQUEsSUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBVUEsT0FBYyxLQUNiLE1BQ0EsT0FBMkIsUUFDM0IsTUFBTSxlQUtpQjtBQUN2QixhQUFPLElBQUk7QUFBQSxRQUNWLENBQUMsT0FBZSxRQUFnQixnQkFBd0I7QUFDdkQsaUJBQU8sU0FBUSxlQUFlLEtBQUs7QUFBQSxRQUNwQztBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRDtBQUFBLElBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVVBLE9BQWMsVUFDYixNQUNBLE9BQTJCLFFBQzNCLE1BQU0sZUFDTDtBQUNELGFBQU8sSUFBSSxhQUFhLENBQUMsSUFBSSxTQUFRLENBQUMsR0FBRyxNQUFNLEdBQUc7QUFBQSxJQUNuRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBYU8sTUFBTSxTQUFjO0FBQzFCLGFBQU8sU0FBUSxlQUFlLE9BQU87QUFBQSxJQUN0QztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBVUEsT0FBYyxRQUErQixTQUF3QyxLQUEwQixRQUF3QjtBQUN0SSxZQUFNLFNBQVMsU0FBUSxlQUFlLE9BQU87QUFFN0MsVUFBSSxXQUFXLE1BQU87QUFDckIsZUFBTztBQUFBLE1BQ1IsT0FDSztBQUNKLGNBQU0sSUFBSSxJQUFJLGFBQWMsR0FBRyxLQUFHLElBQUksRUFBRSxPQUFLLEVBQUUsR0FBRyxNQUFpQixFQUFFO0FBQUEsTUFDdEU7QUFBQSxJQUNEO0FBQUE7QUFBQSxJQUVPLGNBQWM7QUFDcEIsWUFBTTtBQUFBLElBQ1A7QUFBQSxFQUNEOzs7QUM5SE8sTUFBTSxXQUFOLE1BQU0sa0JBQWlCLElBQUk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFxSTFCLFlBQXNCLFdBQWdCO0FBQzVDLFlBQU07QUFEc0I7QUFBQSxJQUU3QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBN0hBLE9BQWMsZUFBZSxTQUFjLFdBQWtDO0FBQzVFLFVBQUksRUFBRSxtQkFBbUIsWUFBWTtBQUNwQyxlQUFPLG1DQUFtQyxTQUFTLHFCQUFxQixPQUFPLE9BQU87QUFBQSxNQUN2RjtBQUVBLGFBQU87QUFBQSxJQUNSO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFVQSxPQUFjLElBRWIsV0FDQSxPQUEyQixRQUMzQixNQUFNLGVBS0c7QUFDVCxhQUFPLElBQUk7QUFBQSxRQUNWLENBQ0MsT0FDQSxRQUNBLFlBQ0EsbUJBQ0k7QUFDSixpQkFBTyxVQUFTLGVBQWUsT0FBTyxTQUFTO0FBQUEsUUFDaEQ7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Q7QUFBQSxJQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFVQSxPQUFjLEtBRWIsV0FDQSxPQUEyQixRQUMzQixNQUFNLGVBS2lCO0FBQ3ZCLGFBQU8sSUFBSTtBQUFBLFFBQ1YsQ0FBQyxPQUFlLFFBQWdCLGdCQUF3QjtBQUN2RCxpQkFBTyxVQUFTLGVBQWUsT0FBTyxTQUFTO0FBQUEsUUFDaEQ7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Q7QUFBQSxJQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFVQSxPQUFjLFVBRWIsV0FDQSxPQUEyQixRQUMzQixNQUFNLGVBQ0w7QUFDRCxhQUFPLElBQUksYUFBYSxDQUFDLElBQUksVUFBUyxTQUFTLENBQUMsR0FBRyxNQUFNLEdBQUc7QUFBQSxJQUM3RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBYU8sTUFBTSxTQUFjO0FBQzFCLGFBQU8sVUFBUyxlQUFlLFNBQVMsS0FBSyxTQUFTO0FBQUEsSUFDdkQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBV0EsT0FBYyxRQUFrQyxTQUFlLFdBQWlCLEtBQTBCLFFBQXdCO0FBQ2pJLFlBQU0sU0FBUyxVQUFTLGVBQWUsU0FBUyxTQUFTO0FBRXpELFVBQUksV0FBVyxNQUFPO0FBQ3JCLGVBQU87QUFBQSxNQUNSLE9BQ0s7QUFDSixjQUFNLElBQUksSUFBSSxhQUFjLEdBQUcsS0FBRyxJQUFJLEVBQUUsT0FBSyxFQUFFLEdBQUcsTUFBaUIsRUFBRTtBQUFBLE1BQ3RFO0FBQUEsSUFDRDtBQUFBLEVBU0Q7OztBQ3ZJTyxNQUFNLEtBQU4sTUFBTSxZQUFXLElBQUk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBdUtwQixZQUNJLFlBR1Q7QUFDRCxZQUFNO0FBSkk7QUFBQSxJQUtYO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBM0pBLE9BQWMsZUFDYixZQUdBLE9BQ21CO0FBQ25CLFVBQUksU0FBUztBQUViLGVBQVMsSUFBSSxHQUFHLElBQUksV0FBVyxRQUFRLEtBQUs7QUFDM0MsY0FBTSxrQkFBa0IsV0FBVyxDQUFDLEVBQUUsTUFBTSxLQUFLO0FBRWpELFlBQUksT0FBTyxvQkFBb0IsVUFBVTtBQUN4QyxvQkFBVSxHQUFHLGVBQWUsR0FBRyxNQUFNLFdBQVcsU0FBUyxJQUFJLEtBQUssTUFBTTtBQUFBLFFBQ3pFLE9BQU87QUFDTixpQkFBTztBQUFBLFFBQ1I7QUFBQSxNQUNEO0FBRUEsYUFBTztBQUFBLElBQ1I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQW1CQSxPQUFjLElBQ2IsWUFHQSxPQUEyQixRQUMzQixNQUFNLGVBS0c7QUFDVCxhQUFPLElBQUk7QUFBQSxRQUNWLENBQ0MsT0FDQSxRQUNBLFlBQ0EsbUJBQ0k7QUFDSixpQkFBTyxJQUFHLGVBQWUsWUFBWSxLQUFLO0FBQUEsUUFDM0M7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Q7QUFBQSxJQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBWUEsT0FBYyxLQUNiLFlBR0EsT0FBMkIsUUFDM0IsTUFBTSxlQUtpQjtBQUN2QixhQUFPLElBQUk7QUFBQSxRQUNWLENBQUMsT0FBZSxRQUFnQixnQkFBd0I7QUFDdkQsaUJBQU8sSUFBRyxlQUFlLFlBQVksS0FBSztBQUFBLFFBQzNDO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNEO0FBQUEsSUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFXQSxPQUFjLFVBQ2IsWUFHQSxPQUEyQixRQUMzQixNQUFNLGVBQ0w7QUFDRCxhQUFPLElBQUksYUFBYSxDQUFDLElBQUksSUFBRyxVQUFVLENBQUMsR0FBRyxNQUFNLEdBQUc7QUFBQSxJQUN4RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVlPLE1BQU0sU0FBcUM7QUFDakQsYUFBTyxJQUFHLGVBQWUsS0FBSyxZQUFZLE9BQU87QUFBQSxJQUNsRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVNBLE9BQWMsUUFBb0IsU0FBcUMsWUFFckQ7QUFDakIsWUFBTSxTQUFTLElBQUcsZUFBZSxZQUFXLE9BQVE7QUFFcEQsVUFBSSxRQUFTO0FBQ1osZUFBTztBQUFBLE1BQ1IsT0FDSztBQUNKLGNBQU0sSUFBSSxJQUFJLGFBQWMsTUFBaUI7QUFBQSxNQUM5QztBQUFBLElBQ0Q7QUFBQTtBQUFBLEVBYUQ7OztBQ2hMTyxNQUFNLEtBQU4sTUFBTSxZQUFXLElBQUk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBOElwQixZQUVJLFlBQ0EsU0FBUyxPQUNsQjtBQUNELFlBQU07QUFISTtBQUNBO0FBQUEsSUFHWDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBMUlBLE9BQWMsZUFFYixTQUNBLFlBQ0EsUUFDbUI7QUFDbkIsVUFBSSxDQUFDLFVBQVUsZUFBZSxTQUFTO0FBQ3RDLGVBQU8sZ0NBQWdDLFVBQVU7QUFBQSxNQUNsRDtBQUVBLFVBQUksVUFBVSxlQUFlLFNBQVM7QUFDckMsZUFBTyxrQ0FBa0MsVUFBVTtBQUFBLE1BQ3BEO0FBRUEsYUFBTztBQUFBLElBQ1I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVVBLE9BQWMsSUFFYixZQUNBLFNBQVMsT0FDVCxPQUEyQixRQUMzQixNQUFNLGVBS0c7QUFDVCxhQUFPLElBQUk7QUFBQSxRQUNWLENBQ0MsT0FDQSxRQUNBLFlBQ0EsbUJBQ0k7QUFDSixpQkFBTyxJQUFHLGVBQWUsT0FBTyxZQUFZLE1BQU07QUFBQSxRQUNuRDtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRDtBQUFBLElBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVVBLE9BQWMsS0FFYixZQUNBLFNBQVMsT0FDVCxPQUEyQixRQUMzQixNQUFNLGVBS2lCO0FBQ3ZCLGFBQU8sSUFBSTtBQUFBLFFBQ1YsQ0FBQyxPQUFlLFFBQWdCLGdCQUF3QjtBQUN2RCxpQkFBTyxJQUFHLGVBQWUsT0FBTyxZQUFZLE1BQU07QUFBQSxRQUNuRDtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRDtBQUFBLElBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVVBLE9BQWMsVUFFYixZQUNBLFNBQVMsT0FDVCxPQUEyQixRQUMzQixNQUFNLGVBQ0w7QUFDRCxhQUFPLElBQUksYUFBYSxDQUFDLElBQUksSUFBRyxZQUFZLE1BQU0sQ0FBQyxHQUFHLE1BQU0sR0FBRztBQUFBLElBQ2hFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFhTyxNQUFNLFNBQWM7QUFDMUIsYUFBTyxJQUFHLGVBQWUsU0FBUyxLQUFLLFlBQVksS0FBSyxNQUFNO0FBQUEsSUFDL0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFTQSxPQUFjLFFBQW9CLFNBQXdDLFlBQStCO0FBQ3hHLFlBQU0sU0FBUyxJQUFHLGVBQWUsU0FBUyxZQUFZLEtBQU07QUFFNUQsVUFBSSxRQUFTO0FBQ1osZUFBTztBQUFBLE1BQ1IsT0FDSztBQUNKLGNBQU0sSUFBSSxJQUFJLGFBQWMsTUFBaUI7QUFBQSxNQUM5QztBQUFBLElBQ0Q7QUFBQTtBQUFBLEVBYUQ7OztBQ3JKTyxNQUFNLEtBQU4sTUFBTSxZQUFXLElBQUk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBa0lwQixZQUVJLFdBQ0EsUUFDQSxTQUFTLE9BQ2xCO0FBQ0QsWUFBTTtBQUpJO0FBQ0E7QUFDQTtBQUFBLElBR1g7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQS9IQSxPQUFjLGVBRWIsU0FDQSxXQUNBLFFBR0EsUUFDbUI7QUFDbkIsVUFBSSxDQUFDLFVBQVUsVUFBVSxNQUFNLE9BQU8sS0FBRyxDQUFDLE9BQU8sTUFBTSxPQUFPLEdBQUc7QUFDaEUsZUFBTyx1Q0FBdUMsU0FBUywrQkFBK0IsTUFBTTtBQUFBLE1BQzdGO0FBRUEsVUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLE1BQU0sT0FBTyxLQUFHLENBQUMsT0FBTyxNQUFNLE9BQU8sR0FBRztBQUNqRSxlQUFPLDhDQUE4QyxTQUFTLDBCQUEwQixNQUFNO0FBQUEsTUFDL0Y7QUFFQSxhQUFPO0FBQUEsSUFDUjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFXQSxPQUFjLElBQ2IsV0FDQSxRQUNBLFNBQVMsT0FDVCxPQUEyQixRQUMzQixNQUFNLGVBS0c7QUFDVCxhQUFPLElBQUk7QUFBQSxRQUNWLENBQ0MsT0FDQSxRQUNBLFlBQ0EsbUJBQ0k7QUFDSixpQkFBTyxJQUFHLGVBQWUsT0FBTyxXQUFXLFFBQVEsTUFBTTtBQUFBLFFBQzFEO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNEO0FBQUEsSUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFXQSxPQUFjLEtBQ2IsV0FDQSxRQUNBLFNBQVMsT0FDVCxPQUEyQixRQUMzQixNQUFNLGVBS2lCO0FBQ3ZCLGFBQU8sSUFBSTtBQUFBLFFBQ1YsQ0FBQyxPQUFlLFFBQWdCLGdCQUF3QjtBQUN2RCxpQkFBTyxJQUFHLGVBQWUsT0FBTyxXQUFXLFFBQVEsTUFBTTtBQUFBLFFBQzFEO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNEO0FBQUEsSUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFXQSxPQUFjLFVBQ2IsV0FDQSxRQUNBLFNBQVMsT0FDVCxPQUEyQixRQUMzQixNQUFNLGVBQ0w7QUFDRCxhQUFPLElBQUksYUFBYSxDQUFDLElBQUksSUFBRyxXQUFXLFFBQVEsTUFBTSxDQUFDLEdBQUcsTUFBTSxHQUFHO0FBQUEsSUFDdkU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQWFPLE1BQU0sU0FBYztBQUMxQixhQUFPLElBQUcsZUFBZSxTQUFTLEtBQUssV0FBVyxLQUFLLFFBQVEsS0FBSyxNQUFNO0FBQUEsSUFDM0U7QUFBQTtBQUFBLEVBY0Q7OztBQzVJTyxNQUFNLFFBQU4sTUFBTSxlQUFjLElBQUk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBNEh2QixZQUFzQixZQUFvQjtBQUNoRCxZQUFNO0FBRHNCO0FBQUEsSUFFN0I7QUFBQTtBQUFBLElBNUhBLE9BQWMsU0FBUztBQUFBLE1BQ3RCLG1CQUFtQjtBQUFBLE1BQ25CLE9BQU87QUFBQSxNQUNQLFVBQVU7QUFBQSxNQUNWLEtBQUs7QUFBQSxNQUNMLFNBQVM7QUFBQSxNQUNULE1BQU07QUFBQSxNQUNOLFlBQ0M7QUFBQSxNQUNELGFBQ0M7QUFBQSxJQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFVQSxPQUFjLGVBQ2IsU0FDQSxZQUNtQjtBQUNuQixVQUFJLENBQUMsV0FBVyxLQUFLLE9BQWlCLEdBQUc7QUFDeEMsZUFBTyw4Q0FBOEMsVUFBVTtBQUFBLE1BQ2hFO0FBRUEsYUFBTztBQUFBLElBQ1I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVVBLE9BQWMsSUFDYixZQUNBLE9BQTJCLFFBQzNCLE1BQU0sZUFLRztBQUNULGFBQU8sSUFBSTtBQUFBLFFBQ1YsQ0FDQyxPQUNBLFFBQ0EsWUFDQSxtQkFDSTtBQUNKLGlCQUFPLE9BQU0sZUFBZSxPQUFPLFVBQVU7QUFBQSxRQUM5QztBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRDtBQUFBLElBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVVBLE9BQWMsS0FDYixZQUNBLE9BQTJCLFFBQzNCLE1BQU0sZUFLaUI7QUFDdkIsYUFBTyxJQUFJO0FBQUEsUUFDVixDQUFDLE9BQWUsUUFBZ0IsZ0JBQXdCO0FBQ3ZELGlCQUFPLE9BQU0sZUFBZSxPQUFPLFVBQVU7QUFBQSxRQUM5QztBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRDtBQUFBLElBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVVBLE9BQWMsVUFDYixZQUNBLE9BQTJCLFFBQzNCLE1BQU0sZUFDTDtBQUNELGFBQU8sSUFBSSxhQUFhLENBQUMsSUFBSSxPQUFNLFVBQVUsQ0FBQyxHQUFHLE1BQU0sR0FBRztBQUFBLElBQzNEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBWU8sTUFBTSxTQUFxQztBQUNqRCxhQUFPLE9BQU0sZUFBZSxTQUFTLEtBQUssVUFBVTtBQUFBLElBQ3JEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBZ0JBLE9BQWMsTUFBTSxTQUFxQyxZQUFvQjtBQUM1RSxZQUFNLGNBQWMsT0FBTSxlQUFlLFNBQVMsVUFBVTtBQUU1RCxVQUFJLE9BQU8sZ0JBQWdCLFVBQVU7QUFDcEMsY0FBTSxJQUFJLElBQUksYUFBYSxXQUFXO0FBQUEsTUFDdkM7QUFBQSxJQUNEO0FBQUE7QUFBQSxFQUVEOzs7QUMvSU8sTUFBTSxlQUFOLE1BQU0sc0JBQXFCLElBQUk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUErSTlCLFlBQ0ksWUFDQSxTQUFTLE9BQ2xCO0FBQ0QsWUFBTTtBQUhJO0FBQ0E7QUFBQSxJQUdYO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBM0lBLE9BQWMsZUFFYixTQUNBLFlBQ0EsUUFDbUI7QUFDbkIsVUFBRyxFQUFHLG1CQUFtQixjQUFlO0FBQ3ZDLGVBQU8seURBQTBELFVBQVcsMENBQTJDLE9BQU8sT0FBUTtBQUFBLE1BQ3ZJO0FBRUEsVUFBSSxDQUFDLFVBQVUsQ0FBRyxRQUF5QixhQUFjLFVBQVcsR0FBRztBQUN0RSxlQUFPLHVCQUF3QixVQUFXO0FBQUEsTUFDM0M7QUFFQSxVQUFJLFVBQVksUUFBeUIsYUFBYyxVQUFXLEdBQUc7QUFDcEUsZUFBTyx3QkFBeUIsVUFBVztBQUFBLE1BQzVDO0FBRUEsYUFBTztBQUFBLElBQ1I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVVBLE9BQWMsSUFDYixZQUNBLFNBQVMsT0FDVCxPQUEyQixRQUMzQixNQUFNLGVBS0c7QUFDVCxhQUFPLElBQUk7QUFBQSxRQUNWLENBQ0MsT0FDQSxRQUNBLFlBQ0EsbUJBQ0k7QUFDSixpQkFBTyxjQUFhLGVBQWUsT0FBTyxZQUFZLE1BQU07QUFBQSxRQUM3RDtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRDtBQUFBLElBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVVBLE9BQWMsS0FDYixZQUNBLFNBQVMsT0FDVCxPQUEyQixRQUMzQixNQUFNLGVBS2lCO0FBQ3ZCLGFBQU8sSUFBSTtBQUFBLFFBQ1YsQ0FBQyxPQUFlLFFBQWdCLGdCQUF3QjtBQUN2RCxpQkFBTyxjQUFhLGVBQWUsT0FBTyxZQUFZLE1BQU07QUFBQSxRQUM3RDtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRDtBQUFBLElBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVVBLE9BQWMsVUFDYixZQUNBLFNBQVMsT0FDVCxPQUEyQixRQUMzQixNQUFNLGVBQ0w7QUFDRCxhQUFPLElBQUksYUFBYSxDQUFDLElBQUksY0FBYSxZQUFZLE1BQU0sQ0FBQyxHQUFHLE1BQU0sR0FBRztBQUFBLElBQzFFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFVQSxPQUFjLFdBQ2IsWUFDQSxTQUFTLE9BQ1QsT0FBMkIsUUFDM0IsTUFBTSxlQUNMO0FBQ0QsYUFBTyxJQUFJLGtCQUFrQixDQUFDLElBQUksY0FBYSxZQUFZLE1BQU0sQ0FBQyxHQUFHLE1BQU0sR0FBRztBQUFBLElBQy9FO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQWNPLE1BQU0sU0FBYztBQUMxQixhQUFPLGNBQWEsZUFBZSxTQUFTLEtBQUssWUFBWSxLQUFLLE1BQU07QUFBQSxJQUN6RTtBQUFBO0FBQUEsRUFhRDs7O0FDVU0sV0FBVSxXQUNkLFFBQ0EsT0FBMkI7QUFFM0IsV0FBTyxPQUFPLFVBQVUsY0FBYyxrQkFBa0I7RUFDMUQ7QUFZTSxXQUFVLGNBQ2QsT0FBMkI7QUFFM0IsV0FBTyxDQUFDLFdBQW9DLFdBQVcsUUFBUSxLQUFLO0VBQ3RFOzs7QUNwTE0sV0FBVSxnQkFBYTtBQUUzQixRQUFJLE9BQU8sZUFBZSxhQUFhO0FBQ3JDLGFBQU87SUFDVDtBQUdBLFFBQUksT0FBTyxXQUFXLGFBQWE7QUFFakMsYUFBTztJQUNUO0FBRUEsUUFBSSxPQUFPLFdBQVcsYUFBYTtBQUNqQyxhQUFPO0lBQ1Q7QUFHQSxRQUFJLE9BQU8sU0FBUyxhQUFhO0FBRS9CLGFBQU87SUFDVDtBQUVBLFFBQUksT0FBTyxXQUFXLGFBQWE7QUFFakMsYUFBTztJQUNUO0FBQ0EsVUFBTSxJQUFJLE1BQU0sZ0NBQWdDO0VBQ2xEOzs7QUNvUU0sV0FBVSxZQUFZLE9BQWM7QUFFeEMsUUFBSSxVQUFVLFFBQVEsVUFBVSxRQUFXO0FBQ3pDLGFBQU87SUFDVDtBQUNBLFdBQU8sT0FBTyxLQUFLO0VBQ3JCO0FBaWxCTSxXQUFVLGFBQWEsT0FBYztBQUN6QyxRQUFJLE9BQU8sVUFBVSxXQUFXO0FBQzlCLGFBQU87SUFDVDtBQUVBLFFBQUksVUFBVSxRQUFRLFVBQVUsUUFBVztBQUN6QyxhQUFPO0lBQ1Q7QUFDQSxRQUFJLE9BQU8sVUFBVSxVQUFVO0FBQzdCLGFBQU8sVUFBVSxLQUFLLFFBQVEsVUFBVSxXQUFXLFVBQVU7SUFDL0Q7QUFDQSxRQUFJLE9BQU8sVUFBVSxVQUFVO0FBQzdCLGFBQU8sT0FBTyxNQUFNLEtBQUssSUFBSSxRQUFRLFVBQVU7SUFDakQ7QUFFQSxXQUFPLENBQUMsQ0FBQztFQUNYOzs7QUN0MEJNLFdBQVUsT0FDZCxPQUNBQyxTQUFnQztBQUVoQyxXQUFPO01BQ0wsQ0FBQyxPQUFPLFFBQVEsR0FBRyxNQUFLO0FBQ3RCLGNBQU0sS0FBSyxNQUFNLE9BQU8sUUFBUSxFQUFDO0FBQ2pDLGVBQU87VUFDTCxNQUFNLE1BQUs7QUFDVCxnQkFBSTtBQUNKLGVBQUc7QUFDRCxvQkFBTSxPQUFPLEdBQUcsS0FBSTtBQUNwQixrQkFBSSxLQUFLLFNBQVMsTUFBTTtBQUN0Qix1QkFBTztjQUNUO0FBQ0Esc0JBQVEsS0FBSztZQUNmLFNBQVMsQ0FBQ0EsUUFBTyxLQUFLO0FBQ3RCLG1CQUFPLEVBQUUsTUFBTSxPQUFPLE1BQUs7VUFDN0I7O01BRUo7O0VBRUo7QUFtZ0JNLFdBQVUsV0FDZCxPQUNBLFdBQWlEO0FBRWpELFFBQUksUUFBUTtBQUNaLGVBQVcsUUFBUSxPQUFPO0FBQ3hCLFlBQU0sVUFBVSxVQUFVLE1BQU0sS0FBSztBQUNyQyxVQUFJLFNBQVM7QUFDWCxlQUFPO01BQ1Q7QUFDQSxlQUFTO0lBQ1g7QUFDQSxXQUFPO0VBQ1Q7OztBQ3ZsQkEsV0FBUyxnQ0FDUCxXQUNBLGdCQUFnRDtBQUVoRCxXQUFPO01BQ0wsQ0FBQyxPQUFPLFFBQVEsR0FBRyxNQUFLO0FBQ3RCLGNBQU0sU0FBUyxlQUFlLFVBQVUsU0FBUztBQUNqRCxZQUFJLFFBQVE7QUFDWixlQUFPO1VBQ0wsTUFBTSxNQUFLO0FBQ1QsZ0JBQUksUUFBMEI7QUFDOUIsbUJBQU8sUUFBUSxRQUFRO0FBQ3JCLHNCQUFRLGVBQWUsUUFBUSxXQUFXLEtBQUs7QUFDL0MsdUJBQVM7QUFDVCxrQkFBSSxVQUFVLFFBQVc7QUFDdkIsdUJBQU8sRUFBRSxNQUFNLE9BQU8sTUFBSztjQUM3QjtZQUNGO0FBQ0EsbUJBQU8sRUFBRSxNQUFNLE1BQU0sT0FBTyxPQUFTO1VBQ3ZDOztNQUVKOztFQUVKO0FBRUEsTUFBTSxvQkFBTixNQUF1QjtJQUlyQixZQUFZQyxNQUFzQixLQUFXO0FBQzNDLFdBQUssT0FBTyxXQUFXLElBQUk7QUFDM0IsV0FBSyxPQUFPQTtJQUNkO0lBQ0EsRUFOVSxPQUFPLGFBTWhCLE9BQU8sU0FBUSxJQUFDO0FBQ2YsYUFBTyxLQUFLLEtBQUssS0FBSTtJQUN2QjtJQUNBLElBQUksT0FBSTtBQUNOLGFBQU8sS0FBSyxLQUFLO0lBQ25CO0lBQ0EsVUFBTztBQUNMLFlBQU0sV0FBVyxLQUFLLEtBQUssS0FBSTtBQUMvQixZQUFNLG1CQUFpRDtRQUNyRCxDQUFDLE9BQU8sUUFBUSxHQUFHLE1BQU07UUFDekIsTUFBTSxNQUFLO0FBQ1QsZ0JBQU0sRUFBRSxNQUFNLE1BQUssSUFBSyxTQUFTLEtBQUk7QUFDckMsY0FBSSxTQUFTLE1BQU07QUFDakIsbUJBQU8sRUFBRSxNQUFNLE1BQU0sT0FBTyxPQUFTO1VBQ3ZDLE9BQU87QUFDTCxtQkFBTyxFQUFFLE1BQU0sT0FBTyxPQUFPLENBQUMsT0FBTyxLQUFLLEVBQUM7VUFDN0M7UUFDRjs7QUFFRixhQUFPO0lBQ1Q7SUFDQSxRQUNFLFlBQ0EsU0FBaUI7QUFFakIsV0FBSyxLQUFLLFFBQVEsQ0FBQ0MsSUFBRyxRQUFRLFdBQVcsS0FBSyxTQUFTLEtBQUssS0FBSyxJQUFJLENBQUM7SUFDeEU7SUFDQSxJQUFJLE9BQVU7QUFDWixhQUFPLEtBQUssS0FBSyxJQUFJLEtBQUs7SUFDNUI7SUFDQSxPQUFJO0FBQ0YsYUFBTyxLQUFLLEtBQUssS0FBSTtJQUN2QjtJQUNBLFNBQU07QUFDSixhQUFPLEtBQUssS0FBSyxLQUFJO0lBQ3ZCOztBQW1SSSxXQUFVLHVCQUNkLFdBQ0EsZ0JBQWdEO0FBRWhELFFBQUksTUFBTSxRQUFRLFNBQVMsR0FBRztBQUM1QixhQUFPO0lBQ1Q7QUFDQSxXQUFPLGdDQUFnQyxXQUFXLGNBQWM7RUFDbEU7OztBQ25WQSxNQUFNLE9BQU8sT0FBTyxNQUFNOzs7QUNibkIsTUFBTSxJQUFJLE9BQU8sa0JBQWtCO0FBdUJwQyxXQUFVLFNBQWUsTUFBVTtBQUN2QyxXQUFPO0VBQ1Q7QUFVTSxXQUFVLGFBQTRCQyxRQUFjLFNBQWU7QUFDdkUsV0FBT0E7RUFDVDtBQVVNLFdBQVUsY0FBNkIsUUFBZSxRQUFjO0FBQ3hFLFdBQU87RUFDVDtBQVFNLFdBQVUsb0JBQTRDLE1BQVU7QUFDcEUsV0FBTztFQUNUOzs7QUNnRU0sV0FBVSxXQUErQixRQUE0QjtBQUN6RSxXQUFPLE9BQU8sS0FBSyxNQUFNO0VBQzNCO0FBNEJNLFdBQVUsYUFBd0MsUUFBMEI7QUFDaEYsVUFBTSxTQUFrQixDQUFBO0FBQ3hCLGVBQVcsT0FBTyxXQUFXLE1BQU0sR0FBRztBQUNwQyxhQUFPLEtBQUssT0FBTyxHQUFHLENBQUM7SUFDekI7QUFDQSxXQUFPO0VBQ1Q7Ozs7O0FDdEtBLFdBQVMsMEJBQ1AsTUFDQSxPQUErQjtBQUUvQixVQUFNLEtBQUssS0FBSyxPQUFNO0FBQ3RCLFVBQU0sbUJBQTZDO01BQ2pELE1BQU0sTUFBSztBQUNULGlCQUFTLE1BQU0sR0FBRyxLQUFJLEdBQUksSUFBSSxTQUFTLE1BQU0sTUFBTSxHQUFHLEtBQUksR0FBSTtBQUM1RCxnQkFBTSxNQUFNLElBQUk7QUFDaEIsZ0JBQU0sUUFBUSxJQUFJLE1BQUs7QUFDdkIsY0FBSSxVQUFVLFFBQVc7QUFDdkIsbUJBQU8sRUFBRSxNQUFNLE9BQU8sT0FBTyxNQUFNLEtBQUssRUFBQztVQUMzQztRQUNGO0FBQ0EsZUFBTyxFQUFFLE1BQU0sTUFBTSxPQUFPLE9BQVM7TUFDdkM7TUFDQSxDQUFDLE9BQU8sUUFBUSxHQUFHLE1BQU07O0FBRTNCLFdBQU87RUFDVDtBQU9BLFdBQVMsMEJBQ1AsTUFDQUMsTUFDQSxPQUF5QztBQUV6QyxVQUFNLEtBQUssS0FBSyxPQUFNO0FBQ3RCLFVBQU0sbUJBQTZDO01BQ2pELE1BQU0sTUFBSztBQUNULGlCQUFTLE1BQU0sR0FBRyxLQUFJLEdBQUksSUFBSSxTQUFTLE1BQU0sTUFBTSxHQUFHLEtBQUksR0FBSTtBQUM1RCxnQkFBTSxNQUFNLElBQUksTUFBTSxNQUFLO0FBQzNCLGNBQUksUUFBUSxRQUFXO0FBQ3JCLGtCQUFNLFFBQVFBLEtBQUksSUFBSSxHQUFHO0FBQ3pCLGdCQUFJLFVBQVUsUUFBVztBQUN2QixvQkFBTSxTQUFTLE1BQU0sS0FBSyxNQUFNLEtBQUs7QUFDckMscUJBQU8sRUFBRSxNQUFNLE9BQU8sT0FBTyxPQUFNO1lBQ3JDO1VBQ0Y7UUFDRjtBQUNBLGVBQU8sRUFBRSxNQUFNLE1BQU0sT0FBTyxPQUFTO01BQ3ZDO01BQ0EsQ0FBQyxPQUFPLFFBQVEsR0FBRyxNQUFNOztBQUUzQixXQUFPO0VBQ1Q7QUFNQSxNQUFNLGtCQUFOLE1BQXFCO0lBK0JuQixjQUFBO0FBOUJTLFdBQUEsRUFBQSxJQUF1QjtBQTRCeEIsV0FBQSxNQUFjLE9BQU87QUFHM0IsV0FBSyxPQUFPLG9CQUFJLFFBQU87QUFDdkIsV0FBSyxRQUFRLG9CQUFJLElBQUc7QUFDcEIsV0FBSyxhQUFhLElBQUkscUJBQXFCLENBQUMsT0FBTyxLQUFLLE1BQU0sT0FBTyxFQUFFLENBQUM7SUFDMUU7SUFFQSxFQUFBLEtBcENVLE9BQU8sYUFvQ2hCLE9BQU8sU0FBUSxJQUFDO0FBQ2YsYUFBTywwQkFBMEIsS0FBSyxPQUFPLFFBQVE7SUFDdkQ7SUFFQSxJQUFJLE9BQUk7QUFDTixhQUFPLEtBQUssTUFBTTtJQUNwQjtJQUVBLElBQUksT0FBWTtBQUNkLFVBQUksQ0FBQyxLQUFLLEtBQUssSUFBSSxLQUFLLEdBQUc7QUFDekIsY0FBTSxLQUFLLEtBQUs7QUFDaEIsYUFBSyxLQUFLLElBQUksT0FBTyxFQUFFO0FBQ3ZCLGFBQUssTUFBTSxJQUFJLElBQUksSUFBSSxRQUFRLEtBQUssQ0FBQztBQUNyQyxhQUFLLFdBQVcsU0FBUyxPQUFPLElBQUksS0FBSztNQUMzQztBQUNBLGFBQU87SUFDVDtJQUVBLFFBQUs7QUFDSCxlQUFTLEtBQUssS0FBSyxNQUFNLE9BQU0sR0FBSSxNQUFNLEdBQUcsS0FBSSxHQUFJLElBQUksU0FBUyxNQUFNLE1BQU0sR0FBRyxLQUFJLEdBQUk7QUFDdEYsY0FBTSxRQUFRLElBQUksTUFBTSxNQUFLO0FBQzdCLFlBQUksVUFBVSxRQUFXO0FBQ3ZCLGVBQUssS0FBSyxPQUFPLEtBQUs7QUFDdEIsZUFBSyxXQUFXLFdBQVcsS0FBSztRQUNsQztNQUNGO0FBQ0EsV0FBSyxNQUFNLE1BQUs7SUFDbEI7SUFFQSxPQUFPLE9BQVk7QUFDakIsWUFBTSxLQUFLLEtBQUssS0FBSyxJQUFJLEtBQUs7QUFDOUIsVUFBSSxPQUFPLFFBQVc7QUFDcEIsZUFBTztNQUNUO0FBQ0EsV0FBSyxNQUFNLE9BQU8sRUFBRTtBQUNwQixXQUFLLEtBQUssT0FBTyxLQUFLO0FBQ3RCLFdBQUssV0FBVyxXQUFXLEtBQUs7QUFDaEMsYUFBTztJQUNUO0lBRUEsVUFBTztBQUNMLGFBQU8sMEJBQTBCLEtBQUssT0FBTyxDQUFDLFVBQVUsQ0FBQyxPQUFPLEtBQUssQ0FBQztJQUN4RTtJQUVBLFFBQ0UsWUFDQSxTQUFXO0FBRVgsaUJBQVcsT0FBTyxLQUFLLE1BQU0sT0FBTSxHQUFJO0FBQ3JDLGNBQU0sT0FBTyxJQUFJLE1BQUs7QUFDdEIsWUFBSSxTQUFTLFFBQVc7QUFDdEIscUJBQVcsS0FBSyxTQUFTLE1BQU0sTUFBTSxJQUFJO1FBQzNDO01BQ0Y7SUFDRjtJQUVBLElBQUksT0FBWTtBQUNkLGFBQU8sS0FBSyxLQUFLLElBQUksS0FBSztJQUM1QjtJQUVBLE9BQUk7QUFDRixhQUFPLEtBQUssT0FBTTtJQUNwQjtJQUVBLFNBQU07QUFDSixhQUFPLDBCQUEwQixLQUFLLE9BQU8sUUFBUTtJQUN2RDs7QUFRRixNQUFNLGtCQUFOLE1BQXFCO0lBK0JuQixjQUFBO0FBOUJTLFdBQUEsRUFBQSxJQUF1QjtBQTRCeEIsV0FBQSxNQUFjLE9BQU87QUFHM0IsV0FBSyxPQUFPLG9CQUFJLFFBQU87QUFDdkIsV0FBSyxRQUFRLG9CQUFJLElBQUc7QUFDcEIsV0FBSyxhQUFhLElBQUkscUJBQXFCLENBQUMsT0FBTyxLQUFLLE1BQU0sT0FBTyxFQUFFLENBQUM7SUFDMUU7SUFFQSxFQUFBLEtBcENVLE9BQU8sYUFvQ2hCLE9BQU8sU0FBUSxJQUFDO0FBQ2YsYUFBTywwQkFBMEIsS0FBSyxPQUFPLEtBQUssTUFBTSxnQkFBZ0I7SUFDMUU7SUFFQSxJQUFJLE9BQUk7QUFDTixhQUFPLEtBQUssTUFBTTtJQUNwQjtJQUVBLFFBQUs7QUFDSCxlQUFTLEtBQUssS0FBSyxNQUFNLE9BQU0sR0FBSSxNQUFNLEdBQUcsS0FBSSxHQUFJLElBQUksU0FBUyxNQUFNLE1BQU0sR0FBRyxLQUFJLEdBQUk7QUFDdEYsY0FBTSxNQUFNLElBQUksTUFBTSxNQUFLO0FBQzNCLFlBQUksUUFBUSxRQUFXO0FBQ3JCLGVBQUssS0FBSyxPQUFPLEdBQUc7QUFDcEIsZUFBSyxXQUFXLFdBQVcsR0FBRztRQUNoQztNQUNGO0FBQ0EsV0FBSyxNQUFNLE1BQUs7SUFDbEI7SUFFQSxPQUFPLEtBQVE7QUFDYixZQUFNLFFBQVEsS0FBSyxLQUFLLElBQUksR0FBRztBQUMvQixVQUFJLFVBQVUsUUFBVztBQUN2QixlQUFPO01BQ1Q7QUFDQSxXQUFLLE1BQU0sT0FBTyxNQUFNLEVBQUU7QUFDMUIsV0FBSyxLQUFLLE9BQU8sR0FBRztBQUNwQixXQUFLLFdBQVcsV0FBVyxHQUFHO0FBQzlCLGFBQU87SUFDVDtJQUVBLFVBQU87QUFDTCxhQUFPLDBCQUEwQixLQUFLLE9BQU8sS0FBSyxNQUFNLGdCQUFnQjtJQUMxRTtJQUVBLFFBQ0UsWUFDQSxTQUFpQjtBQUVqQixpQkFBVyxPQUFPLEtBQUssTUFBTSxPQUFNLEdBQUk7QUFDckMsY0FBTSxNQUFNLElBQUksTUFBSztBQUNyQixZQUFJLFFBQVEsUUFBVztBQUNyQixnQkFBTSxRQUFRLEtBQUssS0FBSyxJQUFJLEdBQUc7QUFDL0IsY0FBSSxVQUFVLFFBQVc7QUFDdkIsdUJBQVcsS0FBSyxTQUFTLE1BQU0sT0FBTyxLQUFLLElBQUk7VUFDakQ7UUFDRjtNQUNGO0lBQ0Y7SUFFQSxJQUFJLEtBQVE7O0FBQ1YsY0FBTyxLQUFBLEtBQUssS0FBSyxJQUFJLEdBQUcsT0FBQyxRQUFBLE9BQUEsU0FBQSxTQUFBLEdBQUU7SUFDN0I7SUFFQSxJQUFJLEtBQVE7QUFDVixhQUFPLEtBQUssS0FBSyxJQUFJLEdBQUc7SUFDMUI7SUFFQSxPQUFJO0FBQ0YsYUFBTywwQkFBMEIsS0FBSyxPQUFPLEtBQUssTUFBTSxZQUFZO0lBQ3RFO0lBRUEsSUFBSSxLQUFVLE9BQVk7QUFDeEIsVUFBSSxLQUFLLEtBQUssSUFBSSxHQUFHLEdBQUc7QUFDdEIsY0FBTSxRQUFRLEtBQUssS0FBSyxJQUFJLEdBQUc7QUFDL0IsWUFBSSxVQUFVLFFBQVc7QUFDdkIsZ0JBQU0sUUFBUTtRQUNoQjtNQUNGLE9BQU87QUFDTCxjQUFNLEtBQUssS0FBSztBQUNoQixhQUFLLEtBQUssSUFBSSxLQUFLLEVBQUUsSUFBSSxNQUFLLENBQUU7QUFDaEMsYUFBSyxNQUFNLElBQUksSUFBSSxJQUFJLFFBQVEsR0FBRyxDQUFDO0FBQ25DLGFBQUssV0FBVyxTQUFTLEtBQUssSUFBSSxHQUFHO01BQ3ZDO0FBQ0EsYUFBTztJQUNUO0lBRUEsU0FBTTtBQUNKLGFBQU8sMEJBQTBCLEtBQUssT0FBTyxLQUFLLE1BQU0sYUFBYTtJQUN2RTs7OztBQ3NFSSxXQUFVLFdBQ2QsYUFDQSxZQUNBLE1BQWlCO0FBRWpCLFVBQU0sWUFBWSxTQUFJLFFBQUosU0FBSSxTQUFKLE9BQVEsY0FBYSxFQUFHLFVBQVUsaUJBQWlCLFdBQVc7QUFDaEYsV0FBTyxDQUFDLEdBQUcsT0FBTyxtQkFBbUIsUUFBUSxHQUFHLGNBQWMsVUFBVSxDQUFDLENBQUM7RUFDNUU7QUFZTSxXQUFVLGFBQWEsYUFBcUIsTUFBaUI7QUFDakUsV0FBTyxXQUFXLGFBQWEsYUFBYSxJQUFJO0VBQ2xEO0FBOENNLFdBQVUsUUFDZCxhQUNBLFlBQ0EsTUFBaUI7QUFFakIsVUFBTSxXQUFXLFNBQUksUUFBSixTQUFJLFNBQUosT0FBUSxjQUFhLEVBQUcsVUFBVSxjQUFjLFdBQVc7QUFDNUUsV0FBTyxXQUFXLFNBQVMsVUFBVSxJQUFJLFVBQVU7RUFDckQ7QUFZTSxXQUFVLFVBQVUsYUFBcUIsTUFBaUI7QUFDOUQsV0FBTyxRQUFRLGFBQWEsYUFBYSxJQUFJO0VBQy9DOzs7QUNwYkEsTUFBTSx3QkFBOEU7SUFDbEYsU0FBUyxDQUFDLE1BQU0sVUFBVSxLQUFLLEtBQUssS0FBSztJQUN6QyxXQUFXLENBQUMsU0FBUyxLQUFLOztBQW1FdEIsV0FBVSx3QkFBcUI7QUFLbkMsV0FBTztFQUNUO0FBa0JNLFdBQVUsbUJBQ2QsVUFBMkI7QUFFM0IsV0FBTyx1QkFBdUIsVUFBVSxzQkFBcUIsQ0FBRTtFQUNqRTs7O0FDekdBLGdDQUF5QjtBQUlsQixNQUFNLGVBQU4sTUFBTSxxQkFBb0IsZUFBZTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUE0TTlDLGNBQWM7QUFDWixZQUFNO0FBdE1SO0FBQUE7QUFBQTtBQUFBLFdBQWdCLGtCQUFzRCxJQUFJLE1BQW1DO0FBRTdHO0FBQUEsV0FBZ0IsaUJBQXFELElBQUksTUFBbUM7QUFFNUc7QUFBQSxXQUFnQixtQkFBdUQsSUFBSSxNQUFtQztBQVE5RztBQUFBO0FBQUEsV0FBVSxXQUEwQixJQUFJLE1BQWM7QUFpR3REO0FBQUEsV0FBTyxZQUFvQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBbUYzQjtBQUFBO0FBQUE7QUFBQSxXQUFVLGlCQUFpQjtBQVF6QixXQUFLLGlCQUFpQixhQUFhLENBQUMsVUFBVTtBQUM1QyxjQUFNLGVBQWU7QUFDckIsY0FBTSx5QkFBeUI7QUFDL0IsY0FBTSxnQkFBZ0I7QUFBQSxNQUN4QixDQUFDO0FBR0QsVUFBSSxhQUFhLFNBQVMsRUFBRSxNQUFNLElBQUk7QUFHdEMsV0FBSyxhQUFhLEVBQUUsTUFBTSxPQUFPLENBQUM7QUFFbEMsV0FBSyxZQUFZLEtBQUssYUFBYSxXQUFXLEtBQUs7QUFDbkQsV0FBSyxVQUFVLEtBQUssYUFBYSxTQUFTLEdBQUcsTUFBTSxLQUFLLFNBQVMsS0FBSyxDQUFDO0FBQ3ZFLFdBQUssYUFDSCxLQUFLLGFBQWEsWUFBWSxLQUM5QjtBQUNGLFdBQUssY0FBYyxLQUFLLGFBQWEsYUFBYSxLQUFLO0FBQ3ZELFdBQUssVUFBVSxLQUFLLGFBQWEsU0FBUyxHQUFHLFlBQVksTUFBTTtBQUcvRCxXQUFLLFVBQVUsSUFBSSxjQUFjLGVBQWU7QUFFaEQsV0FBSyxnQkFBZ0IsU0FBUyxjQUFjLE9BQU87QUFDbkQsV0FBSyxjQUFjLFlBQVksR0FBRyxLQUFLLFVBQVUsS0FBSyxhQUFhLEtBQUssV0FBVztBQUVuRixZQUFNLFFBQVEsU0FBUyxjQUFjLE9BQU87QUFDNUMsWUFBTSxZQUFZO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFTbEIsV0FBSyxnQkFBZ0IsS0FBSyxZQUFZLEtBQUssYUFBYTtBQUV4RCxjQUFRLFFBQW9CLEtBQUssVUFBVSxFQUFFLFlBQVksS0FBSztBQUU5RCxXQUFLLE9BQU87QUFBQSxJQUNkO0FBQUE7QUFBQTtBQUFBLElBMU9BLFdBQVcscUJBQW9DO0FBQzdDLGFBQU8sQ0FBQyxXQUFXLGFBQWEsY0FBYyxlQUFlLFNBQVM7QUFBQSxJQUN4RTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFRQSxJQUFXLFVBQXlCO0FBQ2xDLGFBQU8sS0FBSztBQUFBLElBQ2Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBS0EsSUFBVyxRQUFRLE9BQXNCO0FBQ3ZDLFdBQUssV0FBVztBQUVoQixVQUFJLEtBQUssU0FBUyxXQUFXLEdBQUc7QUFDOUIsYUFBSyxPQUFPO0FBQUEsTUFDZDtBQUFBLElBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBV0EsSUFBVyxrQkFBa0IsT0FBc0Q7QUFDakYsV0FBSyxxQkFBcUI7QUFFMUIsV0FBSyxPQUFPO0FBQUEsSUFDZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFPQSxJQUFXLHdCQUF3QixPQUFzRDtBQUN2RixXQUFLLDJCQUEyQjtBQUFBLElBQ2xDO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFJQSxJQUFXLGdCQUFnQixPQUFlO0FBQ3hDLFdBQUssYUFBYSx5TUFBeU0sS0FBSztBQUFBLElBQ2xPO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBTUEsSUFBVyx1QkFBb0M7QUFDN0MsYUFBTyxTQUFTO0FBQUEsUUFDZCxRQUFRLFFBQW9CLEtBQUssVUFBVSxFQUFFLGNBQWMsNkNBQTZDO0FBQUEsUUFDeEc7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFLQSxJQUFXLGdCQUF3QjtBQUNqQyxhQUNFLFVBQVUsK0NBQStDLEtBQUssY0FBYyxNQUFTLEdBQUcsUUFBUSxZQUFZO0FBQUEsSUFFaEg7QUFBQSxJQWNBLElBQVcsVUFBbUI7QUFDNUIsYUFBTyxLQUFLLGFBQWEsU0FBUyxHQUFHLFlBQVksTUFBTTtBQUFBLElBQ3pEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUtBLElBQVcsUUFBUSxPQUFnQjtBQUNqQyxXQUFLLGFBQWEsV0FBVyxRQUFRLFNBQVMsT0FBTztBQUFBLElBQ3ZEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQW1CQSxJQUFXLFNBQXVDO0FBQ2hELGFBQU8sS0FBSztBQUFBLElBQ2Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFZQSxJQUFXLE9BQU8sT0FBeUI7QUFDekMsVUFBSSxLQUFLLFdBQVcsS0FBSyxZQUFZLE9BQU87QUFDMUMsYUFBSyxRQUFRLG9CQUFvQixTQUFTLEtBQUssYUFBYTtBQUM1RCxhQUFLLFFBQVEsb0JBQW9CLFNBQVMsS0FBSyxhQUFhO0FBQzVELGFBQUssUUFBUSxvQkFBb0IsV0FBVyxLQUFLLGVBQWU7QUFDaEUsYUFBSyxRQUFRLG9CQUFvQixTQUFTLEtBQUssYUFBYTtBQUM1RCxhQUFLLFFBQVEsb0JBQW9CLG1CQUFtQixLQUFLLGFBQWE7QUFBQSxNQUN4RTtBQUVBLFdBQUssVUFBVTtBQUVmLFdBQUssUUFBUSxpQkFBaUIsU0FBUyxLQUFLLGNBQWMsS0FBSyxJQUFJLENBQUM7QUFDcEUsV0FBSyxRQUFRLGlCQUFpQixTQUFTLEtBQUssY0FBYyxLQUFLLElBQUksQ0FBQztBQUNwRSxXQUFLLFFBQVEsaUJBQWlCLFdBQVcsS0FBSyxnQkFBZ0IsS0FBSyxJQUFJLENBQUM7QUFDeEUsV0FBSyxRQUFRLGlCQUFpQixTQUFTLEtBQUssY0FBYyxLQUFLLElBQUksQ0FBQztBQUNwRSxXQUFLLFFBQVEsaUJBQWlCLG1CQUFtQixLQUFLLGNBQWMsS0FBSyxJQUFJLENBQUM7QUFFOUUsVUFBSSxTQUFTLGtCQUFrQixLQUFLLFNBQVM7QUFDM0MsYUFBSyxjQUFjLElBQUksTUFBTSxPQUFPLENBQUM7QUFBQSxNQUN2QztBQUVBLFlBQU0sU0FBUyxRQUFRLFFBQW9CLEtBQUssVUFBVTtBQUUxRCxpQkFBVyxZQUFZLE9BQU8saUJBQWlCLE9BQU8sR0FBRztBQUN2RCxpQkFBUyxVQUNQLEtBQUssUUFBUSxNQUFNLFlBQVksRUFBRSxRQUFRLFNBQVMsZUFBZSxRQUFRLFVBQVUsWUFBWSxLQUFLLEVBQUUsTUFBTTtBQUFBLE1BQ2hIO0FBRUEsaUJBQVcsVUFBVSxhQUFhLHNDQUFzQyxNQUFNLEdBQUc7QUFDL0UsZUFBTyxNQUFNLFVBQVU7QUFBQSxNQUN6QjtBQUVBLFlBQU0sU0FBUyxPQUFPLGNBQWMsNkNBQTZDO0FBRWpGLFVBQUksV0FBVyxNQUFNO0FBQ25CLGNBQU1DLFVBQVMsU0FBUztBQUFBLFVBQ3RCLE9BQU8sY0FBYyw2Q0FBNkM7QUFBQSxVQUNsRTtBQUFBLFFBQ0Y7QUFFQSxjQUFNLGlCQUFpQixPQUFPLGlCQUFpQixvQ0FBb0M7QUFFbkYsWUFBSSxlQUFlLENBQUMsTUFBTUEsU0FBUTtBQUNoQyxtQkFBUztBQUFBLFlBQ1AsT0FBTyxjQUFjLG9DQUFvQztBQUFBLFlBQ3pEO0FBQUEsVUFDRixFQUFFLFVBQVUsSUFBSSxVQUFVO0FBRTFCLFVBQUFBLFFBQU8sVUFBVSxPQUFPLFVBQVU7QUFBQSxRQUNwQztBQUFBLE1BQ0Y7QUFBQSxJQUVGO0FBQUE7QUFBQSxJQXVEVSxTQUFlO0FBQ3ZCLFlBQU0sU0FBUyxRQUFRLFFBQW9CLEtBQUssVUFBVTtBQUUxRCxpQkFBVyxZQUFZLE9BQU8saUJBQWlCLHVDQUF1QyxHQUFHO0FBQ3ZGLGlCQUFTLE9BQU87QUFBQSxNQUNsQjtBQUVBLGlCQUFXLFVBQVUsS0FBSyxTQUFTO0FBQ2pDLGVBQU8sYUFBYTtBQUFBLHFFQUMyQyxLQUFLLFFBQVEsQ0FBQyxNQUFNLFNBQVMsYUFBYSxFQUFFO0FBQUE7QUFBQSxtQ0FFOUUsTUFBTTtBQUFBLG1DQUNOLEtBQUsscUJBQXFCLEtBQUssbUJBQW1CLE1BQU0sSUFBSSxNQUFNO0FBQUEsTUFDakc7QUFHQSxpQkFBVyxZQUFZLE9BQU8saUJBQWlCLHNCQUFzQixHQUFHO0FBQ3RFLGlCQUFTLGlCQUFpQixTQUFTLEtBQUssV0FBVyxLQUFLLElBQUksQ0FBQztBQUFBLE1BQy9EO0FBQ0EsaUJBQVcsVUFBVSxPQUFPLGlCQUFpQixxQkFBcUIsR0FBRztBQUNuRSxlQUFPLGlCQUFpQixTQUFTLEtBQUssU0FBUyxLQUFLLElBQUksQ0FBQztBQUFBLE1BQzNEO0FBQUEsSUFFRjtBQUFBLElBUUEseUJBRUUsTUFDQSxVQUdBLFVBQ007QUFDTixjQUFRLE1BQU07QUFBQSxRQUNaLEtBQUs7QUFDSCxlQUFLLFVBQVUsU0FBUyxNQUFNLEtBQUssU0FBUztBQUU1QyxlQUFLLE9BQU87QUFFWjtBQUFBLFFBQ0YsS0FBSztBQUNILGVBQUssWUFBWTtBQUVqQixlQUFLLE9BQU87QUFFWjtBQUFBLFFBQ0YsS0FBSztBQUNILGVBQUssY0FBYyxZQUFZLEdBQUcsU0FBUyxZQUFZLE1BQU0sU0FBUyxLQUFLLFlBQVksRUFBRSxtQ0FDdkYsU0FBUyxZQUFZLE1BQU0sU0FBUyxLQUFLLGFBQWEsS0FBSyxXQUM3RDtBQUVBO0FBQUEsUUFDRixLQUFLO0FBQ0gsZUFBSyxhQUFhO0FBRWxCLGNBQUksS0FBSyxTQUFTO0FBQ2hCLGlCQUFLLGNBQWMsWUFBWSxHQUFHLEtBQUssU0FBUyxtQ0FBbUMsS0FBSyxVQUFVO0FBQUEsVUFDcEc7QUFFQTtBQUFBLFFBQ0YsS0FBSztBQUNILGVBQUssY0FBYztBQUNuQixjQUFJLENBQUMsS0FBSyxTQUFTO0FBQ2pCLGlCQUFLLGNBQWMsWUFBWSxHQUFHLEtBQUssU0FBUyxtQ0FBbUMsS0FBSyxXQUFXO0FBQUEsVUFDckc7QUFFQTtBQUFBLE1BQ0o7QUFBQSxJQUNGO0FBQUEsSUFPQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFdBQWMsY0FBdUIsTUFBTTtBQUN6Qyx1QkFBZSxPQUFPLGtCQUFrQixjQUFhLEVBQUUsU0FBUyxNQUFNLENBQUM7QUFFdkUsZUFBTztBQUFBLE1BQ1QsR0FBRztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVFPLFdBQVcsT0FBb0I7QUFDdkMsWUFBTSxTQUFTLFNBQVMsUUFBMEIsS0FBSyxRQUFRLGdCQUFnQjtBQUMvRSxZQUFNLGNBQWMsU0FBUyxRQUEwQixNQUFNLFFBQVEsZ0JBQWdCO0FBRXJGLGFBQU8sTUFBTTtBQUViLFlBQU0sU0FBUyxZQUFZLGVBQWUsYUFBYSxnQkFBZ0IsR0FBRyxZQUFZLEtBQUs7QUFFM0YsVUFBSSxZQUFZLFNBQVM7QUFHdkIsWUFBSSxPQUFPLG1CQUFtQixHQUFHO0FBQy9CLGlCQUFPLFFBQVEsR0FBRyxPQUFPLEtBQUssQ0FBQyxHQUFHLE9BQU8sTUFBTSxXQUFXLElBQUksS0FBSyxHQUFHO0FBQUEsUUFDeEUsT0FBTztBQUNMLGNBQUksT0FBTyxtQkFBbUIsTUFBTTtBQUVsQyxnQkFBSSxlQUFlLE9BQU87QUFFMUIsbUJBQU8sT0FBTyxNQUFNLEVBQUUsWUFBWSxNQUFNLEtBQUssYUFBYSxpQkFBaUIsR0FBRztBQUFBLFlBQUM7QUFDL0UsZ0JBQUksYUFBYSxPQUFPLGlCQUFpQjtBQUV6QyxtQkFBTyxPQUFPLE1BQU0sRUFBRSxVQUFVLE1BQU0sS0FBSyxhQUFhLGVBQWUsT0FBTyxNQUFNLFFBQVE7QUFBQSxZQUFDO0FBRzdGLG1CQUFPLFFBQVEsT0FBTyxNQUFNO0FBQUEsY0FDMUIsT0FBTyxNQUNKLEtBQUssRUFDTCxVQUFVLGdCQUFnQixPQUFPLE1BQU0sWUFBWSxNQUFNLEtBQUssWUFBWSxJQUFLLElBQUksVUFBVTtBQUFBLGNBQ2hHLEdBQUcsT0FBTyxLQUFLLENBQUM7QUFBQSxZQUNsQjtBQUVBLG1CQUFPLGtCQUFrQixZQUFZLFVBQVU7QUFBQSxVQUNqRDtBQUFBLFFBQ0Y7QUFBQSxNQUdGLE9BQU87QUFFTCxjQUFNLGNBQWMsT0FBTyxNQUFNLEtBQUs7QUFFdEMsZUFBTyxRQUFRLFlBQ1osWUFBWSxFQUNaO0FBQUEsV0FDRSxZQUFZLFFBQVEsSUFBSSxNQUFNLEVBQUUsTUFBTSxLQUFLLEtBQUssT0FDL0MsVUFDQyxZQUFZLFFBQVEsSUFBSSxNQUFNLEVBQUUsTUFBTSxLQUFLLE1BQU07QUFBQSxVQUNwRDtBQUFBLFFBQ0Y7QUFBQSxNQUVKO0FBQUEsSUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBT1UsU0FBUyxPQUFvQjtBQUNyQyxZQUFNLGNBQWMsU0FBUyxRQUFxQixNQUFNLFFBQVEsV0FBVztBQUMzRSxZQUFNLGdCQUFnQixTQUFTO0FBQUEsUUFDN0IsUUFBUTtBQUFBLFVBQ04sUUFBUSxRQUFvQixLQUFLLFVBQVUsRUFBRSxjQUFjLDZDQUE2QztBQUFBLFFBQzFHO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFFQSxvQkFBYyxVQUFVLE9BQU8sVUFBVTtBQUV6QyxZQUFNLHNCQUFzQixZQUFZO0FBRXhDLFVBQUkscUJBQXFCO0FBQ3ZCLDRCQUFvQixVQUFVLElBQUksVUFBVTtBQUM1Qyw0QkFBb0IsZUFBZSxFQUFFLFVBQVUsVUFBVSxRQUFRLFVBQVUsT0FBTyxTQUFTLENBQUM7QUFBQSxNQUM5RjtBQUVBLGlCQUFXLFdBQVcsS0FBSyxpQkFBaUI7QUFDMUMsY0FBTSxZQUFZLFlBQVksZUFBZSxRQUFRO0FBRXJELFlBQUksV0FBVztBQUNiLGtCQUFRLFNBQVM7QUFBQSxRQUNuQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVFVLGNBQWMsT0FBNEI7QUFDbEQsVUFBSSxNQUFNLFFBQVEsZUFBZSxNQUFNLFFBQVEsYUFBYSxNQUFNLFFBQVEsV0FBVyxNQUFNLFFBQVEsS0FBSztBQUN0RyxjQUFNLGVBQWU7QUFDckIsY0FBTSxnQkFBZ0I7QUFDdEIsY0FBTSx5QkFBeUI7QUFBQSxNQUNqQztBQUFBLElBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBS0EsSUFBVyx3QkFBd0Q7QUFDakUsWUFBTSxTQUFTLFFBQVEsUUFBb0IsS0FBSyxVQUFVO0FBQzFELFVBQUksVUFBVSx1QkFBdUIsT0FBTyxjQUFjLDZDQUE2QyxDQUFDO0FBRXhHLGFBQU8sV0FBVyxRQUFRLFFBQVEsTUFBTSxZQUFZLFFBQVE7QUFDMUQsa0JBQVUsdUJBQXVCLE9BQU87QUFBQSxNQUMxQztBQUVBLFVBQUksWUFBWSxRQUFRLENBQUMsUUFBUSxhQUFhLE1BQU0sR0FBRztBQUNyRCxjQUFNLFVBQVUsYUFBYSxzQ0FBc0MsTUFBTTtBQUV6RSxrQkFBVSxRQUFRLFFBQVEsU0FBUyxDQUFDLEtBQUs7QUFFekMsZUFBTyxZQUFZLFFBQVEsUUFBUSxNQUFNLFlBQVksUUFBUTtBQUMzRCxvQkFBVSx1QkFBdUIsT0FBTztBQUFBLFFBQzFDO0FBQUEsTUFDRjtBQUVBLGFBQU87QUFBQSxJQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUtBLElBQVcsb0JBQW9EO0FBQzdELFlBQU0sU0FBUyxRQUFRLFFBQW9CLEtBQUssVUFBVTtBQUUxRCxVQUFJLFVBQVUsbUJBQW1CLE9BQU8sY0FBYyw2Q0FBNkMsQ0FBQztBQUVwRyxhQUFPLFlBQVksUUFBUSxRQUFRLE1BQU0sWUFBWSxRQUFRO0FBQzNELGtCQUFVLG1CQUFtQixPQUFPO0FBQUEsTUFDdEM7QUFFQSxVQUFJLFlBQVksTUFBTTtBQUNwQixrQkFBVSxPQUFPLGNBQWMsb0NBQW9DO0FBRW5FLGVBQU8sWUFBWSxRQUFRLFFBQVEsTUFBTSxZQUFZLFFBQVE7QUFDM0Qsb0JBQVUsbUJBQW1CLE9BQU87QUFBQSxRQUN0QztBQUFBLE1BQ0Y7QUFFQSxhQUFPO0FBQUEsSUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFRTyxnQkFBZ0IsT0FBNEI7QUFDakQsVUFBSSxDQUFDLEtBQUssU0FBUztBQUNqQjtBQUFBLE1BQ0Y7QUFFQSxXQUFLLFVBQVUsTUFBTTtBQUVyQixVQUFJLE1BQU0sUUFBUSxVQUFVO0FBQzFCLGFBQUssY0FBYyxLQUFLO0FBRXhCO0FBQUEsTUFDRjtBQUVBLFVBQUksTUFBTSxRQUFRLGVBQWUsTUFBTSxRQUFRLGFBQWEsTUFBTSxRQUFRLFdBQVcsTUFBTSxRQUFRLEtBQUs7QUFDdEcsY0FBTSxlQUFlO0FBQ3JCLGNBQU0sZ0JBQWdCO0FBQ3RCLGNBQU0seUJBQXlCO0FBQUEsTUFDakM7QUFFQSxZQUFNLFNBQVMsUUFBUSxRQUFvQixLQUFLLFVBQVU7QUFFMUQsY0FBUSxNQUFNLEtBQUs7QUFBQSxRQUNqQixLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQ0g7QUFDRSxrQkFBTSxTQUFTLFFBQVE7QUFBQSxjQUNyQixTQUFTO0FBQUEsZ0JBQ1AsT0FBTyxjQUFjLDZDQUE2QztBQUFBLGdCQUNsRTtBQUFBLGNBQ0Y7QUFBQSxZQUNGO0FBRUEsa0JBQU0sZUFBZSxRQUFRO0FBQUEsY0FDM0IsTUFBTSxRQUFRLGNBQWMsS0FBSyxvQkFBb0IsS0FBSztBQUFBLFlBQzVEO0FBRUEseUJBQWEsVUFBVSxJQUFJLFVBQVU7QUFDckMsbUJBQU8sVUFBVSxPQUFPLFVBQVU7QUFFbEMsa0JBQU0sV0FBVyxRQUFRO0FBQUEsY0FDdkIsUUFBUTtBQUFBLGdCQUNOLFNBQVM7QUFBQSxrQkFDUCxVQUFVLCtDQUErQyxNQUFNO0FBQUEsa0JBQy9EO0FBQUEsZ0JBQ0Y7QUFBQSxjQUNGLEVBQUUsUUFBUTtBQUFBLFlBQ1o7QUFFQSx5QkFBYSxlQUFlO0FBQUEsY0FDMUIsVUFBVTtBQUFBLGNBQ1YsT0FBTztBQUFBLGNBQ1AsUUFBUTtBQUFBLFlBQ1YsQ0FBQztBQUVELHVCQUFXLFdBQVcsS0FBSyxpQkFBaUI7QUFDMUMsc0JBQVEsUUFBUTtBQUFBLFlBQ2xCO0FBQUEsVUFDRjtBQUVBO0FBQUEsUUFDRixLQUFLO0FBQ0g7QUFDRSxrQkFBTSxnQkFBZ0IsUUFBUTtBQUFBLGNBQzVCLFFBQVE7QUFBQSxnQkFDTixTQUFTO0FBQUEsa0JBQ1AsVUFBVSwrQ0FBK0MsTUFBTTtBQUFBLGtCQUMvRDtBQUFBLGdCQUNGO0FBQUEsY0FDRixFQUFFLFFBQVE7QUFBQSxZQUNaO0FBRUEsb0JBQVEsUUFBMEIsS0FBSyxNQUFNLEVBQUUsUUFBUSxLQUFLLDJCQUN4RCxLQUFLLHlCQUF5QixhQUFhLEVBQUUsS0FBSyxJQUNsRCxRQUFRO0FBQUEsY0FDTixRQUFRO0FBQUEsZ0JBQ04sU0FBUztBQUFBLGtCQUNQLFVBQVUsK0NBQStDLE1BQU07QUFBQSxrQkFDL0Q7QUFBQSxnQkFDRjtBQUFBLGNBQ0YsRUFBRSxRQUFRLFVBQVUsS0FBSztBQUFBLFlBQzNCO0FBRUosdUJBQVcsV0FBVyxLQUFLLGtCQUFrQjtBQUMzQyxzQkFBUSxhQUFhO0FBQUEsWUFDdkI7QUFBQSxVQUNGO0FBRUE7QUFBQSxNQUNKO0FBQUEsSUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQU1VLGNBQWMsT0FBb0I7QUFDMUMsV0FBSyxpQkFBaUI7QUFBQSxJQUN4QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBT08sY0FBYyxPQUFvQjtBQUV2QyxVQUFJLEtBQUssZ0JBQWdCO0FBQ3ZCLGFBQUssaUJBQWlCO0FBRXRCLG1CQUFXLFdBQVcsS0FBSyxpQkFBaUI7QUFDMUMsa0JBQVEsS0FBSyxRQUFRLENBQUMsS0FBSyxFQUFFO0FBQUEsUUFDL0I7QUFFQTtBQUFBLE1BQ0Y7QUFFQSxVQUFJLEVBQUUsTUFBTSxrQkFBa0IscUJBQXFCLEVBQUUsTUFBTSxrQkFBa0Isc0JBQXNCO0FBQ2pHLGNBQU0sSUFBSSxTQUFTO0FBQUEsVUFDakIsOEdBQThHLE9BQU8sTUFBTSxNQUFNO0FBQUEsUUFDbkk7QUFBQSxNQUNGO0FBRUEsWUFBTSxjQUFjLE1BQU07QUFDMUIsWUFBTSxtQkFBbUIsS0FBSyxPQUFPLFlBQVksTUFBTSxVQUFVLENBQUMsQ0FBQztBQUVuRSxVQUFJLGlCQUFpQixXQUFXLEdBQUc7QUFDakMsYUFBSyxVQUFVO0FBRWY7QUFBQSxNQUNGO0FBRUEsVUFDRSxNQUFNLFNBQVMscUJBQ2YsS0FBSyxZQUFZLGVBQ2pCLEtBQUssWUFBWSxZQUNqQixpQkFBaUIsV0FBVyxHQUM1QjtBQUNBLG9CQUFZLFFBQVEsaUJBQWlCLENBQUMsRUFBRSxLQUFLLEtBQUs7QUFFbEQsbUJBQVcsV0FBVyxLQUFLLGlCQUFpQjtBQUMxQyxrQkFBUSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUU7QUFBQSxRQUNuQztBQUVBLG1CQUFXLFdBQVcsS0FBSyxnQkFBZ0I7QUFDekMsa0JBQVEsaUJBQWlCLENBQUMsS0FBSyxFQUFFO0FBQUEsUUFDbkM7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVNPLE9BQU9DLFNBQStCO0FBQzNDLFlBQU0sY0FBY0EsUUFBTyxRQUFRLFFBQVEsRUFBRTtBQUM3QyxZQUFNLE9BQU8sSUFBSSxNQUFjO0FBQy9CLFlBQU0sVUFBVSxXQUFXLHNDQUFzQyxnQkFBZ0IsS0FBSyxjQUFjLE1BQVM7QUFFN0csVUFBSTtBQUVKLGlCQUFXLFVBQVUsU0FBUztBQUM1QixjQUFNLFdBQVcsT0FBTyxRQUFRLFlBQVk7QUFDNUMsWUFBSSxTQUFTLFlBQVksRUFBRSxRQUFRLFlBQVksWUFBWSxDQUFDLE1BQU0sSUFBSTtBQUNwRSxpQkFBTyxNQUFNLFVBQVU7QUFBQSxRQUN6QixPQUFPO0FBQ0wsY0FBSSxpQkFBaUIsUUFBVztBQUM5QiwyQkFBZTtBQUFBLFVBQ2pCO0FBQ0EsZUFBSyxLQUFLLFFBQVE7QUFFbEIsaUJBQU8sTUFBTSxVQUFVO0FBQUEsUUFDekI7QUFFQSxjQUFNLE9BQU8sUUFBUSwyQkFBMkIsa0JBQWtCLE1BQU07QUFFeEUsWUFBSSxTQUFTLFFBQVc7QUFDdEIsZUFBSyxVQUFVLFFBQVEsUUFBMEIsS0FBSyxNQUFNLEVBQUUsTUFBTSxZQUFZLEVBQUUsUUFBUSxRQUFRLE1BQU07QUFBQSxRQUMxRztBQUFBLE1BQ0Y7QUFFQSxVQUFJLEtBQUssV0FBVyxHQUFHO0FBQ3JCLHNCQUFjLE1BQU07QUFFcEIsY0FBTSxTQUFTLFFBQVEsUUFBb0IsS0FBSyxVQUFVO0FBQzFELGVBQU8sY0FBYyw2Q0FBNkMsR0FBRyxVQUFVLE9BQU8sVUFBVTtBQUNoRyxnQkFBUTtBQUFBLFVBQ04sU0FBUztBQUFBLFlBQ1AsT0FBTyxjQUFjLHlEQUF5RCxLQUFLLENBQUMsQ0FBQyxJQUFJO0FBQUEsWUFDekY7QUFBQSxVQUNGO0FBQUEsUUFDRixFQUFFLFVBQVUsSUFBSSxVQUFVO0FBQUEsTUFDNUI7QUFDQSxhQUFPO0FBQUEsSUFDVDtBQUFBO0FBQUEsRUFFRjtBQS9rQmE7QUFBQSxJQURWLGFBQWEsV0FBVyxTQUFTO0FBQUEsS0FwR3ZCLGFBcUdBO0FBb0xYO0FBQUEsSUFEQyxJQUFJO0FBQUEsSUFFRixzQkFBRyxJQUFJLENBQUMsSUFBSSxHQUFHLFNBQVMsR0FBRyxJQUFJLEdBQUcsV0FBVyxHQUFHLElBQUksR0FBRyxTQUFTLEdBQUcsSUFBSSxHQUFHLFlBQVksR0FBRyxJQUFJLEdBQUcsYUFBYSxDQUFDLENBQUM7QUFBQSxJQUcvRyxzQkFBRyxJQUFJLElBQUksR0FBRyxZQUFZLEdBQUcsSUFBSSxNQUFNLG1DQUFtQyxDQUFDO0FBQUEsSUFDM0Usc0JBQUcsSUFBSSxJQUFJLEdBQUcsYUFBYSxHQUFHLElBQUksTUFBTSxtQ0FBbUMsQ0FBQztBQUFBLEtBOVJwRSxhQXlSWDtBQXpSSyxNQUFNLGNBQU47QUE0ckJQLFdBQVMsbUJBQW1CLFNBQXlEO0FBQ25GLFVBQU0sVUFBVSxTQUFTO0FBRXpCLFdBQU8sbUJBQW1CLGNBQWMsVUFBVTtBQUFBLEVBQ3BEO0FBUUEsV0FBUyx1QkFBdUIsU0FBeUQ7QUFDdkYsVUFBTSxVQUFVLFNBQVM7QUFDekIsV0FBTyxtQkFBbUIsY0FBYyxVQUFVO0FBQUEsRUFDcEQ7OztBQ2pzQk8sTUFBTSxhQUFOLE1BQU0sbUJBQWtCLGVBQWU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBMks1QyxjQUFjO0FBQ1osWUFBTTtBQXpLUjtBQUFBO0FBQUEsV0FBZ0Isa0JBQXNELElBQUksTUFBbUM7QUFFN0c7QUFBQSxXQUFnQixpQkFBcUQsSUFBSSxNQUFtQztBQUU1RztBQUFBLFdBQWdCLG1CQUF1RCxJQUFJLE1BQW1DO0FBcUU5RztBQUFBLFdBQU8sWUFBb0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQWlGM0I7QUFBQTtBQUFBO0FBQUEsV0FBVSxZQUFxQjtBQUUvQjtBQUFBLFdBQVUsaUJBQWlCO0FBZXpCLFdBQUssaUJBQWlCLGFBQWEsQ0FBQyxVQUFVO0FBQzVDLGNBQU0sZUFBZTtBQUNyQixjQUFNLHlCQUF5QjtBQUMvQixjQUFNLGdCQUFnQjtBQUFBLE1BQ3hCLENBQUM7QUFHRCxVQUFJLGFBQWEsU0FBUyxFQUFFLE1BQU0sSUFBSTtBQUd0QyxXQUFLLFlBQVksS0FBSyxhQUFhLFdBQVcsS0FBSztBQUNuRCxXQUFLLFVBQVUsS0FBSyxhQUFhLFNBQVMsR0FBRyxNQUFNLEtBQUssU0FBUyxLQUFLLENBQUM7QUFDdkUsV0FBSyxhQUNILEtBQUssYUFBYSxZQUFZLEtBQzlCO0FBQ0YsV0FBSyxjQUFjLEtBQUssYUFBYSxhQUFhLEtBQUs7QUFDdkQsV0FBSyxVQUFVLEtBQUssYUFBYSxTQUFTLEdBQUcsWUFBWSxNQUFNO0FBRy9ELFdBQUssVUFBVSxJQUFJLGNBQWMsYUFBYTtBQUU5QyxXQUFLLGdCQUFnQixTQUFTLGNBQWMsT0FBTztBQUNuRCxXQUFLLGNBQWMsWUFBWSxHQUFHLEtBQUssVUFBVSxLQUFLLGFBQWEsS0FBSyxXQUFXO0FBRW5GLFlBQU0sUUFBUSxTQUFTLGNBQWMsT0FBTztBQUM1QyxZQUFNLFlBQVk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBVWxCLFdBQUssYUFBYSxFQUFFLE1BQU0sT0FBTyxDQUFDO0FBRWxDLFdBQUssZ0JBQWdCLEtBQUssWUFBWSxLQUFLLGFBQWE7QUFFeEQsY0FBUSxRQUFvQixLQUFLLFVBQVUsRUFBRSxZQUFZLEtBQUs7QUFHOUQsYUFBTyxnQkFBZ0Isa0JBQWtCLENBQUMsWUFBb0I7QUFDNUQsYUFBSyxVQUFVLEtBQUssTUFBTSxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQWMsRUFBRSxRQUFRLE9BQU8sRUFBRSxDQUFDO0FBRTFFLGFBQUssT0FBTztBQUFBLE1BQ2Q7QUFFQSxXQUFLLE9BQU87QUFBQSxJQUNkO0FBQUE7QUFBQTtBQUFBLElBck5BLFdBQVcscUJBQW9DO0FBQzdDLGFBQU8sQ0FBQyxXQUFXLGFBQWEsY0FBYyxlQUFlLFNBQVM7QUFBQSxJQUN4RTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFjQSxJQUFXLGtCQUFrQixPQUFzRDtBQUNqRixXQUFLLHFCQUFxQjtBQUUxQixXQUFLLE9BQU87QUFBQSxJQUNkO0FBQUE7QUFBQSxJQUVBLElBQVcsZ0JBQWdCLE9BQWU7QUFDeEMsV0FBSyxhQUFhLHlNQUF5TSxLQUFLO0FBQUEsSUFDbE87QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFNQSxJQUFXLGdCQUF3QjtBQUNqQyxhQUNFLFVBQVUsNkNBQTZDLEtBQUssY0FBYyxNQUFTLEdBQUcsUUFBUSxTQUFTO0FBQUEsUUFDckc7QUFBQSxRQUNBO0FBQUEsTUFDRixLQUFLO0FBQUEsSUFFVDtBQUFBLElBY0EsSUFBVyxVQUFtQjtBQUM1QixhQUFPLEtBQUssYUFBYSxTQUFTLEdBQUcsWUFBWSxNQUFNO0FBQUEsSUFDekQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBS0EsSUFBVyxRQUFRLE9BQWdCO0FBQ2pDLFdBQUssYUFBYSxXQUFXLFFBQVEsU0FBUyxPQUFPO0FBQUEsSUFDdkQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBbUJBLElBQVcsU0FBdUM7QUFDaEQsYUFBTyxLQUFLO0FBQUEsSUFDZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVlBLElBQVcsT0FBTyxPQUF5QjtBQUN6QyxVQUFJLEtBQUssV0FBVyxLQUFLLFlBQVksT0FBTztBQUMxQyxhQUFLLFFBQVEsb0JBQW9CLFNBQVMsS0FBSyxhQUFhO0FBQzVELGFBQUssUUFBUSxvQkFBb0IsU0FBUyxLQUFLLGFBQWE7QUFDNUQsYUFBSyxRQUFRLG9CQUFvQixXQUFXLEtBQUssZUFBZTtBQUNoRSxhQUFLLFFBQVEsb0JBQW9CLFNBQVMsS0FBSyxhQUFhO0FBQzVELGFBQUssUUFBUSxvQkFBb0IsbUJBQW1CLEtBQUssYUFBYTtBQUFBLE1BQ3hFO0FBRUEsV0FBSyxVQUFVO0FBRWYsV0FBSyxRQUFRLGlCQUFpQixTQUFTLEtBQUssY0FBYyxLQUFLLElBQUksQ0FBQztBQUNwRSxXQUFLLFFBQVEsaUJBQWlCLFNBQVMsS0FBSyxjQUFjLEtBQUssSUFBSSxDQUFDO0FBQ3BFLFdBQUssUUFBUSxpQkFBaUIsV0FBVyxLQUFLLGdCQUFnQixLQUFLLElBQUksQ0FBQztBQUN4RSxXQUFLLFFBQVEsaUJBQWlCLFNBQVMsS0FBSyxjQUFjLEtBQUssSUFBSSxDQUFDO0FBQ3BFLFdBQUssUUFBUSxpQkFBaUIsbUJBQW1CLEtBQUssY0FBYyxLQUFLLElBQUksQ0FBQztBQUU5RSxVQUFJLFNBQVMsa0JBQWtCLEtBQUssU0FBUztBQUMzQyxhQUFLLGNBQWMsSUFBSSxNQUFNLE9BQU8sQ0FBQztBQUFBLE1BQ3ZDO0FBRUEsWUFBTSxTQUFTLFFBQVEsUUFBb0IsS0FBSyxVQUFVO0FBRTFELGlCQUFXLFlBQVksT0FBTyxpQkFBaUIsT0FBTyxHQUFHO0FBQ3ZELGlCQUFTLFVBQ1AsS0FBSyxRQUFRLE1BQU0sWUFBWSxFQUFFLFFBQVEsU0FBUyxlQUFlLFFBQVEsVUFBVSxZQUFZLEtBQUssRUFBRSxNQUFNO0FBQUEsTUFDaEg7QUFFQSxpQkFBVyxVQUFVLGFBQWEsb0NBQW9DLE1BQU0sR0FBRztBQUM3RSxlQUFPLE1BQU0sVUFBVTtBQUFBLE1BQ3pCO0FBRUEsWUFBTSxTQUFTLFFBQVE7QUFBQSxRQUNyQixTQUFTO0FBQUEsVUFDUCxPQUFPLGNBQWMsMkNBQTJDO0FBQUEsVUFDaEU7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUVBLFlBQU0saUJBQWlCLE9BQU8saUJBQWlCLGtDQUFrQztBQUVqRixVQUFJLGVBQWUsQ0FBQyxNQUFNLFFBQVE7QUFDaEMsaUJBQVM7QUFBQSxVQUNQLE9BQU8sY0FBYyxrQ0FBa0M7QUFBQSxVQUN2RDtBQUFBLFFBQ0YsRUFBRSxVQUFVLElBQUksVUFBVTtBQUUxQixlQUFPLFVBQVUsT0FBTyxVQUFVO0FBQUEsTUFDcEM7QUFBQSxJQUVGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVdBLElBQVcsV0FBb0I7QUFDN0IsYUFBTyxLQUFLO0FBQUEsSUFDZDtBQUFBO0FBQUEsSUEyRFUsU0FBZTtBQUN2QixZQUFNLFNBQVMsUUFBUSxRQUFvQixLQUFLLFVBQVU7QUFFMUQsaUJBQVcsWUFBWSxPQUFPLGlCQUFpQixxQ0FBcUMsR0FBRztBQUNyRixpQkFBUyxPQUFPO0FBQUEsTUFDbEI7QUFFQSxpQkFBVyxVQUFVLEtBQUssU0FBUztBQUNqQyxlQUFPLGFBQWE7QUFBQSxtRUFDeUMsS0FBSyxRQUFRLENBQUMsTUFBTSxTQUFTLGFBQWEsRUFBRTtBQUFBO0FBQUEsbUNBRTVFLE1BQU07QUFBQTtBQUFBO0FBQUE7QUFBQSxtQ0FJTixLQUFLLHFCQUFxQixLQUFLLG1CQUFtQixPQUFPLFFBQVEsT0FBTyxFQUFFLENBQUMsSUFBSSxPQUFPLFFBQVEsT0FBTyxFQUFFLENBQUM7QUFBQSxNQUN2STtBQUdBLGlCQUFXLFlBQVksT0FBTyxpQkFBaUIsc0JBQXNCLEdBQUc7QUFDdEUsaUJBQVMsaUJBQWlCLFNBQVMsS0FBSyxXQUFXLEtBQUssSUFBSSxDQUFDO0FBQUEsTUFDL0Q7QUFDQSxpQkFBVyxVQUFVLE9BQU8saUJBQWlCLHFCQUFxQixHQUFHO0FBQ25FLGVBQU8saUJBQWlCLFNBQVMsS0FBSyxTQUFTLEtBQUssSUFBSSxDQUFDO0FBQUEsTUFDM0Q7QUFBQSxJQUVGO0FBQUEsSUFRQSx5QkFFRSxNQUNBLFVBR0EsVUFDTTtBQUNOLGNBQVEsTUFBTTtBQUFBLFFBQ1osS0FBSztBQUNILGVBQUssVUFBVSxTQUFTLE1BQU0sS0FBSyxTQUFTO0FBRTVDLGVBQUssT0FBTztBQUVaO0FBQUEsUUFDRixLQUFLO0FBQ0gsZUFBSyxZQUFZO0FBRWpCLGVBQUssT0FBTztBQUVaO0FBQUEsUUFDRixLQUFLO0FBQ0gsZUFBSyxjQUFjLFlBQVksR0FBRyxTQUFTLFlBQVksTUFBTSxTQUFTLEtBQUssWUFBWSxFQUFFLGlDQUN2RixTQUFTLFlBQVksTUFBTSxTQUFTLEtBQUssYUFBYSxLQUFLLFdBQzdEO0FBRUE7QUFBQSxRQUNGLEtBQUs7QUFDSCxlQUFLLGFBQWE7QUFFbEIsY0FBSSxLQUFLLFNBQVM7QUFDaEIsaUJBQUssY0FBYyxZQUFZLEdBQUcsS0FBSyxTQUFTLGlDQUFpQyxLQUFLLFVBQVU7QUFBQSxVQUNsRztBQUVBO0FBQUEsUUFDRixLQUFLO0FBQ0gsZUFBSyxjQUFjO0FBQ25CLGNBQUksQ0FBQyxLQUFLLFNBQVM7QUFDakIsaUJBQUssY0FBYyxZQUFZLEdBQUcsS0FBSyxTQUFTLGlDQUFpQyxLQUFLLFdBQVc7QUFBQSxVQUNuRztBQUVBO0FBQUEsTUFDSjtBQUFBLElBQ0Y7QUFBQSxJQU9BO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsV0FBYyxjQUF1QixNQUFNO0FBQ3pDLHVCQUFlLE9BQU8sZ0JBQWdCLFlBQVcsRUFBRSxTQUFTLE1BQU0sQ0FBQztBQUVuRSxlQUFPO0FBQUEsTUFDVCxHQUFHO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBUU8sV0FBVyxPQUFvQjtBQUN2QyxZQUFNLFNBQVMsU0FBUyxRQUEwQixLQUFLLFFBQVEsZ0JBQWdCO0FBQy9FLFlBQU0sY0FBYyxTQUFTLFFBQTBCLE1BQU0sUUFBUSxnQkFBZ0I7QUFFckYsYUFBTyxNQUFNO0FBRWIsWUFBTSxTQUFTLFlBQVksZUFBZSxhQUFhLGdCQUFnQixHQUFHLFlBQVksS0FBSztBQUUzRixVQUFJLFlBQVksU0FBUztBQUd2QixZQUFJLE9BQU8sbUJBQW1CLEdBQUc7QUFDL0IsaUJBQU8sUUFBUSxHQUFHLE9BQU8sWUFBWSxDQUFDLEdBQUcsT0FBTyxNQUFNLFdBQVcsSUFBSSxLQUFLLEdBQUc7QUFBQSxRQUMvRSxPQUFPO0FBQ0wsY0FBSSxPQUFPLG1CQUFtQixNQUFNO0FBRWxDLGdCQUFJLGVBQWUsT0FBTztBQUUxQixtQkFBTyxPQUFPLE1BQU0sRUFBRSxZQUFZLE1BQU0sS0FBSyxhQUFhLGlCQUFpQixHQUFHO0FBQUEsWUFBQztBQUMvRSxnQkFBSSxhQUFhLE9BQU8saUJBQWlCO0FBRXpDLG1CQUFPLE9BQU8sTUFBTSxFQUFFLFVBQVUsTUFBTSxLQUFLLGFBQWEsZUFBZSxPQUFPLE1BQU0sUUFBUTtBQUFBLFlBQUM7QUFHN0YsbUJBQU8sUUFBUSxPQUFPLE1BQU07QUFBQSxjQUMxQixPQUFPLE1BQU0sVUFBVSxnQkFBZ0IsT0FBTyxNQUFNLFlBQVksTUFBTSxLQUFLLFlBQVksSUFBSyxJQUFJLFVBQVU7QUFBQSxjQUMxRyxHQUFHLE9BQU8sWUFBWSxDQUFDO0FBQUEsWUFDekI7QUFFQSxrQkFBTSxjQUFjLGVBQWUsT0FBTyxTQUFTO0FBRW5ELG1CQUFPLGtCQUFrQixhQUFhLFdBQVc7QUFBQSxVQUNuRDtBQUFBLFFBQ0Y7QUFBQSxNQUVGLE9BQU87QUFFTCxjQUFNLGNBQWMsT0FBTztBQUUzQixlQUFPLFFBQVEsWUFDWixZQUFZLEVBQ1o7QUFBQSxXQUNFLFlBQVksUUFBUSxJQUFJLE9BQU8sWUFBWSxDQUFDLEVBQUUsTUFBTSxLQUFLLEtBQUssT0FDN0QsT0FBTyxZQUFZLEtBQ2xCLFlBQVksUUFBUSxJQUFJLE9BQU8sWUFBWSxDQUFDLEVBQUUsTUFBTSxLQUFLLE1BQU07QUFBQSxVQUNsRTtBQUFBLFFBQ0Y7QUFBQSxNQUVKO0FBQUEsSUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBT1UsU0FBUyxPQUFvQjtBQUNyQyxZQUFNLGNBQWMsU0FBUyxRQUFxQixNQUFNLFFBQVEsV0FBVztBQUMzRSxZQUFNLGdCQUFnQixTQUFTO0FBQUEsUUFDN0IsUUFBUTtBQUFBLFVBQ04sUUFBUSxRQUFvQixLQUFLLFVBQVUsRUFBRSxjQUFjLDJDQUEyQztBQUFBLFFBQ3hHO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFFQSxvQkFBYyxVQUFVLE9BQU8sVUFBVTtBQUV6QyxZQUFNLHNCQUFzQixZQUFZO0FBRXhDLFVBQUkscUJBQXFCO0FBQ3ZCLDRCQUFvQixVQUFVLElBQUksVUFBVTtBQUM1Qyw0QkFBb0IsZUFBZSxFQUFFLFVBQVUsVUFBVSxRQUFRLFVBQVUsT0FBTyxTQUFTLENBQUM7QUFBQSxNQUM5RjtBQUVBLGlCQUFXLFdBQVcsS0FBSyxpQkFBaUI7QUFDMUMsY0FBTSxZQUFZLFlBQVksZUFBZSxRQUFRO0FBRXJELFlBQUksV0FBVztBQUNiLGtCQUFRLFNBQVM7QUFBQSxRQUNuQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVFVLGNBQWMsT0FBNEI7QUFDbEQsVUFBSSxNQUFNLFFBQVEsZUFBZSxNQUFNLFFBQVEsYUFBYSxNQUFNLFFBQVEsV0FBVyxNQUFNLFFBQVEsS0FBSztBQUN0RyxjQUFNLGVBQWU7QUFDckIsY0FBTSxnQkFBZ0I7QUFDdEIsY0FBTSx5QkFBeUI7QUFBQSxNQUNqQztBQUFBLElBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBS0EsSUFBYyx3QkFBd0Q7QUFDcEUsWUFBTSxTQUFTLFFBQVEsUUFBb0IsS0FBSyxVQUFVO0FBQzFELFVBQUksVUFBVUMsd0JBQXVCLE9BQU8sY0FBYywyQ0FBMkMsQ0FBQztBQUV0RyxhQUFPLFdBQVcsUUFBUSxRQUFRLE1BQU0sWUFBWSxRQUFRO0FBQzFELGtCQUFVQSx3QkFBdUIsUUFBUSxzQkFBc0I7QUFBQSxNQUNqRTtBQUVBLFVBQUksWUFBWSxRQUFRLENBQUMsUUFBUSxhQUFhLE1BQU0sR0FBRztBQUNyRCxjQUFNLFVBQVUsYUFBYSxvQ0FBb0MsTUFBTTtBQUV2RSxrQkFBVSxRQUFRLFFBQVEsU0FBUyxDQUFDLEtBQUs7QUFFekMsZUFBTyxZQUFZLFFBQVEsUUFBUSxNQUFNLFlBQVksUUFBUTtBQUMzRCxvQkFBVUEsd0JBQXVCLE9BQU87QUFBQSxRQUMxQztBQUFBLE1BQ0Y7QUFFQSxhQUFPO0FBQUEsSUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFLQSxJQUFjLG9CQUFvRDtBQUNoRSxZQUFNLFNBQVMsUUFBUSxRQUFvQixLQUFLLFVBQVU7QUFFMUQsVUFBSSxVQUFVQyxvQkFBbUIsT0FBTyxjQUFjLDJDQUEyQyxDQUFDO0FBRWxHLGFBQU8sV0FBVyxRQUFRLFFBQVEsTUFBTSxZQUFZLFFBQVE7QUFDMUQsa0JBQVVBLG9CQUFtQixRQUFRLGtCQUFrQjtBQUFBLE1BQ3pEO0FBRUEsVUFBSSxZQUFZLE1BQU07QUFDcEIsa0JBQVUsT0FBTyxjQUFjLGtDQUFrQztBQUVqRSxlQUFPLFdBQVcsUUFBUSxRQUFRLE1BQU0sWUFBWSxRQUFRO0FBQzFELG9CQUFVQSxvQkFBbUIsUUFBUSxrQkFBa0I7QUFBQSxRQUN6RDtBQUFBLE1BQ0Y7QUFFQSxhQUFPO0FBQUEsSUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFLVSxnQkFBZ0IsT0FBNEI7QUFDcEQsV0FBSyxVQUFVLE1BQU07QUFFckIsVUFBSSxNQUFNLFFBQVEsVUFBVTtBQUMxQixhQUFLLGNBQWMsS0FBSztBQUV4QjtBQUFBLE1BQ0Y7QUFFQSxVQUFJLE1BQU0sUUFBUSxlQUFlLE1BQU0sUUFBUSxhQUFhLE1BQU0sUUFBUSxXQUFXLE1BQU0sUUFBUSxLQUFLO0FBQ3RHLGNBQU0sZUFBZTtBQUNyQixjQUFNLGdCQUFnQjtBQUN0QixjQUFNLHlCQUF5QjtBQUFBLE1BQ2pDO0FBRUEsY0FBUSxNQUFNLEtBQUs7QUFBQSxRQUNqQixLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQ0g7QUFDRSxrQkFBTSxTQUFTLFFBQVEsUUFBb0IsS0FBSyxVQUFVO0FBQzFELGtCQUFNLFNBQVMsUUFBUTtBQUFBLGNBQ3JCLFNBQVM7QUFBQSxnQkFDUCxPQUFPLGNBQWMsMkNBQTJDO0FBQUEsZ0JBQ2hFO0FBQUEsY0FDRjtBQUFBLFlBQ0Y7QUFDQSxrQkFBTSxlQUFlLFFBQVE7QUFBQSxjQUMzQixNQUFNLFFBQVEsY0FBYyxLQUFLLG9CQUFvQixLQUFLO0FBQUEsWUFDNUQ7QUFFQSx5QkFBYSxlQUFlLEVBQUUsVUFBVSxVQUFVLFFBQVEsVUFBVSxPQUFPLFNBQVMsQ0FBQztBQUNyRix5QkFBYSxVQUFVLElBQUksVUFBVTtBQUNyQyxtQkFBTyxVQUFVLE9BQU8sVUFBVTtBQUVsQyx1QkFBVyxXQUFXLEtBQUssaUJBQWlCO0FBQzFDLG9CQUFNLFdBQVcsVUFBVSw2Q0FBNkMsTUFBTSxHQUFHLFFBQVE7QUFFekYsc0JBQVEsWUFBWSxFQUFFO0FBQUEsWUFDeEI7QUFBQSxVQUNGO0FBRUE7QUFBQTtBQUFBLFFBRUYsS0FBSztBQUNIO0FBQ0Usa0JBQU0sU0FBUyxRQUFRLFFBQW9CLEtBQUssVUFBVTtBQUUxRCxzQkFBVSxxRUFBcUUsTUFBTSxHQUFHLE1BQU07QUFBQSxVQUNoRztBQUVBLHFCQUFXLFdBQVcsS0FBSyxrQkFBa0I7QUFDM0Msa0JBQU0sV0FBVztBQUFBLGNBQ2Y7QUFBQSxjQUNBLFFBQVEsUUFBb0IsS0FBSyxVQUFVO0FBQUEsWUFDN0MsR0FBRyxRQUFRO0FBRVgsb0JBQVEsWUFBWSxFQUFFO0FBQUEsVUFDeEI7QUFFQTtBQUFBLE1BQ0o7QUFBQSxJQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBTVUsY0FBYyxPQUFvQjtBQUMxQyxXQUFLLGlCQUFpQjtBQUFBLElBQ3hCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFPVSxjQUFjLE9BQW9CO0FBQzFDLFlBQU0sY0FBYyxTQUFTLFFBQTBCLE1BQU0sUUFBUSxnQkFBZ0I7QUFFckYsVUFBSSxLQUFLLGdCQUFnQjtBQUN2QixhQUFLLGlCQUFpQjtBQUV0QixtQkFBVyxXQUFXLEtBQUssaUJBQWlCO0FBQzFDLGtCQUFRLEtBQUssUUFBUSxDQUFDLEtBQUssRUFBRTtBQUFBLFFBQy9CO0FBRUE7QUFBQSxNQUNGO0FBRUEsVUFBSTtBQUVKLFVBQUksWUFBWSxNQUFNLFlBQVksRUFBRSxLQUFLLE1BQU0sZ0JBQWdCO0FBQzdELG9CQUFZLFFBQVE7QUFBQSxNQUN0QjtBQUVBLHVCQUFpQixLQUFLLHdCQUF3QixZQUFZLE9BQU8sS0FBSyxXQUFXLFlBQVksa0JBQWtCLENBQUM7QUFFaEgsWUFBTSxtQkFBbUIsS0FBSyxPQUFPLGNBQWM7QUFFbkQsVUFBSSxpQkFBaUIsV0FBVyxHQUFHO0FBQ2pDLGFBQUssVUFBVTtBQUVmO0FBQUEsTUFDRjtBQUVBLFVBQ0UsTUFBTSxTQUFTLHFCQUNmLEtBQUssWUFBWSxlQUNqQixLQUFLLFlBQVksWUFDakIsaUJBQWlCLFdBQVcsR0FDNUI7QUFDQSxvQkFBWSxRQUFRLFlBQVksTUFBTSxRQUFRLGdCQUFnQixpQkFBaUIsQ0FBQyxLQUFLLEVBQUU7QUFFdkYsbUJBQVcsV0FBVyxLQUFLLGdCQUFnQjtBQUN6QyxrQkFBUSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUU7QUFBQSxRQUNuQztBQUVBLG1CQUFXLFdBQVcsS0FBSyxpQkFBaUI7QUFDMUMsa0JBQVEsaUJBQWlCLENBQUMsS0FBSyxFQUFFO0FBQUEsUUFDbkM7QUFBQSxNQUNGO0FBRUEsWUFBTSxTQUFTLFFBQVEsUUFBb0IsS0FBSyxVQUFVO0FBRTFELGFBQU8sY0FBYywyQ0FBMkMsR0FBRyxVQUFVLE9BQU8sVUFBVTtBQUM5RixjQUFRO0FBQUEsUUFDTixTQUFTO0FBQUEsVUFDUCxPQUFPLGNBQWMsdURBQXVELGlCQUFpQixDQUFDLENBQUMsSUFBSTtBQUFBLFVBQ25HO0FBQUEsUUFDRjtBQUFBLE1BQ0YsRUFBRSxVQUFVLElBQUksVUFBVTtBQUFBLElBQzVCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVdPLE9BQ0xDLFNBQ0EsVUFBNEI7QUFBQSxNQUMxQjtBQUFBLE1BQ0E7QUFBQSxNQUNBLEtBQUssY0FBYztBQUFBLElBQ3JCLEdBQ2U7QUFDZixZQUFNLE9BQU8sSUFBSSxNQUFjO0FBRS9CLFVBQUk7QUFFSixpQkFBVyxVQUFVLFNBQVM7QUFDNUIsY0FBTSxXQUFXLE9BQU8sUUFBUSxZQUFZO0FBQzVDLFlBQUksU0FBUyxZQUFZLEVBQUUsUUFBUUEsUUFBTyxZQUFZLENBQUMsTUFBTSxJQUFJO0FBQy9ELGlCQUFPLE1BQU0sVUFBVTtBQUFBLFFBQ3pCLE9BQU87QUFDTCxjQUFJLGlCQUFpQixRQUFXO0FBQzlCLDJCQUFlO0FBQUEsVUFDakI7QUFDQSxlQUFLLEtBQUssUUFBUTtBQUVsQixpQkFBTyxNQUFNLFVBQVU7QUFBQSxRQUN6QjtBQUVBLGNBQU0sT0FBTyxRQUFRLDJCQUEyQixrQkFBa0IsTUFBTTtBQUV4RSxZQUFJLFNBQVMsUUFBVztBQUN0QixlQUFLLFVBQVU7QUFFZixxQkFBVyxhQUFhLEtBQUssT0FBTyxNQUFNLE1BQU0sR0FBRyxHQUFHO0FBQ3BELGdCQUFJLGNBQWMsVUFBVTtBQUMxQixtQkFBSyxVQUFVO0FBQUEsWUFDakI7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFFQSxvQkFBYyxNQUFNO0FBRXBCLGFBQU87QUFBQSxJQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFVVSx3QkFBd0IsaUJBQXlCLFdBQW1CLFdBQW1CLEdBQVc7QUFDMUcsWUFBTSxXQUFtQjtBQUV6QixVQUFJLGdCQUFnQixXQUFXLEtBQUssV0FBVyxLQUFLLFdBQVcsZ0JBQWdCLFFBQVE7QUFDckYsZUFBTztBQUFBLE1BQ1Q7QUFFQSxZQUFNLHVCQUErQixnQkFBZ0IsWUFBWSxXQUFXLFdBQVcsQ0FBQztBQUN4RixZQUFNLHVCQUErQixnQkFBZ0IsUUFBUSxXQUFXLFFBQVE7QUFFaEYsVUFBSSx5QkFBeUIsTUFBTSx5QkFBeUIsSUFBSTtBQUM5RCxlQUFPLGdCQUFnQixNQUFNLFNBQVMsRUFBRSxDQUFDLEdBQUcsS0FBSyxLQUFLO0FBQUEsTUFDeEQ7QUFFQSxVQUFJLHlCQUF5QixNQUFNLHlCQUF5QixJQUFJO0FBQzlELGVBQU8sZ0JBQWdCLFVBQVUsdUJBQXVCLENBQUMsRUFBRSxLQUFLO0FBQUEsTUFDbEU7QUFFQSxVQUFJLHlCQUF5QixNQUFNLHlCQUF5QixNQUFNLHdCQUF3QixzQkFBc0I7QUFDOUcsZUFBTyxnQkFBZ0IsS0FBSztBQUFBLE1BQzlCO0FBRUEsYUFBTyxnQkFBZ0IsVUFBVSx1QkFBdUIsR0FBRyxvQkFBb0IsRUFBRSxLQUFLO0FBQUEsSUFDeEY7QUFBQSxFQUNGO0FBaG5CYTtBQUFBLElBRFYsYUFBYSxXQUFXLFNBQVM7QUFBQSxLQTVEdkIsV0E2REE7QUFzTVg7QUFBQSxJQURDLElBQUk7QUFBQSxJQUVGLHNCQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsU0FBUyxHQUFHLElBQUksR0FBRyxXQUFXLEdBQUcsSUFBSSxHQUFHLFNBQVMsR0FBRyxJQUFJLEdBQUcsWUFBWSxHQUFHLElBQUksR0FBRyxhQUFhLENBQUMsQ0FBQztBQUFBLElBRy9HLHNCQUFHLElBQUksSUFBSSxHQUFHLFlBQVksR0FBRyxJQUFJLE1BQU0sbUNBQW1DLENBQUM7QUFBQSxJQUMzRSxzQkFBRyxJQUFJLElBQUksR0FBRyxhQUFhLEdBQUcsSUFBSSxNQUFNLG1DQUFtQyxDQUFDO0FBQUEsS0F4UXBFLFdBbVFYO0FBblFLLE1BQU0sWUFBTjtBQXFyQlAsV0FBU0Qsb0JBQW1CLFNBQXlEO0FBQ25GLFVBQU0sVUFBVSxTQUFTO0FBQ3pCLFdBQU8sbUJBQW1CLGNBQWMsVUFBVTtBQUFBLEVBQ3BEO0FBT0EsV0FBU0Qsd0JBQXVCLFNBQXlEO0FBQ3ZGLFVBQU0sVUFBVSxTQUFTO0FBQ3pCLFdBQU8sbUJBQW1CLGNBQWMsVUFBVTtBQUFBLEVBQ3BEOzs7QUM1c0JPLE1BQU0sYUFBTixNQUFNLG1CQUFrQixVQUFVO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUF1R3ZDLGNBQWM7QUFDWixZQUFNO0FBL0VSO0FBQUE7QUFBQSxXQUFVLFFBQXFCO0FBOEkvQjtBQUFBO0FBQUE7QUFBQSxXQUFVLGdCQUFnQjtBQUcxQjtBQUFBO0FBQUEsV0FBVSxlQUFlO0FBRXpCO0FBQUEsV0FBTyxhQUFhO0FBbEVsQixXQUFLLGlCQUFpQixLQUFLO0FBRTNCLGFBQU8sZ0JBQWdCLGtCQUFrQixDQUFDLFlBQW9CO0FBQzVELGFBQUssWUFBWSxLQUFLLE1BQU0sT0FBTyxFQUFFLElBQUksQ0FBQyxNQUFjLEVBQUUsUUFBUSxPQUFPLEVBQUUsQ0FBQztBQUU1RSxhQUFLLE9BQU87QUFDWixhQUFLLE9BQU87QUFFWixhQUFLLE9BQU87QUFBQSxNQUNkO0FBQUEsSUFFRjtBQUFBO0FBQUEsSUFuSEEsV0FBb0IscUJBQW9DO0FBQ3RELGFBQU8sQ0FBQyxHQUFHLFVBQVUsb0JBQW9CLFFBQVEsV0FBVztBQUFBLElBQzlEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVNBLElBQVcsWUFBdUM7QUFDaEQsYUFBTyxLQUFLO0FBQUEsSUFDZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFLQSxJQUFXLFVBQVUsT0FBc0I7QUFDekMsV0FBSyxhQUFhO0FBQUEsSUFDcEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBV0EsSUFBVyxPQUFvQjtBQUM3QixhQUFPLEtBQUs7QUFBQSxJQUNkO0FBQUE7QUFBQSxJQUVtQixTQUFlO0FBQ2hDLFlBQU0sT0FBTztBQUViLFVBQUksS0FBSyxTQUFTLE1BQU07QUFDdEIsbUJBQVcsWUFBWSxRQUFRLFFBQW9CLEtBQUssVUFBVSxFQUFFLGlCQUFpQix5QkFBeUIsR0FBRztBQUMvRyxnQkFBTSxLQUFLLFNBQVMsUUFBcUIsVUFBVSxXQUFXO0FBRTlELGFBQUcsTUFBTSxVQUFVO0FBRW5CLGdCQUFNLE9BQU8sU0FBUztBQUFBLFlBQ3BCLFFBQVEsUUFBcUIsR0FBRyxhQUFhLEVBQUUsY0FBYyx3QkFBd0I7QUFBQSxZQUNyRjtBQUFBLFVBQ0Y7QUFFQSxlQUFLLE1BQU0sYUFBYTtBQUN4QixlQUFLLE1BQU0sY0FBYztBQUFBLFFBQzNCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUlBLElBQVcsS0FBSyxPQUFvQjtBQUNsQyxVQUFJLEtBQUssVUFBVSxPQUFPO0FBQ3hCO0FBQUEsTUFDRjtBQUVBLFdBQUssUUFBUTtBQUViLFVBQUksS0FBSyxVQUFVLFFBQVEsS0FBSyxtQkFBbUIsUUFBVztBQUM1RCxhQUFLLFVBQVUsS0FBSztBQUVwQixhQUFLLE9BQU87QUFFWixtQkFBVyxZQUFZLFFBQVEsUUFBb0IsS0FBSyxVQUFVLEVBQUUsaUJBQWlCLHlCQUF5QixHQUFHO0FBQy9HLG1CQUFTLFFBQXFCLFVBQVUsV0FBVyxFQUFFLE1BQU0sVUFBVTtBQUFBLFFBQ3ZFO0FBQUEsTUFDRixPQUFPO0FBQ0wsWUFBSSxLQUFLLGVBQWUsUUFBVztBQUNqQyxlQUFLLG9CQUFvQixLQUFLLFFBQVE7QUFFdEMsZUFBSyxVQUFVLEtBQUs7QUFFcEIsZUFBSyxPQUFPO0FBRVoscUJBQVcsWUFBWSxRQUFRLFFBQW9CLEtBQUssVUFBVSxFQUFFO0FBQUEsWUFDbEU7QUFBQSxVQUNGLEdBQUc7QUFDRCxrQkFBTSxLQUFLLFNBQVMsUUFBcUIsVUFBVSxXQUFXO0FBRTlELGVBQUcsTUFBTSxVQUFVO0FBRW5CLGtCQUFNLE9BQU8sU0FBUztBQUFBLGNBQ3BCLFFBQVEsUUFBcUIsR0FBRyxhQUFhLEVBQUUsY0FBYyx3QkFBd0I7QUFBQSxjQUNyRjtBQUFBLFlBQ0Y7QUFFQSxpQkFBSyxNQUFNLGFBQWE7QUFDeEIsaUJBQUssTUFBTSxjQUFjO0FBQUEsVUFDM0I7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQXdCQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxXQUF1QixjQUF1QixNQUFNO0FBQ2xELHVCQUFlLE9BQU8sZ0JBQWdCLFlBQVcsRUFBRSxTQUFTLE1BQU0sQ0FBQztBQUVuRSxlQUFPO0FBQUEsTUFDVCxHQUFHO0FBQUE7QUFBQSxJQVFNLHlCQVVQLE1BQ0EsVUFDQSxVQUNNO0FBQ04sVUFBSSxTQUFTLGVBQWUsU0FBUyxRQUFRO0FBQzNDLGNBQU0seUJBQXlCLE1BQU0sVUFBVSxRQUFRO0FBQUEsTUFDekQ7QUFFQSxjQUFRLE1BQU07QUFBQSxRQUNaLEtBQUs7QUFDSCxlQUFLLFlBQVksU0FBUyxNQUFNLEtBQUssU0FBUztBQUU5QztBQUFBLFFBQ0YsS0FBSztBQUNILGVBQUssT0FBTyxHQUFHLFFBQXFCLFVBQVUsQ0FBQyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQztBQUUxRTtBQUFBLE1BQ0o7QUFBQSxJQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBZW1CLGNBQWMsT0FBb0I7QUFDbkQsVUFBSSxLQUFLLFNBQVMsTUFBTTtBQUN0QixjQUFNLG1CQUFtQixLQUFLLE9BQU8sS0FBSyxhQUFhO0FBRXZELGNBQU0sU0FBUyxRQUFRLFFBQW9CLEtBQUssVUFBVTtBQUUxRCxlQUFPLGNBQWMsMkNBQTJDLEdBQUcsVUFBVSxPQUFPLFVBQVU7QUFDOUYsZ0JBQVE7QUFBQSxVQUNOLFNBQVM7QUFBQSxZQUNQLE9BQU8sY0FBYyx1REFBdUQsaUJBQWlCLENBQUMsQ0FBQyxJQUFJO0FBQUEsWUFDbkc7QUFBQSxVQUNGO0FBQUEsUUFDRixFQUFFLFVBQVUsSUFBSSxVQUFVO0FBRTFCLFlBQUksS0FBSyxZQUFZLGVBQWUsS0FBSyxZQUFZLFlBQVksaUJBQWlCLFdBQVcsR0FBRztBQUM5RixnQkFBTSxjQUFjLFNBQVMsUUFBMEIsTUFBTSxRQUFRLGdCQUFnQjtBQUNyRixnQkFBTSxlQUFlLFNBQVMsUUFBMEIsS0FBSyxRQUFRLGdCQUFnQjtBQUVyRixjQUFJLGlCQUFpQixRQUFRLFFBQWdCLFlBQVksY0FBYztBQUV2RSxnQkFBTSxlQUFlLGFBQWEsTUFBTSxVQUFVLEdBQUcsaUJBQWlCLEtBQUssY0FBYyxNQUFNO0FBQy9GLGdCQUFNLGVBQWUsYUFBYSxNQUFNLFVBQVUsY0FBYztBQUVoRSx1QkFBYSxRQUFRLGVBQWU7QUFFcEMsMkJBQWlCLGlCQUFpQixLQUFLLGNBQWM7QUFFckQsZ0JBQU0saUJBQWlCLFFBQVE7QUFBQSxZQUM3QixTQUFTO0FBQUEsY0FDUCxRQUFRLFFBQW9CLEtBQUssVUFBVSxFQUFFLGNBQWMsMkNBQTJDO0FBQUEsY0FDdEc7QUFBQSxZQUNGLEVBQUUsUUFBUTtBQUFBLFVBQ1o7QUFFQSxzQkFBWSxRQUFRLEdBQUcsWUFBWSxNQUFNLFVBQVUsR0FBRyxpQkFBaUIsQ0FBQyxDQUFDLEtBQUssY0FBYyxTQUFTLFlBQVksTUFBTSxVQUFVLGNBQWMsQ0FBQztBQUVoSixzQkFBWTtBQUFBLFlBQ1YsaUJBQWlCLGVBQWUsU0FBUztBQUFBLFlBQ3pDLGlCQUFpQixlQUFlLFNBQVM7QUFBQSxVQUMzQztBQUVBLGVBQUssb0JBQW9CO0FBQ3pCLGVBQUssZ0JBQWdCO0FBQ3JCLGVBQUssZUFBZTtBQUNwQixlQUFLLGFBQWE7QUFDbEIsZUFBSyxVQUFVO0FBRWYscUJBQVcsV0FBVyxLQUFLLGdCQUFnQjtBQUN6QyxvQkFBUSxpQkFBaUIsQ0FBQyxDQUFDO0FBQUEsVUFDN0I7QUFBQSxRQUNGO0FBQUEsTUFDRixPQUFPO0FBQ0wsY0FBTSxjQUFjLEtBQUs7QUFBQSxNQUMzQjtBQUFBLElBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQU9tQixnQkFBZ0IsT0FBNEI7QUFDN0QsVUFBSSxLQUFLLFNBQVMsTUFBTTtBQUN0QixjQUFNLGNBQWMsU0FBUyxRQUEwQixNQUFNLFFBQVEsZ0JBQWdCO0FBRXJGLFlBQUksaUJBQWlCLFFBQVEsUUFBZ0IsWUFBWSxjQUFjO0FBRXZFLFlBQUksTUFBTSxRQUFRLE9BQU8sTUFBTSxRQUFRLFNBQVM7QUFDOUMsZ0JBQU0sZ0JBQWdCLEtBQUs7QUFFM0IsY0FBSSxLQUFLLGNBQWMsZ0JBQWdCLEtBQUssTUFBTSxHQUFHLEdBQUc7QUFDdEQsZ0JBQUksS0FBSyxzQkFBc0IsUUFBVztBQUN4QyxtQkFBSyxvQkFBb0IsWUFBWTtBQUFBLFlBQ3ZDO0FBRUEsaUJBQUs7QUFDTCxpQkFBSyxpQkFBaUIsTUFBTTtBQUM1QixpQkFBSyxVQUFVO0FBQUEsVUFDakI7QUFBQSxRQUVGLE9BQU87QUFFTCxjQUFJLEtBQUssWUFBWTtBQUVuQixrQkFBTSxlQUFlLFNBQVMsUUFBMEIsS0FBSyxRQUFRLGdCQUFnQjtBQUVyRixrQkFBTSxlQUFlLGFBQWEsTUFBTSxVQUFVLEdBQUcsaUJBQWlCLEtBQUssY0FBYyxNQUFNO0FBQy9GLGtCQUFNLGVBQWUsYUFBYSxNQUFNLFVBQVUsY0FBYztBQUVoRSx5QkFBYSxRQUFRLGVBQWU7QUFFcEMsNkJBQWlCLGlCQUFpQixLQUFLLGNBQWM7QUFFckQsa0JBQU0saUJBQWlCLFFBQVE7QUFBQSxjQUM3QixTQUFTO0FBQUEsZ0JBQ1AsUUFBUSxRQUFvQixLQUFLLFVBQVUsRUFBRSxjQUFjLDJDQUEyQztBQUFBLGdCQUN0RztBQUFBLGNBQ0YsRUFBRSxRQUFRO0FBQUEsWUFDWjtBQUVBLHdCQUFZLFFBQVEsR0FBRyxZQUFZLE1BQU0sVUFBVSxHQUFHLGlCQUFpQixDQUFDLENBQUMsTUFBTSxjQUFjLFFBQVEsWUFBWSxNQUFNLFVBQVUsY0FBYyxDQUFDO0FBRWhKLHdCQUFZO0FBQUEsY0FDVixpQkFBaUIsZUFBZSxTQUFTO0FBQUEsY0FDekMsaUJBQWlCLGVBQWUsU0FBUztBQUFBLFlBQzNDO0FBRUEsaUJBQUssb0JBQW9CO0FBQ3pCLGlCQUFLLGdCQUFnQjtBQUNyQixpQkFBSyxlQUFlO0FBQ3BCLGlCQUFLLGFBQWE7QUFDbEIsaUJBQUssVUFBVTtBQUVmLHVCQUFXLFdBQVcsS0FBSyxrQkFBa0I7QUFDM0Msc0JBQVEsa0JBQWtCLEVBQUU7QUFBQSxZQUM5QjtBQUFBLFVBQ0Y7QUFBQSxRQUVGO0FBRUEsWUFBSSxLQUFLLGNBQWMsTUFBTSxRQUFRLFVBQVU7QUFDN0MsZUFBSztBQUNMLGdCQUFNLGFBQWEsUUFBUSxRQUFnQixLQUFLLGlCQUFpQjtBQUVqRSxlQUFLLGdCQUNILEtBQUssY0FBYyxVQUFVLEdBQUcsaUJBQWlCLFVBQVUsSUFDM0QsS0FBSyxjQUFjLFVBQVUsaUJBQWlCLGFBQWEsQ0FBQztBQUFBLFFBQ2hFO0FBRUEsWUFBSSxLQUFLLGNBQWMsTUFBTSxRQUFRLGFBQWE7QUFDaEQsZUFBSztBQUNMLGVBQUssZ0JBQWdCLEtBQUssY0FBYyxVQUFVLEdBQUcsS0FBSyxjQUFjLFNBQVMsQ0FBQztBQUFBLFFBQ3BGO0FBQUEsTUFFRixPQUFPO0FBQ0wsY0FBTSxnQkFBZ0IsS0FBSztBQUFBLE1BQzdCO0FBQUEsSUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBVW1CLHdCQUF3QixpQkFBeUIsV0FBbUIsV0FBbUIsR0FBVztBQUNuSCxVQUFJLEtBQUssU0FBUyxNQUFNO0FBQ3RCLGNBQU0sY0FBYyxTQUFTLFFBQTBCLEtBQUssUUFBUSxnQkFBZ0I7QUFFcEYsWUFBSSxLQUFLLG1CQUFtQjtBQUMxQixpQkFBTyxZQUFZLE1BQU0sVUFBVSxLQUFLLG1CQUFtQixLQUFLLG9CQUFvQixLQUFLLFlBQVk7QUFBQSxRQUN2RyxPQUFPO0FBQ0wsaUJBQU87QUFBQSxRQUNUO0FBQUEsTUFDRixPQUFPO0FBQ0wsZUFBTyxNQUFNLHdCQUF3QixpQkFBaUIsV0FBVyxRQUFRO0FBQUEsTUFDM0U7QUFBQSxJQUNGO0FBQUE7QUFBQSxFQUVGO0FBNU1XO0FBQUEsSUFEUixJQUFJO0FBQUEsSUFFRixzQkFBRyxJQUFJO0FBQUEsTUFDTixJQUFJLEdBQUcsU0FBUztBQUFBLE1BQ2hCLElBQUksR0FBRyxXQUFXO0FBQUEsTUFDbEIsSUFBSSxHQUFHLFNBQVM7QUFBQSxNQUNoQixJQUFJLEdBQUcsWUFBWTtBQUFBLE1BQ25CLElBQUksR0FBRyxhQUFhO0FBQUEsTUFDcEIsSUFBSSxHQUFHLFdBQVc7QUFBQSxNQUNsQixJQUFJLEdBQUcsTUFBTTtBQUFBLElBQ2YsQ0FBQztBQUFBLEtBaEpRLFdBdUlGO0FBdklKLE1BQU0sWUFBTjs7O0F0Qk1QLFdBQVMsa0JBQWtCLFNBQWtCO0FBQzNDLFVBQU0saUJBQWlCLE9BQU8saUJBQWlCLE9BQU87QUFDdEQsVUFBTSxpQkFBaUIsZUFBZSxpQkFBaUIsV0FBVztBQUNsRSxVQUFNLFNBQVMsT0FBTyxXQUFXLGNBQWM7QUFFL0MsV0FBTztBQUFBLEVBQ1Q7QUFNQSxXQUFTLFdBQVcsTUFBMkIsVUFBa0I7QUFDL0QsVUFBTSxRQUFRLEtBQUs7QUFDbkIsVUFBTSxNQUFNLEtBQUs7QUFDakIsVUFBTSxRQUFRLEtBQUs7QUFFbkIsU0FBSyxRQUFRLE1BQU0sVUFBVSxHQUFHLEtBQUssSUFBSSxXQUFXLE1BQU0sVUFBVSxHQUFHO0FBRXZFLFNBQUssY0FBYyxJQUFJLE1BQU0sU0FBUyxFQUFFLFNBQVMsS0FBSyxDQUFDLENBQUM7QUFBQSxFQUMxRDtBQUVPLFdBQVMsMEJBQWdDO0FBQzlDLFFBQUk7QUFFSixRQUFJLE9BQU8sb0JBQW9CLFFBQVc7QUFDeEM7QUFBQSxJQUNGO0FBRUEsV0FBTyxpQkFBaUIsUUFBUSxNQUFNO0FBQ3BDLFlBQU0sVUFBa0IsR0FBRyxPQUFPLFNBQVMsS0FBSyxNQUFNLEdBQUcsRUFBRSxNQUFNLEdBQUcsQ0FBQyxFQUFFLEtBQUssR0FBRyxDQUFDO0FBQ2hGLFlBQU0sZ0JBQTBCLE9BQU87QUFFdkMsVUFBSSxnQ0FBZ0M7QUFFcEMsVUFBSSxrQkFBMEI7QUFFOUIsVUFBSSxjQUFjLFNBQVMsR0FBRztBQUM1QiwwQkFBa0IsY0FBYyxDQUFDLEdBQUcsYUFBYSxtQkFBbUI7QUFBQSxNQUN0RTtBQUdBLFVBQUksVUFBVSxjQUFjLFVBQVUsWUFBWTtBQUNoRCxjQUFNLGFBQ0osT0FBTyxnQkFBZ0IsUUFBUSxlQUFlLE1BQU0sU0FDaEQsT0FBTyxnQkFBZ0IsUUFBUSxLQUMvQixPQUFPLGdCQUFnQixRQUFRLGVBQWU7QUFFcEQsWUFBSSx5QkFBMkMsb0JBQUksS0FBSztBQUd4RCxpQkFBUyxLQUFLO0FBQUEsVUFDWjtBQUFBLFVBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUNBWXlCLEtBQUssTUFBTSxPQUFPLGdCQUFnQixrQkFBa0IsRUFDbEUsSUFBSSxDQUFDLFNBQWlCO0FBQ3JCLG1CQUFPLEtBQUssWUFBWSxHQUFHLE1BQU0sS0FBSyxLQUFLLFVBQVUsR0FBRyxLQUFLLFlBQVksR0FBRyxDQUFDLElBQUk7QUFBQSxVQUNuRixDQUFDLEVBQ0EsS0FBSyxHQUFHLENBQUM7QUFBQSxnQ0FDSSxLQUFLLE1BQU0sT0FBTyxnQkFBZ0IscUJBQXFCLEVBQ3BFLElBQUksQ0FBQyxTQUFpQjtBQUNyQixtQkFBTyxLQUFLLFlBQVksR0FBRyxNQUFNLEtBQUssS0FBSyxVQUFVLEdBQUcsS0FBSyxZQUFZLEdBQUcsQ0FBQyxJQUFJO0FBQUEsVUFDbkYsQ0FBQyxFQUNBLEtBQUssR0FBRyxDQUFDO0FBQUE7QUFBQSxRQUV0QjtBQUdBLGNBQU0sWUFBWSxTQUFTLFFBQW1CLFNBQVMsY0FBYyx3QkFBd0IsR0FBRyxTQUFTO0FBQ3pHLGNBQU0sY0FBYyxTQUFTO0FBQUEsVUFDM0IsU0FBUyxjQUFjLDBCQUEwQjtBQUFBLFVBQ2pEO0FBQUEsUUFDRjtBQUdBLGtCQUFVLGVBQWUsS0FBSyxDQUFDLG9CQUE0QjtBQUN6RCxtQ0FBeUIsb0JBQUksS0FBSztBQUFBLFFBQ3BDLENBQUM7QUFHRCxvQkFBWSxpQkFBaUIsS0FBSyxDQUFDLG1CQUEyQjtBQUM1RCxjQUFJLFlBQVksU0FBUyxpQkFBaUI7QUFDeEMsb0JBQVEsZ0JBQWdCO0FBQUEsY0FDdEIsS0FBSyxPQUFPLGdCQUFnQixrQ0FBa0MsdUJBQXVCO0FBQ25GO0FBQUEsa0JBQ0UsWUFBWTtBQUFBLGtCQUNaO0FBQUEsZ0JBQ0Y7QUFFQTtBQUFBLGNBRUYsS0FBSyxPQUFPLGdCQUFnQixrQ0FBa0MsNEJBQTRCO0FBQ3hGO0FBQUEsa0JBQ0UsWUFBWTtBQUFBLGtCQUNaLHVDQUF1QyxPQUFPLGdCQUFnQixrQ0FBa0Msd0NBQXdDLENBQUM7QUFBQSxnQkFDM0k7QUFFQTtBQUFBLGNBRUYsS0FBSyxPQUFPLGdCQUFnQixrQ0FBa0MsaUJBQWlCO0FBQzdFO0FBQUEsa0JBQ0UsWUFBWTtBQUFBLGtCQUNaLDRCQUE0QixPQUFPLGdCQUFnQixrQ0FBa0MsNkJBQTZCLENBQUM7QUFBQSxnQkFDckg7QUFFQTtBQUFBLGNBRUYsS0FBSyxPQUFPLGdCQUFnQixrQ0FBa0MsdUJBQXVCO0FBQ25GO0FBQUEsa0JBQ0UsWUFBWTtBQUFBLGtCQUNaLHVDQUF1QyxPQUFPLGdCQUFnQixrQ0FBa0MsMkNBQTJDLENBQUMsYUFBYSxPQUFPLGdCQUFnQixrQ0FBa0Msd0NBQXdDLENBQUM7QUFBQSxnQkFDN1A7QUFFQTtBQUFBLGNBRUYsS0FBSyxPQUFPLGdCQUFnQixrQ0FBa0MsbUNBQW1DO0FBQy9GO0FBQUEsa0JBQ0UsWUFBWTtBQUFBLGtCQUNaLHFDQUFxQyxPQUFPLGdCQUFnQixrQ0FBa0MsK0NBQStDLENBQUM7QUFBQSxnQkFDaEo7QUFFQTtBQUFBLGNBRUYsS0FBSyxPQUFPLGdCQUFnQixrQ0FBa0Msd0JBQXdCO0FBQ3BGLDJCQUFXLFlBQVksUUFBMEMsaUNBQWlDO0FBRWxHO0FBQUEsY0FFRixLQUFLLE9BQU8sZ0JBQWdCLGtDQUFrQyxvQkFBb0I7QUFDaEYsMkJBQVcsWUFBWSxRQUEwQyxpQ0FBaUM7QUFFbEc7QUFBQSxjQUVGO0FBQ0UsMkJBQVcsWUFBWSxRQUEwQyx5QkFBeUI7QUFBQSxZQUM5RjtBQUVBLHdCQUFZLFVBQVU7QUFBQSxVQUN4QjtBQUFBLFFBQ0YsQ0FBQztBQUdELG9CQUFZLGVBQWUsS0FBSyxDQUFDLG9CQUE0QjtBQUMzRCxjQUFJLFlBQVksU0FBUywyQkFBMkI7QUFDbEQsZ0JBQUksZ0JBQWdCLFFBQVEsR0FBRyxNQUFNLElBQUk7QUFDdkMsMEJBQVksT0FBTyxRQUFRLFdBQVcsZ0JBQWdCLFVBQVUsZ0JBQWdCLFFBQVEsR0FBRyxJQUFJLENBQUMsRUFBRSxLQUFLLENBQUM7QUFBQSxZQUMxRyxPQUFPO0FBQ0wsMEJBQVksT0FBTyxRQUFRO0FBQUEsWUFDN0I7QUFFQSxxQkFBUyxNQUFNLFVBQVU7QUFDekIsd0JBQVksVUFBVTtBQUV0QixrQkFBTSxjQUFjLFNBQVM7QUFBQSxjQUMzQixZQUFZLE9BQU8sY0FBYyxjQUFjLGNBQWMsS0FBSztBQUFBLGNBQ2xFO0FBQUEsWUFDRjtBQUVBLGtCQUFNLFVBQVUsQ0FBQyxVQUF5QjtBQUN4QyxvQkFBTSxnQkFBZ0IsU0FBUyxRQUF1QixPQUFPLGFBQWE7QUFFMUUsNEJBQWMsZUFBZTtBQUM3Qiw0QkFBYyx5QkFBeUI7QUFDdkMsNEJBQWMsZ0JBQWdCO0FBRTlCLHlCQUFXLE1BQU07QUFDZix5QkFBUyxvQkFBb0IsV0FBVyxPQUFPO0FBQUEsY0FDakQsR0FBRyxHQUFHO0FBQUEsWUFDUjtBQUVBLHFCQUFTLGlCQUFpQixXQUFXLE9BQU87QUFFNUMsd0JBQVksTUFBTTtBQUVsQjtBQUFBLFVBQ0Y7QUFFQSxjQUFJLFlBQVksU0FBUyxtQkFBbUI7QUFDMUMsZ0JBQUksZ0JBQWdCLFFBQVEsR0FBRyxNQUFNLElBQUk7QUFDdkMsMEJBQVksT0FBTyxRQUFRLGdCQUFnQixVQUFVLGdCQUFnQixRQUFRLEdBQUcsSUFBSSxDQUFDLEVBQUUsS0FBSztBQUFBLFlBQzlGLE9BQU87QUFDTCwwQkFBWSxPQUFPLFFBQVE7QUFBQSxZQUM3QjtBQUVBLHFCQUFTLE1BQU0sVUFBVTtBQUN6Qix3QkFBWSxVQUFVO0FBRXRCLGtCQUFNLGNBQWMsU0FBUztBQUFBLGNBQzNCLFlBQVksT0FBTyxjQUFjLGNBQWMsY0FBYyxLQUFLO0FBQUEsY0FDbEU7QUFBQSxZQUNGO0FBRUEsa0JBQU0sVUFBVSxDQUFDLFVBQXlCO0FBQ3hDLG9CQUFNLGdCQUFnQixTQUFTLFFBQXVCLE9BQU8sYUFBYTtBQUUxRSw0QkFBYyxlQUFlO0FBQzdCLDRCQUFjLHlCQUF5QjtBQUN2Qyw0QkFBYyxnQkFBZ0I7QUFFOUIseUJBQVcsTUFBTTtBQUNmLHlCQUFTLG9CQUFvQixXQUFXLE9BQU87QUFBQSxjQUNqRCxHQUFHLEdBQUc7QUFBQSxZQUNSO0FBRUEscUJBQVMsaUJBQWlCLFdBQVcsT0FBTztBQUU1Qyx3QkFBWSxNQUFNO0FBRWxCO0FBQUEsVUFDRjtBQUVBLGdCQUFNLEtBQUssU0FBUztBQUFBLFlBQ2xCLFFBQVE7QUFBQSxjQUNOLFFBQVEsUUFBcUIsUUFBUSxRQUFxQixZQUFZLE1BQU0sRUFBRSxhQUFhLEVBQUU7QUFBQSxZQUMvRixFQUFFLGNBQWMsS0FBSztBQUFBLFlBQ3JCO0FBQUEsVUFDRjtBQUVBLGdCQUFNLGVBQWUsSUFBSSxpQkFBaUIsQ0FBQyxlQUFlLGFBQWE7QUFDckUsdUJBQVcsWUFBWSxlQUFlO0FBQ3BDLGtCQUFJLFNBQVMsU0FBUyxhQUFhO0FBQ2pDLDJCQUFXLFNBQVMsU0FBUyxZQUFZO0FBQ3ZDLHNCQUFJLFFBQVE7QUFFWixzQkFBSSxNQUFNLGFBQWEsU0FBUztBQUM5QiwwQkFBTSxpQkFBaUIsV0FBVyxDQUFDLFVBQVU7QUFDM0MsNEJBQU0sZ0JBQWdCLFNBQVMsUUFBdUIsT0FBTyxhQUFhO0FBRTFFLDBCQUFJLGNBQWMsVUFBVSxjQUFjLElBQUksWUFBWSxNQUFNLEtBQUs7QUFFbkUsc0NBQWMsZUFBZTtBQUM3QixzQ0FBYyx5QkFBeUI7QUFDdkMsc0NBQWMsZ0JBQWdCO0FBRTlCLGtDQUFVLE9BQU87QUFDakIsa0NBQVUsT0FBTztBQUVqQixpQ0FBUztBQUFBLDBCQUNQLFNBQVMsY0FBYywwQkFBMEI7QUFBQSwwQkFDakQ7QUFBQSx3QkFDRixFQUFFO0FBQUEsMEJBQ0E7QUFBQSwwQkFDQSxLQUFLLE1BQU0sT0FBTyxnQkFBZ0IscUJBQXFCLEVBQ3BELElBQUksQ0FBQyxTQUFpQjtBQUNyQixtQ0FBTyxLQUFLLFlBQVksR0FBRyxNQUFNLEtBQUssS0FBSyxVQUFVLEdBQUcsS0FBSyxZQUFZLEdBQUcsQ0FBQyxJQUFJO0FBQUEsMEJBQ25GLENBQUMsRUFDQSxLQUFLLEdBQUc7QUFBQSx3QkFDYjtBQUdBLGdDQUFRLFFBQTJCLFNBQVMsY0FBYyxRQUFRLENBQUMsRUFBRTtBQUFBLDBCQUNuRTtBQUFBLDBCQUNBLEdBQUcsT0FBTyxnQkFBZ0IsUUFBUSxlQUFlLE1BQU0sU0FBWSxPQUFPLGdCQUFnQixRQUFRLEtBQUssT0FBTyxnQkFBZ0IsUUFBUSxlQUFlLENBQUMsR0FBRyxPQUFPLGdCQUFnQixzQkFBc0IsVUFBVSxhQUFhLEdBQUcsV0FBVztBQUFBLHdCQUM3TztBQUVBLGtDQUFVLFVBQVU7QUFDcEIsa0NBQVUsYUFBYTtBQUN2QixpQ0FBUyxNQUFNLFVBQVU7QUFFekIsOENBQXNCLEtBQXlCO0FBQy9DLDZDQUFxQixTQUFTO0FBRzlCLDRCQUFJLENBQUMsT0FBTztBQUNWLGtDQUFRO0FBRVIsb0NBQVUsU0FBUyxTQUFTLFFBQTBCLE1BQU0sUUFBUSxnQkFBZ0I7QUFBQSx3QkFDdEY7QUFBQSxzQkFFRjtBQUFBLG9CQUNGLENBQUM7QUFBQSxrQkFDSDtBQUFBLGdCQUNGO0FBQUEsY0FDRjtBQUFBLFlBQ0Y7QUFBQSxVQUNGLENBQUM7QUFFRCx1QkFBYSxRQUFRLEdBQUcsY0FBYyxlQUFlO0FBQUEsWUFDbkQsV0FBVztBQUFBLFlBQ1gsU0FBUztBQUFBLFVBQ1gsQ0FBQztBQUVELGFBQUcsTUFBTTtBQUFBLFFBQ1gsQ0FBQztBQUVELG9CQUFZLGdCQUFnQixLQUFLLENBQUMsY0FBc0I7QUFFdEQsY0FBSSxPQUFPO0FBQ1Qsa0JBQU1HLGVBQWMsUUFBUTtBQUFBLGNBQzFCLE9BQU8sZ0JBQWdCLGFBQWEsVUFBVSxVQUFVLEdBQUcsVUFBVSxRQUFRLEdBQUcsSUFBSSxDQUFDLEVBQUUsS0FBSyxDQUFDLEdBQUc7QUFBQSxZQUNsRztBQUVBLGdCQUFJQSxhQUFZLENBQUMsTUFBTSxLQUFLO0FBQzFCLHVCQUFTLFlBQVksbUJBQW1CLFVBQVUsR0FBR0EsWUFBVztBQUFBLFlBQ2xFLE9BQU87QUFDTCx1QkFBUyxZQUFZLGlFQUFpRUEsWUFBVztBQUFBLFlBQ25HO0FBRUE7QUFBQSxVQUNGO0FBR0EsZ0JBQU0sY0FBYyxRQUFRO0FBQUEsWUFDMUIsT0FBTyxnQkFBZ0IsbUJBQ3JCLFVBQ0csVUFBVSxHQUFHLFVBQVUsUUFBUSxHQUFHLElBQUksQ0FBQyxFQUN2QyxZQUFZLEVBQ1osS0FBSyxDQUNWLEdBQUcsZ0JBQ0EsVUFBVSxRQUFRLEdBQUcsTUFBTSxLQUN4QixPQUFPLGdCQUFnQixhQUFhLFVBQVUsVUFBVSxHQUFHLFVBQVUsUUFBUSxHQUFHLElBQUksQ0FBQyxFQUFFLEtBQUssQ0FBQyxHQUN6RixjQUNKLE9BQU8sZ0JBQWdCLG1CQUNyQixVQUFVLFVBQVUsR0FBRyxVQUFVLFlBQVksR0FBRyxDQUFDLEVBQUUsUUFBUSxNQUFNLEdBQUcsRUFBRSxLQUFLLENBQzdFLEdBQUc7QUFBQSxVQUNYO0FBRUEsY0FBSSxZQUFZLENBQUMsTUFBTSxLQUFLO0FBQzFCLHFCQUFTLFlBQVksbUJBQW1CLFVBQVUsR0FBRyxXQUFXO0FBQUEsVUFDbEUsT0FBTztBQUNMLHFCQUFTLFlBQVksaUVBQWlFLFdBQVc7QUFBQSxVQUNuRztBQUFBLFFBQ0YsQ0FBQztBQUdELG9CQUFZLGlCQUFpQixLQUFLLENBQUMsbUJBQTJCO0FBQzVELGNBQUksWUFBWSxTQUFTLGlCQUFpQjtBQUN4QztBQUFBLFVBQ0Y7QUFFQSxtQkFBUyxNQUFNLFVBQVU7QUFFekIsbUJBQVM7QUFBQSxZQUNQLFFBQVE7QUFBQSxjQUNOLFFBQVEsUUFBcUIsUUFBUSxRQUFxQixZQUFZLE1BQU0sRUFBRSxhQUFhLEVBQUU7QUFBQSxZQUMvRixFQUFFLGNBQWMsS0FBSztBQUFBLFlBQ3JCO0FBQUEsVUFDRixFQUFFLE1BQU07QUFFUixjQUFJLFlBQVksT0FBTyxrQkFBa0IsTUFBTTtBQUM3QztBQUFBLFVBQ0Y7QUFFQSxnQkFBTSxTQUFTLFNBQVM7QUFBQSxZQUN0QixRQUFRO0FBQUEsY0FDTixRQUFRLFFBQXFCLFFBQVEsUUFBcUIsWUFBWSxNQUFNLEVBQUUsYUFBYSxFQUFFO0FBQUEsWUFDL0YsRUFBRSxjQUFjLEtBQUs7QUFBQSxZQUNyQjtBQUFBLFVBQ0Y7QUFFQSxnQkFBTSxPQUFPLE9BQU8sY0FBYyxPQUFPO0FBRXpDLGNBQUksU0FBUyxNQUFNO0FBQ2pCO0FBQUEsVUFDRjtBQUVBLGNBQUksUUFBUTtBQUVaLGVBQUssaUJBQWlCLFdBQVcsQ0FBQyxrQkFBaUM7QUFFakUsMEJBQWMsZUFBZTtBQUM3QiwwQkFBYyx5QkFBeUI7QUFDdkMsMEJBQWMsZ0JBQWdCO0FBRTlCLHNCQUFVLE9BQU87QUFHakIsc0JBQVU7QUFBQSxjQUNSO0FBQUEsY0FDQSxLQUFLLE1BQU0sT0FBTyxnQkFBZ0IscUJBQXFCLEVBQ3BELElBQUksQ0FBQyxTQUFpQjtBQUNyQix1QkFBTyxLQUFLLFlBQVksR0FBRyxNQUFNLEtBQUssS0FBSyxVQUFVLEdBQUcsS0FBSyxZQUFZLEdBQUcsQ0FBQyxJQUFJO0FBQUEsY0FDbkYsQ0FBQyxFQUNBLEtBQUssR0FBRztBQUFBLFlBQ2I7QUFHQSxvQkFBUSxRQUEyQixTQUFTLGNBQWMsUUFBUSxDQUFDLEVBQUU7QUFBQSxjQUNuRTtBQUFBLGNBQ0EsR0FBRyxPQUFPLGdCQUFnQixRQUFRLGVBQWUsTUFBTSxTQUFZLE9BQU8sZ0JBQWdCLFFBQVEsS0FBSyxPQUFPLGdCQUFnQixRQUFRLGVBQWUsQ0FBQyxHQUFHLE9BQU8sZ0JBQWdCLHNCQUFzQixVQUFVLGFBQWEsR0FBRyxXQUFXO0FBQUEsWUFDN087QUFFQSxzQkFBVSxVQUFVO0FBQ3BCLHNCQUFVLGFBQWE7QUFDdkIscUJBQVMsTUFBTSxVQUFVO0FBRXpCLGtDQUFzQixJQUFJO0FBQzFCLGlDQUFxQixTQUFTO0FBRzlCLGdCQUFJLENBQUMsT0FBTztBQUNWLHNCQUFRO0FBRVIsd0JBQVUsU0FBUyxTQUFTLFFBQTBCLGNBQWMsUUFBUSxnQkFBZ0I7QUFBQSxZQUM5RjtBQUFBLFVBRUYsQ0FBQztBQUFBLFFBQ0gsQ0FBQztBQUdELGtCQUFVLGlCQUFpQixLQUFLLENBQUMsbUJBQTJCO0FBQzFELG1CQUFTLE1BQU0sVUFBVTtBQUFBLFFBQzNCLENBQUM7QUFVRCxvQkFBWSwwQkFBMEIsQ0FBQyxnQkFBd0I7QUFDN0QsaUJBQU8sV0FBVyxZQUFZLFVBQVUsWUFBWSxRQUFRLEdBQUcsSUFBSSxDQUFDLEVBQUUsS0FBSyxDQUFDO0FBQUEsUUFDOUU7QUFPQSxvQkFBWSxvQkFBb0IsVUFBVSxvQkFBb0IsQ0FBQyxnQkFBZ0M7QUFDN0YsaUJBQU8sWUFBWSxZQUFZO0FBQUEsUUFDakM7QUFHQSxvQkFBWSxNQUFNLFdBQVcsVUFBVSxNQUFNLFdBQVc7QUFDeEQsb0JBQVksTUFBTSxTQUFTLFVBQVUsTUFBTSxTQUFTO0FBQ3BELG9CQUFZLE1BQU0sVUFBVSxVQUFVLE1BQU0sVUFBVTtBQUN0RCxvQkFBWSxNQUFNLFNBQVMsVUFBVSxNQUFNLFNBQVM7QUFDcEQsb0JBQVksTUFBTSxlQUFlLFVBQVUsTUFBTSxlQUFlO0FBQ2hFLG9CQUFZLE1BQU0sWUFBWSxVQUFVLE1BQU0sWUFBWTtBQUMxRCxvQkFBWSxNQUFNLFlBQVksVUFBVSxNQUFNLFlBQVk7QUFDMUQsb0JBQVksa0JBQ1YsVUFBVSxrQkFBa0IsR0FBRyxPQUFPO0FBTXhDLGNBQU0sd0JBQXdCLENBQUMsU0FBc0I7QUFDbkQsZ0JBQU0sV0FBVyxLQUFLLHNCQUFzQjtBQUU1QyxvQkFBVSxNQUFNLFlBQVksR0FBRyxPQUFPLGNBQWMsS0FBSyxLQUFLLFNBQVMsTUFBTSxDQUFDO0FBQzlFLG9CQUFVLE1BQU0sTUFBTSxHQUFHLEtBQUssS0FBSyxTQUFTLE1BQU0sQ0FBQztBQUNuRCxvQkFBVSxNQUFNLE9BQU8sR0FBRyxLQUFLLEtBQUssU0FBUyxRQUFRLFVBQVUsc0JBQXNCLEVBQUUsUUFBUyxPQUFPLGFBQWEsTUFBTyxDQUFDLENBQUM7QUFDN0gsb0JBQVUsTUFBTSxZQUFZLEdBQUcsS0FBSyxLQUFLLE9BQU8sY0FBZSxPQUFPLGNBQWMsTUFBTyxJQUFJLFNBQVMsTUFBTSxDQUFDO0FBQUEsUUFDakg7QUFLQSxjQUFNLDBCQUEwQixDQUFDLFNBQXNCO0FBQ3JELGdCQUFNLFdBQVcsS0FBSyxzQkFBc0I7QUFFNUMsc0JBQVksTUFBTSxZQUFZLEdBQUcsT0FBTyxjQUFjLEtBQUssS0FBSyxTQUFTLE1BQU0sQ0FBQztBQUNoRixzQkFBWSxNQUFNLE1BQU0sR0FBRyxLQUFLLEtBQUssU0FBUyxNQUFNLENBQUM7QUFDckQsc0JBQVksTUFBTSxPQUFPLEdBQUcsS0FBSyxLQUFLLFNBQVMsUUFBUSxZQUFZLHNCQUFzQixFQUFFLFFBQVMsT0FBTyxhQUFhLE1BQU8sQ0FBQyxDQUFDO0FBQ2pJLHNCQUFZLE1BQU0sWUFBWSxHQUFHLEtBQUssS0FBSyxPQUFPLGNBQWUsT0FBTyxjQUFjLE1BQU8sSUFBSSxTQUFTLE1BQU0sQ0FBQztBQUFBLFFBQ25IO0FBSUEsY0FBTSxXQUFXLFNBQVMsY0FBYyxLQUFLO0FBRTdDLFlBQUksd0JBQXdCO0FBQzVCLFlBQUk7QUFFSixpQkFBUyxpQkFBaUIsY0FBYyxDQUFDLFVBQVU7QUFDakQsa0NBQXdCO0FBQUEsUUFDMUIsQ0FBQztBQUNELGlCQUFTLGlCQUFpQixjQUFjLENBQUMsVUFBVTtBQUNqRCxrQ0FBd0I7QUFFeEIsY0FBSSwwQkFBMEI7QUFDNUIscUNBQXlCO0FBQUEsVUFDM0I7QUFBQSxRQUNGLENBQUM7QUFHRCxpQkFBUyxNQUFNLFdBQVc7QUFDMUIsaUJBQVMsTUFBTSxVQUFVO0FBQ3pCLGlCQUFTLE1BQU0sU0FBUztBQUN4QixpQkFBUyxNQUFNLFVBQVU7QUFDekIsaUJBQVMsTUFBTSxTQUFTO0FBQ3hCLGlCQUFTLE1BQU0sY0FBYztBQUM3QixpQkFBUyxNQUFNLGtCQUFrQixRQUFRLE9BQU87QUFDaEQsaUJBQVMsTUFBTSxpQkFBaUI7QUFDaEMsaUJBQVMsTUFBTSxxQkFBcUI7QUFDcEMsaUJBQVMsTUFBTSxtQkFBbUI7QUFDbEMsaUJBQVMsTUFBTSxzQkFBc0I7QUFDckMsaUJBQVMsTUFBTSxrQkFBa0I7QUFDakMsaUJBQVMsTUFBTSxlQUFlO0FBQzlCLGlCQUFTLE1BQU0sWUFBWTtBQUMzQixpQkFBUyxNQUFNLFVBQVU7QUFDekIsaUJBQVMsTUFBTSxVQUFVO0FBQ3pCLGlCQUFTLE1BQU0sVUFBVTtBQUV6QixpQkFBUyxVQUFVLElBQUksWUFBWSxXQUFXLFVBQVU7QUFFeEQsaUJBQVMsWUFBWTtBQUFBO0FBQUE7QUFBQTtBQUtyQixjQUFNLGFBQWEsU0FBUyxjQUFjLE9BQU87QUFFakQsbUJBQVcsWUFBWTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQWlCdkIsaUJBQVMsUUFBUSxVQUFVO0FBQzNCLGlCQUFTLE1BQU0sWUFBWSxRQUFRO0FBT25DLGNBQU0saUJBQWlCLENBQUMsVUFBaUI7QUFDdkMsVUFBQyxTQUFTLGNBQWMsZUFBZSxFQUFxQixPQUFPO0FBRW5FLFVBQUMsU0FBUyxjQUFjLFFBQVEsRUFBd0Isb0JBQW9CLFFBQVEsY0FBYztBQUFBLFFBQ3BHO0FBRUEsUUFBQyxTQUFTLGNBQWMsUUFBUSxFQUF3QixpQkFBaUIsUUFBUSxjQUFjO0FBRy9GLGNBQU1DLFNBQUksb0NBQVU7QUFFcEIsUUFBQUEsR0FBRSxLQUFLO0FBQUEsVUFDTCxLQUFLLEdBQUcsT0FBTztBQUFBLFVBQ2YsTUFBTTtBQUFBLFVBQ04sU0FBUztBQUFBLFlBQ1AsWUFBWTtBQUFBLFVBQ2Q7QUFBQSxVQUNBLFNBQVMsQ0FBQyxhQUFhO0FBRXJCLHVCQUFXLGlCQUFpQixTQUFTLG9CQUFvQjtBQUN2RCxxQkFBTyxnQkFBZ0IsbUJBQW1CLGFBQWEsSUFBSSxTQUFTLG1CQUFtQixhQUFhO0FBRXBHLHNEQUFVLEVBQUUsS0FBSztBQUFBLGdCQUNmLEtBQUssR0FBRyxPQUFPO0FBQUEsZ0JBQ2YsTUFBTTtBQUFBLGdCQUNOLFNBQVM7QUFBQSxrQkFDUCxZQUFZO0FBQUEsa0JBQ1osa0JBQWtCO0FBQUEsa0JBQ2xCLGFBQWE7QUFBQSxnQkFDZjtBQUFBLGdCQUNBLFNBQVMsQ0FBQ0MsY0FBYTtBQUNyQixzQkFBSUEsVUFBUyxXQUFXLFFBQVE7QUFDOUIsd0JBQUksU0FBUyxlQUFlLFlBQVk7QUFFdEMsc0JBQUMsT0FBTyxnQkFBZ0IsbUJBQW1CLGFBQWEsRUFBVSxPQUFPQSxVQUFTLE9BQU87QUFBQSx3QkFDdkY7QUFBQSx3QkFDQTtBQUFBLHNCQUNGO0FBQUEsb0JBQ0Y7QUFBQSxrQkFDRjtBQUFBLGdCQUNGO0FBQUEsY0FDRixDQUFDO0FBQUEsWUFDSDtBQUVBLGdCQUFJLFNBQVMsb0JBQW9CO0FBQy9CLHFCQUFPLGdCQUFnQixxQkFBcUIsR0FBRyxPQUFPLGdCQUFnQixtQkFBbUIsVUFBVSxHQUFHLE9BQU8sZ0JBQWdCLG1CQUFtQixTQUFTLENBQUMsQ0FBQyxLQUFNLFNBQVMsbUJBQW1CLE1BQU0sR0FBRyxFQUFFLEtBQUssS0FBSyxDQUFDO0FBQUEsWUFDck47QUFFQSx1QkFBVyxlQUFlLFNBQVMsdUJBQXVCO0FBQ3hELHFCQUFPLGdCQUFnQixzQkFBc0IsV0FBVyxJQUFJLFNBQVMsc0JBQXNCLFdBQVc7QUFFdEcsc0RBQVUsRUFBRSxLQUFLO0FBQUEsZ0JBQ2YsS0FBSyxHQUFHLE9BQU87QUFBQSxnQkFDZixNQUFNO0FBQUEsZ0JBQ04sU0FBUztBQUFBLGtCQUNQLFlBQVk7QUFBQSxrQkFDWixrQkFBa0I7QUFBQSxrQkFDbEIsYUFBYTtBQUFBLGdCQUNmO0FBQUEsZ0JBQ0EsU0FBUyxDQUFDQSxjQUFhO0FBQ3JCLHNCQUFJQSxVQUFTLFdBQVcsUUFBUTtBQUM5Qix3QkFBSSxTQUFTLGVBQWUsWUFBWTtBQUV0QyxzQkFBQyxPQUFPLGdCQUFnQixzQkFBc0IsV0FBVyxFQUFVLE9BQ2pFQSxVQUFTLE9BQU8sV0FBVyxPQUFPLEdBQUc7QUFBQSxvQkFDekM7QUFBQSxrQkFDRjtBQUFBLGdCQUNGO0FBQUEsY0FDRixDQUFDO0FBQUEsWUFDSDtBQUVBLGdCQUFJLFNBQVMsdUJBQXVCO0FBQ2xDLHFCQUFPLGdCQUFnQix3QkFBd0IsR0FBRyxPQUFPLGdCQUFnQixzQkFBc0IsVUFBVSxHQUFHLE9BQU8sZ0JBQWdCLHNCQUFzQixTQUFTLENBQUMsQ0FBQyxLQUFNLFNBQVMsc0JBQXNCLE1BQU0sR0FBRyxFQUFFLEtBQUssS0FBSyxDQUFDO0FBQUEsWUFDak87QUFFQSxnQkFBSSxTQUFTLGNBQWM7QUFDekIseUJBQVcsT0FBTyxTQUFTLGNBQWM7QUFDdkMsdUJBQU8sZ0JBQWdCLGFBQWEsR0FBRyxJQUFJLFNBQVMsYUFBYSxHQUFHO0FBRXBFLHdEQUFVLEVBQUUsS0FBSztBQUFBLGtCQUNmLEtBQUssR0FBRyxPQUFPO0FBQUEsa0JBQ2YsTUFBTTtBQUFBLGtCQUNOLFNBQVM7QUFBQSxvQkFDUCxZQUFZO0FBQUEsb0JBQ1osa0JBQWtCO0FBQUEsb0JBQ2xCLGFBQWE7QUFBQSxrQkFDZjtBQUFBLGtCQUNBLFNBQVMsQ0FBQ0EsY0FBYTtBQUNyQix3QkFBSUEsVUFBUyxXQUFXLFFBQVE7QUFDOUIsMEJBQUksU0FBUyxlQUFlLFlBQVk7QUFFdEMsd0JBQUMsT0FBTyxnQkFBZ0IsYUFBYSxHQUFHLEVBQVUsT0FBT0EsVUFBUyxPQUFPLFdBQVcsT0FBTyxHQUFHO0FBQUEsc0JBQ2hHO0FBQUEsb0JBQ0Y7QUFBQSxrQkFDRjtBQUFBLGdCQUNGLENBQUM7QUFBQSxjQUNIO0FBQUEsWUFDRjtBQUVBLGdCQUFJLFNBQVMsYUFBYTtBQUN4QixxQkFBTyxnQkFBZ0IsY0FBYyxHQUFHLE9BQU8sZ0JBQWdCLFlBQVksVUFBVSxHQUFHLE9BQU8sZ0JBQWdCLFlBQVksU0FBUyxDQUFDLENBQUMsS0FBTSxTQUFTLFlBQVksTUFBTSxHQUFHLEVBQUUsS0FBSyxLQUFLLENBQUM7QUFBQSxZQUN6TDtBQUVBLHVCQUFXLE1BQU07QUFDZixxQkFBTyxnQkFBZ0Isa0JBQWtCO0FBQUEsWUFDM0MsQ0FBQztBQUVELHFCQUFTLFFBQXFCLFNBQVMsY0FBYywwQkFBMEIsR0FBRyxXQUFXLEVBQUU7QUFBQSxjQUM3RjtBQUFBLGNBQ0EsS0FBSyxNQUFNLE9BQU8sZ0JBQWdCLGtCQUFrQixFQUNqRCxJQUFJLENBQUMsU0FBaUI7QUFDckIsdUJBQU8sS0FBSyxZQUFZLEdBQUcsTUFBTSxLQUFLLEtBQUssVUFBVSxHQUFHLEtBQUssWUFBWSxHQUFHLENBQUMsSUFBSTtBQUFBLGNBQ25GLENBQUMsRUFDQSxLQUFLLEdBQUc7QUFBQSxZQUNiO0FBRUEscUJBQVMsUUFBcUIsU0FBUyxjQUFjLDBCQUEwQixHQUFHLFdBQVcsRUFBRTtBQUFBLGNBQzdGO0FBQUEsY0FDQSxLQUFLLE1BQU0sT0FBTyxnQkFBZ0IscUJBQXFCLEVBQ3BELElBQUksQ0FBQyxTQUFpQjtBQUNyQix1QkFBTyxLQUFLLFlBQVksR0FBRyxNQUFNLEtBQUssS0FBSyxVQUFVLEdBQUcsS0FBSyxZQUFZLEdBQUcsQ0FBQyxJQUFJO0FBQUEsY0FDbkYsQ0FBQyxFQUNBLEtBQUssR0FBRztBQUFBLFlBQ2I7QUFHQSxrQkFBTSxtQkFBbUIsU0FBUyxjQUFjLFFBQVE7QUFFeEQsNkJBQWlCLE1BQU0sR0FBRyxPQUFPO0FBRWpDLHFCQUFTLEtBQUssWUFBWSxnQkFBZ0I7QUFFMUMsa0JBQU0sZ0JBQWdCLFNBQVMsY0FBYyxNQUFNO0FBQ25ELDBCQUFjLE1BQU07QUFDcEIsMEJBQWMsT0FBTztBQUNyQiwwQkFBYyxPQUFPLEdBQUcsT0FBTztBQUUvQixxQkFBUyxLQUFLLFlBQVksYUFBYTtBQUN2QyxxQkFBUyxLQUFLO0FBQUEsY0FDWjtBQUFBLGNBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEseUNBTTZCLEtBQUssVUFBVSxRQUFRLENBQUM7QUFBQSx5Q0FDeEIsT0FBTztBQUFBLHlDQUNQLGVBQWU7QUFBQSx5Q0FDZixPQUFPO0FBQUE7QUFBQSx5Q0FFUCxPQUFPO0FBQUEsWUFDdEM7QUFFQSxrQkFBTSxVQUFVLFNBQVMsY0FBYyxxQkFBcUI7QUFFNUQsb0JBQVEsTUFBTSxnQkFBZ0I7QUFFOUIscUJBQVMsaUJBQWlCLFNBQVMsQ0FBQyxVQUFVO0FBQzVDLGtCQUFJLE1BQU0sVUFBVSxNQUFNLElBQUksWUFBWSxNQUFNLEtBQUs7QUFFbkQsOEJBQWMsU0FBUyxjQUFjLCtCQUErQjtBQUVwRSxvQkFBSSxlQUFlLENBQUUsWUFBaUMsU0FBUztBQUM3RDtBQUFBLGdCQUNGO0FBRUEsb0JBQ0UsU0FBUyxlQUFlLDJDQUEyQyxFQUFFLFNBQVMsU0FBUyxhQUFhLEdBQ3BHO0FBQ0Esc0JBQUksWUFBWSxTQUFTO0FBQ3ZCLGdDQUFZLFVBQVU7QUFBQSxrQkFDeEIsT0FBTztBQUVMLDBCQUFNLFdBQVcsQ0FBQ0MsV0FBVTtBQUMxQiwwQkFBSSxZQUFZLFdBQVcsWUFBWSxTQUFTLGlCQUFpQjtBQUMvRCxvQ0FBWSxVQUFVO0FBQ3RCLGlDQUFTLGNBQWMsb0JBQW9CLFFBQVEsUUFBUTtBQUFBLHNCQUM3RDtBQUFBLG9CQUNGO0FBRUEsNkJBQVMsY0FBYyxpQkFBaUIsUUFBUSxRQUFRO0FBR3hELDBCQUFNLGFBQWEsU0FBUyxjQUFjLHNCQUFzQjtBQUNoRSwwQkFBTSxXQUFXLGtCQUFrQixTQUFTLGFBQWEsSUFBSTtBQUM3RCwwQkFBTSxNQUFNLFdBQVcsTUFBTSxXQUFXO0FBRXhDLGdDQUFZLE1BQU0sTUFBTSxJQUFJLE1BQU0sSUFBSSxNQUFNLEtBQUssV0FBVyxFQUFFO0FBQzlELGdDQUFZLE1BQU0sT0FBTyxHQUFHLFdBQVcsT0FBTyxXQUFXLFFBQVEsQ0FBQztBQUNsRSxnQ0FBWSxNQUFNLFlBQVksR0FBRyxRQUFRO0FBRXpDLGdDQUFZLE9BQU87QUFFbkIsZ0NBQVksVUFBVTtBQUFBLHNCQUNwQixPQUFPLGdCQUFnQixrQ0FBa0MsdUJBQXVCO0FBQUEsc0JBQ2hGLE9BQU8sZ0JBQWdCLGtDQUFrQyw0QkFBNEI7QUFBQSxzQkFDckYsT0FBTyxnQkFBZ0Isa0NBQWtDLGlCQUFpQjtBQUFBLHNCQUMxRSxPQUFPLGdCQUFnQixrQ0FBa0MsdUJBQXVCO0FBQUEsc0JBQ2hGLE9BQU8sZ0JBQWdCLGtDQUFrQyxtQ0FBbUM7QUFBQSxzQkFDNUYsT0FBTyxnQkFBZ0Isa0NBQWtDLHdCQUF3QjtBQUFBLHNCQUNqRixPQUFPLGdCQUFnQixrQ0FBa0Msb0JBQW9CO0FBQUEsb0JBQy9FO0FBRUEsZ0NBQVksVUFBVTtBQUN0QixnQ0FBWSxTQUFTLFNBQVM7QUFDOUIsZ0NBQVksMEJBQTBCLENBQUMsZ0JBQWdDO0FBQ3JFLDZCQUFPO0FBQUEsb0JBQ1Q7QUFFQSx3QkFBSSxRQUFRLFVBQVUsU0FBUyxVQUFVLEdBQUc7QUFDMUMsOEJBQVEsVUFBVSxPQUFPLFVBQVU7QUFBQSxvQkFDckM7QUFBQSxrQkFFRjtBQUFBLGdCQUNGLE9BQU87QUFDTCwwQkFBUSxVQUFVLE9BQU8sVUFBVTtBQUFBLGdCQUNyQztBQUFBLGNBQ0Y7QUFBQSxZQUNGLENBQUM7QUFFRCxtQkFBTyxnQkFBZ0IsZ0JBQWdCLE1BQU07QUFDM0Msc0JBQVEsSUFBSSxNQUFNLFNBQVMsYUFBYTtBQUN4QyxzQkFBUSxVQUFVLE9BQU8sVUFBVTtBQUFBLFlBQ3JDO0FBQUEsVUFHRjtBQUFBLFFBQ0YsQ0FBQztBQVFELGNBQU0sdUJBQXVCLENBQUMsWUFBeUI7QUFDckQsZ0JBQU0sZ0JBQWdCLFFBQVEsc0JBQXNCO0FBQ3BELGdCQUFNLE1BQU0sY0FBYyxNQUFPLGNBQWMsU0FBUyxNQUFPO0FBRS9ELG1CQUFTLE1BQU0sT0FBTyxHQUFHLEtBQUssS0FBSyxjQUFjLE9BQU8sY0FBYyxRQUFRLE9BQU8sYUFBYSxJQUFLLE9BQU8sYUFBYSxNQUFPLElBQUksY0FBYyxPQUFPLGNBQWMsUUFBUyxPQUFPLGFBQWEsTUFBTyxDQUFDLENBQUM7QUFDL00sbUJBQVMsTUFBTSxNQUFNLEdBQUcsTUFBTSxPQUFPLGNBQWMsSUFBSSxPQUFPLGNBQWMsSUFBSSxHQUFHO0FBQ25GLG1CQUFTLE1BQU0sUUFBUSxHQUFHLEtBQUssS0FBSyxjQUFjLE9BQU8sY0FBYyxRQUFRLE9BQU8sYUFBYSxJQUFJLGNBQWMsT0FBUSxPQUFPLGFBQWEsTUFBTyxJQUFJLE9BQU8sYUFBYSxjQUFjLFFBQVMsT0FBTyxhQUFhLE1BQU8sQ0FBQyxDQUFDO0FBQ3BPLG1CQUFTLE1BQU0sU0FBUyxJQUFJLGNBQWMsU0FBUyxPQUFPLGNBQWMsSUFBSSxPQUFPLGNBQWMsSUFBSSxjQUFjLFVBQVcsY0FBYyxTQUFTLE1BQU8sRUFBRTtBQUFBLFFBQ2hLO0FBS0EsY0FBTSxtQkFBbUIsSUFBSSxNQUErRDtBQUU1RixZQUFJLDRCQUE0QjtBQUNoQyxZQUFJLFFBQVE7QUFFWixtQkFBVyxvQkFBb0IsU0FBUyxpQkFBaUIseUNBQXlDLEdBQUc7QUFDbkcsMkJBQWlCLGlCQUFpQixTQUFTLENBQUMsVUFBVTtBQUNwRCxrQkFBTSxlQUFlLElBQUksaUJBQWlCLENBQUMsZUFBZSxhQUFhO0FBQ3JFLHlCQUFXLFlBQVksZUFBZTtBQUNwQyxvQkFBSSxTQUFTLFNBQVMsYUFBYTtBQUNqQyw2QkFBVyxTQUFTLFNBQVMsWUFBWTtBQUN2Qyx3QkFDRSxpQkFBaUIsb0JBQ2pCLFFBQVEsUUFBcUIsTUFBTSxhQUFhLEVBQUUsVUFBVSxTQUFTLElBQUksR0FDekU7QUFFQSxvQ0FBYyxTQUFTLGNBQWMsK0JBQStCO0FBQ3BFLDBCQUFJLGVBQWUsQ0FBRSxZQUFpQyxTQUFTO0FBQzdEO0FBQUEsc0JBQ0Y7QUFFQSw0QkFBTSxjQUFjO0FBRXBCLDRCQUFNLGlCQUFpQixXQUFXLENBQUNBLFdBQVU7QUFFM0Msc0NBQWMsU0FBUyxjQUFjLCtCQUErQjtBQUNwRSw0QkFBSSxlQUFlLENBQUUsWUFBaUMsU0FBUztBQUM3RDtBQUFBLHdCQUNGO0FBRUEsNEJBQUlBLE9BQU0sV0FBV0EsT0FBTSxRQUFRLE9BQU9BLE9BQU0sUUFBUSxNQUFNO0FBRTVELGdDQUFNLGtCQUFrQixJQUFJLE1BQWM7QUFFMUMscUNBQVcsWUFBWSxPQUFPLGdCQUFnQixjQUFjO0FBQzFELGdDQUFJLE9BQU8sZ0JBQWdCLGFBQWEsUUFBUSxHQUFHLFNBQVM7QUFDMUQseUNBQVdDLFdBQVUsT0FBTyxnQkFBZ0IsYUFBYSxRQUFRLEVBQUUsU0FBUztBQUMxRSxnREFBZ0IsS0FBSyxLQUFLLFFBQVEsTUFBTUEsT0FBTSxFQUFFO0FBQUEsOEJBQ2xEO0FBQUEsNEJBQ0Y7QUFBQSwwQkFDRjtBQUVBLHFDQUFXLGlCQUFpQixPQUFPLGdCQUFnQixvQkFBb0I7QUFDckUsdUNBQVcsYUFBYSxPQUFPLGdCQUFnQixtQkFBbUIsYUFBYSxHQUFHLFdBQVc7QUFDM0YsOENBQWdCLEtBQUssR0FBRyxjQUFjLFFBQVEsT0FBTyxHQUFHLENBQUMsSUFBSSxTQUFTLEVBQUU7QUFBQSw0QkFDMUU7QUFBQSwwQkFDRjtBQUdBLHNDQUFZLE9BQU87QUFDbkIsc0NBQVksVUFBVTtBQUN0QixzQ0FBWSxVQUFVO0FBQ3RCLHNDQUFZLFNBQVM7QUFDckIsc0NBQVksMEJBQTBCLENBQUMsZ0JBQWdDO0FBQ3JFLGdDQUFJLFlBQVksUUFBUSxHQUFHLE1BQU0sSUFBSTtBQUNuQyxxQ0FBTyxZQUFZLFVBQVUsWUFBWSxRQUFRLEdBQUcsSUFBSSxDQUFDLEVBQUUsS0FBSztBQUFBLDRCQUNsRTtBQUVBLG1DQUFPO0FBQUEsMEJBQ1Q7QUFHQSxzQ0FBWSxnQkFBZ0IsS0FBSyxDQUFDLGNBQWM7QUFDOUMsZ0NBQUksVUFBVSxRQUFRLEdBQUcsR0FBRztBQUMxQjtBQUFBLDRCQUNGO0FBRUEsb0NBQVEsUUFBMkIsU0FBUyxjQUFjLFFBQVEsQ0FBQyxFQUFFO0FBQUEsOEJBQ25FO0FBQUEsOEJBQ0EsR0FBRyxPQUFPLGdCQUFnQixRQUFRLGVBQWUsTUFBTSxTQUFZLE9BQU8sZ0JBQWdCLFFBQVEsS0FBSyxPQUFPLGdCQUFnQixRQUFRLGVBQWUsQ0FBQyxHQUNwSixVQUFVLFFBQVEsR0FBRyxNQUFNLEtBQ3ZCLE9BQU8sZ0JBQWdCLGFBQ3JCLFVBQ0csVUFBVSxVQUFVLFFBQVEsR0FBRyxJQUFJLEdBQUcsVUFBVSxZQUFZLEdBQUcsSUFBSSxDQUFDLEVBQ3BFLEtBQUssQ0FDVixHQUFHLGNBQ0gsT0FBTyxnQkFBZ0IsbUJBQ3JCLFVBQVUsVUFBVSxHQUFHLFVBQVUsWUFBWSxHQUFHLENBQUMsRUFBRSxRQUFRLE1BQU0sR0FBRyxFQUFFLEtBQUssQ0FDN0UsR0FBRyxXQUNUO0FBQUEsNEJBQ0Y7QUFBQSwwQkFDRixDQUFDO0FBR0Qsc0NBQVksaUJBQWlCLEtBQUssQ0FBQyxjQUFjO0FBQy9DLGdDQUFJLFlBQVksU0FBUyxpQkFBaUI7QUFDeEM7QUFBQSw0QkFDRjtBQUVBLGdDQUFJLE1BQU0sTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJO0FBQ25DLG9DQUFNLFFBQVEsTUFBTSxNQUFNLFVBQVUsTUFBTSxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsRUFBRSxLQUFLO0FBQUEsNEJBQ3pFLE9BQU87QUFDTCxvQ0FBTSxRQUFRLE1BQU0sTUFBTSxRQUFRLFlBQVksRUFBRTtBQUFBLDRCQUNsRDtBQUVBLHFDQUFTO0FBQUEsOEJBQ1AsWUFBWSxPQUFPLGNBQWMsY0FBYyxjQUFjLEtBQUs7QUFBQSw4QkFDbEU7QUFBQSw0QkFDRixFQUFFLE1BQU07QUFBQSwwQkFDVixDQUFDO0FBR0QsOEJBQUksT0FBTztBQUNULGtDQUFNLFlBQVksU0FBUztBQUFBLDhCQUN6QixNQUFNO0FBQUEsOEJBQ047QUFBQSw0QkFDRixFQUFFLHNCQUFzQjtBQUV4Qix3Q0FBWSxNQUFNLFlBQVksR0FBRyxPQUFPLGNBQWMsS0FBSyxLQUFLLFVBQVUsTUFBTSxDQUFDO0FBQ2pGLHdDQUFZLE1BQU0sTUFBTTtBQUN4Qix3Q0FBWSxNQUFNLE9BQU8sR0FBRyxLQUFLLEtBQUssVUFBVSxJQUFJLENBQUM7QUFDckQsd0NBQVksTUFBTSxZQUFZLEdBQUcsS0FBSyxLQUFLLFVBQVUsTUFBTyxPQUFPLGNBQWMsTUFBTyxDQUFDLENBQUM7QUFFMUYscUNBQVMsTUFBTSxVQUFVO0FBRXpCLGlEQUFxQixXQUFXO0FBR2hDLGtDQUFNQyxjQUNKLE9BQU8sZ0JBQWdCLFFBQVEsZUFBZSxNQUFNLFNBQ2hELE9BQU8sZ0JBQWdCLFFBQVEsS0FDL0IsT0FBTyxnQkFBZ0IsUUFBUSxlQUFlO0FBRXBELGtDQUFNLGNBQWMsUUFBUTtBQUFBLDhCQUMxQixPQUFPLGdCQUFnQixtQkFDckIsZ0JBQWdCLENBQUMsRUFDZCxVQUFVLEdBQUcsZ0JBQWdCLENBQUMsRUFBRSxRQUFRLEdBQUcsSUFBSSxDQUFDLEVBQ2hELFlBQVksRUFDWixLQUFLLENBQ1YsR0FBRyxnQkFDQSxnQkFBZ0IsQ0FBQyxFQUFFLFFBQVEsR0FBRyxNQUFNLEtBQ2pDLE9BQU8sZ0JBQWdCLGFBQ3JCLGdCQUFnQixDQUFDLEVBQUUsVUFBVSxHQUFHLGdCQUFnQixDQUFDLEVBQUUsUUFBUSxHQUFHLElBQUksQ0FBQyxFQUFFLEtBQUssQ0FDNUUsR0FBRyxjQUNILE9BQU8sZ0JBQWdCLG1CQUNyQixnQkFBZ0IsQ0FBQyxFQUNkLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQyxFQUFFLFlBQVksR0FBRyxDQUFDLEVBQ2hELFFBQVEsTUFBTSxHQUFHLEVBQ2pCLEtBQUssQ0FDVixHQUFHO0FBQUEsNEJBQ1g7QUFFQSxnQ0FBSSxZQUFZLENBQUMsTUFBTSxLQUFLO0FBQzFCLHVDQUFTLFlBQVksbUJBQW1CQSxXQUFVLEdBQUcsV0FBVztBQUFBLDRCQUNsRSxPQUFPO0FBQ0wsdUNBQVMsWUFBWSxpRUFBaUUsV0FBVztBQUFBLDRCQUNuRztBQUFBLDBCQUVGO0FBQUEsd0JBQ0Y7QUFBQSxzQkFDRixDQUFDO0FBRUQsNEJBQU0saUJBQWlCLFFBQVEsQ0FBQ0YsV0FBVTtBQUN4Qyw0QkFBSSxDQUFDLHVCQUF1QjtBQUMxQixtQ0FBUyxNQUFNLFVBQVU7QUFDekIsc0NBQVksVUFBVTtBQUFBLHdCQUN4QixPQUFPO0FBQ0wscURBQTJCLE1BQU07QUFDL0IscUNBQVMsTUFBTSxVQUFVO0FBQ3pCLHdDQUFZLFVBQVU7QUFBQSwwQkFDeEI7QUFBQSx3QkFDRjtBQUFBLHNCQUNGLENBQUM7QUFBQSxvQkFFSDtBQUFBLGtCQUNGO0FBQUEsZ0JBQ0Y7QUFBQSxjQUNGO0FBQUEsWUFDRixDQUFDO0FBRUQseUJBQWEsUUFBUSxRQUFRLFFBQVEsU0FBUyxjQUFjLGFBQWEsQ0FBQyxHQUFHO0FBQUEsY0FDM0UsV0FBVztBQUFBLGNBQ1gsU0FBUztBQUFBLFlBQ1gsQ0FBQztBQUFBLFVBRUgsQ0FBQztBQUFBLFFBQ0g7QUFHQSxtQkFBVyxhQUFhLFNBQVMsaUJBQWlCLGtDQUFrQyxHQUFHO0FBQ3JGLG9CQUFVLGlCQUFpQixTQUFTLENBQUMsVUFBVTtBQUU3QyxrQkFBTSxvQkFBb0IsSUFBSSxpQkFBaUIsQ0FBQyxlQUFlRyxjQUFhO0FBQzFFLHlCQUFXLFlBQVksZUFBZTtBQUNwQyxvQkFBSSxTQUFTLFNBQVMsYUFBYTtBQUNqQyw2QkFBVyxTQUFTLFNBQVMsWUFBWTtBQUV2QywwQkFBTSxpQkFBaUIsUUFBUSxRQUFxQixNQUFNLGFBQWE7QUFFdkUsd0JBQUksZUFBZSxVQUFVLFNBQVMsZUFBZSxHQUFHO0FBQ3RELDBCQUFJO0FBRUoscUNBQWUsaUJBQWlCLFFBQVEsQ0FBQ0gsV0FBVTtBQUNqRCw0QkFBSSxDQUFDLHVCQUF1QjtBQUMxQixrQ0FBUTtBQUNSLG1DQUFTLE1BQU0sVUFBVTtBQUN6QixzQ0FBWSxVQUFVO0FBQUEsd0JBQ3hCLE9BQU87QUFDTCxxREFBMkIsTUFBTTtBQUMvQixvQ0FBUTtBQUNSLHFDQUFTLE1BQU0sVUFBVTtBQUN6Qix3Q0FBWSxVQUFVO0FBQUEsMEJBQ3hCO0FBQUEsd0JBQ0Y7QUFBQSxzQkFDRixDQUFDO0FBRUQscUNBQWUsaUJBQWlCLFNBQVMsQ0FBQ0EsV0FBVTtBQUNsRCw4QkFBTSxjQUFjLFNBQVMsUUFBcUJBLE9BQU0sUUFBUSxXQUFXO0FBRTNFLDRCQUFJLFVBQVUsUUFBVztBQUN2Qiw4QkFBSUEsT0FBTSxRQUFRLEtBQUs7QUFDckIsb0NBQVE7QUFDUixvQ0FBUTtBQUVSLDZDQUFpQixTQUFTO0FBRTFCLHVDQUFXLFlBQVksT0FBTyxnQkFBZ0IsY0FBYztBQUMxRCxrQ0FBSSxPQUFPLGdCQUFnQixhQUFhLFFBQVEsR0FBRyxRQUFRO0FBQ3pELDJDQUFXLFlBQVksT0FBTyxnQkFBZ0IsYUFBYSxRQUFRLEVBQUUsU0FBUztBQUM1RSxtREFBaUIsS0FBSztBQUFBLG9DQUNwQjtBQUFBLG9DQUNBLE1BQU07QUFBQSxvQ0FDTixhQUFhLFFBQVE7QUFBQSxzQ0FDbkIsT0FBTyxnQkFBZ0IsYUFBYSxRQUFRLEVBQUUsUUFBUSxRQUFRO0FBQUEsb0NBQ2hFO0FBQUEsa0NBQ0YsQ0FBQztBQUFBLGdDQUNIO0FBQUEsOEJBQ0Y7QUFBQSw0QkFDRjtBQUVBLHdDQUFZLE9BQU87QUFDbkIsd0NBQVksVUFBVSxpQkFBaUI7QUFBQSw4QkFDckMsQ0FBQyxhQUFhLEdBQUcsU0FBUyxRQUFRLE1BQU0sU0FBUyxJQUFJO0FBQUEsNEJBQ3ZEO0FBR0Esa0NBQU0sV0FBVyxRQUFRO0FBQUEsOEJBQ3ZCLFlBQVksY0FBYyxVQUFVLEdBQUcsWUFBWSxjQUFjLFFBQVEsR0FBRyxJQUFJLENBQUMsRUFBRSxLQUFLO0FBQUEsNEJBQzFGO0FBRUEsa0NBQU0sY0FBYyxRQUFRO0FBQUEsOEJBQzFCLE9BQU8sZ0JBQWdCLGFBQWEsUUFBUSxHQUFHO0FBQUEsNEJBQ2pEO0FBRUEsZ0NBQUksT0FBTyxnQkFBZ0IsYUFBYSxRQUFRLEdBQUcsWUFBWSxDQUFDLE1BQU0sS0FBSztBQUN6RSx1Q0FBUyxZQUFZLG1CQUFtQixVQUFVLEdBQUcsV0FBVztBQUFBLDRCQUNsRSxPQUFPO0FBQ0wsdUNBQVMsWUFBWTtBQUFBO0FBQUEsZ0NBRWpCLFdBQVc7QUFBQSw0QkFDakI7QUFFQSx3Q0FBWSxVQUFVO0FBQ3RCLHdDQUFZLG9CQUFvQjtBQUVoQyxnQ0FBSSxNQUFNLGtCQUFrQixRQUFRLE1BQU0sa0JBQWtCLFFBQVc7QUFDckUsb0NBQU0sWUFBWSxTQUFTO0FBQUEsZ0NBQ3pCLE1BQU07QUFBQSxnQ0FDTjtBQUFBLDhCQUNGLEVBQUUsc0JBQXNCO0FBRXhCLDBDQUFZLE1BQU0sWUFBWSxHQUFHLE9BQU8sY0FBYyxLQUFLLEtBQUssVUFBVSxNQUFNLENBQUM7QUFDakYsMENBQVksTUFBTSxNQUFNLEdBQUcsS0FBSyxLQUFLLFVBQVUsTUFBTSxDQUFDO0FBQ3RELDBDQUFZLE1BQU0sT0FBTyxHQUFHLEtBQUssS0FBSyxVQUFVLFFBQVEsWUFBWSxzQkFBc0IsRUFBRSxRQUFTLE9BQU8sYUFBYSxNQUFPLENBQUMsQ0FBQztBQUNsSSwwQ0FBWSxNQUFNLFlBQVksR0FBRyxLQUFLLEtBQUssT0FBTyxjQUFlLE9BQU8sY0FBYyxNQUFPLElBQUksVUFBVSxNQUFNLENBQUM7QUFBQSw0QkFDcEg7QUFFQSxxQ0FBUyxNQUFNLFVBQVU7QUFFekIsaURBQXFCLFdBQVc7QUFBQSwwQkFDbEM7QUFBQSx3QkFDRixPQUFPO0FBQ0wsOEJBQUlBLE9BQU0sUUFBUSxLQUFLO0FBQ3JCLHdDQUFZLGdCQUFnQkEsTUFBSztBQUNqQyx3Q0FBWSxxQkFBcUIsZUFBZTtBQUFBLDhCQUM5QyxVQUFVO0FBQUEsOEJBQ1YsT0FBTztBQUFBLDhCQUNQLFFBQVE7QUFBQSw0QkFDVixDQUFDO0FBQUEsMEJBQ0g7QUFFQSw4QkFBSSxPQUFPO0FBQ1QsdURBQTJCLE1BQU07QUFBQSw0QkFBQztBQUVsQyxnQ0FDRSxrQkFBa0IsS0FBS0EsT0FBTSxHQUFHLEtBQ2hDQSxPQUFNLFFBQVEsZUFDZEEsT0FBTSxRQUFRLFVBQ2Q7QUFDQSxrQ0FBSUEsT0FBTSxRQUFRLEtBQUs7QUFDckIsK0NBQWUsWUFBWSxZQUFZLGNBQWM7QUFBQSxrQ0FDbkQsWUFBWSxjQUFjLFFBQVEsR0FBRyxJQUFJO0FBQUEsZ0NBQzNDO0FBRUEsd0NBQVE7QUFDUix5Q0FBUyxNQUFNLFVBQVU7QUFDekIsNENBQVksVUFBVTtBQUV0QixnQ0FBQUEsT0FBTSxPQUFPLGNBQWMsSUFBSSxjQUFjLFdBQVcsRUFBRSxLQUFLLE1BQU0sQ0FBQyxDQUFDO0FBRXZFO0FBQUEsOEJBQ0Y7QUFFQSxrQ0FBSSxZQUFZLFVBQVUsUUFBUSxHQUFHLE1BQU0sSUFBSTtBQUU3Qyw4Q0FBYyxTQUFTLGNBQWMsK0JBQStCO0FBQ3BFLG9DQUFJLGVBQWUsQ0FBRSxZQUFpQyxTQUFTO0FBQzdEO0FBQUEsZ0NBQ0Y7QUFFQSx3Q0FBUTtBQUNSLHlDQUFTLE1BQU0sVUFBVTtBQUN6Qiw0Q0FBWSxVQUFVO0FBRXRCO0FBQUEsOEJBQ0Y7QUFFQSxrQ0FBSSxZQUFZLE9BQU8sWUFBWSxVQUFVLFVBQVUsQ0FBQyxDQUFDLEVBQUUsV0FBVyxHQUFHO0FBQ3ZFLCtDQUFlLFlBQVksWUFBWSxjQUFjO0FBQUEsa0NBQ25ELFlBQVksY0FBYyxRQUFRLEdBQUcsSUFBSTtBQUFBLGdDQUMzQztBQUVBLHdDQUFRO0FBQ1IseUNBQVMsTUFBTSxVQUFVO0FBQ3pCLDRDQUFZLFVBQVU7QUFFdEIsZ0NBQUFBLE9BQU0sT0FBTyxjQUFjLElBQUksY0FBYyxXQUFXLEVBQUUsS0FBSyxRQUFRLENBQUMsQ0FBQztBQUV6RSxzQ0FBTSxVQUFVLENBQUNBLFdBQXlCO0FBQ3hDLHdDQUFNLGdCQUFnQixTQUFTLFFBQXVCQSxRQUFPLGFBQWE7QUFFMUUsZ0RBQWMsZUFBZTtBQUM3QixnREFBYyx5QkFBeUI7QUFDdkMsZ0RBQWMsZ0JBQWdCO0FBRTlCLDZDQUFXLE1BQU07QUFDZiw2Q0FBUyxvQkFBb0IsV0FBVyxPQUFPO0FBQUEsa0NBQ2pELEdBQUcsR0FBRztBQUFBLGdDQUNSO0FBRUEseUNBQVMsaUJBQWlCLFdBQVcsT0FBTztBQUU1QztBQUFBLDhCQUNGO0FBQUEsNEJBRUY7QUFBQSwwQkFDRixPQUFPO0FBQ0wsdURBQTJCLE1BQU07QUFDL0Isc0NBQVE7QUFDUix1Q0FBUyxNQUFNLFVBQVU7QUFDekIsMENBQVksVUFBVTtBQUFBLDRCQUN4QjtBQUFBLDBCQUNGO0FBRUEsOEJBQUksT0FBTztBQUNULGtDQUFNLFdBQVcsUUFBUTtBQUFBLDhCQUN2QixZQUFZLGNBQWMsVUFBVSxHQUFHLFlBQVksY0FBYyxRQUFRLEdBQUcsSUFBSSxDQUFDLEVBQUUsS0FBSztBQUFBLDRCQUMxRjtBQUVBLGtDQUFNLGNBQWMsUUFBUTtBQUFBLDhCQUMxQixPQUFPLGdCQUFnQixhQUFhLFFBQVEsR0FBRztBQUFBLDRCQUNqRDtBQUVBLGdDQUFJLE9BQU8sZ0JBQWdCLGFBQWEsUUFBUSxHQUFHLFlBQVksQ0FBQyxNQUFNLEtBQUs7QUFDekUsc0NBQVEsUUFBMkIsU0FBUyxjQUFjLFFBQVEsQ0FBQyxFQUFFLE9BQU87QUFFNUUsdUNBQVMsWUFBWSxtQkFBbUIsVUFBVSxHQUFHLFdBQVc7QUFBQSw0QkFDbEUsT0FBTztBQUNMLHVDQUFTLFlBQVk7QUFBQTtBQUFBLGdDQUVqQixXQUFXO0FBQUEsNEJBQ2pCO0FBQUEsMEJBQ0Y7QUFBQSx3QkFDRjtBQUFBLHNCQUNGLENBQUM7QUFBQSxvQkFDSDtBQUVBLHdCQUFJLGlCQUFpQixrQkFBa0I7QUFFckMsMEJBQ0UsU0FBUztBQUFBLHdCQUNQLFFBQVE7QUFBQSwwQkFDTixRQUFRLFFBQXFCLE1BQU0sYUFBYSxFQUFFO0FBQUEsd0JBQ3BELEVBQUUsY0FBYyxLQUFLO0FBQUEsd0JBQ3JCO0FBQUEsc0JBQ0YsRUFBRSxVQUFVLFlBQVksTUFBTSxnQkFDOUI7QUFDQSwrQkFBTyxnQkFBZ0IsZ0JBQWdCLE9BQU8sZ0JBQWdCLGtCQUFrQjtBQUVoRiw0QkFBSSxDQUFDLFVBQVUsU0FBUztBQUN0QixnQ0FBTSxrQkFBa0IsTUFBTSxNQUFNLFFBQVEsTUFBTSxNQUFNLE1BQU07QUFFOUQsbUNBQVM7QUFBQSw0QkFDUCxTQUFTLGNBQWMsMEJBQTBCO0FBQUEsNEJBQ2pEO0FBQUEsMEJBQ0YsRUFBRTtBQUFBLDRCQUNBO0FBQUEsNEJBQ0EsS0FBSyxNQUFNLE9BQU8sZ0JBQWdCLGtCQUFrQixFQUNqRCxJQUFJLENBQUMsU0FBaUI7QUFDckIscUNBQU8sS0FBSyxZQUFZLEdBQUcsTUFBTSxLQUFLLEtBQUssVUFBVSxHQUFHLEtBQUssWUFBWSxHQUFHLENBQUMsSUFBSTtBQUFBLDRCQUNuRixDQUFDLEVBQ0EsS0FBSyxHQUFHO0FBQUEsMEJBQ2I7QUFFQSxvQ0FBVSxPQUFPO0FBQ2pCLG9DQUFVLFNBQVMsU0FBUyxRQUEwQixPQUFPLGdCQUFnQjtBQUM3RSxvQ0FBVSxVQUFVO0FBRXBCLGdEQUFzQixLQUFLO0FBRTNCLGdDQUFNLGlCQUFpQixRQUFRLENBQUNBLFdBQVU7QUFDeEMsZ0NBQUksQ0FBQyx1QkFBdUI7QUFDMUIsd0NBQVUsVUFBVTtBQUNwQix1Q0FBUyxNQUFNLFVBQVU7QUFBQSw0QkFDM0IsT0FBTztBQUNMLHlEQUEyQixNQUFNO0FBQy9CLDBDQUFVLFVBQVU7QUFDcEIseUNBQVMsTUFBTSxVQUFVO0FBQUEsOEJBQzNCO0FBQUEsNEJBQ0Y7QUFBQSwwQkFDRixDQUFDO0FBRUQsOEJBQUksU0FBUyxjQUFjLFFBQVEsR0FBRztBQUNwQyxvQ0FBUSxRQUEyQixTQUFTLGNBQWMsUUFBUSxDQUFDLEVBQUU7QUFBQSw4QkFDbkU7QUFBQSw4QkFDQSxHQUFHLE9BQU8sZ0JBQWdCLFFBQVEsZUFBZSxNQUFNLFNBQVksT0FBTyxnQkFBZ0IsUUFBUSxLQUFLLE9BQU8sZ0JBQWdCLFFBQVEsZUFBZSxDQUFDLEdBQUcsT0FBTyxnQkFBZ0IsbUJBQW1CLFVBQVUsYUFBYSxHQUFHLFdBQVc7QUFBQSw0QkFDMU87QUFBQSwwQkFDRjtBQUFBLHdCQUNGO0FBRUEsNEJBQUksU0FBUyxNQUFNLFlBQVksU0FBUztBQUN0QyxtQ0FBUyxNQUFNLFVBQVU7QUFFekIsK0NBQXFCLFNBQVM7QUFBQSx3QkFDaEM7QUFBQSxzQkFDRjtBQUVBLDBCQUFJLE1BQU0sZUFBZTtBQUN2Qiw4QkFBTSxjQUFjLE1BQU07QUFDMUIsNEJBQUksTUFBTSxVQUFVLFNBQVMsYUFBYSxLQUFLLFlBQVksVUFBVSxTQUFTLElBQUksR0FBRztBQUNuRiw4QkFBSTtBQUVKLDhCQUFJLE1BQU0sY0FBYyxlQUFlO0FBQ3JDLHVDQUFXLGtCQUFrQixRQUFRO0FBQUEsOEJBQ25DLFFBQVEsUUFBcUIsWUFBWSxhQUFhLEVBQUU7QUFBQSw0QkFDMUQsRUFBRSxpQkFBaUIsS0FBSyxHQUFHO0FBQ3pCLGtDQUNFLGVBQWUsaUJBQ2YsZUFBZSxVQUFVLFlBQVksTUFBTSxnQkFDM0M7QUFDQSwwQ0FBVSxTQUFTO0FBQUEsa0NBQ2pCLFFBQVEsUUFBcUIsZUFBZSxhQUFhLEVBQUUsY0FBYyxLQUFLO0FBQUEsa0NBQzlFO0FBQUEsZ0NBQ0YsRUFBRTtBQUVGO0FBQUEsOEJBQ0Y7QUFBQSw0QkFDRjtBQUFBLDBCQUNGO0FBRUEsOEJBQUksU0FBUztBQUVYLHFDQUFTLFFBQTBCLE9BQU8sZ0JBQWdCLEVBQUUsY0FBYztBQUUxRSxrQ0FBTSxpQkFBaUIsV0FBVyxDQUFDQSxXQUFVO0FBRTNDLGtDQUFJQSxPQUFNLFdBQVdBLE9BQU0sUUFBUSxPQUFPQSxPQUFNLFFBQVEsTUFBTTtBQUU1RCxzQ0FBTSxtQkFBcUQsQ0FBQztBQUU1RCx5Q0FBUyxpQkFBaUIsUUFBUSxLQUFLLEVBQUUsTUFBTSxHQUFHLEdBQUc7QUFFbkQsc0NBQUksQ0FBQyxRQUFRLEtBQUssYUFBYSxHQUFHO0FBQ2hDLG9EQUFnQixjQUFjLFlBQVk7QUFFMUMscURBQWlCLGFBQWEsSUFBSSxJQUFJLE1BQWM7QUFFcEQsK0NBQVcsYUFBYSxPQUFPLGdCQUFnQixtQkFBbUIsYUFBYSxHQUMzRSxXQUFXO0FBQ2IsOENBQVEsUUFBdUIsaUJBQWlCLGFBQWEsQ0FBQyxFQUFFLEtBQUssU0FBUztBQUFBLG9DQUNoRjtBQUFBLGtDQUNGO0FBRUEsd0NBQU0seUJBQXlCLElBQUksTUFBYztBQUVqRCw2Q0FBV0ksa0JBQWlCLGtCQUFrQjtBQUM1QywrQ0FBVyxhQUFhLFFBQVE7QUFBQSxzQ0FDOUIsaUJBQWlCQSxjQUFhO0FBQUEsb0NBQ2hDLEdBQUc7QUFDRCw2REFBdUIsS0FBSyxHQUFHQSxjQUFhLE1BQU0sU0FBUyxFQUFFO0FBQUEsb0NBQy9EO0FBQUEsa0NBQ0Y7QUFFQSxzQ0FBSSx1QkFBdUIsV0FBVyxHQUFHO0FBQ3ZDO0FBQUEsa0NBQ0Y7QUFHQSw4Q0FBWSxvQkFBb0IsQ0FBQyxnQkFBZ0M7QUFDL0QsMkNBQU8sWUFBWSxZQUFZO0FBQUEsa0NBQ2pDO0FBR0EsOENBQVksT0FBTztBQUNuQiw4Q0FBWSxTQUFTO0FBQ3JCLDhDQUFZLFVBQVU7QUFDdEIsOENBQVksVUFBVTtBQUN0QiwyQ0FBUyxNQUFNLFVBQVU7QUFDekIsOENBQVksMEJBQTBCLENBQUMsZ0JBQWdDO0FBQ3JFLDJDQUFPLFdBQVcsWUFBWSxVQUFVLFlBQVksUUFBUSxHQUFHLElBQUksQ0FBQyxFQUFFLEtBQUssQ0FBQztBQUFBLGtDQUM5RTtBQUVBLDBEQUF3QixLQUFLO0FBQzdCLHVEQUFxQixXQUFXO0FBR2hDLHNDQUNFLE9BQU8sZ0JBQWdCLG1CQUNyQixZQUFZLGNBQWMsVUFBVSxHQUFHLFlBQVksY0FBYyxRQUFRLEdBQUcsSUFBSSxDQUFDLENBQ25GLEdBQUcsWUFBWSxDQUFDLE1BQU0sS0FDdEI7QUFDQSw2Q0FBUyxZQUFZLG1CQUFtQixPQUFPLGdCQUFnQixRQUFRLGVBQWUsTUFBTSxTQUFZLE9BQU8sZ0JBQWdCLFFBQVEsS0FBSyxPQUFPLGdCQUFnQixRQUFRLGVBQWUsQ0FBQyxHQUFHLE9BQU8sZ0JBQWdCLG1CQUFtQixZQUFZLGNBQWMsVUFBVSxHQUFHLFlBQVksY0FBYyxRQUFRLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxXQUFXO0FBQUEsa0NBQzFVLE9BQU87QUFDTCwwQ0FBTSxZQUFZLFNBQVMsY0FBYyxlQUFlO0FBRXhELHdDQUFJLFdBQVc7QUFDYixnREFBVSxPQUFPO0FBQUEsb0NBQ25CO0FBRUEsNkNBQVMsWUFBWTtBQUFBO0FBQUEsc0NBRWpCLE9BQU8sZ0JBQWdCLFFBQVEsZUFBZSxDQUFDLEdBQUcsT0FBTyxnQkFBZ0IsbUJBQW1CLFlBQVksY0FBYyxVQUFVLEdBQUcsWUFBWSxjQUFjLFFBQVEsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLFdBQVc7QUFBQSxrQ0FDbE07QUFFQSwyQ0FBUyxZQUFZLFNBQVMsVUFBVSxRQUFRLGFBQWEsRUFBRTtBQUFBLGdDQUNqRTtBQUFBLDhCQUNGO0FBR0Esa0NBQUlKLE9BQU0sUUFBUSxVQUFVO0FBQzFCLDRDQUFZLFVBQVU7QUFDdEIseUNBQVMsTUFBTSxVQUFVO0FBQUEsOEJBRTNCO0FBQUEsNEJBQ0YsQ0FBQztBQUVELGtDQUFNLGlCQUFpQixRQUFRLENBQUNBLFdBQVU7QUFDeEMsa0NBQUksQ0FBQyx1QkFBdUI7QUFDMUIsNENBQVksVUFBVTtBQUN0Qix5Q0FBUyxNQUFNLFVBQVU7QUFBQSw4QkFDM0IsT0FBTztBQUNMLDJEQUEyQixNQUFNO0FBQy9CLDhDQUFZLFVBQVU7QUFDdEIsMkNBQVMsTUFBTSxVQUFVO0FBQUEsZ0NBQzNCO0FBQUEsOEJBQ0Y7QUFBQSw0QkFDRixDQUFDO0FBQUEsMEJBR0gsT0FBTztBQUVMLDBDQUFjLFNBQVMsY0FBYywrQkFBK0I7QUFDcEUsZ0NBQUksZUFBZSxDQUFFLFlBQWlDLFNBQVM7QUFDN0Q7QUFBQSw0QkFDRjtBQUdBLHFDQUFTLFFBQTBCLE9BQU8sZ0JBQWdCLEVBQUUsY0FBYztBQUUxRSxrQ0FBTSxpQkFBaUIsV0FBVyxDQUFDQSxXQUFVO0FBQzNDLGtDQUFJQSxPQUFNLFVBQVVBLE9BQU0sSUFBSSxZQUFZLE1BQU0sS0FBSztBQUVuRCw4Q0FBYyxTQUFTLGNBQWMsK0JBQStCO0FBQ3BFLG9DQUFJLGVBQWUsQ0FBRSxZQUFpQyxTQUFTO0FBQzdEO0FBQUEsZ0NBQ0Y7QUFFQSxnQ0FBQUEsT0FBTSxlQUFlO0FBQ3JCLGdDQUFBQSxPQUFNLHlCQUF5QjtBQUMvQixnQ0FBQUEsT0FBTSxnQkFBZ0I7QUFFdEIsc0NBQU0sUUFBUTtBQUVkLHlDQUFTO0FBQUEsa0NBQ1AsUUFBUTtBQUFBLG9DQUNOLFFBQVEsUUFBcUIsTUFBTSxhQUFhLEVBQUU7QUFBQSxrQ0FDcEQsRUFBRSxjQUFjLEtBQUs7QUFBQSxrQ0FDckI7QUFBQSxnQ0FDRixFQUFFLE1BQU07QUFBQSw4QkFDVjtBQUFBLDRCQUNGLENBQUM7QUFBQSwwQkFHSDtBQUFBLHdCQUNGO0FBQUEsc0JBQ0Y7QUFFQSwwQkFDRSxNQUFNLGVBQWUsZUFBZSxjQUFjLEtBQUssR0FBRyxVQUFVLFlBQVksTUFDOUUsbUJBQ0YsTUFBTSxlQUFlLGVBQWUsY0FBYyxLQUFLLEdBQUcsVUFBVSxZQUFZLE1BQzlFLGtCQUNGLE1BQU0sZUFBZSxlQUFlLGNBQWMsS0FBSyxHQUFHLFVBQVUsUUFBUSxVQUFVLE1BQU0sSUFDNUY7QUFDQSw4QkFBTSxPQUFPLFNBQVM7QUFBQSwwQkFDcEIsUUFBUTtBQUFBLDRCQUNOLFFBQVEsUUFBcUIsTUFBTSxhQUFhLEVBQUU7QUFBQSwwQkFDcEQsRUFBRSxjQUFjLEtBQUs7QUFBQSwwQkFDckI7QUFBQSx3QkFDRjtBQUVBLDhCQUFNLHFDQUFxQyxLQUFLLGNBQWMsT0FBTztBQUVyRSw0QkFBSSxRQUFRO0FBRVosNERBQW9DLGlCQUFpQixXQUFXLENBQUNBLFdBQVU7QUFDekUsZ0NBQU0sZ0JBQWdCLFNBQVMsUUFBdUJBLFFBQU8sYUFBYTtBQUUxRSw4QkFBSSxjQUFjLFdBQVcsY0FBYyxRQUFRLE9BQU8sY0FBYyxRQUFRLE1BQU07QUFDcEYsa0NBQU0saUJBQWlCLFNBQVM7QUFBQSw4QkFDOUIsU0FBUyxjQUFjLGdDQUFnQztBQUFBLDhCQUN2RDtBQUFBLDRCQUNGO0FBRUEsNERBQWdDLGVBQWUsTUFBTSxhQUFhO0FBRWxFLDJDQUFlLE1BQU0sV0FDbkIsZUFBZSxNQUFNLGFBQWEsVUFBVSxhQUFhO0FBQzNELDJDQUFlLE1BQU0sU0FBUyxlQUFlLE1BQU0sYUFBYSxVQUFVLFNBQVM7QUFDbkYsMkNBQWUsTUFBTSxPQUFPLGVBQWUsTUFBTSxhQUFhLFVBQVUsU0FBUztBQUNqRiwyQ0FBZSxNQUFNLE1BQU0sZUFBZSxNQUFNLGFBQWEsVUFBVSxTQUFTO0FBQ2hGLDJDQUFlLE1BQU0sUUFBUSxlQUFlLE1BQU0sYUFBYSxVQUFVLFNBQVM7QUFDbEYsMkNBQWUsTUFBTSxTQUFTLGVBQWUsTUFBTSxhQUFhLFVBQVUsZ0JBQWdCO0FBQzFGLDJDQUFlLE1BQU0sWUFDbkIsZUFBZSxNQUFNLGFBQWEsVUFBVSx1QkFBdUI7QUFDckUsMkNBQWUsTUFBTSxlQUFlLGVBQWUsTUFBTSxhQUFhLFVBQVUsU0FBUztBQUN6RiwyQ0FBZSxNQUFNLGNBQWMsZUFBZSxNQUFNLGFBQWEsVUFBVSxVQUFVO0FBQ3pGLDJDQUFlLE1BQU0sYUFBYSxlQUFlLE1BQU0sYUFBYSxVQUFVLFdBQVc7QUFDekYsMkNBQWUsTUFBTSxTQUFTLGVBQWUsTUFBTSxhQUFhLFVBQVUsVUFBVTtBQUFBLDBCQUN0RjtBQUdBLDhCQUFJLGNBQWMsVUFBVSxjQUFjLElBQUksWUFBWSxNQUFNLEtBQUs7QUFFbkUsMENBQWMsZUFBZTtBQUM3QiwwQ0FBYyx5QkFBeUI7QUFDdkMsMENBQWMsZ0JBQWdCO0FBRTlCLHNDQUFVLE9BQU87QUFDakIsc0NBQVUsT0FBTztBQUVqQixxQ0FBUztBQUFBLDhCQUNQLFNBQVMsY0FBYywwQkFBMEI7QUFBQSw4QkFDakQ7QUFBQSw0QkFDRixFQUFFO0FBQUEsOEJBQ0E7QUFBQSw4QkFDQSxLQUFLLE1BQU0sT0FBTyxnQkFBZ0IscUJBQXFCLEVBQ3BELElBQUksQ0FBQyxTQUFpQjtBQUNyQix1Q0FBTyxLQUFLLFlBQVksR0FBRyxNQUFNLEtBQUssS0FBSyxVQUFVLEdBQUcsS0FBSyxZQUFZLEdBQUcsQ0FBQyxJQUFJO0FBQUEsOEJBQ25GLENBQUMsRUFDQSxLQUFLLEdBQUc7QUFBQSw0QkFDYjtBQUdBLGdDQUFJLFNBQVMsY0FBYyxRQUFRLE1BQU0sTUFBTTtBQUM3Qyx1Q0FBUyxZQUFZO0FBQUEsNEJBQ3ZCO0FBRUEsb0NBQVEsUUFBMkIsU0FBUyxjQUFjLFFBQVEsQ0FBQyxFQUFFO0FBQUEsOEJBQ25FO0FBQUEsOEJBQ0EsR0FBRyxPQUFPLGdCQUFnQixRQUFRLGVBQWUsTUFBTSxTQUFZLE9BQU8sZ0JBQWdCLFFBQVEsS0FBSyxPQUFPLGdCQUFnQixRQUFRLGVBQWUsQ0FBQyxHQUFHLE9BQU8sZ0JBQWdCLHNCQUFzQixVQUFVLGFBQWEsR0FBRyxXQUFXO0FBQUEsNEJBQzdPO0FBR0Esc0NBQVUsVUFBVTtBQUNwQixzQ0FBVSxhQUFhO0FBQ3ZCLHFDQUFTLE1BQU0sVUFBVTtBQUV6QixrREFBc0IsSUFBSTtBQUMxQixpREFBcUIsU0FBUztBQUc5QixnQ0FBSSxDQUFDLFNBQVNBLE9BQU0sV0FBVyxNQUFNO0FBQ25DLHNDQUFRO0FBRVIsd0NBQVUsU0FBUyxTQUFTLFFBQTBCQSxPQUFNLFFBQVEsZ0JBQWdCO0FBQUEsNEJBQ3RGO0FBQUEsMEJBRUY7QUFBQSx3QkFFRixDQUFDO0FBRUQsNERBQW9DLGlCQUFpQixRQUFRLENBQUNBLFdBQVU7QUFFdEUsOEJBQUksK0JBQStCO0FBQ2pDLGtDQUFNLGlCQUFpQixTQUFTO0FBQUEsOEJBQzlCLFNBQVMsY0FBYyxnQ0FBZ0M7QUFBQSw4QkFDdkQ7QUFBQSw0QkFDRjtBQUVBLDREQUFnQztBQUNoQywyQ0FBZSxNQUFNLFdBQVc7QUFDaEMsMkNBQWUsTUFBTSxTQUFTO0FBQzlCLDJDQUFlLE1BQU0sT0FBTztBQUM1QiwyQ0FBZSxNQUFNLE1BQU07QUFDM0IsMkNBQWUsTUFBTSxRQUFRO0FBQzdCLDJDQUFlLE1BQU0sU0FBUztBQUM5QiwyQ0FBZSxNQUFNLFlBQVk7QUFDakMsMkNBQWUsTUFBTSxlQUFlO0FBQ3BDLDJDQUFlLE1BQU0sY0FBYztBQUNuQywyQ0FBZSxNQUFNLFNBQVM7QUFDOUIsMkNBQWUsTUFBTSxhQUFhO0FBQUEsMEJBQ3BDO0FBRUEsOEJBQUksQ0FBQyx1QkFBdUI7QUFDMUIsc0NBQVUsVUFBVTtBQUNwQixxQ0FBUyxNQUFNLFVBQVU7QUFBQSwwQkFDM0IsT0FBTztBQUNMLHVEQUEyQixNQUFNO0FBQy9CLHdDQUFVLFVBQVU7QUFDcEIsdUNBQVMsTUFBTSxVQUFVO0FBQUEsNEJBQzNCO0FBQUEsMEJBQ0Y7QUFBQSx3QkFDRixDQUFDO0FBQUEsc0JBRUg7QUFBQSxvQkFDRjtBQUFBLGtCQUNGO0FBQUEsZ0JBQ0Y7QUFBQSxjQUNGO0FBQUEsWUFDRixDQUFDO0FBRUQsOEJBQWtCO0FBQUEsY0FDaEIsU0FBUztBQUFBLGdCQUNQLFNBQVMsY0FBYywrQ0FBK0M7QUFBQSxnQkFDdEU7QUFBQSxjQUNGO0FBQUEsY0FDQTtBQUFBLGdCQUNFLFdBQVc7QUFBQSxnQkFDWCxTQUFTO0FBQUEsY0FDWDtBQUFBLFlBQ0Y7QUFFQSxnQkFBSSwyQkFBMkI7QUFDN0I7QUFBQSxZQUNGO0FBRUEsd0NBQTRCO0FBRTVCLGtCQUFNLGtCQUFrQixJQUFJLE1BQW1CO0FBRS9DLGtCQUFNLFdBQVcsSUFBSSxpQkFBaUIsQ0FBQyxlQUFlRyxjQUFhO0FBRWpFLHlCQUFXLFlBQVksZUFBZTtBQUNwQyxvQkFBSSxTQUFTLFNBQVMsYUFBYTtBQUNqQyw2QkFBVyxTQUFTLFNBQVMsWUFBWTtBQUN2QywwQkFBTSxtQkFBbUIsU0FBUyxRQUFxQixPQUFPLFdBQVc7QUFFekUsd0JBQUksaUJBQWlCLFVBQVUsU0FBUyxXQUFXLEdBQUc7QUFFcEQsNEJBQU0sT0FBTyxTQUFTLFFBQXFCLGlCQUFpQixjQUFjLEtBQUssR0FBRyxXQUFXO0FBRTdGLDJCQUFLLGlCQUFpQixXQUFXLENBQUNILFdBQVU7QUFDMUMsNEJBQUlBLE9BQU0sUUFBUSxLQUFLO0FBQ3JCLDhCQUNFQSxPQUFNLFFBQVEsU0FDZCwwQkFDQSx1QkFBdUIsUUFBUSxJQUFJLFFBQVEsb0JBQUksS0FBSyxHQUFFLFFBQVEsR0FDOUQ7QUFDQSw0QkFBQUEsT0FBTSxlQUFlO0FBQ3JCLDRCQUFBQSxPQUFNLHlCQUF5QjtBQUMvQiw0QkFBQUEsT0FBTSxnQkFBZ0I7QUFBQSwwQkFDeEI7QUFBQSx3QkFDRixPQUFPO0FBQ0wsbURBQXlCO0FBQUEsd0JBQzNCO0FBQUEsc0JBQ0YsQ0FBQztBQUtELDRCQUFNLGVBQWUsSUFBSSxpQkFBaUIsQ0FBQ0ssZ0JBQWVGLGNBQWE7QUFDckUsbUNBQVdHLGFBQVlELGdCQUFlO0FBQ3BDLDhCQUFJQyxVQUFTLFNBQVMsYUFBYTtBQUNqQyx1Q0FBV0MsVUFBU0QsVUFBUyxZQUFZO0FBRXZDLGtDQUNFLFNBQVM7QUFBQSxnQ0FDUCxRQUFRO0FBQUEsa0NBQ04sUUFBUSxRQUFxQkMsT0FBTSxhQUFhLEVBQUU7QUFBQSxnQ0FDcEQsRUFBRSxjQUFjLEtBQUs7QUFBQSxnQ0FDckI7QUFBQSw4QkFDRixFQUFFLFVBQVUsWUFBWSxNQUFNLGdCQUM5QjtBQUNBLG9DQUFJLGlCQUFpQixXQUFXO0FBQzlCLHNDQUFJLGlCQUFpQixVQUFVLFNBQVMsYUFBYSxHQUFHO0FBQ3RELHdDQUFJLENBQUMsVUFBVSxTQUFTO0FBQ3RCLGdEQUFVLFVBQVU7QUFBQSxvQ0FDdEI7QUFDQSx3Q0FBSSxTQUFTLE1BQU0sWUFBWSxTQUFTO0FBQ3RDLCtDQUFTLE1BQU0sVUFBVTtBQUFBLG9DQUMzQjtBQUFBLGtDQUNGO0FBQUEsZ0NBQ0Y7QUFBQSw4QkFDRjtBQUVBLCtDQUFpQixpQkFBaUIsUUFBUSxDQUFDUCxXQUFVO0FBQ25ELG9DQUFJLENBQUMsdUJBQXVCO0FBQzFCLDRDQUFVLFVBQVU7QUFDcEIsMkNBQVMsTUFBTSxVQUFVO0FBQUEsZ0NBQzNCLE9BQU87QUFDTCw2REFBMkIsTUFBTTtBQUMvQiw4Q0FBVSxVQUFVO0FBQ3BCLDZDQUFTLE1BQU0sVUFBVTtBQUFBLGtDQUMzQjtBQUFBLGdDQUNGO0FBQUEsOEJBQ0YsQ0FBQztBQUFBLDRCQUVIO0FBQUEsMEJBQ0Y7QUFBQSx3QkFDRjtBQUFBLHNCQUNGLENBQUM7QUFDRCxtQ0FBYSxRQUFRLE1BQU07QUFBQSx3QkFDekIsV0FBVztBQUFBLHNCQUNiLENBQUM7QUFFRCwwQkFBSSxnQkFBZ0IsU0FBUyxJQUFJLEdBQUc7QUFDbEM7QUFBQSxzQkFDRjtBQUVBLHNDQUFnQixLQUFLLElBQUk7QUFFekIsMEJBQ0UsU0FBUztBQUFBLHdCQUNQLFFBQVEsUUFBcUIsS0FBSyxhQUFhLEVBQUUsY0FBYyxLQUFLO0FBQUEsd0JBQ3BFO0FBQUEsc0JBQ0YsRUFBRSxVQUFVLFlBQVksTUFBTSxnQkFDOUI7QUFDQSw4QkFBTSw0QkFBNEIsS0FBSyxjQUFjLE9BQU87QUFFNUQsNEJBQUksOEJBQThCLE1BQU07QUFFdEMsb0RBQTBCLGlCQUFpQixRQUFRLE1BQU07QUFDdkQsZ0NBQUksQ0FBQyx1QkFBdUI7QUFDMUIsd0NBQVUsVUFBVTtBQUNwQix1Q0FBUyxNQUFNLFVBQVU7QUFBQSw0QkFDM0IsT0FBTztBQUNMLHlEQUEyQixNQUFNO0FBQy9CLDBDQUFVLFVBQVU7QUFDcEIseUNBQVMsTUFBTSxVQUFVO0FBQUEsOEJBQzNCO0FBQUEsNEJBQ0Y7QUFBQSwwQkFDRixDQUFDO0FBRUQsb0RBQTBCLGlCQUFpQixXQUFXLENBQUNBLFdBQVU7QUFFL0QsZ0NBQUlBLE9BQU0sUUFBUSxVQUFVO0FBQzFCLDhCQUFBQSxPQUFNLGVBQWU7QUFDckIsOEJBQUFBLE9BQU0sZ0JBQWdCO0FBQ3RCLDhCQUFBQSxPQUFNLHlCQUF5QjtBQUUvQix3Q0FBVSxVQUFVO0FBQ3BCLHVDQUFTLE1BQU0sVUFBVTtBQUV6QjtBQUFBLDRCQUNGO0FBQUEsMEJBRUYsQ0FBQztBQUdELG1DQUFTO0FBQUEsNEJBQ1AsU0FBUyxjQUFjLDBCQUEwQjtBQUFBLDRCQUNqRDtBQUFBLDBCQUNGLEVBQUU7QUFBQSw0QkFDQTtBQUFBLDRCQUNBLEtBQUssTUFBTSxPQUFPLGdCQUFnQixrQkFBa0IsRUFDakQsSUFBSSxDQUFDLFNBQWlCO0FBQ3JCLHFDQUFPLEtBQUssWUFBWSxHQUFHLE1BQU0sS0FBSyxLQUFLLFVBQVUsR0FBRyxLQUFLLFlBQVksR0FBRyxDQUFDLElBQUk7QUFBQSw0QkFDbkYsQ0FBQyxFQUNBLEtBQUssR0FBRztBQUFBLDBCQUNiO0FBRUEsb0NBQVUsT0FBTztBQUNqQixvQ0FBVSxTQUFTO0FBQ25CLG9DQUFVLFVBQVU7QUFFcEIsbUNBQVMsTUFBTSxVQUFVO0FBRXpCLGdEQUFzQixJQUFJO0FBQzFCLCtDQUFxQixTQUFTO0FBQUEsd0JBR2hDO0FBQUEsc0JBQ0Y7QUFFQSxnQ0FBVSxnQkFBZ0IsS0FBSyxDQUFDLGNBQXNCO0FBQ3BELDRCQUFJLGNBQWMsSUFBSTtBQUNwQjtBQUFBLHdCQUNGO0FBRUEsOEJBQU0sY0FBYyxRQUFRO0FBQUEsMEJBQzFCLE9BQU8sZ0JBQ0wsVUFBVSxTQUFTLE9BQU8sdUJBQXVCLHVCQUNuRCxFQUFFLFVBQVUsUUFBUSxPQUFPLEVBQUUsRUFBRSxZQUFZLENBQUMsR0FBRztBQUFBLHdCQUNqRDtBQUVBLDRCQUFJLFlBQVksQ0FBQyxNQUFNLEtBQUs7QUFDMUIsbUNBQVMsWUFBWSxtQkFBbUIsVUFBVSxHQUFHLFdBQVc7QUFBQSx3QkFDbEUsT0FBTztBQUNMLG1DQUFTLFlBQVk7QUFBQTtBQUFBLGdDQUViLFdBQVc7QUFBQSx3QkFDckI7QUFFQSxpQ0FBUyxNQUFNLFVBQVU7QUFBQSxzQkFDM0IsQ0FBQztBQUFBLG9CQUdIO0FBQUEsa0JBQ0Y7QUFBQSxnQkFDRjtBQUFBLGNBQ0Y7QUFBQSxZQUVGLENBQUM7QUFFRCxxQkFBUztBQUFBLGNBQ1AsU0FBUztBQUFBLGdCQUNQLFNBQVMsY0FBYywyQ0FBMkM7QUFBQSxnQkFDbEU7QUFBQSxjQUNGO0FBQUEsY0FDQTtBQUFBLGdCQUNFLFdBQVc7QUFBQSxjQUNiO0FBQUEsWUFDRjtBQUFBLFVBQ0YsQ0FBQztBQUFBLFFBQ0g7QUFBQSxNQUdGLE9BQU87QUFDTCxnQkFBUTtBQUFBLFVBQ047QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7OztBdUJ6dERBLE1BQUFRLDJCQUFpRjtBQVMxRSxNQUFNLGtCQUFrQjtBQXVCeEIsTUFBTSxjQUFOLGNBQTBCLGlDQUFRLFdBQW1DO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQVUxRSxZQUFZLFFBQTRDO0FBRXRELFlBQU0sUUFBUSxJQUFJLE1BQU07QUFDeEIsYUFBTyxnQkFBZ0Isb0JBQW9CLEtBQUssa0JBQWtCLEtBQUssSUFBSTtBQUUzRSxXQUFLLFdBQVcsU0FBUyxjQUFjLEtBQUs7QUFFNUMsV0FBSyxTQUFTLGFBQWEsTUFBTSx3QkFBd0I7QUFDekQsV0FBSyxrQkFBa0I7QUFBQSxJQUN6QjtBQUFBO0FBQUEsSUFFVSxvQkFBMEI7QUFFbEMsWUFBTSxVQUFVLEtBQUssTUFBTSxPQUFPLGdCQUFnQixXQUFXLEVBQUUsSUFBSSxDQUFDLFNBQWlCO0FBQ25GLGVBQU8sS0FBSyxZQUFZLEdBQUcsTUFBTSxLQUFLLEtBQUssVUFBVSxHQUFHLEtBQUssWUFBWSxHQUFHLENBQUMsSUFBSTtBQUFBLE1BQ25GLENBQUM7QUFHRCxZQUFNLFdBQW1CLEtBQUssU0FBUztBQUV2QyxXQUFLLFNBQVMsWUFBWTtBQUcxQixXQUFLLFNBQVMsTUFBTSxhQUFhO0FBQ2pDLFdBQUssU0FBUyxNQUFNLFlBQVk7QUFFaEMsaUJBQVcsaUJBQWlCLFNBQVM7QUFDbkMsY0FBTSxhQUFhLFNBQVMsY0FBYyxPQUFPO0FBQ2pELGNBQU0sV0FBVyxTQUFTLGNBQWMsT0FBTztBQUUvQyxtQkFBVyxhQUFhLE1BQU0sZ0NBQWdDLGFBQWEsRUFBRTtBQUM3RSxtQkFBVyxhQUFhLFFBQVEsVUFBVTtBQUMxQyxtQkFBVyxhQUFhLFNBQVMsYUFBYTtBQUM5QyxtQkFBVyxpQkFBaUIsU0FBUyxDQUFDLFVBQVU7QUFFOUMsNkNBQVUsY0FBYyxFQUFFLEtBQUssS0FBSyxPQUFPLFVBQVUsS0FBSyxTQUFTLEdBQUcsSUFBSTtBQUUxRSxrQkFBUSxRQUFRLE9BQU8sZ0JBQWdCLGFBQWEsYUFBYSxDQUFDLEVBQUUsU0FBUyxTQUFTO0FBQUEsWUFDcEYsTUFBTTtBQUFBLFlBQ047QUFBQSxVQUNGLEVBQUU7QUFBQSxRQUVKLENBQUM7QUFFRCxpQkFBUyxhQUFhLE9BQU8sZ0NBQWdDLGFBQWEsRUFBRTtBQUM1RSxpQkFBUyxZQUFZLEdBQUcsYUFBYTtBQUVyQyxhQUFLLFNBQVMsWUFBWSxVQUFVO0FBQ3BDLGFBQUssU0FBUyxZQUFZLFFBQVE7QUFBQSxNQUNwQztBQUVBLFdBQUssU0FBUyxRQUFRO0FBQUEsSUFDeEI7QUFBQTtBQUFBLElBRVMsYUFBcUI7QUFDNUIsaUJBQU8sNEJBQUUsS0FBSyxRQUFRO0FBQUEsSUFDeEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBS1MsV0FBbUI7QUFDMUIsWUFBTSxTQUFtQixDQUFDO0FBQzFCLGlCQUFXLFdBQVcsS0FBSyxTQUFTLGlCQUFpQixPQUFPLEdBQUc7QUFDN0QsWUFBSSxRQUFRLFNBQVM7QUFDbkIsaUJBQU8sS0FBSyxRQUFRLEtBQUs7QUFBQSxRQUMzQjtBQUFBLE1BQ0Y7QUFFQSxhQUFPLE9BQU8sS0FBSztBQUFBLElBQ3JCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUtTLFNBQVMsTUFBcUI7QUFFckMsaUJBQVcsV0FBVyxLQUFLLFNBQVMsaUJBQWlCLE9BQU8sR0FBRztBQUM3RCxnQkFBUSxVQUFVO0FBQUEsTUFDcEI7QUFHQSxpQkFBVyxVQUFVLE9BQU8sZ0JBQWdCLGNBQWM7QUFDeEQsZ0JBQVEsUUFBUSxPQUFPLGdCQUFnQixhQUFhLE1BQU0sQ0FBQyxFQUFFLFNBQVM7QUFBQSxNQUN4RTtBQUdBLGlCQUFXLFlBQVksWUFBWSxJQUFJLEVBQUUsTUFBTSxHQUFHLEdBQUc7QUFDbkQsY0FBTSxVQUFVLEtBQUssU0FBUyxjQUFjLFdBQVcsU0FBUyxLQUFLLENBQUMsSUFBSTtBQUUxRSxZQUFJLG1CQUFtQixrQkFBa0I7QUFDdkMsa0JBQVEsVUFBVTtBQUFBLFFBQ3BCO0FBRUEsWUFBSSxPQUFPLGdCQUFnQixhQUFhLFFBQVEsR0FBRztBQUNqRCxrQkFBUSxRQUFRLE9BQU8sZ0JBQWdCLGFBQWEsUUFBUSxDQUFDLEVBQUUsU0FBUztBQUFBLFFBQzFFO0FBQUEsTUFFRjtBQUFBLElBRUY7QUFBQSxFQUNGOzs7QXhCeklPLFdBQVMseUJBQStCO0FBQzdDLHVEQUFxQixpQkFBaUIsV0FBVztBQUNqRCw0QkFBd0I7QUFBQSxFQUMxQjs7O0F5QlZBLE1BQUFDLDJCQUEyQzs7O0FDRXBDLE1BQU0sc0JBQXNCO0FBQUEsSUFDakMsV0FBVztBQUFBLElBQ1gsYUFBYTtBQUFBLEVBQ2Y7OztBQ0hPLE1BQU0sWUFBWTtBQUFBLElBQ3ZCLG9DQUFvQztBQUFBLElBQ3BDLGlDQUFpQztBQUFBLElBQ2pDLHNDQUFzQztBQUFBLElBQ3RDLHFDQUFxQztBQUFBLElBQ3JDLDZDQUE2QztBQUFBLElBQzdDLGtDQUFrQztBQUFBLElBQ2xDLDBDQUEwQztBQUFBLElBQzFDLCtCQUErQjtBQUFBLElBQy9CLHVDQUF1QztBQUFBLElBQ3ZDLG9DQUFvQztBQUFBLElBQ3BDLHVDQUF1QztBQUFBLElBQ3ZDLGtDQUFrQztBQUFBLElBQ2xDLDRCQUE0QjtBQUFBLElBQzVCLGNBQWM7QUFBQSxJQUNkLHNCQUFzQjtBQUFBLElBQ3RCLHdCQUF3QjtBQUFBLElBQ3hCLDhDQUE4QztBQUFBLElBQzlDLDJCQUEyQjtBQUFBLElBQzNCLDhCQUE4QjtBQUFBLElBQzlCLG9DQUFvQztBQUFBLElBQ3BDLGlDQUFpQztBQUFBLEVBQ25DOzs7QUN0Qk8sTUFBTSxXQUFXO0FBQUEsSUFDdEIsTUFBTTtBQUFBLE1BQ0osb0NBQW9DO0FBQUEsTUFDcEMsaUNBQWlDO0FBQUEsTUFDakMscUNBQXFDO0FBQUEsTUFDckMsb0RBQW9EO0FBQUEsTUFDcEQsc0RBQXNEO0FBQUEsTUFDdEQsa0NBQWtDO0FBQUEsTUFDbEMsK0JBQStCO0FBQUEsTUFDL0Isb0JBQW9CO0FBQUEsTUFDcEIsc0NBQXNDO0FBQUEsTUFDdEMsc0NBQXNDO0FBQUEsTUFDdEMseUNBQXlDO0FBQUEsTUFDekMseUNBQXlDO0FBQUEsTUFDekMsb0NBQW9DO0FBQUEsTUFDcEMsb0NBQW9DO0FBQUEsTUFDcEMsOEJBQThCO0FBQUEsTUFDOUIsOEJBQThCO0FBQUEsSUFDaEM7QUFBQSxJQUNBLE1BQU07QUFBQSxNQUNKLG9DQUFvQztBQUFBLE1BQ3BDLGlDQUFpQztBQUFBLE1BQ2pDLHFDQUFxQztBQUFBLE1BQ3JDLG9EQUFvRDtBQUFBLE1BQ3BELHNEQUFzRDtBQUFBLE1BQ3RELGtDQUFrQztBQUFBLE1BQ2xDLCtCQUErQjtBQUFBLE1BQy9CLG9CQUFvQjtBQUFBLE1BQ3BCLHNDQUFzQztBQUFBLE1BQ3RDLHNDQUFzQztBQUFBLE1BQ3RDLHlDQUF5QztBQUFBLE1BQ3pDLHlDQUF5QztBQUFBLE1BQ3pDLG9DQUFvQztBQUFBLE1BQ3BDLG9DQUFvQztBQUFBLE1BQ3BDLDhCQUE4QjtBQUFBLE1BQzlCLDhCQUE4QjtBQUFBLElBQ2hDO0FBQUEsRUFDRjs7O0FDNUJBLFdBQVMsVUFBVSxNQUF5QjtBQUMxQyxXQUFPLFFBQVEsV0FBWSxPQUFxQjtBQUFBLEVBQ2xEO0FBc0JPLFdBQVMsY0FBYyxNQUFjLEtBQTBCO0FBQ3BFLFVBQU0sYUFBYSxVQUFVLElBQUk7QUFDakMsVUFBTSxXQUFXLFNBQVMsVUFBVTtBQUNwQyxXQUFPLFNBQVMsR0FBRyxLQUFLLElBQUksR0FBRztBQUFBLEVBQ2pDOzs7QUN4Q0EsTUFBQUMsMkJBQTRCO0FBV3JCLFdBQVMsS0FBSyxLQUEwQjtBQUM3QyxXQUFPLGtCQUFjLHNDQUFZLEdBQUcsR0FBRztBQUFBLEVBQ3pDOzs7QUxKTyxXQUFTLCtCQUFxQztBQUNuRDtBQUFBLE1BQ0U7QUFBQSxRQUNFLElBQUksVUFBVSwrQkFBK0I7QUFBQSxRQUM3QyxPQUFPLEtBQUssK0JBQStCO0FBQUEsUUFDM0MsTUFBTSxFQUFFLE1BQU0sT0FBTyxLQUFLLFVBQVUsb0NBQW9DLEVBQUU7QUFBQSxNQUM1RTtBQUFBLE1BQ0EsQ0FBQyxTQUFTLFdBQVcsTUFBTSxDQUFDLFFBQVEsSUFBSSxPQUFPLFNBQVMsS0FBSztBQUFBLElBQy9EO0FBQUEsRUFDRjs7O0FNbEJBLE1BQUFDLDJCQUlPO0FBTVAsTUFBTSxtQkFHRjtBQUFBLElBQ0YsY0FBYyxDQUFDLFVBQVUsZ0NBQWdDLENBQUM7QUFBQSxJQUMxRCxNQUFNLENBQUMsV0FBVyxhQUFhLE9BQU8sT0FBTyxVQUFVLGdDQUFnQyxDQUFDLENBQUM7QUFBQSxFQUMzRjtBQUVPLFdBQVMsK0JBQXFDO0FBRW5ELDZEQUEyQjtBQUFBLE1BQ3pCLFFBQVE7QUFBQSxNQUNSLEtBQUssVUFBVSwrQkFBK0I7QUFBQSxNQUM5QyxVQUFVLFVBQVUsZ0NBQWdDO0FBQUEsTUFDcEQsT0FBTyxLQUFLLGdDQUFnQztBQUFBLElBQzlDLENBQUM7QUFFRCw2REFBMkI7QUFBQSxNQUN6QixRQUFRO0FBQUEsTUFDUixLQUFLLFVBQVUsK0JBQStCO0FBQUEsTUFDOUMsVUFBVSxVQUFVLG1DQUFtQztBQUFBLE1BQ3ZELE9BQU8sS0FBSyxtQ0FBbUM7QUFBQSxNQUMvQyxTQUFTLGFBQWEsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLHdCQUF3QjtBQUFBLFFBQ3RFLE1BQU0sS0FBSyw0Q0FBNEMsa0JBQWtCLEVBQUU7QUFBQSxRQUMzRSxPQUFPO0FBQUEsTUFDVCxFQUFFO0FBQUEsTUFDRixhQUFhO0FBQUEsSUFDZixDQUFDO0FBRUQsNkRBQTJCO0FBQUEsTUFDekIsUUFBUTtBQUFBLE1BQ1IsS0FBSyxVQUFVLCtCQUErQjtBQUFBLE1BQzlDLFVBQVUsVUFBVSw2QkFBNkI7QUFBQSxNQUNqRCxPQUFPLEtBQUssNkJBQTZCO0FBQUEsTUFDekMsYUFBYTtBQUFBLElBQ2YsQ0FBQztBQUFBLEVBQ0g7OztBQ3pDQSwrQkFBNkI7QUFDN0IsK0JBQTZCO0FBQzdCLHlCQUF1QjsiLAogICJuYW1lcyI6IFsiaW1wb3J0X2ZjX2Zvcm1fZGVzaWduZXIiLCAiaW1wb3J0X2ZjX2Zvcm1fZGVzaWduZXIiLCAiZmlsdGVyIiwgIm1hcCIsICJfIiwgImZpcnN0IiwgIm1hcCIsICJmb3JtZXIiLCAiZmlsdGVyIiwgInByZXZpb3VzRWxlbWVudFNpYmxpbmciLCAibmV4dEVsZW1lbnRTaWJsaW5nIiwgImZpbHRlciIsICJkZXNjcmlwdGlvbiIsICIkIiwgInJlc3BvbnNlIiwgImV2ZW50IiwgImdsb2JhbCIsICJiYXNlRG9jVVJMIiwgIm9ic2VydmVyIiwgImZ1bmN0aW9uYWxpdHkiLCAibXV0YXRpb25zTGlzdCIsICJtdXRhdGlvbiIsICJhZGRlZCIsICJpbXBvcnRfZmNfZm9ybV9kZXNpZ25lciIsICJpbXBvcnRfZmNfZm9ybV9kZXNpZ25lciIsICJpbXBvcnRfZmNfZm9ybV9kZXNpZ25lciIsICJpbXBvcnRfZmNfZm9ybV9kZXNpZ25lciJdCn0K
