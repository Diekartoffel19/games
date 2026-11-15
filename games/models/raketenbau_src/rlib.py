import bpy, bmesh, math
SEGF = 0.6
from mathutils import Vector, Matrix, Euler

MATS = {
 'tankS': (0.92,0.92,0.9,0.15,0.38), 'tankM': (0.92,0.92,0.9,0.15,0.38), 'tankL': (0.92,0.92,0.9,0.15,0.38),
 'tankXL': (0.7,0.3,0.1,0,0.9), 'white': (0.88,0.88,0.85,0.12,0.36), 'gray': (0.27,0.3,0.34,0.55,0.42),
 'dark': (0.025,0.03,0.04,0.45,0.5), 'black': (0.008,0.009,0.011,0.2,0.55), 'shield': (0.04,0.028,0.022,0,0.95),
 'bell': (0.26,0.28,0.32,0.95,0.3), 'vac': (0.43,0.25,0.12,0.95,0.26), 'soot': (0.007,0.007,0.008,0.3,0.8),
 'metal': (0.66,0.71,0.76,0.95,0.2), 'gold': (0.69,0.37,0.05,0.9,0.35), 'orange': (0.8,0.18,0.02,0,0.55),
 'red': (0.58,0.04,0.03,0,0.45), 'hazard': (0.89,0.54,0.03,0,0.6), 'glass': (0.008,0.02,0.05,0.85,0.08),
 'chute': (0.9,0.9,0.85,0,0.85),
}

def mat(name):
    m = bpy.data.materials.get(name)
    if m is None:
        m = bpy.data.materials.new(name)
        m.use_nodes = True
        c = MATS[name]
        b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        b.inputs['Base Color'].default_value = (c[0], c[1], c[2], 1)
        b.inputs['Metallic'].default_value = c[3]
        b.inputs['Roughness'].default_value = c[4]
        m.diffuse_color = (c[0], c[1], c[2], 1)
    return m

def part_root(pid):
    return bpy.data.objects[pid]

def new_part(pid, x):
    old = bpy.data.objects.get(pid)
    if old:
        for ch in list(old.children_recursive): bpy.data.objects.remove(ch, do_unlink=True)
        bpy.data.objects.remove(old, do_unlink=True)
    for me in [m for m in bpy.data.meshes if m.users == 0]: bpy.data.meshes.remove(me)
    for cu in [c for c in bpy.data.curves if c.users == 0]: bpy.data.curves.remove(cu)
    e = bpy.data.objects.new(pid, None)
    bpy.context.scene.collection.objects.link(e)
    e.location = (x, 0, 0)
    global CUR
    CUR = e
    return e

def _link(ob, m, loc=(0,0,0), rot=(0,0,0), smooth=True):
    bpy.context.scene.collection.objects.link(ob)
    if ob.type == 'MESH':
        if not ob.data.materials: ob.data.materials.append(mat(m))
        if smooth:
            for p in ob.data.polygons: p.use_smooth = True
    else:
        ob.data.materials.append(mat(m))
    ob.parent = CUR
    ob.location = loc
    ob.rotation_euler = rot
    return ob

def lathe(pts, m, seg=48, smooth=True, inner=False, loc=(0,0,0), rot=(0,0,0), name='lathe'):
    """pts: [(r, z[, 'h'])] top->bottom. 'h' = hard edge at that point. smooth=False -> all hard."""
    seg = max(12, int(seg * SEGF))
    strips, cur = [], []
    for i, p in enumerate(pts):
        cur.append(p[:2])
        hard = (not smooth) or (len(p) > 2 and p[2] == 'h')
        if hard and 0 < i < len(pts) - 1:
            strips.append(cur); cur = [p[:2]]
    strips.append(cur)
    total = sum((Vector(a) - Vector(b)).length for a, b in zip([p[:2] for p in pts][:-1], [p[:2] for p in pts][1:])) or 1
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new('UVMap')
    s_acc = 0.0
    for st in strips:
        rings, vs = [], []
        acc = s_acc
        for i, (r, z) in enumerate(st):
            if i > 0: acc += (Vector(st[i]) - Vector(st[i-1])).length
            vs.append(1 - acc / total)
            if r < 1e-5:
                rings.append([bm.verts.new((0, 0, z))] * seg)
            else:
                rings.append([bm.verts.new((r * math.cos(2*math.pi*j/seg), r * math.sin(2*math.pi*j/seg), z)) for j in range(seg)])
        s_acc = acc
        for i in range(len(st) - 1):
            for j in range(seg):
                j2 = (j + 1) % seg
                a, b, c, d = rings[i][j], rings[i+1][j], rings[i+1][j2], rings[i][j2]
                uvs = [(j/seg, vs[i]), (j/seg, vs[i+1]), ((j+1)/seg, vs[i+1]), ((j+1)/seg, vs[i])]
                quad = [(a, uvs[0]), (b, uvs[1]), (c, uvs[2]), (d, uvs[3])]
                q = []
                for v, uv in quad:
                    if q and q[-1][0] is v: continue
                    q.append((v, uv))
                if q[0][0] is q[-1][0]: q.pop()
                if len(q) < 3: continue
                if inner: q.reverse()
                f = bm.faces.new([v for v, _ in q])
                for lp, (_, uv) in zip(f.loops, q): lp[uvl].uv = uv
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me)
    return _link(ob, m, loc, rot)

def _prim(op, m, loc, rot, scale=None, bevel=0, bseg=2, smooth=False, name=None, **kw):
    op(location=(0,0,0), **kw)
    ob = bpy.context.active_object
    bpy.context.scene.collection.objects.unlink(ob) if ob.name in bpy.context.scene.collection.objects else None
    for c in ob.users_collection: c.objects.unlink(ob)
    if scale:
        ob.data.transform(Matrix.Diagonal((*scale, 1)))
    if bevel:
        md = ob.modifiers.new('bev', 'BEVEL'); md.width = bevel; md.segments = bseg; md.limit_method = 'ANGLE'
        md.harden_normals = False
    ob.data.materials.append(mat(m))
    if name: ob.name = name
    return _link(ob, m, loc, rot, smooth)

def box(size, loc, m, rot=(0,0,0), bevel=0.008):
    return _prim(bpy.ops.mesh.primitive_cube_add, m, loc, rot, scale=(size[0]/2, size[1]/2, size[2]/2), bevel=bevel, size=2)

def cyl(r, depth, loc, m, rot=(0,0,0), verts=16, bevel=0.0, smooth=True, r2=None):
    if r2 is None:
        ob = _prim(bpy.ops.mesh.primitive_cylinder_add, m, loc, rot, bevel=bevel, vertices=verts, radius=r, depth=depth)
    else:
        ob = _prim(bpy.ops.mesh.primitive_cone_add, m, loc, rot, bevel=bevel, vertices=verts, radius1=r2, radius2=r, depth=depth)
    if smooth:
        for p in ob.data.polygons: p.use_smooth = True
        md = ob.modifiers.new('es', 'EDGE_SPLIT'); md.split_angle = math.radians(40)
    return ob

def sphere(r, loc, m, seg=16, rings=10, scale=None):
    ob = _prim(bpy.ops.mesh.primitive_uv_sphere_add, m, loc, (0,0,0), scale=scale, segments=seg, ring_count=rings, radius=r)
    for p in ob.data.polygons: p.use_smooth = True
    return ob

def torus(R, r, loc, m, rot=(0,0,0), seg=40, mseg=6):
    seg = max(10, int(seg * SEGF))
    ob = _prim(bpy.ops.mesh.primitive_torus_add, m, loc, rot, major_radius=R, minor_radius=r, major_segments=seg, minor_segments=mseg)
    for p in ob.data.polygons: p.use_smooth = True
    return ob

def tube(points, r, m, res=6, bevres=3):
    cu = bpy.data.curves.new('tube', 'CURVE'); cu.dimensions = '3D'
    cu.bevel_depth = r; cu.bevel_resolution = bevres; cu.resolution_u = res; cu.use_fill_caps = True
    sp = cu.splines.new('BEZIER'); sp.bezier_points.add(len(points) - 1)
    for bp, p in zip(sp.bezier_points, points):
        bp.co = p; bp.handle_left_type = bp.handle_right_type = 'AUTO'
    ob = bpy.data.objects.new('tube', cu)
    _link(ob, m)
    return ob

def ring_of(n, rad, z, fn, a0=0.0):
    """call fn(x, y, ang) n times around the axis (blender angle)."""
    for k in range(n):
        a = a0 + 2*math.pi*k/n
        fn(rad*math.cos(a), rad*math.sin(a), a)

def bolts(n, rad, z, m='dark', r=0.014, d=0.02, a0=0.0):
    n = max(6, int(n * 0.6))
    ring_of(n, rad + d/2 - 0.004, z, lambda x, y, a: cyl(r, d, (x, y, z), m, rot=(0, math.pi/2, a), verts=6, smooth=False), a0)

def bell(rT, rE, zT, zE, m='bell', x=0, y=0, hoops=2, wall=0.02, seg=48, k=1.45):
    rAt = lambda t: rT + (rE - rT) * (1 - (1 - t) ** k)
    outer = [(rAt(i/10) + wall, zT + (zE - zT)*i/10) for i in range(11)]
    inner = [(rAt(i/10), zT + (zE - zT)*i/10) for i in range(11)]
    lathe(outer, m, seg, loc=(x, y, 0))
    lathe(inner, 'soot', seg, inner=True, loc=(x, y, 0))
    torus(rE + wall*0.6, wall*0.9, (x, y, zE + 0.004), m, seg=seg)
    for i in range(1, hoops + 1):
        t = i / (hoops + 1) * 0.8 + 0.1
        torus(rAt(t) + wall + 0.004, 0.011, (x, y, zT + (zE - zT)*t), m, seg=seg)

def finalize(pid):
    """apply modifiers / convert curves, join all children into one multi-material mesh."""
    root = bpy.data.objects[pid]
    kids = list(root.children)
    bpy.ops.object.select_all(action='DESELECT')
    dg = bpy.context.evaluated_depsgraph_get()
    meshes = []
    for ob in kids:
        ev = ob.evaluated_get(dg)
        me = bpy.data.meshes.new_from_object(ev)
        me.transform(ob.matrix_parent_inverse)
        me.transform(Matrix.LocRotScale(ob.location, ob.rotation_euler, ob.scale))
        if not me.materials and ob.material_slots:
            for s in ob.material_slots: me.materials.append(s.material)
        meshes.append(me)
        bpy.data.objects.remove(ob, do_unlink=True)
    bm = bmesh.new()
    allm = []
    for me in meshes:
        idx = []
        for mm in me.materials:
            if mm not in allm: allm.append(mm)
            idx.append(allm.index(mm))
        for p in me.polygons: p.material_index = idx[p.material_index] if idx else 0
        bm.from_mesh(me)
        bpy.data.meshes.remove(me)
    out = bpy.data.meshes.new(pid + '_mesh')
    bm.to_mesh(out); bm.free()
    for mm in allm: out.materials.append(mm)
    ob = bpy.data.objects.new(pid + '_geo', out)
    bpy.context.scene.collection.objects.link(ob)
    ob.parent = root
    return len(out.vertices), len(out.polygons), [m.name for m in allm]
