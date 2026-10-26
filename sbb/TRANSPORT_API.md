# Swiss Public Transport API (transport.opendata.ch)

Basis-URL: `https://transport.opendata.ch/v1`  
CORS: Aktiviert (Browser-Direktaufrufe erlaubt; keine Custom Headers setzen).  
Rate Limit: Kein fixer Hard-Limit, Echtzeit-Daten aktualisieren sich alle 30s. Häufigere Anfragen als alle 30-60s vermeiden (Caching/Drosselungsgefahr).

---

## 1. Endpoints

### `/locations`
Sucht Haltestellen, Adressen und POIs.
- **URL**: `GET /v1/locations`
- **Parameter**:
  - `query` (string, optional*): Suchbegriff (z. B. `Basel`, `Bern`).
  - `x` (float, optional*): Breitengrad (WGS84).
  - `y` (float, optional*): Längengrad (WGS84). *(Entweder `query` oder `x` & `y` erforderlich)*
  - `type` (string, optional): `all` (default), `station`, `poi`, `address`.
- **Response**:
  - `stations[]`: Array von Location-Objekten (`id`, `name`, `coordinate`, `distance`, etc.).

---

### `/connections`
Liefert Verbindungen von A nach B inklusive Echtzeitdaten/Verspätungen.
- **URL**: `GET /v1/connections`
- **Wichtige Parameter**:
  - `from` (string, **required**): Startstation (Name oder ID wie `8503000`), Adresse oder Koordinaten.
  - `to` (string, **required**): Zielstation (Name oder ID), Adresse oder Koordinaten.
  - `via` (string|array, optional): Bis zu 2 Zwischenhalte (`via[]=Bern`).
  - `date` (string, optional): `YYYY-MM-DD`.
  - `time` (string, optional): `hh:mm`.
  - `isArrivalTime` (0|1, optional): `1` falls Zeit Ankunftszeit ist (Default `0`).
  - `transportations[]` (array, optional): `train`, `tram`, `ship`, `bus`, `cableway`.
  - `limit` (int, optional): `1` bis `16` (Default 4).
  - `page` (int, optional): `0` bis `10` (Paginierung).
  - `fields[]` (array, optional): Antwortfelder filtern.
- **Response**:
  - `connections[]`: Array von Connection-Objekten.
    - `from`: Checkpoint-Objekt mit `departure`, `delay` (in Min, `null` = pünktlich/keine Info), `platform`, `prognosis`, `station`.
    - `to`: Checkpoint-Objekt mit `arrival`, `delay` (in Min), `platform`, `prognosis`, `station`.
    - `duration`: Format z. B. `00d00:43:00`.
    - `transfers`: Anzahl Umstiege.
    - `products`: Liste der Transportmittel (`["IC 1", "S3"]`).
    - `sections[]`: Teilstrecken der Verbindung (`journey`, `departure`, `arrival`, `walk`).

---

### `/stationboard`
Abfahrtstafel für eine bestimmte Station.
- **URL**: `GET /v1/stationboard`
- **Parameter**:
  - `station` (string, optional*): Name der Station (z. B. `Aarau`).
  - `id` (string, optional*): Haltestellen-ID (z. B. `8503059`). *(Station oder ID erforderlich)*
  - `limit` (int, optional): Anzahl Einträge.
  - `datetime` (string, optional): `YYYY-MM-DD hh:mm`.
  - `type` (departure|arrival, optional): Default `departure`.
- **Response**:
  - `stationboard[]`: Array von Journeys mit Ziel (`to`), Linie (`name`, `category`, `number`) und `stop` mit `departure`, `delay`, `platform`, `prognosis`.

---

## 2. Verspätungs- & Prognose-Struktur

In einem Checkpoint-Objekt (`connection.from`, `connection.to` oder `section.departure`):
- `delay`: Ganzzahl in Minuten (`null` wenn pünktlich oder keine Prognose verfügbar; z. B. `3` = 3 Min Verspätung).
- `prognosis`:
  - `departure`: ISO 8601 Zeitstempel mit prognostizierter Abfahrtszeit (`null` falls nach Plan).
  - `arrival`: ISO 8601 Zeitstempel mit prognostizierter Ankunftszeit.
  - `platform`: Geändertes Gleis (falls abweichend).

### Prüfung auf Verspätung:
```javascript
const hasDepartureDelay = checkpoint.delay !== null && checkpoint.delay > 0;
const delayMinutes = checkpoint.delay || 0;
```
Für Gesamtreise: `connection.from.delay`, `connection.to.delay` sowie alle `section.departure.delay` und `section.arrival.delay` prüfen.

---

## 3. Best Practices & Richtlinien
- **Polling-Intervall**: Nicht unter 30-45 Sekunden anfragen (GTFS-RT wird serverseitig alle 30-60s aktualisiert).
- **Attribution**: "Timetable data: opentransportdata.swiss".
- **CORS**: Funktioniert direkt im Browser per `fetch()`. Keine Custom Authorization Headers mitgeben.
