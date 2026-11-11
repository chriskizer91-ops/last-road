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
function lrPropM(p){lrPropY(p);const c=Math.cos(p.yaw),s=Math.sin(p.yaw),M=LRP.M,k=p.s||1;
  M[0]=c*k;M[1]=0;M[2]=-s*k;M[3]=0;M[4]=0;M[5]=k;M[6]=0;M[7]=0;M[8]=s*k;M[9]=0;M[10]=c*k;M[11]=0;M[12]=p.x-RO[0];M[13]=p.y-RO[1];M[14]=p.z-RO[2];M[15]=1;return M;}
function lrPropBox(p){if(!p.mn){const E=LR_PROPS[p.id]&&LR_PROPS[p.id][p.obj];if(!E)return null;const k=p.s||1,r=k*Math.hypot(Math.max(-E.min[0],E.max[0]),Math.max(-E.min[2],E.max[2]));lrPropY(p);
    p.mn=[p.x-r,p.y+k*E.min[1]-1,p.z-r];p.mx=[p.x+r,p.y+k*E.max[1]+1,p.z+r];}return p.mn;}
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
  for(const p of WG.GTP){if(p.fd||Math.hypot(p.x-e[0],p.z-e[2])>Math.min(maxD+60,p.far))continue;const m=LRP.mesh.get(p.id+'/'+p.obj);if(!m||!lrPropBox(p)||!boxVisible(F,p.mn,p.mx))continue;
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
  if(LRV.foot)LRV.foot.hidden=!lrWalkCan();
  /* (on a laptop the phone's buttons aren't there: the same two, with their keys, low in the middle) */
  if(LRV.kb||lrKeyUI()){const K=LRV.kb,tc=document.getElementById('touch'),kb=!!tc&&tc.hidden&&LRV.fine.matches,a=kb&&!LRW.on&&lrWalkCan(),b=kb&&!LRW.on&&!!can;if(K.foot.hidden===a)K.foot.hidden=!a;if(K.swap.hidden===b)K.swap.hidden=!b;
    if(b&&K.swap.dataset.v!==can){K.swap.dataset.v=can;K.swap.textContent=can+' \u00b7 E';}K.el.hidden=!(a||b);}}
function lrKeyUI(){if(!document.body)return false;LRV.fine=matchMedia('(pointer: fine)');
  const st=document.createElement('style');st.textContent=`#lrKeys{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom) + 130px);z-index:6;display:flex;gap:10px}
#lrKeys[hidden],#lrKeys button[hidden]{display:none}
#lrKeys button{font:800 13px system-ui,sans-serif;letter-spacing:.1em;color:#fff;background:rgba(16,20,26,.62);border:2px solid rgba(255,255,255,.45);border-radius:999px;padding:11px 18px;cursor:pointer}`;
  document.head.appendChild(st);const el=document.createElement('div');el.id='lrKeys';el.hidden=true;
  el.innerHTML='<button type="button" id="lrKFoot" hidden>ON FOOT \u00b7 F</button><button type="button" id="lrKSwap" hidden>HERON \u00b7 E</button>';document.body.appendChild(el);
  const foot=el.querySelector('#lrKFoot'),swap=el.querySelector('#lrKSwap');
  foot.addEventListener('click',e=>{e.preventDefault();foot.blur();lrWalkStart();});swap.addEventListener('click',e=>{e.preventDefault();swap.blur();lrSwap();});
  LRV.kb={el,foot,swap};return true;}
function lrSwap(){
  const t=GAME.car;if(!t||GAME.state!=='drive'||LRW.on)return false;lrParkTick();
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
addEventListener('keydown',e=>{if(e.code==='KeyE'&&!e.repeat&&GAME.state==='drive'&&!LRW.on&&!/INPUT|TEXTAREA/.test((document.activeElement||{}).tagName||''))lrSwap();});
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
  if(LRH.loc[1])gl.uniform4f(LRH.loc[1],-2.5*Math.PI/180,9.5*Math.PI/180,on,LRDU.k);
  if(on&&LRH.loc[0]){gl.activeTexture(gl.TEXTURE12);gl.bindTexture(gl.TEXTURE_2D,LRH.tex);gl.uniform1i(LRH.loc[0],12);gl.activeTexture(gl.TEXTURE0);}}

/* ---------- ON FOOT: first person. Stop the truck (or the Heron, on the ground) and ON FOOT gets you out beside
   it; walk with the stick (WASD or the arrows on a keyboard, Shift to hurry), look by dragging anywhere else. The
   temples and landmarks have floors and walls (below: their grids), other buildings stop you at their boxes, and so
   do the truck and the Heron; you climb what a
   person can (half a metre a step). Back beside the truck or the Heron, GET IN puts you back ---------- */
const LRW={on:false,p:[0,0,0],yaw:0,pitch:0,ui:null,stick:{x:0,y:0},keys:{},bob:0,veh:null};
const LRW_EYE=1.62,LRW_WALK=1.7,LRW_RUN=3.6;
function lrWalkCan(){const t=GAME.car;if(!t||GAME.state!=='drive'||LRW.on)return false;const sp=Math.hypot(t.v[0],t.v[1],t.v[2]);
  return sp<1.2&&t.p[1]-RANCH.W.heightAt(t.p[0],t.p[2])<3;}
function lrWalkStart(){
  if(!lrWalkCan())return false;const t=GAME.car,M=t.M,yaw=lrYaw(t),f=[Math.cos(yaw),-Math.sin(yaw)],r=[Math.sin(yaw),Math.cos(yaw)];
  /* (out the left side: the driver's door; from the Heron, past the wing's end) */
  const off=t.rt?6.2:2.1;LRW.p=[t.p[0]-r[0]*off+f[0]*(t.rt?1:0),0,t.p[2]-r[1]*off+f[1]*(t.rt?1:0)];LRW.p[1]=RANCH.W.heightAt(LRW.p[0],LRW.p[2]);
  LRW.yaw=yaw+Math.PI/2;LRW.pitch=-.05;LRW.fl=undefined;LRW.on=true;LRW.veh=t;setTestInput({steer:0,thr:0,brk:0,hb:1,nos:false});lrWalkUI(true);say('ON FOOT',1.4);return true;}
function lrWalkEnd(){
  if(!LRW.on)return false;const t=GAME.car;if(Math.hypot(t.p[0]-LRW.p[0],t.p[2]-LRW.p[2])>(t.rt?9:5)){say(t.rt?'WALK BACK TO THE HERON':'WALK BACK TO THE TRUCK',1.6);return false;}
  LRW.on=false;setTestInput(null);lrWalkUI(false);CAM.cut=true;return true;}
/* ---------- WHERE YOU CAN STAND in his big models (src/lr-walk.js, from tools/world/walkgrid.py): for each cell of a
   model's ground plan, the free space straight up through it (from the ground to an underside; a room part way up;
   the top, under the sky), a person's width already in it. You stand on the highest floor you can step up to (half a
   metre) that leaves you room (1.75 m) in every model over you: down the Cistern's steps, up the Terraces, under the
   Arches. A model without a grid still stops you at its box; the truck and the Heron stop you too ---------- */
const LRWK={g:new Map(),ready:false};
(async()=>{try{if(!window.LR_WALK)return;for(const [k,m] of Object.entries(LR_WALK)){const bin=Uint8Array.from(atob(m.z),c=>c.charCodeAt(0));
    const a=new Uint8Array(await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());LRWK.g.set(k,{c:m.c,nx:m.nx,nz:m.nz,x0:m.x0,z0:m.z0,y0:m.y0,st:m.st,a});}
  LRWK.ready=true;}catch(e){console.warn('walk grid: '+(e&&e.message||e));}})();
function lrPropY(p){if(p.y===undefined){const o={};p.y=WG.sample(p.x,p.z,o).h+(p.dy||0);}return p.y;}
/* a model's column at (x,z): its free spans in the world's heights (false where it has nothing) */
function lrWkCol(p,G,x,z,o){const c=Math.cos(p.yaw),s=Math.sin(p.yaw),dx=x-p.x,dz=z-p.z,lx=dx*c-dz*s,lz=dx*s+dz*c;
  const i=Math.floor((lx-G.x0)/G.c),j=Math.floor((lz-G.z0)/G.c);if(i<0||j<0||i>=G.nx||j>=G.nz)return false;
  const n=G.nx*G.nz,k=j*G.nx+i,a=G.a,c0=a[k];if(c0===255)return false;const b=lrPropY(p)+G.y0,f1=a[n+k];
  o.c0=b+c0*G.st;o.f1=f1?b+f1*G.st:NaN;o.c1=f1?b+a[2*n+k]*G.st:NaN;o.f2=b+a[3*n+k]*G.st;return true;}
/* does a person's body (a to b, in height) fit in that column? */
const lrWkFits=(o,a,b)=>b<=o.c0||a>=o.f1-.03&&b<=o.c1||a>=o.f2-.03;
/* the floor a person at (x,z), standing at height foot, can be on there (NaN: they can't be there) */
const LRWF=[];
function lrWalkFloor(x,z,foot){
  const h=RANCH.W.heightAt(x,z),B=WG.GTB||{},cand=[h];let n=0;
  for(const p of WG.GTP){if(!p.solid||Math.abs(p.x-x)>130||Math.abs(p.z-z)>130)continue;const key=p.id+'/'+p.obj,G=LRWK.g.get(key);
    if(G){const o=LRWF[n]||(LRWF[n]={});if(lrWkCol(p,G,x,z,o)){n++;if(o.f1===o.f1)cand.push(o.f1);cand.push(o.f2);}continue;}
    const b=B[key];if(!b)continue;const c=Math.cos(p.yaw),s=Math.sin(p.yaw),dx=x-p.x,dz=z-p.z,lx=dx*c-dz*s,lz=dx*s+dz*c,m=.3;
    if(lx>b[0]-m&&lx<b[3]+m&&lz>b[2]-m&&lz<b[5]+m)return NaN;}
  for(const v of [GAME.car,LRV.parked])if(v){const d=Math.hypot(v.p[0]-x,v.p[2]-z);if(d<(v.rt?2.2:2.0))return NaN;}
  cand.sort((a,b)=>b-a);
  for(const c of cand){if(c>foot+.55||c<h-.05)continue;let ok=true;for(let i=0;i<n;i++)if(!lrWkFits(LRWF[i],c+.05,c+1.75)){ok=false;break;}if(ok)return c;}
  return NaN;}
/* can you see from a to b (the models' walls between)? the last part, at b, is not asked: a find is on a wall (and
   a thing, skip metres of it: a figure's knees, a tree's roots) */
function lrWalkSees(a,b,skip){const L=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]),o={};const N=Math.floor((L-(skip||0))/.2);
  const near=WG.GTP.filter(p=>p.solid&&LRWK.g.has(p.id+'/'+p.obj)&&Math.hypot(p.x-a[0],p.z-a[2])<140);
  for(let k=1;k<N;k++){const t=k*.2/L,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,z=a[2]+(b[2]-a[2])*t,left=L-k*.2;
    for(const p of near){const G=LRWK.g.get(p.id+'/'+p.obj);if(left<G.c*1.5+.35)continue;if(lrWkCol(p,G,x,z,o)&&!lrWkFits(o,y-.01,y+.01))return false;}}
  return true;}
function lrWalkStep(dt){
  const K=LRW.keys,run=K.ShiftLeft||K.ShiftRight;let fw=-LRW.stick.y,sd=LRW.stick.x;
  if(K.KeyW||K.ArrowUp)fw+=1;if(K.KeyS||K.ArrowDown)fw-=1;if(K.KeyD||K.ArrowRight)sd+=1;if(K.KeyA||K.ArrowLeft)sd-=1;
  const l=Math.hypot(fw,sd);if(l>1){fw/=l;sd/=l;}
  const sp=(run||l>.98&&Math.hypot(LRW.stick.x,LRW.stick.y)>.95?LRW_RUN:LRW_WALK)*lrJWalkK(),f=[Math.cos(LRW.yaw),-Math.sin(LRW.yaw)],r=[Math.sin(LRW.yaw),Math.cos(LRW.yaw)];
  const mv=[(f[0]*fw+r[0]*sd)*sp*dt,(f[1]*fw+r[1]*sd)*sp*dt],p=LRW.p;
  /* each way on its own, so you slide along a wall */
  /* (your feet: where you stand, or where you are stepping up to; if you are somewhere you can't be, you can walk out) */
  const ft=Math.max(p[1],LRW.fl===undefined?p[1]:LRW.fl),here=lrWalkFloor(p[0],p[2],ft),stuck=!(here===here);
  for(const [ax,d] of [[0,mv[0]],[2,mv[1]]]){if(!d)continue;const q=[p[0],p[2]];q[ax?1:0]+=d;const f=lrWalkFloor(q[0],q[1],ft);
    if(!(f===f)&&!stuck)continue;p[ax]=q[ax?1:0];}
  const g=lrWalkFloor(p[0],p[2],ft);LRW.fl=g===g?g:RANCH.W.heightAt(p[0],p[2]);p[1]+=(LRW.fl-p[1])*Math.min(1,dt*14);
  if(l>.05)LRW.bob+=dt*sp*2.2;const bob=Math.sin(LRW.bob*2)*.025*Math.min(1,l);
  const cp=Math.cos(LRW.pitch),eye=[p[0],p[1]+LRW_EYE+bob,p[2]],fwd=[Math.cos(LRW.yaw)*cp,Math.sin(LRW.pitch),-Math.sin(LRW.yaw)*cp];
  if(LRW.ui)LRW.ui.back.hidden=Math.hypot(GAME.car.p[0]-p[0],GAME.car.p[2]-p[2])>(GAME.car.rt?9:5);
  LRW.cam={eye,fwd};lrFdTick(dt,eye,fwd);return {eye,fwd,up:[0,1,0],fov:1.15};}
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
    const W=document.createElement('div');W.id='lrWalk';W.hidden=true;W.innerHTML='<div id="lrWStick"><b></b></div><button id="lrWBack" type="button">GET IN</button><button id="lrWShot" type="button" hidden>PHOTO</button><button id="lrWBook" type="button">BOOK</button><div id="lrWHint">DRAG TO LOOK</div>';lrBookUI();document.body.appendChild(W);
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
    const shot=W.querySelector('#lrWShot'),book=W.querySelector('#lrWBook');
    shot.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();lrFdShoot();});book.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();lrBookOpen(true);});
    LRW.ui={W,back,shot,book};}
  LRW.ui.W.hidden=!on;const T=document.getElementById('touch');if(T)T.style.visibility=on?'hidden':'';LRW.stick.x=LRW.stick.y=0;}
addEventListener('keydown',e=>{if(LRW.on)LRW.keys[e.code]=true;if(e.code==='KeyF'&&!e.repeat&&GAME.state==='drive'&&!/INPUT|TEXTAREA/.test((document.activeElement||{}).tagName||'')){if(LRW.on)lrWalkEnd();else lrWalkStart();}});
addEventListener('keyup',e=>{LRW.keys[e.code]=false;});
window.__lr=Object.assign(window.__lr||{},{LRW,lrWalkStart,lrWalkEnd,lrWalkStep,LRWK,lrWalkFloor,lrWalkSees});

/* ---------- THE FINDS (Fable's walk sites: "the satisfying part is arriving ... and the finding"): the Old Hands'
   forty glyphs, cut on the walls of their temples and ruins and on the stones (his C02 tiles, on walls a person can
   walk up to: src/lr-finds.js, from tools/world/finds.py), open hands that show which way the water went, and the
   things to find (the marker stone, the Map Stone, the seated figures, the sighting stone, Venn's camp, the Pan
   Wreck's plate, the Bottle Tree's bark). On foot, within 24 metres, a faint mark on each you haven't found; close
   and looking at it, with nothing between: its ring and name, and a moment's look puts it in the field book. With
   the camera (Teo's wall; free play has it) PHOTO puts its picture in the book, and in the campaign Haugen pays for
   each: $40 a glyph, $75 anything else. All of a place's glyphs, and the book reads what they say; a hand, and the
   book and the big map have the way the water went. One book for the campaign, one for free play ---------- */
const LRFD_W={waves:'water',basin:'tank',chevron_down:'down',equals:'level',three_bars:'three',circle_dot:'spring',doorway_dot:'inside',
  arch:'gate',s_curve:'channel',plus_cross:'crossing',x_cross:'shut',bar_dot:'one',dash_steps:'fields',stairs:'climb',sun:'sun',slashes:'cut',
  branch:'branch',tee:'hold',wave:'river',fork:'divide',two_bars:'two',four_dots:'families',double_arc:'roof',bowl:'lake',boat:'boat',arc_dot:'sky',
  horizon_disc:'sunrise',dome:'sunset',ring:'always',rainbow:'season',zigzags:'rain',double_wave:'running',mountain:'hills',person:'people',
  three_dots:'many',crosshair:'here',tree_rune:'grove',diamond:'stone',chevron_up:'up',corner:'shelter'};
const LRFD_PAY={glyph:40,thing:75,hand:75};
/* the places, in the story's order: where each is (at), the models its glyphs are cut on (h), its glyphs in the order
   the water runs (g), what they say (read), where its hand points (hand) and its things (t: on a model's point) */
function lrFdSites(){return [
  {id:'cistern',name:'The Cistern',at:['C04','model'],h:[['C04','model']],g:['waves','basin','chevron_down','equals'],read:'The water is kept in the tank, below, and level.',
    t:[{id:'marker',name:'the marker stone',on:['C03','model','hand'],to:'threewells',text:'A hand cut in a niche, and under it a groove running down to a little basin. The groove points west.'}]},
  {id:'threewells',name:'Three Wells',at:['C07','model'],h:[['C07','model']],g:['three_bars','circle_dot','doorway_dot'],read:'Three springs, inside.',hand:'city'},
  {id:'gate',name:'The Causeway Gate',at:['C14','model'],h:[['C14','model']],g:['arch','s_curve','plus_cross','x_cross','bar_dot'],read:'The gate where the channel crosses: shut it one way at a time.',hand:'cistern',
    t:[{id:'mapstone',name:'the Map Stone',on:['C16','model','top'],text:'The whole system cut in one slab: channels off the hills, the Causeway, the tanks, and at the end of it, in the dunes, a city.'}]},
  {id:'terraces',name:'The Terraces',at:['C21','model'],h:[['C21','model']],g:['dash_steps','stairs','sun','slashes','branch'],read:'The fields climb to the sun; cut the channels like branches.',hand:'weir',
    t:[{id:'figure',name:'the seated figure',on:['C28','model','figure',['C21','model']],text:'Worn almost smooth. One open hand is held out over the fields, and there are glyphs round its base.'}]},
  {id:'weir',name:'The Weir',at:['C32','model'],h:[['C32','model']],g:['tee','wave','fork','two_bars'],read:'Hold the river and divide it in two.',hand:'gate'},
  {id:'arches',name:'The Arches',at:['D10','arch_wide'],h:[['D10','arch_wide'],['D10','arch_round'],['D10','arch_broken']],g:['zigzags','double_wave','mountain'],read:'The rain runs off the hills.'},
  {id:'congregation',name:'The Congregation',at:'D12',h:'D12',g:['person','three_dots','crosshair','tree_rune'],read:'Many people met here, in the grove of stone.'},
  {id:'marbles',name:'The Marbles',at:['D03','model'],h:[['D03','model']],g:['diamond','chevron_up','corner'],read:'Shelter up among the stones.'},
  {id:'ring',name:'The Observatory Ring',at:['C35','model'],h:[['C35','model']],g:['horizon_disc','dome','ring','rainbow'],read:'Watch the sunrise and the sunset, always, and know the season.',
    t:[{id:'stone',name:'the sighting stone',on:['C35','model','stone'],text:'Grooves across its top line up with gaps in the ring: sunrise and sunset, midsummer and midwinter.'}]},
  {id:'venn',name:'Venn\'s camp',at:['D18','wreck'],h:[],g:[],t:[
    {id:'notebook',name:'Venn\'s notebook',on:['D18','table','top'],text:'Under a stone on the table. The last pages are a list of cairns, by compass and pace, from Three Wells to the city.'},
    {id:'cockpit',name:'his cockpit',on:['D18','wreck','cockpit'],text:'His logbook is still in the door pocket. The last entry: sand in the carburettor, down at the old strip, will walk.'},
    {id:'fire',name:'his last fire',on:['D18','fire_ring','ash'],text:'A ring of stones. Under the crust the ash is still black.'}]},
  {id:'city',name:'The Sunken City',at:['C26','model'],h:[['C26','model']],g:['four_dots','double_arc','bowl','boat','arc_dot'],read:'The families\' roof, by the lake; boats under the sky.',
    t:[{id:'figure',name:'the figure on the dais',on:['C28','model','figure',['C26','model']],text:'The same seated figure, sand to its waist. Its hand is held out west, over where the lake was.'}]},
  {id:'panwreck',name:'The Pan Wreck',at:['D05','model'],h:[],g:[],t:[{id:'plate',name:'the maker\'s plate',on:['D05','model','cab'],text:'A Bedford, 1952. Someone has scratched a date beside the plate, and an arrow pointing north.'}]},
  {id:'bottletree',name:'The Bottle Tree',at:['D02','model'],h:[],g:[],t:[{id:'bark',name:'letters in the bark',on:['D02','model','trunk'],text:'Cut high in the bark, and stretched wide by ninety years of growing: M.V. 1934.'}]}];}
const LRFD={list:null,sites:null,cur:null,dwell:0,near:[],snap:null,ui:null,card:null,rec:null,mode:null,told:false};
const lrFdKey=()=>'gt-book-'+(LRM.mode==='free'?'free':'campaign');
function lrFdRec(){const m=LRM.mode==='free'?'free':'campaign';if(!LRFD.rec||LRFD.mode!==m){LRFD.mode=m;let r={};try{r=JSON.parse(store.get(lrFdKey(),'{}'))||{};}catch(e){}
    LRFD.rec={n:r.n||{},p:r.p||{},paid:r.paid||0};}return LRFD.rec;}
function lrFdSave(){store.set(lrFdKey(),JSON.stringify(LRFD.rec));}
/* a point in a placed model's own frame, in the world */
function lrFdW(p,l){const c=Math.cos(p.yaw),s=Math.sin(p.yaw);return [p.x+l[0]*c+l[2]*s,lrPropY(p)+l[1],p.z-l[0]*s+l[2]*c];}
/* (made once, when the world is there: the tiles go up on their walls, among the placed models) */
function lrFdInit(){
  if(LRFD.list)return LRFD.list;if(!window.LR_SPOTS||typeof WG==='undefined'||!WG.GTP||!WG.GTP.length)return null;
  const GP=(id,obj)=>WG.GTP.find(p=>p.id===id&&p.obj===obj),near=(id,obj,q)=>{let b=null,bd=1e18;for(const p of WG.GTP)if(p.id===id&&p.obj===obj){const d=Math.hypot(p.x-q.x,p.z-q.z);if(d<bd){bd=d;b=p;}}return b;};
  const L=[],sites=lrFdSites();
  for(const S of sites){let hosts;
    if(S.h==='D12'){const A=WG.GTP.filter(p=>p.id==='D12'),cx=A.reduce((a,p)=>a+p.x,0)/A.length,cz=A.reduce((a,p)=>a+p.z,0)/A.length;
      hosts=A.filter(p=>(LR_SPOTS['D12/'+p.obj]||[]).length).sort((a,b)=>Math.hypot(a.x-cx,a.z-cz)-Math.hypot(b.x-cx,b.z-cz)).slice(0,S.g.length);S.c=[cx,cz];}
    else{hosts=S.h.map(h=>GP(h[0],h[1])).filter(Boolean);const a=GP(S.at[0],S.at[1]);S.c=a?[a.x,a.z]:[0,0];}
    /* the walls, round the models in turn, the best first */
    const sp=[];for(let k=0;k<12;k++)for(const p of hosts){const A=LR_SPOTS[p.id+'/'+p.obj]||[];if(A[k])sp.push([p,A[k]]);}
    const tile=(obj,[p,s],sc,hh)=>{const P=lrFdW(p,s),yaw=p.yaw+s[3];WG.GTP.push({id:'C02',obj,x:P[0],z:P[2],y:P[1]-hh*sc,yaw,s:sc,solid:false,far:140,fd:1});
      return {P,n:[Math.sin(yaw),0,Math.cos(yaw)]};};
    S.g.forEach((g,i)=>{if(sp[i])L.push({id:S.id+':'+g,site:S,kind:'glyph',g,name:'the glyph for “'+LRFD_W[g]+'”',...tile('glyph_'+g,sp[i],2.5,.08)});});
    if(S.hand&&sp[S.g.length])L.push({id:S.id+':hand',site:S,kind:'hand',name:'an open hand',to:S.hand,...tile('hand_tablet',sp[S.g.length],1.4,.31)});
    for(const t of S.t||[]){const p=t.on[3]?near(t.on[0],t.on[1],GP(t.on[3][0],t.on[3][1])):GP(t.on[0],t.on[1]),T=window.LR_THINGS&&LR_THINGS[t.on[0]+'/'+t.on[1]],l=T&&T[t.on[2]];
      /* (a thing with a face, the hand on the marker stone, a figure, is seen from in front of it) */
      if(p&&l)L.push({id:S.id+':'+t.id,site:S,kind:t.to?'hand':'thing',name:t.name,text:t.text,to:t.to,P:lrFdW(p,l),
        n:l.length>3?[l[3]*Math.cos(p.yaw)+l[4]*Math.sin(p.yaw),0,-l[3]*Math.sin(p.yaw)+l[4]*Math.cos(p.yaw)]:null});}
    S.finds=L.filter(f=>f.site===S);}
  LRFD.sites=sites;LRFD.list=L;return L;}
const lrFdSite=id=>(LRFD.sites||[]).find(S=>S.id===id);
/* where a point is on the screen (0..1 across, 0..1 up; null behind you) */
function lrFdProj(P){const c=CAM.last;if(!c||!c.VPw)return null;const m=c.VPw,x=P[0],y=P[1],z=P[2],w=m[3]*x+m[7]*y+m[11]*z+m[15];if(w<.1)return null;
  return [((m[0]*x+m[4]*y+m[8]*z+m[12])/w+1)/2,((m[1]*x+m[5]*y+m[9]*z+m[13])/w+1)/2];}
/* each step on foot: what's near, and what you're looking at */
function lrFdTick(dt,eye,fwd){const L=lrFdInit();if(!L)return;const R=lrFdRec();let best=null,ba=1e9;LRFD.near.length=0;
  for(const f of L){const dx=f.P[0]-eye[0],dy=f.P[1]-eye[1],dz=f.P[2]-eye[2],d=Math.hypot(dx,dy,dz);if(d>24||d<.05)continue;
    /* (a glyph is seen from in front of its wall) */
    if(f.n&&dx*f.n[0]+dz*f.n[2]>-.15*d)continue;
    const cs=(dx*fwd[0]+dy*fwd[1]+dz*fwd[2])/d;if(cs<.45)continue;
    if(!R.n[f.id]&&d<24)LRFD.near.push(f);
    const a=Math.acos(Math.min(1,cs));if(d<=(f.kind==='glyph'?4.5:5.5)&&a<.2+.3/d&&a<ba){ba=a;best=f;}}
  if(best&&!lrWalkSees(eye,best.P,best.kind==='glyph'||best.n&&best.kind==='hand'&&!best.text?0:1.4))best=null;
  if(best!==LRFD.cur){LRFD.cur=best;LRFD.dwell=0;}
  if(best&&!R.n[best.id]){LRFD.dwell+=dt;if(LRFD.dwell>.6)lrFdNote(best);}
  lrFdButtons();}
/* into the book */
function lrFdNote(f){const R=lrFdRec();R.n[f.id]=Date.now();lrFdSave();const S=f.site,got=S.finds.filter(q=>R.n[q.id]).length;
  let body=f.kind==='glyph'?'':f.text||'';const gl=S.g.length&&S.g.every(g=>R.n[S.id+':'+g])&&f.kind==='glyph';
  if(gl)body='All of its glyphs: '+S.g.map(g=>LRFD_W[g]).join(' · ')+'. “'+S.read+'”';
  if(f.to){const T=lrFdSite(f.to);body=(body?body+' ':'')+'The hand shows where the water went: to '+(T?T.name.replace(/^The /,'the '):'the west')+'. It\'s on the big map.';}
  lrFdCard(f,S.name+' · '+got+' of '+S.finds.length,body);
  say('IN THE BOOK: '+(f.kind==='glyph'?'“'+LRFD_W[f.g].toUpperCase()+'”':f.name.toUpperCase()),2.4,PAL.gold);
  if(LRM.mode!=='free'&&!lrHas('camera')&&!LRFD.told){LRFD.told=true;setTimeout(()=>say('HAUGEN PAYS FOR PHOTOGRAPHS: THE CAMERA IS ON TEO\'S WALL',3.2,PAL.ink),2600);}}
/* the photograph: one picture drawn without the marks and your hands, then taken */
function lrFdShoot(){const f=LRFD.cur,R=lrFdRec();if(!f||!lrHas('camera')||R.p[f.id]||LRFD.snap)return false;if(!R.n[f.id])lrFdNote(f);LRFD.snap={f};return true;}
function lrFdSnap(){const S=LRFD.snap;LRFD.snap=null;if(!S)return;const f=S.f,R=lrFdRec();
  try{const w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,q=lrFdProj(f.P)||[.5,.5],sz=Math.max(32,Math.round(Math.min(w,h)*.5));
    const x0=Math.max(0,Math.min(w-sz,Math.round(q[0]*w-sz/2))),y0=Math.max(0,Math.min(h-sz,Math.round(q[1]*h-sz/2))),px=new Uint8Array(sz*sz*4);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.readPixels(x0,y0,sz,sz,gl.RGBA,gl.UNSIGNED_BYTE,px);
    const cv=document.createElement('canvas');cv.width=cv.height=sz;const g=cv.getContext('2d'),im=g.createImageData(sz,sz);
    for(let r=0;r<sz;r++)im.data.set(px.subarray((sz-1-r)*sz*4,(sz-r)*sz*4),r*sz*4);g.putImageData(im,0,0);
    const o=document.createElement('canvas');o.width=o.height=160;const og=o.getContext('2d');og.drawImage(cv,0,0,160,160);
    store.set('gt-photo-'+LRFD.mode+':'+f.id,o.toDataURL('image/jpeg',.72));}
  catch(e){console.warn('photo: '+(e&&e.message||e));}
  R.p[f.id]=Date.now();let paid=0;if(LRM.mode!=='free'){paid=LRFD_PAY[f.kind]||40;R.paid+=paid;lrMoney(paid);}lrFdSave();
  const fl=document.createElement('div');fl.style.cssText='position:fixed;inset:0;z-index:9400;background:#fff;opacity:.85;pointer-events:none;transition:opacity .45s';document.body.appendChild(fl);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{fl.style.opacity='0';setTimeout(()=>fl.remove(),600);}));
  say(paid?'PHOTOGRAPHED · HAUGEN PAYS '+Feats.fmtMoney(paid):'PHOTOGRAPHED',2.2,PAL.gold);}
/* the marks: faint on what's near and not yet found, a ring and a name on what you're looking at */
function lrFindHud(){if(!LRW.on||LRFD.snap||!LRFD.list)return;const R=lrFdRec(),col=pack(255,238,200,140);
  for(const f of LRFD.near){if(f===LRFD.cur)continue;const q=lrFdProj(f.P);if(!q)continue;const x=q[0]*W,y=(1-q[1])*H;
    hLine(x,y-2,x+2,y,col);hLine(x+2,y,x,y+2,col);hLine(x,y+2,x-2,y,col);hLine(x-2,y,x,y-2,col);}
  const f=LRFD.cur;if(!f)return;const q=lrFdProj(f.P),q2=lrFdProj([f.P[0],f.P[1]+(f.kind==='glyph'?.32:.5),f.P[2]]);if(!q||!q2)return;
  const x=q[0]*W,y=(1-q[1])*H,got=!!R.n[f.id],fc=got?PAL.gold:PAL.white,r=Math.max(5,Math.min(40,Math.hypot((q2[0]-q[0])*W,(q2[1]-q[1])*H)))*(got?1:1.25-.25*Math.min(1,LRFD.dwell/.6)),k=Math.max(2,r*.35);
  /* (a camera's frame: four corners, closing in as it goes in the book) */
  for(const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){const cx=x+sx*r,cy=y+sy*r;hLine(cx,cy,cx-sx*k,cy,fc);hLine(cx,cy,cx,cy-sy*k,fc);}
  otxt3((f.kind==='glyph'?'A GLYPH: “'+LRFD_W[f.g].toUpperCase()+'”':f.name.toUpperCase()),x,y+r+5,got?PAL.gold:PAL.ink,1,'c');
  if(R.p[f.id])otxt3('PHOTOGRAPHED',x,y+r+12,PAL.dim,1,'c');}
/* the card that comes up when something goes in the book */
function lrFdCard(f,head,body){lrBookUI();const C=LRFD.card;clearTimeout(C.t);
  C.el.innerHTML=(f.kind==='glyph'||f.kind==='hand'&&f.n?lrBookIcon(f.kind==='glyph'?'glyph_'+f.g:'hand_tablet',46):'')+'<div><small>'+head+'</small><b>'+
    (f.kind==='glyph'?'“'+LRFD_W[f.g]+'”':f.name.replace(/^./,c=>c.toUpperCase()))+'</b>'+(body?'<p>'+body+'</p>':'')+'</div>';
  C.el.hidden=false;C.t=setTimeout(()=>{C.el.hidden=true;},body?7500:3500);}
/* PHOTO (when there's something to take and you have the camera) and BOOK, beside GET IN */
function lrFdButtons(){const U=LRW.ui;if(!U||!U.shot)return;const f=LRFD.cur,R=lrFdRec(),can=!!f&&lrHas('camera')&&!R.p[f.id];if(U.shot.hidden===can)U.shot.hidden=!can;}
/* the big map: the way the water went, from each hand you've read */
function lrFdMap(toM){if(!LRFD.list)return;const R=lrFdRec();
  for(const f of LRFD.list){if(!f.to||!R.n[f.id])continue;const T=lrFdSite(f.to);if(!T)continue;const [a,b]=toM(f.site.c[0],f.site.c[1]),[c,d]=toM(T.c[0],T.c[1]);
    lrDash(a,b,c,d,PAL.cyan,1.5,1.5);hDisc(c,d,1.4,PAL.cyan);}
  for(const S of LRFD.sites){const n=S.finds.filter(f=>R.n[f.id]).length;if(!n)continue;const [a,b]=toM(S.c[0],S.c[1]);hRing(a,b,2,n===S.finds.length?PAL.gold:PAL.cyan);}}

/* ---------- THE FIELD BOOK: every place, what you've found there (a glyph's picture and its word; the things, with
   your photograph), what its glyphs say once you have them all, and where its hand pointed; and the Old Hands'
   alphabet, filling in. BOOK on foot, B on a keyboard, or the Jobs tab ---------- */
function lrBookIcon(name,px){const B=window.LR_BOOK;if(!B)return '<i class="ic"></i>';const k=B.names.indexOf(name),rows=Math.ceil(B.names.length/B.cols);
  return `<i class="ic" style="width:${px}px;height:${px}px;background-size:${B.cols*px}px ${rows*px}px;background-position:-${(k%B.cols)*px}px -${Math.floor(k/B.cols)*px}px"></i>`;}
function lrBookUI(){if(LRFD.ui)return LRFD.ui;const st=document.createElement('style');st.textContent=`
#lrBook{position:fixed;inset:0;z-index:9500;background:rgba(10,8,6,.55);display:flex;align-items:center;justify-content:center;font-family:Georgia,'Times New Roman',serif}
#lrBook[hidden],#lrFdCard[hidden]{display:none}
#lrBook .pg{width:min(1000px,calc(100vw - 12px));height:calc(100vh - 12px);max-height:680px;background:#ece2c8;color:#2a2016;border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,.5);display:flex;flex-direction:column;overflow:hidden}
#lrBook header{display:flex;align-items:center;gap:6px;padding:6px 8px 6px 14px;border-bottom:1px solid #c9b994}
#lrBook h2,#lrBook h3,#lrBook p,#lrBook b{font-family:Georgia,'Times New Roman',serif;text-transform:none;letter-spacing:normal;color:#2a2016}
#lrBook h2{margin:0;font-weight:400;font-style:italic;font-size:21px;flex:1;white-space:nowrap}
#lrBook header button{font:700 11px system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;border:1px solid #8a7550;background:transparent;color:#3a2c1c;border-radius:999px;padding:9px 13px;cursor:pointer}
#lrBook header button.on{background:#3a2c1c;color:#ece2c8}
#lrBook header .x{border:0;font-size:22px;padding:2px 10px;line-height:1}
#lrBook .body{flex:1;overflow:auto;padding:4px 14px 14px;-webkit-overflow-scrolling:touch}
#lrBook .site{padding:8px 0 10px;border-bottom:1px dashed #c9b994}
#lrBook .site h3{margin:0 0 2px;font-size:17px;font-weight:700;display:flex;justify-content:space-between;align-items:baseline;gap:8px}
#lrBook small,#lrFdCard small{font:600 10px system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#7a6648}
#lrBook .row{display:flex;flex-wrap:wrap;gap:6px 10px;margin:4px 0}
#lrBook .g{width:54px;text-align:center;font-size:12px;color:#4a3826;line-height:1.15}
.ic{display:block;margin:0 auto 2px;border-radius:5px;background-color:#d9cba8;background-repeat:no-repeat}
#lrBook .g:not(.on) .ic{background:#e3d7b8!important;border:1px dashed #a8936a;box-sizing:border-box}
#lrBook .g:not(.on){color:#a8936a}
#lrBook .read{font-style:italic;margin:4px 0 0;font-size:15px}
#lrBook .th{display:flex;gap:10px;align-items:flex-start;margin:6px 0;max-width:640px;font-size:14px}
#lrBook .th img,#lrBook .th .ph{width:72px;height:72px;border-radius:4px;flex:none;object-fit:cover}
#lrBook .th .ph{border:1px dashed #a8936a;display:grid;place-items:center;font:600 9px system-ui,sans-serif;letter-spacing:.06em;color:#8a7550;text-align:center;padding:4px;box-sizing:border-box}
#lrBook .th b{display:block;font-size:15px}
#lrBook .dim{color:#9a8664}
#lrBook .alpha{display:grid;grid-template-columns:repeat(auto-fill,minmax(66px,1fr));gap:10px 6px;padding-top:8px}
#lrBook footer{padding:7px 14px;border-top:1px solid #c9b994;font:600 11px system-ui,sans-serif;letter-spacing:.06em;color:#6a5638}
#lrFdCard{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom) + 18px);z-index:8;max-width:min(560px,calc(100vw - 420px));min-width:240px;display:flex;gap:10px;align-items:flex-start;
  background:rgba(236,226,200,.95);color:#2a2016;border-radius:10px;padding:9px 12px;font:14px/1.3 Georgia,serif;box-shadow:0 6px 24px rgba(0,0,0,.35);pointer-events:none}
#lrFdCard b{display:block;font-size:16px;margin:1px 0}#lrFdCard p{margin:3px 0 0}
@media (max-width:700px){#lrFdCard{max-width:calc(100vw - 24px);bottom:auto;top:calc(env(safe-area-inset-top) + 64px)}}
#lrWShot,#lrWBook{position:absolute;right:calc(env(safe-area-inset-right) + 24px);border-radius:14px;font:800 14px system-ui,sans-serif;letter-spacing:.1em;color:#fff}
#lrWShot{bottom:calc(env(safe-area-inset-bottom) + 112px);padding:16px 22px;border:2px solid #e2b85c;background:rgba(60,44,16,.7)}
#lrWBook{right:auto;left:calc(env(safe-area-inset-left) + 74px);bottom:calc(env(safe-area-inset-bottom) + 196px);padding:10px 16px;border:2px solid rgba(255,255,255,.4);background:rgba(16,20,26,.5);font-size:12px}
#lrWShot[hidden]{display:none}`;document.head.appendChild(st);
  const D=document.createElement('div');D.id='lrBook';D.hidden=true;D.innerHTML='<div class="pg"><header><h2>Field book</h2><button type="button" data-p="places" class="on">Places</button><button type="button" data-p="glyphs">Glyphs</button><button type="button" class="x" aria-label="Close">✕</button></header><div class="body"></div><footer></footer></div>';
  document.body.appendChild(D);if(window.LR_BOOK)D.style.setProperty('--sh','url('+LR_BOOK.sheet+')');
  const st2=document.createElement('style');st2.textContent='.ic{background-image:var(--sh)}';document.head.appendChild(st2);
  document.documentElement.style.setProperty('--sh',window.LR_BOOK?'url('+LR_BOOK.sheet+')':'none');
  D.addEventListener('click',e=>{const b=e.target.closest('button');if(e.target===D||b&&b.classList.contains('x')){lrBookOpen(false);return;}
    if(b&&b.dataset.p){LRFD.page=b.dataset.p;lrBookFill();}});
  D.addEventListener('pointerdown',e=>e.stopPropagation());
  const C=document.createElement('div');C.id='lrFdCard';C.hidden=true;document.body.appendChild(C);LRFD.card={el:C,t:0};
  LRFD.ui=D;return D;}
function lrBookFill(){const D=lrBookUI(),L=lrFdInit()||[],R=lrFdRec(),pg=LRFD.page||'places',body=D.querySelector('.body');
  for(const b of D.querySelectorAll('header [data-p]'))b.classList.toggle('on',b.dataset.p===pg);
  const ph=id=>store.get('gt-photo-'+LRFD.mode+':'+id,'');let h='';
  if(pg==='places'){
    for(const S of LRFD.sites||[]){const n=S.finds.filter(f=>R.n[f.id]).length;
      h+=`<div class="site"><h3><span>${S.name}</span><small>${n?n+' of '+S.finds.length+' found':'not yet visited'}</small></h3>`;
      if(!n){h+='</div>';continue;}
      if(S.g.length){h+='<div class="row">'+S.g.map(g=>{const on=!!R.n[S.id+':'+g];return `<div class="g${on?' on':''}">${lrBookIcon('glyph_'+g,44)}${on?LRFD_W[g]:'?'}</div>`;}).join('')+'</div>';
        h+=S.g.every(g=>R.n[S.id+':'+g])?`<p class="read">“${S.read}”</p>`:'<p class="dim" style="margin:2px 0 0;font-size:13px">Find all its glyphs and the book can read them.</p>';}
      for(const f of S.finds){if(f.kind==='glyph')continue;const on=!!R.n[f.id],p=on&&ph(f.id),T=f.to&&lrFdSite(f.to);
        if(!on){h+='<div class="th"><div class="ph">?</div><div class="dim">Something else is here.</div></div>';continue;}
        h+=`<div class="th">${p?`<img src="${p}" alt="">`:`<div class="ph">${lrHas('camera')?'NO PHOTO YET':'NEEDS THE CAMERA'}</div>`}<div><b>${f.name.replace(/^./,c=>c.toUpperCase())}</b>${f.text?f.text+' ':''}${T?'<i>The hand shows the water went to '+T.name.replace(/^The /,'the ')+'.</i>':''}</div></div>`;}
      const gp=S.g.filter(g=>R.p[S.id+':'+g]).map(g=>ph(S.id+':'+g)).filter(Boolean);
      if(gp.length)h+='<div class="row">'+gp.map(u=>`<img src="${u}" alt="" style="width:56px;height:56px;border-radius:4px;object-fit:cover">`).join('')+'</div>';
      h+='</div>';}}
  else{const names=Object.keys(LRFD_W).sort(),got=names.filter(g=>L.some(f=>f.g===g&&R.n[f.id]));
    h+=`<p style="margin:8px 0 0">The Old Hands’ alphabet: <b>${got.length} of ${names.length}</b> glyphs. Each place has a few, cut in the order the water runs.</p><div class="alpha">`+
      names.map(g=>{const on=got.includes(g);return `<div class="g${on?' on':''}" style="width:auto">${lrBookIcon('glyph_'+g,48)}${on?LRFD_W[g]:'?'}</div>`;}).join('')+'</div>';}
  body.innerHTML=h;
  const all=L.length,n=L.filter(f=>R.n[f.id]).length,p=L.filter(f=>R.p[f.id]).length;
  D.querySelector('footer').textContent=`Found ${n} of ${all} · photographs ${p}`+(LRFD.mode==='campaign'?` · Haugen has paid ${Feats.fmtMoney(R.paid)}`:' · free play');}
function lrBookOpen(on){const D=lrBookUI();if(on===undefined)on=D.hidden;if(on){lrFdInit();lrBookFill();}D.hidden=!on;if(on&&LRW.on)LRW.stick.x=LRW.stick.y=0;}
addEventListener('keydown',e=>{if(/INPUT|TEXTAREA/.test((document.activeElement||{}).tagName||'')||e.repeat)return;
  if(e.code==='KeyB'&&GAME.state==='drive')lrBookOpen();if(e.code==='Escape'&&LRFD.ui&&!LRFD.ui.hidden)lrBookOpen(false);if(e.code==='KeyE'&&LRW.on)lrFdShoot();});
window.__lr=Object.assign(window.__lr||{},{LRFD,lrFdInit,lrFdRec,lrFdShoot,lrBookOpen,lrFdNote,lrFdProj});

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
  const Q=(id,who,title,needs,intro,steps,outro,reward,tip)=>{JOB_NAMES[id]=`${PEOPLE[who].short}'s job, ${title}`;
    /* (what to bring, from the steps that need something: on the card) */
    const bring=[...new Set(steps.filter(s=>s.need).flatMap(s=>[].concat(s.need)))].map(lrNeedName);
    if(bring.length)tip=(tip?tip+' ':'')+'Bring: the '+bring.join(', the ')+' (Teo\'s wall in the Outfitter).';return {id,who,title,needs,intro,steps,outro,reward,tip};};
  const S=WG.GTS,C=WG.GTP.find(p=>p.id==='C04'),W=WG.GTP.find(p=>p.id==='C07'),K=WG.GTP.find(p=>p.id==='D05');
  const end=[S[0].x+S[0].dx*900,S[0].z+S[0].dz*900],GP=(id,obj)=>WG.GTP.find(p=>p.id===id&&(!obj||p.obj===obj)),GA=id=>WG.GTP.filter(p=>p.id===id);
  const G=GP('C14'),MS=GP('C16'),CW=[WG.GX(17.5),WG.GZ(13.6)],AR=GP('D10','arch_wide'),CGs=GA('D12'),CG=[CGs.reduce((a,p)=>a+p.x,0)/CGs.length,CGs.reduce((a,p)=>a+p.z,0)/CGs.length];
  const TE=GP('C21'),SF=GA('C28').find(p=>Math.hypot(p.x-TE.x,p.z-TE.z)<200),WE=GP('C32'),OB=GP('C35'),VW=GP('D18','wreck'),VT=GP('D18','tent');
  const D8=S[8],DC=[[D8.x-3200,D8.z-2600],[D8.x+1400,D8.z-4300],[D8.x+4200,D8.z+1600]];
  const CA=GA('D07'),CN=[CA[3],CA[8],CA[13]],CY=GP('C26'),CT=GA('C28').find(p=>Math.hypot(p.x-CY.x,p.z-CY.z)<200),WM=GA('D04'),BT=GP('D02'),MB=GP('D03');
  const RS=lrRescuePlaces(),X=(q,o)=>Object.assign(q,o),SB=i=>({x:S[i].x,z:S[i].z,r:S[i].len/2+60});
  return [
    Q('firstlight','dell','First Light',[],
      ['Pilot. You\'re the new contract.','The Heron\'s on the apron. Take her out past the east end of the runway, come round, and put her down again. Gently. Then come and see me.'],
      [{t:'goto',x:end[0],z:end[1],r:250,name:'past the runway\'s east end',text:'Fly out past the east end of the runway'},{t:'land',strip:0,text:'Land at Roadhead and stop'},{t:'talk',who:'dell',text:'See Dell on the apron'}],
      {text:'Copy. You\'ll do.'},{money:150},'Drive up to the Heron and stop: HERON gets you in. Stopped on a strip in the Heron, TRUCK gets you out to the truck waiting there.'),
    Q('mail','dell','The Mail',['firstlight'],
      ['Mail for Kettle Creek Station. Nkem\'s been waiting a week.','The strip\'s about twenty kilometres west, past the creek lines. Watch for cattle on it. The truck will be waiting.'],
      [{t:'land',strip:1,text:'Fly the mail to Kettle Creek Station'},{t:'talk',who:'nkem',text:'Take it to Nkem at the homestead'}],
      {who:'nkem',text:'About time. Tell Dell the dust is coming early this year.'},{money:300},'Paid jobs buy gear: OUTFIT in the bay is Teo\'s wall.'),
    Q('groundtruth','haugen','Ground Truth',['mail'],
      ['Dr Ilse Haugen. I have a contract, a camera and no plane.','There is a stone tank in the savanna south-east of the station. The families call it the Cistern. I need someone to find it from the air, and then to stand in it.'],
      [{t:'goto',x:C.x,z:C.z,r:600,name:'the Cistern',text:'Find the Cistern from the air'},{t:'land',strip:1,text:'Land at Kettle Creek'},
       {t:'foot',x:C.x,z:C.z,r:14,name:'the Cistern',text:'Drive to the Cistern, get out and walk into it',need:'prybar'},{t:'talk',who:'haugen',text:'Back to Haugen at the roadhouse'}],
      {text:'Copy. I mean: what? The carving\'s hand points west? Into the dunes? Copy.'},{money:800}),
    Q('threewells','haugen','Three Wells',['groundtruth'],
      ['West of the station, where the grass gives out, there are three wells that have never been dry.','The station says there\'s a temple there, half under the sand. Land at the dune\'s edge and walk it.'],
      [{t:'land',strip:3,text:'Land at Three Wells, at the dune\'s edge'},{t:'foot',x:W.x,z:W.z,r:16,name:'Three Wells',text:'Walk to the temple of the Three Wells',need:'machete'},{t:'talk',who:'haugen',text:'Back to Haugen'}],
      {text:'Into the dunes. The channel runs into the dunes. Nobody builds a channel into a desert.'},{money:1000}),
    Q('panwreck','dell','The Pan Wreck',['mail'],
      ['A driver\'s gone out on the Pan and not come back. His truck\'s an old one.','Land on the salt at Pan Strip, take the truck out to him and see what\'s left.'],
      [{t:'land',strip:2,text:'Land on the salt at Pan Strip'},{t:'deliver',x:K.x,z:K.z,r:18,name:'the wreck',text:'Drive out to the wreck on the Pan'},{t:'talk',who:'dell',text:'Report to Dell'}],
      {text:'Nobody in it? Then he walked. Nkem\'ll find him. Good work.'},{money:600}),
    /* THE RESCUES (Fable's four, his call Nov 8 2026; design/rescues-2026-11-08.md): each has a clock, and running out of
       it never ends the job, it only ends it worse (the late ending: less pay, a sadder line). Someone picked up comes
       with you, and their weight is on the Heron */
    X(Q('borethree','nkem','Bore Three',['mail'],
      ['Bowen\'s rolled the quad at Bore Three. His leg\'s broken, he says, and he says it calmly, which is how I know it\'s bad.','The truck\'s here. Bore Three is up the Windmill Line, nine kilometres north-east. He\'s tied his red shirt to the windmill so you\'ll know which one. Bring him back to the Heron and fly him to Roadhead: the nurse will meet you. And the sun\'s going down.'],
      [{t:'pickup',x:RS.bowen[0],z:RS.bowen[1],r:14,kg:90,pax:'Bowen',name:'Bowen',text:'Drive up the Windmill Line to Bore Three and get Bowen in the truck',need:'firstaid',stop:1,
         line:['Bowen, as you lift him: \u201cDon\'t tell Nkem I came off at a walking pace.\u201d']},
       {t:'drive',...SB(1),name:'the Heron at Kettle Creek',text:'Drive him back to the Heron. Gently'},
       {t:'land',strip:0,text:'Fly Bowen to Roadhead and stop'},{t:'talk',who:'dell',text:'The nurse is with Dell on the apron'}],
      {who:'dell',text:'Nurse has him. He said to tell you, and I quote: \u201cPilot. That was a soft landing. I noticed.\u201d'},{money:1100},
      'The clock is the daylight: get to him before dark. Late is never a fail, only worse.'),
      {clock:20,hour:a=>a.late?'night':'golden',lateSay:'DARK AT BORE THREE',
       late:{who:'dell',text:'Nurse has him. His leg set badly; the dark does that. Nkem says thanks all the same.',money:500}}),
    X(Q('walker','dell','The Walker',['panwreck'],
      ['Nkem called. Nobody in the wreck means he walked, and he walked east, at the station\'s lights. That was a day ago, with one bottle of water.','Fly the Pan\'s east edge low and slow and find him. Then land at Pan Strip and take the truck out. Noon on the Pan is forty-five degrees. He\'s got till about then.'],
      [{t:'spot',x:RS.walker[0],z:RS.walker[1],r:450,cx:RS.wsearch[0],cz:RS.wsearch[1],search:2200,name:'the search area',text:'Search the Pan\'s east edge from the air: under 500 feet, under 90 mph',found:'THERE HE IS: PAST THE STONES, AT THE PAN\'S EDGE',late:{r:800}},
       {t:'land',strip:2,text:'Land on the salt at Pan Strip'},
       {t:'pickup',x:RS.walker[0],z:RS.walker[1],r:12,kg:80,pax:'the walker',name:'the walker',text:'Drive out to him and get him in the truck',need:['water','firstaid'],stop:1,
         line:['When you reach him: \u201cI kept walking at the lights. They never got closer.\u201d','You give him the water can first. All of it.']},
       {t:'drive',...SB(2),name:'the Heron at Pan Strip',text:'Drive him back to the Heron'},
       {t:'land',strip:0,text:'Fly him to Roadhead'},{t:'talk',who:'dell',text:'See Dell on the apron'}],
      {text:'Nkem says he\'ll keep his hands. Over the station he asked: \u201cThose lights? That\'s where I was going? That\'s it?\u201d'},{money:1300},
      'Look for anything that isn\'t salt: stones, a flash. The clock is the heat.'),
      {clock:30,lateSay:'NOON ON THE PAN',late:{text:'Nkem says he\'ll keep his hands. Just.',money:600}}),
    /* the rest of Fable's chain (his "a bunch of different jobs": the survey arc, deliveries, a rescue, mundane runs),
       on the places that are built: 'drive' is in the truck, 'fly' is over it in the Heron */
    Q('theline','haugen','The Line',['threewells'],
      ['The Old Hands built a road. Raised stone, dead straight, thirty kilometres across the savanna. The station calls it the Causeway.','Drive it from its south-west end to the Gate. There is a stone in the Gate. Read it.'],
      [{t:'drive',x:CW[0],z:CW[1],r:60,name:'the Causeway\'s south-west end',text:'Drive to the Causeway\'s south-west end'},
       {t:'drive',x:G.x,z:G.z,r:30,name:'the Gate',text:'Drive the Causeway north-east to the Gate'},
       {t:'foot',x:MS.x,z:MS.z,r:7,name:'the Map Stone',text:'Get out and read the Map Stone in the Gate'},{t:'talk',who:'haugen',text:'Back to Haugen at the roadhouse'}],
      {text:'The whole system. In stone. And at the end of it, where the dunes are: a city. Copy. I mean it. A city.'},{money:1200}),
    Q('congregation','haugen','The Congregation',['theline'],
      ['East, in the canyon country, there is a field of standing stones the rangers call the Congregation.','The Map Stone has the same figures cut on it. Land at Rim Strip, go and walk among them. And look at the Arches on your way.'],
      [{t:'land',strip:4,text:'Land at Rim Strip'},{t:'foot',x:CG[0],z:CG[1],r:40,name:'the Congregation',text:'Walk among the stones of the Congregation'},
       {t:'fly',x:AR.x,z:AR.z,r:350,name:'the Arches',text:'Fly over the Arches on the way home'},{t:'talk',who:'haugen',text:'Back to Haugen'}],
      {text:'They counted. Every stone is a count of something. Water, I think. Always water.'},{money:1400}),
    X(Q('goingunder','dell','Going Under',['congregation'],
      ['Harker\'s on the radio, from the delta. Two of his survey crew took their truck out onto River Mouth Bar at low water and bogged it to the axles.','Flight Service says it\'s rained on the tableland since dawn: the river\'s coming up, and the bar goes under in about twenty minutes. Fly low up the river, land on the bar\'s far end, walk to them, fly them out. Harker\'s at the Delta Strip camp.'],
      [{t:'fly',x:RS.bar.x,z:RS.bar.z,r:700,below:120,name:'River Mouth Bar',text:'Fly low up the river to River Mouth Bar (under 400 feet)'},
       {t:'landw',w:1,text:'Land on River Mouth Bar, short of their truck'},
       {t:'pickup',x:RS.crew[0],z:RS.crew[1],r:10,kg:170,pax:'the survey crew',name:'the survey crew',text:'Walk to their truck and bring them back to the Heron',need:'firstaid',stop:1,
         line:['One of them, with a cut head: \u201cYou landed on that? On purpose?\u201d','Two men and their gear: 170 kg. The Heron will need more of the bar to get off it.']},
       {t:'land',strip:8,text:'Take off along the bar with both aboard, and land at the Delta Strip'},{t:'talk',who:'harker',text:'Harker, at Meridian\'s camp'}],
      {who:'harker',text:'Truck\'s insured, mate. Men aren\'t. Thanks. And one of them says he\'s surveyed that river three years and never seen it from up there.'},{money:1800},
      'The clock is the river. The Heron needs about 250 m of sand with both men aboard.'),
      {clock:20,lateSay:'THE RIVER\'S OVER THE BAR\'S EDGES',late:{who:'harker',text:'They were up to their knees by the time you got there, and the truck\'s gone to the river. Truck\'s insured, mate. Men aren\'t. Thanks.',money:900}}),
    Q('switchback','haugen','The Switchback',['theline'],
      ['The water starts on the tableland, behind the escarpment. There is one way up for a truck: the Switchback.','Land at the foot of it, drive my camp up to the Terraces, and find the figure that sits there.'],
      [{t:'land',strip:6,text:'Land at the Switchback strip, at the foot of the escarpment'},{t:'drive',x:TE.x,z:TE.z,r:40,name:'the Terraces',text:'Drive up the Switchback to the Terraces'},
       {t:'foot',x:SF.x,z:SF.z,r:8,name:'the seated figure',text:'Walk up to the seated figure'},{t:'fly',x:WE.x,z:WE.z,r:300,name:'the Weir',text:'Fly to the Weir at the top of the falls'},
       {t:'talk',who:'haugen',text:'Back to Haugen'}],
      {text:'The spring, the weir, the channel. That is where all of it starts. Now we only need where it ends.'},{money:1500}),
    Q('thecount','nkem','The Count',['mail'],
      ['Dry-season count. I need the delta flown low and slow, three marked points, before the herds move.','Then land at the Delta Strip. Meridian\'s people are camped there; be polite.'],
      [{t:'fly',x:DC[0][0],z:DC[0][1],r:300,name:'the first count point',text:'Fly low over the first count point',need:'camera'},{t:'fly',x:DC[1][0],z:DC[1][1],r:300,name:'the second count point',text:'Fly low over the second count point',need:'camera'},
       {t:'fly',x:DC[2][0],z:DC[2][1],r:300,name:'the third count point',text:'Fly low over the third count point',need:'camera'},{t:'land',strip:8,text:'Land at the Delta Strip'},{t:'talk',who:'harker',text:'Say hello to Harker at Meridian\'s camp'}],
      {who:'harker',text:'Counting cranes, mate? Lovely. Don\'t mind the trucks. Survey work. Pointed at the dunes, yeah.'},{money:900}),
    Q('crate','harker','Harker\'s Crate',['thecount','switchback'],
      ['Got a crate needs to go to the Caldera, mate. Sealed. Pays double.','Don\'t open it. Spiral down, the strip\'s on the crater\'s rim. Then Ruben at Last Well wants a word, apparently.'],
      [{t:'land',strip:9,text:'Fly the crate to the Caldera strip'},{t:'foot',x:OB.x,z:OB.z,r:12,name:'the stone ring',text:'Walk to the stone ring on the cone'},
       {t:'land',strip:11,text:'Land at Last Well'},{t:'talk',who:'ruben',text:'See Ruben at Last Well'}],
      {who:'ruben',text:'Seismic charges. That\'s his crate. They want to shake the dunes and listen. And the old surveyor\'s strip, the one nobody finds: it\'s north of the city, where the sand goes pale.'},{money:2000}),
    Q('oldstrip','ruben','The Old Strip',['crate'],
      ['I was a boy when he flew. Venn. Mallory Venn.','Fly the north dunes. His strip is a pale line in the sand, with his plane at the end of it. His notebook will be in the tent.'],
      [{t:'land',strip:10,text:'Find Venn\'s strip in the dunes and land on it',need:'tundra'},{t:'foot',x:VW.x,z:VW.z,r:12,name:'Venn\'s wreck',text:'Walk to Venn\'s wreck'},
       {t:'foot',x:VT.x,z:VT.z,r:7,name:'Venn\'s tent',text:'Find his notebook in the tent'},{t:'talk',who:'haugen',text:'Take the notebook to Haugen'}],
      {text:'A line. Cairn by cairn, from Three Wells to the city. He drove it. In 1934. Copy.'},{money:1500}),
    Q('dust','dell','Dust',['oldstrip'],
      ['Flight Service has a dust wall coming from the west. Everything\'s grounded after it gets here.','Get to Three Wells before it does. Then it\'s the truck: Venn\'s line, cairn to cairn, to the city. Lights on.'],
      [{t:'land',strip:3,text:'Land at Three Wells before the dust'},{t:'drive',x:CN[0].x,z:CN[0].z,r:40,name:'Venn\'s first cairns',text:'Drive Venn\'s line west: the first cairns',need:'ladders'},
       {t:'drive',x:CN[1].x,z:CN[1].z,r:40,name:'the cairns halfway',text:'Keep to the cairns'},{t:'drive',x:CN[2].x,z:CN[2].z,r:40,name:'the last cairn',text:'The last cairn'},
       {t:'drive',x:CY.x,z:CY.z,r:70,name:'the Sunken City',text:'Drive into the Sunken City'}],
      {text:'You\'re in? In the city? Stay there till it blows through. Copy, pilot.'},{money:1800},'In the dust, the Heron can\'t fly. Follow the gold line on the map: the cairns are Venn\'s.'),
    Q('city','haugen','The Sunken City',['dust'],
      ['Dawn. The dust has gone through. You are standing in it.','Walk the hall. Climb the tower. Then fly me over it with the camera running: that is the line that puts it on the map.'],
      [{t:'foot',x:CY.x,z:CY.z,r:14,name:'the great hall',text:'Walk into the great hall',need:'lantern'},{t:'foot',x:CT.x,z:CT.z,r:9,name:'the tower',text:'Climb the tower',need:'rope'},
       {t:'land',strip:10,text:'Fly to Venn\'s strip for Haugen'},{t:'fly',x:CY.x,z:CY.z,r:300,name:'the city',text:'Fly Haugen over the city',need:'camera'},{t:'talk',who:'dell',text:'Back to Dell at Roadhead'}],
      {text:'Copy. Ground truth.'},{money:2500}),
    /* side work */
    Q('drum','teo','Fuel to Last Well',['mail'],
      ['Ruben\'s out of avgas again. One drum. It\'s a long way north; mind your fuel both ways.','Land at Last Well, give it to him.'],
      [{t:'land',strip:11,text:'Fly the drum to Last Well'},{t:'talk',who:'ruben',text:'Take it to Ruben'}],
      {who:'ruben',text:'Ah. The good stuff. Sit a while. No? Next time.'},{money:900}),
    X(Q('coldbox','dell','The Cold Box',['drum'],
      ['Snakebite at Last Well. Ruben. A brown, he says, about so long. The antivenom\'s in the roadhouse fridge: here, in the cold box. Go.','It\'s the longest run there is, and it\'ll be dark when you get there. Ruben can\'t put the truck\'s lights on the strip tonight. Look for his window.'],
      [{t:'land',strip:11,text:'Fly the cold box to Last Well, into the dark'},
       {t:'foot',x:RS.ruben[0],z:RS.ruben[1],r:5,name:'Ruben',text:'Walk the cold box to Ruben at his shack',need:'firstaid',drop:'box',stop:1,
         line:['Ruben, when you put the box in his hands: \u201cTook your time. Joking. Sit a while. No? All right. Fly.\u201d']},
       {t:'pickup',x:RS.ruben[0],z:RS.ruben[1],r:9,kg:90,pax:'Ruben',name:'Ruben',text:'Ruben insists on walking to the Heron'},
       {t:'land',strip:0,text:'Fly him to Roadhead, the one lit runway'},{t:'talk',who:'dell',text:'The nurse is with Dell'}],
      {text:'Nurse says he\'ll be fine. Over the dunes he said Venn flew at night once, and said the dunes were silver. He says Venn was right.'},{money:1500},
      'The clock: the box in his hands. The strip at Last Well is dark: his window\'s the only light.'),
      {clock:25,give:[{n:'the cold box',kg:15,k:'box'}],hour:a=>a.late||(a.jt||0)>420||a.stopped?'night':'golden',lateSay:'RUBEN\'S GETTING WORSE',
       late:{text:'He\'s sicker than he lets on. A week in Roadhead, the nurse says. He\'ll hate every day of it.',money:700}}),
    Q('windmills','nkem','The Windmill Line',['mail'],
      ['Five bores north-east of the station, one every three kilometres. The windmills need checking before the dry.','By truck. Stop at each one.'],
      WM.map((p,i)=>({t:'drive',x:p.x,z:p.z,r:18,name:'bore '+(i+1),text:'Check bore '+(i+1)+' of 5'})).concat([{t:'talk',who:'nkem',text:'Back to Nkem'}]),
      {text:'All turning? Then the cattle drink this year. Thanks.'},{money:700}),
    Q('bottletree','nkem','Over the Bottle Tree',['mail'],
      ['There\'s a herd that waters at the Bottle Tree, and another at the Marbles. Fly over both and count them for me.'],
      [{t:'fly',x:BT.x,z:BT.z,r:300,name:'the Bottle Tree',text:'Fly over the Bottle Tree',need:'camera'},{t:'fly',x:MB.x,z:MB.z,r:300,name:'the Marbles',text:'Fly over the Marbles',need:'camera'},{t:'land',strip:1,text:'Land at Kettle Creek'},{t:'talk',who:'nkem',text:'Tell Nkem'}],
      {text:'Fewer than last year. Not by much. Good.'},{money:500})];
}
/* ---------- THE RESCUES' MACHINERY (Fable's "what's new", the parts the four need):
   - the job clock: minutes on the job (q.clock) until the step marked stop is done (the person reached); the HUD
     counts it down under the job; at zero nothing stops, the job goes on to its late ending (q.late: less pay,
     another line) and any step with a late version (s.late) changes to it. Never a fail
   - pickup: stop within r of someone, on foot or in a vehicle, and they come with you: their weight goes on the
     Heron (the flight model's own mass: a longer take-off roll, a lazier climb), on foot you walk at 60%, and a
     rollover in the truck with them aboard hurts them (the pay down a step)
   - spot: a search circle on the maps, not the place; done in the Heron under 150 m and 90 mph within r of them
   - things handed to you (q.give: the cold box) and handed over (s.drop)
   - the job sets the hour (q.hour: golden hour, night), and gives yours back after
   - signals: points of light you see from the air (a mirror's flash, hazard lights, a lit window), and the
     things the job puts in the world while it's on (a shirt on a windmill, an SOS of stones, a bogged truck) ---------- */
const LRJ={tod0:null,propsFor:undefined,mesh:false,los:new Map(),dlgT:0};
function lrRescuePlaces(){const G=WG.GX,Z=WG.GZ,WM=WG.GTP.filter(p=>p.id==='D04'),B=WM[2],W=WG.GTW[1],u=148,R=PEOPLE.ruben;
  const at=(S,u,v)=>[S.x+S.dx*u-S.dz*v,S.z+S.dz*u+S.dx*v];
  return {b3:B,bowen:[B.x+Math.sin(B.yaw+1.9)*9,B.z+Math.cos(B.yaw+1.9)*9],walker:[G(18.3),Z(8.8)],wsearch:[G(17.0),Z(9.6)],sos:[G(16.7),Z(8.4)],
    bar:W,truck:at(W,u+8,9),crew:at(W,u,3),ruben:[R.x,R.z]};}
/* a step as it is now (its late version once the clock's gone) */
function lrJStep(q,a){const st=q.steps[a.step];return st&&a.late&&st.late?Object.assign({},st,st.late):st;}
function lrJClock(A,dt){const q=A.q,a=A.a;if(!q.clock||a.late||a.stopped)return;a.jt=(a.jt||0)+dt;
  if(a.jt>q.clock*60){a.late=1;JOB.memo=null;JOB.hud=null;chSave();say('DELL: CLOCK\'S GONE, PILOT. DOESN\'T CHANGE WHAT YOU DO NEXT',5,PAL.amber);say(q.lateSay||'THE CLOCK\'S GONE',5,PAL.amber);}}
/* the HUD's clock: seconds left; -1 late; null when there's none (or it's stopped: you've reached them) */
function lrJLeft(A){const q=A.q,a=A.a;if(!q.clock||a.stopped)return null;return a.late?-1:Math.max(0,q.clock*60-(a.jt||0));}
/* a step done: someone comes with you, something's handed over, the clock stops; and what they say */
function lrJDone(A){const s=A.s,a=A.a;a.load=a.load||[];
  if(s.t==='pickup'){a.load.push({n:s.pax,kg:s.kg,p:1});say((s.pax+' '+(/crew|two/i.test(s.pax)?'are':'is')+' with you · '+s.kg+' kg').toUpperCase(),3.5,PAL.green);}
  if(s.drop){const d=a.load.find(l=>l.k===s.drop);a.load=a.load.filter(l=>l.k!==s.drop);if(d)say(('Handed over: '+d.n).toUpperCase(),3,PAL.green);}
  if(s.stop)a.stopped=1;
  if(s.found)say(s.found,3.5,PAL.green);
  if(s.line)setTimeout(()=>{if(GAME.state!=='drive')return;{const R=s.name==='Ruben',N=s.name[0].toUpperCase()+s.name.slice(1);jobDialog({who:R?PEOPLE.ruben:null,eyebrow:A.q.title,title:N,lines:s.line,no:'Go'});}},250);}
/* the job's end: the pay and the closing line, the late one if the clock went, less again if someone got hurt */
function lrJPay(q,a){let m=a.late&&q.late?q.late.money:(q.reward||{}).money||0;if(a.hurt)m=Math.round(m*.7/50)*50;return Object.assign({},q.reward,{money:m});}
const lrJHow=a=>({late:!!a.late,hurt:!!a.hurt});
function lrJOutro(q,how){const L=how&&how.late&&q.late?q.late:q.outro,out=[L.text];if(how&&how.hurt)out.push('And the rollover didn\'t help: the nurse took a while with that. Less pay for the extra damage.');return out;}
function lrJStart(q,a){if(q.give){a.load=q.give.map(g=>Object.assign({},g));say(('You have '+q.give.map(g=>g.n).join(', ')).toUpperCase(),3,PAL.green);}}
function lrJEnd(){}
function lrJTod(id){if(!TOD[id])return;APP.tod=id;applyTod(id);APP.lights=!!(TOD[id].beams??TOD[id].lightsOn);}
/* on foot with someone: 60% */
function lrJWalkK(){const A=typeof jActive!=='undefined'?jActive():null;return A&&A.a.load&&A.a.load.some(l=>l.p)?.6:1;}
function lrJKg(A){return A&&A.a.load?A.a.load.reduce((s,l)=>s+l.kg,0):0;}
/* each frame: the hour, the weight aboard, a rollover with someone aboard, the job's things in the world */
function lrJTick(dt,t){const A=jActive(),q=A&&A.q,a=A&&A.a;
  const want=q&&q.hour?q.hour(a):null;
  if(want){if(LRJ.tod0===null)LRJ.tod0=APP.tod;if(APP.tod!==want)lrJTod(want);}
  else if(LRJ.tod0!==null){const b=LRJ.tod0;LRJ.tod0=null;if(APP.tod!==b)lrJTod(b);}
  const kg=lrJKg(A);
  if(t){if(t.__m0===undefined)t.__m0=t.m;const m=t.__m0+(t.rt?kg:0);if(t.m!==m)t.m=m;}
  if(a&&t&&!t.rt&&!LRW.on&&a.load&&a.load.some(l=>l.p)&&!a.hurt&&t.M[4]<.3){a.hurt=1;chSave();say('THAT HURT HIM. THE PAY WILL BE LESS',3.5,PAL.amber);say((a.load.find(l=>l.p).n+': EASY!').toUpperCase(),3.5,PAL.amber);}
  lrJProps(A);}
/* the job's things in the world, while it's on (pushed into the placed models, taken out after) */
function lrJProps(A){const id=A?A.q.id:null;if(id===LRJ.propsFor)return;LRJ.propsFor=id;
  for(let i=WG.GTP.length-1;i>=0;i--)if(WG.GTP[i].lrj)WG.GTP.splice(i,1);
  if(!id)return;const R=lrRescuePlaces(),put=(o)=>WG.GTP.push(Object.assign({solid:false,far:2500,lrj:1},o));lrJMeshes();
  if(id==='borethree')put({id:'R0',obj:'shirt',x:R.b3.x,z:R.b3.z,yaw:R.b3.yaw,far:3000});
  if(id==='walker'){/* SOS in boulders on the salt, 30 m letters, reading from the south */
    const L=lrSosPts(),F=['boulder_xs','boulder_s','boulder_xs','boulder_m'];let k=0;
    for(const [lx,ly] of L){k++;put({id:'F06',obj:F[k%4],x:R.sos[0]+lx,z:R.sos[1]-ly,yaw:k*2.39,s:k%4===3?.75:1,far:4000});}}
  if(id==='goingunder'){const W=R.bar,o={};put({id:'D05',obj:'model',x:R.truck[0],z:R.truck[1],yaw:Math.atan2(W.dx,W.dz)+.25,dy:-.55,far:4000});}}
/* the stones of S, O, S: points along each letter's strokes, a stone a metre */
function lrSosPts(){const out=[],seg=(a,b)=>{const n=Math.max(1,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/2.2));for(let i=0;i<n;i++)out.push([a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n]);};
  const S=x=>{const P=[[x+18,30],[x,30],[x,15],[x+18,15],[x+18,0],[x,0]];for(let i=0;i<P.length-1;i++)seg(P[i],P[i+1]);out.push(P[P.length-1]);};
  S(-35);for(let i=0;i<36;i++){const a=i/36*Math.PI*2;out.push([Math.sin(a)*9,15+Math.cos(a)*15]);}S(17);return out;}
/* the shirt on Bore Three's windmill: a cloth hanging from the tail vane (made here: a red cloth, both sides) */
function lrJMeshes(){if(LRJ.mesh||typeof makeMesh==='undefined')return;LRJ.mesh=true;
  const x=-2.06,y0=6.35,y1=7.45,z0=.85,z1=1.8,pos=[],nrm=[],uv=[],idx=[];
  for(const [sx,nx] of [[.03,1],[-.03,-1]]){const b=pos.length/3,X=x+sx;pos.push(X,y1,z0,X,y1,z1,X,y0+.12,z1,X,y0,z0+.1);for(let i=0;i<4;i++)nrm.push(nx,0,0);uv.push(0,0,1,0,1,1,0,1);idx.push(...(nx>0?[b,b+1,b+2,b,b+2,b+3]:[b,b+2,b+1,b,b+3,b+2]));}
  const nv=pos.length/3,col=new Float32Array(nv*4).fill(1);for(let k=0;k<nv;k++)col[k*4+3]=0;
  const m=makeMesh({pos:new Float32Array(pos),nrm:new Float32Array(nrm),col,mat:new Float32Array(nv).fill(120),idx:new Uint16Array(idx),uv:new Float32Array(uv)});m.tris=idx.length/3;
  LR_PROPS.R0={shirt:{min:[x-.05,y0,z0],max:[x+.05,y1,z1]}};
  const tx=gl.createTexture(),N=8,px=new Uint8Array(N*N*4);for(let j=0;j<N;j++)for(let i=0;i<N;i++){const f=.8+.2*Math.sin(i*1.7+j*.4),o=(j*N+i)*4;px[o]=200*f;px[o+1]=38*f;px[o+2]=34*f;px[o+3]=255;}
  gl.activeTexture(gl.TEXTURE15);gl.bindTexture(gl.TEXTURE_2D,tx);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,N,N,0,gl.RGBA,gl.UNSIGNED_BYTE,px);gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.activeTexture(gl.TEXTURE0);
  LRP.mesh.set('R0/shirt',m);LRP.tex.set('R0/shirt',tx);}
/* the points of light: where, what colour, how far they show, and when they blink */
function lrJSigs(A){const R=lrRescuePlaces(),q=A.q,a=A.a,n=(TOD[APP.tod]||{}).night||0,out=[],y=(x,z,h)=>WG.sample(x,z,{}).h+h;
  if(q.id==='walker'&&!a.late&&!a.stopped){const [x,z]=R.walker,t=APP.t%2.6;out.push({P:[x,y(x,z,1.5),z],c:[255,255,235],far:3500,on:t<.2||t>.4&&t<.6,big:1});}
  if(q.id==='goingunder'&&!a.stopped){const W=R.bar,[x,z]=R.truck,yw=Math.atan2(W.dx,W.dz)+.25,c=Math.cos(yw),sn=Math.sin(yw),on=APP.t%1.1<.55,h=y(x,z,.5);
    for(const [lx,lz] of [[-1,3.6],[1,3.6],[-1,-3.6],[1,-3.6]])out.push({P:[x+lx*c+lz*sn,h,z-lx*sn+lz*c],c:[255,165,40],far:4000,on});}
  if(q.id==='coldbox'&&n>.2){const p=WG.GTP.find(p=>p.id==='D16');if(p){const fx=Math.sin(p.yaw),fz=Math.cos(p.yaw);
    out.push({P:[p.x+fx*2.8+fz*1.4,y(p.x,p.z,1.5),p.z+fz*2.8-fx*1.4],c:[255,196,110],far:9000,on:Math.sin(APP.t*9)>-.9,warm:1});}}
  return out;}
/* drawn on the HUD where they are, if the ground isn't in the way (checked a few times a second) */
function lrSigHud(){if(LRFD.snap)return;const A=typeof jActive!=='undefined'?jActive():null;if(!A||!A.q.clock)return;const L=lrJSigs(A);if(!L.length)return;
  const t=GAME.car,e=LRW.on&&LRW.cam?LRW.cam.eye:[t.p[0],t.p[1]+2,t.p[2]],now=APP.t;
  for(const g of L){if(!g.on&&!LRJ.force)continue;const d=Math.hypot(g.P[0]-e[0],g.P[1]-e[1],g.P[2]-e[2]);if(d>g.far)continue;
    const k=g.P.join(','),c0=LRJ.los.get(k);let vis;if(c0&&now-c0.t<.3)vis=c0.v;else{vis=true;
      for(let i=1;i<20;i++){const f=i/20,x=e[0]+(g.P[0]-e[0])*f,yy=e[1]+(g.P[1]-e[1])*f,z=e[2]+(g.P[2]-e[2])*f;if(RANCH.W.heightAt(x,z)>yy+.4){vis=false;break;}}LRJ.los.set(k,{t:now,v:vis});}
    LRJ.dbg={vis,d:Math.round(d)};if(!vis)continue;const q=lrFdProj(g.P);if(!q)continue;const x=q[0]*W,y=(1-q[1])*H;LRJ.dbg.xy=[Math.round(x),Math.round(y),W,H];if(x<-5||y<-5||x>W+5||y>H+5)continue;
    const r=g.big?Math.min(3.2,2+300/Math.max(30,d)):Math.min(2,1+150/Math.max(30,d)),col=pack(...g.c,255),soft=pack(...g.c,g.big?170:110);
    hDisc(x,y,r*(g.big?2:1.6),soft);hDisc(x,y,r,col);if(g.big||g.warm){const k=g.big?5:3;hLine(x-r*k,y,x+r*k,y,soft);hLine(x,y-r*k,x,y+r*k,soft);if(g.big){hLine(x-r*2.5,y-r*2.5,x+r*2.5,y+r*2.5,soft);hLine(x-r*2.5,y+r*2.5,x+r*2.5,y-r*2.5,soft);}}}}
/* under the job's lines: who and what is with you */
function lrJHudMore(lx,y){const A=jActive();if(!A||!A.a.load||!A.a.load.length)return;
  otxt3(('With you: '+A.a.load.map(l=>l.n+' '+l.kg+' kg').join(', ')).toUpperCase(),lx,y,PAL.gold);}
window.__lr=Object.assign(window.__lr||{},{LRJ,lrJSigs,lrRescuePlaces,lrJKg,lrJTick,lrJProps,lrSigHud});

/* (for the tests: the job system's own pieces, asked for when they exist) */
window.__lrJ=()=>({PEOPLE,JOB,jActive,jobListen,closeJobDialog,jRec,jAccept,JOBS});

/* ---------- YOUR HANDS on foot: his gloved hands (E01, each hand its own shape), held out in front as a person's are
   (his picture, Nov 8 2026): a torso's width apart, each turned 45 degrees on its forearm (the thumbs' edges up, the
   palms facing in and down, as if about to take a ball), the forearms coming in from the picture's bottom corners, the fingers forward and in, swaying a little
   as you walk ---------- */
const LRHD={M:new Float32Array(16)};
function lrHandsDraw(){
  if(!LRW.on||!LRW.cam||LRFD.snap||!window.LR_PROPS||!LR_PROPS.E01||!LR_PROPS.E01.left)return 0;let tris=0;
  const {eye,fwd}=LRW.cam,r=norm2([-fwd[2],0,fwd[0]]),u0=[r[1]*fwd[2]-r[2]*fwd[1],r[2]*fwd[0]-r[0]*fwd[2],r[0]*fwd[1]-r[1]*fwd[0]];
  /* (the forearms rise from below to the hands: the sleeves go off the picture's bottom) */
  const a=-.3,f0=norm2([fwd[0]*Math.cos(a)-u0[0]*Math.sin(a),fwd[1]*Math.cos(a)-u0[1]*Math.sin(a),fwd[2]*Math.cos(a)-u0[2]*Math.sin(a)]);
  const up0=[r[1]*f0[2]-r[2]*f0[1],r[2]*f0[0]-r[0]*f0[2],r[0]*f0[1]-r[1]*f0[0]],x0=[up0[1]*f0[2]-up0[2]*f0[1],up0[2]*f0[0]-up0[0]*f0[2],up0[0]*f0[1]-up0[1]*f0[0]];
  const sw=Math.sin(LRW.bob)*.012,M=LRHD.M,rot=(A,B,t)=>[A[0]*Math.cos(t)+B[0]*Math.sin(t),A[1]*Math.cos(t)+B[1]*Math.sin(t),A[2]*Math.cos(t)+B[2]*Math.sin(t)];
  /* (his model's own frame: +x is the left, +y up, the fingers +z; so its x<0 half, 'left' in the file, is your right hand) */
  for(const [obj,s] of [['right',-1],['left',1]]){const key='E01/'+obj;
    if(!LRP.mesh.has(key)){if(!LRP.busy.has(key)){LRP.busy.add(key);lrPropMake(key);}continue;}
    const m=LRP.mesh.get(key),tx=LRP.tex.get(key);if(!m||!tx)continue;lrPropTex1();
    /* this hand: turned in (its fingers toward the middle), then turned 45 degrees on its forearm, its thumb's edge up
       (half way from palm down to a handshake: the palms face in and down) */
    const ps=s*.3,f=rot(f0,x0,ps),x1=rot(x0,f0,-ps),ph=s*.785,x=rot(x1,up0,ph),u=rot(up0,x1,-ph);
    const E=LR_PROPS.E01[obj],c=[(E.min[0]+E.max[0])/2,(E.min[1]+E.max[1])/2,(E.min[2]+E.max[2])/2];
    const p=[eye[0]+fwd[0]*.5-u0[0]*.2+r[0]*(s*.3+sw),eye[1]+fwd[1]*.5-u0[1]*.2+Math.abs(sw)*.5,eye[2]+fwd[2]*.5-u0[2]*.2+r[2]*(s*.3+sw)];
    for(let k=0;k<3;k++)p[k]-=x[k]*c[0]+u[k]*c[1]+f[k]*c[2];
    M[0]=x[0];M[1]=x[1];M[2]=x[2];M[3]=0;M[4]=u[0];M[5]=u[1];M[6]=u[2];M[7]=0;M[8]=f[0];M[9]=f[1];M[10]=f[2];M[11]=0;M[12]=p[0]-RO[0];M[13]=p[1]-RO[1];M[14]=p[2]-RO[2];M[15]=1;
    const U=CUR.u;gl.uniformMatrix4fv(U.uM,false,M);if(U.uPrevM)gl.uniformMatrix4fv(U.uPrevM,false,M);
    if(LRP.locP!==CUR.p){LRP.locP=CUR.p;LRP.loc=['uRTa','uRTn','uRTo'].map(q=>gl.getUniformLocation(CUR.p,q));}
    const T=[[LRP.loc[0],tx,13],[LRP.loc[1],LRP.one.n,14],[LRP.loc[2],LRP.one.o,15]];
    for(const [loc,t,unit] of T){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);if(loc)gl.uniform1i(loc,unit);}gl.activeTexture(gl.TEXTURE0);
    drawMesh(m);tris+=m.tris;}
  return tris;}

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
const LR_BUILD='ground-truth-continued-1';
var LRM={mode:null};
/* each way in keeps its own jobs (CHAL.free is the job record when there's no Salt & Sand career) */
const lrModeKey=m=>m==='campaign'?'gt-campaign':'rt-fchal';
function lrModeSet(m){LRM.mode=m;store.set('gt-mode',m);let r={};try{r=JSON.parse(store.get(lrModeKey(m),'{}'))||{};}catch(e){}
  for(const k of Object.keys(CHAL.free))delete CHAL.free[k];Object.assign(CHAL.free,{medals:{},best:{},runs:{}},r);MARKS_V++;JOB.tmemo=null;
  const was=APP.level;APP.level=m==='campaign'?'sim':(store.get('gt-free-level','sim')==='real'?'real':'sim');if(was!==APP.level)saveGame();
  document.body.classList.toggle('gtCampaign',m==='campaign');lrOutfitApply();spawnRig(false);}
/* the campaign's money: what its jobs have paid (and, later, what the Outfitter's gear costs) */
function lrMoney(add){let m=+store.get('gt-money','0')||0;if(add){m+=add;store.set('gt-money',String(m));}return m;}
const lrHasRun=m=>{try{const r=JSON.parse(store.get(lrModeKey(m),'{}'))||{};return !!(r.active||Object.keys(r.quests||{}).length);}catch(e){return false;}};
function lrStart(m){lrModeSet(m);const d=$('lrTitle');if(d)d.remove();if(LRO.heron)lrBaySet(false);const b=$('sasDrive');if(b)b.click();
  /* (a new campaign: Dell calls you over the radio with the first job) */
  if(m==='campaign')setTimeout(()=>{if(GAME.state==='drive'&&!jDone('firstlight')&&!jRec().active)jobListen('dell');},1400);}
function lrTitle(){
  const st=document.createElement('style');st.textContent=`
#tNos,#tOD,#tRear,#touch [data-k=horn],#shBack,#rtFly,#mTabs [data-t=races],#mTabs [data-t=garage],#mTabs [data-t=cool],
#menu section:has(#mCars),#menu section:has(#mModes),#menu section:has(#mPresets),#menu section:has(#mTraffic),#menu section:has(#mSim),
#menu section:has(#chCount),#menu section:has(#clList),#menu section:has(#chList),#mLevel [data-v=middle],#mLevel [data-v=kids],
body.gtCampaign #menu section:has(#mLevel),#mSim .simrows>div:has(#mSimWx),#mSim .simrows>div:has(#mSimCargo),body:not(.gtAir) #mSim,body.gtHeron #shEng,body.gtHeron #shPad,body.gtHeron #shTab{display:none!important}
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
  {const tab=document.querySelector('[data-tab=chals]');if(tab&&!$('lrBookSec')){const sec=document.createElement('section');sec.id='lrBookSec';
    sec.innerHTML='<h2>Field book</h2><p class="hint" style="margin:0 0 8px">What you\'ve found on foot at the old places: the Old Hands\' glyphs, what they say, and where the water went. B on a keyboard.</p><button class="btn" id="lrBookOpen" type="button">Open the field book</button>';
    tab.insertBefore(sec,tab.firstChild);sec.querySelector('button').addEventListener('click',()=>lrBookOpen(true));}}
  {const L=$('jbList');const sec=L&&L.closest('section');if(sec){const h2=sec.querySelector('h2');if(h2)h2.textContent='The people';
    const ps=sec.querySelectorAll('p.hint');if(ps[1])ps[1].textContent='A column of light in someone\'s colour means they have work for you: stop beside them and listen. One job at a time.';}}
  document.title='Ground Truth';lrBayUI();lrShopBtn();lrOutfitApply();
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
const LRWD={o:{},deep:false,t:0,safe:null,st:0,bog:0,ui:null};
function lrWade(dt,t){if(!t||t.rt||LRW.on){lrTowUI(false);return;}const o=LRWD.o;WG.sample(t.p[0],t.p[2],o);const d=o.code===WG.SF.water?o.wl-o.h:0,lava=o.gm===38&&o.rock>.93,
    ford=lrFit('snorkel')?1.4:.8,deep=d>ford||lava;
  if(deep){LRWD.bog+=dt;const k=Math.exp(-dt*2.6);t.v[0]*=k;t.v[2]*=k;if(!LRWD.deep&&performance.now()-LRWD.t>6000){LRWD.t=performance.now();
      say(lava?'A LAVA FIELD: NO TRUCK CROSSES THIS':d<1.4&&!lrFit('snorkel')?'TOO DEEP WITHOUT A SNORKEL':'TOO DEEP FOR THE TRUCK',2.6,PAL.amber);say('BACK OUT, OR FLY IT',2.6,PAL.amber);}}
  else{LRWD.bog=0;if((LRWD.st-=dt)<=0&&t.speed>.4){LRWD.st=.7;const F=mcol(t.M,0);LRWD.safe={x:t.p[0]-F[0]*4,z:t.p[2]-F[2]*4,yaw:Math.atan2(-F[2],F[0])};}}
  LRWD.deep=deep;lrTowUI(LRWD.bog>2&&!!LRWD.safe);}
/* bogged for a couple of seconds: the winch hauls you back to firm ground; without one, a tow does ($200 in the
   campaign, and Dell lets it go if you can't pay) */
function lrTowUI(on){let b=LRWD.ui;if(!on){if(b)b.hidden=true;return;}
  if(!b){b=document.createElement('button');b.type='button';b.id='lrTow';b.style.cssText='position:fixed;left:50%;top:38%;transform:translateX(-50%);z-index:30;border:0;border-radius:999px;padding:12px 22px;font:700 14px var(--f,system-ui);letter-spacing:.1em;text-transform:uppercase;background:#e2b85c;color:#1d160c;box-shadow:0 6px 24px rgba(0,0,0,.4);cursor:pointer';
    b.addEventListener('click',lrTow);document.body.appendChild(b);LRWD.ui=b;}
  const w=lrFit('winch');b.textContent=w?'Winch out':LRM.mode==='campaign'?'Call a tow · $200':'Tow out';b.hidden=false;}
function lrTow(){const s=LRWD.safe,t=GAME.car;if(!s||!t)return;const w=lrFit('winch');
  if(!w&&LRM.mode==='campaign'){if(lrMoney()>=200){lrMoney(-200);say('DELL SENT THE STATION TRUCK · $200',3,PAL.amber);}else say('DELL: THIS ONE\'S ON ME. GET A WINCH',3,PAL.amber);}
  else say(w?'WINCHED OUT':'TOWED OUT',2,PAL.green);placeCar(s.x,s.z,s.yaw);t.v[0]=t.v[1]=t.v[2]=0;LRWD.bog=0;lrTowUI(false);}
window.__lr=Object.assign(window.__lr||{},{LRWD,lrWade,lrTow});

/* ---------- THE HERON ON WATER (his ask: it "can land in shallow water as well: a river sandbar right at the surface,
   or a flat beach"; src/gt-world.js GT_WATERS: Crane Bar and River Mouth Bar in the Delta, South Beach on the Lake).
   Water now pulls at the Heron's wheels: each wheel in the water is dragged back as water drags (half its density,
   times the wheel's width times how deep it's in, times the speed squared), at the wheel's bottom, so a film of
   water on a bar slows you with a spray, and a wheel that runs into water a foot deep at landing speed digs in and
   puts the Heron on its nose, as it would. Down in water too deep (the cabin in it): ditched; the engine drowns, and
   a button gets it recovered to the nearest strip ($400 in the campaign; Dell's crew). The truck isn't waiting at
   the bars or the beach: you can't drive there ---------- */
const LRHW={o:{},q:{},ditch:false,t:0,ui:null,told:0};
function lrHWater(t,dt){
  if(typeof WG==='undefined'||!WG.GTW||LRW.on)return;const p=t.p,o=LRHW.o;
  /* (high up, no water to touch) */
  if(p[1]-RANCH.W.heightAt(p[0],p[2])>6){LRHW.ditch=false;return;}
  const M=t.M,U=[M[1],M[4],M[7]],v=t.v,w=t.w,m=t.m;let wet=0;
  for(const wh of t.wheels){const hp=wh.hpW,L=(wh.len||.3)+wh.R,bx=hp[0]-U[0]*L,by=hp[1]-U[1]*L,bz=hp[2]-U[2]*L;
    WG.sample(bx,bz,o);if(o.code!==WG.SF.water)continue;const d=Math.min(2*wh.R,o.wl-by);if(d<=0)continue;wet++;
    const rx=bx-p[0],ry=by-p[1],rz=bz-p[2],vx=v[0]+w[1]*rz-w[2]*ry,vy=v[1]+w[2]*rx-w[0]*rz,vz=v[2]+w[0]*ry-w[1]*rx,sp=Math.hypot(vx,vz);if(sp<.2)continue;
    /* (the drag, never more in a step than half the point's speed) */
    const A=Math.max(.12,(wh.front?t.c.tyreW:t.c.tyreWR)||.18)*d,F=Math.min(.5*1000*1.1*A*sp*sp,.5*sp*m/dt/Math.max(1,t.wheels.length)),fx=-vx/sp*F,fz=-vz/sp*F;
    v[0]+=fx/m*dt;v[2]+=fz/m*dt;const tq=[ry*fz,rz*fx-rx*fz,-ry*fx],dw=t.invI(F3(),M,tq);w[0]+=dw[0]*dt;w[1]+=dw[1]*dt;w[2]+=dw[2]*dt;}
  /* down in it: the cabin in the water */
  /* (or over on its back or its nose in the shallows, stopped: no flipping it back by hand in the water) */
  WG.sample(p[0],p[2],o);const sunk=o.code===WG.SF.water&&(o.wl-o.h>.9&&p[1]<o.wl+.35||U[1]<.35&&Math.hypot(v[0],v[2])<3);
  if(sunk){const k=Math.exp(-dt*2.5);v[0]*=k;v[2]*=k;w[0]*=k;w[1]*=k;w[2]*=k;if(!LRHW.ditch){LRHW.ditch=true;LRHW.t=performance.now();LRHW.deep=o.wl-o.h>.9;}}
  else LRHW.ditch=false;}
/* once a frame: the word, and the recovery button */
function lrHTick(t){if(!t||!t.rt||LRW.on){lrHRecUI(false);return;}
  if(LRHW.ditch){GAME.flipSaid=true;if(t.pt.st==='run')t.pt.st='stopping';if(LRHW.told!==LRHW.t){LRHW.told=LRHW.t;/* (the newest line shows on top) */say('LAND ON THE SAND ITSELF: IT\'S FIRM',4,PAL.amber);say(LRHW.deep?'THE HERON\'S IN THE WATER: TOO DEEP TO LAND':'NOSED OVER IN THE SHALLOWS',4,PAL.amber);}
    lrHRecUI(performance.now()-LRHW.t>1500);}else lrHRecUI(false);}
function lrHRecUI(on){let b=LRHW.ui;if(!on){if(b)b.hidden=true;return;}
  if(!b){b=document.createElement('button');b.type='button';b.id='lrHRec';b.style.cssText='position:fixed;left:50%;top:60%;transform:translateX(-50%);z-index:30;border:0;border-radius:999px;padding:12px 22px;font:700 14px var(--f,system-ui);letter-spacing:.1em;text-transform:uppercase;background:#e2b85c;color:#1d160c;box-shadow:0 6px 24px rgba(0,0,0,.4);cursor:pointer';
    b.addEventListener('click',lrHRecover);document.body.appendChild(b);LRHW.ui=b;}
  b.textContent=LRM.mode==='campaign'?'Recover the Heron · $400':'Recover the Heron';b.hidden=false;}
function lrHRecover(){const t=GAME.car;if(!t||!t.rt)return;const i=lrNearStrip(t.p[0],t.p[2],1e9),S=WG.GTS[i<0?0:i],u=-(S.len/2-40);
  if(LRM.mode==='campaign'){if(lrMoney()>=400){lrMoney(-400);say('DELL\'S CREW FLOATED HER OUT · $400',3,PAL.amber);}else say('DELL: PAY ME WHEN YOU CAN',3,PAL.amber);}
  else say('RECOVERED',2,PAL.green);
  placeCar(S.x+S.dx*u,S.z+S.dz*u,Math.atan2(-S.dz,S.dx));t.v[0]=t.v[1]=t.v[2]=0;t.w[0]=t.w[1]=t.w[2]=0;LRHW.ditch=false;lrHRecUI(false);say(S.name.toUpperCase()+(S.name.endsWith('Strip')?'':' STRIP'),2.4,PAL.green);}
/* which water landing (x,z) is on: its sand, with m metres to spare (-1: none) */
function lrWaterAt(x,z,m){const G=WG.GTW||[];for(let i=0;i<G.length;i++){const S=G[i],u=(x-S.x)*S.dx+(z-S.z)*S.dz,v=-(x-S.x)*S.dz+(z-S.z)*S.dx;
  if(Math.abs(u)<S.len/2+m&&(S.kind==='beach'?v>-S.hw-m&&v<6+m:Math.abs(v)<S.hw+m))return i;}return -1;}
addEventListener('keydown',e=>{if((e.key==='t'||e.key==='T')&&LRHW.ui&&!LRHW.ui.hidden)lrHRecover();});
window.__lr=Object.assign(window.__lr||{},{LRHW,lrHWater,lrHRecover,lrWaterAt});
addEventListener('keydown',e=>{if((e.key==='t'||e.key==='T')&&LRWD.ui&&!LRWD.ui.hidden)lrTow();});

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
  if(k<=1){lrDash(cx,cy,cx+dx,cy+dy,PAL.gold);hRing(cx+dx,cy+dy,tg.search?Math.max(2.4,tg.search/span*size):2.4,PAL.gold);}
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
  /* the water landings (the bars and the beach), in the sand's colour */
  for(const S of WG.GTW||[]){const [a,b]=toM(S.x,S.z),c=pack(240,214,150),L=S.lab||'l';hLine(a-S.dx*2.2,b-S.dz*2.2,a+S.dx*2.2,b+S.dz*2.2,c);
    otxt3(S.name.toUpperCase(),L==='r'?a-4:a+4,L==='b'?b+7:b+(L==='r'?3:-3),c,1,L==='b'?'c':L);}
  /* the way the water went, from the hands you've read; the places you've found things */
  lrFdMap(toM);
  /* who has work for you */
  for(const k of Object.keys(PEOPLE)){const p=PEOPLE[k];if(!jOffer(k))continue;const [a,b]=toM(p.x,p.z);hDisc(a,b,1.6,hx(p.col));}
  /* the job: its stop, the line to it, and what it is */
  const [cx,cy]=toM(t.p[0],t.p[2]),A=jActive(),tg=A&&jTarget();
  if(tg){const [a,b]=toM(tg.x,tg.z);lrDash(cx,cy,a,b,PAL.gold,2.5,1.5);hRing(a,b,tg.search?Math.max(3,tg.search/(2*HH)*size):3,PAL.gold);
    otxt3((A.q.title+': '+A.s.text).toUpperCase().slice(0,Math.floor(size/4.2)),x0+3,y0+3,PAL.gold);
    otxt3(((tg.name||'')+'  '+lrKm(Math.hypot(tg.x-t.p[0],tg.z-t.p[2]))).toUpperCase(),x0+3,y0+10,PAL.ink);}
  else otxt3(Object.keys(PEOPLE).some(jOffer)?'NO JOB ON: A DOT IS SOMEONE WITH WORK FOR YOU':'NO JOB ON',x0+3,y0+3,PAL.ink);
  mapArrow(cx,cy,1.3);hFrame(x0-2,y0-2,size+4,size+4,pack(255,255,255,70));
  otxt3(GAME.touch?'TAP TO CLOSE':'M TO CLOSE',x0+3,y0+size-8,PAL.dim);otxt3('40 MILES ACROSS, NORTH UP',x0+size-3,y0+size-8,PAL.dim,1,'r');}
window.__lr=Object.assign(window.__lr||{},{LRMAP,lrBigMap});

/* ---------- THE DUST (the job Dust): once you're down at Three Wells, a dust wall from the west: the air thickens and
   browns, the light drops, and Flight Service grounds the Heron until you're through to the city ---------- */
const LRDU={k:0,t:0,said:0};window.__lr=Object.assign(window.__lr||{},{LRDU});
function lrDust(E){const A=typeof jActive!=='undefined'&&GAME.state==='drive'?jActive():null,on=!!(A&&A.q.id==='dust'&&A.a.step>=1),now=performance.now();
  const dt=Math.min(.1,(now-(LRDU.t||now))/1000);LRDU.t=now;LRDU.k+=((on?1:0)-LRDU.k)*Math.min(1,dt*.4);if(LRDU.force!==undefined)LRDU.k=LRDU.force;const k=LRDU.k;
  if(on&&GAME.car&&GAME.car.rt&&now-LRDU.said>9000){LRDU.said=now;say('FLIGHT SERVICE: DUST. ALL AIRCRAFT GROUNDED',3,PAL.amber);}
  if(k<.005)return;const D=[.62,.45,.29],m=(a,b,f)=>a.map((v,i)=>v*(1-f)+b[i]*f);E.fogDen*=1+k*120;E.fogCol=m(E.fogCol,D,k);E.fogAmb=m(E.fogAmb,D.map(v=>v*.5),k);
  E.skyHor=m(E.skyHor,[.56,.42,.29],k);E.skyZen=m(E.skyZen,[.42,.33,.25],k*.9);E.sunCol=E.sunCol.map(v=>v*(1-.75*k));E.ambUp=m(E.ambUp,[.36,.29,.21],k*.7);E.key*=1-k*.5;}

/* ---------- THE SOUNDS OF LIFE (Fable's list; his "birdsong, and rustling as something runs off"): made here, not
   recorded, on the engine's own audio (so its volume and the menu's mute hold). By day, birds in the savanna and the
   delta, now and then, off to one side or the other; a herd that bolts is a rush of grass and hooves from where it
   was; cattle low, cranes and flamingos call over the water, a lioness on a kopje roars far off now and again; at
   night, the insects. All quieter the faster you go (the engine's louder), loudest on foot ---------- */
const LRS={out:null,nb:null,t:0,next:{bird:2,call:8,roar:40},o:{},R:null,rt:0,cic:null};
function lrsOut(){const A=ENG.audio;if(!A||!A.ctx)return null;if(LRS.out&&LRS.out.context===A.ctx)return LRS.out;
  const g=A.ctx.createGain();g.gain.value=.9;g.connect(A.master);LRS.out=g;
  const n=A.ctx.sampleRate*2,b=A.ctx.createBuffer(1,n,A.ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;LRS.nb=b;return g;}
/* where a sound at x, z sits: its pan (left, right) from the way you face, its gain from how far */
function lrsAt(x,z,P,yaw,far){const dx=x-P[0],dz=z-P[2],d=Math.hypot(dx,dz)||1,f=[Math.cos(yaw),-Math.sin(yaw)],r=[Math.sin(yaw),Math.cos(yaw)];
  return {pan:clamp((dx*r[0]+dz*r[1])/d,-1,1)*.85,g:clamp(1-d/far,0,1)**1.5,d};}
function lrsChain(ctx,pan,g){const o=LRS.out,p=ctx.createStereoPanner?ctx.createStereoPanner():null,v=ctx.createGain();v.gain.value=g;if(p){p.pan.value=pan;v.connect(p);p.connect(o);}else v.connect(o);return v;}
function lrsNoise(ctx,t0,dur){const s=ctx.createBufferSource();s.buffer=LRS.nb;s.loop=true;s.start(t0,Math.random()*1.5);s.stop(t0+dur+.05);return s;}
/* a bird: a few chirps, each a quick sweep up or down */
function lrsBird(ctx,t0,pan,g){const v=lrsChain(ctx,pan,g),base=2300+Math.random()*2600,n=2+(Math.random()*6|0),kind=Math.random();let t=t0;
  for(let i=0;i<n;i++){const o=ctx.createOscillator(),e=ctx.createGain(),d=.05+Math.random()*.09,f1=base*(.85+Math.random()*.3),f2=kind<.5?f1*1.35:f1*.7;
    o.type='sine';o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(f2,t+d);e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(.16,t+.008);e.gain.exponentialRampToValueAtTime(.001,t+d);
    o.connect(e);e.connect(v);o.start(t);o.stop(t+d+.02);t+=d+.03+Math.random()*.12;}}
/* a herd bolting: grass brushed aside, and hooves */
function lrsBolt(ctx,t0,pan,g,heavy){const v=lrsChain(ctx,pan,g);
  /* (the grass: many short crackles, thickest at first, through a narrow band) */
  {const bp=ctx.createBiquadFilter(),hp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=2900;bp.Q.value=1.3;hp.type='highpass';hp.frequency.value=900;bp.connect(hp);hp.connect(v);
    for(let i=0;i<46;i++){const u=Math.random(),t=t0+u*u*2.2,d=.02+Math.random()*.06,s=ctx.createBufferSource(),e=ctx.createGain();s.buffer=LRS.nb;
      e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime((.15+Math.random()*.35)*(1-u*.6),t+.004);e.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(e);e.connect(bp);s.start(t,Math.random()*1.8);s.stop(t+d+.02);}}
  for(let i=0;i<14;i++){const t=t0+.1+i*(.13+Math.random()*.06),o=ctx.createOscillator(),e=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(heavy?75:110,t);o.frequency.exponentialRampToValueAtTime(heavy?38:55,t+.09);
    const a=(heavy?.5:.32)*(1-i/16);e.gain.setValueAtTime(a,t);e.gain.exponentialRampToValueAtTime(.001,t+.11);o.connect(e);e.connect(v);o.start(t);o.stop(t+.13);}}
/* a cow's low; a crane's or a flamingo's call; a lioness, far off */
function lrsCall(ctx,t0,pan,g,kind){const v=lrsChain(ctx,pan,g);
  if(kind==='cattle'){const o=ctx.createOscillator(),bp=ctx.createBiquadFilter(),lp=ctx.createBiquadFilter(),e=ctx.createGain(),d=1.1+Math.random()*.6;o.type='sawtooth';o.frequency.setValueAtTime(118,t0);o.frequency.linearRampToValueAtTime(96,t0+d);
    bp.type='bandpass';bp.frequency.value=520;bp.Q.value=1.4;lp.type='lowpass';lp.frequency.value=1100;e.gain.setValueAtTime(0,t0);e.gain.linearRampToValueAtTime(.5,t0+.25);e.gain.linearRampToValueAtTime(.35,t0+d-.2);e.gain.linearRampToValueAtTime(0,t0+d);
    o.connect(bp);bp.connect(lp);lp.connect(e);e.connect(v);o.start(t0);o.stop(t0+d+.05);return;}
  if(kind==='crane'||kind==='flamingo'){const n=kind==='crane'?3:4,f=kind==='crane'?820:560;for(let i=0;i<n;i++){const t=t0+i*(kind==='crane'?.42:.3),o=ctx.createOscillator(),m=ctx.createOscillator(),mg=ctx.createGain(),bp=ctx.createBiquadFilter(),e=ctx.createGain();
      o.type='square';o.frequency.value=f*(1+(i%2)*.18);m.frequency.value=32;mg.gain.value=f*.04;m.connect(mg);mg.connect(o.frequency);bp.type='bandpass';bp.frequency.value=f*2;bp.Q.value=2;
      e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(.22,t+.03);e.gain.exponentialRampToValueAtTime(.001,t+.28);o.connect(bp);bp.connect(e);e.connect(v);o.start(t);m.start(t);o.stop(t+.3);m.stop(t+.3);}return;}
  if(kind==='cat'){const d=2.6,s=lrsNoise(ctx,t0,d),o=ctx.createOscillator(),lp=ctx.createBiquadFilter(),e=ctx.createGain();o.type='sawtooth';o.frequency.setValueAtTime(70,t0);o.frequency.linearRampToValueAtTime(48,t0+d);
    lp.type='lowpass';lp.frequency.value=320;e.gain.setValueAtTime(0,t0);e.gain.linearRampToValueAtTime(.7,t0+.6);e.gain.exponentialRampToValueAtTime(.001,t0+d);s.connect(lp);o.connect(lp);lp.connect(e);e.connect(v);o.start(t0);o.stop(t0+d+.05);}}
/* each frame of play */
function lrLife(dt,t){const o=lrsOut();if(!o||!t)return;const ctx=o.context,now=ctx.currentTime,P=LRW.on?LRW.p:t.p,foot=LRW.on;
  const yaw=foot?LRW.yaw:(()=>{const F=mcol(t.M,0);return Math.atan2(-F[2],F[0]);})(),air=!!t.rt&&!foot&&P[1]-WG.sample(P[0],P[2],LRS.o).h>30;
  if((LRS.rt-=dt)<=0){LRS.rt=1;LRS.R=WG.gtRegions(P[0],P[2],{});}const R=LRS.R||{},night=(TOD[APP.tod]||{}).night||0;
  /* the engine covers the quiet sounds: louder on foot, quieter the faster you go, nothing from the air */
  const hush=air?0:foot?1:clamp(1-(t.speed||0)/22,.15,1);
  /* the insects, at night, wherever there's grass */
  {const want=night>.5&&!air?.05*hush*clamp((R.sav||0)+(R.delta||0),0,1):0;
    if(!LRS.cic&&want>0){const s=lrsNoise(ctx,now,1e5),bp=ctx.createBiquadFilter(),am=ctx.createGain(),lf=ctx.createOscillator(),lg=ctx.createGain(),g=ctx.createGain();
      bp.type='bandpass';bp.frequency.value=4600;bp.Q.value=9;lf.frequency.value=38;lg.gain.value=.5;am.gain.value=.5;lf.connect(lg);lg.connect(am.gain);g.gain.value=0;s.connect(bp);bp.connect(am);am.connect(g);g.connect(o);lf.start();LRS.cic={g,s,lf};}
    if(LRS.cic)LRS.cic.g.gain.setTargetAtTime(want,now,.8);}
  if(air)return;
  /* the birds, by day, in the grass and by the water */
  const lush=clamp((R.sav||0)+(R.delta||0)*1.2+(R.high||0)*.5,0,1);
  if((LRS.next.bird-=dt)<=0){LRS.next.bird=(2+Math.random()*7)/Math.max(.2,lush);
    if(night<.5&&lush>.2&&hush>.2)lrsBird(ctx,now+.05,(Math.random()*2-1)*.8,(.35+Math.random()*.4)*hush*(.6+.4*lush));}
  /* the herds: a bolt when one breaks into a run; a call now and then from one near */
  for(const H of LRA.herds.values()){if(!H||H.gone)continue;const S=lrsAt(H.x,H.z,P,yaw,H.kind==='cat'?2200:900);
    if(H.run>.25&&!H.heard&&S.g>0){H.heard=true;if(H.K.run)lrsBolt(ctx,now+.05,S.pan,S.g*hush*1.1,H.kind==='cattle'||H.kind==='camel');}
    if(H.run<.05)H.heard=false;}
  if((LRS.next.call-=dt)<=0){LRS.next.call=6+Math.random()*14;let best=null,bg=0;
    for(const H of LRA.herds.values()){if(!H||H.gone||H.run>.2)continue;if(!['cattle','crane','flamingo'].includes(H.kind))continue;const S=lrsAt(H.x,H.z,P,yaw,900);if(S.g>bg){bg=S.g;best=[H,S];}}
    if(best&&hush>.2)lrsCall(ctx,now+.05,best[1].pan,best[1].g*hush,best[0].kind);}
  if((LRS.next.roar-=dt)<=0){LRS.next.roar=35+Math.random()*50;for(const H of LRA.herds.values()){if(!H||H.kind!=='cat'||H.gone)continue;const S=lrsAt(H.x,H.z,P,yaw,2200);
    if(S.g>.02&&hush>.15){lrsCall(ctx,now+.05,S.pan,S.g*hush*.9,'cat');break;}}}}
window.__lr=Object.assign(window.__lr||{},{LRS,lrLife,lrsBird,lrsBolt,lrsCall});

/* ---------- THE OUTFITTER'S GEAR AND UPGRADES (Fable's Outfitter; his call, Nov 7 2026: paid for with the campaign's
   money). Teo's wall, by what it goes on: the truck's add-ons (fitted on the truck, his E17 models where there are
   any), the Heron's (tundra tyres and the climb propeller, each with a cost as well as a gain, so they can be taken
   off again), and the gear you carry. Each does something you feel, and some jobs need one (the job's card says what
   to bring; the step waits till you have it). In free play all of it is yours, free ---------- */
function lrShopList(){return [
  {id:'snorkel',kind:'truck',name:'Snorkel',price:1200,pic:'E17/snorkel',says:'Fords water 1.4 m deep (0.8 m without one)'},
  {id:'winch',kind:'truck',name:'Winch',price:2000,pic:'E17/winch',says:'Pulls the truck out when it bogs down: no tow to pay for'},
  {id:'lightbar',kind:'truck',name:'Light bar',price:700,pic:'E17/light_bar',says:'Lights the track nearly twice as far at night'},
  {id:'compressor',kind:'truck',name:'Tyre compressor',price:250,pic:'E10/compressor_case',says:'Air the tyres down for sand or up for the road, anywhere (the menu\'s Tyres row)'},
  {id:'ladders',kind:'truck',name:'Sand ladders',price:180,pic:'E11/sand_ladder',says:'For soft sand. Teo won\'t send you into the dunes without them'},
  {id:'eng1',kind:'heron',name:'Engine overhaul: 300 hp',price:2500,pic:'E18/propeller_cruise',says:'Teo rebuilds the engine with high-compression pistons: 260 hp becomes 300'},
  {id:'eng2',kind:'heron',name:'Big-bore engine: 340 hp',price:6000,pic:'E18/propeller_cruise',says:'A bigger engine on the same mounts: 340 hp. Needs the overhaul first',after:'eng1'},
  {id:'tundra',kind:'heron',name:'Tundra tyres',price:3000,pic:'E18/tundra_wheel',says:'Fat tyres for soft, rough strips (Venn\'s needs them). About 5 mph slower',toggle:true},
  {id:'climbprop',kind:'heron',name:'Climb propeller',price:1800,pic:'E18/propeller_climb',says:'Off the ground sooner and climbs harder, but cruises slower',toggle:true},
  {id:'prybar',kind:'gear',name:'Pry bar',price:60,pic:'E06/wrecking_bar',says:'Lifts stone covers: the Cistern'},
  {id:'machete',kind:'gear',name:'Machete',price:40,pic:'E06/machete',says:'Cuts through vines: Three Wells'},
  {id:'camera',kind:'gear',name:'Camera',price:150,pic:'E05/camera',says:'Photographs counts and finds from the air'},
  {id:'lantern',kind:'gear',name:'Lantern',price:80,pic:'E04/lantern',says:'Light in dark halls: the Sunken City'},
  {id:'rope',kind:'gear',name:'Rope and harness',price:250,pic:'E13/rope_coil',says:'For climbs: the city\'s tower'},
  {id:'firstaid',kind:'gear',name:'First-aid kit',price:120,pic:'E08/first_aid_kit',says:'For anyone hurt: most rescues need it'},
  {id:'water',kind:'gear',name:'Water can, 20 litres',price:35,pic:'D18/jerry_cans',says:'Teo\'s rule for the Pan and the dunes: water for someone who\'s run out'}];}
const LRG={list:lrShopList(),own:{},off:{},base:null,tab:'truck',ui:null,sayT:0,freeHp:+store.get('gt-free-hp','260')||260,HPS:[260,300,340,400,480]};
const lrShopItem=id=>LRG.list.find(q=>q.id===id);
try{LRG.own=JSON.parse(store.get('gt-own','{}'))||{};LRG.off=JSON.parse(store.get('gt-off','{}'))||{};}catch(e){}
/* bought (in free play, all of it); fitted (bought, and not taken off) */
function lrHas(id){if(Array.isArray(id))return id.every(lrHas);return LRM.mode==='free'||!!LRG.own[id];}
function lrFit(id){return lrHas(id)&&!LRG.off[id];}
function lrShopSave(){store.set('gt-own',JSON.stringify(LRG.own));store.set('gt-off',JSON.stringify(LRG.off));lrOutfitApply();}
/* the Heron's: the climb prop pushes 20% harder standing still and is 7% less efficient at speed; the tundra
   tyres add drag (about 5 mph off the cruise) */
function lrOutfitApply(){if(typeof RTF==='undefined')return;if(!LRG.base)LRG.base={T0:RTF.T0,eta:RTF.eta,CD0:RTF.CD0};const B=LRG.base;
  const hp=LRM.mode==='free'?LRG.freeHp:lrFit('eng2')?340:lrFit('eng1')?300:260,pk=hp/260;if(!B.P)B.P=RTF.P;RTF.P=B.P*pk;LRG.hp=hp;
  RTF.T0=B.T0*Math.pow(pk,.67)*(lrFit('climbprop')?1.2:1);RTF.eta=B.eta*(lrFit('climbprop')?.93:1);RTF.CD0=B.CD0+(lrFit('tundra')?.0045:0);
  document.body.classList.toggle('gtAir',lrFit('compressor'));}
function lrBuy(id){const q=lrShopItem(id);if(!q||lrHas(id))return false;if(q.after&&!lrHas(q.after)){say('THE '+lrShopItem(q.after).name.split(':')[0].toUpperCase()+' FIRST',2.4,PAL.amber);return false;}if(lrMoney()<q.price){say('NOT ENOUGH MONEY: '+Feats.fmtMoney(q.price),2.4,PAL.amber);return false;}
  lrMoney(-q.price);LRG.own[id]=1;delete LRG.off[id];lrShopSave();say(q.name.toUpperCase()+(q.kind==='gear'?' PACKED':' FITTED'),2.2,PAL.green);buzz(20);return true;}
function lrToggle(id){if(!lrHas(id))return;if(LRG.off[id])delete LRG.off[id];else LRG.off[id]=1;lrShopSave();}
/* a job's step that needs something you haven't got */
function lrNeedName(id){const q=lrShopList().find(q=>q.id===id);return q?q.name.toLowerCase():id;}
function lrNeedSay(id){if(Array.isArray(id))id=id.find(q=>!lrHas(q))||id[0];const now=performance.now();if(now-LRG.sayT<5000)return;LRG.sayT=now;const q=lrShopList().find(q=>q.id===id);
  say((q&&q.kind!=='gear'&&id!=='ladders'?'THIS NEEDS ':'YOU NEED ')+(q?q.name:id).toUpperCase(),3,PAL.amber);say('TEO HAS IT IN THE OUTFITTER',3,PAL.amber);}
/* the light bar: the headlights reach about 1.8 times as far */
function lrHL(){const t=GAME.car;return t&&!t.rt&&lrFit('lightbar')?1.8:1;}
/* the shop: a sheet beside the turntable (Truck, Heron, Gear), each thing with its picture, what it does, its price */
function lrShopUI(){if(LRG.ui)return LRG.ui;const st=document.createElement('style');st.textContent=`
#lrShopBtn{margin-left:6px}
#lrShop{position:fixed;top:0;right:0;bottom:0;width:min(400px,46vw);z-index:60;background:rgba(14,13,18,.94);border-left:1px solid var(--edge-2);display:flex;flex-direction:column;font:13px/1.35 var(--f,system-ui);color:var(--ink,#eee)}
#lrShop[hidden]{display:none}
#lrShop header{display:flex;align-items:center;gap:8px;padding:10px 12px 6px}
#lrShop header b{font-size:15px;letter-spacing:.08em;text-transform:uppercase;flex:1}
#lrShop header .m{color:#8dff5a;font-weight:700;font-size:15px}
#lrShop header button{background:none;border:0;color:inherit;font-size:22px;cursor:pointer;padding:0 4px}
#lrShop .seg{margin:0 12px 6px}
#lrShop .note{margin:0 12px 6px;color:var(--ink-2,#aaa);font-size:12px}
#lrShop ul{list-style:none;margin:0;padding:0 8px 12px;overflow:auto;flex:1}
#lrShop li{display:flex;gap:10px;align-items:center;padding:7px 6px;border-bottom:1px solid rgba(255,255,255,.07)}
#lrShop li img{width:54px;height:54px;object-fit:contain;border-radius:8px;background:#dfe0e3;flex:none}
#lrShop li div{flex:1;min-width:0}#lrShop li div b{display:block;font-size:14px}#lrShop li div small{color:var(--ink-2,#aaa)}
#lrShop li button{flex:none;border:0;border-radius:999px;padding:8px 12px;font:700 12px var(--f,system-ui);letter-spacing:.06em;text-transform:uppercase;cursor:pointer}
#lrShop li button.buy{background:#e2b85c;color:#1d160c}#lrShop li button.buy[disabled]{background:#3a3640;color:#8d8a94;cursor:default}
#lrShop li button.got{background:rgba(141,255,90,.14);color:#8dff5a}#lrShop li button.offb{background:rgba(255,255,255,.1);color:#ddd}`;
  document.head.appendChild(st);const d=document.createElement('div');d.id='lrShop';d.hidden=true;
  d.innerHTML='<header><b>Teo\'s wall</b><span class="m"></span><button type="button" aria-label="Close">×</button></header><div class="seg" role="group"><button type="button" data-v="truck">Truck</button><button type="button" data-v="heron">Heron</button><button type="button" data-v="gear">Gear</button></div><p class="note"></p><ul></ul>';
  document.body.appendChild(d);d.querySelector('header button').addEventListener('click',()=>lrShopOpen(false));
  d.querySelector('.seg').addEventListener('click',e=>{const b=e.target.closest('button');if(b){LRG.tab=b.dataset.v;lrShopSync();if(b.dataset.v==='heron'!==LRO.heron&&b.dataset.v!=='gear')lrBaySet(b.dataset.v==='heron');}});
  d.querySelector('ul').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.hp){LRG.freeHp=+b.dataset.hp;store.set('gt-free-hp',String(LRG.freeHp));lrOutfitApply();say('THE HERON: '+LRG.freeHp+' HP',1.8,PAL.green);lrShopSync();return;}const id=b.dataset.id;if(b.classList.contains('buy'))lrBuy(id);else if(b.dataset.t)lrToggle(id);lrShopSync();});
  LRG.ui=d;return d;}
function lrShopOpen(on){const d=lrShopUI();d.hidden=!on;if(on){LRG.tab=LRO.heron?'heron':LRG.tab==='heron'?'truck':LRG.tab;lrShopSync();}}
function lrShopSync(){const d=LRG.ui;if(!d||d.hidden)return;const free=LRM.mode==='free',m=lrMoney();
  d.querySelector('.m').textContent=free?'Free play':Feats.fmtMoney(m);
  for(const b of d.querySelectorAll('.seg button'))b.setAttribute('aria-pressed',String(b.dataset.v===LRG.tab));
  d.querySelector('.note').textContent=free?'Free play: all of it is yours. Take the Heron\'s off, or put them back.':LRG.tab==='gear'?'Carried with you, in the truck and the Heron.':LRG.tab==='truck'?'Fitted on the truck.':'Fitted on the Heron. The tyres and the propeller can come off again.';
  const P=window.LR_SHOPPICS||{},eng=free&&LRG.tab==='heron'?`<li><img alt="" src="${P['E18/propeller_cruise']?'data:image/webp;base64,'+P['E18/propeller_cruise']:''}"><div><b>Engine: ${LRG.freeHp} hp</b><small>Free play: pick its power. 260 is the Heron as built; 400 and 480 are free play's own</small><div class="seg lrHp" role="group" style="margin-top:6px">${LRG.HPS.map(h=>`<button type="button" data-hp="${h}" aria-pressed="${h===LRG.freeHp}">${h}</button>`).join('')}</div></div></li>`:'';
  d.querySelector('ul').innerHTML=eng+LRG.list.filter(q=>q.kind===LRG.tab&&!(free&&/^eng/.test(q.id))).map(q=>{const has=lrHas(q.id),fit=lrFit(q.id);
    const btn=!has?`<button type="button" class="buy" data-id="${q.id}"${m<q.price||(q.after&&!lrHas(q.after))?' disabled':''}>${Feats.fmtMoney(q.price)}</button>`:q.toggle?`<button type="button" class="${fit?'got':'offb'}" data-id="${q.id}" data-t="1">${fit?'Fitted':'Off'}</button>`:`<button type="button" class="got" disabled>${q.kind==='gear'?'Packed':'Fitted'}</button>`;
    return `<li><img alt="" src="${P[q.pic]?'data:image/webp;base64,'+P[q.pic]:''}"><div><b>${q.name}</b><small>${q.says}</small></div>${btn}</li>`;}).join('');}
/* the bay's OUTFIT button, beside DRIVE */
function lrShopBtn(){const go=$('sasDrive');if(!go||$('lrShopBtn'))return;const b=document.createElement('button');b.type='button';b.id='lrShopBtn';b.className=go.className.replace(/\bprimary\b/,'');
  b.textContent='Outfit';go.parentNode.insertBefore(b,go.nextSibling);b.addEventListener('click',()=>lrShopOpen(LRG.ui?LRG.ui.hidden:true));
  go.addEventListener('click',()=>lrShopOpen(false));}
window.__lr=Object.assign(window.__lr||{},{LRG,lrBuy,lrToggle,lrHas,lrFit,lrShopOpen,lrMoney,lrOutfitApply});

/* ---------- THE TRUCK'S ADD-ONS ON THE TRUCK (his E17 models): the snorkel up the right front wing to the roof, the
   winch in the front bumper, the light bar across the roof's front edge; drawn on the play truck on the road and on
   the Studio 2 in the Outfitter, once fitted. Where each sits, in the truck's own frame (x forward, y up from the
   ground, z right) ---------- */
const LRPART=[['snorkel','E17/snorkel',1.05,.86,1.14,Math.PI/2],['winch','E17/winch',2.76,.5,0,Math.PI/2],['lightbar','E17/light_bar',.14,2.1,0,Math.PI/2]];
const LRPT={M:new Float32Array(16),L:new Map()};
function lrPartsDraw(Mb,depth){if(!window.LR_PROPS||!LR_PROPS.E17)return 0;let n=0,any=false;const U=CUR.u;
  for(const [id,key,x,y,z,a] of LRPART){if(!lrFit(id))continue;
    if(!LRP.mesh.has(key)){if(!LRP.busy.has(key)){LRP.busy.add(key);lrPropMake(key);}continue;}const m=LRP.mesh.get(key),tx=LRP.tex.get(key);if(!m||(!depth&&!tx))continue;
    let L=LRPT.L.get(id);if(!L){L=M4.mul(M4T(x,y,z),M4RY(a));LRPT.L.set(id,L);}const M=M4.mul(Mb,L);
    gl.uniformMatrix4fv(U.uM,false,M);if(U.uPrevM)gl.uniformMatrix4fv(U.uPrevM,false,M);
    if(!depth){lrPropTex1();if(LRP.locP!==CUR.p){LRP.locP=CUR.p;LRP.loc=['uRTa','uRTn','uRTo'].map(q=>gl.getUniformLocation(CUR.p,q));}
      for(const [loc,t,unit] of [[LRP.loc[0],tx,13],[LRP.loc[1],LRP.one.n,14],[LRP.loc[2],LRP.one.o,15]]){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);if(loc)gl.uniform1i(loc,unit);}
      gl.activeTexture(gl.TEXTURE0);}
    drawMesh(m);n+=m.tris;any=true;}
  /* (the truck's own pictures back on, for its wheels) */
  if(any&&!depth)lrBind();return n;}
