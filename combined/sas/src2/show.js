/* =====================================================================================
   THE SHOWROOM (sas_show): a switch in the bay's Look bar, there only for the SUV Stock and the Rock & Mud. On, the
   studio goes: no walls, no turntable, no dyno, nothing drawn but the car, in a flat black void (the bar's Dark bay)
   or a flat white one (Light cyc). The car in it is the showroom's: the Studio 2 car with its showroom detail on
   (the kit's kit_show: pieces of their own, drawn nowhere else, so the bay and the road cost what they did).
   - What the camera sees behind the car is one flat colour. What the paint, the glass and the chrome reflect is a
     photographer's rig that is never in the picture (11_sl3's studioEnv, in the reflection probe only): black, a big
     soft box overhead and a strip light down each side; white, a bright room with a darker line at its horizon.
   - White: the car stands on its own soft shadow. The floor is not there; the shadow is how much of the white room
     each point of it can't see past the car, worked out once per car on the graphics card the way the car's own
     shade is (63_s2lean's bake: the same two programs), and drawn as a darkening of the white.
   - Black: no floor at all.
   ===================================================================================== */
STAGES.voidB={id:3,sun:V3.norm([.22,1,.16]),sunCol:lin('#fff3e6',.95),sky:lin('#3c3e48',.36),gnd:lin('#16161a',.22),fog:lin('#000000'),bg:[0,0,0],fogD:0,
  lights:[[3.8,4.6,3.4,16,[1,.97,.92],2.0],[-4.4,3.6,-3.8,15,[.86,.9,1],1.5],[-5.4,1.6,4.6,12,[1,.98,.95],1.4],[5.4,1.6,-4.8,12,[.92,.95,1],1.4],[0,6.2,0,11,[1,1,1],1.1],[0,1.1,6.6,9,[1,.97,.92],.6],
    [5.2,.8,4.4,11,[1,1,1],1.2],[-5.2,.8,-4.6,11,[1,1,1],1.2]],
  garage:[0,1,2,3,4],rowLight:[[1,1,1],0],key:.072,expo:[.9,.9],bloom:.03,vig:.12};
STAGES.voidW={id:4,sun:V3.norm([.4,.88,.3]),sunCol:lin('#fff6ea',1.35),sky:lin('#e4e3e0',1.05),gnd:lin('#dcdad6',.95),fog:lin('#c8c6c2'),bg:[9.6,9.6,9.6],fogD:0,
  lights:[[4,4.5,4,14,[1,.97,.92],1.0],[-5,3,-3,14,[.85,.9,1],.7],[0,6,0,10,[1,1,1],.6],[0,.7,5.2,11,[1,1,1],.9],[0,.7,-5.2,11,[1,1,1],.9]],
  garage:[0,1,2],rowLight:[[1,1,1],0],key:.15,expo:[.25,.25],bloom:0,vig:0};
const showCanVoid=()=>{const k=s2Key(APP.bi);return k==='stock'||k==='crawler';};
/* the studio the frame is lit as: the void's, or the bay's own */
const showStg=()=>STAGES[SHOW.void?(SHOW.stage==='light'?'voidW':'voidB'):SHOW.stage];
/* each frame of the bay: the switch is there for the two SUVs only (and off again on any other car); white, the
   floor's shadow is worked out once the car's own shade is done */
function showVoidFrame(){
  const ok=showCanVoid();
  if(SHOW.voidOk!==ok){SHOW.voidOk=ok;if(!ok)SHOW.void=false;const b=$('shVoid');if(b){b.hidden=!ok;b.setAttribute('aria-pressed',String(!!SHOW.void));}SHOW.dockTop=undefined;}
  if(SHOW.void&&SHOW.stage==='light'){const S=s2For(APP.bi);if(S&&S.baked&&!S.floor&&!S2B.job)showFloorStep(S);}
}
/* ---------- the white void's floor shadow ---------- */
const VFLOOR={job:null,K:.78,P:1.25,N:384};
/* the white the camera's picture makes of a light (2 Shiftlight's last pass: the film curve, then the screen's), and back:
   the floor's shadow is set in what the eye sees, a steady fall from white, and turned back into light for the shader */
const vfAces=x=>(x*(x+.0245786)-.000090537)/(x*(.983729*x+.432951)+.238081),vfSrgb=y=>y<=.0031308?y*12.92:1.055*Math.pow(y,1/2.4)-.055,vfLin=v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);
const vfAcesInv=y=>{const a=.983729*y-1,b=.432951*y-.0245786,c=.238081*y+.000090537,d=Math.max(0,b*b-4*a*c);return Math.max(0,(-b-Math.sqrt(d))/(2*a));};
/* how much of the void's white a point keeps, for how hidden it is (0 to 1) */
function vfKeep(oc){const S=STAGES.voidW,x0=S.bg[0]*SLK*S.expo[0],d0=vfSrgb(vfAces(x0)),d=d0*(1-VFLOOR.K*Math.pow(clamp(oc,0,1),VFLOOR.P));return clamp(vfAcesInv(vfLin(d))/x0,0,1);}
function showFloorEnd(J){for(const t of [J.dA,J.acc,J.out])if(t)gl.deleteTexture(t.t);for(const f of [J.fA,J.fAcc,J.fOut])if(f)gl.deleteFramebuffer(f.fb);gl.deleteVertexArray(J.vao);gl.deleteBuffer(J.vb);VFLOOR.job=null;}
function showFloorStep(S){
  const P=S2B.P,G=R.G;if(!P){S.floor={none:true};return;}
  let J=VFLOOR.job;if(J&&J.S!==S){showFloorEnd(J);J=null;}
  try{
    if(!J){
      /* a grid of points on the ground round the car, 8 cm apart, out 2.4 m past it every way */
      const b=S.baked.box,pad=2.4,cell=.08,x0=b[0][0]-pad,x1=b[1][0]+pad,z0=b[0][2]-pad,z1=b[1][2]+pad,nx=Math.ceil((x1-x0)/cell),nz=Math.ceil((z1-z0)/cell),n=(nx+1)*(nz+1);
      const pts=new Float32Array(n*6);let k=0;for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){pts[k++]=x0+(x1-x0)*i/nx;pts[k++]=.004;pts[k++]=z0+(z1-z0)*j/nz;pts[k++]=0;pts[k++]=1;pts[k++]=0;}
      const vao=gl.createVertexArray(),vb=gl.createBuffer();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,pts,gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,24,12);gl.bindVertexArray(null);
      const tw=256,th=Math.ceil(n/tw),res=2048;
      J=VFLOOR.job={S,d:0,N:VFLOOR.N,vao,vb,n,nx,nz,x0,x1,z0,z1,tw,th,res};
      J.dA=s2Tex(res,res,gl.DEPTH_COMPONENT16);J.fA=G.target(null,J.dA);J.acc=G.texture(tw,th,'rgba16f',{filter:'nearest'});J.out=G.texture(tw,th,'rgba8',{filter:'nearest'});J.fAcc=G.target([J.acc]);J.fOut=G.target([J.out]);
      G.bind(J.fAcc);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
      /* the car standing on the ground, as the bake of its own shade stands it; a ball that holds the whole grid */
      let Mb=M4.id();if(S.pitch)Mb=M4.mul(M4T(S.fx,S.R,0),M4.mul(M4RZ(S.pitch),M4T(-S.fx,-S.R,0)));J.Mb=Mb;J.Mw=[];
      for(const front of [1,0])for(const s of [1,-1]){const x=front?S.fx:S.fx-S.wb*Math.cos(S.pitch),Rw=front?S.R:S.Rr,w2=front?S.tw:S.twR;J.Mw.push({front,s,M:M4.mul(M4T(x,Rw,s*w2),M4S(1,1,s))});}
      J.c=[(x0+x1)/2,1,(z0+z1)/2];J.r=Math.hypot(x1-x0,z1-z0,2.6)/2*1.03+1;
    }
    const draw=m=>{if(m&&!m.oom){gl.bindVertexArray(m.vao);gl.drawElements(gl.TRIANGLES,m.n,m.it,0);}},ts=2*J.r/J.res;
    for(let q=0;q<(touchy?3:6)&&J.d<J.N;J.d++){const d=s2Dir(J.d,J.N);if(d[1]<.04)continue;q++;const LVP=s2LVP(J.c,J.r,d);
      gl.disable(gl.BLEND);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LESS);gl.depthMask(true);gl.disable(gl.CULL_FACE);gl.disable(gl.POLYGON_OFFSET_FILL);gl.clearDepth(1);
      G.use(P.d);G.uni(P.d,'uLVP',LVP);G.bind(J.fA);gl.clear(gl.DEPTH_BUFFER_BIT);G.uni(P.d,'uM',J.Mb);draw(S.body);draw(S.engine);draw(S.hood);draw(S.liner);
      for(const w of J.Mw){G.uni(P.d,'uM',w.M);draw(w.s<0&&S.wheelL?S.wheelL:w.front?S.wheel:S.wheelR);draw(w.front?S.brake:S.brakeR);}
      gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.enable(gl.BLEND);gl.blendEquation(gl.FUNC_ADD);gl.blendFunc(gl.ONE,gl.ONE);
      G.use(P.a);G.bind(J.fAcc);G.tex(P.a,{uDA:J.dA,uDB:J.dA});
      G.uni(P.a,'uLVP',LVP);G.uni(P.a,'uL',d);G.uni(P.a,'uUp',1);G.uni(P.a,'uOff',[ts*1.5,ts*.5]);G.uni(P.a,'uTW',[J.tw,J.th]);G.uni(P.a,'uM',M4_ID);G.uni(P.a,'uMask',[1,0,0,0]);G.uni(P.a,'uBase',0);
      gl.bindVertexArray(J.vao);gl.drawArrays(gl.POINTS,0,J.n);}
    if(J.d>=J.N){
      gl.disable(gl.BLEND);gl.disable(gl.DEPTH_TEST);G.use(P.r);G.bind(J.fOut);G.tex(P.r,{uAcc:J.acc});G.uni(P.r,'uK',4/J.N);G.fullscreen();
      const px=new Uint8Array(J.tw*J.th*4);gl.readPixels(0,0,J.tw,J.th,gl.RGBA,gl.UNSIGNED_BYTE,px);
      const {nx,nz,x0,x1,z0,z1}=J,oc=new Float32Array(J.n);let mx=0,sum=0;
      /* (how hidden each point is, 0 to 1; faded to nothing over the grid's last half metre, so its edge can't show) */
      for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const k=j*(nx+1)+i,e=Math.min(i,nx-i,j,nz-j)*.08,v=Math.max(0,px[k*4]/255-.035)/.965*clamp(e/.5,0,1);oc[k]=v;mx=Math.max(mx,v);sum+=v;}
      if(mx<.2||sum/J.n>.8){console.warn('Showroom floor: left out, its answer made no sense here');S.floor={none:true};}
      else{const m=new MB(),P3=(i,j)=>[x0+(x1-x0)*i/nx,0,z0+(z1-z0)*j/nz],C=(i,j)=>{const v=vfKeep(oc[j*(nx+1)+i]);return [v,v,v];};
        for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){if(oc[j*(nx+1)+i]+oc[j*(nx+1)+i+1]+oc[(j+1)*(nx+1)+i]+oc[(j+1)*(nx+1)+i+1]<=0)continue;
          m.quadC(P3(i,j),P3(i,j+1),P3(i+1,j+1),P3(i+1,j),C(i,j),C(i,j+1),C(i+1,j+1),C(i+1,j),0,MAT.FLOOR);}
        S.floor={mesh:m.build(),tris:m.p.length/9,max:+mx.toFixed(2)};}
      showFloorEnd(J);}
  }catch(e){console.warn('Showroom floor: '+(e&&e.message||e));if(VFLOOR.job)showFloorEnd(VFLOOR.job);S.floor={none:true};}
  gl.disable(gl.BLEND);gl.blendEquation(gl.FUNC_ADD);gl.depthMask(true);gl.colorMask(true,true,true,true);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.bindVertexArray(null);
}
/* the void's floor, where there is one: white, the car's shadow (the lit shader paints it as the white, darkened) */
function showVoidFloor(u,Mc){
  if(DYB.under||SHOW.stage!=='light')return 0;const S=s2For(APP.bi),F=S&&S.floor;if(!F||!F.mesh)return 0;
  gl.uniformMatrix4fv(u.uM,false,Mc);drawMesh(F.mesh);return F.tris;}
