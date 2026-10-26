# ÖV Verspätungs-Wächter (Swiss Public Transport Monitor)

Web-App zur Überwachung von Schweizer Zug- und ÖV-Verbindungen mit automatischer Verspätungs-Erkennung und Browser-Benachrichtigungen via [transport.opendata.ch](https://transport.opendata.ch/docs.html).

## Features
- **Stations-Autovervollständigung**: Vorschläge direkt via `/v1/locations`.
- **GPS-Standortfinder (📍)**: Ermittelt per Klick die nächstgelegene Haltestelle.
- **Echtzeit-Fahrplan & Verspätungsanzeige**: Abfahrt, Ankunft, Gleis, Umstiege und Verspätung in Minuten (`delay`).
- **Teilstrecken & Zwischenhalte**: Ausklappbares Detailmenü pro Verbindung mit Umstiegszeiten, Fußwegen und Zwischenhalten.
- **Live-Abfahrtstafel (Stationboard)**: Tab zur Abfrage aller Abfahrten an jedem Schweizer Bahnhof in Echtzeit.
- **Favoriten-Speicher**: Regelmäßige Strecken mit einem Klick speichern, verwalten und abrufen (`localStorage`).
- **Kalender-Export (📅 .ics)**: Verbindung direkt als iCalendar-Termin für Google Calendar, Apple Calendar & Outlook herunterladen.
- **Verbindungs-Wächter**: Automatische Hintergrundprüfung alle 45 Sekunden mit konfigurierbarer Verspätungsschwelle (1, 3, 5, 10 Min).
- **Benachrichtigungen & Sound**:
  - Browser Web Notification API (Desktop-Meldung).
  - Melodischer 2-Ton-Alarm über Web Audio API mit Audio-Mute Schalter.
  - In-App Status-Toasts und Ereignis-Protokoll.
- **Filter**: Auswahl bestimmter Verkehrsmittel (Zug, Tram, Bus, Schiff).
- **Lokaler Server**: Zero-Dependency Node.js Server enthalten.

## Starten

```bash
# Server starten
node server.js
```
Danach im Browser aufrufen: [http://localhost:3000](http://localhost:3000)

## API-Dokumentation
Die Kernpunkte der Schnittstelle sind in [TRANSPORT_API.md](file:///C:/Users/luciu/Documents/dev/games/sbb/TRANSPORT_API.md) dokumentiert.
