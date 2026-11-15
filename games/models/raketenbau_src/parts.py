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

def build_all():
    out = {}
    X = 0
    for pid, fn in [('pod', lambda p, x: pod(p, x, False)), ('pod2', lambda p, x: pod(p, x, True)), ('chute', chute),
                    ('tankS', lambda p, x: tank(p, x, 1.2)), ('tankM', lambda p, x: tank(p, x, 2.3)), ('tankL', lambda p, x: tank(p, x, 4.4)),
                    ('tankXL', lambda p, x: tank(p, x, 5.6, 1.25, True)), ('funke', funke), ('donner', donner), ('vak', vak), ('mammut', mammut),
                    ('srbS', lambda p, x: srb(p, x, 3.4, 3, False)), ('srbL', lambda p, x: srb(p, x, 7.0, 6, True)), ('dec', dec), ('fins', fins)]:
        out[pid] = fn(pid, X)[:2]
        X += 3.2
    return out
