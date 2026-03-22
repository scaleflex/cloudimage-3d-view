import React, { useRef, useState } from 'react';
import { CI3DViewer } from '../../src/react';
import type { CI3DViewerRef } from '../../src/react/types';

export function App() {
  const viewerRef = useRef<CI3DViewerRef>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <div>
      <h1>React Demo — @cloudimage/3d-view</h1>

      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={() => {
          setAutoRotate(!autoRotate);
          viewerRef.current?.update({ autoRotate: !autoRotate });
        }}>
          Toggle Auto-Rotate ({autoRotate ? 'ON' : 'OFF'})
        </button>

        <button onClick={() => {
          const next = theme === 'light' ? 'dark' : 'light';
          setTheme(next);
          viewerRef.current?.update({ theme: next });
        }}>
          Theme: {theme}
        </button>

        <button onClick={() => viewerRef.current?.resetCamera()}>
          Reset Camera
        </button>

        <button onClick={() => viewerRef.current?.downloadScreenshot('screenshot.png')}>
          Screenshot
        </button>
      </div>

      <CI3DViewer
        ref={viewerRef}
        src="https://fbmjmuoeb.filerobot.com/3D%20Models/colored.stl?vh=0975df&func=proxy"
        autoRotate={autoRotate}
        shadows
        theme={theme}
        alt="React demo model"
        onLoad={() => console.log('Model loaded!')}
        style={{ width: '100%', aspectRatio: '16/9', borderRadius: 12 }}
      />

      <h2 style={{ marginTop: 32 }}>Ref API</h2>
      <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, fontSize: 14 }}>
{`const ref = useRef<CI3DViewerRef>(null);

// Available methods:
ref.current?.loadModel('new-model.glb')
ref.current?.resetCamera()
ref.current?.screenshot()
ref.current?.downloadScreenshot()
ref.current?.playAnimation()
ref.current?.pauseAnimation()
ref.current?.stopAnimation()
ref.current?.getAnimations()
ref.current?.enterFullscreen()
ref.current?.update({ shadows: false })
ref.current?.getThreeObjects()
ref.current?.destroy()`}
      </pre>
    </div>
  );
}
