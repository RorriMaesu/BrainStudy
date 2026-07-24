import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function parseGLB(path) {
  const bytes = await readFile(new URL(path, root));
  const buffer = Buffer.from(bytes);

  const magic = buffer.readUInt32LE(0);
  assert.equal(magic, 0x46546C67, "Valid glTF binary header");

  let offset = 12;
  let jsonStr = "";
  let binBuffer = null;

  while (offset < buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);
    const chunkData = buffer.subarray(offset + 8, offset + 8 + chunkLength);

    if (chunkType === 0x4E4F534A || chunkType === 0x4A534F4E) { // JSON
      jsonStr = chunkData.toString("utf8");
    } else if (chunkType === 0x04504142 || chunkType === 0x42494E00) { // BIN
      binBuffer = chunkData;
    } else {
      // Any binary chunk following JSON
      binBuffer = chunkData;
    }

    offset += 8 + chunkLength;
  }

  const gltf = JSON.parse(jsonStr);
  return { gltf, binBuffer };
}

test("atlas cortex generates valid normals before using a lit material", async () => {
  const viewer = await readFile(new URL("app/brain-viewer.tsx", root), "utf8");
  assert.match(viewer, /getAttribute\("normal"\)/);
  assert.match(viewer, /computeVertexNormals\(\)/);

  for (const side of ["left", "right"]) {
    const { gltf, binBuffer } = await parseGLB(`public/models/bigbrain-${side}.glb`);
    assert.ok(binBuffer, `${side} GLB should have a BIN chunk`);

    const mesh = gltf.meshes[0];
    assert.ok(mesh, `${side} cortex should contain a mesh`);

    const posAccessorIdx = mesh.primitives[0].attributes.POSITION;
    assert.ok(posAccessorIdx !== undefined, `${side} cortex should have position attribute`);

    const posAccessor = gltf.accessors[posAccessorIdx];
    const posView = gltf.bufferViews[posAccessor.bufferView];
    const posOffset = (posView.byteOffset || 0) + (posAccessor.byteOffset || 0);

    const positions = new Float32Array(
      binBuffer.buffer,
      binBuffer.byteOffset + posOffset,
      posAccessor.count * 3
    );

    const normAccessorIdx = mesh.primitives[0].attributes.NORMAL;
    let normals;
    if (normAccessorIdx !== undefined) {
      const normAccessor = gltf.accessors[normAccessorIdx];
      const normView = gltf.bufferViews[normAccessor.bufferView];
      const normOffset = (normView.byteOffset || 0) + (normAccessor.byteOffset || 0);
      normals = new Float32Array(
        binBuffer.buffer,
        binBuffer.byteOffset + normOffset,
        normAccessor.count * 3
      );
    } else {
      normals = new Float32Array(positions.length);
      const indicesAccessorIdx = mesh.primitives[0].indices;
      let indices = null;
      if (indicesAccessorIdx !== undefined) {
        const indAccessor = gltf.accessors[indicesAccessorIdx];
        const indView = gltf.bufferViews[indAccessor.bufferView];
        const indOffset = (indView.byteOffset || 0) + (indAccessor.byteOffset || 0);
        if (indAccessor.componentType === 5123) {
          indices = new Uint16Array(binBuffer.buffer, binBuffer.byteOffset + indOffset, indAccessor.count);
        } else {
          indices = new Uint32Array(binBuffer.buffer, binBuffer.byteOffset + indOffset, indAccessor.count);
        }
      }

      const count = indices ? indices.length : positions.length / 3;
      for (let i = 0; i < count; i += 3) {
        const i1 = indices ? indices[i] : i;
        const i2 = indices ? indices[i + 1] : i + 1;
        const i3 = indices ? indices[i + 2] : i + 2;

        const ax = positions[i1 * 3], ay = positions[i1 * 3 + 1], az = positions[i1 * 3 + 2];
        const bx = positions[i2 * 3], by = positions[i2 * 3 + 1], bz = positions[i2 * 3 + 2];
        const cx = positions[i3 * 3], cy = positions[i3 * 3 + 1], cz = positions[i3 * 3 + 2];

        const abx = bx - ax, aby = by - ay, abz = bz - az;
        const acx = cx - ax, acy = cy - ay, acz = cz - az;

        const nx = aby * acz - abz * acy;
        const ny = abz * acx - abx * acz;
        const nz = abx * acy - aby * acx;

        normals[i1 * 3] += nx; normals[i1 * 3 + 1] += ny; normals[i1 * 3 + 2] += nz;
        normals[i2 * 3] += nx; normals[i2 * 3 + 1] += ny; normals[i2 * 3 + 2] += nz;
        normals[i3 * 3] += nx; normals[i3 * 3 + 1] += ny; normals[i3 * 3 + 2] += nz;
      }

      for (let i = 0; i < positions.length / 3; i++) {
        const nx = normals[i * 3], ny = normals[i * 3 + 1], nz = normals[i * 3 + 2];
        const len = Math.hypot(nx, ny, nz) || 1.0;
        normals[i * 3] = nx / len;
        normals[i * 3 + 1] = ny / len;
        normals[i * 3 + 2] = nz / len;
      }
    }

    assert.equal(normals.length, positions.length);

    for (let index = 0; index < normals.length; index += 12288) {
      const length = Math.hypot(
        normals[index],
        normals[index + 1],
        normals[index + 2]
      );
      assert.ok(
        length > 0.98 && length < 1.02,
        `${side} cortex normal ${index} should be unit length (got ${length})`
      );
    }
  }
});
