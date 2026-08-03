# CodBi Standard Configurations

CSS class descriptions, Matomo tracking activation, standard config activation rules.

## Two-Option Rule

CSS classes exist ONLY for the specific patterns listed below. For EVERY field you modify, you have exactly TWO options — pick ONE:

- OPTION A — CSS class exists in the list below → use it (e.g. CodBi_People_Name for a name field)
- OPTION B — No matching CSS class in the list → use data-cb-func (e.g. Form.Navigator has NO CSS class → data-cb-func=form.navigator)

CRITICAL: NEVER invent CSS class names. If a CSS class is not in the list below, it does NOT exist — use data-cb-func instead.

## Application Rules

a) Apply AT MOST ONE CSS class per field — do NOT stack multiple classes on the same element.
b) Only apply a CSS class when it has an EXACT match to the field's purpose. If no class matches, use data-cb-func.
c) For Time/Date frame ranges: When a CodBi_TimeFrame_N_Begin/End or CodBi_DateFrame_N_Begin/End CSS class exists (N=1-5), use it. FALLBACK: If all 5 numbers are already used, use data-cb-func=time.frame (or date.frame). When using a frame CSS class, do NOT add data-cb-func=time.frame or data-cb-func=date.frame — that would be redundant. However, you MAY add data-cb-func for a DIFFERENT functionality (e.g. CodBi_DateFrame_1_Begin + data-cb-func=date.noweekends is valid).
d) NUMBERING — When creating frame CSS classes, scan the existing form items for which frame numbers N (1-5) are already in use. Use the lowest unused N for each new pair. If all 5 numbers are taken, fall back to data-cb-func.
e) Do NOT use CodBi_People_Alphanumeric on street names, localities, or other non-alphanumeric-code fields.
f) REDUNDANCY RULE: When a field's datatype already triggers a Holistic.Cleave.* standard (datatype="phone" → Cleave.Phone, "plzDE" → Cleave.PLZ, "dateDE"/"time" → Cleave.Date/Time), do NOT apply the equivalent People CSS class.
g) Street names and locality/city names have no dedicated People CSS class — leave them without a CSS class.

## People

### CodBi_People_Name
For a person's name (Vorname, Nachname). Do NOT apply to street names or localities.

### CodBi_People_Alphanumeric
ONLY for alphanumeric codes/IDs. Do NOT apply to names, streets, localities, or postal codes.

### CodBi_People_Mail
For email addresses.

### CodBi_People_Phone
For phone numbers.

### CodBi_People_PLZ
For German postal codes. Use ALONE — do not combine with other People classes.

### CodBi_People_18plus
For date-of-birth fields (min age 18).

### CodBi_People_16plus
For date fields (min age 16).

### CodBi_People_BuildingNumber
For building/house numbers.

## Fotocropper

### CodBi_Fotocropper_Board
CSS class for the Fotocropper image board.

### CodBi_Fotocropper_Uploader
CSS class for the Fotocropper uploader.

### CodBi_Fotocropper_Update
CSS class for the Fotocropper update control.

### CodBi_Fotocropper_ImageURL
CSS class for the Fotocropper image URL input.

### CodBi_Fotocropper_Foto
CSS class for the Fotocropper photo display.

## OpenPLZ Select

### CodBi_OpenPLZ_Select_*
For OpenPLZ address select dropdowns.

## Financial

### CodBi_Currency
For money/currency fields.

## Appointments

### CodBi_NoFutureDate
For date fields that should not allow future dates.

### CodBi_DateFrame_N_Begin_End
For date ranges (N=1-5). When using these classes, do NOT also add data-cb-func=date.frame.

### CodBi_TimeFrame_N_Begin_End
For time ranges (N=1-5). When using these classes, do NOT also add data-cb-func=time.frame.

## LDAP.Autofill

### CodBi_LDAP_AC_*
For LDAP autocomplete fields.

## AI

### AI_LLAMA_CHAT_Input
Textarea for the AI chat widget.

### AI_LLAMA_CHAT_Send
Send button for the AI chat widget.

### AI_LLAMA_CHAT_Stop
Stop button for the AI chat widget.

### AI_LLAMA_CHAT_Upload
Upload field for the AI chat widget.

### AI_LLAMA_CHAT_Thinking
Thinking checkbox for the AI chat widget.

### AI_LLAMA_CHAT_Internet
Internet checkbox for the AI chat widget.

### AI_LLAMA_CHAT_Location
Location checkbox for the AI chat widget.

### AI_LLAMA_CHAT_MailForward
Mail forward checkbox for the AI chat widget.

### AI_LLAMA_CHAT_MailAddress
Email address text field for the AI chat widget.

### AI_LLAMA_CHAT_AlertOnFinish
Alert-on-finish checkbox for the AI chat widget.

### AI_LLAMA_STANDARD_QA_Question
Question field for AI standard QA (FULL name — do NOT shorten).

### AI_LLAMA_STANDARD_TXTQA_Question
Question field for AI standard TXTQA (FULL name — do NOT shorten to AI_LLAMA_TXTQA_Question).

### AI_LLAMA_TXTQA_Source
Source field for AI TXTQA.

### AI_LLAMA_QA_Exclude
Exclusion marker for AI QA.

### AI_OCR_Receiver
Receiver field for AI OCR output.

## UI.Panels

### CodBi_HTML_Panel_Standard
Default standalone panel. CRITICAL — Panel CSS classes ONLY work on XFieldSet (fieldset), NOT on XContainer or XContainerInvisible. Panel type mapping: "Standard-Panel" or "einfaches Panel" → CodBi_HTML_Panel_Standard.

### CodBi_HTML_Panel_Flat
"Flaches Panel" / "Flat Panel" standalone panel. Panel CSS classes ONLY work on XFieldSet (fieldset), NOT on XContainer or XContainerInvisible.

### CodBi_HTML_Panel_Index
"Index-Panel" / "Index Panel" standalone panel. Panel CSS classes ONLY work on XFieldSet (fieldset), NOT on XContainer or XContainerInvisible.

### CodBi_HTML_Panel_Minimal
"Minimales Panel" / "Minimal Panel" standalone panel. Panel CSS classes ONLY work on XFieldSet (fieldset), NOT on XContainer or XContainerInvisible.

### CodBi_Accordion_A_B_C_D
Accordion classes (CodBi_Accordion_A/B/C/D) for accordions.

### CodBi_HTML_Panel_NoCordion
Marker class for panels inside an accordion that should NOT participate in the accordion behavior.

## Print.Removal

### CodBi_Print_Remove_Tagged
CSS class for tagged print removal.

### CodBi_Print_Remove_Parent
CSS class for parent print removal.

### CodBi_Print_Remove_PrintOnly
CSS class for print-only elements.

## BayVIS

### CodBi_BayVIS_Behoerde
CSS class for BayVIS authority fields.

### CodBi_BayVIS_BehoerdeUndAnsprechpartner
CSS class for BayVIS authority + contact fields.

### CodBi_BayVIS_Ansprechpartner
CSS class for BayVIS contact fields.

### CodBi_BayVIS_Auswahl_Behoerden
CSS class for BayVIS authority selection.

## OpenPLZ.AC.SET

### CodBi_OpenPLZ_AC_SET_PLZ
Apply to the POSTAL CODE field of an address group to enable OpenPLZ autocomplete (postal codes). The server configures OpenPLZ.Autocomplete + Cleave postal-code formatting automatically.

### CodBi_OpenPLZ_AC_SET_Locality
Apply to the LOCALITY/CITY field of an address group to enable OpenPLZ autocomplete (localities).

### CodBi_OpenPLZ_AC_SET_Street
Apply to the STREET field of an address group to enable OpenPLZ autocomplete (streets).

### CodBi_OpenPLZ_AC_SET_BuildingNumber
Apply to the BUILDING NUMBER field of an address group to enable OpenPLZ autocomplete (building numbers).

## Holistic CSS Classes

### CodBi_XCL_Speech
CSS class for speech-to-text.

### CodBi_XCL_Speech_Whisper
CSS class for Whisper speech-to-text.

## Matomo Tracking Activation

When the prompt says "Matomo-Tracking aktivieren" or "activate Matomo tracking" without specifying a SiteID, do NOT add Matomo.Tracking functionality via data-cb-func on any element. Instead, include {"id":"Holistic.Matomo.Tracking","targets":[]} in _codbiApplicability.applied — the server reads this and activates the standard configuration.

Only apply Matomo.Tracking functionality with data-cb-SiteID when a SiteID IS explicitly specified in the prompt.

## System Standard Configurations

The following standard configurations are activated by the server (system applications) rather than through CSS classes on form elements. Each one can be deactivated in the Prompt Manager if it should not be applied.

### Holistic.Matomo.Tracking
Server-side standard configuration that activates Matomo/Piwik analytics tracking for the form. It is triggered when the AI reports {"id":"Holistic.Matomo.Tracking","targets":[]} in _codbiApplicability.applied (e.g. when the user says "Matomo-Tracking aktivieren" without an explicit SiteID). Uses the Matomo_SiteID / Matomo_URL plugin configuration.

### Holistic.Cleave.Date
Server-side standard configuration that applies Cleave-based input formatting to date fields (datatype starting with "date"). The server activates it automatically based on the field datatypes present in the form.

### Holistic.Cleave.Phone
Server-side standard configuration that applies Cleave-based input formatting to phone number fields (datatype="phone"). The server activates it automatically based on the field datatypes present in the form.

### Holistic.Cleave.PLZ
Server-side standard configuration that applies Cleave-based input formatting to German postal code fields (datatype="plzDE"). The server activates it automatically based on the field datatypes present in the form.

### Holistic.Cleave.Time
Server-side standard configuration that applies Cleave-based input formatting to time fields (datatype="time"). The server activates it automatically based on the field datatypes present in the form.
