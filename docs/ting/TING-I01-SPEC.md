# TING · Inkrement 01 · Implementierungsauftrag

**Stand: 17. September 2026**

Dieser Auftrag beschreibt das Produkt TING, den Funktionsumfang, die Abläufe und die verbindlichen Gestaltungsquellen für seinen ersten Ausbauschritt. Die Designreferenzen liegen in den in Abschnitt 2 aufgeführten Dateien; der Umgang mit noch nicht vollständig gestalteten Zuständen ist in Abschnitt 1.5 verbindlich festgelegt. **Entwickelt wird unmittelbar für den Produktivbetrieb: eine dauerhaft verwendbare App-Codebasis.**

## Produktauftrag

### Was TING ist und welches Problem es löst

TING ist eine Web-App für Menschen, die ein Anliegen gegenüber Behörden oder anderen öffentlichen Stellen klären möchten. Solche Anliegen erfordern oft mehrere Angaben, Dokumente und Abstimmungen. Der Nutzer soll sein Anliegen in eigenen Worten schildern können; TING führt ihn durch ein Gespräch, stellt nötige Rückfragen und erklärt verständlich, was als Nächstes gebraucht wird.

Das vollständige Produkt soll auch die Zusammenarbeit zwischen Bürgern, Behörden und weiteren beteiligten Organisationen koordinieren: nötige Informationen erfragen, Zustimmungen einholen, erlaubte Schritte ausführen, Rückmeldungen verfolgen und an ausstehende Entscheidungen erinnern. Der Nutzer erlebt TING als Begleitung, die sein Anliegen fortlaufend betreut. **„Agentisch“ bedeutet hier, dass der Agent den nächsten sinnvollen Schritt aus dem Anliegen und dem tatsächlichen Bearbeitungsstand ableitet und die Arbeit im Gespräch voranbringt.**

Die zentrale Oberfläche ist deshalb ein Chat. Ein neues Anliegen beginnt mit „Neuer Vorgang“ und einer Nachricht. Formulare zur Vorgangseröffnung, Zuständigkeitstabellen und Aufgaben-Dashboards sind kein vorgeschalteter Einstieg für den Bürger.

### Nutzer und Rollen

| Rolle | Bedeutung | In diesem Auftrag |
|---|---|---|
| Bürger / Nutzer | Eine Person mit eigenem TING-Konto und eigenen Anliegen. | Registriert sich, meldet sich an und führt eigene private Gespräche mit TING. |
| TING-Agent | Die im Chat antwortende Assistenz; im Zielprodukt koordiniert sie außerdem erlaubte Arbeitsschritte. | Antwortet über ein tatsächlich angebundenes Sprachmodell, fragt nach und hilft beim Formulieren und Klären des Anliegens. |
| Betreiber | Die Person oder Organisation, die TING installiert und konfiguriert. | Erhält eine lokale Entwicklungsumgebung und richtet optional den Modellzugang ein. Dies ist keine eigene Bürgeransicht. |
| Behörde / weitere beteiligte Stelle | Eine eigenständige Partei, die in einem fachlichen Vorgang zuständig sein oder Informationen beitragen kann. | Ihre Teilnahme und ihre Oberfläche werden nicht in diesem Ausbauschritt implementiert. |

### Begriffe und Architektur

| Begriff / Bestandteil | Bedeutung und Zuständigkeit |
|---|---|
| **Verfahren** | Die allgemeine fachliche Beschreibung eines Verwaltungsablaufs mit Voraussetzungen, Schritten und beteiligten Rollen. Ein Verfahren kann später für viele einzelne Anliegen verwendet werden. |
| **Vorgang** | Das individuelle Anliegen eines Nutzers. In der hier gebauten Gesprächsbasis ist „Vorgang“ die sichtbare Bezeichnung eines normalen LibreChat-Gesprächs. Dessen `conversationId` ist seine technische Identität. Ein fachlicher Vorgangsdatensatz wird noch nicht angelegt. |
| **LibreChat** | Die Open-Source-Chat-Anwendung, deren festgeschriebenen Quellstand der Coding-Agent klont und als TING erweitert. Ihre React-Oberfläche, Node-API, Benutzerkonten, Sitzungen, Nachrichten und Persistenz werden direkt verwendet. |
| **TING-Designsystem** | Die diesem Auftrag beigefügten Farben, Schriften, Abstände und CSS-Komponenten. Sie bestimmen die gesamte sichtbare App, einschließlich Registrierung und Anmeldung. Abschnitt 5 und 6 legen die konkrete Umsetzung fest. |
| **DAML** | Die vorgesehene Grundlage für ausführbare Vereinbarungen, Zustandsänderungen, Beteiligungsrechte und Freigaben zwischen unabhängigen Parteien. Die spätere Ledger-Laufzeit setzt die modellierten Befugnisse durch. DAML wird in diesem Ausbauschritt noch nicht angebunden. |
| **Logikbackend / FactGraph** | Das vorgesehene Backend für explizite fachliche Fakten, Regeln und nachvollziehbare Schlussfolgerungen. FactGraph ist eine Python-Bibliothek. Deren spätere Dienstanbindung wird hier weder implementiert noch durch Anwendungsbedingungen nachgebildet. |
| **Dataroom** | Der spätere gemeinsame Bereich eines Vorgangs, in dem die beteiligten Parteien jeweils die für sie freigegebenen Informationen und Dokumente sehen. Kein Bestandteil dieses Ausbauschritts. |
| **Werkstatt** | Ein späteres separates Betreiberinterface zur strukturierten Pflege von Verfahren, Rollen und fachlichen Regeln. Kein Bestandteil dieses Ausbauschritts. |

Dieser Auftrag heißt **Inkrement 01 (I01)**, weil er die erste vollständig nutzbare Gesprächsbasis des beschriebenen Produkts liefert. Die geplanten Mehrparteien- und Behördenfunktionen erläutern den Produktzweck und erweitern den nachfolgenden Implementierungsumfang nicht. Der Agent dieses Inkrements führt noch keine externen Behördenaktionen aus und verspricht keine bereits erledigten Schritte.

### Was der Coding-Agent konkret baut

Eine laufende Web-App mit **echten Benutzerkonten und echten gespeicherten Chats**, vollständig in der mitgelieferten TING-Gestaltung. LibreChat liefert die technische Basis für Registrierung, Anmeldung, Sitzungen, Nachrichten, Modellanfragen und Speicherung. Der Coding-Agent integriert das beigefügte TING-Design als gemeinsame CSS-/React-Komponenten in diese Basis und liefert eine lokal startbare Produktionscodebasis.

| Ansicht | Was der Nutzer dort sieht und tun kann |
|---|---|
| **Konto erstellen** · `/register` | TING-Wortmarke und das gestaltete Registrierungsformular. Name, optionalen Benutzernamen, E-Mail und Passwort eingeben; ein echtes Konto anlegen. Anschließend zur Anmeldung gelangen. |
| **Anmelden** · `/login` | TING-Anmeldeformular. Mit dem angelegten Konto anmelden. Ungültige Eingaben und abgelaufene Sitzungen werden verständlich im selben Design erklärt. |
| **Neuer Vorgang** · `/c/new` | Links die geordnete Sidebar mit „Neuer Vorgang“, Suche, eigenen Chats und Konto. Im Hauptbereich die Begrüßung „Was möchten Sie klären?“ und die Nachrichteneingabe. Ein neuer Vorgang beginnt direkt als Chat. |
| **Gespräch** · `/c/<conversationId>` | Eigene Nachrichten rechts, Antworten von TING links, Eingabe unten. Nachrichten senden, laufende Antworten stoppen und den Verlauf lesen. Beim erneuten Öffnen erscheinen die tatsächlich gespeicherten Nachrichten. |
| **Konto** · Menü und native Kontodialoge | Die eigene Kontoidentität, Profil- und Sicherheitsfunktionen, grundlegende Chatpräferenzen, archivierte Vorgänge und „Abmelden“. Abschnitt 6.7 legt die vorhandenen nativen Komponenten fest; auch diese Flächen verwenden das TING-Design. |

Beim Öffnen der App ohne gültige Sitzung erscheint `/login`; von dort führt „Konto erstellen“ nach `/register`. Nach Registrierung geht es zur Anmeldung und nach erfolgreichem Login nach `/c/new`. Ein direkt geöffneter geschützter Chat erfordert ebenfalls die native Anmeldung.

**Ein vollständiger Nutzerablauf:** App öffnen → Konto erstellen → anmelden → „Neuer Vorgang“ öffnen → Anliegen schreiben → mit konfiguriertem Modell eine echte Antwort erhalten → Chat verlassen → über die Sidebar wieder öffnen → denselben gespeicherten Verlauf lesen. Weitere Chats lassen sich genauso beginnen; die Suche findet die eigenen gespeicherten Gespräche.

Die App bleibt ohne eingerichteten Modellzugang startbar und bedienbar. Registrierung, Anmeldung, Oberfläche, Texteingabe und vorhandene Daten funktionieren. Ein Sendeversuch ohne Modellzugang erhält einen klaren Anfragefehler und bewahrt den eingegebenen Text. Sobald der Betreiber Modellzugang ergänzt, verwendet dieselbe Implementierung den echten LibreChat-Modellpfad.

**Auch Inkrement 01 muss das freigegebene TING-Design 1:1 umsetzen. Es ist keine optische Abweichung gestattet.** Die Bedienung verwendet die hier beschriebenen normalen Chatfunktionen. Dafür sind die beigefügten CSS-Komponenten, Schriften, Abstände und Referenzansichten maßgeblich. Das Inkrement umfasst diese konkrete Benutzerstrecke; fachliche Behördenabläufe und Mehrparteienfunktionen werden in eigenen Inkrementen umgesetzt.

## 1. Umfang und Funktionsvertrag

Nach der Einrichtung öffnet der Nutzer die lokale App, legt über „Konto erstellen“ ein Konto an, meldet sich an und sieht „Neuer Vorgang“. Er kann Nachrichten schreiben und die Oberfläche bedienen. Mit konfiguriertem Modellzugang erhält er echte Antworten; gespeicherte Gespräche kann er wieder öffnen und durchsuchen.

**API-Key und Modell-ID sind optionale Laufzeitkonfiguration für Modellanfragen. Die App startet auch, wenn beide fehlen, unvollständig sind oder der Modellanbieter nicht erreichbar ist.** Registrierung, Anmeldung, Navigation, Texteingabe, Kontomenü sowie Zugriff auf bereits gespeicherte Gespräche funktionieren davon unabhängig. Fehler einer Modellanfrage betreffen diese Anfrage.

### 1.1 Enthalten

| Bereich | Ergebnis |
|---|---|
| Projekt | Eigenes lokales Git-Repository auf dem angegebenen LibreChat-Stand, nachvollziehbare Commits. |
| Entwicklung | Dokumentierte lokale Einrichtung, echte Datenbank und Verlaufssuche, Entwicklungsserver mit Frontend-Hot-Reload, reproduzierbarer Source-Build. |
| Zugang | Native Registrierung und Anmeldung in TING-Gestaltung; Abmelden und Sitzungsablauf funktionieren. |
| Oberfläche | Durchgehende TING-Schrift, Farben, Komponenten und Abstände, einschließlich Lade-/Fehlerzuständen und erreichbarer Kontodialoge. |
| Chat | Neuer Chat, native Textnachricht, echte Modellantwort, Streaming/Stoppen, gespeicherter Verlauf, Wiederöffnen und Suche. |
| Ohne Modellzugang | Nutzbare App mit editierbarem Composer; verständlicher Fehler beim Sendeversuch. Keine vorgetäuschte Antwort. |
| Geräte | Desktop und Mobil, passende Navigation, erreichbare Eingabe und sauberes Scrollen. |

### 1.2 Spätere Inkremente

DAML-Verträge, FactGraph/Python-Service, fachliche Verfahrensmodelle, Werkstatt, Behördenkonten, Beteiligung, Dataroom, Dokumentverarbeitung und Dateifreigaben, Vertretungen, Erinnerungen und proaktive Hintergrundarbeit kommen später. Für sie werden hier weder Datenmodelle noch Platzhalterdienste gebaut. Auch öffentliches Hosting und ein neuer Authentifizierungsdienst gehören nicht zu diesem Auftrag.

„Vorgang“ bezeichnet in I01 einen normalen LibreChat-Chat mit dessen `conversationId`. Die Nutzeroberfläche legt keine zusätzlichen Case-IDs, fachlichen Status oder vermeintlich erledigten Behördenaktionen an.

### 1.3 Bedeutung von „native LibreChat-Funktion“

Die vorhandenen Formulare, Validierungen, Benutzerkonten, Sitzungen, APIs, Datenmodelle und Chatmechanismen werden weiterverwendet. **Ihre sichtbare Gestaltung muss der TING-Referenz exakt entsprechen.** Die Wiederverwendung nativer Funktionalität erlaubt keine Übernahme abweichender LibreChat-Layouts oder Komponentenoptik. „Nativ“ ist keine Ausnahme vom Designsystem. Insbesondere `/login` und `/register` sind Teil der gestalteten App.

Der Coding-Agent implementiert den vollständigen oben benannten Umfang auch ohne Betreiber-API-Key. Er führt alle ohne Modellzugang möglichen Prüfungen aus. Wegen fehlenden Modellzugangs dürfen ausschließlich die davon abhängigen Providerprüfungen offenbleiben. Offene Designreferenzen und Bildnachweise werden nach Abschnitt 1.5 und 8.4 gesondert ausgewiesen. Fehlende Betreiber-Eingaben sind kein Grund, die übrige Entwicklung einzustellen, Funktionen aus dem Umfang zu entfernen oder Ersatzdienste einzubauen.

### 1.4 Direkt auf den Produktivbetrieb entwickeln

Es gibt eine App-Codebasis und deren regulären Produktionsbuild. Die implementierten Komponenten, Konfigurationsverträge, Datenpfade und Fehlerzustände bleiben Bestandteil des Produkts. Für die spätere produktive Nutzung dieses Inkrements ist kein erneuter Aufbau dieser Funktionen vorgesehen.

Vor jeder neuen Komponente, API oder Abstraktion muss ihr konkreter Bedarf im beauftragten Produktumfang feststehen. Insbesondere entstehen keine Wegwerfoberflächen, Demo-/Simulationsschalter, produktiven Mock-Adapter, parallelen lokalen Datenmodelle, Ersatz-Authentifizierung oder Schnittstellenhüllen für spätere Inkremente. Bestehende native Mechanismen werden genutzt; tatsächlich notwendige Anpassungen werden direkt an der dauerhaft vorgesehenen Integrationsstelle umgesetzt.

Fehlende oder gestörte Modellkonfiguration ist ein normaler betrieblicher Fehlerzustand derselben App, kein alternativer Produktmodus. Die Trennung der Prüfungen mit und ohne Modellzugang steuert nur, welche echten Tests gerade ausführbar sind; sie erzeugt keinen zweiten Laufzeitpfad mit Ersatzantworten.

Einrichtungsskripte, Hot Reload, Tests und Dokumentation dienen der Entwicklung und Wartung dieser einen Produktionscodebasis. Unterschiede zwischen Umgebungen werden über reguläre Konfiguration und Infrastrukturwerte ausgedrückt, nicht durch Fake-Daten oder Auth-/Berechtigungsumgehungen im Code. Die HTML-Designreferenz bleibt außerhalb der ausgelieferten Anwendung; ihr Szenariocode und ihre archivierten Ansichten werden nicht ins App-Bundle übernommen.

### 1.5 Verbindliche visuelle Übereinstimmung ab Inkrement 01

**Das freigegebene TING-Design ist die einzige zulässige Gestaltung. Bereits dieses erste Inkrement gestattet keinerlei optische Abweichung.** Der begrenzte Funktionsumfang ist keine Erlaubnis für eine vorläufige, vereinfachte, angenäherte oder anders gestaltete Oberfläche. Der Coding-Agent hat keinen gestalterischen Interpretationsspielraum.

Dies gilt für jede sichtbare Fläche und jeden erreichbaren Zustand: Anmeldung, Registrierung, Sidebar, neuer und laufender Chat, Nachrichten, Composer, Kontobereich, Menüs, Dialoge sowie Hover, Fokus, Auswahl, Laden, Leerzustand, Erfolg und Fehler. Verbindlich sind insbesondere Layout, Positionierung, Breiten und Höhen, Abstände, Originalschriften, Schriftgrößen und -gewichte, Zeilenhöhen, Umbrüche, Farben, Rahmen, Radien, Schatten, Icons und responsive Regeln. „Ähnlich“, „im TING-Stil“ oder „funktional gleichwertig“ erfüllt diese Anforderung nicht.

LibreChat liefert die Funktionsmechanismen. Dessen technische Integration wird so gestaltet, dass die freigegebene Optik unverändert umgesetzt wird. Technische Bequemlichkeit, vorhandene Default-Styles, fehlende Providerkonfiguration oder der frühe Ausbaustand rechtfertigen keine sichtbare Abweichung. Es werden weder fremde Standardansichten ausgeliefert noch sichtbare Abweichungen auf ein späteres Inkrement verschoben.

Die in Abschnitt 1 ausdrücklich ausgeschlossenen Funktionen erweitern den Umfang nicht. Reale Namen, Titel und Gesprächsinhalte stammen aus den echten Daten der App. Dieser begrenzte Inhalt und Funktionsumfang erlaubt kein eigenständiges Redesign der enthaltenen Elemente.

Ist eine Darstellung durch die freigegebenen Referenzansichten, CSS-Komponenten und Zustandsregeln nicht eindeutig festgelegt, liegt eine **offene Designreferenz** vor. Der Coding-Agent benennt die konkrete Lücke und klärt sie mit dem Auftraggeber, bevor er für diese Stelle eine neue sichtbare Gestaltung festlegt. Er ersetzt fehlende Festlegungen weder durch LibreChat-Defaults noch durch eigene Entwürfe. Die übrigen eindeutig festgelegten Arbeiten werden fortgesetzt. Eine widersprüchliche Maßangabe in dieser Spec ist ebenfalls zu klären und keine Erlaubnis, die Referenz zu verändern.

Die visuelle Abnahme nach Abschnitt 8.4 ist verpflichtend. Eine Umsetzung mit sichtbaren Gestaltungsabweichungen ist nicht fertig und darf nicht als vollständig abgenommen bezeichnet werden. Browser- oder betriebssystembedingte Schriftglättung ändert diese Anforderung nicht: Referenz und Implementierung werden für den Bildvergleich in derselben Renderumgebung geprüft.

## 2. Quellen und Übergabe

### 2.1 Maßgebliche Dateien

Das Übergabepaket enthält diese Spec, `REFERENCE-MANIFEST.json`, `verify-reference.py` und den vollständigen statischen Referenzbaum `design-reference/dist/`. Beide BundesSansWeb-Schriften liegen bei. Ein Zugriff auf die geschützte Website wird für die Implementierung nicht benötigt.

Im entpackten Übergabeverzeichnis:

```sh
python3 verify-reference.py
python3 -m http.server 4173 --bind 127.0.0.1 --directory design-reference/dist
```

Referenzansichten:

- Neuer Chat: <http://127.0.0.1:4173/?embed=1#/neu/new>
- Anmeldung: <http://127.0.0.1:4173/?embed=1#/anmeldung/pflege>
- Gespräch und Nachrichtenkomponenten: <http://127.0.0.1:4173/?embed=1#/gespraech/pflege>
- Kontogestaltung: <http://127.0.0.1:4173/?embed=1#/profil/pflege>
- Komponenten: <http://127.0.0.1:4173/?embed=1#/komponenten/pflege>
- Ansichten und Zustände: <http://127.0.0.1:4173/?embed=1#/katalog/pflege>

Diese Dateien enthalten die klickbaren Designansichten, jedoch keine vollständige aktuelle Screenshotserie für alle Inkrement-01-Zustände. Die beigefügten `dist/references/*.png` allein belegen nicht sämtliche aktuellen Ansichten. Maßgeblich ist die aus dem festgeschriebenen HTML-/CSS-Stand gerenderte Referenz. Die vollständige Registrierung und die nativen Sicherheitsfolgeansichten liegen darin nicht als eigenständige fertige Screens vor. Für diese gelten die exakt benannten TING-Komponenten; jede darüber hinaus fehlende Komposition ist nach Abschnitt 1.5 vor ihrer Gestaltung zu klären. Die zusätzlichen Referenzrouten erweitern den Funktionsumfang von I01 nicht.

`TING_DESIGN_SOURCE_DIR` bezeichnet das absolute Verzeichnis `design-reference`, also die Ebene oberhalb von `dist`. Der Pfad dient dem Einlesen der Gestaltungsquellen beim Implementieren. Die ausgelieferte App enthält ihre Assets selbst und benötigt diesen Ordner zur Laufzeit nicht.

Verbindliche Zuständigkeit der Quellen: Diese Spec bestimmt den Funktionsumfang und die Abläufe. Das freigegebene, im Paket festgeschriebene TING-Design mit seinen aktuellen HTML-Ansichten, CSS-Komponenten, Originalassets und dem Designsystem bestimmt die Optik. Die in Abschnitt 5 und 6 aufgeschriebenen Maße dokumentieren diese Gestaltung und erlauben keine davon abweichende Neuinterpretation. Der gepinnte LibreChat-Code bestimmt die wiederverwendeten technischen Mechanismen, nicht das Aussehen. Bei einem Widerspruch zwischen einer Maßangabe dieser Spec und der Designreferenz gilt die Designreferenz; der Widerspruch wird dokumentiert und geklärt, statt eine dritte Variante zu erfinden. Die Registrierung verwendet den festgelegten Anmelderahmen und dessen identische Formkomponenten mit den in Abschnitt 6.2 aufgezählten Feldern.

Für die Umsetzung gelten die oben benannten Referenzansichten und ihre CSS-Komponenten. Das JavaScript der HTML-Referenz dient ausschließlich ihrer Darstellung; die produktiven Chat- und Authentifizierungspfade kommen aus LibreChat.

### 2.2 Festgeschriebene Ausgangsbasis

```json
{
  "spec_id": "TING-I01",
  "librechat_repository": "https://github.com/danny-avila/LibreChat.git",
  "librechat_commit": "9e83b10545e70b2f3d69a19c0cbe5121aaa86e5e",
  "librechat_version_label": "v0.8.8-rc3",
  "node": "24.16.0",
  "npm": "11.13.0",
  "ting_design_commit": "44ae881d1d29f5db14d5b0dcae211865687555f4",
  "reference_assets_sha256": {
    "dist/css/tokens.css": "ef6cfb4c91bc86ecda70a5b67a475227836d6a15a116a8e7c1c7c6e9277fadbe",
    "dist/css/components.css": "6c34f1b0d98ca9c8931fb2efc58f3b4be56cb248c2ad5953c07308daa5c9c60f",
    "dist/css/layout.css": "bb1aef3d6701c75d558edb9ab1873a5f6ee1ecf505dffe521246326be6127fdf",
    "dist/css/conversation.css": "939ce9888aca198faadea5c48854ccd452164b87ca3ffc8aea115e2df9c0076a",
    "dist/js/conversation.js": "886967aea820ad262913efee0481da357c75133aff2be77fa83e061bd6619620",
    "dist/js/components.js": "c72e11b4fbdec658626143c6f1aff8b9887168a293f8e6c2b49e33f11ca11d39",
    "dist/js/agent-workspace.js": "e6c9540148af7267aae00583f3527e90de7d0173c822770394db5d79a317be91",
    "dist/docs/DESIGNSYSTEM.md": "02af0e2d451471610d8715cfa0785b4197ed87512ac4e2ea0601de38b425635a",
    "dist/fonts/BundesSansWeb-Regular.woff2": "975febb2de13aa26880ebff329c90452b38548132a619834c21a51b11ecd336a",
    "dist/fonts/BundesSansWeb-Bold.woff2": "e1d3944dea2b7a8a3fe4968981a6b0ca19680b7dd833ddf8891260b14a8272a1",
    "dist/css/account.css": "a2d3225cd68aa85ed690925fe0caa486c712ecb1e6299f2d0d11525af011ce08",
    "dist/js/views-core.js": "2ed5a670468aad043e5c7a8bf3ddc628e305d7dc46085916cecf1b9326c5c7a7",
    "dist/js/app.js": "6d001424246393beacd36be8765fd9a752a85a818fd01acc0d574a45d18f75ef"
  },
  "upstream_sha256": {
    "package-lock.json": "c442f729c1ee1abe836216feb6d8abdeb4314549a9728cf990397fe2519d476e",
    "package.json": "9404796b55f3b7b999d1b68d05e5a788142335e5664438357e0dfe41a174a58d",
    ".nvmrc": "2722b61f414f07f08be7f1f1316012813818f26f1c40d6a24a748686cec7d2ff",
    "Dockerfile": "e65f495505ac198893cd41fd42386ec375984db838c3fda505b71e38769e4dbc",
    "Dockerfile.multi": "755d29235c78dc0a3999dcefd32b2c21f36d27e5bc8d23e8de36a989ab922c2d"
  },
  "reference_routes": {
    "new_chat": "/?embed=1#/neu/new",
    "login": "/?embed=1#/anmeldung/pflege"
  }
}
```

Der LibreChat-Pin ist ein Release Candidate. Er ist die hier geprüfte Codebasis; eine bestandene Implementierungsabnahme muss der Coding-Agent anhand der gebauten App nachweisen. Lockfile und Source-Pin sichern Reproduzierbarkeit. Keine beiläufigen Dependency-Upgrades während der UI-Umsetzung.

## 3. Projekt und lokale Entwicklung

### 3.1 Lokales Git-Repository

Im vorgesehenen Projekt-Elternverzeichnis:

```sh
git clone --origin upstream https://github.com/danny-avila/LibreChat.git ting
cd ting
git switch -c ting/increment-01 9e83b10545e70b2f3d69a19c0cbe5121aaa86e5e
```

Der Klon ist das TING-Repository mit erhaltener LibreChat-Historie. Existiert ein passender Klon bereits, ihn prüfen und weiterverwenden; andere Dateien oder Änderungen erhalten. Den gepinnten Commit bei Bedarf von `upstream` nachladen. `AGENTS.md` und `CLAUDE.md` des gepinnten Repos lesen.

Code, gemeinsame Styles, diese Spec und Entwicklungsdokumentation werden lokal versioniert. Private `.env`-Dateien, Zugangsdaten und Laufzeitdaten bleiben über `.gitignore` ausgeschlossen. In nachvollziehbaren Arbeitsschritten committen. Die Entwicklungsserver dürfen selbstverständlich auch mit uncommittierten Änderungen laufen. Zur Übergabe werden Repositorypfad, Branch und getesteter Implementierungscommit genannt. Ein Remote-Projekt oder Push ist für diese lokale Einrichtung nicht erforderlich.

### 3.2 Technische Basis

| Bestandteil | Stand / Verwendung |
|---|---|
| Node / npm | Node 24.16.0, npm 11.13.0; native npm-Workspaces und `package-lock.json`. |
| Frontend | React 18.3.1, TypeScript 5.9.3, Vite 8.2.2. |
| UI | Tailwind 3.4.1, vorhandene zugängliche Primitives, `@librechat/client` und dessen ThemeProvider. |
| Datenabruf / Zustand | Bestehende TanStack-Query- und Zustandsbesitzer erhalten. Keine umfassende Recoil-/Jotai-Migration. |
| Backend | Bestehender Express-/Node-Server; neue notwendige Backendlogik gemäß Repositorystruktur in TypeScript unter `packages/api`. |
| Persistenz / Suche | MongoDB `mongo:8.0.20`, Meilisearch `getmeili/meilisearch:v1.35.1`. |
| Browserprüfung | Playwright 1.62.1 aus dem gepinnten Repo mit passendem Chromium. |

Bestehende LibreChat-Funktionen werden an ihren vorhandenen Aufrufstellen integriert. Keine zusätzliche App-Shell, keine zweite Sessionverwaltung, kein eigener Chattransport und kein eigener Markdownparser. Zusätzliche Dateien sind zulässig, wenn sie diese Implementierung sauber strukturieren; es gibt keine künstliche Dateiliste, auf die Änderungen beschränkt wären.

### 3.3 Einrichtungsablauf

Voraussetzungen sind Git, die angegebenen Node-/npm-Versionen und Docker Compose v2. Der Coding-Agent liefert `scripts/ting/setup.mjs`, `compose.ting.yaml` sowie eine kurze `docs/ting/ENTWICKLUNG.md` mit dem tatsächlich geprüften Ablauf.

```sh
npm ci
npm run build:packages
node scripts/ting/setup.mjs
npm run build:client
docker compose -f compose.ting.yaml up -d --build
```

Danach ist die gebaute Anwendung unter <http://localhost:3080> erreichbar. **Dieser Ablauf funktioniert ohne OpenAI-Key, ohne Modell-ID, ohne SMTP und ohne vorab angelegte Benutzer.**

Der Setup-Schritt läuft mit Node und den installierten Repository-Abhängigkeiten. Gemeinsame Pakete sind durch den vorherigen nativen Build bereits verfügbar, falls Setup deren Schema-/Konfigurationsmodule verwendet. Er erzeugt fehlende lokale Dateien und notwendige App-Secrets einmalig; vorhandene Werte, Konten und Daten bleiben erhalten. Er fordert keinen Modellzugang an und nimmt keine Verbindung zum Modellanbieter auf. Die lokale Konfiguration nennt TING als App-Titel, aktiviert die Registrierung und enthält zunächst leere optionale Provider-Eingaben.

Für Änderungen an der Frontendoberfläche wird zusätzlich in einem zweiten Terminal gestartet:

```sh
npm run frontend:dev
```

Vite bedient lokal Port 3090 und leitet `/api` an die laufende API auf Port 3080 weiter. Die dokumentierten Umgebungswerte müssen dieses Verhalten tatsächlich erhalten; `PORT=3080` aus dem API-Prozess darf den Vite-Prozess nicht auf denselben Port setzen. Beide Aufrufe verwenden denselben Hostnamen `localhost`. Registrierung, Cookie-Sitzung und Chat werden auch über den Vite-Einstieg geprüft.

Änderungen an gemeinsamen Paketen werden mit dem vorhandenen passenden Workspace-Build neu gebaut, zum Beispiel `npm run build:client-package`; API-Änderungen gelangen durch erneutes `docker compose -f compose.ting.yaml up -d --build` in die lokale Laufzeit. Der Entwicklungsleitfaden benennt diese beiden Fälle. Ein vollständig eigener Build-/Watch-Orchestrator ist nicht erforderlich.

### 3.4 Lokaler Stack

`compose.ting.yaml` enthält die eigentliche App, MongoDB und Meilisearch. Die App wird aus dem bearbeiteten Projekt mit `Dockerfile.multi`, Target `api-build`, gebaut. Die gebaute UI enthält TING-Styles und Schriften. Die npm-Version wird auch im Container eingehalten. Ein vorgebautes unverändertes LibreChat-Image kann diesen Source-Build nicht ersetzen.

Die API veröffentlicht Port 3080 nur lokal. MongoDB und Meilisearch sind im internen Compose-Netz erreichbar und verwenden persistente Volumes. App-Laufzeitdaten liegen im vorgesehenen persistenten `/app/data`. Neustart und `compose down` erhalten diese Daten; zum normalen Starten, Stoppen oder Aktualisieren werden keine Volumes gelöscht.

Private Konfiguration ist unter `/app/.env`, die erzeugte LibreChat-Konfiguration unter `/app/librechat.yaml` verfügbar; `CONFIG_PATH` zeigt auf diese Datei. Keine Werte mit Provider- oder Session-Secrets werden ins Browserbundle eingebaut. Meilisearch erhält seinen echten lokalen Master-Key. Die Healthchecks betreffen die tatsächlich gestarteten lokalen Dienste und sind unabhängig vom Modellanbieter.

RAG, Redis, Vektordatenbank, DAML und Python-Service werden hier nicht benötigt. Eine optionale Upstream-Warnung über einen ungenutzten Dienst ist kein Auftrag, diesen Dienst vorsorglich aufzusetzen. Fehler der tatsächlich benötigten Datenbank, fehlende Portbindung oder ungültige Konfigurationssyntax werden konkret gemeldet; sie werden nicht durch Ersatzdaten verdeckt.

### 3.5 Lokale Konfiguration und Konten

Verbindliche lokale Werte:

```dotenv
HOST=0.0.0.0
PORT=3080
DOMAIN_CLIENT=http://localhost:3090
DOMAIN_SERVER=http://localhost:3080
APP_TITLE=TING
ENDPOINTS=openAI
MONGO_URI=mongodb://mongodb:27017/LibreChat
CONFIG_PATH=/app/librechat.yaml
SEARCH=true
MEILI_HOST=http://meilisearch:7700
MEILI_NO_ANALYTICS=true
USE_REDIS=false
USE_REDIS_STREAMS=false
USE_REDIS_CLUSTER=false
ALLOW_EMAIL_LOGIN=true
ALLOW_REGISTRATION=true
ALLOW_SOCIAL_LOGIN=false
ALLOW_SOCIAL_REGISTRATION=false
ALLOW_PASSWORD_RESET=false
ALLOW_UNVERIFIED_EMAIL_LOGIN=false
SESSION_COOKIE_SECURE=false
ALLOW_SHARED_LINKS=false
ALLOW_SHARED_LINKS_PUBLIC=false
OPENAI_API_KEY=
OPENAI_MODELS=
```

`HOST`/`PORT` sind API-Containerwerte. Sie werden dem Vite-Prozess nicht als Shell-Umgebung vererbt. `DOMAIN_CLIENT` nennt den Vite-Einstieg, `DOMAIN_SERVER` die gebaute App/API; beide lokalen Origins sind damit im nativen Origin-Guard bekannt. Die bestehende Vite-Konfiguration verwendet den lokalen Proxy; der Coding-Agent prüft die tatsächlich aufgelösten URLs. Keine pauschale CORS-Freigabe und kein Abschalten des Origin-Guards.

Das Setup erzeugt mit einem kryptografischen Zufallsgenerator `CREDS_KEY` mit 32 Bytes als Hex, `CREDS_IV` mit 16 Bytes als Hex, `JWT_SECRET`, `JWT_REFRESH_SECRET` und `MEILI_MASTER_KEY` mit jeweils mindestens 32 Zufallsbytes. Diese Werte bleiben bei Wiederholung erhalten. Das lokale Setup erledigt ihre Bereitstellung, der Nutzer muss sie nicht einzeln beschaffen.

SMTP-Werte bleiben ungesetzt. Am gepinnten Stand unterstützt LibreChats native Registrierung diesen lokalen Betrieb: Ohne Mailkonfiguration setzt der native Registrierungsdienst den entsprechenden verifizierten Accountzustand selbst. Es werden dafür weder DB-Dokumente von Hand verändert noch Bestätigungsmails vorgetäuscht. Diese lokale Kontobereitstellung behauptet keine Identitätsprüfung durch eine Behörde.

Ein Nutzer legt sein Konto direkt über `/register` an. Die native Registrierung erzeugt keine Sitzung. Nach der normalen Registrierungsantwort führt die UI direkt zu `/login` mit „Sie können sich jetzt anmelden.“; nach erfolgreichem nativem Login zu `/c/new`. Keine künstliche Wartezeit. Die neutrale Bestätigung erhält LibreChats Schutz gegen das Ermitteln bestehender E-Mail-Konten; eine bereits vergebene E-Mail erhält keinen neu erfundenen Enthüllungsfehler.

Für Tests legt der Coding-Agent zwei getrennte Konten über den echten Registrierungsweg an, bei Bedarf mit privat gespeicherten zufälligen Kennwörtern. Gewünschte Testidentitäten oder administrative CLI-Vorarbeit des Nutzers sind keine Einrichtungsvoraussetzung. Native Validierung, Kennwort-Hashing, Sitzungscookies, Ratenbegrenzungen und kontoabhängige Datenfilter bleiben wirksam.

Die lokale Standardkonfiguration bietet Login und Registrierung an. Ein späterer ausdrücklich konfigurierter Betriebsmodus mit deaktivierter Registrierung blendet auch deren Einstieg aus; im hier gelieferten lokalen Start ist sie aktiviert. Ein Passwort-Reset-Link erscheint nur mit tatsächlich aktivierter nativer Reset-Funktion. Es gibt keinen toten Link zu einem unkonfigurierten Mailablauf.

## 4. Modellzugang und Chatverhalten

### 4.1 Konfiguration ist unabhängig vom App-Start

Die einzigen Betreiber-Eingaben für den in I01 vorgesehenen nativen OpenAI-Pfad sind `OPENAI_API_KEY` und eine einzelne tatsächlich zugängliche Modell-ID in `OPENAI_MODELS`. Beide sind beim ersten Start leer. Es wird kein erfundener Key, keine Dummy-Modell-ID und kein automatisch angenommener Modellname eingesetzt.

Nach Eintragen beider Werte in die private lokale Umgebung aktualisiert der Nutzer die abgeleitete Konfiguration mit `node scripts/ting/setup.mjs` und erstellt den API-Container mit `docker compose -f compose.ting.yaml up -d --force-recreate api` neu. Ein UI-Neubau ist dafür nicht erforderlich. Konten und Gespräche bleiben bestehen. Der Leitfaden beschreibt diesen Ablauf genau einmal.

Bei fehlenden Werten lässt das Setup den Provider unkonfiguriert und den optionalen Abschnitt `modelSpecs` weg. Bei vorhandenen Werten verwendet es LibreChats native Endpoint- und `modelSpecs`-Konfiguration mit genau diesem Modell und dem Anzeigenamen TING: `enforce: true`, `prioritize: true`, ein Listeneintrag mit `name: ting-chat`, `label: TING`, `default: true`; dessen `preset` enthält `endpoint: openAI`, `model` aus `OPENAI_MODELS`, `modelLabel: TING` und den Präfixtext aus 4.3. Die Endpointeinstellung lautet `endpoints.openAI.titleModel: current_model`.

Der konkrete Modellname wird über den vorhandenen YAML-Serializer geschrieben, nicht per unbelegter `${...}`-Interpolation. Die Konfiguration verwendet die vorhandene Schema-Version `1.3.16`. Die Schema-Prüfung kontrolliert die Struktur, nicht Erreichbarkeit oder Berechtigung beim externen Anbieter. Es gibt keinen Key-/Modellvorabtest als Bedingung für den Serverstart.

Das Modellangebot und seine aktuelle Konfiguration werden aus den nativen serverseitigen Konfigurationsdaten abgeleitet. Ein gemeinsamer Resolver liefert `configured` oder `not_configured` anhand der geladenen Endpoint-/Modellkonfiguration und vorhandenen Credentials. Derselbe Resolver wird für die authentifizierte Startupantwort und für den Generierungsaufruf verwendet. Falls das bestehende Payload diesen Zustand nicht vollständig abbildet, wird dort ein schema-definiertes `chatCapability` mit diesem Status ergänzt. Es enthält keine Secrets und behauptet bei `configured` keine geprüfte externe Erreichbarkeit.

Es gibt keinen zweiten handgepflegten „bereit“-Schalter, keinen Browser-Key und keinen separaten TING-Konfigurationsdienst. Modelllisten-Fallbacks und der native automatische Wechsel auf andere Endpoints dürfen keinen konfigurierten TING-Anbieter vortäuschen, wenn die optionalen Eingaben fehlen. Noch ladende Startupdaten sind von einem geladenen `not_configured`-Zustand zu unterscheiden. Ein ungültiger Key oder fehlender Zugriff auf das konfigurierte Modell wird durch die tatsächliche Anfrage sichtbar.

### 4.2 Verhalten ohne Modellzugang

| Situation | Verbindliches Verhalten |
|---|---|
| Keine Provider-Eingaben, App starten | Backend und Frontend starten; Login, Registrierung, lokale Dienste und Chatoberfläche sind erreichbar. |
| Nur Key oder nur Modell-ID vorhanden | Gleicher Start und gleiche Nutzbarkeit; Modellanfragen gelten als noch nicht konfiguriert. |
| Neuer Chat ohne Modellzugang | Vollständige TING-Begrüßung und editierbarer Composer. Keine globale Sperrseite, kein Einrichtungsdialog im Bürgerchat. |
| Text schreiben | Normale Eingabe, Umbruch und Autofokus-/Resize-Verhalten. Der Entwurf bleibt beim Konfigurationsfehler erhalten. |
| Nicht leeren Text senden, Provider unkonfiguriert | Verständlicher Fehler im Anfrage-/Composerbereich: „TING kann gerade nicht antworten. Bitte versuchen Sie es später erneut.“ Keine Modellanfrage und kein künstlich erzeugter Chatdatensatz oder Assistentenbeitrag. |
| Key ungültig, Anbieter nicht erreichbar, Rate-Limit oder Modellzugriff abgelehnt | Native tatsächliche Anfrage schlägt sichtbar fehl; die App bleibt benutzbar. Nachricht/Entwurf und Retry folgen dem nativen Fehlerpfad, ohne erfundene Erfolgsantwort. |
| Bereits gespeicherten Chat öffnen | Echte gespeicherte Nachrichten anzeigen, auch wenn der Modellzugang inzwischen entfernt wurde. |

LibreChats `ChatForm` koppelt am Pin Teile der Eingabe an einen ausgewählten Endpoint. Für TING muss der Eingaberahmen auch ohne Endpoint rendern können. Nur der tatsächliche Absendeweg benötigt einen konfigurierten Provider. Dafür die bestehende Forminstanz erhalten und die Darstellungsbedingung gezielt lösen. Keine zweite Formularimplementierung und keine Dummy-Auswahl einführen.

Die Prüfung findet zusätzlich serverseitig am tatsächlichen Modellanfragepfad statt. Am Pin ist das `/api/agents/chat/:endpoint`; auch gewöhnliche Textchats verwenden dort die native interne Agentenpipeline. Ihre internen Mechanismen bleiben erhalten, obwohl die Bürgeroberfläche keinen Agentenbuilder anbietet. Nach Auth-/Zugriffsprüfung und vor Anlage einer Generierung wird ein unkonfigurierter direkter Request mit HTTP 503 und dem gemeinsamen Fehlercode `MODEL_NOT_CONFIGURED` abgewiesen. Der Code wird im vorhandenen Fehlervertrag geführt. Es entsteht kein fingierter SSE-Stream. In technischen Logs darf die konkrete Ursache als Konfigurations-/Providerfehler erscheinen; im Bürgerchat stehen weder Schlüssel noch Stacktraces noch Anweisungen an den Entwickler.

### 4.3 Verhalten mit Modellzugang

Das konfigurierte Modell nutzt den nativen LibreChat-Provider, dessen Message-Lifecycle, Streaming, Stop, Speicherung und Titelgenerierung. `titleModel: current_model` verwendet das tatsächlich ausgewählte Modell. Name und Provider-ID werden nicht verwechselt. Ein einzelnes Betreibermodell reicht für I01; ein Modellmenü im Bürgerchat wird nicht benötigt.

Der feste TING-Präfixtext lautet:

> Du bist TING und hilfst dabei, Anliegen im Gespräch zu klären. Antworte auf Deutsch, klar und knapp. Frage nach, wenn nötige Angaben fehlen. Behaupte keine ausgeführten Aktionen, Behördenkontakte oder Erinnerungen ohne bestätigtes Werkzeugergebnis.

Dieser Text wird als native `preset.promptPrefix` des konfigurierten Modells gesetzt. Er enthält keine fachlichen Berechtigungen oder Behördenregeln. Die erste Antwort darf ein Anliegen klären; sie behauptet keine bereits ausgeführten Schritte eines späteren agentischen Workflows.

Die normale Textbedienung bleibt erhalten: leere Nachricht nicht absenden, standardmäßig Enter zum Senden, Shift+Enter für Zeilenumbruch und nativer IME-Kompositionsschutz. Eine ausdrücklich geänderte native Sendepräferenz wird respektiert. Eine laufende Anfrage kann über den nativen Stop-Pfad beendet werden. Der Wechsel von neuer zu gespeicherter Conversation verwendet native Routen und IDs. Modellantworten werden nicht in der Oberfläche fingiert.

### 4.4 Funktionsprofil ohne unnötige Zusatzoberflächen

Die TING-Komposition zeigt die in Abschnitt 1 beauftragten Bedienelemente. Für I01 werden weder Modell-/Agentenauswahl noch Werkstatt, Projekte oder eine zweite Icon-Navigation ergänzt. Datei-, Sprach- und Toolaktionen werden erst mit ihren eigenen Inkrementen gestaltet; entsprechende unbenutzte Controls sind im Textchat nicht vorhanden.

Soweit LibreChat hierfür Konfiguration anbietet, wird sie verwendet: `fileConfig` deaktiviert Uploads einschließlich Drop/Paste; native Interface-/Speech-Einstellungen steuern deren angebotene Oberfläche. Gespeicherte alte Präferenzen dürfen keine unimplementierten Controls wieder einblenden. Dafür keine vorhandenen Chat-/Auth-/Persistenzfunktionen entfernen. Ein neuer allgemeiner Feature-Flag- oder Berechtigungsbaukasten ist nicht erforderlich.

Die native Konfiguration wird in ihrem vorhandenen Schema geführt. Nur tatsächlich nötige Integrationsfelder werden ergänzt und aus diesem Schema typisiert. TING ist in diesem Projekt die durchgängige App-Gestaltung; ein zusätzlicher `interface.ting`-Schalter und ein nachträgliches Umschalten nach Login entfallen.

## 5. Designsystem

### 5.1 Geltung und gemeinsame Quelle

Es gilt das Verbot optischer Abweichungen aus Abschnitt 1.5. TING setzt auf **allen sichtbaren Flächen dieses Inkrements** die freigegebene Gestaltung exakt um: Anmeldung, Registrierung, deren Lade-/Fehler-/Erfolgszustände, Chat, Sidebar, Kontomenü und erreichbare native Kontodialoge. Native LibreChat-Komponenten liefern ihr vorhandenes Verhalten und werden mit den gemeinsamen TING-Komponenten gestaltet. Eine unveränderte LibreChat-Anmeldeoberfläche gehört nicht zum Soll.

Das Branding wird am gemeinsamen Clientroot oberhalb der Auth- und App-Routen eingerichtet. Schrift, Hintergrund und Grundfarben stehen bereits vor dem Laden der Startup-Konfiguration bereit. TING ist das Design dieses Projekts; dafür wird kein neues backendseitiges `interface.ting`-Featureflag und keine Anmeldungsvoraussetzung eingeführt. Eine gespeicherte frühere LibreChat-Themeauswahl darf die TING-Gestaltung nicht verdrängen. Der vorhandene ThemeProvider und die bestehende CSS-/Tailwind-Pipeline bleiben die Integrationspunkte.

Die mitgelieferte `tokens.css` ist die Gestaltungsquelle. Ihre Werte werden in einem gemeinsamen TING-Themebereich über die vorhandene CSS-/Tailwind-Pipeline verwendet. Sie darf die kanonische Tokendatei bleiben; eine Umstellung auf JSON und ein zusätzlicher Tokengenerator sind nicht erforderlich. Für die native Theme-Anbindung nur die tatsächlich nötige Zuordnung ergänzen. Der helle TING-Modus gilt auf allen Routen. Farben und Maße werden nicht pro Ansicht oder Komponente erneut definiert.

Alle TING-Komponenten beziehen Farbe, Schrift, Abstand und wiederkehrende Maße aus diesen Tokens. Native LibreChat-Farbrollen verwenden **bloße RGB-Kanalwerte**, beispielsweise `0 113 173` für `#0071ad`, weil native Tailwindklassen daraus `rgb(var(...) / alpha)` bilden. Die TING-Komponenten und nativen Farbrollen referenzieren dieselbe zentrale Palette. Werden die Grundfarben dafür als RGB-Kanäle gespeichert, beziehen die vollständigen TING-CSS-Farbwerte sich mit `rgb(var(...))` auf diese Kanäle; die resultierenden Farben bleiben unverändert. Die Zuordnung erhält semantische Unterschiede: weißer Navigationshover wird nicht zum globalen Hoverhintergrund aller Controls.

| Rolle | Verbindlicher Wert |
|---|---|
| Text | `#111314` |
| Nebentext | `#63686a` |
| Aktion / Fokus / Link | `#0071ad` |
| Aktionshover | `#004b76` |
| Hauptfläche | `#ffffff` |
| Sidebar / Nutzerbubble | `#eeeff1` |
| Agentenbubble / dezente Hervorhebung | `#ebf3f8` |
| Standardrahmen | `#cfd2d3` |
| Weicher Rahmen | `#e0e3e5` |
| Agentenrahmen | `#e1edf4` |
| Navigationshover-Markierung | `#9ba1a5` |
| Composerrahmen | `#bec4c8` |
| Composerplatzhalter | `#777d80` |
| Fehler / Fehlerhintergrund / Fehlerrahmen | `#b54235` / `#fff1ef` / `#e7b5ad` |
| Erfolg / Erfolgshintergrund / Erfolgsrahmen | `#397451` / `#eff8f1` / `#c4ddcb` |
| Warnung / Warnhintergrund / Warnrahmen | `#946313` / `#fff8e9` / `#e8d4a9` |

Die übrigen im Referenztokenfile vorhandenen Werte bleiben erhalten; nur in diesem Inkrement benötigte Komponenten werden implementiert. Zusätzliche im folgenden Abschnitt ausdrücklich genannte Maße und Schatten werden einmalig als benannte Rollen in dieselbe Tokendatei aufgenommen.

### 5.2 Schrift, Abstände und Zustände

- **BundesSansWeb Regular 400 und Bold 700** aus den beiden mitgelieferten WOFF2-Dateien. Die Fonts über LibreChats vorhandenen `$fonts`-Alias und Vites Assetverarbeitung einbinden, damit Entwicklung und Build dieselben Dateien ausliefern. `publicDir` ist am Pin deaktiviert; deshalb keine ungebündelten absoluten `/fonts/...`-URLs und kein separater Fontkopierprozess.
- `@font-face`: `font-style: normal`, die jeweiligen Gewichte 400/700, `font-display: swap`. Basisfont `BundesSansWeb, Calibri, Verdana, Arial, sans-serif`, `font-synthesis: none`, Rootgröße 16 px, Zeilenhöhe 1,45, `box-sizing: border-box`.
- Gemeinsame Spacingskala: **2, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96 px**. Margin, Padding und Gap verwenden deren Tokens, `0`, `auto` oder ausdrücklich benötigte Berechnungen daraus.
- Ein Elterncontainer besitzt den Abstand zwischen seinen Kindern. Gap und Außenmargin werden nicht für denselben Zwischenraum addiert. Ein sich öffnender Inhaltscontainer hat **16 px Abstand** zum auslösenden Inhaltsblock. Das gilt für tatsächliche aufklappende Inhalte; Dropdowns und Dialoge verwenden die Positionierung und Abstände der TING-Referenz; native Primitives liefern ausschließlich das technische Verankerungs-, Kollisions- und Fokusverhalten. Abweichende native Abstände werden nicht übernommen.
- Formfelder: Labelabstand 6 px; zusammengehörige Inhalte 8 px; Inhaltsblöcke 16 px; Abschnitte 24 px. Kein zusätzlicher Trennbalken als Ersatz für diese Gruppierung.
- Fokus: sichtbarer 2-px-Ring in Aktionsblau mit 3 px Abstand. Beim Composer zeigt die gesamte Composerfläche den Fokus; der Textarea erhält keinen zusätzlichen Rahmen. Im Eingabefeld bleibt der native Textcursor erhalten.
- Deaktivierte Controls: 50 % Deckkraft, keine Hoveränderung und keine Auslösung. Ein fehlender API-Key deaktiviert weder die gesamte App noch das Schreiben im Composer.
- Keine neuen Rahmen erst beim Hover. Textaktionen sind dauerhaft erkennbare Buttons; echte Navigationslinks bleiben Links. Produktlinks ohne Unterstreichung, Hover dunkelblau. Links innerhalb normaler Markdownnachrichten behalten ihre native sichere Linksemantik; ihre sichtbare Darstellung folgt exakt der TING-Nachrichtenreferenz. Native Markdown-Defaultstyles sind keine Gestaltungsquelle.
- `prefers-reduced-motion` und Forced-Colors bleiben unterstützt. Keine hinzugefügten rein dekorativen Animationen.

### 5.3 Gemeinsame Komponenten

Die vorhandenen zugänglichen Primitives werden in gemeinsame TING-Bausteine gefasst. Komponenten reichen `ref`, native Events, `name`, `id`, `disabled`, `type` und `aria-*` weiter. Formregistrierung, Authentifizierung, Requests und Sessionzustand bleiben bei ihren nativen Besitzern.

| Baustein | Aussehen und Vertrag |
|---|---|
| `TingButton` | Varianten `primary`, `secondary`, `danger`; Größen `compact`, `form`, `navigation`. Permanente Rahmen von 1 px in allen Zuständen. Native Buttonsemantik; für Navigation ein Link mit passender Gestaltung. |
| `primary` | Fläche/Rahmen Aktionsblau, Text weiß; Hover Fläche/Rahmen dunkelblau. |
| `secondary` | Fläche weiß, Rahmen/Text Aktionsblau; Hover Fläche Highlight, Rahmen/Text dunkelblau. |
| `danger` | Fläche weiß, Rahmen/Text Fehlerrot; Hover Fehlerhintergrund. Nur für tatsächlich destruktive Aktionen, nicht Wiederholen. |
| `compact` | `min-height: 32px`, bei grobem Zeiger `36px`; Schrift 14 px, Gewicht 400, Zeilenhöhe 1,35; `padding: 4px 8px`, `gap: 6px`, Radius 5 px, Icon 14 px. |
| `form` | `min-height: 40px`; Schrift 16 px, Gewicht 400, Zeilenhöhe 1,3; `padding: 8px 16px`, `gap: 8px`, Radius 2 px, Icon 20 px. Authsubmit über volle Breite. |
| `navigation` | `min-height: 36px`; Schrift 14 px, Gewicht 400, Zeilenhöhe 1,35; `padding: 8px 12px`, `gap: 6px`, Radius 5 px, Icon 16 px. |
| `TingIconButton` | Varianten `quiet`, `send`; zugänglicher Name Pflicht. 30 × 30 px, bei grobem Zeiger 36 × 36 px. Quiet dauerhaft rahmenlos, Radius 5 px, Padding 6 px, Icon 18 px; Hover Sekundärfläche und dunkler Text. Send Radius 8 px, blau, Icon 17 px weiß; Hover dunkelblau. |
| `TingField` / `TingInput` | Label sichtbar oberhalb, Schrift 14 px, Gewicht 700, Zeilenhöhe 1,45, Abstand 6 px. Input `min-height: 40px`, `padding: 8px 12px`, Schrift 14 px bei 20 px Zeilenhöhe; unter 800 px Schrift 16 px. Standardrahmen 1 px, Radius 2 px, weiß. Fehlerrahmen rot. Keine Floating-Labels. |
| Passwortfeld | Native `SecretInput`-Funktion mit demselben Inputstil. Passwortsichtbarkeit bleibt funktional; Augenicon 18 px im dauerhaft rahmenlosen Button von 30 × 30 px, bei grobem Zeiger 36 × 36 px, rechts vertikal zentriert. Rechtes Textpadding 48 px hält den Text vom Icon frei. |
| `TingStatus` | Schrift 14 px, Zeilenhöhe 1,45; Padding 12 px, Gap 8 px, Radius 8 px, semantischer Rahmen 1 px. Icon 18 px; Titel mit Gewicht 700; Abstand zwischen Titel und Text 4 px. Fehler mit rotem Icon und Titel sowie Fehlerhintergrund. Status immer zusätzlich sprachlich benennen. |
| `TingEmptyState` | Gestrichelter Standardrahmen 1 px, Radius 5 px, transparenter Hintergrund, Padding 16 px, Gap 8 px. Titel 14 px mit Gewicht 700 und Zeilenhöhe 1,45; optionale Beschreibung 14 px mit Gewicht 400 in Nebentextfarbe; keine Mindesthöhe. Optionale Aktionszeile mit weiteren 4 px Abstand. |
| Navigationszeile | Reale URL/Conversation-ID, korrekte ausgewählte Route, einzeiliger Titel mit Ellipsis. Kein erfundener Vorgangsstatus. |

Gemeinsame Komponenten werden in Auth, Chat und Kontodialogen wiederverwendet. Keine gesonderten Stilsätze für Loginbutton und Registerbutton. Bestehende CSS-Klassen, die direkt gegenteilige Maße festlegen, werden an der betreffenden Komposition angepasst; keine Kaskade globaler `!important`-Reparaturen.

## 6. Ansichten und Interaktionen

### 6.1 Gesamtrahmen und Branding

Der Dokumenttitel enthält `TING`. Die sichtbare Wortmarke lautet `TING` in BundesSansWeb Bold. Native sichtbare LibreChat-Logos in den hier beschriebenen Oberflächen werden durch diese Wortmarke ersetzt. Wenn ein quadratisches Appzeichen gebraucht wird, ist es das vorhandene TING-Zeichen: weißes `T` auf Aktionsblau; kein neu erfundenes Logo. Quellcode- und Lizenzhinweise bleiben erhalten.

Jede dargestellte Seite besitzt einen eindeutigen Hauptinhalt und genau eine oberste Seitenüberschrift. Auth verwendet ein visuell ausgeblendetes `h1` „Anmelden“ bzw. „Konto erstellen“, damit die bestehende kompakte Wortmarkenansicht erhalten bleibt. Im leeren Chat ist die Begrüßung das sichtbare `h1`; der Kopftitel ist dann ein gewöhnlicher Textknoten. Im laufenden Chat ist der Kopftitel das `h1`. Nachrichtenüberschriften ordnen sich darunter ein.

### 6.2 Anmeldung und Registrierung

Beide Ansichten verwenden denselben Rahmen aus der vorhandenen TING-Anmeldevorlage und dieselben Formkomponenten. Die Registrierung ergänzt nur die nativen Registrierungsfelder. Es gibt keine Sidebar im Authrahmen.

| Element | Exakte Vorgabe |
|---|---|
| Seite | Weiß, Breite 100 %, mindestens sichtbare Viewporthöhe, normales vertikales Scrolling. Kein Kartenrahmen, Schatten, Trennbalken oder dekorativer Seitenbereich. |
| Inhaltsrahmen | `max-width: 400px`, `width: 100%`, `margin-inline: auto`, `padding: 64px 24px 32px`. Unter 800 px `padding: 48px 24px 32px`. Die 400 px umfassen das Padding; Desktop-Inhaltsbreite 352 px. |
| Wortmarke | Schrift 32 px, Gewicht 700, Zeilenhöhe 1,45, Zeichenabstand 1 px, zentriert. |
| Unterzeile | „Behördliche Anliegen verständlich klären“, Schrift 14 px, Gewicht 400, Zeilenhöhe 1,45, Nebentextfarbe, zentriert; Abstand nach Wortmarke 6 px, vor Formular 24 px. |
| Formular | Einspaltig, Gap 16 px; keine zusätzlichen Außenabstände der einzelnen Feldkomponenten. |
| Primäraktion | Formbutton über volle Breite, im Login „Anmelden“, im Register „Konto erstellen“; Pfeil nach rechts 20 px, Gap 8 px. |
| Wechsel zwischen Authansichten | 16 px unter dem Formular, zentriert, Schrift 14 px bei Zeilenhöhe 1,45. Login: „Noch kein Konto?“ plus Link „Konto erstellen“. Register: „Bereits ein Konto?“ plus Link „Anmelden“. |
| Feldfehler | 4 px nach dem betreffenden Feld, Schrift 14 px, Zeilenhöhe 1,45, Fehlerrot; `aria-invalid` und Verknüpfung zum Fehlertext. |
| Formularfehler/-erfolg | Gemeinsamer Status innerhalb des Inhaltsrahmens, 16 px Abstand zum folgenden Formblock. Der tatsächliche Status bestimmt den Text. |

**Loginfelder in Reihenfolge:** „E-Mail-Adresse“ (`email`) und „Passwort“ (`password`). Keine „Behördenkennung“, keine vorbefüllte Identität. Native Loginprüfung und `current-password`-Autocomplete erhalten. Passwortsichtbarkeit und Enter-Submit funktionieren.

**Registrierungsfelder in Reihenfolge:** „Vollständiger Name“ (`name`), „Benutzername (optional)“ (`username`), „E-Mail-Adresse“ (`email`), „Passwort“ (`password`), „Passwort bestätigen“ (`confirm_password`). Die vorhandenen nativen Pflicht-, Längen- und Gleichheitsprüfungen bleiben erhalten; keine zweite Passwortpolicy. Name/Username/E-Mail verwenden ihre passenden Autocompletewerte, beide neuen Passwortfelder `new-password`.

Während eines echten Login-/Registrierungsrequests verwendet der primäre Button den nativen Ladezustand und verhindert doppelte Auslösung; sein sichtbarer Ladeindikator entspricht der TING-Komponentenreferenz; seine Breite und Höhe bleiben gleich. Die native Registrierung erzeugt keine angemeldete Sitzung. Nach dem erfolgreichen nativen Registrierungsresponse führt die UI unmittelbar von `/register` zu `/login` und zeigt dort den neutralen Status „Sie können sich jetzt anmelden.“ Die native Antwort unterscheidet bewusst nicht zwischen einer Neuanlage und einer bereits registrierten E-Mail-Adresse. Deshalb behauptet die UI keine sicher erfolgte Neuanlage und fordert keinen sichtbaren Duplikatfehler. Kein Countdown und keine zusätzliche Wartezeit. Erst der erfolgreiche native Login erzeugt die Sitzung und führt zu `/c/new`. Fehler werden im selben TING-Rahmen erklärt, ohne Bildschirmwechsel auf eine ungestaltete Standardseite. Sessionablauf meldet „Sitzung abgelaufen“ und „Bitte melden Sie sich erneut an.“

Zusätzliche native Authzustände, sofern durch die reale Konfiguration erreichbar, verwenden denselben Rahmen. Ein Passwort-vergessen-Link wird nur bei tatsächlich konfiguriertem nativen Resetpfad gezeigt. Der lokale Standardstart verlangt keine Mailzustellung, Behördenkennung oder administrative Benutzeranlage, um Registrierung und Anmeldung nutzen zu können.

### 6.3 Chatrahmen, Sidebar und Kopf

| Eigenschaft | Exakte Vorgabe |
|---|---|
| Chatapp | Höhe 100dvh, Breite 100 %, Trackbreiten mindestens 0; keine horizontale Seitenscrollbar. |
| Desktop ab 1151 px | Sidebar 214 px plus Chat `minmax(0, 1fr)`. |
| Desktop 800–1150 px | Sidebar 195 px, gleiche Struktur. |
| Mobil bis 799 px | Eine Chatspalte, Sidebar zunächst geschlossen. Genau eine mobile Kopfzeile. |
| Mobile Sidebar | Breite 280 px, maximal Viewportbreite, links, sichtbare volle Höhe; Schatten `12px 0 50px #11131422`; Scrim `#11131466`. Native modale Drawersemantik, kein Resizer. |
| Sidebarfläche | Sekundärfläche, rechts Standardrahmen 1 px. Zwischen ihren Inhaltsblöcken keine zusätzlichen Trennlinien. |
| Sidebarwortmarke | Schrift 25 px, Gewicht 700, Zeilenhöhe 1,45, Zeichenabstand 0,8 px; `padding: 24px 16px 16px`. Klick nutzt „Neuer Vorgang“. |
| Aktionsblock | Spalte, Gap 8 px; `padding: 0 12px 12px`. |
| „Neuer Vorgang“ | Gemeinsamer navigation-Primarybutton, volle Breite, Plusicon 16 px. |
| Suche | Höhe 36 px, Standardrahmen 1 px, Radius 5 px; `padding: 6px 12px`, `padding-left: 40px`; Schrift 13 px auf Desktop und 16 px auf Mobilgeräten. Search-Icon 16 px, links 12 px, vertikal zentriert. Placeholder „Vorgänge durchsuchen“. |
| Historie | `flex: 1`, `min-height: 0`, eigenständig vertikal scrollbar; `padding: 0 8px 16px`. Wortmarke, Aktionen und Konto stehen außerhalb des scrollenden Bereichs. |
| Historienüberschrift | „Vorgänge“, Schrift 12 px, Gewicht 400, Zeilenhöhe 1,4, Nebentextfarbe; `padding: 12px 12px 6px`. |
| Zeile | `min-height: 40px`, `padding: 8px`, `margin: 2px 0`, `border-radius: 0 5px 5px 0`; links transparenter Rahmen von 3 px reserviert. Titel 14 px, Gewicht 400, Zeilenhöhe 1,3, einzeilig mit Ellipsis. |
| Inaktiver Hover | Weiße Fläche, linker Rand grau `#9ba1a5`, Titel normal dunkel. |
| Aktive Zeile, einschließlich Hover | Weiße Fläche, linker Rand Aktionsblau, Titel blau mit Gewicht 700. Geometrie bleibt gleich. |
| Kontozeile | Gap 8 px, `padding: 16px 12px`; Avatar 36 px, echter Name 14 px mit Gewicht 700 und einzeilig gekürzt, darunter „Konto“ 12 px in Nebentextfarbe, Settings-Icon 18 px rechts. Hover `#ffffff80`, dauerhaft ohne eigenen Rahmen. |
| Kopf Desktop | Höhe 72 px, `padding: 12px 24px`, Gap 12 px, weiß, kein Verlauf oder Trennbalken. |
| Kopf Mobil | Höhe 64 px, `padding: 8px 12px 8px 8px`, Gap 6 px; links Menübutton, danach derselbe Titelblock. |
| Kopftitel | Schrift 16 px auf Desktop und 15 px auf Mobilgeräten, Gewicht 700, Zeilenhöhe 1,3, Zeichenabstand −0,35 px, einzeilig gekürzt. Neuer Chat „Neuer Vorgang“, sonst echter Gesprächstitel. |
| Kopfuntertitel | „Ihr Gespräch mit TING“, Schrift 13 px auf Desktop und 12 px auf Mobilgeräten, Zeilenhöhe 1,4, Nebentextfarbe; Abstand zum Titel 2 px. |

Die Sidebar zeigt echte nicht archivierte Conversations: zuerst angepinnte, danach die übrigen, innerhalb beider Gruppen nach zuletzt aktualisiert absteigend. Ein angepinnter Chat bleibt genau einmal enthalten und trägt das vorhandene kleine Pin-Icon; zusätzliche Bereichsüberschriften oder Statuszeilen entstehen nicht. Die native Datumsgruppierung, die angepinnte Chats für einen separaten Bereich entfernt, wird deshalb nicht unverändert vor eine ungegliederte Liste geschaltet. Die vorhandenen Verlaufsaktionen Umbenennen, Anpinnen/Lösen, Archivieren/Wiederherstellen und Löschen bleiben im nativen Menü erreichbar. Archivieren hat mit „Archivierte Vorgänge“ im Kontomenü einen vollständigen Rückweg. Native Bestätigungen bei destruktiven Aktionen bleiben erhalten; die genannten Aktionen benötigen keinen Modellzugang. Native Paginierung und Nutzerfilter bleiben erhalten. Keine simulierten Beispielgespräche, Statusunterzeilen oder Aufmerksamkeitssymbole ohne entsprechende implementierte Fachfunktion.

Der native virtuelle Listenslot berücksichtigt **40 px Mindesthöhe plus zweimal 2 px Abstand**, also mindestens 44 px. Gemessene Zeilenbox und Scrollberechnung stimmen überein; es bleiben keine alten 34-px-Schätzungen oder unsichtbaren Gruppierungsplätze zurück.

„Neuer Vorgang“ nutzt den nativen New-Chatpfad; auf `/c/new` ist kein gespeicherter Chat ausgewählt. Ein Klick auf einen Historieneintrag öffnet dessen tatsächliche Conversation-ID. Die Suche verwendet den vorhandenen echten Suchindex und dessen Nutzerfilter. Während Laden werden keine falschen Leerzustände gezeigt. Nach erfolgreichem Leerresultat: „Noch keine Vorgänge“ beziehungsweise „Keine Vorgänge gefunden“ als gemeinsamer EmptyState, ohne zweite Erstellaktion.

Kontoavatar und Name stammen aus dem aktuellen Konto. Initialen: erstes Zeichen des ersten und letzten nicht leeren Namensteils, bei nur einem Teil ein Zeichen. Fehlt der Name, vorhandenes Personenicon. Der Burger öffnet ausschließlich die mobile Navigation; dort werden keine Modell-/API-Einstellungen nachträglich eingebaut.

### 6.4 Neuer Chat

Die freie Fläche unter dem Kopf enthält die zentrierte Gruppe aus Begrüßung und Composer. Sie hat unten 48 px Padding auf Desktop und 32 px auf Mobilgeräten. Die Gruppe wird mit sicherer Flexzentrierung innerhalb der verbleibenden Fläche angeordnet, besitzt ihre natürliche Mindesthöhe und darf bei wenig Platz nach oben ausweichen. Die Fläche scrollt bei Bedarf. Keine absolute Positionierung nach einem Bildschirmprozentsatz.

| Element | Exakte Vorgabe |
|---|---|
| Begrüßungsblock | `max-width: 450px` einschließlich `padding: 0 16px`, zentriert; Abstand zum Composer-Dock 24 px. |
| Überschrift | „Was möchten Sie klären?“, Schrift 26 px auf Desktop und 24 px auf Mobilgeräten, Gewicht 700, Zeilenhöhe 1,2, Zeichenabstand −0,3 px. |
| Beschreibung | „Ich begleite Ihr Anliegen, kläre die nächsten Schritte und behalte offene Punkte für Sie im Blick.“, Schrift 15 px, Gewicht 400, Zeilenhöhe 1,5, Nebentextfarbe, zentriert; Abstand zur Überschrift 12 px. |
| Leerer Composer-Dock | `width: 100%`, `max-width: 740px` **einschließlich** Padding. Desktop `padding: 0 32px 16px`; Mobil `padding: 0 12px 12px`. |
| Effektive maximale Composerbreite Desktop | **676 px einschließlich Rahmen**, weil 740 px Dockbreite zweimal 32 px Seitenpadding enthält. |
| Mobil | Composerbreite gleich verfügbare Breite minus 24 px. |

Die Begrüßung ist kein Sammlungsleerzustand und erhält keinen gestrichelten Rahmen. Es gibt keinen Einstieg über ein separates Anliegenformular, keinen Weiter-zum-Gespräch-Button und keinen zusätzlichen Wizard.

### 6.5 Composer

| Element | Exakte Vorgabe |
|---|---|
| Fläche | Weiß, Composerrahmen 1 px, Radius 16 px, Schatten `0 2px 5px #11131405`. |
| Fokus innerhalb | Blauer Rahmen, Schatten `0 0 0 2px #0071ad12`. |
| Textarea | `width: 100%`, `min-height: 49px`; `padding: 12px 16px 8px`; ohne eigenen Rahmen oder Resize-Griff, Schrift 15 px auf Desktop und 16 px auf Mobilgeräten, jeweils Zeilenhöhe 1,45. |
| Maximale Textareahöhe | 40dvh über die vorhandene Auto-Resizefunktion; anschließend internes Scrollen. |
| Placeholder | Neuer Chat „Worum geht es?“, laufender Chat „Nachricht an TING“, Farbe `#777d80`. |
| Aktionen | Rechtsbündige Reihe, Gap 12 px, `padding: 0 8px 8px`. Ohne leere Büroklammerspalte. |
| Senden | Gemeinsamer send-Iconbutton, 30 × 30 px beziehungsweise 36 × 36 px bei grobem Zeiger; Pfeil nach oben 17 px. Zugänglicher Name „An TING senden“. |
| Generierung | Vorhandene Stopaktion im gleichen Platz mit gleichen Maßen; zugänglicher Name „Antwort stoppen“. |

Eine bestehende native `ChatForm`-Instanz besitzt Eingabe, Fokus, Draft, Submit, Stream und Stop. Beim ersten echten Nachrichtenaustausch wird sie durch das Layout nach unten versetzt, ohne sie wegen eines rein visuellen Zustandswechsels zu ersetzen. Native Enter-/Shift+Enter-Regeln, IME-Kompositionsschutz und Mehrfachsubmit-Schutz bleiben erhalten. Leerer beziehungsweise ausschließlich aus Leerraum bestehender Inhalt lässt sich nicht senden. Während eines laufenden Requests gelten die nativen Submit-Sperren; die Stopaktion bleibt erreichbar. Ein fehlender API-Key allein löst keine Submit-Sperre aus.

Der Composer bleibt **ohne API-Key editierbar**. Wenn eine tatsächliche Sendeanforderung mangels Modellkonfiguration oder wegen eines Providerfehlers keine Antwort liefern kann, zeigt der vorhandene Fehlerpfad direkt beim Composer den gemeinsamen kompakten Fehlerstatus mit: **„TING kann gerade nicht antworten. Bitte versuchen Sie es später erneut.“** Der Text wird erst nach dem Sendeversuch angezeigt; kein dauerhaftes Banner, kein Hinweis auf API-Keys oder Entwicklersetup in der Bürgeroberfläche. Der eingegebene Text bleibt zur erneuten Verwendung verfügbar. Es wird keine künstliche Agentenantwort und kein erfolgreicher Versandstatus erzeugt. Technische Ursache und Klassifizierung bleiben im echten Backendfehler beziehungsweise in dessen Logs.

### 6.6 Laufendes und wieder geöffnetes Gespräch

Unter dem festen Kopf scrollt der native Nachrichtenbereich; Composer und Sidebar-Konto bleiben bedienbar. Die vorhandene native Scrollmechanik verfolgt laufende Ausgabe, solange der Nutzer am Ende liest, und respektiert sein Hochscrollen. Native Rückkehr-zum-Ende-Aktion verwenden, keine parallele Scrollsteuerung.

| Element | Exakte Vorgabe |
|---|---|
| Nachrichtenspalte | `width: 100%`, `max-width: 760px`; ab 1440 px Viewportbreite `max-width: 800px`. Horizontal zentriert. |
| Scrollbereich | `padding: 24px 32px` auf Desktop; `padding: 16px` auf Mobilgeräten. |
| Nachrichtenabstand | 24 px zwischen Nachrichten. |
| Nutzerbubble | Rechtsbündig, `max-width: 85%`; Mobil `max-width: 96%`; Sekundärfläche, `padding: 8px 12px`, `border-radius: 12px 12px 4px 12px`. |
| Agentenbubble | Linksbündig, `max-width: 92%`; Mobil `96%`, unter 480 px `100%`; Highlightfläche, Agentenrahmen 1 px, `padding: 8px 12px`, `border-radius: 4px 12px 12px 12px`. |
| Bubbletext | Schrift 15 px, Zeilenhöhe 1,45; normale Absatzabstände 6 px. Keine großen vertikalen Lücken zwischen einfachen Absätzen. |
| Agentenabsender | „TING“, Schrift 13 px, Gewicht 700, Zeilenhöhe 1,35; davor vorhandenes quadratisches T-Zeichen 20 px, Radius 5 px; Gap 6 px. Zeile mindestens 22 px hoch, Abstand zur Bubble 4 px. Keine zusätzliche „Privat“- oder Behördenrolle. |
| Laufender Composer-Dock | Über gesamte Chatfläche mit `padding: 0 32px 16px`, mobil `padding: 0 12px 12px`. Innen Composer in derselben 760-/800-px-Spalte wie Nachrichten. **Die 676-px-Grenze betrifft ausschließlich den leeren Chat.** |

Die vorhandenen Nachrichtenaktionen zum Kopieren, Bearbeiten, erneuten Generieren und Wechseln zwischen Antwortvarianten bleiben mit ihrem nativen Verhalten erhalten. Sie verwenden kompakte TING-Iconbuttons und ihre zugänglichen Namen. Aktionen, die eine neue Modellantwort auslösen, behandeln fehlenden Modellzugang genauso wie das Absenden. Keine zusätzliche Werkzeugleiste oder nachgebaute Nachrichtenlogik.

Native Markdown- und Sicherheitsbehandlung bleiben bestehen; lange URLs/Text umbrechen, Code und breite Tabellen bekommen bei Bedarf eigenen horizontalen Überlauf. Die normale Browserseite scrollt horizontal nicht. Native erfolgreiche Nachrichten werden gespeichert und beim Wiederöffnen aus echten Daten dargestellt; kein Ersatzverlauf für Designzwecke.

Unter dem Composer steht wie im Entwurf das Schloss-Icon mit „Privat mit TING“: Schrift 12 px, Zeilenhöhe 1,35, Nebentextfarbe, Icon 12 px, Gap 4 px, Padding oben 8 px und seitlich 12 px. Der Hinweis beschreibt den privaten Chat dieses Inkrements; er behauptet keine Ende-zu-Ende-Verschlüsselung. Kein zusätzlicher LibreChat-Versionsfooter. Tatsächlich konfigurierte Betreiberlinks bleiben sichtbar und verwenden denselben TING-Stil. Im mitgelieferten lokalen Standardprofil sind solche Betreiberinhalte nicht vorbefüllt.

### 6.7 Konto, Dialoge und mobile Bedienung

„Konto“ öffnet das vorhandene native Kontomenü mit eigener E-Mail-Adresse, „Einstellungen“, „Archivierte Vorgänge“ und „Abmelden“. Die native Hilfe enthält die vorhandenen Tastenkürzel und gegebenenfalls tatsächlich konfigurierte Betreiberlinks. Diese Flächen tragen BundesSansWeb, TING-Farben und dieselben Buttons, Inputs und Statuskomponenten. Die nativen Daten- und Aktionspfade bleiben erhalten. Es wird keine zusätzliche Vertretungs-, Behörden- oder Modelleinstellungsansicht gebaut.

„Einstellungen“ navigiert auf die authentifizierte Route `/settings`. Diese ist eine eigenständige Kontoansicht innerhalb der App-Shell, ohne äußeren Dialog, Backdrop, Schließen-Button, Suchfeld oder zusätzliche Einstellungsnavigation. Browser-Zurück, Browser-Vorwärts und Neuladen funktionieren. Die Desktop-Sidebar bleibt sichtbar; mobil ist der vorhandene Drawer über denselben Menübutton erreichbar. Der Seiteninhalt folgt `account.css` des Entwurfs: maximal 824 px einschließlich 32 px Padding, zentriert, Abschnitte mit 32 px Abstand; mobil 24 px vertikales und 16 px horizontales Padding. Überschrift „Konto“: 20 px, Gewicht 700, Zeilenhöhe 1,3. Kontoname, E-Mail und Avatar stammen aus dem angemeldeten Konto. Abschnittstitel: 16 px, Gewicht 700, Zeilenhöhe 1,3; Gruppen und Zeilen haben 16 px Abstand. Die Zeilen ordnen Bezeichnung links und Control rechts an und bleiben bei 320 px ohne horizontalen Überlauf. Die Seite verwendet die vorhandene native Registry und ihre Komponenten. Für I01 umfasst sie die Kontofunktionen `avatar`, `twoFactor`, `backupCodes` und `deleteAccount`, jeweils mit ihren vorhandenen Sichtbarkeits- und Berechtigungsbedingungen, sowie die Chatpräferenzen `enterToSend`, `saveDrafts`, `autoScroll` und `showScrollButton`. Die vorhandenen Profil-, Sicherheits- und Chatgruppen bleiben erhalten; leere Gruppen werden nicht gezeigt. Die native Einstellungs-API und Zustandslogik werden verwendet. Das sichtbare Markup verwendet diese Kontoseite. Ein natives Einstellungsmodal ist als Ersatz ausdrücklich ausgeschlossen. Ein Avatar ist ein Kontobild; die ausgeschlossene Dokumentverarbeitung des Vorgangs betrifft diese vorhandene Profilfunktion nicht. Native Folgeansichten, etwa zur Zwei-Faktor-Anmeldung, müssen ebenfalls exakt im freigegebenen TING-Auth-/Dialograhmen erscheinen. Eine dort noch nicht festgelegte Komposition wird nach Abschnitt 1.5 geklärt.

Andere native Einstellungen werden in diesem Textchat-Inkrement nicht angeboten: insbesondere keine Anbieterschlüssel, Modellparameter, Abrechnung, Integrationen, Sprach-/Dateiverarbeitung oder Auswahl ungestalteter Themes und alternativer Layouts. Die zugrunde liegenden LibreChat-Module werden dafür nicht gelöscht. Der Standard folgt dieser Spec; eine ausdrücklich gewählte Chatpräferenz darf das entsprechende Bedienverhalten ändern.

Kleine Dropdownmenüs: weiß, Standardrahmen 1 px, Radius 5 px, Innenpadding 4 px; Einträge mit Schrift 14 px, Zeilenhöhe 1,4, `padding: 8px 12px` und `min-height: 36px`. Es bleibt ein echter nativer Menüfokus mit Pfeiltasten und Escape erhalten. Kontodialoge verwenden für ihre sichtbare Gestaltung die vorhandenen TING-Klassen `.dialog`, `.dialog__head`, `.dialog__body` und `.dialog__foot` aus `components.css`. Der Standarddialog hat dort `width: min(620px, calc(100vw - 32px))`, `max-height: calc(100dvh - 48px)`, einen Rahmen von 1 px, Radius 4 px, Padding 0 und den festgelegten Schatten `0 16px 70px #11131426`; das Backdrop ist `#11131466`. Kopf und Fuß verwenden 16 px vertikales und 24 px horizontales Padding, der Body 24 px; bis 799 px verwenden diese Bereiche jeweils 16 px Padding. Die nativen Primitives erhalten Fokusmanagement und Scrollbedienung. Native LibreChat-Aufteilung, Standardbreiten oder Standardabstände dürfen die TING-Vorgaben nicht ersetzen. Dialoginhalte müssen nach der festgelegten Referenzkomposition angeordnet werden; eine fehlende Komposition wird nach Abschnitt 1.5 geklärt. Ihre Controls verwenden die gemeinsamen TING-Komponenten. Titel: 16 px, Gewicht 700, Zeilenhöhe 1,3; Text: 14 px bei Zeilenhöhe 1,45. Inhaltsgruppen haben 16 px beziehungsweise 24 px Abstand nach den gemeinsamen Regeln. Es werden keine dekorativen Trennlinien oder frei erfundenen festen Dialogbreiten hinzugefügt.

Der mobile Drawer verwendet vorhandene modale Primitives: Fokus hinein, Hintergrund inert, Escape/Scrim schließen, Scrollsperre nur während geöffnet. Nach Schließen Fokus zurück zum Auslöser; nach Gesprächsauswahl zum gewählten Inhalt. Schließen-, Menü- und Kontosteuerung bleiben bei 320 px Breite und 200 % Zoom erreichbar. Geöffnete Bildschirmtastatur darf Formular-/Composeraktionen nicht außerhalb des erreichbaren Scrollbereichs festhalten.

Abmelden beendet die echte Session, bereinigt den nutzerbezogenen Clientcache und führt zur **TING-Anmeldung**. Browser-Zurück darf keine weiterhin nutzbare frühere Session oder fremde Historie zeigen.

### 6.8 Produkttexte

Alle Texte werden über LibreChats vorhandene Lokalisierung geführt; Deutsch ist die ausgelieferte Standardsprache. Die im Abschnitt benannten Formulierungen sind die Solltexte. Keine Texte über Mockdaten, Prototypgrenzen, Programmieranweisungen, DAML-Durchsetzungsaufträge oder Einrichtung von API-Zugang in der Bürgeroberfläche. Technische Setuphinweise gehören in die Entwicklungsdokumentation. Echte Lade-, Leer-, Fehler- und Erfolgszustände werden anhand realer Appzustände dargestellt und bleiben im TING-Design.

## 7. Implementierungsreihenfolge

1. **Projekt einrichten:** Lokales Git-Repository anlegen, Quellen prüfen, Setup und lokalen Stack lauffähig machen. Dabei ausdrücklich ohne Provider-Key und ohne Modell-ID starten.
2. **Durchgehendes TING-Design:** Tokenquelle und gemeinsame CSS-/React-Komponenten integrieren. Zuerst `/login` und `/register` gestalten und echte Registrierung/Anmeldung prüfen. Danach Sidebar, leeren Chat und Composer umsetzen.
3. **Native Chatpfade integrieren:** Unkonfigurierten Sendeversuch sauber behandeln, Verlauf und Suche erhalten. Mit vorhandenen Betreiber-Eingaben echte Anfrage, Antwort, Stop und Wiederöffnen prüfen; fehlende Eingaben halten die übrigen Arbeiten nicht auf.
4. **Gesamte sichtbare Strecke prüfen:** Registrierung, Loginfehler, Sitzungsablauf, neuer Chat, Kontomenü, Logout, mobile Navigation und konkrete Chatfehler in TING-Gestaltung. Alle im gelieferten Umfang sichtbaren Controls müssen eine erkennbare Funktion haben.
5. **Übergabe:** Getesteten Code committen, lokale Startadresse, Startbefehle und tatsächliche Prüfergebnisse dokumentieren; vollständige Referenzassets mitgeben.

## 8. Nachweis am wirklichen System

### 8.1 Prüfmethode

Browserprüfungen laufen gegen die gebaute TING-App mit tatsächlichem Backend, MongoDB und Meilisearch. Konten und Gespräche entstehen über die nativen APIs beziehungsweise UI-Abläufe. Der modellfähige Durchlauf nutzt einen echten Anbieterzugang.

Eine kleine `e2e/playwright.config.ting.ts` verwendet den vorhandenen laufenden Stack. Keine abgefangenen Antworten, vorgefertigten SSE-Ereignisse oder In-Memory-Ersatzdatenbanken als End-to-End-Nachweis. Die Upstream-Konfiguration `playwright.config.local.ts` startet einen anders konfigurierten Testbackend; sie wird deshalb nicht unverändert für diese Abnahme übernommen. Schmale Unit-Tests prüfen isolierte Transformationen und Komponenten, ersetzen aber keine echten Abläufe.

### 8.2 Basisprüfung ohne Modellzugang

Alle folgenden Fälle werden tatsächlich durchgeführt. Dafür sind keine Betreiber-API-Eingaben notwendig.

| ID | Durchführung | Erwartetes Ergebnis |
|---|---|---|
| B01 | Frisches Setup ohne Key und Modell-ID, Build und lokaler Start. | App erreichbar, lokale Dienste funktionieren, TING ab dem ersten sichtbaren Auth-Screen. |
| B02 | Über `/register` zwei verschiedene Konten anlegen; auch ungültige Felder und erneute Anfrage mit bestehender E-Mail prüfen. | Echte persistierte Konten und native Feldvalidierung; neutrale native Antwort bei bereits bekannter E-Mail; passende TING-Formulare und Weiterleitung zur Anmeldung. |
| B03 | Gültig und ungültig anmelden; anschließend abmelden, Browser neu laden. | Echte Session; verständlicher Loginfehler; geschützte Historie nach Logout nicht zugänglich. |
| B04 | `/c/new` ohne Modellzugang öffnen, Text eingeben und senden. | Vollständige TING-Oberfläche; Eingabe bleibt verfügbar und erhalten, klarer Anfragefehler, keine fingierte Antwort. |
| B05 | Zwischen den zwei tatsächlich registrierten Konten wechseln und jeweils neu laden. | Richtige native Kontoidentität; keine Profildaten oder Sitzung des vorherigen Kontos im Clientcache. |
| B06 | Datenbank und App mit vorhandenen Volumes neu starten. | Angelegte Benutzer bleiben erhalten und können sich wieder anmelden. |
| B07 | Leere Historie und Suche nach einem nicht vorhandenen Gespräch öffnen. | Definierte Empty States, keine vorgefüllten oder erfundenen Gespräche. |
| B08 | Bei 1440×900, 1024×768 und 390×844 Login, Registrierung und neuen Chat betrachten. | Direkter Bildvergleich mit der freigegebenen TING-Referenz nach Abschnitt 8.4; keine optische Gestaltungsabweichung. |
| B09 | Mobile Sidebar öffnen, Tab/Escape/Scrim bedienen; Formularfehler und Kontomenü öffnen. | Fokus bleibt sinnvoll; korrekte Abstände, keine ungestalteten Popover/Dialoge oder überdeckten Aktionen. |
| B10 | Registrierung und Anmeldung über den Vite-Einstieg auf Port 3090. | HMR-Entwicklungsweg mit echter API, funktionsfähigen Sessioncookies und TING-Gestaltung. |
| B11 | Setup erneut ausführen, bestehende lokale Konfiguration vergleichen. | Secrets und Daten erhalten; optionale Provider-Eingaben werden nicht überschrieben oder angefordert. |
| B12 | Neue App-Komponenten, Laufzeitabhängigkeiten und ausgeliefertes Bundle prüfen. | Jede Ergänzung dient dem tatsächlichen Produktumfang. Eine Codebasis, keine Szenariosteuerung, Mock-Adapter, Ersatzdatenmodelle oder aus der HTML-Referenz übernommene Laufzeitsimulation. |

### 8.3 Zusätzliche Providerprüfung

Diese Fälle laufen, sobald gültige Betreiber-Eingaben vorliegen. Ohne sie werden sie ausdrücklich als **nicht ausgeführt: Modellzugang fehlt** dokumentiert. Dieser Status ist weder ein bestandenes Provider-E2E noch ein Startverbot für die App.

| ID | Durchführung | Erwartetes Ergebnis |
|---|---|---|
| P01 | Echten Key und tatsächliche Modell-ID ergänzen, Konfiguration aktualisieren und API neu erstellen; anschließend jeweils einen dieser Werte vorübergehend entfernen und erneut starten. | Vollständig konfiguriert nutzt die App das konkrete Modell ohne UI-Neubau; mit nur einem Wert bleiben Start und Login nutzbar und nur Modellanfragen unkonfiguriert. Konten bleiben erhalten. Für folgende Fälle beide Werte wiederherstellen. |
| P02 | Freie Nachricht senden und Antwort abwarten. | Tatsächlicher Providerrequest, echte sichtbare Antwort, native Conversation-ID, Speicherung. |
| P03 | Zwei Gespräche führen, neu laden und App/Mongo ohne Volumenlöschung neu starten. | Beide vollständigen Gespräche mit korrekten IDs und Nachrichten wieder erreichbar. |
| P04 | Eindeutigen Text in einer echten Nachricht senden und über die Verlaufssuche finden. | Suchergebnis stammt aus dem realen Index und führt zum richtigen Gespräch. |
| P05 | Mit zweitem Konto URL und Suchbegriff des ersten Kontos versuchen. | Keine fremden Nachrichten, Titel oder Suchergebnisse; kein Cache-Leck beim Kontowechsel. |
| P06 | Lange tatsächliche Antwort stoppen; während anderer Antwort hochscrollen. | Nativer Stop und Scroll-Lifecycle funktionieren. Die tatsächliche Ausführung wird belegt. |
| P07 | Tatsächlichen Netzwerkfehler auslösen; Verbindung wiederherstellen und erneut versuchen. | Sichtbarer Fehler, benutzbare App, nativer Retry ohne falschen Erfolg oder doppelte Gespräche. |
| P08 | Provider-Eingaben nach einem gespeicherten Gespräch entfernen und API neu starten. | Anmeldung und gespeicherter Verlauf bleiben verfügbar; nur neue Modellantworten sind nicht möglich. |

Mit einem tatsächlich vorhandenen Gespräch außerdem die erhaltenen Verlaufsaktionen prüfen: Umbenennen, Anpinnen/Lösen, Archivieren/Wiederherstellen und Löschen. Kein Gespräch darf durch eine fehlerhafte Gruppierung verschwinden; Archivierung und Löschung müssen ihren wirklichen Zustand anzeigen. Für die Referenz werden keine künstlichen Chatnachrichten in die Datenbank geschrieben.

### 8.4 Visuelle und technische Prüfung

**Verpflichtende visuelle Abnahme: Referenz und Implementierung müssen optisch übereinstimmen. Es gibt keine zugelassene Layout-, Maß- oder Farbtoleranz, auch nicht pauschal 1 CSS-Pixel.** Ein bestandener Build oder Funktionstest ersetzt diese Abnahme nicht.

Für jede enthaltene Ansicht und jeden erreichbaren sichtbaren Zustand wird festgehalten, welche aktuelle Referenzansicht beziehungsweise exakt definierte Referenzkomposition sie bestimmt. Dazu gehören auch Hover, Fokus, Auswahl, offene Menüs/Dialogs, Formularfehler sowie Lade- und Leerzustände. Fehlt ein eindeutiges Soll, gilt Abschnitt 1.5; ein eigener Implementierungsscreenshot darf nicht zur neuen Sollreferenz erklärt werden.

Der Coding-Agent rendert die maßgebliche HTML-/CSS-Referenz und die echte Implementierung im selben Browserbuild auf demselben Betriebssystem. Viewport, Zoom, Device-Pixel-Ratio, Sprache, Farbschema, Scrollposition, Fokus und Interaktionszustand sind identisch. Vor beiden Aufnahmen müssen die Originalfonts vollständig geladen und vorübergehende Animationen beendet sein. Als feste Viewports dienen 1440×900, 1024×768 und 390×844; zusätzlich werden die Breakpoints 799/800 und 1150/1151 geprüft.

Für vergleichbare Zustände werden Referenzbild, Implementierungsbild, Überlagerung und Differenzbild gespeichert und tatsächlich geprüft. Jede sichtbare Abweichung von Komponenten, Typografie, Geometrie, Farbe oder Zustandsdarstellung wird behoben. Es gibt keine pauschale prozentuale Bildabweichung, die abweichende UI-Elemente als bestanden durchwinkt. Browserrasterung und Antialiasing sind keine gestalterische Toleranz; verbleibende Rasterdifferenzen bei nachweislich identischen Designwerten müssen einzeln nachvollziehbar sein.

Gesprächsinhalte und Kontodaten entstehen weiterhin über die realen Appabläufe. Für den Vergleich sind dieselben sichtbaren Texte und Zustände zu verwenden, soweit sie über diese Abläufe gezielt herstellbar sind. Variable echte Modellantworten werden nicht durch fingierte Antworten ersetzt. Deren Textinhalt darf für einen Vergleich abgegrenzt werden; Bubbleform, Typografie, Abstände, Breite, Position und Umbruchregeln dürfen dabei nicht durch pauschale Masken aus der Prüfung verschwinden. Der Nachweis nennt den tatsächlich vergleichbaren Umfang. Reicht die Vergleichbarkeit für einen Screen nicht aus, bleibt dessen vollständiger Bildnachweis offen.

Zusätzlich werden Computed Styles und Elementgeometrien gegen die Referenz geprüft, insbesondere die Originalfonts, Schriftgewichte, Zeilenhöhen, Abstände, Rahmen, Radien und Farben. Die bereits getestete App wird auch direkt im Browser betrachtet. Ein Bericht darf nur die Ansichten und Zustände als visuell abgenommen nennen, die tatsächlich gegen ihre Referenz geprüft wurden.

Bei 320 px Breite, 200 % Zoom und langen Namen/Titeln darf es keinen horizontalen Seitenüberlauf oder unerreichbare Hauptaktion geben. Mobile Navigation, Fokus, Enter/Shift+Enter, Passwort-Autofill und IME-Verhalten prüfen. Eine echte Bildschirmtastatur prüfen, wenn ein entsprechendes Gerät verfügbar ist; andernfalls diese konkrete Geräteeigenschaft als nicht geprüft nennen. Das hindert weder Start noch Übergabe der tatsächlich geprüften App.

Der Produktionsbuild und die Typechecks der geänderten Workspaces müssen funktionieren. Vorhandene einschlägige Tests aus dem Repository ausführen und gezielt notwendige Tests für die geänderten Pfade ergänzen. Kein pauschaler Komplettumbau des Testsystems. Bei einem Fehler auf dem unveränderten Pin den Befund reproduzieren und vom eigenen Fehler unterscheiden.

Beispiel für die betroffenen Frontend-Workspaces:

```sh
npm run frontend
npm exec --workspace=client -- tsc --noEmit
npm exec --workspace=packages/client -- tsc --noEmit
```

Wurden weitere Workspaces verändert, deren entsprechende Typechecks ergänzen. Die gemeinsamen TING-Styles und Assets werden durch den bestehenden Build verarbeitet und funktionieren beim erstmaligen Entwicklungsstart ebenso wie im Docker-Build. Es gibt keinen manuell nachzuholenden Design-Buildschritt.

### 8.5 Übergabe und ehrlicher Status

Im Implementierungsrepository stehen:

- `docs/ting/ENTWICKLUNG.md`: geprüfte Befehle für Setup, Start, Hot Reload, Rebuild, Stop und spätere Modellkonfiguration, einschließlich der tatsächlichen lokalen URLs.
- `docs/ting/I01-ABNAHME.md`: getesteter Implementierungscommit, Repositorypfad/Branch, Versionen, Ergebnisse B01–B12 und P01–P08 sowie konkrete offene Fehler oder nicht ausgeführte Prüfungen.
- `docs/ting/I01-NACHWEISE/`: Referenzbilder, Implementierungsbilder, Überlagerungen/Differenzbilder und passende technische Prüfnachweise mit Zuordnung zu Ansicht, Zustand und Renderumgebung; ohne Passwörter, Sessiontokens oder API-Keys.
- Die gemeinsame Tokenquelle, benötigten CSS-/React-Komponenten und beide Originalfonts als regulärer Teil des gebauten Projekts.

Die Übergabe weist **visuelle Übereinstimmung geprüft**, **lokale Basis geprüft** und **Provider-End-to-End geprüft** getrennt und anhand der tatsächlichen Ergebnisse aus. Offene sichtbare Abweichungen bedeuten, dass die Designabnahme nicht bestanden ist; funktionale Erfolge kompensieren das nicht. Fehlt der Providerzugang, wird die nutzbare App mit diesem konkreten offenen Nachweis übergeben. Ein fehlender Nachweis wird weder als Erfolg ausgegeben noch in eine allgemeine Produktsperre übersetzt. Wenn der Code des Providerpfads noch nicht implementiert ist, wird das ausdrücklich als fehlende Implementierung bezeichnet.

## 9. Anschluss an das größere TING-Ziel

Die App entsteht für eine agentische Bürgerplattform. Der Chat ist der zentrale Einstieg, über den TING später Anliegen klärt, Beteiligte einbezieht und nötige Schritte veranlasst. I01 liefert dafür die funktionierende Gesprächsoberfläche.

DAML wird später die gemeinsamen Vorgänge, Beteiligungen, Handlungsrechte und Freigaben tragen. Fachliche Schlussfolgerungen und ihre nachvollziehbaren Grundlagen gehören in das Logikbackend. FactGraph ist eine Python-Bibliothek; eine spätere Anbindung als eigener Python-Service bleibt möglich. Diese Zuständigkeiten werden in I01 nicht durch Frontendbedingungen oder Promptregeln vorweggenommen.

Die Herkunft und Validierung des Behördenwissens sowie spätere Behördenansichten werden separat festgelegt. Sie sind keine verdeckten Zusatzaufgaben dieses Chatinkrements.

## 10. Geprüfte technische Quellen

- [LibreChat am festgeschriebenen Commit](https://github.com/danny-avila/LibreChat/tree/9e83b10545e70b2f3d69a19c0cbe5121aaa86e5e)
- [App-Root und ThemeProvider](https://github.com/danny-avila/LibreChat/blob/9e83b10545e70b2f3d69a19c0cbe5121aaa86e5e/client/src/App.jsx)
- [Native Entwicklungsbefehle](https://github.com/danny-avila/LibreChat/blob/9e83b10545e70b2f3d69a19c0cbe5121aaa86e5e/package.json)
- [Vite-Konfiguration, Proxy und Asset-Build](https://github.com/danny-avila/LibreChat/blob/9e83b10545e70b2f3d69a19c0cbe5121aaa86e5e/client/vite.config.ts)
- [Gemeinsames Theme-System](https://github.com/danny-avila/LibreChat/blob/9e83b10545e70b2f3d69a19c0cbe5121aaa86e5e/packages/client/src/theme/README.md)

Die Codebasis und Referenzdateien wurden beim Schreiben geprüft. Build, Registrierung und Provider-End-to-End der künftigen Implementierung muss der Coding-Agent am tatsächlichen Ergebnis durchführen; diese Spec behauptet keine bereits gebaute App.
