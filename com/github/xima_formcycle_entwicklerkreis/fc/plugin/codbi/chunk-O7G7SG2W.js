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

export {
  DBC
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL25vZGVfbW9kdWxlcy94ZGJjL3NyYy9EQkMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qKlxyXG4gKiBQcm92aWRlcyBhICoqRCoqZXNpZ24gKipCKip5ICoqQyoqb250cmFjdCBGcmFtZXdvcmsgdXNpbmcgZGVjb3JhdG9ycy5cclxuICpcclxuICogQHJlbWFya3NcclxuICogTWFpbnRhaW5lcjogQ2FsbGFyaSwgU2FsdmF0b3JlIChYREJDQFdhWENvZGUubmV0KSAqL1xyXG5leHBvcnQgY2xhc3MgREJDIHtcclxuXHQvLyAjcmVnaW9uIFBhcmFtZXRlci12YWx1ZSByZXF1ZXN0cy5cclxuXHQvKiogU3RvcmVzIGFsbCByZXF1ZXN0IGZvciBwYXJhbWV0ZXIgdmFsdWVzIHJlZ2lzdGVyZWQgYnkge0BsaW5rIGRlY1ByZWNvbmRpdGlvbiB9LiAqL1xyXG5cdHN0YXRpYyBwYXJhbVZhbHVlUmVxdWVzdHM6IE1hcDxcclxuXHRcdG9iamVjdCxcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogR290dGEgYmUgYW55IHNpbmNlIHBhcmFtZXRlci12YWx1ZXMgbWF5IGJlIHVuZGVmaW5lZC5cclxuXHRcdE1hcDxzdHJpbmcgfCBzeW1ib2wsIE1hcDxudW1iZXIsIEFycmF5PCh2YWx1ZTogYW55KSA9PiB1bmRlZmluZWQ+Pj5cclxuXHQ+ID0gbmV3IE1hcDxcclxuXHRcdG9iamVjdCxcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogR290dGEgYmUgYW55IHNpbmNlIHBhcmFtZXRlci12YWx1ZXMgbWF5IGJlIHVuZGVmaW5lZC5cclxuXHRcdE1hcDxzdHJpbmcgfCBzeW1ib2wsIE1hcDxudW1iZXIsIEFycmF5PCh2YWx1ZTogYW55KSA9PiB1bmRlZmluZWQ+Pj5cclxuXHQ+KCk7XHJcblx0LyoqXHJcblx0ICogTWFrZSBhIHJlcXVlc3QgdG8gZ2V0IHRoZSB2YWx1ZSBvZiBhIGNlcnRhaW4gcGFyYW1ldGVyIG9mIHNwZWNpZmljIG1ldGhvZCBpbiBhIHNwZWNpZmljIHtAbGluayBvYmplY3QgfS5cclxuXHQgKiBUaGF0IHJlcXVlc3QgZ2V0cyBlbmxpc3RlZCBpbiB7QGxpbmsgcGFyYW1WYWx1ZVJlcXVlc3RzIH0gd2hpY2ggaXMgdXNlZCBieSB7QGxpbmsgUGFyYW12YWx1ZVByb3ZpZGVyfSB0byBpbnZva2UgdGhlXHJcblx0ICogZ2l2ZW4gXCJyZWNlcHRvclwiIHdpdGggdGhlIHBhcmFtZXRlciB2YWx1ZSBzdG9yZWQgaW4gdGhlcmUuIFRodXMgYSBwYXJhbWV0ZXIgZGVjb3JhdG9yIHVzaW5nIHRoaXMgbWV0aG9kIHdpbGxcclxuXHQgKiBub3QgcmVjZWl2ZSBhbnkgdmFsdWUgb2YgdGhlIHRvcCBtZXRob2QgaXMgbm90IHRhZ2dlZCB3aXRoIHtAbGluayBQYXJhbXZhbHVlUHJvdmlkZXJ9LlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHRhcmdldFx0XHRUaGUge0BsaW5rIG9iamVjdCB9IGNvbnRhaW5pbmcgdGhlIG1ldGhvZCB3aXRoIHRoZSBwYXJhbWV0ZXIgd2hpY2gncyB2YWx1ZSBpcyByZXF1ZXN0ZWQuXHJcblx0ICogQHBhcmFtIG1ldGhvZE5hbWVcdFRoZSBuYW1lIG9mIHRoZSBtZXRob2Qgd2l0aCB0aGUgcGFyYW1ldGVyIHdoaWNoJ3MgdmFsdWUgaXMgcmVxdWVzdGVkLlxyXG5cdCAqIEBwYXJhbSBpbmRleFx0XHRcdFRoZSBpbmRleCBvZiB0aGUgcGFyYW1ldGVyIHdoaWNoJ3MgdmFsdWUgaXMgcmVxdWVzdGVkLlxyXG5cdCAqIEBwYXJhbSByZWNlcHRvclx0XHRUaGUgbWV0aG9kIHRoZSByZXF1ZXN0ZWQgcGFyYW1ldGVyLXZhbHVlIHNoYWxsIGJlIHBhc3NlZCB0byB3aGVuIGl0IGJlY29tZXMgYXZhaWxhYmxlLiAqL1xyXG5cdHByb3RlY3RlZCBzdGF0aWMgcmVxdWVzdFBhcmFtVmFsdWUoXHJcblx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdG1ldGhvZE5hbWU6IHN0cmluZyB8IHN5bWJvbCxcclxuXHRcdGluZGV4OiBudW1iZXIsXHJcblx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IEdvdHRhIGJlIGFueSBzaW5jZSBwYXJhbWV0ZXItdmFsdWVzIG1heSBiZSB1bmRlZmluZWQuXHJcblx0XHRyZWNlcHRvcjogKHZhbHVlOiBhbnkpID0+IHVuZGVmaW5lZCxcclxuXHQpOiB1bmRlZmluZWQge1xyXG5cdFx0aWYgKERCQy5wYXJhbVZhbHVlUmVxdWVzdHMuaGFzKHRhcmdldCkpIHtcclxuXHRcdFx0aWYgKERCQy5wYXJhbVZhbHVlUmVxdWVzdHMuZ2V0KHRhcmdldCkuaGFzKG1ldGhvZE5hbWUpKSB7XHJcblx0XHRcdFx0aWYgKERCQy5wYXJhbVZhbHVlUmVxdWVzdHMuZ2V0KHRhcmdldCkuZ2V0KG1ldGhvZE5hbWUpLmhhcyhpbmRleCkpIHtcclxuXHRcdFx0XHRcdERCQy5wYXJhbVZhbHVlUmVxdWVzdHNcclxuXHRcdFx0XHRcdFx0LmdldCh0YXJnZXQpXHJcblx0XHRcdFx0XHRcdC5nZXQobWV0aG9kTmFtZSlcclxuXHRcdFx0XHRcdFx0LmdldChpbmRleClcclxuXHRcdFx0XHRcdFx0LnB1c2gocmVjZXB0b3IpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHREQkMucGFyYW1WYWx1ZVJlcXVlc3RzXHJcblx0XHRcdFx0XHRcdC5nZXQodGFyZ2V0KVxyXG5cdFx0XHRcdFx0XHQuZ2V0KG1ldGhvZE5hbWUpXHJcblx0XHRcdFx0XHRcdC5zZXQoaW5kZXgsIG5ldyBBcnJheTwodmFsdWU6IHVua25vd24pID0+IHVuZGVmaW5lZD4ocmVjZXB0b3IpKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0REJDLnBhcmFtVmFsdWVSZXF1ZXN0c1xyXG5cdFx0XHRcdFx0LmdldCh0YXJnZXQpXHJcblx0XHRcdFx0XHQuc2V0KFxyXG5cdFx0XHRcdFx0XHRtZXRob2ROYW1lLFxyXG5cdFx0XHRcdFx0XHRuZXcgTWFwPG51bWJlciwgQXJyYXk8KHZhbHVlOiB1bmtub3duKSA9PiB1bmRlZmluZWQ+PihbXHJcblx0XHRcdFx0XHRcdFx0W2luZGV4LCBuZXcgQXJyYXk8KHZhbHVlOiB1bmtub3duKSA9PiB1bmRlZmluZWQ+KHJlY2VwdG9yKV0sXHJcblx0XHRcdFx0XHRcdF0pLFxyXG5cdFx0XHRcdFx0KTtcclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0REJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5zZXQoXHJcblx0XHRcdFx0dGFyZ2V0LFxyXG5cdFx0XHRcdG5ldyBNYXA8XHJcblx0XHRcdFx0XHRzdHJpbmcgfCBzeW1ib2wsXHJcblx0XHRcdFx0XHRNYXA8bnVtYmVyLCBBcnJheTwodmFsdWU6IHVua25vd24pID0+IHVuZGVmaW5lZD4+XHJcblx0XHRcdFx0PihbXHJcblx0XHRcdFx0XHRbXHJcblx0XHRcdFx0XHRcdG1ldGhvZE5hbWUsXHJcblx0XHRcdFx0XHRcdG5ldyBNYXA8bnVtYmVyLCBBcnJheTwodmFsdWU6IHVua25vd24pID0+IHVuZGVmaW5lZD4+KFtcclxuXHRcdFx0XHRcdFx0XHRbaW5kZXgsIG5ldyBBcnJheTwodmFsdWU6IHVua25vd24pID0+IHVuZGVmaW5lZD4ocmVjZXB0b3IpXSxcclxuXHRcdFx0XHRcdFx0XSksXHJcblx0XHRcdFx0XHRdLFxyXG5cdFx0XHRcdF0pLFxyXG5cdFx0XHQpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB1bmRlZmluZWQ7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IGNoZWNraW5nIHRoZSB7QGxpbmsgcGFyYW1WYWx1ZVJlcXVlc3RzIH0gZm9yIHZhbHVlLXJlcXVlc3RzIG9mIHRoZSBtZXRob2QncyBwYXJhbWV0ZXIgdGh1c1xyXG5cdCAqIGFsc28gdXNhYmxlIG9uIHNldHRlcnMuXHJcblx0ICogV2hlbiBmb3VuZCBpdCB3aWxsIGludm9rZSB0aGUgXCJyZWNlcHRvclwiIHJlZ2lzdGVyZWQgdGhlcmUsIGludGVyIGFsaWEgYnkge0BsaW5rIHJlcXVlc3RQYXJhbVZhbHVlIH0sIHdpdGggdGhlXHJcblx0ICogcGFyYW1ldGVyJ3MgdmFsdWUuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdGFyZ2V0IFx0XHRUaGUge0BsaW5rIG9iamVjdCB9IGhvc3RpbmcgdGhlIHRhZ2dlZCBtZXRob2QgYXMgcHJvdmlkZWQgYnkgdGhlIHJ1bnRpbWUuXHJcblx0ICogQHBhcmFtIHByb3BlcnR5S2V5IFx0VGhlIHRhZ2dlZCBtZXRob2QncyBuYW1lIGFzIHByb3ZpZGVkIGJ5IHRoZSBydW50aW1lLlxyXG5cdCAqIEBwYXJhbSBkZXNjcmlwdG9yIFx0VGhlIHtAbGluayBQcm9wZXJ0eURlc2NyaXB0b3IgfSBhcyBwcm92aWRlZCBieSB0aGUgcnVudGltZS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFRoZSB7QGxpbmsgUHJvcGVydHlEZXNjcmlwdG9yIH0gdGhhdCB3YXMgcGFzc2VkIGJ5IHRoZSBydW50aW1lLiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgUGFyYW12YWx1ZVByb3ZpZGVyKFxyXG4gICAgdGFyZ2V0OiBvYmplY3QsIC8vICd0YXJnZXQnIHdpbGwgYmUgdGhlIHByb3RvdHlwZSBvZiB0aGUgY2xhc3MgZm9yIGluc3RhbmNlIG1ldGhvZHNcclxuICAgICAgICAgICAgICAgICAgICAvLyBvciB0aGUgY29uc3RydWN0b3IgZnVuY3Rpb24gaXRzZWxmIGZvciBzdGF0aWMgbWV0aG9kc1xyXG4gICAgcHJvcGVydHlLZXk6IHN0cmluZyxcclxuICAgIGRlc2NyaXB0b3I6IFByb3BlcnR5RGVzY3JpcHRvcixcclxuKTogUHJvcGVydHlEZXNjcmlwdG9yIHtcclxuXHRcdGNvbnN0IG9yaWdpbmFsTWV0aG9kID0gZGVzY3JpcHRvci52YWx1ZTtcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogR290dGEgYmUgYW55IHNpbmNlIHBhcmFtZXRlci12YWx1ZXMgbWF5IGJlIHVuZGVmaW5lZC5cclxuXHRcdGRlc2NyaXB0b3IudmFsdWUgPSBmdW5jdGlvbiAoLi4uYXJnczogYW55W10pIHtcclxuXHRcdFx0Ly8gI3JlZ2lvbiAgIENoZWNrIGlmIGEgdmFsdWUgb2Ygb25lIG9mIHRoZSBtZXRob2QncyBwYXJhbWV0ZXIgaGFzIGJlZW4gcmVxdWVzdGVkIGFuZCBwYXNzIGl0IHRvIHRoZVxyXG5cdFx0XHQvLyAgICAgICAgICAgcmVjZXB0b3IsIGlmIHNvLlxyXG5cdFx0XHRpZiAoXHJcblx0XHRcdFx0REJDLnBhcmFtVmFsdWVSZXF1ZXN0cy5oYXModGFyZ2V0KSAmJlxyXG5cdFx0XHRcdERCQy5wYXJhbVZhbHVlUmVxdWVzdHMuZ2V0KHRhcmdldCkuaGFzKHByb3BlcnR5S2V5KVxyXG5cdFx0XHQpIHtcclxuXHRcdFx0XHRmb3IgKGNvbnN0IGluZGV4IG9mIERCQy5wYXJhbVZhbHVlUmVxdWVzdHNcclxuXHRcdFx0XHRcdC5nZXQodGFyZ2V0KVxyXG5cdFx0XHRcdFx0LmdldChwcm9wZXJ0eUtleSlcclxuXHRcdFx0XHRcdC5rZXlzKCkpIHtcclxuXHRcdFx0XHRcdGlmIChpbmRleCA8IGFyZ3MubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHRcdGZvciAoY29uc3QgcmVjZXB0b3Igb2YgREJDLnBhcmFtVmFsdWVSZXF1ZXN0c1xyXG5cdFx0XHRcdFx0XHRcdC5nZXQodGFyZ2V0KVxyXG5cdFx0XHRcdFx0XHRcdC5nZXQocHJvcGVydHlLZXkpXHJcblx0XHRcdFx0XHRcdFx0LmdldChpbmRleCkpIHtcclxuXHRcdFx0XHRcdFx0XHRyZWNlcHRvcihhcmdzW2luZGV4XSk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdFx0Ly8gI2VuZHJlZ2lvblx0Q2hlY2sgaWYgYSB2YWx1ZSBvZiBvbmUgb2YgdGhlIG1ldGhvZCdzIHBhcmFtZXRlciBoYXMgYmVlbiByZXF1ZXN0ZWQgYW5kIHBhc3MgaXQgdG8gdGhlXHJcblx0XHRcdC8vICAgICAgICAgICAgICByZWNlcHRvciwgaWYgc28uXHJcblx0XHRcdHJldHVybiBvcmlnaW5hbE1ldGhvZC5hcHBseSh0aGlzLCBhcmdzKTtcclxuXHRcdH07XHJcblxyXG5cdFx0cmV0dXJuIGRlc2NyaXB0b3I7XHJcblx0fVxyXG5cdC8vICNlbmRyZWdpb24gUGFyYW1ldGVyLXZhbHVlIHJlcXVlc3RzLlxyXG5cdC8vICNyZWdpb24gQ2xhc3NcclxuXHQvKipcclxuXHQgKiBBIHByb3BlcnR5LWRlY29yYXRvciBmYWN0b3J5IHNlcnZpbmcgYXMgYSAqKkQqKmVzaWduICoqQioqeSAqKkMqKm9udHJhY3QgSW52YXJpYW50LlxyXG5cdCAqIFRoaXMgaW52YXJpYW50IGFpbXMgdG8gY2hlY2sgdGhlIGluc3RhbmNlIG9mIHRoZSBjbGFzcyBub3QgdGhlIHZhbHVlIHRvIGJlIGdldCBvciBzZXQuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gY29udHJhY3RzIFRoZSB7QGxpbmsgREJDIH0tQ29udHJhY3RzIHRoZSB2YWx1ZSBzaGFsbCB1cGhvbGQuXHJcblx0ICpcclxuXHQgKiBAdGhyb3dzIFx0QSB7QGxpbmsgREJDLkluZnJpbmdlbWVudCB9IHdoZW5ldmVyIHRoZSBwcm9wZXJ0eSBpcyB0cmllZCB0byBiZSBnZXQgb3Igc2V0IHdpdGhvdXQgdGhlIGluc3RhbmNlIG9mIGl0J3MgY2xhc3NcclxuXHQgKiBcdFx0XHRmdWxmaWxsaW5nIHRoZSBzcGVjaWZpZWQgKipjb250cmFjdHMqKi4gKi9cclxuXHRwdWJsaWMgc3RhdGljIGRlY0NsYXNzSW52YXJpYW50KFxyXG5cdFx0Y29udHJhY3RzOiBBcnJheTx7XHJcblx0XHRcdGNoZWNrOiAodG9DaGVjazogdW5rbm93biB8IG51bGwgfCB1bmRlZmluZWQpID0+IGJvb2xlYW4gfCBzdHJpbmc7XHJcblx0XHR9PixcclxuXHRcdHBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGRiYyA9IFwiV2FYQ29kZS5EQkNcIixcclxuXHQpIHtcclxuXHRcdHJldHVybiAodGFyZ2V0OiB1bmtub3duLCBwcm9wZXJ0eUtleTogc3RyaW5nIHwgc3ltYm9sLCBkZXNjcmlwdG9yOiBQcm9wZXJ0eURlc2NyaXB0b3IpID0+IHtcclxuXHRcdFx0aWYgKCFEQkMucmVzb2x2ZURCQ1BhdGgod2luZG93LCBkYmMpLmV4ZWN1dGlvblNldHRpbmdzLmNoZWNrSW52YXJpYW50cykge1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHRjb25zdCBvcmlnaW5hbFNldHRlciA9IGRlc2NyaXB0b3Iuc2V0O1xyXG4gICAgXHRcdGNvbnN0IG9yaWdpbmFsR2V0dGVyID0gZGVzY3JpcHRvci5nZXQ7XHJcblx0XHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogTmVjZXNzYXJ5IHRvIGludGVyY2VwdCBVTkRFRklORUQgYW5kIE5VTEwuXHJcblx0XHRcdGxldCB2YWx1ZTogYW55O1xyXG5cdFx0XHQvLyAjcmVnaW9uIFJlcGxhY2Ugb3JpZ2luYWwgcHJvcGVydHkuXHJcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIHByb3BlcnR5S2V5LCB7XHJcblx0XHRcdFx0Z2V0KCkge1xyXG5cdFx0XHRcdFx0aWYgKFxyXG5cdFx0XHRcdFx0XHQhREJDLnJlc29sdmVEQkNQYXRoKHdpbmRvdywgZGJjKS5leGVjdXRpb25TZXR0aW5ncy5jaGVja0ludmFyaWFudHNcclxuXHRcdFx0XHRcdCkge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0Y29uc3QgcmVhbFZhbHVlID0gcGF0aCA/IERCQy5yZXNvbHZlKHRoaXMsIHBhdGgpIDogdGhpcztcclxuXHRcdFx0XHRcdC8vICNyZWdpb24gQ2hlY2sgaWYgYWxsIFwiY29udHJhY3RzXCIgYXJlIGZ1bGZpbGxlZC5cclxuXHRcdFx0XHRcdGZvciAoY29uc3QgY29udHJhY3Qgb2YgY29udHJhY3RzKSB7XHJcblx0XHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IGNvbnRyYWN0LmNoZWNrKHJlYWxWYWx1ZSk7XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIHJlc3VsdCA9PT0gXCJzdHJpbmdcIikge1xyXG5cdFx0XHRcdFx0XHRcdERCQy5yZXNvbHZlREJDUGF0aCh3aW5kb3csIGRiYykucmVwb3J0RmllbGRJbmZyaW5nZW1lbnQoXHJcblx0XHRcdFx0XHRcdFx0XHRyZXN1bHQsXHJcblx0XHRcdFx0XHRcdFx0XHR0YXJnZXQgYXMgb2JqZWN0LFxyXG5cdFx0XHRcdFx0XHRcdFx0cGF0aCxcclxuXHRcdFx0XHRcdFx0XHRcdHByb3BlcnR5S2V5IGFzIHN0cmluZyxcclxuXHRcdFx0XHRcdFx0XHRcdHJlYWxWYWx1ZSxcclxuXHRcdFx0XHRcdFx0XHQpO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHQvLyAjZW5kcmVnaW9uIENoZWNrIGlmIGFsbCBcImNvbnRyYWN0c1wiIGFyZSBmdWxmaWxsZWQuXHJcblx0XHRcdFx0XHRyZXR1cm4gb3JpZ2luYWxHZXR0ZXJbIHByb3BlcnR5S2V5IF07XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRzZXQobmV3VmFsdWUpIHtcclxuXHRcdFx0XHRcdGlmIChcclxuXHRcdFx0XHRcdFx0IURCQy5yZXNvbHZlREJDUGF0aCh3aW5kb3csIGRiYykuZXhlY3V0aW9uU2V0dGluZ3MuY2hlY2tJbnZhcmlhbnRzXHJcblx0XHRcdFx0XHQpIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdGNvbnN0IHJlYWxWYWx1ZSA9IHBhdGggPyBEQkMucmVzb2x2ZSh0aGlzLCBwYXRoKSA6IHRoaXM7XHJcblx0XHRcdFx0XHQvLyAjcmVnaW9uIENoZWNrIGlmIGFsbCBcImNvbnRyYWN0c1wiIGFyZSBmdWxmaWxsZWQuXHJcblx0XHRcdFx0XHRmb3IgKGNvbnN0IGNvbnRyYWN0IG9mIGNvbnRyYWN0cykge1xyXG5cdFx0XHRcdFx0XHRjb25zdCByZXN1bHQgPSBjb250cmFjdC5jaGVjayhyZWFsVmFsdWUpO1xyXG5cclxuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiByZXN1bHQgPT09IFwic3RyaW5nXCIpIHtcclxuXHRcdFx0XHRcdFx0XHREQkMucmVzb2x2ZURCQ1BhdGgod2luZG93LCBkYmMpLnJlcG9ydEZpZWxkSW5mcmluZ2VtZW50KFxyXG5cdFx0XHRcdFx0XHRcdFx0cmVzdWx0LFxyXG5cdFx0XHRcdFx0XHRcdFx0dGFyZ2V0IGFzIG9iamVjdCxcclxuXHRcdFx0XHRcdFx0XHRcdHBhdGgsXHJcblx0XHRcdFx0XHRcdFx0XHRwcm9wZXJ0eUtleSBhcyBzdHJpbmcsXHJcblx0XHRcdFx0XHRcdFx0XHRyZWFsVmFsdWUsXHJcblx0XHRcdFx0XHRcdFx0KTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0Ly8gI2VuZHJlZ2lvbiBDaGVjayBpZiBhbGwgXCJjb250cmFjdHNcIiBhcmUgZnVsZmlsbGVkLlxyXG5cdFx0XHRcdFx0dmFsdWUgPSBuZXdWYWx1ZTtcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdGVudW1lcmFibGU6IHRydWUsXHJcblx0XHRcdFx0Y29uZmlndXJhYmxlOiB0cnVlLFxyXG5cdFx0XHR9KTtcclxuXHRcdFx0Ly8gI2VuZHJlZ2lvbiBSZXBsYWNlIG9yaWdpbmFsIHByb3BlcnR5LlxyXG5cdFx0fTtcclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBDbGFzc1xyXG5cdC8vICNyZWdpb24gSW52YXJpYW50XHJcblx0LyoqXHJcblx0ICogQSBwcm9wZXJ0eS1kZWNvcmF0b3IgZmFjdG9yeSBzZXJ2aW5nIGFzIGEgKipEKiplc2lnbiAqKkIqKnkgKipDKipvbnRyYWN0IEludmFyaWFudC5cclxuXHQgKiBTaW5jZSB0aGUgdmFsdWUgbXVzdCBiZSBpbml0aWFsaXplZCBvciBzZXQgYWNjb3JkaW5nIHRvIHRoZSBzcGVjaWZpZWQgKipjb250cmFjdHMqKiB0aGUgdmFsdWUgd2lsbCBvbmx5IGJlIGNoZWNrZWRcclxuXHQgKiB3aGVuIGFzc2lnbmluZyBpdC5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBjb250cmFjdHMgVGhlIHtAbGluayBEQkMgfS1Db250cmFjdHMgdGhlIHZhbHVlIHNoYWxsIHVwaG9sZC5cclxuXHQgKlxyXG5cdCAqIEB0aHJvd3MgXHRBIHtAbGluayBEQkMuSW5mcmluZ2VtZW50IH0gd2hlbmV2ZXIgdGhlIHByb3BlcnR5IGlzIHRyaWVkIHRvIGJlIHNldCB0byBhIHZhbHVlIHRoYXQgZG9lcyBub3QgY29tcGx5IHRvIHRoZVxyXG5cdCAqIFx0XHRcdHNwZWNpZmllZCAqKmNvbnRyYWN0cyoqLCBieSB0aGUgcmV0dXJuZWQgbWV0aG9kLiovXHJcblx0cHVibGljIHN0YXRpYyBkZWNJbnZhcmlhbnQoXHJcblx0XHRjb250cmFjdHM6IEFycmF5PHtcclxuXHRcdFx0Y2hlY2s6ICh0b0NoZWNrOiB1bmtub3duIHwgbnVsbCB8IHVuZGVmaW5lZCkgPT4gYm9vbGVhbiB8IHN0cmluZztcclxuXHRcdH0+LFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjID0gXCJXYVhDb2RlLkRCQ1wiLFxyXG5cdCkge1xyXG5cdFx0cmV0dXJuICh0YXJnZXQ6IHVua25vd24sIHByb3BlcnR5S2V5OiBzdHJpbmcgfCBzeW1ib2wpID0+IHtcclxuXHRcdFx0aWYgKCFEQkMucmVzb2x2ZURCQ1BhdGgod2luZG93LCBkYmMpLmV4ZWN1dGlvblNldHRpbmdzLmNoZWNrSW52YXJpYW50cykge1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cdFx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IE5lY2Vzc2FyeSB0byBpbnRlcmNlcHQgVU5ERUZJTkVEIGFuZCBOVUxMLlxyXG5cdFx0XHRsZXQgdmFsdWU6IGFueTtcclxuXHRcdFx0Ly8gI3JlZ2lvbiBSZXBsYWNlIG9yaWdpbmFsIHByb3BlcnR5LlxyXG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBwcm9wZXJ0eUtleSwge1xyXG5cdFx0XHRcdHNldChuZXdWYWx1ZSkge1xyXG5cdFx0XHRcdFx0aWYgKFxyXG5cdFx0XHRcdFx0XHQhREJDLnJlc29sdmVEQkNQYXRoKHdpbmRvdywgZGJjKS5leGVjdXRpb25TZXR0aW5ncy5jaGVja0ludmFyaWFudHNcclxuXHRcdFx0XHRcdCkge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0Y29uc3QgcmVhbFZhbHVlID0gcGF0aCA/IERCQy5yZXNvbHZlKG5ld1ZhbHVlLCBwYXRoKSA6IG5ld1ZhbHVlO1xyXG5cdFx0XHRcdFx0Ly8gI3JlZ2lvbiBDaGVjayBpZiBhbGwgXCJjb250cmFjdHNcIiBhcmUgZnVsZmlsbGVkLlxyXG5cdFx0XHRcdFx0Zm9yIChjb25zdCBjb250cmFjdCBvZiBjb250cmFjdHMpIHtcclxuXHRcdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gY29udHJhY3QuY2hlY2socmVhbFZhbHVlKTtcclxuXHJcblx0XHRcdFx0XHRcdGlmICh0eXBlb2YgcmVzdWx0ID09PSBcInN0cmluZ1wiKSB7XHJcblx0XHRcdFx0XHRcdFx0REJDLnJlc29sdmVEQkNQYXRoKHdpbmRvdywgZGJjKS5yZXBvcnRGaWVsZEluZnJpbmdlbWVudChcclxuXHRcdFx0XHRcdFx0XHRcdHJlc3VsdCxcclxuXHRcdFx0XHRcdFx0XHRcdHRhcmdldCBhcyBvYmplY3QsXHJcblx0XHRcdFx0XHRcdFx0XHRwYXRoLFxyXG5cdFx0XHRcdFx0XHRcdFx0cHJvcGVydHlLZXkgYXMgc3RyaW5nLFxyXG5cdFx0XHRcdFx0XHRcdFx0cmVhbFZhbHVlLFxyXG5cdFx0XHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vICNlbmRyZWdpb24gQ2hlY2sgaWYgYWxsIFwiY29udHJhY3RzXCIgYXJlIGZ1bGZpbGxlZC5cclxuXHRcdFx0XHRcdHZhbHVlID0gbmV3VmFsdWU7XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRlbnVtZXJhYmxlOiB0cnVlLFxyXG5cdFx0XHRcdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcclxuXHRcdFx0fSk7XHJcblx0XHRcdC8vICNlbmRyZWdpb24gUmVwbGFjZSBvcmlnaW5hbCBwcm9wZXJ0eS5cclxuXHRcdH07XHJcblx0fVxyXG5cdC8vICNlbmRyZWdpb24gSW52YXJpYW50XHJcblx0Ly8gI3JlZ2lvbiBQb3N0Y29uZGl0aW9uXHJcblx0LyoqXHJcblx0ICogQSBtZXRob2QgZGVjb3JhdG9yIGZhY3RvcnkgY2hlY2tpbmcgdGhlIHJlc3VsdCBvZiBhIG1ldGhvZCB3aGVuZXZlciBpdCBpcyBpbnZva2VkIHRodXMgYWxzbyB1c2FibGUgb24gZ2V0dGVycy5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBjaGVja1x0VGhlICoqKHRvQ2hlY2s6IGFueSwgb2JqZWN0LCBzdHJpbmcpID0+IGJvb2xlYW4gfCBzdHJpbmcqKiB0byB1c2UgZm9yIGNoZWNraW5nLlxyXG5cdCAqIEBwYXJhbSBkYmNcdFNlZSB7QGxpbmsgREJDLnJlc29sdmVEQkNQYXRoIH0uXHJcblx0ICogQHBhcmFtIHBhdGhcdFRoZSBkb3R0ZWQgcGF0aCByZWZlcnJpbmcgdG8gdGhlIGFjdHVhbCB2YWx1ZSB0byBjaGVjaywgc3RhcnRpbmcgZm9ybSB0aGUgc3BlY2lmaWVkIG9uZS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFRoZSAqKiggdGFyZ2V0IDogb2JqZWN0LCBwcm9wZXJ0eUtleSA6IHN0cmluZywgZGVzY3JpcHRvciA6IFByb3BlcnR5RGVzY3JpcHRvciApIDogUHJvcGVydHlEZXNjcmlwdG9yKipcclxuXHQgKiBcdFx0XHRpbnZva2VkIGJ5IFR5cGVzY3JpcHQuXHJcblx0ICovXHJcblx0cHVibGljIHN0YXRpYyBkZWNQb3N0Y29uZGl0aW9uKFxyXG5cdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBOZWNlc3NhcnkgdG8gaW50ZXJjZXB0IFVOREVGSU5FRCBhbmQgTlVMTC5cclxuXHRcdGNoZWNrOiAodG9DaGVjazogYW55LCBvYmplY3QsIHN0cmluZykgPT4gYm9vbGVhbiB8IHN0cmluZyxcclxuXHRcdGRiYzogc3RyaW5nLFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdCkge1xyXG5cdFx0cmV0dXJuIChcclxuXHRcdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRcdHByb3BlcnR5S2V5OiBzdHJpbmcsXHJcblx0XHRcdGRlc2NyaXB0b3I6IFByb3BlcnR5RGVzY3JpcHRvcixcclxuXHRcdCk6IFByb3BlcnR5RGVzY3JpcHRvciA9PiB7XHJcblx0XHRcdGNvbnN0IG9yaWdpbmFsTWV0aG9kID0gZGVzY3JpcHRvci52YWx1ZTtcclxuXHRcdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBOZWNlc3NhcnkgdG8gaW50ZXJjZXB0IFVOREVGSU5FRCBhbmQgTlVMTC5cclxuXHRcdFx0ZGVzY3JpcHRvci52YWx1ZSA9ICguLi5hcmdzOiBhbnlbXSkgPT4ge1xyXG5cdFx0XHRcdGlmIChcclxuXHRcdFx0XHRcdCFEQkMucmVzb2x2ZURCQ1BhdGgod2luZG93LCBkYmMpLmV4ZWN1dGlvblNldHRpbmdzLmNoZWNrUG9zdGNvbmRpdGlvbnNcclxuXHRcdFx0XHQpIHtcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvY29tcGxleGl0eS9ub1RoaXNJblN0YXRpYzogPGV4cGxhbmF0aW9uPlxyXG5cdFx0XHRcdGNvbnN0IHJlc3VsdCA9IG9yaWdpbmFsTWV0aG9kLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG5cdFx0XHRcdGNvbnN0IHJlYWxWYWx1ZSA9IHBhdGggPyBEQkMucmVzb2x2ZShyZXN1bHQsIHBhdGgpIDogcmVzdWx0O1xyXG5cdFx0XHRcdGNvbnN0IGNoZWNrUmVzdWx0ID0gY2hlY2socmVhbFZhbHVlLCB0YXJnZXQsIHByb3BlcnR5S2V5KTtcclxuXHJcblx0XHRcdFx0aWYgKHR5cGVvZiBjaGVja1Jlc3VsdCA9PT0gXCJzdHJpbmdcIikge1xyXG5cdFx0XHRcdFx0REJDLnJlc29sdmVEQkNQYXRoKHdpbmRvdywgZGJjKS5yZXBvcnRSZXR1cm52YWx1ZUluZnJpbmdlbWVudChcclxuXHRcdFx0XHRcdFx0Y2hlY2tSZXN1bHQsXHJcblx0XHRcdFx0XHRcdHRhcmdldCxcclxuXHRcdFx0XHRcdFx0cGF0aCxcclxuXHRcdFx0XHRcdFx0cHJvcGVydHlLZXksXHJcblx0XHRcdFx0XHRcdHJlYWxWYWx1ZSxcclxuXHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRyZXR1cm4gcmVzdWx0O1xyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0cmV0dXJuIGRlc2NyaXB0b3I7XHJcblx0XHR9O1xyXG5cdH1cclxuXHQvLyAjZW5kcmVnaW9uIFBvc3Rjb25kaXRpb25cclxuXHQvLyAjcmVnaW9uIERlY29yYXRvclxyXG5cdC8vICNyZWdpb24gUHJlY29uZGl0aW9uXHJcblx0LyoqXHJcblx0ICogQSBwYXJhbWV0ZXItZGVjb3JhdG9yIGZhY3RvcnkgdGhhdCByZXF1ZXN0cyB0aGUgdGFnZ2VkIHBhcmFtZXRlcidzIHZhbHVlIHBhc3NpbmcgaXQgdG8gdGhlIHByb3ZpZGVkXHJcblx0ICogXCJjaGVja1wiLW1ldGhvZCB3aGVuIHRoZSB2YWx1ZSBiZWNvbWVzIGF2YWlsYWJsZS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBjaGVja1x0VGhlIFwiKCB1bmtub3duICkgPT4gdm9pZFwiIHRvIGJlIGludm9rZWQgYWxvbmcgd2l0aCB0aGUgdGFnZ2VkIHBhcmFtZXRlcidzIHZhbHVlIGFzIHNvb25cclxuXHQgKiBcdFx0XHRcdGFzIGl0IGJlY29tZXMgYXZhaWxhYmxlLlxyXG5cdCAqIEBwYXJhbSBkYmMgIFx0U2VlIHtAbGluayBEQkMucmVzb2x2ZURCQ1BhdGggfS5cclxuXHQgKiBAcGFyYW0gcGF0aFx0VGhlIGRvdHRlZCBwYXRoIHJlZmVycmluZyB0byB0aGUgYWN0dWFsIHZhbHVlIHRvIGNoZWNrLCBzdGFydGluZyBmb3JtIHRoZSBzcGVjaWZpZWQgb25lLlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgVGhlICoqKHRhcmdldDogb2JqZWN0LCBtZXRob2ROYW1lOiBzdHJpbmcgfCBzeW1ib2wsIHBhcmFtZXRlckluZGV4OiBudW1iZXIgKSA9PiB2b2lkKiogaW52b2tlZCBieSBUeXBlc2NyaXB0LSAqL1xyXG5cdHByb3RlY3RlZCBzdGF0aWMgZGVjUHJlY29uZGl0aW9uKFxyXG5cdFx0Y2hlY2s6ICh1bmtub3duLCBvYmplY3QsIHN0cmluZywgbnVtYmVyKSA9PiBib29sZWFuIHwgc3RyaW5nLFxyXG5cdFx0ZGJjOiBzdHJpbmcsXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0KTogKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRtZXRob2ROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXHJcblx0XHRwYXJhbWV0ZXJJbmRleDogbnVtYmVyLFxyXG5cdCkgPT4gdm9pZCB7XHJcblx0XHRyZXR1cm4gKFxyXG5cdFx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdFx0bWV0aG9kTmFtZTogc3RyaW5nIHwgc3ltYm9sLFxyXG5cdFx0XHRwYXJhbWV0ZXJJbmRleDogbnVtYmVyLFxyXG5cdFx0KTogdm9pZCA9PiB7XHJcblx0XHRcdERCQy5yZXF1ZXN0UGFyYW1WYWx1ZShcclxuXHRcdFx0XHR0YXJnZXQsXHJcblx0XHRcdFx0bWV0aG9kTmFtZSxcclxuXHRcdFx0XHRwYXJhbWV0ZXJJbmRleCxcclxuXHRcdFx0XHQodmFsdWU6IHVua25vd24pID0+IHtcclxuXHRcdFx0XHRcdGlmIChcclxuXHRcdFx0XHRcdFx0IURCQy5yZXNvbHZlREJDUGF0aCh3aW5kb3csIGRiYykuZXhlY3V0aW9uU2V0dGluZ3NcclxuXHRcdFx0XHRcdFx0XHQuY2hlY2tQcmVjb25kaXRpb25zXHJcblx0XHRcdFx0XHQpIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdGNvbnN0IHJlYWxWYWx1ZSA9IHBhdGggPyBEQkMucmVzb2x2ZSh2YWx1ZSwgcGF0aCkgOiB2YWx1ZTtcclxuXHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IGNoZWNrKHJlYWxWYWx1ZSwgdGFyZ2V0LCBtZXRob2ROYW1lLCBwYXJhbWV0ZXJJbmRleCk7XHJcblxyXG5cdFx0XHRcdFx0aWYgKHR5cGVvZiByZXN1bHQgPT09IFwic3RyaW5nXCIpIHtcclxuXHRcdFx0XHRcdFx0REJDLnJlc29sdmVEQkNQYXRoKHdpbmRvdywgZGJjKS5yZXBvcnRQYXJhbWV0ZXJJbmZyaW5nZW1lbnQoXHJcblx0XHRcdFx0XHRcdFx0cmVzdWx0LFxyXG5cdFx0XHRcdFx0XHRcdHRhcmdldCxcclxuXHRcdFx0XHRcdFx0XHRwYXRoLFxyXG5cdFx0XHRcdFx0XHRcdG1ldGhvZE5hbWUgYXMgc3RyaW5nLFxyXG5cdFx0XHRcdFx0XHRcdHBhcmFtZXRlckluZGV4LFxyXG5cdFx0XHRcdFx0XHRcdHJlYWxWYWx1ZSxcclxuXHRcdFx0XHRcdFx0KTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9LFxyXG5cdFx0XHQpO1xyXG5cdFx0fTtcclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBQcmVjb25kaXRpb25cclxuXHQvLyAjZW5kcmVnaW9uIERlY29yYXRvclxyXG5cdC8vICNyZWdpb24gRXhlY3V0aW9uIEhhbmRsaW5nXHJcblx0LyoqIFN0b3JlcyBzZXR0aW5ncyBjb25jZXJuaW5nIHRoZSBleGVjdXRpb24gb2YgY2hlY2tzLiAqL1xyXG5cdHB1YmxpYyBleGVjdXRpb25TZXR0aW5nczoge1xyXG5cdFx0Y2hlY2tQcmVjb25kaXRpb25zOiBib29sZWFuO1xyXG5cdFx0Y2hlY2tQb3N0Y29uZGl0aW9uczogYm9vbGVhbjtcclxuXHRcdGNoZWNrSW52YXJpYW50czogYm9vbGVhbjtcclxuXHR9ID0ge1xyXG5cdFx0Y2hlY2tQcmVjb25kaXRpb25zOiB0cnVlLFxyXG5cdFx0Y2hlY2tQb3N0Y29uZGl0aW9uczogdHJ1ZSxcclxuXHRcdGNoZWNrSW52YXJpYW50czogdHJ1ZSxcclxuXHR9O1xyXG5cdC8vICNlbmRyZWdpb24gRXhlY3V0aW9uIEhhbmRsaW5nXHJcblx0Ly8gI3JlZ2lvbiBXYXJuaW5nIGhhbmRsaW5nLlxyXG5cdC8qKiBTdG9yZXMgc2V0dGluZ3MgY29uY2VybmluZyB3YXJuaW5ncy4gKi9cclxuXHRwdWJsaWMgd2FybmluZ1NldHRpbmdzOiB7XHJcblx0XHRsb2dUb0NvbnNvbGU6IGJvb2xlYW47XHJcblx0fSA9IHsgbG9nVG9Db25zb2xlOiB0cnVlIH07XHJcblx0LyoqXHJcblx0ICogUmVwb3J0cyBhIHdhcm5pbmcuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gbWVzc2FnZSBUaGUgbWVzc2FnZSBjb250YWluaW5nIHRoZSB3YXJuaW5nLiAqL1xyXG5cdHByb3RlY3RlZCByZXBvcnRXYXJuaW5nKG1lc3NhZ2U6IHN0cmluZyk6IHVuZGVmaW5lZCB7XHJcblx0XHRpZiAodGhpcy53YXJuaW5nU2V0dGluZ3MubG9nVG9Db25zb2xlKSB7XHJcblx0XHRcdGNvbnNvbGUud2FybihtZXNzYWdlKTtcclxuXHRcdH1cclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBXYXJuaW5nIGhhbmRsaW5nLlxyXG5cdC8vICNyZWdpb24gaW5mcmluZ2VtZW50IGhhbmRsaW5nLlxyXG5cdC8qKiBTdG9yZXMgdGhlIHNldHRpbmdzIGNvbmNlcm5pbmcgaW5mcmluZ2VtZW50cyAqL1xyXG5cdHB1YmxpYyBpbmZyaW5nZW1lbnRTZXR0aW5nczoge1xyXG5cdFx0dGhyb3dFeGNlcHRpb246IGJvb2xlYW47XHJcblx0XHRsb2dUb0NvbnNvbGU6IGJvb2xlYW47XHJcblx0fSA9IHsgdGhyb3dFeGNlcHRpb246IHRydWUsIGxvZ1RvQ29uc29sZTogZmFsc2UgfTtcclxuXHQvKipcclxuXHQgKiBSZXBvcnRzIGFuIGluZnJpbmdlbWVudCBhY2NvcmRpbmcgdG8gdGhlIHtAbGluayBpbmZyaW5nZW1lbnRTZXR0aW5ncyB9IGFsc28gZ2VuZXJhdGluZyBhIHByb3BlciB7QGxpbmsgc3RyaW5nIH0td3JhcHBlclxyXG5cdCAqIGZvciB0aGUgZ2l2ZW4gXCJtZXNzYWdlXCIgJiB2aW9sYXRvci5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBtZXNzYWdlXHRUaGUge0BsaW5rIHN0cmluZyB9IGRlc2NyaWJpbmcgdGhlIGluZnJpbmdlbWVudCBhbmQgaXQncyBwcm92ZW5pZW5jZS5cclxuXHQgKiBAcGFyYW0gdmlvbGF0b3IgXHRUaGUge0BsaW5rIHN0cmluZyB9IGRlc2NyaWJpbmcgb3IgbmFtaW5nIHRoZSB2aW9sYXRvci4gKi9cclxuXHRwcm90ZWN0ZWQgcmVwb3J0SW5mcmluZ2VtZW50KFxyXG5cdFx0bWVzc2FnZTogc3RyaW5nLFxyXG5cdFx0dmlvbGF0b3I6IHN0cmluZyxcclxuXHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0cGF0aDogc3RyaW5nLFxyXG5cdCk6IHVuZGVmaW5lZCB7XHJcblx0XHRjb25zdCBmaW5hbE1lc3NhZ2U6IHN0cmluZyA9IGBbIEZyb20gXCIke3Zpb2xhdG9yfVwiJHtwYXRoID8gYCdzIG1lbWJlciBcIiR7cGF0aH1cImAgOiBcIlwifSR7dHlwZW9mIHRhcmdldCA9PT0gXCJmdW5jdGlvblwiID8gYCBpbiBcIiR7dGFyZ2V0Lm5hbWV9XCJgIDogdHlwZW9mIHRhcmdldCA9PT0gXCJvYmplY3RcIiAmJiB0YXJnZXQgIT09IG51bGwgJiYgdHlwZW9mIHRhcmdldC5jb25zdHJ1Y3RvciA9PT0gXCJmdW5jdGlvblwiID8gYCBpbiBcIiR7dGFyZ2V0LmNvbnN0cnVjdG9yLm5hbWV9XCJgIDogXCJcIn06ICR7bWVzc2FnZX1dYDtcclxuXHJcblx0XHRpZiAodGhpcy5pbmZyaW5nZW1lbnRTZXR0aW5ncy50aHJvd0V4Y2VwdGlvbikge1xyXG5cdFx0XHR0aHJvdyBuZXcgREJDLkluZnJpbmdlbWVudChmaW5hbE1lc3NhZ2UpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh0aGlzLmluZnJpbmdlbWVudFNldHRpbmdzLmxvZ1RvQ29uc29sZSkge1xyXG5cdFx0XHRjb25zb2xlLmxvZyhmaW5hbE1lc3NhZ2UpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHQvKipcclxuXHQgKiBSZXBvcnRzIGEgcGFyYW1ldGVyLWluZnJpbmdlbWVudCB2aWEge0BsaW5rIHJlcG9ydEluZnJpbmdlbWVudCB9IGFsc28gZ2VuZXJhdGluZyBhIHByb3BlciB7QGxpbmsgc3RyaW5nIH0td3JhcHBlclxyXG5cdCAqIGZvciB0aGUgZ2l2ZW4gXCJtZXNzYWdlXCIsXCJtZXRob2RcIiwgcGFyYW1ldGVyLVwiaW5kZXhcIiAmIHZhbHVlLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIG1lc3NhZ2VcdFRoZSB7QGxpbmsgc3RyaW5nIH0gZGVzY3JpYmluZyB0aGUgaW5mcmluZ2VtZW50IGFuZCBpdCdzIHByb3ZlbmllbmNlLlxyXG5cdCAqIEBwYXJhbSBtZXRob2QgXHRUaGUge0BsaW5rIHN0cmluZyB9IGRlc2NyaWJpbmcgb3IgbmFtaW5nIHRoZSB2aW9sYXRvci5cclxuXHQgKiBAcGFyYW0gaW5kZXhcdFx0VGhlIGluZGV4IG9mIHRoZSBwYXJhbWV0ZXIgd2l0aGluIHRoZSBhcmd1bWVudCBsaXN0aW5nLlxyXG5cdCAqIEBwYXJhbSB2YWx1ZSBcdFRoZSBwYXJhbWV0ZXIncyB2YWx1ZS4gKi9cclxuXHRwdWJsaWMgcmVwb3J0UGFyYW1ldGVySW5mcmluZ2VtZW50KFxyXG5cdFx0bWVzc2FnZTogc3RyaW5nLFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRwYXRoOiBzdHJpbmcsXHJcblx0XHRtZXRob2Q6IHN0cmluZyxcclxuXHRcdGluZGV4OiBudW1iZXIsXHJcblx0XHR2YWx1ZTogdW5rbm93bixcclxuXHQpOiB1bmRlZmluZWQge1xyXG5cdFx0Y29uc3QgcHJvcGVySW5kZXggPSBpbmRleCArIDE7XHJcblxyXG5cdFx0dGhpcy5yZXBvcnRJbmZyaW5nZW1lbnQoXHJcblx0XHRcdGBbIFBhcmFtZXRlci12YWx1ZSBcIiR7dmFsdWV9XCIgb2YgdGhlICR7cHJvcGVySW5kZXh9JHtwcm9wZXJJbmRleCA9PT0gMSA/IFwic3RcIiA6IHByb3BlckluZGV4ID09PSAyID8gXCJuZFwiIDogcHJvcGVySW5kZXggPT09IDMgPyBcInJkXCIgOiBcInRoXCJ9IHBhcmFtZXRlciBkaWQgbm90IGZ1bGZpbGwgb25lIG9mIGl0J3MgY29udHJhY3RzOiAke21lc3NhZ2V9XWAsXHJcblx0XHRcdG1ldGhvZCxcclxuXHRcdFx0dGFyZ2V0LFxyXG5cdFx0XHRwYXRoLFxyXG5cdFx0KTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogUmVwb3J0cyBhIGZpZWxkLWluZnJpbmdlbWVudCB2aWEge0BsaW5rIHJlcG9ydEluZnJpbmdlbWVudCB9IGFsc28gZ2VuZXJhdGluZyBhIHByb3BlciB7QGxpbmsgc3RyaW5nIH0td3JhcHBlclxyXG5cdCAqIGZvciB0aGUgZ2l2ZW4gKiptZXNzYWdlKiogJiAqKm5hbWUqKi5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBtZXNzYWdlXHRBIHtAbGluayBzdHJpbmcgfSBkZXNjcmliaW5nIHRoZSBpbmZyaW5nZW1lbnQgYW5kIGl0J3MgcHJvdmVuaWVuY2UuXHJcblx0ICogQHBhcmFtIGtleSBcdFx0VGhlIHByb3BlcnR5IGtleS5cclxuXHQgKiBAcGFyYW0gcGF0aFx0XHRUaGUgZG90dGVkLXBhdGgge0BsaW5rIHN0cmluZyB9IHRoYXQgbGVhZHMgdG8gdGhlIHZhbHVlIG5vdCBmdWxmaWxsaW5nIHRoZSBjb250cmFjdCBzdGFydGluZyBmcm9tXHJcblx0ICogXHRcdFx0XHRcdHRoZSB0YWdnZWQgb25lLlxyXG5cdCAqIEBwYXJhbSB2YWx1ZVx0XHRUaGUgdmFsdWUgbm90IGZ1bGZpbGxpbmcgYSBjb250cmFjdC4gKi9cclxuXHRwdWJsaWMgcmVwb3J0RmllbGRJbmZyaW5nZW1lbnQoXHJcblx0XHRtZXNzYWdlOiBzdHJpbmcsXHJcblx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdHBhdGg6IHN0cmluZyxcclxuXHRcdGtleTogc3RyaW5nLFxyXG5cdFx0dmFsdWU6IHVua25vd24sXHJcblx0KTogdW5kZWZpbmVkIHtcclxuXHRcdHRoaXMucmVwb3J0SW5mcmluZ2VtZW50KFxyXG5cdFx0XHRgWyBOZXcgdmFsdWUgZm9yIFwiJHtrZXl9XCIke3BhdGggPT09IHVuZGVmaW5lZCA/IFwiXCIgOiBgLiR7cGF0aH1gfSB3aXRoIHZhbHVlIFwiJHt2YWx1ZX1cIiBkaWQgbm90IGZ1bGZpbGwgb25lIG9mIGl0J3MgY29udHJhY3RzOiAke21lc3NhZ2V9XWAsXHJcblx0XHRcdGtleSxcclxuXHRcdFx0dGFyZ2V0LFxyXG5cdFx0XHRwYXRoLFxyXG5cdFx0KTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogUmVwb3J0cyBhIHJldHVybnZhbHVlLWluZnJpbmdlbWVudCBhY2NvcmRpbmcgdmlhIHtAbGluayByZXBvcnRJbmZyaW5nZW1lbnQgfSBhbHNvIGdlbmVyYXRpbmcgYSBwcm9wZXIge0BsaW5rIHN0cmluZyB9LXdyYXBwZXJcclxuXHQgKiBmb3IgdGhlIGdpdmVuIFwibWVzc2FnZVwiLFwibWV0aG9kXCIgJiB2YWx1ZS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBtZXNzYWdlXHRUaGUge0BsaW5rIHN0cmluZyB9IGRlc2NyaWJpbmcgdGhlIGluZnJpbmdlbWVudCBhbmQgaXQncyBwcm92ZW5pZW5jZS5cclxuXHQgKiBAcGFyYW0gbWV0aG9kIFx0VGhlIHtAbGluayBzdHJpbmcgfSBkZXNjcmliaW5nIG9yIG5hbWluZyB0aGUgdmlvbGF0b3IuXHJcblx0ICogQHBhcmFtIHZhbHVlXHRcdFRoZSBwYXJhbWV0ZXIncyB2YWx1ZS4gKi9cclxuXHRwdWJsaWMgcmVwb3J0UmV0dXJudmFsdWVJbmZyaW5nZW1lbnQoXHJcblx0XHRtZXNzYWdlOiBzdHJpbmcsXHJcblx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdHBhdGg6IHN0cmluZyxcclxuXHRcdG1ldGhvZDogc3RyaW5nLFxyXG5cdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XHJcblx0XHR2YWx1ZTogYW55LFxyXG5cdCkge1xyXG5cdFx0dGhpcy5yZXBvcnRJbmZyaW5nZW1lbnQoXHJcblx0XHRcdGBbIFJldHVybi12YWx1ZSBcIiR7dmFsdWV9XCIgZGlkIG5vdCBmdWxmaWxsIG9uZSBvZiBpdCdzIGNvbnRyYWN0czogJHttZXNzYWdlfV1gLFxyXG5cdFx0XHRtZXRob2QsXHJcblx0XHRcdHRhcmdldCxcclxuXHRcdFx0cGF0aCxcclxuXHRcdCk7XHJcblx0fVxyXG5cdC8vICNyZWdpb24gQ2xhc3Nlc1xyXG5cdC8vICNyZWdpb24gRXJyb3JzXHJcblx0LyoqIEFuIHtAbGluayBFcnJvciB9IHRvIGJlIHRocm93biB3aGVuZXZlciBhbiBpbmZyaW5nZW1lbnQgaXMgZGV0ZWN0ZWQuICovXHJcblx0cHVibGljIHN0YXRpYyBJbmZyaW5nZW1lbnQgPSBjbGFzcyBleHRlbmRzIEVycm9yIHtcclxuXHRcdC8qKlxyXG5cdFx0ICogQ29uc3RydWN0cyB0aGlzIHtAbGluayBFcnJvciB9IGJ5IHRhZ2dpbmcgdGhlIHNwZWNpZmllZCBtZXNzYWdlLXtAbGluayBzdHJpbmcgfSBhcyBhbiBYREJDLUluZnJpbmdlbWVudC5cclxuXHRcdCAqXHJcblx0XHQgKiBAcGFyYW0gbWVzc2FnZSBUaGUge0BsaW5rIHN0cmluZyB9IGRlc2NyaWJpbmcgdGhlIGluZnJpbmdlbWVudC4gKi9cclxuXHRcdGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZykge1xyXG5cdFx0XHRzdXBlcihgWyBYREJDIEluZnJpbmdlbWVudCAke21lc3NhZ2V9XWApO1xyXG5cdFx0fVxyXG5cdH07XHJcblx0Ly8gI2VuZHJlZ2lvbiBFcnJvcnNcclxuXHQvLyAjZW5kcmVnaW9uIENsYXNzZXNcclxuXHQvLyAjZW5kcmVnaW9uIGluZnJpbmdlbWVudCBoYW5kbGluZy5cclxuXHQvKipcclxuXHQgKiBSZXNvbHZlcyB0aGUgc3BlY2lmaWVkIGRvdHRlZCB7QGxpbmsgc3RyaW5nIH0tcGF0aCB0byBhIHtAbGluayBEQkMgfS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBvYmogXHRUaGUge0BsaW5rIG9iamVjdCB9IHRvIHN0YXJ0IHJlc29sdmluZyBmcm9tLlxyXG5cdCAqIEBwYXJhbSBwYXRoIFx0VGhlIGRvdHRlZCB7QGxpbmsgc3RyaW5nIH0tcGF0aCBsZWFkaW5nIHRvIHRoZSB7QGxpbmsgREJDIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBUaGUgcmVxdWVzdGVkIHtAbGluayBEQkMgfS5cclxuXHQgKi9cclxuXHRzdGF0aWMgcmVzb2x2ZURCQ1BhdGggPSAob2JqLCBwYXRoKTogREJDID0+XHJcblx0XHRwYXRoXHJcblx0XHRcdD8uc3BsaXQoXCIuXCIpXHJcblx0XHRcdC5yZWR1Y2UoKGFjY3VtdWxhdG9yLCBjdXJyZW50KSA9PiBhY2N1bXVsYXRvcltjdXJyZW50XSwgb2JqKTtcclxuXHQvKipcclxuXHQgKiBDb25zdHJ1Y3RzIHRoaXMge0BsaW5rIERCQyB9IGJ5IHNldHRpbmcgdGhlIHtAbGluayBEQkMuaW5mcmluZ2VtZW50U2V0dGluZ3MgfSwgZGVmaW5lIHRoZSAqKldhWENvZGUqKiBuYW1lc3BhY2UgaW5cclxuXHQgKiAqKndpbmRvdyoqIGlmIG5vdCB5ZXQgYXZhaWxhYmxlIGFuZCBzZXR0aW5nIHRoZSBwcm9wZXJ0eSAqKkRCQyoqIGluIHRoZXJlIHRvIHRoZSBpbnN0YW5jZSBvZiB0aGlzIHtAbGluayBEQkMgfS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBpbmZyaW5nZW1lbnRTZXR0aW5ncyBcdFNlZSB7QGxpbmsgREJDLmluZnJpbmdlbWVudFNldHRpbmdzIH0uXHJcblx0ICogQHBhcmFtIGV4ZWN1dGlvblNldHRpbmdzXHRcdFNlZSB7QGxpbmsgREJDLmV4ZWN1dGlvblNldHRpbmdzIH0uICovXHJcblx0Y29uc3RydWN0b3IoXHJcblx0XHRpbmZyaW5nZW1lbnRTZXR0aW5nczoge1xyXG5cdFx0XHR0aHJvd0V4Y2VwdGlvbjogYm9vbGVhbjtcclxuXHRcdFx0bG9nVG9Db25zb2xlOiBib29sZWFuO1xyXG5cdFx0fSA9IHsgdGhyb3dFeGNlcHRpb246IHRydWUsIGxvZ1RvQ29uc29sZTogZmFsc2UgfSxcclxuXHRcdGV4ZWN1dGlvblNldHRpbmdzOiB7XHJcblx0XHRcdGNoZWNrUHJlY29uZGl0aW9uczogYm9vbGVhbjtcclxuXHRcdFx0Y2hlY2tQb3N0Y29uZGl0aW9uczogYm9vbGVhbjtcclxuXHRcdFx0Y2hlY2tJbnZhcmlhbnRzOiBib29sZWFuO1xyXG5cdFx0fSA9IHtcclxuXHRcdFx0Y2hlY2tQcmVjb25kaXRpb25zOiB0cnVlLFxyXG5cdFx0XHRjaGVja1Bvc3Rjb25kaXRpb25zOiB0cnVlLFxyXG5cdFx0XHRjaGVja0ludmFyaWFudHM6IHRydWUsXHJcblx0XHR9LFxyXG5cdCkge1xyXG5cdFx0dGhpcy5pbmZyaW5nZW1lbnRTZXR0aW5ncyA9IGluZnJpbmdlbWVudFNldHRpbmdzO1xyXG5cclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxyXG5cdFx0aWYgKCh3aW5kb3cgYXMgYW55KS5XYVhDb2RlID09PSB1bmRlZmluZWQpICh3aW5kb3cgYXMgYW55KS5XYVhDb2RlID0ge307XHJcblx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cclxuXHRcdCh3aW5kb3cgYXMgYW55KS5XYVhDb2RlLkRCQyA9IHRoaXM7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIFJlc29sdmVzIHRoZSBkZXNpcmVkIHtAbGluayBvYmplY3QgfSBvdXQgYSBnaXZlbiBvbmUgKip0b1Jlc29sdmVGcm9tKiogdXNpbmcgdGhlIHNwZWNpZmllZCAqKnBhdGgqKi5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0b1Jlc29sdmVGcm9tIFRoZSB7QGxpbmsgb2JqZWN0IH0gc3RhcnRpbmcgdG8gcmVzb2x2ZSBmcm9tLlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRcdFx0VGhlIGRvdHRlZCBwYXRoLXtAbGluayBzdHJpbmcgfS5cclxuXHQgKiBcdFx0XHRcdFx0XHRUaGlzIHN0cmluZyB1c2VzIC4sIFsuLi5dLCBhbmQgKCkgdG8gcmVwcmVzZW50IGFjY2Vzc2luZyBuZXN0ZWQgcHJvcGVydGllcyxcclxuXHQgKiBcdFx0XHRcdFx0XHRhcnJheSBlbGVtZW50cy9vYmplY3Qga2V5cywgYW5kIGNhbGxpbmcgbWV0aG9kcywgcmVzcGVjdGl2ZWx5LCBtaW1pY2tpbmcgSmF2YVNjcmlwdCBzeW50YXggdG8gbmF2aWdhdGVcclxuXHQgKiBcdFx0XHRcdFx0XHRhbiBvYmplY3QncyBzdHJ1Y3R1cmUuIENvZGUsIGUuZy4gc29tZXRoaW5nIGxpa2UgYS5iKCAxIGFzIG51bWJlciApLmMsIHdpbGwgbm90IGJlIGV4ZWN1dGVkIGFuZFxyXG5cdCAqIFx0XHRcdFx0XHRcdHRodXMgbWFrZSB0aGUgcmV0cmlldmFsIGZhaWwuXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBUaGUgcmVxdWVzdGVkIHtAbGluayBvYmplY3QgfSwgTlVMTCBvciBVTkRFRklORUQuICovXHJcblx0cHVibGljIHN0YXRpYyByZXNvbHZlKHRvUmVzb2x2ZUZyb206IHVua25vd24sIHBhdGg6IHN0cmluZykge1xyXG5cdFx0aWYgKCF0b1Jlc29sdmVGcm9tIHx8IHR5cGVvZiBwYXRoICE9PSBcInN0cmluZ1wiKSB7XHJcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XHJcblx0XHR9XHJcblxyXG5cdFx0Y29uc3QgcGFydHMgPSBwYXRoLnJlcGxhY2UoL1xcWyhbJ1wiXT8pKC4qPylcXDFcXF0vZywgXCIuJDJcIikuc3BsaXQoXCIuXCIpOyAvLyBIYW5kbGUgaW5kZXhlcnNcclxuXHJcblx0XHRsZXQgY3VycmVudCA9IHRvUmVzb2x2ZUZyb207XHJcblx0XHRmb3IgKGNvbnN0IHBhcnQgb2YgcGFydHMpIHtcclxuXHRcdFx0aWYgKGN1cnJlbnQgPT09IG51bGwgfHwgdHlwZW9mIGN1cnJlbnQgPT09IFwidW5kZWZpbmVkXCIpIHtcclxuXHRcdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjb25zdCBtZXRob2RNYXRjaCA9IHBhcnQubWF0Y2goLyhcXHcrKVxcKCguKilcXCkvKTtcclxuXHRcdFx0aWYgKG1ldGhvZE1hdGNoKSB7XHJcblx0XHRcdFx0Y29uc3QgbWV0aG9kTmFtZSA9IG1ldGhvZE1hdGNoWzFdO1xyXG5cdFx0XHRcdGNvbnN0IGFyZ3NTdHIgPSBtZXRob2RNYXRjaFsyXTtcclxuXHRcdFx0XHRjb25zdCBhcmdzID0gYXJnc1N0ci5zcGxpdChcIixcIikubWFwKChhcmcpID0+IGFyZy50cmltKCkpOyAvLyBTaW1wbGUgYXJndW1lbnQgcGFyc2luZ1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgY3VycmVudFttZXRob2ROYW1lXSA9PT0gXCJmdW5jdGlvblwiKSB7XHJcblx0XHRcdFx0XHRjdXJyZW50ID0gY3VycmVudFttZXRob2ROYW1lXS5hcHBseShjdXJyZW50LCBhcmdzKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHVuZGVmaW5lZDsgLy8gTWV0aG9kIG5vdCBmb3VuZCBvciBub3QgYSBmdW5jdGlvblxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRjdXJyZW50ID0gY3VycmVudFtwYXJ0XTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBjdXJyZW50O1xyXG5cdH1cclxufVxyXG4vLyBTZXQgdGhlIG1haW4gaW5zdGFuY2Ugd2l0aCBzdGFuZGFyZCAqKkRCQy5pbmZyaW5nZW1lbnRTZXR0aW5ncyoqLlxyXG5uZXcgREJDKCk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFLTyxJQUFNLE1BQU4sTUFBTSxLQUFJO0FBQUE7QUFBQTtBQUFBLEVBR2hCLE9BQU8scUJBSUgsb0JBQUksSUFJTjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFXRixPQUFpQixrQkFDaEIsUUFDQSxZQUNBLE9BRUEsVUFDWTtBQUNaLFFBQUksS0FBSSxtQkFBbUIsSUFBSSxNQUFNLEdBQUc7QUFDdkMsVUFBSSxLQUFJLG1CQUFtQixJQUFJLE1BQU0sRUFBRSxJQUFJLFVBQVUsR0FBRztBQUN2RCxZQUFJLEtBQUksbUJBQW1CLElBQUksTUFBTSxFQUFFLElBQUksVUFBVSxFQUFFLElBQUksS0FBSyxHQUFHO0FBQ2xFLGVBQUksbUJBQ0YsSUFBSSxNQUFNLEVBQ1YsSUFBSSxVQUFVLEVBQ2QsSUFBSSxLQUFLLEVBQ1QsS0FBSyxRQUFRO0FBQUEsUUFDaEIsT0FBTztBQUNOLGVBQUksbUJBQ0YsSUFBSSxNQUFNLEVBQ1YsSUFBSSxVQUFVLEVBQ2QsSUFBSSxPQUFPLElBQUksTUFBcUMsUUFBUSxDQUFDO0FBQUEsUUFDaEU7QUFBQSxNQUNELE9BQU87QUFDTixhQUFJLG1CQUNGLElBQUksTUFBTSxFQUNWO0FBQUEsVUFDQTtBQUFBLFVBQ0Esb0JBQUksSUFBa0Q7QUFBQSxZQUNyRCxDQUFDLE9BQU8sSUFBSSxNQUFxQyxRQUFRLENBQUM7QUFBQSxVQUMzRCxDQUFDO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNELE9BQU87QUFDTixXQUFJLG1CQUFtQjtBQUFBLFFBQ3RCO0FBQUEsUUFDQSxvQkFBSSxJQUdGO0FBQUEsVUFDRDtBQUFBLFlBQ0M7QUFBQSxZQUNBLG9CQUFJLElBQWtEO0FBQUEsY0FDckQsQ0FBQyxPQUFPLElBQUksTUFBcUMsUUFBUSxDQUFDO0FBQUEsWUFDM0QsQ0FBQztBQUFBLFVBQ0Y7QUFBQSxRQUNELENBQUM7QUFBQSxNQUNGO0FBQUEsSUFDRDtBQUVBLFdBQU87QUFBQSxFQUNSO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBWUEsT0FBYyxtQkFDWCxRQUVBLGFBQ0EsWUFDa0I7QUFDcEIsVUFBTSxpQkFBaUIsV0FBVztBQUVsQyxlQUFXLFFBQVEsWUFBYSxNQUFhO0FBRzVDLFVBQ0MsS0FBSSxtQkFBbUIsSUFBSSxNQUFNLEtBQ2pDLEtBQUksbUJBQW1CLElBQUksTUFBTSxFQUFFLElBQUksV0FBVyxHQUNqRDtBQUNELG1CQUFXLFNBQVMsS0FBSSxtQkFDdEIsSUFBSSxNQUFNLEVBQ1YsSUFBSSxXQUFXLEVBQ2YsS0FBSyxHQUFHO0FBQ1QsY0FBSSxRQUFRLEtBQUssUUFBUTtBQUN4Qix1QkFBVyxZQUFZLEtBQUksbUJBQ3pCLElBQUksTUFBTSxFQUNWLElBQUksV0FBVyxFQUNmLElBQUksS0FBSyxHQUFHO0FBQ2IsdUJBQVMsS0FBSyxLQUFLLENBQUM7QUFBQSxZQUNyQjtBQUFBLFVBQ0Q7QUFBQSxRQUNEO0FBQUEsTUFDRDtBQUdBLGFBQU8sZUFBZSxNQUFNLE1BQU0sSUFBSTtBQUFBLElBQ3ZDO0FBRUEsV0FBTztBQUFBLEVBQ1I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBV0EsT0FBYyxrQkFDYixXQUdBLE9BQTJCLFFBQzNCLE1BQU0sZUFDTDtBQUNELFdBQU8sQ0FBQyxRQUFpQixhQUE4QixlQUFtQztBQUN6RixVQUFJLENBQUMsS0FBSSxlQUFlLFFBQVEsR0FBRyxFQUFFLGtCQUFrQixpQkFBaUI7QUFDdkU7QUFBQSxNQUNEO0FBQ0EsWUFBTSxpQkFBaUIsV0FBVztBQUMvQixZQUFNLGlCQUFpQixXQUFXO0FBRXJDLFVBQUk7QUFFSixhQUFPLGVBQWUsUUFBUSxhQUFhO0FBQUEsUUFDMUMsTUFBTTtBQUNMLGNBQ0MsQ0FBQyxLQUFJLGVBQWUsUUFBUSxHQUFHLEVBQUUsa0JBQWtCLGlCQUNsRDtBQUNEO0FBQUEsVUFDRDtBQUVBLGdCQUFNLFlBQVksT0FBTyxLQUFJLFFBQVEsTUFBTSxJQUFJLElBQUk7QUFFbkQscUJBQVcsWUFBWSxXQUFXO0FBQ2pDLGtCQUFNLFNBQVMsU0FBUyxNQUFNLFNBQVM7QUFFdkMsZ0JBQUksT0FBTyxXQUFXLFVBQVU7QUFDL0IsbUJBQUksZUFBZSxRQUFRLEdBQUcsRUFBRTtBQUFBLGdCQUMvQjtBQUFBLGdCQUNBO0FBQUEsZ0JBQ0E7QUFBQSxnQkFDQTtBQUFBLGdCQUNBO0FBQUEsY0FDRDtBQUFBLFlBQ0Q7QUFBQSxVQUNEO0FBRUEsaUJBQU8sZUFBZ0IsV0FBWTtBQUFBLFFBQ3BDO0FBQUEsUUFDQSxJQUFJLFVBQVU7QUFDYixjQUNDLENBQUMsS0FBSSxlQUFlLFFBQVEsR0FBRyxFQUFFLGtCQUFrQixpQkFDbEQ7QUFDRDtBQUFBLFVBQ0Q7QUFFQSxnQkFBTSxZQUFZLE9BQU8sS0FBSSxRQUFRLE1BQU0sSUFBSSxJQUFJO0FBRW5ELHFCQUFXLFlBQVksV0FBVztBQUNqQyxrQkFBTSxTQUFTLFNBQVMsTUFBTSxTQUFTO0FBRXZDLGdCQUFJLE9BQU8sV0FBVyxVQUFVO0FBQy9CLG1CQUFJLGVBQWUsUUFBUSxHQUFHLEVBQUU7QUFBQSxnQkFDL0I7QUFBQSxnQkFDQTtBQUFBLGdCQUNBO0FBQUEsZ0JBQ0E7QUFBQSxnQkFDQTtBQUFBLGNBQ0Q7QUFBQSxZQUNEO0FBQUEsVUFDRDtBQUVBLGtCQUFRO0FBQUEsUUFDVDtBQUFBLFFBQ0EsWUFBWTtBQUFBLFFBQ1osY0FBYztBQUFBLE1BQ2YsQ0FBQztBQUFBLElBRUY7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBWUEsT0FBYyxhQUNiLFdBR0EsT0FBMkIsUUFDM0IsTUFBTSxlQUNMO0FBQ0QsV0FBTyxDQUFDLFFBQWlCLGdCQUFpQztBQUN6RCxVQUFJLENBQUMsS0FBSSxlQUFlLFFBQVEsR0FBRyxFQUFFLGtCQUFrQixpQkFBaUI7QUFDdkU7QUFBQSxNQUNEO0FBRUEsVUFBSTtBQUVKLGFBQU8sZUFBZSxRQUFRLGFBQWE7QUFBQSxRQUMxQyxJQUFJLFVBQVU7QUFDYixjQUNDLENBQUMsS0FBSSxlQUFlLFFBQVEsR0FBRyxFQUFFLGtCQUFrQixpQkFDbEQ7QUFDRDtBQUFBLFVBQ0Q7QUFFQSxnQkFBTSxZQUFZLE9BQU8sS0FBSSxRQUFRLFVBQVUsSUFBSSxJQUFJO0FBRXZELHFCQUFXLFlBQVksV0FBVztBQUNqQyxrQkFBTSxTQUFTLFNBQVMsTUFBTSxTQUFTO0FBRXZDLGdCQUFJLE9BQU8sV0FBVyxVQUFVO0FBQy9CLG1CQUFJLGVBQWUsUUFBUSxHQUFHLEVBQUU7QUFBQSxnQkFDL0I7QUFBQSxnQkFDQTtBQUFBLGdCQUNBO0FBQUEsZ0JBQ0E7QUFBQSxnQkFDQTtBQUFBLGNBQ0Q7QUFBQSxZQUNEO0FBQUEsVUFDRDtBQUVBLGtCQUFRO0FBQUEsUUFDVDtBQUFBLFFBQ0EsWUFBWTtBQUFBLFFBQ1osY0FBYztBQUFBLE1BQ2YsQ0FBQztBQUFBLElBRUY7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFhQSxPQUFjLGlCQUViLE9BQ0EsS0FDQSxPQUEyQixRQUMxQjtBQUNELFdBQU8sQ0FDTixRQUNBLGFBQ0EsZUFDd0I7QUFDeEIsWUFBTSxpQkFBaUIsV0FBVztBQUVsQyxpQkFBVyxRQUFRLElBQUksU0FBZ0I7QUFDdEMsWUFDQyxDQUFDLEtBQUksZUFBZSxRQUFRLEdBQUcsRUFBRSxrQkFBa0IscUJBQ2xEO0FBQ0Q7QUFBQSxRQUNEO0FBRUEsY0FBTSxTQUFTLGVBQWUsTUFBTSxNQUFNLElBQUk7QUFDOUMsY0FBTSxZQUFZLE9BQU8sS0FBSSxRQUFRLFFBQVEsSUFBSSxJQUFJO0FBQ3JELGNBQU0sY0FBYyxNQUFNLFdBQVcsUUFBUSxXQUFXO0FBRXhELFlBQUksT0FBTyxnQkFBZ0IsVUFBVTtBQUNwQyxlQUFJLGVBQWUsUUFBUSxHQUFHLEVBQUU7QUFBQSxZQUMvQjtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNEO0FBQUEsUUFDRDtBQUVBLGVBQU87QUFBQSxNQUNSO0FBRUEsYUFBTztBQUFBLElBQ1I7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWNBLE9BQWlCLGdCQUNoQixPQUNBLEtBQ0EsT0FBMkIsUUFLbEI7QUFDVCxXQUFPLENBQ04sUUFDQSxZQUNBLG1CQUNVO0FBQ1YsV0FBSTtBQUFBLFFBQ0g7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0EsQ0FBQyxVQUFtQjtBQUNuQixjQUNDLENBQUMsS0FBSSxlQUFlLFFBQVEsR0FBRyxFQUFFLGtCQUMvQixvQkFDRDtBQUNEO0FBQUEsVUFDRDtBQUVBLGdCQUFNLFlBQVksT0FBTyxLQUFJLFFBQVEsT0FBTyxJQUFJLElBQUk7QUFDcEQsZ0JBQU0sU0FBUyxNQUFNLFdBQVcsUUFBUSxZQUFZLGNBQWM7QUFFbEUsY0FBSSxPQUFPLFdBQVcsVUFBVTtBQUMvQixpQkFBSSxlQUFlLFFBQVEsR0FBRyxFQUFFO0FBQUEsY0FDL0I7QUFBQSxjQUNBO0FBQUEsY0FDQTtBQUFBLGNBQ0E7QUFBQSxjQUNBO0FBQUEsY0FDQTtBQUFBLFlBQ0Q7QUFBQSxVQUNEO0FBQUEsUUFDRDtBQUFBLE1BQ0Q7QUFBQSxJQUNEO0FBQUEsRUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLTyxvQkFJSDtBQUFBLElBQ0gsb0JBQW9CO0FBQUEsSUFDcEIscUJBQXFCO0FBQUEsSUFDckIsaUJBQWlCO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUlPLGtCQUVILEVBQUUsY0FBYyxLQUFLO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtmLGNBQWMsU0FBNEI7QUFDbkQsUUFBSSxLQUFLLGdCQUFnQixjQUFjO0FBQ3RDLGNBQVEsS0FBSyxPQUFPO0FBQUEsSUFDckI7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFJTyx1QkFHSCxFQUFFLGdCQUFnQixNQUFNLGNBQWMsTUFBTTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT3RDLG1CQUNULFNBQ0EsVUFDQSxRQUNBLE1BQ1k7QUFDWixVQUFNLGVBQXVCLFdBQVcsUUFBUSxJQUFJLE9BQU8sY0FBYyxJQUFJLE1BQU0sRUFBRSxHQUFHLE9BQU8sV0FBVyxhQUFhLFFBQVEsT0FBTyxJQUFJLE1BQU0sT0FBTyxXQUFXLFlBQVksV0FBVyxRQUFRLE9BQU8sT0FBTyxnQkFBZ0IsYUFBYSxRQUFRLE9BQU8sWUFBWSxJQUFJLE1BQU0sRUFBRSxLQUFLLE9BQU87QUFFL1IsUUFBSSxLQUFLLHFCQUFxQixnQkFBZ0I7QUFDN0MsWUFBTSxJQUFJLEtBQUksYUFBYSxZQUFZO0FBQUEsSUFDeEM7QUFFQSxRQUFJLEtBQUsscUJBQXFCLGNBQWM7QUFDM0MsY0FBUSxJQUFJLFlBQVk7QUFBQSxJQUN6QjtBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFTTyw0QkFDTixTQUNBLFFBQ0EsTUFDQSxRQUNBLE9BQ0EsT0FDWTtBQUNaLFVBQU0sY0FBYyxRQUFRO0FBRTVCLFNBQUs7QUFBQSxNQUNKLHNCQUFzQixLQUFLLFlBQVksV0FBVyxHQUFHLGdCQUFnQixJQUFJLE9BQU8sZ0JBQWdCLElBQUksT0FBTyxnQkFBZ0IsSUFBSSxPQUFPLElBQUkscURBQXFELE9BQU87QUFBQSxNQUN0TTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVPLHdCQUNOLFNBQ0EsUUFDQSxNQUNBLEtBQ0EsT0FDWTtBQUNaLFNBQUs7QUFBQSxNQUNKLG9CQUFvQixHQUFHLElBQUksU0FBUyxTQUFZLEtBQUssSUFBSSxJQUFJLEVBQUUsZ0JBQWdCLEtBQUssNENBQTRDLE9BQU87QUFBQSxNQUN2STtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUU8sOEJBQ04sU0FDQSxRQUNBLE1BQ0EsUUFFQSxPQUNDO0FBQ0QsU0FBSztBQUFBLE1BQ0osbUJBQW1CLEtBQUssNENBQTRDLE9BQU87QUFBQSxNQUMzRTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUlBLE9BQWMsZUFBZSxjQUFjLE1BQU07QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBS2hELFlBQVksU0FBaUI7QUFDNUIsWUFBTSx1QkFBdUIsT0FBTyxHQUFHO0FBQUEsSUFDeEM7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBWUEsT0FBTyxpQkFBaUIsQ0FBQyxLQUFLLFNBQzdCLE1BQ0csTUFBTSxHQUFHLEVBQ1YsT0FBTyxDQUFDLGFBQWEsWUFBWSxZQUFZLE9BQU8sR0FBRyxHQUFHO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPN0QsWUFDQyx1QkFHSSxFQUFFLGdCQUFnQixNQUFNLGNBQWMsTUFBTSxHQUNoRCxvQkFJSTtBQUFBLElBQ0gsb0JBQW9CO0FBQUEsSUFDcEIscUJBQXFCO0FBQUEsSUFDckIsaUJBQWlCO0FBQUEsRUFDbEIsR0FDQztBQUNELFNBQUssdUJBQXVCO0FBRzVCLFFBQUssT0FBZSxZQUFZLE9BQVcsQ0FBQyxPQUFlLFVBQVUsQ0FBQztBQUV0RSxJQUFDLE9BQWUsUUFBUSxNQUFNO0FBQUEsRUFDL0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFZQSxPQUFjLFFBQVEsZUFBd0IsTUFBYztBQUMzRCxRQUFJLENBQUMsaUJBQWlCLE9BQU8sU0FBUyxVQUFVO0FBQy9DLGFBQU87QUFBQSxJQUNSO0FBRUEsVUFBTSxRQUFRLEtBQUssUUFBUSx1QkFBdUIsS0FBSyxFQUFFLE1BQU0sR0FBRztBQUVsRSxRQUFJLFVBQVU7QUFDZCxlQUFXLFFBQVEsT0FBTztBQUN6QixVQUFJLFlBQVksUUFBUSxPQUFPLFlBQVksYUFBYTtBQUN2RCxlQUFPO0FBQUEsTUFDUjtBQUVBLFlBQU0sY0FBYyxLQUFLLE1BQU0sZUFBZTtBQUM5QyxVQUFJLGFBQWE7QUFDaEIsY0FBTSxhQUFhLFlBQVksQ0FBQztBQUNoQyxjQUFNLFVBQVUsWUFBWSxDQUFDO0FBQzdCLGNBQU0sT0FBTyxRQUFRLE1BQU0sR0FBRyxFQUFFLElBQUksQ0FBQyxRQUFRLElBQUksS0FBSyxDQUFDO0FBQ3ZELFlBQUksT0FBTyxRQUFRLFVBQVUsTUFBTSxZQUFZO0FBQzlDLG9CQUFVLFFBQVEsVUFBVSxFQUFFLE1BQU0sU0FBUyxJQUFJO0FBQUEsUUFDbEQsT0FBTztBQUNOLGlCQUFPO0FBQUEsUUFDUjtBQUFBLE1BQ0QsT0FBTztBQUNOLGtCQUFVLFFBQVEsSUFBSTtBQUFBLE1BQ3ZCO0FBQUEsSUFDRDtBQUVBLFdBQU87QUFBQSxFQUNSO0FBQ0Q7QUFFQSxJQUFJLElBQUk7IiwKICAibmFtZXMiOiBbXQp9Cg==
