import {
  DBC
} from "./chunk-7Z6CEUOW.js";

// ../../node_modules/xdbc/src/DBC/REGEX.ts
var REGEX = class _REGEX extends DBC {
  /**
   * Creates this {@link REGEX } by setting the protected property {@link REGEX.expression } used by {@link REGEX.check }.
   *
   * @param expression See {@link REGEX.check }. */
  constructor(expression) {
    super();
    this.expression = expression;
  }
  /** Stores often used {@link RegExp }s. */
  static stdExp = {
    htmlAttributeName: /^[a-zA-Z_:][a-zA-Z0-9_.:-]*$/,
    eMail: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i,
    property: /^[$_A-Za-z][$_A-Za-z0-9]*$/,
    url: /^(?:(?:http:|https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:localhost|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})(?::\d{2,5})?(?:\/(?:[\w\-\.]*\/)*[\w\-\.]+(?:\?\S*)?(?:#\S*)?)?$/i,
    keyPath: /^([a-zA-Z_$][a-zA-Z0-9_$]*\.)*[a-zA-Z_$][a-zA-Z0-9_$]*$/,
    date: /^\d{1,4}[.\/-]\d{1,2}[.\/-]\d{1,4}$/i,
    dateFormat: /^((D{1,2}[./-]M{1,2}[./-]Y{1,4})|(M{1,2}[./-]D{1,2}[./-]Y{1,4})|Y{1,4}[./-]D{1,2}[./-]M{1,2}|(Y{1,4}[./-]M{1,2}[./-]D{1,2}))$/i,
    cssSelector: /^(?:\*|#[\w-]+|\.[\w-]+|(?:[\w-]+|\*)(?::(?:[\w-]+(?:\([\w-]+\))?)+)?(?:\[(?:[\w-]+(?:(?:=|~=|\|=|\*=|\$=|\^=)\s*(?:"[^"]*"|'[^']*'|[\w-]+)\s*)?)?\])+|\[\s*[\w-]+\s*=\s*(?:"[^"]*"|'[^']*'|[\w-]+)\s*\])(?:,\s*(?:\*|#[\w-]+|\.[\w-]+|(?:[\w-]+|\*)(?::(?:[\w-]+(?:\([\w-]+\))?)+)?(?:\[(?:[\w-]+(?:(?:=|~=|\|=|\*=|\$=|\^=)\s*(?:"[^"]*"|'[^']*'|[\w-]+)\s*)?)?\])+|\[\s*[\w-]+\s*=\s*(?:"[^"]*"|'[^']*'|[\w-]+)\s*\]))*$/
  };
  // #region Condition checking.
  /**
   * Checks if the value **toCheck** is complies to the {@link RegExp } **expression**.
   *
   * @param toCheck		The value that has comply to the {@link RegExp } **expression** for this {@link DBC } to be fulfilled.
   * @param expression	The {@link RegExp } the one **toCheck** has comply to in order for this {@link DBC } to be
   * 						fulfilled.
   *
   * @returns TRUE if the value **toCheck** complies with the {@link RegExp } **expression**, otherwise FALSE. */
  static checkAlgorithm(toCheck, expression) {
    if (!expression.test(toCheck)) {
      return `Value has to comply to regular expression "${expression}"`;
    }
    return true;
  }
  /**
   * A parameter-decorator factory using the {@link REGEX.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
   * by the tagged parameter.
   *
   * @param expression	See {@link REGEX.checkAlgorithm }.
   * @param path			See {@link DBC.decPrecondition }.
   * @param dbc			See {@link DBC.decPrecondition }.
   *
   * @returns See {@link DBC.decPrecondition }. */
  static PRE(expression, path = void 0, dbc = "WaXCode.DBC") {
    return DBC.decPrecondition(
      (value, target, methodName, parameterIndex) => {
        return _REGEX.checkAlgorithm(value, expression);
      },
      dbc,
      path
    );
  }
  /**
   * A method-decorator factory using the {@link REGEX.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
   * by the tagged method's returnvalue.
   *
   * @param expression	See {@link REGEX.checkAlgorithm }.
   * @param path			See {@link DBC.Postcondition }.
   * @param dbc			See {@link DBC.decPostcondition }.
   *
   * @returns See {@link DBC.decPostcondition }. */
  static POST(expression, path = void 0, dbc = "WaXCode.DBC") {
    return DBC.decPostcondition(
      (value, target, propertyKey) => {
        return _REGEX.checkAlgorithm(value, expression);
      },
      dbc,
      path
    );
  }
  /**
   * A field-decorator factory using the {@link REGEX.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
   * by the tagged field.
   *
   * @param expression	See {@link REGEX.checkAlgorithm }.
   * @param path			See {@link DBC.decInvariant }.
   * @param dbc			See {@link DBC.decInvariant }.
   *
   * @returns See {@link DBC.decInvariant }. */
  static INVARIANT(expression, path = void 0, dbc = "WaXCode.DBC") {
    return DBC.decInvariant([new _REGEX(expression)], path, dbc);
  }
  // #endregion Condition checking.
  // #region Referenced Condition checking.
  //
  // For usage in dynamic scenarios (like with AE-DBC).
  //
  /**
   * Invokes the {@link REGEX.checkAlgorithm } passing the value **toCheck** and {@link REGEX.equivalent }.
   *
   * @param toCheck See {@link REGEX.checkAlgorithm }.
   *
   * @returns See {@link EQ.checkAlgorithm}. */
  check(toCheck) {
    return _REGEX.checkAlgorithm(toCheck, this.expression);
  }
  // #endregion Referenced Condition checking.
  // #region In-Method checking.
  /**
   * Invokes the {@link REGEX.checkAlgorithm } passing the value **toCheck** and {@link REGEX.expression }.
   *
   * @param toCheck		See {@link REGEX.checkAlgorithm}.
   * @param expression	See {@link REGEX.checkAlgorithm}.
   */
  static check(toCheck, expression) {
    const checkResult = _REGEX.checkAlgorithm(toCheck, expression);
    if (typeof checkResult === "string") {
      throw new DBC.Infringement(checkResult);
    }
  }
  // #endregion In-Method checking.
};

export {
  REGEX
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL25vZGVfbW9kdWxlcy94ZGJjL3NyYy9EQkMvUkVHRVgudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IERCQyB9IGZyb20gXCIuLi9EQkNcIjtcclxuLyoqXHJcbiAqIEEge0BsaW5rIERCQyB9IHByb3ZpZGluZyB7QGxpbmsgUkVHRVggfS1jb250cmFjdHMgYW5kIHN0YW5kYXJkIHtAbGluayBSZWdFeHAgfSBmb3IgY29tbW9uIHVzZSBjYXNlcyBpbiB7QGxpbmsgUkVHRVguc3RkRXhwIH0uXHJcbiAqXHJcbiAqIEByZW1hcmtzXHJcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoWERCQ0BXYVhDb2RlLm5ldCkgKi9cclxuZXhwb3J0IGNsYXNzIFJFR0VYIGV4dGVuZHMgREJDIHtcclxuXHQvKiogU3RvcmVzIG9mdGVuIHVzZWQge0BsaW5rIFJlZ0V4cCB9cy4gKi9cclxuXHRwdWJsaWMgc3RhdGljIHN0ZEV4cCA9IHtcclxuXHRcdGh0bWxBdHRyaWJ1dGVOYW1lOiAvXlthLXpBLVpfOl1bYS16QS1aMC05Xy46LV0qJC8sXHJcblx0XHRlTWFpbDogL15bYS16QS1aMC05Ll8lKy1dK0BbYS16QS1aMC05Li1dK1xcLlthLXpBLVpdezIsfSQvaSxcclxuXHRcdHByb3BlcnR5OiAvXlskX0EtWmEtel1bJF9BLVphLXowLTldKiQvLFxyXG5cdFx0dXJsOiAvXig/Oig/Omh0dHA6fGh0dHBzP3xmdHApOlxcL1xcLyk/KD86XFxTKyg/OjpcXFMqKT9AKT8oPzpsb2NhbGhvc3R8KD86W2EtekEtWjAtOV0oPzpbYS16QS1aMC05LV17MCw2MX1bYS16QS1aMC05XSk/XFwuKStbYS16QS1aXXsyLH0pKD86OlxcZHsyLDV9KT8oPzpcXC8oPzpbXFx3XFwtXFwuXSpcXC8pKltcXHdcXC1cXC5dKyg/OlxcP1xcUyopPyg/OiNcXFMqKT8pPyQvaSxcclxuXHRcdGtleVBhdGg6IC9eKFthLXpBLVpfJF1bYS16QS1aMC05XyRdKlxcLikqW2EtekEtWl8kXVthLXpBLVowLTlfJF0qJC8sXHJcblx0XHRkYXRlOiAvXlxcZHsxLDR9Wy5cXC8tXVxcZHsxLDJ9Wy5cXC8tXVxcZHsxLDR9JC9pLFxyXG5cdFx0ZGF0ZUZvcm1hdDpcclxuXHRcdFx0L14oKER7MSwyfVsuLy1dTXsxLDJ9Wy4vLV1ZezEsNH0pfChNezEsMn1bLi8tXUR7MSwyfVsuLy1dWXsxLDR9KXxZezEsNH1bLi8tXUR7MSwyfVsuLy1dTXsxLDJ9fChZezEsNH1bLi8tXU17MSwyfVsuLy1dRHsxLDJ9KSkkL2ksXHJcblx0XHRjc3NTZWxlY3RvcjpcclxuXHRcdFx0L14oPzpcXCp8I1tcXHctXSt8XFwuW1xcdy1dK3woPzpbXFx3LV0rfFxcKikoPzo6KD86W1xcdy1dKyg/OlxcKFtcXHctXStcXCkpPykrKT8oPzpcXFsoPzpbXFx3LV0rKD86KD86PXx+PXxcXHw9fFxcKj18XFwkPXxcXF49KVxccyooPzpcIlteXCJdKlwifCdbXiddKid8W1xcdy1dKylcXHMqKT8pP1xcXSkrfFxcW1xccypbXFx3LV0rXFxzKj1cXHMqKD86XCJbXlwiXSpcInwnW14nXSonfFtcXHctXSspXFxzKlxcXSkoPzosXFxzKig/OlxcKnwjW1xcdy1dK3xcXC5bXFx3LV0rfCg/OltcXHctXSt8XFwqKSg/OjooPzpbXFx3LV0rKD86XFwoW1xcdy1dK1xcKSk/KSspPyg/OlxcWyg/OltcXHctXSsoPzooPzo9fH49fFxcfD18XFwqPXxcXCQ9fFxcXj0pXFxzKig/OlwiW15cIl0qXCJ8J1teJ10qJ3xbXFx3LV0rKVxccyopPyk/XFxdKSt8XFxbXFxzKltcXHctXStcXHMqPVxccyooPzpcIlteXCJdKlwifCdbXiddKid8W1xcdy1dKylcXHMqXFxdKSkqJC8sXHJcblx0fTtcclxuXHQvLyAjcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvKipcclxuXHQgKiBDaGVja3MgaWYgdGhlIHZhbHVlICoqdG9DaGVjayoqIGlzIGNvbXBsaWVzIHRvIHRoZSB7QGxpbmsgUmVnRXhwIH0gKipleHByZXNzaW9uKiouXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdG9DaGVja1x0XHRUaGUgdmFsdWUgdGhhdCBoYXMgY29tcGx5IHRvIHRoZSB7QGxpbmsgUmVnRXhwIH0gKipleHByZXNzaW9uKiogZm9yIHRoaXMge0BsaW5rIERCQyB9IHRvIGJlIGZ1bGZpbGxlZC5cclxuXHQgKiBAcGFyYW0gZXhwcmVzc2lvblx0VGhlIHtAbGluayBSZWdFeHAgfSB0aGUgb25lICoqdG9DaGVjayoqIGhhcyBjb21wbHkgdG8gaW4gb3JkZXIgZm9yIHRoaXMge0BsaW5rIERCQyB9IHRvIGJlXHJcblx0ICogXHRcdFx0XHRcdFx0ZnVsZmlsbGVkLlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgVFJVRSBpZiB0aGUgdmFsdWUgKip0b0NoZWNrKiogY29tcGxpZXMgd2l0aCB0aGUge0BsaW5rIFJlZ0V4cCB9ICoqZXhwcmVzc2lvbioqLCBvdGhlcndpc2UgRkFMU0UuICovXHJcblx0cHVibGljIHN0YXRpYyBjaGVja0FsZ29yaXRobShcclxuXHRcdHRvQ2hlY2s6IHVua25vd24gfCBudWxsIHwgdW5kZWZpbmVkLFxyXG5cdFx0ZXhwcmVzc2lvbjogUmVnRXhwLFxyXG5cdCk6IGJvb2xlYW4gfCBzdHJpbmcge1xyXG5cdFx0aWYgKCFleHByZXNzaW9uLnRlc3QodG9DaGVjayBhcyBzdHJpbmcpKSB7XHJcblx0XHRcdHJldHVybiBgVmFsdWUgaGFzIHRvIGNvbXBseSB0byByZWd1bGFyIGV4cHJlc3Npb24gXCIke2V4cHJlc3Npb259XCJgO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0cnVlO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBBIHBhcmFtZXRlci1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXHJcblx0ICogYnkgdGhlIHRhZ2dlZCBwYXJhbWV0ZXIuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gZXhwcmVzc2lvblx0U2VlIHtAbGluayBSRUdFWC5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXHJcblx0ICogQHBhcmFtIGRiY1x0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uICovXHJcblx0cHVibGljIHN0YXRpYyBQUkUoXHJcblx0XHRleHByZXNzaW9uOiBSZWdFeHAsXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXHJcblx0KTogKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRtZXRob2ROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXHJcblx0XHRwYXJhbWV0ZXJJbmRleDogbnVtYmVyLFxyXG5cdCkgPT4gdm9pZCB7XHJcblx0XHRyZXR1cm4gREJDLmRlY1ByZWNvbmRpdGlvbihcclxuXHRcdFx0KFxyXG5cdFx0XHRcdHZhbHVlOiBzdHJpbmcsXHJcblx0XHRcdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRcdFx0bWV0aG9kTmFtZTogc3RyaW5nLFxyXG5cdFx0XHRcdHBhcmFtZXRlckluZGV4OiBudW1iZXIsXHJcblx0XHRcdCkgPT4ge1xyXG5cdFx0XHRcdHJldHVybiBSRUdFWC5jaGVja0FsZ29yaXRobSh2YWx1ZSwgZXhwcmVzc2lvbik7XHJcblx0XHRcdH0sXHJcblx0XHRcdGRiYyxcclxuXHRcdFx0cGF0aCxcclxuXHRcdCk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgUkVHRVguY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcclxuXHQgKiBieSB0aGUgdGFnZ2VkIG1ldGhvZCdzIHJldHVybnZhbHVlLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIGV4cHJlc3Npb25cdFNlZSB7QGxpbmsgUkVHRVguY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gcGF0aFx0XHRcdFNlZSB7QGxpbmsgREJDLlBvc3Rjb25kaXRpb24gfS5cclxuXHQgKiBAcGFyYW0gZGJjXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgUE9TVChcclxuXHRcdGV4cHJlc3Npb246IFJlZ0V4cCxcclxuXHRcdHBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGRiYyA9IFwiV2FYQ29kZS5EQkNcIixcclxuXHQpOiAoXHJcblx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdHByb3BlcnR5S2V5OiBzdHJpbmcsXHJcblx0XHRkZXNjcmlwdG9yOiBQcm9wZXJ0eURlc2NyaXB0b3IsXHJcblx0KSA9PiBQcm9wZXJ0eURlc2NyaXB0b3Ige1xyXG5cdFx0cmV0dXJuIERCQy5kZWNQb3N0Y29uZGl0aW9uKFxyXG5cdFx0XHQodmFsdWU6IHN0cmluZywgdGFyZ2V0OiBvYmplY3QsIHByb3BlcnR5S2V5OiBzdHJpbmcpID0+IHtcclxuXHRcdFx0XHRyZXR1cm4gUkVHRVguY2hlY2tBbGdvcml0aG0odmFsdWUsIGV4cHJlc3Npb24pO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRkYmMsXHJcblx0XHRcdHBhdGgsXHJcblx0XHQpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBBIGZpZWxkLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgUkVHRVguY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcclxuXHQgKiBieSB0aGUgdGFnZ2VkIGZpZWxkLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIGV4cHJlc3Npb25cdFNlZSB7QGxpbmsgUkVHRVguY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gcGF0aFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxyXG5cdCAqIEBwYXJhbSBkYmNcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgSU5WQVJJQU5UKFxyXG5cdFx0ZXhwcmVzc2lvbjogUmVnRXhwLFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjID0gXCJXYVhDb2RlLkRCQ1wiLFxyXG5cdCkge1xyXG5cdFx0cmV0dXJuIERCQy5kZWNJbnZhcmlhbnQoW25ldyBSRUdFWChleHByZXNzaW9uKV0sIHBhdGgsIGRiYyk7XHJcblx0fVxyXG5cdC8vICNlbmRyZWdpb24gQ29uZGl0aW9uIGNoZWNraW5nLlxyXG5cdC8vICNyZWdpb24gUmVmZXJlbmNlZCBDb25kaXRpb24gY2hlY2tpbmcuXHJcblx0Ly9cclxuXHQvLyBGb3IgdXNhZ2UgaW4gZHluYW1pYyBzY2VuYXJpb3MgKGxpa2Ugd2l0aCBBRS1EQkMpLlxyXG5cdC8vXHJcblx0LyoqXHJcblx0ICogSW52b2tlcyB0aGUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtIH0gcGFzc2luZyB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHtAbGluayBSRUdFWC5lcXVpdmFsZW50IH0uXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdG9DaGVjayBTZWUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtfS4gKi9cclxuXHRwdWJsaWMgY2hlY2sodG9DaGVjazogdW5rbm93biB8IG51bGwgfCB1bmRlZmluZWQpIHtcclxuXHRcdHJldHVybiBSRUdFWC5jaGVja0FsZ29yaXRobSh0b0NoZWNrLCB0aGlzLmV4cHJlc3Npb24pO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBDcmVhdGVzIHRoaXMge0BsaW5rIFJFR0VYIH0gYnkgc2V0dGluZyB0aGUgcHJvdGVjdGVkIHByb3BlcnR5IHtAbGluayBSRUdFWC5leHByZXNzaW9uIH0gdXNlZCBieSB7QGxpbmsgUkVHRVguY2hlY2sgfS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBleHByZXNzaW9uIFNlZSB7QGxpbmsgUkVHRVguY2hlY2sgfS4gKi9cclxuXHRwdWJsaWMgY29uc3RydWN0b3IocHJvdGVjdGVkIGV4cHJlc3Npb246IFJlZ0V4cCkge1xyXG5cdFx0c3VwZXIoKTtcclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBSZWZlcmVuY2VkIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvLyAjcmVnaW9uIEluLU1ldGhvZCBjaGVja2luZy5cclxuXHQvKipcclxuXHQgKiBJbnZva2VzIHRoZSB7QGxpbmsgUkVHRVguY2hlY2tBbGdvcml0aG0gfSBwYXNzaW5nIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBhbmQge0BsaW5rIFJFR0VYLmV4cHJlc3Npb24gfS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0b0NoZWNrXHRcdFNlZSB7QGxpbmsgUkVHRVguY2hlY2tBbGdvcml0aG19LlxyXG5cdCAqIEBwYXJhbSBleHByZXNzaW9uXHRTZWUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtfS5cclxuXHQgKi9cclxuXHRwdWJsaWMgc3RhdGljIGNoZWNrKHRvQ2hlY2s6IHVua25vd24gfCBudWxsIHwgdW5kZWZpbmVkLCBleHByZXNzaW9uOiBSZWdFeHApIHtcclxuXHRcdGNvbnN0IGNoZWNrUmVzdWx0ID0gUkVHRVguY2hlY2tBbGdvcml0aG0odG9DaGVjaywgZXhwcmVzc2lvbik7XHJcblxyXG5cdFx0aWYgKHR5cGVvZiBjaGVja1Jlc3VsdCA9PT0gXCJzdHJpbmdcIikge1xyXG5cdFx0XHR0aHJvdyBuZXcgREJDLkluZnJpbmdlbWVudChjaGVja1Jlc3VsdCk7XHJcblx0XHR9XHJcblx0fVxyXG5cdC8vICNlbmRyZWdpb24gSW4tTWV0aG9kIGNoZWNraW5nLlxyXG59XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7O0FBTU8sSUFBTSxRQUFOLE1BQU0sZUFBYyxJQUFJO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQTRIdkIsWUFBc0IsWUFBb0I7QUFDaEQsVUFBTTtBQURzQjtBQUFBLEVBRTdCO0FBQUE7QUFBQSxFQTVIQSxPQUFjLFNBQVM7QUFBQSxJQUN0QixtQkFBbUI7QUFBQSxJQUNuQixPQUFPO0FBQUEsSUFDUCxVQUFVO0FBQUEsSUFDVixLQUFLO0FBQUEsSUFDTCxTQUFTO0FBQUEsSUFDVCxNQUFNO0FBQUEsSUFDTixZQUNDO0FBQUEsSUFDRCxhQUNDO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVUEsT0FBYyxlQUNiLFNBQ0EsWUFDbUI7QUFDbkIsUUFBSSxDQUFDLFdBQVcsS0FBSyxPQUFpQixHQUFHO0FBQ3hDLGFBQU8sOENBQThDLFVBQVU7QUFBQSxJQUNoRTtBQUVBLFdBQU87QUFBQSxFQUNSO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFVQSxPQUFjLElBQ2IsWUFDQSxPQUEyQixRQUMzQixNQUFNLGVBS0c7QUFDVCxXQUFPLElBQUk7QUFBQSxNQUNWLENBQ0MsT0FDQSxRQUNBLFlBQ0EsbUJBQ0k7QUFDSixlQUFPLE9BQU0sZUFBZSxPQUFPLFVBQVU7QUFBQSxNQUM5QztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVBLE9BQWMsS0FDYixZQUNBLE9BQTJCLFFBQzNCLE1BQU0sZUFLaUI7QUFDdkIsV0FBTyxJQUFJO0FBQUEsTUFDVixDQUFDLE9BQWUsUUFBZ0IsZ0JBQXdCO0FBQ3ZELGVBQU8sT0FBTSxlQUFlLE9BQU8sVUFBVTtBQUFBLE1BQzlDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNEO0FBQUEsRUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVUEsT0FBYyxVQUNiLFlBQ0EsT0FBMkIsUUFDM0IsTUFBTSxlQUNMO0FBQ0QsV0FBTyxJQUFJLGFBQWEsQ0FBQyxJQUFJLE9BQU0sVUFBVSxDQUFDLEdBQUcsTUFBTSxHQUFHO0FBQUEsRUFDM0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFZTyxNQUFNLFNBQXFDO0FBQ2pELFdBQU8sT0FBTSxlQUFlLFNBQVMsS0FBSyxVQUFVO0FBQUEsRUFDckQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFnQkEsT0FBYyxNQUFNLFNBQXFDLFlBQW9CO0FBQzVFLFVBQU0sY0FBYyxPQUFNLGVBQWUsU0FBUyxVQUFVO0FBRTVELFFBQUksT0FBTyxnQkFBZ0IsVUFBVTtBQUNwQyxZQUFNLElBQUksSUFBSSxhQUFhLFdBQVc7QUFBQSxJQUN2QztBQUFBLEVBQ0Q7QUFBQTtBQUVEOyIsCiAgIm5hbWVzIjogW10KfQo=
