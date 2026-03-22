import { CI3DView } from '@cloudimage/3d-view';

const viewer = new CI3DView('#viewer', {
  src: 'https://fbmjmuoeb.filerobot.com/3D%20Models/colored.stl?vh=0975df&func=proxy',
  autoRotate: true,
  shadows: true,
  toneMapping: 'aces',
  fullscreenButton: true,
  screenshotButton: true,
  alt: '3D model',
});

// Example: programmatic controls
// viewer.setAutoRotate(false);
// viewer.setCameraPosition(2, 1, 3);
// viewer.resetCamera();
// viewer.screenshot();
