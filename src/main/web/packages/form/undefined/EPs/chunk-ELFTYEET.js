import { DBC } from "./chunk-WDRNTVZG.js";

// ../../node_modules/xdbc/src/DBC/INSTANCE.ts
var INSTANCE = class _INSTANCE extends DBC {
  /**
   * Creates this {@link INSTANCE } by setting the protected property {@link INSTANCE.reference } used by {@link INSTANCE.check }.
   *
   * @param reference See {@link INSTANCE.check }. */
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  constructor(reference) {
    super();
    this.reference = reference;
  }
  /**
   * Checks if the value **toCheck** is an instance of the specified **reference**.
   *
   * @param toCheck	The value that has to be an instance of the **reference** in order for this {@link DBC }
   * 					to be fulfilled.
   * @param reference	The {@link object } the one **toCheck** has to be an instance of.
   *
   * @returns TRUE if the value **toCheck** is is an instance of the *reference**, otherwise FALSE. */
  // biome-ignore lint/suspicious/noExplicitAny: In order to perform an "instanceof" check.
  static checkAlgorithm(toCheck, reference) {
    if (!(toCheck instanceof reference)) {
      return `Value has to be an instance of "${reference}" but is of type "${typeof toCheck}"`;
    }
    return true;
  }
  /**
   * A parameter-decorator factory using the {@link INSTANCE.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
   * by the tagged parameter.
   *
   * @param reference	See {@link INSTANCE.checkAlgorithm }.
   * @param path	See {@link DBC.decPrecondition }.
   * @param dbc	See {@link DBC.decPrecondition }.
   *
   * @returns See {@link DBC.decPrecondition }. */
  static PRE(reference, path = void 0, dbc = "WaXCode.DBC") {
    return DBC.decPrecondition(
      (value, target, methodName, parameterIndex) => {
        return _INSTANCE.checkAlgorithm(value, reference);
      },
      dbc,
      path,
    );
  }
  /**
   * A method-decorator factory using the {@link INSTANCE.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
   * by the tagged method's returnvalue.
   *
   * @param reference	See {@link INSTANCE.checkAlgorithm }.
   * @param path	See {@link DBC.Postcondition }.
   * @param dbc	See {@link DBC.decPostcondition }.
   *
   * @returns See {@link DBC.decPostcondition }. */
  static POST(reference, path = void 0, dbc = "WaXCode.DBC") {
    return DBC.decPostcondition(
      (value, target, propertyKey) => {
        return _INSTANCE.checkAlgorithm(value, reference);
      },
      dbc,
      path,
    );
  }
  /**
   * A field-decorator factory using the {@link INSTANCE.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
   * by the tagged method's returnvalue.
   *
   * @param reference	See {@link INSTANCE.checkAlgorithm }.
   * @param path	See {@link DBC.decInvariant }.
   * @param dbc	See {@link DBC.decInvariant }.
   *
   * @returns See {@link DBC.decInvariant }. */
  static INVARIANT(reference, path = void 0, dbc = "WaXCode.DBC") {
    return DBC.decInvariant([new _INSTANCE(reference)], path, dbc);
  }
  // #endregion Condition checking.
  // #region Referenced Condition checking.
  //
  // For usage in dynamic scenarios (like with AE-DBC).
  //
  /**
   * Invokes the {@link INSTANCE.checkAlgorithm } passing the value **toCheck** and the {@link INSTANCE.reference } .
   *
   * @param toCheck See {@link INSTANCE.checkAlgorithm }.
   *
   * @returns See {@link INSTANCE.checkAlgorithm}. */
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  check(toCheck) {
    return _INSTANCE.checkAlgorithm(toCheck, this.reference);
  }
  /**
   * Invokes the {@link INSTANCE.checkAlgorithm } passing the value **toCheck** and the {@link INSTANCE.reference } .
   *
   * @param toCheck 	See {@link INSTANCE.checkAlgorithm }.
   * @param reference	See {@link INSTANCE.checkAlgorithm }.
   * @param id		A {@link string } identifying this {@link INSTANCE } via the {@link DBC.Infringement }-Message.
   * @param hint		An optional {@link string } providing extra information in case of an infringement.
   *
   * @returns The **CANDIDATE** **toCheck** doesn't fulfill this {@link INSTANCE }.
   *
   * @throws A {@link DBC.Infringement } if the **CANDIDATE** **toCheck** does not fulfill this {@link DEFINED }. */
  static tsCheck(toCheck, reference, hint = void 0, id = void 0) {
    const result = _INSTANCE.checkAlgorithm(toCheck, reference);
    if (result === true) {
      return toCheck;
    } else {
      throw new DBC.Infringement(`${id ? `(${id}) ` : ""}${result} ${hint ? `< ${hint} >` : ""}`);
    }
  }
};

export { INSTANCE };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3hkYmMvc3JjL0RCQy9JTlNUQU5DRS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgREJDIH0gZnJvbSBcIi4uL0RCQ1wiO1xyXG4vKipcclxuICogQSB7QGxpbmsgREJDIH0gZGVmaW5pbmcgdGhhdCB0aGUgYW4ge0BsaW5rIG9iamVjdCB9cyBnb3R0YSBiZSBhbiBpbnN0YW5jZSBvZiBhIGNlcnRhaW4ge0BsaW5rIElOU1RBTkNFLnJlZmVyZW5jZSB9LlxyXG4gKlxyXG4gKiBAcmVtYXJrc1xyXG4gKiBNYWludGFpbmVyOiBTYWx2YXRvcmUgQ2FsbGFyaSAoWERCQ0BXYVhDb2RlLm5ldCkgKi9cclxuZXhwb3J0IGNsYXNzIElOU1RBTkNFIGV4dGVuZHMgREJDIHtcclxuXHQvKipcclxuXHQgKiBDaGVja3MgaWYgdGhlIHZhbHVlICoqdG9DaGVjayoqIGlzIGFuIGluc3RhbmNlIG9mIHRoZSBzcGVjaWZpZWQgKipyZWZlcmVuY2UqKi5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0b0NoZWNrXHRUaGUgdmFsdWUgdGhhdCBoYXMgdG8gYmUgYW4gaW5zdGFuY2Ugb2YgdGhlICoqcmVmZXJlbmNlKiogaW4gb3JkZXIgZm9yIHRoaXMge0BsaW5rIERCQyB9XHJcblx0ICogXHRcdFx0XHRcdHRvIGJlIGZ1bGZpbGxlZC5cclxuXHQgKiBAcGFyYW0gcmVmZXJlbmNlXHRUaGUge0BsaW5rIG9iamVjdCB9IHRoZSBvbmUgKip0b0NoZWNrKiogaGFzIHRvIGJlIGFuIGluc3RhbmNlIG9mLlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgVFJVRSBpZiB0aGUgdmFsdWUgKip0b0NoZWNrKiogaXMgaXMgYW4gaW5zdGFuY2Ugb2YgdGhlICpyZWZlcmVuY2UqKiwgb3RoZXJ3aXNlIEZBTFNFLiAqL1xyXG5cdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogSW4gb3JkZXIgdG8gcGVyZm9ybSBhbiBcImluc3RhbmNlb2ZcIiBjaGVjay5cclxuXHRwdWJsaWMgc3RhdGljIGNoZWNrQWxnb3JpdGhtKHRvQ2hlY2s6IGFueSwgcmVmZXJlbmNlOiBhbnkpOiBib29sZWFuIHwgc3RyaW5nIHtcclxuXHRcdGlmICghKHRvQ2hlY2sgaW5zdGFuY2VvZiByZWZlcmVuY2UpKSB7XHJcblx0XHRcdHJldHVybiBgVmFsdWUgaGFzIHRvIGJlIGFuIGluc3RhbmNlIG9mIFwiJHtyZWZlcmVuY2V9XCIgYnV0IGlzIG9mIHR5cGUgXCIke3R5cGVvZiB0b0NoZWNrfVwiYDtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdHJ1ZTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogQSBwYXJhbWV0ZXItZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxyXG5cdCAqIGJ5IHRoZSB0YWdnZWQgcGFyYW1ldGVyLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHJlZmVyZW5jZVx0U2VlIHtAbGluayBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cclxuXHQgKiBAcGFyYW0gZGJjXHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgUFJFKFxyXG5cdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBJbiBvcmRlciB0byBwZXJmb3JtIGFuIFwiaW5zdGFuY2VvZlwiIGNoZWNrLlxyXG5cdFx0cmVmZXJlbmNlOiBhbnksXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXHJcblx0KTogKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRtZXRob2ROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXHJcblx0XHRwYXJhbWV0ZXJJbmRleDogbnVtYmVyLFxyXG5cdCkgPT4gdm9pZCB7XHJcblx0XHRyZXR1cm4gREJDLmRlY1ByZWNvbmRpdGlvbihcclxuXHRcdFx0KFxyXG5cdFx0XHRcdHZhbHVlOiBvYmplY3QsXHJcblx0XHRcdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRcdFx0bWV0aG9kTmFtZTogc3RyaW5nLFxyXG5cdFx0XHRcdHBhcmFtZXRlckluZGV4OiBudW1iZXIsXHJcblx0XHRcdCkgPT4ge1xyXG5cdFx0XHRcdHJldHVybiBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSh2YWx1ZSwgcmVmZXJlbmNlKTtcclxuXHRcdFx0fSxcclxuXHRcdFx0ZGJjLFxyXG5cdFx0XHRwYXRoLFxyXG5cdFx0KTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogQSBtZXRob2QtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxyXG5cdCAqIGJ5IHRoZSB0YWdnZWQgbWV0aG9kJ3MgcmV0dXJudmFsdWUuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gcmVmZXJlbmNlXHRTZWUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIHBhdGhcdFNlZSB7QGxpbmsgREJDLlBvc3Rjb25kaXRpb24gfS5cclxuXHQgKiBAcGFyYW0gZGJjXHRTZWUge0BsaW5rIERCQy5kZWNQb3N0Y29uZGl0aW9uIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNQb3N0Y29uZGl0aW9uIH0uICovXHJcblx0cHVibGljIHN0YXRpYyBQT1NUKFxyXG5cdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBJbiBvcmRlciB0byBwZXJmb3JtIGFuIFwiaW5zdGFuY2VvZlwiIGNoZWNrLlxyXG5cdFx0cmVmZXJlbmNlOiBhbnksXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXHJcblx0KTogKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRwcm9wZXJ0eUtleTogc3RyaW5nLFxyXG5cdFx0ZGVzY3JpcHRvcjogUHJvcGVydHlEZXNjcmlwdG9yLFxyXG5cdCkgPT4gUHJvcGVydHlEZXNjcmlwdG9yIHtcclxuXHRcdHJldHVybiBEQkMuZGVjUG9zdGNvbmRpdGlvbihcclxuXHRcdFx0KHZhbHVlOiBvYmplY3QsIHRhcmdldDogb2JqZWN0LCBwcm9wZXJ0eUtleTogc3RyaW5nKSA9PiB7XHJcblx0XHRcdFx0cmV0dXJuIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtKHZhbHVlLCByZWZlcmVuY2UpO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRkYmMsXHJcblx0XHRcdHBhdGgsXHJcblx0XHQpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBBIGZpZWxkLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcclxuXHQgKiBieSB0aGUgdGFnZ2VkIG1ldGhvZCdzIHJldHVybnZhbHVlLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHJlZmVyZW5jZVx0U2VlIHtAbGluayBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cclxuXHQgKiBAcGFyYW0gZGJjXHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgSU5WQVJJQU5UKFxyXG5cdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBJbiBvcmRlciB0byBwZXJmb3JtIGFuIFwiaW5zdGFuY2VvZlwiIGNoZWNrLlxyXG5cdFx0cmVmZXJlbmNlOiBhbnksXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXHJcblx0KSB7XHJcblx0XHRyZXR1cm4gREJDLmRlY0ludmFyaWFudChbbmV3IElOU1RBTkNFKHJlZmVyZW5jZSldLCBwYXRoLCBkYmMpO1xyXG5cdH1cclxuXHQvLyAjZW5kcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvLyAjcmVnaW9uIFJlZmVyZW5jZWQgQ29uZGl0aW9uIGNoZWNraW5nLlxyXG5cdC8vXHJcblx0Ly8gRm9yIHVzYWdlIGluIGR5bmFtaWMgc2NlbmFyaW9zIChsaWtlIHdpdGggQUUtREJDKS5cclxuXHQvL1xyXG5cdC8qKlxyXG5cdCAqIEludm9rZXMgdGhlIHtAbGluayBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqIGFuZCB0aGUge0BsaW5rIElOU1RBTkNFLnJlZmVyZW5jZSB9IC5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0b0NoZWNrIFNlZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFNlZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG19LiAqL1xyXG5cdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxyXG5cdHB1YmxpYyBjaGVjayh0b0NoZWNrOiBhbnkpIHtcclxuXHRcdHJldHVybiBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSh0b0NoZWNrLCB0aGlzLnJlZmVyZW5jZSk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEludm9rZXMgdGhlIHtAbGluayBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqIGFuZCB0aGUge0BsaW5rIElOU1RBTkNFLnJlZmVyZW5jZSB9IC5cclxuXHQgKiBcclxuXHQgKiBAcGFyYW0gdG9DaGVjayBcdFNlZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gcmVmZXJlbmNlXHRTZWUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIGlkXHRcdEEge0BsaW5rIHN0cmluZyB9IGlkZW50aWZ5aW5nIHRoaXMge0BsaW5rIElOU1RBTkNFIH0gdmlhIHRoZSB7QGxpbmsgREJDLkluZnJpbmdlbWVudCB9LU1lc3NhZ2UuXHJcblx0ICogQHBhcmFtIGhpbnRcdFx0QW4gb3B0aW9uYWwge0BsaW5rIHN0cmluZyB9IHByb3ZpZGluZyBleHRyYSBpbmZvcm1hdGlvbiBpbiBjYXNlIG9mIGFuIGluZnJpbmdlbWVudC5cclxuXHQgKiBcclxuXHQgKiBAcmV0dXJucyBUaGUgKipDQU5ESURBVEUqKiAqKnRvQ2hlY2sqKiBkb2Vzbid0IGZ1bGZpbGwgdGhpcyB7QGxpbmsgSU5TVEFOQ0UgfS5cclxuXHQgKiBcclxuXHQgKiBAdGhyb3dzIEEge0BsaW5rIERCQy5JbmZyaW5nZW1lbnQgfSBpZiB0aGUgKipDQU5ESURBVEUqKiAqKnRvQ2hlY2sqKiBkb2VzIG5vdCBmdWxmaWxsIHRoaXMge0BsaW5rIERFRklORUQgfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIHRzQ2hlY2s8Q0FORElEQVRFID0gdW5rbm93bj4odG9DaGVjazogYW55LCByZWZlcmVuY2U6IGFueSwgaGludDogc3RyaW5nID0gdW5kZWZpbmVkLCBpZDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKTogQ0FORElEQVRFIHtcclxuXHRcdGNvbnN0IHJlc3VsdCA9IElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtKHRvQ2hlY2ssIHJlZmVyZW5jZSk7XHJcblxyXG5cdFx0aWYgKHJlc3VsdCA9PT0gdHJ1ZSkge1xyXG5cdFx0XHRyZXR1cm4gdG9DaGVjaztcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHR0aHJvdyBuZXcgREJDLkluZnJpbmdlbWVudChgJHtpZCA/IGAoJHtpZH0pIGAgOiBcIlwifSR7cmVzdWx0IGFzIHN0cmluZ30gJHtoaW50ID8gYDwgJHtoaW50fSA+YCA6IFwiXCJ9YCk7XHJcblx0XHR9XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIENyZWF0ZXMgdGhpcyB7QGxpbmsgSU5TVEFOQ0UgfSBieSBzZXR0aW5nIHRoZSBwcm90ZWN0ZWQgcHJvcGVydHkge0BsaW5rIElOU1RBTkNFLnJlZmVyZW5jZSB9IHVzZWQgYnkge0BsaW5rIElOU1RBTkNFLmNoZWNrIH0uXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gcmVmZXJlbmNlIFNlZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2sgfS4gKi9cclxuXHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cclxuXHRwdWJsaWMgY29uc3RydWN0b3IocHJvdGVjdGVkIHJlZmVyZW5jZTogYW55KSB7XHJcblx0XHRzdXBlcigpO1xyXG5cdH1cclxufVxyXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7OztBQU1PLElBQU0sV0FBTixNQUFNLGtCQUFpQixJQUFJO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBc0kxQixZQUFzQixXQUFnQjtBQUM1QyxVQUFNO0FBRHNCO0FBQUEsRUFFN0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQTlIQSxPQUFjLGVBQWUsU0FBYyxXQUFrQztBQUM1RSxRQUFJLEVBQUUsbUJBQW1CLFlBQVk7QUFDcEMsYUFBTyxtQ0FBbUMsU0FBUyxxQkFBcUIsT0FBTyxPQUFPO0FBQUEsSUFDdkY7QUFFQSxXQUFPO0FBQUEsRUFDUjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVUEsT0FBYyxJQUViLFdBQ0EsT0FBMkIsUUFDM0IsTUFBTSxlQUtHO0FBQ1QsV0FBTyxJQUFJO0FBQUEsTUFDVixDQUNDLE9BQ0EsUUFDQSxZQUNBLG1CQUNJO0FBQ0osZUFBTyxVQUFTLGVBQWUsT0FBTyxTQUFTO0FBQUEsTUFDaEQ7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Q7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFVQSxPQUFjLEtBRWIsV0FDQSxPQUEyQixRQUMzQixNQUFNLGVBS2lCO0FBQ3ZCLFdBQU8sSUFBSTtBQUFBLE1BQ1YsQ0FBQyxPQUFlLFFBQWdCLGdCQUF3QjtBQUN2RCxlQUFPLFVBQVMsZUFBZSxPQUFPLFNBQVM7QUFBQSxNQUNoRDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVBLE9BQWMsVUFFYixXQUNBLE9BQTJCLFFBQzNCLE1BQU0sZUFDTDtBQUNELFdBQU8sSUFBSSxhQUFhLENBQUMsSUFBSSxVQUFTLFNBQVMsQ0FBQyxHQUFHLE1BQU0sR0FBRztBQUFBLEVBQzdEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFhTyxNQUFNLFNBQWM7QUFDMUIsV0FBTyxVQUFTLGVBQWUsU0FBUyxLQUFLLFNBQVM7QUFBQSxFQUN2RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVlBLE9BQWMsUUFBNkIsU0FBYyxXQUFnQixPQUFlLFFBQVcsS0FBeUIsUUFBc0I7QUFDakosVUFBTSxTQUFTLFVBQVMsZUFBZSxTQUFTLFNBQVM7QUFFekQsUUFBSSxXQUFXLE1BQU07QUFDcEIsYUFBTztBQUFBLElBQ1IsT0FDSztBQUNKLFlBQU0sSUFBSSxJQUFJLGFBQWEsR0FBRyxLQUFLLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxNQUFnQixJQUFJLE9BQU8sS0FBSyxJQUFJLE9BQU8sRUFBRSxFQUFFO0FBQUEsSUFDckc7QUFBQSxFQUNEO0FBU0Q7IiwKICAibmFtZXMiOiBbXQp9Cg==
