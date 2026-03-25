import { DBC } from "./chunk-LFRFVRJV.js";

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
  static PRE(equivalent, invert = false, path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decPrecondition(
      (value, target, methodName, parameterIndex) => {
        return _EQ.checkAlgorithm(value, equivalent, invert);
      },
      dbc,
      path,
      hint,
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
  static POST(equivalent, invert = false, path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decPostcondition(
      (value, target, propertyKey) => {
        return _EQ.checkAlgorithm(value, equivalent, invert);
      },
      dbc,
      path,
      hint,
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
  static INVARIANT(equivalent, invert = false, path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decInvariant([new _EQ(equivalent, invert)], path, dbc, hint);
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
  static tsCheck(toCheck, equivalent, hint = void 0, id = void 0) {
    const result = _EQ.checkAlgorithm(toCheck, equivalent, false);
    if (result) {
      return toCheck;
    } else {
      throw new DBC.Infringement(`${id ? `(${id}) ` : ""}${result} ${hint ? `\u2728 ${hint} \u2728` : ""}`);
    }
  }
  // #endregion Referenced Condition checking.
};

export { EQ };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3hkYmMvc3JjL0RCQy9FUS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgREJDIH0gZnJvbSBcIi4uL0RCQ1wiO1xyXG4vKipcclxuICogQSB7QGxpbmsgREJDIH0gZGVmaW5pbmcgdGhhdCB0d28ge0BsaW5rIG9iamVjdCB9cyBnb3R0YSBiZSBlcXVhbC5cclxuICpcclxuICogQHJlbWFya3NcclxuICogTWFpbnRhaW5lcjogQ2FsbGFyaSwgU2FsdmF0b3JlIChYREJDQFdhWENvZGUubmV0KSAqL1xyXG5leHBvcnQgY2xhc3MgRVEgZXh0ZW5kcyBEQkMge1xyXG5cdC8vICNyZWdpb24gQ29uZGl0aW9uIGNoZWNraW5nLlxyXG5cdC8qKlxyXG5cdCAqIENoZWNrcyBpZiB0aGUgdmFsdWUgKip0b0NoZWNrKiogaXMgZXF1YWwgdG8gdGhlIHNwZWNpZmllZCAqKmVxdWl2YWxlbnQqKi5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0b0NoZWNrXHRcdFRoZSB2YWx1ZSB0aGF0IGhhcyB0byBiZSBlcXVhbCB0byBpdCdzIHBvc3NpYmxlICoqZXF1aXZhbGVudCoqIGZvciB0aGlzIHtAbGluayBEQkMgfSB0byBiZSBmdWxmaWxsZWQuXHJcblx0ICogQHBhcmFtIGVxdWl2YWxlbnRcdFRoZSB7QGxpbmsgb2JqZWN0IH0gdGhlIG9uZSAqKnRvQ2hlY2sqKiBoYXMgdG8gYmUgZXF1YWwgdG8gaW4gb3JkZXIgZm9yIHRoaXMge0BsaW5rIERCQyB9IHRvIGJlXHJcblx0ICogXHRcdFx0XHRcdFx0ZnVsZmlsbGVkLlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgVFJVRSBpZiB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHRoZSAqKmVxdWl2YWxlbnQqKiBhcmUgZXF1YWwgdG8gZWFjaCBvdGhlciwgb3RoZXJ3aXNlIEZBTFNFLiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgY2hlY2tBbGdvcml0aG0oXHJcblx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cclxuXHRcdHRvQ2hlY2s6IGFueSxcclxuXHRcdGVxdWl2YWxlbnQ6IG9iamVjdCxcclxuXHRcdGludmVydCxcclxuXHQpOiBib29sZWFuIHwgc3RyaW5nIHtcclxuXHRcdGlmICghaW52ZXJ0ICYmIGVxdWl2YWxlbnQgIT09IHRvQ2hlY2spIHtcclxuXHRcdFx0cmV0dXJuIGBWYWx1ZSBoYXMgdG8gdG8gYmUgZXF1YWwgdG8gXCIke2VxdWl2YWxlbnR9XCJgO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChpbnZlcnQgJiYgZXF1aXZhbGVudCA9PT0gdG9DaGVjaykge1xyXG5cdFx0XHRyZXR1cm4gYFZhbHVlIG11c3Qgbm90IHRvIGJlIGVxdWFsIHRvIFwiJHtlcXVpdmFsZW50fVwiYDtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdHJ1ZTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogQSBwYXJhbWV0ZXItZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxyXG5cdCAqIGJ5IHRoZSB0YWdnZWQgcGFyYW1ldGVyLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIGVxdWl2YWxlbnRcdFNlZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gcGF0aFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqIEBwYXJhbSBkYmNcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgUFJFKFxyXG5cdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBUbyBjaGVjayBmb3IgVU5ERUZJTkVEIGFuZCBOVUxMLlxyXG5cdFx0ZXF1aXZhbGVudDogYW55LFxyXG5cdFx0aW52ZXJ0ID0gZmFsc2UsXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRoaW50OiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmM6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZFxyXG5cdCk6IChcclxuXHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0bWV0aG9kTmFtZTogc3RyaW5nIHwgc3ltYm9sLFxyXG5cdFx0cGFyYW1ldGVySW5kZXg6IG51bWJlcixcclxuXHQpID0+IHZvaWQge1xyXG5cdFx0cmV0dXJuIERCQy5kZWNQcmVjb25kaXRpb24oXHJcblx0XHRcdChcclxuXHRcdFx0XHR2YWx1ZTogb2JqZWN0LFxyXG5cdFx0XHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0XHRcdG1ldGhvZE5hbWU6IHN0cmluZyxcclxuXHRcdFx0XHRwYXJhbWV0ZXJJbmRleDogbnVtYmVyLFxyXG5cdFx0XHQpID0+IHtcclxuXHRcdFx0XHRyZXR1cm4gRVEuY2hlY2tBbGdvcml0aG0odmFsdWUsIGVxdWl2YWxlbnQsIGludmVydCk7XHJcblx0XHRcdH0sXHJcblx0XHRcdGRiYyxcclxuXHRcdFx0cGF0aCxcclxuXHRcdFx0aGludFxyXG5cdFx0KTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogQSBtZXRob2QtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxyXG5cdCAqIGJ5IHRoZSB0YWdnZWQgbWV0aG9kJ3MgcmV0dXJudmFsdWUuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gZXF1aXZhbGVudFx0U2VlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRcdFx0U2VlIHtAbGluayBEQkMuUG9zdGNvbmRpdGlvbiB9LlxyXG5cdCAqIEBwYXJhbSBkYmNcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNQb3N0Y29uZGl0aW9uIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNQb3N0Y29uZGl0aW9uIH0uICovXHJcblx0cHVibGljIHN0YXRpYyBQT1NUKFxyXG5cdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBUbyBjaGVjayBmb3IgVU5ERUZJTkVEIGFuZCBOVUxMLlxyXG5cdFx0ZXF1aXZhbGVudDogYW55LFxyXG5cdFx0aW52ZXJ0ID0gZmFsc2UsXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRoaW50OiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmM6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHJcblx0KTogKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRwcm9wZXJ0eUtleTogc3RyaW5nLFxyXG5cdFx0ZGVzY3JpcHRvcjogUHJvcGVydHlEZXNjcmlwdG9yLFxyXG5cdCkgPT4gUHJvcGVydHlEZXNjcmlwdG9yIHtcclxuXHRcdHJldHVybiBEQkMuZGVjUG9zdGNvbmRpdGlvbihcclxuXHRcdFx0KHZhbHVlOiBvYmplY3QsIHRhcmdldDogb2JqZWN0LCBwcm9wZXJ0eUtleTogc3RyaW5nKSA9PiB7XHJcblx0XHRcdFx0cmV0dXJuIEVRLmNoZWNrQWxnb3JpdGhtKHZhbHVlLCBlcXVpdmFsZW50LCBpbnZlcnQpO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRkYmMsXHJcblx0XHRcdHBhdGgsXHJcblx0XHRcdGhpbnRcclxuXHRcdCk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgZmllbGQtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxyXG5cdCAqIGJ5IHRoZSB0YWdnZWQgZmllbGQuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gZXF1aXZhbGVudFx0U2VlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXHJcblx0ICogQHBhcmFtIGRiY1x0XHRcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uICovXHJcblx0cHVibGljIHN0YXRpYyBJTlZBUklBTlQoXHJcblx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IFRvIGNoZWNrIGZvciBVTkRFRklORUQgYW5kIE5VTEwuXHJcblx0XHRlcXVpdmFsZW50OiBhbnksXHJcblx0XHRpbnZlcnQgPSBmYWxzZSxcclxuXHRcdHBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGhpbnQ6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGRiYzogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdCkge1xyXG5cdFx0cmV0dXJuIERCQy5kZWNJbnZhcmlhbnQoW25ldyBFUShlcXVpdmFsZW50LCBpbnZlcnQpXSwgcGF0aCwgZGJjLCBoaW50KTtcclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXHJcblx0Ly8gI3JlZ2lvbiBSZWZlcmVuY2VkIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvL1xyXG5cdC8vIEZvciB1c2FnZSBpbiBkeW5hbWljIHNjZW5hcmlvcyAobGlrZSB3aXRoIEFFLURCQykuXHJcblx0Ly9cclxuXHQvKipcclxuXHQgKiBJbnZva2VzIHRoZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG0gfSBwYXNzaW5nIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiwge0BsaW5rIEVRLmVxdWl2YWxlbnQgfSBhbmQge0BsaW5rIEVRLmludmVydCB9LlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHRvQ2hlY2sgU2VlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobX0uICovXHJcblx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBOZWNlc3NhcnkgdG8gY2hlY2sgYWdhaW5zdCBOVUxMICYgVU5ERUZJTkVELlxyXG5cdHB1YmxpYyBjaGVjayh0b0NoZWNrOiBhbnkpIHtcclxuXHRcdHJldHVybiBFUS5jaGVja0FsZ29yaXRobSh0b0NoZWNrLCB0aGlzLmVxdWl2YWxlbnQsIHRoaXMuaW52ZXJ0KTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogSW52b2tlcyB0aGUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0gcGFzc2luZyB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHRoZSBzcGVjaWZpZWQgKip0eXBlKiogLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHRvQ2hlY2sgU2VlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgVGhlICoqQ0FORElEQVRFKiogKip0b0NoZWNrKiogZG9lc24ndCBmdWxmaWxsIHRoaXMge0BsaW5rIEVRIH0uXHJcblx0ICogXHJcblx0ICogQHRocm93cyBBIHtAbGluayBEQkMuSW5mcmluZ2VtZW50IH0gaWYgdGhlICoqQ0FORElEQVRFKiogKip0b0NoZWNrKiogZG9lcyBub3QgZnVsZmlsbCB0aGlzIHtAbGluayBFUSB9LiovXHJcblx0cHVibGljIHN0YXRpYyB0c0NoZWNrPENBTkRJREFURT4odG9DaGVjazogQ0FORElEQVRFIHwgdW5kZWZpbmVkIHwgbnVsbCwgZXF1aXZhbGVudDogYW55LCBoaW50OiBzdHJpbmcgPSB1bmRlZmluZWQsIGlkOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQpOiBDQU5ESURBVEUge1xyXG5cdFx0Y29uc3QgcmVzdWx0ID0gRVEuY2hlY2tBbGdvcml0aG0odG9DaGVjaywgZXF1aXZhbGVudCwgZmFsc2UpO1xyXG5cclxuXHRcdGlmIChyZXN1bHQpIHtcclxuXHRcdFx0cmV0dXJuIHRvQ2hlY2sgYXMgQ0FORElEQVRFO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHRocm93IG5ldyBEQkMuSW5mcmluZ2VtZW50KGAke2lkID8gYCgke2lkfSkgYCA6IFwiXCJ9JHtyZXN1bHQgYXMgc3RyaW5nfSAke2hpbnQgPyBgXHUyNzI4ICR7aGludH0gXHUyNzI4YCA6IFwiXCJ9YCk7XHJcblx0XHR9XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIENyZWF0ZXMgdGhpcyB7QGxpbmsgRVEgfSBieSBzZXR0aW5nIHRoZSBwcm90ZWN0ZWQgcHJvcGVydHkge0BsaW5rIEVRLmVxdWl2YWxlbnQgfSB1c2VkIGJ5IHtAbGluayBFUS5jaGVjayB9LlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIGVxdWl2YWxlbnQgU2VlIHtAbGluayBFUS5jaGVjayB9LiAqL1xyXG5cdHB1YmxpYyBjb25zdHJ1Y3RvcihcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogVG8gYmUgYWJsZSB0byBtYXRjaCBVTkRFRklORUQgYW5kIE5VTEwuXHJcblx0XHRwcm90ZWN0ZWQgZXF1aXZhbGVudDogYW55LFxyXG5cdFx0cHJvdGVjdGVkIGludmVydCA9IGZhbHNlLFxyXG5cdCkge1xyXG5cdFx0c3VwZXIoKTtcclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBSZWZlcmVuY2VkIENvbmRpdGlvbiBjaGVja2luZy5cclxu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
