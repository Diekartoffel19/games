import bpy, bmesh, math
from mathutils import Vector
PI = math.pi
FRONT = -PI/2  # blender -Y == three.js +Z (camera side)

def polar(ang, rad):
    return rad*math.cos(ang), rad*math.sin(ang)

def on_surface_cyl(r, depth, ang, rad, z, tilt, m, verts=24, r2=None):
    x, y = polar(ang, rad)
    return cyl(r, depth, (x, y, z), m, rot=(0, PI/2 - tilt, ang), verts=verts, r2=r2)

def on_surface_torus(R, rr, ang, rad, z, tilt, m):
    x, y = polar(ang, rad)
    return torus(R, rr, (x, y, z), m, rot=(0, PI/2 - tilt, ang), seg=32, mseg=8)

def on_surface_box(size, ang, rad, z, tilt, m, bevel=0.008):
    x, y = polar(ang, rad)
    return box(size, (x, y, z), m, rot=(0, -tilt, ang), bevel=bevel)

def strut(p0, p1, r, m, verts=8):
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    rot = d.to_track_quat('Z', 'Y').to_euler()
    return cyl(r, d.length, tuple((p0 + p1) / 2), m, rot=tuple(rot), verts=verts)

def rcs_quad(ang, rad, z, s=1.0):
    on_surface_box((0.09*s, 0.16*s, 0.14*s), ang, rad + 0.03*s, z, 0, 'gray', bevel=0.012*s)
    x, y = polar(ang, rad + 0.075*s)
    t = Vector((-math.sin(ang), math.cos(ang), 0))
    for sgn in (-1, 1):
        p = Vector((x, y, z)) + t * (sgn * 0.085*s)
        rot = (t * sgn).to_track_quat('Z', 'Y').to_euler()
        cyl(0.012*s, 0.035*s, tuple(p), 'dark', rot=tuple(rot), verts=10, r2=0.022*s)
    cyl(0.012*s, 0.035*s, (x, y, z - 0.085*s), 'dark', rot=(PI, 0, 0), verts=10, r2=0.022*s)
    cyl(0.012*s, 0.035*s, (x, y, z + 0.085*s), 'dark', verts=10, r2=0.022*s)

# ---------------- capsules ----------------
def pod(pid, x, big):
    new_part(pid, x)
    h = 2.3 if big else 1.6
    r = 1.25 if big else 0.65
    s = r / 0.65
    tR = r*0.42 if big else 0.36
    rB = r*0.97
    y0, y1 = -h*0.1, -h*0.78
    # docking adapter
    lathe([(0, 0), (tR*0.62, 0, 'h'), (tR*0.66, -0.012*s, 'h'), (tR*0.66, -0.035*s, 'h'), (tR*0.86, -0.035*s, 'h'),
           (tR*0.9, -0.05*s, 'h'), (tR*0.9, y0*0.55, 'h'), (tR, y0*0.62, 'h'), (tR, y0)], 'gray', 48)
    lathe([(tR*0.62, -0.004), (0, -0.004)], 'dark', 48)
    for k in range(3):
        a = k*2*PI/3 + PI/6
        bx, by = polar(a, tR*0.76)
        box((0.07*s, 0.05*s, 0.05*s), (bx, by, 0.012*s), 'dark', rot=(0, 0, a), bevel=0.008*s)
    torus(tR + 0.008, 0.016*s, (0, 0, y0), 'dark', seg=48)
    # cone shell, 2 bands with panel joint
    slope = math.atan((rB - tR) / (y0 - y1))
    rAt = lambda z: tR + (rB - tR) * ((y0 - z) / (y0 - y1))
    zm = y0 + (y1 - y0)*0.62
    lathe([(tR, y0), (rAt(zm) , zm)], 'white', 64)
    lathe([(rAt(zm), zm), (rB, y1)], 'white', 64)
    torus(rAt(zm) + 0.003, 0.009*s, (0, 0, zm), 'dark', seg=64)
    # aft band + heat shield
    lathe([(rB, y1, 'h'), (r, y1 - h*0.02, 'h'), (r, -h*0.9)], 'dark', 64)
    bolts(int(24*s), r, y1 - h*0.025, 'gray', r=0.009*s, d=0.012)
    lathe([(r + 0.006, -h*0.9, 'h'), (r*0.985, -h*0.94), (r*0.93, -h*0.975), (r*0.72, -h*0.996), (0, -h)], 'shield', 64)
    torus(r, 0.012*s, (0, 0, -h*0.9), 'black', seg=64)
    # windows
    zw = -h*(0.4 if big else 0.42)
    rw = 0.2 if big else 0.15
    for da in ([-0.55, 0, 0.55] if big else [0]):
        a = FRONT + da
        rc = rAt(zw)
        on_surface_cyl(rw + 0.035*s, 0.03, a, rc + 0.004, zw, slope, 'dark', verts=32)
        on_surface_torus(rw + 0.01, 0.022*s, a, rc + 0.022, zw, slope, 'gray')
        on_surface_cyl(rw, 0.012, a, rc + 0.02, zw, slope, 'glass', verts=32)
    # hatch at the back
    zh = -h*0.5
    rc = rAt(zh)
    hw, hh = (0.42, 0.5) if big else (0.26, 0.32)
    on_surface_box((0.02, hw, hh), -FRONT, rc + 0.004, zh, slope, 'white', bevel=0.01)
    on_surface_box((0.012, hw + 0.03, hh + 0.03), -FRONT, rc - 0.002, zh, slope, 'dark', bevel=0.004)
    on_surface_box((0.03, hw*0.45, 0.025*s), -FRONT, rc + 0.022, zh - hh*0.25, slope, 'metal', bevel=0.008)
    # RCS quads on aft band
    for k in range(4):
        rcs_quad(k*PI/2 + PI/4, r, -h*0.85, s*0.9)
    # small antenna / umbilical
    ax, ay = polar(FRONT + PI/2, rAt(-h*0.2))
    cyl(0.008*s, 0.22*s, (ax*1.03, ay*1.03, -h*0.2 + 0.1*s), 'metal', verts=6)
    on_surface_box((0.03, 0.09*s, 0.12*s), FRONT - PI/2, rAt(-h*0.66) + 0.01, -h*0.66, slope, 'gray', bevel=0.01)
    return finalize(pid)

def chute(pid, x):
    new_part(pid, x)
    h, r = 0.5, 0.35
    pts = [(r*0.92*math.sin(k/12*PI/2), -h*0.62*(1 - math.cos(k/12*PI/2))) for k in range(13)]
    lathe(pts, 'orange', 48)
    lathe([(0, 0.012), (0.07, 0.012, 'h'), (0.075, -0.004, 'h'), (0.075, -0.02)], 'gray', 24)
    for k in range(4):
        a = k*PI/2 + PI/4
        pp = []
        for t in (0.12, 0.35, 0.6, 0.85, 1.0):
            ang = t*PI/2
            rr = r*0.92*math.sin(ang) + 0.008
            z = -h*0.62*(1 - math.cos(ang)) + 0.004
            pp.append((rr*math.cos(a), rr*math.sin(a), z))
        tube(pp, 0.008, 'dark', res=6, bevres=1)
    lathe([(r*0.92, -h*0.62, 'h'), (r, -h*0.66, 'h'), (r, -h*0.96, 'h'), (r*0.9, -h, 'h'), (0, -h)], 'white', 48)
    torus(r + 0.002, 0.01, (0, 0, -h*0.7), 'dark', seg=48)
    torus(r + 0.002, 0.01, (0, 0, -h*0.93), 'dark', seg=48)
    for k in range(3):
        a = k*2*PI/3
        on_surface_box((0.03, 0.09, 0.06), a, r + 0.008, -h*0.815, 0, 'gray', bevel=0.008)
    return finalize(pid)

# ---------------- tanks ----------------
def tank(pid, x, h, r=0.625, xl=False):
    new_part(pid, x)
    rm = 0.1 if xl else 0.06
    lathe([(r, -rm), (r, -h + rm)], pid, 64 if not xl else 72, name='skin')
    for z0 in (0, -h + rm):
        lathe([(r - 0.03, z0, 'h'), (r + 0.006, z0 - 0.008, 'h'), (r + 0.012, z0 - 0.02, 'h'), (r + 0.012, z0 - rm + 0.02, 'h'),
               (r + 0.006, z0 - rm + 0.008, 'h'), (r - 0.03, z0 - rm)], 'dark', 64)
        lathe([(r - 0.03, z0 - (0.004 if z0 == 0 else rm - 0.004)), (0, z0 - (0.004 if z0 == 0 else rm - 0.004))], 'dark', 32)
        bolts(48 if xl else 32, r + 0.012, z0 - rm/2, 'gray', r=0.009, d=0.012)
    a = -0.4
    box((0.07, 0.15 if not xl else 0.2, h*0.86), (*polar(a, r + 0.03), -h/2), 'gray', rot=(0, 0, a), bevel=0.012)
    a2 = -2.6
    cyl(0.03 if not xl else 0.045, h*0.92, (*polar(a2, r + 0.045), -h/2), 'metal', verts=12)
    n = max(2, int(h/0.9))
    for i in range(n):
        z = -h*(i + 0.5)/n
        box((0.06, 0.08, 0.035), (*polar(a2, r + 0.02), z), 'dark', rot=(0, 0, a2), bevel=0.006)
    if pid == 'tankM':
        lathe([(r + 0.004, -h*0.3 + 0.11), (r + 0.004, -h*0.3 - 0.11)], 'black', 64)
    if pid == 'tankL':
        lathe([(r + 0.004, -h*0.26 + 0.25), (r + 0.004, -h*0.26 - 0.25)], 'black', 64)
        lathe([(r + 0.004, -h*0.26 - 0.32), (r + 0.004, -h*0.26 - 0.44)], 'orange', 64)
    if xl:
        a3 = -3.6
        box((0.09, 0.22, h*0.84), (*polar(a3, r + 0.04), -h/2), 'gray', rot=(0, 0, a3), bevel=0.015)
        a4 = -5.2
        cyl(0.045, h*0.9, (*polar(a4, r + 0.06), -h/2), 'metal', verts=12)
        for i in range(n):
            box((0.07, 0.1, 0.04), (*polar(a4, r + 0.025), -h*(i + 0.5)/n), 'dark', rot=(0, 0, a4), bevel=0.006)
        for i in range(1, 5):
            torus(r + 0.004, 0.012, (0, 0, -h*i/5), 'orange', seg=72)
    return finalize(pid)

# ---------------- engines ----------------
def thrust_plate(r, z1, m='dark', bolt_n=24):
    lathe([(0, 0), (r*0.98, 0, 'h'), (r*0.98, z1 + 0.02, 'h'), (r*0.95, z1, 'h'), (0, z1)], m, 48)
    bolts(bolt_n, r*0.98, z1/2, 'gray', r=0.01, d=0.012)

def gimbal(zc, rr):
    sphere(rr, (0, 0, zc), 'metal', seg=16, rings=10)

def actuator(p0, p1):
    p0, p1 = Vector(p0), Vector(p1)
    mid = p0.lerp(p1, 0.55)
    strut(p0, mid, 0.028, 'gray', 10)
    strut(mid - (mid - p0).normalized()*0.04, p1, 0.016, 'metal', 8)
    sphere(0.03, tuple(p0), 'dark', 8, 6)
    sphere(0.024, tuple(p1), 'dark', 8, 6)

def chamber(rC, rT, z0, z1, x=0, y=0, m='gray'):
    lathe([(rC*0.7, z0, 'h'), (rC*0.85, z0, 'h'), (rC, z0 - (z0 - z1)*0.15), (rC, z0 - (z0 - z1)*0.55), (rT*1.1, z0 - (z0 - z1)*0.9), (rT, z1)], m, 32, loc=(x, y, 0))
    torus(rC + 0.006, 0.014, (x, y, z0 - (z0 - z1)*0.35), 'dark', seg=32)
    lathe([(0, z0 + 0.03), (rC*0.7, z0 + 0.03, 'h'), (rC*0.7, z0)], 'dark', 24, loc=(x, y, 0))

def turbopump(px, py, z, rr, length):
    cyl(rr, length, (px, py, z), 'metal', verts=16)
    torus(rr + 0.004, 0.012, (px, py, z + length*0.3), 'dark', seg=16)
    torus(rr + 0.004, 0.012, (px, py, z - length*0.3), 'dark', seg=16)
    sphere(rr*1.05, (px, py, z - length/2), 'gray', 16, 8, scale=(1, 1, 0.6))

def funke(pid, x):
    new_part(pid, x)
    r = 0.625
    thrust_plate(r, -0.06)
    for k in range(6):
        a = k*PI/3
        p0 = (*polar(a, r*0.72), -0.06)
        p1 = (*polar(a + PI/6, 0.18), -0.3)
        strut(p0, p1, 0.02, 'gray', 8)
    lathe([(0.24, -0.29, 'h'), (0.24, -0.31, 'h'), (0.0, -0.31)], 'dark', 24)
    gimbal(-0.3, 0.07)
    chamber(0.22, 0.15, -0.31, -0.56)
    bell(0.15, 0.5, -0.56, -1.1, 'bell', hoops=1)
    turbopump(0.33, 0, -0.44, 0.085, 0.24)
    tube([(0.33, 0, -0.56), (0.34, -0.04, -0.68), (0.26, -0.12, -0.74), (0.15, -0.14, -0.7)], 0.022, 'metal')
    tube([(0.33, 0, -0.32), (0.3, 0, -0.18), (0.42, 0.05, -0.06)], 0.02, 'metal')
    tube([(-0.2, 0.05, -0.38), (-0.36, 0.06, -0.3), (-0.4, 0.05, -0.06)], 0.025, 'metal')
    actuator((0, -r*0.62, -0.06), (0, -0.21, -0.48))
    actuator((-r*0.62, 0, -0.06), (-0.21, 0, -0.48))
    return finalize(pid)

def donner(pid, x):
    new_part(pid, x)
    r = 0.625
    lathe([(0, 0), (r, 0, 'h'), (r, -0.34, 'h'), (r*0.86, -0.5, 'h'), (0.34, -0.62, 'h'), (0, -0.62)], 'dark', 64)
    torus(r + 0.004, 0.02, (0, 0, -0.17), 'gray', seg=64)
    bolts(32, r, -0.03, 'gray', r=0.009, d=0.012)
    for k in range(16):
        a = k*PI/8 + PI/16
        on_surface_box((0.02, 0.05, 0.22), a, r + 0.004, -0.27 + 0.0, 0, 'gray', bevel=0.004)
    for k in range(4):
        a = k*PI/2 + PI/4
        on_surface_box((0.03, 0.14, 0.08), a, r*0.92, -0.42, math.atan(0.14*r/0.16) if False else 0.72, 'black', bevel=0.006)
    gimbal(-0.6, 0.08)
    chamber(0.29, 0.17, -0.6, -0.95)
    bell(0.17, 0.6, -0.95, -1.7, 'bell', hoops=2)
    for sgn in (-1, 1):
        turbopump(sgn*0.5, 0, -0.8, 0.1, 0.34)
        cyl(0.04, 0.42, (sgn*0.56, 0, -1.13), 'dark', verts=12)
        cyl(0.05, 0.05, (sgn*0.56, 0, -1.36), 'dark', verts=12, r2=0.035)
        tube([(sgn*0.5, 0, -0.64), (sgn*0.44, -0.14, -0.7), (sgn*0.2, -0.24, -0.76)], 0.03, 'metal')
        tube([(sgn*0.5, 0, -0.97), (sgn*0.4, 0.12, -1.0), (sgn*0.26, 0.18, -0.88)], 0.024, 'metal')
    actuator((0, -0.36, -0.6), (0, -0.28, -0.88))
    actuator((0, 0.36, -0.6), (0, 0.28, -0.88))
    return finalize(pid)

def vak(pid, x):
    new_part(pid, x)
    r = 0.625
    lathe([(0, 0), (r*0.9, 0, 'h'), (r*0.9, -0.05, 'h'), (0.3, -0.2, 'h'), (0.22, -0.24, 'h'), (0, -0.24)], 'gray', 48)
    bolts(24, r*0.9, -0.025, 'dark', r=0.009, d=0.012)
    gimbal(-0.24, 0.06)
    chamber(0.18, 0.11, -0.25, -0.46)
    # radiatively cooled nozzle: dark upper part, copper skirt
    bell(0.11, 0.62, -0.46, -1.6, 'vac', hoops=3, k=1.6)
    rAt = lambda t: 0.11 + (0.62 - 0.11) * (1 - (1 - t) ** 1.6)
    lathe([(rAt(i/8*0.25) + 0.024, -0.46 - 1.14*i/8*0.25) for i in range(9)], 'dark', 48)
    for sgn in (-1, 1):
        sphere(0.12, (sgn*0.36, 0, -0.26), 'gold', 20, 12)
        torus(0.121, 0.01, (sgn*0.36, 0, -0.26), 'dark', seg=24)
        strut((sgn*0.36, 0, -0.14), (sgn*0.36, 0, -0.06), 0.02, 'gray')
        tube([(sgn*0.26, 0, -0.3), (sgn*0.2, -0.08, -0.34), (sgn*0.14, -0.13, -0.32)], 0.014, 'metal')
    for k in range(4):
        a = k*PI/2 + PI/4
        strut((*polar(a, 0.48), -0.05), (*polar(a, 0.2), -0.28), 0.014, 'gray')
    return finalize(pid)

def mammut(pid, x):
    new_part(pid, x)
    r = 1.25
    lathe([(0, 0), (r, 0, 'h'), (r, -0.45, 'h'), (r*0.92, -0.62, 'h'), (0, -0.62)], 'dark', 72)
    torus(r + 0.004, 0.025, (0, 0, -0.22), 'gray', seg=72)
    bolts(48, r, -0.04, 'gray', r=0.012, d=0.014)
    for k in range(24):
        on_surface_box((0.02, 0.06, 0.15), k*PI/12, r + 0.004, -0.34, 0, 'gray', bevel=0.004)
    for (px, py) in [(0.55, 0.55), (-0.55, 0.55), (0.55, -0.55), (-0.55, -0.55)]:
        lathe([(0.3, -0.6, 'h'), (0.3, -0.64, 'h'), (0.24, -0.66, 'h'), (0.0, -0.66)], 'gray', 32, loc=(px, py, 0))
        chamber(0.24, 0.14, -0.66, -1.02, px, py)
        bell(0.14, 0.52, -1.02, -2.6, 'bell', x=px, y=py, hoops=2)
        d = Vector((px, py, 0)).normalized()
        actuator((px*0.3, py*0.3, -0.62), (px - d.x*0.2, py - d.y*0.2, -0.95))
    cyl(0.2, 0.7, (0, 0, -0.97), 'gray', verts=24, r2=0.16)
    torus(0.205, 0.02, (0, 0, -0.75), 'dark', seg=24)
    sphere(0.17, (0, 0, -1.32), 'gray', 20, 10, scale=(1, 1, 0.6))
    for (px, py) in [(0.55, 0.55), (-0.55, 0.55), (0.55, -0.55), (-0.55, -0.55)]:
        tube([(px*0.25, py*0.25, -0.9), (px*0.5, py*0.5, -0.86), (px*0.72, py*0.72, -0.86)], 0.04, 'metal')
    return finalize(pid)

def srb(pid, x, h, n, red2):
    new_part(pid, x)
    r = 0.625
    bh = h - 0.5
    lathe([(r - 0.03, 0, 'h'), (r + 0.008, -0.01, 'h'), (r + 0.012, -0.03, 'h'), (r + 0.012, -0.1, 'h'), (r, -0.11)], 'dark', 64)
    lathe([(r - 0.03, -0.004), (0, -0.004)], 'dark', 32)
    bolts(32, r + 0.012, -0.065, 'gray', r=0.009, d=0.012)
    lathe([(r, -0.11), (r, -bh)], 'white', 64, name='case')
    for k in range(1, n):
        z = -0.11 - k*(bh - 0.11)/n
        lathe([(r + 0.002, z + 0.04, 'h'), (r + 0.012, z + 0.03, 'h'), (r + 0.012, z - 0.03, 'h'), (r + 0.002, z - 0.04)], 'dark', 64)
        bolts(24, r + 0.012, z, 'gray', r=0.008, d=0.01)
    lathe([(r + 0.004, -0.22), (r + 0.004, -0.52)], 'red', 64)
    if red2:
        lathe([(r + 0.004, -bh + 0.57), (r + 0.004, -bh + 0.87)], 'red', 64)
    # aft skirt
    lathe([(r + 0.004, -bh + 0.38, 'h'), (r*1.02, -bh + 0.3), (r*1.07, -bh + 0.06, 'h'), (r*1.07, -bh, 'h'), (0.2, -bh)], 'gray', 64)
    for k in range(8):
        a = k*PI/4 + PI/8
        on_surface_box((0.03, 0.05, 0.3), a, r*1.04, -bh + 0.19, 0.18, 'dark', bevel=0.006)
    bell(0.2, 0.45, -bh, -h, 'bell', hoops=0)
    lathe([(0.24, -bh + 0.0, 'h'), (0.26, -bh - 0.04, 'h'), (0.22, -bh - 0.1)], 'dark', 32)
    a = -0.4
    box((0.06, 0.13, bh*0.8), (*polar(a, r + 0.02), -bh/2), 'gray', rot=(0, 0, a), bevel=0.01)
    for k in range(2):
        on_surface_box((0.05, 0.16, 0.1), PI/2 + k*PI, r + 0.02, -0.4, 0, 'dark', bevel=0.01)
    return finalize(pid)

def dec(pid, x):
    new_part(pid, x)
    r, h = 0.625, 0.35
    for z0 in (0, -h + 0.05):
        lathe([(r - 0.03, z0, 'h'), (r + 0.01, z0 - 0.006, 'h'), (r + 0.014, z0 - 0.025, 'h'), (r + 0.01, z0 - 0.044, 'h'), (r - 0.03, z0 - 0.05)], 'dark', 64)
        lathe([(r - 0.03, z0 - (0.003 if z0 == 0 else 0.047)), (0, z0 - (0.003 if z0 == 0 else 0.047))], 'dark', 32)
    lathe([(r, -0.05), (r, -h + 0.05)], 'hazard', 64)
    torus(r + 0.004, 0.01, (0, 0, -h/2), 'black', seg=64)
    for k in range(6):
        a = k*PI/3
        on_surface_box((0.04, 0.1, 0.24), a, r + 0.02, -h/2, 0, 'dark', bevel=0.008)
        on_surface_cyl(0.022, 0.05, a, r + 0.05, -h/2 + 0.06, 0, 'metal', verts=8)
        on_surface_cyl(0.022, 0.05, a, r + 0.05, -h/2 - 0.06, 0, 'metal', verts=8)
    return finalize(pid)

def fin_mesh(ang, r0):
    # root chord (x=0): z -0.03 .. -0.99 ; tip chord (x=0.9): z -0.68 .. -1.12
    secs = []
    for (sx, zl, zt, t) in [(0.0, -0.03, -0.99, 0.032), (0.9, -0.68, -1.12, 0.014)]:
        c = zl - zt
        secs.append([(sx, zl, 0), (sx, zl - c*0.18, t), (sx, zt + c*0.06, t*0.45), (sx, zt, 0.0035), (sx, zt, -0.0035), (sx, zt + c*0.06, -t*0.45), (sx, zl - c*0.18, -t)])
    bm = bmesh.new()
    vs = [[bm.verts.new((p[0], p[2], p[1])) for p in s] for s in secs]
    n = len(vs[0])
    for j in range(n):
        j2 = (j + 1) % n
        bm.faces.new([vs[0][j], vs[0][j2], vs[1][j2], vs[1][j]])
    bm.faces.new(list(reversed(vs[0])))
    bm.faces.new(vs[1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new('fin'); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new('fin', me)
    x, y = polar(ang, r0)
    _link(ob, 'red', (x, y, 0), (0, 0, ang))
    md = ob.modifiers.new('es', 'EDGE_SPLIT'); md.split_angle = math.radians(35)
    return ob

def fins(pid, x):
    new_part(pid, x)
    r, h = 0.625, 1.0
    for z0 in (0, -h + 0.06):
        lathe([(r - 0.03, z0, 'h'), (r + 0.008, z0 - 0.008, 'h'), (r + 0.012, z0 - 0.03, 'h'), (r + 0.008, z0 - 0.052, 'h'), (r - 0.03, z0 - 0.06)], 'dark', 64)
        lathe([(r - 0.03, z0 - (0.003 if z0 == 0 else 0.057)), (0, z0 - (0.003 if z0 == 0 else 0.057))], 'dark', 32)
    lathe([(r, -0.06), (r, -h + 0.06)], 'white', 64)
    for k in range(4):
        a = k*PI/2 + PI/4
        fin_mesh(a, r*0.97)
        on_surface_box((0.07, 0.1, 0.9), a, r + 0.02, -0.52, 0, 'dark', bevel=0.02)
        x0, y0 = polar(a, r + 0.06)
        t = Vector((-math.sin(a), math.cos(a), 0))
        for zz in (-0.15, -0.4, -0.65, -0.88):
            for sgn in (-1, 1):
                p = Vector((x0, y0, zz)) + t*sgn*0.055
                cyl(0.009, 0.014, tuple(p), 'gray', rot=tuple(t.to_track_quat('Z', 'Y').to_euler()), verts=6, smooth=False)
    return finalize(pid)

def probe(pid, x):
    new_part(pid, x)
    h, r = 0.85, 0.55
    # Octagonal gold-foil satellite bus + top dish antenna
    lathe([(0.38, -0.02), (0.32, -0.06), (0.18, -0.11), (0.05, -0.14), (0, -0.15)], 'white', 32)
    lathe([(0, -0.15), (0.05, -0.14), (0.18, -0.11), (0.32, -0.06), (0.38, -0.02)], 'gray', 32)
    cyl(0.018, 0.14, (0, 0, -0.07), 'metal', verts=10)
    sphere(0.032, (0, 0, 0.0), 'gold', 12, 8)
    for k in range(3):
        a = k*2*PI/3
        strut((*polar(a, 0.28), -0.04), (0, 0, 0.0), 0.008, 'metal', 6)
    cyl(r, 0.52, (0, 0, -0.43), 'gold', verts=8, bevel=0.02, smooth=False)
    for z0 in (-0.17, -0.69):
        cyl(r*1.03, 0.04, (0, 0, z0), 'dark', verts=8, bevel=0.006, smooth=False)
    lathe([(r*0.95, -0.69, 'h'), (0.625, -0.75, 'h'), (0.625, -h, 'h'), (0, -h)], 'dark', 48)
    bolts(24, 0.625, -0.80, 'gray', r=0.009, d=0.012)
    for k in range(4):
        a = k*PI/2 + PI/4
        on_surface_box((0.04, 0.22, 0.28), a, r*0.93, -0.43, 0, 'solar', bevel=0.006)
        rcs_quad(k*PI/2, r*0.95, -0.43, 0.65)
    # star tracker lens on front
    on_surface_cyl(0.07, 0.08, FRONT, r*0.95, -0.36, 0, 'dark', verts=16, r2=0.05)
    on_surface_cyl(0.05, 0.02, FRONT, r*0.95 + 0.035, -0.36, 0, 'glass', verts=16)
    return finalize(pid)

def nose(pid, x):
    new_part(pid, x)
    h, r = 1.3, 0.625
    pts = [(0, 0)]
    for i in range(1, 15):
        t = i / 14
        pts.append((r * (t ** 0.68), -h * 0.88 * t))
    pts += [(r, -h*0.88, 'h'), (r, -h, 'h'), (0, -h)]
    lathe(pts, 'white', 64)
    lathe([(0, 0.06), (0.015, 0, 'h'), (0.08, -0.12)], 'dark', 24)
    torus(r + 0.003, 0.012, (0, 0, -h*0.88), 'dark', seg=64)
    lathe([(r + 0.003, -h*0.92), (r + 0.003, -h)], 'dark', 64)
    bolts(32, r + 0.003, -h*0.96, 'gray', r=0.009, d=0.012)
    return finalize(pid)

def adapt(pid, x):
    new_part(pid, x)
    h, rt, rb = 1.0, 0.625, 1.25
    lathe([(0, 0), (rt, 0, 'h'), (rt, -0.08, 'h'), (rb, -h + 0.1, 'h'), (rb, -h, 'h'), (0, -h)], 'white', 64)
    lathe([(rt + 0.005, 0), (rt + 0.005, -0.08)], 'dark', 64)
    lathe([(rb + 0.005, -h + 0.1), (rb + 0.005, -h)], 'dark', 64)
    bolts(32, rt + 0.005, -0.04, 'gray', r=0.009, d=0.012)
    bolts(48, rb + 0.005, -h + 0.05, 'gray', r=0.011, d=0.014)
    slope = math.atan((rb - rt) / (h - 0.18))
    for k in range(12):
        a = k * PI / 6
        rm = (rt + rb) * 0.5
        on_surface_box((0.025, 0.05, 0.78), a, rm + 0.006, -h*0.49, -slope, 'gray', bevel=0.005)
    return finalize(pid)

def shield(pid, x):
    new_part(pid, x)
    h, r = 0.45, 0.72
    lathe([(0, 0), (0.625, 0, 'h'), (0.625, -0.09, 'h'), (r, -0.15, 'h'), (r*1.02, -0.24)], 'dark', 64)
    bolts(32, 0.625, -0.045, 'gray', r=0.009, d=0.012)
    lathe([(r*1.02, -0.24, 'h'), (r*0.96, -0.33), (r*0.78, -0.41), (r*0.45, -0.445), (0, -h)], 'shield', 64)
    torus(r*1.01, 0.016, (0, 0, -0.23), 'gold', seg=64)
    for k in range(8):
        a = k * PI / 4
        on_surface_box((0.02, 0.08, 0.07), a, r*0.95, -0.18, -0.35, 'gray', bevel=0.004)
    return finalize(pid)

def legs(pid, x):
    new_part(pid, x)
    r, h = 0.625, 0.9
    for z0 in (0, -h + 0.06):
        lathe([(r - 0.03, z0, 'h'), (r + 0.01, z0 - 0.01, 'h'), (r + 0.012, z0 - 0.05, 'h'), (r - 0.03, z0 - 0.06)], 'dark', 64)
        lathe([(r - 0.03, z0 - (0.003 if z0 == 0 else 0.057)), (0, z0 - (0.003 if z0 == 0 else 0.057))], 'dark', 32)
    lathe([(r, -0.06), (r, -h + 0.06)], 'white', 64)
    for k in range(4):
        a = k*PI/2 + PI/4
        ca, sa = math.cos(a), math.sin(a)
        tx, ty = -sa, ca
        on_surface_box((0.08, 0.16, 0.72), a, r + 0.02, -0.45, 0, 'dark', bevel=0.012)
        p_top = (ca*(r + 0.05), sa*(r + 0.05), -0.16)
        p_bot = (ca*(r + 0.05), sa*(r + 0.05), -0.74)
        p_knee = (ca*(r + 0.52), sa*(r + 0.52), -0.82)
        p_foot = (ca*(r + 0.88), sa*(r + 0.88), -1.38)
        strut(p_top, p_foot, 0.034, 'gray', 10)
        strut(p_bot, p_knee, 0.024, 'metal', 8)
        for sgn in (-1, 1):
            p_side = (ca*(r + 0.04) + tx*sgn*0.14, sa*(r + 0.04) + ty*sgn*0.14, -0.52)
            strut(p_side, p_knee, 0.018, 'gray', 8)
        cyl(0.17, 0.04, p_foot, 'dark', verts=16, r2=0.13)
        sphere(0.045, (p_foot[0], p_foot[1], p_foot[2] + 0.03), 'metal', 10, 6)
    return finalize(pid)

def solar(pid, x):
    new_part(pid, x)
    r, h = 0.625, 0.75
    for z0 in (0, -h + 0.05):
        lathe([(r - 0.03, z0, 'h'), (r + 0.01, z0 - 0.01, 'h'), (r + 0.012, z0 - 0.04, 'h'), (r - 0.03, z0 - 0.05)], 'dark', 64)
        lathe([(r - 0.03, z0 - (0.003 if z0 == 0 else 0.047)), (0, z0 - (0.003 if z0 == 0 else 0.047))], 'dark', 32)
    lathe([(r, -0.05), (r, -h + 0.05)], 'white', 64)
    for k in range(6):
        a = k*PI/3 + PI/6
        on_surface_cyl(0.065, 0.52, a, r + 0.02, -h/2, PI/2, 'gold', verts=14)
        on_surface_torus(0.068, 0.01, a, r + 0.02, -h/2 + 0.16, PI/2, 'dark')
        on_surface_torus(0.068, 0.01, a, r + 0.02, -h/2 - 0.16, PI/2, 'dark')
    for sgn in (-1, 1):
        box((0.1, 0.18, 0.58), (sgn*(r + 0.04), 0, -h/2), 'dark', bevel=0.01)
        strut((sgn*(r + 0.06), 0, -h/2 + 0.18), (sgn*(r + 0.24), 0, -h/2 + 0.18), 0.018, 'metal', 8)
        strut((sgn*(r + 0.06), 0, -h/2 - 0.18), (sgn*(r + 0.24), 0, -h/2 - 0.18), 0.018, 'metal', 8)
        wL, wZ = 1.65, 0.58
        cx = sgn*(r + 0.24 + wL/2)
        box((wL + 0.04, 0.026, wZ + 0.04), (cx, 0, -h/2), 'gray', bevel=0.005)
        for seg in range(4):
            sx = sgn*(r + 0.26 + (seg + 0.5)*(wL/4))
            box((wL/4 - 0.03, 0.034, wZ - 0.04), (sx, 0, -h/2), 'solar', bevel=0.003)
    return finalize(pid)

def ion(pid, x):
    new_part(pid, x)
    r, h = 0.625, 0.95
    lathe([(0, 0), (r, 0, 'h'), (r, -0.14, 'h'), (0.48, -0.34, 'h'), (0.46, -0.62, 'h'), (0, -0.62)], 'dark', 64)
    bolts(28, r, -0.05, 'gray', r=0.009, d=0.012)
    for k in range(3):
        a = k*2*PI/3
        px, py = polar(a, 0.54)
        sphere(0.13, (px, py, -0.36), 'gold', 20, 12, scale=(0.85, 0.85, 1.25))
        torus(0.112, 0.012, (px, py, -0.36), 'dark', seg=20)
        on_surface_box((0.06, 0.14, 0.22), a + PI/3, 0.5, -0.36, 0, 'gray', bevel=0.008)
    lathe([(0.44, -0.60, 'h'), (0.48, -0.78, 'h'), (0.43, -h, 'h'), (0.37, -h, 'h'), (0.37, -0.75, 'h'), (0, -0.75)], 'metal', 48)
    for rr, m in [(0.35, 'ion'), (0.26, 'dark'), (0.19, 'ion'), (0.11, 'dark')]:
        torus(rr, 0.013, (0, 0, -h + 0.02), m, seg=40)
    cyl(0.36, 0.02, (0, 0, -h + 0.04), 'ion', verts=32)
    cyl(0.06, 0.14, (0, 0, -h + 0.05), 'gold', verts=16)
    cyl(0.022, 0.16, (0.44, 0, -h + 0.06), 'metal', rot=(0, -0.35, 0), verts=10)
    sphere(0.03, (0.41, 0, -h - 0.01), 'ion', 10, 8)
    return finalize(pid)

def nuke(pid, x):
    new_part(pid, x)
    r, h = 0.625, 2.2
    thrust_plate(r, -0.08, bolt_n=32)
    for k in range(8):
        a = k*PI/4
        strut((*polar(a, r*0.82), -0.08), (*polar(a + PI/8, 0.38), -0.36), 0.022, 'gray', 8)
    lathe([(0, -0.28), (0.44, -0.34, 'h'), (0.44, -0.42, 'h'), (0, -0.42)], 'gold', 48)
    lathe([(0.38, -0.42), (0.40, -0.52), (0.40, -1.02), (0.34, -1.14), (0.16, -1.26), (0, -1.26)], 'dark', 48)
    for zc in (-0.55, -0.72, -0.89, -1.04):
        torus(0.405, 0.018, (0, 0, zc), 'gold', seg=48)
    lathe([(0.403, -0.62), (0.403, -0.80)], 'hazard', 48)
    for k in range(6):
        a = k*PI/3
        px, py = polar(a, 0.42)
        cyl(0.038, 0.62, (px, py, -0.76), 'gray', verts=12)
        cyl(0.05, 0.1, (px, py, -0.44), 'metal', verts=12)
        tube([(px, py, -1.06), (px*0.75, py*0.75, -1.20), (px*0.42, py*0.42, -1.26)], 0.018, 'metal')
    for sgn in (-1, 1):
        turbopump(sgn*0.50, 0, -0.52, 0.075, 0.28)
        tube([(sgn*0.50, 0, -0.38), (sgn*0.48, 0, -0.08)], 0.025, 'metal')
    bell(0.14, 0.56, -1.24, -h, 'vac', hoops=4, k=1.55)
    return finalize(pid)

def les(pid, x):
    new_part(pid, x)
    r, h = 0.625, 1.55
    # Base ring + central escape rocket column + top aerodynamic spike + 4 slanted abort nozzles
    lathe([(0.0, 0.0), (0.04, -0.18), (0.14, -0.38, 'h'), (0.16, -0.42, 'h'), (0.16, -1.22, 'h'), (0.22, -1.28)], 'white', 32)
    lathe([(0.0, 0.06), (0.03, 0.0), (0.04, -0.18)], 'red', 24)
    for zc in (-0.46, -0.78, -1.10):
        torus(0.165, 0.014, (0, 0, zc), 'red', seg=32)
    # 4 slanted escape nozzles near top
    for k in range(4):
        a = k*PI/2 + PI/4
        px, py = polar(a, 0.17)
        dx, dy = polar(a, 1.0)
        d = Vector((dx*0.55, dy*0.55, -0.82)).normalized()
        rot = d.to_track_quat('Z', 'Y').to_euler()
        cyl(0.055, 0.24, (px + dx*0.07, py + dy*0.07, -0.52), 'bell', rot=tuple(rot), verts=16, r2=0.095)
        cyl(0.048, 0.04, (px + dx*0.13, py + dy*0.13, -0.61), 'soot', rot=tuple(rot), verts=16)
    # Quad lattice tower struts down to capsule adapter ring
    lathe([(0.34, -1.46, 'h'), (0.38, -1.49, 'h'), (0.38, -h, 'h'), (0, -h)], 'dark', 40)
    bolts(16, 0.38, -1.52, 'gray', r=0.008, d=0.01)
    for k in range(4):
        a = k*PI/2
        p_top = (*polar(a, 0.15), -1.16)
        p_bot = (*polar(a, 0.35), -1.48)
        strut(p_top, p_bot, 0.022, 'metal', 8)
        p_mid = (*polar(a + PI/2, 0.15), -1.16)
        strut(p_bot, p_mid, 0.014, 'gray', 6)
    return finalize(pid)

def lander(pid, x):
    new_part(pid, x)
    r, h = 1.25, 1.85
    # Octagonal lunar lander cabin with gold Kapton & dark armor plates, forward tilted windows & docking hatch
    lathe([(0, 0), (0.58, 0, 'h'), (0.625, -0.05, 'h'), (0.625, -0.12)], 'dark', 48)
    bolts(24, 0.625, -0.06, 'gray', r=0.009, d=0.012)
    cyl(0.98, 1.08, (0, 0, -0.66), 'white', verts=8, bevel=0.035, smooth=False)
    cyl(1.01, 0.38, (0, 0, -1.02), 'gold', verts=8, bevel=0.02, smooth=False)
    lathe([(0.92, -1.20, 'h'), (r, -1.34, 'h'), (r, -h, 'h'), (0, -h)], 'dark', 64)
    torus(r + 0.005, 0.018, (0, 0, -1.36), 'gray', seg=64)
    bolts(36, r, -h + 0.06, 'gray', r=0.01, d=0.012)
    # 2 triangular/roundish lander observation windows + EVA hatch
    for sgn in (-1, 1):
        a = FRONT + sgn * 0.38
        on_surface_box((0.04, 0.34, 0.28), a, 0.91, -0.48, 0.18, 'dark', bevel=0.012)
        on_surface_box((0.025, 0.28, 0.22), a, 0.93, -0.48, 0.18, 'glass', bevel=0.006)
    on_surface_box((0.05, 0.38, 0.52), FRONT, 0.92, -0.92, 0, 'gray', bevel=0.012)
    on_surface_cyl(0.09, 0.04, FRONT, 0.95, -0.86, 0, 'dark', verts=20)
    # Side propellant spheres + antennas + RCS
    for sgn in (-1, 1):
        px, py = polar(sgn * PI/2, 1.02)
        sphere(0.22, (px, py, -0.78), 'gold', 20, 12)
        torus(0.222, 0.014, (px, py, -0.78), 'dark', seg=24)
    for k in range(4):
        rcs_quad(k*PI/2 + PI/4, 0.98, -0.32, 0.95)
    # High-gain dish on top-side
    cyl(0.018, 0.38, (0.52, 0.2, -0.02), 'metal', verts=8)
    lathe([(0.24, 0.22), (0.18, 0.17), (0.06, 0.14), (0, 0.13)], 'white', 24, loc=(0.52, 0.2, 0))
    return finalize(pid)

def shieldXL(pid, x):
    new_part(pid, x)
    h, r = 0.65, 1.38
    lathe([(0, 0), (1.25, 0, 'h'), (1.25, -0.12, 'h'), (r, -0.22, 'h'), (r*1.02, -0.34)], 'dark', 72)
    bolts(48, 1.25, -0.06, 'gray', r=0.011, d=0.014)
    lathe([(r*1.02, -0.34, 'h'), (r*0.96, -0.47), (r*0.78, -0.58), (r*0.44, -0.635), (0, -h)], 'shield', 72)
    torus(r*1.01, 0.022, (0, 0, -0.33), 'gold', seg=72)
    for k in range(12):
        a = k * PI / 6
        on_surface_box((0.03, 0.12, 0.1), a, r*0.96, -0.25, -0.35, 'gray', bevel=0.006)
    return finalize(pid)

def tankKugel_rad(pid, x):
    new_part(pid, x)
    r, h = 0.625, 1.5
    for z0 in (0, -h + 0.06):
        lathe([(r - 0.03, z0, 'h'), (r + 0.01, z0 - 0.01, 'h'), (r + 0.012, z0 - 0.05, 'h'), (r - 0.03, z0 - 0.06)], 'dark', 64)
        lathe([(r - 0.03, z0 - (0.003 if z0 == 0 else 0.057)), (0, z0 - (0.003 if z0 == 0 else 0.057))], 'dark', 32)
    lathe([(r*0.86, -0.06), (r*0.86, -h + 0.06)], 'dark', 48)
    # 6 spherical gold/white cryo tanks around central truss core
    for k in range(6):
        a = k * PI / 3
        px, py = polar(a, 0.48)
        for zz, mat_n in [(-0.44, 'gold'), (-1.06, 'white')]:
            sphere(0.28, (px, py, zz), mat_n, 24, 16)
            torus(0.282, 0.014, (px, py, zz), 'dark', seg=28)
        cyl(0.025, h - 0.2, (px*1.12, py*1.12, -h/2), 'metal', verts=10)
    torus(r + 0.02, 0.018, (0, 0, -h/2), 'gray', seg=64)
    return finalize(pid)

def tankXXL(pid, x):
    new_part(pid, x)
    r, h, rm = 1.25, 8.2, 0.12
    lathe([(r, -rm), (r, -h + rm)], 'tankXL', 72, name='skin')
    for z0 in (0, -h + rm):
        lathe([(r - 0.04, z0, 'h'), (r + 0.014, z0 - 0.02, 'h'), (r + 0.014, z0 - rm + 0.02, 'h'), (r - 0.04, z0 - rm)], 'dark', 72)
        lathe([(r - 0.04, z0 - (0.005 if z0 == 0 else rm - 0.005)), (0, z0 - (0.005 if z0 == 0 else rm - 0.005))], 'dark', 32)
        bolts(48, r + 0.014, z0 - rm/2, 'gray', r=0.01, d=0.014)
    # Saturn-style white & black Roll-pattern bands + intertank corrugated ring
    lathe([(r + 0.005, -1.2), (r + 0.005, -2.5)], 'white', 72)
    lathe([(r + 0.006, -3.5), (r + 0.006, -4.6)], 'dark', 72)
    for k in range(32):
        a = k * PI / 16
        on_surface_box((0.025, 0.08, 1.02), a, r + 0.012, -4.05, 0, 'gray', bevel=0.005)
    for zc in (-1.2, -2.5, -3.5, -4.6, -6.4):
        torus(r + 0.008, 0.016, (0, 0, zc), 'orange', seg=72)
    for a in (-0.4, -3.6):
        box((0.1, 0.24, h*0.88), (*polar(a, r + 0.04), -h/2), 'gray', rot=(0, 0, a), bevel=0.015)
    for a in (-2.6, -5.2):
        cyl(0.05, h*0.92, (*polar(a, r + 0.065), -h/2), 'metal', verts=12)
    return finalize(pid)

def kolibri(pid, x):
    new_part(pid, x)
    r, h = 0.625, 0.75
    thrust_plate(r, -0.05, bolt_n=20)
    for k in range(4):
        a = k*PI/2 + PI/4
        strut((*polar(a, r*0.68), -0.05), (*polar(a, 0.16), -0.22), 0.016, 'gray', 8)
    for k in range(4):
        a = k*PI/2
        px, py = polar(a, 0.36)
        sphere(0.095, (px, py, -0.17), 'gold', 16, 10)
    chamber(0.14, 0.09, -0.18, -0.34, m='metal')
    bell(0.09, 0.34, -0.34, -h, 'vac', hoops=2, k=1.5)
    return finalize(pid)

def falke(pid, x):
    new_part(pid, x)
    r, h = 0.625, 1.45
    lathe([(0, 0), (r, 0, 'h'), (r, -0.24, 'h'), (0.52, -0.40, 'h'), (0, -0.40)], 'dark', 64)
    torus(r + 0.004, 0.018, (0, 0, -0.12), 'gray', seg=64)
    bolts(28, r, -0.04, 'gray', r=0.009, d=0.012)
    for sgn in (-1, 1):
        px = sgn * 0.29
        chamber(0.19, 0.115, -0.38, -0.68, px, 0, 'gray')
        bell(0.115, 0.28, -0.68, -h, 'bell', x=px, y=0, hoops=2)
        turbopump(px, sgn*0.22, -0.56, 0.065, 0.24)
        tube([(px, sgn*0.22, -0.68), (px*0.85, sgn*0.16, -0.82), (px*0.72, 0, -0.78)], 0.02, 'metal')
        actuator((px*0.4, -0.28, -0.38), (px, -0.16, -0.64))
    cyl(0.09, 0.32, (0, 0, -0.52), 'metal', verts=16)
    return finalize(pid)

def aerospike(pid, x):
    new_part(pid, x)
    r, h = 0.625, 1.35
    lathe([(0, 0), (r, 0, 'h'), (r, -0.26, 'h'), (0.58, -0.38, 'h'), (0.58, -0.48, 'h'), (0, -0.48)], 'dark', 64)
    bolts(32, r, -0.04, 'gray', r=0.009, d=0.012)
    torus(0.55, 0.055, (0, 0, -0.46), 'vac', seg=48, mseg=12)
    # 12 mini combustor thrusters ringing the toroidal cowl
    for k in range(12):
        a = k * PI / 6
        px, py = polar(a, 0.50)
        cyl(0.048, 0.18, (px, py, -0.42), 'metal', verts=12, r2=0.036)
        tube([(*polar(a, 0.56), -0.26), (px, py, -0.36)], 0.014, 'gold', res=4)
    # Central truncated conical / parabolic aerospike plug
    pts = [(0.46 * ((1 - i/14) ** 0.72) + 0.06, -0.46 - (h - 0.46)*(i/14)) for i in range(15)]
    pts.append((0, -h))
    lathe(pts, 'bell', 56)
    lathe([(0.14, -h + 0.005), (0, -h + 0.005)], 'soot', 32)
    for zc in (-0.65, -0.88, -1.10):
        t = (-zc - 0.46) / (h - 0.46)
        rr = 0.46 * ((1 - t) ** 0.72) + 0.06
        torus(rr + 0.004, 0.012, (0, 0, zc), 'dark', seg=48)
    return finalize(pid)

def plasma(pid, x):
    new_part(pid, x)
    r, h = 0.625, 1.55
    lathe([(0, 0), (r, 0, 'h'), (r, -0.18, 'h'), (0.52, -0.36, 'h'), (0.48, -1.12, 'h'), (0, -1.12)], 'dark', 64)
    bolts(28, r, -0.04, 'gray', r=0.009, d=0.012)
    # 3 superconducting magnetic solenoids + glowing blue/cyan plasma core
    for zc in (-0.48, -0.74, -1.00):
        torus(0.50, 0.055, (0, 0, zc), 'gold', seg=48, mseg=12)
        torus(0.54, 0.018, (0, 0, zc), 'metal', seg=48)
    lathe([(0.49, -0.38), (0.49, -1.08)], 'ion', 48)
    for k in range(6):
        a = k * PI / 3
        px, py = polar(a, 0.54)
        cyl(0.028, 0.82, (px, py, -0.72), 'gray', verts=10)
        on_surface_box((0.05, 0.12, 0.18), a + PI/6, 0.50, -0.26, 0, 'metal', bevel=0.008)
    # Magnetic nozzle bell with glowing plasma liner
    bell(0.24, 0.54, -1.10, -h, 'metal', hoops=3, k=1.35)
    for rr, zc in [(0.48, -h + 0.03), (0.38, -h + 0.14), (0.30, -h + 0.25)]:
        torus(rr, 0.016, (0, 0, zc), 'ion', seg=40)
    return finalize(pid)

def titan(pid, x):
    new_part(pid, x)
    r, h = 1.25, 3.1
    lathe([(0, 0), (r, 0, 'h'), (r, -0.52, 'h'), (r*0.92, -0.76, 'h'), (0, -0.76)], 'dark', 72)
    torus(r + 0.005, 0.028, (0, 0, -0.26), 'gold', seg=72)
    bolts(48, r, -0.05, 'gray', r=0.012, d=0.014)
    for k in range(16):
        on_surface_box((0.03, 0.09, 0.28), k*PI/8, r + 0.006, -0.38, 0, 'gray', bevel=0.006)
    # Saturn V F-1 / SpaceX Raptor cluster: 1 center + 4 outer high-expansion bells
    nozs = [(0, 0, 0.17, 0.48)] + [(*polar(k*PI/2 + PI/4, 0.68), 0.15, 0.44) for k in range(4)]
    for (px, py, rT, rE) in nozs:
        chamber(rT*1.65, rT, -0.72, -1.24, px, py, 'gray')
        bell(rT, rE, -1.24, -h, 'vac', x=px, y=py, hoops=4, k=1.5)
        if px != 0 or py != 0:
            d = Vector((px, py, 0)).normalized()
            turbopump(px + d.x*0.24, py + d.y*0.24, -1.02, 0.085, 0.38)
            tube([(px + d.x*0.24, py + d.y*0.24, -1.22), (px + d.x*0.32, py + d.y*0.32, -1.55), (px + d.x*0.26, py + d.y*0.26, -1.85)], 0.032, 'metal')
            actuator((px*0.55, py*0.55, -0.74), (px - d.x*0.18, py - d.y*0.18, -1.16))
    return finalize(pid)

def srbXL(pid, x):
    return srb(pid, x, 9.2, 8, True)

def decXL(pid, x):
    new_part(pid, x)
    r, h = 1.25, 0.5
    for z0 in (0, -h + 0.07):
        lathe([(r - 0.04, z0, 'h'), (r + 0.014, z0 - 0.01, 'h'), (r + 0.018, z0 - 0.035, 'h'), (r + 0.014, z0 - 0.06, 'h'), (r - 0.04, z0 - 0.07)], 'dark', 72)
        lathe([(r - 0.04, z0 - (0.004 if z0 == 0 else 0.066)), (0, z0 - (0.004 if z0 == 0 else 0.066))], 'dark', 32)
    lathe([(r, -0.07), (r, -h + 0.07)], 'hazard', 72)
    torus(r + 0.006, 0.014, (0, 0, -h/2), 'black', seg=72)
    for k in range(8):
        a = k*PI/4
        on_surface_box((0.05, 0.14, 0.34), a, r + 0.025, -h/2, 0, 'dark', bevel=0.01)
        on_surface_cyl(0.028, 0.06, a, r + 0.06, -h/2 + 0.09, 0, 'metal', verts=8)
        on_surface_cyl(0.028, 0.06, a, r + 0.06, -h/2 - 0.09, 0, 'metal', verts=8)
    return finalize(pid)

def gridfins(pid, x):
    new_part(pid, x)
    r, h = 0.625, 0.8
    for z0 in (0, -h + 0.05):
        lathe([(r - 0.03, z0, 'h'), (r + 0.01, z0 - 0.01, 'h'), (r + 0.012, z0 - 0.04, 'h'), (r - 0.03, z0 - 0.05)], 'dark', 64)
        lathe([(r - 0.03, z0 - (0.003 if z0 == 0 else 0.047)), (0, z0 - (0.003 if z0 == 0 else 0.047))], 'dark', 32)
    lathe([(r, -0.05), (r, -h + 0.05)], 'white', 64)
    # 4 deployed titanium waffle grid fins
    for k in range(4):
        a = k*PI/2 + PI/4
        ca, sa = math.cos(a), math.sin(a)
        tx, ty = -sa, ca
        on_surface_box((0.1, 0.18, 0.38), a, r + 0.03, -h/2, 0, 'dark', bevel=0.012)
        wR, wT = 0.62, 0.46
        rc = r + 0.08 + wR/2
        # Outer frame
        on_surface_box((wR, wT, 0.07), a, rc, -h/2, 0, 'gray', bevel=0.006)
        # Inner lattice bars
        for i in (-1, 0, 1):
            off = i * (wT * 0.28)
            bx = ca * rc + tx * off
            by = sa * rc + ty * off
            box((wR - 0.04, 0.018, 0.065), (bx, by, -h/2), 'dark', rot=(0, 0, a), bevel=0.002)
        for j in (0.28, 0.52, 0.76):
            rr = r + 0.08 + wR * j
            on_surface_box((0.018, wT - 0.04, 0.065), a, rr, -h/2, 0, 'dark', bevel=0.002)
    return finalize(pid)

def rtg(pid, x):
    new_part(pid, x)
    r, h = 0.625, 0.65
    for z0 in (0, -h + 0.05):
        lathe([(r - 0.03, z0, 'h'), (r + 0.01, z0 - 0.01, 'h'), (r + 0.012, z0 - 0.04, 'h'), (r - 0.03, z0 - 0.05)], 'dark', 64)
        lathe([(r - 0.03, z0 - (0.003 if z0 == 0 else 0.047)), (0, z0 - (0.003 if z0 == 0 else 0.047))], 'dark', 32)
    lathe([(r, -0.05), (r, -h + 0.05)], 'dark', 64)
    torus(r + 0.005, 0.014, (0, 0, -h/2), 'gold', seg=64)
    # 2 slanted RTG plutonium cylinder canisters with radiator fins + 4 RCS quads
    for sgn in (-1, 1):
        a = sgn * PI/2
        on_surface_box((0.08, 0.16, 0.24), a, r + 0.02, -h/2, 0, 'gray', bevel=0.008)
        cx = 0
        cy = sgn * (r + 0.28)
        cyl(0.085, 0.52, (cx, cy, -h/2), 'dark', rot=(sgn*1.15, 0, 0), verts=16)
        cyl(0.092, 0.12, (cx, cy + sgn*0.18, -h/2 + 0.08), 'hazard', rot=(sgn*1.15, 0, 0), verts=16)
        for fk in range(6):
            fa = fk * PI / 3
            box((0.24, 0.014, 0.44), (cx, cy, -h/2), 'gold', rot=(sgn*1.15, 0, fa), bevel=0.002)
    for k in range(4):
        rcs_quad(k*PI/2 + PI/4, r, -h/2, 0.85)
    return finalize(pid)

def build_all():
    out = {}
    X = 0
    for pid, fn in [('pod', lambda p, x: pod(p, x, False)), ('pod2', lambda p, x: pod(p, x, True)), ('lander', lander), ('probe', probe),
                    ('les', les), ('chute', chute), ('nose', nose), ('shield', shield), ('shieldXL', shieldXL),
                    ('tankS', lambda p, x: tank(p, x, 1.2)), ('tankM', lambda p, x: tank(p, x, 2.3)), ('tankL', lambda p, x: tank(p, x, 4.4)),
                    ('tankRad', tankKugel_rad), ('adapt', adapt), ('tankXL', lambda p, x: tank(p, x, 5.6, 1.25, True)), ('tankXXL', tankXXL),
                    ('kolibri', kolibri), ('funke', funke), ('donner', donner), ('falke', falke), ('vak', vak),
                    ('aerospike', aerospike), ('nuke', nuke), ('ion', ion), ('plasma', plasma), ('mammut', mammut), ('titan', titan),
                    ('srbS', lambda p, x: srb(p, x, 3.4, 3, False)), ('srbL', lambda p, x: srb(p, x, 7.0, 6, True)), ('srbXL', srbXL),
                    ('dec', dec), ('decXL', decXL), ('fins', fins), ('gridfins', gridfins), ('legs', legs), ('solar', solar), ('rtg', rtg)]:
        out[pid] = fn(pid, X)[:2]
        X += 3.2
    return out
