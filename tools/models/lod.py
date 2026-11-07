"""Blender's part: a model's far shape. Each object of model_uv.obj thinned to about the given number of triangles
(Blender's Decimate, which keeps the picture coordinates, so the far shape wears the same picture; the wood
thinned gently, so a trunk still holds its crown up), written as
model_far.obj beside it. For things the game draws many of (trees, bushes, rocks): near, the full shape; far, this.
With --blob (a tree's crown, a bush, reeds: many small leafy pieces, which thinning alone tears to shards): the leaves
are first melted into one skin (Blender's voxel Remesh), thinned, and given back their picture coordinates from the
leaves they cover (Data Transfer, nearest face).
usage: /home/claude/bl/bin/python lod.py <model dir> <triangles> [--blob] [object=triangles ...]"""
import bpy, sys, os
D, TRI = sys.argv[1], int(sys.argv[2]); BLOB = '--blob' in sys.argv; PER = dict((a.split('=')[0], int(a.split('=')[1])) for a in sys.argv[3:] if '=' in a)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.obj_import(filepath=os.path.join(D, 'model_uv.obj'), forward_axis='NEGATIVE_Z', up_axis='Y')
import re
WOOD = re.compile(r'bark|wood|stem|trunk|branch|straw', re.I)
tri = lambda o: sum(len(p.vertices) - 2 for p in o.data.polygons)
def thin(o, r):
    if r >= 1: return
    m = o.modifiers.new('thin', 'DECIMATE'); m.decimate_type = 'COLLAPSE'; m.ratio = r; m.use_collapse_triangulate = True
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier='thin')
SRC = {}
def melt(q):
    src = q.copy(); src.data = q.data.copy(); bpy.context.scene.collection.objects.link(src); src.hide_render = True; SRC[q.name] = src
    ext = max(q.dimensions); m = q.modifiers.new('melt', 'REMESH'); m.mode = 'VOXEL'; m.voxel_size = max(ext / 26, .04)
    bpy.ops.object.select_all(action='DESELECT'); q.select_set(True); bpy.context.view_layer.objects.active = q; bpy.ops.object.modifier_apply(modifier='melt')
def back_uv(q):
    src = SRC.pop(q.name)
    if not q.data.uv_layers: q.data.uv_layers.new(name=src.data.uv_layers[0].name if src.data.uv_layers else 'UVMap')
    m = q.modifiers.new('uv', 'DATA_TRANSFER'); m.object = src; m.use_loop_data = True; m.data_types_loops = {'UV'}; m.loop_mapping = 'POLYINTERP_NEAREST'
    bpy.ops.object.select_all(action='DESELECT'); q.select_set(True); bpy.context.view_layer.objects.active = q
    try: bpy.ops.object.datalayout_transfer(modifier='uv')
    except Exception as e: print('layout', e)
    bpy.ops.object.modifier_apply(modifier='uv'); bpy.data.objects.remove(src)
for o in [o for o in bpy.context.scene.objects if o.type == 'MESH']:
    name, n, want = o.name, tri(o), PER.get(o.name, TRI)
    if n > want:
        # (by material: the wood (a trunk, its branches, a stem) thinned gently, so it still holds the crown up; the
        #  leaves and the rest take what's left of the budget)
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.separate(type='MATERIAL'); bpy.ops.object.mode_set(mode='OBJECT')
        parts = [q for q in bpy.context.selected_objects]; wood = [q for q in parts if q.data.materials and q.data.materials[0] and WOOD.search(q.data.materials[0].name)]
        nw = sum(tri(q) for q in wood); keepw = min(nw, max(int(want * .4), min(nw, 60))) if wood else 0
        rest = [q for q in parts if q not in wood]; nr = sum(tri(q) for q in rest)
        for q in wood: thin(q, keepw / max(nw, 1))
        for q in rest:
            if BLOB: melt(q)
        nr = sum(tri(q) for q in rest)
        for q in rest: thin(q, max(want - keepw, want * .3) / max(nr, 1))
        if BLOB:
            for q in rest: back_uv(q)
        bpy.ops.object.select_all(action='DESELECT')
        for q in parts: q.select_set(True)
        bpy.context.view_layer.objects.active = parts[0]; bpy.ops.object.join(); o = bpy.context.view_layer.objects.active; o.name = name; o.data.name = name
    print(name, n, '->', tri(o), 'triangles', flush=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.wm.obj_export(filepath=os.path.join(D, 'model_far.obj'), forward_axis='NEGATIVE_Z', up_axis='Y', export_uv=True, export_normals=True,
                      export_materials=False, export_triangulated_mesh=True, export_material_groups=False, export_selected_objects=False)
print('done')
