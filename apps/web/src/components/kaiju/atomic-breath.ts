import * as THREE from "three";
import type { RagePhase } from "./rage";

/**
 * Sopro atômico do kaiju, todo feito por código (nenhuma textura externa):
 *
 * - três camadas de feixe com um shader próprio: bordas que somem suavemente
 *   (o brilho depende do ângulo entre a superfície e a câmera, como um volume
 *   de luz) e energia correndo da boca para a ponta;
 * - um clarão na boca, que primeiro cresce enquanto ele carrega;
 * - faíscas que saem com o raio, em espiral;
 * - uma luz azul que ilumina o focinho e os prédios próximos.
 *
 * Tudo com mistura aditiva (soma luz). O conjunto fica preso ao osso do
 * maxilar, então acompanha a cabeça — e o mouse.
 */

const ATOMIC = "#52c8ff";
const BEAM_LENGTH = 17;
const SPARKS = 150;

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uPower;
  uniform float uTime;
  uniform float uCore;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    // 1 no meio do feixe (superfície de frente para a câmera), 0 na borda: borda suave, sem contorno duro.
    float facing = pow(max(dot(normalize(vNormal), normalize(vView)), 0.0), uPower);
    // 0 na boca, 1 na ponta.
    float along = 1.0 - vUv.y;
    // Energia correndo: faixas em espiral que avançam com o tempo.
    float flow = 0.72 + 0.28 * sin(along * 70.0 - uTime * 42.0 + vUv.x * 18.85);
    float pulse = 0.88 + 0.12 * sin(along * 9.0 - uTime * 17.0);
    float ends = smoothstep(0.0, 0.015, along) * smoothstep(1.0, 0.8, along);
    float alpha = facing * flow * pulse * ends * uOpacity;
    vec3 color = mix(uColor, vec3(1.0), uCore * pow(facing, 2.5));
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

interface Layer {
  mesh: THREE.Mesh<THREE.CylinderGeometry, THREE.ShaderMaterial>;
  opacity: number;
  wobble: number;
}

export interface AtomicBreath {
  /** Atualiza o efeito a cada quadro. Fora de "charging"/"firing", fica invisível. */
  update(phase: RagePhase, phaseTime: number, time: number, durations: Record<"charging" | "firing", number>): void;
}

/** Disco de luz suave (branco no centro → azul → transparente): clarão e faíscas. */
function glowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.18, "rgba(214,244,255,0.95)");
  gradient.addColorStop(0.45, "rgba(82,200,255,0.45)");
  gradient.addColorStop(1, "rgba(82,200,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Cilindro ao longo de +Z, da boca (z = 0) até z = 1; o comprimento vem da escala. Abre em cone suave. */
function tube(near: number, far: number) {
  const geometry = new THREE.CylinderGeometry(far, near, 1, 28, 1, true);
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, 0, 0.5);
  return geometry;
}

function layer(near: number, far: number, color: string, power: number, core: number, opacity: number, wobble: number): Layer {
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: 0 }, uPower: { value: power }, uTime: { value: 0 }, uCore: { value: core } },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  });
  const mesh = new THREE.Mesh(tube(near, far), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 3;
  return { mesh, opacity, wobble };
}

/**
 * Cria o sopro na boca e o prende ao osso `jaw`. `origin` e `orientation` estão
 * em coordenadas do mundo (centro da boca e "para a frente" do modelo).
 */
export function createAtomicBreath(jaw: THREE.Bone, origin: THREE.Vector3, orientation: THREE.Quaternion): AtomicBreath {
  const group = new THREE.Group();
  group.name = "atomic-breath";
  group.visible = false;

  const layers = [
    // Núcleo fino e branco, miolo azul e um halo largo e bem tênue.
    layer(0.09, 0.17, "#c9f1ff", 1.0, 1, 1.7, 0.1),
    layer(0.2, 0.44, ATOMIC, 1.3, 0.3, 1.25, 0.16),
    layer(0.4, 1.0, "#1f7dff", 2.4, 0, 0.6, 0.22),
  ];

  const texture = glowTexture();
  const flare = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, color: "#ffffff", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false, toneMapped: false }));
  flare.renderOrder = 4;

  // Faíscas: cada uma tem uma fase, um ângulo e um raio próprios; a posição é recalculada por quadro.
  const seeds = Array.from({ length: SPARKS }, (_, i) => {
    const hash = (n: number) => {
      const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    return { phase: hash(1), angle: hash(2) * Math.PI * 2, radius: 0.4 + hash(3) * 0.9, speed: 0.7 + hash(4) * 0.9 };
  });
  const positions = new Float32Array(SPARKS * 3);
  const sparkGeometry = new THREE.BufferGeometry();
  sparkGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const sparks = new THREE.Points(
    sparkGeometry,
    new THREE.PointsMaterial({ map: texture, color: "#cfefff", size: 0.22, sizeAttenuation: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }),
  );
  sparks.frustumCulled = false;
  sparks.renderOrder = 4;

  const light = new THREE.PointLight(ATOMIC, 0, 13);
  light.position.set(0, 0, 0.7);

  group.add(...layers.map((item) => item.mesh), flare, sparks, light);
  group.position.copy(origin);
  group.quaternion.copy(orientation);
  group.updateMatrixWorld(true);
  jaw.attach(group);

  return {
    update(phase, phaseTime, time, durations) {
      const charging = phase === "charging";
      const firing = phase === "firing";
      group.visible = charging || firing;
      if (!group.visible) return;

      const flicker = 1 + 0.14 * Math.sin(time * 67) + 0.07 * Math.sin(time * 151);
      // Carregando: 0 → 1. Disparando: o raio cresce rápido e some nos últimos instantes.
      const charge = charging ? phaseTime / durations.charging : 1;
      const grow = firing ? Math.min(1, phaseTime / 0.14) : 0;
      const fade = firing ? Math.min(1, (durations.firing - phaseTime) / 0.35) : 0;

      for (const item of layers) {
        const width = 1 + item.wobble * (flicker - 1) * 4;
        item.mesh.visible = firing;
        item.mesh.scale.set(width, width, BEAM_LENGTH * grow);
        item.mesh.material.uniforms.uOpacity!.value = item.opacity * fade;
        item.mesh.material.uniforms.uTime!.value = time;
      }

      // Clarão: cresce enquanto a energia se concentra; no disparo fica grande e treme.
      const flareSize = charging ? (0.2 + 1.1 * charge * charge) * flicker : 1.9 * flicker * (0.4 + 0.6 * fade);
      flare.scale.setScalar(flareSize);
      flare.material.opacity = charging ? 0.25 + 0.75 * charge : fade;
      light.intensity = (charging ? 16 * charge : 46 * fade) * flicker;

      sparks.visible = firing;
      if (firing) {
        seeds.forEach((seed, i) => {
          // Avança da boca à ponta e recomeça; gira em espiral e se afasta do eixo conforme anda.
          const t = (seed.phase + time * 0.55 * seed.speed) % 1;
          const reach = t * grow;
          const spin = seed.angle + time * 5 * seed.speed + reach * 9;
          const spread = (0.1 + reach * 0.75) * seed.radius;
          positions[i * 3] = Math.cos(spin) * spread;
          positions[i * 3 + 1] = Math.sin(spin) * spread;
          positions[i * 3 + 2] = reach * BEAM_LENGTH * 0.9;
        });
        sparkGeometry.attributes.position!.needsUpdate = true;
        sparks.material.opacity = 0.9 * fade;
      }
    },
  };
}
