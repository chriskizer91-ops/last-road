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
  const t0=performance.now(),st=LRD.st,FT=LRD.FT,n=FT/st+1,nb=n+2,x0=tx*FT,z0=tz*FT,o={},Hh=new Float64Array(nb*nb),Wt=new Float32Array(n*n*4);
  for(let j=0;j<nb;j++)for(let i=0;i<nb;i++){const x=x0+(i-1)*st,z=z0+(j-1)*st;WG.sample(x,z,o);Hh[j*nb+i]=o.code===WG.SF.water?Math.min(o.h,o.wl):o.h;
    if(i>0&&j>0&&i<=n&&j<=n){const k=(j-1)*n+i-1;Wt[k*4]=o.sand>.02?-o.sand:o.grass;Wt[k*4+1]=o.rock;Wt[k*4+2]=o.salt>.02?-o.salt:o.mud*.5;Wt[k*4+3]=o.code===WG.SF.water?.6:1;}}
  const nv=n*n+4*n*2,P=new Float32Array(nv*3),N=new Float32Array(nv*3),C=new Float32Array(nv*4),M=new Float32Array(nv).fill(40),I=[];let v=0,ymin=1e9,ymax=-1e9;
  const put=(i,j,dy)=>{const b=(j+1)*nb+i+1,k=j*n+i,hx=Hh[b-1]-Hh[b+1],hz=Hh[b-nb]-Hh[b+nb],l=Math.hypot(hx,2*st,hz);
    P[v*3]=i*st;P[v*3+1]=Hh[b]-dy;P[v*3+2]=j*st;N[v*3]=hx/l;N[v*3+1]=2*st/l;N[v*3+2]=hz/l;C[v*4]=Wt[k*4];C[v*4+1]=Wt[k*4+1];C[v*4+2]=Wt[k*4+2];C[v*4+3]=Wt[k*4+3];
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
