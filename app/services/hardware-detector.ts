/**
 * Hardware & GPU VRAM Detection Utility for BrainStudy
 * Uses WebGL & WebGPU diagnostic extensions alongside server diagnostics
 * to recommend optimal Gemma 4 and local LLM model tiers.
 */

export interface GPUHardwareInfo {
  renderer: string;
  vendor: string;
  estimatedVRAMGB: number;
  detectionMethod: "webgpu" | "webgl" | "server" | "fallback";
  tier: "tier1_edge" | "tier2_compact" | "tier3_workstation" | "tier4_enthusiast";
  recommendedModel: string;
  alternativeModels: string[];
}

export interface ModelRecommendation {
  id: string;
  name: string;
  tag: string;
  sizeGB: number;
  minVRAMGB: number;
  recommendedVRAMGB: number;
  description: string;
  isGemma4?: boolean;
}

export const RECOMMENDED_MODELS: ModelRecommendation[] = [
  {
    id: "gemma4-12b",
    name: "Gemma 4 12B (Optimal)",
    tag: "gemma4:12b",
    sizeGB: 7.3,
    minVRAMGB: 8,
    recommendedVRAMGB: 12,
    description: "Google's flagship 12B multimodal model. Ideal for Socratic reasoning and deep neuroanatomy.",
    isGemma4: true,
  },
  {
    id: "gemma4-e4b",
    name: "Gemma 4 e4b (Compact)",
    tag: "gemma4:e4b",
    sizeGB: 2.8,
    minVRAMGB: 4,
    recommendedVRAMGB: 6,
    description: "Balanced effective 4B parameter model for mid-tier GPUs and laptops.",
    isGemma4: true,
  },
  {
    id: "gemma4-e2b",
    name: "Gemma 4 e2b (Lightweight)",
    tag: "gemma4:e2b",
    sizeGB: 1.6,
    minVRAMGB: 2,
    recommendedVRAMGB: 4,
    description: "Ultra-fast execution on entry-level edge GPUs.",
    isGemma4: true,
  },
  {
    id: "gemma4-26b",
    name: "Gemma 4 26b MoE (Enthusiast)",
    tag: "gemma4:26b",
    sizeGB: 15.5,
    minVRAMGB: 14,
    recommendedVRAMGB: 16,
    description: "Mixture-of-Experts model for workstation GPUs with high VRAM capacity.",
    isGemma4: true,
  },
  {
    id: "llama3-1-8b",
    name: "Llama 3.1 8B Instruct",
    tag: "llama3.1:8b",
    sizeGB: 4.7,
    minVRAMGB: 6,
    recommendedVRAMGB: 8,
    description: "Meta's popular 8B open model.",
  },
  {
    id: "qwen2-5-7b",
    name: "Qwen 2.5 7B Instruct",
    tag: "qwen2.5:7b",
    sizeGB: 4.5,
    minVRAMGB: 6,
    recommendedVRAMGB: 8,
    description: "High performance 7B model with strong JSON formatting adherence.",
  },
];

export function getTierFromVRAM(vramGB: number): GPUHardwareInfo["tier"] {
  if (vramGB >= 16) return "tier4_enthusiast";
  if (vramGB >= 10) return "tier3_workstation";
  if (vramGB >= 6) return "tier2_compact";
  return "tier1_edge";
}

export function getRecommendedModelForVRAM(vramGB: number): { primary: string; alternatives: string[] } {
  if (vramGB >= 16) {
    return {
      primary: "gemma4:26b",
      alternatives: ["gemma4:12b", "llama3.3:70b-instruct-q4_K_M", "qwen2.5:32b"],
    };
  }
  if (vramGB >= 10) {
    return {
      primary: "gemma4:12b",
      alternatives: ["gemma4:e4b", "llama3.1:8b", "qwen2.5:14b"],
    };
  }
  if (vramGB >= 6) {
    return {
      primary: "gemma4:e4b",
      alternatives: ["gemma4:e2b", "llama3.1:8b", "qwen2.5:7b"],
    };
  }
  return {
    primary: "gemma4:e2b",
    alternatives: ["gemma2:2b", "llama3.2:3b"],
  };
}

/**
 * Detect GPU renderer and estimate VRAM capacity from WebGL & WebGPU APIs
 */
export async function detectGPUHardware(): Promise<GPUHardwareInfo> {
  let renderer = "Standard GPU";
  let vendor = "Generic Vendor";
  let estimatedVRAMGB = 8;
  let method: GPUHardwareInfo["detectionMethod"] = "fallback";

  if (typeof window === "undefined") {
    const tier = getTierFromVRAM(estimatedVRAMGB);
    const recs = getRecommendedModelForVRAM(estimatedVRAMGB);
    return {
      renderer,
      vendor,
      estimatedVRAMGB,
      detectionMethod: method,
      tier,
      recommendedModel: recs.primary,
      alternativeModels: recs.alternatives,
    };
  }

  // 1. Try WebGPU requestAdapter
  try {
    if ("gpu" in navigator && (navigator as unknown as { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu) {
      const gpuNav = (navigator as unknown as { gpu: { requestAdapter: () => Promise<unknown> } }).gpu;
      const adapter = (await gpuNav.requestAdapter()) as { info?: { description?: string; architecture?: string; vendor?: string } } | null;
      if (adapter) {
        const info = adapter.info || {};
        if (info.description || info.architecture || info.vendor) {
          renderer = info.description || info.architecture || renderer;
          vendor = info.vendor || vendor;
          method = "webgpu";
        }
      }
    }
  } catch (_err) {
    // Ignore WebGPU errors and fall back to WebGL
  }

  // 2. Try WebGL Debug Renderer Info
  if (method === "fallback") {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (gl) {
        const glCtx = gl as unknown as {
          getExtension: (name: string) => { UNMASKED_RENDERER_WEBGL: number; UNMASKED_VENDOR_WEBGL: number } | null;
          getParameter: (p: number) => string;
        };
        const debugInfo = glCtx.getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          renderer = glCtx.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || renderer;
          vendor = glCtx.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || vendor;
          method = "webgl";
        }
      }
    } catch (_err) {
      // Ignore WebGL debug extension errors
    }
  }

  // 3. Estimate VRAM based on GPU renderer model heuristics
  const lowerRenderer = renderer.toLowerCase();
  if (lowerRenderer.includes("rtx 4090") || lowerRenderer.includes("rtx 3090") || lowerRenderer.includes("rx 7900")) {
    estimatedVRAMGB = 24;
  } else if (
    lowerRenderer.includes("rtx 4080") ||
    lowerRenderer.includes("rtx 3080 ti") ||
    lowerRenderer.includes("m3 max") ||
    lowerRenderer.includes("m2 max")
  ) {
    estimatedVRAMGB = 16;
  } else if (
    lowerRenderer.includes("rtx 4070") ||
    lowerRenderer.includes("rtx 3080") ||
    lowerRenderer.includes("rtx 3070") ||
    lowerRenderer.includes("rx 7800") ||
    lowerRenderer.includes("rx 6800") ||
    lowerRenderer.includes("m3 pro") ||
    lowerRenderer.includes("m2 pro")
  ) {
    estimatedVRAMGB = 12;
  } else if (
    lowerRenderer.includes("rtx 4060") ||
    lowerRenderer.includes("rtx 3060") ||
    lowerRenderer.includes("rtx 2080") ||
    lowerRenderer.includes("rx 7600") ||
    lowerRenderer.includes("rx 6700") ||
    lowerRenderer.includes("m1 pro") ||
    lowerRenderer.includes("m3") ||
    lowerRenderer.includes("m2") ||
    lowerRenderer.includes("m1")
  ) {
    estimatedVRAMGB = 8;
  } else if (lowerRenderer.includes("gtx 1660") || lowerRenderer.includes("gtx 1060") || lowerRenderer.includes("intel iris")) {
    estimatedVRAMGB = 6;
  }

  // 4. Optionally query local server API if available for exact hardware
  try {
    const res = await fetch("/api/system/gpu", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { vramGB?: number; gpuName?: string };
      if (data && typeof data.vramGB === "number" && data.vramGB > 0) {
        estimatedVRAMGB = data.vramGB;
        if (data.gpuName) renderer = data.gpuName;
        method = "server";
      }
    }
  } catch (_err) {
    // Local server hardware endpoint offline or in static preview mode
  }

  const tier = getTierFromVRAM(estimatedVRAMGB);
  const recs = getRecommendedModelForVRAM(estimatedVRAMGB);

  return {
    renderer,
    vendor,
    estimatedVRAMGB,
    detectionMethod: method,
    tier,
    recommendedModel: recs.primary,
    alternativeModels: recs.alternatives,
  };
}
