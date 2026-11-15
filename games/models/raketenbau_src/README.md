# Raketenbau – Blender-Modelle

Quelle der Bauteil-Modelle für `games/raketenbau.html`.

- `rlib.py` – Hilfsfunktionen (Rotationskörper, Schrauben, Düsen, Zusammenführen pro Teil)
- `parts.py` – ein Modell pro Bauteil, Maße exakt wie `PARTS` (Oberkante bei z=0, Höhe nach unten)
- `quantize.py` – komprimiert den exportierten GLB mit `KHR_mesh_quantization` (nur numpy)

Neu erzeugen (in Blender, Python-Konsole oder MCP):

```python
exec(open(r"<pfad>/rlib.py").read()); exec(open(r"<pfad>/parts.py").read())
build_all()
bpy.ops.export_scene.gltf(filepath="parts_raw.glb", export_format='GLB', export_yup=True, export_apply=True)
```

Dann `python quantize.py parts_raw.glb parts_q.glb` und den GLB base64-kodiert nach
`../raketenbau_parts.js` schreiben (`window.RAKETENBAU_GLB = "..."`).

Materialnamen in Blender müssen Schlüsseln von `M` im Spiel entsprechen (`soot` = Düseninnenseite).
