import {
  AE
} from "./chunk-RSH3LX4Y.js";
import {
  DBC
} from "./chunk-7Z6CEUOW.js";
import {
  __decorateClass
} from "./chunk-KWZW6WYL.js";

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

// src/js/EPs/dom.query.ts
var _DOM_Query = class _DOM_Query {
  static retrieve(params) {
    const result = document.querySelector(params[0]);
    return [result];
  }
  static {
    /**
     * States whether this {@link DOM_Query } was successfully registered
     * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
    this.registered = (() => {
      return window.codbi.registerEP("DOM.Query", _DOM_Query.retrieve);
    })();
  }
  // #region Initialization
};
__decorateClass([
  AE.POST(new EQ(null, true), 0)
], _DOM_Query, "retrieve", 1);
var DOM_Query = _DOM_Query;
export {
  DOM_Query
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL25vZGVfbW9kdWxlcy94ZGJjL3NyYy9EQkMvRVEudHMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL3BhY2thZ2VzL2Zvcm0vc3JjL2pzL0VQcy9kb20ucXVlcnkudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IERCQyB9IGZyb20gXCIuLi9EQkNcIjtcclxuLyoqXHJcbiAqIEEge0BsaW5rIERCQyB9IGRlZmluaW5nIHRoYXQgdHdvIHtAbGluayBvYmplY3QgfXMgZ290dGEgYmUgZXF1YWwuXHJcbiAqXHJcbiAqIEByZW1hcmtzXHJcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoWERCQ0BXYVhDb2RlLm5ldCkgKi9cclxuZXhwb3J0IGNsYXNzIEVRIGV4dGVuZHMgREJDIHtcclxuXHQvLyAjcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvKipcclxuXHQgKiBDaGVja3MgaWYgdGhlIHZhbHVlICoqdG9DaGVjayoqIGlzIGVxdWFsIHRvIHRoZSBzcGVjaWZpZWQgKiplcXVpdmFsZW50KiouXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdG9DaGVja1x0XHRUaGUgdmFsdWUgdGhhdCBoYXMgdG8gYmUgZXF1YWwgdG8gaXQncyBwb3NzaWJsZSAqKmVxdWl2YWxlbnQqKiBmb3IgdGhpcyB7QGxpbmsgREJDIH0gdG8gYmUgZnVsZmlsbGVkLlxyXG5cdCAqIEBwYXJhbSBlcXVpdmFsZW50XHRUaGUge0BsaW5rIG9iamVjdCB9IHRoZSBvbmUgKip0b0NoZWNrKiogaGFzIHRvIGJlIGVxdWFsIHRvIGluIG9yZGVyIGZvciB0aGlzIHtAbGluayBEQkMgfSB0byBiZVxyXG5cdCAqIFx0XHRcdFx0XHRcdGZ1bGZpbGxlZC5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFRSVUUgaWYgdGhlIHZhbHVlICoqdG9DaGVjayoqIGFuZCB0aGUgKiplcXVpdmFsZW50KiogYXJlIGVxdWFsIHRvIGVhY2ggb3RoZXIsIG90aGVyd2lzZSBGQUxTRS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIGNoZWNrQWxnb3JpdGhtKFxyXG5cdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XHJcblx0XHR0b0NoZWNrOiBhbnksXHJcblx0XHRlcXVpdmFsZW50OiBvYmplY3QsXHJcblx0XHRpbnZlcnQsXHJcblx0KTogYm9vbGVhbiB8IHN0cmluZyB7XHJcblx0XHRpZiAoIWludmVydCAmJiBlcXVpdmFsZW50ICE9PSB0b0NoZWNrKSB7XHJcblx0XHRcdHJldHVybiBgVmFsdWUgaGFzIHRvIHRvIGJlIGVxdWFsIHRvIFwiJHtlcXVpdmFsZW50fVwiYDtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoaW52ZXJ0ICYmIGVxdWl2YWxlbnQgPT09IHRvQ2hlY2spIHtcclxuXHRcdFx0cmV0dXJuIGBWYWx1ZSBtdXN0IG5vdCB0byBiZSBlcXVhbCB0byBcIiR7ZXF1aXZhbGVudH1cImA7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHRydWU7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgcGFyYW1ldGVyLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcclxuXHQgKiBieSB0aGUgdGFnZ2VkIHBhcmFtZXRlci5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBlcXVpdmFsZW50XHRTZWUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIHBhdGhcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cclxuXHQgKiBAcGFyYW0gZGJjXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIFBSRShcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogVG8gY2hlY2sgZm9yIFVOREVGSU5FRCBhbmQgTlVMTC5cclxuXHRcdGVxdWl2YWxlbnQ6IGFueSxcclxuXHRcdGludmVydCA9IGZhbHNlLFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjID0gXCJXYVhDb2RlLkRCQ1wiLFxyXG5cdCk6IChcclxuXHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0bWV0aG9kTmFtZTogc3RyaW5nIHwgc3ltYm9sLFxyXG5cdFx0cGFyYW1ldGVySW5kZXg6IG51bWJlcixcclxuXHQpID0+IHZvaWQge1xyXG5cdFx0cmV0dXJuIERCQy5kZWNQcmVjb25kaXRpb24oXHJcblx0XHRcdChcclxuXHRcdFx0XHR2YWx1ZTogb2JqZWN0LFxyXG5cdFx0XHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0XHRcdG1ldGhvZE5hbWU6IHN0cmluZyxcclxuXHRcdFx0XHRwYXJhbWV0ZXJJbmRleDogbnVtYmVyLFxyXG5cdFx0XHQpID0+IHtcclxuXHRcdFx0XHRyZXR1cm4gRVEuY2hlY2tBbGdvcml0aG0odmFsdWUsIGVxdWl2YWxlbnQsIGludmVydCk7XHJcblx0XHRcdH0sXHJcblx0XHRcdGRiYyxcclxuXHRcdFx0cGF0aCxcclxuXHRcdCk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcclxuXHQgKiBieSB0aGUgdGFnZ2VkIG1ldGhvZCdzIHJldHVybnZhbHVlLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIGVxdWl2YWxlbnRcdFNlZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gcGF0aFx0XHRcdFNlZSB7QGxpbmsgREJDLlBvc3Rjb25kaXRpb24gfS5cclxuXHQgKiBAcGFyYW0gZGJjXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgUE9TVChcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogVG8gY2hlY2sgZm9yIFVOREVGSU5FRCBhbmQgTlVMTC5cclxuXHRcdGVxdWl2YWxlbnQ6IGFueSxcclxuXHRcdGludmVydCA9IGZhbHNlLFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjID0gXCJXYVhDb2RlLkRCQ1wiLFxyXG5cdCk6IChcclxuXHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0cHJvcGVydHlLZXk6IHN0cmluZyxcclxuXHRcdGRlc2NyaXB0b3I6IFByb3BlcnR5RGVzY3JpcHRvcixcclxuXHQpID0+IFByb3BlcnR5RGVzY3JpcHRvciB7XHJcblx0XHRyZXR1cm4gREJDLmRlY1Bvc3Rjb25kaXRpb24oXHJcblx0XHRcdCh2YWx1ZTogb2JqZWN0LCB0YXJnZXQ6IG9iamVjdCwgcHJvcGVydHlLZXk6IHN0cmluZykgPT4ge1xyXG5cdFx0XHRcdHJldHVybiBFUS5jaGVja0FsZ29yaXRobSh2YWx1ZSwgZXF1aXZhbGVudCwgaW52ZXJ0KTtcclxuXHRcdFx0fSxcclxuXHRcdFx0ZGJjLFxyXG5cdFx0XHRwYXRoLFxyXG5cdFx0KTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogQSBmaWVsZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXHJcblx0ICogYnkgdGhlIHRhZ2dlZCBmaWVsZC5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBlcXVpdmFsZW50XHRTZWUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIHBhdGhcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cclxuXHQgKiBAcGFyYW0gZGJjXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIElOVkFSSUFOVChcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogVG8gY2hlY2sgZm9yIFVOREVGSU5FRCBhbmQgTlVMTC5cclxuXHRcdGVxdWl2YWxlbnQ6IGFueSxcclxuXHRcdGludmVydCA9IGZhbHNlLFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjID0gXCJXYVhDb2RlLkRCQ1wiLFxyXG5cdCkge1xyXG5cdFx0cmV0dXJuIERCQy5kZWNJbnZhcmlhbnQoW25ldyBFUShlcXVpdmFsZW50LCBpbnZlcnQpXSwgcGF0aCwgZGJjKTtcclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXHJcblx0Ly8gI3JlZ2lvbiBSZWZlcmVuY2VkIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvL1xyXG5cdC8vIEZvciB1c2FnZSBpbiBkeW5hbWljIHNjZW5hcmlvcyAobGlrZSB3aXRoIEFFLURCQykuXHJcblx0Ly9cclxuXHQvKipcclxuXHQgKiBJbnZva2VzIHRoZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfSBwYXNzaW5nIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiwge0BsaW5rIEVRLmVxdWl2YWxlbnQgfSBhbmQge0BsaW5rIEVRLmludmVydCB9LlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHRvQ2hlY2sgU2VlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobX0uICovXHJcblx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBOZWNlc3NhcnkgdG8gY2hlY2sgYWdhaW5zdCBOVUxMICYgVU5ERUZJTkVELlxyXG5cdHB1YmxpYyBjaGVjayh0b0NoZWNrOiBhbnkpIHtcclxuXHRcdHJldHVybiBFUS5jaGVja0FsZ29yaXRobSh0b0NoZWNrLCB0aGlzLmVxdWl2YWxlbnQsIHRoaXMuaW52ZXJ0KTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogSW52b2tlcyB0aGUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0gcGFzc2luZyB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHRoZSBzcGVjaWZpZWQgKip0eXBlKiogLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHRvQ2hlY2sgU2VlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgVGhlICoqQ0FORElEQVRFKiogKip0b0NoZWNrKiogZG9lc24ndCBmdWxmaWxsIHRoaXMge0BsaW5rIEVRIH0uXHJcblx0ICogXHJcblx0ICogQHRocm93cyBBIHtAbGluayBEQkMuSW5mcmluZ2VtZW50IH0gaWYgdGhlICoqQ0FORElEQVRFKiogKip0b0NoZWNrKiogZG9lcyBub3QgZnVsZmlsbCB0aGlzIHtAbGluayBFUSB9LiovXHJcblx0cHVibGljIHN0YXRpYyB0c0NoZWNrPENBTkRJREFURT4oIHRvQ2hlY2sgOiBDQU5ESURBVEUgfCB1bmRlZmluZWQgfCBudWxsLCBlcXVpdmFsZW50IDogYW55ICkgOiBDQU5ESURBVEUge1xyXG5cdFx0Y29uc3QgcmVzdWx0ID0gRVEuY2hlY2tBbGdvcml0aG0odG9DaGVjaywgZXF1aXZhbGVudCwgZmFsc2UgKTtcclxuXHJcblx0XHRpZiggcmVzdWx0ICkge1xyXG5cdFx0XHRyZXR1cm4gdG9DaGVjayBhcyBDQU5ESURBVEUgO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHRocm93IG5ldyBEQkMuSW5mcmluZ2VtZW50KCByZXN1bHQgYXMgc3RyaW5nICk7XHJcblx0XHR9XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIENyZWF0ZXMgdGhpcyB7QGxpbmsgRVEgfSBieSBzZXR0aW5nIHRoZSBwcm90ZWN0ZWQgcHJvcGVydHkge0BsaW5rIEVRLmVxdWl2YWxlbnQgfSB1c2VkIGJ5IHtAbGluayBFUS5jaGVjayB9LlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIGVxdWl2YWxlbnQgU2VlIHtAbGluayBFUS5jaGVjayB9LiAqL1xyXG5cdHB1YmxpYyBjb25zdHJ1Y3RvcihcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogVG8gYmUgYWJsZSB0byBtYXRjaCBVTkRFRklORUQgYW5kIE5VTEwuXHJcblx0XHRwcm90ZWN0ZWQgZXF1aXZhbGVudDogYW55LFxyXG5cdFx0cHJvdGVjdGVkIGludmVydCA9IGZhbHNlLFxyXG5cdCkge1xyXG5cdFx0c3VwZXIoKTtcclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBSZWZlcmVuY2VkIENvbmRpdGlvbiBjaGVja2luZy5cclxufVxyXG4iLCAiLy8gI3JlZ2lvbiBJbXBvcnRzXG4vLyAjcmVnaW9uIFhEQkNcbmltcG9ydCB7IEFFIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9BRVwiO1xuaW1wb3J0IHsgRVEgfSBmcm9tIFwieGRiYy9zcmMvREJDL0VRXCI7XG4vLyAjZW5kcmVnaW9uIFhEQkNcbi8vICNlbmRyZWdpb24gSW1wb3J0c1xuLyoqXG4gKiBUaGlzICoqRSoqbGVtZW50LSoqUCoqbGFjZWhvbGRlciBxdWVyaWVzIGFuIHtAbGluayBFbGVtZW50IH0uXG4gKlxuICogUGxhY2Vob2xkZXIgUGFyYW1ldGVyOlxuICogIFRoZSBDU1MtU2VsZWN0b3IgdGFyZ2V0aW5nIHRoZSBkZXNpcmVkIHtAbGluayBFbGVtZW50IH0uXG4gKlxuICogQHJlbWFya3NcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoU2FsdmF0b3JlLkNhbGxhcmlAQW5zYmFjaC5kZSkgKi9cbi8vIGJpb21lLWlnbm9yZSBsaW50L2NvbXBsZXhpdHkvbm9TdGF0aWNPbmx5Q2xhc3M6IFByb2FjdGl2ZSBkZXNpZ24uXG5leHBvcnQgY2xhc3MgRE9NX1F1ZXJ5IHtcbiAgLyoqXG4gICAqIENoZWNrcyBhbGwgXCJwYXJhbXNcIiBmb3Igc3BlY2lmaWMgZGF0YSAoc2VlIHtAbGluayBEYXRlX1dlZWtlbmRzIH0pIGFuZCByZXR1cm4gYW4ge0BsaW5rIEFycmF5IH0gb2ZcbiAgICogRGF0ZS17QGxpbmsgc3RyaW5nc30uXG4gICAqXG4gICAqIEBwYXJhbSBwYXJhbXMgVGhlIHBhcmFtZXRlcnMgZm9yIHRoYXQgRWxlbWVudC1QbGFjZWhvbGRlciAocHJvdmlkZWQgYnkgQ29kQmkpLiAqL1xuICBAQUUuUE9TVChuZXcgRVEobnVsbCwgdHJ1ZSksIDApXG4gIHB1YmxpYyBzdGF0aWMgcmV0cmlldmUocGFyYW1zOiBBcnJheTxzdHJpbmc+KTogQXJyYXk8RWxlbWVudCB8IG51bGw+IHtcbiAgICBjb25zdCByZXN1bHQ6IEVsZW1lbnQgfCBudWxsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihwYXJhbXNbMF0gYXMgc3RyaW5nKTtcblxuICAgIHJldHVybiBbcmVzdWx0XTtcbiAgfVxuICAvKipcbiAgICogU3RhdGVzIHdoZXRoZXIgdGhpcyB7QGxpbmsgRE9NX1F1ZXJ5IH0gd2FzIHN1Y2Nlc3NmdWxseSByZWdpc3RlcmVkXG4gICAqIHZpYSB7QGxpbmsgQ29kYmlHbG9iYWwucmVnaXN0ZXJFUCB9IHdpdGggdGhlIENvZEJpIGFuZCBwZXJmb3JtcyB0aGUgcmVnaXN0cmF0aW9uIHVwb24gY2xhc3MgdXNhZ2UuKi9cbiAgcHVibGljIHN0YXRpYyByZWdpc3RlcmVkOiBib29sZWFuID0gKCgpID0+IHtcbiAgICByZXR1cm4gd2luZG93LmNvZGJpLnJlZ2lzdGVyRVAoXCJET00uUXVlcnlcIiwgRE9NX1F1ZXJ5LnJldHJpZXZlKTtcbiAgfSkoKTtcbiAgLy8gI3JlZ2lvbiBJbml0aWFsaXphdGlvblxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7QUFNTyxJQUFNLEtBQU4sTUFBTSxZQUFXLElBQUk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBOElwQixZQUVJLFlBQ0EsU0FBUyxPQUNsQjtBQUNELFVBQU07QUFISTtBQUNBO0FBQUEsRUFHWDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBMUlBLE9BQWMsZUFFYixTQUNBLFlBQ0EsUUFDbUI7QUFDbkIsUUFBSSxDQUFDLFVBQVUsZUFBZSxTQUFTO0FBQ3RDLGFBQU8sZ0NBQWdDLFVBQVU7QUFBQSxJQUNsRDtBQUVBLFFBQUksVUFBVSxlQUFlLFNBQVM7QUFDckMsYUFBTyxrQ0FBa0MsVUFBVTtBQUFBLElBQ3BEO0FBRUEsV0FBTztBQUFBLEVBQ1I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVBLE9BQWMsSUFFYixZQUNBLFNBQVMsT0FDVCxPQUEyQixRQUMzQixNQUFNLGVBS0c7QUFDVCxXQUFPLElBQUk7QUFBQSxNQUNWLENBQ0MsT0FDQSxRQUNBLFlBQ0EsbUJBQ0k7QUFDSixlQUFPLElBQUcsZUFBZSxPQUFPLFlBQVksTUFBTTtBQUFBLE1BQ25EO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNEO0FBQUEsRUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVUEsT0FBYyxLQUViLFlBQ0EsU0FBUyxPQUNULE9BQTJCLFFBQzNCLE1BQU0sZUFLaUI7QUFDdkIsV0FBTyxJQUFJO0FBQUEsTUFDVixDQUFDLE9BQWUsUUFBZ0IsZ0JBQXdCO0FBQ3ZELGVBQU8sSUFBRyxlQUFlLE9BQU8sWUFBWSxNQUFNO0FBQUEsTUFDbkQ7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Q7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFVQSxPQUFjLFVBRWIsWUFDQSxTQUFTLE9BQ1QsT0FBMkIsUUFDM0IsTUFBTSxlQUNMO0FBQ0QsV0FBTyxJQUFJLGFBQWEsQ0FBQyxJQUFJLElBQUcsWUFBWSxNQUFNLENBQUMsR0FBRyxNQUFNLEdBQUc7QUFBQSxFQUNoRTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBYU8sTUFBTSxTQUFjO0FBQzFCLFdBQU8sSUFBRyxlQUFlLFNBQVMsS0FBSyxZQUFZLEtBQUssTUFBTTtBQUFBLEVBQy9EO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBU0EsT0FBYyxRQUFvQixTQUF3QyxZQUErQjtBQUN4RyxVQUFNLFNBQVMsSUFBRyxlQUFlLFNBQVMsWUFBWSxLQUFNO0FBRTVELFFBQUksUUFBUztBQUNaLGFBQU87QUFBQSxJQUNSLE9BQ0s7QUFDSixZQUFNLElBQUksSUFBSSxhQUFjLE1BQWlCO0FBQUEsSUFDOUM7QUFBQSxFQUNEO0FBQUE7QUFhRDs7O0FDN0lPLElBQU0sYUFBTixNQUFNLFdBQVU7QUFBQSxFQU9yQixPQUFjLFNBQVMsUUFBOEM7QUFDbkUsVUFBTSxTQUF5QixTQUFTLGNBQWMsT0FBTyxDQUFDLENBQVc7QUFFekUsV0FBTyxDQUFDLE1BQU07QUFBQSxFQUNoQjtBQUFBLEVBSUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQUFjLGNBQXVCLE1BQU07QUFDekMsYUFBTyxPQUFPLE1BQU0sV0FBVyxhQUFhLFdBQVUsUUFBUTtBQUFBLElBQ2hFLEdBQUc7QUFBQTtBQUFBO0FBRUw7QUFaZ0I7QUFBQSxFQURiLEdBQUcsS0FBSyxJQUFJLEdBQUcsTUFBTSxJQUFJLEdBQUcsQ0FBQztBQUFBLEdBTm5CLFlBT0c7QUFQVCxJQUFNLFlBQU47IiwKICAibmFtZXMiOiBbXQp9Cg==
