"use client";

import { useEffect, useState } from "react";
import { OllamaClient, type OllamaStatusResponse } from "../services/ollama-client";
import { detectGPUHardware, type GPUHardwareInfo } from "../services/hardware-detector";

interface Props {
  onOpenHardwareDrawer: () => void;
  activeModel: string;
  onSelectModel: (model: string) => void;
}

export function OllamaStatusBadge({ onOpenHardwareDrawer, activeModel }: Props) {
  const [statusInfo, setStatusInfo] = useState<OllamaStatusResponse>({
    status: "NOT_INSTALLED",
    installedModels: [],
    runningModels: [],
  });
  const [gpuInfo, setGpuInfo] = useState<GPUHardwareInfo | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchMessage, setLaunchMessage] = useState("");

  const refreshStatus = async () => {
    const status = await OllamaClient.checkStatus();
    setStatusInfo(status);
    const gpu = await detectGPUHardware();
    setGpuInfo(gpu);
  };

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleLaunchClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLaunching(true);
    setLaunchMessage("Starting Ollama background process...");
    const res = await OllamaClient.launchOllamaServer();
    if (res.success) {
      setLaunchMessage("Ollama process launched! Polling service...");
      // Poll faster for 15 seconds
      let attempts = 0;
      const pollTimer = setInterval(async () => {
        attempts++;
        const s = await OllamaClient.checkStatus();
        if (s.status === "RUNNING") {
          setStatusInfo(s);
          setIsLaunching(false);
          setLaunchMessage("");
          clearInterval(pollTimer);
        } else if (attempts > 15) {
          setIsLaunching(false);
          setLaunchMessage("Launch requested. Check terminal if server did not start.");
          clearInterval(pollTimer);
        }
      }, 1000);
    } else {
      setIsLaunching(false);
      setLaunchMessage(res.message);
    }
  };

  return (
    <div className="ollama-status-container">
      <button
        className={`ollama-badge status-${statusInfo.status.toLowerCase()}`}
        onClick={onOpenHardwareDrawer}
        title="Click to manage Ollama models and GPU hardware diagnostics"
      >
        <span className="status-indicator-dot" />

        {statusInfo.status === "RUNNING" && (
          <span className="badge-text">
            <strong>Ollama Active</strong>
            <small>
              {activeModel || "Gemma 4 12B"} · {gpuInfo ? `${gpuInfo.estimatedVRAMGB}GB VRAM` : "GPU Detected"}
            </small>
          </span>
        )}

        {statusInfo.status === "INSTALLED_STOPPED" && (
          <span className="badge-text">
            <strong>Ollama Stopped</strong>
            <small>Click to Launch Ollama</small>
          </span>
        )}

        {statusInfo.status === "NOT_INSTALLED" && (
          <span className="badge-text">
            <strong>Ollama Not Found</strong>
            <small>Setup Local AI</small>
          </span>
        )}
      </button>

      {statusInfo.status === "INSTALLED_STOPPED" && !isLaunching && (
        <button className="launch-quick-btn" onClick={handleLaunchClick}>
          ⚡ Launch Ollama
        </button>
      )}

      {isLaunching && <span className="launch-spinner">{launchMessage}</span>}
    </div>
  );
}
