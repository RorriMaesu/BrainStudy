"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BrainViewer, {
  type CameraView,
  type HemisphereMode,
  type LabelDensity,
  type SectionPlane,
} from "./brain-viewer";
import {
  REGIONS,
  REGION_MAP,
  SYSTEMS,
  VIEW_DEFAULTS,
  VIEW_INFO,
  type ViewMode,
} from "./brain-data";
import {
  ACADEMIC_DETAILS,
  CAMERA_PRESETS,
  SCENE_REGION_MAP,
  type CameraPreset,
} from "./scene-data";
import {
  SCIENCE_SOURCES,
  VIEW_AUTHORITY,
  authorityForRegion,
  sourcesFor,
} from "./science-authority";

type DetailTab = "overview" | "connections" | "clinical" | "evidence";
const LABEL_DENSITIES: LabelDensity[] = ["off", "focus", "key", "all"];

const LAYER_COPY: Record<ViewMode, { index: string; title: string; subtitle: string }> = {
  surface: { index: "01", title: "Cortical surface", subtitle: "Gyri, sulci & lobes" },
  deep: { index: "02", title: "Deep anatomy", subtitle: "Nuclei, limbic & brainstem" },
  systems: { index: "03", title: "Functional circuits", subtitle: "Animated information flow" },
};

function Icon({
  name,
}: {
  name: "brain" | "search" | "layers" | "label" | "palette" | "quiz" | "reset" | "book" | "target";
}) {
  const paths = {
    brain: <><path d="M9.5 5.2A3.3 3.3 0 0 0 4 7.7a3.2 3.2 0 0 0 .3 4.5A3.6 3.6 0 0 0 8 17.8c.5 1.7 2 2.7 4 2.7V4.1c-1.1-1.6-4.3-1.1-4.2 1.3" /><path d="M14.5 5.2A3.3 3.3 0 0 1 20 7.7a3.2 3.2 0 0 1-.3 4.5 3.6 3.6 0 0 1-3.7 5.6c-.5 1.7-2 2.7-4 2.7V4.1c1.1-1.6 4.3-1.1 4.2 1.3M8.2 9.2c1.5.1 2.4.8 2.5 2.1M15.8 9.2c-1.5.1-2.4.8-2.5 2.1M8.3 14c1.2-.1 2.1.5 2.4 1.6M15.7 14c-1.2-.1-2.1.5-2.4 1.6" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.2" /><path d="m15.5 15.5 4.3 4.3" /></>,
    layers: <><path d="m12 3 8.5 4.5L12 12 3.5 7.5 12 3Z" /><path d="m5 11.2-1.5.8 8.5 4.5 8.5-4.5-1.5-.8M5 15.7l-1.5.8L12 21l8.5-4.5-1.5-.8" /></>,
    label: <><path d="M4 5h10l6 7-6 7H4V5Z" /><circle cx="8" cy="9" r="1" /></>,
    palette: <><path d="M12 3a9 9 0 1 0 0 18h1.5a1.7 1.7 0 0 0 .3-3.4c-.8-.1-1.2-1-.8-1.7.4-.7 1.1-1 2-1h2a4 4 0 0 0 4-4C21 6.4 17 3 12 3Z" /><circle cx="7.5" cy="10" r="1" /><circle cx="10" cy="6.8" r="1" /><circle cx="15" cy="7.5" r="1" /></>,
    quiz: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.6 2.6 0 1 1 3.3 2.5c-.8.3-1.1.8-1.1 1.7M12 16.8h.01" /></>,
    reset: <><path d="M4 5v5h5M4.5 10A8 8 0 1 1 6 17" /></>,
    book: <><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v18H7.5A3.5 3.5 0 0 0 4 23V5.5ZM20 5.5A3.5 3.5 0 0 0 16.5 2H12v18h4.5a3.5 3.5 0 0 1 3.5 3V5.5Z" /></>,
    target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3M22 12h-3M12 22v-3M2 12h3" /></>,
  };
  return (
    <svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export default function Home() {
  const [mode, setMode] = useState<ViewMode>("surface");
  const [selectedId, setSelectedId] = useState("frontal");
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [search, setSearch] = useState("");
  const [labelDensity, setLabelDensity] = useState<LabelDensity>("key");
  const [colorized, setColorized] = useState(true);
  const [separation, setSeparation] = useState(0);
  const [section, setSection] = useState(0);
  const [sectionPlane, setSectionPlane] = useState<SectionPlane>("sagittal");
  const [hemisphere, setHemisphere] = useState<HemisphereMode>("both");
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("lateral");
  const [cameraCommandId, setCameraCommandId] = useState(0);
  const [cameraView, setCameraView] = useState<CameraView>("lateral");
  const [quizMode, setQuizMode] = useState(false);
  const [quizTarget, setQuizTarget] = useState("frontal");
  const [quizMessage, setQuizMessage] = useState("");
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showSources, setShowSources] = useState(false);
  const recentQuizTargets = useRef<string[]>([]);
  const quizSeed = useRef(0x9e3779b9);
  const methodsDialog = useRef<HTMLElement | null>(null);

  const requestCameraView = useCallback((preset: CameraPreset) => {
    setCameraPreset(preset);
    setCameraCommandId((current) => current + 1);
    if (preset === "medial") {
      setHemisphere("left");
      setSeparation((current) => Math.max(current, 0.22));
    }
  }, []);

  const visibleRegions = useMemo(
    () => REGIONS.filter((region) => region.view.includes(mode)),
    [mode],
  );
  const filteredRegions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return visibleRegions;
    return visibleRegions.filter((region) =>
      `${region.name} ${region.role} ${region.location}`.toLowerCase().includes(query),
    );
  }, [search, visibleRegions]);

  const selected = REGION_MAP[selectedId] ?? visibleRegions[0] ?? REGIONS[0];
  const academic = ACADEMIC_DETAILS[selected.id];
  const authority = authorityForRegion(selected.id, mode);
  const evidenceSources = sourcesFor(authority);

  const chooseQuizTarget = (pool = visibleRegions, exclude?: string) => {
    const recent = new Set([...recentQuizTargets.current, exclude].filter(Boolean));
    const fresh = pool.filter((region) => !recent.has(region.id));
    const options = fresh.length ? fresh : pool.filter((region) => region.id !== exclude);
    quizSeed.current = (Math.imul(quizSeed.current, 1664525) + 1013904223) >>> 0;
    const target = options[quizSeed.current % Math.max(options.length, 1)] ?? pool[0] ?? REGIONS[0];
    recentQuizTargets.current = [...recentQuizTargets.current, target.id].slice(-4);
    setQuizTarget(target.id);
    setQuizMessage("");
  };

  const changeMode = (next: ViewMode) => {
    setMode(next);
    setSelectedId(VIEW_DEFAULTS[next]);
    setDetailTab("overview");
    setQuizMode(false);
    setQuizMessage("");
    setSection(next === "deep" ? 0.49 : next === "systems" ? 0.28 : 0);
    setSectionPlane("sagittal");
    setHemisphere(next === "surface" ? "both" : "left");
    setSeparation(next === "deep" ? 0.18 : 0);
    setColorized(next !== "deep");
    requestCameraView(next === "surface" ? "lateral" : "medial");
  };

  const handleSelect = (id: string) => {
    if (quizMode) {
      const correct = id === quizTarget;
      setScore((current) => ({
        correct: current.correct + (correct ? 1 : 0),
        total: current.total + 1,
      }));
      setQuizMessage(correct ? `Correct — ${REGION_MAP[id].name}` : `That is ${REGION_MAP[id]?.name}. Try the highlighted layer again.`);
      if (correct) window.setTimeout(() => chooseQuizTarget(visibleRegions, id), 900);
      return;
    }
    setSelectedId(id);
    setDetailTab("overview");
    const sceneRegion = SCENE_REGION_MAP[id];
    if (sceneRegion) {
      if (cameraView !== "free" && !sceneRegion.labelViews.includes(cameraView)) {
        requestCameraView(sceneRegion.bestView);
      }
      if (sceneRegion.laterality === "left" && hemisphere === "right") {
        setHemisphere("left");
      }
    }
  };

  const toggleQuiz = () => {
    const next = !quizMode;
    setQuizMode(next);
    setQuizMessage("");
    if (next) {
      chooseQuizTarget();
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.matches("input, textarea, [contenteditable='true']");
      if (event.key.toLowerCase() === "l" && !isTyping) {
        setLabelDensity((current) => {
          const currentIndex = LABEL_DENSITIES.indexOf(current);
          return LABEL_DENSITIES[(currentIndex + 1) % LABEL_DENSITIES.length];
        });
      }
      if (event.key.toLowerCase() === "r") {
        setSection(0);
        setSeparation(0);
        setSectionPlane("sagittal");
        setHemisphere("both");
        requestCameraView("lateral");
      }
      if (event.key === "Escape") {
        if (showSources) setShowSources(false);
        else if (quizMode) setQuizMode(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [quizMode, requestCameraView, showSources]);

  useEffect(() => {
    if (!showSources) return;
    methodsDialog.current?.focus();
  }, [showSources]);

  return (
    <main className="app">
      <header className="app-header">
        <a className="brand" href="#top" aria-label="BrainStudy home">
          <span className="brand-icon"><Icon name="brain" /></span>
          <span>
            <strong>BrainStudy</strong>
            <small>Advanced neuroanatomy laboratory</small>
          </span>
        </a>
        <nav className="primary-nav" aria-label="Anatomy layers">
          {(Object.keys(LAYER_COPY) as ViewMode[]).map((layer) => (
            <button
              key={layer}
              className={mode === layer ? "active" : ""}
              onClick={() => changeMode(layer)}
            >
              <span>{LAYER_COPY[layer].index}</span>
              {LAYER_COPY[layer].title}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button className={`quiz-button ${quizMode ? "active" : ""}`} onClick={toggleQuiz}>
            <Icon name="quiz" />
            {quizMode ? "Exit assessment" : "Test yourself"}
          </button>
        </div>
      </header>

      <section className="lab" id="top">
        <aside className="explorer-panel">
          <div className="panel-title">
            <div>
              <span>Structure index</span>
              <strong>{visibleRegions.length} structures in this layer</strong>
            </div>
            <Icon name="layers" />
          </div>

          <label className="search-field">
            <Icon name="search" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search structures or functions"
              aria-label="Search structures"
            />
            {search && <button onClick={() => setSearch("")} aria-label="Clear search">×</button>}
          </label>

          <div className="region-list" role="list">
            {filteredRegions.map((region, index) => (
              <button
                key={region.id}
                role="listitem"
                className={selectedId === region.id && !quizMode ? "active" : ""}
                onClick={() => handleSelect(region.id)}
                style={{ "--region-color": region.color } as React.CSSProperties}
              >
                <span className="region-index">{String(index + 1).padStart(2, "0")}</span>
                <i />
                <span>
                  <strong>{region.name}</strong>
                  <small>{SYSTEMS[region.system].label}</small>
                </span>
              </button>
            ))}
            {!filteredRegions.length && (
              <div className="empty-state">No structures match “{search}”.</div>
            )}
          </div>

          <div className="model-integrity">
            <span className={`integrity-mark grade-${authority.grade.toLowerCase().replaceAll(" ", "-")}`}>
              {authority.grade === "Atlas-derived" ? "A" : authority.grade === "Conceptual network" ? "C" : "T"}
            </span>
            <p>
              <strong>{authority.grade}</strong>
              {authority.badge} · limits disclosed
            </p>
            <button onClick={() => setShowSources(true)}>Methods</button>
          </div>
        </aside>

        <section className="anatomy-stage">
          <div className="stage-head">
            <div className="stage-context">
              <span>
                Layer {LAYER_COPY[mode].index} · {cameraView === "free"
                  ? "Free orbit"
                  : `${CAMERA_PRESETS[cameraView].label} view`}
              </span>
              <strong>{VIEW_INFO[mode].description}</strong>
            </div>
            <div className="stage-badges">
              <span className={`authority-chip grade-${authority.grade.toLowerCase().replaceAll(" ", "-")}`}>
                <i /> {authority.grade}
              </span>
              <span>{authority.badge}</span>
              <button onClick={() => setShowSources(true)}>Methods</button>
            </div>
          </div>

          <BrainViewer
            mode={mode}
            selectedId={selectedId}
            labelDensity={quizMode ? "off" : labelDensity}
            colorized={colorized}
            separation={separation}
            section={section}
            sectionPlane={sectionPlane}
            hemisphere={hemisphere}
            cameraPreset={cameraPreset}
            cameraCommandId={cameraCommandId}
            onSelect={handleSelect}
            onCameraViewChange={setCameraView}
            onRequestView={requestCameraView}
          />

          {mode === "systems" && (
            <div className="pathway-legend">
              <span><i style={{ background: "#61d9ff" }} /> Sensory relay</span>
              <span><i style={{ background: "#ffd166" }} /> Motor output</span>
              <span><i style={{ background: "#c799ff" }} /> Limbic loop</span>
              <span><i style={{ background: "#ff9fd5" }} /> Language network</span>
            </div>
          )}

          {quizMode && (
            <div className="quiz-hud" aria-live="polite">
              <span>Identification drill</span>
              <strong>Select the {REGION_MAP[quizTarget]?.name}</strong>
              <p>{quizMessage || REGION_MAP[quizTarget]?.role}</p>
              <div>
                Score <b>{score.correct}/{score.total}</b>
                <button onClick={() => chooseQuizTarget()}>Skip</button>
              </div>
            </div>
          )}

          <div className="camera-dock">
            <span className={cameraView === "free" ? "is-free" : ""}>
              {cameraView === "free" ? "Free orbit" : "Camera"}
            </span>
            {(Object.keys(CAMERA_PRESETS) as CameraPreset[]).map((preset) => (
              <button
                key={preset}
                className={cameraView === preset ? "active" : ""}
                onClick={() => requestCameraView(preset)}
                title={`${CAMERA_PRESETS[preset].label} view`}
              >
                {CAMERA_PRESETS[preset].label}
              </button>
            ))}
          </div>
        </section>

        <aside className="detail-panel">
          <div className="detail-scroll">
            <div className="detail-kicker">
              <span style={{ "--detail-color": selected.color } as React.CSSProperties} />
              {academic?.level ?? "Neuroanatomical structure"}
            </div>
            <h1>{selected.name}</h1>
            <p className="detail-role">{selected.role}</p>
            <button className="fidelity-banner" onClick={() => setDetailTab("evidence")}>
              <span className={`fidelity-dot grade-${authority.grade.toLowerCase().replaceAll(" ", "-")}`} />
              <span>
                <strong>{authority.grade}</strong>
                <small>{authority.badge}</small>
              </span>
              <b>View evidence</b>
            </button>

            <div className="detail-tabs" role="tablist">
              {(["overview", "connections", "clinical", "evidence"] as DetailTab[]).map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={detailTab === tab}
                  className={detailTab === tab ? "active" : ""}
                  onClick={() => setDetailTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {detailTab === "overview" && (
              <div className="detail-content">
                <section>
                  <span>Location</span>
                  <p>{selected.location}</p>
                </section>
                <section>
                  <span>Functional anatomy</span>
                  <p>{selected.detail}</p>
                </section>
                <blockquote>
                  <Icon name="book" />
                  <div>
                    <span>Learning anchor</span>
                    <p>{selected.memory}</p>
                  </div>
                </blockquote>
                {selected.caution && (
                  <div className="precision-note">
                    <strong>Precision note</strong>
                    {selected.caution}
                  </div>
                )}
              </div>
            )}

            {detailTab === "connections" && (
              <div className="detail-content">
                <section>
                  <span>Principal connections</span>
                  <ul className="connection-list">
                    {(academic?.connections ?? []).map((connection, index) => (
                      <li key={connection}>
                        <b>{String(index + 1).padStart(2, "0")}</b>
                        {connection}
                      </li>
                    ))}
                  </ul>
                </section>
                <p className="network-note">
                  Neural function emerges from distributed circuits. Named regions are useful landmarks, not isolated modules.
                </p>
              </div>
            )}

            {detailTab === "clinical" && (
              <div className="detail-content">
                <section>
                  <span>Clinical correlation</span>
                  <p>{academic?.clinical}</p>
                </section>
                <div className="clinical-card">
                  <Icon name="target" />
                  <div>
                    <strong>Localization principle</strong>
                    <p>Interpret deficits using laterality, neighboring structures, vascular territory, and network effects—not a single symptom alone.</p>
                  </div>
                </div>
              </div>
            )}

            {detailTab === "evidence" && (
              <div className="detail-content evidence-content">
                <section>
                  <span>Geometry status</span>
                  <p>{authority.summary}</p>
                </section>
                <div className="precision-note evidence-warning">
                  <strong>Interpretation limit</strong>
                  {authority.limitation}
                </div>
                <section>
                  <span>Supporting sources</span>
                  <ol className="source-list">
                    {evidenceSources.map((source) => (
                      <li key={source.id}>
                        <a href={source.url} target="_blank" rel="noreferrer">
                          <strong>{source.shortLabel}</strong>
                          <small>{source.title}</small>
                        </a>
                      </li>
                    ))}
                  </ol>
                </section>
                <button className="all-methods-button" onClick={() => setShowSources(true)}>
                  Open full methods and license record
                </button>
              </div>
            )}
          </div>

          <div className="dissection-controls">
            <div className="control-heading">
              <span>Virtual dissection</span>
              <button
                onClick={() => {
                  setSeparation(0);
                  setSection(0);
                  setSectionPlane("sagittal");
                  setHemisphere("both");
                  requestCameraView("lateral");
                  setLabelDensity("key");
                }}
              >
                <Icon name="reset" /> Reset
              </button>
            </div>
            <div className="segmented-control">
              <span>Hemisphere visibility</span>
              <div role="group" aria-label="Hemisphere visibility">
                {(["both", "left", "right"] as HemisphereMode[]).map((value) => (
                  <button
                    key={value}
                    className={hemisphere === value ? "active" : ""}
                    aria-pressed={hemisphere === value}
                    onClick={() => setHemisphere(value)}
                  >
                    {value === "both" ? "Both" : value === "left" ? "Left" : "Right"}
                  </button>
                ))}
              </div>
            </div>
            <label>
              <span>Hemisphere separation <b>{Math.round(separation * 100)}%</b></span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={separation}
                onChange={(event) => setSeparation(Number(event.target.value))}
              />
            </label>
            <div className="segmented-control">
              <span>Section plane</span>
              <div role="group" aria-label="Section plane">
                {(["sagittal", "coronal", "axial"] as SectionPlane[]).map((plane) => (
                  <button
                    key={plane}
                    className={sectionPlane === plane ? "active" : ""}
                    aria-pressed={sectionPlane === plane}
                    onClick={() => setSectionPlane(plane)}
                  >
                    {plane}
                  </button>
                ))}
              </div>
            </div>
            <label>
              <span>{sectionPlane} section depth <b>{Math.round(section * 100)}%</b></span>
              <input
                type="range"
                min="0"
                max="0.96"
                step="0.01"
                value={section}
                onChange={(event) => setSection(Number(event.target.value))}
              />
            </label>
            <div className="segmented-control label-density-control">
              <span>
                Annotation density
                <b>{labelDensity === "off" ? "Hidden" : labelDensity}</b>
              </span>
              <div role="group" aria-label="Annotation density">
                {LABEL_DENSITIES.map((density) => (
                  <button
                    key={density}
                    className={labelDensity === density ? "active" : ""}
                    aria-pressed={labelDensity === density}
                    onClick={() => setLabelDensity(density)}
                  >
                    {density}
                  </button>
                ))}
              </div>
            </div>
            <div className="toggle-row">
              <button className={colorized ? "active" : ""} onClick={() => setColorized((current) => !current)}>
                <Icon name="palette" /> Teaching colors
              </button>
              <span className="label-shortcut">
                <Icon name="label" /> Press <kbd>L</kbd> to cycle labels
              </span>
            </div>
          </div>
        </aside>
      </section>

      <footer className="app-footer">
        <p>
          <strong>BrainStudy 3D Neuroanatomy Lab</strong>
          Anatomical teaching aid · not for diagnosis or surgical planning
        </p>
        <div>
          <span>Atlas surface: BigBrain Project</span>
          <button onClick={() => setShowSources(true)}>Sources, methods & license</button>
        </div>
      </footer>

      {showSources && (
        <div className="modal-backdrop" onMouseDown={() => setShowSources(false)}>
          <section
            ref={methodsDialog}
            className="methods-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="methods-title"
            tabIndex={-1}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setShowSources(false)} aria-label="Close methods dialog">×</button>
            <span className="modal-eyebrow">Scientific authority record · version 1.1</span>
            <h2 id="methods-title">What is measured, modeled, and conceptual</h2>
            <p className="methods-intro">
              BrainStudy separates anatomical evidence from instructional reconstruction. Every layer states what its geometry can—and cannot—support.
            </p>
            <div className="methods-grid">
              {(Object.keys(VIEW_AUTHORITY) as ViewMode[]).map((view) => {
                const record = VIEW_AUTHORITY[view];
                return (
                  <article key={view}>
                    <span className={`method-grade grade-${record.grade.toLowerCase().replaceAll(" ", "-")}`}>
                      {record.grade}
                    </span>
                    <strong>{LAYER_COPY[view].title}</strong>
                    <p>{record.summary}</p>
                    <small>{record.limitation}</small>
                  </article>
                );
              })}
              <article>
                <span className="method-grade grade-license">License boundary</span>
                <strong>Noncommercial derivative</strong>
                <p>BigBrain-derived surface geometry is included under CC BY-NC-SA 4.0.</p>
                <small>The complete upstream license and third-party notices ship with the project.</small>
              </article>
            </div>
            <h3>Source registry</h3>
            <ol className="methods-sources">
              {SCIENCE_SOURCES.map((source) => (
                <li key={source.id}>
                  <span>{source.year}</span>
                  <div>
                    <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
                    <p>{source.authors} · {source.publication}</p>
                    <small>{source.use}</small>
                  </div>
                </li>
              ))}
            </ol>
            <div className="citation">
              <strong>Validation status</strong>
              The current build is suitable for orientation and concept learning. It is not yet appropriate for morphometry, stereotaxy, diagnostic interpretation, or surgical planning.
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
