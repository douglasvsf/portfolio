"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";

/**
 * Cena 3D do topo da home: um kaiju low-poly "respirando", com a cabeça
 * seguindo o mouse, placas dorsais em neon e uma cidade ao fundo.
 *
 * Modelo: "T-Rex" de Quaternius (CC0), com esqueleto e animações. Tudo o que o
 * transforma em kaiju é feito aqui, por código: materiais, placas e luzes.
 * A cidade também é gerada por código (caixas instanciadas) — nenhum arquivo a mais.
 */

const MODEL_URL = "/models/kaiju.glb";
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

function Kaiju({ onReady }: { onReady: () => void }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions, mixer } = useAnimations(animations, group);
  const pointer = usePointer();
  const look = useRef(new THREE.Vector2());
  const frames = useRef(0);

  const bones = useMemo(() => {
    const found: Record<string, THREE.Bone> = {};
    scene.traverse((object) => {
      if ((object as THREE.Bone).isBone) found[object.name] = object as THREE.Bone;
    });
    return found;
  }, [scene]);

  // Materiais, escala e placas dorsais: uma vez, com o modelo ainda na pose original.
  useLayoutEffect(() => {
    const meshes: THREE.SkinnedMesh[] = [];
    scene.traverse((object) => {
      const mesh = object as THREE.SkinnedMesh;
      if (!mesh.isMesh) return;
      meshes.push(mesh);
      mesh.frustumCulled = false;
      const source = mesh.material as THREE.MeshStandardMaterial;
      const style = PALETTE[source.name] ?? PALETTE.Green!;
      mesh.material = new THREE.MeshStandardMaterial({
        name: source.name,
        color: style.color,
        emissive: style.emissive ?? "#000000",
        emissiveIntensity: style.intensity ?? 0,
        roughness: style.roughness ?? 0.7,
        metalness: 0.1,
        flatShading: true,
      });
    });

    // Normaliza: pés no chão (y = 0), centralizado, com a altura definida.
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

    addDorsalPlates(scene, bones, meshes, size.y * scale);
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

  // Depois da animação do quadro: gira pescoço e cabeça na direção do ponteiro.
  useFrame((state, delta) => {
    const root = group.current;
    if (!root) return;
    // Só avisa o palco depois de alguns quadros desenhados: a troca imagem → cena não pisca.
    if (frames.current < READY_AFTER_FRAMES && ++frames.current === READY_AFTER_FRAMES) onReady();
    const ease = 1 - Math.exp(-delta * 4);
    look.current.lerp(pointer.current, ease);

    root.rotation.y = BASE_YAW + look.current.x * 0.18;
    root.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.03;

    const yaw = look.current.x * 0.55;
    const pitch = -look.current.y * 0.3;
    turnBone(bones.Neck, root, yaw * 0.4, pitch * 0.4);
    turnBone(bones.Head, root, yaw * 0.6, pitch * 0.6);
  });

  return (
    <group ref={group} rotation-y={BASE_YAW} onClick={roar}>
      <primitive object={scene} />
    </group>
  );
}

const UP = new THREE.Vector3();
const SIDE = new THREE.Vector3();
const parentQuaternion = new THREE.Quaternion();
const turn = new THREE.Quaternion();

/** Pose que a animação deixou em cada osso e o resultado do último quadro (com o olhar somado). */
const poses = new WeakMap<THREE.Bone, { base: THREE.Quaternion; result: THREE.Quaternion }>();

/**
 * Vira o osso na direção do olhar, sempre a partir da pose da animação.
 *
 * O three só reescreve um osso quando o valor da animação muda; no "parado" a
 * cabeça quase não se mexe. Somar a rotação direto no osso a cada quadro
 * acumulava — a cabeça girava sem parar. Então: se o osso está como deixamos
 * no quadro anterior, a animação não mexeu e a base continua a mesma; se mudou,
 * a animação escreveu e essa é a base nova.
 */
function turnBone(bone: THREE.Bone | undefined, body: THREE.Object3D, yaw: number, pitch: number) {
  if (!bone?.parent) return;
  let pose = poses.get(bone);
  if (!pose) {
    pose = { base: bone.quaternion.clone(), result: bone.quaternion.clone() };
    poses.set(bone, pose);
  }
  if (!bone.quaternion.equals(pose.result)) pose.base.copy(bone.quaternion);

  bone.parent.getWorldQuaternion(parentQuaternion).invert();
  UP.set(0, 1, 0).applyQuaternion(parentQuaternion);
  SIDE.set(1, 0, 0).applyQuaternion(body.quaternion).applyQuaternion(parentQuaternion);
  bone.quaternion.copy(pose.base);
  bone.quaternion.premultiply(turn.setFromAxisAngle(UP, yaw));
  bone.quaternion.premultiply(turn.setFromAxisAngle(SIDE, pitch));
  pose.result.copy(bone.quaternion);
}

/**
 * Placas dorsais ao estilo kaiju. Para cada ponto da espinha, um raio de cima
 * para baixo acha a superfície das costas; a placa nasce ali e é presa ao osso
 * mais próximo — então acompanha a respiração e o ataque.
 */
function addDorsalPlates(scene: THREE.Object3D, bones: Record<string, THREE.Bone>, meshes: THREE.SkinnedMesh[], bodyHeight: number) {
  if (scene.getObjectByName("dorsal-plate-0")) return;
  const chain = SPINE.map((name) => bones[name]).filter((bone): bone is THREE.Bone => Boolean(bone));
  if (chain.length < 2) return;

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
      const plate = new THREE.Mesh(geometry, material);
      plate.name = `dorsal-plate-${index++}`;
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

/** Enquadra o kaiju inteiro, de baixo para cima (parece maior). */
function Rig() {
  const { camera } = useThree();
  useLayoutEffect(() => {
    camera.position.set(0.4, 1.35, 10.5);
    camera.lookAt(0, 1.45, 0);
  }, [camera]);
  return null;
}

export default function KaijuScene({ active, onReady }: { active: boolean; onReady: () => void }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 30, near: 0.1, far: 40 }}
      style={{ cursor: "pointer" }}
    >
      <Rig />
      <fog attach="fog" args={[BACKGROUND, 13, 24]} />
      <ambientLight intensity={0.9} color="#c8ffd0" />
      <directionalLight position={[-4, 6, 6]} intensity={3.2} color="#f1ffe0" />
      {/* Contraluz verde: recorta a silhueta, como na ilustração original. */}
      <pointLight position={[2.5, 3.2, -3]} intensity={60} color={NEON} distance={14} />
      <pointLight position={[-2.5, 2.4, 1.5]} intensity={14} color={NEON} distance={9} />
      <Kaiju onReady={onReady} />
      <City />
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
