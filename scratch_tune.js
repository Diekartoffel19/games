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

  // Modify Three.js scene dynamically to test how it looks
  const evalRes = await send('Runtime.evaluate', {
    expression: `
      (function() {
        openCockpitLandingModal('napoles');

        // Tune pState to closer, clearer approach
        pState.z = 520;
        pState.y = 36;
        pState.vz = -32;
        pState.vy = -1.8;
        pState.pitch = -0.01;

        // Tune scene lighting & sky
        const sc = scenarioConfigs[cockpitScenario];
        cp3d.scene.fog = new THREE.Fog(0x1e3a2b, 400, 3500);
        cp3d.scene.background = new THREE.Color(0x0f172a);

        // Find skyMesh (first child)
        const skyMesh = cp3d.scene.children.find(c => c.geometry && c.geometry.type === 'SphereGeometry' && c.geometry.parameters.radius > 4000);
        if (skyMesh) {
          skyMesh.material.fog = false;
        }

        // Disable fog on all lights
        cp3d.scene.traverse(obj => {
          if (obj.material && (obj.geometry.type === 'SphereGeometry' || obj.geometry.type === 'ConeGeometry')) {
            obj.material.fog = false;
          }
        });

        renderCockpitVisuals(62, 120, -350, 3.0);
        return { ok: true };
      })()
    `,
    returnByValue: true
  });

  console.log('Setup result:', evalRes);

  await new Promise(r => setTimeout(r, 500));

  const shotRes = await send('Page.captureScreenshot', { format: 'png' });
  if (shotRes.result && shotRes.result.data) {
    const shotPath = path.join(__dirname, 'cockpit_tuned.png');
    fs.writeFileSync(shotPath, Buffer.from(shotRes.result.data, 'base64'));
    console.log('Saved tuned screenshot to:', shotPath);
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
