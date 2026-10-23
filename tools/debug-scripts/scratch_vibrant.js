const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlUrl = 'file:///C:/Users/luciu/Documents/dev/games/games/elpatron.html';

async function main() {
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu-sandbox',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--no-sandbox',
    '--window-size=1200,900',
    htmlUrl
  ], { stdio: 'ignore' });

  for (let i = 0; i < 30; i++) {
    try {
      await new Promise(r => setTimeout(r, 200));
      versionData = await getJson('http://127.0.0.1:9222/json');
      if (versionData && versionData.length > 0) break;
    } catch(e) {}
  }

  const target = versionData.find(t => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let idCounter = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = idCounter++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');

  const evalRes = await send('Runtime.evaluate', {
    expression: `
      (function() {
        openCockpitLandingModal('napoles');

        // Approach position
        pState.z = 620;
        pState.y = 44;
        pState.vz = -32;
        pState.vy = -1.9;
        pState.pitch = -0.015;

        // Rebuild Scene with gorgeous visuals
        const sc = scenarioConfigs[cockpitScenario];
        cp3d.scene = new THREE.Scene();

        // 1. Sky Dome with fog disabled
        const skyCanvas = document.createElement('canvas');
        skyCanvas.width = 64;
        skyCanvas.height = 256;
        const sctx = skyCanvas.getContext('2d');
        const sGrad = sctx.createLinearGradient(0, 0, 0, 256);
        sGrad.addColorStop(0, '#090d1a');     // Deep space top
        sGrad.addColorStop(0.35, '#1e1b4b');  // Indigo twilight
        sGrad.addColorStop(0.70, '#b45309');  // Warm amber
        sGrad.addColorStop(0.92, '#f59e0b');  // Sunset gold
        sGrad.addColorStop(1.0, '#fef08a');   // Horizon glow
        sctx.fillStyle = sGrad;
        sctx.fillRect(0, 0, 64, 256);

        const skyTex = new THREE.CanvasTexture(skyCanvas);
        const skyGeo = new THREE.SphereGeometry(4500, 24, 16);
        const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, depthWrite: false, fog: false });
        const skyMesh = new THREE.Mesh(skyGeo, skyMat);
        cp3d.scene.add(skyMesh);

        // Stars in upper sky
        const starGeo = new THREE.BufferGeometry();
        const starPos = [];
        for (let i = 0; i < 400; i++) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * (Math.PI * 0.42); // upper hemisphere only
          const r = 4400;
          starPos.push(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
        }
        starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
        const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.5, fog: false });
        cp3d.scene.add(new THREE.Points(starGeo, starMat));

        // Soft distance fog
        cp3d.scene.fog = new THREE.Fog(0x14281e, 600, 4200);

        // Ground with Colombian jungle green
        const groundGeo = new THREE.PlaneGeometry(9000, 9000, 1, 1);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x184224, roughness: 0.9 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        cp3d.scene.add(ground);

        // Mountain silhouettes against the glowing horizon
        for (let i = 0; i < 18; i++) {
          const angle = (i / 18) * Math.PI * 2;
          const dist = 3200 + Math.sin(i * 3) * 600;
          const mHeight = 520 + Math.abs(Math.sin(i * 5)) * 450;
          const mWidth = 980 + Math.cos(i) * 300;
          const coneGeo = new THREE.ConeGeometry(mWidth, mHeight, 6);
          const coneMat = new THREE.MeshBasicMaterial({ color: 0x0c1e14, fog: true });
          const m = new THREE.Mesh(coneGeo, coneMat);
          m.position.set(Math.cos(angle) * dist, mHeight / 2 - 20, Math.sin(angle) * dist);
          cp3d.scene.add(m);
        }

        // Lighting
        const hemiLight = new THREE.HemisphereLight(0xffedd5, 0x142618, 0.95);
        cp3d.scene.add(hemiLight);
        const dirLight = new THREE.DirectionalLight(0xfbbf24, 1.4);
        dirLight.position.set(250, 400, 500);
        cp3d.scene.add(dirLight);

        // Runway with crisp asphalt & markings
        const rwyCanvas = document.createElement('canvas');
        rwyCanvas.width = 512;
        rwyCanvas.height = 2048;
        const rc = rwyCanvas.getContext('2d');
        rc.fillStyle = '#1e293b';
        rc.fillRect(0, 0, 512, 2048);

        // White border lines
        rc.fillStyle = '#ffffff';
        rc.fillRect(16, 0, 20, 2048);
        rc.fillRect(476, 0, 20, 2048);

        // Threshold piano keys at start
        rc.fillStyle = '#fde047';
        for (let i = 0; i < 10; i++) {
          rc.fillRect(45 + i * 44, 1880, 32, 140);
        }

        // Touchdown blocks
        rc.fillStyle = '#ffffff';
        rc.fillRect(80, 1600, 80, 240);
        rc.fillRect(352, 1600, 80, 240);

        // Centerline dashes
        rc.fillStyle = '#ffffff';
        for (let y = 80; y < 1850; y += 140) {
          rc.fillRect(244, y, 24, 85);
        }

        const rwyTex = new THREE.CanvasTexture(rwyCanvas);
        const rwyMat = new THREE.MeshStandardMaterial({ map: rwyTex, roughness: 0.6 });
        const rwyMesh = new THREE.Mesh(new THREE.PlaneGeometry(38, 1200), rwyMat);
        rwyMesh.rotation.x = -Math.PI / 2;
        rwyMesh.position.set(0, 0.05, -600);
        cp3d.scene.add(rwyMesh);

        // Point Light Texture Helper for sparkling round lights
        const dotCanvas = document.createElement('canvas');
        dotCanvas.width = 32;
        dotCanvas.height = 32;
        const dctx = dotCanvas.getContext('2d');
        const dGrad = dctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        dGrad.addColorStop(0, 'rgba(255,255,255,1)');
        dGrad.addColorStop(0.3, 'rgba(255,255,255,0.9)');
        dGrad.addColorStop(0.7, 'rgba(255,255,255,0.3)');
        dGrad.addColorStop(1, 'rgba(255,255,255,0)');
        dctx.fillStyle = dGrad;
        dctx.fillRect(0, 0, 32, 32);
        const dotTex = new THREE.CanvasTexture(dotCanvas);

        // Runway Edge Lights (Points)
        const edgePos = [];
        for (let z = 0; z > -1200; z -= 30) {
          edgePos.push(-20, 0.7, z);
          edgePos.push(20, 0.7, z);
        }
        const edgeGeo = new THREE.BufferGeometry();
        edgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgePos, 3));
        const edgeMat = new THREE.PointsMaterial({ color: 0xfef08a, size: 7, map: dotTex, transparent: true, fog: false, depthWrite: false });
        cp3d.scene.add(new THREE.Points(edgeGeo, edgeMat));

        // Green Threshold Lights (Points)
        const threshPos = [];
        for (let i = 0; i < 14; i++) {
          threshPos.push(-19 + i * (38 / 13), 0.8, 0);
        }
        const threshGeo = new THREE.BufferGeometry();
        threshGeo.setAttribute('position', new THREE.Float32BufferAttribute(threshPos, 3));
        const threshMat = new THREE.PointsMaterial({ color: 0x22c55e, size: 9, map: dotTex, transparent: true, fog: false, depthWrite: false });
        cp3d.scene.add(new THREE.Points(threshGeo, threshMat));

        // PAPI Lights (Spheres with fog: false)
        cp3d.papiLights = [];
        for (let i = 0; i < 4; i++) {
          const pMesh = new THREE.Mesh(
            new THREE.SphereGeometry(2.5, 8, 8),
            new THREE.MeshBasicMaterial({ color: i < 2 ? 0xffffff : 0xef4444, fog: false })
          );
          pMesh.position.set(-27 - i * 4.5, 1.4, -150);
          cp3d.scene.add(pMesh);
          cp3d.papiLights.push(pMesh);
        }

        // Approach Strobes ("Rabbit" pulsating towards threshold)
        cp3d.strobeLights = [];
        for (let i = 1; i <= 8; i++) {
          const sMesh = new THREE.Mesh(
            new THREE.SphereGeometry(2.6, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false })
          );
          sMesh.position.set(0, 0.8, i * 45);
          cp3d.scene.add(sMesh);
          cp3d.strobeLights.push(sMesh);
        }

        // Trees along runway
        const treeGroup = new THREE.Group();
        const trunkGeo = new THREE.CylinderGeometry(0.5, 0.8, 10, 6);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
        const crownGeo = new THREE.ConeGeometry(6, 6, 6);
        const crownMat = new THREE.MeshStandardMaterial({ color: 0x166534 });

        for (let z = 150; z > -1300; z -= 35) {
          const tL = new THREE.Group();
          const trL = new THREE.Mesh(trunkGeo, trunkMat); trL.position.y = 5;
          const crL = new THREE.Mesh(crownGeo, crownMat); crL.position.y = 10;
          tL.add(trL); tL.add(crL);
          tL.position.set(-28 - Math.random() * 30, 0, z);
          treeGroup.add(tL);

          const tR = new THREE.Group();
          const trR = new THREE.Mesh(trunkGeo, trunkMat); trR.position.y = 5;
          const crR = new THREE.Mesh(crownGeo, crownMat); crR.position.y = 10;
          tR.add(trR); tR.add(crR);
          tR.position.set(28 + Math.random() * 30, 0, z);
          treeGroup.add(tR);
        }
        cp3d.scene.add(treeGroup);

        // Cartel SUVs with illuminated headlights
        const suvMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
        const suvL = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.2, 8), suvMat);
        suvL.position.set(-26, 1.1, -140); suvL.rotation.y = 0.35;
        cp3d.scene.add(suvL);

        const suvR = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.2, 8), suvMat);
        suvR.position.set(26, 1.1, -160); suvR.rotation.y = -0.35;
        cp3d.scene.add(suvR);

        // Headlight beams
        const beamMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.45, fog: false });
        const bL = new THREE.Mesh(new THREE.ConeGeometry(16, 100, 10), beamMat);
        bL.rotation.x = Math.PI / 2; bL.rotation.z = -0.3; bL.position.set(-24, 0.8, -170);
        cp3d.scene.add(bL);
        const bR = new THREE.Mesh(new THREE.ConeGeometry(16, 100, 10), beamMat);
        bR.rotation.x = Math.PI / 2; bR.rotation.z = 0.3; bR.position.set(24, 0.8, -170);
        cp3d.scene.add(bR);

        // Radio Tower with pulsing red beacon
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.8, 40, 6), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
        mast.position.set(-45, 20, -200);
        cp3d.scene.add(mast);
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444, fog: false }));
        beacon.position.set(-45, 40.5, -200);
        cp3d.scene.add(beacon);

        // Render one frame
        renderCockpitVisuals(68, 145, -450, 3.0);
        return { success: true };
      })()
    `,
    returnByValue: true
  });

  console.log('Result:', evalRes);
  await new Promise(r => setTimeout(r, 600));

  const shotRes = await send('Page.captureScreenshot', { format: 'png' });
  if (shotRes.result && shotRes.result.data) {
    const shotPath = path.join(__dirname, 'cockpit_vibrant.png');
    fs.writeFileSync(shotPath, Buffer.from(shotRes.result.data, 'base64'));
    console.log('Saved vibrant screenshot to:', shotPath);
  }

  ws.close();
  chromeProc.kill();
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

main().catch(console.error);
