"""The painted model photographed beside its sheet (Blender's Python): each object from the front, the right side and the
top (flat, no perspective) and three-quarter, in soft daylight, then a compare sheet: the reference picture on top,
the model's four views under it. usage: python render.py <model dir> <sheet.png> [size]  -> <object>_view_*.png, compare.png"""
import bpy, sys, os, math, mathutils
D, SHEET = sys.argv[1], sys.argv[2]; S = int(sys.argv[3]) if len(sys.argv) > 3 else 400
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.obj_import(filepath=os.path.join(D, 'model_uv.obj'), forward_axis='NEGATIVE_Z', up_axis='Y')
sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 12; sc.cycles.use_denoising = False
sc.render.resolution_x = S; sc.render.resolution_y = int(S * .75); sc.view_settings.view_transform = 'Standard'
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (.82, .83, .85, 1); w.node_tree.nodes['Background'].inputs[1].default_value = .9
sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.data.energy = 2.6; sun.rotation_euler = (math.radians(50), 0, math.radians(35)); sc.collection.objects.link(sun)
obs = [o for o in sc.objects if o.type == 'MESH']; out = []
for o in obs:
    tex = os.path.join(D, o.name + '_albedo_ao.png')
    m = bpy.data.materials.new(o.name + '_look'); m.use_nodes = True; nt = m.node_tree; bsdf = nt.nodes['Principled BSDF']; bsdf.inputs['Roughness'].default_value = .85
    if os.path.exists(tex):
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(tex); nt.links.new(t.outputs['Color'], bsdf.inputs['Base Color'])
    o.data.materials.clear(); o.data.materials.append(m)
for o in obs:
    for q in obs: q.hide_render = q is not o
    bb = [o.matrix_world @ mathutils.Vector(c) for c in o.bound_box]; lo = mathutils.Vector([min(v[i] for v in bb) for i in range(3)]); hi = mathutils.Vector([max(v[i] for v in bb) for i in range(3)])
    C = (lo + hi) / 2; ext = (hi - lo); R = max(ext) * .62 + .05
    for vn, d, ortho in (('front', (0, 0, 1), 1), ('right', (1, 0, 0), 1), ('top', (0, 1, 0), 1), ('three-quarter', (.75, .55, 1), 0)):
        cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
        # (blender's world: z up; the OBJ came in with y up turned to z: a direction (x, y, z) in the model is (x, -z, y) here)
        dv = mathutils.Vector((d[0], -d[2], d[1])).normalized(); Cb = mathutils.Vector((C[0], C[1], C[2]))
        cam.location = Cb + dv * (R * 6 if ortho else R * 3.2)
        up = mathutils.Vector((0, 1, 0)) if vn == 'top' else mathutils.Vector((0, 0, 1))
        cam.rotation_euler = (-dv).to_track_quat('-Z', 'Y' if vn != 'top' else 'Y').to_euler()
        if vn == 'top': cam.rotation_euler = mathutils.Euler((0, 0, 0))
        if ortho: cam.data.type = 'ORTHO'; cam.data.ortho_scale = R * 2.15
        else: cam.data.lens = 50; cam.data.sensor_width = 36
        p = os.path.join(D, f'{o.name}_view_{vn}.png'); sc.render.filepath = p; bpy.ops.render.render(write_still=True); out.append(p)
        bpy.data.objects.remove(cam)
    print('rendered', o.name, flush=True)
import json; json.dump({'objects': [o.name for o in obs]}, open(os.path.join(D, 'renders.json'), 'w'))
