"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  OrbitControls,
  useGLTF,
  useProgress,
} from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { REGION_MAP, type ViewMode } from "./brain-data";
import {
  CAMERA_PRESETS,
  SCENE_REGIONS,
  type CameraPreset,
  type SceneRegion,
} from "./scene-data";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const assetPath = (path: string) => `${BASE_PATH}${path}`;
const CAMERA_TARGET = new THREE.Vector3(0, -0.02, 0);
const CAMERA_DIRECTION_ENTRIES = (
  Object.entries(CAMERA_PRESETS) as [
    CameraPreset,
    (typeof CAMERA_PRESETS)[CameraPreset],
  ][]
).map(([preset, config]) => [
  preset,
  new THREE.Vector3(...config.position).normalize(),
] as const);

export type SectionPlane = "sagittal" | "coronal" | "axial";
export type HemisphereMode = "both" | "left" | "right";
export type LabelDensity = "off" | "focus" | "key" | "all";
export type CameraView = CameraPreset | "free";

type ViewerProps = {
  mode: ViewMode;
  selectedId: string;
  labelDensity: LabelDensity;
  colorized: boolean;
  separation: number;
  section: number;
  sectionPlane: SectionPlane;
  hemisphere: HemisphereMode;
  cameraPreset: CameraPreset;
  cameraCommandId: number;
  onSelect: (id: string) => void;
  onCameraViewChange: (view: CameraView) => void;
  onRequestView: (preset: CameraPreset) => void;
};

type AnchorSide = "left" | "right" | "midline";

type RegionAnchor = {
  key: string;
  id: string;
  side: AnchorSide;
  position: THREE.Vector3;
  normal: THREE.Vector3;
  region: SceneRegion;
};

type ProjectedAnnotation = {
  key: string;
  id: string;
  side?: "L" | "R";
  x: number;
  y: number;
  label: string;
  color: string;
  selected: boolean;
  priority: 1 | 2 | 3;
  kind: "inline" | "callout";
  worldPosition: [number, number, number];
};

type AnnotationFrame = {
  items: ProjectedAnnotation[];
  width: number;
  height: number;
  hiddenSelected?: {
    id: string;
    label: string;
    color: string;
    bestView: CameraPreset;
  };
};

type StructureProps = {
  id: string;
  selectedId: string;
  onSelect: (id: string) => void;
  children: React.ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  opacity?: number;
};

const INLINE_REGION_IDS = new Set(["frontal", "parietal", "temporal", "occipital"]);

function anchorsForRegion(
  region: SceneRegion,
  hemisphere: HemisphereMode,
  separation: number,
  view?: CameraPreset,
): RegionAnchor[] {
  const allowedSides: AnchorSide[] =
    region.laterality === "midline"
      ? ["midline"]
      : region.laterality === "left"
        ? hemisphere === "right" ? [] : ["left"]
        : hemisphere === "both" ? ["left", "right"] : [hemisphere];

  return allowedSides.map((side) => {
    const direction = side === "right" ? -1 : 1;
    const viewPosition = side !== "midline" && view
      ? region.viewPositions?.[view]?.[side]
      : undefined;
    const atlasPosition = side === "midline"
      ? region.position
      : viewPosition ?? region.sidePositions?.[side] ?? [
        Math.abs(region.position[0]) * direction,
        region.position[1],
        region.position[2],
      ];
    const position = new THREE.Vector3(...atlasPosition);
    if (side !== "midline") position.x += direction * separation * 0.32;
    const normal = viewPosition && view
      ? new THREE.Vector3(...CAMERA_PRESETS[view].position).normalize()
      : new THREE.Vector3(
        side === "midline" ? position.x : direction * Math.max(Math.abs(position.x), 0.2),
        position.y * 0.28,
        position.z * 0.32,
      ).normalize();
    return {
      key: `${region.id}-${side}`,
      id: region.id,
      side,
      position,
      normal,
      region,
    };
  });
}

function classifyCamera(camera: THREE.Camera): {
  nearest: CameraPreset;
  view: CameraView;
  confidence: number;
} {
  const direction = camera.position.clone().sub(CAMERA_TARGET).normalize();
  let closest: CameraPreset = "lateral";
  let closestDot = -Infinity;

  for (const [preset, presetDirection] of CAMERA_DIRECTION_ENTRIES) {
    const dot = direction.dot(presetDirection);
    if (dot > closestDot) {
      closest = preset;
      closestDot = dot;
    }
  }

  return {
    nearest: closest,
    view: closestDot >= 0.955 ? closest : "free",
    confidence: closestDot,
  };
}

function CameraRig({
  preset,
  commandId,
  onMovingChange,
  onViewChange,
}: {
  preset: CameraPreset;
  commandId: number;
  onMovingChange: (moving: boolean) => void;
  onViewChange: (view: CameraView) => void;
}) {
  const { camera } = useThree();
  const controls = useRef<OrbitControlsImpl | null>(null);
  const goal = useRef(new THREE.Vector3(...CAMERA_PRESETS[preset].position));
  const moving = useRef(true);
  const settleFrames = useRef(0);
  const lastView = useRef<CameraView>("free");

  const reportView = useCallback((view: CameraView) => {
    if (lastView.current === view) return;
    lastView.current = view;
    onViewChange(view);
  }, [onViewChange]);

  useEffect(() => {
    goal.current.set(...CAMERA_PRESETS[preset].position);
    camera.up.set(...CAMERA_PRESETS[preset].up);
    moving.current = true;
    settleFrames.current = 0;
    reportView("free");
    onMovingChange(true);
  }, [camera, commandId, onMovingChange, preset, reportView]);

  useFrame(() => {
    if (moving.current) {
      camera.position.lerp(goal.current, 0.085);
      camera.lookAt(CAMERA_TARGET);
      controls.current?.target.lerp(CAMERA_TARGET, 0.12);
      controls.current?.update();
      if (camera.position.distanceTo(goal.current) < 0.012) {
        moving.current = false;
        onMovingChange(false);
        reportView(preset);
      }
      return;
    }

    if (settleFrames.current > 0) {
      settleFrames.current -= 1;
      if (settleFrames.current === 0) {
        onMovingChange(false);
        reportView(classifyCamera(camera).view);
      }
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      minDistance={1.45}
      maxDistance={4.3}
      rotateSpeed={0.62}
      zoomSpeed={0.72}
      dampingFactor={0.065}
      enableDamping
      onStart={() => {
        moving.current = false;
        settleFrames.current = 0;
        reportView("free");
        onMovingChange(true);
      }}
      onEnd={() => {
        settleFrames.current = 10;
      }}
    />
  );
}

function Hemisphere({
  side,
  mode,
  colorized,
  separation,
  section,
  sectionPlane,
  onSelect,
}: {
  side: "left" | "right";
  mode: ViewMode;
  colorized: boolean;
  separation: number;
  section: number;
  sectionPlane: SectionPlane;
  onSelect: (id: string) => void;
}) {
  const { scene } = useGLTF(assetPath(`/models/bigbrain-${side}.glb`));
  const clone = useMemo(() => {
    const corticalScene = scene.clone(true);
    corticalScene.traverse((child: THREE.Object3D) => {
      if (!(child instanceof THREE.Mesh)) return;
      if (!child.geometry.getAttribute("normal")) {
        child.geometry.computeVertexNormals();
      }
    });
    return corticalScene;
  }, [scene]);
  const clippingPlane = useRef(new THREE.Plane(new THREE.Vector3(-1, 0, 0), 10));

  useEffect(() => {
    const normals: Record<SectionPlane, THREE.Vector3> = {
      sagittal: new THREE.Vector3(-1, 0, 0),
      coronal: new THREE.Vector3(0, -1, 0),
      axial: new THREE.Vector3(0, 0, -1),
    };
    const extent = sectionPlane === "coronal" ? 0.95 : 0.86;
    clippingPlane.current.normal.copy(normals[sectionPlane]);
    clippingPlane.current.constant = section <= 0.005 ? 10 : extent - section * extent * 2;
  }, [section, sectionPlane]);

  useEffect(() => {
    const materials: THREE.Material[] = [];
    clone.traverse((child: THREE.Object3D) => {
      if (!(child instanceof THREE.Mesh)) return;
      const material = new THREE.MeshPhysicalMaterial({
        color: colorized ? "#ffffff" : "#c8a397",
        vertexColors: colorized,
        roughness: mode === "surface" ? 0.78 : 0.58,
        metalness: 0,
        clearcoat: mode === "surface" ? 0.04 : 0.12,
        clearcoatRoughness: 0.86,
        transparent: mode !== "surface",
        opacity: mode === "surface" ? 1 : mode === "deep" ? 0.16 : 0.09,
        depthWrite: mode === "surface",
        side: THREE.DoubleSide,
        clippingPlanes: [clippingPlane.current],
      });
      child.castShadow = false;
      child.receiveShadow = true;
      child.material = material;
      materials.push(material);
    });
    return () => materials.forEach((material) => material.dispose());
  }, [clone, colorized, mode]);

  const selectSurfaceRegion = (point: THREE.Vector3) => {
    if (mode !== "surface") return;
    if (point.y < -0.42) onSelect("occipital");
    else if (point.z < -0.11) onSelect("temporal");
    else if (point.y > 0.2) onSelect("frontal");
    else onSelect("parietal");
  };

  const direction = side === "left" ? 1 : -1;
  return (
    <primitive
      object={clone}
      position={[direction * separation * 0.32, 0, 0]}
      renderOrder={mode === "surface" ? 1 : 0}
      onClick={(event: { stopPropagation: () => void; point: THREE.Vector3 }) => {
        event.stopPropagation();
        selectSurfaceRegion(event.point);
      }}
      onPointerEnter={() => {
        if (mode === "surface") document.body.style.cursor = "crosshair";
      }}
      onPointerLeave={() => {
        document.body.style.cursor = "default";
      }}
    />
  );
}

function AnatomyMaterial({
  id,
  selected,
  opacity = 0.94,
}: {
  id: string;
  selected: boolean;
  opacity?: number;
}) {
  const color = REGION_MAP[id]?.color ?? "#aab7ca";
  return (
    <meshPhysicalMaterial
      color={color}
      emissive={selected ? color : "#000000"}
      emissiveIntensity={selected ? 0.5 : 0.06}
      roughness={0.38}
      metalness={0.02}
      clearcoat={0.42}
      clearcoatRoughness={0.5}
      transparent={opacity < 1}
      opacity={opacity}
    />
  );
}

function Structure({
  id,
  selectedId,
  onSelect,
  children,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
}: StructureProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <group
      position={position}
      rotation={rotation}
      scale={hovered && selectedId !== id ? scale.map((value) => value * 1.035) as [number, number, number] : scale}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(id);
      }}
      onPointerEnter={(event) => {
        event.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerLeave={() => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
    >
      {children}
    </group>
  );
}

function TubeStructure({
  id,
  points,
  radius,
  selectedId,
  onSelect,
  mirrored = false,
}: {
  id: string;
  points: [number, number, number][];
  radius: number;
  selectedId: string;
  onSelect: (id: string) => void;
  mirrored?: boolean;
}) {
  const curves = useMemo(() => {
    const primary = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
    if (!mirrored) return [primary];
    const mirror = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(-x, y, z)));
    return [primary, mirror];
  }, [mirrored, points]);

  return (
    <Structure id={id} selectedId={selectedId} onSelect={onSelect}>
      {curves.map((curve, index) => (
        <mesh key={index}>
          <tubeGeometry args={[curve, 72, radius, 16, false]} />
          <AnatomyMaterial id={id} selected={selectedId === id} opacity={id === "ventricles" ? 0.72 : 0.95} />
        </mesh>
      ))}
    </Structure>
  );
}

function Cerebellum({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <Structure id="cerebellum" selectedId={selectedId} onSelect={onSelect}>
      {[-0.22, 0.22].map((x) => (
        <group key={x} position={[x, -0.55, -0.37]} scale={[0.25, 0.28, 0.22]}>
          <mesh>
            <sphereGeometry args={[1, 64, 40]} />
            <AnatomyMaterial id="cerebellum" selected={selectedId === "cerebellum"} />
          </mesh>
          {[-0.68, -0.34, 0, 0.34, 0.68].map((z) => (
            <mesh key={z} position={[0, 0, z * 0.72]} rotation={[Math.PI / 2, 0, 0]} scale={[0.88 - Math.abs(z) * 0.18, 0.88 - Math.abs(z) * 0.18, 1]}>
              <torusGeometry args={[0.72, 0.018, 8, 64]} />
              <meshBasicMaterial color="#5c342d" transparent opacity={0.38} />
            </mesh>
          ))}
        </group>
      ))}
    </Structure>
  );
}

function Brainstem({
  mode,
  selectedId,
  onSelect,
}: {
  mode: ViewMode;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <group>
      {mode !== "surface" && (
        <>
          <Structure id="midbrain" selectedId={selectedId} onSelect={onSelect} position={[0, -0.06, -0.24]} scale={[0.13, 0.13, 0.12]}>
            <mesh><sphereGeometry args={[1, 48, 32]} /><AnatomyMaterial id="midbrain" selected={selectedId === "midbrain"} /></mesh>
          </Structure>
          <Structure id="pons" selectedId={selectedId} onSelect={onSelect} position={[0, -0.08, -0.39]} scale={[0.16, 0.13, 0.12]}>
            <mesh><sphereGeometry args={[1, 48, 32]} /><AnatomyMaterial id="pons" selected={selectedId === "pons"} /></mesh>
          </Structure>
        </>
      )}
      <Structure id="medulla" selectedId={selectedId} onSelect={onSelect} position={[0, -0.09, -0.52]} scale={[0.09, 0.085, 0.21]}>
        <mesh><capsuleGeometry args={[0.65, 1.25, 12, 28]} /><AnatomyMaterial id="medulla" selected={selectedId === "medulla"} /></mesh>
      </Structure>
    </group>
  );
}

function DeepAnatomy({
  mode,
  selectedId,
  onSelect,
}: {
  mode: ViewMode;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (mode === "surface") {
    return (
      <>
        <Cerebellum selectedId={selectedId} onSelect={onSelect} />
        <Brainstem mode={mode} selectedId={selectedId} onSelect={onSelect} />
      </>
    );
  }

  const callosum: [number, number, number][] = [
    [0, 0.38, 0.09], [0, 0.2, 0.23], [0, -0.05, 0.31], [0, -0.33, 0.2], [0, -0.44, 0.09],
  ];
  const hippocampus: [number, number, number][] = [
    [0.22, 0.32, -0.22], [0.25, 0.12, -0.27], [0.24, -0.14, -0.28], [0.17, -0.37, -0.17],
  ];
  const ventricles: [number, number, number][] = [
    [0.09, 0.29, 0.12], [0.13, 0.08, 0.19], [0.12, -0.18, 0.18], [0.07, -0.34, 0.08],
  ];

  return (
    <group>
      <TubeStructure id="corpus-callosum" points={callosum} radius={0.043} selectedId={selectedId} onSelect={onSelect} />
      <TubeStructure id="hippocampus" points={hippocampus} radius={0.055} mirrored selectedId={selectedId} onSelect={onSelect} />
      <TubeStructure id="ventricles" points={ventricles} radius={0.035} mirrored selectedId={selectedId} onSelect={onSelect} />

      {[-0.12, 0.12].map((x) => (
        <Structure key={`thalamus-${x}`} id="thalamus" selectedId={selectedId} onSelect={onSelect} position={[x, -0.04, 0.01]} scale={[0.12, 0.18, 0.105]}>
          <mesh><sphereGeometry args={[1, 56, 36]} /><AnatomyMaterial id="thalamus" selected={selectedId === "thalamus"} /></mesh>
        </Structure>
      ))}
      {[-0.22, 0.22].map((x) => (
        <Structure key={`basal-${x}`} id="basal-ganglia" selectedId={selectedId} onSelect={onSelect} position={[x, 0.08, 0.055]} rotation={[0.2, 0.25, 0]} scale={[0.09, 0.17, 0.085]}>
          <mesh><capsuleGeometry args={[0.62, 0.95, 10, 28]} /><AnatomyMaterial id="basal-ganglia" selected={selectedId === "basal-ganglia"} /></mesh>
        </Structure>
      ))}
      {[-0.25, 0.25].map((x) => (
        <Structure key={`amygdala-${x}`} id="amygdala" selectedId={selectedId} onSelect={onSelect} position={[x, 0.31, -0.23]} scale={[0.07, 0.085, 0.072]}>
          <mesh><sphereGeometry args={[1, 48, 32]} /><AnatomyMaterial id="amygdala" selected={selectedId === "amygdala"} /></mesh>
        </Structure>
      ))}
      <Structure id="hypothalamus" selectedId={selectedId} onSelect={onSelect} position={[0, 0.08, -0.14]} scale={[0.09, 0.095, 0.075]}>
        <mesh><sphereGeometry args={[1, 48, 32]} /><AnatomyMaterial id="hypothalamus" selected={selectedId === "hypothalamus"} /></mesh>
      </Structure>
      <Structure id="pituitary" selectedId={selectedId} onSelect={onSelect}>
        <mesh position={[0, 0.13, -0.265]} scale={[0.018, 0.018, 0.11]}><cylinderGeometry args={[1, 1, 1, 18]} /><AnatomyMaterial id="pituitary" selected={selectedId === "pituitary"} /></mesh>
        <mesh position={[0, 0.14, -0.35]} scale={[0.062, 0.066, 0.052]}><sphereGeometry args={[1, 48, 32]} /><AnatomyMaterial id="pituitary" selected={selectedId === "pituitary"} /></mesh>
      </Structure>
      <Structure id="pineal" selectedId={selectedId} onSelect={onSelect} position={[0, -0.235, 0.055]} scale={[0.045, 0.065, 0.045]}>
        <mesh><sphereGeometry args={[1, 40, 28]} /><AnatomyMaterial id="pineal" selected={selectedId === "pineal"} /></mesh>
      </Structure>
      <Cerebellum selectedId={selectedId} onSelect={onSelect} />
      <Brainstem mode={mode} selectedId={selectedId} onSelect={onSelect} />
    </group>
  );
}

function AnimatedPath({
  points,
  color,
  offset,
}: {
  points: [number, number, number][];
  color: string;
  offset: number;
}) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point))),
    [points],
  );
  const particles = useRef<Array<THREE.Mesh | null>>([]);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useFrame(({ clock }) => {
    particles.current.forEach((particle, index) => {
      if (!particle) return;
      const time = reduceMotion ? 0 : clock.elapsedTime * 0.12;
      const t = (time + offset + index / particles.current.length) % 1;
      particle.position.copy(curve.getPointAt(t));
    });
  });

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 96, 0.007, 8, false]} />
        <meshBasicMaterial color={color} transparent opacity={0.36} blending={THREE.AdditiveBlending} />
      </mesh>
      {[0, 1, 2].map((index) => (
        <mesh
          key={index}
          ref={(node) => { particles.current[index] = node; }}
          scale={0.018}
        >
          <sphereGeometry args={[1, 16, 12]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function FunctionalPathways() {
  return (
    <group>
      <AnimatedPath
        color="#61d9ff"
        offset={0}
        points={[[0.12, -0.03, 0.02], [0.34, -0.06, 0.15], [0.58, -0.14, 0.34], [0.7, -0.18, 0.39]]}
      />
      <AnimatedPath
        color="#ffd166"
        offset={0.27}
        points={[[0.69, 0.08, 0.32], [0.4, 0.03, 0.16], [0.12, -0.04, -0.18], [0, -0.08, -0.53]]}
      />
      <AnimatedPath
        color="#c799ff"
        offset={0.51}
        points={[[0.25, 0.3, -0.23], [0.24, 0.03, -0.27], [0.08, -0.32, -0.1], [0, -0.04, 0.21], [-0.25, 0.3, -0.23]]}
      />
      <AnimatedPath
        color="#ff9fd5"
        offset={0.72}
        points={[[0.7, 0.42, -0.08], [0.78, 0.2, 0.03], [0.76, -0.1, 0.03], [0.68, -0.34, -0.08]]}
      />
    </group>
  );
}

function RegionMarkers({
  selectedId,
  annotations,
  onSelect,
}: {
  selectedId: string;
  annotations: ProjectedAnnotation[];
  onSelect: (id: string) => void;
}) {
  const shownMarkers = annotations.filter((annotation) =>
    annotation.kind === "callout",
  );

  return (
    <group>
      {shownMarkers.map((annotation) => {
        const data = REGION_MAP[annotation.id];
        const selected = selectedId === annotation.id;
        return (
          <group key={annotation.key} position={annotation.worldPosition}>
            <mesh
              scale={selected ? 1.32 : 1}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(annotation.id);
              }}
              onPointerEnter={() => { document.body.style.cursor = "pointer"; }}
              onPointerLeave={() => { document.body.style.cursor = "default"; }}
            >
              <sphereGeometry args={[0.019, 20, 14]} />
              <meshBasicMaterial color={data.color} toneMapped={false} />
            </mesh>
            <mesh scale={selected ? 1.3 : 1}>
              <torusGeometry args={[0.034, 0.004, 8, 28]} />
              <meshBasicMaterial color={data.color} transparent opacity={selected ? 0.92 : 0.4} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function AnnotationProjector({
  mode,
  selectedId,
  labelDensity,
  hemisphere,
  separation,
  suspended,
  onUpdate,
}: {
  mode: ViewMode;
  selectedId: string;
  labelDensity: LabelDensity;
  hemisphere: HemisphereMode;
  separation: number;
  suspended: boolean;
  onUpdate: (frame: AnnotationFrame) => void;
}) {
  const { camera, size } = useThree();
  const lastSignature = useRef("");
  const projectionDirty = useRef(true);
  const lastCameraPosition = useRef(new THREE.Vector3(Number.POSITIVE_INFINITY, 0, 0));
  const lastCameraQuaternion = useRef(new THREE.Quaternion());

  useEffect(() => {
    projectionDirty.current = true;
  }, [
    hemisphere,
    labelDensity,
    mode,
    selectedId,
    separation,
    size.height,
    size.width,
    suspended,
  ]);

  useFrame(() => {
    if (suspended) return;

    const cameraMoved =
      lastCameraPosition.current.distanceToSquared(camera.position) > 0.000001
      || 1 - Math.abs(lastCameraQuaternion.current.dot(camera.quaternion)) > 0.000001;
    if (!projectionDirty.current && !cameraMoved) return;

    projectionDirty.current = false;
    lastCameraPosition.current.copy(camera.position);
    lastCameraQuaternion.current.copy(camera.quaternion);

    if (labelDensity === "off") {
      const signature = `off-${size.width}-${size.height}`;
      if (signature !== lastSignature.current) {
        lastSignature.current = signature;
        onUpdate({ items: [], width: size.width, height: size.height });
      }
      return;
    }

    const cameraState = classifyCamera(camera);
    const activePreset = cameraState.nearest;
    const projected: ProjectedAnnotation[] = [];

    for (const region of SCENE_REGIONS) {
      if (!region.layers.includes(mode)) continue;
      if (!region.labelViews.includes(activePreset)) continue;

      const anchors = anchorsForRegion(region, hemisphere, separation, activePreset)
        .sort((a, b) => a.position.distanceToSquared(camera.position) - b.position.distanceToSquared(camera.position));
      let visibleAnchor: RegionAnchor | undefined;

      for (const anchor of anchors) {
        const toCamera = camera.position.clone().sub(anchor.position).normalize();
        if (mode === "surface" && anchor.normal.dot(toCamera) < 0.06) continue;
        visibleAnchor = anchor;
        break;
      }

      if (!visibleAnchor) continue;
      const screen = visibleAnchor.position.clone().project(camera);
      if (screen.z < -1 || screen.z > 1 || Math.abs(screen.x) > 1.06 || Math.abs(screen.y) > 1.06) continue;

      projected.push({
        key: visibleAnchor.key,
        id: region.id,
        side: visibleAnchor.side === "midline"
          || (region.laterality === "bilateral" && hemisphere === "both")
          ? undefined
          : visibleAnchor.side === "left" ? "L" : "R",
        x: (screen.x + 1) * size.width / 2,
        y: (1 - screen.y) * size.height / 2,
        label: REGION_MAP[region.id].shortName,
        color: REGION_MAP[region.id].color,
        selected: region.id === selectedId,
        priority: region.priority,
        kind: mode === "surface" && INLINE_REGION_IDS.has(region.id)
          ? "inline"
          : "callout",
        worldPosition: visibleAnchor.position.toArray(),
      });
    }

    const selected = projected.find((annotation) => annotation.selected);
    const ranked = [...projected].sort((a, b) => {
      if (a.selected !== b.selected) return a.selected ? -1 : 1;
      if (a.priority !== b.priority) return a.priority - b.priority;
      if (!selected) return a.y - b.y;
      return Math.hypot(a.x - selected.x, a.y - selected.y)
        - Math.hypot(b.x - selected.x, b.y - selected.y);
    });

    const requestedLimit = cameraState.view === "free"
      ? labelDensity === "all" ? 5 : 3
      : labelDensity === "all" ? 10 : labelDensity === "key" ? 6 : 3;
    const visible = labelDensity === "focus"
      ? ranked.slice(0, 3)
      : labelDensity === "key"
        ? ranked
          .filter((annotation) => annotation.selected || annotation.priority === 1)
          .slice(0, requestedLimit)
        : ranked.slice(0, requestedLimit);

    const selectedRegion = SCENE_REGIONS.find((region) =>
      region.id === selectedId && region.layers.includes(mode),
    );
    const hiddenSelected = selectedRegion
      && !visible.some((annotation) => annotation.id === selectedId)
      ? {
        id: selectedId,
        label: REGION_MAP[selectedId].shortName,
        color: REGION_MAP[selectedId].color,
        bestView: selectedRegion.bestView,
      }
      : undefined;

    const signature = `${labelDensity}-${selectedId}-${hemisphere}-${cameraState.view}-${activePreset}-${size.width}-${size.height}-${hiddenSelected?.id ?? "visible"}-${visible
      .map((annotation) => `${annotation.key}:${Math.round(annotation.x / 2)}:${Math.round(annotation.y / 2)}`)
      .join("|")}`;
    if (signature !== lastSignature.current) {
      lastSignature.current = signature;
      onUpdate({
        items: visible,
        width: size.width,
        height: size.height,
        hiddenSelected,
      });
    }
  });

  return null;
}

type LaidOutAnnotation = ProjectedAnnotation & {
  lane: "left" | "right";
  labelX: number;
  labelY: number;
  cardWidth: number;
};

const CALLOUT_WIDTH = 136;
const INLINE_WIDTH = 108;
const LABEL_HEIGHT = 38;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function packLane(
  annotations: ProjectedAnnotation[],
  lane: "left" | "right",
  width: number,
  height: number,
): LaidOutAnnotation[] {
  if (!annotations.length) return [];
  const minY = 58;
  const maxY = Math.max(minY, height - 62);
  const gap = 46;
  const sorted = [...annotations].sort((a, b) => a.y - b.y);
  const positions = sorted.map((annotation, index) =>
    Math.max(Math.min(annotation.y, maxY), index === 0 ? minY : minY + index * gap),
  );

  for (let index = 1; index < positions.length; index += 1) {
    positions[index] = Math.max(positions[index], positions[index - 1] + gap);
  }
  if (positions.at(-1)! > maxY) {
    positions[positions.length - 1] = maxY;
    for (let index = positions.length - 2; index >= 0; index -= 1) {
      positions[index] = Math.min(positions[index], positions[index + 1] - gap);
    }
  }

  return sorted.map((annotation, index) => ({
    ...annotation,
    lane,
    labelY: Math.max(minY, positions[index]),
    labelX: clamp(
      annotation.x + (lane === "left" ? -CALLOUT_WIDTH - 34 : 34),
      12,
      width - CALLOUT_WIDTH - 12,
    ),
    cardWidth: CALLOUT_WIDTH,
  }));
}

function layoutInlineAnnotations(
  annotations: ProjectedAnnotation[],
  width: number,
  height: number,
): LaidOutAnnotation[] {
  const occupied: { left: number; right: number; top: number; bottom: number }[] = [];
  const candidates: [number, number][] = [
    [-INLINE_WIDTH / 2, -28],
    [-INLINE_WIDTH / 2, 24],
    [-INLINE_WIDTH - 18, -2],
    [18, -2],
  ];

  return [...annotations]
    .sort((a, b) => Number(b.selected) - Number(a.selected) || a.priority - b.priority)
    .map((annotation) => {
      let chosen = candidates[0];
      for (const candidate of candidates) {
        const left = clamp(annotation.x + candidate[0], 12, width - INLINE_WIDTH - 12);
        const top = clamp(annotation.y + candidate[1] - LABEL_HEIGHT / 2, 12, height - LABEL_HEIGHT - 12);
        const box = {
          left: left - 6,
          right: left + INLINE_WIDTH + 6,
          top: top - 5,
          bottom: top + LABEL_HEIGHT + 5,
        };
        if (!occupied.some((other) =>
          box.left < other.right
          && box.right > other.left
          && box.top < other.bottom
          && box.bottom > other.top
        )) {
          chosen = candidate;
          occupied.push(box);
          break;
        }
      }

      const labelX = clamp(annotation.x + chosen[0], 12, width - INLINE_WIDTH - 12);
      const labelY = clamp(annotation.y + chosen[1], 31, height - 31);
      return {
        ...annotation,
        lane: annotation.x < width / 2 ? "left" : "right",
        labelX,
        labelY,
        cardWidth: INLINE_WIDTH,
      };
    });
}

function layoutAnnotations(frame: AnnotationFrame): LaidOutAnnotation[] {
  const inline = frame.items.filter((annotation) => annotation.kind === "inline");
  const callouts = frame.items.filter((annotation) => annotation.kind === "callout");
  const left = callouts.filter((annotation) => annotation.x < frame.width / 2);
  const right = callouts.filter((annotation) => annotation.x >= frame.width / 2);
  return [
    ...layoutInlineAnnotations(inline, frame.width, frame.height),
    ...packLane(left, "left", frame.width, frame.height),
    ...packLane(right, "right", frame.width, frame.height),
  ];
}

function AnnotationOverlay({
  frame,
  moving,
  onSelect,
  onRequestView,
}: {
  frame: AnnotationFrame;
  moving: boolean;
  onSelect: (id: string) => void;
  onRequestView: (preset: CameraPreset) => void;
}) {
  const annotations = useMemo(() => layoutAnnotations(frame), [frame]);
  if (!annotations.length && !frame.hiddenSelected) return null;

  return (
    <div className={`annotation-layer ${moving ? "is-moving" : ""}`} aria-label="Visible anatomical labels">
      <svg viewBox={`0 0 ${frame.width} ${frame.height}`} preserveAspectRatio="none" aria-hidden="true">
        {annotations.filter((annotation) => annotation.kind === "callout").map((annotation) => {
          const endX = annotation.lane === "left"
            ? annotation.labelX + annotation.cardWidth
            : annotation.labelX;
          const elbowX = (annotation.x + endX) / 2;
          return (
            <g key={annotation.key} style={{ "--annotation-color": annotation.color } as React.CSSProperties}>
              <polyline points={`${annotation.x},${annotation.y} ${elbowX},${annotation.labelY} ${endX},${annotation.labelY}`} />
              <circle cx={annotation.x} cy={annotation.y} r={annotation.selected ? 4.5 : 3} />
            </g>
          );
        })}
      </svg>
      {annotations.map((annotation) => (
        <button
          key={annotation.key}
          className={`annotation-card is-${annotation.lane} is-${annotation.kind} ${annotation.selected ? "is-selected" : ""}`}
          style={{
            left: annotation.labelX,
            top: annotation.labelY,
            width: annotation.cardWidth,
            "--annotation-color": annotation.color,
          } as React.CSSProperties}
          onClick={() => onSelect(annotation.id)}
          aria-label={`Select ${REGION_MAP[annotation.id].name}`}
        >
          <i />
          <span>
            <strong>{annotation.label}</strong>
            {annotation.side && <small>{annotation.side}</small>}
          </span>
        </button>
      ))}
      {frame.hiddenSelected && (
        <div
          className="annotation-hidden-cue"
          style={{ "--annotation-color": frame.hiddenSelected.color } as React.CSSProperties}
          role="status"
        >
          <span>
            <small>Selected structure</small>
            <strong>{frame.hiddenSelected.label} is behind this view</strong>
          </span>
          <button onClick={() => onRequestView(frame.hiddenSelected!.bestView)}>
            Rotate to {CAMERA_PRESETS[frame.hiddenSelected.bestView].label}
          </button>
        </div>
      )}
    </div>
  );
}

function Scene({
  mode,
  selectedId,
  labelDensity,
  colorized,
  separation,
  section,
  sectionPlane,
  hemisphere,
  cameraPreset,
  onSelect,
  onAnnotations,
  onCameraMoving,
  onCameraViewChange,
  cameraMoving,
  visibleMarkerAnnotations,
}: ViewerProps & {
  onAnnotations: (frame: AnnotationFrame) => void;
  onCameraMoving: (moving: boolean) => void;
  cameraMoving: boolean;
  visibleMarkerAnnotations: ProjectedAnnotation[];
}) {
  const shadowStateKey = [
    mode,
    hemisphere,
    sectionPlane,
    Math.round(separation * 20),
    Math.round(section * 20),
  ].join("-");

  return (
    <>
      <CameraRig
        preset={cameraPreset}
        commandId={cameraCommandId}
        onMovingChange={onCameraMoving}
        onViewChange={onCameraViewChange}
      />
      <hemisphereLight args={["#f1f4f7", "#26313b", 1.4]} />
      <ambientLight intensity={0.42} />
      <directionalLight position={[2.4, 2.8, 3.6]} intensity={2.65} color="#fff9f3" />
      <directionalLight position={[-2.8, -1.8, 1.4]} intensity={1.2} color="#b6cbe4" />
      <pointLight position={[0, -2.2, -0.2]} intensity={0.42} color="#d8e5f0" />

      <group rotation={[0, 0, 0]}>
        {hemisphere !== "right" && (
          <Hemisphere
            side="left"
            mode={mode}
            colorized={colorized}
            separation={separation}
            section={section}
            sectionPlane={sectionPlane}
            onSelect={onSelect}
          />
        )}
        {hemisphere !== "left" && (
          <Hemisphere
            side="right"
            mode={mode}
            colorized={colorized}
            separation={separation}
            section={section}
            sectionPlane={sectionPlane}
            onSelect={onSelect}
          />
        )}
        <DeepAnatomy mode={mode} selectedId={selectedId} onSelect={onSelect} />
        {mode === "systems" && <FunctionalPathways />}
        <RegionMarkers
          selectedId={selectedId}
          annotations={cameraMoving ? [] : visibleMarkerAnnotations}
          onSelect={onSelect}
        />
      </group>
      <AnnotationProjector
        mode={mode}
        selectedId={selectedId}
        labelDensity={labelDensity}
        hemisphere={hemisphere}
        separation={separation}
        suspended={cameraMoving}
        onUpdate={onAnnotations}
      />

      <ContactShadows
        key={shadowStateKey}
        position={[0, 0, -0.72]}
        rotation={[0, 0, 0]}
        opacity={0.22}
        scale={2.6}
        blur={2.8}
        far={2.4}
        frames={1}
        resolution={256}
      />
    </>
  );
}

function LoadingOverlay() {
  const { progress, active } = useProgress();
  if (!active && progress >= 100) return null;
  return (
    <div className="model-loader" role="status" aria-live="polite">
      <span>Reconstructing cortex</span>
      <strong>{Math.round(progress)}%</strong>
      <i><b style={{ width: `${progress}%` }} /></i>
    </div>
  );
}

export default function BrainViewer(props: ViewerProps) {
  const { onCameraViewChange } = props;
  const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null);
  const [annotationFrame, setAnnotationFrame] = useState<AnnotationFrame>({
    items: [],
    width: 1,
    height: 1,
  });
  const [cameraMoving, setCameraMoving] = useState(false);
  const [currentCameraView, setCurrentCameraView] = useState<CameraView>("lateral");
  const handleAnnotations = useCallback((frame: AnnotationFrame) => {
    setAnnotationFrame(frame);
  }, []);
  const handleCameraMoving = useCallback((moving: boolean) => {
    setCameraMoving(moving);
  }, []);
  const handleCameraViewChange = useCallback((view: CameraView) => {
    setCurrentCameraView(view);
    onCameraViewChange(view);
  }, [onCameraViewChange]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const probe = document.createElement("canvas");
      const context = probe.getContext("webgl2", { failIfMajorPerformanceCaveat: true })
        ?? probe.getContext("webgl", { failIfMajorPerformanceCaveat: true });
      setWebglAvailable(Boolean(context));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (webglAvailable !== true) {
    return (
      <div className={`viewer-canvas webgl-fallback ${webglAvailable === null ? "is-checking" : ""}`}>
        <Image
          src={assetPath("/images/brainstudy-cortex.png")}
          alt="Atlas-derived lateral cerebral cortical surface with color-coded lobes"
          fill
          priority
          unoptimized
          sizes="(max-width: 920px) 100vw, 55vw"
        />
        {webglAvailable === false && (
          <div className="webgl-notice">
            <strong>Interactive renderer unavailable</strong>
            <span>This browser has 3D graphics disabled. The atlas-derived reference view remains available.</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="viewer-canvas"
      role="region"
      aria-label="Interactive three-dimensional brain model. Drag to rotate and use the camera and dissection controls to change the view."
    >
      <Canvas
        dpr={[1, 1.8]}
        camera={{ position: CAMERA_PRESETS.lateral.position, fov: 34, near: 0.05, far: 20 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <Suspense fallback={null}>
          <Scene
            {...props}
            onAnnotations={handleAnnotations}
            onCameraMoving={handleCameraMoving}
            onCameraViewChange={handleCameraViewChange}
            cameraMoving={cameraMoving}
            visibleMarkerAnnotations={annotationFrame.items}
          />
        </Suspense>
      </Canvas>
      <AnnotationOverlay
        frame={annotationFrame}
        moving={cameraMoving}
        onSelect={props.onSelect}
        onRequestView={props.onRequestView}
      />
      <div
        className="orientation-compass"
        aria-label={`Anatomical orientation. Current view: ${currentCameraView === "free" ? "Free orbit" : CAMERA_PRESETS[currentCameraView].label}`}
      >
        <span className="orientation-superior">S</span>
        <span className="orientation-anterior">A</span>
        <span className="orientation-left">L</span>
        <i aria-hidden="true" />
        <span className="orientation-right">R</span>
        <span className="orientation-posterior">P</span>
        <span className="orientation-inferior">I</span>
      </div>
      <div className="viewer-guidance" aria-hidden="true">
        <span>Drag</span> rotate
        <span>Wheel</span> zoom
        {props.mode === "surface" && <><span>Click cortex</span> identify gross lobe</>}
      </div>
      <LoadingOverlay />
    </div>
  );
}

useGLTF.preload(assetPath("/models/bigbrain-left.glb"));
useGLTF.preload(assetPath("/models/bigbrain-right.glb"));
