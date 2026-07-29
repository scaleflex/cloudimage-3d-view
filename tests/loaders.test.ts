import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectFormat, getLoader } from '../src/loaders/loader-registry';

// Mock the Three.js addon loaders
vi.mock('three/addons/loaders/GLTFLoader.js', () => ({
  GLTFLoader: vi.fn().mockImplementation(() => ({
    load: vi.fn((url, onLoad, _onProgress, _onError) => {
      onLoad({ scene: { isGroup: true }, animations: [{ name: 'Walk' }] });
    }),
    setDRACOLoader: vi.fn(),
  })),
}));

vi.mock('three/addons/loaders/DRACOLoader.js', () => ({
  DRACOLoader: vi.fn().mockImplementation(() => ({
    setDecoderPath: vi.fn(),
  })),
}));

vi.mock('three/addons/loaders/OBJLoader.js', () => ({
  OBJLoader: vi.fn().mockImplementation(() => ({
    load: vi.fn((url, onLoad) => {
      const group = {
        isGroup: true,
        traverse: vi.fn((cb: any) => cb({ isMesh: false })),
      };
      onLoad(group);
    }),
    setMaterials: vi.fn(),
  })),
}));

vi.mock('three/addons/loaders/MTLLoader.js', () => ({
  MTLLoader: vi.fn().mockImplementation(() => ({
    load: vi.fn((url, onLoad) => {
      onLoad({ preload: vi.fn() });
    }),
  })),
}));

vi.mock('three/addons/loaders/STLLoader.js', () => ({
  STLLoader: vi.fn().mockImplementation(() => ({
    load: vi.fn(async (url, onLoad) => {
      const { BufferGeometry, Float32BufferAttribute } = await import('three');
      const geom = new BufferGeometry();
      // Provide position data so mergeVertices can operate
      geom.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3));
      onLoad(geom);
    }),
  })),
}));

vi.mock('web-ifc', () => {
  const mockVertexData = new Float32Array([
    // vertex 0: pos(0,0,0) normal(0,0,1)
    0, 0, 0, 0, 0, 1,
    // vertex 1: pos(1,0,0) normal(0,0,1)
    1, 0, 0, 0, 0, 1,
    // vertex 2: pos(0,1,0) normal(0,0,1)
    0, 1, 0, 0, 0, 1,
  ]);
  const mockIndexData = new Uint32Array([0, 1, 2]);
  const mockTransform = new Array(16).fill(0);
  // Identity matrix
  mockTransform[0] = 1; mockTransform[5] = 1; mockTransform[10] = 1; mockTransform[15] = 1;

  return {
    IfcAPI: vi.fn().mockImplementation(() => ({
      SetWasmPath: vi.fn(),
      Init: vi.fn().mockResolvedValue(undefined),
      OpenModel: vi.fn().mockReturnValue(0),
      StreamAllMeshes: vi.fn((_modelID: number, cb: (mesh: any) => void) => {
        cb({
          geometries: {
            size: () => 1,
            get: (_i: number) => ({
              geometryExpressID: 1,
              color: { x: 0.8, y: 0.2, z: 0.2, w: 1.0 },
              flatTransformation: mockTransform,
            }),
          },
          delete: vi.fn(),
        });
      }),
      GetGeometry: vi.fn().mockReturnValue({
        GetVertexData: vi.fn().mockReturnValue(0),
        GetVertexDataSize: vi.fn().mockReturnValue(mockVertexData.length),
        GetIndexData: vi.fn().mockReturnValue(0),
        GetIndexDataSize: vi.fn().mockReturnValue(mockIndexData.length),
        delete: vi.fn(),
      }),
      GetVertexArray: vi.fn().mockReturnValue(mockVertexData),
      GetIndexArray: vi.fn().mockReturnValue(mockIndexData),
      CloseModel: vi.fn(),
    })),
  };
});

vi.mock('three/addons/loaders/FBXLoader.js', () => ({
  FBXLoader: vi.fn().mockImplementation(() => ({
    load: vi.fn(async (url, onLoad) => {
      const { Group } = await import('three');
      const group = new Group();
      group.animations = [{ name: 'Idle' } as unknown as import('three').AnimationClip];
      onLoad(group);
    }),
  })),
}));

describe('detectFormat', () => {
  it('detects .glb extension', () => {
    expect(detectFormat('model.glb')).toBe('.glb');
  });

  it('detects .gltf extension', () => {
    expect(detectFormat('path/to/model.gltf')).toBe('.gltf');
  });

  it('detects .obj extension', () => {
    expect(detectFormat('model.obj')).toBe('.obj');
  });

  it('strips query string', () => {
    expect(detectFormat('model.glb?v=123')).toBe('.glb');
  });

  it('strips hash fragment', () => {
    expect(detectFormat('model.glb#section')).toBe('.glb');
  });

  it('handles URL with both query and hash', () => {
    expect(detectFormat('https://example.com/model.gltf?v=1#top')).toBe('.gltf');
  });

  it('returns empty string for no extension', () => {
    expect(detectFormat('https://cdn.example.com/models/12345')).toBe('');
  });

  it('detects .stl extension', () => {
    expect(detectFormat('part.stl')).toBe('.stl');
  });

  it('detects .fbx extension', () => {
    expect(detectFormat('character.fbx')).toBe('.fbx');
  });

  it('detects .ifc extension', () => {
    expect(detectFormat('building.ifc')).toBe('.ifc');
  });

  it('is case-insensitive', () => {
    expect(detectFormat('model.GLB')).toBe('.glb');
  });
});

describe('getLoader', () => {
  it('returns GLTF loader for .glb', async () => {
    const loader = await getLoader('model.glb');
    expect(loader).toBeTruthy();
    expect(loader!.extensions).toContain('.glb');
  });

  it('returns GLTF loader for .gltf', async () => {
    const loader = await getLoader('model.gltf');
    expect(loader).toBeTruthy();
    expect(loader!.extensions).toContain('.gltf');
  });

  it('returns OBJ loader for .obj', async () => {
    const loader = await getLoader('model.obj');
    expect(loader).toBeTruthy();
    expect(loader!.extensions).toContain('.obj');
  });

  it('returns default GLTF loader for unknown extension', async () => {
    const loader = await getLoader('https://cdn.com/model');
    expect(loader).toBeTruthy();
    expect(loader!.extensions).toContain('.glb');
  });

  it('returns STL loader for .stl', async () => {
    const loader = await getLoader('part.stl');
    expect(loader).toBeTruthy();
    expect(loader!.extensions).toContain('.stl');
  });

  it('returns FBX loader for .fbx', async () => {
    const loader = await getLoader('character.fbx');
    expect(loader).toBeTruthy();
    expect(loader!.extensions).toContain('.fbx');
  });

  it('returns IFC loader for .ifc', async () => {
    const loader = await getLoader('building.ifc');
    expect(loader).toBeTruthy();
    expect(loader!.extensions).toContain('.ifc');
  });

  it('returns null for unsupported extension', async () => {
    const loader = await getLoader('model.dwg');
    expect(loader).toBeNull();
  });
});

describe('GLTFFormatLoader', () => {
  it('loads a GLB file and returns model + animations', async () => {
    const loader = (await getLoader('model.glb'))!;
    const result = await loader.load('model.glb', { draco: true });

    expect(result.model).toBeTruthy();
    expect(result.animations).toHaveLength(1);
    expect(result.animations[0].name).toBe('Walk');
  });

  it('configures DRACOLoader when draco enabled', async () => {
    const { DRACOLoader } = await import('three/addons/loaders/DRACOLoader.js');
    const loader = (await getLoader('model.glb'))!;
    await loader.load('model.glb', { draco: true });

    expect(DRACOLoader).toHaveBeenCalled();
  });
});

describe('OBJFormatLoader', () => {
  it('loads an OBJ file', async () => {
    const loader = (await getLoader('model.obj'))!;
    const result = await loader.load('model.obj', {});

    expect(result.model).toBeTruthy();
    expect(result.animations).toHaveLength(0);
  });
});

describe('STLFormatLoader', () => {
  it('loads an STL file and wraps geometry in a Group', async () => {
    const loader = (await getLoader('part.stl'))!;
    const result = await loader.load('part.stl', {});

    expect(result.model).toBeTruthy();
    expect(result.model.isGroup).toBe(true);
    expect(result.animations).toHaveLength(0);
  });
});

describe('FBXFormatLoader', () => {
  it('loads an FBX file and returns model + animations', async () => {
    const loader = (await getLoader('character.fbx'))!;
    const result = await loader.load('character.fbx', {});

    expect(result.model).toBeTruthy();
    expect(result.animations).toHaveLength(1);
    expect(result.animations[0].name).toBe('Idle');
  });
});

describe('IFCFormatLoader', () => {
  const mockArrayBuffer = new ArrayBuffer(8);
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      body: null,
      arrayBuffer: () => Promise.resolve(mockArrayBuffer),
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('loads an IFC file and returns a Group with no animations', async () => {
    const loader = (await getLoader('building.ifc'))!;
    const result = await loader.load('building.ifc', {});

    expect(result.model).toBeTruthy();
    expect(result.model.isGroup).toBe(true);
    expect(result.model.children.length).toBeGreaterThan(0);
    expect(result.animations).toHaveLength(0);
  });

  // web-ifc concatenates the wasm path onto the script directory unless the second argument marks
  // the path as absolute, so an absolute path without that flag makes the .wasm request 404.
  it.each([
    ['https://unpkg.com/web-ifc@0.0.75/', true],
    ['//cdn.example.com/web-ifc/', true],
    ['/web-ifc/', true],
    ['file:///opt/wasm/', true],
    ['blob:https://example.com/2f1b-4c3a/', true],
    ['chrome-extension://abcdefghijklmnop/wasm/', true],
    ['web-ifc/', false],
    ['./web-ifc/', false],
    ['../wasm/', false],
  ])('marks the wasm path %s as absolute=%s', async (ifcWasmPath, absolute) => {
    const { IfcAPI } = await import('web-ifc');
    const mockedCtor = vi.mocked(IfcAPI);
    const callsBefore = mockedCtor.mock.results.length;

    const loader = (await getLoader('building.ifc'))!;
    await loader.load('building.ifc', { ifcWasmPath });

    const instance = mockedCtor.mock.results[callsBefore].value;
    expect(instance.SetWasmPath).toHaveBeenCalledWith(ifcWasmPath, absolute);
  });

  it.each([[undefined], ['']])('falls back to the default wasm path for %o', async (ifcWasmPath) => {
    const { IfcAPI } = await import('web-ifc');
    const mockedCtor = vi.mocked(IfcAPI);
    const callsBefore = mockedCtor.mock.results.length;

    const loader = (await getLoader('building.ifc'))!;
    await loader.load('building.ifc', { ifcWasmPath });

    const instance = mockedCtor.mock.results[callsBefore].value;
    expect(instance.SetWasmPath).toHaveBeenCalledWith('https://unpkg.com/web-ifc@0.0.75/', true);
  });

  it('defaults to the unpkg path flagged as absolute', async () => {
    const { IfcAPI } = await import('web-ifc');
    const mockedCtor = vi.mocked(IfcAPI);
    const callsBefore = mockedCtor.mock.results.length;

    const loader = (await getLoader('building.ifc'))!;
    await loader.load('building.ifc', {});

    const instance = mockedCtor.mock.results[callsBefore].value;
    expect(instance.SetWasmPath).toHaveBeenCalledWith('https://unpkg.com/web-ifc@0.0.75/', true);
  });

  it('calls CloseModel to free WASM memory', async () => {
    const { IfcAPI } = await import('web-ifc');
    const mockedCtor = vi.mocked(IfcAPI);
    const callsBefore = mockedCtor.mock.results.length;

    const loader = (await getLoader('building.ifc'))!;
    await loader.load('building.ifc', {});

    const instance = mockedCtor.mock.results[callsBefore].value;
    expect(instance.CloseModel).toHaveBeenCalledWith(0);
  });

  it('calls delete() on geometry objects', async () => {
    const { IfcAPI } = await import('web-ifc');
    const mockedCtor = vi.mocked(IfcAPI);
    const callsBefore = mockedCtor.mock.results.length;

    const loader = (await getLoader('building.ifc'))!;
    await loader.load('building.ifc', {});

    const instance = mockedCtor.mock.results[callsBefore].value;
    const geom = instance.GetGeometry.mock.results[0].value;
    expect(geom.delete).toHaveBeenCalled();
  });
});
