"""Geographic surroundings, executed by build-estate.py in its Blender scene.

OSM footprints/coastline + Mapzen/Copernicus terrain. Heights, facades and the
transition into the illustrative estate are interpreted, not a surveyed city.
Sources and licenses: docs/estate-3d.md, artifacts/estate/context/.
"""
from mathutils.bvhtree import BVHTree
from mathutils.geometry import tessellate_polygon


# Match the exact displaced estate boundary, including its locally cut stair beds.
near_bvh = BVHTree.FromObject(terrain, bpy.context.evaluated_depsgraph_get())


def context_height(x, y):
    natural = geographic_height(x,y)
    cx,cy = max(-174,min(174,x)), max(-34,min(234.6,y))
    distance = math.hypot(x-cx,y-cy)
    if distance < 180:
        # Keep the seam inside the estate's mesh edge to avoid an unhit boundary ray.
        hit = near_bvh.ray_cast(Vector((cx*.9999, cy if -33.9<cy<234.5 else cy*.9999, 2000)), Vector((0,0,-1)))[0]
        if hit is not None:
            blend = min(1,distance/180)
            blend = blend*blend*(3-2*blend)
            return hit.z*(1-blend)+natural*blend
    return natural


# Keep the DEM grid coarse outside the property. Four zipper strips meet the exact
# displaced near-terrain vertices, without extending every fine grid line regionally.
world_xs = sorted(set([-2400+i*45 for i in range(92)] + [-220,220]))
world_ys = sorted(set([-1050+i*40 for i in range(75)] + [-74,275]))
context_verts = [(x,y,context_height(x,y)) for y in world_ys for x in world_xs]
context_faces = []
stride = len(world_xs)
for j in range(len(world_ys)-1):
    for i in range(stride-1):
        if -220 <= world_xs[i] and world_xs[i+1] <= 220 and -74 <= world_ys[j] and world_ys[j+1] <= 275:
            continue
        a = j*stride+i
        context_faces.extend([(a,a+1,a+stride),(a+1,a+stride+1,a+stride)])

context_lookup={tuple(point):index for index,point in enumerate(context_verts)}
near_edge_count=0


def stitch_context_edge(near_indices,outer_indices,axis):
    global near_edge_count
    inner=[]
    for index in near_indices:
        point=tuple(terrain.data.vertices[index].co)
        if point not in context_lookup:
            context_lookup[point]=len(context_verts)
            context_verts.append(point)
        inner.append(context_lookup[point])
    near_edge_count+=len(inner)-1
    def fraction(indices,index):
        low=context_verts[indices[0]][axis]
        high=context_verts[indices[-1]][axis]
        return (context_verts[indices[index]][axis]-low)/(high-low)
    i=j=0
    while i<len(inner)-1 or j<len(outer_indices)-1:
        if j==len(outer_indices)-1 or (i<len(inner)-1 and fraction(inner,i+1)<=fraction(outer_indices,j+1)):
            face=(inner[i],inner[i+1],outer_indices[j])
            i+=1
        else:
            face=(inner[i],outer_indices[j+1],outer_indices[j])
            j+=1
        a,b,c=[context_verts[index] for index in face]
        area=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
        assert abs(area)>1e-6, "Degenerate context stitch"
        context_faces.append(face if area>0 else tuple(reversed(face)))


near_nx,near_ny=len(xs),len(ys)
left,right=world_xs.index(-220),world_xs.index(220)
bottom,top=world_ys.index(-74),world_ys.index(275)
stitch_context_edge(list(range(near_nx)),[bottom*stride+i for i in range(left,right+1)],0)
stitch_context_edge([(near_ny-1)*near_nx+i for i in range(near_nx)],
                    [top*stride+i for i in range(left,right+1)],0)
stitch_context_edge([j*near_nx for j in range(near_ny)],
                    [j*stride+left for j in range(bottom,top+1)],1)
stitch_context_edge([j*near_nx+near_nx-1 for j in range(near_ny)],
                    [j*stride+right for j in range(bottom,top+1)],1)
assert near_edge_count==2*(near_nx+near_ny)-4, "Near perimeter is not fully stitched"
assert len(context_faces)<25000, "Geographic terrain exceeded its triangle budget"
edge_uses={}
for face in context_faces:
    for a,b in zip(face,face[1:]+face[:1]):
        edge=tuple(sorted((a,b)))
        edge_uses[edge]=edge_uses.get(edge,0)+1
assert max(edge_uses.values())==2, "Non-manifold geographic terrain"
assert sum(count==1 for count in edge_uses.values())==near_edge_count+2*(len(world_xs)+len(world_ys))-4, "Internal crack in geographic terrain"
print("CONTEXT_TERRAIN",len(context_faces),"triangles;",near_edge_count,"exact near-boundary edges")
context_mesh = bpy.data.meshes.new("Positano geographic terrain")
context_mesh.from_pydata(context_verts,[],context_faces)
context_mesh.update()
# Refine only the shoreline corridor. Native conforming subdivision avoids the
# 45m coastal teeth without densifying the inland grid or touching the zipper.
coast_bm = bmesh.new()
coast_bm.from_mesh(context_mesh)
fixed_zipper={tuple(vertex.co) for vertex in coast_bm.verts
              if -220<=vertex.co.x<=220 and -74<=vertex.co.y<=275}
coast_edges = []
for edge in coast_bm.edges:
    points = [vertex.co for vertex in edge.verts]
    if all((p.x < -230 or p.x > 230 or p.y < -84 or p.y > 285)
           and abs(p.y-coast_y(p.x)) < 70 for p in points):
        coast_edges.append(edge)
bmesh.ops.subdivide_edges(coast_bm, edges=coast_edges, cuts=3, use_grid_fill=True)
for vertex in coast_bm.verts:
    p = vertex.co
    if p.x < -230 or p.x > 230 or p.y < -84 or p.y > 285:
        p.z = context_height(p.x,p.y)
bmesh.ops.triangulate(coast_bm, faces=list(coast_bm.faces))
assert all(len(edge.link_faces) in (1,2) for edge in coast_bm.edges), "Invalid refined coast topology"
assert fixed_zipper.issubset({tuple(vertex.co) for vertex in coast_bm.verts}), "Coast refinement moved the estate seam"
coast_bm.to_mesh(context_mesh)
coast_bm.free()
context_mesh.update()
assert len(context_mesh.polygons) < 40000, "Refined coastline exceeded its geometry budget"
print("CONTEXT_COAST", len(context_mesh.polygons), "triangles after shoreline-only subdivision")
context_obj = bpy.data.objects.new("Positano geographic terrain",context_mesh)
bpy.context.collection.objects.link(context_obj)
context_mesh.materials.append(terrain_cliff)
context_mesh.uv_layers.new(name="Stone world scale 18m")
tone = context_mesh.color_attributes.new(name="Terrain tone",type="FLOAT_COLOR",domain="CORNER")
vertex_tones=[terrain_tone(vertex.co) for vertex in context_mesh.vertices]
# Adding an attribute reallocates Blender 3.6 custom data; reacquire the UV handle.
uv = context_mesh.uv_layers["Stone world scale 18m"]
for face in context_mesh.polygons:
    face.use_smooth = True
    axis = max(range(3), key=lambda k: abs(face.normal[k]))
    for index in face.loop_indices:
        vertex_index=context_mesh.loops[index].vertex_index
        p = context_mesh.vertices[vertex_index].co
        uv.data[index].uv = ((p.y if axis==0 else p.x)/18,(p.y if axis==2 else p.z)/18)
        tone.data[index].color = vertex_tones[vertex_index]
assert all(0<=value<=1 for data in tone.data for value in data.color), "Regional colors corrupted by UV writes"
assert any(abs(data.uv.x)>1 for data in uv.data), "Regional UVs were not populated"

# Massing follows the actual footprint dataset. OSM rarely provides heights here;
# fallback floors, facade colors and openings are deliberately illustrative.
city_colors = [(.74,.72,.64),(.81,.79,.71),(.71,.59,.45),(.70,.54,.47),(.83,.83,.77)]
city_mats = [material(f"Positano plaster {i}",color) for i,color in enumerate(city_colors)]
city_roof = material("Positano flat roofs",(.58,.55,.47))
city_windows = material("Positano shaded openings",(.13,.21,.20))
city_rng = random.Random(35)
bpy.context.view_layer.update()
city_ground = BVHTree.FromObject(context_obj, bpy.context.evaluated_depsgraph_get())


def rendered_ground(x,y):
    hit=city_ground.ray_cast(Vector((x,y,2000)),Vector((0,0,-1)))[0]
    if hit is None:
        hit=near_bvh.ray_cast(Vector((x,y,2000)),Vector((0,0,-1)))[0]
    return hit.z if hit is not None else None


building_count = 0
neighbor_count = 0
for item in geo["elements"]:
    if "building" not in item["tags"] or len(item["geometry"]) < 4:
        continue
    footprint = [local_point(p) for p in item["geometry"][:-1]]
    x,y = [sum(p[k] for p in footprint)/len(footprint) for k in (0,1)]
    # Only omit footprints overlapping the illustrative estate, not its entire
    # neighborhood. This is a modeling exclusion, never a property boundary.
    overlaps_estate = (min(p[0] for p in footprint)<40 and max(p[0] for p in footprint)>-40
                       and min(p[1] for p in footprint)<65 and max(p[1] for p in footprint)>-32)
    if overlaps_estate or not (-2200<x<1350 and -450<y<1550):
        continue
    signed_area = sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(footprint,footprint[1:]+footprint[:1]))/2
    area = abs(signed_area)
    if area < 12 or area > 7000:
        continue
    if signed_area < 0:
        footprint.reverse() # OSM winding is mixed; outward walls and sea-facing openings require CCW.
    # Foundations must meet the displayed coarse DEM mesh, not a different analytic surface.
    ground_samples=[(x,y)]
    for a,b in zip(footprint,footprint[1:]+footprint[:1]):
        samples=max(1,math.ceil(math.dist(a,b)/10))
        ground_samples.extend((a[0]+(b[0]-a[0])*i/samples,a[1]+(b[1]-a[1])*i/samples)
                              for i in range(samples))
    ground=[]
    for px,py in ground_samples:
        height=rendered_ground(px,py)
        if height is None:
            break # Omit footprints crossing the downloaded terrain's outer boundary.
        ground.append(height)
    if len(ground)!=len(ground_samples):
        continue
    foundation_base=min(ground)-.5
    base=max(ground)-.5
    try:
        height = float(item["tags"].get("height", "").replace(" m",""))
    except ValueError:
        try:
            height = float(item["tags"].get("building:levels", city_rng.choice([2,2,3,3,4])))*3
        except ValueError:
            height = 9
    top = max(ground)+max(3,min(28,height))
    count = len(footprint)
    if base-foundation_base>.75:
        # A sloping mapped footprint needs a retaining base, not dozens of
        # invented white storeys. Reuse limestone and keep plaster low-rise.
        foundation_points=[(px,py,foundation_base) for px,py in footprint]+[(px,py,base) for px,py in footprint]
        foundation_faces=[(i,(i+1)%count,(i+1)%count+count,i+count) for i in range(count)]
        foundation_mesh=bpy.data.meshes.new("Mapped building retaining base")
        foundation_mesh.from_pydata(foundation_points,[],foundation_faces)
        foundation_mesh.update()
        foundation=bpy.data.objects.new("Mapped building retaining base",foundation_mesh)
        bpy.context.collection.objects.link(foundation)
        finish(foundation,"Mapped building retaining base",cliff)
        # Identity/world-space mesh: don't run object operators and re-evaluate
        # the entire scene for each of 1,400 zero-displacement foundations.
        foundation_uv=foundation_mesh.uv_layers.new(name="Stone world scale 18m")
        for face in foundation_mesh.polygons:
            axis=max(range(3),key=lambda k:abs(face.normal[k]))
            for index in face.loop_indices:
                p=foundation_mesh.vertices[foundation_mesh.loops[index].vertex_index].co
                foundation_uv.data[index].uv=((p.y if axis==0 else p.x)/18,p.z/18)
    else:
        base=foundation_base
    assert top-base<=29.25, f"Building {item['id']} facade includes the terrain foundation"
    points = [(px,py,base) for px,py in footprint]+[(px,py,top) for px,py in footprint]
    faces = [(i,(i+1)%count,(i+1)%count+count,i+count) for i in range(count)]
    roof_points = [Vector((px,py,top)) for px,py in footprint]
    for tri in tessellate_polygon([roof_points]):
        a,b,c=[roof_points[index] for index in tri]
        if (b-a).cross(c-a).length_squared>1e-10: # OSM collinear vertices can emit zero-area triangles.
            faces.append(tuple(index+count for index in tri))
    mesh = bpy.data.meshes.new("Mapped city footprint")
    mesh.from_pydata(points,[],faces)
    mesh.update()
    assert len(mesh.polygons)>count and all(face.normal.z>.99 for face in mesh.polygons[count:]), f"Building {item['id']} has an inverted or invalid roof"
    obj = bpy.data.objects.new("Positano mapped building",mesh)
    bpy.context.collection.objects.link(obj)
    finish(obj,"Positano mapped building",city_rng.choice(city_mats))
    mesh.materials.append(city_roof)
    for face in mesh.polygons[count:]:
        face.material_index = 1
    # A single grouped batch per material after export; only sea-facing windows.
    window_verts, window_faces = [],[]
    for a,b in zip(footprint,footprint[1:]+footprint[:1]):
        length = math.dist(a,b)
        if length < 4 or length > 70:
            continue
        direction = Vector((b[0]-a[0],b[1]-a[1],0)).normalized()
        normal = Vector((direction.y,-direction.x,0))
        if normal.y > -.15:
            continue
        for floor in range(min(4,max(1,int(height/3)))):
            for column in range(max(1,int(length/3.5))):
                t = (column+.5)/max(1,int(length/3.5))
                c = Vector((a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,top-2-floor*3))+normal*.06
                start = len(window_verts)
                window_verts.extend([tuple(c-direction*.45),tuple(c+direction*.45),tuple(c+direction*.45+Vector((0,0,1.15))),tuple(c-direction*.45+Vector((0,0,1.15)))])
                window_faces.append((start,start+1,start+2,start+3))
    if window_faces:
        mesh = bpy.data.meshes.new("City window rhythm")
        mesh.from_pydata(window_verts,[],window_faces)
        mesh.update()
        obj = bpy.data.objects.new("Positano shaded openings",mesh)
        bpy.context.collection.objects.link(obj)
        finish(obj,"Positano shaded openings",city_windows)
    if item["id"] == 1268998290:
        dome_mat = material("Santa Maria Assunta majolica",(.43,.55,.31),.5)
        ellipsoid("Santa Maria Assunta dome",(x,y,top+1),(7,7,7.5),dome_mat,3)
    building_count += 1
    neighbor_count += int(math.hypot(x,y)<250)
assert building_count > 600, f"City context unexpectedly empty: {building_count}"
assert neighbor_count > 5, f"Immediate OSM neighborhood missing: {neighbor_count}"
print("POSITANO_CONTEXT", building_count, "OSM footprints; DEM + coastline; illustrative facade heights")

# The road's plan comes from OSM, not the screenshots. Its 6m width, deck levels,
# parapets and retaining walls are a visual interpretation of the coarse relief.
roads_path=context_dir/"positano-roads-osm.json"
road_data=json.loads(roads_path.read_text())
assert road_data["source"].startswith("https://api.openstreetmap.org/api/0.6/map.json?")
assert road_data["license"]=="https://opendatacommons.org/licenses/odbl/1-0/"
assert roads_path.read_bytes()==(OUT/"positano-roads-osm.json").read_bytes(), "Public OSM road source differs"
road_verts,road_faces,wall_verts,wall_faces,edge_verts,edge_faces=[],[],[],[],[],[]
road_way_count=bridge_count=0
nearest_entry=float("inf")


def road_quad(vertices,faces,points):
    start=len(vertices)
    vertices.extend(points)
    faces.append(tuple(range(start,start+4)))


for item in road_data["elements"]:
    assert item["tags"].get("ref")=="SS163", "Unrelated road in SS163 source"
    points=[Vector((*local_point(point),0)) for point in item["geometry"]]
    assert len(points)>=2 and all(math.isfinite(value) for point in points for value in point)
    samples=[]
    for a,b in zip(points,points[1:]):
        steps_count=max(1,math.ceil((b-a).length/6))
        samples.extend(a.lerp(b,i/steps_count) for i in range(steps_count))
    samples.append(points[-1])
    stations=[]
    for i,p in enumerate(samples):
        if not (-1800<p.x<1250 and -350<p.y<1200):
            stations.append(None)
            continue
        tangent=samples[min(len(samples)-1,i+1)]-samples[max(0,i-1)]
        if tangent.length<.01:
            stations.append(None)
            continue
        tangent.normalize()
        side=Vector((-tangent.y,tangent.x,0))
        left,right=p+side*3,p-side*3
        heights=[rendered_ground(v.x,v.y) for v in (left,p,right)]
        if None in heights:
            stations.append(None)
            continue
        nearest_entry=min(nearest_entry,math.hypot(p.x-10,p.y-57))
        stations.append((left,right,side,max(heights)+.3,heights[0],heights[2]))
    bridge=item["tags"].get("bridge")=="yes"
    if bridge and stations[0] and stations[-1]:
        # A mapped crossing gets a thin deck, never an invented solid valley dam.
        # The profile is interpolated from the model, not an engineering survey.
        start,end=stations[0][3],stations[-1][3]
        for i,station in enumerate(stations):
            if station:
                left,right,side,z,hl,hr=station
                grade=start+(end-start)*i/(len(stations)-1)
                stations[i]=(left,right,side,max(z,grade),hl,hr)
    segments=0
    for a,b in zip(stations,stations[1:]):
        if a is None or b is None:
            continue
        al,ar,aside,az,alh,arh=a
        bl,br,bside,bz,blh,brh=b
        road_quad(road_verts,road_faces,[(ar.x,ar.y,az),(br.x,br.y,bz),(bl.x,bl.y,bz),(al.x,al.y,az)])
        for pa,pb,ha,hb,sa,sb,za,zb in [(al,bl,alh,blh,aside,bside,az,bz),(br,ar,brh,arh,-bside,-aside,bz,az)]:
            bottom_a,bottom_b=(za-.7,zb-.7) if bridge else (ha-.25,hb-.25)
            road_quad(wall_verts,wall_faces,[(pa.x,pa.y,za),(pb.x,pb.y,zb),(pb.x,pb.y,bottom_b),(pa.x,pa.y,bottom_a)])
            qa,qb=pa-sa*.25,pb-sb*.25
            road_quad(edge_verts,edge_faces,[(pa.x,pa.y,za+.05),(qa.x,qa.y,za+.05),(qb.x,qb.y,zb+.05),(pb.x,pb.y,zb+.05)])
        segments+=1
    if segments:
        road_way_count+=1
        bridge_count+=int(bridge)

assert road_way_count>5 and bridge_count>0, "Missing mapped SS163 road or crossings"
assert nearest_entry<15, f"Road does not reach the illustrative entry: {nearest_entry:.1f}m"
road_triangles=2*(len(road_faces)+len(wall_faces)+len(edge_faces))
assert 100<road_triangles<16000, f"Road geometry budget exceeded: {road_triangles}"
asphalt=material("SS163 weathered asphalt",(.18,.19,.19),.94)
for name,vertices,faces,mat in [("Mapped SS163 surface",road_verts,road_faces,asphalt),
                                ("Illustrative SS163 supports",wall_verts,wall_faces,cliff),
                                ("Illustrative SS163 edge coping",edge_verts,edge_faces,terrace)]:
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(vertices,[],faces)
    mesh.update()
    uv=mesh.uv_layers.new(name="Road world scale")
    for face in mesh.polygons:
        for index in face.loop_indices:
            p=mesh.vertices[mesh.loops[index].vertex_index].co
            uv.data[index].uv=(p.x/18,p.z/18)
    obj=bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(obj)
    finish(obj,name,mat)
print("SS163_CONTEXT",road_way_count,"mapped ways;",bridge_count,"mapped crossings;",road_triangles,"triangles; nearest entry",round(nearest_entry,2))
