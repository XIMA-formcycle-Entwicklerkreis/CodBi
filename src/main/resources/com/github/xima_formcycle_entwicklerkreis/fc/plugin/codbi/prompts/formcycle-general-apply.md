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
