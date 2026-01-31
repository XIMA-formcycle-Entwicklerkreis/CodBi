// ../../node_modules/xdbc/src/DBC.ts
var DBC = class _DBC {
  static {
    this.paramValueRequests = /* @__PURE__ */ new Map();
  }
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
      console.log(
        "ParamvalueProvider2 invoked for",
        propertyKey,
        "with args:",
        args,
        "this:",
        this,
        "this is function?:",
        typeof this === "function",
      );
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
              _DBC.resolveDBCPath(window, dbc).reportFieldInfringement(result, target, path, propertyKey, realValue);
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
              _DBC.resolveDBCPath(window, dbc).reportFieldInfringement(result, target, path, propertyKey, realValue);
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
              _DBC.resolveDBCPath(window, dbc).reportFieldInfringement(result, target, path, propertyKey, realValue);
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
  static decPostcondition(check, dbc, path = void 0) {
    return (target, propertyKey, descriptor) => {
      const originalMethod = descriptor.value;
      descriptor.value = (...args) => {
        if (!_DBC.resolveDBCPath(window, dbc).executionSettings.checkPostconditions) {
          console.log("Postcondition checks are disabled.");
          return;
        }
        const result = originalMethod.apply(this, args);
        const realValue = path ? _DBC.resolve(result, path) : result;
        const checkResult = check(realValue, target, propertyKey);
        if (typeof checkResult === "string") {
          _DBC
            .resolveDBCPath(window, dbc)
            .reportReturnvalueInfringement(checkResult, target, path, propertyKey, realValue);
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
  static decPrecondition(check, dbc, path = void 0) {
    return (target, methodName, parameterIndex) => {
      _DBC.requestParamValue(target, methodName, parameterIndex, (value) => {
        if (!_DBC.resolveDBCPath(window, dbc).executionSettings.checkPreconditions) {
          console.log("Precondition checks are disabled.");
          return;
        }
        const paths = path ? path.split("::") : [void 0];
        for (const singlePath of paths) {
          const realValue = singlePath ? _DBC.resolve(value, singlePath) : value;
          const result = check(realValue, target, methodName, parameterIndex);
          if (typeof result === "string") {
            _DBC
              .resolveDBCPath(window, dbc)
              .reportParameterInfringement(result, target, singlePath, methodName, parameterIndex, realValue);
          }
        }
      });
    };
  }
  /**
   * Reports a warning.
   *
   * @param message The message containing the warning. */
  reportWarning(message) {
    if (this.warningSettings.logToConsole) {
      console.warn(message);
    }
  }
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
      path,
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
  reportReturnvalueInfringement(message, target, path, method, value) {
    this.reportInfringement(
      `[ Return-value "${value}" did not fulfill one of it's contracts: ${message}]`,
      method,
      target,
      path,
    );
  }
  static {
    this.Infringement = class extends Error {
      /**
       * Constructs this {@link Error } by tagging the specified message-{@link string } as an XDBC-Infringement.
       *
       * @param message The {@link string } describing the infringement. */
      constructor(message) {
        super(`[ XDBC Infringement ${message}]`);
      }
    };
  }
  static {
    this.resolveDBCPath = (obj, path) => path?.split(".").reduce((accumulator, current) => accumulator[current], obj);
  }
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
    this.executionSettings = {
      checkPreconditions: true,
      checkPostconditions: true,
      checkInvariants: true,
    };
    this.warningSettings = { logToConsole: true };
    this.infringementSettings = { throwException: true, logToConsole: false };
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

export { DBC };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiREJDLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKipcclxuICogUHJvdmlkZXMgYSAqKkQqKmVzaWduICoqQioqeSAqKkMqKm9udHJhY3QgRnJhbWV3b3JrIHVzaW5nIGRlY29yYXRvcnMuXHJcbiAqXHJcbiAqIEByZW1hcmtzXHJcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoWERCQ0BXYVhDb2RlLm5ldCkgKi9cclxuZXhwb3J0IGNsYXNzIERCQyB7XHJcblx0Ly8gI3JlZ2lvbiBQYXJhbWV0ZXItdmFsdWUgcmVxdWVzdHMuXHJcblx0LyoqIFN0b3JlcyBhbGwgcmVxdWVzdCBmb3IgcGFyYW1ldGVyIHZhbHVlcyByZWdpc3RlcmVkIGJ5IHtAbGluayBkZWNQcmVjb25kaXRpb24gfS4gKi9cclxuXHRzdGF0aWMgcGFyYW1WYWx1ZVJlcXVlc3RzOiBNYXA8XHJcblx0XHRzdHJpbmcsXHJcblx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IEdvdHRhIGJlIGFueSBzaW5jZSBwYXJhbWV0ZXItdmFsdWVzIG1heSBiZSB1bmRlZmluZWQuXHJcblx0XHRNYXA8bnVtYmVyLCBBcnJheTwodmFsdWU6IGFueSkgPT4gdW5kZWZpbmVkPj5cclxuXHQ+ID0gbmV3IE1hcDxcclxuXHRcdHN0cmluZyxcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogR290dGEgYmUgYW55IHNpbmNlIHBhcmFtZXRlci12YWx1ZXMgbWF5IGJlIHVuZGVmaW5lZC5cclxuXHRcdE1hcDxudW1iZXIsIEFycmF5PCh2YWx1ZTogYW55KSA9PiB1bmRlZmluZWQ+PlxyXG5cdD4oKTtcclxuXHQvKipcclxuXHQgKiBHZW5lcmF0ZSBhIHVuaXF1ZSBrZXkgZm9yIHN0b3JpbmcgcGFyYW1ldGVyIHZhbHVlIHJlcXVlc3RzLlxyXG5cdCAqIEZvcm1hdDogXCJDbGFzc05hbWU6bWV0aG9kTmFtZVwiXHJcblx0ICovXHJcblx0cHJpdmF0ZSBzdGF0aWMgZ2V0UmVxdWVzdEtleSh0YXJnZXQ6IG9iamVjdCwgbWV0aG9kTmFtZTogc3RyaW5nIHwgc3ltYm9sKTogc3RyaW5nIHtcclxuXHRcdGNvbnN0IGNsYXNzTmFtZSA9IHR5cGVvZiB0YXJnZXQgPT09ICdmdW5jdGlvbicgPyB0YXJnZXQubmFtZSA6IHRhcmdldC5jb25zdHJ1Y3Rvcj8ubmFtZSB8fCAnVW5rbm93bic7XHJcblx0XHRyZXR1cm4gYCR7Y2xhc3NOYW1lfToke1N0cmluZyhtZXRob2ROYW1lKX1gO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBNYWtlIGEgcmVxdWVzdCB0byBnZXQgdGhlIHZhbHVlIG9mIGEgY2VydGFpbiBwYXJhbWV0ZXIgb2Ygc3BlY2lmaWMgbWV0aG9kIGluIGEgc3BlY2lmaWMge0BsaW5rIG9iamVjdCB9LlxyXG5cdCAqIFRoYXQgcmVxdWVzdCBnZXRzIGVubGlzdGVkIGluIHtAbGluayBwYXJhbVZhbHVlUmVxdWVzdHMgfSB3aGljaCBpcyB1c2VkIGJ5IHtAbGluayBQYXJhbXZhbHVlUHJvdmlkZXJ9IHRvIGludm9rZSB0aGVcclxuXHQgKiBnaXZlbiBcInJlY2VwdG9yXCIgd2l0aCB0aGUgcGFyYW1ldGVyIHZhbHVlIHN0b3JlZCBpbiB0aGVyZS4gVGh1cyBhIHBhcmFtZXRlciBkZWNvcmF0b3IgdXNpbmcgdGhpcyBtZXRob2Qgd2lsbFxyXG5cdCAqIG5vdCByZWNlaXZlIGFueSB2YWx1ZSBvZiB0aGUgdG9wIG1ldGhvZCBpcyBub3QgdGFnZ2VkIHdpdGgge0BsaW5rIFBhcmFtdmFsdWVQcm92aWRlcn0uXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdGFyZ2V0XHRcdFRoZSB7QGxpbmsgb2JqZWN0IH0gY29udGFpbmluZyB0aGUgbWV0aG9kIHdpdGggdGhlIHBhcmFtZXRlciB3aGljaCdzIHZhbHVlIGlzIHJlcXVlc3RlZC5cclxuXHQgKiBAcGFyYW0gbWV0aG9kTmFtZVx0VGhlIG5hbWUgb2YgdGhlIG1ldGhvZCB3aXRoIHRoZSBwYXJhbWV0ZXIgd2hpY2gncyB2YWx1ZSBpcyByZXF1ZXN0ZWQuXHJcblx0ICogQHBhcmFtIGluZGV4XHRcdFx0VGhlIGluZGV4IG9mIHRoZSBwYXJhbWV0ZXIgd2hpY2gncyB2YWx1ZSBpcyByZXF1ZXN0ZWQuXHJcblx0ICogQHBhcmFtIHJlY2VwdG9yXHRcdFRoZSBtZXRob2QgdGhlIHJlcXVlc3RlZCBwYXJhbWV0ZXItdmFsdWUgc2hhbGwgYmUgcGFzc2VkIHRvIHdoZW4gaXQgYmVjb21lcyBhdmFpbGFibGUuICovXHJcblx0cHJvdGVjdGVkIHN0YXRpYyByZXF1ZXN0UGFyYW1WYWx1ZShcclxuXHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0bWV0aG9kTmFtZTogc3RyaW5nIHwgc3ltYm9sLFxyXG5cdFx0aW5kZXg6IG51bWJlcixcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogR290dGEgYmUgYW55IHNpbmNlIHBhcmFtZXRlci12YWx1ZXMgbWF5IGJlIHVuZGVmaW5lZC5cclxuXHRcdHJlY2VwdG9yOiAodmFsdWU6IGFueSkgPT4gdW5kZWZpbmVkLFxyXG5cdCk6IHVuZGVmaW5lZCB7XHJcblx0XHRjb25zdCBrZXkgPSBEQkMuZ2V0UmVxdWVzdEtleSh0YXJnZXQsIG1ldGhvZE5hbWUpO1xyXG5cclxuXHRcdGlmIChEQkMucGFyYW1WYWx1ZVJlcXVlc3RzLmhhcyhrZXkpKSB7XHJcblx0XHRcdGlmIChEQkMucGFyYW1WYWx1ZVJlcXVlc3RzLmdldChrZXkpLmhhcyhpbmRleCkpIHtcclxuXHRcdFx0XHREQkMucGFyYW1WYWx1ZVJlcXVlc3RzLmdldChrZXkpLmdldChpbmRleCkucHVzaChyZWNlcHRvcik7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0REJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5nZXQoa2V5KS5zZXQoaW5kZXgsIG5ldyBBcnJheTwodmFsdWU6IHVua25vd24pID0+IHVuZGVmaW5lZD4ocmVjZXB0b3IpKTtcclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0REJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5zZXQoXHJcblx0XHRcdFx0a2V5LFxyXG5cdFx0XHRcdG5ldyBNYXA8bnVtYmVyLCBBcnJheTwodmFsdWU6IHVua25vd24pID0+IHVuZGVmaW5lZD4+KFtcclxuXHRcdFx0XHRcdFtpbmRleCwgbmV3IEFycmF5PCh2YWx1ZTogdW5rbm93bikgPT4gdW5kZWZpbmVkPihyZWNlcHRvcildLFxyXG5cdFx0XHRcdF0pLFxyXG5cdFx0XHQpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB1bmRlZmluZWQ7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IGNoZWNraW5nIHRoZSB7QGxpbmsgcGFyYW1WYWx1ZVJlcXVlc3RzIH0gZm9yIHZhbHVlLXJlcXVlc3RzIG9mIHRoZSBtZXRob2QncyBwYXJhbWV0ZXIgdGh1c1xyXG5cdCAqIGFsc28gdXNhYmxlIG9uIHNldHRlcnMuXHJcblx0ICogV2hlbiBmb3VuZCBpdCB3aWxsIGludm9rZSB0aGUgXCJyZWNlcHRvclwiIHJlZ2lzdGVyZWQgdGhlcmUsIGludGVyIGFsaWEgYnkge0BsaW5rIHJlcXVlc3RQYXJhbVZhbHVlIH0sIHdpdGggdGhlXHJcblx0ICogcGFyYW1ldGVyJ3MgdmFsdWUuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdGFyZ2V0IFx0XHRUaGUge0BsaW5rIG9iamVjdCB9IGhvc3RpbmcgdGhlIHRhZ2dlZCBtZXRob2QgYXMgcHJvdmlkZWQgYnkgdGhlIHJ1bnRpbWUuXHJcblx0ICogQHBhcmFtIHByb3BlcnR5S2V5IFx0VGhlIHRhZ2dlZCBtZXRob2QncyBuYW1lIGFzIHByb3ZpZGVkIGJ5IHRoZSBydW50aW1lLlxyXG5cdCAqIEBwYXJhbSBkZXNjcmlwdG9yIFx0VGhlIHtAbGluayBQcm9wZXJ0eURlc2NyaXB0b3IgfSBhcyBwcm92aWRlZCBieSB0aGUgcnVudGltZS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFRoZSB7QGxpbmsgUHJvcGVydHlEZXNjcmlwdG9yIH0gdGhhdCB3YXMgcGFzc2VkIGJ5IHRoZSBydW50aW1lLiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgUGFyYW12YWx1ZVByb3ZpZGVyKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRwcm9wZXJ0eUtleTogc3RyaW5nLFxyXG5cdFx0ZGVzY3JpcHRvcjogUHJvcGVydHlEZXNjcmlwdG9yLFxyXG5cdCk6IHZvaWQge1xyXG5cdFx0Y29uc3Qgb3JpZ2luYWxNZXRob2QgPSBkZXNjcmlwdG9yLnZhbHVlO1xyXG5cclxuXHJcblxyXG5cdFx0Ly8gQ2hlY2sgaWYgdGhpcyBpcyBhIHN0YXRpYyBtZXRob2Q6IHRhcmdldCBpcyBhIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIChub3QgcHJvdG90eXBlKVxyXG5cdFx0Y29uc3QgaXNTdGF0aWMgPSB0eXBlb2YgdGFyZ2V0ID09PSAnZnVuY3Rpb24nO1xyXG5cclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogR290dGEgYmUgYW55IHNpbmNlIHBhcmFtZXRlci12YWx1ZXMgbWF5IGJlIHVuZGVmaW5lZC5cclxuXHRcdGRlc2NyaXB0b3IudmFsdWUgPSBmdW5jdGlvbiAoLi4uYXJnczogYW55W10pIHtcclxuXHRcdFx0Y29uc29sZS5sb2coXCJQYXJhbXZhbHVlUHJvdmlkZXIyIGludm9rZWQgZm9yXCIsIHByb3BlcnR5S2V5LCBcIndpdGggYXJnczpcIiwgYXJncywgXCJ0aGlzOlwiLCB0aGlzLCBcInRoaXMgaXMgZnVuY3Rpb24/OlwiLCB0eXBlb2YgdGhpcyA9PT0gJ2Z1bmN0aW9uJyk7XHJcblx0XHRcdC8vICNyZWdpb24gICBDaGVjayBpZiBhIHZhbHVlIG9mIG9uZSBvZiB0aGUgbWV0aG9kJ3MgcGFyYW1ldGVyIGhhcyBiZWVuIHJlcXVlc3RlZCBhbmQgcGFzcyBpdCB0byB0aGVcclxuXHRcdFx0Ly8gICAgICAgICAgIHJlY2VwdG9yLCBpZiBzby5cclxuXHJcblx0XHRcdC8vIEZvciBzdGF0aWMgbWV0aG9kczogdGhpcyA9IGNvbnN0cnVjdG9yICBcclxuXHRcdFx0Ly8gRm9yIGluc3RhbmNlIG1ldGhvZHM6IHRoaXMgPSBpbnN0YW5jZSwgc28gdXNlIHRoaXMuY29uc3RydWN0b3JcclxuXHRcdFx0Y29uc3QgYWN0dWFsVGFyZ2V0ID0gaXNTdGF0aWMgPyB0aGlzIDogKHRoaXMgYXMgYW55KS5jb25zdHJ1Y3RvcjtcclxuXHRcdFx0Y29uc3Qga2V5ID0gREJDLmdldFJlcXVlc3RLZXkoYWN0dWFsVGFyZ2V0LCBwcm9wZXJ0eUtleSk7XHJcblxyXG5cdFx0XHRpZiAoREJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5oYXMoa2V5KSkge1xyXG5cdFx0XHRcdGZvciAoY29uc3QgaW5kZXggb2YgREJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5nZXQoa2V5KS5rZXlzKCkpIHtcclxuXHRcdFx0XHRcdGlmIChpbmRleCA8IGFyZ3MubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHRcdGZvciAoY29uc3QgcmVjZXB0b3Igb2YgREJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5nZXQoa2V5KS5nZXQoaW5kZXgpKSB7XHJcblx0XHRcdFx0XHRcdFx0cmVjZXB0b3IoYXJnc1tpbmRleF0pO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGNvbnNvbGUud2FybihcIk5vIHBhcmFtZXRlciB2YWx1ZSByZXF1ZXN0cyBmb3VuZCBmb3Iga2V5OlwiLCBrZXkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdC8vICNlbmRyZWdpb25cdENoZWNrIGlmIGEgdmFsdWUgb2Ygb25lIG9mIHRoZSBtZXRob2QncyBwYXJhbWV0ZXIgaGFzIGJlZW4gcmVxdWVzdGVkIGFuZCBwYXNzIGl0IHRvIHRoZVxyXG5cdFx0XHQvLyAgICAgICAgICAgICAgcmVjZXB0b3IsIGlmIHNvLlxyXG5cdFx0XHRyZXR1cm4gb3JpZ2luYWxNZXRob2QuYXBwbHkodGhpcywgYXJncyk7XHJcblx0XHR9O1xyXG5cdH1cclxuXHQvLyAjZW5kcmVnaW9uIFBhcmFtZXRlci12YWx1ZSByZXF1ZXN0cy5cclxuXHQvLyAjcmVnaW9uIENsYXNzXHJcblx0LyoqXHJcblx0ICogQSBwcm9wZXJ0eS1kZWNvcmF0b3IgZmFjdG9yeSBzZXJ2aW5nIGFzIGEgKipEKiplc2lnbiAqKkIqKnkgKipDKipvbnRyYWN0IEludmFyaWFudC5cclxuXHQgKiBUaGlzIGludmFyaWFudCBhaW1zIHRvIGNoZWNrIHRoZSBpbnN0YW5jZSBvZiB0aGUgY2xhc3Mgbm90IHRoZSB2YWx1ZSB0byBiZSBnZXQgb3Igc2V0LlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIGNvbnRyYWN0cyBUaGUge0BsaW5rIERCQyB9LUNvbnRyYWN0cyB0aGUgdmFsdWUgc2hhbGwgdXBob2xkLlxyXG5cdCAqXHJcblx0ICogQHRocm93cyBcdEEge0BsaW5rIERCQy5JbmZyaW5nZW1lbnQgfSB3aGVuZXZlciB0aGUgcHJvcGVydHkgaXMgdHJpZWQgdG8gYmUgZ2V0IG9yIHNldCB3aXRob3V0IHRoZSBpbnN0YW5jZSBvZiBpdCdzIGNsYXNzXHJcblx0ICogXHRcdFx0ZnVsZmlsbGluZyB0aGUgc3BlY2lmaWVkICoqY29udHJhY3RzKiouICovXHJcblx0cHVibGljIHN0YXRpYyBkZWNDbGFzc0ludmFyaWFudChcclxuXHRcdGNvbnRyYWN0czogQXJyYXk8e1xyXG5cdFx0XHRjaGVjazogKHRvQ2hlY2s6IHVua25vd24gfCBudWxsIHwgdW5kZWZpbmVkKSA9PiBib29sZWFuIHwgc3RyaW5nO1xyXG5cdFx0fT4sXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXHJcblx0KSB7XHJcblx0XHRyZXR1cm4gKHRhcmdldDogdW5rbm93biwgcHJvcGVydHlLZXk6IHN0cmluZyB8IHN5bWJvbCwgZGVzY3JpcHRvcjogUHJvcGVydHlEZXNjcmlwdG9yKSA9PiB7XHJcblx0XHRcdGlmICghREJDLnJlc29sdmVEQkNQYXRoKHdpbmRvdywgZGJjKS5leGVjdXRpb25TZXR0aW5ncy5jaGVja0ludmFyaWFudHMpIHtcclxuXHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdH1cclxuXHRcdFx0Y29uc3Qgb3JpZ2luYWxTZXR0ZXIgPSBkZXNjcmlwdG9yLnNldDtcclxuXHRcdFx0Y29uc3Qgb3JpZ2luYWxHZXR0ZXIgPSBkZXNjcmlwdG9yLmdldDtcclxuXHRcdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBOZWNlc3NhcnkgdG8gaW50ZXJjZXB0IFVOREVGSU5FRCBhbmQgTlVMTC5cclxuXHRcdFx0bGV0IHZhbHVlOiBhbnk7XHJcblx0XHRcdC8vICNyZWdpb24gUmVwbGFjZSBvcmlnaW5hbCBwcm9wZXJ0eS5cclxuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgcHJvcGVydHlLZXksIHtcclxuXHRcdFx0XHRnZXQoKSB7XHJcblx0XHRcdFx0XHRpZiAoXHJcblx0XHRcdFx0XHRcdCFEQkMucmVzb2x2ZURCQ1BhdGgod2luZG93LCBkYmMpLmV4ZWN1dGlvblNldHRpbmdzLmNoZWNrSW52YXJpYW50c1xyXG5cdFx0XHRcdFx0KSB7XHJcblx0XHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRjb25zdCByZWFsVmFsdWUgPSBwYXRoID8gREJDLnJlc29sdmUodGhpcywgcGF0aCkgOiB0aGlzO1xyXG5cdFx0XHRcdFx0Ly8gI3JlZ2lvbiBDaGVjayBpZiBhbGwgXCJjb250cmFjdHNcIiBhcmUgZnVsZmlsbGVkLlxyXG5cdFx0XHRcdFx0Zm9yIChjb25zdCBjb250cmFjdCBvZiBjb250cmFjdHMpIHtcclxuXHRcdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gY29udHJhY3QuY2hlY2socmVhbFZhbHVlKTtcclxuXHJcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YgcmVzdWx0ID09PSBcInN0cmluZ1wiKSB7XHJcblx0XHRcdFx0XHRcdFx0REJDLnJlc29sdmVEQkNQYXRoKHdpbmRvdywgZGJjKS5yZXBvcnRGaWVsZEluZnJpbmdlbWVudChcclxuXHRcdFx0XHRcdFx0XHRcdHJlc3VsdCxcclxuXHRcdFx0XHRcdFx0XHRcdHRhcmdldCBhcyBvYmplY3QsXHJcblx0XHRcdFx0XHRcdFx0XHRwYXRoLFxyXG5cdFx0XHRcdFx0XHRcdFx0cHJvcGVydHlLZXkgYXMgc3RyaW5nLFxyXG5cdFx0XHRcdFx0XHRcdFx0cmVhbFZhbHVlLFxyXG5cdFx0XHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vICNlbmRyZWdpb24gQ2hlY2sgaWYgYWxsIFwiY29udHJhY3RzXCIgYXJlIGZ1bGZpbGxlZC5cclxuXHRcdFx0XHRcdHJldHVybiBvcmlnaW5hbEdldHRlcltwcm9wZXJ0eUtleV07XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRzZXQobmV3VmFsdWUpIHtcclxuXHRcdFx0XHRcdGlmIChcclxuXHRcdFx0XHRcdFx0IURCQy5yZXNvbHZlREJDUGF0aCh3aW5kb3csIGRiYykuZXhlY3V0aW9uU2V0dGluZ3MuY2hlY2tJbnZhcmlhbnRzXHJcblx0XHRcdFx0XHQpIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdGNvbnN0IHJlYWxWYWx1ZSA9IHBhdGggPyBEQkMucmVzb2x2ZSh0aGlzLCBwYXRoKSA6IHRoaXM7XHJcblx0XHRcdFx0XHQvLyAjcmVnaW9uIENoZWNrIGlmIGFsbCBcImNvbnRyYWN0c1wiIGFyZSBmdWxmaWxsZWQuXHJcblx0XHRcdFx0XHRmb3IgKGNvbnN0IGNvbnRyYWN0IG9mIGNvbnRyYWN0cykge1xyXG5cdFx0XHRcdFx0XHRjb25zdCByZXN1bHQgPSBjb250cmFjdC5jaGVjayhyZWFsVmFsdWUpO1xyXG5cclxuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiByZXN1bHQgPT09IFwic3RyaW5nXCIpIHtcclxuXHRcdFx0XHRcdFx0XHREQkMucmVzb2x2ZURCQ1BhdGgod2luZG93LCBkYmMpLnJlcG9ydEZpZWxkSW5mcmluZ2VtZW50KFxyXG5cdFx0XHRcdFx0XHRcdFx0cmVzdWx0LFxyXG5cdFx0XHRcdFx0XHRcdFx0dGFyZ2V0IGFzIG9iamVjdCxcclxuXHRcdFx0XHRcdFx0XHRcdHBhdGgsXHJcblx0XHRcdFx0XHRcdFx0XHRwcm9wZXJ0eUtleSBhcyBzdHJpbmcsXHJcblx0XHRcdFx0XHRcdFx0XHRyZWFsVmFsdWUsXHJcblx0XHRcdFx0XHRcdFx0KTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0Ly8gI2VuZHJlZ2lvbiBDaGVjayBpZiBhbGwgXCJjb250cmFjdHNcIiBhcmUgZnVsZmlsbGVkLlxyXG5cdFx0XHRcdFx0dmFsdWUgPSBuZXdWYWx1ZTtcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdGVudW1lcmFibGU6IHRydWUsXHJcblx0XHRcdFx0Y29uZmlndXJhYmxlOiB0cnVlLFxyXG5cdFx0XHR9KTtcclxuXHRcdFx0Ly8gI2VuZHJlZ2lvbiBSZXBsYWNlIG9yaWdpbmFsIHByb3BlcnR5LlxyXG5cdFx0fTtcclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBDbGFzc1xyXG5cdC8vICNyZWdpb24gSW52YXJpYW50XHJcblx0LyoqXHJcblx0ICogQSBwcm9wZXJ0eS1kZWNvcmF0b3IgZmFjdG9yeSBzZXJ2aW5nIGFzIGEgKipEKiplc2lnbiAqKkIqKnkgKipDKipvbnRyYWN0IEludmFyaWFudC5cclxuXHQgKiBTaW5jZSB0aGUgdmFsdWUgbXVzdCBiZSBpbml0aWFsaXplZCBvciBzZXQgYWNjb3JkaW5nIHRvIHRoZSBzcGVjaWZpZWQgKipjb250cmFjdHMqKiB0aGUgdmFsdWUgd2lsbCBvbmx5IGJlIGNoZWNrZWRcclxuXHQgKiB3aGVuIGFzc2lnbmluZyBpdC5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBjb250cmFjdHMgVGhlIHtAbGluayBEQkMgfS1Db250cmFjdHMgdGhlIHZhbHVlIHNoYWxsIHVwaG9sZC5cclxuXHQgKlxyXG5cdCAqIEB0aHJvd3MgXHRBIHtAbGluayBEQkMuSW5mcmluZ2VtZW50IH0gd2hlbmV2ZXIgdGhlIHByb3BlcnR5IGlzIHRyaWVkIHRvIGJlIHNldCB0byBhIHZhbHVlIHRoYXQgZG9lcyBub3QgY29tcGx5IHRvIHRoZVxyXG5cdCAqIFx0XHRcdHNwZWNpZmllZCAqKmNvbnRyYWN0cyoqLCBieSB0aGUgcmV0dXJuZWQgbWV0aG9kLiovXHJcblx0cHVibGljIHN0YXRpYyBkZWNJbnZhcmlhbnQoXHJcblx0XHRjb250cmFjdHM6IEFycmF5PHtcclxuXHRcdFx0Y2hlY2s6ICh0b0NoZWNrOiB1bmtub3duIHwgbnVsbCB8IHVuZGVmaW5lZCkgPT4gYm9vbGVhbiB8IHN0cmluZztcclxuXHRcdH0+LFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjID0gXCJXYVhDb2RlLkRCQ1wiLFxyXG5cdCkge1xyXG5cdFx0cmV0dXJuICh0YXJnZXQ6IHVua25vd24sIHByb3BlcnR5S2V5OiBzdHJpbmcgfCBzeW1ib2wpID0+IHtcclxuXHRcdFx0aWYgKCFEQkMucmVzb2x2ZURCQ1BhdGgod2luZG93LCBkYmMpLmV4ZWN1dGlvblNldHRpbmdzLmNoZWNrSW52YXJpYW50cykge1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IE5lY2Vzc2FyeSB0byBpbnRlcmNlcHQgVU5ERUZJTkVEIGFuZCBOVUxMLlxyXG5cdFx0XHRsZXQgdmFsdWU6IGFueTtcclxuXHRcdFx0Ly8gI3JlZ2lvbiBSZXBsYWNlIG9yaWdpbmFsIHByb3BlcnR5LlxyXG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBwcm9wZXJ0eUtleSwge1xyXG5cdFx0XHRcdHNldChuZXdWYWx1ZSkge1xyXG5cdFx0XHRcdFx0aWYgKFxyXG5cdFx0XHRcdFx0XHQhREJDLnJlc29sdmVEQkNQYXRoKHdpbmRvdywgZGJjKS5leGVjdXRpb25TZXR0aW5ncy5jaGVja0ludmFyaWFudHNcclxuXHRcdFx0XHRcdCkge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0Y29uc3QgcmVhbFZhbHVlID0gcGF0aCA/IERCQy5yZXNvbHZlKG5ld1ZhbHVlLCBwYXRoKSA6IG5ld1ZhbHVlO1xyXG5cdFx0XHRcdFx0Ly8gI3JlZ2lvbiBDaGVjayBpZiBhbGwgXCJjb250cmFjdHNcIiBhcmUgZnVsZmlsbGVkLlxyXG5cdFx0XHRcdFx0Zm9yIChjb25zdCBjb250cmFjdCBvZiBjb250cmFjdHMpIHtcclxuXHRcdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gY29udHJhY3QuY2hlY2socmVhbFZhbHVlKTtcclxuXHJcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YgcmVzdWx0ID09PSBcInN0cmluZ1wiKSB7XHJcblx0XHRcdFx0XHRcdFx0REJDLnJlc29sdmVEQkNQYXRoKHdpbmRvdywgZGJjKS5yZXBvcnRGaWVsZEluZnJpbmdlbWVudChcclxuXHRcdFx0XHRcdFx0XHRcdHJlc3VsdCxcclxuXHRcdFx0XHRcdFx0XHRcdHRhcmdldCBhcyBvYmplY3QsXHJcblx0XHRcdFx0XHRcdFx0XHRwYXRoLFxyXG5cdFx0XHRcdFx0XHRcdFx0cHJvcGVydHlLZXkgYXMgc3RyaW5nLFxyXG5cdFx0XHRcdFx0XHRcdFx0cmVhbFZhbHVlLFxyXG5cdFx0XHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vICNlbmRyZWdpb24gQ2hlY2sgaWYgYWxsIFwiY29udHJhY3RzXCIgYXJlIGZ1bGZpbGxlZC5cclxuXHRcdFx0XHRcdHZhbHVlID0gbmV3VmFsdWU7XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRlbnVtZXJhYmxlOiB0cnVlLFxyXG5cdFx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcclxuXHRcdFx0fSk7XHJcblx0XHRcdC8vICNlbmRyZWdpb24gUmVwbGFjZSBvcmlnaW5hbCBwcm9wZXJ0eS5cclxuXHRcdH07XHJcblx0fVxyXG5cdC8vICNlbmRyZWdpb24gSW52YXJpYW50XHJcblx0Ly8gI3JlZ2lvbiBQb3N0Y29uZGl0aW9uXHJcblx0LyoqXHJcblx0ICogQSBtZXRob2QgZGVjb3JhdG9yIGZhY3RvcnkgY2hlY2tpbmcgdGhlIHJlc3VsdCBvZiBhIG1ldGhvZCB3aGVuZXZlciBpdCBpcyBpbnZva2VkIHRodXMgYWxzbyB1c2FibGUgb24gZ2V0dGVycy5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBjaGVja1x0VGhlICoqKHRvQ2hlY2s6IGFueSwgb2JqZWN0LCBzdHJpbmcpID0+IGJvb2xlYW4gfCBzdHJpbmcqKiB0byB1c2UgZm9yIGNoZWNraW5nLlxyXG5cdCAqIEBwYXJhbSBkYmNcdFNlZSB7QGxpbmsgREJDLnJlc29sdmVEQkNQYXRoIH0uXHJcblx0ICogQHBhcmFtIHBhdGhcdFRoZSBkb3R0ZWQgcGF0aCByZWZlcnJpbmcgdG8gdGhlIGFjdHVhbCB2YWx1ZSB0byBjaGVjaywgc3RhcnRpbmcgZm9ybSB0aGUgc3BlY2lmaWVkIG9uZS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFRoZSAqKiggdGFyZ2V0IDogb2JqZWN0LCBwcm9wZXJ0eUtleSA6IHN0cmluZywgZGVzY3JpcHRvciA6IFByb3BlcnR5RGVzY3JpcHRvciApIDogUHJvcGVydHlEZXNjcmlwdG9yKipcclxuXHQgKiBcdFx0XHRpbnZva2VkIGJ5IFR5cGVzY3JpcHQuXHJcblx0ICovXHJcblx0cHVibGljIHN0YXRpYyBkZWNQb3N0Y29uZGl0aW9uKFxyXG5cdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBOZWNlc3NhcnkgdG8gaW50ZXJjZXB0IFVOREVGSU5FRCBhbmQgTlVMTC5cclxuXHRcdGNoZWNrOiAodG9DaGVjazogYW55LCBvYmplY3QsIHN0cmluZykgPT4gYm9vbGVhbiB8IHN0cmluZyxcclxuXHRcdGRiYzogc3RyaW5nLFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdCkge1xyXG5cdFx0cmV0dXJuIChcclxuXHRcdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRcdHByb3BlcnR5S2V5OiBzdHJpbmcsXHJcblx0XHRcdGRlc2NyaXB0b3I6IFByb3BlcnR5RGVzY3JpcHRvcixcclxuXHRcdCk6IFByb3BlcnR5RGVzY3JpcHRvciA9PiB7XHJcblx0XHRcdGNvbnN0IG9yaWdpbmFsTWV0aG9kID0gZGVzY3JpcHRvci52YWx1ZTtcclxuXHRcdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBOZWNlc3NhcnkgdG8gaW50ZXJjZXB0IFVOREVGSU5FRCBhbmQgTlVMTC5cclxuXHRcdFx0ZGVzY3JpcHRvci52YWx1ZSA9ICguLi5hcmdzOiBhbnlbXSkgPT4ge1xyXG5cdFx0XHRcdGlmIChcclxuXHRcdFx0XHRcdCFEQkMucmVzb2x2ZURCQ1BhdGgod2luZG93LCBkYmMpLmV4ZWN1dGlvblNldHRpbmdzLmNoZWNrUG9zdGNvbmRpdGlvbnNcclxuXHRcdFx0XHQpIHtcclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiUG9zdGNvbmRpdGlvbiBjaGVja3MgYXJlIGRpc2FibGVkLlwiKTtcclxuXHJcblx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L2NvbXBsZXhpdHkvbm9UaGlzSW5TdGF0aWM6IDxleHBsYW5hdGlvbj5cclxuXHRcdFx0XHRjb25zdCByZXN1bHQgPSBvcmlnaW5hbE1ldGhvZC5hcHBseSh0aGlzLCBhcmdzKTtcclxuXHRcdFx0XHRjb25zdCByZWFsVmFsdWUgPSBwYXRoID8gREJDLnJlc29sdmUocmVzdWx0LCBwYXRoKSA6IHJlc3VsdDtcclxuXHRcdFx0XHRjb25zdCBjaGVja1Jlc3VsdCA9IGNoZWNrKHJlYWxWYWx1ZSwgdGFyZ2V0LCBwcm9wZXJ0eUtleSk7XHJcblxyXG5cdFx0XHRcdGlmICh0eXBlb2YgY2hlY2tSZXN1bHQgPT09IFwic3RyaW5nXCIpIHtcclxuXHRcdFx0XHRcdERCQy5yZXNvbHZlREJDUGF0aCh3aW5kb3csIGRiYykucmVwb3J0UmV0dXJudmFsdWVJbmZyaW5nZW1lbnQoXHJcblx0XHRcdFx0XHRcdGNoZWNrUmVzdWx0LFxyXG5cdFx0XHRcdFx0XHR0YXJnZXQsXHJcblx0XHRcdFx0XHRcdHBhdGgsXHJcblx0XHRcdFx0XHRcdHByb3BlcnR5S2V5LFxyXG5cdFx0XHRcdFx0XHRyZWFsVmFsdWUsXHJcblx0XHRcdFx0XHQpO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0cmV0dXJuIHJlc3VsdDtcclxuXHRcdFx0fTtcclxuXHJcblx0XHRcdHJldHVybiBkZXNjcmlwdG9yO1xyXG5cdFx0fTtcclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBQb3N0Y29uZGl0aW9uXHJcblx0Ly8gI3JlZ2lvbiBEZWNvcmF0b3JcclxuXHQvLyAjcmVnaW9uIFByZWNvbmRpdGlvblxyXG5cdC8qKlxyXG5cdCAqIEEgcGFyYW1ldGVyLWRlY29yYXRvciBmYWN0b3J5IHRoYXQgcmVxdWVzdHMgdGhlIHRhZ2dlZCBwYXJhbWV0ZXIncyB2YWx1ZSBwYXNzaW5nIGl0IHRvIHRoZSBwcm92aWRlZFxyXG5cdCAqIFwiY2hlY2tcIi1tZXRob2Qgd2hlbiB0aGUgdmFsdWUgYmVjb21lcyBhdmFpbGFibGUuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gY2hlY2tcdFRoZSBcIiggdW5rbm93biApID0+IHZvaWRcIiB0byBiZSBpbnZva2VkIGFsb25nIHdpdGggdGhlIHRhZ2dlZCBwYXJhbWV0ZXIncyB2YWx1ZSBhcyBzb29uXHJcblx0ICogXHRcdFx0XHRhcyBpdCBiZWNvbWVzIGF2YWlsYWJsZS5cclxuXHQgKiBAcGFyYW0gZGJjICBcdFNlZSB7QGxpbmsgREJDLnJlc29sdmVEQkNQYXRoIH0uXHJcblx0ICogQHBhcmFtIHBhdGhcdFRoZSBkb3R0ZWQgcGF0aCByZWZlcnJpbmcgdG8gdGhlIGFjdHVhbCB2YWx1ZSB0byBjaGVjaywgc3RhcnRpbmcgZm9ybSB0aGUgc3BlY2lmaWVkIG9uZS5cclxuXHQgKiBcdFx0XHRcdE1heSBjb250YWluIDo6IHRvIHNlcGFyYXRlIG11bHRpcGxlIHBhdGhzLlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgVGhlICoqKHRhcmdldDogb2JqZWN0LCBtZXRob2ROYW1lOiBzdHJpbmcgfCBzeW1ib2wsIHBhcmFtZXRlckluZGV4OiBudW1iZXIgKSA9PiB2b2lkKiogaW52b2tlZCBieSBUeXBlc2NyaXB0LSAqL1xyXG5cdHByb3RlY3RlZCBzdGF0aWMgZGVjUHJlY29uZGl0aW9uKFxyXG5cdFx0Y2hlY2s6ICh1bmtub3duLCBvYmplY3QsIHN0cmluZywgbnVtYmVyKSA9PiBib29sZWFuIHwgc3RyaW5nLFxyXG5cdFx0ZGJjOiBzdHJpbmcsXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0KTogKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRtZXRob2ROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXHJcblx0XHRwYXJhbWV0ZXJJbmRleDogbnVtYmVyLFxyXG5cdCkgPT4gdm9pZCB7XHJcblx0XHRyZXR1cm4gKFxyXG5cdFx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdFx0bWV0aG9kTmFtZTogc3RyaW5nIHwgc3ltYm9sLFxyXG5cdFx0XHRwYXJhbWV0ZXJJbmRleDogbnVtYmVyLFxyXG5cdFx0KTogdm9pZCA9PiB7XHJcblx0XHRcdERCQy5yZXF1ZXN0UGFyYW1WYWx1ZShcclxuXHRcdFx0XHR0YXJnZXQsXHJcblx0XHRcdFx0bWV0aG9kTmFtZSxcclxuXHRcdFx0XHRwYXJhbWV0ZXJJbmRleCxcclxuXHRcdFx0XHQodmFsdWU6IHVua25vd24pID0+IHtcclxuXHRcdFx0XHRcdGlmIChcclxuXHRcdFx0XHRcdFx0IURCQy5yZXNvbHZlREJDUGF0aCh3aW5kb3csIGRiYykuZXhlY3V0aW9uU2V0dGluZ3NcclxuXHRcdFx0XHRcdFx0XHQuY2hlY2tQcmVjb25kaXRpb25zXHJcblx0XHRcdFx0XHQpIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coXCJQcmVjb25kaXRpb24gY2hlY2tzIGFyZSBkaXNhYmxlZC5cIik7XHJcblxyXG5cdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRjb25zdCBwYXRocyA9IHBhdGggPyBwYXRoLnNwbGl0KFwiOjpcIikgOiBbdW5kZWZpbmVkXTtcclxuXHJcblx0XHRcdFx0XHRmb3IgKGNvbnN0IHNpbmdsZVBhdGggb2YgcGF0aHMpIHtcclxuXHRcdFx0XHRcdFx0Y29uc3QgcmVhbFZhbHVlID0gc2luZ2xlUGF0aCA/IERCQy5yZXNvbHZlKHZhbHVlLCBzaW5nbGVQYXRoKSA6IHZhbHVlO1xyXG5cdFx0XHRcdFx0XHRjb25zdCByZXN1bHQgPSBjaGVjayhyZWFsVmFsdWUsIHRhcmdldCwgbWV0aG9kTmFtZSwgcGFyYW1ldGVySW5kZXgpO1xyXG5cclxuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiByZXN1bHQgPT09IFwic3RyaW5nXCIpIHtcclxuXHRcdFx0XHRcdFx0XHREQkMucmVzb2x2ZURCQ1BhdGgod2luZG93LCBkYmMpLnJlcG9ydFBhcmFtZXRlckluZnJpbmdlbWVudChcclxuXHRcdFx0XHRcdFx0XHRcdHJlc3VsdCxcclxuXHRcdFx0XHRcdFx0XHRcdHRhcmdldCxcclxuXHRcdFx0XHRcdFx0XHRcdHNpbmdsZVBhdGgsXHJcblx0XHRcdFx0XHRcdFx0XHRtZXRob2ROYW1lIGFzIHN0cmluZyxcclxuXHRcdFx0XHRcdFx0XHRcdHBhcmFtZXRlckluZGV4LFxyXG5cdFx0XHRcdFx0XHRcdFx0cmVhbFZhbHVlLFxyXG5cdFx0XHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9LFxyXG5cdFx0XHQpO1xyXG5cdFx0fTtcclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBQcmVjb25kaXRpb25cclxuXHQvLyAjZW5kcmVnaW9uIERlY29yYXRvclxyXG5cdC8vICNyZWdpb24gRXhlY3V0aW9uIEhhbmRsaW5nXHJcblx0LyoqIFN0b3JlcyBzZXR0aW5ncyBjb25jZXJuaW5nIHRoZSBleGVjdXRpb24gb2YgY2hlY2tzLiAqL1xyXG5cdHB1YmxpYyBleGVjdXRpb25TZXR0aW5nczoge1xyXG5cdFx0Y2hlY2tQcmVjb25kaXRpb25zOiBib29sZWFuO1xyXG5cdFx0Y2hlY2tQb3N0Y29uZGl0aW9uczogYm9vbGVhbjtcclxuXHRcdGNoZWNrSW52YXJpYW50czogYm9vbGVhbjtcclxuXHR9ID0ge1xyXG5cdFx0XHRjaGVja1ByZWNvbmRpdGlvbnM6IHRydWUsXHJcblx0XHRcdGNoZWNrUG9zdGNvbmRpdGlvbnM6IHRydWUsXHJcblx0XHRcdGNoZWNrSW52YXJpYW50czogdHJ1ZSxcclxuXHRcdH07XHJcblx0Ly8gI2VuZHJlZ2lvbiBFeGVjdXRpb24gSGFuZGxpbmdcclxuXHQvLyAjcmVnaW9uIFdhcm5pbmcgaGFuZGxpbmcuXHJcblx0LyoqIFN0b3JlcyBzZXR0aW5ncyBjb25jZXJuaW5nIHdhcm5pbmdzLiAqL1xyXG5cdHB1YmxpYyB3YXJuaW5nU2V0dGluZ3M6IHtcclxuXHRcdGxvZ1RvQ29uc29sZTogYm9vbGVhbjtcclxuXHR9ID0geyBsb2dUb0NvbnNvbGU6IHRydWUgfTtcclxuXHQvKipcclxuXHQgKiBSZXBvcnRzIGEgd2FybmluZy5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBtZXNzYWdlIFRoZSBtZXNzYWdlIGNvbnRhaW5pbmcgdGhlIHdhcm5pbmcuICovXHJcblx0cHJvdGVjdGVkIHJlcG9ydFdhcm5pbmcobWVzc2FnZTogc3RyaW5nKTogdW5kZWZpbmVkIHtcclxuXHRcdGlmICh0aGlzLndhcm5pbmdTZXR0aW5ncy5sb2dUb0NvbnNvbGUpIHtcclxuXHRcdFx0Y29uc29sZS53YXJuKG1lc3NhZ2UpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHQvLyAjZW5kcmVnaW9uIFdhcm5pbmcgaGFuZGxpbmcuXHJcblx0Ly8gI3JlZ2lvbiBpbmZyaW5nZW1lbnQgaGFuZGxpbmcuXHJcblx0LyoqIFN0b3JlcyB0aGUgc2V0dGluZ3MgY29uY2VybmluZyBpbmZyaW5nZW1lbnRzICovXHJcblx0cHVibGljIGluZnJpbmdlbWVudFNldHRpbmdzOiB7XHJcblx0XHR0aHJvd0V4Y2VwdGlvbjogYm9vbGVhbjtcclxuXHRcdGxvZ1RvQ29uc29sZTogYm9vbGVhbjtcclxuXHR9ID0geyB0aHJvd0V4Y2VwdGlvbjogdHJ1ZSwgbG9nVG9Db25zb2xlOiBmYWxzZSB9O1xyXG5cdC8qKlxyXG5cdCAqIFJlcG9ydHMgYW4gaW5mcmluZ2VtZW50IGFjY29yZGluZyB0byB0aGUge0BsaW5rIGluZnJpbmdlbWVudFNldHRpbmdzIH0gYWxzbyBnZW5lcmF0aW5nIGEgcHJvcGVyIHtAbGluayBzdHJpbmcgfS13cmFwcGVyXHJcblx0ICogZm9yIHRoZSBnaXZlbiBcIm1lc3NhZ2VcIiAmIHZpb2xhdG9yLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIG1lc3NhZ2VcdFRoZSB7QGxpbmsgc3RyaW5nIH0gZGVzY3JpYmluZyB0aGUgaW5mcmluZ2VtZW50IGFuZCBpdCdzIHByb3ZlbmllbmNlLlxyXG5cdCAqIEBwYXJhbSB2aW9sYXRvciBcdFRoZSB7QGxpbmsgc3RyaW5nIH0gZGVzY3JpYmluZyBvciBuYW1pbmcgdGhlIHZpb2xhdG9yLiAqL1xyXG5cdHByb3RlY3RlZCByZXBvcnRJbmZyaW5nZW1lbnQoXHJcblx0XHRtZXNzYWdlOiBzdHJpbmcsXHJcblx0XHR2aW9sYXRvcjogc3RyaW5nLFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRwYXRoOiBzdHJpbmcsXHJcblx0KTogdW5kZWZpbmVkIHtcclxuXHRcdGNvbnN0IGZpbmFsTWVzc2FnZTogc3RyaW5nID0gYFsgRnJvbSBcIiR7dmlvbGF0b3J9XCIke3BhdGggPyBgJ3MgbWVtYmVyIFwiJHtwYXRofVwiYCA6IFwiXCJ9JHt0eXBlb2YgdGFyZ2V0ID09PSBcImZ1bmN0aW9uXCIgPyBgIGluIFwiJHt0YXJnZXQubmFtZX1cImAgOiB0eXBlb2YgdGFyZ2V0ID09PSBcIm9iamVjdFwiICYmIHRhcmdldCAhPT0gbnVsbCAmJiB0eXBlb2YgdGFyZ2V0LmNvbnN0cnVjdG9yID09PSBcImZ1bmN0aW9uXCIgPyBgIGluIFwiJHt0YXJnZXQuY29uc3RydWN0b3IubmFtZX1cImAgOiBcIlwifTogJHttZXNzYWdlfV1gO1xyXG5cclxuXHRcdGlmICh0aGlzLmluZnJpbmdlbWVudFNldHRpbmdzLnRocm93RXhjZXB0aW9uKSB7XHJcblx0XHRcdHRocm93IG5ldyBEQkMuSW5mcmluZ2VtZW50KGZpbmFsTWVzc2FnZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHRoaXMuaW5mcmluZ2VtZW50U2V0dGluZ3MubG9nVG9Db25zb2xlKSB7XHJcblx0XHRcdGNvbnNvbGUubG9nKGZpbmFsTWVzc2FnZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIFJlcG9ydHMgYSBwYXJhbWV0ZXItaW5mcmluZ2VtZW50IHZpYSB7QGxpbmsgcmVwb3J0SW5mcmluZ2VtZW50IH0gYWxzbyBnZW5lcmF0aW5nIGEgcHJvcGVyIHtAbGluayBzdHJpbmcgfS13cmFwcGVyXHJcblx0ICogZm9yIHRoZSBnaXZlbiBcIm1lc3NhZ2VcIixcIm1ldGhvZFwiLCBwYXJhbWV0ZXItXCJpbmRleFwiICYgdmFsdWUuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gbWVzc2FnZVx0VGhlIHtAbGluayBzdHJpbmcgfSBkZXNjcmliaW5nIHRoZSBpbmZyaW5nZW1lbnQgYW5kIGl0J3MgcHJvdmVuaWVuY2UuXHJcblx0ICogQHBhcmFtIG1ldGhvZCBcdFRoZSB7QGxpbmsgc3RyaW5nIH0gZGVzY3JpYmluZyBvciBuYW1pbmcgdGhlIHZpb2xhdG9yLlxyXG5cdCAqIEBwYXJhbSBpbmRleFx0XHRUaGUgaW5kZXggb2YgdGhlIHBhcmFtZXRlciB3aXRoaW4gdGhlIGFyZ3VtZW50IGxpc3RpbmcuXHJcblx0ICogQHBhcmFtIHZhbHVlIFx0VGhlIHBhcmFtZXRlcidzIHZhbHVlLiAqL1xyXG5cdHB1YmxpYyByZXBvcnRQYXJhbWV0ZXJJbmZyaW5nZW1lbnQoXHJcblx0XHRtZXNzYWdlOiBzdHJpbmcsXHJcblx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdHBhdGg6IHN0cmluZyxcclxuXHRcdG1ldGhvZDogc3RyaW5nLFxyXG5cdFx0aW5kZXg6IG51bWJlcixcclxuXHRcdHZhbHVlOiB1bmtub3duLFxyXG5cdCk6IHVuZGVmaW5lZCB7XHJcblx0XHRjb25zdCBwcm9wZXJJbmRleCA9IGluZGV4ICsgMTtcclxuXHJcblx0XHR0aGlzLnJlcG9ydEluZnJpbmdlbWVudChcclxuXHRcdFx0YFsgUGFyYW1ldGVyLXZhbHVlIFwiJHt2YWx1ZX1cIiBvZiB0aGUgJHtwcm9wZXJJbmRleH0ke3Byb3BlckluZGV4ID09PSAxID8gXCJzdFwiIDogcHJvcGVySW5kZXggPT09IDIgPyBcIm5kXCIgOiBwcm9wZXJJbmRleCA9PT0gMyA/IFwicmRcIiA6IFwidGhcIn0gcGFyYW1ldGVyIGRpZCBub3QgZnVsZmlsbCBvbmUgb2YgaXQncyBjb250cmFjdHM6ICR7bWVzc2FnZX1dYCxcclxuXHRcdFx0bWV0aG9kLFxyXG5cdFx0XHR0YXJnZXQsXHJcblx0XHRcdHBhdGgsXHJcblx0XHQpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBSZXBvcnRzIGEgZmllbGQtaW5mcmluZ2VtZW50IHZpYSB7QGxpbmsgcmVwb3J0SW5mcmluZ2VtZW50IH0gYWxzbyBnZW5lcmF0aW5nIGEgcHJvcGVyIHtAbGluayBzdHJpbmcgfS13cmFwcGVyXHJcblx0ICogZm9yIHRoZSBnaXZlbiAqKm1lc3NhZ2UqKiAmICoqbmFtZSoqLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIG1lc3NhZ2VcdEEge0BsaW5rIHN0cmluZyB9IGRlc2NyaWJpbmcgdGhlIGluZnJpbmdlbWVudCBhbmQgaXQncyBwcm92ZW5pZW5jZS5cclxuXHQgKiBAcGFyYW0ga2V5IFx0XHRUaGUgcHJvcGVydHkga2V5LlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRcdFRoZSBkb3R0ZWQtcGF0aCB7QGxpbmsgc3RyaW5nIH0gdGhhdCBsZWFkcyB0byB0aGUgdmFsdWUgbm90IGZ1bGZpbGxpbmcgdGhlIGNvbnRyYWN0IHN0YXJ0aW5nIGZyb21cclxuXHQgKiBcdFx0XHRcdFx0dGhlIHRhZ2dlZCBvbmUuXHJcblx0ICogQHBhcmFtIHZhbHVlXHRcdFRoZSB2YWx1ZSBub3QgZnVsZmlsbGluZyBhIGNvbnRyYWN0LiAqL1xyXG5cdHB1YmxpYyByZXBvcnRGaWVsZEluZnJpbmdlbWVudChcclxuXHRcdG1lc3NhZ2U6IHN0cmluZyxcclxuXHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0cGF0aDogc3RyaW5nLFxyXG5cdFx0a2V5OiBzdHJpbmcsXHJcblx0XHR2YWx1ZTogdW5rbm93bixcclxuXHQpOiB1bmRlZmluZWQge1xyXG5cdFx0dGhpcy5yZXBvcnRJbmZyaW5nZW1lbnQoXHJcblx0XHRcdGBbIE5ldyB2YWx1ZSBmb3IgXCIke2tleX1cIiR7cGF0aCA9PT0gdW5kZWZpbmVkID8gXCJcIiA6IGAuJHtwYXRofWB9IHdpdGggdmFsdWUgXCIke3ZhbHVlfVwiIGRpZCBub3QgZnVsZmlsbCBvbmUgb2YgaXQncyBjb250cmFjdHM6ICR7bWVzc2FnZX1dYCxcclxuXHRcdFx0a2V5LFxyXG5cdFx0XHR0YXJnZXQsXHJcblx0XHRcdHBhdGgsXHJcblx0XHQpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBSZXBvcnRzIGEgcmV0dXJudmFsdWUtaW5mcmluZ2VtZW50IGFjY29yZGluZyB2aWEge0BsaW5rIHJlcG9ydEluZnJpbmdlbWVudCB9IGFsc28gZ2VuZXJhdGluZyBhIHByb3BlciB7QGxpbmsgc3RyaW5nIH0td3JhcHBlclxyXG5cdCAqIGZvciB0aGUgZ2l2ZW4gXCJtZXNzYWdlXCIsXCJtZXRob2RcIiAmIHZhbHVlLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIG1lc3NhZ2VcdFRoZSB7QGxpbmsgc3RyaW5nIH0gZGVzY3JpYmluZyB0aGUgaW5mcmluZ2VtZW50IGFuZCBpdCdzIHByb3ZlbmllbmNlLlxyXG5cdCAqIEBwYXJhbSBtZXRob2QgXHRUaGUge0BsaW5rIHN0cmluZyB9IGRlc2NyaWJpbmcgb3IgbmFtaW5nIHRoZSB2aW9sYXRvci5cclxuXHQgKiBAcGFyYW0gdmFsdWVcdFx0VGhlIHBhcmFtZXRlcidzIHZhbHVlLiAqL1xyXG5cdHB1YmxpYyByZXBvcnRSZXR1cm52YWx1ZUluZnJpbmdlbWVudChcclxuXHRcdG1lc3NhZ2U6IHN0cmluZyxcclxuXHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0cGF0aDogc3RyaW5nLFxyXG5cdFx0bWV0aG9kOiBzdHJpbmcsXHJcblx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cclxuXHRcdHZhbHVlOiBhbnksXHJcblx0KSB7XHJcblx0XHR0aGlzLnJlcG9ydEluZnJpbmdlbWVudChcclxuXHRcdFx0YFsgUmV0dXJuLXZhbHVlIFwiJHt2YWx1ZX1cIiBkaWQgbm90IGZ1bGZpbGwgb25lIG9mIGl0J3MgY29udHJhY3RzOiAke21lc3NhZ2V9XWAsXHJcblx0XHRcdG1ldGhvZCxcclxuXHRcdFx0dGFyZ2V0LFxyXG5cdFx0XHRwYXRoLFxyXG5cdFx0KTtcclxuXHR9XHJcblx0Ly8gI3JlZ2lvbiBDbGFzc2VzXHJcblx0Ly8gI3JlZ2lvbiBFcnJvcnNcclxuXHQvKiogQW4ge0BsaW5rIEVycm9yIH0gdG8gYmUgdGhyb3duIHdoZW5ldmVyIGFuIGluZnJpbmdlbWVudCBpcyBkZXRlY3RlZC4gKi9cclxuXHRwdWJsaWMgc3RhdGljIEluZnJpbmdlbWVudCA9IGNsYXNzIGV4dGVuZHMgRXJyb3Ige1xyXG5cdFx0LyoqXHJcblx0XHQgKiBDb25zdHJ1Y3RzIHRoaXMge0BsaW5rIEVycm9yIH0gYnkgdGFnZ2luZyB0aGUgc3BlY2lmaWVkIG1lc3NhZ2Ute0BsaW5rIHN0cmluZyB9IGFzIGFuIFhEQkMtSW5mcmluZ2VtZW50LlxyXG5cdFx0ICpcclxuXHRcdCAqIEBwYXJhbSBtZXNzYWdlIFRoZSB7QGxpbmsgc3RyaW5nIH0gZGVzY3JpYmluZyB0aGUgaW5mcmluZ2VtZW50LiAqL1xyXG5cdFx0Y29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nKSB7XHJcblx0XHRcdHN1cGVyKGBbIFhEQkMgSW5mcmluZ2VtZW50ICR7bWVzc2FnZX1dYCk7XHJcblx0XHR9XHJcblx0fTtcclxuXHQvLyAjZW5kcmVnaW9uIEVycm9yc1xyXG5cdC8vICNlbmRyZWdpb24gQ2xhc3Nlc1xyXG5cdC8vICNlbmRyZWdpb24gaW5mcmluZ2VtZW50IGhhbmRsaW5nLlxyXG5cdC8qKlxyXG5cdCAqIFJlc29sdmVzIHRoZSBzcGVjaWZpZWQgZG90dGVkIHtAbGluayBzdHJpbmcgfS1wYXRoIHRvIGEge0BsaW5rIERCQyB9LlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIG9iaiBcdFRoZSB7QGxpbmsgb2JqZWN0IH0gdG8gc3RhcnQgcmVzb2x2aW5nIGZyb20uXHJcblx0ICogQHBhcmFtIHBhdGggXHRUaGUgZG90dGVkIHtAbGluayBzdHJpbmcgfS1wYXRoIGxlYWRpbmcgdG8gdGhlIHtAbGluayBEQkMgfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFRoZSByZXF1ZXN0ZWQge0BsaW5rIERCQyB9LlxyXG5cdCAqL1xyXG5cdHN0YXRpYyByZXNvbHZlREJDUGF0aCA9IChvYmosIHBhdGgpOiBEQkMgPT5cclxuXHRcdHBhdGhcclxuXHRcdFx0Py5zcGxpdChcIi5cIilcclxuXHRcdFx0LnJlZHVjZSgoYWNjdW11bGF0b3IsIGN1cnJlbnQpID0+IGFjY3VtdWxhdG9yW2N1cnJlbnRdLCBvYmopO1xyXG5cdC8qKlxyXG5cdCAqIENvbnN0cnVjdHMgdGhpcyB7QGxpbmsgREJDIH0gYnkgc2V0dGluZyB0aGUge0BsaW5rIERCQy5pbmZyaW5nZW1lbnRTZXR0aW5ncyB9LCBkZWZpbmUgdGhlICoqV2FYQ29kZSoqIG5hbWVzcGFjZSBpblxyXG5cdCAqICoqd2luZG93KiogaWYgbm90IHlldCBhdmFpbGFibGUgYW5kIHNldHRpbmcgdGhlIHByb3BlcnR5ICoqREJDKiogaW4gdGhlcmUgdG8gdGhlIGluc3RhbmNlIG9mIHRoaXMge0BsaW5rIERCQyB9LlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIGluZnJpbmdlbWVudFNldHRpbmdzIFx0U2VlIHtAbGluayBEQkMuaW5mcmluZ2VtZW50U2V0dGluZ3MgfS5cclxuXHQgKiBAcGFyYW0gZXhlY3V0aW9uU2V0dGluZ3NcdFx0U2VlIHtAbGluayBEQkMuZXhlY3V0aW9uU2V0dGluZ3MgfS4gKi9cclxuXHRjb25zdHJ1Y3RvcihcclxuXHRcdGluZnJpbmdlbWVudFNldHRpbmdzOiB7XHJcblx0XHRcdHRocm93RXhjZXB0aW9uOiBib29sZWFuO1xyXG5cdFx0XHRsb2dUb0NvbnNvbGU6IGJvb2xlYW47XHJcblx0XHR9ID0geyB0aHJvd0V4Y2VwdGlvbjogdHJ1ZSwgbG9nVG9Db25zb2xlOiBmYWxzZSB9LFxyXG5cdFx0ZXhlY3V0aW9uU2V0dGluZ3M6IHtcclxuXHRcdFx0Y2hlY2tQcmVjb25kaXRpb25zOiBib29sZWFuO1xyXG5cdFx0XHRjaGVja1Bvc3Rjb25kaXRpb25zOiBib29sZWFuO1xyXG5cdFx0XHRjaGVja0ludmFyaWFudHM6IGJvb2xlYW47XHJcblx0XHR9ID0ge1xyXG5cdFx0XHRcdGNoZWNrUHJlY29uZGl0aW9uczogdHJ1ZSxcclxuXHRcdFx0XHRjaGVja1Bvc3Rjb25kaXRpb25zOiB0cnVlLFxyXG5cdFx0XHRcdGNoZWNrSW52YXJpYW50czogdHJ1ZSxcclxuXHRcdFx0fSxcclxuXHQpIHtcclxuXHRcdHRoaXMuaW5mcmluZ2VtZW50U2V0dGluZ3MgPSBpbmZyaW5nZW1lbnRTZXR0aW5ncztcclxuXHJcblx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cclxuXHRcdGlmICgod2luZG93IGFzIGFueSkuV2FYQ29kZSA9PT0gdW5kZWZpbmVkKSAod2luZG93IGFzIGFueSkuV2FYQ29kZSA9IHt9O1xyXG5cdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XHJcblx0XHQod2luZG93IGFzIGFueSkuV2FYQ29kZS5EQkMgPSB0aGlzO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBSZXNvbHZlcyB0aGUgZGVzaXJlZCB7QGxpbmsgb2JqZWN0IH0gb3V0IGEgZ2l2ZW4gb25lICoqdG9SZXNvbHZlRnJvbSoqIHVzaW5nIHRoZSBzcGVjaWZpZWQgKipwYXRoKiouXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdG9SZXNvbHZlRnJvbSBUaGUge0BsaW5rIG9iamVjdCB9IHN0YXJ0aW5nIHRvIHJlc29sdmUgZnJvbS5cclxuXHQgKiBAcGFyYW0gcGF0aFx0XHRcdFRoZSBkb3R0ZWQgcGF0aC17QGxpbmsgc3RyaW5nIH0uXHJcblx0ICogXHRcdFx0XHRcdFx0VGhpcyBzdHJpbmcgdXNlcyAuLCBbLi4uXSwgYW5kICgpIHRvIHJlcHJlc2VudCBhY2Nlc3NpbmcgbmVzdGVkIHByb3BlcnRpZXMsXHJcblx0ICogXHRcdFx0XHRcdFx0YXJyYXkgZWxlbWVudHMvb2JqZWN0IGtleXMsIGFuZCBjYWxsaW5nIG1ldGhvZHMsIHJlc3BlY3RpdmVseSwgbWltaWNraW5nIEphdmFTY3JpcHQgc3ludGF4IHRvIG5hdmlnYXRlXHJcblx0ICogXHRcdFx0XHRcdFx0YW4gb2JqZWN0J3Mgc3RydWN0dXJlLiBDb2RlLCBlLmcuIHNvbWV0aGluZyBsaWtlIGEuYiggMSBhcyBudW1iZXIgKS5jLCB3aWxsIG5vdCBiZSBleGVjdXRlZCBhbmRcclxuXHQgKiBcdFx0XHRcdFx0XHR0aHVzIG1ha2UgdGhlIHJldHJpZXZhbCBmYWlsLlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgVGhlIHJlcXVlc3RlZCB7QGxpbmsgb2JqZWN0IH0sIE5VTEwgb3IgVU5ERUZJTkVELiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgcmVzb2x2ZSh0b1Jlc29sdmVGcm9tOiB1bmtub3duLCBwYXRoOiBzdHJpbmcpIHtcclxuXHRcdGlmICghdG9SZXNvbHZlRnJvbSB8fCB0eXBlb2YgcGF0aCAhPT0gXCJzdHJpbmdcIikge1xyXG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xyXG5cdFx0fVxyXG5cclxuXHRcdGNvbnN0IHBhcnRzID0gcGF0aC5yZXBsYWNlKC9cXFsoWydcIl0/KSguKj8pXFwxXFxdL2csIFwiLiQyXCIpLnNwbGl0KFwiLlwiKTsgLy8gSGFuZGxlIGluZGV4ZXJzXHJcblxyXG5cdFx0bGV0IGN1cnJlbnQgPSB0b1Jlc29sdmVGcm9tO1xyXG5cdFx0Zm9yIChjb25zdCBwYXJ0IG9mIHBhcnRzKSB7XHJcblx0XHRcdGlmIChjdXJyZW50ID09PSBudWxsIHx8IHR5cGVvZiBjdXJyZW50ID09PSBcInVuZGVmaW5lZFwiKSB7XHJcblx0XHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y29uc3QgbWV0aG9kTWF0Y2ggPSBwYXJ0Lm1hdGNoKC8oXFx3KylcXCgoLiopXFwpLyk7XHJcblx0XHRcdGlmIChtZXRob2RNYXRjaCkge1xyXG5cdFx0XHRcdGNvbnN0IG1ldGhvZE5hbWUgPSBtZXRob2RNYXRjaFsxXTtcclxuXHRcdFx0XHRjb25zdCBhcmdzU3RyID0gbWV0aG9kTWF0Y2hbMl07XHJcblx0XHRcdFx0Y29uc3QgYXJncyA9IGFyZ3NTdHIuc3BsaXQoXCIsXCIpLm1hcCgoYXJnKSA9PiBhcmcudHJpbSgpKTsgLy8gU2ltcGxlIGFyZ3VtZW50IHBhcnNpbmdcclxuXHRcdFx0XHRpZiAodHlwZW9mIGN1cnJlbnRbbWV0aG9kTmFtZV0gPT09IFwiZnVuY3Rpb25cIikge1xyXG5cdFx0XHRcdFx0Y3VycmVudCA9IGN1cnJlbnRbbWV0aG9kTmFtZV0uYXBwbHkoY3VycmVudCwgYXJncyk7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHJldHVybiB1bmRlZmluZWQ7IC8vIE1ldGhvZCBub3QgZm91bmQgb3Igbm90IGEgZnVuY3Rpb25cclxuXHRcdFx0XHR9XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0Y3VycmVudCA9IGN1cnJlbnRbcGFydF07XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gY3VycmVudDtcclxuXHR9XHJcbn1cclxuLy8gU2V0IHRoZSBtYWluIGluc3RhbmNlIHdpdGggc3RhbmRhcmQgKipEQkMuaW5mcmluZ2VtZW50U2V0dGluZ3MqKi5cclxubmV3IERCQygpO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBS00sSUFBTyxNQUFQLE1BQU8sS0FBRzs7QUFHUixTQUFBLHFCQUlILG9CQUFJLElBQUc7RUFJUDs7Ozs7RUFLSSxPQUFPLGNBQWMsUUFBZ0IsWUFBMkI7QUFDdkUsVUFBTSxZQUFZLE9BQU8sV0FBVyxhQUFhLE9BQU8sT0FBTyxPQUFPLGFBQWEsUUFBUTtBQUMzRixXQUFPLEdBQUcsU0FBUyxJQUFJLE9BQU8sVUFBVSxDQUFDO0VBQzFDOzs7Ozs7Ozs7OztFQVdVLE9BQU8sa0JBQ2hCLFFBQ0EsWUFDQSxPQUVBLFVBQW1DO0FBRW5DLFVBQU0sTUFBTSxLQUFJLGNBQWMsUUFBUSxVQUFVO0FBRWhELFFBQUksS0FBSSxtQkFBbUIsSUFBSSxHQUFHLEdBQUc7QUFDcEMsVUFBSSxLQUFJLG1CQUFtQixJQUFJLEdBQUcsRUFBRSxJQUFJLEtBQUssR0FBRztBQUMvQyxhQUFJLG1CQUFtQixJQUFJLEdBQUcsRUFBRSxJQUFJLEtBQUssRUFBRSxLQUFLLFFBQVE7TUFDekQsT0FBTztBQUNOLGFBQUksbUJBQW1CLElBQUksR0FBRyxFQUFFLElBQUksT0FBTyxJQUFJLE1BQXFDLFFBQVEsQ0FBQztNQUM5RjtJQUNELE9BQU87QUFDTixXQUFJLG1CQUFtQixJQUN0QixLQUNBLG9CQUFJLElBQWtEO1FBQ3JE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
