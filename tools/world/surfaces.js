/* The ground's kind on a text grid, for picking places for jobs (e.g. where the salt ends). The world generator cut out of
   a build first (as tools/world/map.sh does, into <dir>/wg.js). Each letter is one ground code:
   g grass, d dirt, . strip (the salt pans are this code too), t trail, r rock, m mud, c concrete, ~ water, v gravel,
   a asphalt, u ruts, s sand (the dunes, the bars and beaches).
   usage: node tools/world/surfaces.js <dir> <bx0> <bx1> <by0> <by1> [step, default .25]   (brainstorm km: bx east, by north) */
const [W, bx0, bx1, by0, by1, st] = [process.argv[2], ...process.argv.slice(3).map(Number)], G = require(W + '/wg.js')(6), o = {}, S = st || .25;
const name = {}; for (const [k, v] of Object.entries(G.SF)) name[v] = k; console.log('codes:', JSON.stringify(name));
const L = { grass: 'g', dirt: 'd', strip: '.', trail: 't', rock: 'r', mud: 'm', concrete: 'c', water: '~', gravel: 'v', asphalt: 'a', ruts: 'u', sand: 's' }, ch = c => L[name[c]] || '?';
for (let by = by1; by >= by0 - 1e-9; by -= S * 2) { let line = ''; for (let bx = bx0; bx <= bx1 + 1e-9; bx += S) { G.sample(G.GX(bx), G.GZ(by), o); line += ch(o.code); } console.log(by.toFixed(2).padStart(6), line); }
let ax = '       '; for (let bx = bx0; bx <= bx1 + 1e-9; bx += S) ax += Math.abs(bx - Math.round(bx)) < 1e-6 ? String(Math.round(bx) % 10) : ' '; console.log(ax);
