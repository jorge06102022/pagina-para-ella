/* ═══════════════════════════════════════════════════════════════════
   DETÉN EL TIEMPO — script.js  [NARRATIVE EDITION]
   "Tú no tomas fotos. Eres la foto."
   ─────────────────────────────────────────────────────────────────

   ✏️  PERSONALIZACIÓN — TODO LO QUE DEBES EDITAR ESTÁ AQUÍ:
═══════════════════════════════════════════════════════════════════ */

"use strict";

/* ──────────────────────────────────────────────────────────────
   ✏️  CONFIG — EDITA AQUÍ
────────────────────────────────────────────────────────────── */

// Nombre de la cumpleañera (aparece en la obertura y al final)
const NAME = "negraaaaa bella";

// Fecha que aparece en el "archivo recuperado"
const ARCHIVE_DATE = "— 2024 · rollo sin revelar —";

// Los 5 "archivos" encontrados: fotos de ella, vistas por alguien más.
// Los captions están escritos en primera persona del fotógrafo/observador.
// No son fotos que ella tomó. Son fotos DE ella.
const MEMORIES = [
  {
    img: "foto1.jpeg",
    caption: "Hay miradas que capturan momentos…pero la tuya tiene algo más…captura recuerdos..",
    meta: "DSCF_0001 · apertura f/1.8",
    rot: "-2.2deg"
  },
  {
    img: "foto2.jpeg",
    caption: "Y de todas las coincidencias de la vida…una de las que más agradezco…es haberte conocido amiga mia .",
    meta: "DSCF_0002 · luz natural",
    rot: "1.8deg"
  },
  {
    img: "foto3.jpeg",
    caption: "Hay personas que simplemente iluminan el lugar donde están… y tú eres una de ellas",
    meta: "DSCF_0003 · sin flash",
    rot: "-0.8deg"
  },
  {
    img: "foto4.jpeg",
    caption: "No sé si es tu sonrisa…tu forma de ser…o simplemente tú…pero tienes algo que hace todo más bonito..",
    meta: "DSCF_0004 · foco manual",
    rot: "2.4deg"
  },
  {
    img: "foto5.jpeg",
    caption: "Entre todas las cosas bonitas que tiene el mundo…tú siempre logras destacar..",
    meta: "DSCF_0005 · último del rollo",
    rot: "-1.6deg"
  }
];

// La foto final: "el archivo que no debería existir"
// Es la más íntima. El caption rompe la cuarta pared.
const FINAL_PHOTO = {
  img: "especial.jpeg",
  caption: "Entre risas, momentos simples y buenas compañías…se crean recuerdos que se quedan para siempre.Y esta foto es uno de ellos.",
};

// Texto del giro en la obertura (aparece después de "detener el tiempo")
// Debe sentirse como un cambio de perspectiva
const TWIST_TEXT =
  "Creías que hablábamos de ti como fotógrafa.\n" +
  "Pero alguien ha estado capturando momentos de ti\n" +
  "todo este tiempo.";

// Declaración final (no genérica)
const FINAL_DECLARATION_1 = "Hoy no es solo tu cumpleaños.";
const FINAL_DECLARATION_2 = "Es el día en que el mundo cumple un año más contigo en él.";
const FINAL_SIGNATURE     = "gracias por existir en voz alta.";
const FINAL_FROM          = "· esta experiencia fue hecha para ti, solo para ti ·";

/* ────────────────────────────────────────────────────────────── */


/* ══════════════════════════════════════════════════════════════
   ESTADO GLOBAL
═══════════════════════════════════════════════════════════════ */
const S = {
  memIdx:     0,
  audioCtx:   null,
  masterGain: null,
  rafs:       {},
  mouse:      { x: innerWidth / 2,  y: innerHeight / 2 },
  trail:      { x: innerWidth / 2,  y: innerHeight / 2 },
  twTimers:   [],   // typewriter timers
  tcInterval: null, // timecode interval
};

/* ══════════════════════════════════════════════════════════════
   TIMECODE (detalle cinematográfico)
═══════════════════════════════════════════════════════════════ */
function startTimecode() {
  const el = document.getElementById('timecode');
  if (!el) return;
  let f = 0;
  S.tcInterval = setInterval(() => {
    f++;
    const fr  = f % 24;
    const sec = Math.floor(f / 24) % 60;
    const min = Math.floor(f / 24 / 60) % 60;
    const hr  = Math.floor(f / 24 / 3600) % 24;
    el.textContent = [hr, min, sec].map(n => String(n).padStart(2,'0')).join(':')
                   + ':' + String(fr).padStart(2,'0');
  }, 1000 / 24);
}


/* ══════════════════════════════════════════════════════════════
   CURSOR
═══════════════════════════════════════════════════════════════ */
const $cursor = document.getElementById('cursor');
const $trail  = document.getElementById('cursorTrail');

document.addEventListener('mousemove', e => {
  S.mouse.x = e.clientX; S.mouse.y = e.clientY;
  $cursor.style.left = e.clientX + 'px';
  $cursor.style.top  = e.clientY + 'px';
});
(function lerpTrail() {
  S.trail.x += (S.mouse.x - S.trail.x) * 0.10;
  S.trail.y += (S.mouse.y - S.trail.y) * 0.10;
  $trail.style.left = S.trail.x + 'px';
  $trail.style.top  = S.trail.y + 'px';
  requestAnimationFrame(lerpTrail);
})();
document.addEventListener('touchstart', () => {
  $cursor.style.display = 'none';
  $trail.style.display  = 'none';
}, { once: true });


/* ══════════════════════════════════════════════════════════════
   WEB AUDIO ENGINE
═══════════════════════════════════════════════════════════════ */
function audio() {
  if (!S.audioCtx) {
    S.audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
    S.masterGain = S.audioCtx.createGain();
    S.masterGain.gain.value = 0.8;
    S.masterGain.connect(S.audioCtx.destination);
  }
  return { ctx: S.audioCtx, out: S.masterGain };
}

function reverb(ctx, dur = 1.5, dec = 2.2) {
  const len = ctx.sampleRate * dur;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/len, dec);
  }
  const conv = ctx.createConvolver(); conv.buffer = buf; return conv;
}

/* Clic de obturador: mecánico + cuerpo + sala */
function sndShutter() {
  try {
    const { ctx, out } = audio(); const t = ctx.currentTime;
    const n   = ctx.createBuffer(1, ~~(ctx.sampleRate*.12), ctx.sampleRate);
    const nd  = n.getChannelData(0);
    for (let i=0;i<nd.length;i++) nd[i] = Math.random()*2-1;
    const ns  = ctx.createBufferSource(); ns.buffer = n;
    const hpf = ctx.createBiquadFilter(); hpf.type='highpass'; hpf.frequency.value=700;
    const bpf = ctx.createBiquadFilter(); bpf.type='bandpass'; bpf.frequency.value=4000; bpf.Q.value=.9;
    const ng  = ctx.createGain(); ng.gain.setValueAtTime(.42,t); ng.gain.exponentialRampToValueAtTime(.001,t+.1);
    ns.connect(hpf); hpf.connect(bpf); bpf.connect(ng);
    const bo  = ctx.createOscillator(); bo.type='sine';
    bo.frequency.setValueAtTime(180,t); bo.frequency.exponentialRampToValueAtTime(50,t+.06);
    const bg  = ctx.createGain(); bg.gain.setValueAtTime(.2,t); bg.gain.exponentialRampToValueAtTime(.001,t+.07);
    bo.connect(bg);
    const rv = reverb(ctx,.7,3); const rvg = ctx.createGain(); rvg.gain.value=.15;
    ng.connect(rv); rv.connect(rvg); rvg.connect(out);
    ng.connect(out); bg.connect(out);
    ns.start(t); bo.start(t); bo.stop(t+.09);
  } catch(e) {}
}

/* Chime con armónicos y reverb */
function sndChime(freq=440, dur=1.4, vol=.08) {
  try {
    const { ctx, out } = audio(); const t = ctx.currentTime;
    [1,2,3].forEach((m,i) => {
      const osc = ctx.createOscillator(); osc.type='sine'; osc.frequency.value=freq*m;
      const g   = ctx.createGain(); const v = vol/(i+1);
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v,t+.06);
      g.gain.exponentialRampToValueAtTime(.0001,t+dur*(1-i*.18));
      osc.connect(g);
      if (i===0) { const rv=reverb(ctx,1.2,2.5); const rvg=ctx.createGain(); rvg.gain.value=.24;
                   g.connect(rv); rv.connect(rvg); rvg.connect(out); }
      g.connect(out); osc.start(t); osc.stop(t+dur+.2);
    });
  } catch(e) {}
}

/* Sonido de glitch / ruptura */
function sndGlitch() {
  try {
    const { ctx, out } = audio(); const t = ctx.currentTime;
    [320,290,260].forEach((f,i) => {
      const tt = t+i*.18;
      const osc= ctx.createOscillator(); osc.type='sawtooth'; osc.frequency.value=f;
      const lpf= ctx.createBiquadFilter(); lpf.type='lowpass'; lpf.frequency.value=700;
      const g  = ctx.createGain();
      g.gain.setValueAtTime(.06,tt); g.gain.exponentialRampToValueAtTime(.0001,tt+.5);
      osc.connect(lpf); lpf.connect(g); g.connect(out);
      osc.start(tt); osc.stop(tt+.55);
    });
    // Rumble bajo
    const osc=ctx.createOscillator(); osc.type='sine'; osc.frequency.setValueAtTime(40,t);
    const g=ctx.createGain(); g.gain.setValueAtTime(.12,t); g.gain.exponentialRampToValueAtTime(.001,t+1.2);
    osc.connect(g); g.connect(out); osc.start(t); osc.stop(t+1.3);
  } catch(e) {}
}

/* Ambiente de sala: rumor muy bajo */
function sndAmbient() {
  try {
    const { ctx, out } = audio();
    const sz  = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1,sz,ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i=0;i<sz;i++) d[i]=Math.random()*2-1;
    const src = ctx.createBufferSource(); src.buffer=buf; src.loop=true;
    const lpf = ctx.createBiquadFilter(); lpf.type='lowpass'; lpf.frequency.value=180;
    const g   = ctx.createGain(); g.gain.value=.016;
    src.connect(lpf); lpf.connect(g); g.connect(out); src.start();
  } catch(e) {}
}


/* ══════════════════════════════════════════════════════════════
   TYPEWRITER ORGÁNICO
═══════════════════════════════════════════════════════════════ */
function typewriter(el, text, opts = {}) {
  const { speed=36, delay=0, cursorEl=null, showInline=false, onDone=null } = opts;
  el.textContent = '';
  if (cursorEl) cursorEl.style.opacity='1';
  S.twTimers.forEach(clearTimeout); S.twTimers=[];

  let cum = delay;
  for (let i=0; i<text.length; i++) {
    const ch = text[i];
    let d = speed + (Math.random()-.5)*18;
    if (ch==='.')  d += 180+Math.random()*80;
    if (ch===',')  d += 85+Math.random()*35;
    if (ch==='…')  d += 260+Math.random()*100;
    if (ch==='\n') d += 120;
    if (ch===' ')  d *= .6;
    cum += d;

    S.twTimers.push(setTimeout(((c,idx)=>()=>{
      el.textContent += c==='\\n'?'\n':c;
      if (showInline && idx===0) {
        const cur=document.createElement('span');
        cur.className='caption-cursor-inline';
        el.parentElement?.appendChild(cur);
      }
      if (idx===text.length-1) {
        if (cursorEl) setTimeout(()=>cursorEl.style.opacity='0',1200);
        if (showInline) setTimeout(()=>{
          const c=el.parentElement?.querySelector('.caption-cursor-inline');
          if(c){c.style.animation='none';c.style.opacity='0';}
        },1200);
        if (onDone) setTimeout(onDone,400);
      }
    })(ch,i), cum));
  }
}


/* ══════════════════════════════════════════════════════════════
   TRANSICIONES DE PANTALLA
═══════════════════════════════════════════════════════════════ */
function fadeIn(id, delay=0) {
  const el=document.getElementById(id); if(!el) return;
  setTimeout(()=>{
    el.classList.remove('active');
    el.style.transition='none';
    el.style.opacity='0';
    el.classList.add('active');
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      el.style.transition='opacity 1.6s cubic-bezier(0.16,1,0.3,1)';
      el.style.opacity='1';
      setTimeout(()=>{ el.style.transition=''; el.style.opacity=''; }, 1700);
    }));
  }, delay);
}

function fadeOut(id) {
  return new Promise(res=>{
    const el=document.getElementById(id); if(!el){res();return;}
    el.style.transition='opacity 1.1s cubic-bezier(0.4,0,1,1)';
    el.style.opacity='0';
    setTimeout(()=>{
      el.style.transition=''; el.style.opacity='';
      el.classList.remove('active'); res();
    }, 1150);
  });
}

/* Negro total entre escenas */
function blackout(duration=600) {
  return new Promise(res=>{
    const b=document.getElementById('blackout');
    b.classList.add('on');
    setTimeout(()=>{ b.classList.remove('on'); setTimeout(res,400); }, duration);
  });
}


/* ══════════════════════════════════════════════════════════════
   FLASH
═══════════════════════════════════════════════════════════════ */
function flash(cb) {
  const ov=document.getElementById('flashOverlay');
  const bl=document.getElementById('flashBloom');
  ov.style.transition='opacity .06s'; ov.style.opacity='1';
  if(bl){ bl.style.transition='opacity .06s,transform .06s'; bl.style.opacity='1'; bl.style.transform='scale(3)'; }
  setTimeout(()=>{
    ov.style.transition='opacity .55s'; ov.style.opacity='0';
    if(bl){ bl.style.transition='opacity .5s,transform .5s'; bl.style.opacity='0'; bl.style.transform='scale(.5)'; }
    setTimeout(()=>{ ov.style.transition=''; if(bl)bl.style.transition=''; if(cb)cb(); },570);
  },90);
}

/* Freeze */
function freeze(ms=650) {
  const f=document.getElementById('freezeOverlay');
  f.classList.add('frozen');
  setTimeout(()=>f.classList.remove('frozen'),ms);
}


/* ══════════════════════════════════════════════════════════════
   SISTEMA DE PARTÍCULAS (canvas)
═══════════════════════════════════════════════════════════════ */
function initParticles(canvasId, key, opts={}) {
  const cv=document.getElementById(canvasId); if(!cv) return;
  const cx=cv.getContext('2d');
  const resize=()=>{ cv.width=innerWidth; cv.height=innerHeight; };
  resize(); window.addEventListener('resize',resize);

  const pts=[];
  for(let i=0;i<(opts.count||120);i++){
    const layer=Math.random();
    pts.push({ x:Math.random()*cv.width, y:Math.random()*cv.height,
               vx:(Math.random()-.5)*(opts.speed||.2)*(.3+layer*.7),
               vy:(Math.random()-.5)*(opts.speed||.2)*(.3+layer*.7),
               r:(layer*1.6+.3)*(opts.sz||1),
               baseOp:.08+layer*.5, phase:Math.random()*Math.PI*2,
               freq:.004+Math.random()*.012, layer });
  }

  let t=0;
  (function draw() {
    S.rafs[key]=requestAnimationFrame(draw);
    cx.clearRect(0,0,cv.width,cv.height); t+=.016;
    pts.forEach(p=>{
      if(opts.mouse){
        const dx=S.mouse.x-p.x, dy=S.mouse.y-p.y, dist=Math.hypot(dx,dy);
        if(dist<110&&dist>0){ const f=(1-dist/110)*.022*p.layer; p.vx-=dx/dist*f; p.vy-=dy/dist*f; }
      }
      p.vx+=Math.sin(t*.8+p.phase)*.0012; p.vy+=Math.cos(t*.6+p.phase*1.3)*.0012;
      p.vx*=.994; p.vy*=.994;
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<-4) p.x=cv.width+4; if(p.x>cv.width+4)  p.x=-4;
      if(p.y<-4) p.y=cv.height+4; if(p.y>cv.height+4) p.y=-4;
      const alpha=Math.max(.03,Math.min(.8,p.baseOp+Math.sin(t*p.freq*60+p.phase)*.17));
      if(p.r>1.0){
        const gr=cx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*2.4);
        gr.addColorStop(0,`rgba(201,168,76,${alpha})`); gr.addColorStop(1,`rgba(201,168,76,0)`);
        cx.beginPath(); cx.arc(p.x,p.y,p.r*2.4,0,Math.PI*2); cx.fillStyle=gr; cx.fill();
      } else {
        cx.beginPath(); cx.arc(p.x,p.y,p.r,0,Math.PI*2);
        cx.fillStyle=`rgba(201,168,76,${alpha*.6})`; cx.fill();
      }
    });
  })();
}

function stopParticles(key) {
  if(S.rafs[key]){ cancelAnimationFrame(S.rafs[key]); S.rafs[key]=null; }
}

/* Partículas ascendentes para el final */
function initFinalCanvas() {
  const cv=document.getElementById('finalCanvas'); if(!cv) return;
  const cx=cv.getContext('2d');
  cv.width=innerWidth; cv.height=innerHeight;
  const pts=[];
  for(let i=0;i<75;i++){
    pts.push({ x:Math.random()*cv.width, y:cv.height+Math.random()*80,
               vx:(Math.random()-.5)*.45, vy:-(Math.random()*.6+.22),
               r:Math.random()*2.3+.4, op:Math.random()*.55+.1,
               maxY:-(Math.random()*200+80), ph:Math.random()*Math.PI*2 });
  }
  (function draw() {
    S.rafs.final=requestAnimationFrame(draw);
    cx.clearRect(0,0,cv.width,cv.height);
    pts.forEach(p=>{
      p.x+=p.vx+Math.sin(p.ph+Date.now()*.001)*.28;
      p.y+=p.vy; p.op-=.0007;
      if(p.y<p.maxY||p.op<=0){
        p.x=Math.random()*cv.width; p.y=cv.height+10;
        p.op=Math.random()*.5+.1; p.vy=-(Math.random()*.6+.22);
      }
      const gr=cx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*2);
      gr.addColorStop(0,`rgba(201,168,76,${p.op})`); gr.addColorStop(1,`rgba(201,168,76,0)`);
      cx.beginPath(); cx.arc(p.x,p.y,p.r,0,Math.PI*2); cx.fillStyle=gr; cx.fill();
    });
  })();
}


/* ══════════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  startTimecode();
  buildPolaroids();
  // Inyectar nombre en la escena final
  const fn = document.getElementById('finalName');
  if (fn) fn.textContent = NAME;
  // Textos estáticos inyectados
  const fd1 = document.getElementById('fdecl1');
  const fd2 = document.getElementById('fdecl2');
  const fs  = document.getElementById('finalSig');
  const ff  = document.getElementById('finalFrom');
  if(fd1) fd1.textContent = FINAL_DECLARATION_1;
  if(fd2) fd2.textContent = FINAL_DECLARATION_2;
  if(fs)  fs.textContent  = FINAL_SIGNATURE;
  if(ff)  ff.textContent  = FINAL_FROM;

  // Disparo inicial de cámara (negro total, sorprende)
  setTimeout(()=>{ sndShutter(); }, 300);

  // Iniciar secuencia de intro
  setTimeout(startOverture, 800);
});


/* ══════════════════════════════════════════════════════════════
   ESCENA 1 — OBERTURA
═══════════════════════════════════════════════════════════════ */
function startOverture() {
  const lines  = ['ovl1','ovl2','ovl3','ovl4'];
  const delays = [0, 1800, 3200, 4400];
  const freqs  = [523, 659, 784, 0];  // la última sin chime (más dramático)

  lines.forEach((id, i) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.classList.add('visible');
      if (freqs[i]) sndChime(freqs[i], 1.2, .05);
    }, delays[i]);
  });

  // Pausa larga. El usuario cree que terminó. Luego: el giro.
  setTimeout(() => {
    const tw  = document.getElementById('ovTwist');
    const twt = document.getElementById('ovTwistText');
    if (tw && twt) {
      tw.classList.add('visible');
      typewriter(twt, TWIST_TEXT, { speed: 42, delay: 200 });
    }
    sndChime(370, 3.0, .055);  // nota baja, inquietante
  }, 6000);

  // Botón aparece después del typewriter del giro
  setTimeout(() => {
    const btn = document.getElementById('enterBtn');
    if (btn) btn.classList.add('visible');
  }, 9000);
}


/* ══════════════════════════════════════════════════════════════
   ESCENA 1 → ESCENA 2 (ARCHIVO)
═══════════════════════════════════════════════════════════════ */
async function goToScene2() {
  sndChime(1047, 2.5, .07);
  await fadeOut('scene-overture');
  await blackout(400);

  fadeIn('scene-archive');
  sndAmbient();

  // Construir thumbnails
  buildThumbGrid();

  // Animar la UI del archivo
  setTimeout(() => {
    const screen = document.querySelector('.archive-screen');
    if (screen) screen.classList.add('visible');

    // Fecha del archivo
    const dateEl = document.getElementById('archiveDate');
    if (dateEl) {
      setTimeout(() => typewriter(dateEl, ARCHIVE_DATE, { speed: 55, delay: 0 }), 400);
    }
  }, 500);

  // Thumbnails aparecen uno a uno, como si se estuvieran cargando
  setTimeout(() => revealThumbs(), 1200);

  // Caption debajo
  setTimeout(() => {
    const cap = document.getElementById('archiveCaption');
    if (cap) {
      cap.classList.add('visible');
      typewriter(cap,
        'Encontré este rollo sin revelar.\n' +
        'Hay cinco fotos.\n' +
        'Todas son de la misma persona.',
        { speed: 48, delay: 0 });
    }
  }, 3800);

  // Botón para abrir
  setTimeout(() => {
    const btn = document.getElementById('archiveBtn');
    if (btn) {
      btn.classList.add('visible');
      btn.style.opacity = '1';
    }
  }, 7000);
}
window.goToScene2 = goToScene2;


/* Construir grid de thumbnails */
function buildThumbGrid() {
  const grid = document.getElementById('thumbGrid');
  if (!grid) return;
  grid.innerHTML = '';
  MEMORIES.forEach((_, i) => {
    const item = document.createElement('div');
    item.className = 'thumb-item';
    item.id = `thumb${i}`;
    // Solo número, sin imagen — cuadros negros como rollos sin revelar
    item.innerHTML = `
      <div class="thumb-blur-overlay"></div>
      <span class="thumb-n">0${i+1}</span>
    `;
    grid.appendChild(item);
  });
}

function revealThumbs() {
  MEMORIES.forEach((_, i) => {
    setTimeout(() => {
      const item = document.getElementById(`thumb${i}`);
      if (item) {
        item.classList.add('appear');
        // Actualizar filename en la barra
        setTimeout(() => {
          const fn = document.getElementById('archFilename');
          if (fn) fn.textContent = `DSCF_000${i+1}.RAF`;
        }, 200);
        sndChime(400 + i*60, .6, .03);
      }
    }, i * 350);
  });

  // Al final, activar el primero
  setTimeout(() => {
    const first = document.getElementById('thumb0');
    if (first) first.classList.add('active');
  }, MEMORIES.length * 350 + 400);
}


/* ══════════════════════════════════════════════════════════════
   ESCENA 2 → ESCENA 3 (POLAROIDS)
═══════════════════════════════════════════════════════════════ */
async function goToScene3() {
  sndShutter();
  freeze(700);
  flash(async () => {
    await fadeOut('scene-archive');
    await blackout(300);
    fadeIn('scene-memories');

    // Mostrar visor
    setTimeout(() => {
      const vf = document.querySelector('.viewfinder-overlay');
      if (vf) vf.classList.add('show');
    }, 400);

    // Partículas sutiles
    initParticles('particleCanvas', 'memories', { count: 90, speed: .16, sz: .85, mouse: false });

    // Botón
    setTimeout(() => {
      const btn = document.getElementById('nextMemoryBtn');
      if (btn) btn.classList.add('visible');
    }, 600);

    setTimeout(() => showMemory(0), 400);
  });
}
window.goToScene3 = goToScene3;


/* ══════════════════════════════════════════════════════════════
   BUILD POLAROIDS
═══════════════════════════════════════════════════════════════ */
function buildPolaroids() {
  const stage = document.getElementById('polaroidStage'); if(!stage) return;
  MEMORIES.forEach((mem, i) => {
    const div = document.createElement('div');
    div.className = 'polaroid'; div.id = `pol${i}`;
    div.style.setProperty('--rot', mem.rot || '0deg');
    div.innerHTML = `
      <div class="polaroid-light-leak"></div>
      <div class="polaroid-img-wrap" id="iw${i}">
        <div class="polaroid-reveal-overlay"></div>
        <img class="polaroid-img" src="${mem.img}" alt="foto ${i+1}"
             onerror="this.parentElement.classList.add('no-img')"/>
        <div class="img-placeholder-text">${mem.img}</div>
      </div>
      <p class="polaroid-caption" id="cap${i}"></p>
      <span class="polaroid-meta">${mem.meta}</span>
    `;
    stage.appendChild(div);
    const img = div.querySelector('.polaroid-img');
    img.addEventListener('load',  () => img.classList.add('loaded'));
    img.addEventListener('error', () => img.classList.add('loaded'));
  });
}


/* ══════════════════════════════════════════════════════════════
   MOSTRAR RECUERDO
═══════════════════════════════════════════════════════════════ */
function showMemory(idx) {
  document.querySelectorAll('.polaroid').forEach(p => {
    if (!p.classList.contains('exit')) { p.classList.remove('reveal'); p.classList.add('exit'); }
  });

  // Actualizar thumbnail activo
  document.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
  const activeThumb = document.getElementById(`thumb${idx}`);
  if (activeThumb) activeThumb.classList.add('active');

  const pol = document.getElementById(`pol${idx}`); if(!pol) return;

  setTimeout(() => {
    pol.classList.remove('exit'); pol.style.zIndex = String(10+idx);
    setTimeout(() => {
      pol.classList.add('reveal');
      sndChime([523,587,659,698,784][idx]||523, 1.4, .06);

      const wrap = document.getElementById(`iw${idx}`);
      setTimeout(() => { if(wrap) wrap.classList.add('developed'); }, 300);

      const capEl = document.getElementById(`cap${idx}`);
      typewriter(capEl, MEMORIES[idx].caption, { speed: 32, delay: 500, showInline: true });

    }, 110);
  }, 170);

  // Progreso
  const fill    = document.getElementById('memProgressFill');
  const counter = document.getElementById('memCounter');
  if (fill)    fill.style.width = `${((idx+1)/MEMORIES.length)*100}%`;
  if (counter) counter.textContent = `${'I II III IV V'.split(' ')[idx]} · ${MEMORIES.length}`;
}


/* ══════════════════════════════════════════════════════════════
   SIGUIENTE RECUERDO → RUPTURA
═══════════════════════════════════════════════════════════════ */
function showNextMemory() {
  S.memIdx++;
  if (S.memIdx < MEMORIES.length) {
    sndShutter(); freeze(500);
    flash(() => showMemory(S.memIdx));
  } else {
    // Último: ir a la ruptura
    sndShutter(); freeze(500);
    flash(async () => {
      await fadeOut('scene-memories');
      stopParticles('memories');
      // Ocultar visor
      const vf = document.querySelector('.viewfinder-overlay');
      if (vf) vf.classList.remove('show');
      await blackout(500);
      showSceneBreak();
    });
  }
}
window.showNextMemory = showNextMemory;


/* ══════════════════════════════════════════════════════════════
   ESCENA 4 — RUPTURA (el tiempo se quiebra)
═══════════════════════════════════════════════════════════════ */
function showSceneBreak() {
  fadeIn('scene-break');
  sndGlitch();

  // Activar SVG glitch filter en el body
  document.body.style.filter = 'url(#f-glitch)';
  const anim = document.getElementById('glitchAnim');
  if (anim) anim.beginElement();

  // Quitar glitch del body después
  setTimeout(() => { document.body.style.filter = ''; }, 600);

  const seq = [
    { id: 'brkL1', delay: 200  },
    { id: 'brkL2', delay: 1200 },
    { id: 'brkL3', delay: 2400 },
    { id: 'brkL4', delay: 4000, sound: true },
    { id: 'brkL5', delay: 5200 },
  ];

  seq.forEach(({ id, delay, sound }) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.classList.add('visible');
      if (sound) sndChime(330, 3.0, .06);
    }, delay);
  });

  // Silencio → revelación
  setTimeout(async () => {
    await fadeOut('scene-break');
    await blackout(800);
    showSceneReveal();
  }, 8500);
}


/* ══════════════════════════════════════════════════════════════
   ESCENA 5 — REVELACIÓN (cuarta pared)
═══════════════════════════════════════════════════════════════ */
function showSceneReveal() {
  fadeIn('scene-reveal');
  sndChime(370, 4.5, .06);

  // Polaroid final aparece lentamente
  setTimeout(() => {
    const pol = document.getElementById('revealPolaroid');
    if (pol) pol.classList.add('show');

    // Imagen
    const img = document.getElementById('revealImg');
    if (img) {
      img.addEventListener('load',  () => img.classList.add('loaded'));
      img.addEventListener('error', () => img.classList.add('loaded'));
      if (img.complete) img.classList.add('loaded');
    }

    // Revelar imagen
    setTimeout(() => {
      const w = document.getElementById('revealImgWrap');
      if (w) w.classList.add('developed');
    }, 900);

    // Caption: la más íntima — rompe la cuarta pared
    const capEl  = document.getElementById('revealCaption');
    const curEl  = document.getElementById('captionCursor');
    typewriter(capEl, FINAL_PHOTO.caption, { speed: 44, delay: 1400, cursorEl: curEl });

  }, 900);

  // Declaración del giro: "No eres quien detiene el tiempo. Eres el momento."
  setTimeout(() => {
    const d1 = document.getElementById('rdL1');
    if (d1) d1.classList.add('visible');
  }, 4500);

  setTimeout(() => {
    const d2 = document.getElementById('rdL2');
    if (d2) d2.classList.add('visible');
    sndChime(523, 3.0, .07);
  }, 6200);

  // Ir al final
  setTimeout(async () => {
    await fadeOut('scene-reveal');
    await blackout(900);
    showSceneFinal();
  }, 11000);
}


/* ══════════════════════════════════════════════════════════════
   ESCENA 6 — FINAL (declaración emocional)
═══════════════════════════════════════════════════════════════ */
function showSceneFinal() {
  fadeIn('scene-final');
  initFinalCanvas();

  const seq = [
    { id: 'gl-top',   delay: 300  },
    { id: 'fdecl1',   delay: 800  },
    { id: 'fdecl2',   delay: 2200 },
    { id: 'gl-mid',   delay: 3600 },
    { id: 'finalName',delay: 4200 },
    { id: 'gl-bot',   delay: 5200 },
    { id: 'finalSig', delay: 6000 },
    { id: 'finalFrom',delay: 7400 },
  ];

  seq.forEach(({ id, delay }) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.classList.add('visible');
    }, delay);
  });

  // Easter egg
  setTimeout(() => {
    const er = document.querySelector('.easter-roll');
    if (er) er.classList.add('visible');
  }, 10000);

  // Cascada de chimes: acorde de celebración
  const celebFreqs = [523, 659, 784, 880, 1047, 1175];
  celebFreqs.forEach((f, i) => {
    setTimeout(() => sndChime(f, 2.4, .06), 800 + i * 400);
  });

  // Segundo acorde más tarde
  setTimeout(() => {
    [784, 988, 1175].forEach((f,i) => setTimeout(() => sndChime(f,3.0,.04), i*200));
  }, 6500);

  // Shutter muy suave en el nombre (como si alguien lo capturara)
  setTimeout(() => sndShutter(), 4400);
}
