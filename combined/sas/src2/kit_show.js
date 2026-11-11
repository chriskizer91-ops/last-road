
;
/* =====================================================================================
   THE TWO SUVs' SHOWROOM DETAIL (Studio 2, 10 Nov 2026; kit_show). What a buyer walking round the car in a showroom
   would look for and the Studio 2 car didn't have. Built as pieces of their own (KIT.showDetail hands them back:
   body, wheel, wheelL), which only Salt & Sand's Showroom draws: the bay and the road carry and draw what they did.
   - THE TYRES' SMALL PRINT, raised in the rubber like the big lettering: the construction and the load lines, the
     treadwear grades, the DOT code, a band of fine ribs round the bead, the tread wear marks at the shoulder.
   - THE REAR PLATE, embossed: its border and its number (SALT 46 on the Stock, MUD 37 on the Rock & Mud).
   - THE HEATED REAR WINDOW: the element's lines across the glass and the bus bar down each side.
   - LETTERING ON THE TAILGATE AND THE FRONT DOORS, raised chrome, following the panel's own curve.
   ===================================================================================== */
TY_F['&']=[[[4,0],[.7,4.4],[.7,5.3],[1.4,6],[2.2,6],[2.9,5.3],[2.9,4.5],[0,1.7],[0,.9],[.9,0],[2.1,0],[4,2.6]]];
TY_F['^']=[[[0,0],[2,3.6],[4,0],[0,0]]];
/* raised lettering on any surface. map(s, r, lift): the point s metres along and r up, lifted off the surface;
   items: {t, s (the middle of the words), r (their foot), h (their height), k (the stroke's width)}; dir -1 lays
   them the other way round */
function hdTextOn(mb,items,map,m,rise=.0012,dir=1){
  for(const it of items){const u=it.h/6,gap=it.gap||1.25,k=(it.k||it.h*.15)/2;let w=-gap;for(const ch of it.t)w+=(TY_W[ch]||4)+gap;let x=-w/2;
    for(const ch of it.t){const G=TY_F[ch];
      if(G)for(const line of G){
        const P=[];for(let i=0;i<line.length-1;i++){const A=line[i],B=line[i+1],n=Math.max(1,Math.ceil(Math.hypot(B[0]-A[0],B[1]-A[1])/(it.step||1.3)));for(let j=0;j<n;j++)P.push([dir*(x+A[0]+(B[0]-A[0])*j/n)*u,it.r+(A[1]+(B[1]-A[1])*j/n)*u]);}
        {const E=line[line.length-1];P.push([dir*(x+E[0])*u,it.r+E[1]*u]);}
        {const a=P[0],b=P[1],l=Math.hypot(b[0]-a[0],b[1]-a[1])||1;P[0]=[a[0]-(b[0]-a[0])/l*k*.8,a[1]-(b[1]-a[1])/l*k*.8];
          const n=P.length,c=P[n-1],d=P[n-2],l2=Math.hypot(c[0]-d[0],c[1]-d[1])||1;P[n-1]=[c[0]+(c[0]-d[0])/l2*k*.8,c[1]+(c[1]-d[1])/l2*k*.8];}
        const rows=[];
        for(let i=0;i<P.length;i++){const A=P[Math.max(0,i-1)],B=P[Math.min(P.length-1,i+1)];let tx=B[0]-A[0],ty=B[1]-A[1];const tl=Math.hypot(tx,ty)||1;tx/=tl;ty/=tl;
          let ms=1;if(i>0&&i<P.length-1){const ax=P[i][0]-A[0],ay=P[i][1]-A[1],al=Math.hypot(ax,ay)||1;ms=1/Math.max(.55,(ax*tx+ay*ty)/al);}
          const at=(o,lift)=>map(it.s+P[i][0]-ty*o*ms,P[i][1]+tx*o*ms,lift);
          rows.push([at(-k,-.0003),at(-k*.7,rise),at(k*.7,rise),at(k,-.0003)]);}
        for(let i=0;i<rows.length-1;i++){const A=rows[i],B=rows[i+1];for(let j=0;j<3;j++)mb.quad(A[j],A[j+1],B[j+1],B[j],m[0],m[1],m[2]);}
        const c0=rows[0],c1=rows[rows.length-1];mb.quad(c0[0],c0[3],c0[2],c0[1],m[0],m[1],m[2]);mb.quad(c1[0],c1[1],c1[2],c1[3],m[0],m[1],m[2]);}
      x+=(TY_W[ch]||4)+gap;}}
}
/* a band of fine radial ribs raised on a sidewall (prof as hdTyreText's), n round, from r0 to r1 */
function hdTyreRibs(mb,prof,r0,r1,n,m,rise=.0007){
  const zAt=r=>{let i=0;while(i<prof.length-2&&r>prof[i+1][0])i++;const A=prof[i],B=prof[i+1],d=(B[0]-A[0])||1e-9,t=clamp((r-A[0])/d,0,1);return [A[1]+(B[1]-A[1])*t,(B[1]-A[1])/d];};
  const S=(a,r,lift)=>{const q=zAt(r),nl=Math.hypot(q[1],1),rr=r-q[1]/nl*lift,zz=q[0]+lift/nl;return [Math.cos(a)*rr,Math.sin(a)*rr,zz];};
  const da=TAU/n*.3;
  for(let i=0;i<n;i++){const a=i/n*TAU,A=[S(a-da,r0,-.0002),S(a-da*.5,r0,rise),S(a+da*.5,r0,rise),S(a+da,r0,-.0002)],B=[S(a-da,r1,-.0002),S(a-da*.5,r1,rise),S(a+da*.5,r1,rise),S(a+da,r1,-.0002)];
    for(let j=0;j<3;j++)mb.quad(A[j],A[j+1],B[j+1],B[j],m[0],m[1],m[2]);}
}
/* a tyre's small print: the lines on the right-hand wheel and, laid the other way round, on the left-hand copy.
   lines: [the words, the angle of their middle, the foot's radius, the height]; ribs: [r0, r1, n]; marks: the radius
   of the eight tread wear marks */
function hdTyrePrint(prof,lines,ribs,marks){
  const INK=TY_INK(),mk=flip=>{const o=new MB();
    hdPart(o,mb=>{hdTyreText(mb,prof,lines.map(([t,a,r,h])=>({t,a,r,h,k:h*.17})),flip,INK,.0009);
      if(marks)hdTyreText(mb,prof,[28,62,118,152,208,242,298,332].map(d=>({t:'^',a:d*PI/180,r:marks,h:.0055,k:.001})),flip,INK,.0009);},50);
    if(ribs)hdPart(o,mb=>hdTyreRibs(mb,prof,ribs[0],ribs[1],ribs[2],INK),40);
    return o;};
  return {wheel:mk(false),wheelL:mk(true)};}
/* the heated rear window: found on the car as it was built (its glass that faces back, at the tail), a line every
   28 mm across it, stopping 5 cm short of the glass's edge, and a bus bar down each side */
function hdHeatLines(car,out){
  const K=HDK,xT=K.X(K.D.L),tris=[];
  const scan=mbq=>{if(!mbq||!mbq.p)return;const P=mbq.p,N=mbq.n,M=mbq.m;for(let t=0;t<M.length/3;t++){if(M[t*3]!==MAT.GLASS)continue;const o=t*9;
      const cx=(P[o]+P[o+3]+P[o+6])/3;if(cx>xT+.75||Math.abs(N[o])<.45)continue;tris.push([P[o+2],P[o+1],P[o],P[o+5],P[o+4],P[o+3],P[o+8],P[o+7],P[o+6]]);}};
  scan(car.body);for(const k in car.hd||{})scan(car.hd[k]);
  if(tris.length<4)return 0;
  let z0=1e9,z1=-1e9,y0=1e9,y1=-1e9;for(const q of tris)for(let k=0;k<9;k+=3){z0=Math.min(z0,q[k]);z1=Math.max(z1,q[k]);y0=Math.min(y0,q[k+1]);y1=Math.max(y1,q[k+1]);}
  /* the glass's outermost surface behind (z, y): the smallest x of the triangles over that point */
  const hit=(z,y)=>{let best=null;for(const q of tris){const d=(q[4]-q[7])*(q[0]-q[6])+(q[6]-q[3])*(q[1]-q[7]);if(Math.abs(d)<1e-12)continue;
      const a=((q[4]-q[7])*(z-q[6])+(q[6]-q[3])*(y-q[7]))/d,b=((q[7]-q[1])*(z-q[6])+(q[0]-q[6])*(y-q[7]))/d,c=1-a-b;if(a<-1e-4||b<-1e-4||c<-1e-4)continue;
      const x=a*q[2]+b*q[5]+c*q[8];if(best===null||x<best)best=x;}return best;};
  const HT=SV([.19,.1,.05],MAT.COL),dz=.02,mar=3,ends=[];let n=0;
  hdPart(out,mb=>{
    for(let y=y0+.07;y<y1-.05;y+=.028){let run=[];const flush=()=>{if(run.length>mar*2+3){const R=run.slice(mar,run.length-mar);
          for(let i=0;i<R.length-1;i++){const A=R[i],B=R[i+1];mb.quad([A[0]-.0007,y-.0008,A[1]],[B[0]-.0007,y-.0008,B[1]],[B[0]-.0007,y+.0008,B[1]],[A[0]-.0007,y+.0008,A[1]],HT[0],HT[1],HT[2]);n++;}
          ends.push([R[0],y],[R[R.length-1],y]);}run=[];};
      for(let z=z0;z<=z1+1e-6;z+=dz){const x=hit(z,y);if(x===null)flush();else run.push([x,z]);}flush();}
    /* the bus bars: down the lines' ends on each side */
    for(const sgn of [-1,1]){const E=ends.filter(e=>Math.sign(e[0][1])===sgn).sort((a,b)=>a[1]-b[1]);
      for(let i=0;i<E.length-1;i++){const A=E[i],B=E[i+1];if(B[1]-A[1]>.04)continue;
        mb.quad([A[0][0]-.0008,A[1],A[0][1]-.003],[A[0][0]-.0008,A[1],A[0][1]+.003],[B[0][0]-.0008,B[1],B[0][1]+.003],[B[0][0]-.0008,B[1],B[0][1]-.003],HT[0],HT[1],HT[2]);}}
  },30);
  return n;}
/* what the Showroom adds to a car: {body, wheel, wheelL} (part lists), or null for a car that has none */
KIT.showDetail=(key,T)=>{
  if(key!=='stock'&&key!=='crawler')return null;
  const K=HDK,dy=K.dy,Y=y=>y+dy,w=T.b.look.tyre,body=new MB(),stock=key==='stock',CH=MM.CHROME,NAVY=SV([.02,.035,.12],MAT.COL);
  hdHeatLines(T,body);
  /* the rear plate: a raised border and its number (71_tail's plate stands 21 mm back in its recess) */
  {const on=(s,r,l)=>hdS('R',s,r,-.021+l),zh=stock?.155:.16,y0=Y(stock?.878:.875),y1=Y(stock?.952:.955);
    hdPart(body,mb=>{hdTextOn(mb,[{t:stock?'SALT 46':'MUD 37',s:0,r:(y0+y1)/2-.0205,h:.041,k:.006}],on,NAVY,.0011);},40);
    hdPart(body,mb=>{const b=.006,P=[[-zh+b,y0+b],[zh-b,y0+b],[zh-b,y1-b],[-zh+b,y1-b],[-zh+b,y0+b]];
      for(let i=0;i<4;i++){const A=P[i],B=P[i+1],n=Math.ceil(Math.hypot(B[0]-A[0],B[1]-A[1])/.02),hz=A[1]===B[1];
        for(let j=0;j<n;j++){const a=[A[0]+(B[0]-A[0])*j/n,A[1]+(B[1]-A[1])*j/n],c=[A[0]+(B[0]-A[0])*(j+1)/n,A[1]+(B[1]-A[1])*(j+1)/n],o=.0012,q=(p,s2)=>on(p[0]+(hz?0:s2*o),p[1]+(hz?s2*o:0),.0008);
          mb.quad(q(a,-1),q(c,-1),q(c,1),q(a,1),NAVY[0],NAVY[1],NAVY[2]);}}},20);}
  /* the lettering (placed by KIT_SHOW_AT, below: the tailgate's, then each front door's) */
  const A=KIT_SHOW_AT[key];
  if(A.tail)hdPart(body,mb=>{for(const it of A.tail)hdTextOn(mb,[{t:it[0],s:it[1],r:Y(it[2]),h:it[3],k:it[3]*.17,gap:it[4]||1.25}],(s,r,l)=>hdS('R',s,r,.0004+l),CH,.0016);},45);
  /* (a side reads from the tail to the nose on the car's right, from the nose to the tail on its left) */
  if(A.side)for(const sd of [1,-1])hdPart(body,mb=>{for(const it of A.side)hdTextOn(mb,[{t:it[0],s:0,r:K.D.cladY(it[1])+it[2],h:it[3],k:it[3]*.17}],(s,r,l)=>hdSS(sd,it[1]-sd*s,r,.0004+l),CH,.0014);},45);
  /* the tyres' small print */
  let tp;
  if(stock){const rimR=w.rim*.0254/2,prof=[[rimR+.072,.118],[.3005,.1212],[.318,.1222]],h=.0052,ra=.3032,rb=.2946;
    tp=hdTyrePrint(prof,[['TREAD 2 POLYESTER 2 STEEL 1 NYLON',PI/4,ra,h],['SIDEWALL 2 POLYESTER',PI/4,rb,h],['MAX LOAD 1090 KG 2403 LBS',3*PI/4,ra,h],['MAX PRESS 350 KPA 51 PSI',3*PI/4,rb,h],
      ['TREADWEAR 540 TRACTION A',-3*PI/4,ra,h],['TEMPERATURE A',-3*PI/4,rb,h],['DOT RC4X 2K7R 4426',-PI/4,ra,h],['TUBELESS RADIAL',-PI/4,rb,h]],[.2892,.2916,360],.3118);}
  else{const half=cwMudTyre3(new MB(),w).half,h=.0066,ra=.3165,rb=.3072;
    tp=hdTyrePrint(half,[['TREAD 3 POLYESTER 2 STEEL 2 NYLON',PI/4,ra,h],['SIDEWALL 3 POLYESTER',PI/4,rb,h],['MAX LOAD 1600 KG 3525 LBS',3*PI/4,ra,h],['MAX PRESS 450 KPA 65 PSI',3*PI/4,rb,h],
      ['LOAD RANGE D  M-S',-3*PI/4,ra,h],['TUBELESS RADIAL',-3*PI/4,rb,h],['DOT RC37 M7T4 4426',-PI/4,ra,h],['FOR OFF ROAD AND HIGHWAY USE',-PI/4,rb,h]],[.2678,.2712,420],.3228);}
  return {body,wheel:tp.wheel,wheelL:tp.wheelL};};
/* where the lettering goes. tail: [the words, z of their middle, the foot's height, the letters' height, spacing];
   side: [the words, the station of their middle (metres from the nose), the foot's height above the cladding's top
   edge there, the letters' height] */
const KIT_SHOW_AT={stock:{tail:[['REDLINE',-.365,.888,.027],['4.6 V8',.365,.888,.027]],side:[['4X4',1.76,.05,.03]]},
  crawler:{tail:[['REDLINE',-.365,.888,.027],['ROCK & MUD',.365,.89,.021]],side:[['ROCK & MUD',1.8,.06,.032]]}};
