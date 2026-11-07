// A helper's model code (function build(THREE){...}) run with three.js: every mesh, in its world place, written as one
// OBJ with an object per model and a group per material, plus materials.json (each material's colour) and stats.json.
// usage: node tools/models/build.mjs <code.js> <out-dir>      (three.js from salt-mini-plus viewer/node_modules)
import fs from 'fs'; import path from 'path';
const SMP = process.env.SMP || '/home/claude/salt-mini-plus';
const THREE = await import(SMP + '/viewer/node_modules/three/build/three.module.js');
const [code, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const src = fs.readFileSync(code, 'utf8');
let res = new Function('THREE', src + '\n;return build(THREE);')(THREE);
const models = (res && res.isObject3D) ? { model: res } : res;
let obj = '', vbase = 1, nbase = 1, tris = 0; const mats = {}, stats = {};
for (const [name, root] of Object.entries(models)) {
  root.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(root); let t0 = tris;
  obj += `o ${name}\n`;
  root.traverse(m => {
    if (!m.isMesh || !m.geometry) return;
    let g = m.geometry.clone(); g.applyMatrix4(m.matrixWorld); if (!g.attributes.normal) g.computeVertexNormals();
    // (a negative scale turns faces inside out: put them right)
    const flip = m.matrixWorld.determinant() < 0;
    const mat = Array.isArray(m.material) ? m.material[0] : m.material; const mn = ((m.name || (mat && mat.name) || 'mat') + '').replace(/[^a-zA-Z0-9_]/g, '_');
    if (!mats[mn]) mats[mn] = mat && mat.color ? '#' + mat.color.getHexString() : '#888888';
    const P = g.attributes.position, N = g.attributes.normal; const idx = g.index ? g.index.array : [...Array(P.count).keys()];
    for (let i = 0; i < P.count; i++) obj += `v ${P.getX(i).toFixed(4)} ${P.getY(i).toFixed(4)} ${P.getZ(i).toFixed(4)}\n`;
    for (let i = 0; i < N.count; i++) obj += `vn ${N.getX(i).toFixed(4)} ${N.getY(i).toFixed(4)} ${N.getZ(i).toFixed(4)}\n`;
    obj += `usemtl ${mn}\n`;
    for (let i = 0; i + 2 < idx.length; i += 3) {
      let [a, b, c] = [idx[i], idx[i + 1], idx[i + 2]]; if (flip) [b, c] = [c, b];
      obj += `f ${a + vbase}//${a + nbase} ${b + vbase}//${b + nbase} ${c + vbase}//${c + nbase}\n`; tris++;
    }
    vbase += P.count; nbase += N.count;
  });
  stats[name] = { tris: tris - t0, size: [box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z].map(v => +v.toFixed(3)), min: box.min.toArray().map(v => +v.toFixed(3)) };
}
fs.writeFileSync(path.join(out, 'model.obj'), obj); fs.writeFileSync(path.join(out, 'materials.json'), JSON.stringify(mats, null, 1));
fs.writeFileSync(path.join(out, 'stats.json'), JSON.stringify(stats, null, 1)); console.log(JSON.stringify(stats));
