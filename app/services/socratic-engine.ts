/**
 * Socratic AI Tutor & Quiz Engine ("Medulla AI")
 * Prompt engineering, structured JSON schemas, and anatomical context builders
 * for local LLM models like Gemma 4 12B, Llama 3.1, etc.
 */

export interface BrainStructureContext {
  id: string;
  name: string;
  role: string;
  location: string;
  detail: string;
  memory: string;
  system: string;
  layer: string;
  connections?: string[];
  clinical?: string;
  evidenceGrade?: string;
}

export interface AIQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  socraticHint: string;
  targetStructureId: string;
}

export interface AIGradingResult {
  score: number; // 0 - 100
  grade: "Exemplary" | "Proficient" | "Developing" | "Needs Review";
  feedback: string;
  strengths: string[];
  missingPoints: string[];
  socraticFollowup: string;
}

export interface AIClinicalCase {
  id: string;
  patientTitle: string;
  vignette: string;
  symptoms: string[];
  affectedStructureId: string;
  affectedStructureName: string;
  socraticQuestion: string;
  differentialHints: string[];
}

export function buildSocraticSystemPrompt(context?: BrainStructureContext): string {
  let prompt = `You are Medulla AI, a distinguished professor of neuroanatomy, clinical neurology, and Socratic tutor in the BrainStudy laboratory.
Your goal is to guide students through deep neuroanatomical comprehension using the Socratic method.

RULES:
1. NEVER give direct multi-paragraph answers immediately. Start by validating what the student understands and ask 1-2 sharp, thought-provoking Socratic follow-up questions.
2. Relate anatomical structures to their embryological origin, functional circuits, and clinical deficits (e.g. stroke localization, cranial nerve signs).
3. Keep responses concise, engaging, and academically precise (college/medical school level).
4. Use standard neuroanatomical terminology (e.g., ipsilateral, contralateral, sulcus, gyrus, nucleus, pathway).`;

  if (context) {
    prompt += `\n\nCURRENTLY SELECTED 3D BRAIN STRUCTURE CONTEXT:
- Name: ${context.name}
- Layer: ${context.layer}
- System/Network: ${context.system}
- Location: ${context.location}
- Primary Function/Role: ${context.role}
- Anatomical Detail: ${context.detail}
- Memory Anchor: ${context.memory}`;

    if (context.connections && context.connections.length > 0) {
      prompt += `\n- Neural Connections: ${context.connections.join("; ")}`;
    }
    if (context.clinical) {
      prompt += `\n- Clinical Correlation: ${context.clinical}`;
    }
  }

  return prompt;
}

/**
 * JSON Schema for Quiz Generation in Ollama
 */
export const AI_QUIZ_JSON_SCHEMA = {
  type: "object",
  properties: {
    question: { type: "string" },
    options: {
      type: "array",
      items: { type: "string" },
    },
    correctIndex: { type: "integer" },
    explanation: { type: "string" },
    socraticHint: { type: "string" },
  },
  required: ["question", "options", "correctIndex", "explanation", "socraticHint"],
};

/**
 * JSON Schema for Short-Answer AI Grading in Ollama
 */
export const AI_GRADING_JSON_SCHEMA = {
  type: "object",
  properties: {
    score: { type: "integer" },
    grade: { type: "string" },
    feedback: { type: "string" },
    strengths: {
      type: "array",
      items: { type: "string" },
    },
    missingPoints: {
      type: "array",
      items: { type: "string" },
    },
    socraticFollowup: { type: "string" },
  },
  required: ["score", "grade", "feedback", "strengths", "missingPoints", "socraticFollowup"],
};

/**
 * JSON Schema for Clinical Case Generation
 */
export const AI_CASE_JSON_SCHEMA = {
  type: "object",
  properties: {
    patientTitle: { type: "string" },
    vignette: { type: "string" },
    symptoms: {
      type: "array",
      items: { type: "string" },
    },
    socraticQuestion: { type: "string" },
    differentialHints: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["patientTitle", "vignette", "symptoms", "socraticQuestion", "differentialHints"],
};
