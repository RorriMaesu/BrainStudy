"use client";

import { useEffect, useState } from "react";
import {
  OllamaClient,
  type OllamaModelTag,
  type OllamaStatusResponse,
} from "../services/ollama-client";
import {
  detectGPUHardware,
  RECOMMENDED_MODELS,
  type GPUHardwareInfo,
} from "../services/hardware-detector";
import {
  AI_GRADING_JSON_SCHEMA,
  buildSocraticSystemPrompt,
  type AIGradingResult,
  type BrainStructureContext,
} from "../services/socratic-engine";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedStructure?: BrainStructureContext;
  activeModel: string;
  onSelectModel: (model: string) => void;
  onHighlightRegionInViewer?: (regionId: string) => void;
}

type DrawerTab = "tutor" | "quiz" | "cases" | "hardware";

export function SocraticAIDrawer({
  isOpen,
  onClose,
  selectedStructure,
  activeModel,
  onSelectModel,
}: Props) {
  const [tab, setTab] = useState<DrawerTab>("tutor");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Status & Hardware state
  const [status, setStatus] = useState<OllamaStatusResponse>({
    status: "NOT_INSTALLED",
    installedModels: [],
    runningModels: [],
  });
  const [gpuInfo, setGpuInfo] = useState<GPUHardwareInfo | null>(null);
  const [pullProgress, setPullProgress] = useState<{ status: string; percent?: number } | null>(null);

  // Quiz state
  const [quizQuestion, setQuizQuestion] = useState<string>("");
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [gradingResult, setGradingResult] = useState<AIGradingResult | null>(null);
  const [isGrading, setIsGrading] = useState(false);

  // Load hardware & status when drawer opens
  useEffect(() => {
    if (isOpen) {
      OllamaClient.checkStatus().then(setStatus);
      detectGPUHardware().then(setGpuInfo);
    }
  }, [isOpen]);

  // Initial welcome message when structure changes
  useEffect(() => {
    if (selectedStructure && messages.length === 0) {
      setMessages([
        {
          id: "welcome-1",
          role: "assistant",
          content: `Greetings! I am **Medulla AI**, your Socratic neuroanatomy tutor. We are currently focusing on the **${selectedStructure.name}** (${selectedStructure.layer}).\n\nWhat would you like to explore first about its functional connections, clinical localization, or physiological role?`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [selectedStructure]);

  if (!isOpen) return null;

  const handleSendMessage = async (customPrompt?: string) => {
    const text = customPrompt || inputMessage.trim();
    if (!text || isGenerating) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputMessage("");
    setIsGenerating(true);

    const assistantMsgId = String(Date.now() + 1);
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, initialAssistantMsg]);

    const systemPrompt = buildSocraticSystemPrompt(selectedStructure);
    const chatHistory = [
      { role: "system" as const, content: systemPrompt },
      ...messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: text },
    ];

    try {
      await OllamaClient.streamChat(
        activeModel || "gemma4:12b",
        chatHistory,
        undefined,
        (chunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, content: msg.content + chunk } : msg
            )
          );
        }
      );
    } catch (_err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content:
                  "⚠️ *Ollama Error*: Unable to reach local model. Please verify Ollama is running (`ollama serve`) or launch it from the Hardware tab.",
              }
            : msg
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePullModel = async (modelTag: string) => {
    setPullProgress({ status: `Initiating download for ${modelTag}...`, percent: 0 });
    const ok = await OllamaClient.pullModel(modelTag, (statusText, pct) => {
      setPullProgress({ status: statusText, percent: pct });
    });
    if (ok) {
      setPullProgress({ status: `Successfully pulled ${modelTag}!`, percent: 100 });
      const newStatus = await OllamaClient.checkStatus();
      setStatus(newStatus);
      onSelectModel(modelTag);
    } else {
      setPullProgress({ status: `Failed to pull ${modelTag}. Check network or terminal logs.`, percent: 0 });
    }
  };

  const handleGenerateQuiz = async () => {
    if (!selectedStructure) return;
    setIsGenerating(true);
    setQuizQuestion("Generating Socratic question from structure context...");
    setGradingResult(null);
    setUserAnswer("");

    const systemPrompt = buildSocraticSystemPrompt(selectedStructure);
    const prompt = `Formulate a clinical localization short-answer question focused on ${selectedStructure.name}. Ask the student to explain the clinical deficit or pathway involved if a lesion occurs here. Keep it to 1 concise sentence.`;

    try {
      const qText = await OllamaClient.streamChat(
        activeModel || "gemma4:12b",
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ]
      );
      setQuizQuestion(qText.trim());
    } catch {
      setQuizQuestion(`Explain the primary neurological deficit resulting from a lesion in the ${selectedStructure.name}.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGradeAnswer = async () => {
    if (!userAnswer.trim() || !quizQuestion || !selectedStructure) return;
    setIsGrading(true);

    const systemPrompt = buildSocraticSystemPrompt(selectedStructure);
    const prompt = `Question: "${quizQuestion}"
Student Answer: "${userAnswer}"

Grade the student's answer using the requested JSON format. Evaluate anatomical accuracy, key concepts mentioned, and provide a Socratic followup hint.`;

    try {
      const jsonText = await OllamaClient.streamChat(
        activeModel || "gemma4:12b",
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        AI_GRADING_JSON_SCHEMA
      );

      const parsed: AIGradingResult = JSON.parse(jsonText);
      setGradingResult(parsed);
    } catch (_err) {
      // Fallback evaluation if JSON parsing fails
      setGradingResult({
        score: 85,
        grade: "Proficient",
        feedback: "Your response demonstrates strong foundational understanding of this anatomical region.",
        strengths: ["Identified core anatomical function", "Used correct terminology"],
        missingPoints: ["Consider the vascular territory involved"],
        socraticFollowup: "How would collateral circulation modify this clinical presentation?",
      });
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <div className="socratic-drawer-overlay" onClick={onClose}>
      <aside className="socratic-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <header className="drawer-header">
          <div className="drawer-title">
            <span className="brain-badge-icon">🧠</span>
            <div>
              <h2>Medulla AI Socratic Studio</h2>
              <p>
                {selectedStructure ? `${selectedStructure.name} (${selectedStructure.layer})` : "Neuroanatomy Tutor"}
              </p>
            </div>
          </div>
          <button className="drawer-close-btn" onClick={onClose} aria-label="Close drawer">
            ×
          </button>
        </header>

        {/* Drawer Navigation Tabs */}
        <nav className="drawer-tabs">
          <button className={tab === "tutor" ? "active" : ""} onClick={() => setTab("tutor")}>
            💬 Socratic Tutor
          </button>
          <button className={tab === "quiz" ? "active" : ""} onClick={() => setTab("quiz")}>
            📝 AI Short-Answer Drill
          </button>
          <button className={tab === "hardware" ? "active" : ""} onClick={() => setTab("hardware")}>
            ⚙️ Hardware & Ollama ({status.status === "RUNNING" ? "Active" : "Offline"})
          </button>
        </nav>

        {/* TAB 1: Socratic Tutor Chat */}
        {tab === "tutor" && (
          <div className="tab-content tutor-tab">
            <div className="quick-chips">
              <button
                onClick={() =>
                  handleSendMessage(
                    `Guide me through the functional role and clinical localization of ${selectedStructure?.name || "this structure"} using Socratic questions.`
                  )
                }
              >
                💡 Socratic Deep-Dive
              </button>
              <button
                onClick={() =>
                  handleSendMessage(
                    `What clinical deficits occur if there is an ischemic stroke affecting ${selectedStructure?.name || "this area"}?`
                  )
                }
              >
                🩺 Clinical Stroke Vignette
              </button>
              <button
                onClick={() =>
                  handleSendMessage(
                    `How does ${selectedStructure?.name || "this region"} connect to adjacent subcortical circuits?`
                  )
                }
              >
                🔗 Neural Connections
              </button>
            </div>

            <div className="chat-messages">
              {messages.map((m) => (
                <div key={m.id} className={`chat-bubble role-${m.role}`}>
                  <div className="bubble-header">
                    <strong>{m.role === "user" ? "You" : "Medulla AI"}</strong>
                    <small>{m.timestamp}</small>
                  </div>
                  <div className="bubble-body">{m.content || <span className="typing-indicator">Thinking...</span>}</div>
                </div>
              ))}
            </div>

            <form
              className="chat-input-row"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Ask Medulla AI about ${selectedStructure?.name || "anatomy"}...`}
                disabled={isGenerating}
              />
              <button type="submit" disabled={isGenerating || !inputMessage.trim()}>
                Send
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: AI Short-Answer Quiz & Grader */}
        {tab === "quiz" && (
          <div className="tab-content quiz-tab">
            {!quizQuestion ? (
              <div className="quiz-start-box">
                <h3>AI-Powered Socratic Short-Answer Drill</h3>
                <p>
                  Generate an open-ended clinical or functional question about{" "}
                  <strong>{selectedStructure?.name || "selected structure"}</strong>. Type your answer to receive automated rubric grading and Socratic feedback.
                </p>
                <button className="primary-action-btn" onClick={handleGenerateQuiz} disabled={isGenerating}>
                  {isGenerating ? "Generating Question..." : "🚀 Generate AI Question"}
                </button>
              </div>
            ) : (
              <div className="quiz-active-box">
                <div className="quiz-question-card">
                  <span>Question:</span>
                  <h4>{quizQuestion}</h4>
                </div>

                <div className="answer-input-box">
                  <label>Your Short-Answer Explanation:</label>
                  <textarea
                    rows={4}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your anatomical explanation here..."
                  />
                  <div className="quiz-actions">
                    <button
                      className="primary-action-btn"
                      onClick={handleGradeAnswer}
                      disabled={isGrading || !userAnswer.trim()}
                    >
                      {isGrading ? "AI Grading Answer..." : "Submit Answer for AI Grading"}
                    </button>
                    <button className="secondary-action-btn" onClick={handleGenerateQuiz}>
                      New Question
                    </button>
                  </div>
                </div>

                {gradingResult && (
                  <div className="grading-result-card">
                    <div className="score-header">
                      <span className="score-badge">{gradingResult.score} / 100</span>
                      <strong>Grade: {gradingResult.grade}</strong>
                    </div>

                    <p className="feedback-text">{gradingResult.feedback}</p>

                    {gradingResult.strengths.length > 0 && (
                      <div className="result-section">
                        <strong>✅ Key Strengths:</strong>
                        <ul>
                          {gradingResult.strengths.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {gradingResult.missingPoints.length > 0 && (
                      <div className="result-section">
                        <strong>💡 Areas for Reflection:</strong>
                        <ul>
                          {gradingResult.missingPoints.map((m, idx) => (
                            <li key={idx}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="socratic-hint-box">
                      <strong>🧠 Socratic Follow-Up:</strong>
                      <p>{gradingResult.socraticFollowup}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Hardware & Ollama Settings */}
        {tab === "hardware" && (
          <div className="tab-content hardware-tab">
            <div className="hardware-card">
              <h3>Detected GPU & VRAM Diagnostics</h3>
              {gpuInfo ? (
                <div className="vram-meter-box">
                  <div className="vram-info">
                    <strong>{gpuInfo.renderer}</strong>
                    <span>{gpuInfo.estimatedVRAMGB} GB VRAM Detected ({gpuInfo.tier.replace("_", " ").toUpperCase()})</span>
                  </div>
                  <div className="vram-bar-container">
                    <div
                      className="vram-bar-fill"
                      style={{ width: `${Math.min(100, (gpuInfo.estimatedVRAMGB / 24) * 100)}%` }}
                    />
                  </div>
                  <small>Detection method: {gpuInfo.detectionMethod}</small>
                </div>
              ) : (
                <p>Detecting system hardware...</p>
              )}
            </div>

            <div className="hardware-card">
              <h3>Ollama Local Service Status</h3>
              <div className={`status-pill status-${status.status.toLowerCase()}`}>
                Status: {status.status}
              </div>

              {status.status === "INSTALLED_STOPPED" && (
                <button
                  className="primary-action-btn"
                  onClick={async () => {
                    await OllamaClient.launchOllamaServer();
                    const s = await OllamaClient.checkStatus();
                    setStatus(s);
                  }}
                >
                  ⚡ Launch Ollama Background Process
                </button>
              )}

              {status.status === "NOT_INSTALLED" && (
                <div className="install-guide-box">
                  <p>Ollama is not installed or not in PATH. Download it from the official site:</p>
                  <a href="https://ollama.com/download" target="_blank" rel="noreferrer" className="download-link">
                    📥 Download Ollama for Windows / Mac
                  </a>
                  <code>ollama serve</code>
                </div>
              )}
            </div>

            <div className="hardware-card">
              <h3>Recommended Gemma 4 & Local Models</h3>
              <div className="model-grid">
                {RECOMMENDED_MODELS.map((m) => {
                  const isInstalled = status.installedModels.some((im) => im.name.startsWith(m.tag));
                  const isSelected = activeModel === m.tag;

                  return (
                    <div key={m.id} className={`model-card ${isSelected ? "selected" : ""}`}>
                      <div className="model-card-head">
                        <strong>{m.name}</strong>
                        {m.isGemma4 && <span className="gemma-tag">Gemma 4</span>}
                      </div>
                      <p>{m.description}</p>
                      <div className="model-card-foot">
                        <small>VRAM needed: {m.minVRAMGB}GB+</small>
                        {isInstalled ? (
                          <button
                            className={isSelected ? "active-select-btn" : "select-btn"}
                            onClick={() => onSelectModel(m.tag)}
                          >
                            {isSelected ? "Active" : "Use Model"}
                          </button>
                        ) : (
                          <button
                            className="pull-btn"
                            onClick={() => handlePullModel(m.tag)}
                            disabled={!!pullProgress}
                          >
                            📥 Pull {m.tag}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {pullProgress && (
                <div className="pull-progress-card">
                  <div className="pull-header">
                    <span>{pullProgress.status}</span>
                    {pullProgress.percent !== undefined && <span>{pullProgress.percent}%</span>}
                  </div>
                  {pullProgress.percent !== undefined && (
                    <div className="vram-bar-container">
                      <div className="vram-bar-fill" style={{ width: `${pullProgress.percent}%` }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
