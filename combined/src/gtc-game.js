/* =====================================================================================
   THE COMBINED GAME (working title: Ground Truth Continued): its own code, after Ground Truth's (src/lr-game.js).
   Put into the page by combined/src/gtc_patch.py, just before THE BOOT.
   ===================================================================================== */
/* ---------- (build 1) THE DRIVING SCREEN'S BUTTONS STAY ON THE DRIVING SCREEN. The laptop's ON FOOT and HERON / TRUCK
   buttons showed in the Outfitter when you came into it off the road (found in testing: ON FOOT under the
   turntable). The page's body says when you're out driving (gtcRoad), and they are only there then ---------- */
{const st=document.createElement('style');st.textContent='body:not(.gtcRoad) #lrKFoot,body:not(.gtcRoad) #lrKSwap{display:none!important}';document.head.appendChild(st);
 setInterval(()=>{document.body.classList.toggle('gtcRoad',GAME.state==='drive');},200);}

/* ---------- (build 2) THE GRAPHICS CARD: WHICH ONE IT IS, AND WHAT HAPPENS WHEN IT CAN'T KEEP UP. Found on his laptop
   (11 Nov 2026, in the Claude app's browser pane, which runs on the laptop's built-in Intel graphics and not its RTX
   5060): on High the Outfitter's 913,491-triangle truck, its shade being baked and the glass shader being built were
   more than that card could do inside Windows' two-second limit, so Windows reset the card: a torn-up truck, everything
   frozen, then the page starting again. Three things here:
   1. the title names the card the page is running on, and says how to give Edge the other one when it's the built-in;
   2. the bake of the Studio 2 car's shade paces itself by how long frames are taking (Salt & Sand's own hook, S2B.per),
      and a level above Low that can't hold three frames a second steps down to Low by itself, saying why;
   3. when the card is reset anyway, the line says so in a laptop's words and the next title says what happened. ---------- */
const GTC={ft:16,last:0,slow:0,gpu:null};
function gtcGpu(){if(GTC.gpu!==null)return GTC.gpu;let s='';
  try{const g=(typeof gl!=='undefined'&&gl)||(window.__game&&window.__game.gl);if(!g)return '';const e=g.getExtension('WEBGL_debug_renderer_info');s=e?String(g.getParameter(e.UNMASKED_RENDERER_WEBGL)):'';}catch(_){}
  /* "ANGLE (NVIDIA, NVIDIA GeForce RTX 5060 Laptop GPU (0x00002D19) Direct3D11 vs_5_0 ps_5_0, D3D11)": the card's own name */
  const a=/^ANGLE \((.*)\)$/.exec(s);if(a){const p=a[1].split(',');s=(p[1]||p[0]).trim();}
  GTC.gpu=s.replace(/\s*\(0x[0-9A-Fa-f]+\)/,'').replace(/\s+(Direct3D|OpenGL|Vulkan|Metal).*$/,'').trim();return GTC.gpu;}
const gtcBuiltIn=()=>{const n=gtcGpu();return /intel/i.test(n)&&!/\barc\b/i.test(n);};
/* how long frames are taking (a running figure, in ms) */
(function gtcPace(now){if(GTC.last)GTC.ft+=(Math.min(2000,now-GTC.last)-GTC.ft)*.2;GTC.last=now;
  /* a level above Low that the card can't hold (under about three frames a second for a while, once the game is up):
     back to Low before Windows resets the card. Not in a test browser, where every frame is that slow. */
  try{const L=$('loading'),up=(!L||L.hidden)&&(GAME.state==='menu'||GAME.state==='drive');
    if(up&&!touchy&&!navigator.webdriver&&GFX.level!=='low'&&GFX.level!=='mobile'&&GTC.ft>300){
      if(++GTC.slow>8){GTC.slow=-1e9;store.set('gtc-lost',String(GFX.level).toUpperCase()+'|slow');if(L){L.hidden=false;L.textContent='This graphics card can’t keep up on '+String(GFX.level).toUpperCase()+'. Going back to the Low graphics level…';}setTimeout(()=>setGfx('low'),1800);}}
    else if(GTC.slow>0)GTC.slow--;}catch(_){}
  requestAnimationFrame(gtcPace);})(0);
/* may the Studio 2 car's bake do its bit this frame, and how much (S2B.per: directions a frame; 0 leaves Salt & Sand's 4) */
function gtcBakeOk(){const ft=GTC.ft;
  if(ft>140){S2B.per=1;return GFX.frame%4===0;}
  if(ft>70){S2B.per=1;return (GFX.frame&1)===0;}
  S2B.per=ft>34?1:ft>22?2:0;return true;}
/* the card was reset under the page (the engine's own handler shows this line, then starts the page again) */
function gtcLost(){try{store.set('gtc-lost',String(GFX.level).toUpperCase()+'|'+(GAME.state==='drive'?'out driving':showActive()?'in the Outfitter':''));}catch(_){}
  return touchy?'The phone restarted its graphics. Starting again…':'The graphics card stopped answering and Windows reset it. Starting again on the Low graphics level…';}
/* the title's corner: the card, a way out when it's the built-in one, and what happened last time if the card gave up */
{const st=document.createElement('style');st.textContent='#gtcGpu{position:absolute;left:14px;bottom:10px;max-width:54ch;text-align:left;font:12px/1.4 system-ui,sans-serif;letter-spacing:.03em;color:#f4ead8;opacity:.86;text-shadow:0 1px 6px rgba(0,0,0,.6)}#gtcGpu b{display:block;font-weight:600}#gtcGpu span{display:block;color:#ffdca8}#gtcGpu i{display:block;font-style:normal;color:#ffb38a}';document.head.appendChild(st);
 setInterval(()=>{const T=document.getElementById('lrTitle');if(!T||T.querySelector('#gtcGpu'))return;const n=gtcGpu();if(!n)return;
   const d=document.createElement('div');d.id='gtcGpu';const add=(tag,t)=>{const e=document.createElement(tag);e.textContent=t;d.appendChild(e);};
   add('b','Graphics card: '+n);
   if(gtcBuiltIn()&&!touchy)add('span','This is the laptop’s built-in graphics. If it has an NVIDIA card, Edge isn’t using it: Windows Settings › System › Display › Graphics › Microsoft Edge › Options › High performance, then close Edge and open it again.');
   let lost='';try{lost=store.get('gtc-lost','')||'';if(lost)store.set('gtc-lost','');}catch(_){}
   if(lost){const p=String(lost).split('|');add('i',p[1]==='slow'?'Last time this card couldn’t keep up on '+p[0]+', so the game went back to Low.':'Last time the graphics card was reset on '+p[0]+(p[1]?' '+p[1]:'')+', so this start is on Low.');}
   T.appendChild(d);},400);}
