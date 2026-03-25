import { DBC } from "./chunk-YNACB2OL.js";

// ../../node_modules/xdbc/src/DBC/TYPE.ts
var TYPE = class _TYPE extends DBC {
  /**
   * Creates this {@link TYPE } by setting the protected property {@link TYPE.type } used by {@link TYPE.check }.
   *
   * @param type See {@link TYPE.check }. */
  constructor(type) {
    super();
    this.type = type;
  }
  /**
   * Checks if the value **toCheck** is of the **type** specified.
   *
   * @param toCheck	The {@link Object } which's **type** to check.
   * @param type		The type the {@link object} **toCheck** has to be of. Can be a single type or multiple types separated by "|".
   *
   * @returns TRUE if the value **toCheck** is of the specified **type**, otherwise FALSE. */
  // biome-ignore lint/suspicious/noExplicitAny: Necessary for dynamic type checking of also UNDEFINED.
  static checkAlgorithm(toCheck, type) {
    if (toCheck === void 0 || toCheck === null) return true;
    const types = type.split("|").map((t) => t.trim());
    const actualType = typeof toCheck;
    const isValid = types.some((t) => actualType === t);
    if (!isValid) {
      if (types.length === 1) {
        return `Value has to to be of type "${type}" but is of type "${actualType}"`;
      }
      return `Value has to to be of type "${types.join(" | ")}" but is of type "${actualType}"`;
    }
    return true;
  }
  /**
   * A parameter-decorator factory using the {@link TYPE.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
   * by the tagged parameter.
   *
   * @param type	See {@link TYPE.checkAlgorithm }.
   * @param path	A ::-separated list of dotted paths to check. Each path points to a property within the parameter value.
   * 				Undefined properties are skipped. See {@link DBC.decPrecondition }.
   * @param dbc	See {@link DBC.decPrecondition }.
   *
   * @returns See {@link DBC.decPrecondition }. */
  static PRE(type, path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decPrecondition(
      (value, target, methodName, parameterIndex) => {
        return _TYPE.checkAlgorithm(value, type);
      },
      dbc,
      path,
      hint,
    );
  }
  /**
   * A method-decorator factory using the {@link TYPE.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
   * by the tagged method's returnvalue.
   *
   * @param type	See {@link TYPE.checkAlgorithm }.
   * @param path	A ::-separated list of dotted paths to check. Each path points to a property within the parameter value.
   * 				Undefined properties are skipped. See {@link DBC.decPrecondition }.
   * @param dbc	See {@link DBC.decPostcondition }.
   *
   * @returns See {@link DBC.decPostcondition }. */
  static POST(type, path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decPostcondition(
      (value, target, propertyKey) => {
        return _TYPE.checkAlgorithm(value, type);
      },
      dbc,
      path,
      hint,
    );
  }
  /**
   * A field-decorator factory using the {@link TYPE.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
   * by the tagged field.
   *
   * @param type	See {@link TYPE.checkAlgorithm }.
   * @param path	A ::-separated list of dotted paths to check. Each path points to a property within the parameter value.
   * 				Undefined properties are skipped. See {@link DBC.decPrecondition }.
   * @param dbc	See {@link DBC.decInvariant }.
   *
   * @returns See {@link DBC.decInvariant }. */
  static INVARIANT(type, path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decInvariant([new _TYPE(type)], path, dbc, hint);
  }
  // #endregion Condition checking.
  // #region Referenced Condition checking.
  //
  // For usage in dynamic scenarios (like with AE-DBC).
  //
  /**
   * Invokes the {@link TYPE.checkAlgorithm } passing the value **toCheck** and the {@link TYPE.type } .
   *
   * @param toCheck See {@link TYPE.checkAlgorithm }.
   *
   * @returns See {@link TYPE.checkAlgorithm}. */
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  check(toCheck) {
    return _TYPE.checkAlgorithm(toCheck, this.type);
  }
  /**
   * Invokes the {@link TYPE.checkAlgorithm } passing the value **toCheck** and the {@link TYPE.type } .
   *
   * @param toCheck	See {@link TYPE.checkAlgorithm }.
   * @param type		See {@link TYPE.checkAlgorithm }.
   * @param hint		An optional {@link string } providing extra information in case of an infringement.
   * @param id		A {@link string } identifying this {@link TYPE } via the {@link DBC.Infringement }-Message.
   *
   * @returns The **CANDIDATE** **toCheck** doesn't fulfill this {@link TYPE }.
   *
   * @throws A {@link DBC.Infringement } if the **CANDIDATE** **toCheck** does not fulfill this {@link DEFINED }. */
  static tsCheck(toCheck, type, hint = void 0, id = void 0) {
    const result = _TYPE.checkAlgorithm(toCheck, type);
    if (result === true) {
      return toCheck;
    } else {
      throw new DBC.Infringement(`${id ? `(${id}) ` : ""}${result}${hint ? ` \u2728 ${hint} \u2728` : ""}`);
    }
  }
};

export { TYPE };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3hkYmMvc3JjL0RCQy9UWVBFLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBEQkMgfSBmcm9tIFwiLi4vREJDXCI7XHJcbi8qKlxyXG4gKiBBIHtAbGluayBEQkMgfSBkZWZpbmluZyB0aGF0IGFuIHtAbGluayBvYmplY3QgfXMgZ290dGEgYmUgb2YgY2VydGFpbiB7QGxpbmsgVFlQRS50eXBlIH0uXHJcbiAqXHJcbiAqIEByZW1hcmtzXHJcbiAqIEF1dGhvcjogXHRcdFNhbHZhdG9yZSBDYWxsYXJpIChDYWxsYXJpQFdhWENvZGUubmV0KSAvIDIwMjVcclxuICogTWFpbnRhaW5lcjpcdFNhbHZhdG9yZSBDYWxsYXJpIChYREJDQFdhWENvZGUubmV0KSAqL1xyXG5leHBvcnQgY2xhc3MgVFlQRSBleHRlbmRzIERCQyB7XHJcblx0LyoqXHJcblx0ICogQ2hlY2tzIGlmIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBpcyBvZiB0aGUgKip0eXBlKiogc3BlY2lmaWVkLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHRvQ2hlY2tcdFRoZSB7QGxpbmsgT2JqZWN0IH0gd2hpY2gncyAqKnR5cGUqKiB0byBjaGVjay5cclxuXHQgKiBAcGFyYW0gdHlwZVx0XHRUaGUgdHlwZSB0aGUge0BsaW5rIG9iamVjdH0gKip0b0NoZWNrKiogaGFzIHRvIGJlIG9mLiBDYW4gYmUgYSBzaW5nbGUgdHlwZSBvciBtdWx0aXBsZSB0eXBlcyBzZXBhcmF0ZWQgYnkgXCJ8XCIuXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBUUlVFIGlmIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBpcyBvZiB0aGUgc3BlY2lmaWVkICoqdHlwZSoqLCBvdGhlcndpc2UgRkFMU0UuICovXHJcblx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBOZWNlc3NhcnkgZm9yIGR5bmFtaWMgdHlwZSBjaGVja2luZyBvZiBhbHNvIFVOREVGSU5FRC5cclxuXHRwdWJsaWMgc3RhdGljIGNoZWNrQWxnb3JpdGhtKHRvQ2hlY2s6IGFueSwgdHlwZTogc3RyaW5nKTogYm9vbGVhbiB8IHN0cmluZyB7XHJcblx0XHRpZiAodG9DaGVjayA9PT0gdW5kZWZpbmVkIHx8IHRvQ2hlY2sgPT09IG51bGwpIHJldHVybiB0cnVlO1xyXG5cclxuXHRcdGNvbnN0IHR5cGVzID0gdHlwZS5zcGxpdChcInxcIikubWFwKHQgPT4gdC50cmltKCkpO1xyXG5cdFx0Y29uc3QgYWN0dWFsVHlwZSA9IHR5cGVvZiB0b0NoZWNrO1xyXG5cclxuXHRcdC8vICNyZWdpb24gQ2hlY2sgaWYgdGhlIGFjdHVhbCB0eXBlIG1hdGNoZXMgYXQgbGVhc3Qgb25lIG9mIHRoZSBzcGVjaWZpZWQgdHlwZXNcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvdXNlVmFsaWRUeXBlb2Y6IE5lY2Vzc2FyeVxyXG5cdFx0Y29uc3QgaXNWYWxpZCA9IHR5cGVzLnNvbWUodCA9PiBhY3R1YWxUeXBlID09PSB0KTtcclxuXHJcblx0XHRpZiAoIWlzVmFsaWQpIHtcclxuXHRcdFx0aWYgKHR5cGVzLmxlbmd0aCA9PT0gMSkge1xyXG5cdFx0XHRcdHJldHVybiBgVmFsdWUgaGFzIHRvIHRvIGJlIG9mIHR5cGUgXCIke3R5cGV9XCIgYnV0IGlzIG9mIHR5cGUgXCIke2FjdHVhbFR5cGV9XCJgO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBgVmFsdWUgaGFzIHRvIHRvIGJlIG9mIHR5cGUgXCIke3R5cGVzLmpvaW4oXCIgfCBcIil9XCIgYnV0IGlzIG9mIHR5cGUgXCIke2FjdHVhbFR5cGV9XCJgO1xyXG5cdFx0fVxyXG5cdFx0Ly8gI2VuZHJlZ2lvbiBDaGVjayBpZiB0aGUgYWN0dWFsIHR5cGUgbWF0Y2hlcyBhdCBsZWFzdCBvbmUgb2YgdGhlIHNwZWNpZmllZCB0eXBlc1xyXG5cdFx0cmV0dXJuIHRydWU7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgcGFyYW1ldGVyLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgVFlQRS5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxyXG5cdCAqIGJ5IHRoZSB0YWdnZWQgcGFyYW1ldGVyLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHR5cGVcdFNlZSB7QGxpbmsgVFlQRS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRBIDo6LXNlcGFyYXRlZCBsaXN0IG9mIGRvdHRlZCBwYXRocyB0byBjaGVjay4gRWFjaCBwYXRoIHBvaW50cyB0byBhIHByb3BlcnR5IHdpdGhpbiB0aGUgcGFyYW1ldGVyIHZhbHVlLlxyXG5cdCAqIFx0XHRcdFx0VW5kZWZpbmVkIHByb3BlcnRpZXMgYXJlIHNraXBwZWQuIFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqIEBwYXJhbSBkYmNcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uICovXHJcblx0cHVibGljIHN0YXRpYyBQUkUoXHJcblx0XHR0eXBlOiBzdHJpbmcsXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRoaW50OiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmM6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZFxyXG5cdCk6IChcclxuXHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0bWV0aG9kTmFtZTogc3RyaW5nIHwgc3ltYm9sLFxyXG5cdFx0cGFyYW1ldGVySW5kZXg6IG51bWJlcixcclxuXHQpID0+IHZvaWQge1xyXG5cdFx0cmV0dXJuIERCQy5kZWNQcmVjb25kaXRpb24oXHJcblx0XHRcdChcclxuXHRcdFx0XHR2YWx1ZTogb2JqZWN0LFxyXG5cdFx0XHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0XHRcdG1ldGhvZE5hbWU6IHN0cmluZyxcclxuXHRcdFx0XHRwYXJhbWV0ZXJJbmRleDogbnVtYmVyLFxyXG5cdFx0XHQpID0+IHtcclxuXHRcdFx0XHRyZXR1cm4gVFlQRS5jaGVja0FsZ29yaXRobSh2YWx1ZSwgdHlwZSk7XHJcblx0XHRcdH0sXHJcblx0XHRcdGRiYyxcclxuXHRcdFx0cGF0aCxcclxuXHRcdFx0aGludFxyXG5cdFx0KTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogQSBtZXRob2QtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBUWVBFLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXHJcblx0ICogYnkgdGhlIHRhZ2dlZCBtZXRob2QncyByZXR1cm52YWx1ZS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0eXBlXHRTZWUge0BsaW5rIFRZUEUuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gcGF0aFx0QSA6Oi1zZXBhcmF0ZWQgbGlzdCBvZiBkb3R0ZWQgcGF0aHMgdG8gY2hlY2suIEVhY2ggcGF0aCBwb2ludHMgdG8gYSBwcm9wZXJ0eSB3aXRoaW4gdGhlIHBhcmFtZXRlciB2YWx1ZS5cclxuXHQgKiBcdFx0XHRcdFVuZGVmaW5lZCBwcm9wZXJ0aWVzIGFyZSBza2lwcGVkLiBTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cclxuXHQgKiBAcGFyYW0gZGJjXHRTZWUge0BsaW5rIERCQy5kZWNQb3N0Y29uZGl0aW9uIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNQb3N0Y29uZGl0aW9uIH0uICovXHJcblx0cHVibGljIHN0YXRpYyBQT1NUKFxyXG5cdFx0dHlwZTogc3RyaW5nLFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0aGludDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblxyXG5cdCk6IChcclxuXHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0cHJvcGVydHlLZXk6IHN0cmluZyxcclxuXHRcdGRlc2NyaXB0b3I6IFByb3BlcnR5RGVzY3JpcHRvcixcclxuXHQpID0+IFByb3BlcnR5RGVzY3JpcHRvciB7XHJcblx0XHRyZXR1cm4gREJDLmRlY1Bvc3Rjb25kaXRpb24oXHJcblx0XHRcdCh2YWx1ZTogb2JqZWN0LCB0YXJnZXQ6IG9iamVjdCwgcHJvcGVydHlLZXk6IHN0cmluZykgPT4ge1xyXG5cdFx0XHRcdHJldHVybiBUWVBFLmNoZWNrQWxnb3JpdGhtKHZhbHVlLCB0eXBlKTtcclxuXHRcdFx0fSxcclxuXHRcdFx0ZGJjLFxyXG5cdFx0XHRwYXRoLFxyXG5cdFx0XHRoaW50XHJcblx0XHQpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBBIGZpZWxkLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgVFlQRS5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxyXG5cdCAqIGJ5IHRoZSB0YWdnZWQgZmllbGQuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdHlwZVx0U2VlIHtAbGluayBUWVBFLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIHBhdGhcdEEgOjotc2VwYXJhdGVkIGxpc3Qgb2YgZG90dGVkIHBhdGhzIHRvIGNoZWNrLiBFYWNoIHBhdGggcG9pbnRzIHRvIGEgcHJvcGVydHkgd2l0aGluIHRoZSBwYXJhbWV0ZXIgdmFsdWUuXHJcblx0ICogXHRcdFx0XHRVbmRlZmluZWQgcHJvcGVydGllcyBhcmUgc2tpcHBlZC4gU2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXHJcblx0ICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIElOVkFSSUFOVChcclxuXHRcdHR5cGU6IHN0cmluZyxcclxuXHRcdHBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGhpbnQ6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGRiYzogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdCkge1xyXG5cdFx0cmV0dXJuIERCQy5kZWNJbnZhcmlhbnQoW25ldyBUWVBFKHR5cGUpXSwgcGF0aCwgZGJjLCBoaW50KTtcclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXHJcblx0Ly8gI3JlZ2lvbiBSZWZlcmVuY2VkIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvL1xyXG5cdC8vIEZvciB1c2FnZSBpbiBkeW5hbWljIHNjZW5hcmlvcyAobGlrZSB3aXRoIEFFLURCQykuXHJcblx0Ly9cclxuXHQvKipcclxuXHQgKiBJbnZva2VzIHRoZSB7QGxpbmsgVFlQRS5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqIGFuZCB0aGUge0BsaW5rIFRZUEUudHlwZSB9IC5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0b0NoZWNrIFNlZSB7QGxpbmsgVFlQRS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBUWVBFLmNoZWNrQWxnb3JpdGhtfS4gKi9cclxuXHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cclxuXHRwdWJsaWMgY2hlY2sodG9DaGVjazogYW55KSB7XHJcblx0XHRyZXR1cm4gVFlQRS5jaGVja0FsZ29yaXRobSh0b0NoZWNrLCB0aGlzLnR5cGUpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBJbnZva2VzIHRoZSB7QGxpbmsgVFlQRS5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqIGFuZCB0aGUge0BsaW5rIFRZUEUudHlwZSB9IC5cclxuXHQgKiBcclxuXHQgKiBAcGFyYW0gdG9DaGVja1x0U2VlIHtAbGluayBUWVBFLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIHR5cGVcdFx0U2VlIHtAbGluayBUWVBFLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIGhpbnRcdFx0QW4gb3B0aW9uYWwge0BsaW5rIHN0cmluZyB9IHByb3ZpZGluZyBleHRyYSBpbmZvcm1hdGlvbiBpbiBjYXNlIG9mIGFuIGluZnJpbmdlbWVudC5cclxuXHQgKiBAcGFyYW0gaWRcdFx0QSB7QGxpbmsgc3RyaW5nIH0gaWRlbnRpZnlpbmcgdGhpcyB7QGxpbmsgVFlQRSB9IHZpYSB0aGUge0BsaW5rIERCQy5JbmZyaW5nZW1lbnQgfS1NZXNzYWdlLlxyXG5cdCAqIFxyXG5cdCAqIEByZXR1cm5zIFRoZSAqKkNBTkRJREFURSoqICoqdG9DaGVjayoqIGRvZXNuJ3QgZnVsZmlsbCB0aGlzIHtAbGluayBUWVBFIH0uXHJcblx0ICogXHJcblx0ICogQHRocm93cyBBIHtAbGluayBEQkMuSW5mcmluZ2VtZW50IH0gaWYgdGhlICoqQ0FORElEQVRFKiogKip0b0NoZWNrKiogZG9lcyBub3QgZnVsZmlsbCB0aGlzIHtAbGluayBERUZJTkVEIH0uICovXHJcblx0cHVibGljIHN0YXRpYyB0c0NoZWNrPENBTkRJREFURSA9IHVua25vd24+KHRvQ2hlY2s6IGFueSwgdHlwZTogc3RyaW5nLCBoaW50OiBzdHJpbmcgPSB1bmRlZmluZWQsIGlkOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQpOiBDQU5ESURBVEUge1xyXG5cdFx0Y29uc3QgcmVzdWx0ID0gVFlQRS5jaGVja0FsZ29yaXRobSh0b0NoZWNrLCB0eXBlKTtcclxuXHJcblx0XHRpZiAocmVzdWx0ID09PSB0cnVlKSB7XHJcblx0XHRcdHJldHVybiB0b0NoZWNrO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHRocm93IG5ldyBEQkMuSW5mcmluZ2VtZW50KGAke2lkID8gYCgke2lkfSkgYCA6IFwiXCJ9JHtyZXN1bHQgYXMgc3RyaW5nfSR7aGludCA/IGAgXHUyNzI4ICR7aGludH0gXHUyNzI4YCA6IFwiXCJ9YCk7XHJcblx0XHR9XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIENyZWF0ZXMgdGhpcyB7QGxpbmsgVFlQRSB9IGJ5IHNldHRpbmcgdGhlIHByb3RlY3RlZCBwcm9wZXJ0eSB7QGxpbmsgVFlQRS50eXBlIH0gdXNlZCBieSB7QGxpbmsgVFlQRS5jaGVjayB9LlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHR5cGUgU2VlIHtAbGluayBUWVBFLmNoZWNrIH0uICovXHJcblx0cHVibGljIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB0eXBlOiBzdHJpbmcpIHtcclxuXHRcdHN1cGVyKCk7XHJcblx0fVxyXG59XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7O0FBT08sSUFBTSxPQUFOLE1BQU0sY0FBYSxJQUFJO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQXNKdEIsWUFBc0IsTUFBYztBQUMxQyxVQUFNO0FBRHNCO0FBQUEsRUFFN0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUEvSUEsT0FBYyxlQUFlLFNBQWMsTUFBZ0M7QUFDMUUsUUFBSSxZQUFZLFVBQWEsWUFBWSxLQUFNLFFBQU87QUFFdEQsVUFBTSxRQUFRLEtBQUssTUFBTSxHQUFHLEVBQUUsSUFBSSxPQUFLLEVBQUUsS0FBSyxDQUFDO0FBQy9DLFVBQU0sYUFBYSxPQUFPO0FBSTFCLFVBQU0sVUFBVSxNQUFNLEtBQUssT0FBSyxlQUFlLENBQUM7QUFFaEQsUUFBSSxDQUFDLFNBQVM7QUFDYixVQUFJLE1BQU0sV0FBVyxHQUFHO0FBQ3ZCLGVBQU8sK0JBQStCLElBQUkscUJBQXFCLFVBQVU7QUFBQSxNQUMxRTtBQUNBLGFBQU8sK0JBQStCLE1BQU0sS0FBSyxLQUFLLENBQUMscUJBQXFCLFVBQVU7QUFBQSxJQUN2RjtBQUVBLFdBQU87QUFBQSxFQUNSO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVdBLE9BQWMsSUFDYixNQUNBLE9BQTJCLFFBQzNCLE9BQTJCLFFBQzNCLE1BQTBCLFFBS2pCO0FBQ1QsV0FBTyxJQUFJO0FBQUEsTUFDVixDQUNDLE9BQ0EsUUFDQSxZQUNBLG1CQUNJO0FBQ0osZUFBTyxNQUFLLGVBQWUsT0FBTyxJQUFJO0FBQUEsTUFDdkM7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNEO0FBQUEsRUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFXQSxPQUFjLEtBQ2IsTUFDQSxPQUEyQixRQUMzQixPQUEyQixRQUMzQixNQUEwQixRQU1IO0FBQ3ZCLFdBQU8sSUFBSTtBQUFBLE1BQ1YsQ0FBQyxPQUFlLFFBQWdCLGdCQUF3QjtBQUN2RCxlQUFPLE1BQUssZUFBZSxPQUFPLElBQUk7QUFBQSxNQUN2QztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Q7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVdBLE9BQWMsVUFDYixNQUNBLE9BQTJCLFFBQzNCLE9BQTJCLFFBQzNCLE1BQTBCLFFBQ3pCO0FBQ0QsV0FBTyxJQUFJLGFBQWEsQ0FBQyxJQUFJLE1BQUssSUFBSSxDQUFDLEdBQUcsTUFBTSxLQUFLLElBQUk7QUFBQSxFQUMxRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBYU8sTUFBTSxTQUFjO0FBQzFCLFdBQU8sTUFBSyxlQUFlLFNBQVMsS0FBSyxJQUFJO0FBQUEsRUFDOUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFZQSxPQUFjLFFBQTZCLFNBQWMsTUFBYyxPQUFlLFFBQVcsS0FBeUIsUUFBc0I7QUFDL0ksVUFBTSxTQUFTLE1BQUssZUFBZSxTQUFTLElBQUk7QUFFaEQsUUFBSSxXQUFXLE1BQU07QUFDcEIsYUFBTztBQUFBLElBQ1IsT0FDSztBQUNKLFlBQU0sSUFBSSxJQUFJLGFBQWEsR0FBRyxLQUFLLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxNQUFnQixHQUFHLE9BQU8sV0FBTSxJQUFJLFlBQU8sRUFBRSxFQUFFO0FBQUEsSUFDckc7QUFBQSxFQUNEO0FBUUQ7IiwKICAibmFtZXMiOiBbXQp9Cg==
