/* =====================================================================================
   THE STUDIO 2 CAR, MADE (in the worker, or on the page if a worker can't start). The kit (Salt Mini Plus's
   models/src: the game's builders, the Studio kit, each car's own detail, in the viewer's order) builds the car
   exactly as the Studio 2 viewer does it (KIT.setAlt('2'), the bodies' stations four times closer together), with
   the engine kept a piece of its own (KIT.keepEngine) so the dyno can shake it on its mounts. What comes back is
   every triangle the kit made, stored lean (s2Weld below: each corner point once, the triangles as indices), in pieces:
   - body: the shell and every Studio part fixed to it, the whole underside and the engine bay around the engine
   - bodyG, hoodG: what you see through (the windows, the clear lamp lenses), kept apart so it casts no shadow; each
     vertex's glow is minus how much of it is kept, which the game's shader already reads as see-through
   - hood (with what lifts with it) and liner (the pad under it), on the hinge
   - engine, on its mounts
   - wheel / wheelR (what turns) and brake / brakeR (what only steers), front and back
   and the numbers to place them: the hubs, the hinge, the engine's pivot, the exhaust tips for the flames.
   ===================================================================================== */
function s2Make(K,key,opt){
  K.setHD(true);K.setAlt('2');K.keepEngine(true);if(K.setTyres)K.setTyres(opt&&opt.tyres||3);let T;self.KIT_SEATS=[];
  try{T=K.studioBuild(key,.25);}finally{K.setAlt('');K.keepEngine(false);}
  const MT=K.MAT,SM=K.SM,has=x=>x&&x.p&&x.p.length;
  /* how much of each see-through surface is kept (the Studio viewer's opacities) */
  const SEE={[MT.GLASS]:.72,[MT.GLASSL]:.45,[SM.LENS]:.2,[SM.LENSH]:.22,[SM.LENSR]:.25,[SM.TINT]:.6};
  const out={},tr=[],tris={};
  const pack=(name,list,split)=>{list=list.filter(has);let no=0,ng=0;
    for(const s of list){const M=s.m,nt=M.length/3;for(let t=0;t<nt;t++){if(split&&SEE[M[t*3]]!==undefined)ng++;else no++;}}
    const mk=n=>n?{pos:new Float32Array(n*9),nrm:new Float32Array(n*9),col:new Float32Array(n*12),mat:new Float32Array(n*3),k:0}:null;
    const O=mk(no),G=mk(ng);
    for(const s of list){const P=s.p,N=s.n,C=s.c,M=s.m,nt=M.length/3;
      for(let t=0;t<nt;t++){const id=M[t*3],see=split?SEE[id]:undefined,D=see===undefined?O:G,k=D.k++,o9=k*9,o12=k*12,s9=t*9,s12=t*12;
        for(let j=0;j<9;j++){D.pos[o9+j]=P[s9+j];D.nrm[o9+j]=N[s9+j];}
        for(let j=0;j<12;j++)D.col[o12+j]=C[s12+j];
        if(see!==undefined)D.col[o12+3]=D.col[o12+7]=D.col[o12+11]=-see;
        D.mat[k*3]=D.mat[k*3+1]=D.mat[k*3+2]=id;}}
    for(const [sfx,D,n] of [['',O,no],['G',G,ng]])if(D){delete D.k;out[name+sfx]=D;tris[name+sfx]=n;tr.push(D.pos.buffer,D.nrm.buffer,D.col.buffer,D.mat.buffer);}};
  const body=[T.body];for(const [nm,src] of Object.entries(T.hd||{}))if(nm!=='hood')body.push(src);body.push(T.under);if(T.bay)body.push(T.bay.bay);
  pack('body',body,true);pack('hood',[T.hood,T.hd&&T.hd.hood],true);
  if(T.bay){pack('liner',[T.bay.liner]);pack('engine',[T.bay.engine]);}
  pack('wheel',[T.wheel]);if(T.wheelR&&T.wheelR!==T.wheel)pack('wheelR',[T.wheelR]);
  /* (the wheels on the car's left, where the kit makes them a copy of their own: their lettering the other way round) */
  if(T.wheelL)pack('wheelL',[T.wheelL]);
  if(T.brake)pack('brake',[T.brake]);if(T.brakeR&&T.brakeR!==T.brake)pack('brakeR',[T.brakeR]);
  /* the engine's pivot: the bay's own, or (as Salt Flats does it) the middle of the engine, a third of the way up */
  let pivot=T.bay&&T.bay.pivot,trans=!!(T.bay&&T.bay.trans);
  if(!pivot&&out.engine){const P=out.engine.pos;let a=[1e9,1e9,1e9],b=[-1e9,-1e9,-1e9];
    for(let i=0;i<P.length;i+=3)for(let k=0;k<3;k++){if(P[i+k]<a[k])a[k]=P[i+k];if(P[i+k]>b[k])b[k]=P[i+k];}
    pivot=[(a[0]+b[0])/2,a[1]+(b[1]-a[1])*.35,0];}
  const D=T.D,lk=T.b.look,fx=D.X(D.uFa);
  const info={key,name:T.b.name,pivot:pivot?[+pivot[0],+pivot[1],+pivot[2]]:null,trans,
    tips:(D.tips||[]).map(t=>({p:[...t.p],d:[...t.d],r:t.r})),hinge:[...D.hood.hinge],hoodOpen:D.hoodOpen||1,
    fx,wb:D.uRa-D.uFa,pitch:D.pitch||0,R:lk.tyre.R,Rr:D.Rr||lk.tyre.R,tw:lk.track/2,twR:(lk.trackR||lk.track)/2,tris,ms:Math.round(T.ms)};
  /* the driver's eye, for the Cockpit camera: the seat the kit made furthest forward on the driver's side (KIT_SEATS:
     each seat's hip point and recline, noted as the kit makes it), the eye 0.7 m up the seat's back from it, or less
     under a low roof (kept 0.1 m under whatever is straight above), never under 0.45 m */
  const seats=(self.KIT_SEATS||[]).filter(q=>q[2]<-.1&&q[3]<.8).sort((a,b)=>b[0]-a[0]);self.KIT_SEATS=null;
  if(seats.length){const q=seats[0],tr=Math.tan(q[4]),o=[q[0]+.21-.66*tr,q[1]+.45,q[2]];let up=9;
    for(const nm of ['body','bodyG','hood','hoodG','liner']){const Q=out[nm];if(!Q)continue;const p=Q.pos;
      for(let t=0;t<p.length;t+=9){const ax=p[t],az=p[t+2],bx=p[t+3],bz=p[t+5],cx=p[t+6],cz=p[t+8],d=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);if(Math.abs(d)<1e-12)continue;
        const l1=((bz-cz)*(o[0]-cx)+(cx-bx)*(o[2]-cz))/d,l2=((cz-az)*(o[0]-cx)+(ax-cx)*(o[2]-cz))/d,l3=1-l1-l2;if(l1<0||l2<0||l3<0)continue;
        const y=l1*p[t+1]+l2*p[t+4]+l3*p[t+7]-o[1];if(y>0&&y<up)up=y;}}
    const h=Math.max(.45,Math.min(.7,.45+up-.1));info.eye=[q[0]+.21-h*tr,q[1]+h,q[2]];info.roof=+(.45+up-h).toFixed(3);}
  /* (the builders' own arrays let go: the pieces above are all that's kept) */
  if(typeof KIT_OUT!=='undefined')KIT_OUT.length=0;
  /* each piece stored lean, and what the bake on the graphics card needs (63_s2bake): the points to test on each
     triangle, and the piece's box */
  const lean={},tr2=[],verts={};
  for(const nm of Object.keys(out)){const D=out[nm],W=s2Weld(D);W.box=s2Box(D.pos);
    if(nm==='body'||nm==='engine'||nm==='liner'){const Q=s2Probes(D.pos);W.probe=Q.p;W.probeT=Q.t;tr2.push(Q.p.buffer,Q.t.buffer);}
    lean[nm]=W;verts[nm]=W.nu;tr2.push(W.vtx,W.idx.buffer);out[nm]=null;}
  info.verts=verts;
  return {msg:{ok:true,info,pieces:lean},tr:tr2};
}
/* A piece as the kit hands it over is a list of triangles with every corner written out in full (44 bytes each,
   three to a triangle), though most corners are shared with the triangles next door. Here each different corner is
   kept once, in 28 bytes (the position as it was; the normal and the colour as 16-bit numbers, finer than a screen
   can show; the material), and each triangle becomes three numbers saying which corners it uses. The same
   triangles, in the same order: only the repeats are gone (a third as much for the graphics card to hold and
   to work through, every frame) */
function s2Weld(D){
  const P=D.pos,N=D.nrm,C=D.col,M=D.mat,nv=M.length;
  let cap=1024;while(cap<nv*2)cap<<=1;const tab=new Int32Array(cap).fill(-1),mask=cap-1;
  const buf=new ArrayBuffer(nv*28),U=new Uint32Array(buf),idx=new Uint32Array(nv);
  const rec=new ArrayBuffer(28),rf=new Float32Array(rec,0,3),ri=new Int16Array(rec),rw=new Uint32Array(rec);
  const q=v=>{v=Math.round(v*32767);return v>32767?32767:v<-32767?-32767:v;};
  let nu=0;
  for(let v=0;v<nv;v++){const a=v*3,c=v*4;
    rf[0]=P[a]+0;rf[1]=P[a+1]+0;rf[2]=P[a+2]+0;
    ri[6]=q(N[a]);ri[7]=q(N[a+1]);ri[8]=q(N[a+2]);ri[9]=M[v];
    ri[10]=q(C[c]);ri[11]=q(C[c+1]);ri[12]=q(C[c+2]);ri[13]=q(C[c+3]);
    let h=rw[0];for(let k=1;k<7;k++){h=Math.imul(h^(h>>>15),0x2c1b3c6d)+rw[k]|0;}h=Math.imul(h^(h>>>13),0x297a2d39);h^=h>>>16;
    let s=h&mask;
    for(;;){const u=tab[s];
      if(u<0){const o=nu*7;U[o]=rw[0];U[o+1]=rw[1];U[o+2]=rw[2];U[o+3]=rw[3];U[o+4]=rw[4];U[o+5]=rw[5];U[o+6]=rw[6];tab[s]=nu;idx[v]=nu++;break;}
      const o=u*7;if(U[o]===rw[0]&&U[o+1]===rw[1]&&U[o+2]===rw[2]&&U[o+3]===rw[3]&&U[o+4]===rw[4]&&U[o+5]===rw[5]&&U[o+6]===rw[6]){idx[v]=u;break;}
      s=(s+1)&mask;}}
  return {vtx:buf.slice(0,nu*28),idx:nu<=65535?new Uint16Array(idx):idx,nu,nt:nv/3};
}
function s2Box(P){const a=[1e9,1e9,1e9],b=[-1e9,-1e9,-1e9];for(let i=0;i<P.length;i+=3)for(let k=0;k<3;k++){const v=P[i+k];if(v<a[k])a[k]=v;if(v>b[k])b[k]=v;}return [a[0],a[1],a[2],b[0],b[1],b[2]];}
/* the points on a piece's bigger triangles that the bake tests for "can this be seen from outside the car", besides
   every corner: on any triangle over 3 cm long, points about 3 cm apart (a long thin one: along its length), so a
   big flat face whose corners are buried in other parts is still found. p: x, y, z and the face's normal for each;
   t: its triangle */
function s2Probes(P){
  const nt=P.length/9,S=.03;let n=0;const K=new Uint8Array(nt),RW=new Uint8Array(nt),E=new Uint8Array(nt);
  for(let t=0;t<nt;t++){const o=t*9,ax=P[o],ay=P[o+1],az=P[o+2],bx=P[o+3],by=P[o+4],bz=P[o+5],cx=P[o+6],cy=P[o+7],cz=P[o+8];
    const l0=Math.hypot(bx-ax,by-ay,bz-az),l1=Math.hypot(cx-bx,cy-by,cz-bz),l2=Math.hypot(ax-cx,ay-cy,az-cz),l=Math.max(l0,l1,l2);
    if(l<=S)continue;
    const ux=bx-ax,uy=by-ay,uz=bz-az,vx=cx-ax,vy=cy-ay,vz=cz-az,A2=Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx),h=A2/l;
    const k=Math.min(8,Math.ceil(l/S)),r=Math.max(1,Math.min(k,Math.round(h/S)));K[t]=k;RW[t]=r;E[t]=l0>=l1&&l0>=l2?0:l1>=l2?1:2;n+=k*r;}
  const p=new Float32Array(n*6),tt=new Uint32Array(n);let j=0;
  for(let t=0;t<nt;t++){const o=t*9,k=K[t],r=RW[t];if(!k)continue;
    const ux=P[o+3]-P[o],uy=P[o+4]-P[o+1],uz=P[o+5]-P[o+2],vx=P[o+6]-P[o],vy=P[o+7]-P[o+1],vz=P[o+8]-P[o+2];
    let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const nl=Math.hypot(nx,ny,nz)||1;nx/=nl;ny/=nl;nz/=nl;
    /* (along the longest side, and from it toward the corner across from it) */
    const e=E[t],a=o+e*3,b=o+((e+1)%3)*3,c=o+((e+2)%3)*3;
    for(let i=0;i<k;i++){const u=(i+.5)/k,ex=P[a]+(P[b]-P[a])*u,ey=P[a+1]+(P[b+1]-P[a+1])*u,ez=P[a+2]+(P[b+2]-P[a+2])*u;
      for(let q=0;q<r;q++){const v=r===1?1/3:(q+.5)/r*.9,w=j*6;p[w]=ex+(P[c]-ex)*v;p[w+1]=ey+(P[c+1]-ey)*v;p[w+2]=ez+(P[c+2]-ez)*v;p[w+3]=nx;p[w+4]=ny;p[w+5]=nz;tt[j++]=t;}}}
  return {p,t:tt};
}

/* LIGHTER COPIES FOR FARTHER OFF (63_s2lean asks, once a car is baked). A piece's triangles, thinned by
   meshoptimizer's simplifier (bundled below, MIT) until nothing has moved more than a set distance: 3 mm for the
   first copy, 9 mm for the second. On the screen that is under half a pixel from where each copy is used, so the
   picture is the same; the graphics card has a third or a fifth of the triangles to draw. The copies use the
   piece's own corners (nothing new is stored but the lists of which corners make each triangle), and they keep each
   corner's normal, colour and material, so paint stays paint and a lamp stays a lamp. in: {key, pieces:{name:{vtx,
   idx}}, errs:[metres]}; out: {pieces:{name:[indices of copy 1, of copy 2]}} */
async function s2Lod(q){
  const MS=typeof MeshoptSimplifier!=='undefined'?MeshoptSimplifier:null;if(!MS||!MS.supported)throw new Error('no simplifier here');
  await MS.ready;const out={},tr=[],t0=performance.now(),errs=q.errs||[.003,.009];
  for(const nm of Object.keys(q.pieces)){const D=q.pieces[nm],nu=D.vtx.byteLength/28,pos=new Float32Array(D.vtx),i16=new Int16Array(D.vtx);
    /* (what the simplifier weighs besides the shape: the normal, the colour with its glow or see-through, the material.
       The normal counts for a lot: on paint and glass a reflection shows a kink long before the shape does, and at a
       lower weight the roof and the rear glass came out faceted under a striped sky) */
    const att=new Float32Array(nu*8);for(let v=0;v<nu;v++){const o=v*14,a=v*8;att[a]=i16[o+6]/32767;att[a+1]=i16[o+7]/32767;att[a+2]=i16[o+8]/32767;
      att[a+3]=i16[o+10]/32767;att[a+4]=i16[o+11]/32767;att[a+5]=i16[o+12]/32767;att[a+6]=i16[o+13]/32767;att[a+7]=i16[o+9];}
    /* (the paint is left exactly as it is: every painted corner is locked, so the body's panels, the roof and the
       hood keep every triangle in every copy. They are a ninth of what's seen, and where a reflection would show the
       least change; glass is weighed twice as hard as the rest) */
    const lock=new Uint8Array(nu);for(let v=0;v<nu;v++){const mt=i16[v*14+9];if(mt===1||mt===4)lock[v]=1;}
    const wn=nm==='bodyG'||nm==='hoodG'?8:4;
    let idx=D.idx instanceof Uint32Array?D.idx:new Uint32Array(D.idx);const L=[];
    for(const e of errs){let r;
      try{r=MS.simplifyWithAttributes(idx,pos,7,att,8,[wn,wn,wn,1,1,1,1,4],lock,0,e,['ErrorAbsolute','Prune'])[0];}catch(x){r=idx;}
      /* (a copy that saves under a tenth isn't worth its memory: the one before stands in) */
      const keep=r.length<idx.length*.9?r:idx,o=nu<=65535?new Uint16Array(keep):new Uint32Array(keep);L.push(o);tr.push(o.buffer);idx=keep;}
    out[nm]=L;}
  return {msg:{lod:true,ok:true,key:q.key,pieces:out,ms:Math.round(performance.now()-t0)},tr};
}
