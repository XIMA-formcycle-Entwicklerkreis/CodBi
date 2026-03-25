import { DBC } from "./chunk-LFRFVRJV.js";

// ../../node_modules/xdbc/src/DBC/OR.ts
var OR = class _OR extends DBC {
  /**
   * Creates this {@link OR } by setting the protected property {@link OR.conditions } used by {@link OR.check }.
   *
   * @param conditions See {@link OR.check }. */
  constructor(conditions) {
    super();
    this.conditions = conditions;
  }
  // #region Condition checking.
  /**
   * Checks the **value** against the given **conditions**
   *
   * @param conditions	The **{ check: (toCheck: any) => boolean | string }**-{@link object }s to check the **value** against.
   * @param value			Either **value**-{@link Array < any >}, which's elements will be checked, or the value to be
   * 						checked itself.
   * @param index			If specified with "idxEnd" being undefined, this {@link Number } will be seen as the index of
   * 						the value-{@link Array }'s element to check. If value isn't an {@link Array } this parameter
   * 						will not have any effect.
   * 						With "idxEnd" not undefined this parameter indicates the beginning of the span of elements to
   * 						check within the value-{@link Array }.
   * @param idxEnd		Indicates the last element's index (including) of the span of value-{@link Array } elements to check.
   * 						Setting this parameter to -1 specifies that all value-{@link Array }'s elements beginning from the
   * 						specified **index** shall be checked.
   *
   * @returns TRUE if at least one of the provided **conditions** is fulfilled, otherwise a {@link string } containing all **conditions** returned {@link string }s separated by " || ". */
  static checkAlgorithm(conditions, value) {
    let result = "";
    for (let i = 0; i < conditions.length; i++) {
      const conditionResult = conditions[i].check(value);
      if (typeof conditionResult === "string") {
        result += `${conditionResult}${i === conditions.length - 1 ? "" : " or "}`;
      } else {
        return true;
      }
    }
    return result;
  }
  /**
   * A parameter-decorator factory using the {@link OR.checkAlgorithm } with either multiple or a single one
   * of the **realConditions** to check the tagged parameter-value against with.
   * When specifying an **index** and the tagged parameter's **value** is an {@link Array }, the **realConditions** apply to the
   * element at the specified **index**.
   * If the {@link Array } is too short the currently processed { check: (toCheck: any) => boolean | string } of
   * **realConditions** will be verified to TRUE automatically, considering optional parameters.
   * If an **index** is specified but the tagged parameter's value isn't an array, the **index** is treated as being undefined.
   * If **index** is undefined and the tagged parameter's value is an {@link Array } each element of it will be checked
   * against the **realConditions**.
   *
   * @param realConditions	Either one or more **{ check: (toCheck: any) => boolean | string }** to check the tagged parameter-value
   * 							against with.
   * @param path				See {@link DBC.decPrecondition }.
   * @param dbc				See {@link DBC.decPrecondition }.
   *
   * @returns	A {@link string } as soon as one { check: (toCheck: any) => boolean | string } of **realConditions** returns one.
   * 			Otherwise TRUE. */
  static PRE(conditions, path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decPrecondition(
      (value, target, methodName, parameterIndex) => {
        return _OR.checkAlgorithm(conditions, value);
      },
      dbc,
      path,
      hint,
    );
  }
  /**
   * A method-decorator factory using the {@link OR.checkAlgorithm } with either multiple or a single one
   * of the **realConditions** to check the tagged method's return-value against with.
   *
   * @param realConditions	Either one or more { check: (toCheck: any) => boolean | string } to check the tagged parameter-value
   * 							against with.
   * @param path				See {@link DBC.decPrecondition }.
   * @param dbc				See {@link DBC.decPrecondition }.
   *
   * @returns	A {@link string } as soon as one **{ check: (toCheck: any) => boolean | string }** of **realConditions** return one.
   * 			Otherwise TRUE. */
  static POST(conditions, path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decPostcondition(
      (value, target, propertyKey) => {
        return _OR.checkAlgorithm(conditions, value);
      },
      dbc,
      path,
      hint,
    );
  }
  /**
   * A field-decorator factory using the {@link OR.checkAlgorithm } with either multiple or a single one
   * of the **realConditions** to check the tagged field.
   *
   * @param realConditions	Either one or more { check: (toCheck: any) => boolean | string } to check the tagged parameter-value
   * 							against with.
   * @param path				See {@link DBC.decInvariant }.
   * @param dbc				See {@link DBC.decInvariant }.
   *
   * @returns	See {@link DBC.decInvariant }. */
  static INVARIANT(conditions, path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decInvariant([new _OR(conditions)], path, dbc, hint);
  }
  // #endregion Condition checking.
  // #region Referenced Condition checking.
  //
  // For usage in dynamic scenarios (like global functions).
  //
  /**
   * Invokes the {@link OR.checkAlgorithm } passing the value **toCheck** and {@link OR.conditions }.
   *
   * @param toCheck See {@link OR.checkAlgorithm }.
   *
   * @returns See {@link OR.checkAlgorithm}. */
  check(toCheck) {
    return _OR.checkAlgorithm(this.conditions, toCheck);
  }
  /**
   * Invokes the {@link OR.checkAlgorithm } passing the value **toCheck** and the {@link OR.type } .
   *
   * @param toCheck See {@link OR.checkAlgorithm }.
   *
   * @returns The **CANDIDATE** **toCheck** doesn't fulfill this {@link OR }.
   *
   * @throws A {@link DBC.Infringement } if the **CANDIDATE** **toCheck** does not fulfill this {@link OR }.*/
  static tsCheck(toCheck, conditions, hint = void 0, id = void 0) {
    const result = _OR.checkAlgorithm(conditions, toCheck);
    if (result) {
      return toCheck;
    } else {
      throw new DBC.Infringement(`${id ? `(${id}) ` : ""}${result}${hint ? ` \u2728 ${hint} \u2728` : ""}`);
    }
  }
  // #endregion Referenced Condition checking.
};

export { OR };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3hkYmMvc3JjL0RCQy9PUi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgREJDIH0gZnJvbSBcIi4uL0RCQ1wiO1xyXG4vKipcclxuICogQSB7QGxpbmsgREJDIH0gZGVmaW5pbmcgdGhhdCBhbGwgZWxlbWVudHMgb2YgYW4ge0BsaW5rIG9iamVjdCB9cyBoYXZlIHRvIGZ1bGZpbGxcclxuICogb25lIG9mIHRoZSBnaXZlbiB7QGxpbmsgb2JqZWN0IH1zIGNoZWNrLW1ldGhvZHMgKCoqKCB0b0NoZWNrIDogYW55ICkgPT4gYm9vbGVhbiB8IHN0cmluZyoqICkuXHJcbiAqXHJcbiAqIEByZW1hcmtzXHJcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoWERCQ0BXYVhDb2RlLm5ldCkgKi9cclxuZXhwb3J0IGNsYXNzIE9SIGV4dGVuZHMgREJDIHtcclxuXHQvLyAjcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvKipcclxuXHQgKiBDaGVja3MgdGhlICoqdmFsdWUqKiBhZ2FpbnN0IHRoZSBnaXZlbiAqKmNvbmRpdGlvbnMqKlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIGNvbmRpdGlvbnNcdFRoZSAqKnsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSoqLXtAbGluayBvYmplY3QgfXMgdG8gY2hlY2sgdGhlICoqdmFsdWUqKiBhZ2FpbnN0LlxyXG5cdCAqIEBwYXJhbSB2YWx1ZVx0XHRcdEVpdGhlciAqKnZhbHVlKiote0BsaW5rIEFycmF5IDwgYW55ID59LCB3aGljaCdzIGVsZW1lbnRzIHdpbGwgYmUgY2hlY2tlZCwgb3IgdGhlIHZhbHVlIHRvIGJlXHJcblx0ICogXHRcdFx0XHRcdFx0Y2hlY2tlZCBpdHNlbGYuXHJcblx0ICogQHBhcmFtIGluZGV4XHRcdFx0SWYgc3BlY2lmaWVkIHdpdGggXCJpZHhFbmRcIiBiZWluZyB1bmRlZmluZWQsIHRoaXMge0BsaW5rIE51bWJlciB9IHdpbGwgYmUgc2VlbiBhcyB0aGUgaW5kZXggb2ZcclxuXHQgKiBcdFx0XHRcdFx0XHR0aGUgdmFsdWUte0BsaW5rIEFycmF5IH0ncyBlbGVtZW50IHRvIGNoZWNrLiBJZiB2YWx1ZSBpc24ndCBhbiB7QGxpbmsgQXJyYXkgfSB0aGlzIHBhcmFtZXRlclxyXG5cdCAqIFx0XHRcdFx0XHRcdHdpbGwgbm90IGhhdmUgYW55IGVmZmVjdC5cclxuXHQgKiBcdFx0XHRcdFx0XHRXaXRoIFwiaWR4RW5kXCIgbm90IHVuZGVmaW5lZCB0aGlzIHBhcmFtZXRlciBpbmRpY2F0ZXMgdGhlIGJlZ2lubmluZyBvZiB0aGUgc3BhbiBvZiBlbGVtZW50cyB0b1xyXG5cdCAqIFx0XHRcdFx0XHRcdGNoZWNrIHdpdGhpbiB0aGUgdmFsdWUte0BsaW5rIEFycmF5IH0uXHJcblx0ICogQHBhcmFtIGlkeEVuZFx0XHRJbmRpY2F0ZXMgdGhlIGxhc3QgZWxlbWVudCdzIGluZGV4IChpbmNsdWRpbmcpIG9mIHRoZSBzcGFuIG9mIHZhbHVlLXtAbGluayBBcnJheSB9IGVsZW1lbnRzIHRvIGNoZWNrLlxyXG5cdCAqIFx0XHRcdFx0XHRcdFNldHRpbmcgdGhpcyBwYXJhbWV0ZXIgdG8gLTEgc3BlY2lmaWVzIHRoYXQgYWxsIHZhbHVlLXtAbGluayBBcnJheSB9J3MgZWxlbWVudHMgYmVnaW5uaW5nIGZyb20gdGhlXHJcblx0ICogXHRcdFx0XHRcdFx0c3BlY2lmaWVkICoqaW5kZXgqKiBzaGFsbCBiZSBjaGVja2VkLlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgVFJVRSBpZiBhdCBsZWFzdCBvbmUgb2YgdGhlIHByb3ZpZGVkICoqY29uZGl0aW9ucyoqIGlzIGZ1bGZpbGxlZCwgb3RoZXJ3aXNlIGEge0BsaW5rIHN0cmluZyB9IGNvbnRhaW5pbmcgYWxsICoqY29uZGl0aW9ucyoqIHJldHVybmVkIHtAbGluayBzdHJpbmcgfXMgc2VwYXJhdGVkIGJ5IFwiIHx8IFwiLiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgY2hlY2tBbGdvcml0aG0oXHJcblx0XHRjb25kaXRpb25zOiBBcnJheTx7XHJcblx0XHRcdGNoZWNrOiAodG9DaGVjazogdW5rbm93biB8IHVuZGVmaW5lZCB8IG51bGwgfCBvYmplY3QpID0+IGJvb2xlYW4gfCBzdHJpbmc7XHJcblx0XHR9PixcclxuXHRcdHZhbHVlOiB1bmtub3duIHwgbnVsbCB8IHVuZGVmaW5lZCxcclxuXHQpOiBib29sZWFuIHwgc3RyaW5nIHtcclxuXHRcdGxldCByZXN1bHQgPSBcIlwiO1xyXG5cclxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgY29uZGl0aW9ucy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRjb25zdCBjb25kaXRpb25SZXN1bHQgPSBjb25kaXRpb25zW2ldLmNoZWNrKHZhbHVlKTtcclxuXHJcblx0XHRcdGlmICh0eXBlb2YgY29uZGl0aW9uUmVzdWx0ID09PSBcInN0cmluZ1wiKSB7XHJcblx0XHRcdFx0cmVzdWx0ICs9IGAke2NvbmRpdGlvblJlc3VsdH0ke2kgPT09IGNvbmRpdGlvbnMubGVuZ3RoIC0gMSA/IFwiXCIgOiBcIiBvciBcIn1gO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHJlc3VsdDtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogQSBwYXJhbWV0ZXItZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBPUi5jaGVja0FsZ29yaXRobSB9IHdpdGggZWl0aGVyIG11bHRpcGxlIG9yIGEgc2luZ2xlIG9uZVxyXG5cdCAqIG9mIHRoZSAqKnJlYWxDb25kaXRpb25zKiogdG8gY2hlY2sgdGhlIHRhZ2dlZCBwYXJhbWV0ZXItdmFsdWUgYWdhaW5zdCB3aXRoLlxyXG5cdCAqIFdoZW4gc3BlY2lmeWluZyBhbiAqKmluZGV4KiogYW5kIHRoZSB0YWdnZWQgcGFyYW1ldGVyJ3MgKip2YWx1ZSoqIGlzIGFuIHtAbGluayBBcnJheSB9LCB0aGUgKipyZWFsQ29uZGl0aW9ucyoqIGFwcGx5IHRvIHRoZVxyXG5cdCAqIGVsZW1lbnQgYXQgdGhlIHNwZWNpZmllZCAqKmluZGV4KiouXHJcblx0ICogSWYgdGhlIHtAbGluayBBcnJheSB9IGlzIHRvbyBzaG9ydCB0aGUgY3VycmVudGx5IHByb2Nlc3NlZCB7IGNoZWNrOiAodG9DaGVjazogYW55KSA9PiBib29sZWFuIHwgc3RyaW5nIH0gb2ZcclxuXHQgKiAqKnJlYWxDb25kaXRpb25zKiogd2lsbCBiZSB2ZXJpZmllZCB0byBUUlVFIGF1dG9tYXRpY2FsbHksIGNvbnNpZGVyaW5nIG9wdGlvbmFsIHBhcmFtZXRlcnMuXHJcblx0ICogSWYgYW4gKippbmRleCoqIGlzIHNwZWNpZmllZCBidXQgdGhlIHRhZ2dlZCBwYXJhbWV0ZXIncyB2YWx1ZSBpc24ndCBhbiBhcnJheSwgdGhlICoqaW5kZXgqKiBpcyB0cmVhdGVkIGFzIGJlaW5nIHVuZGVmaW5lZC5cclxuXHQgKiBJZiAqKmluZGV4KiogaXMgdW5kZWZpbmVkIGFuZCB0aGUgdGFnZ2VkIHBhcmFtZXRlcidzIHZhbHVlIGlzIGFuIHtAbGluayBBcnJheSB9IGVhY2ggZWxlbWVudCBvZiBpdCB3aWxsIGJlIGNoZWNrZWRcclxuXHQgKiBhZ2FpbnN0IHRoZSAqKnJlYWxDb25kaXRpb25zKiouXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gcmVhbENvbmRpdGlvbnNcdEVpdGhlciBvbmUgb3IgbW9yZSAqKnsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSoqIHRvIGNoZWNrIHRoZSB0YWdnZWQgcGFyYW1ldGVyLXZhbHVlXHJcblx0ICogXHRcdFx0XHRcdFx0XHRhZ2FpbnN0IHdpdGguXHJcblx0ICogQHBhcmFtIHBhdGhcdFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqIEBwYXJhbSBkYmNcdFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnNcdEEge0BsaW5rIHN0cmluZyB9IGFzIHNvb24gYXMgb25lIHsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSBvZiAqKnJlYWxDb25kaXRpb25zKiogcmV0dXJucyBvbmUuXHJcblx0ICogXHRcdFx0T3RoZXJ3aXNlIFRSVUUuICovXHJcblx0cHVibGljIHN0YXRpYyBQUkUoXHJcblx0XHRjb25kaXRpb25zOiBBcnJheTx7XHJcblx0XHRcdGNoZWNrOiAodG9DaGVjazogdW5rbm93biB8IHVuZGVmaW5lZCB8IG51bGwgfCBvYmplY3QpID0+IGJvb2xlYW4gfCBzdHJpbmc7XHJcblx0XHR9PixcclxuXHRcdHBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGhpbnQ6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGRiYzogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdCk6IChcclxuXHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0bWV0aG9kTmFtZTogc3RyaW5nIHwgc3ltYm9sLFxyXG5cdFx0cGFyYW1ldGVySW5kZXg6IG51bWJlcixcclxuXHQpID0+IHZvaWQge1xyXG5cdFx0cmV0dXJuIERCQy5kZWNQcmVjb25kaXRpb24oXHJcblx0XHRcdChcclxuXHRcdFx0XHR2YWx1ZTogb2JqZWN0LFxyXG5cdFx0XHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0XHRcdG1ldGhvZE5hbWU6IHN0cmluZyxcclxuXHRcdFx0XHRwYXJhbWV0ZXJJbmRleDogbnVtYmVyLFxyXG5cdFx0XHQpID0+IHtcclxuXHRcdFx0XHRyZXR1cm4gT1IuY2hlY2tBbGdvcml0aG0oY29uZGl0aW9ucywgdmFsdWUpO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRkYmMsXHJcblx0XHRcdHBhdGgsXHJcblx0XHRcdGhpbnRcclxuXHRcdCk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgT1IuY2hlY2tBbGdvcml0aG0gfSB3aXRoIGVpdGhlciBtdWx0aXBsZSBvciBhIHNpbmdsZSBvbmVcclxuXHQgKiBvZiB0aGUgKipyZWFsQ29uZGl0aW9ucyoqIHRvIGNoZWNrIHRoZSB0YWdnZWQgbWV0aG9kJ3MgcmV0dXJuLXZhbHVlIGFnYWluc3Qgd2l0aC5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSByZWFsQ29uZGl0aW9uc1x0RWl0aGVyIG9uZSBvciBtb3JlIHsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSB0byBjaGVjayB0aGUgdGFnZ2VkIHBhcmFtZXRlci12YWx1ZVxyXG5cdCAqIFx0XHRcdFx0XHRcdFx0YWdhaW5zdCB3aXRoLlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cclxuXHQgKiBAcGFyYW0gZGJjXHRcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zXHRBIHtAbGluayBzdHJpbmcgfSBhcyBzb29uIGFzIG9uZSAqKnsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSoqIG9mICoqcmVhbENvbmRpdGlvbnMqKiByZXR1cm4gb25lLlxyXG5cdCAqIFx0XHRcdE90aGVyd2lzZSBUUlVFLiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgUE9TVChcclxuXHRcdGNvbmRpdGlvbnM6IEFycmF5PHtcclxuXHRcdFx0Y2hlY2s6ICh0b0NoZWNrOiB1bmtub3duIHwgdW5kZWZpbmVkIHwgbnVsbCB8IG9iamVjdCkgPT4gYm9vbGVhbiB8IHN0cmluZztcclxuXHRcdH0+LFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0aGludDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0KTogKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRwcm9wZXJ0eUtleTogc3RyaW5nLFxyXG5cdFx0ZGVzY3JpcHRvcjogUHJvcGVydHlEZXNjcmlwdG9yLFxyXG5cdCkgPT4gUHJvcGVydHlEZXNjcmlwdG9yIHtcclxuXHRcdHJldHVybiBEQkMuZGVjUG9zdGNvbmRpdGlvbihcclxuXHRcdFx0KHZhbHVlOiBvYmplY3QsIHRhcmdldDogb2JqZWN0LCBwcm9wZXJ0eUtleTogc3RyaW5nKSA9PiB7XHJcblx0XHRcdFx0cmV0dXJuIE9SLmNoZWNrQWxnb3JpdGhtKGNvbmRpdGlvbnMsIHZhbHVlKTtcclxuXHRcdFx0fSxcclxuXHRcdFx0ZGJjLFxyXG5cdFx0XHRwYXRoLFxyXG5cdFx0XHRoaW50XHJcblx0XHQpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBBIGZpZWxkLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgT1IuY2hlY2tBbGdvcml0aG0gfSB3aXRoIGVpdGhlciBtdWx0aXBsZSBvciBhIHNpbmdsZSBvbmVcclxuXHQgKiBvZiB0aGUgKipyZWFsQ29uZGl0aW9ucyoqIHRvIGNoZWNrIHRoZSB0YWdnZWQgZmllbGQuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gcmVhbENvbmRpdGlvbnNcdEVpdGhlciBvbmUgb3IgbW9yZSB7IGNoZWNrOiAodG9DaGVjazogYW55KSA9PiBib29sZWFuIHwgc3RyaW5nIH0gdG8gY2hlY2sgdGhlIHRhZ2dlZCBwYXJhbWV0ZXItdmFsdWVcclxuXHQgKiBcdFx0XHRcdFx0XHRcdGFnYWluc3Qgd2l0aC5cclxuXHQgKiBAcGFyYW0gcGF0aFx0XHRcdFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXHJcblx0ICogQHBhcmFtIGRiY1x0XHRcdFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJuc1x0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uICovXHJcblx0cHVibGljIHN0YXRpYyBJTlZBUklBTlQoXHJcblx0XHRjb25kaXRpb25zOiBBcnJheTx7XHJcblx0XHRcdGNoZWNrOiAodG9DaGVjazogdW5rbm93biB8IHVuZGVmaW5lZCB8IG51bGwgfCBvYmplY3QpID0+IGJvb2xlYW4gfCBzdHJpbmc7XHJcblx0XHR9PixcclxuXHRcdHBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGhpbnQ6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGRiYzogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdCkge1xyXG5cdFx0cmV0dXJuIERCQy5kZWNJbnZhcmlhbnQoW25ldyBPUihjb25kaXRpb25zKV0sIHBhdGgsIGRiYywgaGludCk7XHJcblx0fVxyXG5cdC8vICNlbmRyZWdpb24gQ29uZGl0aW9uIGNoZWNraW5nLlxyXG5cdC8vICNyZWdpb24gUmVmZXJlbmNlZCBDb25kaXRpb24gY2hlY2tpbmcuXHJcblx0Ly9cclxuXHQvLyBGb3IgdXNhZ2UgaW4gZHluYW1pYyBzY2VuYXJpb3MgKGxpa2UgZ2xvYmFsIGZ1bmN0aW9ucykuXHJcblx0Ly9cclxuXHQvKipcclxuXHQgKiBJbnZva2VzIHRoZSB7QGxpbmsgT1IuY2hlY2tBbGdvcml0aG0gfSBwYXNzaW5nIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBhbmQge0BsaW5rIE9SLmNvbmRpdGlvbnMgfS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0b0NoZWNrIFNlZSB7QGxpbmsgT1IuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFNlZSB7QGxpbmsgT1IuY2hlY2tBbGdvcml0aG19LiAqL1xyXG5cdHB1YmxpYyBjaGVjayh0b0NoZWNrOiB1bmtub3duIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xyXG5cdFx0cmV0dXJuIE9SLmNoZWNrQWxnb3JpdGhtKHRoaXMuY29uZGl0aW9ucywgdG9DaGVjayk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEludm9rZXMgdGhlIHtAbGluayBPUi5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqIGFuZCB0aGUge0BsaW5rIE9SLnR5cGUgfSAuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdG9DaGVjayBTZWUge0BsaW5rIE9SLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBUaGUgKipDQU5ESURBVEUqKiAqKnRvQ2hlY2sqKiBkb2Vzbid0IGZ1bGZpbGwgdGhpcyB7QGxpbmsgT1IgfS5cclxuXHQgKiBcclxuXHQgKiBAdGhyb3dzIEEge0BsaW5rIERCQy5JbmZyaW5nZW1lbnQgfSBpZiB0aGUgKipDQU5ESURBVEUqKiAqKnRvQ2hlY2sqKiBkb2VzIG5vdCBmdWxmaWxsIHRoaXMge0BsaW5rIE9SIH0uKi9cclxuXHRwdWJsaWMgc3RhdGljIHRzQ2hlY2s8Q0FORElEQVRFPih0b0NoZWNrOiB1bmtub3duIHwgdW5kZWZpbmVkIHwgbnVsbCwgY29uZGl0aW9uczogQXJyYXk8e1xyXG5cdFx0Y2hlY2s6ICh0b0NoZWNrOiB1bmtub3duIHwgdW5kZWZpbmVkIHwgbnVsbCB8IG9iamVjdCkgPT4gYm9vbGVhbiB8IHN0cmluZztcclxuXHR9PiwgaGludDogc3RyaW5nID0gdW5kZWZpbmVkLCBpZDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKTogQ0FORElEQVRFIHtcclxuXHRcdGNvbnN0IHJlc3VsdCA9IE9SLmNoZWNrQWxnb3JpdGhtKGNvbmRpdGlvbnMsIHRvQ2hlY2spO1xyXG5cclxuXHRcdGlmIChyZXN1bHQpIHtcclxuXHRcdFx0cmV0dXJuIHRvQ2hlY2sgYXMgQ0FORElEQVRFO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHRocm93IG5ldyBEQkMuSW5mcmluZ2VtZW50KGAke2lkID8gYCgke2lkfSkgYCA6IFwiXCJ9JHtyZXN1bHQgYXMgc3RyaW5nfSR7aGludCA/IGAgXHUyNzI4ICR7aGludH0gXHUyNzI4YCA6IFwiXCJ9YCk7XHJcblx0XHR9XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIENyZWF0ZXMgdGhpcyB7QGxpbmsgT1IgfSBieSBzZXR0aW5nIHRoZSBwcm90ZWN0ZWQgcHJvcGVydHkge0BsaW5rIE9SLmNvbmRpdGlvbnMgfSB1c2VkIGJ5IHtAbGluayBPUi5jaGVjayB9LlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIGNvbmRpdGlvbnMgU2VlIHtAbGluayBPUi5jaGVjayB9LiAqL1xyXG5cdHB1YmxpYyBjb25zdHJ1Y3RvcihcclxuXHRcdHByb3RlY3RlZCBjb25kaXRpb25zOiBBcnJheTx7XHJcblx0XHRcdGNoZWNrOiAodG9DaGVjazogdW5rbm93biB8IHVuZGVmaW5lZCB8IG51bGwpID0+IGJvb2xlYW4gfCBzdHJpbmc7XHJcblx0XHR9PixcclxuXHQpIHtcclxuXHRcdHN1cGVyKCk7XHJcblx0fVxyXG5cdC8vICNlbmRyZWdpb24gUmVmZXJlbmNlZCBDb25kaXRpb24gY2hlY2tpbmcuXHJcbn1cclxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7QUFPTyxJQUFNLEtBQU4sTUFBTSxZQUFXLElBQUk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBNEtwQixZQUNJLFlBR1Q7QUFDRCxVQUFNO0FBSkk7QUFBQSxFQUtYO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBaEtBLE9BQWMsZUFDYixZQUdBLE9BQ21CO0FBQ25CLFFBQUksU0FBUztBQUViLGFBQVMsSUFBSSxHQUFHLElBQUksV0FBVyxRQUFRLEtBQUs7QUFDM0MsWUFBTSxrQkFBa0IsV0FBVyxDQUFDLEVBQUUsTUFBTSxLQUFLO0FBRWpELFVBQUksT0FBTyxvQkFBb0IsVUFBVTtBQUN4QyxrQkFBVSxHQUFHLGVBQWUsR0FBRyxNQUFNLFdBQVcsU0FBUyxJQUFJLEtBQUssTUFBTTtBQUFBLE1BQ3pFLE9BQU87QUFDTixlQUFPO0FBQUEsTUFDUjtBQUFBLElBQ0Q7QUFFQSxXQUFPO0FBQUEsRUFDUjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBbUJBLE9BQWMsSUFDYixZQUdBLE9BQTJCLFFBQzNCLE9BQTJCLFFBQzNCLE1BQTBCLFFBS2pCO0FBQ1QsV0FBTyxJQUFJO0FBQUEsTUFDVixDQUNDLE9BQ0EsUUFDQSxZQUNBLG1CQUNJO0FBQ0osZUFBTyxJQUFHLGVBQWUsWUFBWSxLQUFLO0FBQUEsTUFDM0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNEO0FBQUEsRUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVlBLE9BQWMsS0FDYixZQUdBLE9BQTJCLFFBQzNCLE9BQTJCLFFBQzNCLE1BQTBCLFFBS0g7QUFDdkIsV0FBTyxJQUFJO0FBQUEsTUFDVixDQUFDLE9BQWUsUUFBZ0IsZ0JBQXdCO0FBQ3ZELGVBQU8sSUFBRyxlQUFlLFlBQVksS0FBSztBQUFBLE1BQzNDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBV0EsT0FBYyxVQUNiLFlBR0EsT0FBMkIsUUFDM0IsT0FBMkIsUUFDM0IsTUFBMEIsUUFDekI7QUFDRCxXQUFPLElBQUksYUFBYSxDQUFDLElBQUksSUFBRyxVQUFVLENBQUMsR0FBRyxNQUFNLEtBQUssSUFBSTtBQUFBLEVBQzlEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBWU8sTUFBTSxTQUFxQztBQUNqRCxXQUFPLElBQUcsZUFBZSxLQUFLLFlBQVksT0FBTztBQUFBLEVBQ2xEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBU0EsT0FBYyxRQUFtQixTQUFxQyxZQUVsRSxPQUFlLFFBQVcsS0FBeUIsUUFBc0I7QUFDNUUsVUFBTSxTQUFTLElBQUcsZUFBZSxZQUFZLE9BQU87QUFFcEQsUUFBSSxRQUFRO0FBQ1gsYUFBTztBQUFBLElBQ1IsT0FDSztBQUNKLFlBQU0sSUFBSSxJQUFJLGFBQWEsR0FBRyxLQUFLLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxNQUFnQixHQUFHLE9BQU8sV0FBTSxJQUFJLFlBQU8sRUFBRSxFQUFFO0FBQUEsSUFDckc7QUFBQSxFQUNEO0FBQUE7QUFhRDsiLAogICJuYW1lcyI6IFtdCn0K
