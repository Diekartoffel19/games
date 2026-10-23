---
name: toast
description: >-
  Leitfaden, Spielmechaniken, 3-Segment-Ragdoll-Physik, Bullet-Time-Aiming, Skins und Architektur für "Toast & Sausage Flip: Physics Trickshot".
---

# Toast & Sausage Flip: Physics Trickshot — Dokumentation & Game Guide

Dieses Dokument beschreibt das virale Ragdoll-Geschicklichkeitsspiel **Toast & Sausage Flip: Physics Trickshot** (`games/toast.html`), inspiriert vom weltbekannten Hit *Sausage Flip*.

---

## 🎯 Spielkonzept & Kernmechanik

* **Genre:** Physik-basiertes Ragdoll-Flip-Spiel (*Sausage Flip* Mechanik).
* **Ziel:** Führe die wabbelige Wurst, das Toastbrot oder andere Food-Skins über verrückte Hindernisparcours ins Ziel (den kochend heißen Toaster oder die riesige spitze Gabel)!
* **Kernmechanik:**
  * **3-Segment Ragdoll-Physik (Matter.js Constraints):** Die Wurst / der Toast besteht aus drei flexibel verknüpften Physik-Körpern mit Gelenk-Dämpfung und Restitution. Dies sorgt für den typischen ultra-witzigen Wackelpudding- / Slapstick-Look.
  * **Wackelaugen mit Trägheit (Inertia Googly Eyes):** Die Augenpupillen rollen dynamisch basierend auf der aktuellen Fluggeschwindigkeit und Drehimpuls.
  * **Bullet-Time Slow-Motion Aiming:**
    * Sobald der Spieler den Bildschirm berührt oder die Maustaste gedrückt hält, verlangsamt sich die Spielwelt schlagartig in dramatische Zeitlupe (`timeScale = 0.08`)!
    * Ein rotes "⏱️ BULLET-TIME AIM"-Banner leuchtet auf, begleitet von einem tiefen Herzschlag-Audio.
    * Eine dynamische Trajektorien-Vorschau zeigt die Flugkurve an.
  * **Mid-Air Flips:** Der Spieler kann jederzeit erneut zielen und abfeuern – auch mitten im Flug, um Richtungswechsel zu vollziehen, Abgründen auszuweichen oder Kunststücke zu vollführen.
  * **Ziele:**
    * 🍞 **Pop-Up Toaster:** Rastet mit metallischem `CLACK!` ein, Heizelemente glühen auf, Toasterglocke läutet `*DING!*`.
    * 🍴 **Riesengabel:** Die Wurst spießt sich mit einem satten Schwing-Sound auf den Zinken auf!
  * **Gefahren:** Glühende Herdplatten, rotierende Messer, heiße Grillkohle und Laser braten die Wurst bei Berührung sofort und starten das Level neu.

---

## 🎭 Skins & Charaktere

1. 🌭 **Sausage (Die klassische Wurst):** Perfekte Wabbel-Physik und runde Enden.
2. 🍞 **Toastbrot:** Breitere Segmente mit goldener Kruste und Butterpad.
3. 🥞 **Pancake:** Weiche Scheibe mit Ahornsirup-Färbung.
4. 🥓 **Bacon:** Extra dehnbarer, knuspriger Speckstreifen.
5. 🥒 **Gewürzgurke:** Festere Textur mit saftigen Pickeln.
6. 🍩 **Donut:** Mit rosa Glasur und bunten Streuseln.

---

## 🕹️ Steuerung

* **Maus & Touchscreen:**
  * **Klicken / Tippen & Halten:** Zeitlupe (Bullet-Time) aktivieren & Zielen.
  * **Ziehen:** Schussrichtung und Kraft anpassen (entgegengesetzt ziehen).
  * **Loslassen:** Flip mit voller Wucht und Drehimpuls abfeuern! (Geht auch mitten im Flug!)
* **Tastatur:**
  * <kbd>R</kbd>: Level / Schuss sofort zurücksetzen (*Quick Retry*).
  * <kbd>N</kbd>: Nächstes Level.
  * <kbd>M</kbd>: Sound stummschalten / aktivieren.

---

## 🔊 Audio-Design & Web Audio API

* **Bullet-Time:** Sub-Bass Herzschlag-Frequenzmodulation.
* **Flip:** Knackiges Cartoon-Whoosh beim Loslassen.
* **Flop / Bounce:** Feuchter, wabbeliger Klatsch-Sound bei Kollisionen.
* **Gefahren:** Brutzelndes Sizzle-Geräusch bei Hitze-Kontakt.
* **Toaster:** 1280Hz / 2560Hz harmonische Toaster-Glocke.
* **Gabel:** Metallisches Aufspieß-Schwingen.
* **Sterne:** Pentatonische C-E-G-C Tonleiter.
