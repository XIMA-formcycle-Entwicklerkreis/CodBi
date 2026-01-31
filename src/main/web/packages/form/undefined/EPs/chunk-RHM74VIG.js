import { DBC } from "./chunk-WDRNTVZG.js";

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
  static PRE(type, path = void 0, dbc = "WaXCode.DBC") {
    return DBC.decPrecondition(
      (value, target, methodName, parameterIndex) => {
        return _TYPE.checkAlgorithm(value, type);
      },
      dbc,
      path,
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
  static POST(type, path = void 0, dbc = "WaXCode.DBC") {
    return DBC.decPostcondition(
      (value, target, propertyKey) => {
        return _TYPE.checkAlgorithm(value, type);
      },
      dbc,
      path,
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
  static INVARIANT(type, path = void 0, dbc = "WaXCode.DBC") {
    return DBC.decInvariant([new _TYPE(type)], path, dbc);
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
   * @param toCheck	See {@link INSTANCE.checkAlgorithm }.
   * @param type		See {@link INSTANCE.checkAlgorithm }.
   * @param id		A {@link string } identifying this {@link TYPE } via the {@link DBC.Infringement }-Message.
   * @param hint		An optional {@link string } providing extra information in case of an infringement.
   *
   * @returns The **CANDIDATE** **toCheck** doesn't fulfill this {@link TYPE }.
   *
   * @throws A {@link DBC.Infringement } if the **CANDIDATE** **toCheck** does not fulfill this {@link DEFINED }. */
  static tsCheck(toCheck, type, hint = void 0, id = void 0) {
    const result = _TYPE.checkAlgorithm(toCheck, type);
    if (result === true) {
      return toCheck;
    } else {
      throw new DBC.Infringement(`${id ? `(${id}) ` : ""}${result}${hint ? ` < ${hint} >` : ""}`);
    }
  }
};

export { TYPE };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3hkYmMvc3JjL0RCQy9UWVBFLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBEQkMgfSBmcm9tIFwiLi4vREJDXCI7XHJcbi8qKlxyXG4gKiBBIHtAbGluayBEQkMgfSBkZWZpbmluZyB0aGF0IGFuIHtAbGluayBvYmplY3QgfXMgZ290dGEgYmUgb2YgY2VydGFpbiB7QGxpbmsgVFlQRS50eXBlIH0uXHJcbiAqXHJcbiAqIEByZW1hcmtzXHJcbiAqIEF1dGhvcjogXHRcdFNhbHZhdG9yZSBDYWxsYXJpIChDYWxsYXJpQFdhWENvZGUubmV0KSAvIDIwMjVcclxuICogTWFpbnRhaW5lcjpcdFNhbHZhdG9yZSBDYWxsYXJpIChYREJDQFdhWENvZGUubmV0KSAqL1xyXG5leHBvcnQgY2xhc3MgVFlQRSBleHRlbmRzIERCQyB7XHJcblx0LyoqXHJcblx0ICogQ2hlY2tzIGlmIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBpcyBvZiB0aGUgKip0eXBlKiogc3BlY2lmaWVkLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHRvQ2hlY2tcdFRoZSB7QGxpbmsgT2JqZWN0IH0gd2hpY2gncyAqKnR5cGUqKiB0byBjaGVjay5cclxuXHQgKiBAcGFyYW0gdHlwZVx0XHRUaGUgdHlwZSB0aGUge0BsaW5rIG9iamVjdH0gKip0b0NoZWNrKiogaGFzIHRvIGJlIG9mLiBDYW4gYmUgYSBzaW5nbGUgdHlwZSBvciBtdWx0aXBsZSB0eXBlcyBzZXBhcmF0ZWQgYnkgXCJ8XCIuXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBUUlVFIGlmIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBpcyBvZiB0aGUgc3BlY2lmaWVkICoqdHlwZSoqLCBvdGhlcndpc2UgRkFMU0UuICovXHJcblx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBOZWNlc3NhcnkgZm9yIGR5bmFtaWMgdHlwZSBjaGVja2luZyBvZiBhbHNvIFVOREVGSU5FRC5cclxuXHRwdWJsaWMgc3RhdGljIGNoZWNrQWxnb3JpdGhtKHRvQ2hlY2s6IGFueSwgdHlwZTogc3RyaW5nKTogYm9vbGVhbiB8IHN0cmluZyB7XHJcblx0XHRjb25zdCB0eXBlcyA9IHR5cGUuc3BsaXQoXCJ8XCIpLm1hcCh0ID0+IHQudHJpbSgpKTtcclxuXHRcdGNvbnN0IGFjdHVhbFR5cGUgPSB0eXBlb2YgdG9DaGVjaztcclxuXHJcblx0XHQvLyAjcmVnaW9uIENoZWNrIGlmIHRoZSBhY3R1YWwgdHlwZSBtYXRjaGVzIGF0IGxlYXN0IG9uZSBvZiB0aGUgc3BlY2lmaWVkIHR5cGVzXHJcblx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL3VzZVZhbGlkVHlwZW9mOiBOZWNlc3NhcnlcclxuXHRcdGNvbnN0IGlzVmFsaWQgPSB0eXBlcy5zb21lKHQgPT4gYWN0dWFsVHlwZSA9PT0gdCk7XHJcblxyXG5cdFx0aWYgKCFpc1ZhbGlkKSB7XHJcblx0XHRcdGlmICh0eXBlcy5sZW5ndGggPT09IDEpIHtcclxuXHRcdFx0XHRyZXR1cm4gYFZhbHVlIGhhcyB0byB0byBiZSBvZiB0eXBlIFwiJHt0eXBlfVwiIGJ1dCBpcyBvZiB0eXBlIFwiJHthY3R1YWxUeXBlfVwiYDtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gYFZhbHVlIGhhcyB0byB0byBiZSBvZiB0eXBlIFwiJHt0eXBlcy5qb2luKFwiIHwgXCIpfVwiIGJ1dCBpcyBvZiB0eXBlIFwiJHthY3R1YWxUeXBlfVwiYDtcclxuXHRcdH1cclxuXHRcdC8vICNlbmRyZWdpb24gQ2hlY2sgaWYgdGhlIGFjdHVhbCB0eXBlIG1hdGNoZXMgYXQgbGVhc3Qgb25lIG9mIHRoZSBzcGVjaWZpZWQgdHlwZXNcclxuXHRcdHJldHVybiB0cnVlO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBBIHBhcmFtZXRlci1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIFRZUEUuY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcclxuXHQgKiBieSB0aGUgdGFnZ2VkIHBhcmFtZXRlci5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0eXBlXHRTZWUge0BsaW5rIFRZUEUuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gcGF0aFx0QSA6Oi1zZXBhcmF0ZWQgbGlzdCBvZiBkb3R0ZWQgcGF0aHMgdG8gY2hlY2suIEVhY2ggcGF0aCBwb2ludHMgdG8gYSBwcm9wZXJ0eSB3aXRoaW4gdGhlIHBhcmFtZXRlciB2YWx1ZS5cclxuXHQgKiBcdFx0XHRcdFVuZGVmaW5lZCBwcm9wZXJ0aWVzIGFyZSBza2lwcGVkLiBTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cclxuXHQgKiBAcGFyYW0gZGJjXHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgUFJFKFxyXG5cdFx0dHlwZTogc3RyaW5nLFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjID0gXCJXYVhDb2RlLkRCQ1wiLFxyXG5cdCk6IChcclxuXHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0bWV0aG9kTmFtZTogc3RyaW5nIHwgc3ltYm9sLFxyXG5cdFx0cGFyYW1ldGVySW5kZXg6IG51bWJlcixcclxuXHQpID0+IHZvaWQge1xyXG5cdFx0cmV0dXJuIERCQy5kZWNQcmVjb25kaXRpb24oXHJcblx0XHRcdChcclxuXHRcdFx0XHR2YWx1ZTogb2JqZWN0LFxyXG5cdFx0XHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0XHRcdG1ldGhvZE5hbWU6IHN0cmluZyxcclxuXHRcdFx0XHRwYXJhbWV0ZXJJbmRleDogbnVtYmVyLFxyXG5cdFx0XHQpID0+IHtcclxuXHRcdFx0XHRyZXR1cm4gVFlQRS5jaGVja0FsZ29yaXRobSh2YWx1ZSwgdHlwZSk7XHJcblx0XHRcdH0sXHJcblx0XHRcdGRiYyxcclxuXHRcdFx0cGF0aCxcclxuXHRcdCk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgVFlQRS5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxyXG5cdCAqIGJ5IHRoZSB0YWdnZWQgbWV0aG9kJ3MgcmV0dXJudmFsdWUuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdHlwZVx0U2VlIHtAbGluayBUWVBFLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIHBhdGhcdEEgOjotc2VwYXJhdGVkIGxpc3Qgb2YgZG90dGVkIHBhdGhzIHRvIGNoZWNrLiBFYWNoIHBhdGggcG9pbnRzIHRvIGEgcHJvcGVydHkgd2l0aGluIHRoZSBwYXJhbWV0ZXIgdmFsdWUuXHJcblx0ICogXHRcdFx0XHRVbmRlZmluZWQgcHJvcGVydGllcyBhcmUgc2tpcHBlZC4gU2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXHJcblx0ICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgUE9TVChcclxuXHRcdHR5cGU6IHN0cmluZyxcclxuXHRcdHBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGRiYyA9IFwiV2FYQ29kZS5EQkNcIixcclxuXHQpOiAoXHJcblx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdHByb3BlcnR5S2V5OiBzdHJpbmcsXHJcblx0XHRkZXNjcmlwdG9yOiBQcm9wZXJ0eURlc2NyaXB0b3IsXHJcblx0KSA9PiBQcm9wZXJ0eURlc2NyaXB0b3Ige1xyXG5cdFx0cmV0dXJuIERCQy5kZWNQb3N0Y29uZGl0aW9uKFxyXG5cdFx0XHQodmFsdWU6IG9iamVjdCwgdGFyZ2V0OiBvYmplY3QsIHByb3BlcnR5S2V5OiBzdHJpbmcpID0+IHtcclxuXHRcdFx0XHRyZXR1cm4gVFlQRS5jaGVja0FsZ29yaXRobSh2YWx1ZSwgdHlwZSk7XHJcblx0XHRcdH0sXHJcblx0XHRcdGRiYyxcclxuXHRcdFx0cGF0aCxcclxuXHRcdCk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgZmllbGQtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBUWVBFLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXHJcblx0ICogYnkgdGhlIHRhZ2dlZCBmaWVsZC5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0eXBlXHRTZWUge0BsaW5rIFRZUEUuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gcGF0aFx0QSA6Oi1zZXBhcmF0ZWQgbGlzdCBvZiBkb3R0ZWQgcGF0aHMgdG8gY2hlY2suIEVhY2ggcGF0aCBwb2ludHMgdG8gYSBwcm9wZXJ0eSB3aXRoaW4gdGhlIHBhcmFtZXRlciB2YWx1ZS5cclxuXHQgKiBcdFx0XHRcdFVuZGVmaW5lZCBwcm9wZXJ0aWVzIGFyZSBza2lwcGVkLiBTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cclxuXHQgKiBAcGFyYW0gZGJjXHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgSU5WQVJJQU5UKFxyXG5cdFx0dHlwZTogc3RyaW5nLFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjID0gXCJXYVhDb2RlLkRCQ1wiLFxyXG5cdCkge1xyXG5cdFx0cmV0dXJuIERCQy5kZWNJbnZhcmlhbnQoW25ldyBUWVBFKHR5cGUpXSwgcGF0aCwgZGJjKTtcclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXHJcblx0Ly8gI3JlZ2lvbiBSZWZlcmVuY2VkIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvL1xyXG5cdC8vIEZvciB1c2FnZSBpbiBkeW5hbWljIHNjZW5hcmlvcyAobGlrZSB3aXRoIEFFLURCQykuXHJcblx0Ly9cclxuXHQvKipcclxuXHQgKiBJbnZva2VzIHRoZSB7QGxpbmsgVFlQRS5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqIGFuZCB0aGUge0BsaW5rIFRZUEUudHlwZSB9IC5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0b0NoZWNrIFNlZSB7QGxpbmsgVFlQRS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBUWVBFLmNoZWNrQWxnb3JpdGhtfS4gKi9cclxuXHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cclxuXHRwdWJsaWMgY2hlY2sodG9DaGVjazogYW55KSB7XHJcblx0XHRyZXR1cm4gVFlQRS5jaGVja0FsZ29yaXRobSh0b0NoZWNrLCB0aGlzLnR5cGUpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBJbnZva2VzIHRoZSB7QGxpbmsgVFlQRS5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqIGFuZCB0aGUge0BsaW5rIFRZUEUudHlwZSB9IC5cclxuXHQgKiBcclxuXHQgKiBAcGFyYW0gdG9DaGVja1x0U2VlIHtAbGluayBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSB0eXBlXHRcdFNlZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gaWRcdFx0QSB7QGxpbmsgc3RyaW5nIH0gaWRlbnRpZnlpbmcgdGhpcyB7QGxpbmsgVFlQRSB9IHZpYSB0aGUge0BsaW5rIERCQy5JbmZyaW5nZW1lbnQgfS1NZXNzYWdlLlxyXG5cdCAqIEBwYXJhbSBoaW50XHRcdEFuIG9wdGlvbmFsIHtAbGluayBzdHJpbmcgfSBwcm92aWRpbmcgZXh0cmEgaW5mb3JtYXRpb24gaW4gY2FzZSBvZiBhbiBpbmZyaW5nZW1lbnQuXHJcblx0ICogXHJcblx0ICogQHJldHVybnMgVGhlICoqQ0FORElEQVRFKiogKip0b0NoZWNrKiogZG9lc24ndCBmdWxmaWxsIHRoaXMge0BsaW5rIFRZUEUgfS5cclxuXHQgKiBcclxuXHQgKiBAdGhyb3dzIEEge0BsaW5rIERCQy5JbmZyaW5nZW1lbnQgfSBpZiB0aGUgKipDQU5ESURBVEUqKiAqKnRvQ2hlY2sqKiBkb2VzIG5vdCBmdWxmaWxsIHRoaXMge0BsaW5rIERFRklORUQgfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIHRzQ2hlY2s8Q0FORElEQVRFID0gdW5rbm93bj4odG9DaGVjazogYW55LCB0eXBlOiBzdHJpbmcsIGhpbnQ6IHN0cmluZyA9IHVuZGVmaW5lZCwgaWQ6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCk6IENBTkRJREFURSB7XHJcblx0XHRjb25zdCByZXN1bHQgPSBUWVBFLmNoZWNrQWxnb3JpdGhtKHRvQ2hlY2ssIHR5cGUpO1xyXG5cclxuXHRcdGlmIChyZXN1bHQgPT09IHRydWUpIHtcclxuXHRcdFx0cmV0dXJuIHRvQ2hlY2s7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dGhyb3cgbmV3IERCQy5JbmZyaW5nZW1lbnQoYCR7aWQgPyBgKCR7aWR9KSBgIDogXCJcIn0ke3Jlc3VsdCBhcyBzdHJpbmd9JHtoaW50ID8gYCA8ICR7aGludH0gPmAgOiBcIlwifWApO1xyXG5cdFx0fVxyXG5cdH1cclxuXHQvKipcclxuXHQgKiBDcmVhdGVzIHRoaXMge0BsaW5rIFRZUEUgfSBieSBzZXR0aW5nIHRoZSBwcm90ZWN0ZWQgcHJvcGVydHkge0BsaW5rIFRZUEUudHlwZSB9IHVzZWQgYnkge0BsaW5rIFRZUEUuY2hlY2sgfS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0eXBlIFNlZSB7QGxpbmsgVFlQRS5jaGVjayB9LiAqL1xyXG5cdHB1YmxpYyBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdHlwZTogc3RyaW5nKSB7XHJcblx0XHRzdXBlcigpO1xyXG5cdH1cclxufVxyXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7OztBQU9PLElBQU0sT0FBTixNQUFNLGNBQWEsSUFBSTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUE4SXRCLFlBQXNCLE1BQWM7QUFDMUMsVUFBTTtBQURzQjtBQUFBLEVBRTdCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBdklBLE9BQWMsZUFBZSxTQUFjLE1BQWdDO0FBQzFFLFVBQU0sUUFBUSxLQUFLLE1BQU0sR0FBRyxFQUFFLElBQUksT0FBSyxFQUFFLEtBQUssQ0FBQztBQUMvQyxVQUFNLGFBQWEsT0FBTztBQUkxQixVQUFNLFVBQVUsTUFBTSxLQUFLLE9BQUssZUFBZSxDQUFDO0FBRWhELFFBQUksQ0FBQyxTQUFTO0FBQ2IsVUFBSSxNQUFNLFdBQVcsR0FBRztBQUN2QixlQUFPLCtCQUErQixJQUFJLHFCQUFxQixVQUFVO0FBQUEsTUFDMUU7QUFDQSxhQUFPLCtCQUErQixNQUFNLEtBQUssS0FBSyxDQUFDLHFCQUFxQixVQUFVO0FBQUEsSUFDdkY7QUFFQSxXQUFPO0FBQUEsRUFDUjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFXQSxPQUFjLElBQ2IsTUFDQSxPQUEyQixRQUMzQixNQUFNLGVBS0c7QUFDVCxXQUFPLElBQUk7QUFBQSxNQUNWLENBQ0MsT0FDQSxRQUNBLFlBQ0EsbUJBQ0k7QUFDSixlQUFPLE1BQUssZUFBZSxPQUFPLElBQUk7QUFBQSxNQUN2QztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBV0EsT0FBYyxLQUNiLE1BQ0EsT0FBMkIsUUFDM0IsTUFBTSxlQUtpQjtBQUN2QixXQUFPLElBQUk7QUFBQSxNQUNWLENBQUMsT0FBZSxRQUFnQixnQkFBd0I7QUFDdkQsZUFBTyxNQUFLLGVBQWUsT0FBTyxJQUFJO0FBQUEsTUFDdkM7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Q7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVdBLE9BQWMsVUFDYixNQUNBLE9BQTJCLFFBQzNCLE1BQU0sZUFDTDtBQUNELFdBQU8sSUFBSSxhQUFhLENBQUMsSUFBSSxNQUFLLElBQUksQ0FBQyxHQUFHLE1BQU0sR0FBRztBQUFBLEVBQ3BEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFhTyxNQUFNLFNBQWM7QUFDMUIsV0FBTyxNQUFLLGVBQWUsU0FBUyxLQUFLLElBQUk7QUFBQSxFQUM5QztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVlBLE9BQWMsUUFBNkIsU0FBYyxNQUFjLE9BQWUsUUFBVyxLQUF5QixRQUFzQjtBQUMvSSxVQUFNLFNBQVMsTUFBSyxlQUFlLFNBQVMsSUFBSTtBQUVoRCxRQUFJLFdBQVcsTUFBTTtBQUNwQixhQUFPO0FBQUEsSUFDUixPQUNLO0FBQ0osWUFBTSxJQUFJLElBQUksYUFBYSxHQUFHLEtBQUssSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLE1BQWdCLEdBQUcsT0FBTyxNQUFNLElBQUksT0FBTyxFQUFFLEVBQUU7QUFBQSxJQUNyRztBQUFBLEVBQ0Q7QUFRRDsiLAogICJuYW1lcyI6IFtdCn0K
