package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.Standard
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons.ExternalAiHttpException
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons.stripThinkTags
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.JsonArray
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.mdl.fdv.EResponseType
import de.xima.fc.mdl.response.ServletResponse
import de.xima.fc.plugin.interfaces.servlet.IPluginServletAction
import de.xima.fc.plugin.models.retval.servlet.PluginServletActionRetVal
import org.slf4j.LoggerFactory

/**
 * AI Form Assistant — servlet that lets the form designer ask an AI to modify the current form
 * structure.
 *
 * Actions dispatched via the `X-Action` request header:
 * - **`Models`** (GET): returns the list of available AI models as a JSON array of
 *   `[{"id":"...","label":"..."}]`.
 * - **`Run`** (POST): accepts `prompt` and `persist` form parameters, sends them to the selected
 *   model (identified by the `X-Model` header), and returns the modified `IPersistJson` as raw
 *   JSON.
 *
 * Exposes the following endpoints through FORMCYCLE's HTTP stack:
 *
 *     GET   <fc>/plugin?name=CodBi_AIFormAssistant   (X-Action: Models)
 *     POST  <fc>/plugin?name=CodBi_AIFormAssistant   (X-Action: Run, X-Model: <modelId>)
 */
class AIFormAssistant : IPluginServletAction {

  private val logger = LoggerFactory.getLogger(AIFormAssistant::class.java)
  private val gson: Gson = GsonBuilder().create()

  override fun getName(): String = "CodBi_AIFormAssistant"

  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    val action =
        params.headerMap.entries.find { it.key.equals("X-Action", ignoreCase = true) }?.value
    return when (action) {
      "Models" -> handleModels()
      "Run" -> handleRun(params)
      else -> jsonResponse("""{"error":"Unknown action"}""")
    }
  }

  private fun handleModels(): IPluginServletActionRetVal {
    val models = Standard.availableModels
    if (models.isEmpty()) {
      return jsonResponse("""{"error":"AI service not available"}""")
    }
    return jsonResponse(gson.toJson(models))
  }

  private fun handleRun(params: IPluginServletActionParams): IPluginServletActionRetVal {
    val modelId =
        params.headerMap.entries.find { it.key.equals("X-Model", ignoreCase = true) }?.value
            ?: return jsonResponse("""{"error":"Missing X-Model header"}""")

    val prompt =
        params.requestParameters["prompt"]?.firstOrNull()
            ?: return jsonResponse("""{"error":"Missing prompt"}""")

    val persistJson =
        params.requestParameters["persist"]?.firstOrNull()
            ?: return jsonResponse("""{"error":"Missing persist"}""")

    try {
      JsonParser.parseString(persistJson)
    } catch (_: Exception) {
      return jsonResponse("""{"error":"Invalid persist JSON"}""")
    }

    val instance = Standard.instance ?: return jsonResponse("""{"error":"AI service not ready"}""")

    val systemPrompt =
        "You are a FORMCYCLE form structure assistant. You receive a partial IPersistJson object " +
            "(styling and image fields have been removed to save tokens) and a natural language " +
            "instruction. Your ONLY output must be the same partial IPersistJson — modified according " +
            "to the instruction — as a raw JSON object. No explanation, no markdown, no code fences.\n\n" +
            "CRITICAL RULES — violating any of these will corrupt the form:\n" +
            "1. PRESERVE every existing item exactly as-is unless the instruction explicitly targets it. " +
            "Do NOT remove, rename, or reorder existing items.\n" +
            "2. The 'items' array is FLAT at the top level — all form elements live here, including " +
            "containers, fieldsets, and their children. Each item's unique identifier is stored in " +
            "'properties.name' (NOT as a top-level 'name' field — items have no top-level 'name'). " +
            "Containers and fieldsets reference their children via 'properties.elements', a sub-array " +
            "of child name strings (NOT the items themselves).\n" +
            "3. When ADDING new items: append them to the top-level 'items' array AND add their name " +
            "to the 'properties.elements' array of the target container/fieldset.\n" +
            "3b. MANDATORY for containers/fieldsets: When the instruction asks you to create a section/group " +
            "that CONTAINS specific input fields, you MUST create ALL child input items in the same response. " +
            "Do NOT output a container with an empty 'elements':[] when the user asked for content inside it. " +
            "Each child item must appear both in the top-level 'items' array AND by name in the container's 'elements'. " +
            "TIME RANGE example — 'a section with a start time and end time': " +
            "items = [..., {XFieldSet name=fsZeit elements=[tfVonUhrzeit,tfBisUhrzeit]}, " +
            "{XTextField name=tfVonUhrzeit datatype=time label=Von}, " +
            "{XTextField name=tfBisUhrzeit datatype=time label=Bis}]\n" +
            "4. Assign unique, descriptive values to new items' 'properties.name'. Use type-appropriate prefixes: \n" +
            "   'tf' for XTextField/XTextArea (e.g. 'tfVorname', 'tfEmail'), \n" +
            "   'fd' for XUpload (e.g. 'fdLebenslauf'), \n" +
            "   'sel' for XSelect, 'cb' for XCheckbox, 'btn' for XButtonList buttons, \n" +
            "   'sig' for XSignature, 'div' for XContainerInvisible.\n" +
            "5. Valid FORMCYCLE element className values (use ONLY these exact strings):\n" +
            "   - XTextField   — single-line text input; set 'datatype' property to validate input (use ONLY these exact values):\n" +
            "     \"\" plain text (default) · \"date\" native date picker · \"dateDE\" date DD.MM.YYYY · \"email\" e-mail ·\n" +
            "     \"phone\" phone number · \"url\" URL · \"time\" time HH:MM · \"number\" decimal number · \"integer\" integer ·\n" +
            "     \"posinteger\" non-negative integer · \"money\" money amount · \"posmoney\" non-negative money ·\n" +
            "     \"posmoneyOptionalComma\" non-negative money (decimal optional) · \"formattedNumber\" number with custom format config ·\n" +
            "     \"plzDE\" German ZIP code · \"ipv4\" IPv4 address · \"onlyLetterNumber\" alphanumeric · \"onlyLetterSp\" letters and spaces ·\n" +
            "     \"regexp\" custom regex (also add datatypeHint property with the regex pattern and error message)\n" +
            "   - XTextArea    — multi-line text input\n" +
            "   - XUpload      — file upload / file download field\n" +
            "   - XSelect      — dropdown / select list; use 'options' array for static items\n" +
            "   - XCheckbox    — checkbox (note: lowercase 'b')\n" +
            "   - XButtonList  — button or button group; no label; 'buttons' array contains button objects each with: " +
            "'name' (technical ID), 'value' (display text, may be HTML), 'action' object. " +
            "WARNING: action.page uses special FORMCYCLE keywords, NOT form page names: " +
            "\"submit\" = submit the form to the server (NOT a page name — do NOT replace with 'p1' or any other page); " +
            "\"previous\" = go back; any page name (e.g. \"p1\") = navigate to that page. " +
            "For a button that sends/submits the form: action.page=\"submit\", action.check=true. " +
            "For a no-action button: omit action or set action.page=\"\"\n" +
            "   - XSpan        — static text / label; text content goes in 'rtevalue', NOT 'label'\n" +
            "   - XImage       — image element\n" +
            "   - XFieldSet    — fieldset / group container; title goes in 'legend', NOT 'label'\n" +
            "   - XContainer          — generic layout container; has no 'label' property\n" +
            "   - XContainerInvisible — invisible/hidden layout container; same as XContainer but not rendered; has no 'label' property\n" +
            "   - XSignature          — signature pad\n" +
            "   - XAppointment        — appointment/calendar picker (do NOT use for date input fields — use XTextField with datatype=\"date\" instead)\n" +
            "   - XLine               — horizontal divider; has no 'label' property\n" +
            "   - XSpacer      — empty spacer; has no 'label' property\n" +
            "   - XPage        — form page (top-level)\n" +
            "   - XHeader      — form header\n" +
            "   - XFooter      — form footer\n" +
            "   Do NOT invent class names. Use ONLY the names listed above.\n" +
            "   NOTE: XContainerInvisible is a valid className even though it looks unusual — use it when you need a hidden container.\n" +
            "6. A 'download/upload field' in FORMCYCLE is className XUpload (NOT XFileUpload).\n" +
            "7. When creating a new item: if the form already contains an item of the same className, " +
            "copy its properties structure exactly and adapt name, id, label, and type-specific values. " +
            "If no item of that type exists yet, use the matching minimal template from ITEM TEMPLATES below.\n" +
            "8. Do NOT include 'css', 'script', 'image', 'images', 'pagePreview', 'rendered', " +
            "'formI18n', or 'metadata' fields — they are handled separately and will be merged back.\n" +
            "9. Output ONLY valid JSON. No trailing commas. No comments.\n" +
            "10. MANDATORY RULE — XButtonList submit button: For any button that submits or sends the form " +
            "(e.g. 'Absenden', 'Senden', 'Einreichen', 'Prüfen und Senden'), use EXACTLY this action: " +
            "{\"page\":\"submit\",\"check\":true,\"customAction\":\"\",\"customClassNames\":\"\",\"displayName\":\"\",\"optionId\":\"submit + check\",\"value\":\"\"}. " +
            "The string 'submit' is a FORMCYCLE server-side command — it is NOT a page name and must NEVER " +
            "be replaced with any page name you see in the form (e.g. 'p1', 'p2', etc.). " +
            "WRONG: action={\"page\":\"p1\",\"check\":true,\"optionId\":\"p1 + check\"} ← do not do this. " +
            "CORRECT: action={\"page\":\"submit\",\"check\":true,\"optionId\":\"submit + check\"} ← always use this for submit buttons.\n\n" +
            "10b. CONTAINER FOR CONDITIONALLY SHOWN FIELDS — When the prompt describes a field that should be shown or hidden based on a condition (wenn...dann..., if...then...), wrap that field in an XContainer. The container becomes the target of the conditional functionality — do NOT apply show/hide directly on the form field itself. You MUST create BOTH the container AND the child field as separate items in the top-level 'items' array, AND reference the child by name in the container's 'elements' array. Example: add XContainer coErziehungsberechtigter with elements=[\"tfNameDesErziehungsberechtigten\"] to the items array AND also add XTextField tfNameDesErziehungsberechtigten as a separate item in the same items array. Rule 3 and 3b apply — do NOT create a container with an empty elements array.\n\n" +
            "10c. MATOMO TRACKING — When the prompt says \"Matomo-Tracking aktivieren\" or \"activate Matomo tracking\" without specifying a SiteID, do NOT add Matomo.Tracking functionality via data-cb-func on any element. " +
            "Do NOT include Matomo.Tracking in _codbiApplicability.considered. " +
            "Do NOT include Matomo.Tracking in _codbiApplicability.applied. " +
            "Instead, include {\"id\":\"Holistic.Matomo.Tracking\",\"targets\":[]} in _codbiApplicability.applied — the server reads this and activates the standard configuration. " +
            "Only apply Matomo.Tracking functionality with data-cb-SiteID when a SiteID IS explicitly specified in the prompt.\n\n" +
            "DATE FIELDS — Use XTextField with datatype=\"date\" (NOT XAppointment) for any field whose label refers to a date: " +
            "e.g. 'Datum', 'Geburtsdatum', 'Eintrittstermin', 'Termin', 'Abgabedatum', 'Anfangsdatum', 'Enddatum', 'date', 'birthday', 'start date', 'end date', 'due date'. " +
            "Example: label 'Geburtsdatum' → XTextField with datatype=\"date\"; label 'Frühestmöglicher Eintrittstermin' → XTextField with datatype=\"date\".\n" +
            "\n" +
            "ITEM TEMPLATES — minimal valid structure for each className (adapt name/id/label).\n" +
            "WARNING for XButtonList template: the value 'submit' in action.page is a literal server command, " +
            "NOT a placeholder. Do NOT change it. Copy the template exactly for submit buttons.\n" +
            """{"className":"XTextField","properties":{"name":"tfExample","id":"xi-tf-example","label":"Example","required":"0","readonly":"0","placeholder":"","datatype":"","fullwidth":"0"}}""" +
            "\n" +
            "   ← For DATE fields set datatype=\"date\": " +
            """{"className":"XTextField","properties":{"name":"tfGeburtsdatum","id":"xi-tf-geburtsdatum","label":"Geburtsdatum","required":"0","readonly":"0","placeholder":"","datatype":"date","fullwidth":"0"}}""" +
            "\n" +
            "   ← For NUMBER fields set datatype=\"formattedNumber\": " +
            """{"className":"XTextField","properties":{"name":"tfBetrag","id":"xi-tf-betrag","label":"Betrag","required":"0","readonly":"0","placeholder":"","datatype":"formattedNumber","fullwidth":"0"}}""" +
            "\n" +
            "   ← For EMAIL fields set datatype=\"email\": " +
            """{"className":"XTextField","properties":{"name":"tfEmail","id":"xi-tf-email","label":"E-Mail","required":"0","readonly":"0","placeholder":"","datatype":"email","fullwidth":"0"}}""" +
            "\n" +
            "   ← For PHONE fields set datatype=\"phone\": " +
            """{"className":"XTextField","properties":{"name":"tfTelefon","id":"xi-tf-telefon","label":"Telefon","required":"0","readonly":"0","placeholder":"","datatype":"phone","fullwidth":"0"}}""" +
            "\n" +
            "   ← For TIME fields set datatype=\"time\": " +
            """{"className":"XTextField","properties":{"name":"tfUhrzeit","id":"xi-tf-uhrzeit","label":"Uhrzeit","required":"0","readonly":"0","placeholder":"","datatype":"time","fullwidth":"0"}}""" +
            "\n" +
            "   ← For INTEGER/COUNT fields set datatype=\"integer\": " +
            """{"className":"XTextField","properties":{"name":"tfAnzahl","id":"xi-tf-anzahl","label":"Anzahl","required":"0","readonly":"0","placeholder":"","datatype":"integer","fullwidth":"0"}}""" +
            "\n" +
            "   ← For URL fields set datatype=\"url\": " +
            """{"className":"XTextField","properties":{"name":"tfUrl","id":"xi-tf-url","label":"URL","required":"0","readonly":"0","placeholder":"","datatype":"url","fullwidth":"0"}}""" +
            "\n" +
            "   ← For GERMAN ZIP CODE fields set datatype=\"plzDE\": " +
            """{"className":"XTextField","properties":{"name":"tfPlz","id":"xi-tf-plz","label":"PLZ","required":"0","readonly":"0","placeholder":"","datatype":"plzDE","fullwidth":"0"}}""" +
            "\n" +
            """{"className":"XTextArea","properties":{"name":"tfExample","id":"xi-tf-example","label":"Example","required":"0","readonly":"0","placeholder":"","fullwidth":"0","autosize":"0"}}""" +
            "\n" +
            """{"className":"XUpload","properties":{"name":"fdExample","id":"xi-fd-example","label":"Example","required":"0","fileextension":"","fullwidth":"0"}}""" +
            "\n" +
            """{"className":"XSelect","properties":{"name":"fdExample","id":"xi-fd-example","label":"Example","required":"0","fullwidth":"0","options":[]}}""" +
            "\n" +
            """{"className":"XCheckbox","properties":{"name":"fdExample","id":"xi-fd-example","label":"Example","required":"0","checkboxvalue":"1","checkedvalue":"1"}}""" +
            "\n" +
            """{"className":"XButtonList","properties":{"name":"btlExample","id":"xi-btl-example","buttons":[{"name":"btnExample","value":"Button Text","action":{"page":"submit","check":true,"customAction":"","customClassNames":"","displayName":"","optionId":"submit + check","value":""}}]}}""" +
            "\n" +
            "   CRITICAL — for XButtonList: the 'action' property of each button object is ALWAYS a JSON object (never a string). " +
            "Valid 'optionId' values: \"submit + check\", \"submit\", \"previous\", \"custom\". Do NOT use strings like \"sendmail\" or \"submit_form\" as 'action'. " +
            "IMPORTANT: action.page=\"submit\" is a special FORMCYCLE server-submit command, NOT a page name. " +
            "Never replace \"submit\" with a page name like \"p1\" — doing so turns the button into a navigation button instead of a form-submission button. " +
            "EXCEPTION to rule 7: do NOT copy action.page from existing buttons — always set it based on the button's purpose." +
            "\n" +
            """{"className":"XSpan","properties":{"name":"fdExample","id":"xi-fd-example","rtevalue":"Example text"}}""" +
            "\n" +
            """{"className":"XFieldSet","properties":{"name":"fsExample","id":"xi-fs-example","legend":"Group","elements":[],"fullwidth":"0"}}""" +
            "\n" +
            """{"className":"XContainer","properties":{"name":"coExample","id":"xi-co-example","elements":[],"fullwidth":"0"}}""" +
            "\n" +
            "   ← For COLLAPSIBLE containers (\"aus- und einklappbar\", \"auf- und zuklappbar\"): add attributes with data-cb-func=html.panel, data-cb-generateheader=\"true\" and data-cb-autoheadertitle (see COLLAPSIBLE XCONTAINERS rule below). Do NOT use panel CSS classes — they only work on XFieldSet.\n" +
            "\n" +
            """{"className":"XSignature","properties":{"name":"fdExample","id":"xi-fd-example","label":"Example","required":"0"}}""" +
            "\n" +
            """{"className":"XAppointment","properties":{"name":"apExample","id":"xi-ap-example","label":"Example","required":"0","fullwidth":"0"}}""" +
            "\n" +
            """{"className":"XContainerInvisible","properties":{"name":"divExample","id":"xi-div-example","elements":[],"fullwidth":"0"}}""" +
            "\n" +
            "   ← For COLLAPSIBLE containers (\"aus- und einklappbar\", \"auf- und zuklappbar\"): add attributes with data-cb-func=html.panel, data-cb-generateheader=\"true\" and data-cb-autoheadertitle (see COLLAPSIBLE XCONTAINERS rule below). Do NOT use panel CSS classes — they only work on XFieldSet.\n" +
            "\n" +
            """{"className":"XLine","properties":{"name":"liExample","id":"xi-li-example"}}""" +
            "\n" +
            """{"className":"XSpacer","properties":{"name":"spExample","id":"xi-sp-example"}}""" +
            "\n\n" +
            "11. CSS CLASSES — You can apply CodBi CSS classes to form elements by adding a \"cssclasses\" array to the element's \"properties\". " +
            "The matching standard configuration is auto-activated server-side. " +
            "IMPORTANT — TWO-OPTION RULE:\n" +
            "CSS classes exist ONLY for the specific patterns listed below under 'Available CSS classes'. " +
            "For EVERY field you modify, you have exactly TWO options — pick ONE:\n" +
            "  OPTION A — CSS class exists in the list below → use it (e.g. CodBi_People_Name for a name field)\n" +
            "  OPTION B — No matching CSS class in the list → use data-cb-func (e.g. Form.Navigator has NO CSS class → data-cb-func=form.navigator)\n" +
            "CRITICAL: NEVER invent CSS class names. If a CSS class is not in the list below, it does NOT exist — use data-cb-func instead.\n" +
            "APPLICATION RULES:\n" +
            "   a) Apply AT MOST ONE CSS class per field — do NOT stack multiple classes on the same element.\n" +
            "   b) Only apply a CSS class when it has an EXACT match to the field's purpose. If no class matches, use data-cb-func.\n" +
            "   c) For Time/Date frame ranges: When a CodBi_TimeFrame_N_Begin/End or CodBi_DateFrame_N_Begin/End CSS class exists (N=1-5), use it. FALLBACK: If all 5 numbers are already used, use data-cb-func=time.frame (or date.frame). When using a frame CSS class, do NOT add data-cb-func=time.frame or data-cb-func=date.frame — that would be redundant. However, you MAY add data-cb-func for a DIFFERENT functionality (e.g. CodBi_DateFrame_1_Begin + data-cb-func=date.noweekends is valid).\n" +
            "   d) NUMBERING — When creating frame CSS classes, scan existing form items for which N (1-5) are already used. Use the lowest unused N for each pair. If all 5 taken, use data-cb-func.\n" +
            "   e) Do NOT use CodBi_People_Alphanumeric on street names, localities, or other non-alphanumeric-code fields.\n" +
            "   f) REDUNDANCY RULE: When a field's datatype already triggers a Holistic.Cleave.* standard (phone→Cleave.Phone, plzDE→Cleave.PLZ, dateDE/time→Cleave.Date/Time), do NOT apply the equivalent People CSS class:\n" +
            "      - Phone fields (datatype=\"phone\"): do NOT apply CodBi_People_Phone — Cleave handles formatting.\n" +
            "      - Postal code fields (datatype=\"plzDE\"): do NOT apply CodBi_People_PLZ — Cleave handles formatting.\n" +
            "      - Date fields (datatype=\"dateDE\" or \"date\"): do NOT apply formatting People classes — Cleave handles it.\n" +
            "   g) Street names and locality/city names have no dedicated People CSS class — leave them without a CSS class.\n" +
            "   h) Form.Navigator AUTO-GENERATES navigation buttons — When applying data-cb-func=form.navigator to a container, do NOT add XButtonList or any manual button elements for page navigation. The Form.Navigator functionality creates them automatically.\n" +
            "Example: {\"className\":\"XTextField\",\"properties\":{\"name\":\"tfVorname\",\"label\":\"Vorname\",\"cssclasses\":[\"CodBi_People_Name\"]}}.\n" +
            "Available CSS classes by standard:\n\n" +
            "=== People === CodBi_People_Name (names only), CodBi_People_Alphanumeric (codes/IDs only), Mail, Phone, PLZ (postal codes, use alone), 18plus, 16plus, BuildingNumber\n" +
            "=== Financial === CodBi_Currency\n" +
            "=== Appointments === CodBi_NoFutureDate, DateFrame_N_Begin/End, TimeFrame_N_Begin/End (N=1-5; no data-cb-func=date.frame/time.frame needed — the CSS class provides that. You MAY still add data-cb-func for a DIFFERENT functionality like date.noweekends)\n" +
            "=== LDAP.Autofill === CodBi_LDAP_AC_*\n" +
            "=== AI === AI_LLAMA_CHAT_*, AI_LLAMA_STANDARD_QA_Question, AI_LLAMA_STANDARD_TXTQA_Question, AI_LLAMA_TXTQA_Source, AI_LLAMA_QA_Exclude, AI_OCR_Receiver\n" +
            "=== UI.Panels === CodBi_HTML_Panel_Standard (default), CodBi_HTML_Panel_Flat, CodBi_HTML_Panel_Index, CodBi_HTML_Panel_Minimal for standalone panels; CodBi_Accordion_A/B/C/D for accordions. CodBi_HTML_Panel_NoCordion is a marker class for panels inside an accordion that should NOT participate in the accordion behavior.\n" +
            "CRITICAL — AI.OCR with Mode=\"print\": do NOT set data-cb-Field on the upload. The receiver text field is identified by its AI_OCR_Receiver CSS class, not by data-cb-Field. Example — XUpload has only data-cb-func and data-cb-mode (NO data-cb-Field):\n" +
            "{\"className\":\"XUpload\",\"properties\":{\"name\":\"fdDocument\",\"label\":\"Document\",\"attributes\":[{\"text\":\"data-cb-func\",\"value\":\"ai.ocr\"},{\"text\":\"data-cb-mode\",\"value\":\"print\"}]}},\n" +
            "{\"className\":\"XTextField\",\"properties\":{\"name\":\"tfExtractedText\",\"label\":\"Extracted Text\",\"cssclasses\":[\"AI_OCR_Receiver\"]}}\n" +
            "CRITICAL — Panel CSS classes ONLY work on XFieldSet (fieldset), NOT on XContainer or XContainerInvisible. A fieldset has a 'legend' property that becomes the panel header. A container has NO legend — applying a panel CSS class to a container produces a panel WITHOUT a visible title. Therefore, for containers (XContainer, XContainerInvisible) that need to be a panel, ALWAYS use data-cb-func=html.panel via the attributes array with data-cb-generateheader=\"true\" and a data-cb-autoheadertitle. If the user's prompt specifies a title, use that as the data-cb-autoheadertitle value; otherwise generate a descriptive title from the container's content (e.g. \"Geburtsdatum\" for a date-of-birth section, \"Anschrift\" for an address section). For nested panels use different CSS classes per level (e.g. outer on fieldset: CodBi_HTML_Panel_Standard, inner on fieldset: CodBi_HTML_Panel_Flat).\n" +
            "CRITICAL — COLLAPSIBLE XCONTAINERS: When the user asks for a collapsible, expandable, or foldable container (\"aus- und einklappbar\", \"auf- und zuklappbar\", \"accordion\") and the container is an XContainer (div), use data-cb-func=html.panel via the attributes array (as {\"text\":\"data-cb-func\",\"value\":\"html.panel\"}). ALSO set data-cb-generateheader=\"true\" (as {\"text\":\"data-cb-generateheader\",\"value\":\"true\"}) and data-cb-autoheadertitle in the attributes array (as {\"text\":\"data-cb-autoheadertitle\",\"value\":\"Your Title\"}) to define the panel\'s header title. If the user\'s prompt specifies a title use that, otherwise generate a descriptive title from the container\'s content (e.g. \"Geburtsdatum\" for a date-of-birth section, \"Anschrift\" for an address section).\n" +
            "Folded state: By default the panel starts unfolded. Only add data-cb-folded=\"true\" (as {\"text\":\"data-cb-folded\",\"value\":\"true\"}) if the user explicitly wants the panel to start collapsed.\n" +
            "COLLAPSIBLE FIELDSETS: This does NOT apply to XFieldSet (fieldset). For fieldsets, the panel automatically uses the fieldset\'s legend as the title. Use the CSS class CodBi_HTML_Panel_Standard on the fieldset instead (no data-cb-func=html.panel needed — the CSS class triggers the standard configuration which provides the HTML.Panel behavior).\n" +
            "XContainer example: {\"className\":\"XContainer\",\"properties\":{\"name\":\"coGeburtsdatum\",\"id\":\"xi-co-geburtsdatum\",\"elements\":[\"tfGeburtsdatum\"],\"fullwidth\":\"0\",\"attributes\":[{\"text\":\"data-cb-func\",\"value\":\"html.panel\"},{\"text\":\"data-cb-generateheader\",\"value\":\"true\"},{\"text\":\"data-cb-autoheadertitle\",\"value\":\"Geburtsdatum\"}]}}\n" +
            "XFieldSet example (CSS class, no data-cb-func needed): {\"className\":\"XFieldSet\",\"properties\":{\"name\":\"fsGeburtsdatum\",\"id\":\"xi-fs-geburtsdatum\",\"legend\":\"Geburtsdatum\",\"elements\":[\"tfGeburtsdatum\"],\"fullwidth\":\"0\",\"cssclasses\":[\"CodBi_HTML_Panel_Standard\"]}}\n" +
            "=== Print.Removal === CodBi_Print_Remove_*\n" +
            "=== BayVIS === CodBi_BayVIS_*\n" +
            "=== OpenPLZ.AC.SET === CodBi_OpenPLZ_AC_SET_*\n" +
            "=== Holistic === CodBi_XCL_Speech, CodBi_XCL_Speech_Whisper\n" +
            "When the instruction asks for a specific field type that matches a CSS class above, " +
            "add the corresponding CSS class following the rules above. " +
            "REMINDER: CSS classes ONLY exist for the domains listed above. For everything else, use data-cb-func. Never invent CSS class names.\n\n" +
            "CODBI CANDIDATE REVIEW — while designing the form output, scan the CODBI CORE ELEMENTS (COMPACT) list at the end of this prompt. " +
            "For each listed element, use your judgment to decide if a functionality is useful for a field. Consider BOTH whether it could benefit AND whether it would be inappropriate (e.g. Date.NoWeekends makes sense for job appointments but NOT for birthdays). Only mark candidates that are genuinely appropriate. " +
            "Examples: a begin/end time pair → Time.Frame; a begin/end date pair → Date.Frame; text field needing format validation → HTML.Input.REGEX (XTextField ONLY — do NOT apply to XUpload); upload field needing content extraction as a whole → AI.OCR with Mode=\"print\" and create XTextField with cssclasses [\"AI_OCR_Receiver\"] to receive the extracted text; upload field needing content validation → AI.OCR with Mode=\"verify\", Pattern=^<regex>, RegExFlags=\"gi\", WrongFileMessage=\"...\", InvalidImageText=\"...\" (ALWAYS set all five for verify; write messages in the EXACT language of the user's request; prefix Pattern with ^ when regex contains curly braces); German address flow → OpenPLZ.Autocomplete; container/navigation bar → Form.Navigator; input auto-capitalize words → HTML.Input.Trans.Capital; number-to-words conversion → HTML.Input.Trans.NTW — set data-cb-NumberWords to the digit words in the EXACT language of the user's request (e.g. English: zero,one,two,three,four,five,six,seven,eight,nine; German: Null,Eins,Zwei,Drei,Vier,Fünf,Sieben,Acht,Neun); set CSS property on element → HTML.SETAttribute (Name=\"style\" ToSet=CSS value). JSON.SET fallback only on explicit user request. console output / in der Konsole ausgeben / debug logging → Sys.Log.Console. Create an XContainerInvisible (name prefix div) at the top of the first page's elements array, set data-cb-func=\"Sys.Log.Console\" and data-cb-Data to what to log (can use EPs like \"{ Date.Weekends > 01.01.2000 ; 31.12.2002 }\" for weekend dates). This keeps the functionality accessible in the designer. Do NOT create a workflow for this. Matomo tracking aktivieren / activate tracking → standard configuration activation, NOT a workflow. LDAP container → LDAP.Autocomplete.Set on the CONTAINER (XFieldSet/XContainer), LDAP.Autocomplete on each individual field inside it. Without SiteID: include ONLY \"Holistic.Matomo.Tracking\" in _codbiApplicability.applied (not \"Matomo.Tracking\" anywhere) (as {\"id\":\"Holistic.Matomo.Tracking\",\"targets\":[]}). With SiteID: apply Matomo.Tracking functionality on the form header with data-cb-SiteID and data-cb-URL. wenn...dann... / if...then... conditions → OnChange.Conditional on the trigger field. Reference=\"{ Date.Today > -18y }\" for age rules. Mode options: GT=Greater Than, GTEQ=Greater Than or Equal, LT=Lower Than, LTEQ=Lower Than or Equal, EQ=Equal, NEQ=Not Equal. LOGIC: GT means candidate date is LATER/MORE RECENT than reference (date less than 18y in past → GT). LT means candidate date is EARLIER (date more than 18y in past → LT). Target=dot-prefixed container CSS selector. Candidate=dot-prefixed field selector. DateFormat=DD.MM.YYYY for dateDE. _T_* parameters apply functionality to Target when TRUE: _T_FUNC (any functionality ID), _T_Name, _T_ToSet, etc. _F_* similar for FALSE. Show/hide example: _T_FUNC=HTML.SETAttribute _T_Name=style _T_ToSet=\"width:100%;display:block;\" _F_ToSet=\"width:100%;display:none;\". EDGE CASE: when OnChange.Conditional must show/hide a single field, wrap that field in an XContainer and target the container instead. CRITICAL: Date.Min forbids selecting past dates (input validation). OnChange.Conditional applies a functionality to a target based on a condition. WENN...DANN... anzeigen/ausblenden → use OnChange.Conditional, NOT Date.Min, NOT CodBi_People_18plus. Image cropper → Media.Image.Cropper on the prompted container. Generate SIBLINGS: CodBi_Fotocropper_Board div (height:25em), CodBi_Fotocropper_Uploader input, CodBi_Fotocropper_Update button, CodBi_Fotocropper_ImageURL input (right of button), CodBi_Fotocropper_Foto img. Board contains NO other elements. Element unsichtbar im Druck / hidden when printing → add CSS class \"CodBi_Print_Remove_Tagged\" to the element's cssclasses array. print parent (including label) → add CSS class \"CodBi_Print_Remove_Parent\". Nur im Druck sichtbar / only visible when printing → add CSS class \"CodBi_Print_Remove_PrintOnly\". " +
            "Any prompt asking to \"replace placeholders\" or \"fill in\" dynamic content from an EP (like \"{ Data.CSV > { Net.URL > ... }}\") into an element → HTML.Text.Injector on the target element. Set data-cb-replacement to the EP expression AS-IS (do NOT resolve it), data-cb-placeholder to the placeholder string verbatim (copy it character-for-character from the element's content — e.g. \"<<PH>>\", \"[[PH]]\", \"##VALUE##\", \"{{name}}\", whatever it literally is). CRITICAL: do NOT change the brackets or formatting; if the text has \"[[PH]]\" set \"[[PH]]\", not \"[%PH%]\". data-cb-property=\"innerHTML\". Keep the element's rtevalue unchanged. " +
            "Return the form JSON with ALL attributes and CSS classes included directly. " +
            "CRITICAL — Do NOT include CodBi_AI_OCR_Receiver in _codbiApplicability.considered or _codbiApplicability.applied. The CodBi_AI_OCR_Receiver class goes only in the element's cssclasses array. " +
            "Standard configuration activation: if the prompt requests Matomo tracking " +
            "WITHOUT a SiteID, include {\"id\":\"Holistic.Matomo.Tracking\",\"targets\":[]} " +
            "in the \"applied\" array.\n" +
            "Return the form JSON normally. Include a top-level \"_codbiApplicability\" field with these exact keys: " +
            "{\"formElementsProcessed\":4,\"codbiElementsEvaluated\":23 (replace 4 with actual field count; replace 23 with how many CODBI CORE ELEMENTS list entries you read)," +
            "\"considered\":[{\"id\":\"CodBi.ID\",\"targets\":[\"formElementId\", ...]}] (functionality IDs ONLY — e.g. AI.OCR for upload, HTML.Input.REGEX for text field — do NOT put CSS class names here)," +
            "\"applied\":[{\"id\":\"Holistic.Matomo.Tracking\",\"targets\":[]}] (standard configuration names ONLY — e.g. Holistic.Matomo.Tracking when applicable)," +
            "\"skipped\":[]}. " +
            "\n" +
            CodbiCapabilities.buildSection()

    val userContent =
        "Instruction: $prompt\n\nCurrent form (IPersistJson):\n${slimPersistJson(persistJson)}" +
            "\n\nREMINDER: your response MUST include a top-level \"_codbiApplicability\" field as described in the system prompt."

    val messagesJson = buildString {
      append("[")
      append("""{"role":"system","content":${gson.toJson(systemPrompt)}},""")
      append("""{"role":"user","content":${gson.toJson(userContent)}}""")
      append("]")
    }

    logger.debug(
        "[AIFormAssistant] Sending form AI request — system prompt: {} chars, CodBi section present: {}",
        systemPrompt.length,
        systemPrompt.contains("CODBI CANDIDATE REVIEW"))
    val rawResponse =
        try {
          instance.performFormAssist(modelId, messagesJson)
        } catch (e: ExternalAiHttpException) {
          logger.warn("[AIFormAssistant] External AI returned HTTP {}: {}", e.httpStatus, e.body)
          return jsonResponse("""{"error":${gson.toJson("AI error: ${e.message}")}}""")
        } catch (e: Exception) {
          logger.error("[AIFormAssistant] AI call failed", e)
          return jsonResponse("""{"error":${gson.toJson("AI error: ${e.message}")}}""")
        }

    val withoutThinkTags = stripThinkTags(rawResponse)
    var cleaned = extractJson(withoutThinkTags)

    fun rerunWithCodbiDetails(requested: List<String>): String {
      val pass1Obj =
          try {
            JsonParser.parseString(cleaned).asJsonObject
          } catch (_: Exception) {
            null
          }
      val allItems = pass1Obj?.getAsJsonArray("items") ?: JsonArray()

      val retryMessagesJson: String

      if (requested.isEmpty()) {
        // Blind rethink pass: AI previously concluded nothing applies — ask it to reconsider.
        // Use the full compact API reference (including parameter names) so the AI can
        // generate correct data-cb-* parameter attributes instead of inventing names.
        val rethinkSystemPrompt =
            "You are a CodBi form element configurator. " +
                "Your previous evaluation of the following FORMCYCLE form elements concluded that no CodBi functionalities apply. " +
                "Please reconsider carefully. Review each element's className and properties and check whether any functionality from the list below is applicable. " +
                "If a functionality applies: add data-cb-func to the element's properties (as CSV if multiple), and set any required data-cb-* attributes. " +
                "ADDITIONALLY, you MUST also set CSS classes on elements where applicable. " +
                "To set a CSS class: add a \"cssclasses\" array to the element's \"properties\" (e.g. \"cssclasses\":[\"CodBi_People_Name\"]). " +
                "RULES — TWO-OPTION RULE: CSS classes exist ONLY in the list below. For each field, pick ONE: (A) exact CSS class match exists → use it; (B) no CSS class → use data-cb-func. NEVER invent CSS class names. (a) Apply AT MOST ONE CSS class per field. (b) Only apply on EXACT match. (c) For Time/Date frames: use CSS class when available (N=1-5); fallback to data-cb-func if all 5 used. When using a CSS class, do NOT add data-cb-func for the SAME behavior — but MAY add data-cb-func for a DIFFERENT functionality (e.g. CodBi_DateFrame_1_Begin + data-cb-func=date.noweekends). (d) CSS class replaces data-cb-func ONLY for same behavior. (e) Do NOT use CodBi_People_Alphanumeric on street names, localities, or postal codes. (f) REDUNDANCY: Phone/PLZ/Date Cleave auto → no People CSS. (g) Street names/localities have no CSS class. (h) NUMBERING: Scan used N values, use lowest unused N for new frame pairs. (i) Form.Navigator AUTO-GENERATES navigation buttons — do NOT add XButtonList or manual page-navigation buttons. The functionality creates them automatically. (j) For panels and accordions: CodBi_HTML_Panel_* CSS classes exist — use them. Do NOT add data-cb-func=html.panel when using a panel CSS class. (k) CRITICAL — HTML.Select.Favorites: ALWAYS add data-cb-initialElement (value of the FIRST option's value property) to the XSelect's attributes array. Example: first option {\"text\":\"Bayern\",\"value\":\"Bayern\"} → add {\"text\":\"data-cb-initialElement\",\"value\":\"Bayern\"}.\n" +
                "=== People === CodBi_People_Name (names only), Alphanumeric (codes only), Mail, Phone, PLZ (alone), 18plus, 16plus, BuildingNumber\n" +
                "=== Financial === CodBi_Currency\n" +
                "=== Appointments === CodBi_NoFutureDate, DateFrame_N_Begin/End (N=1-5), TimeFrame_N_Begin/End (N=1-5) — fallback to data-cb-func if all 5 used\n" +
                "=== LDAP.Autofill === CodBi_LDAP_AC_*, AI === AI_LLAMA_*, AI_OCR_*\n" +
                "=== UI.Panels === CodBi_HTML_Panel_Standard, CodBi_HTML_Panel_Flat, CodBi_HTML_Panel_Index, CodBi_HTML_Panel_Minimal, CodBi_HTML_Panel_NoCordion for panels; CodBi_Accordion_A/B/C/D for accordions. Use CSS class for standard panels. Use data-cb-func=html.panel for custom CSS/title. Nested panels: different classes per level.\n" +
                "CRITICAL — COLLAPSIBLE XCONTAINERS: When the user asks for a collapsible/expandable/foldable container and it is an XContainer (div), use data-cb-func=html.panel via the attributes array. ALSO set data-cb-generateheader=\"true\" and data-cb-autoheadertitle for the title (from the prompt or auto-generated). For XFieldSet (fieldset), use the CSS class CodBi_HTML_Panel_Standard instead — the legend provides the title. Only add data-cb-folded=\"true\" if the user explicitly wants the panel to start collapsed.\n" +
                "=== Print.Removal === CodBi_Print_Remove_*\n" +
                "=== BayVIS === CodBi_BayVIS_*\n" +
                "=== OpenPLZ.AC.SET === CodBi_OpenPLZ_AC_SET_*\n" +
                "CRITICAL: CSS classes ONLY exist for the domains listed above. For any functionality NOT listed here (e.g. Form.Navigator, OpenPLZ.Autocomplete, Date.Min, Date.NoWeekends, HTML.Input.REGEX, HTML.CSS, etc.), there is NO CSS class — you MUST use data-cb-func. NEVER invent CSS class names.\n" +
                "Respond ONLY with a JSON object: " +
                "{\"items\":[...all elements, modified where CodBi applies...],\"_codbiApplicability\":{\"formElementsProcessed\":N,\"codbiElementsEvaluated\":23 (replace counts)," +
                "\"considered\":[{\"id\":\"CodBi.ID\",\"targets\":[\"elementId\",...]}]," +
                "\"applied\":[{\"id\":\"CodBi.ID\",\"targets\":[\"elementId\",...]}]," +
                "\"skipped\":[{\"id\":\"CodBi.ID\",\"targets\":[\"elementId\",...],\"reason\":\"...\"}]}}. " +
                "No explanation, no markdown, no code fences.\n\n" +
                "ORIGINAL USER REQUEST: ${gson.toJson(prompt)}\n\n" +
                "FORM ELEMENTS:\n${gson.toJson(allItems)}" +
                CodbiCapabilities.buildFullSection()

        logger.info(
            "[AIFormAssistant] Blind rethink pass — sending {} item(s) with compact CodBi reference (system-only)",
            allItems.size())
        if (allItems.size() == 0) {
          logger.warn(
              "[AIFormAssistant] Blind rethink pass has 0 items — pass-1 items array may be missing or empty")
        }

        retryMessagesJson = buildString {
          append("[")
          append("""{"role":"system","content":${gson.toJson(rethinkSystemPrompt)}}""")
          append("]")
        }
      } else {
        // Targeted rerun: AI identified candidates but did not apply full details — send specific
        // elements with full TSDoc for the requested functionality IDs.
        val candidateClause = requested.joinToString(", ")
        val targetElementIds = extractConsideredElementTargets(cleaned)
        val targetItems =
            if (targetElementIds.isEmpty()) {
              allItems
            } else {
              // Expand target IDs to include:
              // 1. Child elements of targeted containers/fieldsets (e.g. targeting a fieldset for
              //    OpenPLZ.Autocomplete should also send its child text fields)
              // 2. Sibling elements of targeted items (e.g. targeting one time field for Time.Frame
              //    should also send the other time field so the AI can set cross-referencing
              // params)
              val expandedIds = targetElementIds.toMutableSet()
              // Build a map of item name -> parent container name for all items
              val parentOfItem = mutableMapOf<String, String>()
              for (item in allItems) {
                if (!item.isJsonObject) continue
                val containerName =
                    item.asJsonObject.getAsJsonObject("properties")?.get("name")?.asString
                        ?: continue
                val elements =
                    item.asJsonObject.getAsJsonObject("properties")?.getAsJsonArray("elements")
                        ?: continue
                for (nameEl in elements) {
                  if (nameEl.isJsonPrimitive) parentOfItem[nameEl.asString] = containerName
                }
              }
              // Build a map of container name -> list of child item names
              val childrenOf = mutableMapOf<String, List<String>>()
              for (item in allItems) {
                if (!item.isJsonObject) continue
                val containerName =
                    item.asJsonObject.getAsJsonObject("properties")?.get("name")?.asString
                        ?: continue
                val elements =
                    item.asJsonObject.getAsJsonObject("properties")?.getAsJsonArray("elements")
                        ?: continue
                childrenOf[containerName] =
                    elements.mapNotNull { e -> if (e.isJsonPrimitive) e.asString else null }
              }
              for (item in allItems) {
                if (!item.isJsonObject) continue
                val itemId =
                    item.asJsonObject.getAsJsonObject("properties")?.get("id")?.asString ?: continue
                val itemName =
                    item.asJsonObject.getAsJsonObject("properties")?.get("name")?.asString
                        ?: continue
                if (itemId in targetElementIds) {
                  // Step 1: Expand children of targeted containers
                  val elements =
                      item.asJsonObject.getAsJsonObject("properties")?.getAsJsonArray("elements")
                          ?: emptyList()
                  for (nameEl in elements) {
                    if (!nameEl.isJsonPrimitive) continue
                    val childName = nameEl.asString
                    val child =
                        allItems.firstOrNull { childItem ->
                          childItem.isJsonObject &&
                              childItem.asJsonObject
                                  .getAsJsonObject("properties")
                                  ?.get("name")
                                  ?.asString == childName
                        }
                    if (child != null) {
                      val childId =
                          child.asJsonObject.getAsJsonObject("properties")?.get("id")?.asString
                      if (childId != null) expandedIds.add(childId)
                    }
                  }
                  // Step 2: Expand siblings of targeted items (same parent)
                  val parentName = parentOfItem[itemName]
                  if (parentName != null) {
                    val siblings = childrenOf[parentName] ?: emptyList()
                    for (sibName in siblings) {
                      if (sibName == itemName) continue
                      val sib =
                          allItems.firstOrNull { sibItem ->
                            sibItem.isJsonObject &&
                                sibItem.asJsonObject
                                    .getAsJsonObject("properties")
                                    ?.get("name")
                                    ?.asString == sibName
                          }
                      if (sib != null) {
                        val sibId =
                            sib.asJsonObject.getAsJsonObject("properties")?.get("id")?.asString
                        if (sibId != null) expandedIds.add(sibId)
                      }
                    }
                  }
                }
              }
              JsonArray().also { arr ->
                for (item in allItems) {
                  if (!item.isJsonObject) continue
                  val itemId = item.asJsonObject.getAsJsonObject("properties")?.get("id")?.asString
                  if (itemId != null && itemId in expandedIds) arr.add(item)
                }
              }
            }

        val applySystemPrompt =
            "You are a CodBi form element configurator. " +
                "You receive a JSON array of FORMCYCLE form element objects. Each element has a \"className\" and a \"properties\" object (which includes \"id\"). " +
                "Apply the CodBi functionalities listed below to the appropriate elements. " +
                "To apply a functionality: set data-cb-func in the element's properties as CSV (create the key if absent). " +
                "CRITICAL — All REQUIRED parameters MUST be set as data-cb-ParamName attributes. Parameters documented as 'Optional — ... Only set if ... Leave empty otherwise — do NOT invent values' should be OMITTED entirely (not set to empty, not created at all) unless the user explicitly asks for that feature. " +
                "Use the element's property values to infer sensible parameter values: " +
                "  - For CSS-Selector parameters (e.g. MaxField, MinField): use the CSS selector constructed from the target element's properties.name prefixed with '#', e.g. \"#tfBisUhrzeit\". Use the element's 'properties.name' to construct the selector, NOT the 'properties.id' value with 'xi-' prefix. " +
                "  - For string parameters (e.g. Country, MsgNotKnown): set a reasonable default based on the form context. " +
                "  - For boolean parameters (e.g. EqualityPermitted): set a reasonable default. " +
                "Set data-cb-* parameter attributes as documented. " +
                "ADDITIONALLY, you MUST also set CSS classes on elements where applicable. " +
                "To set a CSS class: add a \"cssclasses\" array to the element's \"properties\" (e.g. \"cssclasses\":[\"CodBi_People_Name\"]). " +
                "RULES — TWO-OPTION RULE: CSS classes exist ONLY in the list below. For each field, pick ONE: (A) exact CSS class match exists → use it; (B) no CSS class → use data-cb-func. NEVER invent CSS class names. (a) Apply AT MOST ONE CSS class per field. (b) Only apply on EXACT match. (c) For Time/Date frames: use CSS class when available (N=1-5); fallback to data-cb-func if all 5 used. When using a CSS class, do NOT add data-cb-func for the SAME behavior — but MAY add data-cb-func for a DIFFERENT functionality (e.g. CodBi_DateFrame_1_Begin + data-cb-func=date.noweekends). (d) CSS class replaces data-cb-func ONLY for same behavior. (e) Do NOT use CodBi_People_Alphanumeric on street names, localities, or postal codes. (f) REDUNDANCY: Phone/PLZ/Date Cleave auto → no People CSS. (g) Street names/localities have no CSS class. (h) NUMBERING: Scan used N values, use lowest unused N for new frame pairs. (i) Form.Navigator AUTO-GENERATES navigation buttons — do NOT add XButtonList or manual page-navigation buttons. The functionality creates them automatically. (j) For panels and accordions: CodBi_HTML_Panel_* CSS classes exist — use them. Do NOT add data-cb-func=html.panel when using a panel CSS class. (k) CRITICAL — HTML.Select.Favorites: ALWAYS add data-cb-initialElement (value of the FIRST option's value property) to the XSelect's attributes array. Example: first option {\"text\":\"Bayern\",\"value\":\"Bayern\"} → add {\"text\":\"data-cb-initialElement\",\"value\":\"Bayern\"}.\n" +
                "=== People === CodBi_People_Name (names only), Alphanumeric (codes only), Mail, Phone, PLZ (alone), 18plus, 16plus, BuildingNumber\n" +
                "=== Financial === CodBi_Currency\n" +
                "=== Appointments === CodBi_NoFutureDate, DateFrame_N_Begin/End (N=1-5), TimeFrame_N_Begin/End (N=1-5) — fallback to data-cb-func if all 5 used\n" +
                "=== LDAP.Autofill === CodBi_LDAP_AC_*, AI === AI_LLAMA_*, AI_OCR_*\n" +
                "=== UI.Panels === CodBi_HTML_Panel_Standard, CodBi_HTML_Panel_Flat, CodBi_HTML_Panel_Index, CodBi_HTML_Panel_Minimal, CodBi_HTML_Panel_NoCordion for panels; CodBi_Accordion_A/B/C/D for accordions. Use CSS class for standard panels. Use data-cb-func=html.panel for custom CSS/title. Nested panels: different classes per level.\n" +
                "CRITICAL — COLLAPSIBLE XCONTAINERS: When the user asks for a collapsible/expandable/foldable container and it is an XContainer (div), use data-cb-func=html.panel via the attributes array. ALSO set data-cb-generateheader=\"true\" and data-cb-autoheadertitle for the title (from the prompt or auto-generated). For XFieldSet (fieldset), use the CSS class CodBi_HTML_Panel_Standard instead — the legend provides the title. Only add data-cb-folded=\"true\" if the user explicitly wants the panel to start collapsed.\n" +
                "=== Print.Removal === CodBi_Print_Remove_*\n" +
                "=== BayVIS === CodBi_BayVIS_*\n" +
                "=== OpenPLZ.AC.SET === CodBi_OpenPLZ_AC_SET_*\n" +
                "CRITICAL: CSS classes ONLY exist for the domains listed above. For any functionality NOT listed here (e.g. Form.Navigator, OpenPLZ.Autocomplete, Date.Min, Date.NoWeekends, HTML.Input.REGEX, HTML.CSS, etc.), there is NO CSS class — you MUST use data-cb-func. NEVER invent CSS class names.\n" +
                "IMPORTANT: PRESERVE any existing \"cssclasses\" array already set on elements from the input — only add entries or create a new array if none exists.\n" +
                "Respond ONLY with a JSON object: " +
                "{\"items\":[...same elements with modifications applied...],\"_codbiApplicability\":{\"formElementsProcessed\":4,\"codbiElementsEvaluated\":23 (replace counts)," +
                "\"considered\":[{\"id\":\"CodBi.ID\",\"targets\":[\"elementId\",...]}]," +
                "\"applied\":[{\"id\":\"CodBi.ID\",\"targets\":[\"elementId\",...]}]," +
                "\"skipped\":[{\"id\":\"CodBi.ID\",\"targets\":[\"elementId\",...],\"reason\":\"...\"}]}}. " +
                "No explanation, no markdown, no code fences." +
                CodbiCapabilities.buildFullSection()

        val pass2UserContent =
            "Original user request: ${gson.toJson(prompt)}\n\nApply CodBi functionalities ($candidateClause) to these form elements:\n${gson.toJson(targetItems)}"

        logger.info(
            "[AIFormAssistant] Pass-2 CodBi — candidates: {}, targetIds: {}, sending {} item(s)",
            candidateClause,
            if (targetElementIds.isEmpty()) "<none from pass-1>"
            else targetElementIds.joinToString(", "),
            targetItems.size())
        if (targetItems.size() == 0) {
          logger.warn(
              "[AIFormAssistant] Pass-2 has 0 items to send — pass-1 items array may be missing or empty")
        }

        retryMessagesJson = buildString {
          append("[")
          append("""{"role":"system","content":${gson.toJson(applySystemPrompt)}},""")
          append("""{"role":"user","content":${gson.toJson(pass2UserContent)}}""")
          append("]")
        }
      }

      val retryRaw =
          try {
            instance.performFormAssist(modelId, retryMessagesJson)
          } catch (e: ExternalAiHttpException) {
            logger.warn("[AIFormAssistant] Full-detail rerun AI HTTP {}: {}", e.httpStatus, e.body)
            throw e
          } catch (e: Exception) {
            logger.error("[AIFormAssistant] Full-detail rerun failed", e)
            throw e
          }
      val pass2Cleaned = extractJson(stripThinkTags(retryRaw))
      logger.info("[AIFormAssistant] Pass-2 raw result: {}", pass2Cleaned)
      return splicePass2IntoPass1(cleaned, pass2Cleaned)
    }

    // Normalize _codbiApplicability before any extraction logic: the AI often puts
    // "Matomo.Tracking" in considered/applied instead of "Holistic.Matomo.Tracking"
    // (Rule 10c). Correct this server-side by replacing the ID in the raw JSON so that
    // all downstream extraction functions see the correct value.
    cleaned = normalizeMatomoTrackingInRawJson(cleaned)

    val requestedDetails = extractCodbiDetailsRequest(cleaned)
    if (requestedDetails != null) {
      logger.info(
          "[AIFormAssistant] AI requested CodBi details for: {} — rerunning with full compact API",
          requestedDetails.elements.ifEmpty { listOf("<unspecified>") }.joinToString(", "))
      if (!requestedDetails.applicabilityReport.isNullOrBlank()) {
        logger.info(
            "[AIFormAssistant] AI CodBi applicability report (detail request): {}",
            requestedDetails.applicabilityReport)
      }

      cleaned =
          try {
            rerunWithCodbiDetails(requestedDetails.elements)
          } catch (e: ExternalAiHttpException) {
            return jsonResponse("""{"error":${gson.toJson("AI error: ${e.message}")}}""")
          } catch (e: Exception) {
            return jsonResponse("""{"error":${gson.toJson("AI error: ${e.message}")}}""")
          }
    } else {
      val appliedCodbi = extractAppliedCodbiIds(cleaned).filterNot { it == "Matomo.Tracking" }
      if (appliedCodbi.isNotEmpty()) {
        logger.warn(
            "[AIFormAssistant] AI applied CodBi functionalities without requesting details first; forcing detail rerun for: {}",
            appliedCodbi.joinToString(", "))
        cleaned =
            try {
              rerunWithCodbiDetails(appliedCodbi)
            } catch (e: ExternalAiHttpException) {
              return jsonResponse("""{"error":${gson.toJson("AI error: ${e.message}")}}""")
            } catch (e: Exception) {
              return jsonResponse("""{"error":${gson.toJson("AI error: ${e.message}")}}""")
            }
      } else {
        val consideredCodbi =
            extractConsideredCodbiIds(cleaned).filterNot { it == "Matomo.Tracking" }
        if (consideredCodbi.isNotEmpty()) {
          logger.info(
              "[AIFormAssistant] AI identified CodBi candidates but did not escalate; forcing detail rerun for: {}",
              consideredCodbi.joinToString(", "))
          cleaned =
              try {
                rerunWithCodbiDetails(consideredCodbi)
              } catch (e: ExternalAiHttpException) {
                return jsonResponse("""{"error":${gson.toJson("AI error: ${e.message}")}}""")
              } catch (e: Exception) {
                return jsonResponse("""{"error":${gson.toJson("AI error: ${e.message}")}}""")
              }
        } else {
          // AI returned _codbiApplicability but with an empty considered list.
          // This can happen non-deterministically even when candidates exist — the AI evaluates
          // the list but wrongly decides nothing applies. Always run a blind pass-2 so CodBi
          // is never silently skipped.
          val hasApplicabilityField =
              try {
                @Suppress("UNCHECKED_CAST")
                (gson.fromJson(cleaned, Map::class.java) as? Map<String, Any>)?.containsKey(
                    "_codbiApplicability") == true
              } catch (_: Exception) {
                false
              }
          val reason =
              if (!hasApplicabilityField) "omitted _codbiApplicability entirely"
              else "evaluated CodBi list but found no candidates — forcing blind evaluation"
          logger.info("[AIFormAssistant] AI {} — triggering blind CodBi evaluation pass", reason)
          cleaned =
              try {
                rerunWithCodbiDetails(emptyList())
              } catch (e: ExternalAiHttpException) {
                return jsonResponse("""{"error":${gson.toJson("AI error: ${e.message}")}}""")
              } catch (e: Exception) {
                return jsonResponse("""{"error":${gson.toJson("AI error: ${e.message}")}}""")
              }
        }
      }
    }

    val (sanitizedCleaned, applicabilityReport) = extractAndStripCodbiApplicability(cleaned)
    if (!applicabilityReport.isNullOrBlank()) {
      logger.info("[AIFormAssistant] AI CodBi applicability report: {}", applicabilityReport)
    } else {
      logger.warn("[AIFormAssistant] AI response contains no CodBi applicability report")
    }

    return try {
      val parsed = JsonParser.parseString(sanitizedCleaned)
      warnUnknownClassNames(parsed)
      val merged = restoreStrippedFields(sanitizedCleaned, persistJson)
      jsonResponse(merged)
    } catch (_: Exception) {
      jsonResponse(
          """{"error":"AI returned invalid JSON","raw":${gson.toJson(sanitizedCleaned)}}""")
    }
  }

  /**
   * Extracts the JSON object from an AI response that may contain explanation text, code fences
   * anywhere in the string, or leading/trailing whitespace.
   *
   * Strategy (first match wins):
   * 1. Extract the content inside a ` ```json … ``` ` or ` ``` … ``` ` fence anywhere in the text.
   * 2. Find the first `{` and its matching `}` (balanced-brace scan) and return that substring.
   * 3. Return the trimmed text as-is (lets the JSON parser produce a meaningful error).
   */
  private fun extractJson(text: String): String {
    val s = text.trim()

    // 1. Code-fence extraction (anywhere in the string, not just prefix/suffix)
    val fenceRegex = Regex("```(?:json)?\\s*\\n?([\\s\\S]*?)\\n?```")
    fenceRegex.find(s)?.groups?.get(1)?.value?.trim()?.let { candidate ->
      if (candidate.startsWith("{")) return candidate
    }

    // 2. Balanced-brace extraction — finds the outermost {...} block
    val start = s.indexOf('{')
    if (start >= 0) {
      var depth = 0
      var inString = false
      var escape = false
      for (i in start until s.length) {
        val c = s[i]
        if (escape) {
          escape = false
          continue
        }
        if (c == '\\' && inString) {
          escape = true
          continue
        }
        if (c == '"') {
          inString = !inString
          continue
        }
        if (inString) continue
        if (c == '{') depth++
        if (c == '}') {
          depth--
          if (depth == 0) return s.substring(start, i + 1)
        }
      }
    }

    // 3. Fallback — return as-is
    return s
  }

  private data class CodbiDetailsSignal(
      val elements: List<String>,
      val applicabilityReport: String?
  )

  private fun extractCodbiDetailsRequest(cleanedJson: String): CodbiDetailsSignal? {
    return try {
      @Suppress("UNCHECKED_CAST")
      val obj = gson.fromJson(cleanedJson, Map::class.java) as? Map<String, Any>
      if ((obj?.get("status") as? String) != "need_codbi_details") {
        return null
      }
      val arr = obj["elements"] as? List<*> ?: return CodbiDetailsSignal(emptyList(), null)
      val elements = arr.mapNotNull { (it as? String)?.trim() }.filter { it.isNotEmpty() }
      val report = obj["codbiApplicability"]?.let { gson.toJson(it) }
      CodbiDetailsSignal(elements = elements, applicabilityReport = report)
    } catch (_: Exception) {
      null
    }
  }

  /**
   * Normalizes "Matomo.Tracking" → "Holistic.Matomo.Tracking" in the raw JSON string's
   * _codbiApplicability field. Called before any extraction logic so that downstream functions
   * (extractConsideredCodbiIds, extractAppliedCodbiIds, etc.) see the corrected value. The AI often
   * ignores Rule 10c and outputs "Matomo.Tracking" instead of "Holistic.Matomo.Tracking"; this
   * server-side correction ensures correct behavior.
   *
   * Only normalizes when Matomo.Tracking is NOT in the "applied" array (meaning the AI could not
   * apply it due to missing SiteID/URL parameters). If the AI successfully placed Matomo.Tracking
   * in "applied" (with proper data-cb-SiteID/data-cb-URL on form elements), it is left untouched.
   */
  private fun normalizeMatomoTrackingInRawJson(json: String): String {
    return try {
      @Suppress("UNCHECKED_CAST")
      val obj =
          gson.fromJson(json, MutableMap::class.java) as? MutableMap<String, Any> ?: return json
      for (key in listOf("_codbiApplicability", "codbiApplicability")) {
        val report = obj[key] ?: continue
        normalizeMatomoTrackingInReport(report)
      }
      gson.toJson(obj)
    } catch (_: Exception) {
      json
    }
  }

  /**
   * If the AI placed "Matomo.Tracking" in "considered" but NOT in "applied" (meaning it identified
   * tracking as relevant but couldn't apply it due to missing SiteID/URL parameters), correct it to
   * "Holistic.Matomo.Tracking". If "Matomo.Tracking" IS in "applied", the AI successfully applied
   * it with parameters — leave it untouched.
   */
  @Suppress("UNCHECKED_CAST")
  private fun normalizeMatomoTrackingInReport(reportValue: Any) {
    val report = reportValue as? MutableMap<String, Any> ?: return
    val applied = report["applied"] as? MutableList<*> ?: return

    // If Matomo.Tracking is already in "applied", the AI applied it successfully — don't touch
    val hasMatomoInApplied =
        applied.any { entry -> (entry as? Map<*, *>)?.get("id") == "Matomo.Tracking" }
    if (hasMatomoInApplied) return

    // Matomo.Tracking was NOT applied — it's only in considered/skipped due to missing params.
    // Replace in "applied" (if present as object) and "considered".
    for (i in applied.indices) {
      val entry = applied[i] as? MutableMap<String, Any> ?: continue
      if (entry["id"] == "Matomo.Tracking" && entry["id"] is String) {
        entry["id"] = "Holistic.Matomo.Tracking"
      }
    }
    val considered = report["considered"] as? MutableList<*> ?: return
    for (i in considered.indices) {
      val entry = considered[i] as? MutableMap<String, Any> ?: continue
      if (entry["id"] == "Matomo.Tracking" && entry["id"] is String) {
        entry["id"] = "Holistic.Matomo.Tracking"
      }
    }
  }

  private fun extractAndStripCodbiApplicability(cleanedJson: String): Pair<String, String?> {
    return try {
      @Suppress("UNCHECKED_CAST")
      val obj =
          gson.fromJson(cleanedJson, MutableMap::class.java) as? MutableMap<String, Any>
              ?: return cleanedJson to null
      var report: String? = null
      for (key in listOf("_codbiApplicability", "codbiApplicability")) {
        if (obj.containsKey(key)) {
          normalizeMatomoTrackingInReport(obj[key]!!)
          report = gson.toJson(obj[key])
          obj.remove(key)
          break
        }
      }
      gson.toJson(obj) to report
    } catch (_: Exception) {
      cleanedJson to null
    }
  }

  private fun extractConsideredCodbiIds(cleanedJson: String): List<String> {
    return try {
      @Suppress("UNCHECKED_CAST")
      val obj =
          gson.fromJson(cleanedJson, Map::class.java) as? Map<String, Any> ?: return emptyList()
      val report =
          (obj["_codbiApplicability"] as? Map<*, *>)
              ?: (obj["codbiApplicability"] as? Map<*, *>)
              ?: return emptyList()
      val considered = report["considered"] as? List<*> ?: return emptyList()
      considered.mapNotNull { entry ->
        when (entry) {
          is String -> entry.trim().takeIf { it.isNotEmpty() }
          is Map<*, *> -> (entry["id"] as? String)?.trim()?.takeIf { it.isNotEmpty() }
          else -> null
        }
      }
    } catch (_: Exception) {
      emptyList()
    }
  }

  private fun extractConsideredElementTargets(cleanedJson: String): Set<String> {
    return try {
      @Suppress("UNCHECKED_CAST")
      val obj =
          gson.fromJson(cleanedJson, Map::class.java) as? Map<String, Any> ?: return emptySet()
      val report =
          (obj["_codbiApplicability"] as? Map<*, *>)
              ?: (obj["codbiApplicability"] as? Map<*, *>)
              ?: return emptySet()
      val considered = report["considered"] as? List<*> ?: return emptySet()
      considered
          .flatMap { entry ->
            when (entry) {
              is Map<*, *> ->
                  (entry["targets"] as? List<*>)?.mapNotNull {
                    (it as? String)?.trim()?.takeIf { s -> s.isNotEmpty() }
                  } ?: emptyList()
              else -> emptyList()
            }
          }
          .toSet()
    } catch (_: Exception) {
      emptySet()
    }
  }

  private fun extractAppliedCodbiIds(cleanedJson: String): List<String> {
    return try {
      @Suppress("UNCHECKED_CAST")
      val obj =
          gson.fromJson(cleanedJson, Map::class.java) as? Map<String, Any> ?: return emptyList()
      val report =
          (obj["_codbiApplicability"] as? Map<*, *>)
              ?: (obj["codbiApplicability"] as? Map<*, *>)
              ?: return emptyList()
      val applied = report["applied"] as? List<*> ?: return emptyList()
      applied.mapNotNull { (it as? String)?.trim() }.filter { it.isNotEmpty() }
    } catch (_: Exception) {
      emptyList()
    }
  }

  /**
   * All class names that are valid FORMCYCLE form-item types (from `IPropertiesMap` in
   * `@de-xima/fc-form-designer`). Used to detect AI hallucinations in the returned JSON.
   */
  private val KNOWN_CLASS_NAMES =
      setOf(
          "XAppointment",
          "XButtonList",
          "XCheckbox",
          "XContainer",
          "XContainerInvisible",
          "XDefault",
          "XFieldSet",
          "XFooter",
          "XHeader",
          "XImage",
          "XLine",
          "XPage",
          "XSelect",
          "XSignature",
          "XSpacer",
          "XSpan",
          "XTextArea",
          "XTextField",
          "XUpload",
      )

  /**
   * Logs a WARN for every item in the AI response whose `className` is not in [KNOWN_CLASS_NAMES].
   */
  private fun warnUnknownClassNames(element: JsonElement) {
    val items = element.takeIf { it.isJsonObject }?.asJsonObject?.getAsJsonArray("items") ?: return
    items.forEach { el ->
      if (!el.isJsonObject) return@forEach
      val className = el.asJsonObject.get("className")?.takeIf { it.isJsonPrimitive }?.asString
      if (className != null && className !in KNOWN_CLASS_NAMES) {
        logger.warn(
            "[AIFormAssistant] AI used unknown className '{}' — item will not render correctly",
            className)
      }
    }
  }

  /**
   * Top-level fields that are large and structurally irrelevant for the AI: stylesheets, scripts,
   * base64 images, rendered HTML, page previews, per-language i18n maps, metadata, and the `base`
   * map (per-element base-property overrides that the AI never needs to read or write). They are
   * removed before sending the form to the AI and restored from the original afterwards.
   */
  private val STRIPPED_FIELDS =
      setOf(
          "css",
          "script",
          "image",
          "images",
          "pagePreview",
          "rendered",
          "formI18n",
          "metadata",
          "base")

  /**
   * Item-level property keys that are always stripped from each item's `properties` object before
   * sending to the AI. These are either styling/print directives, permission conditions, or
   * per-item i18n overrides — none of which the AI needs to understand form structure.
   */
  private val STRIPPED_ITEM_PROPS =
      setOf(
          "script",
          "css",
          "formI18n",
          "i18n",
          "viewstatus",
          "viewusergroup",
          "readonly_viewstatus",
          "readonly_viewusergroup",
          "statusdependent",
          "readonly_statusdependent",
          "usergrouppendent",
          "readonly_usergrouppendant",
          // Attributes — stripped to prevent stale data-cb-* entries from surviving when items
          // are restored in restoreStrippedFields. The AI always outputs fresh data-cb-* as
          // direct property keys, which are converted to the proper attributes array at the end
          // of restoreStrippedFields.
          "attributes",
          "print_hide",
          "print_size",
          "print_text_only",
          "print_break",
          "backgroundcolor",
          "helptext",
          "comment",
          "pdfImporterId",
          "rowid",
          "computedwidth",
          "maxwidth",
          "minwidth",
          // Workflow-status / user-group visibility — stripped from slim JSON so the AI starts
          // fresh (no copy-paste from existing items), but validated and re-applied for new
          // AI-created items via sanitizeVisibilityProp(). Existing items still restore from
          // the original.
          "viewstatus",
          "viewusergroup",
          "readonly_viewstatus",
          "readonly_viewusergroup",
          "statusdependent",
          "readonly_statusdependent",
          "usergrouppendent",
          "readonly_usergrouppendant",
      )

  /**
   * Visibility/access-control properties that the AI may set on **new** items it creates. Values
   * are validated by [sanitizeVisibilityProp] before being written into the result.
   */
  private val SANITIZED_VISIBILITY_PROPS =
      setOf(
          "statusdependent",
          "readonly_statusdependent",
          "usergrouppendent",
          "readonly_usergrouppendant",
          "viewstatus",
          "viewusergroup",
          "readonly_viewstatus",
          "readonly_viewusergroup",
      )

  /**
   * Sanitizes a single visibility/access-control property value provided by the AI.
   * - Boolean properties (`statusdependent` etc.) must be a JSON boolean primitive.
   * - Array properties (`viewstatus` etc.) must be a JSON array of plain strings only; non-string
   *   entries are silently dropped.
   *
   * @return The sanitized [JsonElement], or `null` if the value is structurally invalid.
   */
  private fun sanitizeVisibilityProp(key: String, value: JsonElement): JsonElement? =
      when (key) {
        "statusdependent",
        "readonly_statusdependent",
        "usergrouppendent",
        "readonly_usergrouppendant" ->
            value.takeIf { it.isJsonPrimitive && it.asJsonPrimitive.isBoolean }
        "viewstatus",
        "viewusergroup",
        "readonly_viewstatus",
        "readonly_viewusergroup" -> {
          if (!value.isJsonArray) null
          else
              JsonArray().also { sanitized ->
                for (entry in value.asJsonArray) {
                  if (entry.isJsonPrimitive && entry.asJsonPrimitive.isString) {
                    sanitized.add(entry)
                  }
                }
              }
        }
        else -> null
      }

  /**
   * Returns a copy of [json] with [STRIPPED_FIELDS] removed and empty/default values pruned from
   * each item's `properties` object.
   */
  private fun slimPersistJson(json: String): String {
    val root = JsonParser.parseString(json).asJsonObject
    for (field in STRIPPED_FIELDS) root.remove(field)
    root.getAsJsonArray("items")?.forEach { el ->
      if (!el.isJsonObject) return@forEach
      val props = el.asJsonObject.getAsJsonObject("properties") ?: return@forEach
      // Remove known-irrelevant keys
      for (key in STRIPPED_ITEM_PROPS) props.remove(key)
      // Remove remaining empty strings, empty arrays, and empty objects
      val emptyKeys =
          props
              .entrySet()
              .filter { (_, v) ->
                (v.isJsonPrimitive && v.asString == "") ||
                    (v.isJsonArray && v.asJsonArray.size() == 0) ||
                    (v.isJsonObject && v.asJsonObject.size() == 0)
              }
              .map { it.key }
      for (key in emptyKeys) props.remove(key)
      // Strip action objects from XButtonList buttons so the AI cannot copy existing page values
      if (el.asJsonObject.get("className")?.asString == "XButtonList") {
        props.getAsJsonArray("buttons")?.forEach { btn ->
          if (btn.isJsonObject) btn.asJsonObject.remove("action")
        }
      }
    }
    return gson.toJson(root)
  }

  /**
   * Merges the AI result back into the original form JSON. Starts from the **original** as the base
   * so that all required top-level fields (`lang`, `version`, `variables`, etc.) are always present
   * even if the AI omitted them. Then overlays every non-stripped top-level field from the AI
   * result, restores stripped item-level properties, and adds back any original items the AI
   * dropped.
   */
  private fun restoreStrippedFields(aiResult: String, original: String): String {
    val aiObj = JsonParser.parseString(aiResult).asJsonObject
    // Start from the original — preserves lang, version, variables, and all other required fields
    val result = JsonParser.parseString(original).asJsonObject
    // Save reference to original items before they may be replaced by the AI's items
    val originalItems = result.getAsJsonArray("items")
    // Overlay every non-stripped top-level field from the AI result
    for (entry in aiObj.entrySet()) {
      if (entry.key !in STRIPPED_FIELDS) {
        result.add(entry.key, entry.value)
      }
    }
    // result.items is now the AI's items array (if AI included it) or the original (if not)
    val resultItems: JsonArray =
        result.getAsJsonArray("items") ?: JsonArray().also { result.add("items", it) }
    // Fix common AI mistake: className placed inside properties instead of at top level
    for (el in resultItems) {
      if (!el.isJsonObject) continue
      val item = el.asJsonObject
      if (!item.has("className")) {
        val props = item.getAsJsonObject("properties") ?: continue
        val classNameInProps = props.get("className") ?: continue
        item.add("className", classNameInProps)
        props.remove("className")
      }
    }
    if (originalItems != null) {
      val originalByName =
          originalItems
              .filter { it.isJsonObject }
              .mapNotNull { el ->
                val item = el.asJsonObject
                val name =
                    item.getAsJsonObject("properties")?.get("name")?.asString
                        ?: item.get("name")?.asString
                        ?: return@mapNotNull null
                name to el
              }
              .toMap()
      // Build a map of itemName -> original container name, for restoring dropped element refs
      val originalContainerOfItem = mutableMapOf<String, String>()
      for ((containerName, el) in originalByName) {
        val elements =
            el.asJsonObject.getAsJsonObject("properties")?.getAsJsonArray("elements") ?: continue
        for (ref in elements) {
          if (ref.isJsonPrimitive) originalContainerOfItem[ref.asString] = containerName
        }
      }
      // Restore stripped item-level properties for each item the AI kept
      for (el in resultItems) {
        if (!el.isJsonObject) continue
        val item = el.asJsonObject
        val name =
            item.getAsJsonObject("properties")?.get("name")?.asString
                ?: item.get("name")?.asString
                ?: continue
        val origItem = originalByName[name]?.asJsonObject
        if (origItem == null) {
          // New item created by AI — validate and preserve workflow-visibility props, then
          // strip all remaining code/presentation fields.
          item.getAsJsonObject("properties")?.let { props ->
            // Extract any data-cb-* attributes from the AI's attributes object/array BEFORE
            // stripping, and promote them to direct property keys. The conversion code at the
            // end of restoreStrippedFields will convert them to the proper attributes array
            // format ([{"text":"data-cb-func","value":"html.panel"},...]).
            val attrsEl = props.get("attributes")
            if (attrsEl != null) {
              if (attrsEl.isJsonObject) {
                // AI output format: "attributes": {"data-cb-func":"html.panel", ...}
                for ((key, value) in attrsEl.asJsonObject.entrySet()) {
                  if (key.startsWith("data-cb-") && value.isJsonPrimitive) {
                    props.addProperty(key, value.asString)
                  }
                }
              } else if (attrsEl.isJsonArray) {
                // Proper array format: "attributes": [{"text":"data-cb-func","value":"html.panel"},
                // ...]
                // Also support "name" key which some AI models use instead of "text".
                for (item in attrsEl.asJsonArray) {
                  if (item.isJsonObject) {
                    val text =
                        item.asJsonObject.get("text")?.asString
                            ?: item.asJsonObject.get("name")?.asString
                    val value = item.asJsonObject.get("value")?.asString
                    if (text != null && text.startsWith("data-cb-") && value != null) {
                      props.addProperty(text, value)
                    }
                  }
                }
              }
            }
            val validatedVisibility =
                SANITIZED_VISIBILITY_PROPS.mapNotNull { key ->
                  val v = props.get(key) ?: return@mapNotNull null
                  val sanitized = sanitizeVisibilityProp(key, v) ?: return@mapNotNull null
                  key to sanitized
                }
            for (key in STRIPPED_ITEM_PROPS) props.remove(key)
            for ((key, value) in validatedVisibility) props.add(key, value)
          }
          continue
        }
        val origProps = origItem.getAsJsonObject("properties") ?: continue
        val resultProps = item.getAsJsonObject("properties") ?: continue
        // Promote any data-cb-* entries from the AI's attributes array to direct property
        // keys BEFORE restoring the original attributes (which may be empty). This mirrors
        // the promotion done for new items and handles cases where the AI outputs attributes
        // in the array format rather than as direct property keys.
        val attrsEl = resultProps.get("attributes")
        if (attrsEl != null) {
          if (attrsEl.isJsonObject) {
            for ((key, value) in attrsEl.asJsonObject.entrySet()) {
              if (key.startsWith("data-cb-") && value.isJsonPrimitive) {
                resultProps.addProperty(key, value.asString)
              }
            }
          } else if (attrsEl.isJsonArray) {
            for (item in attrsEl.asJsonArray) {
              if (item.isJsonObject) {
                val text =
                    item.asJsonObject.get("text")?.asString
                        ?: item.asJsonObject.get("name")?.asString
                val value = item.asJsonObject.get("value")?.asString
                if (text != null && text.startsWith("data-cb-") && value != null) {
                  resultProps.addProperty(text, value)
                }
              }
            }
          }
        }
        for (key in STRIPPED_ITEM_PROPS) {
          val v = origProps.get(key)
          if (v != null) resultProps.add(key, v) else resultProps.remove(key)
        }
        // Also restore any other keys that were pruned as empty (preserve original values)
        for (entry in origProps.entrySet()) {
          if (!resultProps.has(entry.key)) resultProps.add(entry.key, entry.value)
        }
        // For XButtonList: restore original action for each existing button by name, since
        // action objects were stripped from slimPersistJson to prevent copy-paste errors.
        // New buttons (no matching name in original) keep the AI's generated action.
        if (item.get("className")?.asString == "XButtonList") {
          val origBtns = origProps.getAsJsonArray("buttons")
          val resultBtns = resultProps.getAsJsonArray("buttons")
          if (origBtns != null && resultBtns != null) {
            val origActionByName =
                origBtns
                    .mapNotNull { btn ->
                      if (!btn.isJsonObject) return@mapNotNull null
                      val bName = btn.asJsonObject.get("name")?.asString ?: return@mapNotNull null
                      val action = btn.asJsonObject.get("action") ?: return@mapNotNull null
                      bName to action
                    }
                    .toMap()
            for (resultBtn in resultBtns) {
              if (!resultBtn.isJsonObject) continue
              val btnObj = resultBtn.asJsonObject
              val bName = btnObj.get("name")?.asString ?: continue
              val origAction = origActionByName[bName] ?: continue // new button — keep AI action
              if (!btnObj.has("action")) btnObj.add("action", origAction)
            }
          }
        }
      }
      // Add back any original items the AI dropped — AI must not remove existing items
      val resultItemNames = mutableSetOf<String>()
      for (el in resultItems) {
        if (!el.isJsonObject) continue
        val item = el.asJsonObject
        val n =
            item.getAsJsonObject("properties")?.get("name")?.asString
                ?: item.get("name")?.asString
                ?: continue
        resultItemNames.add(n)
      }
      for (el in originalItems) {
        if (!el.isJsonObject) continue
        val item = el.asJsonObject
        val name =
            item.getAsJsonObject("properties")?.get("name")?.asString
                ?: item.get("name")?.asString
                ?: continue
        if (name !in resultItemNames) {
          resultItems.add(el)
          logger.debug("[AIFormAssistant] Restored original item '{}' dropped by AI", name)
          // Also restore the element reference in its original container
          val containerName = originalContainerOfItem[name]
          if (containerName != null) {
            val containerItem =
                resultItems
                    .firstOrNull {
                      it.isJsonObject &&
                          (it.asJsonObject.getAsJsonObject("properties")?.get("name")?.asString ==
                              containerName)
                    }
                    ?.asJsonObject
            val elements = containerItem?.getAsJsonObject("properties")?.getAsJsonArray("elements")
            if (elements != null && elements.none { it.isJsonPrimitive && it.asString == name }) {
              elements.add(name)
              logger.debug(
                  "[AIFormAssistant] Restored element ref '{}' in container '{}'",
                  name,
                  containerName)
            }
          }
        }
      }
      // Fill in base template properties for NEW items (not in original) and set parentid.
      // FORMCYCLE does not auto-apply base defaults at load time, so new items need all props
      // explicitly set (flex, computedwidth, labeldir, etc.) or they render as invisible.
      val baseObj = result.getAsJsonObject("base")
      // Build map: item name → parent container id (from elements arrays in resultItems)
      val itemToContainerId = mutableMapOf<String, String>()
      for (el in resultItems) {
        if (!el.isJsonObject) continue
        val containerProps = el.asJsonObject.getAsJsonObject("properties") ?: continue
        val containerId = containerProps.get("id")?.asString ?: continue
        val elements = containerProps.getAsJsonArray("elements") ?: continue
        for (ref in elements) {
          if (ref.isJsonPrimitive) itemToContainerId[ref.asString] = containerId
        }
      }
      for (el in resultItems) {
        if (!el.isJsonObject) continue
        val item = el.asJsonObject
        val name = item.getAsJsonObject("properties")?.get("name")?.asString ?: continue
        if (name in originalByName) continue // existing item — already handled above
        val className = item.get("className")?.asString ?: continue
        val baseProps =
            baseObj?.getAsJsonObject(className)?.getAsJsonObject("properties") ?: continue
        val itemProps = item.getAsJsonObject("properties") ?: continue
        // Merge base template properties that the AI omitted
        for (entry in baseProps.entrySet()) {
          if (!itemProps.has(entry.key)) itemProps.add(entry.key, entry.value)
        }
        // For new XTextField date fields: always enable the datepicker calendar widget,
        // overriding any base-template default of "0".
        if (className == "XTextField" &&
            (itemProps.get("datatype")?.asString ?: "").startsWith("date")) {
          itemProps.addProperty("datepicker", "1")
        }
        // Set parentid from the container's elements reference
        val parentId = itemToContainerId[name]
        if (parentId != null &&
            (!itemProps.has("parentid") || itemProps.get("parentid").asString.isNullOrEmpty())) {
          itemProps.addProperty("parentid", parentId)
        }
      }
    }
    // Convert any AI-generated data-cb-* direct property keys to the proper attributes array
    // format. FORMCYCLE reads custom HTML attributes from properties["attributes"] as
    // [{text: "attr-name", value: "attr-value"}] objects, NOT as direct property keys.
    // CRITICAL: Before adding AI's fresh values, purge any stale data-cb-* entries from the
    // existing attributes array (which may have been restored from the original form with
    // stale values from a previous run). This prevents stale entries from surviving alongside
    // the AI's correct values.
    for (el in resultItems) {
      if (!el.isJsonObject) continue
      val props = el.asJsonObject.getAsJsonObject("properties") ?: continue
      val attrs =
          if (props.has("attributes") && props.get("attributes").isJsonArray)
              props.getAsJsonArray("attributes")
          else null
      // Purge any stale data-cb-* entries from the existing attributes array
      // (may have been restored from the original form). Build a filtered array by copying
      // only non-data-cb-* entries.
      if (attrs != null && attrs.size() > 0) {
        val filtered = JsonArray()
        for (e in attrs) {
          val isStaleCb =
              e.isJsonObject &&
                  e.asJsonObject.get("text")?.isJsonPrimitive == true &&
                  e.asJsonObject.get("text").asString.startsWith("data-cb-")
          if (!isStaleCb) filtered.add(e)
        }
        props.add("attributes", filtered)
      }

      // --- Normalize Print.Remove: if the AI applied data-cb-func=print.remove instead of the
      // CSS class (per TWO-OPTION RULE, CSS classes should be preferred when available), convert
      // it to the CodBi_Print_Remove_Tagged CSS class and remove the data-cb-func entry.
      val printRemoveFunc = props.get("data-cb-func")?.asString
      if (printRemoveFunc != null && printRemoveFunc.contains("print.remove", ignoreCase = true)) {
        val cssClasses =
            if (props.has("cssclasses") && props.get("cssclasses").isJsonArray)
                props.getAsJsonArray("cssclasses")
            else JsonArray().also { props.add("cssclasses", it) }
        var hasPrintRemoveTagged = false
        for (i in 0 until cssClasses.size()) {
          val cls = cssClasses.get(i)
          if (cls.isJsonPrimitive && cls.asString == "CodBi_Print_Remove_Tagged") {
            hasPrintRemoveTagged = true
            break
          }
        }
        if (!hasPrintRemoveTagged) {
          cssClasses.add("CodBi_Print_Remove_Tagged")
          logger.info(
              "[AIFormAssistant] Normalized data-cb-func=print.remove to CSS class 'CodBi_Print_Remove_Tagged'")
        }
        // Remove print.remove from data-cb-func (other comma-separated funcs are preserved)
        val remaining =
            printRemoveFunc
                .split(",")
                .map { it.trim() }
                .filterNot { it.equals("print.remove", ignoreCase = true) }
        if (remaining.isEmpty()) {
          props.remove("data-cb-func")
        } else {
          props.addProperty("data-cb-func", remaining.joinToString(","))
        }
      }

      val cbKeys = props.entrySet().filter { it.key.startsWith("data-cb-") }.map { it.key }
      if (cbKeys.isEmpty()) continue

      val cleanAttrs =
          if (props.has("attributes") && props.get("attributes").isJsonArray) {
            props.getAsJsonArray("attributes")
          } else {
            JsonArray().also { props.add("attributes", it) }
          }
      for (key in cbKeys) {
        var value = if (props.get(key)?.isJsonPrimitive == true) props.get(key).asString else null
        if (value != null) {
          // Decode common Unicode escapes that some AI models produce (e.g. \u003e → >)
          value = decodeUnicodeEscapes(value)
          val attrObj = JsonObject()
          attrObj.addProperty("text", key)
          attrObj.addProperty("value", value)
          cleanAttrs.add(attrObj)
        }
        props.remove(key)
      }
    }
    return gson.toJson(result)
  }

  /**
   * Decodes common Unicode escape sequences that some AI models produce in JSON string values. For
   * example, `\u003e` (Unicode escape for `>`) is decoded to `>`.
   */
  private fun decodeUnicodeEscapes(value: String): String {
    return value.replace(Regex("\\\\u([0-9a-fA-F]{4})")) { matchResult ->
      val hex = matchResult.groupValues[1]
      Integer.parseInt(hex, 16).toChar().toString()
    }
  }

  private fun splicePass2IntoPass1(pass1: String, pass2: String): String {
    // Merge pass2 modifications into pass1: replace pass1 items with pass2 versions by id,
    // add new items from pass2, and overlay pass2 top-level fields (e.g. _codbiApplicability).
    try {
      val obj1 = JsonParser.parseString(pass1).asJsonObject
      val obj2 = JsonParser.parseString(pass2).asJsonObject

      // Build a lookup of pass2 items by their id, for replacing pass1 items with updated versions
      val modifiedById = mutableMapOf<String, JsonObject>()
      val pass2Ids = mutableSetOf<String>()
      obj2.getAsJsonArray("items")?.forEach { item ->
        if (!item.isJsonObject) return@forEach
        val id =
            item.asJsonObject.getAsJsonObject("properties")?.get("id")?.asString ?: return@forEach
        pass2Ids.add(id)
        modifiedById[id] = item.asJsonObject
      }

      val pass1Items = obj1.getAsJsonArray("items")
      if (pass1Items != null && modifiedById.isNotEmpty()) {
        val newItems = JsonArray()
        val pass1Ids = mutableSetOf<String>()
        for (item in pass1Items) {
          if (item.isJsonObject) {
            val id = item.asJsonObject.getAsJsonObject("properties")?.get("id")?.asString
            if (id != null) {
              pass1Ids.add(id)
              // Replace with pass2 version if modified, otherwise keep pass1 item
              newItems.add(modifiedById[id] ?: item)
            } else {
              newItems.add(item)
            }
          } else {
            newItems.add(item)
          }
        }
        // Add new items from pass2 that did not exist in pass1
        for ((id, item) in modifiedById) {
          if (id !in pass1Ids) {
            newItems.add(item)
          }
        }
        obj1.add("items", newItems)
      }

      // Merge other top-level fields from pass2 that are not present in pass1
      for ((key, value) in obj2.entrySet()) {
        if (key == "items") continue
        if (!obj1.has(key)) {
          obj1.add(key, value)
        }
      }
      return gson.toJson(obj1)
    } catch (e: Exception) {
      logger.warn("[AIFormAssistant] splicePass2IntoPass1 failed: {}", e.message)
      return pass2
    }
  }

  private fun jsonResponse(json: String): IPluginServletActionRetVal =
      PluginServletActionRetVal(ServletResponse(EResponseType.JSON, json))
}
