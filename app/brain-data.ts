export type ViewMode = "surface" | "deep" | "systems";
export type SystemKey =
  | "executive"
  | "sensory"
  | "memory"
  | "movement"
  | "regulation"
  | "communication";

export type Region = {
  id: string;
  name: string;
  shortName: string;
  view: ViewMode[];
  system: SystemKey;
  color: string;
  role: string;
  detail: string;
  memory: string;
  location: string;
  caution?: string;
};

export const SYSTEMS: Record<SystemKey, { label: string; color: string }> = {
  executive: { label: "Thinking & planning", color: "#ff7a6e" },
  sensory: { label: "Sensation & perception", color: "#47c9ff" },
  memory: { label: "Memory & emotion", color: "#c896ff" },
  movement: { label: "Movement", color: "#ffd166" },
  regulation: { label: "Body regulation", color: "#52e0a4" },
  communication: { label: "Communication", color: "#ff9fd5" },
};

export const REGIONS: Region[] = [
  {
    id: "frontal", name: "Frontal lobe", shortName: "Frontal",
    view: ["surface", "systems"], system: "executive", color: "#ff756a",
    role: "Planning, decision-making, working memory, personality, and voluntary movement.",
    detail: "The frontal lobe includes prefrontal and primary motor cortex. It organizes goal-directed behavior and helps suppress impulses while coordinating actions.",
    memory: "The brain’s project manager—making a plan while the rest of the office opens unrelated browser tabs.",
    location: "At the front of each cerebral hemisphere, behind the forehead.",
  },
  {
    id: "parietal", name: "Parietal lobe", shortName: "Parietal",
    view: ["surface", "systems"], system: "sensory", color: "#53c8ff",
    role: "Integrates touch, body position, attention, and spatial information.",
    detail: "It combines signals from the skin, muscles, joints, and visual system to build a useful map of the body in space.",
    memory: "Your internal GPS and body map: it helps you reach for a mug without launching a kitchen search party.",
    location: "Upper rear cerebrum, behind the frontal lobe.",
  },
  {
    id: "temporal", name: "Temporal lobe", shortName: "Temporal",
    view: ["surface", "systems"], system: "communication", color: "#d08cff",
    role: "Processes sound and supports language, object recognition, and memory.",
    detail: "Auditory cortex sits here. Medial temporal structures, including the hippocampus, are central to forming many kinds of memory.",
    memory: "Part sound studio, part archive—music enters and somehow wakes a memory from 20 years ago.",
    location: "On each side of the brain, roughly behind the temples.",
  },
  {
    id: "occipital", name: "Occipital lobe", shortName: "Occipital",
    view: ["surface", "systems"], system: "sensory", color: "#4de0a2",
    role: "Receives and interprets visual information.",
    detail: "Visual cortex begins processing edges, orientation, location, color, and motion before wider networks assemble a visual scene.",
    memory: "The visual editing suite sits at the back, because anatomy occasionally rearranges the office furniture.",
    location: "At the rear of the cerebral hemispheres.",
  },
  {
    id: "motor-cortex", name: "Primary motor cortex", shortName: "Motor cortex",
    view: ["surface", "systems"], system: "movement", color: "#ffd166",
    role: "Initiates voluntary skeletal-muscle movement.",
    detail: "This strip contains an ordered body map. Many motor pathways cross, so each hemisphere mainly controls the opposite side.",
    memory: "The departure gate: movement commands leave the cortex from this strip.",
    location: "Precentral gyrus at the rear edge of the frontal lobe.",
  },
  {
    id: "somatosensory", name: "Primary somatosensory cortex", shortName: "Sensory cortex",
    view: ["surface", "systems"], system: "sensory", color: "#72e5ff",
    role: "Processes touch, pressure, pain, temperature, and body-position signals.",
    detail: "Its body map gives especially sensitive areas disproportionate cortical territory.",
    memory: "The arrivals desk for body sensation—every toe complaint eventually files paperwork here.",
    location: "Postcentral gyrus at the front edge of the parietal lobe.",
  },
  {
    id: "broca", name: "Broca’s area", shortName: "Broca",
    view: ["surface", "systems"], system: "communication", color: "#ff9fd5",
    role: "Supports speech production and language planning.",
    detail: "Usually emphasized in the left frontal lobe, it works with a broad language network rather than acting as a solitary speech button.",
    memory: "Broca helps turn an idea into an ordered sequence your mouth can actually say.",
    location: "Usually in the lower left frontal lobe.",
    caution: "Language is distributed; this area is a hub, not the whole system.",
  },
  {
    id: "wernicke", name: "Wernicke’s area", shortName: "Wernicke",
    view: ["surface", "systems"], system: "communication", color: "#ffb4de",
    role: "Supports understanding meaningful spoken and written language.",
    detail: "Classically linked to posterior left temporal cortex, it joins a wider network that maps sounds and symbols to meaning.",
    memory: "The meaning desk: words arrive, and ideally someone there knows what they mean.",
    location: "Usually near the rear of the left temporal lobe.",
    caution: "Modern neuroscience treats language as a network extending beyond two named areas.",
  },
  {
    id: "corpus-callosum", name: "Corpus callosum", shortName: "Corpus callosum",
    view: ["deep", "systems"], system: "communication", color: "#f1f5ff",
    role: "Transfers information between the left and right cerebral hemispheres.",
    detail: "This enormous white-matter tract contains hundreds of millions of axons coordinating information across hemispheres.",
    memory: "A thick data cable connecting the brain’s two major offices.",
    location: "Deep in the midline, arching above the thalamus.",
  },
  {
    id: "thalamus", name: "Thalamus", shortName: "Thalamus",
    view: ["deep", "systems"], system: "sensory", color: "#59d2ff",
    role: "Routes and transforms most sensory and motor signals headed to cortex.",
    detail: "Nearly every sensory system except olfaction relays through thalamic nuclei. It also joins attention, arousal, and movement circuits.",
    memory: "The brain’s switchboard: most incoming calls route here before reaching cortex.",
    location: "Near the center of the brain, above the brainstem.",
  },
  {
    id: "hypothalamus", name: "Hypothalamus", shortName: "Hypothalamus",
    view: ["deep", "systems"], system: "regulation", color: "#53e3a6",
    role: "Regulates temperature, hunger, thirst, stress, sleep, and endocrine control.",
    detail: "It links the nervous and endocrine systems, partly by directing the pituitary gland. Small structure, unreasonable workload.",
    memory: "The thermostat, pantry monitor, alarm clock, and hormone supervisor in one tiny office.",
    location: "Below the thalamus and just above the pituitary.",
  },
  {
    id: "pituitary", name: "Pituitary gland", shortName: "Pituitary",
    view: ["deep", "systems"], system: "regulation", color: "#ff9dce",
    role: "Releases hormones influencing growth, reproduction, stress, and other glands.",
    detail: "It receives neural and hormonal instructions from the hypothalamus. Its anterior and posterior portions operate differently.",
    memory: "The endocrine mailroom: the hypothalamus writes orders and the pituitary sends hormonal envelopes.",
    location: "Hangs below the hypothalamus in a bony pocket.",
  },
  {
    id: "pineal", name: "Pineal gland", shortName: "Pineal",
    view: ["deep", "systems"], system: "regulation", color: "#f5a65b",
    role: "Secretes melatonin and helps coordinate circadian timing.",
    detail: "It responds indirectly to light information through the circadian system. Biological clock component, not a mystical Wi-Fi antenna.",
    memory: "A tiny dusk detector helping tell the body when night has arrived.",
    location: "Near the midline, behind the thalamus.",
  },
  {
    id: "hippocampus", name: "Hippocampus", shortName: "Hippocampus",
    view: ["deep", "systems"], system: "memory", color: "#bf91ff",
    role: "Forms and organizes new declarative memories and supports navigation.",
    detail: "It stabilizes new memories for longer-term storage. Memories are not permanently stored inside it like files on one hard drive.",
    memory: "The brain’s librarian: cataloging new experiences so the cortex can find them later.",
    location: "Curves through the medial temporal lobe in each hemisphere.",
  },
  {
    id: "amygdala", name: "Amygdala", shortName: "Amygdala",
    view: ["deep", "systems"], system: "memory", color: "#ff6f91",
    role: "Assigns emotional significance to threats, rewards, and social cues.",
    detail: "It supports emotional learning and strengthens memory for important events. It contributes to fear, but it is not merely a fear center.",
    memory: "An emotional highlighter marking certain experiences with ‘remember this one.’",
    location: "At the front end of the hippocampus, deep in the temporal lobe.",
    caution: "It processes positive and socially relevant information too—not only fear.",
  },
  {
    id: "basal-ganglia", name: "Basal ganglia", shortName: "Basal ganglia",
    view: ["deep", "systems"], system: "movement", color: "#ffd166",
    role: "Selects actions, smooths movement, and supports habits and reward learning.",
    detail: "Interconnected nuclei help start useful actions while suppressing competing ones. Dopamine strongly modulates these circuits.",
    memory: "The movement bouncer: one action gets through while five awkward alternatives stay outside.",
    location: "A group of deep nuclei lateral to the thalamus.",
  },
  {
    id: "cerebellum", name: "Cerebellum", shortName: "Cerebellum",
    view: ["surface", "deep", "systems"], system: "movement", color: "#ffb95e",
    role: "Fine-tunes movement, balance, timing, posture, and motor learning.",
    detail: "It compares intended movement with sensory feedback and continually corrects errors. It also contributes to some cognitive functions.",
    memory: "The movement proofreader: catching wobbles before the final draft reaches your muscles.",
    location: "At the lower rear of the brain, behind the brainstem.",
  },
  {
    id: "midbrain", name: "Midbrain", shortName: "Midbrain",
    view: ["deep", "systems"], system: "movement", color: "#f8d05f",
    role: "Supports movement, dopamine signaling, and visual and auditory reflexes.",
    detail: "The upper brainstem includes the colliculi, substantia nigra, and portions of arousal networks.",
    memory: "The orienting operator: something flashes or bangs, and your head turns toward it.",
    location: "Top portion of the brainstem, below the thalamus.",
  },
  {
    id: "pons", name: "Pons", shortName: "Pons",
    view: ["deep", "systems"], system: "regulation", color: "#59d9c2",
    role: "Relays information and contributes to sleep, breathing, facial movement, and coordination.",
    detail: "It forms a prominent bridge among higher brain regions, the medulla, and cerebellum. Several cranial nerves emerge here.",
    memory: "Pons means bridge—a rounded relay station on the brainstem highway.",
    location: "Middle brainstem, in front of the cerebellum.",
  },
  {
    id: "medulla", name: "Medulla oblongata", shortName: "Medulla",
    view: ["surface", "deep", "systems"], system: "regulation", color: "#4ecb9a",
    role: "Regulates vital automatic functions including breathing, heart rate, and blood pressure.",
    detail: "It contains essential autonomic centers and pathways traveling between the brain and spinal cord.",
    memory: "The life-support technician you absolutely do not want taking a lunch break.",
    location: "Lowest brainstem, continuous with the spinal cord.",
  },
  {
    id: "ventricles", name: "Ventricular system", shortName: "Ventricles",
    view: ["deep", "systems"], system: "regulation", color: "#75e8ff",
    role: "Contains and circulates cerebrospinal fluid through connected cavities.",
    detail: "The lateral, third, and fourth ventricles help circulate fluid that cushions the brain and supports chemical stability and waste transport.",
    memory: "A connected indoor canal system carrying protective fluid through the brain.",
    location: "Connected cavities inside the hemispheres and brainstem.",
  },
];

export const REGION_MAP: Record<string, Region> = Object.fromEntries(
  REGIONS.map((region) => [region.id, region]),
);

export const VIEW_INFO: Record<ViewMode, { label: string; eyebrow: string; description: string }> = {
  surface: { label: "Surface", eyebrow: "Layer 01 · Lateral view", description: "Lobes and specialized cortical regions" },
  deep: { label: "Deep structures", eyebrow: "Layer 02 · Medial cutaway", description: "Limbic, endocrine, relay, and brainstem anatomy" },
  systems: { label: "Living systems", eyebrow: "Layer 03 · Functional pathways", description: "Animated routes showing how structures cooperate" },
};

export const VIEW_DEFAULTS: Record<ViewMode, string> = {
  surface: "frontal",
  deep: "thalamus",
  systems: "hippocampus",
};
