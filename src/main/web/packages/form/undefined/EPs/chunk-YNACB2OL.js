var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) =>
  function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === "object") || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (
  (target = mod != null ? __create(__getProtoOf(mod)) : {}),
  __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod,
  )
);
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i])) result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
var __decorateParam = (index, decorator) => (target, key) => decorator(target, key, index);

// ../../node_modules/xdbc/src/DBC.ts
var DBC = class _DBC {
  // #region Internal caches.
  static dbcCache = /* @__PURE__ */ new Map();
  static pathTokenCache = /* @__PURE__ */ new Map();
  static getHost() {
    return typeof window !== "undefined" ? window : globalThis;
  }
  static getDBC(dbc) {
    const path = dbc ?? "WaXCode.DBC";
    if (_DBC.dbcCache.has(path)) {
      return _DBC.dbcCache.get(path);
    }
    const resolved = _DBC.resolveDBCPath(_DBC.getHost(), path);
    if (resolved) {
      _DBC.dbcCache.set(path, resolved);
    }
    return resolved;
  }
  // #endregion Internal caches.
  // #region Parameter-value requests.
  /** Stores all request for parameter values registered by {@link decPrecondition }. */
  static paramValueRequests = /* @__PURE__ */ new Map();
  /**
   * Generate a unique key for storing parameter value requests.
   * Format: "ClassName:methodName"
   */
  static getRequestKey(target, methodName) {
    const className = typeof target === "function" ? target.name : target.constructor?.name || "Unknown";
    return `${className}:${String(methodName)}`;
  }
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
    const key = _DBC.getRequestKey(target, methodName);
    if (_DBC.paramValueRequests.has(key)) {
      if (_DBC.paramValueRequests.get(key).has(index)) {
        _DBC.paramValueRequests.get(key).get(index).push(receptor);
      } else {
        _DBC.paramValueRequests.get(key).set(index, new Array(receptor));
      }
    } else {
      _DBC.paramValueRequests.set(key, /* @__PURE__ */ new Map([[index, new Array(receptor)]]));
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
    const isStatic = typeof target === "function";
    descriptor.value = function (...args) {
      const actualTarget = isStatic ? this : this.constructor;
      const key = _DBC.getRequestKey(actualTarget, propertyKey);
      if (_DBC.paramValueRequests.has(key)) {
        for (const index of _DBC.paramValueRequests.get(key).keys()) {
          if (index < args.length) {
            for (const receptor of _DBC.paramValueRequests.get(key).get(index)) {
              receptor(args[index]);
            }
          }
        }
      } else {
        console.warn("No parameter value requests found for key:", key);
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
      if (!_DBC.getDBC(dbc).executionSettings.checkInvariants) {
        return;
      }
      const originalSetter = descriptor.set;
      const originalGetter = descriptor.get;
      let value;
      Object.defineProperty(target, propertyKey, {
        get() {
          if (!_DBC.getDBC(dbc).executionSettings.checkInvariants) {
            return;
          }
          const realValue = path ? _DBC.resolve(this, path) : this;
          for (const contract of contracts) {
            const result = contract.check(realValue);
            if (typeof result === "string") {
              _DBC.getDBC(dbc).reportFieldInfringement(result, target, path, propertyKey, realValue);
            }
          }
          return originalGetter[propertyKey];
        },
        set(newValue) {
          if (!_DBC.getDBC(dbc).executionSettings.checkInvariants) {
            return;
          }
          const realValue = path ? _DBC.resolve(this, path) : this;
          for (const contract of contracts) {
            const result = contract.check(realValue);
            if (typeof result === "string") {
              _DBC.getDBC(dbc).reportFieldInfringement(result, target, path, propertyKey, realValue);
            }
          }
          value = newValue;
        },
        enumerable: true,
        configurable: true,
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
  static decInvariant(contracts, path = void 0, dbc = void 0, hint = void 0) {
    return (target, propertyKey) => {
      if (!_DBC.getDBC(dbc).executionSettings.checkInvariants) {
        return;
      }
      let value;
      Object.defineProperty(target, propertyKey, {
        set(newValue) {
          if (!_DBC.getDBC(dbc).executionSettings.checkInvariants) {
            return;
          }
          const realValue = path ? _DBC.resolve(newValue, path) : newValue;
          for (const contract of contracts) {
            const result = contract.check(realValue);
            if (typeof result === "string") {
              _DBC.getDBC(dbc).reportFieldInfringement(result, target, path, propertyKey, realValue, hint);
            }
          }
          value = newValue;
        },
        enumerable: true,
        configurable: true,
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
  static decPostcondition(check, dbc = void 0, path = void 0, hint = void 0) {
    return (target, propertyKey, descriptor) => {
      const originalMethod = descriptor.value;
      descriptor.value = (...args) => {
        if (!_DBC.getDBC(dbc).executionSettings.checkPostconditions) {
          return;
        }
        const result = originalMethod.apply(this, args);
        const realValue = path ? _DBC.resolve(result, path) : result;
        const checkResult = check(realValue, target, propertyKey);
        if (typeof checkResult === "string") {
          _DBC.getDBC(dbc).reportReturnvalueInfringement(checkResult, target, path, propertyKey, realValue, hint);
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
   * 				May contain :: to separate multiple paths.
   *
   * @returns The **(target: object, methodName: string | symbol, parameterIndex: number ) => void** invoked by Typescript- */
  static decPrecondition(check, dbc = void 0, path = void 0, hint = void 0) {
    const paths = path ? path.replace(/ /g, "").split("::") : [void 0];
    return (target, methodName, parameterIndex) => {
      _DBC.requestParamValue(target, methodName, parameterIndex, (value) => {
        if (!_DBC.getDBC(dbc).executionSettings.checkPreconditions) {
          return;
        }
        for (const singlePath of paths) {
          const realValue = singlePath ? _DBC.resolve(value, singlePath) : value;
          const result = check(realValue, target, methodName, parameterIndex);
          if (typeof result === "string") {
            _DBC
              .getDBC(dbc)
              .reportParameterInfringement(result, target, singlePath, methodName, parameterIndex, realValue, hint);
          }
        }
      });
    };
  }
  // #endregion Precondition
  // #endregion Decorator
  // #region Execution Handling
  /** Stores settings concerning the execution of checks. */
  executionSettings = {
    checkPreconditions: true,
    checkPostconditions: true,
    checkInvariants: true,
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
  reportInfringement(message, violator, target, value, path, hint = void 0) {
    const finalMessage = `[ From "${violator}"${typeof target === "function" ? ` in "${target.name}"` : typeof target === "object" && target !== null && typeof target.constructor === "function" ? ` in "${target.constructor.name}"` : `in "${target}"`}${path ? ` > "${path}"` : ""}: ${message} ${hint ? `\u2728 ${hint} \u2728` : ""}]`;
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
  reportParameterInfringement(message, target, path, method, index, value, hint = void 0) {
    const properIndex = index + 1;
    this.reportInfringement(
      `[ Parameter-value "${value}" of the ${properIndex}${properIndex === 1 ? "st" : properIndex === 2 ? "nd" : properIndex === 3 ? "rd" : "th"} parameter did not fulfill one of it's contracts: ${message} ]`,
      method,
      target,
      value,
      path,
      hint,
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
  reportFieldInfringement(message, target, path, key, value, hint = void 0) {
    this.reportInfringement(
      `[ New value for "${key}"${path === void 0 ? "" : `.${path}`} with value "${value}" did not fulfill one of it's contracts: ${message} ]`,
      key,
      target,
      value,
      path,
    );
  }
  /**
   * Reports a returnvalue-infringement according via {@link reportInfringement } also generating a proper {@link string }-wrapper
   * for the given "message","method" & value.
   *
   * @param message	The {@link string } describing the infringement and it's provenience.
   * @param method 	The {@link string } describing or naming the violator.
   * @param value		The parameter's value. */
  reportReturnvalueInfringement(message, target, path, method, value, hint = void 0) {
    this.reportInfringement(
      `[ Return-value "${value}" did not fulfill one of it's contracts: ${message} ]`,
      method,
      target,
      value,
      path,
      hint,
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
  constructor(
    infringementSettings = { throwException: true, logToConsole: false },
    executionSettings = {
      checkPreconditions: true,
      checkPostconditions: true,
      checkInvariants: true,
    },
  ) {
    this.infringementSettings = infringementSettings;
    if (_DBC.getHost().WaXCode === void 0) _DBC.getHost().WaXCode = {};
    _DBC.getHost().WaXCode.DBC = this;
    _DBC.dbcCache.set("WaXCode.DBC", this);
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
    const cachedParts = _DBC.pathTokenCache.get(path);
    const parts = cachedParts ?? path.replace(/\[(['"]?)(.*?)\1\]/g, ".$2").split(".");
    if (!cachedParts) {
      _DBC.pathTokenCache.set(path, parts);
    }
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
        if (
          typeof window !== "undefined" &&
          typeof HTMLElement !== "undefined" &&
          current instanceof HTMLElement &&
          part.startsWith("@")
        ) {
          current = current.getAttribute(part.slice(1));
        } else if (typeof current === "object" && current !== null && part in current) {
          current = current[part];
        } else if (
          typeof window !== "undefined" &&
          typeof HTMLElement !== "undefined" &&
          current instanceof HTMLElement
        ) {
          current = void 0;
        } else {
          current = void 0;
        }
      }
    }
    return current;
  }
};
new DBC();

export { __commonJS, __toESM, __decorateClass, __decorateParam, DBC };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3hkYmMvc3JjL0RCQy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXHJcbiAqIFByb3ZpZGVzIGEgKipEKiplc2lnbiAqKkIqKnkgKipDKipvbnRyYWN0IEZyYW1ld29yayB1c2luZyBkZWNvcmF0b3JzLlxyXG4gKlxyXG4gKiBAcmVtYXJrc1xyXG4gKiBNYWludGFpbmVyOiBDYWxsYXJpLCBTYWx2YXRvcmUgKFhEQkNAV2FYQ29kZS5uZXQpICovXHJcbmV4cG9ydCBjbGFzcyBEQkMge1xyXG5cdC8vICNyZWdpb24gSW50ZXJuYWwgY2FjaGVzLlxyXG5cdHByaXZhdGUgc3RhdGljIGRiY0NhY2hlOiBNYXA8c3RyaW5nLCBEQkM+ID0gbmV3IE1hcCgpO1xyXG5cdHByaXZhdGUgc3RhdGljIHBhdGhUb2tlbkNhY2hlOiBNYXA8c3RyaW5nLCBzdHJpbmdbXT4gPSBuZXcgTWFwKCk7XHJcblx0cHJpdmF0ZSBzdGF0aWMgZ2V0SG9zdCgpOiB1bmtub3duIHtcclxuXHRcdHJldHVybiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDogZ2xvYmFsVGhpcztcclxuXHR9XHJcblx0cHJpdmF0ZSBzdGF0aWMgZ2V0REJDKGRiYzogc3RyaW5nIHwgdW5kZWZpbmVkKTogREJDIHtcclxuXHRcdGNvbnN0IHBhdGggPSBkYmMgPz8gXCJXYVhDb2RlLkRCQ1wiO1xyXG5cdFx0aWYgKERCQy5kYmNDYWNoZS5oYXMocGF0aCkpIHtcclxuXHRcdFx0cmV0dXJuIERCQy5kYmNDYWNoZS5nZXQocGF0aCk7XHJcblx0XHR9XHJcblx0XHRjb25zdCByZXNvbHZlZCA9IERCQy5yZXNvbHZlREJDUGF0aChEQkMuZ2V0SG9zdCgpLCBwYXRoKTtcclxuXHRcdGlmIChyZXNvbHZlZCkge1xyXG5cdFx0XHREQkMuZGJjQ2FjaGUuc2V0KHBhdGgsIHJlc29sdmVkKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiByZXNvbHZlZDtcclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBJbnRlcm5hbCBjYWNoZXMuXHJcblx0Ly8gI3JlZ2lvbiBQYXJhbWV0ZXItdmFsdWUgcmVxdWVzdHMuXHJcblx0LyoqIFN0b3JlcyBhbGwgcmVxdWVzdCBmb3IgcGFyYW1ldGVyIHZhbHVlcyByZWdpc3RlcmVkIGJ5IHtAbGluayBkZWNQcmVjb25kaXRpb24gfS4gKi9cclxuXHRzdGF0aWMgcGFyYW1WYWx1ZVJlcXVlc3RzOiBNYXA8XHJcblx0XHRzdHJpbmcsXHJcblx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IEdvdHRhIGJlIGFueSBzaW5jZSBwYXJhbWV0ZXItdmFsdWVzIG1heSBiZSB1bmRlZmluZWQuXHJcblx0XHRNYXA8bnVtYmVyLCBBcnJheTwodmFsdWU6IGFueSkgPT4gdW5kZWZpbmVkPj5cclxuXHQ+ID0gbmV3IE1hcDxcclxuXHRcdHN0cmluZyxcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogR290dGEgYmUgYW55IHNpbmNlIHBhcmFtZXRlci12YWx1ZXMgbWF5IGJlIHVuZGVmaW5lZC5cclxuXHRcdE1hcDxudW1iZXIsIEFycmF5PCh2YWx1ZTogYW55KSA9PiB1bmRlZmluZWQ+PlxyXG5cdD4oKTtcclxuXHQvKipcclxuXHQgKiBHZW5lcmF0ZSBhIHVuaXF1ZSBrZXkgZm9yIHN0b3JpbmcgcGFyYW1ldGVyIHZhbHVlIHJlcXVlc3RzLlxyXG5cdCAqIEZvcm1hdDogXCJDbGFzc05hbWU6bWV0aG9kTmFtZVwiXHJcblx0ICovXHJcblx0cHJpdmF0ZSBzdGF0aWMgZ2V0UmVxdWVzdEtleSh0YXJnZXQ6IG9iamVjdCwgbWV0aG9kTmFtZTogc3RyaW5nIHwgc3ltYm9sKTogc3RyaW5nIHtcclxuXHRcdGNvbnN0IGNsYXNzTmFtZSA9IHR5cGVvZiB0YXJnZXQgPT09ICdmdW5jdGlvbicgPyB0YXJnZXQubmFtZSA6IHRhcmdldC5jb25zdHJ1Y3Rvcj8ubmFtZSB8fCAnVW5rbm93bic7XHJcblx0XHRyZXR1cm4gYCR7Y2xhc3NOYW1lfToke1N0cmluZyhtZXRob2ROYW1lKX1gO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBNYWtlIGEgcmVxdWVzdCB0byBnZXQgdGhlIHZhbHVlIG9mIGEgY2VydGFpbiBwYXJhbWV0ZXIgb2Ygc3BlY2lmaWMgbWV0aG9kIGluIGEgc3BlY2lmaWMge0BsaW5rIG9iamVjdCB9LlxyXG5cdCAqIFRoYXQgcmVxdWVzdCBnZXRzIGVubGlzdGVkIGluIHtAbGluayBwYXJhbVZhbHVlUmVxdWVzdHMgfSB3aGljaCBpcyB1c2VkIGJ5IHtAbGluayBQYXJhbXZhbHVlUHJvdmlkZXJ9IHRvIGludm9rZSB0aGVcclxuXHQgKiBnaXZlbiBcInJlY2VwdG9yXCIgd2l0aCB0aGUgcGFyYW1ldGVyIHZhbHVlIHN0b3JlZCBpbiB0aGVyZS4gVGh1cyBhIHBhcmFtZXRlciBkZWNvcmF0b3IgdXNpbmcgdGhpcyBtZXRob2Qgd2lsbFxyXG5cdCAqIG5vdCByZWNlaXZlIGFueSB2YWx1ZSBvZiB0aGUgdG9wIG1ldGhvZCBpcyBub3QgdGFnZ2VkIHdpdGgge0BsaW5rIFBhcmFtdmFsdWVQcm92aWRlcn0uXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdGFyZ2V0XHRcdFRoZSB7QGxpbmsgb2JqZWN0IH0gY29udGFpbmluZyB0aGUgbWV0aG9kIHdpdGggdGhlIHBhcmFtZXRlciB3aGljaCdzIHZhbHVlIGlzIHJlcXVlc3RlZC5cclxuXHQgKiBAcGFyYW0gbWV0aG9kTmFtZVx0VGhlIG5hbWUgb2YgdGhlIG1ldGhvZCB3aXRoIHRoZSBwYXJhbWV0ZXIgd2hpY2gncyB2YWx1ZSBpcyByZXF1ZXN0ZWQuXHJcblx0ICogQHBhcmFtIGluZGV4XHRcdFx0VGhlIGluZGV4IG9mIHRoZSBwYXJhbWV0ZXIgd2hpY2gncyB2YWx1ZSBpcyByZXF1ZXN0ZWQuXHJcblx0ICogQHBhcmFtIHJlY2VwdG9yXHRcdFRoZSBtZXRob2QgdGhlIHJlcXVlc3RlZCBwYXJhbWV0ZXItdmFsdWUgc2hhbGwgYmUgcGFzc2VkIHRvIHdoZW4gaXQgYmVjb21lcyBhdmFpbGFibGUuICovXHJcblx0cHJvdGVjdGVkIHN0YXRpYyByZXF1ZXN0UGFyYW1WYWx1ZShcclxuXHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0bWV0aG9kTmFtZTogc3RyaW5nIHwgc3ltYm9sLFxyXG5cdFx0aW5kZXg6IG51bWJlcixcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogR290dGEgYmUgYW55IHNpbmNlIHBhcmFtZXRlci12YWx1ZXMgbWF5IGJlIHVuZGVmaW5lZC5cclxuXHRcdHJlY2VwdG9yOiAodmFsdWU6IGFueSkgPT4gdW5kZWZpbmVkLFxyXG5cdCk6IHVuZGVmaW5lZCB7XHJcblx0XHRjb25zdCBrZXkgPSBEQkMuZ2V0UmVxdWVzdEtleSh0YXJnZXQsIG1ldGhvZE5hbWUpO1xyXG5cclxuXHRcdGlmIChEQkMucGFyYW1WYWx1ZVJlcXVlc3RzLmhhcyhrZXkpKSB7XHJcblx0XHRcdGlmIChEQkMucGFyYW1WYWx1ZVJlcXVlc3RzLmdldChrZXkpLmhhcyhpbmRleCkpIHtcclxuXHRcdFx0XHREQkMucGFyYW1WYWx1ZVJlcXVlc3RzLmdldChrZXkpLmdldChpbmRleCkucHVzaChyZWNlcHRvcik7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0REJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5nZXQoa2V5KS5zZXQoaW5kZXgsIG5ldyBBcnJheTwodmFsdWU6IHVua25vd24pID0+IHVuZGVmaW5lZD4ocmVjZXB0b3IpKTtcclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0REJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5zZXQoXHJcblx0XHRcdFx0a2V5LFxyXG5cdFx0XHRcdG5ldyBNYXA8bnVtYmVyLCBBcnJheTwodmFsdWU6IHVua25vd24pID0+IHVuZGVmaW5lZD4+KFtcclxuXHRcdFx0XHRcdFtpbmRleCwgbmV3IEFycmF5PCh2YWx1ZTogdW5rbm93bikgPT4gdW5kZWZpbmVkPihyZWNlcHRvcildLFxyXG5cdFx0XHRcdF0pLFxyXG5cdFx0XHQpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB1bmRlZmluZWQ7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IGNoZWNraW5nIHRoZSB7QGxpbmsgcGFyYW1WYWx1ZVJlcXVlc3RzIH0gZm9yIHZhbHVlLXJlcXVlc3RzIG9mIHRoZSBtZXRob2QncyBwYXJhbWV0ZXIgdGh1c1xyXG5cdCAqIGFsc28gdXNhYmxlIG9uIHNldHRlcnMuXHJcblx0ICogV2hlbiBmb3VuZCBpdCB3aWxsIGludm9rZSB0aGUgXCJyZWNlcHRvclwiIHJlZ2lzdGVyZWQgdGhlcmUsIGludGVyIGFsaWEgYnkge0BsaW5rIHJlcXVlc3RQYXJhbVZhbHVlIH0sIHdpdGggdGhlXHJcblx0ICogcGFyYW1ldGVyJ3MgdmFsdWUuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdGFyZ2V0IFx0XHRUaGUge0BsaW5rIG9iamVjdCB9IGhvc3RpbmcgdGhlIHRhZ2dlZCBtZXRob2QgYXMgcHJvdmlkZWQgYnkgdGhlIHJ1bnRpbWUuXHJcblx0ICogQHBhcmFtIHByb3BlcnR5S2V5IFx0VGhlIHRhZ2dlZCBtZXRob2QncyBuYW1lIGFzIHByb3ZpZGVkIGJ5IHRoZSBydW50aW1lLlxyXG5cdCAqIEBwYXJhbSBkZXNjcmlwdG9yIFx0VGhlIHtAbGluayBQcm9wZXJ0eURlc2NyaXB0b3IgfSBhcyBwcm92aWRlZCBieSB0aGUgcnVudGltZS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFRoZSB7QGxpbmsgUHJvcGVydHlEZXNjcmlwdG9yIH0gdGhhdCB3YXMgcGFzc2VkIGJ5IHRoZSBydW50aW1lLiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgUGFyYW12YWx1ZVByb3ZpZGVyKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRwcm9wZXJ0eUtleTogc3RyaW5nLFxyXG5cdFx0ZGVzY3JpcHRvcjogUHJvcGVydHlEZXNjcmlwdG9yLFxyXG5cdCk6IFByb3BlcnR5RGVzY3JpcHRvciB7XHJcblx0XHRjb25zdCBvcmlnaW5hbE1ldGhvZCA9IGRlc2NyaXB0b3IudmFsdWU7XHJcblx0XHRjb25zdCBpc1N0YXRpYyA9IHR5cGVvZiB0YXJnZXQgPT09ICdmdW5jdGlvbic7XHJcblx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IEdvdHRhIGJlIGFueSBzaW5jZSBwYXJhbWV0ZXItdmFsdWVzIG1heSBiZSB1bmRlZmluZWQuXHJcblx0XHRkZXNjcmlwdG9yLnZhbHVlID0gZnVuY3Rpb24gKC4uLmFyZ3M6IGFueVtdKSB7XHJcblx0XHRcdC8vICNyZWdpb24gICBDaGVjayBpZiBhIHZhbHVlIG9mIG9uZSBvZiB0aGUgbWV0aG9kJ3MgcGFyYW1ldGVyIGhhcyBiZWVuIHJlcXVlc3RlZCBhbmQgcGFzcyBpdCB0byB0aGVcclxuXHRcdFx0Ly8gICAgICAgICAgIHJlY2VwdG9yLCBpZiBzby5cclxuXHRcdFx0Y29uc3QgYWN0dWFsVGFyZ2V0ID0gaXNTdGF0aWMgPyB0aGlzIDogKHRoaXMgYXMgYW55KS5jb25zdHJ1Y3RvcjtcclxuXHRcdFx0Y29uc3Qga2V5ID0gREJDLmdldFJlcXVlc3RLZXkoYWN0dWFsVGFyZ2V0LCBwcm9wZXJ0eUtleSk7XHJcblxyXG5cdFx0XHRpZiAoREJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5oYXMoa2V5KSkge1xyXG5cdFx0XHRcdGZvciAoY29uc3QgaW5kZXggb2YgREJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5nZXQoa2V5KS5rZXlzKCkpIHtcclxuXHRcdFx0XHRcdGlmIChpbmRleCA8IGFyZ3MubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHRcdGZvciAoY29uc3QgcmVjZXB0b3Igb2YgREJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5nZXQoa2V5KS5nZXQoaW5kZXgpKSB7XHJcblx0XHRcdFx0XHRcdFx0cmVjZXB0b3IoYXJnc1tpbmRleF0pO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGNvbnNvbGUud2FybihcIk5vIHBhcmFtZXRlciB2YWx1ZSByZXF1ZXN0cyBmb3VuZCBmb3Iga2V5OlwiLCBrZXkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vICNlbmRyZWdpb25cdENoZWNrIGlmIGEgdmFsdWUgb2Ygb25lIG9mIHRoZSBtZXRob2QncyBwYXJhbWV0ZXIgaGFzIGJlZW4gcmVxdWVzdGVkIGFuZCBwYXNzIGl0IHRvIHRoZVxyXG5cdFx0XHQvLyAgICAgICAgICAgICAgcmVjZXB0b3IsIGlmIHNvLlxyXG5cdFx0XHRyZXR1cm4gb3JpZ2luYWxNZXRob2QuYXBwbHkodGhpcywgYXJncyk7XHJcblx0XHR9O1xyXG5cclxuXHRcdHJldHVybiBkZXNjcmlwdG9yO1xyXG5cdH1cclxuXHQvLyAjZW5kcmVnaW9uIFBhcmFtZXRlci12YWx1ZSByZXF1ZXN0cy5cclxuXHQvLyAjcmVnaW9uIENsYXNzXHJcblx0LyoqXHJcblx0ICogQSBwcm9wZXJ0eS1kZWNvcmF0b3IgZmFjdG9yeSBzZXJ2aW5nIGFzIGEgKipEKiplc2lnbiAqKkIqKnkgKipDKipvbnRyYWN0IEludmFyaWFudC5cclxuXHQgKiBUaGlzIGludmFyaWFudCBhaW1zIHRvIGNoZWNrIHRoZSBpbnN0YW5jZSBvZiB0aGUgY2xhc3Mgbm90IHRoZSB2YWx1ZSB0byBiZSBnZXQgb3Igc2V0LlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIGNvbnRyYWN0cyBUaGUge0BsaW5rIERCQyB9LUNvbnRyYWN0cyB0aGUgdmFsdWUgc2hhbGwgdXBob2xkLlxyXG5cdCAqXHJcblx0ICogQHRocm93cyBcdEEge0BsaW5rIERCQy5JbmZyaW5nZW1lbnQgfSB3aGVuZXZlciB0aGUgcHJvcGVydHkgaXMgdHJpZWQgdG8gYmUgZ2V0IG9yIHNldCB3aXRob3V0IHRoZSBpbnN0YW5jZSBvZiBpdCdzIGNsYXNzXHJcblx0ICogXHRcdFx0ZnVsZmlsbGluZyB0aGUgc3BlY2lmaWVkICoqY29udHJhY3RzKiouICovXHJcblx0cHVibGljIHN0YXRpYyBkZWNDbGFzc0ludmFyaWFudChcclxuXHRcdGNvbnRyYWN0czogQXJyYXk8e1xyXG5cdFx0XHRjaGVjazogKHRvQ2hlY2s6IHVua25vd24gfCBudWxsIHwgdW5kZWZpbmVkKSA9PiBib29sZWFuIHwgc3RyaW5nO1xyXG5cdFx0fT4sXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXHJcblx0KSB7XHJcblx0XHRyZXR1cm4gKHRhcmdldDogdW5rbm93biwgcHJvcGVydHlLZXk6IHN0cmluZyB8IHN5bWJvbCwgZGVzY3JpcHRvcjogUHJvcGVydHlEZXNjcmlwdG9yKSA9PiB7XHJcblx0XHRcdGlmICghREJDLmdldERCQyhkYmMpLmV4ZWN1dGlvblNldHRpbmdzLmNoZWNrSW52YXJpYW50cykge1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHRjb25zdCBvcmlnaW5hbFNldHRlciA9IGRlc2NyaXB0b3Iuc2V0O1xyXG5cdFx0XHRjb25zdCBvcmlnaW5hbEdldHRlciA9IGRlc2NyaXB0b3IuZ2V0O1xyXG5cdFx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IE5lY2Vzc2FyeSB0byBpbnRlcmNlcHQgVU5ERUZJTkVEIGFuZCBOVUxMLlxyXG5cdFx0XHRsZXQgdmFsdWU6IGFueTtcclxuXHRcdFx0Ly8gI3JlZ2lvbiBSZXBsYWNlIG9yaWdpbmFsIHByb3BlcnR5LlxyXG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBwcm9wZXJ0eUtleSwge1xyXG5cdFx0XHRcdGdldCgpIHtcclxuXHRcdFx0XHRcdGlmICghREJDLmdldERCQyhkYmMpLmV4ZWN1dGlvblNldHRpbmdzLmNoZWNrSW52YXJpYW50cykge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0Y29uc3QgcmVhbFZhbHVlID0gcGF0aCA/IERCQy5yZXNvbHZlKHRoaXMsIHBhdGgpIDogdGhpcztcclxuXHRcdFx0XHRcdC8vICNyZWdpb24gQ2hlY2sgaWYgYWxsIFwiY29udHJhY3RzXCIgYXJlIGZ1bGZpbGxlZC5cclxuXHRcdFx0XHRcdGZvciAoY29uc3QgY29udHJhY3Qgb2YgY29udHJhY3RzKSB7XHJcblx0XHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IGNvbnRyYWN0LmNoZWNrKHJlYWxWYWx1ZSk7XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIHJlc3VsdCA9PT0gXCJzdHJpbmdcIikge1xyXG5cdFx0XHRcdFx0XHRcdERCQy5nZXREQkMoZGJjKS5yZXBvcnRGaWVsZEluZnJpbmdlbWVudChcclxuXHRcdFx0XHRcdFx0XHRcdHJlc3VsdCxcclxuXHRcdFx0XHRcdFx0XHRcdHRhcmdldCBhcyBvYmplY3QsXHJcblx0XHRcdFx0XHRcdFx0XHRwYXRoLFxyXG5cdFx0XHRcdFx0XHRcdFx0cHJvcGVydHlLZXkgYXMgc3RyaW5nLFxyXG5cdFx0XHRcdFx0XHRcdFx0cmVhbFZhbHVlLFxyXG5cdFx0XHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vICNlbmRyZWdpb24gQ2hlY2sgaWYgYWxsIFwiY29udHJhY3RzXCIgYXJlIGZ1bGZpbGxlZC5cclxuXHRcdFx0XHRcdHJldHVybiBvcmlnaW5hbEdldHRlcltwcm9wZXJ0eUtleV07XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRzZXQobmV3VmFsdWUpIHtcclxuXHRcdFx0XHRcdGlmICghREJDLmdldERCQyhkYmMpLmV4ZWN1dGlvblNldHRpbmdzLmNoZWNrSW52YXJpYW50cykge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0Y29uc3QgcmVhbFZhbHVlID0gcGF0aCA/IERCQy5yZXNvbHZlKHRoaXMsIHBhdGgpIDogdGhpcztcclxuXHRcdFx0XHRcdC8vICNyZWdpb24gQ2hlY2sgaWYgYWxsIFwiY29udHJhY3RzXCIgYXJlIGZ1bGZpbGxlZC5cclxuXHRcdFx0XHRcdGZvciAoY29uc3QgY29udHJhY3Qgb2YgY29udHJhY3RzKSB7XHJcblx0XHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IGNvbnRyYWN0LmNoZWNrKHJlYWxWYWx1ZSk7XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIHJlc3VsdCA9PT0gXCJzdHJpbmdcIikge1xyXG5cdFx0XHRcdFx0XHRcdERCQy5nZXREQkMoZGJjKS5yZXBvcnRGaWVsZEluZnJpbmdlbWVudChcclxuXHRcdFx0XHRcdFx0XHRcdHJlc3VsdCxcclxuXHRcdFx0XHRcdFx0XHRcdHRhcmdldCBhcyBvYmplY3QsXHJcblx0XHRcdFx0XHRcdFx0XHRwYXRoLFxyXG5cdFx0XHRcdFx0XHRcdFx0cHJvcGVydHlLZXkgYXMgc3RyaW5nLFxyXG5cdFx0XHRcdFx0XHRcdFx0cmVhbFZhbHVlLFxyXG5cdFx0XHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vICNlbmRyZWdpb24gQ2hlY2sgaWYgYWxsIFwiY29udHJhY3RzXCIgYXJlIGZ1bGZpbGxlZC5cclxuXHRcdFx0XHRcdHZhbHVlID0gbmV3VmFsdWU7XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRlbnVtZXJhYmxlOiB0cnVlLFxyXG5cdFx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcclxuXHRcdFx0fSk7XHJcblx0XHRcdC8vICNlbmRyZWdpb24gUmVwbGFjZSBvcmlnaW5hbCBwcm9wZXJ0eS5cclxuXHRcdH07XHJcblx0fVxyXG5cdC8vICNlbmRyZWdpb24gQ2xhc3NcclxuXHQvLyAjcmVnaW9uIEludmFyaWFudFxyXG5cdC8qKlxyXG5cdCAqIEEgcHJvcGVydHktZGVjb3JhdG9yIGZhY3Rvcnkgc2VydmluZyBhcyBhICoqRCoqZXNpZ24gKipCKip5ICoqQyoqb250cmFjdCBJbnZhcmlhbnQuXHJcblx0ICogU2luY2UgdGhlIHZhbHVlIG11c3QgYmUgaW5pdGlhbGl6ZWQgb3Igc2V0IGFjY29yZGluZyB0byB0aGUgc3BlY2lmaWVkICoqY29udHJhY3RzKiogdGhlIHZhbHVlIHdpbGwgb25seSBiZSBjaGVja2VkXHJcblx0ICogd2hlbiBhc3NpZ25pbmcgaXQuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gY29udHJhY3RzIFRoZSB7QGxpbmsgREJDIH0tQ29udHJhY3RzIHRoZSB2YWx1ZSBzaGFsbCB1cGhvbGQuXHJcblx0ICpcclxuXHQgKiBAdGhyb3dzIFx0QSB7QGxpbmsgREJDLkluZnJpbmdlbWVudCB9IHdoZW5ldmVyIHRoZSBwcm9wZXJ0eSBpcyB0cmllZCB0byBiZSBzZXQgdG8gYSB2YWx1ZSB0aGF0IGRvZXMgbm90IGNvbXBseSB0byB0aGVcclxuXHQgKiBcdFx0XHRzcGVjaWZpZWQgKipjb250cmFjdHMqKiwgYnkgdGhlIHJldHVybmVkIG1ldGhvZC4qL1xyXG5cdHB1YmxpYyBzdGF0aWMgZGVjSW52YXJpYW50KFxyXG5cdFx0Y29udHJhY3RzOiBBcnJheTx7XHJcblx0XHRcdGNoZWNrOiAodG9DaGVjazogdW5rbm93biB8IG51bGwgfCB1bmRlZmluZWQpID0+IGJvb2xlYW4gfCBzdHJpbmc7XHJcblx0XHR9PixcclxuXHRcdHBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGRiYzogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0aGludDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdCkge1xyXG5cdFx0cmV0dXJuICh0YXJnZXQ6IHVua25vd24sIHByb3BlcnR5S2V5OiBzdHJpbmcgfCBzeW1ib2wpID0+IHtcclxuXHRcdFx0aWYgKCFEQkMuZ2V0REJDKGRiYykuZXhlY3V0aW9uU2V0dGluZ3MuY2hlY2tJbnZhcmlhbnRzKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogTmVjZXNzYXJ5IHRvIGludGVyY2VwdCBVTkRFRklORUQgYW5kIE5VTEwuXHJcblx0XHRcdGxldCB2YWx1ZTogYW55O1xyXG5cdFx0XHQvLyAjcmVnaW9uIFJlcGxhY2Ugb3JpZ2luYWwgcHJvcGVydHkuXHJcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIHByb3BlcnR5S2V5LCB7XHJcblx0XHRcdFx0c2V0KG5ld1ZhbHVlKSB7XHJcblx0XHRcdFx0XHRpZiAoIURCQy5nZXREQkMoZGJjKS5leGVjdXRpb25TZXR0aW5ncy5jaGVja0ludmFyaWFudHMpIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdGNvbnN0IHJlYWxWYWx1ZSA9IHBhdGggPyBEQkMucmVzb2x2ZShuZXdWYWx1ZSwgcGF0aCkgOiBuZXdWYWx1ZTtcclxuXHRcdFx0XHRcdC8vICNyZWdpb24gQ2hlY2sgaWYgYWxsIFwiY29udHJhY3RzXCIgYXJlIGZ1bGZpbGxlZC5cclxuXHRcdFx0XHRcdGZvciAoY29uc3QgY29udHJhY3Qgb2YgY29udHJhY3RzKSB7XHJcblx0XHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IGNvbnRyYWN0LmNoZWNrKHJlYWxWYWx1ZSk7XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIHJlc3VsdCA9PT0gXCJzdHJpbmdcIikge1xyXG5cdFx0XHRcdFx0XHRcdERCQy5nZXREQkMoZGJjKS5yZXBvcnRGaWVsZEluZnJpbmdlbWVudChcclxuXHRcdFx0XHRcdFx0XHRcdHJlc3VsdCxcclxuXHRcdFx0XHRcdFx0XHRcdHRhcmdldCBhcyBvYmplY3QsXHJcblx0XHRcdFx0XHRcdFx0XHRwYXRoLFxyXG5cdFx0XHRcdFx0XHRcdFx0cHJvcGVydHlLZXkgYXMgc3RyaW5nLFxyXG5cdFx0XHRcdFx0XHRcdFx0cmVhbFZhbHVlLFxyXG5cdFx0XHRcdFx0XHRcdFx0aGludFxyXG5cdFx0XHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vICNlbmRyZWdpb24gQ2hlY2sgaWYgYWxsIFwiY29udHJhY3RzXCIgYXJlIGZ1bGZpbGxlZC5cclxuXHRcdFx0XHRcdHZhbHVlID0gbmV3VmFsdWU7XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRlbnVtZXJhYmxlOiB0cnVlLFxyXG5cdFx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcclxuXHRcdFx0fSk7XHJcblx0XHRcdC8vICNlbmRyZWdpb24gUmVwbGFjZSBvcmlnaW5hbCBwcm9wZXJ0eS5cclxuXHRcdH07XHJcblx0fVxyXG5cdC8vICNlbmRyZWdpb24gSW52YXJpYW50XHJcblx0Ly8gI3JlZ2lvbiBQb3N0Y29uZGl0aW9uXHJcblx0LyoqXHJcblx0ICogQSBtZXRob2QgZGVjb3JhdG9yIGZhY3RvcnkgY2hlY2tpbmcgdGhlIHJlc3VsdCBvZiBhIG1ldGhvZCB3aGVuZXZlciBpdCBpcyBpbnZva2VkIHRodXMgYWxzbyB1c2FibGUgb24gZ2V0dGVycy5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBjaGVja1x0VGhlICoqKHRvQ2hlY2s6IGFueSwgb2JqZWN0LCBzdHJpbmcpID0+IGJvb2xlYW4gfCBzdHJpbmcqKiB0byB1c2UgZm9yIGNoZWNraW5nLlxyXG5cdCAqIEBwYXJhbSBkYmNcdFNlZSB7QGxpbmsgREJDLnJlc29sdmVEQkNQYXRoIH0uXHJcblx0ICogQHBhcmFtIHBhdGhcdFRoZSBkb3R0ZWQgcGF0aCByZWZlcnJpbmcgdG8gdGhlIGFjdHVhbCB2YWx1ZSB0byBjaGVjaywgc3RhcnRpbmcgZm9ybSB0aGUgc3BlY2lmaWVkIG9uZS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFRoZSAqKiggdGFyZ2V0IDogb2JqZWN0LCBwcm9wZXJ0eUtleSA6IHN0cmluZywgZGVzY3JpcHRvciA6IFByb3BlcnR5RGVzY3JpcHRvciApIDogUHJvcGVydHlEZXNjcmlwdG9yKipcclxuXHQgKiBcdFx0XHRpbnZva2VkIGJ5IFR5cGVzY3JpcHQuXHJcblx0ICovXHJcblx0cHVibGljIHN0YXRpYyBkZWNQb3N0Y29uZGl0aW9uKFxyXG5cdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBOZWNlc3NhcnkgdG8gaW50ZXJjZXB0IFVOREVGSU5FRCBhbmQgTlVMTC5cclxuXHRcdGNoZWNrOiAodG9DaGVjazogYW55LCBvYmplY3QsIHN0cmluZykgPT4gYm9vbGVhbiB8IHN0cmluZyxcclxuXHRcdGRiYzogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0aGludDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdCkge1xyXG5cdFx0cmV0dXJuIChcclxuXHRcdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRcdHByb3BlcnR5S2V5OiBzdHJpbmcsXHJcblx0XHRcdGRlc2NyaXB0b3I6IFByb3BlcnR5RGVzY3JpcHRvcixcclxuXHRcdCk6IFByb3BlcnR5RGVzY3JpcHRvciA9PiB7XHJcblx0XHRcdGNvbnN0IG9yaWdpbmFsTWV0aG9kID0gZGVzY3JpcHRvci52YWx1ZTtcclxuXHRcdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBOZWNlc3NhcnkgdG8gaW50ZXJjZXB0IFVOREVGSU5FRCBhbmQgTlVMTC5cclxuXHRcdFx0ZGVzY3JpcHRvci52YWx1ZSA9ICguLi5hcmdzOiBhbnlbXSkgPT4ge1xyXG5cdFx0XHRcdGlmICghREJDLmdldERCQyhkYmMpLmV4ZWN1dGlvblNldHRpbmdzLmNoZWNrUG9zdGNvbmRpdGlvbnMpIHtcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvY29tcGxleGl0eS9ub1RoaXNJblN0YXRpYzogPGV4cGxhbmF0aW9uPlxyXG5cdFx0XHRcdGNvbnN0IHJlc3VsdCA9IG9yaWdpbmFsTWV0aG9kLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG5cdFx0XHRcdGNvbnN0IHJlYWxWYWx1ZSA9IHBhdGggPyBEQkMucmVzb2x2ZShyZXN1bHQsIHBhdGgpIDogcmVzdWx0O1xyXG5cdFx0XHRcdGNvbnN0IGNoZWNrUmVzdWx0ID0gY2hlY2socmVhbFZhbHVlLCB0YXJnZXQsIHByb3BlcnR5S2V5KTtcclxuXHJcblx0XHRcdFx0aWYgKHR5cGVvZiBjaGVja1Jlc3VsdCA9PT0gXCJzdHJpbmdcIikge1xyXG5cdFx0XHRcdFx0REJDLmdldERCQyhkYmMpLnJlcG9ydFJldHVybnZhbHVlSW5mcmluZ2VtZW50KFxyXG5cdFx0XHRcdFx0XHRjaGVja1Jlc3VsdCxcclxuXHRcdFx0XHRcdFx0dGFyZ2V0LFxyXG5cdFx0XHRcdFx0XHRwYXRoLFxyXG5cdFx0XHRcdFx0XHRwcm9wZXJ0eUtleSxcclxuXHRcdFx0XHRcdFx0cmVhbFZhbHVlLFxyXG5cdFx0XHRcdFx0XHRoaW50XHJcblx0XHRcdFx0XHQpO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0cmV0dXJuIHJlc3VsdDtcclxuXHRcdFx0fTtcclxuXHJcblx0XHRcdHJldHVybiBkZXNjcmlwdG9yO1xyXG5cdFx0fTtcclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBQb3N0Y29uZGl0aW9uXHJcblx0Ly8gI3JlZ2lvbiBEZWNvcmF0b3JcclxuXHQvLyAjcmVnaW9uIFByZWNvbmRpdGlvblxyXG5cdC8qKlxyXG5cdCAqIEEgcGFyYW1ldGVyLWRlY29yYXRvciBmYWN0b3J5IHRoYXQgcmVxdWVzdHMgdGhlIHRhZ2dlZCBwYXJhbWV0ZXIncyB2YWx1ZSBwYXNzaW5nIGl0IHRvIHRoZSBwcm92aWRlZFxyXG5cdCAqIFwiY2hlY2tcIi1tZXRob2Qgd2hlbiB0aGUgdmFsdWUgYmVjb21lcyBhdmFpbGFibGUuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gY2hlY2tcdFRoZSBcIiggdW5rbm93biApID0+IHZvaWRcIiB0byBiZSBpbnZva2VkIGFsb25nIHdpdGggdGhlIHRhZ2dlZCBwYXJhbWV0ZXIncyB2YWx1ZSBhcyBzb29uXHJcblx0ICogXHRcdFx0XHRhcyBpdCBiZWNvbWVzIGF2YWlsYWJsZS5cclxuXHQgKiBAcGFyYW0gZGJjICBcdFNlZSB7QGxpbmsgREJDLnJlc29sdmVEQkNQYXRoIH0uXHJcblx0ICogQHBhcmFtIHBhdGhcdFRoZSBkb3R0ZWQgcGF0aCByZWZlcnJpbmcgdG8gdGhlIGFjdHVhbCB2YWx1ZSB0byBjaGVjaywgc3RhcnRpbmcgZm9ybSB0aGUgc3BlY2lmaWVkIG9uZS5cclxuXHQgKiBcdFx0XHRcdE1heSBjb250YWluIDo6IHRvIHNlcGFyYXRlIG11bHRpcGxlIHBhdGhzLlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgVGhlICoqKHRhcmdldDogb2JqZWN0LCBtZXRob2ROYW1lOiBzdHJpbmcgfCBzeW1ib2wsIHBhcmFtZXRlckluZGV4OiBudW1iZXIgKSA9PiB2b2lkKiogaW52b2tlZCBieSBUeXBlc2NyaXB0LSAqL1xyXG5cdHByb3RlY3RlZCBzdGF0aWMgZGVjUHJlY29uZGl0aW9uKFxyXG5cdFx0Y2hlY2s6ICh1bmtub3duLCBvYmplY3QsIHN0cmluZywgbnVtYmVyKSA9PiBib29sZWFuIHwgc3RyaW5nLFxyXG5cdFx0ZGJjOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRoaW50OiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0KTogKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRtZXRob2ROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXHJcblx0XHRwYXJhbWV0ZXJJbmRleDogbnVtYmVyLFxyXG5cdCkgPT4gdm9pZCB7XHJcblx0XHRjb25zdCBwYXRocyA9IHBhdGggPyBwYXRoLnJlcGxhY2UoLyAvZywgXCJcIikuc3BsaXQoXCI6OlwiKSA6IFt1bmRlZmluZWRdO1xyXG5cdFx0cmV0dXJuIChcclxuXHRcdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRcdG1ldGhvZE5hbWU6IHN0cmluZyB8IHN5bWJvbCxcclxuXHRcdFx0cGFyYW1ldGVySW5kZXg6IG51bWJlcixcclxuXHRcdCk6IHZvaWQgPT4ge1xyXG5cdFx0XHREQkMucmVxdWVzdFBhcmFtVmFsdWUoXHJcblx0XHRcdFx0dGFyZ2V0LFxyXG5cdFx0XHRcdG1ldGhvZE5hbWUsXHJcblx0XHRcdFx0cGFyYW1ldGVySW5kZXgsXHJcblx0XHRcdFx0KHZhbHVlOiB1bmtub3duKSA9PiB7XHJcblx0XHRcdFx0XHRpZiAoIURCQy5nZXREQkMoZGJjKS5leGVjdXRpb25TZXR0aW5ncy5jaGVja1ByZWNvbmRpdGlvbnMpIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdGZvciAoY29uc3Qgc2luZ2xlUGF0aCBvZiBwYXRocykge1xyXG5cdFx0XHRcdFx0XHRjb25zdCByZWFsVmFsdWUgPSBzaW5nbGVQYXRoID8gREJDLnJlc29sdmUodmFsdWUsIHNpbmdsZVBhdGgpIDogdmFsdWU7XHJcblx0XHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IGNoZWNrKHJlYWxWYWx1ZSwgdGFyZ2V0LCBtZXRob2ROYW1lLCBwYXJhbWV0ZXJJbmRleCk7XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIHJlc3VsdCA9PT0gXCJzdHJpbmdcIikge1xyXG5cdFx0XHRcdFx0XHRcdERCQy5nZXREQkMoZGJjKS5yZXBvcnRQYXJhbWV0ZXJJbmZyaW5nZW1lbnQoXHJcblx0XHRcdFx0XHRcdFx0XHRyZXN1bHQsXHJcblx0XHRcdFx0XHRcdFx0XHR0YXJnZXQsXHJcblx0XHRcdFx0XHRcdFx0XHRzaW5nbGVQYXRoLFxyXG5cdFx0XHRcdFx0XHRcdFx0bWV0aG9kTmFtZSBhcyBzdHJpbmcsXHJcblx0XHRcdFx0XHRcdFx0XHRwYXJhbWV0ZXJJbmRleCxcclxuXHRcdFx0XHRcdFx0XHRcdHJlYWxWYWx1ZSxcclxuXHRcdFx0XHRcdFx0XHRcdGhpbnRcclxuXHRcdFx0XHRcdFx0XHQpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0KTtcclxuXHRcdH07XHJcblx0fVxyXG5cdC8vICNlbmRyZWdpb24gUHJlY29uZGl0aW9uXHJcblx0Ly8gI2VuZHJlZ2lvbiBEZWNvcmF0b3JcclxuXHQvLyAjcmVnaW9uIEV4ZWN1dGlvbiBIYW5kbGluZ1xyXG5cdC8qKiBTdG9yZXMgc2V0dGluZ3MgY29uY2VybmluZyB0aGUgZXhlY3V0aW9uIG9mIGNoZWNrcy4gKi9cclxuXHRwdWJsaWMgZXhlY3V0aW9uU2V0dGluZ3M6IHtcclxuXHRcdGNoZWNrUHJlY29uZGl0aW9uczogYm9vbGVhbjtcclxuXHRcdGNoZWNrUG9zdGNvbmRpdGlvbnM6IGJvb2xlYW47XHJcblx0XHRjaGVja0ludmFyaWFudHM6IGJvb2xlYW47XHJcblx0fSA9IHtcclxuXHRcdFx0Y2hlY2tQcmVjb25kaXRpb25zOiB0cnVlLFxyXG5cdFx0XHRjaGVja1Bvc3Rjb25kaXRpb25zOiB0cnVlLFxyXG5cdFx0XHRjaGVja0ludmFyaWFudHM6IHRydWUsXHJcblx0XHR9O1xyXG5cdC8vICNlbmRyZWdpb24gRXhlY3V0aW9uIEhhbmRsaW5nXHJcblx0Ly8gI3JlZ2lvbiBXYXJuaW5nIGhhbmRsaW5nLlxyXG5cdC8qKiBTdG9yZXMgc2V0dGluZ3MgY29uY2VybmluZyB3YXJuaW5ncy4gKi9cclxuXHRwdWJsaWMgd2FybmluZ1NldHRpbmdzOiB7XHJcblx0XHRsb2dUb0NvbnNvbGU6IGJvb2xlYW47XHJcblx0fSA9IHsgbG9nVG9Db25zb2xlOiB0cnVlIH07XHJcblx0LyoqXHJcblx0ICogUmVwb3J0cyBhIHdhcm5pbmcuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gbWVzc2FnZSBUaGUgbWVzc2FnZSBjb250YWluaW5nIHRoZSB3YXJuaW5nLiAqL1xyXG5cdHByb3RlY3RlZCByZXBvcnRXYXJuaW5nKG1lc3NhZ2U6IHN0cmluZyk6IHVuZGVmaW5lZCB7XHJcblx0XHRpZiAodGhpcy53YXJuaW5nU2V0dGluZ3MubG9nVG9Db25zb2xlKSB7XHJcblx0XHRcdGNvbnNvbGUud2FybihtZXNzYWdlKTtcclxuXHRcdH1cclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBXYXJuaW5nIGhhbmRsaW5nLlxyXG5cdC8vICNyZWdpb24gaW5mcmluZ2VtZW50IGhhbmRsaW5nLlxyXG5cdC8qKiBTdG9yZXMgdGhlIHNldHRpbmdzIGNvbmNlcm5pbmcgaW5mcmluZ2VtZW50cyAqL1xyXG5cdHB1YmxpYyBpbmZyaW5nZW1lbnRTZXR0aW5nczoge1xyXG5cdFx0dGhyb3dFeGNlcHRpb246IGJvb2xlYW47XHJcblx0XHRsb2dUb0NvbnNvbGU6IGJvb2xlYW47XHJcblx0fSA9IHsgdGhyb3dFeGNlcHRpb246IHRydWUsIGxvZ1RvQ29uc29sZTogZmFsc2UgfTtcclxuXHQvKipcclxuXHQgKiBSZXBvcnRzIGFuIGluZnJpbmdlbWVudCBhY2NvcmRpbmcgdG8gdGhlIHtAbGluayBpbmZyaW5nZW1lbnRTZXR0aW5ncyB9IGFsc28gZ2VuZXJhdGluZyBhIHByb3BlciB7QGxpbmsgc3RyaW5nIH0td3JhcHBlclxyXG5cdCAqIGZvciB0aGUgZ2l2ZW4gXCJtZXNzYWdlXCIgJiB2aW9sYXRvci5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBtZXNzYWdlXHRUaGUge0BsaW5rIHN0cmluZyB9IGRlc2NyaWJpbmcgdGhlIGluZnJpbmdlbWVudCBhbmQgaXQncyBwcm92ZW5pZW5jZS5cclxuXHQgKiBAcGFyYW0gdmlvbGF0b3IgXHRUaGUge0BsaW5rIHN0cmluZyB9IGRlc2NyaWJpbmcgb3IgbmFtaW5nIHRoZSB2aW9sYXRvci4gKi9cclxuXHRwcm90ZWN0ZWQgcmVwb3J0SW5mcmluZ2VtZW50KFxyXG5cdFx0bWVzc2FnZTogc3RyaW5nLFxyXG5cdFx0dmlvbGF0b3I6IHN0cmluZyxcclxuXHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0dmFsdWU6IHVua25vd24sXHJcblx0XHRwYXRoOiBzdHJpbmcsXHJcblx0XHRoaW50OiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0KTogdW5kZWZpbmVkIHtcclxuXHRcdGNvbnN0IGZpbmFsTWVzc2FnZTogc3RyaW5nID0gYFsgRnJvbSBcIiR7dmlvbGF0b3J9XCIke3R5cGVvZiB0YXJnZXQgPT09IFwiZnVuY3Rpb25cIiA/IGAgaW4gXCIke3RhcmdldC5uYW1lfVwiYCA6IHR5cGVvZiB0YXJnZXQgPT09IFwib2JqZWN0XCIgJiYgdGFyZ2V0ICE9PSBudWxsICYmIHR5cGVvZiB0YXJnZXQuY29uc3RydWN0b3IgPT09IFwiZnVuY3Rpb25cIiA/IGAgaW4gXCIke3RhcmdldC5jb25zdHJ1Y3Rvci5uYW1lfVwiYCA6IGBpbiBcIiR7dGFyZ2V0fVwiYH0ke3BhdGggPyBgID4gXCIke3BhdGh9XCJgIDogXCJcIn06ICR7bWVzc2FnZX0gJHtoaW50ID8gYFx1MjcyOCAke2hpbnR9IFx1MjcyOGAgOiBcIlwifV1gO1xyXG5cclxuXHRcdGlmICh0aGlzLmluZnJpbmdlbWVudFNldHRpbmdzLnRocm93RXhjZXB0aW9uKSB7XHJcblx0XHRcdHRocm93IG5ldyBEQkMuSW5mcmluZ2VtZW50KGZpbmFsTWVzc2FnZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHRoaXMuaW5mcmluZ2VtZW50U2V0dGluZ3MubG9nVG9Db25zb2xlKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKGZpbmFsTWVzc2FnZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIFJlcG9ydHMgYSBwYXJhbWV0ZXItaW5mcmluZ2VtZW50IHZpYSB7QGxpbmsgcmVwb3J0SW5mcmluZ2VtZW50IH0gYWxzbyBnZW5lcmF0aW5nIGEgcHJvcGVyIHtAbGluayBzdHJpbmcgfS13cmFwcGVyXHJcblx0ICogZm9yIHRoZSBnaXZlbiBcIm1lc3NhZ2VcIixcIm1ldGhvZFwiLCBwYXJhbWV0ZXItXCJpbmRleFwiICYgdmFsdWUuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gbWVzc2FnZVx0VGhlIHtAbGluayBzdHJpbmcgfSBkZXNjcmliaW5nIHRoZSBpbmZyaW5nZW1lbnQgYW5kIGl0J3MgcHJvdmVuaWVuY2UuXHJcblx0ICogQHBhcmFtIG1ldGhvZCBcdFRoZSB7QGxpbmsgc3RyaW5nIH0gZGVzY3JpYmluZyBvciBuYW1pbmcgdGhlIHZpb2xhdG9yLlxyXG5cdCAqIEBwYXJhbSBpbmRleFx0XHRUaGUgaW5kZXggb2YgdGhlIHBhcmFtZXRlciB3aXRoaW4gdGhlIGFyZ3VtZW50IGxpc3RpbmcuXHJcblx0ICogQHBhcmFtIHZhbHVlIFx0VGhlIHBhcmFtZXRlcidzIHZhbHVlLiAqL1xyXG5cdHB1YmxpYyByZXBvcnRQYXJhbWV0ZXJJbmZyaW5nZW1lbnQoXHJcblx0XHRtZXNzYWdlOiBzdHJpbmcsXHJcblx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdHBhdGg6IHN0cmluZyxcclxuXHRcdG1ldGhvZDogc3RyaW5nLFxyXG5cdFx0aW5kZXg6IG51bWJlcixcclxuXHRcdHZhbHVlOiB1bmtub3duLFxyXG5cdFx0aGludDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdCk6IHVuZGVmaW5lZCB7XHJcblx0XHRjb25zdCBwcm9wZXJJbmRleCA9IGluZGV4ICsgMTtcclxuXHJcblx0XHR0aGlzLnJlcG9ydEluZnJpbmdlbWVudChcclxuXHRcdFx0YFsgUGFyYW1ldGVyLXZhbHVlIFwiJHt2YWx1ZX1cIiBvZiB0aGUgJHtwcm9wZXJJbmRleH0ke3Byb3BlckluZGV4ID09PSAxID8gXCJzdFwiIDogcHJvcGVySW5kZXggPT09IDIgPyBcIm5kXCIgOiBwcm9wZXJJbmRleCA9PT0gMyA/IFwicmRcIiA6IFwidGhcIn0gcGFyYW1ldGVyIGRpZCBub3QgZnVsZmlsbCBvbmUgb2YgaXQncyBjb250cmFjdHM6ICR7bWVzc2FnZX0gXWAsXHJcblx0XHRcdG1ldGhvZCxcclxuXHRcdFx0dGFyZ2V0LFxyXG5cdFx0XHR2YWx1ZSxcclxuXHRcdFx0cGF0aCxcclxuXHRcdFx0aGludFxyXG5cdFx0KTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogUmVwb3J0cyBhIGZpZWxkLWluZnJpbmdlbWVudCB2aWEge0BsaW5rIHJlcG9ydEluZnJpbmdlbWVudCB9IGFsc28gZ2VuZXJhdGluZyBhIHByb3BlciB7QGxpbmsgc3RyaW5nIH0td3JhcHBlclxyXG5cdCAqIGZvciB0aGUgZ2l2ZW4gKiptZXNzYWdlKiogJiAqKm5hbWUqKi5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBtZXNzYWdlXHRBIHtAbGluayBzdHJpbmcgfSBkZXNjcmliaW5nIHRoZSBpbmZyaW5nZW1lbnQgYW5kIGl0J3MgcHJvdmVuaWVuY2UuXHJcblx0ICogQHBhcmFtIGtleSBcdFx0VGhlIHByb3BlcnR5IGtleS5cclxuXHQgKiBAcGFyYW0gcGF0aFx0XHRUaGUgZG90dGVkLXBhdGgge0BsaW5rIHN0cmluZyB9IHRoYXQgbGVhZHMgdG8gdGhlIHZhbHVlIG5vdCBmdWxmaWxsaW5nIHRoZSBjb250cmFjdCBzdGFydGluZyBmcm9tXHJcblx0ICogXHRcdFx0XHRcdHRoZSB0YWdnZWQgb25lLlxyXG5cdCAqIEBwYXJhbSB2YWx1ZVx0XHRUaGUgdmFsdWUgbm90IGZ1bGZpbGxpbmcgYSBjb250cmFjdC4gKi9cclxuXHRwdWJsaWMgcmVwb3J0RmllbGRJbmZyaW5nZW1lbnQoXHJcblx0XHRtZXNzYWdlOiBzdHJpbmcsXHJcblx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdHBhdGg6IHN0cmluZyxcclxuXHRcdGtleTogc3RyaW5nLFxyXG5cdFx0dmFsdWU6IHVua25vd24sXHJcblx0XHRoaW50OiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0KTogdW5kZWZpbmVkIHtcclxuXHRcdHRoaXMucmVwb3J0SW5mcmluZ2VtZW50KFxyXG5cdFx0XHRgWyBOZXcgdmFsdWUgZm9yIFwiJHtrZXl9XCIke3BhdGggPT09IHVuZGVmaW5lZCA/IFwiXCIgOiBgLiR7cGF0aH1gfSB3aXRoIHZhbHVlIFwiJHt2YWx1ZX1cIiBkaWQgbm90IGZ1bGZpbGwgb25lIG9mIGl0J3MgY29udHJhY3RzOiAke21lc3NhZ2V9IF1gLFxyXG5cdFx0XHRrZXksXHJcblx0XHRcdHRhcmdldCxcclxuXHRcdFx0dmFsdWUsXHJcblx0XHRcdHBhdGgsXHJcblx0XHQpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBSZXBvcnRzIGEgcmV0dXJudmFsdWUtaW5mcmluZ2VtZW50IGFjY29yZGluZyB2aWEge0BsaW5rIHJlcG9ydEluZnJpbmdlbWVudCB9IGFsc28gZ2VuZXJhdGluZyBhIHByb3BlciB7QGxpbmsgc3RyaW5nIH0td3JhcHBlclxyXG5cdCAqIGZvciB0aGUgZ2l2ZW4gXCJtZXNzYWdlXCIsXCJtZXRob2RcIiAmIHZhbHVlLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIG1lc3NhZ2VcdFRoZSB7QGxpbmsgc3RyaW5nIH0gZGVzY3JpYmluZyB0aGUgaW5mcmluZ2VtZW50IGFuZCBpdCdzIHByb3ZlbmllbmNlLlxyXG5cdCAqIEBwYXJhbSBtZXRob2QgXHRUaGUge0BsaW5rIHN0cmluZyB9IGRlc2NyaWJpbmcgb3IgbmFtaW5nIHRoZSB2aW9sYXRvci5cclxuXHQgKiBAcGFyYW0gdmFsdWVcdFx0VGhlIHBhcmFtZXRlcidzIHZhbHVlLiAqL1xyXG5cdHB1YmxpYyByZXBvcnRSZXR1cm52YWx1ZUluZnJpbmdlbWVudChcclxuXHRcdG1lc3NhZ2U6IHN0cmluZyxcclxuXHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0cGF0aDogc3RyaW5nLFxyXG5cdFx0bWV0aG9kOiBzdHJpbmcsXHJcblx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cclxuXHRcdHZhbHVlOiBhbnksXHJcblx0XHRoaW50OiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0KSB7XHJcblx0XHR0aGlzLnJlcG9ydEluZnJpbmdlbWVudChcclxuXHRcdFx0YFsgUmV0dXJuLXZhbHVlIFwiJHt2YWx1ZX1cIiBkaWQgbm90IGZ1bGZpbGwgb25lIG9mIGl0J3MgY29udHJhY3RzOiAke21lc3NhZ2V9IF1gLFxyXG5cdFx0XHRtZXRob2QsXHJcblx0XHRcdHRhcmdldCxcclxuXHRcdFx0dmFsdWUsXHJcblx0XHRcdHBhdGgsXHJcblx0XHRcdGhpbnRcclxuXHRcdCk7XHJcblx0fVxyXG5cdC8vICNyZWdpb24gQ2xhc3Nlc1xyXG5cdC8vICNyZWdpb24gRXJyb3JzXHJcblx0LyoqIEFuIHtAbGluayBFcnJvciB9IHRvIGJlIHRocm93biB3aGVuZXZlciBhbiBpbmZyaW5nZW1lbnQgaXMgZGV0ZWN0ZWQuICovXHJcblx0cHVibGljIHN0YXRpYyBJbmZyaW5nZW1lbnQgPSBjbGFzcyBleHRlbmRzIEVycm9yIHtcclxuXHRcdC8qKlxyXG5cdFx0ICogQ29uc3RydWN0cyB0aGlzIHtAbGluayBFcnJvciB9IGJ5IHRhZ2dpbmcgdGhlIHNwZWNpZmllZCBtZXNzYWdlLXtAbGluayBzdHJpbmcgfSBhcyBhbiBYREJDLUluZnJpbmdlbWVudC5cclxuXHRcdCAqXHJcblx0XHQgKiBAcGFyYW0gbWVzc2FnZSBUaGUge0BsaW5rIHN0cmluZyB9IGRlc2NyaWJpbmcgdGhlIGluZnJpbmdlbWVudC4gKi9cclxuXHRcdGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZykge1xyXG5cdFx0XHRzdXBlcihgWyBYREJDIEluZnJpbmdlbWVudCAke21lc3NhZ2V9XWApO1xyXG5cdFx0fVxyXG5cdH07XHJcblx0Ly8gI2VuZHJlZ2lvbiBFcnJvcnNcclxuXHQvLyAjZW5kcmVnaW9uIENsYXNzZXNcclxuXHQvLyAjZW5kcmVnaW9uIGluZnJpbmdlbWVudCBoYW5kbGluZy5cclxuXHQvKipcclxuXHQgKiBSZXNvbHZlcyB0aGUgc3BlY2lmaWVkIGRvdHRlZCB7QGxpbmsgc3RyaW5nIH0tcGF0aCB0byBhIHtAbGluayBEQkMgfS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBvYmogXHRUaGUge0BsaW5rIG9iamVjdCB9IHRvIHN0YXJ0IHJlc29sdmluZyBmcm9tLlxyXG5cdCAqIEBwYXJhbSBwYXRoIFx0VGhlIGRvdHRlZCB7QGxpbmsgc3RyaW5nIH0tcGF0aCBsZWFkaW5nIHRvIHRoZSB7QGxpbmsgREJDIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBUaGUgcmVxdWVzdGVkIHtAbGluayBEQkMgfS5cclxuXHQgKi9cclxuXHRzdGF0aWMgcmVzb2x2ZURCQ1BhdGggPSAob2JqLCBwYXRoKTogREJDID0+XHJcblx0XHRwYXRoXHJcblx0XHRcdD8uc3BsaXQoXCIuXCIpXHJcblx0XHRcdC5yZWR1Y2UoKGFjY3VtdWxhdG9yLCBjdXJyZW50KSA9PiBhY2N1bXVsYXRvcltjdXJyZW50XSwgb2JqKTtcclxuXHQvKipcclxuXHQgKiBDb25zdHJ1Y3RzIHRoaXMge0BsaW5rIERCQyB9IGJ5IHNldHRpbmcgdGhlIHtAbGluayBEQkMuaW5mcmluZ2VtZW50U2V0dGluZ3MgfSwgZGVmaW5lIHRoZSAqKldhWENvZGUqKiBuYW1lc3BhY2UgaW5cclxuXHQgKiAqKndpbmRvdyoqIGlmIG5vdCB5ZXQgYXZhaWxhYmxlIGFuZCBzZXR0aW5nIHRoZSBwcm9wZXJ0eSAqKkRCQyoqIGluIHRoZXJlIHRvIHRoZSBpbnN0YW5jZSBvZiB0aGlzIHtAbGluayBEQkMgfS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBpbmZyaW5nZW1lbnRTZXR0aW5ncyBcdFNlZSB7QGxpbmsgREJDLmluZnJpbmdlbWVudFNldHRpbmdzIH0uXHJcblx0ICogQHBhcmFtIGV4ZWN1dGlvblNldHRpbmdzXHRcdFNlZSB7QGxpbmsgREJDLmV4ZWN1dGlvblNldHRpbmdzIH0uICovXHJcblx0Y29uc3RydWN0b3IoXHJcblx0XHRpbmZyaW5nZW1lbnRTZXR0aW5nczoge1xyXG5cdFx0XHR0aHJvd0V4Y2VwdGlvbjogYm9vbGVhbjtcclxuXHRcdFx0bG9nVG9Db25zb2xlOiBib29sZWFuO1xyXG5cdFx0fSA9IHsgdGhyb3dFeGNlcHRpb246IHRydWUsIGxvZ1RvQ29uc29sZTogZmFsc2UgfSxcclxuXHRcdGV4ZWN1dGlvblNldHRpbmdzOiB7XHJcblx0XHRcdGNoZWNrUHJlY29uZGl0aW9uczogYm9vbGVhbjtcclxuXHRcdFx0Y2hlY2tQb3N0Y29uZGl0aW9uczogYm9vbGVhbjtcclxuXHRcdFx0Y2hlY2tJbnZhcmlhbnRzOiBib29sZWFuO1xyXG5cdFx0fSA9IHtcclxuXHRcdFx0XHRjaGVja1ByZWNvbmRpdGlvbnM6IHRydWUsXHJcblx0XHRcdFx0Y2hlY2tQb3N0Y29uZGl0aW9uczogdHJ1ZSxcclxuXHRcdFx0XHRjaGVja0ludmFyaWFudHM6IHRydWUsXHJcblx0XHRcdH0sXHJcblx0KSB7XHJcblx0XHR0aGlzLmluZnJpbmdlbWVudFNldHRpbmdzID0gaW5mcmluZ2VtZW50U2V0dGluZ3M7XHJcblxyXG5cdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XHJcblx0XHRpZiAoKERCQy5nZXRIb3N0KCkgYXMgYW55KS5XYVhDb2RlID09PSB1bmRlZmluZWQpIChEQkMuZ2V0SG9zdCgpIGFzIGFueSkuV2FYQ29kZSA9IHt9O1xyXG5cdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XHJcblx0XHQoREJDLmdldEhvc3QoKSBhcyBhbnkpLldhWENvZGUuREJDID0gdGhpcztcclxuXHRcdERCQy5kYmNDYWNoZS5zZXQoXCJXYVhDb2RlLkRCQ1wiLCB0aGlzKTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogUmVzb2x2ZXMgdGhlIGRlc2lyZWQge0BsaW5rIG9iamVjdCB9IG91dCBhIGdpdmVuIG9uZSAqKnRvUmVzb2x2ZUZyb20qKiB1c2luZyB0aGUgc3BlY2lmaWVkICoqcGF0aCoqLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHRvUmVzb2x2ZUZyb20gVGhlIHtAbGluayBvYmplY3QgfSBzdGFydGluZyB0byByZXNvbHZlIGZyb20uXHJcblx0ICogQHBhcmFtIHBhdGhcdFx0XHRUaGUgZG90dGVkIHBhdGgte0BsaW5rIHN0cmluZyB9LlxyXG5cdCAqIFx0XHRcdFx0XHRcdFRoaXMgc3RyaW5nIHVzZXMgLiwgWy4uLl0sIGFuZCAoKSB0byByZXByZXNlbnQgYWNjZXNzaW5nIG5lc3RlZCBwcm9wZXJ0aWVzLFxyXG5cdCAqIFx0XHRcdFx0XHRcdGFycmF5IGVsZW1lbnRzL29iamVjdCBrZXlzLCBhbmQgY2FsbGluZyBtZXRob2RzLCByZXNwZWN0aXZlbHksIG1pbWlja2luZyBKYXZhU2NyaXB0IHN5bnRheCB0byBuYXZpZ2F0ZVxyXG5cdCAqIFx0XHRcdFx0XHRcdGFuIG9iamVjdCdzIHN0cnVjdHVyZS4gQ29kZSwgZS5nLiBzb21ldGhpbmcgbGlrZSBhLmIoIDEgYXMgbnVtYmVyICkuYywgd2lsbCBub3QgYmUgZXhlY3V0ZWQgYW5kXHJcblx0ICogXHRcdFx0XHRcdFx0dGh1cyBtYWtlIHRoZSByZXRyaWV2YWwgZmFpbC5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFRoZSByZXF1ZXN0ZWQge0BsaW5rIG9iamVjdCB9LCBOVUxMIG9yIFVOREVGSU5FRC4gKi9cclxuXHRwdWJsaWMgc3RhdGljIHJlc29sdmUodG9SZXNvbHZlRnJvbTogdW5rbm93biwgcGF0aDogc3RyaW5nKSB7XHJcblx0XHRpZiAoIXRvUmVzb2x2ZUZyb20gfHwgdHlwZW9mIHBhdGggIT09IFwic3RyaW5nXCIpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfVxyXG5cclxuXHRcdGNvbnN0IGNhY2hlZFBhcnRzID0gREJDLnBhdGhUb2tlbkNhY2hlLmdldChwYXRoKTtcclxuXHRcdGNvbnN0IHBhcnRzID0gY2FjaGVkUGFydHMgPz8gcGF0aC5yZXBsYWNlKC9cXFsoWydcIl0/KSguKj8pXFwxXFxdL2csIFwiLiQyXCIpLnNwbGl0KFwiLlwiKTtcclxuXHJcblx0XHRpZiAoIWNhY2hlZFBhcnRzKSB7IERCQy5wYXRoVG9rZW5DYWNoZS5zZXQocGF0aCwgcGFydHMpOyB9XHJcblxyXG5cdFx0bGV0IGN1cnJlbnQgPSB0b1Jlc29sdmVGcm9tO1xyXG5cclxuXHRcdGZvciAoY29uc3QgcGFydCBvZiBwYXJ0cykge1xyXG5cdFx0XHRpZiAoY3VycmVudCA9PT0gbnVsbCB8fCB0eXBlb2YgY3VycmVudCA9PT0gXCJ1bmRlZmluZWRcIikgeyByZXR1cm4gdW5kZWZpbmVkOyB9XHJcblxyXG5cdFx0XHRjb25zdCBtZXRob2RNYXRjaCA9IHBhcnQubWF0Y2goLyhcXHcrKVxcKCguKilcXCkvKTtcclxuXHJcblx0XHRcdGlmIChtZXRob2RNYXRjaCkge1xyXG5cdFx0XHRcdGNvbnN0IG1ldGhvZE5hbWUgPSBtZXRob2RNYXRjaFsxXTtcclxuXHRcdFx0XHRjb25zdCBhcmdzU3RyID0gbWV0aG9kTWF0Y2hbMl07XHJcblx0XHRcdFx0Y29uc3QgYXJncyA9IGFyZ3NTdHIuc3BsaXQoXCIsXCIpLm1hcCgoYXJnKSA9PiBhcmcudHJpbSgpKTtcclxuXHJcblx0XHRcdFx0aWYgKHR5cGVvZiBjdXJyZW50W21ldGhvZE5hbWVdID09PSBcImZ1bmN0aW9uXCIpIHtcclxuXHRcdFx0XHRcdGN1cnJlbnQgPSBjdXJyZW50W21ldGhvZE5hbWVdLmFwcGx5KGN1cnJlbnQsIGFyZ3MpO1xyXG5cdFx0XHRcdH0gZWxzZSB7IHJldHVybiB1bmRlZmluZWQ7IH1cclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJiB0eXBlb2YgSFRNTEVsZW1lbnQgIT09IFwidW5kZWZpbmVkXCIgJiYgY3VycmVudCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ICYmIHBhcnQuc3RhcnRzV2l0aChcIkBcIikpIHtcclxuXHRcdFx0XHRcdGN1cnJlbnQgPSBjdXJyZW50LmdldEF0dHJpYnV0ZShwYXJ0LnNsaWNlKDEpKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKHR5cGVvZiBjdXJyZW50ID09PSBcIm9iamVjdFwiICYmIGN1cnJlbnQgIT09IG51bGwgJiYgcGFydCBpbiBjdXJyZW50KSB7IGN1cnJlbnQgPSBjdXJyZW50W3BhcnRdOyB9XHJcblx0XHRcdFx0ZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJiB0eXBlb2YgSFRNTEVsZW1lbnQgIT09IFwidW5kZWZpbmVkXCIgJiYgY3VycmVudCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7IGN1cnJlbnQgPSB1bmRlZmluZWQ7IH1cclxuXHRcdFx0XHRlbHNlIHsgY3VycmVudCA9IHVuZGVmaW5lZDsgfVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGN1cnJlbnQ7XHJcblx0fVxyXG59XHJcbi8vIFNldCB0aGUgbWFpbiBpbnN0YW5jZSB3aXRoIHN0YW5kYXJkICoqREJDLmluZnJpbmdlbWVudFNldHRpbmdzKiouXHJcbm5ldyBEQkMoKTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBS08sSUFBTSxNQUFOLE1BQU0sS0FBSTtBQUFBO0FBQUEsRUFFaEIsT0FBZSxXQUE2QixvQkFBSSxJQUFJO0FBQUEsRUFDcEQsT0FBZSxpQkFBd0Msb0JBQUksSUFBSTtBQUFBLEVBQy9ELE9BQWUsVUFBbUI7QUFDakMsV0FBTyxPQUFPLFdBQVcsY0FBYyxTQUFTO0FBQUEsRUFDakQ7QUFBQSxFQUNBLE9BQWUsT0FBTyxLQUE4QjtBQUNuRCxVQUFNLE9BQU8sT0FBTztBQUNwQixRQUFJLEtBQUksU0FBUyxJQUFJLElBQUksR0FBRztBQUMzQixhQUFPLEtBQUksU0FBUyxJQUFJLElBQUk7QUFBQSxJQUM3QjtBQUNBLFVBQU0sV0FBVyxLQUFJLGVBQWUsS0FBSSxRQUFRLEdBQUcsSUFBSTtBQUN2RCxRQUFJLFVBQVU7QUFDYixXQUFJLFNBQVMsSUFBSSxNQUFNLFFBQVE7QUFBQSxJQUNoQztBQUNBLFdB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
