import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  const defaultHost = "http://127.0.0.1:11434";

  // 1. Check HTTP service on port 11434
  try {
    const res = await fetch(`${defaultHost}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(1500),
    });

    if (res.ok) {
      const data = await res.json();
      let runningModels = [];
      try {
        const psRes = await fetch(`${defaultHost}/api/ps`, { signal: AbortSignal.timeout(1000) });
        if (psRes.ok) {
          const psData = await psRes.json();
          runningModels = psData.models || [];
        }
      } catch {}

      return Response.json({
        status: "RUNNING",
        installedModels: data.models || [],
        runningModels,
        version: "0.5.x",
      });
    }
  } catch {
    // Port 11434 not responding
  }

  // 2. Check if Ollama executable exists in PATH
  let isInstalled = false;
  try {
    const cmd = process.platform === "win32" ? "where ollama" : "which ollama";
    const { stdout } = await execAsync(cmd, { timeout: 2000 });
    if (stdout && stdout.trim()) {
      isInstalled = true;
    }
  } catch {
    isInstalled = false;
  }

  return Response.json({
    status: isInstalled ? "INSTALLED_STOPPED" : "NOT_INSTALLED",
    installedModels: [],
    runningModels: [],
  });
}
