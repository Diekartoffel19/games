const { spawn } = require('child_process');
const http = require('http');

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
        renderCockpitVisuals(70, 280, -500, 3.0);

        const cam = cp3d.camera;
        cam.updateMatrixWorld();

        function toScreen(x, y, z) {
          const v = new THREE.Vector3(x, y, z);
          v.project(cam);
          return {
            ndcX: v.x.toFixed(3),
            ndcY: v.y.toFixed(3),
            ndcZ: v.z.toFixed(3),
            screenX: Math.round((v.x * 0.5 + 0.5) * 940),
            screenY: Math.round((-v.y * 0.5 + 0.5) * 420)
          };
        }

        return {
          camPos: [cam.position.x, cam.position.y, cam.position.z],
          camRot: [cam.rotation.x, cam.rotation.y, cam.rotation.z],
          rwyStart: toScreen(0, 0, 0),
          rwyMid: toScreen(0, 0, -600),
          rwyEnd: toScreen(0, 0, -1200),
          papi: toScreen(-20, 1.4, -150),
          strobe1: toScreen(0, 0.8, 50),
          strobe8: toScreen(0, 0.8, 400),
          mountain0: toScreen(3400, 230, 0)
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Projections:', JSON.stringify(evalRes.result.result.value, null, 2));

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
