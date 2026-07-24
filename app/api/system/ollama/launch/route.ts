import { spawn } from "child_process";

export async function POST() {
  try {
    if (process.platform === "win32") {
      // Launch Ollama app or service on Windows detached
      const child = spawn("cmd.exe", ["/c", "start", "", "ollama", "app"], {
        detached: true,
        stdio: "ignore",
      });
      child.unref();
    } else if (process.platform === "darwin") {
      // Launch Ollama application on macOS
      const child = spawn("open", ["-a", "Ollama"], {
        detached: true,
        stdio: "ignore",
      });
      child.unref();
    } else {
      // Linux: spawn ollama serve
      const child = spawn("ollama", ["serve"], {
        detached: true,
        stdio: "ignore",
      });
      child.unref();
    }

    return Response.json({
      success: true,
      message: "Ollama launch signal sent successfully.",
    });
  } catch (err: any) {
    console.error("Failed to launch Ollama process:", err);
    return Response.json(
      {
        success: false,
        message: err.message || "Failed to launch Ollama process on host system.",
      },
      { status: 500 }
    );
  }
}
