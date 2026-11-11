/* =====================================================================================
   THE BAY'S GLASS, BLENDED (sas_glass). The windows and the clear lamp lenses were see-through by leaving out a share
   of their pixels, a different share each frame, for the picture's smoothing over time to even out. Standing still in
   the bay it never quite does: the glass keeps a grain of dots, which reads as crazed glass. Here, in the bay and the
   Showroom, the Studio 2 car's glass is drawn in the renderer's own glass pass instead (2 Shiftlight: after
   everything solid, blended over it), by a third build of the lit shader (GLASS) that keeps every pixel and hands
   back how much of it is glass. On the road the dotted see-through stays (the car is moving and small there).
   The third build is started the first time the bay shows a Studio 2 car, in the background, and never waited for:
   until it is ready, or if it won't build here, the dots, as before.
   Blended glass wants drawing far to near. The glass is one mesh, so it is drawn twice, cut by an upright plane
   through the cabin that faces the camera (uGSplit, in the car's own frame): the far half first, then the near half,
   so the reflections on the windows nearest you sit on top.
   ===================================================================================== */
const S2G={pass:0,main:0,left:0,ok:null,prog:null,loc:null,cam:null};
/* (asked in the middle of the solid pass, so it only looks: finishing a program there would leave it the one in use) */
function s2GlassOn(){return !!(LOOK.glass&&P_LANDG&&P_LANDG.ready&&S2G.ok!==false);}
STUDIO.glass=function(R,U,texs){
  const left=S2G.left;S2G.left=0;if(!LOOK.glass||S2G.ok===false)return;const S=s2For(APP.bi);if(!S||!(S.bodyG||S.hoodG))return;
  if(!P_LANDG){if(P_LAND&&P_LAND.ready){try{const Sh=rutShaders();P_LANDG=R.G.program('landGlass',Sh.VS,Sh.FS,Object.assign({GLASS:1},landDefs()));}
    catch(e){console.warn('blended glass: '+(e&&e.message||e));S2G.ok=false;}}return;}
  const G=R.G;
  if(!P_LANDG.ready){const par=gl.getExtension('KHR_parallel_shader_compile');if(par&&!gl.getProgramParameter(P_LANDG.p,par.COMPLETION_STATUS_KHR))return;
    /* (built: taken up here, between passes, through G.use so the renderer knows which program is in use; from the
       next frame the solid pass leaves the glass to this one) */
    try{G.use(P_LANDG);}catch(e){console.warn('blended glass: '+(e&&e.message||e));S2G.ok=false;}return;}
  if(!left)return;   /* (the solid pass drew the glass itself this frame) */
  const P=G.use(P_LANDG);gl.disable(gl.CULL_FACE);gl.enable(gl.DEPTH_TEST);G.set(P,U);G.tex(P,texs);
  if(S2G.prog!==P_LANDG){S2G.prog=P_LANDG;S2G.loc=gl.getUniformLocation(P_LANDG.p,'uGSplit');}
  S2G.cam=U.uCam;S2G.pass=1;try{this.draw(P,false,false);}finally{S2G.pass=0;}
};
