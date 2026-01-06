import {
  BayVIS_Ansprechpartner_ID
} from "./chunk-S62OXAHR.js";
import {
  GREATER
} from "./chunk-BGXKJQGN.js";
import {
  TYPE
} from "./chunk-3ER2QPBV.js";
import {
  XMLParser
} from "./chunk-IPDUQ5Z7.js";
import {
  CodBiError
} from "./chunk-23XLZUKK.js";
import {
  require_dist
} from "./chunk-5LC5FOZV.js";
import {
  REGEX
} from "./chunk-ISMU77I6.js";
import {
  AE
} from "./chunk-FOIOEJC7.js";
import {
  DBC
} from "./chunk-O7G7SG2W.js";
import {
  __decorateClass,
  __decorateParam,
  __toESM
} from "./chunk-KWZW6WYL.js";

// src/js/EPs/bayvis.ansprechpartner.details.ts
var import_fc_form_renderer = __toESM(require_dist(), 1);

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
  static PRE(conditions, path = void 0, dbc = "WaXCode.DBC") {
    return DBC.decPrecondition(
      (value, target, methodName, parameterIndex) => {
        return _OR.checkAlgorithm(conditions, value);
      },
      dbc,
      path
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
  static POST(conditions, path = void 0, dbc = "WaXCode.DBC") {
    return DBC.decPostcondition(
      (value, target, propertyKey) => {
        return _OR.checkAlgorithm(conditions, value);
      },
      dbc,
      path
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
  static INVARIANT(conditions, path = void 0, dbc = "WaXCode.DBC") {
    return DBC.decInvariant([new _OR(conditions)], path, dbc);
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
  static tsCheck(toCheck, conditions) {
    const result = _OR.checkAlgorithm(conditions, toCheck);
    if (result) {
      return toCheck;
    } else {
      throw new DBC.Infringement(result);
    }
  }
  // #endregion Referenced Condition checking.
};

// src/js/EPs/bayvis.ansprechpartner.details.ts
var _BayVIS_Ansprechpartner_Details = class _BayVIS_Ansprechpartner_Details {
  static {
    /** Stores often used {@link RegExp }s. */
    this.stdExp = {
      directoryMember: /^(anrede|vorname|nachname|funktion|stellenbezeichnung|email|website|zimmer|behoerdeId|behoerdeBezeichnung|gebaeudeId|gebaeudeBezeichnung|ansprechpartnerId|telefonLandvorwahl|telefonOrtsvorwahl|telefonAnlage|telefonDurchwahl|apTelefonLandvorwahl|apTelefonOrtsvorwahl|apTelefonAnlage|apTelefonDurchwahl|apEmail)$/
    };
  }
  static {
    /** Stores the response received from the BayVIS-Request. */
    this.buffer = /* @__PURE__ */ new Map();
  }
  static retrieve(params) {
    return new Promise((resolve, reject) => {
      const $ = (0, import_fc_form_renderer.getJQuery)();
      let result = new Array();
      let cntResolved = 0;
      const acquire = (toAcquire) => {
        if (_BayVIS_Ansprechpartner_Details.buffer.has(toAcquire)) {
          resolve(_BayVIS_Ansprechpartner_Details.buffer.get(toAcquire));
          return;
        }
        $.ajax({
          url: `${window.codbi.baseURL}plugin?name=CodBi_BayVIS_Auskunft_Ansprechpartnerdetails`,
          type: "GET",
          headers: { Accept: "application/xml", ID: toAcquire.trim() }
        }).done((xml) => {
          cntResolved++;
          let response = new XMLParser({ attributeNamePrefix: "", ignoreAttributes: false }).parse(xml)["ns2:ansprechpartner"];
          if (response === void 0) {
            response = JSON.parse(xml);
          }
          if (params.length >= 2) {
            const detail = result[params[1]];
            if (detail === void 0) {
              reject(new CodBiError(`Detail "${params[1]}" of authorities is not available.`));
            }
            result.push(detail);
          }
          if (ids.length === 1) {
            result = Array.isArray(response.ap) ? response.ap[0] : response.ap;
            result.apTelefonOrtsvorwahl = result.telefonOrtsvorwahl;
            result.apTelefonAnlage = result.telefonAnlage;
            result.apTelefonDurchwahl = result.telefonDurchwahl;
            result.apEmail = result.email;
            _BayVIS_Ansprechpartner_Details.buffer[toAcquire] = [
              result
            ];
            resolve(
              result
            );
          } else {
            const resultElement = Array.isArray(response.ap) ? response.ap[0] : response.ap;
            resultElement.apTelefonOrtsvorwahl = resultElement.telefonOrtsvorwahl;
            resultElement.apTelefonOrtsvorwahl = resultElement.telefonOrtsvorwahl;
            resultElement.apTelefonAnlage = resultElement.telefonAnlage;
            resultElement.apTelefonDurchwahl = resultElement.telefonDurchwahl;
            resultElement.apEmail = resultElement.email;
            result.push(resultElement);
            if (cntResolved === ids.length) {
              resolve(_BayVIS_Ansprechpartner_Details.buffer[toAcquire] = result);
            }
          }
        }).fail((X) => {
          reject(new CodBiError("Unable to retrieve data from CodBi_BayVIS_Auskunft_Ansprechpartnerdetails"));
        });
      };
      const ids = (params[0]?.toString()).split("/").map((toTrim) => toTrim.trim());
      for (let i = 0; i < ids.length; i++) {
        if (Number.isNaN(Number.parseInt(ids[i]))) {
          BayVIS_Ansprechpartner_ID.retrieve([ids[i].trim()]).then((id) => {
            if (id[0] !== void 0) {
              acquire(id[0].toString());
            }
          });
        } else {
          acquire(ids[i]);
        }
      }
    });
  }
  static {
    // #region Initialization
    /**
     * States whether this {@link BayVIS_Ansprechpartner_Details } was successfully registered
     * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
    this.registered = (() => {
      return window.codbi.registerEP("BayVIS.Ansprechpartner.Details", _BayVIS_Ansprechpartner_Details.retrieve);
    })();
  }
  // #region Initialization
};
__decorateClass([
  DBC.ParamvalueProvider,
  __decorateParam(0, GREATER.PRE(0, false, false, "length")),
  __decorateParam(0, AE.PRE(new TYPE("string"))),
  __decorateParam(0, AE.PRE(
    new OR([
      new REGEX(/^([A-Za-z\s]+|\d{1,6})(?:\/([A-Za-z\s]+|\d{1,6}))*|$/),
      new REGEX(_BayVIS_Ansprechpartner_Details.stdExp.directoryMember)
    ]),
    1
  )),
  __decorateParam(0, AE.PRE(
    new OR([
      new REGEX(/^([A-Za-z\s]+|\d{1,6})(?:\/([A-Za-z\s]+|\d{1,6}))*|$/),
      new REGEX(_BayVIS_Ansprechpartner_Details.stdExp.directoryMember)
    ]),
    1
  ))
], _BayVIS_Ansprechpartner_Details, "retrieve", 1);
var BayVIS_Ansprechpartner_Details = _BayVIS_Ansprechpartner_Details;
export {
  BayVIS_Ansprechpartner_Details
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL3BhY2thZ2VzL2Zvcm0vc3JjL2pzL0VQcy9iYXl2aXMuYW5zcHJlY2hwYXJ0bmVyLmRldGFpbHMudHMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL25vZGVfbW9kdWxlcy94ZGJjL3NyYy9EQkMvT1IudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vICNyZWdpb24gSW1wb3J0c1xuLy8gI3JlZ2lvbiBYSU1BXG5pbXBvcnQgeyBnZXRKUXVlcnkgfSBmcm9tIFwiQGRlLXhpbWEvZmMtZm9ybS1yZW5kZXJlclwiO1xuLy8gI2VuZHJlZ2lvbiBYSU1BXG4vLyAjcmVnaW9uIFhEQkNcbmltcG9ydCB7IERCQyB9IGZyb20gXCJ4ZGJjL3NyYy9EQkNcIjtcbmltcG9ydCB7IEFFIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9BRVwiO1xuaW1wb3J0IHsgVFlQRSB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvVFlQRVwiO1xuaW1wb3J0IHsgR1JFQVRFUiB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvQ09NUEFSSVNPTi9HUkVBVEVSXCI7XG5pbXBvcnQgeyBSRUdFWCB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvUkVHRVhcIjtcbmltcG9ydCB7IE9SIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9PUlwiO1xuLy8gI2VuZHJlZ2lvbiBYREJDXG4vLyAjcmVnaW9uIEZhc3QgWE1MLVBhcnNlclxuaW1wb3J0IHsgWE1MUGFyc2VyIH0gZnJvbSBcImZhc3QteG1sLXBhcnNlclwiO1xuLy8gI2VuZHJlZ2lvbiBGYXN0IFhNTC1QYXJzZXJcbmltcG9ydCB7IENvZEJpRXJyb3IgfSBmcm9tIFwiLi4vZ2xvYmFsLXNjb3BlXCI7XG5pbXBvcnQgeyBCYXlWSVNfQW5zcHJlY2hwYXJ0bmVyX0lEIH0gZnJvbSBcIi4vYmF5dmlzLmFuc3ByZWNocGFydG5lci5pZFwiO1xuLy8gI2VuZHJlZ2lvbiBJbXBvcnRzXG4vKipcbiAqIFRoaXMgKipFbGVtZW50KiotKipQKipsYWNlaG9sZGVyIHJldHJpZXZlcyBkZXRhaWxzIG9mIGEgc3BlY2lmaWMgY29udGFjdCBmcm9tIHRoZSBjb3JyZXNwb25kaW5nIENvZEJpLVBsdWdpbiBzZXJ2bGV0LlxuICpcbiAqIFBsYWNlaG9sZGVyIFBhcmFtZXRlcjpcbiAqICAtIDFzdDogICAgICBUaGUgSUQgb2YgdGhlIGNvbnRhY3Qgd2hvJ3MgZGV0YWlscyBhcmUgdG8gYmUgcmV0cmlldmVkLlxuICogICAgICAgICAgICAgIE11bHRpcGxlIElEcyBtYXkgYmUgcHJvdmlkZWQgYnkgdXNpbmcgXCIvXCIgYXMgYSBkaXZpZGVyIChlLmcuIDEyMzQ1IC8gNjc4OTAxICkuXG4gKiAgLSAybmQ6ICAgICAgQSBwcm9wZXJ0eSBvZiB0aGUgY29udGFjdCwgbGlrZSBlLmcuIFwibmFjaG5hbWVcIi5cbiAqICAtIDJuZC8zcmQ6ICBUaGUgQmF5VklTLVVSTCB3aGVyZSB0byByZXRyaWV2ZSB0aGUgY29udGFjdCBkaXJlY3RvcnkgZnJvbSwgaWYgdGhlIDJuZCBwYXJhbWV0ZXIgY29udGFpbnNcbiAqICAgICAgICAgICAgICBub3QganVzdCBJRHMgYnV0IGFsc28gbmFtZXMgdG8gbG9vayBmb3IuXG4gKlxuICogIC0gcmVzb2x2ZXMgIFRvIGVpdGhlciBhblxuICogICAgICAgICAgICAgIHtAbGluayBBcnJheSA8eyBhbnJlZGU6IHN0cmluZzsgdm9ybmFtZTogc3RyaW5nOyBuYWNobmFtZTogc3RyaW5nOyBmdW5rdGlvbjogc3RyaW5nO1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGVsbGVuYmV6ZWljaG51bmc6IHN0cmluZzsgZW1haWw6IHN0cmluZzsgd2Vic2l0ZTogc3RyaW5nOyB6aW1tZXI6IHN0cmluZztcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmVob2VyZGVJZDogbnVtYmVyOyBiZWhvZXJkZUJlemVpY2hudW5nOiBzdHJpbmc7XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdlYmFldWRlSWQ6IG51bWJlcjsgZ2ViYWV1ZGVCZXplaWNobnVuZzogc3RyaW5nOyBhbnNwcmVjaHBhcnRuZXJJZDogbnVtYmVyO1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcFRlbGVmb25MYW5kdm9yd2FobDogc3RyaW5nOyBhcFRlbGVmb25PcnRzdm9yd2FobDogc3RyaW5nOyBhcFRlbGVmb25BbmxhZ2U6IHN0cmluZztcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXBUZWxlZm9uRHVyY2h3YWhsOiBzdHJpbmc7IGFwRW1haWw6IHN0cmluZzt9Pn1cbiAqICAgICAgICAgICAgICBvciBhbiB7QGxpbmsgQXJyYXkgPCBzdHJpbmcgPn0sIGlmIHRoZSAzcmQgcGFyYW1ldGVyIGlzIHNwZWNpZmllZC5cbiAqXG4gKiBAcmVtYXJrc1xuICogTWFpbnRhaW5lcjogQ2FsbGFyaSwgU2FsdmF0b3JlIChTYWx2YXRvcmUuQ2FsbGFyaUBBbnNiYWNoLmRlKSAqL1xuLy8gYmlvbWUtaWdub3JlIGxpbnQvY29tcGxleGl0eS9ub1N0YXRpY09ubHlDbGFzczogRnV0dXJlIGluaGVyaXRhbmNlIHByb2JhYmxlLlxuZXhwb3J0IGNsYXNzIEJheVZJU19BbnNwcmVjaHBhcnRuZXJfRGV0YWlscyB7XG4gIC8qKiBTdG9yZXMgb2Z0ZW4gdXNlZCB7QGxpbmsgUmVnRXhwIH1zLiAqL1xuICBwdWJsaWMgc3RhdGljIHN0ZEV4cDoge1xuICAgIGRpcmVjdG9yeU1lbWJlcjogUmVnRXhwO1xuICB9ID0ge1xuICAgIGRpcmVjdG9yeU1lbWJlcjpcbiAgICAgIC9eKGFucmVkZXx2b3JuYW1lfG5hY2huYW1lfGZ1bmt0aW9ufHN0ZWxsZW5iZXplaWNobnVuZ3xlbWFpbHx3ZWJzaXRlfHppbW1lcnxiZWhvZXJkZUlkfGJlaG9lcmRlQmV6ZWljaG51bmd8Z2ViYWV1ZGVJZHxnZWJhZXVkZUJlemVpY2hudW5nfGFuc3ByZWNocGFydG5lcklkfHRlbGVmb25MYW5kdm9yd2FobHx0ZWxlZm9uT3J0c3ZvcndhaGx8dGVsZWZvbkFubGFnZXx0ZWxlZm9uRHVyY2h3YWhsfGFwVGVsZWZvbkxhbmR2b3J3YWhsfGFwVGVsZWZvbk9ydHN2b3J3YWhsfGFwVGVsZWZvbkFubGFnZXxhcFRlbGVmb25EdXJjaHdhaGx8YXBFbWFpbCkkLyxcbiAgfTtcbiAgLyoqIFN0b3JlcyB0aGUgcmVzcG9uc2UgcmVjZWl2ZWQgZnJvbSB0aGUgQmF5VklTLVJlcXVlc3QuICovXG4gIHByb3RlY3RlZCBzdGF0aWMgYnVmZmVyOiBNYXA8c3RyaW5nLCBBcnJheTxzdHJpbmc+PiA9IG5ldyBNYXA8c3RyaW5nLCBBcnJheTxzdHJpbmc+PigpO1xuICAvKipcbiAgICogU2VlIHtAbGluayBCYXlWSVNfQW5zcHJlY2hwYXJ0bmVyX0RldGFpbHMgfS5cbiAgICpcbiAgICogQHBhcmFtIHBhcmFtcyBUaGUgcGFyYW1ldGVycyBmb3IgdGhhdCBFbGVtZW50LVBsYWNlaG9sZGVyIChwcm92aWRlZCBieSBDb2RCaSkuXG4gICAqXG4gICAqIEB0aHJvd3MgIEEge0BsaW5rIENvZEJpRXJyb3IgfSBpZiBlaXRoZXIgbm8gZGF0YSBjb3VsZCBiZSByZXRyaWV2ZWQgZnJvbSB0aGUgQmF5VklTLUVuZHBvaW50IG9yLCBnaXZlbiB0aGVcbiAgICogICAgICAgICAgM3JkIHBhcmFtZXRlciB3YXMgc3BlY2lmaWVkLCBhIG5vbiBleGlzdGVudCBjb250YWN0IHByb3BlcnR5IHdhcyBzcGVjaWZpZWQuICovXG4gIEBEQkMuUGFyYW12YWx1ZVByb3ZpZGVyXG4gIHB1YmxpYyBzdGF0aWMgcmV0cmlldmUoXG4gICAgQEdSRUFURVIuUFJFKDAsIGZhbHNlLCBmYWxzZSwgXCJsZW5ndGhcIilcbiAgICBAQUUuUFJFKG5ldyBUWVBFKFwic3RyaW5nXCIpKVxuICAgIEBBRS5QUkUoXG4gICAgICBuZXcgT1IoW1xuICAgICAgICBuZXcgUkVHRVgoL14oW0EtWmEtelxcc10rfFxcZHsxLDZ9KSg/OlxcLyhbQS1aYS16XFxzXSt8XFxkezEsNn0pKSp8JC8pLFxuICAgICAgICBuZXcgUkVHRVgoQmF5VklTX0Fuc3ByZWNocGFydG5lcl9EZXRhaWxzLnN0ZEV4cC5kaXJlY3RvcnlNZW1iZXIpLFxuICAgICAgXSksXG4gICAgICAxLFxuICAgIClcbiAgICBAQUUuUFJFKFxuICAgICAgbmV3IE9SKFtcbiAgICAgICAgbmV3IFJFR0VYKC9eKFtBLVphLXpcXHNdK3xcXGR7MSw2fSkoPzpcXC8oW0EtWmEtelxcc10rfFxcZHsxLDZ9KSkqfCQvKSxcbiAgICAgICAgbmV3IFJFR0VYKEJheVZJU19BbnNwcmVjaHBhcnRuZXJfRGV0YWlscy5zdGRFeHAuZGlyZWN0b3J5TWVtYmVyKSxcbiAgICAgIF0pLFxuICAgICAgMSxcbiAgICApXG4gICAgLy9AQUUuUFJFKG5ldyBSRUdFWChCYXlWSVNfQW5zcHJlY2hwYXJ0bmVyX0RldGFpbHMuc3RkRXhwLmRpcmVjdG9yeU1lbWJlciksIDIpXG4gICAgcGFyYW1zOiBBcnJheTx1bmtub3duPixcbiAgKTogUHJvbWlzZTxcbiAgICB8IHN0cmluZ1xuICAgIHwge1xuICAgICAgICBhbnJlZGU6IHN0cmluZztcbiAgICAgICAgdm9ybmFtZTogc3RyaW5nO1xuICAgICAgICBuYWNobmFtZTogc3RyaW5nO1xuICAgICAgICBmdW5rdGlvbjogc3RyaW5nO1xuICAgICAgICBzdGVsbGVuYmV6ZWljaG51bmc6IHN0cmluZztcbiAgICAgICAgZW1haWw6IHN0cmluZztcbiAgICAgICAgd2Vic2l0ZTogc3RyaW5nO1xuICAgICAgICB6aW1tZXI6IHN0cmluZztcbiAgICAgICAgYmVob2VyZGVJZDogbnVtYmVyO1xuICAgICAgICBiZWhvZXJkZUJlemVpY2hudW5nOiBzdHJpbmc7XG4gICAgICAgIGdlYmFldWRlSWQ6IG51bWJlcjtcbiAgICAgICAgZ2ViYWV1ZGVCZXplaWNobnVuZzogc3RyaW5nO1xuICAgICAgICBhbnNwcmVjaHBhcnRuZXJJZDogbnVtYmVyO1xuICAgICAgICBhcFRlbGVmb25MYW5kdm9yd2FobDogc3RyaW5nO1xuICAgICAgICBhcFRlbGVmb25PcnRzdm9yd2FobDogc3RyaW5nO1xuICAgICAgICBhcFRlbGVmb25BbmxhZ2U6IHN0cmluZztcbiAgICAgICAgYXBUZWxlZm9uRHVyY2h3YWhsOiBzdHJpbmc7XG4gICAgICAgIGFwRW1haWw6IHN0cmluZztcbiAgICAgIH1cbiAgICB8IEFycmF5PHN0cmluZz5cbiAgICB8IEFycmF5PHtcbiAgICAgICAgYW5yZWRlOiBzdHJpbmc7XG4gICAgICAgIHZvcm5hbWU6IHN0cmluZztcbiAgICAgICAgbmFjaG5hbWU6IHN0cmluZztcbiAgICAgICAgZnVua3Rpb246IHN0cmluZztcbiAgICAgICAgc3RlbGxlbmJlemVpY2hudW5nOiBzdHJpbmc7XG4gICAgICAgIGVtYWlsOiBzdHJpbmc7XG4gICAgICAgIHdlYnNpdGU6IHN0cmluZztcbiAgICAgICAgemltbWVyOiBzdHJpbmc7XG4gICAgICAgIGJlaG9lcmRlSWQ6IG51bWJlcjtcbiAgICAgICAgYmVob2VyZGVCZXplaWNobnVuZzogc3RyaW5nO1xuICAgICAgICBnZWJhZXVkZUlkOiBudW1iZXI7XG4gICAgICAgIGdlYmFldWRlQmV6ZWljaG51bmc6IHN0cmluZztcbiAgICAgICAgYW5zcHJlY2hwYXJ0bmVySWQ6IG51bWJlcjtcbiAgICAgICAgYXBUZWxlZm9uTGFuZHZvcndhaGw6IHN0cmluZztcbiAgICAgICAgYXBUZWxlZm9uT3J0c3ZvcndhaGw6IHN0cmluZztcbiAgICAgICAgYXBUZWxlZm9uQW5sYWdlOiBzdHJpbmc7XG4gICAgICAgIGFwVGVsZWZvbkR1cmNod2FobDogc3RyaW5nO1xuICAgICAgICBhcEVtYWlsOiBzdHJpbmc7XG4gICAgICB9PlxuICA+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgJCA9IGdldEpRdWVyeSgpO1xuICAgICAgbGV0IHJlc3VsdDpcbiAgICAgICAgfCBzdHJpbmdcbiAgICAgICAgfCBBcnJheTxzdHJpbmc+XG4gICAgICAgIHwge1xuICAgICAgICAgICAgYW5yZWRlOiBzdHJpbmc7XG4gICAgICAgICAgICB2b3JuYW1lOiBzdHJpbmc7XG4gICAgICAgICAgICBuYWNobmFtZTogc3RyaW5nO1xuICAgICAgICAgICAgZnVua3Rpb246IHN0cmluZztcbiAgICAgICAgICAgIHN0ZWxsZW5iZXplaWNobnVuZzogc3RyaW5nO1xuICAgICAgICAgICAgZW1haWw6IHN0cmluZztcbiAgICAgICAgICAgIHdlYnNpdGU6IHN0cmluZztcbiAgICAgICAgICAgIHppbW1lcjogc3RyaW5nO1xuICAgICAgICAgICAgYmVob2VyZGVJZDogbnVtYmVyO1xuICAgICAgICAgICAgYmVob2VyZGVCZXplaWNobnVuZzogc3RyaW5nO1xuICAgICAgICAgICAgZ2ViYWV1ZGVJZDogbnVtYmVyO1xuICAgICAgICAgICAgZ2ViYWV1ZGVCZXplaWNobnVuZzogc3RyaW5nO1xuICAgICAgICAgICAgYW5zcHJlY2hwYXJ0bmVySWQ6IG51bWJlcjtcbiAgICAgICAgICAgIHRlbGVmb25MYW5kdm9yd2FobDogc3RyaW5nO1xuICAgICAgICAgICAgdGVsZWZvbk9ydHN2b3J3YWhsOiBzdHJpbmc7XG4gICAgICAgICAgICB0ZWxlZm9uQW5sYWdlOiBzdHJpbmc7XG4gICAgICAgICAgICB0ZWxlZm9uRHVyY2h3YWhsOiBzdHJpbmc7XG4gICAgICAgICAgICBhcFRlbGVmb25MYW5kdm9yd2FobDogc3RyaW5nO1xuICAgICAgICAgICAgYXBUZWxlZm9uT3J0c3ZvcndhaGw6IHN0cmluZztcbiAgICAgICAgICAgIGFwVGVsZWZvbkFubGFnZTogc3RyaW5nO1xuICAgICAgICAgICAgYXBUZWxlZm9uRHVyY2h3YWhsOiBzdHJpbmc7XG4gICAgICAgICAgICBhcEVtYWlsOiBzdHJpbmc7XG4gICAgICAgICAgfVxuICAgICAgICB8IEFycmF5PHtcbiAgICAgICAgICAgIGFucmVkZTogc3RyaW5nO1xuICAgICAgICAgICAgdm9ybmFtZTogc3RyaW5nO1xuICAgICAgICAgICAgbmFjaG5hbWU6IHN0cmluZztcbiAgICAgICAgICAgIGZ1bmt0aW9uOiBzdHJpbmc7XG4gICAgICAgICAgICBzdGVsbGVuYmV6ZWljaG51bmc6IHN0cmluZztcbiAgICAgICAgICAgIGVtYWlsOiBzdHJpbmc7XG4gICAgICAgICAgICB3ZWJzaXRlOiBzdHJpbmc7XG4gICAgICAgICAgICB6aW1tZXI6IHN0cmluZztcbiAgICAgICAgICAgIGJlaG9lcmRlSWQ6IG51bWJlcjtcbiAgICAgICAgICAgIGJlaG9lcmRlQmV6ZWljaG51bmc6IHN0cmluZztcbiAgICAgICAgICAgIGdlYmFldWRlSWQ6IG51bWJlcjtcbiAgICAgICAgICAgIGdlYmFldWRlQmV6ZWljaG51bmc6IHN0cmluZztcbiAgICAgICAgICAgIGFuc3ByZWNocGFydG5lcklkOiBudW1iZXI7XG4gICAgICAgICAgICB0ZWxlZm9uTGFuZHZvcndhaGw6IHN0cmluZztcbiAgICAgICAgICAgIHRlbGVmb25PcnRzdm9yd2FobDogc3RyaW5nO1xuICAgICAgICAgICAgdGVsZWZvbkFubGFnZTogc3RyaW5nO1xuICAgICAgICAgICAgdGVsZWZvbkR1cmNod2FobDogc3RyaW5nO1xuICAgICAgICAgICAgYXBUZWxlZm9uTGFuZHZvcndhaGw6IHN0cmluZztcbiAgICAgICAgICAgIGFwVGVsZWZvbk9ydHN2b3J3YWhsOiBzdHJpbmc7XG4gICAgICAgICAgICBhcFRlbGVmb25BbmxhZ2U6IHN0cmluZztcbiAgICAgICAgICAgIGFwVGVsZWZvbkR1cmNod2FobDogc3RyaW5nO1xuICAgICAgICAgICAgYXBFbWFpbDogc3RyaW5nO1xuICAgICAgICAgIH0+ID0gbmV3IEFycmF5PHtcbiAgICAgICAgYW5yZWRlOiBzdHJpbmc7XG4gICAgICAgIHZvcm5hbWU6IHN0cmluZztcbiAgICAgICAgbmFjaG5hbWU6IHN0cmluZztcbiAgICAgICAgZnVua3Rpb246IHN0cmluZztcbiAgICAgICAgc3RlbGxlbmJlemVpY2hudW5nOiBzdHJpbmc7XG4gICAgICAgIGVtYWlsOiBzdHJpbmc7XG4gICAgICAgIHdlYnNpdGU6IHN0cmluZztcbiAgICAgICAgemltbWVyOiBzdHJpbmc7XG4gICAgICAgIGJlaG9lcmRlSWQ6IG51bWJlcjtcbiAgICAgICAgYmVob2VyZGVCZXplaWNobnVuZzogc3RyaW5nO1xuICAgICAgICBnZWJhZXVkZUlkOiBudW1iZXI7XG4gICAgICAgIGdlYmFldWRlQmV6ZWljaG51bmc6IHN0cmluZztcbiAgICAgICAgYW5zcHJlY2hwYXJ0bmVySWQ6IG51bWJlcjtcbiAgICAgICAgdGVsZWZvbkxhbmR2b3J3YWhsOiBzdHJpbmc7XG4gICAgICAgIHRlbGVmb25PcnRzdm9yd2FobDogc3RyaW5nO1xuICAgICAgICB0ZWxlZm9uQW5sYWdlOiBzdHJpbmc7XG4gICAgICAgIHRlbGVmb25EdXJjaHdhaGw6IHN0cmluZztcbiAgICAgICAgYXBUZWxlZm9uTGFuZHZvcndhaGw6IHN0cmluZztcbiAgICAgICAgYXBUZWxlZm9uT3J0c3ZvcndhaGw6IHN0cmluZztcbiAgICAgICAgYXBUZWxlZm9uQW5sYWdlOiBzdHJpbmc7XG4gICAgICAgIGFwVGVsZWZvbkR1cmNod2FobDogc3RyaW5nO1xuICAgICAgICBhcEVtYWlsOiBzdHJpbmc7XG4gICAgICB9PigpO1xuXG4gICAgICBsZXQgY250UmVzb2x2ZWQgPSAwO1xuICAgICAgY29uc3QgYWNxdWlyZSA9ICh0b0FjcXVpcmU6IHN0cmluZykgPT4ge1xuICAgICAgICBpZiAoQmF5VklTX0Fuc3ByZWNocGFydG5lcl9EZXRhaWxzLmJ1ZmZlci5oYXModG9BY3F1aXJlKSkge1xuICAgICAgICAgIHJlc29sdmUoQmF5VklTX0Fuc3ByZWNocGFydG5lcl9EZXRhaWxzLmJ1ZmZlci5nZXQodG9BY3F1aXJlKSk7XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgIHVybDogYCR7d2luZG93LmNvZGJpLmJhc2VVUkx9cGx1Z2luP25hbWU9Q29kQmlfQmF5VklTX0F1c2t1bmZ0X0Fuc3ByZWNocGFydG5lcmRldGFpbHNgLFxuICAgICAgICAgIHR5cGU6IFwiR0VUXCIsXG4gICAgICAgICAgaGVhZGVyczogeyBBY2NlcHQ6IFwiYXBwbGljYXRpb24veG1sXCIsIElEOiB0b0FjcXVpcmUudHJpbSgpIH0sXG4gICAgICAgIH0pXG4gICAgICAgICAgLmRvbmUoKHhtbDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjbnRSZXNvbHZlZCsrO1xuXG4gICAgICAgICAgICBsZXQgcmVzcG9uc2UgPSBuZXcgWE1MUGFyc2VyKHsgYXR0cmlidXRlTmFtZVByZWZpeDogXCJcIiwgaWdub3JlQXR0cmlidXRlczogZmFsc2UgfSkucGFyc2UoeG1sKVtcbiAgICAgICAgICAgICAgXCJuczI6YW5zcHJlY2hwYXJ0bmVyXCJcbiAgICAgICAgICAgIF07XG4gICAgICAgICAgICAvLyAjcmVnaW9uIFJlYWN0IGlmIGRhdGEgaXMgbm90IG9mIGZvcm1hdCBYTUwgYnV0IEpTT04uXG4gICAgICAgICAgICBpZiAocmVzcG9uc2UgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICByZXNwb25zZSA9IEpTT04ucGFyc2UoeG1sKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vICNlbmRyZWdpb24gUmVhY3QgaWYgZGF0YSBpcyBub3Qgb2YgZm9ybWF0IFhNTCBidXQgSlNPTi5cbiAgICAgICAgICAgIC8vIElmIGNvbnRhY3QgcHJvcGVydGllcyBhcmUgdG8gYmUgcmV0cmlldmVkIGJ1dCBhIHNwZWNpZmljIGRldGFpbC5cbiAgICAgICAgICAgIGlmIChwYXJhbXMubGVuZ3RoID49IDIpIHtcbiAgICAgICAgICAgICAgY29uc3QgZGV0YWlsID0gKHJlc3VsdCBhcyB1bmtub3duKVtwYXJhbXNbMV0gYXMgc3RyaW5nXTtcblxuICAgICAgICAgICAgICBpZiAoZGV0YWlsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IENvZEJpRXJyb3IoYERldGFpbCBcIiR7cGFyYW1zWzFdfVwiIG9mIGF1dGhvcml0aWVzIGlzIG5vdCBhdmFpbGFibGUuYCkpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgKHJlc3VsdCBhcyBBcnJheTxzdHJpbmc+KS5wdXNoKGRldGFpbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBJZiBvbmx5IG9uZSBjb250YWN0IHNoYWxsIGJlIHJldHJpZXZlZC4uLlxuICAgICAgICAgICAgaWYgKGlkcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgcmVzdWx0ID0gQXJyYXkuaXNBcnJheShyZXNwb25zZS5hcClcbiAgICAgICAgICAgICAgICA/IHJlc3BvbnNlLmFwWzBdXG4gICAgICAgICAgICAgICAgOiAocmVzcG9uc2UuYXAgYXMge1xuICAgICAgICAgICAgICAgICAgICBhbnJlZGU6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgICAgdm9ybmFtZTogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICBuYWNobmFtZTogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICBmdW5rdGlvbjogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICBzdGVsbGVuYmV6ZWljaG51bmc6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgICAgZW1haWw6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgICAgd2Vic2l0ZTogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICB6aW1tZXI6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgICAgYmVob2VyZGVJZDogbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICBiZWhvZXJkZUJlemVpY2hudW5nOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgIGdlYmFldWRlSWQ6IG51bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgZ2ViYWV1ZGVCZXplaWNobnVuZzogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICBhbnNwcmVjaHBhcnRuZXJJZDogbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICB0ZWxlZm9uTGFuZHZvcndhaGw6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgICAgdGVsZWZvbk9ydHN2b3J3YWhsOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgIHRlbGVmb25BbmxhZ2U6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgICAgdGVsZWZvbkR1cmNod2FobDogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICBhcFRlbGVmb25MYW5kdm9yd2FobDogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICBhcFRlbGVmb25PcnRzdm9yd2FobDogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICBhcFRlbGVmb25BbmxhZ2U6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgICAgYXBUZWxlZm9uRHVyY2h3YWhsOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgIGFwRW1haWw6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAvLyBUbyBwcmV2ZW50IG92ZXJ3cml0aW5nIHdoZW4gam9pbmluZyBlLmcuIEJlaG9lcmRlbi1EZXRhaWxzIGFuZCBHZWJhZXVkZS1EZXRhaWxzIGludG8gb25lIG9iamVjdCBsaWtlXG4gICAgICAgICAgICAgIC8vIHdoZW4gdXNpbmcgdGhlIERhdGEuSm9pbi1FbGVtZW50cGxhY2Vob2xkZXIuXG4gICAgICAgICAgICAgIChyZXN1bHQgYXMgeyBhcFRlbGVmb25PcnRzdm9yd2FobDogc3RyaW5nIH0pLmFwVGVsZWZvbk9ydHN2b3J3YWhsID0gKFxuICAgICAgICAgICAgICAgIHJlc3VsdCBhcyB7IHRlbGVmb25PcnRzdm9yd2FobDogc3RyaW5nIH1cbiAgICAgICAgICAgICAgKS50ZWxlZm9uT3J0c3ZvcndhaGw7XG4gICAgICAgICAgICAgIChyZXN1bHQgYXMgeyBhcFRlbGVmb25BbmxhZ2U6IHN0cmluZyB9KS5hcFRlbGVmb25BbmxhZ2UgPSAoXG4gICAgICAgICAgICAgICAgcmVzdWx0IGFzIHsgdGVsZWZvbkFubGFnZTogc3RyaW5nIH1cbiAgICAgICAgICAgICAgKS50ZWxlZm9uQW5sYWdlO1xuICAgICAgICAgICAgICAocmVzdWx0IGFzIHsgYXBUZWxlZm9uRHVyY2h3YWhsOiBzdHJpbmcgfSkuYXBUZWxlZm9uRHVyY2h3YWhsID0gKFxuICAgICAgICAgICAgICAgIHJlc3VsdCBhcyB7IHRlbGVmb25EdXJjaHdhaGw6IHN0cmluZyB9XG4gICAgICAgICAgICAgICkudGVsZWZvbkR1cmNod2FobDtcbiAgICAgICAgICAgICAgKHJlc3VsdCBhcyB7IGFwRW1haWw6IHN0cmluZyB9KS5hcEVtYWlsID0gKHJlc3VsdCBhcyB7IGVtYWlsOiBzdHJpbmcgfSkuZW1haWw7XG5cbiAgICAgICAgICAgICAgQmF5VklTX0Fuc3ByZWNocGFydG5lcl9EZXRhaWxzLmJ1ZmZlclt0b0FjcXVpcmVdID0gW1xuICAgICAgICAgICAgICAgIHJlc3VsdCBhcyB7XG4gICAgICAgICAgICAgICAgICBhbnJlZGU6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgIHZvcm5hbWU6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgIG5hY2huYW1lOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICBmdW5rdGlvbjogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgc3RlbGxlbmJlemVpY2hudW5nOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICBlbWFpbDogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgd2Vic2l0ZTogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgemltbWVyOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICBiZWhvZXJkZUlkOiBudW1iZXI7XG4gICAgICAgICAgICAgICAgICBiZWhvZXJkZUJlemVpY2hudW5nOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICBnZWJhZXVkZUlkOiBudW1iZXI7XG4gICAgICAgICAgICAgICAgICBnZWJhZXVkZUJlemVpY2hudW5nOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICBhbnNwcmVjaHBhcnRuZXJJZDogbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgdGVsZWZvbkxhbmR2b3J3YWhsOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICB0ZWxlZm9uT3J0c3ZvcndhaGw6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgIHRlbGVmb25BbmxhZ2U6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgIHRlbGVmb25EdXJjaHdhaGw6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgIGFwVGVsZWZvbkxhbmR2b3J3YWhsOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICBhcFRlbGVmb25PcnRzdm9yd2FobDogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgYXBUZWxlZm9uQW5sYWdlOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICBhcFRlbGVmb25EdXJjaHdhaGw6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgIGFwRW1haWw6IHN0cmluZztcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICAgIHJlc29sdmUoXG4gICAgICAgICAgICAgICAgcmVzdWx0IGFzIHtcbiAgICAgICAgICAgICAgICAgIGFucmVkZTogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgdm9ybmFtZTogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgbmFjaG5hbWU6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgIGZ1bmt0aW9uOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICBzdGVsbGVuYmV6ZWljaG51bmc6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgIGVtYWlsOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICB3ZWJzaXRlOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICB6aW1tZXI6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgIGJlaG9lcmRlSWQ6IG51bWJlcjtcbiAgICAgICAgICAgICAgICAgIGJlaG9lcmRlQmV6ZWljaG51bmc6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgIGdlYmFldWRlSWQ6IG51bWJlcjtcbiAgICAgICAgICAgICAgICAgIGdlYmFldWRlQmV6ZWljaG51bmc6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgIGFuc3ByZWNocGFydG5lcklkOiBudW1iZXI7XG4gICAgICAgICAgICAgICAgICB0ZWxlZm9uTGFuZHZvcndhaGw6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgIHRlbGVmb25PcnRzdm9yd2FobDogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgdGVsZWZvbkFubGFnZTogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgdGVsZWZvbkR1cmNod2FobDogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgYXBUZWxlZm9uTGFuZHZvcndhaGw6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgIGFwVGVsZWZvbk9ydHN2b3J3YWhsOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICBhcFRlbGVmb25BbmxhZ2U6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgIGFwVGVsZWZvbkR1cmNod2FobDogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgYXBFbWFpbDogc3RyaW5nO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBjb25zdCByZXN1bHRFbGVtZW50OiB7XG4gICAgICAgICAgICAgICAgYW5yZWRlOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgdm9ybmFtZTogc3RyaW5nO1xuICAgICAgICAgICAgICAgIG5hY2huYW1lOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgZnVua3Rpb246IHN0cmluZztcbiAgICAgICAgICAgICAgICBzdGVsbGVuYmV6ZWljaG51bmc6IHN0cmluZztcbiAgICAgICAgICAgICAgICBlbWFpbDogc3RyaW5nO1xuICAgICAgICAgICAgICAgIHdlYnNpdGU6IHN0cmluZztcbiAgICAgICAgICAgICAgICB6aW1tZXI6IHN0cmluZztcbiAgICAgICAgICAgICAgICBiZWhvZXJkZUlkOiBudW1iZXI7XG4gICAgICAgICAgICAgICAgYmVob2VyZGVCZXplaWNobnVuZzogc3RyaW5nO1xuICAgICAgICAgICAgICAgIGdlYmFldWRlSWQ6IG51bWJlcjtcbiAgICAgICAgICAgICAgICBnZWJhZXVkZUJlemVpY2hudW5nOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgYW5zcHJlY2hwYXJ0bmVySWQ6IG51bWJlcjtcbiAgICAgICAgICAgICAgICB0ZWxlZm9uTGFuZHZvcndhaGw6IHN0cmluZztcbiAgICAgICAgICAgICAgICB0ZWxlZm9uT3J0c3ZvcndhaGw6IHN0cmluZztcbiAgICAgICAgICAgICAgICB0ZWxlZm9uQW5sYWdlOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgdGVsZWZvbkR1cmNod2FobDogc3RyaW5nO1xuICAgICAgICAgICAgICAgIGFwVGVsZWZvbkxhbmR2b3J3YWhsOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgYXBUZWxlZm9uT3J0c3ZvcndhaGw6IHN0cmluZztcbiAgICAgICAgICAgICAgICBhcFRlbGVmb25BbmxhZ2U6IHN0cmluZztcbiAgICAgICAgICAgICAgICBhcFRlbGVmb25EdXJjaHdhaGw6IHN0cmluZztcbiAgICAgICAgICAgICAgICBhcEVtYWlsOiBzdHJpbmc7XG4gICAgICAgICAgICAgIH0gPSBBcnJheS5pc0FycmF5KHJlc3BvbnNlLmFwKSA/IHJlc3BvbnNlLmFwWzBdIDogcmVzcG9uc2UuYXA7XG4gICAgICAgICAgICAgIC8vIFRvIHByZXZlbnQgb3ZlcndyaXRpbmcgd2hlbiBqb2luaW5nIGUuZy4gQmVob2VyZGVuLURldGFpbHMgYW5kIEdlYmFldWRlLURldGFpbHMgaW50byBvbmUgb2JqZWN0IGxpa2VcbiAgICAgICAgICAgICAgLy8gd2hlbiB1c2luZyB0aGUgRGF0YS5Kb2luLUVsZW1lbnRwbGFjZWhvbGRlci5cbiAgICAgICAgICAgICAgcmVzdWx0RWxlbWVudC5hcFRlbGVmb25PcnRzdm9yd2FobCA9IHJlc3VsdEVsZW1lbnQudGVsZWZvbk9ydHN2b3J3YWhsO1xuICAgICAgICAgICAgICByZXN1bHRFbGVtZW50LmFwVGVsZWZvbk9ydHN2b3J3YWhsID0gcmVzdWx0RWxlbWVudC50ZWxlZm9uT3J0c3ZvcndhaGw7XG4gICAgICAgICAgICAgIHJlc3VsdEVsZW1lbnQuYXBUZWxlZm9uQW5sYWdlID0gcmVzdWx0RWxlbWVudC50ZWxlZm9uQW5sYWdlO1xuICAgICAgICAgICAgICByZXN1bHRFbGVtZW50LmFwVGVsZWZvbkR1cmNod2FobCA9IHJlc3VsdEVsZW1lbnQudGVsZWZvbkR1cmNod2FobDtcbiAgICAgICAgICAgICAgcmVzdWx0RWxlbWVudC5hcEVtYWlsID0gcmVzdWx0RWxlbWVudC5lbWFpbDtcblxuICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgcmVzdWx0IGFzIEFycmF5PHtcbiAgICAgICAgICAgICAgICAgIGFucmVkZTogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgdm9ybmFtZTogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgbmFjaG5hbWU6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgIGZ1bmt0aW9uOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICBzdGVsbGVuYmV6ZWljaG51bmc6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgIGVtYWlsOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICB3ZWJzaXRlOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICB6aW1tZXI6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgIGJlaG9lcmRlSWQ6IG51bWJlcjtcbiAgICAgICAgICAgICAgICAgIGJlaG9lcmRlQmV6ZWljaG51bmc6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgIGdlYmFldWRlSWQ6IG51bWJlcjtcbiAgICAgICAgICAgICAgICAgIGdlYmFldWRlQmV6ZWljaG51bmc6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgIGFuc3ByZWNocGFydG5lcklkOiBudW1iZXI7XG4gICAgICAgICAgICAgICAgICB0ZWxlZm9uTGFuZHZvcndhaGw6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgIHRlbGVmb25PcnRzdm9yd2FobDogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgdGVsZWZvbkFubGFnZTogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgdGVsZWZvbkR1cmNod2FobDogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgYXBUZWxlZm9uTGFuZHZvcndhaGw6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgIGFwVGVsZWZvbk9ydHN2b3J3YWhsOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgICBhcFRlbGVmb25BbmxhZ2U6IHN0cmluZztcbiAgICAgICAgICAgICAgICAgIGFwVGVsZWZvbkR1cmNod2FobDogc3RyaW5nO1xuICAgICAgICAgICAgICAgICAgYXBFbWFpbDogc3RyaW5nO1xuICAgICAgICAgICAgICAgIH0+XG4gICAgICAgICAgICAgICkucHVzaChyZXN1bHRFbGVtZW50KTtcbiAgICAgICAgICAgICAgLy8gUmVzb2x2ZSB3aGVuIGxhc3QgY29udGFjdCB0byByZXRyaWV2ZSB3YXMgcmVjZWl2ZWQuXG4gICAgICAgICAgICAgIGlmIChjbnRSZXNvbHZlZCA9PT0gaWRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9Bc3NpZ25JbkV4cHJlc3Npb25zOiBNb3JlIGNvbmNpc2UuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgoQmF5VklTX0Fuc3ByZWNocGFydG5lcl9EZXRhaWxzLmJ1ZmZlclt0b0FjcXVpcmVdID0gcmVzdWx0IGFzIFtdKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICAgICAgIC5mYWlsKChYOiB1bmtub3duKSA9PiB7XG4gICAgICAgICAgICByZWplY3QobmV3IENvZEJpRXJyb3IoXCJVbmFibGUgdG8gcmV0cmlldmUgZGF0YSBmcm9tIENvZEJpX0JheVZJU19BdXNrdW5mdF9BbnNwcmVjaHBhcnRuZXJkZXRhaWxzXCIpKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgICAvLyAjcmVnaW9uIFJldHJpZXZlIHRoZSBkZXRhaWxzIG9mIHRoZSBzcGVjaWZpZWQgY29udGFjdHMuXG4gICAgICBjb25zdCBpZHMgPSAocGFyYW1zWzBdPy50b1N0cmluZygpIGFzIHN0cmluZykuc3BsaXQoXCIvXCIpLm1hcCgodG9UcmltKSA9PiB0b1RyaW0udHJpbSgpKTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKE51bWJlci5pc05hTihOdW1iZXIucGFyc2VJbnQoaWRzW2ldIGFzIHN0cmluZykpKSB7XG4gICAgICAgICAgQmF5VklTX0Fuc3ByZWNocGFydG5lcl9JRC5yZXRyaWV2ZShbaWRzW2ldLnRyaW0oKV0pLnRoZW4oKGlkKSA9PiB7XG4gICAgICAgICAgICBpZiAoKGlkIGFzIEFycmF5PHN0cmluZz4pWzBdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgYWNxdWlyZSgoaWQgYXMgQXJyYXk8c3RyaW5nPilbMF0udG9TdHJpbmcoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYWNxdWlyZShpZHNbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyAjZW5kcmVnaW9uIFJldHJpZXZlIHRoZSBkZXRhaWxzIG9mIHRoZSBzcGVjaWZpZWQgY29udGFjdHMuXG4gICAgfSk7XG4gIH1cbiAgLy8gI3JlZ2lvbiBJbml0aWFsaXphdGlvblxuICAvKipcbiAgICogU3RhdGVzIHdoZXRoZXIgdGhpcyB7QGxpbmsgQmF5VklTX0Fuc3ByZWNocGFydG5lcl9EZXRhaWxzIH0gd2FzIHN1Y2Nlc3NmdWxseSByZWdpc3RlcmVkXG4gICAqIHZpYSB7QGxpbmsgQ29kYmlHbG9iYWwucmVnaXN0ZXJFUCB9IHdpdGggdGhlIENvZEJpIGFuZCBwZXJmb3JtcyB0aGUgcmVnaXN0cmF0aW9uIHVwb24gY2xhc3MgdXNhZ2UuKi9cbiAgcHVibGljIHN0YXRpYyByZWdpc3RlcmVkOiBib29sZWFuID0gKCgpID0+IHtcbiAgICByZXR1cm4gd2luZG93LmNvZGJpLnJlZ2lzdGVyRVAoXCJCYXlWSVMuQW5zcHJlY2hwYXJ0bmVyLkRldGFpbHNcIiwgQmF5VklTX0Fuc3ByZWNocGFydG5lcl9EZXRhaWxzLnJldHJpZXZlKTtcbiAgfSkoKTtcbiAgLy8gI3JlZ2lvbiBJbml0aWFsaXphdGlvblxufVxuIiwgImltcG9ydCB7IERCQyB9IGZyb20gXCIuLi9EQkNcIjtcclxuLyoqXHJcbiAqIEEge0BsaW5rIERCQyB9IGRlZmluaW5nIHRoYXQgYWxsIGVsZW1lbnRzIG9mIGFuIHtAbGluayBvYmplY3QgfXMgaGF2ZSB0byBmdWxmaWxsXHJcbiAqIG9uZSBvZiB0aGUgZ2l2ZW4ge0BsaW5rIG9iamVjdCB9cyBjaGVjay1tZXRob2RzICgqKiggdG9DaGVjayA6IGFueSApID0+IGJvb2xlYW4gfCBzdHJpbmcqKiApLlxyXG4gKlxyXG4gKiBAcmVtYXJrc1xyXG4gKiBNYWludGFpbmVyOiBDYWxsYXJpLCBTYWx2YXRvcmUgKFhEQkNAV2FYQ29kZS5uZXQpICovXHJcbmV4cG9ydCBjbGFzcyBPUiBleHRlbmRzIERCQyB7XHJcblx0Ly8gI3JlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXHJcblx0LyoqXHJcblx0ICogQ2hlY2tzIHRoZSAqKnZhbHVlKiogYWdhaW5zdCB0aGUgZ2l2ZW4gKipjb25kaXRpb25zKipcclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBjb25kaXRpb25zXHRUaGUgKip7IGNoZWNrOiAodG9DaGVjazogYW55KSA9PiBib29sZWFuIHwgc3RyaW5nIH0qKi17QGxpbmsgb2JqZWN0IH1zIHRvIGNoZWNrIHRoZSAqKnZhbHVlKiogYWdhaW5zdC5cclxuXHQgKiBAcGFyYW0gdmFsdWVcdFx0XHRFaXRoZXIgKip2YWx1ZSoqLXtAbGluayBBcnJheSA8IGFueSA+fSwgd2hpY2gncyBlbGVtZW50cyB3aWxsIGJlIGNoZWNrZWQsIG9yIHRoZSB2YWx1ZSB0byBiZVxyXG5cdCAqIFx0XHRcdFx0XHRcdGNoZWNrZWQgaXRzZWxmLlxyXG5cdCAqIEBwYXJhbSBpbmRleFx0XHRcdElmIHNwZWNpZmllZCB3aXRoIFwiaWR4RW5kXCIgYmVpbmcgdW5kZWZpbmVkLCB0aGlzIHtAbGluayBOdW1iZXIgfSB3aWxsIGJlIHNlZW4gYXMgdGhlIGluZGV4IG9mXHJcblx0ICogXHRcdFx0XHRcdFx0dGhlIHZhbHVlLXtAbGluayBBcnJheSB9J3MgZWxlbWVudCB0byBjaGVjay4gSWYgdmFsdWUgaXNuJ3QgYW4ge0BsaW5rIEFycmF5IH0gdGhpcyBwYXJhbWV0ZXJcclxuXHQgKiBcdFx0XHRcdFx0XHR3aWxsIG5vdCBoYXZlIGFueSBlZmZlY3QuXHJcblx0ICogXHRcdFx0XHRcdFx0V2l0aCBcImlkeEVuZFwiIG5vdCB1bmRlZmluZWQgdGhpcyBwYXJhbWV0ZXIgaW5kaWNhdGVzIHRoZSBiZWdpbm5pbmcgb2YgdGhlIHNwYW4gb2YgZWxlbWVudHMgdG9cclxuXHQgKiBcdFx0XHRcdFx0XHRjaGVjayB3aXRoaW4gdGhlIHZhbHVlLXtAbGluayBBcnJheSB9LlxyXG5cdCAqIEBwYXJhbSBpZHhFbmRcdFx0SW5kaWNhdGVzIHRoZSBsYXN0IGVsZW1lbnQncyBpbmRleCAoaW5jbHVkaW5nKSBvZiB0aGUgc3BhbiBvZiB2YWx1ZS17QGxpbmsgQXJyYXkgfSBlbGVtZW50cyB0byBjaGVjay5cclxuXHQgKiBcdFx0XHRcdFx0XHRTZXR0aW5nIHRoaXMgcGFyYW1ldGVyIHRvIC0xIHNwZWNpZmllcyB0aGF0IGFsbCB2YWx1ZS17QGxpbmsgQXJyYXkgfSdzIGVsZW1lbnRzIGJlZ2lubmluZyBmcm9tIHRoZVxyXG5cdCAqIFx0XHRcdFx0XHRcdHNwZWNpZmllZCAqKmluZGV4Kiogc2hhbGwgYmUgY2hlY2tlZC5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFRSVUUgaWYgYXQgbGVhc3Qgb25lIG9mIHRoZSBwcm92aWRlZCAqKmNvbmRpdGlvbnMqKiBpcyBmdWxmaWxsZWQsIG90aGVyd2lzZSBhIHtAbGluayBzdHJpbmcgfSBjb250YWluaW5nIGFsbCAqKmNvbmRpdGlvbnMqKiByZXR1cm5lZCB7QGxpbmsgc3RyaW5nIH1zIHNlcGFyYXRlZCBieSBcIiB8fCBcIi4gKi9cclxuXHRwdWJsaWMgc3RhdGljIGNoZWNrQWxnb3JpdGhtKFxyXG5cdFx0Y29uZGl0aW9uczogQXJyYXk8e1xyXG5cdFx0XHRjaGVjazogKHRvQ2hlY2s6IHVua25vd24gfCB1bmRlZmluZWQgfCBudWxsIHwgb2JqZWN0KSA9PiBib29sZWFuIHwgc3RyaW5nO1xyXG5cdFx0fT4sXHJcblx0XHR2YWx1ZTogdW5rbm93biB8IG51bGwgfCB1bmRlZmluZWQsXHJcblx0KTogYm9vbGVhbiB8IHN0cmluZyB7XHJcblx0XHRsZXQgcmVzdWx0ID0gXCJcIjtcclxuXHJcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGNvbmRpdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0Y29uc3QgY29uZGl0aW9uUmVzdWx0ID0gY29uZGl0aW9uc1tpXS5jaGVjayh2YWx1ZSk7XHJcblxyXG5cdFx0XHRpZiAodHlwZW9mIGNvbmRpdGlvblJlc3VsdCA9PT0gXCJzdHJpbmdcIikge1xyXG5cdFx0XHRcdHJlc3VsdCArPSBgJHtjb25kaXRpb25SZXN1bHR9JHtpID09PSBjb25kaXRpb25zLmxlbmd0aCAtIDEgPyBcIlwiIDogXCIgb3IgXCJ9YDtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiByZXN1bHQ7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgcGFyYW1ldGVyLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgT1IuY2hlY2tBbGdvcml0aG0gfSB3aXRoIGVpdGhlciBtdWx0aXBsZSBvciBhIHNpbmdsZSBvbmVcclxuXHQgKiBvZiB0aGUgKipyZWFsQ29uZGl0aW9ucyoqIHRvIGNoZWNrIHRoZSB0YWdnZWQgcGFyYW1ldGVyLXZhbHVlIGFnYWluc3Qgd2l0aC5cclxuXHQgKiBXaGVuIHNwZWNpZnlpbmcgYW4gKippbmRleCoqIGFuZCB0aGUgdGFnZ2VkIHBhcmFtZXRlcidzICoqdmFsdWUqKiBpcyBhbiB7QGxpbmsgQXJyYXkgfSwgdGhlICoqcmVhbENvbmRpdGlvbnMqKiBhcHBseSB0byB0aGVcclxuXHQgKiBlbGVtZW50IGF0IHRoZSBzcGVjaWZpZWQgKippbmRleCoqLlxyXG5cdCAqIElmIHRoZSB7QGxpbmsgQXJyYXkgfSBpcyB0b28gc2hvcnQgdGhlIGN1cnJlbnRseSBwcm9jZXNzZWQgeyBjaGVjazogKHRvQ2hlY2s6IGFueSkgPT4gYm9vbGVhbiB8IHN0cmluZyB9IG9mXHJcblx0ICogKipyZWFsQ29uZGl0aW9ucyoqIHdpbGwgYmUgdmVyaWZpZWQgdG8gVFJVRSBhdXRvbWF0aWNhbGx5LCBjb25zaWRlcmluZyBvcHRpb25hbCBwYXJhbWV0ZXJzLlxyXG5cdCAqIElmIGFuICoqaW5kZXgqKiBpcyBzcGVjaWZpZWQgYnV0IHRoZSB0YWdnZWQgcGFyYW1ldGVyJ3MgdmFsdWUgaXNuJ3QgYW4gYXJyYXksIHRoZSAqKmluZGV4KiogaXMgdHJlYXRlZCBhcyBiZWluZyB1bmRlZmluZWQuXHJcblx0ICogSWYgKippbmRleCoqIGlzIHVuZGVmaW5lZCBhbmQgdGhlIHRhZ2dlZCBwYXJhbWV0ZXIncyB2YWx1ZSBpcyBhbiB7QGxpbmsgQXJyYXkgfSBlYWNoIGVsZW1lbnQgb2YgaXQgd2lsbCBiZSBjaGVja2VkXHJcblx0ICogYWdhaW5zdCB0aGUgKipyZWFsQ29uZGl0aW9ucyoqLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHJlYWxDb25kaXRpb25zXHRFaXRoZXIgb25lIG9yIG1vcmUgKip7IGNoZWNrOiAodG9DaGVjazogYW55KSA9PiBib29sZWFuIHwgc3RyaW5nIH0qKiB0byBjaGVjayB0aGUgdGFnZ2VkIHBhcmFtZXRlci12YWx1ZVxyXG5cdCAqIFx0XHRcdFx0XHRcdFx0YWdhaW5zdCB3aXRoLlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cclxuXHQgKiBAcGFyYW0gZGJjXHRcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zXHRBIHtAbGluayBzdHJpbmcgfSBhcyBzb29uIGFzIG9uZSB7IGNoZWNrOiAodG9DaGVjazogYW55KSA9PiBib29sZWFuIHwgc3RyaW5nIH0gb2YgKipyZWFsQ29uZGl0aW9ucyoqIHJldHVybnMgb25lLlxyXG5cdCAqIFx0XHRcdE90aGVyd2lzZSBUUlVFLiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgUFJFKFxyXG5cdFx0Y29uZGl0aW9uczogQXJyYXk8e1xyXG5cdFx0XHRjaGVjazogKHRvQ2hlY2s6IHVua25vd24gfCB1bmRlZmluZWQgfCBudWxsIHwgb2JqZWN0KSA9PiBib29sZWFuIHwgc3RyaW5nO1xyXG5cdFx0fT4sXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXHJcblx0KTogKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRtZXRob2ROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXHJcblx0XHRwYXJhbWV0ZXJJbmRleDogbnVtYmVyLFxyXG5cdCkgPT4gdm9pZCB7XHJcblx0XHRyZXR1cm4gREJDLmRlY1ByZWNvbmRpdGlvbihcclxuXHRcdFx0KFxyXG5cdFx0XHRcdHZhbHVlOiBvYmplY3QsXHJcblx0XHRcdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRcdFx0bWV0aG9kTmFtZTogc3RyaW5nLFxyXG5cdFx0XHRcdHBhcmFtZXRlckluZGV4OiBudW1iZXIsXHJcblx0XHRcdCkgPT4ge1xyXG5cdFx0XHRcdHJldHVybiBPUi5jaGVja0FsZ29yaXRobShjb25kaXRpb25zLCB2YWx1ZSk7XHJcblx0XHRcdH0sXHJcblx0XHRcdGRiYyxcclxuXHRcdFx0cGF0aCxcclxuXHRcdCk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgT1IuY2hlY2tBbGdvcml0aG0gfSB3aXRoIGVpdGhlciBtdWx0aXBsZSBvciBhIHNpbmdsZSBvbmVcclxuXHQgKiBvZiB0aGUgKipyZWFsQ29uZGl0aW9ucyoqIHRvIGNoZWNrIHRoZSB0YWdnZWQgbWV0aG9kJ3MgcmV0dXJuLXZhbHVlIGFnYWluc3Qgd2l0aC5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSByZWFsQ29uZGl0aW9uc1x0RWl0aGVyIG9uZSBvciBtb3JlIHsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSB0byBjaGVjayB0aGUgdGFnZ2VkIHBhcmFtZXRlci12YWx1ZVxyXG5cdCAqIFx0XHRcdFx0XHRcdFx0YWdhaW5zdCB3aXRoLlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cclxuXHQgKiBAcGFyYW0gZGJjXHRcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zXHRBIHtAbGluayBzdHJpbmcgfSBhcyBzb29uIGFzIG9uZSAqKnsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSoqIG9mICoqcmVhbENvbmRpdGlvbnMqKiByZXR1cm4gb25lLlxyXG5cdCAqIFx0XHRcdE90aGVyd2lzZSBUUlVFLiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgUE9TVChcclxuXHRcdGNvbmRpdGlvbnM6IEFycmF5PHtcclxuXHRcdFx0Y2hlY2s6ICh0b0NoZWNrOiB1bmtub3duIHwgdW5kZWZpbmVkIHwgbnVsbCB8IG9iamVjdCkgPT4gYm9vbGVhbiB8IHN0cmluZztcclxuXHRcdH0+LFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjID0gXCJXYVhDb2RlLkRCQ1wiLFxyXG5cdCk6IChcclxuXHRcdHRhcmdldDogb2JqZWN0LFxyXG5cdFx0cHJvcGVydHlLZXk6IHN0cmluZyxcclxuXHRcdGRlc2NyaXB0b3I6IFByb3BlcnR5RGVzY3JpcHRvcixcclxuXHQpID0+IFByb3BlcnR5RGVzY3JpcHRvciB7XHJcblx0XHRyZXR1cm4gREJDLmRlY1Bvc3Rjb25kaXRpb24oXHJcblx0XHRcdCh2YWx1ZTogb2JqZWN0LCB0YXJnZXQ6IG9iamVjdCwgcHJvcGVydHlLZXk6IHN0cmluZykgPT4ge1xyXG5cdFx0XHRcdHJldHVybiBPUi5jaGVja0FsZ29yaXRobShjb25kaXRpb25zLCB2YWx1ZSk7XHJcblx0XHRcdH0sXHJcblx0XHRcdGRiYyxcclxuXHRcdFx0cGF0aCxcclxuXHRcdCk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgZmllbGQtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBPUi5jaGVja0FsZ29yaXRobSB9IHdpdGggZWl0aGVyIG11bHRpcGxlIG9yIGEgc2luZ2xlIG9uZVxyXG5cdCAqIG9mIHRoZSAqKnJlYWxDb25kaXRpb25zKiogdG8gY2hlY2sgdGhlIHRhZ2dlZCBmaWVsZC5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSByZWFsQ29uZGl0aW9uc1x0RWl0aGVyIG9uZSBvciBtb3JlIHsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSB0byBjaGVjayB0aGUgdGFnZ2VkIHBhcmFtZXRlci12YWx1ZVxyXG5cdCAqIFx0XHRcdFx0XHRcdFx0YWdhaW5zdCB3aXRoLlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cclxuXHQgKiBAcGFyYW0gZGJjXHRcdFx0XHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zXHRTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIElOVkFSSUFOVChcclxuXHRcdGNvbmRpdGlvbnM6IEFycmF5PHtcclxuXHRcdFx0Y2hlY2s6ICh0b0NoZWNrOiB1bmtub3duIHwgdW5kZWZpbmVkIHwgbnVsbCB8IG9iamVjdCkgPT4gYm9vbGVhbiB8IHN0cmluZztcclxuXHRcdH0+LFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjID0gXCJXYVhDb2RlLkRCQ1wiLFxyXG5cdCkge1xyXG5cdFx0cmV0dXJuIERCQy5kZWNJbnZhcmlhbnQoW25ldyBPUihjb25kaXRpb25zKV0sIHBhdGgsIGRiYyk7XHJcblx0fVxyXG5cdC8vICNlbmRyZWdpb24gQ29uZGl0aW9uIGNoZWNraW5nLlxyXG5cdC8vICNyZWdpb24gUmVmZXJlbmNlZCBDb25kaXRpb24gY2hlY2tpbmcuXHJcblx0Ly9cclxuXHQvLyBGb3IgdXNhZ2UgaW4gZHluYW1pYyBzY2VuYXJpb3MgKGxpa2UgZ2xvYmFsIGZ1bmN0aW9ucykuXHJcblx0Ly9cclxuXHQvKipcclxuXHQgKiBJbnZva2VzIHRoZSB7QGxpbmsgT1IuY2hlY2tBbGdvcml0aG0gfSBwYXNzaW5nIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBhbmQge0BsaW5rIE9SLmNvbmRpdGlvbnMgfS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0b0NoZWNrIFNlZSB7QGxpbmsgT1IuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFNlZSB7QGxpbmsgT1IuY2hlY2tBbGdvcml0aG19LiAqL1xyXG5cdHB1YmxpYyBjaGVjayh0b0NoZWNrOiB1bmtub3duIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xyXG5cdFx0cmV0dXJuIE9SLmNoZWNrQWxnb3JpdGhtKHRoaXMuY29uZGl0aW9ucywgdG9DaGVjayk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEludm9rZXMgdGhlIHtAbGluayBPUi5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqIGFuZCB0aGUge0BsaW5rIE9SLnR5cGUgfSAuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdG9DaGVjayBTZWUge0BsaW5rIE9SLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBUaGUgKipDQU5ESURBVEUqKiAqKnRvQ2hlY2sqKiBkb2Vzbid0IGZ1bGZpbGwgdGhpcyB7QGxpbmsgT1IgfS5cclxuXHQgKiBcclxuXHQgKiBAdGhyb3dzIEEge0BsaW5rIERCQy5JbmZyaW5nZW1lbnQgfSBpZiB0aGUgKipDQU5ESURBVEUqKiAqKnRvQ2hlY2sqKiBkb2VzIG5vdCBmdWxmaWxsIHRoaXMge0BsaW5rIE9SIH0uKi9cclxuXHRwdWJsaWMgc3RhdGljIHRzQ2hlY2s8Q0FORElEQVRFPiggdG9DaGVjayA6IHVua25vd24gfCB1bmRlZmluZWQgfCBudWxsLGNvbmRpdGlvbnM6IEFycmF5PHtcclxuXHRcdFx0Y2hlY2s6ICh0b0NoZWNrOiB1bmtub3duIHwgdW5kZWZpbmVkIHwgbnVsbCB8IG9iamVjdCkgPT4gYm9vbGVhbiB8IHN0cmluZztcclxuXHRcdH0+ICkgOiBDQU5ESURBVEUge1xyXG5cdFx0Y29uc3QgcmVzdWx0ID0gT1IuY2hlY2tBbGdvcml0aG0oY29uZGl0aW9ucyx0b0NoZWNrICk7XHJcblxyXG5cdFx0aWYoIHJlc3VsdCApIHtcclxuXHRcdFx0cmV0dXJuIHRvQ2hlY2sgYXMgQ0FORElEQVRFIDtcclxuXHRcdH1cclxuXHRcdGVsc2Uge1xyXG5cdFx0XHR0aHJvdyBuZXcgREJDLkluZnJpbmdlbWVudCggcmVzdWx0IGFzIHN0cmluZyApO1xyXG5cdFx0fVxyXG5cdH1cclxuXHQvKipcclxuXHQgKiBDcmVhdGVzIHRoaXMge0BsaW5rIE9SIH0gYnkgc2V0dGluZyB0aGUgcHJvdGVjdGVkIHByb3BlcnR5IHtAbGluayBPUi5jb25kaXRpb25zIH0gdXNlZCBieSB7QGxpbmsgT1IuY2hlY2sgfS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBjb25kaXRpb25zIFNlZSB7QGxpbmsgT1IuY2hlY2sgfS4gKi9cclxuXHRwdWJsaWMgY29uc3RydWN0b3IoXHJcblx0XHRwcm90ZWN0ZWQgY29uZGl0aW9uczogQXJyYXk8e1xyXG5cdFx0XHRjaGVjazogKHRvQ2hlY2s6IHVua25vd24gfCB1bmRlZmluZWQgfCBudWxsKSA9PiBib29sZWFuIHwgc3RyaW5nO1xyXG5cdFx0fT4sXHJcblx0KSB7XHJcblx0XHRzdXBlcigpO1xyXG5cdH1cclxuXHQvLyAjZW5kcmVnaW9uIFJlZmVyZW5jZWQgQ29uZGl0aW9uIGNoZWNraW5nLlxyXG59XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSw4QkFBMEI7OztBQ0tuQixJQUFNLEtBQU4sTUFBTSxZQUFXLElBQUk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBdUtwQixZQUNJLFlBR1Q7QUFDRCxVQUFNO0FBSkk7QUFBQSxFQUtYO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBM0pBLE9BQWMsZUFDYixZQUdBLE9BQ21CO0FBQ25CLFFBQUksU0FBUztBQUViLGFBQVMsSUFBSSxHQUFHLElBQUksV0FBVyxRQUFRLEtBQUs7QUFDM0MsWUFBTSxrQkFBa0IsV0FBVyxDQUFDLEVBQUUsTUFBTSxLQUFLO0FBRWpELFVBQUksT0FBTyxvQkFBb0IsVUFBVTtBQUN4QyxrQkFBVSxHQUFHLGVBQWUsR0FBRyxNQUFNLFdB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
