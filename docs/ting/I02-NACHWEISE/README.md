# I02: geprüfter Implementierungsstand

Die Prüfung erfolgte mit der tatsächlich gebauten Anwendung, Chromium 153, Node.js 24.19
und einer getrennten echten MongoDB 8.2.1. Die Testdaten wurden über Registrierung,
Werkstatt und die regulären APIs erzeugt. Es wurden keine Modellantworten im laufenden
Produktionsserver simuliert.

## Geprüfte Abläufe

Der Browserlauf `e2e/specs/ting/intake.spec.ts` besteht. Er prüft Anmeldung und
Zugriffsverweigerung, die native Berechtigungsvergabe und den Entzug, die leere Werkstatt,
Formularvalidierung, Entwurf, Veröffentlichung, Ausschluss unveröffentlichter Änderungen
aus dem Bürgerkatalog, konkurrierende Bearbeitung mit HTTP 409 und erhaltenen Eingaben,
Verfahrensstart ohne Modell, erhaltenen Nachrichtenentwurf, Wiederherstellung nach Reload,
mobile Breiten 799/390/320 und die Trennung privater Gespräche zweier Konten.

Die beigefügten Aufnahmen stammen aus diesem erfolgreichen Lauf:

- [Veröffentlichte Verfahrensdefinition](workshop-desktop.png)
- [Verfahrensstart im gespeicherten Chat](chat-start.png)
- [Werkstatt auf schmalem Bildschirm](workshop-mobile.png)

Die Werkstatt wurde gegen die Quelldateien des freigegebenen Entwurfs v31 verglichen.
Die Schriftdateien stimmen bytegenau überein. Der Vergleich prüfte auch Formularabstände,
Feldhöhen und Buttons; der Prototypen-Werkzeugbalken ist kein Produktbestandteil.

Weitere bestandene Prüfungen:

- Datenbank: atomare Veröffentlichung, Idempotenz, Schreibkonflikte, Mandantentrennung,
  Pagination und native Berechtigungen.
- Nachrichten: private Metadaten, Import-/Editiergrenzen, öffentliche REST- und
  Live-/Replay-Ausgaben sowie dauerhafte Fehlernachrichten bei Wiederholungen.
- Matcher/Gespräch: strikte Verträge, echte Referenzen und Zitate, Korrektur,
  mehrere Anliegen und Erhalt der historischen Verfahrensfassung.
- Frontend: aktuelle Antwortaktionen, native Übertragung und Entwurfserhalt.
- Setup/Compose: Start ohne Modellzugang und Erhalt vorhandener Konfiguration.

`npm run lighthouse` bestand beide Tests mit unveränderten Grenzwerten. Bei zusätzlich
250 ms Verzögerung pro Datenbankabfrage lagen die Mediane bei LCP 3096 ms, CLS 0,000226
und TBT 108 ms. Der vorhandene Test prüfte außerdem Hover und Nachrichtenausrichtung.

## Reproduzieren

Nach dem normalen Paket- und Clientbuild:

```sh
npx playwright test --config=e2e/playwright.config.ting-intake.ts
```

Dieser Test startet selbst eine isolierte echte Datenbank und die Anwendung auf Port 3097.
`TING_CHROMIUM_PATH` kann auf einen vorhandenen Chromium-Browser zeigen. Der Test greift
nicht auf eine laufende Installation zu.

## Noch nicht nachgewiesen

Ein echter semantischer Modelllauf konnte in dieser Umgebung mangels OpenAI-Schlüssel
und freigeschalteter Modell-ID nicht durchgeführt werden. Modellabhängige Grenztests mit
injizierten Antworten prüfen den Vertrag, nicht die Erkennungsqualität. Die freie
Anliegenserkennung ist deshalb noch mit dem vorgesehenen Produktionsmodell abzunehmen.

Docker ist in dieser Prüfumgebung nicht verfügbar. Die Compose-Konfiguration ist geprüft;
der Imagebuild und Neustart des vorhandenen Docker-Stacks sind hier nicht ausgeführt worden.
