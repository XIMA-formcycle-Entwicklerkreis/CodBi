# CodBi Functionalities

Rules for each CodBi functionality (data-cb-func), their parameters, and application conditions.

## GENERIC RULE for all CSS-Selector parameters

When a parameter requires a CSS-Selector referencing another form element, ALWAYS use the target element's properties.name value prefixed with a dot '.' (e.g., '.tfInterviewBis' or '.taAddress'). NEVER use an ID selector (# prefix, e.g., '#xi-tf-interviewbis'), because element IDs are mangled in repeatable containers; only properties.name-based selectors work reliably when CodBi searches within the shared parent container.

## AI.LLAMA.CHAT

Applicable on a container element to embed an AI chat widget (requires a locally running LLAMA server via CodBi settings).

When the user asks for an AI chat / KI-Chat / chatbot, create all of the following elements:
- XContainer wrapper (fullwidth="1"). Do NOT add data-cb-func="ai.llama.chat" to the container — it goes ONLY on the chat display.
- Chat display: XTextArea (data-cb-func="ai.llama.chat", readonly, fullwidth, autosize, no label). ADD attributes: data-cb-MaxPixelSize="360000", data-cb-maxchatwindowheight="1200".
- User input: XTextArea (cssclasses=["AI_LLAMA_CHAT_Input"], fullwidth, autosize).
- Send button: XButtonList with SINGLE button (cssclasses=["AI_LLAMA_CHAT_Send"], action.page="").
- Stop button: SEPARATE XButtonList with SINGLE button (cssclasses=["AI_LLAMA_CHAT_Stop"], action.page="").
- Upload: XUpload (cssclasses=["AI_LLAMA_CHAT_Upload"], fileextension="image/*,.pdf").
- Thinking checkbox: XCheckbox (cssclasses=["AI_LLAMA_CHAT_Thinking"]).
- Internet checkbox: XCheckbox (cssclasses=["AI_LLAMA_CHAT_Internet"]).
- Location checkbox: XCheckbox (cssclasses=["AI_LLAMA_CHAT_Location"]).
- Alert checkbox: XCheckbox (cssclasses=["AI_LLAMA_CHAT_AlertOnFinish"]).
- Mail container: XContainer containing mail checkbox + mail address field.
- Mail checkbox: XCheckbox (cssclasses=["AI_LLAMA_CHAT_MailForward"]) inside the mail container.
- Mail address: XTextField (cssclasses=["AI_LLAMA_CHAT_MailAddress"], datatype="email") inside the mail container. Set hiddenif="<MailForwardCheckbox_ID>", hiddenifcomp=0 and hiddenifclear="false" as DIRECT properties.

CRITICAL — Distinguish from Form Chatbot Plugin (XIMA Chatbot): Use XNavigationBar for XIMA mentioned navigation. Use CodBi ai.llama.chat ONLY when "CodBi KI-Chat" is explicitly mentioned.

## AI.OCR

Applicable on an XUpload field to extract and return text from uploaded images or PDFs via OCR.
- Mode="print": do NOT set data-cb-Field on the upload. The receiver text field is identified by its CodBi_AI_OCR_Receiver CSS class.
- Mode="verify": set Pattern, RegExFlags, WrongFileMessage, InvalidImageText (ALL five for verify).

## Date.Frame

Applicable ONLY on the BEGIN (minimum) XTextField of type 'date' when there is a second related end date field. The end field is referenced via the 'MaxField' parameter. Do NOT put this functionality on the end date element.

## Date.Min

Applicable on a XTextField of type 'date' to enforce a minimum allowed date (e.g. prevent past dates).

## Date.NoWeekends

Applicable on a XTextField of type 'date' to disallow weekend dates.

## Date.Today

Supports arithmetic directly — do NOT wrap it in Date.Arithmetic. Use "{ Date.Today > +1d }" for tomorrow, "{ Date.Today > -1d }" for yesterday. Arithmetic: +N d/m/y (add), -N d/m/y (subtract).

## Date.FromString

Turns a date string into a Date object. Use for any prompt about converting/parsing a date string. Example: "{ Date.FromString > 01.12.1978 }". Optional second param sets the format.

## Form.Navigator

Applicable on forms with 2 or more pages (multi-step forms); adds a navigation progress bar or breadcrumb tabs. Do NOT apply to single-page forms.

CRITICAL — Form.Navigator AUTO-GENERATES navigation buttons. Create a SEPARATE XContainer (div) for the nav bar — do NOT put data-cb-func=form.navigator on XPage elements. XPage is not a div and the functionality requires HTMLDivElement. Add the container to the first page's elements array.

CRITICAL — Distinguish from XNavigationBar plugin: Use data-cb-func=form.navigator ONLY when the prompt mentions "CodBi Navbar" or "CodBi Navigation". When the prompt mentions "XIMA Navigationsleiste", "XIMA navbar", "FORMCYCLE navbar", "Navigationsleiste", "Progress Bar", "FC-Navbar", or "formcycle navigation bar", use className="XNavigationBar" instead.

## HTML.CSS

Applicable on any element to inject custom CSS text into the page (with optional placeholder replacements).

## HTML.Input.Cleave

Applicable on a XTextField to apply input masking/formatting (credit card, phone, IBAN, date, etc.) via Cleave.js.

## HTML.Input.REGEX

Applicable on a XTextField to validate or reformat the typed value against a regular expression pattern.

## HTML.Panel

Applicable on any element to wrap it in a collapsible accordion/panel widget.

CRITICAL — Panel CSS classes ONLY work on XFieldSet (fieldset), NOT on XContainer or XContainerInvisible. A fieldset has a 'legend' property that becomes the panel header. A container has NO legend — applying a panel CSS class to a container produces a panel WITHOUT a visible title.

For containers (XContainer, XContainerInvisible) that need to be a panel, ALWAYS use data-cb-func=html.panel via the attributes array with data-cb-generateheader="true" and a data-cb-autoheadertitle.

For fieldsets, use the CSS class CodBi_HTML_Panel_Standard instead — the legend provides the title.

ACCORDION BEHAVIOR — When the user asks for multiple collapsible sections where only ONE should be open at a time, create a wrapper XContainer around ALL the panels. Apply data-cb-func="html.panel.accordion" and data-cb-Accordion="<uniqueGroupName>" to the wrapper. Each inner panel gets data-cb-folded — first panel "false", all subsequent "true".

## HTML.SETAttribute

Applicable on any element to dynamically set one or more HTML attributes on it.

## HTML.Text.Injector

Applicable on any element to inject a dynamic text value into a specific property of that element. Set data-cb-replacement to the EP expression AS-IS (do NOT resolve it), data-cb-placeholder to the placeholder string verbatim, data-cb-property="innerHTML". Keep the element's rtevalue unchanged.

## HTML.Text.Mapper

Applicable on any element to map object properties to named placeholders in a text template.

## HTML.Select.Favorites

CRITICAL — When applying this functionality you MUST also add a data-cb-initialElement attribute to the XSelect's attributes array. Set its value to the value property (NOT the display text) of the FIRST option.

## JSON.SET

Applicable on a hidden field to store a JSON-serialized value derived from another element. JSON.SET fallback only on explicit user request.

## LDAP.Autocomplete.Set

Applicable on form fields that should be auto-filled from a selected LDAP directory match.

## LDAP.Autocomplete

Applicable on a text input that should autocomplete entries from an LDAP directory search.

## Matomo.Tracking

Applicable on any form to add Matomo/Piwik analytics event tracking. When the prompt says "Matomo-Tracking aktivieren" or "activate Matomo tracking" without specifying a SiteID, do NOT add Matomo.Tracking functionality via data-cb-func on any element. Instead, include {"id":"Holistic.Matomo.Tracking","targets":[]} in _codbiApplicability.applied — the server reads this and activates the standard configuration.

## Media.Image.Cropper

Applicable on an XUpload field for images; adds an interactive crop dialog before upload.

## MEDIA.INPUT.SPEECH

Applicable on a text input field to enable speech-to-text dictation via the Web Speech API.

## OpenPLZ.Autocomplete

Applicable on every XTextField (input type=text) within a group of related address fields (postal code, locality/city, street, building number).

PREFERRED — apply the OpenPLZ standard-configuration CSS classes instead of data-cb-func:
- CodBi_OpenPLZ_AC_SET_PLZ on the postal code field.
- CodBi_OpenPLZ_AC_SET_Locality on the locality/city field.
- CodBi_OpenPLZ_AC_SET_Street on the street field.
- CodBi_OpenPLZ_AC_SET_BuildingNumber on the building number field.
The server configures OpenPLZ.Autocomplete (TargetData, Country, Dependent, DependentPLZ, DependentLocality, FocusOnAutocomplete) automatically for each class.

FALLBACK (only when the CSS classes cannot be used): tag EACH address field with data-cb-func=openplz.autocomplete and set the parameters individually. For every tagged field: set TargetData to match its type (Localities, PostalCodes, or Streets), set Country. On the STREET field only: set DependentPLZ and DependentLocality. On the POSTAL CODE and LOCALITY fields: set Dependent as the CSS class selector of the corresponding field, set FocusOnAutocomplete to the street field. On the STREET field: set FocusOnAutocomplete to the building number field, if one exists.

CRITICAL — OpenPLZ.Autocomplete must be applied to ALL address fields in EVERY address group, regardless of which plugin/system they come from. Either via the CodBi_OpenPLZ_AC_SET_* CSS classes (preferred) or via data-cb-func with ALL required parameters (Country, TargetData, Dependent, FocusOnAutocomplete) set on each address field.

## Print.Remove

Applicable on any element that should be invisible when the form is printed.

## Sys.Log.Console

Applicable for debugging; logs CodBi runtime data to the browser developer console.

Sys.Log.Console does NOT need an existing form element — it is a standalone functionality. When the user asks to output/print/log/show anything to the browser console (URL content, BayVIS data, CSV, global variables, DOM elements, etc.), you MUST create a NEW XContainerInvisible at the top of the first page's elements array. Set its "name" property (prefix "div"), an "id" property (prefix "xi-log-"), an empty "elements" array, and put data-cb-func and data-cb-Data in the "attributes" array.

## Time.Frame

Applicable ONLY on the BEGIN (minimum) XTextField of type 'time' when there is a second related end time field. The end field is referenced via the 'MaxField' parameter. Do NOT put this functionality on the end time element.

## EP Chaining

Element Placeholders (EPs) can be chained with > syntax to pass one EP's result as input to another EP. This works in ANY data-cb-* parameter that accepts EPs (e.g. data-cb-Data, data-cb-replacement, data-cb-Values, data-cb-replacements). Example: "{ BayVIS.Ansprechpartner.Details > { V > VariableName } }" first resolves V to get an ID, then fetches the contact details. The inner EP is always resolved first and its result becomes the parameter for the outer EP.

CRITICAL — EP parameter values are raw strings without quotes. Write { BayVIS.Ansprechpartner.ID > Salvatore Callari } NOT { BayVIS.Ansprechpartner.ID > "Salvatore Callari" }. Quotes are part of the EP syntax itself (the { } braces), do NOT add extra quotes around parameter values.

## AI DOCUMENT QA

When the user asks to upload a document and answer specific questions about its content, create an XUpload with data-cb-func="ai.llama.standard.qa" and data-cb-MaxPixelSize="180000" in its attributes. Then create one XTextField (or XTextArea for long answers) per question, each with cssclasses=["AI_LLAMA_STANDARD_QA_Question"] and a data-cb-Question attribute.

The data-cb-Question value supports <[.FieldName]> placeholders (with leading dot) that resolve to the runtime value of another field in the same container.

The upload field and all question fields should be inside an XContainer or XFieldSet wrapper. CRITICAL: data-cb-func="ai.llama.standard.qa" goes on the XUpload, NOT on the container or on the question fields.

## AI TEXT QA (ai.llama.standard.txtqa)

When the user asks to show information about a person or entity based on text values entered in input fields, apply data-cb-func="ai.llama.standard.txtqa" on the FIRST source input field. Add data-cb-useinternet="true" if internet search is needed. All other source fields get cssclasses=["AI_LLAMA_TXTQA_Source"]. The response display field gets cssclasses=["AI_LLAMA_STANDARD_TXTQA_Question"] and a data-cb-Question attribute.

The data-cb-Question value MUST include <[.FieldName]> placeholders (with leading dot) for ALL source fields.

CRITICAL — The field with data-cb-func="ai.llama.standard.txtqa" must NOT have the AI_LLAMA_STANDARD_TXTQA_Question CSS class.

ALL form elements created for this functionality MUST be inside an XContainer or XFieldSet wrapper.

## SPECIALIST RULE

When the prompt mentions a specific specialist model (e.g. "Verwende den Spezialisten XYZ" or "use the XYZ specialist") AND an AI functionality (ai.llama.chat, ai.llama.standard.qa, ai.llama.standard.txtqa) is applied, add a data-cb-Specialist attribute to that functionality's element's attributes array with the specialist name as its value.

The complete list of available functionalities with all their parameters is available at:
{{CODBI_FULL_SECTION}}
