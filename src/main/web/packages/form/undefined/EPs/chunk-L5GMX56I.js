import { DBC } from "./chunk-YNACB2OL.js";

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
  static PRE(path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decPrecondition(
      (value, target, methodName, parameterIndex) => {
        return _DEFINED.checkAlgorithm(value);
      },
      dbc,
      path,
      hint,
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
  static POST(type, path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decPostcondition(
      (value, target, propertyKey) => {
        return _DEFINED.checkAlgorithm(value);
      },
      dbc,
      path,
      hint,
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
  static INVARIANT(type, path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decInvariant([new _DEFINED()], path, dbc, hint);
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
  static tsCheck(toCheck, hint = void 0, id = void 0) {
    const result = _DEFINED.checkAlgorithm(toCheck);
    if (result === true) {
      return toCheck;
    } else {
      throw new DBC.Infringement(`${id ? `(${id}) ` : ""}${result}${hint ? ` \u2728 ${hint} \u2728` : ""}`);
    }
  }
  /** Creates this {@link DEFINED }. */
  constructor() {
    super();
  }
};

export { DEFINED };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3hkYmMvc3JjL0RCQy9ERUZJTkVELnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBEQkMgfSBmcm9tIFwiLi4vREJDXCI7XHJcbi8qKlxyXG4gKiBBIHtAbGluayBEQkMgfSBkZWZpbmluZyB0aGF0IGFuIHtAbGluayBvYmplY3QgfXMgbXVzdCBiZSBkZWZpbmVkIHRodXMgaXQncyB2YWx1ZSBtYXkgbm90IGJlICoqbnVsbCoqIG9yICoqdW5kZWZpbmVkKiouXHJcbiAqXHJcbiAqIEByZW1hcmtzXHJcbiAqIE1haW50YWluZXI6IFNhbHZhdG9yZSBDYWxsYXJpIChYREJDQFdhWENvZGUubmV0KSAqL1xyXG5leHBvcnQgY2xhc3MgREVGSU5FRCBleHRlbmRzIERCQyB7XHJcblx0LyoqXHJcblx0ICogQ2hlY2tzIGlmIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBpcyBudWxsIG9yIHVuZGVmaW5lZC5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0b0NoZWNrXHRUaGUge0BsaW5rIE9iamVjdCB9IHRvIGNoZWNrLlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgVFJVRSBpZiB0aGUgdmFsdWUgKip0b0NoZWNrKiogaXMgb2YgdGhlIHNwZWNpZmllZCAqKnR5cGUqKiwgb3RoZXJ3aXNlIEZBTFNFLiAqL1xyXG5cdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogTmVjZXNzYXJ5IGZvciBkeW5hbWljIHR5cGUgY2hlY2tpbmcgb2YgYWxzbyBVTkRFRklORUQuXHJcblx0cHVibGljIHN0YXRpYyBjaGVja0FsZ29yaXRobSh0b0NoZWNrOiBhbnkpOiBib29sZWFuIHwgc3RyaW5nIHtcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvdXNlVmFsaWRUeXBlb2Y6IE5lY2Vzc2FyeVxyXG5cdFx0aWYgKHRvQ2hlY2sgPT09IHVuZGVmaW5lZCB8fCB0b0NoZWNrID09PSBudWxsKSB7XHJcblx0XHRcdHJldHVybiBgVmFsdWUgbWF5IG5vdCBiZSBVTkRFRklORUQgb3IgTlVMTCBidXQgaXQgaXMgJHt0b0NoZWNrID09PSB1bmRlZmluZWQgPyBcIlVOREVGSU5FRFwiIDogXCJOVUxMXCJ9YDtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdHJ1ZTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogQSBwYXJhbWV0ZXItZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBERUZJTkVELmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXHJcblx0ICogYnkgdGhlIHRhZ2dlZCBwYXJhbWV0ZXIuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdHlwZVx0U2VlIHtAbGluayBERUZJTkVELmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIHBhdGhcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqIEBwYXJhbSBkYmNcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uICovXHJcblx0cHVibGljIHN0YXRpYyBQUkUoXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRoaW50OiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmM6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHQpOiAoXHJcblx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdG1ldGhvZE5hbWU6IHN0cmluZyB8IHN5bWJvbCxcclxuXHRcdHBhcmFtZXRlckluZGV4OiBudW1iZXIsXHJcblx0KSA9PiB2b2lkIHtcclxuXHRcdHJldHVybiBEQkMuZGVjUHJlY29uZGl0aW9uKFxyXG5cdFx0XHQoXHJcblx0XHRcdFx0dmFsdWU6IG9iamVjdCxcclxuXHRcdFx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdFx0XHRtZXRob2ROYW1lOiBzdHJpbmcsXHJcblx0XHRcdFx0cGFyYW1ldGVySW5kZXg6IG51bWJlcixcclxuXHRcdFx0KSA9PiB7XHJcblx0XHRcdFx0cmV0dXJuIERFRklORUQuY2hlY2tBbGdvcml0aG0odmFsdWUpO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRkYmMsXHJcblx0XHRcdHBhdGgsXHJcblx0XHRcdGhpbnRcclxuXHRcdCk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgREVGSU5FRC5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxyXG5cdCAqIGJ5IHRoZSB0YWdnZWQgbWV0aG9kJ3MgcmV0dXJudmFsdWUuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdHlwZVx0U2VlIHtAbGluayBERUZJTkVELmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIHBhdGhcdFNlZSB7QGxpbmsgREJDLlBvc3Rjb25kaXRpb24gfS5cclxuXHQgKiBAcGFyYW0gZGJjXHRTZWUge0BsaW5rIERCQy5kZWNQb3N0Y29uZGl0aW9uIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNQb3N0Y29uZGl0aW9uIH0uICovXHJcblx0cHVibGljIHN0YXRpYyBQT1NUKFxyXG5cdFx0dHlwZTogc3RyaW5nLFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0aGludDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0KTogKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRwcm9wZXJ0eUtleTogc3RyaW5nLFxyXG5cdFx0ZGVzY3JpcHRvcjogUHJvcGVydHlEZXNjcmlwdG9yLFxyXG5cdCkgPT4gUHJvcGVydHlEZXNjcmlwdG9yIHtcclxuXHRcdHJldHVybiBEQkMuZGVjUG9zdGNvbmRpdGlvbihcclxuXHRcdFx0KHZhbHVlOiBvYmplY3QsIHRhcmdldDogb2JqZWN0LCBwcm9wZXJ0eUtleTogc3RyaW5nKSA9PiB7XHJcblx0XHRcdFx0cmV0dXJuIERFRklORUQuY2hlY2tBbGdvcml0aG0odmFsdWUpO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRkYmMsXHJcblx0XHRcdHBhdGgsXHJcblx0XHRcdGhpbnRcclxuXHRcdCk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgZmllbGQtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBERUZJTkVELmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXHJcblx0ICogYnkgdGhlIHRhZ2dlZCBmaWVsZC5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0eXBlXHRTZWUge0BsaW5rIERFRklORUQuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gcGF0aFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXHJcblx0ICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIElOVkFSSUFOVChcclxuXHRcdHR5cGU6IHN0cmluZyxcclxuXHRcdHBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGhpbnQ6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGRiYzogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdCkge1xyXG5cdFx0cmV0dXJuIERCQy5kZWNJbnZhcmlhbnQoW25ldyBERUZJTkVEKCldLCBwYXRoLCBkYmMsIGhpbnQpO1xyXG5cdH1cclxuXHQvLyAjZW5kcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvLyAjcmVnaW9uIFJlZmVyZW5jZWQgQ29uZGl0aW9uIGNoZWNraW5nLlxyXG5cdC8vXHJcblx0Ly8gRm9yIHVzYWdlIGluIGR5bmFtaWMgc2NlbmFyaW9zIChsaWtlIHdpdGggQUUtREJDKS5cclxuXHQvL1xyXG5cdC8qKlxyXG5cdCAqIEludm9rZXMgdGhlIHtAbGluayBERUZJTkVELmNoZWNrQWxnb3JpdGhtIH0gcGFzc2luZyB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHRoZSB7QGxpbmsgREVGSU5FRC50eXBlIH0gLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHRvQ2hlY2sgU2VlIHtAbGluayBERUZJTkVELmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIERFRklORUQuY2hlY2tBbGdvcml0aG19LiAqL1xyXG5cdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxyXG5cdHB1YmxpYyBjaGVjayh0b0NoZWNrOiBhbnkpIHtcclxuXHRcdHJldHVybiBERUZJTkVELmNoZWNrQWxnb3JpdGhtKHRvQ2hlY2spO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBJbnZva2VzIHRoZSB7QGxpbmsgREVGSU5FRC5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqIGFuZCB0aGUge0BsaW5rIERFRklORUQudHlwZSB9IC5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0b0NoZWNrXHRTZWUge0BsaW5rIERFRklORUQuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gaWRcdFx0QSB7QGxpbmsgc3RyaW5nIH0gaWRlbnRpZnlpbmcgdGhpcyB7QGxpbmsgSU5TVEFOQ0UgfSB2aWEgdGhlIHtAbGluayBEQkMuSW5mcmluZ2VtZW50IH0tTWVzc2FnZS5cclxuXHQgKiBcclxuXHQgKiBAcmV0dXJucyBUaGUgKipDQU5ESURBVEUqKiAqKnRvQ2hlY2sqKiBkb2Vzbid0IGZ1bGZpbGwgdGhpcyB7QGxpbmsgREVGSU5FRCB9LlxyXG5cdCAqIFxyXG5cdCAqIEB0aHJvd3MgQSB7QGxpbmsgREJDLkluZnJpbmdlbWVudCB9IGlmIHRoZSAqKkNBTkRJREFURSoqICoqdG9DaGVjayoqIGRvZXMgbm90IGZ1bGZpbGwgdGhpcyB7QGxpbmsgREVGSU5FRCB9LiovXHJcblx0cHVibGljIHN0YXRpYyB0c0NoZWNrPENBTkRJREFURSA9IHVua25vd24+KHRvQ2hlY2s6IENBTkRJREFURSB8IHVuZGVmaW5lZCB8IG51bGwsIGhpbnQ6IHN0cmluZyA9IHVuZGVmaW5lZCwgaWQ6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCk6IENBTkRJREFURSB7XHJcblx0XHRjb25zdCByZXN1bHQgPSBERUZJTkVELmNoZWNrQWxnb3JpdGhtKHRvQ2hlY2spO1xyXG5cclxuXHRcdGlmIChyZXN1bHQgPT09IHRydWUpIHtcclxuXHRcdFx0cmV0dXJuIHRvQ2hlY2sgYXMgQ0FORElEQVRFO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHRocm93IG5ldyBEQkMuSW5mcmluZ2VtZW50KGAke2lkID8gYCgke2lkfSkgYCA6IFwiXCJ9JHtyZXN1bHQgYXMgc3RyaW5nfSR7aGludCA/IGAgXHUyNzI4ICR7aGludH0gXHUyNzI4YCA6IFwiXCJ9YCk7XHJcblx0XHR9XHJcblx0fVxyXG5cdC8qKiBDcmVhdGVzIHRoaXMge0BsaW5rIERFRklORUQgfS4gKi9cclxuXHRwdWJsaWMgY29uc3RydWN0b3IoKSB7XHJcblx0XHRzdXBlcigpO1xyXG5cdH1cclxufVxyXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7OztBQU1PLElBQU0sVUFBTixNQUFNLGlCQUFnQixJQUFJO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFoQyxPQUFjLGVBQWUsU0FBZ0M7QUFFNUQsUUFBSSxZQUFZLFVBQWEsWUFBWSxNQUFNO0FBQzlDLGFBQU8sZ0RBQWdELFlBQVksU0FBWSxjQUFjLE1BQU07QUFBQSxJQUNwRztBQUVBLFdBQU87QUFBQSxFQUNSO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFVQSxPQUFjLElBQ2IsT0FBMkIsUUFDM0IsT0FBMkIsUUFDM0IsTUFBMEIsUUFLakI7QUFDVCxXQUFPLElBQUk7QUFBQSxNQUNWLENBQ0MsT0FDQSxRQUNBLFlBQ0EsbUJBQ0k7QUFDSixlQUFPLFNBQVEsZUFBZSxLQUFLO0FBQUEsTUFDcEM7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNEO0FBQUEsRUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVUEsT0FBYyxLQUNiLE1BQ0EsT0FBMkIsUUFDM0IsT0FBMkIsUUFDM0IsTUFBMEIsUUFLSDtBQUN2QixXQUFPLElBQUk7QUFBQSxNQUNWLENBQUMsT0FBZSxRQUFnQixnQkFBd0I7QUFDdkQsZUFBTyxTQUFRLGVBQWUsS0FBSztBQUFBLE1BQ3BDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVBLE9BQWMsVUFDYixNQUNBLE9BQTJCLFFBQzNCLE9BQTJCLFFBQzNCLE1BQTBCLFFBQ3pCO0FBQ0QsV0FBTyxJQUFJLGFBQWEsQ0FBQyxJQUFJLFNBQVEsQ0FBQyxHQUFHLE1BQU0sS0FBSyxJQUFJO0FBQUEsRUFDekQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWFPLE1BQU0sU0FBYztBQUMxQixXQUFPLFNBQVEsZUFBZSxPQUFPO0FBQUEsRUFDdEM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVBLE9BQWMsUUFBNkIsU0FBdUMsT0FBZSxRQUFXLEtBQXlCLFFBQXNCO0FBQzFKLFVBQU0sU0FBUyxTQUFRLGVBQWUsT0FBTztBQUU3QyxRQUFJLFdBQVcsTUFBTTtBQUNwQixhQUFPO0FBQUEsSUFDUixPQUNLO0FBQ0osWUFBTSxJQUFJLElBQUksYUFBYSxHQUFHLEtBQUssSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLE1BQWdCLEdBQUcsT0FBTyxXQUFNLElBQUksWUFBTyxFQUFFLEVBQUU7QUFBQSxJQUNyRztBQUFBLEVBQ0Q7QUFBQTtBQUFBLEVBRU8sY0FBYztBQUNwQixVQUFNO0FBQUEsRUFDUDtBQUNEOyIsCiAgIm5hbWVzIjogW10KfQo=
