import {
  DBC
} from "./chunk-7Z6CEUOW.js";

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
   * @param type		The type the {@link object} **toCheck** has to be of.
   *
   * @returns TRUE if the value **toCheck** is of the specified **type**, otherwise FALSE. */
  // biome-ignore lint/suspicious/noExplicitAny: Necessary for dynamic type checking of also UNDEFINED.
  static checkAlgorithm(toCheck, type) {
    if (typeof toCheck !== type) {
      return `Value has to to be of type "${type}" but is of type "${typeof toCheck}"`;
    }
    return true;
  }
  /**
   * A parameter-decorator factory using the {@link TYPE.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
   * by the tagged parameter.
   *
   * @param type	See {@link TYPE.checkAlgorithm }.
   * @param path	See {@link DBC.decPrecondition }.
   * @param dbc	See {@link DBC.decPrecondition }.
   *
   * @returns See {@link DBC.decPrecondition }. */
  static PRE(type, path = void 0, dbc = "WaXCode.DBC") {
    return DBC.decPrecondition(
      (value, target, methodName, parameterIndex) => {
        return _TYPE.checkAlgorithm(value, type);
      },
      dbc,
      path
    );
  }
  /**
   * A method-decorator factory using the {@link TYPE.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
   * by the tagged method's returnvalue.
   *
   * @param type	See {@link TYPE.checkAlgorithm }.
   * @param path	See {@link DBC.Postcondition }.
   * @param dbc	See {@link DBC.decPostcondition }.
   *
   * @returns See {@link DBC.decPostcondition }. */
  static POST(type, path = void 0, dbc = "WaXCode.DBC") {
    return DBC.decPostcondition(
      (value, target, propertyKey) => {
        return _TYPE.checkAlgorithm(value, type);
      },
      dbc,
      path
    );
  }
  /**
   * A field-decorator factory using the {@link TYPE.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
   * by the tagged field.
   *
   * @param type	See {@link TYPE.checkAlgorithm }.
   * @param path	See {@link DBC.decInvariant }.
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
   * 
   * @returns The **CANDIDATE** **toCheck** doesn't fulfill this {@link TYPE }.
   * 
   * @throws A {@link DBC.Infringement } if the **CANDIDATE** **toCheck** does not fulfill this {@link DEFINED }. */
  static tsCheck(toCheck, type, id = void 0) {
    const result = _TYPE.checkAlgorithm(toCheck, type);
    if (result === true) {
      return toCheck;
    } else {
      throw new DBC.Infringement(`${id ? `(${id}) ` : ""}${result}`);
    }
  }
};

export {
  TYPE
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL25vZGVfbW9kdWxlcy94ZGJjL3NyYy9EQkMvVFlQRS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgREJDIH0gZnJvbSBcIi4uL0RCQ1wiO1xyXG4vKipcclxuICogQSB7QGxpbmsgREJDIH0gZGVmaW5pbmcgdGhhdCBhbiB7QGxpbmsgb2JqZWN0IH1zIGdvdHRhIGJlIG9mIGNlcnRhaW4ge0BsaW5rIFRZUEUudHlwZSB9LlxyXG4gKlxyXG4gKiBAcmVtYXJrc1xyXG4gKiBBdXRob3I6IFx0XHRTYWx2YXRvcmUgQ2FsbGFyaSAoQ2FsbGFyaUBXYVhDb2RlLm5ldCkgLyAyMDI1XHJcbiAqIE1haW50YWluZXI6XHRTYWx2YXRvcmUgQ2FsbGFyaSAoWERCQ0BXYVhDb2RlLm5ldCkgKi9cclxuZXhwb3J0IGNsYXNzIFRZUEUgZXh0ZW5kcyBEQkMge1xyXG5cdC8qKlxyXG5cdCAqIENoZWNrcyBpZiB0aGUgdmFsdWUgKip0b0NoZWNrKiogaXMgb2YgdGhlICoqdHlwZSoqIHNwZWNpZmllZC5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0b0NoZWNrXHRUaGUge0BsaW5rIE9iamVjdCB9IHdoaWNoJ3MgKip0eXBlKiogdG8gY2hlY2suXHJcblx0ICogQHBhcmFtIHR5cGVcdFx0VGhlIHR5cGUgdGhlIHtAbGluayBvYmplY3R9ICoqdG9DaGVjayoqIGhhcyB0byBiZSBvZi5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFRSVUUgaWYgdGhlIHZhbHVlICoqdG9DaGVjayoqIGlzIG9mIHRoZSBzcGVjaWZpZWQgKip0eXBlKiosIG90aGVyd2lzZSBGQUxTRS4gKi9cclxuXHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IE5lY2Vzc2FyeSBmb3IgZHluYW1pYyB0eXBlIGNoZWNraW5nIG9mIGFsc28gVU5ERUZJTkVELlxyXG5cdHB1YmxpYyBzdGF0aWMgY2hlY2tBbGdvcml0aG0odG9DaGVjazogYW55LCB0eXBlOiBzdHJpbmcpOiBib29sZWFuIHwgc3RyaW5nIHtcclxuXHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvdXNlVmFsaWRUeXBlb2Y6IE5lY2Vzc2FyeVxyXG5cdFx0aWYgKHR5cGVvZiB0b0NoZWNrICE9PSB0eXBlKSB7XHJcblx0XHRcdHJldHVybiBgVmFsdWUgaGFzIHRvIHRvIGJlIG9mIHR5cGUgXCIke3R5cGV9XCIgYnV0IGlzIG9mIHR5cGUgXCIke3R5cGVvZiB0b0NoZWNrfVwiYDtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdHJ1ZTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogQSBwYXJhbWV0ZXItZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBUWVBFLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXHJcblx0ICogYnkgdGhlIHRhZ2dlZCBwYXJhbWV0ZXIuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdHlwZVx0U2VlIHtAbGluayBUWVBFLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIHBhdGhcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqIEBwYXJhbSBkYmNcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uICovXHJcblx0cHVibGljIHN0YXRpYyBQUkUoXHJcblx0XHR0eXBlOiBzdHJpbmcsXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXHJcblx0KTogKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRtZXRob2ROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXHJcblx0XHRwYXJhbWV0ZXJJbmRleDogbnVtYmVyLFxyXG5cdCkgPT4gdm9pZCB7XHJcblx0XHRyZXR1cm4gREJDLmRlY1ByZWNvbmRpdGlvbihcclxuXHRcdFx0KFxyXG5cdFx0XHRcdHZhbHVlOiBvYmplY3QsXHJcblx0XHRcdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRcdFx0bWV0aG9kTmFtZTogc3RyaW5nLFxyXG5cdFx0XHRcdHBhcmFtZXRlckluZGV4OiBudW1iZXIsXHJcblx0XHRcdCkgPT4ge1xyXG5cdFx0XHRcdHJldHVybiBUWVBFLmNoZWNrQWxnb3JpdGhtKHZhbHVlLCB0eXBlKTtcclxuXHRcdFx0fSxcclxuXHRcdFx0ZGJjLFxyXG5cdFx0XHRwYXRoLFxyXG5cdFx0KTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogQSBtZXRob2QtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBUWVBFLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXHJcblx0ICogYnkgdGhlIHRhZ2dlZCBtZXRob2QncyByZXR1cm52YWx1ZS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0eXBlXHRTZWUge0BsaW5rIFRZUEUuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gcGF0aFx0U2VlIHtAbGluayBEQkMuUG9zdGNvbmRpdGlvbiB9LlxyXG5cdCAqIEBwYXJhbSBkYmNcdFNlZSB7QGxpbmsgREJDLmRlY1Bvc3Rjb25kaXRpb24gfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY1Bvc3Rjb25kaXRpb24gfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIFBPU1QoXHJcblx0XHR0eXBlOiBzdHJpbmcsXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXHJcblx0KTogKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRwcm9wZXJ0eUtleTogc3RyaW5nLFxyXG5cdFx0ZGVzY3JpcHRvcjogUHJvcGVydHlEZXNjcmlwdG9yLFxyXG5cdCkgPT4gUHJvcGVydHlEZXNjcmlwdG9yIHtcclxuXHRcdHJldHVybiBEQkMuZGVjUG9zdGNvbmRpdGlvbihcclxuXHRcdFx0KHZhbHVlOiBvYmplY3QsIHRhcmdldDogb2JqZWN0LCBwcm9wZXJ0eUtleTogc3RyaW5nKSA9PiB7XHJcblx0XHRcdFx0cmV0dXJuIFRZUEUuY2hlY2tBbGdvcml0aG0odmFsdWUsIHR5cGUpO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRkYmMsXHJcblx0XHRcdHBhdGgsXHJcblx0XHQpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBBIGZpZWxkLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgVFlQRS5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxyXG5cdCAqIGJ5IHRoZSB0YWdnZWQgZmllbGQuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdHlwZVx0U2VlIHtAbGluayBUWVBFLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIHBhdGhcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxyXG5cdCAqIEBwYXJhbSBkYmNcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uICovXHJcblx0cHVibGljIHN0YXRpYyBJTlZBUklBTlQoXHJcblx0XHR0eXBlOiBzdHJpbmcsXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXHJcblx0KSB7XHJcblx0XHRyZXR1cm4gREJDLmRlY0ludmFyaWFudChbbmV3IFRZUEUodHlwZSldLCBwYXRoLCBkYmMpO1xyXG5cdH1cclxuXHQvLyAjZW5kcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvLyAjcmVnaW9uIFJlZmVyZW5jZWQgQ29uZGl0aW9uIGNoZWNraW5nLlxyXG5cdC8vXHJcblx0Ly8gRm9yIHVzYWdlIGluIGR5bmFtaWMgc2NlbmFyaW9zIChsaWtlIHdpdGggQUUtREJDKS5cclxuXHQvL1xyXG5cdC8qKlxyXG5cdCAqIEludm9rZXMgdGhlIHtAbGluayBUWVBFLmNoZWNrQWxnb3JpdGhtIH0gcGFzc2luZyB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHRoZSB7QGxpbmsgVFlQRS50eXBlIH0gLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHRvQ2hlY2sgU2VlIHtAbGluayBUWVBFLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIFRZUEUuY2hlY2tBbGdvcml0aG19LiAqL1xyXG5cdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxyXG5cdHB1YmxpYyBjaGVjayh0b0NoZWNrOiBhbnkpIHtcclxuXHRcdHJldHVybiBUWVBFLmNoZWNrQWxnb3JpdGhtKHRvQ2hlY2ssIHRoaXMudHlwZSk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEludm9rZXMgdGhlIHtAbGluayBUWVBFLmNoZWNrQWxnb3JpdGhtIH0gcGFzc2luZyB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHRoZSB7QGxpbmsgVFlQRS50eXBlIH0gLlxyXG5cdCAqIFxyXG5cdCAqIEBwYXJhbSB0b0NoZWNrXHRTZWUge0BsaW5rIElOU1RBTkNFLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIHR5cGVcdFx0U2VlIHtAbGluayBJTlNUQU5DRS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBpZFx0XHRBIHtAbGluayBzdHJpbmcgfSBpZGVudGlmeWluZyB0aGlzIHtAbGluayBUWVBFIH0gdmlhIHRoZSB7QGxpbmsgREJDLkluZnJpbmdlbWVudCB9LU1lc3NhZ2UuXHJcblx0ICogXHJcblx0ICogQHJldHVybnMgVGhlICoqQ0FORElEQVRFKiogKip0b0NoZWNrKiogZG9lc24ndCBmdWxmaWxsIHRoaXMge0BsaW5rIFRZUEUgfS5cclxuXHQgKiBcclxuXHQgKiBAdGhyb3dzIEEge0BsaW5rIERCQy5JbmZyaW5nZW1lbnQgfSBpZiB0aGUgKipDQU5ESURBVEUqKiAqKnRvQ2hlY2sqKiBkb2VzIG5vdCBmdWxmaWxsIHRoaXMge0BsaW5rIERFRklORUQgfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIHRzQ2hlY2sgPCBDQU5ESURBVEUgPSB1bmtub3duID4gKCB0b0NoZWNrIDogYW55LCB0eXBlIDogc3RyaW5nLCBpZCA6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCApIDogQ0FORElEQVRFIHtcclxuXHRcdGNvbnN0IHJlc3VsdCA9IFRZUEUuY2hlY2tBbGdvcml0aG0odG9DaGVjaywgdHlwZSk7XHJcblxyXG5cdFx0aWYoIHJlc3VsdCA9PT0gdHJ1ZSApIHtcclxuXHRcdFx0cmV0dXJuIHRvQ2hlY2sgO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHRocm93IG5ldyBEQkMuSW5mcmluZ2VtZW50KCBgJHtpZD9gKCR7aWR9KSBgOlwiXCJ9JHtyZXN1bHQgYXMgc3RyaW5nIH1gKTtcclxuXHRcdH1cclxuXHR9XHJcblx0LyoqXHJcblx0ICogQ3JlYXRlcyB0aGlzIHtAbGluayBUWVBFIH0gYnkgc2V0dGluZyB0aGUgcHJvdGVjdGVkIHByb3BlcnR5IHtAbGluayBUWVBFLnR5cGUgfSB1c2VkIGJ5IHtAbGluayBUWVBFLmNoZWNrIH0uXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdHlwZSBTZWUge0BsaW5rIFRZUEUuY2hlY2sgfS4gKi9cclxuXHRwdWJsaWMgY29uc3RydWN0b3IocHJvdGVjdGVkIHR5cGU6IHN0cmluZykge1xyXG5cdFx0c3VwZXIoKTtcclxuXHR9XHJcbn1cclxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7QUFPTyxJQUFNLE9BQU4sTUFBTSxjQUFhLElBQUk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBaUl0QixZQUFzQixNQUFjO0FBQzFDLFVBQU07QUFEc0I7QUFBQSxFQUU3QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQTFIQSxPQUFjLGVBQWUsU0FBYyxNQUFnQztBQUUxRSxRQUFJLE9BQU8sWUFBWSxNQUFNO0FBQzVCLGFBQU8sK0JBQStCLElBQUkscUJBQXFCLE9BQU8sT0FBTztBQUFBLElBQzlFO0FBRUEsV0FBTztBQUFBLEVBQ1I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVBLE9BQWMsSUFDYixNQUNBLE9BQTJCLFFBQzNCLE1BQU0sZUFLRztBQUNULFdBQU8sSUFBSTtBQUFBLE1BQ1YsQ0FDQyxPQUNBLFFBQ0EsWUFDQSxtQkFDSTtBQUNKLGVBQU8sTUFBSyxlQUFlLE9BQU8sSUFBSTtBQUFBLE1BQ3ZDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNEO0FBQUEsRUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVUEsT0FBYyxLQUNiLE1BQ0EsT0FBMkIsUUFDM0IsTUFBTSxlQUtpQjtBQUN2QixXQUFPLElBQUk7QUFBQSxNQUNWLENBQUMsT0FBZSxRQUFnQixnQkFBd0I7QUFDdkQsZUFBTyxNQUFLLGVBQWUsT0FBTyxJQUFJO0FBQUEsTUFDdkM7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Q7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFVQSxPQUFjLFVBQ2IsTUFDQSxPQUEyQixRQUMzQixNQUFNLGVBQ0w7QUFDRCxXQUFPLElBQUksYUFBYSxDQUFDLElBQUksTUFBSyxJQUFJLENBQUMsR0FBRyxNQUFNLEdBQUc7QUFBQSxFQUNwRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBYU8sTUFBTSxTQUFjO0FBQzFCLFdBQU8sTUFBSyxlQUFlLFNBQVMsS0FBSyxJQUFJO0FBQUEsRUFDOUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBV0EsT0FBYyxRQUFrQyxTQUFlLE1BQWUsS0FBMEIsUUFBd0I7QUFDL0gsVUFBTSxTQUFTLE1BQUssZUFBZSxTQUFTLElBQUk7QUFFaEQsUUFBSSxXQUFXLE1BQU87QUFDckIsYUFBTztBQUFBLElBQ1IsT0FDSztBQUNKLFlBQU0sSUFBSSxJQUFJLGFBQWMsR0FBRyxLQUFHLElBQUksRUFBRSxPQUFLLEVBQUUsR0FBRyxNQUFpQixFQUFFO0FBQUEsSUFDdEU7QUFBQSxFQUNEO0FBUUQ7IiwKICAibmFtZXMiOiBbXQp9Cg==
