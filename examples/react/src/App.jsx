import React, { useRef } from 'react';
import { CI3DViewer } from '@cloudimage/3d-view/react';

export function App() {
  const viewerRef = useRef(null);

  return (
    <div style={{ padding: 24 }}>
      <h1>React Example</h1>

      <CI3DViewer
        ref={viewerRef}
        src="https://fbmjmuoeb.filerobot.com/3D%20Models/colored.stl?vh=0975df&func=proxy"
        autoRotate
        shadows
        theme="light"
        alt="3D model"
        style={{ width: '100%', aspectRatio: '16/9' }}
        onLoad={() => console.log('Loaded!')}
      />

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button onClick={() => viewerRef.current?.resetCamera()}>
          Reset Camera
        </button>
        <button onClick={() => viewerRef.current?.downloadScreenshot()}>
          Screenshot
        </button>
      </div>
    </div>
  );
}
