/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { handleGpuRequest } from "../server/api/system/gpu";
import { handleOllamaStatusRequest } from "../server/api/system/ollama-status";
import { handleOllamaLaunchRequest } from "../server/api/system/ollama-launch";
import { handleOllamaChatRequest } from "../server/api/system/ollama-chat";
import { handleOllamaPullRequest } from "../server/api/system/ollama-pull";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    if (url.pathname === "/api/system/gpu") {
      return handleGpuRequest();
    }
    if (url.pathname === "/api/system/ollama/status") {
      return handleOllamaStatusRequest();
    }
    if (url.pathname === "/api/system/ollama/launch") {
      return handleOllamaLaunchRequest();
    }
    if (url.pathname === "/api/system/ollama/chat") {
      return handleOllamaChatRequest(request);
    }
    if (url.pathname === "/api/system/ollama/pull") {
      return handleOllamaPullRequest(request);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
