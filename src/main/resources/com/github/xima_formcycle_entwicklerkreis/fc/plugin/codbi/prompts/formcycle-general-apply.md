# Formcycle General — FORM BUILD REFERENCE (pass-2)

Pass-2 build annex of the two shared Formcycle decision cores: the EConditionType numeric codes and the server-variable catalog the decision core defers to. The cross-cutting Formcycle structure/behavioural rules themselves are NOT repeated here — they live in the two decision cores every pass receives (`codbi-form-structure-rules.decision.md` and `codbi-general.decision.md`), alongside the widget sections appended below.

ECONDITIONTYPE CODES (enum de.xima.fc.form.common.statics.EConditionType — the `*ifcomp` value; identical for hiddenif/readonlyif/requiredif):
- 0 = MANDATORY — true/active when the controlling field HAS a value (e.g. a checkbox is CHECKED).
- 1 = EQUAL — when the controlling field's value EQUALS the `*ifvalue`.
- 2 = NOT_EQUAL — when the controlling field's value is NOT EQUAL to the `*ifvalue`.
- 3 = REGEX — when the controlling field's value MATCHES the `*ifvalue` regex.
- 4 = LESS_THAN — when the controlling field's value is LESS THAN `*ifvalue` (number).
- 5 = GREATER_THAN — when the controlling field's value is GREATER THAN `*ifvalue` (number).
- 6 = BETWEEN — when the controlling field's value is WITHIN the `*ifvalue` range (<min>-<max>).
- 7 = LESS_OR_EQUAL — when the controlling field's value is <= `*ifvalue`.
- 8 = GREATER_OR_EQUAL — when the controlling field's value is >= `*ifvalue`.
- 9 = EMPTY — when the controlling field has NO value (is empty). For a checkbox: hidden while UNCHECKED, shown once CHECKED.
`hiddenifclear` / `readonlyifclear` control the value while the condition is met: "false" or 0 = preserve the value, "1" = clear it, "2" = disable but keep it. `readonlyifmode` exists only on some element types — keep the designer default unless the request needs a specific locking mode. For a field that is ALWAYS locked set the plain flag "isreadonly":"1"; for an always-disabled field "isdisabled":"1". NEVER emit disabledif / disabledifcomp / disabledifvalue / availableif — those keys do not exist and are silently ignored.

<!--SECTION:server_vars-->
## Server Variables (Placeholders)

AVAILABLE SERVER VARIABLES (system placeholders — use [%\$NAME%] syntax):

FORM RECORD:
- [%\$PROCESS_ID%] — form record process ID (string)
- [%\$RECORD_ID%] — form record database ID (numeric)
- [%\$RECORD_SUBJECT%] — form record subject/title
- [%\$RECORD_READ%] — true/false whether record has been read
- [%\$RECORD_UNREAD%] — true/false whether record is unread
- [%\$RECORD_ATTR%] or [%\$RECORD_ATTR.customKey%] — custom record attributes
- [%\$SOURCE_SERVER%] — source server name
- [%\$SOURCE_SERVER_URL%] — source server URL

WORKFLOW STATUS:
- [%\$STATUS_ID%] — current workflow status ID
- [%\$STATUS_TYPE%] — current workflow status type
- [%\$STATUS_NAME%] — current workflow status name

PROJECT:
- [%\$PROJECT_ID%] — project ID
- [%\$PROJECT_ALIAS%] — project alias
- [%\$PROJECT_NAME%] — project name
- [%\$PROJECT_TITLE%] — project title
- [%\$PROJECT_DESCRIPTION%] — project description

CLIENT:
- [%\$CLIENT_ID%] — client/mandant ID
- [%\$COUNTER_CLIENT%] or [%\$COUNTER_CLIENT.someKey%] — client counter
- [%\$DEFAULT_MAIL_SENDER%] — system default mail sender address
- [%\$CLIENT_MAIL_SENDER%] — client mail sender address
- [%\$DEFAULT_MAIL_SENDERNAME%] — system default mail sender name
- [%\$CLIENT_MAIL_SENDERNAME%] — client mail sender name

USER DATA (supports JSONPath, e.g. [%\$USER.firstName%]):
- [%\$USER%] — current user data (JSON)
- [%\$INITIAL_USER%] — initial submitter data (JSON)
- [%\$LAST_USER%] — last editor data (JSON)

LINKS:
- [%\$FORM_LINK%] — link to the form
- [%\$FORM_REVIEW_LINK%] — link to review the form record
- [%\$FORM_PROCESS_LINK%] — link to the process view (the current state of the record)
- [%\$FORM_INVITE_LINK%] — invitation link
- [%\$FORM_VERIFY_LINK%] — DOI email verification link
- [%\$FORM_VERIFY_PAGE_LINK%] — DOI verification page link
- [%\$FORM_INBOX_LINK%] — link to the form inbox
- [%\$FORM_INBOX_NAME%] — form inbox name
- [%\$FORM_PROCESS_HTML%] — process protocol as HTML
- [%\$PORTAL_LINK%] — user portal link
- [%\$PORTAL_FORM_RECORDS_LINK%] — portal form records link

A LINK TO THE FORM / TO THE CURRENT STATE OF THE FORM (e.g. an approval/review mail "mit einem Link zum aktuellen Stand des Formulars") is [%\$FORM_PROCESS_LINK%] (the process view) — use it DIRECTLY in the mail body/parameter; it is what is meant most of the time when a link to the form is requested. [%\$FORM_REVIEW_LINK%] reviews the form record; [%\$FORM_LINK%] is the plain link to the (blank) form and is only requested rarely; [%\$FORM_INVITE_LINK%] is an invitation link. NEVER ask for a URL template for such a link and NEVER invent a URL.

WORKFLOW ERRORS (prefix: CURRENT_, LATEST_, or LAST_):
- [%\$CURRENT_ERROR%] — the thrown error object
- [%\$CURRENT_ERROR_CODE%] — the error code/type
- [%\$CURRENT_ERROR_MESSAGE%] — the error message
- [%\$CURRENT_ERROR_NODE_NAME%] — name of the node that threw the error
- [%\$CURRENT_ERROR_NODE_TYPE%] — type of the node that threw the error
- (same with LATEST_ or LAST_ prefix)

APPOINTMENTS:
- [%\$APPOINTMENT%] — appointment data
- [%\$APPOINTMENT_LIST%] — appointments list (HTML)
- [%\$APPOINTMENT_LINK%] — appointment booking link
<!--/SECTION:server_vars-->

CONDITIONAL VISIBILITY / PROPERTY CHANGE BY A VALUE COMPARISON = OnChange.Conditional (LANGUAGE-AGNOSTIC - decide by MEANING, never by a keyword; the user may write German, English, Italian, Dutch, French, ...): when an element must APPEAR / DISAPPEAR / change a property because a DATE / TIME / NUMBER value is greater / less / equal to a THRESHOLD ("after/before <date>", "older/younger than", "more/less than <number>", "from ... on", "up to ...", "at least/at most", "as soon as ... is entered", "sobald ... nach dem ... liegt", "soll sofort reagieren, ohne Absenden", "updates immediately while typing"), use data-cb-func="OnChange.Conditional" on the watched FIELD - NEVER the Formcycle hiddenif*/visibleif properties (those stay for DISCRETE option/checkbox/empty state only). Parameters: data-cb-Mode = GT/GTEQ/LT/LTEQ/EQ/NEQ (the enum is GTEQ/LTEQ, never GTE/LTE); data-cb-Reference MUST resolve to a DATE - write the element placeholder { Date.FromString > 01.06.2026 ; DD.MM.YYYY } (or { Date.Today }), never a literal date string; data-cb-Candidate = dot-prefixed CLASS selector of the watched field; data-cb-Target = dot-prefixed CLASS selector of the element to change (candidate and target must share the SAME container/fieldset); data-cb-DateFormat = the candidate value format ("DD.MM.YYYY" for dateDE, "YYYY-MM-DD" for native date). TRUE/FALSE branches go on the SAME tagged field: data-cb-_T_func="HTML.SETAttribute" + data-cb-_T_name="style" + data-cb-_T_toset="display:block"; data-cb-_F_func="HTML.SETAttribute" + data-cb-_F_name="style" + data-cb-_F_toset="display:none". OnChange.Conditional runs only on `change`, so hide the target AT LOAD with its OWN data-cb-func="HTML.SETAttribute" + data-cb-name="style" + data-cb-toset="display:none" (never ishidden). List OnChange.Conditional (and the target's HTML.SETAttribute) in _codbiApplicability.considered and in the details-request "elements" - never codbiVerdict "none" when this rule fires.

PRINT-ONLY / SCREEN-ONLY VISIBILITY = Print.Remove (LANGUAGE-AGNOSTIC - decide by MEANING, NEVER with HTML.CSS/@media print): an element that must appear ONLY in the PRINT output ("nur im Druck sichtbar", "nur auf dem Ausdruck", "print-only", "only visible when printed", ANY language) gets the STANDARD class CodBi_Print_Remove_PrintOnly in its properties.cssclasses; an element that must be visible ONLY in the interactive form and hidden in print ("beim Drucken ausblenden", "nicht im Druck sichtbar", "hidden when printing") gets CodBi_Print_Remove_Tagged (the element) or CodBi_Print_Remove_Parent (its container/section). NEVER emit @media print rules, display:none helper classes or an HTML.CSS element for per-element print visibility - HTML.CSS is for styling rules only. The functionality form (only when a parameter is required) is data-cb-func="Print.Remove" with data-cb-invert="true" for PRINT-ONLY (hidden in the form, shown when printed) and WITHOUT Invert for HIDDEN-IN-PRINT; optional data-cb-documentselector / data-cb-parentallevel. Interactive controls are hidden in print by default (Tagged), NOT PrintOnly. Do not hide data fields proactively and never ask which mechanism to use.

URL-PARAMETER TO GLOBAL VARIABLE = SV (LANGUAGE-AGNOSTIC - decide by MEANING, ANY language): "URL-Parameter X als globale Variable", "verlinke den URL-Parameter X", "Query-Parameter in Formularvariable", "link/bind/map URL parameter X as a global variable", "read the query parameter into a global variable", "pass a URL parameter to the workflow" -> copy the URL QUERY parameter into a CodBi global variable at form load with data-cb-func="SV" on an XContainer/XContainerInvisible/XFieldSet (create ONE invisible container coUrlParams when none exists), data-cb-Destinations="<GLOBAL_VARIABLE>" and data-cb-Sources="<URL_PARAMETER>" (CSV lists of EQUAL length, paired by index; names are case-sensitive). DECLARE every destination in the top-level "variables" array as {"name":"<NAME>","aliasname":"<NAME>","serveronly":false,"value":""} - an undeclared variable never reaches the workflow. NOT the V EP (it only reads a variable), NOT a hidden field/JSON.SET/literal value. WORKED EXAMPLE - "Verlinke den URL-Parameter Hoho als globale Variable.": variables += {"name":"Hoho","aliasname":"Hoho","serveronly":false,"value":""}; XContainerInvisible coUrlParams with attributes data-cb-func=SV, data-cb-Destinations=Hoho, data-cb-Sources=Hoho, on the first page. A missing URL parameter yields an empty string.

SV DOCUMENTATION TEXT (ALWAYS): when SV is used, add ONE plain XSpan child ("ishidden":"1", no styling) inside the SV container whose rtevalue states the mapping in the form's language: single "Dieses Element uebernimmt den URL-Parameter X in die globale Variable Y." / "This element copies URL parameter X into global variable Y."; multiple pairs ONE combined, natural sentence "Dieses Element uebernimmt die URL-Parameter A und B in die globalen Variablen X und Y." / "This element copies the URL parameters A and B into the global variables X and Y." (comma list + "und"/"and" before the last for 3+; NOT one separate sentence per pair). The XSpan is author-facing documentation inside the invisible container, is never shown to the user, and must not be omitted. Include it in the container's "elements" and set its parentid to the container's name.

SV NOTE HIDDEN PROPERTY (MANDATORY): the documentation XSpan of an SV element MUST have the Formcycle Hidden property CHECKED - "ishidden":"1" in its properties (the designer checkbox "Ausblenden"/"Hidden"). Do NOT rely on the surrounding invisible container and do NOT use "invisible" (not a Formcycle property) or a CSS class for this. A generated SV documentation XSpan without "ishidden":"1" is WRONG.

HTML.CSS CARRIER ELEMENT (MANDATORY): when a NEW element is generated only to carry CSS rules, use an XSpan with "ishidden":"1" in its properties (the Formcycle Hidden/Ausblenden checkbox CHECKED), data-cb-func="HTML.CSS" + data-cb-css = the ACTUAL rules, and a descriptive rtevalue naming the CSS purpose + target in the designer's language (e.g. "Wendet CSS an: Ueberschriften rot (h1 { color: red; })."). NEVER put only a <style> block into rtevalue, NEVER leave it empty or generic ("HTML.CSS"), and NEVER use "invisible", a CSS class or a parent element for the hiding. This is the same author-facing documentation pattern as the SV note.
