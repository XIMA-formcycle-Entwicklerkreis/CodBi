# Whole-Form & Whole-Workflow Test Prompts

End-to-end scenario prompts for the **Form Assistant** (Form Designer → AI Assistant) and the
**Workflow Assistant** (Workflow Editor → AI Assistant). Unlike the single-element cards in
[`form-assistant-test-prompts.md`](form-assistant-test-prompts.md:1), each prompt here describes a
**complete form or workflow** so one prompt exercises many widgets / CodBi functionalities /
element placeholders / workflow triggers and nodes together — including their interaction (page
structure, field references, container nesting, loops, lanes, error handling).

Run each scenario in **German and English** — label/endpoint language is part of the check. Always
observe **both stages**: (1) the details request (`need_form_widget_details` / `need_workflow_node_details`)
and (2) the final JSON after the server supplies the schemas.

---

## 0. Shared test form & environment

Use the shared test form from the testing plan ([`form-assistant-prompt-testing-plan.md`](form-assistant-prompt-testing-plan.md:40)):
several pages, submit button `btnZwolf`, text fields `tfVorname`, `tfNachname`, `tfOrt`, `tfPLZ`,
`tfMail`, `tfAlter`, `tfDatum`, `tfUhrzeit`, textarea `tfNachricht`, select `selStadt`, checkbox
`cbNews`, upload `fdDatei`, repeatable container `divRepeat` (with `tfName`/`tfData`), and a
DataQuery `HolaQuery` configured on the server.

**Global checks for every whole-form scenario:**
- [ ] Details request lists **every** widget and functionality the prompt needs — never invented `className`s (`XText` is wrong, `XTextField` is right).
- [ ] Final JSON is valid and coherent: pages/containers reference element `name`s correctly; no orphan elements; unique `name` + `xi-…` id per element.
- [ ] All `data-cb-func` values and `data-cb-*` parameters are exactly as in [`codbi-core-api-compact.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-api-compact.md:1).
- [ ] CSS-Selector parameters use the target element's `name` with a dot prefix (`.tfDatumEnde`), **never** `#`-IDs. Element `name`s themselves NEVER carry a dot (`tfVorname`, not `.tfVorname`) — only CSS-selector PARAMETERS (e.g. `data-cb-maxfield`, `data-cb-field`) are dot-prefixed.
- [ ] Labels/placeholders in the prompt's language (DE prompt → German labels).

**Global checks for every whole-workflow scenario:**
- [ ] Details request lists every trigger **and** node used (incl. condition/loop/container nodes).
- [ ] Single lane → single JSON object; multiple independent lanes → array of objects; each with `taskName`, `taskDescription`, `triggerType`, `triggerParams`, `nodeType`, `nodeParams`, `endpointState`, `endpointType`.
- [ ] Child nodes inside `_childNodes` for conditions/loops; chain nodes never placed in `_childNodes`.
- [ ] `endpointState` label in the prompt's language (German prompt → `"Empfangen"`, not `"Received"`); `""` for terminal nodes (FC_RETURN / FC_DELETE_FORM_RECORD / FC_QUEUE_TASK).
- [ ] `[%fieldName%]` placeholders in SQL are **unquoted**.

---

## A. Whole-form scenarios (Form Assistant)

### FS01 — Multi-page registration form (core widgets + navigator + date logic)

**Elements covered:** XPage ×3, Form.Navigator, XHeader/XFooter, XTextField, XSelect, XCheckbox,
XAppointment, XButtonList, Date.Min, Date.NoWeekends, Date.Frame, HTML.Panel, HTML.Input.TinyMCE.

**Prompt (DE):**
> Baue aus dem bestehenden Formular ein dreiseitiges Anmeldeformular „Sprachkurs“ um: Seite 1
> „Personendaten“ mit Kopfbereich „Anmeldung“, Vorname, Nachname, ein Datumsfeld „Geburtsdatum“
> (keine Vergangenheitsdaten, keine Wochenenden), das Feld `selStadt` und das Kontrollkästchen
> `cbNews`. Seite 2 „Kurs & Termin“ mit einem Terminfinder „Beratungstermin“, einem Datumsbereich
> „Kursbeginn“/„Kursende“ (Beginn ist Mindestdatum) und einer Trennlinie. Seite 3 „Nachricht“ mit
> dem Textfeld `tfNachricht` als Rich-Text-Editor und den Buttons „Zurück“ und „Senden“. Füge eine
> Fortschrittsanzeige für das mehrseitige Formular und einen Fußbereich ein. Kapsle die
> Kursauswahl auf Seite 2 in ein aufklappbares Panel.

**Prompt (EN):**
> Rebuild the existing form into a three-page registration form "Language course": page 1
> "Personal data" with a header "Registration", first name, last name, a date field "Date of
> birth" (no past dates, no weekends), the `selStadt` select and the `cbNews` checkbox. Page 2
> "Course & appointment" with an appointment finder "Consultation", a date range
> "Course start"/"Course end" (start is the minimum date) and a separator line. Page 3 "Message"
> with the `tfNachricht` textarea as a rich-text editor and "Back" and "Submit" buttons. Add a
> progress indicator for the multi-page form and a footer. Wrap the course selection on page 2 in
> a collapsible panel.

**Verify:**
- [ ] 3 XPage elements + Form.Navigator on the 2+-page form (NOT on a single page); XHeader/XFooter present. Navigator container placed in XHeader/XFooter or on EVERY page — never only one page.
- [ ] Birth-date field `Geburtsdatum` (`tfDatum`): block FUTURE dates via `CodBi_NoFutureDate`; **NO** `Date.NoWeekends` and **NO** future `Date.Min` (heute/morgen) — a birth date lies in the past, so "keine Vergangenheitsdaten" is contradictory for it, and it may fall on a weekend. `Date.Min` on a birth date is valid ONLY as a PAST minimum (e.g. "at least 18 years old" → `Minimum=18, Unit=y`, no `Reverse`).
- [ ] Course date range: `CodBi_DateFrame_1_Begin` on `Kursbeginn` AND `CodBi_DateFrame_1_End` on `Kursende` (BOTH fields; no invented `…_Begin_End` class; never on a container). (Alternative: `data-cb-func=date.frame` on the BEGIN field only with `MaxField` → `.`+end-field-name.) Optional future `Date.Min` (`Reverse=true`) on `Kursbeginn` is CORRECT when the user answered the AI's clarification question about the minimum (e.g. "morgen" → `Minimum=1, Unit=d, Reverse=true`); flag it only if it was applied without any user answer.
- [ ] XAppointment with `appointmentPlan`; XButtonList with `action.page = "previous"/"submit"`; XLine; XTextArea `tfNachricht` with `data-cb-func="HTML.Input.TinyMCE"` + **both** Plugins **and** Toolbar (message toolbar WITHOUT the raw-HTML `code` option); XSelect `selStadt` with a NON-EMPTY options list (the AI must ask for the options when not given).
- [ ] Collapsible panel on the course-selection group: `CodBi_HTML_Panel_Standard` on the XFieldSet (preferred — the legend is the title) — OR `data-cb-func="HTML.Panel"` + header attrs on a plain XContainer.
- [ ] `CodBi_People_Name` on `Vorname` AND `Nachname`; element `name`s have NO dot (`tfVorname`); only CSS-selector parameters (MaxField/Field/…) use a dot prefix (`.tfVorname`); no invented classes.

**Known trap — „keine Vergangenheitsdaten, keine Wochenenden“ on `Geburtsdatum` (2026-08-17):**
Both date constraints in the prompt are **contradictory** for the birth-date field: a birth date
necessarily lies in the past ("no past dates" / Mindestdatum heute/morgen cannot apply), and it may
fall on a weekend ("no weekends" cannot apply either — people are born on weekends). The AI must NOT
group `Geburtsdatum` together with `Kursbeginn` and ask „Soll das Mindestdatum heute oder morgen
sein?“ — that question is only valid for `Kursbeginn`. Correct handling:
- `Geburtsdatum` → **no future dates**: `CodBi_NoFutureDate` (max = today); **no** `Date.NoWeekends`. `Date.Min` is legitimate ONLY as a PAST minimum (e.g. age ≥ 18 → `Minimum=18, Unit=y`, no `Reverse`); the future-minimum form (`Reverse=true`, heute/morgen) is invalid for a birth date. FS01 requests no age limit, so no `Date.Min` is applied here.
- `Kursbeginn` → future minimum (if requested): `Date.Min` with `Reverse=true` (Minimum=1, Unit=d = tomorrow); `Date.Frame` `MaxField` → `.`+end-field-name makes it the range minimum.
- `Kursende` → end of the `Date.Frame` only; never its own `Date.Min`/`Date.Max`/`Date.Frame`.
If the AI asks for a future minimum or a weekday restriction for the birth-date field, answer:
„Geburtsdatum muss in der Vergangenheit liegen und darf auch auf ein Wochenende fallen — wende nur
`CodBi_NoFutureDate` (max. heute) an; ein `Date.Min` wäre nur als Vergangenheits-Minimum (z. B.
Mindestalter 18 Jahre, `Minimum=18, Unit=y`) gültig; für `Kursbeginn` gelte `morgen` als
Mindestdatum.“

**Verification prompt to copy (DE):** Prüfe das aktuelle Formular anhand der `Verify:`-Checkliste von FS01 oben (inkl. der „Known trap“-Hinweise). Bewerte jeden Punkt als `✅ PASS` oder `❌ FAIL`; nenne bei jedem Fehlschlag das Erwartete und das tatsächlich Erzeugte; biete an, die Fehler sofort zu korrigieren. Erfinde keine Ergebnisse — prüfe die tatsächlichen Elemente, `className`, Attribute und `data-cb-*`-Werte.

**Verification prompt to copy (EN):** Check the current form against the FS01 `Verify:` checklist above (including the "Known trap" notes). Mark each item `✅ PASS` / `❌ FAIL`; for each failure state the expected vs. the actually generated value; offer to fix them right away. Don't invent results — inspect the actual elements, `className`, attributes and `data-cb-*` values.

### FS02 — Citizen-service application with ELSTER/BundID + address autofill (Bürgerservice switch ON)

**Elements covered:** XFieldSet, XBsLogin, XSignature, CodBi_OpenPLZ_AC_SET_*, CodBi_LDAP_AC_*,
XUpload + Media.Image.Cropper, XCaptcha, HTML.SETAttribute, Print.Remove, Sys.Log.Console EP.

> **Run with the Bürgerservice switch ON** — canonical field IDs are then enforced (see C07/C09 in
> [`form-assistant-test-prompts.md`](form-assistant-test-prompts.md:174)).

**Prompt (DE):**
> Erstelle im Formular ein Feldset „Bürgerkonto-Daten“ (`fsBKDaten`) mit den Stammdaten Vorname,
> Nachname, Geburtsdatum, Geburtsort, PLZ, Ort, E-Mail und Telefon. Darunter ein Feldset
> `fsBKOrgDaten` für den ELSTER-Organisationslogin mit den nötigen Stammdaten. Ergänze einen
> BundID-Login-Button, ein Signaturfeld „Unterschrift“ und ein Upload-Feld für den Personalausweis
> mit Bild-Cropper und Captcha-Schutz. Die Adressfelder sollen eine Autovervollständigung aus dem
> LDAP-Verzeichnis erhalten; PLZ/Ort/Straße/Hausnummer sollen sich mit deutscher
> Autovervollständigung befüllen. Das Feld „Geburtsort“ soll beim Drucken ausgeblendet werden, und
> dem Feld „E-Mail“ einen Tooltip „Pflichtfeld“ setzen. Logge zusätzlich den KI-Text zu „Wie wird
> das Wetter morgen?“ in die Konsole.

**Prompt (EN):**
> Create a fieldset "Citizen account data" (`fsBKDaten`) in the form with the master data first
> name, last name, date of birth, place of birth, ZIP code, city, e-mail and phone. Below it a
> fieldset `fsBKOrgDaten` for the ELSTER organisation login with the required master data. Add a
> BundID login button, a signature field "Signature" and an upload field for the ID card with an
> image cropper and CAPTCHA protection. The address fields should get autocomplete from the LDAP
> directory; ZIP/city/street/house number should autofill with German autocomplete. The "Place of
> birth" field should be hidden when printing, and the "E-mail" field gets a tooltip "Required
> field". Additionally log the AI text for "How will the weather be tomorrow?" to the console.
**Verify:**
- [ ] `fsBKDaten` fieldset with the canonical IDs (`tfAntragstellerVorname`, `tfAntragstellerName`, `tfAntragstellerGeburtsdatum`, `tfAntragstellerGeburtsort`, `tfAntragstellerPLZ`, `tfAntragstellerOrt`, `tfAntragstellerEmail`, `tfAntragstellerTelefon`); `fsBKOrgDaten` with ELSTER-only fields (`tfOrgName`, `tfOrgRegisterart`, `selOrgPersTyp`, `BPK2`, `TrustLevel`, …).
- [ ] XBsLogin with `bs_auth_ref`; XSignature; XUpload with `data-cb-func="Media.Image.Cropper"`; XCaptcha.
- [ ] `CodBi_OpenPLZ_AC_SET_PLZ/Locality/Street/BuildingNumber` on the right fields; `CodBi_LDAP_AC_*` where LDAP was requested.
- [ ] `data-cb-func="Print.Remove"` on the birth-place field; `HTML.SETAttribute` (Name `title`, ToSet `Pflichtfeld`) on `tfAntragstellerEmail`.
- [ ] Invisible XSpan with `data-cb-Data="SYS.Log.Console > AI.LLAMA.STD.QA > Wie wird das Wetter morgen?; true;;;;;;"`.

**Verification prompt to copy (DE):** Prüfe das aktuelle Formular anhand der obigen `Verify:`-Checkliste von FS02. Bewerte jeden Punkt als `✅ PASS` oder `❌ FAIL`; nenne bei jedem Fehlschlag das Erwartete und das tatsächlich Erzeugte; biete an, die Fehler sofort zu korrigieren. Erfinde keine Ergebnisse — prüfe die tatsächlichen Elemente, `className`, Attribute und `data-cb-*`-Werte.
d
### FS03 — Feedback form with AI chat, OCR and data-table (AI + media + DQ)

**Elements covered:** AI.LLAMA.CHAT + sub-classes, AI.OCR, XTextArea + TinyMCE, HTML.Input.REGEX,
JSON.SET, DQ.Table.View, Matomo.Tracking, HTML.CSS, XRating, XMap.

**Prompt (DE):**
> Erweitere das Formular um ein Feedback-Formular: ein Feld „Kundennummer“ mit Maskierung, die nur
> die Zeichen a–z erlaubt, und ein Bewertungsfeld mit 5 Sternen. Bette einen KI-Chat in einen neuen
> Container „KI-Assistent“ ein. Aus dem Upload-Feld `fdDatei` soll per OCR der Text extrahiert und
> in ein neues Feld `tfExtractedText` geschrieben werden. Das Feld `tfNachricht` bleibt ein
> Rich-Text-Editor. Füge ein verstecktes Feld hinzu, das das JSON aus `tfVorname`/`tfNachname`
> speichert, und eine Tabelle, die die Spalten Alter, Name und Details der Abfrage `HolaQuery`
> anzeigt (Details als JSON, Details nicht exportieren, mit Excel-Export). Aktiviere Matomo-Tracking
> für das Formular, füge eigenes CSS für rote Überschriften ein und plaziere eine interaktive Karte.

**Prompt (EN):**
> Extend the form into a feedback form: a "Customer number" field with masking that only allows the
> characters a–z, and a 5-star rating field. Embed an AI chat into a new container "AI assistant".
> The upload field `fdDatei` should have its text extracted via OCR into a new field
> `tfExtractedText`. The `tfNachricht` field stays a rich-text editor. Add a hidden field that
> stores the JSON from `tfVorname`/`tfNachname`, and a table showing the columns Age, Name and
> Details of the `HolaQuery` query (Details as JSON, Details not exported, with Excel export).
> Enable Matomo tracking for the form, add custom CSS for red headings and place an interactive map.

**Verify:**
- [ ] AI.LLAMA.CHAT: one XContainer wrapper (fullwidth="1") containing the chat display XTextArea (`data-cb-func="ai.llama.chat"`, readonly, autosize, `data-cb-MaxPixelSize="360000"`, `data-cb-maxchatwindowheight="1200"`) PLUS the `AI_LLAMA_CHAT_*` sub-elements: Input (XTextArea), Send (XButtonList, 1 button), Stop (separate XButtonList, 1 button), Upload (XUpload, `fileextension="image/*,.pdf"`), Thinking/Internet/Location/AlertOnFinish checkboxes, Mail container (MailForward XCheckbox + MailAddress XTextField). A bare/empty XContainer is a FAIL.
- [ ] AI.OCR on `fdDatei`: `data-cb-func="AI.OCR"` with `data-cb-field=".tfExtractedText"` (dot-prefixed class selector on the target's name) AND `Mode` (default "print"); the receiver field `tfExtractedText` exists.
- [ ] XRating (5 stars): an XRating element whose `options` array has exactly 5 entries (e.g. 5 star icons). HTML.Input.REGEX on the **Kundennummer** field (NOT on the rating): `data-cb-keyexpression="[^a-z]"`, `data-cb-expression="^[^a-z]*$"` when blocking — or the allow-list form `data-cb-keyexpression="[a-z]"`, `data-cb-expression="^[a-z]*$"` matching the requested rule. (The regex belongs on the masked text field, never on the rating widget.)
- [ ] Hidden field with `data-cb-func="JSON.SET"` (invisible) + the derivation parameters (`data-cb-property`/`data-cb-toset` or expression) combining `tfVorname`/`tfNachname` into JSON. A hidden field WITHOUT `data-cb-func="JSON.SET"` is a FAIL.
- [ ] DQ.Table.View: `data-cb-dataquery="HolaQuery"`; `data-cb-columns` in `label;datacolumn;jsonFlag[;width]` CSV form, e.g. `Alter;Alter,Name;Name,Details;Details;true` — NOT a plain comma list. "Details als JSON" ⇒ `Details;Details;true` (3rd flag true); "Details nicht exportieren" ⇒ `data-cb-excludecolumns="Details"`; "Excel-Export" ⇒ the export is actually reachable (`data-cb-exportbutton` set to an existing button selector, or a rendered export control) — a bare `DQ.Table.View` without any export trigger that still claims Excel export is a FAIL.
- [ ] Matomo: since the request says "Aktiviere Matomo-Tracking für das Formular" WITHOUT a SiteID, expect `{"id":"Holistic.Matomo.Tracking","targets":[]}` in `_codbiApplicability.applied` (server uses the `Matomo_SiteID`/`Matomo_URL` config) — NOT a `data-cb-func="MATOMO.TRACKING"` element and NO URL question. Plus HTML.CSS with the CSS text (`h1 {color:red;}`), and XMap (Leaflet) for the interactive map.

**Known trap — AI.LLAMA.CHAT sub-elements & hidden JSON field are MANDATORY (2026-08-19):**
The AI.LLAMA.CHAT widget must include the Upload `fileextension="image/*,.pdf"` and the Mail container (MailForward checkbox + MailAddress field) in EVERY run — omitting them is a FAIL even when the rest of the chat is present. The JSON.SET hidden field must be `invisible="1"` AND carry its derivation params (`data-cb-path` naming the source fields from the request + `data-cb-property`/`data-cb-toset`); a JSON.SET field left visible or without derivation is a FAIL.

**Known trap — clarification must NOT ask for existing fields / technical IDs (2026-08-19):**
The clarification round must never ask "Existieren die Felder … bereits?" / "do the fields … already exist?" (existing elements are always provided in the form data — `tfVorname`/`tfNachname`/`fdDatei`/`tfNachricht` exist in the shared test form and must be REUSED), and never ask "Wie soll das technische Feld-ID heißen?" / for a field's technical name. New elements get auto-generated `name`s (e.g. a "Kundennummer" masked field → `tfKundenummer`, the JSON hidden field → e.g. `tfVornameNachnameJSON`). Placements default to the current page's main container; DB column identifiers are never confirmed with the user. The ONLY location question that is acceptable is the interactive map's start location/coordinates when the request does not name one (e.g. "Ansbach") — a provider (OpenStreetMap) and the star count (5) are decided automatically. The AI also must NOT place a placeholder span for the AI chat, must keep the chat wrapper `fullwidth="1"`, must give an XRating for "5 Sterne" an `options` array of exactly 5 entries, and must emit a `data-cb-func="HTML.CSS"` element with `data-cb-css="h1 {color:red;}"` for the red headings instead of applying an invented CSS class.

**Verification prompt to copy (DE):** Prüfe das aktuelle Formular anhand der obigen `Verify:`-Checkliste von FS03. Bewerte jeden Punkt als `✅ PASS` oder `❌ FAIL`; nenne bei jedem Fehlschlag das Erwartete und das tatsächlich Erzeugte; biete an, die Fehler sofort zu korrigieren. Erfinde keine Ergebnisse — prüfe die tatsächlichen Elemente, `className`, Attribute und `data-cb-*`-Werte.

**Verification prompt to copy (EN):** Check the current form against the FS03 `Verify:` checklist above. Mark each item `✅ PASS` / `❌ FAIL`; for each failure state the expected vs. the actually generated value; offer to fix them right away. Don't invent results — inspect the actual elements, `className`, attributes and `data-cb-*` values.

### FS04 — Event booking with appointment finder, time frame and panels

**Elements covered:** XAppointment, XFieldSet + CodBi_HTML_Panel_Standard, CodBi_Accordion_*,
Time.Frame, XNavigationBar (NOT Form.Navigator), XLanguageSwich, XFormula, XSpacer.

**Prompt (DE):**
> Erstelle eine Event-Anmeldung: ein Feldset „Veranstaltung“ als Standard-Panel mit der Überschrift
> „Anmeldung“, ein Terminfinder „Wunschtermin“, ein Zeitbereich „Beginn“/„Ende“ welches sich bis zu 3 mal wiederholen darf. Darunter ein berechnetes, schreibgeschütztes Feld „Gesamtpreis“.
> Jede Wiedeholung des Panels "Anemldung" soll dort mit einem Preis von 11,25€ mit eingerechnet werden. Der Standardwert dess Feldes ist also 11,50€. Die € sind die Einheit des Feldes. Ordne drei weitere
> Inhaltsgruppen als Akkordeon mit drei Panels an. Füge eine Navigations-/Fortschrittsleiste
> (Formcycle-Navbar), einen Sprachumschalter und einen Abstand ein.

**Prompt (EN):**
> Create an event registration: a fieldset "Event" as a standard panel titled "Registration", an
> appointment finder "Preferred date", a time range "Start"/"End" (start is the minimum time) and a
> read-only computed field "Total price". Arrange three further content groups as an accordion with
> three panels. Add a navigation/progress bar (Formcycle navbar), a language switcher and a spacer.

**Verify:**
- [ ] XFieldSet with `legend="Anmeldung"` + class `CodBi_HTML_Panel_Standard` (NOT `data-cb-func="HTML.Panel"` on a container); accordion = `CodBi_Accordion_A` (ONE single letter, NEVER the invented `CodBi_Accordion_A_B_C_D`) on the CONTAINER wrapping the three groups, with EACH of the three group XFieldSets ALSO carrying a panel type class `CodBi_HTML_Panel_Standard` — the panels themselves must have a panel class; the container is NOT a panel and gets NO panel type class.
- [ ] Time.Frame on the BEGIN time field only with `MaxField` → end field (no Date.Frame).
- [ ] XAppointment with `appointmentPlan`; XFormula read-only (read-only = never `readonlyif`, XFormula is inherently locked); XNavigationBar (NOT Form.Navigator); XLanguageSwich; XSpacer.
- [ ] Panel/accordion headers carry the requested German titles.
- [ ] **Gesamtpreis XFormula** counts the repeated "Anmeldung"/time-range container CORRECTLY: `xformula_value` derives the repetition count from a field that lives INSIDE the repeated container via a jQuery `data-org-name` selector — e.g. `11.5 + 11.25 * ($('[data-org-name=<tfBeginn>]').length - 1)` (11.50 € base, +11.25 € per ADDITIONAL repetition). The unit is set via `xformula_unit` (e.g. "€", `xformula_align="s"`). **FAIL if the formula references a nonexistent `..._count` variable (e.g. `coZeitbereich_count`) instead of a real `data-org-name` selector** — that variable does not exist in the form.

**Known trap — „coZeitbereich_count“ does not exist (2026-08-21):**
For a price that scales with the number of reps of a repeatable (dynamic) container, the AI must NOT
generate `11.5 + 11.25 * (coZeitbereich_count - 1)` — `coZeitbereich_count` is invented and never
exists in the form. XFormula's `[%field%]` placeholder returns only the FIRST row of a repeated
container, so it cannot count rows either. The CORRECT way to count the repetitions is a jQuery
selector over the container member's un-mangled name: `$('[data-org-name=<fieldInsideContainer>]').length`
(pick `<fieldInsideContainer>` = the `properties.name` of an element inside the repeated container,
e.g. the "Beginn" time field `tfBeginn`). So the total price is
`11.5 + 11.25 * ($('[data-org-name=tfBeginn]').length - 1)`. `xformula_value` is full JavaScript, so
the arithmetic (and any `if`/`return`) goes straight into it; the "€" unit goes into `xformula_unit`
(`xformula_align="s"`). See the XFormula section of
[`formcycle-widgets.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/prompts/formcycle-widgets.md:271).

**Known trap — „CodBi_Accordion_A_B_C_D“ does not exist; accordion members need a panel class (2026-08-21):**
The ONLY accordion classes are `CodBi_Accordion_A`, `CodBi_Accordion_B`, `CodBi_Accordion_C` and
`CodBi_Accordion_D` — the combined name `CodBi_Accordion_A_B_C_D` is a markdown section heading, NOT
a real class, and must NEVER be applied (the AI has misread it as a class and put
`CodBi_HTML_Panel_Standard CodBi_Accordion_A_B_C_D` on the wrapping container while leaving the
panels without any class). Per the tsdocs (UI.Panels / HTML.Panel.Accordion): `CodBi_Accordion_A..D`
goes on the CONTAINER wrapping the collapsible sections (HTML.Panel.Accordion joins the
`.CodBi.--HTML_Panel` descendants INSIDE the tagged container into an accordion set — the container
itself is NOT a panel and gets NO panel type class), and EVERY member XFieldSet INSIDE the container
ALSO needs a panel type class (`CodBi_HTML_Panel_Standard`/`Flat`/`Index`/`Minimal`) to be
collapsible. A FAIL is: container = `CodBi_HTML_Panel_Standard CodBi_Accordion_A_B_C_D` with the
three panels carrying no panel class at all. Correct: container = `CodBi_Accordion_A`, each of the
three panels = `CodBi_HTML_Panel_Standard` (with the requested German titles as legend/panel titles).
The server does NOT add panel classes automatically anymore — the AI itself MUST emit
`CodBi_HTML_Panel_Standard` on EVERY panel fieldset (the three accordion members AND the standalone
`fsVeranstaltung` fieldset that the prompt wants as "Standard-Panel") and MUST NOT put any
`CodBi_HTML_Panel_*` class on the accordion container.

**Verification prompt to copy (DE):** Prüfe das aktuelle Formular anhand der obigen `Verify:`-Checkliste von FS04. Bewerte jeden Punkt als `✅ PASS` oder `❌ FAIL`; nenne bei jedem Fehlschlag das Erwartete und das tatsächlich Erzeugte; biete an, die Fehler sofort zu korrigieren. Erfinde keine Ergebnisse — prüfe die tatsächlichen Elemente, `className`, Attribute und `data-cb-*`-Werte.

**Verification prompt to copy (EN):** Check the current form against the FS04 `Verify:` checklist above. Mark each item `✅ PASS` / `❌ FAIL`; for each failure state the expected vs. the actually generated value; offer to fix them right away. Don't invent results — inspect the actual elements, `className`, attributes and `data-cb-*` values.

### FS05 — Data / research form (element-placeholder heavy)

**Elements covered:** EPs — AI.LLAMA.STD.QA, OpenPLZ.Localities, OpenPLZ.Streets, OpenPLZ.TextSearch,
OpenPLZ.OrganizationalUnits, Data.CSV, Data.Join, Date.FromString, Date.Holidays, DOM.Query, F, I,
JSON.Path, LDAP.Find, Net.URL, Sorted, Unique, V.

**Prompt (DE):**
> Baue ein Recherche-Formular: Ein Textfeld „Ortsvorschläge“, das alle Orte auflistet, die mit
> „An“ beginnen (DE), ein Feld „Straßen in 91522“, ein Feld „Volltextsuche 91522 Karolinen“, ein
> Feld „Kantone der Schweiz“, ein Feld „Wetter-KI“ mit der KI-Antwort zu „Wie wird das Wetter
> morgen?“, ein Feld „CSV → Array“, ein Feld „Zwei Objekte zusammenführen“, ein Feld „String in
> Datum“, ein Feld „Feiertage 2026“, ein Feld „DOM .p1 abfragen“, ein Feld „Filter postalCode ==
> 91522“, ein Feld „erstes Element des Arrays“, ein Feld „name extrahieren“, ein Feld „LDAP
> sn=Callari“, ein Feld „URL-Inhalt laden“, ein Feld „Ortsnamen sortieren und deduplizieren“ und
> ein Feld „globale Variable USGrade“. Logge alle Ergebnisse in die Konsole.

**Prompt (EN):**
> Build a research form: a "City suggestions" field listing all localities starting with "An" (DE),
> a "Streets in 91522" field, a "Full-text search 91522 Karolinen" field, a "Swiss cantons" field,
> an "AI weather" field with the AI answer to "How will the weather be tomorrow?", a "CSV → array"
> field, a "Merge two objects" field, a "String to date" field, a "Holidays 2026" field, a
> "Query DOM .p1" field, a "Filter postalCode == 91522" field, a "First array element" field, an
> "Extract name" field, a "LDAP sn=Callari" field, a "Load URL content" field, a "Sort and
> deduplicate city names" field and a "Global variable USGrade" field. Log all results to the
> console.

**Verify:**
- [ ] Every EP id verbatim, correct param order and trailing `;`: `{ OpenPLZ.Localities > de ; ^An }`, `{ OpenPLZ.Streets > ; .* ; 91522 }`, `{ OpenPLZ.TextSearch > de ; 91522 Karolinen }`, `{ OpenPLZ > ch ; Cantons }`, `{ AI.LLAMA.STD.QA > Wie wird das Wetter morgen?; true;;;;;; }`, `{ Data.CSV > … }`, `{ Data.Join > … }`, `{ Date.FromString > … }`, `{ Date.Holidays > 2026 }`, `{ DOM.Query > .p1 }`, `{ F > postalCode ; 91522 ; … }` (F outermost), `{ I > 0 ; … }`, `{ JSON.Path > … ; name }`, `{ LDAP.Find > AND ; sn=Callari }`, `{ Net.URL > <url> }`, `{ Sorted > { JSON.Path > … ; name } }` + `Unique`, `{ V > USGrade }`.
- [ ] EPs placed via Sys.Log.Console data or field default values; no invented EP ids. The OpenPLZ LIST fields ('Ortsvorschläge', 'Straßen in 91522', 'Kantone der Schweiz') are XSelects with `data-cb-func="html.select.injection"` and the EP in `data-cb-Values` (e.g. `data-cb-Values="{ OpenPLZ.Localities > de ; ^An }"`, + `data-cb-ValueProperty="name"`) — NEVER `data-cb-Data`.
- [ ] Regex params are regexes (`^An`).

**Known trap — OpenPLZ lookup fields must NOT ask for options (2026-08-21):**
The AI has asked „Bitte nennen Sie die gewünschten Straßen als Optionen für das Feld ‚Straßen in
91522‘.“ — WRONG. A field whose content is a geographic lookup ('Ortsvorschläge', 'Straßen in
<PLZ>', 'Volltextsuche <PLZ> <Ort>', 'Kantone der Schweiz') is NOT a user-options select: the list
is supplied at RUNTIME by the OpenPLZ element placeholders, so the AI must build the field and wire
the EP as its value — `{ OpenPLZ.Streets > ; .* ; 91522 }`, `{ OpenPLZ.Localities > de ; ^An }`,
`{ OpenPLZ.TextSearch > de ; 91522 Karolinen }`, `{ OpenPLZ > ch ; Cantons }` — and NEVER ask the
user for street/locality options. The XSelect-options clarification rule applies ONLY to genuinely
user-provided option lists (e.g. a 'Stadt' dropdown with no EP supplying the data).

**Known trap — Ortsvorschläge must use HTML.Select.Injection with data-cb-Values, not data-cb-Data (2026-08-21):**
The AI generated the 'Ortsvorschläge' field with the wrong functionality/attribute. The correct
widget for a list fed by an element placeholder is an XSelect with
`data-cb-func="html.select.injection"` and the EP in `data-cb-Values` — e.g.
`data-cb-Values="{ OpenPLZ.Localities > de ; ^An }"`. CRITICAL — OpenPLZ.Localities returns OBJECTS
`{postalCode, name, district, federalState, municipality, ...}` with `postalCode` as the FIRST
string, so you MUST ALSO set `data-cb-ValueProperty="name"` AND `data-cb-TextProperty="name"` —
otherwise the option shows the postal code instead of the city name (the AI did exactly that:
'orts-vorschlaege' showed the PLZ). NEVER put the EP in `data-cb-Data` (that attribute belongs to
Sys.Log.Console / HTML.Text.Injector). Applies to all OpenPLZ list fields: 'Straßen in <PLZ>' →
`{ OpenPLZ.Streets > ; .* ; 91522 }` + `data-cb-ValueProperty="name"`, 'Kantone der Schweiz' →
`{ OpenPLZ > ch ; Cantons }` + `data-cb-ValueProperty="name"`. CRITICAL — OpenPLZ.Streets ALWAYS takes
THREE parameters (country [empty → "de"], street-name regex [use `.*` for "any street"], postal-code /
city regex) — NEVER the two-parameter `{ OpenPLZ.Streets > de ; 91522 }` form, because the postal
code would land in the street-name slot and the search fails. CRITICAL — the XSelect's manually-set
Formcycle `options` array MUST be empty ([]) by default: manually entered options render at the
BEGINNING of the select, before the EP-injected options (html.select.injection appends), so they
would appear as unwanted leading entries; only add specific `options` when the user explicitly asked
for leading options.

**Known trap — EP output fields: NO clarification for input data / format / country / URL / LDAP params / widget type (2026-08-21):**
The AI has asked for example input data (CSV → Array, Zwei Objekte zusammenführen, String in
Datum, erstes Element des Arrays, name extrahieren, Ortsnamen sortieren/deduplizieren), for a
country/region (Feiertage 2026), for a URL (URL-Inhalt laden), for LDAP search parameters / base-DN
(LDAP sn=Callari), and whether the result fields shall be read-only — ALL WRONG. Every
'Recherche'-field is an EP OUTPUT field: build it with SENSIBLE EXAMPLE parameters derived from the
request / sensible defaults — `{ Data.CSV > <Beispiel-CSV> }`, `{ Data.Join > … }`,
`{ Date.FromString > 01.12.1978 }`, `{ Date.Holidays > 2026 }` (default country), `{ Net.URL > <Beispiel-URL> }`,
`{ LDAP.Find > AND ; sn=Callari }`, `{ I > 0 ; … }`, `{ JSON.Path > … ; name }`,
`{ Sorted > { JSON.Path > … ; name } }` + `Unique` — and WIRE each EP as its field's value so the
field displays the result: the OpenPLZ list fields ('Ortsvorschläge', 'Straßen in 91522', 'Kantone
der Schweiz') as XSelects with `data-cb-func="html.select.injection"` + the EP in `data-cb-Values`
(+ `data-cb-ValueProperty`/`data-cb-TextProperty="name"`), the other EP output fields DISPLAY their EP
result by setting the field's value via a FUNCTIONALITY — `data-cb-func="JSON.SET"` +
`data-cb-property="value"` + `data-cb-toset="{ <EP with example params> }"` (assigned directly to the
value). To show the EP result as PLAIN TEXT, use an XSpan (the plain-text element — NEVER XText) with
`data-cb-func="HTML.Text.Injector"` + `data-cb-property="innerHTML"` +
`data-cb-replacement="{ <EP with example params> }"` and write the placeholder
`[[INJECTOR_REPLACEMENT]]` literally into the XSpan's text content (rtevalue) — Injector REPLACES
that placeholder with the resolved EP; it does not set/append on its own; without the placeholder in
the content nothing is injected; it is NOT for XTextField/XTextArea, rendered read-only
(display-only = non-editable, NOT unwired). NEVER
a bare `data-cb-Data` attribute — without a `data-cb-func` it does nothing.
When the user asks to log the results, ONE invisible XSpan with Sys.Log.Console logs the EP outputs
(`data-cb-Data="SYS.Log.Console > { <EP with example params> } ; ..."`) — it never replaces wiring
the fields and never uses a `[%field%]` placeholder as the parameter of the EP that produces that same field (`[%fieldName%]` placeholders ARE resolved to the referenced field's value at runtime, so they may feed another EXISTING field's value into a parameter — but only fields that actually exist in the form; an invented name resolves to empty). NEVER ask for the input
data/format, the country/region, the URL, an LDAP base-DN / extra LDAP parameters, or the widget
type — the XSelect-options / mandatory-values clarification rules apply ONLY to genuinely
user-supplied values, not to EP-derived demo fields.

**Verification prompt to copy (DE):** Prüfe das aktuelle Formular anhand der obigen `Verify:`-Checkliste von FS05. Bewerte jeden Punkt als `✅ PASS` oder `❌ FAIL`; nenne bei jedem Fehlschlag das Erwartete und das tatsächlich Erzeugte; biete an, die Fehler sofort zu korrigieren. Erfinde keine Ergebnisse — prüfe die tatsächlichen Elemente, `className`, Attribute und `data-cb-*`-Werte.

**Verification prompt to copy (EN):** Check the current form against the FS05 `Verify:` checklist above. Mark each item `✅ PASS` / `❌ FAIL`; for each failure state the expected vs. the actually generated value; offer to fix them right away. Don't invent results — inspect the actual elements, `className`, attributes and `data-cb-*` values.

### FS06 — Payment / order form (XOrderItem + Cleave + REGEX)

**Elements covered:** XOrderItem, XOrderButton, HTML.Input.Cleave, HTML.Input.REGEX, HTML.SETAttribute,
CodBi_Currency, XFieldSet panel, XLine, XSpacer.

**Prompt (DE):**
> Baue ein Bezahlformular: Bestellartikel „Parkausweis“ (30 €, 19 % MwSt) und „Zweitausweis“
> (10 €) samt Bestell-Button, ein Euro-Geldbetragsfeld „Kaufpreis“, ein Kreditkartenfeld mit
> Maskierung, ein Sicherheitscode-Feld, das nur 3 Ziffern zulässt, und ein Feld „Kartennummer“,
> dessen Titel „Pflichtfeld“ ist. Ordne alles in einem Feldset „Zahlung“ mit einer Trennlinie und
> einem Abstand an.

**Prompt (EN):**
> Build a payment form: order items "Parking permit" (€30, 19% VAT) and "Second ID card" (€10)
> with an order button, a euro money field "Purchase price", a credit-card field with masking, a
> security-code field that only allows 3 digits, and a "Card number" field whose title is "Required
> field". Arrange everything in a "Payment" fieldset with a separator line and a spacer.

**Verify:**
- [ ] XOrderItem with `xorderitem_price`/`xorderitem_tax`/`xorderitem_description` + XOrderButton.
- [ ] `CodBi_Currency` (EUR) on the price field; HTML.Input.Cleave with the card mask; HTML.Input.REGEX (`^[0-9]{3}$` style) on the security code; HTML.SETAttribute (Name `title`, ToSet `Pflichtfeld`).
- [ ] XFieldSet "Zahlung" + `CodBi_HTML_Panel_Standard` (if panel requested), XLine, XSpacer.

**Verification prompt to copy (DE):** Prüfe das aktuelle Formular anhand der obigen `Verify:`-Checkliste von FS06. Bewerte jeden Punkt als `✅ PASS` oder `❌ FAIL`; nenne bei jedem Fehlschlag das Erwartete und das tatsächlich Erzeugte; biete an, die Fehler sofort zu korrigieren. Erfinde keine Ergebnisse — prüfe die tatsächlichen Elemente, `className`, Attribute und `data-cb-*`-Werte.

**Verification prompt to copy (EN):** Check the current form against the FS06 `Verify:` checklist above. Mark each item `✅ PASS` / `❌ FAIL`; for each failure state the expected vs. the actually generated value; offer to fix them right away. Don't invent results — inspect the actual elements, `className`, attributes and `data-cb-*` values.

### FS07 — Multi-language form with hidden container and console logging

**Elements covered:** XLanguageSwich, XNavigationBar, XContainerInvisible, JSON.SET, Sys.Log.Console,
HTML.Text.Injector, HTML.Text.Mapper, XCheckbox, XDatalistAdvanced, XTextfieldAdvanced.

**Prompt (DE):**
> Erstelle ein mehrsprachiges Formular: einen Sprachumschalter, eine Formcycle-Navbar, einen
> unsichtbaren Container mit zwei versteckten JSON-Feldern, ein filterbares Auswahlfeld „Stadt“
> (Datalist) und ein filterbares Textfeld „Kunde“. Injiziere den Text „hallo“ in die CSS-Klasse des
> Feldes `tfVorname` und mappe Objekt-Eigenschaften in ein Text-Template im Feld `tfNachricht`.
> Logge den Wert von `tfMail` in die Konsole.

**Prompt (EN):**
> Create a multi-language form: a language switcher, a Formcycle navbar, an invisible container
> with two hidden JSON fields, a filterable select field "City" (datalist) and a filterable text
> field "Customer". Inject the text "hello" into the CSS class of the `tfVorname` field and map
> object properties into a text template in the `tfNachricht` field. Log the value of `tfMail` to
> the console.

**Verify:**
- [ ] XLanguageSwich; XNavigationBar; XContainerInvisible holding the two JSON.SET hidden fields.
- [ ] XDatalistAdvanced + XTextfieldAdvanced (DS widgets).
- [ ] HTML.Text.Injector (Placeholder/Property/Replacement) on `tfVorname`; HTML.Text.Mapper (Property + Replacements) on `tfNachricht`.
- [ ] Invisible XSpan with `data-cb-Data="SYS.Log.Console > { V > tfMail }"` (or equivalent reference).  

**Verification prompt to copy (DE):** Prüfe das aktuelle Formular anhand der obigen `Verify:`-Checkliste von FS07. Bewerte jeden Punkt als `✅ PASS` oder `❌ FAIL`; nenne bei jedem Fehlschlag das Erwartete und das tatsächlich Erzeugte; biete an, die Fehler sofort zu korrigieren. Erfinde keine Ergebnisse — prüfe die tatsächlichen Elemente, `className`, Attribute und `data-cb-*`-Werte.

**Verification prompt to copy (EN):** Check the current form against the FS07 `Verify:` checklist above. Mark each item `✅ PASS` / `❌ FAIL`; for each failure state the expected vs. the actually generated value; offer to fix them right away. Don't invent results — inspect the actual elements, `className`, attributes and `data-cb-*` values.

### FS08 — Autocomplete, cropper and print layout (CSS-class heavy)

**Elements covered:** CodBi_OpenPLZ_AC_SET_*, CodBi_LDAP_AC_*, CodBi_Fotocropper_*,
CodBi_Print_Remove_*, Media.Image.Cropper, CodBi_NoFutureDate, CodBi_DateFrame_1_Begin,
CodBi_DateFrame_1_End, CodBi_TimeFrame_1_Begin, CodBi_TimeFrame_1_End, CodBi_People_*,
Sys.Log.Console.

**Prompt (DE):**
> Richte die Adressfelder `tfPLZ`, `tfOrt`, `tfVorname`, `tfNachname` mit deutscher
> Autovervollständigung für PLZ/Ort/Straße/Hausnummer ein und ergänze eine LDAP-Autofill-Gruppe für
> die Personendaten. Füge ein Fotocropper-Board und einen Bild-Cropper vor dem Upload `fdDatei`
> hinzu. Blende `tfNachname` beim Drucken aus (nur beim Drucken). Für das Datumsfeld `tfDatum`:
> keine zukünftigen Daten; ein Datumsbereich 1 (Beginn/Ende) und ein Zeitbereich 1 (Beginn/Ende)
> mit den entsprechenden Klassen. Ein Feld für Vorname, eines für E-Mail und eines für PLZ (DE) als
> Personenklassen. Logge „Fertig“ in die Konsole.

**Prompt (EN):**
> Set up the address fields `tfPLZ`, `tfOrt`, `tfVorname`, `tfNachname` with German autocomplete
> for ZIP/city/street/house number and add an LDAP autofill group for the personal data. Add a
> photo-cropper board and an image cropper before the `fdDatei` upload. Hide `tfNachname` when
> printing (print-only). For the `tfDatum` date field: no future dates; a date frame 1
> (begin/end) and a time frame 1 (begin/end) with the corresponding classes. A first-name field,
> an e-mail field and a DE ZIP field as people classes. Log "Done" to the console.

**Verify:**
- [ ] `CodBi_OpenPLZ_AC_SET_PLZ/Locality/Street/BuildingNumber` classes on the correct fields (preferred over `data-cb-func`); `CodBi_LDAP_AC_*` on the person group.
- [ ] `CodBi_Fotocropper_*` classes; `Media.Image.Cropper` on `fdDatei`.
- [ ] `CodBi_Print_Remove_PrintOnly` (or the correct variant) on `tfNachname`.
- [ ] `CodBi_NoFutureDate` on `tfDatum`; `CodBi_DateFrame_1_Begin` + `CodBi_DateFrame_1_End` on the two date fields and `CodBi_TimeFrame_1_Begin` + `CodBi_TimeFrame_1_End` on the two time fields (no combined `…_Begin_End` class; no `data-cb-func="date.frame"`).
- [ ] `CodBi_People_*` per field type (not on streets/localities).

**Verification prompt to copy (DE):** Prüfe das aktuelle Formular anhand der obigen `Verify:`-Checkliste von FS08. Bewerte jeden Punkt als `✅ PASS` oder `❌ FAIL`; nenne bei jedem Fehlschlag das Erwartete und das tatsächlich Erzeugte; biete an, die Fehler sofort zu korrigieren. Erfinde keine Ergebnisse — prüfe die tatsächlichen Elemente, `className`, Attribute und `data-cb-*`-Werte.

**Verification prompt to copy (EN):** Check the current form against the FS08 `Verify:` checklist above. Mark each item `✅ PASS` / `❌ FAIL`; for each failure state the expected vs. the actually generated value; offer to fix them right away. Don't invent results — inspect the actual elements, `className`, attributes and `data-cb-*` values.

### FS09 — Kitchen-sink form (every widget type at least once)

**Elements covered:** all 29 widget classes from §1 of
[`form-assistant-test-prompts.md`](form-assistant-test-prompts.md:11).

**Prompt (DE):**
> Erstelle ein Formular, das folgende Elemente enthält: ein einzeiliges Namensfeld, ein
> Datumsfeld „Geburtsdatum“ (deutsche Validierung), ein mehrzeiliges Textfeld, ein Upload-Feld für
> den Lebenslauf, ein Dropdown „Stadt“ mit Ansbach/Nürnberg/München, ein Kontrollkästchen
> „Newsletter“, die Buttons „Zurück“/„Senden“, einen statischen Text „Bitte ausfüllen“, ein
> Logo-Bild, eine Gruppe „Adresse“ als Feldset, einen Layout-Container mit zwei Textfeldern, einen
> unsichtbaren Container, ein Signaturfeld, einen Terminfinder „Beratungstermin“, eine Trennlinie,
> einen Abstand, zwei Seiten „Seite 1“/„Seite 2“ mit Fortschrittsanzeige, einen Kopfbereich
> „Anmeldung“ und einen Fußbereich, ein filterbares Auswahlfeld „Stadt“ (Datalist), ein filterbares
> Textfeld „Kunde“, ein berechnetes Feld „Summe“, eine 5-Sterne-Bewertung, einen Captcha-Schutz,
> ein HTML-Snippet, eine interaktive Karte, eine Formcycle-Navbar, einen Sprachumschalter und einen
> BundID-Login-Button.

**Prompt (EN):**
> Create a form containing the following elements: a single-line name field, a date field "Date of
> birth" (German validation), a multi-line text field, an upload field for the CV, a dropdown
> "City" with Ansbach/Nuremberg/Munich, a "Newsletter" checkbox, the "Back"/"Submit" buttons, a
> static text "Please fill in", a logo image, an "Address" group as a fieldset, a layout container
> with two text fields, an invisible container, a signature field, an appointment finder
> "Consultation", a separator line, a spacer, two pages "Page 1"/"Page 2" with a progress
> indicator, a header "Registration" and a footer, a filterable select field "City" (datalist), a
> filterable text field "Customer", a computed field "Total", a 5-star rating, CAPTCHA protection,
> an HTML snippet, an interactive map, a Formcycle navbar, a language switcher and a BundID login
> button.

**Verify:**
- [ ] All 29 widgets present with the correct `className` (XTextField, XTextArea, XUpload, XSelect, XCheckbox, XButtonList, XSpan, XImage, XFieldSet, XContainer, XContainerInvisible, XSignature, XAppointment, XLine, XSpacer, XPage ×2, Form.Navigator, XHeader, XFooter, XDatalistAdvanced, XTextfieldAdvanced, XFormula, XRating, XCaptcha, XHtmlWidget, XMap, XNavigationBar, XLanguageSwich, XBsLogin).
- [ ] Widget-required options (XSelect `options` text+value; XButtonList `buttons`; XUpload source; datatype `dateDE`; fullwidth on the textarea; `appointmentPlan` on the Terminfinder).
- [ ] 2 XPages + Form.Navigator in its own container; XNavigationBar as separate element (not Form.Navigator).

**Verification prompt to copy (DE):** Prüfe das aktuelle Formular anhand der obigen `Verify:`-Checkliste von FS09. Bewerte jeden Punkt als `✅ PASS` oder `❌ FAIL`; nenne bei jedem Fehlschlag das Erwartete und das tatsächlich Erzeugte; biete an, die Fehler sofort zu korrigieren. Erfinde keine Ergebnisse — prüfe die tatsächlichen Elemente, `className`, Attribute und `data-cb-*`-Werte.

**Verification prompt to copy (EN):** Check the current form against the FS09 `Verify:` checklist above. Mark each item `✅ PASS` / `❌ FAIL`; for each failure state the expected vs. the actually generated value; offer to fix them right away. Don't invent results — inspect the actual elements, `className`, attributes and `data-cb-*` values.

### FS10 — Global standard configurations (holistic)

**Elements covered:** Holistic.CSS.Standard, Holistic.Matomo.Tracking, Holistic.Media.Input.Speech,
Holistic.Media.Input.Speech.Whisper, CodBi_XCL_Speech, DQ.Table.View (already present).

**Prompt (DE):**
> Wende die Standard-CSS auf das Formular an, aktiviere Matomo-Tracking global, aktiviere
> Spracheingabe auf allen Textfeldern und zusätzlich die Whisper-Spracheingabe auf allen Feldern.

**Prompt (EN):**
> Apply the standard CSS to the form, enable Matomo tracking globally, enable speech input on all
> text fields and additionally Whisper speech input on all fields.

**Verify:**
- [ ] The returned `standards` CSV contains `Holistic.CSS.Standard`, `Holistic.Matomo.Tracking`, `Holistic.Media.Input.Speech` / `.Whisper` (config-level, not per-element attributes).
- [ ] `CodBi_XCL_Speech` / `CodBi_XCL_Speech_Whisper` present on the fields (or the config applied).
- [ ] No per-element `data-cb-func` invented for configs that belong in `standards`.

**Verification prompt to copy (DE):** Prüfe das aktuelle Formular anhand der obigen `Verify:`-Checkliste von FS10. Bewerte jeden Punkt als `✅ PASS` oder `❌ FAIL`; nenne bei jedem Fehlschlag das Erwartete und das tatsächlich Erzeugte; biete an, die Fehler sofort zu korrigieren. Erfinde keine Ergebnisse — prüfe die tatsächlichen Elemente, `className`, Attribute und `data-cb-*`-Werte.

**Verification prompt to copy (EN):** Check the current form against the FS10 `Verify:` checklist above. Mark each item `✅ PASS` / `❌ FAIL`; for each failure state the expected vs. the actually generated value; offer to fix them right away. Don't invent results — inspect the actual elements, `className`, attributes and `data-cb-*` values.

---

## B. Whole-workflow scenarios (Workflow Assistant)

### WS01 — Basic intake lane (submit → log → state → email → end)

**Triggers/nodes covered:** FC_FORM_SUBMIT_BUTTON, FC_LOG_ENTRY, FC_CHANGE_STATE, FC_EMAIL, FC_RETURN.

**Prompt (DE):**
> Beim Klick auf den Senden-Button: schreibe eine Info-Logmeldung „Vorgang gestartet“, setze den
> Status auf „Eingegangen“ und sende eine Bestätigungsmail an `[%tfMail%]` von
> office@ansbach.de mit dem Betreff „Eingang“. Danach den Prozess beenden, ohne den Status zu
> ändern.

**Prompt (EN):**
> On click of the submit button: write an info log message "Process started", set the state to
> "Received" and send a confirmation e-mail to `[%tfMail%]` from office@ansbach.de with the subject
> "Received". Then end the process without changing the state.

**Verify:**
- [ ] Trigger `FC_FORM_SUBMIT_BUTTON` with `triggerParams.buttonName`=`btnZwolf`; single JSON object.
- [ ] Node order: FC_LOG_ENTRY → FC_CHANGE_STATE → FC_EMAIL (from literal `office@ansbach.de`, to `[%tfMail%]`, subject `Eingang`) → FC_RETURN (`endpointType=FC_RETURN`, `endpointState=""`).
- [ ] `taskName` + `endpointState` in the prompt's language (`Empfangen`/`Eingegangen` for DE, `Received` for EN).

**Verification prompt to copy (DE):** Prüfe den aktuellen Workflow anhand der obigen `Verify:`-Checkliste von WS01. Bewerte jeden Punkt als `✅ PASS` oder `❌ FAIL`; nenne bei jedem Fehlschlag das Erwartete und das tatsächlich Erzeugte; biete an, die Fehler sofort zu korrigieren. Erfinde keine Ergebnisse — prüfe die tatsächlichen Trigger, Knoten, `_childNodes`, Chain-Knoten, `endpointState`/`endpointType`.

**Verification prompt to copy (EN):** Check the current workflow against the WS01 `Verify:` checklist above. Mark each item `✅ PASS` / `❌ FAIL`; for each failure state the expected vs. the actually generated value; offer to fix them right away. Don't invent results — inspect the actual triggers, nodes, `_childNodes`, chain nodes, `endpointState`/`endpointType`.

### WS02 — Double opt-in with welcome lane (two lanes)

**Triggers/nodes covered:** FC_FORM_SUBMIT_BUTTON, FC_DOI_INIT, FC_DOI_VERIFIED, FC_CHANGE_STATE,
FC_EMAIL, FC_INVITATION_SENT, FC_INVITATION_ERROR.

**Prompt (DE):**
> Lane 1: Beim Klick auf den Senden-Button eine Doppel-Opt-In-Einladung an den Absender senden
> (Erfolgs- und Fehlerseite angeben, Absender office@ansbach.de, Betreff „Bitte bestätigen“,
> Empfänger `[%tfMail%]`). Lane 2: Nach der DOI-Bestätigung den Status auf „Aktiv“ setzen und eine
> Willkommensmail senden. Wenn das Einladungsmail fehlschlägt, eine Fehlermeldung loggen.

**Prompt (EN):**
> Lane 1: On click of the submit button send a double opt-in invitation to the sender (provide
> success and failure completion pages, sender office@ansbach.de, subject "Please confirm",
> recipient `[%tfMail%]`). Lane 2: After DOI verification set the state to "Active" and send a
> welcome e-mail. If the invitation e-mail fails, log an error message.

**Verify:**
- [ ] Output is an **array of two** task objects (two independent lanes).
- [ ] Lane 1: FC_FORM_SUBMIT_BUTTON → FC_DOI_INIT with success+failure page, sender, subject, recipient.
- [ ] Lane 2: FC_DOI_VERIFIED → FC_CHANGE_STATE → FC_EMAIL welcome; optional third lane/branch for FC_INVITATION_ERROR (→ FC_LOG_ENTRY).
- [ ] No FC_EMAIL used for the DOI invitation itself.

**Verification prompt to copy (DE):** Prüfe den aktuellen Workflow anhand der obigen `Verify:`-Checkliste von WS02. Bewerte jeden Punkt als `✅ PASS` oder `❌ FAIL`; nenne bei jedem Fehlschlag das Erwartete und das tatsächlich Erzeugte; biete an, die Fehler sofort zu korrigieren. Erfinde keine Ergebnisse — prüfe die tatsächlichen Trigger, Knoten, `_childNodes`, Chain-Knoten, `endpointState`/`endpointType`.

**Verification prompt to copy (EN):** Check the current workflow against the WS02 `Verify:` checklist above. Mark each item `✅ PASS` / `❌ FAIL`; for each failure state the expected vs. the actually generated value; offer to fix them right away. Don't invent results — inspect the actual triggers, nodes, `_childNodes`, chain nodes, `endpointState`/`endpointType`.

### WS03 — Payment + postbox with authentication guard

**Triggers/nodes covered:** FC_FORM_SUBMIT_BUTTON, CheckTrustLevelPlugin, PaymentInitPlugin,
PostboxPlugin, FC_CHANGE_STATE.

**Prompt (DE):**
> Beim Absenden — nur wenn mit einem ELSTER-Zertifikat authentifiziert — eine Gebühr von 30 € über
> die AKDB bezahlen lassen (Kunden- und Zahlungsdaten aus dem Formular) und danach den erstellten
> Bescheid in den BayernID-Postkorb des Nutzers senden. Am Ende den Status auf „Bezahlt“ setzen.

**Prompt (EN):**
> On submit — only if authenticated with an ELSTER certificate — have a fee of €30 paid via AKDB
> (customer and payment data from the form) and afterwards send the created notice to the user's
> BayernID postbox. Finally set the state to "Paid".

**Verify:**
- [ ] Details request lists CheckTrustLevelPlugin + PaymentInitPlugin + PostboxPlugin (+ their exact sub-schemas).
- [ ] CheckTrustLevelPlugin (CERTIFICATE) as guard; `_childNodes` contain PaymentInitPlugin (orderItemDefs amount "30", paymentClient/customerData/address from form fields) + PostboxPlugin (message subject/body + id, **NOT** FC_EMAIL).
- [ ] FC_CHANGE_STATE `endpointState` in the prompt's language; chain nodes after the guard.

**Verification prompt to copy (DE):** Prüfe den aktuellen Workflow anhand der obigen `Verify:`-Checkliste von WS03. Bewerte jeden Punkt als `✅ PASS` oder `❌ FAIL`; nenne bei jedem Fehlschlag das Erwartete und das tatsächlich Erzeugte; biete an, die Fehler sofort zu korrigieren. Erfinde keine Ergebnisse — prüfe die tatsächlichen Trigger, Knoten, `_childNodes`, Chain-Knoten, `endpointState`/`endpointType`.

**Verification prompt to copy (EN):** Check the current workflow against the WS03 `Verify:` checklist above. Mark each item `✅ PASS` / `❌ FAIL`; for each failure state the expected vs. the actually generated value; offer to fix them right away. Don't invent results — inspect the actual triggers, nodes, `_childNodes`, chain nodes, `endpointState`/`endpointType`.

### WS04 — Repeatable rows as JSON into DB (loop + SQL)

**Triggers/nodes covered:** FC_FORM_SUBMIT_BUTTON, FC_WRITE_FORM_RECORD_ATTRIBUTES, FC_FOR_EACH_LOOP,
FC_SQL_STATEMENT.

**Prompt (DE):**
> Beim Klick auf den Senden-Button alle Zeilen der Wiederholgruppe `divRepeat` als JSON-Array in
> die Datenbank „Pointless“, Tabelle „Hulu“, Spalte „Narrative“ schreiben (INSERT `[%tfName%]`).
> Starte das Array mit `[`, iteriere die Zeilen, hänge jede Zeile an und schließe mit `]`, dann
> genau einen INSERT ausführen.

**Prompt (EN):**
> On click of the submit button write all rows of the repeatable container `divRepeat` as a JSON
> array into the database "Pointless", table "Hulu", column "Narrative" (INSERT `[%tfName%]`).
> Start the array with `[`, iterate the rows, append each row and close with `]`, then run exactly
> one INSERT.

**Verify:**
- [ ] Details request lists FC_WRITE_FORM_RECORD_ATTRIBUTES + FC_FOR_EACH_LOOP + FC_SQL_STATEMENT.
- [ ] Seed `[` FC_WRITE_FORM_RECORD_ATTRIBUTES **before** the loop (chain); per-row append FC_WRITE_FORM_RECORD_ATTRIBUTES **inside** `FC_FOR_EACH_LOOP.nodeParams._childNodes`; close `]` + the single FC_SQL_STATEMENT **after** the loop (chain nodes).
- [ ] `[%tfName%]` placeholders **unquoted** in the SQL; single INSERT (not one per row).
- [ ] Loop iteration type `FORM_FIELD_REPETITIONS`.

**Verification prompt to copy (DE):** Prüfe den aktuellen Workflow anhand der obigen `Verify:`-Checkliste von WS04. Bewerte jeden Punkt als `✅ PASS` oder `❌ FAIL`; nenne bei jedem Fehlschlag das Erwartete und das tatsächlich Erzeugte; biete an, die Fehler sofort zu korrigieren. Erfinde keine Ergebnisse — prüfe die tatsächlichen Trigger, Knoten, `_childNodes`, Chain-Knoten, `endpointState`/`endpointType`.

**Verification prompt to copy (EN):** Check the current workflow against the WS04 `Verify:` checklist above. Mark each item `✅ PASS` / `❌ FAIL`; for each failure state the expected vs. the actually generated value; offer to fix them right away. Don't invent results — inspect the actual triggers, nodes, `_childNodes`, chain nodes, `endpointState`/`endpointType`.

### WS05 — Branching: switch + conditions + context

**Triggers/nodes covered:** FC_FORM_SUBMIT_BUTTON, FC_SWITCH, FC_MULTIPLE_CONDITION, FC_EMAIL,
FC_WITH_FORM_ELEMENT_CONTEXT.

**Prompt (DE):**
> Beim Klick auf den Senden-Button: wenn `tfKlausel` = 'A' eine Mail an A@example.de senden, bei
> 'B' eine Mail an B@example.de. Zusätzlich: nur wenn das Feld `tfOption` == 'A' ist, eine weitere
> Mail senden. Führe die Aktion im Kontext von `tfVorname` = "Max" aus.

**Prompt (EN):**
> On click of the submit button: if `tfKlausel` = 'A' send a mail to A@example.de, if 'B' a mail to
> B@example.de. Additionally: only if the field `tfOption` == 'A', send another mail. Run the
> action in the context of `tfVorname` = "Max".

**Verify:**
- [ ] FC_SWITCH with `_cases` mapping `A`→mail A, `B`→mail B; FC_MULTIPLE_CONDITION with the child on YES; FC_WITH_FORM_ELEMENT_CONTEXT around the block.
- [ ] Children in `_childNodes`; conditions reference the field names correctly.
- [ ] All emails have sender/subject either provided or asked for (no invented values).

**Verification prompt to copy (DE):** Prüfe den aktuellen Workflow anhand der obigen `Verify:`-Checkliste von WS05. Bewerte jeden Punkt als `✅ PASS` oder `❌ FAIL`; nenne bei jedem Fehlschlag das Erwartete und das tatsächlich Erzeugte; biete an, die Fehler sofort zu korrigieren. Erfinde keine Ergebnisse — prüfe die tatsächlichen Trigger, Knoten, `_childNodes`, Chain-Knoten, `endpointState`/`endpointType`.

**Verification prompt to copy (EN):** Check the current workflow against the WS05 `Verify:` checklist above. Mark each item `✅ PASS` / `❌ FAIL`; for each failure state the expected vs. the actually generated value; offer to fix them right away. Don't invent results — inspect the actual triggers, nodes, `_childNodes`, chain nodes, `endpointState`/`endpointType`.

### WS06 — Loops: for-each, while, break/continue

**Triggers/nodes covered:** FC_FORM_SUBMIT_BUTTON, FC_FOR_EACH_LOOP, FC_WHILE_LOOP,
FC_DO_UNTIL_LOOP, FC_EMAIL, FC_BREAK, FC_CONTINUE, FC_LOG_ENTRY.

**Prompt (DE):**
> Beim Absenden: für jede Zeile der Wiederholgruppe `divRepeat` eine Zeile mit `tfName` und
> `tfData` loggen und bei Leerwert `tfName` mit „continue“ überspringen; solange `tfKlausel` == 1
> eine Mail senden und bei erreichtem Limit per „break“ ausbrechen; anschließend bis zur Bedingung
> `tfKlausel` == 0 wiederholen.

**Prompt (EN):**
> On submit: for each row of the repeatable container `divRepeat` log a row with `tfName` and
> `tfData` and skip empty `tfName` with "continue"; while `tfKlausel` == 1 send a mail and break
> out when the limit is reached; afterwards loop until the condition `tfKlausel` == 0.

**Verify:**
- [ ] FC_FOR_EACH_LOOP with per-row children in `_childNodes` (FC_LOG_ENTRY + FC_CONTINUE on the empty case).
- [ ] FC_WHILE_LOOP with FC_EMAIL in `_childNodes` and FC_BREAK child for the limit; FC_DO_UNTIL_LOOP for the trailing loop.
- [ ] No per-row append in `chainedNodes`; loops correctly nested/sequenced.

**Verification prompt to copy (DE):** Prüfe den aktuellen Workflow anhand der obigen `Verify:`-Checkliste von WS06. Bewerte jeden Punkt als `✅ PASS` oder `❌ FAIL`; nenne bei jedem Fehlschlag das Erwartete und das tatsächlich Erzeugte; biete an, die Fehler sofort zu korrigieren. Erfinde keine Ergebnisse — prüfe die tatsächlichen Trigger, Knoten, `_childNodes`, Chain-Knoten, `endpointState`/`endpointType`.

**Verification prompt to copy (EN):** Check the current workflow against the WS06 `Verify:` checklist above. Mark each item `✅ PASS` / `❌ FAIL`; for each failure state the expected vs. the actually generated value; offer to fix them right away. Don't invent results — inspect the actual triggers, nodes, `_childNodes`, chain nodes, `endpointState`/`endpointType`.

### WS07 — Error handling: experiment + catch + throw

**Triggers/nodes covered:** FC_FORM_SUBMIT_BUTTON, FC_EXPERIMENT, FC_EMAIL, FC_CATCH_ERROR,
FC_THROW_EXCEPTION, FC_LOG_ENTRY.

**Prompt (DE):**
> Beim Klick auf den Senden-Button eine Mail senden; bei Fehler eine separate Fehlermail an
> fehler@example.de senden und einen Fehler mit der Meldung „Senden fehlgeschlagen“ werfen. In
> einer zweiten Lane: wenn ein Fehler in einer Lane auftritt, den Fehler loggen und eine
> Benachrichtigungsmail senden.

**Prompt (EN):**
> On click of the submit button send a mail; on error send a separate error mail to
> error@example.de and throw an error with the message "Sending failed". In a second lane: when an
> error occurs in a lane, log the error and send a notification mail.

**Verify:**
- [ ] FC_EXPERIMENT with the main action in `_childNodes` and the error handler in `_handlerChildNodes`.
- [ ] FC_THROW_EXCEPTION with message "Senden fehlgeschlagen".
- [ ] Second lane: FC_CATCH_ERROR (with filters) → FC_LOG_ENTRY → FC_EMAIL; output is an array of two objects.

**Verification prompt to copy (DE):** Prüfe den aktuellen Workflow anhand der obigen `Verify:`-Checkliste von WS07. Bewerte jeden Punkt als `✅ PASS` oder `❌ FAIL`; nenne bei jedem Fehlschlag das Erwartete und das tatsächlich Erzeugte; biete an, die Fehler sofort zu korrigieren. Erfinde keine Ergebnisse — prüfe die tatsächlichen Trigger, Knoten, `_childNodes`, Chain-Knoten, `endpointState`/`endpointType`.

**Verification prompt to copy (EN):** Check the current workflow against the WS07 `Verify:` checklist above. Mark each item `✅ PASS` / `❌ FAIL`; for each failure state the expected vs. the actually generated value; offer to fix them right away. Don't invent results — inspect the actual triggers, nodes, `_childNodes`, chain nodes, `endpointState`/`endpointType`.

### WS08 — Document workflow (PDF/Word/ZIP/CMIS/WebDAV/file system)

**Triggers/nodes covered:** FC_FILL_PDF, RemotePrintService, FC_EMAIL, FC_FILL_WORD,
FC_COMPRESS_AS_ZIP, FC_SAVE_TO_WEBDAV, FC_SAVE_TO_FILE_SYSTEM, FC_RETURN_FILE,
FC_PROCESS_LOG_PDF, FC_EXPORT_FORM_RECORD_CHATS, CmisActionPlugin, CmisQueryActionPlugin,
UploadDocumentPlugin (RegiSafe), FC_DECODE_BASE64, FC_ENCODE_BASE64.

**Prompt (DE):**
> Beim qualifizierten Absenden: das ausgefüllte Formular als PDF rendern und per Mail an
> `[%tfMail%]` senden; die Vorlage `Vorlage.pdf` mit den Feldwerten befüllen; die Word-Vorlage mit
> den Werten befüllen; die Anhänge als ZIP `anhang.zip` komprimieren; die ZIP nach `/var/data`
> speichern und auf den WebDAV-Server; das erzeugte ZIP zum Download anbieten; das Prozesslog als
> PDF erzeugen und die Chats als PDF exportieren; das Dokument als CMIS-Dokument unter `/Antraege`
> ablegen und in RegiSafe archivieren (Metadatum „Aktenzeichen“).

**Prompt (EN):**
> On qualified submit: render the filled form as PDF and send it by mail to `[%tfMail%]`; fill the
> `Vorlage.pdf` template with the field values; fill the Word template with the values; compress
> the attachments as ZIP `anhang.zip`; save the ZIP to `/var/data` and to the WebDAV server; offer
> the generated ZIP for download; generate the process log as PDF and export the chats as PDF; store
> the document as a CMIS document under `/Antraege` and archive it in RegiSafe (metadata "reference
> number").

**Verify:**
- [ ] Trigger `FC_QUALIFIED_FORM_SUBMIT_BUTTON`.
- [ ] RemotePrintService (NOT FC_FILL_PDF) for the form-as-PDF, chained FC_EMAIL after it; FC_FILL_PDF with template+mapping for `Vorlage.pdf`; FC_FILL_WORD for the Word template.
- [ ] FC_COMPRESS_AS_ZIP → FC_SAVE_TO_FILE_SYSTEM + FC_SAVE_TO_WEBDAV + FC_RETURN_FILE; FC_PROCESS_LOG_PDF; FC_EXPORT_FORM_RECORD_CHATS.
- [ ] `de.xima.fc.fc_plugin_cmis.plugin.CmisActionPlugin` (objectName/objectType/folderPath) and `de.xima.regisafe.plugin.node.UploadDocumentPlugin` (files + metadata); no invented credentials.
- [ ] Details request lists every node type used.

**Verification prompt to copy (DE):** Prüfe den aktuellen Workflow anhand der obigen `Verify:`-Checkliste von WS08. Bewerte jeden Punkt als `✅ PASS` oder `❌ FAIL`; nenne bei jedem Fehlschlag das Erwartete und das tatsächlich Erzeugte; biete an, die Fehler sofort zu korrigieren. Erfinde keine Ergebnisse — prüfe die tatsächlichen Trigger, Knoten, `_childNodes`, Chain-Knoten, `endpointState`/`endpointType`.

**Verification prompt to copy (EN):** Check the current workflow against the WS08 `Verify:` checklist above. Mark each item `✅ PASS` / `❌ FAIL`; for each failure state the expected vs. the actually generated value; offer to fix them right away. Don't invent results — inspect the actual triggers, nodes, `_childNodes`, chain nodes, `endpointState`/`endpointType`.

### WS09 — Record management (state, inbox, counter, availability, SQL, message, chat)

**Triggers/nodes covered:** FC_MANUAL, FC_COUNTER, FC_CHANGE_FORM_AVAILABILITY,
FC_SET_FORM_RECORD_PASSWORD, FC_MOVE_FORM_RECORD_TO_INBOX, FC_SEND_FORM_RECORD_MESSAGE,
FC_CHANGE_FORM_RECORD_CHAT_ACTIVENESS, FC_SET_SAVED_FLAG, FC_DELETE_FORM_RECORD, FC_QUEUE_TASK,
FC_WRITE_FORM_RECORD_ATTRIBUTES, FC_SQL_STATEMENT, FC_CREATE_TEXT_FILE.

**Prompt (DE):**
> Wenn der Benutzer es manuell auslöst: Zähler `k1` um 1 erhöhen; das Formular offline schalten;
> den Vorgang mit dem Passwort „Geheim“ schützen; den Vorgang ins Postfach „Anträge“ verschieben;
> eine interne Nachricht „…“ an den Absender senden; den Chat zum Vorgang öffnen; den Vorgang als
> gespeichert markieren; die Datei `ausgabe.json` mit dem Inhalt `{}` erstellen; das
> Server-Attribut `narrativeJson` = `[` schreiben; und den Vorgang endgültig löschen.

**Prompt (EN):**
> When the user triggers it manually: increment counter `k1` by 1; take the form offline; protect
> the record with the password "Secret"; move the record to the inbox "Applications"; send an
> internal message "…" to the sender; open the record chat; mark the record as saved; create the
> file `ausgabe.json` with the content `{}`; write the server attribute `narrativeJson` = `[`; and
> finally delete the record permanently.

**Verify:**
- [ ] Trigger FC_MANUAL; node sequence as listed; FC_SEND_FORM_RECORD_MESSAGE with the message (and recipient service when `recipientType=INBOX_ID`).
- [ ] FC_CREATE_TEXT_FILE (name `ausgabe.json` + content); FC_WRITE_FORM_RECORD_ATTRIBUTES (`narrativeJson`), NOT FC_SQL_STATEMENT (no table involved).
- [ ] Terminal nodes FC_QUEUE_TASK / FC_DELETE_FORM_RECORD with `endpointState=""`.
- [ ] Single lane → single object (no multi-lane unless asked).

**Verification prompt to copy (DE):** Prüfe den aktuellen Workflow anhand der obigen `Verify:`-Checkliste von WS09. Bewerte jeden Punkt als `✅ PASS` oder `❌ FAIL`; nenne bei jedem Fehlschlag das Erwartete und das tatsächlich Erzeugte; biete an, die Fehler sofort zu korrigieren. Erfinde keine Ergebnisse — prüfe die tatsächlichen Trigger, Knoten, `_childNodes`, Chain-Knoten, `endpointState`/`endpointType`.

**Verification prompt to copy (EN):** Check the current workflow against the WS09 `Verify:` checklist above. Mark each item `✅ PASS` / `❌ FAIL`; for each failure state the expected vs. the actually generated value; offer to fix them right away. Don't invent results — inspect the actual triggers, nodes, `_childNodes`, chain nodes, `endpointState`/`endpointType`.

### WS10 — End-to-end complex process (kitchen-sink workflow)

**Triggers/nodes covered:** FC_FORM_SUBMIT_BUTTON, FC_LOG_ENTRY, FC_MULTIPLE_CONDITION,
FC_SWITCH, FC_EMAIL, FC_DOI_INIT, FC_DOI_VERIFIED, FC_FOR_EACH_LOOP, FC_SQL_STATEMENT,
FC_COMPRESS_AS_ZIP, FC_SAVE_TO_WEBDAV, FC_SHOW_TEMPLATE, FC_CHANGE_STATE, FC_CATCH_ERROR,
FC_THROW_EXCEPTION, FC_RETURN.

**Prompt (DE):**
> Beim Klick auf den Senden-Button: Logge „Start“, setze den Status auf „Eingegangen“ und führe
> dann eine Verzweigung aus: bei `tfKlausel` = 'A' eine Doppel-Opt-In-Einladung an `[%tfMail%]`
> senden; nach Bestätigung den Status auf „Aktiv“ setzen und eine Willkommensmail senden. Bei
> `tfKlausel` = 'B' alle Zeilen der Wiederholgruppe als JSON in die DB „Pointless“, Tabelle
> „Hulu“, Spalte „Narrative“ schreiben, danach die Anhänge als ZIP komprimieren und auf den
> WebDAV-Server speichern. Nach beiden Pfaden die Abschlussseite „Allgemeiner Fehler 2“ vermeiden
> und stattdessen den Status auf „Fertig“ setzen. Fehler in einer Lane abfangen, loggen und eine
> Fehlermail senden.

**Prompt (EN):**
> On click of the submit button: log "Start", set the state to "Received" and then branch: if
> `tfKlausel` = 'A' send a double opt-in invitation to `[%tfMail%]`; after confirmation set the
> state to "Active" and send a welcome mail. If `tfKlausel` = 'B' write all rows of the repeatable
> container as JSON into the DB "Pointless", table "Hulu", column "Narrative", then compress the
> attachments as ZIP and save to the WebDAV server. After both paths avoid the completion page
> "General error 2" and instead set the state to "Done". Catch errors in a lane, log them and send
> an error mail.

**Verify:**
- [ ] Single multi-step lane + a second FC_CATCH_ERROR lane (array of two objects).
- [ ] FC_SWITCH with two branches; branch A → FC_DOI_INIT … (and the FC_DOI_VERIFIED continuation, possibly its own lane); branch B → FC_FOR_EACH_LOOP + single unquoted FC_SQL_STATEMENT + FC_COMPRESS_AS_ZIP + FC_SAVE_TO_WEBDAV.
- [ ] Loop/condition children in `_childNodes`; chain nodes after loops; `endpointState` in the prompt's language; FC_THROW_EXCEPTION in the error lane.
- [ ] No `FC_SHOW_TEMPLATE` for a completion page that should be avoided.

**Verification prompt to copy (DE):** Prüfe den aktuellen Workflow anhand der obigen `Verify:`-Checkliste von WS10. Bewerte jeden Punkt als `✅ PASS` oder `❌ FAIL`; nenne bei jedem Fehlschlag das Erwartete und das tatsächlich Erzeugte; biete an, die Fehler sofort zu korrigieren. Erfinde keine Ergebnisse — prüfe die tatsächlichen Trigger, Knoten, `_childNodes`, Chain-Knoten, `endpointState`/`endpointType`.

**Verification prompt to copy (EN):** Check the current workflow against the WS10 `Verify:` checklist above. Mark each item `✅ PASS` / `❌ FAIL`; for each failure state the expected vs. the actually generated value; offer to fix them right away. Don't invent results — inspect the actual triggers, nodes, `_childNodes`, chain nodes, `endpointState`/`endpointType`.

---

## C. Verification prompts (paste into the assistant after generation)

Turn any scenario's `Verify:` checklist into an audit that the AI runs against the live form or
workflow.

**How to use:**
1. Run a scenario prompt (FS01–FS10 in the Form Assistant, WS01–WS10 in the Workflow Assistant).
2. **Quick check:** every scenario above already has a short **"Verification prompt to copy"** (DE +
   EN) directly beneath its `Verify:` checklist — just copy that one.
3. **Thorough check:** for a full audit that also covers the global checks (details-request
   completeness, JSON validity/uniqueness, exact API params, dot-prefixed selectors,
   prompt-language labels, unquoted SQL placeholders), copy the full template below (DE or EN) and
   append the scenario's `Verify:` checklist.
4. Paste it into the assistant chat. The AI inspects the actual form/workflow, marks every
   checklist item `✅ PASS` / `❌ FAIL`, shows expected vs. actual for each failure and offers to fix
   the failures.
5. Re-run after any prompt change (regression).

### Form Assistant — verification prompt

Paste after a whole-form run (FS01–FS10). Replace `{Auftrag}` with the original prompt and append
the scenario's `Verify:` checklist.

**DE:**

> Du bist jetzt Prüfer für das Formular im Designer. Vorhin habe ich dir diesen Auftrag gegeben:
>
> {Auftrag — z. B. den FS-Prompt hier einfügen}
>
> Prüfe jetzt das AKTUELLE Formular Zeile für Zeile anhand der folgenden Checkliste. Bewerte jeden
> Punkt als `✅ PASS` oder `❌ FAIL`. Erfinde keine Ergebnisse — schaue in die tatsächlichen Elemente,
> deren `className`, Attribute, CSS-Klassen und `data-cb-func`/`data-cb-*`-Werte im Formular. Bei
> jedem `❌ FAIL` nenne das Erwartete und das tatsächlich Erzeugte.
>
> Globale Formular-Checks:
> - Details-Request hat jedes benötigte Widget und jede benötigte Funktion aufgelistet — keine
>   erfundenen `className`s (`XText` ist falsch, `XTextField` ist richtig).
> - Finales JSON valide und kohärent: Seiten/Container referenzieren die korrekten Element-`name`s;
>   keine Waisen; eindeutige `name` + `xi-…`-Id pro Element.
> - Alle `data-cb-func`-Werte und `data-cb-*`-Parameter exakt wie in der CodBi-API-Dokumentation.
> - Element-`name`s haben KEINEN Punkt-Präfix (`tfVorname`, nicht `.tfVorname`); nur CSS-Selektor-
>   PARAMETER (z. B. `data-cb-maxfield`, `data-cb-field`) referenzieren ein Zielelement mit
>   Punkt-Präfix (`.tfVorname`) — niemals `#`-Ids.
> - Labels/Platzhalter in der Sprache des Prompts (DE-Prompt → deutsche Labels).
>
> Checkliste dieses Szenarios:
> {Hier die `Verify:`-Checkliste des Szenarios einfügen}
>
> Am Ende eine Zusammenfassung: „X von Y bestanden“. Bei Fehlschlägen biete an, die Probleme sofort
> zu korrigieren.

**EN:**

> You are now the verifier for the form in the designer. Earlier I gave you this task:
>
> {Task — e.g. paste the FS prompt}
>
> Now check the CURRENT form item by item against the following checklist. Mark every item as
> `✅ PASS` or `❌ FAIL`. Do not invent results — inspect the actual elements, their `className`,
> attributes, CSS classes and `data-cb-func`/`data-cb-*` values in the form. For every `❌ FAIL`
> state the expected and the actually generated value.
>
> Global form checks:
> - The details request listed every widget and functionality needed — no invented `className`s
>   (`XText` is wrong, `XTextField` is right).
> - Final JSON is valid and coherent: pages/containers reference the correct element `name`s; no
>   orphans; unique `name` + `xi-…` id per element.
> - All `data-cb-func` values and `data-cb-*` parameters exactly as in the CodBi API documentation.
> - Element `name`s NEVER carry a dot (`tfVorname`, not `.tfVorname`); only CSS-selector PARAMETERS
>   (e.g. `data-cb-maxfield`, `data-cb-field`) reference a target element with a dot prefix
>   (`.tfVorname`) — never `#`-ids.
> - Labels/placeholders in the prompt's language (DE prompt → German labels).
>
> Checklist for this scenario:
> {Paste the scenario's `Verify:` checklist here}
>
> End with a summary: "X of Y passed". On failures, offer to fix the problems right away.

### Workflow Assistant — verification prompt

Paste after a whole-workflow run (WS01–WS10). Replace `{Auftrag}` with the original prompt and
append the scenario's `Verify:` checklist.

**DE:**

> Du bist jetzt Prüfer für den Workflow im Editor. Vorhin habe ich dir diesen Auftrag gegeben:
>
> {Auftrag — z. B. den WS-Prompt hier einfügen}
>
> Prüfe jetzt den AKTUELLEN Workflow anhand der folgenden Checkliste. Bewerte jeden Punkt als
> `✅ PASS` oder `❌ FAIL`. Erfinde keine Ergebnisse — prüfe die tatsächlichen Trigger, Knoten,
> `_childNodes`, Chain-Knoten, `endpointState` und `endpointType`. Bei jedem `❌ FAIL` nenne das
> Erwartete und das tatsächlich Erzeugte.
>
> Globale Workflow-Checks:
> - Details-Request listet jeden Trigger und jeden Knoten auf (inkl. Bedingungs-/Schleifen-/
>   Container-Knoten).
> - Ein Lane → ein JSON-Objekt; mehrere unabhängige Lanes → Array von Objekten; jedes mit
>   `taskName`, `taskDescription`, `triggerType`, `triggerParams`, `nodeType`, `nodeParams`,
>   `endpointState`, `endpointType`.
> - Kind-Knoten in `_childNodes` bei Bedingungen/Schleifen; Chain-Knoten nie in `_childNodes`.
> - `endpointState`-Label in der Sprache des Prompts (DE-Prompt → „Empfangen“, nicht „Received“);
>   `""` bei Terminal-Knoten (FC_RETURN / FC_DELETE_FORM_RECORD / FC_QUEUE_TASK).
> - `[%fieldName%]`-Platzhalter in SQL **unquoted**.
>
> Checkliste dieses Szenarios:
> {Hier die `Verify:`-Checkliste des Szenarios einfügen}
>
> Am Ende eine Zusammenfassung: „X von Y bestanden“. Bei Fehlschlägen biete an, die Probleme sofort
> zu korrigieren.

**EN:**

> You are now the verifier for the workflow in the editor. Earlier I gave you this task:
>
> {Task — e.g. paste the WS prompt}
>
> Now check the CURRENT workflow against the following checklist. Mark every item as `✅ PASS` or
> `❌ FAIL`. Do not invent results — inspect the actual triggers, nodes, `_childNodes`, chain nodes,
> `endpointState` and `endpointType`. For every `❌ FAIL` state the expected and the actually
> generated value.
>
> Global workflow checks:
> - The details request listed every trigger and node (incl. condition/loop/container nodes).
> - Single lane → single JSON object; multiple independent lanes → array of objects; each with
>   `taskName`, `taskDescription`, `triggerType`, `triggerParams`, `nodeType`, `nodeParams`,
>   `endpointState`, `endpointType`.
> - Child nodes inside `_childNodes` for conditions/loops; chain nodes never in `_childNodes`.
> - `endpointState` label in the prompt's language (German prompt → `"Empfangen"`, not
>   `"Received"`); `""` for terminal nodes (FC_RETURN / FC_DELETE_FORM_RECORD / FC_QUEUE_TASK).
> - `[%fieldName%]` placeholders in SQL **unquoted**.
>
> Checklist for this scenario:
> {Paste the scenario's `Verify:` checklist here}
>
> End with a summary: "X of Y passed". On failures, offer to fix the problems right away.

---

## How to record results

Reuse the checklist from [`form-assistant-prompt-testing-plan.md`](form-assistant-prompt-testing-plan.md:49).
For each scenario record: prompt language, details-request present?, details list complete (all
widgets/triggers/nodes), final JSON valid?, required params present?, structure correct (nesting /
lanes / order)?, PASS/FAIL + snippet. Re-run after any prompt change (regression).
