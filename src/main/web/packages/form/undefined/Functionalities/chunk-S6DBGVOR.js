import { DBC } from "./chunk-LFRFVRJV.js";

// ../../node_modules/xdbc/src/DBC/COMPARISON.ts
var COMPARISON = class _COMPARISON extends DBC {
  /**
   * Creates this {@link COMPARISON } by setting the protected property {@link COMPARISON.equivalent }, {@link COMPARISON.equalityPermitted } and {@link COMPARISON.invert } used by {@link COMPARISON.check }.
   *
   * @param equivalent        See {@link COMPARISON.check }.
   * @param equalityPermitted See {@link COMPARISON.check }.
   * @param invert            See {@link COMPARISON.check }. */
  constructor(equivalent, equalityPermitted = false, invert = false) {
    super();
    this.equivalent = equivalent;
    this.equalityPermitted = equalityPermitted;
    this.invert = invert;
  }
  // #region Condition checking.
  /**
   * Does a comparison between the {@link object } **toCheck** and the **equivalent**.
   *
   * @param toCheck		The value that has to be equal to it's possible **equivalent** for this {@link DBC } to be fulfilled.
   * @param equivalent	The {@link object } the one **toCheck** has to be equal to in order for this {@link DBC } to be
   * 						fulfilled.
   *
   * @returns TRUE if the value **toCheck** and the **equivalent** are equal to each other, otherwise FALSE. */
  static checkAlgorithm(toCheck, equivalent, equalityPermitted, invert) {
    if (equalityPermitted && !invert && toCheck < equivalent) {
      return `Value has to to be greater than or equal to "${equivalent}"`;
    }
    if (equalityPermitted && invert && toCheck > equivalent) {
      return `Value has to be less than or equal to "${equivalent}"`;
    }
    if (!equalityPermitted && !invert && toCheck <= equivalent) {
      return `Value has to to be greater than "${equivalent}"`;
    }
    if (!equalityPermitted && invert && toCheck >= equivalent) {
      return `Value has to be less than "${equivalent}"`;
    }
    return true;
  }
  /**
   * A parameter-decorator factory using the {@link COMPARISON.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
   * by the tagged parameter.
   *
   * @param equivalent	    See {@link COMPARISON.checkAlgorithm }.
   * @param equalityPermitted See {@link COMPARISON.checkAlgorithm }.
   * @param path			    See {@link DBC.decPrecondition }.
   * @param hint				See {@link DBC.decPrecondition }.
   * @param dbc			    See {@link DBC.decPrecondition }.
   *
   * @returns See {@link DBC.decPrecondition }. */
  static PRE(equivalent, equalityPermitted = false, invert = false, path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decPrecondition(
      (value, target, methodName, parameterIndex) => {
        return _COMPARISON.checkAlgorithm(value, equivalent, equalityPermitted, invert);
      },
      dbc,
      path,
      hint,
    );
  }
  /**
   * A method-decorator factory using the {@link COMPARISON.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
   * by the tagged method's returnvalue.
   *
   * @param equivalent	    See {@link COMPARISON.checkAlgorithm }.
   * @param equalityPermitted See {@link COMPARISON.checkAlgorithm }.
   * @param path			    See {@link DBC.Postcondition }.
   * @param hint				See {@link DBC.decPostcondition }.
   * @param dbc			    See {@link DBC.decPostcondition }.
   *
   * @returns See {@link DBC.decPostcondition }. */
  static POST(equivalent, equalityPermitted = false, invert = false, path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decPostcondition(
      (value, target, propertyKey) => {
        return _COMPARISON.checkAlgorithm(value, equalityPermitted, equivalent, invert);
      },
      dbc,
      path,
      hint,
    );
  }
  /**
   * A field-decorator factory using the {@link COMPARISON.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
   * by the tagged field.
   *
   * @param equivalent	    See {@link COMPARISON.checkAlgorithm }.
   * @param equalityPermitted See {@link COMPARISON.checkAlgorithm }.
   * @param path			    See {@link DBC.decInvariant }.
   * @param hint				See {@link DBC.decInvariant }.
   * @param dbc			    See {@link DBC.decInvariant }.
   *
   * @returns See {@link DBC.decInvariant }. */
  static INVARIANT(equivalent, equalityPermitted = false, invert = false, path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decInvariant([new _COMPARISON(equivalent, equalityPermitted, invert)], dbc, path, hint);
  }
  // #endregion Condition checking.
  // #region Referenced Condition checking.
  // #region Dynamic usage.
  /**
   * Invokes the {@link COMPARISON.checkAlgorithm } passing the value **toCheck**, {@link COMPARISON.equivalent } and {@link COMPARISON.invert }.
   *
   * @param toCheck See {@link COMPARISON.checkAlgorithm }.
   *
   * @returns See {@link COMPARISON.checkAlgorithm}. */
  check(toCheck) {
    return _COMPARISON.checkAlgorithm(toCheck, this.equivalent, this.equalityPermitted, this.invert);
  }
  // #endregion Dynamic usage.
};

// ../../node_modules/xdbc/src/DBC/COMPARISON/GREATER.ts
var GREATER = class extends COMPARISON {
  /** See {@link COMPARISON.constructor }. */
  constructor(equivalent) {
    super(equivalent, false, false);
    this.equivalent = equivalent;
  }
  /** See {@link COMPARISON.PRE }. */
  static PRE(equivalent, equalityPermitted = false, invert = false, path = void 0, hint = void 0, dbc = void 0) {
    return COMPARISON.PRE(equivalent, false, false, path, hint, dbc);
  }
  /** See {@link COMPARISON.POST }. */
  static POST(equivalent, equalityPermitted = false, invert = false, path = void 0, hint = void 0, dbc = void 0) {
    return COMPARISON.POST(equivalent, false, false, path, hint, dbc);
  }
  /** See {@link COMPARISON.INVARIANT }. */
  static INVARIANT(equivalent, equalityPermitted = false, invert = false, path = void 0, hint = void 0, dbc = void 0) {
    return COMPARISON.INVARIANT(equivalent, false, false, path, hint, dbc);
  }
};

export { GREATER };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3hkYmMvc3JjL0RCQy9DT01QQVJJU09OLnRzIiwgIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy94ZGJjL3NyYy9EQkMvQ09NUEFSSVNPTi9HUkVBVEVSLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBEQkMgfSBmcm9tIFwiLi4vREJDXCI7XG4vKipcbiAqIEEge0BsaW5rIERCQyB9IGRlZmluaW5nIGEgY29tcGFyaXNvbiBiZXR3ZWVuIHR3byB7QGxpbmsgb2JqZWN0IH1zLlxuICpcbiAqIEByZW1hcmtzXG4gKiBNYWludGFpbmVyOiBDYWxsYXJpLCBTYWx2YXRvcmUgKFhEQkNAV2FYQ29kZS5uZXQpICovXG5leHBvcnQgY2xhc3MgQ09NUEFSSVNPTiBleHRlbmRzIERCQyB7XG5cdC8vICNyZWdpb24gQ29uZGl0aW9uIGNoZWNraW5nLlxuXHQvKipcblx0ICogRG9lcyBhIGNvbXBhcmlzb24gYmV0d2VlbiB0aGUge0BsaW5rIG9iamVjdCB9ICoqdG9DaGVjayoqIGFuZCB0aGUgKiplcXVpdmFsZW50KiouXG5cdCAqXG5cdCAqIEBwYXJhbSB0b0NoZWNrXHRcdFRoZSB2YWx1ZSB0aGF0IGhhcyB0byBiZSBlcXVhbCB0byBpdCdzIHBvc3NpYmxlICoqZXF1aXZhbGVudCoqIGZvciB0aGlzIHtAbGluayBEQkMgfSB0byBiZSBmdWxmaWxsZWQuXG5cdCAqIEBwYXJhbSBlcXVpdmFsZW50XHRUaGUge0BsaW5rIG9iamVjdCB9IHRoZSBvbmUgKip0b0NoZWNrKiogaGFzIHRvIGJlIGVxdWFsIHRvIGluIG9yZGVyIGZvciB0aGlzIHtAbGluayBEQkMgfSB0byBiZVxuXHQgKiBcdFx0XHRcdFx0XHRmdWxmaWxsZWQuXG5cdCAqXG5cdCAqIEByZXR1cm5zIFRSVUUgaWYgdGhlIHZhbHVlICoqdG9DaGVjayoqIGFuZCB0aGUgKiplcXVpdmFsZW50KiogYXJlIGVxdWFsIHRvIGVhY2ggb3RoZXIsIG90aGVyd2lzZSBGQUxTRS4gKi9cblx0c3RhdGljIGNoZWNrQWxnb3JpdGhtKHRvQ2hlY2ssIGVxdWl2YWxlbnQsIGVxdWFsaXR5UGVybWl0dGVkLCBpbnZlcnQpIHtcblx0XHRpZiAoZXF1YWxpdHlQZXJtaXR0ZWQgJiYgIWludmVydCAmJiB0b0NoZWNrIDwgZXF1aXZhbGVudCkge1xuXHRcdFx0cmV0dXJuIGBWYWx1ZSBoYXMgdG8gdG8gYmUgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIFwiJHtlcXVpdmFsZW50fVwiYDtcblx0XHR9XG5cblx0XHRpZiAoZXF1YWxpdHlQZXJtaXR0ZWQgJiYgaW52ZXJ0ICYmIHRvQ2hlY2sgPiBlcXVpdmFsZW50KSB7XG5cdFx0XHRyZXR1cm4gYFZhbHVlIGhhcyB0byBiZSBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gXCIke2VxdWl2YWxlbnR9XCJgO1xuXHRcdH1cblxuXHRcdGlmICghZXF1YWxpdHlQZXJtaXR0ZWQgJiYgIWludmVydCAmJiB0b0NoZWNrIDw9IGVxdWl2YWxlbnQpIHtcblx0XHRcdHJldHVybiBgVmFsdWUgaGFzIHRvIHRvIGJlIGdyZWF0ZXIgdGhhbiBcIiR7ZXF1aXZhbGVudH1cImA7XG5cdFx0fVxuXG5cdFx0aWYgKCFlcXVhbGl0eVBlcm1pdHRlZCAmJiBpbnZlcnQgJiYgdG9DaGVjayA+PSBlcXVpdmFsZW50KSB7XG5cdFx0XHRyZXR1cm4gYFZhbHVlIGhhcyB0byBiZSBsZXNzIHRoYW4gXCIke2VxdWl2YWxlbnR9XCJgO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cdC8qKlxuXHQgKiBBIHBhcmFtZXRlci1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcblx0ICogYnkgdGhlIHRhZ2dlZCBwYXJhbWV0ZXIuXG5cdCAqXG5cdCAqIEBwYXJhbSBlcXVpdmFsZW50XHQgICAgU2VlIHtAbGluayBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtIH0uXG5cdCAqIEBwYXJhbSBlcXVhbGl0eVBlcm1pdHRlZCBTZWUge0BsaW5rIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG0gfS5cblx0ICogQHBhcmFtIHBhdGhcdFx0XHQgICAgU2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXG5cdCAqIEBwYXJhbSBoaW50XHRcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cblx0ICogQHBhcmFtIGRiY1x0XHRcdCAgICBTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cblx0ICpcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uICovXG5cdHN0YXRpYyBQUkUoXG5cdFx0ZXF1aXZhbGVudCxcblx0XHRlcXVhbGl0eVBlcm1pdHRlZCA9IGZhbHNlLFxuXHRcdGludmVydCA9IGZhbHNlLFxuXHRcdHBhdGg6IHN0cmluZyA9IHVuZGVmaW5lZCxcblx0XHRoaW50OiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXG5cdFx0ZGJjOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXG5cdCkge1xuXHRcdHJldHVybiBEQkMuZGVjUHJlY29uZGl0aW9uKFxuXHRcdFx0KHZhbHVlLCB0YXJnZXQsIG1ldGhvZE5hbWUsIHBhcmFtZXRlckluZGV4KSA9PiB7XG5cdFx0XHRcdHJldHVybiBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtKFxuXHRcdFx0XHRcdHZhbHVlLFxuXHRcdFx0XHRcdGVxdWl2YWxlbnQsXG5cdFx0XHRcdFx0ZXF1YWxpdHlQZXJtaXR0ZWQsXG5cdFx0XHRcdFx0aW52ZXJ0LFxuXHRcdFx0XHQpO1xuXHRcdFx0fSxcblx0XHRcdGRiYyxcblx0XHRcdHBhdGgsXG5cdFx0XHRoaW50XG5cdFx0KTtcblx0fVxuXHQvKipcblx0ICogQSBtZXRob2QtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXG5cdCAqIGJ5IHRoZSB0YWdnZWQgbWV0aG9kJ3MgcmV0dXJudmFsdWUuXG5cdCAqXG5cdCAqIEBwYXJhbSBlcXVpdmFsZW50XHQgICAgU2VlIHtAbGluayBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtIH0uXG5cdCAqIEBwYXJhbSBlcXVhbGl0eVBlcm1pdHRlZCBTZWUge0BsaW5rIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG0gfS5cblx0ICogQHBhcmFtIHBhdGhcdFx0XHQgICAgU2VlIHtAbGluayBEQkMuUG9zdGNvbmRpdGlvbiB9LlxuXHQgKiBAcGFyYW0gaGludFx0XHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LlxuXHQgKiBAcGFyYW0gZGJjXHRcdFx0ICAgIFNlZSB7QGxpbmsgREJDLmRlY1Bvc3Rjb25kaXRpb24gfS5cblx0ICpcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LiAqL1xuXHRzdGF0aWMgUE9TVChcblx0XHRlcXVpdmFsZW50LFxuXHRcdGVxdWFsaXR5UGVybWl0dGVkID0gZmFsc2UsXG5cdFx0aW52ZXJ0ID0gZmFsc2UsXG5cdFx0cGF0aDogc3RyaW5nID0gdW5kZWZpbmVkLFxuXHRcdGhpbnQ6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcblx0XHRkYmM6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcblx0KSB7XG5cdFx0cmV0dXJuIERCQy5kZWNQb3N0Y29uZGl0aW9uKFxuXHRcdFx0KHZhbHVlLCB0YXJnZXQsIHByb3BlcnR5S2V5KSA9PiB7XG5cdFx0XHRcdHJldHVybiBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtKFxuXHRcdFx0XHRcdHZhbHVlLFxuXHRcdFx0XHRcdGVxdWFsaXR5UGVybWl0dGVkLFxuXHRcdFx0XHRcdGVxdWl2YWxlbnQsXG5cdFx0XHRcdFx0aW52ZXJ0LFxuXHRcdFx0XHQpO1xuXHRcdFx0fSxcblx0XHRcdGRiYyxcblx0XHRcdHBhdGgsXG5cdFx0XHRoaW50XG5cdFx0KTtcblx0fVxuXHQvKipcblx0ICogQSBmaWVsZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcblx0ICogYnkgdGhlIHRhZ2dlZCBmaWVsZC5cblx0ICpcblx0ICogQHBhcmFtIGVxdWl2YWxlbnRcdCAgICBTZWUge0BsaW5rIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG0gfS5cblx0ICogQHBhcmFtIGVxdWFsaXR5UGVybWl0dGVkIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobSB9LlxuXHQgKiBAcGFyYW0gcGF0aFx0XHRcdCAgICBTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cblx0ICogQHBhcmFtIGhpbnRcdFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxuXHQgKiBAcGFyYW0gZGJjXHRcdFx0ICAgIFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxuXHQgKlxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS4gKi9cblx0c3RhdGljIElOVkFSSUFOVChcblx0XHRlcXVpdmFsZW50LFxuXHRcdGVxdWFsaXR5UGVybWl0dGVkID0gZmFsc2UsXG5cdFx0aW52ZXJ0ID0gZmFsc2UsXG5cdFx0cGF0aDogc3RyaW5nID0gdW5kZWZpbmVkLFxuXHRcdGhpbnQ6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcblx0XHRkYmM6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcblx0KSB7XG5cdFx0cmV0dXJuIERCQy5kZWNJbnZhcmlhbnQoXG5cdFx0XHRbbmV3IENPTVBBUklTT04oZXF1aXZhbGVudCwgZXF1YWxpdHlQZXJtaXR0ZWQsIGludmVydCldLFxuXHRcdFx0ZGJjLFxuXHRcdFx0cGF0aCxcblx0XHRcdGhpbnRcblx0XHQpO1xuXHR9XG5cdC8vICNlbmRyZWdpb24gQ29uZGl0aW9uIGNoZWNraW5nLlxuXHQvLyAjcmVnaW9uIFJlZmVyZW5jZWQgQ29uZGl0aW9uIGNoZWNraW5nLlxuXHQvLyAjcmVnaW9uIER5bmFtaWMgdXNhZ2UuXG5cdC8qKlxuXHQgKiBJbnZva2VzIHRoZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqLCB7QGxpbmsgQ09NUEFSSVNPTi5lcXVpdmFsZW50IH0gYW5kIHtAbGluayBDT01QQVJJU09OLmludmVydCB9LlxuXHQgKlxuXHQgKiBAcGFyYW0gdG9DaGVjayBTZWUge0BsaW5rIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG0gfS5cblx0ICpcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtfS4gKi9cblx0cHVibGljIGNoZWNrKHRvQ2hlY2spIHtcblx0XHRyZXR1cm4gQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobShcblx0XHRcdHRvQ2hlY2ssXG5cdFx0XHR0aGlzLmVxdWl2YWxlbnQsXG5cdFx0XHR0aGlzLmVxdWFsaXR5UGVybWl0dGVkLFxuXHRcdFx0dGhpcy5pbnZlcnQsXG5cdFx0KTtcblx0fVxuXHQvKipcblx0ICogQ3JlYXRlcyB0aGlzIHtAbGluayBDT01QQVJJU09OIH0gYnkgc2V0dGluZyB0aGUgcHJvdGVjdGVkIHByb3BlcnR5IHtAbGluayBDT01QQVJJU09OLmVxdWl2YWxlbnQgfSwge0BsaW5rIENPTVBBUklTT04uZXF1YWxpdHlQZXJtaXR0ZWQgfSBhbmQge0BsaW5rIENPTVBBUklTT04uaW52ZXJ0IH0gdXNlZCBieSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVjayB9LlxuXHQgKlxuXHQgKiBAcGFyYW0gZXF1aXZhbGVudCAgICAgICAgU2VlIHtAbGluayBDT01QQVJJU09OLmNoZWNrIH0uXG5cdCAqIEBwYXJhbSBlcXVhbGl0eVBlcm1pdHRlZCBTZWUge0BsaW5rIENPTVBBUklTT04uY2hlY2sgfS5cblx0ICogQHBhcmFtIGludmVydCAgICAgICAgICAgIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVjayB9LiAqL1xuXHRjb25zdHJ1Y3Rvcihcblx0XHRwdWJsaWMgZXF1aXZhbGVudCxcblx0XHRwdWJsaWMgZXF1YWxpdHlQZXJtaXR0ZWQgPSBmYWxzZSxcblx0XHRwdWJsaWMgaW52ZXJ0ID0gZmFsc2UsXG5cdCkge1xuXHRcdHN1cGVyKCk7XG5cdH1cblx0Ly8gI2VuZHJlZ2lvbiBEeW5hbWljIHVzYWdlLlxufVxuIiwgImltcG9ydCB7IENPTVBBUklTT04gfSBmcm9tIFwiLi4vQ09NUEFSSVNPTlwiO1xyXG4vKiogU2VlIHtAbGluayBDT01QQVJJU09OIH0uICovXHJcbmV4cG9ydCBjbGFzcyBHUkVBVEVSIGV4dGVuZHMgQ09NUEFSSVNPTiB7XHJcblx0LyoqIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5QUkUgfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIG92ZXJyaWRlIFBSRShcclxuXHRcdGVxdWl2YWxlbnQsXHJcblx0XHRlcXVhbGl0eVBlcm1pdHRlZCA9IGZhbHNlLFxyXG5cdFx0aW52ZXJ0ID0gZmFsc2UsXHJcblxyXG5cdFx0cGF0aDogc3RyaW5nID0gdW5kZWZpbmVkLFxyXG5cdFx0aGludDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0KSB7XHJcblx0XHRyZXR1cm4gQ09NUEFSSVNPTi5QUkUoZXF1aXZhbGVudCwgZmFsc2UsIGZhbHNlLCBwYXRoLCBoaW50LCBkYmMpO1xyXG5cdH1cclxuXHQvKiogU2VlIHtAbGluayBDT01QQVJJU09OLlBPU1QgfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIG92ZXJyaWRlIFBPU1QoXHJcblx0XHRlcXVpdmFsZW50LFxyXG5cdFx0ZXF1YWxpdHlQZXJtaXR0ZWQgPSBmYWxzZSxcclxuXHRcdGludmVydCA9IGZhbHNlLFxyXG5cdFx0cGF0aDogc3RyaW5nID0gdW5kZWZpbmVkLFxyXG5cdFx0aGludDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWRcclxuXHQpIHtcclxuXHRcdHJldHVybiBDT01QQVJJU09OLlBPU1QoZXF1aXZhbGVudCwgZmFsc2UsIGZhbHNlLCBwYXRoLCBoaW50LCBkYmMpO1xyXG5cdH1cclxuXHQvKiogU2VlIHtAbGluayBDT01QQVJJU09OLklOVkFSSUFOVCB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgb3ZlcnJpZGUgSU5WQVJJQU5UKFxyXG5cdFx0ZXF1aXZhbGVudCxcclxuXHRcdGVxdWFsaXR5UGVybWl0dGVkID0gZmFsc2UsXHJcblx0XHRpbnZlcnQgPSBmYWxzZSxcclxuXHRcdHBhdGg6IHN0cmluZyA9IHVuZGVmaW5lZCxcclxuXHRcdGhpbnQ6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGRiYzogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkXHJcblx0KSB7XHJcblx0XHRyZXR1cm4gQ09NUEFSSVNPTi5JTlZBUklBTlQoZXF1aXZhbGVudCwgZmFsc2UsIGZhbHNlLCBwYXRoLCBoaW50LCBkYmMpO1xyXG5cdH1cclxuXHQvKiogU2VlIHtAbGluayBDT01QQVJJU09OLmNvbnN0cnVjdG9yIH0uICovXHJcblx0Y29uc3RydWN0b3IocHVibGljIG92ZXJyaWRlIGVxdWl2YWxlbnQpIHtcclxuXHRcdHN1cGVyKGVxdWl2YWxlbnQsIGZhbHNlLCBmYWxzZSk7XHJcblx0fVxyXG59XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7O0FBTU8sSUFBTSxhQUFOLE1BQU0sb0JBQW1CLElBQUk7QUFBQTtBQUFB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
