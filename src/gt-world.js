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
/* ---------- WATER LANDINGS (his ask, Nov 2026: the Heron "can land in shallow water as well: a river sandbar right
   at the surface, or a flat beach"): two sandbars, each an island of firm sand a few centimetres above the water in
   the broadest reaches of open water there are (tools: the points furthest from the banks), one in a Delta channel
   and one where the gorge river widens into the Delta, the water round them too deep to land in (you land on the bar,
   not beside it); and a beach on the Lake's south shore, where it's a smooth curve, dry firm sand sloping into the
   lake. Their sand is pale river sand (the pans' pale grey with a quarter of the dunes' orange in it). No truck waits at these: you can't
   drive there ---------- */
const GT_WATERS=[
  ['Crane Bar','bar',38.31,45.61,58,380,16,'r'],['River Mouth Bar','bar',39.935,41.41,3,380,16,'r'],['South Beach','beach',44.5,42.886,180,520,22,'b']]
  .map(([name,kind,bx,by,hd,len,hw,lab])=>{const a=hd*Math.PI/180;return {name,kind,x:GX(bx),z:GZ(by),dx:Math.cos(a),dz:-Math.sin(a),len,hw,wl:-1.1,lab};});
/* which water place (x,z) is in or near: along its length (ax), across (ac: + is the lake's side of a beach), and
   how far outside its sand (e) */
function gtWaterQ(x,z,Q){for(const S of GT_WATERS){const ax=(x-S.x)*S.dx+(z-S.z)*S.dz,ac=-(x-S.x)*S.dz+(z-S.z)*S.dx,
    e=Math.hypot(Math.max(0,Math.abs(ax)-S.len/2+S.hw),Math.max(0,Math.abs(ac)))-S.hw;if(e<150){Q.S=S;Q.ax=ax;Q.ac=ac;Q.e=e;return Q;}}return null;}
const GWQ={};
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
  /* the Old Survey Strip: Venn's wreck, nose down past the strip's far end where it ran out, and the camp beside it
     (his tent, the table and crate, the jerry cans, the fire ring), on the sand */
  {const S=GT_STRIPS.find(q=>q.name==='Old Survey Strip'),F=frame(S.x,S.z,S.dx,S.dz),e=S.len/2;pad(F,e-5,e+70,18,66,'sand',()=>gtStripH(S));
    put('D18','wreck',...F.at(e+42,33),F.face(1,0)+.45,true,5000);put('D18','tent',...F.at(e+24,52),F.face(0,-1),true,2500);
    put('D18','table',...F.at(e+20,45),F.face(0,-1)+.2,true,900);put('D18','crate',...F.at(e+23.5,46.5),F.face(0,-1)-.3,true,900);
    put('D18','jerry_cans',...F.at(e+30,48),F.face(-1,0),true,900);put('D18','fire_ring',...F.at(e+16,40),0,false,900);}
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
  let gran=false;if(R.sav>.02||R.delta>.02){gtKopje(x,z,GK);const kk=R.sav;h+=GK.kh*kk;rock=Math.max(rock,GK.kr*kk*.85);gran=GK.kh>.3&&kk>.3;
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
    /* (the lava flows: a'a, broken into ridges and blocks up to 2.6 m high a few metres apart, that no truck crosses:
       you fly over them, or land at a strip beside them) */
    if(lava>0){h+=(vn(x/24,z/24,792)-.5)*2.2*lava*k+Math.pow(Math.abs(vn(x/6.5,z/6.5,793)-.5)*2,1.4)*2.6*sst(.25,.75,lava)*k;rock=Math.max(rock,lava*k);}rock=Math.max(rock,.8*k);grass*=1-.9*k;
    const C=GT_BIG.cald,dc=Math.hypot(x-C[0],z-C[1])/C[2];if(dc<1.6){const ring=C[3]*Math.exp(-Math.pow((dc-1)/.22,2)),floor=dc<1?-C[3]*.2*sst(1,.6,dc):0;h+=ring+floor;
      /* (the crater lake in its east half; the strip on the west of the floor) */
      if(Math.hypot(x-C[0]-.33*C[2],z-C[1])/C[2]<.3){wet=1;wl=60;}}}
  /* (each region's own rock: the Black Range's basalt, the kopjes' granite, sandstone elsewhere) */
  o.gm=R.black>.45?38:gran?39:40;
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
  /* the water landings: a bar is a stadium of sand (rounded ends) at the water's top, shallows round it, then open
     water a metre and a bit deep, joining the river's own; a beach is dry sand on its land side sloping into the lake
     on the other */
  {const W=gtWaterQ(x,z,GWQ);if(W){const S=W.S,L=S.wl;
    if(S.kind==='bar'){const e=W.e,top=L+.07,deep=L-1.3;let hb;
      if(e<0)hb=top+.05*sst(0,-S.hw,e);else if(e<10)hb=top-(.42)*sst(0,10,e);else if(e<40)hb=L-.35-(.95)*sst(10,40,e);else hb=Math.min(h,deep);
      const f=1-sst(40,80,e);h=h+(hb-h)*f;if(e<80){wet=1;wl=L;}if(e<0){code=SF.sand;sand=.22;salt=.85;grass=0;rock=0;mud=0;}else if(e<12){code=SF.sand;sand=.18;salt=.6;grass*=.2;mud=0;}}
    else{const ac=W.ac,end=1-sst(S.len/2-40,S.len/2+30,Math.abs(W.ax));let hb;
      if(ac<-S.hw)hb=L+.30;else if(ac<6)hb=L+.30-.11*(ac+S.hw)/(S.hw+6);else if(ac<42)hb=L+.19-1.4*sst(6,42,ac);else hb=Math.min(h,L-1.21);
      const f=end*(ac<-S.hw?1-sst(-S.hw,-S.hw-40,ac):1)*(ac>42?1-sst(42,90,ac):1);h=h+(hb-h)*f;
      if(f>.3&&ac>-2){wet=1;wl=L;}if(f>.5&&ac<20){code=SF.sand;sand=.22;salt=.85;grass=0;rock=0;mud=0;}}}}
  if(wet&&h<wl){code=SF.water;}else wet=0;
  o.h=h;o.code=code;o.grass=grass;o.rock=rock;o.mud=Math.max(mud,wet?.8:0);o.salt=salt;o.sand=sand;o.ramp=0;o.wet=wet;o.wl=wet?wl:h;o.B=h;o.rk=rock;o.k=0;o.tm=0;o.tin=0;o.gm=GL.gm;
  return o;}
/* the road base (for ribbons laid over the land) */
function gtBase(x,z){gtRoadQ(x,z,GRQ);if(Math.abs(GRQ.d)<40)return gtRoadH(GRQ.s)+rimAt(x,z);const o={};return gtCore(x,z,o).h;}

/* his plants and rocks, drawn as the world draws its trees (src/lr-game.js puts them after its own seven shapes):
   each [model, object, height, how far it's drawn (m; 0: as far as the world draws trees)], and how wide (a rock's post) */
const GT_TV0=7,GT_TSH=[['F01','tree_young',3,0],['F01','tree_mature',6.3,0],['F01','tree_old',9.9,0],['F04','bush_dense',2.1,260],['F04','bush_half_dead',1.8,260],['F04','bush_clump',1.3,260],
  ['F07','dome_mound',1.1,320],['F07','spired_mound',1.8,0],['F07','cathedral_mound',3.2,0],['F06','boulder_xs',.86,180],['F06','boulder_s',1.25,180],['F06','boulder_m',1.67,320],
  ['F06','boulder_l',1.95,0],['F06','boulder_split',3.15,0],['F06','boulder_balanced',4.27,0],['F06','boulder_long_large',4.23,0],
  /* the Delta's big mossy trees and its reeds; the Canyons' sandstone; the Black Range's lava rocks */
  ['F10','large_tree',9.2,0],['F10','small_tree',5.2,0],['F12','dense_stand',2.9,220],['F12','wind_bent',2.3,220],['F12','edge_clump',2.6,220],
  ['F09','sandstone_block',2,0],['F09','leaning_slab',1.7,0],['F09','stepped_ledge',2,0],['F09','boulder_large',1.2,320],['F09','boulder_small',.7,180],
  ['F14','boulder_large',2.3,0],['F14','boulder_faceted',1.5,320],['F14','rock_pillar',1.5,320],['F14','rock_spiky',1.9,0],['F14','spiky_bomb',.7,180],
  ['F14','lava_slab',.3,180],['F14','rock_small_a',.6,140],['F14','rock_small_c',.7,140],['F14','rock_small_e',.8,140]];
const GT_TSB=GT_TSH.map(t=>{const b=GT_PROPBOX[t[0]+'/'+t[1]];return b?Math.min(b[3]-b[0],b[5]-b[2]):1;});
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
  /* his plants and rocks (GT_TSH: the game draws them as it draws trees, instanced, near and far), in 9 m cells:
     the flat-topped trees scattered over the savanna, thicker in clumps and along the creeks; bushes three times as
     many, smaller; termite mounds here and there; boulders on and round the kopjes. None on the road, a strip, the
     Causeway or a pad; the trees, mounds and boulders stop you (a post at the trunk, the mound, the rock) */
  const G=9,n=Math.floor(CH/G),o={},K={};
  const clear=(x,z,m)=>{gtRoadQ(x,z,GRQ);if(Math.abs(GRQ.d)<12+m)return false;const Q=gtStripQ(x,z);if(Q&&Q.e<18+m)return false;
    {const W=gtWaterQ(x,z,GWQ);if(W&&(W.e<110+m||Math.abs(W.ac)<45+m))return false;}
    {const C=GT_CAUSE,ux=x-C.ax,uz=z-C.az,t=(ux*C.dx+uz*C.dz)/C.len;if(t>-.01&&t<1.01&&Math.abs(ux*C.dz-uz*C.dx)<8+m)return false;}
    for(const P of GT_PADS){const F=P.F,u=(x-F.x)*F.dx+(z-F.z)*F.dz,v=-(x-F.x)*F.dz+(z-F.z)*F.dx;if(Math.max(P.u0-u,u-P.u1,P.v0-v,v-P.v1)<20+m)return false;}return true;};
  const gtTint=(a,b,c)=>[.9+(a-.5)*.14,1+(b-.5)*.12,.8+(c-.5)*.1];
  const put=(x,z,y,v,sc,yaw,tint,colR,colH)=>{trees.push(x,y,z,yaw,sc,sc,sc,GT_TV0+v,tint[0],tint[1],tint[2],0);if(colR)cols.push({t:'c',x,z,r:colR*sc,top:y+colH*sc});};
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const r1=R(),r2=R(),r3=R(),r4=R(),r5=R(),r6=R(),r7=R();
    const x=Math.min(x1-.9,Math.max(x0+.9,x0+(i+.15+r1*.7)*G)),z=Math.min(z1-.9,Math.max(z0+.9,z0+(j+.15+r2*.7)*G));
    if(r3>.32)continue;const Rg=gtRegions(x,z,GR),sav=Rg.sav;
    if(sav<.2){
      /* the other lands' own: in the Delta its big mossy trees and, at the water's edge and in the shallows, reeds; in
         the Canyons sandstone blocks, slabs and ledges; in the Black Range lava rocks, thickest on the flows */
      const oth=Rg.delta+Rg.cany+Rg.black;if(oth<.4||r3>.2)continue;gtCore(x,z,o);if(o.code===SF.asphalt||!clear(x,z,2))continue;
      const j2=hs(Math.round(x*7),Math.round(z*7),632),yw=j2*6.283,tw=[.95+(j2-.5)*.1,.95+(r5-.5)*.1,.95];
      if(Rg.delta>=Math.max(Rg.cany,Rg.black)){const wet=o.code===SF.water,dp=wet?o.wl-o.h:9,cd=Math.abs(fbm(x/2400+7,z/2400-3,3,721)-.5),near=wet?(dp<.7?1:0):cd<.03?.5:0;
        if(wet&&dp>=.7)continue;const pr=.02+near*.16,pt=wet?0:.008+(cd<.04?.03:0);
        if(r3<pr)put(x,z,o.h-.1,18+(r4*3|0),.8+r5*.5,yw,tw,0,0);
        else if(r3<pr+pt){const v=r4<.45?16:17;put(x,z,o.h-.1,v,.8+r5*.35,yw,gtTint(j2,r5,r6),v===16?.55:.3,v===16?9:5);}}
      else if(Rg.cany>=Rg.black){if(o.h>2000||r3>.055)continue;const v=r4<.15?23:r4<.3?21:r4<.42?22:r4<.7?24:25,sc=.7+r5*.7;put(x,z,o.h-.15*sc,v,sc,yw,tw,GT_TSB[v]*.42,GT_TSH[v][2]);}
      else{const p=.045+.08*sst(.5,.9,o.rock);if(r3>p)continue;const v=r4<.1?26:r4<.2?29:r4<.3?27:r4<.38?28:r4<.5?31:r4<.6?30:32+(r6*3|0),sc=.75+r5*.6;
        put(x,z,o.h-.08*sc,v,sc,yw,tw,v<30?GT_TSB[v]*.42:0,GT_TSH[v][2]);}
      continue;}
    const c=Math.abs(fbm(x/2400+7,z/2400-3,3,721)-.5),creek=c<.03&&c>.011?.5:0,clump=sst(.55,.75,fbm(x/700+9,z/700-4,2,795));
    gtKopje(x,z,K);const kop=K.kh>.5?sst(0,.5,K.kr)+.25:0,j1=hs(Math.round(x*7),Math.round(z*7),631),yaw=j1*6.283;
    const pt=(.012+.12*clump+creek*.6)*sav*(1-Math.min(kop,1)*.7),pb=pt*3+.01*sav,pm=.004*sav*(1-clump),pr=kop*.2;
    /* which, by the cell's roll: a tree, else a bush, else a mound, else a rock */
    const ta=Math.min(pt,.08),tb=ta+Math.min(pb,.1),tm=tb+pm,tr=tm+Math.min(pr,.12),k=r3<ta?0:r3<tb?1:r3<tm?2:r3<tr?3:-1;
    if(k<0||!clear(x,z,k===1?0:2))continue;
    gtCore(x,z,o);if(o.code===SF.water||o.code===SF.asphalt||o.h>300)continue;if(k<3&&o.rock>.55)continue;
    const tn=gtTint(j1,r5,r6);
    if(k===0){const v=r4<.38?0:r4<.88?1:2;put(x,z,o.h-.05,v,.85+r5*.35,yaw,tn,[.16,.3,.5][v],[3,6.3,9.9][v]);}
    else if(k===1){put(x,z,o.h-.08,3+(r4*3|0),.75+r5*.6,yaw,tn,0,0);}
    else if(k===2){const v=r4<.45?6:r4<.85?7:8;put(x,z,o.h-.06,v,.8+r5*.4,yaw,[.95+(r6-.5)*.1,.95,.95],[.7,.75,.75][v-6],[1.1,1.8,3.1][v-6]);}
    else{const big=kop*r7,v=big>.75?12+(r4*4|0):big>.35?10+(r4*2|0):9+(r4*3|0),wR=GT_TSB[v],sc=(.8+r5*.45)*(v>=12?1+big*1.4:1);
      put(x,z,o.h-.12*sc,v,sc,yaw,[.95+(r6-.5)*.12,.95,.95],wR*.42,GT_TSH[v][2]);}}
}
/* what the place is called (the HUD) */
function gtPlace(x,z){
  gtRoadQ(x,z,GRQ);if(Math.abs(GRQ.d)<12)return GRQ.s>GT_ROAD.len-80?'The End of Last Road':'Last Road';
  const Q=gtStripQ(x,z);if(Q&&Q.e<0)return Q.S.name+' strip';
  {const W=gtWaterQ(x,z,GWQ);if(W&&W.e<60)return W.S.name;}
  {const C=GT_CAUSE,ux=x-C.ax,uz=z-C.az,t=(ux*C.dx+uz*C.dz)/C.len;if(t>0&&t<1&&Math.abs(ux*C.dz-uz*C.dx)<10)return 'The Causeway';}
  let best=null,bd=1e9;for(const N of GT_NAMES){const d=Math.hypot(x-N.x,z-N.z);if(d<N.r&&d/N.r<bd){bd=d/N.r;best=N.n;}}if(best)return best;
  if(Math.max(Math.abs(x),Math.abs(z))>HALF-900)return 'The edge of the map';
  const R=gtRegions(x,z,GR);let b='The Savanna',w=R.sav;for(const r of GT_REG)if(R[r[0]]>w){w=R[r[0]];b=r[1];}return b;}
