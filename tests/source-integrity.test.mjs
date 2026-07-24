import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("scientific fidelity is explicit for every learning layer", async () => {
  const authority = await source("app/science-authority.ts");

  assert.match(authority, /surface:\s*{[\s\S]*grade:\s*"Atlas-derived"/);
  assert.match(authority, /deep:\s*{[\s\S]*grade:\s*"Anatomical teaching model"/);
  assert.match(authority, /systems:\s*{[\s\S]*grade:\s*"Conceptual network"/);
  assert.match(authority, /limitation:/);
  assert.match(authority, /10\.1126\/science\.1235381/);
});

test("the viewer exposes orientation and three anatomical section planes", async () => {
  const [page, viewer, scene] = await Promise.all([
    source("app/page.tsx"),
    source("app/brain-viewer.tsx"),
    source("app/scene-data.ts"),
  ]);

  for (const plane of ["sagittal", "coronal", "axial"]) {
    assert.match(page, new RegExp(`"${plane}"`));
    assert.match(viewer, new RegExp(`${plane}:`));
  }

  for (const axis of ["orientation-superior", "orientation-anterior", "orientation-left"]) {
    assert.match(viewer, new RegExp(axis));
  }

  assert.match(scene, /superior:[\s\S]*up:\s*\[0,\s*1,\s*0\]/);
  assert.match(scene, /inferior:[\s\S]*up:\s*\[0,\s*-1,\s*0\]/);
  assert.doesNotMatch(viewer, /\bSparkles\b|\bEnvironment\b/);
});

test("the annotation system is camera-aware, bilateral and collision-managed", async () => {
  const [page, viewer, scene, css] = await Promise.all([
    source("app/page.tsx"),
    source("app/brain-viewer.tsx"),
    source("app/scene-data.ts"),
    source("app/globals.css"),
  ]);

  assert.match(scene, /laterality:\s*"bilateral"/);
  assert.match(scene, /laterality:\s*"left"/);
  assert.match(scene, /laterality:\s*"midline"/);
  assert.match(scene, /labelViews:/);
  assert.match(scene, /bestView:/);
  assert.match(viewer, /function AnnotationProjector/);
  assert.doesNotMatch(viewer, /new THREE\.Raycaster|intersectObjects\(/);
  assert.match(viewer, /if \(suspended\) return/);
  assert.match(viewer, /projectionDirty\.current/);
  assert.match(viewer, /function packLane/);
  assert.match(viewer, /function AnnotationOverlay/);
  assert.match(viewer, /frames=\{1\}/);
  assert.match(viewer, /resolution=\{256\}/);
  assert.doesNotMatch(viewer, /<Html\b/);
  assert.match(page, /LABEL_DENSITIES[\s\S]*"off"[\s\S]*"focus"[\s\S]*"key"[\s\S]*"all"/);
  assert.match(css, /\.annotation-card\.is-left/);
  assert.match(css, /\.annotation-card\.is-right/);
  assert.match(css, /\.annotation-layer\.is-moving/);
});

test("primary interface text does not regress to unreadable microtype", async () => {
  const css = await source("app/globals.css");
  assert.doesNotMatch(css, /font-size:\s*(?:[0-9](?:\.\d+)?)px/);
});

test("licensed atlas assets and notices remain packaged", async () => {
  const files = [
    "public/models/bigbrain-left.glb",
    "public/models/bigbrain-right.glb",
    "public/models/BIGBRAIN-LICENSE.txt",
    "THIRD_PARTY_NOTICES.md",
  ];

  for (const file of files) {
    const info = await stat(new URL(file, root));
    assert.ok(info.size > 0, `${file} should not be empty`);
  }
});

test("Windows launcher waits for a healthy server before opening the browser", async () => {
  const launcher = await source("START_BRAINSTUDY.bat");
  const readinessCheck = launcher.indexOf("Invoke-WebRequest");
  const browserOpen = launcher.lastIndexOf('start "" "http://127.0.0.1:5173"');

  assert.ok(readinessCheck >= 0);
  assert.ok(browserOpen > readinessCheck);
  assert.match(launcher, /npm ci/);
  assert.match(launcher, /--strictPort/);
});
