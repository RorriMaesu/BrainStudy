import type { ViewMode } from "./brain-data";

export type SceneRegion = {
  id: string;
  position: [number, number, number];
  labelPosition?: [number, number, number];
  layers: ViewMode[];
};

export const SCENE_REGIONS: SceneRegion[] = [
  { id: "frontal", position: [0.70, 0.43, 0.12], layers: ["surface", "systems"] },
  { id: "parietal", position: [0.67, -0.18, 0.34], layers: ["surface", "systems"] },
  { id: "temporal", position: [0.70, 0.12, -0.25], layers: ["surface", "systems"] },
  { id: "occipital", position: [0.55, -0.69, 0.04], layers: ["surface", "systems"] },
  { id: "motor-cortex", position: [0.72, 0.08, 0.31], layers: ["surface", "systems"] },
  { id: "somatosensory", position: [0.72, -0.05, 0.33], layers: ["surface", "systems"] },
  { id: "broca", position: [0.69, 0.42, -0.08], layers: ["surface", "systems"] },
  { id: "wernicke", position: [0.68, -0.34, -0.08], layers: ["surface", "systems"] },
  { id: "corpus-callosum", position: [0, -0.03, 0.18], layers: ["deep", "systems"] },
  { id: "thalamus", position: [0.12, -0.03, 0.01], layers: ["deep", "systems"] },
  { id: "hypothalamus", position: [0, 0.08, -0.15], layers: ["deep", "systems"] },
  { id: "pituitary", position: [0, 0.14, -0.34], layers: ["deep", "systems"] },
  { id: "pineal", position: [0, -0.23, 0.06], layers: ["deep", "systems"] },
  { id: "hippocampus", position: [0.22, -0.05, -0.23], layers: ["deep", "systems"] },
  { id: "amygdala", position: [0.25, 0.30, -0.23], layers: ["deep", "systems"] },
  { id: "basal-ganglia", position: [0.22, 0.11, 0.05], layers: ["deep", "systems"] },
  { id: "cerebellum", position: [0.25, -0.58, -0.38], layers: ["surface", "deep", "systems"] },
  { id: "midbrain", position: [0, -0.08, -0.25], layers: ["deep", "systems"] },
  { id: "pons", position: [0, -0.10, -0.39], layers: ["deep", "systems"] },
  { id: "medulla", position: [0, -0.10, -0.55], layers: ["surface", "deep", "systems"] },
  { id: "ventricles", position: [0.11, -0.02, 0.15], layers: ["deep", "systems"] },
];

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

export const CAMERA_PRESETS = {
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

export type CameraPreset = keyof typeof CAMERA_PRESETS;
