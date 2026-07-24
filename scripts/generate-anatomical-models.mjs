import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Pure JavaScript GLB Binary Exporter & Parametric Geometry Generator
function encodeGeometryToGLB(positions, normals, indices, meshName = "Mesh") {
  const numVertices = positions.length / 3;
  const posArray = new Float32Array(positions);
  const normArray = new Float32Array(normals);

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < numVertices; i++) {
    const x = posArray[i * 3];
    const y = posArray[i * 3 + 1];
    const z = posArray[i * 3 + 2];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }

  let indexArray;
  let indexComponentType = 5123; // UNSIGNED_SHORT
  if (numVertices > 65535) {
    indexArray = new Uint32Array(indices);
    indexComponentType = 5125; // UNSIGNED_INT
  } else {
    indexArray = new Uint16Array(indices);
  }

  const posByteLength = posArray.byteLength;
  const normByteLength = normArray.byteLength;
  const indexByteLength = indexArray.byteLength;

  const posPaddedLength = Math.ceil(posByteLength / 4) * 4;
  const normPaddedLength = Math.ceil(normByteLength / 4) * 4;
  const indexPaddedLength = Math.ceil(indexByteLength / 4) * 4;

  const totalBinLength = posPaddedLength + normPaddedLength + indexPaddedLength;
  const binBuffer = Buffer.alloc(totalBinLength);

  let offset = 0;
  Buffer.from(posArray.buffer).copy(binBuffer, offset);
  offset += posPaddedLength;

  const normOffset = offset;
  Buffer.from(normArray.buffer).copy(binBuffer, offset);
  offset += normPaddedLength;

  const indexOffset = offset;
  Buffer.from(indexArray.buffer).copy(binBuffer, offset);

  const gltfJSON = {
    asset: { version: "2.0", generator: "BrainStudy Pure Anatomy Generator" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: meshName }],
    meshes: [{
      name: meshName,
      primitives: [{
        attributes: { POSITION: 0, NORMAL: 1 },
        indices: 2
      }]
    }],
    accessors: [
      {
        bufferView: 0,
        byteOffset: 0,
        componentType: 5126,
        count: numVertices,
        type: "VEC3",
        min: [minX, minY, minZ],
        max: [maxX, maxY, maxZ]
      },
      {
        bufferView: 1,
        byteOffset: 0,
        componentType: 5126,
        count: numVertices,
        type: "VEC3"
      },
      {
        bufferView: 2,
        byteOffset: 0,
        componentType: indexComponentType,
        count: indexArray.length,
        type: "SCALAR"
      }
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: posByteLength, target: 34962 },
      { buffer: 0, byteOffset: normOffset, byteLength: normByteLength, target: 34962 },
      { buffer: 0, byteOffset: indexOffset, byteLength: indexByteLength, target: 34963 }
    ],
    buffers: [{ byteLength: totalBinLength }]
  };

  const jsonStr = JSON.stringify(gltfJSON);
  const jsonBuffer = Buffer.from(jsonStr, "utf8");
  const jsonPaddedLength = Math.ceil(jsonBuffer.length / 4) * 4;
  const jsonPad = Buffer.alloc(jsonPaddedLength - jsonBuffer.length, 0x20);

  const headerLength = 12;
  const jsonChunkHeaderLength = 8;
  const binChunkHeaderLength = 8;
  const totalFileLength = headerLength + jsonChunkHeaderLength + jsonPaddedLength + binChunkHeaderLength + totalBinLength;

  const fileBuffer = Buffer.alloc(totalFileLength);
  let fileOffset = 0;

  fileBuffer.writeUInt32LE(0x46546C67, fileOffset); fileOffset += 4;
  fileBuffer.writeUInt32LE(2, fileOffset); fileOffset += 4;
  fileBuffer.writeUInt32LE(totalFileLength, fileOffset); fileOffset += 4;

  fileBuffer.writeUInt32LE(jsonPaddedLength, fileOffset); fileOffset += 4;
  fileBuffer.writeUInt32LE(0x4E4F534A, fileOffset); fileOffset += 4;
  jsonBuffer.copy(fileBuffer, fileOffset); fileOffset += jsonBuffer.length;
  jsonPad.copy(fileBuffer, fileOffset); fileOffset += jsonPad.length;

  fileBuffer.writeUInt32LE(totalBinLength, fileOffset); fileOffset += 4;
  fileBuffer.writeUInt32LE(0x004E4942, fileOffset); fileOffset += 4; // 'BIN\0' in Little Endian
  binBuffer.copy(fileBuffer, fileOffset);

  return fileBuffer;
}

// Compute smooth vertex normals from triangle mesh
function computeVertexNormals(positions, indices) {
  const numVertices = positions.length / 3;
  const normals = new Float32Array(positions.length);

  for (let i = 0; i < indices.length; i += 3) {
    const i1 = indices[i];
    const i2 = indices[i + 1];
    const i3 = indices[i + 2];

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

  for (let i = 0; i < numVertices; i++) {
    const nx = normals[i * 3], ny = normals[i * 3 + 1], nz = normals[i * 3 + 2];
    const len = Math.hypot(nx, ny, nz) || 1.0;
    normals[i * 3] = nx / len;
    normals[i * 3 + 1] = ny / len;
    normals[i * 3 + 2] = nz / len;
  }

  return normals;
}

// Generate Parametric Sphere Mesh
function generateSphereMesh(uSegments, vSegments, transformFn) {
  const positions = [];
  const grid = [];

  for (let uIdx = 0; uIdx <= uSegments; uIdx++) {
    const uRow = [];
    const u = (uIdx / uSegments) * Math.PI; // 0 to PI
    for (let vIdx = 0; vIdx <= vSegments; vIdx++) {
      const v = (vIdx / vSegments) * Math.PI * 2; // 0 to 2PI

      const sx = Math.sin(u) * Math.cos(v);
      const sy = Math.cos(u);
      const sz = Math.sin(u) * Math.sin(v);

      const [px, py, pz] = transformFn(sx, sy, sz, u, v);
      uRow.push(positions.length / 3);
      positions.push(px, py, pz);
    }
    grid.push(uRow);
  }

  const indices = [];
  for (let uIdx = 0; uIdx < uSegments; uIdx++) {
    for (let vIdx = 0; vIdx < vSegments; vIdx++) {
      const a = grid[uIdx][vIdx];
      const b = grid[uIdx + 1][vIdx];
      const c = grid[uIdx + 1][vIdx + 1];
      const d = grid[uIdx][vIdx + 1];

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const normals = computeVertexNormals(positions, indices);
  return { positions, normals, indices };
}

// Generate Parametric Cylinder Mesh
function generateCylinderMesh(radialSegments, heightSegments, transformFn) {
  const positions = [];
  const grid = [];

  for (let hIdx = 0; hIdx <= heightSegments; hIdx++) {
    const hRow = [];
    const h = (hIdx / heightSegments) - 0.5; // -0.5 to 0.5
    for (let rIdx = 0; rIdx <= radialSegments; rIdx++) {
      const theta = (rIdx / radialSegments) * Math.PI * 2; // 0 to 2PI

      const cx = Math.cos(theta);
      const cy = h;
      const cz = Math.sin(theta);

      const [px, py, pz] = transformFn(cx, cy, cz, h, theta);
      hRow.push(positions.length / 3);
      positions.push(px, py, pz);
    }
    grid.push(hRow);
  }

  const indices = [];
  for (let hIdx = 0; hIdx < heightSegments; hIdx++) {
    for (let rIdx = 0; rIdx < radialSegments; rIdx++) {
      const a = grid[hIdx][rIdx];
      const b = grid[hIdx + 1][rIdx];
      const c = grid[hIdx + 1][rIdx + 1];
      const d = grid[hIdx][rIdx + 1];

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const normals = computeVertexNormals(positions, indices);
  return { positions, normals, indices };
}

// 1. Cerebellum Mesh
function createCerebellum() {
  return generateSphereMesh(160, 120, (sx, sy, sz) => {
    let rx = sx * 0.42;
    let ry = sy * 0.28;
    let rz = sz * 0.26;

    // Vermis groove at x=0
    const vermisIndent = Math.exp(-Math.pow(sx * 4.5, 2)) * 0.04;
    rz -= vermisIndent;

    // Folial folding micro-geometry
    const folialFreq = 48.0;
    const folialDepth = 0.015 * Math.sin(sy * folialFreq) * Math.cos(sz * 12.0);
    
    if (sy < 0) ry *= 0.85;

    const px = rx * (1 + folialDepth);
    const py = ry + folialDepth * 0.5;
    const pz = rz * (1 + folialDepth);

    return [px, py, pz];
  });
}

// 2. Midbrain Mesh
function createMidbrain() {
  return generateCylinderMesh(64, 32, (cx, cy, cz) => {
    let radius = cy > 0 ? 0.14 : 0.12;
    let px = cx * radius;
    let py = cy * 0.16;
    let pz = cz * radius;

    if (pz > 0) {
      const peduncle = Math.sin(Math.abs(px) * 15.0) * 0.025;
      pz += peduncle;
    } else {
      const colliculusY = Math.sin(py * 35.0);
      const colliculusX = Math.cos(px * 25.0);
      if (colliculusY > 0 && Math.abs(px) < 0.09) {
        pz -= 0.02 * colliculusY * colliculusX;
      }
    }
    return [px, py, pz];
  });
}

// 3. Pons Mesh
function createPons() {
  return generateSphereMesh(96, 64, (sx, sy, sz) => {
    let rx = sx * 0.18;
    let ry = sy * 0.14;
    let rz = sz * 0.14;

    if (sz > 0) {
      const basilar = Math.exp(-Math.pow(sx * 25.0, 2)) * 0.022;
      rz -= basilar;
    }

    const transverse = Math.sin(sy * 50.0) * 0.004;
    rz += transverse;

    return [rx, ry, rz];
  });
}

// 4. Medulla Mesh
function createMedulla() {
  return generateCylinderMesh(64, 40, (cx, cy, cz) => {
    // Tapered cylinder: top radius 0.10, bottom radius 0.065
    const radius = 0.0825 + cy * 0.035;
    let px = cx * radius;
    let py = cy * 0.28;
    let pz = cz * radius;

    if (pz > 0) {
      const fissure = Math.exp(-Math.pow(px * 35.0, 2)) * 0.012;
      pz -= fissure;

      const pyramid = Math.exp(-Math.pow((Math.abs(px) - 0.04) * 25.0, 2)) * 0.015;
      pz += pyramid;
    }

    if (Math.abs(px) > 0.045 && Math.abs(px) < 0.085 && py > -0.04 && py < 0.06) {
      const olive = Math.cos((px > 0 ? px - 0.065 : px + 0.065) * 40.0) * Math.cos(py * 25.0) * 0.014;
      if (olive > 0) {
        px += (px > 0 ? 1 : -1) * olive;
        pz += olive * 0.5;
      }
    }

    return [px, py, pz];
  });
}

async function exportGLBModel(meshData, name, filePath) {
  const glbBuffer = encodeGeometryToGLB(meshData.positions, meshData.normals, meshData.indices, name);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, glbBuffer);
  console.log(`Generated ${name} (${meshData.positions.length / 3} verts, ${meshData.indices.length / 3} tris) -> ${filePath} [${glbBuffer.length} bytes]`);
}

async function main() {
  await exportGLBModel(createCerebellum(), "Cerebellum", "public/models/cerebellum.glb");
  await exportGLBModel(createMidbrain(), "Midbrain", "public/models/midbrain.glb");
  await exportGLBModel(createPons(), "Pons", "public/models/pons.glb");
  await exportGLBModel(createMedulla(), "Medulla", "public/models/medulla.glb");
  console.log("All 4 anatomical GLB surface models generated successfully!");
}

main().catch(console.error);
