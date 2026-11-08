/* =====================================================================================
   BEYOND THE LAST ROAD (working title), its first page: Salt & Sand with the bush plane, made Christopher's
   story game's own. What this adds (last-road src/lr-game.js, put in by src/lr_patch.py):
   - THE TRUCK: the Rock & Mud you drive is its play model, 49,654 triangles (his pick after the look test,
     Nov 7 2026): the game's own Rock & Mud cut down, the Studio 2 baked onto it (LR_TRUCK, packed by
     tools/truck_pack.py). It's drawn by the game's own car drawing (the wheels rolling and steering, the
     suspension, the shadows), with the baked pictures in the plane's material (120). Phones load the pictures
     at 1024, laptops at 2048. The Studio 2 itself stays for the bay (the Outfitter).
   - THE PLANE in Wilderness Olive, the story plane's paint (the paint button is off: paint is the Outfitter's).
   - THE PLANE'S CHASE CAMERA climbs, dives and banks round with it (it used to stay level behind it).
   ===================================================================================== */
const LRT={d:null,mesh:null,tex:null,texN:0,T:new WeakMap(),loc:null,locP:null,
  phone:(()=>{try{return matchMedia('(hover: none)').matches||Math.min(screen.width,screen.height)<600;}catch(_){return false;}})()};
/* the play model is yours whenever you're in the Rock & Mud (not the plane, not another car) */
function LR_PLAY(t){return !!(t&&!t.rt&&t.build&&(t.build.kit||t.build.id)==='crawler'&&window.LR_TRUCK);}
function lrTexFrom(b64,cb){const an=gl.getExtension('EXT_texture_filter_anisotropic'),im=new Image();
  im.onload=()=>{let src=im;
    /* (a phone: half size, 1024 for the body) */
    if(LRT.phone){const c=document.createElement('canvas');c.width=im.width>>1;c.height=im.height>>1;const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(im,0,0,c.width,c.height);src=c;}
    const tx=gl.createTexture();gl.activeTexture(gl.TEXTURE15);gl.bindTexture(gl.TEXTURE_2D,tx);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,src);gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    if(an)gl.texParameterf(gl.TEXTURE_2D,an.TEXTURE_MAX_ANISOTROPY_EXT,8);gl.bindTexture(gl.TEXTURE_2D,null);gl.activeTexture(gl.TEXTURE0);cb(tx,src.width,src.height);};
  im.src='data:image/webp;base64,'+b64;}
function lrBuild(){
  const D=window.LR_TRUCK;if(!D)return false;const ms={};
  for(const [nm,e] of Object.entries(D.pieces)){
    const pos=new Float32Array(RT_U8(e.pos).buffer),nrm=new Float32Array(RT_U8(e.nrm).buffer),uv=new Float32Array(RT_U8(e.uv).buffer),m8=RT_U8(e.mat),n=pos.length/3;
    const col=new Float32Array(n*4),mat=new Float32Array(n);
    /* (the glass keeps the game's own glass materials; the underside (16 in the bake's numbering, which is the game's metal)
       is the game's plain colour, dark, so it doesn't mirror the sky) */
    for(let k=0;k<n;k++){const m=m8[k];mat[k]=m===16?0:m;const c=m===120?1:m===16?.03:.025;col[k*4]=col[k*4+1]=col[k*4+2]=c;col[k*4+3]=0;}
    const ib=RT_U8(e.idx),idx=e.i32?new Uint32Array(ib.buffer):new Uint16Array(ib.buffer);
    ms[nm]=makeMesh({pos,nrm,col,mat,idx,uv});ms[nm].tris=e.n/3;}
  LRT.mesh=ms;LRT.tex={};LRT.px=0;
  for(const k of ['a','n','o'])lrTexFrom(D.tex[k],(tx,w,h)=>{LRT.tex[k]=tx;LRT.texN++;LRT.px=w;});
  return true;}
/* the game's truck for your Rock & Mud: its numbers as they are, the play model's meshes in place of its own */
function lrT(T){if(!LRT.mesh&&!lrBuild())return T;if(LRT.texN<3)return T;
  let C=LRT.T.get(T);if(!C){C=Object.create(T);Object.assign(C,{body:LRT.mesh.body,hood:null,hide:null,engineOut:false,bay:null,rider:null,wheel:LRT.mesh.wheel,wheelR:LRT.mesh.wheel,
    tris:window.LR_TRUCK.tris});LRT.T.set(T,C);}return C;}
/* (its three pictures on the plane's units, as the plane binds its own: one is drawn after the other) */
function lrBind(){if(LRT.texN<3)return;
  if(LRT.locP!==CUR.p){LRT.locP=CUR.p;LRT.loc=['uRTa','uRTn','uRTo'].map(n=>gl.getUniformLocation(CUR.p,n));}
  const U=[[LRT.loc[0],LRT.tex.a,13],[LRT.loc[1],LRT.tex.n,14],[LRT.loc[2],LRT.tex.o,15]];
  for(const [loc,tx,unit] of U){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,tx);if(loc)gl.uniform1i(loc,unit);}gl.activeTexture(gl.TEXTURE0);}
/* while you drive the play truck, the Studio 2 isn't made or kept for the road (it's the Outfitter's) */
const LR_S2F=s2For;
s2For=function(i){lrSandBuilds();if(GAME.state==='drive'&&LR_PLAY(GAME.car)&&GAME.car.bi===i)return null;return LR_S2F(i);};

/* ---------- the Heron's own paint (his picture A06: olive over cream, yellow wingtips and tail band, LR-OLV,
   "Heron" on the cowl), laid on by livery.py; Wilderness Olive if it's missing ---------- */
if(window.LR_HERON_PAINT&&window.RT2_DATA&&RT2_DATA.paints){RT2_DATA.paints.heron=LR_HERON_PAINT;RT_PAINTS.push({id:'heron',name:'THE HERON'});}
RT.paint=Math.max(RT_PAINTS.findIndex(p=>p.id==='heron'),RT_PAINTS.findIndex(p=>p.id==='wilderness-olive'));

/* ---------- the truck in the bay (its Studio 2) in Station Sand, weathered: the colour of the play truck's baked
   paint (the body's middle tan, #bca081), dark lower trim; the play truck itself wears the baked picture ---------- */
const LR_SAND={paint:'#bca081',clad:'#3a3630',dirt:.35};
function lrSandBuilds(){for(const b of BUILDS)if(b&&!b.machine&&(b.kit||b.id)==='crawler'&&!b.__lrSand){Object.assign(b,LR_SAND);b.__lrSand=1;}}
{const st=document.createElement('style');st.textContent='#rtPaintB{display:none!important}';document.head.appendChild(st);}

/* ---------- the plane's chase camera: behind it along where it's going, climbing, diving and turning with it ---------- */
const LRC={e:null,l:null,on:false};
function lrPlaneChase(t,dt){
  const M=t.M,F=[M[0],M[3],M[6]],v=t.v,sp=Math.hypot(v[0],v[1],v[2]),W=RANCH.W;
  /* (on the ground: its heading; in the air: halfway between where the nose points and where it's going) */
  let d=norm2([F[0],0,F[2]]);
  if(t.air||sp>14){const vd=[v[0]/Math.max(sp,1e-3),v[1]/Math.max(sp,1e-3),v[2]/Math.max(sp,1e-3)],k=clamp((sp-8)/20,0,1);
    d=norm2([F[0]*(1-.5*k)+vd[0]*.5*k,F[1]*(1-.5*k)+vd[1]*.5*k,F[2]*(1-.5*k)+vd[2]*.5*k]);}
  const back=12.5+clamp(sp*.05,0,3),eyeW=[t.p[0]-d[0]*back,t.p[1]-d[1]*back+3.0,t.p[2]-d[2]*back],lookW=[t.p[0]+d[0]*7,t.p[1]+d[1]*7+.9,t.p[2]+d[2]*7];
  /* (a cut when the camera's told to, or when the plane has jumped: a reset, a new spot) */
  const cut=CAM.cut||!LRC.on||!LRC.e||Math.hypot(LRC.e[0]-eyeW[0],LRC.e[1]-eyeW[1],LRC.e[2]-eyeW[2])>40;LRC.on=true;
  if(cut){LRC.e=eyeW;LRC.l=lookW;}else{const ke=1-Math.exp(-dt*4.5),kl=1-Math.exp(-dt*8);
    const ky=1-Math.exp(-dt*9);LRC.e=[LRC.e[0]+(eyeW[0]-LRC.e[0])*ke,LRC.e[1]+(eyeW[1]-LRC.e[1])*ky,LRC.e[2]+(eyeW[2]-LRC.e[2])*ke];
    LRC.l=[LRC.l[0]+(lookW[0]-LRC.l[0])*kl,LRC.l[1]+(lookW[1]-LRC.l[1])*kl,LRC.l[2]+(lookW[2]-LRC.l[2])*kl];}
  const g=W.heightAt(LRC.e[0],LRC.e[2])+1.4;if(LRC.e[1]<g)LRC.e[1]=g;
  return {eye:LRC.e.slice(),fwd:norm2(sub2(LRC.l,LRC.e)),up:[0,1,0],fov:1.0};}
const LR_CA=camAuto;
camAuto=function(t,dt){
  /* (on foot: your own eyes) */
  if(LRW.on){LRC.on=false;return lrWalkStep(dt);}
  /* (a fixed view for the tools, as the game's own camera has) */
  if(CAM.over){const o=CAM.over;LRC.on=false;return {eye:o.eye.slice(),fwd:norm2(sub2(o.at,o.eye)),up:[0,1,0],fov:o.fov||1};}
  if(t&&t.rt&&CAMS[APP.cam]==='Chase'&&GAME.state==='drive'&&!APP.orbit&&!CAM.rear&&!JUMP.on){const r=LR_CA(t,dt);if(r)return r;return lrPlaneChase(t,dt);}
  LRC.on=false;return LR_CA(t,dt);};
window.__lr={LRT,LR_PLAY,lrBuild,LRC};

/* ---------- THE DISTANT LAND (Ground Truth's world is 40 miles across: the escarpment, the big dunes, the cones and
   the mesas have to be seen from far off). Past the engine's far tiles (2 km round you), a ring of 4 km tiles, a
   point every 256 m, out to 26 km: the same land (the world's own sample), the same ground material, made here a
   tile a frame (about 2 ms each) and kept until you've gone well past. Sunk 60 m where the nearer tiles are, so
   they always show over it. The fog thinned to match (each time of day's own fog, about a seventh as thick), so
   you can see that far ---------- */
const LRD={tiles:new Map(),FT:4096,st:256,R:26000,R0:26000,on:true,made:0,ms:0,tris:0};
/* (how far: 26 km on the ground, further the higher you are, up to the whole map: 55 km from 2,500 m) */
function LRD_FAR(){return LRD.on&&typeof WG!=="undefined"&&WG.gtPlace?LRD.R:0;}
function lrDistReach(e){LRD.R=Math.min(70000,LRD.R0+12*Math.max(0,e[1]-50));}
function lrDistMake(tx,tz){
  const t0=performance.now(),st=LRD.st,FT=LRD.FT,n=FT/st+1,nb=n+2,x0=tx*FT,z0=tz*FT,o={},Hh=new Float64Array(nb*nb),Wt=new Float32Array(n*n*4),GM=new Uint8Array(n*n).fill(40);
  for(let j=0;j<nb;j++)for(let i=0;i<nb;i++){const x=x0+(i-1)*st,z=z0+(j-1)*st;WG.sample(x,z,o);Hh[j*nb+i]=o.code===WG.SF.water?Math.min(o.h,o.wl):o.h;
    if(i>0&&j>0&&i<=n&&j<=n){const k=(j-1)*n+i-1;Wt[k*4]=o.sand>.02?-o.sand:o.grass;Wt[k*4+1]=o.rock;Wt[k*4+2]=o.salt>.02?-o.salt:o.mud*.5;Wt[k*4+3]=o.code===WG.SF.water?.6:1;GM[k]=o.gm||40;}}
  /* (rock where it's steep, as the near ground has it) */
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const b=(j+1)*nb+i+1,k=j*n+i,hx=Hh[b-1]-Hh[b+1],hz=Hh[b-nb]-Hh[b+nb],ny=2*st/Math.hypot(hx,2*st,hz),sl=Math.sqrt(Math.max(0,1-ny*ny))/Math.max(ny,.05);
    const rs=(sl<.3?0:Math.min(1,(sl-.3)/.45))*(Wt[k*4]<0||Wt[k*4+2]<0?.6:1);if(rs>Wt[k*4+1]){Wt[k*4+1]=rs;if(Wt[k*4]>0)Wt[k*4]*=1-rs*.8;}}
  const nv=n*n+4*n*2,P=new Float32Array(nv*3),N=new Float32Array(nv*3),C=new Float32Array(nv*4),M=new Float32Array(nv).fill(40),I=[];let v=0,ymin=1e9,ymax=-1e9;
  const put=(i,j,dy)=>{const b=(j+1)*nb+i+1,k=j*n+i,hx=Hh[b-1]-Hh[b+1],hz=Hh[b-nb]-Hh[b+nb],l=Math.hypot(hx,2*st,hz);
    P[v*3]=i*st;P[v*3+1]=Hh[b]-dy;P[v*3+2]=j*st;N[v*3]=hx/l;N[v*3+1]=2*st/l;N[v*3+2]=hz/l;C[v*4]=Wt[k*4];C[v*4+1]=Wt[k*4+1];C[v*4+2]=Wt[k*4+2];C[v*4+3]=Wt[k*4+3];M[v]=GM[k];
    if(!dy){ymin=Math.min(ymin,Hh[b]);ymax=Math.max(ymax,Hh[b]);}return v++;};
  for(let j=0;j<n;j++)for(let i=0;i<n;i++)put(i,j,0);
  for(let j=0;j<n-1;j++)for(let i=0;i<n-1;i++){const p=j*n+i,q=p+1,r=p+n,s=r+1;I.push(p,s,q,p,r,s);}
  const edge=(list,flip)=>{for(let e=0;e<list.length-1;e++){const [ia,ja]=list[e],[ib,jb]=list[e+1],a=ja*n+ia,b=jb*n+ib,c=put(ia,ja,40),d=put(ib,jb,40);if(flip)I.push(a,c,b,b,c,d);else I.push(a,b,c,b,d,c);}};
  const top=[],bot=[],lef=[],rig=[];for(let a=0;a<n;a++){top.push([a,0]);bot.push([a,n-1]);lef.push([0,a]);rig.push([n-1,a]);}
  edge(top,false);edge(bot,true);edge(lef,true);edge(rig,false);
  const m=makeMesh({pos:P.subarray(0,v*3),nrm:N.subarray(0,v*3),col:C.subarray(0,v*4),mat:M.subarray(0,v),idx:new Uint16Array(I),tris:I.length/3});m.tris=I.length/3;
  LRD.made++;LRD.ms+=performance.now()-t0;
  return {tx,tz,x0,z0,m,mn:[x0,ymin-70,z0],mx:[x0+FT,ymax+5,z0+FT]};
}
/* each frame: the tiles in reach that are missing (nearest first, one made), those far out of reach let go */
/* (as many a frame as fit in a few milliseconds: 6 ms, or 16 while the ring is still mostly missing; all at once for the tests) */
function lrDistUpdate(e,all){
  if(!LRD_FAR())return;const FT=LRD.FT,R=LRD.R,cx=Math.floor(e[0]/FT),cz=Math.floor(e[2]/FT),k=Math.ceil(R/FT)+1,want=[];
  for(let a=cx-k;a<=cx+k;a++)for(let b=cz-k;b<=cz+k;b++){const key=a+','+b;if(LRD.tiles.has(key))continue;
    const dx=Math.max(a*FT-e[0],0,e[0]-(a+1)*FT),dz=Math.max(b*FT-e[2],0,e[2]-(b+1)*FT),d=Math.hypot(dx,dz);if(d>R)continue;
    if(Math.abs((a+.5)*FT)>WG.HALF+FT||Math.abs((b+.5)*FT)>WG.HALF+FT)continue;want.push([d,a,b,key]);}
  want.sort((p,q)=>p[0]-q[0]);const t0=performance.now(),budget=all?1e9:LRD.tiles.size<40?16:6;
  for(const w of want){LRD.tiles.set(w[3],lrDistMake(w[1],w[2]));if(performance.now()-t0>budget)break;}
  for(const [key,t] of LRD.tiles){const dx=Math.max(t.x0-e[0],0,e[0]-t.x0-FT),dz=Math.max(t.z0-e[2],0,e[2]-t.z0-FT);if(Math.hypot(dx,dz)>R+2*FT){freeMesh(t.m);LRD.tiles.delete(key);}}
}
/* drawn after the far tiles (drawWorld), sunk where they are */
function lrDistDraw(u,e,F){
  if(!LRD_FAR())return 0;lrDistReach(e);lrDistUpdate(e);const W=WORLD;let tris=0;
  if(u.uFarDrop)gl.uniform4f(u.uFarDrop,1,W.farR-350,W.farR+250,60);
  const D=LRD.dbg={n:0,far:0,vis:0,near:0,drawn:0,e:[Math.round(e[0]),Math.round(e[1]),Math.round(e[2])]};
  for(const t of LRD.tiles.values()){D.n++;const d=boxDist(e,t.mn,t.mx);if(d>LRD.R){D.far++;continue;}if(!boxVisible(F,t.mn,t.mx)){D.vis++;continue;}
    /* (wholly inside the far tiles' ring: hidden under them anyway) */
    const far=Math.hypot(Math.max(Math.abs(t.x0-e[0]),Math.abs(t.x0+LRD.FT-e[0])),Math.max(Math.abs(t.z0-e[2]),Math.abs(t.z0+LRD.FT-e[2])));if(far<W.farR-400){D.near++;continue;}D.drawn++;
    atM(u,t.x0,0,t.z0);drawMesh(t.m);tris+=t.m.tris;}
  LRD.tris=tris;return tris;}
window.__lr=Object.assign(window.__lr||{},{LRD,lrDistUpdate});

/* ---------- HIS MODELS IN THE WORLD (src/lr-props.js; where each stands is the world's: WG.GTP). Each is made the
   first time you come within its distance (its block unzipped, its picture loaded: half size on a phone), drawn in
   the plane's material (its colour picture, a flat normal, rough and not metal), and into the sun's shadow ---------- */
const LRP={mesh:new Map(),tex:new Map(),busy:new Set(),one:null,M:new Float32Array(16),drawn:0,tris:0};
function lrPropTex1(){if(LRP.one)return;const mk=(r,g,b)=>{const t=gl.createTexture();gl.activeTexture(gl.TEXTURE15);gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([r,g,b,255]));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);return t;};
  LRP.one={n:mk(128,128,255),o:mk(255,218,0)};gl.activeTexture(gl.TEXTURE0);}
async function lrPropMake(key){
  const [id,obj]=key.split('/'),E=window.LR_PROPS&&LR_PROPS[id]&&LR_PROPS[id][obj];if(!E){LRP.mesh.set(key,null);return;}
  try{const m=await lrDecode(E,120);LRP.mesh.set(key,m);
    lrTexFrom((E.tex||LR_PROPS[id][E.texOf].tex).replace(/^data:image\/webp;base64,/,''),tx=>LRP.tex.set(key,tx));}
  catch(e){console.warn('model '+key+': '+(e&&e.message||e));LRP.mesh.set(key,null);}}
/* a packed object (tools/props_pack.py) made a mesh: its block unzipped, its points across its box, in material mt */
async function lrDecode(E,mt){const bin=Uint8Array.from(atob(E.z),c=>c.charCodeAt(0));
  const buf=new Uint8Array(await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
  const nv=E.nv,q=new Uint16Array(buf.buffer,0,nv*3),nq=new Int8Array(buf.buffer,nv*6,nv*4),uq=new Uint16Array(buf.buffer,nv*10,nv*2),ib=buf.slice(nv*14).buffer;
  const pos=new Float32Array(nv*3),nrm=new Float32Array(nv*3),uv=new Float32Array(nv*2),col=new Float32Array(nv*4).fill(1),mat=new Float32Array(nv).fill(mt);
  for(let k=0;k<nv;k++){for(let c=0;c<3;c++){pos[k*3+c]=E.min[c]+q[k*3+c]/65535*(E.max[c]-E.min[c]);nrm[k*3+c]=nq[k*4+c]/127;}uv[k*2]=uq[k*2]/65535;uv[k*2+1]=uq[k*2+1]/65535;col[k*4+3]=0;}
  const idx=E.i32?new Uint32Array(ib):new Uint16Array(ib),m=makeMesh({pos,nrm,col,mat,idx,uv});m.tris=E.n/3;return m;}
/* a placed model's matrix: turned by its yaw, stood on the ground where it is (the world's own height there) */
function lrPropM(p){if(p.y===undefined){const o={};p.y=WG.sample(p.x,p.z,o).h+(p.dy||0);}const c=Math.cos(p.yaw),s=Math.sin(p.yaw),M=LRP.M;
  M[0]=c;M[1]=0;M[2]=-s;M[3]=0;M[4]=0;M[5]=1;M[6]=0;M[7]=0;M[8]=s;M[9]=0;M[10]=c;M[11]=0;M[12]=p.x-RO[0];M[13]=p.y-RO[1];M[14]=p.z-RO[2];M[15]=1;return M;}
function lrPropBox(p){if(!p.mn){const E=LR_PROPS[p.id]&&LR_PROPS[p.id][p.obj];if(!E)return null;const r=Math.hypot(Math.max(-E.min[0],E.max[0]),Math.max(-E.min[2],E.max[2]));if(p.y===undefined)lrPropM(p);
    p.mn=[p.x-r,p.y+E.min[1]-1,p.z-r];p.mx=[p.x+r,p.y+E.max[1]+1,p.z+r];}return p.mn;}
function lrPropsDraw(u,e,F,probe){
  if(probe||!window.LR_PROPS||typeof WG==='undefined'||!WG.GTP)return 0;lrPropTex1();let tris=0,n=0;
  if(LRP.locP!==CUR.p){LRP.locP=CUR.p;LRP.loc=['uRTa','uRTn','uRTo'].map(q=>gl.getUniformLocation(CUR.p,q));}
  for(const p of WG.GTP){const d=Math.hypot(p.x-e[0],p.z-e[2]);if(d>p.far)continue;const key=p.id+'/'+p.obj;
    if(!LRP.mesh.has(key)){if(!LRP.busy.has(key)){LRP.busy.add(key);lrPropMake(key);}continue;}
    const m=LRP.mesh.get(key),tx=LRP.tex.get(key);if(!m||!tx)continue;if(!lrPropBox(p)||!boxVisible(F,p.mn,p.mx))continue;
    gl.uniformMatrix4fv(u.uM,false,lrPropM(p));
    const U=[[LRP.loc[0],tx,13],[LRP.loc[1],LRP.one.n,14],[LRP.loc[2],LRP.one.o,15]];
    for(const [loc,t,unit] of U){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);if(loc)gl.uniform1i(loc,unit);}gl.activeTexture(gl.TEXTURE0);
    drawMesh(m);tris+=m.tris;n++;}
  LRP.drawn=n;LRP.tris=tris;return tris;}
function lrPropsShadow(u,F,e,maxD){
  if(!window.LR_PROPS||typeof WG==='undefined'||!WG.GTP)return 0;let tris=0;
  for(const p of WG.GTP){if(Math.hypot(p.x-e[0],p.z-e[2])>Math.min(maxD+60,p.far))continue;const m=LRP.mesh.get(p.id+'/'+p.obj);if(!m||!lrPropBox(p)||!boxVisible(F,p.mn,p.mx))continue;
    gl.uniformMatrix4fv(u.uM,false,lrPropM(p));drawMesh(m);tris+=m.tris;}
  return tris;}
window.__lr=Object.assign(window.__lr||{},{LRP});

/* ---------- HIS PLANTS AND ROCKS (F01 trees, F04 bushes, F07 termite mounds, F06 boulders): where each stands is the
   world's (gt-world.js: GT_TSH, in the chunks' trees), drawn as the world draws its own trees, instanced, near in full
   and far in the thinned shape (<object>~far), each in its own picture (material 121: the plane's, tinted by the tree's
   colour). The world's seven shapes stay first; until a model is made its place holds a mesh of nothing.
   Each kind has its own reach: a bush is not drawn past 260 m, a small rock past 180 (two thirds that on a phone; the
   world's own reach beyond). Each is drawn in full only within 60 m (40 on a phone), in the shadows too */
const LRF={on:false,tx:new Map(),one:null,loc:null,locP:null,made:0,D2:[]};
{const ts0=treeShapes;treeShapes=function(){const out=ts0(),L=(typeof WG!=='undefined'&&WG.GTT)||[];if(!L.length)return out;
  const none=()=>{const m=makeMesh({pos:new Float32Array(9),nrm:new Float32Array([0,1,0,0,1,0,0,1,0]),col:new Float32Array(12),mat:new Float32Array(3),idx:new Uint16Array([0,1,2])});m.tris=0;return m;};
  if(out.length!==WG.GTV0)console.warn('the world has '+out.length+' tree shapes, not '+WG.GTV0+': his plants will be wrong');
  L.forEach((t,i)=>{out.push([none(),none()]);const v=out.length-1,E=window.LR_PROPS&&LR_PROPS[t[0]]&&LR_PROPS[t[0]][t[1]];
    LRF.D2[v]=t[3]?t[3]*t[3]:1e10;
    if(!E)return;const F=LR_PROPS[t[0]][t[1]+'~far']||E;
    (async()=>{try{const near=await lrDecode(E,121),far=F===E?near:await lrDecode(F,121);
      lrTexFrom(E.tex.replace(/^data:image\/webp;base64,/,''),tx=>{near.tx=far.tx=tx;TREES.shapes[v]=[near,far];LRF.made++;});}
      catch(e){console.warn('plant '+t.join('/')+': '+(e&&e.message||e));}})();});
  LRF.on=true;return out;};}
/* (each shape's picture, before its instanced draw: in the shadow passes there is no picture to bind to, harmlessly) */
function lrTreeTex(tx){lrPropTex1();if(LRF.locP!==CUR.p){LRF.locP=CUR.p;LRF.loc=['uRTa','uRTn','uRTo'].map(q=>gl.getUniformLocation(CUR.p,q));}
  if(!LRF.loc[0])return;const U=[[LRF.loc[0],tx,13],[LRF.loc[1],LRP.one.n,14],[LRF.loc[2],LRP.one.o,15]];
  for(const [loc,t,unit] of U){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);if(loc)gl.uniform1i(loc,unit);}gl.activeTexture(gl.TEXTURE0);}
/* (for the tests: how many of each of his plants and rocks stand within r of x, z, in the chunks made so far) */
function lrFloraNear(x,z,r){const out={},L=WG.GTT||[];for(const c of chunkList()){const T=c.st&&c.st.trees;if(!T)continue;
  for(let o=0;o<T.length;o+=12){const v=T[o+7]|0;if(v<WG.GTV0||Math.hypot(T[o]-x,T[o+2]-z)>r)continue;const k=L[v-WG.GTV0][1];out[k]=(out[k]||0)+1;}}return out;}
window.__lr=Object.assign(window.__lr||{},{LRF,lrFloraNear,WG,lrStat:()=>Object.assign({},RANCH.stat,{lra:LRA.tris,lrp:LRP.tris,lrd:LRD.tris})});

/* ---------- THE TRUCK AND THE HERON: you drive one, the other waits. Driving, the Heron stands where you left it
   (at first in front of the hangar at Roadhead); drive up to it, stop, and HERON (E on a keyboard) puts you in it.
   Flying, the truck is waiting beside the runway at the strip nearest you; land there, stop, and TRUCK puts you in
   it, the Heron left standing where you stopped. The button shows only when the swap can happen ---------- */
const LRV={parked:null,stripI:-1,btn:null,planePose:null,can:''};
const lrYaw=t=>Math.atan2(-t.M[6],t.M[0]);
function lrStripAt(x,z,m){const G=WG.GTS;for(let i=0;i<G.length;i++){const S=G[i],u=(x-S.x)*S.dx+(z-S.z)*S.dz,v=-(x-S.x)*S.dz+(z-S.z)*S.dx;if(Math.abs(u)<S.len/2+m&&Math.abs(v)<S.hw+m)return i;}return -1;}
function lrTruckSpot(S){const u=-S.len/2+70,v=S.hw+14;return {x:S.x+S.dx*u-S.dz*v,z:S.z+S.dz*u+S.dx*v,yaw:Math.atan2(-S.dz,S.dx)};}
function lrPlaneHome(){const S=WG.GTS[0],u=-150,v=36;return {x:S.x+S.dx*u-S.dz*v,z:S.z+S.dz*u+S.dx*v,yaw:Math.atan2(-S.dz,S.dx)};}
/* a vehicle made only to stand somewhere: the truck, or the Heron (the game's own maker, with the plane asked for) */
function lrStandIn(plane,pose){const w=RT.want;RT.want=plane;let o=null;
  try{o=makeCar(APP.bi,RANCH.world,simOpts(),plusK(BUILDS[APP.bi].car),plusG(BUILDS[APP.bi].car));}catch(e){console.warn('stand-in',e);}finally{RT.want=w;}
  if(o)lrStand(o,pose);return o;}
function lrStand(o,pose){const y=RANCH.W.heightAt(pose.x,pose.z);o.place([pose.x,y+.05,pose.z],pose.yaw);for(const w of o.wheels){w.comp=.35*(w.travel||.12);w.ang=0;w.w=0;}}
const lrParked=()=>GAME.state==='drive'&&LRV.parked?LRV.parked:null;
function lrNearStrip(x,z,r){const G=WG.GTS;let b=-1,bd=r;for(let i=0;i<G.length;i++){const d=Math.hypot(G[i].x-x,G[i].z-z)-G[i].len/2;if(d<bd){bd=d;b=i;}}return b;}
function lrParkTick(){
  const t=GAME.car;if(!t||GAME.state!=='drive'||typeof WG==='undefined'||!WG.GTS)return;
  if(t.rt){const i=lrNearStrip(t.p[0],t.p[2],6000);
    if(i>=0&&i!==LRV.stripI){LRV.stripI=i;const sp=lrTruckSpot(WG.GTS[i]);if(LRV.parked&&!LRV.parked.rt)lrStand(LRV.parked,sp);else LRV.parked=lrStandIn(false,sp);}
    if(i<0&&LRV.parked&&!LRV.parked.rt&&Math.hypot(LRV.parked.p[0]-t.p[0],LRV.parked.p[2]-t.p[2])>9000)LRV.parked=null,LRV.stripI=-1;}
  else if(!LRV.parked||!LRV.parked.rt)LRV.parked=lrStandIn(true,LRV.planePose||lrPlaneHome());
  /* can you swap now? */
  const sp=Math.hypot(t.v[0],t.v[1],t.v[2]);let can='';
  if(t.rt){const h=t.p[1]-RANCH.W.heightAt(t.p[0],t.p[2]);if(sp<3&&h<3&&lrStripAt(t.p[0],t.p[2],40)>=0)can='TRUCK';}
  else{const P=LRV.parked;if(P&&P.rt&&sp<3&&Math.hypot(P.p[0]-t.p[0],P.p[2]-t.p[2])<45)can='HERON';}
  LRV.can=can;if(LRV.btn){LRV.btn.hidden=!can;if(can&&LRV.btn.textContent!==can)LRV.btn.textContent=can;}
  if(LRV.foot)LRV.foot.hidden=!lrWalkCan();}
function lrSwap(){
  const t=GAME.car;if(!t||GAME.state!=='drive')return false;lrParkTick();
  if(LRV.can==='TRUCK'){const i=lrStripAt(t.p[0],t.p[2],40),P=lrTruckSpot(WG.GTS[i]),keep=t;LRV.planePose={x:t.p[0],z:t.p[2],yaw:lrYaw(t)};
    rtFly(false);placeCar(P.x,P.z,P.yaw);LRV.parked=keep;LRV.stripI=-1;say('THE TRUCK',1.6);return true;}
  if(LRV.can==='HERON'){const P=LRV.parked,keep=t,pose={x:P.p[0],z:P.p[2],yaw:lrYaw(P)};
    rtFly(true);placeCar(pose.x,pose.z,pose.yaw);LRV.parked=keep;LRV.stripI=lrNearStrip(pose.x,pose.z,6000);LRV.planePose=null;return true;}
  say(t.rt?'LAND AT A STRIP AND STOP':'DRIVE UP TO THE HERON AND STOP',2);return false;}
function lrParkedDraw(eye){
  lrParkTick();const P=lrParked();if(!P)return 0;const d=Math.hypot(P.p[0]-eye[0],P.p[2]-eye[2]);if(d>900)return 0;
  return drawWorldCar(P,null,0,d>260,false)||0;}
/* the button, on the phone's right-hand column, at the top; E on a keyboard */
function lrSwapUI(){if(LRV.btn)return;const col=document.querySelector('#touch .tside.R');if(!col)return;
  const b=document.createElement('button');b.className='tb';b.id='lrSwap';b.type='button';b.hidden=true;b.textContent='HERON';
  b.addEventListener('click',e=>{e.preventDefault();b.blur();lrSwap();});col.insertBefore(b,col.firstChild);LRV.btn=b;
  const f=document.createElement('button');f.className='tb';f.id='lrFoot';f.type='button';f.hidden=true;f.textContent='ON FOOT';
  f.addEventListener('click',e=>{e.preventDefault();f.blur();lrWalkStart();});col.insertBefore(f,b.nextSibling);LRV.foot=f;}
addEventListener('keydown',e=>{if(e.code==='KeyE'&&!e.repeat&&GAME.state==='drive'&&!/INPUT|TEXTAREA/.test((document.activeElement||{}).tagName||''))lrSwap();});
window.__lr=Object.assign(window.__lr||{},{LRV,lrSwap,lrParkTick});

/* ---------- THE PAINTED EDGE: his mountain layers round the world, in the sky behind the land (one picture,
   models/horizon/strip.webp, made by tools/horizon_strip.py: north the snow peaks behind the escarpment, east the
   mesas, south the ranges, west the dunes). Lit by the time of day's own light, a little hazed ---------- */
const LRH={tex:null,loading:false,loc:null,locP:null};
function lrHorzLoad(){if(LRH.tex||LRH.loading||!window.LR_HORZ)return;LRH.loading=true;const im=new Image();
  im.onload=()=>{const t=gl.createTexture();gl.activeTexture(gl.TEXTURE12);gl.bindTexture(gl.TEXTURE_2D,t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.SRGB8_ALPHA8,gl.RGBA,gl.UNSIGNED_BYTE,im);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.activeTexture(gl.TEXTURE0);LRH.tex=t;};
  im.src='data:image/webp;base64,'+LR_HORZ;}
window.__lr=Object.assign(window.__lr||{},{LRH});
function lrSkyBind(G,Ps){lrHorzLoad();const on=LRH.tex&&typeof WG!=='undefined'&&WG.gtPlace?1:0;
  if(LRH.locP!==Ps.p){LRH.locP=Ps.p;LRH.loc=[gl.getUniformLocation(Ps.p,'uHorz'),gl.getUniformLocation(Ps.p,'uHz')];}
  if(LRH.loc[1])gl.uniform4f(LRH.loc[1],-2.5*Math.PI/180,9.5*Math.PI/180,on,0);
  if(on&&LRH.loc[0]){gl.activeTexture(gl.TEXTURE12);gl.bindTexture(gl.TEXTURE_2D,LRH.tex);gl.uniform1i(LRH.loc[0],12);gl.activeTexture(gl.TEXTURE0);}}

/* ---------- ON FOOT: first person. Stop the truck (or the Heron, on the ground) and ON FOOT gets you out beside
   it; walk with the stick (WASD or the arrows on a keyboard, Shift to hurry), look by dragging anywhere else. The
   buildings, temples and big stones stop you (their boxes), and so do the truck and the Heron; you climb what a
   person can (half a metre a step). Back beside the truck or the Heron, GET IN puts you back ---------- */
const LRW={on:false,p:[0,0,0],yaw:0,pitch:0,ui:null,stick:{x:0,y:0},keys:{},bob:0,veh:null};
const LRW_EYE=1.62,LRW_WALK=1.7,LRW_RUN=3.6;
function lrWalkCan(){const t=GAME.car;if(!t||GAME.state!=='drive'||LRW.on)return false;const sp=Math.hypot(t.v[0],t.v[1],t.v[2]);
  return sp<1.2&&t.p[1]-RANCH.W.heightAt(t.p[0],t.p[2])<3;}
function lrWalkStart(){
  if(!lrWalkCan())return false;const t=GAME.car,M=t.M,yaw=lrYaw(t),f=[Math.cos(yaw),-Math.sin(yaw)],r=[Math.sin(yaw),Math.cos(yaw)];
  /* (out the left side: the driver's door; from the Heron, past the wing's end) */
  const off=t.rt?6.2:2.1;LRW.p=[t.p[0]-r[0]*off+f[0]*(t.rt?1:0),0,t.p[2]-r[1]*off+f[1]*(t.rt?1:0)];LRW.p[1]=RANCH.W.heightAt(LRW.p[0],LRW.p[2]);
  LRW.yaw=yaw+Math.PI/2;LRW.pitch=-.05;LRW.on=true;LRW.veh=t;setTestInput({steer:0,thr:0,brk:0,hb:1,nos:false});lrWalkUI(true);say('ON FOOT',1.4);return true;}
function lrWalkEnd(){
  if(!LRW.on)return false;const t=GAME.car;if(Math.hypot(t.p[0]-LRW.p[0],t.p[2]-LRW.p[2])>(t.rt?9:5)){say(t.rt?'WALK BACK TO THE HERON':'WALK BACK TO THE TRUCK',1.6);return false;}
  LRW.on=false;setTestInput(null);lrWalkUI(false);CAM.cut=true;return true;}
/* does anything stop a person standing at (x,z)? the placed models' boxes (turned to their yaw), the truck, the Heron */
function lrWalkBlocked(x,z){
  const B=WG.GTB||{};for(const p of WG.GTP){if(Math.abs(p.x-x)>80||Math.abs(p.z-z)>80||!p.solid)continue;const b=B[p.id+'/'+p.obj];if(!b)continue;
    const c=Math.cos(p.yaw),s=Math.sin(p.yaw),dx=x-p.x,dz=z-p.z,lx=dx*c-dz*s,lz=dx*s+dz*c,m=.3;
    if(lx>b[0]-m&&lx<b[3]+m&&lz>b[2]-m&&lz<b[5]+m)return true;}
  for(const v of [GAME.car,LRV.parked])if(v){const d=Math.hypot(v.p[0]-x,v.p[2]-z);if(d<(v.rt?2.2:2.0))return true;}
  return false;}
function lrWalkStep(dt){
  const K=LRW.keys,run=K.ShiftLeft||K.ShiftRight;let fw=-LRW.stick.y,sd=LRW.stick.x;
  if(K.KeyW||K.ArrowUp)fw+=1;if(K.KeyS||K.ArrowDown)fw-=1;if(K.KeyD||K.ArrowRight)sd+=1;if(K.KeyA||K.ArrowLeft)sd-=1;
  const l=Math.hypot(fw,sd);if(l>1){fw/=l;sd/=l;}
  const sp=(run||l>.98&&Math.hypot(LRW.stick.x,LRW.stick.y)>.95?LRW_RUN:LRW_WALK),f=[Math.cos(LRW.yaw),-Math.sin(LRW.yaw)],r=[Math.sin(LRW.yaw),Math.cos(LRW.yaw)];
  const mv=[(f[0]*fw+r[0]*sd)*sp*dt,(f[1]*fw+r[1]*sd)*sp*dt],p=LRW.p;
  /* each way on its own, so you slide along a wall */
  for(const [ax,d] of [[0,mv[0]],[2,mv[1]]]){if(!d)continue;const q=[p[0],p[2]];q[ax?1:0]+=d;const h=RANCH.W.heightAt(q[0],q[1]);
    if(h-p[1]>.55||lrWalkBlocked(q[0],q[1]))continue;p[ax]=q[ax?1:0];}
  const g=RANCH.W.heightAt(p[0],p[2]);p[1]+=(g-p[1])*Math.min(1,dt*14);
  if(l>.05)LRW.bob+=dt*sp*2.2;const bob=Math.sin(LRW.bob*2)*.025*Math.min(1,l);
  const cp=Math.cos(LRW.pitch),eye=[p[0],p[1]+LRW_EYE+bob,p[2]],fwd=[Math.cos(LRW.yaw)*cp,Math.sin(LRW.pitch),-Math.sin(LRW.yaw)*cp];
  if(LRW.ui)LRW.ui.back.hidden=Math.hypot(GAME.car.p[0]-p[0],GAME.car.p[2]-p[2])>(GAME.car.rt?9:5);
  LRW.cam={eye,fwd};return {eye,fwd,up:[0,1,0],fov:1.15};}
/* the controls on foot: a stick at the left, drag anywhere else to look, GET IN when you're beside it; the driving
   controls hidden meanwhile */
function lrWalkUI(on){
  if(!LRW.ui){const st=document.createElement('style');st.textContent=
    '#lrWalk{position:fixed;inset:0;z-index:6;touch-action:none}#lrWalk[hidden]{display:none}'+
    '#lrWStick{position:absolute;left:calc(env(safe-area-inset-left) + 60px);bottom:calc(env(safe-area-inset-bottom) + 30px);width:150px;height:150px;border-radius:50%;border:2px solid rgba(255,255,255,.35);background:rgba(16,20,26,.28)}'+
    '#lrWStick b{position:absolute;left:50%;top:50%;width:60px;height:60px;margin:-30px 0 0 -30px;border-radius:50%;background:rgba(255,255,255,.6);pointer-events:none}'+
    '#lrWBack{position:absolute;right:calc(env(safe-area-inset-right) + 24px);bottom:calc(env(safe-area-inset-bottom) + 40px);padding:16px 22px;border-radius:14px;border:2px solid rgba(255,255,255,.5);background:rgba(16,20,26,.55);color:#fff;font:800 14px system-ui,sans-serif;letter-spacing:.1em}'+
    '#lrWHint{position:absolute;left:0;right:0;bottom:calc(env(safe-area-inset-bottom) + 6px);text-align:center;font:700 10px system-ui,sans-serif;letter-spacing:.14em;color:rgba(255,255,255,.5);pointer-events:none}';
    document.head.appendChild(st);
    const W=document.createElement('div');W.id='lrWalk';W.hidden=true;W.innerHTML='<div id="lrWStick"><b></b></div><button id="lrWBack" type="button">GET IN</button><div id="lrWHint">DRAG TO LOOK</div>';document.body.appendChild(W);
    const sk=W.querySelector('#lrWStick'),kn=sk.querySelector('b'),back=W.querySelector('#lrWBack');let sid=null,lid=null,lx=0,ly=0;
    const at=e=>{const r=sk.getBoundingClientRect(),R=r.width*.4;let x=(e.clientX-(r.left+r.width/2))/R,y=(e.clientY-(r.top+r.height/2))/R;const l=Math.hypot(x,y);if(l>1){x/=l;y/=l;}
      kn.style.transform=`translate(${(x*R).toFixed(1)}px,${(y*R).toFixed(1)}px)`;LRW.stick.x=Math.abs(x)<.08?0:x;LRW.stick.y=Math.abs(y)<.08?0:y;};
    sk.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();sid=e.pointerId;try{sk.setPointerCapture(sid);}catch(_){}at(e);});
    sk.addEventListener('pointermove',e=>{if(e.pointerId===sid)at(e);});
    const up=e=>{if(e.pointerId!==sid)return;sid=null;LRW.stick.x=LRW.stick.y=0;kn.style.transform='';};for(const ev of ['pointerup','pointercancel','lostpointercapture'])sk.addEventListener(ev,up);
    W.addEventListener('pointerdown',e=>{if(e.target!==W)return;lid=e.pointerId;lx=e.clientX;ly=e.clientY;try{W.setPointerCapture(lid);}catch(_){}});
    W.addEventListener('pointermove',e=>{if(e.pointerId!==lid)return;const k=3.2/Math.max(innerWidth,innerHeight);LRW.yaw-=(e.clientX-lx)*k;LRW.pitch=Math.max(-1.2,Math.min(1.2,LRW.pitch-(e.clientY-ly)*k));lx=e.clientX;ly=e.clientY;});
    for(const ev of ['pointerup','pointercancel'])W.addEventListener(ev,e=>{if(e.pointerId===lid)lid=null;});
    back.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();lrWalkEnd();});
    LRW.ui={W,back};}
  LRW.ui.W.hidden=!on;const T=document.getElementById('touch');if(T)T.style.visibility=on?'hidden':'';LRW.stick.x=LRW.stick.y=0;}
addEventListener('keydown',e=>{if(LRW.on)LRW.keys[e.code]=true;if(e.code==='KeyF'&&!e.repeat&&GAME.state==='drive'&&!/INPUT|TEXTAREA/.test((document.activeElement||{}).tagName||'')){if(LRW.on)lrWalkEnd();else lrWalkStart();}});
addEventListener('keyup',e=>{LRW.keys[e.code]=false;});
window.__lr=Object.assign(window.__lr||{},{LRW,lrWalkStart,lrWalkEnd,lrWalkStep});

/* ---------- THE PEOPLE AND THE JOBS (the engine's own job system: someone with work is a column of light in their
   colour; stop beside it, Start, and the dialog has their face, from his portraits J01-J06). Two new kinds of step:
   land (in the Heron, stopped on a given strip) and foot (on foot, at a place). The first jobs of Fable's chain:
   First Light, The Mail, Ground Truth, Three Wells, and a side job, the Pan Wreck ---------- */
function gtPeople(){
  const S=WG.GTS,at=(i,u,v)=>{const s=S[i];return [s.x+s.dx*u-s.dz*v,s.z+s.dz*u+s.dx*v];},F=k=>window.LR_FACES&&LR_FACES[k]?'data:image/webp;base64,'+LR_FACES[k]:null;
  const P=(name,short,role,xz,col,face)=>({name,short,role,x:xz[0],z:xz[1],col,img:F(face)});
  const R=WG.GTP.find(p=>p.id==='B08'),H=WG.GTP.find(p=>p.id==='B16'),D=WG.GTP.find(p=>p.id==='D14');
  return {dell:P('Dell Marais','Dell','owns the outfit, on the apron at Roadhead',at(0,-195,42),'#ffb347','J01'),
    teo:P('Teo','Teo','the mechanic, at the hangar',at(0,-262,40),'#7fd1ff','J02'),
    haugen:P('Dr Ilse Haugen','Haugen','the archaeologist, at the roadhouse',[R.x,R.z+16],'#c39bff','J03'),
    nkem:P('Nkem Adeyemi','Nkem','the ranger, at Kettle Creek Station',[H.x+Math.sin(H.yaw)*16,H.z+Math.cos(H.yaw)*16],'#8dff5a','J06'),
    harker:P('Lyle Harker','Harker','Meridian Resources, at the delta camp',[D.x-70,D.z+40],'#ff6b5a','J04'),
    ruben:P('Ruben Vos','Ruben','keeps Last Well',at(11,-60,44),'#e0c070','J05')};}
function gtJobs(){
  const Q=(id,who,title,needs,intro,steps,outro,reward,tip)=>{JOB_NAMES[id]=`${PEOPLE[who].short}'s job, ${title}`;return {id,who,title,needs,intro,steps,outro,reward,tip};};
  const S=WG.GTS,C=WG.GTP.find(p=>p.id==='C04'),W=WG.GTP.find(p=>p.id==='C07'),K=WG.GTP.find(p=>p.id==='D05');
  const end=[S[0].x+S[0].dx*900,S[0].z+S[0].dz*900];
  return [
    Q('firstlight','dell','First Light',[],
      ['Pilot. You\'re the new contract.','The Heron\'s on the apron. Take her out past the east end of the runway, come round, and put her down again. Gently. Then come and see me.'],
      [{t:'goto',x:end[0],z:end[1],r:250,name:'past the runway\'s east end',text:'Fly out past the east end of the runway'},{t:'land',strip:0,text:'Land at Roadhead and stop'},{t:'talk',who:'dell',text:'See Dell on the apron'}],
      {text:'Copy. You\'ll do.'},{money:150},'Drive up to the Heron and stop: HERON gets you in. Stopped on a strip in the Heron, TRUCK gets you out to the truck waiting there.'),
    Q('mail','dell','The Mail',['firstlight'],
      ['Mail for Kettle Creek Station. Nkem\'s been waiting a week.','The strip\'s about twenty kilometres west, past the creek lines. Watch for cattle on it. The truck will be waiting.'],
      [{t:'land',strip:1,text:'Fly the mail to Kettle Creek Station'},{t:'talk',who:'nkem',text:'Take it to Nkem at the homestead'}],
      {who:'nkem',text:'About time. Tell Dell the dust is coming early this year.'},{money:300}),
    Q('groundtruth','haugen','Ground Truth',['mail'],
      ['Dr Ilse Haugen. I have a contract, a camera and no plane.','There is a stone tank in the savanna south-east of the station. The families call it the Cistern. I need someone to find it from the air, and then to stand in it.'],
      [{t:'goto',x:C.x,z:C.z,r:600,name:'the Cistern',text:'Find the Cistern from the air'},{t:'land',strip:1,text:'Land at Kettle Creek'},
       {t:'foot',x:C.x,z:C.z,r:14,name:'the Cistern',text:'Drive to the Cistern, get out and walk into it'},{t:'talk',who:'haugen',text:'Back to Haugen at the roadhouse'}],
      {text:'Copy. I mean: what? The carving\'s hand points west? Into the dunes? Copy.'},{money:800}),
    Q('threewells','haugen','Three Wells',['groundtruth'],
      ['West of the station, where the grass gives out, there are three wells that have never been dry.','The station says there\'s a temple there, half under the sand. Land at the dune\'s edge and walk it.'],
      [{t:'land',strip:3,text:'Land at Three Wells, at the dune\'s edge'},{t:'foot',x:W.x,z:W.z,r:16,name:'Three Wells',text:'Walk to the temple of the Three Wells'},{t:'talk',who:'haugen',text:'Back to Haugen'}],
      {text:'Into the dunes. The channel runs into the dunes. Nobody builds a channel into a desert.'},{money:1000}),
    Q('panwreck','dell','The Pan Wreck',['mail'],
      ['A driver\'s gone out on the Pan and not come back. His truck\'s an old one.','Land on the salt at Pan Strip, take the truck out to him and see what\'s left.'],
      [{t:'land',strip:2,text:'Land on the salt at Pan Strip'},{t:'deliver',x:K.x,z:K.z,r:18,name:'the wreck',text:'Drive out to the wreck on the Pan'},{t:'talk',who:'dell',text:'Report to Dell'}],
      {text:'Nobody in it? Then he walked. Nkem\'ll find him. Good work.'},{money:600})];
}
/* (for the tests: the job system's own pieces, asked for when they exist) */
window.__lrJ=()=>({PEOPLE,JOB,jActive,jobListen,closeJobDialog,jRec});

/* ---------- YOUR HANDS on foot: his gloved hands (E01), held low in front of your eyes, swaying a little as you walk ---------- */
const LRHD={M:new Float32Array(16)};
function lrHandsDraw(){
  if(!LRW.on||!LRW.cam||!window.LR_PROPS||!LR_PROPS.E01)return 0;const key='E01/model';
  if(!LRP.mesh.has(key)){if(!LRP.busy.has(key)){LRP.busy.add(key);lrPropMake(key);}return 0;}
  const m=LRP.mesh.get(key),tx=LRP.tex.get(key);if(!m||!tx)return 0;lrPropTex1();
  const {eye,fwd}=LRW.cam,a=-.5,r=norm2([-fwd[2],0,fwd[0]]),u0=[r[1]*fwd[2]-r[2]*fwd[1],r[2]*fwd[0]-r[0]*fwd[2],r[0]*fwd[1]-r[1]*fwd[0]];
  /* (the fingers a little down from the way you look; the up that goes with that) */
  const f=norm2([fwd[0]*Math.cos(a)-u0[0]*Math.sin(a),fwd[1]*Math.cos(a)-u0[1]*Math.sin(a),fwd[2]*Math.cos(a)-u0[2]*Math.sin(a)]);
  const u=[r[1]*f[2]-r[2]*f[1],r[2]*f[0]-r[0]*f[2],r[0]*f[1]-r[1]*f[0]],x=[u[1]*f[2]-u[2]*f[1],u[2]*f[0]-u[0]*f[2],u[0]*f[1]-u[1]*f[0]];
  const sw=Math.sin(LRW.bob)*.012,p=[eye[0]+fwd[0]*.5-u0[0]*.4+r[0]*sw,eye[1]+fwd[1]*.5-u0[1]*.4+Math.abs(sw)*.5,eye[2]+fwd[2]*.5-u0[2]*.4+r[2]*sw],M=LRHD.M;
  M[0]=x[0];M[1]=x[1];M[2]=x[2];M[3]=0;M[4]=u[0];M[5]=u[1];M[6]=u[2];M[7]=0;M[8]=f[0];M[9]=f[1];M[10]=f[2];M[11]=0;M[12]=p[0]-RO[0];M[13]=p[1]-RO[1];M[14]=p[2]-RO[2];M[15]=1;
  const U=CUR.u;gl.uniformMatrix4fv(U.uM,false,M);if(U.uPrevM)gl.uniformMatrix4fv(U.uPrevM,false,M);
  if(LRP.locP!==CUR.p){LRP.locP=CUR.p;LRP.loc=['uRTa','uRTn','uRTo'].map(q=>gl.getUniformLocation(CUR.p,q));}
  const T=[[LRP.loc[0],tx,13],[LRP.loc[1],LRP.one.n,14],[LRP.loc[2],LRP.one.o,15]];
  for(const [loc,t,unit] of T){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);if(loc)gl.uniform1i(loc,unit);}gl.activeTexture(gl.TEXTURE0);
  drawMesh(m);return m.tris;}

/* ---------- LIFE AT A DISTANCE (Fable's: animals are seen far off, because they run before you're close): herds in
   some of the 2.5 km squares round you, chosen by the land (cattle near the station, antelope on the savanna, oryx
   and camels at the dune's edge, flamingos and cranes on the delta), grazing and drifting; come within a few hundred
   metres (less on foot, more in the Heron) and they run from you. Vultures wheel high over the savanna. His animal
   models (G01-G08) ---------- */
const LRA={herds:new Map(),birds:new Map(),M:new Float32Array(16),drawn:0,tris:0};
const LRA_KIND={cattle:{id:'G01',n:[6,14],sp:30,run:8},antelope:{id:'G02',n:[8,22],sp:55,run:15,sc:1.35},oryx:{id:'G06',n:[4,9],sp:40,run:13},
  camel:{id:'G07',n:[3,7],sp:35,run:7},flamingo:{id:'G05',n:[18,40],sp:70,run:0},crane:{id:'G08',n:[4,10],sp:30,run:0},cat:{id:'G04',n:[1,1],sp:0,run:10}};
const lraHash=(a,b,s)=>{let h=Math.imul(a|0,0x27d4eb2d)^Math.imul(b|0,0x165667b1)^Math.imul(s|0,0x9e3779b1);h=Math.imul(h^(h>>>15),0x85ebca6b);h=Math.imul(h^(h>>>13),0xc2b2ae35);return ((h^(h>>>16))>>>0)/4294967296;};
function lraObjs(id){const E=window.LR_PROPS&&LR_PROPS[id];return E?Object.keys(E).filter(k=>k.indexOf('~')<0):[];}
/* what lives in a square, if anything (decided by its middle's land, the same every visit) */
function lraHerdFor(a,b){
  const C=2500,x=(a+.3+.4*lraHash(a,b,1))*C,z=(b+.3+.4*lraHash(a,b,2))*C,R=WG.gtRegions(x,z,{}),r=lraHash(a,b,3);let kind=null;
  if(R.delta>.6&&!R.pans)kind=r<.55?'flamingo':r<.85?'crane':null;
  else if(R.sav>.7){const ks=WG.GTS[1],dk=Math.hypot(x-ks.x,z-ks.z);kind=dk<7000&&r<.5?'cattle':r<.45?'antelope':r<.52?'cat':null;}
  else if(R.dune>.3&&R.dune<.85)kind=r<.25?'oryx':r<.4?'camel':null;
  else if(R.cany>.6)kind=r<.15?'oryx':null;
  if(!kind||!lraObjs(LRA_KIND[kind].id).length)return null;
  const K=LRA_KIND[kind],n=K.n[0]+Math.floor(lraHash(a,b,4)*(K.n[1]-K.n[0]+1)),all=lraObjs(K.id),fly=all.find(q=>/flying/.test(q)),obj=all.filter(q=>!/flying/.test(q)),mem=[];
  if(!obj.length)return null;
  /* (the lioness: on the top of a kopje in the square, if there is one, watching; none if there isn't) */
  let X=x,Z=z;if(kind==='cat'){const o={};let best=-1;for(let i=0;i<10;i++)for(let j=0;j<10;j++){const px=(a+(i+.5)/10)*C,pz=(b+(j+.5)/10)*C;WG.sample(px,pz,o);if(o.rock>.6&&o.h>best){best=o.h;X=px;Z=pz;}}
    if(best<0)return null;for(let k=0;k<30;k++){let bh=-1e9,bx=X,bz=Z;for(const [dx,dz] of [[12,0],[-12,0],[0,12],[0,-12]]){const h=WG.sample(X+dx,Z+dz,o).h;if(h>bh){bh=h;bx=X+dx;bz=Z+dz;}}
      if(bh<=WG.sample(X,Z,o).h+.05)break;X=bx;Z=bz;}}
  for(let k=0;k<n;k++){const an=lraHash(a*31+k,b,5)*6.283,rr=K.sp*Math.sqrt(lraHash(a,b*17+k,6));mem.push({dx:Math.cos(an)*rr,dz:Math.sin(an)*rr,yaw:lraHash(k,a,7)*6.283,obj:obj[Math.floor(lraHash(k,b,8)*obj.length)],ph:lraHash(k,a+b,9)*6.283});}
  return {kind,K,x:X,z:Z,h:lraHash(a,b,10)*6.283,mem,run:0,gone:false,fly,up:0};}
function lraTick(dt,P,foot,air){
  const C=2500,ca=Math.floor(P[0]/C),cb=Math.floor(P[2]/C);
  for(let a=ca-1;a<=ca+1;a++)for(let b=cb-1;b<=cb+1;b++){const k=a+','+b;if(!LRA.herds.has(k))LRA.herds.set(k,lraHerdFor(a,b));}
  for(const [k,H] of LRA.herds){if(!H)continue;const d=Math.hypot(H.x-P[0],H.z-P[2]);if(d>6000){LRA.herds.delete(k);continue;}
    /* (afraid of you inside this: on foot least, the Heron overhead most) */
    const fear=(foot?170:air?260:320)*(H.K.run?1:.7);
    if(d<fear&&H.K.run&&!LRA.calm){const ux=(H.x-P[0])/(d||1),uz=(H.z-P[2])/(d||1);H.h=Math.atan2(uz,ux);H.run=Math.min(1,H.run+dt*1.5);}
    else{H.run=Math.max(0,H.run-dt*.4);H.h+=(lraHash(Math.floor(performance.now()/7000),k.length,11)-.5)*dt*.2;}
    const sp=H.run*H.K.run+.25*(1-H.run)*(H.K.run?1:.3);H.x+=Math.cos(H.h)*sp*dt;H.z+=Math.sin(H.h)*sp*dt;
    /* (birds on the water lift off when you're right on them, and fly away, climbing, out of sight) */
    if(!H.K.run&&!H.up&&d<(foot?120:200)){H.up=.01;H.h=Math.atan2(H.z-P[2],H.x-P[0]);}
    if(H.up){H.up+=dt;const v=Math.min(1,H.up/3)*13;H.x+=Math.cos(H.h)*v*dt;H.z+=Math.sin(H.h)*v*dt;if(H.up>45||!H.fly)H.gone=true;}}}
function lraDraw(u,e,F,probe){
  if(probe||typeof WG==='undefined'||!WG.gtPlace||!window.LR_PROPS)return 0;const t=GAME.car;if(!t)return 0;
  const P=LRW.on?LRW.p:t.p,air=!!t.rt&&t.p[1]-RANCH.W.heightAt(t.p[0],t.p[2])>20;const now=performance.now(),dt=Math.min(.1,LRA.tl?(now-LRA.tl)/1000:1/60);LRA.tl=now;lraTick(dt,P,LRW.on,air);
  lrPropTex1();if(LRP.locP!==CUR.p){LRP.locP=CUR.p;LRP.loc=['uRTa','uRTn','uRTo'].map(q=>gl.getUniformLocation(CUR.p,q));}
  let tris=0,n=0;const M=LRA.M,o={},tnow=performance.now()/1000;
  const one=(key,x,y,z,yaw,lift,sc)=>{
    /* (past 250 m, its thinned shape, if it has one) */
    if(Math.hypot(x-e[0],y-e[1],z-e[2])>250){const [i,ob]=key.split('/');if(LR_PROPS[i]&&LR_PROPS[i][ob+'~far'])key+='~far';}
    if(!LRP.mesh.has(key)){if(!LRP.busy.has(key)){LRP.busy.add(key);lrPropMake(key);}return;}const m=LRP.mesh.get(key),tx=LRP.tex.get(key);if(!m||!tx)return;
    if(!boxVisible(F,[x-4,y-1,z-4],[x+4,y+6,z+4]))return;const c=Math.cos(yaw),s=Math.sin(yaw);
    sc=sc||1;M[0]=c*sc;M[1]=0;M[2]=-s*sc;M[3]=0;M[4]=0;M[5]=sc;M[6]=0;M[7]=0;M[8]=s*sc;M[9]=0;M[10]=c*sc;M[11]=0;M[12]=x-RO[0];M[13]=y+lift-RO[1];M[14]=z-RO[2];M[15]=1;gl.uniformMatrix4fv(u.uM,false,M);
    const U=[[LRP.loc[0],tx,13],[LRP.loc[1],LRP.one.n,14],[LRP.loc[2],LRP.one.o,15]];for(const [loc,tt,unit] of U){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,tt);if(loc)gl.uniform1i(loc,unit);}gl.activeTexture(gl.TEXTURE0);
    drawMesh(m);tris+=m.tris;n++;};
  for(const H of LRA.herds.values()){if(!H||H.gone)continue;const d=Math.hypot(H.x-e[0],H.z-e[2]);if(d>2600)continue;
    /* (heading: the herd's way when running, each its own while grazing; the model's front, +z, turned to it) */
    for(const q of H.mem){const x=H.x+q.dx,z=H.z+q.dz;if(q.y===undefined||H.run>0||q.t===undefined||tnow-q.t>2){q.y=WG.sample(x,z,o).h;q.t=tnow;if(o.code===WG.SF.water){if(H.K.run)continue;q.y=Math.max(q.y,o.wl-.3);}}
      if(H.up&&H.fly){const u=Math.max(0,H.up-q.ph*.15);one(H.K.id+'/'+H.fly,x,q.y,z,Math.PI/2-H.h,Math.min(u,3)*.6+Math.max(0,u-3)*2.2+Math.sin(tnow*2+q.ph)*.4,H.K.sc);continue;}
      const yaw=H.run>.3?Math.PI/2-H.h:q.yaw,lift=H.run>.3?Math.abs(Math.sin(tnow*7+q.ph))*.12:0;one(H.K.id+'/'+q.obj,x,q.y,z,yaw,lift,H.K.sc);}}
  /* vultures: in some savanna squares, a few wheeling high */
  const C=2500,ca=Math.floor(e[0]/C),cb=Math.floor(e[2]/C),V=lraObjs('G03');
  if(V.length)for(let a=ca-1;a<=ca+1;a++)for(let b=cb-1;b<=cb+1;b++){if(lraHash(a,b,21)>.3)continue;const x0=(a+.5)*C,z0=(b+.5)*C;if(Math.hypot(x0-e[0],z0-e[2])>3500)continue;
    const R=WG.gtRegions(x0,z0,{});if(R.sav<.6)continue;const g=WG.sample(x0,z0,o).h,nb=3+Math.floor(lraHash(a,b,22)*4);
    for(let k=0;k<nb;k++){const r=70+60*lraHash(a,b+k,23),w=.18+.06*lraHash(a+k,b,24),an=tnow*w+k*2.1,x=x0+Math.cos(an)*r,z=z0+Math.sin(an)*r;
      one('G03/'+V[0],x,g+150+50*lraHash(a,k,25),z,-an,0);}}
  LRA.drawn=n;LRA.tris=tris;return tris;}
window.__lr=Object.assign(window.__lr||{},{LRA,lraHerdFor});

/* ---------- GROUND TRUTH'S FRONT DOOR. The page starts on its own title over the bay, with two ways in, as Salt &
   Sand has (his call, Nov 7 2026): CAMPAIGN (the story from First Light, the truck always in Sim physics, its own
   save) and FREE PLAY (roam anywhere; the truck starts in Sim and the menu can switch it to Realistic; the jobs are
   there too, on their own save). OUTFITTER is the bay: the Rock & Mud or the Heron on the turntable. Salt & Sand's
   garage of other cars, its races, challenges and traffic stay out of this game's menus. On the phone's driving
   screen, no N2O, O/D OFF, REAR or HORN buttons. The build's name in the corner, so you can tell which one you
   opened ---------- */
const LR_BUILD='last-road-20';
var LRM={mode:null};
/* each way in keeps its own jobs (CHAL.free is the job record when there's no Salt & Sand career) */
const lrModeKey=m=>m==='campaign'?'gt-campaign':'rt-fchal';
function lrModeSet(m){LRM.mode=m;store.set('gt-mode',m);let r={};try{r=JSON.parse(store.get(lrModeKey(m),'{}'))||{};}catch(e){}
  for(const k of Object.keys(CHAL.free))delete CHAL.free[k];Object.assign(CHAL.free,{medals:{},best:{},runs:{}},r);MARKS_V++;JOB.tmemo=null;
  const was=APP.level;APP.level=m==='campaign'?'sim':(store.get('gt-free-level','sim')==='real'?'real':'sim');if(was!==APP.level)saveGame();
  document.body.classList.toggle('gtCampaign',m==='campaign');spawnRig(false);}
const lrHasRun=m=>{try{const r=JSON.parse(store.get(lrModeKey(m),'{}'))||{};return !!(r.active||Object.keys(r.quests||{}).length);}catch(e){return false;}};
function lrStart(m){lrModeSet(m);const d=$('lrTitle');if(d)d.remove();if(LRO.heron)lrBaySet(false);const b=$('sasDrive');if(b)b.click();
  /* (a new campaign: Dell calls you over the radio with the first job) */
  if(m==='campaign')setTimeout(()=>{if(GAME.state==='drive'&&!jDone('firstlight')&&!jRec().active)jobListen('dell');},1400);}
function lrTitle(){
  const st=document.createElement('style');st.textContent=`
#tNos,#tOD,#tRear,#touch [data-k=horn],#shBack,#rtFly,#mTabs [data-t=races],#mTabs [data-t=garage],#mTabs [data-t=cool],
#menu section:has(#mCars),#menu section:has(#mModes),#menu section:has(#mPresets),#menu section:has(#mTraffic),#menu section:has(#mSim),
#menu section:has(#chCount),#menu section:has(#clList),#menu section:has(#chList),#mLevel [data-v=middle],#mLevel [data-v=kids],
body.gtCampaign #menu section:has(#mLevel),body.gtHeron #shEng,body.gtHeron #shPad,body.gtHeron #shTab{display:none!important}
#lrTitle{position:fixed;inset:0;z-index:9000;display:grid;place-items:center;color:#f4ead8;font-family:Georgia,'Times New Roman',serif;
  background:linear-gradient(180deg,rgba(18,22,30,.25),rgba(18,14,10,.15) 55%,rgba(14,10,8,.82)),var(--lrh) center 62%/auto 46% repeat-x,linear-gradient(180deg,#9fb3c4,#e3c79c 70%,#b98a5a)}
#lrTitle .lrT{text-align:center;padding:16px 24px;max-width:680px}
#lrTitle small{letter-spacing:.32em;text-transform:uppercase;font-size:13px;opacity:.85;font-family:system-ui,sans-serif}
#lrTitle h1{font-size:min(9vw,14vh,92px);white-space:nowrap;font-weight:400;font-style:italic;margin:4px 0 2px;text-shadow:0 2px 18px rgba(0,0,0,.45)}
#lrTitle p{font-size:clamp(13px,2.1vw,17px);margin:0 0 16px;opacity:.92;text-shadow:0 1px 8px rgba(0,0,0,.5)}
#lrTitle button{font:600 17px system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;border:0;border-radius:999px;cursor:pointer;margin:5px}
#lrCamp{background:#e2b85c;color:#1d160c;padding:15px 40px;box-shadow:0 6px 24px rgba(0,0,0,.35)}
#lrFree{background:rgba(244,234,216,.92);color:#1d160c;padding:15px 30px}
#lrOut{background:rgba(20,16,12,.55);color:#f4ead8;padding:10px 24px;font-size:13px!important;border:1px solid rgba(244,234,216,.35)!important}
#lrTitle .lrH{font:12px system-ui,sans-serif;opacity:.75;margin:2px 0 8px}
#lrTitle i{position:absolute;right:12px;bottom:8px;font:12px system-ui,sans-serif;opacity:.6}
#lrBaySeg{display:inline-flex}`;
  document.head.appendChild(st);
  const h=document.querySelector('#menu .mhead h1');if(h)h.innerHTML='Ground Truth <small class="tagw">'+LR_BUILD+'</small>';
  const jt=document.querySelector('#mTabs [data-t=chals]');if(jt)jt.textContent='Jobs';
  {const L=$('jbList');const sec=L&&L.closest('section');if(sec){const h2=sec.querySelector('h2');if(h2)h2.textContent='The people';
    const ps=sec.querySelectorAll('p.hint');if(ps[1])ps[1].textContent='A column of light in someone\'s colour means they have work for you: stop beside them and listen. One job at a time.';}}
  document.title='Ground Truth';lrBayUI();
  const d=document.createElement('div');d.id='lrTitle';const c=lrHasRun('campaign');
  d.innerHTML='<div class="lrT"><small>A survey of the interior</small><h1>Ground Truth</h1><p>Roadhead, at the end of Last Road. The truck is fuelled; the Heron waits on the apron.</p>'+
    '<button id="lrCamp" type="button">'+(c?'Continue campaign':'Campaign')+'</button><button id="lrFree" type="button">Free play</button>'+
    '<div class="lrH">Campaign: the story, in Sim physics · Free play: go anywhere, Sim or Realistic</div><button id="lrOut" type="button">Outfitter</button></div><i>'+LR_BUILD+'</i>';
  if(window.LR_HORZ)d.style.setProperty('--lrh','url(data:image/webp;base64,'+LR_HORZ+')');
  document.body.appendChild(d);
  d.querySelector('#lrCamp').addEventListener('click',()=>lrStart('campaign'));
  d.querySelector('#lrFree').addEventListener('click',()=>lrStart('free'));
  d.querySelector('#lrOut').addEventListener('click',()=>{if(!LRM.mode)lrModeSet(store.get('gt-mode','campaign')==='free'?'free':'campaign');d.remove();});}
/* ---------- THE OUTFITTER'S TURNTABLE: the Rock & Mud, or the Heron in its paint (TRUCK | HERON); DRIVE takes out the
   one that's on it ---------- */
const LRO={heron:false,t:null,M:new Float32Array(9)};
function lrBayUI(){const fly=$('rtFly'),go=$('sasDrive');if(!go)return;const seg=document.createElement('div');seg.className='seg';seg.id='lrBaySeg';seg.setAttribute('role','group');
  seg.innerHTML='<button type="button" data-v="truck" aria-pressed="true">Truck</button><button type="button" data-v="heron" aria-pressed="false">✈ Heron</button>';
  go.parentNode.insertBefore(seg,fly||go);
  seg.addEventListener('click',e=>{const b=e.target.closest('button');if(b)lrBaySet(b.dataset.v==='heron');});
  /* (DRIVE with the Heron on the turntable: out in the Heron) */
  go.addEventListener('click',e=>{if(!LRO.heron)return;e.stopImmediatePropagation();go.blur();lrBaySet(false,true);rtFly(true);showFull(false);closeMenu();},true);}
function lrBaySet(on,keep){LRO.heron=on;document.body.classList.toggle('gtHeron',on);const go=$('sasDrive');if(go&&!keep)go.textContent=on?'Fly ▶':'Drive ▶';
  if(keep&&go)go.textContent='Drive ▶';
  for(const b of document.querySelectorAll('#lrBaySeg button'))b.setAttribute('aria-pressed',String((b.dataset.v==='heron')===on));
  if(on){if(!RT.mesh)rtBuild();if(!RT.texP)rtPaint(RT.paint,true);}}
/* the Heron where the bay puts the car (Mc: the turntable's frame), its wheels on the deck */
function lrBayHeron(Mc,depth){const t=GAME.car;if(!t)return 0;if(!RT.mesh&&!rtBuild())return 0;
  if(!LRO.t)LRO.t=Object.create(t);const q=LRO.t,M=LRO.M;Object.setPrototypeOf(q,t);
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)M[i*3+j]=Mc[j*4+i];q.M=M;q.p=[Mc[12]+RO[0],Mc[13]+RO[1]+LRO.lift,Mc[14]+RO[2]];
  return rtDraw(q,null,0,false,depth);}
LRO.lift=RT.hcg;
window.__lr=Object.assign(window.__lr||{},{lrTitle,LR_BUILD,LRM,lrModeSet,lrStart,LRO,lrBaySet});

/* ---------- WHERE THE TRUCK CAN'T GO (his call, Nov 7 2026: ground that only the Heron gets you across). Water
   deeper than the truck can ford (about 1.1 m, its snorkel's reach): it bogs down to a crawl and says so; back out.
   The lava flows of the Black Range (gt-world.js) are broken ground no truck crosses. The escarpment's 600 m wall
   (but for the Switchback) and the canyons' cliffs were already so ---------- */
const LRWD={o:{},deep:false,t:0};
function lrWade(dt,t){if(!t||t.rt||LRW.on)return;const o=LRWD.o;WG.sample(t.p[0],t.p[2],o);const d=o.code===WG.SF.water?o.wl-o.h:0,lava=o.gm===38&&o.rock>.93,deep=d>1.1||lava;
  if(deep){const k=Math.exp(-dt*2.6);t.v[0]*=k;t.v[2]*=k;if(!LRWD.deep&&performance.now()-LRWD.t>6000){LRWD.t=performance.now();say(lava?'A LAVA FIELD: NO TRUCK CROSSES THIS':'TOO DEEP FOR THE TRUCK',2.6,PAL.amber);say('BACK OUT, OR FLY IT',2.6,PAL.amber);}}
  LRWD.deep=deep;}
window.__lr=Object.assign(window.__lr||{},{LRWD,lrWade});

/* ---------- THE MAPS SHOW THE JOB YOU'RE ON (his call, Nov 7 2026: "routes on map for the current quest"). The
   corner map: a dotted gold line from you toward the job's next stop, to the map's edge when the stop is off it, and
   the stop ringed when it's on it. The big map (M, or tap the corner map) is the whole world from above
   (src/lr-wmap.js, 64 km square, north up): the strips by name, Roadhead, a dot for each person with work for you,
   the job's stop ringed with the line to it, and at the top the job, what's next and how far, as the crow (or the
   Heron) flies ---------- */
const LRMAP={px:null,n:0};
if(window.LR_WMAP){const b=Uint8Array.from(atob(LR_WMAP),c=>c.charCodeAt(0));
  createImageBitmap(new Blob([b],{type:'image/webp'})).then(im=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');
    g.drawImage(im,0,0);LRMAP.px=g.getImageData(0,0,im.width,im.height).data;LRMAP.n=im.width;}).catch(e=>console.warn('the big map: '+(e&&e.message||e)));}
/* a dotted line, in HUD units */
function lrDash(x0,y0,x1,y1,col,on,off){on=on||2;off=off||1.6;const L=Math.hypot(x1-x0,y1-y0);if(L<.5)return;const ux=(x1-x0)/L,uy=(y1-y0)/L,ph=(APP.t*4)%(on+off);
  for(let s=-ph;s<L;s+=on+off){const a=Math.max(0,s),b=Math.min(L,s+on);if(b>a)hLine(x0+ux*a,y0+uy*a,x0+ux*b,y0+uy*b,col);}}
const lrKm=m=>m<1000?Math.round(m/10)*10+' M':(m/1000).toFixed(m<10000?1:0)+' KM';
/* the corner map's part (its middle is the truck or the Heron, span metres across) */
function lrMapRoute(x0,y0,size,span){const t=GAME.car,tg=GAME.state==='drive'&&jTarget();if(!t||!tg)return;
  const cx=x0+size/2,cy=y0+size/2,dx=(tg.x-t.p[0])/span*size,dy=(tg.z-t.p[2])/span*size,h=size/2-2.5,k=Math.max(Math.abs(dx),Math.abs(dy))/h;
  if(k<=1){lrDash(cx,cy,cx+dx,cy+dy,PAL.gold);hRing(cx+dx,cy+dy,2.4,PAL.gold);}
  else{const ex=cx+dx/k,ey=cy+dy/k;lrDash(cx,cy,ex,ey,PAL.gold);hDisc(ex,ey,1.5,(APP.t*3|0)%2?PAL.gold:PAL.white);}}
/* the big map */
function lrBigMap(){const t=GAME.car,size=Math.min(H-14,W-14)|0,x0=Math.round((W-size)/2),y0=Math.round((H-size)/2),n=size*HS,HH=WG.HALF;
  hRect(0,0,W,H,pack(0,0,0,215));hRect(x0-2,y0-2,size+4,size+4,pack(0,0,0,225));
  if(LRMAP.px){const P=LRMAP.px,N=LRMAP.n,X0=x0*HS,Y0=y0*HS;{const a=Math.max(0,Y0),b=Math.min(BH,Y0+n);if(b>a)hMark(a,b);}
    for(let j=0;j<n;j++){const Y=Y0+j;if(Y<0||Y>=BH)continue;const v=Math.min(N-1,(j/n*N)|0),o=Y*BW+X0;
      for(let i=0;i<n;i++){const X=X0+i;if(X<0||X>=BW)continue;const q=(v*N+Math.min(N-1,(i/n*N)|0))*4;HB[o+i]=pack(P[q]*.86,P[q+1]*.86,P[q+2]*.86,255);}}}
  const toM=(x,z)=>[x0+(x+HH)/(2*HH)*size,y0+(z+HH)/(2*HH)*size];
  /* the strips by name; Roadhead in gold */
  for(const S of WG.GTS){const [a,b]=toM(S.x,S.z),home=S.name==='Roadhead';hDisc(a,b,1.3,home?PAL.gold:PAL.white);otxt3(S.name.replace(/ Strip$/,'').toUpperCase(),a+3,b-3,home?PAL.gold:PAL.ink);}
  /* who has work for you */
  for(const k of Object.keys(PEOPLE)){const p=PEOPLE[k];if(!jOffer(k))continue;const [a,b]=toM(p.x,p.z);hDisc(a,b,1.6,hx(p.col));}
  /* the job: its stop, the line to it, and what it is */
  const [cx,cy]=toM(t.p[0],t.p[2]),A=jActive(),tg=A&&jTarget();
  if(tg){const [a,b]=toM(tg.x,tg.z);lrDash(cx,cy,a,b,PAL.gold,2.5,1.5);hRing(a,b,3,PAL.gold);
    otxt3((A.q.title+': '+A.s.text).toUpperCase().slice(0,Math.floor(size/4.2)),x0+3,y0+3,PAL.gold);
    otxt3(((tg.name||'')+'  '+lrKm(Math.hypot(tg.x-t.p[0],tg.z-t.p[2]))).toUpperCase(),x0+3,y0+10,PAL.ink);}
  else otxt3(Object.keys(PEOPLE).some(jOffer)?'NO JOB ON: A DOT IS SOMEONE WITH WORK FOR YOU':'NO JOB ON',x0+3,y0+3,PAL.ink);
  mapArrow(cx,cy,1.3);hFrame(x0-2,y0-2,size+4,size+4,pack(255,255,255,70));
  otxt3(GAME.touch?'TAP TO CLOSE':'M TO CLOSE',x0+3,y0+size-8,PAL.dim);otxt3('40 MILES ACROSS, NORTH UP',x0+size-3,y0+size-8,PAL.dim,1,'r');}
window.__lr=Object.assign(window.__lr||{},{LRMAP,lrBigMap});
