import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function handleGpuRequest(): Promise<Response> {
  let gpuName = "Generic GPU";
  let vramGB = 8;
  let success = false;

  // 1. Try nvidia-smi on Windows/Linux
  try {
    const { stdout } = await execAsync(
      "nvidia-smi --query-gpu=memory.total,name --format=csv,noheader,nounits",
      { timeout: 2500 }
    );
    if (stdout && stdout.trim()) {
      const parts = stdout.trim().split("\n")[0].split(",");
      if (parts.length >= 2) {
        const memMB = parseFloat(parts[0].trim());
        gpuName = parts[1].trim();
        if (!isNaN(memMB) && memMB > 0) {
          vramGB = Math.round((memMB / 1024) * 10) / 10;
          success = true;
        }
      }
    }
  } catch (_err) {
    // nvidia-smi not available or non-NVIDIA GPU
  }

  // 2. Try Windows PowerShell WMI query if nvidia-smi failed
  if (!success && process.platform === "win32") {
    try {
      const command =
        'powershell -NoProfile -Command "Get-CimInstance Win32_VideoController | Select-Object Name, AdapterRAM | ConvertTo-Json"';
      const { stdout } = await execAsync(command, { timeout: 3000 });
      if (stdout) {
        const parsed = JSON.parse(stdout);
        const item = Array.isArray(parsed) ? parsed[0] : parsed;
        if (item && item.Name) {
          gpuName = item.Name;
          if (item.AdapterRAM && item.AdapterRAM > 0) {
            vramGB = Math.round((item.AdapterRAM / (1024 * 1024 * 1024)) * 10) / 10;
            success = true;
          }
        }
      }
    } catch (_err) {
      // Ignore PowerShell errors
    }
  }

  return Response.json({
    success,
    gpuName,
    vramGB,
    platform: process.platform,
  });
}
