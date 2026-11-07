/* =====================================================================================
   GROUND TRUTH: THE WORLD (put inside the engine's WORLDGEN by src/lr_patch.py, just before its core(), so the
   background worker that makes the land has it too: it may use only WORLDGEN's own helpers).
   Fable's brainstorm map (design/fable-brainstorm-2026-11-07.md: 48 km square, x east 0..48, y north 0..48) laid
   over the engine's 40-mile world, 1.34 times bigger: brainstorm km (bx, by) -> world metres X = (bx-24)*GT_S,
   Z = (24-by)*GT_S (x runs east, z south). Seven regions, their edges wandering a couple of kilometres:
     the Savanna (the south and centre, the default), the Salt Pans (south-west), the Dune Sea (west), the Highlands
     (north centre: a 600 m escarpment, one pass), the Canyons (east: mesas cut by canyons and slots), the Delta and
     the Lake (north-east, low and wet), the Black Range (north-west: cinder cones, lava, the caldera).
   Last Road, the one paved road, from the south edge to Roadhead and on to the End; the twelve strips, flattened.
   Everything is a function of where you are (nothing stored for the whole map), like the rest of the generator.
   ===================================================================================== */
const GT_S=HALF*.955/24;
const GX=bx=>(bx-24)*GT_S,GZ=by=>(24-by)*GT_S;
const GT_REG=[ /* name, brainstorm box [x0,y0,x1,y1] in km */
  ['pans','The Salt Pans',0,0,16,14],['dune','The Dune Sea',0,14,18,40],['high','The Highlands',14,30,36,48],
  ['cany','The Canyons',34,14,48,40],['delta','The Delta',36,38,48,48],['black','The Black Range',0,40,14,48]];
/* the strips: name, brainstorm x, y, heading (degrees from east, toward north), length (m), surface */
const GT_STRIPS=[
  ['Roadhead',32.6,7.9,0,1000,'paved'],['Kettle Creek Station',20,11,35,900,'grass'],['Pan Strip',9,7,10,1200,'salt'],
  ['Three Wells',17,22,-8,500,'sand'],['Rim Strip',40,22,70,600,'gravel'],['The Bar',42,32,90,450,'gravel'],
  ['Switchback',26,31,0,550,'dirt'],['Terrace Strip',28,37,15,800,'dirt'],['Delta Strip',43,42,40,700,'dirt'],
  ['Caldera',6.2,44,30,500,'cinder'],['Old Survey Strip',12,30,-20,400,'sand'],['Last Well',4,38,5,650,'sand']]
  .map(([name,bx,by,hd,len,surf])=>{const a=hd*Math.PI/180;return {name,x:GX(bx),z:GZ(by),dx:Math.cos(a),dz:-Math.sin(a),len,surf,hw:15,h:null};});
/* named places for the HUD (within a radius, metres) */
const GT_NAMES=[['Roadhead',32.4,7.4,900],['The End',34,7,250],['Kettle Creek Station',20,11,700],['The Cistern',24,13,300],
  ['The Bottle Tree',27,16,250],['The Marbles',29,20,1200],['Three Wells',17,22,500],['The Sunken City',8,27,1500],['Big Daddy',9,24,2500],
  ['Last Well',4,38,500],['The Caldera',7,44,2600],['The Switchback',26,30.5,1500],['The Terraces',28,37.5,700],['The Gorge',41,33,1800],
  ['The Arches',40,18,1500],['The Lake',44.5,45,3000],['The Delta',42,42,2500],['The Pan',8,6,6000]]
  .map(([n,bx,by,r])=>({n,x:GX(bx),z:GZ(by),r}));

/* the Causeway's line (brainstorm km 17.5,13.6 to 30.6,28.6) */
const GT_CAUSE=(()=>{const ax=GX(17.5),az=GZ(13.6),bx=GX(30.6),bz=GZ(28.6),len=Math.hypot(bx-ax,bz-az);return {ax,az,bx,bz,len,dx:(bx-ax)/len,dz:(bz-az)/len};})();
/* ---------- Last Road: a smooth line from the south edge to Roadhead, then 2 km east to the End ---------- */
const GT_ROAD=(()=>{
  const K=[[22,-1.2],[22.3,1.2],[23.6,2.9],[25.8,4.2],[28.4,5.5],[30.6,6.5],[32,6.95],[34.05,7.05]].map(([a,b])=>[GX(a),GZ(b)]);
  /* Catmull-Rom through the points, a point every 20 m */
  const P=[];for(let i=0;i<K.length-1;i++){const p0=K[Math.max(0,i-1)],p1=K[i],p2=K[i+1],p3=K[Math.min(K.length-1,i+2)],n=Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/20);
    for(let k=0;k<n;k++){const t=k/n,t2=t*t,t3=t2*t,f=(a,b,c,d)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);P.push([f(p0[0],p1[0],p2[0],p3[0]),f(p0[1],p1[1],p2[1],p3[1])]);}}
  P.push(K[K.length-1]);
  const S=[0];for(let i=1;i<P.length;i++)S.push(S[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]));
  /* a grid of 256 m cells: the segments in or near each */
  const G=new Map(),C=256,key=(i,j)=>i*100003+j;
  for(let i=0;i<P.length-1;i++){const x0=Math.min(P[i][0],P[i+1][0])-40,x1=Math.max(P[i][0],P[i+1][0])+40,z0=Math.min(P[i][1],P[i+1][1])-40,z1=Math.max(P[i][1],P[i+1][1])+40;
    for(let a=Math.floor(x0/C);a<=Math.floor(x1/C);a++)for(let b=Math.floor(z0/C);b<=Math.floor(z1/C);b++){const k=key(a,b);if(!G.has(k))G.set(k,[]);G.get(k).push(i);}}
  return {P,S,G,C,key,len:S[S.length-1],hw:3.7,sh:1.2,H:null};
})();
/* the nearest point of Last Road (within 40 m): distance across (signed), distance along, unit direction */
function gtRoadQ(x,z,o){o.d=1e9;const R=GT_ROAD,L=R.G.get(R.key(Math.floor(x/R.C),Math.floor(z/R.C)));if(!L)return o;
  for(const i of L){const a=R.P[i],b=R.P[i+1],ex=b[0]-a[0],ez=b[1]-a[1],l2=ex*ex+ez*ez;let t=((x-a[0])*ex+(z-a[1])*ez)/l2;t=t<0?0:t>1?1:t;
    const px=a[0]+ex*t,pz=a[1]+ez*t,d=Math.hypot(x-px,z-pz);if(d<Math.abs(o.d)){const l=Math.sqrt(l2);o.d=((x-a[0])*ez-(z-a[1])*ex)/l>0?d:-d;o.s=R.S[i]+t*l;o.dx=ex/l;o.dz=ez/l;o.i=i;o.t=t;}}
  return o;}

/* ---------- what's placed in the world: his models (tools/props_pack.py, drawn by src/lr-game.js), and the ground
   levelled under them. Each: model, object in it, world x, z, the way its front faces (yaw: its +z turned to
   (sin yaw, cos yaw)), whether it stops you (a box round it), and how far off it's still drawn ---------- */
const GT_PADS=[],GT_PROPS=[];
{const put=(id,obj,x,z,yaw,solid,far)=>GT_PROPS.push({id,obj,x,z,yaw,solid:solid!==false,far:far||1500});
  /* (a frame: u along a strip or the road, v across it, to the right) */
  const frame=(x,z,dx,dz)=>({at:(u,v)=>[x+dx*u-dz*v,z+dz*u+dx*v],face:(fu,fv)=>Math.atan2(dx*fu-dz*fv,dz*fu+dx*fv),x,z,dx,dz});
  const pad=(F,u0,u1,v0,v1,surf,h)=>GT_PADS.push({F,u0,u1,v0,v1,surf,h});
  /* Roadhead: the runway, and south of it the apron, the hangar and Outfitter, the fuel, the tower and the mast */
  {const S=GT_STRIPS[0],F=frame(S.x,S.z,S.dx,S.dz);pad(F,-450,-50,20,150,'gravel',()=>gtStripH(S));
    const N=F.face(0,-1);put('B02','model',...F.at(-235,64),N,false);put('B06','model',...F.at(-178,42),N);put('B10','model',...F.at(-318,112),N);
    put('B11','model',...F.at(-392,74),N);put('B07','windsock',...F.at(-90,26),F.face(1,0),true,900);
    for(let u=-500;u<=500;u+=100)for(const v of [-17,17])put('B07',(u/100+(v>0?1:0))%2?'drum_orange':'drum_white',...F.at(u,v),F.face(0,1),true,700);
    for(const u of [-506,506])for(const v of [-9,9])put('B07','tire',...F.at(u,v),F.face(1,0),false,600);}
  /* beside Last Road at Roadhead: the roadhouse, two houses (on the north side, facing the road) */
  {const R=GT_ROAD,o={};const on=s=>{let i=0;while(i<R.S.length-2&&R.S[i+1]<s)i++;const a=R.P[i],b=R.P[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);return frame(a[0],a[1],(b[0]-a[0])/l,(b[1]-a[1])/l);};
    for(const [id,s,v] of [['B08',R.len-2050,-30],['B12',R.len-2210,-32],['B14',R.len-1890,-30]]){const F=on(s),q=F.at(0,v);put(id,'model',q[0],q[1],F.face(0,1));
      pad(frame(q[0],q[1],F.dx,F.dz),-18,18,-16,22,'dirt',null);}}
  /* Kettle Creek Station, beside its strip: the homestead, the windmill and tank, the workshop, the yards */
  {const S=GT_STRIPS[1],F=frame(S.x,S.z,S.dx,S.dz);pad(F,-470,-60,30,300,'dirt',()=>gtStripH(S));
    put('B16','model',...F.at(-300,150),F.face(0,-1));put('B17','model',...F.at(-170,250),F.face(0,-1));put('B18','model',...F.at(-410,70),F.face(0,-1));
    put('B19','model',...F.at(-140,140),F.face(1,0));put('B07','windsock',...F.at(0,28),F.face(1,0),true,900);}
  /* Last Well: Ruben's shack beside his strip, the far outstation; a windsock */
  {const S=GT_STRIPS[11],F=frame(S.x,S.z,S.dx,S.dz);pad(F,-110,-10,30,95,'sand',()=>gtStripH(S));
    put('D16','model',...F.at(-60,62),F.face(0,-1),true,4000);put('B07','windsock',...F.at(40,26),F.face(1,0),true,900);}
}
/* the walk places and landmarks (Fable's map, brainstorm km), each on a small levelled pad where it needs one */
{const put=(id,obj,x,z,yaw,solid,far)=>GT_PROPS.push({id,obj,x,z,yaw,solid:solid!==false,far:far||3000});
  const site=(id,obj,bx,by,yaw,r,surf,far,solid,dy)=>{const x=GX(bx),z=GZ(by);put(id,obj,x,z,yaw,solid,far);if(dy)GT_PROPS[GT_PROPS.length-1].dy=dy;
    if(r)GT_PADS.push({F:{x,z,dx:1,dz:0},u0:-r,u1:r,v0:-r,v1:r,surf:surf||'dirt',h:null});};
  /* the Savanna: the Cistern and its marker stone, the Causeway Gate and the Map Stone in it, the Bottle Tree, the
     Marbles, the Windmill Line (a bore every 3 km from the station north-east) */
  site('C04','model',24,13,.4,18);site('C03','model',24.03,13.04,.4,0,null,900);
  site('C14','model',24,21,.79,20);site('C16','model',24.003,21.004,.79,0,null,900);
  site('D02','model',27,16,1.1,22,'dirt',9000);site('D03','model',29,20,2.2,0,null,7000);
  for(let k=1;k<=5;k++){const t=k/6;site('D04','model',20+(31-20)*t+.3*Math.sin(k*2.1),11+(21-11)*t,k*.9,9,'dirt',2500);}
  /* the Salt Pans: the Pan Wreck */
  site('D05','model',6,5,2.6,0,null,2500);
  /* the Dune Sea: Three Wells, the Caravan's cairns west from it to the Sunken City, the City's hall and tower */
  site('C07','model',17.1,22.55,-.3,20,'sand',0,true,-1.2);
  for(let k=1;k<=14;k++){const t=k/15;site('D07','model',17.1+(8.4-17.1)*t+.15*Math.sin(k*1.7),22.55+(26.6-22.55)*t,k*1.3,0,null,1800);}
  site('C26','model',8,27,.2,26,'sand',0,true,-2.4);site('C28','model',8.03,27.03,3.3,0,null,1200,true,-.6);
  /* the Highlands: the Terraces temple and its seated figure, the Weir at the top of the escarpment */
  site('C21','model',28.6,37.8,3.1,22);site('C28','model',28.62,37.77,3.1,0,null,1200);site('C32','model',34.5,31.2,1.6,28);
  /* the Black Range: the Observatory Cone's stone ring */
  site('C35','model',10,45.2,0,16);
  /* the Canyons: the three Arches (big enough to fly under), the Congregation (a field of hoodoos) */
  site('D10','arch_wide',40,18,.5,75,'dirt',12000);site('D10','arch_round',41.3,19.6,1.2,60,'dirt',12000);site('D10','arch_broken',38.8,20.3,-.4,45,'dirt',9000);
  {const H=['spire_capped','mushroom','hourglass','twin_spires','stump','stepped_tower'];
    for(let k=0;k<40;k++){const a=hs(k,3,811)*6.283,r=.06+.5*Math.sqrt(hs(k,4,812));site('D12',H[(hs(k,5,813)*6)|0],38+Math.cos(a)*r,28+Math.sin(a)*r,hs(k,6,814)*6.283,0,null,4500);}}
  /* the Towers either side of the Switchback, standing in the escarpment's face */
  site('D13','tower_tall',24.7,30.55,.3,0,null,14000,true,-14);site('D13','tower_short',27.35,30.4,2.1,0,null,14000,true,-12);
  /* the Delta: Meridian's drill rig and camp, on a levee beyond the Delta Strip */
  site('D14','model',43.7,42.8,.7,85,'gravel',9000);}
/* a pad's level: its own (the strip's), else the land's at its middle (made once) */
function gtPadH(P){if(P.hv===undefined){if(P.h)P.hv=P.h();else{const o={};P.hv=gtLand(P.F.x,P.F.z,o).h;gtRoadQ(P.F.x,P.F.z,GRQ);if(Math.abs(GRQ.d)<60)P.hv=gtRoadH(GRQ.s);}}return P.hv;}

/* ---------- the regions: how much of each is here (their edges warped by slow noise) ---------- */
const GR={};
function gtRegions(x,z,o){
  /* (two warps: a slow one that bends whole edges by a few kilometres, a quicker one that frays them) */
  const wx=(fbm(x/14000+1.3,z/14000-2.1,2,701)-.5)*9000+(fbm(x/3500-7.7,z/3500+.4,2,703)-.5)*2600,
        wz=(fbm(x/14000-4.2,z/14000+3.3,2,702)-.5)*9000+(fbm(x/3500+2.9,z/3500-5.5,2,704)-.5)*2600;
  const bx=(x+wx)/GT_S+24,by=24-(z+wz)/GT_S;o.bx=(x/GT_S)+24;o.by=24-z/GT_S;
  let tot=0;
  /* each a box with rounded corners (3 km), a map edge it touches pushed out past the edge */
  for(const r of GT_REG){const rc=3,x0=r[2]<=0?-20:r[2]+rc,y0=r[3]<=0?-20:r[3]+rc,x1=r[4]>=48?68:r[4]-rc,y1=r[5]>=48?68:r[5]-rc;
    const dx=Math.max(x0-bx,bx-x1),dy=Math.max(y0-by,by-y1);
    const sd=(dx>0||dy>0?Math.hypot(Math.max(dx,0),Math.max(dy,0)):Math.max(dx,dy))-rc;o['d_'+r[0]]=sd;
    const w=1-sst(-.9,.9,sd);o[r[0]]=w;tot+=w;}
  /* overlapping boxes share; whatever isn't one of them is savanna */
  const k=tot>1?1/tot:1;for(const r of GT_REG)o[r[0]]*=k;o.sav=Math.max(0,1-tot*k);
  return o;}

/* ---------- features ---------- */
/* a granite kopje (boulder hill) in some 2.6 km cells: its height and how rocky */
function gtKopje(x,z,o){o.kh=0;o.kr=0;const C=2600,ci=Math.floor(x/C),cj=Math.floor(z/C);
  for(let a=ci-1;a<=ci+1;a++)for(let b=cj-1;b<=cj+1;b++){if(hs(a,b,741)>.34)continue;
    const cx=(a+.2+.6*hs(a,b,742))*C,cz=(b+.2+.6*hs(a,b,743))*C,r=150+260*hs(a,b,744),H=22+55*hs(a,b,745),d=Math.hypot(x-cx,z-cz)/r;
    if(d>=1.25)continue;const t=Math.min(d,1),lump=(vn(x/16+a,z/16+b,746)-.5)*6*(1-t)+(vn(x/45,z/45,747)-.5)*8*(1-t);
    const h=H*Math.pow(1-t*t,1.4)*(d<1?1:0)+lump*(d<1.1?1:0);if(h>o.kh){o.kh=h;o.kr=sst(.15,.85,1-d);}}
  return o;}
/* a cinder cone in some 3 km cells (the Black Range): its height */
function gtCone(x,z){let hh=0;const C=3000,ci=Math.floor(x/C),cj=Math.floor(z/C);
  for(let a=ci-1;a<=ci+1;a++)for(let b=cj-1;b<=cj+1;b++){if(hs(a,b,751)>.55)continue;
    const cx=(a+.2+.6*hs(a,b,752))*C,cz=(b+.2+.6*hs(a,b,753))*C,r=480+600*hs(a,b,754),H=90+170*hs(a,b,755),d=Math.hypot(x-cx,z-cz)/r;if(d>=1)continue;
    let h=H*Math.pow(1-d,1.25);if(d<.16)h-=H*.22*(1-d/.16)*(1-d/.16);if(h>hh)hh=h;}
  return hh;}
/* the dunes: ridges running north and south, the long slope on the west, the slip face east; bigger deep in */
function gtDune(x,z,deep){
  const lam=420+380*sst(0,6,deep),wx=(fbm(x/1800+3.1,z/1800-1.7,2,761)-.5)*lam*1.1+Math.sin(z/(lam*.7)+fbm(x/900,z/900,1,762)*3)*lam*.12;
  const u=(x+wx)/lam,n=Math.floor(u),f=u-n,big=vn(z/(lam*2.2)+n*.71,n*1.37,763),along=vn(z/(lam*.6)+n*5.1,n*.3+7,764);
  const A=(9+70*sst(0,4,deep)+90*sst(3,9,deep))*(.25+.75*sst(.15,.75,big))*(.55+.45*along);
  const c=.8;let p;if(f<c){const t=f/c;p=t*t*(3-2*t);}else{const t=(f-c)/(1-c);p=1-t*t*(3-2*t);}
  return A*p+(vn(x/30+u*.3,z/30,765)-.5)*.6*(.3+p);}
/* the big things you find your way by */
const GT_BIG={daddy:[GX(9),GZ(24),3600,250],cald:[GX(7),GZ(44),2300,300],lake:[GX(44.5),GZ(45),2900]};

/* ---------- one point of the land, without the road and strips (they're graded on after) ---------- */
const GL={},GK={};
function gtLand(x,z,o){
  const R=gtRegions(x,z,GR);
  /* the ground's own gentle roll everywhere */
  let h=(fbm(x/3200+1.1,z/3200+2.3,3,711)-.5)*34+(fbm(x/650-3.3,z/650+5.1,2,712)-.5)*8+(vn(x/80,z/80,713)-.5)*1.1;
  let grass=sst(.3,.62,fbm(x/40+5,z/40,2,714)+.14),rock=0,sand=0,salt=0,mud=0,wet=0,wl=-1e9,code=0,gravel=0;
  /* the savanna: kopjes and creek lines */
  if(R.sav>.02||R.delta>.02){gtKopje(x,z,GK);const kk=R.sav;h+=GK.kh*kk;rock=Math.max(rock,GK.kr*kk*.85);
    const c=fbm(x/2400+7,z/2400-3,3,721),w=.011,cd=Math.abs(c-.5);
    if(cd<w*1.8){const f=1-sst(w*.5,w*1.8,cd);h-=2.4*f*(R.sav+R.delta);if(f>.55){grass*=.3;sand=Math.max(sand,.0);gravel=f;}
      if(cd<w*.45&&R.delta>.3){wet=1;wl=h+1.4;}}}
  /* the salt pans: dead flat, white */
  if(R.pans>0){const ph=-1.2+(vn(x/900,z/900,722)-.5)*.3;h=h+(ph-h)*sst(0,.8,R.pans);salt=Math.max(salt,sst(.2,.9,R.pans));}
  /* the Dune Sea */
  if(R.dune>0){const deep=Math.max(0,-R.d_dune);let dh=gtDune(x,z,deep);
    const B=GT_BIG.daddy,db=Math.hypot(x-B[0],z-B[1])/B[2];if(db<1){const arm=Math.pow(Math.abs(Math.cos(Math.atan2(z-B[1],x-B[0])*2.5+vn(x/700,z/700,766)*2)),3);
      dh+=B[3]*Math.pow(1-db,1.6)*(.65+.35*arm);}
    h=h*(1-R.dune*.7)+dh*sst(0,.7,R.dune);sand=Math.max(sand,sst(.1,.75,R.dune));}
  /* the Highlands: a 600 m wall, the cold tableland on top; the pass (the Switchback) a long ramp */
  {const d=R.d_high;if(d<2.5){const pass=(1-sst(.5,1.5,Math.abs(R.bx-26)))*(1-sst(32,34.5,R.by)),f=sst(.4,-.08,d)*(1-pass)+sst(2.4,-3.2,d)*pass;
    const tab=600+(fbm(x/1500+2,z/1500-6,2,771)-.5)*90;h+=tab*f+.1*tab*sst(1.8,.35,d)*(1-pass);if(f>.9)grass=Math.max(grass,.75);}}
  /* the Canyons: a plateau cut by canyons and slots, its walls in steps */
  if(R.cany>0){const P=150*sst(0,.9,R.cany),r1=Math.abs(fbm(x/2600+3,z/2600+9,3,731)-.5),r2=Math.abs(fbm(x/900-5,z/900+1,2,732)-.5);
    let c=P*Math.min(sst(.02,.055,r1),.35+.65*sst(.014,.038,r2));const st=14,q=Math.floor(c/st)*st,fr=(c-q)/st;c=q+st*sst(.55,.9,fr)*.85+(c-q)*.15;
    h+=c;rock=Math.max(rock,.3*R.cany);grass*=1-.75*R.cany;
    if(r1<.012&&R.cany>.6&&R.by>27){wet=1;wl=h+1.2;h-=1.5;}}
  /* the Delta and the Lake: low ground, reed channels, open water */
  if(R.delta>0){const lo=-2.5+(fbm(x/700,z/700,781)-.5)*2;h=h+(lo-h)*sst(0,.8,R.delta);
    const ch=Math.abs(fbm(x/1300+8,z/1300-2,3,782)-.5);if(ch<.03&&R.delta>.5){wet=1;wl=-1.1;h=Math.min(h,-2.2);}
    const L=GT_BIG.lake,dl=Math.hypot(x-L[0],z-L[1])/L[2]+(vn(x/800,z/800,783)-.5)*.25;if(dl<1){h=Math.min(h,-1.2-6*sst(1,.4,dl));wet=1;wl=-1.1;}
    mud=Math.max(mud,.55*R.delta*sst(.4,.7,vn(x/60,z/60,784)));grass=Math.max(grass,.6*R.delta);}
  /* the Black Range: cinder cones, lava fields, the caldera */
  if(R.black>0){const k=sst(0,.8,R.black);h+=(60+gtCone(x,z))*k;const lava=sst(.5,.58,fbm(x/2000+4,z/2000+1,2,791));
    if(lava>0){h+=(vn(x/24,z/24,792)-.5)*2.2*lava*k;rock=Math.max(rock,lava*k);}rock=Math.max(rock,.45*k);grass*=1-.85*k;
    const C=GT_BIG.cald,dc=Math.hypot(x-C[0],z-C[1])/C[2];if(dc<1.6){const ring=C[3]*Math.exp(-Math.pow((dc-1)/.22,2)),floor=dc<1?-C[3]*.2*sst(1,.6,dc):0;h+=ring+floor;
      /* (the crater lake in its east half; the strip on the west of the floor) */
      if(Math.hypot(x-C[0]-.33*C[2],z-C[1])/C[2]<.3){wet=1;wl=60;}}}
  o.h=h;o.grass=grass*(1-sand)*(1-salt);o.rock=rock;o.sand=sand*(1-salt);o.salt=salt;o.mud=mud;o.wet=wet;o.wl=wl;o.gravel=gravel;o.R=R;return o;}

/* ---------- Last Road's height: the land's own, smoothed along the road (made once, the first time it's asked) ---------- */
function gtRoadH(s){const R=GT_ROAD;if(!R.H){const n=R.P.length,raw=new Float64Array(n),o={};for(let i=0;i<n;i++)raw[i]=gtLand(R.P[i][0],R.P[i][1],o).h;
    R.H=new Float64Array(n);const w=20;for(let i=0;i<n;i++){let a=0,c=0;for(let k=-w;k<=w;k++){const j=Math.min(n-1,Math.max(0,i+k));a+=raw[j];c++;}R.H[i]=a/c;}}
  let lo=0,hi=R.S.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(R.S[m]<=s)lo=m;else hi=m;}const t=(s-R.S[lo])/Math.max(1e-6,R.S[hi]-R.S[lo]);return R.H[lo]+(R.H[hi]-R.H[lo])*t;}
/* a strip's height: the land's at its middle (made once) */
function gtStripH(S){if(S.h===null){const o={};S.h=gtLand(S.x,S.z,o).h;if(S.surf==='salt')S.h=Math.max(S.h,-1.15);}return S.h;}
function gtStripQ(x,z){for(const S of GT_STRIPS){const ax=(x-S.x)*S.dx+(z-S.z)*S.dz,ac=-(x-S.x)*S.dz+(z-S.z)*S.dx,e=Math.max(Math.abs(ax)-S.len/2-40,Math.abs(ac)-S.hw-10);if(e<60)return {S,e,ax,ac};}return null;}

/* ---------- THE POINT (core): the land, then the road and the strips graded onto it, and what's underfoot ---------- */
const GRQ={};
function gtCore(x,z,o){
  gtLand(x,z,GL);let h=GL.h,grass=GL.grass,rock=GL.rock,sand=GL.sand,salt=GL.salt,mud=GL.mud,wet=GL.wet,wl=GL.wl;
  let code=mud>.5?SF.mud:salt>.5?SF.strip:sand>.5?SF.sand:rock>.55?SF.rock:grass>.5?SF.grass:GL.gravel>.6?SF.gravel:SF.dirt;
  /* Last Road */
  gtRoadQ(x,z,GRQ);const R=GT_ROAD;
  if(Math.abs(GRQ.d)<40){const ad=Math.abs(GRQ.d),e=R.hw+R.sh,rh=gtRoadH(GRQ.s),corr=1-sst(e+1,e+22,ad);h=h+(rh-h)*corr;
    if(ad<e+1.5){wet=0;mud=0;}if(ad<R.hw){code=SF.asphalt;grass=0;rock=0;sand=0;salt=0;}else if(ad<e){code=SF.gravel;grass*=.3;rock=0;sand*=.3;}else if(ad<e+3){grass*=.6;}}
  /* the Causeway: the Old Hands' raised stone road, dead straight 30 km across the savanna from the dune's edge to
     the escarpment's foot (through the Gate), 9 m across, a metre and a half up, edged with stone */
  {const C=GT_CAUSE,ux=x-C.ax,uz=z-C.az,t=(ux*C.dx+uz*C.dz)/C.len;if(t>-.01&&t<1.01){const d=Math.abs(ux*C.dz-uz*C.dx);if(d<14){
    const e=Math.max(0,t<0?-t*C.len:t>1?(t-1)*C.len:0),top=1-sst(4.3,6.8,d+e*2),wear=.75+.25*vn(x/23,z/23,799);h+=1.45*top*wear;
    if(top>.5){code=SF.gravel;rock=Math.max(rock,.75*top);grass*=1-.85*top;sand*=.3;mud=0;wet=0;}else if(d<9)grass*=.7;}}}
  /* the strips: flat, and their own ground */
  const Q=gtStripQ(x,z);if(Q){const S=Q.S,sh=gtStripH(S),f=1-sst(0,55,Q.e);h=h+(sh-h)*f;if(f>.3){wet=0;mud*=1-f;}
    if(Q.e<0){const in2=Math.abs(Q.ac)<S.hw;
      if(S.surf==='paved'&&in2)code=SF.concrete;else if(S.surf==='salt')code=SF.strip;else if(S.surf==='sand')code=SF.sand;else if(S.surf==='gravel'||S.surf==='cinder')code=SF.gravel;else if(S.surf==='grass')code=SF.grass;else code=SF.dirt;
      if(in2&&S.surf!=='grass'&&S.surf!=='salt'&&S.surf!=='sand'){grass*=.15;rock=0;}if(S.surf==='grass'&&in2)grass=Math.max(grass,.8);}}
  /* the pads under the buildings: level, bare */
  for(const P of GT_PADS){const F=P.F,u=(x-F.x)*F.dx+(z-F.z)*F.dz,v=-(x-F.x)*F.dz+(z-F.z)*F.dx,e=Math.max(P.u0-u,u-P.u1,P.v0-v,v-P.v1);if(e>45)continue;
    const f=1-sst(0,40,e);h=h+(gtPadH(P)-h)*f;if(f>.3){wet=0;mud=0;}
    /* (the bare ground fades in over a few metres, its edge wandering, so it isn't a drawn square) */
    const eb=e+(vn(x/11,z/11,797)-.5)*14,bare=1-sst(-10,2,eb);
    if(bare>0){if(P.surf==='sand'){if(bare>.5)code=SF.sand;}else{if(bare>.5)code=P.surf==='gravel'?SF.gravel:SF.dirt;grass*=1-.75*bare;rock*=1-bare;sand*=1-.7*bare;}}}
  h+=rimAt(x,z);
  if(wet&&h<wl){code=SF.water;}else wet=0;
  o.h=h;o.code=code;o.grass=grass;o.rock=rock;o.mud=Math.max(mud,wet?.8:0);o.salt=salt;o.sand=sand;o.ramp=0;o.wet=wet;o.wl=wet?wl:h;o.B=h;o.rk=rock;o.k=0;o.tm=0;o.tin=0;
  return o;}
/* the road base (for ribbons laid over the land) */
function gtBase(x,z){gtRoadQ(x,z,GRQ);if(Math.abs(GRQ.d)<40)return gtRoadH(GRQ.s)+rimAt(x,z);const o={};return gtCore(x,z,o).h;}

/* ---------- a chunk's own things: Last Road's surface, the paved runway, the savanna's trees ---------- */
function gtStatic(x0,z0,x1,z1,RB,inC,cols,trees,R){
  const RD=GT_ROAD,c=CL[3],ST=4,lift=.035,D=[-c.draw,0,c.draw];
  /* the road: 4 m pieces, each drawn by the chunk its middle is in */
  const L=new Set();for(let a=Math.floor((x0-40)/RD.C);a<=Math.floor((x1+40)/RD.C);a++)for(let b=Math.floor((z0-40)/RD.C);b<=Math.floor((z1+40)/RD.C);b++){const q=RD.G.get(RD.key(a,b));if(q)for(const i of q)L.add(i);}
  if(L.size){const i0=Math.max(0,Math.min(...L)-1),i1=Math.min(RD.P.length-2,Math.max(...L)+1),s0=RD.S[i0],s1=RD.S[i1+1];
    const at=s=>{let lo=0,hi=RD.S.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(RD.S[m]<=s)lo=m;else hi=m;}const t=(s-RD.S[lo])/Math.max(1e-6,RD.S[hi]-RD.S[lo]),a=RD.P[lo],b=RD.P[hi],l=Math.hypot(b[0]-a[0],b[1]-a[1])||1;
      return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,(b[1]-a[1])/l,-(b[0]-a[0])/l];};
    for(let s=Math.floor(s0/ST)*ST;s<s1;s+=ST){const sm=at(s+ST/2);if(!inC(sm[0],sm[1]))continue;const A=at(s),B=at(Math.min(s+ST,RD.len));
      const row=(P,ss)=>D.map(d=>{const x=P[0]+P[2]*d,z=P[1]+P[3]*d,y=gtRoadH(ss)+rimAt(x,z)+lift;return RB.v(x,y,z,0,1,0,ss%1200,d,3,c.hw,MAT.ROAD);});
      const ra=row(A,s),rb=row(B,Math.min(s+ST,RD.len));for(let k=0;k<D.length-1;k++)RB.I.push(ra[k],rb[k],rb[k+1],ra[k],rb[k+1],ra[k+1]);
      for(const sg of [-1,1]){const q=(P,ss,d)=>{const x=P[0]+P[2]*d,z=P[1]+P[3]*d;return RB.v(x,gtRoadH(ss)+rimAt(x,z)+lift*.6,z,0,1,0,0,0,1,c.hw,MAT.GRAVEL);};
        const e0=c.hw*sg,e1=(c.hw+c.sh)*sg,a0=q(A,s,e0),a1=q(A,s,e1),b0=q(B,s+ST,e0),b1=q(B,s+ST,e1);RB.I.push(a0,b0,b1,a0,b1,a1);}}}
  /* the paved runway at Roadhead: concrete laid over its flat ground, in 4 m squares */
  for(const S of GT_STRIPS){if(S.surf!=='paved')continue;const hl=S.len/2,hw=S.hw-3;
    const cs=[[-hl,-hw],[hl,-hw],[hl,hw],[-hl,hw]].map(([a,b])=>[S.x+S.dx*a-S.dz*b,S.z+S.dz*a+S.dx*b]);
    if(Math.max(...cs.map(p=>p[0]))<x0||Math.min(...cs.map(p=>p[0]))>x1||Math.max(...cs.map(p=>p[1]))<z0||Math.min(...cs.map(p=>p[1]))>z1)continue;
    const y=gtStripH(S)+rimAt(S.x,S.z)+.04;
    for(let a=-hl;a<hl;a+=4)for(let b=-hw;b<hw;b+=4){const mx=S.x+S.dx*(a+2)-S.dz*(b+2),mz=S.z+S.dz*(a+2)+S.dx*(b+2);if(!inC(mx,mz))continue;
      const P=(u,v)=>RB.v(S.x+S.dx*u-S.dz*v,y,S.z+S.dz*u+S.dx*v,0,1,0,.4,.4,1,0,MAT.CONCRETE);const p0=P(a,b),p1=P(a+4,b),p2=P(a+4,b+4),p3=P(a,b+4);RB.I.push(p0,p3,p2,p0,p2,p1);}}
  /* the placed models that stop you: a box round each (its footprint turned to its yaw), up to its top */
  for(const p of GT_PROPS){if(!p.solid||p.x<x0-30||p.x>x1+30||p.z<z0-30||p.z>z1+30)continue;const B=GT_PROPBOX[p.id+'/'+p.obj];if(!B)continue;
    const c=Math.cos(p.yaw),sn=Math.sin(p.yaw),pts=[[B[0],B[2]],[B[3],B[2]],[B[3],B[5]],[B[0],B[5]]].map(([a,b])=>[p.x+a*c+b*sn,p.z-a*sn+b*c]);
    const y=gtCore(p.x,p.z,{}).h+(p.dy||0);cols.push({x0:Math.min(...pts.map(q=>q[0])),z0:Math.min(...pts.map(q=>q[1])),x1:Math.max(...pts.map(q=>q[0])),z1:Math.max(...pts.map(q=>q[1])),top:y+B[4]});}
  /* the trees: the savanna's flat-topped trees, scattered, thicker along the creeks; none on the road or a strip */
  const G=9,n=Math.floor(CH/G),o={};
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const r1=R(),r2=R(),r3=R(),r4=R(),r5=R();
    const x=Math.min(x1-.9,Math.max(x0+.9,x0+(i+.15+r1*.7)*G)),z=Math.min(z1-.9,Math.max(z0+.9,z0+(j+.15+r2*.7)*G));
    if(r3>.08)continue;const Rg=gtRegions(x,z,GR),sav=Rg.sav+Rg.delta*.6+(1-sst(.2,.6,Math.max(0,Rg.d_high)))*0;if(sav<.2)continue;
    const c=Math.abs(fbm(x/2400+7,z/2400-3,3,721)-.5),creek=c<.03&&c>.011?.5:0,clump=sst(.55,.75,fbm(x/700+9,z/700-4,2,795));
    const p=(.012+.12*clump+creek*.6)*sav;if(r3>p)continue;
    gtRoadQ(x,z,GRQ);if(Math.abs(GRQ.d)<14)continue;const Q=gtStripQ(x,z);if(Q&&Q.e<20)continue;
    {const C=GT_CAUSE,ux=x-C.ax,uz=z-C.az,t=(ux*C.dx+uz*C.dz)/C.len;if(t>-.01&&t<1.01&&Math.abs(ux*C.dz-uz*C.dx)<10)continue;}
    let onPad=false;for(const P of GT_PADS){const F=P.F,u=(x-F.x)*F.dx+(z-F.z)*F.dz,v=-(x-F.x)*F.dz+(z-F.z)*F.dx;if(Math.max(P.u0-u,u-P.u1,P.v0-v,v-P.v1)<25){onPad=true;break;}}if(onPad)continue;
    gtCore(x,z,o);if(o.code===SF.water||o.code===SF.asphalt||o.rock>.5||o.h>300)continue;
    const sc=.8+r4*.9,v=r5*3|0,j1=hs(Math.round(x*7),Math.round(z*7),631),t=[74+(j1-.5)*16,84+(r5-.5)*14,40];
    trees.push(x,o.h,z,j1*6.283,sc*1.5,sc*.62,sc*1.5,v,s2l(t[0]),s2l(t[1]),s2l(t[2]),0);
    cols.push({t:'c',x,z,r:.35*sc+.15,top:o.h+3.2*sc});}
}
/* what the place is called (the HUD) */
function gtPlace(x,z){
  gtRoadQ(x,z,GRQ);if(Math.abs(GRQ.d)<12)return GRQ.s>GT_ROAD.len-80?'The End of Last Road':'Last Road';
  const Q=gtStripQ(x,z);if(Q&&Q.e<0)return Q.S.name+' strip';
  {const C=GT_CAUSE,ux=x-C.ax,uz=z-C.az,t=(ux*C.dx+uz*C.dz)/C.len;if(t>0&&t<1&&Math.abs(ux*C.dz-uz*C.dx)<10)return 'The Causeway';}
  let best=null,bd=1e9;for(const N of GT_NAMES){const d=Math.hypot(x-N.x,z-N.z);if(d<N.r&&d/N.r<bd){bd=d/N.r;best=N.n;}}if(best)return best;
  if(Math.max(Math.abs(x),Math.abs(z))>HALF-900)return 'The edge of the map';
  const R=gtRegions(x,z,GR);let b='The Savanna',w=R.sav;for(const r of GT_REG)if(R[r[0]]>w){w=R[r[0]];b=r[1];}return b;}
