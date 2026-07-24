# BrainStudy

BrainStudy is a desktop-class, browser-based 3D neuroanatomy laboratory. Its cortical surface is derived from the BigBrain histological reconstruction, with interactive dissection, labeled teaching reconstructions of deep anatomy, animated functional pathways, clinical correlations, and identification assessment.

## Run on Windows

1. Extract the ZIP directly into `D:\`. You should end up with `D:\BrainStudy\START_BRAINSTUDY.bat`.
2. Double-click `START_BRAINSTUDY.bat`.
3. The first launch installs the locked project packages, waits for the laboratory to be ready, and then opens it in your browser.

You can also open a terminal in the folder and run:

```powershell
npm install
npm run dev -- --host 127.0.0.1
```

Then visit `http://127.0.0.1:5173`.

Node.js 22 or newer is required.

## Learning features

- High-detail bilateral BigBrain cortical surface with preserved sulcal anatomy
- Six anatomically oriented camera presets plus free orbit and zoom
- Left/right hemisphere isolation, separation, and sagittal/coronal/axial clipping
- Anatomical orientation compass using superior/inferior, anterior/posterior, and left/right axes
- Surface, deep-anatomy, and animated functional-circuit layers
- Direct gross-lobe selection from the cortical surface
- Projected labels, optional teaching overlays, and searchable structure index
- College-level functional anatomy, connections, and clinical localization notes
- Evidence-grade badges, interpretation limits, and an in-app source registry
- Randomized identification drills with score tracking
- Responsive layout and reduced-motion support

## Academic provenance

The cortical geometry is adapted from the BigBrain Project 3D-print meshes and used under CC BY-NC-SA 4.0. The source meshes were merged, centered, converted to glTF, and tagged with approximate lobe-level teaching colors for this project. See `THIRD_PARTY_NOTICES.md` and `public/models/BIGBRAIN-LICENSE.txt`.

The app explicitly classifies each layer as **atlas-derived**, **anatomical teaching model**, or **conceptual network**. The deep structures and animated pathways are schematic teaching reconstructions intended to communicate relative spatial relationships. They are not patient-specific, segmentation-grade, diagnostic, or surgical-planning models.

The next scientific milestone is to register atlas-derived subcortical segmentations and cortical parcellations into a shared EBRAINS/BigBrain reference space. Until that replacement is complete, the interface intentionally exposes the current geometry limits instead of implying false precision.

## Controls

- Drag: rotate
- Mouse wheel or trackpad: zoom
- `L`: toggle labels
- `R`: reset camera and dissection
- `Esc`: exit assessment mode
