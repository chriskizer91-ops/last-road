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
s2For=function(i){if(GAME.state==='drive'&&LR_PLAY(GAME.car)&&GAME.car.bi===i)return null;return LR_S2F(i);};

/* ---------- the plane in Wilderness Olive (the story plane's paint) ---------- */
RT.paint=RT_PAINTS.findIndex(p=>p.id==='wilderness-olive');
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
  if(t&&t.rt&&CAMS[APP.cam]==='Chase'&&GAME.state==='drive'&&!APP.orbit&&!CAM.rear&&!JUMP.on){const r=LR_CA(t,dt);if(r)return r;return lrPlaneChase(t,dt);}
  LRC.on=false;return LR_CA(t,dt);};
window.__lr={LRT,LR_PLAY,lrBuild,LRC};
