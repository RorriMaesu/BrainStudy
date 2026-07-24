<div align="center">

# 🧠 BrainStudy

### Advanced 3D Neuroanatomy Laboratory & Local Socratic AI Studio

[![Launch Live WebApp](https://img.shields.io/badge/🚀_Launch_Live_WebApp-BrainStudy-00f2fe?style=for-the-badge&logo=rocket&logoColor=white)](https://rorrimaesu.github.io/BrainStudy/)
[![Buy Me A Coffee](https://img.shields.io/badge/☕_Buy_Me_A_Coffee-Support_BrainStudy-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/rorrimaesu)

[![Gemma 4 Ready](https://img.shields.io/badge/Gemma_4-12B_%7C_e4b_%7C_e2b-4285F4?style=flat-square&logo=google&logoColor=white)](https://ollama.com)
[![Ollama Powered](https://img.shields.io/badge/Ollama-Local_AI_Bridge-000000?style=flat-square&logo=ollama&logoColor=white)](https://ollama.com)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22.13.0-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC_BY--NC--SA_4.0-lightgrey.style=flat-square)](public/models/BIGBRAIN-LICENSE.txt)

---

<p align="center">
  <b>BrainStudy</b> is a desktop-class 3D neuroanatomy laboratory and Socratic AI studio. Powered by high-resolution cortical geometry from the <b>BigBrain Project</b> and local LLM acceleration via <b>Ollama (Gemma 4 12B, Llama 3.1, Qwen)</b>, BrainStudy combines real-time WebGL rendering with hardware-aware Socratic tutoring, adaptive short-answer rubric grading, and interactive clinical lesion localization.
</p>

</div>

---

## ✨ Features at a Glance

### 🧠 3D Neuroanatomy Laboratory
* **BigBrain Histological Surface**: High-detail bilateral 3D cortical meshes preserving natural sulcal and gyral topography.
* **Multi-Layer Explorations**:
  * `01 Cortical Surface`: Gyri, sulci, and gross cerebral lobes.
  * `02 Deep Anatomy`: Subcortical nuclei, basal ganglia, limbic structures, and brainstem.
  * `03 Functional Circuits`: Animated neural information flow (sensory relays, motor tracts, limbic loops, and language networks).
* **Interactive Dissection & Planes**: L/R hemisphere isolation, medial separation, and live sagittal/coronal/axial section clipping.
* **Searchable Structure Index**: Filter over 30+ anatomical structures with dynamic 3D camera focusing.

### 🤖 Local AI & Gemma 4 Socratic Tutor ("Medulla AI")
* **Hardware GPU VRAM Auto-Detection**: WebGL/WebGPU diagnostic engine that probes your GPU renderer and physical VRAM to recommend the ideal local model tier:
  * **10–12 GB+ VRAM**: **Gemma 4 12B** (Optimal target for Socratic reasoning & multimodal anatomy)
  * **6–8 GB VRAM**: **Gemma 4 e4b** / Llama 3.1 8B (Compact balanced execution)
  * **< 6 GB VRAM**: **Gemma 4 e2b** / Llama 3.2 3B (Ultra-fast edge execution)
* **1-Click WebApp Process Launcher**: Launch your background Ollama server process straight from the web interface button (`⚡ Launch Ollama`).
* **1-Click Model Download Manager**: Stream model pulls directly in the UI with a real-time download progress bar.
* **Context-Aware Socratic Dialog**: Socratic tutor automatically syncs with the currently selected 3D brain region, neural connections, and clinical localization principles.
* **AI Short-Answer Rubric Grading**: Open-ended student question generator and 0–100 rubric grader utilizing native Ollama JSON Schemas to score accuracy, highlight missing points, and offer follow-up Socratic hints.
* **Clinical Case Simulator**: Diagnostic lesion scenarios that prompt students to identify the affected 3D structure on the brain canvas.

---

## 🚀 Quick Start (Run Locally)

### Windows 1-Click Launch
1. Download or extract the repository folder into your environment (e.g. `D:\BrainStudy`).
2. Double-click **`START_BRAINSTUDY.bat`**.
3. On first run, it installs dependencies, starts the local laboratory server, and opens `http://127.0.0.1:5173` in your browser.

### Manual Setup (Terminal)
Ensure Node.js 22+ is installed, then run:

```powershell
npm install
npm run dev -- --host 127.0.0.1
```

Open your browser at `http://127.0.0.1:5173`.

### Connecting Ollama Local AI
1. Install [Ollama](https://ollama.com/download).
2. Click the top-bar badge in BrainStudy (**`⚡ Launch Ollama`**) or run in terminal:
   ```bash
   ollama pull gemma4:12b
   ```
3. Open **`🧠 Medulla AI Studio`** in BrainStudy to start your Socratic learning session!

---

## ⌨️ Controls & Keyboard Shortcuts

| Shortcut / Action | Function |
|---|---|
| **Left Click + Drag** | Orbit & rotate 3D brain canvas |
| **Mouse Wheel / Pinch** | Smooth zoom in / out |
| **`L` Key** | Cycle label density (`Off` ➔ `Focus` ➔ `Key` ➔ `All`) |
| **`R` Key** | Reset camera presets, section planes, and dissection sliders |
| **`Esc` Key** | Exit quiz mode or close active dialogs |

---

## 🔬 Academic Provenance & Transparency

* **Cortical Surface Mesh**: Adapted from the **BigBrain Project** 3D reconstructions and licensed under **CC BY-NC-SA 4.0**.
* **Provenance Classification**: Every layer explicitly disclaims its geometry level (*Atlas-Derived*, *Anatomical Teaching Model*, or *Conceptual Network*).
* **Scope Disclosures**: Models are designed for higher education concept learning and orientation. They are not intended for diagnostic interpretation, patient-specific stereotaxy, or surgical planning.

---

## ☕ Support the Project

If you find BrainStudy helpful for your neuroanatomy studies or research, consider supporting development!

<a href="https://buymeacoffee.com/rorrimaesu" target="_blank">
  <img src="https://img.shields.io/badge/☕_Buy_Me_A_Coffee-Support_BrainStudy-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee" />
</a>

---

<div align="center">
  <small>Designed & Developed with ❤️ by <b>RorriMaesu</b></small>
</div>
