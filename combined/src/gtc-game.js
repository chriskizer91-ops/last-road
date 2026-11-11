/* =====================================================================================
   THE COMBINED GAME (working title: Ground Truth Continued): its own code, after Ground Truth's (src/lr-game.js).
   Put into the page by combined/src/gtc_patch.py, just before THE BOOT.
   ===================================================================================== */
/* ---------- (build 1) THE DRIVING SCREEN'S BUTTONS STAY ON THE DRIVING SCREEN. The laptop's ON FOOT and HERON / TRUCK
   buttons showed in the Outfitter when you came into it off the road (found in testing: ON FOOT under the
   turntable). The page's body says when you're out driving (gtcRoad), and they are only there then ---------- */
{const st=document.createElement('style');st.textContent='body:not(.gtcRoad) #lrKFoot,body:not(.gtcRoad) #lrKSwap{display:none!important}';document.head.appendChild(st);
 setInterval(()=>{document.body.classList.toggle('gtcRoad',GAME.state==='drive');},200);}
