# ÖV Verspätungs-Wächter (Swiss Public Transport Monitor)

Web-App zur Überwachung von Schweizer Zug- und ÖV-Verbindungen mit automatischer Verspätungs-Erkennung und Browser-Benachrichtigungen via [transport.opendata.ch](https://transport.opendata.ch/docs.html).

## Features
- **Stations-Autovervollständigung**: Vorschläge direkt via `/v1/locations`.
- **Echtzeit-Fahrplan & Verspätungsanzeige**: Abfahrt, Ankunft, Gleis, Umstiege und Verspätung in Minuten (`delay`).
- **Verbindungs-Wächter**: Automatische Hintergrundprüfung alle 45 Sekunden.
- **Benachrichtigungen & Sound**:
  - Browser Web Notification API (Desktop-Meldung).
  - Melodischer 2-Ton-Alarm über Web Audio API (keine externen Sound-Dateien nötig).
  - In-App Status-Toasts und Ereignis-Protokoll.
- **Lokaler Server**: Zero-Dependency Node.js Server enthalten.

## Starten

```bash
# Server starten
node server.js
```
Danach im Browser aufrufen: [http://localhost:3000](http://localhost:3000)

## API-Dokumentation
Die Kernpunkte der Schnittstelle sind in [TRANSPORT_API.md](file:///C:/Users/luciu/Documents/dev/sbbapp/TRANSPORT_API.md) dokumentiert.
