import {
  DBC
} from "./chunk-O7G7SG2W.js";

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
      path
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
      path
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
   * 
   * @returns The **CANDIDATE** **toCheck** doesn't fulfill this {@link INSTANCE }.
   * 
   * @throws A {@link DBC.Infringement } if the **CANDIDATE** **toCheck** does not fulfill this {@link DEFINED }. */
  static tsCheck(toCheck, reference, id = void 0) {
    const result = _INSTANCE.checkAlgorithm(toCheck, reference);
    if (result === true) {
      return toCheck;
    } else {
      throw new DBC.Infringement(`${id ? `(${id}) ` : ""}${result}`);
    }
  }
};

export {
  INSTANCE
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL25vZGVfbW9kdWxlcy94ZGJjL3NyYy9EQkMvSU5TVEFOQ0UudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IERCQyB9IGZyb20gXCIuLi9EQkNcIjtcclxuLyoqXHJcbiAqIEEge0BsaW5rIERCQyB9IGRlZmluaW5nIHRoYXQgdGhlIGFuIHtAbGluayBvYmplY3QgfXMgZ290dGEgYmUgYW4gaW5zdGFuY2Ugb2YgYSBjZXJ0YWluIHtAbGluayBJTlNUQU5DRS5yZWZlcmVuY2UgfS5cclxuICpcclxuICogQHJlbWFya3NcclxuICogTWFpbnRhaW5lcjogU2FsdmF0b3JlIENhbGxhcmkgKFhEQkNAV2FYQ29kZS5uZXQpICovXHJcbmV4cG9ydCBjbGFzcyBJTlNUQU5DRSBleHRlbmRzIERCQyB7XHJcblx0LyoqXHJcblx0ICogQ2hlY2tzIGlmIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBpcyBhbiBpbnN0YW5jZSBvZiB0aGUgc3BlY2lmaWVkICoqcmVmZXJlbmNlKiouXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdG9DaGVja1x0VGhlIHZhbHVlIHRoYXQgaGFzIHRvIGJlIGFuIGluc3RhbmNlIG9mIHRoZSAqKnJlZmVyZW5jZSoqIGluIG9yZGVyIGZvciB0aGlzIHtAbGluayBEQkMgfVxyXG5cdCAqIFx0XHRcdFx0XHR0byBiZSBmdWxmaWxsZWQuXHJcblx0ICogQHBhcmFtIHJlZmVyZW5jZVx0VGhlIHtAbGluayBvYmplY3QgfSB0aGUgb25lICoqdG9DaGVjayoqIGhhcyB0byBiZSBhbiBpbnN0YW5jZSBvZi5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFRSVUUgaWYgdGhlIHZhbHVlICoqdG9DaGVjayoqIGlzIGlzIGFuIGluc3RhbmNlIG9mIHRoZSAqcmVmZXJlbmNlKiosIG90aGVyd2lzZSBGQUxTRS4gKi9cclxuXHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IEluIG9yZGVyIHRvIHBlcmZvcm0gYW4gXCJpbnN0YW5jZW9mXCIgY2hlY2suXHJcblx0cHVibGljIHN0YXRpYyBjaGVja0FsZ29yaXRobSh0b0NoZWNrOiBhbnksIHJlZmVyZW5jZTogYW55KTogYm9vbGVhbiB8IHN0cmluZyB7XHJcblx0XHRpZiAoISh0b0NoZWNrIGluc3RhbmNlb2YgcmVmZXJlbmNlKSkge1xyXG5cdFx0XHRyZXR1cm4gYFZhbHVlIGhhcyB0byBiZSBhbiBpbnN0YW5jZSBvZiBcIiR7cmVmZXJlbmNlfVwiIGJ1dCBpcyBvZiB0eXBlIFwiJHt0eXBlb2YgdG9DaGVja31cImA7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHRydWU7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgcGFyYW1ldGVyLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcclxuXHQgKiBieSB0aGUgdGFnZ2VkIHBhcmFtZXRlci5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSByZWZlcmVuY2VcdFNlZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gcGF0aFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXHJcblx0ICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIFBSRShcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogSW4gb3JkZXIgdG8gcGVyZm9ybSBhbiBcImluc3RhbmNlb2ZcIiBjaGVjay5cclxuXHRcdHJlZmVyZW5jZTogYW55LFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjID0gXCJXYVhDb2RlLkRCQ1wiLFxyXG5cdCk6IChcclxuXHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0bWV0aG9kTmFtZTogc3RyaW5nIHwgc3ltYm9sLFxyXG5cdFx0cGFyYW1ldGVySW5kZXg6IG51bWJlcixcclxuXHQpID0+IHZvaWQge1xyXG5cdFx0cmV0dXJuIERCQy5kZWNQcmVjb25kaXRpb24oXHJcblx0XHRcdChcclxuXHRcdFx0XHR2YWx1ZTogb2JqZWN0LFxyXG5cdFx0XHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0XHRcdG1ldGhvZE5hbWU6IHN0cmluZyxcclxuXHRcdFx0XHRwYXJhbWV0ZXJJbmRleDogbnVtYmVyLFxyXG5cdFx0XHQpID0+IHtcclxuXHRcdFx0XHRyZXR1cm4gSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0odmFsdWUsIHJlZmVyZW5jZSk7XHJcblx0XHRcdH0sXHJcblx0XHRcdGRiYyxcclxuXHRcdFx0cGF0aCxcclxuXHRcdCk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcclxuXHQgKiBieSB0aGUgdGFnZ2VkIG1ldGhvZCdzIHJldHVybnZhbHVlLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHJlZmVyZW5jZVx0U2VlIHtAbGluayBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRTZWUge0BsaW5rIERCQy5Qb3N0Y29uZGl0aW9uIH0uXHJcblx0ICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgUE9TVChcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogSW4gb3JkZXIgdG8gcGVyZm9ybSBhbiBcImluc3RhbmNlb2ZcIiBjaGVjay5cclxuXHRcdHJlZmVyZW5jZTogYW55LFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjID0gXCJXYVhDb2RlLkRCQ1wiLFxyXG5cdCk6IChcclxuXHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0cHJvcGVydHlLZXk6IHN0cmluZyxcclxuXHRcdGRlc2NyaXB0b3I6IFByb3BlcnR5RGVzY3JpcHRvcixcclxuXHQpID0+IFByb3BlcnR5RGVzY3JpcHRvciB7XHJcblx0XHRyZXR1cm4gREJDLmRlY1Bvc3Rjb25kaXRpb24oXHJcblx0XHRcdCh2YWx1ZTogb2JqZWN0LCB0YXJnZXQ6IG9iamVjdCwgcHJvcGVydHlLZXk6IHN0cmluZykgPT4ge1xyXG5cdFx0XHRcdHJldHVybiBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSh2YWx1ZSwgcmVmZXJlbmNlKTtcclxuXHRcdFx0fSxcclxuXHRcdFx0ZGJjLFxyXG5cdFx0XHRwYXRoLFxyXG5cdFx0KTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogQSBmaWVsZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXHJcblx0ICogYnkgdGhlIHRhZ2dlZCBtZXRob2QncyByZXR1cm52YWx1ZS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSByZWZlcmVuY2VcdFNlZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gcGF0aFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXHJcblx0ICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIElOVkFSSUFOVChcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogSW4gb3JkZXIgdG8gcGVyZm9ybSBhbiBcImluc3RhbmNlb2ZcIiBjaGVjay5cclxuXHRcdHJlZmVyZW5jZTogYW55LFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjID0gXCJXYVhDb2RlLkRCQ1wiLFxyXG5cdCkge1xyXG5cdFx0cmV0dXJuIERCQy5kZWNJbnZhcmlhbnQoW25ldyBJTlNUQU5DRShyZWZlcmVuY2UpXSwgcGF0aCwgZGJjKTtcclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXHJcblx0Ly8gI3JlZ2lvbiBSZWZlcmVuY2VkIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvL1xyXG5cdC8vIEZvciB1c2FnZSBpbiBkeW5hbWljIHNjZW5hcmlvcyAobGlrZSB3aXRoIEFFLURCQykuXHJcblx0Ly9cclxuXHQvKipcclxuXHQgKiBJbnZva2VzIHRoZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfSBwYXNzaW5nIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBhbmQgdGhlIHtAbGluayBJTlNUQU5DRS5yZWZlcmVuY2UgfSAuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdG9DaGVjayBTZWUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtfS4gKi9cclxuXHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cclxuXHRwdWJsaWMgY2hlY2sodG9DaGVjazogYW55KSB7XHJcblx0XHRyZXR1cm4gSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0odG9DaGVjaywgdGhpcy5yZWZlcmVuY2UpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBJbnZva2VzIHRoZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2tBbGdvcml0aG0gfSBwYXNzaW5nIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBhbmQgdGhlIHtAbGluayBJTlNUQU5DRS5yZWZlcmVuY2UgfSAuXHJcblx0ICogXHJcblx0ICogQHBhcmFtIHRvQ2hlY2sgXHRTZWUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIHJlZmVyZW5jZVx0U2VlIHtAbGluayBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBpZFx0XHRBIHtAbGluayBzdHJpbmcgfSBpZGVudGlmeWluZyB0aGlzIHtAbGluayBJTlNUQU5DRSB9IHZpYSB0aGUge0BsaW5rIERCQy5JbmZyaW5nZW1lbnQgfS1NZXNzYWdlLlxyXG5cdCAqIFxyXG5cdCAqIEByZXR1cm5zIFRoZSAqKkNBTkRJREFURSoqICoqdG9DaGVjayoqIGRvZXNuJ3QgZnVsZmlsbCB0aGlzIHtAbGluayBJTlNUQU5DRSB9LlxyXG5cdCAqIFxyXG5cdCAqIEB0aHJvd3MgQSB7QGxpbmsgREJDLkluZnJpbmdlbWVudCB9IGlmIHRoZSAqKkNBTkRJREFURSoqICoqdG9DaGVjayoqIGRvZXMgbm90IGZ1bGZpbGwgdGhpcyB7QGxpbmsgREVGSU5FRCB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgdHNDaGVjayA8IENBTkRJREFURSA9IHVua25vd24gPiAoIHRvQ2hlY2sgOiBhbnksIHJlZmVyZW5jZSA6IGFueSwgaWQgOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQgKSA6IENBTkRJREFURSB7XHJcblx0XHRjb25zdCByZXN1bHQgPSBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSh0b0NoZWNrLCByZWZlcmVuY2UpO1xyXG5cclxuXHRcdGlmKCByZXN1bHQgPT09IHRydWUgKSB7XHJcblx0XHRcdHJldHVybiB0b0NoZWNrIDtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHR0aHJvdyBuZXcgREJDLkluZnJpbmdlbWVudCggYCR7aWQ/YCgke2lkfSkgYDpcIlwifSR7cmVzdWx0IGFzIHN0cmluZyB9YCk7XHJcblx0XHR9XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIENyZWF0ZXMgdGhpcyB7QGxpbmsgSU5TVEFOQ0UgfSBieSBzZXR0aW5nIHRoZSBwcm90ZWN0ZWQgcHJvcGVydHkge0BsaW5rIElOU1RBTkNFLnJlZmVyZW5jZSB9IHVzZWQgYnkge0BsaW5rIElOU1RBTkNFLmNoZWNrIH0uXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gcmVmZXJlbmNlIFNlZSB7QGxpbmsgSU5TVEFOQ0UuY2hlY2sgfS4gKi9cclxuXHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cclxuXHRwdWJsaWMgY29uc3RydWN0b3IocHJvdGVjdGVkIHJlZmVyZW5jZTogYW55KSB7XHJcblx0XHRzdXBlcigpO1xyXG5cdH1cclxufVxyXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7OztBQU1PLElBQU0sV0FBTixNQUFNLGtCQUFpQixJQUFJO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBcUkxQixZQUFzQixXQUFnQjtBQUM1QyxVQUFNO0FBRHNCO0FBQUEsRUFFN0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQTdIQSxPQUFjLGVBQWUsU0FBYyxXQUFrQztBQUM1RSxRQUFJLEVBQUUsbUJBQW1CLFlBQVk7QUFDcEMsYUFBTyxtQ0FBbUMsU0FBUyxxQkFBcUIsT0FBTyxPQUFPO0FBQUEsSUFDdkY7QUFFQSxXQUFPO0FBQUEsRUFDUjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVUEsT0FBYyxJQUViLFdBQ0EsT0FBMkIsUUFDM0IsTUFBTSxlQUtHO0FBQ1QsV0FBTyxJQUFJO0FBQUEsTUFDVixDQUNDLE9BQ0EsUUFDQSxZQUNBLG1CQUNJO0FBQ0osZUFBTyxVQUFTLGVBQWUsT0FBTyxTQUFTO0FBQUEsTUFDaEQ7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Q7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFVQSxPQUFjLEtBRWIsV0FDQSxPQUEyQixRQUMzQixNQUFNLGVBS2lCO0FBQ3ZCLFdBQU8sSUFBSTtBQUFBLE1BQ1YsQ0FBQyxPQUFlLFFBQWdCLGdCQUF3QjtBQUN2RCxlQUFPLFVBQVMsZUFBZSxPQUFPLFNBQVM7QUFBQSxNQUNoRDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVBLE9BQWMsVUFFYixXQUNBLE9BQTJCLFFBQzNCLE1BQU0sZUFDTDtBQUNELFdBQU8sSUFBSSxhQUFhLENBQUMsSUFBSSxVQUFTLFNBQVMsQ0FBQyxHQUFHLE1BQU0sR0FBRztBQUFBLEVBQzdEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFhTyxNQUFNLFNBQWM7QUFDMUIsV0FBTyxVQUFTLGVBQWUsU0FBUyxLQUFLLFNBQVM7QUFBQSxFQUN2RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFXQSxPQUFjLFFBQWtDLFNBQWUsV0FBaUIsS0FBMEIsUUFBd0I7QUFDakksVUFBTSxTQUFTLFVBQVMsZUFBZSxTQUFTLFNBQVM7QUFFekQsUUFBSSxXQUFXLE1BQU87QUFDckIsYUFBTztBQUFBLElBQ1IsT0FDSztBQUNKLFlBQU0sSUFBSSxJQUFJLGFBQWMsR0FBRyxLQUFHLElBQUksRUFBRSxPQUFLLEVBQUUsR0FBRyxNQUFpQixFQUFFO0FBQUEsSUFDdEU7QUFBQSxFQUNEO0FBU0Q7IiwKICAibmFtZXMiOiBbXQp9Cg==
