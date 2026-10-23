---
name: driftisles
description: >-
  Leitfaden für games/driftisles.html (Drift Isles): Voxel-Sandbox auf schwebenden Pastell-Inseln – Look & Feel,
  Steuerung, Weltgenerierung, Crafting, Gloops, Tag/Nacht und Audio.
---

# Drift Isles – Leitfaden

Eigenständige Voxel-Survival-Sandbox (Three.js r128, Single-File) im Minecraft-Stil mit **unendlicher, chunk-basierter Welt**: **Overworld** (Biome: Ozean/Strand, Ebene, Wald, Wüste, Schnee-Taiga, Gebirge; Höhlen, Lava ab Tiefe, Kohle/Eisen/Gold/Diamant, Kies, Eichen/Fichten/Kakteen, Gras, Blumen) und **Sky Isles** (unendlich viele schwebende Inseln mit Wolkenpfaden).

## Look & Feel
* Prozedural gemalter 16×16-Pixel-Textur-Atlas, Nearest-Filter, AO + Himmelslicht pro Vertex (Höhlen dunkel; Fackeln, Glowstone, Ofen, Lava leuchten). Pflanzen (Gras, Blumen, Fackeln) als gekreuzte Quads.
* UI: graue Bevel-Panels, Hotbar, Herzen/Hunger, Riss-Overlay beim Abbauen, **Minimap** (`N`), F3-Debug (Biom, Chunks, FPS).
* Himmel: Gradient, eckige Sonne/Mond, Sterne, flache Wolken um den Spieler, 10-Minuten-Tag mit Tageszähler.

## Welt/Technik
* Chunks 16×64×16 (`chunkMap`, numerischer Key). `genChunk` generiert deterministisch aus `seed` (Bäume reichen über Chunk-Grenzen, da Nachbarspalten mitgeprüft werden), `streamChunks` lädt/meshed nach Distanz (RD=6, Touch 4) mit Zeitbudget, `unloadFar` entlädt. Nicht geladene Chunks gelten für Physik als fest.
* Spieler-Änderungen: `edits` (pro Chunk Map localIndex→id), Save in `localStorage` (`driftisles_v4`) als flache Liste; `window.__drift` (inkl. `tick(dt)`) als Debug-Hook.
* Biome in `colInfo(x,z)`, Sky Isles in `isleCell/isleAt` (48er-Zellraster).

## Mechaniken
* Survival: Gesundheit/Hunger, Fallschaden, Lava, Tod (Inventar fällt als Items), Respawn. `G` = Creative (Fliegen nur dort).
* Mobs: Schweine, Kühe, Schafe (Wolle), Hühner; nachts/in Höhlen Zombies (brennen am Tag) und Creeper (Explosion). Spawn pro neuem Chunk bzw. um den Spieler.
* Items als Drops, Essen per Rechtsklick, Werkzeuge/Schwerter in 4 Stufen mit Haltbarkeit, Fackeln, Glas, Gold. Rechtsklick auf Werkbank/Ofen öffnet Crafting. Sand/Kies fallen. Schleichen, Sprint (Doppel-W/Strg).
