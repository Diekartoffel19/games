"""Quantize a Blender-exported GLB with KHR_mesh_quantization (no external deps besides numpy).
POSITION -> normalized SHORT (dequantized via mesh node translation/scale)
NORMAL   -> normalized BYTE (vec4 padded)
TEXCOORD_0 -> normalized UNSIGNED_SHORT
indices  -> UNSIGNED_SHORT
usage: python quantize.py in.glb out.glb
"""
import sys, json, struct
import numpy as np

CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}

src, dst = sys.argv[1], sys.argv[2]
b = open(src, 'rb').read()
jl = struct.unpack('<I', b[12:16])[0]
J = json.loads(b[20:20 + jl])
bin0 = b[20 + jl + 8:]

def read(ai):
    a = J['accessors'][ai]; bv = J['bufferViews'][a['bufferView']]
    off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    n = NC[a['type']]; dt = CT[a['componentType']]
    stride = bv.get('byteStride')
    if stride and stride != n * np.dtype(dt).itemsize: raise SystemExit('strided not supported')
    return np.frombuffer(bin0, dt, a['count'] * n, off).reshape(a['count'], n) if n > 1 else np.frombuffer(bin0, dt, a['count'], off)

out = bytearray(); views = []; accs = []
def push(arr, target, ctype, typ, normalized=False, minmax=None):
    while len(out) % 4: out.append(0)
    raw = np.ascontiguousarray(arr).tobytes()
    views.append({'buffer': 0, 'byteOffset': len(out), 'byteLength': len(raw), **({'target': target} if target else {})})
    out.extend(raw)
    a = {'bufferView': len(views) - 1, 'componentType': ctype, 'count': int(arr.shape[0]), 'type': typ}
    if normalized: a['normalized'] = True
    if minmax: a['min'], a['max'] = minmax
    accs.append(a)
    return len(accs) - 1

mesh_q = {}
for mi, mesh in enumerate(J['meshes']):
    pos_all = np.concatenate([read(p['attributes']['POSITION']) for p in mesh['primitives']])
    lo, hi = pos_all.min(0), pos_all.max(0)
    c = (lo + hi) / 2; s = np.full(3, max(float(((hi - lo) / 2).max()), 1e-6))  # uniform: keeps normals valid
    mesh_q[mi] = (c, s)
    for p in mesh['primitives']:
        at = p['attributes']; na = {}
        P = read(at['POSITION'])
        q = np.clip(np.round((P - c) / s * 32767), -32767, 32767).astype(np.int16)
        q4 = np.zeros((len(q), 4), np.int16); q4[:, :3] = q
        mn = q.min(0).astype(int).tolist(); mx = q.max(0).astype(int).tolist()  # raw ints for normalized accessors
        # accessor of SHORT VEC3 needs 4-byte aligned stride: use a strided view of the VEC4 data
        while len(out) % 4: out.append(0)
        raw = q4.tobytes()
        views.append({'buffer': 0, 'byteOffset': len(out), 'byteLength': len(raw), 'byteStride': 8, 'target': 34962}); out.extend(raw)
        accs.append({'bufferView': len(views) - 1, 'componentType': 5122, 'normalized': True, 'count': len(q), 'type': 'VEC3', 'min': mn, 'max': mx})
        na['POSITION'] = len(accs) - 1
        if 'NORMAL' in at:
            N = read(at['NORMAL']); nq = np.zeros((len(N), 4), np.int8)
            nq[:, :3] = np.clip(np.round(N * 127), -127, 127)
            views.append(None)  # placeholder replaced below
            views.pop()
            while len(out) % 4: out.append(0)
            raw = nq.tobytes()
            views.append({'buffer': 0, 'byteOffset': len(out), 'byteLength': len(raw), 'byteStride': 4, 'target': 34962}); out.extend(raw)
            accs.append({'bufferView': len(views) - 1, 'componentType': 5120, 'normalized': True, 'count': len(N), 'type': 'VEC3'})
            na['NORMAL'] = len(accs) - 1
        if 'TEXCOORD_0' in at:
            T = read(at['TEXCOORD_0'])
            tq = np.round(np.clip(T, 0, 1) * 65535).astype(np.uint16)
            na['TEXCOORD_0'] = push(tq, 34962, 5123, 'VEC2', True)
        p['attributes'] = na
        I = read(p['indices'])
        it = np.uint16 if I.max() < 65535 else np.uint32
        p['indices'] = push(I.astype(it), 34963, 5123 if it == np.uint16 else 5125, 'SCALAR')

for node in J['nodes']:
    if 'mesh' in node:
        c, s = mesh_q[node['mesh']]
        if any(k in node for k in ('rotation', 'scale', 'matrix')) or node.get('translation', [0, 0, 0]) != [0, 0, 0]:
            raise SystemExit('mesh node has transform: ' + node.get('name', '?'))
        node['translation'] = c.tolist(); node['scale'] = s.tolist()

J['accessors'] = accs; J['bufferViews'] = views
while len(out) % 4: out.append(0)
J['buffers'] = [{'byteLength': len(out)}]
J.setdefault('extensionsUsed', []).append('KHR_mesh_quantization')
J.setdefault('extensionsRequired', []).append('KHR_mesh_quantization')
js = json.dumps(J, separators=(',', ':')).encode()
while len(js) % 4: js += b' '
glb = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(out)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(out), 0x004E4942) + bytes(out)
open(dst, 'wb').write(glb)
print(len(b), '->', len(glb))
