import { AE } from "./chunk-F23SIUTL.js";
import { INSTANCE } from "./chunk-ELFTYEET.js";
import { CodBiError } from "./chunk-MYCZGDY4.js";
import { TYPE } from "./chunk-RHM74VIG.js";
import { __decorate, __metadata } from "./chunk-ZVYU3ZLN.js";
import { require_dist } from "./chunk-ZTMSSRTV.js";
import { DBC } from "./chunk-WDRNTVZG.js";
import { __decorateClass, __decorateParam, __toESM } from "./chunk-AOJQKO6T.js";

// src/js/Functionalities/ldap.autocomplete.ts
var import_fc_form_renderer2 = __toESM(require_dist(), 1);

// src/js/EPs/ldap.find.ts
var import_fc_form_renderer = __toESM(require_dist(), 1);
var _LDAP_Find = class _LDAP_Find {
  static retrieve(params) {
    let runningQuery = void 0;
    const abortedQueries = new Array();
    return new Promise((resolve, reject) => {
      const mode =
        params[0] === ""
          ? "%26"
          : params[0].toLowerCase() === "and"
            ? "%26"
            : params[0].toLowerCase() === "or"
              ? "|"
              : "%26";
      let conditions = params[1].split("|");
      const url = params.length > 3 ? params[3] : window.codbiSettings.LDAP.URL;
      if (url === "") {
        reject(new CodBiError("[[ LDAP.Find ] No LDAP-URL specified neither via parameter nor via CodBi Settings. ]"));
      }
      for (let i = conditions.length - 1; i < 9; i++) {
        conditions.push(conditions[conditions.length - 1]);
      }
      conditions = conditions.map((toTransform) => {
        return toTransform.replace("=", "%3D").trim();
      });
      if (runningQuery) {
        runningQuery.abort();
      }
      runningQuery = (0, import_fc_form_renderer.getJQuery)()
        .ajax(`${url}&queryParameter=${mode},${conditions.join(",")}`)
        .done((response) => {
          if (abortedQueries.indexOf(runningQuery) === -1) {
            resolve(response);
          }
        });
    });
  }
  static {
    // #region Initialization
    /**
     * States whether this {@link LDAP_Find } was successfully registered
     * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
    this.registered = (() => {
      return window.codbi.registerEP("LDAP.Find", _LDAP_Find.retrieve);
    })();
  }
  // #endregion Initialization
};
__decorateClass([DBC.ParamvalueProvider, __decorateParam(0, AE.PRE(new TYPE("string")))], _LDAP_Find, "retrieve", 1);
var LDAP_Find = _LDAP_Find;

// src/js/Functionalities/ldap.autocomplete.ts
var _a;
var LDAP_Autocomplete = class _LDAP_Autocomplete {
  /**
   * Registers the "LDAP.Autocomplete"-Functionality.
   *
   * This functionalities takes advantage of the {@link LDAP_Find} Elementplaceholder to complete what is typed into
   * the tagged {@link HTMLInputElement } with data from a connected Formcycle predefined LDAP-Query according
   * to the {@link LDAP_Find } specifications.
   * It suggests completions as soon as there are multiple matches and only allows entries that match exactly one
   * LDAP-Entry.
   *
   * Config Parameter:
   *  - Property:       The LDAP-Property that shall be autocompleted.
   *  - CSSProposals:   The CSS-Style for the proposals-Select-Element appearing when there are multiple matches.
   *  - URL:            The URL of the Formcycle predefined LDAP-Query to use. */
  static functionality(toLoad, toProcess) {
    toProcess.addEventListener("blur", async (event) => {
      const findParameter = ["AND", `${toLoad.property}=${toProcess.value}`];
      if (toLoad.url) {
        findParameter.push(toLoad.url);
      }
      const ldapResult = await LDAP_Find.retrieve(findParameter);
      if (ldapResult.length === 0) {
        (0, import_fc_form_renderer2.getJQuery)()(toProcess).error(
          toLoad.msgnotinldap
            ? toLoad.msgnotinldap
            : "Only values that're present in the Active Directory are permitted.",
        );
      } else {
        if (document.activeElement !== proposals) {
          proposals.remove();
        }
        (0, import_fc_form_renderer2.getJQuery)()(toProcess).error("");
      }
    });
    let blocked = false;
    const proposals = document.createElement("select");
    proposals.classList.add("---CodBi", "--LDAP_Autocomplete", "-Proposals");
    proposals.setAttribute(
      "style",
      toLoad.cssproposals
        ? toLoad.cssproposals
        : "margin-top: .5em ; max-width: 100% ; border-color: darkorange ; border-radius: .5em ; box-shadow: 0 0 .5em darkorange ; color: green ; font-weight: bolder ; cursor: pointer;",
    );
    const onSelected = async () => {
      toProcess.value = proposals.value;
      proposals.remove();
      if (toProcess.codbiLDAPSetMatchListeners) {
        const findParameter = ["AND", `${toLoad.property}=${proposals.value}`];
        if (toLoad.url) {
          findParameter.push(toLoad.url);
        }
        const ldapResult = await LDAP_Find.retrieve(findParameter);
        for (const listener of toProcess.codbiLDAPSetMatchListeners) {
          listener(ldapResult, toProcess);
        }
      }
    };
    proposals.addEventListener("change", async (event) => {
      onSelected();
    });
    proposals.addEventListener("keydown", async (event) => {
      if (event.key === "Enter" || event.key === "Space") {
        onSelected();
      }
    });
    toProcess.addEventListener("keydown", async (event) => {
      if (blocked) {
        event.stopPropagation();
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      const key = INSTANCE.tsCheck(event, KeyboardEvent).key;
      if (key.length !== 1 && key !== "Backspace" && key !== "Delete") {
        return;
      }
      const findParameter = ["AND", `${toLoad.property}=${toProcess.value}${key.length === 1 ? key : ""}`];
      if (toLoad.url) {
        findParameter.push(toLoad.url);
      }
      const ldapResult = removeDuplicates(await LDAP_Find.retrieve(findParameter), toLoad.property);
      if (ldapResult.length === 1) {
        toProcess.value = ldapResult[0][toLoad.property];
        blocked = true;
        proposals.remove();
        if (toProcess.codbiLDAPSetMatchListeners) {
          for (const listener of toProcess.codbiLDAPSetMatchListeners) {
            listener(ldapResult, toProcess);
          }
        }
        setTimeout(() => {
          blocked = false;
        }, 500);
      }
      if (ldapResult.length > 1) {
        proposals.innerHTML = "";
        for (const result of ldapResult) {
          proposals.options.add(new Option(result[toLoad.property], result[toLoad.property]));
        }
        toProcess.parentElement.appendChild(proposals);
      }
    });
  }
  static {
    this.registered = (() => {
      return window.codbi.registerFunctionality("LDAP.Autocomplete", _LDAP_Autocomplete.functionality);
    })();
  }
};
__decorate(
  [
    DBC.ParamvalueProvider,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [
      Object,
      typeof (_a = typeof Element !== "undefined" && Element) === "function" ? _a : Object,
    ]),
    __metadata("design:returntype", void 0),
  ],
  LDAP_Autocomplete,
  "functionality",
  null,
);
function removeDuplicates(toFilter, by = void 0) {
  if (by) {
    const seen = /* @__PURE__ */ new Map();
    for (const item of toFilter) {
      const propValue = item[by];
      if (!seen.has(propValue)) {
        seen.set(propValue, item);
      }
    }
    return Array.from(seen.values());
  } else {
    return [...new Set(toFilter)];
  }
}

export { LDAP_Autocomplete, removeDuplicates };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibGRhcC5hdXRvY29tcGxldGUudHMiLCAiLi4vLi4vc3JjL2pzL0VQcy9sZGFwLmZpbmQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vICNyZWdpb24gSW1wb3J0c1xuLy8gI3JlZ2lvbiBYSU1BXG5pbXBvcnQgeyBnZXRKUXVlcnkgfSBmcm9tIFwiQGRlLXhpbWEvZmMtZm9ybS1yZW5kZXJlclwiO1xuLy8gI2VuZHJlZ2lvbiBYSU1BXG4vLyAjcmVnaW9uIFhEQkNcbmltcG9ydCB7IERCQyB9IGZyb20gXCJ4ZGJjL3NyYy9EQkNcIjtcbmltcG9ydCB7IElOU1RBTkNFIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9JTlNUQU5DRVwiO1xuLy8gI2VuZHJlZ2lvbiBYREJDXG4vLyAjcmVnaW9uIEVsZW1lbnRwbGFjZWhvbGRlclxuaW1wb3J0IHsgTERBUF9GaW5kIH0gZnJvbSBcIi4uL0VQcy9sZGFwLmZpbmQuanNcIjtcbi8vICNlbmRyZWdpb24gRWxlbWVudHBsYWNlaG9sZGVyXG4vLyAjZW5kcmVnaW9uIEltcG9ydHNcbi8qKlxuICogUHJvdmlkZXMgdGhlIHtAbGluayBMREFQX0F1dG9jb21wbGV0ZS5mdW5jdGlvbmFsaXR5IH0uXG4gKlxuICogQHJlbWFya3NcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoU2FsdmF0b3JlLkNhbGxhcmlAQW5zYmFjaC5kZSkgKi9cbi8vIGJpb21lLWlnbm9yZSBsaW50L2NvbXBsZXhpdHkvbm9TdGF0aWNPbmx5Q2xhc3M6IFByb2FjdGl2ZSBEZXNpZ24uXG5leHBvcnQgY2xhc3MgTERBUF9BdXRvY29tcGxldGUge1xuICAvKipcbiAgICogUmVnaXN0ZXJzIHRoZSBcIkxEQVAuQXV0b2NvbXBsZXRlXCItRnVuY3Rpb25hbGl0eS5cbiAgICpcbiAgICogVGhpcyBmdW5jdGlvbmFsaXRpZXMgdGFrZXMgYWR2YW50YWdlIG9mIHRoZSB7QGxpbmsgTERBUF9GaW5kfSBFbGVtZW50cGxhY2Vob2xkZXIgdG8gY29tcGxldGUgd2hhdCBpcyB0eXBlZCBpbnRvXG4gICAqIHRoZSB0YWdnZWQge0BsaW5rIEhUTUxJbnB1dEVsZW1lbnQgfSB3aXRoIGRhdGEgZnJvbSBhIGNvbm5lY3RlZCBGb3JtY3ljbGUgcHJlZGVmaW5lZCBMREFQLVF1ZXJ5IGFjY29yZGluZ1xuICAgKiB0byB0aGUge0BsaW5rIExEQVBfRmluZCB9IHNwZWNpZmljYXRpb25zLlxuICAgKiBJdCBzdWdnZXN0cyBjb21wbGV0aW9ucyBhcyBzb29uIGFzIHRoZXJlIGFyZSBtdWx0aXBsZSBtYXRjaGVzIGFuZCBvbmx5IGFsbG93cyBlbnRyaWVzIHRoYXQgbWF0Y2ggZXhhY3RseSBvbmVcbiAgICogTERBUC1FbnRyeS5cbiAgICpcbiAgICogQ29uZmlnIFBhcmFtZXRlcjpcbiAgICogIC0gUHJvcGVydHk6ICAgICAgIFRoZSBMREFQLVByb3BlcnR5IHRoYXQgc2hhbGwgYmUgYXV0b2NvbXBsZXRlZC5cbiAgICogIC0gQ1NTUHJvcG9zYWxzOiAgIFRoZSBDU1MtU3R5bGUgZm9yIHRoZSBwcm9wb3NhbHMtU2VsZWN0LUVsZW1lbnQgYXBwZWFyaW5nIHdoZW4gdGhlcmUgYXJlIG11bHRpcGxlIG1hdGNoZXMuXG4gICAqICAtIFVSTDogICAgICAgICAgICBUaGUgVVJMIG9mIHRoZSBGb3JtY3ljbGUgcHJlZGVmaW5lZCBMREFQLVF1ZXJ5IHRvIHVzZS4gKi9cbiAgQERCQy5QYXJhbXZhbHVlUHJvdmlkZXJcbiAgcHVibGljIHN0YXRpYyBmdW5jdGlvbmFsaXR5KHRvTG9hZDogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSwgdG9Qcm9jZXNzOiBFbGVtZW50KTogdm9pZCB7XG4gICAgLy8gI3JlZ2lvbiBSZW1vdmUgZW50cmllcyB0aGF0J3JlIG5vdCBpbiBMREFQLlxuICAgIHRvUHJvY2Vzcy5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCBhc3luYyAoZXZlbnQpID0+IHtcbiAgICAgIGNvbnN0IGZpbmRQYXJhbWV0ZXIgPSBbXCJBTkRcIiwgYCR7dG9Mb2FkLnByb3BlcnR5fT0keyh0b1Byb2Nlc3MgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWV9YF07XG5cbiAgICAgIGlmICh0b0xvYWQudXJsKSB7XG4gICAgICAgIGZpbmRQYXJhbWV0ZXIucHVzaCh0b0xvYWQudXJsKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbGRhcFJlc3VsdCA9IGF3YWl0IExEQVBfRmluZC5yZXRyaWV2ZShmaW5kUGFyYW1ldGVyKTtcblxuICAgICAgaWYgKGxkYXBSZXN1bHQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGdldEpRdWVyeSgpKHRvUHJvY2VzcykuZXJyb3IoXG4gICAgICAgICAgdG9Mb2FkLm1zZ25vdGlubGRhcFxuICAgICAgICAgICAgPyB0b0xvYWQubXNnbm90aW5sZGFwXG4gICAgICAgICAgICA6IFwiT25seSB2YWx1ZXMgdGhhdCdyZSBwcmVzZW50IGluIHRoZSBBY3RpdmUgRGlyZWN0b3J5IGFyZSBwZXJtaXR0ZWQuXCIsXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAhPT0gcHJvcG9zYWxzKSB7XG4gICAgICAgICAgcHJvcG9zYWxzLnJlbW92ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0SlF1ZXJ5KCkodG9Qcm9jZXNzKS5lcnJvcihcIlwiKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLyAjZW5kcmVnaW9uIFJlbW92ZSBlbnRyaWVzIHRoYXQncmUgbm90IGluIExEQVAuXG4gICAgbGV0IGJsb2NrZWQgPSBmYWxzZTtcbiAgICAvLyAjcmVnaW9uIENyZWF0ZSBTZWxlY3Rpb24uXG4gICAgY29uc3QgcHJvcG9zYWxzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNlbGVjdFwiKTtcblxuICAgIHByb3Bvc2Fscy5jbGFzc0xpc3QuYWRkKFwiLS0tQ29kQmlcIiwgXCItLUxEQVBfQXV0b2NvbXBsZXRlXCIsIFwiLVByb3Bvc2Fsc1wiKTtcbiAgICBwcm9wb3NhbHMuc2V0QXR0cmlidXRlKFxuICAgICAgXCJzdHlsZVwiLFxuICAgICAgdG9Mb2FkLmNzc3Byb3Bvc2Fsc1xuICAgICAgICA/IHRvTG9hZC5jc3Nwcm9wb3NhbHNcbiAgICAgICAgOiBcIm1hcmdpbi10b3A6IC41ZW0gOyBtYXgtd2lkdGg6IDEwMCUgOyBib3JkZXItY29sb3I6IGRhcmtvcmFuZ2UgOyBib3JkZXItcmFkaXVzOiAuNWVtIDsgYm94LXNoYWRvdzogMCAwIC41ZW0gZGFya29yYW5nZSA7IGNvbG9yOiBncmVlbiA7IGZvbnQtd2VpZ2h0OiBib2xkZXIgOyBjdXJzb3I6IHBvaW50ZXI7XCIsXG4gICAgKTtcbiAgICAvLyAjcmVnaW9uIEhhbmRsZSBTZWxlY3Rpb24uXG4gICAgY29uc3Qgb25TZWxlY3RlZCA9IGFzeW5jICgpID0+IHtcbiAgICAgICh0b1Byb2Nlc3MgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWUgPSAocHJvcG9zYWxzIGFzIEhUTUxTZWxlY3RFbGVtZW50KS52YWx1ZTtcblxuICAgICAgcHJvcG9zYWxzLnJlbW92ZSgpO1xuICAgICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XG4gICAgICBpZiAoKHRvUHJvY2VzcyBhcyBhbnkpLmNvZGJpTERBUFNldE1hdGNoTGlzdGVuZXJzKSB7XG4gICAgICAgIC8vICNyZWdpb24gQWNxdWlyZSBMREFQLURhdGEgZm9yIHBhc3NpbmcgaXQgdG8gdGhlIG1hdGNoLWxpc3RlbmVycy5cbiAgICAgICAgY29uc3QgZmluZFBhcmFtZXRlciA9IFtcIkFORFwiLCBgJHt0b0xvYWQucHJvcGVydHl9PSR7KHByb3Bvc2FscyBhcyBIVE1MU2VsZWN0RWxlbWVudCkudmFsdWV9YF07XG5cbiAgICAgICAgaWYgKHRvTG9hZC51cmwpIHtcbiAgICAgICAgICBmaW5kUGFyYW1ldGVyLnB1c2godG9Mb2FkLnVybCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsZGFwUmVzdWx0ID0gYXdhaXQgTERBUF9GaW5kLnJldHJpZXZlKGZpbmRQYXJhbWV0ZXIpO1xuICAgICAgICAvLyAjZW5kcmVnaW9uIEFjcXVpcmUgTERBUC1EYXRhIGZvciBwYXNzaW5nIGl0IHRvIHRoZSBtYXRjaC1saXN0ZW5lcnMuXG4gICAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgICAgICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mICh0b1Byb2Nlc3MgYXMgYW55KS5jb2RiaUxEQVBTZXRNYXRjaExpc3RlbmVycykge1xuICAgICAgICAgIGxpc3RlbmVyKGxkYXBSZXN1bHQsIHRvUHJvY2Vzcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcHJvcG9zYWxzLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgYXN5bmMgKGV2ZW50KSA9PiB7XG4gICAgICBvblNlbGVjdGVkKCk7XG4gICAgfSk7XG4gICAgcHJvcG9zYWxzLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGFzeW5jIChldmVudCkgPT4ge1xuICAgICAgaWYgKGV2ZW50LmtleSA9PT0gXCJFbnRlclwiIHx8IGV2ZW50LmtleSA9PT0gXCJTcGFjZVwiKSB7XG4gICAgICAgIG9uU2VsZWN0ZWQoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLyAjZW5kcmVnaW9uIEhhbmRsZSBTZWxlY3Rpb24uXG4gICAgLy8gI2VuZHJlZ2lvbiBDcmVhdGUgU2VsZWN0aW9uLlxuICAgIHRvUHJvY2Vzcy5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBhc3luYyAoZXZlbnQpID0+IHtcbiAgICAgIGlmIChibG9ja2VkKSB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qga2V5ID0gSU5TVEFOQ0UudHNDaGVjazxLZXlib2FyZEV2ZW50PihldmVudCwgS2V5Ym9hcmRFdmVudCkua2V5O1xuXG4gICAgICBpZiAoa2V5Lmxlbmd0aCAhPT0gMSAmJiBrZXkgIT09IFwiQmFja3NwYWNlXCIgJiYga2V5ICE9PSBcIkRlbGV0ZVwiKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZmluZFBhcmFtZXRlciA9IFtcbiAgICAgICAgXCJBTkRcIixcbiAgICAgICAgYCR7dG9Mb2FkLnByb3BlcnR5fT0keyh0b1Byb2Nlc3MgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWV9JHtrZXkubGVuZ3RoID09PSAxID8ga2V5IDogXCJcIn1gLFxuICAgICAgXTtcblxuICAgICAgaWYgKHRvTG9hZC51cmwpIHtcbiAgICAgICAgZmluZFBhcmFtZXRlci5wdXNoKHRvTG9hZC51cmwpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBsZGFwUmVzdWx0ID0gcmVtb3ZlRHVwbGljYXRlcyhhd2FpdCBMREFQX0ZpbmQucmV0cmlldmUoZmluZFBhcmFtZXRlciksIHRvTG9hZC5wcm9wZXJ0eSk7XG5cbiAgICAgIGlmIChsZGFwUmVzdWx0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAodG9Qcm9jZXNzIGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlID0gbGRhcFJlc3VsdFswXVt0b0xvYWQucHJvcGVydHldO1xuICAgICAgICAvLyAjcmVnaW9uIEJsb2NrIGlucHV0IG9uIG1hdGNoLlxuICAgICAgICBibG9ja2VkID0gdHJ1ZTtcbiAgICAgICAgLy8gI3JlZ2lvbiBSZW1vdmUgcHJvcG9zYWxzLlxuICAgICAgICBwcm9wb3NhbHMucmVtb3ZlKCk7XG4gICAgICAgIC8vICNlbmRyZWdpb24gUmVtb3ZlIHByb3Bvc2Fscy5cbiAgICAgICAgLy8gI3JlZ2lvbiBOb3RpZnkgbWF0Y2gtbGlzdGVuZXJzLlxuICAgICAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cbiAgICAgICAgaWYgKCh0b1Byb2Nlc3MgYXMgYW55KS5jb2RiaUxEQVBTZXRNYXRjaExpc3RlbmVycykge1xuICAgICAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgICAgICAgIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgKHRvUHJvY2VzcyBhcyBhbnkpLmNvZGJpTERBUFNldE1hdGNoTGlzdGVuZXJzKSB7XG4gICAgICAgICAgICBsaXN0ZW5lcihsZGFwUmVzdWx0LCB0b1Byb2Nlc3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyAjZW5kcmVnaW9uIE5vdGlmeSBtYXRjaC1saXN0ZW5lcnMuXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIGJsb2NrZWQgPSBmYWxzZTtcbiAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBCbG9jayBpbnB1dCBvbiBtYXRjaC5cbiAgICAgIH1cbiAgICAgIC8vICNyZWdpb24gU2hvdyBwcm9wb3NhbHMuXG4gICAgICBpZiAobGRhcFJlc3VsdC5sZW5ndGggPiAxKSB7XG4gICAgICAgIHByb3Bvc2Fscy5pbm5lckhUTUwgPSBcIlwiO1xuXG4gICAgICAgIGZvciAoY29uc3QgcmVzdWx0IG9mIGxkYXBSZXN1bHQpIHtcbiAgICAgICAgICBwcm9wb3NhbHMub3B0aW9ucy5hZGQobmV3IE9wdGlvbihyZXN1bHRbdG9Mb2FkLnByb3BlcnR5XSwgcmVzdWx0W3RvTG9hZC5wcm9wZXJ0eV0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50LmFwcGVuZENoaWxkKHByb3Bvc2Fscyk7XG4gICAgICB9XG4gICAgICAvLyAjZW5kcmVnaW9uIFNob3cgcHJvcG9zYWxzLlxuICAgIH0pO1xuICB9XG4gIC8vICNyZWdpb24gSW5pdGlhbGl6YXRpb25cbiAgLyoqXG4gICAqIFN0YXRlcyB3aGV0aGVyIHRoaXMge0BsaW5rIExEQVBfQXV0b2NvbXBsZXRlIH0gd2FzIHN1Y2Nlc3NmdWxseSByZWdpc3RlcmVkXG4gICAqIHZpYSB7QGxpbmsgQ29kYmlHbG9iYWwucmVnaXN0ZXJGdW5jdGlvbmFsaXR5IH0gd2l0aCB0aGUgQ29kQmkgYW5kIHBlcmZvcm1zIHRoZSByZWdpc3RyYXRpb24gdXBvbiBjbGFzcyB1c2FnZS4qL1xuICBwdWJsaWMgc3RhdGljIHJlZ2lzdGVyZWQ6IGJvb2xlYW4gPSAoKCkgPT4ge1xuICAgIHJldHVybiB3aW5kb3cuY29kYmkucmVnaXN0ZXJGdW5jdGlvbmFsaXR5KFwiTERBUC5BdXRvY29tcGxldGVcIiwgTERBUF9BdXRvY29tcGxldGUuZnVuY3Rpb25hbGl0eSk7XG4gIH0pKCk7XG4gIC8vICNlbmRyZWdpb24gSW5pdGlhbGl6YXRpb25cbn1cbi8vICNyZWdpb24gSGVscGVyXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlRHVwbGljYXRlcyh0b0ZpbHRlcjogdW5rbm93bltdLCBieTogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkKTogdW5rbm93bltdIHtcbiAgaWYgKGJ5KSB7XG4gICAgY29uc3Qgc2VlbiA9IG5ldyBNYXA8c3RyaW5nLCB1bmtub3duPigpO1xuXG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHRvRmlsdGVyKSB7XG4gICAgICBjb25zdCBwcm9wVmFsdWUgPSBpdGVtW2J5XTtcblxuICAgICAgaWYgKCFzZWVuLmhhcyhwcm9wVmFsdWUpKSB7XG4gICAgICAgIHNlZW4uc2V0KHByb3BWYWx1ZSwgaXRlbSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIEFycmF5LmZyb20oc2Vlbi52YWx1ZXMoKSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIFsuLi5uZXcgU2V0KHRvRmlsdGVyKV07XG4gIH1cbn1cbi8vICNlbmRyZWdpb24gSGVscGVyXG4iLCAiLy8gI3JlZ2lvbiBJbXBvcnRzXG4vLyAjcmVnaW9uIFhJTUFcbmltcG9ydCB7IGdldEpRdWVyeSB9IGZyb20gXCJAZGUteGltYS9mYy1mb3JtLXJlbmRlcmVyXCI7XG4vLyAjZW5kcmVnaW9uIFhJTUFcbi8vICNyZWdpb24gWERCQ1xuaW1wb3J0IHsgREJDIH0gZnJvbSBcInhkYmMvc3JjL0RCQ1wiO1xuaW1wb3J0IHsgQUUgfSBmcm9tIFwieGRiYy9zcmMvREJDL0FFLmpzXCI7XG5pbXBvcnQgeyBUWVBFIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9UWVBFXCI7XG4vLyAjZW5kcmVnaW9uIFhEQkNcbmltcG9ydCB7IENvZEJpRXJyb3IgfSBmcm9tIFwiLi4vZ2xvYmFsLXNjb3BlLmpzXCI7XG4vLyAjZW5kcmVnaW9uIEltcG9ydHNcbi8qKlxuICogUHJvdmlkZXMgdGhlIHtAbGluayBMREFQX0ZpbmQjZnVuY3Rpb25hbGl0eSB9LlxuICpcbiAqIEByZW1hcmtzXG4gKiBNYWludGFpbmVyOiBDYWxsYXJpLCBTYWx2YXRvcmUgKFNhbHZhdG9yZS5DYWxsYXJpQEFuc2JhY2guZGUpICovXG4vLyBiaW9tZS1pZ25vcmUgbGludC9jb21wbGV4aXR5L25vU3RhdGljT25seUNsYXNzOiBQcm9hY3RpdmUgRGVzaWduLlxuZXhwb3J0IGNsYXNzIExEQVBfRmluZCB7XG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgdGhlIFwiTERBUC5GaW5kXCItRnVuY3Rpb25hbGl0eS5cbiAgICpcbiAgICogVGhpcyBFbGVtZW50cGxhY2Vob2xkZXIgY29ubmVjdHMgdmlhIGEgZGVmYXVsdCAoKipMREFQX1VSTCoqIGluIENvZEJpIFNldHRpbmdzKSBvciBhbiBvcHRpb25hbGx5IHNwZWNpZmllZFxuICAgKiBVUkwgKG9wdGlvbmFsICoqM3JkIHBhcmFtZXRlcioqKSB0byBhIHByZWRlZmluZWQgRm9ybWN5Y2xlIExEQVAtUXVlcnkgcmVxdWVzdGluZyBkYXRhIGZyb20gaXQuXG4gICAqIFRoZSBRdWVyeSBoYXMgdG8gaGF2ZSBmb2xsb3dpbmcgY29udGVudCBpbiBvcmRlciB0byB3b3JrIHdpdGggdGhpcyBFbGVtZW50cGxhY2Vob2xkZXI6XG4gICAqICoqKD8oPyopKD8qKSg/KikoPyopKD8qKSg/KikoPyopKD8qKSg/KikoPyopKSoqLlxuICAgKlxuICAgKiAqKkZ1cnRoZXJtb3JlIEZvbGxvd2luZyBjdXJyZW50bHkgc3VwcG9ydGVkIExEQVAtQXR0cmlidXRlcyBzaG91bGQgYmUgcmV0dXJuZWQgYnkgdGhlIHByZWRlZmluZWQgRm9ybWN5Y2xlIExEQVAtUXVlcnkqKlxuICAgKiB8IExEQVAgUHJvcGVydHkgfCBDb3JyZXNwb25kcyBUbyB8XG4gICAqIHwgOi0tLS0tLS0tLS0tLSB8IDotLS0tLS0tLS0tLS0tIHxcbiAgICogfCBnaXZlbk5hbWUgICAgIHwgRmlyc3QgTmFtZSAgICAgfFxuICAgKiB8IG1haWwgICAgICAgICAgfCBlTWFpbCBBZGRyZXNzICB8XG4gICAqIHwgc24gICAgICAgICAgICB8IExhc3QgTmFtZSAgICAgIHxcbiAgICogfCB0aXRsZSAgICAgICAgIHwgVGl0bGUgICAgICAgICAgfFxuICAgKiB8IGRlcGFydG1lbnQgICAgfCBEZXBhcnRtZW50ICAgICB8XG4gICAqIHwgdGVsZXBob25lTnVtYmVyfCBQaG9uZW51bWJlciAgIHxcbiAgICogfCBzQU1BY2NvdW50TmFtZXwgQWNjb3VudCAgICAgICAgfFxuICAgKiB8IGNuICAgICAgICAgICAgfCBDb21tb24gTmFtZSAgICB8XG4gICAqIHwgZGlzcGxheU5hbWUgICB8IERpc3BsYXkgTmFtZSAgIHxcbiAgICpcbiAgICogQ29uZmlnIFBhcmFtZXRlcjpcbiAgICogIC0gMXN0OiAgVGhlIG1vZGUgdG8gdXNlIGZvciB0aGUgZmlsdGVyLiBFaXRoZXIgKipBTkQqKiBvciAqKk9SKiogKGNhc2UgaW5zZW5zaXRpdmUpLiBFdmVyeXRoaW5nIGVsc2Ugd2lsbCBiZSBpbnRlcnByZXRlZCBhcyAqKkFORCoqLlxuICAgKiAgLSAybmQ6ICBUaGUgTERBUCBjb25kaXRpb25zIChsaWtlIHNuID0gRG9lKSBzZXBhcmF0ZWQgYnkgKip8KiogKGxpa2Ugc24gPSBEb2UgfCBnaXZlbk5hbWUgPSBKb2huKS5cbiAgICogIC0gM3JkOiAgVGhlIG9wdGlvbmFsICoqVVJMKiogdG8gYSBGb3JtY3ljbGUtTERBUC1RdWVyeSAod2hpY2gncyBjb250ZW50IGlzICoqKD8oPyopKD8qKSg/KikoPyopKD8qKSg/KikoPyopKD8qKSg/KikoPyopKSoqKSB0byB1c2UuICovXG4gIEBEQkMuUGFyYW12YWx1ZVByb3ZpZGVyXG4gIHB1YmxpYyBzdGF0aWMgcmV0cmlldmUoXG4gICAgQEFFLlBSRShuZXcgVFlQRShcInN0cmluZ1wiKSlcbiAgICBwYXJhbXM6IEFycmF5PHVua25vd24+LFxuICApOiBQcm9taXNlPEFycmF5PHVua25vd24+PiB7XG4gICAgbGV0IHJ1bm5pbmdRdWVyeSA9IHVuZGVmaW5lZDtcblxuICAgIGNvbnN0IGFib3J0ZWRRdWVyaWVzID0gbmV3IEFycmF5PHVua25vd24+KCk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgbW9kZSA9XG4gICAgICAgIHBhcmFtc1swXSA9PT0gXCJcIlxuICAgICAgICAgID8gXCIlMjZcIlxuICAgICAgICAgIDogKHBhcmFtc1swXSBhcyBzdHJpbmcpLnRvTG93ZXJDYXNlKCkgPT09IFwiYW5kXCJcbiAgICAgICAgICAgID8gXCIlMjZcIlxuICAgICAgICAgICAgOiAocGFyYW1zWzBdIGFzIHN0cmluZykudG9Mb3dlckNhc2UoKSA9PT0gXCJvclwiXG4gICAgICAgICAgICAgID8gXCJ8XCJcbiAgICAgICAgICAgICAgOiBcIiUyNlwiO1xuICAgICAgbGV0IGNvbmRpdGlvbnMgPSAocGFyYW1zWzFdIGFzIHN0cmluZykuc3BsaXQoXCJ8XCIpO1xuICAgICAgY29uc3QgdXJsID0gcGFyYW1zLmxlbmd0aCA+IDMgPyBwYXJhbXNbM10gOiB3aW5kb3cuY29kYmlTZXR0aW5ncy5MREFQLlVSTDtcblxuICAgICAgaWYgKHVybCA9PT0gXCJcIikge1xuICAgICAgICByZWplY3QobmV3IENvZEJpRXJyb3IoXCJbWyBMREFQLkZpbmQgXSBObyBMREFQLVVSTCBzcGVjaWZpZWQgbmVpdGhlciB2aWEgcGFyYW1ldGVyIG5vciB2aWEgQ29kQmkgU2V0dGluZ3MuIF1cIikpO1xuICAgICAgfVxuICAgICAgLy8gI3JlZ2lvbiBGaWxsIGNvbmRpdGlvbnMgdXAgdG8gMTAgZWxlbWVudHMuXG4gICAgICBmb3IgKGxldCBpID0gY29uZGl0aW9ucy5sZW5ndGggLSAxOyBpIDwgOTsgaSsrKSB7XG4gICAgICAgIGNvbmRpdGlvbnMucHVzaChjb25kaXRpb25zW2NvbmRpdGlvbnMubGVuZ3RoIC0gMV0pO1xuICAgICAgfVxuICAgICAgLy8gI2VuZHJlZ2lvbiBGaWxsIGNvbmRpdGlvbnMgdXAgdG8gMTAgZWxlbWVudHMuXG4gICAgICAvLyAjcmVnaW9uIE5vcm1hbGl6ZSBjb25kaXRpb25zLlxuICAgICAgY29uZGl0aW9ucyA9IGNvbmRpdGlvbnMubWFwKCh0b1RyYW5zZm9ybSkgPT4ge1xuICAgICAgICByZXR1cm4gdG9UcmFuc2Zvcm0ucmVwbGFjZShcIj1cIiwgXCIlM0RcIikudHJpbSgpO1xuICAgICAgfSk7XG4gICAgICAvLyAjZW5kcmVnaW9uIE5vcm1hbGl6ZSBjb25kaXRpb25zLlxuICAgICAgaWYgKHJ1bm5pbmdRdWVyeSkge1xuICAgICAgICBydW5uaW5nUXVlcnkuYWJvcnQoKTtcbiAgICAgIH1cblxuICAgICAgcnVubmluZ1F1ZXJ5ID0gZ2V0SlF1ZXJ5KClcbiAgICAgICAgLmFqYXgoYCR7dXJsfSZxdWVyeVBhcmFtZXRlcj0ke21vZGV9LCR7Y29uZGl0aW9ucy5qb2luKFwiLFwiKX1gKVxuICAgICAgICAuZG9uZSgocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICBpZiAoYWJvcnRlZFF1ZXJpZXMuaW5kZXhPZihydW5uaW5nUXVlcnkpID09PSAtMSkge1xuICAgICAgICAgICAgcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICAvLyAjcmVnaW9uIEluaXRpYWxpemF0aW9uXG4gIC8qKlxuICAgKiBTdGF0ZXMgd2hldGhlciB0aGlzIHtAbGluayBMREFQX0ZpbmQgfSB3YXMgc3VjY2Vzc2Z1bGx5IHJlZ2lzdGVyZWRcbiAgICogdmlhIHtAbGluayBDb2RiaUdsb2JhbC5yZWdpc3RlckVQIH0gd2l0aCB0aGUgQ29kQmkgYW5kIHBlcmZvcm1zIHRoZSByZWdpc3RyYXRpb24gdXBvbiBjbGFzcyB1c2FnZS4qL1xuICBwdWJsaWMgc3RhdGljIHJlZ2lzdGVyZWQ6IGJvb2xlYW4gPSAoKCkgPT4ge1xuICAgIHJldHVybiB3aW5kb3cuY29kYmkucmVnaXN0ZXJFUChcIkxEQVAuRmluZFwiLCBMREFQX0ZpbmQucmV0cmlldmUpO1xuICB9KSgpO1xuICAvLyAjZW5kcmVnaW9uIEluaXRpYWxpemF0aW9uXG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLElBQUFBLDJCQUEwQjs7O0FDQTFCLDhCQUEwQjtBQWVuQixJQUFNLGFBQU4sTUFBTSxXQUFVO0FBQUEsRUEyQnJCLE9BQWMsU0FFWixRQUN5QjtBQUN6QixRQUFJLGVBQWU7QUFFbkIsVUFBTSxpQkFBaUIsSUFBSSxNQUFlO0FBRTFDLFdBQU8sSUFBSSxRQUFRLENBQUMsU0FBUyxXQUFXO0FBQ3RDLFlBQU0sT0FDSixPQUFPLENBQUMsTUFBTSxLQUNWLFFBQ0MsT0FBTyxDQUFDLEVBQWEsWUFBWSxNQUFNLFFBQ3RDLFFBQ0MsT0FBTyxDQUFDLEVBQWEsWUFBWSxNQUFNLE9BQ3RDLE1BQ0E7QUFDVixVQUFJLGFBQWMsT0FBTyxDQUFDLEVBQWEsTUFBTSxHQUFHO0FBQ2hELFlBQU0sTUFBTSxPQUFPLFNBQVMsSUFBSSxPQUFPLENBQUMsSUFBSSxPQUFPLGNBQWMsS0FBSztBQUV0RSxVQUFJLFFBQVEsSUFBSTtBQUNkLGVBQU8sSUFBSSxXQUFXLHNGQUFzRixDQUFDO0FB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QU0seUJBQXdCO01BQ2hDO0FBRUEsWUFBTSxNQUFNLFNBQVMsUUFBdUIsT0FBTyxhQUFhLEVBQUU7QUFFbEUsVUFBSSxJQUFJLFdBQVcsS0FBSyxRQUFRLGVBQWUsUUFBUSxVQUFVO0FBQy9EO01BQ0Y7QUFFQSxZQUFNLGdCQUFnQjtRQUNwQjtRQUNBLEdBQUcsT0FBTyxRQUFRLElBQUssVUFBK0IsS0FBSyxHQUFHLElBQUksV0FBVyxJQUFJLE1BQU0sRUFBRTs7QUFHM0YsVUFBSSxPQUFPLEtBQUs7QUFDZCxzQkFBYyxLQUFLLE9BQU8sR0FBRztNQUMvQjtBQUVBLFlBQU0sYUFBYSxpQkFBaUIsTUFBTSxVQUFVLFNBQVMsYUFBYSxHQUFHLE9BQU8sUUFBUTtBQUU1RixVQUFJLFdBQVcsV0FBVyxHQUFHO0FBQzFCLGtCQUErQixRQUFRLFdBQVcsQ0FBQyxFQUFFLE9BQU8sUUFBUTtBQUVyRSxrQkFBVTtBQUVWLGtCQUFVLE9BQU07QUFJaEIsWUFBSyxVQUFrQiw0QkFBNEI7QUFFakQscUJBQVcsWUFBYSxVQUFrQiw0QkFBNEI7QUFDcEUscUJBQVMsWUFBWSxTQUFTO1VBQ2hDO1FBQ0Y7QUFFQSxtQkFBVyxNQUFLO0FBQ2Qsb0JBQVU7UUFDWixHQUFHLEdBQUc7TUFFUjtBQUVBLFVBQUksV0FBVyxTQUFTLEdBQUc7QUFDekIsa0JBQVUsWUFBWTtBQUV0QixtQkFBVyxVQUFVLFlBQVk7QUFDL0Isb0JBQVUsUUFBUSxJQUFJLElBQUksT0FBTyxPQUFPLE9BQU8sUUFBUSxHQUFHLE9BQU8sT0FBTyxRQUFRLENBQUMsQ0FBQztRQUNwRjtBQUVBLGtCQUFVLGNBQWMsWUFBWSxTQUFTO01BQy9DO0lBRUYsQ0FBQztFQUNIOztBQUtjLFNBQUEsY0FBdUIsTUFBSztBQUN4QyxhQUFPLE9BQU8sTUFBTSxzQkFBc0IscUJBQXFCLG1CQUFrQixhQUFhO0lBQ2hHLEdBQUU7RUFBRzs7QUF0SVMsV0FBQTtFQURiLElBQUk7OytEQUNxRSxZQUFPLGVBQVAsYUFBTyxhQUFBLEtBQUEsTUFBQSxDQUFBOzs7QUEwSTdFLFNBQVUsaUJBQWlCLFVBQXFCLEtBQXlCLFFBQVM7QUFDdEYsTUFBSSxJQUFJO0FBQ04sVUFBTSxPQUFPLG9CQUFJLElBQUc7QUFFcEIsZUFBVyxRQUFRLFVBQVU7QUFDM0IsWUFBTSxZQUFZLEtBQUssRUFBRTtBQUV6QixVQUFJLENBQUMsS0FBSyxJQUFJLFNBQVMsR0FBRztBQUN4QixhQUFLLElBQUksV0FBVyxJQUFJO01BQzFCO0lBQ0Y7QUFFQSxXQUFPLE1BQU0sS0FBSyxLQUFLLE9BQU0sQ0FBRTtFQUNqQyxPQUFPO0FBQ0wsV0FBTyxDQUFDLEdBQUcsSUFBSSxJQUFJLFFBQVEsQ0FBQztFQUM5QjtBQUNGOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfZmNfZm9ybV9yZW5kZXJlciJdCn0K
