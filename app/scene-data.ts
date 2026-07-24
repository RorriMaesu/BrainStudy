import type { ViewMode } from "./brain-data";

export type CameraPreset =
  | "lateral"
  | "medial"
  | "anterior"
  | "posterior"
  | "superior"
  | "inferior";

export type RegionLaterality = "bilateral" | "left" | "midline";

export type SceneRegion = {
  id: string;
  position: [number, number, number];
  sidePositions?: {
    left: [number, number, number];
    right: [number, number, number];
  };
  viewPositions?: Partial<Record<CameraPreset, {
    left: [number, number, number];
    right: [number, number, number];
  }>>;
  layers: ViewMode[];
  laterality: RegionLaterality;
  priority: 1 | 2 | 3;
  labelViews: CameraPreset[];
  bestView: CameraPreset;
};

export const SCENE_REGIONS: SceneRegion[] = [
  { id: "frontal", position: [0.70, 0.43, 0.12], sidePositions: { left: [0.693, 0.420, 0.121], right: [-0.644, 0.418, 0.093] }, viewPositions: { anterior: { left: [0.3090, 0.7468, 0.1220], right: [-0.3125, 0.7534, 0.1157] }, superior: { left: [0.3383, 0.3546, 0.4811], right: [-0.3414, 0.3423, 0.4182] } }, layers: ["surface", "systems"], laterality: "bilateral", priority: 1, labelViews: ["lateral", "anterior", "superior"], bestView: "lateral" },
  { id: "parietal", position: [0.67, -0.18, 0.34], sidePositions: { left: [0.619, -0.176, 0.325], right: [-0.586, -0.102, 0.254] }, viewPositions: { posterior: { left: [0.3569, -0.4611, 0.2735], right: [-0.3469, -0.4512, 0.2829] }, superior: { left: [0.3717, -0.1788, 0.4561], right: [-0.3278, -0.1794, 0.4252] } }, layers: ["surface", "systems"], laterality: "bilateral", priority: 1, labelViews: ["lateral", "posterior", "superior"], bestView: "lateral" },
  { id: "temporal", position: [0.70, 0.12, -0.25], sidePositions: { left: [0.716, 0.132, -0.254], right: [-0.699, 0.116, -0.264] }, viewPositions: { inferior: { left: [0.4257, 0.0363, -0.4845], right: [-0.4072, 0.0009, -0.4437] } }, layers: ["surface", "systems"], laterality: "bilateral", priority: 1, labelViews: ["lateral", "inferior"], bestView: "lateral" },
  { id: "occipital", position: [0.55, -0.69, 0.04], sidePositions: { left: [0.507, -0.667, 0.039], right: [-0.509, -0.625, 0.007] }, viewPositions: { posterior: { left: [0.3230, -0.7934, 0.0580], right: [-0.2923, -0.7763, 0.0445] }, superior: { left: [0.2913, -0.6044, 0.3038], right: [-0.2360, -0.5847, 0.2770] } }, layers: ["surface", "systems"], laterality: "bilateral", priority: 1, labelViews: ["lateral", "posterior", "superior"], bestView: "posterior" },
  { id: "motor-cortex", position: [0.72, 0.08, 0.31], sidePositions: { left: [0.706, 0.071, 0.309], right: [-0.614, 0.054, 0.236] }, viewPositions: { superior: { left: [0.3174, 0.0782, 0.5016], right: [-0.2997, 0.0684, 0.4689] } }, layers: ["surface", "systems"], laterality: "bilateral", priority: 1, labelViews: ["lateral", "superior"], bestView: "superior" },
  { id: "somatosensory", position: [0.72, -0.05, 0.33], sidePositions: { left: [0.697, -0.040, 0.323], right: [-0.618, -0.054, 0.227] }, viewPositions: { superior: { left: [0.3158, -0.0590, 0.4938], right: [-0.3019, -0.0169, 0.4552] } }, layers: ["surface", "systems"], laterality: "bilateral", priority: 1, labelViews: ["lateral", "superior"], bestView: "superior" },
  { id: "broca", position: [0.69, 0.42, -0.08], sidePositions: { left: [0.708, 0.438, -0.094], right: [-0.690, 0.420, -0.080] }, layers: ["surface", "systems"], laterality: "left", priority: 2, labelViews: ["lateral"], bestView: "lateral" },
  { id: "wernicke", position: [0.68, -0.34, -0.08], sidePositions: { left: [0.683, -0.342, -0.083], right: [-0.680, -0.340, -0.080] }, layers: ["surface", "systems"], laterality: "left", priority: 2, labelViews: ["lateral"], bestView: "lateral" },
  { id: "corpus-callosum", position: [0, -0.03, 0.18], layers: ["deep", "systems"], laterality: "midline", priority: 1, labelViews: ["medial", "superior"], bestView: "medial" },
  { id: "thalamus", position: [0.12, -0.03, 0.01], layers: ["deep", "systems"], laterality: "bilateral", priority: 1, labelViews: ["medial", "superior"], bestView: "medial" },
  { id: "hypothalamus", position: [0, 0.08, -0.15], layers: ["deep", "systems"], laterality: "midline", priority: 2, labelViews: ["medial", "inferior"], bestView: "medial" },
  { id: "pituitary", position: [0, 0.14, -0.34], layers: ["deep", "systems"], laterality: "midline", priority: 3, labelViews: ["medial", "inferior"], bestView: "inferior" },
  { id: "pineal", position: [0, -0.23, 0.06], layers: ["deep", "systems"], laterality: "midline", priority: 3, labelViews: ["medial", "posterior"], bestView: "medial" },
  { id: "hippocampus", position: [0.22, -0.05, -0.23], layers: ["deep", "systems"], laterality: "bilateral", priority: 1, labelViews: ["medial", "inferior"], bestView: "medial" },
  { id: "amygdala", position: [0.25, 0.30, -0.23], layers: ["deep", "systems"], laterality: "bilateral", priority: 2, labelViews: ["medial", "anterior", "inferior"], bestView: "medial" },
  { id: "basal-ganglia", position: [0.22, 0.11, 0.05], layers: ["deep", "systems"], laterality: "bilateral", priority: 1, labelViews: ["medial", "anterior", "superior"], bestView: "medial" },
  { id: "cerebellum", position: [0, 0.38, -0.28], layers: ["surface", "deep", "systems"], laterality: "bilateral", priority: 1, labelViews: ["posterior", "inferior"], bestView: "posterior" },
  { id: "midbrain", position: [0, -0.09, -0.06], layers: ["deep", "systems"], laterality: "midline", priority: 2, labelViews: ["medial", "posterior", "inferior"], bestView: "medial" },
  { id: "pons", position: [0, -0.01, -0.25], layers: ["deep", "systems"], laterality: "midline", priority: 2, labelViews: ["medial", "posterior", "inferior"], bestView: "medial" },
  { id: "medulla", position: [0, 0.12, -0.55], layers: ["surface", "deep", "systems"], laterality: "midline", priority: 1, labelViews: ["posterior", "inferior"], bestView: "inferior" },
  { id: "ventricles", position: [0.11, -0.02, 0.15], layers: ["deep", "systems"], laterality: "bilateral", priority: 2, labelViews: ["medial", "superior"], bestView: "medial" },
];

export const SCENE_REGION_MAP: Record<string, SceneRegion> = Object.fromEntries(
  SCENE_REGIONS.map((region) => [region.id, region]),
);

export type AcademicDetail = {
  connections: string[];
  clinical: string;
  level: string;
};

export const ACADEMIC_DETAILS: Record<string, AcademicDetail> = {
  frontal: {
    connections: ["Frontoparietal control network", "Basal ganglia–thalamic loops", "Limbic and association cortex"],
    clinical: "Focal injury may impair inhibition, working memory, planning, social judgment, or contralateral motor control.",
    level: "Association cortex",
  },
  parietal: {
    connections: ["Dorsal visual stream", "Premotor cortex", "Thalamic somatosensory relays"],
    clinical: "Right-sided lesions can produce hemispatial neglect; dominant-hemisphere lesions may disturb calculation, writing, and praxis.",
    level: "Association + sensory cortex",
  },
  temporal: {
    connections: ["Ventral visual stream", "Auditory pathways", "Medial temporal memory system"],
    clinical: "Damage can alter object recognition, language comprehension, memory formation, or auditory processing.",
    level: "Association + sensory cortex",
  },
  occipital: {
    connections: ["Lateral geniculate nucleus", "Dorsal and ventral visual streams", "Superior colliculus pathways"],
    clinical: "Retrochiasmal lesions often produce predictable contralateral visual-field deficits.",
    level: "Primary + association cortex",
  },
  "motor-cortex": {
    connections: ["Corticospinal tract", "Premotor and supplementary motor areas", "Basal ganglia and cerebellar loops"],
    clinical: "A unilateral lesion commonly causes contralateral weakness with upper-motor-neuron signs.",
    level: "Primary cortex · Brodmann area 4",
  },
  somatosensory: {
    connections: ["Ventral posterior thalamus", "Posterior parietal cortex", "Motor cortex"],
    clinical: "Lesions may reduce discriminative touch, proprioception, stereognosis, and cortical sensory integration contralaterally.",
    level: "Primary cortex · Brodmann areas 3, 1, 2",
  },
  broca: {
    connections: ["Ventral premotor cortex", "Inferior parietal cortex", "Posterior temporal language network"],
    clinical: "Dominant-hemisphere injury can produce effortful, nonfluent speech with relatively preserved comprehension.",
    level: "Inferior frontal language hub",
  },
  wernicke: {
    connections: ["Auditory association cortex", "Inferior parietal lobule", "Frontal language network"],
    clinical: "Dominant posterior temporal injury can produce fluent but poorly meaningful language and impaired comprehension.",
    level: "Posterior temporal language network",
  },
  "corpus-callosum": {
    connections: ["Homotopic association cortices", "Motor and sensory cortices", "Prefrontal networks"],
    clinical: "Disconnection can separate information available to one hemisphere from systems in the other.",
    level: "Commissural white matter",
  },
  thalamus: {
    connections: ["Cerebral cortex", "Basal ganglia", "Cerebellum and ascending sensory systems"],
    clinical: "Small lesions can cause dense sensory loss, pain syndromes, movement abnormalities, altered attention, or impaired arousal.",
    level: "Diencephalic relay nuclei",
  },
  hypothalamus: {
    connections: ["Pituitary gland", "Autonomic brainstem nuclei", "Limbic system"],
    clinical: "Dysfunction may disrupt temperature, appetite, fluid balance, circadian rhythms, stress responses, and endocrine axes.",
    level: "Homeostatic control center",
  },
  pituitary: {
    connections: ["Hypothalamic releasing systems", "Peripheral endocrine glands", "Posterior hypothalamic axons"],
    clinical: "Masses can disturb hormone secretion and compress the optic chiasm, classically affecting temporal visual fields.",
    level: "Neuroendocrine interface",
  },
  pineal: {
    connections: ["Suprachiasmatic circadian pathway", "Sympathetic input", "Melatonin targets"],
    clinical: "Pineal-region masses may obstruct the cerebral aqueduct or affect vertical gaze circuits.",
    level: "Circadian endocrine organ",
  },
  hippocampus: {
    connections: ["Entorhinal cortex", "Fornix and mammillary bodies", "Association neocortex"],
    clinical: "Bilateral injury causes profound difficulty forming new declarative memories; this structure is also seizure-prone.",
    level: "Medial temporal allocortex",
  },
  amygdala: {
    connections: ["Hippocampus", "Prefrontal cortex", "Hypothalamus and sensory association areas"],
    clinical: "Damage can alter threat learning, salience assignment, social cue processing, and autonomic emotional responses.",
    level: "Limbic nuclear complex",
  },
  "basal-ganglia": {
    connections: ["Cerebral cortex", "Thalamus", "Substantia nigra"],
    clinical: "Circuit imbalance underlies hypokinetic and hyperkinetic disorders, including Parkinson and Huntington disease.",
    level: "Subcortical action-selection loops",
  },
  cerebellum: {
    connections: ["Vestibular system", "Brainstem and spinal inputs", "Motor and association cortex via thalamus"],
    clinical: "Lesions commonly cause ipsilateral ataxia, dysmetria, intention tremor, nystagmus, or impaired motor learning.",
    level: "Coordination and prediction system",
  },
  midbrain: {
    connections: ["Superior and inferior colliculi", "Substantia nigra", "Ascending arousal pathways"],
    clinical: "Lesions may combine eye-movement deficits with contralateral motor signs and altered alertness.",
    level: "Rostral brainstem",
  },
  pons: {
    connections: ["Cerebellar peduncles", "Cranial nerve nuclei V–VIII", "Corticospinal and sensory tracts"],
    clinical: "Injury can affect facial sensation or movement, horizontal gaze, hearing, balance, breathing, and long motor tracts.",
    level: "Middle brainstem",
  },
  medulla: {
    connections: ["Spinal cord", "Vagus and lower cranial nerve nuclei", "Respiratory and cardiovascular centers"],
    clinical: "Damage can threaten breathing and circulation and may impair swallowing, phonation, or crossed sensory-motor pathways.",
    level: "Caudal brainstem",
  },
  ventricles: {
    connections: ["Choroid plexus", "Cerebral aqueduct", "Subarachnoid space"],
    clinical: "Obstructed flow or impaired reabsorption can enlarge the ventricles and raise intracranial pressure.",
    level: "Cerebrospinal fluid system",
  },
};

export const CAMERA_PRESETS: Record<CameraPreset, {
  label: string;
  position: [number, number, number];
  up: [number, number, number];
}> = {
  lateral: {
    label: "Lateral",
    position: [2.7, 0.05, 0.18] as [number, number, number],
    up: [0, 0, 1] as [number, number, number],
  },
  medial: {
    label: "Medial",
    position: [-2.7, 0.05, 0.18] as [number, number, number],
    up: [0, 0, 1] as [number, number, number],
  },
  anterior: {
    label: "Anterior",
    position: [0, 2.8, 0.12] as [number, number, number],
    up: [0, 0, 1] as [number, number, number],
  },
  posterior: {
    label: "Posterior",
    position: [0, -2.8, 0.12] as [number, number, number],
    up: [0, 0, 1] as [number, number, number],
  },
  superior: {
    label: "Superior",
    position: [0.01, 0, 2.8] as [number, number, number],
    up: [0, 1, 0] as [number, number, number],
  },
  inferior: {
    label: "Inferior",
    position: [0.01, 0, -2.8] as [number, number, number],
    up: [0, -1, 0] as [number, number, number],
  },
};
