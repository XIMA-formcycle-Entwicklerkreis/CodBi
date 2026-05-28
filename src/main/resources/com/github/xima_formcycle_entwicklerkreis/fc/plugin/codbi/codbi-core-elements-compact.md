# CodBi Core Elements (Compact)

Element-only reference: what each functionality, element placeholder, and standard class does.

## Functionalities

- AI.LLAMA.CHAT: Provides the AI_LLAMA_CHAT.functionality .
- AI.OCR: Provides the AI.functionality .
- Date.Frame: Provides the HTML_Select_Injection.functionality .
- Date.Min: Provides the Date_Min.functionality .
- Date.NoWeekends: Provides the HTML_Select_Injection.functionality .
- Form.Navigator: Registers the Form_Navigator.functionality .
- HTML.CSS: Provides the HTML_Select_Injection.functionality .
- HTML.Input.Cleave: Provides the HTML_Input_Cleave.functionality .
- HTML.Input.REGEX: Provides the HTML_Input_REGEX.functionality .
- HTML.Panel: Provides the HTML_Panel.functionality .
- HTML.SETAttribute: Provides the HTML_SETAttribute.functionality .
- HTML.Text.Injector: Provides the HTML_Text_Injector.functionality .
- HTML.Text.Mapper: Provides the HTML_Text_Mapper.functionality .
- JSON.SET: Provides the JSON_SET.functionality .
- LDAP.Autocomplete.Set: Provides the LDAP_Autocomplete.functionality .
- LDAP.Autocomplete: Extended HTMLInputElement interface that adds support for LDAP match listeners.
- Matomo.Tracking: Provides the HTML_Select_Injection.functionality .
- Media.Image.Cropper: Provides the Media_Image_Cropper.functionality .
- MEDIA.INPUT.SPEECH: A single recognition hypothesis returned by the speech engine.
- OpenPLZ.Autocomplete: Provides the OpenPLZ_Autocomplete.functionality .
- Print.Remove: Provides the HTML_Select_Injection.functionality .
- Sys.Log.Console: Provides the Sys_Log_Console.functionality .
- Time.Frame: Provides the Time_Frame.functionality .
## Element Placeholders (EPs)

- AI.LLAMA.STD.QA: This Element-Placeholder acquires the AI response to a question.
- BayVIS.Ansprechpartner: This Element-Placeholder retrieves either the whole BayVIS Authority Directory or a specified detail of it from.
- BayVIS.Behoerden.Details: This Element-Placeholder retrieves the details of an authority specified by the provided ID from the corresponding.
- BayVIS.Behoerden.ID: This Element-Placeholder retrieves the IDs of authorities by their "bezeichnung" (case insensitive).
- BayVIS.Behoerden: This Element-Placeholder retrieves the either the wholeBayVIS Authority Directory or a specified detail of it from.
- Data.CSV: This Element Placeholder turns a CSV-String into an Array < string >.
- Data.Join: Joins the properties of multiple object s into one.
- Date.Arithmetic: This Element-Placeholder turns a String into a Date .
- Date.FromString: This Element-Placeholder turns a String into a Date .
- Date.Holidays: The type of requests needed to identify identical requests.
- Date.Today: Provides the DATE_Today.retrieve al of the current Date along with arithmetic appliances.
- Date.Weekends: This Element-Placeholder Registers the "Date.Weekend"-EP along with a necessary CSS-Injection in the Document.head .
- DOM.Query: This Element-Placeholder queries an Element .
- F: Finds the objects within an Array that have a specific property with a specific value.
- I: This Element-Placeholder acquires a specific element.
- JSON.Path: This Element-Placeholder retrieves an Object at a specific path out of the one given in the.
- LDAP.Find: This Elementplaceholder connects via a default (LDAP_URL in CodBi Settings) or an optionally specified.
- Net.URL: This Element-Placeholder retrieves the content of a URL.
- OpenPLZ.Localities: An OpenPLZ -Request specialized into searching for localities.
- OpenPLZ.Streets: An OpenPLZ -Request specialized into searching for streets.
- OpenPLZ.TextSearch: An OpenPLZ -Request performing a full text-search.
- OpenPLZ: Retrieves data from the CodBi_OpenPLZ_Verwaltungseinheiten-Servlet according to the parameter specified.
- Sorted: An Elementplaceholder sorts the Array passed as the 1st parameter in.
- Unique: An Elementplaceholder filters the Array passed as the 1st parameter from duplicates.
- V: This Element-Placeholder acquires a global variable's value.
- VP: This Element-Placeholder acquires a value from window.codbiSettings.gv.
## Standard Configuration Classes

- AI: Registers standard configurations providing targets that're used with.
- Appointments: Registers standard configurations specific to appointment arrangements.
- BayVIS: Registers standard configurations specific to buildings registered in BayVIS.
- Financial: Registers standard configurations specific to finances.
- Holistic.CSS.Standard: Registers a standard configuration that applies a standard CSS onto the form.
- Holistic.Matomo.Tracking: Registers a standard configurations using the functionality.
- Holistic.Media.Input.Speech: Registers a standard configuration that applies Speech-to-Text onto every.
- Holistic.Media.Input.Speech.Whisper: Registers a standard configuration that applies Whisper Speech-to-Text onto every.
- LDAP.Autofill: Registers standard configurations specific to LDAP-Autocompletion in HTMLInputElement s.
- OpenPLZ.AC.SET: Registers standard configurations that binds HTMLInputElements tagged with the.
- People: Registers standard configurations specific to people characteristics.
- Print.Removal: Registers standard configurations that remove HTMLElement s from the DOM.
- UI.Panels: Registers standard configurations providing CodBi-"HTML.Panel"s.
