import type { ViewMode } from "./brain-data";

export type EvidenceGrade = "Atlas-derived" | "Anatomical teaching model" | "Conceptual network";

export type SourceRecord = {
  id: string;
  shortLabel: string;
  title: string;
  authors: string;
  publication: string;
  year: number;
  url: string;
  use: string;
};

export type ModelAuthority = {
  grade: EvidenceGrade;
  badge: string;
  summary: string;
  limitation: string;
  sourceIds: string[];
};

export const SCIENCE_SOURCES: SourceRecord[] = [
  {
    id: "bigbrain-2013",
    shortLabel: "Amunts et al., 2013",
    title: "BigBrain: An ultrahigh-resolution 3D human brain model",
    authors: "Amunts K, Lepage C, Borgeat L, et al.",
    publication: "Science 340(6139):1472–1475 · DOI 10.1126/science.1235381",
    year: 2013,
    url: "https://doi.org/10.1126/science.1235381",
    use: "Primary provenance for the histology-derived cerebral surface.",
  },
  {
    id: "ebrains-human-atlas",
    shortLabel: "EBRAINS Human Brain Atlas",
    title: "Multilevel Human Brain Atlas",
    authors: "EBRAINS",
    publication: "Human atlas reference spaces, cytoarchitecture, connectivity, and BigBrain integration",
    year: 2026,
    url: "https://ebrains.eu/data-tools-services/brain-atlases/human-brain",
    use: "Reference framework for the next atlas-registration and parcellation phase.",
  },
  {
    id: "julich-2020",
    shortLabel: "Amunts et al., 2020",
    title: "Julich-Brain: A 3D probabilistic atlas of the human brain’s cytoarchitecture",
    authors: "Amunts K, Mohlberg H, Bludau S, Zilles K",
    publication: "Science 369(6506):988–992 · DOI 10.1126/science.abb4588",
    year: 2020,
    url: "https://doi.org/10.1126/science.abb4588",
    use: "Scientific target for replacing gross coordinate colors with probabilistic anatomical maps.",
  },
  {
    id: "tna-2017",
    shortLabel: "FIPAT, 2017",
    title: "Terminologia Neuroanatomica",
    authors: "Federative International Programme for Anatomical Terminology",
    publication: "International standard neuroanatomical terminology",
    year: 2017,
    url: "https://fipat.library.dal.ca/TerminologiaNeuroanatomica/",
    use: "Naming and directional terminology standard.",
  },
];

export const VIEW_AUTHORITY: Record<ViewMode, ModelAuthority> = {
  surface: {
    grade: "Atlas-derived",
    badge: "Reference surface",
    summary:
      "The cerebral surface preserves the folded geometry of a BigBrain histological reconstruction.",
    limitation:
      "The lobe colors and point labels are gross teaching overlays, not atlas parcellations or patient-specific boundaries.",
    sourceIds: ["bigbrain-2013", "ebrains-human-atlas"],
  },
  deep: {
    grade: "Anatomical teaching model",
    badge: "Instructional geometry",
    summary:
      "Deep structures are positioned to teach major spatial relationships inside the cerebrum.",
    limitation:
      "These volumes are procedural reconstructions. They are not segmented from MRI, histology, or a probabilistic atlas.",
    sourceIds: ["ebrains-human-atlas", "tna-2017"],
  },
  systems: {
    grade: "Conceptual network",
    badge: "Circuit schematic",
    summary:
      "Animated routes demonstrate the idea of distributed information flow among major regions.",
    limitation:
      "Path curves are conceptual and must not be interpreted as tractography, axon counts, conduction speed, or individual connectivity.",
    sourceIds: ["ebrains-human-atlas"],
  },
};

const SURFACE_REGIONS = new Set([
  "frontal",
  "parietal",
  "temporal",
  "occipital",
  "motor-cortex",
  "somatosensory",
  "broca",
  "wernicke",
]);

export function authorityForRegion(regionId: string, mode: ViewMode): ModelAuthority {
  if (mode === "surface" && SURFACE_REGIONS.has(regionId)) return VIEW_AUTHORITY.surface;
  if (mode === "systems") return VIEW_AUTHORITY.systems;
  return VIEW_AUTHORITY.deep;
}

export function sourcesFor(authority: ModelAuthority): SourceRecord[] {
  return authority.sourceIds
    .map((id) => SCIENCE_SOURCES.find((source) => source.id === id))
    .filter((source): source is SourceRecord => Boolean(source));
}
