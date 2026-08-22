# Form Assistant Prompt Testing Plan

Goal: verify that the CodBi AI prompts correctly enable the assistants to build **any** Formcycle widget, CodBi element (functionality / placeholder / standard class), or workflow trigger/node — i.e., that the AI picks the right type, requests the right details, fills all mandatory parameters, and emits valid JSON.

Scope covers **both** assistants:
- **Form Assistant** (Form Designer → AI Assistant) → builds **form JSON** (widgets + CodBi attributes + element placeholders + standard classes).
- **Workflow Assistant** (Workflow Editor → AI Assistant) → builds **workflow task JSON** (triggers + nodes).

---

## 1. Approach assessment ("What do you think?")

The approach is sound and is essentially a **golden-set / acceptance test** of the prompt corpus. Recommendations that make it reliable:

1. **Test against a real, well-populated form** so the AI can derive `technicalId`s, page names, existing widgets, variables, etc. A blank form gives the AI nothing to reference and produces false negatives.
2. **Always verify two stages**, not just the final JSON:
   - (a) the **details request** (the AI must request widget/node schemas before emitting — e.g. `widgets:[...]` / `nodes:[...]`), and
   - (b) the **final JSON** produced after the server supplies those schemas.
   A prompt test that skips stage (a) misses most prompt bugs.
3. **Re-run each card in at least German and English** (or at least note the language) — the prompts mandate language-consistent labels/endpoints, so both must be checked.
4. **Keep a pass/fail + evidence log** per card (paste the AI's key JSON snippet). Re-run the full set after any prompt change (regression).
5. **Automate the mechanical checks** where possible: valid JSON, `data-cb-func` present, required `data-cb-*` present, nodeType correct, `_childNodes` placement, `endpointState` non-`Received` for non-English, etc.

---

## 2. Inventory overview

| Category | Count | Source file |
|---|---|---|
| Formcycle widgets | 29 | `formcycle-widgets-compact.md` / `prompts/formcycle-widgets.md` |
| CodBi functionalities | 25 | `codbi-core-elements-compact.md` / `codbi-core-api-compact.md` / `prompts/codbi-functionalities.md` |
| Element placeholders (EPs) | ~29 | `codbi-core-elements-compact.md` / `codbi-core-api-compact.md` |
| Standard configurations | 4 | `codbi-core-elements-compact.md` |
| Standard CSS classes (groups) | ~13 groups / ~60 classes | `codbi-core-elements-compact.md` |
| Workflow triggers | 12 | `formcycle-workflow-nodes-compact.md` |
| Workflow nodes | ~46 | `formcycle-workflow-nodes-compact.md` / `prompts/formcycle-workflow-nodes.md` |

---

## 3. Test environment & how to run

- **Form tests**: Form Designer → AI Assistant panel → enter the test prompt → observe (1) the details/`need_form_widget_details` request and (2) the returned form JSON → "Apply" and inspect the rendered form in the designer.
- **Workflow tests**: Workflow Editor → AI Assistant → enter the test prompt → observe (1) the `need_workflow_node_details` request and (2) the returned workflow JSON → inspect nodes in the editor.
- Use a shared test form with: several pages, a submit button (`btnZwolf`), text fields (`tfVorname`, `tfNachname`, `tfOrt`, `tfPLZ`, `tfMail`, `tfAlter`, `tfDatum`, `tfUhrzeit`), a textarea (`tfNachricht`), a select (`selStadt`), a checkbox (`cbNews`), an upload (`fdDatei`), a repeatable container (`divRepeat` with `tfName`/`tfData`), and a DataQuery `HolaQuery` configured on the server.
- **Record per card**: prompt language, details-request present?, final JSON valid?, required params present?, expected element/node/functionality chosen?, PASS/FAIL + snippet.

---

## 4. Reusable verification checklist

### A. Form build (widgets + CodBi)
- [ ] Correct `className` (never invented, e.g. `XText`); page/container `elements` arrays reference item `name`s.
- [ ] Unique, descriptive `name` (+ `id` per convention `xi-…`); meaningful label in the prompt's language.
- [ ] Widget-required options present (XSelect `options` text+value; XButtonList `buttons`; XUpload source; datatype on date/validated fields; fullwidth on XTextArea).
- [ ] For CodBi: `data-cb-func` + every required `data-cb-*` present and correctly valued; JSON-flagged columns/`jsonFlag` correct.
- [ ] No placeholder/invented parameters; EPs used with correct id, param order, trailing `;`.

### B. Workflow (triggers + nodes)
- [ ] `nodeType` is the correct node; REQUIRED params present (see each card).
- [ ] Child nodes in `_childNodes` for loops/conditions; chain nodes after the loop; never a per-row append in `chainedNodes`.
- [ ] `endpointState` label in the prompt's language (not `Received` for German), or `""` for terminal nodes (FC_RETURN/FC_DELETE_FORM_RECORD/FC_QUEUE_TASK).
- [ ] `taskName` set, in the prompt's language, no forbidden chars.
- [ ] Details request lists every trigger/node used.

### C. Element placeholders (EPs)
- [ ] Correct EP id used verbatim (no renaming), `{ <id> > Param1 ; Param2 ; … }` syntax, correct param order.
- [ ] Unused optional params passed as empty `;;` (AI.LLAMA.STD.QA).
- [ ] Regex params are regexes (`^An`), F outermost for exact filtering, arrays handled with I/JSON.Path.

---

## 5. Test cards

> Legend: **P** = test prompt, **V** = what to verify. Run each in DE and EN (language is part of the check).

### 5.1 Formcycle widgets

| Widget | P (example) | V |
|---|---|---|
| XTextField | "Füge ein einzeiliges Eingabefeld für den Namen hinzu." | className XTextField; label "Name"; datatype absent/plain. |
| XTextField (validated) | "Ein Datumsfeld 'Geburtsdatum' mit deutscher Datumsvalidierung." | datatype `dateDE`. |
| XTextArea | "Ein mehrzeiliges Textfeld für die Nachricht." | XTextArea; `fullwidth="1"`. |
| XUpload | "Ein Upload-Feld für den Lebenslauf." | XUpload; source set (or asked). |
| XSelect | "Ein Dropdown 'Stadt' mit den Optionen Ansbach, Nürnberg, München." | XSelect; options array each `{text,value}`; label. |
| XCheckbox | "Ein Kontrollkästchen 'Newsletter abonnieren'." | XCheckbox (lowercase b). |
| XButtonList | "Zwei Buttons: 'Zurück' und 'Senden'." | XButtonList; buttons with action.page = "previous"/"submit". |
| XSpan | "Einen statischen Text 'Bitte ausfüllen' einfügen." | XSpan; text in `rtevalue` (not label). |
| XImage | "Ein Bild mit Logo einfügen." | XImage; source. |
| XFieldSet | "Eine Gruppe 'Adresse' mit Feldset-Rahmen." | XFieldSet; legend "Adresse"; child fields nested. |
| XContainer | "Einen Layout-Container mit zwei Textfeldern." | XContainer; children in elements; no label. |
| XContainerInvisible | "Einen unsichtbaren Container für versteckte Felder." | XContainerInvisible. |
| XSignature | "Ein Signaturfeld für die Unterschrift." | XSignature. |
| XAppointment | "Einen Terminfinder 'Beratungstermin'." | XAppointment; appointmentPlan when named; NOT for plain date. |
| XLine | "Eine Trennlinie einfügen." | XLine; no label. |
| XSpacer | "Einen Abstand/Spacer einfügen." | XSpacer; no label. |
| XPage | "Formular mit 2 Seiten ('Seite 1','Seite 2') und Form.Navigator." | 2 XPages; navigator applied (see Form.Navigator). |
| XHeader/XFooter | "Einen Formularkopf 'Anmeldung' und einen Fußbereich." | XHeader / XFooter. |
| XDatalistAdvanced | "Ein filterbares Auswahlfeld 'Stadt' (Datalist)." | XDatalistAdvanced (DS Widget). |
| XTextfieldAdvanced | "Ein filterbares Textfeld 'Kunde'." | XTextfieldAdvanced. |
| XFormula | "Ein berechnetes Feld 'Summe' (read-only)." | XFormula. |
| XRating | "Eine Bewertung mit 5 Sternen." | XRating. |
| XCaptcha / XReCaptcha | "Einen Captcha-Schutz hinzufügen." | XCaptcha (or XReCaptcha when reCAPTCHA requested). |
| XHtmlWidget | "Ein HTML-Snippet einfügen." | XHtmlWidget. |
| XMap | "Eine interaktive Karte einfügen." | XMap (Leaflet). |
| XNavigationBar | "Eine Navigations-/Fortschrittsleiste (Formcycle-Navbar)." | XNavigationBar — NOT Form.Navigator. |
| XLanguageSwich | "Einen Sprachumschalter." | XLanguageSwich. |
| XBsLogin | "Einen BundID-Login-Button." | XBsLogin; bs_auth_ref. |

### 5.2 CodBi functionalities

| Functionality | P (example) | V |
|---|---|---|
| AI.LLAMA.CHAT | "Bette einen KI-Chat in den Container ein." | `data-cb-func="AI.LLAMA.CHAT"`; chat sub-elements/classes. |
| AI.OCR | "OCR: Text aus dem Upload-Feld extrahieren." | On XUpload; `data-cb-func="AI.OCR"`. |
| Date.Frame | "Datumsbereich: 'Beginn' und 'Ende' (Beginn min)." | On BEGIN field only; `data-cb-maxfield`/`MaxField` → end field. |
| Date.Min | "Im Datumsfeld keine Vergangenheitsdaten erlauben." | On date XTextField; min date set. |
| Date.NoWeekends | "In dem Datumsfeld keine Wochenenden erlauben." | On date XTextField; `data-cb-func="Date.NoWeekends"`. |
| Form.Navigator | "Mehrseitiges Formular mit Fortschrittsanzeige." | On 2+ page form; navigator; NOT on single page. |
| HTML.CSS | "Eigenes CSS einfügen: Alle Überschriften rot." | `data-cb-func="HTML.CSS"` + CSS text; ask if missing. |
| HTML.Input.Cleave | "Kreditkartennummer mit Maskierung im Textfeld." | On XTextField; Cleave params. |
| HTML.Input.REGEX | "Das Feld darf die Zeichen e$% nicht enthalten." | `data-cb-func="HTML.Input.REGEX"`; `data-cb-keyexpression="[^e$%]"`, `data-cb-expression="^[^e$%]*$"`. |
| HTML.Input.TinyMCE | "Das mehrzeilige Feld soll ein Rich-Text-Editor sein." | On XTextArea; `data-cb-func="HTML.Input.TinyMCE"`. |
| HTML.Panel | "Container in ein aufklappbares Panel verwandeln." | `data-cb-func="HTML.Panel"` (+ header attrs) on container; XFieldSet+class for Standard-Panel. |
| HTML.SETAttribute | "Dem Feld den Titel 'Pflichtfeld' und Opacity 0.5 setzen." | `data-cb-func="HTML.SETAttribute"`; `data-cb-name`+`data-cb-toset`. |
| HTML.Text.Injector | "Text 'hallo' in die CSS-Klasse des Elements injizieren." | `data-cb-func="HTML.Text.Injector"`; text + target property. |
| HTML.Text.Mapper | "Objekt-Eigenschaften in Text-Template mappen." | `data-cb-func="HTML.Text.Mapper"`; object source + template. |
| JSON.SET | "Verstecktes Feld mit JSON aus dem Element befüllen." | On hidden field; `data-cb-func="JSON.SET"` + expression. |
| LDAP.Autocomplete.Set | "LDAP-Autovervollständigung auf die Adressfelder." | `CodBi_LDAP_AC_*` classes (set). |
| LDAP.Autocomplete | "Autovervollständigung aus dem LDAP-Verzeichnis." | On text input; `data-cb-func="LDAP.Autocomplete"`. |
| Matomo.Tracking | "Matomo-Tracking für das Formular aktivieren." | On form; tracking ID (ask when missing). |
| Media.Image.Cropper | "Bild-Cropper vor dem Upload anbieten." | On XUpload; `data-cb-func="Media.Image.Cropper"`. |
| MEDIA.INPUT.SPEECH | "Spracheingabe (Diktieren) im Textfeld." | On text input; speech classes/functionality. |
| OpenPLZ.Autocomplete | "Adressgruppe mit PLZ/Ort/Straße/Nummer und Autovervollständigung." | CSS classes `CodBi_OpenPLZ_AC_SET_*` (preferred) on each field. |
| Print.Remove | "Beim Drucken das Feld ausblenden." | `data-cb-func="Print.Remove"` (or print-removal class). |
| Sys.Log.Console | "Logge die Details des Planeten Pluto (Sättigung 0.5) in die Konsole." | New invisible XSpan with exact shape; `data-cb-Data="SYS.Log.Console > …"`. |
| DQ.Table.View | "Zeige die Spalten Alter, Name der Abfrage HolaQuery als Tabelle." | On container; `data-cb-func="DQ.Table.View"`; `data-cb-columns` + `data-cb-dataquery`; also test ExcludeColumns + Excel export. |
| Time.Frame | "Zeitbereich: 'Beginn' und 'Ende' (Beginn min)." | On BEGIN time field only; MaxField → end field. |

### 5.3 Element placeholders (EPs)

> Test EPs via a Sys.Log.Console or a field whose value uses the placeholder `{ … }`.

| EP | P (example) | V |
|---|---|---|
| AI.LLAMA.STD.QA | "Logge die KI-Antwort zu 'Wie wird das Wetter morgen?'." | `{ AI.LLAMA.STD.QA > Wie wird das Wetter morgen?; true;;;;;; }` (trailing `;`!). |
| BayVIS.* (8) | "Zeige die Kontaktdetails des Amts für Digitales (BayVIS)." | Correct BayVIS EP; not OpenPLZ for geographic. |
| Data.CSV | "CSV-String in Array umwandeln." | `{ Data.CSV > … }`. |
| Data.Join | "Zwei Objekte zu einem zusammenführen." | `{ Data.Join > … }`. |
| Date.Arithmetic / Date.FromString | "String in Datum umwandeln." | Correct Date EP. |
| Date.Holidays / Date.Today / Date.Weekends | "Feiertage des Jahres 2026 abrufen." | Correct Date EP + CSS injection for Weekends. |
| DOM.Query | "Das Element .p1 abfragen." | `{ DOM.Query > .p1 }`. |
| F | "Filtere Objekte mit postalCode == 91522." | `{ F > postalCode ; 91522 ; … }` — F outermost. |
| I | "Nimm das erste Element aus dem Array." | `{ I > 0 ; … }`. |
| JSON.Path | "Extrahiere 'name' aus dem Ergebnis." | `{ JSON.Path > … ; name }`. |
| LDAP.Find | "Suche 'sn=Callari' im LDAP." | `{ LDAP.Find > AND ; sn=Callari }`. |
| Net.URL | "Lade den Inhalt der URL." | `{ Net.URL > <url> }`. |
| OpenPLZ.Localities | "Suche Orte, die mit 'An' beginnen (DE)." | `{ OpenPLZ.Localities > de ; ^An }`. |
| OpenPLZ.Streets | "Suche Straßen in 91522." | `{ OpenPLZ.Streets > ; .* ; 91522 }`. |
| OpenPLZ.OrganizationalUnits | "Alle Kantone der Schweiz." | `{ OpenPLZ > ch ; Cantons }` (or OrganizationalUnits). |
| OpenPLZ.TextSearch | "Volltextsuche '91522 Karolinen'." | `{ OpenPLZ.TextSearch > de ; 91522 Karolinen }`. |
| Sorted / Unique | "Sortiere / dedupliziere die Ortsnamen." | `{ Sorted > { JSON.Path > … ; name } }` / Unique analog. |
| V / VP | "Wert der globalen Variable 'USGrade' verwenden." | `{ V > USGrade }` / `{ VP > … }`. |

### 5.4 Standard configurations

| Config | P | V |
|---|---|---|
| Holistic.CSS.Standard | "Wende die Standard-CSS auf das Formular an." | config applied (class/global). |
| Holistic.Matomo.Tracking | "Matomo-Tracking global aktivieren." | tracking ID global variable. |
| Holistic.Media.Input.Speech | "Spracheingabe auf allen Textfeldern aktivieren." | `CodBi_XCL_Speech` everywhere / config. |
| Holistic.Media.Input.Speech.Whisper | "Whisper-Spracheingabe auf allen Feldern." | `CodBi_XCL_Speech_Whisper` everywhere / config. |

### 5.5 Standard CSS classes (representative prompts per group)

| Group | P (example) | V |
|---|---|---|
| People (`CodBi_People_*`) | "Ein Feld für Vorname, eines für E-Mail, eines für PLZ (DE)." | Correct People class per field type (not on streets/localities). |
| Financial (`CodBi_Currency`) | "Ein Euro-Geldbetragsfeld 'Kaufpreis'." | `CodBi_Currency` (EUR). |
| Appointments | "Datumsfeld ohne zukünftige Daten" / "Datumsbereich 1" | `CodBi_NoFutureDate` / `CodBi_DateFrame_1_Begin_End` / `CodBi_TimeFrame_1_Begin_End` (no data-cb-func=date.frame!). |
| UI.Panels | "Ein Standard-Panel um die Gruppe." | `CodBi_HTML_Panel_Standard` on XFieldSet (NOT container); Flat/Index/Minimal variants. |
| Accordion | "Akkordeon mit 3 Panels." | `CodBi_Accordion_A/B/C/D`; `CodBi_HTML_Panel_NoCordion` for excluded panel. |
| Print.Removal | "Feld beim Drucken ausblenden (Tagged/Parent/PrintOnly)." | Correct `CodBi_Print_Remove_*` class. |
| BayVIS | "Behörden-Autofill-Feld." | `CodBi_BayVIS_*` class. |
| OpenPLZ.AC.SET | "Adressgruppe mit Autovervollständigung." | `CodBi_OpenPLZ_AC_SET_PLZ/Locality/Street/BuildingNumber`. |
| LDAP.Autofill | "LDAP-Autofill-Feld." | `CodBi_LDAP_AC_*`. |
| AI classes | "KI-Chat-Widget in den Container." | `AI_LLAMA_CHAT_*` sub-elements (Input/Send/Stop/…). |
| Fotocropper | "Fotocropper-Board einfügen." | `CodBi_Fotocropper_*` classes. |

### 5.6 Workflow triggers

| Trigger | P (example) | V |
|---|---|---|
| FC_FORM_SUBMIT_BUTTON | "Beim Klick auf den Senden-Button…" | triggerType + `triggerParams.buttonName`=btnZwolf. |
| FC_QUALIFIED_FORM_SUBMIT_BUTTON | "Beim qualifizierten Absenden (Signatur)…" | qualified trigger. |
| FC_MANUAL | "Wenn der Benutzer es manuell auslöst…" | FC_MANUAL. |
| FC_STATE_TIMER | "2 Tage nach Eintritt in Status 'Eingegangen'…" | FC_STATE_TIMER + applicableStateNames + duration. |
| FC_TIME_POINT | "Am 02.07.2026 um 08:48 Uhr…" | FC_TIME_POINT FIXED with ISO-8601+offset; or EXPRESSION_WITH_FORMAT from field. |
| FC_FORM_RECORD_MESSAGE_POSTED | "Wenn eine interne Nachricht eingeht…" | message trigger. |
| FC_FORM_RECORD_MESSAGE_UPLOAD_REQUEST_FULFILLED | "Wenn ein Upload-Wunsch erfüllt wurde…" | upload-request trigger. |
| FC_CATCH_ERROR | "Wenn ein Fehler in einer Lane auftritt…" | FC_CATCH_ERROR + filters. |
| FC_DOI_VERIFIED | "Nach Bestätigung der DOI-E-Mail…" | DOI verified trigger. |
| FC_INVITATION_SENT / FC_INVITATION_ERROR | "Wenn die Einladungsmail gesendet wurde / fehlschlägt…" | invitation triggers. |
| FC_USER_INVOCATION | "Wenn der Benutzer es aus der Detailansicht auslöst…" | FC_USER_INVOCATION. |

### 5.7 Workflow nodes

| Node | P (example) | V |
|---|---|---|
| FC_EMAIL | "Beim Absenden eine Bestätigungsmail an [%tfMail%] von office@ansbach.de mit Betreff 'Eingang' senden." | nodeType FC_EMAIL; to/subject/body(from user) + from literal. |
| FC_DOI_INIT | "Doppel-Opt-In-Einladung an den Absender." | FC_DOI_INIT; success+failure page, sender, subject, recipient. |
| FC_CHANGE_STATE | "Status auf 'Bearbeitet' setzen." | FC_CHANGE_STATE (or endpointState). |
| FC_POST_REQUEST | "POST an https://api.example.com mit JSON senden." | FC_POST_REQUEST; REQUIRED url + method. |
| FC_CHANGE_FORM_VALUE | "Feld tfOrt auf 'Ansbach' setzen." | FC_CHANGE_FORM_VALUE; formValues. |
| FC_LOG_ENTRY | "Eine Info-Logmeldung 'Vorgang gestartet' schreiben." | FC_LOG_ENTRY. |
| FC_REDIRECT | "Auf https://example.de weiterleiten." | FC_REDIRECT url (or urlTemplate). |
| FC_RETURN | "Prozess beenden (ohne Statuswechsel)." | FC_RETURN; endpointType FC_RETURN, endpointState "". |
| FC_SET_SAVED_FLAG | "Vorgang als gespeichert markieren." | FC_SET_SAVED_FLAG. |
| FC_DELETE_FORM_RECORD | "Vorgang endgültig löschen." | FC_DELETE_FORM_RECORD; endpointState "". |
| FC_QUEUE_TASK | "Ereignis in die Warteschlange stellen." | FC_QUEUE_TASK (terminal). |
| FC_SEND_FORM_RECORD_MESSAGE | "Interne Nachricht '…' an den Absender." | FC_SEND_FORM_RECORD_MESSAGE; message + recipient. |
| FC_CHANGE_FORM_RECORD_CHAT_ACTIVENESS | "Chat zum Vorgang öffnen." | changeType OPEN/CLOSE + recipient. |
| FC_CREATE_TEXT_FILE | "Datei 'ausgabe.json' mit dem Inhalt erstellen." | FC_CREATE_TEXT_FILE; fileName + fileContent. |
| FC_WRITE_FORM_RECORD_ATTRIBUTES | "Server-Attribut 'narrativeJson' = '[' schreiben." | FC_WRITE_FORM_RECORD_ATTRIBUTES; attributes. |
| FC_SQL_STATEMENT | "Daten in DB 'Pointless', Tabelle 'Hulu', Spalte 'Narrative' schreiben (INSERT mit [%tfName%])." | FC_SQL_STATEMENT; connection+sql; placeholders UNQUOTED in VALUES. |
| FC_RETURN_FILE | "Datei 'xoxo.txt' zum Download anbieten." | FC_RETURN_FILE. |
| FC_ENCODE_BASE64 / FC_DECODE_BASE64 | "Upload-Feld base64-encodieren / decodieren." | correct encode/decode node + source. |
| FC_PROCESS_LOG_PDF | "Prozesslog als PDF erzeugen." | FC_PROCESS_LOG_PDF. |
| FC_EXPORT_FORM_RECORD_CHATS | "Chats als PDF exportieren." | FC_EXPORT_FORM_RECORD_CHATS. |
| RemotePrintService | "Das ausgefüllte Formular als PDF versenden." | RemotePrintService (form-as-PDF), NOT FC_FILL_PDF. |
| FC_FILL_PDF | "Vorlage.pdf mit Feldwerten befüllen." | FC_FILL_PDF + template file + mapping. |
| FC_FILL_WORD | "Word-Vorlage mit Werten befüllen." | FC_FILL_WORD + template + mapping. |
| FC_COMPRESS_AS_ZIP | "Dateien als ZIP 'anhang.zip' komprimieren." | FC_COMPRESS_AS_ZIP. |
| FC_SAVE_TO_FILE_SYSTEM | "Datei nach /var/data speichern." | FC_SAVE_TO_FILE_SYSTEM path. |
| FC_SAVE_TO_WEBDAV | "Datei auf den WebDAV-Server speichern." | FC_SAVE_TO_WEBDAV connection + path. |
| FC_COUNTER | "Zähler 'k1' um 1 erhöhen." | FC_COUNTER. |
| FC_CHANGE_FORM_AVAILABILITY | "Formular offline schalten." | FC_CHANGE_FORM_AVAILABILITY. |
| CreateRecordNodePlugin | "Einen neuen Vorgang in Form 'Antrag' anlegen (Feld-Mapping)." | CreateRecordNodePlugin + target form + mapping. |
| FC_SHOW_TEMPLATE | "Abschlussseite 'Allgemeiner Fehler 2' anzeigen." | FC_SHOW_TEMPLATE htmlTemplate (from available templates). |
| FC_DELETE_ATTACHMENT | "Anhänge des Upload-Felds fdDatei löschen." | FC_DELETE_ATTACHMENT. |
| FC_MOVE_FORM_RECORD_TO_INBOX | "Vorgang ins Postfach 'Anträge' verschieben." | FC_MOVE_FORM_RECORD_TO_INBOX inboxName. |
| FC_THROW_EXCEPTION | "Fehler mit Meldung 'X' werfen." | FC_THROW_EXCEPTION. |
| FC_EMPTY | — (no-op; must NOT be used for actions). | If the AI ever emits it for a real action → FAIL. |
| FC_BREAK / FC_CONTINUE | "…und dann aus der Schleife ausbrechen / mit nächster Iteration fortfahren." | loop child placement + breakTarget/continueTarget. |
| FC_SET_FORM_RECORD_PASSWORD | "Vorgang mit Passwort 'Geheim' schützen." | FC_SET_FORM_RECORD_PASSWORD (manual mode). |
| CheckTrustLevelPlugin | "Nur wenn mit ELSTER-Zertifikat authentifiziert…" | trustLevel CERTIFICATE guard node. |
| FC_MULTIPLE_CONDITION | "Nur wenn Feld tfOption == 'A'… (sonst nichts)." | FC_MULTIPLE_CONDITION + comparator/compareValue + child on YES. |
| FC_SWITCH | "Wenn tfKlausel='A' → Mail1, bei 'B' → Mail2." | FC_SWITCH + _cases (different children per value). |
| FC_EXPERIMENT | "Mail senden; bei Fehler eine Fehlermail." | FC_EXPERIMENT + _childNodes/_handlerChildNodes. |
| FC_FOR_EACH_LOOP | "Für jede Zeile der Wiederholgruppe 'Name/Data' …" | FC_FOR_EACH_LOOP (FORM_FIELD_REPETITIONS) + per-row child in _childNodes. |
| FC_WHILE_LOOP / FC_DO_UNTIL_LOOP | "Solange tfKlausel==1 … Mail senden." | loop node + condition; break/continue patterns. |
| FC_WITH_FORM_ELEMENT_CONTEXT | "Im Kontext von tfVorname=Max …" | FC_WITH_FORM_ELEMENT_CONTEXT + fieldValues. |

### 5.8 Composite / advanced scenarios (high-value)

| Scenario | P (example) | V |
|---|---|---|
| DQ.Table.View full | "Zeige Spalten Alter, Name, Details der Abfrage HolaQuery als Tabelle; Details als JSON; Excel-Export; Details-Spalte nicht exportieren." | columns CSV with `jsonFlag`; `data-cb-excludecolumns`; export button; centered default. |
| Address group | "Adressgruppe mit PLZ, Ort, Straße, Hausnummer und Autovervollständigung (Deutschland)." | `CodBi_OpenPLZ_AC_SET_*` classes on the right fields. |
| Repeatable → JSON → DB | "Alle Zeilen der Wiederholgruppe als JSON-Array in DB 'Pointless' Tabelle 'Hulu' Spalte 'Narrative' schreiben." | Seed `[` → loop(append in _childNodes) → close `]` → ONE FC_SQL_STATEMENT (unquoted placeholder). |
| Multi-lane | "Beim Absenden eine Bestätigungsmail; nach DOI-Bestätigung eine Willkommensmail." | TWO lanes (array), different triggers. |
| Language of endpoint | "Beim Absenden Status auf 'Eingegangen' setzen." | endpointState German; also repeat with English prompt → 'Received'. |
| AI clarification | "E-Mail beim Absenden senden." (no sender/subject given) | AI asks (clarification) for sender/subject; does NOT invent. |
| Placeholder misuse | "INSERT mit [%tfTest%] in VALUES generieren (DB 'x')." | FC_SQL_STATEMENT uses `VALUES ([%tfTest%])` — NEVER `'[%tfTest%]'`. |

### 5.9 Whole-form & whole-workflow scenarios (end-to-end)

Beyond the single-element cards above, run the end-to-end scenario prompts in
[`form-assistant-whole-form-test-prompts.md`](form-assistant-whole-form-test-prompts.md:1)
(FS01–FS10 whole-form, WS01–WS10 whole-workflow). These verify that **one prompt** can produce a
coherent **complete form** (pages, fieldsets, containers, multiple widgets + CodBi functionalities
+ element placeholders interacting) or a **complete workflow** (multiple lanes, conditions, loops,
error handling) with:
- a complete details request (`need_form_widget_details` / `need_workflow_node_details`) listing
  **every** element/trigger/node the scenario needs,
- correct structure (page/container nesting; `_childNodes` for conditions/loops; chain nodes after
  loops; array-of-lanes when multiple independent lanes),
- language-consistent labels/endpoints (`Empfangen` for DE, `Received` for EN),
- correct field references (dot-prefixed `name`-based selectors, `[%fieldName%]` unquoted in SQL).

---

## 6. Results log template

```text
Card: <id / item>
Language: DE / EN
Prompt: <paste>
Details-request stage: OK / MISSING  (widgets:[...] | nodes:[...])
Final JSON: valid / INVALID  (<error>)
Required params: OK / MISSING  (<list what's missing>)
Correct type chosen: yes / no  (<expected vs actual>)
Placement (items/elements/_childNodes/endpoint): OK / FAIL
Language of labels/endpoint: OK / FAIL
PASS / FAIL
Evidence snippet: <key JSON>
```

---

## 7. Triage guidance (what a failure means)

- **Wrong type chosen** → prompt lacks a clear trigger/usage line for that item, or a competing item's "USE" text is too broad. Fix in the relevant `.md` (compact + detailed).
- **Missing required param** → the item's `REQUIRED`/`MUST` markers are missing/incomplete in the docs (see the mandatory-parameter audit).
- **Wrong placement (loop/endpoint)** → strengthen the `CRITICAL NESTING`/`_childNodes` wording.
- **English endpoint for German prompt** → verify the `LANGUAGE`/endpoint rule is present in both compact + detailed workflow prompts.
- **EP syntax/order wrong** → check the EP's `Param[1..n]` documentation and the trailing-`;` rule.
- **AI invents classes/IDs** → check `formcycle-general.md` / widget `LABELS`/naming rules and the `Sys.Log.Console` XSpan guidance.

Every fix = edit the prompt `.md`, re-run the affected card(s) + related cards (regression), and commit.
