BÜRGERSERVICE FIELD NAMING (Formcycle Bürgerservices-Plugin — BundID / BayernID / ELSTER)

When this section is present, the AI MUST name generated form fields with the EXACT canonical `properties.name` (technical ID) below, so the Formcycle **Bürgerservices-Plugin** (BundID / BayernID / ELSTER) can automatically fill the fields after login — without the form author having to rename them. The semantic fields follow the XÖV/e-government identity attributes (Vorname, Familienname, Geburtsdatum, …); the *technical IDs* are the plugin's own convention (`tfAntragsteller…`/`tfOrg…` prefix, recognized `fsBK…` fieldsets).

BÜRGERSERVICES-PLUGIN FIELDSETS (MANDATORY when the plugin is used)
- The plugin auto-recognizes these EXACT fieldset names for marking/verifying filled data:
  - `fsBKDaten` — fieldset holding the PERSON's data (Bürgerkonto-Daten)
  - `fsBKOrgDaten` — fieldset holding ORGANIZATION data
  - `fsBKAllDaten` — fieldset holding BOTH person + organization data
- Use the matching fieldset name for the data area; keep the name UNCHANGED (a custom suffix is only needed for multiple logins in one form). Add the attribute `noRibbon` only when no verification ribbon is wanted.
- **NEVER ask the user which fields a Bürger-Services fieldset (`fsBKDaten` / `fsBKOrgDaten` / `fsBKAllDaten`) should contain** — the exact field set is predefined by the catalogs below (Person fields for `fsBKDaten`; Organisation/ELSTER fields for `fsBKOrgDaten`). In particular, an **ELSTER-Organisationslogin** fieldset (`fsBKOrgDaten`) MUST include the ELSTER organisation fields `tfOrgName`, `tfOrgRechtsform`, `tfOrgRechtsformText`, `tfOrgRegisterNummer`, `tfOrgRegistergericht`, `tfOrgRegisterart`, `selOrgPersTyp`, `tfTaetigkeit`, `tfTaetigkeitText`, `tfDatenkranzTyp`, `BPK2`, `TrustLevel` (see the "Organisation (inside `fsBKOrgDaten`)" and "ELSTER / Authentifizierung / Systemfelder" tables below). Do NOT ask which ones to include — use the canonical set. The mandatory authentication/system fields `selOrgPersTyp`, `BPK2` and `TrustLevel` are ALWAYS required in `fsBKOrgDaten` — NEVER omit them.

RULES:
- Use EXACTLY the canonical `name` shown, including prefix and case (e.g. `tfAntragstellerVorname` — ONE "s" in "Antragsteller"; NOT `vorname`, `tfAntragsstellerVorname` or `tfAntragstellerVorname_1`).
- Use the canonical `name` EVERYWHERE the field is referenced: its `properties.name`, its `id` (per the `xi-…` convention), the page/container `elements` array, `[%…%]` placeholders, `data-cb-*` parameters, `hiddenif`/`readonlyif` properties, and workflow node references.
- The `label` stays a meaningful, language-consistent display text (e.g. "Vorname", "Geburtsdatum"). Only the technical `name`/`id` is fixed.
- Only ONE field per canonical name; for a duplicate (e.g. "Vorname des Kindes") append a distinguishing suffix (`tfAntragstellerVornameKind`).
- Apply by MEANING in any language (German "Straße", English "street", …).
- Fields NOT in this table keep the default naming convention (`tf…`, `sel…`, `cb…`, `fd…`, `btn…`) with a descriptive, unique name.
- Do NOT add `data-cb-func` (no OpenPLZ.Autocomplete, no ldap.autocomplete, …) to any `tfAntragsteller*` / `tfOrg*` / technical field below — the Bürger-Services plugin itself maps the authentication response data after login. CSS classes for client-side formatting/validation (CodBi_People_Name, CodBi_People_Mail, CodBi_People_Phone, CodBi_People_PLZ, CodBi_People_BuildingNumber) are still allowed.
- **No LDAP address autocomplete for Bürger-Services forms.** The person's address data arrives via the login/authentication response (tfAntragstellerPLZ, tfAntragstellerOrt, …) or is filled by the German OpenPLZ.Autocomplete (`CodBi_OpenPLZ_AC_SET_*` classes on PLZ/Ort/Straße/Hausnummer). A person is either a citizen or an employee — a citizen is NOT in an Active Directory — so NEVER apply `LDAP.Autocomplete` / `CodBi_LDAP_AC_*` to the person/address fields of a Bürger-Services form and NEVER ask the user for an LDAP server URL/endpoint. Apply LDAP only when the request explicitly asks for an LDAP/employee-directory lookup, and even then never ask for the endpoint.
- **Straße/Hausnummer in a Bürger-Services address group:** when the prompt asks for German autocomplete of street / house number ("PLZ/Ort/Straße/Hausnummer sollen sich ... befüllen"), CREATE the general fields `tfStrasse` (label "Straße") and `tfHausnummer` (label "Hausnummer") with `CodBi_OpenPLZ_AC_SET_Street` / `CodBi_OpenPLZ_AC_SET_BuildingNumber` — NOT `tfAntragsteller*` fields (the plugin's canonical combined address is `tfAntragstellerAdresse`). Place them in the same fieldset as `tfAntragstellerPLZ` / `tfAntragstellerOrt`.

FILL & VERIFICATION SEMANTICS (from the plugin's "Bürger Services Elemente" catalog columns)
- Per field the catalog states how it is filled by **ELSTER** and by each **BundID / BayernID** method: **BN/PW** (Basisregistrierung — Benutzername/Passwort), **eID** (permanent/temporär), **eIDAS** (permanent/temporär), **Smart eID** (permanent/temporär), **ELSTER** (permanent/temporär), **FINK** (hoch / substanziell / Basisregistrierung).
- Column values mean:
  - **Pflichtfeld** — the login method ALWAYS writes this field.
  - **verifiziert / teilweise verifiziert / nicht verifiziert** — quality of the identity data: verified (identity provider confirmed it) vs. only self-asserted.
  - **Pflichtfeld (IdNr)** — ELSTER **personal** certificate (IdNr); **Pflichtfeld (StNr)** — ELSTER **organization** certificate (StNr).
  - **optional (…)** — only filled when the citizen provided the data (e.g. "optional (Datenkranz AO)" = only when the AO data frame is connected).
  - **nein** — never filled by that method; keep the field optional / user-editable.

AUTH METHOD → FIELD REQUIREMENTS (condensed from the catalog)
- **Always mandatory (every method)**: `selPersTyp`, `tfPersTyp`, `selOrgPersTyp`, `BPK2`, `TrustLevel`, `tfAuthentifizierungsLevel`, `tfAuthentifizierungsName`, `IdentitaetsPruefer`.
- **Person identity — Pflichtfeld & verified (eID / eIDAS / Smart-eID / ELSTER / FINK)**: `tfAntragstellerVorname`, `tfAntragstellerName`, `tfAntragstellerGeburtsdatum`, `tfAntragstellerGeburtsort`, `tfAntragstellerGeburtsname` (Leerwert erlaubt), `tfAntragstellerAdresse`, `tfAntragstellerPLZ`, `tfAntragstellerOrt`, `tfAntragstellerLand`.
- **Contact / personal — Pflichtfeld (nicht verifiziert) or optional**: `tfAntragstellerEmail`, `tfAntragstellerTelefon`, `tfAntragstellerDeMail`, `tfAntragstellerTitel`, `tfAntragstellerAnrede`, `selAntragstellerGeschlecht`, `tfAntragstellerOrtsteil`, `tfAntragstellerErgaenzung`.
- **eIDAS (+ FINK hoch)**: `tfAntragstellerStaatsangehörigkeit` (optional verifiziert), `tfAntragstellerEIDASAusstellerLand` (Pflichtfeld verifiziert — nur eIDAS).
- **ELSTER-only (never BundID/eID)**: `tfOrgName` (StNr), `tfOrgRechtsform`, `tfOrgRechtsformText`, `tfTaetigkeit`, `tfTaetigkeitText`, `tfDatenkranzTyp`, `tfOrgRegisterart`; plus, only when the **AO Datenkranz** is connected (optional): `tfOrgUStId`, `tfOrgGruendungsDatum`, `tfOrgBetriebsbeendigungsdatum`.
- **PostboxId**: Pflichtfeld for BN/PW, eID, eIDAS permanent, Smart eID and ELSTER permanent; otherwise optional/nein (only relevant when the Postbox is connected).
- When the user names a specific login method (BundID normal/BN-PW, eID, eIDAS, Smart-eID, ELSTER, FINK), include that method's mandatory fields; where the catalog says "verifiziert" the field is autofill (read-only after login). Ask the user instead of guessing when the method is ambiguous.

CANONICAL TECHNICAL IDS (`properties.name`) — EXACT names from the plugin's "Bürger Services Elemente" catalog:

## Person (Antragsteller — inside `fsBKDaten` / `fsBKAllDaten`)
| Field | canonical `name` | Bemerkung |
|---|---|---|
| Antrag erfolgt als | `selPersTyp` | Werte: NatPers (Privatperson) / NNatPers (Organisation) |
| Anrede | `tfAntragstellerAnrede` | |
| Titel / Akademischer Titel | `tfAntragstellerTitel` | |
| Vorname | `tfAntragstellerVorname` | Pflichtfeld (IdNr) bei ELSTER |
| Nachname | `tfAntragstellerName` | Pflichtfeld (IdNr) bei ELSTER |
| Geburtsname | `tfAntragstellerGeburtsname` | Leerwert erlaubt |
| Geburtsdatum | `tfAntragstellerGeburtsdatum` | datatype="dateDE"; Pflichtfeld (IdNr) bei ELSTER |
| Geburtsort | `tfAntragstellerGeburtsort` | |
| Geschlecht | `selAntragstellerGeschlecht` | Werte: 0 unbekannt, 1 männlich, 2 weiblich, 9 nicht zutreffend |
| Staatsangehörigkeit | `tfAntragstellerStaatsangehörigkeit` | eIDAS (+FINK hoch) — optional verifiziert |
| eIDAS Ausgabeland | `tfAntragstellerEIDASAusstellerLand` | eIDAS-only — Pflichtfeld verifiziert |
| E-Mail | `tfAntragstellerEmail` | datatype="email" |
| Telefon | `tfAntragstellerTelefon` | |
| De-Mail | `tfAntragstellerDeMail` | De-Mail-Adresse, datatype="email" |
| Adresse (Straße + Hausnummer) | `tfAntragstellerAdresse` | Adresse bestehend aus Straße und Hausnummer |
| Postleitzahl | `tfAntragstellerPLZ` | datatype="plzDE" |
| Ort | `tfAntragstellerOrt` | |
| Ortsteil | `tfAntragstellerOrtsteil` | |
| Ergänzung | `tfAntragstellerErgaenzung` | |
| Land | `tfAntragstellerLand` | |

## Organisation (inside `fsBKOrgDaten` / `fsBKAllDaten`)
| Field | canonical `name` | Bemerkung |
|---|---|---|
| Firmenname | `tfOrgName` | ELSTER-only — Pflichtfeld (StNr) |
| Rechtsform-Schlüssel | `tfOrgRechtsform` | ELSTER-only — ELSTER-spezifische Nummer; Klartext im Feld Rechtsform |
| Rechtsform | `tfOrgRechtsformText` | ELSTER-only — Rechtsform einer nicht natürlichen Person als Kontoinhaber |
| Registernummer | `tfOrgRegisterNummer` | |
| Registergericht | `tfOrgRegistergericht` | |
| Registerart (HRA, HRB, GR, PR, VR) | `tfOrgRegisterart` | ELSTER-only — Pflichtfeld |
| Umsatzsteuer-Identifikationsnummer | `tfOrgUStId` | ELSTER-only — optional (Datenkranz AO) |
| Gründungsdatum | `tfOrgGruendungsDatum` | ELSTER-only — optional (Datenkranz AO) |
| Datum der Unternehmensauflösung | `tfOrgBetriebsbeendigungsdatum` | ELSTER-only — optional (Datenkranz AO) |

## ELSTER / Authentifizierung / Systemfelder
| Field | canonical `name` | Bemerkung |
|---|---|---|
| Personentyp (NatPers / NNatPers) | `tfPersTyp` | Pflichtfeld — alle Methoden |
| Inhabertyp des Steuerkontos | `selOrgPersTyp` | Werte: NatPers / NNatPers — Pflichtfeld |
| Tätigkeits-Schlüssel | `tfTaetigkeit` | ELSTER-only — Pflichtfeld (StNr) |
| Tätigkeit | `tfTaetigkeitText` | ELSTER-only — Pflichtfeld |
| ELSTER DatenkranzTyp (StNr / IdNr) | `tfDatenkranzTyp` | ELSTER-only — Pflichtfeld; StNr = Organisations-, IdNr = persönliches Zertifikat |
| Authentifizierungs Level (normal / substanziell / hoch) | `tfAuthentifizierungsLevel` | BSI-Norm — Pflichtfeld |
| Authentifizierungs Name | `tfAuthentifizierungsName` | Name des Mediums (z.B. Personalausweis) — Pflichtfeld |
| Bereichsspezifisches Personenkennzeichen | `BPK2` | verschlüsselt — Pflichtfeld (BundID-Methoden) |
| Vertrauensniveau | `TrustLevel` | STORK-QAA Level 1 (Benutzername/Passwort), 3 (Authega-Zertifikat), 4 (nPA) |
| Identitätsprüfer | `IdentitaetsPruefer` | Werte: eIDAS, eID, Smart-eID, AUTHEGA, ELSTER, Benutzername, FINK |
| Postkorb-Id | `PostboxId` | nur bei Postkorb-Anbindung |

## Weitere übliche Formularfelder (nicht vom Plugin befüllt — allgemeine Konvention)
| Field | canonical `name` |
|---|---|
| Straße | `tfStrasse` |
| Hausnummer | `tfHausnummer` |
| Betreff | `tfBetreff` |
| Nachricht | `taNachricht` |
| Bemerkung | `taBemerkung` |
| IBAN | `tfIBAN` |
| BIC | `tfBIC` |
| Betrag / Preis | `tfBetrag` |
