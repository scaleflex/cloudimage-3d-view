import {
  BufferGeometry,
  BufferAttribute,
  Mesh,
  MeshStandardMaterial,
  Group,
  Matrix4,
  Color,
  DoubleSide,
} from 'three';
import type { FormatLoader, LoadResult, LoaderOptions } from '../core/types';
import type { FlatMesh } from 'web-ifc';

// The wasm binary and the JS glue from the installed web-ifc must be the same release, so this
// version has to stay in sync with the `web-ifc` peer dependency range in package.json.
const DEFAULT_WASM_PATH = 'https://unpkg.com/web-ifc@0.0.75/';

/**
 * web-ifc appends the wasm path to the directory of the running script unless told the path is
 * absolute. Without the flag a full URL or a root-relative path is concatenated onto the bundle
 * location (e.g. `/assets/https://unpkg.com/web-ifc@0.0.75/web-ifc.wasm`) and the request 404s.
 * Any scheme counts as absolute (http:, file:, blob:, chrome-extension:), as do protocol-relative
 * (`//host/`) and root-relative (`/path/`) paths.
 */
const isAbsoluteWasmPath = (path: string): boolean =>
  /^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith('//') || path.startsWith('/');

export class IFCFormatLoader implements FormatLoader {
  extensions = ['.ifc'];

  async load(
    url: string,
    options: LoaderOptions,
    onProgress?: (progress: number) => void,
  ): Promise<LoadResult> {
    const { IfcAPI } = await import(/* webpackIgnore: true */ 'web-ifc');

    const ifcApi = new IfcAPI();
    const wasmPath = options.ifcWasmPath || DEFAULT_WASM_PATH;
    ifcApi.SetWasmPath(wasmPath, isAbsoluteWasmPath(wasmPath));
    await ifcApi.Init();

    // Fetch the IFC file as ArrayBuffer
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch IFC file: ${response.status} ${response.statusText}`);
    }

    const buffer = await this.readResponse(response, onProgress);
    const modelID = ifcApi.OpenModel(buffer);

    try {
      const group = new Group();

      ifcApi.StreamAllMeshes(modelID, (mesh: FlatMesh) => {
        const numGeometries = mesh.geometries.size();

        for (let i = 0; i < numGeometries; i++) {
          const placedGeometry = mesh.geometries.get(i);
          const ifcGeometry = ifcApi.GetGeometry(modelID, placedGeometry.geometryExpressID);

          const verts = ifcApi.GetVertexArray(
            ifcGeometry.GetVertexData(),
            ifcGeometry.GetVertexDataSize(),
          );
          const indices = ifcApi.GetIndexArray(
            ifcGeometry.GetIndexData(),
            ifcGeometry.GetIndexDataSize(),
          );

          ifcGeometry.delete();

          // Interleaved: 6 floats per vertex (px, py, pz, nx, ny, nz)
          if (verts.length === 0 || verts.length % 6 !== 0) continue;

          const vertexCount = verts.length / 6;
          const positions = new Float32Array(vertexCount * 3);
          const normals = new Float32Array(vertexCount * 3);

          for (let v = 0; v < vertexCount; v++) {
            const src = v * 6;
            const dst = v * 3;
            positions[dst] = verts[src];
            positions[dst + 1] = verts[src + 1];
            positions[dst + 2] = verts[src + 2];
            normals[dst] = verts[src + 3];
            normals[dst + 1] = verts[src + 4];
            normals[dst + 2] = verts[src + 5];
          }

          const geometry = new BufferGeometry();
          geometry.setAttribute('position', new BufferAttribute(positions, 3));
          geometry.setAttribute('normal', new BufferAttribute(normals, 3));
          geometry.setIndex(new BufferAttribute(indices, 1));

          // Extract color from placed geometry
          const color = placedGeometry.color;
          const a = color.w;

          const material = new MeshStandardMaterial({
            color: new Color(color.x, color.y, color.z),
            roughness: 0.6,
            metalness: 0.1,
            side: DoubleSide,
            transparent: a < 1,
            opacity: a,
          });

          const child = new Mesh(geometry, material);

          // Apply the 4x4 placement transform
          const matrix = new Matrix4();
          matrix.fromArray(placedGeometry.flatTransformation);
          child.applyMatrix4(matrix);

          group.add(child);
        }

      });

      return { model: group, animations: [] };
    } finally {
      ifcApi.CloseModel(modelID);
    }
  }

  private async readResponse(
    response: Response,
    onProgress?: (progress: number) => void,
  ): Promise<Uint8Array> {
    const total = Number(response.headers.get('content-length') || 0);

    // Only acquire a reader when we will actually stream; getReader() locks the
    // body and would cause response.arrayBuffer() to throw in the fallback path.
    if (total > 0 && onProgress && response.body) {
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let loaded = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.byteLength;
        onProgress(Math.min(loaded / total, 1));
      }
      const merged = new Uint8Array(loaded);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return merged;
    }

    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }
}
