import { DBC } from "./chunk-YNACB2OL.js";

// ../../node_modules/xdbc/src/DBC/AE.ts
var AE = class _AE extends DBC {
  /**
   * Creates this {@link AE } by setting the protected property {@link AE.conditions }, {@link AE.index } and {@link AE.idxEnd } used by {@link AE.check }.
   *
   * @param equivalent See {@link EQ.check }. */
  constructor(conditions, index = void 0, idxEnd = void 0) {
    super();
    this.conditions = conditions;
    this.index = index;
    this.idxEnd = idxEnd;
  }
  // #region Condition checking.
  /**
   * Checks each element of the **value**-{@link Array < any >} against the given **condition**, if it is one. If it is not
   * the **value** itself will be checked.
   *
   * @param condition	The { check: (toCheck: any) => boolean | string } to check the **value** against.
   * @param value		Either **value**-{@link Array < any >}, which's elements will be checked, or the value to be
   * 					checked itself.
   * @param index		If specified with **idxEnd** being undefined, this {@link Number } will be seen as the index of
   * 					the value-{@link Array }'s element to check. If value isn't an {@link Array } this parameter
   * 					will not have any effect.
   * 					With **idxEnd** not undefined this parameter indicates the beginning of the span of elements to
   * 					check within the value-{@link Array }.
   * @param idxEnd	Indicates the last element's index (including) of the span of value-{@link Array } elements to check.
   * 					Setting this parameter to -1 specifies that all value-{@link Array }'s elements beginning from the
   * 					specified **index** shall be checked.
   *
   * @returns As soon as the **condition** returns a {@link string }, instead of TRUE, the returned string. TRUE if the
   * 			**condition** never returns a {@link string}. */
  static checkAlgorithm(condition, value, index, idxEnd) {
    if (Array.isArray(value)) {
      if (index !== void 0 && idxEnd === void 0) {
        if (index > -1 && index < value.length) {
          const result = condition.check(value[index]);
          if (typeof result === "string") {
            return `Violating-Arrayelement at index "${index}" with value "${value[index]}". ${result}`;
          }
        }
        return true;
      }
      const ending = idxEnd !== void 0 ? (idxEnd !== -1 ? idxEnd + 1 : value.length) : value.length;
      for (let i = index ? index : 0; i < ending; i++) {
        const result = condition.check(value[i]);
        if (result !== true) {
          return `Violating-Arrayelement at index ${i}. ${result}`;
        }
      }
    } else {
      return condition.check(value);
    }
    return true;
  }
  /**
   * A parameter-decorator factory using the {@link AE.checkAlgorithm } with either multiple or a single one
   * of the **realConditions** to check the tagged parameter-value against with.
   * When specifying an **index** and the tagged parameter's **value** is an {@link Array }, the **realConditions** apply to the
   * element at the specified **index**.
   * If the {@link Array } is too short the currently processed { check: (toCheck: any) => boolean | string } of
   * **realConditions** will be verified to TRUE automatically, considering optional parameters.
   * If an **index** is specified but the tagged parameter's value isn't an array, the **index** is treated as being undefined.
   * If **index** is undefined and the tagged parameter's value is an {@link Array } each element of it will be checked
   * against the **realConditions**.
   *
   * @param realConditions	Either one or more { check: (toCheck: any) => boolean | string } to check the tagged parameter-value
   * 							against with.
   * @param index				See the {@link AE.checkAlgorithm }.
   * @param idxEnd			See the {@link AE.checkAlgorithm }.
   * @param path				See {@link DBC.decPrecondition }.
   * @param hint				See {@link DBC.decPrecondition }.
   * @param dbc				See {@link DBC.decPrecondition }.
   *
   * @returns	A {@link string } as soon as one { check: (toCheck: any) => boolean | string } of **realConditions** returns one.
   * 			Otherwise TRUE. */
  static PRE(realConditions, index = void 0, idxEnd = void 0, path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decPrecondition(
      (value, target, methodName, parameterIndex) => {
        if (Array.isArray(realConditions)) {
          for (const currentCondition of realConditions) {
            const result = _AE.checkAlgorithm(currentCondition, value, index, idxEnd);
            if (typeof result !== "boolean") return result;
          }
        } else {
          return _AE.checkAlgorithm(realConditions, value, index, idxEnd);
        }
        return true;
      },
      dbc,
      path,
      hint,
    );
  }
  /**
   * A method-decorator factory using the {@link AE.checkAlgorithm } with either multiple or a single one
   * of the **realConditions** to check the tagged method's return-value against with.
   *
   * @param realConditions	Either one or more { check: (toCheck: any) => boolean | string } to check the tagged parameter-value
   * 							against with.
   * @param index				See the {@link AE.checkAlgorithm }.
   * @param idxEnd			See the {@link AE.checkAlgorithm }.
   * @param path				See {@link DBC.decPrecondition }.
   * @param hint				See {@link DBC.decPrecondition }.
   * @param dbc				See {@link DBC.decPrecondition }.
   *
   * @returns	A {@link string } as soon as one { check: (toCheck: any) => boolean | string } of **realConditions** return one.
   * 			Otherwise TRUE. */
  static POST(realConditions, index = void 0, idxEnd = void 0, path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decPostcondition(
      (value, target, propertyKey) => {
        if (Array.isArray(realConditions)) {
          for (const currentCondition of realConditions) {
            const result = _AE.checkAlgorithm(currentCondition, value, index, idxEnd);
            if (typeof result !== "boolean") return result;
          }
        } else {
          return _AE.checkAlgorithm(
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            realConditions,
            value,
            index,
            idxEnd,
          );
        }
        return true;
      },
      dbc,
      path,
      hint,
    );
  }
  /**
   * A field-decorator factory using the {@link AE.checkAlgorithm } with either multiple or a single one
   * of the **realConditions** to check the tagged field.
   *
   * @param realConditions	Either one or more { check: (toCheck: any) => boolean | string } to check the tagged parameter-value
   * 							against with.
   * @param index				See the {@link AE.checkAlgorithm }.
   * @param idxEnd			See the {@link AE.checkAlgorithm }.
   * @param path				See {@link DBC.decInvariant }.
   * @param hint				See {@link DBC.decInvariant }.
   * @param dbc				See {@link DBC.decInvariant }.
   *
   * @returns	See {@link DBC.decInvariant }. */
  static INVARIANT(realConditions, index = void 0, idxEnd = void 0, path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decInvariant([new _AE(realConditions, index, idxEnd)], path, dbc, hint);
  }
  // #endregion Condition checking.
  // #region Referenced Condition checking.
  //
  // For usage in dynamic scenarios (like global functions).
  //
  /**
   * Invokes the {@link AE.checkAlgorithm } with all {@link AE.conditions } and the {@link object } {@link toCheck },
   * {@link AE.index } & {@link AE.idxEnd }.
   *
   * @param toCheck See {@link AE.checkAlgorithm }.
   *
   * @returns See {@link EQ.checkAlgorithm}. */
  check(toCheck) {
    if (Array.isArray(this.conditions)) {
      for (const currentCondition of this.conditions) {
        const result = _AE.checkAlgorithm(currentCondition, toCheck, this.index, this.idxEnd);
        if (typeof result !== "boolean") return result;
      }
    } else {
      return _AE.checkAlgorithm(
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        this.conditions,
        toCheck,
        this.index,
        this.idxEnd,
      );
    }
    return true;
  }
  // #endregion Referenced Condition checking.
};

export { AE };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3hkYmMvc3JjL0RCQy9BRS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgREJDIH0gZnJvbSBcIi4uL0RCQ1wiO1xyXG4vKipcclxuICogQSB7QGxpbmsgREJDIH0gZGVmaW5pbmcgdGhhdCBhbGwgZWxlbWVudHMgb2YgYW4ge0BsaW5rIG9iamVjdCB9cyBoYXZlIHRvIGZ1bGZpbGxcclxuICogYSBnaXZlbiB7QGxpbmsgb2JqZWN0IH0ncyBjaGVjay1tZXRob2QgKCoqKCB0b0NoZWNrIDogYW55ICkgPT4gYm9vbGVhbiB8IHN0cmluZyoqKS5cclxuICpcclxuICogQHJlbWFya3NcclxuICogTWFpbnRhaW5lcjogQ2FsbGFyaSwgU2FsdmF0b3JlIChYREJDQFdhWENvZGUubmV0KSAqL1xyXG5leHBvcnQgY2xhc3MgQUUgZXh0ZW5kcyBEQkMge1xyXG5cdC8vICNyZWdpb24gQ29uZGl0aW9uIGNoZWNraW5nLlxyXG5cdC8qKlxyXG5cdCAqIENoZWNrcyBlYWNoIGVsZW1lbnQgb2YgdGhlICoqdmFsdWUqKi17QGxpbmsgQXJyYXkgPCBhbnkgPn0gYWdhaW5zdCB0aGUgZ2l2ZW4gKipjb25kaXRpb24qKiwgaWYgaXQgaXMgb25lLiBJZiBpdCBpcyBub3RcclxuXHQgKiB0aGUgKip2YWx1ZSoqIGl0c2VsZiB3aWxsIGJlIGNoZWNrZWQuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gY29uZGl0aW9uXHRUaGUgeyBjaGVjazogKHRvQ2hlY2s6IGFueSkgPT4gYm9vbGVhbiB8IHN0cmluZyB9IHRvIGNoZWNrIHRoZSAqKnZhbHVlKiogYWdhaW5zdC5cclxuXHQgKiBAcGFyYW0gdmFsdWVcdFx0RWl0aGVyICoqdmFsdWUqKi17QGxpbmsgQXJyYXkgPCBhbnkgPn0sIHdoaWNoJ3MgZWxlbWVudHMgd2lsbCBiZSBjaGVja2VkLCBvciB0aGUgdmFsdWUgdG8gYmVcclxuXHQgKiBcdFx0XHRcdFx0Y2hlY2tlZCBpdHNlbGYuXHJcblx0ICogQHBhcmFtIGluZGV4XHRcdElmIHNwZWNpZmllZCB3aXRoICoqaWR4RW5kKiogYmVpbmcgdW5kZWZpbmVkLCB0aGlzIHtAbGluayBOdW1iZXIgfSB3aWxsIGJlIHNlZW4gYXMgdGhlIGluZGV4IG9mXHJcblx0ICogXHRcdFx0XHRcdHRoZSB2YWx1ZS17QGxpbmsgQXJyYXkgfSdzIGVsZW1lbnQgdG8gY2hlY2suIElmIHZhbHVlIGlzbid0IGFuIHtAbGluayBBcnJheSB9IHRoaXMgcGFyYW1ldGVyXHJcblx0ICogXHRcdFx0XHRcdHdpbGwgbm90IGhhdmUgYW55IGVmZmVjdC5cclxuXHQgKiBcdFx0XHRcdFx0V2l0aCAqKmlkeEVuZCoqIG5vdCB1bmRlZmluZWQgdGhpcyBwYXJhbWV0ZXIgaW5kaWNhdGVzIHRoZSBiZWdpbm5pbmcgb2YgdGhlIHNwYW4gb2YgZWxlbWVudHMgdG9cclxuXHQgKiBcdFx0XHRcdFx0Y2hlY2sgd2l0aGluIHRoZSB2YWx1ZS17QGxpbmsgQXJyYXkgfS5cclxuXHQgKiBAcGFyYW0gaWR4RW5kXHRJbmRpY2F0ZXMgdGhlIGxhc3QgZWxlbWVudCdzIGluZGV4IChpbmNsdWRpbmcpIG9mIHRoZSBzcGFuIG9mIHZhbHVlLXtAbGluayBBcnJheSB9IGVsZW1lbnRzIHRvIGNoZWNrLlxyXG5cdCAqIFx0XHRcdFx0XHRTZXR0aW5nIHRoaXMgcGFyYW1ldGVyIHRvIC0xIHNwZWNpZmllcyB0aGF0IGFsbCB2YWx1ZS17QGxpbmsgQXJyYXkgfSdzIGVsZW1lbnRzIGJlZ2lubmluZyBmcm9tIHRoZVxyXG5cdCAqIFx0XHRcdFx0XHRzcGVjaWZpZWQgKippbmRleCoqIHNoYWxsIGJlIGNoZWNrZWQuXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBBcyBzb29uIGFzIHRoZSAqKmNvbmRpdGlvbioqIHJldHVybnMgYSB7QGxpbmsgc3RyaW5nIH0sIGluc3RlYWQgb2YgVFJVRSwgdGhlIHJldHVybmVkIHN0cmluZy4gVFJVRSBpZiB0aGVcclxuXHQgKiBcdFx0XHQqKmNvbmRpdGlvbioqIG5ldmVyIHJldHVybnMgYSB7QGxpbmsgc3RyaW5nfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIGNoZWNrQWxnb3JpdGhtKFxyXG5cdFx0Y29uZGl0aW9uOiB7XHJcblx0XHRcdGNoZWNrOiAodG9DaGVjazogdW5rbm93biB8IG51bGwgfCB1bmRlZmluZWQpID0+IGJvb2xlYW4gfCBzdHJpbmc7XHJcblx0XHR9LFxyXG5cdFx0dmFsdWU6IG9iamVjdCxcclxuXHRcdGluZGV4OiBudW1iZXIgfCB1bmRlZmluZWQsXHJcblx0XHRpZHhFbmQ6IG51bWJlciB8IHVuZGVmaW5lZCxcclxuXHQpOiBib29sZWFuIHwgc3RyaW5nIHtcclxuXHRcdGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xyXG5cdFx0XHRpZiAoaW5kZXggIT09IHVuZGVmaW5lZCAmJiBpZHhFbmQgPT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdGlmIChpbmRleCA+IC0xICYmIGluZGV4IDwgdmFsdWUubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHRjb25zdCByZXN1bHQgPSBjb25kaXRpb24uY2hlY2sodmFsdWVbaW5kZXhdKTtcclxuXHJcblx0XHRcdFx0XHRpZiAodHlwZW9mIHJlc3VsdCA9PT0gXCJzdHJpbmdcIikge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm4gYFZpb2xhdGluZy1BcnJheWVsZW1lbnQgYXQgaW5kZXggXCIke2luZGV4fVwiIHdpdGggdmFsdWUgXCIke3ZhbHVlW2luZGV4XX1cIi4gJHtyZXN1bHR9YDtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdHJldHVybiB0cnVlOyAvLyBJbiBvcmRlciBmb3Igb3B0aW9uYWwgcGFyYW1ldGVyIHRvIG5vdCBjYXVzZSBhbiBlcnJvciBpZiB0aGV5IGFyZSBvbWl0dGVkLlxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjb25zdCBlbmRpbmcgPVxyXG5cdFx0XHRcdGlkeEVuZCAhPT0gdW5kZWZpbmVkXHJcblx0XHRcdFx0XHQ/IGlkeEVuZCAhPT0gLTFcclxuXHRcdFx0XHRcdFx0PyBpZHhFbmQgKyAxXHJcblx0XHRcdFx0XHRcdDogKHZhbHVlIGFzIFtdKS5sZW5ndGhcclxuXHRcdFx0XHRcdDogKHZhbHVlIGFzIFtdKS5sZW5ndGg7XHJcblxyXG5cdFx0XHRmb3IgKGxldCBpID0gaW5kZXggPyBpbmRleCA6IDA7IGkgPCBlbmRpbmc7IGkrKykge1xyXG5cdFx0XHRcdGNvbnN0IHJlc3VsdCA9IGNvbmRpdGlvbi5jaGVjayh2YWx1ZVtpXSk7XHJcblxyXG5cdFx0XHRcdGlmIChyZXN1bHQgIT09IHRydWUpIHtcclxuXHRcdFx0XHRcdHJldHVybiBgVmlvbGF0aW5nLUFycmF5ZWxlbWVudCBhdCBpbmRleCAke2l9LiAke3Jlc3VsdH1gO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmV0dXJuIGNvbmRpdGlvbi5jaGVjayh2YWx1ZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHRydWU7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgcGFyYW1ldGVyLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgQUUuY2hlY2tBbGdvcml0aG0gfSB3aXRoIGVpdGhlciBtdWx0aXBsZSBvciBhIHNpbmdsZSBvbmVcclxuXHQgKiBvZiB0aGUgKipyZWFsQ29uZGl0aW9ucyoqIHRvIGNoZWNrIHRoZSB0YWdnZWQgcGFyYW1ldGVyLXZhbHVlIGFnYWluc3Qgd2l0aC5cclxuXHQgKiBXaGVuIHNwZWNpZnlpbmcgYW4gKippbmRleCoqIGFuZCB0aGUgdGFnZ2VkIHBhcmFtZXRlcidzICoqdmFsdWUqKiBpcyBhbiB7QGxpbmsgQXJyYXkgfSwgdGhlICoqcmVhbENvbmRpdGlvbnMqKiBhcHBseSB0byB0aGVcclxuXHQgKiBlbGVtZW50IGF0IHRoZSBzcGVjaWZpZWQgKippbmRleCoqLlxyXG5cdCAqIElmIHRoZSB7QGxpbmsgQXJyYXkgfSBpcyB0b28gc2hvcnQgdGhlIGN1cnJlbnRseSBwcm9jZXNzZWQgeyBjaGVjazogKHRvQ2hlY2s6IGFueSkgPT4gYm9vbGVhbiB8IHN0cmluZyB9IG9mXHJcblx0ICogKipyZWFsQ29uZGl0aW9ucyoqIHdpbGwgYmUgdmVyaWZpZWQgdG8gVFJVRSBhdXRvbWF0aWNhbGx5LCBjb25zaWRlcmluZyBvcHRpb25hbCBwYXJhbWV0ZXJzLlxyXG5cdCAqIElmIGFuICoqaW5kZXgqKiBpcyBzcGVjaWZpZWQgYnV0IHRoZSB0YWdnZWQgcGFyYW1ldGVyJ3MgdmFsdWUgaXNuJ3QgYW4gYXJyYXksIHRoZSAqKmluZGV4KiogaXMgdHJlYXRlZCBhcyBiZWluZyB1bmRlZmluZWQuXHJcblx0ICogSWYgKippbmRleCoqIGlzIHVuZGVmaW5lZCBhbmQgdGhlIHRhZ2dlZCBwYXJhbWV0ZXIncyB2YWx1ZSBpcyBhbiB7QGxpbmsgQXJyYXkgfSBlYWNoIGVsZW1lbnQgb2YgaXQgd2lsbCBiZSBjaGVja2VkXHJcblx0ICogYWdhaW5zdCB0aGUgKipyZWFsQ29uZGl0aW9ucyoqLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHJlYWxDb25kaXRpb25zXHRFaXRoZXIgb25lIG9yIG1vcmUgeyBjaGVjazogKHRvQ2hlY2s6IGFueSkgPT4gYm9vbGVhbiB8IHN0cmluZyB9IHRvIGNoZWNrIHRoZSB0YWdnZWQgcGFyYW1ldGVyLXZhbHVlXHJcblx0ICogXHRcdFx0XHRcdFx0XHRhZ2FpbnN0IHdpdGguXHJcblx0ICogQHBhcmFtIGluZGV4XHRcdFx0XHRTZWUgdGhlIHtAbGluayBBRS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBpZHhFbmRcdFx0XHRTZWUgdGhlIHtAbGluayBBRS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cclxuXHQgKiBAcGFyYW0gaGludFx0XHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXHJcblx0ICogQHBhcmFtIGRiY1x0XHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJuc1x0QSB7QGxpbmsgc3RyaW5nIH0gYXMgc29vbiBhcyBvbmUgeyBjaGVjazogKHRvQ2hlY2s6IGFueSkgPT4gYm9vbGVhbiB8IHN0cmluZyB9IG9mICoqcmVhbENvbmRpdGlvbnMqKiByZXR1cm5zIG9uZS5cclxuXHQgKiBcdFx0XHRPdGhlcndpc2UgVFJVRS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIFBSRShcclxuXHRcdHJlYWxDb25kaXRpb25zOlxyXG5cdFx0XHR8IEFycmF5PHtcclxuXHRcdFx0XHRjaGVjazogKHRvQ2hlY2s6IHVua25vd24gfCB1bmRlZmluZWQgfCBudWxsKSA9PiBib29sZWFuIHwgc3RyaW5nO1xyXG5cdFx0XHR9PlxyXG5cdFx0XHR8IHsgY2hlY2s6ICh0b0NoZWNrOiB1bmtub3duIHwgdW5kZWZpbmVkIHwgbnVsbCkgPT4gYm9vbGVhbiB8IHN0cmluZyB9LFxyXG5cdFx0aW5kZXg6IG51bWJlciB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGlkeEVuZDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0aGludDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0KTogKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRtZXRob2ROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXHJcblx0XHRwYXJhbWV0ZXJJbmRleDogbnVtYmVyLFxyXG5cdCkgPT4gdm9pZCB7XHJcblx0XHRyZXR1cm4gREJDLmRlY1ByZWNvbmRpdGlvbihcclxuXHRcdFx0KFxyXG5cdFx0XHRcdHZhbHVlOiBvYmplY3QsXHJcblx0XHRcdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRcdFx0bWV0aG9kTmFtZTogc3RyaW5nLFxyXG5cdFx0XHRcdHBhcmFtZXRlckluZGV4OiBudW1iZXIsXHJcblx0XHRcdCkgPT4ge1xyXG5cdFx0XHRcdGlmIChBcnJheS5pc0FycmF5KHJlYWxDb25kaXRpb25zKSkge1xyXG5cdFx0XHRcdFx0Zm9yIChjb25zdCBjdXJyZW50Q29uZGl0aW9uIG9mIHJlYWxDb25kaXRpb25zKSB7XHJcblx0XHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IEFFLmNoZWNrQWxnb3JpdGhtKFxyXG5cdFx0XHRcdFx0XHRcdGN1cnJlbnRDb25kaXRpb24sXHJcblx0XHRcdFx0XHRcdFx0dmFsdWUsXHJcblx0XHRcdFx0XHRcdFx0aW5kZXgsXHJcblx0XHRcdFx0XHRcdFx0aWR4RW5kLFxyXG5cdFx0XHRcdFx0XHQpO1xyXG5cclxuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiByZXN1bHQgIT09IFwiYm9vbGVhblwiKSByZXR1cm4gcmVzdWx0O1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gQUUuY2hlY2tBbGdvcml0aG0oXHJcblx0XHRcdFx0XHRcdHJlYWxDb25kaXRpb25zIGFzIHtcclxuXHRcdFx0XHRcdFx0XHRjaGVjazogKHRvQ2hlY2s6IHVua25vd24gfCB1bmRlZmluZWQgfCBudWxsKSA9PiBib29sZWFuIHwgc3RyaW5nO1xyXG5cdFx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0XHR2YWx1ZSxcclxuXHRcdFx0XHRcdFx0aW5kZXgsXHJcblx0XHRcdFx0XHRcdGlkeEVuZCxcclxuXHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0fSxcclxuXHRcdFx0ZGJjLFxyXG5cdFx0XHRwYXRoLFxyXG5cdFx0XHRoaW50XHJcblx0XHQpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBBIG1ldGhvZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0gd2l0aCBlaXRoZXIgbXVsdGlwbGUgb3IgYSBzaW5nbGUgb25lXHJcblx0ICogb2YgdGhlICoqcmVhbENvbmRpdGlvbnMqKiB0byBjaGVjayB0aGUgdGFnZ2VkIG1ldGhvZCdzIHJldHVybi12YWx1ZSBhZ2FpbnN0IHdpdGguXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gcmVhbENvbmRpdGlvbnNcdEVpdGhlciBvbmUgb3IgbW9yZSB7IGNoZWNrOiAodG9DaGVjazogYW55KSA9PiBib29sZWFuIHwgc3RyaW5nIH0gdG8gY2hlY2sgdGhlIHRhZ2dlZCBwYXJhbWV0ZXItdmFsdWVcclxuXHQgKiBcdFx0XHRcdFx0XHRcdGFnYWluc3Qgd2l0aC5cclxuXHQgKiBAcGFyYW0gaW5kZXhcdFx0XHRcdFNlZSB0aGUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIGlkeEVuZFx0XHRcdFNlZSB0aGUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIHBhdGhcdFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqIEBwYXJhbSBoaW50XHRcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cclxuXHQgKiBAcGFyYW0gZGJjXHRcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zXHRBIHtAbGluayBzdHJpbmcgfSBhcyBzb29uIGFzIG9uZSB7IGNoZWNrOiAodG9DaGVjazogYW55KSA9PiBib29sZWFuIHwgc3RyaW5nIH0gb2YgKipyZWFsQ29uZGl0aW9ucyoqIHJldHVybiBvbmUuXHJcblx0ICogXHRcdFx0T3RoZXJ3aXNlIFRSVUUuICovXHJcblx0cHVibGljIHN0YXRpYyBQT1NUKFxyXG5cdFx0cmVhbENvbmRpdGlvbnM6IC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxyXG5cdFx0XHR8IEFycmF5PHsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfT5cclxuXHRcdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XHJcblx0XHRcdHwgeyBjaGVjazogKHRvQ2hlY2s6IGFueSkgPT4gYm9vbGVhbiB8IHN0cmluZyB9LFxyXG5cdFx0aW5kZXg6IG51bWJlciB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGlkeEVuZDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0aGludDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0KTogKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRwcm9wZXJ0eUtleTogc3RyaW5nLFxyXG5cdFx0ZGVzY3JpcHRvcjogUHJvcGVydHlEZXNjcmlwdG9yLFxyXG5cdCkgPT4gUHJvcGVydHlEZXNjcmlwdG9yIHtcclxuXHRcdHJldHVybiBEQkMuZGVjUG9zdGNvbmRpdGlvbihcclxuXHRcdFx0KHZhbHVlOiBvYmplY3QsIHRhcmdldDogb2JqZWN0LCBwcm9wZXJ0eUtleTogc3RyaW5nKSA9PiB7XHJcblx0XHRcdFx0aWYgKEFycmF5LmlzQXJyYXkocmVhbENvbmRpdGlvbnMpKSB7XHJcblx0XHRcdFx0XHRmb3IgKGNvbnN0IGN1cnJlbnRDb25kaXRpb24gb2YgcmVhbENvbmRpdGlvbnMpIHtcclxuXHRcdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gQUUuY2hlY2tBbGdvcml0aG0oXHJcblx0XHRcdFx0XHRcdFx0Y3VycmVudENvbmRpdGlvbixcclxuXHRcdFx0XHRcdFx0XHR2YWx1ZSxcclxuXHRcdFx0XHRcdFx0XHRpbmRleCxcclxuXHRcdFx0XHRcdFx0XHRpZHhFbmQsXHJcblx0XHRcdFx0XHRcdCk7XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIHJlc3VsdCAhPT0gXCJib29sZWFuXCIpIHJldHVybiByZXN1bHQ7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHJldHVybiBBRS5jaGVja0FsZ29yaXRobShcclxuXHRcdFx0XHRcdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XHJcblx0XHRcdFx0XHRcdHJlYWxDb25kaXRpb25zIGFzIHsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSxcclxuXHRcdFx0XHRcdFx0dmFsdWUsXHJcblx0XHRcdFx0XHRcdGluZGV4LFxyXG5cdFx0XHRcdFx0XHRpZHhFbmQsXHJcblx0XHRcdFx0XHQpO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdH0sXHJcblx0XHRcdGRiYyxcclxuXHRcdFx0cGF0aCxcclxuXHRcdFx0aGludFxyXG5cdFx0KTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogQSBmaWVsZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0gd2l0aCBlaXRoZXIgbXVsdGlwbGUgb3IgYSBzaW5nbGUgb25lXHJcblx0ICogb2YgdGhlICoqcmVhbENvbmRpdGlvbnMqKiB0byBjaGVjayB0aGUgdGFnZ2VkIGZpZWxkLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHJlYWxDb25kaXRpb25zXHRFaXRoZXIgb25lIG9yIG1vcmUgeyBjaGVjazogKHRvQ2hlY2s6IGFueSkgPT4gYm9vbGVhbiB8IHN0cmluZyB9IHRvIGNoZWNrIHRoZSB0YWdnZWQgcGFyYW1ldGVyLXZhbHVlXHJcblx0ICogXHRcdFx0XHRcdFx0XHRhZ2FpbnN0IHdpdGguXHJcblx0ICogQHBhcmFtIGluZGV4XHRcdFx0XHRTZWUgdGhlIHtAbGluayBBRS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBpZHhFbmRcdFx0XHRTZWUgdGhlIHtAbGluayBBRS5jaGVja0FsZ29yaXRobSB9LlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cclxuXHQgKiBAcGFyYW0gaGludFx0XHRcdFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXHJcblx0ICogQHBhcmFtIGRiY1x0XHRcdFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJuc1x0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uICovXHJcblx0cHVibGljIHN0YXRpYyBJTlZBUklBTlQoXHJcblx0XHRyZWFsQ29uZGl0aW9uczogLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XHJcblx0XHRcdHwgQXJyYXk8eyBjaGVjazogKHRvQ2hlY2s6IGFueSkgPT4gYm9vbGVhbiB8IHN0cmluZyB9PlxyXG5cdFx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cclxuXHRcdFx0fCB7IGNoZWNrOiAodG9DaGVjazogYW55KSA9PiBib29sZWFuIHwgc3RyaW5nIH0sXHJcblx0XHRpbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0aWR4RW5kOiBudW1iZXIgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRoaW50OiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmM6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHQpIHtcclxuXHRcdHJldHVybiBEQkMuZGVjSW52YXJpYW50KFtuZXcgQUUocmVhbENvbmRpdGlvbnMsIGluZGV4LCBpZHhFbmQpXSwgcGF0aCwgZGJjLCBoaW50KTtcclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXHJcblx0Ly8gI3JlZ2lvbiBSZWZlcmVuY2VkIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvL1xyXG5cdC8vIEZvciB1c2FnZSBpbiBkeW5hbWljIHNjZW5hcmlvcyAobGlrZSBnbG9iYWwgZnVuY3Rpb25zKS5cclxuXHQvL1xyXG5cdC8qKlxyXG5cdCAqIEludm9rZXMgdGhlIHtAbGluayBBRS5jaGVja0FsZ29yaXRobSB9IHdpdGggYWxsIHtAbGluayBBRS5jb25kaXRpb25zIH0gYW5kIHRoZSB7QGxpbmsgb2JqZWN0IH0ge0BsaW5rIHRvQ2hlY2sgfSxcclxuXHQgKiB7QGxpbmsgQUUuaW5kZXggfSAmIHtAbGluayBBRS5pZHhFbmQgfS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0b0NoZWNrIFNlZSB7QGxpbmsgQUUuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFNlZSB7QGxpbmsgRVEuY2hlY2tBbGdvcml0aG19LiAqL1xyXG5cdHB1YmxpYyBjaGVjayh0b0NoZWNrOiBvYmplY3QpIHtcclxuXHRcdGlmIChBcnJheS5pc0FycmF5KHRoaXMuY29uZGl0aW9ucykpIHtcclxuXHRcdFx0Zm9yIChjb25zdCBjdXJyZW50Q29uZGl0aW9uIG9mIHRoaXMuY29uZGl0aW9ucykge1xyXG5cdFx0XHRcdGNvbnN0IHJlc3VsdCA9IEFFLmNoZWNrQWxnb3JpdGhtKFxyXG5cdFx0XHRcdFx0Y3VycmVudENvbmRpdGlvbixcclxuXHRcdFx0XHRcdHRvQ2hlY2ssXHJcblx0XHRcdFx0XHR0aGlzLmluZGV4LFxyXG5cdFx0XHRcdFx0dGhpcy5pZHhFbmQsXHJcblx0XHRcdFx0KTtcclxuXHJcblx0XHRcdFx0aWYgKHR5cGVvZiByZXN1bHQgIT09IFwiYm9vbGVhblwiKSByZXR1cm4gcmVzdWx0O1xyXG5cdFx0XHR9XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRyZXR1cm4gQUUuY2hlY2tBbGdvcml0aG0oXHJcblx0XHRcdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XHJcblx0XHRcdFx0dGhpcy5jb25kaXRpb25zIGFzIHsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSxcclxuXHRcdFx0XHR0b0NoZWNrLFxyXG5cdFx0XHRcdHRoaXMuaW5kZXgsXHJcblx0XHRcdFx0dGhpcy5pZHhFbmQsXHJcblx0XHRcdCk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHRydWU7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIENyZWF0ZXMgdGhpcyB7QGxpbmsgQUUgfSBieSBzZXR0aW5nIHRoZSBwcm90ZWN0ZWQgcHJvcGVydHkge0BsaW5rIEFFLmNvbmRpdGlvbnMgfSwge0BsaW5rIEFFLmluZGV4IH0gYW5kIHtAbGluayBBRS5pZHhFbmQgfSB1c2VkIGJ5IHtAbGluayBBRS5jaGVjayB9LlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIGVxdWl2YWxlbnQgU2VlIHtAbGluayBFUS5jaGVjayB9LiAqL1xyXG5cdHB1YmxpYyBjb25zdHJ1Y3RvcihcclxuXHRcdHByb3RlY3RlZCBjb25kaXRpb25zOlxyXG5cdFx0XHR8IEFycmF5PHtcclxuXHRcdFx0XHRjaGVjazogKHRvQ2hlY2s6IG9iamVjdCB8IHVuZGVmaW5lZCB8IG51bGwpID0+IGJvb2xlYW4gfCBzdHJpbmc7XHJcblx0XHRcdH0+XHJcblx0XHRcdHwgeyBjaGVjazogKHRvQ2hlY2s6IG9iamVjdCB8IHVuZGVmaW5lZCB8IG51bGwpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSxcclxuXHRcdHByb3RlY3RlZCBpbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0cHJvdGVjdGVkIGlkeEVuZDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdCkge1xyXG5cdFx0c3VwZXIoKTtcclxuXHR9XHJcblx0Ly8gI2VuZHJlZ2lvbiBSZWZlcmVuY2VkIENvbmRpdGlvbiBjaGVja2luZy5cclxufVxyXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7OztBQU9PLElBQU0sS0FBTixNQUFNLFlBQVcsSUFBSTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFtUXBCLFlBQ0ksWUFLQSxRQUE0QixRQUM1QixTQUE2QixRQUN0QztBQUNELFVBQU07QUFSSTtBQUtBO0FBQ0E7QUFBQSxFQUdYO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQXpQQSxPQUFjLGVBQ2IsV0FHQSxPQUNBLE9BQ0EsUUFDbUI7QUFDbkIsUUFBSSxNQUFNLFFBQVEsS0FBSyxHQUFHO0FBQ3pCLFVBQUksVUFBVSxVQUFhLFdBQVcsUUFBVztBQUNoRCxZQUFJLFFBQVEsTUFBTSxRQUFRLE1BQU0sUUFBUTtBQUN2QyxnQkFBTSxTQUFTLFVBQVUsTUFBTSxNQUFNLEtBQUssQ0FBQztBQUUzQyxjQUFJLE9BQU8sV0FBVyxVQUFVO0FBQy9CLG1CQUFPLG9DQUFvQyxLQUFLLGlCQUFpQixNQUFNLEtBQUssQ0FBQyxNQUFNLE1BQU07QUFBQSxVQUMxRjtBQUFBLFFBQ0Q7QUFFQSxlQUFPO0FBQUEsTUFDUjtBQUVBLFlBQU0sU0FDTCxXQUFXLFNBQ1IsV0FBVyxLQUNWLFNBQVMsSUFDUixNQUFhLFNBQ2QsTUFBYTtBQUVsQixlQUFTLElBQUksUUFBUSxRQUFRLEdBQUcsSUFBSSxRQUFRLEtBQUs7QUFDaEQsY0FBTSxTQUFTLFVBQVUsTUFBTSxNQUFNLENBQUMsQ0FBQztBQUV2QyxZQUFJLFdBQVcsTUFBTTtBQUNwQixpQkFBTyxtQ0FBbUMsQ0FBQyxLQUFLLE1BQU07QUFBQSxRQUN2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
