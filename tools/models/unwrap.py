"""Blender's part (run with Blender's Python): the built model's pieces unwrapped (each object its own picture), the
shade of its creases baked (ambient occlusion), and written back as one OBJ with picture coordinates.
usage: python unwrap.py <dir with model.obj> <picture size> [ao samples]  -> model_uv.obj, <object>_ao.png"""
import bpy, sys, os
D, RES = sys.argv[1], int(sys.argv[2]); SAMP = int(sys.argv[3]) if len(sys.argv) > 3 else 16
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.obj_import(filepath=os.path.join(D, 'model.obj'), forward_axis='NEGATIVE_Z', up_axis='Y')
sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SAMP
sc.world = bpy.data.worlds.new('w'); sc.world.use_nodes = True
obs = [o for o in sc.objects if o.type == 'MESH']
for o in obs:
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.004, area_weight=0.0, scale_to_bounds=False)
    try: bpy.ops.uv.pack_islands(margin=0.004, rotate=True)
    except Exception as e: print('pack', e)
    bpy.ops.object.mode_set(mode='OBJECT')
    img = bpy.data.images.new(o.name + '_ao', RES, RES); img.generated_color = (1, 1, 1, 1)
    if not o.data.materials: o.data.materials.append(bpy.data.materials.new('mat'))
    for m in o.data.materials:
        m.use_nodes = True; nt = m.node_tree; n = nt.nodes.new('ShaderNodeTexImage'); n.image = img; nt.nodes.active = n
    bpy.ops.object.bake(type='AO', margin=4, use_clear=True)
    img.filepath_raw = os.path.join(D, o.name + '_ao.png'); img.file_format = 'PNG'; img.save()
    print('unwrapped and shaded', o.name, len(o.data.polygons), 'faces', flush=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.wm.obj_export(filepath=os.path.join(D, 'model_uv.obj'), forward_axis='NEGATIVE_Z', up_axis='Y', export_uv=True, export_normals=True,
                      export_materials=True, export_triangulated_mesh=True, export_material_groups=False, export_selected_objects=False)
print('done')
