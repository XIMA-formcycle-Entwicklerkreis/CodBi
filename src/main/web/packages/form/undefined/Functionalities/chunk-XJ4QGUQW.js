import { DBC } from "./chunk-WDRNTVZG.js";

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
      path,
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
      path,
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

export { EQ };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3hkYmMvc3JjL0RCQy9FUS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgREJDIH0gZnJvbSBcIi4uL0RCQ1wiO1xyXG4vKipcclxuICogQSB7QGxpbmsgREJDIH0gZGVmaW5pbmcgdGhhdCB0d28ge0BsaW5rIG9iamVjdCB9cyBnb3R0YSBiZSBlcXVhbC5cclxuICpcclxuICogQHJlbWFya3NcclxuICogTWFpbnRhaW5lcjogQ2FsbGFyaSwgU2FsdmF0b3JlIChYREJDQFdhWENvZGUubmV0KSAqL1xyXG5leHBvcnQgY2xhc3MgRVEgZXh0ZW5kcyBEQkMge1xyXG5cdC8vICNyZWdpb24gQ29uZGl0aW9uIGNoZWNraW5nLlxyXG5cdC8qKlxyXG5cdCAqIENoZWNrcyBpZiB0aGUgdmFsdWUgKip0b0NoZWNrKiogaXMgZXF1YWwgdG8gdGhlIHNwZWNpZmllZCAqKmVxdWl2YWxlbnQqKi5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0b0NoZWNrXHRcdFRoZSB2YWx1ZSB0aGF0IGhhcyB0byBiZSBlcXVhbCB0byBpdCdzIHBvc3NpYmxlICoqZXF1aXZhbGVudCoqIGZvciB0aGlzIHtAbGluayBEQkMgfSB0byBiZSBmdWxmaWxsZWQuXHJcblx0ICogQHBhcmFtIGVxdWl2YWxlbnRcdFRoZSB7QGxpbmsgb2JqZWN0IH0gdGhlIG9uZSAqKnRvQ2hlY2sqKiBoYXMgdG8gYmUgZXF1YWwgdG8gaW4gb3JkZXIgZm9yIHRoaXMge0BsaW5rIERCQyB9IHRvIGJlXHJcblx0ICogXHRcdFx0XHRcdFx0ZnVsZmlsbGVkLlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgVFJVRSBpZiB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHRoZSAqKmVxdWl2YWxlbnQqKiBhcmUgZXF1YWwgdG8gZWFjaCBvdGhlciwgb3RoZXJ3aXNlIEZBTFNFLiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgY2hlY2tBbGdvcml0aG0oXHJcblx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cclxuXHRcdHRvQ2hlY2s6IGFueSxcclxuXHRcdGVxdWl2YWxlbnQ6IG9iamVjdCxcclxuXHRcdGludmVydCxcclxuXHQpOiBib29sZWFuIHwgc3RyaW5nIHtcclxuXHRcdGlmICghaW52ZXJ0ICYmIGVxdWl2YWxlbnQgIT09IHRvQ2hlY2spIHtcclxuXHRcdFx0cmV0dXJuIGBWYWx1ZSBoYXMgdG8gdG8gYmUgZXF1YWwgdG8gXCIke2VxdWl2YWxlbnR9XCJgO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChpbnZlcnQgJiYgZXF1aXZhbGVudCA9PT0gdG9DaGVjaykge1xyXG5cdFx0XHRyZXR1cm4gYFZhbHVlIG11c3Qgbm90IHRvIGJlIGVxdWFsIHRvIFwiJHtlcXVpdmFsZW50fVwiYDtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdHJ1ZTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogQSBwYXJhbWV0ZXItZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxyXG5cdCAqIGJ5IHRoZSB0YWdnZWQgcGFyYW1ldGVyLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIGVxdWl2YWxlbnRcdFNlZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gcGF0aFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqIEBwYXJhbSBkYmNcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgUFJFKFxyXG5cdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBUbyBjaGVjayBmb3IgVU5ERUZJTkVEIGFuZCBOVUxMLlxyXG5cdFx0ZXF1aXZhbGVudDogYW55LFxyXG5cdFx0aW52ZXJ0ID0gZmFsc2UsXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXHJcblx0KTogKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRtZXRob2ROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXHJcblx0XHRwYXJhbWV0ZXJJbmRleDogbnVtYmVyLFxyXG5cdCkgPT4gdm9pZCB7XHJcblx0XHRyZXR1cm4gREJDLmRlY1ByZWNvbmRpdGlvbihcclxuXHRcdFx0KFxyXG5cdFx0XHRcdHZhbHVlOiBvYmplY3QsXHJcblx0XHRcdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRcdFx0bWV0aG9kTmFtZTogc3RyaW5nLFxyXG5cdFx0XHRcdHBhcmFtZXRlckluZGV4OiBudW1iZXIsXHJcblx0XHRcdCkgPT4ge1xyXG5cdFx0XHRcdHJldHVybiBFUS5jaGVja0FsZ29yaXRobSh2YWx1ZSwgZXF1aXZhbGVudCwgaW52ZXJ0KTtcclxuXHRcdFx0fSxcclxuXHRcdFx0ZGJjLFxyXG5cdFx0XHRwYXRoLFxyXG5cdFx0KTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogQSBtZXRob2QtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxyXG5cdCAqIGJ5IHRoZSB0YWdnZWQgbWV0aG9kJ3MgcmV0dXJudmFsdWUuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gZXF1aXZhbGVudFx0U2VlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRcdFx0U2VlIHtAbGluayBEQkMuUG9zdGNvbmRpdGlvbiB9LlxyXG5cdCAqIEBwYXJhbSBkYmNcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNQb3N0Y29uZGl0aW9uIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNQb3N0Y29uZGl0aW9uIH0uICovXHJcblx0cHVibGljIHN0YXRpYyBQT1NUKFxyXG5cdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBUbyBjaGVjayBmb3IgVU5ERUZJTkVEIGFuZCBOVUxMLlxyXG5cdFx0ZXF1aXZhbGVudDogYW55LFxyXG5cdFx0aW52ZXJ0ID0gZmFsc2UsXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXHJcblx0KTogKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRwcm9wZXJ0eUtleTogc3RyaW5nLFxyXG5cdFx0ZGVzY3JpcHRvcjogUHJvcGVydHlEZXNjcmlwdG9yLFxyXG5cdCkgPT4gUHJvcGVydHlEZXNjcmlwdG9yIHtcclxuXHRcdHJldHVybiBEQkMuZGVjUG9zdGNvbmRpdGlvbihcclxuXHRcdFx0KHZhbHVlOiBvYmplY3QsIHRhcmdldDogb2JqZWN0LCBwcm9wZXJ0eUtleTogc3RyaW5nKSA9PiB7XHJcblx0XHRcdFx0cmV0dXJuIEVRLmNoZWNrQWxnb3JpdGhtKHZhbHVlLCBlcXVpdmFsZW50LCBpbnZlcnQpO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRkYmMsXHJcblx0XHRcdHBhdGgsXHJcblx0XHQpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBBIGZpZWxkLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcclxuXHQgKiBieSB0aGUgdGFnZ2VkIGZpZWxkLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIGVxdWl2YWxlbnRcdFNlZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gcGF0aFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxyXG5cdCAqIEBwYXJhbSBkYmNcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgSU5WQVJJQU5UKFxyXG5cdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBUbyBjaGVjayBmb3IgVU5ERUZJTkVEIGFuZCBOVUxMLlxyXG5cdFx0ZXF1aXZhbGVudDogYW55LFxyXG5cdFx0aW52ZXJ0ID0gZmFsc2UsXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXHJcblx0KSB7XHJcblx0XHRyZXR1cm4gREJDLmRlY0ludmFyaWFudChbbmV3IEVRKGVxdWl2YWxlbnQsIGludmVydCldLCBwYXRoLCBkYmMpO1xyXG5cdH1cclxuXHQvLyAjZW5kcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvLyAjcmVnaW9uIFJlZmVyZW5jZWQgQ29uZGl0aW9uIGNoZWNraW5nLlxyXG5cdC8vXHJcblx0Ly8gRm9yIHVzYWdlIGluIGR5bmFtaWMgc2NlbmFyaW9zIChsaWtlIHdpdGggQUUtREJDKS5cclxuXHQvL1xyXG5cdC8qKlxyXG5cdCAqIEludm9rZXMgdGhlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqLCB7QGxpbmsgRVEuZXF1aXZhbGVudCB9IGFuZCB7QGxpbmsgRVEuaW52ZXJ0IH0uXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdG9DaGVjayBTZWUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtfS4gKi9cclxuXHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IE5lY2Vzc2FyeSB0byBjaGVjayBhZ2FpbnN0IE5VTEwgJiBVTkRFRklORUQuXHJcblx0cHVibGljIGNoZWNrKHRvQ2hlY2s6IGFueSkge1xyXG5cdFx0cmV0dXJuIEVRLmNoZWNrQWxnb3JpdGhtKHRvQ2hlY2ssIHRoaXMuZXF1aXZhbGVudCwgdGhpcy5pbnZlcnQpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBJbnZva2VzIHRoZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfSBwYXNzaW5nIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBhbmQgdGhlIHNwZWNpZmllZCAqKnR5cGUqKiAuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdG9DaGVjayBTZWUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBUaGUgKipDQU5ESURBVEUqKiAqKnRvQ2hlY2sqKiBkb2Vzbid0IGZ1bGZpbGwgdGhpcyB7QGxpbmsgRVEgfS5cclxuXHQgKiBcclxuXHQgKiBAdGhyb3dzIEEge0BsaW5rIERCQy5JbmZyaW5nZW1lbnQgfSBpZiB0aGUgKipDQU5ESURBVEUqKiAqKnRvQ2hlY2sqKiBkb2VzIG5vdCBmdWxmaWxsIHRoaXMge0BsaW5rIEVRIH0uKi9cclxuXHRwdWJsaWMgc3RhdGljIHRzQ2hlY2s8Q0FORElEQVRFPiggdG9DaGVjayA6IENBTkRJREFURSB8IHVuZGVmaW5lZCB8IG51bGwsIGVxdWl2YWxlbnQgOiBhbnkgKSA6IENBTkRJREFURSB7XHJcblx0XHRjb25zdCByZXN1bHQgPSBFUS5jaGVja0FsZ29yaXRobSh0b0NoZWNrLCBlcXVpdmFsZW50LCBmYWxzZSApO1xyXG5cclxuXHRcdGlmKCByZXN1bHQgKSB7XHJcblx0XHRcdHJldHVybiB0b0NoZWNrIGFzIENBTkRJREFURSA7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dGhyb3cgbmV3IERCQy5JbmZyaW5nZW1lbnQoIHJlc3VsdCBhcyBzdHJpbmcgKTtcclxuXHRcdH1cclxuXHR9XHJcblx0LyoqXHJcblx0ICogQ3JlYXRlcyB0aGlzIHtAbGluayBFUSB9IGJ5IHNldHRpbmcgdGhlIHByb3RlY3RlZCBwcm9wZXJ0eSB7QGxpbmsgRVEuZXF1aXZhbGVudCB9IHVzZWQgYnkge0BsaW5rIEVRLmNoZWNrIH0uXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gZXF1aXZhbGVudCBTZWUge0BsaW5rIEVRLmNoZWNrIH0uICovXHJcblx0cHVibGljIGNvbnN0cnVjdG9yKFxyXG5cdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBUbyBiZSBhYmxlIHRvIG1hdGNoIFVOREVGSU5FRCBhbmQgTlVMTC5cclxuXHRcdHByb3RlY3RlZCBlcXVpdmFsZW50OiBhbnksXHJcblx0XHRwcm90ZWN0ZWQgaW52ZXJ0ID0gZmFsc2UsXHJcblx0KSB7XHJcblx0XHRzdXBlcigpO1xyXG5cdH1cclxuXHQvLyAjZW5kcmVnaW9uIFJlZmVyZW5jZWQgQ29uZGl0aW9uIGNoZWNraW5nLlxyXG59XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7O0FBTU8sSUFBTSxLQUFOLE1BQU0sWUFBVyxJQUFJO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQThJcEIsWUFFSSxZQUNBLFNBQVMsT0FDbEI7QUFDRCxVQUFNO0FBSEk7QUFDQTtBQUFBLEVBR1g7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQTFJQSxPQUFjLGVBRWIsU0FDQSxZQUNBLFFBQ21CO0FBQ25CLFFBQUksQ0FBQyxVQUFVLGVBQWUsU0FBUztBQUN0QyxhQUFPLGdDQUFnQyxVQUFVO0FBQUEsSUFDbEQ7QUFFQSxRQUFJLFVBQVUsZUFBZSxTQUFTO0FBQ3JDLGFBQU8sa0NBQWtDLFVBQVU7QUFBQSxJQUNwRDtBQUVBLFdBQU87QUFBQSxFQUNSO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFVQSxPQUFjLElBRWIsWUFDQSxTQUFTLE9BQ1QsT0FBMkIsUUFDM0IsTUFBTSxlQUtHO0FBQ1QsV0FBTyxJQUFJO0FBQUEsTUFDVixDQUNDLE9BQ0EsUUFDQSxZQUNBLG1CQUNJO0FBQ0osZUFBTyxJQUFHLGVBQWUsT0FBTyxZQUFZLE1BQU07QUFBQSxNQUNuRDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVBLE9BQWMsS0FFYixZQUNBLFNBQVMsT0FDVCxPQUEyQixRQUMzQixNQUFNLGVBS2lCO0FBQ3ZCLFdBQU8sSUFBSTtBQUFBLE1BQ1YsQ0FBQyxPQUFlLFFBQWdCLGdCQUF3QjtBQUN2RCxlQUFPLElBQUcsZUFBZSxPQUFPLFlBQVksTUFBTTtBQUFBLE1BQ25EO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNEO0FBQUEsRUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVUEsT0FBYyxVQUViLFlBQ0EsU0FBUyxPQUNULE9BQTJCLFFBQzNCLE1BQU0sZUFDTDtBQUNELFdBQU8sSUFBSSxhQUFhLENBQUMsSUFBSSxJQUFHLFlBQVksTUFBTSxDQUFDLEdBQUcsTUFBTSxHQUFHO0FBQUEsRUFDaEU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWFPLE1BQU0sU0FBYztBQUMxQixXQUFPLElBQUcsZUFBZSxTQUFTLEtBQUssWUFBWSxLQUFLLE1BQU07QUFBQSxFQUMvRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBLE9BQWMsUUFBb0IsU0FBd0MsWUFBK0I7QUFDeEcsVUFBTSxTQUFTLElBQUcsZUFBZSxTQUFTLFlBQVksS0FBTTtBQUU1RCxRQUFJLFFBQVM7QUFDWixhQUFPO0FBQUEsSUFDUixPQUNLO0FBQ0osWUFBTSxJQUFJLElBQUksYUFBYyxNQUFpQjtBQUFBLElBQzlDO0FBQUEsRUFDRDtBQUFBO0FBYUQ7IiwKICAibmFtZXMiOiBbXQp9Cg==
