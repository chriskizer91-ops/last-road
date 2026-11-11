"""redtail-2.glb -> the game's Redtail data: each piece's positions, normals, texture coordinates and triangles (model
coordinates: x forward, y up, z right, each moving piece's origin on its hinge), and the three baked pictures as
they are (WebP), all as base64 in one script: window.RT2_DATA = {pieces:{name:{pv,pos,nrm,uv,idx,n}}, tex:{a,n,o}}."""
import json, struct, base64, sys
src = sys.argv[1] if len(sys.argv) > 1 else 'redtail/versions/redtail-2/redtail-2.glb'
out = sys.argv[2] if len(sys.argv) > 2 else 'redtail/game/rt2-data.js'
b = open(src, 'rb').read()
L = struct.unpack('<I', b[12:16])[0]; J = json.loads(b[20:20 + L]); BIN = b[20 + L + 8:]
def view(i):
    v = J['bufferViews'][i]; o = v.get('byteOffset', 0); return BIN[o:o + v['byteLength']]
def acc(i):
    a = J['accessors'][i]; v = J['bufferViews'][a['bufferView']]; o = v.get('byteOffset', 0) + a.get('byteOffset', 0)
    n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a['type']]; sz = {5126: 4, 5123: 2, 5125: 4, 5121: 1}[a['componentType']]
    assert v.get('byteStride', n * sz) == n * sz, 'interleaved'
    return BIN[o:o + a['count'] * n * sz], a
b64 = lambda x: base64.b64encode(x).decode()
D = {'pieces': {}, 'tex': {}}
tris = 0
for nd in J['nodes']:
    m = J['meshes'][nd['mesh']]; assert len(m['primitives']) == 1; p = m['primitives'][0]; A = p['attributes']
    pos, pa = acc(A['POSITION']); nrm, _ = acc(A['NORMAL']); idx, ia = acc(p['indices'])
    e = {'pv': nd.get('translation', [0, 0, 0]), 'pos': b64(pos), 'nrm': b64(nrm), 'idx': b64(idx), 'n': ia['count'], 'i32': ia['componentType'] == 5125}
    if 'TEXCOORD_0' in A: uv, _ = acc(A['TEXCOORD_0']); e['uv'] = b64(uv)
    D['pieces'][nd['name']] = e; tris += ia['count'] // 3
    print(nd['name'], pa['count'], 'verts', ia['count'] // 3, 'tris', 'pivot', [round(v, 3) for v in e['pv']])
for im in J['images']:
    k = {'albedo_ao': 'a', 'normal': 'n', 'orm': 'o'}[im['name']]; D['tex'][k] = b64(view(im['bufferView']))
js = 'window.RT2_DATA=' + json.dumps(D, separators=(',', ':')) + ';\n'
open(out, 'w').write(js); print('total tris', tris, 'script MB', round(len(js) / 1e6, 2))
