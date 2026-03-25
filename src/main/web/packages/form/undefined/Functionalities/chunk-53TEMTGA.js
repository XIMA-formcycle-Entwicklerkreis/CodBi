import { DBC } from "./chunk-LFRFVRJV.js";

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
   * @returns TRUE if the value **toCheck** is is an instance of the *reference**, **undefined** or **null**, otherwise FALSE. */
  // biome-ignore lint/suspicious/noExplicitAny: In order to perform an "instanceof" check.
  static checkAlgorithm(toCheck, ...references) {
    if (toCheck === null || toCheck === void 0) {
      return true;
    }
    for (const ref of references) {
      if (toCheck instanceof ref) {
        return true;
      }
    }
    return `Value has to be an instance of "${references.map((ref) => ref.name || ref).join(", ")}" but is of type "${typeof toCheck}"`;
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
  static PRE(reference, path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decPrecondition(
      (value, target, methodName, parameterIndex) => {
        return Array.isArray(reference)
          ? _INSTANCE.checkAlgorithm(value, ...reference)
          : _INSTANCE.checkAlgorithm(value, reference);
      },
      dbc,
      path,
      hint,
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
  static POST(reference, path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decPostcondition(
      (value, target, propertyKey) => {
        return Array.isArray(reference)
          ? _INSTANCE.checkAlgorithm(value, ...reference)
          : _INSTANCE.checkAlgorithm(value, reference);
      },
      dbc,
      path,
      hint,
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
  static INVARIANT(reference, path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decInvariant([new _INSTANCE(reference)], path, dbc, hint);
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
    return Array.isArray(this.reference)
      ? _INSTANCE.checkAlgorithm(toCheck, ...this.reference)
      : _INSTANCE.checkAlgorithm(toCheck, this.reference);
  }
  /**
   * Type-safe check that validates if a value is an instance of a specified reference.
   *
   * @param toCheck 	The value to check for instance validity.
   * @param reference	The {@link object } the one **toCheck** has to be an instance of.
   * @param hint		An optional {@link string } providing extra information in case of an infringement.
   * @param id		A {@link string } identifying this {@link INSTANCE } via the {@link DBC.Infringement }-Message.
   *
   * @returns The **CANDIDATE** **toCheck** if it fulfills this {@link INSTANCE }.
   *
   * @throws A {@link DBC.Infringement } if the **CANDIDATE** **toCheck** does not fulfill this {@link INSTANCE }. */
  static tsCheck(toCheck, reference, hint = void 0, id = void 0) {
    return _INSTANCE.tsCheckMulti(toCheck, [reference], hint, id);
  }
  /**
   * Invokes the {@link INSTANCE.checkAlgorithm } passing the value **toCheck** and the {@link INSTANCE.reference } .
   *
   * @param toCheck 	See {@link INSTANCE.checkAlgorithm }.
   * @param reference	See {@link INSTANCE.checkAlgorithm }.
   * @param hint		An optional {@link string } providing extra information in case of an infringement.
   * @param id		A {@link string } identifying this {@link INSTANCE } via the {@link DBC.Infringement }-Message.
   *
   * @returns The **CANDIDATE** **toCheck** doesn't fulfill this {@link INSTANCE }.
   *
   * @throws A {@link DBC.Infringement } if the **CANDIDATE** **toCheck** does not fulfill this {@link DEFINED }. */
  static tsCheckMulti(toCheck, references, hint = void 0, id = void 0) {
    const result = _INSTANCE.checkAlgorithm(toCheck, ...references);
    if (result === true) {
      return toCheck;
    } else {
      throw new DBC.Infringement(`${id ? `(${id}) ` : ""}${result} ${hint ? `\u2728 ${hint} \u2728` : ""}`);
    }
  }
};

export { INSTANCE };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3hkYmMvc3JjL0RCQy9JTlNUQU5DRS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgREJDIH0gZnJvbSBcIi4uL0RCQ1wiO1xyXG4vKipcclxuICogQSB7QGxpbmsgREJDIH0gZGVmaW5pbmcgdGhhdCB0aGUgYW4ge0BsaW5rIG9iamVjdCB9cyBnb3R0YSBiZSBhbiBpbnN0YW5jZSBvZiBhIGNlcnRhaW4ge0BsaW5rIElOU1RBTkNFLnJlZmVyZW5jZSB9LlxyXG4gKlxyXG4gKiBAcmVtYXJrc1xyXG4gKiBNYWludGFpbmVyOiBTYWx2YXRvcmUgQ2FsbGFyaSAoWERCQ0BXYVhDb2RlLm5ldCkgKi9cclxuZXhwb3J0IGNsYXNzIElOU1RBTkNFIGV4dGVuZHMgREJDIHtcclxuXHQvKipcclxuXHQgKiBDaGVja3MgaWYgdGhlIHZhbHVlICoqdG9DaGVjayoqIGlzIGFuIGluc3RhbmNlIG9mIHRoZSBzcGVjaWZpZWQgKipyZWZlcmVuY2UqKi5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0b0NoZWNrXHRUaGUgdmFsdWUgdGhhdCBoYXMgdG8gYmUgYW4gaW5zdGFuY2Ugb2YgdGhlICoqcmVmZXJlbmNlKiogaW4gb3JkZXIgZm9yIHRoaXMge0BsaW5rIERCQyB9XHJcblx0ICogXHRcdFx0XHRcdHRvIGJlIGZ1bGZpbGxlZC5cclxuXHQgKiBAcGFyYW0gcmVmZXJlbmNlXHRUaGUge0BsaW5rIG9iamVjdCB9IHRoZSBvbmUgKip0b0NoZWNrKiogaGFzIHRvIGJlIGFuIGluc3RhbmNlIG9mLlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgVFJVRSBpZiB0aGUgdmFsdWUgKip0b0NoZWNrKiogaXMgaXMgYW4gaW5zdGFuY2Ugb2YgdGhlICpyZWZlcmVuY2UqKiwgKip1bmRlZmluZWQqKiBvciAqKm51bGwqKiwgb3RoZXJ3aXNlIEZBTFNFLiAqL1xyXG5cdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogSW4gb3JkZXIgdG8gcGVyZm9ybSBhbiBcImluc3RhbmNlb2ZcIiBjaGVjay5cclxuXHRwdWJsaWMgc3RhdGljIGNoZWNrQWxnb3JpdGhtKHRvQ2hlY2s6IGFueSwgLi4ucmVmZXJlbmNlczogYW55W10pOiBib29sZWFuIHwgc3RyaW5nIHtcclxuXHRcdGlmICh0b0NoZWNrID09PSBudWxsIHx8IHRvQ2hlY2sgPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH1cclxuXHJcblx0XHRmb3IgKGNvbnN0IHJlZiBvZiByZWZlcmVuY2VzKSB7XHJcblx0XHRcdGlmICh0b0NoZWNrIGluc3RhbmNlb2YgcmVmKSB7XHJcblx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gYFZhbHVlIGhhcyB0byBiZSBhbiBpbnN0YW5jZSBvZiBcIiR7cmVmZXJlbmNlcy5tYXAocmVmID0+IHJlZi5uYW1lIHx8IHJlZikuam9pbignLCAnKX1cIiBidXQgaXMgb2YgdHlwZSBcIiR7dHlwZW9mIHRvQ2hlY2t9XCJgO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBBIHBhcmFtZXRlci1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXHJcblx0ICogYnkgdGhlIHRhZ2dlZCBwYXJhbWV0ZXIuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gcmVmZXJlbmNlXHRTZWUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIHBhdGhcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqIEBwYXJhbSBkYmNcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uICovXHJcblx0cHVibGljIHN0YXRpYyBQUkUoXHJcblx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IEluIG9yZGVyIHRvIHBlcmZvcm0gYW4gXCJpbnN0YW5jZW9mXCIgY2hlY2suXHJcblx0XHRyZWZlcmVuY2U6IGFueSB8IGFueVtdLFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0aGludDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0KTogKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRtZXRob2ROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXHJcblx0XHRwYXJhbWV0ZXJJbmRleDogbnVtYmVyLFxyXG5cdCkgPT4gdm9pZCB7XHJcblx0XHRyZXR1cm4gREJDLmRlY1ByZWNvbmRpdGlvbihcclxuXHRcdFx0KFxyXG5cdFx0XHRcdHZhbHVlOiBvYmplY3QsXHJcblx0XHRcdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRcdFx0bWV0aG9kTmFtZTogc3RyaW5nLFxyXG5cdFx0XHRcdHBhcmFtZXRlckluZGV4OiBudW1iZXIsXHJcblx0XHRcdCkgPT4ge1xyXG5cdFx0XHRcdHJldHVybiBBcnJheS5pc0FycmF5KHJlZmVyZW5jZSkgPyBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSh2YWx1ZSwgLi4ucmVmZXJlbmNlKSA6IElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtKHZhbHVlLCByZWZlcmVuY2UpO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRkYmMsXHJcblx0XHRcdHBhdGgsXHJcblx0XHRcdGhpbnRcclxuXHRcdCk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcclxuXHQgKiBieSB0aGUgdGFnZ2VkIG1ldGhvZCdzIHJldHVybnZhbHVlLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHJlZmVyZW5jZVx0U2VlIHtAbGluayBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRTZWUge0BsaW5rIERCQy5Qb3N0Y29uZGl0aW9uIH0uXHJcblx0ICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgUE9TVChcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogSW4gb3JkZXIgdG8gcGVyZm9ybSBhbiBcImluc3RhbmNlb2ZcIiBjaGVjay5cclxuXHRcdHJlZmVyZW5jZTogYW55IHwgYW55W10sXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRoaW50OiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmM6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHQpOiAoXHJcblx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdHByb3BlcnR5S2V5OiBzdHJpbmcsXHJcblx0XHRkZXNjcmlwdG9yOiBQcm9wZXJ0eURlc2NyaXB0b3IsXHJcblx0KSA9PiBQcm9wZXJ0eURlc2NyaXB0b3Ige1xyXG5cdFx0cmV0dXJuIERCQy5kZWNQb3N0Y29uZGl0aW9uKFxyXG5cdFx0XHQodmFsdWU6IG9iamVjdCwgdGFyZ2V0OiBvYmplY3QsIHByb3BlcnR5S2V5OiBzdHJpbmcpID0+IHtcclxuXHRcdFx0XHRyZXR1cm4gQXJyYXkuaXNBcnJheShyZWZlcmVuY2UpID8gSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0odmFsdWUsIC4uLnJlZmVyZW5jZSkgOiBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSh2YWx1ZSwgcmVmZXJlbmNlKTtcclxuXHRcdFx0fSxcclxuXHRcdFx0ZGJjLFxyXG5cdFx0XHRwYXRoLFxyXG5cdFx0XHRoaW50XHJcblx0XHQpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBBIGZpZWxkLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcclxuXHQgKiBieSB0aGUgdGFnZ2VkIG1ldGhvZCdzIHJldHVybnZhbHVlLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHJlZmVyZW5jZVx0U2VlIHtAbGluayBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cclxuXHQgKiBAcGFyYW0gZGJjXHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgSU5WQVJJQU5UKFxyXG5cdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiBJbiBvcmRlciB0byBwZXJmb3JtIGFuIFwiaW5zdGFuY2VvZlwiIGNoZWNrLlxyXG5cdFx0cmVmZXJlbmNlOiBhbnkgfCBhbnlbXSxcclxuXHRcdHBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGhpbnQ6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGRiYzogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdCkge1xyXG5cdFx0cmV0dXJuIERCQy5kZWNJbnZhcmlhbnQoW25ldyBJTlNUQU5DRShyZWZlcmVuY2UpXSwgcGF0aCwgZGJjLCBoaW50KTtcclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXHJcblx0Ly8gI3JlZ2lvbiBSZWZlcmVuY2VkIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvL1xyXG5cdC8vIEZvciB1c2FnZSBpbiBkeW5hbWljIHNjZW5hcmlvcyAobGlrZSB3aXRoIEFFLURCQykuXHJcblx0Ly9cclxuXHQvKipcclxuXHQgKiBJbnZva2VzIHRoZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfSBwYXNzaW5nIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBhbmQgdGhlIHtAbGluayBJTlNUQU5DRS5yZWZlcmVuY2UgfSAuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdG9DaGVjayBTZWUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtfS4gKi9cclxuXHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cclxuXHRwdWJsaWMgY2hlY2sodG9DaGVjazogYW55KSB7XHJcblx0XHRyZXR1cm4gQXJyYXkuaXNBcnJheSh0aGlzLnJlZmVyZW5jZSkgPyBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSh0b0NoZWNrLCAuLi50aGlzLnJlZmVyZW5jZSkgOiBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSh0b0NoZWNrLCB0aGlzLnJlZmVyZW5jZSk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIFR5cGUtc2FmZSBjaGVjayB0aGF0IHZhbGlkYXRlcyBpZiBhIHZhbHVlIGlzIGFuIGluc3RhbmNlIG9mIGEgc3BlY2lmaWVkIHJlZmVyZW5jZS5cclxuXHQgKiBcclxuXHQgKiBAcGFyYW0gdG9DaGVjayBcdFRoZSB2YWx1ZSB0byBjaGVjayBmb3IgaW5zdGFuY2UgdmFsaWRpdHkuXHJcblx0ICogQHBhcmFtIHJlZmVyZW5jZVx0VGhlIHtAbGluayBvYmplY3QgfSB0aGUgb25lICoqdG9DaGVjayoqIGhhcyB0byBiZSBhbiBpbnN0YW5jZSBvZi5cclxuXHQgKiBAcGFyYW0gaGludFx0XHRBbiBvcHRpb25hbCB7QGxpbmsgc3RyaW5nIH0gcHJvdmlkaW5nIGV4dHJhIGluZm9ybWF0aW9uIGluIGNhc2Ugb2YgYW4gaW5mcmluZ2VtZW50LlxyXG5cdCAqIEBwYXJhbSBpZFx0XHRBIHtAbGluayBzdHJpbmcgfSBpZGVudGlmeWluZyB0aGlzIHtAbGluayBJTlNUQU5DRSB9IHZpYSB0aGUge0BsaW5rIERCQy5JbmZyaW5nZW1lbnQgfS1NZXNzYWdlLlxyXG5cdCAqIFxyXG5cdCAqIEByZXR1cm5zIFRoZSAqKkNBTkRJREFURSoqICoqdG9DaGVjayoqIGlmIGl0IGZ1bGZpbGxzIHRoaXMge0BsaW5rIElOU1RBTkNFIH0uXHJcblx0ICogXHJcblx0ICogQHRocm93cyBBIHtAbGluayBEQkMuSW5mcmluZ2VtZW50IH0gaWYgdGhlICoqQ0FORElEQVRFKiogKip0b0NoZWNrKiogZG9lcyBub3QgZnVsZmlsbCB0aGlzIHtAbGluayBJTlNUQU5DRSB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgdHNDaGVjazxDQU5ESURBVEUgPSB1bmtub3duPih0b0NoZWNrOiBhbnksIHJlZmVyZW5jZTogYW55LCBoaW50OiBzdHJpbmcgPSB1bmRlZmluZWQsIGlkOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQpOiBDQU5ESURBVEUge1xyXG5cdFx0cmV0dXJuIElOU1RBTkNFLnRzQ2hlY2tNdWx0aTxDQU5ESURBVEU+KHRvQ2hlY2ssIFtyZWZlcmVuY2VdLCBoaW50LCBpZCk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEludm9rZXMgdGhlIHtAbGluayBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqIGFuZCB0aGUge0BsaW5rIElOU1RBTkNFLnJlZmVyZW5jZSB9IC5cclxuXHQgKiBcclxuXHQgKiBAcGFyYW0gdG9DaGVjayBcdFNlZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gcmVmZXJlbmNlXHRTZWUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIGhpbnRcdFx0QW4gb3B0aW9uYWwge0BsaW5rIHN0cmluZyB9IHByb3ZpZGluZyBleHRyYSBpbmZvcm1hdGlvbiBpbiBjYXNlIG9mIGFuIGluZnJpbmdlbWVudC5cclxuXHQgKiBAcGFyYW0gaWRcdFx0QSB7QGxpbmsgc3RyaW5nIH0gaWRlbnRpZnlpbmcgdGhpcyB7QGxpbmsgSU5TVEFOQ0UgfSB2aWEgdGhlIHtAbGluayBEQkMuSW5mcmluZ2VtZW50IH0tTWVzc2FnZS5cclxuXHQgKiBcclxuXHQgKiBAcmV0dXJucyBUaGUgKipDQU5ESURBVEUqKiAqKnRvQ2hlY2sqKiBkb2Vzbid0IGZ1bGZpbGwgdGhpcyB7QGxpbmsgSU5TVEFOQ0UgfS5cclxuXHQgKiBcclxuXHQgKiBAdGhyb3dzIEEge0BsaW5rIERCQy5JbmZyaW5nZW1lbnQgfSBpZiB0aGUgKipDQU5ESURBVEUqKiAqKnRvQ2hlY2sqKiBkb2VzIG5vdCBmdWxmaWxsIHRoaXMge0BsaW5rIERFRklORUQgfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIHRzQ2hlY2tNdWx0aTxDQU5ESURBVEUgPSB1bmtub3duPih0b0NoZWNrOiBhbnksIHJlZmVyZW5jZXM6IGFueVtdLCBoaW50OiBzdHJpbmcgPSB1bmRlZmluZWQsIGlkOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQpOiBDQU5ESURBVEUge1xyXG5cdFx0Y29uc3QgcmVzdWx0ID0gSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0odG9DaGVjaywgLi4ucmVmZXJlbmNlcyk7XHJcblxyXG5cdFx0aWYgKHJlc3VsdCA9PT0gdHJ1ZSkge1xyXG5cdFx0XHRyZXR1cm4gdG9DaGVjaztcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHR0aHJvdyBuZXcgREJDLkluZnJpbmdlbWVudChgJHtpZCA/IGAoJHtpZH0pIGAgOiBcIlwifSR7cmVzdWx0IGFzIHN0cmluZ30gJHtoaW50ID8gYFx1MjcyOCAke2hpbnR9IFx1MjcyOGAgOiBcIlwifWApO1xyXG5cdFx0fVxyXG5cdH1cclxuXHQvKipcclxuXHQgKiBDcmVhdGVzIHRoaXMge0BsaW5rIElOU1RBTkNFIH0gYnkgc2V0dGluZyB0aGUgcHJvdGVjdGVkIHByb3BlcnR5IHtAbGluayBJTlNUQU5DRS5yZWZlcmVuY2UgfSB1c2VkIGJ5IHtAbGluayBJTlNUQU5DRS5jaGVjayB9LlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHJlZmVyZW5jZSBTZWUge0BsaW5rIElOU1RBTkNFLmNoZWNrIH0uICovXHJcblx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XHJcblx0cHVibGljIGNvbnN0cnVjdG9yKHByb3RlY3RlZCByZWZlcmVuY2U6IGFueSkge1xyXG5cdFx0c3VwZXIoKTtcclxuXHR9XHJcbn1cclxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7QUFNTyxJQUFNLFdBQU4sTUFBTSxrQkFBaUIsSUFBSTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQStKMUIsWUFBc0IsV0FBZ0I7QUFDNUMsVUFBTTtBQURzQjtBQUFBLEVBRTdCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUF2SkEsT0FBYyxlQUFlLFlBQWlCLFlBQXFDO0FBQ2xGLFFBQUksWUFBWSxRQUFRLFlBQVksUUFBVztBQUM5QyxhQUFPO0FBQUEsSUFDUjtBQUVBLGVBQVcsT0FBTyxZQUFZO0FBQzdCLFVBQUksbUJBQW1CLEtBQUs7QUFDM0IsZUFBTztBQUFBLE1BQ1I7QUFBQSxJQUNEO0FB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
