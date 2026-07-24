import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const root = new URL("../", import.meta.url);

globalThis.ProgressEvent ??= class ProgressEvent {};

async function loadModel(path) {
  const bytes = await readFile(new URL(path, root));
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );
  return new GLTFLoader().parseAsync(buffer, "");
}

test("atlas cortex generates valid normals before using a lit material", async () => {
  const viewer = await readFile(new URL("app/brain-viewer.tsx", root), "utf8");
  assert.match(viewer, /getAttribute\("normal"\)/);
  assert.match(viewer, /computeVertexNormals\(\)/);

  for (const side of ["left", "right"]) {
    const gltf = await loadModel(`public/models/bigbrain-${side}.glb`);
    const meshes = [];
    gltf.scene.traverse((child) => {
      if (child.isMesh) meshes.push(child);
    });

    assert.ok(meshes.length > 0, `${side} cortex should contain a mesh`);

    for (const mesh of meshes) {
      if (!mesh.geometry.getAttribute("normal")) {
        mesh.geometry.computeVertexNormals();
      }

      const positions = mesh.geometry.getAttribute("position");
      const normals = mesh.geometry.getAttribute("normal");
      assert.ok(normals, `${side} cortex should have generated normals`);
      assert.equal(normals.count, positions.count);

      for (let index = 0; index < normals.count; index += 4096) {
        const length = Math.hypot(
          normals.getX(index),
          normals.getY(index),
          normals.getZ(index),
        );
        assert.ok(
          length > 0.98 && length < 1.02,
          `${side} cortex normal ${index} should be unit length`,
        );
      }
    }
  }
});
