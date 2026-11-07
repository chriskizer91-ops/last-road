/* =====================================================================================
   LAST ROAD · LOOK TEST · THE ROCK & MUD. Which play model is good enough to drive on Christopher's phone:
   - the Rock & Mud as it is: Studio 2 (790,531 triangles), Studio 2 Drive (the engine bay out) and the game's own;
   - three play models: the game's own shape cut down to about 10,000, 25,000 and 50,000 triangles
     (last-road tools/play_lod.py), the Studio 2 baked onto each (salt-mini-plus models/tools/bake.py, pictures
     2048 for the body and 1024 for the wheel). 10k and 25k have plain round tyres (24 and 36 sides) with the Studio
     2 tread painted on; 50k has the Studio 2's own knobby tyres, cut down. The glass is solid (no cabin behind it).
   Two scenes: Road (the salt flat, the car followed by the game's Chase and Far cameras, Christopher's Wheel cam and
   the Tracking car) and Studio (the car on the backdrop, to turn round). Made from salt-mini-plus viewer/src/traffic.js.
   ===================================================================================== */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {makeMats} from './mats.js';

const K=window.KIT,MAT=K.MAT,SM=K.SM,Q=new URLSearchParams(location.search),$=id=>document.getElementById(id);
const SHOTS=!!Q.get('shots'),ID='crawler';
/* ---------- the versions ---------- */
const LODS=[50000,25000,10000],SURF=[['s2','Studio 2 baked']];
const VERS=[['studio2','Studio 2'],['studio2d','Studio 2 Drive'],['game',"Game's own"]];
for(const t of LODS)for(const [s,n] of SURF)VERS.push([`t${t}_${s}`,`Play ${t/1000}k`]);
const YOURS=[['studio2d','Studio 2 Drive'],['studio2','Studio 2'],['studio','Studio'],['game','Game']];
const label=v=>(VERS.find(x=>x[0]===v)||[0,v])[1];
const isTraffic=v=>v[0]==='t';

const cv=$('cv'),PHONE=matchMedia('(hover: none)').matches;
const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,preserveDrawingBuffer:SHOTS,powerPreference:'high-performance'});
renderer.setPixelRatio(SHOTS?1:Math.min(devicePixelRatio,2));
renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=1;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(28,1,.05,4000);
const controls=new OrbitControls(camera,cv);controls.enableDamping=true;controls.dampingFactor=.08;controls.target.set(0,.8,0);
controls.minDistance=.3;controls.maxDistance=60;controls.maxPolarAngle=Math.PI*.495;
controls.enablePan=true;controls.screenSpacePanning=true;controls.zoomToCursor=true;controls.zoomSpeed=1.1;controls.rotateSpeed=.85;

/* ---------- the light: the viewer's soft boxes for the reflections; the backdrop for Studio and Parked, the salt flat for Road ---------- */
const pmrem=new THREE.PMREMGenerator(renderer);
function studioEnvScene(){const s=new THREE.Scene(),g=new THREE.SphereGeometry(40,64,32),c=[];
  const P=g.attributes.position;for(let i=0;i<P.count;i++){const y=P.getY(i)/40,v=y>0?.12+.06*y:.12+(.22-.12)*Math.min(1,-y*4);c.push(v,v,v*.98);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));s.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide})));
  const box=(w,h,pos,look,k,tint=[1,1,1])=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
    m.material.color.setRGB(k*tint[0],k*tint[1],k*tint[2]);m.position.set(...pos);m.lookAt(...look);s.add(m);};
  box(14,4.5,[0,12,0],[0,0,0],9);for(const z of [-11,11])box(1.6,9,[1.5,5,z],[0,1,0],6);
  box(7,5,[13,5,3],[0,1,0],3.2,[1,.97,.93]);box(7,4,[-13,5,-2],[0,1,0],2.2,[.92,.96,1]);box(30,.5,[0,.25,-16],[0,0,0],1.2);return s;}
/* (the salt flat's sky for the reflections: pale blue over, the white salt under) */
function flatEnvScene(){const s=new THREE.Scene(),g=new THREE.SphereGeometry(40,64,32),c=[];
  const P=g.attributes.position;for(let i=0;i<P.count;i++){const y=P.getY(i)/40;if(y>0){const k=1-Math.pow(1-y,3);c.push(.55-.25*k,.68-.2*k,.85-.05*k);}else c.push(.78,.76,.72);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));s.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide})));
  const sun=new THREE.Mesh(new THREE.SphereGeometry(2,16,8),new THREE.MeshBasicMaterial({color:new THREE.Color(30,28,25)}));sun.position.set(14,26,10);s.add(sun);return s;}
const ENV={studio:pmrem.fromScene(studioEnvScene(),.02).texture,flat:pmrem.fromScene(flatEnvScene(),.02).texture};
const sky=(()=>{const c=document.createElement('canvas');c.width=4;c.height=256;const g=c.getContext('2d'),gr=g.createLinearGradient(0,0,0,256);
  gr.addColorStop(0,'#6f9fd6');gr.addColorStop(.47,'#c9dced');gr.addColorStop(.5,'#e8e6e0');gr.addColorStop(1,'#e8e6e0');g.fillStyle=gr;g.fillRect(0,0,4,256);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;})();
/* the backdrop: a floor that only shows the shadow */
const studio=new THREE.Group();
{const f=new THREE.Mesh(new THREE.PlaneGeometry(80,80),new THREE.ShadowMaterial({opacity:.32}));f.rotation.x=-Math.PI/2;f.receiveShadow=true;studio.add(f);}
scene.add(studio);
/* the salt flat: white salt to the horizon, a long black road with a dashed centre line */
const flat=new THREE.Group();
{/* (the salt 3 cm under the road, in many squares, so the two never fight for the same pixels) */
  const salt=new THREE.Mesh(new THREE.PlaneGeometry(8000,8000,80,80),new THREE.MeshStandardMaterial({color:'#e2dbcd',roughness:1,envMapIntensity:.15}));salt.rotation.x=-Math.PI/2;salt.position.y=-.03;salt.receiveShadow=true;flat.add(salt);
  /* (the road's picture runs along it: 12 m of road a repeat, a 6 m dash and a 6 m gap down the middle, a white line each edge) */
  const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d');g.fillStyle='#3b3c3e';g.fillRect(0,0,512,256);
  g.fillStyle='#d9d4c4';g.fillRect(0,126,256,4);g.fillStyle='#cfcabb';g.fillRect(0,10,512,4);g.fillRect(0,242,512,4);
  const t=new THREE.CanvasTexture(c);t.wrapS=THREE.RepeatWrapping;t.repeat.set(4000/12,1);t.anisotropy=16;t.colorSpace=THREE.SRGBColorSpace;
  const road=new THREE.Mesh(new THREE.PlaneGeometry(4000,8.4),new THREE.MeshStandardMaterial({map:t,roughness:.82,envMapIntensity:.6}));road.rotation.x=-Math.PI/2;road.position.set(1600,0,0);road.receiveShadow=true;flat.add(road);}
scene.add(flat);
const pool=()=>{const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d'),gr=g.createRadialGradient(128,128,10,128,128,128);
  gr.addColorStop(0,'rgba(0,0,0,.55)');gr.addColorStop(.55,'rgba(0,0,0,.28)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,256,256);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));
  m.rotation.x=-Math.PI/2;m.position.y=.008;m.renderOrder=-1;return m;};
const key=new THREE.DirectionalLight(0xffffff,1.8);key.castShadow=true;key.shadow.mapSize.set(4096,4096);
key.shadow.radius=6;key.shadow.blurSamples=16;key.shadow.bias=-.0004;key.shadow.normalBias=.02;scene.add(key,key.target);
const rim=new THREE.DirectionalLight(0xdfe8ff,.7);rim.position.set(-6,3,-4);scene.add(rim);
const hemi=new THREE.HemisphereLight(0xeef2f6,0xe2dacb,.0);scene.add(hemi);
const {setLights:matLights,mergedMeshes}=makeMats(THREE,K);

/* ---------- the data: each traffic car's file loaded when first asked for (in the one-file page they're all in already) ---------- */
const DATA_DIR=document.documentElement.dataset.data||'data/';
const loaded={};
function need(key,reg){if(window[reg]&&window[reg][key])return Promise.resolve();if(loaded[key])return loaded[key];
  return loaded[key]=new Promise((ok,no)=>{const s=document.createElement('script');s.src=DATA_DIR+key+'.js';s.onload=ok;s.onerror=()=>no(new Error('no '+key));document.head.appendChild(s);});}
const b64=s=>{const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u.buffer;};
const f32=s=>new Float32Array(b64(s));
/* ---------- the baked cars (as the viewer has them) ---------- */
function unpackBaked(p){if(!p||!p.v)return [];const n=p.v,bx=p.box,qp=new Uint16Array(b64(p.P)),qn=new Int8Array(b64(p.N)),qu=new Uint16Array(b64(p.U)),qm=new Uint8Array(b64(p.M));
  const I=p.i32?new Uint32Array(b64(p.I)):new Uint16Array(b64(p.I)),P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2);
  for(let i=0;i<n;i++){for(let k=0;k<3;k++){P[i*3+k]=bx[k]+qp[i*3+k]/65535*bx[3+k];N[i*3+k]=qn[i*3+k]/127;}U[i*2]=qu[i*2]/65535;U[i*2+1]=qu[i*2+1]/65535;}
  const by=new Map();for(let t=0;t<I.length/3;t++){const m=qm[I[t*3]];let a=by.get(m);if(!a)by.set(m,a=[]);a.push(I[t*3],I[t*3+1],I[t*3+2]);}
  const out=[];for(const [m,ix] of by){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('normal',new THREE.BufferAttribute(N,3));
    g.setAttribute('uv',new THREE.BufferAttribute(U,2));g.setIndex(new THREE.BufferAttribute(n>65535?new Uint32Array(ix):new Uint16Array(ix),1));out.push([m,g]);}
  return out;}
/* the pictures, at the size asked for (1: as baked, 2048 x 3072; .5; .25): the memory they take, mipmaps in, is shown */
let PIC=+(Q.get('pic')||1);const BKTEX={};
async function bakedTextures(id){const k=id+'@'+PIC;if(BKTEX[k])return BKTEX[k];const A=window.BAKED_CARS[id].atlas,w=Math.round(A.w*PIC),h=Math.round(A.h*PIC);
  const one=async(src,srgb)=>{const bm=await createImageBitmap(new Blob([b64(src.slice(src.indexOf(',')+1))],{type:'image/webp'}),
      {premultiplyAlpha:'none',colorSpaceConversion:'none',...(PIC<1?{resizeWidth:w,resizeHeight:h,resizeQuality:'high'}:{})});
    const t=new THREE.Texture(bm);t.flipY=false;t.colorSpace=srgb?THREE.SRGBColorSpace:THREE.NoColorSpace;t.anisotropy=8;t.premultiplyAlpha=false;t.needsUpdate=true;return t;};
  const [c,n,o]=await Promise.all([one(A.col,true),one(A.nrm,false),one(A.orm,false)]);return BKTEX[k]={c,n,o,w,h,glow:!!A.glow,mb:w*h*4*3*4/3/1048576};}
const PAINT_U={value:new THREE.Color('#ffffff')},GLOW_U={value:0};
function bakedMat(tx,lamp){const m=new THREE.MeshPhysicalMaterial({map:tx.c,normalMap:tx.n,normalMapType:THREE.ObjectSpaceNormalMap,aoMap:tx.o,aoMapIntensity:.8,
    roughnessMap:tx.o,metalnessMap:tx.o,roughness:1,metalness:1,clearcoat:1,clearcoatMap:tx.o,clearcoatRoughness:.03,side:THREE.DoubleSide});
  m.onBeforeCompile=sh=>{sh.uniforms.uPaint=PAINT_U;
    sh.fragmentShader='uniform vec3 uPaint;\n'+sh.fragmentShader.replace('#include <map_fragment>',
      `#ifdef USE_MAP
        vec4 sampledDiffuseColor=texture2D(map,vMapUv);diffuseColor.rgb*=mix(sampledDiffuseColor.rgb,uPaint,sampledDiffuseColor.a);
      #endif`).replace(/texture2D\( clearcoatMap, vClearcoatMapUv \)\.x/g,'texture2D( clearcoatMap, vClearcoatMapUv ).w');
    /* (a traffic car's lamps are part of its pictures: where the normals' alpha says lamp, its own colour glows) */
    /* (the glow's colour by which end of the car the lamp is at: the headlamps' warm white at the nose, +x, the tail
       lamps' red at the back) */
    if(tx.glow){sh.uniforms.uGlow=GLOW_U;
      sh.vertexShader='varying float vCarX;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vCarX=position.x;');
      sh.fragmentShader='uniform float uGlow;\nvarying float vCarX;\n'+sh.fragmentShader.replace('#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n totalEmissiveRadiance+=texture2D(normalMap,vNormalMapUv).a*(vCarX>0.0?vec3(1.0,.95,.87):vec3(1.0,.06,.03)*.9)*uGlow;');}};
  m.customProgramCacheKey=()=>'baked'+(lamp||'')+(tx.glow?'g':'');m.userData.lamp=lamp||0;return m;}
const BAKED_LAMP={33:'tail',34:'head',35:'amber',36:'rev'};
/* (traffic glass: solid, a dark mirror; the full cars' glass as the viewer has it, see-through) */
const solidGlass=()=>new THREE.MeshPhysicalMaterial({color:0x0b0f14,roughness:.04,metalness:0,clearcoat:1,clearcoatRoughness:.02,envMapIntensity:1.3});
function bakedGroup(parts,tx,solid){const g=new THREE.Group();
  for(const [m,geo] of unpackBaked(parts)){let mat;
    if(m===2||m===3)mat=solid?solidGlass():new THREE.MeshPhysicalMaterial({color:m===2?0x05070a:0x0a0e12,roughness:.02,metalness:0,transparent:true,opacity:m===2?.86:.8,depthWrite:false,envMapIntensity:1.4,side:THREE.DoubleSide});
    else if(m===16)mat=new THREE.MeshStandardMaterial({color:0x111112,roughness:.7,metalness:.3,side:THREE.DoubleSide});
    else mat=bakedMat(tx,BAKED_LAMP[m]);
    const o=new THREE.Mesh(geo,mat);o.castShadow=!(m===2||m===3)||solid;o.receiveShadow=true;o.userData.mat=m;g.add(o);}
  return g;}
/* the plain traffic car: its arrays as the game's own mesh form, through the viewer's materials */
const plainPiece=p=>({p:f32(p.p),n:f32(p.n),c:f32(p.c),m:f32(p.m)});
function solidify(g){g.traverse(o=>{if(o.isMesh&&(o.userData.mat===MAT.GLASS||o.userData.mat===MAT.GLASSL)){o.material=solidGlass();o.castShadow=true;}});return g;}

/* ---------- a car, built once a version and kept ---------- */
let G0=null;const game0=()=>{if(!G0){K.setHD(false);K.setAlt&&K.setAlt('');G0=K.studioBuild(ID,1);}return G0;};
function placeWheels(g,D,b,wheel,brake){const fx=D.X(D.uFa),wb=D.uRa-D.uFa;
  for(const front of [1,0])for(const s of [1,-1]){const x=front?fx:fx-wb*Math.cos(D.pitch),tw=(front?b.look.track:b.look.trackR||b.look.track)/2;
    const w=new THREE.Group();w.position.set(x,front?b.look.tyre.R:D.Rr,s*tw);w.scale.set(1,1,s);w.add(wheel.clone());if(brake)w.add(brake.clone());g.add(w);}}
const CACHE={};
async function build(v){const k=v+'@'+(v==='baked'||(isTraffic(v)&&!v.endsWith('plain'))?PIC:1);if(CACHE[k])return CACHE[k];
  const t0=performance.now(),root=new THREE.Group();let D,b,tex=0;
  if(v==='baked'||isTraffic(v)&&!v.endsWith('plain')){
    const key=v==='baked'?ID:`${ID}_${v}`;await need(key,'BAKED_CARS');const B=window.BAKED_CARS[key],tx=await bakedTextures(key);
    const T=game0();D=T.D;b=T.b;tex=tx.mb;
    for(const p of ['body','hood','hide'])if(!(v==='baked'&&p==='hide'))root.add(bakedGroup(B.parts[p],tx,isTraffic(v)));
    placeWheels(root,D,b,bakedGroup(B.parts.wheel,tx,true),null);
  }else if(isTraffic(v)){
    const key=`${ID}_${v}`;await need(key,'TRAFFIC_PLAIN');const P=window.TRAFFIC_PLAIN[key],T=game0();D=T.D;b=T.b;
    root.add(solidify(mergedMeshes([plainPiece(P.skin),plainPiece(P.glass),plainPiece(P.under)],'body',b)));
    placeWheels(root,D,b,mergedMeshes([plainPiece(P.wheel)],'wheel',b),null);
  }else{
    K.setAlt&&K.setAlt(v==='studio2'?'2':v==='studio2d'?'2d':'');K.setHD(v!=='game');const T=K.studioBuild(ID,v==='game'?1:.25);K.setAlt&&K.setAlt('');D=T.D;b=T.b;
    const fixed=[T.body];for(const [nm,src] of Object.entries(T.hd||{}))if(src&&src.p&&nm!=='hood')fixed.push(src);if(T.under)fixed.push(T.under);
    root.add(mergedMeshes(fixed,'body',b),mergedMeshes([T.hood,T.hd&&T.hd.hood].filter(Boolean),'hood',b));
    const wF=mergedMeshes([T.wheel],'wheel',b),bF=T.brake?mergedMeshes([T.brake],'brake',b):null;placeWheels(root,D,b,wF,bF);
  }
  root.traverse(m=>{if(m.isMesh&&m.castShadow!==false)m.castShadow=!(m.material&&m.material.transparent);});
  const c=count(root),out={v,root,D,b,tex,n:c.n,d:c.d,ms:performance.now()-t0};CACHE[k]=out;return out;}
function count(o){let n=0,d=0;o.traverse(m=>{if(m.isMesh){n+=m.geometry.index?m.geometry.index.count/3:m.geometry.attributes.position.count/3;d++;}});return {n,d};}

/* ---------- the scene's cars ---------- */
const slotA=new THREE.Group(),slotB=new THREE.Group(),poolA=pool(),poolB=pool();scene.add(slotA,slotB,poolA,poolB);
let scn=Q.get('scene')||'road',vA=Q.get('v')||'t10000_s2',vB=Q.get('you')||'studio2d',cam=Q.get('cam')||'chase',dist=+(Q.get('d')||100),coming=Q.get('dir')!=='going',lights=+(Q.get('lights')||1),paint=null;
let A=null,B=null;
function place(){
  const L=4.6;studio.visible=scn!=='road';flat.visible=scn==='road';scene.background=scn==='road'?sky:new THREE.Color('#e6e5e2');scene.environment=scn==='road'?ENV.flat:ENV.studio;
  hemi.intensity=scn==='road'?.6:0;rim.intensity=scn==='road'?.25:.7;
  slotA.position.set(0,0,0);slotA.rotation.set(0,0,0);slotB.visible=scn!=='studio';poolB.visible=slotB.visible;
  if(scn==='studio'){key.position.set(3.2,7.5,2.4);key.target.position.set(0,0,0);setShadow(4.5);}
  else if(scn==='parked'){slotA.position.set(0,0,1.45);slotB.position.set(0,0,-1.45);key.position.set(3.2,7.5,2.4);key.target.position.set(0,0,0);setShadow(5.5);}
  else{/* the car in the right-hand lane going +x, followed by the cameras */
    slotB.visible=false;poolB.visible=false;slotA.position.set(0,0,2.1);
    key.position.set(-30,48,26).add(slotA.position);key.target.position.copy(slotA.position);setShadow(9);}
  for(const [s,p,c] of [[slotA,poolA,A],[slotB,poolB,B]]){p.position.x=s.position.x;p.position.z=s.position.z;if(c)p.scale.set(c.D.L*1.08,1,c.b.look.track*1.42);p.rotation.z=0;}
  poolA.visible=!!A;key.target.updateMatrixWorld();}
function setShadow(r){Object.assign(key.shadow.camera,{left:-r,right:r,top:r,bottom:-r,near:1,far:90});key.shadow.camera.updateProjectionMatrix();}
/* ---------- the cameras ---------- */
const CG=[0,.5];  /* (where the game's camera hangs from: the car's centre, about half a metre up) */
function setCam(){const a=camera.aspect;camera.near=.05;
  /* (on the backdrop the camera may go all the way under, to see the underside; on the road it stays above the salt) */
  controls.maxPolarAngle=scn==='road'?Math.PI*.495:Math.PI;
  if(scn!=='road'||cam==='look'){camera.fov=a<1?42:28;controls.enabled=true;
    const t=scn==='road'?slotA.position.clone().add(new THREE.Vector3(0,.7,0)):new THREE.Vector3(0,.7,0),
      p=scn==='studio'?new THREE.Vector3(5.2,1.5,4.3):scn==='parked'?new THREE.Vector3(6.4,2.4,6.2):t.clone().add(new THREE.Vector3(coming?5.5:-5.5,1.6,coming?-4.6:4.6));
    const hf=Math.tan(camera.fov*Math.PI/360)*a,ref=Math.tan(14*Math.PI/180)*1.6,k=Math.max(1,ref/hf);p.sub(t).multiplyScalar(k).add(t);
    camera.position.copy(p);controls.target.copy(t);camera.updateProjectionMatrix();controls.update();return;}
  controls.enabled=false;camera.fov=a<1?70:55;camera.near=.25;camera.updateProjectionMatrix();
  const c=slotA.position.clone().add(new THREE.Vector3(CG[0],CG[1],0));
  /* (Wheel cam: fixed off the car's side at wheel height, the whole side in the picture, 5.3 m out as Salt & Sand has it;
     Tracking car: low off the front quarter, the commercial shot) */
  if(cam==='wheel'){camera.fov=a<1?62:42;camera.updateProjectionMatrix();camera.position.copy(c).add(new THREE.Vector3(0,-.05,-5.3));camera.lookAt(c.clone().add(new THREE.Vector3(0,.2,0)));}
  else if(cam==='track'){camera.fov=a<1?60:40;camera.updateProjectionMatrix();camera.position.copy(c).add(new THREE.Vector3(4.6,.15,-4.2));camera.lookAt(c.clone().add(new THREE.Vector3(0,.45,0)));}
  else{const far=cam==='far';camera.position.copy(c).add(new THREE.Vector3(far?-12:-7.2,far?3.8:2.3,0));camera.lookAt(c.clone().add(new THREE.Vector3(0,.9,0)));}}

/* ---------- switching ---------- */
let busy=0;
async function show(){const my=++busy;$('loading').hidden=false;
  $('loading').firstElementChild.textContent=`Building ${label(vA)}${scn!=='studio'?' and '+label(vB):''}…`;await new Promise(r=>setTimeout(r,30));
  let a,b;try{a=await build(vA);b=scn!=='studio'?await build(vB):null;}catch(e){console.error(e);$('loading').firstElementChild.textContent='Could not build it: '+e.message;return;}
  if(my!==busy)return;
  slotA.clear();slotB.clear();A=a;B=b;slotA.add(a.root);if(b)slotB.add(b.root);
  place();applyPaint();applyLights();setCam();hud();ui();$('loading').hidden=true;}
function applyPaint(){const h=paint||(A&&A.b.paint)||'#ffffff';PAINT_U.value.set(h);
  for(const c of [A,B])if(c)c.root.traverse(m=>{if(m.isMesh&&m.userData.mat===MAT.PAINT&&m.material.color)m.material.color.set(h);});
  for(const s of document.querySelectorAll('#paints .sw'))s.classList.toggle('on',s.dataset.h===(paint||''));}
function applyLights(){const L=lights;for(const c of [A,B])if(c)c.root.traverse(m=>{if(!m.isMesh)return;const k=m.userData.lamp||lampOf(m.userData.mat);if(!k)return;
  const lvl=k==='tail'?(L?1.2:0):k==='head'?(L?3:0):0;matLights(m.material,k,lvl);});GLOW_U.value=L?2.6:0;$('lights').classList.toggle('on',!!L);}
function lampOf(id){return ({[MAT.HEAD]:'head',[MAT.LED]:'head',[MAT.HALO]:'head',[MAT.TAIL]:'tail',[MAT.AMBER]:'amber',[MAT.REV]:'rev',
  [SM.LAMPH]:'head',[SM.LENSH]:'head',[SM.REDL]:'tail',[SM.AMBERL]:'amber',[SM.LENSR]:'rev'})[id]||0;}
const fmt=n=>Math.round(n).toLocaleString('en-US');
function line(c,who){return `<span class="who">${who}</span> <b>${label(c.v)}</b> · ${fmt(c.n)} triangles · ${c.d} draws${c.tex?` · pictures ${Math.round(c.tex)} MB`:''}`;}
function hud(){if(!A)return;let h=line(A,'');
  if(scn==='road'){const px=pixels();h+=`<br>the truck about ${px} pixels on this screen`;}
  $('stats').innerHTML=h;}
/* (how big the traffic car is on screen: its box through the camera, wide by high, in the page's own pixels) */
const BOX=new THREE.Box3(),CO=new THREE.Vector3();
function pixels(){if(!A)return '0';BOX.setFromObject(slotA);camera.updateMatrixWorld();let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  for(let i=0;i<8;i++){CO.set(i&1?BOX.max.x:BOX.min.x,i&2?BOX.max.y:BOX.min.y,i&4?BOX.max.z:BOX.min.z).project(camera);
    x0=Math.min(x0,CO.x);x1=Math.max(x1,CO.x);y0=Math.min(y0,CO.y);y1=Math.max(y1,CO.y);}
  return `${Math.max(1,Math.round((x1-x0)*cv.clientWidth/2))} × ${Math.max(1,Math.round((y1-y0)*cv.clientHeight/2))}`;}

/* ---------- the loop (held by the picture tool) ---------- */
let held=false;
function frame(){if(controls.enabled)controls.update();renderer.render(scene,camera);}
function loop(){if(!held)frame();requestAnimationFrame(loop);}
function resize(){const w=cv.clientWidth,h=cv.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();setCam();}
addEventListener('resize',resize);

/* ---------- the buttons ---------- */
function closePops(except){for(const id of ['versA','versB','paints'])if(id!==except)$(id).hidden=true;for(const b of ['ab','bb','paintb'])$(b).classList.remove('on');}
function pop(id,btn){const open=$(id).hidden;closePops(id);$(id).hidden=!open;$(btn).classList.toggle('on',open);}
/* the traffic car's versions: the full Coupes, then each traffic size in its three surfaces */
{const P=$('versA');const head=t=>{const h=document.createElement('div');h.className='grp';h.textContent=t;P.appendChild(h);};
  const add=(v,t)=>{const b=document.createElement('button');b.textContent=t;b.dataset.v=v;b.onclick=()=>{closePops();vA=v;show();};P.appendChild(b);};
  head('The Rock & Mud as it is');for(const [v,t] of VERS.slice(0,3))add(v,t);
  head('Play models (the Studio 2 baked on)');for(const L of LODS)add(`t${L}_s2`,`Play ${fmt(L/1000)}k · about ${fmt(L)} triangles`);}
{const P=$('versB');for(const [v,t] of YOURS){const b=document.createElement('button');b.textContent=t;b.dataset.v=v;b.onclick=()=>{closePops();vB=v;show();};P.appendChild(b);}}
$('ab').onclick=()=>pop('versA','ab');$('bb').onclick=()=>pop('versB','bb');$('paintb').onclick=()=>pop('paints','paintb');
document.querySelectorAll('#scn button').forEach(b=>b.onclick=()=>{closePops();scn=b.dataset.s;show();});
document.querySelectorAll('#cams button').forEach(b=>b.onclick=()=>{cam=b.dataset.c;setCam();ui();hud();});
document.querySelectorAll('#dists button').forEach(b=>b.onclick=()=>{dist=+b.dataset.d;place();setCam();ui();hud();});
$('dir').onclick=()=>{coming=!coming;place();setCam();ui();hud();};
$('lights').onclick=()=>{lights=lights?0:1;applyLights();};
document.querySelectorAll('#pics button').forEach(b=>b.onclick=()=>{PIC=+b.dataset.p;show();});
{const sw=$('paints');const TRF=['#e9e9e6','#1c1d20','#a2a6aa','#1f3658','#7b1c21','#b42020','#cbb68c','#2e4a3a','#3c6fa9','#c46a1c'];
  const add=(h,t)=>{const b=document.createElement('button');b.className='sw';b.style.background=h||'conic-gradient(#7a1418 0 25%,#ece9e2 0 50%,#6a625b 0 75%,#b9a98a 0)';b.title=t;b.dataset.h=h;b.onclick=()=>{paint=h||null;applyPaint();};sw.appendChild(b);};
  add('','Factory');for(const h of TRF)add(h,h);}
/* (on a laptop: the left and right arrows step the traffic car through its versions) */
addEventListener('keydown',e=>{if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;const i=VERS.findIndex(x=>x[0]===vA),n=VERS.length;vA=VERS[(i+(e.key==='ArrowRight'?1:n-1))%n][0];show();});
function ui(){$('ab').textContent=label(vA);$('bb').hidden=true;
  for(const b of document.querySelectorAll('#scn button'))b.classList.toggle('on',b.dataset.s===scn);
  $('roadui').hidden=scn!=='road';for(const b of document.querySelectorAll('#cams button'))b.classList.toggle('on',b.dataset.c===cam);
  for(const b of document.querySelectorAll('#dists button'))b.classList.toggle('on',+b.dataset.d===dist);$('dir').textContent=coming?'Coming at you':'Going away';
  for(const b of document.querySelectorAll('#versA button'))b.classList.toggle('on',b.dataset.v===vA);for(const b of document.querySelectorAll('#versB button'))b.classList.toggle('on',b.dataset.v===vB);
  for(const b of document.querySelectorAll('#pics button'))b.classList.toggle('on',+b.dataset.p===PIC);$('lights').classList.toggle('on',!!lights);}

resize();show();loop();
window.VIEWER={THREE,scene,camera,controls,renderer,build,show,
  hold(h){held=h;},snap(){frame();return cv.toDataURL('image/png');},
  async set(o){if(o.scene)scn=o.scene;if(o.v)vA=o.v;if(o.you)vB=o.you;if(o.cam)cam=o.cam;if(o.d)dist=o.d;if(o.dir)coming=o.dir!=='going';if(o.pic)PIC=o.pic;if(o.lights!=null)lights=o.lights;await show();
    /* (the picture tool's own views round the car, in Studio: face, tail, side, rear34) */
    const V={face:[[4.4,.9,1.6],[2.1,.55,0]],tail:[[-4.4,1.0,1.6],[-2.1,.6,0]],side:[[0,.9,8.5],[0,.6,0]],rear34:[[-5.2,1.6,4.3],[0,.7,0]],under:[[2.6,-1.9,2.4],[0,.4,0]],cabin:[[1.6,1.9,2.4],[-.2,.9,0]],wheel:[[2.4,.45,2.6],[1.32,.36,.82]]}[o.view];
    if(V&&controls.enabled){camera.position.set(...V[0]);controls.target.set(...V[1]);controls.update();}},
  stats(){return {A:A&&{v:A.v,n:A.n,d:A.d,tex:A.tex},B:B&&{v:B.v,n:B.n,d:B.d},px:scn==='road'?pixels():null};}};
