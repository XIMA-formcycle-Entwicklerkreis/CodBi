BÜRGERSERVICE FIELD NAMING (Formcycle Bürgerservices-Plugin — BundID / BayernID / ELSTER)

When this section is present, the AI MUST name generated form fields with the EXACT canonical `properties.name` (technical ID) below, so the Formcycle Bürgerservices-Plugin (BundID / BayernID / ELSTER) can auto-fill them after login. The *technical IDs* are the plugin's own convention (`tfAntragsteller…`/`tfOrg…` prefix, recognized `fsBK…` fieldsets).

FIELDSETS / CONTAINERS (auto-recognized; use verbatim; add `noRibbon` only when no verification ribbon is wanted):
- `fsBKDaten` — PERSON data · `fsBKOrgDaten` — ORGANIZATION data · `fsBKAllDaten` — BOTH. Any other container for a Bürger-Services login (e.g. `fdPersonData`) is treated the same.
- NEVER leave ANY created container (XContainer/"Gruppe"/fieldset) with an EMPTY `elements` array — it must NEVER be left empty: populate it with the fields below.
- NEVER ask which fields a container holds — the set is predefined below (Person for `fsBKDaten`/person-data containers; Organisation/ELSTER for `fsBKOrgDaten`). `fsBKOrgDaten` MUST include the ELSTER org fields AND the mandatory `selOrgPersTyp`, `BPK2`, `TrustLevel` — NEVER omit them.
- CREATE input fields INSIDE the container (`elements`). When the user names a login method (BundID/eID/eIDAS/Smart eID/ELSTER/FINK), include that method's mandatory fields; "verifiziert" = autofill.
- Always mandatory (every method): `selPersTyp`, `tfPersTyp`, `selOrgPersTyp`, `BPK2`, `TrustLevel`, `tfAuthentifizierungsLevel`, `tfAuthentifizierungsName`, `IdentitaetsPruefer`.
- Person data container (`fsBKDaten` or any person-data container) MUST include `tfAntragstellerVorname`, `tfAntragstellerName`, `tfAntragstellerGeburtsdatum`, `tfAntragstellerGeburtsort`, `tfAntragstellerGeburtsname`, `tfAntragstellerAdresse`, `tfAntragstellerPLZ`, `tfAntragstellerOrt`, `tfAntragstellerLand`.

HARD RULES:
- Use EXACTLY the canonical `name` including prefix and case (e.g. `tfAntragstellerVorname` — ONE "s" in "Antragsteller"; NOT `vorname`/`tfAntragsstellerVorname`/`tfAntragstellerVorname_1`).
- Use the canonical `name` EVERYWHERE it is referenced: `properties.name`, `id` (`xi-…`), container `elements`, `[%…%]` placeholders, `data-cb-*`, `hiddenif`/`readonlyif`, workflow node references.
- `label` stays meaningful display text ("Vorname"); only the technical `name`/`id` is fixed. Apply by MEANING in any language ("Straße"/"street", …).
- Only ONE field per canonical name; for a duplicate (e.g. "Vorname des Kindes") append a distinguishing suffix (`tfAntragstellerVornameKind`).
- Fields NOT in the tables keep the default naming convention (`tf…`, `sel…`, `cb…`, `fd…`, `btn…`) with a descriptive, unique name.
- Do NOT add `data-cb-func` (no OpenPLZ.Autocomplete, no ldap.autocomplete, …) to any `tfAntragsteller*`/`tfOrg*`/technical field — the plugin maps the auth response after login. CSS formatting/validation classes (CodBi_People_Name/Mail/Phone/PLZ/BuildingNumber) are still allowed.
- NO LDAP address autocomplete for Bürger-Services forms: the person's address arrives via the auth response or German OpenPLZ.Autocomplete (`CodBi_OpenPLZ_AC_SET_*`). A citizen is NOT in an Active Directory — NEVER apply `LDAP.Autocomplete`/`CodBi_LDAP_AC_*` to person/address fields and NEVER ask for an LDAP endpoint. Apply LDAP only if the request explicitly asks for an LDAP/employee-directory lookup.
- Street/house-number autocomplete in a Bürger-Services address group ("PLZ/Ort/Straße/Hausnummer sollen sich … befüllen"): CREATE `tfStrasse` (label "Straße") and `tfHausnummer` (label "Hausnummer") with `CodBi_OpenPLZ_AC_SET_Street`/`_BuildingNumber` — NOT `tfAntragsteller*` (the canonical combined address is `tfAntragstellerAdresse`). Place them in the same fieldset as `tfAntragstellerPLZ`/`tfAntragstellerOrt` and give BOTH the SAME `rowid` (share one line).
- Fields the plugin marks Pflichtfeld/verifiziert ("must the login method fill") should be `required` where the form needs them; "verifiziert" fields are read-only/autofill after login (see the tables; e.g. the ELSTER-personal IdNr person fields and ELSTER-org StNr org fields).

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
