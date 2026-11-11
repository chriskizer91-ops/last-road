/* =====================================================================================
   STUDIO 2, LEAN (63_s2lean). The same Studio 2 cars, every triangle of them, made lighter for the graphics card to
   carry and to draw, and shaded better, in four steps:
   1. EACH CORNER ONCE. The kit writes every triangle's three corners out in full; most corners are shared with the
      triangles next door. The worker now hands each piece over with every different corner kept once (28 bytes) and
      the triangles as indices into them (63_s2make s2Weld). The SUV Stock: 2,424,285 corners sent every frame
      become 747,464, and 84 MB on the graphics card become 24 MB. Not one triangle is changed.
   2. THE BAKE (s2Bake below), once per car, on the graphics card, over the first second or two it is on screen.
      The car is looked at from every side (S2B.N directions), and for each corner the bake keeps:
      - how much of the sky it can see past the rest of the car (its ambient occlusion, for the side the normal faces
        and for the back of the sheet): the shader dims the sky's light and the reflections by it, so the wheel
        arches, the cabin, the engine bay, the grille and the underside sit in their own shade, as on a real car;
      - whether it can be seen at all from outside the car with the hood shut, from above its horizon or only from
        below. The triangles are then put in that order in the index buffer: seen from above first, then those seen
        only from below (highest first), then those that can't be seen from outside at all.
   3. ON THE ROAD, ONLY WHAT CAN BE SEEN (s2DrawN). From a camera outside the car, the triangles that can't be seen
      from outside are not sent, and nor are the ones only seen from lower than the camera is (the underside, from a
      chase camera). The cockpit, the hood camera and the bay always draw every triangle.
   4. LIGHTER COPIES FARTHER OFF (s2LodAsk). Once baked, the worker thins each piece twice with meshoptimizer's
      simplifier (63_s2make s2Lod), never moving anything more than 3 mm (copy 1) or 9 mm (copy 2). On the road a
      copy is drawn only from where a pixel on the car is at least twice that size, so what it leaves out is finer
      than the screen can show; the sun's shadow map (far coarser than that) always takes a copy. The bay, the
      cockpit and the hood camera never do: they draw the car as the kit made it.
   Dev, at the end of the page's address: ?s2bake=0 leaves the bake out (step 1 only), ?s2bake=64 sets the number of
   directions, ?s2ao=0 leaves the shade off, ?s2cull=0 always draws every triangle, ?s2lod=0 never draws a lighter
   copy, ?tyres=2 builds the two SUVs' tyres as they were.
   ===================================================================================== */
/* a lean piece up to the graphics card: one buffer of corners, one of indices (12_gl_mesh meshUpload's way: a big one
   is checked for GL_OUT_OF_MEMORY and tried again later from drawMesh) */
function meshUploadI(m,d){
  const big=d.vtx.byteLength>600000;
  if(big)for(let k=0;k<8&&gl.getError()!==gl.NO_ERROR;k++);
  const vao=gl.createVertexArray();gl.bindVertexArray(vao);
  const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,d.vtx,gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,28,0);
  gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.SHORT,true,28,12);
  gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,1,gl.SHORT,false,28,18);
  gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,4,gl.SHORT,true,28,20);
  const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,d.idx,gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  let oom=false;if(big){for(let k=0,er;k<8&&(er=gl.getError())!==gl.NO_ERROR;k++)if(er===gl.OUT_OF_MEMORY)oom=true;}
  m.vao=vao;m.bufs=[vb];m.ib=ib;m.it=d.idx instanceof Uint32Array?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT;m.n=d.idx.length;m.nv=d.nu;if(m.inst===undefined)m.inst=null;m.ni=0;m.oom=oom;m.lean=true;
  if(oom){GLC.oom=(GLC.oom||0)+1;m.src=d;m.tries=(m.tries||0)+1;m.retryT=performance.now()+400*m.tries;}else delete m.src;
  return m;
}
/* the first n indices of a piece (its triangles are in the bake's order: s2BakeFinish) */
function drawMeshN(m,n){if(m.oom&&!meshRetry(m))return 0;if(n<=0)return 0;GLC.n++;gl.bindVertexArray(m.vao);gl.drawElements(gl.TRIANGLES,n,m.it,0);return n/3;}

const S2B={q:[],job:null,P:null,
  N:(()=>{const q=new URLSearchParams(location.search).get('s2bake');return q===null?256:Math.max(0,Math.min(1024,+q|0));})(),
  cull:new URLSearchParams(location.search).get('s2cull')!=='0',lod:new URLSearchParams(location.search).get('s2lod')!=='0',ao:new URLSearchParams(location.search).get('s2ao')!=='0',
  /* what the worker is asked for: the two SUVs' finer tyres (?tyres=2: as they were) */
  opt:{tyres:new URLSearchParams(location.search).get('tyres')==='2'?2:3},
  /* the lighter copies: how far anything may move in each (metres), and how many of those a pixel must cover */
  E:[.003,.009],PX:2,
  /* the pieces that are fixed to the body, and the ones that are sorted by what can be seen */
  FIX:['body','hood','liner','engine'],SORT:['body','engine','liner'],last:null};
function s2BakePrograms(){
  if(S2B.P||!S2B.N)return;const G=R.G;
  try{S2B.P={
    /* the car into a depth map, from one direction */
    d:G.program('s2bkDepth',`layout(location=0) in vec3 aPos;uniform mat4 uM;uniform mat4 uLVP;void main(){gl_Position=uLVP*(uM*vec4(aPos,1.));}`,`out vec4 o;void main(){o=vec4(0.);}`),
    /* each corner (or test point) as one dot in the tally texture, at its own number: can it see out this way? It is
       lifted 1.5 map texels off its surface, on the side that faces this direction, and half a texel toward the light,
       so the surface it lies on never hides it. Red: the sky it sees on the normal's side (by the cosine); green: on
       the back; blue and alpha: seen from outside the shut car at all, from above its horizon or from below */
    a:G.program('s2bkTally',`layout(location=0) in vec3 aPos;layout(location=1) in vec3 aNrm;
uniform mat4 uM;uniform mat4 uLVP;uniform vec3 uL;uniform highp sampler2D uDA;uniform highp sampler2D uDB;
uniform vec4 uMask;uniform float uUp;uniform vec2 uOff;uniform ivec2 uTW;uniform int uBase;
out vec4 vA;
void main(){
  vec3 p=(uM*vec4(aPos,1.)).xyz,n=mat3(uM)*aNrm;float l=length(n);n=l>1e-6?n/l:vec3(0.);
  float nl=dot(n,uL),sg=nl>0.?1.:nl<0.?-1.:0.;
  vec3 q=p+n*(sg*uOff.x)+uL*uOff.y;
  vec4 c=uLVP*vec4(q,1.);vec3 s=c.xyz*.5+.5;float a=1.,b=1.;
  if(s.x>0.&&s.x<1.&&s.y>0.&&s.y<1.){a=s.z<=texture(uDA,s.xy).r?1.:0.;b=s.z<=texture(uDB,s.xy).r?1.:0.;}
  vA=vec4(a*max(nl,0.),a*max(-nl,0.),b*uUp,b*(1.-uUp))*uMask;
  int id=gl_VertexID+uBase;
  gl_Position=vec4((vec2(float(id%uTW.x),float(id/uTW.x))+.5)/vec2(uTW)*2.-1.,0.,1.);gl_PointSize=1.;}`,`in vec4 vA;out vec4 o;void main(){o=vA;}`),
    /* the tally into bytes to read back: how much is hidden on each side, and the two seen-from flags */
    r:G.program('s2bkOut',SL3.FS_VS,`uniform highp sampler2D uAcc;uniform float uK;out vec4 o;
void main(){vec4 a=texelFetch(uAcc,ivec2(gl_FragCoord.xy),0);o=vec4(1.-clamp(a.r*uK,0.,1.),1.-clamp(a.g*uK,0.,1.),a.b>.5?1.:0.,a.a>.5?1.:0.);}`)};}
  catch(e){console.warn('Studio 2 bake: '+(e&&e.message||e));S2B.P=null;S2B.N=0;}
}
/* a car to bake, once it's on the graphics card (63_s2 s2Done) */
function s2BakeQueue(S){if(S2B.N>0&&S.bk)S2B.q.push(S);}
const s2Tex=(w,h,ifmt)=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texStorage2D(gl.TEXTURE_2D,1,ifmt,w,h);
  for(const [k,v] of [[gl.TEXTURE_MIN_FILTER,gl.NEAREST],[gl.TEXTURE_MAG_FILTER,gl.NEAREST],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,k,v);
  return {t,target:gl.TEXTURE_2D,w,h};};
/* a view straight down direction d onto a ball of radius r round c: everything in the ball inside the map */
function s2LVP(c,r,d){
  const up=Math.abs(d[1])>.98?[1,0,0]:[0,1,0],V=M4.look([c[0]+d[0]*r,c[1]+d[1]*r,c[2]+d[2]*r],c,up),O=new Float32Array(16);
  O[0]=1/r;O[5]=1/r;O[10]=-1/r;O[14]=-1;O[15]=1;return M4.mul(O,V);}
function s2BakeBegin(S){
  if(!S2B.P)s2BakePrograms();if(!S2B.P)return null;const G=R.G,B=S.bk,J={S,d:0,N:S2B.N,t0:performance.now(),tex:[],fb:[],vao:[],buf:[]};
  /* where everything sits on the car at rest: the body (tail up over big rear tyres), the four wheels at their hubs */
  let Mb=M4.id();if(S.pitch)Mb=M4.mul(M4T(S.fx,S.R,0),M4.mul(M4RZ(S.pitch),M4T(-S.fx,-S.R,0)));
  J.Mb=Mb;J.Mw=[];
  for(const front of [1,0])for(const s of [1,-1]){const x=front?S.fx:S.fx-S.wb*Math.cos(S.pitch),Rw=front?S.R:S.Rr,tw=front?S.tw:S.twR;
    J.Mw.push({front,s,M:M4.mul(M4T(x,Rw,s*tw),M4S(1,1,s))});}
  /* the ball the car fits in (its pieces' boxes), and the wheel's own */
  const lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9],grow=(bx,M)=>{for(let k=0;k<8;k++){const p=M4.xform(M,[bx[k&1?3:0],bx[k&2?4:1],bx[k&4?5:2]]);for(let a=0;a<3;a++){if(p[a]<lo[a])lo[a]=p[a];if(p[a]>hi[a])hi[a]=p[a];}}};
  for(const nm of S2B.FIX)if(B[nm])grow(B[nm].box,Mb);
  for(const w of J.Mw){const D=B[w.front?'wheel':'wheelR']||B.wheel;if(D)grow(D.box,w.M);}
  J.c=[(lo[0]+hi[0])/2,(lo[1]+hi[1])/2,(lo[2]+hi[2])/2];J.r=Math.hypot(hi[0]-lo[0],hi[1]-lo[1],hi[2]-lo[2])/2*1.01;J.box=[lo,hi];
  const wr=nm=>{const D=B[nm];if(!D)return .5;const b=D.box;return Math.hypot(Math.max(-b[0],b[3]),Math.max(-b[1],b[4]),Math.max(-b[2],b[5]))*1.02;};
  J.rw=wr('wheel');J.rwR=B.wheelR?wr('wheelR'):0;
  try{
    /* the two depth maps of the whole car (A: what shades it, the wheels in, the hood off; B: what hides it from
       outside, the hood shut, no wheels: they turn and steer) and one of a wheel on its own */
    const res=J.res=S2B.res||2048,rw=1024;
    J.dA=s2Tex(res,res,gl.DEPTH_COMPONENT16);J.dB=s2Tex(res,res,gl.DEPTH_COMPONENT16);J.dW=s2Tex(rw,rw,gl.DEPTH_COMPONENT16);J.tex.push(J.dA,J.dB,J.dW);
    J.fA=G.target(null,J.dA);J.fB=G.target(null,J.dB);J.fW=G.target(null,J.dW);J.fb.push(J.fA,J.fB,J.fW);
    /* the tally: a texel for every corner of every piece, then one for every test point */
    let n=0;J.base={};J.pbase={};
    for(const nm of Object.keys(B)){J.base[nm]=n;n+=B[nm].nu;}
    for(const nm of S2B.SORT)if(B[nm]&&B[nm].probe){J.pbase[nm]=n;n+=B[nm].probeT.length;
      const vao=gl.createVertexArray(),vb=gl.createBuffer();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,B[nm].probe,gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,24,12);
      gl.bindVertexArray(null);J.vao.push(vao);J.buf.push(vb);B[nm].pvao=vao;}
    J.tw=2048;J.th=Math.max(1,Math.ceil(n/J.tw));
    J.acc=G.texture(J.tw,J.th,'rgba16f',{filter:'nearest'});J.out=G.texture(J.tw,J.th,'rgba8',{filter:'nearest'});J.tex.push(J.acc,J.out);
    J.fAcc=G.target([J.acc]);J.fOut=G.target([J.out]);J.fb.push(J.fAcc,J.fOut);
    G.bind(J.fAcc);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  }catch(e){console.warn('Studio 2 bake: '+(e&&e.message||e));s2BakeEnd(J);return null;}
  return J;
}
function s2BakeEnd(J){
  for(const t of J.tex)if(t)gl.deleteTexture(t.t);for(const f of J.fb)if(f)gl.deleteFramebuffer(f.fb);for(const v of J.vao)gl.deleteVertexArray(v);for(const b of J.buf)gl.deleteBuffer(b);
  if(J.S&&J.S.bk){for(const nm in J.S.bk)delete J.S.bk[nm].pvao;}
  S2B.job=null;}
/* direction i of n, spread evenly over the whole sphere */
const s2Dir=(i,n)=>{const y=1-2*(i+.5)/n,r=Math.sqrt(Math.max(0,1-y*y)),p=i*2.399963229728653;return [Math.cos(p)*r,y,Math.sin(p)*r];};
function s2BakeDir(J,i){
  const G=R.G,S=J.S,B=S.bk,P=S2B.P,d=s2Dir(i,J.N),LVP=s2LVP(J.c,J.r,d),ts=2*J.r/J.res;
  const wheelOf=w=>w.s<0&&S.wheelL?S.wheelL:S[w.front?'wheel':'wheelR']||S.wheel,brakeOf=w=>S[w.front?'brake':'brakeR']||S.brake;
  const draw=m=>{if(m&&!m.oom){gl.bindVertexArray(m.vao);gl.drawElements(gl.TRIANGLES,m.n,m.it,0);}};
  gl.disable(gl.BLEND);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LESS);gl.depthMask(true);gl.disable(gl.CULL_FACE);gl.disable(gl.POLYGON_OFFSET_FILL);gl.clearDepth(1);
  G.use(P.d);G.uni(P.d,'uLVP',LVP);
  /* A: the body, the engine, the wheels and brakes */
  G.bind(J.fA);gl.clear(gl.DEPTH_BUFFER_BIT);G.uni(P.d,'uM',J.Mb);draw(S.body);draw(S.engine);
  for(const w of J.Mw){G.uni(P.d,'uM',w.M);draw(wheelOf(w));draw(brakeOf(w));}
  /* B: the body, the engine, the hood shut with its pad */
  G.bind(J.fB);gl.clear(gl.DEPTH_BUFFER_BIT);G.uni(P.d,'uM',J.Mb);draw(S.body);draw(S.engine);draw(S.hood);draw(S.liner);
  /* the tally */
  gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.enable(gl.BLEND);gl.blendEquation(gl.FUNC_ADD);gl.blendFunc(gl.ONE,gl.ONE);
  G.use(P.a);G.bind(J.fAcc);G.tex(P.a,{uDA:J.dA,uDB:J.dB});
  G.uni(P.a,'uLVP',LVP);G.uni(P.a,'uL',d);G.uni(P.a,'uUp',d[1]>=-.03?1:0);G.uni(P.a,'uOff',[ts*1.5,ts*.5]);G.uni(P.a,'uTW',[J.tw,J.th]);G.uni(P.a,'uM',J.Mb);
  for(const nm of S2B.FIX){const m=S[nm];if(!m||m.oom||!B[nm])continue;G.uni(P.a,'uMask',[1,1,1,1]);G.uni(P.a,'uBase',J.base[nm]);gl.bindVertexArray(m.vao);gl.drawArrays(gl.POINTS,0,B[nm].nu);}
  for(const nm of S2B.SORT){const D=B[nm];if(!D||!D.pvao)continue;G.uni(P.a,'uMask',[0,0,1,1]);G.uni(P.a,'uBase',J.pbase[nm]);gl.bindVertexArray(D.pvao);gl.drawArrays(gl.POINTS,0,D.probeT.length);}
  /* the wheels and brakes, on their own (they turn: only what a wheel does to itself stays true) */
  for(const [wn,bn,bt,rw] of [['wheel','brake',1,J.rw],['wheelR','brakeR',1,J.rwR],['wheelL','brake',0,J.rw]]){const mw=S[wn],mb=S[bn];if(!B[wn]||!mw||mw.oom||!rw)continue;
    const LW=s2LVP([0,0,0],rw,d),tw=2*rw/1024;
    gl.disable(gl.BLEND);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);G.use(P.d);G.bind(J.fW);gl.clear(gl.DEPTH_BUFFER_BIT);G.uni(P.d,'uLVP',LW);G.uni(P.d,'uM',M4_ID);draw(mw);if(B[bn])draw(mb);
    gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.enable(gl.BLEND);G.use(P.a);G.bind(J.fAcc);G.tex(P.a,{uDA:J.dW,uDB:J.dW});
    G.uni(P.a,'uLVP',LW);G.uni(P.a,'uOff',[tw*1.5,tw*.5]);G.uni(P.a,'uM',M4_ID);G.uni(P.a,'uMask',[1,1,0,0]);
    for(const nm of bt?[wn,bn]:[wn]){const m=S[nm];if(!m||m.oom||!B[nm])continue;G.uni(P.a,'uBase',J.base[nm]);gl.bindVertexArray(m.vao);gl.drawArrays(gl.POINTS,0,B[nm].nu);}
    G.tex(P.a,{uDA:J.dA,uDB:J.dB});G.uni(P.a,'uLVP',LVP);G.uni(P.a,'uOff',[ts*1.5,ts*.5]);G.uni(P.a,'uM',J.Mb);}
}
/* the tally read back: each piece's shade to the graphics card as two bytes a corner, and the sorted pieces'
   triangles put in order (seen from above; seen only from below, highest first; not seen from outside) */
function s2BakeFinish(J){
  const G=R.G,S=J.S,B=S.bk,P=S2B.P;
  gl.disable(gl.BLEND);gl.disable(gl.DEPTH_TEST);G.use(P.r);G.bind(J.fOut);G.tex(P.r,{uAcc:J.acc});G.uni(P.r,'uK',4/J.N);G.fullscreen();
  const px=new Uint8Array(J.tw*J.th*4);gl.readPixels(0,0,J.tw,J.th,gl.RGBA,gl.UNSIGNED_BYTE,px);
  /* (a graphics card that answered nonsense, say every corner hidden: the bake is left out, and the car is drawn
     with every triangle and no shade, rather than with holes in it or black) */
  {const D=B.body,b0=(J.base.body||0)*4,n=D?D.nu:0;let u=0,oc=0;for(let v=0;v<n;v++){if(px[b0+v*4+2])u++;oc+=px[b0+v*4];}
    if(!n||u<n*.25||oc>n*200){console.warn('Studio 2 bake: left out, its answer made no sense here ('+u+' of '+n+' corners seen)');s2BakeEnd(J);s2LodAsk(S);S.bk=null;return;}}
  const st={};
  for(const nm of Object.keys(B)){const m=S[nm],D=B[nm];if(!m||m.oom||J.base[nm]===undefined)continue;const nu=D.nu,b0=J.base[nm]*4;
    if(nm!=='bodyG'&&nm!=='hoodG'){
      const ao=new Uint8Array(nu*2);for(let v=0;v<nu;v++){ao[v*2]=px[b0+v*4];ao[v*2+1]=px[b0+v*4+1];}
      gl.bindVertexArray(m.vao);const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,ao,gl.STATIC_DRAW);
      gl.enableVertexAttribArray(4);gl.vertexAttribPointer(4,2,gl.UNSIGNED_BYTE,true,2,0);gl.bindVertexArray(null);m.bufs.push(vb);m.aoB=vb;}
    if(!S2B.SORT.includes(nm)||!D.idx)continue;
    /* each triangle: 0 seen from above, 1 only from below, 2 not from outside; by its corners and its test points */
    const idx=D.idx,nt=idx.length/3,cls=new Uint8Array(nt).fill(2);
    for(let t=0;t<nt;t++){let c=2;for(let k=0;k<3;k++){const o=b0+idx[t*3+k]*4;if(px[o+2]){c=0;break;}if(px[o+3])c=1;}cls[t]=c;}
    if(J.pbase[nm]!==undefined){const p0=J.pbase[nm]*4,T=D.probeT;for(let j=0;j<T.length;j++){const t=T[j],o=p0+j*4;if(px[o+2])cls[t]=0;else if(px[o+3]&&cls[t]===2)cls[t]=1;}}
    /* (the height a from-below triangle reaches, on the car: from its corners' positions in the piece's own buffer) */
    const pos=new Float32Array(D.vtx),yOf=i=>pos[i*7+1];
    let nU=0,nL=0;const low=[];for(let t=0;t<nt;t++){if(cls[t]===0)nU++;else if(cls[t]===1){nL++;low.push(t);}}
    const yTop=new Float32Array(nt);for(const t of low)yTop[t]=Math.max(yOf(idx[t*3]),yOf(idx[t*3+1]),yOf(idx[t*3+2]));
    low.sort((a,b)=>yTop[b]-yTop[a]||a-b);
    const out=new idx.constructor(idx.length);let o=0;
    for(let t=0;t<nt;t++)if(cls[t]===0){out[o++]=idx[t*3];out[o++]=idx[t*3+1];out[o++]=idx[t*3+2];}
    for(const t of low){out[o++]=idx[t*3];out[o++]=idx[t*3+1];out[o++]=idx[t*3+2];}
    for(let t=0;t<nt;t++)if(cls[t]===2){out[o++]=idx[t*3];out[o++]=idx[t*3+1];out[o++]=idx[t*3+2];}
    gl.bindVertexArray(m.vao);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.ib);gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER,0,out);gl.bindVertexArray(null);D.idxS=out;
    /* how many from-below triangles reach above each height (every 5 cm from the ground up): what a camera at that
       height on the car still needs */
    const hN=new Uint32Array(100);for(let k=0;k<100;k++){const y=k*.05;let a=0,b=low.length;while(a<b){const mid=(a+b)>>1;if(yTop[low[mid]]>y)a=mid+1;else b=mid;}hN[k]=a;}
    m.nU=nU*3;m.nL=nL*3;m.hN=hN;st[nm]=[nU,nL,nt-nU-nL];}
  S.baked={ms:Math.round(performance.now()-J.t0),N:J.N,st,c:J.c,r:J.r,box:J.box,t:APP.t};S2B.last=S.baked;
  s2BakeEnd(J);s2LodAsk(S);S.bk=null;
}
/* the lighter copies asked of the worker: each piece's corners go back to it (they're on the graphics card now), with
   the triangles to thin. The body: only what can be seen from above (what's seen from below stays as it is, drawn
   by height as before; what can't be seen from outside is never drawn from where a copy is used) */
function s2LodAsk(S){
  const B=S.bk,w=DYB.w;if(!S2B.lod||!B||!w||S.lodAsked)return;S.lodAsked=true;
  const pieces={},tr=[];
  for(const nm of ['body','bodyG','hood','hoodG','wheel','wheelR','wheelL','brake','brakeR']){const D=B[nm],m=S[nm];if(!D||!m||m.oom||!D.vtx||D.nt<400)continue;
    let idx=D.idxS||D.idx;if(nm==='body'&&m.nU!==undefined)idx=idx.slice(0,m.nU);if(idx.length<1200)continue;
    pieces[nm]={vtx:D.vtx,idx};tr.push(D.vtx,idx.buffer);}
  if(!Object.keys(pieces).length)return;
  try{w.postMessage({lod:true,key:S.key,pieces,errs:S2B.E},[...new Set(tr)]);}catch(e){console.warn('Studio 2 lighter copies: '+(e&&e.message||e));}
}
/* the copies back: each a list of indices over the piece's own corners, with a vertex array of its own */
function s2LodDone(q){
  const S=DYB.S2.get(q.key);if(!q.ok){console.warn('Studio 2 lighter copies: '+q.err);return;}if(!S)return;
  const st={};
  for(const nm of Object.keys(q.pieces)){const m=S[nm];if(!m||m.oom||!m.lean)continue;m.lod=[];
    for(const idx of q.pieces[nm]){const vao=gl.createVertexArray();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,m.bufs[0]);
      gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,28,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.SHORT,true,28,12);
      gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,1,gl.SHORT,false,28,18);gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,4,gl.SHORT,true,28,20);
      if(m.aoB){gl.bindBuffer(gl.ARRAY_BUFFER,m.aoB);gl.enableVertexAttribArray(4);gl.vertexAttribPointer(4,2,gl.UNSIGNED_BYTE,true,2,0);}
      const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,idx,gl.STATIC_DRAW);gl.bindVertexArray(null);
      m.bufs.push(ib);m.lod.push({vao,n:idx.length,it:idx instanceof Uint32Array?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT});}
    st[nm]=[m.n/3,...m.lod.map(l=>l.n/3)];}
  S.lods={ms:q.ms,st};
}
/* a piece's copy k (1, 2), or the piece itself (0, or no copies yet); triangles drawn */
function drawMeshL(m,k){const l=k>0&&m.lod&&m.lod[Math.min(k,m.lod.length)-1];if(!l){return drawMesh(m)?m.n/3:0;}
  GLC.n++;gl.bindVertexArray(l.vao);gl.drawElements(gl.TRIANGLES,l.n,l.it,0);return l.n/3;}
/* the body (or another sorted piece) for a camera outside the car: its seen-from-above part as copy k, then what's
   seen only from below and reaches above the camera, as it is */
function drawMeshS(m,y,all,k){
  if(all||m.nU===undefined||!s2CullOn())return drawMeshL(m,all?0:k);
  if(m.oom&&!meshRetry(m))return 0;
  const j=y<0?0:Math.min(99,Math.floor(Math.max(0,y-.1)/.05)),nl=m.hN[j]*3,l=k>0&&m.lod&&m.lod[Math.min(k,m.lod.length)-1];let n=0;
  if(l){GLC.n++;gl.bindVertexArray(l.vao);gl.drawElements(gl.TRIANGLES,l.n,l.it,0);n+=l.n;
    if(nl){GLC.n++;gl.bindVertexArray(m.vao);gl.drawElements(gl.TRIANGLES,nl,m.it,m.nU*(m.it===gl.UNSIGNED_INT?4:2));n+=nl;}}
  else if(m.nU+nl>0){GLC.n++;gl.bindVertexArray(m.vao);gl.drawElements(gl.TRIANGLES,m.nU+nl,m.it,0);n+=m.nU+nl;}
  return n/3;}
/* which copy a view takes: by how big a pixel is on the car from there (the picture's own height in pixels: TAA builds
   the detail up to it), held until it has changed by a tenth so it doesn't flip back and forth */
function s2LodFor(S,cam,eyeL){
  if(!s2LodOn()||!S.lods||!cam)return 0;const b=S.baked&&S.baked.box;let d=1;
  if(b){const dx=Math.max(b[0][0]-eyeL[0],0,eyeL[0]-b[1][0]),dy=Math.max(b[0][1]-eyeL[1],0,eyeL[1]-b[1][1]),dz=Math.max(b[0][2]-eyeL[2],0,eyeL[2]-b[1][2]);d=Math.hypot(dx,dy,dz);}
  const px=2*d*Math.tan((cam.fov||.9)/2)/Math.max(200,R.H||720),cur=S.lodK||0,E=S2B.E,K=S2B.PX;
  let k=px>E[1]*K?2:px>E[0]*K?1:0;
  if(k!==cur){const edge=E[Math.max(k,cur)-1]*K;if(Math.abs(px-edge)<edge*.1)k=cur;}
  S.lodPx=px;return S.lodK=k;}
/* a few directions a frame, before the frame is drawn; then the graphics state is left as the renderer expects */
function s2BakeStep(){
  let J=S2B.job;
  if(!J){let S=null;while(S2B.q.length){const q=S2B.q.shift();if(DYB.S2.get(q.key)===q&&q.bk){S=q;break;}}
    if(!S)return;J=S2B.job=s2BakeBegin(S);if(!J){s2LodAsk(S);S.bk=null;return;}}
  if(DYB.S2.get(J.S.key)!==J.S){s2BakeEnd(J);return;}
  try{const per=S2B.per||(touchy?2:4);for(let k=0;k<per&&J.d<J.N;k++)s2BakeDir(J,J.d++);
    if(J.d>=J.N)s2BakeFinish(J);}
  catch(e){console.warn('Studio 2 bake: '+(e&&e.message||e));s2BakeEnd(J);s2LodAsk(J.S);J.S.bk=null;}
  gl.disable(gl.BLEND);gl.blendEquation(gl.FUNC_ADD);gl.depthMask(true);gl.colorMask(true,true,true,true);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.bindVertexArray(null);
}
/* how much of a sorted piece a camera outside the car needs: everything seen from above, and what's seen only from
   below that reaches higher than the camera is (y: its height on the car; below -1: all of it) */
function s2DrawN(m,y,all){
  if(all||m.nU===undefined||!s2CullOn())return m.n;
  const k=y<0?0:Math.min(99,Math.floor(Math.max(0,y-.1)/.05));return m.nU+m.hN[k]*3;}
/* where a point of the renderer's frame is on the car (the car's own matrix is a turn and a move) */
function s2Local(M,p){const x=p[0]-M[12],y=p[1]-M[13],z=p[2]-M[14];return [M[0]*x+M[1]*y+M[2]*z,M[4]*x+M[5]*y+M[6]*z,M[8]*x+M[9]*y+M[10]*z];}
/* is this point (on the car) clear of the box the whole car fits in, by 10 cm? */
function s2Outside(S,p){const b=S.baked&&S.baked.box;if(!b)return false;const g=.1;return p[0]<b[0][0]-g||p[0]>b[1][0]+g||p[1]<b[0][1]-g||p[1]>b[1][1]+g||p[2]<b[0][2]-g||p[2]>b[1][2]+g;}
/* how far the shade has faded in (over the half second after its bake) */
const s2BkK=S=>S.baked&&S2B.ao&&LOOK.carShade?clamp((APP.t-S.baked.t)*2,0,1):0;
/* (Settings, Dev, the look's switches: The car's own shade, Only what can be seen; and the address's own switches) */
const s2CullOn=()=>S2B.cull&&!!LOOK.carLean,s2LodOn=()=>S2B.lod&&!!LOOK.carLean;
