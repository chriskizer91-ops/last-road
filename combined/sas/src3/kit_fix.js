
;
/* =====================================================================================
   THE ROCK & MUD, PUT RIGHT (10 Nov 2026, after Christopher looked it over in the bay; kit_fix).
   - THE MUD FLAPS (cwFlaps2, in place of cwFlaps). They were sized for the Stock's tyres and hung on the body's own
     line: 26 cm wide and inboard of a 32 cm tyre that stands out past the body, so from outside each read as a
     panel stuck through the middle of the tyre. Now each hangs behind its own tyre: centred on it, 4 cm wider than
     it, 10 cm behind the tread, from the arch's foot down to 17 cm off the ground.
   - THE SNORKEL (cwSnorkel2, in place of cwSnorkel). It stood 8 cm out to the side of the windscreen pillar on
     brackets, came down in an S round the mirror and ended on the fender's side in an open pipe touching nothing.
     Now it lies on top of the pillar, straight, from the roof's corner down to the pillar's foot, and goes on in
     the same line into the top of the fender behind the hood's corner, through a flange: no open end.
   - THE REAR WHEEL HOUSES IN THE CABIN (cwHouses, added to the Rock & Mud's cabin): see below.
   ===================================================================================== */
function cwFlaps2(out,car){
  const K=HDK,D=K.D,X=K.X,lk=D.look,RUB=SMC('#141414',MAT.RUBBER),B=SMC('#141416',SM.PAINTED);
  for(const [ua,ty,trk] of [[D.uFa,lk.tyre,lk.track],[D.uRa,lk.tyreR||lk.tyre,lk.trackR||lk.track]])for(const s of [1,-1]){
    const u=ua+Math.max(D.arch.a+.04,ty.R+.1),hz=ty.W/2+.02,yt=D.arch.cy+.005,yb=.17,hy=(yt-yb)/2,c=[X(u),yb+hy,s*trk/2];
    hdPart(out,mb=>{hdRBox(mb,c,[.006,hy,hz],.004,RUB,2);for(let k=-4;k<=4;k++)hdRBox(mb,[c[0]-.006,yb+.1,c[2]+k*.036],[.002,.085,.007],.002,RUB,1);},35);
    /* the bar across its top, bolted through; an arm from the bar in to the body's edge */
    hdPart(out,mb=>{hdRBox(mb,[c[0]+.004,yt,c[2]],[.008,.012,hz+.005],.003,B,2);for(const dz of [-hz*.7,0,hz*.7])hdCyl(mb,[c[0]-.002,yt,c[2]+dz],[c[0]-.008,yt,c[2]+dz],.007,.006,6,HC.BOLT);
      hdRBox(mb,[c[0]+.03,yt+.004,s*(K.sideZ(u,D.arch.cy)-.06)],[.034,.008,.05],.004,B,2);},40);}
}
function cwSnorkel2(out,car){
  const K=HDK,D=K.D,G=D.G,X=K.X,B=SMC('#141416',SM.PLASTIC),r=.042;
  /* the pillar's line: its corner (the section's point 10) at two stations up it, carried on straight both ways */
  const ua=G.cowl+.3,ub=G.rf-.04,ka=secKeys(D,ua),kb=secKeys(D,ub),A=[X(ua),ka.P[10][1],ka.P[10][0]],E=[X(ub),kb.P[10][1],kb.P[10][0]];
  const L=V3.len(V3.sub(E,A)),d=V3.norm(V3.sub(E,A));
  /* on top of the pillar: half the tube off its corner, out of the glass's plane, and a little inboard, so its foot
     meets the fender's top inside the fender's edge */
  const off=V3.add(V3.mul(V3.norm([d[1],-d[0],0]),r*.5),[0,0,-.03]),at=t=>V3.add(V3.add(A,V3.mul(d,t)),off);
  /* where the line meets the body's top surface below the pillar's foot (found on the body itself); its foot goes on
     8 cm into the body and turns inboard there: nothing of it ends in the open */
  let tE=0;for(let t=0;t>-.9;t-=.004){const p=at(t);if(p[1]<=K.topY(X(0)-p[0],p[2])){tE=t;break;}}
  const t0=tE-.08,top=at(L),foot=V3.add(at(t0),[0,-.012,-.035]);
  const path=[foot];for(let i=0;i<=12;i++)path.push(at(tE-.03+(L-.22-tE+.03)*i/12));
  for(const p of cwSpline([at(L-.22),at(L-.1),top,[top[0],top[1]+.07,top[2]-.006],[top[0],top[1]+.12,top[2]-.01]],8).slice(1))path.push(p);
  hdPart(out,mb=>{hdTube(mb,path,r,20,B,false,true);},40);
  /* the flange where it goes into the fender, a rubber ring under it */
  {const p=at(tE);hdPart(out,mb=>{hdCyl(mb,V3.add(p,V3.mul(d,-.006)),V3.add(p,V3.mul(d,.016)),r+.02,r+.012,28,B);
    hdCyl(mb,V3.add(p,V3.mul(d,-.01)),V3.add(p,V3.mul(d,-.004)),r+.026,r+.024,28,SMC('#0c0c0d',MAT.RUBBER));},40);}
  /* two clamps round it, each with a foot on the pillar */
  for(const f of [.3,.72]){const p=at(L*f),q=V3.sub(p,off);
    hdPart(out,mb=>{hdCyl(mb,V3.add(p,V3.mul(d,-.011)),V3.add(p,V3.mul(d,.011)),r+.004,r+.004,24,SMC('#26272a',SM.PAINTED));
      hdRBox(mb,V3.lerp(p,q,.92),[.016,.012,.014],.004,SMC('#26272a',SM.PAINTED),2);hdCyl(mb,V3.add(p,[0,0,r+.002]),V3.add(p,[0,0,r+.009]),.006,.005,6,HC.BOLT);},40);}
  /* the ram head (as it was): a rounded box facing forward, its mouth behind a mesh, a lip over it against the rain */
  {const c=[top[0]+.03,top[1]+.17,top[2]-.01];
    hdPart(out,mb=>{hdRBox(mb,c,[.1,.06,.06],.03,B,5);hdCyl(mb,[c[0]-.04,c[1]-.08,c[2]],[c[0]-.04,c[1]-.02,c[2]],.05,.05,20,B,false);},40);
    hdPart(out,mb=>{hdRBox(mb,[c[0]+.1,c[1]-.005,c[2]],[.006,.04,.045],.012,HC.GB,3);for(let k=-4;k<=4;k++)hdCyl(mb,[c[0]+.107,c[1]-.045,c[2]+k*.009],[c[0]+.107,c[1]+.035,c[2]+k*.009],.0012,.0012,4,HC.HONEY,false);
      for(let k=-4;k<=3;k++)hdCyl(mb,[c[0]+.107,c[1]-.005+k*.01,c[2]-.042],[c[0]+.107,c[1]-.005+k*.01,c[2]+.042],.0012,.0012,4,HC.HONEY,false);
      hdRBox(mb,[c[0]+.1,c[1]+.052,c[2]],[.025,.006,.058],.004,B,2);},40);}
}
/* THE REAR COILOVERS' TOWERS IN THE CABIN (cwHouses). The Rock & Mud's rear coilovers stand 14 cm up through the cargo
   floor just inboard of the carpeted wheel houses (which are the Stock's, 56 cm out from the middle): the red springs
   and blue dampers showed behind the rear seat. Each wheel house is carried 22 cm further in over its coilover, as a
   carpeted tower, 49 cm long. The nitrous bottle lies 16 cm behind the left one, in the open as before */
function cwHouses(out,car){
  const K=HDK,D=K.D,X=K.X,CARP=SV(lin('#2a2826'),SM.CARPET),top=D.arch.cy+D.arch.b+.09;
  for(const s of [1,-1])hdPart(out,mb=>{hdRBox(mb,[X(D.uRa),top-.15,s*.455],[.245,.15,.118],.045,CARP,4);},40);
}
