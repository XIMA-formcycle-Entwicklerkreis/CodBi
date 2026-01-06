import {
  TYPE
} from "./chunk-MQ6BYLTP.js";
import {
  require_dist
} from "./chunk-2R3WETV4.js";
import {
  AE
} from "./chunk-RSH3LX4Y.js";
import {
  DBC
} from "./chunk-7Z6CEUOW.js";
import {
  __decorateClass,
  __decorateParam,
  __toESM
} from "./chunk-KWZW6WYL.js";

// src/js/EPs/date.holidays.ts
var import_fc_form_renderer = __toESM(require_dist(), 1);
var _Date_Holidays = class _Date_Holidays {
  static {
    /** Stores the requests already made. */
    this.buffer = /* @__PURE__ */ new Map();
  }
  /**
   * Generates a key-{@link string } that may be used to compare to {@link ApiRequest }s with each other.
   *
   * @param from The {@link ApiRequest } to generate the key from.
   *
   * @returns The requested key. */
  static genComparableKey(from) {
    const sortedYears = [...from.years].sort().join("-");
    const sortedStates = [...from.states].sort().join("-");
    return `${sortedYears}_${sortedStates}_${from.augsburg ? "T" : "F"}_${from.catholic ? "T" : "F"}`;
  }
  static retrieve(params) {
    const result = new Array();
    const years = new Array();
    const states = new Array();
    const augsburg = params.some((toCheck) => toCheck.toLowerCase() === "friedensfest");
    const katholic = params.some((toCheck) => toCheck.toLowerCase() === "katholisch");
    for (const parameter of params) {
      if (Number.isNaN(parameter)) {
        years.push(parameter);
      } else {
        if (parameter.toLowerCase().indexOf("this_year") !== -1) {
          let idxOperand = parameter.indexOf("+");
          if (idxOperand === -1) {
            idxOperand = parameter.indexOf("-");
          }
          if (idxOperand !== -1) {
            years.push(
              ((/* @__PURE__ */ new Date()).getFullYear() + Number.parseInt(parameter.substring(idxOperand + 1)) * (parameter.substring(idxOperand, idxOperand + 1) === "+" ? 1 : -1)).toString()
            );
          } else {
            years.push((/* @__PURE__ */ new Date()).getFullYear().toString());
          }
        } else if (parameter.toLowerCase().indexOf("friedensfest") === -1 && parameter.toLowerCase().indexOf("katholisch") === -1) {
          states.push(parameter.toLowerCase());
        }
      }
    }
    const promise = new Promise((resolve) => {
      if (_Date_Holidays.buffer.has(
        _Date_Holidays.genComparableKey({
          years,
          states,
          augsburg,
          catholic: katholic
        })
      )) {
        if (Array.isArray(
          _Date_Holidays.buffer.get(
            _Date_Holidays.genComparableKey({
              years,
              states,
              augsburg,
              catholic: katholic
            })
          )
        )) {
          resolve(
            _Date_Holidays.buffer.get(
              _Date_Holidays.genComparableKey({
                years,
                states,
                augsburg,
                catholic: katholic
              })
            )
          );
          return;
        } else {
          _Date_Holidays.buffer.get(
            _Date_Holidays.genComparableKey({
              years,
              states,
              augsburg,
              catholic: katholic
            })
          ).then((result2) => {
            resolve(result2);
          });
        }
        return;
      }
      const $ = (0, import_fc_form_renderer.getJQuery)();
      $.ajax({
        url: `${window.codbi.baseURL}plugin?name=CodBi_Holidays_FeiertageDE`,
        type: "GET",
        headers: {
          years: years.join(","),
          states: states.join(",").replace(/ /g, ""),
          augsburg: augsburg ? "true" : "false  ",
          catholic: katholic ? "true" : "false"
        }
      }).done((data) => {
        const incoming = JSON.parse(data);
        if (incoming.status !== "error") {
          for (const entry of incoming.feiertage) {
            result.push(
              new Date(entry.date.replace(/\./g, "/").replace(/-/g, "/")).toLocaleDateString("de-DE", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
              })
            );
          }
          _Date_Holidays.buffer.set(
            _Date_Holidays.genComparableKey({
              years,
              states,
              augsburg,
              catholic: katholic
            }),
            result
          );
          resolve(result);
        }
      });
    });
    _Date_Holidays.buffer.set(
      _Date_Holidays.genComparableKey({
        years,
        states,
        augsburg,
        catholic: katholic
      }),
      promise
    );
    return promise;
  }
  static {
    /**
     * States whether this {@link Date_Holidays } was successfully registered
     * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
    this.registered = (() => {
      return window.codbi.registerEP("Date.Holidays", _Date_Holidays.retrieve);
    })();
  }
  // #region Initialization
};
__decorateClass([
  DBC.ParamvalueProvider,
  __decorateParam(0, AE.PRE(new TYPE("string")))
], _Date_Holidays, "retrieve", 1);
var Date_Holidays = _Date_Holidays;
export {
  Date_Holidays
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL3BhY2thZ2VzL2Zvcm0vc3JjL2pzL0VQcy9kYXRlLmhvbGlkYXlzLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvLyAjcmVnaW9uIEltcG9ydHNcbi8vICNyZWdpb24gWElNQVxuaW1wb3J0IHsgZ2V0SlF1ZXJ5IH0gZnJvbSBcIkBkZS14aW1hL2ZjLWZvcm0tcmVuZGVyZXJcIjtcbi8vICNlbmRyZWdpb24gWElNQVxuLy8gI3JlZ2lvbiBYREJDXG5pbXBvcnQgeyBEQkMgfSBmcm9tIFwieGRiYy9zcmMvREJDXCI7XG5pbXBvcnQgeyBBRSB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvQUVcIjtcbmltcG9ydCB7IFRZUEUgfSBmcm9tIFwieGRiYy9zcmMvREJDL1RZUEVcIjtcbi8vICNlbmRyZWdpb24gWERCQ1xuLy8gI2VuZHJlZ2lvbiBJbXBvcnRzXG4vKiogVGhlIHR5cGUgb2YgcmVxdWVzdHMgbmVlZGVkIHRvIGlkZW50aWZ5IGlkZW50aWNhbCByZXF1ZXN0cy4gKi9cbnR5cGUgQXBpUmVxdWVzdCA9IHtcbiAgLyoqIFRoZSByZXF1ZXN0ZWQgeWVhcnMuICovXG4gIHllYXJzOiBzdHJpbmdbXTtcbiAgLyoqIFRoZSByZXF1ZXN0ZWQgc3RhdGVzLiAqL1xuICBzdGF0ZXM6IHN0cmluZ1tdO1xuICAvKiogV2hldGhlciB0aGUgQXVnc2J1cmdlciBGcmllZGVuc2Zlc3Qgc2hhbGwgYmUgaW5jbHVkZWQuICovXG4gIGF1Z3NidXJnOiBib29sZWFuO1xuICAvKiogV2hldGhlciBjYXRob2xpYyBob2xpZGF5cyBzaGFsbCBiZSBpbmNsdWRlZC4gKi9cbiAgY2F0aG9saWM6IGJvb2xlYW47XG59O1xuLyoqXG4gKiBUaGlzICoqRSoqbGVtZW50ICoqUCoqbGFjZWhvbGRlciByZWdpc3RlcnMgdGhlIFwiRGF0ZS5Ib2xpZGF5c1wiLUVQIHRoYXQgbWFrZXMgcmVxdWVzdHMgdG8gXCJBUEktRmVpZXJ0YWdlLmRlXCIgaW4gb3JkZXIgdG9cbiAqIHJldHJpZXZlIGdlcm1hbiBob2xpZGF5cyBvZiBhbGwgc3RhdGVzLlxuICpcbiAqIENvbmZpZyBQYXJhbWV0ZXIgKG9yZGVyIGRvZXNuJ3QgbWF0dGVyLCBjYXNlLWluc2Vuc2l0aXZlKTpcbiAqICAtIFN0YXRlczogICAgICAgICBidyxieSxiZSxiYixoYixoaCxoZSxtdixuaSxudyxycCxzbCxzbixzdCxzaCx0aFxuICogIC0gXCJUSElTX1lFQVJcIjogICAgUmVwcmVzZW50cyB0aGUgY3VycmVudCB5ZWFyIGFuZCBzdXBwb3J0cyBhcml0aG1ldGljYWxcbiAqICAgICAgICAgICAgICAgICAgICBvcGVyYXRpb25zICggKy8tIGUuZy4gVEhJU19ZRUFSICsgMSA9IG5leHQgeWVhcilcbiAqICAtIFwiRnJpZWRlbnNmZXN0XCI6IFRoZSBBdWdzYnVyZydzIGZlc3RpdmFsIG9mIHBlYWNlLlxuICogIC0gXCJLQVRIT0xJU0NIXCI6ICAgS2F0aG9saWMgaG9saWRheXNcbiAqXG4gKiBAcmVtYXJrc1xuICogTWFpbnRhaW5lcjogQ2FsbGFyaSwgU2FsdmF0b3JlIChTYWx2YXRvcmUuQ2FsbGFyaUBBbnNiYWNoLmRlKSAqL1xuLy8gYmlvbWUtaWdub3JlIGxpbnQvY29tcGxleGl0eS9ub1N0YXRpY09ubHlDbGFzczogUHJvYWN0aXZlIERlc2lnblxuZXhwb3J0IGNsYXNzIERhdGVfSG9saWRheXMge1xuICAvKiogU3RvcmVzIHRoZSByZXF1ZXN0cyBhbHJlYWR5IG1hZGUuICovXG4gIHByb3RlY3RlZCBzdGF0aWMgYnVmZmVyOiBNYXA8c3RyaW5nLCBBcnJheTxzdHJpbmc+IHwgUHJvbWlzZTxBcnJheTxzdHJpbmc+Pj4gPSBuZXcgTWFwPFxuICAgIHN0cmluZyxcbiAgICBBcnJheTxzdHJpbmc+IHwgUHJvbWlzZTxBcnJheTxzdHJpbmc+PlxuICA+KCk7XG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgYSBrZXkte0BsaW5rIHN0cmluZyB9IHRoYXQgbWF5IGJlIHVzZWQgdG8gY29tcGFyZSB0byB7QGxpbmsgQXBpUmVxdWVzdCB9cyB3aXRoIGVhY2ggb3RoZXIuXG4gICAqXG4gICAqIEBwYXJhbSBmcm9tIFRoZSB7QGxpbmsgQXBpUmVxdWVzdCB9IHRvIGdlbmVyYXRlIHRoZSBrZXkgZnJvbS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHJlcXVlc3RlZCBrZXkuICovXG4gIHByb3RlY3RlZCBzdGF0aWMgZ2VuQ29tcGFyYWJsZUtleShmcm9tOiBBcGlSZXF1ZXN0KTogc3RyaW5nIHtcbiAgICBjb25zdCBzb3J0ZWRZZWFycyA9IFsuLi5mcm9tLnllYXJzXS5zb3J0KCkuam9pbihcIi1cIik7XG4gICAgY29uc3Qgc29ydGVkU3RhdGVzID0gWy4uLmZyb20uc3RhdGVzXS5zb3J0KCkuam9pbihcIi1cIik7XG5cbiAgICByZXR1cm4gYCR7c29ydGVkWWVhcnN9XyR7c29ydGVkU3RhdGVzfV8ke2Zyb20uYXVnc2J1cmcgPyBcIlRcIiA6IFwiRlwifV8ke2Zyb20uY2F0aG9saWMgPyBcIlRcIiA6IFwiRlwifWA7XG4gIH1cbiAgLyoqXG4gICAqIENoZWNrcyBhbGwgXCJwYXJhbXNcIiBmb3Igc3BlY2lmaWMgZGF0YSAoc2VlIHtAbGluayBEYXRlX0hvbGlkYXlzIH0pIGFuZCByZXR1cm4gYW4ge0BsaW5rIEFycmF5IH0gb2ZcbiAgICogRGF0ZS17QGxpbmsgc3RyaW5nc30uXG4gICAqXG4gICAqIEBwYXJhbSBwYXJhbXMgVGhlIHBhcmFtZXRlcnMgZm9yIHRoYXQgRWxlbWVudC1QbGFjZWhvbGRlciAocHJvdmlkZWQgYnkgQ29kQmkpLiAqL1xuICBAREJDLlBhcmFtdmFsdWVQcm92aWRlclxuICBwdWJsaWMgc3RhdGljIHJldHJpZXZlKFxuICAgIEBBRS5QUkUobmV3IFRZUEUoXCJzdHJpbmdcIikpXG4gICAgcGFyYW1zOiBBcnJheTxzdHJpbmc+LFxuICApOiBQcm9taXNlPEFycmF5PHN0cmluZz4+IHtcbiAgICAvLyAjcmVnaW9uIERldGVybWluZSBwYXJhbWV0ZXIuXG4gICAgY29uc3QgcmVzdWx0OiBBcnJheTxzdHJpbmc+ID0gbmV3IEFycmF5PHN0cmluZz4oKTtcbiAgICBjb25zdCB5ZWFyczogQXJyYXk8c3RyaW5nPiA9IG5ldyBBcnJheTxzdHJpbmc+KCk7XG4gICAgY29uc3Qgc3RhdGVzOiBBcnJheTxzdHJpbmc+ID0gbmV3IEFycmF5PHN0cmluZz4oKTtcbiAgICBjb25zdCBhdWdzYnVyZyA9IHBhcmFtcy5zb21lKCh0b0NoZWNrKSA9PiAodG9DaGVjayBhcyBzdHJpbmcpLnRvTG93ZXJDYXNlKCkgPT09IFwiZnJpZWRlbnNmZXN0XCIpO1xuICAgIGNvbnN0IGthdGhvbGljID0gcGFyYW1zLnNvbWUoKHRvQ2hlY2spID0+ICh0b0NoZWNrIGFzIHN0cmluZykudG9Mb3dlckNhc2UoKSA9PT0gXCJrYXRob2xpc2NoXCIpO1xuXG4gICAgZm9yIChjb25zdCBwYXJhbWV0ZXIgb2YgcGFyYW1zKSB7XG4gICAgICBpZiAoTnVtYmVyLmlzTmFOKHBhcmFtZXRlcikpIHtcbiAgICAgICAgeWVhcnMucHVzaChwYXJhbWV0ZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHBhcmFtZXRlci50b0xvd2VyQ2FzZSgpLmluZGV4T2YoXCJ0aGlzX3llYXJcIikgIT09IC0xKSB7XG4gICAgICAgICAgbGV0IGlkeE9wZXJhbmQ6IG51bWJlciA9IHBhcmFtZXRlci5pbmRleE9mKFwiK1wiKTtcblxuICAgICAgICAgIGlmIChpZHhPcGVyYW5kID09PSAtMSkge1xuICAgICAgICAgICAgaWR4T3BlcmFuZCA9IHBhcmFtZXRlci5pbmRleE9mKFwiLVwiKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoaWR4T3BlcmFuZCAhPT0gLTEpIHtcbiAgICAgICAgICAgIHllYXJzLnB1c2goXG4gICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICBuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCkgK1xuICAgICAgICAgICAgICAgIE51bWJlci5wYXJzZUludChwYXJhbWV0ZXIuc3Vic3RyaW5nKGlkeE9wZXJhbmQgKyAxKSkgKlxuICAgICAgICAgICAgICAgICAgKHBhcmFtZXRlci5zdWJzdHJpbmcoaWR4T3BlcmFuZCwgaWR4T3BlcmFuZCArIDEpID09PSBcIitcIiA/IDEgOiAtMSlcbiAgICAgICAgICAgICAgKS50b1N0cmluZygpLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgeWVhcnMucHVzaChuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCkudG9TdHJpbmcoKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIHBhcmFtZXRlci50b0xvd2VyQ2FzZSgpLmluZGV4T2YoXCJmcmllZGVuc2Zlc3RcIikgPT09IC0xICYmXG4gICAgICAgICAgcGFyYW1ldGVyLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihcImthdGhvbGlzY2hcIikgPT09IC0xXG4gICAgICAgICkge1xuICAgICAgICAgIHN0YXRlcy5wdXNoKHBhcmFtZXRlci50b0xvd2VyQ2FzZSgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIERldGVybWluZSBwYXJhbWV0ZXIuXG4gICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlPEFycmF5PHN0cmluZz4+KChyZXNvbHZlKSA9PiB7XG4gICAgICAvLyAjcmVnaW9uIFJlc29sdmUgZnJvbSBCdWZmZXIgaWYgYXZhaWxhYmxlLlxuICAgICAgaWYgKFxuICAgICAgICBEYXRlX0hvbGlkYXlzLmJ1ZmZlci5oYXMoXG4gICAgICAgICAgRGF0ZV9Ib2xpZGF5cy5nZW5Db21wYXJhYmxlS2V5KHtcbiAgICAgICAgICAgIHllYXJzOiB5ZWFycyxcbiAgICAgICAgICAgIHN0YXRlczogc3RhdGVzLFxuICAgICAgICAgICAgYXVnc2J1cmc6IGF1Z3NidXJnLFxuICAgICAgICAgICAgY2F0aG9saWM6IGthdGhvbGljLFxuICAgICAgICAgIH0gYXMgQXBpUmVxdWVzdCksXG4gICAgICAgIClcbiAgICAgICkge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgQXJyYXkuaXNBcnJheShcbiAgICAgICAgICAgIERhdGVfSG9saWRheXMuYnVmZmVyLmdldChcbiAgICAgICAgICAgICAgRGF0ZV9Ib2xpZGF5cy5nZW5Db21wYXJhYmxlS2V5KHtcbiAgICAgICAgICAgICAgICB5ZWFyczogeWVhcnMsXG4gICAgICAgICAgICAgICAgc3RhdGVzOiBzdGF0ZXMsXG4gICAgICAgICAgICAgICAgYXVnc2J1cmc6IGF1Z3NidXJnLFxuICAgICAgICAgICAgICAgIGNhdGhvbGljOiBrYXRob2xpYyxcbiAgICAgICAgICAgICAgfSBhcyBBcGlSZXF1ZXN0KSxcbiAgICAgICAgICAgICksXG4gICAgICAgICAgKVxuICAgICAgICApIHtcbiAgICAgICAgICByZXNvbHZlKFxuICAgICAgICAgICAgRGF0ZV9Ib2xpZGF5cy5idWZmZXIuZ2V0KFxuICAgICAgICAgICAgICBEYXRlX0hvbGlkYXlzLmdlbkNvbXBhcmFibGVLZXkoe1xuICAgICAgICAgICAgICAgIHllYXJzOiB5ZWFycyxcbiAgICAgICAgICAgICAgICBzdGF0ZXM6IHN0YXRlcyxcbiAgICAgICAgICAgICAgICBhdWdzYnVyZzogYXVnc2J1cmcsXG4gICAgICAgICAgICAgICAgY2F0aG9saWM6IGthdGhvbGljLFxuICAgICAgICAgICAgICB9IGFzIEFwaVJlcXVlc3QpLFxuICAgICAgICAgICAgKSBhcyBBcnJheTxzdHJpbmc+LFxuICAgICAgICAgICk7XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgKFxuICAgICAgICAgICAgRGF0ZV9Ib2xpZGF5cy5idWZmZXIuZ2V0KFxuICAgICAgICAgICAgICBEYXRlX0hvbGlkYXlzLmdlbkNvbXBhcmFibGVLZXkoe1xuICAgICAgICAgICAgICAgIHllYXJzOiB5ZWFycyxcbiAgICAgICAgICAgICAgICBzdGF0ZXM6IHN0YXRlcyxcbiAgICAgICAgICAgICAgICBhdWdzYnVyZzogYXVnc2J1cmcsXG4gICAgICAgICAgICAgICAgY2F0aG9saWM6IGthdGhvbGljLFxuICAgICAgICAgICAgICB9IGFzIEFwaVJlcXVlc3QpLFxuICAgICAgICAgICAgKSBhcyBQcm9taXNlPEFycmF5PHN0cmluZz4+XG4gICAgICAgICAgKS50aGVuKChyZXN1bHQ6IEFycmF5PHN0cmluZz4pID0+IHtcbiAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIC8vICNlbmRyZWdpb24gUmVzb2x2ZSBmcm9tIEJ1ZmZlciBpZiBhdmFpbGFibGUuXG4gICAgICBjb25zdCAkID0gZ2V0SlF1ZXJ5KCk7XG4gICAgICAvLyAjZW5kcmVnaW9uIFBhcnNlIHBhcmFtZXRlci5cbiAgICAgICQuYWpheCh7XG4gICAgICAgIHVybDogYCR7d2luZG93LmNvZGJpLmJhc2VVUkx9cGx1Z2luP25hbWU9Q29kQmlfSG9saWRheXNfRmVpZXJ0YWdlREVgLFxuICAgICAgICB0eXBlOiBcIkdFVFwiLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgeWVhcnM6IHllYXJzLmpvaW4oXCIsXCIpLFxuICAgICAgICAgIHN0YXRlczogc3RhdGVzLmpvaW4oXCIsXCIpLnJlcGxhY2UoLyAvZywgXCJcIiksXG4gICAgICAgICAgYXVnc2J1cmc6IGF1Z3NidXJnID8gXCJ0cnVlXCIgOiBcImZhbHNlICBcIixcbiAgICAgICAgICBjYXRob2xpYzoga2F0aG9saWMgPyBcInRydWVcIiA6IFwiZmFsc2VcIixcbiAgICAgICAgfSxcbiAgICAgIH0pLmRvbmUoKGRhdGE6IHN0cmluZykgPT4ge1xuICAgICAgICBjb25zdCBpbmNvbWluZyA9IEpTT04ucGFyc2UoZGF0YSk7XG5cbiAgICAgICAgaWYgKGluY29taW5nLnN0YXR1cyAhPT0gXCJlcnJvclwiKSB7XG4gICAgICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBpbmNvbWluZy5mZWllcnRhZ2UgYXMgQXJyYXk8eyBkYXRlOiBzdHJpbmcgfT4pIHtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKFxuICAgICAgICAgICAgICBuZXcgRGF0ZShlbnRyeS5kYXRlLnJlcGxhY2UoL1xcLi9nLCBcIi9cIikucmVwbGFjZSgvLS9nLCBcIi9cIikpLnRvTG9jYWxlRGF0ZVN0cmluZyhcImRlLURFXCIsIHtcbiAgICAgICAgICAgICAgICB5ZWFyOiBcIm51bWVyaWNcIixcbiAgICAgICAgICAgICAgICBtb250aDogXCIyLWRpZ2l0XCIsXG4gICAgICAgICAgICAgICAgZGF5OiBcIjItZGlnaXRcIixcbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyAjcmVnaW9uIEJ1ZmZlciByZXF1ZXN0XG4gICAgICAgICAgRGF0ZV9Ib2xpZGF5cy5idWZmZXIuc2V0KFxuICAgICAgICAgICAgRGF0ZV9Ib2xpZGF5cy5nZW5Db21wYXJhYmxlS2V5KHtcbiAgICAgICAgICAgICAgeWVhcnM6IHllYXJzLFxuICAgICAgICAgICAgICBzdGF0ZXM6IHN0YXRlcyxcbiAgICAgICAgICAgICAgYXVnc2J1cmc6IGF1Z3NidXJnLFxuICAgICAgICAgICAgICBjYXRob2xpYzoga2F0aG9saWMsXG4gICAgICAgICAgICB9IGFzIEFwaVJlcXVlc3QpLFxuICAgICAgICAgICAgcmVzdWx0LFxuICAgICAgICAgICk7XG4gICAgICAgICAgLy8gI2VuZHJlZ2lvbiBCdWZmZXIgcmVxdWVzdFxuICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgLy8gI3JlZ2lvbiBCdWZmZXIgcmVxdWVzdCBwcm9taXNlLlxuICAgIERhdGVfSG9saWRheXMuYnVmZmVyLnNldChcbiAgICAgIERhdGVfSG9saWRheXMuZ2VuQ29tcGFyYWJsZUtleSh7XG4gICAgICAgIHllYXJzOiB5ZWFycyxcbiAgICAgICAgc3RhdGVzOiBzdGF0ZXMsXG4gICAgICAgIGF1Z3NidXJnOiBhdWdzYnVyZyxcbiAgICAgICAgY2F0aG9saWM6IGthdGhvbGljLFxuICAgICAgfSBhcyBBcGlSZXF1ZXN0KSxcbiAgICAgIHByb21pc2UsXG4gICAgKTtcbiAgICAvLyAjZW5kcmVnaW9uIEJ1ZmZlciByZXF1ZXN0IHByb21pc2UuXG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH1cbiAgLyoqXG4gICAqIFN0YXRlcyB3aGV0aGVyIHRoaXMge0BsaW5rIERhdGVfSG9saWRheXMgfSB3YXMgc3VjY2Vzc2Z1bGx5IHJlZ2lzdGVyZWRcbiAgICogdmlhIHtAbGluayBDb2RiaUdsb2JhbC5yZWdpc3RlckVQIH0gd2l0aCB0aGUgQ29kQmkgYW5kIHBlcmZvcm1zIHRoZSByZWdpc3RyYXRpb24gdXBvbiBjbGFzcyB1c2FnZS4qL1xuICBwdWJsaWMgc3RhdGljIHJlZ2lzdGVyZWQ6IGJvb2xlYW4gPSAoKCkgPT4ge1xuICAgIHJldHVybiB3aW5kb3cuY29kYmkucmVnaXN0ZXJFUChcIkRhdGUuSG9saWRheXNcIiwgRGF0ZV9Ib2xpZGF5cy5yZXRyaWV2ZSk7XG4gIH0pKCk7XG4gIC8vICNyZWdpb24gSW5pdGlhbGl6YXRpb25cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSw4QkFBMEI7QUFpQ25CLElBQU0saUJBQU4sTUFBTSxlQUFjO0FBQUEsRUFFekI7QUFBQTtBQUFBLFNBQWlCLFNBQThELG9CQUFJLElBR2pGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9GLE9BQWlCLGlCQUFpQixNQUEwQjtBQUMxRCxVQUFNLGNBQWMsQ0FBQyxHQUFHLEtBQUssS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEdBQUc7QUFDbkQsVUFBTSxlQUFlLENBQUMsR0FBRyxLQUFLLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxHQUFHO0FBRXJELFdBQU8sR0FB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
