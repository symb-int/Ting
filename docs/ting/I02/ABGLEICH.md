# I02: Abgleich nach Wiederaufnahme

Die ursprüngliche [Spec](SPEC.md) stammt aus der vom Auftraggeber bereitgestellten
Datei `TING-I02-Spec(2).md`. Ihre spätere fachliche UI-Korrektur ist verbindlich:
Veröffentlichte Verfahren können im Chat direkt ausgewählt werden; ein eindeutig
erkanntes oder ausgewähltes Verfahren beginnt unmittelbar mit einer kurzen Nachricht.
Die frühere Vorschlagskarte und zusätzliche Bestätigungsstufe entfallen. Maßgeblich
ist Mock v31, Commit `20b3005a4fc63213122635a29f3b05550ad9bd5a`, beschrieben in
[I02-VERFAHREN.md](../I02-VERFAHREN.md).

## Implementierter und geprüfter Umfang

| Bereich | Nachweis bei Wiederaufnahme |
| --- | --- |
| Werkstatt, Titel/Beschreibung, Entwurf und Veröffentlichung | Durchgängiger Browserlauf gegen reale Anwendung und MongoDB bestanden |
| Rechte und Trennung privater Chats | Login, 401/403, native Vergabe/Entzug und fremder Chat im Browserlauf geprüft |
| Atomare Veröffentlichung, Wiederholung, Konflikte, Mandanten | 15 Datenbank-/Nachrichtenprüfungen mit echter MongoDB bestanden |
| Verfahrenskatalog und unmittelbarer Start ohne Modell | Durchgängiger Browserlauf bestanden, nur veröffentlichte Fassungen sichtbar |
| Native Nachrichtenpersistenz, Reload und Composerentwurf | Durchgängiger Browserlauf bestanden |
| Matcher und Gesprächsagent | Zwei echte Provideraufrufe im Produktionspfad implementiert; 35 isolierte Vertrags-/Metadatenprüfungen bestanden |
| TypeScript | `tsc --noEmit` in data-provider, data-schemas, api und client bestanden |
| Gestaltung | v31-Quelle, Originalschrift und vorhandene Ansichten geprüft; vollständige visuelle Abnahme offen |

Der fachliche Modellpfad ist implementiert. Seine Qualität und sein tatsächlicher
Providerbetrieb sind durch Tests mit eingespritzten Antworten nicht nachgewiesen.
Die Einzelbefunde und Reproduktion stehen in [I02-NACHWEISE](../I02-NACHWEISE/README.md).

## Offene Abschlussbedingungen

1. Echten Login–Werkstatt–Matcher–Gespräch–Persistenz-Lauf mit konfiguriertem
   `OPENAI_API_KEY` und zugänglicher Modell-ID in `OPENAI_MODELS` durchführen.
   Die ursprünglichen Routingfälle, zusätzliche Verfahren und neue Formulierungen
   mit tatsächlichen Ergebnissen dokumentieren.
2. Vollständigen visuellen Vergleich der geforderten Zustände mit Referenz und
   Überlagerungen abschließen. Bestehende Screenshots sind kein Ersatz dafür.
3. Imagebuild und Neustart mit den bestehenden Docker-Volumes prüfen. Docker steht
   in dieser Arbeitsumgebung nicht zur Verfügung.
4. Den Commit nach `Ting-Org/Ting` übertragen und die Remote-SHA prüfen. Die frühere
   Adresse `symb-int/Ting` führt auf dasselbe Repository (ID `1375215488`).
   GitHub verweigerte den Schreibzugriff der Integration mit HTTP 403; die Shell
   besitzt keine GitHub-Schreibanmeldung. Deshalb ist kein Push bestätigt.

Der Stand ist als Implementierung gesichert. **Die vollständige I02-Abnahme ist offen.**
