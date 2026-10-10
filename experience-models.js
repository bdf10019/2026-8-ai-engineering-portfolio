import * as T from "./assets/vendor/three.module.min.js";
import { clamp, inspectionAt, signalAt, retailAt, knowledgeAt, opsAt, forgeAt, simopsAt, riskAt, planningAt, PLANNING_BASELINE } from "./experience-state.js";

const colors = { body: 0xbccbc0, dark: 0x233a36, steel: 0x82978f, rubber: 0x263a39, mint: 0x94d6bd, orange: 0xd98551, cream: 0xe0dfc9 };
function builder(name) {
  const root = new T.Group(); root.name = name;
  const dissolve = { value: 0 }, materials = [], geometries = new Map();
  function material(color, metalness = .2, roughness = .42, extra = {}) {
    const m = new T.MeshStandardMaterial({ color, metalness, roughness, ...extra });
    m.onBeforeCompile = shader => {
      shader.uniforms.uDissolve = dissolve;
      shader.vertexShader = "varying vec3 vDissolvePosition;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvDissolvePosition = position;");
      shader.fragmentShader = "uniform float uDissolve; varying vec3 vDissolvePosition;\n" + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace("#include <alphatest_fragment>", `#include <alphatest_fragment>
        vec3 cell = floor(vDissolvePosition * 34.0);
        float fragmentSeed = fract(sin(dot(cell, vec3(12.9898,78.233,39.425))) * 43758.5453);
        if (uDissolve > fragmentSeed) discard;`);
    };
    m.customProgramCacheKey = () => "axis09-surface-dissolve-v1";
    materials.push(m); return m;
  }
  const palette = Object.fromEntries(Object.entries(colors).map(([key, color]) => [key, material(color, key === "steel" ? .7 : .2)]));
  palette.glow = material(0xa7efdb, .1, .3, { emissive: 0x60dabb, emissiveIntensity: 1.4 });
  palette.warning = material(0xed8853, .15, .4, { emissive: 0xed6a30, emissiveIntensity: .45 });
  function mesh(geometry, m, position = [0, 0, 0], parent = root) {
    const object = new T.Mesh(geometry, m); object.position.set(...position);
    object.castShadow = !m.transparent; object.receiveShadow = true; parent.add(object); return object;
  }
  function box(w, h, d, m, p, parent = root) {
    const key = [w, h, d].join(",");
    if (!geometries.has(key)) {
      // Small bevels catch light on real geometry, rather than painted edges.
      const s = new T.Shape(); s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h / 2); s.lineTo(-w / 2, h / 2); s.closePath();
      const bevel = Math.min(.035, w / 8, h / 8, d / 8);
      const g = new T.ExtrudeGeometry(s, { depth: d - bevel * 2, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: bevel, bevelThickness: bevel });
      g.translate(0, 0, -d / 2 + bevel); geometries.set(key, g);
    }
    return mesh(geometries.get(key), m, p, parent);
  }
  function cylinder(radius, height, m, p, parent = root, radial = 24) {
    const key = "c:" + [radius, height, radial].join(",");
    if (!geometries.has(key)) geometries.set(key, new T.CylinderGeometry(radius, radius, height, radial));
    return mesh(geometries.get(key), m, p, parent);
  }
  function line(points, radius, m, parent = root) {
    const g = new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p))), 20, radius, 6, false);
    return mesh(g, m, [0, 0, 0], parent);
  }
  function label(text, width, p, parent = root) {
    const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 96;
    const c = canvas.getContext("2d"); c.fillStyle = "#263d36"; c.fillRect(0, 0, 512, 96);
    c.font = "500 35px monospace"; c.fillStyle = "#d9e5d8"; c.textAlign = "center"; c.fillText(text, 256, 62);
    const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace;
    const m = material(0xffffff, 0, .9, { map: texture });
    return mesh(new T.PlaneGeometry(width, width * 96 / 512), m, p, parent);
  }
  return { root, dissolve, palette, material, box, cylinder, line, label, mesh, materials };
}

export function createAoiScene() {
  const b = builder("Surface AOI Inspector"), { root, palette: p, box, cylinder, line, label } = b;
  box(7.7, .17, 3.0, p.dark, [0, -.08, 0]);
  box(7.55, .035, 2.85, p.body, [0, .035, 0]);
  for (const x of [-3.1, 2.9]) for (const z of [-.73, .73]) {
    box(.15, .92, .15, p.steel, [x, .54, z]); cylinder(.18, .12, p.dark, [x, .14, z]);
  }
  box(7.15, .26, 1.66, p.dark, [0, 1.02, 0]);
  for (const z of [-.89, .89]) {
    box(7.35, .19, .13, p.steel, [0, 1.18, z]);
    box(7.1, .045, .07, p.cream, [0, 1.29, z]);
  }
  const belt = [];
  for (let i = 0; i < 36; i++) belt.push(box(.17, .06, 1.55, i % 3 === 0 ? p.dark : p.rubber, [i * .2 - 3.5, 1.185, 0]));
  for (const x of [-3.5, 3.5]) { const r = cylinder(.17, 1.55, p.steel, [x, 1.02, 0]); r.rotation.x = Math.PI / 2; }
  // Substantial inspection enclosure, with open sight line through the conveyor.
  for (const z of [-1.03, 1.03]) {
    box(.56, 1.58, .36, p.body, [.1, 1.95, z]);
    box(.30, .85, .08, p.dark, [.1, 1.94, z + Math.sign(z) * .2]);
    for (const y of [1.39, 2.44]) {
      const bolt = cylinder(.047, .04, p.steel, [.1, y, z + Math.sign(z) * .23]); bolt.rotation.x = Math.PI / 2;
    }
  }
  box(.80, .42, 2.44, p.body, [.1, 2.72, 0]);
  box(.54, .07, 2.15, p.dark, [.1, 2.98, 0]);
  box(.32, .075, 1.45, p.glow, [.1, 2.48, 0]);
  box(.5, .29, .54, p.orange, [.1, 2.31, 0]);
  cylinder(.19, .18, p.dark, [.1, 2.10, 0]);
  cylinder(.12, .03, p.glow, [.1, 1.995, 0]);
  label("AOI / OPTICAL CELL", 1.0, [.1, 2.72, 1.235]);
  const beamMaterial = b.material(0x8afbdd, .0, .8, { transparent: true, opacity: .13, depthWrite: false, side: T.DoubleSide, emissive: 0x68e5b9, emissiveIntensity: .6 });
  const beam = b.mesh(new T.ConeGeometry(.55, .68, 4, 1, true), beamMaterial, [.1, 1.62, 0]); beam.userData.noParticles = true;
  const scanner = box(.028, .008, 1.23, p.glow, [.1, 1.365, 0]); scanner.userData.noParticles = true;
  // Guarded control cabinet, emergency stop and status stack.
  box(.81, 1.18, .72, p.body, [1.28, .79, -1.01]);
  box(.64, .13, .56, p.dark, [1.28, 1.43, -1.01]);
  label("VISION / 01", .61, [1.28, 1.04, -.635]);
  for (let i = 0; i < 5; i++) box(.39, .017, .015, p.dark, [1.28, .47 + i * .07, -.633]);
  cylinder(.045, .47, p.steel, [1.45, 1.78, -1.1]);
  const stack = cylinder(.075, .14, p.glow, [1.45, 2.08, -1.1]);
  line([[.2, 2.94, -.5], [.5, 3.03, -.7], [.95, 2.43, -.94], [1.29, 1.5, -1.01]], .023, p.dark);
  const stop = cylinder(.085, .055, p.warning, [1.46, 1.08, -.612]); stop.rotation.x = Math.PI / 2;
  label("SURFACE / INSPECTION", 1.9, [-1.85, .13, 1.515]);
  const parts = [];
  for (let i = 0; i < 5; i++) {
    const part = new T.Group(); root.add(part);
    box(.75, .14, .88, p.steel, [0, 0, 0], part);
    box(.67, .03, .79, p.cream, [0, .095, 0], part);
    for (const x of [-.26, .26]) for (const z of [-.31, .31]) cylinder(.036, .008, p.dark, [x, .116, z], part, 10);
    const scratch = line([[-.08,.12,-.24],[.02,.12,-.12],[-.045,.12,.03],[.07,.12,.19]], .015, p.dark, part);
    part.position.set((i - 2) * 1.72, 1.30, 0); parts.push({ part, scratch });
  }
  // QA bin and directional markers.
  box(.55, .15, .63, p.orange, [3.04, .15, 1.01]);
  for (let i = 0; i < 4; i++) box(.12, .012, .30, p.cream, [-2.6 + i * .33, .13, 1.24]).rotation.y = -.45;
  function update(time, scenario) {
    const state = inspectionAt(time, scenario);
    for (let i = 0; i < belt.length; i++) belt[i].position.x = ((i * .2 + time * (1.72 / 3.6)) % 7.2) - 3.6;
    for (let i = 0; i < parts.length; i++) {
      let x = state.x + (i - 2) * 1.72 + .1;
      parts[i].part.position.x = x; parts[i].part.visible = x > -3.55 && x < 3.55;
      parts[i].scratch.visible = state.defect;
      parts[i].scratch.scale.setScalar(scenario === "review" ? .48 : 1);
    }
    scanner.position.x = .1 + Math.sin(time * 5) * .28;
    beam.visible = state.scanning;
    stack.material = scenario === "normal" ? p.glow : p.warning;
    return state;
  }
  update(1.8, "scratch"); return { ...b, update, parts, beam, scanner };
}

export function createSafetyScene() {
  const b = builder("RTSafe Sensor Hub"), { root, palette: p, box, cylinder, line, label } = b;
  box(6.5, .18, 3.5, p.dark, [0, -.08, 0]); box(6.3, .035, 3.30, p.steel, [0, .04, 0]);
  for (const x of [-2.5, 2.5]) for (const z of [-1.15, 1.15]) cylinder(.10, .06, p.dark, [x, .10, z]);
  // Light-curtain posts and the safety perimeter.
  for (const x of [-2.6, 2.5]) {
    box(.20, 1.95, .23, p.cream, [x, 1.07, -.94]);
    box(.08, 1.52, .05, p.dark, [x, 1.15, -.80]);
    for (let i = 0; i < 7; i++) box(.04, .04, .02, p.glow, [x, .58 + i * .19, -.765]);
  }
  box(5.2, .04, .07, p.orange, [0, .09, 1.38]);
  box(5.2, .04, .07, p.orange, [0, .09, -1.38]);
  const pedestal = cylinder(.65, .26, p.dark, [-.65, .24, .05]);
  cylinder(.48, .25, p.steel, [-.65, .49, .05]);
  const swivel = new T.Group(); swivel.position.set(-.65, .62, .05); root.add(swivel);
  box(.68, .65, .62, p.cream, [0,.27,0], swivel);
  const shoulder = new T.Group(); shoulder.position.y = .55; swivel.add(shoulder);
  const joint = cylinder(.30, .75, p.dark, [0,0,0], shoulder); joint.rotation.x = Math.PI / 2;
  const cap = cylinder(.20, .79, p.orange, [0,0,0], shoulder); cap.rotation.x = Math.PI / 2;
  box(.38, 1.35, .44, p.body, [0,.64,0], shoulder);
  box(.17, 1.05, .47, p.cream, [0,.62,0], shoulder);
  const elbow = new T.Group(); elbow.position.y = 1.30; shoulder.add(elbow);
  const j2 = cylinder(.24, .61, p.dark, [0,0,0], elbow); j2.rotation.x = Math.PI / 2;
  const c2 = cylinder(.15, .64, p.orange, [0,0,0], elbow); c2.rotation.x = Math.PI / 2;
  box(.29, 1.15, .32, p.body, [0,.55,0], elbow);
  line([[-.21,.1,0],[-.27,.6,0],[-.20,1.05,0]], .037, p.dark, elbow);
  const wrist = new T.Group(); wrist.position.y = 1.17; elbow.add(wrist);
  cylinder(.20, .22, p.steel, [0,0,0], wrist);
  box(.46,.12,.27,p.dark,[0,.17,0],wrist);
  const fingers = [-1,1].map(sign => box(.075,.32,.16,p.cream,[sign * .20,.35,0],wrist));
  // Force sensing surface.
  box(1.05,.70,.85,p.body,[1.26,.48,.42]); box(1.15,.10,.94,p.dark,[1.26,.9,.42]);
  const forcePad = cylinder(.36,.04,p.glow,[1.26,.98,.42]);
  box(.40,.19,.44,p.orange,[1.26,1.09,.42]);
  label("FORCE", .60, [1.26,.62,.857]);
  // The supervision cabinet remains distinct from the robot.
  box(.96,1.34,.75,p.body,[2.08,.82,-.55]);
  box(.76,.51,.03,p.dark,[2.08,1.08,-.153]);
  label("RTSAFE / 1 kHz",.69,[2.08,1.09,-.129]);
  for(let i=0;i<4;i++) box(.54,.018,.02,p.dark,[2.08,.41 + i*.08,-.153]);
  const statusLamp=cylinder(.085,.12,p.glow,[2.08,1.59,-.55]);
  const emergency=cylinder(.115,.06,p.warning,[2.27,.73,-.12]); emergency.rotation.x=Math.PI/2;
  line([[-.7,.18,-.5],[-.4,.16,-1.19],[1.25,.16,-1.19],[2.06,.28,-.86]],.025,p.orange);
  label("SENSE / DECIDE / SAFE STOP",2.7,[0,.11,1.78]);
  function update(time, scenario) {
    const state=signalAt(time,scenario);
    swivel.rotation.y=Math.sin(time*.65)*.30;
    shoulder.rotation.z=-.40+Math.sin(time*.85)*.19;
    elbow.rotation.z=-1.50+Math.sin(time*.85+.8)*.24;
    wrist.rotation.z=-.65;
    for(let i=0;i<fingers.length;i++)fingers[i].position.x=(i?1:-1)*(.19+Math.sin(time*.85)*.03);
    statusLamp.material=state.moving?p.glow:p.warning; forcePad.material=state.moving?p.glow:p.warning;
    return state;
  }
  update(1.5,"normal"); return { ...b, update, shoulder, elbow, swivel, pedestal };
}

export function createRetailScene() {
  const b = builder("Retail Data Hub"), { root, palette: p, box, cylinder, line, label } = b;
  const blue = b.material(0x638dba, .3, .35), lavender = b.material(0xaaa0cd, .25, .45);
  const glass = b.material(0x9dd9ce, .05, .25, { transparent:true, opacity:.16, depthWrite:false });
  box(7.5,.18,3.9,p.dark,[0,-.08,0]); box(7.3,.04,3.7,p.body,[0,.04,0]);
  // Three distinct intake cabinets with tray slots: not a generic server stack.
  const sources = { CSV:-1.13, SQL:0, JSONL:1.13 }, sourceLamps = {};
  for (const [name,z] of Object.entries(sources)) {
    box(.90,1.33,.76,p.cream,[-2.85,.79,z]);
    box(.75,.10,.65,p.dark,[-2.85,1.51,z]);
    for(let i=0;i<3;i++) {
      box(.035,.06,.52,p.dark,[-2.38,.72+i*.20,z]);
      box(.18,.025,.41,blue,[-2.28,.72+i*.20,z]);
    }
    label(name,.65,[-2.85,1.22,z+.395]);
    sourceLamps[name]=cylinder(.055,.07,p.glow,[-2.65,1.60,z]);
    line([[-2.31,.34,z],[-1.75,.34,z],[-1.1,.34,0],[-.5,.34,0]],.035,blue);
  }
  // Quality gate: structural gantry, translucent chamber, scanning lattice.
  box(1.5,.22,1.38,p.steel,[-.15,.29,0]);
  for(const z of [-.63,.63]) {
    box(.20,1.55,.18,p.dark,[-.15,1.15,z]);
    box(.06,1.12,.025,p.glow,[-.15,1.21,z+.10]);
  }
  box(1.20,.22,1.56,p.cream,[-.15,1.99,0]);
  label("QUALITY GATE",1.05,[-.15,2.02,.795]);
  const enclosure=box(.98,1.20,1.10,glass,[-.15,1.22,0]); enclosure.userData.noParticles=true;
  const scanner=box(.75,.025,1.05,p.glow,[-.15,1.30,0]);scanner.userData.noParticles=true;
  // Warehouse as stacked data disks; a physical reconciliation pedestal alongside it.
  cylinder(.73,.18,p.dark,[2.40,.22,-.72]);
  for(let i=0;i<4;i++){
    cylinder(.61,.24,i%2?p.steel:p.cream,[2.40,.48+i*.32,-.72]);
    cylinder(.62,.035,p.glow,[2.40,.63+i*.32,-.72]);
  }
  cylinder(.62,.08,p.dark,[2.40,1.58,-.72]);
  label("WAREHOUSE",1.07,[2.40,.77,-.075]);
  line([[.5,.34,0],[1.10,.34,0],[1.55,.34,-.72],[2.40,.34,-.72]],.042,p.mint);
  const checkLamp=cylinder(.10,.10,p.glow,[2.40,1.71,-.72]);
  // Separate quarantine tray and duplicate-key return loop.
  box(1.20,.19,.92,p.orange,[1.83,.27,1.14]);
  for(const x of [1.27,2.39])box(.08,.40,.91,p.cream,[x,.54,1.14]);
  box(1.12,.4,.08,p.cream,[1.83,.54,1.58]);
  label("QUARANTINE",1.06,[1.83,.57,1.63]);
  for(let i=0;i<3;i++)box(.55,.035,.36,p.orange,[1.7+i*.08,.39+i*.06,1.13]);
  line([[.45,.30,.15],[.83,.30,.56],[1.26,.30,1.12]],.04,p.orange);
  const loop = new T.Group(); loop.position.set(-.30,.34,1.23);root.add(loop);
  const ring=b.mesh(new T.TorusGeometry(.40,.038,8,40),lavender,[0,.04,0],loop);ring.rotation.x=Math.PI/2;
  label("DEDUPE",.90,[-.35,.27,1.77]);
  line([[.1,.30,.40],[.10,.30,1.15],[-.30,.30,1.23]],.035,lavender);
  const pointer=box(.12,.10,.20,lavender,[.4,.13,0],loop);
  // Visible audit terminal and a publication bar turn orange on discrepancy.
  box(.73,.80,.57,p.cream,[3.03,.66,.65]);
  box(.60,.31,.035,p.dark,[3.03,.98,.955]);label("AUDIT",.50,[3.03,.98,.98]);
  const publishBar=box(.065,.25,.55,p.glow,[1.47,.75,-.72]);
  label("SOURCE / QUALITY / RECONCILE",3.5,[-.5,.11,1.975]);
  const packet = new T.Group();root.add(packet);
  const body=box(.39,.075,.47,blue,[0,0,0],packet);
  for(let i=0;i<3;i++)box(.26,.012,.026,p.cream,[0,.048,-.11+i*.10],packet);
  const start=new T.Vector3(), gate=new T.Vector3(-.15,1.13,0), end=new T.Vector3();
  function update(time,scenario) {
    const state=retailAt(time,scenario), f=state.fraction;
    start.set(-2.22,1.12,sources[state.row.source]);
    if(state.row.route==="quarantine")end.set(1.83,.67,1.14);
    else if(state.row.route==="duplicate")end.set(-.30,.54,1.23);
    else end.set(2.40,1.72,-.72);
    if(f<.46)packet.position.lerpVectors(start,gate,clamp(f/.46));
    else packet.position.lerpVectors(gate,end,clamp((f-.56)/.44));
    packet.position.y+=Math.sin(f*Math.PI)*.16;
    packet.rotation.y=Math.sin(time*1.4)*.12;
    body.material=f<.56?blue:state.row.route==="quarantine"?p.warning:state.row.route==="duplicate"?lavender:p.glow;
    scanner.position.y=.80+(Math.sin(time*3)+1)*.37;
    pointer.position.set(Math.cos(time*1.4)*.4,.13,Math.sin(time*1.4)*.4);
    checkLamp.material=state.publishable?p.glow:p.warning;
    publishBar.material=state.publishable?p.glow:p.warning;
    publishBar.rotation.z=state.publishable?-1.1:0;
    for(const [source,lamp] of Object.entries(sourceLamps))lamp.material=source===state.row.source?p.glow:p.steel;
    return state;
  }
  update(1.2,"normal");return {...b,update,packet,scanner,publishBar};
}

export function createKnowledgeScene() {
  const b=builder("KnowledgeOps Studio"),{root,palette:p,box,cylinder,line,label}=b;
  const plum=b.material(0x655e82,.35,.38),lavender=b.material(0xb8a4d8,.2,.45);
  const glass=b.material(0xc2b4eb,.1,.25,{transparent:true,opacity:.15,depthWrite:false});
  box(7.25,.18,3.6,plum,[0,-.08,0]);box(7.06,.04,3.42,p.cream,[0,.04,0]);
  // Revolving document carousel: recognizable files, spines and a central index.
  cylinder(.93,.19,p.dark,[-2.3,.22,-.25]);
  cylinder(.08,1.5,p.steel,[-2.3,1.02,-.25]);
  const archive=new T.Group();archive.position.set(-2.3,.36,-.25);root.add(archive);
  for(let tier=0;tier<2;tier++){
    cylinder(.87,.055,plum,[0,tier*.72,0],archive);
    for(let i=0;i<8;i++){
      const angle=i*Math.PI/4,book=new T.Group();archive.add(book);
      book.position.set(Math.cos(angle)*.62,.29+tier*.72,Math.sin(angle)*.62);book.rotation.y=-angle;
      box(.12,.48,.29,i%2?lavender:p.body,[0,0,0],book);
      box(.025,.39,.25,p.cream,[.075,0,0],book);
      box(.025,.04,.23,p.dark,[-.071,.10,0],book);
    }
  }
  cylinder(.38,.06,p.cream,[-2.3,1.86,-.25]);label("DOCUMENTS",1.3,[-2.3,.19,.71]);
  // Collection access shutter, positioned BEFORE the evidence chamber.
  for(const z of [-.48,.48])box(.11,1.12,.11,plum,[-1.12,.81,z]);
  box(.16,.12,1.1,p.cream,[-1.12,1.43,0]);
  const shutter=box(.045,.76,.87,lavender,[-1.12,.85,0]);label("ACL",.42,[-1.12,1.45,.57]);
  // A faceted evidence prism rather than a generic model/server cube.
  cylinder(.72,.20,p.dark,[.15,.23,-.25],root,6);
  cylinder(.60,.09,p.cream,[.15,.43,-.25],root,6);
  const prism=b.mesh(new T.CylinderGeometry(.47,.64,1.70,6),glass,[.15,1.37,-.25]);prism.userData.noParticles=true;
  const core=cylinder(.16,1.2,lavender,[.15,1.27,-.25],root,6);
  const rings=[];
  for(let i=0;i<3;i++){
    const ring=b.mesh(new T.TorusGeometry(.51,.028,8,40),i===1?p.glow:lavender,[.15,.79+i*.44,-.25]);
    ring.rotation.x=Math.PI/2;rings.push(ring);
  }
  cylinder(.5,.09,plum,[.15,2.27,-.25],root,6);label("EVIDENCE",.92,[.15,.31,.48]);
  for(const z of [-.92,.48])line([[-1.08,.23,z*.5],[-.65,.23,z],[.15,.23,z]],.026,lavender);
  // Cited answer lectern, with two open pages and a validated citation marker.
  cylinder(.40,.65,p.body,[2.24,.56,-.61]);
  const answerDesk=box(1.40,.12,.90,plum,[2.24,.99,-.61]);
  const pages=[];
  for(const side of [-1,1]){
    const page=box(.55,.04,.72,p.cream,[2.24+side*.29,1.12,-.61]);page.rotation.z=side*-.14;pages.push(page);
    for(let i=0;i<4;i++)box(.38,.013,.022,p.steel,[2.24+side*.29,1.19,-.83+i*.12]);
  }
  const citationLamp=cylinder(.10,.10,p.glow,[2.76,1.26,-.81]);
  label("CITED ANSWER",1.28,[2.24,.99,-.13]);
  line([[.75,.24,-.25],[1.3,.24,-.6],[2.24,.24,-.6]],.035,p.mint);
  // Human review desk: screen, input tray, stool. Distinct from the answer path.
  for(const x of [1.55,2.53])box(.06,.51,.06,p.steel,[x,.40,1.11]);
  box(1.24,.10,.77,p.cream,[2.04,.72,1.11]);
  box(.64,.40,.05,plum,[2.04,1.01,.98]);box(.51,.27,.02,p.dark,[2.04,1.01,1.018]);
  box(.43,.035,.21,p.steel,[2.04,.80,1.30]);
  cylinder(.23,.09,plum,[2.04,.34,1.71]);cylinder(.06,.22,p.steel,[2.04,.20,1.71]);
  const reviewLamp=cylinder(.075,.1,p.orange,[1.55,.84,1.12]);
  label("HUMAN REVIEW",1.15,[2.04,.69,1.51]);
  line([[.55,.23,.30],[.92,.23,.78],[1.58,.23,1.11]],.035,p.orange);
  label("KNOWLEDGE / WITH EVIDENCE",3.45,[-.50,.13,1.835]);
  const token=new T.Group();root.add(token);
  const tokenBody=box(.30,.10,.36,lavender,[0,0,0],token);
  for(let i=0;i<3;i++)box(.20,.014,.022,p.cream,[0,.06,-.09+i*.08],token);
  const start=new T.Vector3(-2.3,1.2,-.25),middle=new T.Vector3(.15,1.4,-.25),end=new T.Vector3();
  function update(time,scenario){
    const s=knowledgeAt(time,scenario),f=s.fraction;
    archive.rotation.y=s.authorized?time*.18:0;
    for(let i=0;i<rings.length;i++){rings[i].rotation.z=Math.sin(time*.8+i)*.2;rings[i].material=s.authorized?lavender:plum;}
    core.material=s.evidence?p.glow:s.authorized?p.warning:plum;
    shutter.scale.y=s.authorized?.12:1;
    if(!s.authorized)token.position.set(-1.55,1.10,-.25);
    else if(f<.5)token.position.lerpVectors(start,middle,f*2);
    else{end.set(s.evidence?2.24:2.04,s.evidence?1.24:1.11,s.evidence?-.61:1.11);token.position.lerpVectors(middle,end,(f-.5)*2);}
    token.rotation.y=Math.sin(time)*.16;tokenBody.material=s.evidence?p.glow:s.authorized?p.warning:lavender;
    citationLamp.material=s.evidence?p.glow:plum;reviewLamp.material=s.route==="review"?p.warning:p.steel;
    answerDesk.material=s.evidence?plum:p.dark;
    return s;
  }
  update(2.2,"cited");return {...b,update,token,shutter,archive};
}


export function createOpsScene() {
  const b=builder("OpsFlow Agent"),{root,palette:p,box,cylinder,line,label,mesh,material}=b;
  const bronze=material(0x9b7447,.55,.32),sand=material(0xd4bd94,.15,.55),navy=material(0x30434b,.35,.45);
  const amber=material(0xe7b76c,.2,.3,{emissive:0x98541c,emissiveIntensity:.3});
  box(7.3,.19,3.5,navy,[0,-.08,0]);box(7.15,.045,3.35,sand,[0,.05,0]);
  // Incoming incident tower. The rotating beacon does not imply actual sensing.
  cylinder(.57,.15,navy,[-2.7,.18,-.15]);
  box(.68,1.50,.66,p.body,[-2.7,1,-.15]);
  box(.52,.67,.055,navy,[-2.7,1.2,.21]);
  for(let i=0;i<3;i++)box(.35,.035,.03,amber,[-2.7,1.37-i*.16,.255]);
  const beacon=new T.Group();beacon.position.set(-2.7,1.92,-.15);root.add(beacon);
  cylinder(.27,.17,bronze,[0,0,0],beacon);
  const beaconLight=box(.42,.14,.10,p.glow,[0,.15,0],beacon);
  label("INCIDENT",.91,[-2.7,.41,.25]);
  // Three separate evidence panels: telemetry, maintenance, SOP.
  box(3.55,.12,.18,bronze,[.1,2.15,-.94]);
  const panels=[],nodes=[];
  for(let i=0;i<3;i++){
    const x=-1.07+i*1.17;
    box(.07,1.67,.09,bronze,[x,1.05,-.96]);
    box(1.03,1.05,.11,navy,[x,1.54,-.88]);
    const screen=box(.87,.72,.025,p.dark,[x,1.61,-.81]);panels.push(screen);
    const lamp=cylinder(.065,.06,p.glow,[x,2.11,-.79]);nodes.push(lamp);
    if(i===0)for(let k=0;k<5;k++)box(.07,.14+(k%3)*.13,.025,p.mint,[x-.28+k*.14,1.48,-.785]);
    else for(let k=0;k<4;k++)box(k===3?.40:.63,.027,.02,sand,[x-.06,1.82-k*.13,-.785]);
    label(["TELEMETRY","HISTORY","SOP"][i],.89,[x,1.10,-.804]);
    line([[x,.15,-.8],[x,.15,-.2],[.12,.15,.45]],.022,bronze);
  }
  // Circular correlation desk: linked evidence nodes orbit the incident.
  cylinder(.89,.16,navy,[.12,.69,.45]);cylinder(.76,.04,bronze,[.12,.80,.45]);
  cylinder(.28,.53,p.body,[.12,.38,.45]);
  const radar=new T.Group();radar.position.set(.12,.86,.45);root.add(radar);
  const hub=cylinder(.19,.17,p.glow,[0,0,0],radar);
  for(let i=0;i<3;i++){
    const angle=i*Math.PI*2/3,x=Math.cos(angle)*.56,z=Math.sin(angle)*.56;
    cylinder(.10,.07,amber,[x,0,z],radar);line([[0,0,0],[x*.5,.02,z*.5],[x,0,z]],.018,p.cream,radar);
  }
  label("EVIDENCE MAP",1.42,[.12,.65,1.28]);
  // Read-only summary tray at the back, human handoff terminal in front.
  box(1.13,.60,.81,p.body,[2.55,.41,-.95]);
  box(1.23,.10,.91,navy,[2.55,.76,-.95]);
  for(let i=0;i<3;i++)box(.70,.04,.49,p.cream,[2.55,.85+i*.055,-.95]);
  const summaryLamp=cylinder(.075,.10,p.glow,[3.01,.89,-.95]);
  label("SUMMARY",1.02,[2.55,.45,-.51]);
  for(const x of [2.08,3.0])box(.065,.66,.07,bronze,[x,.47,.84]);
  box(1.27,.12,.87,p.body,[2.54,.85,.84]);
  box(.70,.44,.08,navy,[2.58,1.14,.63]);box(.55,.30,.025,amber,[2.58,1.15,.684]);
  box(.52,.035,.22,navy,[2.56,.94,1.04]);
  const reviewLamp=cylinder(.07,.09,p.steel,[2.07,.96,.83]);
  label("HUMAN GATE",1.15,[2.54,.70,1.30]);
  cylinder(.075,.85,bronze,[1.72,.54,.65]);
  const gatePivot=new T.Group();gatePivot.position.set(1.72,1.01,.65);root.add(gatePivot);
  box(.68,.08,.11,amber,[.30,0,0],gatePivot);
  for(const end of [[2.55,.15,-.95],[1.72,.15,.65]])line([[.75,.15,.45],[1.26,.15,.20],end],.035,bronze);
  label("OPSFLOW / HUMAN IN LOOP",4.45,[-.05,.13,1.79]);
  const token=new T.Group();root.add(token);
  const tokenBody=box(.28,.12,.34,p.glow,[0,0,0],token);
  box(.19,.015,.18,p.cream,[0,.075,0],token);
  const start=new T.Vector3(-2.7,1.8,-.15),middle=new T.Vector3(.12,1.08,.45),end=new T.Vector3();
  function update(time,scenario){
    const s=opsAt(time,scenario),f=s.fraction;
    beacon.rotation.y=time*.9;beaconLight.material=s.route==="summary"?p.glow:p.warning;
    radar.rotation.y=time*.30;hub.material=s.route==="summary"?p.glow:p.warning;
    nodes[0].material=scenario==="timeout"?p.warning:p.glow;
    panels[0].material=scenario==="timeout"?bronze:p.dark;
    summaryLamp.material=s.route==="summary"?p.glow:p.steel;
    reviewLamp.material=s.route==="review"?p.warning:p.steel;
    gatePivot.rotation.z=s.route==="review"?0:Math.PI*.44;
    if(f<.5)token.position.lerpVectors(start,middle,f*2);
    else{
      end.set(s.route==="summary"?2.55:1.49,s.route==="summary"?1.08:1.13,s.route==="summary"?-.95:.65);
      token.position.lerpVectors(middle,end,(f-.5)*2);
    }
    tokenBody.material=s.route==="summary"?p.glow:p.warning;
    return s;
  }
  update(2.2,"normal");return {...b,update,token,gatePivot};
}


export function createPlanningScene(){
 const b=builder("Demand Planning Workbench"),{root,palette:p,box,cylinder,line,label,material}=b;
 const blue=material(0x5d8795,.45,.35),pale=material(0xc6dce1,.2,.48),gold=material(0xd6ab65,.3,.4);
 box(7.4,.18,3.4,p.dark,[0,-.08,0]);box(7.25,.04,3.25,pale,[0,.05,0]);
 // Model registry is a visual metaphor, not a live model training rack.
 const slots=[];
 for(let i=0;i<4;i++){
  const x=-3.05+i*.39;
  box(.28,1.32,.65,blue,[x,.90,-.40]);
  box(.19,.87,.035,p.dark,[x,.99,-.057]);
  slots.push(box(.14,.06,.05,p.glow,[x,1.50,-.03]));
  for(let k=0;k<3;k++)box(.15,.025,.03,p.cream,[x,1.19-k*.19,-.03]);
 }
 box(1.67,.14,.88,p.dark,[-2.47,.23,-.40]);label("MODEL REGISTRY",1.55,[-2.47,.25,.06]);
 // Seven day columns: a pale baseline next to a colored scenario.
 box(3.42,.14,1.80,blue,[-.12,.20,.05]);
 const bars=[],baseline=[];
 for(let i=0;i<7;i++){
  const x=-1.52+i*.46,base=PLANNING_BASELINE[i]/100;
  const under=box(.17,1,.43,p.cream,[x-.10,.31+base/2,-.20]);under.scale.y=base;baseline.push(under);
  const bar=box(.20,1,.43,p.mint,[x+.10,.81,.30]);bars.push(bar);
  label(String(i+1),.20,[x,.25,.99]);
 }
 // A moving gantry reads one day at a time without changing the forecast.
 const gantry=new T.Group();root.add(gantry);
 for(const z of [-.59,.75])box(.045,1.95,.045,p.steel,[0,1.28,z],gantry);
 box(.12,.10,1.46,blue,[0,2.27,.08],gantry);
 cylinder(.055,.10,p.glow,[0,2.19,.08],gantry);
 label("7 DAY HORIZON",2.30,[-.12,.14,1.12]);
 // Physical rule dial, with a marker corresponding to the active multiplier.
 cylinder(.75,.23,blue,[2.50,.38,-.25]);
 cylinder(.64,.08,p.cream,[2.50,.55,-.25]);
 for(let i=0;i<9;i++){
  const a=-Math.PI*.75+i*Math.PI*1.5/8;
  const tick=box(.035,.025,.10,p.steel,[2.50+Math.sin(a)*.52,.61,-.25+Math.cos(a)*.52]);tick.rotation.y=a;
 }
 const dial=new T.Group();dial.position.set(2.50,.64,-.25);root.add(dial);
 box(.065,.06,.48,gold,[0,0,.18],dial);
 cylinder(.10,.08,p.dark,[0,.025,0],dial);
 label("SCENARIO RULE",1.38,[2.50,.30,.56]);
 box(1.05,.30,.75,p.body,[2.50,.34,1.03]);box(.90,.04,.58,blue,[2.50,.52,1.03]);
 const paper=box(.70,.035,.42,p.cream,[2.50,.59,1.03]);
 label("COMPARE",.88,[2.50,.32,1.42]);
 line([[-1.69,.17,-.50],[-1.30,.17,-.78],[.40,.17,-.78],[2.50,.17,-.25]],.025,blue);
 label("DEMAND / WHAT IF",3.2,[-.15,.12,1.73]);
 function update(time,scenario){
  const s=planningAt(time,scenario);
  for(let i=0;i<7;i++){
   const h=s.values[i]/100;bars[i].scale.y=h;bars[i].position.y=.31+h/2;
   bars[i].material=scenario==="upside"?gold:scenario==="downside"?blue:p.mint;
  }
  // Cursor traverses the selected day; all numerical columns remain fixed.
  gantry.position.x=-1.52+s.dayIndex*.46+(s.fraction-.5)*.18;
  dial.rotation.y=(s.percent-100)/50*Math.PI;
  paper.position.y=.59+Math.sin(time*1.5)*.018;
  slots.forEach((slot,i)=>{slot.material=i===Math.floor(time)%4?p.glow:p.steel;});
  return s;
 }
 update(.6,"baseline");return {...b,update,bars,gantry,dial};
}


export function createRiskScene(){
 const b=builder("OpenFund Risk Workbench"),{root,palette:p,box,cylinder,line,label,material}=b;
 const violet=material(0x9b92b8,.3,.45),plum=material(0x686080,.4,.4),pale=material(0xd7d1e2,.15,.5);
 box(7.4,.18,3.5,p.dark,[0,-.08,0]);box(7.25,.04,3.35,pale,[0,.04,0]);
 // Filing tower: a visible source rather than a stock-price screen.
 box(1.05,1.67,.80,plum,[-2.85,1,-.35]);
 for(let i=0;i<5;i++){box(.82,.20,.06,p.cream,[-2.85,.46+i*.28,.08]);box(.36,.03,.035,p.dark,[-2.85,.46+i*.28,.13]);}
 label("FILINGS",1.05,[-2.85,1.99,.09]);
 const sourceLight=cylinder(.09,.16,p.glow,[-2.85,2.04,-.39]);
 // Four exposure pillars around a rotating observation instrument.
 cylinder(1.58,.17,plum,[-.12,.22,0],root,48);cylinder(1.44,.035,pale,[-.12,.325,0],root,48);
 const pillars=[],caps=[],markers=[];
 for(let i=0;i<4;i++){
  const a=i*Math.PI/2+Math.PI/4,x=-.12+Math.sin(a)*1.04,z=Math.cos(a)*1.04;
  cylinder(.33,.08,p.dark,[x,.40,z]);
  pillars.push(cylinder(.25,1,violet,[x,.95,z],root,6));
  caps.push(cylinder(.27,.04,p.cream,[x,1.47,z],root,6));
  const marker=box(.46,.48,.03,p.warning,[x,.73,z+.28]);marker.visible=false;markers.push(marker);
  label("ABCD"[i],.27,[x,.44,z+.35]);
 }
 cylinder(.19,1.7,p.steel,[-.12,1.19,0]);
 const scanner=new T.Group();scanner.position.set(-.12,2.08,0);root.add(scanner);
 box(.08,.09,1.26,plum,[0,0,.54],scanner);cylinder(.12,.13,p.dark,[0,.03,0],scanner);
 const scanHead=box(.22,.14,.22,p.glow,[0,-.10,1.05],scanner);
 // Gate blocks completion for missing holdings, never authorizes trading.
 for(const x of [1.84,2.82])box(.07,.87,.07,plum,[x,.60,.04]);
 box(1.12,.10,.12,plum,[2.33,1.10,.04]);
 const gate=new T.Group();gate.position.set(1.86,.82,.05);root.add(gate);
 box(.91,.065,.065,p.warning,[.43,0,0],gate);
 box(1.26,.34,.88,p.body,[2.37,.25,.91]);
 box(1.12,.05,.75,plum,[2.37,.45,.91]);
 label("RESEARCH ONLY",1.22,[2.37,.29,1.37]);
 const report=box(.54,.045,.36,p.cream,[2.36,.60,.90]);
 const token=box(.29,.04,.23,p.mint,[1.62,.52,-.70]);
 line([[-2.30,.16,-.40],[-1.77,.16,-.95],[.8,.16,-1.45],[2.34,.16,-.4],[2.34,.16,.70]],.028,plum);
 label("EXPOSURE / AUDIT",2.75,[-.28,.13,1.80]);
 function update(time,scenario){
  const s=riskAt(time,scenario);
  for(let i=0;i<4;i++){
   const value=s.weights[i],h=value===null?.08:Math.max(.08,value/45);
   pillars[i].scale.y=h;pillars[i].position.y=.44+h/2;
   pillars[i].material=value===null?p.dark:value>=60?p.warning:violet;
   caps[i].position.y=.47+h;markers[i].visible=value===null;
  }
  // The arm points to the same issuer highlighted by the monitor.
  scanner.rotation.y=s.issuerIndex*Math.PI/2+Math.PI/4+Math.sin(time*3)*.04;
  scanHead.material=s.value===null?p.warning:p.glow;
  gate.rotation.z=s.complete?Math.PI/2:0;
  sourceLight.material=s.complete?p.glow:p.warning;
  report.visible=s.complete;report.position.y=.60+Math.sin(time*1.8)*.025;
  token.position.set(s.complete?1.60+s.fraction*.74:1.60,.52,s.complete?-.65+s.fraction*1.36:-.65);
  token.material=s.complete?p.mint:p.warning;
  return s;
 }
 update(.6,"equal");return {...b,update,pillars,scanner,gate};
}


export function createSimopsScene(){
 const b=builder("SimOps Studio"),{root,palette:p,box,cylinder,line,label,material}=b;
 const teal=material(0x447a78,.3,.45),copper=material(0xd4a66a,.65,.35),pale=material(0xcbdcce,.1,.5);
 box(7.5,.18,3.5,p.dark,[0,-.08,0]);box(7.35,.04,3.35,pale,[0,.04,0]);
 // Two job workers. Moving cards represent orchestration, not external execution.
 const lights=[];
 for(let i=0;i<2;i++){
  const x=-3.0+i*.78;
  box(.65,1.56,.90,p.body,[x,.94,-.3]);box(.51,1.18,.035,p.dark,[x,1,.17]);
  for(let k=0;k<4;k++){box(.38,.13,.035,teal,[x,.57+k*.25,.2]);lights.push(box(.06,.035,.02,p.glow,[x+.13,.57+k*.25,.23]));}
  label("WORKER "+(i+1),.70,[x,1.87,.20]);
 }
 const card=box(.36,.055,.30,copper,[-2.23,.30,.89]);
 // Original circuit-board geometry, not a manufacturable PCB.
 box(3.25,.12,2.48,teal,[-.12,.31,0]);
 for(const x of [-1.55,1.31])for(const z of [-1.06,1.06])cylinder(.085,.04,copper,[x,.4,z]);
 box(.90,.20,.86,p.dark,[-.12,.50,.06]);
 for(let i=0;i<6;i++){
  const a=-.47+i*.14;
  box(.06,.035,.22,p.steel,[a,.43,.55]);box(.06,.035,.22,p.steel,[a,.43,-.48]);
 }
 const pads=[],positions=[];
 for(let i=0;i<6;i++){
  const x=-1.22+(i%3)*1.07,z=i<3?-.82:.83;positions.push([x,z]);
  cylinder(.085,.025,copper,[x,.4,z]);pads.push(cylinder(.035,.035,p.glow,[x,.43,z]));
  line([[x,.4,z],[x,.4,z*.68],[-.12,.4,z*.68],[-.12,.4,z*.48]],.018,copper);
 }
 for(let i=0;i<3;i++){const x=-1.12+i*.98;cylinder(.13,.30,p.cream,[x,.57,-.72]);box(.25,.13,.13,copper,[x,.46,.82]);}
 const probe=new T.Group();root.add(probe);
 cylinder(.043,.72,p.steel,[0,1.16,0],probe);cylinder(.075,.25,p.dark,[0,1.63,0],probe);
 cylinder(.03,.10,p.glow,[0,.74,0],probe);
 // Overhead rail and carriage follow the same discrete sample index as the chart.
 for(const x of [-1.70,1.50])box(.065,1.6,.065,p.steel,[x,1.16,-1.13]);
 box(3.28,.10,.13,teal,[-.10,1.98,-1.13]);
 const carriage=box(.24,.18,.28,p.cream,[0,1.97,-1.13]);
 label("PDN / DEMO BOARD",2.4,[-.1,.27,1.31]);
 box(1.32,.34,1.30,p.body,[2.65,.26,.18]);
 box(1.12,.86,.17,teal,[2.65,.93,-.37]);box(.93,.56,.03,p.dark,[2.65,.97,-.27]);
 const resultLamp=box(.64,.08,.04,p.glow,[2.65,1.10,-.23]);
 label("RESULT / TRACE",1.15,[2.65,.75,-.25]);
 const paper=box(.68,.035,.49,p.cream,[2.65,.48,.40]);
 const errorCard=box(.60,.08,.40,p.warning,[2.65,.52,.42]);errorCard.visible=false;
 label("NO LIVE SOLVER",1.35,[2.65,.25,.88]);
 label("SIMOPS / SWEEP",2.9,[-.20,.12,1.80]);
 function update(time,scenario){
  const s=simopsAt(time,scenario),pos=positions[s.step];
  probe.position.set(s.hasResult?pos[0]:-1.70,s.hasResult?Math.sin(time*3)*.025:.16,s.hasResult?pos[1]:-1.13);
  carriage.position.x=s.hasResult?pos[0]:-1.70;
  pads.forEach((pad,i)=>{pad.material=s.hasResult&&i===s.step?p.glow:copper;});
  lights.forEach((light,i)=>{light.material=s.hasResult?(i===Math.floor(time*2)%8?p.glow:p.steel):p.warning;});
  card.position.x=-2.25+(s.hasResult?s.fraction*.49:0);
  resultLamp.material=s.passed===true?p.glow:p.warning;
  paper.visible=s.hasResult;paper.position.y=.48+Math.sin(time*1.5)*.015;
  errorCard.visible=!s.hasResult;
  return s;
 }
 update(.4,"pass");return {...b,update,probe};
}


export function createForgeScene(){
 const b=builder("ModelForge-TW"),{root,palette:p,box,cylinder,line,label,material}=b;
 const navy=material(0x4b587d,.5,.35),ice=material(0xb8c6e5,.2,.4),violet=material(0x988ec7,.35,.4);
 box(7.4,.18,3.5,p.dark,[0,-.08,0]);box(7.25,.04,3.35,ice,[0,.04,0]);
 // Compute rack is an authored metaphor, not a live GPU or utilization meter.
 box(1.14,1.9,1.12,navy,[-2.73,1.03,-.1]);box(.95,1.62,.04,p.dark,[-2.73,1.05,.49]);
 const rackLights=[];
 for(let i=0;i<5;i++){
  box(.78,.18,.04,ice,[-2.73,.44+i*.29,.53]);
  rackLights.push(box(.07,.05,.025,p.glow,[-2.43,.44+i*.29,.57]));
 }
 label("ADAPTER / HASH",1.30,[-2.73,2.19,.51]);
 // Layered core represents an adapter lifecycle, not neural layer count.
 cylinder(1.08,.18,navy,[-.45,.20,0],root,48);
 const core=new T.Group();core.position.set(-.45,.46,0);root.add(core);
 const layers=[];
 for(let i=0;i<5;i++)layers.push(box(1.30,.12,1.30,i%2?ice:violet,[0,i*.27,0],core));
 box(.52,.24,.52,p.dark,[0,1.47,0],core);
 const orbit=new T.Group();orbit.position.set(-.45,1.20,0);root.add(orbit);
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4;cylinder(.045,.05,p.glow,[Math.cos(a)*1.38,0,Math.sin(a)*1.38],orbit,8);
 }
 label("WEIGHTS / DEMO",1.9,[-.45,.22,1.18]);
 // Passing evaluation is not automatic promotion.
 const outlets=[],lamps=[],cards=[],gates=[];
 const names=["RELEASED","PREVIOUS","BLOCKED"];
 for(let i=0;i<3;i++){
  const x=1.40+i*.78;
  box(.64,.30,1.14,navy,[x,.25,.40]);
  box(.59,1.00,.21,ice,[x,.86,-.14]);
  lamps.push(box(.41,.12,.035,p.steel,[x,1.12,0]));
  const card=box(.39,.05,.35,p.cream,[x,.44,.52]);cards.push(card);
  label(names[i],.68,[x,.75,0]);outlets.push(x);
  box(.055,.65,.055,navy,[x-.30,.42,.96]);
  const arm=new T.Group();arm.position.set(x-.30,.74,.96);root.add(arm);
  box(.59,.055,.055,p.warning,[.28,0,0],arm);gates.push(arm);
 }
 const token=box(.30,.06,.26,p.mint,[-1.80,.35,1.05]);
 line([[-2.73,.12,.84],[-1.55,.12,1.30],[.50,.12,1.30],[1.40,.12,1.30]],.025,navy);
 label("MODEL GOVERNANCE",2.9,[-.4,.12,1.78]);
 function update(time,scenario){
  const s=forgeAt(time,scenario),index=s.route==="released"?0:s.route==="previous"?1:2;
  core.rotation.y=time*.27;orbit.rotation.y=-time*.45;
  layers.forEach((layer,i)=>{layer.position.y=i*.27+Math.sin(time*1.8+i*.6)*.026;layer.material=i===s.step?(index===2?p.warning:p.glow):(i%2?ice:violet);});
  rackLights.forEach((light,i)=>{light.material=i===s.step?p.glow:p.steel;});
  lamps.forEach((light,i)=>{light.material=i===index?(index===2?p.warning:p.glow):p.steel;cards[i].visible=i===index;});
  gates.forEach((arm,i)=>{arm.rotation.z=i===index&&index!==2?Math.PI/2:0;});
  token.position.set(s.step<4?-2.18+s.step*.68:outlets[index],.48,s.step<4?1.12:.53);
  token.material=index===2?p.warning:index===1?ice:p.mint;
  return s;
 }
 update(.4,"nf4");return {...b,update,core,gates,token};
}

// Area-weighted samples on the actual authored surfaces (not an unrelated cloud).
function sampleSurface(root, count, seed) {
  root.updateWorldMatrix(true,true);
  const parentInverse=root.parent?root.parent.matrixWorld.clone().invert():new T.Matrix4();
  const triangles=[], cumulative=[];let total=0;
  const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),cross=new T.Vector3(),edge=new T.Vector3();
  root.traverse(m=>{
    if(!m.isMesh||m.userData.noParticles||!m.visible)return;
    for(let p=m.parent;p&&p!==root;p=p.parent)if(!p.visible)return;
    const samplingMatrix=new T.Matrix4().multiplyMatrices(parentInverse,m.matrixWorld);
    const positions=m.geometry.attributes.position,index=m.geometry.index;
    if(!positions)return;
    const length=index?index.count:positions.count;
    for(let i=0;i<length;i+=3){
      a.fromBufferAttribute(positions,index?index.getX(i):i).applyMatrix4(samplingMatrix);
      b.fromBufferAttribute(positions,index?index.getX(i+1):i+1).applyMatrix4(samplingMatrix);
      c.fromBufferAttribute(positions,index?index.getX(i+2):i+2).applyMatrix4(samplingMatrix);
      const area=cross.subVectors(b,a).cross(edge.subVectors(c,a)).length()*.5;
      if(area<1e-8)continue;total+=area;cumulative.push(total);triangles.push([a.clone(),b.clone(),c.clone()]);
    }
  });
  function random(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;}
  const output=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    const target=random()*total;let lo=0,hi=cumulative.length-1;
    while(lo<hi){const mid=(lo+hi)>>1;if(cumulative[mid]<target)lo=mid+1;else hi=mid;}
    const tri=triangles[lo],u=Math.sqrt(random()),v=random();
    for(let k=0;k<3;k++)output[i*3+k]=tri[0].getComponent(k)*(1-u)+tri[1].getComponent(k)*(u*(1-v))+tri[2].getComponent(k)*(u*v);
  }
  return output;
}
export function createParticleBridge(aoi,safe,count=10000) {
  const geometry=new T.BufferGeometry();
  geometry.setAttribute("position",new T.BufferAttribute(sampleSurface(aoi.root,count,132),3));
  geometry.setAttribute("target",new T.BufferAttribute(sampleSurface(safe.root,count,773),3));
  const seeds=new Float32Array(count);for(let i=0;i<count;i++)seeds[i]=((i*16807)%2147483647)/2147483647*1700;
  geometry.setAttribute("seed",new T.BufferAttribute(seeds,1));
  const uniforms={uProgress:{value:0},uTime:{value:0},uOpacity:{value:0},uPixelRatio:{value:1}};
  const vertexShader=`
    attribute vec3 target; attribute float seed;
    uniform float uProgress,uTime,uPixelRatio,uTrail;
    varying vec3 vColor; varying float vAlpha;
    void main(){
      float p=clamp(uProgress,0.,1.);
      float burst=pow(sin(p*3.14159265),1.15);
      float transfer=smoothstep(.27,.78,p);
      float t=uTime*.32-uTrail;
      vec3 chaos=vec3(sin(seed*17.3+t)*3.5,cos(seed*9.7+t*.8)*1.9,sin(seed*6.1-t)*2.9);
      chaos.x+=sin(seed*3.7+p*7.)*1.6;
      vec3 pos=mix(position,target,transfer)+chaos*burst;
      pos.y+=burst*.4;
      vec4 mv=modelViewMatrix*vec4(pos,1.);
      gl_Position=projectionMatrix*mv;
      gl_PointSize=(3.5+fract(seed*17.2)*2.8)*uPixelRatio*(1.-uTrail*2.);
      float tint=fract(seed*8.2);
      vColor=tint<.25?vec3(.12,.83,.69):tint<.5?vec3(1.,.36,.12):tint<.75?vec3(.57,.35,1.):vec3(.73,.92,.32);
      vAlpha=1.-uTrail*4.;
    }`;
  const fragmentShader=`
    uniform float uOpacity; varying vec3 vColor; varying float vAlpha;
    void main(){float radius=length(gl_PointCoord-.5)*2.;if(radius>1.)discard;
      float glow=pow(1.-radius,1.5);
      gl_FragColor=vec4(vColor*(1.+glow*.25),glow*uOpacity*vAlpha);
    }`;
  const group=new T.Group();group.name="surface-to-surface-particle-bridge";
  for(const trail of [0,.035,.07]){
    const material=new T.ShaderMaterial({uniforms:{...uniforms,uTrail:{value:trail}},vertexShader,fragmentShader,transparent:true,depthWrite:false,blending:T.AdditiveBlending});
    const points=new T.Points(geometry,material);points.frustumCulled=false;group.add(points);
  }
  return {group,uniforms,count,geometry};
}

export async function createExperienceRenderer(canvas,{mobile=false,onFailure=()=>{}}={}) {
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.25:1.65));
  renderer.setClearColor(0x000000,0);renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-5,5,4,-4,.1,80);
  camera.position.set(7.8,6.6,9.8);camera.lookAt(0,1.0,0);
  scene.add(new T.HemisphereLight(0xfff6dc,0x647f74,2.6));
  const key=new T.DirectionalLight(0xfff4df,4.5);key.position.set(-3,8,5);key.castShadow=true;
  key.shadow.mapSize.set(mobile?512:1024,mobile?512:1024);Object.assign(key.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:.1,far:25});key.shadow.bias=-.0006;key.shadow.normalBias=.035;scene.add(key);
  const fill=new T.DirectionalLight(0xb0e5db,2.0);fill.position.set(4,3,-5);scene.add(fill);
  const assembly=new T.Group();scene.add(assembly);
  const aoi=createAoiScene(),safe=createSafetyScene(),retail=createRetailScene(),knowledge=createKnowledgeScene(),ops=createOpsScene(),planning=createPlanningScene(),risk=createRiskScene(),simops=createSimopsScene(),forge=createForgeScene();
  const models={aoi,safe,retail,knowledge,ops,planning,risk,simops,forge};assembly.add(...Object.values(models).map(m=>m.root));
  const bridge=createParticleBridge(aoi,safe,mobile?3200:8000);assembly.add(bridge.group);
  const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({color:0x18372f,opacity:.13}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.2;floor.receiveShadow=true;scene.add(floor);
  let failed=false,dimensions={width:1,height:1},targetX=0,targetY=0,previousBridge="";
  function contextLost(event){event.preventDefault();failed=true;onFailure("WebGL 連線中斷，已切換靜態示意。");}
  canvas.addEventListener("webglcontextlost",contextLost);
  function resize(){
    const rect=canvas.parentElement.getBoundingClientRect();dimensions={width:Math.max(1,rect.width),height:Math.max(1,rect.height)};
    renderer.setSize(dimensions.width,dimensions.height,false);
    const aspect=dimensions.width/dimensions.height;
    const half=Math.max(2.8,4.2/aspect);
    camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();
    bridge.uniforms.uPixelRatio.value=renderer.getPixelRatio();
  }
  function render({journey,time,driftTime,safetyTime,retailTime=1.2,knowledgeTime=2.2,opsTime=2.2,planningTime=.6,riskTime=.6,simopsTime=.4,forgeTime=.4,aoiCase,safeCase,retailCase="normal",knowledgeCase="cited",opsCase="normal",planningCase="baseline",riskCase="equal",simopsCase="pass",forgeCase="nf4",pointer,detail=false,reduced=false}){
    if(failed)return;
    const transition=journey.phase==="transition";
    for(const [id,model] of Object.entries(models)){model.root.visible=journey[id+"Dissolve"]<.999;model.dissolve.value=journey[id+"Dissolve"];}
    aoi.update(time,aoiCase);safe.update(safetyTime,safeCase);const retailState=retail.update(retailTime,retailCase);
    const knowledgeState=knowledge.update(knowledgeTime,knowledgeCase);
    const opsState=ops.update(opsTime,opsCase);
    const planningState=planning.update(planningTime,planningCase);
    const riskState=risk.update(riskTime,riskCase);
    const simopsState=simops.update(simopsTime,simopsCase);
    const forgeState=forge.update(forgeTime,forgeCase);
    // Sample only on entering a transition; simulation clocks stay frozen
    // during it, while particle drift has a separate clock.
    const bridgeKey=transition?journey.from+"/"+journey.to:"";
    if(transition&&bridgeKey!==previousBridge){
      bridge.geometry.attributes.position.array.set(sampleSurface(models[journey.from].root,bridge.count,132));
      bridge.geometry.attributes.target.array.set(sampleSurface(models[journey.to].root,bridge.count,773));
      bridge.geometry.attributes.position.needsUpdate=true;bridge.geometry.attributes.target.needsUpdate=true;
    }
    previousBridge=bridgeKey;
    bridge.group.visible=journey.particles>.001;
    bridge.uniforms.uProgress.value=journey.transition;bridge.uniforms.uTime.value=driftTime;bridge.uniforms.uOpacity.value=journey.particles;
    targetX+=(pointer.x-targetX)*.06;targetY+=(pointer.y-targetY)*.06;
    assembly.rotation.y=reduced?0:targetX*.10;assembly.rotation.x=reduced?0:targetY*.045;
    const centerBlend=Math.sin(journey.transition*Math.PI);
    const compact=dimensions.width<=760;
    const wideFrom=Number(["retail","knowledge","ops","planning","risk","simops","forge"].includes(journey.from)),wideTo=Number(["retail","knowledge","ops","planning","risk","simops","forge"].includes(journey.to));
    const wideBlend=wideFrom+(wideTo-wideFrom)*journey.transition;
    const narrow=dimensions.width<=360;
    // Leave room for wrapped copy above and the full-width evidence feed below.
    const riskBlend=Number(journey.from==="risk")+(Number(journey.to==="risk")-Number(journey.from==="risk"))*journey.transition;
    const simopsBlend=Number(["simops","forge"].includes(journey.from))+(Number(["simops","forge"].includes(journey.to))-Number(["simops","forge"].includes(journey.from)))*journey.transition;
    const forgeBlend=Number(journey.from==="forge")+(Number(journey.to==="forge")-Number(journey.from==="forge"))*journey.transition;
    const simopsFit=compact?1:1-(1-Math.min(1,dimensions.width/1100))*simopsBlend*(1-centerBlend);
    camera.zoom=(detail&&!transition?1.12:1)*(1-(narrow?.14:0)*wideBlend*(1-centerBlend))*(1-(narrow?.04:0)*riskBlend*(1-centerBlend))*simopsFit*(1-(narrow?.08:0)*forgeBlend*(1-centerBlend));camera.updateProjectionMatrix();
    const retailLift=wideBlend*(dimensions.height<730&&!narrow?65:40);
    camera.setViewOffset(dimensions.width,dimensions.height,compact?0:dimensions.width*.15*(1-centerBlend),compact?(94+retailLift-(narrow?14:0)*riskBlend-(narrow?8:0)*forgeBlend)*(1-centerBlend):0,dimensions.width,dimensions.height);
    floor.visible=!transition;renderer.shadowMap.enabled=!transition;
    renderer.render(scene,camera);
    canvas.dataset.phase=journey.phase;canvas.dataset.transition=journey.transition.toFixed(4);
    canvas.dataset.time=time.toFixed(3);canvas.dataset.safetyTime=safetyTime.toFixed(3);
    canvas.dataset.aoiX=aoi.parts[2].part.position.x.toFixed(3);
    canvas.dataset.armAngle=safe.shoulder.rotation.z.toFixed(3);
    canvas.dataset.retailTime=retailTime.toFixed(3);canvas.dataset.retailRoute=retailState.row.route;
    canvas.dataset.retailRow=String(retailState.rowIndex+1);canvas.dataset.retailPacketX=retail.packet.position.x.toFixed(3);
    canvas.dataset.bridge=journey.from+"/"+journey.to;canvas.dataset.retailStatus=retailState.status;
    canvas.dataset.knowledgeTime=knowledgeTime.toFixed(3);canvas.dataset.knowledgeRoute=knowledgeState.route;
    canvas.dataset.knowledgeStep=String(knowledgeState.step+1);canvas.dataset.knowledgeTokenX=knowledge.token.position.x.toFixed(3);
    canvas.dataset.knowledgeGate=knowledgeState.authorized?"open":"closed";
    canvas.dataset.opsTime=opsTime.toFixed(3);canvas.dataset.opsRoute=opsState.route;canvas.dataset.opsGate=opsState.gate;
    canvas.dataset.opsStep=String(opsState.step+1);canvas.dataset.opsAttempts=String(opsState.attempts);canvas.dataset.opsExternalActions=String(opsState.externalActions);
    canvas.dataset.forgeTime=forgeTime.toFixed(3);canvas.dataset.forgeStep=String(forgeState.step+1);
    canvas.dataset.forgeStatus=forgeState.status;canvas.dataset.forgeGate=forgeState.gate;
    canvas.dataset.forgeAngle=forge.core.rotation.y.toFixed(3);canvas.dataset.forgeTokenX=forge.token.position.x.toFixed(3);
    canvas.dataset.forgeWrites=String(forgeState.registryWrites);
    canvas.dataset.simopsTime=simopsTime.toFixed(3);canvas.dataset.simopsStep=String(simopsState.step+1);
    canvas.dataset.simopsResult=simopsState.status;canvas.dataset.simopsAttempts=String(simopsState.attempts);
    canvas.dataset.simopsValue=simopsState.value===null?"unknown":String(simopsState.value);
    canvas.dataset.simopsProbeX=simops.probe.position.x.toFixed(3);canvas.dataset.simopsJobs=String(simopsState.externalJobs);
    canvas.dataset.riskTime=riskTime.toFixed(3);canvas.dataset.riskIssuer=riskState.issuer;
    canvas.dataset.riskCoverage=String(riskState.covered);canvas.dataset.riskGate=riskState.gate;
    canvas.dataset.riskTop=riskState.top===null?"unknown":String(riskState.top);
    canvas.dataset.riskConcentration=riskState.concentration===null?"unknown":riskState.concentration.toFixed(4);
    canvas.dataset.riskHeight=risk.pillars[riskState.issuerIndex].scale.y.toFixed(3);
    canvas.dataset.riskTrades=String(riskState.externalTrades);
    canvas.dataset.planningTime=planningTime.toFixed(3);canvas.dataset.planningDay=String(planningState.dayIndex+1);
    canvas.dataset.planningTotal=String(planningState.total);canvas.dataset.planningPercent=String(planningState.percent);
    canvas.dataset.planningBarHeight=planning.bars[planningState.dayIndex].scale.y.toFixed(3);
    canvas.dataset.particles=String(bridge.group.visible?bridge.count:0);
    canvas.dataset.drawCalls=String(renderer.info.render.calls);
    canvas.dataset.pointer=targetX.toFixed(3);
  }
  resize();
  return {render,resize,renderer,aoi,safe,retail,knowledge,ops,planning,risk,simops,forge,bridge,camera,dispose(){
    canvas.removeEventListener("webglcontextlost",contextLost);
    const geometries=new Set(),materials=new Set(),textures=new Set();
    scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);if(m.map)textures.add(m.map);}});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();
  }};
}
