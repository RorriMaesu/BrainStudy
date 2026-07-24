/**
 * Ollama Client API Service for BrainStudy
 * Provides status checking, local process launching, model pulling,
 * and streaming chat/completion requests.
 */

export interface OllamaModelTag {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaProcessInfo {
  name: string;
  size: number;
  size_vram: number;
  digest: string;
}

export interface OllamaStatusResponse {
  status: "RUNNING" | "INSTALLED_STOPPED" | "NOT_INSTALLED";
  installedModels: OllamaModelTag[];
  runningModels: OllamaProcessInfo[];
  version?: string;
  activeModel?: string;
}

export class OllamaClient {
  private static defaultHost = "http://127.0.0.1:11434";

  private static isStaticDeployment(): boolean {
    if (typeof window === "undefined") return false;
    const host = window.location.hostname;
    return host.endsWith("github.io") || window.location.protocol === "file:";
  }

  /**
   * Check Ollama status directly from browser with fallback to local server route
   */
  static async checkStatus(): Promise<OllamaStatusResponse> {
    try {
      // Direct browser ping to local Ollama instance (port 11434)
      const res = await fetch(`${this.defaultHost}/api/tags`, {
        method: "GET",
        signal: AbortSignal.timeout(2000),
      });

      if (res.ok) {
        const data = (await res.json()) as { models?: OllamaModelTag[] };
        const models: OllamaModelTag[] = data.models || [];

        let runningModels: OllamaProcessInfo[] = [];
        try {
          const psRes = await fetch(`${this.defaultHost}/api/ps`, { signal: AbortSignal.timeout(1500) });
          if (psRes.ok) {
            const psData = (await psRes.json()) as { models?: OllamaProcessInfo[] };
            runningModels = psData.models || [];
          }
        } catch (_err) {
          // Ignore /api/ps error
        }

        return {
          status: "RUNNING",
          installedModels: models,
          runningModels,
          version: "0.5.x",
          activeModel: runningModels[0]?.name || models[0]?.name || "gemma4:12b",
        };
      }
    } catch (_err) {
      // Direct ping failed
    }

    // If not static host, check local server proxy endpoint
    if (!this.isStaticDeployment()) {
      try {
        const serverRes = await fetch("/api/system/ollama/status", { cache: "no-store" });
        if (serverRes.ok) {
          return (await serverRes.json()) as OllamaStatusResponse;
        }
      } catch (_err) {
        // Server route unreachable
      }
    }

    return {
      status: "NOT_INSTALLED",
      installedModels: [],
      runningModels: [],
    };
  }

  /**
   * Request local server to launch Ollama application process
   */
  static async launchOllamaServer(): Promise<{ success: boolean; message: string }> {
    if (this.isStaticDeployment()) {
      return {
        success: false,
        message: "Ollama background launcher requires running BrainStudy locally. Please run 'ollama serve' in your terminal.",
      };
    }

    try {
      const res = await fetch("/api/system/ollama/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        return (await res.json()) as { success: boolean; message: string };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reach server launcher endpoint.";
      return { success: false, message };
    }
    return { success: false, message: "Server launcher returned an error." };
  }

  /**
   * Stream model download from Ollama API
   */
  static async pullModel(
    modelName: string,
    onProgress: (status: string, percent?: number) => void,
  ): Promise<boolean> {
    try {
      let res: Response | undefined;

      if (!this.isStaticDeployment()) {
        try {
          const serverRes = await fetch("/api/system/ollama/pull", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: modelName }),
          });
          if (serverRes.ok) res = serverRes;
        } catch (_err) {
          // Ignore server route failure
        }
      }

      if (!res || !res.ok) {
        res = await fetch(`${this.defaultHost}/api/pull`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: modelName, stream: true }),
        });
      }

      if (!res.ok || !res.body) return false;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const json = JSON.parse(line) as { status?: string; total?: number; completed?: number };
            if (json.status) {
              let pct: number | undefined;
              if (typeof json.total === "number" && typeof json.completed === "number" && json.total > 0) {
                pct = Math.round((json.completed / json.total) * 100);
              }
              onProgress(json.status, pct);
            }
          } catch (_err) {
            // Partial chunk
          }
        }
      }
      return true;
    } catch (err: unknown) {
      console.error("Error pulling model:", err);
      return false;
    }
  }

  /**
   * Stream chat completion request to local Ollama instance
   */
  static async streamChat(
    model: string,
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    format?: unknown,
    onChunk?: (chunk: string) => void,
  ): Promise<string> {
    let fullResponse = "";

    try {
      const payload: Record<string, unknown> = {
        model,
        messages,
        stream: true,
      };
      if (format) payload.format = format;

      let response: Response | undefined;

      // 1. Try local server proxy endpoint if not on static CDN
      if (!this.isStaticDeployment()) {
        try {
          const res = await fetch("/api/system/ollama/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            response = res;
          }
        } catch (_err) {
          // Fall through to browser direct fetch
        }
      }

      // 2. Direct browser fetch to local Ollama instance (port 11434)
      if (!response || !response.ok) {
        response = await fetch(`${this.defaultHost}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        throw new Error(`Ollama chat error HTTP ${response.status}`);
      }

      if (!response.body) {
        const data = (await response.json()) as { message?: { content?: string } };
        return data?.message?.content || "";
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const json = JSON.parse(line) as { message?: { content?: string }; response?: string };
            const content = json.message?.content || json.response || "";
            fullResponse += content;
            if (onChunk && content) {
              onChunk(content);
            }
          } catch (_err) {
            // Buffer chunk
          }
        }
      }
    } catch (err: unknown) {
      console.error("Ollama Chat Stream Error:", err);
      throw err;
    }

    return fullResponse;
  }
}
