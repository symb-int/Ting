# Visuelle Nachweise zu TING Inkrement 01

Dieses Verzeichnis ordnet die vorhandenen Bild- und Messartefakte den Vorgaben aus
`docs/ting/TING-I01-SPEC.md`, insbesondere Abschnitt 1.5 und 8.4, zu. Es ist ein
Nachweiskatalog, keine Freigabe: Die vorhandenen Dateien begründen keinen vollständigen visuellen
`PASS`. Ein Implementierungsscreenshot ist keine Sollreferenz. Maßgeblich bleiben die
festgeschriebene HTML-/CSS-Referenz und die ausdrücklich definierten Kompositionen der Spec.

## Bestand

Vor dieser README liegen 74 Artefakte vor:

- 13 gerenderte Referenzbilder als JPEG,
- 32 Implementierungsbilder als JPEG,
- 13 Überlagerungen als PNG,
- 13 Differenzbilder als PNG,
- drei JSON-Dateien mit Geometrie-, Style- und Pixelmetriken.

Davon bilden 13 Sätze jeweils Referenz, Implementierung, Überlagerung und Differenz. 19 weitere
Bilder zeigen ausschließlich Implementierungszustände. Für sie liegt in diesem Verzeichnis kein
direktes Referenzpaar vor.

## Renderumgebung und Provenienz

| Merkmal | Durch die vorhandenen Artefakte belegt |
|---|---|
| Host | macOS 26.4.1, Build 25E253, arm64. |
| Browserwerkzeug im Repository | Playwright 1.62.1 ist installiert. Die direkten Paare wurden innerhalb derselben persistenten In-App-Chromium-Sitzung aufgenommen; ein maschinenlesbares Capture-Manifest fehlt weiterhin. |
| Browserbuild | Für die visuellen Aufnahmen nicht protokolliert. Die gemeinsame Sitzung begrenzt Unterschiede zwischen Referenz und Implementierung, ersetzt aber keine festgehaltene Chromium-Buildnummer. Der separate Lighthouse-Lauf verwendete `HeadlessChrome/153.0.0.0`; daraus wird der Build der In-App-Aufnahmen nicht abgeleitet. |
| Viewports | Direkte Paare bei 1440×900, 1024×768 und 390×844; für den neuen Vorgang zusätzlich 799×844, 800×844, 1150×900 und 1151×900. Eine reine Implementierungsaufnahme ergänzt 320×844 in normaler Darstellung. Der Zoom-Nachweisversuch wurde vom Werkzeug auf 240×422 Pixel geklemmt und ist kein 200-Prozent-Zoomnachweis. |
| Device-Pixel-Ratio | `metrics-reference.json` und `metrics-implementation.json` protokollieren für die sieben Messungen des neuen Vorgangs jeweils DPR 2. Für Anmeldung und Gespräch fehlt ein entsprechendes DPR-Protokoll. |
| Sprache und Farbschema | Die Bilder zeigen deutsche Texte im hellen Schema. Browser-Locale, erzwungenes Farbschema und Medienemulation sind nicht separat protokolliert. |
| Zoom | Für die direkten Vergleichssätze nicht protokolliert. Das In-App-Browserwerkzeug stellte keinen nativen Seitenzoom bereit. Die entsprechend benannte Datei ist nur der dokumentierte Versuch mit verkleinertem Viewport und belegt keinen 200-Prozent-Browserzoom. |
| Schrift | Beide Metrikdateien melden für alle sieben Messungen `document.fonts.status = loaded`, `bundesSansLoaded = true` und die berechnete Familie `BundesSansWeb, Calibri, Verdana, Arial, sans-serif`. Einzelne Netzwerkanfragen und der tatsächlich je Glyphe verwendete Font wurden nicht mitgespeichert. |
| Fokus, Scrollposition und Animationen | Nur soweit im jeweiligen Bild sichtbar. Ein reproduzierbares Zustands- und Warteprotokoll fehlt. |
| Implementierungsstand | `eb467cf58c1332050f177fdcfc0598380c4edbf8`; nach späteren UI-Änderungen müssen betroffene Aufnahmen erneut erstellt werden. |
| Bildformat | Referenz- und Implementierungsaufnahmen sind verlustbehaftete JPEGs; Überlagerungen und Differenzen sind PNGs. JPEG-Artefakte können numerische Pixelwerte beeinflussen. |

Damit ist die in Abschnitt 8.4 verlangte identische und reproduzierbar dokumentierte
Renderumgebung noch nicht vollständig belegt.

## Direkte Vergleichssätze

Die Zuordnung der Ansichten lautet:

| Kürzel | Referenzroute | Implementierungsroute | Tatsächlich vergleichbarer Umfang |
|---|---|---|---|
| `new` | `/?embed=1#/neu/new` | `/c/new` | App-Rahmen, responsive Sidebar/Header-Geometrie, Begrüßung und Composer. Inhalte der Sidebar und mehrere Texte/Controls sind absichtlich nicht gleich; siehe Konflikte unten. |
| `login` | `/?embed=1#/anmeldung/pflege` | `/login` | Auth-Rahmen, Wortmarke und gemeinsame Formkomponenten. Feldtext, Vorbelegung und Wechsel zur Registrierung richten sich in der Implementierung nach der strengeren Spec. |
| `conversation` | `/?embed=1#/gespraech/pflege` | `/c/<conversationId>` | Chat-Rahmen, Nachrichtenspalte, Bubble-Grundformen und Composer. Gesprächsinhalt und Funktionsumfang sind nicht semantisch gleich und erlauben keinen vollständigen Pixelnachweis. |

In der folgenden Tabelle bedeuten `R` Referenz, `I` Implementierung, `O` Überlagerung und `D`
Differenzbild.

| Ansicht | Viewport | Dateien |
|---|---:|---|
| Neuer Vorgang | 1440×900 | [R](reference-new-1440x900.jpg) · [I](implementation-new-1440x900.jpg) · [O](overlay-new-1440x900.png) · [D](difference-new-1440x900.png) |
| Neuer Vorgang | 1024×768 | [R](reference-new-1024x768.jpg) · [I](implementation-new-1024x768.jpg) · [O](overlay-new-1024x768.png) · [D](difference-new-1024x768.png) |
| Neuer Vorgang | 390×844 | [R](reference-new-390x844.jpg) · [I](implementation-new-390x844.jpg) · [O](overlay-new-390x844.png) · [D](difference-new-390x844.png) |
| Neuer Vorgang, Breakpoint | 799×844 | [R](reference-new-799x844.jpg) · [I](implementation-new-799x844.jpg) · [O](overlay-new-799x844.png) · [D](difference-new-799x844.png) |
| Neuer Vorgang, Breakpoint | 800×844 | [R](reference-new-800x844.jpg) · [I](implementation-new-800x844.jpg) · [O](overlay-new-800x844.png) · [D](difference-new-800x844.png) |
| Neuer Vorgang, Breakpoint | 1150×900 | [R](reference-new-1150x900.jpg) · [I](implementation-new-1150x900.jpg) · [O](overlay-new-1150x900.png) · [D](difference-new-1150x900.png) |
| Neuer Vorgang, Breakpoint | 1151×900 | [R](reference-new-1151x900.jpg) · [I](implementation-new-1151x900.jpg) · [O](overlay-new-1151x900.png) · [D](difference-new-1151x900.png) |
| Anmeldung | 1440×900 | [R](reference-login-1440x900.jpg) · [I](implementation-login-1440x900.jpg) · [O](overlay-login-1440x900.png) · [D](difference-login-1440x900.png) |
| Anmeldung | 1024×768 | [R](reference-login-1024x768.jpg) · [I](implementation-login-1024x768.jpg) · [O](overlay-login-1024x768.png) · [D](difference-login-1024x768.png) |
| Anmeldung | 390×844 | [R](reference-login-390x844.jpg) · [I](implementation-login-390x844.jpg) · [O](overlay-login-390x844.png) · [D](difference-login-390x844.png) |
| Gespräch | 1440×900 | [R](reference-conversation-1440x900.jpg) · [I](implementation-conversation-1440x900.jpg) · [O](overlay-conversation-1440x900.png) · [D](difference-conversation-1440x900.png) |
| Gespräch | 1024×768 | [R](reference-conversation-1024x768.jpg) · [I](implementation-conversation-1024x768.jpg) · [O](overlay-conversation-1024x768.png) · [D](difference-conversation-1024x768.png) |
| Gespräch | 390×844 | [R](reference-conversation-390x844.jpg) · [I](implementation-conversation-390x844.jpg) · [O](overlay-conversation-390x844.png) · [D](difference-conversation-390x844.png) |

Die Existenz eines Vierersatzes bedeutet nicht, dass sein Zustand gemäß Abschnitt 8.4 vollständig
vergleichbar oder abgenommen ist. Das gilt besonders für `conversation`, dessen Referenz einen
späteren Mehrparteien- und Dokumentablauf zeigt.

## Nur in der Implementierung dokumentierte Zustände

Diese Bilder dokumentieren, dass der jeweilige Zustand sichtbar hergestellt wurde. Ohne gerenderte
Sollkomposition, Überlagerung, Differenzbild und passende Computed Styles sind sie kein Nachweis
visueller Übereinstimmung.

| Zustand | Viewport | Datei | Spec-Zuordnung und Grenze des Nachweises |
|---|---:|---|---|
| Registrierung, leeres Formular | 1440×900 | [implementation-register-1440x900.jpg](implementation-register-1440x900.jpg) | Abschnitt 6.2; keine eigenständige fertige HTML-Referenzansicht im Übergabepaket. |
| Registrierung, leeres Formular | 1024×768 | [implementation-register-1024x768.jpg](implementation-register-1024x768.jpg) | Abschnitt 6.2; nur Implementierungsansicht. |
| Registrierung, leeres Formular | 390×844 | [implementation-register-390x844.jpg](implementation-register-390x844.jpg) | Abschnitt 6.2; nur Implementierungsansicht. |
| Registrierung, Feldvalidierung und Fokus | 390×844 | [implementation-register-validation-390x844.jpg](implementation-register-validation-390x844.jpg) | Abschnitt 6.2; ein Fehlerzustand, aber kein direkter Sollvergleich. |
| Kontomenü geöffnet | 1440×900 | [implementation-account-menu-1440x900.jpg](implementation-account-menu-1440x900.jpg) | Abschnitt 6.7; keine gespeicherte Gegenaufnahme der Profil-/Komponentenreferenz. |
| Einstellungsdialog geöffnet | 1440×900 | [implementation-settings-1440x900.jpg](implementation-settings-1440x900.jpg) | Abschnitt 6.7; keine gespeicherte Gegenaufnahme oder Dialoggeometrie-Metrik. |
| Einstellungsdialog geöffnet | 390×844 | [implementation-settings-390x844.jpg](implementation-settings-390x844.jpg) | Abschnitt 6.7; mobile Navigationsstufe des Dialogs, ohne direkte Sollaufnahme. |
| Einstellungsdialog geöffnet, Breakpoint | 799×844 | [implementation-settings-799x844.jpg](implementation-settings-799x844.jpg) | Abschnitt 6.7; letzte mobile Breite, ohne direkte Sollaufnahme. |
| Einstellungsdialog geöffnet, Breakpoint | 800×844 | [implementation-settings-800x844.jpg](implementation-settings-800x844.jpg) | Abschnitt 6.7; erste Desktopbreite, ohne direkte Sollaufnahme. |
| Tastenkürzeldialog geöffnet | 1440×900 | [implementation-keyboard-shortcuts-1440x900.jpg](implementation-keyboard-shortcuts-1440x900.jpg) | Abschnitt 6.7; native Hilfe im TING-Dialogsystem, ohne direkte Sollaufnahme. |
| Archivierte Vorgänge, Leerzustand | 1440×900 | [implementation-archived-empty-1440x900.jpg](implementation-archived-empty-1440x900.jpg) | Abschnitte 6.3 und 6.7; Rückweg für archivierte Vorgänge, ohne direkte Sollaufnahme. |
| Mobiler Drawer geöffnet | 390×844 | [implementation-mobile-drawer-390x844.jpg](implementation-mobile-drawer-390x844.jpg) | Abschnitte 6.3 und 6.7; das Bild belegt weder Fokusfalle, `inert`, Escape noch Fokus-Rückgabe. |
| Suche ohne Treffer | 1440×900 | [implementation-search-empty-1440x900.jpg](implementation-search-empty-1440x900.jpg) | Abschnitt 6.3 und B07; statische Sicht, kein Beleg des realen Suchindex oder der Lade-/Erfolgsabfolge. |
| Gesprächsaktionsmenü geöffnet | 1440×900 | [implementation-conversation-actions-1440x900.jpg](implementation-conversation-actions-1440x900.jpg) | Abschnitte 6.3 und 6.6; statische Sicht, kein Funktionsnachweis der Aktionen. |
| Neuer Vorgang, schmale Breite | 320×844 | [implementation-new-320x844.jpg](implementation-new-320x844.jpg) | Abschnitt 8.4; Sidebarsteuerung, Hauptinhalt und Composer bleiben sichtbar, ohne direkten Sollvergleich bei dieser Breite. |
| Neuer Vorgang, Zoom-Nachweisversuch | 240×422 | [implementation-new-320x844-zoom-200.jpg](implementation-new-320x844-zoom-200.jpg) | Abschnitt 8.4; kein Abnahmenachweis für 200 Prozent Browserzoom. Das Werkzeug klemmte den ersatzweise angeforderten Viewport auf seine Mindestbreite und bot keinen nativen Seitenzoom. |
| Unkonfigurierter Modellfehler | 1440×900 | [implementation-model-not-configured-1440x900.jpg](implementation-model-not-configured-1440x900.jpg) | Abschnitte 4.2 und 6.6; definierter Fehler und erhaltener Entwurf, aber kein direkter Sollvergleich. |
| Unkonfigurierter Modellfehler | 390×844 | [implementation-model-not-configured-390x844.jpg](implementation-model-not-configured-390x844.jpg) | Abschnitte 4.2 und 6.6; mobile Fehlerdarstellung und erhaltener Entwurf, aber kein direkter Sollvergleich. |
| Gespräch löschen | 1440×900 | [implementation-conversation-delete-1440x900.jpg](implementation-conversation-delete-1440x900.jpg) | Abschnitte 6.3 und 6.7; gestalteter Bestätigungsdialog, ohne direkte Sollaufnahme. Die Löschfunktion selbst ist durch den Provider-E2E-Lauf belegt, nicht durch dieses Bild. |

## Technische Metriken

`metrics-reference.json` und `metrics-implementation.json` enthalten für den neuen Vorgang bei den
sieben dokumentierten Breiten eine Auswahl berechneter Styles und Elementgeometrien. Erfasst sind
unter anderem Body, Sidebar, Header, Begrüßung, Composer-Dock, Textarea und Sendeaktion. Für Login,
Gespräch und die implementierungsseitigen Sonderzustände liegt kein entsprechender
Computed-Style-Datensatz vor.

`visual-diff-metrics.json` enthält folgende Rohwerte:

| Ansicht | Viewport | Mittlere absolute Kanaldifferenz | Pixelanteil laut Feld `changedPixelRatioAt16` |
|---|---:|---:|---:|
| Neuer Vorgang | 1440×900 | 2.1616 | 0.018904 |
| Neuer Vorgang | 1024×768 | 3.5415 | 0.030843 |
| Neuer Vorgang | 390×844 | 6.4458 | 0.068690 |
| Neuer Vorgang | 799×844 | 3.3467 | 0.035858 |
| Neuer Vorgang | 800×844 | 4.0458 | 0.034914 |
| Neuer Vorgang | 1150×900 | 2.6808 | 0.023422 |
| Neuer Vorgang | 1151×900 | 2.7044 | 0.023629 |
| Anmeldung | 1440×900 | 0.7071 | 0.021150 |
| Anmeldung | 1024×768 | 1.1652 | 0.034855 |
| Anmeldung | 390×844 | 2.8217 | 0.081143 |
| Gespräch | 1440×900 | 11.3083 | 0.291316 |
| Gespräch | 1024×768 | 15.2245 | 0.361607 |
| Gespräch | 390×844 | 27.0402 | 0.508291 |

Diese Werte sind ausschließlich Diagnosehilfen. Insbesondere ist `16` im JSON-Feldnamen kein von
der Spec zugelassener Toleranzwert. Abschnitt 8.4 definiert weder einen Prozent- noch einen
Pixel-Schwellwert, der einen Vergleich automatisch bestehen lässt. Die Metriken werden außerdem
durch absichtlich verschiedene Inhalte, nicht identische Zustände, Schrift- und
Antialiasingeffekte sowie die JPEG-Quellen beeinflusst. Sie helfen, Abweichungsbereiche zu finden,
ersetzen aber weder die Sichtprüfung noch die Prüfung einzelner Designwerte. Aus einem niedrigen
oder hohen Zahlenwert allein wird hier weder `PASS` noch `FAIL` abgeleitet.

`scripts/ting/generate-visual-evidence.mjs` erzeugt die 50/50-Überlagerungen, verstärkt die
Differenzbilder mit `difference` und `linear(3)` und berechnet sowohl die mittlere absolute
Kanaldifferenz als auch `changedPixelRatioAt16`. Damit sind die abgeleiteten Artefakte
reproduzierbar. Nicht skriptgebunden sind die ursprüngliche Browseraufnahme und ihr Zustand; die
Zahlen bleiben deshalb unterstützende Diagnose und kein automatisches Abnahmekriterium.

## Bekannte Inhaltskonflikte zwischen HTML-Referenz und Spec

Die Spec bestimmt Funktionsumfang, echte Daten und Produkttexte; die HTML-/CSS-Referenz bestimmt
die Gestaltung. Folgende Referenzinhalte gehören nicht unverändert in I01. Ihre Abweichung erklärt
Teile der Differenzbilder, entschuldigt aber keine Abweichung bei Layout, Typografie, Geometrie,
Farbe oder Zustandsdarstellung.

| Bereich | Inhalt der gerenderten HTML-Referenz | Strengere Vorgabe der Spec und Folge für den Vergleich |
|---|---|---|
| Anmeldung | „E-Mail oder Behördenkennung“, eine vorbefüllte Beispielidentität und kein sichtbarer Wechsel zur Registrierung. | Abschnitt 6.2 verlangt „E-Mail-Adresse“, keine Behördenkennung, keine Vorbefüllung sowie „Noch kein Konto? Konto erstellen“. Die Implementierungsbilder folgen diesen Text- und Ablaufvorgaben; ein pixelidentischer Gesamtvergleich des Formularinhalts ist daher nicht möglich. |
| Neuer Vorgang, Sidebar | Simulierte Beispielgespräche, Gruppen „Laufend“ und „Abgeschlossen“, Aufmerksamkeitssymbole sowie „Alex Beispiel“. | Abschnitt 6.3 verlangt echte eigene Conversations, keine simulierten Beispielgespräche, zusätzlichen Statuszeilen oder unbelegten Aufmerksamkeitssymbole und eine echte Kontoidentität. Die Implementierungsaufnahme zeigt stattdessen den leeren Zustand. Sidebar-Struktur und Maße bleiben vergleichbar, der Inhalt nicht. |
| Neuer Vorgang, Begrüßung und Composer | Abweichender Beschreibungstext, Büroklammer und „Privat mit TING“ unter dem Composer. | Abschnitte 6.4 bis 6.6 geben den Text „Beschreiben Sie Ihr Anliegen in eigenen Worten.“, eine Aktionsreihe ohne leere Büroklammerspalte und keinen generischen Privat-/Versionsfooter vor. Die Differenzen dieser Elemente sind beabsichtigt durch die Spec. |
| Gespräch | Mehrere beteiligte Stellen, geteilte Inhalte, ein PDF, Freigabe-/Weitergabeaktionen und ein Privat-Hinweis. | Abschnitte 1.2 und 6.6 begrenzen I01 auf echten Textchat zwischen Nutzer und TING; Mehrparteienfunktionen, Dokumentverarbeitung und Dateifreigaben kommen später. Die Implementierungsbilder zeigen einen einfachen angezeigten Provider-Testdialog. Für das Gesamtbild sind die Zustände nicht inhaltsgleich; nur die jeweils tatsächlich gemeinsamen Layoutkomponenten lassen sich direkt beurteilen. |
| Registrierung und Sicherheitsfolgeansichten | Keine vollständige eigenständige aktuelle Screenshotreferenz. | Laut Abschnitt 2.1 gelten der festgelegte Authrahmen und die exakt benannten TING-Komponenten. Nicht festgelegte zusätzliche Kompositionen bleiben offene Designreferenzen und dürfen nicht aus Implementierungsbildern zum neuen Soll erklärt werden. |

## Offene Nachweise

Für eine vollständige visuelle Abnahme nach Abschnitt 8.4 bleiben mindestens folgende Punkte offen:

- Visuellen Browserbuild, Zoom, Locale, Farbschema, Scrollposition, Fokuszustand und Animationsende
  reproduzierbar je Bildserie protokollieren. Der Lighthouse-Browserbuild ist separat bekannt und
  ersetzt diese Angabe nicht.
- Den geforderten 200-Prozent-Zoom in einem Browser mit steuerbarem nativem Seitenzoom ausführen;
  die benannte 240×422-Aufnahme ist ausdrücklich nur ein fehlgeschlagener Nachweisversuch.
- Die Bilder an einen finalen Implementierungscommit binden und nach späteren UI-Änderungen
  neu aufnehmen.
- Direkte Referenzpaare und Computed Styles für Registrierung, Formularfehler,
  Sicherheitsfolgeansichten, Kontomenü, Einstellungen, Tastenkürzel, Archiv, Drawer, Suche,
  Gesprächsaktionen, Löschdialog und den unkonfigurierten Modellfehler ergänzen, soweit eine
  eindeutige Referenzkomposition vorhanden ist.
- Hover, Fokus, Auswahl, Lade-, Leer-, Erfolgs- und Fehlerzustände sowie offene Menüs und Dialoge
  vollständig abdecken.
- Inhaltlich vergleichbare Gesprächszustände über reale Appabläufe herstellen oder den nicht
  vergleichbaren Umfang weiterhin ausdrücklich offenlassen; keine fingierten Modellantworten oder
  Gespräche einsetzen.
- Lange Namen und Titel, IME, Passwort-Autofill und eine echte Bildschirmtastatur separat prüfen.
  Die normale Darstellung bei 320 Pixel Breite ist dokumentiert; Browserzoom wurde nicht belegt.
- Font- und Geometrieprotokolle für Anmeldung und Gespräch ergänzen. Der geladene Originalfont ist
  bisher nur für die sieben vermessenen Breiten des neuen Vorgangs protokolliert.
- Referenz und Implementierung als verlustfreie Aufnahmen mit dokumentiertem Erzeugungsskript
  sichern, wenn daraus reproduzierbare Pixelmetriken abgeleitet werden sollen.

Bis diese Punkte abgeschlossen und sichtbare Abweichungen einzeln bewertet beziehungsweise behoben
sind, dokumentiert dieses Verzeichnis Teilnachweise und Diagnosematerial, aber keine bestandene
visuelle Gesamtabnahme.
