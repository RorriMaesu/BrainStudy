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
    asset: { version: "2.0", generator: "BrainStudy Anatomical Generator" },
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

// Generate Parametric Sphere Mesh (u = 0..PI, v = 0..2PI)
function generateSphereMesh(uSegments, vSegments, transformFn) {
  const positions = [];
  const grid = [];

  for (let uIdx = 0; uIdx <= uSegments; uIdx++) {
    const uRow = [];
    const u = (uIdx / uSegments) * Math.PI; // 0 (top/Superior +Z) to PI (bottom/Inferior -Z)
    for (let vIdx = 0; vIdx <= vSegments; vIdx++) {
      const v = (vIdx / vSegments) * Math.PI * 2; // 0 to 2PI around Z-axis

      // Unit sphere where Z is vertical (Superior/Inferior), X is Left/Right, Y is Anterior/Posterior
      const sx = Math.sin(u) * Math.cos(v); // Left / Right
      const sy = Math.sin(u) * Math.sin(v); // Anterior / Posterior
      const sz = Math.cos(u);               // Superior / Inferior

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

// Generate Parametric Vertical Cylinder Mesh along Z-axis (height along Z)
function generateZAxisCylinderMesh(radialSegments, heightSegments, transformFn) {
  const positions = [];
  const grid = [];

  for (let hIdx = 0; hIdx <= heightSegments; hIdx++) {
    const hRow = [];
    const zNorm = (hIdx / heightSegments) - 0.5; // -0.5 (Inferior -Z) to +0.5 (Superior +Z)
    for (let rIdx = 0; rIdx <= radialSegments; rIdx++) {
      const theta = (rIdx / radialSegments) * Math.PI * 2; // 0 to 2PI around Z-axis

      const cx = Math.cos(theta); // Bilateral X
      const cy = Math.sin(theta); // Anteroposterior Y
      const cz = zNorm;           // Superoinferior Z

      const [px, py, pz] = transformFn(cx, cy, cz, zNorm, theta);
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

// 1. Cerebellum Mesh (X = Bilateral, Y = Anteroposterior, Z = Superoinferior)
function createCerebellum() {
  return generateSphereMesh(160, 120, (sx, sy, sz) => {
    let rx = sx * 0.38; // Bilateral width
    let ry = sy * 0.28; // Anteroposterior depth
    let rz = sz * 0.24; // Superoinferior height

    // Anterior notch facing +Y (wrapping around brainstem/4th ventricle)
    if (sy > 0) {
      const notchIndent = Math.exp(-Math.pow(sx * 4.5, 2)) * 0.06;
      ry -= notchIndent;
    }

    // Transverse folial sulci micro-geometry running along X-axis
    const folialFreq = 48.0;
    const folialDepth = 0.012 * Math.sin(sz * folialFreq) * Math.cos(sy * 10.0);
    
    // Inferior flattening & cerebellar tonsil rounding (-Z)
    if (sz < 0) {
      rz *= 0.88;
      // Tonsillar swellings
      if (Math.abs(sx) > 0.08 && Math.abs(sx) < 0.22 && sy < 0) {
        rz -= Math.exp(-Math.pow((Math.abs(sx) - 0.15) * 12.0, 2)) * 0.025;
      }
    }

    const px = rx * (1 + folialDepth);
    const py = ry * (1 + folialDepth);
    const pz = rz + folialDepth * 0.4;

    return [px, py, pz];
  });
}

// 2. Midbrain Mesh (Rostral brainstem, closed smooth mesh)
function createMidbrain() {
  return generateSphereMesh(96, 64, (sx, sy, sz) => {
    let rx = sx * (0.13 + sz * 0.02);
    let ry = sy * (0.13 + sz * 0.02);
    let pz = sz * 0.09;

    // Anterior (+Y): Cerebral Peduncles (Crus Cerebri) V-shaped flare
    if (sy > 0) {
      const peduncleFlare = Math.sin(Math.abs(sx) * 14.0) * 0.025;
      ry += peduncleFlare;
      // Interpeduncular fossa midline indent
      if (Math.abs(sx) < 0.035) {
        ry -= 0.012;
      }
    } else {
      // Posterior (-Y): Tectal Plate (Colliculi)
      const colliculusZ = Math.sin(pz * 35.0);
      const colliculusX = Math.cos(sx * 25.0);
      if (colliculusZ > 0 && Math.abs(sx) < 0.09) {
        ry -= 0.018 * colliculusZ * colliculusX;
      }
    }
    return [rx, ry, pz];
  });
}

// 3. Pons Mesh (Vertical cylinder along Z-axis with prominent anterior bulge)
function createPons() {
  return generateSphereMesh(96, 64, (sx, sy, sz) => {
    let rx = sx * 0.18; // Bilateral width with MCP flare
    let ry = sy * 0.14; // Anteroposterior depth
    let rz = sz * 0.14; // Superoinferior height

    // Prominent anterior pontine bulge (+Y)
    if (sy > 0) {
      ry *= 1.35;
      // Basilar groove down anterior midline (x=0, y>0)
      const basilar = Math.exp(-Math.pow(sx * 22.0, 2)) * 0.022;
      ry -= basilar;
    } else {
      // Posterior flattening facing 4th ventricle (-Y)
      ry *= 0.75;
    }

    // Transverse pontine fiber ridges running horizontally along X-axis
    const transverse = Math.sin(sz * 50.0) * 0.005;
    ry += transverse;

    return [rx, ry, rz];
  });
}

// 4. Medulla Oblongata Mesh (High-detail tapered stalk tapering caudally into spinal cord)
function createMedulla() {
  return generateSphereMesh(120, 80, (sx, sy, sz, u, v) => {
    // Treat 'u' (0 to PI) as a linear progression from top to bottom
    const t = u / Math.PI; // 0 at superior (top), 1 at inferior (bottom)
    
    // Linear mapping for the z-axis to create a cylindrical stalk, NOT cos(u)
    let pz = (1.0 - 2.0 * t) * 0.14; // total height 0.28 (from 0.14 to -0.14)
    
    // Cap function to close the ends (creates a rounded top and bottom)
    let cap = 1.0;
    const topCapSize = 0.10; 
    const bottomCapSize = 0.12;
    if (t < topCapSize) {
      cap = Math.sin((t / topCapSize) * (Math.PI / 2));
    } else if (t > 1.0 - bottomCapSize) {
      cap = Math.sin(((1.0 - t) / bottomCapSize) * (Math.PI / 2));
    }
    
    // Tapering base radii from superior pontomedullary junction to caudal spinal cord
    const baseRx = 0.082 - t * 0.038;
    const baseRy = 0.076 - t * 0.034;
    
    // Create the base cylindrical shape
    let px = Math.cos(v) * baseRx * cap;
    let py = Math.sin(v) * baseRy * cap;
    
    // Subtle posterior caudal inclination matching natural anatomical clivus/foramen magnum axis
    py -= t * 0.015;
    
    // Apply anatomical features
    if (py > 0) { // Anterior side
      const xDist = Math.abs(px);
      
      // Anterior Median Fissure (midline groove at x=0)
      const fissure = Math.exp(-Math.pow(xDist * 38.0, 2)) * 0.012 * (1 - t * 0.4) * cap;
      py -= fissure;
      
      // Bilateral Anterior Pyramids (longitudinal columns flanking fissure)
      const pyramid = Math.exp(-Math.pow((xDist - 0.028) * 32.0, 2)) * 0.014 * (1 - t * 0.3) * cap;
      py += pyramid;
      
      // Anterolateral Olives (inferior olivary swellings)
      if (t > 0.1 && t < 0.6 && xDist > 0.035) {
        const zFactor = Math.sin(((t - 0.1) / 0.5) * Math.PI); // peak at t=0.35
        if (zFactor > 0) {
          const olive = Math.exp(-Math.pow((xDist - 0.055) * 42.0, 2)) * zFactor * 0.014 * cap;
          if (olive > 0) {
            px += (px > 0 ? 1 : -1) * olive * 0.6; // push outward laterally
            py += olive * 0.8;                     // push outward anteriorly
          }
        }
      }
    } else { // Posterior side
      const xDist = Math.abs(px);
      
      // Posterior median sulcus
      const postSulcus = Math.exp(-Math.pow(xDist * 45.0, 2)) * 0.008 * cap;
      py += postSulcus; // indent towards anterior (+Y)
      
      // Gracile and Cuneate tubercles
      if (t < 0.5) {
        const zFactor = (0.5 - t) / 0.5; // 1 at top, 0 at middle
        const gracile = Math.exp(-Math.pow((xDist - 0.015) * 55.0, 2)) * 0.006 * zFactor * cap;
        const cuneate = Math.exp(-Math.pow((xDist - 0.035) * 55.0, 2)) * 0.005 * zFactor * cap;
        py -= (gracile + cuneate); // bulge posteriorly (-Y)
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
