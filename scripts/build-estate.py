"""Illustrative coastal study, NOT a measured reconstruction.

Blender 3.6: --background --factory-startup --python scripts/build-estate.py
Original property modeling with OSM/DEM surroundings. Sources and unknowns: docs/estate-3d.md.
"""
import math
import random
import json
from pathlib import Path

import bpy
import bmesh
from mathutils import Vector, noise

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/models"
OUT.mkdir(parents=True, exist_ok=True)
SOURCE = ROOT / "artifacts/estate"
SOURCE.mkdir(parents=True, exist_ok=True)
random.seed(18)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)


def material(name, color, roughness=.85):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


rock = [material("Limestone%02d" % i, (.30+i*.039, .32+i*.038, .33+i*.037)) for i in range(5)]
cliff = material("Limestone cliff", (.53, .55, .56))
texture_dir = OUT / "textures"
for filename, socket in [("cliff-color.jpg", "Base Color"), ("cliff-roughness.jpg", "Roughness")]:
    tex = cliff.node_tree.nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(str(texture_dir / filename))
    if socket != "Base Color":
        tex.image.colorspace_settings.name = "Non-Color"
    cliff.node_tree.links.new(tex.outputs["Color"], cliff.node_tree.nodes.get("Principled BSDF").inputs[socket])
normal_tex = cliff.node_tree.nodes.new("ShaderNodeTexImage")
normal_tex.image = bpy.data.images.load(str(texture_dir / "cliff-normal.jpg"))
normal_tex.image.colorspace_settings.name = "Non-Color"
normal_node = cliff.node_tree.nodes.new("ShaderNodeNormalMap")
normal_node.inputs["Strength"].default_value = .85
cliff.node_tree.links.new(normal_tex.outputs["Color"], normal_node.inputs["Color"])
cliff.node_tree.links.new(normal_node.outputs["Normal"], cliff.node_tree.nodes.get("Principled BSDF").inputs["Normal"])
height_image = bpy.data.images.load(str(texture_dir / "cliff-height.jpg"))
height_image.colorspace_settings.name = "Non-Color"
HEIGHT_W, HEIGHT_H = height_image.size
HEIGHT_PIXELS = list(height_image.pixels)

plaster = material("Warm lime plaster", (.84, .85, .82))
terrace = material("Pale terrace stone", (.57, .56, .51))
steps = material("Stair treads", (.82, .79, .70))
path_gold = material("Illustrative route", (.89, .49, .16))
roof = material("Flat roof coping", (.72, .72, .67))
shutter = material("Deep green shutters", (.075, .19, .16))
glass = material("Recessed blue windows", (.055, .16, .2), .28)
wood = material("Pergola wood", (.27, .20, .12))
leaves = [material("Mediterranean foliage%02d" % i, (.075+i*.027, .14+i*.032, .048+i*.025)) for i in range(5)]
olive = material("Olive silver foliage", (.24,.29,.17))
pink = material("Bougainvillea", (.54, .095, .24))
lemon = material("Lemons", (.88, .61, .07))
pebble = material("Pebble beach", (.36, .36, .34))
pool_mat = material("Pool water", (.055, .47, .52), .22)
white = material("Parasol canvas", (.96, .92, .80))
blue = material("Sunbed blue", (.12, .30, .45))
rail = material("Painted sea blue railings", (.06,.25,.31),.58)
terracotta = material("Terracotta pots",(.43,.19,.105))
tile_yellow = material("Ochre terrace tile",(.69,.43,.16),.48)
tile_blue = material("Cobalt terrace tile",(.12,.24,.37),.48)
reed = material("Reed pergola canopy",(.47,.37,.22))

# Photographic CC0 needle twig atlas, sampled only within the upper-left twig.
pine_needle=material("Pine needle cutout",(.8,.92,.64),.85)
pine_needle.blend_method="CLIP"
pine_needle.alpha_threshold=.42
pine_needle.use_backface_culling=False
for filename,socket in [("pine-color.jpg","Base Color"),("pine-alpha.jpg","Alpha")]:
    tex=pine_needle.node_tree.nodes.new("ShaderNodeTexImage")
    tex.image=bpy.data.images.load(str(texture_dir/filename))
    if socket=="Alpha":
        tex.image.colorspace_settings.name="Non-Color"
    pine_needle.node_tree.links.new(tex.outputs["Color"],pine_needle.node_tree.nodes.get("Principled BSDF").inputs[socket])
    if socket=="Base Color":
        pine_needle.node_tree.links.new(tex.outputs["Color"],pine_needle.node_tree.nodes.get("Principled BSDF").inputs["Emission"])
pine_needle.node_tree.nodes.get("Principled BSDF").inputs["Emission Strength"].default_value=.12

leaf_spray=material("Broadleaf branch cutout",(.7,.8,.6),.88)
leaf_spray.blend_method="CLIP"
leaf_spray.alpha_threshold=.42
leaf_spray.use_backface_culling=False
for filename,socket in [("leaves-color.jpg","Base Color"),("leaves-alpha.jpg","Alpha")]:
    tex=leaf_spray.node_tree.nodes.new("ShaderNodeTexImage")
    tex.image=bpy.data.images.load(str(texture_dir/filename))
    if socket=="Alpha":
        tex.image.colorspace_settings.name="Non-Color"
    leaf_spray.node_tree.links.new(tex.outputs["Color"],leaf_spray.node_tree.nodes.get("Principled BSDF").inputs[socket])
    if socket=="Base Color":
        leaf_spray.node_tree.links.new(tex.outputs["Color"],leaf_spray.node_tree.nodes.get("Principled BSDF").inputs["Emission"])
leaf_spray.node_tree.nodes.get("Principled BSDF").inputs["Emission Strength"].default_value=.12


def finish(obj, name, mat):
    obj.name = name
    obj.data.materials.append(mat)
    return obj


def cube(name, location, size, mat, bevel=0):
    mesh=bpy.data.meshes.new(name)
    x,y,z=(value/2 for value in size)
    mesh.from_pydata([(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),
                      (-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)],[],
                     [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])
    mesh.update()
    obj=bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(obj)
    obj.location=location
    finish(obj, name, mat)
    if bevel:
        bpy.context.view_layer.objects.active=obj
        modifier = obj.modifiers.new("Soft stone edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 1
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        obj.data.use_auto_smooth = True
        weighted = obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
        bpy.ops.object.modifier_apply(modifier=weighted.name)
    return obj


ICO_MESHES={}
def ellipsoid(name, location, size, mat, detail=1):
    if detail not in ICO_MESHES:
        bm=bmesh.new()
        bmesh.ops.create_icosphere(bm,subdivisions=detail,radius=1)
        mesh=bpy.data.meshes.new("Icosphere template")
        bm.to_mesh(mesh)
        bm.free()
        ICO_MESHES[detail]=mesh
    obj=bpy.data.objects.new(name,ICO_MESHES[detail].copy())
    bpy.context.collection.objects.link(obj)
    obj.location=location
    obj.scale = size
    finish(obj, name, mat)
    for face in obj.data.polygons:
        face.use_smooth = True
    return obj


def beam(name, a, b, radius, mat, vertices=6):
    direction = Vector(b) - Vector(a)
    points=[]
    for z in (-direction.length/2,direction.length/2):
        points.extend([(math.cos(i*math.tau/vertices)*radius,math.sin(i*math.tau/vertices)*radius,z) for i in range(vertices)])
    faces=[tuple(reversed(range(vertices))),tuple(range(vertices,vertices*2))]
    faces.extend([(i,(i+1)%vertices,(i+1)%vertices+vertices,i+vertices) for i in range(vertices)])
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(points,[],faces)
    mesh.update()
    obj=bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(obj)
    obj.location=(Vector(a)+Vector(b))/2
    obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    return finish(obj, name, mat)


def height_sample(u, v):
    """Repeat a real CC0 height map. Displacement is baked into exported vertices."""
    x, y = (u % 1) * (HEIGHT_W-1), (v % 1) * (HEIGHT_H-1)
    ix, iy = int(x), int(y)
    tx, ty = x-ix, y-iy
    def at(a,b):
        return HEIGHT_PIXELS[(b * HEIGHT_W + a) * 4]
    return ((at(ix,iy)*(1-tx)+at(min(ix+1,HEIGHT_W-1),iy)*tx)*(1-ty)
            +(at(ix,min(iy+1,HEIGHT_H-1))*(1-tx)+at(min(ix+1,HEIGHT_W-1),min(iy+1,HEIGHT_H-1))*tx)*ty)


def stone_surface(obj, strength=.8):
    """World-scale box UVs; triplanar height sampling avoids displacement seams."""
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    mesh = obj.data
    mesh.update()
    normals=[vertex.normal.copy() for vertex in mesh.vertices]
    transform=obj.matrix_world.copy()
    for vertex,n in zip(mesh.vertices,normals):
        p = transform @ vertex.co
        weights = [abs(n[k])**4 for k in range(3)]
        denom = sum(weights) or 1
        h = (height_sample(p.y/18,p.z/18)*weights[0]
             +height_sample(p.x/18,p.z/18)*weights[1]
             +height_sample(p.x/18,p.y/18)*weights[2])/denom
        vertex.co += n * (h-.5) * strength
    mesh.update()
    uv = mesh.uv_layers.new(name="Stone world scale 18m")
    for face in mesh.polygons:
        axis = max(range(3), key=lambda k: abs(face.normal[k]))
        for loop_index in face.loop_indices:
            p = transform @ mesh.vertices[mesh.loops[loop_index].vertex_index].co
            uv.data[loop_index].uv = ((p.y if axis == 0 else p.x)/18, (p.y if axis == 2 else p.z)/18)
        face.use_smooth = True
    obj.select_set(False)
    return obj


def elevation(y):
    knots = [(-30, 0), (-24, 2), (-16, 11), (-6, 23), (8, 33), (24, 46), (42, 61), (66, 73)]
    for (a, za), (b, zb) in zip(knots, knots[1:]):
        if a <= y <= b:
            return za + (zb-za)*(y-a)/(b-a)
    return 0 if y < -30 else 73


# Connected coastal hillside: dense near the property, continuing inland rather than a floating island.
def shoreline_offset(x):
    """Continuous coastal inlets outside the property; the access cove stays fixed."""
    distance=max(0,-52-x,x-54)
    fade=1-math.exp(-distance/42)
    return fade*(9*math.sin(x*.031)+5*math.sin(x*.073)+max(0,x-54)*.065)


context_dir = SOURCE / "context"
geo = json.loads((context_dir / "positano-osm.json").read_text())
# The business pin is at the road, not at the middle of the descending gardens.
# Put the study's origin 60 m seaward of it; never move the mapped road to fit a model.
origin_lat, origin_lon = 40.6277721-60/111320, 14.4937307
metres_lon = 111320 * math.cos(math.radians(origin_lat))


def local_point(point):
    return ((point["lon"]-origin_lon)*metres_lon, (point["lat"]-origin_lat)*111320)


coast = []
for item in geo["elements"]:
    if item["tags"].get("natural") == "coastline":
        coast.extend(local_point(p) for p in item["geometry"])
coast.sort()
assert len(coast) > 20, "Missing OSM coastline"


def coast_y(x):
    for a, b in zip(coast, coast[1:]):
        if a[0] <= x <= b[0] and b[0] > a[0]:
            return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])
    return coast[0][1] if x < coast[0][0] else coast[-1][1]


dem_tiles = {}
for tile_x in (2212, 2213):
    tile = bpy.data.images.load(str(context_dir / f"terrain-12-{tile_x}-1541.png"))
    tile.colorspace_settings.name = "Non-Color"
    dem_tiles[tile_x] = (tile.size[0], list(tile.pixels))


def dem_height(x, y):
    lat, lon = origin_lat+y/111320, origin_lon+x/metres_lon
    u = (lon+180)/360*4096
    v = (1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*4096-1541
    tile_x = math.floor(u)
    assert tile_x in dem_tiles and 0 <= v < 1, "Context extends beyond downloaded DEM"
    size, pixels = dem_tiles[tile_x]
    px, py = (u-tile_x)*size-.5, v*size-.5
    ix, iy = math.floor(px), math.floor(py)
    def sample(a, b):
        index = ((size-1-max(0,min(size-1,b)))*size+max(0,min(size-1,a)))*4
        r,g,b = pixels[index:index+3]
        return (r*256+g+b/256)*255-32768
    tx, ty = px-ix, py-iy
    return ((sample(ix,iy)*(1-tx)+sample(ix+1,iy)*tx)*(1-ty)
            +(sample(ix,iy+1)*(1-tx)+sample(ix+1,iy+1)*tx)*ty)


def geographic_height(x,y):
    shore=coast_y(x)
    if y<shore:
        return -max(2,(shore-y)*.22)
    # The former 28 m shore ramp erased the limestone cliff fronts.
    return max(0,dem_height(x,y))*min(1,(y-shore)/6)


def ground_height(x,y):
    if y > 66:
        z = 73 + (y-66)*.53 + noise.fractal(Vector((x*.024,y*.021,1.7)),1,2,3)*8
    else:
        n = noise.fractal(Vector((x*.064,y*.060,1.7)),1,2,4)
        coastal_y=y-shoreline_offset(x)*max(0,min(1,(18-y)/35))
        z = elevation(coastal_y) + n*1.7
    # Interpret the flanking gullies visible in the references, not measured walls.
    # Keep the central stair/building corridor unchanged until the owner supplies footage.
    if abs(x)>43:
        west=-60+.10*y
        east=67+.18*y
        valley=math.exp(-((x-west)/11)**2)+math.exp(-((x-east)/13)**2)
        fade=max(0,min(1,(abs(x)-43)/13))*max(0,min(1,(y+25)/35))
        z=max(-1,z-valley*min(33,10+max(0,y)*.24)*fade)
    if abs(x) < 31 and y<=66:
        z = min(z,elevation(y)-.2)
    # Continuous cut-and-fill ground beneath the terraces, not suspended building slabs.
    for px,py,w,d in [(-23,43,22,15),(23,32,18,14),(-25,21,17,13),(28,12,15,13),(-22,-2,21,12)]:
        outside=max(abs(x-px)-w/2,abs(y-py)-d/2,0)
        if outside < 1.8:
            mix=max(0,1-outside/1.8)
            z=z*(1-mix)+(elevation(py)-.35)*mix
    for px,py,w in [(-30,34,22),(29,23,18),(-31,10,21),(27,1,21),(-31,52,23),(28,46,20)]:
        if abs(x-px)<w/2 and py<y<py+2.5:
            z=elevation(py)-.2
    # Keep the illustrative property untouched; reach real geography before the outer mesh edge.
    blend=min(1,math.hypot(max(0,abs(x)-62),max(0,y-66))/100)
    if blend:
        blend=blend*blend*(3-2*blend)
        z=z*(1-blend)+geographic_height(x,y)*blend
    return z


assert all(abs(ground_height(x,y)-geographic_height(x,y))<1e-6
           for x,y in [(-174,0),(174,0),(-174,234.6),(0,234.6),(174,234.6)]), "Near terrain does not reach regional DEM"


verts, faces = [], []
# One welded nonuniform grid avoids cracks where high-detail terrain meets the wider coast.
xs=[-174+i*5.6 for i in range(20)]+[-62+i*124/140 for i in range(141)]+[67.6+i*5.6 for i in range(20)]
ys=[-34+j*112/132 for j in range(133)]+[83.8+j*5.8 for j in range(27)]
NX,NY=len(xs),len(ys)
for j,y in enumerate(ys):
    for i,x in enumerate(xs):
        z = ground_height(x,y)
        if y < -29:
            z -= (-29-y)*1.1
        verts.append((x, y, z))
for j in range(NY-1):
    for i in range(NX-1):
        a = j*NX+i
        faces += [(a,a+1,a+NX), (a+1,a+NX+1,a+NX)]
mesh = bpy.data.meshes.new("Coastal escarpment")
mesh.from_pydata(verts, [], faces)
mesh.update()
terrain = bpy.data.objects.new("Rocky headland", mesh)
bpy.context.collection.objects.link(terrain)
mesh.materials.append(cliff)
stone_surface(terrain,1.45)

# One exported material and continuous vertex color, never a per-triangle switch.
def terrain_tone(p):
    """Sample the same world-space field on both sides of the terrain seam."""
    slope=math.hypot(ground_height(p.x+3,p.y)-ground_height(p.x-3,p.y),
                     ground_height(p.x,p.y+3)-ground_height(p.x,p.y-3))/6
    vegetation=max(0,min(1,(1/math.sqrt(1+slope*slope)-.50)/.36))
    vegetation=vegetation*vegetation*(3-2*vegetation)
    coast=max(0,min(1,(p.y-coast_y(p.x)-8)/42))
    vegetation*=coast*coast*(3-2*coast)
    variation=.80+.14*noise.noise_vector(p*.018).x+.06*noise.noise_vector(p*.13).x
    wet=.40+.60*max(0,min(1,p.z/2))
    tint=tuple(rock*(1-vegetation)+green*vegetation
               for rock,green in zip((.82,.86,.90),(.23,.40,.16)))
    return (*(value*variation*wet for value in tint),1)


ground_colors=mesh.color_attributes.new(name="Terrain tone",type="FLOAT_COLOR",domain="CORNER")
vertex_tones=[terrain_tone(vertex.co) for vertex in mesh.vertices]
for loop in mesh.loops:
    ground_colors.data[loop.index].color=vertex_tones[loop.vertex_index]
terrain_cliff=cliff.copy()
terrain_cliff.name="Limestone headland"
mesh.materials[0]=terrain_cliff
base=terrain_cliff.node_tree.nodes.get("Principled BSDF").inputs["Base Color"]
source=base.links[0].from_socket
color_node=terrain_cliff.node_tree.nodes.new("ShaderNodeVertexColor")
color_node.layer_name="Terrain tone"
multiply=terrain_cliff.node_tree.nodes.new("ShaderNodeMixRGB")
multiply.blend_type="MULTIPLY"
multiply.inputs[0].default_value=1
terrain_cliff.node_tree.links.new(source,multiply.inputs[1])
terrain_cliff.node_tree.links.new(color_node.outputs["Color"],multiply.inputs[2])
terrain_cliff.node_tree.links.new(multiply.outputs[0],base)

# Lower layered buttresses share the hillside; no isolated rounded monoliths above the cottages.
weathered_cliff=cliff.copy()
weathered_cliff.name="Weathered coastal limestone"
weather_color=weathered_cliff.node_tree.nodes.new("ShaderNodeVertexColor")
weather_color.layer_name="Rock weathering"
weather_mix=weathered_cliff.node_tree.nodes.new("ShaderNodeMixRGB")
weather_mix.blend_type="MULTIPLY"
weather_mix.inputs[0].default_value=1
weather_base=weathered_cliff.node_tree.nodes.get("Principled BSDF").inputs["Base Color"]
weathered_cliff.node_tree.links.new(weather_base.links[0].from_socket,weather_mix.inputs[1])
weathered_cliff.node_tree.links.new(weather_color.outputs["Color"],weather_mix.inputs[2])
weathered_cliff.node_tree.links.new(weather_mix.outputs[0],weather_base)
for x,y,z,sx,sy,sz in [(31,-17,4.5,13.5,11,9),(36,-1,16,12,14,11),(-33,-11,8,8,10,10),
                      (40,16,31,10,13,9),(-38,21,28,8,12,10),(-40,48,46,8,14,13)]:
    obj = ellipsoid("Coastal limestone", (x,y,z), (sx,sy,sz), weathered_cliff, 4)
    for vertex in obj.data.vertices:
        p=vertex.co
        # Squared, stratified fronts with softened corners; the top retreats into the slope.
        p.x=math.copysign(abs(p.x)**.69,p.x)
        p.y=math.copysign(abs(p.y)**.78,p.y)+max(0,p.z)*.23
        p.z=math.copysign(abs(p.z)**.78,p.z)
        p*=1+.045*noise.fractal(p*3.2,1,2,3)
        p.y+=.045*math.sin(p.z*14+p.x*2)
    stone_surface(obj,1.15)
    colors=obj.data.color_attributes.new(name="Rock weathering",type="FLOAT_COLOR",domain="CORNER")
    for loop in obj.data.loops:
        p=obj.matrix_world@obj.data.vertices[loop.vertex_index].co
        wet=max(0,min(1,(p.z+.2)/1.8))
        colors.data[loop.index].color=(.31+.48*wet,.34+.49*wet,.30+.57*wet,1)


def terrace_pad(x, y, width, depth):
    z = elevation(y)
    wall_height=max(4,z-elevation(y-depth/2)+.7)
    wall=cube("Terraced retaining wall", (x,y,z-wall_height/2), (width,depth,wall_height), cliff, .15)
    stone_surface(wall,.10)
    # Irregular rubble courses in the exposed sea-facing retaining wall.
    rows=math.ceil(wall_height/.75)
    for row in range(rows):
        cursor=x-width/2
        while cursor<x+width/2:
            block_width=min(random.uniform(.75,1.8),x+width/2-cursor)
            cube("Retaining wall stone",(cursor+block_width/2,y-depth/2-.06,z-wall_height+.4+row*.72),
                 (max(.12,block_width-.065),random.uniform(.12,.28),random.uniform(.56,.69)),random.choice(rock),.08)
            cursor+=block_width
    cube("Terrace paving", (x,y,z+.11), (width+.22,depth+.22,.22), terrace, .075)
    cube("Retaining wall stone coping",(x,y-depth/2-.09,z+.27),(width+.35,.55,.18),roof,.06)
    return z+.32


def plastered_volume(x,y,z,w,d,h,door=False):
    """Thick front walls with real reveals; no painted-on windows or expensive booleans."""
    assert w>1.8 and d>.5 and h>2.5, "Cottage volume must leave room for full-height openings"
    front=y-d/2
    reveal=.38
    cube("Limewashed cottage core",(x,y+reveal/2,z+h/2),(w,d-reveal,h),plaster,.07)
    bays=max(1,int(w/3.1))
    centers=[x-w/2+(i+.5)*w/bays for i in range(bays)]
    cursor=x-w/2
    for i,wx in enumerate(centers):
        entry=door and i==0
        opening_width=1.05 if entry else 1.18
        bottom=0 if entry else .94
        top=2.38 if entry else 2.50
        left,right=wx-opening_width/2,wx+opening_width/2
        assert left>cursor and right<x+w/2, "Facade openings must leave load-bearing piers"
        cube("Lime wall pier",((cursor+left)/2,front+reveal/2,z+h/2),(left-cursor,reveal,h),plaster,.025)
        if bottom:
            cube("Wall below window",(wx,front+reveal/2,z+bottom/2),(opening_width,reveal,bottom),plaster,.025)
        cube("Window lintel",(wx,front+reveal/2,z+(top+h)/2),(opening_width,reveal,h-top),plaster,.025)
        cube("Recessed entrance" if entry else "Recessed glazed window",
             (wx,front+reveal-.035,z+(bottom+top)/2),(opening_width-.06,.055,top-bottom-.05),
             shutter if entry else glass)
        cube("Stone threshold" if entry else "Projecting window sill",
             (wx,front-.09,z+bottom+.025),(opening_width+.20,.50,.09),roof,.025)
        if entry:
            cube("Door timber rail",(wx,front+reveal-.07,z+1.02),(opening_width-.08,.055,.085),wood)
        else:
            for side in (-1,1):
                sx=wx+side*(opening_width/2+.31)
                cube("Open green shutter",(sx,front-.055,z+(bottom+top)/2),(.49,.13,top-bottom),shutter,.015)
                for slat in range(6):
                    cube("Louvered shutter slat",(sx,front-.13,z+bottom+.16+slat*.235),(.42,.06,.055),wood)
            beam("Window vertical frame",(wx,front+reveal-.09,z+bottom+.07),
                 (wx,front+reveal-.09,z+top-.07),.025,white,4)
        cube("Slim shade above opening",(wx,front-.19,z+top+.13),(opening_width+.45,.52,.08),roof,.025)
        cursor=right
    cube("Lime wall end pier",((cursor+x+w/2)/2,front+reveal/2,z+h/2),(x+w/2-cursor,reveal,h),plaster,.025)
    cube("Shallow flat roof coping",(x,y,z+h+.095),(w+.28,d+.28,.19),roof,.07)
    for side in (-1,1):
        cube("Low roof parapet",(x+side*(w/2-.13),y,z+h+.38),(.24,d,.48),plaster,.04)
    cube("Low rear parapet",(x,y+d/2-.13,z+h+.38),(w,.24,.48),plaster,.04)
    for sx in (-w/2+.23,w/2-.23):
        beam("Terrace drainpipe",(x+sx,front-.03,z+.15),(x+sx,front-.03,z+h-.10),.045,roof,6)


def terrace_chair(x,y,z):
    cube("Folding chair blue seat",(x,y,z+.46),(.46,.45,.075),tile_blue,.025)
    cube("Folding chair blue back",(x,y+.22,z+.78),(.46,.045,.33),tile_blue,.015)
    for side in (-1,1):
        sx=x+side*.22
        beam("Folding chair frame",(sx,y-.23,z+.02),(sx,y+.22,z+.93),.023,white,4)
        beam("Folding chair crossed leg",(sx,y+.23,z+.02),(sx,y-.20,z+.47),.023,white,4)


def villa(x,y,w,d,kind):
    z=terrace_pad(x,y,w+6,d+6)
    # These silhouettes stay inside the original illustrative footprint; they are not surveyed wings.
    if kind=="setback":
        plastered_volume(x,y,z,w,d,3.25,True)
        plastered_volume(x-.65,y+.65,z+3.46,w-1.7,d-1.3,3.15)
        cube("Upper setback front coping",(x,y-d/2-.02,z+3.73),(w+.2,.26,.46),plaster,.04)
    elif kind=="loggia":
        plastered_volume(x-w*.13,y+.50,z,w*.74,d-1,3.45,True)
        cube("Recessed porch roof",(x+w*.37,y,z+2.89),(w*.26+.3,d,.22),roof,.06)
        for py in (y-d/2+.25,y+d/2-.25):
            cube("Porch limewashed pier",(x+w/2-.14,py,z+1.40),(.28,.30,2.80),plaster,.04)
    elif kind=="patio":
        plastered_volume(x,y+d*.14,z,w,d*.72,3.25,True)
        for side in (-1,1):
            cube("Patio white return wall",(x+side*(w/2-.14),y-d*.36,z+.53),(.28,d*.28,1.06),plaster,.06)
            cube("Patio return coping",(x+side*(w/2-.14),y-d*.36,z+1.09),(.36,d*.28+.1,.12),roof,.04)
    else:
        plastered_volume(x-w*.14,y,z,w*.72,d,3.05,True)
        plastered_volume(x+w*.36,y+d*.25,z,w*.28,d*.50,3.48)
    # Low solid corner piers and thin blue metal rail, with a clear central stair arrival.
    fy=y-d/2-2.15
    for side in (-1,1):
        end=x+side*(w/2+2)
        cube("Terrace parapet pier",(end,fy,z+.47),(.42,.45,.94),plaster,.055)
        beam("Terrace railing",(x+side*1.05,fy,z+1.03),(end,fy,z+1.03),.035,rail)
        for k in range(1,max(2,int(w/2+1))):
            sx=x+side*(1.05+k*.82)
            if abs(sx-x)<w/2+1.7:
                beam("Terrace baluster",(sx,fy,z+.05),(sx,fy,z+1.03),.023,rail,4)
    table_x,table_y=x+w*.30,y-d/2-1.1
    cube("Small ceramic terrace table",(table_x,table_y,z+.74),(.72,.68,.065),white,.03)
    for dx in (-.25,.25):
        for dy in (-.23,.23):
            beam("Table metal leg",(table_x+dx,table_y+dy,z+.04),(table_x+dx,table_y+dy,z+.71),.026,rail,4)
    terrace_chair(table_x-.75,table_y,z)
    terrace_chair(table_x+.75,table_y,z)
    return z


villa(-23,43,16,9,"setback")
villa(23,32,12,8,"loggia")
villa(-25,21,11,7,"patio")
villa(28,12,9,7,"cottage")

# The curved SS163 is built from OSM in the context script; no invented straight road.
for x in (8,12):
    cube("Entry gate post", (x,57,elevation(57)+1.2), (.6,.6,2.4), plaster)
beam("Entry gate arch", (8,57,elevation(57)+2.4), (12,57,elevation(57)+2.4), .12, wood)

# A deliberately illustrative zigzag communicates the repeated level changes.
stair_segments=[]
def stair_support(a,b,width,count):
    """A continuous masonry bed follows the slope and extends below the displaced ground."""
    length=math.hypot(b[0]-a[0],b[1]-a[1])
    assert length>0 and count>0
    # The top can enter the hidden tread body, but never protrude through its walking surface.
    assert abs(b[2]-a[2])/(2*count)-.12 < .15
    nx,ny=-(b[1]-a[1])/length*width/2,(b[0]-a[0])/length*width/2
    stair_segments.append((a,b))
    # Cut only the walking corridor; preserve the surrounding cliff and all mesh attributes.
    changed=set()
    for vertex in terrain.data.vertices:
        p=vertex.co
        t=((p.x-a[0])*(b[0]-a[0])+(p.y-a[1])*(b[1]-a[1]))/(length*length)
        t=max(0,min(1,t))
        distance=math.hypot(p.x-a[0]-(b[0]-a[0])*t,p.y-a[1]-(b[1]-a[1])*t)
        edge=distance-width/2
        target=a[2]+(b[2]-a[2])*t-.55
        if edge<1.6 and p.z>target:
            weight=min(1,max(0,(1.6-edge)/.45))
            p.z+=(target-p.z)*weight
            changed.add(vertex.index)
    terrain.data.update()
    uv=terrain.data.uv_layers.active.data
    for face in terrain.data.polygons:
        if not any(index in changed for index in face.vertices):
            continue
        axis=max(range(3),key=lambda k:abs(face.normal[k]))
        for index in face.loop_indices:
            p=terrain.data.vertices[terrain.data.loops[index].vertex_index].co
            uv[index].uv=((p.y if axis==0 else p.x)/18,(p.y if axis==2 else p.z)/18)
    samples=max(2,math.ceil(length/2))
    points,faces=[],[]
    for i in range(samples+1):
        t=i/samples
        x,y=a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t
        top=a[2]+(b[2]-a[2])*t-.12
        base=min(top-.45,ground_height(x-nx,y-ny)-1.25,ground_height(x+nx,y+ny)-1.25)
        points.extend([(x-nx,y-ny,top),(x+nx,y+ny,top),(x-nx,y-ny,base),(x+nx,y+ny,base)])
        if i:
            p,q=(i-1)*4,i*4
            faces.extend([(p,q,q+1,p+1),(p+2,p+3,q+3,q+2),
                          (p,p+2,q+2,q),(p+1,q+1,q+3,p+3)])
    faces.extend([(0,1,3,2),(samples*4,samples*4+2,samples*4+3,samples*4+1)])
    support_mesh=bpy.data.meshes.new("Continuous stair masonry")
    support_mesh.from_pydata(points,[],faces)
    support_mesh.update()
    support=bpy.data.objects.new("Continuous stair masonry",support_mesh)
    bpy.context.collection.objects.link(support)
    finish(support,"Continuous stair masonry",cliff)
    stone_surface(support,0)


route = [(10,58), (10,51), (-12,38), (12,25), (-12,11), (10,-2), (-9,-15), (-9,-25)]
for (ax,ay),(bx,by) in zip(route,route[1:]):
    az,bz = elevation(ay)+.7,elevation(by)+.7
    if (bx,by)==route[-1]:
        bz=.6
    length = math.hypot(bx-ax,by-ay)
    count = max(2,int(abs(az-bz)/.34))
    angle = math.atan2(by-ay,bx-ax)
    for s in range(count):
        t=(s+.5)/count
        x,y,z=ax+(bx-ax)*t,ay+(by-ay)*t,az+(bz-az)*t
        obj=cube("Stair tread", (x,y,z), (length/count+.08,1.65,.3), steps)
        obj.rotation_euler.z=angle
    stair_support((ax,ay,az),(bx,by,bz),1.65,count)
    nx,ny=-math.sin(angle)*.92,math.cos(angle)*.92
    beam("Stair handrail", (ax+nx,ay+ny,az+1),(bx+nx,by+ny,bz+1),.065,white)
    for s in range(0,count,4):
        t=s/count
        x,y,z=ax+(bx-ax)*t+nx,ay+(by-ay)*t+ny,az+(bz-az)*t
        beam("Stair handrail post", (x,y,z),(x,y,z+1),.055,white)
    beam("Route accent", (ax,ay,az+.24),(bx,by,bz+.24),.085,path_gold)
    cube("Stair landing", (ax,ay,az), (2.6,2.6,.32), steps)
    landing_depth=max(.45,az-ground_height(ax,ay)+1.25)
    landing_base=cube("Landing masonry bed",(ax,ay,az-.16-landing_depth/2),(2.6,2.6,landing_depth),cliff)
    stone_surface(landing_base,0)

# Narrow planted terraces hold the slope together; short ends leave the descent readable.
for x,y,w in [(-30,34,22),(29,23,18),(-31,10,21),(27,1,21),(-31,52,23),(28,46,20)]:
    z=elevation(y)
    wall=cube("Garden retaining wall",(x,y,z-1.4),(w,1.1,2.8),cliff,.13)
    stone_surface(wall,.10)
    cube("Garden terrace bed",(x,y+1.1,z+.12),(w,2.8,.24),terrace)

# Reed-roof outdoor sitting terrace, yellow/blue tiles and a vine-covered section of descent.
tx,ty,tz=-23,37.1,elevation(43)+.34
for ix in range(14):
    for iy in range(4):
        cube("Glazed terrace tile",(tx-4.9+ix*.72,ty-1.05+iy*.72,tz+.025),(.69,.69,.055),
             tile_yellow if (ix+iy)%2 else tile_blue)
for px in (tx-5.5,tx+5.5):
    for py in (ty-1.8,ty+1.8):
        beam("Rustic terrace pergola post",(px,py,tz),(px+.12,py,tz+3.15),.13,wood)
for iy in range(24):
    py=ty-1.8+iy*.157
    beam("Woven reed shade",(tx-5.8,py,tz+3.2),(tx+5.8,py,tz+3.2),.065,reed)
for px in (tx-5.5,tx,tx+5.5):
    beam("Pergola timber",(px,ty-2,tz+3.12),(px,ty+2,tz+3.12),.14,wood)
cube("Garden bench seat",(tx-3,ty-1.0,tz+.46),(3.5,.64,.16),tile_blue,.05)
for px in (tx-4.3,tx-1.7):
    cube("Garden bench pedestal",(px,ty-1.0,tz+.21),(.45,.54,.42),plaster,.04)
for px,py in [(tx-5,ty-1.2),(tx+5,ty-1.2),(-18,15),(19,26)]:
    pz=tz if py>35 else elevation(py)+.7
    bpy.ops.mesh.primitive_cone_add(vertices=12,radius1=.38,radius2=.61,depth=.85,location=(px,py,pz+.43))
    finish(bpy.context.object,"Terracotta garden urn",terracotta)

for t in (.15,.35,.55,.75):
    x,y=10-22*t,51-13*t
    z=elevation(y)+.75
    for side in (-1,1):
        beam("Climbing vine pergola post",(x+side*1.2,y,z),(x+side*1.2,y,z+2.2),.045,rail)
    for segment in range(8):
        a,b=segment*math.pi/8,(segment+1)*math.pi/8
        beam("Curved vine arbor rib",(x+1.2*math.cos(a),y,z+2.2+.45*math.sin(a)),
             (x+1.2*math.cos(b),y,z+2.2+.45*math.sin(b)),.045,rail)
for side in (-1,1):
    beam("Continuous vine arbor rail",(6.7+side*1.2,49.05,elevation(49.05)+2.95),
         (-6.5+side*1.2,41.25,elevation(41.25)+2.95),.045,rail)
beam("Continuous vine arbor ridge",(6.7,49.05,elevation(49.05)+3.4),
     (-6.5,41.25,elevation(41.25)+3.4),.045,rail)

# Short connecting flights make each destination legible in the study.
for a,b in [((-12,38,elevation(38)+.7),(-23,36.5,elevation(43)+.07)),
            ((12,25,elevation(25)+.7),(23,26,elevation(32)+.07)),
            ((-12,11,elevation(11)+.7),(-25,15.5,elevation(21)+.07)),
            ((10,-2,elevation(-2)+.7),(-12,-2,elevation(-2)+.07)),
            ((12,25,elevation(25)+.7),(21.5,11,elevation(12)+.07))]:
    length = math.hypot(b[0]-a[0],b[1]-a[1])
    count = max(1,math.ceil(abs(b[2]-a[2])/.34))
    for s in range(count):
        t=(s+.5)/count
        obj=cube("Connecting stair or path", tuple(a[k]+(b[k]-a[k])*t for k in range(3)),
                 (length/count+.04,1.5,.3),steps)
        obj.rotation_euler.z=math.atan2(b[1]-a[1],b[0]-a[0])
    stair_support(a,b,1.5,count)
    if b[0]==21.5:
        # The fourth cottage is reached from the clear west side, away from the eastern outcrop.
        nx,ny=-(b[1]-a[1])/length*.79,(b[0]-a[0])/length*.79
        beam("Lower cottage access handrail",(a[0]+nx,a[1]+ny,a[2]+1),
             (b[0]+nx,b[1]+ny,b[2]+1),.04,rail)
        for s in range(0,count+1,4):
            t=min(1,s/count)
            p=tuple(a[k]+(b[k]-a[k])*t for k in range(3))
            beam("Lower cottage handrail post",(p[0]+nx,p[1]+ny,p[2]),
                 (p[0]+nx,p[1]+ny,p[2]+1),.032,rail,4)

# Curved pool against the rock, its own lower terrace and bougainvillea pergola.
pool_z = terrace_pad(-22,-2,21,12)
# Asymmetric kidney edge echoing the photographed pool curving against limestone.
def pool_outline(name,scale,z,mat):
    points=[(-23,-4,z)]
    for i in range(96):
        angle=i*math.tau/96
        pinch=1-.19*math.exp(-((angle-1.15)/.52)**2)
        points.append((-23+8.15*scale*math.cos(angle)*pinch,-4+3.9*scale*math.sin(angle),z))
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(points,[],[(0,i+1,(i+1)%96+1) for i in range(96)])
    mesh.update()
    obj=bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(obj)
    return finish(obj,name,mat)
pool_outline("Curved pool coping",1.06,pool_z+.36,plaster)
pool_outline("Sea water pool",.96,pool_z+.39,pool_mat)
pool_cliff=ellipsoid("Rock embracing pool",(-25,3,pool_z+3.8),(9,3.5,5.1),cliff,4)
stone_surface(pool_cliff,1.1)
for x in (-31,-15):
    for y in (-.4,3.2):
        beam("Pergola upright",(x,y,pool_z),(x,y,pool_z+3.7),.14,wood)
for x in range(-31,-14,2):
    beam("Pergola rafters",(x,-.5,pool_z+3.7),(x,3.5,pool_z+3.7),.12,wood)

# Narrow shingle cove at the foot of the cliffs.
grit=pebble.node_tree.nodes.new("ShaderNodeTexImage")
grit.image=bpy.data.images.get("cliff-color.jpg")
pebble.node_tree.links.new(grit.outputs["Color"],pebble.node_tree.nodes.get("Principled BSDF").inputs["Base Color"])
grit_normal=pebble.node_tree.nodes.new("ShaderNodeTexImage")
grit_normal.image=bpy.data.images.load(str(texture_dir/"earth-normal.jpg"))
grit_normal.image.colorspace_settings.name="Non-Color"
grit_normal_node=pebble.node_tree.nodes.new("ShaderNodeNormalMap")
grit_normal_node.inputs["Strength"].default_value=.75
pebble.node_tree.links.new(grit_normal.outputs["Color"],grit_normal_node.inputs["Color"])
pebble.node_tree.links.new(grit_normal_node.outputs["Normal"],pebble.node_tree.nodes.get("Principled BSDF").inputs["Normal"])
beach_color=pebble.node_tree.nodes.new("ShaderNodeVertexColor")
beach_color.layer_name="Wet shingle"
beach_mix=pebble.node_tree.nodes.new("ShaderNodeMixRGB")
beach_mix.blend_type="MULTIPLY"
beach_mix.inputs[0].default_value=1
pebble.node_tree.links.new(grit.outputs["Color"],beach_mix.inputs[1])
pebble.node_tree.links.new(beach_color.outputs["Color"],beach_mix.inputs[2])
pebble.node_tree.links.new(beach_mix.outputs[0],pebble.node_tree.nodes.get("Principled BSDF").inputs["Base Color"])


def beach_height(x,y):
    radius=min(1.1,math.hypot((x+8)/24,(y+28)/10))
    shore=max(0,min(1,(radius-.78)/.30))
    return (.53*(1-radius**1.8)+.35*max(0,(y+28)/10)
            +noise.noise(Vector((x*4,y*4,1)))*.07-.12-.48*shore*shore)


beach_verts=[(-8,-28,beach_height(-8,-28))]
beach_faces=[]
for ring in range(1,15):
    r=ring/14
    for i in range(96):
        angle=i*math.tau/96
        edge=1+.105*math.sin(angle*3+.8)+.045*math.sin(angle*7)
        x,y=-8+24*r*edge*math.cos(angle),-28+10*r*edge*math.sin(angle)
        beach_verts.append((x,y,beach_height(x,y)))
for i in range(96):
    beach_faces.append((0,i+1,(i+1)%96+1))
for ring in range(13):
    a,b=1+ring*96,1+(ring+1)*96
    for i in range(96):
        j=(i+1)%96
        beach_faces.extend([(a+i,b+i,a+j),(a+j,b+i,b+j)])
beach_mesh=bpy.data.meshes.new("Irregular shingle pocket")
beach_mesh.from_pydata(beach_verts,[],beach_faces)
beach_mesh.update()
beach_obj=bpy.data.objects.new("Private pebble cove",beach_mesh)
bpy.context.collection.objects.link(beach_obj)
finish(beach_obj,"Private pebble cove",pebble)
beach_uv=beach_mesh.uv_layers.new(name="Small-scale shingle")
beach_colors=beach_mesh.color_attributes.new(name="Wet shingle",type="FLOAT_COLOR",domain="CORNER")
for face in beach_mesh.polygons:
    face.use_smooth=True
    for loop_index in face.loop_indices:
        p=beach_mesh.vertices[beach_mesh.loops[loop_index].vertex_index].co
        beach_uv.data[loop_index].uv=(p.x/.85,p.y/.85)
        dry=max(0,min(1,(p.z+.12)/.4))
        variation=.88+.12*noise.noise_vector(p*1.8).x
        beach_colors.data[loop_index].color=((.24+.43*dry)*variation,(.25+.41*dry)*variation,
                                            (.25+.39*dry)*variation,1)
for i in range(620):
    x,y=random.uniform(-29,12),random.uniform(-36,-22)
    z=beach_height(x,y)
    if z<-.20:
        continue
    size=random.uniform(.045,.16)
    ellipsoid("Shore pebble",(x,y,z+size*.30),(size,size*random.uniform(.6,.9),size*.40),
              random.choice(rock),1)


def parasol(x,y,z):
    beam("Umbrella pole",(x,y,z),(x,y,z+2.6),.065,wood)
    bpy.ops.mesh.primitive_cone_add(vertices=12,radius1=1.55,radius2=.18,depth=.55,location=(x,y,z+2.55))
    finish(bpy.context.object,"Ivory parasol",white)
    for dx in (-1.6,1.6):
        cube("Sun lounger",(x+dx,y-.6,z+.35),(.85,2,.22),white,.08)
        cube("Blue cushion",(x+dx,y-.6,z+.48),(.75,1.85,.1),blue,.05)


for x,y,z in [(-20,-27,1),(-13,-29,1),(-3,-28,1),(-32,-5,pool_z),(-14,-5,pool_z)]:
    if y < -20:
        z=beach_height(x,y)+.04
    parasol(x,y,z)


def near_route(x,y):
    for a,b in stair_segments:
        ax,ay=a[:2]; bx,by=b[:2]
        t=max(0,min(1,((x-ax)*(bx-ax)+(y-ay)*(by-ay))/((bx-ax)**2+(by-ay)**2)))
        if math.hypot(x-ax-t*(bx-ax),y-ay-t*(by-ay))<3:
            return True
    return False


# Layered photographic branch sprays form actual silhouettes, without opaque green blobs.
def foliage(name,center,size,mat,count=100,leaf_scale=1,needle=False,stems=True):
    lobes=[]
    cypress=needle and size[2]>size[0]*2
    for k in range(4):
        angle=k*math.tau/4+random.uniform(-.4,.4)
        c=Vector((center[0]+math.cos(angle)*size[0]*.42,
                  center[1]+math.sin(angle)*size[1]*.42,
                  center[2]+random.uniform(-.16,.22)*size[2]))
        radii=Vector((size[0]*random.uniform(.44,.60),size[1]*random.uniform(.44,.60),size[2]*random.uniform(.53,.78)))
        if cypress:
            c=Vector(center)+Vector((0,0,size[2]*(k*.39-.55)))
            radii=Vector((size[0]*(.82-k*.18),size[1]*(.82-k*.18),size[2]*.38))
        lobes.append((c,radii))
        if mat!=pink and stems:
            beam("Attached leafy stem",Vector(center)-Vector((0,0,size[2]*.7)),c,.035,wood,5)
    verts,faces,normals=[],[],[]
    flowers=mat==pink
    for i in range(count*4):
        c,radii=lobes[i%len(lobes)]
        theta=random.uniform(0,math.tau)
        polar=random.uniform(-.7,1)
        ring=math.sqrt(1-polar*polar)
        outward=Vector((math.cos(theta)*ring,math.sin(theta)*ring,polar))
        radius=random.uniform(.2,1)**.5
        p=c+Vector(tuple(outward[k]*radii[k]*radius for k in range(3)))
        direction=(Vector((outward.x,outward.y,outward.z*.3+.28)) if needle and not cypress
                   else outward+Vector((0,0,.45))).normalized()
        width=direction.cross(Vector((0,0,1)))
        if width.length<.1:
            width=Vector((1,0,0))
        width.normalize()
        length=random.uniform(.8,1.3)*(max(size[0],size[1])*.48 if needle else 1)
        if flowers:
            length=random.uniform(.09,.20)
        width*=length*(.37 if needle else .31)
        start=len(verts)
        if not flowers:
            verts.extend([tuple(p-width),tuple(p+width),tuple(p+width+direction*length),tuple(p-width+direction*length)])
            faces.append((start,start+1,start+2,start+3))
            # Broad canopy normals keep tiny two-sided sprays from reading as black confetti.
            normal=Vector((outward.x*.25,outward.y*.25,.9+outward.z*.1)).normalized()
            normals.extend([tuple(normal)]*4)
        else:
            verts.extend([tuple(p-direction*length),tuple(p+width),tuple(p+Vector((0,0,.045))),
                          tuple(p-width),tuple(p+direction*length)])
            faces.extend([(start,start+1,start+2),(start,start+2,start+3),
                          (start+1,start+4,start+2),(start+2,start+4,start+3)])
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(verts,[],faces)
    mesh.update()
    obj=bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(obj)
    finish(obj,name,mat if flowers else pine_needle if needle else leaf_spray)
    if not flowers:
        uv=mesh.uv_layers.new(name="Photographic branch atlas")
        coords=[(.023,.563),(.226,.563),(.226,.974),(.023,.974)] if needle else [(.54,.355),(.84,.355),(.84,.967),(.54,.967)]
        for face in mesh.polygons:
            for loop_index,coord in zip(face.loop_indices,coords):
                uv.data[loop_index].uv=coord
    for face in mesh.polygons:
        face.use_smooth=True
    if not flowers:
        assert len(normals)==len(verts) and all(n[2]>.85 for n in normals)
        mesh.use_auto_smooth=True
        mesh.normals_split_custom_set_from_vertices(normals)
    return obj


def tree(x,y,z,scale,kind="olive"):
    trunk_height=2.7 if kind!="pine" else 5.2
    beam("Mature garden tree trunk",(x,y,z),(x+.32,y,z+trunk_height*.7),.24,wood,9)
    for k in range(3):
        theta=k*math.tau/3+random.uniform(-.4,.4)
        end=(x+math.cos(theta)*scale*.75,y+math.sin(theta)*scale*.75,z+trunk_height+random.uniform(.1,.8))
        beam("Forked tree branch",(x+.22,y,z+trunk_height*.6),end,.105,wood,6)
        crown_size=(scale*.8,scale*.8,scale*.45 if kind=="pine" else scale*.6)
        mat=olive if kind=="olive" else random.choice(leaves)
        for branch in (-.35,.35):
            tip=(end[0]+math.cos(theta+branch)*scale*.35,end[1]+math.sin(theta+branch)*scale*.35,end[2]+.35)
            beam("Fine crown branch",(x+.22,y,z+trunk_height*.7),tip,.055,wood,5)
        foliage("Olive / pine leaf canopy",end,crown_size,mat,28,needle=kind=="pine")
    if kind=="lemon":
        for k in range(9):
            theta=random.uniform(0,math.tau)
            ellipsoid("Lemon fruit",(x+math.cos(theta)*scale*.85,y+math.sin(theta)*scale*.85,z+trunk_height),
                      (.12,.12,.17),lemon,1)


# Irregular planted pockets leave the steep rock faces and walking corridors exposed.
for i in range(380):
    x,y=random.uniform(-59,59),random.uniform(-14,88)
    if near_route(x,y) or any(abs(x-a)<w and abs(y-b)<d for a,b,w,d in
       [(-23,43,12,9),(23,32,10,8),(-25,21,9,7),(28,12,8,7),(-22,-2,13,8)]):
        continue
    slope=math.hypot(ground_height(x+1,y)-ground_height(x-1,y),
                     ground_height(x,y+1)-ground_height(x,y-1))/2
    if slope>1.8 or noise.noise_vector(Vector((x*.033,y*.037,8))).x<-.45:
        continue
    z=ground_height(x,y)+.4
    scale=random.uniform(1.5,3.8)
    if i%3==0:
        tree(x,y,z,scale,["lemon","olive","pine"][i%7%3])
    else:
        foliage("Oleander and Mediterranean scrub",(x,y,z+.8),(scale,scale*.8,scale*.65),random.choice(leaves),24)
for x,y in [(-37,46),(33,43),(-35,28),(35,20)]:
    z=elevation(y)
    beam("Cypress trunk",(x,y,z),(x,y,z+7),.2,wood)
    foliage("Cypress",(x,y,z+5),(1.4,1.4,5.5),leaves[0],60,needle=True)

for i in range(34):
    p=(random.uniform(-31,-15),random.uniform(-.4,3.2),pool_z+4)
    foliage("Bougainvillea over pergola",p,(1.35,1,.55),pink if i%3 else leaves[1],22)
for t in (.15,.25,.35,.45,.55,.65,.75):
    x,y=10-22*t,51-13*t
    foliage("Bougainvillea over steps",(x,y,elevation(y)+3.5),(1.8,2.3,.65),pink,25)
tree(-33,3,pool_z,3.8,"olive")
for i in range(7):
    foliage("Jacaranda flowers",(-33+random.uniform(-3,3),3+random.uniform(-2.5,2.5),pool_z+4.5),
            (1.1,1,.5),pink,20)

# Woodland follows the landscape, not the edges of the old rectangular property patch.
# Avoid mapped buildings and the road. Species and planting remain illustrative.
plant_exclusions=[]
for item in geo["elements"]:
    if "building" in item["tags"]:
        points=[local_point(p) for p in item["geometry"]]
        plant_exclusions.append((min(p[0] for p in points)-5,max(p[0] for p in points)+5,
                                 min(p[1] for p in points)-5,max(p[1] for p in points)+5))
road_source=json.loads((context_dir/"positano-roads-osm.json").read_text())
plant_roads=[]
for item in road_source["elements"]:
    points=[local_point(p) for p in item["geometry"]]
    plant_roads.extend(zip(points,points[1:]))


def clear_of_road(x,y):
    for (ax,ay),(bx,by) in plant_roads:
        if not (min(ax,bx)-8<x<max(ax,bx)+8 and min(ay,by)-8<y<max(ay,by)+8):
            continue
        length2=(bx-ax)**2+(by-ay)**2
        if not length2:
            continue
        t=max(0,min(1,((x-ax)*(bx-ax)+(y-ay)*(by-ay))/length2))
        if math.hypot(x-ax-t*(bx-ax),y-ay-t*(by-ay))<8:
            return False
    return True


woodland_count=0
for i in range(8000):
    x,y=random.uniform(-650,450),random.uniform(-30,450)
    if abs(x)<55 and y<88 or y<coast_y(x)+12:
        continue
    if any(a<x<b and c<y<d for a,b,c,d in plant_exclusions) or not clear_of_road(x,y):
        continue
    z=ground_height(x,y)
    slope=math.hypot(ground_height(x+3,y)-ground_height(x-3,y),
                     ground_height(x,y+3)-ground_height(x,y-3))/6
    patch=noise.noise_vector(Vector((x*.013,y*.013,6.8))).x
    if slope>1.55 or patch<-.22 or z<5:
        continue
    # ponytail: distant crowns reuse photographic branch atlases with no tiny
    # internal stems; scanned tree LODs can replace these when footage is available.
    scale=random.uniform(6,10)
    beam("Distant pine trunk",(x,y,z),(x+.3,y,z+scale*.7),.3,wood,6)
    foliage("Distant Mediterranean woodland",(x,y,z+scale*.75),(scale,scale*.85,scale*.46),
            random.choice(leaves),18,1.8,needle=True,stems=False)
    woodland_count+=1
    if woodland_count==200:
        break
assert woodland_count==200, "Woodland mask unexpectedly empty"
print("COASTAL_WOODLAND",woodland_count,"slope/road/building-aware canopy groups")

# Build the geographic surroundings separately from the illustrative property.
exec(compile((ROOT / "scripts/build-estate-context.py").read_text(), "build-estate-context.py", "exec"))

# Merge by material for a small number of web draw calls; retain source objects in .blend.
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE / "la-fenice-study.blend"))
material_groups = {tuple(o.data.materials) for o in bpy.context.scene.objects if o.type=="MESH"}
for materials in material_groups:
    objects=[o for o in bpy.context.scene.objects if o.type=="MESH" and tuple(o.data.materials)==materials]
    if not objects:
        continue
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    if len(objects) > 1:
        bpy.ops.object.join()
    objects[0].name=materials[0].name
export_triangles=0
for obj in bpy.context.scene.objects:
    if obj.type=="MESH":
        obj.data.calc_loop_triangles()
        export_triangles+=len(obj.data.loop_triangles)
assert export_triangles<450000, f"Web model exceeds triangle budget: {export_triangles}"
bpy.ops.export_scene.gltf(filepath=str(OUT / "la-fenice-study.glb"),export_format="GLB",export_apply=True,
                          export_cameras=False,export_lights=False,export_extras=False,export_image_format="JPEG",
                          export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,
                          export_draco_position_quantization=16,export_draco_normal_quantization=10,
                          export_draco_texcoord_quantization=12)

# Static, first-load and non-WebGL fallback rendered from this same model.
sea=material("Preview sea",(.025,.23,.29),.19)
sea_bsdf=sea.node_tree.nodes.get("Principled BSDF")
sea_bsdf.inputs["IOR"].default_value=1.333
sea_bsdf.inputs["Specular"].default_value=.6
water_noise=sea.node_tree.nodes.new("ShaderNodeTexNoise")
water_noise.inputs["Scale"].default_value=.35
water_noise.inputs["Detail"].default_value=3
water_bump=sea.node_tree.nodes.new("ShaderNodeBump")
water_bump.inputs["Strength"].default_value=.35
water_bump.inputs["Distance"].default_value=.12
sea.node_tree.links.new(water_noise.outputs["Fac"],water_bump.inputs["Height"])
water_position=sea.node_tree.nodes.new("ShaderNodeNewGeometry")
sea.node_tree.links.new(water_position.outputs["Position"],water_noise.inputs["Vector"])
sea.node_tree.links.new(water_bump.outputs["Normal"],sea_bsdf.inputs["Normal"])
cube("Preview water",(0,-30,-.32),(12000,12000,.2),sea)
scene=bpy.context.scene
scene.render.engine="CYCLES"
scene.cycles.samples=48
scene.cycles.use_denoising=True
scene.world.use_nodes=True
scene.world.node_tree.nodes.get("Background").inputs[0].default_value=(.62,.73,.88,1)
scene.world.node_tree.nodes.get("Background").inputs[1].default_value=.4
bpy.ops.object.light_add(type="AREA",location=(-70,-40,150))
bpy.context.object.data.energy=80000
bpy.context.object.data.size=95
bpy.ops.object.light_add(type="SUN",location=(0,0,100))
bpy.context.object.rotation_euler=(.3,-.5,-.5)
bpy.context.object.data.energy=3.2
bpy.context.object.data.angle=.08
bpy.ops.object.camera_add(location=(330,-495,255))
camera=bpy.context.object
camera.rotation_euler=(Vector((-150,75,125))-camera.location).to_track_quat("-Z","Y").to_euler()
camera.data.type="PERSP"
camera.data.lens=34
camera.data.clip_end=10000
scene.camera=camera
scene.render.resolution_x=1600
scene.render.resolution_y=1000
scene.render.resolution_percentage=100
scene.view_settings.view_transform="Filmic"
scene.view_settings.look="Medium High Contrast"
scene.view_settings.exposure=0
scene.view_settings.gamma=1
scene.render.image_settings.file_format="PNG"
scene.render.filepath=str(SOURCE / "estate-poster.png")
bpy.ops.render.render(write_still=True)
triangles=0
for obj in scene.objects:
    if obj.type=="MESH":
        obj.data.calc_loop_triangles()
        triangles+=len(obj.data.loop_triangles)
print("ESTATE_READY",(OUT / "la-fenice-study.glb").stat().st_size,"TRIANGLES",triangles)
