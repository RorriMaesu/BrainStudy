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
    asset: { version: "2.0", generator: "BrainStudy BodyParts3D GLB Converter" },
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
  fileBuffer.writeUInt32LE(0x004E4942, fileOffset); fileOffset += 4; // 'BIN\0'
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

// Binary STL Parser with vertex indexing & welding
function parseSTLAndIndex(stlBuffer, transformFn) {
  const numTris = stlBuffer.readUInt32LE(80);
  const vertexMap = new Map();
  const positions = [];
  const indices = [];

  for (let i = 0; i < numTris; i++) {
    const offset = 84 + i * 50;
    for (let v = 0; v < 3; v++) {
      const vx = stlBuffer.readFloatLE(offset + 12 + v * 12);
      const vy = stlBuffer.readFloatLE(offset + 16 + v * 12);
      const vz = stlBuffer.readFloatLE(offset + 20 + v * 12);

      const [tx, ty, tz] = transformFn(vx, vy, vz);

      // Quantize coordinates to weld identical vertices
      const key = `${tx.toFixed(4)},${ty.toFixed(4)},${tz.toFixed(4)}`;
      let index = vertexMap.get(key);
      if (index === undefined) {
        index = positions.length / 3;
        vertexMap.set(key, index);
        positions.push(tx, ty, tz);
      }
      indices.push(index);
    }
  }

  const normals = computeVertexNormals(positions, indices);
  return { positions, normals, indices };
}

const BODYPARTS3D_MODELS = {
  cortex: { fma: "FMA61822", name: "Cortex" },
  cerebellum: { fma: "FMA67944", name: "Cerebellum" },
  midbrain: { fma: "FMA61993nsn", name: "Midbrain" },
  pons: { fma: "FMA67943", name: "Pons" },
  medulla: { fma: "FMA62004", name: "Medulla" }
};

const BASE_URL = "https://raw.githubusercontent.com/Kevin-Mattheus-Moerman/BodyParts3D/main/assets/BodyParts3D_data/stl/";

// Global normalization offset and scaling
// BodyParts3D center: X=0.0, Y=-90.85, Z=1551.1 mm
const OFFSET_Y = -90.85;
const OFFSET_Z = 1551.1;
const SCALE = 0.01;

function transformBodyParts3DCoordinates(x, y, z) {
  const tx = x * SCALE;
  const ty = (y - OFFSET_Y) * SCALE;
  const tz = (z - OFFSET_Z) * SCALE;
  return [tx, ty, tz];
}

async function main() {
  console.log("Downloading authentic BodyParts3D MRI datasets...");
  
  for (const [key, item] of Object.entries(BODYPARTS3D_MODELS)) {
    const url = `${BASE_URL}${item.fma}.stl`;
    console.log(`Fetching ${item.name} (${item.fma}.stl)...`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${item.fma}.stl: ${res.statusText}`);
    
    const arrayBuf = await res.arrayBuffer();
    const stlBuf = Buffer.from(arrayBuf);
    
    const meshData = parseSTLAndIndex(stlBuf, transformBodyParts3DCoordinates);
    const glbBuf = encodeGeometryToGLB(meshData.positions, meshData.normals, meshData.indices, item.name);
    
    const outPath = path.join("public", "models", `${key}.glb`);
    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(outPath, glbBuf);
    console.log(`Saved ${item.name} -> ${outPath} (${meshData.positions.length / 3} verts, ${meshData.indices.length / 3} tris, ${glbBuf.length} bytes)`);
  }

  console.log("All 5 real BodyParts3D GLB models downloaded and built successfully!");
}

main().catch(console.error);
