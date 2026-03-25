import { DBC } from "./chunk-YNACB2OL.js";

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
    if (invert && !condition.check(toCheck) && !inCase.check(toCheck)) {
      return `In case that the value complies to "${condition}" it also has to comply to "${inCase}"`;
    }
    if (!invert && condition.check(toCheck) && !inCase.check(toCheck)) {
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
  static PRE(condition, inCase, path = void 0, invert = false, hint = void 0, dbc = void 0) {
    return DBC.decPrecondition(
      (value, target, methodName, parameterIndex) => {
        return _IF.checkAlgorithm(value, condition, inCase, invert);
      },
      dbc,
      path,
      hint,
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
  static POST(condition, inCase, path = void 0, invert = false, hint = void 0, dbc = void 0) {
    return DBC.decPostcondition(
      (value, target, propertyKey) => {
        return _IF.checkAlgorithm(value, condition, inCase, invert);
      },
      dbc,
      path,
      hint,
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
  static INVARIANT(condition, inCase, path = void 0, invert = false, hint = void 0, dbc = void 0) {
    return DBC.decInvariant([new _IF(condition, inCase, invert)], path, dbc, hint);
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

export { IF };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3hkYmMvc3JjL0RCQy9JRi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgREJDIH0gZnJvbSBcIi4uL0RCQ1wiO1xyXG4vKipcclxuICogQSB7QGxpbmsgREJDIH0gZGVmaW5pbmcgdGhhdCBhbiB7QGxpbmsgb2JqZWN0IH0gaGFzIGFsc28gdG8gY29tcGx5IHRvIGEgY2VydGFpbiB7QGxpbmsgREJDIH0gaWYgaXQgY29tcGxpZXMgdG9cclxuICogYW5vdGhlciBzcGVjaWZpZWQgb25lLlxyXG4gKlxyXG4gKiBAcmVtYXJrc1xyXG4gKiBNYWludGFpbmVyOiBDYWxsYXJpLCBTYWx2YXRvcmUgKFhEQkNAV2FYQ29kZS5uZXQpICovXHJcbmV4cG9ydCBjbGFzcyBJRiBleHRlbmRzIERCQyB7XHJcblx0Ly8gI3JlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXHJcblx0LyoqXHJcblx0ICogQ2hlY2tzIGlmIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBjb21wbGllcyB0byB0aGUgc3BlY2lmaWVkICoqY29uZGl0aW9uKiogYW5kIGlmIHNvIGRvZXMgYWxzbyBjb21wbHkgdG8gdGhlIG9uZSAqKmluQ2FzZSoqLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHRvQ2hlY2tcdFRoZSB2YWx1ZSB0aGF0IGhhcyB0byBiZSBlcXVhbCB0byBpdCdzIHBvc3NpYmxlICoqZXF1aXZhbGVudCoqIGZvciB0aGlzIHtAbGluayBEQkMgfSB0byBiZSBmdWxmaWxsZWQuXHJcblx0ICogQHBhcmFtIGNvbmRpdGlvblx0VGhlIGNvbnRyYWN0ICoqdG9DaGVjayoqIGhhcyB0byBjb21wbHkgdG8gaW4gb3JkZXIgdG8gYWxzbyBoYXZlIHRvIGNvbXBseSB0byB0aGUgb25lICoqaW5DYXNlKiouXHJcblx0ICogQHBhcmFtIGluQ2FzZVx0VGhlIGNvbnRyYWN0ICoqdG9DaGVjayoqIGhhcyB0byBhbHNvIGNvbXBseSB0byBpZiBpdCBjb21wbGllcyB0byAqKmNvbmRpdGlvbioqLlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgVFJVRSBpZiB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHRoZSAqKmVxdWl2YWxlbnQqKiBhcmUgZXF1YWwgdG8gZWFjaCBvdGhlciwgb3RoZXJ3aXNlIEZBTFNFLiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgY2hlY2tBbGdvcml0aG0oXHJcblx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cclxuXHRcdHRvQ2hlY2s6IGFueSxcclxuXHRcdGNvbmRpdGlvbjogeyBjaGVjazogKHRvQ2hlY2s6IHVua25vd24gfCB1bmRlZmluZWQgfCBudWxsIHwgb2JqZWN0KSA9PiBib29sZWFuIHwgc3RyaW5nOyB9LFxyXG5cdFx0aW5DYXNlOiB7XHJcblx0XHRcdGNoZWNrOiAodG9DaGVjazogdW5rbm93biB8IHVuZGVmaW5lZCB8IG51bGwgfCBvYmplY3QpID0+IGJvb2xlYW4gfCBzdHJpbmc7XHJcblx0XHR9LFxyXG5cdFx0aW52ZXJ0LFxyXG5cdCk6IGJvb2xlYW4gfCBzdHJpbmcge1xyXG5cdFx0aWYgKGludmVydCAmJiAhY29uZGl0aW9uLmNoZWNrKHRvQ2hlY2spICYmICFpbkNhc2UuY2hlY2sodG9DaGVjaykpIHtcclxuXHRcdFx0cmV0dXJuIGBJbiBjYXNlIHRoYXQgdGhlIHZhbHVlIGNvbXBsaWVzIHRvIFwiJHtjb25kaXRpb259XCIgaXQgYWxzbyBoYXMgdG8gY29tcGx5IHRvIFwiJHtpbkNhc2V9XCJgO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmICghaW52ZXJ0ICYmIGNvbmRpdGlvbi5jaGVjayh0b0NoZWNrKSAmJiAhaW5DYXNlLmNoZWNrKHRvQ2hlY2spKSB7XHJcblx0XHRcdHJldHVybiBgSW4gY2FzZSB0aGF0IHRoZSB2YWx1ZSBkb2VzIG5vdCBjb21wbHkgdG8gXCIke2NvbmRpdGlvbn1cIiBpdCBoYXMgdG8gY29tcGx5IHRvIFwiJHtpbkNhc2V9XCJgO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0cnVlO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBBIHBhcmFtZXRlci1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXHJcblx0ICogYnkgdGhlIHRhZ2dlZCBwYXJhbWV0ZXIuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gY29uZGl0aW9uXHRTZWUge0BsaW5rIElGLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIGluQ2FzZVx0U2VlIHtAbGluayBJRi5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqIEBwYXJhbSBkYmNcdFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIFBSRShcclxuXHRcdGNvbmRpdGlvbjogeyBjaGVjazogKHRvQ2hlY2s6IHVua25vd24gfCB1bmRlZmluZWQgfCBudWxsIHwgb2JqZWN0KSA9PiBib29sZWFuIHwgc3RyaW5nOyB9LFxyXG5cdFx0aW5DYXNlOiB7IGNoZWNrOiAodG9DaGVjazogdW5rbm93biB8IHVuZGVmaW5lZCB8IG51bGwgfCBvYmplY3QpID0+IGJvb2xlYW4gfCBzdHJpbmc7IH0sXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRpbnZlcnQgPSBmYWxzZSxcclxuXHRcdGhpbnQ6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGRiYzogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkXHJcblx0KTogKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRtZXRob2ROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXHJcblx0XHRwYXJhbWV0ZXJJbmRleDogbnVtYmVyLFxyXG5cdCkgPT4gdm9pZCB7XHJcblx0XHRyZXR1cm4gREJDLmRlY1ByZWNvbmRpdGlvbihcclxuXHRcdFx0KFxyXG5cdFx0XHRcdHZhbHVlOiBvYmplY3QsXHJcblx0XHRcdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRcdFx0bWV0aG9kTmFtZTogc3RyaW5nLFxyXG5cdFx0XHRcdHBhcmFtZXRlckluZGV4OiBudW1iZXIsXHJcblx0XHRcdCkgPT4ge1xyXG5cdFx0XHRcdHJldHVybiBJRi5jaGVja0FsZ29yaXRobSh2YWx1ZSwgY29uZGl0aW9uLCBpbkNhc2UsIGludmVydCk7XHJcblx0XHRcdH0sXHJcblx0XHRcdGRiYyxcclxuXHRcdFx0cGF0aCxcclxuXHRcdFx0aGludFxyXG5cdFx0KTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogQSBtZXRob2QtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBJRi5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxyXG5cdCAqIGJ5IHRoZSB0YWdnZWQgbWV0aG9kJ3MgcmV0dXJudmFsdWUuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gY29uZGl0aW9uXHRTZWUge0BsaW5rIElGLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIGluQ2FzZVx0U2VlIHtAbGluayBJRi5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRcdFNlZSB7QGxpbmsgREJDLlBvc3Rjb25kaXRpb24gfS5cclxuXHQgKiBAcGFyYW0gZGJjXHRcdFNlZSB7QGxpbmsgREJDLmRlY1Bvc3Rjb25kaXRpb24gfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY1Bvc3Rjb25kaXRpb24gfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIFBPU1QoXHJcblx0XHRjb25kaXRpb246IHsgY2hlY2s6ICh0b0NoZWNrOiB1bmtub3duIHwgdW5kZWZpbmVkIHwgbnVsbCB8IG9iamVjdCkgPT4gYm9vbGVhbiB8IHN0cmluZzsgfSxcclxuXHRcdGluQ2FzZTogeyBjaGVjazogKHRvQ2hlY2s6IHVua25vd24gfCB1bmRlZmluZWQgfCBudWxsIHwgb2JqZWN0KSA9PiBib29sZWFuIHwgc3RyaW5nOyB9LFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0aW52ZXJ0ID0gZmFsc2UsXHJcblx0XHRoaW50OiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmM6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHQpOiAoXHJcblx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdHByb3BlcnR5S2V5OiBzdHJpbmcsXHJcblx0XHRkZXNjcmlwdG9yOiBQcm9wZXJ0eURlc2NyaXB0b3IsXHJcblx0KSA9PiBQcm9wZXJ0eURlc2NyaXB0b3Ige1xyXG5cdFx0cmV0dXJuIERCQy5kZWNQb3N0Y29uZGl0aW9uKFxyXG5cdFx0XHQodmFsdWU6IG9iamVjdCwgdGFyZ2V0OiBvYmplY3QsIHByb3BlcnR5S2V5OiBzdHJpbmcpID0+IHtcclxuXHRcdFx0XHRyZXR1cm4gSUYuY2hlY2tBbGdvcml0aG0odmFsdWUsIGNvbmRpdGlvbiwgaW5DYXNlLCBpbnZlcnQpO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRkYmMsXHJcblx0XHRcdHBhdGgsXHJcblx0XHRcdGhpbnRcclxuXHRcdCk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgZmllbGQtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBJRi5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxyXG5cdCAqIGJ5IHRoZSB0YWdnZWQgZmllbGQuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gY29uZGl0aW9uXHRTZWUge0BsaW5rIElGLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIGluQ2FzZVx0U2VlIHtAbGluayBJRi5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXHJcblx0ICogQHBhcmFtIGRiY1x0XHRcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uICovXHJcblx0cHVibGljIHN0YXRpYyBJTlZBUklBTlQoXHJcblx0XHRjb25kaXRpb246IHsgY2hlY2s6ICh0b0NoZWNrOiB1bmtub3duIHwgdW5kZWZpbmVkIHwgbnVsbCB8IG9iamVjdCkgPT4gYm9vbGVhbiB8IHN0cmluZzsgfSxcclxuXHRcdGluQ2FzZTogeyBjaGVjazogKHRvQ2hlY2s6IHVua25vd24gfCB1bmRlZmluZWQgfCBudWxsIHwgb2JqZWN0KSA9PiBib29sZWFuIHwgc3RyaW5nOyB9LFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0aW52ZXJ0ID0gZmFsc2UsXHJcblx0XHRoaW50OiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmM6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHQpIHtcclxuXHRcdHJldHVybiBEQkMuZGVjSW52YXJpYW50KFtuZXcgSUYoY29uZGl0aW9uLCBpbkNhc2UsIGludmVydCldLCBwYXRoLCBkYmMsIGhpbnQpO1xyXG5cdH1cclxuXHQvLyAjZW5kcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvLyAjcmVnaW9uIFJlZmVyZW5jZWQgQ29uZGl0aW9uIGNoZWNraW5nLlxyXG5cdC8vXHJcblx0Ly8gRm9yIHVzYWdlIGluIGR5bmFtaWMgc2NlbmFyaW9zIChsaWtlIHdpdGggQUUtREJDKS5cclxuXHQvL1xyXG5cdC8qKlxyXG5cdCAqIEludm9rZXMgdGhlIHtAbGluayBJRi5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqLCB7QGxpbmsgSUYuZXF1aXZhbGVudCB9IGFuZCB7QGxpbmsgSUYuaW52ZXJ0IH0uXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdG9DaGVjayBTZWUge0BsaW5rIElGLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIElGLmNoZWNrQWxnb3JpdGhtfS4gKi9cclxuXHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IE5lY2Vzc2FyeSB0byBjaGVjayBhZ2FpbnN0IE5VTEwgJiBVTkRFRklORUQuXHJcblx0cHVibGljIGNoZWNrKHRvQ2hlY2s6IGFueSkge1xyXG5cdFx0cmV0dXJuIElGLmNoZWNrQWxnb3JpdGhtKHRvQ2hlY2ssIHRoaXMuY29uZGl0aW9uLCB0aGlzLmluQ2FzZSwgdGhpcy5pbnZlcnQpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBDcmVhdGVzIHRoaXMge0BsaW5rIElGIH0gYnkgc2V0dGluZyB0aGUgcHJvdGVjdGVkIHByb3BlcnR5IHtAbGluayBJRi5lcXVpdmFsZW50IH0gdXNlZCBieSB7QGxpbmsgSUYuY2hlY2sgfS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBlcXVpdmFsZW50IFNlZSB7QGxpbmsgSUYuY2hlY2sgfS4gKi9cclxuXHRwdWJsaWMgY29uc3RydWN0b3IoXHJcblx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IFRvIGJlIGFibGUgdG8gbWF0Y2ggVU5ERUZJTkVEIGFuZCBOVUxMLlxyXG5cdFx0cHJvdGVjdGVkIGNvbmRpdGlvbjogeyBjaGVjazogKHRvQ2hlY2s6IHVua25vd24gfCB1bmRlZmluZWQgfCBudWxsIHwgb2JqZWN0KSA9PiBib29sZWFuIHwgc3RyaW5nOyB9LFxyXG5cdFx0cHJvdGVjdGVkIGluQ2FzZTogeyBjaGVjazogKHRvQ2hlY2s6IHVua25vd24gfCB1bmRlZmluZWQgfCBudWxsIHwgb2JqZWN0KSA9PiBib29sZWFuIHwgc3RyaW5nOyB9LFxyXG5cdFx0cHJvdGVjdGVkIGludmVydCA9IGZhbHNlLFxyXG5cdCkge1xyXG5cdFx0c3VwZXIoKTtcclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBSZWZlcmVuY2VkIENvbmRpdGlvbiBjaGVja2luZy5cclxufSJdLAogICJtYXBwaW5ncyI6ICI7Ozs7O0FBT08sSUFBTSxLQUFOLE1BQU0sWUFBVyxJQUFJO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQXVJcEIsWUFFSSxXQUNBLFFBQ0EsU0FBUyxPQUNsQjtBQUNELFVBQU07QUFKSTtBQUNBO0FBQ0E7QUFBQSxFQUdYO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFwSUEsT0FBYyxlQUViLFNBQ0EsV0FDQSxRQUdBLFFBQ21CO0FBQ25CLFFBQUksVUFBVSxDQUFDLFVBQVUsTUFBTSxPQUFPLEtBQUssQ0FBQyxPQUFPLE1BQU0sT0FBTyxHQUFHO0FBQ2xFLGFBQU8sdUNBQXVDLFNBQVMsK0JBQStCLE1BQU07QUFBQSxJQUM3RjtBQUVBLFFBQUksQ0FBQyxVQUFVLFVBQVUsTUFBTSxPQUFPLEtBQUssQ0FBQyxPQUFPLE1BQU0sT0FBTyxHQUFHO0FBQ2xFLGFBQU8sOENBQThDLFNBQVMsMEJBQTBCLE1BQU07QUFBQSxJQUMvRjtBQUVBLFdBQU87QUFBQSxFQUNSO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVdBLE9BQWMsSUFDYixXQUNBLFFBQ0EsT0FBMkIsUUFDM0IsU0FBUyxPQUNULE9BQTJCLFFBQzNCLE1BQTBCLFFBS2pCO0FBQ1QsV0FBTyxJQUFJO0FBQUEsTUFDVixDQUNDLE9BQ0EsUUFDQSxZQUNBLG1CQUNJO0FBQ0osZUFBTyxJQUFHLGVBQWUsT0FBTyxXQUFXLFFBQVEsTUFBTTtBQUFBLE1BQzFEO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBV0EsT0FBYyxLQUNiLFdBQ0EsUUFDQSxPQUEyQixRQUMzQixTQUFTLE9BQ1QsT0FBMkIsUUFDM0IsTUFBMEIsUUFLSDtBQUN2QixXQUFPLElBQUk7QUFBQSxNQUNWLENBQUMsT0FBZSxRQUFnQixnQkFBd0I7QUFDdkQsZUFBTyxJQUFHLGVBQWUsT0FBTyxXQUFXLFFBQVEsTUFBTTtBQUFBLE1BQzFEO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBV0EsT0FBYyxVQUNiLFdBQ0EsUUFDQSxPQUEyQixRQUMzQixTQUFTLE9BQ1QsT0FBMkIsUUFDM0IsTUFBMEIsUUFDekI7QUFDRCxXQUFPLElBQUksYUFBYSxDQUFDLElBQUksSUFBRyxXQUFXLFFBQVEsTUFBTSxDQUFDLEdBQUcsTUFBTSxLQUFLLElBQUk7QUFBQSxFQUM3RTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBYU8sTUFBTSxTQUFjO0FBQzFCLFdBQU8sSUFBRyxlQUFlLFNBQVMsS0FBSyxXQUFXLEtBQUssUUFBUSxLQUFLLE1BQU07QUFBQSxFQUMzRTtBQUFBO0FBY0Q7IiwKICAibmFtZXMiOiBbXQp9Cg==
