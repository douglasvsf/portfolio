"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { createAtomicBreath, type AtomicBreath } from "./atomic-breath";
import { MAX_RAGE, type RagePhase, type RageState } from "./rage";

/**
 * Cena 3D do topo da home: um kaiju low-poly "respirando", com a cabeça
 * seguindo o mouse, placas dorsais em neon e uma cidade ao fundo.
 *
 * Fúria: cada clique o deixa mais furioso — as placas acendem da cauda ao
 * pescoço (como no filme, quando ele carrega), o brilho vai do verde ao azul,
 * a respiração acelera e ele treme. No 10º clique ele vira de perfil, carrega e
 * solta o sopro atômico pela boca; depois esfria e a fúria zera. Sem cliques, a
 * fúria baixa sozinha.
 *
 * Modelo: "T-Rex" de Quaternius (CC0), com esqueleto e animações. Tudo o que o
 * transforma em kaiju é feito aqui, por código: materiais, placas e luzes.
 * A cidade também é gerada por código (caixas instanciadas) — nenhum arquivo a mais.
 */

const MODEL_URL = "/models/kaiju.glb";
/**
 * O modelo não usa compressão (Draco/Meshopt). Sem desligar, o drei inicia o
 * decodificador Meshopt em WebAssembly — que a CSP do site bloqueia — e o Draco
 * buscaria o decodificador num CDN externo. Os dois ficam desligados.
 */
const USE_DRACO = false;
const USE_MESHOPT = false;
const NEON = "#a3ff3c";
const BACKGROUND = "#07090a";

/** Comprimento do kaiju na cena, do focinho à cauda (unidades do three). O modelo é normalizado para isso. */
const KAIJU_LENGTH = 6;
/** Vira o corpo em 3/4, olhando para o texto à esquerda. */
const BASE_YAW = -0.55;

/** Cores por material do modelo original → paleta do site. */
const PALETTE: Record<string, { color: string; emissive?: string; intensity?: number; roughness?: number }> = {
  Green: { color: "#263326", roughness: 0.7 },
  LightGreen: { color: "#4a6a35", roughness: 0.75 },
  LightYellow: { color: "#e8ffc2", emissive: NEON, intensity: 0.35, roughness: 0.4 },
  Red: { color: "#1b2a10", emissive: NEON, intensity: 1.6, roughness: 0.5 },
  Black: { color: "#050505", emissive: NEON, intensity: 2.2, roughness: 0.3 },
};

/** Quadros desenhados antes de a cena substituir a imagem estática. */
const READY_AFTER_FRAMES = 3;

/** Cor do brilho no auge da fúria e do raio (azul elétrico, como no cinema). */
const ATOMIC = "#52c8ff";
/** No disparo ele vira quase de perfil: o raio atravessa a tela em vez de vir para a câmera. */
const FIRE_YAW = -1.22;
/**
 * Quanto o crânio levanta para abrir a boca (radianos). O modelo não tem osso
 * de mandíbula: o maxilar de baixo é preso ao pescoço e o crânio ao osso da
 * cabeça — a boca abre girando a cabeça para cima, como na animação de ataque.
 */
const JAW_OPEN = 0.5;
/** Duração de cada fase do disparo, em segundos. */
const PHASE_SECONDS = { charging: 0.9, firing: 2.4, cooling: 1.6 } as const;
/** Sem cliques por este tempo, a fúria começa a baixar (um nível a cada DECAY_STEP). */
const DECAY_AFTER = 3;
const DECAY_STEP = 1.1;

interface Plate {
  material: THREE.MeshStandardMaterial;
  /** 0 no pescoço, 1 na ponta da cauda. */
  t: number;
}

/** Peças da cena que a fúria anima (criadas uma vez, na montagem). */
interface Effects {
  plates: Plate[];
  mouth?: THREE.MeshStandardMaterial;
  eyes?: THREE.MeshStandardMaterial;
  breath?: AtomicBreath;
}

/** Espinha, do pescoço à ponta da cauda: as placas nascem ao longo dela. */
const SPINE = ["Neck", "Shoulders", "Torso", "Hips", "Tail1", "Tail2", "Tail3", "Tail4"];

/** Posição do ponteiro na janela, de -1 a 1 (a cena é pequena; o olhar segue o mouse na página toda). */
function usePointer() {
  const pointer = useRef(new THREE.Vector2());
  useEffect(() => {
    const onMove = (event: PointerEvent) => pointer.current.set((event.clientX / window.innerWidth) * 2 - 1, -((event.clientY / window.innerHeight) * 2 - 1));
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return pointer;
}

function Kaiju({ onReady, onRage }: { onReady: () => void; onRage: (state: RageState) => void }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL_URL, USE_DRACO, USE_MESHOPT);
  const { actions, mixer } = useAnimations(animations, group);
  const pointer = usePointer();
  const look = useRef(new THREE.Vector2());
  const frames = useRef(0);
  const effects = useRef<Effects>({ plates: [] });
  const rage = useRef({ level: 0, phase: "calm" as RagePhase, phaseTime: 0, sinceClick: 0, decay: 0, yaw: BASE_YAW, jaw: 0 });

  const bones = useMemo(() => {
    const found: Record<string, THREE.Bone> = {};
    scene.traverse((object) => {
      if ((object as THREE.Bone).isBone) found[object.name] = object as THREE.Bone;
    });
    return found;
  }, [scene]);

  // Materiais, escala, placas dorsais e o raio: uma vez, com o modelo ainda na pose original.
  useLayoutEffect(() => {
    const meshes: THREE.SkinnedMesh[] = [];
    const materials: Record<string, THREE.MeshStandardMaterial> = {};
    scene.traverse((object) => {
      const mesh = object as THREE.SkinnedMesh;
      // Só o corpo (malhas com esqueleto): placas e raio, criados aqui, ficam de fora numa remontagem.
      if (!mesh.isSkinnedMesh) return;
      meshes.push(mesh);
      mesh.frustumCulled = false;
      const source = mesh.material as THREE.MeshStandardMaterial;
      const style = PALETTE[source.name] ?? PALETTE.Green!;
      const material = new THREE.MeshStandardMaterial({
        name: source.name,
        color: style.color,
        emissive: style.emissive ?? "#000000",
        emissiveIntensity: style.intensity ?? 0,
        roughness: style.roughness ?? 0.7,
        metalness: 0.1,
        flatShading: true,
      });
      mesh.material = material;
      materials[source.name] = material;
    });

    // Normaliza: pés no chão (y = 0), centralizado, com o comprimento definido.
    scene.scale.setScalar(1);
    scene.position.set(0, 0, 0);
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const scale = KAIJU_LENGTH / Math.max(size.x, size.y, size.z);
    const center = box.getCenter(new THREE.Vector3());
    scene.scale.setScalar(scale);
    scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    scene.updateMatrixWorld(true);
    // O raio das placas precisa dos ossos já posicionados (isso só acontece no primeiro quadro).
    meshes.forEach((mesh) => mesh.skeleton.update());

    effects.current = {
      plates: addDorsalPlates(scene, bones, meshes, size.y * scale),
      mouth: materials.Red,
      eyes: materials.Black,
      breath: addAtomicBreath(scene, bones.Neck, meshes),
    };
  }, [scene, bones]);

  // Parado "respirando"; um clique faz o ataque (rugido) e volta.
  useEffect(() => {
    const idle = actions["Armature|TRex_Idle"];
    // Sem transição na entrada: o primeiro quadro é igual à imagem estática que a cena substitui.
    idle?.reset().play();
    const back = () => {
      actions["Armature|TRex_Attack"]?.fadeOut(0.3);
      idle?.reset().fadeIn(0.3).play();
    };
    mixer.addEventListener("finished", back);
    return () => {
      mixer.removeEventListener("finished", back);
      idle?.fadeOut(0.2);
    };
  }, [actions, mixer]);

  const roar = () => {
    const attack = actions["Armature|TRex_Attack"];
    if (!attack || attack.isRunning()) return;
    actions["Armature|TRex_Idle"]?.fadeOut(0.2);
    attack.reset().setLoop(THREE.LoopOnce, 1).fadeIn(0.2).play();
  };

  /** Cada clique sobe a fúria; o 10º começa o disparo. Durante o disparo, cliques não contam. */
  const provoke = (event: ThreeEvent<MouseEvent>) => {
    // O clique atravessa a área invisível e o corpo: sem isto, contaria uma vez para cada.
    event.stopPropagation();
    const state = rage.current;
    if (state.phase !== "calm") return;
    state.level = Math.min(MAX_RAGE, state.level + 1);
    state.sinceClick = 0;
    state.decay = 0;
    if (state.level === MAX_RAGE) {
      state.phase = "charging";
      state.phaseTime = 0;
    }
    roar();
    onRage({ level: state.level, phase: state.phase });
  };

  useFrame((frame, delta) => {
    const root = group.current;
    if (!root) return;
    // Só avisa o palco depois de alguns quadros desenhados: a troca imagem → cena não pisca.
    if (frames.current < READY_AFTER_FRAMES && ++frames.current === READY_AFTER_FRAMES) onReady();

    const state = rage.current;
    const time = frame.clock.elapsedTime;
    advanceRage(state, delta, onRage);

    // 0 (calmo) a 1 (fúria máxima). Esfriando, cai de 1 a 0.
    const cooling = state.phase === "cooling" ? state.phaseTime / PHASE_SECONDS.cooling : 0;
    const fury = state.phase === "calm" ? state.level / MAX_RAGE : 1 - cooling;
    const firing = state.phase === "firing";
    const charging = state.phase === "charging";

    actions["Armature|TRex_Idle"]?.setEffectiveTimeScale(1 + fury * 1.8);
    paintFury(effects.current, fury, state.phase, time);
    effects.current.breath?.update(state.phase, state.phaseTime, time, PHASE_SECONDS);

    // No disparo vira de perfil; depois volta ao 3/4.
    const targetYaw = charging || firing ? FIRE_YAW : BASE_YAW;
    state.yaw += (targetYaw - state.yaw) * (1 - Math.exp(-delta * 5));

    const ease = 1 - Math.exp(-delta * 4);
    look.current.lerp(pointer.current, ease);
    // Furioso, ele treme; disparando, treme mais (e a câmera junto).
    const tremor = (firing ? 0.045 : charging ? 0.03 : Math.max(0, fury - 0.4) * 0.03) * Math.sin(time * 71);
    root.rotation.y = state.yaw + look.current.x * (firing ? 0.1 : 0.18);
    root.position.set(tremor, Math.sin(time * 0.8) * 0.03 + Math.abs(tremor) * 0.5, 0);
    frame.camera.position.set(CAMERA.x + (firing ? Math.sin(time * 53) * 0.035 : 0), CAMERA.y + (firing ? Math.cos(time * 47) * 0.03 : 0), CAMERA.z);

    // Depois da animação do quadro: o olhar segue o ponteiro. Quem gira é o pescoço (com um pouco dos
    // ombros) — o maxilar de baixo é preso ao pescoço; girar só a cabeça entortaria a boca.
    const yaw = look.current.x * (firing ? 0.25 : 0.55);
    const pitch = -look.current.y * 0.3 - (charging || firing ? 0.1 : 0);
    turnBone(bones.Shoulders, root, yaw * 0.3, pitch * 0.25);
    turnBone(bones.Neck, root, yaw * 0.7, pitch * 0.75);

    // Boca: entreabre conforme a fúria sobe, abre de vez ao carregar e fica aberta enquanto dispara.
    const jawTarget = charging ? JAW_OPEN * Math.min(1, state.phaseTime / (PHASE_SECONDS.charging * 0.7)) : firing ? JAW_OPEN : Math.max(0, fury - 0.5) * 0.3;
    state.jaw += (jawTarget - state.jaw) * (1 - Math.exp(-delta * 12));
    openJaw(bones.Head, state.jaw + (firing ? Math.sin(time * 61) * 0.015 : 0));
  });

  return (
    <group
      ref={group}
      rotation-y={BASE_YAW}
      onClick={provoke}
      // O canvas é largo: a "mãozinha" só aparece em cima do kaiju.
      onPointerOver={(event) => ((event.nativeEvent.target as HTMLElement).style.cursor = "pointer")}
      onPointerOut={(event) => ((event.nativeEvent.target as HTMLElement).style.cursor = "")}
    >
      <primitive object={scene} />
      {/* Área de clique folgada e invisível: ele se mexe ao rugir, e o clique não pode errar por isso. */}
      <mesh position={[0, KAIJU_LENGTH * 0.24, 0]}>
        <boxGeometry args={[KAIJU_LENGTH * 0.42, KAIJU_LENGTH * 0.52, KAIJU_LENGTH * 1.05]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Posição da câmera: enquadra o kaiju inteiro, de baixo para cima (parece maior). */
const CAMERA = new THREE.Vector3(0.4, 1.35, 10.5);

/** Avança o tempo da fúria: fases do disparo e a queda quando param os cliques. */
function advanceRage(state: { level: number; phase: RagePhase; phaseTime: number; sinceClick: number; decay: number }, delta: number, notify: (state: RageState) => void) {
  if (state.phase === "calm") {
    state.sinceClick += delta;
    if (state.level > 0 && state.sinceClick > DECAY_AFTER) {
      state.decay += delta;
      if (state.decay >= DECAY_STEP) {
        state.decay = 0;
        state.level -= 1;
        notify({ level: state.level, phase: "calm" });
      }
    }
    return;
  }
  state.phaseTime += delta;
  if (state.phaseTime < PHASE_SECONDS[state.phase]) return;
  state.phaseTime = 0;
  state.phase = state.phase === "charging" ? "firing" : state.phase === "firing" ? "cooling" : "calm";
  if (state.phase === "calm") {
    state.level = 0;
    state.sinceClick = 0;
  }
  notify({ level: state.level, phase: state.phase });
}

const GREEN = new THREE.Color("#6fdd16");
const BLUE = new THREE.Color(ATOMIC);
const WHITE = new THREE.Color("#ffffff");
const glow = new THREE.Color();

/**
 * Pinta a fúria no corpo. As placas acendem da cauda ao pescoço conforme o
 * nível sobe, com uma onda correndo por elas; boca e olhos acompanham.
 */
function paintFury(effects: Effects, fury: number, phase: RagePhase, time: number) {
  glow.copy(GREEN).lerp(BLUE, fury ** 1.4);
  if (phase === "charging") glow.lerp(WHITE, 0.35 + 0.35 * Math.sin(time * 40));

  for (const plate of effects.plates) {
    const lit = fury > 0 && plate.t >= 1 - fury - 0.001;
    const wave = Math.sin(time * (4 + fury * 14) + plate.t * 7);
    // Brilho contido: acima disso a cor estoura para o branco e o azul some.
    const intensity = phase === "cooling" && fury < 0.5 ? 0.35 + fury : lit ? 1.5 + fury * 0.9 + wave * (0.15 + fury * 0.35) : 1.1;
    plate.material.emissive.copy(lit ? glow : GREEN);
    plate.material.color.copy(lit ? glow : GREEN).multiplyScalar(0.35);
    plate.material.emissiveIntensity = phase === "firing" ? 2.9 + wave * 0.5 : intensity;
  }
  for (const [material, base] of [
    [effects.mouth, 1.6],
    [effects.eyes, 2.2],
  ] as const) {
    if (!material) continue;
    material.emissive.copy(glow);
    material.emissiveIntensity = base + fury * 1.6 + (phase === "firing" ? 1.5 : 0);
  }
}

const UP = new THREE.Vector3();
const SIDE = new THREE.Vector3();
const parentQuaternion = new THREE.Quaternion();
const turn = new THREE.Quaternion();

/** Pose que a animação deixou em cada osso e o resultado do último quadro (com os nossos ajustes somados). */
const poses = new WeakMap<THREE.Bone, { base: THREE.Quaternion; result: THREE.Quaternion }>();

/**
 * Devolve o osso à pose da animação, para somar um ajuste em cima dela.
 *
 * O three só reescreve um osso quando o valor da animação muda; no "parado" a
 * cabeça quase não se mexe. Somar a rotação direto no osso a cada quadro
 * acumulava — a cabeça girava sem parar. Então: se o osso está como deixamos
 * no quadro anterior, a animação não mexeu e a base continua a mesma; se mudou,
 * a animação escreveu e essa é a base nova. Depois do ajuste, chame `keepPose`.
 */
function animatedPose(bone: THREE.Bone) {
  let pose = poses.get(bone);
  if (!pose) {
    pose = { base: bone.quaternion.clone(), result: bone.quaternion.clone() };
    poses.set(bone, pose);
  }
  if (!bone.quaternion.equals(pose.result)) pose.base.copy(bone.quaternion);
  bone.quaternion.copy(pose.base);
  return pose;
}

/** Vira o osso na direção do olhar (em eixos do corpo do kaiju), a partir da pose da animação. */
function turnBone(bone: THREE.Bone | undefined, body: THREE.Object3D, yaw: number, pitch: number) {
  if (!bone?.parent) return;
  const pose = animatedPose(bone);
  bone.parent.getWorldQuaternion(parentQuaternion).invert();
  UP.set(0, 1, 0).applyQuaternion(parentQuaternion);
  SIDE.set(1, 0, 0).applyQuaternion(body.quaternion).applyQuaternion(parentQuaternion);
  bone.quaternion.premultiply(turn.setFromAxisAngle(UP, yaw));
  bone.quaternion.premultiply(turn.setFromAxisAngle(SIDE, pitch));
  pose.result.copy(bone.quaternion);
}

const JAW_AXIS = new THREE.Vector3(1, 0, 0);

/** Abre a boca: levanta o crânio em torno do eixo lateral do próprio osso (o mesmo que a animação de ataque usa). */
function openJaw(head: THREE.Bone | undefined, angle: number) {
  if (!head) return;
  const pose = animatedPose(head);
  head.quaternion.multiply(turn.setFromAxisAngle(JAW_AXIS, angle));
  pose.result.copy(head.quaternion);
}

/**
 * Placas dorsais ao estilo kaiju. Para cada ponto da espinha, um raio de cima
 * para baixo acha a superfície das costas; a placa nasce ali e é presa ao osso
 * mais próximo — então acompanha a respiração e o ataque.
 */
function addDorsalPlates(scene: THREE.Object3D, bones: Record<string, THREE.Bone>, meshes: THREE.SkinnedMesh[], bodyHeight: number): Plate[] {
  // O modelo fica em cache entre montagens: se as placas já existem, só as reaproveita.
  const existing: Plate[] = [];
  scene.traverse((object) => {
    if (object.name.startsWith("dorsal-plate")) existing.push({ material: (object as THREE.Mesh).material as THREE.MeshStandardMaterial, t: object.userData.t as number });
  });
  if (existing.length) return existing;

  const plates: Plate[] = [];
  const chain = SPINE.map((name) => bones[name]).filter((bone): bone is THREE.Bone => Boolean(bone));
  if (chain.length < 2) return plates;

  const material = new THREE.MeshStandardMaterial({ color: "#2c4a12", emissive: "#6fdd16", emissiveIntensity: 1.25, roughness: 0.45, flatShading: true });
  const geometry = new THREE.ConeGeometry(0.5, 1, 4, 1);
  geometry.translate(0, 0.5, 0);

  const raycaster = new THREE.Raycaster();
  const down = new THREE.Vector3(0, -1, 0);
  const points = chain.map((bone) => bone.getWorldPosition(new THREE.Vector3()));
  const STEPS = 3;
  const total = (chain.length - 1) * STEPS;
  let index = 0;

  for (let segment = 0; segment < chain.length - 1; segment++) {
    for (let step = 0; step < STEPS; step++) {
      const t = (segment * STEPS + step) / total;
      const origin = points[segment]!.clone().lerp(points[segment + 1]!, step / STEPS);
      origin.y += bodyHeight * 2;
      raycaster.set(origin, down);
      const hit = raycaster.intersectObjects(meshes, false)[0];
      if (!hit) continue;

      // Maiores no meio das costas, menores no pescoço e na ponta da cauda.
      const height = bodyHeight * (0.07 + 0.2 * Math.sin(Math.PI * Math.min(1, t * 1.25)) ** 1.4);
      // Material próprio: cada placa acende na sua vez quando ele carrega o sopro.
      const plateMaterial = material.clone();
      const plate = new THREE.Mesh(geometry, plateMaterial);
      plate.name = `dorsal-plate-${index++}`;
      plate.userData.t = t;
      plates.push({ material: plateMaterial, t });
      plate.position.copy(hit.point).addScaledVector(down, height * 0.12);
      plate.scale.set(height * 0.16, height, height * 0.62);
      // Fina de lado e larga ao longo da espinha: alinha com o corpo (que pode estar girado).
      scene.getWorldQuaternion(plate.quaternion);
      plate.rotateZ((index % 2 ? 1 : -1) * 0.08);

      // Sem pai, a placa está em coordenadas do mundo; attach() preserva isso e ela passa a seguir o osso.
      plate.updateMatrixWorld(true);
      chain[segment]!.attach(plate);
    }
  }
  return plates;
}

/**
 * Sopro atômico (ver atomic-breath.ts): nasce no meio da boca, apontando para a
 * frente do modelo, preso ao osso do pescoço — o do maxilar de baixo —, e por
 * isso acompanha a cabeça e o mouse. O modelo fica em cache entre montagens:
 * se o sopro já foi criado, reaproveita.
 */
function addAtomicBreath(scene: THREE.Object3D, jaw: THREE.Bone | undefined, meshes: THREE.SkinnedMesh[]): AtomicBreath | undefined {
  const cached = scene.userData.atomicBreath as AtomicBreath | undefined;
  if (cached) return cached;
  const mouth = meshes.find((mesh) => (mesh.material as THREE.Material).name === "Red");
  if (!jaw || !mouth) return undefined;

  mouth.computeBoundingBox();
  const mouthBox = mouth.boundingBox!.clone().applyMatrix4(mouth.matrixWorld);
  const size = mouthBox.getSize(new THREE.Vector3());
  const orientation = scene.getWorldQuaternion(new THREE.Quaternion());
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(orientation);
  // Um pouco à frente do centro da boca e acima dele: com a boca aberta, o vão fica mais alto.
  const origin = mouthBox.getCenter(new THREE.Vector3()).addScaledVector(forward, size.z * 0.3);
  origin.y += size.y * 0.35;

  const breath = createAtomicBreath(jaw, origin, orientation);
  scene.userData.atomicBreath = breath;
  return breath;
}

/** Gerador determinístico: a cidade é sempre a mesma. */
function seeded(seed: number) {
  let state = seed;
  return () => ((state = (state * 16807) % 2147483647) - 1) / 2147483646;
}

/** Janelas acesas pintadas num canvas: vira o brilho (emissive) dos prédios. */
function createWindowsTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 128;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "#000";
  context.fillRect(0, 0, 64, 128);
  const random = seeded(7);
  for (let y = 6; y < 122; y += 10) {
    for (let x = 5; x < 60; x += 9) {
      if (random() < 0.42) {
        context.fillStyle = random() < 0.85 ? NEON : "#e8ffc2";
        context.globalAlpha = 0.35 + random() * 0.65;
        context.fillRect(x, y, 5, 6);
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

/** Prédios em meia-lua atrás e aos lados do kaiju, bem menores que ele. */
function createBuildings(count: number) {
  const random = seeded(20260928);
  return Array.from({ length: count }, () => {
    const angle = Math.PI * (0.02 + random() * 0.8);
    const radius = 3.2 + random() * 5.5;
    const height = 0.35 + random() * random() * 1.9;
    return { x: Math.cos(angle) * radius, z: -Math.sin(angle) * radius - 0.4, height, width: 0.3 + random() * 0.45, depth: 0.3 + random() * 0.45 };
  });
}

function City() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const windows = useMemo(() => createWindowsTexture(), []);
  const buildings = useMemo(() => createBuildings(70), []);

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    buildings.forEach((building, i) => {
      dummy.position.set(building.x, building.height / 2, building.z);
      dummy.scale.set(building.width, building.height, building.depth);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current!.instanceMatrix.needsUpdate = true;
  }, [buildings]);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, buildings.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#0b0f0c" roughness={0.9} emissive="#ffffff" emissiveMap={windows} emissiveIntensity={0.9} />
    </instancedMesh>
  );
}

function Rig() {
  const { camera } = useThree();
  useLayoutEffect(() => {
    camera.position.copy(CAMERA);
    camera.lookAt(0, 1.45, 0);
  }, [camera]);
  return null;
}

export default function KaijuScene({ active, onReady, onRage }: { active: boolean; onReady: () => void; onRage: (state: RageState) => void }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 30, near: 0.1, far: 40 }}
    >
      <Rig />
      <fog attach="fog" args={[BACKGROUND, 13, 24]} />
      <ambientLight intensity={0.9} color="#c8ffd0" />
      <directionalLight position={[-4, 6, 6]} intensity={3.2} color="#f1ffe0" />
      {/* Contraluz verde: recorta a silhueta, como na ilustração original. */}
      <pointLight position={[2.5, 3.2, -3]} intensity={60} color={NEON} distance={14} />
      <pointLight position={[-2.5, 2.4, 1.5]} intensity={14} color={NEON} distance={9} />
      <Kaiju onReady={onReady} onRage={onRage} />
      <City />
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL, USE_DRACO, USE_MESHOPT);
