
;
/* =====================================================================================
   FINER TYRES FOR THE TWO SUVs (Studio 2, 10 Nov 2026; KIT.setTyres(2) builds them as they were).
   - LETTERING ON THE SIDEWALLS, raised 1.3 mm in the rubber as on a real tyre: the make and the pattern across the
     top (REDLINE A/S on the Stock's all-season, REDLINE M/T on the Rock & Mud's mud-terrain) and the size across the
     bottom. Each letter is a few strokes on a 4 x 6 grid (TY_F), laid along the sidewall's own curve, each stroke
     a raised strip with sloped sides. A wheel on the car's left is drawn mirrored (the game mirrors one wheel for
     both sides), so the left wheels are a second copy with the lettering laid the other way round (wheelL): it
     reads the right way on both sides of the car.
   - THE ROCK & MUD'S MUD-TERRAIN, built again (cwMudTyre3): each big lug an angled seven-sided block with its top
     edge bevelled, cut in two by a sipe that stops 8 mm down; a small block between them; stone ejectors (low ribs)
     on the groove floor; the shoulder lugs carried down the sidewall as tapered side biters, long and short in
     turn; a rim-protector rib and a raised ring on the sidewall. Same size, same pitch (21 round) as before.
   ===================================================================================== */
let HD_TYRES=3;
/* the letters: strokes on a grid 4 wide and 6 tall (x right, y up); TY_W: the ones that aren't 4 wide */
const TY_F={
  A:[[[0,0],[0,4.6],[1.4,6],[2.6,6],[4,4.6],[4,0]],[[0,2.4],[4,2.4]]],
  B:[[[0,0],[0,6],[3,6],[4,5],[4,4],[3,3.1],[0,3.1]],[[3,3.1],[4,2.2],[4,1],[3,0],[0,0]]],
  C:[[[4,4.8],[3,6],[1,6],[0,5],[0,1],[1,0],[3,0],[4,1.2]]],
  D:[[[0,0],[0,6],[2.8,6],[4,4.8],[4,1.2],[2.8,0],[0,0]]],
  E:[[[4,6],[0,6],[0,0],[4,0]],[[0,3.1],[3,3.1]]],
  F:[[[4,6],[0,6],[0,0]],[[0,3.1],[3,3.1]]],
  G:[[[4,4.8],[3,6],[1,6],[0,5],[0,1],[1,0],[3,0],[4,1],[4,2.9],[2.2,2.9]]],
  H:[[[0,0],[0,6]],[[4,0],[4,6]],[[0,3.1],[4,3.1]]],
  I:[[[.6,0],[.6,6]]],
  J:[[[4,6],[4,1],[3,0],[1,0],[0,1]]],
  K:[[[0,0],[0,6]],[[4,6],[0,2.8]],[[1.5,3.9],[4,0]]],
  L:[[[0,6],[0,0],[4,0]]],
  M:[[[0,0],[0,6],[2.3,2.6],[4.6,6],[4.6,0]]],
  N:[[[0,0],[0,6],[4,0],[4,6]]],
  O:[[[1,0],[0,1],[0,5],[1,6],[3,6],[4,5],[4,1],[3,0],[1,0]]],
  P:[[[0,0],[0,6],[3,6],[4,5],[4,3.8],[3,2.8],[0,2.8]]],
  R:[[[0,0],[0,6],[3,6],[4,5],[4,3.9],[3,2.9],[0,2.9]],[[2.2,2.9],[4,0]]],
  S:[[[4,5],[3,6],[1,6],[0,5],[0,4],[1,3.1],[3,3.1],[4,2.2],[4,1],[3,0],[1,0],[0,1]]],
  T:[[[0,6],[4,6]],[[2,6],[2,0]]],
  U:[[[0,6],[0,1],[1,0],[3,0],[4,1],[4,6]]],
  V:[[[0,6],[2,0],[4,6]]],
  W:[[[0,6],[1.1,0],[2.3,4],[3.5,0],[4.6,6]]],
  X:[[[0,0],[4,6]],[[0,6],[4,0]]],
  Y:[[[0,6],[2,3],[4,6]],[[2,3],[2,0]]],
  Z:[[[0,6],[4,6],[0,0],[4,0]]],
  '0':[[[1,0],[0,1],[0,5],[1,6],[3,6],[4,5],[4,1],[3,0],[1,0]]],
  '1':[[[.4,4.8],[1.6,6],[1.6,0]],[[.2,0],[3,0]]],
  '2':[[[0,5],[1,6],[3,6],[4,5],[4,3.8],[0,0],[4,0]]],
  '3':[[[0,5],[1,6],[3,6],[4,5],[4,4],[3,3.1],[1.6,3.1]],[[3,3.1],[4,2.2],[4,1],[3,0],[1,0],[0,1]]],
  '4':[[[3,0],[3,6],[0,2],[4,2]]],
  '5':[[[4,6],[0,6],[0,3.4],[3,3.4],[4,2.5],[4,1],[3,0],[1,0],[0,1]]],
  '6':[[[4,5],[3,6],[1,6],[0,5],[0,1],[1,0],[3,0],[4,1],[4,2.4],[3,3.4],[0,3.4]]],
  '7':[[[0,6],[4,6],[1.5,0]]],
  '8':[[[1,3.1],[0,4],[0,5],[1,6],[3,6],[4,5],[4,4],[3,3.1],[1,3.1],[0,2.2],[0,1],[1,0],[3,0],[4,1],[4,2.2],[3,3.1]]],
  '9':[[[0,1],[1,0],[3,0],[4,1],[4,5],[3,6],[1,6],[0,5],[0,3.6],[1,2.6],[4,2.6]]],
  '/':[[[0,0],[3.2,6]]],'-':[[[.3,3],[2.7,3]]],'.':[[[.45,0],[.75,0]]]};
const TY_W={I:1.2,M:4.6,W:4.6,'1':3.2,'/':3.2,'-':3,'.':1.2,' ':2.2};
/* lettering raised on a sidewall. prof: the wall's own outline, (r, z) pairs with r rising, on the +z side; items:
   {t: the words, a: the angle of their middle, r: the foot of the letters, h: their height}; flip: laid the other way
   round, for the copy that is drawn mirrored on the car's left; m: the rubber */
function hdTyreText(mb,prof,items,flip,m,rise=.0013){
  const zAt=r=>{let i=0;while(i<prof.length-2&&r>prof[i+1][0])i++;const A=prof[i],B=prof[i+1],d=(B[0]-A[0])||1e-9,t=clamp((r-A[0])/d,0,1);return [A[1]+(B[1]-A[1])*t,(B[1]-A[1])/d];};
  /* a point of the wall at angle a and radius r, lifted off it along the wall's own normal */
  const S=(a,r,lift)=>{const q=zAt(r),nl=Math.hypot(q[1],1),rr=r-q[1]/nl*lift,zz=q[0]+lift/nl;return [Math.cos(a)*rr,Math.sin(a)*rr,zz];};
  const dir=flip?1:-1;
  for(const it of items){const u=it.h/6,gap=1.25,k=(it.k||it.h*.15)/2;let w=-gap;for(const ch of it.t)w+=(TY_W[ch]||4)+gap;let x=-w/2;
    for(const ch of it.t){const G=TY_F[ch];
      if(G)for(const line of G){
        /* the stroke in steps of about a fifth of a letter's height, in metres along the wall (s) and up it (r) */
        const P=[];for(let i=0;i<line.length-1;i++){const A=line[i],B=line[i+1],n=Math.max(1,Math.ceil(Math.hypot(B[0]-A[0],B[1]-A[1])/1.3));for(let j=0;j<n;j++)P.push([dir*(x+A[0]+(B[0]-A[0])*j/n)*u,it.r+(A[1]+(B[1]-A[1])*j/n)*u]);}
        {const E=line[line.length-1];P.push([dir*(x+E[0])*u,it.r+E[1]*u]);}
        /* (a stroke's two ends carried on by half its width, so letters' corners close) */
        {const a=P[0],b=P[1],l=Math.hypot(b[0]-a[0],b[1]-a[1])||1;P[0]=[a[0]-(b[0]-a[0])/l*k*.8,a[1]-(b[1]-a[1])/l*k*.8];
          const n=P.length,c=P[n-1],d=P[n-2],l2=Math.hypot(c[0]-d[0],c[1]-d[1])||1;P[n-1]=[c[0]+(c[0]-d[0])/l2*k*.8,c[1]+(c[1]-d[1])/l2*k*.8];}
        const rows=[];
        for(let i=0;i<P.length;i++){const A=P[Math.max(0,i-1)],B=P[Math.min(P.length-1,i+1)];let tx=B[0]-A[0],ty=B[1]-A[1];const tl=Math.hypot(tx,ty)||1;tx/=tl;ty/=tl;
          /* (at a corner the strip is widened so its edges stay parallel to both strokes) */
          let ms=1;if(i>0&&i<P.length-1){const ax=P[i][0]-A[0],ay=P[i][1]-A[1],al=Math.hypot(ax,ay)||1;ms=1/Math.max(.55,(ax*tx+ay*ty)/al);}
          const at=(o,lift)=>S(it.a+(P[i][0]-ty*o*ms)/it.r,P[i][1]+tx*o*ms,lift);
          rows.push([at(-k,-.0005),at(-k*.7,rise),at(k*.7,rise),at(k,-.0005)]);}
        /* (wound so the faces look outward: the strip's own turn is the same whichever way the words run) */
        const f=true;
        for(let i=0;i<rows.length-1;i++){const A=rows[i],B=rows[i+1];for(let j=0;j<3;j++){if(f)mb.quad(A[j],A[j+1],B[j+1],B[j],m[0],m[1],m[2]);else mb.quad(A[j],B[j],B[j+1],A[j+1],m[0],m[1],m[2]);}}
        const c0=rows[0],c1=rows[rows.length-1];
        if(f){mb.quad(c0[0],c0[3],c0[2],c0[1],m[0],m[1],m[2]);mb.quad(c1[0],c1[1],c1[2],c1[3],m[0],m[1],m[2]);}
        else{mb.quad(c0[0],c0[1],c0[2],c0[3],m[0],m[1],m[2]);mb.quad(c1[0],c1[3],c1[2],c1[1],m[0],m[1],m[2]);}}
      x+=(TY_W[ch]||4)+gap;}}
}
/* a wheel and its left-hand copy: the same wheel twice, each with its own lettering */
function hdTyrePair(wheel,prof,items,m){
  const L=new MB();hdPut(L,wheel);
  hdPart(wheel,mb=>hdTyreText(mb,prof,items,false,m),50);hdPart(L,mb=>hdTyreText(mb,prof,items,true,m),50);
  return L;}
/* the lettering's rubber: a shade lighter than the wall it stands on, as a moulded letter's flat top reads */
const TY_INK=()=>SV([.05,.05,.053],SM.WALL);
/* the Stock's all-season: the make across the top, the size across the bottom, on the flat band of its sidewall
   (71_wheel hdWheel's own outline between the rim protector and the two fine rings) */
function hdStockTyreText(wheel,w){
  const rimR=w.rim*.0254/2,prof=[[rimR+.072,.118],[.3005,.1212],[.318,.1222]];
  return hdTyrePair(wheel,prof,[{t:'REDLINE A/S',a:PI/2,r:.2925,h:.021},{t:'245/65R17 111T',a:-PI/2,r:.2935,h:.017},
    {t:'M-S',a:0,r:.2945,h:.014},{t:'M-S',a:PI,r:.2945,h:.014}],TY_INK());}
/* ---------- the Rock & Mud's mud-terrain, built again ---------- */
function cwMudTyre3(out,w){
  const R=w.R,W=w.W,hw=W/2,rimR=w.rim*.0254/2,dep=.024,base=R-dep,steps=240,TM=HC.TREAD;
  /* the carcass, bead to tread edge: (r, z). A rim-protector rib just outside the beadlock, a raised ring where the
     side biters end */
  const half=[[rimR+.004,hw*.8],[rimR+.014,hw*.86],[rimR+.026,hw*.94],[rimR+.032,hw*.985],[rimR+.037,hw*.995],[rimR+.043,hw*.985],[rimR+.05,hw*.975],
    [rimR+.075,hw*1.0],[R-.16,hw*1.028],[R-.142,hw*1.03],[R-.1405,hw*1.045],[R-.1355,hw*1.045],[R-.134,hw*1.03],
    [R-.1,hw*1.03],[R-.06,hw*1.0],[R-.04,hw*.97],[base,hw*.92]];
  hdPart(out,mb=>{hdRev(mb,half,steps,HC.WALL,0,TAU,true);hdRev(mb,half.map(([r,z])=>[r,-z]),steps,HC.WALL);
    hdRev(mb,[[base,-hw*.92],[base,hw*.92]],steps,TM);},28);
  const pl=TAU/21*R,P3=(s,z,r)=>{const a=s/R;return [Math.cos(a)*r,Math.sin(a)*r,z];};
  const top=z=>R-.005*Math.pow(Math.abs(z)/(hw*.95),4);
  /* a lug: its outline (s along the tread, z across it, anticlockwise seen from outside), from the floor r0 up to the
     tread's top less drop; the top edge bevelled bv; long edges in steps so they follow the tyre's curve */
  const lug=(mb,poly,r0,drop=0,bv=.0045)=>{
    const Q=[];for(let i=0;i<poly.length;i++){const A=poly[i],B=poly[(i+1)%poly.length],n=Math.max(1,Math.ceil(Math.hypot(B[0]-A[0],B[1]-A[1])/.016));for(let k=0;k<n;k++)Q.push([A[0]+(B[0]-A[0])*k/n,A[1]+(B[1]-A[1])*k/n]);}
    let cx=0,cz=0;for(const q of Q){cx+=q[0];cz+=q[1];}cx/=Q.length;cz/=Q.length;
    const I=Q.map(q=>{const dx=q[0]-cx,dz=q[1]-cz,l=Math.hypot(dx,dz)||1,b=Math.min(bv,l*.45);return [q[0]-dx/l*b,q[1]-dz/l*b];}),n=Q.length;
    const T=(q,dr)=>P3(q[0],q[1],top(q[1])-drop-dr),c=T([cx,cz],0);
    for(let i=0;i<n;i++){const j=(i+1)%n;
      mb.quad(P3(Q[i][0],Q[i][1],r0),P3(Q[j][0],Q[j][1],r0),T(Q[j],bv*.8),T(Q[i],bv*.8),TM[0],0,TM[2]);
      mb.quad(T(Q[i],bv*.8),T(Q[j],bv*.8),T(I[j],0),T(I[i],0),TM[0],0,TM[2]);
      mb.tri(c,T(I[i],0),T(I[j],0),TM[0],0,TM[2]);}};
  /* an outline given in the pitch's own terms: u along it (in pitches from s0), v across the half (0 the middle edge,
     1 the shoulder); side -1 mirrors it (and turns its order round, to stay anticlockwise) */
  const zi=hw*.055,zo=hw*.93;
  const at=(s0,side,pts)=>{const o=pts.map(([u,v])=>[s0+u*pl,side*(zi+(zo-zi)*v)]);return side>0?o:o.reverse();};
  hdPart(out,mb=>{for(let i=0;i<21;i++)for(const side of [1,-1]){const s0=(i+(side>0?0:.5))*pl,f=base-.002;
    /* the big lug, in two halves either side of its sipe; the sipe's floor 8 mm down */
    lug(mb,at(s0,side,[[0,0],[.235,0],[.262,1],[.07,1],[0,.62]]),f);
    lug(mb,at(s0,side,[[.268,0],[.43,0],[.55,.2],[.55,.64],[.47,1],[.295,1]]),f);
    lug(mb,at(s0,side,[[.232,.02],[.272,.02],[.298,.98],[.258,.98]]),f,.008,.0008);
    /* two stone ejectors on the groove floor before the next lug */
    lug(mb,at(s0,side,[[.66,.3],[.74,.3],[.76,.56],[.68,.56]]),f,dep-.007,.002);
    lug(mb,at(s0,side,[[.82,.6],[.9,.6],[.92,.86],[.84,.86]]),f,dep-.007,.002);}
    /* the small block between the two rows, twice a pitch */
    for(let i=0;i<42;i++){const s0=(i*.5+.3)*pl,z=hw*.11,o=[[s0,-z],[s0+.15*pl,-z],[s0+.17*pl,z],[s0+.02*pl,z]];lug(mb,o,base-.002,.004,.003);}
  },24);
  /* the side biters: each shoulder lug carried down the sidewall, thick at the tread's edge and tapering into the wall,
     long and short in turn; its outer face in steps so it follows the wall */
  hdPart(out,mb=>{const zw=r=>{let k=0;while(k<half.length-2&&r>half[k+1][0])k++;const A=half[k],B=half[k+1];return A[1]+(B[1]-A[1])*clamp((r-A[0])/((B[0]-A[0])||1e-9),0,1);};
    for(let i=0;i<21;i++)for(const side of [1,-1]){const a0=(i+(side>0?0:.5))/21*TAU,a1=a0+TAU/21*.42,rLo=R-(i%2?.098:.128),rHi=R-.026,na=4,nr=4;
      const pt=(ta,tr,outer)=>{const a=a0+(a1-a0)*ta,r=rLo+(rHi-rLo)*tr,zb=zw(r)-.001,th=.004+.017*Math.pow(tr,1.3),z=outer?zb+th:zb;return [Math.cos(a)*r,Math.sin(a)*r,side*z];};
      const q=(A,B,C,D)=>{if(side>0)mb.quad(A,D,C,B,TM[0],0,TM[2]);else mb.quad(A,B,C,D,TM[0],0,TM[2]);};
      for(let ia=0;ia<na;ia++)for(let ir=0;ir<nr;ir++){const t0=ia/na,t1=(ia+1)/na,r0=ir/nr,r1=(ir+1)/nr;q(pt(t0,r0,1),pt(t1,r0,1),pt(t1,r1,1),pt(t0,r1,1));}
      for(let ir=0;ir<nr;ir++){const r0=ir/nr,r1=(ir+1)/nr;q(pt(0,r0,0),pt(0,r0,1),pt(0,r1,1),pt(0,r1,0));q(pt(1,r0,1),pt(1,r0,0),pt(1,r1,0),pt(1,r1,1));}
      for(let ia=0;ia<na;ia++){const t0=ia/na,t1=(ia+1)/na;q(pt(t0,1,1),pt(t1,1,1),pt(t1,1,0),pt(t0,1,0));q(pt(t0,0,0),pt(t1,0,0),pt(t1,0,1),pt(t0,0,1));}}
  },24);
  return {rimR,hw,half};
}
/* the Rock & Mud's lettering: the make and the pattern across the top, the size across the bottom, on the wall
   between the rim protector and the raised ring */
function cwTyreText(wheel,half){
  return hdTyrePair(wheel,half,[{t:'REDLINE M/T',a:PI/2,r:.2725,h:.031},{t:'37X12.50R17 LT',a:-PI/2,r:.2745,h:.024},
    {t:'MUD-TERRAIN',a:0,r:.277,h:.017},{t:'MUD-TERRAIN',a:PI,r:.277,h:.017}],TY_INK());}
KIT.setTyres=v=>{HD_TYRES=+v||2;};
