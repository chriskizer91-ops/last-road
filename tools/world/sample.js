/* the world on a grid: height, ground code and weights (for tools/world/draw.py); and the strips and the road */
const W = process.argv[2], N = +process.argv[3] || 400, G = require(W + '/wg.js')(6), H = G.HALF, o = {}, fs = require('fs');
const hb = new Float32Array(N * N), cb = new Uint8Array(N * N), wb = new Float32Array(N * N * 5);
for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = -H + (i + .5) / N * 2 * H, z = -H + (j + .5) / N * 2 * H; G.sample(x, z, o); const k = j * N + i;
  hb[k] = o.h; cb[k] = o.code; wb[k * 5] = o.grass; wb[k * 5 + 1] = o.rock; wb[k * 5 + 2] = o.sand; wb[k * 5 + 3] = o.salt; wb[k * 5 + 4] = o.wet; }
fs.writeFileSync(W + '/h.bin', Buffer.from(hb.buffer)); fs.writeFileSync(W + '/c.bin', Buffer.from(cb)); fs.writeFileSync(W + '/w.bin', Buffer.from(wb.buffer));
fs.writeFileSync(W + '/marks.json', JSON.stringify({ H, strips: G.GTS.map(s => ({ n: s.name, x: s.x, z: s.z, dx: s.dx, dz: s.dz, len: s.len })), road: G.GTR.P.filter((p, i) => i % 10 === 0) }));
console.log('sampled', N * N);
