import { DBC } from "./chunk-LFRFVRJV.js";

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
    dateFormat:
      /^((D{1,2}[./-]M{1,2}[./-]Y{1,4})|(M{1,2}[./-]D{1,2}[./-]Y{1,4})|Y{1,4}[./-]D{1,2}[./-]M{1,2}|(Y{1,4}[./-]M{1,2}[./-]D{1,2}))$/i,
    cssSelector:
      /^(?:\*|#[\w-]+|\.[\w-]+|(?:[\w-]+|\*)(?::(?:[\w-]+(?:\([\w-]+\))?)+)?(?:\[(?:[\w-]+(?:(?:=|~=|\|=|\*=|\$=|\^=)\s*(?:"[^"]*"|'[^']*'|[\w-]+)\s*)?)?\])+|\[\s*[\w-]+\s*=\s*(?:"[^"]*"|'[^']*'|[\w-]+)\s*\])(?:,\s*(?:\*|#[\w-]+|\.[\w-]+|(?:[\w-]+|\*)(?::(?:[\w-]+(?:\([\w-]+\))?)+)?(?:\[(?:[\w-]+(?:(?:=|~=|\|=|\*=|\$=|\^=)\s*(?:"[^"]*"|'[^']*'|[\w-]+)\s*)?)?\])+|\[\s*[\w-]+\s*=\s*(?:"[^"]*"|'[^']*'|[\w-]+)\s*\]))*$/,
    boolean: /^(TRUE|FALSE)$/i,
    colorCodeHEX: /^#([A-Fa-f\d]{3,4}|[A-Fa-f\d]{6}|[A-Fa-f\d]{8})$/i,
    simpleHotkey: /^((Alt|Ctrl|Shift|Meta)\+)+[a-z\d]$/i,
    bcp47:
      /^(?:[a-z]{2,3}(?:-[a-z]{3}){0,3}|[a-z]{4}|[a-z]{5,8})(?:-[a-z]{4})?(?:-[a-z]{2}|-[0-9]{3})?(?:-[a-z0-9]{5,8}|-[0-9][a-z0-9]{3})*(?:-[0-9a-wy-z](?:-[a-z0-9]{2,8})+)*(?:-x(?:-[a-z0-9]{1,8})+)?$|^x(?:-[a-z0-9]{1,8})+$/i,
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
    if (toCheck === void 0 || toCheck === null) return true;
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
  static PRE(expression, path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decPrecondition(
      (value, target, methodName, parameterIndex) => {
        return _REGEX.checkAlgorithm(value, expression);
      },
      dbc,
      path,
      hint,
    );
  }
  /**
   * A method-decorator factory using the {@link REGEX.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
   * by the tagged method's returnvalue.
   *
   * @param expression	See {@link REGEX.checkAlgorithm }.
   * @param path			See {@link DBC.Postcondition }.
   * @param dbc			See {@link DBC.decPostcondition }.
   * @param hint			See {@link DBC.decPostcondition }.
   *
   * @returns See {@link DBC.decPostcondition }. */
  static POST(expression, path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decPostcondition(
      (value, target, propertyKey) => {
        return _REGEX.checkAlgorithm(value, expression);
      },
      dbc,
      path,
      hint,
    );
  }
  /**
   * A field-decorator factory using the {@link REGEX.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
   * by the tagged field.
   *
   * @param expression	See {@link REGEX.checkAlgorithm }.
   * @param path			See {@link DBC.decInvariant }.
   * @param dbc			See {@link DBC.decInvariant }.
   * @param hint			See {@link DBC.decInvariant }.
   * @returns See {@link DBC.decInvariant }. */
  static INVARIANT(expression, path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decInvariant([new _REGEX(expression)], path, dbc, hint);
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
  /**
   * Type-safe check that validates a value against a regular expression and returns it as the specified type.
   *
   * @param toCheck		The value to check against the regular expression.
   * @param expression	The regular expression to validate against.
   * @param hint			Optional hint message to include in the error if validation fails.
   * @param id			Optional identifier to include in the error message.
   *
   * @returns The validated value cast to the CANDIDATE type.
   *
   * @throws {@link DBC.Infringement} if the value does not match the regular expression. */
  static tsCheck(toCheck, expression, hint = void 0, id = void 0) {
    const result = _REGEX.checkAlgorithm(toCheck, expression);
    if (result) {
      return toCheck;
    } else {
      throw new DBC.Infringement(`${id ? `(${id}) ` : ""}${result}${hint ? ` \u2728 ${hint} \u2728` : ""}`);
    }
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

export { REGEX };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3hkYmMvc3JjL0RCQy9SRUdFWC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgREJDIH0gZnJvbSBcIi4uL0RCQ1wiO1xyXG4vKipcclxuICogQSB7QGxpbmsgREJDIH0gcHJvdmlkaW5nIHtAbGluayBSRUdFWCB9LWNvbnRyYWN0cyBhbmQgc3RhbmRhcmQge0BsaW5rIFJlZ0V4cCB9IGZvciBjb21tb24gdXNlIGNhc2VzIGluIHtAbGluayBSRUdFWC5zdGRFeHAgfS5cclxuICpcclxuICogQHJlbWFya3NcclxuICogTWFpbnRhaW5lcjogQ2FsbGFyaSwgU2FsdmF0b3JlIChYREJDQFdhWENvZGUubmV0KSAqL1xyXG5leHBvcnQgY2xhc3MgUkVHRVggZXh0ZW5kcyBEQkMge1xyXG5cdC8qKiBTdG9yZXMgb2Z0ZW4gdXNlZCB7QGxpbmsgUmVnRXhwIH1zLiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgc3RkRXhwID0ge1xyXG5cdFx0aHRtbEF0dHJpYnV0ZU5hbWU6IC9eW2EtekEtWl86XVthLXpBLVowLTlfLjotXSokLyxcclxuXHRcdGVNYWlsOiAvXlthLXpBLVowLTkuXyUrLV0rQFthLXpBLVowLTkuLV0rXFwuW2EtekEtWl17Mix9JC9pLFxyXG5cdFx0cHJvcGVydHk6IC9eWyRfQS1aYS16XVskX0EtWmEtejAtOV0qJC8sXHJcblx0XHR1cmw6IC9eKD86KD86aHR0cDp8aHR0cHM/fGZ0cCk6XFwvXFwvKT8oPzpcXFMrKD86OlxcUyopP0ApPyg/OmxvY2FsaG9zdHwoPzpbYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT9cXC4pK1thLXpBLVpdezIsfSkoPzo6XFxkezIsNX0pPyg/OlxcLyg/OltcXHdcXC1cXC5dKlxcLykqW1xcd1xcLVxcLl0rKD86XFw/XFxTKik/KD86I1xcUyopPyk/JC9pLFxyXG5cdFx0a2V5UGF0aDogL14oW2EtekEtWl8kXVthLXpBLVowLTlfJF0qXFwuKSpbYS16QS1aXyRdW2EtekEtWjAtOV8kXSokLyxcclxuXHRcdGRhdGU6IC9eXFxkezEsNH1bLlxcLy1dXFxkezEsMn1bLlxcLy1dXFxkezEsNH0kL2ksXHJcblx0XHRkYXRlRm9ybWF0OlxyXG5cdFx0XHQvXigoRHsxLDJ9Wy4vLV1NezEsMn1bLi8tXVl7MSw0fSl8KE17MSwyfVsuLy1dRHsxLDJ9Wy4vLV1ZezEsNH0pfFl7MSw0fVsuLy1dRHsxLDJ9Wy4vLV1NezEsMn18KFl7MSw0fVsuLy1dTXsxLDJ9Wy4vLV1EezEsMn0pKSQvaSxcclxuXHRcdGNzc1NlbGVjdG9yOlxyXG5cdFx0XHQvXig/OlxcKnwjW1xcdy1dK3xcXC5bXFx3LV0rfCg/OltcXHctXSt8XFwqKSg/OjooPzpbXFx3LV0rKD86XFwoW1xcdy1dK1xcKSk/KSspPyg/OlxcWyg/OltcXHctXSsoPzooPzo9fH49fFxcfD18XFwqPXxcXCQ9fFxcXj0pXFxzKig/OlwiW15cIl0qXCJ8J1teJ10qJ3xbXFx3LV0rKVxccyopPyk/XFxdKSt8XFxbXFxzKltcXHctXStcXHMqPVxccyooPzpcIlteXCJdKlwifCdbXiddKid8W1xcdy1dKylcXHMqXFxdKSg/OixcXHMqKD86XFwqfCNbXFx3LV0rfFxcLltcXHctXSt8KD86W1xcdy1dK3xcXCopKD86Oig/OltcXHctXSsoPzpcXChbXFx3LV0rXFwpKT8pKyk/KD86XFxbKD86W1xcdy1dKyg/Oig/Oj18fj18XFx8PXxcXCo9fFxcJD18XFxePSlcXHMqKD86XCJbXlwiXSpcInwnW14nXSonfFtcXHctXSspXFxzKik/KT9cXF0pK3xcXFtcXHMqW1xcdy1dK1xccyo9XFxzKig/OlwiW15cIl0qXCJ8J1teJ10qJ3xbXFx3LV0rKVxccypcXF0pKSokLyxcclxuXHRcdGJvb2xlYW46IC9eKFRSVUV8RkFMU0UpJC9pLFxyXG5cdFx0Y29sb3JDb2RlSEVYOiAvXiMoW0EtRmEtZlxcZF17Myw0fXxbQS1GYS1mXFxkXXs2fXxbQS1GYS1mXFxkXXs4fSkkL2ksXHJcblx0XHRzaW1wbGVIb3RrZXk6IC9eKChBbHR8Q3RybHxTaGlmdHxNZXRhKVxcKykrW2EtelxcZF0kL2ksXHJcblx0XHRiY3A0NzogL14oPzpbYS16XXsyLDN9KD86LVthLXpdezN9KXswLDN9fFthLXpdezR9fFthLXpdezUsOH0pKD86LVthLXpdezR9KT8oPzotW2Etel17Mn18LVswLTldezN9KT8oPzotW2EtejAtOV17NSw4fXwtWzAtOV1bYS16MC05XXszfSkqKD86LVswLTlhLXd5LXpdKD86LVthLXowLTldezIsOH0pKykqKD86LXgoPzotW2EtejAtOV17MSw4fSkrKT8kfF54KD86LVthLXowLTldezEsOH0pKyQvaVxyXG5cdH07XHJcblx0Ly8gI3JlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXHJcblx0LyoqXHJcblx0ICogQ2hlY2tzIGlmIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBpcyBjb21wbGllcyB0byB0aGUge0BsaW5rIFJlZ0V4cCB9ICoqZXhwcmVzc2lvbioqLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHRvQ2hlY2tcdFx0VGhlIHZhbHVlIHRoYXQgaGFzIGNvbXBseSB0byB0aGUge0BsaW5rIFJlZ0V4cCB9ICoqZXhwcmVzc2lvbioqIGZvciB0aGlzIHtAbGluayBEQkMgfSB0byBiZSBmdWxmaWxsZWQuXHJcblx0ICogQHBhcmFtIGV4cHJlc3Npb25cdFRoZSB7QGxpbmsgUmVnRXhwIH0gdGhlIG9uZSAqKnRvQ2hlY2sqKiBoYXMgY29tcGx5IHRvIGluIG9yZGVyIGZvciB0aGlzIHtAbGluayBEQkMgfSB0byBiZVxyXG5cdCAqIFx0XHRcdFx0XHRcdGZ1bGZpbGxlZC5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFRSVUUgaWYgdGhlIHZhbHVlICoqdG9DaGVjayoqIGNvbXBsaWVzIHdpdGggdGhlIHtAbGluayBSZWdFeHAgfSAqKmV4cHJlc3Npb24qKiwgb3RoZXJ3aXNlIEZBTFNFLiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgY2hlY2tBbGdvcml0aG0oXHJcblx0XHR0b0NoZWNrOiB1bmtub3duIHwgbnVsbCB8IHVuZGVmaW5lZCxcclxuXHRcdGV4cHJlc3Npb246IFJlZ0V4cCxcclxuXHQpOiBib29sZWFuIHwgc3RyaW5nIHtcclxuXHRcdGlmICh0b0NoZWNrID09PSB1bmRlZmluZWQgfHwgdG9DaGVjayA9PT0gbnVsbCkgcmV0dXJuIHRydWU7XHJcblxyXG5cdFx0aWYgKCFleHByZXNzaW9uLnRlc3QodG9DaGVjayBhcyBzdHJpbmcpKSB7XHJcblx0XHRcdHJldHVybiBgVmFsdWUgaGFzIHRvIGNvbXBseSB0byByZWd1bGFyIGV4cHJlc3Npb24gXCIke2V4cHJlc3Npb259XCJgO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0cnVlO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBBIHBhcmFtZXRlci1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXHJcblx0ICogYnkgdGhlIHRhZ2dlZCBwYXJhbWV0ZXIuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gZXhwcmVzc2lvblx0U2VlIHtAbGluayBSRUdFWC5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXHJcblx0ICogQHBhcmFtIGRiY1x0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uICovXHJcblx0cHVibGljIHN0YXRpYyBQUkUoXHJcblx0XHRleHByZXNzaW9uOiBSZWdFeHAsXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRoaW50OiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmM6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHQpOiAoXHJcblx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdG1ldGhvZE5hbWU6IHN0cmluZyB8IHN5bWJvbCxcclxuXHRcdHBhcmFtZXRlckluZGV4OiBudW1iZXIsXHJcblx0KSA9PiB2b2lkIHtcclxuXHRcdHJldHVybiBEQkMuZGVjUHJlY29uZGl0aW9uKFxyXG5cdFx0XHQoXHJcblx0XHRcdFx0dmFsdWU6IHN0cmluZyxcclxuXHRcdFx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdFx0XHRtZXRob2ROYW1lOiBzdHJpbmcsXHJcblx0XHRcdFx0cGFyYW1ldGVySW5kZXg6IG51bWJlcixcclxuXHRcdFx0KSA9PiB7XHJcblx0XHRcdFx0cmV0dXJuIFJFR0VYLmNoZWNrQWxnb3JpdGhtKHZhbHVlLCBleHByZXNzaW9uKTtcclxuXHRcdFx0fSxcclxuXHRcdFx0ZGJjLFxyXG5cdFx0XHRwYXRoLFxyXG5cdFx0XHRoaW50XHJcblx0XHQpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBBIG1ldGhvZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXHJcblx0ICogYnkgdGhlIHRhZ2dlZCBtZXRob2QncyByZXR1cm52YWx1ZS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBleHByZXNzaW9uXHRTZWUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIHBhdGhcdFx0XHRTZWUge0BsaW5rIERCQy5Qb3N0Y29uZGl0aW9uIH0uXHJcblx0ICogQHBhcmFtIGRiY1x0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1Bvc3Rjb25kaXRpb24gfS5cclxuXHQgKiBAcGFyYW0gaGludFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1Bvc3Rjb25kaXRpb24gfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY1Bvc3Rjb25kaXRpb24gfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIFBPU1QoXHJcblx0XHRleHByZXNzaW9uOiBSZWdFeHAsXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRoaW50OiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmM6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHQpOiAoXHJcblx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdHByb3BlcnR5S2V5OiBzdHJpbmcsXHJcblx0XHRkZXNjcmlwdG9yOiBQcm9wZXJ0eURlc2NyaXB0b3IsXHJcblx0KSA9PiBQcm9wZXJ0eURlc2NyaXB0b3Ige1xyXG5cdFx0cmV0dXJuIERCQy5kZWNQb3N0Y29uZGl0aW9uKFxyXG5cdFx0XHQodmFsdWU6IHN0cmluZywgdGFyZ2V0OiBvYmplY3QsIHByb3BlcnR5S2V5OiBzdHJpbmcpID0+IHtcclxuXHRcdFx0XHRyZXR1cm4gUkVHRVguY2hlY2tBbGdvcml0aG0odmFsdWUsIGV4cHJlc3Npb24pO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRkYmMsXHJcblx0XHRcdHBhdGgsXHJcblx0XHRcdGhpbnRcclxuXHRcdCk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgZmllbGQtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBSRUdFWC5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxyXG5cdCAqIGJ5IHRoZSB0YWdnZWQgZmllbGQuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gZXhwcmVzc2lvblx0U2VlIHtAbGluayBSRUdFWC5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRcdFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXHJcblx0ICogQHBhcmFtIGRiY1x0XHRcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxyXG5cdCAqIEBwYXJhbSBoaW50XHRcdFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uICovXHJcblx0cHVibGljIHN0YXRpYyBJTlZBUklBTlQoXHJcblx0XHRleHByZXNzaW9uOiBSZWdFeHAsXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRoaW50OiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmM6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHQpIHtcclxuXHRcdHJldHVybiBEQkMuZGVjSW52YXJpYW50KFtuZXcgUkVHRVgoZXhwcmVzc2lvbildLCBwYXRoLCBkYmMsIGhpbnQpO1xyXG5cdH1cclxuXHQvLyAjZW5kcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvLyAjcmVnaW9uIFJlZmVyZW5jZWQgQ29uZGl0aW9uIGNoZWNraW5nLlxyXG5cdC8vXHJcblx0Ly8gRm9yIHVzYWdlIGluIGR5bmFtaWMgc2NlbmFyaW9zIChsaWtlIHdpdGggQUUtREJDKS5cclxuXHQvL1xyXG5cdC8qKlxyXG5cdCAqIEludm9rZXMgdGhlIHtAbGluayBSRUdFWC5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqIGFuZCB7QGxpbmsgUkVHRVguZXF1aXZhbGVudCB9LlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHRvQ2hlY2sgU2VlIHtAbGluayBSRUdFWC5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBFUS5jaGVja0FsZ29yaXRobX0uICovXHJcblx0cHVibGljIGNoZWNrKHRvQ2hlY2s6IHVua25vd24gfCBudWxsIHwgdW5kZWZpbmVkKSB7XHJcblx0XHRyZXR1cm4gUkVHRVguY2hlY2tBbGdvcml0aG0odG9DaGVjaywgdGhpcy5leHByZXNzaW9uKTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogVHlwZS1zYWZlIGNoZWNrIHRoYXQgdmFsaWRhdGVzIGEgdmFsdWUgYWdhaW5zdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBhbmQgcmV0dXJucyBpdCBhcyB0aGUgc3BlY2lmaWVkIHR5cGUuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdG9DaGVja1x0XHRUaGUgdmFsdWUgdG8gY2hlY2sgYWdhaW5zdCB0aGUgcmVndWxhciBleHByZXNzaW9uLlxyXG5cdCAqIEBwYXJhbSBleHByZXNzaW9uXHRUaGUgcmVndWxhciBleHByZXNzaW9uIHRvIHZhbGlkYXRlIGFnYWluc3QuXHJcblx0ICogQHBhcmFtIGhpbnRcdFx0XHRPcHRpb25hbCBoaW50IG1lc3NhZ2UgdG8gaW5jbHVkZSBpbiB0aGUgZXJyb3IgaWYgdmFsaWRhdGlvbiBmYWlscy5cclxuXHQgKiBAcGFyYW0gaWRcdFx0XHRPcHRpb25hbCBpZGVudGlmaWVyIHRvIGluY2x1ZGUgaW4gdGhlIGVycm9yIG1lc3NhZ2UuXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBUaGUgdmFsaWRhdGVkIHZhbHVlIGNhc3QgdG8gdGhlIENBTkRJREFURSB0eXBlLlxyXG5cdCAqIFxyXG5cdCAqIEB0aHJvd3Mge0BsaW5rIERCQy5JbmZyaW5nZW1lbnR9IGlmIHRoZSB2YWx1ZSBkb2VzIG5vdCBtYXRjaCB0aGUgcmVndWxhciBleHByZXNzaW9uLiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgdHNDaGVjazxDQU5ESURBVEUgPSB1bmtub3duPih0b0NoZWNrOiBhbnksIGV4cHJlc3Npb246IFJlZ0V4cCwgaGludDogc3RyaW5nID0gdW5kZWZpbmVkLCBpZDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKTogQ0FORElEQVRFIHtcclxuXHRcdGNvbnN0IHJlc3VsdCA9IFJFR0VYLmNoZWNrQWxnb3JpdGhtKHRvQ2hlY2ssIGV4cHJlc3Npb24pO1xyXG5cclxuXHRcdGlmIChyZXN1bHQpIHtcclxuXHRcdFx0cmV0dXJuIHRvQ2hlY2s7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dGhyb3cgbmV3IERCQy5JbmZyaW5nZW1lbnQoYCR7aWQgPyBgKCR7aWR9KSBgIDogXCJcIn0ke3Jlc3VsdCBhcyBzdHJpbmd9JHtoaW50ID8gYCBcdTI3MjggJHtoaW50fSBcdTI3MjhgIDogXCJcIn1gKTtcclxuXHRcdH1cclxuXHR9XHJcblx0LyoqXHJcblx0ICogQ3JlYXRlcyB0aGlzIHtAbGluayBSRUdFWCB9IGJ5IHNldHRpbmcgdGhlIHByb3RlY3RlZCBwcm9wZXJ0eSB7QGxpbmsgUkVHRVguZXhwcmVzc2lvbiB9IHVzZWQgYnkge0BsaW5rIFJFR0VYLmNoZWNrIH0uXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gZXhwcmVzc2lvbiBTZWUge0BsaW5rIFJFR0VYLmNoZWNrIH0uICovXHJcblx0cHVibGljIGNvbnN0cnVjdG9yKHByb3RlY3RlZCBleHByZXNzaW9uOiBSZWdFeHApIHtcclxuXHRcdHN1cGVyKCk7XHJcblx0fVxyXG5cdC8vICNlbmRyZWdpb24gUmVmZXJlbmNlZCBDb25kaXRpb24gY2hlY2tpbmcuXHJcblx0Ly8gI3JlZ2lvbiBJbi1NZXRob2QgY2hlY2tpbmcuXHJcblx0LyoqXHJcblx0ICogSW52b2tlcyB0aGUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtIH0gcGFzc2luZyB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHtAbGluayBSRUdFWC5leHByZXNzaW9uIH0uXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdG9DaGVja1x0XHRTZWUge0BsaW5rIFJFR0VYLmNoZWNrQWxnb3JpdGhtfS5cclxuXHQgKiBAcGFyYW0gZXhwcmVzc2lvblx0U2VlIHtAbGluayBSRUdFWC5jaGVja0FsZ29yaXRobX0uXHJcblx0ICovXHJcblx0cHVibGljIHN0YXRpYyBjaGVjayh0b0NoZWNrOiB1bmtub3duIHwgbnVsbCB8IHVuZGVmaW5lZCwgZXhwcmVzc2lvbjogUmVnRXhwKSB7XHJcblx0XHRjb25zdCBjaGVja1Jlc3VsdCA9IFJFR0VYLmNoZWNrQWxnb3JpdGhtKHRvQ2hlY2ssIGV4cHJlc3Npb24pO1xyXG5cclxuXHRcdGlmICh0eXBlb2YgY2hlY2tSZXN1bHQgPT09IFwic3RyaW5nXCIpIHtcclxuXHRcdFx0dGhyb3cgbmV3IERCQy5JbmZyaW5nZW1lbnQoY2hlY2tSZXN1bHQpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHQvLyAjZW5kcmVnaW9uIEluLU1ldGhvZCBjaGVja2luZy5cclxufVxyXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7OztBQU1PLElBQU0sUUFBTixNQUFNLGVBQWMsSUFBSTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUE2SnZCLFlBQXNCLFlBQW9CO0FBQ2hELFVBQU07QUFEc0I7QUFBQSxFQUU3QjtBQUFBO0FBQUEsRUE3SkEsT0FBYyxTQUFTO0FBQUEsSUFDdEIsbUJBQW1CO0FBQUEsSUFDbkIsT0FBTztBQUFBLElBQ1AsVUFBVTtBQUFBLElBQ1YsS0FBSztBQUFBLElBQ0wsU0FBUztBQUFBLElBQ1QsTUFBTTtBQUFBLElBQ04sWUFDQztBQUFBLElBQ0QsYUFDQztBQUFBLElBQ0QsU0FBUztBQUFBLElBQ1QsY0FBYztBQUFBLElBQ2QsY0FBYztBQUFBLElBQ2QsT0FBTztBQUFBLEVBQ1I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVBLE9BQWMsZUFDYixTQUNBLFlBQ21CO0FBQ25CLFFBQUksWUFBWSxVQUFhLFlBQVksS0FBTSxRQUFPO0FBRXRELFFBQUksQ0FBQyxXQUFXLEtBQUssT0FBaUIsR0FBRztBQUN4QyxhQUFPLDhDQUE4QyxVQUFVO0FBQUEsSUFDaEU7QUFFQSxXQUFPO0FBQUEsRUFDUjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVUEsT0FBYyxJQUNiLFlBQ0EsT0FBMkIsUUFDM0IsT0FBMkIsUUFDM0IsTUFBMEIsUUFLakI7QUFDVCxXQUFPLElBQUk7QUFBQSxNQUNWLENBQ0MsT0FDQSxRQUNBLFlBQ0EsbUJBQ0k7QUFDSixlQUFPLE9BQU0sZUFBZSxPQUFPLFVBQVU7QUFBQSxNQUM5QztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Q7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVdBLE9BQWMsS0FDYixZQUNBLE9BQTJCLFFBQzNCLE9BQTJCLFFBQzNCLE1BQTBCLFFBS0g7QUFDdkIsV0FBTyxJQUFJO0FBQUEsTUFDVixDQUFDLE9BQWUsUUFBZ0IsZ0JBQXdCO0FBQ3ZELGVBQU8sT0FBTSxlQUFlLE9BQU8sVUFBVTtBQUFBLE1BQzlDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVBLE9BQWMsVUFDYixZQUNBLE9BQTJCLFFBQzNCLE9BQTJCLFFBQzNCLE1BQTBCLFFBQ3pCO0FBQ0QsV0FBTyxJQUFJLGFBQWEsQ0FBQyxJQUFJLE9BQU0sVUFBVSxDQUFDLEdBQUcsTUFBTSxLQUFLLElBQUk7QUFBQSxFQUNqRTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVlPLE1BQU0sU0FBcUM7QUFDakQsV0FBTyxPQUFNLGVBQWUsU0FBUyxLQUFLLFVBQVU7QUFBQSxFQUNyRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVlBLE9BQWMsUUFBNkIsU0FBYyxZQUFvQixPQUFlLFFBQVcsS0FBeUIsUUFBc0I7QUFDckosVUFBTSxTQUFTLE9BQU0sZUFBZSxTQUFTLFVBQVU7QUFFdkQsUUFBSSxRQUFRO0FBQ1gsYUFBTztBQUFBLElBQ1IsT0FDSztBQUNKLFlBQU0sSUFBSSxJQUFJLGFBQWEsR0FBRyxLQUFLLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxNQUFnQixHQUFHLE9BQU8sV0FBTSxJQUFJLFlBQU8sRUFBRSxFQUFFO0FBQUEsSUFDckc7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBZ0JBLE9BQWMsTUFBTSxTQUFxQyxZQUFvQjtBQUM1RSxVQUFNLGNBQWMsT0FBTSxlQUFlLFNBQVMsVUFBVTtBQUU1RCxRQUFJLE9BQU8sZ0JBQWdCLFVBQVU7QUFDcEMsWUFBTSxJQUFJLElBQUksYUFBYSxXQUFXO0FBQUEsSUFDdkM7QUFBQSxFQUNEO0FBQUE7QUFFRDsiLAogICJuYW1lcyI6IFtdCn0K
