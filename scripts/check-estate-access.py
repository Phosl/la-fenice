"""Read-only geometry regression check.

Blender --background artifacts/estate/la-fenice-study.blend --python-exit-code 1 --python scripts/check-estate-access.py
Run after build-estate.py. This never saves, exports, or renders the loaded scene.
"""
import math

import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

graph = bpy.context.evaluated_depsgraph_get()
terrain = bpy.data.objects["Rocky headland"]
ground = BVHTree.FromObject(terrain, graph)
inverse = terrain.matrix_world.inverted()
rocks = [(obj, BVHTree.FromObject(obj, graph)) for obj in bpy.context.scene.objects
         if obj.name.startswith(("Coastal limestone", "Rock embracing pool"))]
treads = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"
          and obj.name.startswith(("Stair tread", "Stair landing", "Connecting stair or path"))]
assert treads, "No stair geometry found in the editable source"
assert any(obj.name.startswith("Connecting stair or path")
           and math.hypot(obj.location.x-21.5, obj.location.y-11) < 1
           for obj in treads), "The fourth cottage has no arrival path"
assert len(terrain.data.uv_layers.active.data) == len(terrain.data.loops)
assert len(terrain.data.color_attributes["Terrain tone"].data) == len(terrain.data.loops)
for obj in (terrain,bpy.data.objects["Positano geographic terrain"]):
    assert len(obj.data.materials)==1, "Terrain must not switch material at triangle boundaries"
    colors=obj.data.color_attributes["Terrain tone"].data
    shared_colors={}
    for loop in obj.data.loops:
        color=tuple(colors[loop.index].color)
        assert color==shared_colors.setdefault(loop.vertex_index,color), "Discontinuous terrain vertex color"
road = bpy.data.objects["Mapped SS163 surface"]
assert len(road.data.polygons)>100, "Mapped SS163 road missing"
assert min(math.hypot(v.co.x-10,v.co.y-57) for v in road.data.vertices)<12, "Road misplaced relative to the upper entry"
assert not any(obj.name.startswith("Upper access path") for obj in bpy.data.objects), "Old fictitious straight road remains"
assert any(obj.name.startswith("Mapped building retaining base") for obj in bpy.data.objects), "Nearby buildings need separate rock foundations"

failures = []
minimum_gap = float("inf")


def inside_rock(tree, point):
    # A nearest face normal gives false positives at concave rock edges; use closed-mesh parity.
    direction = Vector((.813, .419, .402)).normalized()
    origin = point.copy()
    crossings = 0
    for _ in range(64):
        hit = tree.ray_cast(origin, direction)
        if hit[0] is None:
            return crossings % 2 == 1
        crossings += 1
        origin = hit[0]+direction*.0001
    raise AssertionError("Rock containment ray did not converge")


for tread in treads:
    points = [vertex.co for vertex in tread.data.vertices]
    bounds = [(min(p[axis] for p in points), max(p[axis] for p in points)) for axis in range(3)]
    for tx in (.1, .5, .9):
        for ty in (.1, .5, .9):
            local = Vector((bounds[0][0]+tx*(bounds[0][1]-bounds[0][0]),
                            bounds[1][0]+ty*(bounds[1][1]-bounds[1][0]), bounds[2][1]))
            point = tread.matrix_world @ local
            origin = inverse @ (point+Vector((0, 0, 100)))
            direction = (inverse.to_3x3() @ Vector((0, 0, -1))).normalized()
            hit = ground.ray_cast(origin, direction)
            if hit[0] is not None:
                gap = point.z-(terrain.matrix_world @ hit[0]).z
                minimum_gap = min(minimum_gap, gap)
                if gap < -.02:
                    failures.append((tread.name, "terrain clips tread", round(gap, 3)))
            for height in (0, 1.6):
                for rock, tree in rocks:
                    local_point = rock.matrix_world.inverted() @ (point+Vector((0, 0, height)))
                    if inside_rock(tree, local_point):
                        failures.append((tread.name, "rock collision", rock.name))
assert not failures, failures[:12]
print("ESTATE_ACCESS_OK", len(treads), "treads/landings; minimum terrain clearance",
      round(minimum_gap, 3), "m; fourth cottage connected; UV/color topology preserved")
